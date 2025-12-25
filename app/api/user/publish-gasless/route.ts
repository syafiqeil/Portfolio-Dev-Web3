// app/api/user/publish-gasless/route.ts

import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, base } from 'viem/chains';
import { getIronSession } from 'iron-session'; // [Security]
import { cookies } from 'next/headers';        // [Security]
import { sessionOptions } from '@/app/lib/session'; // [Security]
// Pastikan Anda sudah memindahkan konstanta ini ke file terpisah seperti saran sebelumnya
// Jika belum, sesuaikan path importnya.
import { USER_PROFILE_CONTRACT_ADDRESS } from '@/app/lib/contracts'; 
import UserProfileABI from '@/app/lib/UserProfileABI.json';

// --- KONFIGURASI ---
const account = privateKeyToAccount(process.env.SERVER_PRIVATE_KEY as `0x${string}`);
// Pilih chain berdasarkan environment
const currentChain = process.env.NODE_ENV === "production" ? base : baseSepolia;

const client = createWalletClient({
  account,
  chain: currentChain,
  transport: http()
}).extend(publicActions);

// Strategi Monetisasi
const FLAT_SERVICE_FEE_USD = 0.50; 
const GAS_MULTIPLIER = 1.2; 

// [Dynamic Price] Helper untuk mengambil harga ETH terkini
async function getEthPriceInUsd(): Promise<number> {
  try {
    // Menggunakan API CoinGecko (Free Tier)
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', 
      { next: { revalidate: 60 } } // Cache harga selama 60 detik
    );
    const data = await res.json();
    const price = data?.ethereum?.usd;
    if (price) return price;
    throw new Error("Price API failed");
  } catch (error) {
    console.warn("Gagal mengambil harga ETH, menggunakan fallback $3000.");
    return 3000; // Fallback aman jika API error
  }
}

export async function POST(req: Request) {
  try {
    // --- 1. [Security Fix] VERIFIKASI SESI ---
    const session = await getIronSession(await cookies(), sessionOptions);
    if (!session.address) {
      return NextResponse.json({ error: "Unauthorized: Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { userAddress, newCid } = await req.json();

    // Validasi: Pastikan yang request adalah pemilik alamat tersebut
    if (userAddress.toLowerCase() !== session.address.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden: Anda tidak bisa mengubah profil orang lain." }, { status: 403 });
    }

    // --- 2. VALIDASI INPUT ---
    if (!newCid || typeof newCid !== 'string') {
       return NextResponse.json({ error: "CID tidak valid." }, { status: 400 });
    }
    if (newCid.length < 46 || newCid.length > 100) {
       return NextResponse.json({ error: "Format CID IPFS mencurigakan." }, { status: 400 });
    }

    // --- 3. RATE LIMITING ---
    const lastUpdateKey = `last_update_${userAddress.toLowerCase()}`;
    const lastUpdate = await kv.get<number>(lastUpdateKey);
    const now = Date.now();
    
    if (lastUpdate && now - lastUpdate < 60000) {
        return NextResponse.json({ 
            error: "Terlalu cepat! Harap tunggu 1 menit sebelum update lagi." 
        }, { status: 429 });
    }

    // --- 4. [Dynamic Price] ESTIMASI BIAYA ---
    
    // Ambil harga ETH live
    const ethPriceUsd = await getEthPriceInUsd();
    const flatServiceFeeEth = FLAT_SERVICE_FEE_USD / ethPriceUsd;

    // Simulasi Kontrak
    const { request } = await client.simulateContract({
      address: USER_PROFILE_CONTRACT_ADDRESS as `0x${string}`,
      abi: UserProfileABI,
      functionName: 'setProfileCIDFor',
      args: [userAddress, newCid],
      account
    });

    const gasPrice = await client.getGasPrice();
    const gasLimit = request.gas || 0n;

    const realCostWei = gasLimit * gasPrice;
    const realCostEth = Number(realCostWei) / 1e18;

    // Total Biaya = (Gas * Multiplier) + Service Fee
    const chargeToUserEth = (realCostEth * GAS_MULTIPLIER) + flatServiceFeeEth;

    console.log(`[x402] ETH Price: $${ethPriceUsd} | Cost: ${chargeToUserEth.toFixed(6)} ETH`);

    // --- 5. CEK BUDGET ---
    const budgetKey = `budget_${userAddress.toLowerCase()}`;
    const currentBudgetStr = await kv.get<string>(budgetKey);
    const currentBudget = currentBudgetStr ? parseFloat(currentBudgetStr) : 0;

    if (currentBudget < chargeToUserEth) {
        return NextResponse.json({ 
            error: `Saldo Budget tidak cukup. Biaya: ~${chargeToUserEth.toFixed(5)} ETH ($${(chargeToUserEth * ethPriceUsd).toFixed(2)})`,
            cost: chargeToUserEth,
            currentBudget
        }, { status: 402 });
    }

    // --- 6. EKSEKUSI & UPDATE DATABASE ---
    const hash = await client.writeContract(request);

    // Potong Saldo & Update Timestamp
    const newBudget = currentBudget - chargeToUserEth;
    await kv.set(budgetKey, newBudget.toString());
    await kv.set(lastUpdateKey, now);

    return NextResponse.json({ 
        success: true, 
        txHash: hash,
        remainingBudget: newBudget,
        message: "Profile updated on-chain!"
    });

  } catch (error: any) {
    console.error("Gasless Publish Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memproses transaksi." }, { status: 500 });
  }
}