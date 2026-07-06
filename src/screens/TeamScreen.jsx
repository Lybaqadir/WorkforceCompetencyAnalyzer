import { Card, Footer, PageHeader } from '../components/ui';
import { UsersIcon } from '../components/icons';
import {
  skillCoverage,
  workloadStatus,
  overlaps,
  healthFactors,
  teamMetrics,
} from '../data/teamData';

function CoverageGroup({ title, items, color, bg }) {
  return (
    <div className="rounded-xl p-4 mb-4 last:mb-0" style={{ backgroundColor: bg }}>
      <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color }}>
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 text-sm font-medium text-charcoal/80 shadow-[0_1px_2px_rgba(18,19,26,0.06)]"
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

const statusMeta = {
  green: { icon: '✓', color: '#0d9488', bg: 'bg-green/10' },
  gold: { icon: '⚑', color: '#92620a', bg: 'bg-gold/15' },
  red: { icon: '⚑', color: '#dc2626', bg: 'bg-red/10' },
};

function WorkloadRow({ item }) {
  const meta = statusMeta[item.status];
  return (
    <div className="py-3 border-b border-lightgrey/70 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <span className="text-sm font-semibold text-charcoal">{item.role}</span>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0 ${meta.bg}`}
          style={{ color: meta.color }}
        >
          <span>{meta.icon}</span>
          {item.label}
        </span>
      </div>
      <p className="text-xs text-charcoal/50 mt-1.5 leading-relaxed">{item.detail}</p>
    </div>
  );
}

function OverlapCard({ overlap }) {
  return (
    <div className="bg-offwhite rounded-xl p-5">
      <p className="text-sm font-bold text-charcoal mb-2">
        {overlap.roleA} <span className="text-charcoal/40 font-normal">&</span> {overlap.roleB}
      </p>
      <div className="h-2 rounded-full bg-lightgrey overflow-hidden mb-1.5">
        <div className="h-full bg-maroon" style={{ width: `${overlap.percent}%` }} />
      </div>
      <p className="text-xs font-semibold text-charcoal/50 mb-3">
        {overlap.percent}% of the same skills
      </p>
      <p className="text-xs text-charcoal/55 mb-2">Shared skills: {overlap.shared.join(', ')}</p>
      <p className="text-xs text-maroon font-medium">{overlap.note}</p>
    </div>
  );
}

function HealthBar({ factor }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-semibold text-charcoal">{factor.label}</span>
        <span className="font-semibold text-charcoal/60">{factor.score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-lightgrey overflow-hidden mb-1.5">
        <div className="h-full bg-gold" style={{ width: `${factor.score}%` }} />
      </div>
      <p className="text-xs text-charcoal/55">{factor.note}</p>
    </div>
  );
}

export default function TeamScreen() {
  return (
    <div className="max-w-[1200px]">
      <PageHeader
        icon={<UsersIcon />}
        eyebrow="Team & Skill Analysis"
        title="Here is how your whole Innovation Team looks right now"
        subtitle="Skills available, skills missing, who's overloaded, and how it all adds up — based on all five roles analysed."
      />

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-bold text-charcoal">Who knows what</h2>
          <p className="text-xs text-charcoal/45 mt-1 mb-4">Skill coverage across your team</p>
          <CoverageGroup
            title="Covered well — multiple people have this"
            items={skillCoverage.covered}
            color="#0d9488"
            bg="rgba(13,148,136,0.06)"
          />
          <CoverageGroup
            title="Watch out — only one person knows this"
            items={skillCoverage.watch}
            color="#92620a"
            bg="rgba(245,158,11,0.08)"
          />
          <CoverageGroup
            title="Nobody has this yet"
            items={skillCoverage.missing}
            color="#dc2626"
            bg="rgba(220,38,38,0.06)"
          />
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-charcoal mb-4">
            Who is doing too much or too little
          </h2>
          <div>
            {workloadStatus.map((item) => (
              <WorkloadRow key={item.role} item={item} />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-charcoal mb-4">Roles that look too similar</h2>
          <div className="space-y-4">
            {overlaps.map((overlap) => (
              <OverlapCard key={overlap.roleA} overlap={overlap} />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-charcoal mb-4">How healthy is your team overall</h2>
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-4xl font-extrabold text-gold">{teamMetrics.health}</span>
            <span className="text-sm text-charcoal/50">/ 100</span>
            <span className="text-xs font-semibold text-charcoal/40 uppercase tracking-wide ml-2">
              Overall Team Health
            </span>
          </div>
          {healthFactors.map((factor) => (
            <HealthBar key={factor.label} factor={factor} />
          ))}
          <p className="text-sm text-charcoal/70 leading-relaxed mt-4 pt-4 border-t border-lightgrey/70">
            Your team is in reasonable shape but two roles overlap and three skill gaps need
            attention before November.
          </p>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
