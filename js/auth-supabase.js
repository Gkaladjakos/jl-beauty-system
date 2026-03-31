// ============================================
// AUTHENTIFICATION SUPABASE - VERSION FINALE
// JL BEAUTY SYSTEM - PRODUCTION
// ============================================

const AuthSupabase = {
    supabase: null,
    currentUser: null,

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

    async login(email, password) {
        console.log('🔐 LOGIN ATTEMPT:', email);

        if (!this.init()) {
            return { success: false, error: 'Configuration Supabase manquante' };
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
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

            let userProfile = null;
            try {
                const { data: profile, error: profileError } = await this.supabase
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
                console.warn('⚠️ Profile fetch failed, using defaults:', err.message);
            }

            const userData = {
                id: data.user.id,
                email: data.user.email,
                nom: userProfile?.nom || data.user.email.split('@')[0],
                role: userProfile?.role || 'gerant',
                permissions: userProfile?.role === 'gerant'
                    ? ['all']
                    : ['dashboard', 'clients', 'rendez-vous', 'ventes']
            };

            this.currentUser = userData;
            localStorage.setItem('jlbeauty_user', JSON.stringify(userData));
            localStorage.setItem('jlbeauty_auth_type', 'supabase');

            // ✅ Si des ops étaient en attente → lancer la sync au login
            if (window.OfflineManager && navigator.onLine) {
                const pending = await OfflineManager.getPendingCount();
                if (pending > 0) {
                    console.log(`🔄 ${pending} op(s) en attente → sync au login`);
                    await OfflineManager.syncPendingOps();
                }
            }

            console.log('✅ LOGIN SUCCESS:', userData.email);
            return { success: true, user: userData };

        } catch (error) {
            console.error('💥 Login error:', error);
            return {
                success: false,
                error: 'Erreur de connexion. Vérifiez votre connexion internet.'
            };
        }
    },

    async checkAuth() {
        console.log('🔍 checkAuth() called');

        try {
            const storedUser = localStorage.getItem('jlbeauty_user');
            const authType   = localStorage.getItem('jlbeauty_auth_type');

            console.log('📦 localStorage check:', {
                hasUser: !!storedUser,
                authType: authType
            });

            if (storedUser && authType === 'supabase') {
                try {
                    const userData = JSON.parse(storedUser);
                    this.currentUser = userData;
                    console.log('✅ User loaded from localStorage:', userData.email);
                    console.log('📊 Role:', userData.role);
                    return userData;
                } catch (e) {
                    console.error('❌ Error parsing stored user:', e);
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

            console.log('✅ Supabase session found, creating user data...');

            const userData = {
                id: session.user.id,
                email: session.user.email,
                nom: session.user.email.split('@')[0],
                role: 'gerant',
                permissions: ['all']
            };

            this.currentUser = userData;
            localStorage.setItem('jlbeauty_user', JSON.stringify(userData));
            localStorage.setItem('jlbeauty_auth_type', 'supabase');

            console.log('✅ User authenticated from Supabase session');
            return userData;

        } catch (error) {
            console.error('💥 checkAuth error:', error);
            return null;
        }
    },

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

    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    hasPermission(module) {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (user.permissions && user.permissions.includes('all')) return true;
        return user.permissions && user.permissions.includes(module);
    },

    getRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    },

    // ✅ MODIFICATION ICI — avertissement si ops en attente avant logout
    async logout() {
        try {
            // ✅ Vérifier les ops en attente avant de déconnecter
            if (window.OfflineManager) {
                const pending = await OfflineManager.getPendingCount();
                if (pending > 0) {
                    const confirmed = window.confirm(
                        `⚠️ Attention : ${pending} opération(s) n'ont pas encore été synchronisées.\n\n` +
                        `Si vous vous déconnectez maintenant, elles seront perdues.\n\n` +
                        `Voulez-vous quand même vous déconnecter ?`
                    );
                    if (!confirmed) {
                        console.log('🚫 Logout annulé — ops en attente non synchronisées');
                        return; // ✅ Annuler le logout
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
    window.AuthSupabase = AuthSupabase;
    console.log('✅ AuthSupabase loaded and ready');
}