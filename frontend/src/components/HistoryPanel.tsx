import { type PredictResponse } from '../api/fraudApi'

interface HistoryPanelProps {
  history: PredictResponse[]
  onSelect: (item: PredictResponse) => void
  onClear: () => void
}

export function HistoryPanel({ history, onSelect, onClear }: HistoryPanelProps) {
  if (history.length === 0) return null

  return (
    <div className="mt-8 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <p className="text-muted text-xs font-mono uppercase tracking-widest">
          Recent scans ({history.length})
        </p>
        <button
          onClick={onClear}
          className="text-muted text-xs font-mono hover:text-danger transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {history.map((item, i) => {
          const isFraud = item.label === 'fraud'
          const pct = Math.round(item.fraud_probability * 100)
          return (
            <button
              key={i}
              onClick={() => onSelect(item)}
              className="w-full text-left rounded-xl bg-panel border border-border hover:border-border/80 p-3 transition-all duration-150 hover:bg-surface group"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-text text-sm truncate flex-1 group-hover:text-text/90">
                  {item.text.slice(0, 60)}{item.text.length > 60 ? '…' : ''}
                </p>
                <span
                  className={`text-xs font-mono font-bold shrink-0 ${
                    isFraud ? 'text-danger' : 'text-safe'
                  }`}
                >
                  {pct}%
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
