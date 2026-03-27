// Ventes Module - Version 4 with Enhanced Features
// - Multi-products for product sales
// - Link with appointments for services
// - Cash handling with change calculation
// - Thermal receipt printing
// - Period filtering

const Ventes = {
    data: [],
    clients: [],
    coiffeuses: [],
    services: [],
    produits: [],
    rendezVous: [],
    currentType: 'Service',
    selectedItems: [], // For multi-product/service selection
    
    async render(container) {
        await this.loadAllData();
        
        container.innerHTML = `
            <!-- Period Filter -->
            ${PeriodFilter.renderHTML('ventes-period-filter')}
            
            <div class="mb-6 flex justify-between items-center">
                <button onclick="Ventes.showAddModal()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
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
                        <tbody id="ventes-table" class="divide-y divide-gray-200">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Setup period filter
        PeriodFilter.setup((range) => {
            this.renderTable();
            this.updateStats();
        });
        
        PeriodFilter.onExport = () => this.exportPeriod();
        
        this.renderTable();
        this.updateStats();
        this.setupFilters();
    },
    
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
            
            this.data = ventesData.data || [];
            this.clients = clientsData.data || [];
            this.coiffeuses = coiffeusesData.data || [];
            this.services = servicesData.data || [];
            this.produits = produitsData.data || [];
            this.rendezVous = rdvData.data || [];
        } catch (error) {
            console.error('Error loading data:', error);
        }
    },
    
    updateStats() {
        const filteredData = PeriodFilter.filterData(this.data, 'date_vente');
        
        const totalPeriode = filteredData.reduce((sum, v) => sum + v.montant_total, 0);
        const totalServices = filteredData.filter(v => v.type === 'Service').reduce((sum, v) => sum + v.montant_total, 0);
        const totalProduits = filteredData.filter(v => v.type === 'Produit').reduce((sum, v) => sum + v.montant_total, 0);
        const totalCommissions = filteredData.reduce((sum, v) => sum + (v.commission || 0), 0);
        
        document.getElementById('ventes-periode').textContent = Utils.formatCurrency(totalPeriode);
        document.getElementById('ventes-services').textContent = Utils.formatCurrency(totalServices);
        document.getElementById('ventes-produits').textContent = Utils.formatCurrency(totalProduits);
        document.getElementById('total-commissions').textContent = Utils.formatCurrency(totalCommissions);
    },
    
    renderTable() {
        const tbody = document.getElementById('ventes-table');
        if (!tbody) return;
        
        let filteredData = PeriodFilter.filterData(this.data, 'date_vente');
        
        // Apply type filter
        const typeFilter = document.getElementById('filter-type')?.value;
        if (typeFilter) {
            filteredData = filteredData.filter(v => v.type === typeFilter);
        }
        
        // ✅ FIX 1 — Tri par date ISO string (new Date() pour comparaison correcte)
        filteredData.sort((a, b) => new Date(b.date_vente) - new Date(a.date_vente));
        
        if (filteredData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-inbox text-4xl mb-2"></i>
                        <p>Aucune vente pour cette période</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = filteredData.map(vente => {
            const date = Utils.formatDateTime(vente.date_vente);
            const typeBadge = vente.type === 'Service' 
                ? '<span class="badge bg-blue-100 text-blue-800">Service</span>'
                : '<span class="badge bg-green-100 text-green-800">Produit</span>';
            
            // ✅ FIX 2 — Parser items si Supabase le retourne en JSON string
            let details = '';
            const items = typeof vente.items === 'string'
                ? (() => { try { return JSON.parse(vente.items); } catch(e) { return null; } })()
                : vente.items;

            if (items && Array.isArray(items) && items.length > 0) {
                const count = items.length;
                const firstItem = items[0];
                details = count > 1 
                    ? `${count} ${vente.type === 'Service' ? 'services' : 'produits'}`
                    : (firstItem.item_nom || firstItem.service_nom || firstItem.nom || '-');
            } else {
                details = vente.item_nom || '-';
            }
            
            // ✅ FIX 3 — Utiliser vente.monnaie stocké plutôt que recalculer
            const paiementInfo = vente.montant_percu 
                ? `Perçu: ${Utils.formatCurrency(vente.montant_percu)}<br>Monnaie: ${Utils.formatCurrency(vente.monnaie || 0)}`
                : vente.mode_paiement;

            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm">${date}</td>
                    <td class="px-6 py-4">${typeBadge}</td>
                    <td class="px-6 py-4 text-sm">
                        <div class="font-medium">${vente.client_nom || 'Anonyme'}</div>
                        <div class="text-gray-500 text-xs">${vente.client_telephone}</div>
                    </td>
                    <td class="px-6 py-4 text-sm">${details}</td>
                    <td class="px-6 py-4 text-sm font-semibold">${Utils.formatCurrency(vente.montant_total)}</td>
                    <td class="px-6 py-4 text-xs text-gray-600">${paiementInfo}</td>
                    <td class="px-6 py-4">
                        <button onclick="Ventes.showDetails('${vente.id}')" class="text-blue-600 hover:text-blue-800 mr-2" title="Détails">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="Ventes.printReceipt('${vente.id}')" class="text-green-600 hover:text-green-800" title="Imprimer reçu">
                            <i class="fas fa-print"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    setupFilters() {
        const typeFilter = document.getElementById('filter-type');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.renderTable();
                this.updateStats();
            });
        }
    },
    
    showAddModal() {
        this.selectedItems = [];
        
        const modalContent = `
            <form id="vente-form" class="space-y-4">
                <!-- Type de vente -->
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
                
                <!-- Service: Option lien avec RDV -->
                <div id="service-rdv-option" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="link-rdv" class="mr-3 w-4 h-4" onchange="Ventes.toggleRdvLink()">
                        <span class="text-sm font-medium text-blue-800">
                            <i class="fas fa-link mr-2"></i>Lier à un rendez-vous existant
                        </span>
                    </label>
                    
                    <div id="rdv-selector" class="hidden mt-3">
                        <select id="select-rdv" class="w-full px-3 py-2 border border-gray-300 rounded-lg" onchange="Ventes.loadFromRdv()">
                            <option value="">Sélectionner un rendez-vous...</option>
                        </select>
                    </div>
                </div>
                
                <!-- Client Info -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone client *</label>
                        <input type="tel" id="client-telephone" name="client_telephone" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                               placeholder="+243 XXX XXX XXX">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom client (optionnel)</label>
                        <input type="text" id="client-nom" name="client_nom"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                               placeholder="Nom du client">
                    </div>
                </div>
                
                <!-- Items Selection Area -->
                <div id="items-area">
                    <!-- Will be populated based on type -->
                </div>
                
                <!-- Selected Items Display -->
                <div id="selected-items-display" class="hidden">
                    <h4 class="font-medium text-gray-700 mb-2">Articles sélectionnés:</h4>
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
                            <tbody id="selected-items-table">
                            </tbody>
                        </table>
                        <div class="border-t border-gray-300 mt-3 pt-3 flex justify-between font-bold">
                            <span>TOTAL:</span>
                            <span id="total-amount">$0.00</span>
                        </div>
                        <div id="commission-total" class="hidden text-sm text-gray-600 mt-2 flex justify-between">
                            <span>Commission totale:</span>
                            <span id="total-commission">$0.00</span>
                        </div>
                    </div>
                </div>
                
                <!-- Payment Section -->
                <div class="border-t border-gray-200 pt-4">
                    <h4 class="font-medium text-gray-700 mb-3">Paiement</h4>
                    
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Mode de paiement *</label>
                            <select name="mode_paiement" required class="w-full px-3 py-2 border border-gray-300 rounded-lg">
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
                            <span class="text-sm font-medium text-green-800">Monnaie à rendre:</span>
                            <span id="change-amount" class="text-xl font-bold text-green-700">$0.00</span>
                        </div>
                    </div>
                    
                    <div id="insufficient-payment" class="hidden bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
                        <p class="text-sm text-red-800">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            Montant insuffisant
                        </p>
                    </div>
                </div>
            </form>
        `;
        
        const modal = Utils.createModal(
            '<i class="fas fa-cash-register mr-2"></i>Enregistrer une vente',
            modalContent,
            // ✅ FIX 4 — Référence directe à Ventes.saveVente pour éviter le problème de contexte "this"
            () => Ventes.saveVente(modal),
        );
        
        document.body.appendChild(modal);
        
        // Initialize with Service type
        this.setType('Service');
        this.loadRdvOptions();
    },

    // Continue in next file part...
};
