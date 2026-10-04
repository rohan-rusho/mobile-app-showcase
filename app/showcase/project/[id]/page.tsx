'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Layers,
  Sparkles,
  Printer,
  Edit3,
  Maximize,
  Minimize,
  CheckCircle2,
  TrendingUp,
  Cpu
} from 'lucide-react';
import ComparisonSlider from '@/components/ComparisonSlider';
import SideBySideViewer from '@/components/SideBySideViewer';
import Lightbox from '@/components/Lightbox';
import Timeline from '@/components/Timeline';
import PresentationMode from '@/components/PresentationMode';

interface ProjectDetail {
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
  changes: Array<{
    id: number;
    title: string;
    description?: string | null;
    category?: string | null;
    priority?: string | null;
    sortOrder: number;
  }>;
  features: Array<{
    id: number;
    title: string;
    description?: string | null;
    sortOrder: number;
  }>;
  technicalDetails: Array<{
    id: number;
    key: string;
    value: string;
    sortOrder: number;
  }>;
  images: Array<{
    id: number;
    filePath: string;
    thumbPath?: string | null;
    imageType: string;
    caption?: string | null;
    description?: string | null;
    sortOrder: number;
  }>;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [allProjects, setAllProjects] = useState<Array<{ id: number; title: string; appName: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Lightbox State
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    images: any[];
    index: number;
  }>({ isOpen: false, images: [], index: 0 });

  // Presentation Mode State
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [presentationStartAtLast, setPresentationStartAtLast] = useState(false);
  const [savedScrollPos, setSavedScrollPos] = useState(0);

  const handleOpenPresentation = () => {
    setSavedScrollPos(window.scrollY);
    setPresentationStartAtLast(false);
    setIsPresentationMode(true);
  };

  const handleClosePresentation = () => {
    setIsPresentationMode(false);
    setTimeout(() => {
      window.scrollTo(0, savedScrollPos);
    }, 50);
  };

  const handleNavigatePresentationProject = async (targetId: number, toLastSlide?: boolean) => {
    try {
      const res = await fetch(`/api/projects/${targetId}`).then(r => r.json());
      if (res && !res.error) {
        setProject(res);
        setPresentationStartAtLast(!!toLastSlide);
        window.history.pushState(null, '', `/showcase/project/${targetId}`);
      }
    } catch (err) {
      console.error('Failed to navigate presentation project:', err);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [projRes, listRes] = await Promise.all([
          fetch(`/api/projects/${id}`).then(r => r.json()),
          fetch('/api/projects?status=Published').then(r => r.json())
        ]);

        if (projRes.error) {
          setProject(null);
        } else {
          setProject(projRes);
        }
        setAllProjects(Array.isArray(listRes) ? listRes : []);
      } catch (err) {
        console.error('Error fetching project case study:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
    window.scrollTo(0, 0);
  }, [id]);

  // Previous & Next projects
  const currentIndex = allProjects.findIndex(p => String(p.id) === String(id));
  const prevProject = currentIndex > 0 ? allProjects[currentIndex - 1] : null;
  const nextProject = currentIndex >= 0 && currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : null;

  // Keyboard navigation for normal page
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxState.isOpen || isPresentationMode) return;

    if (e.key === 'ArrowLeft' && prevProject) {
      router.push(`/showcase/project/${prevProject.id}`);
    } else if (e.key === 'ArrowRight' && nextProject) {
      router.push(`/showcase/project/${nextProject.id}`);
    }
  }, [lightboxState.isOpen, isPresentationMode, prevProject, nextProject, router]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading project case study...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Project Not Found</h2>
          <p className="text-xs text-slate-500 mt-2">The project you requested does not exist or has been removed.</p>
          <Link href="/showcase" className="inline-block mt-5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white">
            Back to Showcase
          </Link>
        </div>
      </div>
    );
  }

  // Filter images by type
  const oldImages = project.images.filter(img => img.imageType === 'OLD_UI');
  const newImages = project.images.filter(img => img.imageType === 'NEW_UI');
  const additionalImages = project.images.filter(img => img.imageType === 'ADDITIONAL');
  const hasScreenshots = project.images.length > 0;

  const openLightbox = (imgList: any[], index: number) => {
    setLightboxState({ isOpen: true, images: imgList, index });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Published</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Completed</span>;
      case 'in progress':
        return <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">In Progress</span>;
      case 'draft':
      default:
        return <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 pb-20 transition-colors">

      {/* Top Floating Action Bar (Hidden on print) */}
      <div className="no-print bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-16 z-30 py-3 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <Link
              href="/showcase"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Showcase</span>
            </Link>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

            {/* Previous Project */}
            {prevProject ? (
              <Link
                href={`/showcase/project/${prevProject.id}`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5"
                title={`Previous: ${prevProject.title}`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Previous</span>
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed flex items-center gap-1.5">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Previous</span>
              </span>
            )}

            {/* Next Project */}
            {nextProject ? (
              <Link
                href={`/showcase/project/${nextProject.id}`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5"
                title={`Next: ${nextProject.title}`}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed flex items-center gap-1.5">
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Presentation Mode Trigger */}
            <button
              onClick={handleOpenPresentation}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white shadow-xs"
              title="Full-screen presentation mode for demonstrating to your manager/boss"
            >
              <Maximize className="w-3.5 h-3.5" />
              <span>Presentation Mode</span>
            </button>

            {/* Print Friendly */}
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5"
              title="Print or save as PDF case study"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Print Project</span>
            </button>

            {/* Edit in Admin */}
            <Link
              href={`/admin/projects/${project.id}/edit`}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-1.5"
              title="Edit project in Admin"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Edit</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Case Study Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-10">
        
        {/* 1. Header Card */}
        <section className="p-8 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 card-print shadow-xs transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              {project.serialNumber && (
                <span className="px-2.5 py-1 rounded-md bg-slate-900 dark:bg-slate-800 text-white font-mono text-xs font-bold border border-transparent dark:border-slate-700">
                  PROJECT #{project.serialNumber}
                </span>
              )}
              <span className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-bold">
                {project.appName}
              </span>
              {getStatusBadge(project.status)}
            </div>

            {/* Dates */}
            {(project.startedDate || project.completedDate) && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {project.startedDate && `Started: ${project.startedDate}`}
                  {project.startedDate && project.completedDate && ' • '}
                  {project.completedDate && `Completed: ${project.completedDate}`}
                </span>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug text-slate-900 dark:text-white">
            {project.title}
          </h1>

          {/* Categories */}
          {project.categories && project.categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-1">Categories:</span>
              {project.categories.map((cat, idx) => (
                <span key={idx} className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* 2. Overview / Descriptions */}
          {project.shortDescription && (
            <div className="mt-5 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-blue-950 dark:text-blue-200 font-medium text-xs sm:text-sm leading-relaxed">
              {project.shortDescription}
            </div>
          )}

          {project.detailedDescription && (
            <div className="mt-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line border-t border-slate-100 dark:border-slate-800 pt-5">
              {project.detailedDescription}
            </div>
          )}
        </section>

        {/* 3. What I Did (Changes Timeline) */}
        {project.changes && project.changes.length > 0 && (
          <section className="p-8 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 card-print shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">What I Did</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Documented timeline of improvements and technical modifications</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {project.changes.length} {project.changes.length === 1 ? 'Change' : 'Changes'}
              </span>
            </div>

            <Timeline changes={project.changes} />
          </section>
        )}

        {/* 4, 5 & 6. Side-by-Side Comparison */}
        {hasScreenshots ? (
          <div className="space-y-8">
            {/* Side-by-Side Before / After Comparison Viewer (with slider toggle) */}
            {(oldImages.length > 0 || newImages.length > 0) && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs card-print transition-colors">
                <SideBySideViewer
                  oldImages={oldImages}
                  newImages={newImages}
                  onOpenLightbox={openLightbox}
                />
              </section>
            )}

            {/* 10. Additional Screens */}
            {additionalImages.length > 0 && (
              <section className="bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-900/60 rounded-2xl p-8 shadow-xs card-print transition-colors">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-purple-100 dark:border-purple-900/40">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Additional Screens
                    </span>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                      Workflow, Feature &amp; Technical Screenshots
                    </h3>
                  </div>
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold font-mono">
                    {additionalImages.length} {additionalImages.length === 1 ? 'Screen' : 'Screens'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {additionalImages.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      onClick={() => openLightbox(additionalImages, idx)}
                      className="group cursor-pointer rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-950 hover:border-purple-400 dark:hover:border-purple-400 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
                    >
                      <div className="h-64 flex items-center justify-center p-3 overflow-hidden">
                        <img
                          src={img.thumbPath || img.filePath}
                          alt={img.caption || 'Additional Screenshot'}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {img.caption || `Additional Screen #${idx + 1}`}
                        </div>
                        {img.description && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {img.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        ) : null}

        {/* 7. Features Implemented */}
        {project.features && project.features.length > 0 && (
          <section className="p-8 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 card-print shadow-xs transition-colors">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Features Implemented</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Key user features and capabilities delivered</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {project.features.map((feat, idx) => (
                <div key={feat.id || idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-850/50 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>{feat.title}</span>
                  </h4>
                  {feat.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed pl-6">
                      {feat.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. Technical Implementation */}
        {project.technicalDetails && project.technicalDetails.length > 0 && (
          <section className="p-8 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 card-print shadow-xs transition-colors">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Technical Implementation</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Platform specifics, architecture, and technology stack</p>
              </div>
            </div>

            <div className="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-1/3">Area / Component</th>
                    <th className="py-3 px-4">Implementation Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {project.technicalDetails.map((td, idx) => (
                    <tr key={td.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        {td.key}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {td.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 9. Result / Impact */}
        {project.result && (
          <section className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-8 shadow-xs card-print transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Result / Impact</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Measurable impact, benchmarks, and outcomes</p>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-white/80 dark:bg-slate-900/90 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
              {project.result}
            </div>
          </section>
        )}

        {/* 11. Footer Project Navigation */}
        <section className="no-print pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          {prevProject ? (
            <Link
              href={`/showcase/project/${prevProject.id}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all w-full sm:w-auto"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-slate-400">Previous Project</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{prevProject.appName} — {prevProject.title}</div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          <Link
            href="/showcase"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Back to Showcase
          </Link>

          {nextProject ? (
            <Link
              href={`/showcase/project/${nextProject.id}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all w-full sm:w-auto justify-end"
            >
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Next Project</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{nextProject.appName} — {nextProject.title}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </Link>
          ) : (
            <div />
          )}
        </section>

      </main>

      {/* Lightbox Modal */}
      {lightboxState.isOpen && (
        <Lightbox
          images={lightboxState.images}
          initialIndex={lightboxState.index}
          onClose={() => setLightboxState({ isOpen: false, images: [], index: 0 })}
        />
      )}

      {/* Dedicated Slide-Based Presentation Mode */}
      {isPresentationMode && project && (
        <PresentationMode
          project={project}
          allProjects={allProjects}
          onClose={handleClosePresentation}
          onNavigateProject={handleNavigatePresentationProject}
          startAtLastSlide={presentationStartAtLast}
        />
      )}

    </div>
  );
}
