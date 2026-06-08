import { useState, useCallback, useRef } from 'react';

interface VersionEntry {
  id: string;
  timestamp: number;
  label: string;
  snapshot: any;
}

export function useVersionHistory<T>(initial: T, maxVersions = 50) {
  const [past, setPast] = useState<VersionEntry[]>([]);
  const [future, setFuture] = useState<VersionEntry[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const idCounter = useRef(0);

  const pushVersion = useCallback((snapshot: T, label?: string) => {
    idCounter.current += 1;
    const entry: VersionEntry = {
      id: `v${idCounter.current}_${Date.now()}`,
      timestamp: Date.now(),
      label: label || `Version ${idCounter.current}`,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
    };
    setPast(prev => {
      const next = [...prev, entry];
      return next.length > maxVersions ? next.slice(next.length - maxVersions) : next;
    });
    setFuture([]);
    setCurrentVersionId(entry.id);
  }, [maxVersions]);

  const undo = useCallback(() => {
    setPast(prev => {
      if (prev.length < 2) return prev;
      const current = prev[prev.length - 1];
      const previous = prev[prev.length - 2];
      setFuture(f => [...f, current]);
      setCurrentVersionId(previous.id);
      return prev.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture(prev => {
      if (prev.length === 0) return prev;
      const next = prev[prev.length - 1];
      setPast(p => [...p, next]);
      setCurrentVersionId(next.id);
      return prev.slice(0, -1);
    });
  }, []);

  const restoreVersion = useCallback((version: VersionEntry, applyFn: (snapshot: T) => void) => {
    applyFn(version.snapshot as T);
    setCurrentVersionId(version.id);
  }, []);

  return {
    versions: past,
    currentVersionId,
    canUndo: past.length > 1,
    canRedo: future.length > 0,
    pushVersion,
    undo,
    redo,
    restoreVersion,
    futureCount: future.length,
  };
}
