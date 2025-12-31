// app/componentsProfileCard.tsx

"use client";

import Link from "next/link";
import { useState } from "react";
import { useAnimationStore, Profile } from "../lib/SessionProvider";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { resolveIpfsUrl } from "../lib/utils";
import { ReadmeModal } from "./ReadmeModal";

// --- Komponen Ikon ---
const GithubIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 19c-4.3 1.4 -4.3-2.5 -6-3m12 5v-3.5c0-1 .1-1.4 -.5-2c2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0 -1.3-3.2a4.2 4.2 0 0 0 -.1-3.2s-1.1-.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4-1.6 -3.5-1.3 -3.5-1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6.5 -.6 1.4 -.6 2v3.5" />
  </svg>
);

const FileIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

/** Animasi 1: Dino Run */
const DinoAnimation = () => (
  <div className="relative w-full h-full text-white">
    <div className="absolute bottom-4 left-0 w-full h-px bg-white/50" />
    <div
      className="absolute bottom-4 left-8 w-5 h-5 bg-white"
      style={{ animation: "dino-jump 1s infinite" }}
    />
    <div
      className="absolute bottom-4 left-0 w-2 h-4 bg-white"
      style={{ animation: "cactus-move 2s infinite linear" }}
    />
    <div
      className="absolute bottom-4 left-0 w-3 h-6 bg-white"
      style={{
        animation: "cactus-move 2s infinite linear",
        animationDelay: "-1s",
      }}
    />
  </div>
);

/** Animasi 2: Walker & Bird */
const WalkerBirdAnimation = () => (
  <div className="relative w-full h-full text-white">
    <div
      className="absolute top-1/2 left-1/4 w-3 h-3 bg-yellow-300"
      style={{ animation: "bird-flap 0.5s infinite alternate" }}
    />
    <div
      className="absolute bottom-4 left-0 w-4 h-6 bg-sky-400"
      style={{ animation: "walker-walk 4s infinite alternate ease-in-out" }}
    />
  </div>
);

const OrbsAnimation = () => (
  <div className="relative w-full h-full">
    {/* Orbs */}
    <div
      className="absolute rounded-full bg-white/20"
      style={{
        width: 30,
        height: 30,
        left: "10%",
        animation: "orb-float 6s infinite alternate",
      }}
    />
    <div
      className="absolute rounded-full bg-white/20"
      style={{
        width: 15,
        height: 15,
        left: "30%",
        animation: "orb-float 8s infinite alternate",
        animationDelay: "-2s",
      }}
    />
    <div
      className="absolute rounded-full bg-white/20"
      style={{
        width: 40,
        height: 40,
        left: "60%",
        animation: "orb-float 7s infinite alternate",
        animationDelay: "-4s",
      }}
    />
    <div
      className="absolute rounded-full bg-white/20"
      style={{
        width: 20,
        height: 20,
        left: "80%",
        animation: "orb-float 5s infinite alternate",
        animationDelay: "-1s",
      }}
    />
  </div>
);

const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-white/70 hover:text-white"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 0-2l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ProfileCard = ({ profile }: { profile: Profile | null }) => {
  const [isReadmeModalOpen, setIsReadmeModalOpen] = useState(false);
  // Ambil state sesi, bukan state animasi
  const { activeAnimation, isAuthenticated, isLoading, login } =
    useAnimationStore();

  const { isConnected } = useAccount();

  const renderAnimation = () => {
    switch (activeAnimation) {
      case "dino":
        return <DinoAnimation />;
      case "walker":
        return <WalkerBirdAnimation />;
      case "orbs":
        return <OrbsAnimation />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-white/50">
            <p>Extension: {activeAnimation}</p>
          </div>
        );
    }
  };

  const renderAuthButton = () => {
    if (isLoading) {
      return (
        <button
          disabled
          className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white transition-all"
        >
          Loading...
        </button>
      );
    }

    if (!isConnected) {
      // 1. Belum konek wallet (Tampilkan ConnectButton)
      return (
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => (
            <button
              onClick={openConnectModal}
              disabled={!mounted}
              className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white transition-all hover:bg-white/40"
            >
              Connect
            </button>
          )}
        </ConnectButton.Custom>
      );
    }

    if (!isAuthenticated) {
      // 2. Sudah konek, tapi belum login (Tampilkan tombol Login (SIWE))
      return (
        <button
          onClick={login}
          className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white transition-all hover:bg-white/40"
        >
          Login (Sign)
        </button>
      );
    }

    // 3. Sudah konek dan sudah login (Tampilkan Settings)
    return (
      <Link
        href="/settings/profile"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-all hover:bg-white/40"
        aria-label="Animation Settings"
      >
        <SettingsIcon />
      </Link>
    );
  };

  const displayImageUrl = resolveIpfsUrl(profile?.imageUrl) || "/profile.jpeg";

  const githubUrl = profile?.github
    ? `https://github.com/${profile.github}`
    : "#";

  const readmeIpfsUrl = profile?.readmeUrl;
  const hasReadme = !!readmeIpfsUrl;
  const readmeName = profile?.readmeName || "Readme.md";

  return (
    <>
      {isReadmeModalOpen && (
        <ReadmeModal
          readmeUrl={readmeIpfsUrl}
          onClose={() => setIsReadmeModalOpen(false)}
        />
      )}

      <style>{`
        @keyframes dino-jump {
          0% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
          100% { transform: translateY(0); }
        }
        @keyframes cactus-move {
          0% { transform: translateX(300px); }
          100% { transform: translateX(-20px); }
        }
        @keyframes bird-flap {
          0% { transform: translateY(-10px); }
          100% { transform: translateY(10px); }
        }
        @keyframes walker-walk {
          0% { transform: translateX(20px); }
          100% { transform: translateX(250px); }
        }
        @keyframes orb-float {
          0% { transform: translateY(0); opacity: 0.5; }
          100% { transform: translateY(20px); opacity: 1; }
        }
      `}</style>

      <div className="relative flex flex-col overflow-hidden rounded-md bg-white shadow-sm md:row-span-1 md:col-span-1">
        <div className="relative h-40 w-full md:h-48 overflow-hidden bg-zinc-900">
          <div className="relative h-full w-full max-w-2xl mx-auto">
            {renderAnimation()}
          </div>

          <div className="absolute top-2 right-2 z-10">
            {renderAuthButton()}
          </div>
        </div>

        {/* Konten Utama Profil */}
        <div className="flex flex-1 flex-col p-4 md:p-6 pt-0">
          <img
            className="relative -mt-12 mb-4 h-24 w-24 rounded-full object-cover"
            src={displayImageUrl}
            alt="//www.flaticon.com/authors/luch-phou"
            width={96}
            height={96}
          />

          <div className="mb-6 flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {/* Gunakan 'name' dari profil, atau default jika belum login */}
              {profile
                ? profile.name
                : isAuthenticated
                ? "New User"
                : "Welcome"}
            </h1>
            <p className="text-base leading-relaxed text-zinc-600">
              {/* Gunakan 'bio' dari profil, atau default jika belum login */}
              {profile
                ? profile.bio
                : "Please connect and log in to view or update your profile."}
            </p>
          </div>

          <div className="flex-grow" />

          <div className="flex flex-row gap-3">
            <a
              className={`flex h-10 w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 ${
                !profile?.github ? "pointer-events-none opacity-50" : ""
              }`}
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubIcon />
              {profile?.github ? "My Github" : "GitHub Not Set"}
            </a>
            <button
              type="button"
              onClick={() => setIsReadmeModalOpen(true)}
              disabled={!hasReadme}
              className={`flex h-10 w-full items-center justify-center gap-2 rounded-md border border-solid border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors ${
                !hasReadme
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-zinc-50"
              }`}
            >
              <FileIcon />
              {hasReadme ? readmeName : "Readme.md"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileCard;
