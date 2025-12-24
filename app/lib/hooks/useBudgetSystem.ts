// app/lib/hooks/useBudgetSystem.ts

import { useState } from "react";
import { useAccount, useSendTransaction, usePublicClient } from "wagmi";
import { parseEther } from "viem";

export const useBudgetSystem = () => {
  const { address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ambil alamat dari Environment Variable
  const recipientWallet = process.env.NEXT_PUBLIC_RECIPIENT_WALLET_ADDRESS as `0x${string}`;

  const depositBudget = async (amountStr: string) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      if (!address || !publicClient) {
        throw new Error("Mohon hubungkan wallet Anda terlebih dahulu.");
      }

      if (!recipientWallet) {
        throw new Error("Konfigurasi Error: Alamat penerima belum diatur di .env.");
      }

      // 1. Kirim Transaksi
      const hash = await sendTransactionAsync({
        to: recipientWallet,
        value: parseEther(amountStr),
      });

      // 2. Tunggu Transaksi
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status !== "success") {
        throw new Error("Transaksi gagal di blockchain (Reverted).");
      }

      // 3. Verifikasi Backend
      const response = await fetch("/api/confirm-budget-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: hash,
          amount: amountStr,
          userAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengupdate saldo di server.");
      }

      setIsSuccess(true);
      alert(`Berhasil! Saldo baru Anda: ${data.newBudget} ETH`);
      
    } catch (err: any) {
      console.error("Deposit Error:", err);
      
      // --- LOGIKA PARSING ERROR BARU ---
      let friendlyMessage = "Terjadi kesalahan yang tidak diketahui.";
      const rawMsg = err.message || "";

      if (rawMsg.includes("User rejected") || rawMsg.includes("User denied")) {
        friendlyMessage = "Transaksi dibatalkan oleh pengguna.";
      } 
      else if (rawMsg.includes("insufficient funds") || rawMsg.includes("exceeds the balance")) {
        // Ini menangani error gas yang Anda alami
        friendlyMessage = "Saldo ETH tidak cukup untuk membayar Deposit + Gas Fee.";
      } 
      else if (rawMsg.includes("connector not found")) {
        friendlyMessage = "Koneksi wallet terputus. Silakan refresh halaman.";
      }
      else {
        // Ambil pesan error pendek jika ada
        friendlyMessage = err.shortMessage || rawMsg;
      }

      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    depositBudget,
    isLoading,
    isSuccess,
    error,
  };
};