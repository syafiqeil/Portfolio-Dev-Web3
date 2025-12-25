// app/api/confirm-budget-deposit/route.ts

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { verifyEvmTransaction } from "@/app/lib/x402-evm";

const RECIPIENT_WALLET = process.env.RECIPIENT_WALLET_ADDRESS;

export async function POST(request: Request) {
  try {
    if (!RECIPIENT_WALLET) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const body = await request.json();
    const { txHash, amount, userAddress } = body;

    if (!txHash || !amount || !userAddress) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // --- [Race Condition Fix] ATOMIC LOCK ---
    // Kita mencoba set key 'used_tx_HASH' menjadi 'pending'.
    // Opsi { nx: true } berarti "Hanya set jika key BELUM ada".
    // Return valuenya 'OK' jika berhasil, atau null jika key sudah ada.
    const lockAcquired = await kv.set(`used_tx_${txHash}`, "pending", { nx: true, ex: 3600 }); // Lock 1 jam

    if (!lockAcquired) {
      // Jika null, berarti hash ini sudah pernah diproses atau sedang diproses request lain
      return NextResponse.json(
        { error: "Transaksi ini sudah diproses atau sedang diverifikasi." },
        { status: 409 }
      );
    }

    // --- Verifikasi On-Chain ---
    // Sekarang aman melakukan proses berat karena hash sudah dilock
    const verification = await verifyEvmTransaction(
      txHash,
      parseFloat(amount),
      RECIPIENT_WALLET
    );

    if (!verification.success) {
      // Jika gagal verifikasi, kita hapus lock agar user bisa retry (opsional)
      // Atau biarkan saja agar hash gagal tidak dispam. 
      // Di sini saya memilih menghapus lock agar user bisa memperbaiki input jika salah.
      await kv.del(`used_tx_${txHash}`);
      
      return NextResponse.json({ error: verification.error }, { status: 400 });
    }

    // --- Update Saldo ---
    const budgetKey = `budget_${userAddress.toLowerCase()}`;
    const currentBudgetStr = (await kv.get<string>(budgetKey)) || "0";
    const newBudget = parseFloat(currentBudgetStr) + parseFloat(verification.amount!);

    await kv.set(budgetKey, newBudget.toString());

    // Update status lock menjadi 'success' permanen (30 hari)
    await kv.set(`used_tx_${txHash}`, "success", { xx: true, ex: 2592000 }); 

    console.log(`[Deposit Success] User: ${userAddress}, New Balance: ${newBudget}`);

    return NextResponse.json({ ok: true, newBudget: newBudget });

  } catch (error: any) {
    // Jika server crash di tengah jalan, lock 'pending' akan expire dalam 1 jam (fail-safe)
    console.error("Deposit Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}