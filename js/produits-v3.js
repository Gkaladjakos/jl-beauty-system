// Produits Module - Version 3 with Categories & Stock Reports
const ProduitsV3 = {
    data: [],
    currentPeriod: null,
    
    async render(container) {
        await this.loadData();
        const categories = CategoriesManager.getActive();
        
        container.innerHTML = `
            <div class="mb-6 space-y-4">
                <!-- Top Actions -->
                <div class="flex justify-between items-center">
                    <div class="flex space-x-3">
                        <button onclick="ProduitsV3.showAddModal()" 
                                class="px-4 py-2 bg-gradient-to-r from-yellow-500 to-black text-white rounded-lg hover:shadow-lg">
                            <i class="fas fa-plus mr-2"></i>Ajouter un produit
                        </button>
                        <button onclick="CategoriesManager.showModal(() => ProduitsV3.render(document.getElementById('content-area')))" 
                                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            <i class="fas fa-tags mr-2"></i>Gérer catégories
                        </button>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="ProduitsV3.showLowStock()" 
                                class="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                            <i class="fas fa-exclamation-triangle mr-2"></i>Stock faible
                        </button>
                        <button onclick="ProduitsV3.showStockReport()" 
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-chart-line mr-2"></i>Rapport stock
                        </button>
                    </div>
                </div>
                
                <!-- Period Filter -->
                <div id="period-filter-container"></div>
                
                <!-- Filters -->
                <div class="flex space-x-3">
                    <select id="filter-categorie" class="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Toutes catégories</option>
                        ${categories.map(c => `<option value="${c.nom}">${c.nom}</option>`).join('')}
                    </select>
                    <select id="filter-statut" class="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Tous les statuts</option>
                        <option value="En stock">En stock</option>
                        <option value="Stock faible">Stock faible</option>
                        <option value="Rupture">Rupture</option>
                    </select>
                    <input type="text" id="search-produit" 
                           placeholder="Rechercher un produit..." 
                           class="px-4 py-2 border border-gray-300 rounded-lg">
                </div>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Total produits</p>
                    <p id="total-produits" class="text-2xl font-bold text-purple-600 mt-2">0</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Valeur stock</p>
                    <p id="valeur-stock" class="text-2xl font-bold text-green-600 mt-2">$0.00</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Stock faible</p>
                    <p id="stock-faible" class="text-2xl font-bold text-orange-600 mt-2">0</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Ruptures</p>
                    <p id="ruptures" class="text-2xl font-bold text-red-600 mt-2">0</p>
                </div>
            </div>
            
            <!-- Products Table -->
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="table-container">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix Vente</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fournisseur</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="produits-table" class="divide-y divide-gray-200">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Initialize period filter
        const filterContainer = document.getElementById('period-filter-container');
        if (filterContainer && typeof PeriodFilter !== 'undefined') {
            filterContainer.innerHTML = PeriodFilter.render();
            // Setup filter after HTML is rendered
            setTimeout(() => {
                PeriodFilter.setup((period) => {
                    this.currentPeriod = period;
                    this.renderTable();
                    this.updateStats();
                });
            }, 100);
        }
        
        this.renderTable();
        this.updateStats();
        this.setupFilters();
    },
    
    async loadData() {
        try {
            const response = await Utils.get('produits');
            this.data = response.data || [];
        } catch (error) {
            console.error('Error loading produits:', error);
            this.data = [];
        }
    },
    
    updateStats() {
        const totalProduits = this.data.length;
        
        const valeurStock = this.data.reduce((sum, p) => {
            return sum + (p.stock_actuel * p.prix_vente);
        }, 0);
        
        const stockFaible = this.data.filter(p => 
            p.stock_actuel > 0 && p.stock_actuel <= p.stock_minimum
        ).length;
        
        const ruptures = this.data.filter(p => p.stock_actuel === 0).length;
        
        document.getElementById('total-produits').textContent = totalProduits;
        document.getElementById('valeur-stock').textContent = Utils.formatCurrency(valeurStock);
        document.getElementById('stock-faible').textContent = stockFaible;
        document.getElementById('ruptures').textContent = ruptures;
    },
    
    renderTable(filteredData = null) {
        const dataToRender = filteredData || this.data;
        const tbody = document.getElementById('produits-table');
        
        if (!tbody) return;
        
        if (dataToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-box text-4xl mb-2"></i>
                        <p>Aucun produit</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = dataToRender.map(produit => {
            const isLowStock = produit.stock_actuel > 0 && produit.stock_actuel <= produit.stock_minimum;
            const isOutOfStock = produit.stock_actuel === 0;
            
            let statusClass = 'bg-green-100 text-green-800';
            let statusText = 'En stock';
            let statusIcon = 'check-circle';
            
            if (isOutOfStock) {
                statusClass = 'bg-red-100 text-red-800';
                statusText = 'Rupture';
                statusIcon = 'times-circle';
            } else if (isLowStock) {
                statusClass = 'bg-orange-100 text-orange-800';
                statusText = 'Stock faible';
                statusIcon = 'exclamation-triangle';
            }
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                        <p class="font-medium text-gray-800">${produit.nom}</p>
                        ${produit.description ? `<p class="text-xs text-gray-500">${produit.description}</p>` : ''}
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-sm text-gray-800">${produit.categorie}</p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="font-medium text-gray-800">${Utils.formatCurrency(produit.prix_vente)}</p>
                        ${produit.prix_achat ? `<p class="text-xs text-gray-500">Achat: ${Utils.formatCurrency(produit.prix_achat)}</p>` : ''}
                    </td>
                    <td class="px-6 py-4">
                        <p class="font-bold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'}">
                            ${produit.stock_actuel} ${produit.unite || ''}
                        </p>
                        <p class="text-xs text-gray-500">Min: ${produit.stock_minimum || 0}</p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-sm text-gray-800">${produit.fournisseur || '-'}</p>
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1 text-xs rounded-full ${statusClass}">
                            <i class="fas fa-${statusIcon} mr-1"></i>${statusText}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex space-x-2">
                            <button onclick="ProduitsV3.showEditModal('${produit.id}')" 
                                    class="text-blue-600 hover:text-blue-800" 
                                    title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="ProduitsV3.showStockModal('${produit.id}')" 
                                    class="text-green-600 hover:text-green-800" 
                                    title="Ajuster stock">
                                <i class="fas fa-boxes"></i>
                            </button>
                            <button onclick="ProduitsV3.deleteProduit('${produit.id}')" 
                                    class="text-red-600 hover:text-red-800" 
                                    title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    setupFilters() {
        const filterCategorie = document.getElementById('filter-categorie');
        const filterStatut = document.getElementById('filter-statut');
        const searchInput = document.getElementById('search-produit');
        
        const applyFilters = () => {
            const categorie = filterCategorie?.value || '';
            const statut = filterStatut?.value || '';
            const search = searchInput?.value.toLowerCase() || '';
            
            const filtered = this.data.filter(produit => {
                const matchesCategorie = !categorie || produit.categorie === categorie;
                
                let matchesStatut = true;
                if (statut === 'En stock') {
                    matchesStatut = produit.stock_actuel > produit.stock_minimum;
                } else if (statut === 'Stock faible') {
                    matchesStatut = produit.stock_actuel > 0 && produit.stock_actuel <= produit.stock_minimum;
                } else if (statut === 'Rupture') {
                    matchesStatut = produit.stock_actuel === 0;
                }
                
                const matchesSearch = !search || 
                    produit.nom.toLowerCase().includes(search) ||
                    (produit.description && produit.description.toLowerCase().includes(search)) ||
                    (produit.fournisseur && produit.fournisseur.toLowerCase().includes(search));
                
                return matchesCategorie && matchesStatut && matchesSearch;
            });
            
            this.renderTable(filtered);
        };
        
        if (filterCategorie) filterCategorie.addEventListener('change', applyFilters);
        if (filterStatut) filterStatut.addEventListener('change', applyFilters);
        if (searchInput) searchInput.addEventListener('input', applyFilters);
    },
    
    showAddModal() {
        const categories = CategoriesManager.getActive();
        
        const modalContent = `
            <form id="produit-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input type="text" name="nom" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" rows="2" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                    <select name="categorie" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="">Sélectionner une catégorie</option>
                        ${categories.map(c => `<option value="${c.nom}">${c.nom}</option>`).join('')}
                    </select>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix d'achat</label>
                        <input type="number" name="prix_achat" step="0.01" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix de vente *</label>
                        <input type="number" name="prix_vente" required step="0.01" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Stock actuel *</label>
                        <input type="number" name="stock_actuel" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Stock minimum</label>
                        <input type="number" name="stock_minimum" value="5" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                        <select name="unite" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Pièce">Pièce</option>
                            <option value="Bouteille">Bouteille</option>
                            <option value="Tube">Tube</option>
                            <option value="Boîte">Boîte</option>
                            <option value="Sachet">Sachet</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                    <input type="text" name="fournisseur" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea name="notes" rows="2" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                </div>
            </form>
        `;
        
        Utils.createModal('Ajouter un produit', modalContent, async (modal) => {
            const form = modal.querySelector('#produit-form');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            try {
                App.showLoading();
                const formData = Utils.getFormData(form);
                
                const data = {
                    ...formData,
                    prix_achat: parseFloat(formData.prix_achat) || 0,
                    prix_vente: parseFloat(formData.prix_vente) || 0,
                    stock_actuel: parseFloat(formData.stock_actuel) || 0,
                    stock_minimum: parseFloat(formData.stock_minimum) || 5,
                    actif: true
                };
                
                await Utils.create('produits', data);
                await this.loadData();
                this.renderTable();
                this.updateStats();
                
                App.hideLoading();
                App.showNotification('Produit ajouté avec succès', 'success');
                modal.remove();
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors de l\'ajout', 'error');
                console.error(error);
            }
        });
    },
    
    showStockModal(productId) {
        const produit = this.data.find(p => p.id === productId);
        if (!produit) return;
        
        const modalContent = `
            <div class="space-y-4">
                <div class="p-4 bg-gray-50 rounded-lg">
                    <p class="text-sm text-gray-600">Produit</p>
                    <p class="font-bold text-lg">${produit.nom}</p>
                    <p class="text-sm text-gray-600 mt-2">Stock actuel: 
                        <span class="font-bold text-purple-600">${produit.stock_actuel} ${produit.unite}</span>
                    </p>
                </div>
                
                <form id="stock-form">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Type d'opération</label>
                        <select name="operation" id="stock-operation" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="add">Ajouter au stock</option>
                            <option value="remove">Retirer du stock</option>
                            <option value="set">Définir le stock</option>
                        </select>
                    </div>
                    
                    <div class="mt-3">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                        <input type="number" name="quantite" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    
                    <div class="mt-3">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                        <textarea name="motif" rows="2" placeholder="Ex: Réapprovisionnement, vente, inventaire..."
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                    </div>
                    
                    <div id="new-stock-preview" class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg hidden">
                        <p class="text-sm text-gray-600">Nouveau stock:</p>
                        <p class="text-xl font-bold text-blue-600" id="new-stock-value">0</p>
                    </div>
                </form>
            </div>
        `;
        
        const modal = Utils.createModal('Ajuster le stock', modalContent, async (modal) => {
            const form = modal.querySelector('#stock-form');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const formData = Utils.getFormData(form);
            const quantite = parseFloat(formData.quantite) || 0;
            let newStock = produit.stock_actuel;
            
            if (formData.operation === 'add') {
                newStock += quantite;
            } else if (formData.operation === 'remove') {
                newStock -= quantite;
            } else {
                newStock = quantite;
            }
            
            if (newStock < 0) {
                App.showNotification('Le stock ne peut pas être négatif', 'error');
                return;
            }
            
            try {
                App.showLoading();
                
                await Utils.update('produits', productId, {
                    ...produit,
                    stock_actuel: newStock
                });
                
                await this.loadData();
                this.renderTable();
                this.updateStats();
                
                App.hideLoading();
                App.showNotification('Stock mis à jour', 'success');
                modal.remove();
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors de la mise à jour', 'error');
                console.error(error);
            }
        });
        
        // Real-time stock preview
        const operationSelect = modal.querySelector('#stock-operation');
        const quantiteInput = modal.querySelector('[name="quantite"]');
        const preview = modal.querySelector('#new-stock-preview');
        const previewValue = modal.querySelector('#new-stock-value');
        
        const updatePreview = () => {
            const operation = operationSelect.value;
            const quantite = parseFloat(quantiteInput.value) || 0;
            let newStock = produit.stock_actuel;
            
            if (operation === 'add') {
                newStock += quantite;
            } else if (operation === 'remove') {
                newStock -= quantite;
            } else {
                newStock = quantite;
            }
            
            previewValue.textContent = `${newStock} ${produit.unite}`;
            preview.classList.remove('hidden');
            
            if (newStock < 0) {
                previewValue.className = 'text-xl font-bold text-red-600';
            } else if (newStock <= produit.stock_minimum) {
                previewValue.className = 'text-xl font-bold text-orange-600';
            } else {
                previewValue.className = 'text-xl font-bold text-green-600';
            }
        };
        
        operationSelect.addEventListener('change', updatePreview);
        quantiteInput.addEventListener('input', updatePreview);
    },
    
    showStockReport() {
        if (!this.currentPeriod) {
            App.showNotification('Veuillez sélectionner une période', 'info');
            return;
        }
        
        // Calculate stock metrics
        const totalProducts = this.data.length;
        const totalValue = this.data.reduce((sum, p) => sum + (p.stock_actuel * p.prix_vente), 0);
        const lowStock = this.data.filter(p => p.stock_actuel > 0 && p.stock_actuel <= p.stock_minimum).length;
        const outOfStock = this.data.filter(p => p.stock_actuel === 0).length;
        
        // Group by category
        const byCategory = {};
        this.data.forEach(p => {
            if (!byCategory[p.categorie]) {
                byCategory[p.categorie] = {
                    count: 0,
                    value: 0,
                    lowStock: 0,
                    outOfStock: 0
                };
            }
            byCategory[p.categorie].count++;
            byCategory[p.categorie].value += p.stock_actuel * p.prix_vente;
            if (p.stock_actuel > 0 && p.stock_actuel <= p.stock_minimum) {
                byCategory[p.categorie].lowStock++;
            }
            if (p.stock_actuel === 0) {
                byCategory[p.categorie].outOfStock++;
            }
        });
        
        const periodLabel = PeriodFilter.getPeriodLabel(this.currentPeriod);
        
        const modalContent = `
            <div class="space-y-6">
                <div class="text-center">
                    <h3 class="text-xl font-bold text-gray-800">Rapport de stock</h3>
                    <p class="text-sm text-gray-600">${periodLabel}</p>
                </div>
                
                <!-- Summary -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="p-4 bg-purple-50 rounded-lg text-center">
                        <p class="text-2xl font-bold text-purple-600">${totalProducts}</p>
                        <p class="text-xs text-gray-600">Produits</p>
                    </div>
                    <div class="p-4 bg-green-50 rounded-lg text-center">
                        <p class="text-2xl font-bold text-green-600">${Utils.formatCurrency(totalValue)}</p>
                        <p class="text-xs text-gray-600">Valeur totale</p>
                    </div>
                    <div class="p-4 bg-orange-50 rounded-lg text-center">
                        <p class="text-2xl font-bold text-orange-600">${lowStock}</p>
                        <p class="text-xs text-gray-600">Stock faible</p>
                    </div>
                    <div class="p-4 bg-red-50 rounded-lg text-center">
                        <p class="text-2xl font-bold text-red-600">${outOfStock}</p>
                        <p class="text-xs text-gray-600">Ruptures</p>
                    </div>
                </div>
                
                <!-- By Category -->
                <div>
                    <h4 class="font-bold mb-3">Par catégorie</h4>
                    <div class="max-h-64 overflow-y-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-100 sticky top-0">
                                <tr>
                                    <th class="px-3 py-2 text-left">Catégorie</th>
                                    <th class="px-3 py-2 text-center">Produits</th>
                                    <th class="px-3 py-2 text-right">Valeur</th>
                                    <th class="px-3 py-2 text-center">Alertes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.keys(byCategory).map(cat => `
                                    <tr class="border-b">
                                        <td class="px-3 py-2 font-medium">${cat}</td>
                                        <td class="px-3 py-2 text-center">${byCategory[cat].count}</td>
                                        <td class="px-3 py-2 text-right">${Utils.formatCurrency(byCategory[cat].value)}</td>
                                        <td class="px-3 py-2 text-center">
                                            ${byCategory[cat].lowStock > 0 ? `<span class="text-orange-600">${byCategory[cat].lowStock} ⚠️</span>` : ''}
                                            ${byCategory[cat].outOfStock > 0 ? `<span class="text-red-600">${byCategory[cat].outOfStock} ❌</span>` : ''}
                                            ${byCategory[cat].lowStock === 0 && byCategory[cat].outOfStock === 0 ? '✓' : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button onclick="ProduitsV3.exportStockReport()" 
                            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-file-export mr-2"></i>Exporter CSV
                    </button>
                    <button onclick="ProduitsV3.printStockReport()" 
                            class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <i class="fas fa-print mr-2"></i>Imprimer
                    </button>
                </div>
            </div>
        `;
        
        Utils.createModal('Rapport de stock', modalContent, null, false);
    },
    
    exportStockReport() {
        const headers = ['Produit', 'Catégorie', 'Prix Vente', 'Stock', 'Unité', 'Valeur', 'Statut', 'Fournisseur'];
        const rows = this.data.map(p => {
            const value = p.stock_actuel * p.prix_vente;
            let status = 'En stock';
            if (p.stock_actuel === 0) status = 'Rupture';
            else if (p.stock_actuel <= p.stock_minimum) status = 'Stock faible';
            
            return [
                p.nom,
                p.categorie,
                p.prix_vente,
                p.stock_actuel,
                p.unite || '',
                value.toFixed(2),
                status,
                p.fournisseur || '-'
            ];
        });
        
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-stock-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        App.showNotification('Rapport exporté', 'success');
    },
    
    printStockReport() {
        window.print();
    },
    
    showLowStock() {
        const lowStockProducts = this.data.filter(p => 
            p.stock_actuel > 0 && p.stock_actuel <= p.stock_minimum
        );
        
        const outOfStockProducts = this.data.filter(p => p.stock_actuel === 0);
        
        if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
            App.showNotification('Aucun produit en stock faible ou rupture', 'success');
            return;
        }
        
        this.renderTable([...outOfStockProducts, ...lowStockProducts]);
    },
    
    showEditModal(productId) {
        const produit = this.data.find(p => p.id === productId);
        if (!produit) return;
        
        const categories = CategoriesManager.getActive();
        
        const modalContent = `
            <form id="produit-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input type="text" name="nom" value="${produit.nom}" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" rows="2" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${produit.description || ''}</textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                    <select name="categorie" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        ${categories.map(c => `<option value="${c.nom}" ${c.nom === produit.categorie ? 'selected' : ''}>${c.nom}</option>`).join('')}
                    </select>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix d'achat</label>
                        <input type="number" name="prix_achat" value="${produit.prix_achat || 0}" step="0.01" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix de vente *</label>
                        <input type="number" name="prix_vente" value="${produit.prix_vente}" required step="0.01" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Stock minimum</label>
                        <input type="number" name="stock_minimum" value="${produit.stock_minimum || 5}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                        <select name="unite" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Pièce" ${produit.unite === 'Pièce' ? 'selected' : ''}>Pièce</option>
                            <option value="Bouteille" ${produit.unite === 'Bouteille' ? 'selected' : ''}>Bouteille</option>
                            <option value="Tube" ${produit.unite === 'Tube' ? 'selected' : ''}>Tube</option>
                            <option value="Boîte" ${produit.unite === 'Boîte' ? 'selected' : ''}>Boîte</option>
                            <option value="Sachet" ${produit.unite === 'Sachet' ? 'selected' : ''}>Sachet</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <label class="flex items-center">
                            <input type="checkbox" name="actif" ${produit.actif ? 'checked' : ''} 
                                   class="mr-2">
                            <span class="text-sm">Actif</span>
                        </label>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                    <input type="text" name="fournisseur" value="${produit.fournisseur || ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea name="notes" rows="2" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${produit.notes || ''}</textarea>
                </div>
            </form>
        `;
        
        Utils.createModal('Modifier le produit', modalContent, async (modal) => {
            const form = modal.querySelector('#produit-form');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            try {
                App.showLoading();
                const formData = Utils.getFormData(form);
                
                const data = {
                    ...produit,
                    ...formData,
                    prix_achat: parseFloat(formData.prix_achat) || 0,
                    prix_vente: parseFloat(formData.prix_vente) || 0,
                    stock_minimum: parseFloat(formData.stock_minimum) || 5,
                    actif: formData.actif === 'on' || formData.actif === true
                };
                
                await Utils.update('produits', productId, data);
                await this.loadData();
                this.renderTable();
                this.updateStats();
                
                App.hideLoading();
                App.showNotification('Produit modifié avec succès', 'success');
                modal.remove();
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors de la modification', 'error');
                console.error(error);
            }
        });
    },
    
    async deleteProduit(productId) {
        const produit = this.data.find(p => p.id === productId);
        if (!produit) return;
        
        if (!confirm(`Supprimer le produit "${produit.nom}" ?`)) return;
        
        try {
            App.showLoading();
            await Utils.delete('produits', productId);
            await this.loadData();
            this.renderTable();
            this.updateStats();
            App.hideLoading();
            App.showNotification('Produit supprimé', 'success');
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de la suppression', 'error');
            console.error(error);
        }
    }
};
