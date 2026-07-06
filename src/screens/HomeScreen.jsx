import { useState } from 'react';
import { Card, Footer, IconBadge, PageHeader, PrimaryButton, SecondaryButton, VerdictPill } from '../components/ui';
import { AlertIcon, ArrowRightIcon, HomeIcon, UploadIcon } from '../components/icons';
import { roles, teamMetrics, observations, skillGapDetails, overlaps } from '../data/teamData';

function RoleCard({ role, onOpen }) {
  return (
    <button
      onClick={() => onOpen(role.id)}
      className="text-left bg-white rounded-2xl p-6 shadow-[0_1px_2px_rgba(18,19,26,0.04),0_8px_24px_rgba(18,19,26,0.06)] border border-black/[0.03] transition-all duration-200 hover:shadow-[0_8px_20px_rgba(18,19,26,0.1)] hover:-translate-y-0.5 shrink-0 w-[240px]"
    >
      <h3 className="font-bold text-charcoal text-[15px] leading-snug mb-4 min-h-[40px]">
        {role.name}
      </h3>
      <div className="flex items-center justify-between text-[11px] text-charcoal/50 mb-1.5">
        <span>AI {role.aiPercent}%</span>
        <span>Human {role.humanPercent}%</span>
      </div>
      <div className="h-2 rounded-full bg-lightgrey overflow-hidden flex mb-4">
        <div className="h-full bg-green" style={{ width: `${role.aiPercent}%` }} />
        <div className="h-full bg-maroon" style={{ width: `${role.humanPercent}%` }} />
      </div>
      <VerdictPill verdict={role.verdict} />
    </button>
  );
}

function MetricCard({ icon, tone, value, label, subLabel, onClick }) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <IconBadge icon={icon} tone={tone} className="mb-4" />
        {onClick && (
          <span className="text-[11px] font-semibold text-maroon/70">View details →</span>
        )}
      </div>
      <div className="text-4xl font-extrabold text-charcoal leading-none mb-2">{value}</div>
      <p className="text-sm text-charcoal/60 mb-3">{label}</p>
      <p className="text-xs font-semibold text-charcoal/35 uppercase tracking-wide">{subLabel}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex-1 min-w-[180px] text-left bg-white rounded-2xl p-6 shadow-[0_1px_2px_rgba(18,19,26,0.04),0_8px_24px_rgba(18,19,26,0.06)] border border-black/[0.03] transition-all duration-200 hover:shadow-[0_8px_20px_rgba(18,19,26,0.1)] hover:-translate-y-0.5"
      >
        {content}
      </button>
    );
  }

  return <Card className="flex-1 min-w-[180px]">{content}</Card>;
}

const borderColor = {
  'border-red': '#dc2626',
  'border-gold': '#f59e0b',
  'border-maroon': '#4338ca',
};

function ObservationCard({ observation }) {
  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-[0_1px_2px_rgba(18,19,26,0.04),0_8px_24px_rgba(18,19,26,0.06)] border border-black/[0.03] border-l-4 flex-1 min-w-[240px]"
      style={{ borderLeftColor: borderColor[observation.border] }}
    >
      <AlertIcon style={{ color: borderColor[observation.border] }} className="mb-3" />
      <p className="text-sm text-charcoal/80 leading-relaxed">{observation.text}</p>
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h2 className="text-lg font-bold text-charcoal">{title}</h2>
          <button
            onClick={onClose}
            className="text-charcoal/40 hover:text-charcoal/70 text-sm font-semibold shrink-0"
          >
            Close
          </button>
        </div>
        {subtitle && <p className="text-xs text-charcoal/50 mb-5">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

function GapsModal({ onClose }) {
  return (
    <ModalShell
      title="Skills nobody has yet"
      subtitle="These skills don't exist anywhere on your team right now."
      onClose={onClose}
    >
      <div className="space-y-4">
        {skillGapDetails.map((gap) => (
          <div key={gap.skill} className="rounded-xl bg-offwhite p-4">
            <p className="text-sm font-bold text-charcoal mb-1">{gap.skill}</p>
            <p className="text-xs text-charcoal/60 leading-relaxed">{gap.reason}</p>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function OverlapsModal({ onClose }) {
  return (
    <ModalShell
      title="Roles that look too similar"
      subtitle="These role pairs share enough skills that it's worth reviewing them before your next hire."
      onClose={onClose}
    >
      <div className="space-y-4">
        {overlaps.map((overlap) => (
          <div key={overlap.roleA} className="rounded-xl bg-offwhite p-4">
            <p className="text-sm font-bold text-charcoal mb-2">
              {overlap.roleA} <span className="text-charcoal/40 font-normal">&</span>{' '}
              {overlap.roleB}
            </p>
            <div className="h-2 rounded-full bg-lightgrey overflow-hidden mb-1.5">
              <div className="h-full bg-maroon" style={{ width: `${overlap.percent}%` }} />
            </div>
            <p className="text-xs font-semibold text-charcoal/50 mb-2">
              {overlap.percent}% of the same skills
            </p>
            <p className="text-xs text-charcoal/60 mb-2">
              Shared skills: {overlap.shared.join(', ')}
            </p>
            <p className="text-xs text-maroon font-medium">{overlap.note}</p>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function ImportTeamModal({ onClose, onConfirm }) {
  const [roleInput, setRoleInput] = useState('');
  const [addedRoles, setAddedRoles] = useState([]);

  const suggestions = roles.map((r) => r.name).filter((name) => !addedRoles.includes(name));

  function addRole(name) {
    const trimmed = name.trim();
    if (!trimmed || addedRoles.includes(trimmed)) return;
    setAddedRoles((prev) => [...prev, trimmed]);
    setRoleInput('');
  }

  function removeRole(name) {
    setAddedRoles((prev) => prev.filter((r) => r !== name));
  }

  return (
    <ModalShell
      title="Add roles to your team"
      subtitle="Add roles one at a time — we'll analyse each one automatically. No need to write a full description."
      onClose={onClose}
    >
      <div className="flex gap-2">
        <input
          value={roleInput}
          onChange={(e) => setRoleInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addRole(roleInput);
            }
          }}
          placeholder="Type a role name, e.g. 'Innovation Project Manager'"
          className="flex-1 bg-white border border-lightgrey rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:border-maroon"
        />
        <SecondaryButton onClick={() => addRole(roleInput)} className="shrink-0 !px-4 !py-3">
          Add
        </SecondaryButton>
      </div>

      {addedRoles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {addedRoles.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-2 bg-maroon/10 text-maroon rounded-full pl-3 pr-2 py-1.5 text-xs font-semibold"
            >
              {name}
              <button
                onClick={() => removeRole(name)}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-maroon/20"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-semibold text-charcoal/40 uppercase tracking-wide mb-2">
            Or add a role already on your team
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((name) => (
              <button
                key={name}
                onClick={() => addRole(name)}
                className="text-xs font-medium text-charcoal/60 bg-offwhite border border-lightgrey rounded-full px-3 py-1.5 hover:bg-lightgrey/60 transition-colors duration-200"
              >
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={onConfirm} disabled={addedRoles.length === 0}>
          Build my team
        </PrimaryButton>
      </div>
    </ModalShell>
  );
}

export default function HomeScreen({ onOpenRole, onNavigate }) {
  const [input, setInput] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [openDetail, setOpenDetail] = useState(null);

  function handleAnalyse() {
    if (!input.trim()) return;
    onOpenRole('dia');
  }

  function handleBuildTeam() {
    setShowImportModal(false);
  }

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        icon={<HomeIcon />}
        eyebrow="Workforce Intelligence"
        title="Your Innovation Team has been analysed"
        subtitle="Required roles, current skills, gaps, and where AI can help — all in one place."
      />

      <Card>
        <label className="block text-sm font-semibold text-charcoal/70 mb-2">
          Add a new role or team
        </label>
        <div className="flex gap-3 items-start">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 'Digital Innovation Analyst' or describe what the role does"
            className="flex-1 bg-offwhite border border-transparent rounded-xl px-4 py-3.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-maroon/30"
          />
          <PrimaryButton onClick={handleAnalyse} className="shrink-0">
            Analyse
            <ArrowRightIcon />
          </PrimaryButton>
        </div>
        <p className="text-xs text-charcoal/40 mt-2">
          We will figure out the skills and tell you everything from there.
        </p>
      </Card>

      <div className="mt-10 flex items-end justify-between gap-6 mb-4">
        <div>
          <h2 className="text-lg font-bold text-charcoal">Your Team's Roles</h2>
          <p className="text-xs text-charcoal/45 mt-1">
            Each role has been analysed — click any card to see the full breakdown
          </p>
        </div>
        <SecondaryButton onClick={() => setShowImportModal(true)} className="shrink-0">
          <UploadIcon />
          Import your team
        </SecondaryButton>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-2">
        {roles.map((role) => (
          <RoleCard key={role.id} role={role} onOpen={onOpenRole} />
        ))}
      </div>

      {showImportModal && (
        <ImportTeamModal
          onClose={() => setShowImportModal(false)}
          onConfirm={handleBuildTeam}
        />
      )}
      {openDetail === 'gaps' && <GapsModal onClose={() => setOpenDetail(null)} />}
      {openDetail === 'overlaps' && <OverlapsModal onClose={() => setOpenDetail(null)} />}

      <section className="mt-12">
        <h2 className="text-lg font-bold text-charcoal mb-4">Your team at a glance</h2>
        <div className="flex gap-5 flex-wrap">
          <MetricCard
            icon="71"
            tone="gold"
            value={teamMetrics.health}
            label="out of 100"
            subLabel="Team Health"
          />
          <MetricCard
            icon="%"
            tone="green"
            value={`${teamMetrics.skillBalance}%`}
            label="AI-doable across the team"
            subLabel="Skill Balance"
          />
          <MetricCard
            icon="!"
            tone="red"
            value={teamMetrics.gaps}
            label="skills nobody has yet"
            subLabel="Gaps"
            onClick={() => setOpenDetail('gaps')}
          />
          <MetricCard
            icon="≈"
            tone="brand"
            value={teamMetrics.overlaps}
            label="roles that look too similar"
            subLabel="Overlaps"
            onClick={() => setOpenDetail('overlaps')}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-bold text-charcoal mb-4">What to do next</h2>
        <div className="bg-gradient-to-r from-gold/10 to-transparent rounded-2xl p-6 border border-gold/30 flex items-center justify-between gap-6 flex-wrap">
          <p className="text-sm text-charcoal/80 leading-relaxed max-w-2xl">
            Your team picture is complete. Head to the Team Simulator to explore how your team
            changes if you swap any role for an AI agent.
          </p>
          <PrimaryButton onClick={() => onNavigate('whatif')} className="shrink-0">
            Go to Team Simulator
            <ArrowRightIcon />
          </PrimaryButton>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-bold text-charcoal mb-4">What we noticed about your team</h2>
        <div className="flex gap-5 flex-wrap">
          {observations.map((obs, i) => (
            <ObservationCard key={i} observation={obs} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
