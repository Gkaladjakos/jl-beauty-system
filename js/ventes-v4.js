// =============================================================================
// VENTES MODULE — Version corrigée complète
// Corrections :
//   ✅ Impression thermique 50×80 mm fonctionnelle
//   ✅ Commission supprimée du ticket client
//   ✅ Saisie de date antérieure possible
//   ✅ updateTotals() manquante ajoutée
//   ✅ Fermeture modal robuste
//   ✅ parseItems() helper centralisé
// =============================================================================

const Ventes = {

    // ─── État ────────────────────────────────────────────────────────────────
    data:        [],
    clients:     [],
    coiffeuses:  [],
    services:    [],
    produits:    [],
    rendezVous:  [],
    currentType:  'Service',
    selectedItems:[],
    currentTotal: 0,

    // =========================================================================
    // HELPER — parseItems() centralisé (évite la répétition × 5)
    // =========================================================================
    parseItems(raw) {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        try { return JSON.parse(raw); } catch(e) { return []; }
    },

    // =========================================================================
    // 1. render()
    // =========================================================================
    async render(container) {
        await this.loadAllData();

        container.innerHTML = `
            ${PeriodFilter.renderHTML('ventes-period-filter')}

            <div class="mb-6 flex justify-between items-center">
                <button onclick="Ventes.showAddModal()"
                        class="px-4 py-2 bg-purple-600 text-white rounded-lg
                               hover:bg-purple-700">
                    <i class="fas fa-plus mr-2"></i>Enregistrer une vente
                </button>
                <div class="flex space-x-3">
                    <select id="filter-type"
                            class="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Tous les types</option>
                        <option value="Service">Service</option>
                        <option value="Produit">Produit</option>
                        <option value="Mixte">Mixte</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Ventes période</p>
                    <p id="ventes-periode"
                       class="text-2xl font-bold text-purple-600 mt-2">$0.00</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Services</p>
                    <p id="ventes-services"
                       class="text-2xl font-bold text-blue-600 mt-2">$0.00</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Produits</p>
                    <p id="ventes-produits"
                       class="text-2xl font-bold text-green-600 mt-2">$0.00</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Commissions</p>
                    <p id="total-commissions"
                       class="text-2xl font-bold text-orange-600 mt-2">$0.00</p>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="table-container">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium
                                           text-gray-500 uppercase">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium
                                           text-gray-500 uppercase">Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium
                                           text-gray-500 uppercase">Client</th>
                                <th class="px-6 py-3 text-left text-xs font-medium
                                           text-gray-500 uppercase">Détails</th>
                                <th class="px-6 py-3 text-left text-xs font-medium
                                           text-gray-500 uppercase">Montant</th>
                                <th class="px-6 py-3 text-left text-xs font-medium
                                           text-gray-500 uppercase">Paiement</th>
                                <th class="px-6 py-3 text-left text-xs font-medium
                                           text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="ventes-table"
                               class="divide-y divide-gray-200"></tbody>
                    </table>
                </div>
            </div>`;

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
            const [ventesData, clientsData, coiffeusesData,
                   servicesData, produitsData, rdvData] = await Promise.all([
                Utils.get('ventes'),
                Utils.get('clients'),
                Utils.get('coiffeuses'),
                Utils.get('services'),
                Utils.get('produits'),
                Utils.get('rendez_vous')
            ]);
            this.data        = ventesData.data      || [];
            this.clients     = clientsData.data     || [];
            this.coiffeuses  = coiffeusesData.data  || [];
            this.services    = servicesData.data    || [];
            this.produits    = produitsData.data    || [];
            this.rendezVous  = rdvData.data         || [];
        } catch (error) {
            console.error('[Ventes] loadAllData error:', error);
            App.showNotification('Erreur de chargement des données', 'error');
        }
    },

    // =========================================================================
    // 3. updateStats()
    // =========================================================================
    updateStats() {
        const filteredData = PeriodFilter.filterData(this.data, 'date_vente');

        const totalPeriode     = filteredData.reduce((s, v) => s + (v.montant_total || 0), 0);
        const totalCommissions = filteredData.reduce((s, v) => s + (v.commission    || 0), 0);

        let totalServices = 0;
        let totalProduits = 0;

        filteredData.forEach(v => {
            if (v.type === 'Service') {
                totalServices += v.montant_total || 0;
            } else if (v.type === 'Produit') {
                totalProduits += v.montant_total || 0;
            } else if (v.type === 'Mixte') {
                const items = this.parseItems(v.items);
                items.forEach(item => {
                    const sub = (item.prix_unitaire || 0) * (item.quantite || 1);
                    if (item.item_type === 'Service') totalServices += sub;
                    else                              totalProduits += sub;
                });
            }
        });

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
            const date = Utils.formatDateTime(vente.date_vente);

            const typeBadge =
                vente.type === 'Service'
                    ? '<span class="badge bg-blue-100 text-blue-800">Service</span>'
                : vente.type === 'Produit'
                    ? '<span class="badge bg-green-100 text-green-800">Produit</span>'
                    : '<span class="badge bg-purple-100 text-purple-800">Mixte</span>';

            const items = this.parseItems(vente.items);
            let details = '';
            if (items.length > 1) {
                const nbS = items.filter(i => i.item_type === 'Service').length;
                const nbP = items.filter(i => i.item_type === 'Produit').length;
                details = (nbS > 0 && nbP > 0)
                    ? `${nbS} service(s) + ${nbP} produit(s)`
                    : `${items.length} articles`;
            } else if (items.length === 1) {
                details = items[0].item_nom || items[0].nom || '-';
            } else {
                details = vente.item_nom || '-';
            }

            const paiementInfo = vente.montant_percu
                ? `Perçu: ${Utils.formatCurrency(vente.montant_percu)}<br>
                   Monnaie: ${Utils.formatCurrency(vente.monnaie || 0)}`
                : (vente.mode_paiement || '-');

            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm">${date}</td>
                    <td class="px-6 py-4">${typeBadge}</td>
                    <td class="px-6 py-4 text-sm">
                        <div class="font-medium">${vente.client_nom || 'Anonyme'}</div>
                        <div class="text-gray-500 text-xs">
                            ${vente.client_telephone || ''}
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm">${details}</td>
                    <td class="px-6 py-4 text-sm font-semibold">
                        ${Utils.formatCurrency(vente.montant_total)}
                    </td>
                    <td class="px-6 py-4 text-xs text-gray-600">${paiementInfo}</td>
                    <td class="px-6 py-4">
                        <button onclick="Ventes.showDetails('${vente.id}')"
                                class="text-blue-600 hover:text-blue-800 mr-2"
                                title="Détails">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="Ventes.printReceipt('${vente.id}')"
                                class="text-green-600 hover:text-green-800"
                                title="Imprimer reçu">
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
        document.getElementById('filter-type')
            ?.addEventListener('change', () => {
                this.renderTable();
                this.updateStats();
            });
    },

    // =========================================================================
    // 6. showAddModal()  ✅ Date antérieure possible
    // =========================================================================
    showAddModal() {
        this.selectedItems = [];
        this.currentTotal  = 0;

        // ✅ Date du jour formatée pour le champ date (valeur par défaut)
        const today = new Date().toISOString().slice(0, 10);

        const modalContent = `
            <form id="vente-form" class="space-y-4">

                <!-- ✅ NOUVEAU — Sélection de date (antérieure autorisée) -->
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <label class="block text-sm font-medium text-amber-800 mb-1">
                        <i class="fas fa-calendar-alt mr-2"></i>
                        Date de la vente
                    </label>
                    <input type="date" id="vente-date"
                           value="${today}"
                           max="${today}"
                           class="w-full px-3 py-2 border border-amber-300
                                  rounded-lg bg-white text-sm">
                    <p class="text-xs text-amber-600 mt-1">
                        Modifiez la date pour enregistrer une vente antérieure
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Ajouter un article — cliquez sur le type voulu
                    </label>
                    <div class="grid grid-cols-2 gap-4">
                        <button type="button" onclick="Ventes.setType('Service')"
                                id="btn-type-service"
                                class="px-4 py-3 border-2 border-blue-600 bg-blue-50
                                       text-blue-700 rounded-lg font-medium
                                       hover:bg-blue-100">
                            <i class="fas fa-cut mr-2"></i>+ Service
                        </button>
                        <button type="button" onclick="Ventes.setType('Produit')"
                                id="btn-type-produit"
                                class="px-4 py-2 border-2 border-gray-300
                                       text-gray-600 rounded-lg font-medium
                                       hover:bg-gray-50">
                            <i class="fas fa-shopping-bag mr-2"></i>+ Produit
                        </button>
                    </div>
                </div>

                <div id="service-rdv-option"
                     class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="link-rdv" class="mr-3 w-4 h-4"
                               onchange="Ventes.toggleRdvLink()">
                        <span class="text-sm font-medium text-blue-800">
                            <i class="fas fa-link mr-2"></i>
                            Lier à un rendez-vous existant
                        </span>
                    </label>
                    <div id="rdv-selector" class="hidden mt-3">
                        <select id="select-rdv"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                onchange="Ventes.loadFromRdv()">
                            <option value="">Sélectionner un rendez-vous...</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Téléphone client *
                        </label>
                        <input type="tel" id="client-telephone" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                               placeholder="+243 XXX XXX XXX">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Nom client (optionnel)
                        </label>
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
                        <div class="border-t border-gray-300 mt-3 pt-3
                                    flex justify-between font-bold">
                            <span>TOTAL :</span>
                            <span id="total-amount">$0.00</span>
                        </div>
                    </div>
                </div>

                <div class="border-t border-gray-200 pt-4">
                    <h4 class="font-medium text-gray-700 mb-3">Paiement</h4>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Mode de paiement *
                            </label>
                            <select name="mode_paiement" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="Espèces">Espèces</option>
                                <option value="Carte bancaire">Carte bancaire</option>
                                <option value="Mobile Money">Mobile Money</option>
                                <option value="Chèque">Chèque</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Montant perçu
                            </label>
                            <input type="number" id="montant-percu"
                                   step="0.01" min="0"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                   placeholder="0.00"
                                   oninput="Ventes.calculateChange()">
                        </div>
                    </div>

                    <div id="change-display"
                         class="hidden bg-green-50 border border-green-200
                                rounded-lg p-4">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-green-800">
                                Monnaie à rendre :
                            </span>
                            <span id="change-amount"
                                  class="text-xl font-bold text-green-700">$0.00</span>
                        </div>
                    </div>

                    <div id="insufficient-payment"
                         class="hidden bg-red-50 border border-red-200
                                rounded-lg p-4 mt-2">
                        <p class="text-sm text-red-800">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            Montant insuffisant
                        </p>
                    </div>
                </div>
            </form>`;

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
        this.currentType = type;

        const btnService = document.getElementById('btn-type-service');
        const btnProduit = document.getElementById('btn-type-produit');
        const rdvOption  = document.getElementById('service-rdv-option');

        if (btnService && btnProduit) {
            if (type === 'Service') {
                btnService.className =
                    'px-4 py-3 border-2 border-blue-600 bg-blue-50 ' +
                    'text-blue-700 rounded-lg font-medium hover:bg-blue-100';
                btnProduit.className =
                    'px-4 py-2 border-2 border-gray-300 text-gray-600 ' +
                    'rounded-lg font-medium hover:bg-gray-50';
            } else {
                btnProduit.className =
                    'px-4 py-3 border-2 border-green-600 bg-green-50 ' +
                    'text-green-700 rounded-lg font-medium hover:bg-green-100';
                btnService.className =
                    'px-4 py-2 border-2 border-gray-300 text-gray-600 ' +
                    'rounded-lg font-medium hover:bg-gray-50';
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
            return rdvDate === today &&
                   ['Programmé', 'En cours'].includes(rdv.statut);
        });

        select.innerHTML = '<option value="">Sélectionner un rendez-vous...</option>';
        rdvToday.forEach(rdv => {
            const time   = new Date(rdv.date_rdv).toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit'
            });
            const option = document.createElement('option');
            option.value       = rdv.id;
            option.textContent =
                `${time} — ${rdv.client_nom} — ${rdv.service_nom} (${rdv.coiffeuse_nom})`;
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
            const commission  =
                Math.round((prixService * tauxComm / 100) * 100) / 100;

            const alreadyLoaded = this.selectedItems.find(
                i => i.id === service.id && i.item_type === 'Service'
            );
            if (!alreadyLoaded) {
                this.selectedItems.push({
                    id:              service.id,
                    nom:             service.nom,
                    item_nom:        service.nom,
                    item_type:       'Service',
                    prix_unitaire:   prixService,
                    quantite:        1,
                    coiffeuse_id:    coiffeuse?.id  || null,
                    coiffeuse_nom:   coiffeuse?.nom || null,
                    taux_commission: tauxComm,
                    commission:      commission,
                });
                this.renderSelectedItems();
            }
        }
    },

    // =========================================================================
    // 11. renderItemsArea()
    // =========================================================================
    renderItemsArea() {
        const area = document.getElementById('items-area');
        if (!area) return;

        const servicesOptions = (this.services || [])
            .filter(s => s.actif !== false)
            .map(s => `
                <option value="${s.id}"
                        data-nom="${s.nom}"
                        data-prix="${s.prix || 0}">
                    ${s.nom} — ${Utils.formatCurrency(s.prix || 0)}
                </option>`)
            .join('');

        const coiffeusesOptions = (this.coiffeuses || [])
            .filter(c => c.statut === 'Actif')
            .map(c => `
                <option value="${c.id}"
                        data-nom="${c.nom}"
                        data-taux="${c.taux_commission || 0}">
                    ${c.nom}
                </option>`)
            .join('');

        const produitsOptions = (this.produits || [])
            .filter(p => p.stock_actuel > 0)
            .map(p => `
                <option value="${p.id}"
                        data-nom="${p.nom}"
                        data-prix="${p.prix_vente || 0}">
                    ${p.nom} — ${Utils.formatCurrency(p.prix_vente || 0)}
                    (stock: ${p.stock_actuel})
                </option>`)
            .join('');

        if (this.currentType === 'Service') {
            area.innerHTML = `
                <div class="border-2 border-dashed border-blue-300 bg-blue-50
                            rounded-lg p-4 space-y-3">
                    <h4 class="font-medium text-blue-700">
                        <i class="fas fa-cut mr-2"></i>Ajouter un service
                    </h4>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium
                                          text-gray-700 mb-1">Service</label>
                            <select id="select-service"
                                    class="w-full px-3 py-2 border border-gray-300
                                           rounded-lg text-sm bg-white">
                                <option value="">Choisir un service...</option>
                                ${servicesOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium
                                          text-gray-700 mb-1">
                                Coiffeuse <span class="text-red-500">*</span>
                            </label>
                            <select id="select-coiffeuse"
                                    class="w-full px-3 py-2 border border-gray-300
                                           rounded-lg text-sm bg-white">
                                <option value="">Choisir une coiffeuse...</option>
                                ${coiffeusesOptions}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium
                                      text-gray-700 mb-1">Prix</label>
                        <input type="number" id="item-prix"
                               step="0.01" min="0"
                               class="w-full px-3 py-2 border border-gray-300
                                      rounded-lg text-sm"
                               placeholder="0.00">
                    </div>
                    <button type="button" onclick="Ventes.addServiceItem()"
                            class="w-full px-4 py-2 bg-blue-600 text-white
                                   rounded-lg hover:bg-blue-700 text-sm">
                        <i class="fas fa-plus mr-2"></i>Ajouter ce service
                    </button>
                </div>`;

            document.getElementById('select-service')
                ?.addEventListener('change', function() {
                    const opt = this.options[this.selectedIndex];
                    const prixInput = document.getElementById('item-prix');
                    if (prixInput) prixInput.value = opt.dataset.prix || 0;
                });

        } else {
            area.innerHTML = `
                <div class="border-2 border-dashed border-green-300 bg-green-50
                            rounded-lg p-4 space-y-3">
                    <h4 class="font-medium text-green-700">
                        <i class="fas fa-box mr-2"></i>Ajouter un produit
                    </h4>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium
                                          text-gray-700 mb-1">Produit</label>
                            <select id="select-produit"
                                    class="w-full px-3 py-2 border border-gray-300
                                           rounded-lg text-sm bg-white">
                                <option value="">Choisir un produit...</option>
                                ${produitsOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium
                                          text-gray-700 mb-1">Quantité</label>
                            <input type="number" id="item-quantite"
                                   min="1" value="1"
                                   class="w-full px-3 py-2 border border-gray-300
                                          rounded-lg text-sm">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium
                                      text-gray-700 mb-1">Prix unitaire</label>
                        <input type="number" id="item-prix"
                               step="0.01" min="0"
                               class="w-full px-3 py-2 border border-gray-300
                                      rounded-lg text-sm"
                               placeholder="0.00">
                    </div>
                    <button type="button" onclick="Ventes.addProduitItem()"
                            class="w-full px-4 py-2 bg-green-600 text-white
                                   rounded-lg hover:bg-green-700 text-sm">
                        <i class="fas fa-plus mr-2"></i>Ajouter ce produit
                    </button>
                </div>`;

            document.getElementById('select-produit')
                ?.addEventListener('change', function() {
                    const opt = this.options[this.selectedIndex];
                    const prixInput = document.getElementById('item-prix');
                    if (prixInput) prixInput.value = opt.dataset.prix || 0;
                });
        }
    },

    // =========================================================================
    // 12. addServiceItem()
    // =========================================================================
    addServiceItem() {
        const selectService   = document.getElementById('select-service');
        const selectCoiffeuse = document.getElementById('select-coiffeuse');
        const prixInput       = document.getElementById('item-prix');

        if (!selectService?.value) {
            App.showNotification('Veuillez choisir un service', 'error');
            return;
        }

        const serviceOpt = selectService.options[selectService.selectedIndex];
        const coiffOpt   = selectCoiffeuse?.options[selectCoiffeuse?.selectedIndex];
        const prix       = parseFloat(prixInput?.value) || 0;
        const tauxComm   = parseFloat(coiffOpt?.dataset?.taux) || 0;
        const commission =
            Math.round((prix * tauxComm / 100) * 100) / 100;

        this.selectedItems.push({
            id:              selectService.value,
            nom:             serviceOpt.dataset.nom || serviceOpt.text,
            item_nom:        serviceOpt.dataset.nom || serviceOpt.text,
            item_type:       'Service',
            prix_unitaire:   prix,
            quantite:        1,
            coiffeuse_id:    selectCoiffeuse?.value   || null,
            coiffeuse_nom:   coiffOpt?.dataset?.nom   || null,
            taux_commission: tauxComm,
            commission:      commission
        });

        this.renderSelectedItems();

        selectService.value = '';
        if (selectCoiffeuse) selectCoiffeuse.value = '';
        if (prixInput)       prixInput.value       = '';
    },

    // =========================================================================
    // 13. addProduitItem()
    // =========================================================================
    addProduitItem() {
        const selectProduit = document.getElementById('select-produit');
        const prixInput     = document.getElementById('item-prix');
        const qteInput      = document.getElementById('item-quantite');

        if (!selectProduit?.value) {
            App.showNotification('Veuillez choisir un produit', 'error');
            return;
        }

        const produitOpt = selectProduit.options[selectProduit.selectedIndex];
        const prix       = parseFloat(prixInput?.value) || 0;
        const quantite   = parseInt(qteInput?.value)    || 1;

        const produit = this.produits.find(p => p.id === selectProduit.value);
        if (produit && quantite > produit.stock_actuel) {
            App.showNotification(
                `Stock insuffisant (disponible: ${produit.stock_actuel})`, 'error'
            );
            return;
        }

        this.selectedItems.push({
            id:              selectProduit.value,
            nom:             produitOpt.dataset.nom || produitOpt.text,
            item_nom:        produitOpt.dataset.nom || produitOpt.text,
            item_type:       'Produit',
            prix_unitaire:   prix,
            quantite:        quantite,
            coiffeuse_id:    null,
            coiffeuse_nom:   null,
            taux_commission: 0,
            commission:      0
        });

        this.renderSelectedItems();

        selectProduit.value = '';
        if (prixInput) prixInput.value = '';
        if (qteInput)  qteInput.value  = 1;
    },

    // =========================================================================
    // 14. removeItem()  ✅ updateTotals() remplacé par renderSelectedItems()
    // =========================================================================
    removeItem(index) {
        this.selectedItems.splice(index, 1);
        this.renderSelectedItems();
    },

    // =========================================================================
    // 15. updateTotals()  ✅ AJOUTÉ — était appelée mais inexistante
    // =========================================================================
    updateTotals() {
        this.renderSelectedItems();
    },

    // =========================================================================
    // 16. renderSelectedItems()
    // =========================================================================
    renderSelectedItems() {
        const display = document.getElementById('selected-items-display');
        const tbody   = document.getElementById('selected-items-table');
        const totalEl = document.getElementById('total-amount');

        if (!display || !tbody) return;

        if (this.selectedItems.length === 0) {
            display.classList.add('hidden');
            this.currentTotal = 0;
            return;
        }

        display.classList.remove('hidden');

        let total = 0;

        tbody.innerHTML = this.selectedItems.map((item, index) => {
            const subtotal = (item.prix_unitaire || 0) * (item.quantite || 1);
            total += subtotal;

            const typePill = item.item_type === 'Service'
                ? '<span class="text-xs bg-blue-100 text-blue-700 px-1 rounded">S</span>'
                : '<span class="text-xs bg-green-100 text-green-700 px-1 rounded">P</span>';

            const coiffInfo = item.coiffeuse_nom
                ? `<div class="text-xs text-gray-400">${item.coiffeuse_nom}</div>`
                : '';

            return `
                <tr class="border-b border-gray-200">
                    <td class="py-2">
                        <div class="font-medium">
                            ${item.item_nom || item.nom} ${typePill}
                        </div>
                        ${coiffInfo}
                    </td>
                    <td class="py-2 text-center">${item.quantite || 1}</td>
                    <td class="py-2 text-right">
                        ${Utils.formatCurrency(item.prix_unitaire || 0)}
                    </td>
                    <td class="py-2 text-right font-medium">
                        ${Utils.formatCurrency(subtotal)}
                    </td>
                    <td class="py-2 text-center">
                        <button type="button"
                                onclick="Ventes.removeItem(${index})"
                                class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>`;
        }).join('');

        this.currentTotal = total;
        if (totalEl) totalEl.textContent = Utils.formatCurrency(total);

        this.calculateChange();
    },

    // =========================================================================
    // 17. calculateChange()
    // =========================================================================
    calculateChange() {
        const percu           = parseFloat(
            document.getElementById('montant-percu')?.value) || 0;
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
    // 18. saveVente()  ✅ Date antérieure prise en compte
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
        const percu     = parseFloat(
            document.getElementById('montant-percu')?.value) || null;
        const rdvId     = document.getElementById('link-rdv')?.checked
            ? (document.getElementById('select-rdv')?.value || null)
            : null;

        // ✅ Récupérer la date saisie (antérieure autorisée)
        const dateInput    = document.getElementById('vente-date')?.value;
        const dateVente    = dateInput
            ? new Date(dateInput + 'T' + new Date().toTimeString().slice(0, 8))
                .toISOString()
            : new Date().toISOString();

        if (!telephone) {
            App.showNotification('Le téléphone client est obligatoire', 'error');
            return;
        }

        if (percu !== null && percu < this.currentTotal) {
            App.showNotification('Montant perçu insuffisant', 'error');
            return;
        }

        const monnaie   = percu !== null
            ? Math.round((percu - this.currentTotal) * 100) / 100
            : 0;
        const totalComm = this.selectedItems.reduce(
            (s, i) => s + (i.commission || 0), 0
        );

        const hasServices = this.selectedItems.some(i => i.item_type === 'Service');
        const hasProduits = this.selectedItems.some(i => i.item_type === 'Produit');
        const venteType   = hasServices && hasProduits ? 'Mixte'
                          : hasServices                ? 'Service'
                          :                              'Produit';

        const payload = {
            type:             venteType,
            client_telephone: telephone,
            client_nom:       nomClient || null,
            montant_total:    this.currentTotal,
            commission:       Math.round(totalComm * 100) / 100,
            mode_paiement:    modePaie,
            montant_percu:    percu,
            monnaie:          monnaie,
            items:            JSON.stringify(this.selectedItems),
            date_vente:       dateVente,   // ✅ date choisie par l'utilisateur
        };

        if (this.selectedItems.length === 1) {
            const only = this.selectedItems[0];
            payload.item_id  = only.id;
            payload.item_nom = only.item_nom || only.nom;

            if (only.item_type === 'Service' && only.coiffeuse_id) {
                payload.coiffeuse_id  = only.coiffeuse_id;
                payload.coiffeuse_nom = only.coiffeuse_nom;
            } else {
                payload.coiffeuse_id = null;
            }
        }

        try {
            App.showLoading?.();
            const result = await Utils.create('ventes', payload);
            if (result.error) throw new Error(result.error.message);

            // Décrémenter le stock pour les produits
            for (const item of this.selectedItems.filter(i => i.item_type === 'Produit')) {
                const produit = this.produits.find(p => p.id === item.id);
                if (produit) {
                    const newStock =
                        (produit.stock_actuel || 0) - (item.quantite || 1);
                    await Utils.update('produits', item.id, {
                        stock_actuel: Math.max(0, newStock)
                    });
                }
            }

            if (rdvId) {
                await Utils.update('rendez_vous', rdvId, { statut: 'Terminé' });
            }

            App.hideLoading?.();

            // ✅ Fermeture modal robuste
            if (modal && modal.parentNode) {
                modal.parentNode.removeChild(modal);
            } else if (modal) {
                modal.style.display = 'none';
            }

            App.showNotification('Vente enregistrée avec succès !', 'success');

            this.selectedItems = [];
            this.currentTotal  = 0;

            await this.loadAllData();
            this.renderTable();
            this.updateStats();

        } catch (error) {
            App.hideLoading?.();
            console.error('[Ventes] saveVente error:', error);
            App.showNotification(
                'Erreur lors de l\'enregistrement : ' + error.message, 'error'
            );
        }
    },

      // =========================================================================  
    // 19. showDetails()  ✅ Commission retirée de l'affichage client  
    // =========================================================================  
    showDetails(venteId) {  
        const vente = this.data.find(v => v.id === venteId);  
        if (!vente) return;  

        const items = this.parseItems(vente.items);  

        const itemsHTML = items.length > 0  
            ? items.map(item => {  
                const typePill = item.item_type === 'Service'  
                    ? '<span class="text-xs bg-blue-100 text-blue-700 px-1 rounded ml-1">S</span>'  
                    : '<span class="text-xs bg-green-100 text-green-700 px-1 rounded ml-1">P</span>';  

                return `  
                    <tr class="border-b border-gray-100">  
                        <td class="py-2">  
                            ${item.item_nom || item.nom || '-'}${typePill}  
                            ${item.coiffeuse_nom  
                                ? `<div class="text-xs text-gray-400">  
                                       ${item.coiffeuse_nom}  
                                   </div>`  
                                : ''}  
                        </td>  
                        <td class="py-2 text-center">${item.quantite || 1}</td>  
                        <td class="py-2 text-right">  
                            ${Utils.formatCurrency(item.prix_unitaire || 0)}  
                        </td>  
                        <td class="py-2 text-right font-medium">  
                            ${Utils.formatCurrency(  
                                (item.prix_unitaire || 0) * (item.quantite || 1)  
                            )}  
                        </td>  
                    </tr>`;  
            }).join('')  
            : `<tr>  
                   <td colspan="4" class="py-4 text-center text-gray-400">  
                       Aucun détail disponible  
                   </td>  
               </tr>`;  

        const content = `  
            <div class="space-y-4">  
                <div class="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">  
                    <div>  
                        <p class="text-xs text-gray-500">Date</p>  
                        <p class="font-medium">  
                            ${Utils.formatDateTime(vente.date_vente)}  
                        </p>  
                    </div>  
                    <div>  
                        <p class="text-xs text-gray-500">Type</p>  
                        <p class="font-medium">${vente.type}</p>  
                    </div>  
                    <div>  
                        <p class="text-xs text-gray-500">Client</p>  
                        <p class="font-medium">${vente.client_nom || 'Anonyme'}</p>  
                        <p class="text-xs text-gray-400">  
                            ${vente.client_telephone || ''}  
                        </p>  
                    </div>  
                    <div>  
                        <p class="text-xs text-gray-500">Mode de paiement</p>  
                        <p class="font-medium">${vente.mode_paiement || '-'}</p>  
                    </div>  
                </div>  

                <div>  
                    <h4 class="font-medium text-gray-700 mb-2">Articles</h4>  
                    <table class="w-full text-sm">  
                        <thead class="border-b border-gray-200">  
                            <tr>  
                                <th class="text-left py-2">Article</th>  
                                <th class="text-center py-2">Qté</th>  
                                <th class="text-right py-2">P.U.</th>  
                                <th class="text-right py-2">Total</th>  
                            </tr>  
                        </thead>  
                        <tbody>${itemsHTML}</tbody>  
                    </table>  
                </div>  

                <div class="bg-gray-50 rounded-lg p-4 space-y-2">  
                    <div class="flex justify-between font-bold text-lg border-t  
                                border-gray-200 pt-2">  
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
                </div>  
            </div>`;  

        const modal = Utils.createModal(  
            `<i class="fas fa-receipt mr-2"></i>Détails de la vente`,  
            content,  
            null,  
            { hideConfirm: true, closeLabel: 'Fermer' }  
        );  
        document.body.appendChild(modal);  
    },  

    // =========================================================================  
    // 20. printReceipt()  ✅ Format thermique 50×80 mm — sans commission  
    // =========================================================================  
    printReceipt(venteId) {  
        const vente = this.data.find(v => v.id === venteId);  
        if (!vente) {  
            App.showNotification('Vente introuvable', 'error');  
            return;  
        }  

        const items = this.parseItems(vente.items);  

        // ── Lignes articles (sans commission) ────────────────────────────────  
        const itemsRows = items.length > 0  
            ? items.map(item => {  
                const subtotal =  
                    (item.prix_unitaire || 0) * (item.quantite || 1);  
                const nom = (item.item_nom || item.nom || '-')  
                    .substring(0, 22); // tronquer si trop long pour 50mm  
                return `  
                    <tr>  
                        <td colspan="3" class="item-name">${nom}</td>  
                    </tr>  
                    <tr>  
                        <td>${item.quantite || 1} x</td>  
                        <td class="price">  
                            ${Utils.formatCurrency(item.prix_unitaire || 0)}  
                        </td>  
                        <td class="price bold">  
                            ${Utils.formatCurrency(subtotal)}  
                        </td>  
                    </tr>`;  
            }).join('')  
            : `<tr>  
                   <td colspan="3" class="center">  
                       ${vente.item_nom || 'Article'}  
                   </td>  
               </tr>  
               <tr>  
                   <td>1 x</td>  
                   <td class="price">  
                       ${Utils.formatCurrency(vente.montant_total)}  
                   </td>  
                   <td class="price bold">  
                       ${Utils.formatCurrency(vente.montant_total)}  
                   </td>  
               </tr>`;  

        const dateStr = new Date(vente.date_vente).toLocaleString('fr-FR', {  
            day:    '2-digit',  
            month:  '2-digit',  
            year:   'numeric',  
            hour:   '2-digit',  
            minute: '2-digit'  
        });  

        const receiptHTML = `<!DOCTYPE html>  
<html lang="fr">  
<head>  
    <meta charset="UTF-8">  
    <title>Reçu #${venteId.slice(-6).toUpperCase()}</title>  
    <style>  
        /* ── Format thermique 50 mm × 80 mm ── */  
        @page {  
            size: 50mm 80mm;  
            margin: 1mm 2mm;  
        }  

        * {  
            box-sizing: border-box;  
            margin: 0;  
            padding: 0;  
        }  

        body {  
            font-family: 'Courier New', Courier, monospace;  
            font-size: 7.5pt;  
            width: 46mm;  
            color: #000;  
            background: #fff;  
        }  

        /* ── En-tête ── */  
        .header {  
            text-align: center;  
            padding-bottom: 2mm;  
            border-bottom: 1px dashed #000;  
            margin-bottom: 2mm;  
        }  
        .header .salon-name {  
            font-size: 10pt;  
            font-weight: bold;  
            letter-spacing: 1px;  
        }  
        .header .receipt-title {  
            font-size: 8pt;  
            font-weight: bold;  
            margin-top: 1mm;  
        }  
        .header .meta {  
            font-size: 6.5pt;  
            color: #333;  
            margin-top: 1mm;  
        }  

        /* ── Client ── */  
        .client-section {  
            padding: 1.5mm 0;  
            border-bottom: 1px dashed #000;  
            margin-bottom: 2mm;  
            font-size: 7pt;  
        }  

        /* ── Articles ── */  
        table {  
            width: 100%;  
            border-collapse: collapse;  
        }  
        td {  
            font-size: 7pt;  
            padding: 0.5mm 0;  
            vertical-align: top;  
        }  
        td.price {  
            text-align: right;  
        }  
        td.item-name {  
            font-style: italic;  
            padding-top: 1.5mm;  
            color: #444;  
        }  
        td.bold {  
            font-weight: bold;  
        }  

        /* ── Séparateurs ── */  
        .separator {  
            border-top: 1px dashed #000;  
            margin: 1.5mm 0;  
        }  
        .separator-solid {  
            border-top: 1px solid #000;  
            margin: 1.5mm 0;  
        }  

        /* ── Total ── */  
        .total-line {  
            display: flex;  
            justify-content: space-between;  
            font-size: 9pt;  
            font-weight: bold;  
            margin: 1.5mm 0;  
        }  
        .sub-line {  
            display: flex;  
            justify-content: space-between;  
            font-size: 7pt;  
            margin: 0.8mm 0;  
            color: #333;  
        }  

        /* ── Pied de page ── */  
        .footer {  
            text-align: center;  
            margin-top: 2mm;  
            padding-top: 2mm;  
            border-top: 1px dashed #000;  
            font-size: 6.5pt;  
            color: #444;  
        }  

        /* Utilitaires */  
        .center { text-align: center; }  
        .right  { text-align: right; }  
        .bold   { font-weight: bold; }  

        /* ── Masquer au print les éléments non ticket ── */  
        @media print {  
            html, body { height: 80mm; overflow: hidden; }  
        }  
    </style>  
</head>  
<body>  

    <!-- EN-TÊTE -->  
    <div class="header">  
        <div class="salon-name">JL BEAUTY</div>  
        <div class="receipt-title">REÇU DE VENTE</div>  
        <div class="meta">${dateStr}</div>  
        <div class="meta">N° ${venteId.slice(-8).toUpperCase()}</div>  
    </div>  

    <!-- CLIENT -->  
    <div class="client-section">  
        <div><strong>Client :</strong> ${vente.client_nom || 'Anonyme'}</div>  
        ${vente.client_telephone  
            ? `<div><strong>Tél :</strong> ${vente.client_telephone}</div>`  
            : ''}  
    </div>  

    <!-- ARTICLES — sans commission -->  
    <table>  
        <tbody>  
            ${itemsRows}  
        </tbody>  
    </table>  

    <!-- TOTAUX -->  
    <div class="separator-solid"></div>  

    <div class="total-line">  
        <span>TOTAL</span>  
        <span>${Utils.formatCurrency(vente.montant_total)}</span>  
    </div>  

    ${vente.montant_percu ? `  
    <div class="separator"></div>  
    <div class="sub-line">  
        <span>Reçu</span>  
        <span>${Utils.formatCurrency(vente.montant_percu)}</span>  
    </div>  
    <div class="sub-line bold">  
        <span>Monnaie</span>  
        <span>${Utils.formatCurrency(vente.monnaie || 0)}</span>  
    </div>` : ''}  

    <div class="separator"></div>  
    <div class="sub-line">  
        <span>Paiement</span>  
        <span>${vente.mode_paiement || '-'}</span>  
    </div>  

    <!-- PIED DE PAGE -->  
    <div class="footer">  
        <div>Merci de votre visite !</div>  
        <div>À bientôt chez JL Beauty</div>  
    </div>  

</body>  
</html>`;  

        // ✅ Ouverture et impression dans une nouvelle fenêtre  
        const win = window.open('', '_blank', 'width=300,height=500');  
        if (!win) {  
            App.showNotification(  
                'Fenêtre bloquée — autorisez les popups pour ce site', 'warning'  
            );  
            return;  
        }  

        win.document.open();  
        win.document.write(receiptHTML);  
        win.document.close();  
 // ✅ Attendre le chargement complet avant d'imprimer
 win.addEventListener('load', () => {
    setTimeout(() => {
        win.focus();
        win.print();
        // Fermer après impression (optionnel)
        win.addEventListener('afterprint', () => win.close());
    }, 300);
});

// ✅ Fallback si l'événement load ne se déclenche pas
setTimeout(() => {
    if (!win.closed) {
        win.focus();
        win.print();
    }
}, 1200);
},

// =========================================================================
// 21. exportPeriod()
// =========================================================================
exportPeriod() {
const filteredData = PeriodFilter.filterData(this.data, 'date_vente');

if (filteredData.length === 0) {
    App.showNotification('Aucune donnée à exporter', 'warning');
    return;
}

// ── Construire les lignes CSV ─────────────────────────────────────────
const headers = [
    'Date',
    'Type',
    'Client',
    'Téléphone',
    'Articles',
    'Montant Total',
    'Mode Paiement',
    'Montant Perçu',
    'Monnaie Rendue',
    'Commission'
];

const rows = filteredData.map(vente => {
    const items    = this.parseItems(vente.items);
    const articles = items.length > 0
        ? items.map(i =>
            `${i.item_nom || i.nom || '-'} x${i.quantite || 1}`
          ).join(' | ')
        : (vente.item_nom || '-');

    const date = new Date(vente.date_vente).toLocaleString('fr-FR', {
        day:    '2-digit',
        month:  '2-digit',
        year:   'numeric',
        hour:   '2-digit',
        minute: '2-digit'
    });

    return [
        `"${date}"`,
        `"${vente.type || ''}"`,
        `"${vente.client_nom || 'Anonyme'}"`,
        `"${vente.client_telephone || ''}"`,
        `"${articles}"`,
        (vente.montant_total   || 0).toFixed(2),
        `"${vente.mode_paiement || ''}"`,
        (vente.montant_percu   || 0).toFixed(2),
        (vente.monnaie         || 0).toFixed(2),
        (vente.commission      || 0).toFixed(2)
    ].join(',');
});

const csvContent =
    '\uFEFF' +                          // BOM pour Excel
    headers.join(',') + '\n' +
    rows.join('\n');

// ── Télécharger le fichier ────────────────────────────────────────────
const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;'
});
const url  = URL.createObjectURL(blob);
const link = document.createElement('a');

const { start, end } = PeriodFilter.getCurrentDates?.() || {};
const suffix = start && end
    ? `_${start}_au_${end}`
    : `_${new Date().toISOString().slice(0, 10)}`;

link.href     = url;
link.download = `ventes${suffix}.csv`;
link.click();

URL.revokeObjectURL(url);
App.showNotification(
    `${filteredData.length} vente(s) exportée(s)`, 'success'
);
},

// =========================================================================
// 22. updateCommissionPreview()  — usage interne seulement, pas sur le reçu
// =========================================================================
updateCommissionPreview() {
const selectService   = document.getElementById('select-service');
const selectCoiffeuse = document.getElementById('select-coiffeuse');
const prixInput       = document.getElementById('item-prix');
const preview         = document.getElementById('commission-preview');

if (!preview) return;

const prix     = parseFloat(prixInput?.value)             || 0;
const coiffOpt = selectCoiffeuse?.options[
                     selectCoiffeuse?.selectedIndex
                 ];
const taux     = parseFloat(coiffOpt?.dataset?.taux)      || 0;

if (prix > 0 && taux > 0 && selectService?.value) {
    const comm = Math.round((prix * taux / 100) * 100) / 100;
    preview.classList.remove('hidden');

    const tauxLabel = document.getElementById('comm-taux-label');
    const commLabel = document.getElementById('comm-montant-label');
    if (tauxLabel) tauxLabel.textContent = `(${taux}%)`;
    if (commLabel) commLabel.textContent = Utils.formatCurrency(comm);
} else {
    preview.classList.add('hidden');
}
},

};  // ── Fin de l'objet Ventes ─────────────────────────────────────────────────

// =============================================================================
// Export global (si nécessaire selon votre architecture)
// =============================================================================
if (typeof module !== 'undefined' && module.exports) {
module.exports = Ventes;
}