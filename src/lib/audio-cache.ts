/**
 * @fileOverview Audio Asset Vault V2.0 — "IDB Performance Shield".
 * #ЗАЧЕМ: Использование библиотеки idb для надежного хранения 116МБ ассетов.
 * #ЧТО: Реализация ПЛАНА №2210.
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'AuraGroove_AssetCache';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

class AudioVault {
  private db: IDBPDatabase | null = null;

  public async init() {
    if (this.db) return;
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
      });
    } catch (e) {
      console.warn('[Vault] Database initialization failed (check Incognito mode)', e);
    }
  }

  /**
   * Умный Fetch Прокси: БД -> Сеть -> БД.
   */
  public async fetch(url: string): Promise<ArrayBuffer> {
    await this.init();
    
    // 1. Пытаемся взять из кэша
    if (this.db) {
      try {
        const cached = await this.db.get(STORE_NAME, url);
        if (cached) return cached;
      } catch (e) {}
    }

    // 2. Если нет в кэше — качаем из сети
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
    
    const buffer = await response.arrayBuffer();
    
    // 3. Сохраняем в фонe для будущего (non-blocking copy)
    if (this.db) {
      try {
        await this.db.put(STORE_NAME, buffer.slice(0), url);
      } catch (e) {}
    }

    return buffer;
  }

  public async getCachedCount(): Promise<number> {
    await this.init();
    if (!this.db) return 0;
    try {
        return await this.db.count(STORE_NAME);
    } catch (e) {
        return 0;
    }
  }

  public async get(url: string): Promise<ArrayBuffer | null> {
    await this.init();
    if (!this.db) return null;
    try {
        return (await this.db.get(STORE_NAME, url)) || null;
    } catch (e) {
        return null;
    }
  }

  public async clear(): Promise<void> {
    await this.init();
    if (this.db) {
        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        await tx.objectStore(STORE_NAME).clear();
        await tx.done;
    }
  }
}

export const vault = new AudioVault();
