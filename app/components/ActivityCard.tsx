// app/components/ActivityCard.tsx

"use client";

import Link from 'next/link'; // Import Link untuk navigasi
import { useState } from 'react';
import { useAnimationStore } from '../lib/SessionProvider';
import { resolveIpfsUrl } from '../lib/utils';
import { CertificateModal } from './CertificateModal';

// Icons
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
const MailIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
const ArrowRightIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;

// Social Icons Component (Sama seperti sebelumnya)
const SocialIcon = ({ platform }: { platform: string }) => {
  const p = platform.toLowerCase();
  if (p.includes('twitter') || p.includes('x.com')) return ( <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> );
  if (p.includes('telegram')) return ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2L2 9.5l7.5 3 3.5 8.5 3-5.5 5.5 2z" /></svg> );
  if (p.includes('medium')) return ( <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.82 24 12z"/></svg> );
  if (p.includes('linkedin')) return ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg> );
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><path d="M2 12h20" /></svg>;
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
      <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2 flex flex-col">
        <div className="flex justify-start gap-3 flex-shrink-0">
          <ActivityIcon />
          <h2 className="text-xl font-semibold text-zinc-900">Activity</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500">Please connect and log in to view or update your profile.</p>
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

      <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <ActivityIcon />
          <h2 className="text-xl font-semibold text-zinc-900">Activity</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- 1. BLOGS --- */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Latest Blog</h3>
            
            {blogPosts.length > 0 ? (
              <div className="flex flex-col gap-4">
                {blogPosts.map(post => {
                  // Logika Preview Teks
                  // Prioritas: Deskripsi -> Konten -> Placeholder
                  const rawText = post.description || post.content || "No description available.";
                  // Ambil 120 karakter pertama
                  const previewText = rawText.length > 120 ? rawText.substring(0, 120) + "..." : rawText;

                  return (
                    <Link 
                      key={post.id} 
                      href={`/blog/${post.id}`}
                      className="group flex gap-4 p-3 border rounded-sm hover:bg-zinc-50 transition-all"
                    >
                      {/* Gambar di Kiri */}
                      <div className="w-28 h-24 sm:w-32 sm:h-24 flex-shrink-0 bg-zinc-100 overflow-hidden border border-zinc-200 rounded-sm">
                        {(() => {
                          const imgSrc = resolveIpfsUrl(post.coverImage);
                          return imgSrc ? (
                            <img src={imgSrc} alt={post.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs">No Img</div>
                          );
                        })()}
                      </div>

                      {/* Teks di Kanan */}
                      <div className="flex flex-col justify-between flex-1 py-1">
                        <div>
                          {post.date && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                              <CalendarIcon />
                              <span>{post.date}</span>
                            </div>
                          )}
                          <h4 className="font-semibold text-zinc-900 leading-tight line-clamp-2">
                            {post.title || "Untitled Post"}
                          </h4>
                          <p className="text-sm text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
                            {previewText}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 border border-dashed border-zinc-200 rounded-lg flex items-center justify-center text-zinc-400 text-sm">
                No blogs posted yet.
              </div>
            )}
          </div>       

            {/* --- 2. CERTIFICATES --- */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Certificates</h3>
              {certificates.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {certificates.slice(0, 4).map(cert => (
                    <button 
                      key={cert.id} 
                      onClick={() => setSelectedCert(cert)}
                      className="group relative aspect-[4/3] w-full overflow-hidden border rounded-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      {(() => {
                        const imgSrc = resolveIpfsUrl(cert.imageUrl);
                        return imgSrc ? (
                          <img src={imgSrc} alt={cert.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-300 text-[10px]">IMG</div>
                        );
                      })()}
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-[10px] font-medium text-center line-clamp-1">{cert.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-24 border border-dashed border-zinc-200 rounded-lg flex items-center justify-center text-zinc-400 text-xs">No certificates.</div>
              )}
            </div>

            {/* --- 3. CONNECT --- */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Connect</h3>
              <div className="flex flex-col gap-2">
                {contactEmail && (
                  <a href={`mailto:${contactEmail}`} className="flex items-center gap-3 p-2 border rounded-sm hover:bg-zinc-50 transition-colors group">
                    <div className="text-zinc-400 group-hover:text-zinc-900"><MailIcon /></div>
                    <span className="text-sm text-zinc-600 truncate">{contactEmail}</span>
                  </a>
                )}
                {socialLinks.map(link => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 border rounded-sm hover:bg-zinc-50 transition-colors group">
                    <div className="text-zinc-400 group-hover:text-zinc-900"><SocialIcon platform={link.platform} /></div>
                    <span className="text-sm text-zinc-600 capitalize">{link.platform}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
    </>
  );
};

export default ActivityCard;