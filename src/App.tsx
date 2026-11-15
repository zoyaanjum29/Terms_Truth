import { useEffect, useState, useCallback } from 'react';
import {
  ShieldAlert,
  FileSearch,
  FileText,
  Layers,
  AlertTriangle,
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

  
const callEdgeFunction = async (
  text: string,
  title: string
): Promise<EdgeFunctionResult> => {
  const { data, error } = await supabase.functions.invoke(
    'analyze-agreement',
    {
      body: { text, title },
    }
  );

  if (error) {
    throw new Error(error.message || 'Analysis request failed.');
  }

  if (
    !data ||
    typeof data.score !== 'number' ||
    !Array.isArray(data.findings)
  ) {
    throw new Error(
      'The AI analysis returned an unexpected response format.'
    );
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

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-charcoal-900 flex flex-col font-sans">
      {/* Editorial Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-charcoal-200/80 bg-[#FAF8F5]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={handleBack}
            className="text-left transition-opacity hover:opacity-85"
          >
            <span className="font-serif text-2xl font-bold tracking-tight text-charcoal-950 block leading-none">
              TermsTruth
            </span>
            <span className="text-xs font-normal text-charcoal-500 block leading-tight mt-1">
              Understand before you agree.
            </span>
          </button>

          {view === 'home' && history.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-charcoal-500">
              <span className="h-1.5 w-1.5 rounded-full bg-forest-700" />
              <span>
                {history.length} {history.length === 1 ? 'document' : 'documents'} in registry
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-8">
        {view === 'home' && (
          <div className="space-y-10">
            {/* Focused Editorial Hero */}
            <div className="text-center pt-2 pb-1 animate-fade-in">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-charcoal-950 max-w-2xl mx-auto leading-tight">
                Know What You&apos;re Agreeing To.
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-charcoal-600 font-normal">
                Understand the hidden clauses in terms of service, privacy policies and agreements &mdash; explained in plain English.
              </p>
            </div>

            {/* Main Focus: Agreement Input Desk */}
            <AnalyzerInput
              onAnalyze={handleAnalyze}
              loading={loading}
              error={error}
              onRetry={handleRetry}
              canRetry={retryData !== null}
            />

            {/* Methodology Assurance Pillars */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 animate-slide-up">
              <MethodCard
                icon={<FileSearch className="h-4 w-4 text-forest-700" />}
                title="Exact Quote Evidence"
                description="Every finding cites the original text directly from the document to verify its source."
              />
              <MethodCard
                icon={<FileText className="h-4 w-4 text-forest-700" />}
                title="Plain-English Translation"
                description="Complex legal clauses are translated into clear, everyday explanations of what you accept."
              />
              <MethodCard
                icon={<ShieldAlert className="h-4 w-4 text-warmAmber-700" />}
                title="Attention Score"
                description="A transparent score calculated from identified clauses to indicate provisions that warrant your review."
              />
            </div>

            {/* Polished Document Registry */}
            <div className="border-t border-charcoal-200/80 pt-8">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-forest-800" />
                  <h3 className="font-serif text-base font-bold text-charcoal-900">
                    Document Registry
                  </h3>
                </div>
                {history.length > 0 && (
                  <span className="font-mono text-xs text-charcoal-400">
                    Showing {history.length} {history.length === 1 ? 'record' : 'records'}
                  </span>
                )}
              </div>

              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-xl border border-charcoal-200/70 bg-white"
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

            {/* Transparent Disclaimer */}
            <div className="flex items-start gap-3 rounded-lg border border-charcoal-200/80 bg-white/70 p-4 shadow-2xs">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warmAmber-700" />
              <p className="text-xs leading-relaxed text-charcoal-600">
                <strong>Legal Notice:</strong> TermsTruth is an automated analytical tool provided for informational purposes only. It is not an attorney and cannot provide legal advice. Always review important contracts with qualified legal counsel.
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

      {/* Understated Editorial Footer */}
      <footer className="border-t border-charcoal-200/80 py-6 mt-auto bg-[#FAF8F5]">
        <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-charcoal-400">
          <p className="font-serif text-charcoal-500">
            TermsTruth &mdash; Understand before you agree.
          </p>
          <p className="font-mono text-[11px]">
            Designed for clear, evidence-based contract review.
          </p>
        </div>
      </footer>
    </div>
  );
}

function MethodCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-charcoal-200/80 bg-white p-5 shadow-2xs transition-all hover:border-charcoal-300">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-ivory-100 border border-charcoal-100">
        {icon}
      </div>
      <h4 className="font-serif text-sm font-bold text-charcoal-900">{title}</h4>
      <p className="mt-1.5 text-xs leading-relaxed text-charcoal-600">
        {description}
      </p>
    </div>
  );
}
