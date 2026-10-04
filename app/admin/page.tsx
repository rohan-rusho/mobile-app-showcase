'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Copy,
  Search,
  MoveUp,
  MoveDown,
  Layers,
  Image as ImageIcon,
  CheckCircle,
  ExternalLink,
  Download,
  Upload,
  Smartphone,
  Loader2
} from 'lucide-react';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import DuplicateModal from '@/components/DuplicateModal';
import ImportExportModal from '@/components/ImportExportModal';

interface ProjectRow {
  id: number;
  serialNumber: string;
  appName: string;
  title: string;
  shortDescription?: string | null;
  status: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  categories: string[];
  changeCount: number;
  featureCount: number;
  imageCount: number;
}

interface StatsData {
  totalProjects: number;
  publishedProjects: number;
  draftProjects: number;
  totalScreenshots: number;
}

export default function AdminPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  
  // Loading states: initial skeleton vs background fetch
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Search & Filter with 300ms debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('custom');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; project: ProjectRow | null }>({
    isOpen: false,
    project: null
  });
  const [duplicateModal, setDuplicateModal] = useState<{ isOpen: boolean; project: ProjectRow | null }>({
    isOpen: false,
    project: null
  });
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch data with AbortController to cancel stale requests
  useEffect(() => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function loadData() {
      setIsFetching(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        params.append('sort', sortBy);

        const [projRes, statsRes] = await Promise.all([
          fetch(`/api/projects?${params.toString()}`, { signal: controller.signal }).then(r => r.json()),
          fetch('/api/stats', { signal: controller.signal }).then(r => r.json())
        ]);

        setProjects(Array.isArray(projRes) ? projRes : []);
        setStats(statsRes);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to load admin data:', err);
        }
      } finally {
        setIsFetching(false);
        setIsInitialLoading(false);
      }
    }

    loadData();

    return () => {
      controller.abort();
    };
  }, [debouncedSearch, statusFilter, sortBy]);

  const refreshData = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('sort', sortBy);

      const [projRes, statsRes] = await Promise.all([
        fetch(`/api/projects?${params.toString()}`).then(r => r.json()),
        fetch('/api/stats').then(r => r.json())
      ]);

      setProjects(Array.isArray(projRes) ? projRes : []);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to refresh admin data:', err);
    }
  };

  // Reorder projects
  const moveProject = async (index: number, direction: number) => {
    const newProjects = [...projects];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newProjects.length) return;

    const temp = newProjects[index];
    newProjects[index] = newProjects[targetIndex];
    newProjects[targetIndex] = temp;

    setProjects(newProjects);

    try {
      await fetch('/api/projects/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newProjects.map(p => p.id) })
      });
    } catch (err) {
      console.error('Reorder error:', err);
      refreshData();
    }
  };

  // Status update
  const handleStatusChange = async (projectId: number, newStatus: string) => {
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setProjects(prev =>
        prev.map(p => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
      // Refresh stats
      fetch('/api/stats')
        .then(r => r.json())
        .then(s => setStats(s))
        .catch(() => {});
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  // Delete project
  const confirmDelete = async () => {
    if (!deleteModal.project) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/projects/${deleteModal.project.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== deleteModal.project?.id));
        setDeleteModal({ isOpen: false, project: null });
        fetch('/api/stats')
          .then(r => r.json())
          .then(s => setStats(s))
          .catch(() => {});
      } else {
        alert('Failed to delete project');
      }
    } catch (err) {
      console.error('Delete error', err);
      alert('Error deleting project');
    } finally {
      setActionLoading(false);
    }
  };

  // Duplicate project
  const confirmDuplicate = async (projectId: number, includeImages: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeImages })
      });
      if (res.ok) {
        setDuplicateModal({ isOpen: false, project: null });
        refreshData();
      } else {
        alert('Failed to duplicate project');
      }
    } catch (err) {
      console.error('Duplicate error', err);
      alert('Error duplicating project');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Admin Top Dashboard Header */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  Mobile App Showcase
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Admin Panel
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Internal project documentation &amp; presentation management
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/showcase"
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>View Showcase</span>
              </Link>

              <button
                onClick={() => setBackupModalOpen(true)}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                title="Backup or Restore Showcase Database"
              >
                <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>Data Backup</span>
              </button>

              <Link
                href="/admin/projects/new"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Project</span>
              </Link>
            </div>
          </div>

          {/* Dynamic Summary Cards (All start at 0) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-8">
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 transition-colors">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Projects</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {stats?.totalProjects ?? 0}
              </div>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-4 transition-colors">
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Published</div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                {stats?.publishedProjects ?? 0}
              </div>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl p-4 transition-colors">
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Drafts</div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                {stats?.draftProjects ?? 0}
              </div>
            </div>

            <div className="bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 rounded-xl p-4 transition-colors">
              <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Total Images</div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                {stats?.totalScreenshots ?? 0}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Table / Grid Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 min-h-[400px]">
        
        {/* Table Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by app, title, or description..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-colors"
            />
            {isFetching && (
              <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Archived">Archived</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="custom">Custom Order</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">App Name</option>
              <option value="recentlyUpdated">Recently Updated</option>
            </select>
          </div>
        </div>

        {/* Project Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
          {isInitialLoading ? (
            <div className="py-16 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading project directory...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-16 text-center transition-opacity duration-200">
              <Smartphone className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                {debouncedSearch || statusFilter !== 'all' ? 'No projects match your search.' : 'No projects yet.'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {debouncedSearch || statusFilter !== 'all' ? 'Try adjusting your search criteria.' : 'Add your first project to start building your work showcase.'}
              </p>
              <Link
                href="/admin/projects/new"
                className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Project</span>
              </Link>
            </div>
          ) : (
            <div className={`overflow-x-auto transition-opacity duration-200 motion-reduce:transition-none ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3.5 px-3 w-16 text-center">Reorder</th>
                    <th className="py-3.5 px-3 w-14 text-center">#</th>
                    <th className="py-3.5 px-4 min-w-[150px] whitespace-nowrap">Application</th>
                    <th className="py-3.5 px-4">Project Title &amp; Description</th>
                    <th className="py-3.5 px-3 w-24 text-center">Screenshots</th>
                    <th className="py-3.5 px-3 w-24 text-center">Changes</th>
                    <th className="py-3.5 px-4 w-36">Status</th>
                    <th className="py-3.5 px-4 w-44 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  {projects.map((p, idx) => (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/showcase/project/${p.id}`)}
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      title="Click row to view project in showcase"
                    >
                      
                      {/* Reorder Buttons */}
                      <td className="py-3 px-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => moveProject(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-20 transition-colors"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveProject(idx, 1)}
                            disabled={idx === projects.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-20 transition-colors"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Serial Number */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                        {p.serialNumber}
                      </td>

                      {/* App Name */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md whitespace-nowrap bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
                          {p.appName}
                        </span>
                      </td>

                      {/* Title & Short Description */}
                      <td className="py-3 px-4 max-w-md">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {p.title}
                        </div>
                        {p.shortDescription && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {p.shortDescription}
                          </div>
                        )}
                      </td>

                      {/* Screenshots */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <ImageIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{p.imageCount || 0}</span>
                        </span>
                      </td>

                      {/* Changes */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                          <span>{p.changeCount || 0}</span>
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={p.status}
                          onChange={(e) => handleStatusChange(p.id, e.target.value)}
                          className="text-[11px] py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Published">Published</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* View in Showcase */}
                          <Link
                            href={`/showcase/project/${p.id}`}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors"
                            title="View in Showcase"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Edit */}
                          <Link
                            href={`/admin/projects/${p.id}/edit`}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md transition-colors"
                            title="Edit Project"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          {/* Duplicate */}
                          <button
                            onClick={() => setDuplicateModal({ isOpen: true, project: p })}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-md transition-colors"
                            title="Duplicate Project"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, project: p })}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.project && (
        <DeleteConfirmModal
          title={`Delete "${deleteModal.project.appName} - ${deleteModal.project.title}"?`}
          isDeleting={actionLoading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, project: null })}
        />
      )}

      {/* Duplicate Modal */}
      {duplicateModal.isOpen && duplicateModal.project && (
        <DuplicateModal
          project={duplicateModal.project}
          isSubmitting={actionLoading}
          onConfirm={confirmDuplicate}
          onCancel={() => setDuplicateModal({ isOpen: false, project: null })}
        />
      )}

      {/* Import / Export Backup Modal */}
      {backupModalOpen && (
        <ImportExportModal
          onClose={() => setBackupModalOpen(false)}
          onImportSuccess={refreshData}
        />
      )}

    </div>
  );
}
