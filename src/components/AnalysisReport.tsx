import type { Analysis, Finding } from '@/lib/types';
import { ScoreRing, GradeBadge, SeverityIcon } from './ScoreRing';
import { FindingCard } from './FindingCard';
import {
  ArrowLeft,
  Trash2,
  FileText,
  ShieldAlert,
  Shield,
  Info,
  Calendar,
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface AnalysisReportProps {
  analysis: Analysis;
  findings: Finding[];
  onBack: () => void;
  onDelete: () => void;
}

type FilterType = 'all' | 'critical' | 'warning' | 'info';

export function AnalysisReport({
  analysis,
  findings,
  onBack,
  onDelete,
}: AnalysisReportProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'all') return findings;
    return findings.filter((f) => f.severity === filter);
  }, [findings, filter]);

  const formattedDate = new Date(analysis.created_at).toLocaleDateString(
    'en-US',
    { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' },
  );

  const filters: { key: FilterType; label: string; count: number; icon: typeof ShieldAlert }[] = [
    { key: 'all', label: 'All', count: findings.length, icon: FileText },
    { key: 'critical', label: 'Critical', count: analysis.critical_count, icon: ShieldAlert },
    { key: 'warning', label: 'Warnings', count: analysis.warning_count, icon: Shield },
    { key: 'info', label: 'Info', count: analysis.info_count, icon: Info },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-teal-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Delete this analysis?</span>
            <button
              onClick={onDelete}
              className="rounded-md bg-red-500 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-teal-50/30 p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <ScoreRing score={analysis.score} grade={analysis.grade} />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-xl font-bold text-slate-800">
                  {analysis.title}
                </h1>
                <GradeBadge grade={analysis.grade} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {analysis.summary}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 sm:justify-start">
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {analysis.word_count} words
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-red-200/60 bg-red-50/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold text-red-600">
                  {analysis.critical_count}
                </span>
              </div>
              <span className="text-xs font-medium text-red-500/70">Critical</span>
            </div>
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Shield className="h-4 w-4 text-amber-500" />
                <span className="text-2xl font-bold text-amber-600">
                  {analysis.warning_count}
                </span>
              </div>
              <span className="text-xs font-medium text-amber-500/70">Warnings</span>
            </div>
            <div className="rounded-xl border border-sky-200/60 bg-sky-50/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Info className="h-4 w-4 text-sky-500" />
                <span className="text-2xl font-bold text-sky-600">
                  {analysis.info_count}
                </span>
              </div>
              <span className="text-xs font-medium text-sky-500/70">Info</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {findings.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-700">
                No Red Flags Detected
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                This document didn&apos;t trigger any of our red-flag rules. Always review terms carefully — this is not legal advice.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      filter === f.key
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <f.icon className="h-3.5 w-3.5" />
                    {f.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        filter === f.key
                          ? 'bg-white/20'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filtered.map((finding, idx) => (
                  <FindingCard key={finding.id} finding={finding} index={idx} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        TermsTruth provides automated analysis for informational purposes only and does not constitute legal advice.
      </p>
    </div>
  );
}
