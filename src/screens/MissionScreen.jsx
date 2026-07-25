import { Card, PageHeader, PrimaryButton, SectionTitle } from '../components/ui';
import { SparkleIcon, ArrowRightIcon } from '../components/icons';
import MiniOrgChart, { ObjectiveTile } from '../components/MiniOrgChart';

export default function MissionScreen({ mission, targetOrg, workflowData, teamRoles, onRerun, onNavigate }) {
  if (!mission) {
    return (
      <div className="max-w-[1240px]">
        <PageHeader title="Mission & Org" subtitle="No mission defined yet" />
        <PrimaryButton onClick={onRerun}>
          <SparkleIcon />
          Start team setup
        </PrimaryButton>
      </div>
    );
  }

  // Build assignment map from teamFitAssignments or teamMapping
  const assignmentMap = {};
  const assignments = workflowData?.teamFitAssignments;
  const teamMapping = workflowData?.teamMapping;

  if (assignments && targetOrg) {
    // assignments is { roleId: personId }
    Object.entries(assignments).forEach(([roleId, personId]) => {
      const member = (workflowData?.teamMembers || []).find((m) => m.id === personId)
        || (teamRoles || []).find((r) => r.id === personId);
      if (member) assignmentMap[roleId] = member.name;
    });
  } else if (teamMapping?.matched && targetOrg) {
    teamMapping.matched.forEach((m) => {
      const roleId = m.targetRoleId || targetOrg.find((r) => r.name === m.targetRoleName)?.id;
      if (roleId) assignmentMap[roleId] = m.memberName;
    });
  }

  return (
    <div className="max-w-[1240px]">
      <PageHeader
        title={mission.teamName || 'Mission & Org'}
        subtitle="Your approved mission and target organisation"
      />

      {/* Mission hero */}
      <div className="rounded-2xl bg-gradient-to-r from-navy to-maroon px-7 py-6 mb-5">
        <p className="text-[11px] font-bold text-gold uppercase tracking-widest mb-2.5">Mission Statement</p>
        <p className="text-base md:text-lg font-semibold text-white/95 leading-relaxed max-w-3xl">{mission.statement}</p>
        {mission.teamName && (
          <p className="text-xs text-white/45 mt-3">{mission.teamName} · {mission.objectives?.length ?? 0} objectives · {mission.constraints?.length ?? 0} constraints addressed</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        {/* Objectives */}
        <Card className="col-span-2">
          <SectionTitle>Objectives</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {mission.objectives.map((obj) => (
              <ObjectiveTile key={obj.id} objective={obj} />
            ))}
          </div>
        </Card>

        {/* Constraints */}
        <Card>
          <SectionTitle>Constraints</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {mission.constraints.map((c) => (
              <div key={c} className="flex items-start gap-2.5 rounded-xl bg-red/[0.05] px-4 py-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red mt-1.5 shrink-0" />
                <p className="text-sm text-charcoal/75 leading-snug">{c}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {targetOrg && (
        <Card>
          <SectionTitle
            action={
              <PrimaryButton onClick={() => onNavigate('teamfit')} className="!py-2 !px-3 text-xs">
                Team fit
                <ArrowRightIcon width="14" height="14" />
              </PrimaryButton>
            }
          >
            Target org chart
          </SectionTitle>
          {Object.keys(assignmentMap).length > 0 && (
            <p className="text-xs text-charcoal/50 mb-4">
              Showing team assignments from Team Fit — {Object.keys(assignmentMap).length} of {targetOrg.length} roles filled.
            </p>
          )}
          <MiniOrgChart roles={targetOrg} assignmentMap={assignmentMap} />
        </Card>
      )}
    </div>
  );
}
