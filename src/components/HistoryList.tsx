import type { Analysis } from '@/lib/types';
import { SeverityIcon } from './ScoreRing';
import {
  FileText,
  ChevronRight,
  Trash2,
  Calendar,
  Layers,
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
      <div className="rounded-xl border border-dashed border-charcoal-200/90 bg-white/60 px-6 py-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ivory-200/70 text-charcoal-400">
          <Layers className="h-5 w-5" />
        </div>
        <h4 className="font-serif text-base font-semibold text-charcoal-800">
          No Registered Documents Yet
        </h4>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-charcoal-500">
          Agreements analyzed on this workstation will appear here in your permanent document registry.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-charcoal-200/80 bg-white shadow-sm">
      <div className="divide-y divide-charcoal-100">
        {analyses.map((a) => {
          const formattedDate = new Date(a.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          const gradeStyles: Record<string, { bg: string; text: string; border: string }> = {
            A: { bg: 'bg-forest-50', text: 'text-forest-800', border: 'border-forest-300' },
            B: { bg: 'bg-forest-50/70', text: 'text-forest-700', border: 'border-forest-200' },
            C: { bg: 'bg-warmAmber-50', text: 'text-warmAmber-800', border: 'border-warmAmber-300' },
            D: { bg: 'bg-warmAmber-100/60', text: 'text-warmAmber-900', border: 'border-warmAmber-400' },
            F: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' },
          };
          const style = gradeStyles[a.grade] ?? gradeStyles.F;

          return (
            <div
              key={a.id}
              className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-ivory-50/70"
            >
              <button
                type="button"
                onClick={() => onSelect(a.id)}
                className="flex flex-1 items-center gap-4 text-left min-w-0"
              >
                {/* Grade Stamp */}
                <div
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border ${style.border} ${style.bg} font-serif text-base font-bold ${style.text} shadow-xs select-none`}
                >
                  {a.grade}
                </div>

                {/* Document Information */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-serif text-sm font-semibold tracking-tight text-charcoal-900 group-hover:text-forest-800">
                      {a.title}
                    </h4>
                    <span className="font-mono text-[11px] text-charcoal-400">
                      Score: {a.score}/100
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-charcoal-500">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                      <FileText className="h-3 w-3 text-charcoal-400" />
                      {a.word_count.toLocaleString()} words
                    </span>

                    {/* Breakdown flags */}
                    <div className="flex items-center gap-2">
                      {a.critical_count > 0 && (
                        <span className="inline-flex items-center gap-1 font-medium text-red-700">
                          <SeverityIcon severity="critical" />
                          <span>{a.critical_count} High</span>
                        </span>
                      )}
                      {a.warning_count > 0 && (
                        <span className="inline-flex items-center gap-1 font-medium text-warmAmber-800">
                          <SeverityIcon severity="warning" />
                          <span>{a.warning_count} Med</span>
                        </span>
                      )}
                      {a.info_count > 0 && (
                        <span className="inline-flex items-center gap-1 font-medium text-charcoal-600">
                          <SeverityIcon severity="info" />
                          <span>{a.info_count} Low</span>
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-charcoal-400">
                      <Calendar className="h-3 w-3" />
                      {formattedDate}
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 flex-shrink-0 text-charcoal-300 transition-transform group-hover:translate-x-0.5 group-hover:text-forest-700" />
              </button>

              {/* Delete with inline confirmation */}
              <div className="flex-shrink-0 pl-2">
                {confirmId === a.id ? (
                  <div className="flex items-center gap-1.5 animate-fade-in">
                    <span className="text-[11px] text-charcoal-500 mr-1">Remove?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(a.id);
                        setConfirmId(null);
                      }}
                      className="rounded border border-red-300 bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="rounded border border-charcoal-200 bg-white px-2 py-1 text-xs font-medium text-charcoal-600 hover:bg-charcoal-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(a.id)}
                    className="rounded-md p-1.5 text-charcoal-300 opacity-60 transition-all hover:bg-red-50 hover:text-red-600 hover:opacity-100 group-hover:opacity-100"
                    title="Remove from registry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
