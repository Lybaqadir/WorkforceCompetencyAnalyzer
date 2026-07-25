const express = require('express');
const { chatJson } = require('../lib/azureOpenAI');
const { WHATIF_SYSTEM } = require('../lib/prompts');

const router = express.Router();

// POST /api/whatif/simulate
// Body: { scenario: 'replace_with_ai'|'remove_role'|'person_leaves', role?, person?, teamContext, missionStatement }
router.post('/simulate', async (req, res) => {
  const { scenario, role, person, teamContext, missionStatement } = req.body;
  if (!scenario) return res.status(400).json({ error: 'scenario required' });

  try {
    const userContent = `Scenario: ${scenario}
${role ? `Role affected: ${role.title}` : ''}
${person ? `Person leaving: ${person.name} (${person.title})` : ''}
${teamContext ? `Team context: ${JSON.stringify(teamContext)}` : ''}
${missionStatement ? `Mission: ${missionStatement}` : ''}

Simulate the impact and return JSON only.`;

    const result = await chatJson([
      { role: 'system', content: WHATIF_SYSTEM },
      { role: 'user', content: userContent },
    ]);

    if (!result) return res.status(500).json({ error: 'Simulation failed.' });
    res.json(result);
  } catch (err) {
    console.error('WhatIf simulate error:', err);
    res.status(500).json({ error: 'Failed to simulate scenario.' });
  }
});

module.exports = router;
