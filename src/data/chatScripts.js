// Scripted question sequences for the simulated AI-agent chat.
// These are fixed prompts — there is no real LLM behind this, just a
// small state machine in ChatBuilder that walks through each step.

export const TEAM_SETUP_SCRIPT = [
  {
    key: 'teamName',
    prompt: "Let's build a new team. What would you like to call it?",
    placeholder: "e.g. 'Digital Innovation Team'",
  },
  {
    key: 'purpose',
    prompt: "Why are you building this team? What's it here to do?",
    placeholder: 'e.g. Explore and pilot new digital tools for the airline',
  },
  {
    key: 'peopleType',
    prompt: 'What kind of people or skills will this team need?',
    placeholder: 'e.g. Researchers, analysts, project managers',
  },
  {
    key: 'peopleCount',
    prompt: 'Roughly how many people should be on this team?',
    placeholder: 'e.g. 5',
  },
];

export const TEAM_IMPORT_SCRIPT = [
  {
    key: 'name',
    prompt: "Let's add a role to your team. What's the role called?",
    placeholder: "e.g. 'Innovation Project Manager'",
  },
  {
    key: 'responsibilities',
    prompt: 'Good. What does this person spend most of their time doing? A few key duties is enough.',
    placeholder: 'e.g. Research, stakeholder updates, reporting',
  },
  {
    key: 'teamSize',
    prompt: 'How many people are currently in this role?',
    placeholder: 'e.g. 1',
  },
];

// The full "Part 1" journey: mission definition with a feedback loop,
// constraints capture, then an AI-proposed target org chart with one
// scripted revision. Steps use ids + next for branching; `content`
// descriptors are rendered by MissionScreen (mission cards, org charts).
export const MISSION_ORG_SCRIPT = [
  {
    id: 'teamName',
    key: 'teamName',
    prompt:
      "Welcome — I'm your team design agent. Let's give your team a clear starting point. First, what's the team called?",
    placeholder: "e.g. 'Digital Innovation Team'",
  },
  {
    id: 'purpose',
    key: 'purpose',
    prompt: (a) =>
      `Great. In your own words, why does ${a.teamName || 'this team'} exist? What should it make happen for the airline?`,
    placeholder: 'e.g. Explore and pilot new digital and AI tools for the airline',
  },
  {
    id: 'constraints',
    key: 'constraints',
    prompt:
      "Before I draft anything — what's getting in the way today? Tell me about the blockers, funding limits or missing capabilities you're dealing with.",
    placeholder: 'e.g. No partnerships, late funding approvals, no tools or platforms…',
  },
  {
    id: 'constraintsAck',
    type: 'info',
    prompt:
      "That matches what I'm seeing in your team's records. I've logged five constraints: no partnerships pathway, late financial approvals, missing tools and synthetic data, unclear IP guidelines, and no prototype platforms. I'll make sure the mission and org design answer these directly.",
    delay: 2600,
  },
  {
    id: 'missionDraft1',
    type: 'info',
    prompt: "Here's a first draft of your Mission & Objectives:",
    content: { kind: 'missionCard', version: 1 },
    delay: 2600,
  },
  {
    id: 'missionChoice1',
    key: 'missionAccepted',
    type: 'choice',
    prompt: 'How does this look? You can accept it, or tell me what to change.',
    options: [
      { value: 1, label: 'Accept this mission', next: 'orgIntro' },
      { value: 'feedback', label: 'I want to change something', next: 'missionFeedback' },
    ],
  },
  {
    id: 'missionFeedback',
    key: 'missionFeedback',
    prompt: "Tell me what's missing or wrong and I'll revise it.",
    placeholder: "e.g. There's nothing about partnerships",
    next: 'missionDraft2',
  },
  {
    id: 'missionDraft2',
    type: 'info',
    prompt:
      "Good catch — especially given partnerships came up in your constraints. Here's a revised version:",
    content: { kind: 'missionCard', version: 2 },
    delay: 2600,
  },
  {
    id: 'missionChoice2',
    key: 'missionAccepted',
    type: 'choice',
    prompt: 'Better?',
    options: [{ value: 2, label: 'Accept this mission', next: 'orgIntro' }],
  },
  {
    id: 'orgIntro',
    type: 'info',
    prompt:
      "Mission locked in. Now I'll design the target org to deliver it — I'm using your existing people, their CVs and job descriptions, their skills and proficiency levels (Beginner → Expert), and the constraints we logged.",
    delay: 2800,
  },
  {
    id: 'orgProposal1',
    type: 'info',
    prompt:
      "Here's my proposed target org — three sub-teams, with two new roles that unblock your platform and data constraints:",
    content: { kind: 'orgChart', version: 1 },
    delay: 3000,
  },
  {
    id: 'orgChoice1',
    key: 'orgAccepted',
    type: 'choice',
    prompt: 'Shall I lock this in, or would you like changes?',
    options: [
      { value: 1, label: 'Accept this org chart', next: 'wrapUp' },
      { value: 'feedback', label: 'Request changes', next: 'orgFeedback' },
    ],
  },
  {
    id: 'orgFeedback',
    key: 'orgFeedback',
    prompt: 'What should be different?',
    placeholder: 'e.g. Who owns partnerships in this structure?',
    next: 'orgProposal2',
  },
  {
    id: 'orgProposal2',
    type: 'info',
    prompt:
      "You're right — the structure didn't answer your partnerships and IP constraints. I've added a Partnerships & Ecosystem sub-team with a Partnerships Lead and an IP & AI Ethics Advisor, both new roles:",
    content: { kind: 'orgChart', version: 2 },
    delay: 3000,
  },
  {
    id: 'orgChoice2',
    key: 'orgAccepted',
    type: 'choice',
    prompt: 'How about now?',
    options: [{ value: 2, label: 'Accept this org chart', next: 'wrapUp' }],
  },
  {
    id: 'wrapUp',
    type: 'info',
    prompt:
      "Done — your mission and target org chart are saved. Next I'll map your current team onto the new structure so you can see who fits where, and where the gaps are…",
    delay: 2200,
    end: true,
  },
];

export const ANALYSE_SCRIPT = [
  {
    key: 'name',
    prompt: "What role would you like analysed? Type its name or a short description.",
    placeholder: "e.g. 'Digital Innovation Analyst'",
  },
  {
    key: 'responsibilities',
    prompt: 'What are the main things this role is responsible for day to day?',
    placeholder: 'e.g. Research, reporting, stakeholder communication',
  },
];
