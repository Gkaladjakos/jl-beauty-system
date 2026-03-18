// Produits Management Module
const Produits = {
    data: [],
    
    async render(container) {
        await this.loadData();
        
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <button onclick="Produits.showAddModal()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <i class="fas fa-plus mr-2"></i>Ajouter un produit
                </button>
                <div class="flex space-x-3">
                    <select id="filter-categorie" class="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Toutes catégories</option>
                        <option value="Shampoing">Shampoing</option>
                        <option value="Après-shampoing">Après-shampoing</option>
                        <option value="Masque">Masque</option>
                        <option value="Coloration">Coloration</option>
                        <option value="Styling">Styling</option>
                        <option value="Soins">Soins</option>
                        <option value="Accessoires">Accessoires</option>
                    </select>
                    <button onclick="Produits.showLowStock()" class="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                        <i class="fas fa-exclamation-triangle mr-2"></i>Stock faible
                    </button>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="table-container">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
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
        
        this.renderTable();
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
            const isLowStock = produit.stock_actuel <= produit.stock_minimum;
            return `
            <tr class="hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}">
                <td class="px-6 py-4">
                    <p class="font-medium text-gray-800">${produit.nom}</p>
                    ${produit.description ? `<p class="text-sm text-gray-500">${produit.description.substring(0, 40)}...</p>` : ''}
                </td>
                <td class="px-6 py-4">
                    <span class="badge bg-blue-100 text-blue-800">${produit.categorie}</span>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-600">Achat: ${Utils.formatCurrency(produit.prix_achat)}</p>
                    <p class="font-medium text-gray-800">Vente: ${Utils.formatCurrency(produit.prix_vente)}</p>
                </td>
                <td class="px-6 py-4">
                    <p class="font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}">${produit.stock_actuel}</p>
                    <p class="text-xs text-gray-500">Min: ${produit.stock_minimum}</p>
                    ${isLowStock ? '<p class="text-xs text-red-600"><i class="fas fa-exclamation-triangle"></i> Stock bas</p>' : ''}
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-800">${produit.fournisseur || '-'}</p>
                </td>
                <td class="px-6 py-4">
                    ${produit.actif ? 
                        '<span class="badge bg-green-100 text-green-800">Actif</span>' : 
                        '<span class="badge bg-gray-100 text-gray-800">Inactif</span>'
                    }
                </td>
                <td class="px-6 py-4">
                    <button onclick="Produits.showEditModal('${produit.id}')" 
                            class="text-blue-600 hover:text-blue-800 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="Produits.deleteProduit('${produit.id}')" 
                            class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `}).join('');
    },
    
    setupFilters() {
        const filterCategorie = document.getElementById('filter-categorie');
        if (filterCategorie) {
            filterCategorie.addEventListener('change', (e) => {
                const categorie = e.target.value;
                const filtered = categorie ? this.data.filter(p => p.categorie === categorie) : this.data;
                this.renderTable(filtered);
            });
        }
    },
    
    showLowStock() {
        const lowStock = this.data.filter(p => p.stock_actuel <= p.stock_minimum);
        this.renderTable(lowStock);
    },
    
    showAddModal() {
        const modalContent = `
            <form id="produit-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
                    <input type="text" name="nom" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" rows="2" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                        <select name="categorie" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="">Choisir...</option>
                            <option value="Shampoing">Shampoing</option>
                            <option value="Après-shampoing">Après-shampoing</option>
                            <option value="Masque">Masque</option>
                            <option value="Coloration">Coloration</option>
                            <option value="Styling">Styling</option>
                            <option value="Soins">Soins</option>
                            <option value="Accessoires">Accessoires</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                        <input type="text" name="fournisseur" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix d'achat *</label>
                        <input type="number" name="prix_achat" required step="0.01"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix de vente *</label>
                        <input type="number" name="prix_vente" required step="0.01"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Stock actuel *</label>
                        <input type="number" name="stock_actuel" required min="0" value="0"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Stock minimum *</label>
                        <input type="number" name="stock_minimum" required min="0" value="5"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" name="actif" id="actif" checked
                           class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <label for="actif" class="ml-2 text-sm text-gray-700">Produit actif</label>
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
                const formData = new FormData(form);
                const data = {
                    id: Utils.generateId(),
                    nom: formData.get('nom'),
                    description: formData.get('description'),
                    categorie: formData.get('categorie'),
                    prix_achat: parseFloat(formData.get('prix_achat')),
                    prix_vente: parseFloat(formData.get('prix_vente')),
                    stock_actuel: parseInt(formData.get('stock_actuel')),
                    stock_minimum: parseInt(formData.get('stock_minimum')),
                    fournisseur: formData.get('fournisseur'),
                    actif: formData.get('actif') === 'on'
                };
                
                await Utils.create('produits', data);
                App.hideLoading();
                App.showNotification('Produit ajouté avec succès');
                modal.remove();
                this.render(document.getElementById('content-area'));
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors de l\'ajout', 'error');
                console.error(error);
            }
        });
    },
    
    async showEditModal(id) {
        const produit = this.data.find(p => p.id === id);
        if (!produit) return;
        
        const modalContent = `
            <form id="produit-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
                    <input type="text" name="nom" required value="${produit.nom}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" rows="2" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${produit.description || ''}</textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                        <select name="categorie" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Shampoing" ${produit.categorie === 'Shampoing' ? 'selected' : ''}>Shampoing</option>
                            <option value="Après-shampoing" ${produit.categorie === 'Après-shampoing' ? 'selected' : ''}>Après-shampoing</option>
                            <option value="Masque" ${produit.categorie === 'Masque' ? 'selected' : ''}>Masque</option>
                            <option value="Coloration" ${produit.categorie === 'Coloration' ? 'selected' : ''}>Coloration</option>
                            <option value="Styling" ${produit.categorie === 'Styling' ? 'selected' : ''}>Styling</option>
                            <option value="Soins" ${produit.categorie === 'Soins' ? 'selected' : ''}>Soins</option>
                            <option value="Accessoires" ${produit.categorie === 'Accessoires' ? 'selected' : ''}>Accessoires</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                        <input type="text" name="fournisseur" value="${produit.fournisseur || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix d'achat *</label>
                        <input type="number" name="prix_achat" required step="0.01" value="${produit.prix_achat}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix de vente *</label>
                        <input type="number" name="prix_vente" required step="0.01" value="${produit.prix_vente}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Stock actuel *</label>
                        <input type="number" name="stock_actuel" required min="0" value="${produit.stock_actuel}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Stock minimum *</label>
                        <input type="number" name="stock_minimum" required min="0" value="${produit.stock_minimum}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" name="actif" id="actif" ${produit.actif ? 'checked' : ''}
                           class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <label for="actif" class="ml-2 text-sm text-gray-700">Produit actif</label>
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
                const formData = new FormData(form);
                const data = {
                    ...produit,
                    nom: formData.get('nom'),
                    description: formData.get('description'),
                    categorie: formData.get('categorie'),
                    prix_achat: parseFloat(formData.get('prix_achat')),
                    prix_vente: parseFloat(formData.get('prix_vente')),
                    stock_actuel: parseInt(formData.get('stock_actuel')),
                    stock_minimum: parseInt(formData.get('stock_minimum')),
                    fournisseur: formData.get('fournisseur'),
                    actif: formData.get('actif') === 'on'
                };
                
                await Utils.update('produits', id, data);
                App.hideLoading();
                App.showNotification('Produit modifié avec succès');
                modal.remove();
                this.render(document.getElementById('content-area'));
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors de la modification', 'error');
                console.error(error);
            }
        });
    },
    
    async deleteProduit(id) {
        if (!Utils.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
            return;
        }
        
        try {
            App.showLoading();
            await Utils.delete('produits', id);
            App.hideLoading();
            App.showNotification('Produit supprimé avec succès');
            this.render(document.getElementById('content-area'));
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de la suppression', 'error');
            console.error(error);
        }
    }
};
