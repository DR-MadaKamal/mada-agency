import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SyncService } from './sync';

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
  syncStatus: 'idle' | 'syncing' | 'error';
} {
  const [projects, setProjects] = useState<T[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const loaded = useRef(false);
  const saveTimer = useRef<number | null>(null);

  const storageKeyFull = `${STORAGE_PREFIX}${storageKey}`;

  // Load from localStorage on mount + attempt D1 merge
  useEffect(() => {
    const loadData = async () => {
      try {
        const raw = localStorage.getItem(storageKeyFull);
        if (raw) {
          const saved: StudioState<T> = JSON.parse(raw);
          if (saved.projects?.length > 0) {
            setProjects(saved.projects);
            setActiveIndex(saved.activeIndex);
          }
        }
      } catch { /* ignore */ }
      loaded.current = true;

      // Attempt D1 sync in background
      setSyncStatus('syncing');
      try {
        const localRaw = localStorage.getItem(storageKeyFull);
        if (localRaw) {
          const merged = await SyncService.mergeAndSave(storageKeyFull, JSON.parse(localRaw));
          if (merged) {
            setProjects(merged.projects || []);
            setActiveIndex(merged.activeIndex || 0);
          }
        }
        setSyncStatus('idle');
      } catch {
        setSyncStatus('error');
      }
    };
    loadData();
  }, [storageKey]);

  // Initialize if empty after load attempt
  useEffect(() => {
    if (!loaded.current || !currentUser) return;
    if (projects.length === 0) {
      setProjects([createInitial(0, currentUser.uid)]);
    }
  }, [loaded.current, currentUser, storageKey]);

  // Save to localStorage + push to D1 on change
  useEffect(() => {
    if (!loaded.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        const data = { projects, activeIndex };
        localStorage.setItem(storageKeyFull, JSON.stringify(data));
        SyncService.push(storageKeyFull, data).catch(() => {});
      } catch { /* storage full */ }
    }, SAVE_DEBOUNCE);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
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

  return { projects, activeIndex, setProjects, setActiveIndex, updateProject, addTab: addTabFn, closeTab, syncStatus };
}
