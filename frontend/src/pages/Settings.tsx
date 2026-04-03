export function Settings() {
  return (
    <div className="max-w-3xl mx-auto py-2">
      <header className="mb-8 animate-fade-in">
        <h2 className="font-display text-3xl font-bold tracking-tight text-white mb-2">Account Settings</h2>
        <p className="text-muted text-sm leading-relaxed">
          Manage your API keys, preferences, and enterprise billing.
        </p>
      </header>

      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-panel p-6 shadow-xl">
          <h3 className="text-white font-mono uppercase tracking-widest text-xs mb-4">API Keys</h3>
          <p className="text-muted text-sm mb-4">Use these keys to authenticate API requests from your backend.</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-void border border-border rounded-xl p-3">
            <code className="text-safe text-sm flex-1 break-all">fk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
            <button className="px-4 py-2 bg-surface hover:bg-border border border-border rounded-lg text-xs font-mono text-white transition-colors">
              Copy
            </button>
            <button className="px-4 py-2 bg-surface hover:bg-border border border-border rounded-lg text-xs font-mono text-white transition-colors">
              Revoke
            </button>
          </div>
          <button className="mt-4 px-4 py-2 bg-white text-black font-bold rounded-lg text-sm hover:scale-[1.02] transition-transform">
            Generate New Key
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-panel p-6 shadow-xl">
          <h3 className="text-white font-mono uppercase tracking-widest text-xs mb-4">Detection Threshold</h3>
          <p className="text-muted text-sm mb-4">Adjust the sensitivity of the fraud detection model.</p>
          <div className="flex items-center gap-6">
            <input type="range" min="0" max="100" defaultValue="80" className="w-full h-2 bg-void rounded-lg appearance-none cursor-pointer" />
            <span className="text-white font-display font-bold">80%</span>
          </div>
          <p className="text-muted/50 text-xs mt-2 font-mono">Current setting: HIGH RISK if probability &gt; 80%</p>
        </div>
      </div>
    </div>
  );
}
