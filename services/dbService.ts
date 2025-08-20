
import { Task, Message, PromptDJAsset } from '../types';

const DB_NAME = 'CrucibleDB';
const DB_VERSION = 2;
const TASKS_STORE = 'tasks';
const MESSAGES_STORE = 'messages';
const PROMPTDJ_ASSETS_STORE = 'promptDJAssets';

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(TASKS_STORE)) {
        dbInstance.createObjectStore(TASKS_STORE, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(MESSAGES_STORE)) {
        dbInstance.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(PROMPTDJ_ASSETS_STORE)) {
        dbInstance.createObjectStore(PROMPTDJ_ASSETS_STORE, { keyPath: 'id' });
      }
    };
  });
  return dbPromise;
};

export const getAllItems = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
};

export const putItem = async <T>(storeName: string, item: T): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const putAllItems = async <T>(storeName: string, items: T[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
        return resolve();
    }
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(transaction.error);
    };

    items.forEach(item => {
      store.put(item);
    });
  });
};

// Specific helpers for this app
export const getTasksDB = () => getAllItems<Task>(TASKS_STORE);
export const getMessagesDB = () => getAllItems<Message>(MESSAGES_STORE);
export const saveTaskDB = (task: Task) => putItem(TASKS_STORE, task);
export const saveTasksDB = (tasks: Task[]) => putAllItems(TASKS_STORE, tasks);
export const saveMessageDB = (message: Message) => putItem(MESSAGES_STORE, message);
export const getPromptDJAssetsDB = () => getAllItems<PromptDJAsset>(PROMPTDJ_ASSETS_STORE);
export const savePromptDJAssetDB = (asset: PromptDJAsset) => putItem(PROMPTDJ_ASSETS_STORE, asset);