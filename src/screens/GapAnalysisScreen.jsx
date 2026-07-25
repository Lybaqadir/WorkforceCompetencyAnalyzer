import { useEffect, useRef, useState } from 'react';
import { runWorkflowStage } from '../lib/api';
import WorkflowProgressBar from '../components/WorkflowProgressBar';
import { AlertIcon, MoonIcon, PersonIcon, SunIcon } from '../components/icons';

const SEVERITY_ORDER = { critical: 0, important: 1, low: 2 };

const SEVERITY_STYLES = {
  critical: { rank: 'bg-red text-white', badge: 'bg-red/10 text-red', edge: 'border-l-red' },
  important: { rank: 'bg-gold text-navy', badge: 'bg-gold/15 text-[#92620a]', edge: 'border-l-gold' },
  low: { rank: 'bg-lightgrey text-charcoal/60', badge: 'bg-lightgrey text-charcoal/50', edge: 'border-l-lightgrey' },
};

const RISK_STYLES = {
  high: 'bg-red/10 text-red',
  medium: 'bg-gold/10 text-[#92620a]',
  low: 'bg-green/10 text-green',
};

export default function GapAnalysisScreen({ workflowData, onComplete, onBack, reviewMode, onJumpToStage, theme, onToggleTheme, onDashboard }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(!workflowData.gapAnalysis);
  const [error, setError] = useState(null);

  async function runStage() {
    setLoading(true);
    setError(null);
    try {
      const { result: r } = await runWorkflowStage('gap-analysis', workflowData);
      if (!r) throw new Error('No result');
      setResult(r);
    } catch (err) {
      setError(err?.message || 'Could not generate gap analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const startedRef = useRef(false);
  useEffect(() => {
    if (workflowData.gapAnalysis) { setResult(workflowData.gapAnalysis); return; }
    if (startedRef.current) return; // StrictMode double-mount guard
    startedRef.current = true;
    runStage();
  }, []);

  // One ranked list: every gap (role or skill), most severe first
  const rankedGaps = (() => {
    if (!result) return [];
    const roles = (result.missingRoles || []).map((r) => ({
      kind: 'role',
      title: r.roleName,
      severity: r.severity || 'low',
      detail: r.impact,
      action: r.suggestedAction,
    }));
    const skills = (result.missingSkills || []).map((s) => ({
      kind: 'skill',
      title: s.skill,
      severity: s.severity || 'low',
      detail: s.neededBy?.length > 0 ? `Needed by: ${s.neededBy.join(', ')}` : null,
      action: s.suggestedAction,
    }));
    return [...roles, ...skills].sort(
      (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3)
    );
  })();

  const criticalCount = rankedGaps.filter((g) => g.severity === 'critical').length;

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <WorkflowProgressBar currentStage="gap-analysis" reviewMode={reviewMode} onNavigate={onJumpToStage} onDashboard={onDashboard} />

      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-lightgrey/60">
        <div>
          <h1 className="text-xl font-extrabold text-charcoal">Gap Analysis</h1>
          <p className="text-charcoal/50 text-sm mt-0.5">Every gap between today's team and the target org, ranked by priority</p>
        </div>
        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button onClick={onToggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal/40 hover:text-charcoal/70 border border-lightgrey">
              {theme === 'dark' ? <SunIcon width="15" height="15" /> : <MoonIcon width="15" height="15" />}
            </button>
          )}
          <button onClick={onBack} className="px-4 py-2 rounded-xl border border-lightgrey text-sm font-semibold text-charcoal/60 hover:border-charcoal/30">← Back</button>
          {result && (
            <button onClick={() => onComplete(result)} className="bg-maroon text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-maroon-dark transition-colors">
              Continue to Recommendations →
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 px-8 py-8 max-w-6xl mx-auto w-full">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-2xl bg-maroon/10 flex items-center justify-center mb-4 animate-pulse">
              <span className="text-maroon text-xl">⟳</span>
            </div>
            <p className="text-charcoal font-semibold">Identifying gaps…</p>
            <p className="text-charcoal/50 text-sm mt-1">Analysing missing roles, skills, and structural weaknesses</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-red/5 border border-red/20 rounded-2xl px-8 py-6 max-w-md text-center">
              <p className="text-red font-semibold mb-2">Something went wrong</p>
              <p className="text-charcoal/60 text-sm mb-4">{error}</p>
              <button onClick={runStage} className="bg-maroon text-white rounded-xl px-5 py-2.5 text-sm font-bold">Try Again</button>
            </div>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
            {/* Left rail: severity snapshot */}
            <div className="space-y-4 lg:sticky lg:top-6">
              <div className="bg-white rounded-2xl border border-black/[0.03] shadow-sm p-5">
                <p className="text-xs font-bold text-charcoal/40 uppercase tracking-wider mb-4">Gap snapshot</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-charcoal/70"><span className="w-2.5 h-2.5 rounded-full bg-red" />Critical</span>
                    <span className="text-lg font-extrabold text-red">{criticalCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-charcoal/70"><span className="w-2.5 h-2.5 rounded-full bg-gold" />Important</span>
                    <span className="text-lg font-extrabold text-[#92620a]">{rankedGaps.filter((g) => g.severity === 'important').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-charcoal/70"><span className="w-2.5 h-2.5 rounded-full bg-lightgrey" />Low</span>
                    <span className="text-lg font-extrabold text-charcoal/50">{rankedGaps.filter((g) => g.severity === 'low').length}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-lightgrey/60 flex items-center justify-between text-sm">
                  <span className="text-charcoal/50">Roles missing</span>
                  <span className="font-bold text-charcoal">{result.missingRoles?.length ?? 0}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-charcoal/50">Skills missing</span>
                  <span className="font-bold text-charcoal">{result.missingSkills?.length ?? 0}</span>
                </div>
              </div>

              {result.summary && (
                <div className="bg-navy/5 border border-navy/10 rounded-2xl px-5 py-4">
                  <p className="text-xs font-bold text-charcoal/40 uppercase tracking-wider mb-1.5">AI Summary</p>
                  <p className="text-sm text-charcoal/70 leading-relaxed">{result.summary}</p>
                </div>
              )}
            </div>

            {/* Right: the ranked priority ladder */}
            <div className="space-y-8 min-w-0">
              {rankedGaps.length > 0 && (
                <section>
                  <h2 className="text-base font-bold text-charcoal mb-1">Priority Ladder</h2>
                  <p className="text-sm text-charcoal/50 mb-4">Work top-down — #1 is the gap that hurts the mission most.</p>
                  <div className="space-y-2.5">
                    {rankedGaps.map((g, i) => {
                      const s = SEVERITY_STYLES[g.severity] || SEVERITY_STYLES.low;
                      return (
                        <div key={i} className={`bg-white rounded-xl border border-black/[0.03] border-l-4 ${s.edge} shadow-sm p-4 flex items-start gap-4`}>
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold shrink-0 ${s.rank}`}>{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="text-sm font-bold text-charcoal">{g.title}</p>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-offwhite text-charcoal/50 text-[10px] font-bold uppercase">
                                {g.kind === 'role' ? <PersonIcon width="10" height="10" /> : <AlertIcon width="10" height="10" />}
                                {g.kind}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.badge}`}>{g.severity}</span>
                            </div>
                            {g.detail && <p className="text-sm text-charcoal/65 leading-relaxed">{g.detail}</p>}
                            {g.action && <p className="text-sm font-semibold text-maroon mt-1">→ {g.action}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {result.organizationalWeaknesses?.length > 0 && (
                <section>
                  <h2 className="text-base font-bold text-charcoal mb-1">Structural Weaknesses</h2>
                  <p className="text-sm text-charcoal/50 mb-4">Risks in how the organisation is shaped, beyond individual gaps.</p>
                  <div className="space-y-3">
                    {result.organizationalWeaknesses.map((w, i) => (
                      <div key={i} className="bg-white rounded-xl border border-black/[0.03] shadow-sm p-4 flex items-start gap-4">
                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${w.risk === 'high' ? 'bg-red' : w.risk === 'medium' ? 'bg-gold' : 'bg-green'}`} />
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-bold text-charcoal">{w.weakness}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${RISK_STYLES[w.risk] || RISK_STYLES.low}`}>{w.risk} risk</span>
                          </div>
                          <p className="text-sm text-charcoal/65 leading-relaxed">{w.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
