'use client';

import React, { useState, useRef } from 'react';
import { Download, Upload, X, CheckCircle2, AlertCircle, FileJson, Archive, AlertTriangle } from 'lucide-react';

interface ImportExportModalProps {
  onClose: () => void;
  onImportSuccess?: () => void;
}

export default function ImportExportModal({ onClose, onImportSuccess }: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'zip' | 'json'>('zip');
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // State for Zip restore confirmation
  const [showZipConfirm, setShowZipConfirm] = useState(false);
  const [pendingZipFile, setPendingZipFile] = useState<File | null>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadZipBackup = () => {
    window.location.href = '/api/backup/download';
  };

  const handleExportJson = () => {
    window.open('/api/export', '_blank');
  };

  const onZipFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setErrorMessage('Please select a valid .zip backup file');
      return;
    }

    setPendingZipFile(file);
    setShowZipConfirm(true);
    // Reset input so same file can be selected again if cancelled
    if (zipInputRef.current) zipInputRef.current.value = '';
  };

  const executeZipRestore = async () => {
    if (!pendingZipFile) return;

    setProcessing(true);
    setStatusMessage(null);
    setErrorMessage(null);
    setShowZipConfirm(false);

    try {
      const formData = new FormData();
      formData.append('file', pendingZipFile);

      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to restore backup zip');
      }

      setStatusMessage('Backup restored successfully! Updating showcase...');
      setTimeout(() => {
        if (onImportSuccess) onImportSuccess();
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(`Restore failed: ${err.message}`);
    } finally {
      setProcessing(false);
      setPendingZipFile(null);
    }
  };

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to import backup data');
      }

      setStatusMessage('Data imported successfully! Reloading...');
      setTimeout(() => {
        if (onImportSuccess) onImportSuccess();
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(`Import failed: ${err.message}`);
    } finally {
      setProcessing(false);
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Backup &amp; Restore</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Safely backup or restore your database and screenshot files</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-150 dark:border-slate-800 mt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('zip')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'zip'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Full System Backup (.ZIP)</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON Data Only</span>
          </button>
        </div>

        {/* Status Messages */}
        {statusMessage && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ZIP Backup Tab */}
        {activeTab === 'zip' && (
          <div className="mt-4 space-y-3.5">
            {/* Download Zip */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500 transition-colors bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Download Backup (.zip)</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Generates <code className="text-slate-700 dark:text-slate-300 font-mono">showcase-backup.zip</code> containing the real SQLite database and all uploaded screenshots.
                </p>
              </div>
              <button
                onClick={handleDownloadZipBackup}
                disabled={processing}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white ml-3 flex-shrink-0 shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Backup</span>
              </button>
            </div>

            {/* Restore Zip */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500 transition-colors bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Restore Backup (.zip)</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Upload a previously generated backup zip to completely restore your showcase database and screenshots.
                </p>
              </div>

              <label className={`px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 ml-3 flex-shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5 transition-all ${processing ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>{processing ? 'Processing...' : 'Upload Zip'}</span>
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip,application/zip"
                  onChange={onZipFileSelected}
                  className="hidden"
                  disabled={processing}
                />
              </label>
            </div>
          </div>
        )}

        {/* JSON Tab */}
        {activeTab === 'json' && (
          <div className="mt-4 space-y-3.5">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500 transition-colors bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Export JSON</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Exports project metadata, changes, and features to a structured JSON file.
                </p>
              </div>
              <button
                onClick={handleExportJson}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 ml-3 flex-shrink-0"
              >
                Export JSON
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500 transition-colors bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Import JSON</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Import projects from an existing JSON file.
                </p>
              </div>
              <label className={`px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white ml-3 flex-shrink-0 cursor-pointer shadow-xs ${processing ? 'opacity-50 pointer-events-none' : ''}`}>
                <span>{processing ? 'Importing...' : 'Select JSON'}</span>
                <input
                  ref={jsonInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleJsonUpload}
                  className="hidden"
                  disabled={processing}
                />
              </label>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Strong Warning Confirmation Modal for Zip Restore */}
        {showZipConfirm && (
          <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 rounded-2xl p-6 flex flex-col justify-between z-20 backdrop-blur-xs">
            <div>
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 text-center">
                Confirm System Backup Restore
              </h4>
              <div className="mt-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-300 text-xs space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                  <span>STRONG WARNING: Irreversible Operation</span>
                </p>
                <p>
                  Restoring <span className="font-semibold">{pendingZipFile?.name}</span> will <strong>completely replace</strong> your current SQLite database and all screenshot files in <code className="bg-rose-100 dark:bg-rose-900/60 px-1 py-0.5 rounded text-[11px]">./uploads</code>.
                </p>
                <p>
                  Any unsaved projects or screenshots currently on this PC will be permanently lost.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowZipConfirm(false);
                  setPendingZipFile(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeZipRestore}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Replace Current Data &amp; Restore</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
