import React, { useState } from 'react';
import { Copy, X, Images } from 'lucide-react';

interface DuplicateModalProps {
  project: {
    id: number;
    appName: string;
    title: string;
    imageCount?: number;
  };
  onConfirm: (projectId: number, includeImages: boolean) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function DuplicateModal({
  project,
  onConfirm,
  onCancel,
  isSubmitting = false
}: DuplicateModalProps) {
  const [includeImages, setIncludeImages] = useState(true);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Duplicate Project</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Clone project information, changes, and features</p>
            </div>
          </div>

          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200">{project.appName} — {project.title}</div>
          <div className="text-slate-500 dark:text-slate-400 mt-0.5">Will be cloned into a new Draft project.</div>
        </div>

        {/* Checkbox for duplicating images */}
        <div className="mt-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700"
            />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Images className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Duplicate screenshots &amp; media too?</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Copies all {project.imageCount || 0} associated screenshots to the new project entry.
              </p>
            </div>
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(project.id, includeImages)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {isSubmitting ? 'Duplicating...' : 'Duplicate Project'}
          </button>
        </div>

      </div>
    </div>
  );
}
