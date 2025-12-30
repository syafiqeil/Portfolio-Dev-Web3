// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* * Header keamanan untuk COOP/COEP dihapus karena kita menggunakan Direct Upload
   * dan perlu memuat resource (Video) dari domain eksternal (Pinata Gateway).
   */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      // Tambahkan domain gateway dedicated jika Anda punya (misal: my-gateway.mypinata.cloud)
      {
        protocol: 'https',
        hostname: '*.mypinata.cloud', 
      }
    ],
  },
};

export default nextConfig;