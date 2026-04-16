// =========================================================================
// app.js — COMPLET avec intégration des modules Rapports + Comptabilité
//          + Clôture de Caisse
// =========================================================================
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

        this.applyRoleRestrictions();
        this.setupNavigation();
        this.loadPage('dashboard');
    },

    // =========================================================================
    // applyRoleRestrictions()
    // =========================================================================
    applyRoleRestrictions() {
        // ⚠️  'cloture-caisse' est VOLONTAIREMENT absent :
        //     la caissière doit pouvoir ouvrir/clôturer la caisse
        const PAGES_INTERDITES_CAISSE = [
            'coiffeuses',
            'services',
            'commissions',
            'rapports',
            'comptabilite'
        ];

        const user = typeof AuthSupabase !== 'undefined'
            ? AuthSupabase.getCurrentUser()
            : null;

        if (!user) return;

        console.log(`[App] Rôle détecté : ${user.role}`);

        if (user.role === 'caissiere') {
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

        this._renderRoleBadge(user);
    },

    // =========================================================================
    // _renderRoleBadge()
    // =========================================================================
    _renderRoleBadge(user) {
        const badgeContainer = document.getElementById('user-role-badge');
        if (!badgeContainer) return;

        const config = typeof ROLE_PERMISSIONS !== 'undefined'
            ? ROLE_PERMISSIONS[user.role]
            : null;

        const label      = config?.label || user.role;
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

                if (page === this.currentPage) return;

                this.loadPage(page);

                document.querySelectorAll('.sidebar-item')
                    .forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },

    // =========================================================================
    // ✅ loadPage() — async obligatoire (await ClotureCaisse.init())
    // =========================================================================
    async loadPage(page) {
        const contentArea = document.getElementById('content-area');
        if (!contentArea) {
            console.error('[App] #content-area introuvable');
            return;
        }

        // Vérification des permissions AVANT tout chargement
        if (!this._canAccessPage(page)) {
            console.warn(
                `[App] Accès refusé à "${page}" pour le rôle`,
                AuthSupabase?.getRole?.()
            );
            this._renderAccessDenied(contentArea, page);
            return;
        }

        // Nettoyer les charts Dashboard en quittant
        if (this.currentPage === 'dashboard' &&
            page !== 'dashboard' &&
            typeof Dashboard !== 'undefined') {
            Dashboard._destroyAllCharts?.();
        }

        // Nettoyer les ressources Rapports en quittant
        if (this.currentPage === 'rapports' &&
            page !== 'rapports' &&
            typeof Rapports !== 'undefined') {
            Rapports._cleanup?.();
        }

        this.currentPage = page;

        try {
            switch (page) {

                // ── Clôture de caisse ──────────────────────────────────────
                case 'cloture-caisse':
                    this.updateHeader(                      // ✅ corrigé
                        'Journal de Caisse',
                        'Ouverture · Clôture · Billetage'
                    );
                    if (typeof ClotureCaisse !== 'undefined') {
                        await ClotureCaisse.init(contentArea); // ✅ async
                    } else {
                        this._moduleNotFound(contentArea, 'ClotureCaisse');
                    }
                    break;
                case 'historique-clotures':
                    this.updateHeader(
                        'Historique des Clôtures',
                        'Consultez et filtrez les journées passées'
                    );
                    if (typeof HistoriqueClotures !== 'undefined') {
                        await HistoriqueClotures.init();
                    } else {
                        this._moduleNotFound(contentArea, 'HistoriqueClotures');
                    }
                    break;

                // ── Dashboard ──────────────────────────────────────────────
                case 'dashboard':
                    this.updateHeader(
                        'Tableau de bord',
                        'Vue d\'ensemble de votre salon'
                    );
                    if (typeof Dashboard !== 'undefined') {
                        Dashboard.render(contentArea);
                    } else {
                        this._moduleNotFound(contentArea, 'Dashboard');
                    }
                    break;

                // ── Clients ────────────────────────────────────────────────
                case 'clients':
                    this.updateHeader(
                        'Gestion des Clients',
                        'Gérer vos clients et leur fidélité'
                    );
                    if (typeof Clients !== 'undefined') {
                        Clients.render(contentArea);
                    } else {
                        this._moduleNotFound(contentArea, 'Clients');
                    }
                    break;

                // ── Coiffeuses ─────────────────────────────────────────────
                case 'coiffeuses':
                    this.updateHeader(
                        'Gestion des Coiffeuses',
                        'Gérer votre équipe et leurs performances'
                    );
                    if (typeof Coiffeuses !== 'undefined') {
                        Coiffeuses.render(contentArea);
                    } else {
                        this._moduleNotFound(contentArea, 'Coiffeuses');
                    }
                    break;

                // ── Services ───────────────────────────────────────────────
                case 'services':
                    this.updateHeader(
                        'Catalogue de Services',
                        'Gérer vos services et tarifs'
                    );
                    if (typeof Services !== 'undefined') {
                        Services.render(contentArea);
                    } else {
                        this._moduleNotFound(contentArea, 'Services');
                    }
                    break;

                // ── Rendez-vous ────────────────────────────────────────────
                case 'rendez-vous':
                    this.updateHeader(
                        'Gestion des Rendez-vous',
                        'Planifier et gérer les rendez-vous'
                    );
                    if (typeof RendezVous !== 'undefined') {
                        RendezVous.render(contentArea);
                    } else {
                        this._moduleNotFound(contentArea, 'RendezVous');
                    }
                    break;

                // ── Produits ───────────────────────────────────────────────
                case 'produits':
                    this.updateHeader(
                        'Gestion des Produits',
                        'Gérer votre stock et vos ventes'
                    );
                    if (typeof ProduitsV3 !== 'undefined') {
                        ProduitsV3.render(contentArea);
                    } else if (typeof Produits !== 'undefined') {
                        Produits.render(contentArea);
                    } else {
                        this._moduleNotFound(contentArea, 'Produits');
                    }
                    break;

                // ── Matériels ──────────────────────────────────────────────
                case 'materiels':
                    this.updateHeader(
                        'Gestion des Matériels',
                        'Gérer vos équipements et maintenance'
                    );
                    if (typeof Materiels !== 'undefined') {
                        Materiels.render(contentArea);
                    } else {
                        this._moduleNotFound(contentArea, 'Materiels');
                    }
                    break;

                // ── Consommables ───────────────────────────────────────────
                case 'consommables':
                    this.updateHeader(
                        'Gestion des Consommables',
                        'Gérer le stock des produits consommés'
                    );
                    if (typeof Consommables !== 'undefined') {
                        Consommables.render(contentArea);
                    } else {
                        this._moduleNotFound(contentArea, 'Consommables');
                    }
                    break;

                // ── Ventes ─────────────────────────────────────────────────
                case 'ventes':
                    this.updateHeader(
                        'Gestion des Ventes',
                        'Enregistrer et suivre les ventes'
                    );
                    if (typeof VentesV4 !== 'undefined') {
                        VentesV4.render(contentArea);
                    } else if (typeof Ventes !== 'undefined') {
                        Ventes.render(contentArea);
                    } else {
                        this._moduleNotFound(contentArea, 'Ventes');
                    }
                    break;

                // ── Commissions ────────────────────────────────────────────
                case 'commissions':
                    this.updateHeader(
                        'Calcul des Commissions',
                        'Gérer les commissions des coiffeuses'
                    );
                    if (typeof CommissionsV3 !== 'undefined') {
                        CommissionsV3.render(contentArea);
                    } else if (typeof Commissions !== 'undefined') {
                        Commissions.render(contentArea);
                    } else {
                        this._moduleNotFound(contentArea, 'Commissions');
                    }
                    break;

                // ── Rapports ───────────────────────────────────────────────
                case 'rapports':
                    this.updateHeader(
                        'Rapports journaliers',
                        'Analyse des services par coiffeuse'
                    );
                    if (typeof Rapports !== 'undefined') {
                        Rapports.render(contentArea);
                    } else {
                        this._moduleNotFound(contentArea, 'Rapports');
                    }
                    break;

                // ── Comptabilité ───────────────────────────────────────────
                case 'comptabilite':
                    this.updateHeader(
                        'Comptabilité OHADA',
                        'Mouvements de caisse et bilan comptable'
                    );
                    if (typeof Comptabilite !== 'undefined') {
                        Comptabilite.render(contentArea);
                    } else {
                        this._moduleNotFound(contentArea, 'Comptabilite');
                    }
                    break;

                // ── Page inconnue ──────────────────────────────────────────
                default:
                    console.warn(`[App] Page inconnue : "${page}"`);
                    contentArea.innerHTML = `
                        <div class="flex flex-col items-center justify-center
                                    h-64 text-gray-400">
                            <i class="fas fa-question-circle text-5xl mb-4"></i>
                            <p class="text-lg font-medium">
                                Page introuvable : <strong>${page}</strong>
                            </p>
                            <button onclick="App.loadPage('dashboard')"
                                    class="mt-4 px-4 py-2 bg-purple-600 text-white
                                           rounded-lg hover:bg-purple-700 text-sm">
                                <i class="fas fa-home mr-1"></i> Accueil
                            </button>
                        </div>`;
            }

        } catch (error) {
            console.error(`[App] Erreur lors du chargement de "${page}" :`, error);

            contentArea.innerHTML = `
                <div class="flex flex-col items-center justify-center
                            h-64 text-red-400">
                    <div class="bg-red-50 border border-red-200 rounded-2xl
                                p-10 text-center max-w-md">
                        <i class="fas fa-exclamation-triangle text-5xl
                                  text-red-400 mb-4"></i>
                        <p class="text-lg font-medium text-red-600">
                            Erreur lors du chargement
                        </p>
                        <p class="text-sm mt-2 text-gray-500">
                            ${error.message}
                        </p>
                        <button onclick="App.loadPage('${page}')"
                                class="mt-4 px-4 py-2 bg-purple-600 text-white
                                       rounded-lg hover:bg-purple-700 text-sm">
                            <i class="fas fa-redo mr-1"></i> Réessayer
                        </button>
                    </div>
                </div>`;

            this.hideLoading();
        }
    },

    // =========================================================================
    // _canAccessPage()
    // =========================================================================
    _canAccessPage(page) {
        if (typeof AuthSupabase === 'undefined') return true;
        return AuthSupabase.hasPermission(page);
    },

    // =========================================================================
    // _renderAccessDenied()
    // =========================================================================
    _renderAccessDenied(container, page) {
        this.currentPage = null;
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64">
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
    // _moduleNotFound()
    // =========================================================================
    _moduleNotFound(container, moduleName) {
        console.error(
            `[App] Module "${moduleName}" introuvable — vérifiez le <script>`
        );
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64">
                <div class="bg-yellow-50 border border-yellow-200 rounded-2xl
                            p-10 text-center max-w-md">
                    <i class="fas fa-puzzle-piece text-5xl text-yellow-400 mb-4"></i>
                    <h2 class="text-xl font-bold text-yellow-600 mb-2">
                        Module non chargé
                    </h2>
                    <p class="text-gray-500 text-sm mb-2">
                        Le module <strong>${moduleName}</strong> n'est pas disponible.
                    </p>
                    <p class="text-xs text-gray-400">
                        Vérifiez que le fichier
                        <code class="bg-gray-100 px-1 rounded">
                            ${moduleName.toLowerCase()}.js
                        </code>
                        est bien inclus dans votre HTML.
                    </p>
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

        // Éviter les doublons exacts
        const existing = document.querySelector('[data-notification]');
        if (existing && existing.textContent.includes(message)) return;

        const notification = document.createElement('div');
        notification.setAttribute('data-notification', type);
        notification.className =
            `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50
             ${bgColor} text-white transition-opacity duration-300
             max-w-sm`;

        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <i class="fas fa-${icon} mt-0.5 flex-shrink-0"></i>
                <span class="text-sm leading-relaxed">${message}</span>
                <button onclick="this.closest('[data-notification]').remove()"
                        class="ml-2 opacity-70 hover:opacity-100 flex-shrink-0">
                    <i class="fas fa-times text-xs"></i>
                </button>
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

// =========================================================================
// ✅ Point d'entrée unique
// =========================================================================
document.addEventListener('DOMContentLoaded', () => App.init());