// Consommables Module - Stock Management for Salon Consumables
const Consommables = {
    data: [],
    consommations: [],
    coiffeuses: [],
    
    async render(container) {
        await this.loadAllData();
        
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <div class="flex space-x-3">
                    <button onclick="Consommables.showAddModal()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <i class="fas fa-plus mr-2"></i>Ajouter un consommable
                    </button>
                    <button onclick="Consommables.showConsommationModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-minus-circle mr-2"></i>Enregistrer une consommation
                    </button>
                </div>
                <div class="flex space-x-3">
                    <select id="filter-categorie" class="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Toutes les catégories</option>
                        <option value="Soins capillaires">Soins capillaires</option>
                        <option value="Coloration">Coloration</option>
                        <option value="Mèches">Mèches</option>
                        <option value="Produits d'hygiène">Produits d'hygiène</option>
                        <option value="Vitamines & Compléments">Vitamines & Compléments</option>
                        <option value="Outils jetables">Outils jetables</option>
                        <option value="Autres">Autres</option>
                    </select>
                    <select id="filter-stock" class="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Tous les stocks</option>
                        <option value="low">Stock faible</option>
                        <option value="normal">Stock normal</option>
                    </select>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Total consommables</p>
                    <p id="total-consommables" class="text-2xl font-bold text-purple-600 mt-2">0</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Alertes de stock</p>
                    <p id="alertes-stock" class="text-2xl font-bold text-red-600 mt-2">0</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Valeur totale du stock</p>
                    <p id="valeur-stock" class="text-2xl font-bold text-green-600 mt-2">$0.00</p>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="table-container">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unité</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix d'achat</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fournisseur</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="consommables-table" class="divide-y divide-gray-200">
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
            const [consommablesData, consommationsData, coiffeusesData] = await Promise.all([
                Utils.get('consommables'),
                Utils.get('consommations'),
                Utils.get('coiffeuses')
            ]);
            
            this.data = consommablesData.data || [];
            this.consommations = consommationsData.data || [];
            this.coiffeuses = coiffeusesData.data || [];
        } catch (error) {
            console.error('Error loading data:', error);
        }
    },
    
    updateStats() {
        const total = this.data.filter(c => c.actif).length;
        const alertes = this.data.filter(c => c.actif && c.stock_actuel <= c.stock_minimum).length;
        const valeur = this.data
            .filter(c => c.actif)
            .reduce((sum, c) => sum + (c.stock_actuel * c.prix_achat), 0);
        
        document.getElementById('total-consommables').textContent = total;
        document.getElementById('alertes-stock').textContent = alertes;
        document.getElementById('valeur-stock').textContent = Utils.formatCurrency(valeur);
    },
    
    renderTable(filteredData = null) {
        const dataToRender = (filteredData || this.data).sort((a, b) => a.nom.localeCompare(b.nom));
        const tbody = document.getElementById('consommables-table');
        
        if (!tbody) return;
        
        if (dataToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-box-open text-4xl mb-2"></i>
                        <p>Aucun consommable enregistré</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = dataToRender.map(consommable => {
            const isLowStock = consommable.stock_actuel <= consommable.stock_minimum;
            const stockBadge = isLowStock 
                ? '<span class="badge bg-red-100 text-red-800"><i class="fas fa-exclamation-triangle mr-1"></i>Stock faible</span>'
                : '<span class="badge bg-green-100 text-green-800"><i class="fas fa-check mr-1"></i>Stock normal</span>';
            
            const categorieBadge = {
                'Soins capillaires': 'bg-blue-100 text-blue-800',
                'Coloration': 'bg-purple-100 text-purple-800',
                'Mèches': 'bg-pink-100 text-pink-800',
                'Produits d\'hygiène': 'bg-green-100 text-green-800',
                'Vitamines & Compléments': 'bg-yellow-100 text-yellow-800',
                'Outils jetables': 'bg-gray-100 text-gray-800',
                'Autres': 'bg-gray-100 text-gray-800'
            }[consommable.categorie] || 'bg-gray-100 text-gray-800';
            
            return `
            <tr class="hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}">
                <td class="px-6 py-4">
                    <p class="text-sm font-medium text-gray-800">${consommable.nom}</p>
                    ${consommable.description ? `<p class="text-xs text-gray-500">${consommable.description}</p>` : ''}
                </td>
                <td class="px-6 py-4">
                    <span class="badge ${categorieBadge}">${consommable.categorie}</span>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-800'}">
                        ${consommable.stock_actuel}
                        ${consommable.stock_minimum ? `<span class="text-xs text-gray-500">/ min ${consommable.stock_minimum}</span>` : ''}
                    </p>
                </td>
                <td class="px-6 py-4">
                    <span class="text-sm text-gray-600">${consommable.unite}</span>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-800">${Utils.formatCurrency(consommable.prix_achat)}</p>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-600">${consommable.fournisseur || '-'}</p>
                </td>
                <td class="px-6 py-4">
                    ${stockBadge}
                </td>
                <td class="px-6 py-4">
                    <div class="flex space-x-2">
                        <button onclick="Consommables.showReapprovisionnerModal('${consommable.id}')" 
                                class="text-green-600 hover:text-green-800" title="Réapprovisionner">
                            <i class="fas fa-plus-circle"></i>
                        </button>
                        <button onclick="Consommables.showHistoriqueModal('${consommable.id}')" 
                                class="text-blue-600 hover:text-blue-800" title="Historique">
                            <i class="fas fa-history"></i>
                        </button>
                        <button onclick="Consommables.showEditModal('${consommable.id}')" 
                                class="text-purple-600 hover:text-purple-800" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="Consommables.deleteConsommable('${consommable.id}')" 
                                class="text-red-600 hover:text-red-800" title="Supprimer">
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
        const filterStock = document.getElementById('filter-stock');
        
        const applyFilters = () => {
            const categorie = filterCategorie?.value || '';
            const stock = filterStock?.value || '';
            
            const filtered = this.data.filter(c => {
                const matchesCategorie = !categorie || c.categorie === categorie;
                let matchesStock = true;
                
                if (stock === 'low') {
                    matchesStock = c.stock_actuel <= c.stock_minimum;
                } else if (stock === 'normal') {
                    matchesStock = c.stock_actuel > c.stock_minimum;
                }
                
                return matchesCategorie && matchesStock && c.actif;
            });
            
            this.renderTable(filtered);
        };
        
        if (filterCategorie) filterCategorie.addEventListener('change', applyFilters);
        if (filterStock) filterStock.addEventListener('change', applyFilters);
    },
    
    showAddModal() {
        const modalContent = `
            <form id="consommable-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom du consommable *</label>
                        <input type="text" name="nom" required
                               placeholder="Ex: Shampoing doux, Mèches brésiliennes..."
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" rows="2"
                                  placeholder="Détails supplémentaires..."
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                        <select name="categorie" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="">Sélectionner</option>
                            <option value="Soins capillaires">Soins capillaires</option>
                            <option value="Coloration">Coloration</option>
                            <option value="Mèches">Mèches</option>
                            <option value="Produits d'hygiène">Produits d'hygiène</option>
                            <option value="Vitamines & Compléments">Vitamines & Compléments</option>
                            <option value="Outils jetables">Outils jetables</option>
                            <option value="Autres">Autres</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Unité de mesure *</label>
                        <select name="unite" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Pièce">Pièce</option>
                            <option value="Litre">Litre</option>
                            <option value="Millilitre">Millilitre</option>
                            <option value="Kilogramme">Kilogramme</option>
                            <option value="Gramme">Gramme</option>
                            <option value="Paquet">Paquet</option>
                            <option value="Boîte">Boîte</option>
                            <option value="Flacon">Flacon</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Stock actuel *</label>
                        <input type="number" name="stock_actuel" required min="0" step="0.01" value="0"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Stock minimum *</label>
                        <input type="number" name="stock_minimum" required min="0" step="0.01" value="5"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <p class="text-xs text-gray-500 mt-1">Seuil d'alerte de stock faible</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix d'achat * (USD)</label>
                        <input type="number" name="prix_achat" required step="0.01"
                               placeholder="0.00"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                        <input type="text" name="fournisseur"
                               placeholder="Nom du fournisseur"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
            </form>
        `;
        
        Utils.createModal('Ajouter un consommable', modalContent, async (modal) => {
            await this.saveConsommable(modal);
        });
    },
    
    async saveConsommable(modal) {
        const form = modal.querySelector('#consommable-form');
        const formData = Utils.getFormData(form);
        
        console.log('[Consommables] Form data:', formData);
        
        if (!formData.nom || !formData.categorie || !formData.unite || !formData.prix_achat) {
            App.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }
        
        try {
            App.showLoading();
            
            const consommableData = {
                id: Utils.generateId(),
                nom: formData.nom,
                description: formData.description || '',
                categorie: formData.categorie,
                unite: formData.unite,
                stock_actuel: parseFloat(formData.stock_actuel) || 0,
                stock_minimum: parseFloat(formData.stock_minimum) || 5,
                prix_achat: parseFloat(formData.prix_achat),
                fournisseur: formData.fournisseur || '',
                date_dernier_achat: Date.now(),
                actif: true
            };
            
            console.log('[Consommables] Saving data:', consommableData);
            await Utils.create('consommables', consommableData);
            console.log('[Consommables] Save completed');
            
            App.hideLoading();
            App.showNotification('Consommable ajouté avec succès');
            modal.remove();
            this.render(document.getElementById('content-area'));
            
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de l\'ajout', 'error');
            console.error('[Consommables] Save error:', error);
        }
    },
    
    async showEditModal(id) {
        const consommable = this.data.find(c => c.id === id);
        if (!consommable) return;
        
        const modalContent = `
            <form id="consommable-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom du consommable *</label>
                        <input type="text" name="nom" required value="${consommable.nom}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" rows="2"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${consommable.description || ''}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                        <select name="categorie" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Soins capillaires" ${consommable.categorie === 'Soins capillaires' ? 'selected' : ''}>Soins capillaires</option>
                            <option value="Coloration" ${consommable.categorie === 'Coloration' ? 'selected' : ''}>Coloration</option>
                            <option value="Mèches" ${consommable.categorie === 'Mèches' ? 'selected' : ''}>Mèches</option>
                            <option value="Produits d'hygiène" ${consommable.categorie === 'Produits d\'hygiène' ? 'selected' : ''}>Produits d'hygiène</option>
                            <option value="Vitamines & Compléments" ${consommable.categorie === 'Vitamines & Compléments' ? 'selected' : ''}>Vitamines & Compléments</option>
                            <option value="Outils jetables" ${consommable.categorie === 'Outils jetables' ? 'selected' : ''}>Outils jetables</option>
                            <option value="Autres" ${consommable.categorie === 'Autres' ? 'selected' : ''}>Autres</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Unité de mesure *</label>
                        <select name="unite" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Pièce" ${consommable.unite === 'Pièce' ? 'selected' : ''}>Pièce</option>
                            <option value="Litre" ${consommable.unite === 'Litre' ? 'selected' : ''}>Litre</option>
                            <option value="Millilitre" ${consommable.unite === 'Millilitre' ? 'selected' : ''}>Millilitre</option>
                            <option value="Kilogramme" ${consommable.unite === 'Kilogramme' ? 'selected' : ''}>Kilogramme</option>
                            <option value="Gramme" ${consommable.unite === 'Gramme' ? 'selected' : ''}>Gramme</option>
                            <option value="Paquet" ${consommable.unite === 'Paquet' ? 'selected' : ''}>Paquet</option>
                            <option value="Boîte" ${consommable.unite === 'Boîte' ? 'selected' : ''}>Boîte</option>
                            <option value="Flacon" ${consommable.unite === 'Flacon' ? 'selected' : ''}>Flacon</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Stock actuel *</label>
                        <input type="number" name="stock_actuel" required min="0" step="0.01" value="${consommable.stock_actuel}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Stock minimum *</label>
                        <input type="number" name="stock_minimum" required min="0" step="0.01" value="${consommable.stock_minimum}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix d'achat * (USD)</label>
                        <input type="number" name="prix_achat" required step="0.01" value="${consommable.prix_achat}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                        <input type="text" name="fournisseur" value="${consommable.fournisseur || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
            </form>
        `;
        
        Utils.createModal('Modifier le consommable', modalContent, async (modal) => {
            const form = modal.querySelector('#consommable-form');
            const formData = Utils.getFormData(form);
            
            try {
                App.showLoading();
                
                const updatedData = {
                    ...consommable,
                    nom: formData.nom,
                    description: formData.description || '',
                    categorie: formData.categorie,
                    unite: formData.unite,
                    stock_actuel: parseFloat(formData.stock_actuel),
                    stock_minimum: parseFloat(formData.stock_minimum),
                    prix_achat: parseFloat(formData.prix_achat),
                    fournisseur: formData.fournisseur || ''
                };
                
                await Utils.update('consommables', id, updatedData);
                
                App.hideLoading();
                App.showNotification('Consommable modifié avec succès');
                modal.remove();
                this.render(document.getElementById('content-area'));
                
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors de la modification', 'error');
                console.error(error);
            }
        });
    },
    
    async deleteConsommable(id) {
        const consommable = this.data.find(c => c.id === id);
        if (!consommable) return;
        
        const confirm = Utils.confirm(`Êtes-vous sûr de vouloir supprimer "${consommable.nom}" ?`);
        if (!confirm) return;
        
        try {
            App.showLoading();
            await Utils.delete('consommables', id);
            App.hideLoading();
            App.showNotification('Consommable supprimé avec succès');
            this.render(document.getElementById('content-area'));
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de la suppression', 'error');
            console.error(error);
        }
    },
    
    showReapprovisionnerModal(id) {
        const consommable = this.data.find(c => c.id === id);
        if (!consommable) return;
        
        const modalContent = `
            <form id="reappro-form" class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <p class="text-sm text-gray-600">Consommable</p>
                    <p class="font-medium text-lg">${consommable.nom}</p>
                    <p class="text-sm text-gray-600 mt-2">Stock actuel : <span class="font-medium">${consommable.stock_actuel} ${consommable.unite}</span></p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Quantité à ajouter *</label>
                    <input type="number" name="quantite" required min="0.01" step="0.01"
                           placeholder="Quantité à réapprovisionner"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Prix d'achat unitaire (USD)</label>
                    <input type="number" name="prix_achat" step="0.01" value="${consommable.prix_achat}"
                           placeholder="Laisser vide pour garder le prix actuel"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                    <input type="text" name="fournisseur" value="${consommable.fournisseur || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea name="notes" rows="2"
                              placeholder="Commentaires éventuels..."
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                </div>
            </form>
        `;
        
        Utils.createModal('Réapprovisionner', modalContent, async (modal) => {
            const form = modal.querySelector('#reappro-form');
            const formData = Utils.getFormData(form);
            
            const quantite = parseFloat(formData.quantite);
            if (!quantite || quantite <= 0) {
                App.showNotification('Veuillez entrer une quantité valide', 'error');
                return;
            }
            
            try {
                App.showLoading();
                
                const newStock = consommable.stock_actuel + quantite;
                const newPrix = formData.prix_achat ? parseFloat(formData.prix_achat) : consommable.prix_achat;
                
                await Utils.update('consommables', id, {
                    ...consommable,
                    stock_actuel: newStock,
                    prix_achat: newPrix,
                    fournisseur: formData.fournisseur || consommable.fournisseur,
                    date_dernier_achat: Date.now()
                });
                
                // Log as a consumption with positive quantity (restock)
                await Utils.create('consommations', {
                    id: Utils.generateId(),
                    consommable_id: id,
                    consommable_nom: consommable.nom,
                    quantite: quantite, // Positive for restock
                    unite: consommable.unite,
                    coiffeuse_id: null,
                    coiffeuse_nom: 'Réapprovisionnement',
                    service_nom: null,
                    client_nom: null,
                    date_consommation: Date.now(),
                    notes: formData.notes || `Réapprovisionnement (+${quantite} ${consommable.unite})`
                });
                
                App.hideLoading();
                App.showNotification(`Stock mis à jour : ${newStock} ${consommable.unite}`);
                modal.remove();
                this.render(document.getElementById('content-area'));
                
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors du réapprovisionnement', 'error');
                console.error(error);
            }
        });
    },
    
    showConsommationModal() {
        const modalContent = `
            <form id="consommation-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Consommable *</label>
                    <select name="consommable_id" required id="consommable-select"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="">Sélectionner un consommable</option>
                        ${this.data.filter(c => c.actif).map(c => 
                            `<option value="${c.id}" data-nom="${c.nom}" data-unite="${c.unite}" data-stock="${c.stock_actuel}">${c.nom} (Stock: ${c.stock_actuel} ${c.unite})</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Quantité utilisée *</label>
                    <input type="number" name="quantite" required min="0.01" step="0.01" id="quantite-consommee"
                           placeholder="Quantité consommée"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <p class="text-xs text-gray-500 mt-1">Unité: <span id="unite-display">-</span> | Stock disponible: <span id="stock-display">-</span></p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Coiffeuse *</label>
                    <select name="coiffeuse_id" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="">Sélectionner une coiffeuse</option>
                        ${this.coiffeuses.filter(c => c.statut === 'Actif').map(c => 
                            `<option value="${c.id}" data-nom="${c.nom}">${c.nom}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Service (facultatif)</label>
                    <input type="text" name="service_nom"
                           placeholder="Ex: Coloration, Tresse, etc."
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Client (facultatif)</label>
                    <input type="text" name="client_nom"
                           placeholder="Nom du client"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea name="notes" rows="2"
                              placeholder="Commentaires éventuels..."
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                </div>
            </form>
        `;
        
        Utils.createModal('Enregistrer une consommation', modalContent, async (modal) => {
            await this.saveConsommation(modal);
        });
        
        // Update display when consommable is selected
        setTimeout(() => {
            const select = document.getElementById('consommable-select');
            if (select) {
                select.addEventListener('change', (e) => {
                    const option = e.target.options[e.target.selectedIndex];
                    document.getElementById('unite-display').textContent = option.dataset.unite || '-';
                    document.getElementById('stock-display').textContent = option.dataset.stock ? `${option.dataset.stock} ${option.dataset.unite}` : '-';
                });
            }
        }, 100);
    },
    
    async saveConsommation(modal) {
        const form = modal.querySelector('#consommation-form');
        const formData = Utils.getFormData(form);
        
        const consommableId = formData.consommable_id;
        const quantite = parseFloat(formData.quantite);
        const coiffeuseId = formData.coiffeuse_id;
        
        if (!consommableId || !quantite || !coiffeuseId) {
            App.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }
        
        const consommable = this.data.find(c => c.id === consommableId);
        if (!consommable) {
            App.showNotification('Consommable introuvable', 'error');
            return;
        }
        
        if (quantite > consommable.stock_actuel) {
            App.showNotification(`Stock insuffisant ! Disponible: ${consommable.stock_actuel} ${consommable.unite}`, 'error');
            return;
        }
        
        const coiffeuse = this.coiffeuses.find(c => c.id === coiffeuseId);
        
        try {
            App.showLoading();
            
            // Update stock
            const newStock = consommable.stock_actuel - quantite;
            await Utils.update('consommables', consommableId, {
                ...consommable,
                stock_actuel: newStock
            });
            
            // Create consumption record
            await Utils.create('consommations', {
                id: Utils.generateId(),
                consommable_id: consommableId,
                consommable_nom: consommable.nom,
                quantite: -quantite, // Negative for consumption
                unite: consommable.unite,
                coiffeuse_id: coiffeuseId,
                coiffeuse_nom: coiffeuse.nom,
                service_nom: formData.service_nom || null,
                client_nom: formData.client_nom || null,
                date_consommation: Date.now(),
                notes: formData.notes || ''
            });
            
            App.hideLoading();
            App.showNotification(`Consommation enregistrée. Nouveau stock: ${newStock} ${consommable.unite}`);
            modal.remove();
            this.render(document.getElementById('content-area'));
            
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de l\'enregistrement', 'error');
            console.error(error);
        }
    },
    
    showHistoriqueModal(id) {
        const consommable = this.data.find(c => c.id === id);
        if (!consommable) return;
        
        const historique = this.consommations
            .filter(c => c.consommable_id === id)
            .sort((a, b) => b.date_consommation - a.date_consommation);
        
        const historiqueHtml = historique.length > 0 ? historique.map(h => `
            <div class="flex justify-between items-start p-3 bg-gray-50 rounded">
                <div class="flex-1">
                    <p class="text-sm font-medium ${h.quantite < 0 ? 'text-red-600' : 'text-green-600'}">
                        ${h.quantite > 0 ? '+' : ''}${h.quantite} ${h.unite}
                    </p>
                    <p class="text-xs text-gray-600 mt-1">${h.coiffeuse_nom || 'N/A'}</p>
                    ${h.service_nom ? `<p class="text-xs text-gray-500">Service: ${h.service_nom}</p>` : ''}
                    ${h.client_nom ? `<p class="text-xs text-gray-500">Client: ${h.client_nom}</p>` : ''}
                    ${h.notes ? `<p class="text-xs text-gray-500 italic mt-1">${h.notes}</p>` : ''}
                </div>
                <div class="text-right">
                    <p class="text-xs text-gray-500">${Utils.formatDate(h.date_consommation)}</p>
                    <p class="text-xs text-gray-400">${Utils.formatTime(h.date_consommation)}</p>
                </div>
            </div>
        `).join('') : '<p class="text-center text-gray-500 py-4">Aucun historique</p>';
        
        const modalContent = `
            <div class="space-y-4">
                <div class="bg-purple-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600">Consommable</p>
                    <p class="font-medium text-lg">${consommable.nom}</p>
                    <p class="text-sm text-gray-600 mt-2">Stock actuel : <span class="font-medium text-purple-600">${consommable.stock_actuel} ${consommable.unite}</span></p>
                </div>
                
                <div>
                    <h4 class="font-medium text-gray-700 mb-3">
                        <i class="fas fa-history mr-2"></i>Historique des mouvements
                    </h4>
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        ${historiqueHtml}
                    </div>
                </div>
            </div>
        `;
        
        Utils.createModal(`Historique - ${consommable.nom}`, modalContent, null);
    }
};
