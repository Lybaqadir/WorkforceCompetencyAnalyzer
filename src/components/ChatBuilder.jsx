import { useEffect, useMemo, useRef, useState } from 'react';
import { MicIcon, PaperclipIcon } from './icons';
import { PrimaryButton } from './ui';

function TypingBubble() {
  return (
    <div className="flex items-center gap-1 bg-offwhite rounded-2xl rounded-bl-sm px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-charcoal/40 pulse-dot"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// Split agent text into body + trailing question sentence.
// e.g. "Great name. What is the purpose?" → { body: "Great name.", question: "What is the purpose?" }
function splitQuestion(text) {
  if (!text) return { body: '', question: '' };
  // Split by sentence-ending punctuation, keeping the delimiter
  const sentences = text.match(/[^.!?]*[.!?]+|[^.!?]+$/g) || [text];
  // Find the last sentence(s) that form a question
  let questionIdx = -1;
  for (let i = sentences.length - 1; i >= 0; i--) {
    if (sentences[i].trimEnd().endsWith('?')) {
      questionIdx = i;
    } else {
      break;
    }
  }
  if (questionIdx === -1) return { body: text, question: '' };
  const body = sentences.slice(0, questionIdx).join('').trim();
  const question = sentences.slice(questionIdx).join('').trim();
  return { body, question };
}

function AgentBubble({ text, streaming, content, answers, renderContent }) {
  const { body, question } = streaming ? { body: text, question: '' } : splitQuestion(text);

  // While streaming, show a single bubble with cursor
  if (streaming) {
    return (
      <div className="max-w-[82%] flex flex-col gap-2">
        <div className="bg-offwhite text-charcoal rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed">
          {text}
          <span className="inline-block w-1.5 h-3.5 bg-charcoal/40 ml-0.5 animate-pulse rounded-sm align-middle" />
        </div>
      </div>
    );
  }

  // After streaming completes, render body and question as two separate bubbles
  return (
    <div className="max-w-[82%] flex flex-col gap-2">
      {body && (
        <div className="bg-offwhite text-charcoal/70 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed">
          {body}
        </div>
      )}
      {question && (
        <div className="bg-white border border-maroon/20 border-l-[3px] border-l-maroon rounded-r-2xl rounded-bl-sm px-4 py-3 text-sm font-semibold text-charcoal leading-snug shadow-sm">
          {question}
        </div>
      )}
      {!body && !question && text && (
        <div className="bg-offwhite text-charcoal rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed">
          {text}
        </div>
      )}
      {content && renderContent && (
        <div className="mt-1">{renderContent(content, answers)}</div>
      )}
    </div>
  );
}

let messageId = 0;
const nextId = () => ++messageId;
const INFO_READ_DELAY = 1600;

export default function ChatBuilder({
  // Script mode (existing behaviour — used everywhere except onboarding in AI mode)
  script,
  onComplete,
  onCancel,
  renderContent,
  onStepChange,
  // AI mode — provide these to switch to real AI conversation
  onSend,              // (text, onToken, onEvent, onDone) => void
  initialMessage,      // string — pre-populated first agent bubble
  initialMessages,     // [{role, content}] — restore an existing conversation instead of firing __init__
  resumeGreeting,      // string — agent bubble appended after a restored conversation (e.g. "what would you like to change?")
  onMilestone,         // (event: {type, name, data}) => void
  onMessagesChange,    // (messages: [{role, content}]) => void — called whenever messages change
  onFileUploaded,      // (uploadResult) => void — called after a file is uploaded
}) {
  const isAIMode = !!onSend;

  // ── Shared state ────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [done, setDone] = useState(false);
  const listRef = useRef(null);
  const fileRef = useRef(null);

  // ── AI-mode state ────────────────────────────────────────────────────────────
  const [isStreaming, setIsStreaming] = useState(false);
  const streamIdRef = useRef(null);

  // ── Script-mode state ────────────────────────────────────────────────────────
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isTyping, setIsTyping] = useState(!isAIMode);

  const indexById = useMemo(() => {
    if (!script) return {};
    const map = {};
    script.forEach((s, i) => { if (s.id) map[s.id] = i; });
    return map;
  }, [script]);

  // ── Voice state ──────────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const recognitionRef = useRef(null);
  const initFiredRef = useRef(false);
  const voiceSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, isStreaming]);

  // ── Notify parent of message changes ────────────────────────────────────────
  useEffect(() => {
    if (!onMessagesChange || messages.length === 0) return;
    const exportable = messages
      .filter((m) => !m.streaming && m.text)
      .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));
    onMessagesChange(exportable);
  }, [messages]);

  // ══════════════════════════════════════════════════════════════════════════════
  // AI MODE
  // ══════════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!isAIMode) return;
    if (initFiredRef.current) return;
    initFiredRef.current = true;

    if (initialMessages?.length > 0) {
      // Returning to an in-progress conversation (e.g. Revise) — restore the
      // transcript. Re-firing __init__ here would make the AI replay the whole
      // flow and immediately re-propose the mission.
      const restored = initialMessages
        .filter((m) => m.role && m.content)
        .map((m) => ({ id: nextId(), sender: m.role === 'user' ? 'user' : 'agent', text: m.content }));
      if (resumeGreeting) {
        restored.push({ id: nextId(), sender: 'agent', text: resumeGreeting });
      }
      setMessages(restored);
    } else if (initialMessage) {
      setTimeout(() => {
        setMessages([{ id: nextId(), sender: 'agent', text: initialMessage }]);
      }, 400);
    } else {
      handleAISubmit('__init__', true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAISubmit(text, silent = false) {
    const value = text.trim();
    if (!value || isStreaming || done) return;

    setDraft('');

    if (!silent) {
      setMessages((prev) => [...prev, { id: nextId(), sender: 'user', text: value }]);
    }

    const streamId = nextId();
    streamIdRef.current = streamId;
    setMessages((prev) => [...prev, { id: streamId, sender: 'agent', text: '', streaming: true }]);
    setIsStreaming(true);

    onSend(
      value,
      // onToken — append to streaming bubble
      (token) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === streamId ? { ...m, text: m.text + token } : m)),
        );
      },
      // onEvent — forward milestone to parent
      (event) => {
        onMilestone?.(event);
        // complete_onboarding signals end of conversation
        if (event.name === 'complete_onboarding') {
          setDone(true);
        }
      },
      // onDone
      () => {
        setMessages((prev) =>
          prev.map((m) => (m.id === streamId ? { ...m, streaming: false } : m)),
        );
        setIsStreaming(false);
      },
    );
  }

  // ── File upload (AI mode) ────────────────────────────────────────────────────
  async function handleFiles(files) {
    const list = Array.from(files || []).filter(Boolean);
    if (!list.length || !isAIMode) return;
    // Process sequentially so each team member is extracted and stored in order.
    for (const file of list) {
      // eslint-disable-next-line no-await-in-loop
      await handleFile(file);
    }
  }

  async function handleFile(file) {
    if (!file || !isAIMode) return;

    setMessages((prev) => [...prev, { id: nextId(), sender: 'user', text: `📎 ${file.name}` }]);
    setIsStreaming(true);

    const tempId = nextId();
    setMessages((prev) => [...prev, { id: tempId, sender: 'agent', text: 'Reading your file…', streaming: true }]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/team-data', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Upload failed (${res.status})`);
      const { summary, people, roles } = data;

      onMilestone?.({ type: 'file_upload', name: 'file_upload', data: { summary, people, roles, person: data.person } });
      onFileUploaded?.({ summary, people, roles, person: data.person });
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, text: summary, streaming: false } : m)),
      );
    } catch (err) {
      const detail = err?.message && !/JSON|fetch/i.test(err.message) ? ` (${err.message})` : '';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, text: `I couldn't read that file${detail}. Try again or paste the info directly.`, streaming: false }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SCRIPT MODE (original behaviour — unchanged)
  // ══════════════════════════════════════════════════════════════════════════════

  function agentText(step, currentAnswers) {
    return typeof step.prompt === 'function' ? step.prompt(currentAnswers) : step.prompt;
  }

  function postAgentStep(index, currentAnswers) {
    const step = script[index];
    setStepIndex(index);
    onStepChange?.(step);
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        sender: 'agent',
        text: agentText(step, currentAnswers),
        content: step.content,
        answers: currentAnswers,
      },
    ]);
    setIsTyping(false);
    if (step.type === 'info') {
      setTimeout(() => advanceFrom(step, null, currentAnswers, undefined), step.delay ?? INFO_READ_DELAY);
    }
  }

  function resolveNextIndex(step, value, currentAnswers, override) {
    let target = override !== undefined ? override : step.next;
    if (typeof target === 'function') target = target(value, currentAnswers);
    if (typeof target === 'string') {
      return target in indexById ? indexById[target] : null;
    }
    const idx = script.indexOf(step);
    return idx + 1 < script.length ? idx + 1 : null;
  }

  function finish(finalAnswers, silent) {
    if (!silent) {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), sender: 'agent', text: 'Got it, thanks — analysing that now.' },
      ]);
    }
    setIsTyping(false);
    setDone(true);
    setTimeout(() => onComplete(finalAnswers), 700);
  }

  function advanceFrom(step, value, currentAnswers, override) {
    if (step.end) {
      finish(currentAnswers, step.type === 'info');
      return;
    }
    const nextIndex = resolveNextIndex(step, value, currentAnswers, override);
    setIsTyping(true);
    setTimeout(() => {
      if (nextIndex === null) {
        finish(currentAnswers, false);
      } else {
        postAgentStep(nextIndex, currentAnswers);
      }
    }, 700);
  }

  useEffect(() => {
    if (isAIMode || !script) return;
    const timer = setTimeout(() => postAgentStep(0, {}), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScriptSubmit() {
    const value = draft.trim();
    if (!value || isTyping || done) return;
    const step = script[stepIndex];
    const nextAnswers = { ...answers, [step.key]: value };
    setAnswers(nextAnswers);
    setMessages((prev) => [...prev, { id: nextId(), sender: 'user', text: value }]);
    setDraft('');
    advanceFrom(step, value, nextAnswers, undefined);
  }

  function handleChoice(option) {
    if (isTyping || done) return;
    const step = script[stepIndex];
    const nextAnswers = step.key ? { ...answers, [step.key]: option.value } : answers;
    setAnswers(nextAnswers);
    setMessages((prev) => [...prev, { id: nextId(), sender: 'user', text: option.label }]);
    advanceFrom(step, option.value, nextAnswers, option.next);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VOICE INPUT
  // ══════════════════════════════════════════════════════════════════════════════

  function handleVoice() {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if (!voiceSupported) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = true;       // keep listening until manually stopped
    rec.interimResults = true;   // show text in real-time as user speaks

    // Silence-based auto-stop: 3 seconds of no new speech → finish
    let silenceTimer = null;
    // Hard max: 3 minutes
    const maxTimer = setTimeout(() => rec.stop(), 3 * 60 * 1000);

    const resetSilenceTimer = () => {
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => rec.stop(), 3000);
    };

    let finalTranscript = '';

    rec.onresult = (e) => {
      resetSilenceTimer();
      finalTranscript = '';
      let interim = '';
      for (const result of e.results) {
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      // Show live text in input as the user speaks
      setDraft((finalTranscript + interim).trim());
    };

    rec.onend = async () => {
      clearTimeout(silenceTimer);
      clearTimeout(maxTimer);
      setIsRecording(false);

      const raw = finalTranscript.trim() || draft;
      if (!raw) return;

      setIsCorrecting(true);
      try {
        const context = messages.slice(-8).map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));
        const res = await fetch('/api/voice/correct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: raw, context }),
        });
        const { corrected } = await res.json();
        setDraft(corrected || raw);
      } catch {
        setDraft(raw);
      } finally {
        setIsCorrecting(false);
      }
    };

    rec.onerror = (e) => {
      if (e.error !== 'no-speech') {
        clearTimeout(silenceTimer);
        clearTimeout(maxTimer);
        setIsRecording(false);
        setIsCorrecting(false);
      }
    };

    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
    // Start the silence timer immediately so it stops if user never speaks
    resetSilenceTimer();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════

  const isInputBusy = isAIMode ? (isStreaming || isCorrecting) : (isTyping || isCorrecting);

  const currentStep = script && script[Math.min(stepIndex, script.length - 1)];
  const showTextInput = !done && (!currentStep || currentStep.type === undefined || currentStep.type === 'text' || isAIMode);
  const showChoices = !isAIMode && !done && !isTyping && currentStep?.type === 'choice';

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 mb-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex animate-panel-in ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.sender === 'user' ? (
              <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-maroon text-white rounded-br-sm">
                {m.text}
              </div>
            ) : (
              <AgentBubble
                text={m.text}
                streaming={m.streaming}
                content={m.content}
                answers={m.answers}
                renderContent={renderContent}
              />
            )}
          </div>
        ))}
        {((!isAIMode && isTyping) || (isAIMode && isStreaming && messages.at(-1)?.text === '')) && (
          <div className="flex justify-start">
            <TypingBubble />
          </div>
        )}
      </div>

      {showChoices && (
        <div className="shrink-0 flex flex-wrap gap-2 pt-3 border-t border-lightgrey/70">
          {currentStep.options.map((option) => (
            <button
              key={option.label}
              onClick={() => handleChoice(option)}
              className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-semibold bg-white text-maroon border border-maroon/25 transition-all duration-200 hover:bg-maroon/5 hover:border-maroon/40"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {showTextInput && (
        <div className="shrink-0 pt-3 border-t border-lightgrey/70">
          {(isRecording || isCorrecting) && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
              <span className="text-xs font-semibold text-red">
                {isCorrecting ? 'Processing…' : 'Recording — tap mic to finish'}
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length) {
                  if (isAIMode) {
                    handleFiles(files);
                  } else {
                    setDraft(
                      (prev) =>
                        prev +
                        (prev ? ' ' : '') +
                        files.map((f) => `[${f.name}]`).join(' '),
                    );
                  }
                }
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Attach one or more documents"
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-lightgrey text-charcoal/45 hover:text-maroon hover:border-maroon/40 transition-colors duration-200"
            >
              <PaperclipIcon width="16" height="16" />
            </button>
            <button
              type="button"
              onClick={handleVoice}
              disabled={isCorrecting}
              title={isRecording ? 'Stop recording' : 'Voice input'}
              className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border transition-colors duration-200 ${
                isRecording
                  ? 'border-red bg-red/10 text-red'
                  : 'border-lightgrey text-charcoal/45 hover:text-maroon hover:border-maroon/40'
              } disabled:opacity-40`}
            >
              <MicIcon width="16" height="16" />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  isAIMode ? handleAISubmit(draft) : handleScriptSubmit();
                }
              }}
              disabled={isInputBusy}
              placeholder={isRecording ? 'Listening…' : isCorrecting ? 'Correcting…' : (currentStep?.placeholder ?? 'Type a message…')}
              className="flex-1 bg-white border border-lightgrey rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:border-maroon disabled:opacity-50"
            />
            <PrimaryButton
              onClick={() => isAIMode ? handleAISubmit(draft) : handleScriptSubmit()}
              disabled={isInputBusy || !draft.trim()}
              className="shrink-0 !px-4 !py-3"
            >
              Send
            </PrimaryButton>
          </div>
        </div>
      )}

      {onCancel && !done && (
        <button
          onClick={onCancel}
          className="shrink-0 text-xs text-charcoal/40 hover:text-charcoal/70 mt-3 self-start"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
