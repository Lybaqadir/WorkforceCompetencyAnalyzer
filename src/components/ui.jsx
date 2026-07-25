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
    'AI + Human': 'hybrid',
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
      className={`inline-flex items-center justify-center gap-2 bg-maroon text-white rounded-xl px-4 py-3 text-sm font-semibold shadow-[0_4px_12px_rgba(67,56,202,0.25)] transition-all duration-200 hover:bg-maroon-dark hover:shadow-[0_6px_16px_rgba(67,56,202,0.3)] disabled:opacity-50 disabled:shadow-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 bg-white text-maroon border border-maroon/25 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 hover:bg-maroon/5 hover:border-maroon/40 ${className}`}
      {...props}
    >
      {children}
    </button>
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

// ————— Visual primitives —————

// Multi-segment donut chart. segments: [{ value, color }]
export function Donut({ segments, size = 150, thickness = 18, children, track = '#eef0f7' }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 2.5 : 0;
  let offset = 0;
  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        {segments.map((seg, i) => {
          if (seg.value <= 0) return null;
          const dash = Math.max((seg.value / total) * c - gap, 1);
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              className="transition-all duration-500"
            />
          );
          offset += (seg.value / total) * c;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

// Single-value gauge ring (0..max)
export function Gauge({ value, max = 100, color = '#f59e0b', size = 140, thickness = 14, children }) {
  return (
    <Donut
      segments={[
        { value, color },
        { value: Math.max(max - value, 0), color: 'transparent' },
      ]}
      size={size}
      thickness={thickness}
    >
      {children ?? (
        <>
          <span className="text-3xl font-extrabold text-charcoal leading-none">{value}</span>
          <span className="text-[11px] text-charcoal/45 mt-1">of {max}</span>
        </>
      )}
    </Donut>
  );
}

// Compact dashboard stat tile — small label, big number, colored icon chip.
export function StatTile({ icon, tone = 'brand', value, label, hint, onClick }) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-charcoal/45 mb-2 truncate">{label}</p>
          <p className="text-[32px] font-extrabold text-charcoal leading-none">{value}</p>
        </div>
        <IconBadge icon={icon} tone={tone} />
      </div>
      {hint && <p className="text-[11px] text-charcoal/40 mt-3 truncate">{hint}</p>}
    </>
  );
  const base =
    'flex-1 min-w-[170px] text-left bg-white rounded-2xl p-5 shadow-[0_1px_2px_rgba(18,19,26,0.04),0_8px_24px_rgba(18,19,26,0.06)] border border-black/[0.03]';
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${base} transition-all duration-200 hover:shadow-[0_8px_20px_rgba(18,19,26,0.1)] hover:-translate-y-0.5`}
      >
        {inner}
      </button>
    );
  }
  return <div className={base}>{inner}</div>;
}

const AVATAR_COLORS = [
  ['#eef2ff', '#4338ca'],
  ['#fef3c7', '#92620a'],
  ['#ccfbf1', '#0d9488'],
  ['#fee2e2', '#dc2626'],
  ['#f3e8ff', '#7e22ce'],
  ['#dbeafe', '#1d4ed8'],
];

export function Avatar({ name = '?', size = 36, className = '' }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  const [bg, fg] = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: bg, color: fg, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

// Labeled horizontal bar — value name on left, number on right, colored fill.
export function BarMeter({ label, value, max = 100, color = '#4338ca', right, className = '' }) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-sm font-semibold text-charcoal truncate">{label}</span>
        <span className="text-xs font-bold text-charcoal/55 shrink-0">{right ?? value}</span>
      </div>
      <div className="h-2 rounded-full bg-lightgrey overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// Dot + label legend row for charts.
export function Legend({ items, className = '' }) {
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: it.color }} />
          <span className="text-sm text-charcoal/70 truncate flex-1">{it.label}</span>
          {it.value != null && (
            <span className="text-sm font-bold text-charcoal shrink-0">{it.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function SectionTitle({ children, action, className = '' }) {
  return (
    <div className={`flex items-end justify-between gap-4 mb-4 ${className}`}>
      <h2 className="text-base font-bold text-charcoal">{children}</h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-6 mb-7 flex-wrap">
      <div>
        <h1 className="text-[26px] font-extrabold text-charcoal tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-charcoal/50 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Footer() {
  return null;
}

export function TopTag() {
  return null;
}
