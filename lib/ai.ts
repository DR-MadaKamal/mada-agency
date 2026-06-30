import type { ExternalServiceConfig } from '../types';

interface AIOptions {
  provider?: AIOptionsProvider;
  modelId?: string;
  signal?: AbortSignal;
  onProgress?: (chunk: string) => void;
  fallbackProviders?: ('google' | 'openai' | 'anthropic' | 'deepseek' | 'groq' | 'openrouter' | 'mistral' | 'qwen')[];
  externalServiceConfig?: ExternalServiceConfig;
}

type AIOptionsProvider = 'google' | 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'groq' | 'openrouter' | 'mistral' | 'qwen' | 'custom' | 'external';

const PAGES_FUNCTION_URL = '/api/ai/proxy';
const PAGES_CALL_URL = '/api/ai/call';

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'google': case 'gemini': return 'gemini-2.5-flash';
    case 'openai': return 'gpt-4o';
    case 'anthropic': return 'claude-3-5-sonnet-20240620';
    case 'deepseek': return 'deepseek-chat';
    case 'groq': return 'llama-3.1-8b-instant';
    case 'openrouter': return 'openai/gpt-4o';
    case 'mistral': return 'mistral-large-latest';
    case 'qwen': return 'qwen-max';
    default: return 'gemini-2.5-flash';
  }
}

async function attemptCall(prompt: string, provider: string, modelId: string | undefined, signal?: AbortSignal, onProgress?: (chunk: string) => void, externalServiceConfig?: ExternalServiceConfig): Promise<string> {
  const url = provider === 'custom' ? PAGES_CALL_URL : PAGES_FUNCTION_URL;

  const body: Record<string, any> = {
    provider,
    modelId: modelId || getDefaultModel(provider),
    prompt,
  };

  if (provider === 'custom' && externalServiceConfig) {
    body.config = externalServiceConfig;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
  const { provider = 'google', modelId, signal, onProgress, fallbackProviders, externalServiceConfig } = options;
  const normalizedProvider = provider === 'gemini' ? 'google' : provider;

  if (normalizedProvider === 'custom' || normalizedProvider === 'external') {
    return await attemptCall(prompt, normalizedProvider === 'external' ? 'custom' : normalizedProvider, modelId, signal, onProgress, externalServiceConfig);
  }

  const providers: string[] = [normalizedProvider, ...(fallbackProviders || [])];
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
    call: async (prompt: string, options?: Omit<AIOptions, 'signal'>) => {
      try {
        return await callAI(prompt, { ...options, signal: controller.signal });
      } finally {
        controllers.delete(key);
      }
    },
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
