import { EngineResponse } from '../types';
import { SYSTEM_PROMPT } from '../prompts/systemPrompts';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

let apiKey: string | null = null;

export function setApiKey(key: string): void {
  apiKey = key;
}

export function getApiKey(): string | null {
  return apiKey;
}

function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

export async function callDeepSeek(userPrompt: string): Promise<EngineResponse> {
  if (!apiKey) {
    throw new Error('API Key 未设置，请在首页输入 DeepSeek API Key');
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    let errMsg = `API 错误 ${response.status}`;
    try {
      const errJson = JSON.parse(errBody);
      errMsg = errJson.error?.message || errMsg;
    } catch {
      // use raw text
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error('API 返回内容为空');
  }

  const cleaned = cleanJsonOutput(rawContent);

  let parsed: EngineResponse;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`JSON 解析失败。原始返回: ${rawContent.slice(0, 200)}`);
  }

  if (!parsed.type || !['question', 'score', 'recommend', 'error'].includes(parsed.type)) {
    throw new Error(`无效的响应类型: ${(parsed as unknown as Record<string, unknown>).type}`);
  }

  return parsed;
}

export async function generateQuestion(userPrompt: string): Promise<EngineResponse> {
  return callDeepSeek(userPrompt);
}

export async function scoreAnswer(userPrompt: string): Promise<EngineResponse> {
  return callDeepSeek(userPrompt);
}

export async function getRecommendations(userPrompt: string): Promise<EngineResponse> {
  return callDeepSeek(userPrompt);
}
