const express = require('express');
const { chatStream, chatJson } = require('../lib/azureOpenAI');
const {
  ONBOARDING_SYSTEM,
  TEAM_COLLECTION_SYSTEM,
  OPERATING_MODEL_SYSTEM,
  ORG_PROJECTION_SYSTEM,
} = require('../lib/prompts');

const router = express.Router();

// In-memory session store
const sessions = new Map();

function getSession(id) {
  if (!sessions.has(id)) {
    sessions.set(id, {
      messages: [],
      stage: 1,
      workflowStage: 'onboarding',
      missionDraft: null,
      orgProposal: null,
      teamMembers: [],
    });
  }
  return sessions.get(id);
}

// Build system prompt with optional workflow context injected
function buildSystemPrompt(workflowStage, contextData) {
  if (workflowStage === 'team-collection') {
    const ctx = contextData
      ? JSON.stringify({
          mission: contextData.mission,
          targetOrg: contextData.targetOrg,
          teamMembersAlreadyAdded: contextData.teamMembers || [],
        }, null, 2)
      : 'No context provided.';
    return TEAM_COLLECTION_SYSTEM.replace('{{WORKFLOW_CONTEXT}}', ctx);
  }
  // During onboarding, give the model the exact draft the user is reviewing so
  // revisions are applied to the real current version, not a remembered one.
  if (contextData?.missionDraft) {
    return `${ONBOARDING_SYSTEM}\n\nCURRENT MISSION DRAFT (the exact latest version the user sees — base any revision on this):\n${JSON.stringify(contextData.missionDraft)}`;
  }
  return ONBOARDING_SYSTEM;
}

const ONBOARDING_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'advance_stage',
      description: 'Advance the onboarding journey to the next numbered stage.',
      parameters: {
        type: 'object',
        properties: {
          stage: { type: 'integer', enum: [2, 3, 4, 5], description: 'Stage number to advance to' },
        },
        required: ['stage'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_mission',
      description: 'Draft and present a mission statement to the user after collecting team name, purpose, and constraints.',
      parameters: {
        type: 'object',
        properties: {
          statement: { type: 'string' },
          objectives: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                metric: { type: 'string' },
                detail: { type: 'string' },
              },
              required: ['title', 'metric', 'detail'],
            },
          },
          constraints: { type: 'array', items: { type: 'string' } },
        },
        required: ['statement', 'objectives', 'constraints'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_org',
      description: 'Present a target org chart. Call only after receiving confirmation the mission is accepted.',
      parameters: {
        type: 'object',
        properties: {
          roles: {
            type: 'array',
            description: 'Org tree — first item is root. Use nested children for hierarchy.',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                type: { type: 'string', enum: ['human', 'ai', 'hybrid'] },
                category: { type: 'string', description: 'Capability area this role owns, e.g. "Governance & Risk", "AI Orchestration"' },
                headcount: { type: 'integer', minimum: 1, description: 'Seats for this role. AI agents are always 1.' },
                rationale: { type: 'string' },
                skills: { type: 'array', items: { type: 'string' } },
                externalPartners: { type: 'array', items: { type: 'string' }, description: 'Named external ecosystem partners this role owns relationships with' },
                children: { type: 'array' },
              },
              required: ['id', 'title', 'type', 'category', 'headcount', 'rationale', 'skills', 'children'],
            },
          },
        },
        required: ['roles'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_onboarding',
      description: 'Signal that both mission and org chart have been presented. Call after propose_org resolves.',
      parameters: {
        type: 'object',
        properties: {
          mission: { type: 'object' },
          targetOrg: { type: 'object' },
        },
        required: ['mission', 'targetOrg'],
      },
    },
  },
];

const TEAM_COLLECTION_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'add_team_member',
      description: 'Record a team member once you have enough information about them.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          currentRole: { type: 'string' },
          experience: { type: 'string', description: 'One sentence summary of their experience' },
          skills: { type: 'array', items: { type: 'string' } },
          education: { type: 'string' },
          certifications: { type: 'array', items: { type: 'string' } },
          technicalSkills: { type: 'array', items: { type: 'string' } },
          softSkills: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'currentRole', 'experience', 'skills', 'education', 'certifications', 'technicalSkills', 'softSkills'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'finish_team_collection',
      description: 'Signal that all team members have been added and collection is complete.',
      parameters: {
        type: 'object',
        properties: {
          totalMembersAdded: { type: 'integer' },
        },
        required: ['totalMembersAdded'],
      },
    },
  },
];

// The org chart must ALWAYS come from this pipeline, no matter how generation
// was triggered: Step A designs an internal operating model (never shown to
// the user), Step B projects it into the org via a forced propose_org call.
// Emits the propose_org and complete_onboarding SSE events itself.
async function runOrgPipeline({ session, missionDraft, send, systemPrompt, streamFollowUp }) {
  const transcript = session.messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content)
    .map((m) => `${m.role === 'user' ? 'Team leader' : 'Consultant'}: ${m.content}`)
    .join('\n');
  const analysisInput = `DISCOVERY CONVERSATION:\n${transcript}\n\nACCEPTED MISSION:\n${JSON.stringify(missionDraft)}\n\nDesign the operating model now.`;

  // Step A — internal operating-model design (never shown to the user)
  let operatingModel = null;
  for (let attempt = 0; attempt < 2 && !operatingModel; attempt += 1) {
    operatingModel = await chatJson(
      [
        { role: 'system', content: OPERATING_MODEL_SYSTEM },
        { role: 'user', content: analysisInput },
      ],
      2500,
    ).catch((err) => {
      console.error('Operating model design failed:', err?.status, err?.message);
      return null;
    });
  }
  if (!operatingModel) {
    console.warn('Operating model unavailable after retry — projecting without it.');
  }

  // Step B — project the operating model into the org chart (forced tool call)
  const projectionSystem = operatingModel
    ? `${ORG_PROJECTION_SYSTEM}\n\nOPERATING MODEL (project this faithfully):\n${JSON.stringify(operatingModel)}`
    : `${ORG_PROJECTION_SYSTEM}\n\nNo operating model is available. Design the best possible mission-specific hybrid Human + AI organisation directly from this context:\n${analysisInput}`;

  let orgCall = null;
  for (let attempt = 0; attempt < 2 && !orgCall; attempt += 1) {
    const { toolCalls } = await chatStream(
      [
        { role: 'system', content: projectionSystem },
        { role: 'user', content: 'Generate the target organisation now.' },
      ],
      ONBOARDING_TOOLS.filter((t) => t.function.name === 'propose_org'),
      null,
      null,
      3500,
      { type: 'function', function: { name: 'propose_org' } },
    );
    orgCall = toolCalls.find((tc) => tc.name === 'propose_org' && tc.parsed?.roles?.length) || null;
  }
  if (!orgCall) return false;

  // The model often overshoots the 12-role hard cap under competing rules —
  // enforce it with one corrective pass instead of trusting its counting.
  const countRoles = (nodes) => (nodes || []).reduce((n, r) => n + 1 + countRoles(r.children), 0);
  const total = countRoles(orgCall.parsed.roles);
  if (total > 12) {
    console.warn(`Org projection has ${total} roles (cap 12) — running corrective pass.`);
    const { toolCalls: fixed } = await chatStream(
      [
        { role: 'system', content: projectionSystem },
        { role: 'user', content: `Your previous projection contained ${total} roles, violating the HARD LIMIT of 12 total. Re-emit the organisation with at most 12 roles: merge related responsibilities and keep only the highest-leverage AI agents. Preserve the single root and all constraint coverage. Previous output:\n${orgCall.raw}` },
      ],
      ONBOARDING_TOOLS.filter((t) => t.function.name === 'propose_org'),
      null,
      null,
      3500,
      { type: 'function', function: { name: 'propose_org' } },
    );
    const candidates = fixed.filter((tc) => tc.name === 'propose_org' && tc.parsed?.roles?.length);
    const corrected = candidates.find((tc) => countRoles(tc.parsed.roles) <= 12)
      || candidates.find((tc) => countRoles(tc.parsed.roles) < total);
    if (corrected) orgCall = corrected;
    else console.warn('Corrective pass did not reduce the role count — keeping the original projection.');
  }

  session.orgProposal = orgCall.parsed;
  send({ type: 'tool', name: 'propose_org', data: orgCall.parsed });
  send({ type: 'tool', name: 'complete_onboarding', data: { mission: missionDraft, targetOrg: orgCall.parsed } });

  session.messages.push({
    role: 'assistant',
    content: null,
    tool_calls: [{ id: orgCall.id || 'org_projection', type: 'function', function: { name: 'propose_org', arguments: orgCall.raw } }],
  });
  session.messages.push({
    role: 'tool',
    tool_call_id: orgCall.id || 'org_projection',
    content: 'Presented to user successfully.',
  });

  if (streamFollowUp) {
    let followText = '';
    await chatStream(
      [{ role: 'system', content: systemPrompt }, ...session.messages],
      undefined,
      (token) => {
        followText += token;
        send({ type: 'token', text: token });
      },
      null,
      200,
    );
    if (followText) {
      session.messages.push({ role: 'assistant', content: followText });
    }
  }
  return true;
}

// POST /api/chat/stream
router.post('/stream', async (req, res) => {
  const { sessionId, message, screen, workflowStage, contextData, history } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const session = getSession(sessionId);

    const activeStage = workflowStage || screen || 'onboarding';
    const isInit = message === '__init__';

    if (isInit) {
      // Conversation (re)start — the client's history is authoritative. An empty
      // history means a truly fresh start; any stale in-memory session for this
      // id must be discarded or the model replays the old conversation and
      // immediately re-fires propose_mission.
      session.messages = (Array.isArray(history) ? history : []).filter((m) => m.role && m.content);
    } else if (history && Array.isArray(history) && session.messages.length === 0) {
      // If history is provided and session is empty, pre-populate (handles page refresh)
      session.messages = history.filter((m) => m.role && m.content);
    }

    if (!isInit) {
      session.messages.push({ role: 'user', content: message });
    }

    const systemPrompt = buildSystemPrompt(
      activeStage,
      contextData?.missionDraft ? contextData : (session.missionDraft ? { ...contextData, missionDraft: session.missionDraft } : contextData),
    );
    const sysMessages = [{ role: 'system', content: systemPrompt }, ...session.messages];

    // Hidden two-step pipeline: design an operating model internally, then
    // project it into the org chart. The user only ever sees the projection.
    const isOrgGeneration = (activeStage === 'onboarding' || activeStage === 'mission-chat' || screen === 'onboarding')
      && (req.body.intent === 'generate-org'
        || /generate the target organisation chart using propose_org/i.test(message || ''));

    if (isOrgGeneration) {
      const ok = await runOrgPipeline({
        session,
        missionDraft: contextData?.missionDraft || session.missionDraft || null,
        send,
        systemPrompt,
        streamFollowUp: true,
      });
      if (ok) {
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
      console.warn('Org pipeline failed — falling back to generic onboarding stream.');
    }

    // Select tools based on workflow stage
    let tools;
    if (activeStage === 'onboarding' || activeStage === 'mission-chat' || screen === 'onboarding') {
      tools = ONBOARDING_TOOLS;
    } else if (activeStage === 'team-collection') {
      tools = TEAM_COLLECTION_TOOLS;
    }

    let assistantText = '';
    const collectedToolCalls = [];
    const isOnboardingChat = tools === ONBOARDING_TOOLS;
    // The model may try to emit the org itself (e.g. the user typed "mission
    // accepted" in chat instead of clicking Accept). Those attempts are held
    // back — truncation-prone and shallow — and rerouted through the pipeline.
    let orgAttempted = false;

    const { finishReason, dropped } = await chatStream(
      sysMessages,
      tools,
      (token) => {
        assistantText += token;
        send({ type: 'token', text: token });
      },
      (tc) => {
        collectedToolCalls.push(tc);
        if (isOnboardingChat && (tc.name === 'propose_org' || tc.name === 'complete_onboarding')) {
          orgAttempted = true;
          return;
        }
        send({ type: 'tool', name: tc.name, data: tc.parsed });

        if (tc.name === 'advance_stage') session.stage = tc.parsed.stage;
        if (tc.name === 'propose_mission') session.missionDraft = tc.parsed;
        if (tc.name === 'add_team_member') session.teamMembers.push(tc.parsed);
      },
      2000,
    );

    // A truncated/malformed propose_org never reaches the callback — catch it here.
    if (isOnboardingChat && (dropped || []).some((d) => d.name === 'propose_org' || d.name === 'complete_onboarding')) {
      orgAttempted = true;
    }

    if (finishReason === 'tool_calls' && collectedToolCalls.length > 0) {
      session.messages.push({
        role: 'assistant',
        content: assistantText || null,
        tool_calls: collectedToolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: tc.raw },
        })),
      });

      for (const tc of collectedToolCalls) {
        session.messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: 'Presented to user successfully.',
        });
      }

      // Rerouted org generation: replace the model's own (held-back) org with
      // the pipeline's projection before the conversational follow-up.
      if (orgAttempted) {
        const ok = await runOrgPipeline({
          session,
          missionDraft: contextData?.missionDraft || session.missionDraft || null,
          send,
          systemPrompt,
          streamFollowUp: false,
        });
        if (!ok) console.error('Org pipeline failed after rerouting an in-chat org attempt.');
      }

      // Get conversational follow-up
      let followText = '';
      await chatStream(
        [{ role: 'system', content: systemPrompt }, ...session.messages],
        undefined,
        (token) => {
          followText += token;
          send({ type: 'token', text: token });
        },
        null,
        200,
      );

      if (followText) {
        session.messages.push({ role: 'assistant', content: followText });
      }
    } else {
      if (assistantText) {
        session.messages.push({ role: 'assistant', content: assistantText });
      }

      // Recovery guard: the model sometimes claims it prepared/updated the
      // mission without emitting propose_mission (or the tool JSON failed to
      // parse and was silently dropped). Without the tool event the review
      // page never opens and the user is stuck — force the call.
      const claimsDraft = /(prepared|updated|revised|drafted)[^.!?]{0,60}mission/i.test(assistantText || '');
      if (tools === ONBOARDING_TOOLS && claimsDraft) {
        console.warn('Mission draft claimed without tool call — forcing propose_mission.');
        const { toolCalls: forced } = await chatStream(
          [
            { role: 'system', content: systemPrompt },
            ...session.messages,
            { role: 'system', content: 'You told the user the mission draft is ready but never called propose_mission, so they cannot see it. Call propose_mission NOW with the complete current mission — full statement, all 3 objectives, and all constraints.' },
          ],
          ONBOARDING_TOOLS.filter((t) => t.function.name === 'propose_mission'),
          null,
          null,
          1500,
          { type: 'function', function: { name: 'propose_mission' } },
        );
        const mc = forced.find((tc) => tc.name === 'propose_mission' && tc.parsed?.statement);
        if (mc) {
          session.missionDraft = mc.parsed;
          send({ type: 'tool', name: 'propose_mission', data: mc.parsed });
          session.messages.push({
            role: 'assistant',
            content: null,
            tool_calls: [{ id: mc.id || 'forced_mission', type: 'function', function: { name: 'propose_mission', arguments: mc.raw } }],
          });
          session.messages.push({ role: 'tool', tool_call_id: mc.id || 'forced_mission', content: 'Presented to user successfully.' });
        } else {
          console.error('Forced propose_mission recovery also failed to produce a valid call.');
        }
      }

      // Org attempt where every tool call was dropped (e.g. truncated JSON):
      // nothing reached the user — run the pipeline so the org still arrives.
      if (isOnboardingChat && orgAttempted) {
        const ok = await runOrgPipeline({
          session,
          missionDraft: contextData?.missionDraft || session.missionDraft || null,
          send,
          systemPrompt,
          streamFollowUp: true,
        });
        if (!ok) console.error('Org pipeline failed after a dropped in-chat org attempt.');
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Chat stream error:', err?.status, err?.message);
    const message = err?.status === 429
      ? 'The AI service is temporarily rate-limited. Please wait about 30 seconds and try again.'
      : 'Something went wrong. Please try again.';
    send({ type: 'error', message });
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// DELETE /api/chat/session/:id
router.delete('/session/:id', (req, res) => {
  sessions.delete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
