import { useState, useCallback, useRef } from 'react';

interface HistoryEntry<T> {
  past: T[];
  future: T[];
}

export function useHistory<T>(initial: T) {
  const [state, setState] = useState<T>(initial);
  const history = useRef<HistoryEntry<T>>({ past: [], future: [] });
  const maxHistory = 50;

  const push = useCallback((next: T) => {
    history.current.past.push(state);
    if (history.current.past.length > maxHistory) {
      history.current.past.shift();
    }
    history.current.future = [];
    setState(next);
  }, [state]);

  const undo = useCallback(() => {
    const prev = history.current.past.pop();
    if (!prev) return;
    history.current.future.push(state);
    setState(prev);
  }, [state]);

  const redo = useCallback(() => {
    const next = history.current.future.pop();
    if (!next) return;
    history.current.past.push(state);
    setState(next);
  }, [state]);

  const reset = useCallback((newState: T) => {
    history.current = { past: [], future: [] };
    setState(newState);
  }, []);

  const canUndo = history.current.past.length > 0;
  const canRedo = history.current.future.length > 0;

  return { state, setState: push, undo, redo, reset, canUndo, canRedo };
}