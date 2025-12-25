// app/settings/profile/page.tsx

"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useAnimationStore } from "@/app/lib/useAnimationStore";
import { useRouter } from "next/navigation";
import { resolveIpfsUrl, useDebounce } from "@/app/lib/utils";
import { useAccount } from "wagmi";
import Link from "next/link";

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
const FileTextIcon = () => (
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
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
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

  const { address } = useAccount();
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

  const isInitialLoadDone = useRef(false);

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

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });

  const handleGaslessPublish = async () => {
    if (!address) {
      alert("Mohon hubungkan wallet Anda terlebih dahulu.");
      return;
    }

    setIsPublishing(true);
    setPublishStatus({ type: null, msg: '' });

    try {
      // 1. Siapkan Data Profil
      const profileData = {
        name,
        bio,
        updatedAt: new Date().toISOString(),
        // Tambahkan field lain yang relevan
      };

      // 2. Upload JSON ke IPFS (Melalui API kita)
      // Pastikan Anda memiliki route app/api/upload-json/route.ts
      const uploadRes = await fetch("/api/upload-json", {
        method: "POST",
        body: JSON.stringify(profileData),
      });

      if (!uploadRes.ok) throw new Error("Gagal mengupload data ke IPFS");

      const responseData = await uploadRes.json();
      
      // Ambil "ipfsHash" sesuai output dari file route.ts, bukan "cid"
      const cid = responseData.ipfsHash; 

      if (!cid) {
          console.error("Respon Server:", responseData); // Untuk debugging jika masih error
          throw new Error("Gagal mendapatkan CID dari server.");
      }
      
      console.log("IPFS Upload Success, CID:", cid);

      // 3. Panggil API Gasless (Relayer)
      const publishRes = await fetch("/api/user/publish-gasless", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          newCid: cid // Sekarang variabel ini sudah berisi string hash yang benar
        }),
      });

      const result = await publishRes.json();

      // 4. Handle Response
      if (publishRes.status === 402) {
        // KHUSUS: Saldo Kurang
        setPublishStatus({ 
          type: 'error', 
          msg: `Saldo Budget Tidak Cukup! Dibutuhkan sekitar ${result.cost?.toFixed(5)} ETH.` 
        });
      } else if (!publishRes.ok) {
        throw new Error(result.error || "Gagal melakukan update on-chain.");
      } else {
        // SUKSES
        setPublishStatus({ 
          type: 'success', 
          msg: `Sukses! Profil terupdate di Blockchain. Saldo sisa: ${result.remainingBudget.toFixed(5)} ETH` 
        });
        
        // Opsional: Simpan draft lokal juga agar sinkron
        saveDraft({ name, bio });
      }

    } catch (error: any) {
      console.error(error);
      setPublishStatus({ type: 'error', msg: error.message || "Terjadi kesalahan sistem." });
    } finally {
      setIsPublishing(false);
    }
  };

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
    // Jangan simpan jika belum loaded ATAU user belum menyentuh form (isDirty false)
    if (!hasLoaded || !isDirty.current) {
      return;
    }

    saveDraft(debouncedDraft);
  }, [debouncedDraft, saveDraft, hasLoaded]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      isDirty.current = true; // [MARK DIRTY]
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
      isDirty.current = true; // [MARK DIRTY]
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
    isDirty.current = true; // [MARK DIRTY]
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

      <div className="mt-8 pt-6 border-t border-zinc-100">
        <div className="flex flex-col gap-4">
          
          {/* Status Message Area */}
          {publishStatus.msg && (
            <div className={`p-4 rounded-lg text-sm border ${
              publishStatus.type === 'error' 
                ? 'bg-red-50 border-red-100 text-red-700' 
                : 'bg-green-50 border-green-100 text-green-700'
            }`}>
              <div className="flex items-center justify-between">
                <span>{publishStatus.msg}</span>
                {/* Jika Error Saldo (402), Munculkan Link Deposit */}
                {publishStatus.msg.includes("Saldo Budget") && (
                  <Link href="/settings/activity" className="underline font-bold hover:text-red-900">
                    Top Up Sekarang &rarr;
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-zinc-900">On-Chain Sync</span>
              <span className="text-xs text-zinc-500">
                Simpan permanen ke Blockchain. Biaya diambil dari Budget x402.
              </span>
            </div>

            <button
              onClick={handleGaslessPublish}
              disabled={isPublishing || !address}
              className={`
                relative overflow-hidden rounded-lg px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all
                ${isPublishing ? 'bg-zinc-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'}
              `}
            >
              {isPublishing ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Publish Gasless</span>
                  {/* Badge Petir */}
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                    ⚡
                  </span>
                </div>
              )}
            </button>
          </div>
          
          <p className="text-[10px] text-zinc-400 text-right">
            Estimasi biaya: ~$0.01 - $0.03 (tergantung gas)
          </p>
        </div>
      </div>

      <hr className="my-4 border-zinc-200" />

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
