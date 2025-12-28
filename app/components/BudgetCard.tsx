// app/components/BudgetCard.tsx

"use client";

import { useState, useEffect } from "react";
import { useBudgetSystem } from "@/app/lib/hooks/useBudgetSystem";
import { useAccount } from "wagmi";

// Ikon Helper
const WalletIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
    <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 2v6h-6"></path>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
    <path d="M3 22v-6h6"></path>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
  </svg>
);

const UsdIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

export default function BudgetCard() {
  const { isConnected } = useAccount();
  const { depositBudget, isLoading: isDepositing, error } = useBudgetSystem();

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // State Baru: Input dalam USD
  const [usdAmount, setUsdAmount] = useState("5"); // Default $5
  const [ethPrice, setEthPrice] = useState<number | null>(null);

  // 1. Ambil Harga ETH (ETH/USD) saat komponen dimuat
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        // Menggunakan API Publik Coinbase (Gratis & Stabil)
        const res = await fetch(
          "https://api.coinbase.com/v2/prices/ETH-USD/spot"
        );
        const data = await res.json();
        setEthPrice(parseFloat(data.data.amount));
      } catch (error) {
        console.error("Gagal mengambil harga ETH:", error);
        setEthPrice(3000); // Fallback harga hardcoded jika API gagal
      }
    };

    fetchEthPrice();
  }, []);

  // 2. Kalkulasi Otomatis: USD -> ETH
  // Jika harga ETH belum load, kita anggap 0 dulu
  const estimatedEth =
    ethPrice && usdAmount
      ? (parseFloat(usdAmount) / ethPrice).toFixed(6)
      : "0.000000";

  // Fungsi fetch saldo user (API Backend kita)
  const fetchBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const res = await fetch("/api/user/budget");
      if (res.ok) {
        const data = await res.json();
        setBalance(data.budget);
      }
    } catch (e) {
      console.error("Failed to fetch balance", e);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchBalance();
    }
  }, [isConnected]);

  const handleDeposit = async () => {
    if (!usdAmount || isNaN(Number(usdAmount)) || Number(usdAmount) <= 0) {
      alert("Masukkan jumlah Dollar yang valid.");
      return;
    }

    try {
      // PENTING: Kita kirim nilai ETH hasil konversi ke hook
      await depositBudget(estimatedEth);

      // Refresh saldo setelah sukses
      await fetchBalance();
      setUsdAmount("");
    } catch (e) {
      // Error sudah ditangani hook
    }
  };

  if (!isConnected) return null;

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-zinc-100 rounded-md text-zinc-600">
          <WalletIcon />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Protocol Budget (USD)
          </h2>
          <p className="text-xs text-zinc-500">
            Deposit budget in USD value (paid in ETH) for instant AI access.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Kolom Kiri: Info Saldo (Tetap dalam ETH karena di DB kita simpan ETH) */}
        <div className="flex flex-col justify-center p-4 bg-zinc-50 rounded-md border border-zinc-100">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
            Current Balance
          </span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-zinc-900">
              {balance !== null ? balance.toFixed(5) : "..."}
            </span>
            <span className="text-sm font-medium text-zinc-500 mb-1">ETH</span>
          </div>
          {/* Tampilkan estimasi saldo dalam USD */}
          {balance !== null && ethPrice && (
            <p className="text-xs text-zinc-400 mt-1">
              ≈ ${(balance * ethPrice).toFixed(2)} USD
            </p>
          )}
          <button
            onClick={fetchBalance}
            disabled={isLoadingBalance}
            className="mt-3 text-xs flex items-center gap-1 text-sky-600 hover:text-sky-700"
          >
            <RefreshIcon /> Refresh Balance
          </button>
        </div>

        {/* Kolom Kanan: Form Deposit (USD) */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-zinc-700">
            Top-up Amount (USD)
          </label>

          {/* Input Wrapper */}
          <div className="relative">
            <div className="absolute left-3 top-2 text-zinc-500 font-semibold">
              $
            </div>
            <input
              type="number"
              step="1"
              value={usdAmount}
              onChange={(e) => setUsdAmount(e.target.value)}
              placeholder="5"
              className="w-full rounded-md border border-zinc-300 pl-7 pr-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all font-medium"
            />
          </div>

          {/* Konversi Live Display */}
          <div className="flex justify-between items-center text-xs px-1">
            <span className="text-zinc-400">
              Price: 1 ETH ≈ ${ethPrice ? ethPrice.toFixed(0) : "..."}
            </span>
            <span className="text-zinc-700 font-medium bg-zinc-100 px-2 py-0.5 rounded">
              You pay: ≈ {estimatedEth} ETH
            </span>
          </div>

          <button
            onClick={handleDeposit}
            disabled={isDepositing || !ethPrice}
            className="w-full mt-1 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDepositing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              `Deposit $${usdAmount || 0}`
            )}
          </button>

          {/* Error Message Area */}
          {error && (
            <div className="mt-1 p-2 bg-red-50 border border-red-100 rounded text-[11px] text-red-600 leading-tight">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
