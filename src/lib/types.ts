export type Severity = 'critical' | 'warning' | 'info';
export type AttentionLevel = 'High' | 'Medium' | 'Low';
export type Certainty = 'Explicit' | 'Uncertain';

export interface Finding {
  id: string;
  analysis_id: string;
  category: string;
  severity: Severity;
  title: string;
  description: string;
  excerpt: string;
  recommendation: string;
  why_it_matters: string;
  attention_level: AttentionLevel | null;
  certainty: Certainty | null;
  missing_information: string | null;
  created_at: string;
}

export interface Analysis {
  id: string;
  title: string;
  source_text: string;
  score: number;
  grade: string;
  summary: string;
  word_count: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  created_at: string;
}

export interface AnalysisWithFindings extends Analysis {
  findings: Finding[];
}

export interface EdgeFunctionResult {
  summary: string;
  score: number;
  grade: string;
  wordCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  findings: {
    category: string;
    severity: Severity;
    title: string;
    description: string;
    excerpt: string;
    recommendation: string;
    why_it_matters: string;
    attention_level: AttentionLevel;
    certainty: Certainty;
    missing_information: string | null;
  }[];
}
