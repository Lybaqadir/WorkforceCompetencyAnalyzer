const express = require('express');
const { chatJson } = require('../lib/azureOpenAI');
const { MISSION_GENERATE_SYSTEM } = require('../lib/prompts');

const router = express.Router();

// POST /api/mission/generate
// Body: { conversationSummary, teamName, purpose, constraints }
router.post('/generate', async (req, res) => {
  const { conversationSummary, teamName, purpose, constraints } = req.body;

  try {
    const userContent = `Team: ${teamName || 'Unknown'}
Purpose: ${purpose || 'Not specified'}
Constraints: ${Array.isArray(constraints) ? constraints.join(', ') : constraints || 'None'}
${conversationSummary ? `\nAdditional context:\n${conversationSummary}` : ''}

Generate the mission package as JSON.`;

    const result = await chatJson([
      { role: 'system', content: MISSION_GENERATE_SYSTEM },
      { role: 'user', content: userContent },
    ]);

    if (!result) return res.status(500).json({ error: 'AI failed to generate mission.' });
    res.json(result);
  } catch (err) {
    console.error('Mission generate error:', err);
    res.status(500).json({ error: 'Failed to generate mission.' });
  }
});

module.exports = router;
