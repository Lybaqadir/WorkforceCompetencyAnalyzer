require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const chatRoute = require('./routes/chat');
const voiceRoute = require('./routes/voice');
const uploadRoute = require('./routes/upload');
const missionRoute = require('./routes/mission');
const analysisRoute = require('./routes/analysis');
const rolesRoute = require('./routes/roles');
const teamfitRoute = require('./routes/teamfit');
const whatifRoute = require('./routes/whatif');
const jobDescRoute = require('./routes/jobDescriptions');
const futureSkillsRoute = require('./routes/futureSkills');
const workflowRoute = require('./routes/workflow');
const stateRoute = require('./routes/state');

const app = express();
const PORT = process.env.PORT || 8000;

// Allow any localhost port — Vite may fall back to 5174+ when 5173 is busy
app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));
app.use(express.json());

app.use('/api', (req, _res, next) => {
  const msg = req.body?.message ? ` msg="${String(req.body.message).slice(0, 60)}"` : '';
  const sid = req.body?.sessionId ? ` sid=${String(req.body.sessionId).slice(0, 8)}` : '';
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}${sid}${msg}`);
  next();
});

app.use('/api/chat', chatRoute);
app.use('/api/voice', voiceRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/mission', missionRoute);
app.use('/api/analysis', analysisRoute);
app.use('/api/roles', rolesRoute);
app.use('/api/teamfit', teamfitRoute);
app.use('/api/whatif', whatifRoute);
app.use('/api/job-descriptions', jobDescRoute);
app.use('/api/future-skills', futureSkillsRoute);
app.use('/api/workflow', workflowRoute);
app.use('/api/state', stateRoute);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`TeamLens server running on http://localhost:${PORT}`);
});
