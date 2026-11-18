import type { Analysis, Finding } from '@/lib/types';
import { FindingCard } from './FindingCard';
import {
  ArrowLeft,
  Trash2,
  FileText,
  ShieldAlert,
  AlertTriangle,
  Info,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface AnalysisReportProps {
  analysis: Analysis;
  findings: Finding[];
  onBack: () => void;
  onDelete: () => void;
}

type FilterType = 'all' | 'critical' | 'warning' | 'info';

const severityRank: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function AnalysisReport({
  analysis,
  findings,
  onBack,
  onDelete,
}: AnalysisReportProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sort findings so the most significant user impacts appear first
  const sortedFindings = useMemo(() => {
    return [...findings].sort((a, b) => {
      const rankA = severityRank[a.severity] ?? 3;
      const rankB = severityRank[b.severity] ?? 3;
      return rankA - rankB;
    });
  }, [findings]);

  const filtered = useMemo(() => {
    if (filter === 'all') return sortedFindings;
    return sortedFindings.filter((f) => f.severity === filter);
  }, [sortedFindings, filter]);

  const formattedDate = new Date(analysis.created_at).toLocaleDateString(
    'en-US',
    { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' },
  );

  const filters: { key: FilterType; label: string; count: number; icon: typeof ShieldAlert }[] = [
    { key: 'all', label: 'All Findings', count: findings.length, icon: FileText },
    { key: 'critical', label: 'Important', count: analysis.critical_count, icon: ShieldAlert },
    { key: 'warning', label: 'Be Aware', count: analysis.warning_count, icon: AlertTriangle },
    { key: 'info', label: 'Informational', count: analysis.info_count, icon: Info },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl animate-fade-in pb-12">
      {/* Top Bar Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-charcoal-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal-700 shadow-2xs transition-colors hover:border-forest-700 hover:text-forest-800"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-forest-700" />
          Back to Agreement Intake
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="text-xs text-charcoal-600">Delete this analysis permanently?</span>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md border border-red-300 bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-red-700"
            >
              Confirm Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-md border border-charcoal-200 bg-white px-2.5 py-1 text-xs font-medium text-charcoal-600 hover:bg-charcoal-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-charcoal-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Delete this analysis record"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Report
          </button>
        )}
      </div>

      {/* Main Executive Summary Dossier */}
      <div className="overflow-hidden rounded-xl border border-charcoal-200/80 bg-white shadow-sm">
        {/* Header Section: Real-World Impact Focus */}
        <div className="border-b border-charcoal-100 bg-gradient-to-br from-ivory-50 via-white to-ivory-50/60 p-6 sm:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded border border-forest-200/60">
                Agreement Impact Review
              </span>
              <span className="font-mono text-xs text-charcoal-500 truncate max-w-md">
                {analysis.title}
              </span>
            </div>

            <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-charcoal-950 sm:text-3xl">
              How could these terms affect you?
            </h1>

            {/* Executive Analysis Summary */}
            <div className="mt-4 rounded-xl border border-charcoal-200/80 bg-white p-5 shadow-2xs">
              <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-forest-800">
                Executive Impact Overview
              </span>
              <p className="text-sm leading-relaxed text-charcoal-700">
                {analysis.summary}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs text-charcoal-500">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-charcoal-400" />
                {analysis.word_count.toLocaleString()} words analyzed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-charcoal-400" />
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Attention Level Summary Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setFilter('critical')}
              className={`rounded-lg border p-3.5 text-left transition-all ${
                filter === 'critical'
                  ? 'border-red-400 bg-red-50/80 shadow-xs ring-1 ring-red-400'
                  : 'border-red-200/80 bg-red-50/40 hover:bg-red-50/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-2xl font-bold text-red-700">
                  {analysis.critical_count}
                </span>
                <ShieldAlert className="h-4 w-4 text-red-600" />
              </div>
              <span className="mt-1 block font-mono text-xs font-bold text-red-800">
                Important
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-red-900/80">
                Provisions that could significantly affect your money, privacy, rights, or account.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('warning')}
              className={`rounded-lg border p-3.5 text-left transition-all ${
                filter === 'warning'
                  ? 'border-warmAmber-400 bg-warmAmber-50/80 shadow-xs ring-1 ring-warmAmber-400'
                  : 'border-warmAmber-200/80 bg-warmAmber-50/40 hover:bg-warmAmber-50/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-2xl font-bold text-warmAmber-800">
                  {analysis.warning_count}
                </span>
                <AlertTriangle className="h-4 w-4 text-warmAmber-700" />
              </div>
              <span className="mt-1 block font-mono text-xs font-bold text-warmAmber-800">
                Be Aware
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-warmAmber-900/80">
                Conditions and terms worth understanding before you agree.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('info')}
              className={`rounded-lg border p-3.5 text-left transition-all ${
                filter === 'info'
                  ? 'border-charcoal-400 bg-charcoal-100 shadow-xs ring-1 ring-charcoal-400'
                  : 'border-charcoal-200/80 bg-charcoal-50/60 hover:bg-charcoal-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-2xl font-bold text-charcoal-800">
                  {analysis.info_count}
                </span>
                <Info className="h-4 w-4 text-charcoal-600" />
              </div>
              <span className="mt-1 block font-mono text-xs font-bold text-charcoal-700">
                Informational
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-charcoal-600">
                Helpful context and routine operational disclosures.
              </span>
            </button>
          </div>
        </div>

        {/* Findings Dossier List */}
        <div className="p-6 sm:p-8">
          {findings.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-forest-50 text-forest-700 border border-forest-200">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-lg font-bold text-charcoal-800">
                No Flagged Provisions Detected
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-charcoal-500">
                The analysis did not detect significant unilateral clauses or high-impact restrictions in this document. Always review terms carefully before agreeing.
              </p>
            </div>
          ) : (
            <>
              {/* Filter Tabs */}
              <div className="mb-6 flex flex-wrap gap-2">
                {filters.map((f) => {
                  const isActive = filter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFilter(f.key)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-forest-800 text-ivory-50 shadow-xs'
                          : 'border border-charcoal-200/80 bg-white text-charcoal-700 hover:border-charcoal-300 hover:bg-ivory-50/60'
                      }`}
                    >
                      <f.icon className="h-3.5 w-3.5" />
                      <span>{f.label}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                          isActive
                            ? 'bg-forest-900 text-ivory-100'
                            : 'bg-charcoal-100 text-charcoal-600'
                        }`}
                      >
                        {f.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Finding Cards */}
              <div className="space-y-4">
                {filtered.map((finding, idx) => (
                  <FindingCard key={finding.id} finding={finding} index={idx} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="mt-6 rounded-lg border border-charcoal-200/80 bg-white/60 px-4 py-3 text-center">
        <p className="text-[11px] leading-relaxed text-charcoal-500">
          <strong>Notice:</strong> TermsTruth provides automated document analysis for informational purposes only. It is not an attorney and does not provide legal advice or legal opinions. Consult a licensed attorney for legal counsel.
        </p>
      </div>
    </div>
  );
}
