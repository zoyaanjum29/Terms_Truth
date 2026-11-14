import type { Analysis } from '@/lib/types';
import { GradeBadge, SeverityIcon } from './ScoreRing';
import {
  FileText,
  ChevronRight,
  ShieldAlert,
  Shield,
  Info,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

interface HistoryListProps {
  analyses: Analysis[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function HistoryList({ analyses, onSelect, onDelete }: HistoryListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (analyses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <FileText className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-600">No analyses yet</h3>
        <p className="mt-1 text-xs text-slate-400">
          Your analyzed documents will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {analyses.map((a) => (
        <div
          key={a.id}
          className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-teal-200 hover:shadow-md"
        >
          <button
            onClick={() => onSelect(a.id)}
            className="flex flex-1 items-center gap-3 text-left"
          >
            <div
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                a.grade === 'A' || a.grade === 'B'
                  ? 'bg-emerald-100 text-emerald-700'
                  : a.grade === 'C'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {a.grade}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-slate-800">
                {a.title}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {a.word_count} words
                </span>
                {a.critical_count > 0 && (
                  <span className="inline-flex items-center gap-1 text-red-500">
                    <SeverityIcon severity="critical" />
                    {a.critical_count}
                  </span>
                )}
                {a.warning_count > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-500">
                    <SeverityIcon severity="warning" />
                    {a.warning_count}
                  </span>
                )}
                {a.info_count > 0 && (
                  <span className="inline-flex items-center gap-1 text-sky-500">
                    <SeverityIcon severity="info" />
                    {a.info_count}
                  </span>
                )}
                <span>
                  {new Date(a.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-500" />
          </button>
          {confirmId === a.id ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  onDelete(a.id);
                  setConfirmId(null);
                }}
                className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmId(a.id)}
              className="flex-shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
