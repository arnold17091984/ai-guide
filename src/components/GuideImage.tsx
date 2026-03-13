"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface GuideImageProps {
  src: string;
  alt: string;
  caption?: string;
}

export default function GuideImage({ src, alt, caption }: GuideImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [isOpen, close]);

  return (
    <>
      <figure className="my-4">
        <div
          className="cursor-zoom-in overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface) transition-all hover:border-(--border-hover) hover:shadow-md"
          onClick={() => setIsOpen(true)}
        >
          <Image
            src={src}
            alt={alt}
            width={800}
            height={450}
            className="w-full h-auto"
          />
        </div>
        {caption && (
          <figcaption className="mt-2 text-center text-xs text-(--text-3)">
            {caption}
          </figcaption>
        )}
      </figure>

      {/* Lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 rounded-md border border-(--border) bg-(--bg-elevated) p-2 text-(--text-2) hover:border-(--border-hover) hover:text-(--text-1)"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={675}
            className="max-h-[90vh] w-auto rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
