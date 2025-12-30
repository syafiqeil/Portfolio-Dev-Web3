// app/settings/layout.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useAnimationStore } from "@/app/lib/useAnimationStore";

const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm font-medium ${
        isActive
          ? "bg-zinc-100 text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
    >
      {children}
    </Link>
  );
};

// --- Komponen Indikator Status ---
const PublishStatus = () => {
  const { 
    isPublishing, 
    hasUnpublishedChanges, 
    isHydrated,
    uploadProgress,
  } = useAnimationStore();

  // 1. Prioritas Tertinggi: Sedang Upload File Tertentu
  if (uploadProgress) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600 animate-pulse font-medium">
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {uploadProgress}
      </div>
    );
  }

  // 2. Status Publishing General (Smart Contract / DB)
  if (isPublishing) {
    return <span className="text-sm text-yellow-600 font-medium">Finalizing Transaction...</span>;
  }

  if (hasUnpublishedChanges) {
    return (
      <span className="text-sm text-zinc-500 italic">
        Unsaved changes on-chain.
      </span>
    );
  }

  if (isHydrated) {
    return <span className="text-sm text-green-600 font-medium flex items-center gap-1">✔ Synced On-Chain</span>;
  }

  return <span className="text-sm text-zinc-400">Loading...</span>;
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isPublishing, publishChangesToOnChain, hasUnpublishedChanges } =
    useAnimationStore();

  const handlePublish = async () => {
    if (
      window.confirm(
        "Are you sure you want to publish all changes on-chain? This will require a transaction (gas fee)."
      )
    ) {
      await publishChangesToOnChain();
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col bg-neutral-100 p-4 pt-4 md:p-4">
      <div className="mb-4 max-w-5xl mx-auto w-full">
        <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="max-w-5xl mx-auto w-full rounded-md bg-white shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Dashboard Settings
          </h1>

          <div className="flex items-center gap-4">
            <PublishStatus />
            <button
              onClick={handlePublish}
              disabled={isPublishing || !hasUnpublishedChanges} // <-- Nonaktif jika SINKRON
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:bg-green-400"
            >
              {isPublishing ? "Publishing..." : "Publish to On-Chain"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="md:col-span-1">
            <nav className="flex flex-col gap-1">
              <NavLink href="/settings/profile">Public Profile</NavLink>
              <NavLink href="/settings/projects">Projects</NavLink>
              <NavLink href="/settings/activity">Activity</NavLink>
            </nav>
          </aside>

          <div className="md:col-span-3">{children}</div>
        </div>
      </div>
    </main>
  );
}
