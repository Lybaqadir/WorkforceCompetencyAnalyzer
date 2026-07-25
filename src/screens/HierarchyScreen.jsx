import { useState } from 'react';
import { Avatar, Card, PageHeader, VerdictPill } from '../components/ui';
import { rootRoles, childrenOf, roleById, peopleByRole, allPeople } from '../data/teamData';
import MiniOrgChart from '../components/MiniOrgChart';

function RoleCard({ role, expanded, onToggle }) {
  const people = peopleByRole[role.id] || [];
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onToggle}
        className="text-left bg-white rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(18,19,26,0.04),0_8px_24px_rgba(18,19,26,0.06)] border border-black/[0.03] transition-all duration-200 hover:shadow-[0_8px_20px_rgba(18,19,26,0.1)] w-[220px]"
      >
        <p className="font-bold text-charcoal text-sm leading-snug mb-2">{role.name}</p>
        <div className="flex items-center justify-between">
          <VerdictPill verdict={role.verdict} />
          <span className="text-[11px] text-charcoal/40">
            {people.length} {people.length === 1 ? 'person' : 'people'}
          </span>
        </div>
      </button>

      {expanded && people.length > 0 && (
        <div className="mt-2 w-[220px] bg-offwhite rounded-xl p-3 space-y-2">
          {people.map((p) => (
            <div key={p.id} className="flex items-center gap-2.5">
              <Avatar name={p.name} size={28} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-charcoal truncate">{p.name}</p>
                <p className="text-[11px] text-charcoal/45 truncate">{p.tenure} in role</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoleNode({ roleId, expandedRoleId, onToggle }) {
  const role = roleById(roleId);
  const children = childrenOf(roleId);
  if (!role) return null;

  return (
    <div className="flex flex-col items-center">
      <RoleCard role={role} expanded={expandedRoleId === roleId} onToggle={() => onToggle(roleId)} />
      {children.length > 0 && (
        <>
          <div className="w-px h-6 bg-lightgrey" />
          <div className="flex items-start">
            {children.map((child, i) => (
              <div key={child.id} className="relative flex-1 flex flex-col items-center pt-6 px-4">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-6 bg-lightgrey" />
                {i > 0 && <div className="absolute top-0 left-0 right-1/2 h-px bg-lightgrey" />}
                {i < children.length - 1 && (
                  <div className="absolute top-0 left-1/2 right-0 h-px bg-lightgrey" />
                )}
                <RoleNode roleId={child.id} expandedRoleId={expandedRoleId} onToggle={onToggle} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ViewToggle({ view, onChange, targetDisabled }) {
  const options = [
    { id: 'current', label: 'Current org' },
    { id: 'target', label: 'Target org' },
  ];
  return (
    <div className="inline-flex rounded-xl bg-lightgrey p-1">
      {options.map((opt) => {
        const disabled = opt.id === 'target' && targetDisabled;
        return (
          <button
            key={opt.id}
            onClick={() => !disabled && onChange(opt.id)}
            disabled={disabled}
            title={disabled ? 'Define your mission first to get a target org' : undefined}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 ${
              view === opt.id
                ? 'bg-white text-charcoal shadow-sm'
                : disabled
                  ? 'text-charcoal/25 cursor-not-allowed'
                  : 'text-charcoal/55 hover:text-charcoal'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function HierarchyScreen({ targetOrg }) {
  const [expandedRoleId, setExpandedRoleId] = useState(null);
  const [view, setView] = useState('current');
  const [selectedTargetRole, setSelectedTargetRole] = useState(null);
  const root = rootRoles()[0];
  const showTarget = view === 'target' && targetOrg;

  function toggle(roleId) {
    setExpandedRoleId((prev) => (prev === roleId ? null : roleId));
  }

  const mappedNames = (role) =>
    (role.mappedPeople || [])
      .map((id) => allPeople().find((p) => p.id === id)?.name)
      .filter(Boolean);

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        title="Org Hierarchy"
        subtitle={showTarget ? 'The org this team is growing into — click a role for detail' : 'Click any role to see the people in it'}
        action={<ViewToggle view={view} onChange={setView} targetDisabled={!targetOrg} />}
      />

      {showTarget ? (
        <>
          <Card className="overflow-x-auto">
            <div className="py-4 px-6">
              <MiniOrgChart
                roles={targetOrg}
                selectedId={selectedTargetRole?.id}
                onSelect={(role) =>
                  setSelectedTargetRole((prev) => (prev?.id === role.id ? null : role))
                }
              />
            </div>
          </Card>
          {selectedTargetRole && (
            <Card className="mt-5">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-base font-bold text-charcoal">{selectedTargetRole.name}</h2>
                {selectedTargetRole.isNew && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gold/15 text-[#92620a]">
                    New role
                  </span>
                )}
              </div>
              <p className="text-sm text-charcoal/70 leading-relaxed mb-2">
                {selectedTargetRole.rationale}
              </p>
              <p className="text-xs text-charcoal/50">
                {mappedNames(selectedTargetRole).length > 0
                  ? `Mapped from your current team: ${mappedNames(selectedTargetRole).join(', ')}`
                  : 'No one on the current team is mapped to this role yet.'}
              </p>
            </Card>
          )}
        </>
      ) : (
        <Card className="overflow-x-auto">
          <div className="flex justify-center py-4 min-w-max px-6">
            {root ? (
              <RoleNode roleId={root.id} expandedRoleId={expandedRoleId} onToggle={toggle} />
            ) : (
              <p className="text-sm text-charcoal/50">No roles to show yet.</p>
            )}
          </div>
        </Card>
      )}

    </div>
  );
}
