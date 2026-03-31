// Commissions Module - Version 4 — Paiement contrôlé par période
const CommissionsV3 = {
    data: [],
    coiffeuses: [],
    ventes: [],
    currentPeriod: null,

    async render(container) {
        await this.loadAllData();

        container.innerHTML = `
            <div class="mb-6 space-y-4">
                <div class="flex justify-between items-center">
                    <div class="flex space-x-3">
                        <button onclick="CommissionsV3.calculerCommissions()"
                                class="px-4 py-2 bg-gradient-to-r from-yellow-500 to-black text-white rounded-lg hover:shadow-lg">
                            <i class="fas fa-calculator mr-2"></i>Calculer les commissions
                        </button>

                        <!-- ✅ Bouton payer toutes — désactivé si aucune période -->
                        <button id="btn-pay-all"
                                onclick="CommissionsV3.markAllAsPaid()"
                                class="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                                disabled title="Sélectionnez d'abord une période">
                            <i class="fas fa-check-double mr-2"></i>Payer la période
                        </button>

                        <button onclick="CommissionsV3.exportCommissions()"
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-file-export mr-2"></i>Exporter
                        </button>
                    </div>
                </div>

                <!-- Filtre période -->
                <div id="period-filter-container"></div>

                <!-- ✅ Bandeau période active -->
                <div id="period-banner" class="hidden"></div>

                <div class="flex space-x-3">
                    <select id="filter-coiffeuse" class="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Toutes les coiffeuses</option>
                        ${this.coiffeuses.map(c =>
                            `<option value="${c.id}">${c.nom}</option>`
                        ).join('')}
                    </select>
                    <select id="filter-statut" class="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Tous les statuts</option>
                        <option value="Calculé">En attente (non payé)</option>
                        <option value="Payé">Payé</option>
                    </select>
                </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Commissions totales</p>
                    <p id="commission-total" class="text-2xl font-bold text-purple-600 mt-2">$0.00</p>
                    <p class="text-xs text-gray-500 mt-1">Période sélectionnée</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Payées</p>
                    <p id="commission-payees" class="text-2xl font-bold text-green-600 mt-2">$0.00</p>
                    <p class="text-xs text-gray-500 mt-1">✓ Déjà versées</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">En attente</p>
                    <p id="commission-attente" class="text-2xl font-bold text-orange-600 mt-2">$0.00</p>
                    <p class="text-xs text-gray-500 mt-1">⏳ À payer</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Coiffeuses actives</p>
                    <p id="coiffeuses-count" class="text-2xl font-bold text-blue-600 mt-2">0</p>
                    <p class="text-xs text-gray-500 mt-1">Dans la période</p>
                </div>
            </div>

            <!-- Table -->
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="table-container">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coiffeuse</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Services Rendus</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Paiement</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="commissions-table" class="divide-y divide-gray-200"></tbody>
                    </table>
                </div>
            </div>
        `;

        // Initialiser PeriodFilter
        const filterContainer = document.getElementById('period-filter-container');
        if (filterContainer && typeof PeriodFilter !== 'undefined') {
            filterContainer.innerHTML = PeriodFilter.render();
            setTimeout(() => {
                PeriodFilter.setup((period) => {
                    this.currentPeriod = period;
                    this._onPeriodChange();
                });
            }, 100);
        }

        this.renderTable();
        this.updateStats();
        this.setupFilters();
    },

    // ============================================================
    // ✅ Callback centralisé — déclenché à chaque changement de période
    // ============================================================
    _onPeriodChange() {
        this.renderTable();
        this.updateStats();
        this._updatePeriodBanner();
        this._updatePayAllButton();
    },

    // ✅ Bandeau informatif affichant la période active et son résumé
    _updatePeriodBanner() {
        const banner = document.getElementById('period-banner');
        if (!banner) return;

        if (!this.currentPeriod) {
            banner.className = 'hidden';
            return;
        }

        const filtered       = this.filterByPeriod(this.data);
        const unpaid         = filtered.filter(c => c.statut !== 'Payé');
        const totalUnpaid    = unpaid.reduce((s, c) => s + (c.total_commission || 0), 0);
        const periodLabel    = PeriodFilter.getLabel?.() || 'Période sélectionnée';

        banner.className = 'block';
        banner.innerHTML = `
            <div class="flex items-center justify-between p-4
                        bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-blue-500
                                flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-calendar-check text-white"></i>
                    </div>
                    <div>
                        <p class="font-semibold text-blue-800">
                            Période active : ${periodLabel}
                        </p>
                        <p class="text-sm text-blue-600">
                            ${filtered.length} commission(s) ·
                            ${unpaid.length} en attente ·
                            À payer : <strong>${Utils.formatCurrency(totalUnpaid)}</strong>
                        </p>
                    </div>
                </div>
                ${unpaid.length > 0 ? `
                    <span class="px-3 py-1 bg-orange-100 text-orange-700
                                 rounded-full text-sm font-medium">
                        <i class="fas fa-exclamation-circle mr-1"></i>
                        ${unpaid.length} non payée(s)
                    </span>` : `
                    <span class="px-3 py-1 bg-green-100 text-green-700
                                 rounded-full text-sm font-medium">
                        <i class="fas fa-check-circle mr-1"></i>
                        Tout payé
                    </span>`}
            </div>
        `;
    },

    // ✅ Active/désactive le bouton "Payer la période" selon l'état réel
    _updatePayAllButton() {
        const btn = document.getElementById('btn-pay-all');
        if (!btn) return;

        if (!this.currentPeriod) {
            btn.disabled   = true;
            btn.className  = 'px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed';
            btn.title      = 'Sélectionnez d\'abord une période';
            return;
        }

        const unpaid = this.filterByPeriod(this.data).filter(c => c.statut !== 'Payé');

        if (unpaid.length === 0) {
            btn.disabled  = true;
            btn.className = 'px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed';
            btn.title     = 'Toutes les commissions de cette période sont déjà payées';
        } else {
            btn.disabled  = false;
            btn.className = 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700';
            btn.title     = `Payer ${unpaid.length} commission(s) non payée(s)`;
        }
    },

    // ============================================================
    // ✅ markAsPaid — INDIVIDUEL avec modal de confirmation détaillée
    // ============================================================
    async markAsPaid(commissionId) {
        const commission = this.data.find(c => c.id === commissionId);
        if (!commission) return;

        // Bloquer si déjà payé
        if (commission.statut === 'Payé') {
            App.showNotification('Cette commission est déjà marquée comme payée', 'info');
            return;
        }

        // ✅ Date de paiement par défaut = aujourd'hui
        const today = new Date().toISOString().split('T')[0];

        const modalContent = `
            <div class="space-y-4">

                <!-- Récapitulatif -->
                <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div class="flex items-center space-x-3 mb-3">
                        <div class="w-10 h-10 rounded-full bg-green-500
                                    flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-dollar-sign text-white"></i>
                        </div>
                        <div>
                            <p class="font-bold text-green-800">
                                Confirmer le paiement
                            </p>
                            <p class="text-sm text-green-600">
                                Cette action est irréversible
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div class="bg-white rounded p-2">
                            <p class="text-gray-500">Coiffeuse</p>
                            <p class="font-semibold">${commission.coiffeuse_nom}</p>
                        </div>
                        <div class="bg-white rounded p-2">
                            <p class="text-gray-500">Période</p>
                            <p class="font-semibold">${commission.periode || '-'}</p>
                        </div>
                        <div class="bg-white rounded p-2">
                            <p class="text-gray-500">Services</p>
                            <p class="font-semibold">${commission.nombre_services || 0} service(s)</p>
                        </div>
                        <div class="bg-white rounded p-2">
                            <p class="text-gray-500">Montant à payer</p>
                            <p class="font-bold text-green-700 text-lg">
                                ${Utils.formatCurrency(commission.total_commission || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- ✅ Choix de la date de paiement effective -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Date de paiement *
                    </label>
                    <input type="date"
                           id="payment-date-single"
                           value="${today}"
                           max="${today}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                  focus:ring-2 focus:ring-green-500">
                    <p class="text-xs text-gray-500 mt-1">
                        <i class="fas fa-info-circle mr-1"></i>
                        La date ne peut pas être dans le futur
                    </p>
                </div>

                <!-- ✅ Note optionnelle -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Référence / Note
                        <span class="text-gray-400 text-xs">(facultatif)</span>
                    </label>
                    <input type="text"
                           id="payment-note-single"
                           placeholder="Ex: Virement #12345, Espèces..."
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                  focus:ring-2 focus:ring-green-500">
                </div>
            </div>
        `;

        Utils.createModal(
            'Enregistrer le paiement',
            modalContent,
            async (modal) => {
                const paymentDateInput = modal.querySelector('#payment-date-single');
                const paymentNoteInput = modal.querySelector('#payment-note-single');
                const paymentDate      = paymentDateInput?.value;

                if (!paymentDate) {
                    App.showNotification('Veuillez sélectionner une date de paiement', 'error');
                    return;
                }

                // ✅ Vérifier que la date n'est pas dans le futur
                if (new Date(paymentDate) > new Date()) {
                    App.showNotification(
                        'La date de paiement ne peut pas être dans le futur',
                        'error'
                    );
                    return;
                }

                try {
                    App.showLoading();
                    await Utils.update('commissions', commissionId, {
                        statut:          'Payé',
                        date_paiement:   new Date(paymentDate).toISOString(),
                        note_paiement:   paymentNoteInput?.value?.trim() || '',
                        updated_at:      new Date().toISOString()
                    });

                    await this.loadAllData();
                    this.renderTable();
                    this.updateStats();
                    this._updatePeriodBanner();
                    this._updatePayAllButton();

                    App.hideLoading();
                    App.showNotification(
                        `✅ Commission de ${commission.coiffeuse_nom} marquée comme payée`,
                        'success'
                    );
                    modal.remove();
                } catch (error) {
                    App.hideLoading();
                    App.showNotification('Erreur lors de la mise à jour', 'error');
                    console.error(error);
                }
            }
        );

        // ✅ Coloriser le bouton de confirmation en vert
        setTimeout(() => {
            const saveBtn = document.querySelector('.save-modal');
            if (saveBtn) {
                saveBtn.className = saveBtn.className
                    .replace('bg-purple-600', 'bg-green-600')
                    .replace('hover:bg-purple-700', 'hover:bg-green-700');
                saveBtn.innerHTML =
                    '<i class="fas fa-check mr-2"></i>Confirmer le paiement';
            }
        }, 50);
    },

    // ============================================================
    // ✅ markAllAsPaid — GROUPÉ par période avec modal récapitulatif
    // ============================================================
    async markAllAsPaid() {

        // ✅ Garde 1 — période obligatoire
        if (!this.currentPeriod) {
            App.showNotification(
                'Veuillez sélectionner une période avant de payer',
                'error'
            );
            return;
        }

        const filtered = this.filterByPeriod(this.data);
        const unpaid   = filtered.filter(c => c.statut !== 'Payé');

        // ✅ Garde 2 — aucune commission en attente
        if (unpaid.length === 0) {
            App.showNotification(
                'Toutes les commissions de cette période sont déjà payées',
                'info'
            );
            return;
        }

        const totalAmount  = unpaid.reduce((s, c) => s + (c.total_commission || 0), 0);
        const periodLabel  = PeriodFilter.getLabel?.() || 'Période sélectionnée';
        const today        = new Date().toISOString().split('T')[0];

        // ✅ Construire la liste des coiffeuses concernées
        const lignesCoiffeuses = unpaid.map(c => `
            <tr class="border-b">
                <td class="px-3 py-2">
                    <div class="flex items-center space-x-2">
                        <div class="w-7 h-7 rounded-full bg-purple-100 flex items-center
                                    justify-center flex-shrink-0">
                            <i class="fas fa-user text-purple-500 text-xs"></i>
                        </div>
                        <span class="font-medium">${c.coiffeuse_nom}</span>
                    </div>
                </td>
                <td class="px-3 py-2 text-center text-gray-600">
                    ${c.nombre_services || 0}
                </td>
                <td class="px-3 py-2 text-right font-bold text-purple-700">
                    ${Utils.formatCurrency(c.total_commission || 0)}
                </td>
            </tr>
        `).join('');

        const modalContent = `
            <div class="space-y-4">

                <!-- En-tête période -->
                <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full bg-blue-500
                                    flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-calendar-check text-white"></i>
                        </div>
                        <div>
                            <p class="font-bold text-blue-800">
                                Paiement groupé — ${periodLabel}
                            </p>
                            <p class="text-sm text-blue-600">
                                ${unpaid.length} coiffeuse(s) · Total :
                                <strong>${Utils.formatCurrency(totalAmount)}</strong>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- ✅ Tableau récapitulatif par coiffeuse -->
                <div>
                    <h4 class="font-semibold text-gray-700 mb-2">
                        Détail des paiements
                    </h4>
                    <div class="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50 sticky top-0">
                                <tr>
                                    <th class="px-3 py-2 text-left">Coiffeuse</th>
                                    <th class="px-3 py-2 text-center">Services</th>
                                    <th class="px-3 py-2 text-right">Commission</th>
                                </tr>
                            </thead>
                            <tbody>${lignesCoiffeuses}</tbody>
                            <!-- ✅ Ligne total -->
                            <tfoot class="bg-gray-50 font-bold border-t-2 border-gray-300">
                                <tr>
                                    <td class="px-3 py-2">TOTAL</td>
                                    <td class="px-3 py-2 text-center">
                                        ${unpaid.reduce((s, c) => s + (c.nombre_services || 0), 0)}
                                    </td>
                                    <td class="px-3 py-2 text-right text-green-700">
                                        ${Utils.formatCurrency(totalAmount)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- ✅ Date de paiement commune -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Date de paiement *
                    </label>
                    <input type="date"
                           id="payment-date-all"
                           value="${today}"
                           max="${today}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                  focus:ring-2 focus:ring-green-500">
                    <p class="text-xs text-gray-500 mt-1">
                        <i class="fas fa-info-circle mr-1"></i>
                        Appliquée à toutes les coiffeuses listées ci-dessus
                    </p>
                </div>

                <!-- ✅ Référence optionnelle -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Référence de paiement
                        <span class="text-gray-400 text-xs">(facultatif)</span>
                    </label>
                    <input type="text"
                           id="payment-note-all"
                           placeholder="Ex: Virement du mois, Espèces, Chèque #..."
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                  focus:ring-2 focus:ring-green-500">
                </div>

                <!-- ✅ Avertissement irréversible -->
                <div class="flex items-start space-x-2 p-3
                            bg-yellow-50 border border-yellow-200 rounded-lg">
                    <i class="fas fa-exclamation-triangle text-yellow-500 mt-0.5 flex-shrink-0"></i>
                    <p class="text-xs text-yellow-700">
                        Cette action marquera
                        <strong>${unpaid.length} commission(s)</strong>
                        comme payées. Elle ne peut pas être annulée automatiquement.
                    </p>
                </div>
            </div>
        `;

        Utils.createModal(
            'Paiement groupé par période',
            modalContent,
            async (modal) => {
                const paymentDateInput = modal.querySelector('#payment-date-all');
                const paymentNoteInput = modal.querySelector('#payment-note-all');
                const paymentDate      = paymentDateInput?.value;

                // ✅ Garde 3 — date obligatoire
                if (!paymentDate) {
                    App.showNotification(
                        'Veuillez sélectionner une date de paiement',
                        'error'
                    );
                    return;
                }

                // ✅ Garde 4 — date pas dans le futur
                if (new Date(paymentDate) > new Date()) {
                    App.showNotification(
                        'La date de paiement ne peut pas être dans le futur',
                        'error'
                    );
                    return;
                }

                try {
                    App.showLoading();

                    const paymentIso  = new Date(paymentDate).toISOString();
                    const paymentNote = paymentNoteInput?.value?.trim() || '';
                    let   successCount = 0;
                    const errors       = [];

                    for (const commission of unpaid) {
                        try {
                            await Utils.update('commissions', commission.id, {
                                statut:          'Payé',
                                date_paiement:   paymentIso,
                                note_paiement:   paymentNote,
                                updated_at:      new Date().toISOString()
                            });
                            successCount++;
                        } catch (err) {
                            // ✅ Isoler les erreurs individuelles
                            errors.push(commission.coiffeuse_nom);
                            console.error(
                                `[Commissions] Erreur paiement ${commission.coiffeuse_nom}:`,
                                err
                            );
                        }
                    }

                    await this.loadAllData();
                    this.renderTable();
                    this.updateStats();
                    this._updatePeriodBanner();
                    this._updatePayAllButton();

                    App.hideLoading();

                    if (errors.length === 0) {
                        App.showNotification(
                            `✅ ${successCount} commission(s) payée(s) pour la période ${periodLabel}`,
                            'success'
                        );
                    } else {
                        App.showNotification(
                            `⚠️ ${successCount} réussie(s), ${errors.length} erreur(s) : ${errors.join(', ')}`,
                            'error'
                        );
                    }

                    modal.remove();
                } catch (error) {
                    App.hideLoading();
                    App.showNotification('Erreur lors du paiement groupé', 'error');
                    console.error(error);
                }
            }
        );

        // ✅ Coloriser le bouton de confirmation
        setTimeout(() => {
            const saveBtn = document.querySelector('.save-modal');
            if (saveBtn) {
                saveBtn.className = saveBtn.className
                    .replace('bg-purple-600', 'bg-green-600')
                    .replace('hover:bg-purple-700', 'hover:bg-green-700');
                saveBtn.innerHTML =
                    `<i class="fas fa-check-double mr-2"></i>
                     Payer ${unpaid.length} commission(s)`;
            }
        }, 50);
    },

    // ============================================================
    // Reste des méthodes — inchangées
    // ============================================================

    async loadAllData() {
        try {
            const [commissionsData, coiffeusesData, ventesData] = await Promise.all([
                Utils.get('commissions'),
                Utils.get('coiffeuses'),
                Utils.get('ventes')
            ]);
            this.data       = commissionsData.data || [];
            this.coiffeuses = coiffeusesData.data  || [];
            this.ventes     = ventesData.data       || [];
        } catch (error) {
            console.error('Error loading data:', error);
        }
    },

    filterByPeriod(data) {
        if (!this.currentPeriod) return data;
        return data.filter(item => {
            const itemDate = new Date(item.date_calcul || item.created_at);
            return itemDate >= this.currentPeriod.start &&
                   itemDate <= this.currentPeriod.end;
        });
    },

    updateStats() {
        const filteredData       = this.filterByPeriod(this.data);
        const totalCommission    = filteredData.reduce((s, c) => s + (c.total_commission || 0), 0);
        const commissionsPaid    = filteredData
            .filter(c => c.statut === 'Payé')
            .reduce((s, c) => s + (c.total_commission || 0), 0);
        const commissionsAttente = filteredData
            .filter(c => c.statut === 'Calculé' || c.statut === 'En attente')
            .reduce((s, c) => s + (c.total_commission || 0), 0);
        const uniqueCoiffeuses   = new Set(filteredData.map(c => c.coiffeuse_id)).size;

        document.getElementById('commission-total').textContent   = Utils.formatCurrency(totalCommission);
        document.getElementById('commission-payees').textContent  = Utils.formatCurrency(commissionsPaid);
        document.getElementById('commission-attente').textContent = Utils.formatCurrency(commissionsAttente);
        document.getElementById('coiffeuses-count').textContent   = uniqueCoiffeuses;
    },

    renderTable(filteredData = null) {
        let dataToRender = filteredData || this.filterByPeriod(this.data);
        dataToRender = dataToRender.sort(
            (a, b) => new Date(b.date_calcul) - new Date(a.date_calcul)
        );

        const tbody = document.getElementById('commissions-table');
        if (!tbody) return;

        if (dataToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-money-bill-wave text-4xl mb-2"></i>
                        <p>Aucune commission pour la période sélectionnée</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = dataToRender.map(comm => {
            const isPaid = comm.statut === 'Payé';
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                        <p class="font-medium text-gray-800">
                            ${comm.coiffeuse_nom || 'N/A'}
                        </p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-sm text-gray-800">${comm.periode || '-'}</p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-sm text-gray-800">
                            ${comm.nombre_services || 0} service(s)
                        </p>
                        <p class="text-xs text-gray-500">
                            Total : ${Utils.formatCurrency(comm.total_ventes || 0)}
                        </p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="font-bold text-purple-600">
                            ${Utils.formatCurrency(comm.total_commission || 0)}
                        </p>
                    </td>
                    <td class="px-6 py-4">
                        ${isPaid
                            ? `<span class="px-3 py-1 text-xs rounded-full
                                          bg-green-100 text-green-800">
                                   <i class="fas fa-check-circle mr-1"></i>Payé
                               </span>`
                            : `<span class="px-3 py-1 text-xs rounded-full
                                          bg-orange-100 text-orange-800">
                                   <i class="fas fa-clock mr-1"></i>En attente
                               </span>`}
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-sm text-gray-800">
                            ${comm.date_paiement
                                ? Utils.formatDate(comm.date_paiement)
                                : '-'}
                        </p>
                        ${comm.note_paiement ? `
                            <p class="text-xs text-gray-400 italic">
                                ${comm.note_paiement}
                            </p>` : ''}
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex space-x-2">
                            ${!isPaid ? `
                                <button onclick="CommissionsV3.markAsPaid('${comm.id}')"
                                        class="text-green-600 hover:text-green-800"
                                        title="Marquer comme payé">
                                    <i class="fas fa-dollar-sign"></i>
                                </button>` : ''}
                            <button onclick="CommissionsV3.showDetails('${comm.id}')"
                                    class="text-blue-600 hover:text-blue-800"
                                    title="Voir détails">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="CommissionsV3.printReceipt('${comm.id}')"
                                    class="text-purple-600 hover:text-purple-800"
                                    title="Imprimer reçu">
                                <i class="fas fa-print"></i>
                            </button>
                            <button onclick="CommissionsV3.deleteCommission('${comm.id}')"
                                    class="text-red-600 hover:text-red-800"
                                    title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    },

    setupFilters() {
        const filterCoiffeuse = document.getElementById('filter-coiffeuse');
        const filterStatut    = document.getElementById('filter-statut');

        const applyFilters = () => {
            const coiffeuseId = filterCoiffeuse?.value || '';
            const statut      = filterStatut?.value    || '';

            let filtered = this.filterByPeriod(this.data);
            if (coiffeuseId) filtered = filtered.filter(c => c.coiffeuse_id === coiffeuseId);
            if (statut)      filtered = filtered.filter(c => c.statut === statut);

            this.renderTable(filtered);
        };

        filterCoiffeuse?.addEventListener('change', applyFilters);
        filterStatut?.addEventListener('change', applyFilters);
    },

    async calculerCommissions() {
        if (!this.currentPeriod) {
            App.showNotification('Veuillez sélectionner une période', 'error');
            return;
        }

        try {
            App.showLoading();

            const salesInPeriod = this.ventes.filter(vente => {
                const venteDate = new Date(vente.date_vente || vente.created_at);
                return venteDate >= this.currentPeriod.start &&
                       venteDate <= this.currentPeriod.end &&
                       (vente.type === 'Service' || vente.type === 'Mixte');
            });

            if (salesInPeriod.length === 0) {
                App.hideLoading();
                App.showNotification('Aucune vente de service dans cette période', 'info');
                return;
            }

            const commissionsByCoiffeuse = {};

            salesInPeriod.forEach(vente => {
                let items = [];
                if (Array.isArray(vente.items)) {
                    items = vente.items;
                } else if (typeof vente.items === 'string') {
                    try { items = JSON.parse(vente.items); } catch(e) { items = []; }
                }

                if (items.length > 0) {
                    items.forEach(item => {
                        if (vente.type === 'Mixte' && item.item_type !== 'Service') return;
                        const coiffeuseId = item.coiffeuse_id;
                        if (!coiffeuseId) return;

                        const commission  = item.commission    || 0;
                        const montant     = (item.prix_unitaire || 0) * (item.quantite || 1);
                        const coiffeuse   = this.coiffeuses.find(c => c.id === coiffeuseId);
                        const coiffeusNom = item.coiffeuse_nom || coiffeuse?.nom || 'N/A';

                        if (!commissionsByCoiffeuse[coiffeuseId]) {
                            commissionsByCoiffeuse[coiffeuseId] = {
                                coiffeuse_id:     coiffeuseId,
                                coiffeuse_nom:    coiffeusNom,
                                total_commission: 0,
                                total_ventes:     0,
                                nombre_services:  0,
                                details:          []
                            };
                        }

                        commissionsByCoiffeuse[coiffeuseId].total_commission += commission;
                        commissionsByCoiffeuse[coiffeuseId].total_ventes     += montant;
                        commissionsByCoiffeuse[coiffeuseId].nombre_services  += 1;
                        commissionsByCoiffeuse[coiffeuseId].details.push({
                            service_nom: item.item_nom || item.nom || '-',
                            montant,
                            commission,
                            taux: item.taux_commission || 0,
                            date: vente.date_vente
                        });
                    });
                } else {
                    const coiffeuseId = vente.coiffeuse_id;
                    if (!coiffeuseId) return;

                    const commission  = vente.commission || 0;
                    const coiffeuse   = this.coiffeuses.find(c => c.id === coiffeuseId);
                    const coiffeusNom = vente.coiffeuse_nom || coiffeuse?.nom || 'N/A';

                    if (!commissionsByCoiffeuse[coiffeuseId]) {
                        commissionsByCoiffeuse[coiffeuseId] = {
                            coiffeuse_id:     coiffeuseId,
                            coiffeuse_nom:    coiffeusNom,
                            total_commission: 0,
                            total_ventes:     0,
                            nombre_services:  0,
                            details:          []
                        };
                    }

                    commissionsByCoiffeuse[coiffeuseId].total_commission += commission;
                    commissionsByCoiffeuse[coiffeuseId].total_ventes     += (vente.montant_total || 0);
                    commissionsByCoiffeuse[coiffeuseId].nombre_services  += 1;
                    commissionsByCoiffeuse[coiffeuseId].details.push({
                        service_nom: vente.item_nom || vente.article_nom || '-',
                        montant:     vente.montant_total || 0,
                        commission,
                        taux: vente.taux_commission || 0,
                        date: vente.date_vente
                    });
                }
            });

            if (Object.keys(commissionsByCoiffeuse).length === 0) {
                App.hideLoading();
                App.showNotification(
                    'Aucune commission à calculer (coiffeuses non assignées ?)', 'info'
                );
                return;
            }

            const periodLabel = PeriodFilter.getLabel?.() || 'Période personnalisée';

            for (const coiffeuseId in commissionsByCoiffeuse) {
                const commData = commissionsByCoiffeuse[coiffeuseId];
                await Utils.create('commissions', {
                    coiffeuse_id:     commData.coiffeuse_id,
                    coiffeuse_nom:    commData.coiffeuse_nom,
                    periode:          periodLabel,
                    date_calcul:      new Date().toISOString(),
                    nombre_services:  commData.nombre_services,
                    total_ventes:     Math.round(commData.total_ventes     * 100) / 100,
                    total_commission: Math.round(commData.total_commission * 100) / 100,
                    details:          commData.details,
                    statut:           'Calculé',
                    date_paiement:    null,
                    note_paiement:    ''
                });
            }

            await this.loadAllData();
            this.renderTable();
            this.updateStats();
            this._updatePeriodBanner();
            this._updatePayAllButton();

            App.hideLoading();
            App.showNotification(
                `Commissions calculées pour ${Object.keys(commissionsByCoiffeuse).length} coiffeuse(s)`,
                'success'
            );
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors du calcul des commissions', 'error');
            console.error('[Commissions] calculerCommissions error:', error);
        }
    },

    showDetails(commissionId) {
        const commission = this.data.find(c => c.id === commissionId);
        if (!commission) return;

        let details = [];
        if (Array.isArray(commission.details)) {
            details = commission.details;
        } else if (typeof commission.details === 'string') {
            try { details = JSON.parse(commission.details); } catch(e) { details = []; }
        }

        const modalContent = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <p class="text-sm text-gray-600">Coiffeuse</p>
                        <p class="font-bold">${commission.coiffeuse_nom}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Période</p>
                        <p class="font-bold">${commission.periode || '-'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Services rendus</p>
                        <p class="font-bold">${commission.nombre_services || 0}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Total ventes</p>
                        <p class="font-bold">
                            ${Utils.formatCurrency(commission.total_ventes || 0)}
                        </p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Commission totale</p>
                        <p class="font-bold text-purple-600 text-xl">
                            ${Utils.formatCurrency(commission.total_commission || 0)}
                        </p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Statut</p>
                        <p class="font-bold ${commission.statut === 'Payé'
                            ? 'text-green-600' : 'text-orange-600'}">
                            ${commission.statut}
                        </p>
                    </div>
                    ${commission.note_paiement ? `
                    <div class="col-span-2">
                        <p class="text-sm text-gray-600">Référence paiement</p>
                        <p class="font-medium text-gray-700 italic">
                            ${commission.note_paiement}
                        </p>
                    </div>` : ''}
                </div>

                ${details.length > 0 ? `
                    <div>
                        <h3 class="font-bold mb-2">Détail des services</h3>
                        <div class="max-h-64 overflow-y-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th class="px-3 py-2 text-left">Service</th>
                                        <th class="px-3 py-2 text-right">Montant</th>
                                        <th class="px-3 py-2 text-right">Commission</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${details.map(d => `
                                        <tr class="border-b">
                                            <td class="px-3 py-2">
                                                ${d.service_nom || '-'}
                                            </td>
                                            <td class="px-3 py-2 text-right">
                                                ${Utils.formatCurrency(d.montant || 0)}
                                            </td>
                                            <td class="px-3 py-2 text-right font-bold">
                                                ${Utils.formatCurrency(d.commission || 0)}
                                            </td>
                                        </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : '<p class="text-gray-500 text-center py-4">Aucun détail disponible</p>'}
            </div>
        `;

        Utils.createModal('Détails de la commission', modalContent, null, false);
    },

    printReceipt(commissionId) {
        const commission = this.data.find(c => c.id === commissionId);
        if (!commission) return;

        let details = [];
        if (Array.isArray(commission.details)) {
            details = commission.details;
        } else if (typeof commission.details === 'string') {
            try { details = JSON.parse(commission.details); } catch(e) { details = []; }
        }

        const receiptHTML = `
            <!DOCTYPE html><html><head>
            <meta charset="UTF-8">
            <title>Reçu de Commission</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px;
                       max-width: 600px; margin: 0 auto; }
                h1, h2 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total { font-size: 16px; font-weight: bold;
                         text-align: right; margin-top: 20px; }
            </style></head><body>
            <h1>JL Beauty System</h1>
            <h2>Reçu de Commission</h2>
            <p><strong>Coiffeuse :</strong> ${commission.coiffeuse_nom}</p>
            <p><strong>Période :</strong> ${commission.periode || '-'}</p>
            <p><strong>Date de calcul :</strong>
                ${Utils.formatDate(commission.date_calcul)}</p>
            <p><strong>Statut :</strong> ${commission.statut}</p>
            ${commission.date_paiement
                ? `<p><strong>Date de paiement :</strong>
                   ${Utils.formatDate(commission.date_paiement)}</p>`
                : ''}
            ${commission.note_paiement
                ? `<p><strong>Référence :</strong> ${commission.note_paiement}</p>`
                : ''}
            <table>
                <thead>
                    <tr>
                        <th>Service</th><th>Montant</th><th>Commission</th>
                    </tr>
                </thead>
                <tbody>
                    ${details.map(d => `
                        <tr>
                            <td>${d.service_nom || '-'}</td>
                            <td>${Utils.formatCurrency(d.montant || 0)}</td>
                            <td>${Utils.formatCurrency(d.commission || 0)}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
            <div class="total">
                <p>Total des ventes :
                   ${Utils.formatCurrency(commission.total_ventes || 0)}</p>
                <p>Commission totale :
                   ${Utils.formatCurrency(commission.total_commission || 0)}</p>
            </div>
            <script>window.onload = () => {
                window.print(); window.close();
            }<\/script>
            </body></html>
        `;

        const win = window.open('', '', 'width=800,height=600');
        win.document.write(receiptHTML);
        win.document.close();
    },

    exportCommissions() {
        const filtered = this.filterByPeriod(this.data);

        if (filtered.length === 0) {
            App.showNotification('Aucune commission à exporter', 'info');
            return;
        }

        const headers = [
            'Coiffeuse', 'Période', 'Services',
            'Total Ventes', 'Commission',
            'Statut', 'Date Paiement', 'Référence'
        ];
        const rows = filtered.map(c => [
            c.coiffeuse_nom,
            c.periode,
            c.nombre_services,
            c.total_ventes,
            c.total_commission,
            c.statut,
            c.date_paiement ? Utils.formatDate(c.date_paiement) : '-',
            c.note_paiement || '-'
        ]);

        const csv = [headers, ...rows].map(row =>
            row.map(cell =>
                `"${String(cell ?? '').replace(/"/g, '""')}"`
            ).join(',')
        ).join('\n');

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `commissions-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        App.showNotification('Commissions exportées', 'success');
    },

    async deleteCommission(commissionId) {
        if (!confirm('Supprimer cette commission ?')) return;

        try {
            App.showLoading();
            await Utils.delete('commissions', commissionId);
            await this.loadAllData();
            this.renderTable();
            this.updateStats();
            this._updatePeriodBanner();
            this._updatePayAllButton();
            App.hideLoading();
            App.showNotification('Commission supprimée', 'success');
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de la suppression', 'error');
            console.error(error);
        }
    }
};