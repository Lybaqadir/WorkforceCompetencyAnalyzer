const express = require('express');
const { chatJson } = require('../lib/azureOpenAI');
const { TEAMFIT_SYSTEM } = require('../lib/prompts');

const router = express.Router();

// POST /api/teamfit/score
// Body: { person: { name, title, skills }, targetRole: { title, rationale, skills }, missionStatement }
router.post('/score', async (req, res) => {
  const { person, targetRole, missionStatement } = req.body;
  if (!person || !targetRole) return res.status(400).json({ error: 'person and targetRole required' });

  try {
    const userContent = `Person: ${person.name}, currently "${person.title}"
Their skills: ${(person.skills || []).join(', ')}

Target role: "${targetRole.title}"
Role rationale: ${targetRole.rationale || ''}
Skills needed: ${(targetRole.skills || []).join(', ')}
${missionStatement ? `\nTeam mission: ${missionStatement}` : ''}

Score the fit and return JSON only.`;

    const result = await chatJson([
      { role: 'system', content: TEAMFIT_SYSTEM },
      { role: 'user', content: userContent },
    ]);

    if (!result) return res.status(500).json({ error: 'Scoring failed.' });
    res.json(result);
  } catch (err) {
    console.error('Teamfit score error:', err);
    res.status(500).json({ error: 'Failed to score fit.' });
  }
});

module.exports = router;
