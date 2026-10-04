import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Image as ImageIcon } from 'lucide-react';

interface ProjectCardProps {
  project: {
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
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Published</span>;
      case 'completed':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Completed</span>;
      case 'in progress':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">In Progress</span>;
      case 'draft':
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{status}</span>;
    }
  };

  return (
    <Link
      href={`/showcase/project/${project.id}`}
      className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-2xl cursor-pointer"
      title={`View details for ${project.appName} - ${project.title}`}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg dark:hover:shadow-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between h-full">
        <div>
          {/* Thumbnail Preview if exists */}
          {project.thumbnailPath ? (
            <div className="relative h-48 bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
              <img
                src={project.thumbnailPath}
                alt={project.title}
                className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
                {project.serialNumber && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-white font-mono text-xs font-bold backdrop-blur-xs shadow-sm">
                    #{project.serialNumber}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-xs font-bold shadow-sm">
                  {project.appName}
                </span>
              </div>
              <div className="absolute top-3 right-3 pointer-events-none">
                {getStatusBadge(project.status)}
              </div>
            </div>
          ) : (
            /* Clean header if no image */
            <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {project.serialNumber && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-800 text-white font-mono text-xs font-bold border border-transparent dark:border-slate-700">
                    #{project.serialNumber}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-xs font-bold">
                  {project.appName}
                </span>
              </div>
              <div>
                {getStatusBadge(project.status)}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="p-5">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {project.title}
            </h3>

            {project.shortDescription && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {project.shortDescription}
              </p>
            )}

            {/* Category Chips */}
            {project.categories && project.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3.5">
                {project.categories.slice(0, 3).map((cat, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {cat}
                  </span>
                ))}
                {project.categories.length > 3 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-transparent dark:border-slate-700">
                    +{project.categories.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <strong className="text-slate-700 dark:text-slate-200">{project.changeCount}</strong> Changes
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <strong className="text-slate-700 dark:text-slate-200">{project.imageCount}</strong> Screens
            </span>
          </div>

          <div className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all">
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
