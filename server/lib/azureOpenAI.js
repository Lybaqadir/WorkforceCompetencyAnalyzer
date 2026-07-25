const { AzureOpenAI } = require('openai');

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
  maxRetries: 0,
});

const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;

/**
 * Stream a chat completion.
 * Calls onToken for each text delta, onToolCall for each completed tool call.
 * Returns { text, toolCalls, finishReason }.
 */
async function chatStream(messages, tools, onToken, onToolCall, maxTokens = 180, toolChoice) {
  const params = {
    model: DEPLOYMENT,
    messages,
    stream: true,
    max_tokens: maxTokens,
  };
  if (tools && tools.length) {
    params.tools = tools;
    params.tool_choice = toolChoice || 'auto';
  }

  const stream = await client.chat.completions.create(params);

  let text = '';
  const toolBuf = {};
  let finishReason = null;

  for await (const chunk of stream) {
    const choice = chunk.choices[0];
    if (!choice) continue;
    finishReason = choice.finish_reason || finishReason;
    const delta = choice.delta;

    if (delta.content) {
      text += delta.content;
      onToken && onToken(delta.content);
    }

    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        if (!toolBuf[tc.index]) toolBuf[tc.index] = { id: '', name: '', args: '' };
        if (tc.id) toolBuf[tc.index].id += tc.id;
        if (tc.function?.name) toolBuf[tc.index].name += tc.function.name;
        if (tc.function?.arguments) toolBuf[tc.index].args += tc.function.arguments;
      }
    }
  }

  const dropped = [];
  const toolCalls = Object.values(toolBuf).map((tc) => {
    try {
      return { id: tc.id, name: tc.name, parsed: JSON.parse(tc.args), raw: tc.args };
    } catch {
      console.error(`Dropped malformed tool call "${tc.name}" (finish_reason=${finishReason}, ${tc.args.length} chars of args): ${tc.args.slice(0, 200)}...`);
      dropped.push({ id: tc.id, name: tc.name });
      return null;
    }
  }).filter(Boolean);

  for (const tc of toolCalls) {
    onToolCall && onToolCall(tc);
  }

  return { text, toolCalls, finishReason, dropped };
}

/**
 * Single non-streaming chat call — returns the text content.
 */
async function chat(messages, maxTokens = 200) {
  const res = await client.chat.completions.create({
    model: DEPLOYMENT,
    messages,
    max_tokens: maxTokens,
  });
  return res.choices[0].message.content || '';
}

/**
 * JSON-mode completion — returns parsed object or null on failure.
 *
 * The dominant failure is truncation: the model hits max_tokens mid-object and
 * the partial JSON cannot parse. Rather than throwing that work away, retry once
 * telling the model to be more concise, since a shorter answer is far more
 * useful to the user than an error screen.
 */
async function chatJson(messages, maxTokens = 2000, _isRetry = false) {
  const res = await client.chat.completions.create({
    model: DEPLOYMENT,
    messages,
    response_format: { type: 'json_object' },
    max_tokens: maxTokens,
  });

  const choice = res.choices[0];
  const content = choice?.message?.content || '';
  try {
    return JSON.parse(content);
  } catch {
    const truncated = choice?.finish_reason === 'length';
    console.error(
      `chatJson parse failed (finish_reason=${choice?.finish_reason}, ${content.length} chars).`
      + (truncated ? ' Output was truncated at max_tokens.' : ` Head: ${content.slice(0, 200)}`)
    );

    if (truncated && !_isRetry) {
      // Attack truncation from both sides: tell the model to be briefer AND
      // give it more room, since a borderline budget would just truncate again.
      const roomier = Math.min(Math.round(maxTokens * 1.5), 8000);
      console.warn(`Retrying with a brevity instruction and a larger budget (${maxTokens} -> ${roomier}).`);
      return chatJson(
        [
          ...messages,
          {
            role: 'user',
            content: 'Your previous response was cut off before the JSON closed. Return the SAME structure again, but significantly more concise so it fits: keep only the most important items in each array (at most 8 per array) and keep every string to one short sentence. The JSON must be complete and valid.',
          },
        ],
        roomier,
        true,
      );
    }
    return null;
  }
}

module.exports = { client, chatStream, chat, chatJson, DEPLOYMENT };
