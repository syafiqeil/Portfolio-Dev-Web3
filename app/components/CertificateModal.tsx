// app/components/CertificateModal.tsx

"use client";

import React from "react";
import { Certificate } from "../lib/SessionProvider";
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

interface CertificateModalProps {
  certificate: Certificate | null;
  onClose: () => void;
}

export const CertificateModal = ({
  certificate,
  onClose,
}: CertificateModalProps) => {
  if (!certificate) return null;

  const imageUrl = resolveIpfsUrl(certificate.imageUrl);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      style={{ animation: "fadeIn 0.2s ease-out" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-white/10 rounded-full p-2"
          aria-label="Close"
        >
          <XIcon />
        </button>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={certificate.title}
            className="w-auto h-auto max-h-[85vh] max-w-full object-contain rounded-md shadow-2xl border border-white/10"
          />
        ) : (
          <div className="w-full h-64 flex items-center justify-center text-white">
            No Image Available
          </div>
        )}

        <h3 className="mt-4 text-white text-xl font-medium text-center">
          {certificate.title}
        </h3>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
