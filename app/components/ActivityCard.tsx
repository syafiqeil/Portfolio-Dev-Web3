// app/components/ActivityCard.tsx

"use client";

import Link from "next/link";
import { useState } from "react";
import { useAnimationStore } from "../lib/SessionProvider";
import { resolveIpfsUrl } from "../lib/utils";
import { CertificateModal } from "./CertificateModal";

// Icons
const CalendarIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const ActivityIcon = () => (
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
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const MailIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const ArrowRightIcon = () => (
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
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// Social Icons Component
const SocialIcon = ({ platform }: { platform: string }) => {
  const p = platform.toLowerCase();
  if (p.includes("twitter") || p.includes("x.com"))
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  if (p.includes("telegram"))
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21.5 2L2 9.5l7.5 3 3.5 8.5 3-5.5 5.5 2z" />
      </svg>
    );
  if (p.includes("medium"))
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.82 24 12z" />
      </svg>
    );
  if (p.includes("linkedin"))
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    );
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
};

const ActivityCard = () => {
  const { profile, isHydrated } = useAnimationStore();
  const [selectedCert, setSelectedCert] = useState<any>(null);

  const activity = profile?.activity;
  const blogPosts = activity?.blogPosts || [];
  const certificates = activity?.certificates || [];
  const socialLinks = activity?.socialLinks || [];
  const contactEmail = activity?.contactEmail;

  if (!isHydrated || !profile) {
    return (
      <div className="rounded-md bg-white p-4 md:p-6 shadow-sm md:col-span-2 flex flex-col">
        <div className="flex justify-start gap-3 flex-shrink-0">
          <ActivityIcon />
          <h2 className="text-sm font-semibold text-zinc-900">Activity</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500">
            Please connect and log in to view or update your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <CertificateModal
        certificate={selectedCert}
        onClose={() => setSelectedCert(null)}
      />

      <div className="rounded-md bg-white p-4 md:p-6 shadow-sm md:col-span-2 flex flex-col">
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <ActivityIcon />
          <h2 className="text-xl font-semibold text-zinc-900">Activity</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.1fr_0.8fr] gap-6 h-auto md:h-full min-h-0 md:overflow-hidden">
          {/* --- 1. BLOGS --- */}
          <div className="flex flex-col gap-3 pr-1">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider sticky top-0 bg-white z-10">
              Latest Blog
            </h3>

            {blogPosts.length > 0 ? (
              <div className="flex flex-col gap-4">
                {blogPosts.slice(0, 3).map((post) => {
                  const rawText =
                    post.description ||
                    post.content ||
                    "No description available.";
                  const previewText =
                    rawText.length > 120
                      ? rawText.substring(0, 120) + "..."
                      : rawText;

                  return (
                    <Link
                      key={post.id}
                      href={`/blog/${post.id}`}
                      className="group flex gap-4 p-4 border rounded-md hover:bg-zinc-100 transition-all items-start shadow-sm"
                    >
                      <div className="w-20 h-20 flex-shrink-0 bg-zinc-100 overflow-hidden transition-colors border border-zinc-200 group-hover:border-zinc-700 rounded-md">
                        {(() => {
                          const imgSrc = resolveIpfsUrl(post.coverImage);
                          return imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300 text-[10px]">
                              No Img
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex flex-col min-w-0 h-full justify-between">
                        <div>
                          {post.date && (
                            <div className="flex items-center gap-1 text-[10px] text-zinc-400 group-hover:text-black transition-colors mb-1">
                              <CalendarIcon />
                              <span>{post.date}</span>
                            </div>
                          )}
                          <h4 className="font-semibold text-zinc-900 group-hover:text-sky-600 transition-colors text-sm leading-tight line-clamp-1 mb-1">
                            {post.title || "Untitled"}
                          </h4>
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed">
                          {previewText}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="h-24 border border-dashed border-zinc-200 bg-zinc-100/50 rounded-md flex items-center justify-center text-zinc-400 text-xs">
                No blogs posted yet.
              </div>
            )}
          </div>

          {/* --- 2. CERTIFICATES --- */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
              Certificates
            </h3>

            {certificates.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 content-start">
                {certificates.slice(0, 4).map((cert) => (
                  <button
                    key={cert.id}
                    onClick={() => setSelectedCert(cert)}
                    className="group flex flex-col w-full aspect-video rounded-md bg-white"
                  >
                    <div className="relative w-full flex-1 overflow-hidden rounded-md bg-white shadow-sm">
                      {(() => {
                        const imgSrc = resolveIpfsUrl(cert.imageUrl);
                        return imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={cert.title}
                            className="w-full h-full object-cover rounded-md border shadow-sm"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-[10px] bg-zinc-50">
                            <span className="text-zinc-300">No Asset</span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="mt-1.5 w-full flex-shrink-0 flex items-center justify-center">
                      <p className="text-zinc-800 text-[10px] font-medium truncate group-hover:text-sky-600 transition-colors w-full text-center">
                        {cert.title || "UNTITLED"}
                      </p>
                    </div>
                  </button>
                ))}

                {/* Placeholder untuk slot kosong */}
                {certificates.length < 4 &&
                  Array.from({ length: 4 - certificates.length }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className="w-full aspect-video rounded-md border border-dashed border-zinc-200 bg-zinc-50/30 flex flex-col items-center justify-center"
                      >
                        <div className="w-full flex-1 rounded-md bg-zinc-100/50 flex items-center justify-center">
                          <span className="text-zinc-300 text-[10px]">
                            Empty
                          </span>
                        </div>
                        <div className="h-2.5 w-12 m-2 bg-zinc-100 rounded-full flex-shrink-0" />
                      </div>
                    )
                  )}
              </div>
            ) : (
              <div className="h-full border border-dashed border-zinc-200 rounded-md flex items-center justify-center text-zinc-400 text-xs">
                No certificates.
              </div>
            )}
          </div>

          {/* --- 3. CONNECT --- */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
              Connect
            </h3>

            {activity?.connectMsg && (
              <div className="p-3 bg-gradient-to-br from-zinc-50 to-white rounded-md border">
                <p className="text-sm text-zinc-700 mb-6 italic font-medium leading-relaxed">
                  "{activity.connectMsg}"
                </p>

                <div className="flex flex-col gap-2">
                  {contactEmail && (
                    <a
                      href={`mailto:${contactEmail}`}
                      className="flex items-center gap-3 p-2 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors group"
                    >
                      <div className="text-zinc-400 group-hover:text-zinc-900">
                        <MailIcon />
                      </div>
                      <span className="text-sm text-zinc-600 truncate">
                        {contactEmail}
                      </span>
                    </a>
                  )}
                  {socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors group"
                    >
                      <div className="text-zinc-400 group-hover:text-zinc-900">
                        <SocialIcon platform={link.platform} />
                      </div>
                      <span className="text-sm text-zinc-600 capitalize">
                        {link.platform}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivityCard;
