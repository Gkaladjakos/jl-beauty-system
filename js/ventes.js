// Ventes Module - Version 3 with Multi-Services & Multi-Coiffeuses
const Ventes = {
    data: [],
    clients: [],
    coiffeuses: [],
    services: [],
    produits: [],
    
    async render(container) {
        await this.loadAllData();
        
        container.innerHTML = `
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
                    <input type="date" id="filter-date" class="px-4 py-2 border border-gray-300 rounded-lg">
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Ventes du jour</p>
                    <p id="ventes-jour" class="text-2xl font-bold text-green-600 mt-2">$0.00</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Ventes du mois</p>
                    <p id="ventes-mois" class="text-2xl font-bold text-blue-600 mt-2">$0.00</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Total des ventes</p>
                    <p id="ventes-total" class="text-2xl font-bold text-purple-600 mt-2">$0.00</p>
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
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coiffeuse(s)</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Article(s)</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="ventes-table" class="divide-y divide-gray-200">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        this.renderTable();
        this.updateStats();
        this.setupFilters();
    },
    
    async loadAllData() {
        try {
            const [ventesData, clientsData, coiffeusesData, servicesData, produitsData] = await Promise.all([
                Utils.get('ventes'),
                Utils.get('clients'),
                Utils.get('coiffeuses'),
                Utils.get('services'),
                Utils.get('produits')
            ]);
            
            this.data = ventesData.data || [];
            this.clients = clientsData.data || [];
            this.coiffeuses = coiffeusesData.data || [];
            this.services = servicesData.data || [];
            this.produits = produitsData.data || [];
        } catch (error) {
            console.error('Error loading data:', error);
        }
    },
    
    updateStats() {
        const today = new Date().toDateString();
        const thisMonth = new Date().getMonth();
        
        const ventesJour = this.data
            .filter(v => new Date(v.date_vente).toDateString() === today)
            .reduce((sum, v) => sum + v.montant_total, 0);
        
        const ventesMois = this.data
            .filter(v => new Date(v.date_vente).getMonth() === thisMonth)
            .reduce((sum, v) => sum + v.montant_total, 0);
        
        const ventesTotal = this.data.reduce((sum, v) => sum + v.montant_total, 0);
        
        document.getElementById('ventes-jour').textContent = Utils.formatCurrency(ventesJour);
        document.getElementById('ventes-mois').textContent = Utils.formatCurrency(ventesMois);
        document.getElementById('ventes-total').textContent = Utils.formatCurrency(ventesTotal);
    },
    
    renderTable(filteredData = null) {
        const dataToRender = (filteredData || this.data).sort((a, b) => 
            new Date(b.date_vente) - new Date(a.date_vente)
        );
        const tbody = document.getElementById('ventes-table');
        
        if (!tbody) return;
        
        if (dataToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-cash-register text-4xl mb-2"></i>
                        <p>Aucune vente enregistrée</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = dataToRender.map(vente => {
            // Display items (services or products)
            let itemsDisplay = '';
            let coiffeusesDisplay = '';
            
            if (vente.items && Array.isArray(vente.items)) {
                // Multi-services with multi-coiffeuses
                if (vente.items.length > 1) {
                    itemsDisplay = `<span class="font-medium">${vente.items.length} services</span>`;
                } else {
                    itemsDisplay = `<span class="font-medium">${vente.items[0].service_nom}</span>`;
                }
                
                // Get unique coiffeuses
                const uniqueCoiffeuses = [...new Set(vente.items.map(item => item.coiffeuse_nom))];
                if (uniqueCoiffeuses.length > 1) {
                    coiffeusesDisplay = `<span class="text-sm">${uniqueCoiffeuses.length} coiffeuses</span>`;
                } else {
                    coiffeusesDisplay = `<span class="text-sm">${uniqueCoiffeuses[0]}</span>`;
                }
            } else {
                // Single item (legacy or product)
                itemsDisplay = `<span class="font-medium">${vente.item_nom || '-'}</span>`;
                if (vente.quantite && vente.quantite > 1) {
                    itemsDisplay += `<br><span class="text-xs text-gray-500">Qté: ${vente.quantite}</span>`;
                }
                coiffeusesDisplay = `<span class="text-sm">${vente.coiffeuse_nom || '-'}</span>`;
            }
            
            return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <p class="text-sm font-medium text-gray-800">${Utils.formatDateTime(vente.date_vente)}</p>
                </td>
                <td class="px-6 py-4">
                    <span class="badge ${vente.type === 'Service' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                        ${vente.type}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-800">${vente.client_nom || 'Client'}</p>
                    ${vente.client_telephone ? `<p class="text-xs text-gray-500">${vente.client_telephone}</p>` : ''}
                </td>
                <td class="px-6 py-4">
                    ${coiffeusesDisplay}
                </td>
                <td class="px-6 py-4">
                    ${itemsDisplay}
                </td>
                <td class="px-6 py-4">
                    <p class="font-medium text-gray-800">${Utils.formatCurrency(vente.montant_total)}</p>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm ${vente.commission_total && vente.commission_total > 0 ? 'text-green-600' : 'text-gray-400'} font-medium">
                        ${vente.commission_total && vente.commission_total > 0 ? Utils.formatCurrency(vente.commission_total) : '-'}
                    </p>
                </td>
                <td class="px-6 py-4">
                    <button onclick="Ventes.showDetailModal('${vente.id}')" 
                            class="text-purple-600 hover:text-purple-800" title="Détails">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    },
    
    setupFilters() {
        const filterType = document.getElementById('filter-type');
        const filterDate = document.getElementById('filter-date');
        
        const applyFilters = () => {
            const type = filterType?.value || '';
            const date = filterDate?.value || '';
            
            const filtered = this.data.filter(v => {
                const matchesType = !type || v.type === type;
                const matchesDate = !date || new Date(v.date_vente).toISOString().split('T')[0] === date;
                return matchesType && matchesDate;
            });
            
            this.renderTable(filtered);
        };
        
        if (filterType) filterType.addEventListener('change', applyFilters);
        if (filterDate) filterDate.addEventListener('change', applyFilters);
    },
    
    showAddModal() {
        const modalContent = `
            <form id="vente-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Type de vente *</label>
                    <select name="type" required onchange="Ventes.toggleItemSelect()" id="type-vente"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="">Sélectionner</option>
                        <option value="Service">Service(s)</option>
                        <option value="Produit">Produit</option>
                    </select>
                </div>
                
                <!-- Client Info -->
                <div class="border-t pt-4">
                    <h4 class="font-medium text-gray-700 mb-3"><i class="fas fa-user mr-2"></i>Informations Client</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Téléphone * <span class="text-xs text-gray-500">(obligatoire)</span>
                            </label>
                            <input type="tel" name="client_telephone" required id="client-tel"
                                   placeholder="+243 XXX XXX XXX"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Nom <span class="text-xs text-gray-500">(facultatif)</span>
                            </label>
                            <input type="text" name="client_nom" id="client-nom"
                                   placeholder="Laissez vide pour client anonyme"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        </div>
                    </div>
                </div>
                
                <!-- Services Selection (Multi with individual coiffeuses) -->
                <div id="services-section" style="display: none;" class="border-t pt-4">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-medium text-gray-700"><i class="fas fa-scissors mr-2"></i>Services & Coiffeuses</h4>
                        <button type="button" onclick="Ventes.addServiceRow()" 
                                class="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
                            <i class="fas fa-plus mr-1"></i>Ajouter un service
                        </button>
                    </div>
                    
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p class="text-sm text-blue-800">
                            <i class="fas fa-lightbulb mr-1"></i>
                            Plusieurs coiffeuses peuvent travailler sur le même client. Ajoutez un service par ligne.
                        </p>
                    </div>
                    
                    <div id="services-rows" class="space-y-3">
                        <!-- Service rows will be added here dynamically -->
                    </div>
                    
                    <div id="services-summary" class="mt-4 p-3 bg-gray-50 rounded-lg" style="display: none;">
                        <div class="flex justify-between items-center">
                            <span class="font-medium text-gray-700">Total :</span>
                            <span id="services-total" class="text-xl font-bold text-purple-600">$0.00</span>
                        </div>
                        <div class="text-sm text-gray-600 mt-1">
                            Commission totale : <span id="commission-total" class="font-medium">$0.00</span>
                        </div>
                    </div>
                </div>
                
                <!-- Product Selection (Single) -->
                <div id="produit-section" style="display: none;">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Coiffeuse *</label>
                            <select name="coiffeuse_id" id="coiffeuse-produit"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                <option value="">Sélectionner</option>
                                ${this.coiffeuses.filter(c => c.statut === 'Actif').map(c => 
                                    `<option value="${c.id}">${c.nom}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Produit *</label>
                            <select name="produit_id" id="produit-select"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                <option value="">Sélectionner un produit</option>
                                ${this.produits.filter(p => p.actif).map(p => 
                                    `<option value="${p.id}" data-prix="${p.prix_vente}" data-nom="${p.nom}">${p.nom} - ${Utils.formatCurrency(p.prix_vente)}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                        <input type="number" name="quantite" value="1" min="1" id="quantite-input"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mode de paiement *</label>
                    <select name="mode_paiement" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="Espèces">Espèces</option>
                        <option value="Carte bancaire">Carte bancaire</option>
                        <option value="Mobile Money">Mobile Money</option>
                        <option value="Chèque">Chèque</option>
                    </select>
                </div>
            </form>
        `;
        
        Utils.createModal('Enregistrer une vente', modalContent, async (modal) => {
            await this.saveVente(modal);
        });
        
        // Add first service row by default
        setTimeout(() => {
            const type = document.getElementById('type-vente')?.value;
            if (type === 'Service') {
                this.addServiceRow();
            }
        }, 100);
    },
    
    toggleItemSelect() {
        const type = document.getElementById('type-vente')?.value;
        const servicesSection = document.getElementById('services-section');
        const produitSection = document.getElementById('produit-section');
        
        if (type === 'Service') {
            servicesSection.style.display = 'block';
            produitSection.style.display = 'none';
            // Add first row if empty
            const rows = document.getElementById('services-rows');
            if (rows && rows.children.length === 0) {
                this.addServiceRow();
            }
        } else if (type === 'Produit') {
            servicesSection.style.display = 'none';
            produitSection.style.display = 'block';
        } else {
            servicesSection.style.display = 'none';
            produitSection.style.display = 'none';
        }
    },
    
    addServiceRow() {
        const container = document.getElementById('services-rows');
        if (!container) return;
        
        const rowId = 'service-row-' + Date.now();
        const row = document.createElement('div');
        row.id = rowId;
        row.className = 'grid grid-cols-12 gap-3 items-start p-3 border border-gray-200 rounded-lg bg-white';
        row.innerHTML = `
            <div class="col-span-5">
                <label class="block text-xs font-medium text-gray-700 mb-1">Service *</label>
                <select class="service-select w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                        data-row="${rowId}" onchange="Ventes.updateTotal()">
                    <option value="">Sélectionner</option>
                    ${this.services.filter(s => s.actif).map(s => 
                        `<option value="${s.id}" data-nom="${s.nom}" data-prix="${s.prix}">${s.nom} (${Utils.formatCurrency(s.prix)})</option>`
                    ).join('')}
                </select>
            </div>
            <div class="col-span-5">
                <label class="block text-xs font-medium text-gray-700 mb-1">Coiffeuse *</label>
                <select class="coiffeuse-select w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                        data-row="${rowId}" onchange="Ventes.updateTotal()">
                    <option value="">Sélectionner</option>
                    ${this.coiffeuses.filter(c => c.statut === 'Actif').map(c => 
                        `<option value="${c.id}" data-nom="${c.nom}" data-commission="${c.taux_commission}">${c.nom} (${c.taux_commission}%)</option>`
                    ).join('')}
                </select>
            </div>
            <div class="col-span-2 flex items-end">
                <button type="button" onclick="Ventes.removeServiceRow('${rowId}')" 
                        class="w-full px-2 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(row);
        this.updateTotal();
    },
    
    removeServiceRow(rowId) {
        const row = document.getElementById(rowId);
        if (row) {
            row.remove();
            this.updateTotal();
        }
    },
    
    updateTotal() {
        const rows = document.querySelectorAll('[id^="service-row-"]');
        let total = 0;
        let totalCommission = 0;
        let validRows = 0;
        
        rows.forEach(row => {
            const serviceSelect = row.querySelector('.service-select');
            const coiffeuseSelect = row.querySelector('.coiffeuse-select');
            
            if (serviceSelect && serviceSelect.value && coiffeuseSelect && coiffeuseSelect.value) {
                const selectedService = serviceSelect.options[serviceSelect.selectedIndex];
                const selectedCoiffeuse = coiffeuseSelect.options[coiffeuseSelect.selectedIndex];
                
                const prix = parseFloat(selectedService.dataset.prix || 0);
                const commission = parseFloat(selectedCoiffeuse.dataset.commission || 0);
                
                total += prix;
                totalCommission += (prix * commission) / 100;
                validRows++;
            }
        });
        
        const summary = document.getElementById('services-summary');
        if (summary) {
            summary.style.display = validRows > 0 ? 'block' : 'none';
        }
        
        const totalSpan = document.getElementById('services-total');
        if (totalSpan) {
            totalSpan.textContent = Utils.formatCurrency(total);
        }
        
        const commissionSpan = document.getElementById('commission-total');
        if (commissionSpan) {
            commissionSpan.textContent = Utils.formatCurrency(totalCommission);
        }
    },
    
    async saveVente(modal) {
        const form = modal.querySelector('#vente-form');
        const type = form.querySelector('[name="type"]').value;
        
        if (!type) {
            App.showNotification('Veuillez sélectionner un type de vente', 'error');
            return;
        }
        
        const clientTel = form.querySelector('[name="client_telephone"]').value.trim();
        const clientNom = form.querySelector('[name="client_nom"]').value.trim();
        
        if (!clientTel) {
            App.showNotification('Le numéro de téléphone est obligatoire', 'error');
            return;
        }
        
        try {
            App.showLoading();
            
            // Find or create client
            let client = this.clients.find(c => c.telephone === clientTel);
            if (!client) {
                client = await Utils.create('clients', {
                    id: Utils.generateId(),
                    nom: clientNom || '',
                    telephone: clientTel,
                    email: '',
                    date_naissance: null,
                    adresse: '',
                    preferences: '',
                    points_fidelite: 0,
                    statut: 'Actif',
                    date_inscription: Date.now()
                });
            }
            
            const displayNom = client.nom && client.nom.trim() !== '' ? client.nom : clientNom || '';
            
            if (type === 'Service') {
                // Multi-services with multi-coiffeuses
                const rows = document.querySelectorAll('[id^="service-row-"]');
                
                if (rows.length === 0) {
                    App.showNotification('Veuillez ajouter au moins un service', 'error');
                    App.hideLoading();
                    return;
                }
                
                const items = [];
                let montantTotal = 0;
                let commissionTotal = 0;
                
                for (const row of rows) {
                    const serviceSelect = row.querySelector('.service-select');
                    const coiffeuseSelect = row.querySelector('.coiffeuse-select');
                    
                    if (!serviceSelect.value || !coiffeuseSelect.value) {
                        App.showNotification('Veuillez remplir tous les services et coiffeuses', 'error');
                        App.hideLoading();
                        return;
                    }
                    
                    const selectedService = serviceSelect.options[serviceSelect.selectedIndex];
                    const selectedCoiffeuse = coiffeuseSelect.options[coiffeuseSelect.selectedIndex];
                    
                    const serviceId = serviceSelect.value;
                    const serviceNom = selectedService.dataset.nom;
                    const servicePrix = parseFloat(selectedService.dataset.prix);
                    
                    const coiffeuseId = coiffeuseSelect.value;
                    const coiffeuseNom = selectedCoiffeuse.dataset.nom;
                    const tauxCommission = parseFloat(selectedCoiffeuse.dataset.commission);
                    
                    const commission = (servicePrix * tauxCommission) / 100;
                    
                    items.push({
                        service_id: serviceId,
                        service_nom: serviceNom,
                        prix: servicePrix,
                        coiffeuse_id: coiffeuseId,
                        coiffeuse_nom: coiffeuseNom,
                        taux_commission: tauxCommission,
                        commission: commission
                    });
                    
                    montantTotal += servicePrix;
                    commissionTotal += commission;
                }
                
                const venteData = {
                    id: Utils.generateId(),
                    type: 'Service',
                    client_id: client.id,
                    client_nom: displayNom,
                    client_telephone: clientTel,
                    items: items, // Array of {service_id, service_nom, prix, coiffeuse_id, coiffeuse_nom, commission}
                    montant_total: montantTotal,
                    commission_total: commissionTotal,
                    mode_paiement: form.querySelector('[name="mode_paiement"]').value,
                    date_vente: Date.now()
                };
                
                await Utils.create('ventes', venteData);
                
            } else {
                // Product sale (single coiffeuse)
                const coiffeuseId = form.querySelector('[name="coiffeuse_id"]').value;
                const produitId = form.querySelector('[name="produit_id"]').value;
                const quantite = parseInt(form.querySelector('[name="quantite"]').value) || 1;
                
                if (!coiffeuseId) {
                    App.showNotification('Veuillez sélectionner une coiffeuse', 'error');
                    App.hideLoading();
                    return;
                }
                
                if (!produitId) {
                    App.showNotification('Veuillez sélectionner un produit', 'error');
                    App.hideLoading();
                    return;
                }
                
                const coiffeuse = this.coiffeuses.find(c => c.id === coiffeuseId);
                const produit = this.produits.find(p => p.id === produitId);
                const montantTotal = produit.prix_vente * quantite;
                
                const venteData = {
                    id: Utils.generateId(),
                    type: 'Produit',
                    client_id: client.id,
                    client_nom: displayNom,
                    client_telephone: clientTel,
                    coiffeuse_id: coiffeuse.id,
                    coiffeuse_nom: coiffeuse.nom,
                    item_nom: produit.nom,
                    item_id: produit.id,
                    quantite: quantite,
                    prix_unitaire: produit.prix_vente,
                    montant_total: montantTotal,
                    commission_total: 0, // No commission on products
                    mode_paiement: form.querySelector('[name="mode_paiement"]').value,
                    date_vente: Date.now()
                };
                
                await Utils.create('ventes', venteData);
                
                // Update product stock
                const newStock = (produit.stock_actuel || 0) - quantite;
                await Utils.update('produits', produit.id, {
                    ...produit,
                    stock_actuel: newStock
                });
            }
            
            App.hideLoading();
            App.showNotification('Vente enregistrée avec succès');
            modal.remove();
            this.render(document.getElementById('content-area'));
            
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de l\'enregistrement', 'error');
            console.error(error);
        }
    },
    
    showDetailModal(id) {
        const vente = this.data.find(v => v.id === id);
        if (!vente) return;
        
        let itemsDetail = '';
        if (vente.items && Array.isArray(vente.items)) {
            itemsDetail = `
                <div>
                    <p class="text-sm text-gray-600 mb-2">Services :</p>
                    <div class="space-y-2">
                        ${vente.items.map(item => `
                            <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div>
                                    <p class="font-medium">${item.service_nom}</p>
                                    <p class="text-xs text-gray-600">Par ${item.coiffeuse_nom} (${item.taux_commission}%)</p>
                                </div>
                                <div class="text-right">
                                    <p class="font-medium">${Utils.formatCurrency(item.prix)}</p>
                                    <p class="text-xs text-green-600">Com: ${Utils.formatCurrency(item.commission)}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            itemsDetail = `
                <div>
                    <p class="text-sm text-gray-600">Article</p>
                    <p class="font-medium">${vente.item_nom}</p>
                    ${vente.quantite > 1 ? `<p class="text-sm text-gray-500">Quantité: ${vente.quantite}</p>` : ''}
                </div>
            `;
        }
        
        const modalContent = `
            <div class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">Date</p>
                            <p class="font-medium">${Utils.formatDateTime(vente.date_vente)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Type</p>
                            <p><span class="badge ${vente.type === 'Service' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">${vente.type}</span></p>
                        </div>
                    </div>
                </div>
                
                <div>
                    <p class="text-sm text-gray-600">Client</p>
                    <p class="font-medium">${vente.client_nom || 'Client anonyme'}</p>
                    ${vente.client_telephone ? `<p class="text-sm text-gray-500">${vente.client_telephone}</p>` : ''}
                </div>
                
                ${itemsDetail}
                
                <div class="border-t pt-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">Montant total</p>
                            <p class="text-xl font-bold text-purple-600">${Utils.formatCurrency(vente.montant_total)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Commission totale</p>
                            <p class="text-xl font-bold ${vente.commission_total && vente.commission_total > 0 ? 'text-green-600' : 'text-gray-400'}">
                                ${vente.commission_total && vente.commission_total > 0 ? Utils.formatCurrency(vente.commission_total) : 'Aucune'}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div>
                    <p class="text-sm text-gray-600">Mode de paiement</p>
                    <p class="font-medium">${vente.mode_paiement}</p>
                </div>
            </div>
        `;
        
        Utils.createModal('Détails de la vente', modalContent, null);
    }
};
