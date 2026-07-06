export function Pill({ tone = 'human', children }) {
  const tones = {
    ai: 'bg-green/10 text-green',
    human: 'bg-maroon/10 text-maroon',
    hybrid: 'bg-gold/15 text-[#92620a]',
    warning: 'bg-red/10 text-red',
    grey: 'bg-lightgrey text-charcoal/60',
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function VerdictPill({ verdict }) {
  const map = {
    'AI Candidate': 'ai',
    Hybrid: 'hybrid',
    'Human Critical': 'human',
  };
  return <Pill tone={map[verdict] || 'human'}>{verdict}</Pill>;
}

export function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-[0_1px_2px_rgba(18,19,26,0.04),0_8px_24px_rgba(18,19,26,0.06)] border border-black/[0.03] ${className}`}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 bg-maroon text-white rounded-xl px-4 py-3.5 text-sm font-semibold shadow-[0_4px_12px_rgba(67,56,202,0.25)] transition-all duration-200 hover:bg-maroon-dark hover:shadow-[0_6px_16px_rgba(67,56,202,0.3)] disabled:opacity-50 disabled:shadow-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 bg-white text-maroon border border-maroon/25 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 hover:bg-maroon/5 hover:border-maroon/40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Footer() {
  return (
    <p className="text-center text-[11px] text-charcoal/35 py-6">
      Prototype · Innovation Team · Qatar Airways Digital Innovation · For demonstration only
    </p>
  );
}

export function TopTag() {
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-lightgrey text-charcoal/70">
      Innovation Team · Qatar Airways
    </span>
  );
}

export function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 ${
        checked ? 'bg-maroon' : 'bg-lightgrey'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function IconBadge({ icon, tone = 'brand', className = '' }) {
  const tones = {
    brand: 'bg-maroon/10 text-maroon',
    gold: 'bg-gold/15 text-[#92620a]',
    green: 'bg-green/10 text-green',
    red: 'bg-red/10 text-red',
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${tones[tone]} ${className}`}
    >
      {icon}
    </span>
  );
}

export function PageHeader({ icon, eyebrow, title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-6 mb-8 flex-wrap">
      <div className="flex items-start gap-4">
        {icon && <IconBadge icon={icon} className="mt-0.5" />}
        <div>
          {eyebrow && (
            <p className="text-xs font-bold text-maroon uppercase tracking-wider mb-1">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-extrabold text-charcoal tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-charcoal/55 mt-1.5 max-w-2xl leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
