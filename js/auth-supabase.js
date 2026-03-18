// ✅ VERSION PRODUCTION - Supabase Authentication
// Système d'authentification sécurisé utilisant Supabase Auth
// Mots de passe hashés, tokens JWT, niveau production

const AuthSupabase = {
    supabase: null,
    currentUser: null,

    // Initialize Supabase client
    init() {
        // Utiliser le client Supabase déjà configuré dans supabase-config.js
        if (typeof window.supabase === 'undefined' || !window.supabase) {
            console.error('❌ Supabase client not found. Make sure supabase-config.js is loaded before auth-supabase.js');
            console.error('Expected: window.supabase to be defined');
            return false;
        }

        // Utiliser le client déjà créé (pas besoin de recréer)
        this.supabase = window.supabase;
        console.log('✅ AuthSupabase initialized with existing client');
        return true;
    },

    // Login with email and password
    async login(email, password) {
        if (!this.init()) {
            return {
                success: false,
                error: 'Configuration Supabase manquante'
            };
        }

        try {
            // Authenticate with Supabase
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('Supabase login error:', error);
                return {
                    success: false,
                    error: this.getErrorMessage(error)
                };
            }

            // Get user profile from custom users table
            const { data: userProfile, error: profileError } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (profileError) {
                console.error('Error fetching user profile:', profileError);
                // Continue anyway with basic auth data
            }

            // Store user data
            const userData = {
                id: data.user.id,
                email: data.user.email,
                nom: userProfile?.nom || 'Utilisateur',
                role: userProfile?.role || 'caissiere',
                permissions: this.getPermissionsByRole(userProfile?.role || 'caissiere')
            };

            this.currentUser = userData;
            localStorage.setItem('jlbeauty_user', JSON.stringify(userData));
            localStorage.setItem('jlbeauty_auth_type', 'supabase');

            return {
                success: true,
                user: userData
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: 'Erreur de connexion. Vérifiez votre connexion internet.'
            };
        }
    },

    // Logout
    async logout() {
        if (this.supabase) {
            await this.supabase.auth.signOut();
        }
        
        this.currentUser = null;
        localStorage.removeItem('jlbeauty_user');
        localStorage.removeItem('jlbeauty_auth_type');
        window.location.href = 'login.html';
    },

    // Get current user
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

    // Check if user is logged in
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    // Check if user has permission
    hasPermission(module) {
        const user = this.getCurrentUser();
        if (!user) return false;

        // Gérant a accès à tout
        if (user.permissions && user.permissions.includes('all')) return true;

        // Vérifier la permission spécifique
        return user.permissions && user.permissions.includes(module);
    },

    // Get user role
    getRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    },

    // Get permissions by role
    getPermissionsByRole(role) {
        const permissions = {
            gerant: ['all'], // Accès complet
            caissiere: ['dashboard', 'clients', 'rendez-vous', 'ventes', 'consommables'] // Accès limité
        };

        return permissions[role] || permissions['caissiere'];
    },

    // Require auth (redirect if not logged in)
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Check session validity
    async checkSession() {
        if (!this.init()) return false;

        try {
            const { data, error } = await this.supabase.auth.getSession();
            
            if (error || !data.session) {
                this.logout();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Session check error:', error);
            return false;
        }
    },

    // Get user-friendly error message
    getErrorMessage(error) {
        const messages = {
            'Invalid login credentials': 'Email ou mot de passe incorrect',
            'Email not confirmed': 'Email non confirmé',
            'User not found': 'Utilisateur introuvable',
            'Network request failed': 'Erreur de connexion réseau'
        };

        return messages[error.message] || error.message || 'Erreur de connexion';
    },

    // Init auth check on page load
    async initPageAuth() {
        // Vérifier si on est sur la page de login
        if (window.location.pathname.includes('login.html')) {
            // Si déjà connecté, rediriger vers l'app
            if (this.isLoggedIn()) {
                window.location.href = 'index-supabase.html';
            }
            return;
        }

        // Sur les autres pages, vérifier l'authentification
        if (!this.requireAuth()) return;

        // Vérifier la validité de la session
        const isValid = await this.checkSession();
        if (!isValid) {
            this.logout();
        }
    }
};

// Auto-init
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Ne pas init sur la page de login (sera géré par le formulaire)
        if (!window.location.pathname.includes('login.html')) {
            AuthSupabase.initPageAuth();
        }
    });
}
