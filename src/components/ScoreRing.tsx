import type { Severity } from '@/lib/types';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface ScoreRingProps {
  score: number;
  grade: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreRing({ score, grade, size = 'lg' }: ScoreRingProps) {
  const dimensions = {
    sm: { box: 64, stroke: 5, text: 'text-lg', label: 'text-[10px]' },
    md: { box: 100, stroke: 7, text: 'text-2xl', label: 'text-xs' },
    lg: { box: 160, stroke: 10, text: 'text-4xl', label: 'text-sm' },
  };
  const dim = dimensions[size];
  const radius = (dim.box - dim.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: dim.box, height: dim.box }}
    >
      <svg
        width={dim.box}
        height={dim.box}
        className="transform -rotate-90"
      >
        <circle
          cx={dim.box / 2}
          cy={dim.box / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={dim.stroke}
          className="text-slate-200"
        />
        <circle
          cx={dim.box / 2}
          cy={dim.box / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={dim.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-bold ${dim.text} text-slate-800`}>{grade}</span>
        <span className={`${dim.label} font-medium text-slate-400`}>
          {score}/100
        </span>
      </div>
    </div>
  );
}

export function SeverityIcon({ severity }: { severity: Severity }) {
  if (severity === 'critical')
    return <ShieldAlert className="h-5 w-5 text-red-500" />;
  if (severity === 'warning')
    return <Shield className="h-5 w-5 text-amber-500" />;
  return <Info className="h-5 w-5 text-sky-500" />;
}

export function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    B: 'bg-teal-100 text-teal-700 ring-teal-200',
    C: 'bg-amber-100 text-amber-700 ring-amber-200',
    D: 'bg-orange-100 text-orange-700 ring-orange-200',
    F: 'bg-red-100 text-red-700 ring-red-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${colors[grade] ?? colors.F}`}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      Grade {grade}
    </span>
  );
}
