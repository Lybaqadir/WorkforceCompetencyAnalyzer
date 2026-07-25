import { useEffect, useRef, useState } from 'react';
import { runWorkflowStage } from '../lib/api';
import WorkflowProgressBar from '../components/WorkflowProgressBar';
import { Avatar, Donut, Legend } from '../components/ui';
import { ArrowRightIcon, MoonIcon, SunIcon } from '../components/icons';

const FIT_COLOR = (score) => (score >= 75 ? '#0d9488' : score >= 50 ? '#f59e0b' : '#dc2626');

function UrgencyBadge({ urgency }) {
  const map = {
    critical: 'bg-red/10 text-red',
    important: 'bg-gold/15 text-[#92620a]',
    'nice-to-have': 'bg-lightgrey text-charcoal/50',
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${map[urgency] || map['nice-to-have']}`}>{urgency}</span>;
}

// Person → target-role match row with a fit meter
function MatchRow({ m }) {
  const [open, setOpen] = useState(false);
  const color = FIT_COLOR(m.fitScore);
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className="w-full text-left bg-white rounded-2xl border border-black/[0.03] shadow-sm px-5 py-4 transition-all hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <Avatar name={m.memberName} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-charcoal">{m.memberName}</p>
            <span className="text-charcoal/30"><ArrowRightIcon width="14" height="14" /></span>
            <p className="text-sm font-semibold text-maroon">{m.targetRoleName}</p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-1.5 rounded-full bg-lightgrey overflow-hidden flex-1 max-w-[260px]">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.fitScore}%`, backgroundColor: color }} />
            </div>
            <span className="text-xs font-bold shrink-0" style={{ color }}>{m.fitScore}% fit</span>
          </div>
        </div>
        <span className="text-charcoal/30 text-xs shrink-0">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-lightgrey/60 pl-14">
          <p className="text-sm text-charcoal/70 leading-relaxed">{m.matchReason}</p>
          {m.gaps?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {m.gaps.map((g) => (
                <span key={g} className="px-2 py-0.5 rounded-full bg-red/8 text-red text-[10px] font-semibold">gap: {g}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </button>
  );
}

export default function TeamMappingScreen({ workflowData, onComplete, onBack, onRestart, reviewMode, onJumpToStage, theme, onToggleTheme, onDashboard }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(!workflowData.teamMapping);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  async function runStage() {
    setLoading(true);
    setError(null);
    try {
      const { result: r } = await runWorkflowStage('team-mapping', workflowData);
      if (!r) throw new Error('No result returned');
      setResult(r);
    } catch (err) {
      setError(err?.message || 'Could not generate team mapping. Please try again.');
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }

  const startedRef = useRef(false);
  useEffect(() => {
    if (workflowData.teamMapping) { setResult(workflowData.teamMapping); return; }
    if (startedRef.current) return; // StrictMode double-mount guard
    startedRef.current = true;
    runStage();
  }, []);

  const matched = result?.matched?.length ?? 0;
  const unmatched = result?.unmatched?.length ?? 0;
  const vacant = result?.vacant?.length ?? 0;

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <WorkflowProgressBar currentStage="team-mapping" reviewMode={reviewMode} onNavigate={onJumpToStage} onDashboard={onDashboard} />

      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-lightgrey/60">
        <div>
          <h1 className="text-xl font-extrabold text-charcoal">Team Mapping</h1>
          <p className="text-charcoal/50 text-sm mt-0.5">Matching your current team against the target organisation</p>
        </div>
        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button onClick={onToggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal/40 hover:text-charcoal/70 border border-lightgrey">
              {theme === 'dark' ? <SunIcon width="15" height="15" /> : <MoonIcon width="15" height="15" />}
            </button>
          )}
          {onBack && (
            <button onClick={onBack} className="px-4 py-2 rounded-xl border border-lightgrey text-sm font-semibold text-charcoal/60 hover:border-charcoal/30">← Back</button>
          )}
          {result && (
            <button onClick={() => onComplete(result)} className="bg-maroon text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-maroon-dark transition-colors">
              Continue to Skills Analysis →
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
            <p className="text-charcoal font-semibold">Mapping your team…</p>
            <p className="text-charcoal/50 text-sm mt-1">Analysing each person against the target roles</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-red/5 border border-red/20 rounded-2xl px-8 py-6 max-w-md">
              <p className="text-red font-semibold mb-2">Something went wrong</p>
              <p className="text-charcoal/60 text-sm mb-4">{error}</p>
              <button
                onClick={() => { setRetrying(true); runStage(); }}
                disabled={retrying}
                className="bg-maroon text-white rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50"
              >
                {retrying ? 'Retrying…' : 'Try Again'}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-8">
            {/* Hero: donut + at-a-glance summary */}
            <div className="bg-white rounded-2xl border border-black/[0.03] shadow-sm p-6 flex flex-col md:flex-row items-center gap-8">
              <Donut
                segments={[
                  { value: matched, color: '#0d9488' },
                  { value: unmatched, color: '#f59e0b' },
                  { value: vacant, color: '#dc2626' },
                ]}
                size={150}
                thickness={18}
              >
                <span className="text-3xl font-extrabold text-charcoal leading-none">{matched + unmatched}</span>
                <span className="text-[11px] text-charcoal/45 mt-1">people</span>
              </Donut>
              <div className="flex-1 min-w-0">
                <Legend
                  items={[
                    { label: 'Matched to a target role', color: '#0d9488', value: matched },
                    { label: 'No close match yet', color: '#f59e0b', value: unmatched },
                    { label: 'Target roles still vacant', color: '#dc2626', value: vacant },
                  ]}
                  className="mb-4"
                />
                {result.summary && (
                  <p className="text-sm text-charcoal/70 leading-relaxed border-t border-lightgrey/60 pt-4">{result.summary}</p>
                )}
              </div>
            </div>

            {/* Matched — person → role rows with fit meters */}
            {result.matched?.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-charcoal mb-1">
                  Matched <span className="text-charcoal/40 font-normal ml-1">({result.matched.length})</span>
                </h2>
                <p className="text-sm text-charcoal/50 mb-4">Strong fits — click a row for the reasoning and remaining gaps.</p>
                <div className="space-y-3">
                  {result.matched
                    .slice()
                    .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
                    .map((m) => <MatchRow key={m.memberId} m={m} />)}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Unmatched */}
              {result.unmatched?.length > 0 && (
                <section>
                  <h2 className="text-base font-bold text-charcoal mb-1">
                    Unmatched <span className="text-charcoal/40 font-normal ml-1">({result.unmatched.length})</span>
                  </h2>
                  <p className="text-sm text-charcoal/50 mb-4">No close target role — reskill, re-place, or discuss next steps.</p>
                  <div className="space-y-3">
                    {result.unmatched.map((m) => (
                      <div key={m.memberId} className="bg-white rounded-2xl border-l-4 border border-black/[0.03] border-l-gold shadow-sm p-4">
                        <div className="flex items-start gap-3">
                          <Avatar name={m.memberName} size={36} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-charcoal">{m.memberName}</p>
                            <p className="text-xs text-charcoal/50 mb-2">{m.closestRole ? `Closest role: ${m.closestRole}` : 'No close match'}</p>
                            <p className="text-sm text-charcoal/70 leading-relaxed">{m.reason}</p>
                            <p className="text-sm text-maroon font-semibold mt-1.5">→ {m.recommendations}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Vacant */}
              {result.vacant?.length > 0 && (
                <section>
                  <h2 className="text-base font-bold text-charcoal mb-1">
                    Vacant Roles <span className="text-charcoal/40 font-normal ml-1">({result.vacant.length})</span>
                  </h2>
                  <p className="text-sm text-charcoal/50 mb-4">No internal candidate — hire, train, or reconsider the role.</p>
                  <div className="space-y-3">
                    {result.vacant.map((v) => (
                      <div key={v.roleId} className="bg-white rounded-2xl border-l-4 border border-black/[0.03] border-l-red shadow-sm p-4">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-sm font-bold text-charcoal">{v.roleName}</p>
                          <UrgencyBadge urgency={v.urgency} />
                        </div>
                        <p className="text-xs text-charcoal/60 leading-relaxed">{v.reason}</p>
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
