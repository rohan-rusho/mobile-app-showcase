'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sliders,
  Columns,
  Sparkles,
  Layers
} from 'lucide-react';
import ComparisonSlider from './ComparisonSlider';

interface ImageItem {
  id: number;
  filePath: string;
  thumbPath?: string | null;
  imageType: string;
  caption?: string | null;
  description?: string | null;
  sortOrder: number;
}

interface SideBySideViewerProps {
  oldImages: ImageItem[];
  newImages: ImageItem[];
  onOpenLightbox: (images: ImageItem[], index: number) => void;
  isPresentationMode?: boolean;
}

export default function SideBySideViewer({
  oldImages,
  newImages,
  onOpenLightbox,
  isPresentationMode = false
}: SideBySideViewerProps) {
  const [oldIndex, setOldIndex] = useState(0);
  const [newIndex, setNewIndex] = useState(0);
  const [mode, setMode] = useState<'side-by-side' | 'slider'>('side-by-side');

  // Fade animation states for smooth crossfade
  const [oldFade, setOldFade] = useState(false);
  const [newFade, setNewFade] = useState(false);

  // Touch tracking for swipe navigation
  const touchStartRef = useRef<{ panel: 'old' | 'new'; x: number } | null>(null);

  const hasOld = oldImages.length > 0;
  const hasNew = newImages.length > 0;
  const hasBoth = hasOld && hasNew;

  // Preload next and previous images to eliminate white flashes or layout jumps
  useEffect(() => {
    if (hasOld) {
      const prevOld = oldImages[(oldIndex - 1 + oldImages.length) % oldImages.length];
      const nextOld = oldImages[(oldIndex + 1) % oldImages.length];
      const img1 = new Image();
      img1.src = prevOld.thumbPath || prevOld.filePath;
      const img2 = new Image();
      img2.src = nextOld.thumbPath || nextOld.filePath;
    }
    if (hasNew) {
      const prevNew = newImages[(newIndex - 1 + newImages.length) % newImages.length];
      const nextNew = newImages[(newIndex + 1) % newImages.length];
      const img3 = new Image();
      img3.src = prevNew.thumbPath || prevNew.filePath;
      const img4 = new Image();
      img4.src = nextNew.thumbPath || nextNew.filePath;
    }
  }, [oldIndex, newIndex, oldImages, newImages, hasOld, hasNew]);

  if (!hasOld && !hasNew) return null;

  const handlePrevOld = () => {
    if (!hasOld || oldImages.length <= 1) return;
    setOldFade(true);
    setTimeout(() => {
      setOldIndex(prev => (prev === 0 ? oldImages.length - 1 : prev - 1));
      setOldFade(false);
    }, 120);
  };

  const handleNextOld = () => {
    if (!hasOld || oldImages.length <= 1) return;
    setOldFade(true);
    setTimeout(() => {
      setOldIndex(prev => (prev === oldImages.length - 1 ? 0 : prev + 1));
      setOldFade(false);
    }, 120);
  };

  const handlePrevNew = () => {
    if (!hasNew || newImages.length <= 1) return;
    setNewFade(true);
    setTimeout(() => {
      setNewIndex(prev => (prev === 0 ? newImages.length - 1 : prev - 1));
      setNewFade(false);
    }, 120);
  };

  const handleNextNew = () => {
    if (!hasNew || newImages.length <= 1) return;
    setNewFade(true);
    setTimeout(() => {
      setNewIndex(prev => (prev === newImages.length - 1 ? 0 : prev + 1));
      setNewFade(false);
    }, 120);
  };

  // Keyboard navigation for focused panel
  const handlePanelKeyDown = (e: React.KeyboardEvent, panel: 'old' | 'new') => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      panel === 'old' ? handlePrevOld() : handlePrevNew();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      panel === 'old' ? handleNextOld() : handleNextNew();
    }
  };

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent, panel: 'old' | 'new') => {
    touchStartRef.current = { panel, x: e.touches[0].clientX };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const diffX = touchStartRef.current.x - e.changedTouches[0].clientX;
    const threshold = 40;
    if (Math.abs(diffX) > threshold) {
      if (touchStartRef.current.panel === 'old') {
        diffX > 0 ? handleNextOld() : handlePrevOld();
      } else {
        diffX > 0 ? handleNextNew() : handlePrevNew();
      }
    }
    touchStartRef.current = null;
  };

  // Single panel helper
  const renderPanel = (
    panelType: 'old' | 'new',
    images: ImageItem[],
    currentIndex: number,
    setIndex: (i: number) => void,
    onPrev: () => void,
    onNext: () => void,
    isFading: boolean
  ) => {
    const isOld = panelType === 'old';
    const currentImg = images[currentIndex];
    const total = images.length;

    // Fixed height: 480px on standard, up to 70vh in presentation mode
    const panelHeight = isPresentationMode ? 'h-[65vh] sm:h-[72vh]' : 'h-[440px] sm:h-[500px]';

    return (
      <div
        tabIndex={0}
        onKeyDown={(e) => handlePanelKeyDown(e, panelType)}
        onTouchStart={(e) => handleTouchStart(e, panelType)}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border ${
          isOld ? 'border-rose-200/90 dark:border-rose-900/60 hover:border-rose-300' : 'border-emerald-200/90 dark:border-emerald-900/60 hover:border-emerald-300'
        } overflow-hidden shadow-xs hover:shadow-md transition-all focus:outline-none focus:ring-2 ${
          isOld ? 'focus:ring-rose-400' : 'focus:ring-emerald-400'
        }`}
      >
        {/* Panel Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-850/60">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full ${
                isOld
                  ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {isOld ? 'Before — Old UI' : 'After — New UI'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              {currentIndex + 1} / {total}
            </span>

            {/* Navigation buttons */}
            {total > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onPrev}
                  className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 active:scale-95 transition-all"
                  title="Previous image (or Left arrow)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 active:scale-95 transition-all"
                  title="Next image (or Right arrow)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Image Stage (Fixed Height with Object Contain) */}
        <div
          onClick={() => onOpenLightbox(images, currentIndex)}
          className={`relative ${panelHeight} w-full bg-slate-950 flex items-center justify-center p-3 cursor-zoom-in group select-none overflow-hidden`}
        >
          <img
            key={currentImg.id || currentIndex}
            src={currentImg.filePath}
            alt={currentImg.caption || (isOld ? 'Old UI Screenshot' : 'New UI Screenshot')}
            className={`max-h-full max-w-full object-contain transition-all duration-300 ease-in-out ${
              isFading ? 'opacity-0 scale-98' : 'opacity-100 scale-100'
            }`}
            loading="eager"
          />

          {/* Fullscreen Overlay Hint */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white p-1.5 rounded-lg backdrop-blur-xs shadow-sm flex items-center gap-1 text-[11px] font-semibold">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Lightbox</span>
          </div>

          {/* Side arrow overlay on hover for desktop */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Strip / Dot Indicators */}
        {total > 1 && (
          <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => {
                  if (idx !== currentIndex) {
                    setIndex(idx);
                  }
                }}
                className={`relative w-8 h-10 rounded border overflow-hidden flex-shrink-0 transition-all ${
                  idx === currentIndex
                    ? isOld
                      ? 'border-rose-600 ring-2 ring-rose-400 scale-105'
                      : 'border-emerald-600 ring-2 ring-emerald-400 scale-105'
                    : 'border-slate-300 dark:border-slate-700 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img.thumbPath || img.filePath}
                  alt={img.caption || ''}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Caption & Description Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex-1 flex flex-col justify-center">
          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
            {currentImg.caption || `${isOld ? 'Before' : 'After'} Screen #${currentIndex + 1}`}
          </div>
          {currentImg.description && (
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {currentImg.description}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Viewer Header with mode switch if both exist */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Columns className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Before &amp; After Comparison</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare previous design and updated mobile application implementation
          </p>
        </div>

        {hasBoth && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setMode('side-by-side')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'side-by-side'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('slider')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'slider'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Draggable Slider</span>
            </button>
          </div>
        )}
      </div>

      {/* Render Mode */}
      {mode === 'slider' && hasBoth ? (
        <ComparisonSlider oldImages={oldImages} newImages={newImages} />
      ) : (
        <div
          className={`grid gap-6 ${
            hasBoth ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'
          }`}
        >
          {hasOld &&
            renderPanel(
              'old',
              oldImages,
              oldIndex,
              setOldIndex,
              handlePrevOld,
              handleNextOld,
              oldFade
            )}
          {hasNew &&
            renderPanel(
              'new',
              newImages,
              newIndex,
              setNewIndex,
              handlePrevNew,
              handleNextNew,
              newFade
            )}
        </div>
      )}
    </div>
  );
}
