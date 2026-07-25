import { useEffect, useRef, useState } from 'react';
import { Card, PageHeader } from '../components/ui';
import { SparkleIcon, TrendIcon } from '../components/icons';
import { generateFutureSkills } from '../lib/api';
import PulsingDots from '../components/PulsingDots';

const HORIZONS = [
  { id: 'soon', label: 'Soon', sub: '0–12 months', color: '#dc2626', bg: 'bg-red/10', border: 'border-red/20' },
  { id: 'nextYear', label: 'Next year', sub: '12–24 months', color: '#92620a', bg: 'bg-gold/15', border: 'border-gold/30' },
  { id: 'furtherAhead', label: 'Further ahead', sub: '2–3 years', color: '#4338ca', bg: 'bg-maroon/10', border: 'border-maroon/20' },
];

function SkillCard({ skill, color }) {
  return (
    <Card className="!p-5 !pt-0 overflow-hidden">
      <div className="h-1 -mx-5 mb-4" style={{ backgroundColor: color }} />
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${color}18` }}
        >
          <TrendIcon width="14" height="14" style={{ color }} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-charcoal mb-1.5">{skill.skill}</h3>
          <p className="text-xs text-charcoal/55 leading-relaxed">{skill.why}</p>
          {skill.urgency === 'high' && (
            <span className="inline-flex items-center mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red/10 text-red">
              High priority
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function deriveFromWorkflowData(workflowData) {
  const gap = workflowData?.gapAnalysis || {};
  const rec = workflowData?.recommendations || {};

  const soon = (gap.missingSkills || [])
    .filter((s) => s.severity === 'critical' || s.severity === 'important')
    .slice(0, 3)
    .map((s) => ({
      skill: s.skill,
      why: s.suggestedAction || `Needed by ${(s.neededBy || []).join(', ') || 'the team'} to close a critical capability gap.`,
      urgency: s.severity === 'critical' ? 'high' : 'medium',
    }));

  const reskillingSkills = (rec.reskilling || [])
    .flatMap((r) => (r.targetSkills || []).map((s) => ({
      skill: s,
      why: `${r.personName} needs to develop this skill — ${r.trainingApproach || 'via targeted training.'}`,
      urgency: 'medium',
    })));
  const hiringSkills = (rec.hiring || [])
    .flatMap((h) => (h.keySkillsNeeded || []).slice(0, 1).map((s) => ({
      skill: s,
      why: `Key requirement for the ${h.role} hire — ${h.reason || 'strategic business need.'}`,
      urgency: h.priority === 'urgent' ? 'high' : 'medium',
    })));
  const nextYear = [...reskillingSkills, ...hiringSkills].slice(0, 3);

  const lowSeveritySkills = (gap.missingSkills || [])
    .filter((s) => s.severity === 'low')
    .slice(0, 2)
    .map((s) => ({ skill: s.skill, why: s.suggestedAction || 'Emerging need as the team scales.', urgency: 'medium' }));
  const mobilitySkills = (rec.internalMobility || [])
    .slice(0, 1)
    .map((m) => ({
      skill: `Leadership in ${m.recommendedRole || 'new function'}`,
      why: `${m.personName} is being developed for ${m.recommendedRole} — build leadership depth ahead of time.`,
      urgency: 'medium',
    }));
  const furtherAhead = [...lowSeveritySkills, ...mobilitySkills].slice(0, 3);

  if (soon.length === 0 && nextYear.length === 0 && furtherAhead.length === 0) return null;
  return { soon, nextYear, furtherAhead };
}

export default function FutureSkillsScreen({ teamRoles = [], mission, workflowData }) {
  const [skills, setSkills] = useState(() => deriveFromWorkflowData(workflowData));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startedRef = useRef(false);
  useEffect(() => {
    const derived = deriveFromWorkflowData(workflowData);
    if (derived) { setSkills(derived); return; }
    if (teamRoles.length === 0 && !mission) return;
    if (startedRef.current) return; // StrictMode double-mount guard
    startedRef.current = true;
    setLoading(true);
    setError(null);
    generateFutureSkills(mission?.statement, teamRoles)
      .then((data) => setSkills(data))
      .catch(() => setError('Could not load AI forecast — please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const hasData = teamRoles.length > 0 || mission;

  return (
    <div className="max-w-[1240px]">
      <PageHeader
        title="Future Workforce Skills"
        subtitle="AI-forecasted skills your team will need — based on your actual roles and mission"
        action={
          hasData && !loading && (
            <button
              onClick={() => {
                setLoading(true);
                setSkills(null);
                setError(null);
                generateFutureSkills(mission?.statement, teamRoles)
                  .then(setSkills)
                  .catch(() => setError('Could not load AI forecast.'))
                  .finally(() => setLoading(false));
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-maroon border border-maroon/30 rounded-xl px-3.5 py-2 hover:bg-maroon/5 transition-colors duration-200"
            >
              <SparkleIcon width="13" height="13" />
              Refresh forecast
            </button>
          )
        }
      />

      {!hasData && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-maroon/10 text-maroon flex items-center justify-center">
            <TrendIcon width="24" height="24" />
          </div>
          <p className="text-sm font-bold text-charcoal">No team context yet</p>
          <p className="text-xs text-charcoal/50 max-w-xs leading-relaxed">
            Set up your mission and add roles first — the AI will then forecast the skills your team needs over the next 2–3 years.
          </p>
        </div>
      )}

      {hasData && loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <PulsingDots />
          <p className="text-sm text-charcoal/50">AI is forecasting your team's future skill needs…</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red/[0.05] border border-red/20 px-5 py-4 text-sm text-red mb-6">
          {error}
        </div>
      )}

      {skills && (
        <div className="grid grid-cols-3 gap-5 items-start">
          {HORIZONS.map((horizon) => {
            const horizonSkills = skills[horizon.id] || [];
            return (
              <div key={horizon.id}>
                <div className={`flex items-center gap-3 mb-4 rounded-xl border px-4 py-3 ${horizon.bg} ${horizon.border}`}>
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/60"
                    style={{ color: horizon.color }}
                  >
                    <TrendIcon width="15" height="15" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-charcoal">{horizon.label}</p>
                    <p className="text-[11px] text-charcoal/45">{horizon.sub} · {horizonSkills.length} skill{horizonSkills.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {horizonSkills.length === 0 && (
                    <p className="text-xs text-charcoal/40 px-1">No skills forecast for this timeframe.</p>
                  )}
                  {horizonSkills.map((skill, i) => (
                    <SkillCard key={i} skill={skill} color={horizon.color} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
