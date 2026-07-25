import { useEffect, useRef, useState } from 'react';
import { runWorkflowStage } from '../lib/api';
import WorkflowProgressBar from '../components/WorkflowProgressBar';
import { MoonIcon, SunIcon, TrendIcon } from '../components/icons';

const SCENARIO_STYLES = {
  conservative: { border: 'border-green/20', bg: 'bg-green/5', badge: 'bg-green/10 text-green', bar: '#0d9488' },
  moderate: { border: 'border-gold/20', bg: 'bg-gold/5', badge: 'bg-gold/10 text-[#92620a]', bar: '#f59e0b' },
  aggressive: { border: 'border-maroon/20', bg: 'bg-maroon/5', badge: 'bg-maroon/10 text-maroon', bar: '#6d5ce7' },
};

const TIMELINE_ORDER = ['0-3 months', '3-6 months', '6-12 months', '12+ months'];

const READINESS_STYLES = {
  ready: 'bg-green/10 text-green',
  '6-12 months': 'bg-gold/10 text-[#92620a]',
  'needs-development': 'bg-red/10 text-red',
};

const PRIORITY_DOT = { critical: 'bg-red', important: 'bg-gold' };

export default function FuturePlanningScreen({ workflowData, onComplete, onBack, reviewMode, onJumpToStage, theme, onToggleTheme, onDashboard }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(!workflowData.futurePlanning);
  const [error, setError] = useState(null);
  const [activeScenario, setActiveScenario] = useState('moderate');

  async function runStage() {
    setLoading(true);
    setError(null);
    try {
      const { result: r } = await runWorkflowStage('future-planning', workflowData);
      if (!r) throw new Error('No result');
      setResult(r);
    } catch (err) {
      setError(err?.message || 'Could not generate future planning. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const startedRef = useRef(false);
  useEffect(() => {
    if (workflowData.futurePlanning) { setResult(workflowData.futurePlanning); return; }
    if (startedRef.current) return; // StrictMode double-mount guard
    startedRef.current = true;
    runStage();
  }, []);

  const activeScenarioData = result?.growthScenarios?.find((s) => s.name === activeScenario);
  const hiringByPeriod = TIMELINE_ORDER.map((t) => ({
    period: t,
    roles: (result?.hiringPlan || []).filter((h) => h.timeline === t),
  })).filter((p) => p.roles.length > 0);

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <WorkflowProgressBar currentStage="future-planning" reviewMode={reviewMode} onNavigate={onJumpToStage} onDashboard={onDashboard} />

      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-lightgrey/60">
        <div>
          <h1 className="text-xl font-extrabold text-charcoal">Future Workforce Planning</h1>
          <p className="text-charcoal/50 text-sm mt-0.5">Growth scenarios, hiring roadmap, AI adoption, and succession</p>
        </div>
        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button onClick={onToggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal/40 hover:text-charcoal/70 border border-lightgrey">
              {theme === 'dark' ? <SunIcon width="15" height="15" /> : <MoonIcon width="15" height="15" />}
            </button>
          )}
          <button onClick={onBack} className="px-4 py-2 rounded-xl border border-lightgrey text-sm font-semibold text-charcoal/60">← Back</button>
          {result && (
            <button
              onClick={() => onComplete(result)}
              className="inline-flex items-center gap-2 bg-maroon text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-maroon-dark transition-colors"
            >
              Complete Workflow →
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
            <p className="text-charcoal font-semibold">Building your future workforce plan…</p>
            <p className="text-charcoal/50 text-sm mt-1">Generating growth scenarios, hiring plan, and succession planning</p>
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
          <div className="space-y-8">
            {result.summary && (
              <div className="bg-white rounded-2xl border border-black/[0.03] shadow-sm px-6 py-4 flex items-start gap-4">
                <span className="w-10 h-10 rounded-xl bg-maroon/10 text-maroon flex items-center justify-center shrink-0">
                  <TrendIcon width="18" height="18" />
                </span>
                <p className="text-charcoal/75 text-sm leading-relaxed">{result.summary}</p>
              </div>
            )}

            {/* Growth Scenarios — tabbed comparison */}
            {result.growthScenarios?.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-charcoal mb-1">Growth Scenarios</h2>
                <p className="text-sm text-charcoal/50 mb-4">Three ways the team could evolve — pick a lens to compare.</p>
                <div className="flex gap-2 mb-4">
                  {result.growthScenarios.map((s) => {
                    const style = SCENARIO_STYLES[s.name] || SCENARIO_STYLES.moderate;
                    return (
                      <button
                        key={s.name}
                        onClick={() => setActiveScenario(s.name)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all border ${
                          activeScenario === s.name
                            ? `${style.badge} ${style.border} border-2`
                            : 'border-lightgrey text-charcoal/50 bg-white hover:border-charcoal/30'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
                {activeScenarioData && (
                  <div className={`rounded-2xl border p-6 ${SCENARIO_STYLES[activeScenarioData.name]?.bg || ''} ${SCENARIO_STYLES[activeScenarioData.name]?.border || 'border-lightgrey'}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                      <p className="text-sm text-charcoal/80 leading-relaxed flex-1 min-w-[240px]">{activeScenarioData.description}</p>
                      <div className="bg-white rounded-xl border border-black/[0.05] px-4 py-3 text-center shrink-0">
                        <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider">Headcount</p>
                        <p className="text-lg font-extrabold text-charcoal">{activeScenarioData.headcountChange}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeScenarioData.keyInvestments?.length > 0 && (
                        <div className="bg-white/70 rounded-xl p-4">
                          <p className="text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-2">💰 Key Investments</p>
                          <ul className="space-y-1.5">
                            {activeScenarioData.keyInvestments.map((inv, i) => (
                              <li key={i} className="text-xs text-charcoal/70 flex items-start gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-charcoal/40 mt-1.5 shrink-0" />{inv}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {activeScenarioData.risks?.length > 0 && (
                        <div className="bg-white/70 rounded-xl p-4">
                          <p className="text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-2">⚠️ Risks</p>
                          <ul className="space-y-1.5">
                            {activeScenarioData.risks.map((r, i) => (
                              <li key={i} className="text-xs text-charcoal/70 flex items-start gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-red/60 mt-1.5 shrink-0" />{r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Hiring Roadmap — vertical timeline */}
            {hiringByPeriod.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-charcoal mb-1">Hiring Roadmap</h2>
                <p className="text-sm text-charcoal/50 mb-5">When each role should join, in order.</p>
                <div className="relative pl-6">
                  {/* the timeline spine */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-maroon/20 rounded-full" />
                  <div className="space-y-6">
                    {hiringByPeriod.map(({ period, roles }) => (
                      <div key={period} className="relative">
                        <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-maroon border-4 border-offwhite shadow" />
                        <p className="text-xs font-extrabold text-maroon uppercase tracking-wider mb-2">{period}</p>
                        <div className="flex flex-wrap gap-2">
                          {roles.map((h, i) => (
                            <span key={i} className="inline-flex items-center gap-2 bg-white border border-black/[0.05] shadow-sm rounded-xl px-3.5 py-2 text-sm font-semibold text-charcoal">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[h.priority] || 'bg-green'}`} title={h.priority} />
                              {h.role}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* AI Adoption + Budget side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {result.aiAdoption?.length > 0 && (
                <section className="rounded-2xl border border-green/20 bg-green/[0.03] p-5">
                  <h2 className="text-base font-bold text-charcoal mb-4">🤖 AI Adoption Roadmap</h2>
                  <div className="space-y-3">
                    {result.aiAdoption.map((a, i) => (
                      <div key={i} className="bg-white rounded-xl border border-black/[0.03] shadow-sm p-4">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-sm font-bold text-charcoal">{a.initiative}</p>
                          {a.timeline && <span className="px-2 py-0.5 rounded-full bg-green/10 text-green text-[10px] font-bold shrink-0">{a.timeline}</span>}
                        </div>
                        <p className="text-xs text-charcoal/70 mb-2">{a.expectedImpact}</p>
                        {a.roles?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {a.roles.map((r) => <span key={r} className="px-2 py-0.5 rounded-full bg-offwhite text-charcoal/50 text-[10px]">{r}</span>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="space-y-6">
                {/* Budget Impact */}
                {result.budgetImpact && (
                  <section className="bg-white rounded-2xl border border-black/[0.03] shadow-sm p-5">
                    <h2 className="text-base font-bold text-charcoal mb-3">Budget Impact</h2>
                    <p className="text-sm text-charcoal/75 leading-relaxed mb-4">{result.budgetImpact.summary}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {result.budgetImpact.shortTermInvestment && (
                        <div className="rounded-xl bg-offwhite p-4">
                          <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider mb-1">Short-term invest</p>
                          <p className="text-sm font-extrabold text-charcoal">{result.budgetImpact.shortTermInvestment}</p>
                        </div>
                      )}
                      {result.budgetImpact.longTermSavings && (
                        <div className="rounded-xl bg-green/8 p-4">
                          <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider mb-1">Long-term savings</p>
                          <p className="text-sm font-extrabold text-green">{result.budgetImpact.longTermSavings}</p>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Succession */}
                {result.successionPlan?.length > 0 && (
                  <section className="bg-white rounded-2xl border border-black/[0.03] shadow-sm p-5">
                    <h2 className="text-base font-bold text-charcoal mb-3">Succession Planning</h2>
                    <div className="divide-y divide-lightgrey/60">
                      {result.successionPlan.map((s, i) => (
                        <div key={i} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-charcoal">{s.criticalRole}</p>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${READINESS_STYLES[s.readiness] || READINESS_STYLES['needs-development']}`}>
                              {s.readiness}
                            </span>
                          </div>
                          <p className="text-xs text-charcoal/50 mt-0.5">
                            {s.currentHolder}{s.successor ? ` → ${s.successor}` : ' → no successor named'}
                          </p>
                          {s.developmentPlan && <p className="text-xs text-charcoal/65 mt-1">{s.developmentPlan}</p>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
