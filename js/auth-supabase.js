// ============================================
// AUTHENTIFICATION SUPABASE - VERSION FINALE
// JL BEAUTY SYSTEM - PRODUCTION
// ============================================

// =========================================================================
// ✅ PERMISSIONS PAR RÔLE — source de vérité unique
// Modifier ici pour ajuster les accès de chaque rôle
// =========================================================================
const ROLE_PERMISSIONS = {
    gerant: {
        label: 'Gérant',
        pages: ['all']   // accès total
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
            // ❌ 'coiffeuses'  — interdit
            // ❌ 'services'    — interdit
            // ❌ 'commissions' — interdit
        ]
    }
};

const AuthSupabase = {
    supabase: null,
    currentUser: null,

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
        console.log('✅ AuthSupabase initialized');
        return true;
    },

    // =========================================================================
    // ✅ UTILITAIRE — Résoudre les permissions d'un rôle
    // =========================================================================
    _resolvePermissions(role) {
        const config = ROLE_PERMISSIONS[role];
        if (!config) {
            // Rôle inconnu → accès minimal par sécurité
            console.warn(`[Auth] Rôle inconnu "${role}" → accès minimal`);
            return ['dashboard'];
        }
        return config.pages;
    },

    // =========================================================================
    // login()
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
                return {
                    success: false,
                    error: error.message === 'Invalid login credentials'
                        ? 'Email ou mot de passe incorrect'
                        : error.message
                };
            }

            console.log('✅ Supabase auth successful');

            // Récupérer le profil utilisateur
            let userProfile = null;
            try {
                const { data: profile, error: profileError } =
                    await this.supabase
                        .from('users')
                        .select('*')
                        .eq('email', email)
                        .single();

                if (!profileError && profile) {
                    userProfile = profile;
                    console.log('✅ User profile found:', profile);
                } else {
                    console.warn('⚠️ No profile in users table, using defaults');
                }
            } catch (err) {
                console.warn('⚠️ Profile fetch failed:', err.message);
            }

            // ✅ Rôle déterminé depuis le profil, sinon 'gerant' par défaut
            const role = userProfile?.role || 'gerant';

            const userData = {
                id:          data.user.id,
                email:       data.user.email,
                nom:         userProfile?.nom || data.user.email.split('@')[0],
                role:        role,
                // ✅ Permissions résolues via ROLE_PERMISSIONS
                permissions: this._resolvePermissions(role)
            };

            this.currentUser = userData;
            localStorage.setItem('jlbeauty_user',      JSON.stringify(userData));
            localStorage.setItem('jlbeauty_auth_type', 'supabase');

            // Sync des opérations en attente au login
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
    // checkAuth()
    // =========================================================================
    async checkAuth() {
        console.log('🔍 checkAuth() called');
    
        try {
            const storedUser = localStorage.getItem('jlbeauty_user');
            const authType   = localStorage.getItem('jlbeauty_auth_type');
    
            if (storedUser && authType === 'supabase') {
                try {
                    const userData = JSON.parse(storedUser);
    
                    // ✅ NOUVEAU — Revalider le rôle depuis Supabase
                    // au cas où le localStorage est obsolète
                    if (this.init()) {
                        try {
                            const { data: profile } = await this.supabase
                                .from('users')
                                .select('role, nom')
                                .eq('email', userData.email)
                                .single();
    
                            if (profile?.role && profile.role !== userData.role) {
                                console.warn(
                                    `[Auth] Rôle corrigé : ${userData.role} → ${profile.role}`
                                );
                                userData.role = profile.role;
                                userData.nom  = profile.nom || userData.nom;
                            }
                        } catch (e) {
                            // Pas de connexion — on garde le localStorage
                            console.warn('[Auth] Revalidation impossible (offline)');
                        }
                    }
    
                    // ✅ Recalculer les permissions après correction du rôle
                    userData.permissions = this._resolvePermissions(userData.role);
                    localStorage.setItem('jlbeauty_user', JSON.stringify(userData));
    
                    this.currentUser = userData;
                    console.log('✅ User loaded:', userData.email,
                                '| Rôle:', userData.role);
                    return userData;
    
                } catch (e) {
                    console.error('❌ Error parsing stored user:', e);
                    // ✅ localStorage corrompu → nettoyer
                    localStorage.removeItem('jlbeauty_user');
                    localStorage.removeItem('jlbeauty_auth_type');
                }
            }

            console.log('⚠️ No valid localStorage, checking Supabase session...');

            if (!this.init()) {
                console.error('❌ Supabase not initialized');
                return null;
            }

            const { data: { session } } = await this.supabase.auth.getSession();

            if (!session) {
                console.log('❌ No active session found');
                return null;
            }

            // Session Supabase trouvée — rôle par défaut gerant
            const role = 'gerant';
            const userData = {
                id:          session.user.id,
                email:       session.user.email,
                nom:         session.user.email.split('@')[0],
                role:        role,
                permissions: this._resolvePermissions(role)
            };

            this.currentUser = userData;
            localStorage.setItem('jlbeauty_user',      JSON.stringify(userData));
            localStorage.setItem('jlbeauty_auth_type', 'supabase');

            console.log('✅ User authenticated from Supabase session');
            return userData;

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
    // ✅ hasPermission() — vérifie si l'utilisateur peut accéder à une page
    // =========================================================================
    hasPermission(page) {
        const user = this.getCurrentUser();
        if (!user) return false;

        // 'all' = accès total (gerant)
        if (user.permissions && user.permissions.includes('all')) return true;

        return user.permissions && user.permissions.includes(page);
    },

    // =========================================================================
    // getRole()
    // =========================================================================
    getRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    },

    // =========================================================================
    // isGerant() — raccourci pratique
    // =========================================================================
    isGerant() {
        return this.getRole() === 'gerant';
    },

    // =========================================================================
    // isCaisse() — raccourci pratique
    // =========================================================================
    isCaisse() {
        return this.getRole() === 'caisse';
    },

    // =========================================================================
    // logout()
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

            if (this.init()) {
                await this.supabase.auth.signOut();
            }

        } catch (e) {
            console.warn('⚠️ Supabase signOut error:', e.message);

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
    window.AuthSupabase   = AuthSupabase;
    window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
    console.log('✅ AuthSupabase loaded and ready');
}