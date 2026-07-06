import { useState } from 'react';
import Sidebar from './components/Sidebar';
import { TopTag } from './components/ui';
import HomeScreen from './screens/HomeScreen';
import AnalyseScreen from './screens/AnalyseScreen';
import TeamScreen from './screens/TeamScreen';
import FutureSkillsScreen from './screens/FutureSkillsScreen';
import WhatIfScreen from './screens/WhatIfScreen';
import JobDescriptionsScreen from './screens/JobDescriptionsScreen';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [analyseRoleId, setAnalyseRoleId] = useState('dia');

  function goToAnalyse(roleId) {
    setAnalyseRoleId(roleId);
    setScreen('analyse');
  }

  function renderScreen() {
    switch (screen) {
      case 'home':
        return <HomeScreen onOpenRole={goToAnalyse} onNavigate={setScreen} />;
      case 'analyse':
        return (
          <AnalyseScreen
            initialRoleId={analyseRoleId}
            onNavigate={setScreen}
          />
        );
      case 'team':
        return <TeamScreen />;
      case 'future':
        return <FutureSkillsScreen />;
      case 'whatif':
        return <WhatIfScreen />;
      case 'jobs':
        return <JobDescriptionsScreen />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-offwhite">
      <Sidebar active={screen} onNavigate={setScreen} />
      <div className="ml-[220px] min-h-screen flex flex-col">
        <div className="flex items-center justify-between px-10 pt-6">
          <span className="text-charcoal font-extrabold text-lg tracking-tight">TeamLens</span>
          <TopTag />
        </div>
        <main className="flex-1 px-10 py-6">{renderScreen()}</main>
      </div>
    </div>
  );
}
