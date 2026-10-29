import { buildSeed } from './seed/seed';

/**
 * In-memory mock database. In the browser it is saved to localStorage so demo data survives
 * reloads; bump DB_VERSION when the seed shape changes. Tests always start from a fresh seed.
 */
const DB_VERSION = 2;
const STORAGE_KEY = 'kjt-mock-db';
const canPersist = typeof window !== 'undefined' && import.meta.env.MODE !== 'test';

function load() {
  if (canPersist) {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (saved?.version === DB_VERSION) return saved.data;
    } catch {
      // fall through to a fresh seed
    }
  }
  return buildSeed();
}

export let db = load();

let saveTimer = null;
let isDirty = false;

/** Call after every mutation. Saves are batched. */
export function persist() {
  isDirty = true;
  if (!canPersist) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: DB_VERSION, data: db }));
    } catch {
      // storage full or blocked: keep working in memory
    }
  }, 150);
}

/** Restores the original seed (used by /dev/ui and tests). */
export function resetDb() {
  isDirty = false;
  db = buildSeed();
  if (canPersist) window.localStorage.removeItem(STORAGE_KEY);
  return db;
}

export const findById = (collection, id) => db[collection].find((row) => row.id === id) ?? null;

/** Removes private fields before a user leaves the "server". */
export function publicUser(user) {
  if (!user) return null;
  // eslint-disable-next-line no-unused-vars
  const { password, ...rest } = user;
  return rest;
}

/** True when something changed since the last reset (tests skip resetting clean data). */
export const isDbDirty = () => isDirty;
