// js/offline-manager.js
// ============================================================
// OfflineManager v2 — Login offline + Sync robuste + Cache
// ============================================================

const OfflineManager = {
    DB_NAME:    'salonDB',
    DB_VERSION: 2,          // ← version incrémentée pour migration
    db:         null,
    isOnline:   navigator.onLine,
    _syncInProgress: false,

    // ============================================================
    // INIT
    // ============================================================
    async init() {
        await this._openDB();
        this.startListening();
        await this._pingSupabase();   // vérification réseau réelle
        console.log('✅ OfflineManager v2 prêt — online:', this.isOnline);
    },

    _openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db  = e.target.result;
                const old = e.oldVersion;

                // ── pending_ops ──────────────────────────────
                if (!db.objectStoreNames.contains('pending_ops')) {
                    const store = db.createObjectStore('pending_ops', {
                        keyPath: 'id', autoIncrement: true
                    });
                    store.createIndex('table_name', 'table_name', { unique: false });
                    store.createIndex('timestamp',  'timestamp',  { unique: false });
                    store.createIndex('retries',    'retries',    { unique: false });
                }

                // ── caches métier ────────────────────────────
                const caches = [
                    'cache_ventes', 'cache_clients',
                    'cache_produits', 'cache_coiffeuses',
                    'cache_mouvements', 'cache_clotures'
                ];
                caches.forEach(name => {
                    if (!db.objectStoreNames.contains(name))
                        db.createObjectStore(name, { keyPath: 'id' });
                });

                // ── auth_cache (LOGIN OFFLINE) ────────────────
                if (!db.objectStoreNames.contains('auth_cache'))
                    db.createObjectStore('auth_cache', { keyPath: 'key' });
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    // ============================================================
    // PING RÉSEAU RÉEL (navigator.onLine n'est pas fiable)
    // ============================================================
    async _pingSupabase() {
        try {
            // ── Récupérer le token de session actif ──────────────────────
            const client = AuthSupabase?.supabase || window.supabase;
            const { data: { session } } = await client.auth.getSession();
            const token = session?.access_token || SUPABASE_ANON_KEY;
    
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/`,
                {
                    method: 'HEAD',
                    headers: {
                        'apikey':        SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${token}`,  // ✅ ajout
                    }
                }
            );
            return response.ok;
        } catch {
            return false;
        }
    },


    // ============================================================
    // LOGIN OFFLINE
    // ============================================================

    /**
     * Appeler après un login Supabase réussi pour cacher les credentials
     * Usage : await OfflineManager.cacheUserSession(email, password, userData)
     */
    async cacheUserSession(email, password, userData) {
        // ⚠️ On stocke un hash (pas le mdp brut) + les données user
        const hash = await this._hashPassword(password);
        await this._idbPut('auth_cache', {
            key:      'current_user',
            email:    email.toLowerCase().trim(),
            hash,
            userData,           // { id, nom, role, ... }
            cachedAt: new Date().toISOString(),
        });
        console.log('🔐 Session utilisateur mise en cache offline');
    },

    /**
     * Tenter un login offline si pas de réseau
     * Retourne { success, userData } ou { success: false }
     */
    async tryOfflineLogin(email, password) {
        try {
            const cached = await this._idbGet('auth_cache', 'current_user');
            if (!cached) return { success: false, reason: 'no_cache' };

            const emailMatch = cached.email === email.toLowerCase().trim();
            const hashMatch  = await this._verifyPassword(password, cached.hash);

            if (emailMatch && hashMatch) {
                console.log('✅ Login offline réussi');
                return { success: true, userData: cached.userData };
            }

            return { success: false, reason: 'wrong_credentials' };
        } catch (e) {
            console.error('❌ tryOfflineLogin:', e);
            return { success: false, reason: 'error' };
        }
    },

    async _hashPassword(password) {
        const buf  = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(password + 'salon_salt_2025')
        );
        return Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async _verifyPassword(password, hash) {
        return (await this._hashPassword(password)) === hash;
    },

    // ============================================================
    // LISTENERS
    // ============================================================
    startListening() {
        window.addEventListener('online', async () => {
            const reallyOnline = await this._pingSupabase();
            if (!reallyOnline) return;
            this.showBanner('online');
            console.log('🌐 Connexion rétablie — synchronisation...');
            await this.syncPendingOps();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showBanner('offline');
            console.warn('📴 Mode offline activé');
        });

        // Vérification périodique toutes les 30 s
        setInterval(async () => {
            const wasOnline = this.isOnline;
            await this._pingSupabase();

            if (!wasOnline && this.isOnline) {
                this.showBanner('online');
                await this.syncPendingOps();
            }
            if (wasOnline && !this.isOnline) {
                this.showBanner('offline');
            }
        }, 30_000);
    },

    // ============================================================
    // PENDING OPS
    // ============================================================
    async addPendingOp(operation, tableName, data) {
        const op = {
            operation,
            table_name: tableName,
            data,
            timestamp:  new Date().toISOString(),
            retries:    0,
            synced:     false,
        };
        const id = await this._idbAdd('pending_ops', op);
        console.log(`📥 Op en queue [${operation}] → ${tableName} (id: ${id})`);

        // Badge pending count
        this._updatePendingBadge();
        return id;
    },

    async getPendingOps() {
        return this._idbGetAll('pending_ops');
    },

    async deletePendingOp(id) {
        return this._idbDelete('pending_ops', id);
    },

    // ============================================================
    // SYNC — robuste avec retry
    // ============================================================
    async syncPendingOps() {
        if (this._syncInProgress) {
            console.log('⏳ Sync déjà en cours, ignorée');
            return;
        }
        this._syncInProgress = true;

        try {
            const ops = await this.getPendingOps();
            if (ops.length === 0) {
                console.log('✅ Aucune opération en attente');
                return;
            }

            console.log(`🔄 ${ops.length} opération(s) à synchroniser...`);
            this._notify(`Synchronisation de ${ops.length} opération(s)...`, 'info');

            let success = 0;
            let errors  = 0;

            for (const op of ops) {
                const ok = await this._syncOneOp(op);
                if (ok) {
                    await this.deletePendingOp(op.id);
                    success++;
                } else {
                    // Incrémenter retries — abandon après 5 tentatives
                    await this._incrementRetry(op);
                    errors++;
                }
            }

            this._updatePendingBadge();

            if (errors === 0) {
                this._notify(`✅ ${success} opération(s) synchronisée(s) !`, 'success');
            } else {
                this._notify(`⚠️ ${success} ok — ${errors} échouée(s)`, 'warning');
            }

            await this.refreshAllModules();

        } finally {
            this._syncInProgress = false;
        }
    },

    async _syncOneOp(op) {
        try {
            if (op.retries >= 5) {
                console.error(`❌ Op ${op.id} abandonnée après 5 tentatives`);
                return true; // supprime quand même pour pas bloquer
            }

            const { id: _id, ...cleanData } = op.data;

            if (op.operation === 'create') {
                const { error } = await window.supabase
                    .from(op.table_name)
                    .insert([cleanData])
                    .select()
                    .single();
                if (error) throw error;

            } else if (op.operation === 'update') {
                const { error } = await window.supabase
                    .from(op.table_name)
                    .update(cleanData)
                    .eq('id', op.data.id);
                if (error) throw error;

            } else if (op.operation === 'delete') {
                const { error } = await window.supabase
                    .from(op.table_name)
                    .delete()
                    .eq('id', op.data.id);
                if (error) throw error;
            }

            return true;

        } catch (err) {
            console.error(`❌ Sync op ${op.id} (tentative ${op.retries + 1}):`, err.message);
            return false;
        }
    },

    async _incrementRetry(op) {
        return new Promise((resolve) => {
            const tx    = this.db.transaction('pending_ops', 'readwrite');
            const store = tx.objectStore('pending_ops');
            const req   = store.get(op.id);
            req.onsuccess = () => {
                const record = req.result;
                if (record) {
                    record.retries = (record.retries || 0) + 1;
                    store.put(record);
                }
                resolve();
            };
        });
    },

    // ============================================================
    // CACHE MÉTIER
    // ============================================================
    async cacheData(storeName, records) {
        if (!this.db || !Array.isArray(records)) return;
        return new Promise((resolve, reject) => {
            const tx    = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.clear();
            records.forEach(r => store.put(r));
            tx.oncomplete = () => {
                console.log(`📦 Cache [${storeName}] → ${records.length} enregistrements`);
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        });
    },

    async getCachedData(storeName) {
        if (!this.db) return [];
        return this._idbGetAll(storeName);
    },

    // ============================================================
    // BANNER UI
    // ============================================================
    showBanner(status) {
        let banner = document.getElementById('offline-banner');

        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'offline-banner';
            Object.assign(banner.style, {
                position:   'fixed',
                top:        '0',
                left:       '0',
                right:      '0',
                zIndex:     '99999',
                textAlign:  'center',
                padding:    '10px 16px',
                fontSize:   '14px',
                fontWeight: '600',
                display:    'none',
                transition: 'all 0.3s ease',
            });
            document.body.prepend(banner);
        }

        if (status === 'offline') {
            banner.style.background = '#ef4444';
            banner.style.color      = '#fff';
            banner.innerHTML = '📴 Hors connexion — Les données seront synchronisées automatiquement';
            banner.style.display    = 'block';
        } else {
            banner.style.background = '#22c55e';
            banner.style.color      = '#fff';
            banner.innerHTML        = '🌐 Connexion rétablie — Synchronisation en cours...';
            banner.style.display    = 'block';
            setTimeout(() => { banner.style.display = 'none'; }, 4000);
        }
    },

    _updatePendingBadge() {
        this.getPendingCount().then(count => {
            let badge = document.getElementById('offline-pending-badge');
            if (count === 0) {
                if (badge) badge.remove();
                return;
            }
            if (!badge) {
                badge = document.createElement('div');
                badge.id = 'offline-pending-badge';
                Object.assign(badge.style, {
                    position:     'fixed',
                    bottom:       '16px',
                    right:        '16px',
                    background:   '#f59e0b',
                    color:        '#fff',
                    borderRadius: '999px',
                    padding:      '8px 14px',
                    fontSize:     '13px',
                    fontWeight:   '700',
                    zIndex:       '99998',
                    cursor:       'pointer',
                    boxShadow:    '0 2px 8px rgba(0,0,0,0.3)',
                });
                badge.onclick = () => this.syncPendingOps();
                document.body.appendChild(badge);
            }
            badge.innerHTML = `⏳ ${count} op. en attente — Cliquer pour sync`;
        });
    },

    // ============================================================
    // HELPERS IndexedDB
    // ============================================================
    _idbAdd(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx  = this.db.transaction(storeName, 'readwrite');
            const req = tx.objectStore(storeName).add(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror   = () => reject(req.error);
        });
    },

    _idbPut(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx  = this.db.transaction(storeName, 'readwrite');
            const req = tx.objectStore(storeName).put(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror   = () => reject(req.error);
        });
    },

    _idbGet(storeName, key) {
        return new Promise((resolve, reject) => {
            const tx  = this.db.transaction(storeName, 'readonly');
            const req = tx.objectStore(storeName).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror   = () => reject(req.error);
        });
    },

    _idbGetAll(storeName) {
        return new Promise((resolve, reject) => {
            const tx  = this.db.transaction(storeName, 'readonly');
            const req = tx.objectStore(storeName).getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror   = () => reject(req.error);
        });
    },

    _idbDelete(storeName, key) {
        return new Promise((resolve, reject) => {
            const tx  = this.db.transaction(storeName, 'readwrite');
            const req = tx.objectStore(storeName).delete(key);
            req.onsuccess = () => resolve();
            req.onerror   = () => reject(req.error);
        });
    },

    // ============================================================
    // UTILS
    // ============================================================
    async getPendingCount() {
        const ops = await this.getPendingOps();
        return ops.length;
    },

    _notify(msg, type = 'info') {
        if (typeof Utils !== 'undefined' && Utils.showToast)
            Utils.showToast(msg, type);
        else if (typeof App !== 'undefined' && App.showNotification)
            App.showNotification(msg, type);
        else
            console.log(`[${type.toUpperCase()}] ${msg}`);
    },

    async refreshAllModules() {
        try {
            if (typeof Ventes   !== 'undefined' && Ventes.loadAllData)   await Ventes.loadAllData();
            if (typeof Clients  !== 'undefined' && Clients.loadData)     await Clients.loadData();
            if (typeof Produits !== 'undefined' && Produits.loadData)    await Produits.loadData();
            if (typeof Ventes   !== 'undefined' && Ventes.renderTable)   Ventes.renderTable();
            if (typeof Ventes   !== 'undefined' && Ventes.updateStats)   Ventes.updateStats();
        } catch (e) {
            console.warn('⚠️ refreshAllModules:', e);
        }
    },
};

window.OfflineManager = OfflineManager;
console.log('✅ OfflineManager v2 loaded');