export type Severity = 'critical' | 'warning' | 'info';

export interface Finding {
  id: string;
  analysis_id: string;
  category: string;
  severity: Severity;
  title: string;
  description: string;
  excerpt: string;
  recommendation: string;
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
