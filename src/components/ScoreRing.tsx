import type { Severity } from '@/lib/types';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface ScoreRingProps {
  score: number;
  grade: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreRing({ score, grade, size = 'lg' }: ScoreRingProps) {
  const dimensions = {
    sm: { box: 68, stroke: 5, text: 'text-xl', label: 'text-[10px]' },
    md: { box: 104, stroke: 7, text: 'text-3xl', label: 'text-xs' },
    lg: { box: 156, stroke: 9, text: 'text-4xl', label: 'text-xs' },
  };
  const dim = dimensions[size];
  const radius = (dim.box - dim.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Deep forest green for high attention scores, warm amber for moderate, rust red for low
  const strokeColor =
    score >= 70 ? '#1F4734' : score >= 50 ? '#C77218' : '#B91C1C';

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: dim.box, height: dim.box }}
    >
      <svg
        width={dim.box}
        height={dim.box}
        className="transform -rotate-90 drop-shadow-sm"
      >
        <circle
          cx={dim.box / 2}
          cy={dim.box / 2}
          r={radius}
          fill="none"
          stroke="#E8DFCE"
          strokeWidth={dim.stroke}
        />
        <circle
          cx={dim.box / 2}
          cy={dim.box / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={dim.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={`font-serif font-bold ${dim.text} leading-none text-charcoal-900`}>
          {grade}
        </span>
        <span className={`mt-1 font-mono font-medium ${dim.label} text-charcoal-500`}>
          {score}/100
        </span>
      </div>
    </div>
  );
}

export function SeverityIcon({ severity }: { severity: Severity }) {
  if (severity === 'critical')
    return <ShieldAlert className="h-4 w-4 text-red-600" />;
  if (severity === 'warning')
    return <AlertTriangle className="h-4 w-4 text-warmAmber-700" />;
  return <Info className="h-4 w-4 text-charcoal-600" />;
}

export function GradeBadge({ grade }: { grade: string }) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    A: { bg: 'bg-forest-50', text: 'text-forest-800', border: 'border-forest-300' },
    B: { bg: 'bg-forest-50/80', text: 'text-forest-700', border: 'border-forest-200' },
    C: { bg: 'bg-warmAmber-50', text: 'text-warmAmber-800', border: 'border-warmAmber-300' },
    D: { bg: 'bg-warmAmber-100/70', text: 'text-warmAmber-900', border: 'border-warmAmber-400' },
    F: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' },
  };

  const style = styles[grade] ?? styles.F;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border ${style.border} ${style.bg} px-2.5 py-0.5 text-xs font-semibold ${style.text} tracking-wide`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      Grade {grade}
    </span>
  );
}
