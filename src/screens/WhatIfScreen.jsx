import { useCallback, useMemo, useState } from 'react';
import { Card, Gauge, PageHeader, SectionTitle } from '../components/ui';
import { SparkleIcon } from '../components/icons';
import { computeTeamMetrics } from '../data/teamData';
import { simulateWhatIf } from '../lib/api';
import PulsingDots from '../components/PulsingDots';

function RoleRow({ role, state, onToggleAI, onToggleRemove, simulating }) {
  const ai = role.aiPercent || 50;
  const isAI = state.replaceAI;
  const isRemoved = state.remove;

  return (
    <div className={`rounded-xl border px-4 py-3.5 transition-all duration-200 ${
      isAI ? 'border-green/40 bg-green/[0.04]' : isRemoved ? 'border-red/30 bg-red/[0.04]' : 'border-lightgrey bg-white'
    }`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-charcoal truncate">{role.name}</p>
          <p className="text-[11px] text-charcoal/45">{ai}% AI-doable · {role.verdict || 'AI + Human'}</p>
        </div>
        {simulating && (
          <div className="shrink-0"><PulsingDots /></div>
        )}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onToggleAI(!isAI)}
            className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200 ${
              isAI
                ? 'bg-green text-white shadow-sm'
                : 'bg-green/10 text-green hover:bg-green/20'
            }`}
          >
            <SparkleIcon width="11" height="11" />
            Replace with AI
          </button>
          <button
            onClick={() => onToggleRemove(!isRemoved)}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200 ${
              isRemoved
                ? 'bg-red text-white shadow-sm'
                : 'bg-red/10 text-red hover:bg-red/20'
            }`}
          >
            Remove role
          </button>
        </div>
      </div>
    </div>
  );
}

function ImpactPanel({ result, baseHealth, loading }) {
  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center py-12 gap-4">
        <PulsingDots />
        <p className="text-sm text-charcoal/50">AI is simulating the impact…</p>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-maroon/10 text-maroon flex items-center justify-center">
          <SparkleIcon width="20" height="20" />
        </div>
        <p className="text-sm font-bold text-charcoal">Toggle a role to simulate</p>
        <p className="text-xs text-charcoal/45 max-w-[220px] leading-relaxed">
          Choose to replace a role with AI or remove it — the AI will calculate the real impact.
        </p>
      </Card>
    );
  }

  const newHealth = Math.max(0, Math.min(100, baseHealth + (result.healthImpact || 0)));
  const delta = newHealth - baseHealth;
  const gaugeColor = delta > 0 ? '#0d9488' : delta < 0 ? '#dc2626' : '#f59e0b';
  const riskColor = { low: '#0d9488', medium: '#f59e0b', high: '#dc2626' }[result.riskLevel] || '#f59e0b';

  return (
    <div className="space-y-4">
      <Card className="flex flex-col items-center text-center">
        <SectionTitle className="self-start">Projected team health</SectionTitle>
        <Gauge value={newHealth} color={gaugeColor} size={150} thickness={18}>
          <span className="text-4xl font-extrabold text-charcoal leading-none">{newHealth}</span>
          {delta !== 0 && (
            <span className={`text-sm font-bold mt-1 ${delta > 0 ? 'text-green' : 'text-red'}`}>
              {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
            </span>
          )}
        </Gauge>
        {result.costImpact && (
          <p className="text-xs text-charcoal/60 leading-relaxed mt-3 max-w-xs">{result.costImpact}</p>
        )}
      </Card>

      {(result.skillsGained?.length > 0 || result.skillsLost?.length > 0) && (
        <Card>
          <SectionTitle>Skills impact</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {(result.skillsGained || []).map((skill) => (
              <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green/10 text-green">
                ✓ {skill}
              </span>
            ))}
            {(result.skillsLost || []).map((skill) => (
              <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red/10 text-red">
                ✕ {skill}
              </span>
            ))}
          </div>
        </Card>
      )}

      {result.recommendation && (
        <Card>
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-lg bg-maroon/10 text-maroon flex items-center justify-center shrink-0 mt-0.5">
              <SparkleIcon width="14" height="14" />
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-xs font-bold text-charcoal uppercase tracking-wide">AI recommendation</p>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${riskColor}18`, color: riskColor }}
                >
                  {result.riskLevel} risk
                </span>
              </div>
              <p className="text-sm text-charcoal/75 leading-relaxed">{result.recommendation}</p>
            </div>
          </div>
        </Card>
      )}

      {result.internalCandidates?.length > 0 && (
        <Card>
          <SectionTitle>Who could step in</SectionTitle>
          <div className="space-y-3">
            {result.internalCandidates.map((c, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-offwhite px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-maroon/15 flex items-center justify-center text-xs font-extrabold text-maroon shrink-0">
                  {c.name?.[0] || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-charcoal">{c.name}</p>
                  {c.gap && <p className="text-xs text-charcoal/55 leading-relaxed">Needs: {c.gap}</p>}
                </div>
                <span className="text-xs font-bold text-maroon shrink-0">{c.matchScore}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function WhatIfScreen({ teamRoles = [], mission, teamContext }) {
  const baseMetrics = useMemo(() => computeTeamMetrics(teamRoles), [teamRoles]);

  const initialState = useMemo(() => {
    const s = {};
    teamRoles.forEach((r) => { s[r.id] = { replaceAI: false, remove: false }; });
    return s;
  }, [teamRoles]);

  const [roleState, setRoleState] = useState(initialState);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simulatingId, setSimulatingId] = useState(null);

  const runSimulation = useCallback(async (newState) => {
    // Find all active changes
    const aiRoles = teamRoles.filter((r) => newState[r.id]?.replaceAI);
    const removedRoles = teamRoles.filter((r) => newState[r.id]?.remove);

    if (aiRoles.length === 0 && removedRoles.length === 0) {
      setSimulationResult(null);
      return;
    }

    setSimulating(true);
    try {
      let scenario, role;
      if (aiRoles.length > 0) {
        scenario = 'replace_with_ai';
        role = { title: aiRoles.map((r) => r.name).join(', '), aiPercent: aiRoles[0]?.aiPercent };
      } else {
        scenario = 'remove_role';
        role = { title: removedRoles.map((r) => r.name).join(', ') };
      }

      const result = await simulateWhatIf(
        scenario,
        role,
        teamContext,
        mission?.statement,
      );
      setSimulationResult(result);
    } catch {
      setSimulationResult(null);
    } finally {
      setSimulating(false);
      setSimulatingId(null);
    }
  }, [teamRoles, teamContext, mission]);

  function handleToggleAI(roleId, value) {
    const newState = {
      ...roleState,
      [roleId]: { replaceAI: value, remove: value ? false : roleState[roleId]?.remove },
    };
    setRoleState(newState);
    setSimulatingId(roleId);
    runSimulation(newState);
  }

  function handleToggleRemove(roleId, value) {
    const newState = {
      ...roleState,
      [roleId]: { remove: value, replaceAI: value ? false : roleState[roleId]?.replaceAI },
    };
    setRoleState(newState);
    setSimulatingId(roleId);
    runSimulation(newState);
  }

  function handleReset() {
    setRoleState(initialState);
    setSimulationResult(null);
    setSimulating(false);
  }

  if (teamRoles.length === 0) {
    return (
      <div className="max-w-[1240px]">
        <PageHeader title="Team Simulator" subtitle="Simulate team changes and see the AI-calculated impact" />
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-maroon/10 text-maroon flex items-center justify-center">
            <SparkleIcon width="24" height="24" />
          </div>
          <p className="text-sm font-bold text-charcoal">No roles to simulate</p>
          <p className="text-xs text-charcoal/50 max-w-xs leading-relaxed">
            Add roles from the Dashboard first, then come back here to simulate replacing them with AI or removing them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px]">
      <PageHeader
        title="Team Simulator"
        subtitle="Toggle roles below — AI calculates the real impact on your team"
        action={
          <button
            onClick={handleReset}
            className="text-xs font-bold text-charcoal/50 border border-lightgrey rounded-xl px-3.5 py-2.5 hover:bg-lightgrey/50 transition-colors duration-200"
          >
            Reset all
          </button>
        }
      />

      <div className="grid grid-cols-[1.1fr_0.9fr] gap-5 items-start">
        <div>
          <Card>
            <SectionTitle>Your current roles</SectionTitle>
            <div className="space-y-3">
              {teamRoles.map((role) => (
                <RoleRow
                  key={role.id}
                  role={role}
                  state={roleState[role.id] || { replaceAI: false, remove: false }}
                  onToggleAI={(v) => handleToggleAI(role.id, v)}
                  onToggleRemove={(v) => handleToggleRemove(role.id, v)}
                  simulating={simulating && simulatingId === role.id}
                />
              ))}
            </div>
          </Card>

          <div className="mt-4 rounded-xl bg-maroon/[0.04] border border-maroon/10 px-4 py-3">
            <p className="text-xs text-charcoal/60 leading-relaxed">
              <span className="font-bold text-maroon">How it works:</span> Each scenario is sent to an AI that has been trained on workforce transformation data. Results reflect typical outcomes for similar roles in innovation and airline teams.
            </p>
          </div>
        </div>

        <ImpactPanel
          result={simulationResult}
          baseHealth={baseMetrics.health}
          loading={simulating}
        />
      </div>
    </div>
  );
}
