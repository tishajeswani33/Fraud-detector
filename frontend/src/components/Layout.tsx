import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ShieldAlert, BarChart3, Layers, Settings, Menu, X } from 'lucide-react';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Scanner', icon: ShieldAlert },
    { to: '/batch', label: 'Batch Analysis', icon: Layers },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-void text-text flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-white hover:bg-border transition-colors"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 border-r border-border bg-surface flex flex-col fixed inset-y-0 z-40
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-danger/15 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-danger" />
          </div>
          <h1 className="font-display font-bold text-xl tracking-tight text-white">FraudShield</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-danger/10 text-danger font-semibold border border-danger/20'
                    : 'text-muted hover:bg-border/50 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-6 border-t border-border">
          <p className="text-xs text-muted/60 font-mono">v2.0 Advanced</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 md:p-8 relative min-h-screen overflow-y-auto pt-16 md:pt-8">
        <div className="fixed inset-0 pointer-events-none overflow-hidden md:ml-64">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-danger/5 blur-[120px]" />
          <div className="absolute top-40 right-[-200px] w-[600px] h-[600px] rounded-full bg-safe/5 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(232,236,244,1) 1px, transparent 1px), linear-gradient(90deg, rgba(232,236,244,1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
