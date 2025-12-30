// app/components/ProjectModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Project } from "../lib/SessionProvider";
import { resolveIpfsUrl } from "../lib/utils";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectModal = ({ project, onClose }: ProjectModalProps) => {
  // State untuk melacak media yang sedang tampil di header
  const [activeMedia, setActiveMedia] = useState<{
    type: "video" | "image";
    url: string;
  } | null>(null);

  // Inisialisasi: Pilih Video dulu, jika tidak ada baru Foto Pertama
  useEffect(() => {
    if (project) {
      const videoUrl = resolveIpfsUrl(project.videoUrl);
      const firstGallery =
        project.gallery && project.gallery.length > 0
          ? resolveIpfsUrl(project.gallery[0])
          : null;
      const legacyMedia = resolveIpfsUrl(
        project.mediaIpfsUrl || project.mediaPreview
      );

      if (videoUrl) {
        setActiveMedia({ type: "video", url: videoUrl });
      } else if (firstGallery) {
        setActiveMedia({ type: "image", url: firstGallery });
      } else if (legacyMedia) {
        setActiveMedia({ type: "image", url: legacyMedia });
      }
    }
  }, [project]);

  if (!project) return null;

  // Helper variables
  const videoUrl = resolveIpfsUrl(project.videoUrl);
  const videoThumb = resolveIpfsUrl(project.videoThumbnail);
  const gallery = project.gallery?.map((url) => resolveIpfsUrl(url)) || [];
  const legacyMedia = resolveIpfsUrl(
    project.mediaIpfsUrl || project.mediaPreview
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-white rounded-md shadow-2xl flex flex-col max-h-[95vh]"
        style={{ animation: "fadeIn 0.2s ease-out" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white mix-blend-difference bg-black/20 hover:bg-black/50 rounded-full p-2 transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="w-full h-full flex items-center justify-center bg-zinc-100 rounded-t-lg overflow-hidden relative">
          {activeMedia?.type === "video" ? (
            // Jika Video: Tetap gunakan aspect ratio agar player rapi, tapi background hitam wajar untuk video
            <div className="w-full aspect-video bg-black">
              <video
                src={activeMedia.url}
                className="w-full h-full object-contain"
                autoPlay
                controls
                playsInline
              />
            </div>
          ) : activeMedia?.type === "image" ? (
            // Jika Gambar: Biarkan ukurannya mengikuti aslinya (max-height dibatasi agar muat di layar)
            <img
              src={activeMedia.url}
              alt={project.name}
              className="w-auto h-auto max-w-full object-contain"
            />
          ) : (
            <div className="p-10 text-zinc-400">No media selected</div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white rounded-b-lg shadow-t">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Kiri: Deskripsi */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                {project.name}
              </h2>
              {project.projectUrl && (
                <a
                  href={project.projectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:underline text-sm font-medium mb-4 inline-block"
                >
                  Visit Project &rarr;
                </a>
              )}
              <p className="text-zinc-600 text-base whitespace-pre-wrap leading-relaxed">
                {project.description || "No description provided."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Kanan: Galeri Foto (Grid) & Video Thumbnail */}
            <div className="w-full md:w-1/3 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                Gallery
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
                {/* 1. Item Khusus: VIDEO (Jika ada) */}
                {videoUrl && (
                  <button
                    onClick={() =>
                      setActiveMedia({ type: "video", url: videoUrl })
                    }
                    className={`relative aspect-square rounded-md overflow-hidden bg-black group border-2 ${
                      activeMedia?.url === videoUrl
                        ? "border-sky-500"
                        : "border-transparent"
                    }`}
                  >
                    {/* Thumbnail Video atau Placeholder Hitam */}
                    {videoThumb ? (
                      <img
                        src={videoThumb}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800" />
                    )}

                    {/* Icon Play Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="white"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </button>
                )}

                {/* 2. Item Galeri FOTO */}
                {gallery.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMedia({ type: "image", url: src })}
                    className={`relative aspect-square rounded-md overflow-hidden bg-zinc-100 group border-2 ${
                      activeMedia?.url === src
                        ? "border-sky-500"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={src}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      alt={`Gallery ${idx + 1}`}
                    />
                  </button>
                ))}

                {/* 3. Legacy Media (Fallback jika tidak ada galeri baru) */}
                {gallery.length === 0 && legacyMedia && !videoUrl && (
                  <button
                    onClick={() =>
                      setActiveMedia({ type: "image", url: legacyMedia })
                    }
                    className={`aspect-square rounded-md overflow-hidden bg-zinc-100 border-2 ${
                      activeMedia?.url === legacyMedia
                        ? "border-sky-500"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={legacyMedia}
                      className="w-full h-full object-cover"
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
