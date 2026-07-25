import { FileIcon, HomeIcon, SlidersIcon, SparkleIcon, TrendIcon, UsersIcon } from './icons';
import { Avatar } from './ui';

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', icon: HomeIcon },
  { id: 'mission', label: 'Mission & Org', icon: SparkleIcon },
  { id: 'teamfit', label: 'Team Fit', icon: UsersIcon },
  { id: 'team', label: 'Team & Skills', icon: UsersIcon },
  { id: 'whatif', label: 'Simulator', icon: SlidersIcon },
  { id: 'jobs', label: 'Job Descriptions', icon: FileIcon },
  { id: 'future', label: 'Future Workforce Skills', icon: TrendIcon },
];

export default function Sidebar({ active, onNavigate, disabledIds = [], workflowData }) {
  const mission = workflowData?.mission;
  const teamName = mission?.teamName || 'Your Team';

  return (
    <aside className="fixed left-4 top-4 bottom-4 w-[224px] rounded-3xl bg-gradient-to-b from-navy to-maroon-dark dark:bg-none dark:bg-[#18181b] dark:border dark:border-white/[0.06] flex flex-col overflow-hidden">
      <div className="px-6 pt-7 pb-6 flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl bg-gold flex items-center justify-center text-navy font-extrabold text-lg shrink-0">
          W
        </span>
        <span className="text-white text-[13px] font-extrabold leading-tight tracking-tight">Workforce Competency Analyzer</span>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active;
          const isDisabled = disabledIds.includes(item.id);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onNavigate(item.id)}
              disabled={isDisabled}
              title={isDisabled ? 'Complete team mapping first' : undefined}
              className={`flex items-center gap-3 text-left px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors duration-200 ${
                isDisabled
                  ? 'text-white/25 cursor-not-allowed'
                  : isActive
                    ? 'bg-gold text-navy shadow-[0_4px_12px_rgba(245,158,11,0.3)]'
                    : 'text-white/55 hover:text-white/90 hover:bg-white/5'
              }`}
            >
              <Icon className={isActive ? 'text-navy' : 'text-white/45'} width="17" height="17" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4 pt-3">
        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] px-3.5 py-3">
          <Avatar name={teamName} size={34} />
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{teamName}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
