// ============================================
// HISTORIQUE DES CLÔTURES DE CAISSE
// JL BEAUTY SYSTEM - VERSION CORRIGÉE
// ============================================

const HistoriqueClotures = {

    _filtres: {
        mode:  'date',
        date:  new Date().toISOString().split('T')[0],
        mois:  new Date().toISOString().slice(0, 7),
        debut: null,
        fin:   null,
    },
    _data: [],

    // =========================================================================
    // ✅ Client Supabase authentifié — évite le 401
    // =========================================================================
    _getClient() {
        const client = AuthSupabase?.supabase || window.supabase;
        if (!client) throw new Error('Client Supabase non initialisé');
        return client;
    },

    // =========================================================================
    // init()
    // =========================================================================
    async init() {
        console.log('📜 HistoriqueClotures.init()');
        await this.render();
    },

    // =========================================================================
    // render()
    // =========================================================================
    async render() {
        const container = document.getElementById('content-area');
        if (!container) return;

        // ── Calcul semaine courante ──────────────────────────────────────────
        const today     = new Date();
        const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
        const lundi     = new Date(today);
        lundi.setDate(today.getDate() - dayOfWeek);
        const dimanche  = new Date(lundi);
        dimanche.setDate(lundi.getDate() + 6);

        const fmt = d => d.toISOString().split('T')[0];
        this._filtres.debut = fmt(lundi);
        this._filtres.fin   = fmt(dimanche);

        container.innerHTML = `
            <div class="space-y-6">

                <!-- ── En-tête ── -->
                <div class="flex flex-col sm:flex-row sm:items-center
                            justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800
                                   flex items-center gap-2">
                            <i class="fas fa-history text-yellow-500"></i>
                            Historique des Clôtures
                        </h2>
                        <p class="text-sm text-gray-500 mt-1">
                            Consultez et filtrez les journées passées
                        </p>
                    </div>
                    <button onclick="HistoriqueClotures.exportCSV()"
                            class="px-4 py-2 border border-gray-300 rounded-lg
                                   text-sm text-gray-700 hover:bg-gray-50
                                   transition-colors flex items-center gap-2">
                        <i class="fas fa-file-csv text-green-600"></i>
                        Exporter CSV
                    </button>
                </div>

                <!-- ── Filtres ── -->
                <div class="bg-white rounded-xl shadow-sm border
                            border-gray-100 p-5">
                    <div class="flex flex-wrap gap-3 items-end">

                        <div>
                            <label class="block text-xs font-medium
                                          text-gray-500 mb-1">Filtrer par</label>
                            <div class="flex rounded-lg border border-gray-300
                                        overflow-hidden">
                                ${['date','semaine','mois'].map(m => `
                                <button id="btn-mode-${m}"
                                        onclick="HistoriqueClotures.setMode('${m}')"
                                        class="px-4 py-2 text-sm font-medium
                                               transition-colors
                                               ${this._filtres.mode === m
                                                   ? 'bg-yellow-500 text-white'
                                                   : 'bg-white text-gray-600 hover:bg-gray-50'}">
                                    ${m.charAt(0).toUpperCase() + m.slice(1)}
                                </button>`).join('')}
                            </div>
                        </div>

                        <div id="zone-filtre" class="flex gap-3 items-end">
                            ${this._renderFiltreInputs()}
                        </div>

                        <button onclick="HistoriqueClotures.charger()"
                                class="px-5 py-2 bg-yellow-500 text-white
                                       rounded-lg text-sm font-medium
                                       hover:bg-yellow-600 transition-colors
                                       flex items-center gap-2">
                            <i class="fas fa-search"></i>Rechercher
                        </button>

                        <button onclick="HistoriqueClotures.reset()"
                                class="px-4 py-2 text-sm text-gray-500
                                       hover:text-gray-700 transition-colors">
                            <i class="fas fa-times mr-1"></i>Réinitialiser
                        </button>

                    </div>
                </div>

                <!-- ── KPI ── -->
                <div id="hc-kpi-zone"
                     class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    ${this._kpiSkeleton()}
                </div>

                <!-- ── Tableau ── -->
                <div class="bg-white rounded-xl shadow-sm border
                            border-gray-100 overflow-hidden">
                    <div id="hc-table-zone">
                        <div class="flex items-center justify-center py-20">
                            <i class="fas fa-spinner fa-spin text-3xl
                                      text-yellow-500"></i>
                        </div>
                    </div>
                </div>

            </div>`;

        await this.charger();
    },

    // =========================================================================
    // _renderFiltreInputs()
    // =========================================================================
    _renderFiltreInputs() {
        const today = new Date().toISOString().split('T')[0];

        if (this._filtres.mode === 'date') {
            return `
                <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">
                        Date
                    </label>
                    <input type="date" id="filtre-date"
                           value="${this._filtres.date}" max="${today}"
                           class="border border-gray-300 rounded-lg px-3 py-2
                                  text-sm focus:ring-2 focus:ring-yellow-400
                                  focus:border-transparent">
                </div>`;
        }

        if (this._filtres.mode === 'semaine') {
            return `
                <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">
                        Du
                    </label>
                    <input type="date" id="filtre-debut"
                           value="${this._filtres.debut}" max="${today}"
                           class="border border-gray-300 rounded-lg px-3 py-2
                                  text-sm focus:ring-2 focus:ring-yellow-400
                                  focus:border-transparent">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">
                        Au
                    </label>
                    <input type="date" id="filtre-fin"
                           value="${this._filtres.fin}" max="${today}"
                           class="border border-gray-300 rounded-lg px-3 py-2
                                  text-sm focus:ring-2 focus:ring-yellow-400
                                  focus:border-transparent">
                </div>`;
        }

        if (this._filtres.mode === 'mois') {
            return `
                <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">
                        Mois
                    </label>
                    <input type="month" id="filtre-mois"
                           value="${this._filtres.mois}"
                           class="border border-gray-300 rounded-lg px-3 py-2
                                  text-sm focus:ring-2 focus:ring-yellow-400
                                  focus:border-transparent">
                </div>`;
        }
        return '';
    },

    // =========================================================================
    // setMode()
    // =========================================================================
    setMode(mode) {
        this._filtres.mode = mode;

        ['date','semaine','mois'].forEach(m => {
            const btn = document.getElementById(`btn-mode-${m}`);
            if (!btn) return;
            btn.className = btn.className
                .replace(/bg-yellow-500 text-white/g, '')
                .replace(/bg-white text-gray-600 hover:bg-gray-50/g, '')
                .trim();
            btn.className += m === mode
                ? ' bg-yellow-500 text-white'
                : ' bg-white text-gray-600 hover:bg-gray-50';
        });

        const zone = document.getElementById('zone-filtre');
        if (zone) zone.innerHTML = this._renderFiltreInputs();
    },

    // =========================================================================
    // reset()
    // =========================================================================
    async reset() {
        this._filtres = {
            mode:  'mois',
            date:  new Date().toISOString().split('T')[0],
            mois:  new Date().toISOString().slice(0, 7),
            debut: null,
            fin:   null,
        };
        await this.render();
    },

    // =========================================================================
    // charger() ✅ CORRIGÉ — client authentifié + gestion session expirée
    // =========================================================================
    async charger() {

        // ── Lire les inputs ──────────────────────────────────────────────────
        if (this._filtres.mode === 'date') {
            const d = document.getElementById('filtre-date');
            if (d) this._filtres.date = d.value;

        } else if (this._filtres.mode === 'semaine') {
            const deb = document.getElementById('filtre-debut');
            const fin = document.getElementById('filtre-fin');
            if (deb) this._filtres.debut = deb.value;
            if (fin) this._filtres.fin   = fin.value;

        } else if (this._filtres.mode === 'mois') {
            const m = document.getElementById('filtre-mois');
            if (m) this._filtres.mois = m.value;
        }

        const tableZone = document.getElementById('hc-table-zone');
        const kpiZone   = document.getElementById('hc-kpi-zone');

        if (tableZone) tableZone.innerHTML = `
            <div class="flex items-center justify-center py-20">
                <i class="fas fa-spinner fa-spin text-3xl text-yellow-500"></i>
            </div>`;

        try {
            // ✅ Client authentifié
            const supabase = this._getClient();

            // ✅ Vérifier session active avant requête
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('SESSION_EXPIRED');
            }

            let query = supabase
                .from('clotures_caisse')
                .select('*')
                .order('date_journee', { ascending: false });

            // ── Filtre ──────────────────────────────────────────────────────
            if (this._filtres.mode === 'date') {
                if (!this._filtres.date) throw new Error('Veuillez sélectionner une date');
                query = query.eq('date_journee', this._filtres.date);

            } else if (this._filtres.mode === 'semaine') {
                if (!this._filtres.debut || !this._filtres.fin)
                    throw new Error('Veuillez sélectionner une plage de dates');
                query = query
                    .gte('date_journee', this._filtres.debut)
                    .lte('date_journee', this._filtres.fin);

            } else if (this._filtres.mode === 'mois') {
                const [annee, mois] = this._filtres.mois.split('-');
                const debut = `${annee}-${mois}-01`;
                const fin   = new Date(annee, mois, 0).toISOString().split('T')[0];
                query = query
                    .gte('date_journee', debut)
                    .lte('date_journee', fin);
            }

            const { data, error } = await query;

            // ✅ Distinguer 401 des autres erreurs Supabase
            if (error) {
                if (error.status === 401 || error.message?.includes('JWT')) {
                    throw new Error('SESSION_EXPIRED');
                }
                throw error;
            }

            this._data = data || [];
            this._renderKPI(kpiZone);
            this._renderTable(tableZone);

        } catch (err) {
            console.error('❌ charger historique:', err);

            // ✅ Session expirée — message + bouton reconnexion
            if (err.message === 'SESSION_EXPIRED' ||
                err.message?.includes('expirée') ||
                err.message?.includes('JWT')) {

                if (tableZone) tableZone.innerHTML = `
                    <div class="text-center py-16">
                        <i class="fas fa-lock text-5xl text-orange-300 mb-4"></i>
                        <p class="font-semibold text-orange-600 mb-1">
                            Session expirée
                        </p>
                        <p class="text-sm text-gray-500 mb-5">
                            Votre session a expiré. Veuillez vous reconnecter.
                        </p>
                        <button onclick="AuthSupabase.logout()"
                                class="px-5 py-2 bg-purple-600 text-white
                                       rounded-lg text-sm hover:bg-purple-700
                                       font-medium">
                            <i class="fas fa-sign-in-alt mr-2"></i>
                            Se reconnecter
                        </button>
                    </div>`;
                return;
            }

            // Erreur générique
            if (tableZone) tableZone.innerHTML = `
                <div class="text-center py-16 text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p class="font-semibold mb-1">Erreur de chargement</p>
                    <p class="text-sm text-gray-500 mb-5">${err.message}</p>
                    <button onclick="HistoriqueClotures.charger()"
                            class="px-5 py-2 bg-yellow-500 text-white
                                   rounded-lg text-sm hover:bg-yellow-600
                                   font-medium">
                        <i class="fas fa-redo mr-2"></i>Réessayer
                    </button>
                </div>`;
        }
    },

    // =========================================================================
    // _renderKPI()
    // =========================================================================
    _renderKPI(zone) {
        if (!zone) return;
        const data = this._data;

        const totalVentes    = data.reduce((s,r) => s + parseFloat(r.total_ventes  ||0), 0);
        const totalEntrees   = data.reduce((s,r) => s + parseFloat(r.total_entrees ||0), 0);
        const totalSorties   = data.reduce((s,r) => s + parseFloat(r.total_sorties ||0), 0);
        const totalEcart     = data.reduce((s,r) => s + parseFloat(r.ecart         ||0), 0);
        const nbJours        = data.length;
        const nbDesequilibre = data.filter(r => parseFloat(r.ecart||0) !== 0).length;

        zone.innerHTML = `
            ${this._kpi('Journées trouvées',
                `${nbJours} jour${nbJours > 1 ? 's' : ''}`,
                'fas fa-calendar-check', 'yellow')}
            ${this._kpi('Total ventes',
                Utils.formatUSD(totalVentes),
                'fas fa-shopping-cart', 'blue')}
            ${this._kpi('Flux net (Entrées − Sorties)',
                Utils.formatUSD(totalEntrees - totalSorties),
                'fas fa-exchange-alt',
                (totalEntrees - totalSorties) >= 0 ? 'green' : 'red')}
            ${this._kpi('Écart cumulé',
                (totalEcart >= 0 ? '+' : '') + Utils.formatUSD(totalEcart) +
                (nbDesequilibre > 0
                    ? ` <span class="text-xs font-normal">(${nbDesequilibre} déséq.)</span>`
                    : ''),
                'fas fa-balance-scale',
                totalEcart === 0 ? 'green' : totalEcart > 0 ? 'blue' : 'red')}`;
    },

    // =========================================================================
    // _renderTable()
    // =========================================================================
    _renderTable(zone) {
        if (!zone) return;

        if (this._data.length === 0) {
            zone.innerHTML = `
                <div class="flex flex-col items-center justify-center
                            py-20 text-gray-400">
                    <i class="fas fa-inbox text-5xl mb-4"></i>
                    <p class="font-medium text-gray-500">
                        Aucune clôture trouvée pour cette période
                    </p>
                    <p class="text-sm mt-1">
                        Modifiez les filtres ou enregistrez une clôture
                    </p>
                </div>`;
            return;
        }

        const isGerant = AuthSupabase.isGerant();

        zone.innerHTML = `
            <!-- Mobile : cartes -->
            <div class="block md:hidden divide-y divide-gray-100">
                ${this._data.map(r => this._renderCard(r, isGerant)).join('')}
            </div>

            <!-- Desktop : tableau -->
            <div class="hidden md:block overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-gray-50 text-gray-500 text-xs
                                   uppercase tracking-wide">
                            <th class="px-5 py-3 text-left font-semibold">Date</th>
                            <th class="px-5 py-3 text-left font-semibold">Caissière</th>
                            <th class="px-5 py-3 text-right font-semibold">Ventes</th>
                            <th class="px-5 py-3 text-right font-semibold">Entrées</th>
                            <th class="px-5 py-3 text-right font-semibold">Sorties</th>
                            <th class="px-5 py-3 text-right font-semibold">Théorique</th>
                            <th class="px-5 py-3 text-right font-semibold">En caisse</th>
                            <th class="px-5 py-3 text-right font-semibold">Écart</th>
                            <th class="px-5 py-3 text-center font-semibold">Statut</th>
                            <th class="px-5 py-3 text-center font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${this._data.map(r => this._renderRow(r, isGerant)).join('')}
                    </tbody>
                    ${this._renderTotaux()}
                </table>
            </div>`;
    },

    // =========================================================================
    // _renderRow()
    // =========================================================================
    _renderRow(r, isGerant) {
        const ecart    = parseFloat(r.ecart || 0);
        const ecartCls = ecart === 0 ? 'text-green-600'
                       : ecart > 0   ? 'text-blue-600' : 'text-red-600';

        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-5 py-3 font-medium text-gray-800">
                    ${this._formatDate(r.date_journee)}
                </td>
                <td class="px-5 py-3 text-gray-600">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-yellow-100
                                    text-yellow-700 flex items-center
                                    justify-center text-xs font-bold">
                            ${(r.cloture_par || '?')[0].toUpperCase()}
                        </div>
                        <span class="text-sm">${r.cloture_par || '—'}</span>
                    </div>
                </td>
                <td class="px-5 py-3 text-right text-blue-600 font-medium">
                    ${Utils.formatUSD(r.total_ventes)}
                </td>
                <td class="px-5 py-3 text-right text-green-600">
                    +${Utils.formatUSD(r.total_entrees)}
                </td>
                <td class="px-5 py-3 text-right text-red-500">
                    -${Utils.formatUSD(r.total_sorties)}
                </td>
                <td class="px-5 py-3 text-right text-gray-700 font-medium">
                    ${Utils.formatUSD(r.total_theorique)}
                </td>
                <td class="px-5 py-3 text-right text-gray-700 font-semibold">
                    ${Utils.formatUSD(r.total_billetage)}
                </td>
                <td class="px-5 py-3 text-right font-bold ${ecartCls}">
                    ${ecart >= 0 ? '+' : ''}${Utils.formatUSD(ecart)}
                </td>
                <td class="px-5 py-3 text-center">
                    ${this._badgeStatut(r.statut)}
                </td>
                <td class="px-5 py-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button title="Voir le détail"
                                onclick="HistoriqueClotures.voirDetail('${r.id}')"
                                class="w-8 h-8 rounded-lg bg-gray-100 text-gray-600
                                       hover:bg-yellow-100 hover:text-yellow-700
                                       transition-colors flex items-center
                                       justify-center text-sm">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button title="Imprimer"
                                onclick="HistoriqueClotures.imprimer('${r.id}')"
                                class="w-8 h-8 rounded-lg bg-gray-100 text-gray-600
                                       hover:bg-blue-100 hover:text-blue-700
                                       transition-colors flex items-center
                                       justify-center text-sm">
                            <i class="fas fa-print"></i>
                        </button>
                        ${isGerant ? `
                        <button title="Supprimer"
                                onclick="HistoriqueClotures.supprimer('${r.id}')"
                                class="w-8 h-8 rounded-lg bg-gray-100 text-gray-600
                                       hover:bg-red-100 hover:text-red-700
                                       transition-colors flex items-center
                                       justify-center text-sm">
                            <i class="fas fa-trash"></i>
                        </button>` : ''}
                    </div>
                </td>
            </tr>`;
    },

    // =========================================================================
    // _renderCard()
    // =========================================================================
    _renderCard(r, isGerant) {
        const ecart    = parseFloat(r.ecart || 0);
        const ecartCls = ecart === 0 ? 'text-green-600'
                       : ecart > 0   ? 'text-blue-600' : 'text-red-600';

        return `
            <div class="p-4 hover:bg-gray-50">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <p class="font-semibold text-gray-800">
                            ${this._formatDate(r.date_journee)}
                        </p>
                        <p class="text-xs text-gray-500 mt-0.5">
                            ${r.cloture_par || '—'}
                        </p>
                    </div>
                    ${this._badgeStatut(r.statut)}
                </div>
                <div class="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                    <div class="bg-blue-50 rounded-lg p-2">
                        <p class="text-gray-500">Ventes</p>
                        <p class="font-semibold text-blue-700">
                            ${Utils.formatUSD(r.total_ventes)}
                        </p>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-2">
                        <p class="text-gray-500">Théorique</p>
                        <p class="font-semibold text-gray-700">
                            ${Utils.formatUSD(r.total_theorique)}
                        </p>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-2">
                        <p class="text-gray-500">Écart</p>
                        <p class="font-bold ${ecartCls}">
                            ${ecart >= 0 ? '+' : ''}${Utils.formatUSD(ecart)}
                        </p>
                    </div>
                </div>
                <div class="flex justify-end gap-2">
                    <button onclick="HistoriqueClotures.voirDetail('${r.id}')"
                            class="px-3 py-1.5 bg-gray-100 text-gray-600
                                   rounded-lg text-xs hover:bg-yellow-100
                                   hover:text-yellow-700 transition-colors">
                        <i class="fas fa-eye mr-1"></i>Détail
                    </button>
                    <button onclick="HistoriqueClotures.imprimer('${r.id}')"
                            class="px-3 py-1.5 bg-gray-100 text-gray-600
                                   rounded-lg text-xs hover:bg-blue-100
                                   hover:text-blue-700 transition-colors">
                        <i class="fas fa-print mr-1"></i>Imprimer
                    </button>
                    ${isGerant ? `
                    <button onclick="HistoriqueClotures.supprimer('${r.id}')"
                            class="px-3 py-1.5 bg-gray-100 text-gray-600
                                   rounded-lg text-xs hover:bg-red-100
                                   hover:text-red-700 transition-colors">
                        <i class="fas fa-trash mr-1"></i>
                    </button>` : ''}
                </div>
            </div>`;
    },

    // =========================================================================
    // _renderTotaux()
    // =========================================================================
    _renderTotaux() {
        const d   = this._data;
        const sum = k => d.reduce((s,r) => s + parseFloat(r[k]||0), 0);
        const ecartTotal = sum('ecart');

        return `
            <tfoot>
                <tr class="bg-gray-800 text-white text-sm font-bold">
                    <td class="px-5 py-3" colspan="2">
                        TOTAL — ${d.length} journée(s)
                    </td>
                    <td class="px-5 py-3 text-right">
                        ${Utils.formatUSD(sum('total_ventes'))}
                    </td>
                    <td class="px-5 py-3 text-right">
                        +${Utils.formatUSD(sum('total_entrees'))}
                    </td>
                    <td class="px-5 py-3 text-right">
                        -${Utils.formatUSD(sum('total_sorties'))}
                    </td>
                    <td class="px-5 py-3 text-right">
                        ${Utils.formatUSD(sum('total_theorique'))}
                    </td>
                    <td class="px-5 py-3 text-right">
                        ${Utils.formatUSD(sum('total_billetage'))}
                    </td>
                    <td class="px-5 py-3 text-right
                               ${ecartTotal === 0 ? 'text-green-400'
                               : ecartTotal  > 0  ? 'text-blue-400'
                                                  : 'text-red-400'}">
                        ${ecartTotal >= 0 ? '+' : ''}${Utils.formatUSD(ecartTotal)}
                    </td>
                    <td colspan="2"></td>
                </tr>
            </tfoot>`;
    },

    // =========================================================================
    // voirDetail()
    // =========================================================================
    async voirDetail(id) {
        const r = this._data.find(x => x.id === id);
        if (!r) return;

        const billetage = r.billetage
            ? (typeof r.billetage === 'string'
                ? JSON.parse(r.billetage) : r.billetage)
            : {};

        const lignesBilletage = [100, 50, 20, 10, 5].map(c => {
            const qty = billetage[c] || 0;
            if (qty === 0) return '';
            return `
                <div class="flex items-center justify-between py-1.5
                            border-b border-gray-100 last:border-0">
                    <div class="flex items-center gap-2">
                        <span class="w-14 text-center px-2 py-0.5 bg-green-100
                                     text-green-800 rounded text-xs font-bold
                                     border border-green-200">
                            $${c}
                        </span>
                        <span class="text-sm text-gray-600">× ${qty}</span>
                    </div>
                    <span class="font-semibold text-sm text-gray-800">
                        ${Utils.formatUSD(qty * c)}
                    </span>
                </div>`;
        }).join('');

        const ecart    = parseFloat(r.ecart || 0);
        const ecartCls = ecart === 0 ? 'text-green-600 bg-green-50'
                       : ecart  > 0  ? 'text-blue-600 bg-blue-50'
                                     : 'text-red-600 bg-red-50';

        const content = `
            <div class="space-y-5">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-lg font-bold text-gray-800">
                            ${this._formatDate(r.date_journee)}
                        </p>
                        <p class="text-sm text-gray-500">
                            Clôturé par <strong>${r.cloture_par || '—'}</strong>
                        </p>
                    </div>
                    ${this._badgeStatut(r.statut)}
                </div>

                <div class="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p class="text-xs font-semibold text-gray-500 uppercase
                               tracking-wide mb-3">Résumé financier</p>
                    ${[
                        ['Ventes du jour',    r.total_ventes,    'text-blue-600',          '+'],
                        ['Entrées manuelles', r.total_entrees,   'text-green-600',         '+'],
                        ['Sorties manuelles', r.total_sorties,   'text-red-500',           '-'],
                        ['Total théorique',   r.total_theorique, 'text-gray-800 font-bold',''],
                        ['Total en caisse',   r.total_billetage, 'text-gray-800 font-bold',''],
                    ].map(([label, val, cls, prefix]) => `
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">${label}</span>
                            <span class="${cls}">
                                ${prefix}${Utils.formatUSD(val)}
                            </span>
                        </div>`).join('')}
                    <div class="flex justify-between text-sm font-bold
                                pt-2 mt-2 border-t border-gray-200">
                        <span>Écart</span>
                        <span class="${ecartCls} px-2 py-0.5 rounded-lg">
                            ${ecart >= 0 ? '+' : ''}${Utils.formatUSD(ecart)}
                            ${ecart === 0 ? '✅' : ecart > 0 ? '⬆️' : '⬇️'}
                        </span>
                    </div>
                </div>

                ${Object.values(billetage).some(v => v > 0) ? `
                <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase
                               tracking-wide mb-3">Billetage physique</p>
                    <div class="space-y-0">${lignesBilletage}</div>
                </div>` : ''}

                ${r.notes ? `
                <div class="bg-yellow-50 rounded-xl p-4">
                    <p class="text-xs font-semibold text-yellow-700 uppercase
                               tracking-wide mb-1">
                        <i class="fas fa-sticky-note mr-1"></i>Notes
                    </p>
                    <p class="text-sm text-gray-700">${r.notes}</p>
                </div>` : ''}
            </div>`;

        Utils.createModal(
            `<i class="fas fa-file-alt text-yellow-500 mr-2"></i>
             Détail — ${this._formatDate(r.date_journee)}`,
            content, null, null
        );
    },

    // =========================================================================
    // imprimer()
    // =========================================================================
    imprimer(id) {
        const r = this._data.find(x => x.id === id);
        if (!r) return;

        const billetage = r.billetage
            ? (typeof r.billetage === 'string'
                ? JSON.parse(r.billetage) : r.billetage)
            : {};

        const lignesBilletage = [100, 50, 20, 10, 5].map(c => {
            const qty = billetage[c] || 0;
            return `
                <tr>
                    <td style="padding:4px 8px;">Billet $${c}</td>
                    <td style="padding:4px 8px;text-align:center;">${qty}</td>
                    <td style="padding:4px 8px;text-align:right;">
                        $${(qty * c).toFixed(2)}
                    </td>
                </tr>`;
        }).join('');

        const ecart = parseFloat(r.ecart || 0);

        const html = `
            <!DOCTYPE html><html>
            <head>
                <meta charset="UTF-8">
                <title>Récap Caisse — ${r.date_journee}</title>
                <style>
                    body  { font-family:Arial,sans-serif; font-size:13px;
                            max-width:480px; margin:0 auto; padding:20px; }
                    h1    { font-size:18px; text-align:center; margin-bottom:4px; }
                    h2    { font-size:13px; text-align:center; color:#666;
                            font-weight:normal; margin-bottom:20px; }
                    table { width:100%; border-collapse:collapse; margin-bottom:16px; }
                    th    { background:#f3f4f6; padding:6px 8px; text-align:left;
                            font-size:11px; text-transform:uppercase; }
                    td    { border-bottom:1px solid #e5e7eb; }
                    .tr   { font-weight:bold; background:#f9fafb; }
                    .ep   { color:#2563eb; }
                    .en   { color:#dc2626; }
                    .eo   { color:#16a34a; }
                    .sec  { font-weight:bold; margin:16px 0 6px; font-size:13px;
                            border-bottom:2px solid #000; padding-bottom:3px; }
                    .ft   { text-align:center; font-size:11px;
                            color:#9ca3af; margin-top:24px; }
                </style>
            </head>
            <body>
                <h1>JL Beauty System</h1>
                <h2>Récapitulatif de caisse — ${r.date_journee}</h2>
                <div class="sec">Résumé financier</div>
                <table>
                    <tr><td style="padding:4px 8px;">Ventes du jour</td>
                        <td style="padding:4px 8px;text-align:right;">
                            $${parseFloat(r.total_ventes||0).toFixed(2)}</td></tr>
                    <tr><td style="padding:4px 8px;">Entrées manuelles</td>
                        <td style="padding:4px 8px;text-align:right;">
                            +$${parseFloat(r.total_entrees||0).toFixed(2)}</td></tr>
                    <tr><td style="padding:4px 8px;">Sorties manuelles</td>
                        <td style="padding:4px 8px;text-align:right;">
                            -$${parseFloat(r.total_sorties||0).toFixed(2)}</td></tr>
                    <tr class="tr">
                        <td style="padding:6px 8px;">Total théorique</td>
                        <td style="padding:6px 8px;text-align:right;">
                            $${parseFloat(r.total_theorique||0).toFixed(2)}</td></tr>
                </table>
                <div class="sec">Billetage physique</div>
                <table>
                    <tr>
                        <th>Coupure</th>
                        <th style="text-align:center;">Qté</th>
                        <th style="text-align:right;">Sous-total</th>
                    </tr>
                    ${lignesBilletage}
                    <tr class="tr">
                        <td style="padding:6px 8px;" colspan="2">Total en caisse</td>
                        <td style="padding:6px 8px;text-align:right;">
                            $${parseFloat(r.total_billetage||0).toFixed(2)}
                        </td>
                    </tr>
                </table>
                <div class="sec">Écart</div>
                <table>
                    <tr class="tr">
                        <td style="padding:6px 8px;">Écart</td>
                        <td style="padding:6px 8px;text-align:right;"
                            class="${ecart===0 ? 'eo' : ecart>0 ? 'ep' : 'en'}">
                            ${ecart >= 0 ? '+' : ''}$${ecart.toFixed(2)}
                        </td>
                    </tr>
                </table>
                ${r.notes ? `
                <div class="sec">Notes</div>
                <p style="padding:4px 8px;">${r.notes}</p>` : ''}
                <div class="ft">
                    Clôturé par ${r.cloture_par || '—'}<br>
                    JL Beauty System — Édité le
                    ${new Date().toLocaleString('fr-FR')}
                </div>
            </body></html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.print();
    },

    // =========================================================================
    // supprimer() ✅ CORRIGÉ — client authentifié
    // =========================================================================
    async supprimer(id) {
        if (!AuthSupabase.isGerant()) {
            Utils.showToast('Réservé au gérant', 'error');
            return;
        }
        const r = this._data.find(x => x.id === id);
        if (!r) return;

        if (!confirm(
            `Supprimer définitivement la clôture du ` +
            `${this._formatDate(r.date_journee)} ?\n\nCette action est irréversible.`
        )) return;

        try {
            // ✅ Client authentifié
            const supabase = this._getClient();

            const { error } = await supabase
                .from('clotures_caisse')
                .delete()
                .eq('id', id);

            if (error) throw error;

            Utils.showToast('Clôture supprimée', 'success');
            await this.charger();

        } catch (err) {
            console.error('❌ supprimer:', err);
            Utils.showToast('Erreur : ' + err.message, 'error');
        }
    },

    // =========================================================================
    // exportCSV()
    // =========================================================================
    exportCSV() {
        if (this._data.length === 0) {
            Utils.showToast('Aucune donnée à exporter', 'warning');
            return;
        }

        const header = [
            'Date','Caissière','Ventes','Entrées',
            'Sorties','Théorique','En caisse','Écart','Statut','Notes'
        ].join(';');

        const rows = this._data.map(r => [
            r.date_journee,
            r.cloture_par || '',
            parseFloat(r.total_ventes    || 0).toFixed(2),
            parseFloat(r.total_entrees   || 0).toFixed(2),
            parseFloat(r.total_sorties   || 0).toFixed(2),
            parseFloat(r.total_theorique || 0).toFixed(2),
            parseFloat(r.total_billetage || 0).toFixed(2),
            parseFloat(r.ecart           || 0).toFixed(2),
            r.statut || '',
            (r.notes || '').replace(/;/g, ',').replace(/\n/g, ' '),
        ].join(';'));

        const csv  = [header, ...rows].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `clotures_caisse_${this._currentPeriodeLabel()}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        Utils.showToast('Export CSV généré', 'success');
    },

    // =========================================================================
    // Utilitaires
    // =========================================================================
    _currentPeriodeLabel() {
        if (this._filtres.mode === 'date')    return this._filtres.date;
        if (this._filtres.mode === 'mois')    return this._filtres.mois;
        if (this._filtres.mode === 'semaine')
            return `${this._filtres.debut}_${this._filtres.fin}`;
        return 'export';
    },

    _formatDate(dateStr) {
        if (!dateStr) return '—';
        const [y, m, d] = dateStr.split('-');
        const jours = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
        const date  = new Date(dateStr);
        return `${jours[date.getDay()]} ${d}/${m}/${y}`;
    },

    _badgeStatut(statut) {
        const cfg = {
            cloture: { cls: 'bg-green-100 text-green-800',
                       icon: 'fa-lock',      label: 'Clôturé' },
            ouvert:  { cls: 'bg-yellow-100 text-yellow-800',
                       icon: 'fa-lock-open', label: 'Ouvert'  },
        };
        const s = cfg[statut] || cfg['ouvert'];
        return `
            <span class="inline-flex items-center gap-1 px-2.5 py-1
                         rounded-full text-xs font-medium ${s.cls}">
                <i class="fas ${s.icon} text-xs"></i>${s.label}
            </span>`;
    },

    _kpi(label, value, icon, color) {
        const colors = {
            yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
            blue:   'bg-blue-50   text-blue-600   border-blue-100',
            green:  'bg-green-50  text-green-600  border-green-100',
            red:    'bg-red-50    text-red-600    border-red-100',
        };
        return `
            <div class="bg-white rounded-xl p-4 border ${colors[color]} shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg flex items-center
                                justify-center ${colors[color]} flex-shrink-0">
                        <i class="${icon}"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-xs text-gray-500 truncate">${label}</p>
                        <p class="font-bold text-gray-800 text-sm">${value}</p>
                    </div>
                </div>
            </div>`;
    },

    _kpiSkeleton() {
        return Array(4).fill(0).map(() => `
            <div class="bg-white rounded-xl p-4 border border-gray-100
                        shadow-sm animate-pulse">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-gray-200"></div>
                    <div class="space-y-2 flex-1">
                        <div class="h-2.5 bg-gray-200 rounded w-3/4"></div>
                        <div class="h-3.5 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>`).join('');
    },
};

// ── Export global ──────────────────────────────────────────────────────────────
window.HistoriqueClotures = HistoriqueClotures;
console.log('✅ HistoriqueClotures loaded');