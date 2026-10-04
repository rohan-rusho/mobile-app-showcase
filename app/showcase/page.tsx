'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Filter, Smartphone, Plus, Loader2 } from 'lucide-react';
import ProjectCard from '@/components/ProjectCard';

interface ProjectListItem {
  id: number;
  serialNumber: string;
  appName: string;
  title: string;
  shortDescription?: string | null;
  categories?: string[];
  changeCount: number;
  imageCount: number;
  status: string;
  thumbnailPath?: string | null;
}

interface StatsData {
  totalProjects: number;
  publishedProjects: number;
  draftProjects: number;
  totalScreenshots: number;
  totalChanges: number;
  totalFeatures: number;
}

export default function ShowcasePage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; projectCount: number }>>([]);
  
  // Loading states: initial skeleton vs background fetch
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Filters with 300ms debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedApp, setSelectedApp] = useState('all');
  const [sortBy, setSortBy] = useState('serial');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch data with AbortController cancellation for stale requests
  useEffect(() => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function fetchData() {
      setIsFetching(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        params.append('status', 'Published');
        params.append('sort', sortBy);

        const [projRes, statsRes, catRes] = await Promise.all([
          fetch(`/api/projects?${params.toString()}`, { signal: controller.signal }).then(r => r.json()),
          fetch('/api/stats', { signal: controller.signal }).then(r => r.json()),
          fetch('/api/categories', { signal: controller.signal }).then(r => r.json())
        ]);

        let filtered = Array.isArray(projRes) ? projRes : [];
        if (selectedApp !== 'all') {
          filtered = filtered.filter(p => p.appName.toLowerCase() === selectedApp.toLowerCase());
        }

        setProjects(filtered);
        setStats(statsRes);
        setCategories(Array.isArray(catRes) ? catRes : []);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to load showcase data:', err);
        }
      } finally {
        setIsFetching(false);
        setIsInitialLoading(false);
      }
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [debouncedSearch, selectedCategory, selectedApp, sortBy]);

  const uniqueApps = Array.from(new Set(projects.map(p => p.appName))).filter(Boolean);
  const hasAnyPublishedProjects = stats && stats.publishedProjects > 0;
  const isFilterActive = Boolean(debouncedSearch || selectedCategory !== 'all' || selectedApp !== 'all');

  return (
    <div className="min-h-screen pb-16">
      
      {/* Clean Hero Header */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-12 pb-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Mobile App Development Showcase
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed max-w-3xl">
              Documented mobile application development work, UI redesigns, features, and technical implementations.
            </p>
          </div>

          {/* Dynamic Statistics Strip - Only displayed when published projects exist */}
          {hasAnyPublishedProjects && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 transition-colors">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {stats.publishedProjects}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                  Published Projects
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 transition-colors">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalChanges}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                  Documented Changes
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 transition-colors">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.totalScreenshots}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                  Screenshots
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 transition-colors">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.totalFeatures}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                  Features Delivered
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Filter and Search Bar (Visible when there are published projects or when searching) */}
      {(hasAnyPublishedProjects || isFilterActive) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 transition-colors">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search app name, title, features, changes..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                />
                {isFetching && (
                  <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {/* Filters dropdowns */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {uniqueApps.length > 1 && (
                  <select
                    value={selectedApp}
                    onChange={(e) => setSelectedApp(e.target.value)}
                    className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Applications</option>
                    {uniqueApps.map((app, idx) => (
                      <option key={idx} value={app}>{app}</option>
                    ))}
                  </select>
                )}

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="serial">Sort: Serial Number</option>
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="name">Sort: App Name</option>
                  <option value="recentlyUpdated">Sort: Recently Updated</option>
                </select>
              </div>
            </div>

            {/* Category Chips */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1 flex-shrink-0">
                  <Filter className="w-3 h-3" /> Categories:
                </span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-slate-900 dark:bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.name ? 'all' : cat.name)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory.toLowerCase() === cat.name.toLowerCase()
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.name} {cat.projectCount > 0 && <span className="opacity-70 text-[10px]">({cat.projectCount})</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Projects Grid Display (with reserved minimum height to prevent layout jumps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 min-h-[420px]">
        {isInitialLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-slate-500 mt-3 font-medium">Loading showcase projects...</p>
          </div>
        ) : projects.length === 0 ? (
          /* Empty State - only shown after loading finishes */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto my-12 shadow-sm transition-opacity duration-200">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-7 h-7" />
            </div>

            {isFilterActive ? (
              <>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Projects Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  No projects match your current search query or filter selection.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setSearchInput('');
                      setSelectedCategory('all');
                      setSelectedApp('all');
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">No projects available yet.</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  Add your mobile application development projects through the Admin Panel to display them here.
                </p>
                <div className="mt-6">
                  <Link
                    href="/admin/projects/new"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Project</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Card Grid: fades slightly while fetching without unmounting or flickering */
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 motion-reduce:transition-none ${
              isFetching ? 'opacity-60' : 'opacity-100'
            }`}
          >
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
