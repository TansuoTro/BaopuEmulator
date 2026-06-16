import { SYSTEM_PROMPT } from '../prompts/systemPrompts';

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

function cleanJson(raw: string): string {
  let c = raw.trim();
  if (c.startsWith('```json')) c = c.slice(7);
  else if (c.startsWith('```')) c = c.slice(3);
  if (c.endsWith('```')) c = c.slice(0, -3);
  c = c.trim();

  const firstBrace = c.indexOf('{');
  const lastBrace = c.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    c = c.slice(firstBrace, lastBrace + 1);
    return c;
  }

  const firstBracket = c.indexOf('[');
  const lastBracket = c.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    c = c.slice(firstBracket, lastBracket + 1);
    return c;
  }

  return c;
}

export async function callDeepSeek(
  apiKey: string,
  userPrompt: string,
  useJsonMode = true,
): Promise<unknown> {
  const body: Record<string, unknown> = {
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    stream: false,
  };

  if (useJsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    let msg = `API ${res.status}`;
    try { msg = JSON.parse(txt).error?.message || msg; } catch { /* raw */ }
    throw new Error(msg);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('API返回为空');

  return JSON.parse(cleanJson(raw));
}

export async function getDynamicQuestions(
  apiKey: string,
  prompt: string,
): Promise<unknown> {
  return callDeepSeek(apiKey, prompt, true);
}

export async function scoreDynamicAnswer(
  apiKey: string,
  prompt: string,
): Promise<unknown> {
  return callDeepSeek(apiKey, prompt, true);
}

export async function extractOpenTags(
  apiKey: string,
  prompt: string,
): Promise<unknown> {
  return callDeepSeek(apiKey, prompt, true);
}

export async function getRecommendResult(
  apiKey: string,
  prompt: string,
): Promise<unknown> {
  return callDeepSeek(apiKey, prompt, true);
}
