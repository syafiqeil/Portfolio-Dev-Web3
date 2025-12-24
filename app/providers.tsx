// app/providers.tsx

"use client"; 

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider, Config } from "wagmi"; 
import { base, baseSepolia } from "wagmi/chains"; 
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useState, useEffect, ReactNode } from 'react';

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [client] = useState(() => new QueryClient());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Inisialisasi config hanya jika di sisi client
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    const _config = getDefaultConfig({
        appName: "Syafiq's Dashboard dApp",
        projectId: "3c6f8194ad518fc56054b0107d9fbfa9", 
        chains: [base, baseSepolia],
        ssr: false, 
    });
    setConfig(_config);
  }, []);

  // Jangan render apapun sampai mounted DAN config siap
  if (!isMounted || !config) {
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