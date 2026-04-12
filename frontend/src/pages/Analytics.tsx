import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { getAnalytics, type AnalyticsResponse } from '../api/fraudApi';
import { Activity, ShieldAlert, Zap, BarChart3, Database } from 'lucide-react';

// Mock volume data as it's not and-to-end implemented in DB yet
const VOLUME_DATA = [
  { name: 'Mon', fraud: 400, legit: 2400 },
  { name: 'Tue', fraud: 300, legit: 1398 },
  { name: 'Wed', fraud: 200, legit: 980 },
  { name: 'Thu', fraud: 278, legit: 3908 },
  { name: 'Fri', fraud: 189, legit: 4800 },
  { name: 'Sat', fraud: 239, legit: 3800 },
  { name: 'Sun', fraud: 349, legit: 4300 },
];

export function Analytics() {
  const [stats, setStats] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAnalytics();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-danger/20 border-t-danger rounded-full animate-spin" />
          <p className="text-muted font-mono animate-pulse">Gathering intelligence...</p>
        </div>
      </div>
    );
  }

  const riskData = stats ? Object.entries(stats.risk_distribution).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="max-w-5xl mx-auto py-2 animate-fade-in">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
            <BarChart3 className="w-5 h-5 text-accent" />
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white">System Analytics</h2>
        </div>
        <p className="text-muted text-sm max-w-2xl leading-relaxed">
          Real-time insights from global detection nodes. Analyzing threats across all integrated endpoints.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="glass rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-white" />
          </div>
          <p className="text-muted text-[10px] font-mono uppercase tracking-[0.2em] mb-3">Total Scans</p>
          <p className="text-4xl font-display font-bold text-white mb-1">
             {stats?.total_scans.toLocaleString() || '0'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-safe text-[10px] font-mono font-semibold bg-safe/10 px-1.5 py-0.5 rounded">↑ Live</span>
            <span className="text-muted/40 text-[10px] font-mono">Global aggregate</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-danger">
            <ShieldAlert className="w-16 h-16" />
          </div>
          <p className="text-muted text-[10px] font-mono uppercase tracking-[0.2em] mb-3">Fraud Blocked</p>
          <p className="text-4xl font-display font-bold text-danger mb-1">
            {stats?.fraud_detected.toLocaleString() || '0'}
          </p>
          <div className="flex items-center gap-2 mt-2 text-danger/60 text-[10px] font-mono italic">
            Threats neutralized
          </div>
        </div>

        <div className="glass rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-amber">
            <Zap className="w-16 h-16" />
          </div>
          <p className="text-muted text-[10px] font-mono uppercase tracking-[0.2em] mb-3">Avg Latency</p>
          <p className="text-4xl font-display font-bold text-amber mb-1">
            {stats?.avg_inference_ms || '0'}ms
          </p>
          <div className="flex items-center gap-2 mt-2 text-safe text-[10px] font-mono">
            Optimized pipeline
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-muted/80">Weekly Scan Volume</h3>
            <Database className="w-4 h-4 text-muted/30" />
          </div>
          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VOLUME_DATA}>
                <defs>
                   <linearGradient id="colorLegit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e676" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#00e676" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff3b5c" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ff3b5c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#525c7a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f111a', border: '1px solid #232a3d', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="legit" stroke="#00e676" fillOpacity={1} fill="url(#colorLegit)" />
                <Area type="monotone" dataKey="fraud" stroke="#ff3b5c" fillOpacity={1} fill="url(#colorFraud)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-muted/80">Risk Level Distribution</h3>
            <span className="text-[10px] font-mono text-muted/40 uppercase tracking-widest">Ensemble Voting</span>
          </div>
          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#525c7a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                   cursor={{fill: 'rgba(255,255,255,0.02)'}}
                   contentStyle={{ backgroundColor: '#0f111a', border: '1px solid #232a3d', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                  {riskData.map((entry, index) => {
                    const colors: Record<string, string> = {
                      CRITICAL: '#ff1744',
                      HIGH: '#ff3b5c',
                      MEDIUM: '#ffab00',
                      LOW: '#ffd740',
                      SAFE: '#00e676'
                    };
                    return <Cell key={`cell-${index}`} fill={colors[entry.name as string] || '#6366f1'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-8 py-6 border-t border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
          <span className="text-[10px] font-mono text-muted/50 uppercase tracking-widest">Real-time sync active</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted/50 uppercase tracking-widest">DB Status: {stats?.status || 'disconnected'}</span>
        </div>
      </div>
    </div>
  );
}
