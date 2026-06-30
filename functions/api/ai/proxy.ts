function pickKey(keys: string): string {
  const list = keys.split(',').map(k => k.trim()).filter(Boolean);
  return list[Math.floor(Math.random() * list.length)] || keys;
}

interface Env {
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  MISTRAL_API_KEY?: string;
}

interface ProxyPayload {
  provider: 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'groq' | 'openrouter' | 'mistral';
  modelId: string;
  body?: any;
  prompt?: string;
  systemInstruction?: string;
  accessToken?: string;
}

const PROVIDER_URLS: Record<string, (model: string) => string> = {
  gemini: (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  openai: () => 'https://api.openai.com/v1/chat/completions',
  anthropic: () => 'https://api.anthropic.com/v1/messages',
  deepseek: () => 'https://api.deepseek.com/chat/completions',
  groq: () => 'https://api.groq.com/openai/v1/chat/completions',
  openrouter: () => 'https://openrouter.ai/api/v1/chat/completions',
  mistral: () => 'https://api.mistral.ai/v1/chat/completions',
};

const PROVIDER_HEADERS: Record<string, (key: string, accessToken?: string) => Record<string, string>> = {
  gemini: (key, accessToken) => {
    if (accessToken) return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` };
    const oauthPrefixes = ['ya29.', 'YA29.', 'AQ.', 'aq.'];
    if (oauthPrefixes.some(p => key.startsWith(p))) {
      return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };
    }
    return { 'Content-Type': 'application/json', 'x-goog-api-key': key };
  },
  openai: (key) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }),
  anthropic: (key) => ({
    'Content-Type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
  }),
  deepseek: (key) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }),
  groq: (key) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }),
  openrouter: (key) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }),
  mistral: (key) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }),
};

function buildBody(provider: string, modelId: string, prompt: string): any {
  switch (provider) {
    case 'gemini':
      return { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
    case 'openai':
    case 'deepseek':
    case 'groq':
    case 'openrouter':
    case 'mistral':
      return { model: modelId, messages: [{ role: 'user', content: prompt }] };
    case 'anthropic':
      return { model: modelId, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] };
    default:
      return { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  }
}

function extractText(provider: string, data: any): string {
  switch (provider) {
    case 'gemini':
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    case 'openai':
    case 'deepseek':
    case 'groq':
    case 'openrouter':
    case 'mistral':
      return data.choices?.[0]?.message?.content || '';
    case 'anthropic':
      return data.content?.[0]?.text || '';
    default:
      return JSON.stringify(data);
  }
}

export const onRequest: any = async (context: any) => {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const parsed = await request.json() as ProxyPayload;
    const { provider, modelId } = parsed;
    const normalizedProvider = provider === 'google' ? 'gemini' : provider;
    const envKey = `${normalizedProvider.toUpperCase()}_API_KEY`;
    const rawKey = (env as any)[envKey] as string | undefined;
    if (!rawKey) {
      return new Response(JSON.stringify({ error: `API Key for ${normalizedProvider} not found` }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    const apiKey = pickKey(rawKey);

    const url = PROVIDER_URLS[normalizedProvider]?.(modelId);
    if (!url) {
      return new Response(JSON.stringify({ error: `Provider ${normalizedProvider} not supported` }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const isSimpleMode = !!(parsed.prompt);
    const body = parsed.body || buildBody(normalizedProvider, modelId, parsed.prompt || '');
    const headers = PROVIDER_HEADERS[normalizedProvider]?.(apiKey, parsed.accessToken) || {};
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || `${normalizedProvider} call failed` }), {
        status: res.status, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (isSimpleMode) {
      const text = extractText(normalizedProvider, data);
      return new Response(text, {
        status: 200, headers: { 'Content-Type': 'text/plain' },
      });
    }
    return new Response(JSON.stringify(data), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
