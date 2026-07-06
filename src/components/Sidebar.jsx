import { FileIcon, HomeIcon, SlidersIcon, SparkleIcon, TrendIcon, UsersIcon } from './icons';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'team', label: 'Team & Skills', icon: UsersIcon },
  { id: 'analyse', label: 'AI Impact Analysis', icon: SparkleIcon },
  { id: 'whatif', label: 'Team Simulator', icon: SlidersIcon },
  { id: 'jobs', label: 'Job Descriptions', icon: FileIcon },
  { id: 'future', label: 'Future Planning', icon: TrendIcon },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-gradient-to-b from-navy to-maroon-dark flex flex-col shrink-0">
      <div className="px-6 pt-8 pb-6">
        <span className="text-white text-xl font-extrabold tracking-tight">TeamLens</span>
        <p className="text-white/35 text-[11px] mt-0.5">Workforce Intelligence</p>
      </div>
      <nav className="flex-1 px-3 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex items-center gap-3 text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/55 hover:text-white/85 hover:bg-white/5'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gold" />
              )}
              <Icon className={isActive ? 'text-gold' : 'text-white/45'} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-6 py-6">
        <p className="text-[11px] text-white/40 leading-relaxed">
          Innovation Team · Qatar Airways
        </p>
      </div>
    </aside>
  );
}
