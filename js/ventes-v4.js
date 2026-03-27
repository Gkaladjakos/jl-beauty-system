// =============================================================================
// VENTES MODULE — Fichier unique et complet
// Remplace : ventes-v4.js + ventes-v4-methods.js + ventes-v4-save.js
// Dans index.html : <script src="ventes.js"></script>
// =============================================================================

const Ventes = {

    // ─── État ────────────────────────────────────────────────────────────────
    data: [],
    clients: [],
    coiffeuses: [],
    services: [],
    produits: [],
    rendezVous: [],
    currentType: 'Service',
    selectedItems: [],
    currentTotal: 0,

    // =========================================================================
    // 1. render()
    // =========================================================================
    async render(container) {
        await this.loadAllData();

        container.innerHTML = `
            ${PeriodFilter.renderHTML('ventes-period-filter')}

            <div class="mb-6 flex justify-between items-center">
                <button onclick="Ventes.showAddModal()"
                        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <i class="fas fa-plus mr-2"></i>Enregistrer une vente
                </button>
                <div class="flex space-x-3">
                    <select id="filter-type" class="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Tous les types</option>
                        <option value="Service">Service</option>
                        <option value="Produit">Produit</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Ventes période</p>
                    <p id="ventes-periode" class="text-2xl font-bold text-purple-600 mt-2">$0.00</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Services</p>
                    <p id="ventes-services" class="text-2xl font-bold text-blue-600 mt-2">$0.00</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Produits</p>
                    <p id="ventes-produits" class="text-2xl font-bold text-green-600 mt-2">$0.00</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Commissions</p>
                    <p id="total-commissions" class="text-2xl font-bold text-orange-600 mt-2">$0.00</p>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="table-container">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="ventes-table" class="divide-y divide-gray-200"></tbody>
                    </table>
                </div>
            </div>
        `;

        PeriodFilter.setup(() => {
            this.renderTable();
            this.updateStats();
        });
        PeriodFilter.onExport = () => this.exportPeriod();

        this.renderTable();
        this.updateStats();
        this.setupFilters();
    },

    // =========================================================================
    // 2. loadAllData()
    // =========================================================================
    async loadAllData() {
        try {
            const [ventesData, clientsData, coiffeusesData, servicesData, produitsData, rdvData] = await Promise.all([
                Utils.get('ventes'),
                Utils.get('clients'),
                Utils.get('coiffeuses'),
                Utils.get('services'),
                Utils.get('produits'),
                Utils.get('rendez_vous')
            ]);
            this.data       = ventesData.data      || [];
            this.clients    = clientsData.data     || [];
            this.coiffeuses = coiffeusesData.data  || [];
            this.services   = servicesData.data    || [];
            this.produits   = produitsData.data    || [];
            this.rendezVous = rdvData.data         || [];
        } catch (error) {
            console.error('[Ventes] loadAllData error:', error);
        }
    },

    // =========================================================================
    // 3. updateStats()
    // =========================================================================
    updateStats() {
        const filteredData     = PeriodFilter.filterData(this.data, 'date_vente');
        const totalPeriode     = filteredData.reduce((s, v) => s + (v.montant_total || 0), 0);
        const totalServices    = filteredData.filter(v => v.type === 'Service').reduce((s, v) => s + (v.montant_total || 0), 0);
        const totalProduits    = filteredData.filter(v => v.type === 'Produit').reduce((s, v) => s + (v.montant_total || 0), 0);
        const totalCommissions = filteredData.reduce((s, v) => s + (v.commission || 0), 0);

        document.getElementById('ventes-periode').textContent    = Utils.formatCurrency(totalPeriode);
        document.getElementById('ventes-services').textContent   = Utils.formatCurrency(totalServices);
        document.getElementById('ventes-produits').textContent   = Utils.formatCurrency(totalProduits);
        document.getElementById('total-commissions').textContent = Utils.formatCurrency(totalCommissions);
    },

    // =========================================================================
    // 4. renderTable()
    // =========================================================================
    renderTable() {
        const tbody = document.getElementById('ventes-table');
        if (!tbody) return;

        let filteredData = PeriodFilter.filterData(this.data, 'date_vente');
        const typeFilter = document.getElementById('filter-type')?.value;
        if (typeFilter) filteredData = filteredData.filter(v => v.type === typeFilter);

        filteredData.sort((a, b) => new Date(b.date_vente) - new Date(a.date_vente));

        if (filteredData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-inbox text-4xl mb-2"></i>
                        <p>Aucune vente pour cette période</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = filteredData.map(vente => {
            const date      = Utils.formatDateTime(vente.date_vente);
            const typeBadge = vente.type === 'Service'
                ? '<span class="badge bg-blue-100 text-blue-800">Service</span>'
                : '<span class="badge bg-green-100 text-green-800">Produit</span>';

            const items = typeof vente.items === 'string'
                ? (() => { try { return JSON.parse(vente.items); } catch(e) { return null; } })()
                : vente.items;

            let details = '';
            if (items && Array.isArray(items) && items.length > 0) {
                details = items.length > 1
                    ? `${items.length} ${vente.type === 'Service' ? 'services' : 'produits'}`
                    : (items[0].item_nom || items[0].service_nom || items[0].nom || '-');
            } else {
                details = vente.item_nom || '-';
            }

            const paiementInfo = vente.montant_percu
                ? `Perçu: ${Utils.formatCurrency(vente.montant_percu)}<br>Monnaie: ${Utils.formatCurrency(vente.monnaie || 0)}`
                : (vente.mode_paiement || '-');

            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm">${date}</td>
                    <td class="px-6 py-4">${typeBadge}</td>
                    <td class="px-6 py-4 text-sm">
                        <div class="font-medium">${vente.client_nom || 'Anonyme'}</div>
                        <div class="text-gray-500 text-xs">${vente.client_telephone || ''}</div>
                    </td>
                    <td class="px-6 py-4 text-sm">${details}</td>
                    <td class="px-6 py-4 text-sm font-semibold">${Utils.formatCurrency(vente.montant_total)}</td>
                    <td class="px-6 py-4 text-xs text-gray-600">${paiementInfo}</td>
                    <td class="px-6 py-4">
                        <button onclick="Ventes.showDetails('${vente.id}')"
                                class="text-blue-600 hover:text-blue-800 mr-2" title="Détails">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="Ventes.printReceipt('${vente.id}')"
                                class="text-green-600 hover:text-green-800" title="Imprimer reçu">
                            <i class="fas fa-print"></i>
                        </button>
                    </td>
                </tr>`;
        }).join('');
    },

    // =========================================================================
    // 5. setupFilters()
    // =========================================================================
    setupFilters() {
        const typeFilter = document.getElementById('filter-type');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.renderTable();
                this.updateStats();
            });
        }
    },

    // =========================================================================
    // 6. showAddModal()
    // =========================================================================
    showAddModal() {
        this.selectedItems = [];
        this.currentTotal  = 0;

        const modalContent = `
            <form id="vente-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Type de vente *</label>
                    <div class="grid grid-cols-2 gap-4">
                        <button type="button" onclick="Ventes.setType('Service')"
                                id="btn-type-service"
                                class="px-4 py-3 border-2 border-blue-600 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100">
                            <i class="fas fa-cut mr-2"></i>Service
                        </button>
                        <button type="button" onclick="Ventes.setType('Produit')"
                                id="btn-type-produit"
                                class="px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50">
                            <i class="fas fa-shopping-bag mr-2"></i>Produit
                        </button>
                    </div>
                </div>

                <div id="service-rdv-option" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="link-rdv" class="mr-3 w-4 h-4" onchange="Ventes.toggleRdvLink()">
                        <span class="text-sm font-medium text-blue-800">
                            <i class="fas fa-link mr-2"></i>Lier à un rendez-vous existant
                        </span>
                    </label>
                    <div id="rdv-selector" class="hidden mt-3">
                        <select id="select-rdv" class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                onchange="Ventes.loadFromRdv()">
                            <option value="">Sélectionner un rendez-vous...</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone client *</label>
                        <input type="tel" id="client-telephone" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                               placeholder="+243 XXX XXX XXX">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom client (optionnel)</label>
                        <input type="text" id="client-nom"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                               placeholder="Nom du client">
                    </div>
                </div>

                <div id="items-area"></div>

                <div id="selected-items-display" class="hidden">
                    <h4 class="font-medium text-gray-700 mb-2">Articles sélectionnés :</h4>
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-gray-300">
                                    <th class="text-left py-2">Article</th>
                                    <th class="text-center py-2">Qté</th>
                                    <th class="text-right py-2">P.U.</th>
                                    <th class="text-right py-2">Total</th>
                                    <th class="text-center py-2">Action</th>
                                </tr>
                            </thead>
                            <tbody id="selected-items-table"></tbody>
                        </table>
                        <div class="border-t border-gray-300 mt-3 pt-3 flex justify-between font-bold">
                            <span>TOTAL :</span>
                            <span id="total-amount">$0.00</span>
                        </div>
                        <div id="commission-total" class="hidden text-sm text-gray-600 mt-2 flex justify-between">
                            <span>Commission totale :</span>
                            <span id="total-commission">$0.00</span>
                        </div>
                    </div>
                </div>

                <div class="border-t border-gray-200 pt-4">
                    <h4 class="font-medium text-gray-700 mb-3">Paiement</h4>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Mode de paiement *</label>
                            <select name="mode_paiement" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="Espèces">Espèces</option>
                                <option value="Carte bancaire">Carte bancaire</option>
                                <option value="Mobile Money">Mobile Money</option>
                                <option value="Chèque">Chèque</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Montant perçu</label>
                            <input type="number" id="montant-percu" step="0.01" min="0"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                   placeholder="0.00" oninput="Ventes.calculateChange()">
                        </div>
                    </div>

                    <div id="change-display" class="hidden bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-green-800">Monnaie à rendre :</span>
                            <span id="change-amount" class="text-xl font-bold text-green-700">$0.00</span>
                        </div>
                    </div>

                    <div id="insufficient-payment" class="hidden bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
                        <p class="text-sm text-red-800">
                            <i class="fas fa-exclamation-triangle mr-2"></i>Montant insuffisant
                        </p>
                    </div>
                </div>
            </form>
        `;

        const modal = Utils.createModal(
            '<i class="fas fa-cash-register mr-2"></i>Enregistrer une vente',
            modalContent,
            () => Ventes.saveVente(modal)
        );

        document.body.appendChild(modal);
        this.setType('Service');
        this.loadRdvOptions();
    },

    // =========================================================================
    // 7. setType()
    // =========================================================================
    setType(type) {
        this.currentType   = type;
        this.selectedItems = [];
        this.currentTotal  = 0;

        const btnService = document.getElementById('btn-type-service');
        const btnProduit = document.getElementById('btn-type-produit');
        const rdvOption  = document.getElementById('service-rdv-option');

        if (btnService && btnProduit) {
            if (type === 'Service') {
                btnService.className = 'px-4 py-3 border-2 border-blue-600 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100';
                btnProduit.className = 'px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50';
            } else {
                btnProduit.className = 'px-4 py-3 border-2 border-green-600 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100';
                btnService.className = 'px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50';
            }
        }

        if (rdvOption) rdvOption.style.display = type === 'Service' ? '' : 'none';

        this.renderItemsArea();
        this.renderSelectedItems();
    },

    // =========================================================================
    // 8. toggleRdvLink()
    // =========================================================================
    toggleRdvLink() {
        const checkbox = document.getElementById('link-rdv');
        const selector = document.getElementById('rdv-selector');
        if (!checkbox || !selector) return;

        if (checkbox.checked) {
            selector.classList.remove('hidden');
        } else {
            selector.classList.add('hidden');
            const selectRdv = document.getElementById('select-rdv');
            if (selectRdv) selectRdv.value = '';
            this.renderItemsArea();
        }
    },

    // =========================================================================
    // 9. loadRdvOptions()
    // =========================================================================
    loadRdvOptions() {
        const select = document.getElementById('select-rdv');
        if (!select) return;

        const today    = new Date().setHours(0, 0, 0, 0);
        const rdvToday = this.rendezVous.filter(rdv => {
            const rdvDate = new Date(rdv.date_rdv).setHours(0, 0, 0, 0);
            return rdvDate === today && ['Programmé', 'En cours'].includes(rdv.statut);
        });

        select.innerHTML = '<option value="">Sélectionner un rendez-vous...</option>';
        rdvToday.forEach(rdv => {
            const time   = new Date(rdv.date_rdv).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const option = document.createElement('option');
            option.value       = rdv.id;
            option.textContent = `${time} — ${rdv.client_nom} — ${rdv.service_nom} (${rdv.coiffeuse_nom})`;
            select.appendChild(option);
        });
    },

    // =========================================================================
    // 10. loadFromRdv()
    // =========================================================================
    loadFromRdv() {
        const rdvId = document.getElementById('select-rdv')?.value;
        if (!rdvId) return;

        const rdv = this.rendezVous.find(r => r.id === rdvId);
        if (!rdv) return;

        const telInput = document.getElementById('client-telephone');
        const nomInput = document.getElementById('client-nom');
        if (telInput) telInput.value = rdv.client_telephone || '';
        if (nomInput) nomInput.value = rdv.client_nom       || '';

        const service   = this.services.find(s => s.id === rdv.service_id);
        const coiffeuse = this.coiffeuses.find(c => c.id === rdv.coiffeuse_id);

        if (service) {
            const prixService = service.prix || 0;
            const tauxComm    = coiffeuse?.taux_commission || 0;
            const commission  = Math.round((prixService * tauxComm / 100) * 100) / 100;

            this.selectedItems = [{
                id:              service.id,
                nom:             service.nom,
                item_nom:        service.nom,
                prix_unitaire:   prixService,
                quantite:        1,
                coiffeuse_id:    coiffeuse?.id  || null,
                coiffeuse_nom:   coiffeuse?.nom || '',
                taux_commission: tauxComm,
                commission:      commission,
            }];

            this.renderSelectedItems();
        }
    },

    // =========================================================================
    // 11. renderItemsArea()
    // =========================================================================
    renderItemsArea() {
        const area = document.getElementById('items-area');
        if (!area) return;

        if (this.currentType === 'Service') {
            const servicesOptions = this.services
                .filter(s => s.actif !== false)
                .map(s =>
                    `<option value="${s.id}" data-prix="${s.prix || 0}" data-nom="${s.nom}">
                        ${s.nom} — ${Utils.formatCurrency(s.prix || 0)}
                    </option>`
                ).join('');

            const coiffeusesOptions = this.coiffeuses
                .filter(c => c.statut !== 'Inactif')
                .map(c =>
                    `<option value="${c.id}" data-nom="${c.nom}" data-taux="${c.taux_commission || 0}">
                        ${c.nom} (${c.taux_commission || 0}%)
                    </option>`
                ).join('');

            area.innerHTML = `
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                    <h4 class="font-medium text-gray-700">
                        <i class="fas fa-plus-circle mr-2"></i>Ajouter un service
                    </h4>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Service</label>
                            <select id="select-service" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                <option value="">Choisir un service...</option>
                                ${servicesOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Coiffeuse</label>
                            <select id="select-coiffeuse" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                <option value="">Choisir une coiffeuse...</option>
                                ${coiffeusesOptions}
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Prix unitaire</label>
                            <input type="number" id="item-prix" step="0.01" min="0"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                   placeholder="0.00">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Commission (%)</label>
                            <input type="number" id="item-commission-pct" step="1" min="0" max="100" value="10"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        </div>
                    </div>
                    <button type="button" onclick="Ventes.addServiceItem()"
                            class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        <i class="fas fa-plus mr-2"></i>Ajouter ce service
                    </button>
                </div>`;

            document.getElementById('select-service')?.addEventListener('change', function() {
                const opt = this.options[this.selectedIndex];
                const prixInput = document.getElementById('item-prix');
                if (prixInput) prixInput.value = opt.dataset.prix || 0;
            });

            document.getElementById('select-coiffeuse')?.addEventListener('change', function() {
                const opt = this.options[this.selectedIndex];
                const commInput = document.getElementById('item-commission-pct');
                if (commInput && opt.dataset.taux) commInput.value = opt.dataset.taux;
            });

        } else {
            const produitsOptions = this.produits
                .filter(p => p.actif !== false && (p.stock_actuel || 0) > 0)
                .map(p =>
                    `<option value="${p.id}" data-prix="${p.prix_vente || 0}" data-nom="${p.nom}" data-stock="${p.stock_actuel || 0}">
                        ${p.nom} — ${Utils.formatCurrency(p.prix_vente || 0)} (stock: ${p.stock_actuel || 0})
                    </option>`
                ).join('');

            area.innerHTML = `
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                    <h4 class="font-medium text-gray-700">
                        <i class="fas fa-plus-circle mr-2"></i>Ajouter un produit
                    </h4>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Produit</label>
                            <select id="select-produit" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                <option value="">Choisir un produit...</option>
                                ${produitsOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                            <input type="number" id="item-quantite" min="1" value="1"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix unitaire</label>
                        <input type="number" id="item-prix" step="0.01" min="0"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                               placeholder="0.00">
                    </div>
                    <button type="button" onclick="Ventes.addProduitItem()"
                            class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                        <i class="fas fa-plus mr-2"></i>Ajouter ce produit
                    </button>
                </div>`;

            document.getElementById('select-produit')?.addEventListener('change', function() {
                const opt = this.options[this.selectedIndex];
                const prixInput = document.getElementById('item-prix');
                if (prixInput) prixInput.value = opt.dataset.prix || 0;
            });
        }
    },
    // =========================================================================
    // 12. SUPPRIMER UN ARTICLE
    // =========================================================================
    removeItem(index) {
        this.selectedItems.splice(index, 1);
        this.renderSelectedItems();
    },

    // =========================================================================
    // 13. AFFICHER LES ARTICLES SÉLECTIONNÉS + TOTAL
    // =========================================================================
    renderSelectedItems() {
        const display = document.getElementById('selected-items-display');
        const tbody   = document.getElementById('selected-items-table');
        const totalEl = document.getElementById('total-amount');
        const commDiv = document.getElementById('commission-total');
        const commEl  = document.getElementById('total-commission');

        if (!display || !tbody) return;

        if (this.selectedItems.length === 0) {
            display.classList.add('hidden');
            this.currentTotal = 0;
            return;
        }

        display.classList.remove('hidden');

        let total     = 0;
        let totalComm = 0;

        tbody.innerHTML = this.selectedItems.map((item, index) => {
            const subtotal = (item.prix_unitaire || 0) * (item.quantite || 1);
            total     += subtotal;
            totalComm += (item.commission || 0);

            const commInfo = item.commission
                ? `<div class="text-xs text-orange-500">Comm: ${Utils.formatCurrency(item.commission)}</div>`
                : '';

            const coiffInfo = item.coiffeuse_nom
                ? `<div class="text-xs text-gray-400">${item.coiffeuse_nom}</div>`
                : '';

            return `
                <tr class="border-b border-gray-200">
                    <td class="py-2">
                        <div class="font-medium">${item.item_nom || item.nom}</div>
                        ${coiffInfo}
                        ${commInfo}
                    </td>
                    <td class="py-2 text-center">${item.quantite || 1}</td>
                    <td class="py-2 text-right">${Utils.formatCurrency(item.prix_unitaire || 0)}</td>
                    <td class="py-2 text-right font-medium">${Utils.formatCurrency(subtotal)}</td>
                    <td class="py-2 text-center">
                        <button type="button" onclick="Ventes.removeItem(${index})"
                                class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>`;
        }).join('');

        this.currentTotal = total;

        if (totalEl) totalEl.textContent = Utils.formatCurrency(total);

        // Afficher la ligne commission si pertinent (Services)
        if (commDiv && commEl) {
            if (this.currentType === 'Service' && totalComm > 0) {
                commDiv.classList.remove('hidden');
                commEl.textContent = Utils.formatCurrency(totalComm);
            } else {
                commDiv.classList.add('hidden');
            }
        }

        // Recalculer la monnaie si un montant perçu est déjà saisi
        this.calculateChange();
    },

    // =========================================================================
    // 14. CALCUL DE LA MONNAIE
    // =========================================================================
    calculateChange() {
        const percu           = parseFloat(document.getElementById('montant-percu')?.value) || 0;
        const changeDisplay   = document.getElementById('change-display');
        const changeAmount    = document.getElementById('change-amount');
        const insufficientDiv = document.getElementById('insufficient-payment');

        if (!changeDisplay || !changeAmount || !insufficientDiv) return;

        if (percu <= 0 || this.currentTotal <= 0) {
            changeDisplay.classList.add('hidden');
            insufficientDiv.classList.add('hidden');
            return;
        }

        const monnaie = percu - this.currentTotal;

        if (monnaie >= 0) {
            changeDisplay.classList.remove('hidden');
            insufficientDiv.classList.add('hidden');
            changeAmount.textContent = Utils.formatCurrency(monnaie);
        } else {
            changeDisplay.classList.add('hidden');
            insufficientDiv.classList.remove('hidden');
        }
    },

    // =========================================================================
    // 15. SAUVEGARDER LA VENTE
    // =========================================================================
    async saveVente(modal) {
        if (this.selectedItems.length === 0) {
            App.showNotification('Veuillez ajouter au moins un article', 'error');
            return;
        }

        const form      = document.getElementById('vente-form');
        const telephone = document.getElementById('client-telephone')?.value?.trim();
        const nomClient = document.getElementById('client-nom')?.value?.trim();
        const modePaie  = form?.querySelector('[name="mode_paiement"]')?.value;
        const percu     = parseFloat(document.getElementById('montant-percu')?.value) || null;
        const rdvId     = document.getElementById('link-rdv')?.checked
            ? (document.getElementById('select-rdv')?.value || null)
            : null;

        if (!telephone) {
            App.showNotification('Le téléphone client est obligatoire', 'error');
            return;
        }

        if (percu !== null && percu < this.currentTotal) {
            App.showNotification('Montant perçu insuffisant', 'error');
            return;
        }

        const monnaie     = percu !== null ? Math.round((percu - this.currentTotal) * 100) / 100 : 0;
        const totalComm   = this.selectedItems.reduce((s, i) => s + (i.commission || 0), 0);

        const payload = {
            type:              this.currentType,
            client_telephone:  telephone,
            client_nom:        nomClient || null,
            montant_total:     this.currentTotal,
            commission:        Math.round(totalComm * 100) / 100,
            mode_paiement:     modePaie,
            montant_percu:     percu,
            monnaie:           monnaie,
            items:             JSON.stringify(this.selectedItems),
            rdv_id:            rdvId,
            date_vente:        new Date().toISOString(),
        };

        // Ajouter champs raccourcis pour ventes à item unique
        if (this.selectedItems.length === 1) {
            payload.item_id        = this.selectedItems[0].id;
            payload.item_nom       = this.selectedItems[0].item_nom || this.selectedItems[0].nom;
            payload.coiffeuse_id   = this.selectedItems[0].coiffeuse_id   || null;
            payload.coiffeuse_nom  = this.selectedItems[0].coiffeuse_nom  || null;
        }

        try {
            App.showLoading?.();
            const result = await Utils.post('ventes', payload);

            if (result.error) throw new Error(result.error.message);

            // Décrémenter le stock pour les produits
            if (this.currentType === 'Produit') {
                for (const item of this.selectedItems) {
                    const produit = this.produits.find(p => p.id === item.id);
                    if (produit) {
                        const newStock = (produit.stock_actuel || 0) - item.quantite;
                        await Utils.update('produits', item.id, { stock_actuel: newStock });
                    }
                }
            }

            // Marquer le RDV comme terminé si lié
            if (rdvId) {
                await Utils.update('rendez_vous', rdvId, { statut: 'Terminé' });
            }

            App.hideLoading?.();
            Utils.closeModal(modal);
            App.showNotification('Vente enregistrée avec succès !', 'success');

            // Recharger les données et rafraîchir l'affichage
            await this.loadAllData();
            this.renderTable();
            this.updateStats();

        } catch (error) {
            App.hideLoading?.();
            console.error('[Ventes] saveVente error:', error);
            App.showNotification('Erreur lors de l\'enregistrement : ' + error.message, 'error');
        }
    },

    // =========================================================================
    // 16. AFFICHER LES DÉTAILS D'UNE VENTE
    // =========================================================================
    showDetails(venteId) {
        const vente = this.data.find(v => v.id === venteId);
        if (!vente) return;

        const items = typeof vente.items === 'string'
            ? (() => { try { return JSON.parse(vente.items); } catch(e) { return []; } })()
            : (vente.items || []);

        const itemsHTML = items.length > 0
            ? items.map(item => `
                <tr class="border-b border-gray-100">
                    <td class="py-2">${item.item_nom || item.nom || '-'}</td>
                    <td class="py-2 text-center">${item.quantite || 1}</td>
                    <td class="py-2 text-right">${Utils.formatCurrency(item.prix_unitaire || 0)}</td>
                    <td class="py-2 text-right font-medium">
                        ${Utils.formatCurrency((item.prix_unitaire || 0) * (item.quantite || 1))}
                    </td>
                    ${vente.type === 'Service'
                        ? `<td class="py-2 text-right text-orange-500">
                               ${Utils.formatCurrency(item.commission || 0)}
                               ${item.coiffeuse_nom ? `<div class="text-xs text-gray-400">${item.coiffeuse_nom}</div>` : ''}
                           </td>`
                        : ''}
                </tr>`).join('')
            : `<tr><td colspan="5" class="py-4 text-center text-gray-400">Aucun détail disponible</td></tr>`;

        const content = `
            <div class="space-y-4">
                <!-- En-tête -->
                <div class="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                    <div>
                        <p class="text-xs text-gray-500">Date</p>
                        <p class="font-medium">${Utils.formatDateTime(vente.date_vente)}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Type</p>
                        <p class="font-medium">${vente.type}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Client</p>
                        <p class="font-medium">${vente.client_nom || 'Anonyme'}</p>
                        <p class="text-xs text-gray-400">${vente.client_telephone || ''}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Mode de paiement</p>
                        <p class="font-medium">${vente.mode_paiement || '-'}</p>
                    </div>
                </div>

                <!-- Articles -->
                <div>
                    <h4 class="font-medium text-gray-700 mb-2">Articles</h4>
                    <table class="w-full text-sm">
                        <thead class="border-b border-gray-200">
                            <tr>
                                <th class="text-left py-2">Article</th>
                                <th class="text-center py-2">Qté</th>
                                <th class="text-right py-2">P.U.</th>
                                <th class="text-right py-2">Total</th>
                                ${vente.type === 'Service' ? '<th class="text-right py-2">Commission</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>${itemsHTML}</tbody>
                    </table>
                </div>

                <!-- Totaux -->
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${Utils.formatCurrency(vente.montant_total)}</span>
                    </div>
                    ${vente.montant_percu ? `
                    <div class="flex justify-between text-sm text-gray-600">
                        <span>Montant perçu</span>
                        <span>${Utils.formatCurrency(vente.montant_percu)}</span>
                    </div>
                    <div class="flex justify-between text-sm text-gray-600">
                        <span>Monnaie rendue</span>
                        <span>${Utils.formatCurrency(vente.monnaie || 0)}</span>
                    </div>` : ''}
                    ${vente.commission ? `
                    <div class="flex justify-between text-sm text-orange-600">
                        <span>Commission totale</span>
                        <span>${Utils.formatCurrency(vente.commission)}</span>
                    </div>` : ''}
                </div>
            </div>
        `;

        const modal = Utils.createModal(
            `<i class="fas fa-receipt mr-2"></i>Détails de la vente`,
            content,
            null,   // pas de bouton de sauvegarde
            { hideConfirm: true, closeLabel: 'Fermer' }
        );
        document.body.appendChild(modal);
    },

    // =========================================================================
    // 17. IMPRIMER LE REÇU
    // =========================================================================
    printReceipt(venteId) {
        const vente = this.data.find(v => v.id === venteId);
        if (!vente) return;

        const items = typeof vente.items === 'string'
            ? (() => { try { return JSON.parse(vente.items); } catch(e) { return []; } })()
            : (vente.items || []);

        // Utilise le module ThermalReceipt si disponible, sinon impression basique
        if (typeof ThermalReceipt !== 'undefined') {
            ThermalReceipt.print({
                title:          'REÇU DE VENTE',
                date:           vente.date_vente,
                client_nom:     vente.client_nom     || 'Anonyme',
                client_tel:     vente.client_telephone || '',
                items:          items,
                total:          vente.montant_total,
                mode_paiement:  vente.mode_paiement,
                montant_percu:  vente.montant_percu,
                monnaie:        vente.monnaie,
                type:           vente.type,
            });
        } else {
            // Impression HTML de secours
            const itemsRows = items.map(item =>
                `<tr>
                    <td>${item.item_nom || item.nom || '-'}</td>
                    <td style="text-align:center">${item.quantite || 1}</td>
                    <td style="text-align:right">${Utils.formatCurrency(item.prix_unitaire || 0)}</td>
                    <td style="text-align:right">${Utils.formatCurrency((item.prix_unitaire || 0) * (item.quantite || 1))}</td>
                </tr>`
            ).join('');

            const win = window.open('', '_blank');
            win.document.write(`
                <!DOCTYPE html><html><head>
                <title>Reçu</title>
                <style>
                    body { font-family: monospace; max-width: 300px; margin: 0 auto; padding: 10px; }
                    h2   { text-align: center; }
                    table{ width: 100%; border-collapse: collapse; }
                    td   { padding: 3px 4px; font-size: 12px; }
                    .total { font-weight: bold; border-top: 1px solid #000; }
                    .center { text-align: center; }
                </style></head><body>
                <h2>REÇU DE VENTE</h2>
                <p class="center">${Utils.formatDateTime(vente.date_vente)}</p>
                <p>Client : ${vente.client_nom || 'Anonyme'}<br>
                   Tél    : ${vente.client_telephone || '-'}</p>
                <hr>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align:left">Article</th>
                            <th>Qté</th>
                            <th style="text-align:right">P.U.</th>
                            <th style="text-align:right">Total</th>
                        </tr>
                    </thead>
                    <tbody>${itemsRows}</tbody>
                    <tfoot>
                        <tr class="total">
                            <td colspan="3">TOTAL</td>
                            <td style="text-align:right">${Utils.formatCurrency(vente.montant_total)}</td>
                        </tr>
                        ${vente.montant_percu ? `
                        <tr>
                            <td colspan="3">Perçu</td>
                            <td style="text-align:right">${Utils.formatCurrency(vente.montant_percu)}</td>
                        </tr>
                        <tr>
                            <td colspan="3">Monnaie</td>
                            <td style="text-align:right">${Utils.formatCurrency(vente.monnaie || 0)}</td>
                        </tr>` : ''}
                    </tfoot>
                </table>
                <hr>
                <p class="center">Paiement : ${vente.mode_paiement || '-'}</p>
                <p class="center">Merci de votre visite !</p>
                <script>window.onload = () => { window.print(); window.close(); }<\/script>
                </body></html>
            `);
            win.document.close();
        }
    },

    // =========================================================================
    // 18. EXPORT DE LA PÉRIODE
    // =========================================================================
    exportPeriod() {
        const filteredData = PeriodFilter.filterData(this.data, 'date_vente');

        if (filteredData.length === 0) {
            App.showNotification('Aucune donnée à exporter pour cette période', 'warning');
            return;
        }

        const rows = [
            ['Date', 'Type', 'Client', 'Téléphone', 'Détails', 'Montant', 'Commission', 'Mode paiement', 'Perçu', 'Monnaie']
        ];

        filteredData.forEach(v => {
            const items = typeof v.items === 'string'
                ? (() => { try { return JSON.parse(v.items); } catch(e) { return []; } })()
                : (v.items || []);

            const details = items.length > 1
                ? `${items.length} articles`
                : (items[0]?.item_nom || v.item_nom || '-');

            rows.push([
                Utils.formatDateTime(v.date_vente),
                v.type,
                v.client_nom        || 'Anonyme',
                v.client_telephone  || '',
                details,
                v.montant_total     || 0,
                v.commission        || 0,
                v.mode_paiement     || '',
                v.montant_percu     || '',
                v.monnaie           || '',
            ]);
        });

        // Ligne de totaux
        const totalMontant  = filteredData.reduce((s, v) => s + (v.montant_total || 0), 0);
        const totalComm     = filteredData.reduce((s, v) => s + (v.commission    || 0), 0);
        rows.push(['', '', '', '', 'TOTAL', totalMontant, totalComm, '', '', '']);

        // Construire le CSV
        const csv     = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob    = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url     = URL.createObjectURL(blob);
        const link    = document.createElement('a');
        const period  = PeriodFilter.getLabel?.() || 'periode';

        link.href     = url;
        link.download = `ventes_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        App.showNotification(`Export réussi — ${filteredData.length} ventes`, 'success');
    },

};