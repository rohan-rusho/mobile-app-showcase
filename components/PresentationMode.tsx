'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize,
  Minimize,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';

interface ChangeItem {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  priority?: string | null;
  sortOrder: number;
}

interface FeatureItem {
  id: number;
  title: string;
  description?: string | null;
  sortOrder: number;
}

interface TechDetailItem {
  id: number;
  key: string;
  value: string;
  sortOrder: number;
}

interface ImageItem {
  id: number;
  filePath: string;
  thumbPath?: string | null;
  imageType: string;
  caption?: string | null;
  description?: string | null;
  sortOrder: number;
}

export interface PresentationProject {
  id: number;
  serialNumber: string;
  appName: string;
  title: string;
  shortDescription?: string | null;
  detailedDescription?: string | null;
  status: string;
  startedDate?: string | null;
  completedDate?: string | null;
  result?: string | null;
  categories: string[];
  changes: ChangeItem[];
  features: FeatureItem[];
  technicalDetails: TechDetailItem[];
  images: ImageItem[];
}

interface Slide {
  id: string;
  type: 'title' | 'overview' | 'changes' | 'before_after' | 'features' | 'tech' | 'result' | 'gallery';
  title: string;
  subtitle?: string;
  data: any;
  page?: number;
  totalPages?: number;
}

interface PresentationModeProps {
  project: PresentationProject;
  allProjects: Array<{ id: number; title: string; appName: string }>;
  onClose: () => void;
  onNavigateProject: (projectId: number, toLastSlide?: boolean) => void;
  startAtLastSlide?: boolean;
}

export default function PresentationMode({
  project,
  allProjects,
  onClose,
  onNavigateProject,
  startAtLastSlide = false
}: PresentationModeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // State for Before / After panel indices inside the Before-After slide
  const [oldUiIndex, setOldUiIndex] = useState(0);
  const [newUiIndex, setNewUiIndex] = useState(0);

  // Mouse inactivity timer
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number | null>(null);

  // Separate images by type
  const oldImages = project.images.filter(img => img.imageType === 'OLD_UI');
  const newImages = project.images.filter(img => img.imageType === 'NEW_UI');
  const additionalImages = project.images.filter(img => img.imageType === 'ADDITIONAL');

  // Build slide deck (skipping empty sections)
  const slides: Slide[] = [];

  // 1. Title Slide (Always present)
  slides.push({
    id: 'title',
    type: 'title',
    title: project.title,
    subtitle: `${project.appName} • Project #${project.serialNumber}`,
    data: project
  });

  // 2. Overview Slide (if short or detailed description exists)
  if (project.shortDescription || project.detailedDescription) {
    slides.push({
      id: 'overview',
      type: 'overview',
      title: 'Project Overview & Objectives',
      subtitle: project.appName,
      data: {
        short: project.shortDescription,
        detailed: project.detailedDescription
      }
    });
  }

  // 3. What I Did / Changes Slides (Paginated: 5 per slide)
  if (project.changes && project.changes.length > 0) {
    const CHUNK_SIZE = 5;
    const totalChangePages = Math.ceil(project.changes.length / CHUNK_SIZE);
    for (let i = 0; i < totalChangePages; i++) {
      const chunk = project.changes.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      slides.push({
        id: `changes-${i}`,
        type: 'changes',
        title: 'What I Did: Key Improvements & Modifications',
        subtitle: `Documented timeline of work (Page ${i + 1} of ${totalChangePages})`,
        data: chunk,
        page: i + 1,
        totalPages: totalChangePages
      });
    }
  }

  // 4. Before → After Slide (if Old or New screenshots exist)
  if (oldImages.length > 0 || newImages.length > 0) {
    slides.push({
      id: 'before_after',
      type: 'before_after',
      title: 'Before & After UI Comparison',
      subtitle: 'Previous interface vs redesigned mobile implementation',
      data: { oldImages, newImages }
    });
  }

  // 5. Features Implemented Slides (Paginated: 6 per slide)
  if (project.features && project.features.length > 0) {
    const CHUNK_SIZE = 6;
    const totalFeaturePages = Math.ceil(project.features.length / CHUNK_SIZE);
    for (let i = 0; i < totalFeaturePages; i++) {
      const chunk = project.features.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      slides.push({
        id: `features-${i}`,
        type: 'features',
        title: 'Features Delivered',
        subtitle: `Key user capabilities and functional modules (${i + 1}/${totalFeaturePages})`,
        data: chunk,
        page: i + 1,
        totalPages: totalFeaturePages
      });
    }
  }

  // 6. Technical Implementation Slide (if technical details exist)
  if (project.technicalDetails && project.technicalDetails.length > 0) {
    slides.push({
      id: 'tech',
      type: 'tech',
      title: 'Technical Implementation Details',
      subtitle: 'Architecture, libraries, databases, and platform specifications',
      data: project.technicalDetails
    });
  }

  // 7. Result / Impact Slide (if result exists)
  if (project.result && project.result.trim().length > 0) {
    // Split bullet points cleanly
    const bullets = project.result
      .split('\n')
      .map(b => b.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean);

    slides.push({
      id: 'result',
      type: 'result',
      title: 'Result & Business Impact',
      subtitle: 'Measurable outcomes, performance gains, and reception',
      data: bullets.length > 0 ? bullets : [project.result]
    });
  }

  // 8. Additional Screens (if additional screenshots exist)
  if (additionalImages.length > 0) {
    const CHUNK_SIZE = 4;
    const totalGalleryPages = Math.ceil(additionalImages.length / CHUNK_SIZE);
    for (let i = 0; i < totalGalleryPages; i++) {
      const chunk = additionalImages.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      slides.push({
        id: `gallery-${i}`,
        type: 'gallery',
        title: 'Additional Screens & User Flows',
        subtitle: `Supplementary application screens (${i + 1}/${totalGalleryPages})`,
        data: chunk,
        page: i + 1,
        totalPages: totalGalleryPages
      });
    }
  }

  // Initialize slide position (e.g. if navigated from previous project)
  useEffect(() => {
    if (startAtLastSlide && slides.length > 0) {
      setCurrentSlideIndex(slides.length - 1);
    } else {
      setCurrentSlideIndex(0);
    }
    setOldUiIndex(0);
    setNewUiIndex(0);
  }, [project.id, startAtLastSlide]);

  // Request browser Fullscreen API on mount
  useEffect(() => {
    const el = containerRef.current;
    if (el && !document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {
        // Graceful fallback to fixed full viewport overlay
        setIsFullscreen(false);
      });
    }

    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  // Preload next slide images to eliminate flashes
  useEffect(() => {
    const nextSlide = slides[currentSlideIndex + 1];
    if (nextSlide) {
      if (nextSlide.type === 'before_after') {
        const { oldImages: oi, newImages: ni } = nextSlide.data;
        if (oi?.[0]) new Image().src = oi[0].filePath;
        if (ni?.[0]) new Image().src = ni[0].filePath;
      } else if (nextSlide.type === 'gallery') {
        nextSlide.data.forEach((img: ImageItem) => {
          new Image().src = img.filePath;
        });
      }
    }
  }, [currentSlideIndex, slides]);

  // Auto-hide controls after 3s of inactivity
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // Current project indices
  const currentProjIdx = allProjects.findIndex(p => p.id === project.id);
  const prevProjectItem = currentProjIdx > 0 ? allProjects[currentProjIdx - 1] : null;
  const nextProjectItem = currentProjIdx < allProjects.length - 1 ? allProjects[currentProjIdx + 1] : null;

  // Slide navigation
  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlideIndex(prev => prev + 1);
        setIsTransitioning(false);
      }, 120);
    } else if (nextProjectItem) {
      // Go to next project's first slide
      onNavigateProject(nextProjectItem.id, false);
    }
  }, [currentSlideIndex, slides.length, nextProjectItem, onNavigateProject]);

  const goToPrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlideIndex(prev => prev - 1);
        setIsTransitioning(false);
      }, 120);
    } else if (prevProjectItem) {
      // Go to previous project's last slide
      onNavigateProject(prevProjectItem.id, true);
    }
  }, [currentSlideIndex, prevProjectItem, onNavigateProject]);

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetHideTimer();

      // Don't intercept if an input is focused
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevSlide();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (nextProjectItem) onNavigateProject(nextProjectItem.id, false);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (prevProjectItem) onNavigateProject(prevProjectItem.id, false);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleExit();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextSlide, goToPrevSlide, nextProjectItem, prevProjectItem, resetHideTimer]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goToNextSlide() : goToPrevSlide();
    }
    touchStartRef.current = null;
  };

  const activeSlide = slides[currentSlideIndex] || slides[0];

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden flex flex-col justify-between select-none"
      style={{
        backgroundColor: '#0B1220',
        color: '#F8FAFC'
      }}
    >
      {/* 1. Thin Top Progress Bar */}
      <div className="w-full h-1 bg-[#1E293B]">
        <div
          className="h-full bg-[#60A5FA] transition-all duration-300 ease-out"
          style={{
            width: `${((currentSlideIndex + 1) / slides.length) * 100}%`
          }}
        />
      </div>

      {/* 2. Top Header Bar */}
      <header className="w-full max-w-[1600px] mx-auto px-6 sm:px-12 pt-5 pb-3 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs sm:text-sm font-bold px-2.5 py-1 rounded-md bg-[#1E293B] text-[#60A5FA] border border-[#223152]">
            #{project.serialNumber}
          </span>
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#CBD5E1]">
            {project.appName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#111A2E] border border-[#223152] text-[#CBD5E1] hover:text-[#F8FAFC] hover:border-[#60A5FA] transition-all"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleExit}
            className="px-3.5 py-1.5 rounded-lg bg-[#111A2E] border border-[#223152] text-[#CBD5E1] hover:text-[#F8FAFC] hover:border-rose-500 hover:bg-rose-950/40 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Exit Presentation (ESC)"
          >
            <X className="w-4 h-4 text-rose-400" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* 3. Main Slide Content Stage */}
      <main
        className="w-full max-w-[1600px] mx-auto px-6 sm:px-12 flex-1 flex flex-col justify-center items-center overflow-y-auto pb-24 transition-opacity duration-200 motion-reduce:transition-none"
        style={{
          opacity: isTransitioning ? 0 : 1
        }}
      >
        {/* SLIDE TYPE: TITLE */}
        {activeSlide.type === 'title' && (
          <div className="w-full max-w-5xl text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111A2E] border border-[#223152] text-xs sm:text-sm font-bold text-[#60A5FA] shadow-lg">
              <Sparkles className="w-4 h-4 text-[#60A5FA]" />
              <span>Mobile Application Development Showcase</span>
            </div>

            <h1
              className="font-black tracking-tight leading-tight text-[#F8FAFC]"
              style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
            >
              {project.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="px-3 py-1 text-sm font-bold uppercase rounded-full bg-[#111A2E] text-[#4ADE80] border border-[#4ADE80]/30">
                {project.status}
              </span>
              <span className="px-3.5 py-1 text-sm font-semibold rounded-full bg-[#111A2E] text-[#CBD5E1] border border-[#223152]">
                App: {project.appName}
              </span>
              {project.completedDate && (
                <span className="px-3.5 py-1 text-sm font-semibold rounded-full bg-[#111A2E] text-[#CBD5E1] border border-[#223152]">
                  Completed: {project.completedDate}
                </span>
              )}
            </div>

            {project.categories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {project.categories.map((c, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-lg bg-[#111A2E] border border-[#223152] text-xs font-semibold text-[#CBD5E1]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SLIDE TYPE: OVERVIEW */}
        {activeSlide.type === 'overview' && (
          <div className="w-full max-w-5xl space-y-6">
            <div className="border-b border-[#223152] pb-4">
              <h2
                className="font-extrabold tracking-tight text-[#F8FAFC]"
                style={{ fontSize: 'clamp(28px, 3.5vw, 48px)' }}
              >
                {activeSlide.title}
              </h2>
              <p className="text-sm sm:text-base text-[#CBD5E1] mt-1 font-medium">
                {activeSlide.subtitle}
              </p>
            </div>

            {activeSlide.data.short && (
              <div
                className="p-6 sm:p-8 rounded-2xl bg-[#111A2E] border border-[#223152] text-[#F8FAFC] leading-relaxed shadow-lg font-medium"
                style={{ fontSize: 'clamp(18px, 2vw, 26px)' }}
              >
                {activeSlide.data.short}
              </div>
            )}

            {activeSlide.data.detailed && (
              <div
                className="p-6 sm:p-8 rounded-2xl bg-[#111A2E]/80 border border-[#223152] text-[#CBD5E1] leading-relaxed whitespace-pre-line"
                style={{ fontSize: 'clamp(16px, 1.8vw, 22px)' }}
              >
                {activeSlide.data.detailed}
              </div>
            )}
          </div>
        )}

        {/* SLIDE TYPE: CHANGES / WHAT I DID */}
        {activeSlide.type === 'changes' && (
          <div className="w-full max-w-5xl space-y-6">
            <div className="border-b border-[#223152] pb-4 flex items-center justify-between">
              <div>
                <h2
                  className="font-extrabold tracking-tight text-[#F8FAFC]"
                  style={{ fontSize: 'clamp(26px, 3vw, 44px)' }}
                >
                  {activeSlide.title}
                </h2>
                <p className="text-sm sm:text-base text-[#CBD5E1] mt-1 font-medium">
                  {activeSlide.subtitle}
                </p>
              </div>
              <span className="font-mono text-sm font-bold px-3 py-1 rounded-full bg-[#111A2E] text-[#4ADE80] border border-[#4ADE80]/30">
                Page {activeSlide.page} / {activeSlide.totalPages}
              </span>
            </div>

            <div className="space-y-4">
              {activeSlide.data.map((change: ChangeItem, idx: number) => {
                const itemNumber = ((activeSlide.page || 1) - 1) * 5 + idx + 1;
                return (
                  <div
                    key={change.id || idx}
                    className="p-5 sm:p-6 rounded-2xl bg-[#111A2E] border border-[#223152] shadow-md flex gap-4 sm:gap-6 items-start hover:border-[#60A5FA] transition-colors"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#60A5FA]/20 text-[#60A5FA] border border-[#60A5FA]/40 font-mono font-bold flex items-center justify-center flex-shrink-0 text-base sm:text-lg">
                      {itemNumber}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <h3
                          className="font-bold text-[#F8FAFC] leading-snug"
                          style={{ fontSize: 'clamp(18px, 2vw, 24px)' }}
                        >
                          {change.title}
                        </h3>
                        {change.priority && (
                          <span
                            className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-md border flex-shrink-0 ${
                              change.priority === 'High'
                                ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                                : change.priority === 'Medium'
                                ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {change.priority}
                          </span>
                        )}
                      </div>
                      {change.description && (
                        <p
                          className="text-[#CBD5E1] leading-relaxed"
                          style={{ fontSize: 'clamp(14px, 1.6vw, 19px)' }}
                        >
                          {change.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SLIDE TYPE: BEFORE → AFTER (SIDE BY SIDE 75vh FILLING SCREEN) */}
        {activeSlide.type === 'before_after' && (
          <div className="w-full h-full flex flex-col justify-center space-y-3">
            <div className="flex items-center justify-between px-2">
              <div>
                <h2
                  className="font-extrabold tracking-tight text-[#F8FAFC]"
                  style={{ fontSize: 'clamp(22px, 2.5vw, 36px)' }}
                >
                  {activeSlide.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#CBD5E1] font-medium">
                  {activeSlide.subtitle}
                </p>
              </div>
            </div>

            {/* Panels Container */}
            <div
              className={`grid gap-6 w-full ${
                oldImages.length > 0 && newImages.length > 0
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1 max-w-4xl mx-auto'
              }`}
            >
              {/* Left Panel: OLD UI */}
              {oldImages.length > 0 && (
                <div className="flex flex-col bg-[#111A2E] rounded-2xl border border-rose-900/60 overflow-hidden shadow-2xl">
                  {/* Panel Header */}
                  <div className="px-4 py-2.5 bg-[#0B1220] border-b border-[#223152] flex items-center justify-between">
                    <span className="px-3 py-0.5 text-xs font-bold uppercase rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                      Before — Old UI
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#CBD5E1]">
                        {oldUiIndex + 1} / {oldImages.length}
                      </span>
                      {oldImages.length > 1 && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setOldUiIndex(prev => (prev === 0 ? oldImages.length - 1 : prev - 1))
                            }
                            className="p-1 rounded bg-[#1E293B] text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#334155]"
                            title="Previous Old UI Image"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setOldUiIndex(prev => (prev === oldImages.length - 1 ? 0 : prev + 1))
                            }
                            className="p-1 rounded bg-[#1E293B] text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#334155]"
                            title="Next Old UI Image"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Stage: up to 65vh */}
                  <div className="h-[52vh] sm:h-[62vh] w-full bg-[#050811] flex items-center justify-center p-3 overflow-hidden">
                    <img
                      src={oldImages[oldUiIndex].filePath}
                      alt={oldImages[oldUiIndex].caption || 'Old UI'}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Caption */}
                  <div className="p-3 bg-[#111A2E] border-t border-[#223152]">
                    <div className="font-bold text-sm text-[#F8FAFC] truncate">
                      {oldImages[oldUiIndex].caption || `Old UI Screen #${oldUiIndex + 1}`}
                    </div>
                    {oldImages[oldUiIndex].description && (
                      <p className="text-xs text-[#CBD5E1] mt-0.5 line-clamp-1">
                        {oldImages[oldUiIndex].description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Right Panel: NEW UI */}
              {newImages.length > 0 && (
                <div className="flex flex-col bg-[#111A2E] rounded-2xl border border-emerald-900/60 overflow-hidden shadow-2xl">
                  {/* Panel Header */}
                  <div className="px-4 py-2.5 bg-[#0B1220] border-b border-[#223152] flex items-center justify-between">
                    <span className="px-3 py-0.5 text-xs font-bold uppercase rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                      After — New UI
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#CBD5E1]">
                        {newUiIndex + 1} / {newImages.length}
                      </span>
                      {newImages.length > 1 && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setNewUiIndex(prev => (prev === 0 ? newImages.length - 1 : prev - 1))
                            }
                            className="p-1 rounded bg-[#1E293B] text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#334155]"
                            title="Previous New UI Image"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setNewUiIndex(prev => (prev === newImages.length - 1 ? 0 : prev + 1))
                            }
                            className="p-1 rounded bg-[#1E293B] text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#334155]"
                            title="Next New UI Image"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Stage: up to 65vh */}
                  <div className="h-[52vh] sm:h-[62vh] w-full bg-[#050811] flex items-center justify-center p-3 overflow-hidden">
                    <img
                      src={newImages[newUiIndex].filePath}
                      alt={newImages[newUiIndex].caption || 'New UI'}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Caption */}
                  <div className="p-3 bg-[#111A2E] border-t border-[#223152]">
                    <div className="font-bold text-sm text-[#F8FAFC] truncate">
                      {newImages[newUiIndex].caption || `New UI Screen #${newUiIndex + 1}`}
                    </div>
                    {newImages[newUiIndex].description && (
                      <p className="text-xs text-[#CBD5E1] mt-0.5 line-clamp-1">
                        {newImages[newUiIndex].description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SLIDE TYPE: FEATURES */}
        {activeSlide.type === 'features' && (
          <div className="w-full max-w-6xl space-y-6">
            <div className="border-b border-[#223152] pb-4 flex items-center justify-between">
              <div>
                <h2
                  className="font-extrabold tracking-tight text-[#F8FAFC]"
                  style={{ fontSize: 'clamp(26px, 3vw, 44px)' }}
                >
                  {activeSlide.title}
                </h2>
                <p className="text-sm sm:text-base text-[#CBD5E1] mt-1 font-medium">
                  {activeSlide.subtitle}
                </p>
              </div>
              <span className="font-mono text-sm font-bold px-3 py-1 rounded-full bg-[#111A2E] text-[#60A5FA] border border-[#60A5FA]/30">
                Page {activeSlide.page} / {activeSlide.totalPages}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSlide.data.map((feat: FeatureItem, idx: number) => (
                <div
                  key={feat.id || idx}
                  className="p-6 rounded-2xl bg-[#111A2E] border border-[#223152] shadow-lg flex flex-col justify-between space-y-3 hover:border-[#60A5FA] transition-colors"
                >
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-[#60A5FA]/20 text-[#60A5FA] flex items-center justify-center font-bold text-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3
                      className="font-bold text-[#F8FAFC] leading-snug"
                      style={{ fontSize: 'clamp(18px, 1.8vw, 22px)' }}
                    >
                      {feat.title}
                    </h3>
                  </div>
                  {feat.description && (
                    <p
                      className="text-[#CBD5E1] leading-relaxed"
                      style={{ fontSize: 'clamp(14px, 1.5vw, 17px)' }}
                    >
                      {feat.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE TYPE: TECHNICAL IMPLEMENTATION */}
        {activeSlide.type === 'tech' && (
          <div className="w-full max-w-5xl space-y-6">
            <div className="border-b border-[#223152] pb-4">
              <h2
                className="font-extrabold tracking-tight text-[#F8FAFC]"
                style={{ fontSize: 'clamp(26px, 3vw, 44px)' }}
              >
                {activeSlide.title}
              </h2>
              <p className="text-sm sm:text-base text-[#CBD5E1] mt-1 font-medium">
                {activeSlide.subtitle}
              </p>
            </div>

            <div className="rounded-2xl bg-[#111A2E] border border-[#223152] overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0B1220] border-b border-[#223152] text-[#60A5FA] uppercase tracking-wider text-xs sm:text-sm font-bold">
                    <th className="py-4 px-6 w-1/3">Area / Component</th>
                    <th className="py-4 px-6 w-2/3">Implementation Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#223152]">
                  {activeSlide.data.map((td: TechDetailItem, idx: number) => (
                    <tr
                      key={td.id || idx}
                      className="hover:bg-[#1E293B]/40 transition-colors"
                    >
                      <td
                        className="py-4 px-6 font-bold text-[#F8FAFC] align-top"
                        style={{ fontSize: 'clamp(16px, 1.8vw, 22px)' }}
                      >
                        {td.key}
                      </td>
                      <td
                        className="py-4 px-6 text-[#CBD5E1] font-mono leading-relaxed"
                        style={{ fontSize: 'clamp(15px, 1.7vw, 20px)' }}
                      >
                        {td.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SLIDE TYPE: RESULT & IMPACT */}
        {activeSlide.type === 'result' && (
          <div className="w-full max-w-5xl space-y-6">
            <div className="border-b border-[#223152] pb-4">
              <h2
                className="font-extrabold tracking-tight text-[#F8FAFC]"
                style={{ fontSize: 'clamp(26px, 3vw, 44px)' }}
              >
                {activeSlide.title}
              </h2>
              <p className="text-sm sm:text-base text-[#CBD5E1] mt-1 font-medium">
                {activeSlide.subtitle}
              </p>
            </div>

            <div className="space-y-4">
              {activeSlide.data.map((bullet: string, idx: number) => (
                <div
                  key={idx}
                  className="p-6 sm:p-7 rounded-2xl bg-[#111A2E] border border-[#223152] shadow-lg flex items-start gap-5 hover:border-[#4ADE80] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#4ADE80]/20 text-[#4ADE80] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p
                    className="text-[#F8FAFC] font-medium leading-relaxed"
                    style={{ fontSize: 'clamp(18px, 2.2vw, 26px)' }}
                  >
                    {bullet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE TYPE: ADDITIONAL SCREENS GALLERY */}
        {activeSlide.type === 'gallery' && (
          <div className="w-full max-w-6xl space-y-6">
            <div className="border-b border-[#223152] pb-4 flex items-center justify-between">
              <div>
                <h2
                  className="font-extrabold tracking-tight text-[#F8FAFC]"
                  style={{ fontSize: 'clamp(26px, 3vw, 44px)' }}
                >
                  {activeSlide.title}
                </h2>
                <p className="text-sm sm:text-base text-[#CBD5E1] mt-1 font-medium">
                  {activeSlide.subtitle}
                </p>
              </div>
              <span className="font-mono text-sm font-bold px-3 py-1 rounded-full bg-[#111A2E] text-[#60A5FA] border border-[#60A5FA]/30">
                Page {activeSlide.page} / {activeSlide.totalPages}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activeSlide.data.map((img: ImageItem, idx: number) => (
                <div
                  key={img.id || idx}
                  className="bg-[#111A2E] rounded-2xl border border-[#223152] overflow-hidden shadow-lg flex flex-col justify-between"
                >
                  <div className="h-[40vh] sm:h-[48vh] bg-[#050811] flex items-center justify-center p-2">
                    <img
                      src={img.filePath}
                      alt={img.caption || 'Screen'}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="p-3 bg-[#111A2E] border-t border-[#223152]">
                    <div className="font-bold text-xs text-[#F8FAFC] truncate">
                      {img.caption || `Screen #${idx + 1}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 4. Bottom Floating Control Bar (Auto-hiding, Non-overlapping) */}
      <footer
        onMouseEnter={() => {
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          setControlsVisible(true);
        }}
        onMouseLeave={resetHideTimer}
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="px-5 py-3 rounded-2xl bg-[#111A2E]/90 border border-[#223152] shadow-2xl backdrop-blur-md flex items-center gap-4 text-xs font-semibold text-[#CBD5E1]">
          {/* Previous Slide Button */}
          <button
            type="button"
            onClick={goToPrevSlide}
            disabled={currentSlideIndex === 0 && !prevProjectItem}
            className="p-1.5 rounded-lg bg-[#1E293B] text-[#F8FAFC] hover:bg-[#60A5FA] hover:text-[#0B1220] disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1"
            title="Previous Slide (←)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Slide Progress Counter */}
          <div className="px-2 font-mono font-bold text-[#F8FAFC]">
            Slide {currentSlideIndex + 1} of {slides.length}
          </div>

          {/* Next Slide Button */}
          <button
            type="button"
            onClick={goToNextSlide}
            disabled={currentSlideIndex === slides.length - 1 && !nextProjectItem}
            className="p-1.5 rounded-lg bg-[#1E293B] text-[#F8FAFC] hover:bg-[#60A5FA] hover:text-[#0B1220] disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1"
            title="Next Slide (→ / Space)"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-[#223152]" />

          {/* Project Progress */}
          <div className="text-[11px] text-[#CBD5E1] hidden sm:block">
            Project <span className="text-[#60A5FA] font-bold">{currentProjIdx + 1}</span> of {allProjects.length}
          </div>

          <div className="h-4 w-px bg-[#223152] hidden sm:block" />

          {/* Quick Exit */}
          <button
            type="button"
            onClick={handleExit}
            className="px-2.5 py-1 rounded-md bg-[#1E293B] hover:bg-rose-900/60 hover:text-rose-200 text-[#CBD5E1] text-[11px] font-bold transition-all"
          >
            Exit (ESC)
          </button>
        </div>
      </footer>
    </div>
  );
}
