// app/lib/x402-evm.ts

import { kv } from "@vercel/kv";
import { createPublicClient, http, parseEther, formatEther } from "viem";
import { base, baseSepolia } from "viem/chains";

// 1. Konfigurasi Client Viem (Untuk membaca data blockchain)
// Kita gunakan Base Sepolia untuk development, Base Mainnet untuk production
const chain = process.env.NODE_ENV === "production" ? base : baseSepolia;

const publicClient = createPublicClient({
  chain: chain,
  transport: http(),
});

/**
 * Verifikasi Transaksi EVM (Native ETH Payment)
 * Mengecek apakah sebuah hash transaksi valid, sukses, dan mengirim jumlah yang benar ke tujuan.
 */
export async function verifyEvmTransaction(
  txHash: string,
  expectedAmountVal: number, // Contoh: 0.001 (ETH)
  recipientAddress: string
) {
  try {
    // A. Ambil detail transaksi dari blockchain
    const transaction = await publicClient.getTransaction({
      hash: txHash as `0x${string}`,
    });

    // B. Ambil struk transaksi untuk memastikan status "Success"
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    if (receipt.status !== "success") {
      return { success: false, error: "Transaction failed on-chain." };
    }

    // C. Verifikasi Penerima (Case insensitive)
    if (transaction.to?.toLowerCase() !== recipientAddress.toLowerCase()) {
      return {
        success: false,
        error: `Wrong recipient. Expected ${recipientAddress}, got ${transaction.to}`,
      };
    }

    // D. Verifikasi Jumlah (Value)
    const valueInWei = transaction.value;
    const expectedWei = parseEther(expectedAmountVal.toString());

    // Kita izinkan selisih sangat kecil (toleransi) atau harus presisi
    if (valueInWei < expectedWei) {
      return {
        success: false,
        error: `Insufficient amount. Sent ${formatEther(valueInWei)} ETH, expected ${expectedAmountVal} ETH`,
      };
    }

    return {
      success: true,
      sender: transaction.from,
      amount: formatEther(valueInWei),
    };
  } catch (error: any) {
    console.error("verifyEvmTransaction Error:", error);
    return { success: false, error: error.message || "Verification failed" };
  }
}

/**
 * Middleware Logic: Cek & Potong Budget
 * Fungsi ini menggantikan middleware 'budgetPaywall' di Express.
 */
export async function processBudgetPayment(
  userAddress: string,
  cost: number // Contoh: 0.005 (ETH)
): Promise<{ allowed: boolean; remainingBudget?: number; error?: string }> {
  const budgetKey = `budget_${userAddress.toLowerCase()}`;

  try {
    // 1. Ambil budget saat ini (disimpan sebagai string angka float di KV)
    const currentBudgetStr = (await kv.get<string>(budgetKey)) || "0";
    const currentBudget = parseFloat(currentBudgetStr);

    // 2. Cek kecukupan
    if (currentBudget >= cost) {
      // 3. Potong budget
      const newBudget = currentBudget - cost;
      
      // Simpan saldo baru
      await kv.set(budgetKey, newBudget.toString());

      return { allowed: true, remainingBudget: newBudget };
    } else {
      return { 
        allowed: false, 
        error: "Insufficient budget", 
        remainingBudget: currentBudget 
      };
    }
  } catch (error) {
    console.error("processBudgetPayment Error:", error);
    return { allowed: false, error: "Database error" };
  }
}