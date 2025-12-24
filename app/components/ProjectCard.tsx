// app/components/ProjectCard.tsx

"use client";

import { useState } from "react";
import { useAnimationStore, Project } from "../lib/SessionProvider";
import { ProjectModal } from "./ProjectModal";
import { resolveIpfsUrl } from "../lib/utils";

// --- IKON ORIGINAL (Clean Style) ---
const ProjectIcon = () => (
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
    className="text-zinc-500"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const ExternalLinkIcon = () => (
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
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// --- 1. KOMPONEN MEDIA (REUSABLE) ---
const MediaRenderer = ({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) => {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100 ${className}`}
      >
        <ProjectIcon />
      </div>
    );
  }

  const isVideo =
    src.startsWith("blob:video/") ||
    src.startsWith("data:video/") ||
    src.endsWith(".mp4") ||
    src.endsWith(".webm");

  if (isVideo) {
    return (
      <video
        src={src}
        className={`object-cover ${className}`}
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
};

// --- 2. KOMPONEN ITEM PROYEK ---
const LightProjectItem = ({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) => {
  
  let displayImage = "/placeholder.png"; // Default
  
  if (project.videoThumbnail) {
    displayImage = resolveIpfsUrl(project.videoThumbnail);
  } else if (project.gallery && project.gallery.length > 0) {
    displayImage = resolveIpfsUrl(project.gallery[0]);
  } else if (project.mediaPreview || project.mediaIpfsUrl) {
    displayImage = project.mediaPreview || resolveIpfsUrl(project.mediaIpfsUrl);
  }

  // Cek apakah item ini memiliki video (untuk UI indicator opsional)
  const hasVideo = !!project.videoUrl;

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col flex-shrink-0 w-72 h-full hover:bg-zinc-100 transition-all rounded-md border bg-white text-left overflow-hidden"
    >
      {/* Media Area */}
      <div className="relative h-40 p-2 overflow-hidden">
        <div className="w-full h-full flex-shrink-0 bg-zinc-100 overflow-hidden transition-colors border border-zinc-200 group-hover:border-zinc-700 rounded-md relative">
           <img
            src={displayImage}
            alt={project.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Indikator Play jika ada video */}
          {hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex justify-between items-center gap-2"> 
          <h3 className="font-semibold text-zinc-900 text-base line-clamp-1 group-hover:text-sky-600 transition-colors">
            {project.name}
          </h3>
          {project.projectUrl && (
            <span className="text-zinc-400 flex items-center justify-center">
              <ExternalLinkIcon />
            </span>
          )}
        </div>

        <p className="text-sm text-zinc-500 mt-2 line-clamp-2 text-black-subtleground leading-relaxed flex-1">
          {project.description || "No description provided."}
        </p>

        {/* Footer: Tags (Original Style) */}
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 2 && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
              +{project.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// --- 3. KOMPONEN UTAMA (PROJECT CARD) ---
const ProjectCard = () => {
  const { profile, isHydrated } = useAnimationStore();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  if (!isHydrated || !profile) {
    return <StaticProjectCard />;
  }

  const allProjects = profile.projects || [];

  return (
    <>
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      <div className="relative flex flex-col h-full rounded-md bg-white shadow-sm md:row-span-1 overflow-hidden">
        <div className="flex items-center gap-3 p-4 pb-2 md:p-6 flex-shrink-0">
          <ProjectIcon />
          <h2 className="text-xl font-semibold text-zinc-900">What I built</h2>
        </div>

        {/* Area Scroll Horizontal */}
        <div className="flex-1 w-full overflow-hidden relative mt-2 min-h-[300px] md:min-h-0">
          {allProjects.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-zinc-500">
              <p>No projects yet.</p>
              <p className="text-xs opacity-50 mt-1">
                Please add them from the settings page.
              </p>
            </div>
          ) : (
            // Scroll Container
            <div className="absolute inset-0 flex items-center gap-4 px-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-200 hover:scrollbar-thumb-zinc-300">
              {allProjects.map((proj) => (
                <LightProjectItem
                  key={proj.id}
                  project={proj}
                  onClick={() => setSelectedProject(proj)}
                />
              ))}
              <div className="w-2 flex-shrink-0" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// --- Fallback State (Static) ---
const StaticProjectCard = () => (
  <div className="rounded-md bg-white p-4 md:p-6 shadow-sm md:row-span-1 flex flex-col h-full">
    <div className="flex items-center gap-3 flex-shrink-0">
      <ProjectIcon />
      <h2 className="text-xl font-semibold text-zinc-900">What I built</h2>
    </div>
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm text-zinc-500">
        Please connect and log in to view or update your profile.
      </p>
    </div>
  </div>
);

export default ProjectCard;
