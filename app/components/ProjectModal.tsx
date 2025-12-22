// app/components/ProjectModal.tsx

"use client";

import React from "react";
import { Project } from "../lib/SessionProvider";
import { resolveIpfsUrl } from "../lib/utils";

const XIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ExternalLinkIcon = () => (
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
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectModal = ({ project, onClose }: ProjectModalProps) => {
  if (!project) return null;

  // Resolusi URL
  const videoUrl = resolveIpfsUrl(project.videoUrl);
  const gallery = project.gallery?.map(url => resolveIpfsUrl(url)) || [];
  
  // Backward compatibility untuk data lama
  const legacyMedia = resolveIpfsUrl(project.mediaIpfsUrl || project.mediaPreview);
  
  // Tentukan apa yang ditampilkan di area utama
  // Prioritas: Video -> Foto Pertama Galeri -> Legacy Media
  const hasVideo = !!videoUrl;
  
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ animation: "fadeIn 0.2s ease-out" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white mix-blend-difference bg-black/20 hover:bg-black/50 rounded-full p-2 transition-colors"
        >
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>

        {/* --- AREA MEDIA UTAMA --- */}
        <div className="w-full bg-black flex items-center justify-center relative aspect-video md:h-[60vh]">
          {hasVideo ? (
            <video
              src={videoUrl}
              className="w-full h-full object-contain"
              autoPlay // AUTO PLAY
              controls
              playsInline
            />
          ) : (
            // Jika tidak ada video, tampilkan slider/foto pertama (Sederhana: Tampilkan foto ke-1 besar)
            <img 
              src={gallery.length > 0 ? gallery[0] : legacyMedia || "/placeholder.png"} 
              alt={project.name}
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* --- AREA KONTEN BAWAH --- */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Kiri: Deskripsi */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">{project.name}</h2>
              {project.projectUrl && (
                <a href={project.projectUrl} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline text-sm font-medium mb-4 inline-block">
                  Visit Project &rarr;
                </a>
              )}
              <p className="text-zinc-600 text-base whitespace-pre-wrap leading-relaxed">
                {project.description || "No description provided."}
              </p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Kanan: Galeri Foto (Grid) */}
            {(gallery.length > 0 || (!hasVideo && legacyMedia)) && (
              <div className="w-full md:w-1/3 flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Gallery</h3>
                <div className="grid grid-cols-2 gap-2">
                  {gallery.map((src, idx) => (
                    <div key={idx} className="aspect-square rounded-md border border-zinc-200 overflow-hidden bg-zinc-100 cursor-pointer hover:opacity-80 transition-opacity">
                      <img src={src} className="w-full h-full object-cover" alt={`Screenshot ${idx+1}`} />
                    </div>
                  ))}
                  {/* Tampilkan legacy media jika tidak ada galeri baru tapi juga tidak ada video */}
                  {gallery.length === 0 && legacyMedia && !hasVideo && (
                     <div className="aspect-square rounded-md overflow-hidden bg-zinc-100">
                      <img src={legacyMedia} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            )}
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
}