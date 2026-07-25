const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'workflow-state.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// GET /api/state — return the last saved workflow state (or null)
router.get('/', (_req, res) => {
  try {
    if (!fs.existsSync(STATE_FILE)) return res.json({ state: null });
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    res.json({ state: JSON.parse(raw) });
  } catch (err) {
    console.error('State read error:', err);
    res.json({ state: null });
  }
});

// POST /api/state — save the full workflow state
router.post('/', (req, res) => {
  try {
    ensureDataDir();
    fs.writeFileSync(STATE_FILE, JSON.stringify(req.body), 'utf8');
    res.json({ ok: true });
  } catch (err) {
    console.error('State write error:', err);
    res.status(500).json({ error: 'Failed to save state.' });
  }
});

// DELETE /api/state — clear saved state (used on restart/new team)
router.delete('/', (_req, res) => {
  try {
    if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
    res.json({ ok: true });
  } catch (err) {
    console.error('State delete error:', err);
    res.status(500).json({ error: 'Failed to clear state.' });
  }
});

module.exports = router;
