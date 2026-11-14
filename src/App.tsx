import { useEffect, useState, useCallback } from 'react';
import {
  Scale,
  ShieldCheck,
  ShieldAlert,
  FileSearch,
  Sparkles,
  TrendingUp,
  Clock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Analysis, Finding, EdgeFunctionResult } from '@/lib/types';
import { AnalyzerInput } from '@/components/AnalyzerInput';
import { AnalysisReport } from '@/components/AnalysisReport';
import { HistoryList } from '@/components/HistoryList';

type View = 'home' | 'report';

interface ReportState {
  analysis: Analysis;
  findings: Finding[];
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryData, setRetryData] = useState<{ text: string; title: string } | null>(null);
  const [report, setReport] = useState<ReportState | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setHistoryLoading(false);
      return;
    }
    setHistory(data ?? []);
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const callEdgeFunction = async (text: string, title: string): Promise<EdgeFunctionResult> => {
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-agreement`;
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ text, title }),
    });

    if (!response.ok) {
      let errorMsg = `Analysis failed (status ${response.status})`;
      try {
        const errorBody = await response.json();
        if (errorBody?.error) errorMsg = errorBody.error;
      } catch {
        // response body wasn't JSON, use generic message
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    if (!data || typeof data.score !== 'number' || !Array.isArray(data.findings)) {
      throw new Error('The AI analysis returned an unexpected response format.');
    }
    return data as EdgeFunctionResult;
  };

  const handleAnalyze = async (text: string, title: string) => {
    setLoading(true);
    setError(null);
    setRetryData({ text, title });
    try {
      const result = await callEdgeFunction(text, title);

      const { data: analysisRow, error: insertError } = await supabase
        .from('analyses')
        .insert({
          title,
          source_text: text,
          score: result.score,
          grade: result.grade,
          summary: result.summary,
          word_count: result.wordCount,
          critical_count: result.criticalCount,
          warning_count: result.warningCount,
          info_count: result.infoCount,
        })
        .select()
        .single();

      if (insertError || !analysisRow) {
        throw new Error(insertError?.message ?? 'Failed to save analysis');
      }

      const analysisId = analysisRow.id;
      const findingRows = result.findings.map((f) => ({
        analysis_id: analysisId,
        category: f.category,
        severity: f.severity,
        title: f.title,
        description: f.description,
        excerpt: f.excerpt,
        recommendation: f.recommendation,
        why_it_matters: f.why_it_matters,
        attention_level: f.attention_level,
        certainty: f.certainty,
        missing_information: f.missing_information,
      }));

      let savedFindings: Finding[] = [];
      if (findingRows.length > 0) {
        const { data: findingData, error: findingError } = await supabase
          .from('findings')
          .insert(findingRows)
          .select();
        if (findingError) throw new Error(findingError.message);
        savedFindings = (findingData ?? []) as Finding[];
      }

      setReport({
        analysis: analysisRow as Analysis,
        findings: savedFindings,
      });
      setView('report');
      setRetryData(null);
      loadHistory();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while analyzing the document.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (retryData) {
      handleAnalyze(retryData.text, retryData.title);
    }
  };

  const handleSelectHistory = async (id: string) => {
    setError(null);
    const { data: analysisData, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (analysisError || !analysisData) {
      setError('Could not load this analysis.');
      return;
    }

    const { data: findingData, error: findingError } = await supabase
      .from('findings')
      .select('*')
      .eq('analysis_id', id)
      .order('created_at', { ascending: true });

    if (findingError) {
      setError('Could not load findings for this analysis.');
      return;
    }

    setReport({
      analysis: analysisData as Analysis,
      findings: (findingData ?? []) as Finding[],
    });
    setView('report');
  };

  const handleDeleteAnalysis = async () => {
    if (!report) return;
    const id = report.analysis.id;
    await supabase.from('analyses').delete().eq('id', id);
    setView('home');
    setReport(null);
    loadHistory();
  };

  const handleDeleteFromHistory = async (id: string) => {
    await supabase.from('analyses').delete().eq('id', id);
    loadHistory();
  };

  const handleBack = () => {
    setView('home');
    setReport(null);
    setError(null);
  };

  const stats = {
    total: history.length,
    critical: history.reduce((sum, a) => sum + a.critical_count, 0),
    avgScore:
      history.length > 0
        ? Math.round(history.reduce((sum, a) => sum + a.score, 0) / history.length)
        : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <button
            onClick={handleBack}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 shadow-sm">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-base font-bold leading-tight text-slate-800">
                TermsTruth
              </h1>
              <p className="text-[10px] leading-tight text-slate-400">
                Know what you&apos;re agreeing to
              </p>
            </div>
          </button>
          {view === 'home' && history.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <TrendingUp className="h-3.5 w-3.5 text-teal-500" />
                Avg score: <strong className="font-semibold text-slate-700">{stats.avgScore}</strong>
              </span>
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                {stats.critical} critical found
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {view === 'home' && (
          <div className="space-y-8">
            <div className="text-center animate-fade-in">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-xs font-semibold text-teal-700">
                  AI-Powered Legal Analysis
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
                Don&apos;t just click{' '}
                <span className="text-teal-600">&quot;I Agree&quot;</span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-500">
                Paste any terms of service and get an AI-powered analysis with red-flag alerts, exact evidence quotes, and plain-English explanations of what you&apos;re actually signing up for.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 animate-slide-up">
              <FeatureCard
                icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
                title="Attention Score"
                description="Get a transparent score based on verified findings — see exactly how it's calculated."
              />
              <FeatureCard
                icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
                title="AI Clause Detection"
                description="Our AI reads the entire agreement and identifies concerning clauses — not just keyword matches."
              />
              <FeatureCard
                icon={<FileSearch className="h-5 w-5 text-teal-600" />}
                title="Evidence-Backed"
                description="Every finding includes an exact quote from the document, verified against the source text."
              />
            </div>

            <AnalyzerInput
              onAnalyze={handleAnalyze}
              loading={loading}
              error={error}
              onRetry={handleRetry}
              canRetry={retryData !== null}
            />

            <div className="border-t border-slate-200 pt-6">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">
                  Recent Analyses
                </h3>
              </div>
              {historyLoading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-[72px] animate-pulse rounded-xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : (
                <HistoryList
                  analyses={history}
                  onSelect={handleSelectHistory}
                  onDelete={handleDeleteFromHistory}
                />
              )}
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-amber-700">
                TermsTruth uses AI to analyze legal documents for informational purposes only — it is not a substitute for professional legal advice. Always consult a qualified attorney for important legal decisions.
              </p>
            </div>
          </div>
        )}

        {view === 'report' && report && (
          <AnalysisReport
            analysis={report.analysis}
            findings={report.findings}
            onBack={handleBack}
            onDelete={handleDeleteAnalysis}
          />
        )}
      </main>

      <footer className="border-t border-slate-200/70 py-6">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="text-xs text-slate-400">
            TermsTruth &mdash; Understanding the fine print, one document at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}
