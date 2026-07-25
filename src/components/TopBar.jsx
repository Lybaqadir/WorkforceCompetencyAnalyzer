import { MoonIcon, SunIcon } from './icons';

const SCREEN_TITLES = {
  home: 'Dashboard',
  mission: 'Mission & Org',
  teamfit: 'Team Fit',
  team: 'Team & Skills',
  whatif: 'Simulator',
  jobs: 'Job Descriptions',
  future: 'Future Workforce Skills',
  analyse: 'Role Analysis',
};

export default function TopBar({ screen, theme, onToggleTheme }) {
  const isDark = theme === 'dark';
  const title = SCREEN_TITLES[screen] ?? '';

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between px-8 py-3 bg-offwhite border-b border-lightgrey/60">
      <p className="text-[13px] font-semibold text-charcoal/50">{title}</p>
      <button
        onClick={onToggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-lightgrey text-charcoal/55 hover:text-charcoal hover:border-charcoal/25 hover:bg-lightgrey/40 transition-all duration-200 text-[12px] font-semibold"
      >
        {isDark ? <SunIcon width="14" height="14" /> : <MoonIcon width="14" height="14" />}
        {isDark ? 'Light mode' : 'Dark mode'}
      </button>
    </div>
  );
}
