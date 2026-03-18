// ⚠️ AVERTISSEMENT : VERSION DEMO UNIQUEMENT ⚠️
// Ce système d'authentification utilise localStorage
// LES MOTS DE PASSE SONT STOCKÉS EN CLAIR
// NE PAS UTILISER EN PRODUCTION
// Pour la production, utilisez AuthSupabase (js/auth-supabase.js)

const AuthLocal = {
    // Utilisateurs de démonstration
    demoUsers: [
        {
            id: 'user-1',
            email: 'admin@jlbeauty.com',
            password: 'admin123', // ⚠️ EN CLAIR - DEMO SEULEMENT
            nom: 'Administrateur',
            role: 'gerant',
            permissions: ['all'] // Accès complet
        },
        {
            id: 'user-2',
            email: 'caisse@jlbeauty.com',
            password: 'caisse123', // ⚠️ EN CLAIR - DEMO SEULEMENT
            nom: 'Caissière',
            role: 'caissiere',
            permissions: ['dashboard', 'clients', 'rendez-vous', 'ventes', 'consommables'] // Accès limité
        }
    ],

    // Login
    async login(email, password) {
        // Simulation d'une requête réseau (pour réalisme)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Rechercher l'utilisateur
        const user = this.demoUsers.find(u => u.email === email && u.password === password);

        if (!user) {
            return {
                success: false,
                error: 'Email ou mot de passe incorrect'
            };
        }

        // Stocker l'utilisateur connecté (sans le mot de passe)
        const { password: _, ...userWithoutPassword } = user;
        localStorage.setItem('jlbeauty_user', JSON.stringify(userWithoutPassword));
        localStorage.setItem('jlbeauty_auth_type', 'local');

        return {
            success: true,
            user: userWithoutPassword
        };
    },

    // Logout
    logout() {
        localStorage.removeItem('jlbeauty_user');
        localStorage.removeItem('jlbeauty_auth_type');
        window.location.href = 'login.html';
    },

    // Get current user
    getCurrentUser() {
        const userStr = localStorage.getItem('jlbeauty_user');
        if (!userStr) return null;

        try {
            return JSON.parse(userStr);
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
        if (user.permissions.includes('all')) return true;

        // Vérifier la permission spécifique
        return user.permissions.includes(module);
    },

    // Get user role
    getRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    },

    // Require auth (redirect if not logged in)
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Init auth check on page load
    init() {
        // Vérifier si on est sur la page de login
        if (window.location.pathname.includes('login.html')) {
            // Si déjà connecté, rediriger vers l'app
            if (this.isLoggedIn()) {
                window.location.href = 'index-local.html';
            }
            return;
        }

        // Sur les autres pages, vérifier l'authentification
        this.requireAuth();
    }
};

// Auto-init
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Ne pas init sur la page de login (sera géré par le formulaire)
        if (!window.location.pathname.includes('login.html')) {
            AuthLocal.init();
        }
    });
}
