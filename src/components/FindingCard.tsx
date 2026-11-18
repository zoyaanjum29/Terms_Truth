import type { Finding } from '@/lib/types';
import { SeverityIcon } from './ScoreRing';
import {
  ChevronDown,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Quote,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';

interface FindingCardProps {
  finding: Finding;
  index: number;
}

const attentionConfig: Record<
  string,
  {
    border: string;
    badge: string;
    badgeText: string;
    sublabel: string;
  }
> = {
  critical: {
    border: 'border-l-red-600',
    badge: 'bg-red-50 border-red-200 text-red-800',
    badgeText: 'Important',
    sublabel: 'Significant effect on your rights, money, or privacy',
  },
  warning: {
    border: 'border-l-warmAmber-600',
    badge: 'bg-warmAmber-50 border-warmAmber-200 text-warmAmber-800',
    badgeText: 'Be Aware',
    sublabel: 'Conditions worth understanding before you agree',
  },
  info: {
    border: 'border-l-charcoal-400',
    badge: 'bg-charcoal-100 border-charcoal-200 text-charcoal-700',
    badgeText: 'Informational',
    sublabel: 'Standard term or helpful context',
  },
};

/**
 * Translates clause titles or findings into direct, user-focused real-world impact headings.
 * Strictly relies on the specific finding title and explicit clause context.
 * Never uses broad category matching (e.g. account, content, subscription) to invent consequences.
 */
function getImpactHeadline(finding: Finding): string {
  const t = (finding.title || '').trim();
  const lowerTitle = t.toLowerCase();

  // If title is missing, fallback safely
  if (!t) {
    return 'Important Agreement Provision';
  }

  // 1. If already phrased directly with "You " or "Your ", use it directly
  if (/^you\b/i.test(t) || /^your\b/i.test(t)) {
    return t;
  }

  // 2. Specific Exceptions & User Rights
  // Arbitration opt-out rights must NEVER be described as restricting legal options
  if (lowerTitle.includes('opt-out') || lowerTitle.includes('opt out') || lowerTitle.includes('right to opt')) {
    if (lowerTitle.includes('arbitration')) {
      return 'You have the right to opt out of mandatory arbitration.';
    }
    return t;
  }

  // User retains ownership of content
  if (lowerTitle.includes('user retain') || lowerTitle.includes('user own') || lowerTitle.includes('retains ownership')) {
    return 'You retain ownership of your content.';
  }

  // 3. Narrow, specific title-based patterns
  // Class action waiver
  if (lowerTitle.includes('class action')) {
    return 'You cannot join a class action lawsuit against the company.';
  }

  // Binding / Forced Arbitration (excluding opt-out already handled above)
  if (
    lowerTitle.includes('forced arbitration') ||
    lowerTitle.includes('binding arbitration') ||
    lowerTitle.includes('mandatory arbitration') ||
    lowerTitle === 'arbitration' ||
    lowerTitle.includes('arbitration clause')
  ) {
    return 'You may have limited legal options if a dispute occurs.';
  }

  // Selling personal data to third parties
  if (
    lowerTitle.includes('data sold') ||
    lowerTitle.includes('sell personal') ||
    lowerTitle.includes('sale of personal') ||
    lowerTitle.includes('sale of data') ||
    (lowerTitle.includes('third party') && (lowerTitle.includes('sell') || lowerTitle.includes('sale')))
  ) {
    return 'Your personal information may be shared with or sold to third parties.';
  }

  // Broad / extensive data collection
  if (lowerTitle.includes('broad data') || lowerTitle.includes('extensive data') || lowerTitle.includes('data collection')) {
    return 'The service collects personal and activity data beyond basic use.';
  }

  // Account termination or suspension without notice
  if (
    (lowerTitle.includes('termination') || lowerTitle.includes('deletion') || lowerTitle.includes('suspend')) &&
    (lowerTitle.includes('account') || lowerTitle.includes('access'))
  ) {
    return 'You could lose access to your account without prior notice.';
  }

  // Broad commercial content license
  if (
    (lowerTitle.includes('content') || lowerTitle.includes('license')) &&
    (lowerTitle.includes('broad license') || lowerTitle.includes('commercial') || lowerTitle.includes('grant broad'))
  ) {
    return 'The company may use your uploaded content commercially.';
  }

  // Limitation of liability
  if (lowerTitle.includes('liability cap') || lowerTitle.includes('limitation of liability') || lowerTitle.includes('limits liability')) {
    return 'The company limits what it must pay if you suffer harm or financial loss.';
  }

  // Unilateral terms changes
  if (
    (lowerTitle.includes('unilateral') || lowerTitle.includes('without notice')) &&
    (lowerTitle.includes('change') || lowerTitle.includes('terms') || lowerTitle.includes('modification'))
  ) {
    return 'The company could change terms and service conditions at any time.';
  }

  // Recurring subscription auto-renewal
  if (
    lowerTitle.includes('auto-renewal') ||
    lowerTitle.includes('automatic renewal') ||
    lowerTitle.includes('recurring bill') ||
    lowerTitle.includes('recurring charge')
  ) {
    return 'You could be charged automatically when your subscription renews.';
  }

  // Physical location tracking
  if (lowerTitle.includes('location') && (lowerTitle.includes('track') || lowerTitle.includes('data'))) {
    return 'Your physical location may be tracked and stored.';
  }

  // Third-party ad / cross-site tracking
  if (lowerTitle.includes('third-party ad') || lowerTitle.includes('cross-site') || (lowerTitle.includes('track') && lowerTitle.includes('ad'))) {
    return 'Your online activity may be monitored across the web.';
  }

  // Indemnification
  if (lowerTitle.includes('indemnif')) {
    return "You may be responsible for paying the company's legal expenses.";
  }

  // Restricted refund window / non-refundable
  if (
    lowerTitle.includes('refund') &&
    (lowerTitle.includes('restrict') || lowerTitle.includes('no refund') || lowerTitle.includes('window') || lowerTitle.includes('non-refundable'))
  ) {
    return 'You may have limited options or strict deadlines to get a refund.';
  }

  // Gag clause / non-disparagement
  if (lowerTitle.includes('gag') || lowerTitle.includes('non-disparagement')) {
    return 'You could be restricted from publicly criticizing the company.';
  }

  // Remote governing law / jurisdiction
  if (lowerTitle.includes('jurisdiction') || lowerTitle.includes('governing law')) {
    return 'Legal disputes must be handled in the company’s designated remote location.';
  }

  // Biometric data processing
  if (lowerTitle.includes('biometric')) {
    return 'Your biometric data may be collected and processed.';
  }

  // Jury trial waiver
  if (lowerTitle.includes('jury trial') && lowerTitle.includes('waiv')) {
    return 'You give up your right to a trial decided by a jury.';
  }

  // 4. Neutral safe fallback: use actual finding title
  return t;
}

export function FindingCard({ finding, index }: FindingCardProps) {
  const [clauseExpanded, setClauseExpanded] = useState(false);
  const cfg = attentionConfig[finding.severity] ?? attentionConfig.info;

  // Map internal attention level to user-friendly label
  const attentionLabel =
    finding.attention_level === 'High'
      ? 'Important'
      : finding.attention_level === 'Medium'
      ? 'Be Aware'
      : finding.attention_level === 'Low'
      ? 'Informational'
      : cfg.badgeText;

  const impactHeadline = getImpactHeadline(finding);

  return (
    <div
      className={`animate-slide-up rounded-xl border border-charcoal-200/80 bg-white shadow-2xs transition-all hover:border-charcoal-300 ${cfg.border} border-l-[5px] p-5 sm:p-6`}
      style={{ animationDelay: `${index * 45}ms`, opacity: 0 }}
    >
      {/* Top Metadata Header: Attention Badge, Category, Certainty */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-charcoal-100">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wide ${cfg.badge}`}
          >
            <SeverityIcon severity={finding.severity} />
            <span>{attentionLabel}</span>
          </span>

          <span className="font-mono text-xs font-semibold text-charcoal-600 bg-ivory-100/70 border border-charcoal-100 px-2 py-0.5 rounded">
            § {finding.category}
          </span>

          {finding.certainty === 'Uncertain' && (
            <span
              className="inline-flex items-center gap-1 rounded border border-warmAmber-200 bg-warmAmber-50 px-2 py-0.5 font-mono text-[10px] text-warmAmber-800"
              title="Conditional or ambiguous wording in agreement"
            >
              <HelpCircle className="h-3 w-3 text-warmAmber-700" />
              Ambiguous / Discretionary
            </span>
          )}
        </div>

        {finding.title && finding.title !== impactHeadline && (
          <span className="font-mono text-[11px] text-charcoal-400">
            Clause: {finding.title}
          </span>
        )}
      </div>

      {/* Main Content Flow */}
      <div className="mt-4 space-y-4">
        {/* A. Real-World Impact (MOST PROMINENT) */}
        <div>
          <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-forest-800">
            Real-World Impact
          </span>
          <h3 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-charcoal-950">
            {impactHeadline}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal-700">
            {finding.description}
          </p>
        </div>

        {/* B. Why this matters */}
        <div className="rounded-lg border border-charcoal-100 bg-ivory-50/60 p-4">
          <h4 className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-charcoal-700 mb-1">
            <AlertCircle className="h-3.5 w-3.5 text-warmAmber-700 flex-shrink-0" />
            Why this matters
          </h4>
          <p className="text-xs sm:text-sm leading-relaxed text-charcoal-800">
            {finding.why_it_matters || finding.description}
          </p>

          {finding.certainty === 'Uncertain' && (
            <div className="mt-2.5 rounded border border-warmAmber-200/80 bg-warmAmber-50/90 p-2.5 text-[11px] leading-relaxed text-warmAmber-900 flex items-start gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-warmAmber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Discretionary Wording:</strong> The agreement uses conditional phrases like &ldquo;may&rdquo; or &ldquo;at our discretion.&rdquo; The actual impact depends on whether the company exercises this power.
              </div>
            </div>
          )}

          {finding.missing_information && (
            <div className="mt-2.5 rounded border border-warmAmber-200/80 bg-warmAmber-50/90 p-2.5 text-[11px] leading-relaxed text-warmAmber-900 flex items-start gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-warmAmber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Missing Term:</strong> {finding.missing_information}
              </div>
            </div>
          )}
        </div>

        {/* C. What you can do */}
        {finding.recommendation && (
          <div className="rounded-lg border border-forest-100 bg-forest-50/30 p-4">
            <h4 className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-forest-800 mb-1">
              <Lightbulb className="h-3.5 w-3.5 text-forest-700 flex-shrink-0" />
              What you can do
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed text-charcoal-800">
              {finding.recommendation}
            </p>
            <span className="block mt-2 font-mono text-[10px] text-charcoal-400">
              Informational suggestion &bull; Not legal advice
            </span>
          </div>
        )}

        {/* D. View original clause (Expandable drawer) */}
        {finding.excerpt && (
          <div className="border-t border-charcoal-100 pt-3">
            <button
              type="button"
              onClick={() => setClauseExpanded(!clauseExpanded)}
              className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-charcoal-600 hover:text-forest-800 transition-colors"
            >
              <Quote className="h-3.5 w-3.5 text-forest-700" />
              <span>{clauseExpanded ? 'Hide original clause' : 'View original clause'}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-charcoal-400 transition-transform duration-200 ${
                  clauseExpanded ? 'rotate-180 text-forest-700' : ''
                }`}
              />
            </button>

            {clauseExpanded && (
              <div className="mt-3 rounded-lg border border-charcoal-200/90 bg-white p-4 shadow-2xs animate-fade-in">
                <div className="mb-2 flex items-center justify-between text-[10px] font-mono">
                  <span className="font-bold uppercase tracking-wider text-forest-800 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-forest-700" />
                    Exact Quote from Agreement
                  </span>
                  <span className="text-charcoal-400">Verbatim document text</span>
                </div>
                <blockquote className="border-l-2 border-forest-600 bg-ivory-50/70 py-2.5 pl-3.5 pr-3 font-mono text-xs italic leading-relaxed text-charcoal-800 rounded-r">
                  &ldquo;{finding.excerpt}&rdquo;
                </blockquote>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
