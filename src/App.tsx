import { useEffect, useState, useCallback } from 'react';
import {
  Layers,
  AlertTriangle,
  Chrome,
  CheckCircle2,
  ChevronDown,
  Download,
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
  const [showInstallGuide, setShowInstallGuide] = useState(false);

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

            {/* TASK 3: How TermsTruth Works */}
            <section className="rounded-2xl border border-charcoal-200/80 bg-white p-6 sm:p-8 shadow-2xs animate-slide-up">
              <div className="text-center max-w-xl mx-auto mb-6">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-forest-800">
                  How TermsTruth Works
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-charcoal-950 mt-1">
                  Three Steps to Clear Agreement Intelligence
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="rounded-xl border border-charcoal-100 bg-ivory-50/50 p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-800 text-ivory-50 font-mono text-xs font-bold flex-shrink-0">
                      1
                    </span>
                    <h3 className="font-serif text-sm font-bold text-charcoal-900">
                      Submit an Agreement
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-charcoal-600">
                    Paste any terms of service, privacy policy, or agreement into the examination desk above—or click to inspect directly on any webpage with our extension.
                  </p>
                </div>

                <div className="rounded-xl border border-charcoal-100 bg-ivory-50/50 p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-800 text-ivory-50 font-mono text-xs font-bold flex-shrink-0">
                      2
                    </span>
                    <h3 className="font-serif text-sm font-bold text-charcoal-900">
                      AI Identifies Clauses
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-charcoal-600">
                    Gemini analyzes the full document to identify clauses concerning arbitration waivers, data selling, unilateral changes, liability limitations, and content licensing.
                  </p>
                </div>

                <div className="rounded-xl border border-charcoal-100 bg-ivory-50/50 p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-800 text-ivory-50 font-mono text-xs font-bold flex-shrink-0">
                      3
                    </span>
                    <h3 className="font-serif text-sm font-bold text-charcoal-900">
                      Review Plain English & Evidence
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-charcoal-600">
                    Get clear, human-readable explanations of every critical clause, paired with the exact verbatim quote verified directly from the source text.
                  </p>
                </div>
              </div>
            </section>

            {/* TASK 2: Chrome Extension Showcase */}
            <section className="rounded-2xl border border-forest-900/10 bg-gradient-to-br from-[#0c1f15] via-forest-950 to-[#0e2319] text-ivory-50 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-forest-700 bg-forest-900/90 px-3 py-1 text-xs text-forest-200 mb-3">
                    <Chrome className="h-3.5 w-3.5 text-warmAmber-300" />
                    <span className="font-mono text-[10px] tracking-wide uppercase font-semibold">
                      Browser Extension
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                    Agreement Analysis, Right Where You Browse.
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-forest-100/90 font-normal">
                    Understand the fine print without copying and pasting walls of text. When you encounter terms or policies while browsing, TermsTruth extracts and analyzes critical provisions in seconds.
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowInstallGuide(!showInstallGuide)}
                    className="inline-flex items-center gap-2 rounded-lg bg-ivory-50 px-4 py-2.5 text-xs font-bold text-forest-950 shadow-sm transition-all hover:bg-white hover:shadow cursor-pointer select-none"
                  >
                    <Download className="h-4 w-4 text-forest-800" />
                    <span>Installation Instructions</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-forest-800 transition-transform ${
                        showInstallGuide ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* The 4-Step Extension Workflow */}
              <div className="mt-6 border-t border-forest-800/80 pt-6">
                <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-forest-300 mb-3">
                  How The Extension Works
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-forest-800/90 bg-forest-900/50 p-3.5">
                    <span className="font-mono text-[10px] text-warmAmber-300 font-bold block mb-1">
                      Step 1 &bull; Open
                    </span>
                    <h4 className="text-xs font-semibold text-white">Open a Webpage</h4>
                    <p className="text-[11px] text-forest-200/80 mt-1 leading-normal">
                      Visit any signup page, Terms of Service, or Privacy Policy in Chrome.
                    </p>
                  </div>

                  <div className="rounded-lg border border-forest-800/90 bg-forest-900/50 p-3.5">
                    <span className="font-mono text-[10px] text-warmAmber-300 font-bold block mb-1">
                      Step 2 &bull; Launch
                    </span>
                    <h4 className="text-xs font-semibold text-white">Click TermsTruth</h4>
                    <p className="text-[11px] text-forest-200/80 mt-1 leading-normal">
                      Click the extension icon in your browser toolbar to open the compact popup.
                    </p>
                  </div>

                  <div className="rounded-lg border border-forest-800/90 bg-forest-900/50 p-3.5">
                    <span className="font-mono text-[10px] text-warmAmber-300 font-bold block mb-1">
                      Step 3 &bull; Scan
                    </span>
                    <h4 className="text-xs font-semibold text-white">Analyze Clauses</h4>
                    <p className="text-[11px] text-forest-200/80 mt-1 leading-normal">
                      Tap Analyze Clauses to isolate the contract text and verify clauses against exact quotes.
                    </p>
                  </div>

                  <div className="rounded-lg border border-forest-800/90 bg-forest-900/50 p-3.5">
                    <span className="font-mono text-[10px] text-warmAmber-300 font-bold block mb-1">
                      Step 4 &bull; Inspect
                    </span>
                    <h4 className="text-xs font-semibold text-white">Review Findings</h4>
                    <p className="text-[11px] text-forest-200/80 mt-1 leading-normal">
                      Read plain-English summaries and expand original clause excerpts in seconds.
                    </p>
                  </div>
                </div>
              </div>

              {/* Original Clause Inspection Callout */}
              <div className="mt-4 rounded-xl border border-forest-800/90 bg-forest-900/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-forest-200">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-warmAmber-300 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Inspect Original Clauses:</strong> Every finding in the extension popup includes an expandable drawer showing the exact, verbatim clause copied directly from the webpage.
                  </span>
                </div>
              </div>

              {/* Installation Instructions Dropdown */}
              {showInstallGuide && (
                <div className="mt-4 rounded-xl border border-forest-700 bg-forest-900/90 p-5 text-xs text-forest-100 animate-fade-in shadow-inner">
                  <div className="flex items-center justify-between border-b border-forest-800 pb-2 mb-3">
                    <h4 className="font-serif text-sm font-bold text-white">
                      Install in Google Chrome (Developer Mode)
                    </h4>
                    <span className="font-mono text-[10px] text-warmAmber-300">Manifest V3</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 leading-relaxed text-forest-200/90 font-mono text-[11px]">
                    <li>
                      Open Google Chrome and navigate to <code className="bg-forest-950 px-1.5 py-0.5 rounded text-white border border-forest-800">chrome://extensions</code>.
                    </li>
                    <li>
                      Toggle <strong className="text-white">Developer mode</strong> on in the top-right corner.
                    </li>
                    <li>
                      Click the <strong className="text-white">Load unpacked</strong> button in the top-left menu.
                    </li>
                    <li>
                      Select the extension folder from the extracted Terms_Truth project directory:
                      <span className="block mt-1 pl-4 text-warmAmber-200 text-[10px]">
                        <code className="bg-forest-950 px-1.5 py-0.5 rounded border border-forest-800">Terms_Truth/extension</code>
                      </span>
                    </li>
                    <li>
                      Pin <strong className="text-white">TermsTruth</strong> to your toolbar for instant 1-click access on any webpage.
                    </li>
                  </ol>
                  <p className="mt-3 text-[10px] text-forest-300 border-t border-forest-800 pt-2">
                    <strong>Privacy & Security:</strong> Operates strictly under the <code>activeTab</code>, <code>scripting</code>, and <code>storage</code> permissions. Scans are cached locally on your device and never uploaded to public history.
                  </p>
                </div>
              )}
            </section>

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
