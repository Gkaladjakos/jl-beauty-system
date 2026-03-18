// Module de gestion des permissions
// Gère l'affichage des modules selon le rôle de l'utilisateur

const Permissions = {
    // Permissions par rôle
    rolePermissions: {
        gerant: ['all'], // Accès complet
        caissiere: ['dashboard', 'clients', 'rendez-vous', 'ventes', 'consommables'] // Accès limité
    },

    // Modules qui nécessitent une permission gérant
    gerantOnlyModules: ['coiffeuses', 'services', 'produits', 'materiels', 'commissions'],

    // Initialiser les permissions sur la page
    init(authType = 'local') {
        const Auth = authType === 'local' ? AuthLocal : AuthSupabase;
        
        // Vérifier si l'utilisateur est connecté
        if (!Auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        // Récupérer l'utilisateur
        const user = Auth.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Afficher le header utilisateur
        this.updateUserHeader(user, authType);

        // Masquer les modules non autorisés
        this.hideUnauthorizedModules(user);
    },

    // Mettre à jour le header avec les infos utilisateur
    updateUserHeader(user, authType) {
        // Mettre à jour le nom
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.nom || 'Utilisateur';
        }

        // Mettre à jour le rôle
        const userRoleElement = document.getElementById('user-role');
        if (userRoleElement) {
            const roleText = user.role === 'gerant' ? 'Gérant' : 'Caissière';
            userRoleElement.textContent = roleText;
        }

        // Mettre à jour le badge de rôle
        const userBadge = document.getElementById('user-badge');
        if (userBadge) {
            const roleText = user.role === 'gerant' ? 'Gérant' : 'Caissière';
            const badgeColor = user.role === 'gerant' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
            userBadge.className = `badge ${badgeColor}`;
            userBadge.textContent = roleText;
        }

        // Ajouter le handler de déconnexion
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = () => {
                if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                    if (authType === 'local') {
                        AuthLocal.logout();
                    } else {
                        AuthSupabase.logout();
                    }
                }
            };
        }
    },

    // Masquer les modules non autorisés
    hideUnauthorizedModules(user) {
        // Si gérant, tout afficher
        if (user.role === 'gerant' || (user.permissions && user.permissions.includes('all'))) {
            return; // Tout est autorisé
        }

        // Pour les caissières, masquer les modules gérant uniquement
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        
        sidebarItems.forEach(item => {
            const page = item.getAttribute('data-page');
            
            if (this.gerantOnlyModules.includes(page)) {
                // Masquer l'élément
                item.style.display = 'none';
            }
        });

        // Si l'utilisateur essaie d'accéder à une page non autorisée
        const currentPage = App.currentPage || 'dashboard';
        if (this.gerantOnlyModules.includes(currentPage)) {
            // Rediriger vers le dashboard
            App.loadPage('dashboard');
        }
    },

    // Vérifier si l'utilisateur a la permission pour un module
    hasPermission(module, authType = 'local') {
        const Auth = authType === 'local' ? AuthLocal : AuthSupabase;
        const user = Auth.getCurrentUser();
        
        if (!user) return false;

        // Gérant a accès à tout
        if (user.role === 'gerant' || (user.permissions && user.permissions.includes('all'))) {
            return true;
        }

        // Vérifier les permissions
        return user.permissions && user.permissions.includes(module);
    },

    // Afficher un message d'accès refusé
    showAccessDenied() {
        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification('Accès refusé. Vous n\'avez pas les permissions nécessaires.', 'error');
        } else {
            alert('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
        }
    }
};
