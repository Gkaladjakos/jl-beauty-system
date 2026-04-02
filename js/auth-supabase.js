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
        pages: ['all'] // accès total
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

// ✅ Valeur par défaut quand profil introuvable / revalidation KO
const DEFAULT_ROLE = 'caissiere';

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

            // ✅ On récupère la session pour avoir session.user.email de façon fiable
            const { data: sessionData } = await this.supabase.auth.getSession();
            const session = sessionData?.session;

            const sessionEmail = session?.user?.email || data?.user?.email || email;

            // ✅ Récupérer le profil utilisateur (tolère 0 row sans planter)
            let userProfile = null;
            try {
                const { data: profiles, error: profileError } = await this.supabase
                    .from('users')
                    .select('role, nom')
                    .eq('email', sessionEmail);

                if (profileError) {
                    console.warn('[Auth] Profil fetch failed:', profileError);
                } else if (Array.isArray(profiles) && profiles.length > 0) {
                    userProfile = profiles[0];
                    console.log('✅ User profile found:', userProfile);
                } else {
                    console.warn('⚠️ No profile found in users table, using defaults');
                }
            } catch (err) {
                console.warn('⚠️ Profile fetch exception:', err?.message || err);
            }

            const role = userProfile?.role || DEFAULT_ROLE;

            const userData = {
                id: data.user.id,
                email: data.user.email,
                nom: userProfile?.nom || data.user.email.split('@')[0],
                role,
                permissions: this._resolvePermissions(role)
            };

            this.currentUser = userData;
            localStorage.setItem('jlbeauty_user', JSON.stringify(userData));
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
            // 1) Essayer localStorage
            const storedUserStr = localStorage.getItem('jlbeauty_user');
            const authType = localStorage.getItem('jlbeauty_auth_type');

            let cachedUser = null;
            if (storedUserStr && authType === 'supabase') {
                try {
                    cachedUser = JSON.parse(storedUserStr);
                } catch (e) {
                    console.warn('⚠️ localStorage parse failed, cleaning');
                    localStorage.removeItem('jlbeauty_user');
                    localStorage.removeItem('jlbeauty_auth_type');
                    cachedUser = null;
                }
            }

            // 2) Vérifier session Supabase (source vérité)
            if (!this.init()) {
                console.error('❌ Supabase not initialized');
                return null;
            }

            const { data: { session } } = await this.supabase.auth.getSession();
            if (!session) {
                console.log('❌ No active session found');
                return null;
            }

            // 3) Revalider profil côté Supabase (si possible)
            let profile = null;
            let revalidated = false;

            try {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('role, nom')
                    .eq('email', session.user.email);

                if (error) {
                    console.warn('⚠️ Profil users revalidation failed:', error);
                } else {
                    profile = (Array.isArray(data) && data.length > 0) ? data[0] : null;
                    revalidated = true;
                }
            } catch (e) {
                console.warn(
                    '⚠️ Profil users revalidation exception (fallback):',
                    e?.message || e
                );
            }

            // 4) Déterminer le rôle final
            // Règle anti-bug: ne jamais réutiliser un rôle cache si email mismatch.
            let role = DEFAULT_ROLE;

            if (profile?.role) {
                role = profile.role;
            } else {
                const sameEmailAsCache =
                    cachedUser?.email && cachedUser.email === session.user.email;

                if (sameEmailAsCache && cachedUser?.role) {
                    console.warn(
                        `⚠️ Profil absent: rôle cache réutilisé (même email) => ${cachedUser.role}`
                    );
                    role = cachedUser.role;
                } else {
                    console.warn(
                        '⚠️ Profil absent: rôle cache ignoré (email mismatch ou cache invalide).'
                    );
                    role = DEFAULT_ROLE;
                }
            }

            const finalUserData = {
                id: session.user.id,
                email: session.user.email,
                nom: profile?.nom || cachedUser?.nom || session.user.email.split('@')[0],
                role,
                permissions: this._resolvePermissions(role),
                _revalidatedRole: revalidated
            };

            this.currentUser = finalUserData;
            localStorage.setItem('jlbeauty_user', JSON.stringify(finalUserData));
            localStorage.setItem('jlbeauty_auth_type', 'supabase');

            console.log(
                '✅ User authenticated / revalidated:',
                finalUserData.email,
                '| Rôle:', finalUserData.role,
                '| revalidated:', revalidated
            );

            // Bonus debug : pour confirmer si profile a réellement été trouvé
            // console.log('DEBUG profile=', profile);

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
    // ✅ hasPermission() — vérifie si l'utilisateur peut accéder à une page
    // =========================================================================
    hasPermission(page) {
        const user = this.getCurrentUser();
        if (!user) return false;

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
    // isGerant()
    // =========================================================================
    isGerant() {
        return this.getRole() === 'gerant';
    },

    // =========================================================================
    // isCaisse()
    // =========================================================================
    isCaisse() {
        return this.getRole() === 'caissiere';
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
                        `⚠️ Attention : ${pending} opération(s) n'ont pas encore été synchronisées.\n\n` +
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
    window.AuthSupabase = AuthSupabase;
    window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
    console.log('✅ AuthSupabase loaded and ready');
}