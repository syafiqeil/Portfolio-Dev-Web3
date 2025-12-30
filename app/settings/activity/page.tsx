// app/settings/activity/page.tsx
"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import {
  useAnimationStore,
  BlogPost,
  Certificate,
  SocialLink,
} from "@/app/lib/SessionProvider";
import { useDebounce, resolveIpfsUrl } from "@/app/lib/utils";
import BudgetCard from "@/app/components/BudgetCard";

// --- ICONS ---
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const LoaderIcon = () => (
  <svg className="animate-spin h-5 w-5 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
const MessageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export default function ActivitySettingsPage() {
  const { profile, saveDraft, isHydrated, uploadFileToApi } = useAnimationStore();
  const [hasLoaded, setHasLoaded] = useState(false);

  // State Lokal
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [email, setEmail] = useState("");
  const [connectMsg, setConnectMsg] = useState("");

  // State Uploading
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Refs untuk input file (hidden)
  const blogImageRef = useRef<HTMLInputElement>(null);
  const certImageRef = useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

  // --- Load Data ---
  useEffect(() => {
    if (isHydrated && profile && !hasLoaded) {
      setBlogPosts(profile.activity?.blogPosts || []);
      setCertificates(profile.activity?.certificates || []);
      setSocialLinks(profile.activity?.socialLinks || []);
      setEmail(profile.activity?.contactEmail || "");
      setConnectMsg(profile.activity?.connectMsg || "");
      setHasLoaded(true);
    }
  }, [isHydrated, profile, hasLoaded]);

  // --- Auto Save ---
  const debouncedActivity = useDebounce(
    {
      blogPosts,
      certificates,
      socialLinks,
      connectMsg,
      contactEmail: email,
    },
    1000
  );

  useEffect(() => {
    if (!hasLoaded) return;
    saveDraft({
      activity: debouncedActivity,
    });
  }, [debouncedActivity, saveDraft, hasLoaded]);

  // --- Handlers Blog ---
  const addBlogPost = () => {
    if (blogPosts.length >= 3) {
      alert("Maximum 3 blog posts allowed.");
      return;
    }
    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    setBlogPosts([
      ...blogPosts,
      {
        id: `blog_${Date.now()}`,
        title: "",
        description: "",
        coverImage: null,
        date: today,
      },
    ]);
  };

  const updateBlogPost = (id: string, field: keyof BlogPost, value: any) => {
    setBlogPosts((posts) =>
      posts.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };
  const removeBlogPost = (id: string) => {
    setBlogPosts((posts) => posts.filter((p) => p.id !== id));
  };

  // --- Handlers Certificate ---
  const addCertificate = () => {
    if (certificates.length >= 4) {
      alert("Maximum 4 certificates allowed.");
      return;
    }
    setCertificates([
      ...certificates,
      { id: `cert_${Date.now()}`, title: "", imageUrl: null },
    ]);
  };

  const updateCertificate = (
    id: string,
    field: keyof Certificate,
    value: any
  ) => {
    setCertificates((certs) =>
      certs.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };
  const removeCertificate = (id: string) => {
    setCertificates((certs) => certs.filter((c) => c.id !== id));
  };

  // --- Handlers Social Links ---
  const addSocialLink = () => {
    setSocialLinks([
      ...socialLinks,
      { id: `social_${Date.now()}`, platform: "website", url: "" },
    ]);
  };
  const updateSocialLink = (id: string, field: keyof SocialLink, value: string) => {
    setSocialLinks((links) =>
      links.map((l) => {
        if (l.id !== id) return l;
        if (field === "url") {
          let platform = l.platform;
          const urlLower = value.toLowerCase();
          if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) platform = "twitter";
          else if (urlLower.includes("t.me") || urlLower.includes("telegram")) platform = "telegram";
          else if (urlLower.includes("medium.com")) platform = "medium";
          else if (urlLower.includes("linkedin.com")) platform = "linkedin";
          else if (urlLower.includes("discord")) platform = "discord";
          else if (urlLower.includes("instagram")) platform = "instagram";
          else if (urlLower.includes("github")) platform = "github";
          return { ...l, url: value, platform };
        }
        if (field === "platform") return { ...l, platform: value };
        return l;
      })
    );
  };
  const removeSocialLink = (id: string) => {
    setSocialLinks((links) => links.filter((l) => l.id !== id));
  };

  // --- HANDLER UPLOAD IMAGE (DIRECT UPLOAD) ---
  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>,
    type: "blog" | "cert"
  ) => {
    const file = e.target.files?.[0];
    if (file && activeUploadId) {
      try {
        setUploadingId(activeUploadId); // Tampilkan spinner pada item ini
        
        // 1. Upload Langsung ke Pinata
        const hash = await uploadFileToApi(file);
        const ipfsUrl = `ipfs://${hash}`;

        // 2. Simpan URL IPFS (String pendek) ke State
        // Ini aman disimpan di LocalStorage dan tidak akan hilang saat refresh
        if (type === "blog") {
          updateBlogPost(activeUploadId, "coverImage", ipfsUrl);
        } else {
          updateCertificate(activeUploadId, "imageUrl", ipfsUrl);
        }
        
      } catch (error) {
        alert("Gagal mengupload gambar. Coba lagi.");
        console.error(error);
      } finally {
        setUploadingId(null);
        if (e.target) e.target.value = ""; // Reset input
      }
    }
  };

  const triggerUpload = (id: string, type: "blog" | "cert") => {
    if (uploadingId) return; // Cegah upload ganda
    setActiveUploadId(id);
    if (type === "blog") blogImageRef.current?.click();
    else certImageRef.current?.click();
  };

  if (!isHydrated) return <div>Loading...</div>;

  return (
    <div className="flex flex-col gap-10">
      <section>
        <BudgetCard />
      </section>

      <hr className="border-zinc-200" />

      {/* Hidden Inputs */}
      <input
        type="file"
        ref={blogImageRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "blog")}
      />
      <input
        type="file"
        ref={certImageRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "cert")}
      />

      {/* 1. Blog Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-zinc-800">
            Internal Blog Posts
          </h2>
          <button
            onClick={addBlogPost}
            className="text-sm flex items-center gap-1 text-zinc-600 hover:text-zinc-900 bg-zinc-100 px-3 py-1 rounded-md"
          >
            <PlusIcon /> Add Post
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {blogPosts.map((post) => (
            <div
              key={post.id}
              className="p-4 border border-zinc-200 rounded-md bg-white flex gap-4 items-start shadow-sm"
            >
              {/* Image Preview Area */}
              <div
                onClick={() => triggerUpload(post.id, "blog")}
                className={`w-24 h-24 bg-zinc-100 rounded-md flex-shrink-0 cursor-pointer overflow-hidden border border-zinc-200 flex items-center justify-center transition ${uploadingId === post.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-200'}`}
              >
                {uploadingId === post.id ? (
                  <LoaderIcon />
                ) : (() => {
                  const imgSrc = resolveIpfsUrl(post.coverImage);
                  if (imgSrc) {
                    return (
                      <img
                        src={imgSrc}
                        className="w-full h-full object-cover"
                        alt="cover"
                      />
                    );
                  }
                  return (
                    <span className="text-xs text-zinc-400 flex flex-col items-center gap-1">
                      <ImageIcon /> Upload
                    </span>
                  );
                })()}
              </div>

              {/* Inputs */}
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Post Title"
                  value={post.title}
                  onChange={(e) =>
                    updateBlogPost(post.id, "title", e.target.value)
                  }
                  className="w-full border-b border-zinc-200 pb-1 focus:outline-none focus:border-zinc-400 font-medium"
                />
                <textarea
                  placeholder="Short Description..."
                  value={post.description}
                  onChange={(e) =>
                    updateBlogPost(post.id, "description", e.target.value)
                  }
                  className="w-full text-sm text-zinc-600 focus:outline-none resize-none"
                  rows={2}
                />
              </div>
              <button
                onClick={() => removeBlogPost(post.id)}
                className="text-zinc-400 hover:text-red-500"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
          {blogPosts.length === 0 && (
            <p className="text-sm text-zinc-400 italic">No blogs yet.</p>
          )}
        </div>
      </section>

      {/* 2. Certificates Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-zinc-800">Certificates</h2>
          <button
            onClick={addCertificate}
            className="text-sm flex items-center gap-1 text-zinc-600 hover:text-zinc-900 bg-zinc-100 px-3 py-1 rounded-md"
          >
            <PlusIcon /> Add Certificate
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="p-3 border border-zinc-200 rounded-md bg-white flex flex-col gap-3 shadow-sm"
            >
              <div
                onClick={() => triggerUpload(cert.id, "cert")}
                className={`relative w-full aspect-[4/3] bg-zinc-50 rounded-md cursor-pointer overflow-hidden border border-zinc-200 flex items-center justify-center group ${uploadingId === cert.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-100'}`}
              >
                 {uploadingId === cert.id ? (
                  <LoaderIcon />
                ) : (() => {
                  const imgSrc = resolveIpfsUrl(cert.imageUrl);
                  if (imgSrc) {
                    return (
                      <img
                        src={imgSrc}
                        className="w-full h-full object-cover"
                        alt={cert.title || "certificate image"}
                      />
                    );
                  }
                  return (
                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                      <ImageIcon />
                      <span className="text-xs">
                        Click to Upload Certificate
                      </span>
                    </div>
                  );
                })()}

                {/* Overlay Hover hint */}
                {!uploadingId && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />}
              </div>

              {/* Input Judul */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Certificate Title"
                  value={cert.title}
                  onChange={(e) =>
                    updateCertificate(cert.id, "title", e.target.value)
                  }
                  className="flex-1 text-sm border-b border-zinc-200 pb-1 focus:border-zinc-400 focus:outline-none"
                />
                <button
                  onClick={() => removeCertificate(cert.id)}
                  className="text-zinc-400 hover:text-red-500"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Social Links Section */}
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-medium text-zinc-800">
            Connect & Socials
          </h2>
          <p className="text-sm text-zinc-500">
            Manage how people can reach you.
          </p>
        </div>

        <div className="p-5 rounded-md border border-zinc-200 bg-white shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
              <MessageIcon /> Invitation Message
            </label>
            <div className="relative group">
              <textarea
                value={connectMsg}
                onChange={(e) => setConnectMsg(e.target.value)}
                placeholder="e.g. 'I'm currently open for new opportunities...'"
                rows={3}
                maxLength={200}
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 focus:bg-white focus:border-zinc-900 transition-all resize-none"
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-zinc-400 bg-zinc-50/80 px-1 rounded">
                {connectMsg.length}/200
              </div>
            </div>
          </div>

          <hr className="border-dashed border-zinc-200" />

          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
              Contact Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-zinc-700">
                Social Links
              </label>
            </div>

            <div className="flex flex-col gap-3">
              {socialLinks.map((link) => (
                <div key={link.id} className="flex gap-2">
                  <select
                    value={link.platform}
                    onChange={(e) =>
                      updateSocialLink(link.id, "platform", e.target.value)
                    }
                    className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="twitter">Twitter / X</option>
                    <option value="github">GitHub</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="telegram">Telegram</option>
                    <option value="medium">Medium</option>
                    <option value="website">Website</option>
                  </select>
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) =>
                      updateSocialLink(link.id, "url", e.target.value)
                    }
                    placeholder="https://..."
                    className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => removeSocialLink(link.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}

              <button
                onClick={addSocialLink}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-md border border-dashed border-zinc-300 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all mt-1"
              >
                <PlusIcon /> Add Social Link
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}