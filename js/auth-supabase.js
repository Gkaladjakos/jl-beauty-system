// ============================================
// AUTHENTIFICATION SUPABASE - VERSION FINALE
// JL BEAUTY SYSTEM
// ============================================

const ROLE_PERMISSIONS = {
    gerant: {
        label: 'Gérant',
        pages: ['all']
    },
    caissiere: {
        label: 'Caissière',
        pages: [
            'dashboard',
            'clients',
            'rendez-vous',
            'produits',
            'materiels',
            'consommables',
            'ventes',
            'cloture-caisse'
        ]
    }
};

const DEFAULT_ROLE = 'caissiere';

const AuthSupabase = {
    supabase:         null,
    currentUser:      null,
    _listenerStarted: false,

    // =========================================================================
    // init()
    // =========================================================================
    init() {
        if (this.supabase) return true;
        if (typeof window.supabase === 'undefined' || !window.supabase) {
            console.error('❌ Supabase client not found');
            return false;
        }
        this.supabase = window.supabase;
        this.startAuthListener();
        console.log('✅ AuthSupabase initialized');
        return true;
    },

    // =========================================================================
    // startAuthListener()
    // =========================================================================
    startAuthListener() {
        if (!this.supabase || this._listenerStarted) return;
        this._listenerStarted = true;

        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Auth] onAuthStateChange:', event);

            if (event === 'SIGNED_OUT' || !session) {
                this.currentUser = null;
                localStorage.removeItem('jlbeauty_user');
                localStorage.removeItem('jlbeauty_auth_type');
                return;
            }

            if (['TOKEN_REFRESHED', 'SIGNED_IN', 'USER_UPDATED'].includes(event)) {
                await this.checkAuth();
            }
        });
    },

    // =========================================================================
    // _resolvePermissions()
    // =========================================================================
    _resolvePermissions(role) {
        const config = ROLE_PERMISSIONS[role];
        if (!config) {
            console.warn(`[Auth] Rôle inconnu "${role}" → accès minimal`);
            return ['dashboard'];
        }
        return config.pages;
    },

    // =========================================================================
    // ✅ NOUVEAU — Vérification réseau réelle (navigator.onLine pas fiable)
    // =========================================================================
    async _isNetworkAvailable() {
        try {
            const baseUrl = this.supabase?.supabaseUrl
                          || 'https://gxlgxlkcisesywnzckhg.supabase.co';
            const res = await fetch(`${baseUrl}/rest/v1/`, {
                method: 'HEAD',
                cache:  'no-store',
                signal: AbortSignal.timeout(4000),
            });
            return res.ok || res.status < 500;
        } catch {
            return false;
        }
    },

    // =========================================================================
    // ✅ NOUVEAU — Cache session pour login offline
    // =========================================================================
    async _cacheSession(email, password, userData) {
        try {
            const hash = await this._hashPassword(password);
            localStorage.setItem('jlbeauty_offline_session', JSON.stringify({
                email:    email.toLowerCase().trim(),
                hash,
                userData,
                cachedAt: new Date().toISOString(),
            }));
            console.log('🔐 Session cachée pour usage offline');
        } catch (e) {
            console.warn('⚠️ _cacheSession failed:', e.message);
        }
    },

    async _hashPassword(password) {
        const buf = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(password + 'jlbeauty_salt_2025')
        );
        return Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // =========================================================================
    // ✅ NOUVEAU — Tentative login offline
    // =========================================================================
    async _tryOfflineLogin(email, password) {
        try {
            const raw = localStorage.getItem('jlbeauty_offline_session');
            if (!raw) return { success: false, reason: 'Aucune session en cache' };

            const cached = JSON.parse(raw);
            const emailOk = cached.email === email.toLowerCase().trim();
            const hashOk  = (await this._hashPassword(password)) === cached.hash;

            if (emailOk && hashOk) {
                console.log('✅ Login offline validé');
                return { success: true, userData: cached.userData };
            }

            return {
                success: false,
                reason: 'Email ou mot de passe incorrect'
            };
        } catch (e) {
            return { success: false, reason: 'Erreur lecture cache offline' };
        }
    },

    // =========================================================================
    // _logConnexion()
    // =========================================================================
    async _logConnexion({ userId = null, email = '', statut, details = null }) {
        try {
            if (!this.supabase) return;
            await this.supabase.from('connexion_logs').insert({
                user_id:    userId,
                email,
                statut,
                user_agent: navigator.userAgent,
                details,
            });
        } catch (err) {
            console.warn('[Auth] _logConnexion failed (non-bloquant):', err.message);
        }
    },

    // =========================================================================
    // ✅ login() — avec fallback offline complet
    // =========================================================================
    async login(email, password) {
        console.log('🔐 LOGIN ATTEMPT:', email);

        if (!this.init()) {
            return { success: false, error: 'Configuration Supabase manquante' };
        }

        // ── 1. Vérifier le réseau réellement ──────────────────────────────────
        const online = await this._isNetworkAvailable();

        // ── 2. MODE OFFLINE ───────────────────────────────────────────────────
        if (!online) {
            console.warn('📴 Réseau indisponible → tentative login offline');

            const result = await this._tryOfflineLogin(email, password);

            if (result.success) {
                this.currentUser = result.userData;
                localStorage.setItem('jlbeauty_user',      JSON.stringify(result.userData));
                localStorage.setItem('jlbeauty_auth_type', 'offline');

                console.log('✅ LOGIN OFFLINE SUCCESS:', result.userData.email);
                return { success: true, user: result.userData, offline: true };
            }

            return {
                success: false,
                error: result.reason === 'Aucune session en cache'
                    ? '📴 Hors connexion — Connectez-vous une première fois avec internet'
                    : `📴 Hors connexion — ${result.reason}`,
                offline: true,
            };
        }

        // ── 3. MODE ONLINE — login normal ─────────────────────────────────────
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('❌ Auth error:', error.message);
                await this._logConnexion({
                    email,
                    statut:  'echec',
                    details: error.message === 'Invalid login credentials'
                        ? 'Email ou mot de passe incorrect'
                        : error.message,
                });
                return {
                    success: false,
                    error: error.message === 'Invalid login credentials'
                        ? 'Email ou mot de passe incorrect'
                        : error.message,
                };
            }

            console.log('✅ Supabase auth successful');

            // Récupérer le profil
            let userProfile = null;
            try {
                const { data: profiles } = await this.supabase
                    .from('users')
                    .select('role, nom')
                    .eq('id', data.user.id);

                if (Array.isArray(profiles) && profiles.length > 0)
                    userProfile = profiles[0];
            } catch (e) {
                console.warn('⚠️ Profile fetch exception:', e?.message);
            }

            const role     = userProfile?.role || DEFAULT_ROLE;
            const userData = {
                id:          data.user.id,
                email:       data.user.email,
                nom:         userProfile?.nom || data.user.email.split('@')[0],
                role,
                permissions: this._resolvePermissions(role),
            };

            this.currentUser = userData;
            localStorage.setItem('jlbeauty_user',      JSON.stringify(userData));
            localStorage.setItem('jlbeauty_auth_type', 'supabase');

            // ✅ Cacher la session pour le prochain usage offline
            await this._cacheSession(email, password, userData);

            await this._logConnexion({
                userId:  data.user.id,
                email:   data.user.email,
                statut:  'succes',
                details: `Rôle: ${role}`,
            });

            // Sync ops en attente
            if (window.OfflineManager) {
                const pending = await OfflineManager.getPendingCount();
                if (pending > 0) {
                    console.log(`🔄 ${pending} op(s) en attente → sync au login`);
                    await OfflineManager.syncPendingOps();
                }
            }

            console.log('✅ LOGIN SUCCESS:', userData.email, '| Rôle:', role);
            return { success: true, user: userData };

        } catch (error) {
            console.error('💥 Login error:', error);
            return {
                success: false,
                error: '❌ Erreur inattendue lors de la connexion',
            };
        }
    },

    // =========================================================================
    // ✅ checkAuth() — avec fallback offline
    // =========================================================================
    async checkAuth() {
        console.log('🔍 checkAuth() called');

        try {
            // ── Cache localStorage ─────────────────────────────────────────
            const storedUserStr = localStorage.getItem('jlbeauty_user');
            const authType      = localStorage.getItem('jlbeauty_auth_type');
            let   cachedUser    = null;

            if (storedUserStr) {
                try { cachedUser = JSON.parse(storedUserStr); } catch {}
            }

            if (!this.init()) {
                // Supabase pas dispo → retourner le cache si existant
                if (cachedUser) {
                    console.warn('⚠️ Supabase non init → fallback cache');
                    this.currentUser = cachedUser;
                    return cachedUser;
                }
                return null;
            }

            // ── Vérifier réseau ─────────────────────────────────────────────
            const online = await this._isNetworkAvailable();

            if (!online) {
                // ── OFFLINE : retourner le cache sans requête Supabase ──────
                if (cachedUser) {
                    console.warn('📴 Offline → session depuis cache localStorage');
                    this.currentUser = cachedUser;
                    return cachedUser;
                }
                console.warn('📴 Offline + aucun cache → non authentifié');
                return null;
            }

            // ── ONLINE : vérification normale ───────────────────────────────
            const { data: { session } } = await this.supabase.auth.getSession();
            if (!session) {
                // ✅ Session Supabase expirée mais cache valide → garder offline
                if (cachedUser && authType === 'offline') {
                    console.warn('⚠️ Session expirée mais mode offline actif');
                    this.currentUser = cachedUser;
                    return cachedUser;
                }
                console.log('❌ No active session found');
                return null;
            }

            // Récupérer le profil DB
            let profile     = null;
            let dbReachable = false;

            try {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('role, nom')
                    .eq('id', session.user.id);

                if (!error) {
                    dbReachable = true;
                    profile = Array.isArray(data) && data.length > 0 ? data[0] : null;
                }
            } catch (e) {
                console.warn('⚠️ users table exception:', e?.message);
            }

            // Résolution du rôle
            let role = DEFAULT_ROLE;
            if (profile?.role)          role = profile.role;
            else if (!dbReachable && cachedUser?.email === session.user.email && cachedUser?.role)
                                        role = cachedUser.role;

            const finalUserData = {
                id:               session.user.id,
                email:            session.user.email,
                nom:              profile?.nom || cachedUser?.nom || session.user.email.split('@')[0],
                role,
                permissions:      this._resolvePermissions(role),
                _revalidatedRole: dbReachable,
            };

            this.currentUser = finalUserData;
            localStorage.setItem('jlbeauty_user',      JSON.stringify(finalUserData));
            localStorage.setItem('jlbeauty_auth_type', 'supabase');

            console.log('✅ checkAuth OK', { email: finalUserData.email, role, dbReachable });
            return finalUserData;

        } catch (error) {
            console.error('💥 checkAuth error:', error);

            // ✅ Dernier recours : retourner le cache plutôt que null
            const raw = localStorage.getItem('jlbeauty_user');
            if (raw) {
                try {
                    const cached = JSON.parse(raw);
                    console.warn('⚠️ checkAuth exception → fallback cache');
                    this.currentUser = cached;
                    return cached;
                } catch {}
            }
            return null;
        }
    },

    // =========================================================================
    // getCurrentUser()
    // =========================================================================
    getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        const userStr = localStorage.getItem('jlbeauty_user');
        if (!userStr) return null;
        try {
            this.currentUser = JSON.parse(userStr);
            return this.currentUser;
        } catch {
            return null;
        }
    },

    isLoggedIn()         { return this.getCurrentUser() !== null; },
    getRole()            { return this.getCurrentUser()?.role || null; },
    isGerant()           { return ['gerant', 'admin'].includes(this.getRole()); },
    isCaisse()           { return this.getRole() === 'caissiere'; },
    hasPermission(page)  {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (user.permissions?.includes('all')) return true;
        return user.permissions?.includes(page) ?? false;
    },

    // =========================================================================
    // ✅ logout() — avec avertissement ops en attente
    // =========================================================================
    async logout() {
        try {
            if (window.OfflineManager) {
                const pending = await OfflineManager.getPendingCount();
                if (pending > 0) {
                    const ok = window.confirm(
                        `⚠️ ${pending} opération(s) non synchronisée(s).\n\n` +
                        `Déconnecter quand même ?`
                    );
                    if (!ok) return;
                }
            }

            const user = this.getCurrentUser();
            if (user) {
                await this._logConnexion({
                    userId:  user.id,
                    email:   user.email,
                    statut:  'deconnexion',
                    details: `Rôle: ${user.role}`,
                });
            }

            if (this.init()) await this.supabase.auth.signOut();

        } catch (e) {
            console.warn('⚠️ Supabase signOut error:', e?.message);
        } finally {
            this.currentUser = null;
            localStorage.removeItem('jlbeauty_user');
            localStorage.removeItem('jlbeauty_auth_type');
            // ✅ On garde jlbeauty_offline_session pour le prochain login offline
            console.log('✅ Logged out');
            window.location.href = 'login.html';
        }
    }
};

if (typeof window !== 'undefined') {
    window.AuthSupabase     = AuthSupabase;
    window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
    console.log('✅ AuthSupabase loaded and ready');
}