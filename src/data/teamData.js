// Utility functions only — no dummy data.
// All real team data lives in App.jsx state (teamRoles) and flows down as props.

export function slugify(name) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base || 'role';
}

export function makeDraftRole({ name, responsibilities = '' }) {
  const id = `${slugify(name)}-${Date.now()}`;
  return {
    id,
    name,
    reportsTo: null,
    aiPercent: 50,
    humanPercent: 50,
    verdict: 'AI + Human',
    competencies:
      responsibilities.length > 0
        ? responsibilities
            .split(/,|\n/)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((r) => ({ name: r, type: 'human' }))
        : [{ name: 'General duties', type: 'human' }],
    cost: 'Estimate pending — will be calculated after AI analysis',
    risk: 'Medium — new role, not yet benchmarked',
    gains: ['Faster turnaround on repetitive tasks', 'Available around the clock'],
    losses: ['Human judgment on unexpected situations'],
    recommendation: 'AI + Human — provisional, update after analysis',
    draft: true,
  };
}

export function computeTeamMetrics(rolesList) {
  if (!rolesList || rolesList.length === 0) return { health: 0, skillBalance: 0, gaps: 0, overlaps: 0 };

  const skillBalance = Math.round(rolesList.reduce((s, r) => s + (r.aiPercent || 0), 0) / rolesList.length);

  // Same threshold + logic as computeOverlaps, so the dashboard count always
  // matches what the detail modal lists.
  const overlapCount = computeOverlaps(rolesList).length;

  const covered = new Set(rolesList.flatMap((r) => (r.competencies || []).map((c) => c.name.toLowerCase())));
  const essential = ['change management', 'ai ethics', 'budget', 'strategic', 'risk management'];
  const gaps = essential.filter((s) => !Array.from(covered).some((c) => c.includes(s.split(' ')[0]))).length;

  const balanceScore = 100 - Math.abs(50 - skillBalance) * 1.5;
  const coverageScore = Math.max(0, 100 - gaps * 14);
  const clarityScore = Math.max(0, 100 - overlapCount * 12);
  const health = Math.round(Math.max(0, Math.min(100, balanceScore * 0.3 + coverageScore * 0.4 + clarityScore * 0.3)));

  return { health, skillBalance, gaps, overlaps: overlapCount };
}

export function computeObservations(rolesList) {
  if (!rolesList || rolesList.length === 0) return [];
  const obs = [];

  const highAI = [...rolesList].sort((a, b) => (b.aiPercent || 0) - (a.aiPercent || 0))[0];
  if (highAI && (highAI.aiPercent || 0) >= 65) {
    obs.push({
      border: 'border-red',
      text: `${highAI.name} is ${highAI.aiPercent}% AI-doable — you may not need a full human hire for this position.`,
    });
  }

  let maxOverlap = 0, pairA = null, pairB = null;
  for (let i = 0; i < rolesList.length; i++) {
    for (let j = i + 1; j < rolesList.length; j++) {
      const a = new Set((rolesList[i].competencies || []).map((c) => c.name.toLowerCase()));
      const b = new Set((rolesList[j].competencies || []).map((c) => c.name.toLowerCase()));
      const shared = [...a].filter((s) => b.has(s)).length;
      const union = new Set([...a, ...b]).size;
      const pct = union > 0 ? Math.round((shared / union) * 100) : 0;
      if (pct > maxOverlap) { maxOverlap = pct; pairA = rolesList[i]; pairB = rolesList[j]; }
    }
  }
  if (pairA && pairB && maxOverlap >= 50) {
    obs.push({
      border: 'border-gold',
      text: `${pairA.name} and ${pairB.name} share ${maxOverlap}% of the same skills — worth reviewing before your next hire.`,
    });
  }

  const covered = new Set(rolesList.flatMap((r) => (r.competencies || []).map((c) => c.name.toLowerCase())));
  const missing = ['Change Management', 'AI Ethics', 'Budget Planning'].filter(
    (s) => !Array.from(covered).some((c) => c.includes(s.split(' ')[0].toLowerCase())),
  );
  if (missing.length > 0) {
    obs.push({
      border: 'border-maroon',
      text: `No one on the team covers ${missing[0]} — flagged as critical for innovation teams in the next 2 years.`,
    });
  }

  return obs;
}

// Compute pairwise skill overlaps for TeamScreen
export function computeOverlaps(rolesList) {
  if (!rolesList || rolesList.length < 2) return [];
  const result = [];
  for (let i = 0; i < rolesList.length; i++) {
    for (let j = i + 1; j < rolesList.length; j++) {
      const a = rolesList[i];
      const b = rolesList[j];
      const namesA = new Set((a.competencies || []).map((c) => c.name));
      const namesB = new Set((b.competencies || []).map((c) => c.name));
      const shared = [...namesA].filter((n) => namesB.has(n));
      const union = new Set([...namesA, ...namesB]);
      const percent = union.size === 0 ? 0 : Math.round((shared.length / union.size) * 100);
      if (percent >= 30) {
        result.push({ roleA: a.name, roleB: b.name, percent, shared });
      }
    }
  }
  return result.sort((a, b) => b.percent - a.percent);
}

// Compute skill coverage buckets from live roles
export function computeSkillCoverage(rolesList) {
  if (!rolesList || rolesList.length === 0) return { covered: [], watch: [], missing: [] };

  const skillCount = {};
  rolesList.forEach((r) => {
    (r.competencies || []).forEach((c) => {
      const key = c.name;
      skillCount[key] = (skillCount[key] || 0) + 1;
    });
  });

  const covered = [], watch = [];
  Object.entries(skillCount).forEach(([skill, count]) => {
    if (count >= 2) covered.push(skill);
    else watch.push(skill);
  });

  const allCovered = new Set(Object.keys(skillCount).map((s) => s.toLowerCase()));
  const criticalSkills = ['Change Management', 'AI Ethics', 'Budget Planning', 'Strategic Planning', 'Risk Management'];
  const missing = criticalSkills.filter(
    (s) => !Array.from(allCovered).some((c) => c.includes(s.split(' ')[0].toLowerCase())),
  );

  return { covered: covered.slice(0, 6), watch: watch.slice(0, 4), missing };
}

// Compute workload status from role data
export function computeWorkloadStatus(rolesList) {
  if (!rolesList || rolesList.length === 0) return [];
  return rolesList.map((r) => {
    const ai = r.aiPercent || 50;
    let status, label, detail;
    if (ai >= 70) {
      status = 'red';
      label = 'Mostly AI-doable';
      detail = `${ai}% of this role can be automated — consider an AI agent for the repetitive parts.`;
    } else if (ai >= 50) {
      status = 'gold';
      label = 'Some tasks could be automated';
      detail = `${ai}% of this role is AI-doable — automating routine tasks would free this person for higher-value work.`;
    } else {
      status = 'green';
      label = 'Well balanced';
      detail = `This role is ${100 - ai}% human-critical — a good balance of judgment and routine work.`;
    }
    return { role: r.name, status, label, detail };
  });
}
