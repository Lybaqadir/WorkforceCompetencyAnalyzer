const express = require('express');
const upload = require('../middleware/upload');
const { parseTeamFile } = require('../lib/parseTeamFile');
const { chatJson } = require('../lib/azureOpenAI');
const { CV_EXTRACTION_SYSTEM } = require('../lib/prompts');

const router = express.Router();

// POST /api/upload/team-data
router.post('/team-data', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  try {
    const parsed = await parseTeamFile(req.file);
    const { people, roles, rawText } = parsed;

    if (rawText) {
      // PDF or DOCX — extract structured person data using AI
      const extracted = await chatJson([
        { role: 'system', content: CV_EXTRACTION_SYSTEM },
        { role: 'user', content: `Extract all professional information from this document:\n\n${rawText.slice(0, 6000)}` },
      ], 1200);

      if (!extracted) {
        return res.status(500).json({ error: 'Could not extract data from this file. Please try again.' });
      }

      // Build the display summary
      const name = extracted.name || 'this person';
      const role = extracted.currentRole || 'professional';
      const exp = extracted.experience || '';
      const skillCount = (extracted.skills || []).length;
      const summary = extracted.summary ||
        `I've reviewed the CV and found ${name} — ${role}${exp ? ', with ' + exp : ''}${skillCount > 0 ? ', with ' + skillCount + ' skills identified' : ''}.`;

      return res.json({
        person: extracted,
        summary,
        people: [],
        roles: [],
      });
    }

    // Structured file (CSV/XLSX) — multiple people
    if (people.length === 0 && roles.length === 0) {
      return res.json({
        person: null,
        summary: "I couldn't find structured team data in that file. Please ensure it has columns like Name, Title, or Skills.",
        people: [],
        roles: [],
      });
    }

    const parts = [];
    if (people.length > 0) parts.push(`${people.length} team member${people.length !== 1 ? 's' : ''}`);
    if (roles.length > 0) parts.push(`${roles.length} role${roles.length !== 1 ? 's' : ''}`);
    const summary = `I found ${parts.join(' and ')} in your file and have pulled that in. Would you like to review them or add anyone manually?`;

    return res.json({ person: null, summary, people, roles });
  } catch (err) {
    console.error('Upload parse error:', err);
    res.status(500).json({ error: 'Failed to process the file. Please try again.' });
  }
});

module.exports = router;
