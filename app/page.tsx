// app/page.tsx

"use client";

import ProfileCard from "./components/ProfileCard";
import ProjectCard from "./components/ProjectCard";
import ActivityCard from "./components/ActivityCard";
import { useAnimationStore } from "./lib/useAnimationStore";
import Link from "next/link";

export default function Home() {
  // Ambil state global
  const { profile, isAuthenticated, isLoading } = useAnimationStore();

  if (isLoading) {
    return (
      <main className="flex min-h-screen w-full flex-col bg-black p-4 pt-8 md:p-8 items-center justify-center">
        <div className="text-white">Loading your session...</div>
      </main>
    );
  }

  // Jika terhubung, tapi belum mendaftar
  if (isAuthenticated && !profile) {
    return (
      <main className="flex min-h-screen w-full flex-col bg-black p-4 pt-8 md:p-8 items-center justify-center text-center">
        <div className="text-white text-2xl font-bold mb-4">Welcome!</div>
        <p className="text-zinc-400 mb-6">
          Your profile is not set up yet. Please go to the settings page.
        </p>
        <Link
          href="/settings/profile"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
        >
          Open Settings
        </Link>
      </main>
    );
  }

  // Jika sudah login dan punya profil (atau jika belum login)
  return (
    <main className="flex min-h-screen w-full flex-col bg-black p-4 pt-3 md:p-4 md:h-screen md:max-h-screen md:overflow-hidden">
      <div className="grid w-full h-auto md:h-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-rows-[45fr_55fr]">
        <ProfileCard profile={profile} />
        <ProjectCard />
        <ActivityCard />
      </div>
    </main>
  );
}
