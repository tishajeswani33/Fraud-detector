import { useState, useRef, useEffect, useCallback } from 'react'
import { usePredict } from './hooks/usePredict'
import { ResultCard } from './components/ResultCard'
import { SampleMessages } from './components/SampleMessages'
import { HistoryPanel } from './components/HistoryPanel'
import { type PredictResponse } from './api/fraudApi'

const MAX_CHARS = 5000

export default function App() {
  const [text, setText] = useState('')
  const [history, setHistory] = useState<PredictResponse[]>([])
  const { state, predict, reset } = usePredict()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || state.status === 'loading') return
    predict(trimmed)
  }, [text, state.status, predict])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  const handleSelect = (item: PredictResponse) => {
    setText(item.text)
    reset()
  }

  const handleSample = (sample: string) => {
    setText(sample)
    reset()
    textareaRef.current?.focus()
  }

  // Add to history on success
  useEffect(() => {
    if (state.status === 'success') {
      setHistory(prev => {
        const without = prev.filter(h => h.text !== state.data.text)
        return [state.data, ...without].slice(0, 10)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status])

  const charCount = text.length
  const isLoading = state.status === 'loading'

  return (
    <div className="min-h-screen bg-void text-text">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-danger/5 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-safe/5 blur-[120px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(232,236,244,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(232,236,244,1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-danger/15 border border-danger/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-danger">
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-danger rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-text">
                FraudShield
              </h1>
              <p className="text-muted text-xs font-mono">AI-Powered Detection Engine</p>
            </div>
          </div>
          <p className="text-muted text-sm leading-relaxed">
            Paste any SMS or text message below. Our XGBoost model — trained on
            real-world spam datasets with{' '}
            <span className="text-safe font-mono">96.65% accuracy</span> — will
            assess fraud probability in milliseconds.
          </p>
        </header>

        {/* Input panel */}
        <div className="rounded-2xl bg-panel border border-border p-5 shadow-xl">
          <label className="block text-muted text-xs font-mono uppercase tracking-widest mb-3">
            Message to analyze
          </label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKeyDown}
              placeholder="Paste your message here… e.g. 'Congratulations! You won a cash prize…'"
              rows={5}
              className="w-full bg-void border border-border rounded-xl p-4 text-text text-sm font-body
                         placeholder-muted/40 resize-none transition-colors duration-200
                         focus:border-muted/60 hover:border-border/80"
            />
            {/* Char counter */}
            <div className="absolute bottom-3 right-3 text-muted/50 text-xs font-mono">
              {charCount}/{MAX_CHARS}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || isLoading}
              className={`flex-1 relative py-3 rounded-xl font-display font-bold text-sm tracking-wide
                         transition-all duration-200 overflow-hidden
                         ${!text.trim() || isLoading
                           ? 'bg-surface border border-border text-muted cursor-not-allowed'
                           : 'bg-danger hover:bg-danger/90 text-white shadow-lg shadow-danger/20 hover:shadow-danger/30 active:scale-[0.98]'
                         }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing…
                </span>
              ) : (
                'Analyze Message'
              )}
              {/* Scan line effect when loading */}
              {isLoading && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full animate-scan" />
                </div>
              )}
            </button>

            {text && (
              <button
                onClick={() => { setText(''); reset() }}
                className="px-4 py-3 rounded-xl border border-border text-muted text-sm
                           hover:border-muted/60 hover:text-text transition-all duration-150"
              >
                Clear
              </button>
            )}
          </div>

          <SampleMessages onSelect={handleSample} />
        </div>

        {/* Keyboard hint */}
        <p className="text-muted/50 text-xs font-mono text-center mt-3">
          ⌘ + Enter to analyze
        </p>

        {/* Result */}
        {state.status === 'success' && (
          <div className="mt-6">
            <ResultCard data={state.data} />
          </div>
        )}

        {/* Error */}
        {state.status === 'error' && (
          <div className="mt-6 animate-slide-up rounded-2xl bg-surface border border-danger/40 p-5">
            <p className="text-danger text-sm font-mono">
              ⚠ Error: {state.message}
            </p>
            <p className="text-muted text-xs mt-1">
              Ensure the backend API is running and accessible.
            </p>
          </div>
        )}

        {/* History */}
        <HistoryPanel
          history={history}
          onSelect={handleSelect}
          onClear={() => setHistory([])}
        />

        {/* Footer */}
        <footer className="mt-12 text-center text-muted/40 text-xs font-mono">
          <p>FraudShield v1.0 · XGBoost + TF-IDF · 96.65% accuracy</p>
          <p className="mt-1">For informational purposes only.</p>
        </footer>
      </div>
    </div>
  )
}
