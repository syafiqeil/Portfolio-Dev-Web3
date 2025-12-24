// app/api/confirm-budget-deposit/route.ts

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { verifyEvmTransaction } from "@/app/lib/x402-evm";

// Pastikan Anda sudah mengatur alamat dompet penerima di .env.local
// Contoh: RECIPIENT_WALLET_ADDRESS="0x123..."
const RECIPIENT_WALLET = process.env.RECIPIENT_WALLET_ADDRESS;

export async function POST(request: Request) {
  try {
    // 1. Validasi Environment Variable
    if (!RECIPIENT_WALLET) {
      console.error("RECIPIENT_WALLET_ADDRESS not set in .env");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    // 2. Ambil data dari Body Request
    const body = await request.json();
    const { txHash, amount, userAddress } = body;

    if (!txHash || !amount || !userAddress) {
      return NextResponse.json(
        { error: "Missing required fields: txHash, amount, userAddress" },
        { status: 400 }
      );
    }

    // 3. Cek Replay Attack (Apakah hash transaksi ini sudah pernah dipakai?)
    const isTxUsed = await kv.get(`used_tx_${txHash}`);
    if (isTxUsed) {
      return NextResponse.json(
        { error: "This transaction hash has already been processed." },
        { status: 409 } // Conflict
      );
    }

    // 4. Verifikasi Transaksi di Blockchain (On-Chain)
    const verification = await verifyEvmTransaction(
      txHash,
      parseFloat(amount), // Konversi string ke number
      RECIPIENT_WALLET
    );

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error },
        { status: 400 }
      );
    }

    // --- JIKA SAMPAI SINI, BERARTI VALID ---

    // 5. Update Saldo User di KV
    const budgetKey = `budget_${userAddress.toLowerCase()}`;
    const currentBudgetStr = (await kv.get<string>(budgetKey)) || "0";
    
    // Tambahkan saldo lama + saldo baru
    const newBudget = parseFloat(currentBudgetStr) + parseFloat(verification.amount!);

    // Simpan saldo baru
    await kv.set(budgetKey, newBudget.toString());

    // 6. Tandai TX Hash sebagai sudah terpakai (cegah double claim)
    // Kita set expire 30 hari (opsional) atau permanen agar aman
    await kv.set(`used_tx_${txHash}`, "true", { ex: 2592000 }); 

    console.log(`[Deposit Success] User: ${userAddress}, Added: ${verification.amount}, New Balance: ${newBudget}`);

    return NextResponse.json({ 
      ok: true, 
      newBudget: newBudget 
    });

  } catch (error: any) {
    console.error("Error processing deposit:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}