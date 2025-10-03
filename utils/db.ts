import { openDB, DBSchema } from 'idb';
// FIX: The Action type is exported from `types.ts`, not `DataContext.tsx`.
import { Action } from '../types';

const DB_NAME = 'stone-river-offline';
const STORE_NAME = 'sync-queue';
const DB_VERSION = 1;

interface OfflineDB extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: Action;
  };
}

let dbPromise: ReturnType<typeof openDB<OfflineDB>> | null = null;

export const initDB = () => {
  if (dbPromise) return;
  dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, {
        keyPath: 'id',
        autoIncrement: true,
      });
    },
  });
};

const getDb = () => {
  if (!dbPromise) {
    initDB();
  }
  return dbPromise!;
};

export const addToQueue = async (action: Action) => {
  const db = await getDb();
  await db.add(STORE_NAME, action);
  window.dispatchEvent(new Event('queue-changed')); // Notify UI of change
};

export const getQueue = async (): Promise<Action[]> => {
  const db = await getDb();
  return db.getAll(STORE_NAME);
};

export const clearQueue = async () => {
  const db = await getDb();
  await db.clear(STORE_NAME);
  window.dispatchEvent(new Event('queue-changed')); // Notify UI of change
};

export const getQueueCount = async (): Promise<number> => {
  const db = await getDb();
  return db.count(STORE_NAME);
};
