// Ventes Module - Part 2: Methods

// Set type (Service or Produit)
Ventes.setType = function(type) {
    this.currentType = type;
    this.selectedItems = [];
    
    // Update buttons
    const btnService = document.getElementById('btn-type-service');
    const btnProduit = document.getElementById('btn-type-produit');
    
    if (type === 'Service') {
        btnService.className = 'px-4 py-3 border-2 border-blue-600 bg-blue-50 text-blue-700 rounded-lg font-medium';
        btnProduit.className = 'px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50';
        document.getElementById('service-rdv-option').classList.remove('hidden');
    } else {
        btnProduit.className = 'px-4 py-3 border-2 border-green-600 bg-green-50 text-green-700 rounded-lg font-medium';
        btnService.className = 'px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50';
        document.getElementById('service-rdv-option').classList.add('hidden');
    }
    
    this.renderItemsArea();
};

// Toggle RDV link
Ventes.toggleRdvLink = function() {
    const checkbox = document.getElementById('link-rdv');
    const selector = document.getElementById('rdv-selector');
    
    if (checkbox.checked) {
        selector.classList.remove('hidden');
    } else {
        selector.classList.add('hidden');
        document.getElementById('select-rdv').value = '';
        this.renderItemsArea();
    }
};

// Load RDV options
Ventes.loadRdvOptions = function() {
    const select = document.getElementById('select-rdv');
    if (!select) return;
    
    // Get today's appointments that are not yet completed
    const today = new Date().setHours(0, 0, 0, 0);
    const rdvToday = this.rendezVous.filter(rdv => {
        const rdvDate = new Date(rdv.date_rdv).setHours(0, 0, 0, 0);
        return rdvDate === today && ['Programmé', 'En cours'].includes(rdv.statut);
    });
    
    select.innerHTML = '<option value="">Sélectionner un rendez-vous...</option>';
    
    rdvToday.forEach(rdv => {
        const time = new Date(rdv.date_rdv).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const option = document.createElement('option');
        option.value = rdv.id;
        option.textContent = `${time} - ${rdv.client_nom} - ${rdv.service_nom} (${rdv.coiffeuse_nom})`;
        select.appendChild(option);
    });
};

// Load from RDV
Ventes.loadFromRdv = function() {
    const rdvId = document.getElementById('select-rdv').value;
    if (!rdvId) return;
    
    const rdv = this.rendezVous.find(r => r.id === rdvId);
    if (!rdv) return;
    
    // Fill client info
    document.getElementById('client-telephone').value = rdv.client_telephone || '';
    document.getElementById('client-nom').value = rdv.client_nom || '';
    
    // Add service to selected items
    const service = this.services.find(s => s.id === rdv.service_id);
    const coiffeuse = this.coiffeuses.find(c => c.id === rdv.coiffeuse_id);
    
    if (service && coiffeuse) {
        this.selectedItems = [{
            type: 'Service',
            id: service.id,
            nom: service.nom,
            prix_unitaire: service.prix,
            quantite: 1,
            coiffeuse_id: coiffeuse.id,
            coiffeuse_nom: coiffeuse.nom,
            taux_commission: coiffeuse.taux_commission,
            commission: service.prix * (coiffeuse.taux_commission / 100)
        }];
        
        this.updateSelectedItemsDisplay();
    }
};

// Render items area based on type
Ventes.renderItemsArea = function() {
    const area = document.getElementById('items-area');
    if (!area) return;
    
    if (this.currentType === 'Service') {
        area.innerHTML = `
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <h4 class="font-medium text-gray-700 mb-3">
                    <i class="fas fa-plus-circle mr-2"></i>Ajouter un service
                </h4>
                
                <div class="grid grid-cols-3 gap-3 mb-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Service</label>
                        <select id="add-service" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            <option value="">Choisir...</option>
                            ${this.services.filter(s => s.actif).map(s => 
                                `<option value="${s.id}">${s.nom} - ${Utils.formatCurrency(s.prix)}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Coiffeuse</label>
                        <select id="add-coiffeuse" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            <option value="">Choisir...</option>
                            ${this.coiffeuses.filter(c => c.statut === 'Actif').map(c => 
                                `<option value="${c.id}">${c.nom} (${c.taux_commission}%)</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="flex items-end">
                        <button type="button" onclick="Ventes.addServiceItem()" 
                                class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            <i class="fas fa-plus mr-1"></i>Ajouter
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        area.innerHTML = `
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <h4 class="font-medium text-gray-700 mb-3">
                    <i class="fas fa-plus-circle mr-2"></i>Ajouter un produit
                </h4>
                
                <div class="grid grid-cols-4 gap-3 mb-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Produit</label>
                        <select id="add-produit" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            <option value="">Choisir...</option>
                            ${this.produits.filter(p => p.actif && p.stock_actuel > 0).map(p => 
                                `<option value="${p.id}">${p.nom} - ${Utils.formatCurrency(p.prix_vente)} (Stock: ${p.stock_actuel})</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                        <input type="number" id="add-quantite" min="1" value="1"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix unitaire</label>
                        <input type="number" id="add-prix" step="0.01" readonly
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50">
                    </div>
                    
                    <div class="flex items-end">
                        <button type="button" onclick="Ventes.addProduitItem()" 
                                class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                            <i class="fas fa-plus mr-1"></i>Ajouter
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Auto-fill price when product is selected
        const produitSelect = document.getElementById('add-produit');
        if (produitSelect) {
            produitSelect.addEventListener('change', (e) => {
                const produit = this.produits.find(p => p.id === e.target.value);
                if (produit) {
                    document.getElementById('add-prix').value = produit.prix_vente;
                }
            });
        }
    }
};

// Add service item
Ventes.addServiceItem = function() {
    const serviceId = document.getElementById('add-service').value;
    const coiffeuseId = document.getElementById('add-coiffeuse').value;
    
    if (!serviceId || !coiffeuseId) {
        App.showNotification('Veuillez sélectionner un service et une coiffeuse', 'error');
        return;
    }
    
    const service = this.services.find(s => s.id === serviceId);
    const coiffeuse = this.coiffeuses.find(c => c.id === coiffeuseId);
    
    if (!service || !coiffeuse) return;
    
    const commission = service.prix * (coiffeuse.taux_commission / 100);
    
    this.selectedItems.push({
        type: 'Service',
        id: service.id,
        nom: service.nom,
        prix_unitaire: service.prix,
        quantite: 1,
        coiffeuse_id: coiffeuse.id,
        coiffeuse_nom: coiffeuse.nom,
        taux_commission: coiffeuse.taux_commission,
        commission: commission
    });
    
    // Reset selects
    document.getElementById('add-service').value = '';
    document.getElementById('add-coiffeuse').value = '';
    
    this.updateSelectedItemsDisplay();
};

// Add produit item
Ventes.addProduitItem = function() {
    const produitId = document.getElementById('add-produit').value;
    const quantite = parseInt(document.getElementById('add-quantite').value);
    const prix = parseFloat(document.getElementById('add-prix').value);
    
    if (!produitId || !quantite || quantite < 1) {
        App.showNotification('Veuillez sélectionner un produit et une quantité valide', 'error');
        return;
    }
    
    const produit = this.produits.find(p => p.id === produitId);
    if (!produit) return;
    
    // Check stock
    if (quantite > produit.stock_actuel) {
        App.showNotification(`Stock insuffisant (disponible: ${produit.stock_actuel})`, 'error');
        return;
    }
    
    // Check if already in list, if yes increase quantity
    const existing = this.selectedItems.find(item => item.id === produitId);
    if (existing) {
        const newQuantite = existing.quantite + quantite;
        if (newQuantite > produit.stock_actuel) {
            App.showNotification(`Stock insuffisant (disponible: ${produit.stock_actuel})`, 'error');
            return;
        }
        existing.quantite = newQuantite;
    } else {
        this.selectedItems.push({
            type: 'Produit',
            id: produit.id,
            nom: produit.nom,
            prix_unitaire: prix,
            quantite: quantite,
            stock_disponible: produit.stock_actuel
        });
    }
    
    // Reset fields
    document.getElementById('add-produit').value = '';
    document.getElementById('add-quantite').value = '1';
    document.getElementById('add-prix').value = '';
    
    this.updateSelectedItemsDisplay();
};

// Remove item
Ventes.removeItem = function(index) {
    this.selectedItems.splice(index, 1);
    this.updateSelectedItemsDisplay();
};

// Update selected items display
Ventes.updateSelectedItemsDisplay = function() {
    const display = document.getElementById('selected-items-display');
    const tbody = document.getElementById('selected-items-table');
    const totalAmountEl = document.getElementById('total-amount');
    const commissionTotalDiv = document.getElementById('commission-total');
    const totalCommissionEl = document.getElementById('total-commission');
    
    if (!display || !tbody) return;
    
    if (this.selectedItems.length === 0) {
        display.classList.add('hidden');
        return;
    }
    
    display.classList.remove('hidden');
    
    let totalAmount = 0;
    let totalCommission = 0;
    let hasCommission = false;
    
    tbody.innerHTML = this.selectedItems.map((item, index) => {
        const subtotal = item.prix_unitaire * item.quantite;
        totalAmount += subtotal;
        
        if (item.commission) {
            totalCommission += item.commission;
            hasCommission = true;
        }
        
        let details = item.nom;
        if (item.coiffeuse_nom) {
            details += `<br><small class="text-gray-500">${item.coiffeuse_nom} (${item.taux_commission}%)</small>`;
        }
        
        return `
            <tr class="border-b border-gray-200">
                <td class="py-2">${details}</td>
                <td class="text-center">${item.quantite}</td>
                <td class="text-right">${Utils.formatCurrency(item.prix_unitaire)}</td>
                <td class="text-right font-medium">${Utils.formatCurrency(subtotal)}</td>
                <td class="text-center">
                    <button type="button" onclick="Ventes.removeItem(${index})" 
                            class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    totalAmountEl.textContent = Utils.formatCurrency(totalAmount);
    
    if (hasCommission) {
        commissionTotalDiv.classList.remove('hidden');
        totalCommissionEl.textContent = Utils.formatCurrency(totalCommission);
    } else {
        commissionTotalDiv.classList.add('hidden');
    }
    
    // Store for change calculation
    this.currentTotal = totalAmount;
    this.calculateChange();
};

// Calculate change
Ventes.calculateChange = function() {
    const montantPercu = parseFloat(document.getElementById('montant-percu')?.value) || 0;
    const changeDisplay = document.getElementById('change-display');
    const changeAmount = document.getElementById('change-amount');
    const insufficientPayment = document.getElementById('insufficient-payment');
    
    if (!this.currentTotal || montantPercu === 0) {
        changeDisplay?.classList.add('hidden');
        insufficientPayment?.classList.add('hidden');
        return;
    }
    
    if (montantPercu < this.currentTotal) {
        changeDisplay?.classList.add('hidden');
        insufficientPayment?.classList.remove('hidden');
    } else {
        insufficientPayment?.classList.add('hidden');
        const change = montantPercu - this.currentTotal;
        if (changeAmount) {
            changeAmount.textContent = Utils.formatCurrency(change);
        }
        changeDisplay?.classList.remove('hidden');
    }
};

// Continue in ventes-v4-save.js...
