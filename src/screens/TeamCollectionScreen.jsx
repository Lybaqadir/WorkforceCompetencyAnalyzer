import { useEffect, useRef, useState } from 'react';
import ChatBuilder from '../components/ChatBuilder';
import { MoonIcon, SparkleIcon, SunIcon } from '../components/icons';
import { apiStream } from '../lib/api';
import WorkflowProgressBar from '../components/WorkflowProgressBar';
import { Avatar } from '../components/ui';

function MemberCard({ member, index }) {
  const skillsToShow = (member.skills || member.technicalSkills || []).slice(0, 4);
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 animate-panel-in">
      <Avatar name={member.name} size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white leading-snug truncate">{member.name}</p>
        <p className="text-xs text-white/55 truncate">{member.currentRole}</p>
        {skillsToShow.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {skillsToShow.map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] font-semibold">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="w-6 h-6 rounded-full bg-green/20 text-green text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
        ✓
      </span>
    </div>
  );
}

export default function TeamCollectionScreen({
  workflowData,
  onComplete,
  onTeamMembersUpdated,
  onBack,
  onChatHistoryUpdated,
  reviewMode,
  onJumpToStage,
  theme,
  onToggleTheme,
  onDashboard,
}) {
  const [teamMembers, setTeamMembers] = useState(workflowData.teamMembers || []);
  const [error, setError] = useState(null);
  const sessionIdRef = useRef(workflowData.sessionId || crypto.randomUUID());

  // Every later stage reads the roster off workflowData, so push each change up
  // as it happens. Waiting until "Done" meant leaving via Back, a stage jump, or
  // a reload discarded everyone the user had just added.
  useEffect(() => {
    onTeamMembersUpdated?.(teamMembers);
  }, [teamMembers]);

  // Tool events fire mid-render-cycle, so the handler's `teamMembers` closure is
  // already stale by the time finish_team_collection arrives — it would hand on
  // the roster minus whoever was added last.
  const membersRef = useRef(teamMembers);
  membersRef.current = teamMembers;

  const contextData = {
    mission: workflowData.mission,
    targetOrg: workflowData.targetOrg,
    teamMembers,
  };

  function handleAISend(text, onToken, onEvent, onDone) {
    setError(null);
    apiStream(
      '/api/chat/stream',
      {
        sessionId: sessionIdRef.current + '-team',
        message: text,
        workflowStage: 'team-collection',
        contextData,
        history: workflowData.teamChatHistory || [],
      },
      (chunk) => {
        if (chunk.type === 'token') {
          onToken(chunk.text);
        } else if (chunk.type === 'tool') {
          handleTool(chunk);
          onEvent(chunk);
        } else if (chunk.type === 'error') {
          setError(chunk.message);
        }
      },
      onDone,
      () => {
        setError('Connection error — please check the server is running.');
        onDone();
      },
    );
  }

  function handleTool(event) {
    const { name, data } = event;

    if (name === 'add_team_member' && data) {
      const newMember = {
        id: data.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        ...data,
      };
      setTeamMembers((prev) => {
        const exists = prev.some((m) => m.name.toLowerCase() === data.name.toLowerCase());
        return exists ? prev : [...prev, newMember];
      });
    }

    if (name === 'finish_team_collection') {
      setTimeout(() => {
        onComplete(membersRef.current);
      }, 800);
    }
  }

  function handleFileUploaded(uploadResult) {
    if (uploadResult?.person) {
      const p = uploadResult.person;
      const newMember = {
        id: (p.name || 'member').toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        name: p.name || 'Unknown',
        currentRole: p.currentRole || '',
        experience: p.experience || '',
        skills: p.skills || [],
        education: p.education || '',
        certifications: p.certifications || [],
        technicalSkills: p.technicalSkills || [],
        softSkills: p.softSkills || [],
      };
      setTeamMembers((prev) => {
        const exists = p.name && prev.some((m) => m.name.toLowerCase() === p.name.toLowerCase());
        return exists ? prev : [...prev, newMember];
      });
    }
  }

  function handleDoneManually() {
    onComplete(membersRef.current);
  }

  return (
    <div className="fixed inset-0 z-40 aurora-shell flex flex-col overflow-hidden">
      <WorkflowProgressBar currentStage="team-collection" dark reviewMode={reviewMode} onNavigate={onJumpToStage} onDashboard={onDashboard} />

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center">
            <SparkleIcon width="18" height="18" className="text-gold" />
          </span>
          <div>
            <p className="text-white text-sm font-bold">Add Your Current Team</p>
            <p className="text-white/40 text-xs">Tell me about your team members or upload their CVs</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button onClick={onToggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10">
              {theme === 'dark' ? <SunIcon width="16" height="16" /> : <MoonIcon width="16" height="16" />}
            </button>
          )}
          {onBack && (
            <button onClick={onBack} className="px-3.5 py-2 rounded-xl border border-white/20 text-white/60 text-sm font-semibold hover:border-white/40 hover:text-white/80 transition-colors">
              ← Back
            </button>
          )}
          {teamMembers.length > 0 ? (
            <button
              onClick={handleDoneManually}
              className="inline-flex items-center gap-2 bg-gold text-navy rounded-xl px-4 py-2.5 text-sm font-bold shadow-[0_4px_16px_rgba(245,158,11,0.3)] hover:brightness-110 transition-all"
            >
              Done — Continue to Mapping ({teamMembers.length}) →
            </button>
          ) : (
            <button
              onClick={handleDoneManually}
              title="No existing team members yet? Skip this step — you can hire or add people later."
              className="px-3.5 py-2 rounded-xl border border-white/20 text-white/60 text-sm font-semibold hover:border-white/40 hover:text-white/80 transition-colors"
            >
              Skip — no existing team →
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-8 mt-3 px-4 py-2.5 rounded-xl bg-red/20 border border-red/40 text-red text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:opacity-70">✕</button>
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 min-h-0 flex gap-0">
        {/* Chat panel */}
        <div className="flex-1 min-h-0 flex flex-col p-6">
          <div className="flex-1 min-h-0 bg-white rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-lightgrey/70 shrink-0">
              <p className="text-sm font-bold text-charcoal">AI Team Consultant</p>
              <p className="text-xs text-charcoal/45">Upload CVs or describe each team member — I'll extract everything</p>
            </div>
            <div className="flex-1 min-h-0 flex flex-col p-6">
              <ChatBuilder
                onSend={handleAISend}
                onFileUploaded={handleFileUploaded}
                onMilestone={handleTool}
                onMessagesChange={onChatHistoryUpdated}
                initialMessage="Great — your organisation is set. Now let's add the people currently in your team. You can tell me about them one by one, or upload their CVs and I'll extract everything automatically. Who would you like to start with?"
              />
            </div>
          </div>
        </div>

        {/* Team members sidebar */}
        <div className="w-[300px] shrink-0 flex flex-col p-4 pl-0 gap-3 overflow-hidden">
          <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/10 shrink-0">
              <p className="text-white text-sm font-bold">
                Team Members
                {teamMembers.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-bold">
                    {teamMembers.length}
                  </span>
                )}
              </p>
              <p className="text-white/40 text-xs mt-0.5">Added so far</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {teamMembers.length === 0 ? (
                <p className="text-white/25 text-xs text-center mt-6 px-2">
                  Team members will appear here as they're added.
                </p>
              ) : (
                teamMembers.map((m, i) => <MemberCard key={m.id || i} member={m} index={i} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
