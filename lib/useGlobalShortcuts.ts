import { useEffect } from 'react';

type ShortcutHandler = (e: KeyboardEvent) => void;

export interface Shortcut {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
  enabled?: boolean;
}

export function useGlobalShortcuts(shortcuts: Shortcut[], deps: any[] = []) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        if (s.enabled === false) continue;

        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
        if (!keyMatch) continue;

        const cmd = e.metaKey || e.ctrlKey;
        const needsMeta = s.meta === true;
        const needsCtrl = s.ctrl === true;
        const needsAny = s.meta === undefined && s.ctrl === undefined;

        if (!needsAny && !cmd) continue;
        if (needsMeta && !e.metaKey) continue;
        if (needsCtrl && !e.ctrlKey) continue;
        if (s.shift && !e.shiftKey) continue;

        e.preventDefault();
        e.stopPropagation();
        s.handler(e);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts, ...deps]);
}
