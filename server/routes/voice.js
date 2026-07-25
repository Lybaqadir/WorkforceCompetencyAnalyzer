const express = require('express');
const { chat } = require('../lib/azureOpenAI');
const { VOICE_CORRECT_SYSTEM } = require('../lib/prompts');

const router = express.Router();

// POST /api/voice/correct
// Body: { transcript: string, context: [{role, content}] }
router.post('/correct', async (req, res) => {
  const { transcript, context = [] } = req.body;
  if (!transcript) return res.status(400).json({ error: 'transcript required' });

  try {
    const recentContext = context.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const messages = [
      { role: 'system', content: VOICE_CORRECT_SYSTEM },
      ...recentContext,
      {
        role: 'user',
        content: `Raw transcript: "${transcript}"\n\nReturn only the corrected text, nothing else.`,
      },
    ];

    const corrected = await chat(messages, 150);
    res.json({ corrected: corrected.trim() || transcript });
  } catch (err) {
    console.error('Voice correct error:', err);
    res.json({ corrected: transcript }); // graceful fallback
  }
});

module.exports = router;
