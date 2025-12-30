// app/blog/[id]/page.tsx

"use client";

import { useParams } from 'next/navigation';
import { useAnimationStore } from '@/app/lib/SessionProvider';
import { resolveIpfsUrl } from '@/app/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Ikon
const ArrowLeftIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
const CalendarIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;

export default function BlogDetailPage() {
  const { id } = useParams();
  const { profile, isHydrated } = useAnimationStore();
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    if (isHydrated && profile?.activity?.blogPosts) {
      const foundPost = profile.activity.blogPosts.find((p) => p.id === id);
      setPost(foundPost || null);
    }
  }, [isHydrated, profile, id]);

  if (!isHydrated) return <div className="min-h-screen flex items-center justify-center bg-white"><p className="text-zinc-500">Loading...</p></div>;

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">Post not found</h1>
        <Link href="/" className="text-sky-600 hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  const coverImageUrl = resolveIpfsUrl(post.coverImage);

  return (
    <main className="min-h-screen bg-white">
      {/* Header Sticky */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors text-sm font-medium">
            <ArrowLeftIcon /> Back to Dashboard
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Header Artikel */}
        <header className="mb-10 border-b border-zinc-100 pb-4e">
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-4 leading-tight tracking-tight">
            {post.title}
          </h1>
          
          {/* Tanggal (Metadata) */}
          {post.date && (
            <div className="flex items-center gap-2 text-zinc-500 mb-4 text-sm font-medium">
              <CalendarIcon />
              <span>Published on {post.date}</span>
            </div>
          )}
        </header>

        {/* Gambar Cover */}
        {coverImageUrl && (
          <div className="w-full aspect-video rounded-md overflow-hidden mb-10 bg-zinc-50 border border-zinc-200">
            <img 
              src={coverImageUrl} 
              alt={post.title} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        {/* Konten Markdown */}
        <div className="prose prose-zinc prose-lg max-w-none text-justify leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content || post.description || "*No content available.*"}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  );
}