import { useEffect, useRef, useState } from 'react';
import { runWorkflowStage } from '../lib/api';
import WorkflowProgressBar from '../components/WorkflowProgressBar';
import { Avatar } from '../components/ui';
import { ArrowRightIcon, MoonIcon, SparkleIcon, SunIcon } from '../components/icons';

const READINESS_STYLES = {
  'ready-now': 'bg-green/10 text-green',
  'needs-3-months': 'bg-gold/10 text-[#92620a]',
  'needs-6-months': 'bg-red/10 text-red',
};

const PRIORITY_STYLES = {
  urgent: 'bg-red/10 text-red',
  important: 'bg-gold/10 text-[#92620a]',
  planned: 'bg-lightgrey text-charcoal/50',
};

// Numbered strategy-lane header: "check internal first, hire last"
function LaneHeader({ step, title, tone, hint, count, action }) {
  const tones = {
    green: 'bg-green text-white',
    gold: 'bg-gold text-navy',
    maroon: 'bg-maroon text-white',
  };
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-extrabold shrink-0 ${tones[tone]}`}>{step}</span>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-bold text-charcoal leading-tight">
          {title} {count != null && <span className="text-charcoal/40 font-normal">({count})</span>}
        </h2>
        <p className="text-xs text-charcoal/50">{hint}</p>
      </div>
      {action}
    </div>
  );
}

export default function RecommendationsScreen({ workflowData, onComplete, onBack, onRequestJD, reviewMode, onJumpToStage, theme, onToggleTheme, onDashboard }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(!workflowData.recommendations);
  const [error, setError] = useState(null);
  const [showJDPrompt, setShowJDPrompt] = useState(false);
  const [jdPromptDismissed, setJdPromptDismissed] = useState(false);

  async function runStage() {
    setLoading(true);
    setError(null);
    try {
      const { result: r } = await runWorkflowStage('recommendations', workflowData);
      if (!r) throw new Error('No result');
      setResult(r);
      if ((r.hiring?.length > 0) && !jdPromptDismissed) {
        setShowJDPrompt(true);
      }
    } catch (err) {
      setError(err?.message || 'Could not generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const startedRef = useRef(false);
  useEffect(() => {
    if (workflowData.recommendations) { setResult(workflowData.recommendations); return; }
    if (startedRef.current) return; // StrictMode double-mount guard
    startedRef.current = true;
    runStage();
  }, []);

  function handleGenerateJDs() {
    const hiringRoles = (result?.hiring || []).map((h, i) => ({
      id: `hiring-${i}`,
      name: h.role,
      verdict: 'AI + Human',
      aiPercent: 50,
      humanPercent: 50,
      competencies: (h.keySkillsNeeded || []).map((s) => ({ name: s, type: 'human' })),
      isNew: true,
      _source: 'hiring',
    }));
    setShowJDPrompt(false);
    setJdPromptDismissed(true);
    // Pass both hiring roles AND the current result so App can save it
    onRequestJD?.(hiringRoles, result);
  }

  function handleSkipJDs() {
    setShowJDPrompt(false);
    setJdPromptDismissed(true);
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <WorkflowProgressBar currentStage="recommendations" reviewMode={reviewMode} onNavigate={onJumpToStage} onDashboard={onDashboard} />

      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-lightgrey/60">
        <div>
          <h1 className="text-xl font-extrabold text-charcoal">Recommendations</h1>
          <p className="text-charcoal/50 text-sm mt-0.5">Internal mobility first, then reskilling, then hiring</p>
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
              Continue to Future Planning →
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
            <p className="text-charcoal font-semibold">Building recommendations…</p>
            <p className="text-charcoal/50 text-sm mt-1">Checking internal candidates before suggesting hiring</p>
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
            {/* JD prompt banner */}
            {showJDPrompt && result.hiring?.length > 0 && (
              <div className="rounded-2xl bg-maroon/[0.06] border border-maroon/20 p-5 flex items-start gap-4">
                <span className="w-10 h-10 rounded-xl bg-maroon/10 text-maroon flex items-center justify-center shrink-0 mt-0.5">
                  <SparkleIcon width="18" height="18" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-charcoal mb-1">
                    I've identified {result.hiring.length} new role{result.hiring.length !== 1 ? 's' : ''} that need hiring.
                    Would you like me to generate Job Descriptions for {result.hiring.length !== 1 ? 'these roles' : 'this role'}?
                  </p>
                  <p className="text-xs text-charcoal/55 mb-4">
                    JDs will be pre-populated using your mission, organisation, skills analysis, gap analysis, and these recommendations — no re-entry needed.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerateJDs}
                      className="inline-flex items-center gap-2 bg-maroon text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-maroon-dark transition-colors shadow-sm"
                    >
                      <SparkleIcon width="14" height="14" />
                      Generate Job Descriptions
                    </button>
                    <button
                      onClick={handleSkipJDs}
                      className="px-4 py-2.5 rounded-xl border border-lightgrey text-sm font-semibold text-charcoal/55 hover:bg-lightgrey/40 transition-colors"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Strategy overview strip: 1 → 2 → 3 */}
            <div className="bg-white rounded-2xl border border-black/[0.03] shadow-sm p-5">
              <p className="text-xs font-bold text-charcoal/40 uppercase tracking-wider mb-3">The strategy</p>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { n: 1, label: 'Move people internally', count: result.internalMobility?.length ?? 0, cls: 'bg-green/10 text-green border-green/20' },
                  { n: 2, label: 'Reskill the team', count: result.reskilling?.length ?? 0, cls: 'bg-gold/10 text-[#92620a] border-gold/25' },
                  { n: 3, label: 'Hire only what remains', count: result.hiring?.length ?? 0, cls: 'bg-maroon/10 text-maroon border-maroon/20' },
                ].map((s, i) => (
                  <div key={s.n} className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-semibold ${s.cls}`}>
                      <span className="font-extrabold">{s.n}.</span> {s.label}
                      <span className="px-1.5 py-0.5 rounded-full bg-white/70 text-[11px] font-bold">{s.count}</span>
                    </span>
                    {i < 2 && <span className="text-charcoal/30"><ArrowRightIcon width="14" height="14" /></span>}
                  </div>
                ))}
              </div>
              {result.summary && (
                <p className="text-sm text-charcoal/70 leading-relaxed mt-4 pt-4 border-t border-lightgrey/60">{result.summary}</p>
              )}
            </div>

            {/* Step 1 — Internal Mobility */}
            {result.internalMobility?.length > 0 && (
              <section>
                <LaneHeader step={1} tone="green" title="Internal Mobility" count={result.internalMobility.length} hint="People who can move into target roles — always check internal first" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.internalMobility.map((m, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-black/[0.03] border-t-4 border-t-green shadow-sm p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar name={m.personName} size={38} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-charcoal">{m.personName}</p>
                          <p className="text-xs text-charcoal/50 flex items-center gap-1.5 flex-wrap mt-0.5">
                            {m.currentRole}
                            <ArrowRightIcon width="11" height="11" className="text-green" />
                            <strong className="text-charcoal">{m.recommendedRole}</strong>
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${READINESS_STYLES[m.readinessLevel] || READINESS_STYLES['needs-6-months']}`}>
                          {m.readinessLevel?.replace(/-/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-charcoal/70 leading-relaxed mb-2">{m.rationale}</p>
                      {m.developmentNeeded && (
                        <p className="text-sm text-maroon font-semibold">Development: {m.developmentNeeded}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Step 2 — Reskilling */}
            {result.reskilling?.length > 0 && (
              <section>
                <LaneHeader step={2} tone="gold" title="Reskilling Plan" count={result.reskilling.length} hint="Grow the skills you already pay for" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.reskilling.map((r, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-black/[0.03] border-t-4 border-t-gold shadow-sm p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar name={r.personName} size={32} />
                        <p className="text-sm font-bold text-charcoal">{r.personName}</p>
                        {r.timeline && <span className="ml-auto px-2 py-0.5 rounded-full bg-offwhite text-charcoal/50 text-[10px] font-bold shrink-0">{r.timeline}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {r.targetSkills?.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-full bg-maroon/8 text-maroon text-[10px] font-semibold">{s}</span>
                        ))}
                      </div>
                      <p className="text-sm text-charcoal/65">{r.trainingApproach}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Step 3 — Hiring */}
            {result.hiring?.length > 0 && (
              <section>
                <LaneHeader
                  step={3}
                  tone="maroon"
                  title="External Hiring"
                  count={result.hiring.length}
                  hint="Only where internal moves and reskilling can't fill the gap"
                  action={!jdPromptDismissed && (
                    <button
                      onClick={() => setShowJDPrompt(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-maroon hover:text-maroon-dark shrink-0"
                    >
                      <SparkleIcon width="12" height="12" />
                      Generate JDs
                    </button>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.hiring.map((h, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-black/[0.03] border-t-4 border-t-maroon shadow-sm p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-bold text-charcoal">{h.role}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${PRIORITY_STYLES[h.priority] || PRIORITY_STYLES.planned}`}>{h.priority}</span>
                      </div>
                      <p className="text-sm text-charcoal/65 mb-2">{h.reason}</p>
                      {h.keySkillsNeeded?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {h.keySkillsNeeded.map((s) => <span key={s} className="px-2 py-0.5 rounded-full bg-offwhite text-charcoal/50 text-[10px]">{s}</span>)}
                        </div>
                      )}
                      {h.timeline && <p className="text-xs text-charcoal/40 mt-2">Timeline: {h.timeline}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Automation — bonus strip */}
            {result.automation?.length > 0 && (
              <section className="rounded-2xl border border-green/20 bg-green/[0.03] p-5">
                <h2 className="text-base font-bold text-charcoal mb-1">⚡ Automation Opportunities</h2>
                <p className="text-xs text-charcoal/50 mb-4">Reduce the workload before adding headcount</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.automation.map((a, i) => (
                    <div key={i} className="bg-white rounded-xl border border-black/[0.03] shadow-sm p-4">
                      <p className="text-sm font-bold text-charcoal mb-1">{a.task}</p>
                      <p className="text-xs text-charcoal/50 mb-2">Currently: {a.currentlyHandledBy}</p>
                      <p className="text-xs text-charcoal/70 mb-1">{a.automationApproach}</p>
                      {a.estimatedTimeSaving && (
                        <p className="text-xs font-semibold text-green">Saving: {a.estimatedTimeSaving}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
