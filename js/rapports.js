// =========================================================================
// rapports.js — Rapport journalier des services par coiffeuse — COMPLET
// =========================================================================
const Rapports = {

    // ── Données ──
    rdvData:        [],
    coiffeusesData: [],
    servicesData:   [],

    // ── Date sélectionnée ──
    selectedDate: new Date().toISOString().split('T')[0],
    selectedMode: 'day', // 'day' | 'week'

    // =========================================================================
    // render()
    // =========================================================================
    async render(container) {
        await this._loadAllData();

        container.innerHTML = `

            <!-- Style impression -->
            <style>
                @media print {
                    body * { visibility: hidden; }
                    #rapport-printable, #rapport-printable * { visibility: visible; }
                    #rapport-printable { position: absolute; top: 0; left: 0; width: 100%; }
                    .no-print { display: none !important; }
                }
            </style>

            <!-- ══ Barre de contrôles ══ -->
            <div class="mb-6 no-print">

                <!-- Ligne 1 : Date + Raccourcis -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                    <div class="flex flex-wrap items-end gap-4">

                        <!-- Sélecteur de date -->
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">
                                <i class="fas fa-calendar-day text-purple-500 mr-1"></i>
                                Date du rapport
                            </label>
                            <input type="date" id="rapport-date"
                                   value="${this.selectedDate}"
                                   class="px-3 py-2 border border-gray-300 rounded-lg text-sm
                                          text-gray-700 focus:outline-none focus:ring-2
                                          focus:ring-purple-500 cursor-pointer">
                        </div>

                        <!-- Raccourcis rapides -->
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">
                                Raccourcis
                            </label>
                            <div class="flex gap-2">
                                <button onclick="Rapports.goToDate('today')"
                                        id="btn-today"
                                        class="px-3 py-2 text-xs rounded-lg font-medium
                                               bg-purple-600 text-white hover:bg-purple-700
                                               transition-colors">
                                    <i class="fas fa-dot-circle mr-1"></i>Aujourd'hui
                                </button>
                                <button onclick="Rapports.goToDate('yesterday')"
                                        id="btn-yesterday"
                                        class="px-3 py-2 text-xs rounded-lg font-medium
                                               bg-gray-100 text-gray-600 hover:bg-gray-200
                                               transition-colors">
                                    <i class="fas fa-arrow-left mr-1"></i>Hier
                                </button>
                                <button onclick="Rapports.goToDate('week')"
                                        id="btn-week"
                                        class="px-3 py-2 text-xs rounded-lg font-medium
                                               bg-gray-100 text-gray-600 hover:bg-gray-200
                                               transition-colors">
                                    <i class="fas fa-calendar-week mr-1"></i>Cette semaine
                                </button>
                            </div>
                        </div>

                        <!-- Navigation jour précédent / suivant -->
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">
                                Navigation
                            </label>
                            <div class="flex gap-2">
                                <button onclick="Rapports.navigateDay(-1)"
                                        class="px-3 py-2 text-xs rounded-lg font-medium
                                               border border-gray-300 text-gray-600
                                               hover:bg-gray-50 transition-colors">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <button onclick="Rapports.navigateDay(1)"
                                        class="px-3 py-2 text-xs rounded-lg font-medium
                                               border border-gray-300 text-gray-600
                                               hover:bg-gray-50 transition-colors">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Spacer -->
                        <div class="flex-1"></div>

                        <!-- Actions -->
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">
                                Actions
                            </label>
                            <div class="flex gap-2">
                                <button onclick="Rapports.refreshData()"
                                        class="px-3 py-2 text-xs border border-purple-300
                                               text-purple-600 rounded-lg hover:bg-purple-50
                                               font-medium transition-colors">
                                    <i class="fas fa-sync-alt mr-1"></i>Actualiser
                                </button>
                                <button onclick="Rapports.exportCSV()"
                                        class="px-3 py-2 text-xs bg-green-600 text-white
                                               rounded-lg hover:bg-green-700 font-medium
                                               transition-colors">
                                    <i class="fas fa-file-csv mr-1"></i>CSV
                                </button>
                                <button onclick="Rapports.printRapport()"
                                        class="px-3 py-2 text-xs bg-gray-700 text-white
                                               rounded-lg hover:bg-gray-800 font-medium
                                               transition-colors">
                                    <i class="fas fa-print mr-1"></i>Imprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Ligne 2 : Filtre coiffeuse + statut -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div class="flex flex-wrap gap-4 items-end">

                        <!-- Filtre coiffeuse -->
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">
                                <i class="fas fa-user mr-1 text-purple-400"></i>
                                Coiffeuse
                            </label>
                            <select id="filter-coiffeuse"
                                    class="px-3 py-2 text-sm border border-gray-300 rounded-lg
                                           focus:ring-2 focus:ring-purple-500">
                                <option value="">Toutes les coiffeuses</option>
                                ${this.coiffeusesData.map(c => `
                                    <option value="${c.id}">${c.nom}</option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Filtre statut RDV -->
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">
                                <i class="fas fa-tag mr-1 text-purple-400"></i>
                                Statut RDV
                            </label>
                            <select id="filter-statut"
                                    class="px-3 py-2 text-sm border border-gray-300 rounded-lg
                                           focus:ring-2 focus:ring-purple-500">
                                <option value="">Tous les statuts</option>
                                <option value="Terminé" selected>Terminé</option>
                                <option value="En cours">En cours</option>
                                <option value="Confirmé">Confirmé</option>
                                <option value="Programmé">Programmé</option>
                                <option value="Annulé">Annulé</option>
                            </select>
                        </div>

                        <!-- Filtre service -->
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1">
                                <i class="fas fa-scissors mr-1 text-purple-400"></i>
                                Service
                            </label>
                            <select id="filter-service"
                                    class="px-3 py-2 text-sm border border-gray-300 rounded-lg
                                           focus:ring-2 focus:ring-purple-500">
                                <option value="">Tous les services</option>
                                ${this._getUniqueServices().map(s => `
                                    <option value="${s}">${s}</option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Bouton appliquer -->
                        <div>
                            <button onclick="Rapports._refreshZone()"
                                    class="px-4 py-2 text-sm bg-purple-600 text-white
                                           rounded-lg hover:bg-purple-700 font-medium
                                           transition-colors">
                                <i class="fas fa-filter mr-1"></i>Filtrer
                            </button>
                        </div>

                        <div class="flex-1"></div>

                        <!-- Indicateur mode -->
                        <div id="mode-badge" class="text-sm text-gray-500 self-end pb-1">
                            <!-- rempli dynamiquement -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- ══ Zone de rapport (rechargeable) ══ -->
            <div id="rapport-zone" class="space-y-6">
                ${this._buildRapportHTML()}
            </div>
        `;

        // Écouteurs
        document.getElementById('rapport-date')
            .addEventListener('change', (e) => {
                this.selectedDate = e.target.value;
                this.selectedMode = 'day';
                this._updateShortcutStyles();
                this._refreshZone();
            });

        document.getElementById('filter-coiffeuse')
            .addEventListener('change', () => this._refreshZone());

        document.getElementById('filter-statut')
            .addEventListener('change', () => this._refreshZone());

        document.getElementById('filter-service')
            .addEventListener('change', () => this._refreshZone());

        this._updateShortcutStyles();
    },

    // =========================================================================
    // refreshData() — recharge depuis la DB
    // =========================================================================
    async refreshData() {
        App.showLoading();
        await this._loadAllData();
        App.hideLoading();
        this._refreshZone();
        App.showNotification('Données actualisées', 'success');
    },

    // =========================================================================
    // goToDate()
    // =========================================================================
    goToDate(shortcut) {
        const now = new Date();

        if (shortcut === 'today') {
            this.selectedDate = now.toISOString().split('T')[0];
            this.selectedMode = 'day';

        } else if (shortcut === 'yesterday') {
            const yest = new Date(now);
            yest.setDate(yest.getDate() - 1);
            this.selectedDate = yest.toISOString().split('T')[0];
            this.selectedMode = 'day';

        } else if (shortcut === 'week') {
            const monday = new Date(now);
            const day    = monday.getDay() || 7;
            monday.setDate(monday.getDate() - (day - 1));
            this.selectedDate = monday.toISOString().split('T')[0];
            this.selectedMode = 'week';
        }

        const input = document.getElementById('rapport-date');
        if (input) input.value = this.selectedDate;

        this._updateShortcutStyles();
        this._refreshZone();
    },

    // =========================================================================
    // navigateDay() — +1 / -1 jour
    // =========================================================================
    navigateDay(delta) {
        const d = new Date(this.selectedDate + 'T12:00:00');
        d.setDate(d.getDate() + delta);
        this.selectedDate = d.toISOString().split('T')[0];
        this.selectedMode = 'day';

        const input = document.getElementById('rapport-date');
        if (input) input.value = this.selectedDate;

        this._updateShortcutStyles();
        this._refreshZone();
    },

    // =========================================================================
    // _updateShortcutStyles() — met en évidence le bouton actif
    // =========================================================================
    _updateShortcutStyles() {
        const today = new Date().toISOString().split('T')[0];
        const yest  = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        const base    = 'px-3 py-2 text-xs rounded-lg font-medium transition-colors';
        const active  = `${base} bg-purple-600 text-white hover:bg-purple-700`;
        const inactive = `${base} bg-gray-100 text-gray-600 hover:bg-gray-200`;

        const btnToday = document.getElementById('btn-today');
        const btnYest  = document.getElementById('btn-yesterday');
        const btnWeek  = document.getElementById('btn-week');

        if (btnToday) btnToday.className = (this.selectedDate === today && this.selectedMode === 'day') ? active : inactive;
        if (btnYest)  btnYest.className  = (this.selectedDate === yest  && this.selectedMode === 'day') ? active : inactive;
        if (btnWeek)  btnWeek.className  = this.selectedMode === 'week' ? active : inactive;
    },

    // =========================================================================
    // _refreshZone()
    // =========================================================================
    _refreshZone() {
        const zone = document.getElementById('rapport-zone');
        if (zone) zone.innerHTML = this._buildRapportHTML();
    },

    // =========================================================================
    // _loadAllData()
    // =========================================================================
    async _loadAllData() {
        try {
            const [rdvRes, coiffRes, svcRes] = await Promise.all([
                Utils.get('rendez_vous'),
                Utils.get('coiffeuses'),
                Utils.get('services')
            ]);
            this.rdvData        = rdvRes.data   || [];
            this.coiffeusesData = coiffRes.data || [];
            this.servicesData   = svcRes.data   || [];
        } catch (error) {
            console.error('Rapports — erreur chargement:', error);
            this.rdvData        = [];
            this.coiffeusesData = [];
            this.servicesData   = [];
        }
    },

    // =========================================================================
    // _toLocalDateStr()
    // =========================================================================
    _toLocalDateStr(timestamp) {
        const d = new Date(timestamp);
        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0')
        ].join('-');
    },

    // =========================================================================
    // _getDateRange() — plage de dates selon mode
    // =========================================================================
    _getDateRange() {
        if (this.selectedMode === 'week') {
            const start = new Date(this.selectedDate + 'T00:00:00');
            const end   = new Date(start);
            end.setDate(end.getDate() + 6);
            return { start: this.selectedDate, end: end.toISOString().split('T')[0] };
        }
        return { start: this.selectedDate, end: this.selectedDate };
    },

    // =========================================================================
    // _getFilteredRdv() — applique tous les filtres
    // =========================================================================
    _getFilteredRdv() {
        const { start, end }     = this._getDateRange();
        const filterCoiffeuse    = document.getElementById('filter-coiffeuse')?.value  || '';
        const filterStatut       = document.getElementById('filter-statut')?.value     || '';
        const filterService      = document.getElementById('filter-service')?.value    || '';

        return this.rdvData.filter(rdv => {
            const rdvDate = this._toLocalDateStr(rdv.date_rdv);

            const matchDate       = rdvDate >= start && rdvDate <= end;
            const matchCoiffeuse  = !filterCoiffeuse || rdv.coiffeuse_id === filterCoiffeuse;
            const matchStatut     = !filterStatut    || rdv.statut === filterStatut;
            const matchService    = !filterService   || rdv.service_nom === filterService;

            return matchDate && matchCoiffeuse && matchStatut && matchService;
        });
    },

    // =========================================================================
    // _getUniqueServices()
    // =========================================================================
    _getUniqueServices() {
        const set = new Set(this.rdvData.map(r => r.service_nom).filter(Boolean));
        return [...set].sort();
    },

    // =========================================================================
    // _buildStats() — agrégation par coiffeuse
    // =========================================================================
    _buildStats(rdvList) {
        const map = {};

        rdvList.forEach(rdv => {
            const id = rdv.coiffeuse_id;
            if (!map[id]) {
                const coiff = this.coiffeusesData.find(c => c.id === id) || {};
                map[id] = {
                    id,
                    nom:              rdv.coiffeuse_nom || coiff.nom || 'Inconnue',
                    type_contrat:     coiff.type_contrat     || 'Commission',
                    taux_commission:  coiff.taux_commission  || 0,
                    salaire_base:     coiff.salaire_base     || 0,
                    photo_url:        coiff.photo_url        || null,
                    statut:           coiff.statut           || 'Actif',
                    services:         [],
                    total_ca:         0,
                    total_commission: 0,
                    nb_rdv_termines:  0,
                    clients:          new Set()
                };
            }

            const entry      = map[id];
            const prix       = rdv.prix || 0;
            const isSalariee = entry.type_contrat === 'Salariée';
            const commission = isSalariee ? 0 : prix * (entry.taux_commission / 100);

            entry.services.push({
                heure:       rdv.date_rdv,
                date:        this._toLocalDateStr(rdv.date_rdv),
                service_nom: rdv.service_nom  || '—',
                client_nom:  rdv.client_nom   || '—',
                client_tel:  rdv.client_telephone || '',
                prix,
                commission,
                statut:      rdv.statut,
                duree:       rdv.duree || 0,
                rdv_id:      rdv.id
            });

            entry.total_ca        += prix;
            entry.total_commission += commission;
            if (rdv.statut === 'Terminé') entry.nb_rdv_termines++;
            entry.clients.add(rdv.client_id);
        });

        // Finalisation
        Object.values(map).forEach(e => {
            e.nb_clients   = e.clients.size;
            e.nb_services  = e.services.length;
            delete e.clients;
        });

        return Object.values(map).sort((a, b) => b.total_ca - a.total_ca);
    },

    // =========================================================================
    // _buildRapportHTML()
    // =========================================================================
    _buildRapportHTML() {
        const rdvList  = this._getFilteredRdv();
        const stats    = this._buildStats(rdvList);
        const { start, end } = this._getDateRange();

        // Totaux globaux
        const totalCA          = stats.reduce((s, c) => s + c.total_ca, 0);
        const totalCommissions = stats.reduce((s, c) => s + c.total_commission, 0);
        const beneficeNet      = totalCA - totalCommissions;
        const totalServices    = rdvList.length;
        const totalTermines    = rdvList.filter(r => r.statut === 'Terminé').length;
        const totalClients     = new Set(rdvList.map(r => r.client_id)).size;

        // Label période
        const labelDate = this.selectedMode === 'week'
            ? `Semaine du ${this._formatDateFR(start)} au ${this._formatDateFR(end)}`
            : this._formatDateFR(start, true);

        // Mise à jour badge mode
        const modeBadge = document.getElementById('mode-badge');
        if (modeBadge) {
            modeBadge.innerHTML = this.selectedMode === 'week'
                ? `<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                       <i class="fas fa-calendar-week mr-1"></i>Vue semaine
                   </span>`
                : `<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                       <i class="fas fa-calendar-day mr-1"></i>Vue journalière
                   </span>`;
        }

        if (rdvList.length === 0) {
            return `
                <div class="bg-white rounded-xl shadow-md p-16 text-center text-gray-400">
                    <i class="fas fa-calendar-times text-6xl mb-4 block text-gray-200"></i>
                    <p class="text-lg font-semibold text-gray-500">Aucun service enregistré</p>
                    <p class="text-sm mt-2">pour ${labelDate}</p>
                    <p class="text-xs mt-4 text-gray-300">
                        Vérifiez les filtres ou choisissez une autre date
                    </p>
                </div>`;
        }

        return `
        <div id="rapport-printable">

            <!-- ══ En-tête rapport ══ -->
            <div class="bg-gradient-to-br from-purple-800 via-purple-700 to-black
                        text-white rounded-xl p-6 mb-6 shadow-lg">
                <div class="flex flex-wrap justify-between items-start gap-4">
                    <div>
                        <div class="flex items-center gap-3 mb-1">
                            <div class="w-10 h-10 bg-white/20 rounded-full flex items-center
                                        justify-center">
                                <i class="fas fa-chart-bar text-white"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold">Rapport journalier des services</h2>
                                <p class="text-purple-200 text-sm capitalize">${labelDate}</p>
                            </div>
                        </div>
                        <p class="text-xs text-purple-300 mt-2">
                            <i class="fas fa-clock mr-1"></i>
                            Généré le ${new Date().toLocaleString('fr-FR')}
                        </p>
                    </div>
                    <div class="text-right">
                        <p class="text-purple-200 text-xs">Coiffeuses dans ce rapport</p>
                        <p class="text-3xl font-bold">${stats.length}</p>
                    </div>
                </div>
            </div>

            <!-- ══ 5 KPI ══ -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                ${this._kpi('fas fa-scissors',          'Services',          totalServices,                          'purple')}
                ${this._kpi('fas fa-check-circle',      'Terminés',          totalTermines,                          'green')}
                ${this._kpi('fas fa-users',             'Clients',           totalClients,                           'blue')}
                ${this._kpi('fas fa-cash-register',     'Chiffre d\'affaires', Utils.formatCurrency(totalCA),        'emerald')}
                ${this._kpi('fas fa-hand-holding-usd',  'Commissions dues',  Utils.formatCurrency(totalCommissions), 'orange')}
            </div>

            <!-- ══ Bénéfice net ══ -->
            <div class="bg-white rounded-xl shadow-md p-5 mb-6 flex items-center
                        justify-between border-l-4 border-green-500">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center
                                justify-center flex-shrink-0">
                        <i class="fas fa-chart-line text-green-600 text-xl"></i>
                    </div>
                    <div>
                        <p class="font-semibold text-gray-800">Bénéfice net du salon</p>
                        <p class="text-sm text-gray-500">
                            ${Utils.formatCurrency(totalCA)} CA
                            − ${Utils.formatCurrency(totalCommissions)} commissions
                        </p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-3xl font-bold text-green-600">
                        ${Utils.formatCurrency(beneficeNet)}
                    </p>
                    <p class="text-xs text-gray-400">
                        ${totalCA > 0
                            ? `${((beneficeNet / totalCA) * 100).toFixed(1)}% du CA`
                            : '—'}
                    </p>
                </div>
            </div>

            <!-- ══ Cartes coiffeuses ══ -->
            <div class="space-y-6">
                ${stats.map((coiff, idx) =>
                    this._buildCoiffeusCard(coiff, totalCA, idx)
                ).join('')}
            </div>

            <!-- ══ Tableau comparatif ══ -->
            ${this._buildComparativeTable(stats, totalCA, totalCommissions)}

            <!-- ══ Graphique horaire (si vue jour) ══ -->
            ${this.selectedMode === 'day'
                ? this._buildHourlyChart(rdvList)
                : ''}

        </div>`;
    },

    // =========================================================================
    // _kpi() — carte indicateur
    // =========================================================================
    _kpi(icon, label, value, color) {
        const colors = {
            purple:  'bg-purple-100 text-purple-600',
            green:   'bg-green-100  text-green-600',
            blue:    'bg-blue-100   text-blue-600',
            emerald: 'bg-emerald-100 text-emerald-600',
            orange:  'bg-orange-100 text-orange-600'
        };
        const cls = colors[color] || colors.purple;

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4
                        flex items-center gap-3">
                <div class="w-10 h-10 ${cls} rounded-full flex items-center
                            justify-center flex-shrink-0">
                    <i class="${icon} text-sm"></i>
                </div>
                <div class="min-w-0">
                    <p class="text-xs text-gray-500 truncate">${label}</p>
                    <p class="text-lg font-bold text-gray-800 truncate">${value}</p>
                </div>
            </div>`;
    },

    // =========================================================================
    // _buildCoiffeusCard()
    // =========================================================================
    _buildCoiffeusCard(coiff, totalCA, rank) {
        const photo = coiff.photo_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(coiff.nom)}&background=9333ea&color=fff`;

        const isSalariee = coiff.type_contrat === 'Salariée';
        const pctCA      = totalCA > 0 ? (coiff.total_ca / totalCA) * 100 : 0;
        const partSalon  = coiff.total_ca - coiff.total_commission;

        // Badge contrat
        const contratBadge = isSalariee
            ? `<span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs
                           rounded-full font-medium">
                   <i class="fas fa-id-badge mr-1"></i>Salariée
               </span>`
            : `<span class="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs
                           rounded-full font-medium">
                   <i class="fas fa-percent mr-1"></i>${coiff.taux_commission}%
               </span>`;

        // Médaille
        const medal = rank === 0
            ? `<span class="absolute -top-2 -right-2 w-7 h-7 bg-yellow-400 rounded-full
                           flex items-center justify-center shadow-md" title="1ère position">
                   <i class="fas fa-trophy text-white text-xs"></i>
               </span>`
            : rank === 1
            ? `<span class="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 rounded-full
                           flex items-center justify-center shadow-md" title="2ème position">
                   <i class="fas fa-medal text-white text-xs"></i>
               </span>`
            : '';

        // Tri des services par heure
        const sorted = [...coiff.services].sort((a, b) => a.heure - b.heure);

        // Groupement par date (si vue semaine)
        const grouped = this._groupByDate(sorted);

        const rowsHTML = Object.entries(grouped).map(([date, services]) => {
            const dateHeader = this.selectedMode === 'week'
                ? `<tr class="bg-purple-50">
                       <td colspan="6" class="px-4 py-2 text-xs font-semibold text-purple-700">
                           <i class="fas fa-calendar-day mr-1"></i>
                           ${this._formatDateFR(date, true)}
                       </td>
                   </tr>`
                : '';

            const rows = services.map((svc, idx) => `
                <tr class="hover:bg-gray-50 text-sm
                           ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}">
                    <td class="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                        ${Utils.formatTime ? Utils.formatTime(svc.heure) : this._formatTime(svc.heure)}
                    </td>
                    <td class="px-4 py-3">
                        <span class="font-medium text-gray-800">${svc.service_nom}</span>
                        <span class="text-xs text-gray-400 ml-1">
                            <i class="fas fa-clock mr-0.5"></i>${svc.duree} min
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <p class="text-gray-700 font-medium">${svc.client_nom}</p>
                        ${svc.client_tel
                            ? `<p class="text-xs text-gray-400">
                                   <i class="fas fa-phone mr-0.5"></i>${svc.client_tel}
                               </p>`
                            : ''}
                    </td>
                    <td class="px-4 py-3 text-right">
                        <span class="font-semibold text-green-600 whitespace-nowrap">
                            ${Utils.formatCurrency(svc.prix)}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-right whitespace-nowrap">
                        ${isSalariee
                            ? `<span class="text-xs text-gray-400 italic">— salariée</span>`
                            : `<span class="font-medium text-orange-500">
                                   ${Utils.formatCurrency(svc.commission)}
                               </span>`}
                    </td>
                    <td class="px-4 py-3 text-center">
                        ${this._statusBadge(svc.statut)}
                    </td>
                </tr>`).join('');

            return dateHeader + rows;
        }).join('');

        return `
            <div class="bg-white rounded-xl shadow-md overflow-hidden">

                <!-- En-tête coiffeuse -->
                <div class="flex flex-wrap items-center justify-between p-5
                            border-b bg-gradient-to-r from-gray-50 to-white gap-4">
                    <div class="flex items-center gap-3">
                        <div class="relative flex-shrink-0">
                            <img src="${photo}"
                                 class="w-14 h-14 rounded-full object-cover
                                        ring-2 ring-purple-200"
                                 alt="${coiff.nom}">
                            ${medal}
                        </div>
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <p class="font-bold text-gray-800 text-lg">${coiff.nom}</p>
                                ${contratBadge}
                                <span class="px-2 py-0.5 text-xs rounded-full font-medium
                                             ${coiff.statut === 'Actif'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'}">
                                    ${coiff.statut}
                                </span>
                            </div>
                            <div class="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                <span>
                                    <i class="fas fa-scissors text-purple-400 mr-1"></i>
                                    ${coiff.nb_services} service${coiff.nb_services > 1 ? 's' : ''}
                                </span>
                                <span>
                                    <i class="fas fa-check-circle text-green-400 mr-1"></i>
                                    ${coiff.nb_rdv_termines} terminé${coiff.nb_rdv_termines > 1 ? 's' : ''}
                                </span>
                                <span>
                                    <i class="fas fa-users text-blue-400 mr-1"></i>
                                    ${coiff.nb_clients} client${coiff.nb_clients > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Totaux -->
                    <div class="flex gap-6 text-right flex-wrap">
                        <div>
                            <p class="text-xs text-gray-500">CA généré</p>
                            <p class="text-2xl font-bold text-green-600">
                                ${Utils.formatCurrency(coiff.total_ca)}
                            </p>
                            <p class="text-xs text-gray-400">${pctCA.toFixed(1)}% du total</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500">
                                ${isSalariee ? 'Salaire mensuel' : 'Commission due'}
                            </p>
                            <p class="text-2xl font-bold
                                      ${isSalariee ? 'text-blue-600' : 'text-orange-500'}">
                                ${isSalariee
                                    ? Utils.formatCurrency(coiff.salaire_base)
                                    : Utils.formatCurrency(coiff.total_commission)}
                            </p>
                            ${!isSalariee
                                ? `<p class="text-xs text-gray-400">
                                       Part salon : ${Utils.formatCurrency(partSalon)}
                                   </p>`
                                : `<p class="text-xs text-gray-400">fixe mensuel</p>`}
                        </div>
                    </div>
                </div>

                <!-- Tableau des services -->
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                            <tr>
                                <th class="px-4 py-2 text-left w-20">Heure</th>
                                <th class="px-4 py-2 text-left">Service</th>
                                <th class="px-4 py-2 text-left">Client</th>
                                <th class="px-4 py-2 text-right">Prix</th>
                                <th class="px-4 py-2 text-right">Commission</th>
                                <th class="px-4 py-2 text-center">Statut</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            ${rowsHTML}
                        </tbody>
                        <!-- Footer totaux -->
                        <tfoot class="bg-gray-50 border-t-2 border-gray-300 text-sm font-bold">
                            <tr>
                                <td colspan="3" class="px-4 py-3 text-gray-700">
                                    <i class="fas fa-calculator mr-1 text-gray-400"></i>
                                    Total — ${coiff.nb_services} service${coiff.nb_services > 1 ? 's' : ''}
                                </td>
                                <td class="px-4 py-3 text-right text-green-600">
                                    ${Utils.formatCurrency(coiff.total_ca)}
                                </td>
                                <td class="px-4 py-3 text-right
                                           ${isSalariee ? 'text-gray-400' : 'text-orange-500'}">
                                    ${isSalariee
                                        ? '<span class="text-xs italic font-normal">— salariée</span>'
                                        : Utils.formatCurrency(coiff.total_commission)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- Barre de progression CA -->
                <div class="px-5 py-3 bg-gray-50 border-t flex items-center gap-3">
                    <span class="text-xs text-gray-500 whitespace-nowrap">
                        Part du CA global :
                        <strong class="text-gray-700">${pctCA.toFixed(1)}%</strong>
                    </span>
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                        <div class="${isSalariee ? 'bg-blue-500' : 'bg-purple-500'}
                                    h-2 rounded-full transition-all"
                             style="width: ${Math.min(pctCA, 100)}%"></div>
                    </div>
                    ${!isSalariee
                        ? `<span class="text-xs text-gray-500 whitespace-nowrap">
                               Part salon :
                               <strong class="text-green-600">
                                   ${Utils.formatCurrency(partSalon)}
                               </strong>
                           </span>`
                        : ''}
                </div>
            </div>
        `;
    },

    // =========================================================================
    // _buildComparativeTable()
    // =========================================================================
    _buildComparativeTable(stats, totalCA, totalCommissions) {
        const beneficeNet = totalCA - totalCommissions;

        return `
            <div class="bg-white rounded-xl shadow-md overflow-hidden mt-6">
                <div class="flex items-center justify-between p-4 border-b bg-gray-50">
                    <h3 class="font-bold text-gray-800 flex items-center gap-2">
                        <i class="fas fa-table text-purple-500"></i>
                        Tableau comparatif
                    </h3>
                    <span class="text-xs text-gray-500">
                        ${stats.length} coiffeuse${stats.length > 1 ? 's' : ''}
                    </span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                            <tr>
                                <th class="px-4 py-3 text-left">#</th>
                                <th class="px-4 py-3 text-left">Coiffeuse</th>
                                <th class="px-4 py-3 text-center">Contrat</th>
                                <th class="px-4 py-3 text-center">Services</th>
                                <th class="px-4 py-3 text-center">Clients</th>
                                <th class="px-4 py-3 text-right">CA</th>
                                <th class="px-4 py-3 text-right">Commission</th>
                                <th class="px-4 py-3 text-right">Part salon</th>
                                <th class="px-4 py-3 text-right">% CA</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            ${stats.map((c, idx) => {
                                const pct        = totalCA > 0
                                    ? (c.total_ca / totalCA * 100).toFixed(1)
                                    : '0.0';
                                const isSalariee = c.type_contrat === 'Salariée';
                                const partSalon  = c.total_ca - c.total_commission;
                                const rankIcon   = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;

                                return `
                                <tr class="hover:bg-gray-50
                                           ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}">
                                    <td class="px-4 py-3 text-gray-500 font-medium">
                                        ${rankIcon}
                                    </td>
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-2">
                                            <img src="${c.photo_url ||
                                                'https://ui-avatars.com/api/?name=' +
                                                encodeURIComponent(c.nom) +
                                                '&background=9333ea&color=fff&size=32'}"
                                                 class="w-7 h-7 rounded-full"
                                                 alt="${c.nom}">
                                            <span class="font-medium text-gray-800">${c.nom}</span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        ${isSalariee
                                            ? `<span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Salariée</span>`
                                            : `<span class="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">${c.taux_commission}%</span>`}
                                    </td>
                                    <td class="px-4 py-3 text-center font-medium">
                                        ${c.nb_services}
                                    </td>
                                    <td class="px-4 py-3 text-center text-gray-600">
                                        ${c.nb_clients}
                                    </td>
                                    <td class="px-4 py-3 text-right font-semibold text-green-600">
                                        ${Utils.formatCurrency(c.total_ca)}
                                    </td>
                                    <td class="px-4 py-3 text-right
                                               ${isSalariee ? 'text-gray-400 text-xs italic' : 'text-orange-500'}">
                                        ${isSalariee ? '—' : Utils.formatCurrency(c.total_commission)}
                                    </td>
                                    <td class="px-4 py-3 text-right font-medium text-gray-700">
                                        ${Utils.formatCurrency(partSalon)}
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <div class="flex items-center justify-end gap-2">
                                            <div class="w-14 bg-gray-200 rounded-full h-1.5">
                                                <div class="${isSalariee ? 'bg-blue-500' : 'bg-purple-500'}
                                                            h-1.5 rounded-full"
                                                     style="width:${pct}%"></div>
                                            </div>
                                            <span class="text-gray-600 text-xs font-medium w-9 text-right">
                                                ${pct}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                        <tfoot class="bg-gray-100 border-t-2 border-gray-300 font-bold">
                            <tr>
                                <td colspan="5" class="px-4 py-3 text-gray-800">
                                    <i class="fas fa-sigma mr-1 text-gray-500"></i>
                                    Total général
                                </td>
                                <td class="px-4 py-3 text-right text-green-700 text-base">
                                    ${Utils.formatCurrency(totalCA)}
                                </td>
                                <td class="px-4 py-3 text-right text-orange-600">
                                    ${Utils.formatCurrency(totalCommissions)}
                                </td>
                                <td class="px-4 py-3 text-right text-gray-800">
                                    ${Utils.formatCurrency(beneficeNet)}
                                </td>
                                <td class="px-4 py-3 text-right text-gray-600 text-sm">
                                    100%
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    },

    // =========================================================================
    // _buildHourlyChart() — répartition par heure de la journée
    // =========================================================================
    _buildHourlyChart(rdvList) {
        const hours = {};
        for (let h = 7; h <= 20; h++) hours[h] = { count: 0, ca: 0 };

        rdvList.forEach(rdv => {
            const h = new Date(rdv.date_rdv).getHours();
            if (hours[h] !== undefined) {
                hours[h].count++;
                hours[h].ca += rdv.prix || 0;
            }
        });

        const maxCount = Math.max(...Object.values(hours).map(h => h.count), 1);

        const barsHTML = Object.entries(hours).map(([h, data]) => {
            const pct    = (data.count / maxCount) * 100;
            const hLabel = `${String(h).padStart(2, '0')}h`;

            return `
                <div class="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <span class="text-xs text-gray-500 font-medium">
                        ${data.count > 0 ? data.count : ''}
                    </span>
                    <div class="w-full bg-gray-100 rounded-t flex flex-col justify-end"
                         style="height: 80px;" title="${data.count} service(s) — ${Utils.formatCurrency(data.ca)}">
                        <div class="${data.count > 0 ? 'bg-purple-500' : 'bg-gray-100'}
                                    rounded-t w-full transition-all"
                             style="height: ${pct}%"></div>
                    </div>
                    <span class="text-xs text-gray-400 whitespace-nowrap">${hLabel}</span>
                </div>`;
        }).join('');

        return `
            <div class="bg-white rounded-xl shadow-md p-5 mt-6">
                <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <i class="fas fa-chart-column text-purple-500"></i>
                    Répartition horaire des services
                </h3>
                <div class="flex gap-2 items-end">
                    ${barsHTML}
                </div>
                <p class="text-xs text-gray-400 text-center mt-3">
                    Chaque barre représente le nombre de services réalisés par tranche horaire
                </p>
            </div>
        `;
    },

    // =========================================================================
    // _groupByDate() — groupe les services par date (pour vue semaine)
    // =========================================================================
    _groupByDate(services) {
        const grouped = {};
        services.forEach(svc => {
            const d = svc.date;
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push(svc);
        });
        return grouped;
    },

    // =========================================================================
    // _statusBadge()
    // =========================================================================
    _statusBadge(statut) {
        const map = {
            'Terminé':   'bg-green-100  text-green-700',
            'En cours':  'bg-blue-100   text-blue-700',
            'Confirmé':  'bg-purple-100 text-purple-700',
            'Programmé': 'bg-gray-100   text-gray-600',
            'Annulé':    'bg-red-100    text-red-600'
        };
        const cls = map[statut] || 'bg-gray-100 text-gray-500';
        return `<span class="px-2 py-0.5 rounded-full text-xs font-medium ${cls}">${statut}</span>`;
    },

    // =========================================================================
    // _formatDateFR()
    // =========================================================================
    _formatDateFR(dateStr, long = false) {
        const d = new Date(dateStr + 'T12:00:00');
        return long
            ? d.toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric',
                month: 'long', year: 'numeric'
              })
            : d.toLocaleDateString('fr-FR', {
                day: '2-digit', month: '2-digit', year: 'numeric'
              });
    },

    // =========================================================================
    // _formatTime() — fallback si Utils.formatTime non disponible
    // =========================================================================
    _formatTime(timestamp) {
        const d = new Date(timestamp);
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    },

    // =========================================================================
    // exportCSV()
    // =========================================================================
    exportCSV() {
        const rdvList = this._getFilteredRdv();
        const stats   = this._buildStats(rdvList);

        if (rdvList.length === 0) {
            App.showNotification('Aucune donnée à exporter', 'error');
            return;
        }

        const { start, end } = this._getDateRange();
        const periodeLabel   = start === end
            ? this._formatDateFR(start)
            : `${this._formatDateFR(start)}_${this._formatDateFR(end)}`;

        const lines = [
            `Rapport du ${periodeLabel}`,
            '',
            [
                'Date', 'Heure', 'Coiffeuse', 'Type contrat',
                'Service', 'Durée (min)', 'Client', 'Téléphone',
                'Prix (FC)', 'Commission (FC)', 'Statut'
            ].join(';')
        ];

        stats.forEach(coiff => {
            const sorted = [...coiff.services].sort((a, b) => a.heure - b.heure);

            sorted.forEach(svc => {
                lines.push([
                    svc.date,
                    this._formatTime(svc.heure),
                    coiff.nom,
                    coiff.type_contrat,
                    svc.service_nom,
                    svc.duree,
                    svc.client_nom,
                    svc.client_tel || '',
                    svc.prix,
                    svc.commission,
                    svc.statut
                ].map(v => `"${v}"`).join(';'));
            });

            // Sous-total coiffeuse
            lines.push([
                '', '', `SOUS-TOTAL — ${coiff.nom}`, coiff.type_contrat,
                `${coiff.nb_services} services`, '',
                `${coiff.nb_clients} clients`, '',
                coiff.total_ca,
                coiff.type_contrat === 'Salariée' ? 'Salariée' : coiff.total_commission,
                ''
            ].map(v => `"${v}"`).join(';'));

            lines.push('');
        });

        // Total général
        const totalCA  = stats.reduce((s, c) => s + c.total_ca, 0);
        const totalCom = stats.reduce((s, c) => s + c.total_commission, 0);

        lines.push([
            '', '', 'TOTAL GÉNÉRAL', '', '', '', '', '',
            totalCA, totalCom, ''
        ].map(v => `"${v}"`).join(';'));

        // Téléchargement
        const bom      = '\uFEFF';
        const blob     = new Blob([bom + lines.join('\n')],
                            { type: 'text/csv;charset=utf-8;' });
        const url      = URL.createObjectURL(blob);
        const link     = document.createElement('a');
        const fname    = `rapport_services_${start.replaceAll('-', '')}.csv`;
        link.href      = url;
        link.download  = fname;
        link.click();
        URL.revokeObjectURL(url);

        App.showNotification(`Export CSV téléchargé — ${fname}`, 'success');
    },

    // =========================================================================
    // printRapport()
    // =========================================================================
    printRapport() {
        window.print();
    }
};