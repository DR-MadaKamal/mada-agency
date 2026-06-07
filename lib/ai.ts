interface AIOptions {
  provider?: 'google' | 'openai' | 'anthropic';
  modelId?: string;
  signal?: AbortSignal;
  onProgress?: (chunk: string) => void;
}

const PAGES_FUNCTION_URL = '/api/ai/proxy';

export async function callAI(prompt: string, options: AIOptions = {}): Promise<string> {
  const { provider = 'google', modelId, signal, onProgress } = options;

  try {
    const res = await fetch(PAGES_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, modelId: modelId || getDefaultModel(provider), prompt }),
      signal,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      throw new Error(`AI call failed (${res.status}): ${err}`);
    }

    if (onProgress && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        onProgress(chunk);
      }

      return result;
    }

    return await res.text();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    throw err;
  }
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'google': case 'gemini': return 'gemini-2.0-flash';
    case 'openai': return 'gpt-4o';
    case 'anthropic': return 'claude-3-5-sonnet-20240620';
    default: return 'gemini-2.0-flash';
  }
}

const controllers = new Map<string, AbortController>();

export function createAICall(key: string) {
  const existing = controllers.get(key);
  if (existing) existing.abort();

  const controller = new AbortController();
  controllers.set(key, controller);

  return {
    signal: controller.signal,
    cancel: () => {
      controller.abort();
      controllers.delete(key);
    },
    call: (prompt: string, options?: Omit<AIOptions, 'signal'>) =>
      callAI(prompt, { ...options, signal: controller.signal }),
  };
}

export function cancelAICall(key: string) {
  const controller = controllers.get(key);
  if (controller) {
    controller.abort();
    controllers.delete(key);
  }
}