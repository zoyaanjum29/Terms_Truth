import type { Analysis, Finding } from '@/lib/types';
import { ScoreRing, GradeBadge } from './ScoreRing';
import { FindingCard } from './FindingCard';
import {
  ArrowLeft,
  Trash2,
  FileText,
  ShieldAlert,
  AlertTriangle,
  Info,
  Calendar,
  Calculator,
  ChevronDown,
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

export function AnalysisReport({
  analysis,
  findings,
  onBack,
  onDelete,
}: AnalysisReportProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'all') return findings;
    return findings.filter((f) => f.severity === filter);
  }, [findings, filter]);

  const formattedDate = new Date(analysis.created_at).toLocaleDateString(
    'en-US',
    { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' },
  );

  const filters: { key: FilterType; label: string; count: number; icon: typeof ShieldAlert }[] = [
    { key: 'all', label: 'All Identified Clauses', count: findings.length, icon: FileText },
    { key: 'critical', label: 'High Attention', count: analysis.critical_count, icon: ShieldAlert },
    { key: 'warning', label: 'Medium Attention', count: analysis.warning_count, icon: AlertTriangle },
    { key: 'info', label: 'Low / Informational', count: analysis.info_count, icon: Info },
  ];

  const scoreBreakdown = useMemo(() => {
    const critical = analysis.critical_count;
    const warning = analysis.warning_count;
    const info = analysis.info_count;
    const shortDocPenalty = analysis.word_count < 50 ? 10 : 0;
    const deductions = [
      { label: `${critical} high-attention clause${critical !== 1 ? 's' : ''}`, amount: critical * 18 },
      { label: `${warning} medium-attention clause${warning !== 1 ? 's' : ''}`, amount: warning * 8 },
      { label: `${info} low-attention clause${info !== 1 ? 's' : ''}`, amount: info * 2 },
      ...(shortDocPenalty > 0
        ? [{ label: 'Short document penalty (< 50 words)', amount: shortDocPenalty }]
        : []),
    ];
    const totalDeduction = deductions.reduce((sum, d) => sum + d.amount, 0);
    return { deductions, totalDeduction, startingScore: 100 };
  }, [analysis]);

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
        {/* Header Section with Score & Memorandum */}
        <div className="border-b border-charcoal-100 bg-gradient-to-br from-ivory-50 via-white to-ivory-50/60 p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center flex-shrink-0">
              <ScoreRing score={analysis.score} grade={analysis.grade} />
              <span className="mt-2 text-center font-mono text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">
                Attention Score
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                <h1 className="font-serif text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
                  {analysis.title}
                </h1>
                <GradeBadge grade={analysis.grade} />
              </div>

              <div className="mt-3 rounded-lg border border-charcoal-100 bg-white/80 p-4 shadow-2xs">
                <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
                  Executive Analysis Summary
                </span>
                <p className="text-sm leading-relaxed text-charcoal-700">
                  {analysis.summary}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-mono text-xs text-charcoal-500 sm:justify-start">
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
          </div>

          {/* Attention Level Count Cards */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-red-200/80 bg-red-50/50 p-3.5 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                <span className="font-serif text-2xl font-bold text-red-700">
                  {analysis.critical_count}
                </span>
              </div>
              <span className="mt-0.5 block font-mono text-[11px] font-medium text-red-700">
                High Attention
              </span>
            </div>

            <div className="rounded-lg border border-warmAmber-200/80 bg-warmAmber-50/50 p-3.5 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-warmAmber-700" />
                <span className="font-serif text-2xl font-bold text-warmAmber-800">
                  {analysis.warning_count}
                </span>
              </div>
              <span className="mt-0.5 block font-mono text-[11px] font-medium text-warmAmber-800">
                Medium Attention
              </span>
            </div>

            <div className="rounded-lg border border-charcoal-200/80 bg-charcoal-50/60 p-3.5 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Info className="h-4 w-4 text-charcoal-600" />
                <span className="font-serif text-2xl font-bold text-charcoal-800">
                  {analysis.info_count}
                </span>
              </div>
              <span className="mt-0.5 block font-mono text-[11px] font-medium text-charcoal-600">
                Low / Informational
              </span>
            </div>
          </div>

          {/* Transparent Score Calculation Ledger */}
          <div className="mt-5 border-t border-charcoal-100 pt-4">
            <button
              type="button"
              onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
              className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-charcoal-600 transition-colors hover:text-forest-800"
            >
              <Calculator className="h-3.5 w-3.5 text-forest-700" />
              How is this Attention Score calculated?
              <ChevronDown
                className={`h-3.5 w-3.5 text-charcoal-400 transition-transform ${
                  showScoreBreakdown ? 'rotate-180 text-forest-700' : ''
                }`}
              />
            </button>

            {showScoreBreakdown && (
              <div className="mt-3 rounded-lg border border-charcoal-200/80 bg-white p-4.5 animate-fade-in shadow-2xs">
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-charcoal-100">
                    <span className="text-charcoal-700">Baseline score</span>
                    <span className="font-semibold text-charcoal-900">{scoreBreakdown.startingScore} pts</span>
                  </div>
                  {scoreBreakdown.deductions.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-charcoal-600">
                      <span>{d.label}</span>
                      <span className="font-semibold text-red-600">&minus;{d.amount} pts</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-charcoal-200 pt-2 font-bold text-charcoal-900">
                    <span>Resulting Attention Score</span>
                    <span className="text-forest-800">{analysis.score} / 100</span>
                  </div>
                </div>
                <p className="mt-3.5 text-[11px] leading-relaxed text-charcoal-500 border-t border-charcoal-100 pt-3">
                  This score is an informational measure based on verified findings and exact quotes identified in the document text. It is designed to signal how heavily weighted the agreement is with provisions requiring user scrutiny. It does not constitute a formal legal risk or legal fairness judgment.
                </p>
              </div>
            )}
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
                No Flagged Clauses Detected
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-charcoal-500">
                The analysis did not detect significant unilateral clauses requiring attention in this document. Always review terms carefully before agreeing.
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
