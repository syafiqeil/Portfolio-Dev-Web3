// app/components/ReadmeModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import { resolveIpfsUrl } from "../lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

interface ReadmeModalProps {
  readmeUrl: string | null | undefined;
  onClose: () => void;
}

export const ReadmeModal = ({ readmeUrl, onClose }: ReadmeModalProps) => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!readmeUrl) return;

    const fetchReadmeContent = async () => {
      setIsLoading(true);
      const url = resolveIpfsUrl(readmeUrl);
      if (!url) {
        setContent("Failed to load README: URL is not valid.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error("Failed to fetch README content:", error);
        setContent("Failed to load README content.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadmeContent();
  }, [readmeUrl]); 

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      {/* Konten Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl h-[80vh] bg-white rounded-md shadow-xl flex flex-col overflow-hidden"
        style={{ animation: "fadeIn 0.2s ease-out" }}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold text-zinc-900">README.md</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 rounded-full p-1"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        {/* Konten Markdown */}
        <div className="flex-1 p-6 overflow-y-auto markdown-content">
          {isLoading ? (
            <p className="text-zinc-500">Loading content...</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .markdown-content h1 { font-size: 2em; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; margin-bottom: 1em;}
        .markdown-content h2 { font-size: 1.5em; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; margin-bottom: 1em;}
        .markdown-content h3 { font-size: 1.25em; font-weight: 600; margin-bottom: 0.5em;}
        .markdown-content p { margin-bottom: 1em; line-height: 1.6;}
        .markdown-content a { color: #0070f3; text-decoration: none; }
        .markdown-content a:hover { text-decoration: underline; }
        .markdown-content code { background-color: #f3f4f6; padding: 0.2em 0.4em; margin: 0; font-size: 85%; border-radius: 3px; }
        .markdown-content pre code { background-color: transparent; padding: 0; }
        .markdown-content pre { background-color: #f3f4f6; padding: 1em; border-radius: 5px; overflow-x: auto;}
        .markdown-content ul, .markdown-content ol { padding-left: 2em; margin-bottom: 1em; }
        .markdown-content li { margin-bottom: 0.5em; }
        .markdown-content blockquote { border-left: 4px solid #d1d5db; padding-left: 1em; color: #6b7280; margin-left: 0; margin-right: 0; }
      `}</style>
    </div>
  );
};
