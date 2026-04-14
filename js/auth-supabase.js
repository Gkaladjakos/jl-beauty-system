// ============================================
// AUTHENTIFICATION SUPABASE - VERSION FINALE
// JL BEAUTY SYSTEM
// ============================================

// =========================================================================
// ✅ PERMISSIONS PAR RÔLE — source de vérité unique
// =========================================================================
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
            'ventes'
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

        // ✅ Démarrer l'écouteur de session dès l'init (une seule fois)
        this.startAuthListener();

        console.log('✅ AuthSupabase initialized');
        return true;
    },

    // =========================================================================
    // ✅ startAuthListener()
    // Réagit en temps réel : refresh token, signOut autre onglet, etc.
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

            // Revalider le profil silencieusement à chaque changement de session
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
    // ✅ _logConnexion()
    // Enregistre chaque événement dans connexion_logs — ne bloque jamais l'app
    // =========================================================================
    async _logConnexion({ userId = null, email = '', statut, details = null }) {
        try {
            if (!this.supabase) return;
            await this.supabase.from('connexion_logs').insert({
                user_id:    userId,
                email:      email,
                statut:     statut,   // 'succes' | 'echec' | 'deconnexion'
                user_agent: navigator.userAgent,
                details:    details,
            });
        } catch (err) {
            console.warn('[Auth] _logConnexion failed (non-bloquant):', err.message);
        }
    },

    // =========================================================================
    // login()  ✅ + log automatique succès/échec
    // =========================================================================
    async login(email, password) {
        console.log('🔐 LOGIN ATTEMPT:', email);

        if (!this.init()) {
            return { success: false, error: 'Configuration Supabase manquante' };
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('❌ Auth error:', error.message);

                // ✅ Log échec
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
                        : error.message
                };
            }

            console.log('✅ Supabase auth successful');

            const { data: sessionData } = await this.supabase.auth.getSession();
            const session      = sessionData?.session;
            const sessionEmail = session?.user?.email || data?.user?.email || email;

            // Récupérer le profil utilisateur
            let userProfile = null;
            try {
                const { data: profiles, error: profileError } = await this.supabase
                    .from('users')
                    .select('role, nom')
                    .eq('id', data.user.id);   // ✅ par uuid, plus fiable que email

                if (profileError) {
                    console.warn('[Auth] Profil fetch failed:', profileError);
                } else if (Array.isArray(profiles) && profiles.length > 0) {
                    userProfile = profiles[0];
                    console.log('✅ User profile found:', userProfile);
                } else {
                    console.warn('⚠️ No profile found, using defaults');
                }
            } catch (err) {
                console.warn('⚠️ Profile fetch exception:', err?.message || err);
            }

            const role     = userProfile?.role || DEFAULT_ROLE;
            const userData = {
                id:          data.user.id,
                email:       data.user.email,
                nom:         userProfile?.nom || data.user.email.split('@')[0],
                role,
                permissions: this._resolvePermissions(role)
            };

            this.currentUser = userData;
            localStorage.setItem('jlbeauty_user', JSON.stringify(userData));
            localStorage.setItem('jlbeauty_auth_type', 'supabase');

            // ✅ Log succès
            await this._logConnexion({
                userId:  data.user.id,
                email:   data.user.email,
                statut:  'succes',
                details: `Rôle: ${role}`,
            });

            // Sync des opérations en attente
            if (window.OfflineManager && navigator.onLine) {
                const pending = await OfflineManager.getPendingCount();
                if (pending > 0) {
                    console.log(`🔄 ${pending} op(s) en attente → sync au login`);
                    await OfflineManager.syncPendingOps();
                }
            }

            console.log('✅ LOGIN SUCCESS:', userData.email,
                        '| Rôle:', userData.role,
                        '| Pages:', userData.permissions);

            return { success: true, user: userData };

        } catch (error) {
            console.error('💥 Login error:', error);
            return {
                success: false,
                error: 'Erreur de connexion. Vérifiez votre connexion internet.'
            };
        }
    },

    // =========================================================================
    // checkAuth()  ✅ requête profil par id (uuid)
    // =========================================================================
    async checkAuth() {
        console.log('🔍 checkAuth() called');

        try {
            const storedUserStr = localStorage.getItem('jlbeauty_user');
            const authType      = localStorage.getItem('jlbeauty_auth_type');

            let cachedUser = null;
            if (storedUserStr && authType === 'supabase') {
                try {
                    cachedUser = JSON.parse(storedUserStr);
                } catch (e) {
                    console.warn('⚠️ localStorage parse failed, cleaning');
                    localStorage.removeItem('jlbeauty_user');
                    localStorage.removeItem('jlbeauty_auth_type');
                }
            }

            if (!this.init()) {
                console.error('❌ Supabase not initialized');
                return null;
            }

            const { data: { session } } = await this.supabase.auth.getSession();
            if (!session) {
                console.log('❌ No active session found');
                return null;
            }

            let profile     = null;
            let dbReachable = false;

            try {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('role, nom')
                    .eq('id', session.user.id);   // ✅ par uuid

                if (error) {
                    console.warn('⚠️ users table error:', error.message);
                } else {
                    dbReachable = true;
                    profile = (Array.isArray(data) && data.length > 0)
                        ? data[0]
                        : null;
                    console.log('🔎 Profile from DB:', profile);
                }
            } catch (e) {
                console.warn('⚠️ users table exception:', e?.message || e);
            }

            let role = DEFAULT_ROLE;

            if (profile?.role) {
                role = profile.role;
                console.log(`✅ Rôle issu de la DB: ${role}`);
            } else if (dbReachable) {
                role = DEFAULT_ROLE;
                console.warn(
                    `⚠️ Aucun profil trouvé pour ${session.user.email}.` +
                    ` Rôle par défaut: ${DEFAULT_ROLE}.`
                );
            } else {
                const sameEmail = cachedUser?.email === session.user.email;
                if (sameEmail && cachedUser?.role) {
                    role = cachedUser.role;
                    console.warn(`⚠️ DB inaccessible → rôle cache: ${role}`);
                } else {
                    role = DEFAULT_ROLE;
                    console.warn('⚠️ DB inaccessible + cache invalide → DEFAULT_ROLE');
                }
            }

            const finalUserData = {
                id:               session.user.id,
                email:            session.user.email,
                nom:              profile?.nom
                                    || cachedUser?.nom
                                    || session.user.email.split('@')[0],
                role,
                permissions:      this._resolvePermissions(role),
                _revalidatedRole: dbReachable
            };

            this.currentUser = finalUserData;
            localStorage.setItem('jlbeauty_user', JSON.stringify(finalUserData));
            localStorage.setItem('jlbeauty_auth_type', 'supabase');

            console.log('✅ checkAuth OK', {
                email:       finalUserData.email,
                role:        finalUserData.role,
                permissions: finalUserData.permissions,
                dbReachable
            });

            return finalUserData;

        } catch (error) {
            console.error('💥 checkAuth error:', error);
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
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    },

    // =========================================================================
    // isLoggedIn()
    // =========================================================================
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    // =========================================================================
    // hasPermission()
    // =========================================================================
    hasPermission(page) {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (user.permissions?.includes('all')) return true;
        return user.permissions?.includes(page) ?? false;
    },

    // =========================================================================
    // getRole()
    // =========================================================================
    getRole() {
        return this.getCurrentUser()?.role || null;
    },

    // =========================================================================
    // ✅ isGerant() — vérifie gérant OU admin
    // =========================================================================
    isGerant() {
        return ['gerant', 'admin'].includes(this.getRole());
    },

    // =========================================================================
    // isCaisse()
    // =========================================================================
    isCaisse() {
        return this.getRole() === 'caissiere';
    },

    // =========================================================================
    // logout()  ✅ + log déconnexion
    // =========================================================================
    async logout() {
        try {
            if (window.OfflineManager) {
                const pending = await OfflineManager.getPendingCount();
                if (pending > 0) {
                    const confirmed = window.confirm(
                        `⚠️ Attention : ${pending} opération(s) n'ont pas encore ` +
                        `été synchronisées.\n\n` +
                        `Si vous vous déconnectez maintenant, elles seront perdues.\n\n` +
                        `Voulez-vous quand même vous déconnecter ?`
                    );
                    if (!confirmed) {
                        console.log('🚫 Logout annulé — ops en attente');
                        return;
                    }
                }
            }

            // ✅ Log déconnexion avant signOut
            const user = this.getCurrentUser();
            if (user) {
                await this._logConnexion({
                    userId:  user.id,
                    email:   user.email,
                    statut:  'deconnexion',
                    details: `Rôle: ${user.role}`,
                });
            }

            if (this.init()) {
                await this.supabase.auth.signOut();
            }

        } catch (e) {
            console.warn('⚠️ Supabase signOut error:', e?.message || e);
        } finally {
            this.currentUser = null;
            localStorage.removeItem('jlbeauty_user');
            localStorage.removeItem('jlbeauty_auth_type');
            console.log('✅ Logged out successfully');
            window.location.href = 'login.html';
        }
    }
};

if (typeof window !== 'undefined') {
    window.AuthSupabase     = AuthSupabase;
    window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
    console.log('✅ AuthSupabase loaded and ready');
}