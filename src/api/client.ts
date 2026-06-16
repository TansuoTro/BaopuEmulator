const BASE = '/.netlify/functions/api-proxy';

function cleanJson(raw: string): string {
  let c = raw.trim();
  if (c.startsWith('```json')) c = c.slice(7);
  else if (c.startsWith('```')) c = c.slice(3);
  if (c.endsWith('```')) c = c.slice(0,-3);
  c = c.trim();
  for (const ch of ['{','[']) {
    const a = c.indexOf(ch);
    const b = c.lastIndexOf(ch==='{'?'}':']');
    if (a!==-1 && b!==-1 && b>a) { c = c.slice(a,b+1); break; }
  }
  return c;
}

async function callFunction(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt.slice(0,200)}`);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || data.content;
  if (!raw) return data;
  if (typeof raw === 'string' && (raw.startsWith('{') || raw.startsWith('['))) {
    return JSON.parse(cleanJson(raw));
  }
  return raw;
}

export async function apiStart(apiKey: string) {
  return callFunction('/start', { api_key: apiKey });
}

export async function apiGetDynamic(apiKey: string, prompt: string) {
  return callFunction('/dynamic', { api_key: apiKey, prompt });
}

export async function apiScoreDynamic(apiKey: string, prompt: string) {
  return callFunction('/score', { api_key: apiKey, prompt });
}

export async function apiExtractTags(apiKey: string, prompt: string) {
  return callFunction('/open', { api_key: apiKey, prompt });
}

export async function apiRecommend(apiKey: string, prompt: string) {
  return callFunction('/recommend', { api_key: apiKey, prompt });
}

export async function apiSession(action: string, data?: unknown) {
  return callFunction('/session', { action, data });
}
