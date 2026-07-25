import { useState } from 'react';
import { Avatar, BarMeter, Card, Donut, Gauge, Legend, PageHeader, SectionTitle } from '../components/ui';
import { AlertIcon, SparkleIcon } from '../components/icons';
import { computeTeamMetrics, computeOverlaps, computeSkillCoverage, computeWorkloadStatus } from '../data/teamData';

const STATUS_COLOR = { green: '#0d9488', gold: '#f59e0b', red: '#dc2626' };
const COVERAGE_META = [
  { key: 'covered', label: 'Covered by 2+ roles', color: '#0d9488' },
  { key: 'watch', label: 'Single point of failure', color: '#f59e0b' },
  { key: 'missing', label: 'Nobody covers it', color: '#dc2626' },
];

function EmptyState({ onNavigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-maroon/10 text-maroon flex items-center justify-center text-2xl">👥</div>
      <p className="text-sm font-bold text-charcoal">No roles analysed yet</p>
      <p className="text-xs text-charcoal/50 max-w-xs leading-relaxed">
        Complete the workflow to see your team health, skill coverage, and workforce intelligence.
      </p>
      <button
        onClick={() => onNavigate('home')}
        className="mt-2 bg-maroon text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-maroon-dark transition-colors duration-200"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

function MemberCapabilityCard({ role, workflowData }) {
  const [expanded, setExpanded] = useState(false);
  const teamMembers = workflowData?.teamMembers || [];
  const member = teamMembers.find((m) => m.name === role.name || m.id === role.id);
  const allSkills = [
    ...(member?.skills || []),
    ...(member?.technicalSkills || []),
    ...(member?.softSkills || []),
    ...(role.competencies || []).map((c) => c.name),
  ].filter(Boolean);
  const uniqueSkills = [...new Set(allSkills)];
  const aiSkills = (role.competencies || []).filter((c) => c.type === 'ai').map((c) => c.name);
  const humanSkills = (role.competencies || []).filter((c) => c.type === 'human').map((c) => c.name);

  return (
    <button
      onClick={() => setExpanded((e) => !e)}
      className="w-full text-left rounded-2xl border border-black/[0.03] bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <div className="p-4 flex items-center gap-3">
        <Avatar name={role.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-charcoal truncate">{role.name}</p>
          <p className="text-[11px] text-charcoal/45 truncate">{role._currentRole || 'Team member'}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-bold text-charcoal">{role.aiPercent}% AI-doable</p>
          <p className="text-[10px] text-charcoal/40">{uniqueSkills.length} skills</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-offwhite flex items-center justify-center shrink-0 ml-1">
          <span className="text-[10px] text-charcoal/40 font-bold">{expanded ? '↑' : '↓'}</span>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-lightgrey/60 pt-3 space-y-3">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="h-2 rounded-full bg-lightgrey overflow-hidden mb-1">
                <div className="h-full bg-green rounded-full" style={{ width: `${role.aiPercent}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-charcoal/40">AI-doable</span>
                <span className="text-[10px] font-bold text-green">{role.aiPercent}%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-lightgrey overflow-hidden mb-1">
                <div className="h-full bg-maroon rounded-full" style={{ width: `${role.humanPercent}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-charcoal/40">Human-only</span>
                <span className="text-[10px] font-bold text-maroon">{role.humanPercent}%</span>
              </div>
            </div>
          </div>

          {aiSkills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-green/70 uppercase tracking-wide mb-1.5">AI capabilities</p>
              <div className="flex flex-wrap gap-1">
                {aiSkills.map((s) => (
                  <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green/10 text-green">{s}</span>
                ))}
              </div>
            </div>
          )}
          {humanSkills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-maroon/70 uppercase tracking-wide mb-1.5">Human capabilities</p>
              <div className="flex flex-wrap gap-1">
                {humanSkills.map((s) => (
                  <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-maroon/10 text-maroon">{s}</span>
                ))}
              </div>
            </div>
          )}
          {aiSkills.length === 0 && humanSkills.length === 0 && uniqueSkills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wide mb-1.5">Skills</p>
              <div className="flex flex-wrap gap-1">
                {uniqueSkills.slice(0, 8).map((s) => (
                  <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-offwhite text-charcoal/60">{s}</span>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-charcoal/60 leading-relaxed">{role.recommendation}</p>
        </div>
      )}
    </button>
  );
}

function SkillsHeatmap({ teamRoles }) {
  // Build a skill × person matrix
  const allSkills = [...new Set(
    teamRoles.flatMap((r) => (r.competencies || []).map((c) => c.name))
  )].slice(0, 12);

  if (allSkills.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr>
            <th className="text-left font-semibold text-charcoal/40 pr-3 pb-2 whitespace-nowrap">Skill</th>
            {teamRoles.map((r) => (
              <th key={r.id} className="px-2 pb-2 font-semibold text-charcoal/50 whitespace-nowrap max-w-[60px] truncate">
                {r.name.split(' ')[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allSkills.map((skill) => (
            <tr key={skill} className="border-t border-lightgrey/40">
              <td className="py-1.5 pr-3 font-semibold text-charcoal/60 whitespace-nowrap">{skill}</td>
              {teamRoles.map((r) => {
                const has = (r.competencies || []).some((c) => c.name === skill);
                const isAI = has && (r.competencies || []).find((c) => c.name === skill)?.type === 'ai';
                return (
                  <td key={r.id} className="px-2 py-1.5 text-center">
                    {has ? (
                      <span
                        className={`inline-block w-4 h-4 rounded ${isAI ? 'bg-green/70' : 'bg-maroon/60'}`}
                        title={isAI ? 'AI capability' : 'Human capability'}
                      />
                    ) : (
                      <span className="inline-block w-4 h-4 rounded bg-lightgrey/50" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green/70 shrink-0" /><span className="text-[10px] text-charcoal/50">AI capability</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-maroon/60 shrink-0" /><span className="text-[10px] text-charcoal/50">Human capability</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-lightgrey/50 shrink-0" /><span className="text-[10px] text-charcoal/50">Not covered</span></div>
      </div>
    </div>
  );
}

function WorkflowInsightCard({ title, value, sub, color, bg }) {
  return (
    <div className={`rounded-2xl ${bg} p-4`}>
      <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wide mb-1">{title}</p>
      <p className={`text-2xl font-extrabold ${color} leading-none mb-0.5`}>{value}</p>
      {sub && <p className="text-xs text-charcoal/50">{sub}</p>}
    </div>
  );
}

export default function TeamScreen({ teamRoles = [], mission, workflowData, onNavigate }) {
  const [detailRole, setDetailRole] = useState(null);

  if (teamRoles.length === 0) {
    return (
      <div className="max-w-[1240px]">
        <PageHeader title="Team & Skills" subtitle="Workforce intelligence dashboard" />
        <EmptyState onNavigate={onNavigate || (() => {})} />
      </div>
    );
  }

  const metrics = computeTeamMetrics(teamRoles);
  const overlaps = computeOverlaps(teamRoles);
  const skillCoverage = computeSkillCoverage(teamRoles);
  const workload = computeWorkloadStatus(teamRoles);

  const coverageCounts = COVERAGE_META.map((m) => ({
    ...m,
    items: skillCoverage[m.key] || [],
    count: (skillCoverage[m.key] || []).length,
  }));

  const healthFactors = [
    { label: 'AI/Human Balance', score: Math.round(100 - Math.abs(50 - metrics.skillBalance) * 1.5), note: `${metrics.skillBalance}% AI-doable across the team` },
    { label: 'Skill Coverage', score: Math.max(0, 100 - metrics.gaps * 14), note: `${metrics.gaps} critical skill${metrics.gaps === 1 ? '' : 's'} missing` },
    { label: 'Role Clarity', score: Math.max(0, 100 - metrics.overlaps * 12), note: `${metrics.overlaps} role pair${metrics.overlaps === 1 ? '' : 's'} with high overlap` },
  ];

  // Pull in workflow data for richer context
  const skillsAnalysis = workflowData?.skillsAnalysis;
  const gapAnalysis = workflowData?.gapAnalysis;
  const teamMapping = workflowData?.teamMapping;

  const coveredCount = skillsAnalysis?.competencies?.filter((c) => c.status === 'covered').length ?? coverageCounts[0].count;
  const missingCount = skillsAnalysis?.competencies?.filter((c) => c.status === 'missing').length ?? metrics.gaps;
  const matchedCount = teamMapping?.matched?.length ?? 0;
  const vacantCount = teamMapping?.vacant?.length ?? 0;
  const aiAvg = Math.round(teamRoles.reduce((s, r) => s + (r.aiPercent || 0), 0) / teamRoles.length);

  return (
    <div className="max-w-[1240px]">
      <PageHeader
        title="Team & Skills"
        subtitle={mission ? `${mission.teamName} · Workforce intelligence dashboard` : `${teamRoles.length} roles · Workforce intelligence`}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <WorkflowInsightCard title="Team health" value={metrics.health} sub="out of 100" color="text-gold" bg="bg-gold/10" />
        <WorkflowInsightCard title="AI-doable avg" value={`${aiAvg}%`} sub="across all roles" color="text-green" bg="bg-green/[0.08]" />
        <WorkflowInsightCard title="Skills covered" value={coveredCount} sub={`${missingCount} still missing`} color="text-maroon" bg="bg-maroon/[0.06]" />
        <WorkflowInsightCard title="Roles mapped" value={matchedCount} sub={`${vacantCount} vacant`} color="text-charcoal" bg="bg-offwhite border border-lightgrey" />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Team health */}
        <Card>
          <SectionTitle>Team health</SectionTitle>
          <div className="flex items-center gap-7">
            <Gauge value={metrics.health} color="#f59e0b" size={140} thickness={16}>
              <span className="text-3xl font-extrabold text-charcoal leading-none">{metrics.health}</span>
              <span className="text-[10px] text-charcoal/45 mt-0.5">/ 100</span>
            </Gauge>
            <div className="flex-1 space-y-4">
              {healthFactors.map((f) => (
                <div key={f.label}>
                  <BarMeter label={f.label} value={f.score} color="#f59e0b" right={`${f.score}`} />
                  <p className="text-[10px] text-charcoal/40 mt-1">{f.note}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Skill coverage donut */}
        <Card>
          <SectionTitle>Skill coverage</SectionTitle>
          <div className="flex items-center gap-6 mb-5">
            <Donut
              size={110}
              thickness={16}
              segments={coverageCounts.map((c) => ({ value: Math.max(c.count, 0.1), color: c.color }))}
            >
              <span className="text-xl font-extrabold text-charcoal leading-none">
                {coverageCounts.reduce((s, c) => s + c.count, 0)}
              </span>
              <span className="text-[10px] text-charcoal/45">skills</span>
            </Donut>
            <Legend className="flex-1" items={coverageCounts.map((c) => ({ label: c.label, value: c.count, color: c.color }))} />
          </div>
          <div className="flex flex-wrap gap-2">
            {coverageCounts.flatMap((group) =>
              group.items.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 bg-offwhite rounded-full px-3 py-1.5 text-xs font-semibold text-charcoal/75">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                  {item}
                </span>
              ))
            )}
            {coverageCounts.every((g) => g.items.length === 0) && (
              <p className="text-xs text-charcoal/45">Skills will appear once roles are AI-analysed.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Skills heat map */}
      <Card className="mb-5">
        <SectionTitle>Skills heat map</SectionTitle>
        <p className="text-xs text-charcoal/50 mb-4">
          Which skills each team member covers — green = AI capability, purple = human capability.
        </p>
        <SkillsHeatmap teamRoles={teamRoles} />
      </Card>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Workload & automation */}
        <Card>
          <SectionTitle>Workload & automation potential</SectionTitle>
          <div className="space-y-4">
            {workload.map((item) => (
              <div
                key={item.role}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setDetailRole(detailRole === item.role ? null : item.role)}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOR[item.status] }} />
                <span className="flex-1 text-sm font-semibold text-charcoal group-hover:text-maroon truncate">{item.role}</span>
                <span className="text-xs font-bold shrink-0" style={{ color: STATUS_COLOR[item.status] }}>{item.label}</span>
              </div>
            ))}
          </div>
          {detailRole && (
            <div className="mt-4 pt-4 border-t border-lightgrey/60 rounded-xl bg-offwhite px-4 py-3">
              <p className="text-xs text-charcoal/70 leading-relaxed">{workload.find((w) => w.role === detailRole)?.detail}</p>
            </div>
          )}
          <p className="text-[11px] text-charcoal/40 mt-4">Tap a role to see details</p>
        </Card>

        {/* Role overlaps */}
        <Card>
          <SectionTitle>Role overlaps</SectionTitle>
          {overlaps.length === 0 ? (
            <p className="text-sm text-charcoal/45">
              {teamRoles.length < 2 ? 'Add at least 2 roles to see overlap analysis.' : 'No significant overlaps detected — good role clarity.'}
            </p>
          ) : (
            <div className="space-y-5">
              {overlaps.map((o) => (
                <div key={`${o.roleA}-${o.roleB}`}>
                  <BarMeter label={`${o.roleA} × ${o.roleB}`} value={o.percent} color="#4338ca" right={`${o.percent}%`} />
                  {o.shared.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {o.shared.slice(0, 4).map((s) => (
                        <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-maroon/10 text-maroon">{s}</span>
                      ))}
                      {o.shared.length > 4 && <span className="text-[10px] text-charcoal/40">+{o.shared.length - 4} more</span>}
                    </div>
                  )}
                  {o.percent >= 50 && <p className="text-xs text-maroon font-medium mt-1">Review before your next hire</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Gap analysis insight */}
      {gapAnalysis && (
        <Card className="mb-5">
          <SectionTitle>
            <span className="flex items-center gap-2">
              <AlertIcon width="15" height="15" className="text-red" />
              Gap analysis summary
            </span>
          </SectionTitle>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl bg-red/[0.05] border border-red/15 px-4 py-3">
              <p className="text-[10px] font-bold text-red/60 uppercase tracking-wide mb-1">Missing roles</p>
              <p className="text-2xl font-extrabold text-red">{gapAnalysis.missingRoles?.length ?? 0}</p>
            </div>
            <div className="rounded-xl bg-gold/[0.05] border border-gold/20 px-4 py-3">
              <p className="text-[10px] font-bold text-[#92620a]/60 uppercase tracking-wide mb-1">Skill gaps</p>
              <p className="text-2xl font-extrabold text-[#92620a]">{gapAnalysis.missingSkills?.length ?? 0}</p>
            </div>
            <div className="rounded-xl bg-maroon/[0.04] border border-maroon/10 px-4 py-3">
              <p className="text-[10px] font-bold text-maroon/60 uppercase tracking-wide mb-1">AI can fill</p>
              <p className="text-2xl font-extrabold text-maroon">{gapAnalysis.aiCanFill?.length ?? 0}</p>
            </div>
          </div>
          {gapAnalysis.summary && (
            <p className="text-sm text-charcoal/70 leading-relaxed">{gapAnalysis.summary}</p>
          )}
        </Card>
      )}

      {/* Member capability cards */}
      <Card>
        <SectionTitle>
          <span className="flex items-center gap-2">
            <SparkleIcon width="15" height="15" className="text-maroon" />
            Individual capability profiles
          </span>
        </SectionTitle>
        <p className="text-xs text-charcoal/50 mb-4">Click a member to expand their AI vs human capability breakdown.</p>
        <div className="grid grid-cols-2 gap-3">
          {teamRoles.map((role) => (
            <MemberCapabilityCard key={role.id} role={role} workflowData={workflowData} />
          ))}
        </div>
      </Card>
    </div>
  );
}
