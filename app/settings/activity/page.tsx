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

// Ikon Helper
const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const ImageIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export default function ActivitySettingsPage() {
  const { profile, saveDraft, isHydrated } = useAnimationStore();
  const [hasLoaded, setHasLoaded] = useState(false);

  // State Lokal
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [email, setEmail] = useState("");

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
      setHasLoaded(true);
    }
  }, [isHydrated, profile, hasLoaded]);

  // --- Auto Save ---
  const debouncedActivity = useDebounce(
    {
      blogPosts,
      certificates,
      socialLinks,
      contactEmail: email,
    },
    1000
  );

  useEffect(() => {
    if (!hasLoaded) return;
    saveDraft({ activity: debouncedActivity });
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
  const updateSocialLink = (id: string, url: string) => {
    // Deteksi platform sederhana
    let platform = "website";
    if (url.includes("twitter.com") || url.includes("x.com"))
      platform = "twitter";
    else if (url.includes("t.me") || url.includes("telegram"))
      platform = "telegram";
    else if (url.includes("medium.com")) platform = "medium";
    else if (url.includes("linkedin.com")) platform = "linkedin";
    else if (url.includes("discord")) platform = "discord";

    setSocialLinks((links) =>
      links.map((l) => (l.id === id ? { ...l, url, platform } : l))
    );
  };
  const removeSocialLink = (id: string) => {
    setSocialLinks((links) => links.filter((l) => l.id !== id));
  };

  // --- Handler Upload Image ---
  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: "blog" | "cert"
  ) => {
    const file = e.target.files?.[0];
    if (file && activeUploadId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "blog") {
          updateBlogPost(activeUploadId, "coverImage", reader.result as string);
        } else {
          updateCertificate(
            activeUploadId,
            "imageUrl",
            reader.result as string
          );
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset
    if (e.target) e.target.value = "";
  };

  const triggerUpload = (id: string, type: "blog" | "cert") => {
    setActiveUploadId(id);
    if (type === "blog") blogImageRef.current?.click();
    else certImageRef.current?.click();
  };

  if (!isHydrated) return <div>Loading...</div>;

  return (
    <div className="flex flex-col gap-10">
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
              className="p-4 border rounded-md bg-white flex gap-4 items-start"
            >
              {/* Image Preview */}
              <div
                onClick={() => triggerUpload(post.id, "blog")}
                className="w-24 h-24 bg-zinc-100 rounded-lg flex-shrink-0 cursor-pointer overflow-hidden border border-zinc-200 flex items-center justify-center hover:bg-zinc-200 transition"
              >
                {(() => {
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
              className="p-3 border rounded-lg bg-white flex flex-col gap-3"
            >
              <div
                onClick={() => triggerUpload(cert.id, "cert")}
                className="relative w-full aspect-[4/3] bg-zinc-50 rounded-md cursor-pointer overflow-hidden border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 group"
              >
                {(() => {
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
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
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
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-4">
          Connect & Socials
        </h2>

        <div className="mb-4">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">
            Primary Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@you.com"
            className="w-full p-2 border rounded-md text-sm"
          />
        </div>

        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
          Social Links
        </label>
        <div className="flex flex-col gap-2">
          {socialLinks.map((link) => (
            <div key={link.id} className="flex gap-2">
              <div className="flex items-center justify-center w-10 h-10 bg-zinc-100 rounded-md text-xs font-bold text-zinc-500 uppercase">
                {link.platform.slice(0, 2)}
              </div>
              <input
                type="url"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => updateSocialLink(link.id, e.target.value)}
                className="flex-1 border rounded-md px-3 text-sm focus:border-zinc-800 outline-none"
              />
              <button
                onClick={() => removeSocialLink(link.id)}
                className="text-zinc-400 hover:text-red-500 px-2"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
          <button
            onClick={addSocialLink}
            className="text-sm text-sky-600 hover:underline self-start"
          >
            + Add Link
          </button>
        </div>
      </section>
    </div>
  );
}
