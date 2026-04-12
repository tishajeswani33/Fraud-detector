import { type PredictResponse } from '../api/fraudApi'
import { RadialGauge } from './RadialGauge'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertTriangle, ShieldCheck, Zap, BarChart2, Fingerprint, Link as LinkIcon, ExternalLink } from 'lucide-react'

interface ResultCardProps {
  data: PredictResponse
}

export function ResultCard({ data }: ResultCardProps) {
  const isFraud = data.label === 'fraud'
  const pct = Math.round(data.fraud_probability * 100)
  
  // Use backend signals if available, fallback to empty
  const signals = data.signals || []

  const riskLevel = data.risk_level || (
    pct > 90 ? 'CRITICAL' :
    pct > 70 ? 'HIGH' :
    pct > 50 ? 'MEDIUM' :
    pct > 25 ? 'LOW' : 'SAFE'
  )

  const verdictColor = 
    riskLevel === 'CRITICAL' ? 'text-danger' :
    riskLevel === 'HIGH'     ? 'text-danger' :
    riskLevel === 'MEDIUM'   ? 'text-amber'  :
    riskLevel === 'LOW'      ? 'text-amber/80' : 'text-safe'

  const borderColor = 
    riskLevel === 'CRITICAL' ? 'border-danger/50 shadow-glow-danger' :
    riskLevel === 'HIGH'     ? 'border-danger/30' :
    riskLevel === 'SAFE'     ? 'border-safe/30 shadow-glow-safe' : 'border-border'

  const bgGradient = 
    riskLevel === 'CRITICAL' ? 'bg-danger/5' :
    riskLevel === 'SAFE'     ? 'bg-safe/5' : 'bg-panel/40'

  return (
    <div className={`animate-slide-up rounded-2xl border p-5 sm:p-7 glass shadow-2xl transition-all duration-500 ${borderColor} ${bgGradient}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Fingerprint className="w-3 h-3 text-muted/60" />
            <p className="text-muted text-[10px] font-mono uppercase tracking-[0.2em]">Ensemble Analysis v3.0</p>
          </div>
          <div className="flex items-center gap-3">
            <h2 className={`font-display text-3xl font-extrabold tracking-tight ${verdictColor}`}>
              {riskLevel}
            </h2>
            <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              isFraud ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-safe/10 border-safe/20 text-safe'
            }`}>
              {data.label.toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-void/50 border border-border">
            <Zap className="w-3 h-3 text-amber" />
            <span className="text-[10px] font-mono text-text/80">{data.inference_ms}ms latency</span>
          </div>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-8">
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-void/30 rounded-2xl border border-border/40">
           <RadialGauge
            probability={data.fraud_probability}
            label="Fraud Probability"
            isFraud={true}
          />
          <div className="mt-4 flex gap-4 text-[10px] font-mono text-muted/60 uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-danger" /> Fraud
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-safe" /> Legitimate
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 h-56 w-full">
          <div className="flex items-center justify-between mb-4 px-2">
            <p className="text-[10px] font-mono text-muted/60 uppercase tracking-widest">Confidence Comparison</p>
            <BarChart2 className="w-4 h-4 text-muted/20" />
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: 'FRAUD', value: Math.round(data.fraud_probability * 100) },
                { name: 'LEGIT', value: Math.round(data.legitimate_probability * 100) }
              ]}
              layout="vertical"
              margin={{ left: -10, right: 30 }}
            >
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis dataKey="name" type="category" stroke="#8892a4" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.02)'}}
                contentStyle={{ backgroundColor: '#0f111a', border: '1px solid #232a3d', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                <Cell fill="#ff3b5c" />
                <Cell fill="#00e676" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Confidence', value: `${Math.round(data.confidence * 100)}%` },
          { label: 'Detections', value: signals.length.toString() },
          { label: 'Model', value: data.model_version },
          { label: 'Voters', value: '2 (XGB+LR)' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-void/40 border border-border/60 rounded-xl p-3 text-center">
            <p className="text-muted text-[9px] font-mono uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-display font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Signals / Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isFraud ? (
          <div className="animate-risk bg-danger/10 border border-danger/20 rounded-xl p-4 h-full">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-danger" />
              <p className="text-danger text-[10px] font-mono uppercase tracking-[0.15em] font-bold">Threat Indicators Detected</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {signals.length > 0 ? signals.map((s, i) => (
                <span key={i} className="text-[10px] font-mono px-2 py-1 bg-danger/10 border border-danger/30 text-danger rounded-md">
                  {s}
                </span>
              )) : (
                <span className="text-[10px] font-mono text-danger/60 italic">Pattern identified by feature weights</span>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-risk bg-safe/10 border border-safe/20 rounded-xl p-4 h-full flex items-center">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-safe" />
              <p className="text-safe text-[10px] font-mono uppercase tracking-[0.15em] font-bold">
                Secure Check Passed — No significant risks found
              </p>
            </div>
          </div>
        )}

        {/* New: Link Intelligence Section */}
        {data.extracted_urls && data.extracted_urls.length > 0 ? (
          <div className="bg-void/40 border border-border/60 rounded-xl p-4 h-full">
             <div className="flex items-center gap-2 mb-3">
              <LinkIcon className="w-4 h-4 text-accent" />
              <p className="text-accent text-[10px] font-mono uppercase tracking-[0.15em] font-bold">Link Intelligence</p>
            </div>
            <div className="flex flex-col gap-2">
              {data.extracted_urls.map((url, i) => (
                <div key={i} className="flex items-center justify-between gap-3 bg-void/50 border border-border/30 px-3 py-2 rounded-lg group">
                  <span className="text-[11px] font-mono text-text/70 truncate max-w-[200px]" title={url}>
                    {url}
                  </span>
                  <a 
                    href={url.startsWith('http') ? url : `https://${url}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-1 px-2 rounded-md bg-accent/10 border border-accent/20 text-accent text-[9px] font-bold 
                              hover:bg-accent hover:text-void transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1"
                  >
                    Open <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-void/40 border border-border/60 rounded-xl p-4 h-full flex items-center justify-center italic text-muted/40 text-[10px]">
            No embedded links detected
          </div>
        )}
      </div>
    </div>
  )
}
