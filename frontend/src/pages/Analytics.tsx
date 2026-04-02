import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const monthlyData = [
  { name: 'Jan', fraud: 4000, legit: 24000 },
  { name: 'Feb', fraud: 3000, legit: 13980 },
  { name: 'Mar', fraud: 2000, legit: 9800 },
  { name: 'Apr', fraud: 2780, legit: 39080 },
  { name: 'May', fraud: 1890, legit: 48000 },
  { name: 'Jun', fraud: 2390, legit: 38000 },
  { name: 'Jul', fraud: 3490, legit: 43000 },
];

export function Analytics() {
  return (
    <div className="max-w-5xl mx-auto py-2">
      <header className="mb-8 animate-fade-in">
        <h2 className="font-display text-3xl font-bold tracking-tight text-text mb-2">Global Analytics</h2>
        <p className="text-muted text-sm leading-relaxed">
          Comprehensive statistics from all automated scanning end-points across the network.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-panel rounded-2xl border border-border p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2"/></svg>
          </div>
          <p className="text-muted text-xs font-mono uppercase tracking-widest mb-2">Total Messages</p>
          <p className="text-4xl font-display font-bold text-white">4.2M</p>
          <p className="text-safe text-xs font-mono mt-2 flex items-center gap-1">↑ 12.5% from last month</p>
        </div>
        <div className="bg-panel rounded-2xl border border-border p-6 shadow-xl relative overflow-hidden">
          <p className="text-muted text-xs font-mono uppercase tracking-widest mb-2">Fraud Prevented</p>
          <p className="text-4xl font-display font-bold text-danger">342k</p>
          <p className="text-danger text-xs font-mono mt-2">↑ 5.2% from last month</p>
        </div>
        <div className="bg-panel rounded-2xl border border-border p-6 shadow-xl relative overflow-hidden">
          <p className="text-muted text-xs font-mono uppercase tracking-widest mb-2">Avg Inference Time</p>
          <p className="text-4xl font-display font-bold text-amber">12.4ms</p>
          <p className="text-safe text-xs font-mono mt-2">↓ 2.1ms from last month</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-void/50 border border-border/60 rounded-2xl p-6 h-96 flex flex-col">
          <h3 className="text-muted text-xs font-mono uppercase tracking-wider mb-6 text-center">Scan Volume Over Time (Millions)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLegit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#6b7280" tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid #2e364f', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="legit" stroke="#22c55e" fillOpacity={1} fill="url(#colorLegit)" />
                <Area type="monotone" dataKey="fraud" stroke="#ef4444" fillOpacity={1} fill="url(#colorFraud)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
