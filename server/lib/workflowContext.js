// Single place that turns the stored workflow state into the context every AI
// stage sees. Each stage after Team Collection builds on the same uploaded
// roster, so the roster block is always emitted — including when it is empty,
// where an explicit marker stops the model quietly inventing a team to analyse.

// The order stages run in. Used to decide which prior outputs a stage inherits.
const STAGE_ORDER = [
  'team-mapping',
  'skills-analysis',
  'gap-analysis',
  'recommendations',
  'future-planning',
];

// Prior-stage outputs, in the order they are produced.
const PRIOR_OUTPUTS = [
  { key: 'teamMapping', producedBy: 'team-mapping', label: 'TEAM MAPPING RESULTS' },
  { key: 'skillsAnalysis', producedBy: 'skills-analysis', label: 'SKILLS ANALYSIS RESULTS' },
  { key: 'gapAnalysis', producedBy: 'gap-analysis', label: 'GAP ANALYSIS RESULTS' },
  { key: 'recommendations', producedBy: 'recommendations', label: 'RECOMMENDATIONS' },
  { key: 'futurePlanning', producedBy: 'future-planning', label: 'FUTURE WORKFORCE PLAN' },
];

/**
 * Normalise an uploaded team member into the shape every prompt sees.
 * Members arrive from two paths — CV extraction and the chat tool call — which
 * populate slightly different fields; this makes them indistinguishable
 * downstream so a chat-entered person is never analysed more thinly than an
 * uploaded CV.
 */
function normaliseMember(member, index) {
  const name = (member?.name || '').trim() || `Unnamed member ${index + 1}`;
  const skills = [
    ...(member?.skills || []),
    ...(member?.technicalSkills || []),
    ...(member?.softSkills || []),
  ]
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);

  return {
    id: member?.id || name.toLowerCase().replace(/\s+/g, '-'),
    name,
    currentRole: member?.currentRole || 'Not stated',
    experience: member?.experience || 'Not stated',
    education: member?.education || 'Not stated',
    certifications: member?.certifications || [],
    technicalSkills: member?.technicalSkills || [],
    softSkills: member?.softSkills || [],
    // De-duplicated union of every skill field — what the stages actually reason over
    skills: [...new Set(skills)],
  };
}

function normaliseTeam(teamMembers) {
  return (teamMembers || []).filter(Boolean).map(normaliseMember);
}

function missionSection(mission) {
  if (!mission) return null;
  return `MISSION:
Team: ${mission.teamName || 'Not stated'}
Statement: ${mission.statement || ''}
Purpose: ${mission.purpose || ''}
Objectives: ${JSON.stringify(mission.objectives || [], null, 2)}
Constraints: ${JSON.stringify(mission.constraints || [], null, 2)}`;
}

function targetOrgSection(targetOrg) {
  if (!targetOrg || targetOrg.length === 0) return null;
  const roles = targetOrg.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.subTeam,
    category: r.category,
    headcount: r.headcount,
    reportsTo: r.reportsTo,
    rationale: r.rationale,
    skills: (r.skills || []).map((s) => s.name || s),
    externalPartners: r.externalPartners?.length ? r.externalPartners : undefined,
  }));
  return `TARGET ORGANISATION STRUCTURE (${roles.length} target roles):
${JSON.stringify(roles, null, 2)}`;
}

/**
 * The roster block. Always emitted — an absent block reads to the model as
 * "no constraint on who exists", which is exactly how invented employees get in.
 */
function teamSection(team) {
  if (team.length === 0) {
    return `CURRENT TEAM MEMBERS:
NO TEAM MEMBERS HAVE BEEN UPLOADED. This organisation currently has zero staff. Every target role is unfilled. Do not invent people to analyse — say plainly that there is no existing workforce.`;
  }

  return `CURRENT TEAM MEMBERS — ${team.length} ${team.length === 1 ? 'person' : 'people'}, the complete and authoritative roster:
Roster names (all ${team.length} must be accounted for in your output): ${team.map((m) => m.name).join(', ')}

${JSON.stringify(team, null, 2)}`;
}

function assignmentsSection(teamFitAssignments) {
  if (!teamFitAssignments || Object.keys(teamFitAssignments).length === 0) return null;
  return `USER-CONFIRMED ROLE ASSIGNMENTS (the user placed these people into these target roles by hand — treat as settled, they override any earlier automatic mapping):
${JSON.stringify(teamFitAssignments, null, 2)}`;
}

/**
 * Build the full context for a stage: mission, target org, the uploaded roster,
 * and every prior stage's output. A stage never runs on partial context.
 */
function buildContextMessage(stage, workflowData = {}) {
  const team = normaliseTeam(workflowData.teamMembers);
  const stageIndex = STAGE_ORDER.indexOf(stage);

  const sections = [
    missionSection(workflowData.mission),
    targetOrgSection(workflowData.targetOrg),
    teamSection(team),
    assignmentsSection(workflowData.teamFitAssignments),
  ];

  // Inherit every output produced by a stage that runs before this one.
  for (const { key, producedBy, label } of PRIOR_OUTPUTS) {
    const producedIndex = STAGE_ORDER.indexOf(producedBy);
    const runsBefore = stageIndex === -1 || (producedIndex !== -1 && producedIndex < stageIndex);
    if (runsBefore && workflowData[key]) {
      sections.push(`${label}:
${JSON.stringify(workflowData[key], null, 2)}`);
    }
  }

  return sections.filter(Boolean).join('\n\n');
}

/**
 * Which context a stage must have to run at all. Missing mission or target org
 * means the user has skipped ahead and the stage would fabricate its own basis.
 * An empty roster is valid — the user may legitimately have no staff yet.
 */
function findMissingContext(stage, workflowData = {}) {
  const missing = [];
  if (!workflowData.mission) missing.push('mission');
  if (!workflowData.targetOrg?.length) missing.push('target organisation');

  const stageIndex = STAGE_ORDER.indexOf(stage);
  for (const { key, producedBy, label } of PRIOR_OUTPUTS) {
    const producedIndex = STAGE_ORDER.indexOf(producedBy);
    if (producedIndex !== -1 && stageIndex !== -1 && producedIndex < stageIndex && !workflowData[key]) {
      missing.push(label.toLowerCase());
    }
  }
  return missing;
}

/**
 * Team mapping must place every uploaded person somewhere. Returns the names it
 * dropped so the caller can retry rather than silently losing people.
 */
function findUnaccountedMembers(result, teamMembers) {
  const team = normaliseTeam(teamMembers);
  if (team.length === 0) return [];

  const placed = new Set(
    [...(result?.matched || []), ...(result?.unmatched || [])]
      .flatMap((entry) => [entry?.memberName, entry?.memberId])
      .filter(Boolean)
      .map((v) => String(v).toLowerCase().trim())
  );

  return team
    .filter((m) => !placed.has(m.name.toLowerCase()) && !placed.has(m.id.toLowerCase()))
    .map((m) => m.name);
}

module.exports = {
  STAGE_ORDER,
  normaliseTeam,
  buildContextMessage,
  findMissingContext,
  findUnaccountedMembers,
};
