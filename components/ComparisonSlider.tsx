'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Columns, SplitSquareVertical, ArrowLeftRight } from 'lucide-react';

interface ComparisonImage {
  id?: number;
  filePath: string;
  caption?: string | null;
  description?: string | null;
}

interface ComparisonSliderProps {
  oldImages: ComparisonImage[];
  newImages: ComparisonImage[];
}

export default function ComparisonSlider({ oldImages, newImages }: ComparisonSliderProps) {
  const [selectedOldIndex, setSelectedOldIndex] = useState(0);
  const [selectedNewIndex, setSelectedNewIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');

  const containerRef = useRef<HTMLDivElement>(null);

  const oldImage = oldImages[selectedOldIndex] || null;
  const newImage = newImages[selectedNewIndex] || null;

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMoveWindow = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMoveWindow);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveWindow);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMove]);

  if (!oldImage || !newImage) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Before → After Comparison</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Interactive
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compare previous designs and modern implementations. Pick any Old and New screenshot.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'slider'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Slider</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>
      </div>

      {/* Selectors if multiple images exist */}
      {(oldImages.length > 1 || newImages.length > 1) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <label className="text-xs font-semibold text-rose-700 block mb-1">
              Select Before (Old UI):
            </label>
            <select
              value={selectedOldIndex}
              onChange={(e) => setSelectedOldIndex(Number(e.target.value))}
              className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {oldImages.map((img, idx) => (
                <option key={img.id || idx} value={idx}>
                  #{idx + 1}: {img.caption || `Old UI Screenshot ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-emerald-700 block mb-1">
              Select After (New UI):
            </label>
            <select
              value={selectedNewIndex}
              onChange={(e) => setSelectedNewIndex(Number(e.target.value))}
              className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {newImages.map((img, idx) => (
                <option key={img.id || idx} value={idx}>
                  #{idx + 1}: {img.caption || `New UI Screenshot ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Area */}
      {viewMode === 'slider' ? (
        <div className="relative flex justify-center">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchMove={handleTouchMove}
            className="relative w-full max-w-[700px] h-[520px] sm:h-[600px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 select-none shadow-xl cursor-ew-resize"
          >
            {/* NEW UI (Underneath, Full Width) */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <img
                src={newImage.filePath}
                alt={newImage.caption || 'New UI'}
                className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-xl"
              />
              <div className="absolute top-4 right-4 z-10">
                <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-emerald-500 text-white shadow-md">
                  AFTER: {newImage.caption || 'New UI'}
                </span>
              </div>
            </div>

            {/* OLD UI (Clipped on Left Side) */}
            <div
              className="absolute inset-0 overflow-hidden flex items-center justify-center p-4 bg-slate-900"
              style={{ width: `${sliderPosition}%` }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center p-4"
                style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
              >
                <img
                  src={oldImage.filePath}
                  alt={oldImage.caption || 'Old UI'}
                  className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-xl opacity-90"
                />
              </div>
              <div className="absolute top-4 left-4 z-10">
                <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-rose-500 text-white shadow-md">
                  BEFORE: {oldImage.caption || 'Old UI'}
                </span>
              </div>
            </div>

            {/* Draggable Divider Handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl z-20 cursor-ew-resize"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white text-blue-600 border-2 border-blue-600 shadow-lg flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Side by Side View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center bg-slate-900 rounded-2xl p-4 border border-rose-900/30">
            <div className="w-full flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 text-xs font-bold uppercase rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                BEFORE (OLD UI)
              </span>
              <span className="text-xs text-slate-400 truncate max-w-xs">{oldImage.caption}</span>
            </div>
            <div className="w-full h-[500px] flex items-center justify-center overflow-hidden">
              <img
                src={oldImage.filePath}
                alt={oldImage.caption || 'Old UI'}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center bg-slate-900 rounded-2xl p-4 border border-emerald-900/30">
            <div className="w-full flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 text-xs font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                AFTER (NEW UI)
              </span>
              <span className="text-xs text-slate-400 truncate max-w-xs">{newImage.caption}</span>
            </div>
            <div className="w-full h-[500px] flex items-center justify-center overflow-hidden">
              <img
                src={newImage.filePath}
                alt={newImage.caption || 'New UI'}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Old UI: {oldImage.caption || 'Previous version'}</span>
        <span>New UI: {newImage.caption || 'Improved version'}</span>
      </div>
    </div>
  );
}
