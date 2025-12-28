// app/settings/projects/page.tsx

"use client";

import React, {
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
  useEffect,
} from "react";
import { useAnimationStore, Project } from "@/app/lib/useAnimationStore";
import { resolveIpfsUrl } from "@/app/lib/utils";

// --- ICONS ---
const PlusIcon = () => (
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
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const EditIcon = () => (
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
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const XIcon = () => (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const VideoIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export default function ProjectsSettingsPage() {
  const { profile, saveDraft, isHydrated } = useAnimationStore();
  const projects = profile?.projects || [];

  const setProjects = (
    newProjects: Project[] | ((prev: Project[]) => Project[])
  ) => {
    let finalProjects: Project[];
    if (typeof newProjects === "function") {
      finalProjects = newProjects(projects);
    } else {
      finalProjects = newProjects;
    }
    saveDraft({ projects: finalProjects });
  };

  // --- STATE FORM ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [projectUrl, setProjectUrl] = useState("");

  // State Media Baru
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [videoThumbPreview, setVideoThumbPreview] = useState<string | null>(
    null
  );
  const [videoThumbFile, setVideoThumbFile] = useState<File | null>(null);

  // Refs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoThumbInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLER GALERI (MAX 7 FOTO) ---
  const handleGalleryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const totalFiles = galleryFiles.length + newFiles.length; // Hitung total file baru + yg sudah di-queue

      // Catatan: Ini validasi sederhana untuk file yang BARU diupload.
      // Idealnya validasi total item (existing + new), tapi cukup oke untuk sekarang.
      if (galleryPreviews.length + newFiles.length > 7) {
        alert("Maximum 7 photos allowed.");
        return;
      }

      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });

      setGalleryFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeGalleryItem = (index: number) => {
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
    // Kita perlu hati-hati menghapus file dari 'galleryFiles' karena indexnya mungkin berbeda
    // jika user mengedit project lama (file lama vs file baru).
    // Untuk penyederhanaan di draf lokal: kita hapus file mentah jika indexnya sesuai urutan penambahan.
    // (Di produksi yang lebih kompleks, kita butuh ID unik untuk setiap media).
    setGalleryFiles((prev) => {
      if (index >= prev.length) return prev;
      return prev.filter((_, i) => i !== index); // Sederhana
    });
  };

  // --- HANDLER VIDEO (MAX 3 MENIT) ---
  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/"))
        return alert("Please upload a valid video file.");

      const videoElement = document.createElement("video");
      videoElement.preload = "metadata";
      videoElement.onloadedmetadata = function () {
        window.URL.revokeObjectURL(videoElement.src);
        // @ts-ignore
        if (videoElement.duration > 180) {
          alert("Video duration must be under 3 minutes.");
          setVideoFile(null);
          setVideoPreview(null);
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            setVideoPreview(reader.result as string);
            setVideoFile(file);
          };
          reader.readAsDataURL(file);
        }
      };
      videoElement.src = URL.createObjectURL(file);
    }
  };

  const removeVideo = () => {
    setVideoPreview(null);
    setVideoFile(null);
    setVideoThumbPreview(null);
    setVideoThumbFile(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  // --- HANDLER VIDEO THUMBNAIL ---
  const handleVideoThumbChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoThumbPreview(reader.result as string);
        setVideoThumbFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- UTILS FORM ---
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim()))
        setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };
  const removeTag = (t: string) => setTags(tags.filter((tag) => tag !== t));

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setTags([]);
    setCurrentTag("");
    setProjectUrl("");
    setGalleryPreviews([]);
    setGalleryFiles([]);
    setVideoPreview(null);
    setVideoFile(null);
    setVideoThumbPreview(null);
    setVideoThumbFile(null);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  // --- CRUD HANDLERS ---
  const handleSaveProject = (e: FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Project name cannot be empty.");

    const existingProject = editingId
      ? projects.find((p) => p.id === editingId)
      : null;

    const newProject: Project = {
      id: editingId || `proj_${Date.now()}`,
      name,
      description,
      tags,
      projectUrl,
      isFeatured: existingProject?.isFeatured || false,

      // Simpan data state ke object project
      gallery: galleryPreviews,
      videoUrl: videoPreview,
      videoThumbnail: videoThumbPreview,

      // File mentah untuk diupload saat Publish
      pendingGalleryFiles: galleryFiles.length > 0 ? galleryFiles : undefined,
      pendingVideoFile: videoFile,
      pendingVideoThumbnailFile: videoThumbFile,

      // Jaga field legacy agar tidak error
      mediaPreview: existingProject?.mediaPreview || null,
      mediaIpfsUrl: existingProject?.mediaIpfsUrl || null,
    };

    if (editingId) {
      setProjects(projects.map((p) => (p.id === editingId ? newProject : p)));
    } else {
      setProjects([...projects, newProject]);
    }

    resetForm();
    alert("Project saved locally.");
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setName(project.name);
    setDescription(project.description);
    setTags(project.tags);
    setProjectUrl(project.projectUrl || "");

    // Load existing media
    setGalleryPreviews(project.gallery || []);
    setVideoPreview(project.videoUrl || null);
    setVideoThumbPreview(project.videoThumbnail || null);

    // Reset file inputs karena kita sedang edit data yang sudah ada
    setGalleryFiles([]);
    setVideoFile(null);
    setVideoThumbFile(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      setProjects(projects.filter((p) => p.id !== id));
    }
  };

  const handleToggleFeatured = (id: string) => {
    const project = projects.find((p) => p.id === id)!;
    const featuredProjects = projects.filter((p) => p.isFeatured);

    if (!project.isFeatured && featuredProjects.length >= 3) {
      alert("You can only have 3 featured projects.");
      return;
    }

    setProjects(
      projects.map((p) =>
        p.id === id ? { ...p, isFeatured: !p.isFeatured } : p
      )
    );
  };

  if (!isHydrated) return <div className="text-zinc-500">Loading data...</div>;

  const featuredProjects = projects.filter((p) => p.isFeatured);
  const otherProjects = projects.filter((p) => !p.isFeatured);

  return (
    <div className="flex flex-col gap-8">
      {/* --- FORM SECTION --- */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          {editingId ? "Edit Project" : "Add New Project"}
        </h2>
        <form
          onSubmit={handleSaveProject}
          className="flex flex-col gap-4 p-4 rounded-md border border-zinc-200"
        >
          <div>
            <label className="text-sm font-medium text-zinc-700">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="My Awesome Project"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Tell us about it..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* INPUT GALERI */}
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1 block">
                Photos (Max 7)
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {galleryPreviews.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded-md overflow-hidden border border-zinc-200 group"
                  >
                    <img
                      src={resolveIpfsUrl(src)}
                      alt={`Gal ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(idx)}
                      className="absolute top-0 right-0 bg-black/50 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon />
                    </button>
                  </div>
                ))}
                {galleryPreviews.length < 7 && (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-16 h-16 flex items-center justify-center rounded-md border-2 border-dashed border-zinc-300 hover:bg-zinc-50 text-zinc-400"
                  >
                    <PlusIcon />
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={galleryInputRef}
                onChange={handleGalleryChange}
                multiple
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* INPUT VIDEO */}
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1 block">
                Video (Max 3 mins)
              </label>
              {!videoPreview ? (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="mt-2 w-full h-32 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-zinc-300 hover:bg-zinc-50 text-zinc-500 text-sm"
                >
                  <span>Upload Video</span>
                  <span className="text-xs opacity-60">MP4, WebM (Max 3m)</span>
                </button>
              ) : (
                <div className="mt-2 flex flex-col gap-2">
                  <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden group">
                    <video
                      src={resolveIpfsUrl(videoPreview)}
                      className="w-full h-full object-contain"
                      controls
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                  {/* Thumbnail Video Input */}
                  <div className="flex items-center gap-3 mt-1 p-2 bg-zinc-50 rounded-md border border-zinc-200">
                    <div className="w-10 h-10 bg-zinc-200 rounded overflow-hidden flex-shrink-0">
                      {videoThumbPreview ? (
                        <img
                          src={resolveIpfsUrl(videoThumbPreview)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-400">
                          Cover
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-zinc-700">
                        Video Thumbnail
                      </p>
                      <button
                        type="button"
                        onClick={() => videoThumbInputRef.current?.click()}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        {videoThumbPreview
                          ? "Change Cover"
                          : "Upload Cover Image"}
                      </button>
                    </div>
                    <input
                      type="file"
                      ref={videoThumbInputRef}
                      onChange={handleVideoThumbChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              )}
              <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoChange}
                accept="video/*"
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">
              Project Link
            </label>
            <input
              type="url"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">Tags</label>
            <div className="flex flex-wrap items-center gap-2 mt-1 w-full rounded-md border border-zinc-300 px-3 py-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800"
                >
                  {tag}{" "}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <XIcon />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleTagInput}
                placeholder="Add tag..."
                className="flex-1 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-800"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Save Project
            </button>
          </div>
        </form>
      </section>

      {/* --- LIST SECTION (RESTORED) --- */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Featured Projects (Max. 3)
        </h2>
        <div className="flex flex-col gap-3">
          {featuredProjects.length > 0 ? (
            featuredProjects.map((proj) => (
              <ProjectListItem
                key={proj.id}
                project={proj}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleFeatured={handleToggleFeatured}
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500">No featured projects yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Other Projects
        </h2>
        <div className="flex flex-col gap-3">
          {otherProjects.length > 0 ? (
            otherProjects.map((proj) => (
              <ProjectListItem
                key={proj.id}
                project={proj}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleFeatured={handleToggleFeatured}
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500">
              No projects have been added yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// --- KOMPONEN LIST ITEM YANG DIPERBARUI ---
const ProjectListItem = ({
  project,
  onEdit,
  onDelete,
  onToggleFeatured,
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string) => void;
}) => {
  // LOGIKA PEMILIHAN THUMBNAIL LIST
  // Prioritas: Thumbnail Video -> Foto Galeri ke-1 -> Legacy Media
  let displayImage = null;
  const hasVideo = !!project.videoUrl;

  if (project.videoThumbnail) {
    displayImage = resolveIpfsUrl(project.videoThumbnail);
  } else if (project.gallery && project.gallery.length > 0) {
    displayImage = resolveIpfsUrl(project.gallery[0]);
  } else {
    displayImage = project.mediaPreview || resolveIpfsUrl(project.mediaIpfsUrl);
  }

  return (
    <div className="flex items-center gap-3 w-full rounded-md border border-zinc-200 p-3 bg-white hover:border-zinc-300 transition-colors">
      {/* Thumbnail Area */}
      <div className="relative w-16 h-10 rounded-md border border-zinc-200 bg-zinc-50 flex-shrink-0 overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-400">
            No Img
          </div>
        )}

        {/* Indikator Video Kecil */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="bg-white/90 rounded-full p-0.5 shadow-sm">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 truncate">
          {project.name}
        </p>
        <p className="text-xs text-zinc-500 truncate">
          {project.description || "No description"}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center gap-2 md:gap-3">
        {/* Tags (Hidden on mobile for space) */}
        <div className="hidden md:flex gap-1">
          {project.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-800"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={() => onToggleFeatured(project.id)}
          className={`p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-yellow-500 ${
            project.isFeatured ? "text-yellow-500" : ""
          }`}
          title={project.isFeatured ? "Remove Featured" : "Mark as Featured"}
        >
          <StarIcon filled={project.isFeatured} />
        </button>
        <button
          onClick={() => onEdit(project)}
          className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
          title="Edit"
        >
          <EditIcon />
        </button>
        <button
          onClick={() => onDelete(project.id)}
          className="p-1.5 rounded hover:bg-red-50 text-zinc-500 hover:text-red-600"
          title="Delete"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};
