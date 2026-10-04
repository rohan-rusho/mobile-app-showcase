import React from 'react';

interface ChangeItem {
  id?: number;
  title: string;
  description?: string | null;
  category?: string | null;
  priority?: string | null;
  sortOrder?: number;
}

interface TimelineProps {
  changes: ChangeItem[];
}

export default function Timeline({ changes }: TimelineProps) {
  if (!changes || changes.length === 0) return null;

  const getPriorityBadge = (priority?: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">High Priority</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Medium Priority</span>;
      case 'low':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Low Priority</span>;
      default:
        return null;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {changes.map((ch, idx) => (
        <div key={ch.id || idx} className="relative">
          {/* Node */}
          <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 flex items-center justify-center text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 shadow-xs">
            {String(idx + 1).padStart(2, '0')}
          </div>

          <div className="pl-3">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                {ch.title}
              </h4>
              {ch.category && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {ch.category}
                </span>
              )}
              {getPriorityBadge(ch.priority)}
            </div>

            {ch.description && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                {ch.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
