import type { Finding } from '@/lib/types';
import { SeverityIcon } from './ScoreRing';
import {
  ChevronDown,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Quote,
  CheckCircle2,
  FileSearch,
} from 'lucide-react';
import { useState } from 'react';

interface FindingCardProps {
  finding: Finding;
  index: number;
}

const severityConfig: Record<
  string,
  {
    border: string;
    accentBg: string;
    badge: string;
    badgeText: string;
    label: string;
  }
> = {
  critical: {
    border: 'border-l-red-600',
    accentBg: 'bg-red-50/30',
    badge: 'bg-red-50 border-red-200 text-red-800',
    badgeText: 'High Attention',
    label: 'High Risk Provision',
  },
  warning: {
    border: 'border-l-warmAmber-600',
    accentBg: 'bg-warmAmber-50/25',
    badge: 'bg-warmAmber-50 border-warmAmber-200 text-warmAmber-800',
    badgeText: 'Medium Attention',
    label: 'Moderate Provision',
  },
  info: {
    border: 'border-l-charcoal-400',
    accentBg: 'bg-charcoal-50/30',
    badge: 'bg-charcoal-100 border-charcoal-200 text-charcoal-700',
    badgeText: 'Low Attention',
    label: 'Standard / Informational',
  },
};

export function FindingCard({ finding, index }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = severityConfig[finding.severity] ?? severityConfig.info;

  const hasAIFields = Boolean(
    finding.why_it_matters ||
    finding.attention_level ||
    finding.certainty ||
    finding.missing_information
  );

  return (
    <div
      className={`animate-slide-up rounded-xl border border-charcoal-200/80 bg-white shadow-xs transition-all hover:border-charcoal-300 ${cfg.border} border-l-[5px]`}
      style={{ animationDelay: `${index * 45}ms`, opacity: 0 }}
    >
      {/* Card Clickable Summary Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-ivory-50/50"
      >
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <div className="mt-1 flex-shrink-0">
            <SeverityIcon severity={finding.severity} />
          </div>

          <div className="min-w-0 flex-1">
            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${cfg.badge}`}
              >
                {finding.attention_level ? `${finding.attention_level} Attention` : cfg.badgeText}
              </span>

              <span className="font-mono text-xs font-medium text-charcoal-500">
                § {finding.category}
              </span>

              {finding.certainty && (
                <span
                  className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] ${
                    finding.certainty === 'Explicit'
                      ? 'border-forest-200 bg-forest-50/60 text-forest-800'
                      : 'border-warmAmber-200 bg-warmAmber-50 text-warmAmber-800'
                  }`}
                  title={
                    finding.certainty === 'Explicit'
                      ? 'Directly stated in agreement text'
                      : 'Inferred or ambiguous wording'
                  }
                >
                  {finding.certainty === 'Explicit' ? (
                    <CheckCircle2 className="h-3 w-3 text-forest-700" />
                  ) : (
                    <HelpCircle className="h-3 w-3 text-warmAmber-700" />
                  )}
                  {finding.certainty === 'Explicit' ? 'Directly Stated' : 'Ambiguous / Inferred'}
                </span>
              )}
            </div>

            {/* Title & Plain English Preview */}
            <h3 className="mt-2 font-serif text-base font-bold tracking-tight text-charcoal-900">
              {finding.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-charcoal-600 line-clamp-2">
              {finding.description}
            </p>
          </div>
        </div>

        {/* Accordion Toggle */}
        <div className="mt-1 flex items-center gap-1 text-xs font-medium text-charcoal-400">
          <span className="hidden sm:inline font-mono text-[11px]">
            {expanded ? 'Collapse' : 'Examine Clause'}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-charcoal-400 transition-transform duration-200 ${
              expanded ? 'rotate-180 text-forest-800' : ''
            }`}
          />
        </div>
      </button>

      {/* Expanded Dossier Evidence View */}
      {expanded && (
        <div className="border-t border-charcoal-100 bg-ivory-50/30 px-6 pb-6 pt-5 animate-fade-in space-y-4">
          {/* 1. Original Evidence Quote */}
          {finding.excerpt && (
            <div className="rounded-lg border border-charcoal-200/90 bg-white p-4 shadow-2xs">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-forest-800">
                  <Quote className="h-3 w-3 text-forest-700" />
                  Original Contract Clause (Exact Quote)
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-forest-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Quote Verified
                </span>
              </div>
              <blockquote className="border-l-2 border-forest-600 bg-ivory-50/70 py-2.5 pl-3.5 pr-3 text-xs leading-relaxed text-charcoal-700 font-mono italic rounded-r">
                &ldquo;{finding.excerpt}&rdquo;
              </blockquote>
            </div>
          )}

          {/* 2. Plain-English Explanation */}
          <div className="rounded-lg border border-charcoal-100 bg-white p-4 shadow-2xs">
            <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-charcoal-500">
              <FileSearch className="h-3.5 w-3.5 text-charcoal-400" />
              Plain-English Breakdown
            </span>
            <p className="text-sm leading-relaxed text-charcoal-800">
              {finding.description}
            </p>
          </div>

          {/* 3. Practical Impact / Why It Matters */}
          {hasAIFields && finding.why_it_matters && (
            <div className="rounded-lg border border-charcoal-100 bg-white p-4 shadow-2xs">
              <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-charcoal-500">
                <AlertCircle className="h-3.5 w-3.5 text-warmAmber-600" />
                Practical Impact (Why It Matters)
              </span>
              <p className="text-sm leading-relaxed text-charcoal-800">
                {finding.why_it_matters}
              </p>
            </div>
          )}

          {/* 4. Missing Information in Agreement */}
          {finding.missing_information && (
            <div className="rounded-lg border border-warmAmber-200 bg-warmAmber-50/50 p-4">
              <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-warmAmber-800">
                <HelpCircle className="h-3.5 w-3.5 text-warmAmber-700" />
                Omission / Missing Term
              </span>
              <p className="text-xs leading-relaxed text-warmAmber-900">
                {finding.missing_information}
              </p>
            </div>
          )}

          {/* 5. Recommended Strategic Action */}
          {finding.recommendation && (
            <div className="rounded-lg border border-forest-100 bg-forest-50/40 p-4">
              <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-forest-800">
                <Lightbulb className="h-3.5 w-3.5 text-forest-700" />
                Recommended Consideration
              </span>
              <p className="text-sm leading-relaxed text-charcoal-800">
                {finding.recommendation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
