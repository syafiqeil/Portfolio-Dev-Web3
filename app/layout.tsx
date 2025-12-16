// app/layout.tsx

import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google"; 
import "./globals.css";
import { Web3Provider } from "./providers";
import { SessionProvider } from "./lib/SessionProvider"; 

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk", 
  weight: ["300", "400", "500", "600", "700"], 
});

export const metadata: Metadata = {
  title: "Ethernet Developer",
  description: "The Home for Developer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} antialiased font-sans`} 
      >
        <Web3Provider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </Web3Provider>
      </body>
    </html>
  );
}