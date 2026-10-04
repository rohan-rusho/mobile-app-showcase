import React from 'react';
import { Smartphone, Server } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="no-print bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-20 py-8 text-slate-500 dark:text-slate-400 text-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">Mobile App Showcase</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span>Internal Work Presentation &amp; Documentation System</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono">
            <Server className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            Host: 0.0.0.0:3000
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>SQLite + Prisma</span>
        </div>
      </div>
    </footer>
  );
}
