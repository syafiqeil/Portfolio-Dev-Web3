// app/api/user/publish-gasless/route.ts

import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { createWalletClient, http, publicActions, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import UserProfileABI from '@/app/lib/UserProfileABI.json'; 
import { USER_PROFILE_CONTRACT_ADDRESS } from '@/app/lib/SessionProvider'; 

// --- KONFIGURASI ---
// 1. Setup Wallet Server (Relayer)
const account = privateKeyToAccount(process.env.SERVER_PRIVATE_KEY as `0x${string}`);
const client = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http()
}).extend(publicActions);

// 2. Strategi Monetisasi (Markup)
const FLAT_SERVICE_FEE_USD = 0.50; // Kita ambil untung $0.50 per update
const ETH_PRICE_ESTIMATE = 3000;   // Hardcoded sementara (ideally fetch live price)
const FLAT_SERVICE_FEE_ETH = FLAT_SERVICE_FEE_USD / ETH_PRICE_ESTIMATE; 
const GAS_MULTIPLIER = 1.2; // Buffer 20% untuk fluktuasi gas

export async function POST(req: Request) {
  try {
    const { userAddress, newCid } = await req.json();

    // --- A. VALIDASI INPUT (Menjawab Minor Note #3) ---
    // Cek format CID IPFS sederhana (biasanya starts with Qm (v0) atau bafy (v1))
    if (!newCid || typeof newCid !== 'string') {
       return NextResponse.json({ error: "CID tidak valid." }, { status: 400 });
    }
    // Validasi panjang CID (CIDv0 = 46 chars, CIDv1 bisa lebih panjang)
    if (newCid.length < 46 || newCid.length > 100) {
       return NextResponse.json({ error: "Format CID IPFS mencurigakan." }, { status: 400 });
    }

    // --- B. RATE LIMITING & SECURITY CHECK (Menjawab Minor Note #2) ---
    // Kita bisa cek kapan terakhir kali user ini update
    const lastUpdateKey = `last_update_${userAddress.toLowerCase()}`;
    const lastUpdate = await kv.get<number>(lastUpdateKey);
    const now = Date.now();
    
    // Batasi update max 1x per menit (mencegah spam)
    if (lastUpdate && now - lastUpdate < 60000) {
        return NextResponse.json({ 
            error: "Terlalu cepat! Harap tunggu 1 menit sebelum update lagi." 
        }, { status: 429 });
    }

    // --- C. ESTIMASI BIAYA & MARKUP (Monetisasi) ---
    
    // 1. Simulasi Kontrak untuk hitung Gas Unit
    const { request } = await client.simulateContract({
      address: USER_PROFILE_CONTRACT_ADDRESS as `0x${string}`,
      abi: UserProfileABI,
      functionName: 'setProfileCIDFor',
      args: [userAddress, newCid],
      account
    });

    const gasPrice = await client.getGasPrice();
    const gasLimit = request.gas || 0n;

    // Biaya Asli (Real Cost to Blockchain)
    const realCostWei = gasLimit * gasPrice;
    const realCostEth = Number(realCostWei) / 1e18;

    // Biaya Tagihan ke User (Markup)
    // Rumus: (Biaya Gas Asli * 1.2) + Fee Tetap Server
    const chargeToUserEth = (realCostEth * GAS_MULTIPLIER) + FLAT_SERVICE_FEE_ETH;

    console.log(`[x402] Real Cost: ${realCostEth} ETH | Charging User: ${chargeToUserEth} ETH`);

    // --- D. CEK BUDGET (x402 Logic) ---
    const budgetKey = `budget_${userAddress.toLowerCase()}`;
    const currentBudgetStr = await kv.get<string>(budgetKey);
    const currentBudget = currentBudgetStr ? parseFloat(currentBudgetStr) : 0;

    if (currentBudget < chargeToUserEth) {
        return NextResponse.json({ 
            error: `Saldo Budget tidak cukup. Biaya update: ~${chargeToUserEth.toFixed(6)} ETH`,
            cost: chargeToUserEth
        }, { status: 402 });
    }

    // --- E. EKSEKUSI TRANSAKSI (Server Sign) ---
    const hash = await client.writeContract(request);

    // --- F. DATABASE UPDATE ---
    
    // 1. Potong Saldo User
    const newBudget = currentBudget - chargeToUserEth;
    await kv.set(budgetKey, newBudget.toString());

    // 2. Update Timestamp Rate Limiter
    await kv.set(lastUpdateKey, now);

    return NextResponse.json({ 
        success: true, 
        txHash: hash,
        remainingBudget: newBudget,
        message: "Profile updated on-chain!"
    });

  } catch (error: any) {
    console.error("Gasless Publish Error:", error);
    // Handle specific contract revert errors
    if (error.message?.includes("CID cannot be empty")) {
        return NextResponse.json({ error: "Data CID kosong ditolak kontrak." }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal memproses transaksi on-chain." }, { status: 500 });
  }
}