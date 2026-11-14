import type { Finding } from '@/lib/types';
import { SeverityIcon } from './ScoreRing';
import {
  ChevronDown,
  HelpCircle,
  AlertOctagon,
  Lightbulb,
  Quote,
} from 'lucide-react';
import { useState } from 'react';

interface FindingCardProps {
  finding: Finding;
  index: number;
}

const severityStyles: Record<string, { border: string; bg: string; chip: string }> = {
  critical: {
    border: 'border-l-red-500',
    bg: 'bg-red-50/50',
    chip: 'bg-red-100 text-red-700',
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50/50',
    chip: 'bg-amber-100 text-amber-700',
  },
  info: {
    border: 'border-l-sky-500',
    bg: 'bg-sky-50/50',
    chip: 'bg-sky-100 text-sky-700',
  },
};

export function FindingCard({ finding, index }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = severityStyles[finding.severity];

  const hasAIFields =
    finding.why_it_matters ||
    finding.attention_level ||
    finding.certainty ||
    finding.missing_information;

  return (
    <div
      className={`animate-slide-up rounded-r-xl border-l-4 ${style.border} ${style.bg} border border-slate-200/60 shadow-sm`}
      style={{ animationDelay: `${index * 60}ms`, opacity: 0 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="mt-0.5 flex-shrink-0">
          <SeverityIcon severity={finding.severity} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.chip}`}>
              {finding.attention_level ?? finding.severity}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {finding.category}
            </span>
            {finding.certainty && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  finding.certainty === 'Explicit'
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-amber-100/70 text-amber-600'
                }`}
              >
                <HelpCircle className="h-3 w-3" />
                {finding.certainty}
              </span>
            )}
          </div>
          <h4 className="mt-1.5 text-sm font-semibold text-slate-800">
            {finding.title}
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {finding.description}
          </p>
        </div>
        <ChevronDown
          className={`mt-1 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {expanded && (
        <div className="animate-fade-in border-t border-slate-200/60 px-4 pb-4 pt-3 pl-14">
          {finding.excerpt && (
            <div className="mb-3">
              <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Quote className="h-3 w-3" />
                Exact quote from the document
              </p>
              <blockquote className="border-l-2 border-slate-300 bg-white/60 py-2 pl-3 pr-2 text-sm italic leading-relaxed text-slate-500 rounded-r-lg">
                &ldquo;{finding.excerpt}&rdquo;
              </blockquote>
            </div>
          )}
          {hasAIFields && finding.why_it_matters && (
            <div className="mb-3">
              <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <AlertOctagon className="h-3 w-3" />
                Why it matters
              </p>
              <p className="text-sm leading-relaxed text-slate-700">
                {finding.why_it_matters}
              </p>
            </div>
          )}
          {finding.missing_information && (
            <div className="mb-3">
              <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-500/70">
                <HelpCircle className="h-3 w-3" />
                Not specified in the document
              </p>
              <p className="text-sm leading-relaxed text-amber-700/80">
                {finding.missing_information}
              </p>
            </div>
          )}
          <div>
            <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Lightbulb className="h-3 w-3" />
              What you should do
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              {finding.recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
