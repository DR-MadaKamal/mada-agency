import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_PREFIX = 'mada_projects_';
const SAVE_DEBOUNCE = 2000;

interface StudioState<T> {
  projects: T[];
  activeIndex: number;
}

export function useStudioState<T extends { id: string; studioType: string }>(
  storageKey: string,
  createInitial: (count: number, ownerId: string) => T,
  currentUser: { uid: string } | null,
): {
  projects: T[];
  activeIndex: number;
  setProjects: React.Dispatch<React.SetStateAction<T[]>>;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  updateProject: (action: React.SetStateAction<T>) => void;
  addTab: () => void;
  closeTab: (index: number) => void;
} {
  const [projects, setProjects] = useState<T[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const loaded = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`);
      if (raw) {
        const saved: StudioState<T> = JSON.parse(raw);
        if (saved.projects?.length > 0) {
          setProjects(saved.projects);
          setActiveIndex(saved.activeIndex);
          loaded.current = true;
          return;
        }
      }
    } catch { /* ignore corrupt data */ }
    loaded.current = true;
  }, [storageKey]);

  // Initialize if empty after load attempt
  useEffect(() => {
    if (!loaded.current || !currentUser) return;
    if (projects.length === 0) {
      setProjects([createInitial(0, currentUser.uid)]);
    }
  }, [loaded.current, currentUser, storageKey]);

  // Save to localStorage on change
  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, JSON.stringify({ projects, activeIndex }));
      } catch { /* storage full */ }
    }, SAVE_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [projects, activeIndex, storageKey]);

  const updateProject = useCallback((action: React.SetStateAction<T>) => {
    setProjects(prev => {
      const idx = activeIndex;
      if (idx < 0 || idx >= prev.length) return prev;
      const next = [...prev];
      next[idx] = action instanceof Function ? action(next[idx]) : action;
      return next;
    });
  }, [activeIndex]);

  const addTabFn = useCallback(() => {
    setProjects(prev => {
      const next = [...prev, createInitial(prev.length, currentUser?.uid || 'local-user')];
      setActiveIndex(next.length - 1);
      return next;
    });
  }, [currentUser]);

  const closeTab = useCallback((index: number) => {
    setProjects(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      if (index <= activeIndex) {
        setActiveIndex(curr => Math.max(0, Math.min(curr, next.length - 1)));
      }
      return next;
    });
  }, [activeIndex]);

  return { projects, activeIndex, setProjects, setActiveIndex, updateProject, addTab: addTabFn, closeTab };
}