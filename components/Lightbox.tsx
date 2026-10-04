'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';

interface LightboxProps {
  images: Array<{
    id?: number;
    filePath: string;
    caption?: string | null;
    description?: string | null;
    imageType?: string;
  }>;
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentIndex] || null;

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrev();
    }
  }, [handleNext, handlePrev, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!currentImage) return null;

  const getTypeBadge = (type?: string) => {
    if (type === 'OLD_UI') {
      return <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">Old UI (Before)</span>;
    }
    if (type === 'NEW_UI') {
      return <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">New UI (After)</span>;
    }
    return <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">Additional Screen</span>;
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot lightbox"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between text-white z-50">
        <div className="flex items-center gap-3">
          {getTypeBadge(currentImage.imageType)}
          <span className="font-semibold text-sm sm:text-base text-slate-100 hidden sm:inline truncate max-w-md">
            {currentImage.caption || `Screenshot ${currentIndex + 1}`}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Screenshot {currentIndex + 1} of {images.length}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-rose-600 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Close Lightbox (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="relative flex-1 flex items-center justify-center my-3 overflow-hidden">
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            aria-label="Previous screenshot"
            className="absolute left-2 sm:left-4 z-40 p-3 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white transition-all shadow-xl hover:scale-105"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div className="flex items-center justify-center max-h-[75vh] max-w-[88vw]">
          <img
            src={currentImage.filePath}
            alt={currentImage.caption || 'Screenshot detail'}
            className="max-h-[75vh] max-w-[88vw] object-contain rounded-xl shadow-2xl"
          />
        </div>

        {images.length > 1 && (
          <button
            onClick={handleNext}
            aria-label="Next screenshot"
            className="absolute right-2 sm:right-4 z-40 p-3 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white transition-all shadow-xl hover:scale-105"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="flex flex-col items-center gap-2 z-50 text-center">
        {currentImage.description && (
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl bg-slate-900/80 px-4 py-1.5 rounded-lg border border-slate-800">
            {currentImage.description}
          </p>
        )}

        {/* Thumbnails Filmstrip */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full p-1.5 bg-slate-900/90 rounded-xl border border-slate-800">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Jump to screenshot ${idx + 1}`}
                className={`relative w-12 h-16 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${
                  currentIndex === idx
                    ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/50'
                    : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img
                  src={img.filePath}
                  alt={img.caption || `Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
