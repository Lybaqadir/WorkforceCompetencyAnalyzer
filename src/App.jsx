import { useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { membersToRolesFromWorkflow, syncRolesWithWorkflow } from './lib/roles';
import HomeScreen from './screens/HomeScreen';
import AnalyseScreen from './screens/AnalyseScreen';
import TeamScreen from './screens/TeamScreen';
import FutureSkillsScreen from './screens/FutureSkillsScreen';
import WhatIfScreen from './screens/WhatIfScreen';
import JobDescriptionsScreen from './screens/JobDescriptionsScreen';
import MissionScreen from './screens/MissionScreen';
import TeamFitScreen from './screens/TeamFitScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import OrgReviewScreen from './screens/OrgReviewScreen';
import TeamCollectionScreen from './screens/TeamCollectionScreen';
import TeamMappingScreen from './screens/TeamMappingScreen';
import SkillsAnalysisScreen from './screens/SkillsAnalysisScreen';
import GapAnalysisScreen from './screens/GapAnalysisScreen';
import RecommendationsScreen from './screens/RecommendationsScreen';
import FuturePlanningScreen from './screens/FuturePlanningScreen';

const WORKFLOW_KEY = 'teamlens.workflow';
const THEME_KEY = 'teamlens.theme';

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(WORKFLOW_KEY)) || null;
  } catch {
    return null;
  }
}

function makeInitialWorkflowData() {
  return {
    sessionId: crypto.randomUUID(),
    chatHistory: [],
    teamChatHistory: [],
    missionFlowStarted: false,
    missionDraft: null,
    mission: null,
    orgDraft: null,
    targetOrg: null,
    teamMembers: [],
    teamMapping: null,
    skillsAnalysis: null,
    gapAnalysis: null,
    recommendations: null,
    futurePlanning: null,
    teamFitAssignments: null,
  };
}

export default function App() {
  const saved = loadSaved();

  // On a fresh page load: a completed journey goes straight to the dashboard;
  // anything mid-flight lands on the intro page with a "continue" option.
  const savedStage = saved?.workflowStage ?? 'onboarding';
  const [workflowStage, setWorkflowStageRaw] = useState(savedStage === 'complete' ? 'complete' : 'onboarding');
  // The saved workflowStage IS the exact place the user last stopped — prefer it
  // over any previously-persisted resumeStage so Continue always lands there.
  const [resumeStage, setResumeStage] = useState(
    savedStage !== 'complete' && savedStage !== 'onboarding' ? savedStage : (saved?.resumeStage ?? null)
  );
  const [workflowData, setWorkflowDataRaw] = useState(saved?.workflowData ?? makeInitialWorkflowData());
  const [dashboardScreen, setDashboardScreenRaw] = useState(saved?.dashboardScreen ?? 'home');
  const [analyseRoleId, setAnalyseRoleId] = useState(null);
  const [jdRoleId, setJdRoleId] = useState(null);
  const [teamRoles, setTeamRolesRaw] = useState(() => {
    if (saved?.teamRoles?.length > 0) return saved.teamRoles;
    if (saved?.workflowStage === 'complete' && saved?.workflowData?.teamMembers?.length > 0) {
      return membersToRolesFromWorkflow(saved.workflowData);
    }
    return [];
  });
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) ?? 'light');
  // workflowReturnState: set when user navigates to JDs mid-workflow so we can return them
  const [workflowReturnState, setWorkflowReturnState] = useState(saved?.workflowReturnState ?? null);
  // hiringRoles: pre-populated roles from recommendations to pass into JD screen
  const [jdPreloadRoles, setJdPreloadRoles] = useState(saved?.jdPreloadRoles ?? null);
  // review mode: true when user re-enters the workflow from the dashboard
  const [isReviewing, setIsReviewing] = useState(false);

  // Central persist ref — tracks ALL state that needs to survive a reload
  const persistRef = useRef({ workflowStage, workflowData, teamRoles, dashboardScreen, workflowReturnState, jdPreloadRoles });
  persistRef.current = { workflowStage, workflowData, teamRoles, dashboardScreen, workflowReturnState, jdPreloadRoles };

  // Guards server saves until we've checked the server for newer state on startup
  const hydratedRef = useRef(false);
  // Once the user acts (restart, stage change), a late-resolving hydration fetch
  // must NOT overwrite their fresh state with old server state
  const interactedRef = useRef(false);

  // On startup: ask the backend for the last saved state. localStorage is
  // per-port (5173 vs 5174 are different buckets), so the backend file is the
  // source of truth — adopt it whenever it's newer than what this port has.
  useEffect(() => {
    fetch('/api/state')
      .then((r) => r.json())
      .then(({ state }) => {
        const localSavedAt = loadSaved()?.savedAt ?? 0;
        if (!interactedRef.current && state && (state.savedAt ?? 0) > localSavedAt) {
          const s = state.workflowStage ?? 'onboarding';
          setWorkflowStageRaw(s === 'complete' ? 'complete' : 'onboarding');
          setResumeStage(s !== 'complete' && s !== 'onboarding' ? s : (state.resumeStage ?? null));
          setWorkflowDataRaw(state.workflowData ?? makeInitialWorkflowData());
          setTeamRolesRaw(state.teamRoles ?? []);
          setDashboardScreenRaw(state.dashboardScreen ?? 'home');
          setWorkflowReturnState(state.workflowReturnState ?? null);
          setJdPreloadRoles(state.jdPreloadRoles ?? null);
        }
      })
      .catch(() => { })
      .finally(() => { hydratedRef.current = true; });
  }, []);

  // Persist everything on every change — localStorage immediately, backend debounced
  useEffect(() => {
    const payload = {
      workflowStage,
      resumeStage,
      workflowData,
      teamRoles,
      dashboardScreen,
      workflowReturnState,
      jdPreloadRoles,
      savedAt: Date.now(),
    };
    localStorage.setItem(WORKFLOW_KEY, JSON.stringify(payload));
    if (!hydratedRef.current) return;
    const t = setTimeout(() => {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => { });
    }, 400);
    return () => clearTimeout(t);
  }, [workflowStage, resumeStage, workflowData, teamRoles, dashboardScreen, workflowReturnState, jdPreloadRoles]);

  // The dashboard's role cards are a view of the uploaded roster, so re-derive
  // them whenever the roster or an analysis result changes. Seeding them once at
  // the end of the workflow left the dashboard stale whenever the user went back
  // and re-ran a stage, or edited the team afterwards.
  useEffect(() => {
    if (workflowStage !== 'complete') return;
    setTeamRolesRaw((prev) => {
      const next = syncRolesWithWorkflow(prev, workflowData);
      // Bail out on no-op so this effect can't loop on a fresh array identity
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });
  }, [
    workflowStage,
    workflowData.teamMembers,
    workflowData.teamMapping,
    workflowData.skillsAnalysis,
  ]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }

  // ── Wrapped setters that go through persistRef ────────────────────────────────

  const isMidFlowStage = (s) => s !== 'onboarding' && s !== 'complete';

  function setWorkflowStage(stage) {
    interactedRef.current = true;
    // Keep the resume point in sync with wherever the user actually is, so a
    // reload + "Continue where you left off" returns to this exact stage.
    setResumeStage(isMidFlowStage(stage) ? stage : null);
    setWorkflowStageRaw(stage);
  }

  function setWorkflowData(updater) {
    interactedRef.current = true;
    setWorkflowDataRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
  }

  function patchWorkflowData(patch) {
    setWorkflowData((prev) => ({ ...prev, ...patch }));
  }

  function setDashboardScreen(screen) {
    setDashboardScreenRaw(screen);
  }

  function setTeamRoles(updater) {
    setTeamRolesRaw(updater);
  }

  // ── Workflow transition handlers ──────────────────────────────────────────────

  function handleOrgProposed({ mission, orgDraft }) {
    patchWorkflowData({ mission, orgDraft });
    setWorkflowStage('org-review');
  }

  function handleOrgApproved(targetOrg) {
    patchWorkflowData({ targetOrg });
    setWorkflowStage('team-collection');
  }

  // Called on every roster change during collection, so leaving the screen by
  // any route — Back, a stage jump, the dashboard link, a reload — keeps the
  // people already added.
  function handleTeamMembersUpdated(teamMembers) {
    setWorkflowData((prev) =>
      JSON.stringify(prev.teamMembers) === JSON.stringify(teamMembers)
        ? prev
        : { ...prev, teamMembers }
    );
  }

  // A roster identity that ignores incidental field ordering — used to tell a
  // real edit from a no-op pass back through Team Collection.
  const rosterFingerprint = (members) =>
    JSON.stringify(
      (members || [])
        .map((m) => ({
          name: m.name,
          currentRole: m.currentRole,
          skills: [...(m.skills || []), ...(m.technicalSkills || []), ...(m.softSkills || [])].sort(),
        }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    );

  function handleTeamCollectionComplete(teamMembers) {
    setWorkflowDataRaw((prev) => {
      const next = { ...prev, teamMembers };
      // Every stage after this one analyses this roster. If the user changed it,
      // the cached results describe a team that no longer exists — the stage
      // screens reuse a stored result and would never re-run. Clear them so each
      // stage regenerates against the roster the user actually has now.
      if (rosterFingerprint(prev.teamMembers) !== rosterFingerprint(teamMembers)) {
        Object.assign(next, {
          teamMapping: null,
          skillsAnalysis: null,
          gapAnalysis: null,
          recommendations: null,
          futurePlanning: null,
          teamFitAssignments: null,
        });
      }
      return next;
    });
    interactedRef.current = true;
    setWorkflowStage('team-mapping');
  }

  function handleStageResult(stage, result) {
    const nextStageMap = {
      'team-mapping': 'skills-analysis',
      'skills-analysis': 'gap-analysis',
      'gap-analysis': 'recommendations',
      'recommendations': 'future-planning',
      'future-planning': 'complete',
    };

    const dataKeyMap = {
      'team-mapping': 'teamMapping',
      'skills-analysis': 'skillsAnalysis',
      'gap-analysis': 'gapAnalysis',
      'recommendations': 'recommendations',
      'future-planning': 'futurePlanning',
    };

    const next = nextStageMap[stage];

    // When workflow completes, seed teamRoles from teamMembers
    if (next === 'complete') {
      setWorkflowDataRaw((prev) => {
        const updated = { ...prev, [dataKeyMap[stage]]: result };
        // Seed dashboard roles from the FULL workflow results — instant, no refresh
        if ((updated.teamMembers || []).length > 0) {
          setTeamRolesRaw(membersToRolesFromWorkflow(updated));
        }
        return updated;
      });
      setIsReviewing(false);
      setWorkflowStage('complete');
      setDashboardScreen('home');
      return;
    }

    patchWorkflowData({ [dataKeyMap[stage]]: result });
    if (next) setWorkflowStage(next);
  }

  function handleRestart() {
    interactedRef.current = true;
    localStorage.removeItem(WORKFLOW_KEY);
    fetch('/api/state', { method: 'DELETE' }).catch(() => { });
    setResumeStage(null);
    setWorkflowStageRaw('onboarding');
    setWorkflowDataRaw(makeInitialWorkflowData());
    setTeamRolesRaw([]);
    setDashboardScreenRaw('home');
    setWorkflowReturnState(null);
    setJdPreloadRoles(null);
  }

  // ── Team fit assignments ──────────────────────────────────────────────────────

  function handleApplyTeamFit(assignments) {
    patchWorkflowData({ teamFitAssignments: assignments });
  }

  // ── JD from recommendations flow ─────────────────────────────────────────────

  function handleRequestJDFromRecommendations(hiringRoles, recResult) {
    // Save the recommendations result so it's not lost
    if (recResult) patchWorkflowData({ recommendations: recResult });
    setJdPreloadRoles(hiringRoles);
    // Remember we came from the recommendations workflow stage
    setWorkflowReturnState({ fromStage: 'recommendations' });
    // Seed teamRoles if not already done so the dashboard renders properly
    if (teamRoles.length === 0 && workflowData.teamMembers?.length > 0) {
      setTeamRolesRaw(membersToRolesFromWorkflow(workflowData));
    }
    // Temporarily advance to 'complete' so the sidebar + jobs screen renders
    setWorkflowStageRaw('complete');
    setDashboardScreenRaw('jobs');
  }

  function handleReturnFromJD() {
    const fromStage = workflowReturnState?.fromStage;
    const fromScreen = workflowReturnState?.fromScreen;
    setWorkflowReturnState(null);
    setJdPreloadRoles(null);
    if (fromStage) {
      // Return to the workflow stage the user left from
      setWorkflowStageRaw(fromStage);
    } else {
      setDashboardScreenRaw(fromScreen ?? 'home');
    }
  }

  // ── Dashboard role management ─────────────────────────────────────────────────

  function addRole(role) {
    setTeamRoles((prev) => {
      const exists = prev.some((r) => r.id === role.id);
      return exists ? prev.map((r) => (r.id === role.id ? role : r)) : [...prev, role];
    });
  }

  function removeRole(roleId) {
    setTeamRoles((prev) => prev.filter((r) => r.id !== roleId));
  }

  function goToAnalyse(roleId) {
    setAnalyseRoleId(roleId);
    setDashboardScreen('analyse');
  }

  function goToJD(roleId) {
    setJdRoleId(roleId ?? null);
    setDashboardScreen('jobs');
  }

  // ── Full-screen workflow stages (no sidebar) ──────────────────────────────────

  const jumpToStage = (stage) => {
    setResumeStage(isMidFlowStage(stage) ? stage : null);
    setWorkflowStageRaw(stage);
  };

  // Only relevant while reviewMode is on — returns to the dashboard without
  // losing the completed workflow data.
  function goToDashboard() {
    setIsReviewing(false);
    setWorkflowStageRaw('complete');
    setDashboardScreen('home');
  }

  if (workflowStage === 'onboarding') {
    return (
      <OnboardingScreen
        workflowData={workflowData}
        onOrgProposed={handleOrgProposed}
        onMissionDraftUpdated={(missionDraft) => patchWorkflowData({ missionDraft })}
        onChatHistoryUpdated={(chatHistory) => patchWorkflowData({ chatHistory })}
        onFlowStarted={() => patchWorkflowData({ missionFlowStarted: true })}
        onRestart={handleRestart}
        reviewMode={isReviewing}
        onJumpToStage={jumpToStage}
        theme={theme}
        onToggleTheme={toggleTheme}
        resumeStage={resumeStage}
        onResume={() => {
          const target = resumeStage;
          setResumeStage(null);
          if (target) setWorkflowStageRaw(target);
        }}
        onDashboard={goToDashboard}
        initialPhase={isReviewing ? 'chat' : 'welcome'}
        initialStage={isReviewing ? 5 : 1}
      />
    );
  }

  if (workflowStage === 'org-review') {
    return (
      <OrgReviewScreen
        orgDraft={workflowData.orgDraft}
        mission={workflowData.mission}
        onApprove={handleOrgApproved}
        onBack={() => setWorkflowStage('onboarding')}
        reviewMode={isReviewing}
        onJumpToStage={jumpToStage}
        theme={theme}
        onToggleTheme={toggleTheme}
        onDashboard={goToDashboard}
      />
    );
  }

  if (workflowStage === 'team-collection') {
    return (
      <TeamCollectionScreen
        workflowData={workflowData}
        onComplete={handleTeamCollectionComplete}
        onTeamMembersUpdated={handleTeamMembersUpdated}
        onBack={() => setWorkflowStage('org-review')}
        onChatHistoryUpdated={(teamChatHistory) => patchWorkflowData({ teamChatHistory })}
        reviewMode={isReviewing}
        onJumpToStage={jumpToStage}
        theme={theme}
        onToggleTheme={toggleTheme}
        onDashboard={goToDashboard}
      />
    );
  }

  if (workflowStage === 'team-mapping') {
    return (
      <TeamMappingScreen
        workflowData={workflowData}
        onComplete={(result) => handleStageResult('team-mapping', result)}
        onBack={() => setWorkflowStage('team-collection')}
        onRestart={handleRestart}
        reviewMode={isReviewing}
        onJumpToStage={jumpToStage}
        theme={theme}
        onToggleTheme={toggleTheme}
        onDashboard={goToDashboard}
      />
    );
  }

  if (workflowStage === 'skills-analysis') {
    return (
      <SkillsAnalysisScreen
        workflowData={workflowData}
        onComplete={(result) => handleStageResult('skills-analysis', result)}
        onBack={() => setWorkflowStage('team-mapping')}
        reviewMode={isReviewing}
        onJumpToStage={jumpToStage}
        theme={theme}
        onToggleTheme={toggleTheme}
        onDashboard={goToDashboard}
      />
    );
  }

  if (workflowStage === 'gap-analysis') {
    return (
      <GapAnalysisScreen
        workflowData={workflowData}
        onComplete={(result) => handleStageResult('gap-analysis', result)}
        onBack={() => setWorkflowStage('skills-analysis')}
        reviewMode={isReviewing}
        onJumpToStage={jumpToStage}
        theme={theme}
        onToggleTheme={toggleTheme}
        onDashboard={goToDashboard}
      />
    );
  }

  if (workflowStage === 'recommendations') {
    return (
      <RecommendationsScreen
        workflowData={workflowData}
        onComplete={(result) => handleStageResult('recommendations', result)}
        onBack={() => setWorkflowStage('gap-analysis')}
        onRequestJD={handleRequestJDFromRecommendations}
        reviewMode={isReviewing}
        onJumpToStage={jumpToStage}
        theme={theme}
        onToggleTheme={toggleTheme}
        onDashboard={goToDashboard}
      />
    );
  }

  if (workflowStage === 'future-planning') {
    return (
      <FuturePlanningScreen
        workflowData={workflowData}
        onComplete={(result) => handleStageResult('future-planning', result)}
        onBack={() => setWorkflowStage('recommendations')}
        reviewMode={isReviewing}
        onJumpToStage={jumpToStage}
        theme={theme}
        onToggleTheme={toggleTheme}
        onDashboard={goToDashboard}
      />
    );
  }

  // ── Complete: full dashboard with sidebar ─────────────────────────────────────

  const mission = workflowData.mission;
  const targetOrg = workflowData.targetOrg;

  const teamContext = {
    roles: teamRoles.map((r) => ({ title: r.name, aiPercent: r.aiPercent, verdict: r.verdict })),
    totalRoles: teamRoles.length,
  };

  function renderDashboardScreen() {
    switch (dashboardScreen) {
      case 'home':
        return (
          <HomeScreen
            onOpenRole={goToAnalyse}
            onNavigate={setDashboardScreen}
            onGoToJD={goToJD}
            teamRoles={teamRoles}
            onAddRole={addRole}
            onRemoveRole={removeRole}
            mission={mission}
            targetOrg={targetOrg}
            workflowData={workflowData}
            onStartSetup={handleRestart}
            onReviewWorkflow={workflowData.teamMapping ? () => { setIsReviewing(true); setWorkflowStageRaw('onboarding'); } : null}
            onOpenWorkflowStage={(stage) => { setIsReviewing(true); setWorkflowStageRaw(stage); }}
          />
        );
      case 'mission':
        return (
          <MissionScreen
            mission={mission}
            targetOrg={targetOrg}
            workflowData={workflowData}
            teamRoles={teamRoles}
            onRerun={handleRestart}
            onNavigate={setDashboardScreen}
          />
        );
      case 'teamfit':
        return (
          <TeamFitScreen
            targetOrg={targetOrg}
            teamRoles={teamRoles}
            workflowData={workflowData}
            onNavigate={setDashboardScreen}
            onGoToJD={goToJD}
            onApplyAssignments={handleApplyTeamFit}
            onOrgUpdated={(newOrg) => patchWorkflowData({ targetOrg: newOrg })}
          />
        );
      case 'analyse':
        return (
          <AnalyseScreen
            initialRoleId={analyseRoleId}
            onNavigate={setDashboardScreen}
            onGoToJD={goToJD}
            teamRoles={teamRoles}
          />
        );
      case 'team':
        return (
          <TeamScreen
            teamRoles={teamRoles}
            mission={mission}
            workflowData={workflowData}
            onNavigate={setDashboardScreen}
          />
        );
      case 'future':
        return <FutureSkillsScreen teamRoles={teamRoles} mission={mission} workflowData={workflowData} />;
      case 'whatif':
        return <WhatIfScreen teamRoles={teamRoles} mission={mission} teamContext={teamContext} />;
      case 'jobs':
        return (
          <JobDescriptionsScreen
            teamRoles={teamRoles}
            targetOrg={targetOrg}
            mission={mission}
            workflowData={workflowData}
            initialRoleId={jdRoleId}
            preloadRoles={jdPreloadRoles}
            returnToWorkflow={!!workflowReturnState}
            onReturnToWorkflow={handleReturnFromJD}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-offwhite">
      <Sidebar
        active={dashboardScreen}
        onNavigate={setDashboardScreen}
        disabledIds={targetOrg ? [] : ['teamfit']}
        workflowData={workflowData}
      />
      <div className="ml-[256px] min-h-screen flex flex-col">
        <TopBar
          screen={dashboardScreen}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="flex-1 px-8 py-8">{renderDashboardScreen()}</main>
      </div>
    </div>
  );
}
