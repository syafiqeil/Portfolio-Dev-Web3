// app/lib/utils.ts

import { useState, useEffect } from 'react';

const IPFS_GATEWAY = 'https://gateway.pinata.cloud';

export const resolveIpfsUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '');
    // Arahkan ke gateway Pinata
    return `${IPFS_GATEWAY}/ipfs/${cid}`;
  }
  
  // Tetap dukung blob URL untuk preview
  if (url.startsWith('blob:') || url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }
  
  return null;
};

// --- HOOK UNTUK AUTO-SAVE ---
/**
 * Hook kustom untuk menunda (debounce) sebuah nilai.
 * Sangat berguna untuk auto-save.
 * @param value Nilai yang ingin ditunda (misal: 'profile.name')
 * @param delay Waktu tunda dalam milidetik (misal: 1000)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Atur timer untuk memperbarui nilai setelah 'delay'
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Bersihkan timer jika 'value' atau 'delay' berubah
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}