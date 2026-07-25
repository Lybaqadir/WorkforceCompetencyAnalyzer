import { useEffect, useMemo, useState } from 'react';
import { Card, Donut, Legend, PageHeader, SectionTitle, VerdictPill } from '../components/ui';
import PulsingDots from '../components/PulsingDots';
// roleById removed — AnalyseScreen works from teamRoles prop only

const COLORS = { ai: '#0d9488', human: '#4338ca' };

function VerdictPanel({ role }) {
  return (
    <Card className="animate-panel-in">
      <SectionTitle action={<VerdictPill verdict={role.verdict} />}>AI vs Human split</SectionTitle>
      <div className="flex items-center gap-7">
        <Donut
          size={160}
          thickness={22}
          segments={[
            { value: role.aiPercent, color: COLORS.ai },
            { value: role.humanPercent, color: COLORS.human },
          ]}
        >
          <span className="text-3xl font-extrabold text-charcoal leading-none">
            {role.aiPercent}%
          </span>
          <span className="text-[11px] text-charcoal/45 mt-1">AI-doable</span>
        </Donut>
        <Legend
          className="flex-1"
          items={[
            { label: 'AI can handle', value: `${role.aiPercent}%`, color: COLORS.ai },
            { label: 'Needs a human', value: `${role.humanPercent}%`, color: COLORS.human },
          ]}
        />
      </div>
    </Card>
  );
}

function SkillsPanel({ role }) {
  return (
    <Card className="animate-panel-in h-full">
      <SectionTitle>What this role needs</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {role.competencies.map((c) => (
          <span
            key={c.name}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold ${
              c.type === 'ai' ? 'bg-green/10 text-green' : 'bg-maroon/10 text-maroon'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: c.type === 'ai' ? COLORS.ai : COLORS.human }}
            />
            {c.name}
          </span>
        ))}
      </div>
      <div className="flex gap-5 mt-5 pt-4 border-t border-lightgrey/70">
        <Legend
          className="!flex-row !gap-5"
          items={[
            { label: 'AI-doable', color: COLORS.ai },
            { label: 'Human', color: COLORS.human },
          ]}
        />
      </div>
    </Card>
  );
}

function ImpactPanel({ role, onNavigate, onGoToJD }) {
  return (
    <Card className="animate-panel-in">
      <SectionTitle>If AI takes this on</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-green/[0.06] p-4">
          <p className="text-[11px] font-bold text-green uppercase tracking-wide mb-2">You gain</p>
          <ul className="space-y-1.5">
            {role.gains.map((g) => (
              <li key={g} className="text-xs text-charcoal/75 flex gap-1.5">
                <span className="text-green shrink-0">✓</span>
                {g}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-red/[0.05] p-4">
          <p className="text-[11px] font-bold text-red uppercase tracking-wide mb-2">You lose</p>
          <ul className="space-y-1.5">
            {role.losses.map((l) => (
              <li key={l} className="text-xs text-charcoal/75 flex gap-1.5">
                <span className="text-red shrink-0">✕</span>
                {l}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-offwhite p-4">
          <p className="text-[11px] font-bold text-charcoal/40 uppercase tracking-wide mb-1">Cost</p>
          <p className="text-xs text-charcoal/80 leading-relaxed">{role.cost}</p>
        </div>
        <div className="rounded-xl bg-offwhite p-4">
          <p className="text-[11px] font-bold text-charcoal/40 uppercase tracking-wide mb-1">Risk</p>
          <p className="text-xs text-charcoal/80 leading-relaxed">{role.risk}</p>
        </div>
      </div>
      <div className="bg-gold/10 border border-gold/40 rounded-xl px-4 py-3 mb-4">
        <p className="text-[11px] font-bold text-[#8a6f24] uppercase tracking-wide mb-1">
          Recommendation
        </p>
        <p className="text-sm text-charcoal/85">{role.recommendation}</p>
      </div>
      <button
        onClick={() => onGoToJD ? onGoToJD(role.id) : onNavigate('jobs')}
        className="w-full bg-white text-maroon border border-maroon rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 hover:bg-maroon/5"
      >
        See job descriptions →
      </button>
    </Card>
  );
}

export default function AnalyseScreen({ initialRoleId, onNavigate, onGoToJD, teamRoles = [] }) {
  const initialRole = useMemo(
    () => teamRoles.find((r) => r.id === initialRoleId) || teamRoles[0] || null,
    [initialRoleId, teamRoles],
  );
  const [role, setRole] = useState(initialRole);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    setRole(initialRole);
    setStage(0);
  }, [initialRole]);

  useEffect(() => {
    if (stage >= 3) return undefined;
    const timer = setTimeout(() => setStage((s) => s + 1), 700);
    return () => clearTimeout(timer);
  }, [stage]);

  if (!role) {
    return (
      <div className="max-w-[1240px]">
        <PageHeader title="Analyse a role" subtitle="Select a role from the Dashboard to analyse it" />
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <p className="text-sm font-bold text-charcoal">No role selected</p>
          <p className="text-xs text-charcoal/50 max-w-xs leading-relaxed">
            Add and analyse roles from the Dashboard — then click any role card to open its detailed analysis here.
          </p>
          <button
            onClick={() => onNavigate?.('home')}
            className="mt-2 bg-maroon text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-maroon-dark transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px]">
      <PageHeader title={role.name} subtitle="What AI can and can't do for this role" />

      <div className="mt-2 grid grid-cols-2 gap-5">
        <div>
          {stage >= 1 ? <SkillsPanel role={role} /> : <Card><PulsingDots /></Card>}
        </div>
        <div className="flex flex-col gap-5">
          {stage >= 2 ? <VerdictPanel role={role} /> : <Card><PulsingDots /></Card>}
          {stage >= 3 ? (
            <ImpactPanel role={role} onNavigate={onNavigate} onGoToJD={onGoToJD} />
          ) : stage >= 2 ? (
            <Card><PulsingDots /></Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
