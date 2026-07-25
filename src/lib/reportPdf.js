// Builds the "Workforce Plan" PDF from whatever the mission builder flow
// produced. Every section is optional — stages the user hasn't reached yet
// are simply skipped, so a partial run still exports cleanly.

import { jsPDF } from 'jspdf';

// A4 portrait in points
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const NAVY = [26, 35, 64];
const MAROON = [128, 32, 48];
const CHARCOAL = [45, 45, 52];
const GREY = [125, 125, 135];
const GREEN = [13, 116, 106];
const RED = [190, 42, 42];
const GOLD = [146, 98, 10];
const LINE = [225, 225, 230];

const LEVEL_LABELS = { B: 'Beginner', I: 'Intermediate', A: 'Advanced', E: 'Expert' };

const SEVERITY_COLOR = { critical: RED, important: GOLD, low: GREY };

class ReportBuilder {
  constructor() {
    this.doc = new jsPDF({ unit: 'pt', format: 'a4' });
    this.y = MARGIN;
  }

  ensureSpace(height) {
    if (this.y + height > PAGE_H - MARGIN - 20) {
      this.doc.addPage();
      this.y = MARGIN;
    }
  }

  gap(h = 8) {
    this.y += h;
  }

  sectionTitle(text) {
    this.ensureSpace(60);
    if (this.y > MARGIN) this.y += 16;
    this.doc.setFillColor(...MAROON);
    this.doc.rect(MARGIN, this.y, 3, 16, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(15);
    this.doc.setTextColor(...NAVY);
    this.doc.text(text, MARGIN + 10, this.y + 13);
    this.y += 24;
    this.doc.setDrawColor(...LINE);
    this.doc.setLineWidth(0.75);
    this.doc.line(MARGIN, this.y, MARGIN + CONTENT_W, this.y);
    this.y += 12;
  }

  subheading(text, color = CHARCOAL) {
    this.ensureSpace(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10.5);
    this.doc.setTextColor(...color);
    this.doc.text(text.toUpperCase(), MARGIN, this.y + 9);
    this.y += 18;
  }

  paragraph(text, { size = 9.5, color = CHARCOAL, bold = false, indent = 0, lineGap = 3.5, after = 6 } = {}) {
    if (!text) return;
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
    const lines = this.doc.splitTextToSize(String(text), CONTENT_W - indent);
    for (const line of lines) {
      this.ensureSpace(size + lineGap);
      this.doc.text(line, MARGIN + indent, this.y + size);
      this.y += size + lineGap;
    }
    this.y += after;
  }

  bullet(title, detail, { titleColor = CHARCOAL, badge = null, badgeColor = GREY } = {}) {
    this.ensureSpace(26);
    this.doc.setFillColor(...MAROON);
    this.doc.circle(MARGIN + 3, this.y + 7, 1.8, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...titleColor);
    let x = MARGIN + 12;
    this.doc.text(title, x, this.y + 10);
    if (badge) {
      x += this.doc.getTextWidth(title) + 8;
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(...badgeColor);
      this.doc.text(`[${badge.toUpperCase()}]`, x, this.y + 10);
    }
    this.y += 15;
    if (detail) this.paragraph(detail, { size: 8.5, color: GREY, indent: 12, after: 4 });
  }

  keyValueRow(pairs) {
    // pairs: [{label, value, color}] rendered side by side in equal columns
    this.ensureSpace(34);
    const colW = CONTENT_W / pairs.length;
    pairs.forEach((p, i) => {
      const x = MARGIN + i * colW;
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(...GREY);
      this.doc.text(p.label.toUpperCase(), x, this.y + 8);
      this.doc.setFontSize(12);
      this.doc.setTextColor(...(p.color || NAVY));
      this.doc.text(String(p.value), x, this.y + 24);
    });
    this.y += 34;
  }

  summaryBox(text) {
    if (!text) return;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.5);
    const lines = this.doc.splitTextToSize(String(text), CONTENT_W - 24);
    const boxH = lines.length * 12 + 26;
    this.ensureSpace(boxH + 6);
    this.doc.setFillColor(246, 246, 248);
    this.doc.roundedRect(MARGIN, this.y, CONTENT_W, boxH, 5, 5, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(...MAROON);
    this.doc.text('SUMMARY', MARGIN + 12, this.y + 14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(...CHARCOAL);
    let ty = this.y + 26;
    for (const line of lines) {
      this.doc.text(line, MARGIN + 12, ty);
      ty += 12;
    }
    this.y += boxH + 10;
  }

  finish(filename) {
    const total = this.doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      this.doc.setPage(i);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(...GREY);
      this.doc.text('TeamLens — Workforce Plan', MARGIN, PAGE_H - 24);
      this.doc.text(`Page ${i} of ${total}`, PAGE_W - MARGIN, PAGE_H - 24, { align: 'right' });
    }
    this.doc.save(filename);
  }
}

function coverHeader(b, mission) {
  b.doc.setFillColor(...NAVY);
  b.doc.rect(0, 0, PAGE_W, 130, 'F');
  b.doc.setFillColor(...MAROON);
  b.doc.rect(0, 126, PAGE_W, 4, 'F');
  b.doc.setFont('helvetica', 'bold');
  b.doc.setFontSize(22);
  b.doc.setTextColor(255, 255, 255);
  b.doc.text('Workforce Plan Report', MARGIN, 58);
  b.doc.setFontSize(12);
  b.doc.setTextColor(240, 205, 120);
  b.doc.text(mission?.teamName || 'Your Team', MARGIN, 82);
  b.doc.setFont('helvetica', 'normal');
  b.doc.setFontSize(9);
  b.doc.setTextColor(200, 205, 220);
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  b.doc.text(`Generated by TeamLens · ${date}`, MARGIN, 102);
  b.y = 150;
}

function missionSection(b, mission) {
  if (!mission) return;
  b.sectionTitle('Mission');
  b.paragraph(mission.statement, { size: 10.5, after: 10 });

  if (mission.objectives?.length) {
    b.subheading('Objectives');
    for (const o of mission.objectives) {
      const kpi = [o.kpi, o.kpiHint].filter(Boolean).join(' ');
      b.bullet(`${o.title}${kpi ? `  (${kpi})` : ''}`, o.detail);
    }
    b.gap(4);
  }

  if (mission.constraints?.length) {
    b.subheading('Constraints identified');
    for (const c of mission.constraints) b.bullet(typeof c === 'string' ? c : c.name || String(c));
    b.gap(4);
  }

  if (mission.userContext) {
    b.subheading('Your context');
    b.paragraph(mission.userContext, { size: 9, color: GREY });
  }
}

function targetOrgSection(b, targetOrg) {
  if (!targetOrg?.length) return;
  b.sectionTitle('Target Organisation');
  const newRoles = targetOrg.filter((r) => r.isNew).length;
  b.keyValueRow([
    { label: 'Total roles', value: targetOrg.length },
    { label: 'New roles', value: newRoles, color: MAROON },
    { label: 'Existing roles', value: targetOrg.length - newRoles, color: GREEN },
  ]);
  b.gap(4);

  const bySubTeam = {};
  for (const r of targetOrg) {
    const k = r.subTeam || 'Other';
    (bySubTeam[k] ||= []).push(r);
  }
  for (const [subTeam, roles] of Object.entries(bySubTeam)) {
    b.subheading(subTeam, MAROON);
    for (const r of roles) {
      const skills = (r.skills || [])
        .map((s) => `${s.name} (${LEVEL_LABELS[s.level] || s.level})`)
        .join(', ');
      const headcount = r.headcount ? `Headcount: ${r.headcount}` : null;
      b.bullet(r.name, null, { badge: r.isNew ? 'New role' : null, badgeColor: MAROON });
      if (r.rationale) b.paragraph(r.rationale, { size: 8.5, color: GREY, indent: 12, after: 2 });
      if (headcount) b.paragraph(headcount, { size: 8, color: GREY, indent: 12, after: 2 });
      if (skills) b.paragraph(`Key skills: ${skills}`, { size: 8, color: CHARCOAL, indent: 12, after: 6 });
    }
  }
}

function teamSection(b, teamMembers) {
  if (!teamMembers?.length) return;
  b.sectionTitle('Current Team');
  for (const m of teamMembers) {
    const skills = [
      ...(m.skills || []),
      ...(m.technicalSkills || []),
      ...(m.softSkills || []),
    ].filter(Boolean);
    b.bullet(m.name || 'Unnamed', null, { badge: m.currentRole || null, badgeColor: GREY });
    if (skills.length) b.paragraph(`Skills: ${skills.join(', ')}`, { size: 8, color: GREY, indent: 12, after: 6 });
  }
}

function teamMappingSection(b, teamMapping) {
  if (!teamMapping) return;
  b.sectionTitle('Team Mapping');
  b.keyValueRow([
    { label: 'Matched to a target role', value: teamMapping.matched?.length ?? 0, color: GREEN },
    { label: 'No close match yet', value: teamMapping.unmatched?.length ?? 0, color: GOLD },
    { label: 'Target roles vacant', value: teamMapping.vacant?.length ?? 0, color: RED },
  ]);
  b.gap(4);

  const matched = (teamMapping.matched || []).slice().sort((a, c) => (c.fitScore ?? 0) - (a.fitScore ?? 0));
  if (matched.length) {
    b.subheading(`Matched (${matched.length})`);
    for (const m of matched) {
      const score = m.fitScore ?? 0;
      const color = score >= 75 ? GREEN : score >= 50 ? GOLD : RED;
      b.bullet(`${m.memberName}  ->  ${m.targetRoleName}`, m.matchReason || m.rationale, { badge: `${score}% fit`, badgeColor: color });
      if (m.gaps?.length) b.paragraph(`Remaining gaps: ${m.gaps.join(', ')}`, { size: 8, color: RED, indent: 12, after: 6 });
    }
  }
  if (teamMapping.unmatched?.length) {
    b.subheading(`Unmatched (${teamMapping.unmatched.length})`, GOLD);
    for (const m of teamMapping.unmatched) {
      b.bullet(m.memberName, m.reason, {
        badge: m.closestRole ? `Closest: ${m.closestRole}` : 'No close match',
        badgeColor: GOLD,
      });
      if (m.recommendations) b.paragraph(`Recommendation: ${m.recommendations}`, { size: 8.5, color: MAROON, bold: true, indent: 12, after: 6 });
    }
  }
  if (teamMapping.vacant?.length) {
    b.subheading(`Vacant roles (${teamMapping.vacant.length})`, RED);
    for (const v of teamMapping.vacant) {
      b.bullet(v.roleName, v.reason || 'No suitable internal candidate found', {
        badge: v.urgency || null,
        badgeColor: RED,
      });
    }
  }
  b.summaryBox(teamMapping.summary);
}

function skillsSection(b, skillsAnalysis) {
  if (!skillsAnalysis) return;
  b.sectionTitle('Skills Analysis');
  const comps = skillsAnalysis.competencies || [];
  const count = (s) => comps.filter((c) => c.status === s).length;
  b.keyValueRow([
    { label: 'Covered', value: count('covered'), color: GREEN },
    { label: 'Partial', value: count('partial'), color: GOLD },
    { label: 'Missing', value: count('missing'), color: RED },
  ]);
  b.gap(4);

  const groups = [
    { key: 'covered', label: 'Covered', color: GREEN },
    { key: 'partial', label: 'Partial', color: GOLD },
    { key: 'missing', label: 'Missing', color: RED },
  ];
  for (const g of groups) {
    const items = comps.filter((c) => c.status === g.key);
    if (!items.length) continue;
    b.subheading(`${g.label} (${items.length})`, g.color);
    for (const c of items) {
      const detail = c.coveredBy?.length
        ? `Covered by ${c.coveredBy.join(', ')}`
        : c.requiredBy?.length
          ? `Needed for ${c.requiredBy.join(', ')}`
          : null;
      b.bullet(c.name, detail);
    }
  }

  if (skillsAnalysis.aiAutomatable?.length) {
    b.subheading('AI-automatable tasks', GREEN);
    for (const t of skillsAnalysis.aiAutomatable) {
      b.bullet(t.task, t.reason, { badge: t.automationPotential ? `${t.automationPotential} potential` : null, badgeColor: GREEN });
      if (t.currentlyDoneBy) b.paragraph(`Currently done by: ${t.currentlyDoneBy}`, { size: 8, color: GREY, indent: 12, after: 6 });
    }
  }
  if (skillsAnalysis.humanCritical?.length) {
    b.subheading('Human-critical skills', MAROON);
    for (const h of skillsAnalysis.humanCritical) {
      b.bullet(h.skill, h.reason);
    }
  }
  b.summaryBox(skillsAnalysis.summary);
}

function gapSection(b, gapAnalysis) {
  if (!gapAnalysis) return;
  b.sectionTitle('Gap Analysis');
  const order = { critical: 0, important: 1, low: 2 };
  const gaps = [
    ...(gapAnalysis.missingRoles || []).map((r) => ({
      kind: 'Role', title: r.roleName || r.role || String(r), severity: r.severity || 'low',
      detail: r.impact || r.reason, action: r.suggestedAction,
    })),
    ...(gapAnalysis.missingSkills || []).map((s) => ({
      kind: 'Skill', title: s.skill || String(s), severity: s.severity || 'low',
      detail: s.neededBy?.length ? `Needed by: ${s.neededBy.join(', ')}` : null, action: s.suggestedAction,
    })),
  ].sort((a, c) => (order[a.severity] ?? 3) - (order[c.severity] ?? 3));

  gaps.forEach((g, i) => {
    b.bullet(`${i + 1}. ${g.title}  (${g.kind})`, g.detail, {
      badge: g.severity,
      badgeColor: SEVERITY_COLOR[g.severity] || GREY,
    });
    if (g.action) b.paragraph(`Suggested action: ${g.action}`, { size: 8.5, color: MAROON, bold: true, indent: 12, after: 6 });
  });

  if (gapAnalysis.organizationalWeaknesses?.length) {
    b.subheading('Structural weaknesses', RED);
    for (const w of gapAnalysis.organizationalWeaknesses) {
      b.bullet(w.weakness, w.detail, {
        badge: w.risk ? `${w.risk} risk` : null,
        badgeColor: w.risk === 'high' ? RED : w.risk === 'medium' ? GOLD : GREEN,
      });
    }
  }
  b.summaryBox(gapAnalysis.summary);
}

function recommendationsSection(b, recommendations) {
  if (!recommendations) return;
  b.sectionTitle('Recommendations');

  const lanes = [
    {
      label: '1. Internal Mobility', color: GREEN,
      items: (recommendations.internalMobility || []).map((m) => ({
        title: m.personName, sub: `${m.currentRole} -> ${m.recommendedRole}`,
        detail: m.rationale, badge: m.readinessLevel?.replace(/-/g, ' '),
        extra: m.developmentNeeded ? `Development needed: ${m.developmentNeeded}` : null,
      })),
    },
    {
      label: '2. Reskilling', color: GOLD,
      items: (recommendations.reskilling || []).map((r) => ({
        title: r.personName, sub: (r.targetSkills || []).join(', '),
        detail: r.trainingApproach, badge: r.timeline,
      })),
    },
    {
      label: '3. External Hiring', color: MAROON,
      items: (recommendations.hiring || []).map((h) => ({
        title: h.role, sub: (h.keySkillsNeeded || []).length ? `Key skills: ${h.keySkillsNeeded.join(', ')}` : null,
        detail: h.reason, badge: [h.priority, h.timeline].filter(Boolean).join(' · ') || null,
      })),
    },
  ];

  for (const lane of lanes) {
    if (!lane.items.length) continue;
    b.subheading(lane.label, lane.color);
    for (const it of lane.items) {
      b.bullet(it.title, it.detail, { badge: it.badge || null, badgeColor: lane.color });
      if (it.sub) b.paragraph(it.sub, { size: 8, color: GREY, indent: 12, after: it.extra ? 2 : 6 });
      if (it.extra) b.paragraph(it.extra, { size: 8, color: GOLD, indent: 12, after: 6 });
    }
  }

  if (recommendations.automation?.length) {
    b.subheading('Automation opportunities', GREEN);
    for (const a of recommendations.automation) {
      b.bullet(a.task, a.automationApproach, { badge: a.estimatedTimeSaving ? `Saves ${a.estimatedTimeSaving}` : null, badgeColor: GREEN });
      if (a.currentlyHandledBy) b.paragraph(`Currently handled by: ${a.currentlyHandledBy}`, { size: 8, color: GREY, indent: 12, after: 6 });
    }
  }
  if (recommendations.immediate?.length) {
    b.subheading('Immediate actions', MAROON);
    for (const item of recommendations.immediate) {
      if (typeof item === 'string') b.bullet(item);
      else b.bullet(item.action || item.title || item.recommendation || JSON.stringify(item), item.detail || item.reason || null);
    }
  }
  b.summaryBox(recommendations.summary);
}

function futurePlanningSection(b, futurePlanning) {
  if (!futurePlanning) return;
  b.sectionTitle('Future Workforce Plan');

  if (futurePlanning.growthScenarios?.length) {
    b.subheading('Growth scenarios');
    for (const s of futurePlanning.growthScenarios) {
      b.bullet(s.name ? s.name.charAt(0).toUpperCase() + s.name.slice(1) : 'Scenario', s.description, {
        badge: s.headcountChange ? `Headcount ${s.headcountChange}` : null,
        badgeColor: NAVY,
      });
      if (s.keyInvestments?.length) b.paragraph(`Key investments: ${s.keyInvestments.join('; ')}`, { size: 8, color: CHARCOAL, indent: 12, after: 2 });
      if (s.risks?.length) b.paragraph(`Risks: ${s.risks.join('; ')}`, { size: 8, color: RED, indent: 12, after: 6 });
    }
    b.gap(4);
  }

  if (futurePlanning.hiringPlan?.length) {
    b.subheading('Hiring roadmap');
    const periods = ['0-3 months', '3-6 months', '6-12 months', '12+ months'];
    const known = new Set(periods);
    for (const t of [...periods, ...new Set(futurePlanning.hiringPlan.map((h) => h.timeline).filter((x) => x && !known.has(x)))]) {
      const roles = futurePlanning.hiringPlan.filter((h) => h.timeline === t);
      if (!roles.length) continue;
      b.bullet(t, roles.map((h) => h.priority ? `${h.role} (${h.priority} priority)` : h.role).join(', '), { titleColor: MAROON });
    }
    b.gap(4);
  }

  if (futurePlanning.aiAdoption?.length) {
    b.subheading('AI adoption roadmap');
    for (const a of futurePlanning.aiAdoption) {
      b.bullet(a.initiative, a.expectedImpact, { badge: a.timeline || null, badgeColor: GREEN });
      if (a.roles?.length) b.paragraph(`Roles involved: ${a.roles.join(', ')}`, { size: 8, color: GREY, indent: 12, after: 6 });
    }
    b.gap(4);
  }

  const budget = futurePlanning.budgetImpact;
  if (budget?.summary || budget?.shortTermInvestment || budget?.longTermSavings) {
    b.subheading('Budget impact');
    if (budget.summary) b.paragraph(budget.summary, { size: 9, after: 8 });
    if (budget.shortTermInvestment || budget.longTermSavings) {
      b.keyValueRow([
        ...(budget.shortTermInvestment ? [{ label: 'Short-term investment', value: budget.shortTermInvestment, color: CHARCOAL }] : []),
        ...(budget.longTermSavings ? [{ label: 'Long-term savings', value: budget.longTermSavings, color: GREEN }] : []),
      ]);
    }
    b.gap(4);
  }

  if (futurePlanning.successionPlan?.length) {
    b.subheading('Succession planning');
    for (const s of futurePlanning.successionPlan) {
      const line = `${s.currentHolder || 'Current holder unknown'}${s.successor ? ` -> ${s.successor}` : ' -> no successor named'}`;
      b.bullet(s.criticalRole, line, { badge: s.readiness || null, badgeColor: s.readiness === 'ready' ? GREEN : GOLD });
      if (s.developmentPlan) b.paragraph(`Development plan: ${s.developmentPlan}`, { size: 8, color: CHARCOAL, indent: 12, after: 6 });
    }
    b.gap(4);
  }
  b.summaryBox(futurePlanning.summary);
}

// Main entry — call with the full workflowData object from App state.
export function generateWorkflowReport(workflowData) {
  const b = new ReportBuilder();
  coverHeader(b, workflowData?.mission);
  missionSection(b, workflowData?.mission);
  targetOrgSection(b, workflowData?.targetOrg);
  teamSection(b, workflowData?.teamMembers);
  teamMappingSection(b, workflowData?.teamMapping);
  skillsSection(b, workflowData?.skillsAnalysis);
  gapSection(b, workflowData?.gapAnalysis);
  recommendationsSection(b, workflowData?.recommendations);
  futurePlanningSection(b, workflowData?.futurePlanning);

  const team = (workflowData?.mission?.teamName || 'team').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  b.finish(`teamlens-workforce-plan-${team}.pdf`);
}
