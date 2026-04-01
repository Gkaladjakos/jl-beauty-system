// Main Application Controller
const App = {
    currentPage: null,

    // =========================================================================
    // init()
    // =========================================================================
    async init() {
        if (window.OfflineManager) {
            await OfflineManager.init();
            OfflineManager.startListening();

            const pending = await OfflineManager.getPendingCount();
            if (pending > 0) {
                App.showNotification(
                    `📴 ${pending} opération(s) en attente de synchronisation`,
                    'warning'
                );
            }
        }

        // ✅ Appliquer les restrictions de menu selon le rôle
        this.applyRoleRestrictions();

        this.setupNavigation();
        this.loadPage('dashboard');
    },

    // =========================================================================
    // ✅ applyRoleRestrictions()
    // Masque les items du sidebar interdits pour le rôle courant
    // =========================================================================
    applyRoleRestrictions() {
        // Pages interdites pour la caissière
        const PAGES_INTERDITES_CAISSE = [
            'coiffeuses',
            'services',
            'commissions'
        ];

        const user = typeof AuthSupabase !== 'undefined'
            ? AuthSupabase.getCurrentUser()
            : null;

        if (!user) return;

        console.log(`[App] Rôle détecté : ${user.role}`);

        if (user.role === 'caissiere') {
            // ✅ Masquer les items de menu interdits
            PAGES_INTERDITES_CAISSE.forEach(page => {
                const items = document.querySelectorAll(
                    `.sidebar-item[data-page="${page}"]`
                );
                items.forEach(item => {
                    item.style.display = 'none';
                    item.setAttribute('data-restricted', 'true');
                });
            });

            console.log('[App] Menu restreint pour le rôle caisse :',
                        PAGES_INTERDITES_CAISSE);
        }

        // ✅ Afficher le badge du rôle dans la sidebar (optionnel)
        this._renderRoleBadge(user);
    },

    // =========================================================================
    // ✅ _renderRoleBadge() — badge visuel du rôle dans la sidebar
    // =========================================================================
    _renderRoleBadge(user) {
        const badgeContainer = document.getElementById('user-role-badge');
        if (!badgeContainer) return;

        const config = typeof ROLE_PERMISSIONS !== 'undefined'
            ? ROLE_PERMISSIONS[user.role]
            : null;

        const label = config?.label || user.role;

        const colorClass = user.role === 'gerant'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-blue-100 text-blue-700';

        badgeContainer.innerHTML = `
            <div class="px-3 py-1 rounded-full text-xs font-semibold ${colorClass}">
                ${label}
            </div>`;
    },

    // =========================================================================
    // setupNavigation()
    // =========================================================================
    setupNavigation() {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');

                // ✅ Ne pas recharger si déjà sur la page
                if (page === this.currentPage) return;

                this.loadPage(page);

                document.querySelectorAll('.sidebar-item')
                    .forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },

    // =========================================================================
    // loadPage()
    // =========================================================================
    loadPage(page) {
        const contentArea = document.getElementById('content-area');
        if (!contentArea) {
            console.error('[App] #content-area introuvable');
            return;
        }

        // ✅ Vérification des permissions AVANT tout chargement
        if (!this._canAccessPage(page)) {
            console.warn(`[App] Accès refusé à "${page}" pour le rôle`,
                         AuthSupabase?.getRole?.());
            this._renderAccessDenied(contentArea, page);
            return;
        }

        // ✅ Nettoyer les charts Dashboard en quittant
        if (this.currentPage === 'dashboard' &&
            page !== 'dashboard' &&
            typeof Dashboard !== 'undefined') {
            Dashboard._destroyAllCharts();
        }

        this.currentPage = page;

        try {
            switch (page) {

                case 'dashboard':
                    this.updateHeader(
                        'Tableau de bord',
                        'Vue d\'ensemble de votre salon'
                    );
                    Dashboard.render(contentArea);
                    break;

                case 'clients':
                    this.updateHeader(
                        'Gestion des Clients',
                        'Gérer vos clients et leur fidélité'
                    );
                    Clients.render(contentArea);
                    break;

                case 'coiffeuses':
                    this.updateHeader(
                        'Gestion des Coiffeuses',
                        'Gérer votre équipe et leurs performances'
                    );
                    Coiffeuses.render(contentArea);
                    break;

                case 'services':
                    this.updateHeader(
                        'Catalogue de Services',
                        'Gérer vos services et tarifs'
                    );
                    Services.render(contentArea);
                    break;

                case 'rendez-vous':
                    this.updateHeader(
                        'Gestion des Rendez-vous',
                        'Planifier et gérer les rendez-vous'
                    );
                    RendezVous.render(contentArea);
                    break;

                case 'produits':
                    this.updateHeader(
                        'Gestion des Produits',
                        'Gérer votre stock et vos ventes'
                    );
                    if (typeof ProduitsV3 !== 'undefined') {
                        ProduitsV3.render(contentArea);
                    } else {
                        Produits.render(contentArea);
                    }
                    break;

                case 'materiels':
                    this.updateHeader(
                        'Gestion des Matériels',
                        'Gérer vos équipements et maintenance'
                    );
                    Materiels.render(contentArea);
                    break;

                case 'consommables':
                    this.updateHeader(
                        'Gestion des Consommables',
                        'Gérer le stock des produits consommés'
                    );
                    Consommables.render(contentArea);
                    break;

                case 'ventes':
                    this.updateHeader(
                        'Gestion des Ventes',
                        'Enregistrer et suivre les ventes'
                    );
                    if (typeof VentesV4 !== 'undefined') {
                        VentesV4.render(contentArea);
                    } else {
                        Ventes.render(contentArea);
                    }
                    break;

                case 'commissions':
                    this.updateHeader(
                        'Calcul des Commissions',
                        'Gérer les commissions des coiffeuses'
                    );
                    if (typeof CommissionsV3 !== 'undefined') {
                        CommissionsV3.render(contentArea);
                    } else {
                        Commissions.render(contentArea);
                    }
                    break;

                default:
                    console.warn(`[App] Page inconnue : "${page}"`);
                    contentArea.innerHTML = `
                        <div class="flex flex-col items-center justify-center
                                    h-64 text-gray-400">
                            <i class="fas fa-question-circle text-5xl mb-4"></i>
                            <p class="text-lg font-medium">
                                Page introuvable : ${page}
                            </p>
                        </div>`;
            }

        } catch (error) {
            console.error(
                `[App] Erreur lors du chargement de "${page}":`, error
            );
            contentArea.innerHTML = `
                <div class="flex flex-col items-center justify-center
                            h-64 text-red-400">
                    <i class="fas fa-exclamation-triangle text-5xl mb-4"></i>
                    <p class="text-lg font-medium">
                        Erreur lors du chargement de la page
                    </p>
                    <p class="text-sm mt-2 text-gray-500">${error.message}</p>
                    <button onclick="App.loadPage('${page}')"
                            class="mt-4 px-4 py-2 bg-purple-600 text-white
                                   rounded-lg hover:bg-purple-700 text-sm">
                        <i class="fas fa-redo mr-1"></i> Réessayer
                    </button>
                </div>`;
            this.hideLoading();
        }
    },

    // =========================================================================
    // ✅ _canAccessPage() — vérifie les permissions avant chargement
    // =========================================================================
    _canAccessPage(page) {
        // Si AuthSupabase n'est pas chargé, on laisse passer
        if (typeof AuthSupabase === 'undefined') return true;

        return AuthSupabase.hasPermission(page);
    },

    // =========================================================================
    // ✅ _renderAccessDenied() — page de refus d'accès propre
    // =========================================================================
    _renderAccessDenied(container, page) {
        this.currentPage = null;
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center
                        h-64 text-gray-400">
                <div class="bg-red-50 border border-red-200 rounded-2xl
                            p-10 text-center max-w-md">
                    <i class="fas fa-lock text-5xl text-red-400 mb-4"></i>
                    <h2 class="text-xl font-bold text-red-600 mb-2">
                        Accès refusé
                    </h2>
                    <p class="text-gray-500 text-sm mb-6">
                        Vous n'avez pas les droits nécessaires
                        pour accéder à cette section.
                    </p>
                    <button onclick="App.loadPage('dashboard')"
                            class="px-5 py-2 bg-purple-600 text-white rounded-lg
                                   hover:bg-purple-700 text-sm font-medium">
                        <i class="fas fa-home mr-2"></i>
                        Retour au tableau de bord
                    </button>
                </div>
            </div>`;
    },

    // =========================================================================
    // updateHeader()
    // =========================================================================
    updateHeader(title, subtitle) {
        const titleEl    = document.getElementById('page-title');
        const subtitleEl = document.getElementById('page-subtitle');
        if (titleEl)    titleEl.textContent    = title;
        if (subtitleEl) subtitleEl.textContent = subtitle;
    },

    // =========================================================================
    // showLoading() / hideLoading()
    // =========================================================================
    showLoading() {
        const el = document.getElementById('loading');
        if (el) el.classList.remove('hidden');
    },

    hideLoading() {
        const el = document.getElementById('loading');
        if (el) el.classList.add('hidden');
    },

    // =========================================================================
    // showNotification()
    // =========================================================================
    showNotification(message, type = 'success') {
        const bgColor =
            type === 'success' ? 'bg-green-500'  :
            type === 'error'   ? 'bg-red-500'    :
            type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500';

        const icon =
            type === 'success' ? 'check-circle'         :
            type === 'error'   ? 'exclamation-circle'   :
            type === 'warning' ? 'exclamation-triangle' :
            'info-circle';

        // Éviter les doublons
        const existing = document.querySelector('[data-notification]');
        if (existing && existing.textContent.includes(message)) return;

        const notification = document.createElement('div');
        notification.setAttribute('data-notification', type);
        notification.className =
            `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50
             ${bgColor} text-white transition-opacity duration-300`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            </div>`;

        document.body.appendChild(notification);

        const duration =
            type === 'error'   ? 5000 :
            type === 'warning' ? 4000 :
            3000;

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
};

// ✅ Point d'entrée unique
document.addEventListener('DOMContentLoaded', () => App.init());