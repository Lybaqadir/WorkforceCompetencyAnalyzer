import { useMemo, useState } from 'react';
import { Card, Footer, PageHeader, SecondaryButton, Toggle } from '../components/ui';
import { SlidersIcon } from '../components/icons';
import {
  roles,
  teamMetrics,
  whatIfDefault,
  whatIfImpact,
  removedRoleImpact,
} from '../data/teamData';

function buildInitialState() {
  const state = {};
  roles.forEach((r) => {
    state[r.id] = whatIfDefault[r.id]
      ? { ...whatIfDefault[r.id] }
      : { replaceAI: false, remove: false };
  });
  return state;
}

function computeImpact(state) {
  const lost = new Set();
  const gained = new Set();
  let scoreDelta = 0;
  const activeNotes = [];
  let activeCount = 0;

  roles.forEach((role) => {
    const s = state[role.id];
    if (s.remove) {
      (removedRoleImpact[role.id] || []).forEach((skill) => lost.add(skill));
      scoreDelta -= 9;
      activeCount += 1;
      activeNotes.push(
        `Removing ${role.name} entirely takes real coverage out of the team with nothing replacing it`
      );
    } else if (s.replaceAI) {
      const impact = whatIfImpact[role.id];
      if (impact) {
        impact.lost.forEach((skill) => lost.add(skill));
        impact.gainedByAI.forEach((skill) => gained.add(skill));
        scoreDelta += impact.newScore - teamMetrics.health;
        activeNotes.push(impact.note);
      }
      activeCount += 1;
    }
  });

  const newScore = Math.max(0, Math.min(100, teamMetrics.health + scoreDelta));
  let note = '';
  if (activeCount === 1) {
    note = activeNotes[0];
  } else if (activeCount > 1) {
    note = 'Combining several changes at once shifts both the gains and the risks — review each carefully.';
  }

  return { lost: Array.from(lost), gained: Array.from(gained), newScore, note, activeCount };
}

export default function WhatIfScreen() {
  const [state, setState] = useState(buildInitialState);

  const impact = useMemo(() => computeImpact(state), [state]);
  const scoreDiff = impact.newScore - teamMetrics.health;

  function setRoleState(id, patch) {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function toggleReplace(id, value) {
    setRoleState(id, { replaceAI: value, remove: value ? false : state[id].remove });
  }

  function toggleRemove(id, value) {
    setRoleState(id, { remove: value, replaceAI: value ? false : state[id].replaceAI });
  }

  function handleReset() {
    const cleared = {};
    roles.forEach((r) => {
      cleared[r.id] = { replaceAI: false, remove: false };
    });
    setState(cleared);
  }

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        icon={<SlidersIcon />}
        eyebrow="Team Simulator"
        title="See what happens if you change your team"
        subtitle="Swap any role for an AI agent or remove it entirely — see the impact on skills and team health instantly, before you make the call."
      />

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm font-bold text-charcoal/70 uppercase tracking-wide mb-4">
            Your current team
          </h2>
          <Card>
            {roles.map((role, i) => (
              <div
                key={role.id}
                className={`flex items-center justify-between gap-6 py-4 ${
                  i !== roles.length - 1 ? 'border-b border-lightgrey/70' : ''
                }`}
              >
                <span className="text-sm font-bold text-charcoal flex-1">{role.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-charcoal/50 whitespace-nowrap">Replace with AI agent</span>
                  <Toggle
                    checked={state[role.id].replaceAI}
                    onChange={(v) => toggleReplace(role.id, v)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-charcoal/50 whitespace-nowrap">Remove this role</span>
                  <Toggle
                    checked={state[role.id].remove}
                    onChange={(v) => toggleRemove(role.id, v)}
                  />
                </div>
              </div>
            ))}
          </Card>
          <div className="mt-5">
            <SecondaryButton onClick={handleReset}>Reset to original team</SecondaryButton>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-charcoal/70 uppercase tracking-wide mb-4">
            What changes
          </h2>
          <div className="space-y-5">
            <Card>
              <h3 className="text-sm font-bold text-charcoal mb-3">Skills your team would lose</h3>
              {impact.lost.length === 0 ? (
                <p className="text-sm text-charcoal/45">
                  No changes yet — toggle a role on the left to see impact
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {impact.lost.map((skill) => (
                    <li key={skill} className="text-sm text-charcoal/75 flex gap-1.5">
                      <span className="text-red shrink-0">✕</span>
                      {skill}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {impact.gained.length > 0 && (
              <Card>
                <h3 className="text-sm font-bold text-charcoal mb-3">Skills now handled by AI</h3>
                <ul className="space-y-1.5">
                  {impact.gained.map((skill) => (
                    <li key={skill} className="text-sm text-charcoal/75 flex gap-1.5">
                      <span className="text-green shrink-0">✓</span>
                      {skill}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card>
              <h3 className="text-sm font-bold text-charcoal mb-3">New team health score</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-gold">{impact.newScore}</span>
                <span className="text-sm text-charcoal/50">out of 100</span>
                {scoreDiff !== 0 && (
                  <span
                    className={`text-lg font-bold ${scoreDiff > 0 ? 'text-green' : 'text-red'}`}
                  >
                    {scoreDiff > 0 ? '↑' : '↓'}
                  </span>
                )}
              </div>
              {impact.note && (
                <p className="text-sm text-charcoal/65 leading-relaxed mt-3">{impact.note}</p>
              )}
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
