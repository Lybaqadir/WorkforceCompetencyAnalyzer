import { CheckIcon, HomeIcon } from './icons';

const STEPS = [
  { key: 'onboarding', label: 'Mission' },
  { key: 'org-review', label: 'Organisation' },
  { key: 'team-collection', label: 'Team' },
  { key: 'team-mapping', label: 'Mapping' },
  { key: 'skills-analysis', label: 'Skills' },
  { key: 'gap-analysis', label: 'Gaps' },
  { key: 'recommendations', label: 'Recommendations' },
  { key: 'future-planning', label: 'Future Plan' },
];

const ORDER = STEPS.map((s) => s.key);

export default function WorkflowProgressBar({ currentStage, onNavigate, reviewMode = false, dark = false, onDashboard }) {
  const currentIndex = ORDER.indexOf(currentStage);

  return (
    <div className={`flex items-center justify-between gap-4 px-6 py-3 ${dark ? 'bg-white/5 border-b border-white/10' : 'bg-white border-b border-lightgrey/60'}`}>
      <div className="flex items-center gap-0 overflow-x-auto">
        {STEPS.map((step, i) => {
          const isDone = reviewMode ? i !== currentIndex : i < currentIndex;
          const isActive = i === currentIndex;
          const isClickable = reviewMode ? true : isDone;

          return (
            <div key={step.key} className="flex items-center shrink-0">
              <button
                onClick={() => isClickable && onNavigate?.(step.key)}
                disabled={!isClickable}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? `${dark ? 'text-gold' : 'text-maroon'} cursor-default`
                    : isDone
                    ? `${dark ? 'text-white/70 hover:text-white' : 'text-green hover:text-green'} cursor-pointer`
                    : `${dark ? 'text-white/25' : 'text-charcoal/30'} cursor-default`
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold transition-all duration-300 ${
                    isActive
                      ? `${dark ? 'bg-gold text-navy' : 'bg-maroon text-white'} shadow-sm`
                      : isDone
                      ? 'bg-green text-white'
                      : `${dark ? 'bg-white/10 text-white/25' : 'bg-lightgrey text-charcoal/30'}`
                  }`}
                >
                  {isDone ? <CheckIcon width="10" height="10" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span className={`w-6 h-px mx-0.5 shrink-0 ${isDone ? 'bg-green/50' : dark ? 'bg-white/10' : 'bg-lightgrey'}`} />
              )}
            </div>
          );
        })}
      </div>

      {reviewMode && onDashboard && (
        <button
          onClick={onDashboard}
          className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 ${
            dark
              ? 'text-white/70 hover:text-white hover:bg-white/10'
              : 'text-charcoal/60 hover:text-charcoal hover:bg-offwhite'
          }`}
        >
          <HomeIcon width="13" height="13" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
      )}
    </div>
  );
}
