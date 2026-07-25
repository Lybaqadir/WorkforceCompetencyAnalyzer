import { useEffect, useRef, useState } from 'react';
import { Card, Donut, PageHeader } from '../components/ui';
import { ArrowRightIcon, PersonIcon, SparkleIcon } from '../components/icons';
import { generateJobDescription } from '../lib/api';
import PulsingDots from '../components/PulsingDots';

function CopyButton({ getText }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    const text = getText();
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={handleCopy}
      className="text-xs font-semibold text-charcoal/50 border border-lightgrey rounded-lg px-3 py-1.5 hover:bg-lightgrey/50 transition-colors duration-200 shrink-0"
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}

function BulletList({ items, color = 'text-maroon' }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-charcoal/80 flex gap-2 leading-snug">
          <span className={`${color} shrink-0`}>·</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function JDContent({ role, jd, onGenerate, generating }) {
  if (generating) {
    return (
      <div className="col-span-2 flex flex-col items-center justify-center py-20 gap-4">
        <PulsingDots />
        <p className="text-sm text-charcoal/50">AI is writing the job descriptions…</p>
      </div>
    );
  }

  if (!jd) {
    return (
      <div className="col-span-2 flex flex-col items-center justify-center py-20 gap-5">
        <div className="w-14 h-14 rounded-2xl bg-maroon/10 text-maroon flex items-center justify-center">
          <SparkleIcon width="24" height="24" />
        </div>
        <div className="text-center max-w-sm">
          <p className="text-sm font-bold text-charcoal mb-1">No job description yet</p>
          <p className="text-xs text-charcoal/50 leading-relaxed mb-5">
            Generate a dual job description for this role — one for a human hire, one for an AI agent.
          </p>
          <button
            onClick={onGenerate}
            className="inline-flex items-center gap-2 bg-maroon text-white rounded-xl px-5 py-3 text-sm font-bold hover:bg-maroon-dark transition-colors duration-200 shadow-[0_4px_12px_rgba(67,56,202,0.2)]"
          >
            <SparkleIcon width="15" height="15" />
            Generate with AI
          </button>
        </div>
      </div>
    );
  }

  const { human, aiAgent } = jd;

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-maroon/10 text-maroon flex items-center justify-center">
              <PersonIcon width="16" height="16" />
            </span>
            <span className="text-sm font-extrabold text-charcoal">For a Person</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onGenerate}
              className="text-[11px] font-semibold text-maroon hover:text-maroon-dark"
            >
              Regenerate
            </button>
            <CopyButton getText={() => [
              `${role.name} — For a Person`, '',
              human.about || '', '',
              'Duties:', ...(human.duties || []).map((d) => `- ${d}`), '',
              'Skills:', ...(human.skills || []).map((s) => `- ${s}`), '',
              'Works with:', ...(Array.isArray(human.worksWith) ? human.worksWith : [human.worksWith || '']),
            ].join('\n')} />
          </div>
        </div>
        <p className="text-sm text-charcoal/75 leading-relaxed mb-5">{human.about}</p>
        <p className="text-[11px] font-bold text-charcoal/40 uppercase tracking-wide mb-2">Duties</p>
        <BulletList items={human.duties || []} />
        <p className="text-[11px] font-bold text-charcoal/40 uppercase tracking-wide mt-5 mb-2">Skills to look for</p>
        <div className="flex flex-wrap gap-2">
          {(human.skills || []).map((s, i) => (
            <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-maroon/10 text-maroon">
              {s}
            </span>
          ))}
        </div>
        <p className="text-[11px] font-bold text-charcoal/40 uppercase tracking-wide mt-5 mb-2">Works with</p>
        <p className="text-sm text-charcoal/75 leading-relaxed">
          {Array.isArray(human.worksWith) ? human.worksWith.join(', ') : human.worksWith}
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-green/10 text-green flex items-center justify-center">
              <SparkleIcon width="16" height="16" />
            </span>
            <span className="text-sm font-extrabold text-charcoal">For an AI Agent</span>
          </span>
          <CopyButton getText={() => [
            `${role.name} — For an AI Agent`, '',
            aiAgent.about || '', '',
            'Tasks:', ...(aiAgent.tasks || []).map((t) => `- ${t}`), '',
            'Needs:', ...(aiAgent.needs || []).map((n) => `- ${n}`), '',
            'Hands back:', ...(aiAgent.handsBack || []).map((h) => `- ${h}`),
          ].join('\n')} />
        </div>
        <p className="text-sm text-charcoal/75 leading-relaxed mb-5">{aiAgent.about}</p>
        <p className="text-[11px] font-bold text-charcoal/40 uppercase tracking-wide mb-2">Automated tasks</p>
        <BulletList items={aiAgent.tasks || []} color="text-green" />
        <p className="text-[11px] font-bold text-charcoal/40 uppercase tracking-wide mt-5 mb-2">Needs to work</p>
        <BulletList items={aiAgent.needs || []} color="text-green" />
        <p className="text-[11px] font-bold text-charcoal/40 uppercase tracking-wide mt-5 mb-2">Hands back to the human</p>
        <BulletList items={aiAgent.handsBack || []} color="text-green" />
      </Card>
    </>
  );
}

export default function JobDescriptionsScreen({
  teamRoles,
  targetOrg,
  mission,
  workflowData,
  initialRoleId,
  preloadRoles,
  returnToWorkflow,
  onReturnToWorkflow,
}) {
  const currentRoles = teamRoles || [];
  const targetRoles = targetOrg || [];

  // Merge: current roles + target org roles not already in current + preloaded hiring roles
  const preload = preloadRoles || [];
  const allRoleOptions = [
    ...currentRoles.map((r) => ({ ...r, _source: 'current' })),
    ...targetRoles
      .filter((tr) => !currentRoles.some((cr) => cr.id === tr.id))
      .map((r) => ({ ...r, _source: 'target' })),
    ...preload
      .filter((pr) => !currentRoles.some((cr) => cr.id === pr.id) && !targetRoles.some((tr) => tr.id === pr.id))
      .map((r) => ({ ...r, _source: 'hiring' })),
  ];

  const firstId = initialRoleId && allRoleOptions.some((r) => r.id === initialRoleId)
    ? initialRoleId
    : (preload.length > 0 ? preload[0]?.id : allRoleOptions[0]?.id);

  const [activeId, setActiveId] = useState(firstId || '');
  const [generatedJDs, setGeneratedJDs] = useState({});
  const [generating, setGenerating] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);

  const activeRole = allRoleOptions.find((r) => r.id === activeId);
  const activeJD = generatedJDs[activeId] ?? null;

  // Auto-generate JDs for all preloaded hiring roles when the screen first mounts with them
  const autoGenStartedRef = useRef(false);
  useEffect(() => {
    if (!preload.length) return;
    if (autoGenStartedRef.current) return; // StrictMode double-mount guard
    autoGenStartedRef.current = true;
    setAutoGenerating(true);
    Promise.allSettled(
      preload.map(async (role) => {
        try {
          const result = await generateJobDescription(
            {
              title: role.name,
              verdict: role.verdict,
              competencies: (role.competencies || []).map((c) => ({ label: c.name, type: c.type })),
            },
            mission?.statement,
          );
          if (result) {
            setGeneratedJDs((prev) => ({ ...prev, [role.id]: result }));
          }
        } catch { /* silently fail */ }
      })
    ).finally(() => setAutoGenerating(false));
  }, []);

  async function handleGenerate() {
    if (!activeRole || generating) return;
    setGenerating(true);
    try {
      const result = await generateJobDescription(
        {
          title: activeRole.name,
          verdict: activeRole.verdict,
          competencies: (activeRole.competencies || []).map((c) => ({ label: c.name, type: c.type })),
        },
        mission?.statement,
      );
      if (result) {
        setGeneratedJDs((prev) => ({ ...prev, [activeId]: result }));
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-[1240px]">
      {/* Return to workflow banner */}
      {returnToWorkflow && onReturnToWorkflow && (
        <div className="mb-5 rounded-2xl bg-gold/10 border border-gold/30 px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gold/20 text-[#92620a] flex items-center justify-center shrink-0">
              <SparkleIcon width="14" height="14" />
            </span>
            <p className="text-sm font-semibold text-charcoal">
              You temporarily left the workflow to generate job descriptions. Your workflow progress is saved.
            </p>
          </div>
          <button
            onClick={onReturnToWorkflow}
            className="inline-flex items-center gap-2 bg-maroon text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-maroon-dark transition-colors shrink-0"
          >
            Resume Workflow
            <ArrowRightIcon width="14" height="14" />
          </button>
        </div>
      )}

      {/* Auto-generating banner */}
      {autoGenerating && (
        <div className="mb-5 rounded-2xl bg-maroon/[0.05] border border-maroon/15 px-5 py-3.5 flex items-center gap-3">
          <SparkleIcon width="15" height="15" className="text-maroon animate-pulse shrink-0" />
          <p className="text-sm font-semibold text-maroon">Generating job descriptions for all recommended roles…</p>
        </div>
      )}

      <PageHeader
        title="Job Descriptions"
        subtitle="One for a human hire, one for an AI agent — generated from your actual org"
      />

      <div className="flex gap-5 items-start">
        {/* Role picker rail */}
        <div className="w-[250px] shrink-0 space-y-1">
          {currentRoles.length > 0 && (
            <p className="text-[10px] font-bold text-charcoal/35 uppercase tracking-widest px-1 pb-1">Current roles</p>
          )}
          {currentRoles.map((r) => {
            const active = r.id === activeId;
            const hasJD = !!generatedJDs[r.id];
            return (
              <button
                key={r.id}
                onClick={() => setActiveId(r.id)}
                className={`w-full flex items-center gap-3 text-left rounded-2xl px-4 py-3 transition-all duration-200 ${
                  active
                    ? 'bg-maroon text-white shadow-[0_4px_12px_rgba(67,56,202,0.25)]'
                    : 'bg-white text-charcoal border border-black/[0.03] hover:shadow-[0_4px_12px_rgba(18,19,26,0.08)]'
                }`}
              >
                <Donut
                  size={34}
                  thickness={5}
                  track={active ? 'rgba(255,255,255,0.2)' : '#eef0f7'}
                  segments={[
                    { value: r.aiPercent || 50, color: '#0d9488' },
                    { value: r.humanPercent || 50, color: active ? '#ffffff' : '#4338ca' },
                  ]}
                >
                  <span className={`text-[9px] font-extrabold ${active ? 'text-white' : 'text-charcoal'}`}>
                    {r.aiPercent || '?'}
                  </span>
                </Donut>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold leading-snug block truncate">{r.name}</span>
                  {!hasJD && !active && (
                    <span className="text-[10px] text-charcoal/35">No JD yet</span>
                  )}
                  {hasJD && (
                    <span className="text-[10px] text-green font-semibold">JD ready ✓</span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Target org roles */}
          {targetRoles.filter((tr) => !currentRoles.some((cr) => cr.id === tr.id)).length > 0 && (
            <>
              <p className="text-[10px] font-bold text-charcoal/35 uppercase tracking-widest px-1 pt-3 pb-1">Target org roles</p>
              {targetRoles
                .filter((tr) => !currentRoles.some((cr) => cr.id === tr.id))
                .map((r) => {
                  const active = r.id === activeId;
                  const hasJD = !!generatedJDs[r.id];
                  return (
                    <button
                      key={r.id}
                      onClick={() => setActiveId(r.id)}
                      className={`w-full flex items-center gap-3 text-left rounded-2xl px-4 py-3 transition-all duration-200 ${
                        active
                          ? 'bg-maroon text-white shadow-[0_4px_12px_rgba(67,56,202,0.25)]'
                          : 'bg-white text-charcoal border border-black/[0.03] hover:shadow-[0_4px_12px_rgba(18,19,26,0.08)]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                        <SparkleIcon width="14" height="14" className={active ? 'text-white' : 'text-[#92620a]'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold leading-snug block truncate">{r.name}</span>
                        <span className={`text-[10px] ${active ? 'text-white/60' : 'text-[#92620a]/70'}`}>
                          {r.isNew ? 'New role' : r.subTeam || 'Target'}
                        </span>
                      </div>
                      {hasJD ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green/10 text-green">✓</span>
                      ) : (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          active ? 'bg-white/20 text-white' : 'bg-gold/15 text-[#92620a]'
                        }`}>
                          Generate
                        </span>
                      )}
                    </button>
                  );
                })}
            </>
          )}

          {/* Hiring recommended roles */}
          {preload.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-charcoal/35 uppercase tracking-widest px-1 pt-3 pb-1">Recommended hires</p>
              {preload.map((r) => {
                const active = r.id === activeId;
                const hasJD = !!generatedJDs[r.id];
                return (
                  <button
                    key={r.id}
                    onClick={() => setActiveId(r.id)}
                    className={`w-full flex items-center gap-3 text-left rounded-2xl px-4 py-3 transition-all duration-200 ${
                      active
                        ? 'bg-maroon text-white shadow-[0_4px_12px_rgba(67,56,202,0.25)]'
                        : 'bg-white text-charcoal border border-black/[0.03] hover:shadow-[0_4px_12px_rgba(18,19,26,0.08)]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-red/10 flex items-center justify-center shrink-0">
                      <PersonIcon width="14" height="14" className={active ? 'text-white' : 'text-red'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold leading-snug block truncate">{r.name}</span>
                      <span className={`text-[10px] ${active ? 'text-white/60' : 'text-red/70'}`}>New hire needed</span>
                    </div>
                    {hasJD ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green/10 text-green">✓</span>
                    ) : autoGenerating ? (
                      <span className="text-[9px] text-charcoal/35 animate-pulse">…</span>
                    ) : null}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* JD content area */}
        <div className="flex-1 grid grid-cols-2 gap-5 items-start">
          {activeRole ? (
            <JDContent
              role={activeRole}
              jd={activeJD}
              onGenerate={handleGenerate}
              generating={generating || (autoGenerating && !generatedJDs[activeId])}
            />
          ) : (
            <div className="col-span-2 text-center py-20">
              <p className="text-sm text-charcoal/45">Select a role to view or generate its job description.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
