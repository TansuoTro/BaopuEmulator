import { Handler } from '@netlify/functions';

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const { api_key, prompt, system_prompt } = JSON.parse(event.body || '{}');
    if (!api_key) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing api_key' }) };

    const res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api_key}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: system_prompt || '你是一个严格的教育测评引擎，只输出JSON。' },
          { role: 'user', content: prompt || '{"task":"echo"}' },
        ],
        temperature: 0.7, max_tokens: 4096, stream: false,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: res.status, headers, body: JSON.stringify({ error: `DeepSeek: ${err.slice(0,300)}` }) };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    return { statusCode: 200, headers, body: JSON.stringify({ content }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: (e as Error).message }) };
  }
};
