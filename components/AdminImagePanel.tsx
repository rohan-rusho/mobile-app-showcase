'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  GripVertical,
  Loader2
} from 'lucide-react';

export interface ImageItem {
  id: number;
  filePath: string;
  thumbPath?: string | null;
  imageType: string;
  caption?: string | null;
  description?: string | null;
  sortOrder: number;
  isUploading?: boolean;
}

interface AdminImagePanelProps {
  title: string;
  badgeLabel: string;
  imageType: 'OLD_UI' | 'NEW_UI' | 'ADDITIONAL';
  theme: 'rose' | 'emerald' | 'purple';
  emptyHint: string;
  images: ImageItem[];
  onFilesSelected: (files: File[], imageType: 'OLD_UI' | 'NEW_UI' | 'ADDITIONAL') => void;
  onDeleteImage: (id: number) => void;
  onReplaceImage: (id: number, imageType: string, file: File) => void;
  onUpdateMeta: (id: number, field: string, value: string) => void;
  onReorderImages?: (reordered: ImageItem[]) => void;
}

export default function AdminImagePanel({
  title,
  badgeLabel,
  imageType,
  theme,
  emptyHint,
  images,
  onFilesSelected,
  onDeleteImage,
  onReplaceImage,
  onUpdateMeta,
  onReorderImages
}: AdminImagePanelProps) {
  const [isDropzoneHovered, setIsDropzoneHovered] = useState(false);
  const [items, setItems] = useState<ImageItem[]>(images);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const isDraggingCardRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal items whenever images prop changes, unless user is currently actively dragging
  useEffect(() => {
    if (!isDraggingCardRef.current) {
      setItems(images);
    }
  }, [images]);

  // Theme configuration
  const themeClasses = {
    rose: {
      border: 'border-rose-200/90 dark:border-rose-900/60 hover:border-rose-300 dark:hover:border-rose-700',
      badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      dropActive: 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white',
      ring: 'focus:ring-rose-500'
    },
    emerald: {
      border: 'border-emerald-200/90 dark:border-emerald-900/60 hover:border-emerald-300 dark:hover:border-emerald-700',
      badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      dropActive: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      ring: 'focus:ring-emerald-500'
    },
    purple: {
      border: 'border-purple-200/90 dark:border-purple-900/60 hover:border-purple-300 dark:hover:border-purple-700',
      badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      dropActive: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30',
      btn: 'bg-purple-600 hover:bg-purple-700 text-white',
      ring: 'focus:ring-purple-500'
    }
  }[theme];

  // Dropzone drag & drop
  const handleDropzoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropzoneHovered(true);
  };

  const handleDropzoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropzoneHovered(false);
  };

  const handleDropzoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropzoneHovered(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      onFilesSelected(files, imageType);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      onFilesSelected(files, imageType);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReplaceFile = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReplaceImage(id, imageType, file);
    }
  };

  // Instant Live Reorganization via Drag and Drop
  const handleCardDragStart = (e: React.DragEvent, index: number) => {
    isDraggingCardRef.current = true;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleCardDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex === null || draggedIndex === targetIndex) return;

    // Instantly shift items in state so background cards immediately move!
    setItems((prevItems) => {
      const updated = [...prevItems];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
    setDraggedIndex(targetIndex);
  };

  const handleCardDragEnd = () => {
    isDraggingCardRef.current = false;
    setDraggedIndex(null);
    if (onReorderImages) {
      onReorderImages(items);
    }
  };

  const handleCardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    isDraggingCardRef.current = false;
    setDraggedIndex(null);
    if (onReorderImages) {
      onReorderImages(items);
    }
  };

  const handleLocalMetaUpdate = (id: number, field: string, val: string) => {
    setItems(prev => prev.map(img => img.id === id ? { ...img, [field]: val } : img));
    onUpdateMeta(id, field, val);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${themeClasses.border} p-5 shadow-xs flex flex-col justify-between transition-all`}>
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full border ${themeClasses.badge}`}>
              {badgeLabel}
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
          </div>

          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
            {items.length} {items.length === 1 ? 'image' : 'images'}
          </span>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDropzoneDragOver}
          onDragLeave={handleDropzoneDragLeave}
          onDrop={handleDropzoneDrop}
          className={`p-6 border-2 border-dashed rounded-xl text-center transition-all ${
            isDropzoneHovered
              ? themeClasses.dropActive
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/60 dark:bg-slate-800/40'
          }`}
        >
          <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {emptyHint}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            JPG, JPEG, PNG, WEBP (Auto-upload upon select)
          </p>

          <label className={`inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-all ${themeClasses.btn}`}>
            <Upload className="w-3.5 h-3.5" />
            <span>Choose Files</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Uploaded & Uploading Images Grid (2 photos per row, scrollable after 4 photos) */}
        {items.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {badgeLabel} Screenshots ({items.length})
              </h5>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                Drag cards to reorder • Instant live rearrangement
              </span>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${
              items.length > 4 ? 'max-h-[580px] overflow-y-auto pr-1' : ''
            }`}>
              {items.map((img, idx) => (
                <div
                  key={img.id}
                  draggable={!img.isUploading}
                  onDragStart={(e) => handleCardDragStart(e, idx)}
                  onDragOver={(e) => handleCardDragOver(e, idx)}
                  onDragEnd={handleCardDragEnd}
                  onDrop={handleCardDrop}
                  className={`p-3 rounded-xl border transition-all duration-200 bg-white dark:bg-slate-800/80 shadow-xs group flex flex-col justify-between overflow-hidden select-none ${
                    draggedIndex === idx
                      ? 'opacity-40 border-dashed border-blue-500 scale-[0.98] ring-2 ring-blue-400/50'
                      : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {/* Top Header: Icon-only controls, neatly contained inside card, NO ARROWS */}
                  <div className="flex items-center justify-between gap-1 pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-700/80">
                    {/* Index + Drag Handle */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                        #{idx + 1}
                      </span>
                      <span
                        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 select-none transition-colors flex items-center justify-center"
                        title="Drag to place anywhere (cards shift instantly)"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      </span>
                    </div>

                    {/* Action Buttons: Replace / Delete (ALL ICON ONLY, NO ARROWS) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Replace Button (ICON ONLY) */}
                      {!img.isUploading && (
                        <label
                          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/80 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-600 hover:border-blue-200 dark:hover:border-blue-500"
                          title="Replace this image with another file"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300" />
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            onChange={(e) => handleReplaceFile(img.id, e)}
                            className="hidden"
                          />
                        </label>
                      )}

                      {/* Delete Option (ICON ONLY) */}
                      <button
                        type="button"
                        onClick={() => onDeleteImage(img.id)}
                        className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white border border-rose-200 dark:border-rose-800 hover:border-rose-600 flex items-center justify-center transition-all shadow-2xs"
                        title="Delete this screenshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Content: Preview Thumbnail + Captions (Modification Style) */}
                  <div className="flex gap-2.5 items-start flex-1 min-w-0">
                    {/* Thumbnail Preview */}
                    <div className="w-20 sm:w-24 h-28 sm:h-32 rounded-lg bg-slate-950 shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs relative">
                      <img
                        src={img.thumbPath || img.filePath}
                        alt={img.caption || ''}
                        className={`max-h-full max-w-full object-contain transition-opacity duration-200 ${
                          img.isUploading ? 'opacity-40' : 'opacity-100'
                        }`}
                      />

                      {/* In-Place Uploading State in Modification Card */}
                      {img.isUploading && (
                        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-2xs flex flex-col items-center justify-center gap-1.5 p-1 text-center">
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                          <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                            Uploading...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadata Inputs (Modification Style) */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5 truncate">
                          Caption
                        </label>
                        <input
                          type="text"
                          value={img.caption || ''}
                          onChange={(e) => handleLocalMetaUpdate(img.id, 'caption', e.target.value)}
                          placeholder="Short title / label..."
                          className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5 truncate">
                          Description (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={img.description || ''}
                          onChange={(e) => handleLocalMetaUpdate(img.id, 'description', e.target.value)}
                          placeholder="Describe improvements..."
                          className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 leading-relaxed resize-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
