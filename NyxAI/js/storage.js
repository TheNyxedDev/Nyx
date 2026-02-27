/* ══════════════════════════════════════════════════════════════
   Nyx — IndexedDB Chat Persistence
   ══════════════════════════════════════════════════════════════ */

const Storage = (() => {
    const DB = 'nyx_chats';
    const VER = 1;
    const STORE = 'chats';
    let db = null;

    function open() {
        return new Promise((res, rej) => {
            if (db) return res(db);
            const r = indexedDB.open(DB, VER);
            r.onupgradeneeded = e => {
                const d = e.target.result;
                if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' });
            };
            r.onsuccess = e => { db = e.target.result; res(db); };
            r.onerror = e => rej(e.target.error);
        });
    }

    async function store(mode = 'readonly') {
        const d = await open();
        return d.transaction(STORE, mode).objectStore(STORE);
    }

    const p = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

    return {
        async save(chat) { chat.updatedAt = Date.now(); return p((await store('readwrite')).put(chat)); },
        async get(id) { return p((await store()).get(id)); },
        async getAll() { const c = await p((await store()).getAll()); return c.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); },
        async remove(id) { return p((await store('readwrite')).delete(id)); },
        async clear() { return p((await store('readwrite')).clear()); },
        newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
    };
})();
