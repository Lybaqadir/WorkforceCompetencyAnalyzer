import { useState } from 'react';
import {
  Card,
  Donut,
  Legend,
  Pill,
  SectionTitle,
  StatTile,
  VerdictPill,
} from '../components/ui';
import {
  AlertIcon,
  ArrowRightIcon,
  FileIcon,
  OverlapIcon,
  PersonIcon,
  PulseIcon,
  ScaleIcon,
  SparkleIcon,
  TrashIcon,
  UsersIcon,
} from '../components/icons';
import { makeDraftRole, computeTeamMetrics, computeObservations, computeOverlaps } from '../data/teamData';
import { buildAssignmentsFromMapping, computeFitStats, rolesToPeople } from '../lib/teamFit';
import ChatBuilder from '../components/ChatBuilder';
import { TEAM_IMPORT_SCRIPT, ANALYSE_SCRIPT } from '../data/chatScripts';
import { analyseRole } from '../lib/api';
import { generateWorkflowReport } from '../lib/reportPdf';

const COLORS = { ai: '#0d9488', human: '#4338ca', gold: '#f59e0b', red: '#dc2626' };

function RoleCard({ role, onOpen, onRemove, onGoToJD }) {
  return (
    <div className="relative group">
      <button
        onClick={() => onOpen(role.id)}
        className="text-left w-full h-full bg-white rounded-2xl p-5 shadow-[0_1px_2px_rgba(18,19,26,0.04),0_8px_24px_rgba(18,19,26,0.06)] border border-black/[0.03] transition-all duration-200 hover:shadow-[0_8px_20px_rgba(18,19,26,0.1)] hover:-translate-y-0.5"
      >
        <div className="flex items-center gap-3 mb-4">
          <Donut
            size={52}
            thickness={7}
            segments={[
              { value: role.aiPercent, color: COLORS.ai },
              { value: role.humanPercent, color: COLORS.human },
            ]}
          >
            <span className="text-[11px] font-extrabold text-charcoal">{role.aiPercent}%</span>
          </Donut>
          <h3 className="font-bold text-charcoal text-sm leading-snug pr-5">{role.name}</h3>
        </div>
        <div className="flex items-center justify-between gap-2">
          <VerdictPill verdict={role.verdict} />
          <span className="text-[11px] font-semibold text-charcoal/40">AI-doable</span>
        </div>
      </button>
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {onGoToJD && (
          <button
            onClick={(e) => { e.stopPropagation(); onGoToJD(role.id); }}
            title="View job description"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-maroon/60 hover:text-maroon hover:bg-maroon/10 transition-all duration-200 text-[10px] font-bold"
          >
            JD
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(role); }}
          title="Remove role"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-charcoal/25 hover:text-red hover:bg-red/10 transition-all duration-200"
        >
          <TrashIcon width="14" height="14" />
        </button>
      </div>
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-charcoal">{title}</h2>
          <button
            onClick={onClose}
            className="text-charcoal/40 hover:text-charcoal/70 text-sm font-semibold shrink-0"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SidePanelShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/40">
      <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-6 pb-4 border-b border-lightgrey/70 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-charcoal">{title}</h2>
            <button
              onClick={onClose}
              className="text-charcoal/40 hover:text-charcoal/70 text-sm font-semibold shrink-0"
            >
              Close
            </button>
          </div>
          {subtitle && <p className="text-xs text-charcoal/50 mt-1.5">{subtitle}</p>}
        </div>
        <div className="flex-1 min-h-0 flex flex-col p-6">{children}</div>
      </div>
    </div>
  );
}

function GapsModal({ teamRoles, onClose }) {
  const covered = new Set((teamRoles || []).flatMap((r) => (r.competencies || []).map((c) => c.name.toLowerCase())));
  const criticals = [
    { skill: 'Change Management', reason: 'Bringing AI into a team changes how people work — someone needs to own that transition.' },
    { skill: 'AI Ethics', reason: 'As AI agents take on more tasks, someone must ensure they are used safely and fairly.' },
    { skill: 'Budget Planning', reason: 'Any future hire or AI rollout needs a cost case — this skill is often missing in innovation teams.' },
    { skill: 'Strategic Planning', reason: 'Deciding where AI should and shouldn\'t be used requires senior-level thinking.' },
    { skill: 'Risk Management', reason: 'AI introduces new operational risks that need active management.' },
  ].filter((c) => !Array.from(covered).some((cov) => cov.includes(c.skill.split(' ')[0].toLowerCase())));

  return (
    <ModalShell title="Skills nobody covers yet" onClose={onClose}>
      {criticals.length === 0 ? (
        <p className="text-sm text-charcoal/60">All critical skills are covered — great work!</p>
      ) : (
        <div className="space-y-3">
          {criticals.map((gap) => (
            <div key={gap.skill} className="rounded-xl bg-offwhite p-4 flex items-start gap-3">
              <span className="w-8 h-8 rounded-lg bg-red/10 text-red flex items-center justify-center shrink-0">
                <AlertIcon width="15" height="15" />
              </span>
              <div>
                <p className="text-sm font-bold text-charcoal mb-0.5">{gap.skill}</p>
                <p className="text-xs text-charcoal/60 leading-relaxed">{gap.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

function OverlapsModal({ teamRoles, onClose }) {
  const overlaps = computeOverlaps(teamRoles || []);
  return (
    <ModalShell title="Roles that look too similar" onClose={onClose}>
      {overlaps.length === 0 ? (
        <p className="text-sm text-charcoal/60">No significant overlaps — good role clarity.</p>
      ) : (
        <div className="space-y-3">
          {overlaps.map((overlap) => (
            <div key={`${overlap.roleA}-${overlap.roleB}`} className="rounded-xl bg-offwhite p-4">
              <p className="text-sm font-bold text-charcoal mb-2">
                {overlap.roleA} <span className="text-charcoal/40 font-normal">&</span> {overlap.roleB}
              </p>
              <div className="h-2 rounded-full bg-lightgrey overflow-hidden mb-1.5">
                <div className="h-full bg-maroon" style={{ width: `${overlap.percent}%` }} />
              </div>
              <p className="text-xs font-semibold text-charcoal/50 mb-1.5">{overlap.percent}% shared skills</p>
              {overlap.percent >= 50 && (
                <p className="text-xs text-maroon font-medium">Consider redefining these roles before your next hire.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

const OBS_TONE = {
  'border-red': { bg: 'bg-red/10', color: '#dc2626' },
  'border-gold': { bg: 'bg-gold/15', color: '#92620a' },
  'border-maroon': { bg: 'bg-maroon/10', color: '#4338ca' },
};

function RemoveImpactPanel({ role, onConfirm, onCancel }) {
  if (!role) return null;

  const skillsAtRisk = (role.competencies || [])
    .filter((c) => c.type === 'human')
    .map((c) => c.name);
  const isHighAI = (role.aiPercent || 0) >= 60;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/40">
      <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-6 pb-4 border-b border-lightgrey/70 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-charcoal">Remove {role.name}?</h2>
              <p className="text-xs text-charcoal/50 mt-1">Understand the impact before you decide</p>
            </div>
            <button onClick={onCancel} className="text-charcoal/40 hover:text-charcoal/70 text-sm font-semibold shrink-0">
              Cancel
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Skills at risk */}
          <div className="rounded-2xl bg-red/[0.05] border border-red/20 p-5">
            <p className="text-xs font-bold text-red uppercase tracking-wide mb-3">Skills your team will lose</p>
            {skillsAtRisk.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillsAtRisk.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red/10 text-red">
                    ✕ {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-charcoal/60">Other roles partially cover these skills.</p>
            )}
          </div>

          {/* AI replacement suggestion */}
          {isHighAI && (
            <div className="rounded-2xl bg-green/[0.05] border border-green/20 p-5">
              <p className="text-xs font-bold text-green uppercase tracking-wide mb-2">AI can cover this</p>
              <p className="text-sm text-charcoal/70 leading-relaxed">
                {role.aiPercent}% of this role is AI-doable. Instead of a gap, you could replace it with an AI agent and keep the {100 - role.aiPercent}% human work distributed across the team.
              </p>
            </div>
          )}

          {/* Health impact */}
          <div className="rounded-2xl bg-offwhite p-5">
            <p className="text-xs font-bold text-charcoal/40 uppercase tracking-wide mb-2">Next steps</p>
            <p className="text-sm text-charcoal/65 leading-relaxed">
              After removing this role, update your Team Fit to see who covers the gaps — or use the Simulator to model "replace with AI" first.
            </p>
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-lightgrey/70 shrink-0 space-y-2">
          {isHighAI && (
            <button
              onClick={() => onConfirm('ai')}
              className="w-full inline-flex items-center justify-center gap-2 bg-green/10 text-green border border-green/30 rounded-xl px-4 py-3 text-sm font-bold hover:bg-green/15 transition-colors duration-200"
            >
              <SparkleIcon width="14" height="14" />
              Remove &amp; simulate AI replacement
            </button>
          )}
          <button
            onClick={() => onConfirm('teamfit')}
            className="w-full inline-flex items-center justify-center gap-2 bg-maroon text-white rounded-xl px-4 py-3 text-sm font-bold hover:bg-maroon-dark transition-colors duration-200 shadow-[0_4px_12px_rgba(67,56,202,0.2)]"
          >
            Remove &amp; update Team Fit
          </button>
          <button
            onClick={onCancel}
            className="w-full text-xs font-semibold text-charcoal/45 hover:text-charcoal/70 py-2"
          >
            Keep this role
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkflowDetailPanel({ title, subtitle = 'Full analysis details', onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/40" onClick={onClose}>
      <div
        className="bg-white h-full w-full max-w-lg shadow-2xl flex flex-col animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-4 border-b border-lightgrey/70 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-charcoal">{title}</h2>
            <button onClick={onClose} className="text-charcoal/40 hover:text-charcoal/70 text-sm font-semibold shrink-0">Close</button>
          </div>
          <p className="text-xs text-charcoal/50 mt-1">{subtitle}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

const FIT_BAR_COLOR = (score) => (score >= 75 ? '#0d9488' : score >= 50 ? '#f59e0b' : '#dc2626');

const GAP_SEVERITY_ORDER = { critical: 0, important: 1, low: 2 };
const GAP_RANK_STYLE = {
  critical: 'bg-red text-white',
  important: 'bg-gold text-navy',
  low: 'bg-lightgrey text-charcoal/60',
};

export default function HomeScreen({
  onOpenRole,
  onNavigate,
  onGoToJD,
  teamRoles = [],
  onAddRole,
  onRemoveRole,
  mission,
  targetOrg,
  workflowData,
  onStartSetup,
  onReviewWorkflow,
  onOpenWorkflowStage,
}) {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAnalyseChat, setShowAnalyseChat] = useState(false);
  const [openDetail, setOpenDetail] = useState(null);
  const [analysing, setAnalysing] = useState(false);

  // Org readiness — same shared computation as the Team Fit page, driven by
  // the user's live assignments (or the AI mapping until they exist), so both
  // surfaces always show the same numbers.
  const teamMapping = workflowData?.teamMapping;
  const fitPeople = rolesToPeople(teamRoles);
  const fitAssignments =
    workflowData?.teamFitAssignments ?? buildAssignmentsFromMapping(targetOrg, fitPeople, teamMapping);
  const fitStats = targetOrg ? computeFitStats(targetOrg, fitPeople, fitAssignments, teamMapping) : null;
  const fit = fitStats
    ? { summary: { total: fitStats.total, filled: fitStats.filled, partial: fitStats.partial, gaps: fitStats.gaps } }
    : null;

  const metrics = computeTeamMetrics(teamRoles);
  const dynamicObs = computeObservations(teamRoles);

  const avgAI = metrics.skillBalance;

  const [removingRole, setRemovingRole] = useState(null);

  function handleRemoveRole(role) {
    setRemovingRole(role);
  }

  function confirmRemove(action) {
    if (!removingRole) return;
    onRemoveRole(removingRole.id);
    setRemovingRole(null);
    if (action === 'ai') onNavigate('whatif');
    else if (action === 'teamfit') onNavigate('teamfit');
  }

  async function handleAddMemberComplete(answers) {
    const draftRole = makeDraftRole(answers);
    onAddRole(draftRole);
    setShowAddMemberModal(false);
    // Enrich with real AI analysis in the background
    try {
      const analysis = await analyseRole(answers.name, answers.responsibilities, mission?.statement);
      if (analysis) {
        onAddRole({
          ...draftRole,
          aiPercent: analysis.aiPercent ?? draftRole.aiPercent,
          humanPercent: analysis.humanPercent ?? draftRole.humanPercent,
          verdict: verdictLabel(analysis.verdict) ?? draftRole.verdict,
          competencies: analysis.competencies?.map((c) => ({ name: c.label, type: c.type })) ?? draftRole.competencies,
          cost: analysis.cost ?? draftRole.cost,
          risk: analysis.risk ?? draftRole.risk,
          gains: analysis.gains ?? draftRole.gains,
          losses: analysis.losses ?? draftRole.losses,
          recommendation: analysis.recommendation ?? draftRole.recommendation,
        });
      }
    } catch { /* silently keep draft */ }
  }

  async function handleAnalyseChatComplete(answers) {
    const draftRole = makeDraftRole(answers);
    onAddRole(draftRole);
    setShowAnalyseChat(false);
    setAnalysing(true);
    try {
      const analysis = await analyseRole(answers.name, answers.responsibilities, mission?.statement);
      if (analysis) {
        const enriched = {
          ...draftRole,
          aiPercent: analysis.aiPercent ?? draftRole.aiPercent,
          humanPercent: analysis.humanPercent ?? draftRole.humanPercent,
          verdict: verdictLabel(analysis.verdict) ?? draftRole.verdict,
          competencies: analysis.competencies?.map((c) => ({ name: c.label, type: c.type })) ?? draftRole.competencies,
          cost: analysis.cost ?? draftRole.cost,
          risk: analysis.risk ?? draftRole.risk,
          gains: analysis.gains ?? draftRole.gains,
          losses: analysis.losses ?? draftRole.losses,
          recommendation: analysis.recommendation ?? draftRole.recommendation,
        };
        onAddRole(enriched);
        onOpenRole(enriched.id);
      } else {
        onOpenRole(draftRole.id);
      }
    } catch {
      onOpenRole(draftRole.id);
    } finally {
      setAnalysing(false);
    }
  }

  function verdictLabel(v) {
    switch (v) {
      case 'automate': return 'AI Candidate';
      case 'augment': return 'AI + Human';
      case 'evolve': return 'AI + Human';
      default: return 'AI + Human';
    }
  }

  return (
    <div className="max-w-[1240px] flex gap-6 items-start">
      {/* ——— Main column ——— */}
      <div className="flex-1 min-w-0">
        {/* Analysing banner */}
        {analysing && (
          <div className="rounded-2xl bg-maroon/10 border border-maroon/20 px-5 py-3 mb-4 flex items-center gap-3">
            <SparkleIcon width="16" height="16" className="text-maroon animate-pulse shrink-0" />
            <p className="text-sm font-semibold text-maroon">AI is analysing the role — results will appear shortly…</p>
          </div>
        )}

        {/* Greeting banner */}
        <div className="rounded-2xl bg-gradient-to-r from-navy to-maroon p-7 mb-6 flex items-center justify-between gap-6 flex-wrap">
          <div className="min-w-[260px]">
            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">
              Welcome back 👋
            </h1>
            <p className="text-sm text-white/60">
              {mission ? mission.teamName : 'Your team'} · {teamRoles.length} roles analysed
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowAnalyseChat(true)}
              className="inline-flex items-center gap-2 bg-gold text-navy rounded-xl px-4 py-2.5 text-sm font-bold hover:brightness-105 transition-all duration-200"
            >
              <SparkleIcon width="15" height="15" />
              AI insights
            </button>
            {workflowData?.mission && (
              <button
                onClick={() => generateWorkflowReport(workflowData)}
                className="inline-flex items-center gap-2 bg-white text-navy rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-white/90 transition-colors duration-200"
              >
                <FileIcon width="15" height="15" />
                Export PDF
              </button>
            )}
            {onReviewWorkflow && (
              <button
                onClick={onReviewWorkflow}
                className="inline-flex items-center gap-2 bg-white/15 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-white/25 transition-colors duration-200 border border-white/20"
              >
                <ArrowRightIcon width="15" height="15" />
                Review Workflow
              </button>
            )}
            <button
              onClick={onStartSetup}
              className="inline-flex items-center gap-2 bg-white/10 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-white/20 transition-colors duration-200"
            >
              <UsersIcon width="15" height="15" />
              New team
            </button>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="flex gap-4 flex-wrap mb-6">
          <StatTile icon={<PulseIcon />} tone="gold" value={metrics.health} label="Team health" hint="out of 100" />
          <StatTile icon={<ScaleIcon />} tone="green" value={`${metrics.skillBalance}%`} label="AI-doable" hint="across the team" />
          <StatTile
            icon={<AlertIcon />}
            tone="red"
            value={metrics.gaps}
            label="Skill gaps"
            hint="tap to view"
            onClick={() => setOpenDetail('gaps')}
          />
          <StatTile
            icon={<OverlapIcon />}
            tone="brand"
            value={metrics.overlaps}
            label="Overlaps"
            hint="tap to view"
            onClick={() => setOpenDetail('overlaps')}
          />
        </div>

        {/* Workflow results summary */}
        {(workflowData?.teamMapping || workflowData?.skillsAnalysis || workflowData?.gapAnalysis || workflowData?.recommendations || workflowData?.futurePlanning) && (
          <div className="mb-6">
            <SectionTitle className="mb-3">Workflow results — click any card to view details</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {/* Team mapping summary */}
              <button
                onClick={() => workflowData.teamMapping && setOpenDetail('teamMapping')}
                className={`rounded-2xl border p-4 text-left transition-all duration-200 ${workflowData.teamMapping ? 'bg-white border-black/[0.03] hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'bg-offwhite border-lightgrey cursor-default'}`}
              >
                <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wide mb-1">Team Mapping</p>
                {workflowData.teamMapping ? (
                  <>
                    <p className="text-lg font-extrabold text-green">{workflowData.teamMapping.matched?.length ?? 0} matched</p>
                    <p className="text-xs text-charcoal/50">{workflowData.teamMapping.vacant?.length ?? 0} roles vacant</p>
                    <p className="text-[10px] text-maroon font-semibold mt-2">View Details →</p>
                  </>
                ) : (
                  <p className="text-xs text-charcoal/40">Not completed yet</p>
                )}
              </button>

              {/* Skills analysis summary */}
              <button
                onClick={() => workflowData.skillsAnalysis && setOpenDetail('skillsAnalysis')}
                className={`rounded-2xl border p-4 text-left transition-all duration-200 ${workflowData.skillsAnalysis ? 'bg-white border-black/[0.03] hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'bg-offwhite border-lightgrey cursor-default'}`}
              >
                <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wide mb-1">Skills Analysis</p>
                {workflowData.skillsAnalysis ? (
                  <>
                    <p className="text-lg font-extrabold text-green">
                      {workflowData.skillsAnalysis.competencies?.filter((c) => c.status === 'covered').length ?? 0} covered
                    </p>
                    <p className="text-xs text-red">
                      {workflowData.skillsAnalysis.competencies?.filter((c) => c.status === 'missing').length ?? 0} missing
                    </p>
                    <p className="text-[10px] text-maroon font-semibold mt-2">View Details →</p>
                  </>
                ) : (
                  <p className="text-xs text-charcoal/40">Not completed yet</p>
                )}
              </button>

              {/* Gap analysis summary */}
              <button
                onClick={() => workflowData.gapAnalysis && setOpenDetail('gapAnalysis')}
                className={`rounded-2xl border p-4 text-left transition-all duration-200 ${workflowData.gapAnalysis ? 'bg-white border-black/[0.03] hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'bg-offwhite border-lightgrey cursor-default'}`}
              >
                <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wide mb-1">Gap Analysis</p>
                {workflowData.gapAnalysis ? (
                  <>
                    <p className="text-lg font-extrabold text-red">{workflowData.gapAnalysis.missingRoles?.length ?? 0} missing roles</p>
                    <p className="text-xs text-charcoal/50">{workflowData.gapAnalysis.missingSkills?.length ?? 0} skill gaps</p>
                    <p className="text-[10px] text-maroon font-semibold mt-2">View Details →</p>
                  </>
                ) : (
                  <p className="text-xs text-charcoal/40">Not completed yet</p>
                )}
              </button>

              {/* Recommendations summary */}
              <button
                onClick={() => workflowData.recommendations && setOpenDetail('recommendations')}
                className={`rounded-2xl border p-4 text-left transition-all duration-200 ${workflowData.recommendations ? 'bg-white border-black/[0.03] hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'bg-offwhite border-lightgrey cursor-default'}`}
              >
                <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wide mb-1">Recommendations</p>
                {workflowData.recommendations ? (
                  <>
                    <p className="text-lg font-extrabold text-maroon">
                      {(
                        (workflowData.recommendations.immediate?.length ?? 0) +
                        (workflowData.recommendations.hiring?.length ?? 0) +
                        (workflowData.recommendations.internalMobility?.length ?? 0) +
                        (workflowData.recommendations.reskilling?.length ?? 0) ||
                        workflowData.recommendations.recommendations?.length ||
                        '✓'
                      )} actions
                    </p>
                    <p className="text-xs text-charcoal/50">Ready to review</p>
                    <p className="text-[10px] text-maroon font-semibold mt-2">View Details →</p>
                  </>
                ) : (
                  <p className="text-xs text-charcoal/40">Not completed yet</p>
                )}
              </button>

              {/* Future plan summary */}
              <button
                onClick={() => workflowData.futurePlanning && setOpenDetail('futurePlanning')}
                className={`rounded-2xl border p-4 text-left transition-all duration-200 ${workflowData.futurePlanning ? 'bg-white border-black/[0.03] hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'bg-offwhite border-lightgrey cursor-default'}`}
              >
                <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wide mb-1">Future Plan</p>
                {workflowData.futurePlanning ? (
                  <>
                    <p className="text-lg font-extrabold text-navy dark:text-charcoal">{workflowData.futurePlanning.hiringPlan?.length ?? 0} hires planned</p>
                    <p className="text-xs text-charcoal/50">{workflowData.futurePlanning.aiAdoption?.length ?? 0} AI initiatives</p>
                    <p className="text-[10px] text-maroon font-semibold mt-2">View Details →</p>
                  </>
                ) : (
                  <p className="text-xs text-charcoal/40">Not completed yet</p>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Roles grid */}
        <SectionTitle
          action={
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-maroon hover:text-maroon-dark"
            >
              <PersonIcon width="14" height="14" />
              Add member
            </button>
          }
        >
          Current roles
        </SectionTitle>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {teamRoles.map((role) => (
            <RoleCard key={role.id} role={role} onOpen={onOpenRole} onRemove={handleRemoveRole} onGoToJD={onGoToJD} />
          ))}
          {teamRoles.length === 0 && (
            <p className="text-sm text-charcoal/45 py-6 col-span-full">
              No roles yet — add a member to get started.
            </p>
          )}
        </div>

        {/* Simulator callout */}
        <button
          onClick={() => onNavigate('whatif')}
          className="w-full text-left rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(18,19,26,0.04),0_8px_24px_rgba(18,19,26,0.06)] border border-black/[0.03] flex items-center gap-4 transition-all duration-200 hover:shadow-[0_8px_20px_rgba(18,19,26,0.1)] hover:-translate-y-0.5"
        >
          <span className="w-11 h-11 rounded-xl bg-maroon/10 text-maroon flex items-center justify-center shrink-0">
            <SparkleIcon />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-charcoal">Simulate replacing a role with AI</p>
            <p className="text-xs text-charcoal/50 mt-0.5">See cost, risk and balance shift — instantly</p>
          </div>
          <ArrowRightIcon className="text-maroon shrink-0" />
        </button>
      </div>

      {/* ——— Right rail ——— */}
      <div className="w-[300px] shrink-0 flex flex-col gap-5">
        {/* Team mix donut */}
        <Card className="!p-5">
          <SectionTitle className="!mb-3">Team mix</SectionTitle>
          <div className="flex flex-col items-center">
            <Donut
              size={150}
              thickness={20}
              segments={[
                { value: avgAI, color: COLORS.ai },
                { value: 100 - avgAI, color: COLORS.human },
              ]}
            >
              <span className="text-2xl font-extrabold text-charcoal leading-none">{avgAI}%</span>
              <span className="text-[10px] text-charcoal/45 mt-1">AI-doable</span>
            </Donut>
            <Legend
              className="w-full mt-4"
              items={[
                { label: 'AI can handle', value: `${avgAI}%`, color: COLORS.ai },
                { label: 'Needs a human', value: `${100 - avgAI}%`, color: COLORS.human },
              ]}
            />
          </div>
        </Card>

        {/* Target org readiness */}
        {fit && (
          <Card className="!p-5">
            <SectionTitle
              className="!mb-3"
              action={
                <button
                  onClick={() => onNavigate('teamfit')}
                  className="text-[11px] font-bold text-maroon hover:text-maroon-dark"
                >
                  View all
                </button>
              }
            >
              Org readiness
            </SectionTitle>
            {!teamMapping && (
              <p className="text-[10px] text-charcoal/40 mb-3">Complete team mapping to see real fill rates.</p>
            )}
            <div className="flex items-center gap-4">
              <Donut
                size={84}
                thickness={11}
                segments={[
                  { value: fit.summary.filled, color: COLORS.ai },
                  { value: fit.summary.partial, color: COLORS.gold },
                  { value: fit.summary.gaps, color: COLORS.red },
                ]}
              >
                <span className="text-base font-extrabold text-charcoal leading-none">
                  {fit.summary.filled}/{fit.summary.total}
                </span>
              </Donut>
              <Legend
                className="flex-1"
                items={[
                  { label: 'Filled', value: fit.summary.filled, color: COLORS.ai },
                  { label: 'Reskill', value: fit.summary.partial, color: COLORS.gold },
                  { label: 'Gaps', value: fit.summary.gaps, color: COLORS.red },
                ]}
              />
            </div>
          </Card>
        )}

        {/* Mission snapshot */}
        {mission && (
          <Card className="!p-5">
            <SectionTitle
              className="!mb-3"
              action={
                <button
                  onClick={() => onNavigate('mission')}
                  className="text-[11px] font-bold text-maroon hover:text-maroon-dark"
                >
                  View all
                </button>
              }
            >
              Mission
            </SectionTitle>
            <p className="text-xs text-charcoal/70 leading-relaxed mb-3 line-clamp-3">
              {mission.statement}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {mission.objectives.slice(0, 2).map((obj) => (
                <Pill key={obj.id} tone="human">
                  <span className="max-w-[220px] truncate">{obj.title}</span>
                </Pill>
              ))}
            </div>
          </Card>
        )}

        {/* Observations feed */}
        <Card className="!p-5">
          <SectionTitle className="!mb-3">What we noticed</SectionTitle>
          <div className="space-y-3">
            {dynamicObs.map((obs, i) => {
              const tone = OBS_TONE[obs.border];
              return (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone.bg}`}
                    style={{ color: tone.color }}
                  >
                    <AlertIcon width="14" height="14" />
                  </span>
                  <p className="text-xs text-charcoal/70 leading-relaxed">{obs.text}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {showAddMemberModal && (
        <SidePanelShell
          title="Add a team member"
          subtitle="Chat with the AI agent — it analyses the role automatically."
          onClose={() => setShowAddMemberModal(false)}
        >
          <ChatBuilder script={TEAM_IMPORT_SCRIPT} onComplete={handleAddMemberComplete} />
        </SidePanelShell>
      )}
      {showAnalyseChat && (
        <SidePanelShell
          title="Get AI insights on a role"
          subtitle="The agent breaks down what AI can and can't do for it."
          onClose={() => setShowAnalyseChat(false)}
        >
          <ChatBuilder script={ANALYSE_SCRIPT} onComplete={handleAnalyseChatComplete} />
        </SidePanelShell>
      )}
      {openDetail === 'gaps' && <GapsModal teamRoles={teamRoles} onClose={() => setOpenDetail(null)} />}
      {openDetail === 'overlaps' && <OverlapsModal teamRoles={teamRoles} onClose={() => setOpenDetail(null)} />}
      {openDetail === 'teamMapping' && workflowData?.teamMapping && (
        <WorkflowDetailPanel title="Team Mapping" subtitle="Who fits which target role, with AI fit scores" onClose={() => setOpenDetail(null)}>
          <div className="space-y-3">
            {workflowData.teamMapping.matched
              ?.slice()
              .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
              .map((m, i) => (
                <div key={i} className="rounded-xl border border-black/[0.04] bg-white shadow-sm px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <p className="text-sm font-bold text-charcoal">{m.memberName}</p>
                    <ArrowRightIcon width="12" height="12" className="text-charcoal/30" />
                    <p className="text-sm font-semibold text-maroon">{m.targetRoleName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 rounded-full bg-lightgrey overflow-hidden flex-1">
                      <div className="h-full rounded-full" style={{ width: `${m.fitScore ?? 0}%`, backgroundColor: FIT_BAR_COLOR(m.fitScore ?? 0) }} />
                    </div>
                    <span className="text-xs font-bold shrink-0" style={{ color: FIT_BAR_COLOR(m.fitScore ?? 0) }}>{m.fitScore ?? 0}%</span>
                  </div>
                  {(m.rationale || m.matchReason) && <p className="text-xs text-charcoal/60 mt-2">{m.rationale || m.matchReason}</p>}
                </div>
              ))}
            {workflowData.teamMapping.vacant?.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-bold text-red uppercase tracking-wide mb-2">Vacant roles</p>
                {workflowData.teamMapping.vacant.map((v, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-red/[0.04] border-l-4 border border-black/[0.03] border-l-red px-4 py-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-charcoal">{v.roleName}</p>
                        {v.urgency && <span className="px-2 py-0.5 rounded-full bg-red/10 text-red text-[10px] font-bold">{v.urgency}</span>}
                      </div>
                      <p className="text-xs text-charcoal/60 mt-0.5">{v.reason || 'No suitable internal candidate found'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {workflowData.teamMapping.summary && (
              <div className="rounded-xl bg-offwhite px-4 py-3 mt-2">
                <p className="text-xs text-charcoal/70 leading-relaxed">{workflowData.teamMapping.summary}</p>
              </div>
            )}
          </div>
        </WorkflowDetailPanel>
      )}
      {openDetail === 'skillsAnalysis' && workflowData?.skillsAnalysis && (() => {
        const comps = workflowData.skillsAnalysis.competencies || [];
        const groups = [
          { key: 'covered', label: 'Covered', bar: 'bg-green', chip: 'bg-green/10 text-green border-green/20' },
          { key: 'partial', label: 'Partial', bar: 'bg-gold', chip: 'bg-gold/10 text-[#92620a] border-gold/25' },
          { key: 'missing', label: 'Missing', bar: 'bg-red', chip: 'bg-red/10 text-red border-red/20' },
        ];
        return (
          <WorkflowDetailPanel title="Skills Analysis" subtitle="Competency coverage across the team" onClose={() => setOpenDetail(null)}>
            {/* Segmented coverage bar */}
            {comps.length > 0 && (
              <div className="h-2.5 rounded-full bg-lightgrey overflow-hidden flex mb-5">
                {groups.map((g) => {
                  const n = comps.filter((c) => c.status === g.key).length;
                  return n > 0 ? <div key={g.key} className={`h-full ${g.bar}`} style={{ width: `${(n / comps.length) * 100}%` }} /> : null;
                })}
              </div>
            )}
            <div className="space-y-5">
              {groups.map((g) => {
                const items = comps.filter((c) => c.status === g.key);
                if (items.length === 0) return null;
                return (
                  <div key={g.key}>
                    <p className="text-xs font-bold text-charcoal/45 uppercase tracking-wide mb-2">{g.label} ({items.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((c, i) => (
                        <span
                          key={i}
                          title={c.coveredBy?.length ? `Covered by ${c.coveredBy.join(', ')}` : c.requiredBy?.length ? `Needed for ${c.requiredBy.join(', ')}` : undefined}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${g.chip}`}
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {workflowData.skillsAnalysis.summary && (
                <div className="rounded-xl bg-offwhite px-4 py-3">
                  <p className="text-xs text-charcoal/70 leading-relaxed">{workflowData.skillsAnalysis.summary}</p>
                </div>
              )}
            </div>
          </WorkflowDetailPanel>
        );
      })()}
      {openDetail === 'gapAnalysis' && workflowData?.gapAnalysis && (() => {
        const gaps = [
          ...(workflowData.gapAnalysis.missingRoles || []).map((r) => ({
            kind: 'role', title: r.roleName || r.role || String(r), severity: r.severity || 'low', detail: r.impact || r.reason, action: r.suggestedAction,
          })),
          ...(workflowData.gapAnalysis.missingSkills || []).map((s) => ({
            kind: 'skill', title: s.skill || String(s), severity: s.severity || 'low', detail: s.neededBy?.length ? `Needed by: ${s.neededBy.join(', ')}` : null, action: s.suggestedAction,
          })),
        ].sort((a, b) => (GAP_SEVERITY_ORDER[a.severity] ?? 3) - (GAP_SEVERITY_ORDER[b.severity] ?? 3));
        return (
          <WorkflowDetailPanel title="Gap Analysis" subtitle="Every gap ranked by how much it hurts the mission" onClose={() => setOpenDetail(null)}>
            <div className="space-y-2.5">
              {gaps.map((g, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-black/[0.04] bg-white shadow-sm px-4 py-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${GAP_RANK_STYLE[g.severity] || GAP_RANK_STYLE.low}`}>{i + 1}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-charcoal">{g.title}</p>
                      <span className="px-1.5 py-0.5 rounded-full bg-offwhite text-charcoal/50 text-[9px] font-bold uppercase">{g.kind}</span>
                    </div>
                    {g.detail && <p className="text-xs text-charcoal/60 mt-0.5">{g.detail}</p>}
                    {g.action && <p className="text-xs font-semibold text-maroon mt-0.5">→ {g.action}</p>}
                  </div>
                </div>
              ))}
              {workflowData.gapAnalysis.summary && (
                <div className="rounded-xl bg-offwhite px-4 py-3 mt-2">
                  <p className="text-xs text-charcoal/70 leading-relaxed">{workflowData.gapAnalysis.summary}</p>
                </div>
              )}
              {onOpenWorkflowStage && (
                <button
                  onClick={() => { setOpenDetail(null); onOpenWorkflowStage('gap-analysis'); }}
                  className="text-xs font-bold text-maroon hover:text-maroon-dark pt-1"
                >
                  Open full Gap Analysis page →
                </button>
              )}
            </div>
          </WorkflowDetailPanel>
        );
      })()}
      {openDetail === 'recommendations' && workflowData?.recommendations && (
        <WorkflowDetailPanel title="Recommendations" subtitle="Move internally → reskill → hire, in that order" onClose={() => setOpenDetail(null)}>
          <div className="space-y-5">
            {[
              {
                n: 1, label: 'Internal Mobility', tone: 'bg-green text-white',
                items: (workflowData.recommendations.internalMobility || []).map((m) => ({
                  title: m.personName, sub: `${m.currentRole} → ${m.recommendedRole}`, detail: m.rationale, badge: m.readinessLevel?.replace(/-/g, ' '),
                })),
              },
              {
                n: 2, label: 'Reskilling', tone: 'bg-gold text-navy',
                items: (workflowData.recommendations.reskilling || []).map((r) => ({
                  title: r.personName, sub: (r.targetSkills || []).join(', '), detail: r.trainingApproach, badge: r.timeline,
                })),
              },
              {
                n: 3, label: 'External Hiring', tone: 'bg-maroon text-white',
                items: (workflowData.recommendations.hiring || []).map((h) => ({
                  title: h.role, sub: (h.keySkillsNeeded || []).join(', '), detail: h.reason, badge: h.priority,
                })),
              },
            ].map((lane) => lane.items.length > 0 && (
              <div key={lane.n}>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold ${lane.tone}`}>{lane.n}</span>
                  <p className="text-sm font-bold text-charcoal">{lane.label}</p>
                </div>
                <div className="space-y-2">
                  {lane.items.map((it, i) => (
                    <div key={i} className="rounded-xl border border-black/[0.04] bg-white shadow-sm px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-charcoal">{it.title}</p>
                        {it.badge && <span className="px-2 py-0.5 rounded-full bg-offwhite text-charcoal/55 text-[10px] font-bold shrink-0">{it.badge}</span>}
                      </div>
                      {it.sub && <p className="text-xs text-charcoal/50 mt-0.5">{it.sub}</p>}
                      {it.detail && <p className="text-xs text-charcoal/65 mt-1">{it.detail}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {workflowData.recommendations.summary && (
              <div className="rounded-xl bg-offwhite px-4 py-3">
                <p className="text-xs text-charcoal/70 leading-relaxed">{workflowData.recommendations.summary}</p>
              </div>
            )}
          </div>
        </WorkflowDetailPanel>
      )}
      {openDetail === 'futurePlanning' && workflowData?.futurePlanning && (
        <WorkflowDetailPanel title="Future Workforce Plan" subtitle="Hiring roadmap, AI adoption and budget" onClose={() => setOpenDetail(null)}>
          <div className="space-y-5">
            {workflowData.futurePlanning.hiringPlan?.length > 0 && (
              <div className="relative pl-5">
                <div className="absolute left-[5px] top-1.5 bottom-1.5 w-0.5 bg-maroon/20 rounded-full" />
                <div className="space-y-4">
                  {['0-3 months', '3-6 months', '6-12 months', '12+ months'].map((t) => {
                    const roles = workflowData.futurePlanning.hiringPlan.filter((h) => h.timeline === t);
                    if (!roles.length) return null;
                    return (
                      <div key={t} className="relative">
                        <span className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-maroon border-2 border-white shadow" />
                        <p className="text-[10px] font-extrabold text-maroon uppercase tracking-wider mb-1.5">{t}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {roles.map((h, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-black/[0.05] shadow-sm text-xs font-semibold text-charcoal">{h.role}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {workflowData.futurePlanning.aiAdoption?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-charcoal/45 uppercase tracking-wide mb-2">AI adoption</p>
                {workflowData.futurePlanning.aiAdoption.map((a, i) => (
                  <div key={i} className="rounded-xl bg-green/[0.04] border border-green/15 px-4 py-3 mb-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-charcoal">{a.initiative}</p>
                      {a.timeline && <span className="px-2 py-0.5 rounded-full bg-green/10 text-green text-[10px] font-bold shrink-0">{a.timeline}</span>}
                    </div>
                    {a.expectedImpact && <p className="text-xs text-charcoal/60 mt-0.5">{a.expectedImpact}</p>}
                  </div>
                ))}
              </div>
            )}
            {workflowData.futurePlanning.budgetImpact && (
              <div className="grid grid-cols-2 gap-2">
                {workflowData.futurePlanning.budgetImpact.shortTermInvestment && (
                  <div className="rounded-xl bg-offwhite px-4 py-3">
                    <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider mb-1">Short-term invest</p>
                    <p className="text-sm font-extrabold text-charcoal">{workflowData.futurePlanning.budgetImpact.shortTermInvestment}</p>
                  </div>
                )}
                {workflowData.futurePlanning.budgetImpact.longTermSavings && (
                  <div className="rounded-xl bg-green/8 px-4 py-3">
                    <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider mb-1">Long-term savings</p>
                    <p className="text-sm font-extrabold text-green">{workflowData.futurePlanning.budgetImpact.longTermSavings}</p>
                  </div>
                )}
              </div>
            )}
            {workflowData.futurePlanning.summary && (
              <div className="rounded-xl bg-offwhite px-4 py-3">
                <p className="text-xs text-charcoal/70 leading-relaxed">{workflowData.futurePlanning.summary}</p>
              </div>
            )}
          </div>
        </WorkflowDetailPanel>
      )}
      {removingRole && (
        <RemoveImpactPanel
          role={removingRole}
          onConfirm={confirmRemove}
          onCancel={() => setRemovingRole(null)}
        />
      )}
    </div>
  );
}
