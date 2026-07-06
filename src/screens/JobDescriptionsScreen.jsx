import { useState } from 'react';
import { Card, Footer, PageHeader } from '../components/ui';
import { FileIcon, PersonIcon, SparkleIcon } from '../components/icons';
import { roles, jobDescriptions } from '../data/teamData';

function CopyButton({ getText }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = getText();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-semibold text-charcoal/50 border border-lightgrey rounded-lg px-3 py-1.5 hover:bg-lightgrey/50 transition-colors duration-200 shrink-0"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function personText(role, person) {
  return [
    `${role.name} — For a Person`,
    '',
    'What this role is about:',
    person.about,
    '',
    'What this person will do:',
    ...person.duties.map((d) => `- ${d}`),
    '',
    'What skills and qualities this person should have:',
    ...person.skills.map((s) => `- ${s}`),
    '',
    'Who this person works with:',
    person.worksWith,
  ].join('\n');
}

function agentText(role, agent) {
  return [
    `${role.name} — For an AI Agent`,
    '',
    'What this agent handles:',
    agent.about,
    '',
    'Tasks this agent does automatically:',
    ...agent.tasks.map((t) => `- ${t}`),
    '',
    'What it needs to work:',
    ...agent.needs.map((n) => `- ${n}`),
    '',
    'What it hands back to the human:',
    ...agent.handsBack.map((h) => `- ${h}`),
  ].join('\n');
}

export default function JobDescriptionsScreen() {
  const [activeId, setActiveId] = useState(roles[0].id);
  const role = roles.find((r) => r.id === activeId);
  const { person, agent } = jobDescriptions[activeId];

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        icon={<FileIcon />}
        eyebrow="Smart Job Descriptions"
        title="Fresh job descriptions for your team"
        subtitle="For every role in your Innovation Team — one written for a human hire, one written for an AI agent, generated fresh and ready to use."
      />

      <div className="flex gap-6 border-b border-lightgrey mb-6">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveId(r.id)}
            className={`pb-3 text-sm transition-colors duration-200 border-b-2 -mb-px ${
              r.id === activeId
                ? 'border-maroon text-charcoal font-bold'
                : 'border-transparent text-charcoal/45 hover:text-charcoal/70'
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-1">
            <span className="inline-flex items-center gap-2 text-maroon font-bold text-sm">
              <PersonIcon /> For a Person
            </span>
            <CopyButton getText={() => personText(role, person)} />
          </div>
          <p className="text-xs text-charcoal/45 mb-5">
            Focuses only on what genuinely needs a human
          </p>

          <h3 className="text-xs font-bold text-charcoal/50 uppercase tracking-wide mb-1.5">
            What this role is about
          </h3>
          <p className="text-sm text-charcoal/80 leading-relaxed mb-5">{person.about}</p>

          <h3 className="text-xs font-bold text-charcoal/50 uppercase tracking-wide mb-1.5">
            What this person will do
          </h3>
          <ul className="space-y-1.5 mb-5">
            {person.duties.map((d) => (
              <li key={d} className="text-sm text-charcoal/80 flex gap-2">
                <span className="text-maroon shrink-0">·</span>
                {d}
              </li>
            ))}
          </ul>

          <h3 className="text-xs font-bold text-charcoal/50 uppercase tracking-wide mb-1.5">
            What skills and qualities this person should have
          </h3>
          <ul className="space-y-1.5 mb-5">
            {person.skills.map((s) => (
              <li key={s} className="text-sm text-charcoal/80 flex gap-2">
                <span className="text-maroon shrink-0">·</span>
                {s}
              </li>
            ))}
          </ul>

          <h3 className="text-xs font-bold text-charcoal/50 uppercase tracking-wide mb-1.5">
            Who this person works with
          </h3>
          <p className="text-sm text-charcoal/80 leading-relaxed">{person.worksWith}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-1">
            <span className="inline-flex items-center gap-2 text-green font-bold text-sm">
              <SparkleIcon /> For an AI Agent
            </span>
            <CopyButton getText={() => agentText(role, agent)} />
          </div>
          <p className="text-xs text-charcoal/45 mb-5">
            Covers the tasks a person should not have to spend time on
          </p>

          <h3 className="text-xs font-bold text-charcoal/50 uppercase tracking-wide mb-1.5">
            What this agent handles
          </h3>
          <p className="text-sm text-charcoal/80 leading-relaxed mb-5">{agent.about}</p>

          <h3 className="text-xs font-bold text-charcoal/50 uppercase tracking-wide mb-1.5">
            Tasks this agent does automatically
          </h3>
          <ul className="space-y-1.5 mb-5">
            {agent.tasks.map((t) => (
              <li key={t} className="text-sm text-charcoal/80 flex gap-2">
                <span className="text-green shrink-0">·</span>
                {t}
              </li>
            ))}
          </ul>

          <h3 className="text-xs font-bold text-charcoal/50 uppercase tracking-wide mb-1.5">
            What it needs to work
          </h3>
          <ul className="space-y-1.5 mb-5">
            {agent.needs.map((n) => (
              <li key={n} className="text-sm text-charcoal/80 flex gap-2">
                <span className="text-green shrink-0">·</span>
                {n}
              </li>
            ))}
          </ul>

          <h3 className="text-xs font-bold text-charcoal/50 uppercase tracking-wide mb-1.5">
            What it hands back to the human
          </h3>
          <ul className="space-y-1.5">
            {agent.handsBack.map((h) => (
              <li key={h} className="text-sm text-charcoal/80 flex gap-2">
                <span className="text-green shrink-0">·</span>
                {h}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
