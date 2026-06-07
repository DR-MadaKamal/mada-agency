interface Env {
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
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

export const onRequest: any = async (context: any) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { integrationId, payload } = await request.json() as {
      integrationId: string;
      payload: AiPayload;
    };

    let provider = '';
    let apiKey = '';
    let modelId = '';

    if (integrationId.startsWith('system_')) {
      provider = integrationId.replace('system_', '');
      const envKey = `${provider.toUpperCase()}_API_KEY`;
      apiKey = (env as any)[envKey] || '';
      modelId = payload.model || getDefaultModel(provider);
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
