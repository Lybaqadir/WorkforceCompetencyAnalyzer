// Builders that turn workflow team members into dashboard role objects.
// Kept out of App.jsx so that file only exports a component (Fast Refresh
// bails out — forcing full page reloads — when a module mixes exports).

export function memberToRole(member) {
  const allSkills = [
    ...(member.skills || []),
    ...(member.technicalSkills || []),
    ...(member.softSkills || []),
  ].filter(Boolean);
  return {
    // Derived from the name, never random: this role is rebuilt every time the
    // roster or an analysis result changes, and a fresh uuid each time would
    // make the same person look like a new one and duplicate them on screen.
    id: member.id || `member-${String(member.name || 'unknown').toLowerCase().replace(/\s+/g, '-')}`,
    name: member.name,
    // Marks this role as a view of a roster member rather than a role the user
    // created on the dashboard, so the two can be told apart when re-syncing.
    sourceMemberId: member.id || null,
    _currentRole: member.currentRole || '',
    reportsTo: null,
    aiPercent: 45,
    humanPercent: 55,
    verdict: 'AI + Human',
    competencies: allSkills.slice(0, 8).map((s) => ({ name: s, type: 'human' })),
    cost: 'Estimate pending',
    risk: 'Medium',
    gains: [],
    losses: [],
    recommendation: 'Review based on workflow analysis',
    draft: true,
  };
}

// Build dashboard roles from the FULL workflow results — real AI percentages
// from the skills analysis and real fit data from team mapping, so the
// dashboard instantly reflects what the workflow actually found.
export function membersToRolesFromWorkflow(workflowData) {
  const members = workflowData?.teamMembers || [];
  const skills = workflowData?.skillsAnalysis;
  const mapping = workflowData?.teamMapping;
  const POTENTIAL = { high: 70, medium: 50, low: 30 };

  return members.map((member) => {
    const base = memberToRole(member);
    const match = mapping?.matched?.find(
      (m) => m.memberName === member.name || m.memberId === member.id
    );

    // Estimate AI-doable % from automatable tasks tied to this member's role
    const roleNames = [member.currentRole, match?.targetRoleName]
      .filter(Boolean)
      .map((s) => s.toLowerCase());
    const tasks = (skills?.aiAutomatable || []).filter((t) => {
      const doneBy = (t.currentlyDoneBy || '').toLowerCase();
      return roleNames.some((rn) => doneBy.includes(rn) || rn.includes(doneBy));
    });
    let aiPercent = base.aiPercent;
    if (tasks.length > 0) {
      aiPercent = Math.round(
        tasks.reduce((s, t) => s + (POTENTIAL[t.automationPotential] ?? 45), 0) / tasks.length
      );
    }

    // Tag competencies: human-critical skills stay human, automatable ones flip to ai
    const humanCritical = new Set((skills?.humanCritical || []).map((h) => h.skill?.toLowerCase()));
    const automatableText = (skills?.aiAutomatable || [])
      .map((t) => `${t.task} ${t.reason}`.toLowerCase())
      .join(' ');
    const competencies = base.competencies.map((c) => {
      const nameLc = c.name.toLowerCase();
      if (humanCritical.has(nameLc)) return { ...c, type: 'human' };
      if (automatableText.includes(nameLc)) return { ...c, type: 'ai' };
      return c;
    });

    const verdict = aiPercent >= 60 ? 'AI Candidate' : aiPercent >= 40 ? 'AI + Human' : 'Human Critical';

    return {
      ...base,
      aiPercent,
      humanPercent: 100 - aiPercent,
      verdict,
      competencies,
      recommendation: match
        ? `Mapped to ${match.targetRoleName} (${match.fitScore}% fit). ${match.rationale ?? ''}`.trim()
        : base.recommendation,
      draft: false,
    };
  });
}

/**
 * Reconcile the dashboard's role list against the uploaded roster.
 *
 * teamRoles is a presentation view of teamMembers, not a second copy of the
 * workforce: rebuilding it whenever the roster or any analysis result changes is
 * what keeps the dashboard showing the people the user actually uploaded. Roles
 * the user created by hand on the dashboard have no member behind them and are
 * carried through untouched.
 */
export function syncRolesWithWorkflow(existingRoles, workflowData) {
  const derived = membersToRolesFromWorkflow(workflowData);
  const byId = new Map(derived.map((r) => [r.id, r]));
  const byName = new Map(derived.map((r) => [(r.name || '').toLowerCase(), r]));

  // Keep the user's ordering for people already on the dashboard, then append
  // anyone newly uploaded.
  const merged = [];
  for (const role of existingRoles || []) {
    if (byId.has(role.id)) {
      merged.push(byId.get(role.id));
      byId.delete(role.id);
      continue;
    }
    // Same person, different id — a role seeded before the member had a stable
    // id. Refresh it in place rather than showing them twice.
    const sameName = byName.get((role.name || '').toLowerCase());
    if (sameName && byId.has(sameName.id)) {
      merged.push(sameName);
      byId.delete(sameName.id);
      continue;
    }
    // Roster-backed but no longer derivable — the user removed this member, so
    // the dashboard should stop showing them. Roles without the marker were
    // created by hand on the dashboard and survive.
    if (!role.sourceMemberId) merged.push(role);
  }
  merged.push(...byId.values());

  return merged;
}
