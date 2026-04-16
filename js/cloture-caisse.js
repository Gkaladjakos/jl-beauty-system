// =============================================================================
// cloture-caisse.js
// JL BEAUTY SYSTEM
// Clôture journalière — Entrées / Sorties / Billetage
// =============================================================================

'use strict';

const ClotureCaisse = {

    // ── État interne ──────────────────────────────────────────────────────────
    _currentDate:    null,
    _cloture:        null,
    _mouvements:     [],
    _ventes:         [],
    _totalTheorique: 0,

    // ── Coupures USD ─────────────────────────────────────────────────────────
    COUPURES: [100, 50, 20, 10, 5],

    // =========================================================================
    // init()
    // =========================================================================
    async init() {
        console.log('🔐 ClotureCaisse.init()');
        this._currentDate = new Date().toISOString().split('T')[0];
        await this.render();
    },

    // =========================================================================
    // render()
    // =========================================================================
    async render() {
        const container = document.getElementById('content-area');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-6">

                <!-- ── En-tête ── -->
                <div class="flex flex-col sm:flex-row sm:items-center
                            justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800
                                   flex items-center gap-2">
                            <i class="fas fa-cash-register text-yellow-500"></i>
                            Journal de Caisse
                        </h2>
                        <p class="text-sm text-gray-500 mt-1">
                            Clôture journalière — Entrées / Sorties / Billetage
                        </p>
                    </div>
                    <div class="flex items-center gap-3">
                        <input type="date"
                               id="cc-date-picker"
                               value="${this._currentDate}"
                               max="${this._currentDate}"
                               class="border border-gray-300 rounded-lg px-3 py-2
                                      text-sm focus:ring-2 focus:ring-yellow-400
                                      focus:border-transparent">
                        <button onclick="ClotureCaisse.chargerJournee()"
                                class="px-4 py-2 bg-gray-100 text-gray-700
                                       rounded-lg text-sm font-medium
                                       hover:bg-gray-200 transition-colors
                                       flex items-center gap-2">
                            <i class="fas fa-search"></i>
                            Charger
                        </button>
                    </div>
                </div>

                <!-- ── Zone principale ── -->
                <div id="cc-main-zone">
                    <div class="flex items-center justify-center py-20">
                        <i class="fas fa-spinner fa-spin text-3xl
                                  text-yellow-500"></i>
                    </div>
                </div>

            </div>`;

        await this.chargerJournee();
    },

    // =========================================================================
    // chargerJournee()
    // =========================================================================
    async chargerJournee() {
        const picker = document.getElementById('cc-date-picker');
        if (picker) this._currentDate = picker.value;

        const zone = document.getElementById('cc-main-zone');
        if (!zone) return;

        zone.innerHTML = `
            <div class="flex items-center justify-center py-20">
                <i class="fas fa-spinner fa-spin text-3xl text-yellow-500"></i>
            </div>`;

        try {
            // ── 1. Clôture existante ─────────────────────────────────────────
            const { data: clotureData, error: clotureError } =
                await window.supabase
                    .from('clotures_caisse')
                    .select('*')
                    .eq('date_journee', this._currentDate)
                    .maybeSingle();

            if (clotureError) {
                console.warn('⚠️ clotures_caisse:', clotureError.message);
            }
            this._cloture = clotureData || null;

            // ── 2. Ventes du jour ────────────────────────────────────────────
            const debutV = this._currentDate + 'T00:00:00.000Z';
            const finV   = this._currentDate + 'T23:59:59.999Z';

            const { data: ventesData, error: ventesError } =
                await window.supabase
                    .from('ventes')
                    .select('id, montant_total, mode_paiement, date_vente')
                    .gte('date_vente', debutV)
                    .lte('date_vente', finV)
                    .order('date_vente', { ascending: true });

            if (ventesError) {
                console.warn('⚠️ ventes:', ventesError.message);
            }
            this._ventes = ventesData || [];

            // ── 3. Mouvements manuels ────────────────────────────────────────
            const debutM = this._currentDate + 'T00:00:00.000Z';
            const finM   = this._currentDate + 'T23:59:59.999Z';

            const { data: mouvementsData, error: mvtError } =
                await window.supabase
                    .from('mouvements_caisse')
                    .select('*')
                    .gte('date_journee', debutM)
                    .lte('date_journee', finM)
                    .order('created_at', { ascending: true });

            if (mvtError) {
                console.warn('⚠️ mouvements_caisse:', mvtError.message);
            }
            this._mouvements = mouvementsData || [];

            // ── 4. Afficher ──────────────────────────────────────────────────
            this._renderJournee(zone);

        } catch (err) {
            console.error('❌ chargerJournee error:', err);
            zone.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-6
                            text-center text-red-700">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p class="font-medium">Erreur lors du chargement</p>
                    <p class="text-sm mt-1">${err.message}</p>
                </div>`;
        }
    },

    // =========================================================================
    // _renderJournee()
    // =========================================================================
    _renderJournee(zone) {
        const cloture    = this._cloture;
        const verrouille = cloture?.statut === 'cloture';
        const isGerant   = AuthSupabase.isGerant();

        // ── Calculs ──────────────────────────────────────────────────────────
        const totalVentes = this._ventes.reduce(
            (s, v) => s + parseFloat(v.montant_total || 0), 0
        );
        const totalEntrees = this._mouvements
            .filter(m => m.type === 'Entree')
            .reduce((s, m) => s + parseFloat(m.montant || 0), 0);
        const totalSorties = this._mouvements
            .filter(m => m.type === 'Sortie')
            .reduce((s, m) => s + parseFloat(m.montant || 0), 0);

        const montantOuverture = parseFloat(cloture?.montant_ouverture || 0);
        const totalTheorique   = montantOuverture + totalVentes
                                 + totalEntrees - totalSorties;

        const billetage = cloture?.billetage
            ? (typeof cloture.billetage === 'string'
                ? JSON.parse(cloture.billetage)
                : cloture.billetage)
            : {};

        const totalBilletage = this.COUPURES.reduce(
            (s, c) => s + (parseInt(billetage[c] || 0) * c), 0
        );
        const ecart = totalBilletage - totalTheorique;

        // ── HTML ─────────────────────────────────────────────────────────────
        zone.innerHTML = `

            <!-- ══ Bandeau statut ══ -->
            ${verrouille ? `
            <div class="bg-green-50 border border-green-200 rounded-xl px-5 py-3
                        flex items-center gap-3 mb-6">
                <i class="fas fa-lock text-green-600 text-lg"></i>
                <div>
                    <p class="font-semibold text-green-800 text-sm">
                        Journée clôturée
                    </p>
                    <p class="text-xs text-green-600">
                        Le ${Utils.formatDateTime(cloture.heure_cloture)}
                        par ${cloture.cloture_par || '—'}
                    </p>
                </div>
                ${isGerant ? `
                <button onclick="ClotureCaisse.deverrouiller()"
                        class="ml-auto text-xs px-3 py-1.5 rounded-lg
                               border border-green-400 text-green-700
                               hover:bg-green-100 transition-colors">
                    <i class="fas fa-unlock mr-1"></i>Déverrouiller
                </button>` : ''}
            </div>` : `
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl
                        px-5 py-3 flex items-center gap-3 mb-6">
                <i class="fas fa-lock-open text-yellow-600 text-lg"></i>
                <p class="font-semibold text-yellow-800 text-sm">
                    Journée ouverte — En attente de clôture
                </p>
            </div>`}

            <!-- ══ KPI ══ -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                ${this._kpi('Ventes du jour',
                    Utils.formatUSD(totalVentes),
                    'fas fa-shopping-cart', 'blue')}
                ${this._kpi('Entrées manuelles',
                    Utils.formatUSD(totalEntrees),
                    'fas fa-arrow-circle-down', 'green')}
                ${this._kpi('Sorties manuelles',
                    Utils.formatUSD(totalSorties),
                    'fas fa-arrow-circle-up', 'red')}
                ${this._kpi('Total théorique',
                    Utils.formatUSD(totalTheorique),
                    'fas fa-calculator', 'purple')}
            </div>

            <!-- ══ Grille principale ══ -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <!-- ── Colonne gauche ── -->
                <div class="space-y-6">

                    <!-- Fonds d'ouverture -->
                    <div class="bg-white rounded-xl shadow-sm
                                border border-gray-100 overflow-hidden">
                        <div class="px-5 py-4 border-b border-gray-100">
                            <h3 class="font-semibold text-gray-800
                                       flex items-center gap-2">
                                <i class="fas fa-door-open text-indigo-500"></i>
                                Fonds d'ouverture
                            </h3>
                        </div>
                        <div class="p-5">
                            <div class="flex items-center justify-between gap-3">
                                <span class="text-sm text-gray-600">
                                    Montant en caisse à l'ouverture
                                </span>
                                <input type="number"
                                       id="cc-montant-ouverture"
                                       min="0"
                                       step="0.01"
                                       value="${montantOuverture}"
                                       ${verrouille ? 'disabled' : ''}
                                       oninput="ClotureCaisse.recalcBilletage()"
                                       class="w-32 border border-gray-300
                                              rounded-lg px-3 py-2 text-sm
                                              text-right font-semibold
                                              focus:ring-2 focus:ring-yellow-400
                                              focus:border-transparent
                                              disabled:bg-gray-50
                                              disabled:text-gray-500">
                            </div>
                        </div>
                    </div>

                    <!-- Mouvements manuels -->
                    <div class="bg-white rounded-xl shadow-sm
                                border border-gray-100 overflow-hidden">
                        <div class="flex items-center justify-between
                                    px-5 py-4 border-b border-gray-100">
                            <h3 class="font-semibold text-gray-800
                                       flex items-center gap-2">
                                <i class="fas fa-exchange-alt text-yellow-500"></i>
                                Entrées &amp; Sorties manuelles
                            </h3>
                            ${!verrouille ? `
                            <div class="flex gap-2">
                                <button onclick="ClotureCaisse.ajouterMouvement('entree')"
                                        class="px-3 py-1.5 bg-green-100 text-green-700
                                               rounded-lg text-xs font-medium
                                               hover:bg-green-200 transition-colors">
                                    <i class="fas fa-plus mr-1"></i>Entrée
                                </button>
                                <button onclick="ClotureCaisse.ajouterMouvement('sortie')"
                                        class="px-3 py-1.5 bg-red-100 text-red-700
                                               rounded-lg text-xs font-medium
                                               hover:bg-red-200 transition-colors">
                                    <i class="fas fa-minus mr-1"></i>Sortie
                                </button>
                            </div>` : ''}
                        </div>
                        <div class="divide-y divide-gray-50
                                    max-h-64 overflow-y-auto">
                            ${this._mouvements.length === 0
                                ? `<p class="text-center text-gray-400
                                            text-sm py-8">
                                       Aucun mouvement manuel
                                   </p>`
                                : this._mouvements.map(m => `
                                <div class="flex items-center justify-between
                                            px-5 py-3 hover:bg-gray-50">
                                    <div class="flex items-center gap-3">
                                        <span class="w-7 h-7 rounded-full flex
                                                     items-center justify-center
                                                     text-xs
                                                     ${m.type === 'entree'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'}">
                                            <i class="fas fa-${m.type === 'entree'
                                                ? 'arrow-down' : 'arrow-up'}"></i>
                                        </span>
                                        <div>
                                            <p class="text-sm font-medium
                                                       text-gray-800">
                                                ${m.libelle || '—'}
                                            </p>
                                            <p class="text-xs text-gray-400">
                                                ${Utils.formatTime(m.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <span class="font-semibold text-sm
                                                     ${m.type === 'entree'
                                                        ? 'text-green-600'
                                                        : 'text-red-600'}">
                                            ${m.type === 'entree' ? '+' : '-'}
                                            ${Utils.formatUSD(m.montant)}
                                        </span>
                                        ${!verrouille ? `
                                        <button onclick="ClotureCaisse
                                                    .supprimerMouvement('${m.id}')"
                                                class="text-gray-300
                                                       hover:text-red-500
                                                       transition-colors text-sm">
                                            <i class="fas fa-times"></i>
                                        </button>` : ''}
                                    </div>
                                </div>`).join('')}
                        </div>
                        <div class="px-5 py-3 bg-gray-50 border-t border-gray-100
                                    flex justify-between text-sm font-medium">
                            <span class="text-green-700">
                                Entrées : +${Utils.formatUSD(totalEntrees)}
                            </span>
                            <span class="text-red-700">
                                Sorties : -${Utils.formatUSD(totalSorties)}
                            </span>
                        </div>
                    </div>

                    <!-- Ventes du jour -->
                    <div class="bg-white rounded-xl shadow-sm
                                border border-gray-100 overflow-hidden">
                        <div class="px-5 py-4 border-b border-gray-100">
                            <h3 class="font-semibold text-gray-800
                                       flex items-center gap-2">
                                <i class="fas fa-receipt text-blue-500"></i>
                                Ventes du jour
                                <span class="ml-auto text-xs font-normal
                                             bg-blue-100 text-blue-700
                                             px-2 py-0.5 rounded-full">
                                    ${this._ventes.length} vente(s)
                                </span>
                            </h3>
                        </div>
                        <div class="divide-y divide-gray-50
                                    max-h-64 overflow-y-auto">
                            ${this._ventes.length === 0
                                ? `<p class="text-center text-gray-400
                                            text-sm py-8">
                                       Aucune vente enregistrée
                                   </p>`
                                : this._ventes.map(v => `
                                <div class="flex items-center justify-between
                                            px-5 py-2.5 hover:bg-gray-50">
                                    <div>
                                        <p class="text-xs text-gray-500">
                                            ${Utils.formatTime(v.date_vente)}
                                        </p>
                                        <p class="text-xs text-gray-400">
                                            ${v.mode_paiement || 'Cash'}
                                        </p>
                                    </div>
                                    <span class="font-semibold text-sm
                                                 text-blue-600">
                                        ${Utils.formatUSD(v.montant_total)}
                                    </span>
                                </div>`).join('')}
                        </div>
                        <div class="px-5 py-3 bg-blue-50 border-t border-blue-100
                                    flex justify-between text-sm font-semibold
                                    text-blue-800">
                            <span>Total ventes</span>
                            <span>${Utils.formatUSD(totalVentes)}</span>
                        </div>
                    </div>

                </div>
                <!-- fin colonne gauche -->

                <!-- ── Colonne droite ── -->
                <div class="space-y-6">

                    <!-- Billetage -->
                    <div class="bg-white rounded-xl shadow-sm
                                border border-gray-100 overflow-hidden">
                        <div class="px-5 py-4 border-b border-gray-100">
                            <h3 class="font-semibold text-gray-800
                                       flex items-center gap-2">
                                <i class="fas fa-money-bill-wave
                                          text-green-500"></i>
                                Billetage physique
                            </h3>
                            <p class="text-xs text-gray-400 mt-0.5">
                                Comptez les billets dans la caisse
                            </p>
                        </div>
                        <div class="p-5 space-y-3">
                            ${this.COUPURES.map(c => `
                            <div class="flex items-center gap-3">
                                <div class="flex-shrink-0 w-20 text-center">
                                    <span class="inline-block px-3 py-1.5
                                                 bg-green-100 text-green-800
                                                 rounded-lg text-sm font-bold
                                                 border border-green-200">
                                        $${c}
                                    </span>
                                </div>
                                <span class="text-gray-500 text-sm">×</span>
                                <input type="number"
                                       id="billet-${c}"
                                       min="0"
                                       value="${billetage[c] || 0}"
                                       ${verrouille ? 'disabled' : ''}
                                       oninput="ClotureCaisse.recalcBilletage()"
                                       class="w-24 border border-gray-300
                                              rounded-lg px-3 py-2 text-sm
                                              text-center font-medium
                                              focus:ring-2 focus:ring-yellow-400
                                              focus:border-transparent
                                              disabled:bg-gray-50
                                              disabled:text-gray-500">
                                <span class="text-gray-400 text-sm">=</span>
                                <span id="sous-total-${c}"
                                      class="font-semibold text-gray-700
                                             text-sm w-20 text-right">
                                    ${Utils.formatUSD((billetage[c] || 0) * c)}
                                </span>
                            </div>`).join('')}
                        </div>

                        <!-- Totaux billetage -->
                        <div class="px-5 py-4 bg-gray-50 border-t
                                    border-gray-200 space-y-2">
                            <div class="flex justify-between text-sm
                                        font-semibold text-gray-700">
                                <span>
                                    <i class="fas fa-coins mr-1
                                              text-yellow-500"></i>
                                    Total en caisse
                                </span>
                                <span id="cc-total-billetage"
                                      class="text-lg text-gray-900">
                                    ${Utils.formatUSD(totalBilletage)}
                                </span>
                            </div>
                            <div class="flex justify-between text-sm
                                        text-gray-500">
                                <span>Attendu (théorique)</span>
                                <span id="cc-total-theorique">
                                    ${Utils.formatUSD(totalTheorique)}
                                </span>
                            </div>
                            <div class="flex justify-between text-sm font-bold
                                        pt-1 border-t border-gray-200">
                                <span>Écart</span>
                                <span id="cc-ecart"
                                      class="${ecart === 0
                                        ? 'text-green-600'
                                        : ecart > 0
                                            ? 'text-blue-600'
                                            : 'text-red-600'}">
                                    ${ecart >= 0 ? '+' : ''}
                                    ${Utils.formatUSD(ecart)}
                                    ${ecart === 0
                                        ? ' ✅'
                                        : ecart > 0 ? ' ⬆️' : ' ⬇️'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Notes -->
                    <div class="bg-white rounded-xl shadow-sm
                                border border-gray-100 overflow-hidden">
                        <div class="px-5 py-4 border-b border-gray-100">
                            <h3 class="font-semibold text-gray-800
                                       flex items-center gap-2">
                                <i class="fas fa-sticky-note text-yellow-400"></i>
                                Notes / Observations
                            </h3>
                        </div>
                        <div class="p-5 space-y-3">
                            <textarea id="cc-notes"
                                      rows="2"
                                      ${verrouille ? 'disabled' : ''}
                                      placeholder="Observations de la caissière…"
                                      class="w-full border border-gray-300
                                             rounded-lg px-3 py-2 text-sm
                                             resize-none
                                             focus:ring-2 focus:ring-yellow-400
                                             focus:border-transparent
                                             disabled:bg-gray-50
                                             disabled:text-gray-500"
                                      >${cloture?.notes || ''}</textarea>

                            ${isGerant ? `
                            <div>
                                <label class="block text-xs font-medium
                                              text-gray-500 mb-1">
                                    Commentaire gérant
                                </label>
                                <textarea id="cc-commentaire-gerant"
                                          rows="2"
                                          placeholder="Observations du gérant…"
                                          class="w-full border border-gray-300
                                                 rounded-lg px-3 py-2 text-sm
                                                 resize-none
                                                 focus:ring-2 focus:ring-yellow-400
                                                 focus:border-transparent">
${cloture?.commentaire_gerant || ''}</textarea>
                            </div>` : ''}
                        </div>
                    </div>

                    <!-- Bouton clôture / impression -->
                    ${!verrouille ? `
                    <button onclick="ClotureCaisse.cloturer()"
                            class="w-full py-4 rounded-xl text-white font-bold
                                   text-base shadow-lg transition-all
                                   bg-gradient-to-r from-yellow-500 to-black
                                   hover:shadow-xl hover:opacity-90
                                   flex items-center justify-center gap-3">
                        <i class="fas fa-lock text-lg"></i>
                        Clôturer la journée
                    </button>` : `
                    <button onclick="ClotureCaisse.imprimerRecap()"
                            class="w-full py-4 rounded-xl font-bold text-base
                                   border-2 border-gray-300 text-gray-700
                                   hover:bg-gray-50 transition-colors
                                   flex items-center justify-center gap-3">
                        <i class="fas fa-print text-lg"></i>
                        Imprimer le récapitulatif
                    </button>`}

                </div>
                <!-- fin colonne droite -->

            </div>`;

        this._totalTheorique = totalTheorique;
    },

    // =========================================================================
    // _kpi()
    // =========================================================================
    _kpi(label, value, icon, color) {
        const colors = {
            blue:   'bg-blue-50 text-blue-600 border-blue-100',
            green:  'bg-green-50 text-green-600 border-green-100',
            red:    'bg-red-50 text-red-600 border-red-100',
            purple: 'bg-purple-50 text-purple-600 border-purple-100',
        };
        return `
            <div class="bg-white rounded-xl p-4 border ${colors[color]}
                        shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg flex items-center
                                justify-center ${colors[color]}">
                        <i class="${icon}"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-xs text-gray-500 truncate">${label}</p>
                        <p class="font-bold text-gray-800 text-sm">${value}</p>
                    </div>
                </div>
            </div>`;
    },

    // =========================================================================
    // recalcBilletage()
    // =========================================================================
    recalcBilletage() {
        let total = 0;
        this.COUPURES.forEach(c => {
            const input = document.getElementById(`billet-${c}`);
            const qty   = parseInt(input?.value || 0);
            const sous  = qty * c;
            total      += sous;
            const stEl  = document.getElementById(`sous-total-${c}`);
            if (stEl) stEl.textContent = Utils.formatUSD(sous);
        });

        const ouvertureInput   = document.getElementById('cc-montant-ouverture');
        const montantOuverture = parseFloat(ouvertureInput?.value || 0);

        const totalVentes  = this._ventes.reduce(
            (s, v) => s + parseFloat(v.montant_total || 0), 0
        );
        const totalEntrees = this._mouvements
            .filter(m => m.type === 'Entree')
            .reduce((s, m) => s + parseFloat(m.montant || 0), 0);
        const totalSorties = this._mouvements
            .filter(m => m.type === 'Sortie')
            .reduce((s, m) => s + parseFloat(m.montant || 0), 0);

        this._totalTheorique = montantOuverture + totalVentes
                               + totalEntrees - totalSorties;

        const totalEl  = document.getElementById('cc-total-billetage');
        const theoriEl = document.getElementById('cc-total-theorique');
        const ecartEl  = document.getElementById('cc-ecart');

        if (totalEl)  totalEl.textContent  = Utils.formatUSD(total);
        if (theoriEl) theoriEl.textContent = Utils.formatUSD(this._totalTheorique);

        if (ecartEl) {
            const ecart = total - this._totalTheorique;
            ecartEl.textContent =
                (ecart >= 0 ? '+' : '') +
                Utils.formatUSD(ecart) +
                (ecart === 0 ? ' ✅' : ecart > 0 ? ' ⬆️' : ' ⬇️');
            ecartEl.className = 'font-bold text-sm ' + (
                ecart === 0 ? 'text-green-600'
              : ecart > 0   ? 'text-blue-600'
              :               'text-red-600'
            );
        }
    },

    // =========================================================================
    // _getBilletage()
    // =========================================================================
    _getBilletage() {
        const result = {};
        this.COUPURES.forEach(c => {
            const input = document.getElementById(`billet-${c}`);
            result[c]   = parseInt(input?.value || 0);
        });
        return result;
    },

    // =========================================================================
    // ajouterMouvement()
    // =========================================================================
    ajouterMouvement(type) {
        const label = type === 'entree' ? 'Entrée' : 'Sortie';
        const color = type === 'entree' ? 'green'  : 'red';
        const icon  = type === 'entree'
            ? 'arrow-circle-down'
            : 'arrow-circle-up';

        const content = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium
                                  text-gray-700 mb-1">
                        Libellé <span class="text-red-500">*</span>
                    </label>
                    <input type="text"
                           id="mv-libelle"
                           placeholder="Ex: ${type === 'entree'
                               ? 'Apport de fonds'
                               : 'Achat fournitures'}"
                           class="w-full border border-gray-300 rounded-lg
                                  px-3 py-2 text-sm focus:ring-2
                                  focus:ring-yellow-400 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium
                                  text-gray-700 mb-1">
                        Montant ($) <span class="text-red-500">*</span>
                    </label>
                    <input type="number"
                           id="mv-montant"
                           min="0"
                           step="0.01"
                           placeholder="0.00"
                           class="w-full border border-gray-300 rounded-lg
                                  px-3 py-2 text-sm focus:ring-2
                                  focus:ring-yellow-400 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium
                                  text-gray-700 mb-1">
                        Note (optionnel)
                    </label>
                    <input type="text"
                           id="mv-note"
                           placeholder="Détail supplémentaire…"
                           class="w-full border border-gray-300 rounded-lg
                                  px-3 py-2 text-sm focus:ring-2
                                  focus:ring-yellow-400 focus:border-transparent">
                </div>
            </div>`;

        Utils.createModal(
            `<i class="fas fa-${icon} text-${color}-500 mr-2"></i>
             Ajouter une ${label}`,
            content,
            async (m) => {
                const libelle = document.getElementById('mv-libelle')
                                    ?.value?.trim();
                const montant = parseFloat(
                    document.getElementById('mv-montant')?.value || 0
                );
                const note = document.getElementById('mv-note')
                                 ?.value?.trim();

                if (!libelle) {
                    Utils.showToast('Veuillez saisir un libellé', 'warning');
                    return;
                }
                if (!montant || montant <= 0) {
                    Utils.showToast('Veuillez saisir un montant valide', 'warning');
                    return;
                }

                await this._saveMouvement({ type, libelle, montant, note });
                m.remove();
            },
            `Ajouter la ${label}`
        );

        setTimeout(() => document.getElementById('mv-libelle')?.focus(), 100);
    },

 // =========================================================================
    // ✅ Client Supabase authentifié — évite le 401
    // =========================================================================
    _getClient() {
        const client = AuthSupabase?.supabase || window.supabase;
        if (!client) throw new Error('Client Supabase non initialisé');
        return client;
    },

    // =========================================================================
    // _getCompteOhada()  — inchangé
    // =========================================================================
    _getCompteOhada(type, libelle = '') {
        const l = libelle.toLowerCase();

        if (type === 'entree') {
            if (l.includes('vente'))           return '701000';
            if (l.includes('apport'))          return '101000';
            if (l.includes('client'))          return '411000';
            if (l.includes('remboursement'))   return '409000';
            return '571100';
        }

        if (type === 'sortie') {
            if (l.includes('fourniss'))        return '401000';
            if (l.includes('salaire')
             || l.includes('paie'))            return '641000';
            if (l.includes('achat'))           return '601000';
            if (l.includes('loyer'))           return '613000';
            if (l.includes('électric')
             || l.includes('eau'))             return '614000';
            if (l.includes('transport'))       return '624000';
            if (l.includes('commission'))      return '651000';
            return '572100';
        }

        return '571100';
    },

    // =========================================================================
    // _saveMouvement() ✅ CORRIGÉ
    // =========================================================================
    async _saveMouvement({ type, libelle, montant, note }) {
        try {
            const user = AuthSupabase.getCurrentUser();

            console.log('👤 User courant :', user);

            // ✅ Vérifier session active
            const supabase = this._getClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                Utils.showToast('Session expirée — reconnectez-vous', 'error');
                return;
            }

            // ✅ Normaliser le type
            const TYPE_MAP = {
                'entree': 'Entree',
                'sortie': 'Sortie',
                'Entree': 'Entree',
                'Sortie': 'Sortie',
            };
            const typeNormalise = TYPE_MAP[type] ?? type;

            // ✅ date_journee en format DATE pur (YYYY-MM-DD)
            //    — plus d'ISO complet qui casse la colonne type "date"
            const payload = {
                type:         typeNormalise,
                date_journee: this._currentDate,          // ✅ "2026-04-01"
                libelle:      libelle,
                montant:      parseFloat(montant),
                source:       'caisse',
                compte_ohada: this._getCompteOhada(type, libelle),
            };

            if (note && note.trim() !== '') payload.note       = note.trim();
            if (user?.id)                   payload.created_by = user.id;

            console.log('📦 Payload final :', JSON.stringify(payload, null, 2));

            const { data, error } = await supabase          // ✅ client auth
                .from('mouvements_caisse')
                .insert([payload])
                .select();

            if (error) {
                console.error('❌ Erreur Supabase :', {
                    message: error.message,
                    details: error.details,
                    hint:    error.hint,
                    code:    error.code,
                    status:  error.status,
                });
                throw new Error(error.message);
            }

            console.log('✅ Mouvement inséré :', data);

            Utils.showToast(
                `${type === 'entree' ? 'Entrée' : 'Sortie'} enregistrée`,
                'success'
            );
            await this.chargerJournee();

        } catch (err) {
            console.error('❌ _saveMouvement catch:', err);
            Utils.showToast('Erreur : ' + err.message, 'error');
        }
    },

    // =========================================================================
    // supprimerMouvement() ✅ CORRIGÉ
    // =========================================================================
    async supprimerMouvement(id) {
        if (!confirm('Supprimer ce mouvement ?')) return;
        try {
            const supabase = this._getClient();             // ✅

            const { error } = await supabase
                .from('mouvements_caisse')
                .delete()
                .eq('id', id);

            if (error) throw error;

            Utils.showToast('Mouvement supprimé', 'success');
            await this.chargerJournee();

        } catch (err) {
            console.error('❌ supprimerMouvement:', err);
            Utils.showToast('Erreur : ' + err.message, 'error');
        }
    },

    // =========================================================================
    // cloturer() ✅ CORRIGÉ
    // =========================================================================
    async cloturer() {
        const billetage      = this._getBilletage();
        const totalBilletage = this.COUPURES.reduce(
            (s, c) => s + (billetage[c] * c), 0
        );
        const ecart = totalBilletage - (this._totalTheorique || 0);
        const notes = document.getElementById('cc-notes')
                          ?.value?.trim() || null;
        const commentaireGerant = document.getElementById(
            'cc-commentaire-gerant'
        )?.value?.trim() || null;

        const montantOuverture = parseFloat(
            document.getElementById('cc-montant-ouverture')?.value || 0
        );

        const ok = confirm(
            `Clôturer la journée du ${this._currentDate} ?\n\n` +
            `Total théorique : ${Utils.formatUSD(this._totalTheorique)}\n` +
            `Total en caisse : ${Utils.formatUSD(totalBilletage)}\n` +
            `Écart           : ${ecart >= 0 ? '+' : ''}` +
                              `${Utils.formatUSD(ecart)}\n\n` +
            `Cette action verrouillera la journée.`
        );
        if (!ok) return;

        try {
            const supabase = this._getClient();             // ✅
            const user     = AuthSupabase.getCurrentUser();

            // ✅ Vérifier session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                Utils.showToast('Session expirée — reconnectez-vous', 'error');
                return;
            }

            const payload = {
                date_journee:       this._currentDate,     // ✅ format DATE pur
                montant_ouverture:  montantOuverture,
                total_ventes:       this._ventes.reduce(
                                        (s, v) => s + parseFloat(
                                            v.montant_total || 0), 0),
                total_entrees:      this._mouvements
                                        .filter(m => m.type === 'Entree')
                                        .reduce((s, m) => s + parseFloat(
                                            m.montant || 0), 0),
                total_sorties:      this._mouvements
                                        .filter(m => m.type === 'Sortie')
                                        .reduce((s, m) => s + parseFloat(
                                            m.montant || 0), 0),
                total_theorique:    this._totalTheorique,
                total_billetage:    totalBilletage,
                ecart:              ecart,
                billetage:          billetage,
                notes:              notes,
                commentaire_gerant: commentaireGerant,
                statut:             'cloture',
                cloture_par:        user?.nom || user?.email || 'inconnu',
                user_id:            user?.id  || null,
                heure_cloture:      new Date().toISOString(),
            };

            console.log('📦 Payload clôture :', JSON.stringify(payload, null, 2));

            if (this._cloture?.id) {
                const { error } = await supabase            // ✅
                    .from('clotures_caisse')
                    .update(payload)
                    .eq('id', this._cloture.id);
                if (error) throw error;
            } else {
                const { error } = await supabase            // ✅
                    .from('clotures_caisse')
                    .insert([payload]);
                if (error) throw error;
            }

            Utils.showToast('✅ Journée clôturée avec succès', 'success');
            await this.chargerJournee();

        } catch (err) {
            console.error('❌ cloturer:', err);
            Utils.showToast('Erreur : ' + err.message, 'error');
        }
    },

    // =========================================================================
    // deverrouiller() ✅ CORRIGÉ
    // =========================================================================
    async deverrouiller() {
        if (!AuthSupabase.isGerant()) {
            Utils.showToast('Réservé au gérant', 'error');
            return;
        }
        if (!confirm('Déverrouiller cette journée pour la modifier ?')) return;

        try {
            const supabase = this._getClient();             // ✅
            const user     = AuthSupabase.getCurrentUser();

            const { error } = await supabase
                .from('clotures_caisse')
                .update({
                    statut:        'ouvert',
                    heure_cloture: null,
                    gerant_id:     user?.id  || null,
                    gerant_nom:    user?.nom  || null,
                    validated_at:  new Date().toISOString(),
                })
                .eq('id', this._cloture.id);

            if (error) throw error;

            Utils.showToast('Journée déverrouillée', 'warning');
            await this.chargerJournee();

        } catch (err) {
            console.error('❌ deverrouiller:', err);
            Utils.showToast('Erreur : ' + err.message, 'error');
        }
    },

    // =========================================================================
    // imprimerRecap() — inchangé
    // =========================================================================
    imprimerRecap() {
        const c         = this._cloture;
        const billetage = c?.billetage
            ? (typeof c.billetage === 'string'
                ? JSON.parse(c.billetage)
                : c.billetage)
            : {};

        const lignesBilletage = this.COUPURES.map(coupure => {
            const qty   = billetage[coupure] || 0;
            const total = qty * coupure;
            return `
                <tr>
                    <td style="padding:4px 8px;">Billet $${coupure}</td>
                    <td style="padding:4px 8px;text-align:center;">${qty}</td>
                    <td style="padding:4px 8px;text-align:right;">
                        $${total.toFixed(2)}
                    </td>
                </tr>`;
        }).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Récapitulatif Caisse — ${this._currentDate}</title>
                <style>
                    body  { font-family: Arial, sans-serif; font-size: 13px;
                            max-width: 480px; margin: 0 auto; padding: 20px; }
                    h1    { font-size: 18px; text-align: center;
                            margin-bottom: 4px; }
                    h2    { font-size: 13px; text-align: center; color: #666;
                            font-weight: normal; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse;
                            margin-bottom: 16px; }
                    th    { background: #f3f4f6; padding: 6px 8px;
                            text-align: left; font-size: 11px;
                            text-transform: uppercase; }
                    td    { border-bottom: 1px solid #e5e7eb; }
                    .total-row td { font-weight: bold; background: #f9fafb; }
                    .ecart-pos    { color: #2563eb; }
                    .ecart-neg    { color: #dc2626; }
                    .ecart-ok     { color: #16a34a; }
                    .section      { font-weight: bold; margin: 16px 0 6px;
                                    font-size: 13px;
                                    border-bottom: 2px solid #000;
                                    padding-bottom: 3px; }
                    .footer       { text-align: center; font-size: 11px;
                                    color: #9ca3af; margin-top: 24px; }
                </style>
            </head>
            <body>
                <h1>JL Beauty System</h1>
                <h2>Récapitulatif de caisse — ${this._currentDate}</h2>

                <div class="section">Résumé financier</div>
                <table>
                    <tr>
                        <td style="padding:4px 8px;">Fonds d'ouverture</td>
                        <td style="padding:4px 8px;text-align:right;">
                            $${(c?.montant_ouverture || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 8px;">Ventes du jour</td>
                        <td style="padding:4px 8px;text-align:right;">
                            $${(c?.total_ventes || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 8px;">Entrées manuelles</td>
                        <td style="padding:4px 8px;text-align:right;">
                            +$${(c?.total_entrees || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 8px;">Sorties manuelles</td>
                        <td style="padding:4px 8px;text-align:right;">
                            -$${(c?.total_sorties || 0).toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td style="padding:6px 8px;">Total théorique</td>
                        <td style="padding:6px 8px;text-align:right;">
                            $${(c?.total_theorique || 0).toFixed(2)}</td>
                    </tr>
                </table>

                <div class="section">Billetage physique</div>
                <table>
                    <tr>
                        <th>Coupure</th>
                        <th style="text-align:center;">Qté</th>
                        <th style="text-align:right;">Sous-total</th>
                    </tr>
                    ${lignesBilletage}
                    <tr class="total-row">
                        <td style="padding:6px 8px;" colspan="2">
                            Total en caisse
                        </td>
                        <td style="padding:6px 8px;text-align:right;">
                            $${(c?.total_billetage || 0).toFixed(2)}
                        </td>
                    </tr>
                </table>

                <div class="section">Écart</div>
                <table>
                    <tr class="total-row">
                        <td style="padding:6px 8px;">Écart</td>
                        <td style="padding:6px 8px;text-align:right;"
                            class="${(c?.ecart || 0) === 0 ? 'ecart-ok'
                                   : (c?.ecart || 0)  > 0  ? 'ecart-pos'
                                   :                         'ecart-neg'}">
                            ${(c?.ecart || 0) >= 0 ? '+' : ''}
                            $${(c?.ecart || 0).toFixed(2)}
                        </td>
                    </tr>
                </table>

                ${c?.notes ? `
                <div class="section">Notes caissière</div>
                <p style="padding:4px 8px;color:#374151;">${c.notes}</p>`
                : ''}

                ${c?.commentaire_gerant ? `
                <div class="section">Commentaire gérant</div>
                <p style="padding:4px 8px;color:#374151;">
                    ${c.commentaire_gerant}
                </p>` : ''}

                <div class="footer">
                    Clôturé par ${c?.cloture_par || '—'}<br>
                    ${c?.heure_cloture
                        ? new Date(c.heure_cloture).toLocaleString('fr-FR')
                        : ''}<br><br>
                    JL Beauty System — Édité le
                    ${new Date().toLocaleString('fr-FR')}
                </div>
            </body>
            </html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.print();
    },

};

// ── Export global ──────────────────────────────────────────────────────────────
window.ClotureCaisse = ClotureCaisse;
console.log('✅ ClotureCaisse loaded');