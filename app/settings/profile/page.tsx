// app/settings/profile/page.tsx

"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useAnimationStore } from "@/app/lib/useAnimationStore";
import { useRouter } from "next/navigation";
import { resolveIpfsUrl, useDebounce } from "@/app/lib/utils";

const ImageIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const TrashIcon = () => (
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
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function ProfileSettingsPage() {
  const {
    profile,
    saveDraft,
    activeAnimation,
    setActiveAnimation,
    extensions,
    addExtension,
    isHydrated,
    logout,
  } = useAnimationStore();

  const router = useRouter();

  // --- State LOKAL untuk form ---
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [github, setGithub] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [readmeFile, setReadmeFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [readmeFileName, setReadmeFileName] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  // Refs
  const isDirty = useRef(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const readmeInputRef = useRef<HTMLInputElement>(null);

  // --- 1. Muat data dari Global ke Lokal saat komponen dimuat ---
  useEffect(() => {
    if (isHydrated && profile && !hasLoaded) {
      setName(profile.name || "");
      setBio(profile.bio || "");
      setGithub(profile.github || "");
      // @ts-ignore
      setProfileImagePreview(
        resolveIpfsUrl(profile.imageUrl) || "/profilgue.png"
      );
      // @ts-ignore
      setReadmeFileName(profile.readmeName || null);

      setHasLoaded(true);
    }
  }, [isHydrated, profile, hasLoaded]);

  // --- Reset form setelah Publish sukses ---
  useEffect(() => {
    if (isHydrated && profile) {
      const currentGlobalImg = resolveIpfsUrl(profile.imageUrl);

      // Jika sistem mendeteksi URL baru (bukan data:...), reset form lokal agar sinkron
      if (profile.imageUrl && !profile.imageUrl.startsWith("data:")) {
        setProfileImagePreview(currentGlobalImg || "/profilgue.png");
        setProfileImageFile(null);
        setName(profile.name || "");
        setBio(profile.bio || "");
        setGithub(profile.github || "");

        // PENTING: Reset dirty state karena ini adalah sinkronisasi sistem, bukan input user
        isDirty.current = false;
      }
    }
  }, [profile, isHydrated]);

  // --- 2. Buat Draf Debounced ---
  const debouncedDraft = useDebounce(
    {
      name,
      bio,
      github,
      imageUrl: profileImageFile
        ? profileImagePreview
        : profile?.imageUrl || null,
      readmeUrl: readmeFile
        ? URL.createObjectURL(readmeFile)
        : profile?.readmeUrl || null,
      readmeName: readmeFileName,
    },
    1000
  );

  // --- 3. Auto-Save ke Global State ---
  useEffect(() => {
    // --- Pengecekan Kritis ---
    // Jangan simpan jika belum loaded atau user belum menyentuh form (isDirty false)
    if (!hasLoaded || !isDirty.current) {
      return;
    }

    saveDraft(debouncedDraft);
  }, [debouncedDraft, saveDraft, hasLoaded]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      isDirty.current = true; 
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
        setProfileImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReadmeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith(".md") || file.type === "text/markdown")) {
      isDirty.current = true; 
      const reader = new FileReader();
      reader.onloadend = () => {
        setReadmeFile(file);
        setReadmeFileName(file.name);
        saveDraft({
          readmeUrl: reader.result as string,
          readmeName: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReadme = () => {
    isDirty.current = true; 
    setReadmeFile(null);
    setReadmeFileName(null);
    saveDraft({ readmeUrl: null, readmeName: null });
    if (readmeInputRef.current) readmeInputRef.current.value = "";
  };

  const handleImport = () => {
    if (repoUrl.trim()) {
      // Import extension tidak mengubah field profil, jadi mungkin tidak perlu isDirty
      // Tapi jika activeAnimation berubah, itu ditangani terpisah
      addExtension(repoUrl.trim());
      setRepoUrl("");
    }
  };

  const handleDisconnect = () => {
    logout();
    router.push("/");
  };

  if (!isHydrated || !hasLoaded) {
    return <div className="text-zinc-500">Loading profile settings...</div>;
  }

  const displayImage = profileImageFile
    ? profileImagePreview
    : resolveIpfsUrl(profile?.imageUrl) || "/profilgue.png";

  return (
    <div className="flex flex-col gap-8">
      {/* Bagian 1: Edit Profil */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-4">
          Public Profile
        </h2>
        <div className="flex items-center gap-4 mb-6">
          <img
            src={displayImage ?? undefined}
            alt="Profile Photo Preview"
            width={80}
            height={80}
            className="rounded-full w-20 h-20 object-cover bg-zinc-100 border"
          />
          <div>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <ImageIcon /> Change Photo
            </button>
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <p className="text-xs text-zinc-500 mt-2">
              PNG, JPG, or GIF. 800x800px recommended.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                isDirty.current = true;
              }}
              placeholder="Your full name"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                isDirty.current = true;
              }}
              placeholder="Tell us about yourself..."
              rows={4}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">
              GitHub Username
            </label>
            <input
              type="text"
              value={github}
              onChange={(e) => {
                setGithub(e.target.value);
                isDirty.current = true;
              }}
              placeholder="e.g. syafiqeil"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">
              README.md
            </label>
            <div className="mt-1 flex items-center gap-3 w-full rounded-md border border-zinc-300 px-3 py-2">
              <span className="flex-1 text-sm text-zinc-700 truncate">
                {readmeFileName ? (
                  readmeFileName
                ) : (
                  <span className="text-zinc-400">No README.md file yet</span>
                )}
              </span>
              {readmeFileName && (
                <button
                  onClick={handleRemoveReadme}
                  className="text-zinc-500 hover:text-red-600 flex-shrink-0"
                  title="Delete file"
                >
                  <TrashIcon />
                </button>
              )}
              <button
                onClick={() => readmeInputRef.current?.click()}
                className="rounded-md bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-200 flex-shrink-0"
              >
                Upload
              </button>
              <input
                type="file"
                ref={readmeInputRef}
                onChange={handleReadmeChange}
                accept=".md,text/markdown"
                className="hidden"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bagian 2: Animasi Bawaan */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Built-in Animations
        </h2>
        <p className="text-sm text-zinc-500 mb-4">
          Choose one of the built-in animations to display on your banner.
        </p>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 p-3 border rounded-md has-[:checked]:bg-zinc-50 has-[:checked]:border-zinc-300 cursor-pointer">
            <input
              type="radio"
              name="animation"
              value="dino"
              checked={activeAnimation === "dino"}
              onChange={(e) => setActiveAnimation(e.target.value)}
            />
            Dino (Error 404)
          </label>
          <label className="flex items-center gap-3 p-3 border rounded-md has-[:checked]:bg-zinc-50 has-[:checked]:border-zinc-300 cursor-pointer">
            <input
              type="radio"
              name="animation"
              value="walker"
              checked={activeAnimation === "walker"}
              onChange={(e) => setActiveAnimation(e.target.value)}
            />
            Walker & Bird
          </label>
          <label className="flex items-center gap-3 p-3 border rounded-md has-[:checked]:bg-zinc-50 has-[:checked]:border-zinc-300 cursor-pointer">
            <input
              type="radio"
              name="animation"
              value="orbs"
              checked={activeAnimation === "orbs"}
              onChange={(e) => setActiveAnimation(e.target.value)}
            />
            Floating Orbs
          </label>
        </div>
      </section>

      {/* Bagian 3: Impor Ekstensi */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Import Extensions (from GitHub)
        </h2>
        <p className="text-sm text-zinc-500 mb-4">
          Paste a GitHub repository URL. (Example: syafiqeil/rain-animation)
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="username/repo-name"
            className="flex-grow rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handleImport}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Import
          </button>
        </div>
      </section>

      {/* Bagian 4: Gunakan Ekstensi */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Installed Extensions
        </h2>
        {extensions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No extensions have been imported yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {extensions.map((ext) => (
              <label
                key={ext.id}
                className="flex items-center justify-between gap-3 p-3 border rounded-md has-[:checked]:bg-zinc-50 has-[:checked]:border-zinc-300 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="animation"
                    value={ext.id}
                    checked={activeAnimation === ext.id}
                    onChange={(e) => setActiveAnimation(e.target.value)}
                  />
                  {ext.name}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Extension removal logic will be added here");
                  }}
                  className="text-zinc-500 hover:text-red-600"
                  title="Delete extension"
                >
                  <TrashIcon />
                </button>
              </label>
            ))}
          </div>
        )}
      </section>

      <hr className="my-4 border-zinc-200" />

      {/* Bagian 5: Disconnect */}
      <section>
        <button
          onClick={handleDisconnect}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Disconnect Wallet
        </button>
      </section>
    </div>
  );
}
