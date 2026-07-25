const express = require('express');
const { chatJson } = require('../lib/azureOpenAI');
const { JOB_DESC_SYSTEM } = require('../lib/prompts');

const router = express.Router();

// POST /api/job-descriptions/generate
// Body: { role: { title, verdict, competencies }, missionStatement }
router.post('/generate', async (req, res) => {
  const { role, missionStatement } = req.body;
  if (!role?.title) return res.status(400).json({ error: 'role.title required' });

  try {
    const userContent = `Role: "${role.title}"
${role.verdict ? `AI verdict: ${role.verdict}` : ''}
${role.competencies ? `Key competencies: ${role.competencies.map((c) => c.label).join(', ')}` : ''}
${missionStatement ? `Team mission: ${missionStatement}` : ''}

Write both the human and AI agent job descriptions. Return JSON only.`;

    const result = await chatJson([
      { role: 'system', content: JOB_DESC_SYSTEM },
      { role: 'user', content: userContent },
    ]);

    if (!result) return res.status(500).json({ error: 'JD generation failed.' });
    res.json(result);
  } catch (err) {
    console.error('Job description error:', err);
    res.status(500).json({ error: 'Failed to generate job descriptions.' });
  }
});

module.exports = router;
