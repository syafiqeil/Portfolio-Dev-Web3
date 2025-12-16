// app/providers.tsx

"use client"; 

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider, Config } from "wagmi"; 
import { base, baseSepolia } from "wagmi/chains"; 
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useState, useEffect, ReactNode } from 'react';

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  
  // 1. lazy initialization
  // Fungsi di dalam useState() dijamin hanya berjalan di klien.
  const [client] = useState(() => new QueryClient());
  const [config] = useState(() => getDefaultConfig({
    appName: "Syafiq's Dashboard dApp",
    projectId: "3c6f8194ad518fc56054b0107d9fbfa9", 
    chains: [base, baseSepolia],
    ssr: false, 
  }));

  // 2. Guard untuk Mencegah Hydration Mismatch
  // Ini memastikan tidak me-render apapun di server,
  // dan hanya me-render di klien setelah 'mounted'.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []); 

  // Jika belum di-mount di klien, jangan render provider-nya
  if (!isMounted) {
    return null;
  }
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};