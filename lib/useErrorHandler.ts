import { useCallback, useRef, useState } from 'react';
import { useToast } from './useToast';
import { ErrorService } from './errorService';
import type { ErrorSeverity } from './errorService';

interface AsyncOptions {
  severity?: ErrorSeverity;
  context?: Record<string, any>;
  toastTitle?: string;
  rethrow?: boolean;
  onError?: (err: any) => void;
}

export function useErrorHandler(source: string) {
  const { toast } = useToast();
  const [lastError, setLastError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const wrap = useCallback(async <T>(
    fn: () => Promise<T>,
    options: AsyncOptions = {},
  ): Promise<T | null> => {
    try {
      setLastError(null);
      return await fn();
    } catch (err: any) {
      if (!mountedRef.current) return null;
      const { severity = 'medium', context, toastTitle, rethrow = false, onError } = options;
      ErrorService.log(err, severity, { source, ...context });
      setLastError(err?.message || 'Operation failed');
      onError?.(err);
      toast({
        type: severity === 'critical' || severity === 'high' ? 'error' : 'warning',
        title: toastTitle || 'Operation Failed',
        message: err?.message || 'An unexpected error occurred',
      });
      if (rethrow) throw err;
      return null;
    }
  }, [source, toast]);

  const clearError = useCallback(() => setLastError(null), []);

  return { wrap, lastError, clearError };
}
