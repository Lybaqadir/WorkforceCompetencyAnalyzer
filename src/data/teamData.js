// Central dummy data for the TeamLens prototype.
// All screens read from this file so the story stays consistent everywhere.

export const roles = [
  {
    id: 'dia',
    name: 'Digital Innovation Analyst',
    aiPercent: 55,
    humanPercent: 45,
    verdict: 'Hybrid',
    competencies: [
      { name: 'Research and analysis', type: 'ai' },
      { name: 'Technology evaluation', type: 'ai' },
      { name: 'Stakeholder communication', type: 'human' },
      { name: 'Report writing', type: 'ai' },
      { name: 'Problem solving', type: 'human' },
      { name: 'Project coordination', type: 'human' },
      { name: 'Data interpretation', type: 'ai' },
      { name: 'Creative thinking', type: 'human' },
    ],
    cost: 'Roughly 45% cheaper per task with an AI agent',
    risk: 'Medium — some decisions here need human judgment that AI gets wrong',
    gains: [
      'Faster turnaround on repetitive tasks',
      'Available around the clock',
      'Consistent output quality every time',
    ],
    losses: [
      'Human judgment on unexpected situations',
      'Relationship building with stakeholders',
      'Adaptability when things do not go to plan',
    ],
    recommendation: 'Hybrid — keep a human, give the repetitive parts to an AI agent',
  },
  {
    id: 'ara',
    name: 'AI Research Associate',
    aiPercent: 62,
    humanPercent: 38,
    verdict: 'Hybrid',
    competencies: [
      { name: 'Research and analysis', type: 'ai' },
      { name: 'Technology evaluation', type: 'ai' },
      { name: 'Data interpretation', type: 'ai' },
      { name: 'Report writing', type: 'ai' },
      { name: 'Trend spotting', type: 'ai' },
      { name: 'Stakeholder communication', type: 'human' },
      { name: 'Problem solving', type: 'human' },
      { name: 'Creative thinking', type: 'human' },
    ],
    cost: 'Roughly 50% cheaper per task with an AI agent',
    risk: 'Low to Medium — most tasks are research-based and well suited to AI',
    gains: [
      'Faster turnaround on repetitive tasks',
      'Available around the clock',
      'Consistent output quality every time',
    ],
    losses: [
      'Human judgment on unexpected situations',
      'Context on why a finding actually matters',
      'Adaptability when things do not go to plan',
    ],
    recommendation: 'Hybrid — let AI run the research, keep a person to shape the story',
  },
  {
    id: 'ipm',
    name: 'Innovation Project Manager',
    aiPercent: 40,
    humanPercent: 60,
    verdict: 'Human Critical',
    competencies: [
      { name: 'Project coordination', type: 'human' },
      { name: 'Stakeholder communication', type: 'human' },
      { name: 'Problem solving', type: 'human' },
      { name: 'Report writing', type: 'ai' },
      { name: 'Budget tracking', type: 'ai' },
      { name: 'Risk assessment', type: 'human' },
      { name: 'Status reporting', type: 'ai' },
      { name: 'Team leadership', type: 'human' },
    ],
    cost: 'Roughly 25% cheaper per task with an AI agent',
    risk: 'High — this role carries decisions and relationships an AI cannot own',
    gains: [
      'Faster turnaround on status updates',
      'Always-on tracking of deadlines',
      'Consistent formatting on reports',
    ],
    losses: [
      'Judgment calls when a project goes off track',
      'Trust built with senior stakeholders',
      'Ability to read the room in difficult conversations',
    ],
    recommendation: 'Human Critical — keep this role human, automate the admin around it',
  },
  {
    id: 'dis',
    name: 'Data Insights Specialist',
    aiPercent: 58,
    humanPercent: 42,
    verdict: 'Hybrid',
    competencies: [
      { name: 'Data interpretation', type: 'ai' },
      { name: 'Research and analysis', type: 'ai' },
      { name: 'Report writing', type: 'ai' },
      { name: 'Dashboard building', type: 'ai' },
      { name: 'Stakeholder communication', type: 'human' },
      { name: 'Problem solving', type: 'human' },
      { name: 'Creative thinking', type: 'human' },
      { name: 'Quality checking', type: 'human' },
    ],
    cost: 'Roughly 48% cheaper per task with an AI agent',
    risk: 'Medium — data quality checks still need a careful human eye',
    gains: [
      'Faster turnaround on repetitive tasks',
      'Available around the clock',
      'Consistent output quality every time',
    ],
    losses: [
      'Judgment on which numbers actually matter',
      'Relationship building with stakeholders',
      'Catching data issues that look fine on the surface',
    ],
    recommendation: 'Hybrid — automate the number-crunching, keep a person on the story',
  },
  {
    id: 'dpc',
    name: 'Digital Products Coordinator',
    aiPercent: 75,
    humanPercent: 25,
    verdict: 'AI Candidate',
    competencies: [
      { name: 'Data entry', type: 'ai' },
      { name: 'Report drafting', type: 'ai' },
      { name: 'Meeting scheduling', type: 'ai' },
      { name: 'Basic research', type: 'ai' },
      { name: 'Status tracking', type: 'ai' },
      { name: 'Relationship building', type: 'human' },
      { name: 'Creative problem solving', type: 'human' },
      { name: 'Stakeholder communication', type: 'human' },
    ],
    cost: 'Roughly 60% cheaper per task with an AI agent',
    risk: 'Low — most of this role is repeatable, well-defined work',
    gains: [
      'Faster turnaround on repetitive tasks',
      'Available around the clock',
      'Consistent output quality every time',
    ],
    losses: [
      'Relationship building with stakeholders',
      'Creative problem solving on edge cases',
      'A human presence in day-to-day team coordination',
    ],
    recommendation: 'AI Candidate — a full human hire is probably not needed here',
  },
];

export const roleById = (id) => roles.find((r) => r.id === id);

export const teamMetrics = {
  health: 71,
  skillBalance: 58,
  gaps: 3,
  overlaps: 2,
};

export const industryInsights = [
  {
    icon: '🌐',
    stat: '68% of Digital Innovation roles are shifting to hybrid AI and human models globally',
    context: 'Most innovation teams are now splitting work between people and AI agents',
  },
  {
    icon: '📈',
    stat: 'AI Literacy is the fastest growing skill in innovation teams worldwide',
    context: 'Knowing how to work with AI tools is becoming as important as technical skills',
  },
  {
    icon: '⚡',
    stat: 'Teams using AI agents for research report 40% faster project turnaround',
    context: 'Offloading repetitive research tasks to AI frees people for higher value work',
  },
  {
    icon: '💼',
    stat: 'Innovation teams with clear AI versus human role splits get higher budget approvals',
    context: 'VPs who can show a clear team structure get more resources allocated',
  },
];

export const observations = [
  {
    border: 'border-red',
    text: 'The Digital Products Coordinator role is 75% AI-doable. You may not need a full human hire for this position.',
  },
  {
    border: 'border-gold',
    text: 'Two roles look very similar — Digital Innovation Analyst and AI Research Associate share 65% of the same skills. Worth reviewing before your next hire.',
  },
  {
    border: 'border-maroon',
    text: 'Your team has no one covering Change Management. This skill is flagged as critical for innovation teams in the next 2 years.',
  },
];

export const skillCoverage = {
  covered: ['Research', 'Data Analysis', 'Report Writing'],
  watch: ['Creative Strategy', 'Stakeholder Management'],
  missing: ['Change Management', 'AI Ethics', 'Budget Planning'],
};

export const skillGapDetails = [
  {
    skill: 'Change Management',
    reason:
      'Bringing AI into a team changes how people work day to day, and right now nobody owns making sure that transition goes smoothly.',
  },
  {
    skill: 'AI Ethics',
    reason:
      'As AI agents take on more tasks, nobody on the team is responsible for making sure they are used safely and fairly.',
  },
  {
    skill: 'Budget Planning',
    reason:
      'Any future hire or AI rollout needs a cost case behind it — nobody on the team currently owns that thinking.',
  },
];

export const workloadStatus = [
  {
    role: 'Digital Innovation Analyst',
    status: 'gold',
    label: 'Carrying too much alone',
    detail:
      'Stakeholder Communication, Problem Solving, and Project Coordination sit only with this role — no one else on the team shares them, so this work has no backup.',
  },
  {
    role: 'AI Research Associate',
    status: 'green',
    label: 'Well balanced',
    detail: 'Their key skills are also covered by at least one other role on the team.',
  },
  {
    role: 'Innovation Project Manager',
    status: 'gold',
    label: 'Some tasks could be automated',
    detail:
      'Report Writing, Budget Tracking, and Status Reporting are AI-doable — automating them would free this person for higher-value leadership work.',
  },
  {
    role: 'Data Insights Specialist',
    status: 'green',
    label: 'Well balanced',
    detail: 'Workload here matches what one person can realistically own, with backup elsewhere on the team.',
  },
  {
    role: 'Digital Products Coordinator',
    status: 'red',
    label: 'Mostly AI-doable work',
    detail:
      'Data Entry, Report Drafting, Scheduling, and Basic Research make up 75% of this role — most of what this person does day to day does not need to be done by a human.',
  },
];

export const overlaps = [
  {
    roleA: 'Digital Innovation Analyst',
    roleB: 'AI Research Associate',
    percent: 65,
    shared: ['Research', 'Technology Evaluation', 'Data Interpretation'],
    note: 'Consider redefining these roles before your next hire',
  },
  {
    roleA: 'Innovation Project Manager',
    roleB: 'Digital Products Coordinator',
    percent: 58,
    shared: ['Project Coordination', 'Report Writing', 'Stakeholder Communication'],
    note: 'One of these roles may be redundant',
  },
];

export const healthFactors = [
  { label: 'Balance', score: 65, note: 'Slightly too many AI-replaceable roles' },
  { label: 'Coverage', score: 70, note: 'Missing 3 skills the team will need soon' },
  { label: 'Role Clarity', score: 78, note: 'Two roles are too similar and need review' },
];

export const futureSkills = [
  {
    name: 'AI Ethics and Responsible AI',
    reason: 'As AI agents take on more tasks someone needs to make sure they are used safely',
    timing: 'Soon',
  },
  {
    name: 'Change Management',
    reason: 'Bringing AI into a team changes how people work and someone needs to manage that',
    timing: 'Soon',
  },
  {
    name: 'Prompt Design',
    reason: 'Working well with AI tools means knowing how to give them the right instructions',
    timing: 'Soon',
  },
  {
    name: 'Human and AI Collaboration',
    reason: 'Getting the best from a mixed human and AI team is its own skill',
    timing: 'Next Year',
  },
  {
    name: 'AI Performance Monitoring',
    reason: 'Once AI agents are running someone needs to check they are actually doing a good job',
    timing: 'Next Year',
  },
  {
    name: 'Strategic AI Planning',
    reason: 'Deciding where AI should and should not be used requires senior level thinking',
    timing: 'Further Ahead',
  },
];

export const jobDescriptions = {
  dia: {
    person: {
      about:
        'This person leads the thinking and relationship side of digital innovation work. They make judgment calls, work directly with other teams, and make sure the right problems are being solved in the right way.',
      duties: [
        'Decide which new technologies are worth exploring',
        'Work with other teams to understand their problems',
        'Lead conversations with senior stakeholders',
        'Review and approve AI-generated research and reports',
        'Make judgment calls when things do not go to plan',
        'Represent the innovation team in cross-functional meetings',
      ],
      skills: [
        'Strong critical thinking and judgment',
        'Confident communicator at all levels',
        'Comfortable working with ambiguity',
        'Ability to evaluate technology without being purely technical',
        'Collaborative and able to bring different teams together',
        'Curious and always learning',
      ],
      worksWith: 'Product teams, IT, senior leadership, and the AI agents working alongside them',
    },
    agent: {
      about:
        'This AI agent handles the repetitive, data-heavy, and time-consuming parts of digital innovation work — freeing the human in this role to focus on thinking, deciding, and connecting with people.',
      tasks: [
        'Searches and summarises research on new technologies',
        'Drafts initial reports and documentation',
        'Monitors industry news and flags relevant updates',
        'Organises and categorises information from multiple sources',
        'Generates first draft presentations from notes and data',
        'Tracks project progress and sends status updates',
      ],
      needs: [
        'Access to research databases and the internet',
        "Connected to the team's document and project systems",
        'Clear templates for reports and presentations',
        'Defined rules for what to flag versus handle automatically',
      ],
      handsBack: [
        'Anything requiring a decision or judgment call',
        'Any communication involving senior stakeholders',
        'Situations it has not seen before or cannot confidently handle',
      ],
    },
  },
  ara: {
    person: {
      about:
        'This person owns the meaning behind the research. They decide what is worth investigating, judge which findings actually matter, and turn raw research into a story leadership can act on.',
      duties: [
        'Decide which research questions matter most right now',
        'Judge the credibility and relevance of AI-gathered findings',
        'Turn research into clear recommendations for leadership',
        'Work with other teams to understand what they need to know',
        'Present findings to stakeholders and answer follow-up questions',
        'Spot patterns across research that AI tools miss on their own',
      ],
      skills: [
        'Sharp analytical and critical thinking',
        'Able to separate signal from noise in large amounts of information',
        'Clear written and verbal communicator',
        'Comfortable challenging AI-generated conclusions',
        'Curious and genuinely interested in emerging technology',
        'Good judgment about what is worth escalating',
      ],
      worksWith: 'Innovation leadership, product teams, and the AI research agents supporting them',
    },
    agent: {
      about:
        'This AI agent does the heavy lifting of gathering and organising research so the person in this role can spend their time interpreting it rather than collecting it.',
      tasks: [
        'Scans industry sources for relevant new developments',
        'Summarises long reports and papers into short briefings',
        'Builds comparison tables across tools and technologies',
        'Tracks competitor and market activity automatically',
        'Drafts research summaries ready for human review',
        'Flags anything unusual or high priority as it appears',
      ],
      needs: [
        'Access to research databases and industry news sources',
        'Clear criteria for what counts as relevant or urgent',
        'Standard formats for briefings and summaries',
        'A feedback loop so it learns what the team finds useful',
      ],
      handsBack: [
        'Any judgment about which findings actually matter',
        'Final recommendations presented to leadership',
        'Anything that requires context the AI does not have',
      ],
    },
  },
  ipm: {
    person: {
      about:
        'This person keeps innovation projects moving and on track. They manage people, resolve roadblocks, and are the one accountable when something needs a real decision rather than a status update.',
      duties: [
        'Set project priorities and timelines',
        'Resolve roadblocks that need a judgment call',
        'Lead project meetings and stakeholder updates',
        'Manage the people working across each project',
        'Escalate risks that need senior attention',
        'Make the final call when plans need to change',
      ],
      skills: [
        'Strong organisational and leadership skills',
        'Calm decision-making under pressure',
        'Confident communicator with senior stakeholders',
        'Able to manage competing priorities',
        'Good at reading team dynamics and morale',
        'Comfortable owning outcomes, not just tasks',
      ],
      worksWith: 'Project teams, senior leadership, external partners, and the AI agents tracking project status',
    },
    agent: {
      about:
        'This AI agent keeps projects organised and visible, handling the tracking and reporting so the project manager can focus on decisions and people.',
      tasks: [
        'Tracks task progress across all active projects',
        'Sends automatic status updates to stakeholders',
        'Flags deadlines that are at risk of slipping',
        'Drafts meeting agendas and follow-up notes',
        'Maintains project documentation and timelines',
        'Compiles regular progress reports',
      ],
      needs: [
        "Access to the team's project management system",
        'Clear project milestones and deadlines to track against',
        'Defined thresholds for what counts as at risk',
        'Templates for status updates and reports',
      ],
      handsBack: [
        'Any decision about changing project scope or timeline',
        'Difficult conversations with stakeholders or the team',
        'Situations where priorities need to be judged, not just tracked',
      ],
    },
  },
  dis: {
    person: {
      about:
        'This person makes sure the numbers actually mean something. They decide what to measure, catch issues the data hides, and turn analysis into decisions leadership can trust.',
      duties: [
        'Decide which questions the data should answer',
        'Review AI-generated analysis for accuracy and relevance',
        'Turn data findings into clear, actionable recommendations',
        'Work with teams to understand what they need to measure',
        'Catch data quality issues before they reach leadership',
        'Present insights in a way non-technical people understand',
      ],
      skills: [
        'Strong analytical thinking and attention to detail',
        'Able to explain data simply to non-experts',
        'Healthy scepticism about numbers that look too clean',
        'Comfortable working with ambiguous or incomplete data',
        'Collaborative and responsive to what teams actually need',
        'Curious about the story behind the numbers',
      ],
      worksWith: 'Innovation and product teams, leadership, and the AI agents processing the underlying data',
    },
    agent: {
      about:
        'This AI agent processes and organises data continuously, giving the person in this role clean, ready-to-review analysis instead of raw numbers.',
      tasks: [
        'Pulls and cleans data from multiple systems',
        'Builds and updates dashboards automatically',
        'Runs standard analysis and highlights key trends',
        'Drafts data summaries and first-pass reports',
        'Flags anomalies or outliers in the data',
        'Keeps historical data organised and accessible',
      ],
      needs: [
        'Access to the team\'s data sources and systems',
        'Defined metrics and reporting standards',
        'Rules for what counts as an anomaly worth flagging',
        'Regular review to keep dashboards aligned to real needs',
      ],
      handsBack: [
        'Judgment about which findings matter most',
        'Any data quality issue that looks ambiguous',
        'Final recommendations presented to stakeholders',
      ],
    },
  },
  dpc: {
    person: {
      about:
        'This person is the human face of digital product coordination — building relationships, handling the unexpected, and making sure the small percentage of judgment-heavy work gets the right attention.',
      duties: [
        'Handle exceptions and edge cases that need a judgment call',
        'Build relationships with teams relying on digital products',
        'Step in when something needs a creative solution',
        'Review and sign off on AI-coordinated schedules and reports',
        'Represent the team in occasional stakeholder conversations',
        'Spot when a process needs to change rather than just be followed',
      ],
      skills: [
        'Good judgement in unclear or unusual situations',
        'Comfortable working alongside AI-run processes',
        'Personable and easy to work with',
        'Practical problem solver',
        'Organised, but not afraid to challenge a process',
        'Reliable point of contact for other teams',
      ],
      worksWith: 'Product teams, other coordinators, and the AI agent handling day-to-day tasks',
    },
    agent: {
      about:
        'This AI agent runs almost all of the routine coordination work in this role — freeing the very small amount of human time needed for the parts that genuinely require a person.',
      tasks: [
        'Handles data entry across coordination systems',
        'Drafts routine reports and status updates',
        'Schedules meetings and manages calendars',
        'Carries out basic research requests',
        'Tracks the status of ongoing coordination tasks',
        'Sends reminders and routine follow-ups automatically',
      ],
      needs: [
        'Access to scheduling and coordination systems',
        'Clear templates for recurring reports',
        'Defined rules for what to escalate to a person',
        'Regular check-ins to confirm it is on track',
      ],
      handsBack: [
        'Anything requiring relationship building or negotiation',
        'Unusual requests that do not fit a standard process',
        'Situations needing a creative or judgment-based solution',
      ],
    },
  },
};

export const whatIfDefault = {
  dpc: { replaceAI: true, remove: false },
};

export const whatIfImpact = {
  dpc: {
    lost: ['Relationship building', 'Creative problem solving'],
    gainedByAI: ['Data entry', 'Report drafting', 'Meeting scheduling', 'Basic research'],
    newScore: 76,
    note: 'Replacing this role with an AI agent improves your team balance and frees human capacity for more important work',
  },
  dia: {
    lost: ['Stakeholder communication', 'Creative thinking'],
    gainedByAI: ['Research and analysis', 'Technology evaluation', 'Report writing', 'Data interpretation'],
    newScore: 64,
    note: 'This role carries too much judgment-based work — removing the human here creates real gaps',
  },
  ara: {
    lost: ['Stakeholder communication', 'Problem solving'],
    gainedByAI: ['Research and analysis', 'Technology evaluation', 'Data interpretation', 'Report writing'],
    newScore: 70,
    note: 'A reasonable swap — most of this role is well suited to an AI agent already',
  },
  ipm: {
    lost: ['Stakeholder communication', 'Problem solving', 'Team leadership', 'Risk assessment'],
    gainedByAI: ['Report writing', 'Budget tracking', 'Status reporting'],
    newScore: 55,
    note: 'This role is human critical — removing the person here creates significant risk',
  },
  dis: {
    lost: ['Stakeholder communication', 'Creative thinking', 'Quality checking'],
    gainedByAI: ['Data interpretation', 'Research and analysis', 'Report writing', 'Dashboard building'],
    newScore: 68,
    note: 'A workable swap, but data quality checks will need closer attention elsewhere',
  },
};

export const removedRoleImpact = {
  dia: ['Stakeholder communication', 'Creative thinking', 'Problem solving'],
  ara: ['Trend spotting', 'Creative thinking'],
  ipm: ['Team leadership', 'Risk assessment', 'Project coordination'],
  dis: ['Quality checking', 'Creative thinking'],
  dpc: ['Relationship building', 'Creative problem solving'],
};
