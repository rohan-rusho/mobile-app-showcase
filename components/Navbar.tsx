'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Smartphone, LayoutGrid, SlidersHorizontal, Plus, Wifi, Check, Copy } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeProvider';

export default function Navbar() {
  const pathname = usePathname();
  const [networkInfo, setNetworkInfo] = useState<{ port: number; localIp: string; networkUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/system/network-info')
      .then(r => r.json())
      .then(setNetworkInfo)
      .catch(err => console.warn('Could not retrieve network IP', err));
  }, []);

  const copyNetworkUrl = () => {
    if (!networkInfo?.networkUrl) return;
    navigator.clipboard.writeText(networkInfo.networkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isShowcase = pathname === '/' || pathname.startsWith('/showcase');
  const isAdmin = pathname.startsWith('/admin');

  return (
    <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        
        {/* Brand / Logo */}
        <Link href="/showcase" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-lg leading-tight tracking-tight">Mobile App Showcase</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Internal
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">Engineering &amp; UI Documentation</p>
          </div>
        </Link>

        {/* LAN Access Badge */}
        {networkInfo && (
          <div 
            onClick={copyNetworkUrl}
            title="Click to copy local network URL to view on mobile or share with your manager"
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors text-xs font-medium text-slate-700 dark:text-slate-300 select-none"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>LAN: <strong className="text-slate-900 dark:text-white font-mono">{networkInfo.localIp}:{networkInfo.port}</strong></span>
            {copied ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold ml-1">
                <Check className="w-3.5 h-3.5" /> Copied
              </span>
            ) : (
              <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" />
            )}
          </div>
        )}

        {/* Navigation Actions & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/showcase"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isShowcase && !isAdmin
                ? 'bg-slate-900 dark:bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Showcase</span>
          </Link>

          <Link
            href="/admin"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isAdmin
                ? 'bg-slate-900 dark:bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>

          <Link
            href="/admin/projects/new"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </Link>

          {/* Theme Toggle (Light / Dark) */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
