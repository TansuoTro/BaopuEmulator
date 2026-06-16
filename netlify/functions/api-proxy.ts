import { Handler } from '@netlify/functions';

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const MAX_RETRIES = 2;

function cleanJson(raw: string): string {
  let c = raw.trim();
  if (c.startsWith('```json')) c = c.slice(7);
  else if (c.startsWith('```')) c = c.slice(3);
  if (c.endsWith('```')) c = c.slice(0, -3);
  c = c.trim();
  for (const ch of ['{', '[']) {
    const a = c.indexOf(ch), b = c.lastIndexOf(ch === '{' ? '}' : ']');
    if (a !== -1 && b !== -1 && b > a) { c = c.slice(a, b + 1); break; }
  }
  return c;
}

function log(level: string, msg: string, data?: unknown) {
  const ts = new Date().toISOString();
  console.log(JSON.stringify({ ts, level, msg, ...(data ? { data } : {}) }));
}

async function callDeepSeek(apiKey: string, systemPrompt: string, userPrompt: string, attempt = 1): Promise<{ content: string; raw: unknown }> {
  log('info', `DeepSeek call attempt ${attempt}`);
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt || '你是一个严格的认知测评引擎。只输出JSON。不评价观点对错，只分析思维结构。' },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7, max_tokens: 4096, stream: false,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    log('error', `DeepSeek HTTP ${res.status}`, err.slice(0, 300));
    throw new Error(`DeepSeek ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error('Empty response from DeepSeek');

  // JSON validation
  const cleaned = cleanJson(rawContent);
  try {
    const parsed = JSON.parse(cleaned);
    log('info', `DeepSeek JSON OK`, { type: parsed.type || 'unknown', keys: Object.keys(parsed).join(',') });
    return { content: cleaned, raw: parsed };
  } catch (e) {
    log('warn', `JSON parse failed attempt ${attempt}`, rawContent.slice(0, 200));
    if (attempt < MAX_RETRIES) {
      return callDeepSeek(apiKey, systemPrompt, userPrompt + '\n\n上一个回答的JSON格式不对，请严格输出合法JSON，不要有任何额外文字。', attempt + 1);
    }
    throw new Error(`JSON parse failed after ${MAX_RETRIES} retries`);
  }
}

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  const start = Date.now();
  try {
    const { api_key, prompt, system_prompt } = JSON.parse(event.body || '{}');
    if (!api_key) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing api_key' }) };

    const result = await callDeepSeek(api_key, system_prompt || '', prompt || '{"task":"echo"}');
    log('info', `Request OK`, { duration_ms: Date.now() - start });

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ content: result.content, duration_ms: Date.now() - start }),
    };
  } catch (e) {
    log('error', 'Request failed', (e as Error).message);
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: (e as Error).message, duration_ms: Date.now() - start }),
    };
  }
};
