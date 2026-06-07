import { useState, useRef, useCallback } from 'react';
import { callAI } from './ai';

interface UseAICallOptions {
  key: string;
}

export function useAICall(opts: UseAICallOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (
    prompt: string,
    onResult?: (text: string) => void,
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setProgress('');

    try {
      const result = await callAI(prompt, {
        signal: controller.signal,
        onProgress: (chunk) => setProgress(p => p + chunk),
      });
      onResult?.(result);
      return result;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'AI call failed');
      }
      return null;
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  return { execute, cancel, isLoading, progress, error };
}