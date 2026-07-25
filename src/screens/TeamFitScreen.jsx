import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Card, Donut, PageHeader, PrimaryButton, SectionTitle } from '../components/ui';
import { CheckIcon, GripIcon, SparkleIcon, XIcon } from '../components/icons';
import { computeTeamFit } from '../data/missionData';
import { buildAIAssignments, buildAssignmentsFromMapping, computeFitStats, estimateFit, rolesToPeople } from '../lib/teamFit';

function fitMeta(score) {
  if (score >= 70) return { label: 'Strong fit', color: '#0d9488', border: 'border-green/50', bg: 'bg-green/[0.06]', pill: 'bg-green/10 text-green' };
  if (score >= 40) return { label: 'Partial fit', color: '#f59e0b', border: 'border-gold/60', bg: 'bg-gold/[0.06]', pill: 'bg-gold/15 text-[#92620a]' };
  return { label: 'Weak fit', color: '#dc2626', border: 'border-red/40', bg: 'bg-red/[0.05]', pill: 'bg-red/10 text-red' };
}

// ─── Org tree helpers ─────────────────────────────────────────────────────────

function treeRoots(roles) { return roles.filter((r) => !r.reportsTo); }
function treeChildren(roles, parentId) { return roles.filter((r) => r.reportsTo === parentId); }

// ─── Role detail drawer ───────────────────────────────────────────────────────

function RoleDetailDrawer({ role, person, score, people, onClose }) {
  const meta = score != null ? fitMeta(score) : null;
  const roleSkills = role.skills || [];
  const personSkills = (person?.competencies || []).map((c) => c.name.toLowerCase());

  const coveredSkills = roleSkills.filter((s) =>
    personSkills.some((ps) => ps.includes(s.name.toLowerCase().split(' ')[0]))
  );
  const missingSkills = roleSkills.filter((s) =>
    !personSkills.some((ps) => ps.includes(s.name.toLowerCase().split(' ')[0]))
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/40" onClick={onClose}>
      <div
        className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col animate-slide-in-right overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-4 border-b border-lightgrey/70 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-charcoal">{role.name}</h2>
              <p className="text-xs text-charcoal/50 mt-1">{role.subTeam} · {role.headcount} seat{role.headcount !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={onClose} className="text-charcoal/40 hover:text-charcoal/70 text-sm font-semibold shrink-0">Close</button>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-5">
          {/* Assigned person */}
          {person ? (
            <div className={`rounded-2xl border p-5 ${meta?.bg || ''} ${meta?.border ? `border ${meta.border}` : 'border-lightgrey'}`}>
              <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wide mb-3">Assigned person</p>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={person.name} size={44} />
                <div>
                  <p className="text-sm font-bold text-charcoal">{person.name}</p>
                  <p className="text-xs text-charcoal/50">{person.roleName}</p>
                </div>
                {meta && (
                  <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${meta.pill}`}>
                    {score}% — {meta.label}
                  </span>
                )}
              </div>
              {role.rationale && (
                <p className="text-sm text-charcoal/65 leading-relaxed">{role.rationale}</p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-red/40 bg-red/[0.04] p-5">
              <p className="text-[10px] font-bold text-red/60 uppercase tracking-wide mb-2">Vacant — no one assigned</p>
              <p className="text-sm text-charcoal/60 leading-relaxed">
                Drag a team member from the left panel onto this role to fill it, or use AI suggestions to auto-assign.
              </p>
            </div>
          )}

          {/* Why this role matters */}
          {role.rationale && (
            <div className="rounded-2xl bg-offwhite p-4">
              <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wide mb-2">Why this role</p>
              <p className="text-sm text-charcoal/70 leading-relaxed">{role.rationale}</p>
            </div>
          )}

          {/* Skills coverage */}
          {roleSkills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wide mb-3">Skills required</p>
              {person && (
                <>
                  {coveredSkills.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-semibold text-green mb-1.5">✓ Covered by {person.name.split(' ')[0]}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {coveredSkills.map((s) => (
                          <span key={s.name} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green/10 text-green">{s.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {missingSkills.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-red mb-1.5">✕ Missing — reskilling needed</p>
                      <div className="flex flex-wrap gap-1.5">
                        {missingSkills.map((s) => (
                          <span key={s.name} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red/10 text-red">{s.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {!person && (
                <div className="flex flex-wrap gap-1.5">
                  {roleSkills.map((s) => (
                    <span key={s.name} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-lightgrey text-charcoal/50">{s.name}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI reasoning */}
          {score != null && person && (
            <div className="rounded-2xl bg-maroon/[0.04] border border-maroon/10 p-4">
              <p className="text-[10px] font-bold text-maroon/60 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <SparkleIcon width="11" height="11" />
                AI reasoning
              </p>
              <p className="text-sm text-charcoal/70 leading-relaxed">
                {score >= 70
                  ? `${person.name.split(' ')[0]} is a strong match for ${role.name}. Their skill profile covers most of what this role demands, making them ready to step into this position with minimal ramp-up.`
                  : score >= 40
                  ? `${person.name.split(' ')[0]} partially fits ${role.name}. They cover some key competencies but will need development in ${missingSkills.slice(0, 2).map((s) => s.name).join(' and ')} before they can fully own this role.`
                  : `${person.name.split(' ')[0]} is a stretch for ${role.name}. The skill gap is significant — consider this role for external hiring or a longer reskilling path.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Drop zone node ───────────────────────────────────────────────────────────

function OrgDropNode({ role, people, assignments, onDrop, onClear, draggingPersonId, onGoToJD, onViewDetail, teamMapping }) {
  const [dragOver, setDragOver] = useState(false);
  const assignedPersonId = assignments[role.id];
  const assignedPerson = assignedPersonId ? people.find((p) => p.id === assignedPersonId) : null;

  const draggingPerson = draggingPersonId ? people.find((p) => p.id === draggingPersonId) : null;
  const previewScore = dragOver && draggingPerson ? estimateFit(draggingPerson, role, teamMapping) : null;

  const displayScore = assignedPerson ? estimateFit(assignedPerson, role, teamMapping) : null;
  const meta = displayScore != null ? fitMeta(displayScore) : null;
  const previewMeta = previewScore != null ? fitMeta(previewScore) : null;

  const borderClass = dragOver
    ? 'border-maroon shadow-[0_0_0_3px_rgba(67,56,202,0.15)]'
    : assignedPerson
      ? `border-2 ${meta.border}`
      : 'border-dashed border-lightgrey';

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(role.id); }}
      className={`group relative rounded-2xl border-2 transition-all duration-200 min-w-[175px] max-w-[200px] ${borderClass} ${
        assignedPerson ? meta.bg : dragOver ? 'bg-maroon/[0.03]' : 'bg-white'
      }`}
    >
      <button
        onClick={() => onViewDetail(role)}
        className="w-full text-left px-4 py-3.5"
        title="View role details"
      >
        <div className="flex items-start justify-between gap-1 mb-1">
          <p className="text-xs font-bold text-charcoal leading-snug">{role.name}</p>
          {role.isNew && (
            <span className="shrink-0 text-[9px] font-bold bg-gold/15 text-[#92620a] px-1.5 py-0.5 rounded-full">New</span>
          )}
        </div>
        <p className="text-[10px] text-charcoal/45 mb-2.5">{role.subTeam}</p>

        {assignedPerson ? (
          <div className="flex items-center gap-2">
            <Avatar name={assignedPerson.name} size={26} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-charcoal truncate">{assignedPerson.name.split(' ')[0]}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.pill}`}>
                {displayScore}%
              </span>
            </div>
          </div>
        ) : dragOver && previewMeta ? (
          <div className="flex items-center gap-1.5">
            <Avatar name={draggingPerson.name} size={26} className="opacity-60" />
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${previewMeta.pill}`}>
              ~{previewScore}%
            </span>
          </div>
        ) : (
          <p className="text-[10px] text-charcoal/25 font-semibold italic">Unassigned — click to view</p>
        )}
      </button>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {onGoToJD && (
          <button
            onClick={(e) => { e.stopPropagation(); onGoToJD(role.id); }}
            title="View job description"
            className="w-6 h-6 rounded-lg flex items-center justify-center text-maroon/60 hover:text-maroon hover:bg-maroon/10 transition-all duration-200 text-[9px] font-bold"
          >
            JD
          </button>
        )}
        {assignedPerson && (
          <button
            onClick={(e) => { e.stopPropagation(); onClear(role.id); }}
            title="Remove assignment"
            className="w-6 h-6 rounded-lg flex items-center justify-center text-charcoal/25 hover:text-red hover:bg-red/10 transition-all duration-200"
          >
            <XIcon width="10" height="10" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Recursive tree renderer ──────────────────────────────────────────────────

function OrgBranch({ role, allRoles, people, assignments, onDrop, onClear, draggingPersonId, onGoToJD, onViewDetail, teamMapping }) {
  const children = treeChildren(allRoles, role.id);
  return (
    <div className="flex flex-col items-center">
      <OrgDropNode
        role={role}
        people={people}
        assignments={assignments}
        onDrop={onDrop}
        onClear={onClear}
        draggingPersonId={draggingPersonId}
        onGoToJD={onGoToJD}
        onViewDetail={onViewDetail}
        teamMapping={teamMapping}
      />
      {children.length > 0 && (
        <>
          <div className="w-px h-5 bg-lightgrey" />
          <div className="flex items-start gap-4 relative">
            {children.length > 1 && (
              <div
                className="absolute top-0 h-px bg-lightgrey"
                style={{ left: '50%', right: '50%', width: 'calc(100% - 200px)', transform: 'translateX(-50%)' }}
              />
            )}
            {children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-5 bg-lightgrey" />
                <OrgBranch
                  role={child}
                  allRoles={allRoles}
                  people={people}
                  assignments={assignments}
                  onDrop={onDrop}
                  onClear={onClear}
                  draggingPersonId={draggingPersonId}
                  onGoToJD={onGoToJD}
                  onViewDetail={onViewDetail}
                  teamMapping={teamMapping}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Person card ──────────────────────────────────────────────────────────────

function PersonCard({ person, assignedTo, onDragStart, onDragEnd, targetOrg, teamMapping }) {
  const targetRole = assignedTo ? targetOrg?.find((r) => r.id === assignedTo) : null;
  const score = targetRole ? estimateFit(person, targetRole, teamMapping) : null;
  const meta = score != null ? fitMeta(score) : null;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(person.id)}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 rounded-xl px-3.5 py-3 border cursor-grab active:cursor-grabbing select-none transition-all duration-200 ${
        assignedTo
          ? 'border-lightgrey bg-offwhite opacity-70'
          : 'border-black/[0.04] bg-white shadow-[0_1px_2px_rgba(18,19,26,0.05)] hover:shadow-[0_4px_10px_rgba(18,19,26,0.1)]'
      }`}
    >
      <GripIcon className="text-charcoal/25 shrink-0" />
      <Avatar name={person.name} size={34} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-charcoal truncate">{person.name}</p>
        <p className="text-[11px] text-charcoal/45 truncate">{person.roleName}</p>
      </div>
      {targetRole && meta && (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${meta.pill}`}>
          {score}%
        </span>
      )}
      {!targetRole && (
        <span className="text-[10px] font-semibold text-charcoal/30 shrink-0">Unplaced</span>
      )}
    </div>
  );
}

// ─── Stat detail drawer ───────────────────────────────────────────────────────

function StatDetailDrawer({ type, assignments, targetOrg, people, fit, teamMapping, onClose }) {
  const rows = useMemo(() => {
    if (!targetOrg) return [];
    if (type === 'unplaced') {
      const placed = new Set(Object.values(assignments).filter(Boolean));
      return people
        .filter((p) => !placed.has(p.id))
        .map((person) => {
          const aiNote = fit?.unplaced?.find((u) => u.personId === person.id)
            || teamMapping?.unmatched?.find((u) => u.memberId === person.id || u.memberName === person.name);
          return { person, note: aiNote?.reason ?? null };
        });
    }
    return targetOrg
      .map((role) => {
        const personId = assignments[role.id];
        const person = personId ? people.find((p) => p.id === personId) : null;
        const score = person ? estimateFit(person, role, teamMapping) : null;
        return { role, person, score };
      })
      .filter(({ person, score }) => {
        if (type === 'filled') return person && score >= 70;
        if (type === 'reskilling') return person && score >= 40 && score < 70;
        if (type === 'gaps') return !person || score < 40;
        return false;
      });
  }, [type, assignments, targetOrg, people, fit, teamMapping]);

  const CONFIG = {
    filled: { title: 'Filled roles', subtitle: 'Roles covered with a strong match (70%+)', accent: 'text-green', border: 'border-green/20', bg: 'bg-green/[0.05]' },
    reskilling: { title: 'Reskilling needed', subtitle: 'People placed but need upskilling', accent: 'text-[#92620a]', border: 'border-gold/30', bg: 'bg-gold/[0.05]' },
    gaps: { title: 'Open gaps', subtitle: 'Roles with no assigned person or weak fit', accent: 'text-red', border: 'border-red/20', bg: 'bg-red/[0.05]' },
    unplaced: { title: 'People unplaced', subtitle: 'Team members not yet mapped to a target role', accent: 'text-maroon', border: 'border-maroon/20', bg: 'bg-maroon/[0.04]' },
  };
  const cfg = CONFIG[type];

  return (
    <div className={`animate-panel-in mt-4 mb-6 rounded-2xl border shadow-sm ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-inherit">
        <div>
          <p className={`text-sm font-extrabold ${cfg.accent}`}>{cfg.title}</p>
          <p className="text-xs text-charcoal/50 mt-0.5">{cfg.subtitle}</p>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-charcoal/40 hover:text-charcoal hover:bg-lightgrey/60 transition-colors shrink-0">
          <XIcon width="13" height="13" />
        </button>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.length === 0 && <p className="text-sm text-charcoal/45 col-span-full py-2">None right now — great work!</p>}
        {type === 'unplaced'
          ? rows.map(({ person, note }) => (
              <div key={person.id} className="flex items-start gap-3 rounded-xl bg-white px-4 py-3 border border-lightgrey/60">
                <Avatar name={person.name} size={36} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-charcoal">{person.name}</p>
                  <p className="text-[11px] text-charcoal/45 mb-1.5">{person.roleName}</p>
                  {note && <p className="text-[11px] text-charcoal/60 leading-relaxed">{note}</p>}
                </div>
              </div>
            ))
          : rows.map(({ role, person, score }) => {
              const meta = score != null ? fitMeta(score) : null;
              return (
                <div key={role.id} className="rounded-xl bg-white px-4 py-3 border border-lightgrey/60">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-charcoal leading-snug">{role.name}</p>
                    {role.isNew && <span className="shrink-0 text-[9px] font-bold bg-gold/15 text-[#92620a] px-1.5 py-0.5 rounded-full">New</span>}
                  </div>
                  <p className="text-[11px] text-charcoal/45 mb-2">{role.subTeam} · {role.headcount} seat</p>
                  {person && meta ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={person.name} size={26} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-charcoal truncate">{person.name}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${meta.pill}`}>{score}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red/10 flex items-center justify-center">
                        <XIcon width="10" height="10" className="text-red" />
                      </span>
                      <p className="text-xs text-charcoal/45 font-semibold">No one assigned</p>
                    </div>
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
}

function StatCards({ stats, assignments, targetOrg, people, fit, teamMapping }) {
  const [activeDetail, setActiveDetail] = useState(null);
  function toggle(key) { setActiveDetail((prev) => (prev === key ? null : key)); }

  const cards = [
    { key: 'filled', label: 'Filled', value: stats.filled, bg: 'bg-green/10', text: 'text-green', ring: 'ring-green/30' },
    { key: 'reskilling', label: 'Reskilling', value: stats.partial, bg: 'bg-gold/15', text: 'text-[#92620a]', ring: 'ring-gold/40' },
    { key: 'gaps', label: 'Gaps', value: stats.gaps, bg: 'bg-red/10', text: 'text-red', ring: 'ring-red/30' },
    { key: 'unplaced', label: 'Unplaced', value: stats.unplaced, bg: 'bg-maroon/10', text: 'text-maroon', ring: 'ring-maroon/30' },
  ];

  return (
    <div className="mb-6">
      <div className="flex gap-4 flex-wrap">
        {cards.map((c) => {
          const isActive = activeDetail === c.key;
          return (
            <button
              key={c.key}
              onClick={() => toggle(c.key)}
              className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 flex-1 min-w-[150px] text-left transition-all duration-200 ${c.bg} ${
                isActive ? `ring-2 ${c.ring} shadow-sm` : 'hover:brightness-95'
              }`}
            >
              <span className={`text-2xl font-extrabold leading-none ${c.text}`}>{c.value}</span>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-charcoal/70 block">{c.label}</span>
                <span className="text-[11px] text-charcoal/40">{isActive ? 'Click to close ↑' : 'Click to explore →'}</span>
              </div>
            </button>
          );
        })}
        <div className="flex items-center gap-3 rounded-2xl px-5 py-3 bg-charcoal/[0.04] flex-1 min-w-[150px]">
          <Donut size={44} thickness={6} segments={[
            { value: stats.filled, color: '#0d9488' },
            { value: stats.partial, color: '#f59e0b' },
            { value: stats.gaps, color: '#dc2626' },
          ]}>
            <span className="text-[11px] font-extrabold text-charcoal">{stats.filled}/{stats.total}</span>
          </Donut>
          <span className="text-sm font-semibold text-charcoal/70">Target roles covered</span>
        </div>
      </div>
      {activeDetail && (
        <StatDetailDrawer
          type={activeDetail}
          assignments={assignments}
          targetOrg={targetOrg}
          people={people}
          fit={fit}
          teamMapping={teamMapping}
          onClose={() => setActiveDetail(null)}
        />
      )}
    </div>
  );
}

// ─── Apply confirmation banner ────────────────────────────────────────────────

function ApplyBanner({ assignments, people, targetOrg, onApply, onDismiss }) {
  const filledCount = Object.keys(assignments).length;
  return (
    <div className="mb-4 rounded-2xl bg-green/[0.06] border border-green/20 px-5 py-3.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-green/10 text-green flex items-center justify-center shrink-0">
          <CheckIcon width="14" height="14" />
        </span>
        <p className="text-sm font-semibold text-charcoal">
          AI has placed {filledCount} of {targetOrg.length} roles. Apply to update Mission &amp; Org and sync the whole platform?
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onApply}
          className="inline-flex items-center gap-2 bg-green text-white rounded-xl px-4 py-2 text-sm font-bold hover:brightness-110 transition-colors"
        >
          <CheckIcon width="13" height="13" />
          Apply &amp; Sync
        </button>
        <button onClick={onDismiss} className="text-xs text-charcoal/45 px-3 py-2 hover:text-charcoal/70">Dismiss</button>
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TeamFitScreen({ targetOrg, teamRoles = [], workflowData, onNavigate, onGoToJD, onApplyAssignments, onOrgUpdated }) {
  const fit = computeTeamFit(targetOrg);
  const teamMapping = workflowData?.teamMapping;
  const people = useMemo(() => rolesToPeople(teamRoles), [teamRoles]);

  const aiAssignments = useMemo(
    () => buildAIAssignments(targetOrg, people, teamMapping),
    [targetOrg, people, teamMapping],
  );

  // Restore saved assignments; otherwise seed from the AI team-mapping result
  // so the page opens with the workflow's real placements, not zeros.
  const savedAssignments = workflowData?.teamFitAssignments;
  const [assignments, setAssignments] = useState(() => {
    if (savedAssignments) return savedAssignments;
    const seeded = buildAssignmentsFromMapping(targetOrg, people, teamMapping);
    return Object.keys(seeded).length > 0 ? seeded : aiAssignments;
  });
  const [draggingPersonId, setDraggingPersonId] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showApplyBanner, setShowApplyBanner] = useState(false);

  // Every assignment change is persisted (after commit, never mid-render),
  // so the org stays in sync across reloads and everywhere else it appears.
  const applyAssignments = setAssignments;
  const skipFirstPersistRef = useRef(true);
  useEffect(() => {
    if (skipFirstPersistRef.current) { skipFirstPersistRef.current = false; return; }
    onApplyAssignments?.(assignments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments]);

  const personRoleMap = useMemo(() => {
    const m = {};
    Object.entries(assignments).forEach(([roleId, personId]) => {
      if (personId) m[personId] = roleId;
    });
    return m;
  }, [assignments]);

  // Live stats — recalculated on every assignment change
  const stats = useMemo(
    () => computeFitStats(targetOrg, people, assignments, teamMapping),
    [assignments, targetOrg, people, teamMapping],
  );

  const handleDrop = useCallback((targetRoleId) => {
    if (!draggingPersonId) return;
    applyAssignments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((rid) => { if (next[rid] === draggingPersonId) delete next[rid]; });
      next[targetRoleId] = draggingPersonId;
      return next;
    });
    setDraggingPersonId(null);
  }, [draggingPersonId, applyAssignments]);

  const handleClear = useCallback((roleId) => {
    applyAssignments((prev) => { const next = { ...prev }; delete next[roleId]; return next; });
  }, [applyAssignments]);

  function handleApplyAI() {
    applyAssignments(aiAssignments);
    setShowApplyBanner(true);
  }

  function handleClearAll() {
    applyAssignments({});
    setShowApplyBanner(false);
  }

  function handleApplyAndSync() {
    onApplyAssignments?.(assignments);
    setShowApplyBanner(false);
  }

  function handleViewDetail(role) {
    const personId = assignments[role.id];
    const person = personId ? people.find((p) => p.id === personId) : null;
    const score = person ? estimateFit(person, role, teamMapping) : null;
    setSelectedRole({ role, person, score });
  }

  if (!fit || !targetOrg) {
    return (
      <div className="max-w-[1240px]">
        <PageHeader title="Team Fit" subtitle="Define your mission first to get a target org chart" />
        <PrimaryButton onClick={() => onNavigate('mission')}>
          <SparkleIcon />
          Start with your mission
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="max-w-[1540px]">
      <PageHeader
        title="Team Fit"
        subtitle="Drag your people onto the target org — or let AI place them. Click any role to see details."
        action={people.length > 0 ? (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleClearAll}
              className="text-xs font-bold text-charcoal/50 border border-lightgrey rounded-xl px-3.5 py-2.5 hover:bg-lightgrey/50 transition-colors duration-200"
            >
              Clear all
            </button>
            <button
              onClick={handleApplyAI}
              className="inline-flex items-center gap-2 bg-maroon text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-maroon-dark transition-colors duration-200 shadow-[0_4px_12px_rgba(67,56,202,0.25)]"
            >
              <SparkleIcon width="14" height="14" />
              Apply AI suggestions
            </button>
          </div>
        ) : null}
      />

      {showApplyBanner && (
        <ApplyBanner
          assignments={assignments}
          people={people}
          targetOrg={targetOrg}
          onApply={handleApplyAndSync}
          onDismiss={() => setShowApplyBanner(false)}
        />
      )}

      {people.length > 0 ? (
        <StatCards stats={stats} assignments={assignments} targetOrg={targetOrg} people={people} fit={fit} teamMapping={teamMapping} />
      ) : (
        <div className="rounded-2xl bg-maroon/[0.04] border border-maroon/10 px-5 py-4 mb-6 flex items-start gap-3">
          <span className="w-8 h-8 rounded-lg bg-maroon/10 text-maroon flex items-center justify-center shrink-0 mt-0.5">
            <SparkleIcon width="14" height="14" />
          </span>
          <div>
            <p className="text-sm font-bold text-charcoal mb-0.5">Your target org chart is ready</p>
            <p className="text-xs text-charcoal/55 leading-relaxed">
              Add your current roles from the Dashboard — they'll appear on the left so you can drag them onto each position.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-5 items-start">
        {/* Left: Current Team */}
        <div className="w-[240px] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-charcoal">Your Team</h2>
            <span className="text-[11px] text-charcoal/45">{people.length} role{people.length !== 1 ? 's' : ''}</span>
          </div>
          {people.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-lightgrey bg-white px-4 py-6 text-center">
              <p className="text-xs font-bold text-charcoal/50 mb-1">No roles yet</p>
              <p className="text-[11px] text-charcoal/35 leading-relaxed mb-3">
                Add and analyse roles from the Dashboard first.
              </p>
              {onNavigate && (
                <button onClick={() => onNavigate('home')} className="text-[11px] font-bold text-maroon hover:text-maroon-dark">
                  Go to Dashboard →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {people.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  assignedTo={personRoleMap[person.id] || null}
                  targetOrg={targetOrg}
                  teamMapping={teamMapping}
                  onDragStart={setDraggingPersonId}
                  onDragEnd={() => setDraggingPersonId(null)}
                />
              ))}
            </div>
          )}
          {people.length > 0 && (
            <div className="mt-5 pt-4 border-t border-lightgrey/70">
              <p className="text-[11px] text-charcoal/45 font-semibold mb-2">Legend</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Strong fit (70%+)', color: '#0d9488' },
                  { label: 'Partial fit (40–69%)', color: '#f59e0b' },
                  { label: 'Weak fit (<40%)', color: '#dc2626' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                    <span className="text-[11px] text-charcoal/55">{l.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-charcoal/35 mt-3">Click any role card to see full details</p>
            </div>
          )}
        </div>

        {/* Right: Target Org */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-charcoal">Target Org Chart</h2>
            <span className="text-[11px] text-charcoal/45">
              {targetOrg.length} roles · click a role card for details
            </span>
          </div>
          <Card className="overflow-x-auto !p-6">
            <div className="min-w-max py-2 flex justify-center">
              {treeRoots(targetOrg)[0] && (
                <OrgBranch
                  role={treeRoots(targetOrg)[0]}
                  allRoles={targetOrg}
                  people={people}
                  assignments={assignments}
                  onDrop={handleDrop}
                  onClear={handleClear}
                  draggingPersonId={draggingPersonId}
                  onGoToJD={onGoToJD}
                  onViewDetail={handleViewDetail}
                  teamMapping={teamMapping}
                />
              )}
            </div>
          </Card>

          {fit.unplaced.length > 0 && (
            <Card className="mt-4 !p-5">
              <SectionTitle className="!mb-3">
                <span className="flex items-center gap-2">
                  <SparkleIcon width="15" height="15" className="text-maroon" />
                  AI note on unplaced people
                </span>
              </SectionTitle>
              <div className="space-y-3">
                {fit.unplaced.map((u) => (
                  <div key={u.personId} className="flex items-start gap-3 rounded-xl bg-offwhite p-4">
                    <Avatar name={u.person?.name} size={36} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-charcoal mb-0.5">{u.person?.name}</p>
                      <p className="text-xs text-charcoal/60 leading-relaxed">{u.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Role detail drawer */}
      {selectedRole && (
        <RoleDetailDrawer
          role={selectedRole.role}
          person={selectedRole.person}
          score={selectedRole.score}
          people={people}
          onClose={() => setSelectedRole(null)}
        />
      )}
    </div>
  );
}
