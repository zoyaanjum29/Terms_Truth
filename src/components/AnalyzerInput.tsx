import { useRef, useState } from 'react';
import {
  FileText,
  Loader2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Eraser,
  FileCheck2,
} from 'lucide-react';

interface AnalyzerInputProps {
  onAnalyze: (text: string, title: string) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  canRetry: boolean;
}

const sampleText = `Terms of Service

By using this service, you agree to the following terms:

1. Arbitration: Any dispute arising from these terms shall be resolved through binding arbitration. You waive your right to a jury trial and class action lawsuits.

2. Data Collection: We may collect your personal information including device data, location, browsing history, and communications. We may share your personal data with third-party advertisers for commercial purposes.

3. Content License: By posting content, you grant us a perpetual, irrevocable, royalty-free, worldwide license to use, reproduce, modify, distribute, and create derivative works from your content. We may also use your uploaded content to train our AI models.

4. Account Termination: We reserve the right to terminate your account at any time without notice at our sole discretion.

5. Changes to Terms: We may modify these terms at any time without notice. Your continued use of the service constitutes acceptance of the new terms.

6. Liability: The service is provided "as is" without warranties. Our liability shall not exceed the amount you paid us in the last 12 months.

7. Auto-Renewal: Your subscription will automatically renew each billing cycle unless you cancel. We may change prices at any time without notice.`;

export function AnalyzerInput({
  onAnalyze,
  loading,
  error,
  onRetry,
  canRetry,
}: AnalyzerInputProps) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAnalyze = () => {
    if (text.trim().length < 20) return;
    onAnalyze(text, title.trim() || 'Untitled Agreement');
  };

  const loadSample = () => {
    setText(sampleText);
    setTitle('Standard Commercial Terms of Service');
    textareaRef.current?.focus();
  };

  const handleClear = () => {
    setText('');
    setTitle('');
    textareaRef.current?.focus();
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const isInputValid = text.trim().length >= 20;

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl border border-charcoal-200/80 bg-white shadow-[0_4px_24px_-4px_rgba(28,34,43,0.06)] transition-all">
        {/* Intake Dossier Header */}
        <div className="border-b border-charcoal-100 bg-gradient-to-r from-ivory-50 via-white to-ivory-50 px-6 py-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-forest-800 text-ivory-50 shadow-sm">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold tracking-tight text-charcoal-900">
                  Agreement Examination Desk
                </h2>
                <p className="text-xs text-charcoal-500">
                  Paste terms of service, privacy policy, or agreement text to examine.
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 sm:mt-0">
              <button
                type="button"
                onClick={loadSample}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-md border border-charcoal-200 bg-white px-2.5 py-1 text-xs font-medium text-charcoal-700 transition-colors hover:border-forest-700 hover:text-forest-800 disabled:opacity-50"
              >
                <FileCheck2 className="h-3.5 w-3.5 text-forest-700" />
                Load Sample Agreement
              </button>
              {text.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-charcoal-400 transition-colors hover:text-red-600 disabled:opacity-50"
                  title="Clear document input"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6">
          <div className="mb-4">
            <label
              htmlFor="agreement-title"
              className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-charcoal-500"
            >
              Document or Service Name <span className="font-normal lowercase text-charcoal-400">(optional)</span>
            </label>
            <input
              id="agreement-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Cloud Storage Provider Terms, SaaS Platform Agreement"
              className="w-full rounded-lg border border-charcoal-200 bg-ivory-50/40 px-3.5 py-2.5 text-sm text-charcoal-800 placeholder:text-charcoal-400 transition-colors focus:border-forest-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="agreement-text"
                className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-charcoal-500"
              >
                Contract Text
              </label>
              <div className="flex items-center gap-3 font-mono text-xs text-charcoal-400">
                {wordCount > 0 && <span>{wordCount.toLocaleString()} words</span>}
                <span>{text.length.toLocaleString()} characters</span>
              </div>
            </div>
            <textarea
              id="agreement-text"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the complete text of the legal agreement, terms of service, or privacy policy here..."
              rows={11}
              className="scrollbar-thin w-full resize-y rounded-lg border border-charcoal-200 bg-ivory-50/30 px-4 py-3.5 text-sm leading-relaxed text-charcoal-800 placeholder:text-charcoal-400 transition-colors focus:border-forest-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-forest-700 font-sans"
            />
          </div>

          {/* Validation Notice */}
          {text.length > 0 && !isInputValid && (
            <p className="mt-2 text-xs text-warmAmber-700">
              Please enter at least 20 characters to begin analysis.
            </p>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50/80 p-3.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                <div className="flex-1 text-xs leading-relaxed text-red-800">
                  <p className="font-semibold text-red-900">Analysis Request Unsuccessful</p>
                  <p className="mt-0.5">{error}</p>
                </div>
                {canRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-charcoal-100 pt-4">
            <p className="text-xs text-charcoal-500">
              Clauses are identified and cited directly from the agreement text.
            </p>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || !isInputValid}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-800 px-6 py-2.5 text-sm font-semibold text-ivory-50 shadow-sm transition-all hover:bg-forest-900 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 select-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-ivory-200" />
                  <span>Analyzing Agreement...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-warmAmber-300" />
                  <span>Analyze Agreement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
