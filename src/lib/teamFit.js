// Shared team-fit scoring and assignment logic.
// Used by TeamFitScreen, HomeScreen (org readiness) and MissionScreen so every
// surface shows the SAME numbers derived from the same assignments.

// Score how well a person fits a target role.
// Prefers the AI's own fit score from the team-mapping workflow result;
// falls back to keyword overlap between skills.
export function estimateFit(person, targetRole, teamMapping) {
  if (!person || !targetRole) return 0;

  const match = teamMapping?.matched?.find(
    (m) =>
      (m.memberId === person.id || m.memberName === person.name) &&
      (m.targetRoleId === targetRole.id || m.targetRoleName === targetRole.name)
  );
  if (match?.fitScore != null) return match.fitScore;

  if (!targetRole.skills?.length) return 0;
  const personSkills = (person.competencies || []).map((c) => c.name.toLowerCase());
  if (personSkills.length === 0) return 0;
  const targetSkills = targetRole.skills.map((s) => (s.name || s).toLowerCase());
  const matched = targetSkills.filter((ts) =>
    personSkills.some((ps) => {
      const tWord = ts.split(' ')[0];
      const pWord = ps.split(' ')[0];
      return ps.includes(tWord) || ts.includes(pWord);
    })
  );
  return Math.round((matched.length / targetSkills.length) * 100);
}

// Seed assignments straight from the AI team-mapping result: each matched
// member is placed on their matched target role.
export function buildAssignmentsFromMapping(targetOrg, people, teamMapping) {
  const assignments = {};
  if (!targetOrg || !people || !teamMapping?.matched) return assignments;
  teamMapping.matched.forEach((m) => {
    const role = targetOrg.find((r) => r.id === m.targetRoleId || r.name === m.targetRoleName);
    const person = people.find((p) => p.id === m.memberId || p.name === m.memberName);
    if (role && person && !assignments[role.id]) assignments[role.id] = person.id;
  });
  return assignments;
}

// Greedy keyword-based auto-assignment for roles the mapping didn't cover.
export function buildAIAssignments(targetOrg, people, teamMapping) {
  const assignments = buildAssignmentsFromMapping(targetOrg, people, teamMapping);
  const taken = new Set(Object.values(assignments));
  if (!targetOrg || !people) return assignments;

  const remaining = targetOrg.filter((r) => !assignments[r.id]);
  const scored = remaining.map((role) => {
    const best = people.reduce(
      (acc, p) => {
        const s = estimateFit(p, role, teamMapping);
        return s > acc.score ? { score: s, id: p.id } : acc;
      },
      { score: 0, id: null }
    );
    return { role, bestScore: best.score };
  });
  scored.sort((a, b) => b.bestScore - a.bestScore);

  for (const { role } of scored) {
    let bestScore = 0;
    let bestPersonId = null;
    for (const person of people) {
      if (taken.has(person.id)) continue;
      const score = estimateFit(person, role, teamMapping);
      if (score > bestScore) { bestScore = score; bestPersonId = person.id; }
    }
    if (bestPersonId && bestScore >= 20) {
      assignments[role.id] = bestPersonId;
      taken.add(bestPersonId);
    }
  }
  return assignments;
}

// Turn dashboard teamRoles into the person shape the fit logic expects.
export function rolesToPeople(teamRoles) {
  return (teamRoles || []).map((r) => ({
    id: r.id,
    name: r.name,
    roleId: r.id,
    roleName: r._currentRole || r.name,
    competencies: r.competencies || [],
  }));
}

// Filled / reskilling / gaps / unplaced stats from an assignment map.
export function computeFitStats(targetOrg, people, assignments, teamMapping) {
  if (!targetOrg) return null;
  let filled = 0, partial = 0, gaps = 0;
  targetOrg.forEach((role) => {
    const personId = assignments?.[role.id];
    const person = personId ? people.find((p) => p.id === personId) : null;
    if (!person) { gaps++; return; }
    const score = estimateFit(person, role, teamMapping);
    if (score >= 70) filled++;
    else if (score >= 40) partial++;
    else gaps++;
  });
  const placed = new Set(Object.values(assignments || {}).filter(Boolean));
  const unplaced = (people || []).filter((p) => !placed.has(p.id)).length;
  return { filled, partial, gaps, total: targetOrg.length, unplaced };
}
