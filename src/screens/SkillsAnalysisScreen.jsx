import { useEffect, useRef, useState } from 'react';
import { runWorkflowStage } from '../lib/api';
import WorkflowProgressBar from '../components/WorkflowProgressBar';
import { MoonIcon, SunIcon } from '../components/icons';

const LANES = [
  {
    key: 'covered',
    title: 'Covered',
    hint: 'Well represented in the team',
    dot: 'bg-green',
    color: '#0d9488',
    chip: 'bg-green/10 text-green border-green/20',
  },
  {
    key: 'partial',
    title: 'Partial',
    hint: 'Present, but not deep enough',
    dot: 'bg-gold',
    color: '#f59e0b',
    chip: 'bg-gold/10 text-[#92620a] border-gold/25',
  },
  {
    key: 'missing',
    title: 'Missing',
    hint: 'Nobody covers this today',
    dot: 'bg-red',
    color: '#dc2626',
    chip: 'bg-red/10 text-red border-red/20',
  },
];

function CompetencyChip({ c, lane }) {
  const [open, setOpen] = useState(false);
  const detail = (() => {
    if (c.status === 'covered') {
      return c.coveredBy?.length > 0 ? `${c.coveredBy.join(' and ')} fully cover this competency.` : 'Fully covered by the current team.';
    }
    if (c.status === 'partial') {
      const who = c.coveredBy?.length > 0 ? c.coveredBy.join(', ') : 'Someone on the team';
      const needs = c.requiredBy?.length > 0 ? ` Full depth is needed for ${c.requiredBy.join(', ')}.` : '';
      return `${who} partially covers this — not at the depth required.${needs}`;
    }
    const needs = c.requiredBy?.length > 0 ? ` Required by: ${c.requiredBy.join(', ')}.` : '';
    return `Nobody on the team covers this.${needs} Hire, train, or bring in a specialist.`;
  })();

  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all hover:shadow-sm bg-white ${open ? 'shadow-sm' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-charcoal leading-snug">{c.name}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {c.importance === 'critical' && (
            <span className="px-1.5 py-0.5 rounded-full bg-red/10 text-red text-[9px] font-bold uppercase">critical</span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${lane.chip}`}>{lane.title.toLowerCase()}</span>
        </div>
      </div>
      {c.coveredBy?.length > 0 && c.status !== 'missing' && (
        <p className="text-xs text-charcoal/55 mt-1 truncate">👤 {c.coveredBy.join(', ')}</p>
      )}
      {open && (
        <p className="text-xs text-charcoal/65 mt-2 pt-2 border-t border-lightgrey/60 leading-relaxed">{detail}</p>
      )}
    </button>
  );
}

export default function SkillsAnalysisScreen({ workflowData, onComplete, onBack, reviewMode, onJumpToStage, theme, onToggleTheme, onDashboard }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(!workflowData.skillsAnalysis);
  const [error, setError] = useState(null);

  async function runStage() {
    setLoading(true);
    setError(null);
    try {
      const { result: r } = await runWorkflowStage('skills-analysis', workflowData);
      if (!r) throw new Error('No result');
      setResult(r);
    } catch (err) {
      setError(err?.message || 'Could not generate skills analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const startedRef = useRef(false);
  useEffect(() => {
    if (workflowData.skillsAnalysis) { setResult(workflowData.skillsAnalysis); return; }
    if (startedRef.current) return; // StrictMode double-mount guard
    startedRef.current = true;
    runStage();
  }, []);

  const byStatus = (s) => result?.competencies?.filter((c) => c.status === s) || [];
  const covered = byStatus('covered');
  const partial = byStatus('partial');
  const missing = byStatus('missing');
  const total = covered.length + partial.length + missing.length;
  const coveragePct = total > 0 ? Math.round(((covered.length + partial.length * 0.5) / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <WorkflowProgressBar currentStage="skills-analysis" reviewMode={reviewMode} onNavigate={onJumpToStage} onDashboard={onDashboard} />

      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-lightgrey/60">
        <div>
          <h1 className="text-xl font-extrabold text-charcoal">Skills Analysis</h1>
          <p className="text-charcoal/50 text-sm mt-0.5">Competency coverage across your team and target roles</p>
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
              Continue to Gap Analysis →
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
            <p className="text-charcoal font-semibold">Analysing skills landscape…</p>
            <p className="text-charcoal/50 text-sm mt-1">Mapping competencies across team and target roles</p>
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
            {/* Hero: single coverage meter */}
            <div className="bg-white rounded-2xl border border-black/[0.03] shadow-sm p-6">
              <div className="flex items-end justify-between gap-4 mb-3 flex-wrap">
                <div>
                  <p className="text-xs font-bold text-charcoal/40 uppercase tracking-wider mb-1">Team skill coverage</p>
                  <p className="text-4xl font-extrabold text-charcoal leading-none">{coveragePct}%</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-charcoal/60"><span className="w-2.5 h-2.5 rounded-full bg-green" />{covered.length} covered</span>
                  <span className="flex items-center gap-1.5 text-charcoal/60"><span className="w-2.5 h-2.5 rounded-full bg-gold" />{partial.length} partial</span>
                  <span className="flex items-center gap-1.5 text-charcoal/60"><span className="w-2.5 h-2.5 rounded-full bg-red" />{missing.length} missing</span>
                </div>
              </div>
              {/* Segmented stacked bar */}
              <div className="h-3 rounded-full bg-lightgrey overflow-hidden flex">
                {total > 0 && (
                  <>
                    <div className="h-full bg-green transition-all duration-700" style={{ width: `${(covered.length / total) * 100}%` }} />
                    <div className="h-full bg-gold transition-all duration-700" style={{ width: `${(partial.length / total) * 100}%` }} />
                    <div className="h-full bg-red transition-all duration-700" style={{ width: `${(missing.length / total) * 100}%` }} />
                  </>
                )}
              </div>
              {result.summary && (
                <p className="text-sm text-charcoal/70 leading-relaxed mt-4 pt-4 border-t border-lightgrey/60">{result.summary}</p>
              )}
            </div>

            {/* Three-lane competency board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {LANES.map((lane) => {
                const items = byStatus(lane.key);
                return (
                  <div key={lane.key} className="rounded-2xl bg-white border border-black/[0.03] shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b-2" style={{ borderColor: lane.color }}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${lane.dot}`} />
                        <p className="text-sm font-bold text-charcoal">{lane.title}</p>
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-offwhite text-charcoal/50 text-xs font-bold">{items.length}</span>
                      </div>
                      <p className="text-[11px] text-charcoal/45 mt-0.5">{lane.hint}</p>
                    </div>
                    <div className="p-3 space-y-2 bg-offwhite/60">
                      {items.length === 0 && <p className="text-xs text-charcoal/35 text-center py-4">None</p>}
                      {items.map((c, i) => <CompetencyChip key={i} c={c} lane={lane} />)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI vs Human split */}
            {(result.aiAutomatable?.length > 0 || result.humanCritical?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {result.aiAutomatable?.length > 0 && (
                  <section className="rounded-2xl border border-green/20 bg-green/[0.03] p-5">
                    <h2 className="text-base font-bold text-charcoal mb-1">🤖 AI-Automatable Tasks</h2>
                    <p className="text-xs text-charcoal/50 mb-4">Work an AI agent could take on</p>
                    <div className="space-y-3">
                      {result.aiAutomatable.map((t, i) => (
                        <div key={i} className="bg-white rounded-xl border border-black/[0.03] shadow-sm p-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-charcoal">{t.task}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              t.automationPotential === 'high' ? 'bg-green/10 text-green' :
                              t.automationPotential === 'medium' ? 'bg-gold/10 text-[#92620a]' : 'bg-lightgrey text-charcoal/50'
                            }`}>{t.automationPotential}</span>
                          </div>
                          <p className="text-xs text-charcoal/50">Currently: {t.currentlyDoneBy}</p>
                          <p className="text-sm text-charcoal/70 mt-1">{t.reason}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {result.humanCritical?.length > 0 && (
                  <section className="rounded-2xl border border-maroon/15 bg-maroon/[0.03] p-5">
                    <h2 className="text-base font-bold text-charcoal mb-1">🧠 Human-Critical Skills</h2>
                    <p className="text-xs text-charcoal/50 mb-4">Where people stay irreplaceable</p>
                    <div className="space-y-3">
                      {result.humanCritical.map((h, i) => (
                        <div key={i} className="bg-white rounded-xl border border-black/[0.03] shadow-sm p-4">
                          <p className="text-sm font-semibold text-charcoal mb-1">{h.skill}</p>
                          <p className="text-sm text-charcoal/65 leading-relaxed">{h.reason}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
