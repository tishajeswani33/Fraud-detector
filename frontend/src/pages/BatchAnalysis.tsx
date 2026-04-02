import { useState } from 'react'
import { predictBatch, type PredictResponse } from '../api/fraudApi'
import { ResultCard } from '../components/ResultCard'

export function BatchAnalysis() {
  const [text, setText] = useState('')
  const [results, setResults] = useState<PredictResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length === 0) return
    if (lines.length > 50) {
      setError('Max 50 messages allowed per batch.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await predictBatch(lines)
      setResults(data)
    } catch (err: any) {
      setError(err.message || 'Batch analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const fraudCount = results.filter(r => r.label === 'fraud').length

  return (
    <div className="max-w-4xl mx-auto py-2">
      <header className="mb-8 animate-fade-in">
        <h2 className="font-display text-3xl font-bold tracking-tight text-text mb-2">Batch Analysis</h2>
        <p className="text-muted text-sm leading-relaxed">
          Analyze multiple messages at once. Paste one message per line (up to 50 lines).
        </p>
      </header>

      <div className="rounded-2xl bg-panel border border-border p-5 shadow-xl mb-8 flex flex-col gap-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message 1...\nMessage 2...\nMessage 3..."
          rows={8}
          className="w-full bg-void border border-border rounded-xl p-4 text-text text-sm font-body
                     placeholder-muted/40 resize-none outline-none focus:border-muted/60"
        />
        <div className="flex items-center gap-4">
          <button
            onClick={handleAnalyze}
            disabled={!text.trim() || loading}
            className={`flex-1 py-3 justify-center rounded-xl font-display font-bold text-sm transition-all ${
              !text.trim() || loading
                ? 'bg-surface border border-border text-muted cursor-not-allowed'
                : 'bg-safe hover:bg-safe/90 text-white shadow-lg focus:scale-[0.98]'
            }`}
          >
            {loading ? 'Processing Batch...' : 'Run Batch Analysis'}
          </button>
          {results.length > 0 && (
            <button
              onClick={() => { setResults([]); setText('') }}
              className="px-6 py-3 rounded-xl border border-border text-muted hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
        {error && <p className="text-danger text-sm font-mono mt-2">⚠ {error}</p>}
      </div>

      {results.length > 0 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-border bg-surface flex justify-between items-center">
            <span className="text-muted font-mono text-sm">Total Sentences: {results.length}</span>
            <span className="text-danger font-mono text-sm">Detected Fraud: {fraudCount} ({((fraudCount/results.length)*100).toFixed(1)}%)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((r, i) => (
              <ResultCard key={i} data={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
