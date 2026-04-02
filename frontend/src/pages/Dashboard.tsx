import { useState, useRef, useEffect, useCallback } from 'react'
import { usePredict } from '../hooks/usePredict'
import { ResultCard } from '../components/ResultCard'
import { SampleMessages } from '../components/SampleMessages'
import { HistoryPanel } from '../components/HistoryPanel'
import { type PredictResponse } from '../api/fraudApi'

const MAX_CHARS = 5000

export function Dashboard() {
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
  }, [state.status, state])

  const charCount = text.length
  const isLoading = state.status === 'loading'

  return (
    <div className="max-w-3xl mx-auto py-2">
      <header className="mb-8 animate-fade-in">
        <h2 className="font-display text-3xl font-bold tracking-tight text-text mb-2">Message & Link Scanner</h2>
        <p className="text-muted text-sm leading-relaxed">
          Paste any SMS, text message, or URL below. Our XGBoost model will assess fraud probability in milliseconds.
        </p>
      </header>

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
            placeholder="Paste your message or URL here… e.g. 'http://secure-update-paypal.com/login'"
            rows={5}
            className="w-full bg-void border border-border rounded-xl p-4 text-text text-sm font-body
                       placeholder-muted/40 resize-none transition-colors duration-200
                       focus:border-muted/60 hover:border-border/80 outline-none"
          />
          <div className="absolute bottom-4 right-4 text-muted/50 text-xs font-mono">
            {charCount}/{MAX_CHARS}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 mb-4">
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
              'Analyze Now'
            )}
          </button>
          {text && (
            <button
              onClick={() => { setText(''); reset() }}
              className="px-6 py-3 rounded-xl border border-border text-muted text-sm
                         hover:border-muted/60 hover:text-text transition-all duration-150"
            >
              Clear
            </button>
          )}
        </div>
        <SampleMessages onSelect={handleSample} />
      </div>

      <p className="text-muted/50 text-xs font-mono text-center mt-3 mb-8">⌘ + Enter to quick analyze</p>

      {state.status === 'success' && <div className="mt-6"><ResultCard data={state.data} /></div>}
      {state.status === 'error' && (
        <div className="mt-6 animate-slide-up rounded-2xl bg-surface border border-danger/40 p-5">
          <p className="text-danger text-sm font-mono">⚠ Error: {state.message}</p>
        </div>
      )}

      <div className="mt-8">
        <HistoryPanel history={history} onSelect={handleSelect} onClear={() => setHistory([])} />
      </div>
    </div>
  )
}
