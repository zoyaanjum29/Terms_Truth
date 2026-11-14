import { useRef, useState } from 'react';
import {
  FileSearch,
  Loader2,
  Sparkles,
  AlertCircle,
  RotateCcw,
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

export function AnalyzerInput({ onAnalyze, loading, error, onRetry, canRetry }: AnalyzerInputProps) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAnalyze = () => {
    if (text.trim().length < 20) return;
    onAnalyze(text, title.trim() || 'Untitled Document');
  };

  const loadSample = () => {
    setText(sampleText);
    setTitle('Sample Terms of Service');
    textareaRef.current?.focus();
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-teal-600" />
            <h2 className="text-base font-semibold text-slate-800">
              Paste Terms of Service Text
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Paste any terms of service, privacy policy, or legal agreement below. Our AI will read it and explain what you&apos;re agreeing to.
          </p>
        </div>

        <div className="p-5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document name (optional)"
            className="mb-3 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full terms of service text here..."
            rows={10}
            className="scrollbar-thin w-full resize-y rounded-lg border border-slate-200 px-3.5 py-3 text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {wordCount > 0 ? `${wordCount} words` : ' '}
            </span>
            {text.trim().length < 20 && text.length > 0 && (
              <span className="text-xs text-amber-500">
                Enter at least 20 words to analyze
              </span>
            )}
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="flex-1 text-sm text-red-600">{error}</p>
                {canRetry && (
                  <button
                    onClick={onRetry}
                    disabled={loading}
                    className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loading || text.trim().length < 20}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze Terms
                </>
              )}
            </button>
            <button
              onClick={loadSample}
              disabled={loading}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-teal-600 disabled:opacity-50"
            >
              Try a sample
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
