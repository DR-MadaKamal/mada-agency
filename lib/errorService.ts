export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorSource = 'ai' | 'storage' | 'network' | 'render' | 'user_input' | 'unknown';

const STORAGE_KEY = 'mada_error_log';
const MAX_LOGS = 200;
const MAX_METRICS_SAMPLES = 100;

export interface LoggedError {
  id: string;
  message: string;
  severity: ErrorSeverity;
  source: ErrorSource;
  timestamp: number;
  context?: Record<string, any>;
  stack?: string;
  resolved: boolean;
  autoRepaired: boolean;
  retryCount: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  resolvedCount: number;
  unresolvedCount: number;
  autoRepairedCount: number;
  bySource: Record<string, number>;
  bySeverity: Record<string, number>;
  recentRate: number;
  topErrors: { message: string; count: number }[];
}

interface RecoverySuggestion {
  action: string;
  label: string;
  handler: () => void | Promise<void>;
}

const STORAGE_METRICS_KEY = 'mada_error_metrics';
const DB_NAME = 'mada_agency_db';
const DB_STORE = 'error_log';
const DB_VERSION = 1;

let errorLog: LoggedError[] = [];
let listeners: Array<(log: LoggedError[]) => void> = [];
let idCounter = 0;
let metricsBuffer: { timestamp: number; source: string; severity: string }[] = [];
let dbStoreFallback: boolean = false;

function openDB(): Promise<IDBObjectStore | null> {
  return new Promise(resolve => {
    if (!('indexedDB' in window)) { resolve(null); return; }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(DB_STORE, 'readwrite');
      resolve(tx.objectStore(DB_STORE));
    };
    request.onerror = () => resolve(null);
  });
}

function loadPersistedErrors(): LoggedError[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* localStorage unavailable */ }
  return [];
}

function persistErrors() {
  const data = errorLog.slice(-MAX_LOGS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    dbStoreFallback = false;
  } catch (e) {
    if ((e as DOMException)?.name === 'QuotaExceededError' || (e as DOMException)?.code === 22) {
      persistErrorsIndexedDB(data);
    }
  }
}

function persistErrorsIndexedDB(data: LoggedError[]) {
  openDB().then(store => {
    if (!store) return;
    try {
      store.put({ key: STORAGE_KEY, value: JSON.stringify(data) });
      if (data.length > 0) {
        localStorage.removeItem(STORAGE_KEY);
      }
      dbStoreFallback = true;
    } catch { /* indexedDB write failed */ }
  });
}

function loadFromIndexedDB(): Promise<LoggedError[]> {
  return new Promise(resolve => {
    openDB().then(store => {
      if (!store) { resolve([]); return; }
      const req = store.get(STORAGE_KEY);
      req.onsuccess = () => {
        try {
          const result = req.result as { value: string } | undefined;
          if (result?.value) resolve(JSON.parse(result.value));
          else resolve([]);
        } catch { resolve([]); }
      };
      req.onerror = () => resolve([]);
    });
  });
}

function persistMetrics() {
  try {
    localStorage.setItem(STORAGE_METRICS_KEY, JSON.stringify(metricsBuffer.slice(-MAX_METRICS_SAMPLES)));
  } catch { /* ignore */ }
}

function getSourceFromError(err: any): ErrorSource {
  const msg = (err?.message || '').toLowerCase();
  const stack = (err?.stack || '').toLowerCase();
  if (msg.includes('api') || msg.includes('ai') || msg.includes('gemini') || msg.includes('openai')) return 'ai';
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || stack.includes('fetch')) return 'network';
  if (msg.includes('localstorage') || msg.includes('indexeddb') || msg.includes('quota')) return 'storage';
  if (msg.includes('render') || msg.includes('react') || stack.includes('react')) return 'render';
  return 'unknown';
}

function computeMetrics(): ErrorMetrics {
  const now = Date.now();
  const recentErrors = metricsBuffer.filter(m => now - m.timestamp < 60000);
  const bySource: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const freq: Record<string, number> = {};

  for (const e of errorLog) {
    bySource[e.source] = (bySource[e.source] || 0) + 1;
    bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    const key = e.message.substring(0, 80);
    freq[key] = (freq[key] || 0) + 1;
  }

  const topErrors = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([message, count]) => ({ message, count }));

  return {
    totalErrors: errorLog.length,
    resolvedCount: errorLog.filter(e => e.resolved).length,
    unresolvedCount: errorLog.filter(e => !e.resolved).length,
    autoRepairedCount: errorLog.filter(e => e.autoRepaired).length,
    bySource,
    bySeverity,
    recentRate: recentErrors.length,
    topErrors,
  };
}

export const RecoveryStrategies: Record<ErrorSource, RecoverySuggestion[]> = {
  ai: [
    { action: 'retry', label: 'Retry AI call', handler: () => { window.dispatchEvent(new CustomEvent('studio-retry-ai')); } },
    { action: 'fallback', label: 'Switch to fallback model', handler: () => { window.dispatchEvent(new CustomEvent('studio-fallback-model')); } },
  ],
  network: [
    { action: 'retry', label: 'Retry connection', handler: () => { window.dispatchEvent(new CustomEvent('studio-retry-connection')); } },
    { action: 'offline', label: 'Switch to offline mode', handler: () => { window.dispatchEvent(new CustomEvent('studio-go-offline')); } },
  ],
  storage: [
    { action: 'clear', label: 'Clear storage cache', handler: () => {
        try {
          for (const key of Object.keys(localStorage)) {
            if (key.startsWith('mada_')) localStorage.removeItem(key);
          }
        } catch { /* ignore */ }
        window.dispatchEvent(new CustomEvent('storage-cleared'));
      }
    },
    { action: 'compact', label: 'Compact storage', handler: () => { window.dispatchEvent(new CustomEvent('studio-compact-storage')); } },
  ],
  render: [
    { action: 'reload', label: 'Reload studio', handler: () => { window.dispatchEvent(new CustomEvent('studio-reload')); } },
    { action: 'reset', label: 'Reset component state', handler: () => { window.dispatchEvent(new CustomEvent('studio-reset-state')); } },
  ],
  user_input: [
    { action: 'validate', label: 'Validate input', handler: () => { window.dispatchEvent(new CustomEvent('studio-validate-input')); } },
  ],
  unknown: [
    { action: 'reload', label: 'Reload page', handler: () => { window.location.reload(); } },
    { action: 'report', label: 'Report issue', handler: () => { window.dispatchEvent(new CustomEvent('studio-report-issue')); } },
  ],
};

export const ErrorService = {
  init() {
    const local = loadPersistedErrors();
    if (local.length > 0) {
      errorLog = local;
    } else {
      loadFromIndexedDB().then(idb => { errorLog = idb; });
    }
    metricsBuffer = loadMetricsBuffer();
  },

  log(err: any, severity: ErrorSeverity = 'medium', context?: Record<string, any>): LoggedError {
    const entry: LoggedError = {
      id: `err_${Date.now()}_${++idCounter}`,
      message: err?.message || String(err),
      severity,
      source: getSourceFromError(err),
      timestamp: Date.now(),
      context,
      stack: err?.stack,
      resolved: false,
      autoRepaired: false,
      retryCount: 0,
    };
    errorLog = [...errorLog.slice(-(MAX_LOGS - 1)), entry];
    metricsBuffer.push({ timestamp: entry.timestamp, source: entry.source, severity: entry.severity });
    persistErrors();
    persistMetrics();
    if (severity === 'critical' || severity === 'high') {
      console.error(`[${severity.toUpperCase()}] ${entry.source}: ${entry.message}`, context || '');
      window.dispatchEvent(new CustomEvent('error-global', { detail: { message: entry.message, severity, source: entry.source, id: entry.id } }));
    } else {
      console.warn(`[${severity.toUpperCase()}] ${entry.source}: ${entry.message}`);
    }
    listeners.forEach(fn => fn(errorLog));
    if (severity === 'low') ErrorService.autoRepair(entry);
    return entry;
  },

  warn(message: string, context?: Record<string, any>) {
    return ErrorService.log({ message }, 'low', context);
  },

  resolve(id: string) {
    errorLog = errorLog.map(e => e.id === id ? { ...e, resolved: true } : e);
    persistErrors();
    listeners.forEach(fn => fn(errorLog));
  },

  resolveAll() {
    errorLog = errorLog.map(e => e.resolved ? e : { ...e, resolved: true });
    persistErrors();
    listeners.forEach(fn => fn(errorLog));
  },

  markAutoRepaired(id: string) {
    errorLog = errorLog.map(e => e.id === id ? { ...e, autoRepaired: true, resolved: true } : e);
    persistErrors();
    listeners.forEach(fn => fn(errorLog));
  },

  incrementRetry(id: string) {
    errorLog = errorLog.map(e => e.id === id ? { ...e, retryCount: e.retryCount + 1 } : e);
    persistErrors();
  },

  async withRetry<T>(
    fn: () => Promise<T>,
    options: { maxRetries?: number; baseDelay?: number; onRetry?: (attempt: number, err: any) => void; context?: Record<string, any> } = {}
  ): Promise<T> {
    const { maxRetries = 3, baseDelay = 1000, onRetry, context } = options;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt === maxRetries) {
          ErrorService.log(err, 'high', { ...context, retryAttempts: attempt });
          throw err;
        }
        onRetry?.(attempt + 1, err);
        ErrorService.log(err, 'low', { ...context, attempt: attempt + 1 });
        await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
      }
    }
    throw new Error('Unreachable');
  },

  getRecoverySuggestions(source: ErrorSource): RecoverySuggestion[] {
    return RecoveryStrategies[source] || RecoveryStrategies.unknown;
  },

  getAll(): LoggedError[] {
    return [...errorLog];
  },

  getUnresolved(): LoggedError[] {
    return errorLog.filter(e => !e.resolved);
  },

  getMetrics(): ErrorMetrics {
    return computeMetrics();
  },

  subscribe(fn: (log: LoggedError[]) => void) {
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  },

  autoRepair(err: LoggedError): boolean {
    if (err.autoRepaired || err.resolved || err.severity !== 'low') return false;
    const strategies = RecoveryStrategies[err.source] || RecoveryStrategies.unknown;
    if (strategies.length === 0) return false;
    const strategy = strategies[0];
    try {
      strategy.handler();
      ErrorService.markAutoRepaired(err.id);
      window.dispatchEvent(new CustomEvent('error-auto-repair', { detail: { id: err.id, source: err.source, action: strategy.action } }));
      return true;
    } catch { return false; }
  },

  clear() {
    errorLog = [];
    metricsBuffer = [];
    persistErrors();
    persistMetrics();
    listeners.forEach(fn => fn(errorLog));
  },

  clearResolved() {
    errorLog = errorLog.filter(e => !e.resolved);
    persistErrors();
    listeners.forEach(fn => fn(errorLog));
  },
};

function loadMetricsBuffer() {
  try {
    const raw = localStorage.getItem(STORAGE_METRICS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}
