const express = require('express');
const { chatJson } = require('../lib/azureOpenAI');
const {
  TEAM_MAPPING_SYSTEM,
  SKILLS_ANALYSIS_SYSTEM,
  GAP_ANALYSIS_SYSTEM,
  RECOMMENDATIONS_SYSTEM,
  FUTURE_PLANNING_SYSTEM,
} = require('../lib/prompts');
const {
  buildContextMessage,
  findMissingContext,
  findUnaccountedMembers,
  normaliseTeam,
} = require('../lib/workflowContext');

const router = express.Router();

const STAGE_PROMPTS = {
  'team-mapping': TEAM_MAPPING_SYSTEM,
  'skills-analysis': SKILLS_ANALYSIS_SYSTEM,
  'gap-analysis': GAP_ANALYSIS_SYSTEM,
  'recommendations': RECOMMENDATIONS_SYSTEM,
  'future-planning': FUTURE_PLANNING_SYSTEM,
};

// The richer AI org (up to 12 roles, each with a category and 3-5 skills)
// produces far more competencies and gaps to enumerate than the original
// budgets allowed, so these leave real headroom before truncation.
const STAGE_MAX_TOKENS = {
  'team-mapping': 4000,
  'skills-analysis': 4000,
  'gap-analysis': 4000,
  'recommendations': 4000,
  'future-planning': 4000,
};

// POST /api/workflow/run-stage
router.post('/run-stage', async (req, res) => {
  const { stage, workflowData } = req.body;

  if (!stage || !STAGE_PROMPTS[stage]) {
    return res.status(400).json({ error: `Unknown stage: ${stage}` });
  }

  if (!workflowData) {
    return res.status(400).json({ error: 'workflowData is required' });
  }

  // A stage running without its inputs would invent its own basis — the exact
  // failure this workflow exists to avoid. Fail loudly instead.
  const missing = findMissingContext(stage, workflowData);
  if (missing.length > 0) {
    return res.status(400).json({
      error: `Cannot run ${stage.replace('-', ' ')} — missing ${missing.join(', ')}. Complete the earlier workflow steps first.`,
    });
  }

  try {
    const team = normaliseTeam(workflowData.teamMembers);
    const contextMessage = buildContextMessage(stage, workflowData);
    const systemPrompt = STAGE_PROMPTS[stage];
    const maxTokens = STAGE_MAX_TOKENS[stage] || 2500;
    const userMessage = `Please analyse the following organisation data and generate the ${stage.replace('-', ' ')} results:\n\n${contextMessage}`;

    let result = await chatJson([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ], maxTokens);

    if (!result) {
      return res.status(500).json({ error: `AI failed to generate ${stage} results. Please try again.` });
    }

    // Team mapping is where people get silently dropped. If anyone from the
    // roster is missing from the output, ask once more naming the omissions.
    if (stage === 'team-mapping') {
      const dropped = findUnaccountedMembers(result, team);
      if (dropped.length > 0) {
        console.warn(`[team-mapping] roster members omitted, retrying: ${dropped.join(', ')}`);
        const retry = await chatJson([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
          { role: 'assistant', content: JSON.stringify(result) },
          {
            role: 'user',
            content: `That mapping left out ${dropped.length} of the ${team.length} people on the roster: ${dropped.join(', ')}. Every uploaded team member must appear exactly once, in "matched" or in "unmatched". Return the complete mapping again with them included and everything else unchanged.`,
          },
        ], maxTokens);
        if (retry && findUnaccountedMembers(retry, team).length < dropped.length) {
          result = retry;
        }
      }
    }

    res.json({ result });
  } catch (err) {
    console.error(`Workflow stage error [${stage}]:`, err?.status, err?.message);
    if (err?.status === 429) {
      return res.status(429).json({ error: 'The AI service is temporarily rate-limited. Please wait about 30 seconds and try again.' });
    }
    res.status(500).json({ error: `Failed to run ${stage}. Please try again.` });
  }
});

module.exports = router;
