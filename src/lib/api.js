const API_BASE = ''; // Vite proxy forwards /api → http://localhost:8000

/**
 * Fetch wrapper with retry + error handling.
 */
export async function apiFetch(path, options = {}, retries = 2) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      if (!res.ok) {
        let serverMsg = '';
        try { serverMsg = (await res.json())?.error || ''; } catch { /* ignore */ }
        const err = new Error(serverMsg || `HTTP ${res.status}`);
        err.status = res.status;
        // 4xx (incl. 429 rate limit) will fail again — don't hammer the server
        err.noRetry = res.status >= 400 && res.status < 500;
        throw err;
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (err.noRetry || attempt >= retries - 1) break;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

/**
 * SSE streaming fetch.
 */
export async function apiStream(path, body, onChunk, onDone, onError) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') {
          onDone?.();
          return;
        }
        try {
          onChunk(JSON.parse(raw));
        } catch {
          // skip malformed lines
        }
      }
    }

    onDone?.();
  } catch (err) {
    onError?.(err);
    onDone?.();
  }
}

/**
 * Run an auto-generated workflow stage (team-mapping through future-planning).
 * Returns the stage result object or throws on failure.
 */
export async function runWorkflowStage(stage, workflowData) {
  // Send the analysis state only. The chat transcripts grow unboundedly and
  // would crowd out the roster and prior stage results in the model's context —
  // the one thing every stage after Team Collection has to see in full.
  const { chatHistory: _c, teamChatHistory: _t, ...analysisState } = workflowData ?? {};
  return apiFetch('/api/workflow/run-stage', {
    method: 'POST',
    body: JSON.stringify({ stage, workflowData: analysisState }),
  });
}

export async function analyseRole(title, responsibilities, missionStatement) {
  return apiFetch('/api/analysis/role', {
    method: 'POST',
    body: JSON.stringify({ title, responsibilities, missionStatement }),
  });
}

export async function generateJobDescription(role, missionStatement) {
  return apiFetch('/api/job-descriptions/generate', {
    method: 'POST',
    body: JSON.stringify({ role, missionStatement }),
  });
}

export async function simulateWhatIf(scenario, role, teamContext, missionStatement) {
  return apiFetch('/api/whatif/simulate', {
    method: 'POST',
    body: JSON.stringify({ scenario, role, teamContext, missionStatement }),
  });
}

export async function generateFutureSkills(missionStatement, roles) {
  return apiFetch('/api/future-skills/generate', {
    method: 'POST',
    body: JSON.stringify({
      missionStatement,
      roles: roles.map((r) => ({ title: r.name })),
    }),
  });
}
