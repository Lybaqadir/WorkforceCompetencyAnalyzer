const express = require('express');
const { chatJson } = require('../lib/azureOpenAI');
const { ROLE_ANALYSIS_SYSTEM } = require('../lib/prompts');

const router = express.Router();

// POST /api/analysis/role
// Body: { title, responsibilities, teamContext, missionStatement }
router.post('/role', async (req, res) => {
  const { title, responsibilities, teamContext, missionStatement } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  try {
    const userContent = `Role title: ${title}
${responsibilities ? `Key responsibilities: ${responsibilities}` : ''}
${missionStatement ? `Team mission: ${missionStatement}` : ''}
${teamContext ? `Team context: ${teamContext}` : ''}

Analyse this role in the context of AI transformation. Return JSON only.`;

    const result = await chatJson([
      { role: 'system', content: ROLE_ANALYSIS_SYSTEM },
      { role: 'user', content: userContent },
    ]);

    if (!result) return res.status(500).json({ error: 'Analysis failed.' });
    res.json(result);
  } catch (err) {
    console.error('Role analysis error:', err);
    res.status(500).json({ error: 'Failed to analyse role.' });
  }
});

module.exports = router;
