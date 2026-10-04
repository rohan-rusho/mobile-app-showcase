'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  X,
  Check,
  ChevronDown,
  Loader2
} from 'lucide-react';
import AdminImagePanel from '@/components/AdminImagePanel';

export const DEFAULT_APP_NAMES = [
  'Tour Plan AA',
  'DL RMD (MFL)',
  'Drug Billing AA'
];

const PRESET_CATEGORIES = [
  'UI/UX',
  'Improvement',
  'New Feature',
  'Bug Fix',
  'Performance',
  'API',
  'Database',
  'Android',
  'Other'
];

const PRESET_TECH_KEYS = [
  'Platform',
  'Language',
  'UI',
  'Database',
  'Architecture',
  'API',
  'Libraries',
  'Other'
];

interface ProjectEditorFormProps {
  projectId?: number;
}

export default function ProjectEditorForm({ projectId }: ProjectEditorFormProps) {
  const router = useRouter();
  const [currentProjectId, setCurrentProjectId] = useState<number | undefined>(projectId);
  const isEditing = Boolean(currentProjectId);

  const [loading, setLoading] = useState(Boolean(projectId));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Application Name suggestions state
  const [isAppDropdownOpen, setIsAppDropdownOpen] = useState(false);
  const [availableAppNames, setAvailableAppNames] = useState<string[]>(DEFAULT_APP_NAMES);

  // Form State (ALL START EMPTY)
  const [formData, setFormData] = useState({
    serialNumber: '',
    appName: '',
    title: '',
    shortDescription: '',
    detailedDescription: '',
    status: 'Draft',
    startedDate: '',
    completedDate: '',
    result: '',
    categories: [] as string[],
    changes: [] as Array<{
      title: string;
      description: string;
      category: string;
      priority: string;
      sortOrder: number;
    }>,
    features: [] as Array<{
      title: string;
      description: string;
      sortOrder: number;
    }>,
    technicalDetails: [] as Array<{
      key: string;
      value: string;
      sortOrder: number;
    }>
  });

  // Uploaded images state
  const [images, setImages] = useState<Array<{
    id: number;
    filePath: string;
    thumbPath?: string | null;
    imageType: string;
    caption?: string | null;
    description?: string | null;
    sortOrder: number;
    isUploading?: boolean;
  }>>([]);

  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Refs for auto-saving & race condition avoidance
  const formDataRef = useRef(formData);
  const currentProjectIdRef = useRef(currentProjectId);
  const savingRef = useRef(false);
  const hasLoaded = useRef(false);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    currentProjectIdRef.current = currentProjectId;
  }, [currentProjectId]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Load existing project or compute next serial number
  useEffect(() => {
    if (projectId) {
      fetch(`/api/projects/${projectId}`)
        .then(r => r.json())
        .then(proj => {
          if (proj.error) {
            router.push('/admin');
            return;
          }
          setFormData({
            serialNumber: proj.serialNumber || '',
            appName: proj.appName || '',
            title: proj.title || '',
            shortDescription: proj.shortDescription || '',
            detailedDescription: proj.detailedDescription || '',
            status: proj.status || 'Draft',
            startedDate: proj.startedDate || '',
            completedDate: proj.completedDate || '',
            result: proj.result || '',
            categories: proj.categories || [],
            changes: proj.changes || [],
            features: proj.features || [],
            technicalDetails: proj.technicalDetails || []
          });
          setImages(proj.images || []);
          if (proj.categories && Array.isArray(proj.categories)) {
            const customFromProj = proj.categories.filter((c: string) => !PRESET_CATEGORIES.includes(c));
            setCustomCategories(prev => Array.from(new Set([...prev, ...customFromProj])));
          }
          setDirty(false);
          setSaveStatus('saved');
        })
        .catch(err => setErrorMsg(err.message))
        .finally(() => {
          setLoading(false);
          setTimeout(() => {
            hasLoaded.current = true;
          }, 150);
        });
    } else {
      // Auto serial number and default app name suggestion
      fetch('/api/projects')
        .then(r => r.json())
        .then(list => {
          const count = Array.isArray(list) ? list.length : 0;
          setFormData(prev => ({
            ...prev,
            appName: prev.appName || 'Tour Plan AA',
            serialNumber: prev.serialNumber || String(count + 1).padStart(2, '0')
          }));
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
          setTimeout(() => {
            hasLoaded.current = true;
          }, 150);
        });
    }
  }, [projectId, router]);

  // Fetch all existing applications from projects to provide suggestions
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(list => {
        if (Array.isArray(list)) {
          const dbApps = list.map((p: any) => p.appName).filter(Boolean);
          setAvailableAppNames(Array.from(new Set([...DEFAULT_APP_NAMES, ...dbApps])));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch all existing categories from database to make previous custom tags available
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(cats => {
        if (Array.isArray(cats)) {
          const names = cats.map((c: any) => c.name).filter(Boolean);
          const custom = names.filter((n: string) => !PRESET_CATEGORIES.includes(n));
          setCustomCategories(prev => Array.from(new Set([...prev, ...custom])));
        }
      })
      .catch(() => {});
  }, []);

  // Window beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  const updateField = (field: string, val: any) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    setDirty(true);
  };

  // Category helpers
  const toggleCategory = (cat: string) => {
    setDirty(true);
    setFormData(prev => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter(c => c !== cat)
          : [...prev.categories, cat]
      };
    });
  };

  const addCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;

    if (!customCategories.includes(trimmed) && !PRESET_CATEGORIES.includes(trimmed)) {
      setCustomCategories(prev => [...prev, trimmed]);
    }

    if (!formData.categories.includes(trimmed)) {
      setDirty(true);
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, trimmed]
      }));
    }

    setCustomCategoryInput('');
  };

  const removeCustomCategory = (cat: string) => {
    setDirty(true);
    setCustomCategories(prev => prev.filter(c => c !== cat));
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== cat)
    }));
  };

  // Changes handlers
  const addChange = () => {
    setDirty(true);
    setFormData(prev => ({
      ...prev,
      changes: [
        ...prev.changes,
        {
          title: '',
          description: '',
          category: 'UI/UX',
          priority: 'Medium',
          sortOrder: prev.changes.length + 1
        }
      ]
    }));
  };

  const updateChange = (index: number, field: string, val: string) => {
    setDirty(true);
    setFormData(prev => {
      const updated = [...prev.changes];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, changes: updated };
    });
  };

  const removeChange = (index: number) => {
    setDirty(true);
    setFormData(prev => ({
      ...prev,
      changes: prev.changes.filter((_, i) => i !== index)
    }));
  };

  const moveChange = (index: number, dir: number) => {
    const target = index + dir;
    if (target < 0 || target >= formData.changes.length) return;
    setDirty(true);
    setFormData(prev => {
      const updated = [...prev.changes];
      const temp = updated[index];
      updated[index] = updated[target];
      updated[target] = temp;
      return { ...prev, changes: updated };
    });
  };

  // Features handlers
  const addFeature = () => {
    setDirty(true);
    setFormData(prev => ({
      ...prev,
      features: [
        ...prev.features,
        { title: '', description: '', sortOrder: prev.features.length + 1 }
      ]
    }));
  };

  const updateFeature = (index: number, field: string, val: string) => {
    setDirty(true);
    setFormData(prev => {
      const updated = [...prev.features];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, features: updated };
    });
  };

  const removeFeature = (index: number) => {
    setDirty(true);
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Technical Details handlers
  const addTechDetail = (presetKey = '') => {
    setDirty(true);
    setFormData(prev => ({
      ...prev,
      technicalDetails: [
        ...prev.technicalDetails,
        { key: presetKey, value: '', sortOrder: prev.technicalDetails.length + 1 }
      ]
    }));
  };

  const updateTechDetail = (index: number, field: string, val: string) => {
    setDirty(true);
    setFormData(prev => {
      const updated = [...prev.technicalDetails];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, technicalDetails: updated };
    });
  };

  const removeTechDetail = (index: number) => {
    setDirty(true);
    setFormData(prev => ({
      ...prev,
      technicalDetails: prev.technicalDetails.filter((_, i) => i !== index)
    }));
  };

  // Helper to guarantee a draft project exists before image upload
  const ensureDraftProject = async (): Promise<number> => {
    if (currentProjectIdRef.current) return currentProjectIdRef.current;
    if (projectId) return projectId;

    const cur = formDataRef.current;
    const appName = cur.appName.trim() || 'Tour Plan AA';
    const title = cur.title.trim() || 'New Showcase Project';
    const serialNumber = cur.serialNumber.trim() || '01';

    const payload = {
      ...cur,
      appName,
      title,
      serialNumber,
      status: 'Draft'
    };

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to initialize project for image upload');
    }

    const created = await res.json();
    currentProjectIdRef.current = created.id;
    setCurrentProjectId(created.id);
    setFormData(prev => ({
      ...prev,
      appName: prev.appName || appName,
      title: prev.title || title,
      serialNumber: prev.serialNumber || serialNumber
    }));
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', `/admin/projects/${created.id}/edit`);
    }
    return created.id;
  };

  // Images upload handlers: Auto-start immediately & render in modification card style
  const handleFilesSelected = async (files: File[], imageType: 'OLD_UI' | 'NEW_UI' | 'ADDITIONAL') => {
    if (files.length === 0) return;

    // Immediately generate in-place preview cards in "modify style"
    const tempImages: Array<typeof images[0]> = files.map((file, i) => {
      const objectUrl = URL.createObjectURL(file);
      return {
        id: -(Date.now() + i),
        filePath: objectUrl,
        thumbPath: objectUrl,
        imageType,
        caption: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        sortOrder: 9999 + i,
        isUploading: true
      };
    });

    setImages(prev => [...prev, ...tempImages]);

    try {
      const targetId = await ensureDraftProject();

      // Upload in batches of 6 for speed & progressive card updates
      const BATCH_SIZE = 6;
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const chunkFiles = files.slice(i, i + BATCH_SIZE);
        const chunkTempIds = tempImages.slice(i, i + BATCH_SIZE).map(t => t.id);

        const data = new FormData();
        chunkFiles.forEach(f => data.append('images', f));
        data.append('imageType', imageType);

        const res = await fetch(`/api/projects/${targetId}/images`, {
          method: 'POST',
          body: data
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to upload image batch');
        }

        const json = await res.json();
        const serverImages = json.images || [];

        // Replace temporary cards with uploaded server cards, preserving any user-typed caption
        setImages(prev => {
          let sIdx = 0;
          return prev.map(img => {
            if (chunkTempIds.includes(img.id)) {
              const sImg = serverImages[sIdx++];
              if (sImg) {
                return {
                  ...sImg,
                  caption: img.caption || sImg.caption,
                  description: img.description || sImg.description,
                  isUploading: false
                };
              }
            }
            return img;
          });
        });
      }
      showToast(`${files.length} screenshots uploaded`);
    } catch (err: any) {
      showToast(`Error uploading screenshots: ${err.message}`, 'error');
      const tempIds = tempImages.map(t => t.id);
      setImages(prev => prev.filter(img => !tempIds.includes(img.id)));
    }
  };

  const handleReplaceImage = async (imgId: number, imageType: string, file: File) => {
    const targetId = currentProjectIdRef.current || projectId;
    if (!targetId) return;
    try {
      const data = new FormData();
      data.append('images', file);
      data.append('imageType', imageType);

      const res = await fetch(`/api/projects/${targetId}/images`, {
        method: 'POST',
        body: data
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to upload replacement image');
      }

      const json = await res.json();
      const newImg = json.images?.[0];

      // Delete the old image from DB and disk
      await fetch(`/api/images/${imgId}`, { method: 'DELETE' });

      setImages(prev => prev.map(img => img.id === imgId ? newImg : img));
      showToast('Image replaced successfully');
    } catch (err: any) {
      showToast(`Error replacing screenshot: ${err.message}`, 'error');
    }
  };

  const handleImageUpdate = async (imgId: number, field: string, val: any) => {
    if (imgId < 0) {
      setImages(prev => prev.map(img => img.id === imgId ? { ...img, [field]: val } : img));
      return;
    }
    try {
      const res = await fetch(`/api/images/${imgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: val })
      });
      if (res.ok) {
        const updated = await res.json();
        setImages(prev => prev.map(img => img.id === imgId ? updated : img));
      }
    } catch (err) {
      console.error('Failed to update image', err);
    }
  };

  const handleDeleteImage = async (imgId: number) => {
    if (imgId < 0) {
      setImages(prev => prev.filter(img => img.id !== imgId));
      return;
    }
    if (!window.confirm('Delete this screenshot?')) return;
    try {
      const res = await fetch(`/api/images/${imgId}`, { method: 'DELETE' });
      if (res.ok) {
        setImages(prev => prev.filter(img => img.id !== imgId));
        showToast('Screenshot deleted');
      }
    } catch (err: any) {
      showToast(`Error deleting image: ${err.message}`, 'error');
    }
  };

  const handleReorderTypeImages = async (reorderedTypeImages: typeof images, imageType: string) => {
    const otherImages = images.filter(img => img.imageType !== imageType);
    const newFullList = [...otherImages, ...reorderedTypeImages];
    setImages(newFullList);

    const validIds = newFullList.filter(img => img.id > 0).map(img => img.id);
    if (validIds.length === 0) return;

    try {
      await fetch('/api/images/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: validIds })
      });
    } catch (err) {
      console.error('Reorder error', err);
    }
  };

  // Perform Save (Unified for Auto-save and Manual save)
  const performSave = async ({
    explicitStatus,
    isAutoSave = false
  }: {
    explicitStatus?: string;
    isAutoSave?: boolean;
  } = {}) => {
    if (savingRef.current) return;

    const dataToSave = formDataRef.current;
    if (!dataToSave.appName.trim()) {
      if (!isAutoSave) {
        setErrorMsg('Application Name is required');
        showToast('Application Name is required', 'error');
      }
      return;
    }
    if (!dataToSave.title.trim()) {
      if (!isAutoSave) {
        setErrorMsg('Project Title is required');
        showToast('Project Title is required', 'error');
      }
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setSaveStatus('saving');
    setErrorMsg(null);

    const targetStatus = explicitStatus || dataToSave.status;
    const payload = {
      ...dataToSave,
      status: targetStatus
    };

    try {
      const activeId = currentProjectIdRef.current;

      if (activeId) {
        const res = await fetch(`/api/projects/${activeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to update project');
        }

        setDirty(false);
        setSaveStatus('saved');
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedAt(timeStr);

        if (!isAutoSave) {
          if (explicitStatus) {
            setFormData(prev => ({ ...prev, status: explicitStatus }));
          }
          showToast(explicitStatus === 'Published' ? 'Published to showcase!' : 'Draft saved successfully!');
        }
      } else {
        // Creating new project
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to create project');
        }

        const created = await res.json();
        currentProjectIdRef.current = created.id;
        setCurrentProjectId(created.id);
        setDirty(false);
        setSaveStatus('saved');
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedAt(timeStr);

        // Update URL seamlessly to edit route
        if (typeof window !== 'undefined' && window.history) {
          window.history.replaceState(null, '', `/admin/projects/${created.id}/edit`);
        }

        if (!isAutoSave) {
          if (explicitStatus) {
            setFormData(prev => ({ ...prev, status: explicitStatus }));
          }
          showToast(explicitStatus === 'Published' ? 'Project created & published!' : 'Project created & saved!');
        }
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveStatus('error');
      setErrorMsg(err.message);
      if (!isAutoSave) {
        showToast(err.message, 'error');
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // Debounced auto-save effect: whenever formData changes and is dirty, auto-save after 1000ms
  useEffect(() => {
    if (!hasLoaded.current) return;
    if (!dirty) return;

    setSaveStatus('unsaved');

    const timer = setTimeout(() => {
      const cur = formDataRef.current;
      if (cur.appName.trim() && cur.title.trim()) {
        performSave({ isAutoSave: true });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, dirty]);

  // Keyboard shortcut Ctrl+S / Cmd+S for instant save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        performSave({ isAutoSave: false });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] pb-28 transition-colors">
      
      {/* Top Floating Action Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-30 py-3.5 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin</span>
            </Link>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm hidden sm:block">
                {currentProjectId ? `Edit: ${formData.title || 'Untitled'}` : 'New Showcase Project'}
              </h2>

              {/* Dynamic Auto-save status badge */}
              {saveStatus === 'saving' ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600 dark:text-blue-400" />
                  <span>Saving...</span>
                </span>
              ) : saveStatus === 'unsaved' ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>{formData.appName.trim() && formData.title.trim() ? 'Unsaved (saving...)' : 'Unsaved changes'}</span>
                </span>
              ) : saveStatus === 'error' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  <span>Save failed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{lastSavedAt ? `Saved ${lastSavedAt}` : 'Saved'}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Preview Button */}
            <button
              type="button"
              onClick={() => setPreviewModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              title="Preview how this project will appear in showcase"
            >
              <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Preview Showcase</span>
            </button>

            {/* Save Draft */}
            <button
              type="button"
              disabled={saving}
              onClick={() => performSave({ explicitStatus: 'Draft', isAutoSave: false })}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              title="Manual Save (or press Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>

            {/* Publish */}
            <button
              type="button"
              disabled={saving}
              onClick={() => performSave({ explicitStatus: 'Published', isAutoSave: false })}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{saving ? 'Publishing...' : 'Publish'}</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. BASIC INFORMATION */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">1. Basic Information</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Core details (Application Name &amp; Title are required)</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Required Fields
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Serial Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Serial Number (#)</label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => updateField('serialNumber', e.target.value)}
                placeholder="01"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Adjust manually or keep sequence</span>
            </div>

            {/* Application Name (Dropdown + Manual Input) */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Application Name *
                </label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Dropdown or manual
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  list="app-name-suggestions"
                  value={formData.appName}
                  onChange={(e) => updateField('appName', e.target.value)}
                  placeholder="Select or enter app name..."
                  className="w-full pl-3 pr-8 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                />

                <datalist id="app-name-suggestions">
                  {availableAppNames.map((app) => (
                    <option key={app} value={app} />
                  ))}
                </datalist>

                {/* Dropdown Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsAppDropdownOpen((prev) => !prev)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Choose from application list"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAppDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>

                {/* Floating Dropdown Menu */}
                {isAppDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsAppDropdownOpen(false)}
                    />
                    <div className="absolute z-40 left-0 right-0 mt-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                        Default Applications
                      </div>
                      {availableAppNames.map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => {
                            updateField('appName', app);
                            setIsAppDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                            formData.appName === app
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate">{app}</span>
                          {formData.appName === app && (
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Quick Preset Pills */}
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                {DEFAULT_APP_NAMES.map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => updateField('appName', app)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all border whitespace-nowrap ${
                      formData.appName === app
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title={`Select ${app}`}
                  >
                    {app}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Project Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Enter project title (e.g. Prescription Processing UI Improvements)"
              className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              required
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Short Description</label>
            <textarea
              rows={2}
              value={formData.shortDescription}
              onChange={(e) => updateField('shortDescription', e.target.value)}
              placeholder="Short summary shown on project cards..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Detailed Description (Case Study Background)</label>
            <textarea
              rows={4}
              value={formData.detailedDescription}
              onChange={(e) => updateField('detailedDescription', e.target.value)}
              placeholder="Large text area for explaining what you worked on in detail..."
              className="w-full px-3 py-2 text-xs leading-relaxed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Started Date</label>
              <input
                type="date"
                value={formData.startedDate}
                onChange={(e) => updateField('startedDate', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Completed Date</label>
              <input
                type="date"
                value={formData.completedDate}
                onChange={(e) => updateField('completedDate', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Categories (Multi-Select)</label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {Array.from(new Set([...PRESET_CATEGORIES, ...customCategories, ...formData.categories])).map(cat => {
                const isSelected = formData.categories.includes(cat);
                const isCustom = !PRESET_CATEGORIES.includes(cat);
                return (
                  <div
                    key={cat}
                    className={`inline-flex items-center rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className="px-3 py-1 flex items-center gap-1 focus:outline-none"
                    >
                      <span>{isSelected ? '✓ ' : '+ '}</span>
                      <span>{cat}</span>
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomCategory(cat);
                        }}
                        className={`mr-2 p-0.5 rounded-full hover:bg-black/20 focus:outline-none transition-colors ${
                          isSelected ? 'text-blue-100 hover:text-white' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title={`Remove custom category "${cat}"`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom Category */}
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="text"
                value={customCategoryInput}
                onChange={(e) => setCustomCategoryInput(e.target.value)}
                placeholder="Add custom category..."
                className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomCategory();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomCategory}
                disabled={!customCategoryInput.trim()}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Result / Impact */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Result / Impact (Optional Outcomes)</label>
            <textarea
              rows={3}
              value={formData.result}
              onChange={(e) => updateField('result', e.target.value)}
              placeholder="e.g. Improved usability, reduced processing time, eliminated duplicate submissions..."
              className="w-full px-3 py-2 text-xs leading-relaxed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </section>

        {/* 2. "WHAT I DID" / CHANGES SECTION */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">2. What I Did / Changes</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add unlimited individual improvements or modifications</p>
            </div>
            <button
              type="button"
              onClick={addChange}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Change</span>
            </button>
          </div>

          {formData.changes.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400">No changes added yet.</p>
              <button
                type="button"
                onClick={addChange}
                className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                + Add First Change Item
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.changes.map((ch, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-300 bg-blue-100/60 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                      Change #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveChange(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-20 transition-colors"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveChange(idx, 1)}
                        disabled={idx === formData.changes.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-20 transition-colors"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeChange(idx)}
                        className="p-1 text-rose-500 hover:text-rose-700 ml-2 transition-colors"
                        title="Delete Change"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={ch.title}
                        onChange={(e) => updateChange(idx, 'title', e.target.value)}
                        placeholder="Change Title (e.g. Redesigned Prescription Screen)"
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <select
                        value={ch.priority}
                        onChange={(e) => updateChange(idx, 'priority', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <option value="High">Priority: High</option>
                        <option value="Medium">Priority: Medium</option>
                        <option value="Low">Priority: Low</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      value={ch.description}
                      onChange={(e) => updateChange(idx, 'description', e.target.value)}
                      placeholder="Description of what was changed..."
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. SCREENSHOT SYSTEM */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">3. Screenshot System (Before &amp; After)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload separate <strong>Old UI (Before)</strong> and <strong>New UI (After)</strong> screenshots side-by-side, plus optional <strong>Additional</strong> screens.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              {images.length} Total Uploaded
            </span>
          </div>

          {/* Two Side-by-Side Upload Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Old UI (Before) */}
            <AdminImagePanel
              title="Old UI (Before)"
              badgeLabel="Before"
              imageType="OLD_UI"
              theme="rose"
              emptyHint="Drop Old UI screenshots here, or click to browse"
              images={images.filter(img => img.imageType === 'OLD_UI')}
              onFilesSelected={handleFilesSelected}
              onDeleteImage={handleDeleteImage}
              onReplaceImage={handleReplaceImage}
              onUpdateMeta={handleImageUpdate}
              onReorderImages={(reordered) => handleReorderTypeImages(reordered, 'OLD_UI')}
            />

            {/* Right: New UI (After) */}
            <AdminImagePanel
              title="New UI (After)"
              badgeLabel="After"
              imageType="NEW_UI"
              theme="emerald"
              emptyHint="Drop New UI screenshots here, or click to browse"
              images={images.filter(img => img.imageType === 'NEW_UI')}
              onFilesSelected={handleFilesSelected}
              onDeleteImage={handleDeleteImage}
              onReplaceImage={handleReplaceImage}
              onUpdateMeta={handleImageUpdate}
              onReorderImages={(reordered) => handleReorderTypeImages(reordered, 'NEW_UI')}
            />
          </div>

          {/* Third: Additional Screenshots */}
          <div className="pt-2">
            <AdminImagePanel
              title="Additional Screenshots (Optional)"
              badgeLabel="Additional"
              imageType="ADDITIONAL"
              theme="purple"
              emptyHint="Drop additional screens, user flows, or technical diagrams here"
              images={images.filter(img => img.imageType === 'ADDITIONAL')}
              onFilesSelected={handleFilesSelected}
              onDeleteImage={handleDeleteImage}
              onReplaceImage={handleReplaceImage}
              onUpdateMeta={handleImageUpdate}
              onReorderImages={(reordered) => handleReorderTypeImages(reordered, 'ADDITIONAL')}
            />
          </div>
        </section>

        {/* 4. FEATURES IMPLEMENTED */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">4. Features Implemented</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Key user features delivered in this project</p>
            </div>
            <button
              type="button"
              onClick={addFeature}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Feature</span>
            </button>
          </div>

          {formData.features.length === 0 ? (
            <div className="p-4 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-400 dark:text-slate-500">
              No features added. Click + Add Feature to add features.
            </div>
          ) : (
            <div className="space-y-3">
              {formData.features.map((feat, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex gap-3 items-start transition-colors">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={feat.title}
                      onChange={(e) => updateFeature(idx, 'title', e.target.value)}
                      placeholder="Feature Title (e.g. Local Data Offline Tab)"
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                    <textarea
                      rows={2}
                      value={feat.description}
                      onChange={(e) => updateFeature(idx, 'description', e.target.value)}
                      placeholder="Short description of the feature..."
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. TECHNICAL DETAILS */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">5. Technical Implementation Details</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Optional key/value fields (none pre-filled)</p>
            </div>
            <button
              type="button"
              onClick={() => addTechDetail()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Field</span>
            </button>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-semibold mr-1">Quick Add:</span>
            {PRESET_TECH_KEYS.map(k => (
              <button
                key={k}
                type="button"
                onClick={() => addTechDetail(k)}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] transition-colors"
              >
                + {k}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {formData.technicalDetails.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-400 dark:text-slate-500">
                No technical fields added.
              </div>
            ) : (
              formData.technicalDetails.map((td, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={td.key}
                    onChange={(e) => updateTechDetail(idx, 'key', e.target.value)}
                    placeholder="Area / Key (e.g. Platform)"
                    className="w-1/3 px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                  <input
                    type="text"
                    value={td.value}
                    onChange={(e) => updateTechDetail(idx, 'value', e.target.value)}
                    placeholder="Implementation (e.g. Android)"
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeTechDetail(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Cancel
          </Link>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </span>
            ) : saveStatus === 'unsaved' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Auto-saving in 1s...</span>
              </span>
            ) : saveStatus === 'saved' && lastSavedAt ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Auto-saved at {lastSavedAt}</span>
              </span>
            ) : null}

            <button
              type="button"
              disabled={saving}
              onClick={() => performSave({ explicitStatus: 'Draft', isAutoSave: false })}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => performSave({ explicitStatus: 'Published', isAutoSave: false })}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{saving ? 'Publishing...' : 'Publish to Showcase'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Live Showcase Preview Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Live Showcase Preview
              </span>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-800 text-white font-mono text-xs font-bold">
                    #{formData.serialNumber || '01'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-bold">
                    {formData.appName || 'APP'}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {formData.title || 'Untitled Project'}
                </h2>
                {formData.shortDescription && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                    {formData.shortDescription}
                  </p>
                )}
              </div>

              {formData.changes.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">What I Did ({formData.changes.length} changes)</h4>
                  <ul className="list-disc pl-5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    {formData.changes.map((ch, idx) => (
                      <li key={idx}>
                        <strong>{ch.title}</strong>: {ch.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {images.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">Screenshots ({images.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map(img => (
                      <div key={img.id} className="h-32 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center p-1 border border-slate-800">
                        <img src={img.thumbPath || img.filePath} alt="" className="max-h-full max-w-full object-contain" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 ${
            toast.type === 'error'
              ? 'bg-rose-900/95 text-white border-rose-700 shadow-rose-950/20'
              : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-950/30'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
