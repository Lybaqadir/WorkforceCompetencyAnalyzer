import { useLayoutEffect, useRef, useState } from 'react';
import { PROFICIENCY_LEVELS } from '../data/missionData';
import { CheckIcon, PersonIcon, XIcon } from './icons';

// Renders any roles array shaped like { id, name, reportsTo, ... } as a tree.
// Works standalone (chat bubbles, hierarchy view) or with a `fit` result from
// computeTeamFit, which tints each node by filled / partial / gap status.

const FIT_STYLES = {
  filled: { border: 'border-green/40', badge: 'bg-green/10 text-green', label: 'Filled' },
  partial: { border: 'border-gold/60', badge: 'bg-gold/15 text-[#92620a]', label: 'Reskill' },
  gap: { border: 'border-red/40', badge: 'bg-red/10 text-red', label: 'Gap' },
};

// BFS traversal order so every card gets a stable stagger delay index.
function bfsDelayMap(roles) {
  const map = {};
  const queue = roles.filter((r) => !r.reportsTo);
  let i = 0;
  while (queue.length > 0) {
    const node = queue.shift();
    map[node.id] = i++;
    roles.filter((r) => r.reportsTo === node.id).forEach((c) => queue.push(c));
  }
  return map;
}

function OrgNodeCard({ role, fitRow, assignedName, compact, selected, onSelect, animDelay }) {
  const fitStyle = fitRow ? FIT_STYLES[fitRow.status] : null;
  const width = compact ? 'w-[170px]' : 'w-[220px]';

  const card = (
    <div
      className={`animate-node-pop text-left bg-white rounded-2xl ${compact ? 'px-3.5 py-3' : 'px-5 py-4'} shadow-[0_1px_2px_rgba(18,19,26,0.04),0_8px_24px_rgba(18,19,26,0.06)] border ${
        fitStyle ? `border-2 ${fitStyle.border}` : 'border-black/[0.03]'
      } ${selected ? 'ring-2 ring-maroon/40' : ''} ${
        onSelect ? 'transition-all duration-200 hover:shadow-[0_8px_20px_rgba(18,19,26,0.1)] cursor-pointer' : ''
      } ${width}`}
      style={animDelay !== undefined ? { animationDelay: `${animDelay}ms` } : undefined}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className={`font-bold text-charcoal ${compact ? 'text-xs' : 'text-sm'} leading-snug`}>
          {role.name}
        </p>
        {role.isNew && (
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/15 text-[#92620a]">
            New role
          </span>
        )}
      </div>
      <p className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-charcoal/45 mb-2`}>
        {role.subTeam} · {role.headcount} {role.headcount === 1 ? 'seat' : 'seats'}
      </p>

      {!compact && role.skills && (
        <div className="flex flex-wrap gap-1 mb-1">
          {role.skills.map((s) => (
            <span
              key={s.name}
              title={`${s.name} — ${PROFICIENCY_LEVELS[s.level]?.label ?? s.level}`}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                PROFICIENCY_LEVELS[s.level]?.className ?? 'bg-lightgrey text-charcoal/60'
              }`}
            >
              {s.name}
              <span className="font-extrabold">{s.level}</span>
            </span>
          ))}
        </div>
      )}

      {fitRow && (
        <div className="mt-2 pt-2 border-t border-lightgrey/70">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${fitStyle.badge}`}>
            {fitRow.status === 'filled' && <CheckIcon width="10" height="10" />}
            {fitStyle.label}
          </span>
          {fitRow.assigned.map((a) => (
            <div key={a.personId} className="flex items-center gap-1.5 mt-1.5">
              <span className="w-5 h-5 rounded-full bg-maroon/10 text-maroon flex items-center justify-center shrink-0">
                <PersonIcon width="11" height="11" />
              </span>
              <p className="text-[11px] font-semibold text-charcoal truncate">{a.person?.name}</p>
              <span className="text-[10px] text-charcoal/40 shrink-0">{a.matchScore}%</span>
            </div>
          ))}
          {fitRow.assigned.length === 0 && (
            <p className="text-[10px] text-charcoal/45 mt-1">No one on the team fits yet</p>
          )}
        </div>
      )}
      {!fitRow && assignedName && (
        <div className="mt-2 pt-2 border-t border-lightgrey/70 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-green/10 text-green flex items-center justify-center shrink-0">
            <PersonIcon width="11" height="11" />
          </span>
          <p className="text-[11px] font-semibold text-charcoal truncate">{assignedName}</p>
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green/10 text-green">Assigned</span>
        </div>
      )}
      {!fitRow && !assignedName && (
        <p className="text-[10px] text-charcoal/30 mt-1.5 italic">Vacant</p>
      )}
    </div>
  );

  if (onSelect) {
    return (
      <button onClick={() => onSelect(role)} className="text-left">
        {card}
      </button>
    );
  }
  return card;
}

function OrgNode({ role, roles, fit, assignmentMap, compact, selectedId, onSelect, delayMap, panelDelay = 0 }) {
  const children = roles.filter((r) => r.reportsTo === role.id);
  const fitRow = fit?.rows.find((r) => r.role.id === role.id);
  const nodeDelay = delayMap ? panelDelay + (delayMap[role.id] ?? 0) * 80 : undefined;
  const assignedName = assignmentMap ? assignmentMap[role.id] : undefined;

  return (
    <div className="flex flex-col items-center">
      <OrgNodeCard
        role={role}
        fitRow={fitRow}
        assignedName={assignedName}
        compact={compact}
        selected={selectedId === role.id}
        onSelect={onSelect}
        animDelay={nodeDelay}
      />
      {children.length > 0 && (
        <>
          <div className="w-px h-9 bg-lightgrey" />
          <div className="flex items-start">
            {children.map((child, i) => (
              <div key={child.id} className={`relative flex-1 flex flex-col items-center pt-9 ${compact ? 'px-2.5' : 'px-4'}`}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-9 bg-lightgrey" />
                {i > 0 && <div className="absolute top-0 left-0 right-1/2 h-px bg-lightgrey" />}
                {i < children.length - 1 && (
                  <div className="absolute top-0 left-1/2 right-0 h-px bg-lightgrey" />
                )}
                <OrgNode
                  role={child}
                  roles={roles}
                  fit={fit}
                  assignmentMap={assignmentMap}
                  compact={compact}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  delayMap={delayMap}
                  panelDelay={panelDelay}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Scales its content down (never up) so the whole tree is visible without
// horizontal scrolling — used for org charts inside chat bubbles.
function FitToWidth({ children }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(undefined);

  useLayoutEffect(() => {
    const measure = () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;
      const s = Math.min(1, outer.clientWidth / Math.max(inner.scrollWidth, 1));
      setScale(s);
      setHeight(inner.scrollHeight * s);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div ref={outerRef} className="w-full overflow-hidden" style={{ height }}>
      <div
        ref={innerRef}
        className="inline-block"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {children}
      </div>
    </div>
  );
}

export default function MiniOrgChart({ roles, fit, assignmentMap, compact = false, selectedId, onSelect, fitWidth = false, animate = false, panelDelay = 0 }) {
  const rootNodes = roles.filter((r) => !r.reportsTo);
  const delayMap = animate ? bfsDelayMap(roles) : null;
  const tree = (
    <div className="flex justify-center gap-8 py-2 min-w-max px-2">
      {rootNodes.map((root) => (
        <OrgNode
          key={root.id}
          role={root}
          roles={roles}
          fit={fit}
          assignmentMap={assignmentMap}
          compact={compact}
          selectedId={selectedId}
          onSelect={onSelect}
          delayMap={delayMap}
          panelDelay={panelDelay}
        />
      ))}
    </div>
  );

  if (fitWidth) return <FitToWidth>{tree}</FitToWidth>;
  return <div className="overflow-x-auto">{tree}</div>;
}

// Detail panel for a selected role — used by OrgChartExplorer in the chat flow.
function RoleDetailPanel({ role, onClose }) {
  return (
    <div className="animate-panel-in bg-white rounded-2xl border border-maroon/20 shadow-[0_8px_24px_rgba(18,19,26,0.08)] p-4 text-left">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-charcoal">{role.name}</p>
          {role.isNew && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/15 text-[#92620a]">
              New role
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-charcoal/40 hover:text-charcoal hover:bg-lightgrey/60 transition-colors"
            title="Close details"
          >
            <XIcon width="13" height="13" />
          </button>
        )}
      </div>
      <p className="text-[11px] text-charcoal/45 mb-2.5">
        {role.subTeam} · {role.headcount} {role.headcount === 1 ? 'seat' : 'seats'}
        {role.category ? ` · ${role.category}` : ''}
      </p>

      {role.rationale && (
        <div className="rounded-xl bg-offwhite px-3.5 py-2.5 mb-3">
          <p className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wide mb-1">
            Why this role
          </p>
          <p className="text-xs text-charcoal/75 leading-relaxed">{role.rationale}</p>
        </div>
      )}

      {role.skills && role.skills.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wide mb-1.5">
            Key skills required
          </p>
          <div className="flex flex-wrap gap-1.5">
            {role.skills.map((s) => (
              <span
                key={s.name}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  PROFICIENCY_LEVELS[s.level]?.className ?? 'bg-lightgrey text-charcoal/60'
                }`}
              >
                {s.name}
                <span className="font-extrabold opacity-70">
                  {PROFICIENCY_LEVELS[s.level]?.label ?? s.level}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {role.externalPartners && role.externalPartners.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wide mb-1.5">
            Ecosystem partners
          </p>
          <div className="flex flex-wrap gap-1.5">
            {role.externalPartners.map((p) => (
              <span
                key={p}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-lightgrey text-charcoal/60"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Small placeholder shown in the chat bubble while the full org chart is
// displayed as a large panel alongside the chat.
export function OrgChartChatHint({ roles }) {
  const newRoles = roles.filter((r) => r.isNew).length;
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-maroon/[0.06] px-4 py-3 border border-maroon/15">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-maroon shrink-0">
        <circle cx="12" cy="5" r="2.5" /><circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="19" r="2.5" />
        <path d="M12 7.5v4M12 11.5H6v5M12 11.5h6v5" />
      </svg>
      <p className="text-xs font-semibold text-maroon">
        {roles.length} roles · {newRoles} new — see the full chart →
      </p>
    </div>
  );
}

// Full-page interactive org chart panel — rendered alongside the chat,
// not inside it. Cards animate in with a staggered pop, role cards are
// clickable and open a detail side-panel.
export function OrgChartReveal({ roles, animKey }) {
  const [selected, setSelected] = useState(null);
  const newRoles = roles.filter((r) => r.isNew).length;
  const delayMap = bfsDelayMap(roles);
  const PANEL_DELAY = 250; // ms — cards start after the panel slides in

  const handleSelect = (role) => setSelected((prev) => (prev?.id === role.id ? null : role));

  return (
    <div
      key={animKey}
      className="animate-org-reveal flex-1 min-w-0 flex flex-col bg-white/[0.08] backdrop-blur-sm rounded-3xl border border-white/15 overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-7 py-5 border-b border-white/10">
        <div>
          <p className="text-base font-extrabold text-white tracking-tight">Target org chart</p>
          <p className="text-[12px] text-white/50 mt-0.5">
            {roles.length} roles · {newRoles} new — <span className="text-gold font-semibold">click any card to explore it</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/12">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-[11px] font-bold text-white/70">Live</span>
          </div>
        </div>
      </div>

      {/* Chart + detail split */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Tree canvas */}
        <div className="flex-1 min-w-0 overflow-auto p-8">
          <div className="flex justify-center gap-8 py-2 min-w-max px-2">
            {roles.filter((r) => !r.reportsTo).map((root) => (
              <OrgNode
                key={root.id}
                role={root}
                roles={roles}
                fit={null}
                compact={false}
                selectedId={selected?.id}
                onSelect={handleSelect}
                delayMap={delayMap}
                panelDelay={PANEL_DELAY}
              />
            ))}
          </div>
        </div>

        {/* Detail side panel — slides in when a role is selected */}
        {selected && (
          <div className="animate-panel-in w-[300px] shrink-0 border-l border-white/10 overflow-y-auto p-5 bg-white/[0.05]">
            <RoleDetailPanel role={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="shrink-0 flex items-center gap-4 px-7 py-3 border-t border-white/10 bg-white/[0.03]">
        <p className="text-[10px] text-white/35 uppercase font-bold tracking-wider">Roles</p>
        {[
          { label: 'Existing', dot: 'bg-white/40' },
          { label: 'New role', dot: 'bg-gold' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
            <span className="text-[11px] text-white/50 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// One objective as a scannable KPI tile: big highlighted number, then the
// commitment it stands for. `objective` is the structured shape from
// missionData ({ kpi, kpiHint, title, detail }).
export function ObjectiveTile({ objective, compact = false }) {
  // The KPI can be a short number ("4") or a whole word ("Monthly") — scale
  // the type down so it always fits inside its badge instead of overflowing.
  const kpi = String(objective.kpi ?? '✓');
  const kpiSize =
    kpi.length > 8 ? 'text-[11px]' : kpi.length > 4 ? 'text-sm' : compact ? 'text-lg' : 'text-xl';

  return (
    <div className={`flex items-start gap-3 rounded-xl bg-offwhite ${compact ? 'p-3' : 'p-4'} h-full`}>
      <div
        className={`shrink-0 ${compact ? 'w-16' : 'w-[74px]'} overflow-hidden flex flex-col items-center justify-center rounded-lg bg-maroon/[0.07] px-1 ${compact ? 'py-1.5' : 'py-2'}`}
      >
        <span className={`${kpiSize} font-extrabold text-maroon leading-tight text-center break-words w-full`}>
          {kpi}
        </span>
        {objective.kpiHint && (
          <span className="text-[9px] font-bold text-maroon/60 uppercase tracking-wide mt-1 text-center leading-tight line-clamp-2 w-full">
            {objective.kpiHint}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-charcoal leading-snug`}>
          {objective.title}
        </p>
        <p className={`${compact ? 'text-[11px]' : 'text-xs'} text-charcoal/55 leading-snug mt-1`}>
          {objective.detail}
        </p>
      </div>
    </div>
  );
}

export function MissionCard({ statement, objectives, teamName, compact = false }) {
  return (
    <div className={`bg-white rounded-2xl ${compact ? 'p-4' : 'p-6'} border border-black/[0.05] shadow-[0_1px_2px_rgba(18,19,26,0.04)]`}>
      {teamName && (
        <p className="text-xs font-bold text-maroon uppercase tracking-wider mb-2">{teamName}</p>
      )}
      <p className={`${compact ? 'text-sm' : 'text-base'} text-charcoal font-semibold leading-relaxed mb-3.5`}>
        {statement}
      </p>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green">
          <CheckIcon width="13" height="13" />
        </span>
        <p className="text-[11px] font-bold text-charcoal/50 uppercase tracking-wide">
          What success looks like
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {objectives.map((obj) => (
          <ObjectiveTile key={obj.id} objective={obj} compact />
        ))}
      </div>
    </div>
  );
}
