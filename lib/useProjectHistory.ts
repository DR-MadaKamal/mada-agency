import { useState, useCallback, useRef, useEffect } from 'react';

interface HistorySnapshot<T> {
  id: string;
  timestamp: number;
  label: string;
  data: T;
}

interface UseProjectHistoryOptions {
  maxSnapshots?: number;
  storageKey?: string;
  label?: string;
}

export function useProjectHistory<T extends Record<string, any>>(
  projectState: T,
  setProjectState: (state: T | ((prev: T) => T)) => void,
  options: UseProjectHistoryOptions = {},
) {
  const { maxSnapshots = 50, storageKey, label: defaultLabel } = options;
  const [past, setPast] = useState<HistorySnapshot<T>[]>([]);
  const [future, setFuture] = useState<HistorySnapshot<T>[]>([]);
  const [currentLabel, setCurrentLabel] = useState<string>(defaultLabel || 'Initial');
  const idCounter = useRef(0);
  const lastPushed = useRef<string>('');
  const initialized = useRef(false);

  // Load persisted history on mount
  useEffect(() => {
    if (!storageKey || initialized.current) return;
    try {
      const raw = localStorage.getItem(`history_${storageKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.past) setPast(parsed.past.slice(-maxSnapshots));
        if (parsed.future) setFuture(parsed.future);
      }
    } catch { /* ignore */ }
    initialized.current = true;
  }, [storageKey, maxSnapshots]);

  // Persist history to localStorage
  useEffect(() => {
    if (!storageKey || !initialized.current) return;
    try {
      localStorage.setItem(`history_${storageKey}`, JSON.stringify({
        past: past.slice(-maxSnapshots),
        future,
      }));
    } catch { /* storage full */ }
  }, [past, future, storageKey, maxSnapshots]);

  const pushSnapshot = useCallback((label?: string) => {
    const key = JSON.stringify(projectState);
    if (key === lastPushed.current) return;
    lastPushed.current = key;

    idCounter.current += 1;
    const snapshot: HistorySnapshot<T> = {
      id: `h_${Date.now()}_${idCounter.current}`,
      timestamp: Date.now(),
      label: label || `v${idCounter.current}`,
      data: JSON.parse(JSON.stringify(projectState)),
    };
    setPast(prev => [...prev.slice(-(maxSnapshots - 1)), snapshot]);
    setFuture([]);
    setCurrentLabel(snapshot.label);
  }, [projectState, maxSnapshots]);

  const undo = useCallback(() => {
    setPast(prev => {
      if (prev.length < 2) return prev;
      const current = prev[prev.length - 1];
      const previous = prev[prev.length - 2];
      setFuture(f => [current, ...f]);
      setCurrentLabel(previous.label);
      setProjectState(JSON.parse(JSON.stringify(previous.data)));
      lastPushed.current = JSON.stringify(previous.data);
      return prev.slice(0, -1);
    });
  }, [setProjectState]);

  const redo = useCallback(() => {
    setFuture(prev => {
      if (prev.length === 0) return prev;
      const next = prev[0];
      setPast(p => [...p, next]);
      setCurrentLabel(next.label);
      setProjectState(JSON.parse(JSON.stringify(next.data)));
      lastPushed.current = JSON.stringify(next.data);
      return prev.slice(1);
    });
  }, [setProjectState]);

  const jumpTo = useCallback((index: number) => {
    setPast(prev => {
      if (index < 0 || index >= prev.length) return prev;
      const target = prev[index];
      if (index < prev.length - 1) {
        const newFuture = prev.slice(index + 1).reverse();
        setFuture(f => [...newFuture, ...f]);
      }
      setProjectState(JSON.parse(JSON.stringify(target.data)));
      setCurrentLabel(target.label);
      lastPushed.current = JSON.stringify(target.data);
      return prev.slice(0, index + 1);
    });
  }, [setProjectState]);

  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
    setCurrentLabel(defaultLabel || 'Initial');
    lastPushed.current = '';
  }, [defaultLabel]);

  const getHistory = useCallback(() => {
    return past.map((s, i) => ({
      id: s.id,
      label: s.label,
      timestamp: s.timestamp,
      isCurrent: i === past.length - 1,
    }));
  }, [past]);

  return {
    pushSnapshot,
    undo,
    redo,
    jumpTo,
    clear,
    getHistory,
    canUndo: past.length > 1,
    canRedo: future.length > 0,
    pastCount: past.length,
    futureCount: future.length,
    currentLabel,
    allSnapshots: past,
  };
}
