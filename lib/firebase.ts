const PREFIX = 'mada_';

function getColl<T = any>(name: string): T[] {
  try { return JSON.parse(localStorage.getItem(`${PREFIX}${name}`) || '[]'); }
  catch { return []; }
}

function setColl(name: string, data: any[]) {
  localStorage.setItem(`${PREFIX}${name}`, JSON.stringify(data));
}

type DocSnap = { id: string; exists: boolean; data: () => any };
type QuerySnap = { docs: DocSnap[]; empty: boolean; forEach: (fn: (d: DocSnap) => void) => void };
type Unsub = () => void;

function makeFilter(field: string, op: string, val: any): (item: any) => boolean {
  return (item: any) => {
    if (op === '==') return item[field] === val;
    if (op === '!=') return item[field] !== val;
    if (op === '>') return item[field] > val;
    if (op === '>=') return item[field] >= val;
    if (op === '<') return item[field] < val;
    if (op === '<=') return item[field] <= val;
    if (op === 'array-contains') return Array.isArray(item[field]) && item[field].includes(val);
    if (op === 'in') return Array.isArray(val) && val.includes(item[field]);
    if (op === 'not-in') return !Array.isArray(val) || !val.includes(item[field]);
    return true;
  };
}

function makeSorter(field: string, dir?: 'asc' | 'desc'): (a: any, b: any) => number {
  return (a: any, b: any) => {
    const va = a[field] ?? '', vb = b[field] ?? '';
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return dir === 'desc' ? -cmp : cmp;
  };
}

// Handle subcollections: collection(db, 'parent', docId, 'sub') or collection(db, 'path')
export function collection(db: any, path: string, ...extra: string[]) {
  const fullPath = [path, ...extra].join('/');
  return makeCollectionRef(fullPath);
}

function makeCollectionRef(path: string) {
  let _filters: ((item: any) => boolean)[] = [];
  let _sorts: ((a: any, b: any) => number)[] = [];
  let _limit: number | null = null;

  function exec(): any[] {
    let items = getColl<any>(path);
    for (const f of _filters) items = items.filter(f);
    for (const s of _sorts) items = items.sort(s);
    if (_limit && _limit > 0) items = items.slice(0, _limit);
    return items;
  }

  const colObj = {
    doc: (id: string) => ({
      get: async (): Promise<DocSnap> => {
        const items = getColl(path);
        const item = items.find((i: any) => i.id === id);
        return { exists: !!item, data: () => ({ ...item }), id };
      },
      set: async (data: any, opts?: any) => {
        const items = getColl(path);
        const idx = items.findIndex((i: any) => i.id === id);
        const ts = { toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) };
        const newData = { ...data, id, updatedAt: ts };
        if (!data.createdAt) newData.createdAt = ts;
        if (opts?.merge) {
          if (idx >= 0) items[idx] = { ...items[idx], ...newData };
          else items.push(newData);
        } else {
          if (idx >= 0) items[idx] = newData;
          else items.push(newData);
        }
        setColl(path, items);
      },
      update: async (data: any) => {
        const items = getColl(path);
        const idx = items.findIndex((i: any) => i.id === id);
        if (idx >= 0) {
          items[idx] = { ...items[idx], ...data, updatedAt: { toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) } };
          setColl(path, items);
        }
      },
      delete: async () => {
        const items = getColl(path);
        setColl(path, items.filter((i: any) => i.id !== id));
      },
      onSnapshot: (cb: (snap: DocSnap) => void): Unsub => {
        const items = getColl(path);
        const item = items.find((i: any) => i.id === id);
        cb({ exists: !!item, data: () => ({ ...item }), id });
        return () => {};
      },
    }),
    add: async (data: any) => {
      const items = getColl(path);
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      const ts = { toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) };
      items.push({ ...data, id, createdAt: ts, updatedAt: ts });
      setColl(path, items);
      return { id };
    },
    get: async (): Promise<QuerySnap> => {
      const items = exec();
      const docs = items.map((i: any) => ({ id: i.id, exists: true, data: () => ({ ...i }) }));
      return { docs, empty: docs.length === 0, forEach: (fn: (d: DocSnap) => void) => docs.forEach(fn) };
    },
    onSnapshot: (cb: (snap: QuerySnap) => void): Unsub => {
      const items = exec();
      const docs = items.map((i: any) => ({ id: i.id, exists: true, data: () => ({ ...i }) }));
      cb({ docs, empty: docs.length === 0, forEach: (fn: (d: DocSnap) => void) => docs.forEach(fn) });
      return () => {};
    },
    where: (field: string, op: string, val: any) => {
      _filters.push(makeFilter(field, op, val));
      return colObj;
    },
    orderBy: (field: string, dir?: 'asc' | 'desc') => {
      _sorts.push(makeSorter(field, dir));
      return colObj;
    },
    limit: (n: number) => { _limit = n; return colObj; },
  };
  return colObj;
}

export function doc(db: any, path: string, ...ids: string[]) {
  const allParts = [path, ...ids];
  const id = allParts[allParts.length - 1];
  const colPath = allParts.slice(0, -1).join('/');
  const col = makeCollectionRef(colPath);
  return col.doc(id);
}

export function query(col: any, ...rest: any[]) {
  const w = col.where.bind(col);
  const o = col.orderBy.bind(col);
  const l = col.limit.bind(col);
  let q = col;
  for (const r of rest) {
    if (r && r.field !== undefined) {
      if (r.op) q = q.where(r.field, r.op, r.val);
      else if (r.dir) q = q.orderBy(r.field, r.dir);
      else q = q.where(r.field, '==', r.val);
    } else if (r && r.limit !== undefined) {
      q = q.limit(r.limit);
    }
  }
  return q;
}

export function where(field: string, op: string, val: any) {
  return { field, op, val };
}

export function orderBy(field: string, dir?: 'asc' | 'desc') {
  return { field, dir };
}

export function limit(n: number) {
  return { limit: n };
}

export async function getDoc(ref: any) { return ref.get(); }
export async function getDocs(ref: any) { return ref.get(); }
export async function addDoc(ref: any, data: any) { return ref.add(data); }
export async function setDoc(ref: any, data: any, opts?: any) { return ref.set(data, opts); }
export async function updateDoc(ref: any, data: any) { return ref.update(data); }
export async function deleteDoc(ref: any) { return ref.delete(); }

export function onSnapshot(ref: any, cb: any, onError?: any): Unsub {
  try {
    if (typeof ref === 'function') return ref(cb);
    if (ref.onSnapshot) return ref.onSnapshot(cb);
    if (ref.get) {
      ref.get().then((snap: any) => cb(snap)).catch((err: any) => onError?.(err));
    }
  } catch (err) {
    onError?.(err);
  }
  return () => {};
}

export function serverTimestamp() {
  return { toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
}

export function writeBatch(db: any) {
  const ops: { ref: any; type: string; data?: any }[] = [];
  return {
    set: (ref: any, data: any, opts?: any) => ops.push({ ref, type: 'set', data: { ...data, ...opts } }),
    update: (ref: any, data: any) => ops.push({ ref, type: 'update', data }),
    delete: (ref: any) => ops.push({ ref, type: 'delete' }),
    commit: async () => {
      for (const op of ops) {
        if (op.type === 'set') await op.ref.set(op.data);
        else if (op.type === 'update') await op.ref.update(op.data);
        else if (op.type === 'delete') await op.ref.delete();
      }
    },
  };
}

export function getCountFromServer(ref: any) {
  return ref.get().then((snap: QuerySnap) => ({ data: () => ({ count: snap.docs.length }) }));
}

export function onAuthStateChanged(auth: any, cb: (user: any) => void) {
  cb(auth.currentUser);
  return () => {};
};

export const auth = {
  currentUser: { uid: 'local-user', email: 'local@mada.app', getIdToken: async () => 'local-token' },
};

export const signIn = async () => {};
export const signOut = async () => {};

export const storage = { ref: () => ({ put: async () => {}, getDownloadURL: async () => '' }) };
export const googleProvider = {};

export const db = {};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Firestore Error [${operationType}] at ${path}:`, error);
}

export function sanitizeData(data: any): any {
  if (data === null || typeof data !== 'object') return data === undefined ? null : data;
  if (Array.isArray(data)) return data.map(v => sanitizeData(v));
  const clean: any = {};
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val !== undefined) clean[key] = sanitizeData(val);
  }
  return clean;
}
