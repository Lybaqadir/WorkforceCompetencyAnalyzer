const express = require('express');
const { chatJson } = require('../lib/azureOpenAI');
const { FUTURE_SKILLS_SYSTEM } = require('../lib/prompts');

const router = express.Router();

// POST /api/future-skills/generate
// Body: { missionStatement, roles: [{ title }], teamContext }
router.post('/generate', async (req, res) => {
  const { missionStatement, roles, teamContext } = req.body;

  try {
    const userContent = `${missionStatement ? `Mission: ${missionStatement}` : ''}
${roles ? `Current roles: ${roles.map((r) => r.title).join(', ')}` : ''}
${teamContext ? `Additional context: ${teamContext}` : ''}

Forecast future skill needs. Return JSON only.`;

    const result = await chatJson([
      { role: 'system', content: FUTURE_SKILLS_SYSTEM },
      { role: 'user', content: userContent },
    ]);

    if (!result) return res.status(500).json({ error: 'Future skills generation failed.' });
    res.json(result);
  } catch (err) {
    console.error('Future skills error:', err);
    res.status(500).json({ error: 'Failed to generate future skills.' });
  }
});

module.exports = router;
