interface RadialGaugeProps {
  probability: number   // 0–1
  label: string
  isFraud: boolean
}

export function RadialGauge({ probability, label, isFraud }: RadialGaugeProps) {
  const pct = Math.round(probability * 100)
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (pct / 100) * circumference

  const color = isFraud
    ? pct > 70 ? '#ff3b5c' : '#ffc107'
    : '#00e676'


  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full opacity-30 blur-xl"
          style={{ backgroundColor: color }}
        />

        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Track */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#252a38"
            strokeWidth="8"
          />
          {/* Progress */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>

        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display font-bold text-3xl leading-none"
            style={{ color }}
          >
            {pct}%
          </span>
          <span className="text-muted text-xs font-mono mt-1 uppercase tracking-widest">
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}
