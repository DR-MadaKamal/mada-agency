interface Env {
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
}

interface ProxyPayload {
  provider: 'gemini' | 'openai' | 'anthropic';
  modelId: string;
  body: any;
}

const PROVIDER_URLS: Record<string, (model: string) => string> = {
  gemini: (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  openai: () => 'https://api.openai.com/v1/chat/completions',
  anthropic: () => 'https://api.anthropic.com/v1/messages',
};

const PROVIDER_HEADERS: Record<string, (key: string) => Record<string, string>> = {
  gemini: (key) => ({ 'Content-Type': 'application/json', 'x-goog-api-key': key }),
  openai: (key) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }),
  anthropic: (key) => ({
    'Content-Type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
  }),
};

export const onRequest: any = async (context: any) => {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const { provider, modelId, body } = await request.json() as ProxyPayload;
    const envKey = `${provider.toUpperCase()}_API_KEY`;
    const apiKey = (env as any)[envKey] as string | undefined;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: `API Key for ${provider} not found` }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = PROVIDER_URLS[provider]?.(modelId);
    if (!url) {
      return new Response(JSON.stringify({ error: `Provider ${provider} not supported` }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const headers = PROVIDER_HEADERS[provider]?.(apiKey) || {};
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || `${provider} call failed` }), {
        status: res.status, headers: { 'Content-Type': 'application/json' },
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
