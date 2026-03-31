// js/offline-manager.js

const OfflineManager = {
    DB_NAME: 'salonDB',
    DB_VERSION: 1,
    db: null,
    isOnline: navigator.onLine,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;

                if (!db.objectStoreNames.contains('pending_ops')) {
                    const store = db.createObjectStore('pending_ops', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    store.createIndex('table_name', 'table_name', { unique: false });
                    store.createIndex('timestamp',  'timestamp',  { unique: false });
                }

                if (!db.objectStoreNames.contains('cache_ventes'))
                    db.createObjectStore('cache_ventes',    { keyPath: 'id' });
                if (!db.objectStoreNames.contains('cache_clients'))
                    db.createObjectStore('cache_clients',   { keyPath: 'id' });
                if (!db.objectStoreNames.contains('cache_produits'))
                    db.createObjectStore('cache_produits',  { keyPath: 'id' });
                if (!db.objectStoreNames.contains('cache_coiffeuses'))
                    db.createObjectStore('cache_coiffeuses',{ keyPath: 'id' });
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                console.log('✅ IndexedDB initialisée');
                resolve();
            };

            request.onerror = (e) => {
                console.error('❌ IndexedDB erreur:', e.target.error);
                reject(e.target.error);
            };
        });
    },

    startListening() {
        window.addEventListener('online', async () => {
            this.isOnline = true;
            this.showBanner('online');
            console.log('🌐 Connexion rétablie — synchronisation...');
            await this.syncPendingOps();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showBanner('offline');
            console.warn('📴 Hors connexion — mode offline activé');
        });
    },

    async addPendingOp(operation, tableName, data) {
        return new Promise((resolve, reject) => {
            const tx    = this.db.transaction('pending_ops', 'readwrite');
            const store = tx.objectStore('pending_ops');

            const op = {
                operation,
                table_name: tableName,
                data,
                timestamp: new Date().toISOString(),
                synced: false
            };

            const req = store.add(op);
            req.onsuccess = () => {
                console.log(`📥 Op en queue: ${operation} → ${tableName}`);
                resolve(req.result);
            };
            req.onerror = () => reject(req.error);
        });
    },

    async getPendingOps() {
        return new Promise((resolve, reject) => {
            const tx    = this.db.transaction('pending_ops', 'readonly');
            const store = tx.objectStore('pending_ops');
            const req   = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror  = () => reject(req.error);
        });
    },

    async deletePendingOp(id) {
        return new Promise((resolve, reject) => {
            const tx    = this.db.transaction('pending_ops', 'readwrite');
            const store = tx.objectStore('pending_ops');
            const req   = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror  = () => reject(req.error);
        });
    },

    async syncPendingOps() {
        const ops = await this.getPendingOps();

        if (ops.length === 0) {
            console.log('✅ Aucune opération en attente');
            return;
        }

        console.log(`🔄 ${ops.length} opération(s) à synchroniser...`);

        if (typeof App !== 'undefined') {
            App.showNotification(`Synchronisation de ${ops.length} opération(s)...`, 'info');
        }

        let success = 0;
        let errors  = 0;

        for (const op of ops) {
            try {
                if (op.operation === 'create') {
                    // ✅ On bypasse OfflineManager pour éviter boucle infinie
                    const { id, ...cleanData } = op.data;
                    const { data: result, error } = await window.supabase
                        .from(op.table_name)
                        .insert([cleanData])
                        .select()
                        .single();
                    if (error) throw error;

                } else if (op.operation === 'update') {
                    const { id, ...cleanData } = op.data;
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

                await this.deletePendingOp(op.id);
                success++;

            } catch (error) {
                console.error(`❌ Sync échouée pour op ${op.id}:`, error);
                errors++;
            }
        }

        if (typeof App !== 'undefined') {
            if (errors === 0) {
                App.showNotification(`✅ ${success} opération(s) synchronisée(s) !`, 'success');
            } else {
                App.showNotification(
                    `⚠️ ${success} ok — ${errors} échouée(s), vérifier la console`,
                    'warning'
                );
            }
        }

        await this.refreshAllModules();
    },

    async cacheData(storeName, records) {
        if (!this.db) return;
        return new Promise((resolve, reject) => {
            const tx    = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.clear();
            records.forEach(record => store.put(record));
            tx.oncomplete = () => {
                console.log(`✅ Cache [${storeName}] mis à jour — ${records.length} enregistrements`);
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        });
    },

    async getCachedData(storeName) {
        if (!this.db) return [];
        return new Promise((resolve, reject) => {
            const tx    = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req   = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror  = () => reject(req.error);
        });
    },

    showBanner(status) {
        let banner = document.getElementById('offline-banner');

        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'offline-banner';
            banner.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0;
                z-index: 9999;
                text-align: center;
                padding: 10px 16px;
                font-size: 14px;
                font-weight: 600;
                display: none;
                transition: all 0.3s ease;
            `;
            document.body.prepend(banner);
        }

        if (status === 'offline') {
            banner.style.background = '#ef4444';
            banner.style.color      = '#fff';
            banner.innerHTML = '📴 Hors connexion — Les données seront synchronisées automatiquement à la reconnexion';
            banner.style.display = 'block';
        } else {
            banner.style.background = '#22c55e';
            banner.style.color      = '#fff';
            banner.innerHTML        = '🌐 Connexion rétablie — Synchronisation en cours...';
            banner.style.display    = 'block';
            setTimeout(() => { banner.style.display = 'none'; }, 4000);
        }
    },

    async getPendingCount() {
        const ops = await this.getPendingOps();
        return ops.length;
    },

    async refreshAllModules() {
        try {
            if (typeof Ventes    !== 'undefined' && Ventes.loadAllData)    await Ventes.loadAllData();
            if (typeof Clients   !== 'undefined' && Clients.loadData)      await Clients.loadData();
            if (typeof Produits  !== 'undefined' && Produits.loadData)     await Produits.loadData();
            if (typeof Ventes    !== 'undefined' && Ventes.renderTable)    Ventes.renderTable();
            if (typeof Ventes    !== 'undefined' && Ventes.updateStats)    Ventes.updateStats();
        } catch(e) {
            console.warn('⚠️ refreshAllModules:', e);
        }
    }
};

window.OfflineManager = OfflineManager;
console.log('✅ OfflineManager loaded');