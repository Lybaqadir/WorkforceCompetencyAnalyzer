import { useEffect, useRef, useState } from 'react';
import { CheckIcon, MoonIcon, SparkleIcon, SunIcon } from '../components/icons';
import WorkflowProgressBar from '../components/WorkflowProgressBar';
import { apiStream } from '../lib/api';

const TYPE_LABELS = {
  human: 'Human Role',
  ai: 'AI Agent',
  hybrid: 'Human + AI',
};

const TYPE_COLORS = {
  human: 'bg-maroon/10 text-maroon border-maroon/20',
  ai: 'bg-green/10 text-green border-green/20',
  hybrid: 'bg-gold/15 text-[#92620a] border-gold/30',
};

// On the dark aurora shell the light-theme chips above are unreadable, so the
// chart uses its own accent set: one hue per role type, applied as a top rule
// on the card and as the tint of its type chip.
const NODE_ACCENTS = {
  human: { bar: '#818cf8', chip: 'bg-[#818cf8]/15 text-[#c7d2fe] border-[#818cf8]/30' },
  ai: { bar: '#2dd4bf', chip: 'bg-[#2dd4bf]/15 text-[#99f6e4] border-[#2dd4bf]/30' },
  hybrid: { bar: '#fbbf24', chip: 'bg-[#fbbf24]/15 text-[#fde68a] border-[#fbbf24]/30' },
};

// Common innovation/digital team role suggestions
const ROLE_SUGGESTIONS = [
  { name: 'Data Engineer', type: 'human' },
  { name: 'ML Engineer', type: 'human' },
  { name: 'AI Product Manager', type: 'human' },
  { name: 'UX Researcher', type: 'human' },
  { name: 'Cloud Architect', type: 'human' },
  { name: 'DevOps Engineer', type: 'human' },
  { name: 'Change Management Lead', type: 'human' },
  { name: 'AI Ethics Advisor', type: 'human' },
  { name: 'Innovation Strategist', type: 'human' },
  { name: 'Business Analyst', type: 'human' },
  { name: 'AI Automation Agent', type: 'ai' },
  { name: 'Data Pipeline Agent', type: 'ai' },
];

// ── Build tree from flat array ────────────────────────────────────────────────
function buildTree(flatRoles) {
  const map = {};
  flatRoles.forEach((r) => { map[r.id] = { ...r, children: [] }; });
  const roots = [];
  Object.values(map).forEach((node) => {
    if (node.reportsTo && map[node.reportsTo]) {
      map[node.reportsTo].children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

// ── Role editing modal ────────────────────────────────────────────────────────
function EditRoleModal({ role, onSave, onClose }) {
  const [name, setName] = useState(role.name);
  const [roleType, setRoleType] = useState(role.roleType || 'human');
  const [rationale, setRationale] = useState(role.rationale || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-lightgrey/60">
          <h3 className="text-base font-bold text-charcoal">Edit Role</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-charcoal/50 mb-1.5 block">Role Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-lightgrey rounded-xl px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-maroon"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-charcoal/50 mb-1.5 block">Type</label>
            <div className="flex gap-2">
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setRoleType(key)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    roleType === key ? TYPE_COLORS[key] + ' border-2' : 'bg-offwhite text-charcoal/50 border-lightgrey'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-charcoal/50 mb-1.5 block">Rationale</label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
              className="w-full border border-lightgrey rounded-xl px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-maroon resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-lightgrey/60 flex gap-3">
          <button
            onClick={() => onSave({ ...role, name, roleType, subTeam: TYPE_LABELS[roleType], rationale })}
            className="flex-1 bg-maroon text-white rounded-xl py-2.5 text-sm font-bold"
          >
            Save Changes
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-lightgrey text-sm font-semibold text-charcoal/60">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Role side panel with chips + AI chat ──────────────────────────────────
function AddRolePanel({ existingRoles, mission, onAdd, onClose }) {
  const [name, setName] = useState('');
  const [roleType, setRoleType] = useState('human');
  const [reportsTo, setReportsTo] = useState(existingRoles[0]?.id || '');
  const [description, setDescription] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  function selectChip(suggestion) {
    setName(suggestion.name);
    setRoleType(suggestion.type);
  }

  function askAI() {
    if (!description.trim()) return;
    setAiLoading(true);
    setAiSuggestion('');
    let response = '';
    apiStream(
      '/api/chat/stream',
      {
        sessionId: 'add-role-' + Date.now(),
        message: `I'm adding a new role to an innovation team org chart. Here's what it should do: "${description}".
The team's mission is: "${mission?.statement || 'drive innovation'}".
Existing roles in the org: ${existingRoles.map((r) => r.name).join(', ')}.
In 2-3 sentences: suggest a good job title for this role, whether it should be Human, AI Agent, or Human+AI hybrid, and which existing role it should report to. Be concise.`,
        screen: 'org-review',
        workflowStage: 'onboarding',
        history: [],
      },
      (chunk) => {
        if (chunk.type === 'token') {
          response += chunk.text;
          setAiSuggestion(response);
        }
      },
      () => setAiLoading(false),
      () => setAiLoading(false),
    );
  }

  function handleAdd() {
    if (!name.trim()) return;
    const id = name.toLowerCase().replace(/[\s/]+/g, '-') + '-' + Date.now();
    onAdd({
      id,
      name: name.trim(),
      roleType,
      subTeam: TYPE_LABELS[roleType],
      reportsTo: reportsTo || null,
      rationale: description || '',
      skills: [],
      headcount: 1,
      isNew: true,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-white h-full w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-lightgrey/60 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-charcoal">Add a Role</h3>
            <button onClick={onClose} className="text-charcoal/40 hover:text-charcoal/70 text-sm font-semibold">Close</button>
          </div>
          <p className="text-xs text-charcoal/50">Pick a suggestion or describe the role and ask AI to help.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick pick chips */}
          <div>
            <p className="text-xs font-bold text-charcoal/40 uppercase tracking-wide mb-2">Quick pick</p>
            <div className="flex flex-wrap gap-2">
              {ROLE_SUGGESTIONS.map((s) => (
                <button
                  key={s.name}
                  onClick={() => selectChip(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    name === s.name
                      ? s.type === 'ai'
                        ? 'bg-green/15 text-green border-green/30'
                        : 'bg-maroon/10 text-maroon border-maroon/20'
                      : 'bg-offwhite text-charcoal/60 border-lightgrey hover:border-charcoal/30'
                  }`}
                >
                  {s.type === 'ai' ? '🤖 ' : ''}{s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Role name input */}
          <div>
            <label className="text-xs font-bold text-charcoal/40 uppercase tracking-wide mb-1.5 block">Role Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Product Manager"
              className="w-full border border-lightgrey rounded-xl px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-maroon"
            />
          </div>

          {/* Type selector */}
          <div>
            <label className="text-xs font-bold text-charcoal/40 uppercase tracking-wide mb-1.5 block">Type</label>
            <div className="flex gap-2">
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setRoleType(key)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    roleType === key ? TYPE_COLORS[key] + ' border-2' : 'bg-offwhite text-charcoal/50 border-lightgrey'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Reports to */}
          <div>
            <label className="text-xs font-bold text-charcoal/40 uppercase tracking-wide mb-1.5 block">Reports To</label>
            <select
              value={reportsTo}
              onChange={(e) => setReportsTo(e.target.value)}
              className="w-full border border-lightgrey rounded-xl px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-maroon bg-white"
            >
              <option value="">Top level (no manager)</option>
              {existingRoles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* AI description + suggestion */}
          <div className="rounded-2xl bg-maroon/5 border border-maroon/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <SparkleIcon width="14" height="14" className="text-maroon shrink-0" />
              <p className="text-xs font-bold text-maroon">Ask AI to help</p>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what this role should do... e.g. 'Someone to manage our data pipelines and ensure clean data flows to the ML team'"
              className="w-full border border-maroon/15 rounded-xl px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-maroon resize-none bg-white mb-2"
            />
            <button
              onClick={askAI}
              disabled={!description.trim() || aiLoading}
              className="w-full py-2 rounded-xl bg-maroon text-white text-xs font-bold disabled:opacity-40 hover:brightness-110 transition-all"
            >
              {aiLoading ? 'AI is thinking…' : 'Get AI suggestion'}
            </button>
            {aiSuggestion && (
              <div className="mt-3 p-3 rounded-xl bg-white border border-maroon/10">
                <p className="text-xs text-charcoal/70 leading-relaxed">{aiSuggestion}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-lightgrey/60 shrink-0">
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="w-full bg-maroon text-white rounded-xl py-3 text-sm font-bold disabled:opacity-40 hover:brightness-110 transition-all"
          >
            Add Role to Org Chart
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Org node card ─────────────────────────────────────────────────────────────
function OrgNode({ node, allNodes, onEdit, onDelete, onAdd, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  const roleType = node.roleType || 'human';
  const accent = NODE_ACCENTS[roleType] || NODE_ACCENTS.human;
  const typeLabel = TYPE_LABELS[roleType];
  const allSkills = node.skills || [];
  // One row only — wrapping skill pills made sibling cards different heights
  // and the whole tree looked ragged. Overflow is shown as a "+N" count.
  const skills = allSkills.slice(0, 2);
  const extraSkills = allSkills.length - skills.length;

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div className="relative group">
        <div
          className="org-card relative flex flex-col rounded-2xl w-[252px] min-h-[196px] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:z-20"
          style={{ '--accent': accent.bar }}
        >
          {/* accent rule — the only place role type is colour-coded on the card */}
          <div className="h-[3px] w-full" style={{ background: accent.bar }} />

          <div className="flex-1 flex flex-col px-4 pt-3 pb-3.5 text-left">
            <p className="text-[13px] font-bold text-white leading-snug line-clamp-2" title={node.name}>
              {node.name}
            </p>

            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className={`inline-flex px-2 py-[3px] rounded-md text-[10px] font-bold border ${accent.chip}`}>
                {typeLabel}
              </span>
              {node.category && (
                <span className="text-[10px] font-semibold text-white/35 line-clamp-1" title={node.category}>
                  {node.category}
                </span>
              )}
            </div>

            {node.rationale && (
              <p className="text-[11px] text-white/55 leading-relaxed mt-2 line-clamp-2" title={node.rationale}>
                {node.rationale}
              </p>
            )}

            {skills.length > 0 && (
              <div className="flex gap-1 mt-auto pt-2.5 overflow-hidden">
                {skills.map((s) => (
                  <span
                    key={s.name || s}
                    className="px-2 py-[3px] rounded-md bg-white/[0.07] border border-white/10 text-white/60 text-[10px] font-semibold whitespace-nowrap truncate max-w-[110px]"
                    title={s.name || s}
                  >
                    {s.name || s}
                  </span>
                ))}
                {extraSkills > 0 && (
                  <span
                    className="px-1.5 py-[3px] rounded-md text-white/40 text-[10px] font-semibold shrink-0"
                    title={allSkills.slice(2).map((s) => s.name || s).join(', ')}
                  >
                    +{extraSkills}
                  </span>
                )}
              </div>
            )}

            {collapsed && node.children?.length > 0 && (
              <p className="text-[10px] font-semibold text-white/40 mt-2.5">
                {node.children.length} report{node.children.length > 1 ? 's' : ''} hidden
              </p>
            )}
          </div>

          {/* Hover actions */}
          <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
            <button
              onClick={() => onEdit(node)}
              className="w-6 h-6 rounded-lg bg-white/10 border border-white/15 text-white/80 text-[11px] flex items-center justify-center backdrop-blur hover:bg-white/20"
              title="Edit"
            >✎</button>
            <button
              onClick={() => onAdd(node)}
              className="w-6 h-6 rounded-lg bg-white/10 border border-white/15 text-white/80 text-[11px] flex items-center justify-center backdrop-blur hover:bg-white/20"
              title="Add child role"
            >+</button>
            {depth > 0 && (
              <button
                onClick={() => onDelete(node.id)}
                className="w-6 h-6 rounded-lg bg-white/10 border border-white/15 text-white/80 text-[11px] flex items-center justify-center backdrop-blur hover:bg-red hover:text-white hover:border-transparent"
                title="Remove"
              >✕</button>
            )}
          </div>
        </div>

        {node.children?.length > 0 && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#241f57] border border-white/25 text-white/70 text-xs leading-none flex items-center justify-center hover:border-white/60 hover:text-white z-10"
            title={collapsed ? `Show ${node.children.length} report${node.children.length > 1 ? 's' : ''}` : 'Collapse'}
          >
            {collapsed ? '+' : '−'}
          </button>
        )}
      </div>

      {/* Children — single tree layout with continuous connector lines.
          Each child cell draws its own vertical stub plus a half-width
          horizontal segment on each side; adjacent cells have NO gap, so the
          segments join into one clean unbroken rail. */}
      {!collapsed && node.children?.length > 0 && (
        <div className="flex flex-col items-center w-full">
          <div className="w-px h-9 org-line" />
          <div className="flex items-start">
            {node.children.map((child, i) => (
              <div key={child.id} className="relative flex flex-col items-center pt-9 px-3">
                {/* vertical stub down to the child card */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-9 org-line" />
                {/* horizontal rail — only between siblings, never past the ends */}
                {node.children.length > 1 && i > 0 && (
                  <div className="absolute top-0 left-0 right-1/2 h-px org-line" />
                )}
                {node.children.length > 1 && i < node.children.length - 1 && (
                  <div className="absolute top-0 left-1/2 right-0 h-px org-line" />
                )}
                <OrgNode
                  node={child}
                  allNodes={allNodes}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAdd={onAdd}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function OrgReviewScreen({ orgDraft, mission, onApprove, onBack, reviewMode, onJumpToStage, theme, onToggleTheme, onDashboard }) {
  const [roles, setRoles] = useState(orgDraft || []);
  const [editingRole, setEditingRole] = useState(null);
  const [addingUnder, setAddingUnder] = useState(null);
  const [history, setHistory] = useState([]);
  // Larger AI-generated org charts (10-15+ roles) need to start zoomed out
  // enough that the whole tree is legible without scrolling off-screen.
  const [zoom, setZoom] = useState(() => {
    const total = (orgDraft || []).length;
    if (total > 16) return 0.6;
    if (total > 11) return 0.75;
    if (total > 7) return 0.9;
    return 1;
  });
  const chartAreaRef = useRef(null);
  const chartInnerRef = useRef(null);

  const tree = buildTree(roles);

  // Scale the chart down until the whole tree fits the viewport width, so the
  // user never lands mid-branch with the root scrolled off screen.
  // `widthOnly` is used on mount: a deep tree fitted on both axes shrinks past
  // legibility, and vertical scrolling is a fine way to read one. The Fit
  // button fits both axes because that's what the user asked for.
  function fitToScreen(widthOnly = false) {
    const area = chartAreaRef.current;
    const inner = chartInnerRef.current;
    if (!area || !inner) return;
    const { width: contentW, height: contentH } = inner.getBoundingClientRect(); // already zoom-scaled
    if (!contentW || !contentH) return;
    const ratioW = (area.clientWidth - 64) / contentW; // p-8 either side
    const ratioH = (area.clientHeight - 64) / contentH;
    const next = Math.min(1, zoom * (widthOnly ? ratioW : Math.min(ratioW, ratioH)));
    setZoom(Math.max(widthOnly ? 0.55 : 0.35, +next.toFixed(2)));
  }

  // Land with the root centred and fully visible instead of wherever the
  // browser happens to leave the scroll position.
  useEffect(() => {
    fitToScreen(true);
    // Centre after the zoom change has been laid out.
    const raf = requestAnimationFrame(() => {
      const el = chartAreaRef.current;
      if (!el) return;
      el.scrollTop = 0;
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  function pushHistory() {
    setHistory((h) => [...h.slice(-20), JSON.stringify(roles)]);
  }

  function handleUndo() {
    if (history.length === 0) return;
    setHistory((h) => h.slice(0, -1));
    setRoles(JSON.parse(history[history.length - 1]));
  }

  function handleSaveEdit(updated) {
    pushHistory();
    setRoles((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    setEditingRole(null);
  }

  function handleDelete(id) {
    pushHistory();
    setRoles((prev) => {
      const removed = new Set([id]);
      let changed = true;
      while (changed) {
        changed = false;
        prev.forEach((r) => {
          if (r.reportsTo && removed.has(r.reportsTo) && !removed.has(r.id)) {
            removed.add(r.id); changed = true;
          }
        });
      }
      return prev.filter((r) => !removed.has(r.id));
    });
  }

  function handleAddRole(newRole) {
    pushHistory();
    const withParent = addingUnder?.id
      ? { ...newRole, reportsTo: addingUnder.id }
      : newRole;
    setRoles((prev) => [...prev, { ...withParent, children: undefined }]);
    setAddingUnder(null);
  }

  function handleApprove() {
    const clean = roles.map(({ children, ...r }) => r);
    onApprove(clean);
  }

  return (
    <div className="fixed inset-0 z-40 aurora-shell flex flex-col overflow-hidden">
      <WorkflowProgressBar currentStage="org-review" dark reviewMode={reviewMode} onNavigate={onJumpToStage} onDashboard={onDashboard} />

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/10 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-widest">Draft Organisation</span>
            <span className="text-white/40 text-xs">Awaiting your approval</span>
            <span className="text-white/25 text-xs">·</span>
            <span className="text-white/35 text-xs">Hover any card to edit, add a report, or remove it</span>
          </div>
          <h2 className="text-white text-lg font-bold">Review Your Target Organisation</h2>
          {mission?.statement && (
            <p className="text-white/50 text-xs mt-0.5 max-w-xl truncate">Mission: {mission.statement}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button onClick={onToggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10">
              {theme === 'dark' ? <SunIcon width="16" height="16" /> : <MoonIcon width="16" height="16" />}
            </button>
          )}
          {onBack && (
            <button onClick={onBack} className="px-3.5 py-2 rounded-xl border border-white/20 text-white/60 text-sm font-semibold hover:border-white/40 hover:text-white/80 transition-colors">← Back</button>
          )}

          {history.length > 0 && (
            <button onClick={handleUndo} className="px-3 py-2 rounded-xl bg-white/10 text-white/70 text-xs font-semibold hover:bg-white/15 transition-colors">
              ↩ Undo
            </button>
          )}
          <button
            onClick={() => setAddingUnder({ id: null })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white/80 text-xs font-semibold hover:bg-white/20 transition-colors"
          >
            <span className="text-sm leading-none">+</span>
            Add Role
          </button>
          <button
            onClick={handleApprove}
            className="inline-flex items-center gap-2 bg-gold text-navy rounded-xl px-5 py-2.5 text-sm font-bold shadow-[0_6px_20px_rgba(245,158,11,0.35)] hover:brightness-110 transition-all"
          >
            <CheckIcon width="14" height="14" />
            Approve Organisation
          </button>
        </div>
      </div>

      {/* Org chart area */}
      <div ref={chartAreaRef} className="relative flex-1 overflow-auto p-8">
        {/* Roles with no manager are separate roots. Stacking them vertically
            reads as "reports to the card above", which is wrong — lay them out
            side by side instead. */}
        {/* w-max (not min-w-max) so the element's box IS the tree's box —
            fitToScreen measures it, and a stretched box would report the
            container width and make the fit a no-op. */}
        <div ref={chartInnerRef} className="w-max mx-auto flex items-start gap-14" style={{ zoom }}>
          {tree.map((root) => (
            <OrgNode
              key={root.id}
              node={root}
              allNodes={roles}
              onEdit={setEditingRole}
              onDelete={handleDelete}
              onAdd={(node) => setAddingUnder(node)}
              depth={0}
            />
          ))}
          {roles.length === 0 && (
            <p className="text-white/40 text-sm mt-16">No roles yet — click "+ Add Role" to start.</p>
          )}
        </div>

        {roles.length > 0 && (
          <div className="fixed bottom-6 left-8 z-30 flex items-center gap-4 bg-navy/80 backdrop-blur border border-white/10 rounded-xl px-3 py-2">
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <span key={key} className="flex items-center gap-1.5 text-[11px] font-semibold text-white/50">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: NODE_ACCENTS[key].bar }} />
                {label}
              </span>
            ))}
          </div>
        )}

        {roles.length > 0 && (
          <div className="fixed bottom-6 right-8 z-30 flex items-center gap-1 bg-navy/90 backdrop-blur border border-white/15 rounded-xl px-1.5 py-1.5 shadow-lg">
            <button
              onClick={() => fitToScreen()}
              className="px-2.5 h-7 rounded-lg text-white/70 text-[11px] font-semibold hover:bg-white/10 flex items-center justify-center"
              title="Fit the whole chart on screen"
            >
              Fit
            </button>
            <span className="w-px h-4 bg-white/15" />
            <button
              onClick={() => setZoom((z) => Math.max(0.35, +(z - 0.1).toFixed(2)))}
              className="w-7 h-7 rounded-lg text-white/70 text-sm font-bold hover:bg-white/10 flex items-center justify-center"
              title="Zoom out"
            >
              −
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-2 h-7 rounded-lg text-white/60 text-[11px] font-semibold hover:bg-white/10 flex items-center justify-center tabular-nums"
              title="Reset to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(1.3, +(z + 0.1).toFixed(2)))}
              className="w-7 h-7 rounded-lg text-white/70 text-sm font-bold hover:bg-white/10 flex items-center justify-center"
              title="Zoom in"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Modals / panels */}
      {editingRole && (
        <EditRoleModal
          role={editingRole}
          onSave={handleSaveEdit}
          onClose={() => setEditingRole(null)}
        />
      )}
      {addingUnder !== null && (
        <AddRolePanel
          existingRoles={roles}
          mission={mission}
          onAdd={handleAddRole}
          onClose={() => setAddingUnder(null)}
        />
      )}
    </div>
  );
}
