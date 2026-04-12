import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  ShieldAlert, BarChart3, Layers, Settings,
  Menu, X, Zap, Activity, ChevronRight
} from 'lucide-react';
import { checkHealth } from '../api/fraudApi';

const navItems = [
  { to: '/',          label: 'Scanner',       icon: ShieldAlert, desc: 'Analyze messages & URLs' },
  { to: '/batch',     label: 'Batch Analysis',icon: Layers,      desc: 'Scan multiple at once'   },
  { to: '/analytics', label: 'Analytics',     icon: BarChart3,   desc: 'Insights & stats'        },
  { to: '/settings',  label: 'Settings',      icon: Settings,    desc: 'Configure preferences'   },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus]     = useState<'online' | 'offline' | 'loading'>('loading');
  const [modelVersion, setModelVersion] = useState<string | null>(null);
  const location = useLocation();

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location]);

  // Poll health
  useEffect(() => {
    const check = async () => {
      try {
        const h = await checkHealth();
        setApiStatus(h.model_loaded ? 'online' : 'offline');
        setModelVersion(h.model_version);
      } catch {
        setApiStatus('offline');
      }
    };
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-void text-text flex noise-bg">
      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          w-64 flex flex-col fixed inset-y-0 z-40
          bg-panel border-r border-border
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-border">
          <div className="relative w-9 h-9 rounded-xl bg-danger/15 flex items-center justify-center border border-danger/25 shadow-glow-danger">
            <ShieldAlert className="w-5 h-5 text-danger" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-danger/80 border border-void animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight text-white leading-none">FraudShield</h1>
            <p className="text-muted/60 text-[10px] font-mono uppercase tracking-widest mt-0.5">AI Detection v3</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, desc }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-3 rounded-xl font-body text-sm transition-all duration-200 relative ${
                  isActive
                    ? 'bg-danger/10 text-white border border-danger/20 nav-item-active'
                    : 'text-muted hover:bg-elevated hover:text-text border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? 'bg-danger/20 text-danger' : 'bg-surface group-hover:bg-elevated text-muted group-hover:text-text'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm leading-none mb-0.5 ${isActive ? 'text-white' : ''}`}>{label}</p>
                    <p className="text-[10px] text-muted/70 truncate">{desc}</p>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-danger/70 shrink-0" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* API status footer */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="bg-elevated rounded-xl p-3 border border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-muted/60 uppercase tracking-widest">API Status</span>
              <span className={`status-dot ${apiStatus}`} />
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-muted" />
              <span className={`text-xs font-mono font-medium ${
                apiStatus === 'online' ? 'text-safe' : apiStatus === 'offline' ? 'text-danger' : 'text-amber'
              }`}>
                {apiStatus === 'online' ? 'Connected' : apiStatus === 'offline' ? 'Offline' : 'Checking…'}
              </span>
            </div>
            {modelVersion && (
              <p className="text-[10px] text-muted/50 font-mono mt-1">model v{modelVersion}</p>
            )}
          </div>
          <div className="flex items-center gap-2 px-1">
            <Zap className="w-3 h-3 text-amber shrink-0" />
            <p className="text-[10px] text-muted/50 font-mono">XGB + LR Ensemble</p>
          </div>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 bg-panel/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-9 h-9 rounded-xl bg-elevated border border-border flex items-center justify-center text-white hover:bg-border-bright transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-danger" />
          <span className="font-display font-bold text-white">FraudShield</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`status-dot ${apiStatus} w-2 h-2`} />
          <span className={`text-xs font-mono ${apiStatus === 'online' ? 'text-safe' : 'text-muted'}`}>
            {apiStatus === 'online' ? 'Live' : 'Offline'}
          </span>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 md:ml-64 relative min-h-screen overflow-y-auto">
        {/* Ambient background blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden md:ml-64" aria-hidden>
          <div className="absolute -top-60 -left-40 w-[700px] h-[700px] rounded-full bg-danger/[0.04] blur-[120px]" />
          <div className="absolute top-1/2 right-[-100px] w-[500px] h-[500px] rounded-full bg-safe/[0.03] blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-[100px]" />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative z-10 px-4 sm:px-6 md:px-8 pt-20 md:pt-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-panel/95 backdrop-blur-md border-t border-border px-2 py-2 flex items-center justify-around">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive ? 'text-danger' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-6 h-6 ${isActive ? 'text-danger' : 'text-muted'}`}>
                  <Icon className="w-full h-full" />
                </div>
                <span className={`text-[9px] font-mono uppercase tracking-wider ${isActive ? 'text-danger' : 'text-muted/60'}`}>
                  {label.split(' ')[0]}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
