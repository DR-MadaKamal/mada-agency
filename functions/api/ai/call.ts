function pickKey(keys: string): string {
  const list = keys.split(',').map(k => k.trim()).filter(Boolean);
  return list[Math.floor(Math.random() * list.length)] || keys;
}

interface Env {
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
}

interface IntegrationConfig {
  endpoint?: string;
  apiKeys?: string[];
  authType?: string;
  authHeaderName?: string;
  requestTemplate?: string;
  responsePath?: string;
}

interface AiPayload {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  history?: { role: string; content: string }[];
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'gemini': return 'gemini-2.0-flash';
    case 'openai': return 'gpt-4o';
    case 'anthropic': return 'claude-3-5-sonnet-20240620';
    default: return 'gemini-2.0-flash';
  }
}

async function callOpenAI(apiKey: string, modelId: string, payload: AiPayload): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId || 'gpt-4o',
      messages: [
        ...(payload.systemInstruction ? [{ role: 'system', content: payload.systemInstruction }] : []),
        ...(payload.history || []).map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: payload.prompt },
      ],
    }),
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'OpenAI call failed');
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic(apiKey: string, modelId: string, payload: AiPayload): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId || 'claude-3-5-sonnet-20240620',
      max_tokens: 4096,
      system: payload.systemInstruction,
      messages: [
        ...(payload.history || []).filter((h) => h.role !== 'system').map((h) => ({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.content,
        })),
        { role: 'user', content: payload.prompt },
      ],
    }),
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Anthropic call failed');
  return data.content?.[0]?.text || '';
}

async function callGemini(apiKey: string, modelId: string, payload: AiPayload): Promise<string> {
  const contents: any[] = [];
  if (payload.systemInstruction) {
    contents.push({ role: 'user', parts: [{ text: `System Instruction: ${payload.systemInstruction}` }] });
  }
  for (const h of payload.history || []) {
    contents.push({
      role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.content }],
    });
  }
  contents.push({ role: 'user', parts: [{ text: payload.prompt }] });

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId || 'gemini-2.0-flash'}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Gemini call failed');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function resolvePath(obj: any, path: string): string {
  return path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object') {
      const arrMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrMatch) return acc[arrMatch[1]]?.[parseInt(arrMatch[2])];
      return acc[part];
    }
    return null;
  }, obj) || '';
}

async function callCustom(config: IntegrationConfig, apiKey: string, modelId: string, payload: AiPayload): Promise<string> {
  const endpoint = config.endpoint || '';
  if (!endpoint) throw new Error('Custom integration endpoint is required');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authType = config.authType || 'header';
  const authHeaderName = config.authHeaderName || 'Authorization';
  if (apiKey) {
    if (authType === 'bearer') {
      headers[authHeaderName] = `Bearer ${apiKey}`;
    } else if (authType === 'api-key') {
      headers[authHeaderName] = apiKey;
    } else {
      headers[authHeaderName] = `Bearer ${apiKey}`;
    }
  }

  let body: any;
  const template = config.requestTemplate;
  if (template) {
    try {
      body = JSON.parse(template);
    } catch {
      body = { prompt: payload.prompt };
    }
    // Replace template placeholders
    const json = JSON.stringify(body);
    const filled = json
      .replace(/\{\{prompt\}\}/g, payload.prompt || '')
      .replace(/\{\{systemInstruction\}\}/g, payload.systemInstruction || '')
      .replace(/\{\{model\}\}/g, modelId || '');
    try { body = JSON.parse(filled); } catch { body = { prompt: payload.prompt }; }
  } else {
    body = { prompt: payload.prompt, model: modelId };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || data.error || 'Custom integration call failed');

  if (config.responsePath) {
    return resolvePath(data, config.responsePath);
  }
  return data.message || data.content || data.text || data.response || JSON.stringify(data);
}

export const onRequest: any = async (context: any) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { integrationId, payload, config } = await request.json() as {
      integrationId: string;
      payload: AiPayload;
      config?: IntegrationConfig;
    };

    let provider = '';
    let apiKey = '';
    let modelId = '';

    if (integrationId.startsWith('system_')) {
      provider = integrationId.replace('system_', '');
      const envKey = `${provider.toUpperCase()}_API_KEY`;
      const rawKey = (env as any)[envKey] || '';
      apiKey = rawKey.includes(',') ? pickKey(rawKey) : rawKey;
      modelId = payload.model || getDefaultModel(provider);
    } else if (config?.endpoint) {
      // Custom integration — use inline config
      provider = 'custom';
      const keys = config.apiKeys || [];
      apiKey = keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : '';
      modelId = payload.model || '';
    } else {
      return new Response(JSON.stringify({ error: 'Custom integrations not supported in proxy' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: `API Key for ${provider} not found` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let messageContent = '';

    if (provider === 'openai') {
      messageContent = await callOpenAI(apiKey, modelId, payload);
    } else if (provider === 'anthropic') {
      messageContent = await callAnthropic(apiKey, modelId, payload);
    } else if (provider === 'gemini' || provider === 'google') {
      messageContent = await callGemini(apiKey, modelId, payload);
    } else if (provider === 'custom' && config?.endpoint) {
      messageContent = await callCustom(config, apiKey, modelId, payload);
    } else {
      throw new Error(`Provider ${provider} not supported`);
    }

    return new Response(JSON.stringify({ message: messageContent, provider }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
