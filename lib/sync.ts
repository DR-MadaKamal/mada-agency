const WORKER_URL = 'https://mada-agency-agents.16491.workers.dev';

interface SyncPayload {
  action: 'push' | 'pull' | 'merge';
  projects?: any[];
  studioType?: string;
}

export const SyncService = {
  async push(key: string, data: any): Promise<void> {
    try {
      localStorage.setItem(`mada_projects_${key}`, JSON.stringify(data));
      const res = await fetch(`${WORKER_URL}/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data }),
      });
      if (!res.ok) console.warn('Sync push failed:', res.status);
    } catch (e) {
      console.warn('Sync push error (offline?):', e);
    }
  },

  async pull(key: string): Promise<any | null> {
    try {
      const res = await fetch(`${WORKER_URL}/sync/pull/${encodeURIComponent(key)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async mergeAndSave(key: string, localData: any): Promise<any> {
    const remote = await SyncService.pull(key);
    if (!remote) return localData;
    const merged = { ...localData };
    if (remote.version > (localData.version || 0)) {
      merged.projects = remote.projects;
      merged.activeIndex = remote.activeIndex;
      merged.version = remote.version;
    }
    localStorage.setItem(`mada_projects_${key}`, JSON.stringify(merged));
    return merged;
  },

  async saveSetting(key: string, value: any): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getSetting<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
};

export const SETTINGS_KEYS = {
  SIDEBAR_COLLAPSED: 'mada_sidebar_collapsed',
  THEME: 'mada_theme',
  FAVORITES: 'mada_favorites',
  RECENT_PROJECTS: 'mada_recent_projects',
};
