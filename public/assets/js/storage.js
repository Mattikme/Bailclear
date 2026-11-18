// Brouillon (IndexedDB, photos comprises) et liste « mes pages » (localStorage). Tout reste sur l'appareil.
const DB = 'unepagepourtoi';
const STORE = 'kv';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(r && r.result);
    t.onerror = () => reject(t.error);
  });
}
export const idbGet = (k) => tx('readonly', (s) => s.get(k));
export const idbSet = (k, v) => tx('readwrite', (s) => s.put(v, k));
export const idbDel = (k) => tx('readwrite', (s) => s.delete(k));

const KEY = 'upt:pages';
export function listPages() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function rememberPage(p) {
  try {
    const list = listPages().filter((x) => x.id !== p.id);
    list.unshift(p);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
  } catch { /* stockage indisponible */ }
}
export function findPage(id) {
  return listPages().find((p) => p.id === id) || null;
}
