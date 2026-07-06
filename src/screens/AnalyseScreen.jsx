import { useEffect, useMemo, useState } from 'react';
import { Card, Footer, PageHeader, Pill, PrimaryButton } from '../components/ui';
import { SparkleIcon } from '../components/icons';
import PulsingDots from '../components/PulsingDots';
import { roles, roleById } from '../data/teamData';

function findRole(text) {
  const q = text.trim().toLowerCase();
  if (!q) return roleById('dia');
  const match = roles.find((r) => r.name.toLowerCase().includes(q) || q.includes(r.name.toLowerCase()));
  return match || roleById('dia');
}

function PanelA({ role }) {
  return (
    <Card className="animate-panel-in h-full">
      <h2 className="text-lg font-bold text-charcoal">What this role needs</h2>
      <p className="text-xs text-charcoal/45 mt-1 mb-4">
        Generated fresh — not copied from any existing document
      </p>
      <div className="rounded-lg overflow-hidden border border-lightgrey/70">
        {role.competencies.map((c, i) => (
          <div
            key={c.name}
            className={`flex items-center justify-between px-4 py-3 ${
              i % 2 === 1 ? 'bg-offwhite' : 'bg-white'
            }`}
          >
            <span className="text-sm text-charcoal/85">{c.name}</span>
            <Pill tone={c.type === 'ai' ? 'ai' : 'human'}>{c.type === 'ai' ? 'AI' : 'Human'}</Pill>
          </div>
        ))}
      </div>
      <p className="text-xs text-charcoal/40 mt-4 leading-relaxed">
        These skills use CIPD professional HR standards — the same language your HR team uses
      </p>
    </Card>
  );
}

function PanelB({ role }) {
  return (
    <Card className="animate-panel-in">
      <h2 className="text-lg font-bold text-charcoal">Our take on this role</h2>
      <p className="text-2xl font-extrabold text-maroon mt-3 mb-2">{role.verdict} Role</p>
      <p className="text-sm text-charcoal/70 leading-relaxed mb-5">
        About half of what this role does could be handled by an AI agent. The other half
        genuinely needs a person.
      </p>
      <div className="h-3 rounded-full overflow-hidden flex">
        <div className="h-full bg-green" style={{ width: `${role.aiPercent}%` }} />
        <div className="h-full bg-maroon" style={{ width: `${role.humanPercent}%` }} />
      </div>
      <div className="flex justify-between text-xs font-semibold text-charcoal/50 mt-2">
        <span>{role.aiPercent}% AI</span>
        <span>{role.humanPercent}% Human</span>
      </div>
    </Card>
  );
}

function PanelC({ role, onNavigate }) {
  return (
    <Card className="animate-panel-in">
      <h2 className="text-lg font-bold text-charcoal mb-4">
        What replacing this with AI would look like
      </h2>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-charcoal/40 uppercase tracking-wide mb-1">Cost</p>
          <p className="text-sm text-charcoal/80">{role.cost}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-charcoal/40 uppercase tracking-wide mb-1">Risk</p>
          <p className="text-sm text-charcoal/80">{role.risk}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-charcoal/40 uppercase tracking-wide mb-1.5">
              What you gain
            </p>
            <ul className="space-y-1">
              {role.gains.map((g) => (
                <li key={g} className="text-xs text-charcoal/75 flex gap-1.5">
                  <span className="text-green shrink-0">✓</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-charcoal/40 uppercase tracking-wide mb-1.5">
              What you lose
            </p>
            <ul className="space-y-1">
              {role.losses.map((l) => (
                <li key={l} className="text-xs text-charcoal/75 flex gap-1.5">
                  <span className="text-red shrink-0">✕</span>
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bg-gold/10 border border-gold/40 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-[#8a6f24] uppercase tracking-wide mb-1">
            Our recommendation
          </p>
          <p className="text-sm text-charcoal/85">{role.recommendation}</p>
        </div>
        <button
          onClick={() => onNavigate('jobs')}
          className="w-full bg-white text-maroon border border-maroon rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 hover:bg-maroon/5"
        >
          See Job Descriptions for this role
        </button>
      </div>
    </Card>
  );
}

export default function AnalyseScreen({ initialRoleId, onNavigate }) {
  const initialRole = useMemo(() => roleById(initialRoleId) || roleById('dia'), [initialRoleId]);
  const [input, setInput] = useState(initialRole.name);
  const [role, setRole] = useState(initialRole);
  const [stage, setStage] = useState(3); // 0=loading A,1=A done loading B,2=B done loading C,3=all done

  useEffect(() => {
    setInput(initialRole.name);
    setRole(initialRole);
    setStage(3);
  }, [initialRole]);

  useEffect(() => {
    if (stage >= 3) return undefined;
    const timer = setTimeout(() => setStage((s) => s + 1), 700);
    return () => clearTimeout(timer);
  }, [stage]);

  function handleAnalyse() {
    const found = findRole(input);
    setRole(found);
    setStage(0);
  }

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        icon={<SparkleIcon />}
        eyebrow="AI Impact Analysis"
        title="See what AI can and can't do for a role"
        subtitle="Type any role, or a few words about what it does, and we will break down which parts an AI agent could handle and which genuinely need a person."
      />

      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Digital Innovation Analyst"
          className="flex-1 bg-white border border-lightgrey rounded-xl px-4 py-3.5 text-sm text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:border-maroon shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        />
        <PrimaryButton onClick={handleAnalyse} className="shrink-0">
          Analyse
        </PrimaryButton>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6">
        <div>
          {stage >= 1 ? <PanelA role={role} /> : <Card><PulsingDots /></Card>}
        </div>
        <div className="flex flex-col gap-6">
          {stage >= 2 ? <PanelB role={role} /> : <Card><PulsingDots /></Card>}
          {stage >= 3 ? (
            <PanelC role={role} onNavigate={onNavigate} />
          ) : stage >= 2 ? (
            <Card><PulsingDots /></Card>
          ) : null}
        </div>
      </div>

      <Footer />
    </div>
  );
}
