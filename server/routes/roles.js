const express = require('express');

const router = express.Router();

// In-memory store for now (Phase 2: move to Supabase)
const rolesStore = new Map();

// GET /api/roles?teamId=...
router.get('/', (req, res) => {
  const { teamId } = req.query;
  const roles = teamId ? (rolesStore.get(teamId) || []) : [];
  res.json(roles);
});

// POST /api/roles
router.post('/', (req, res) => {
  const { teamId, role } = req.body;
  if (!teamId || !role) return res.status(400).json({ error: 'teamId and role required' });

  const existing = rolesStore.get(teamId) || [];
  const newRole = { id: `role-${Date.now()}`, ...role, createdAt: new Date().toISOString() };
  rolesStore.set(teamId, [...existing, newRole]);
  res.json(newRole);
});

module.exports = router;
