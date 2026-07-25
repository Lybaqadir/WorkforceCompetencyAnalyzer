import { useRef, useState } from 'react';
import ChatBuilder from '../components/ChatBuilder';
import { OrgChartReveal } from '../components/MiniOrgChart';
import { ArrowRightIcon, CheckIcon, MoonIcon, SparkleIcon, SunIcon } from '../components/icons';
import { apiStream } from '../lib/api';
import WorkflowProgressBar from '../components/WorkflowProgressBar';

// ── Flatten AI nested org tree → flat array needed by OrgChartReveal ────────────
function flattenOrgRoles(nodes, parentId = null) {
  const result = [];
  for (const node of nodes) {
    const id = node.id || node.title?.toLowerCase().replace(/[\s/]+/g, '-') || `role-${Math.random()}`;
    const subTeam = node.type === 'ai' ? 'AI Agent' : node.type === 'hybrid' ? 'Human + AI' : 'Human Role';
    result.push({
      id,
      name: node.title,
      reportsTo: parentId ?? undefined,
      headcount: node.headcount || 1,
      subTeam,
      isNew: true,
      rationale: node.rationale || '',
      category: node.category || '',
      externalPartners: node.externalPartners || [],
      skills: (node.skills || []).map((s) => ({ name: s, level: 'I' })),
      roleType: node.type || 'human',
    });
    if (Array.isArray(node.children) && node.children.length > 0) {
      result.push(...flattenOrgRoles(node.children, id));
    }
  }
  return result;
}

// ── Transform AI mission format → internal format ───────────────────────────────
function transformMission(aiMission) {
  if (!aiMission) return null;
  return {
    ...aiMission,
    objectives: (aiMission.objectives || []).map((obj, i) => {
      const metric = obj.metric || '';
      const parts = metric.trim().split(/\s+/);
      const kpi = parts[0] || '✓';
      const kpiHint = parts.slice(1).join(' ').slice(0, 18) || 'target';
      return { id: `obj-${i}`, kpi, kpiHint, title: obj.title, detail: obj.detail || '' };
    }),
  };
}

const JOURNEY = [
  { label: 'Team & Purpose', hint: 'Who you are and why you exist' },
  { label: 'Constraints', hint: "What's holding the team back" },
  { label: 'Mission Draft', hint: 'Drafted with you until it fits' },
  { label: 'Target Org Chart', hint: 'The structure to deliver it' },
  { label: 'Review & Approve', hint: 'Edit, then approve to continue' },
];

// ── Decorative floating tiles (right side of the welcome hero) ──────────────────
const DECO_TILES = [
  { size: 104, top: '20%', left: '20%', radius: 26, delay: '0s', anim: 'animate-hero-card', grad: 'linear-gradient(135deg, #f59e0b, #b45309)', glass: false },
  { size: 66, top: '60%', left: '9%', radius: 18, delay: '0.7s', anim: 'animate-float', grad: 'linear-gradient(135deg, #818cf8, #4338ca)', glass: false },
  { size: 132, top: '42%', left: '44%', radius: 30, delay: '1.3s', anim: 'animate-hero-card', grad: 'linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.03))', glass: true },
  { size: 74, top: '16%', left: '64%', radius: 20, delay: '0.4s', anim: 'animate-float', grad: 'linear-gradient(135deg, #a5b4fc, #6d5ce7)', glass: false },
  { size: 54, top: '74%', left: '58%', radius: 16, delay: '1.0s', anim: 'animate-hero-card', grad: 'linear-gradient(135deg, #f59e0b, #d97706)', glass: false },
];

function HeroDecoration() {
  return (
    <div className="hidden lg:block absolute top-0 right-0 h-full w-[46%] pointer-events-none select-none">
      {/* Ambient glow */}
      <div
        className="animate-orb-pulse absolute top-1/2 right-[16%] -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.16), rgba(129,140,248,0.13) 52%, transparent 72%)' }}
      />
      {/* Flowing dashed connector weaving between the tiles */}
      <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d="M 6 66 C 26 58 22 30 46 34 S 78 58 88 26"
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="0.3"
          className="hero-line"
        />
      </svg>
      {/* Floating tiles */}
      {DECO_TILES.map((t, i) => (
        <div
          key={i}
          className={`${t.anim} absolute shadow-[0_16px_40px_rgba(0,0,0,0.32)] ${t.glass ? 'border border-white/15 backdrop-blur-sm' : ''}`}
          style={{
            width: t.size,
            height: t.size,
            top: t.top,
            left: t.left,
            borderRadius: t.radius,
            background: t.grad,
            animationDelay: t.delay,
          }}
        />
      ))}
    </div>
  );
}

// ── Welcome splash ───────────────────────────────────────────────────────────────
function WelcomePhase({ onStart, onContinue }) {
  return (
    <div className="relative flex-1 min-h-0 overflow-hidden flex items-center">
      {/* Faint dot texture for depth */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 30% 50%, black, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 30% 50%, black, transparent 78%)',
        }}
      />

      <HeroDecoration />

      {/* Left-aligned content */}
      <div className="relative w-full max-w-xl px-8 md:px-12 xl:pl-20">
        <div
          className="animate-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/15 mb-6"
          style={{ animationDelay: '0.1s' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-white/80 text-[11px] font-bold uppercase tracking-[0.15em]">Workforce Competency Analyzer</span>
        </div>

        <h1
          className="animate-fade-up text-white text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.08] mb-5"
          style={{ animationDelay: '0.22s' }}
        >
          Every great team
          <br />
          starts with a<br />
          <span className="text-gold">clear mission.</span>
        </h1>

        <p className="animate-fade-up text-white/55 text-base md:text-lg leading-relaxed mb-8 max-w-md" style={{ animationDelay: '0.36s' }}>
          Your AI organisational design consultant guides you from mission to a complete
          workforce plan — one conversation at a time.
        </p>

        <div className="animate-fade-up flex items-center gap-3 flex-wrap mb-9" style={{ animationDelay: '0.5s' }}>
          <button
            onClick={onStart}
            className="group inline-flex items-center gap-2.5 bg-gold text-navy rounded-xl pl-6 pr-5 py-3.5 text-sm font-bold shadow-[0_8px_30px_rgba(245,158,11,0.35)] transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5"
          >
            Let's design your team
            <span className="w-6 h-6 rounded-full bg-navy/15 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
              <ArrowRightIcon width="14" height="14" />
            </span>
          </button>
          {onContinue && (
            <button
              onClick={onContinue}
              className="inline-flex items-center gap-2 bg-white/5 text-white border border-white/20 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 hover:bg-white/10 hover:border-white/30"
            >
              Continue where you left off
            </button>
          )}
        </div>

        {/* Slim journey row */}
        <div className="animate-fade-up flex items-center gap-x-5 gap-y-2 flex-wrap" style={{ animationDelay: '0.62s' }}>
          {JOURNEY.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/8 border border-white/20 text-white/55 text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-white/45 text-[11px] font-semibold whitespace-nowrap">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Journey rail (left sidebar progress) ────────────────────────────────────────
function JourneyRail({ stage, compact }) {
  return (
    <div className={`hidden lg:flex flex-col shrink-0 pt-2 ${compact ? 'w-[52px]' : 'w-[250px]'}`}>
      {JOURNEY.map((step, i) => {
        const num = i + 1;
        const state = num < stage ? 'done' : num === stage ? 'active' : 'todo';
        return (
          <div key={step.label} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-500 ${state === 'done' ? 'bg-green text-white' : state === 'active' ? 'bg-gold text-navy animate-glow' : 'bg-white/10 text-white/40'
                }`}>
                {state === 'done' ? <CheckIcon width="14" height="14" /> : num}
              </span>
              {i < JOURNEY.length - 1 && (
                <span className={`w-px flex-1 min-h-[28px] my-1 transition-colors duration-500 ${state === 'done' ? 'bg-green/60' : 'bg-white/12'}`} />
              )}
            </div>
            {!compact && (
              <div className="pb-6">
                <p className={`text-sm font-bold transition-colors duration-500 ${state === 'active' ? 'text-white' : state === 'done' ? 'text-white/70' : 'text-white/35'}`}>
                  {step.label}
                </p>
                <p className={`text-xs mt-0.5 ${state === 'active' ? 'text-white/55' : 'text-white/25'}`}>{step.hint}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Mission Draft Review card ────────────────────────────────────────────────────
function MissionReviewPhase({ missionDraft, onAccept, onRevise, onRegenerate, isRegenerating }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-3">
      {/* m-auto (not justify-center) so overflowing content never clips at the top */}
      <div className="w-full max-w-5xl mx-auto min-h-full flex flex-col justify-center">
        {/* Draft badge */}
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 rounded-full bg-gold/20 text-gold text-[11px] font-bold uppercase tracking-widest">Draft Mission</span>
          <span className="text-white/40 text-xs">Awaiting your approval</span>
        </div>

        {/* Mission card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl mb-4 animate-panel-in">
          <div className="bg-white/10 border border-white/15 backdrop-blur-sm px-6 py-4">
            <p className="text-[10px] font-bold text-gold/80 uppercase tracking-widest mb-2">Mission Statement</p>
            <p className="text-white text-sm md:text-base font-bold leading-relaxed">{missionDraft?.statement}</p>
          </div>

          {missionDraft?.objectives?.length > 0 && (
            <div className="bg-white/5 border-t border-white/10 px-6 py-4">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2.5">Objectives</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {missionDraft.objectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl bg-white/5 border border-white/10 px-3.5 py-3">
                    <span className="w-6 h-6 rounded-lg bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[11px] font-extrabold text-gold leading-none">{i + 1}</span>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-white leading-snug">{obj.title}</p>
                      {obj.metric && (
                        <p className="text-[11px] text-gold/70 font-semibold mt-0.5">{obj.metric}</p>
                      )}
                      {obj.detail && <p className="text-[11px] text-white/50 mt-1 leading-snug">{obj.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {missionDraft?.constraints?.length > 0 && (
            <div className="bg-white/5 border-t border-white/10 px-6 py-3.5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Constraints Addressed</p>
              <div className="flex flex-wrap gap-x-2 gap-y-1.5">
                {missionDraft.constraints.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold/60 shrink-0" />
                    <span className="text-[11px] text-white/60 leading-snug">{c}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onAccept}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gold text-navy rounded-xl px-6 py-2.5 text-sm font-bold shadow-[0_8px_24px_rgba(245,158,11,0.35)] transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5"
          >
            <CheckIcon width="15" height="15" />
            Accept Mission
          </button>
          <button
            onClick={onRevise}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-white/15"
          >
            Revise
          </button>
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-white/5 text-white/60 border border-white/10 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-white/10 hover:text-white/80 disabled:opacity-40"
          >
            {isRegenerating ? 'Regenerating…' : 'Regenerate'}
          </button>
        </div>

        <p className="text-white/30 text-xs text-center mt-3">
          You can revise or regenerate until this feels right — nothing is locked until you accept.
        </p>
      </div>
    </div>
  );
}

// ── Org generation loading state ─────────────────────────────────────────────────
function OrgGenerationPhase() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mb-6 animate-pulse">
        <SparkleIcon width="24" height="24" className="text-gold" />
      </div>
      <p className="text-white text-lg font-bold mb-2">Designing your organisation…</p>
      <p className="text-white/50 text-sm max-w-sm">
        I'm building a structure tailored to your mission and constraints. This takes a moment.
      </p>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────────
export default function OnboardingScreen({
  workflowData,
  onOrgProposed,
  onMissionDraftUpdated,
  onChatHistoryUpdated,
  onFlowStarted,
  onRestart,
  reviewMode,
  onJumpToStage,
  theme,
  onToggleTheme,
  resumeStage,
  onResume,
  onDashboard,
  initialPhase,
  initialStage,
}) {
  // Internal phases: welcome → chat → mission-review → org-generation
  // Normally always lands on the welcome page — the user chooses to start fresh
  // or continue. Entering via "Review Workflow" from the dashboard passes
  // initialPhase='chat' to skip straight into the mission conversation instead.
  const [phase, setPhase] = useState(initialPhase || 'welcome');
  const [stage, setStage] = useState(initialStage || 1);
  const [missionDraft, setMissionDraft] = useState(workflowData.missionDraft || null);
  const [orgPanel, setOrgPanel] = useState(null);
  const [error, setError] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  // Agent bubble appended when returning to chat from mission review (Revise)
  const [chatGreeting, setChatGreeting] = useState(null);

  const sessionIdRef = useRef(workflowData.sessionId || crypto.randomUUID());
  const pendingOrgRef = useRef(null); // pre-generated org result, ready before user clicks Accept
  const showOrgPanel = orgPanel !== null;

  // Live phase for async callbacks — stream handlers close over an old render,
  // so reading `phase` inside them can be stale
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // The chat and the org pre-generation share one server-side session. Firing
  // the pre-generation while the chat stream is still writing to that session
  // interleaves messages mid tool-call sequence — the provider rejects it and
  // the user sees a red "Something went wrong" banner right as the mission
  // hands over to the org chart. So: never two streams on the session at once.
  const chatStreamActiveRef = useRef(false);
  const preGenQueuedRef = useRef(false);
  const acceptResolveRef = useRef(null); // set when Accept is clicked before the pre-gen run exists

  function requestOrgPreGeneration() {
    if (chatStreamActiveRef.current) {
      preGenQueuedRef.current = true;
      return;
    }
    startOrgPreGeneration(workflowData.chatHistory);
  }

  // When the user reaches mission review without an org draft, kick off pre-generation
  const preGenStartedRef = useRef(false);
  if (
    !preGenStartedRef.current &&
    phase === 'mission-review' &&
    workflowData.missionDraft &&
    !workflowData.orgDraft?.length
  ) {
    preGenStartedRef.current = true;
    // Use setTimeout to avoid calling apiStream during render
    setTimeout(requestOrgPreGeneration, 0);
  }

  // ── Clean-slate reset — fresh workflow data, fresh chat session id, no
  // leftover mission draft. The AI must never see a previous conversation.
  function resetJourney(nextPhase) {
    onRestart?.();
    sessionIdRef.current = crypto.randomUUID();
    pendingOrgRef.current = null;
    preGenStartedRef.current = false;
    setMissionDraft(null);
    setOrgPanel(null);
    setChatGreeting(null);
    setError(null);
    setStage(1);
    setPhase(nextPhase);
    preGenQueuedRef.current = false;
    acceptResolveRef.current = null;
  }

  // ── Send to AI ────────────────────────────────────────────────────────────────
  function handleAISend(text, onToken, onEvent, onDone) {
    setError(null);
    chatStreamActiveRef.current = true;
    // The stream is fully closed here — safe to hand the session over to the
    // org pre-generation if propose_mission queued one mid-stream.
    const finish = () => {
      chatStreamActiveRef.current = false;
      onDone();
      if (preGenQueuedRef.current) {
        preGenQueuedRef.current = false;
        startOrgPreGeneration(workflowData.chatHistory);
      }
    };
    apiStream(
      '/api/chat/stream',
      {
        sessionId: sessionIdRef.current,
        message: text,
        screen: 'onboarding',
        workflowStage: 'onboarding',
        history: workflowData.chatHistory || [],
        // The exact draft the user is looking at — lets the AI apply revisions
        // to the real current version instead of whatever it remembers.
        contextData: (missionDraft || workflowData.missionDraft)
          ? { missionDraft: missionDraft || workflowData.missionDraft }
          : undefined,
      },
      (chunk) => {
        if (chunk.type === 'token') {
          onToken(chunk.text);
        } else if (chunk.type === 'tool') {
          // onEvent forwards to onMilestone (handleMilestone) via ChatBuilder — don't call directly
          onEvent(chunk);
        } else if (chunk.type === 'error') {
          setError(chunk.message);
        }
      },
      finish,
      () => setError('Connection error — please check the server is running and try again.'),
    );
  }

  // ── Handle AI tool calls ──────────────────────────────────────────────────────
  function handleMilestone(event) {
    const { name, data } = event;

    if (name === 'advance_stage' && data?.stage) {
      setStage(data.stage);
    }

    if (name === 'propose_mission' && data) {
      setMissionDraft(data);
      onMissionDraftUpdated(data);
      setStage((s) => Math.max(s, 3));
      // Only the live chat conversation may navigate to mission review. A
      // propose_mission emitted by any other stream (org pre-generation,
      // accept-mission fallback, a polluted __init__) must not yank the user
      // back to the Mission page.
      if (phaseRef.current === 'chat') {
        // A new/revised draft invalidates any org pre-generated from the old
        // mission — clear it so Accept never uses a stale org chart.
        pendingOrgRef.current = null;
        // Transition to mission-review after a short delay
        setTimeout(() => {
          if (phaseRef.current === 'chat') setPhase('mission-review');
        }, 600);
        // Start generating the org chart in the background while user reads the
        // mission so it's ready when they click Accept — but only once this
        // chat stream has released the session (see requestOrgPreGeneration).
        preGenStartedRef.current = true;
        setTimeout(requestOrgPreGeneration, 800);
      }
    }

    if (name === 'propose_org' && data?.roles) {
      const flatRoles = flattenOrgRoles(data.roles);
      setOrgPanel({ roles: flatRoles, animKey: Date.now() });
      setStage((s) => Math.max(s, 4));
    }

    if (name === 'complete_onboarding' && data) {
      // The org is ready — transition to org-review
      setTimeout(() => {
        const finalMission = transformMission(missionDraft || data.mission);
        const flatOrg = orgPanel?.roles || flattenOrgRoles(data.targetOrg?.roles || []);
        onOrgProposed({ mission: finalMission, orgDraft: flatOrg });
      }, 800);
    }
  }

  // ── Pre-generate org in background while user reads the mission ──────────────
  function startOrgPreGeneration(chatHistory) {
    // Single-flight: never run two pre-generations at once
    if (pendingOrgRef.current && !pendingOrgRef.current.failed) return;
    preGenStartedRef.current = true;
    // If Accept was clicked while this run was still queued behind the chat
    // stream, the waiting screen is already up — hand it this run's result.
    pendingOrgRef.current = { roles: null, waitingResolve: acceptResolveRef.current, failed: false };
    apiStream(
      '/api/chat/stream',
      {
        sessionId: sessionIdRef.current,
        message: 'The mission has been accepted. Please now generate the target organisation chart using propose_org.',
        intent: 'generate-org',
        screen: 'onboarding',
        workflowStage: 'onboarding',
        contextData: { missionDraft: missionDraft || workflowData.missionDraft || null },
        history: chatHistory || workflowData.chatHistory || [],
      },
      (chunk) => {
        if (chunk.type !== 'tool') return;
        let roles = null;
        if (chunk.name === 'propose_org' && chunk.data?.roles) {
          roles = flattenOrgRoles(chunk.data.roles);
        } else if (chunk.name === 'complete_onboarding' && chunk.data?.targetOrg?.roles) {
          roles = flattenOrgRoles(chunk.data.targetOrg.roles);
        }
        if (roles?.length > 0) {
          pendingOrgRef.current.roles = roles;
          // If the user already clicked Accept and is waiting, resolve immediately
          if (pendingOrgRef.current.waitingResolve) {
            pendingOrgRef.current.waitingResolve(roles);
          }
        }
      },
      () => { },
      () => { pendingOrgRef.current.failed = true; },
    );
  }

  // ── Mission review actions ────────────────────────────────────────────────────
  function handleAcceptMission() {
    const finalMission = transformMission(missionDraft || workflowData.missionDraft);

    // Case 1: persisted from a previous completed run
    if (workflowData.orgDraft?.length > 0) {
      onOrgProposed({ mission: finalMission, orgDraft: workflowData.orgDraft });
      return;
    }

    // Case 2: pre-generation already finished — instant transition
    if (pendingOrgRef.current?.roles?.length > 0) {
      onOrgProposed({ mission: finalMission, orgDraft: pendingOrgRef.current.roles });
      return;
    }

    // Case 3: pre-gen is still in flight — show loading screen and resolve as soon as it arrives
    setPhase('org-generation');
    setStage(4);

    // Case 3a: pre-gen is queued behind a chat stream that hasn't closed yet.
    // Park the resolver so the run picks it up the moment it starts.
    if (!pendingOrgRef.current && (chatStreamActiveRef.current || preGenQueuedRef.current)) {
      const timeoutId = setTimeout(() => {
        if (!pendingOrgRef.current?.roles) {
          setError('Generating the org chart is taking longer than expected. Please try again.');
          setPhase('mission-review');
        }
      }, 60000);
      acceptResolveRef.current = (roles) => {
        clearTimeout(timeoutId);
        acceptResolveRef.current = null;
        onOrgProposed({ mission: finalMission, orgDraft: roles });
      };
      return;
    }

    if (pendingOrgRef.current && !pendingOrgRef.current.failed) {
      const timeoutId = setTimeout(() => {
        if (!pendingOrgRef.current?.roles) {
          setError('Generating the org chart is taking longer than expected. Please try again.');
          setPhase('mission-review');
        }
      }, 60000);
      pendingOrgRef.current.waitingResolve = (roles) => {
        clearTimeout(timeoutId);
        onOrgProposed({ mission: finalMission, orgDraft: roles });
      };
      return;
    }

    // Case 4: pre-gen wasn't started or failed — direct API call fallback
    let orgReceived = false;
    const timeoutId = setTimeout(() => {
      if (!orgReceived) {
        setError('Generating the org chart is taking longer than expected. Please try again.');
        setPhase('mission-review');
      }
    }, 60000);

    apiStream(
      '/api/chat/stream',
      {
        sessionId: sessionIdRef.current,
        message: 'The mission has been accepted. Please now generate the target organisation chart using propose_org.',
        intent: 'generate-org',
        screen: 'onboarding',
        workflowStage: 'onboarding',
        contextData: { missionDraft: missionDraft || workflowData.missionDraft || null },
        history: workflowData.chatHistory || [],
      },
      (chunk) => {
        if (chunk.type === 'tool') {
          if (chunk.name === 'propose_org' || chunk.name === 'complete_onboarding') {
            orgReceived = true;
            clearTimeout(timeoutId);
          }
          handleMilestone(chunk);
        } else if (chunk.type === 'error') {
          clearTimeout(timeoutId);
          setError(chunk.message);
          setPhase('mission-review');
        }
      },
      () => { clearTimeout(timeoutId); },
      () => {
        clearTimeout(timeoutId);
        setError('Could not generate organisation chart. Please try again.');
        setPhase('mission-review');
      },
    );
  }

  function handleReviseMission() {
    // Continue the same conversation — just prompt for the change
    setChatGreeting("Of course — tell me what you'd like to change about the mission draft and I'll revise it.");
    setPhase('chat');
    setStage(3);
  }

  function handleRegenerateMission() {
    setIsRegenerating(true);
    apiStream(
      '/api/chat/stream',
      {
        sessionId: sessionIdRef.current,
        message: 'Please regenerate the mission statement with a fresh approach, using the same information we discussed.',
        screen: 'onboarding',
        workflowStage: 'onboarding',
        history: workflowData.chatHistory || [],
      },
      (chunk) => {
        if (chunk.type === 'tool' && chunk.name === 'propose_mission') {
          setMissionDraft(chunk.data);
          onMissionDraftUpdated(chunk.data);
        } else if (chunk.type === 'error') {
          setError(chunk.message);
        }
      },
      () => setIsRegenerating(false),
      () => {
        setError('Could not regenerate. Please try again.');
        setIsRegenerating(false);
      },
    );
  }

  // ── Welcome page: resume vs start fresh ───────────────────────────────────────
  const hasProgress = !!(
    resumeStage ||
    workflowData.missionDraft ||
    workflowData.chatHistory?.length > 0 ||
    workflowData.missionFlowStarted
  );

  function handleContinue() {
    if (resumeStage) {
      // The journey had moved past onboarding — jump back to that stage
      onResume?.();
      return;
    }
    if (workflowData.missionDraft) {
      setStage(3);
      setPhase('mission-review');
      return;
    }
    setPhase('chat');
  }

  // ── Header ────────────────────────────────────────────────────────────────────
  const header = (
    <div className="flex items-center justify-between px-8 pt-6 pb-3 shrink-0">
      <span className="text-white text-xl font-extrabold tracking-tight">Workforce Competency Analyzer</span>
      <div className="flex items-center gap-4">
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
          >
            {theme === 'dark' ? <SunIcon width="16" height="16" /> : <MoonIcon width="16" height="16" />}
          </button>
        )}
        {(phase === 'chat' || phase === 'mission-review') && (
          <button
            onClick={() => resetJourney('welcome')}
            className="text-white/30 hover:text-white/60 text-xs font-semibold transition-colors"
          >
            Restart
          </button>
        )}

      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 aurora-shell flex flex-col overflow-hidden">
      {/* Progress bar at very top */}
      <WorkflowProgressBar currentStage="onboarding" dark reviewMode={reviewMode} onNavigate={onJumpToStage} onDashboard={onDashboard} />

      {header}

      {error && (
        <div className="mx-8 mb-2 px-4 py-2.5 rounded-xl bg-red/20 border border-red/40 text-red text-xs font-semibold flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 hover:opacity-70">✕</button>
        </div>
      )}

      {phase === 'welcome' && (
        <WelcomePhase
          onStart={() => {
            resetJourney('chat');
            onFlowStarted?.();
          }}
          onContinue={hasProgress ? handleContinue : null}
        />
      )}

      {phase === 'mission-review' && (
        <MissionReviewPhase
          missionDraft={missionDraft}
          onAccept={handleAcceptMission}
          onRevise={handleReviseMission}
          onRegenerate={handleRegenerateMission}
          isRegenerating={isRegenerating}
        />
      )}

      {phase === 'org-generation' && <OrgGenerationPhase />}

      {phase === 'chat' && (
        <div className="flex-1 min-h-0 flex items-stretch gap-4 px-4 pb-4 pt-2">
          <JourneyRail stage={stage} compact={showOrgPanel} />

          <div
            className="shrink-0 bg-white rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden transition-all duration-500"
            style={{
              width: showOrgPanel ? '320px' : undefined,
              flex: showOrgPanel ? undefined : '1 1 0',
            }}
          >
            <div className="flex items-center gap-3 px-6 py-4 border-b border-lightgrey/70 shrink-0">
              <span className="w-9 h-9 rounded-xl bg-maroon/10 text-maroon flex items-center justify-center">
                <SparkleIcon width="18" height="18" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-charcoal leading-tight truncate">AI Design Consultant</p>
                <p className="text-[11px] text-charcoal/45 truncate">
                  {showOrgPanel ? 'Review the chart — accept or request changes' : 'Designing your mission and organisation'}
                </p>
              </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col p-6">
              <ChatBuilder
                onSend={handleAISend}
                onMilestone={handleMilestone}
                onMessagesChange={onChatHistoryUpdated}
                initialMessages={workflowData.chatHistory}
                resumeGreeting={chatGreeting}
              />
            </div>
          </div>

          {showOrgPanel && (
            <OrgChartReveal roles={orgPanel.roles} animKey={orgPanel.animKey} />
          )}
        </div>
      )}
    </div>
  );
}
