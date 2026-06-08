interface AIOptions {
  provider?: 'google' | 'openai' | 'anthropic';
  modelId?: string;
  signal?: AbortSignal;
  onProgress?: (chunk: string) => void;
  fallbackProviders?: ('google' | 'openai' | 'anthropic')[];
}

const PAGES_FUNCTION_URL = '/api/ai/proxy';

const PROVIDER_PRIORITY: Record<string, string[]> = {
  google: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-20240620', 'claude-3-haiku-20240307'],
};

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'google': case 'gemini': return 'gemini-2.5-flash';
    case 'openai': return 'gpt-4o';
    case 'anthropic': return 'claude-3-5-sonnet-20240620';
    default: return 'gemini-2.5-flash';
  }
}

async function attemptCall(prompt: string, provider: string, modelId: string | undefined, signal?: AbortSignal, onProgress?: (chunk: string) => void): Promise<string> {
  const res = await fetch(PAGES_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      modelId: modelId || getDefaultModel(provider),
      prompt,
    }),
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
}

export async function callAI(prompt: string, options: AIOptions = {}): Promise<string> {
  const { provider = 'google', modelId, signal, onProgress, fallbackProviders } = options;

  const providers: string[] = [provider, ...(fallbackProviders || [])];
  const seen = new Set<string>();
  const uniqueProviders = providers.filter(p => {
    const key = p.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let lastError: Error | null = null;

  for (const p of uniqueProviders) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      return await attemptCall(prompt, p, p === provider ? modelId : undefined, signal, onProgress);
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      lastError = err;
      if (uniqueProviders.length > 1) {
        console.warn(`[callAI] Provider ${p} failed, falling back:`, err.message);
      }
    }
  }

  throw lastError || new Error('All AI providers failed');
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

export { getDefaultModel };
export type { AIOptions };
