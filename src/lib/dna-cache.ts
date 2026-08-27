/**
 * @fileOverview Локальный кэш Наследия (DNA) в IndexedDB — для автономности и быстрого старта.
 * #ЗАЧЕМ: корпус (heritage_axioms + masterpieces) скачивается каждый запуск. Кэшируем локально:
 * старт мгновенный и офлайн, сеть только для фоновой ревалидации (stale-while-revalidate).
 *
 * ВАЖНО: структура соответствует скриншоту пользователя (один Store, три ключа).
 */

const DB_NAME = 'AuraGrooveDNA';
const STORE = 'dna';
const DB_VERSION = 1;

export interface DnaCache {
    axioms: any[] | null;
    masterpieces: any[] | null;
    syncedAt: number | null;
}

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB unavailable')); return; }
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/** Прочитать кэш. Возвращает объект с массивами как на скриншоте. */
export async function loadDnaCache(): Promise<DnaCache> {
    try {
        const db = await openDb();
        const tx = db.transaction(STORE, 'readonly');
        const store = tx.objectStore(STORE);
        
        const get = (k: string) => new Promise<any>((res) => {
            const r = store.get(k);
            r.onsuccess = () => res(r.result ?? null);
            r.onerror = () => res(null);
        });

        const [axioms, masterpieces, syncedAt] = await Promise.all([
            get('axioms'), get('masterpieces'), get('syncedAt'),
        ]);
        
        db.close();
        return { axioms, masterpieces, syncedAt };
    } catch (e) {
        return { axioms: null, masterpieces: null, syncedAt: null };
    }
}

/** Записать данные в формате "ключ - массив". */
export async function saveDnaCache(axioms: any[], masterpieces: any[], now: number): Promise<void> {
    try {
        const db = await openDb();
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        
        store.put(axioms, 'axioms');
        store.put(masterpieces, 'masterpieces');
        store.put(now, 'syncedAt');
        
        await new Promise<void>((res, rej) => {
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
        });
        db.close();
    } catch (e) {
        console.warn('[DNA Cache] Save failed', e);
    }
}
