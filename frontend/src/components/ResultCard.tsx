import { type PredictResponse } from '../api/fraudApi'
import { RadialGauge } from './RadialGauge'

interface ResultCardProps {
  data: PredictResponse
}

const FRAUD_SIGNALS = [
  { keyword: /free|prize|win|winner/i, label: 'Prize language' },
  { keyword: /urgent|immediately|now|act fast/i, label: 'Urgency cues' },
  { keyword: /click|call|txt|text back/i, label: 'Action commands' },
  { keyword: /£|\$|cash|money|£\d+|(\d+,\d+)/i, label: 'Monetary bait' },
  { keyword: /congratulations|selected|chosen/i, label: 'False validation' },
]

function detectSignals(text: string) {
  return FRAUD_SIGNALS.filter(({ keyword }) => keyword.test(text))
}

export function ResultCard({ data }: ResultCardProps) {
  const isFraud = data.label === 'fraud'
  const pct = Math.round(data.fraud_probability * 100)
  const signals = detectSignals(data.text)

  const verdict =
    pct > 80 ? 'HIGH RISK' :
    pct > 50 ? 'SUSPICIOUS' :
    pct > 25 ? 'LOW RISK' : 'CLEAN'

  const verdictColor =
    pct > 80 ? 'text-danger' :
    pct > 50 ? 'text-amber' :
    pct > 25 ? 'text-yellow-400' : 'text-safe'

  const borderColor =
    pct > 80 ? 'border-danger/40' :
    pct > 50 ? 'border-amber/40' :
    'border-safe/40'

  return (
    <div
      className={`animate-slide-up rounded-2xl border bg-surface p-6 shadow-2xl ${borderColor}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted text-xs font-mono uppercase tracking-widest">
            Analysis Result
          </p>
          <h2 className={`font-display text-2xl font-bold mt-1 ${verdictColor}`}>
            {verdict}
          </h2>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full border uppercase tracking-wider ${
              isFraud
                ? 'border-danger/50 bg-danger/10 text-danger'
                : 'border-safe/50 bg-safe/10 text-safe'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isFraud ? 'bg-danger animate-pulse' : 'bg-safe'
              }`}
            />
            {data.label}
          </span>
        </div>
      </div>

      {/* Gauges */}
      <div className="flex gap-6 justify-center my-6">
        <RadialGauge
          probability={data.fraud_probability}
          label="Fraud"
          isFraud={true}
        />
        <RadialGauge
          probability={data.legitimate_probability}
          label="Legit"
          isFraud={false}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 my-5">
        {[
          { label: 'Confidence', value: `${Math.round(data.confidence * 100)}%` },
          { label: 'Inference', value: `${data.inference_ms}ms` },
          { label: 'Signals', value: signals.length.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-panel border border-border p-3 text-center">
            <p className="text-muted text-xs font-mono uppercase tracking-wider mb-1">
              {label}
            </p>
            <p className="font-display font-bold text-lg text-text">{value}</p>
          </div>
        ))}
      </div>

      {/* Fraud signals */}
      {isFraud && signals.length > 0 && (
        <div className="mt-4 rounded-xl bg-danger/5 border border-danger/20 p-4">
          <p className="text-danger text-xs font-mono uppercase tracking-wider mb-3">
            ⚠ Detected fraud signals
          </p>
          <div className="flex flex-wrap gap-2">
            {signals.map(({ label }) => (
              <span
                key={label}
                className="text-xs font-mono bg-danger/10 border border-danger/30 text-danger px-2 py-1 rounded-md"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Clean message */}
      {!isFraud && (
        <div className="mt-4 rounded-xl bg-safe/5 border border-safe/20 p-4">
          <p className="text-safe text-xs font-mono uppercase tracking-wider">
            ✓ No fraud signals detected — message appears legitimate
          </p>
        </div>
      )}
    </div>
  )
}
