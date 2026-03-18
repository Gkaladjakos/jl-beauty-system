// Matériels Management Module
const Materiels = {
    data: [],
    
    async render(container) {
        await this.loadData();
        
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <button onclick="Materiels.showAddModal()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <i class="fas fa-plus mr-2"></i>Ajouter un matériel
                </button>
                <select id="filter-categorie" class="px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Toutes catégories</option>
                    <option value="Fauteuil">Fauteuil</option>
                    <option value="Séchoir">Séchoir</option>
                    <option value="Fer">Fer</option>
                    <option value="Tondeuse">Tondeuse</option>
                    <option value="Ciseaux">Ciseaux</option>
                    <option value="Miroir">Miroir</option>
                    <option value="Autre">Autre</option>
                </select>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="materiels-grid">
            </div>
        `;
        
        this.renderGrid();
        this.setupFilters();
    },
    
    async loadData() {
        try {
            const response = await Utils.get('materiels');
            this.data = response.data || [];
        } catch (error) {
            console.error('Error loading materiels:', error);
            this.data = [];
        }
    },
    
    renderGrid(filteredData = null) {
        const dataToRender = filteredData || this.data;
        const grid = document.getElementById('materiels-grid');
        
        if (!grid) return;
        
        if (dataToRender.length === 0) {
            grid.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <i class="fas fa-tools text-4xl text-gray-400 mb-2"></i>
                    <p class="text-gray-500">Aucun matériel enregistré</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = dataToRender.map(materiel => {
            const needsMaintenance = materiel.prochaine_maintenance && new Date(materiel.prochaine_maintenance) <= new Date();
            return `
                <div class="card bg-white rounded-lg shadow-md p-6 ${needsMaintenance ? 'border-2 border-orange-400' : ''}">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">${materiel.nom}</h3>
                            <p class="text-sm text-gray-600">${materiel.categorie}</p>
                        </div>
                        ${Utils.getStatusBadge(materiel.etat)}
                    </div>
                    
                    ${materiel.numero_serie ? `<p class="text-xs text-gray-500 mb-3">N° Série: ${materiel.numero_serie}</p>` : ''}
                    
                    <div class="space-y-2 mb-4">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Date d'achat:</span>
                            <span class="font-medium">${Utils.formatDate(materiel.date_achat)}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Prix:</span>
                            <span class="font-medium">${Utils.formatCurrency(materiel.prix_achat)}</span>
                        </div>
                        ${materiel.derniere_maintenance ? `
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Dernière maintenance:</span>
                            <span class="font-medium">${Utils.formatDate(materiel.derniere_maintenance)}</span>
                        </div>
                        ` : ''}
                        ${materiel.prochaine_maintenance ? `
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Prochaine maintenance:</span>
                            <span class="font-medium ${needsMaintenance ? 'text-orange-600' : ''}">${Utils.formatDate(materiel.prochaine_maintenance)}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${needsMaintenance ? '<p class="text-xs text-orange-600 mb-3"><i class="fas fa-exclamation-triangle"></i> Maintenance requise</p>' : ''}
                    
                    <div class="flex justify-end space-x-2 pt-3 border-t">
                        <button onclick="Materiels.showEditModal('${materiel.id}')" 
                                class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="Materiels.deleteMateriel('${materiel.id}')" 
                                class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    setupFilters() {
        const filterCategorie = document.getElementById('filter-categorie');
        if (filterCategorie) {
            filterCategorie.addEventListener('change', (e) => {
                const categorie = e.target.value;
                const filtered = categorie ? this.data.filter(m => m.categorie === categorie) : this.data;
                this.renderGrid(filtered);
            });
        }
    },
    
    showAddModal() {
        const modalContent = `
            <form id="materiel-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <input type="text" name="nom" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                        <select name="categorie" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="">Choisir...</option>
                            <option value="Fauteuil">Fauteuil</option>
                            <option value="Séchoir">Séchoir</option>
                            <option value="Fer">Fer</option>
                            <option value="Tondeuse">Tondeuse</option>
                            <option value="Ciseaux">Ciseaux</option>
                            <option value="Miroir">Miroir</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Numéro de série</label>
                        <input type="text" name="numero_serie" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix d'achat *</label>
                        <input type="number" name="prix_achat" required step="0.01"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date d'achat *</label>
                        <input type="date" name="date_achat" required 
                               value="${new Date().toISOString().split('T')[0]}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">État *</label>
                        <select name="etat" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Excellent">Excellent</option>
                            <option value="Bon">Bon</option>
                            <option value="Moyen">Moyen</option>
                            <option value="Défectueux">Défectueux</option>
                            <option value="Hors service">Hors service</option>
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Dernière maintenance</label>
                        <input type="date" name="derniere_maintenance" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prochaine maintenance</label>
                        <input type="date" name="prochaine_maintenance" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea name="notes" rows="3" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                </div>
            </form>
        `;
        
        Utils.createModal('Ajouter un matériel', modalContent, async (modal) => {
            const form = modal.querySelector('#materiel-form');
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
                    categorie: formData.get('categorie'),
                    numero_serie: formData.get('numero_serie'),
                    date_achat: new Date(formData.get('date_achat')).getTime(),
                    prix_achat: parseFloat(formData.get('prix_achat')),
                    etat: formData.get('etat'),
                    derniere_maintenance: formData.get('derniere_maintenance') ? new Date(formData.get('derniere_maintenance')).getTime() : null,
                    prochaine_maintenance: formData.get('prochaine_maintenance') ? new Date(formData.get('prochaine_maintenance')).getTime() : null,
                    notes: formData.get('notes')
                };
                
                await Utils.create('materiels', data);
                App.hideLoading();
                App.showNotification('Matériel ajouté avec succès');
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
        const materiel = this.data.find(m => m.id === id);
        if (!materiel) return;
        
        const modalContent = `
            <form id="materiel-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <input type="text" name="nom" required value="${materiel.nom}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                        <select name="categorie" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Fauteuil" ${materiel.categorie === 'Fauteuil' ? 'selected' : ''}>Fauteuil</option>
                            <option value="Séchoir" ${materiel.categorie === 'Séchoir' ? 'selected' : ''}>Séchoir</option>
                            <option value="Fer" ${materiel.categorie === 'Fer' ? 'selected' : ''}>Fer</option>
                            <option value="Tondeuse" ${materiel.categorie === 'Tondeuse' ? 'selected' : ''}>Tondeuse</option>
                            <option value="Ciseaux" ${materiel.categorie === 'Ciseaux' ? 'selected' : ''}>Ciseaux</option>
                            <option value="Miroir" ${materiel.categorie === 'Miroir' ? 'selected' : ''}>Miroir</option>
                            <option value="Autre" ${materiel.categorie === 'Autre' ? 'selected' : ''}>Autre</option>
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Numéro de série</label>
                        <input type="text" name="numero_serie" value="${materiel.numero_serie || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix d'achat *</label>
                        <input type="number" name="prix_achat" required step="0.01" value="${materiel.prix_achat}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date d'achat *</label>
                        <input type="date" name="date_achat" required 
                               value="${new Date(materiel.date_achat).toISOString().split('T')[0]}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">État *</label>
                        <select name="etat" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Excellent" ${materiel.etat === 'Excellent' ? 'selected' : ''}>Excellent</option>
                            <option value="Bon" ${materiel.etat === 'Bon' ? 'selected' : ''}>Bon</option>
                            <option value="Moyen" ${materiel.etat === 'Moyen' ? 'selected' : ''}>Moyen</option>
                            <option value="Défectueux" ${materiel.etat === 'Défectueux' ? 'selected' : ''}>Défectueux</option>
                            <option value="Hors service" ${materiel.etat === 'Hors service' ? 'selected' : ''}>Hors service</option>
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Dernière maintenance</label>
                        <input type="date" name="derniere_maintenance" 
                               value="${materiel.derniere_maintenance ? new Date(materiel.derniere_maintenance).toISOString().split('T')[0] : ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prochaine maintenance</label>
                        <input type="date" name="prochaine_maintenance" 
                               value="${materiel.prochaine_maintenance ? new Date(materiel.prochaine_maintenance).toISOString().split('T')[0] : ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea name="notes" rows="3" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${materiel.notes || ''}</textarea>
                </div>
            </form>
        `;
        
        Utils.createModal('Modifier le matériel', modalContent, async (modal) => {
            const form = modal.querySelector('#materiel-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            try {
                App.showLoading();
                const formData = new FormData(form);
                const data = {
                    ...materiel,
                    nom: formData.get('nom'),
                    categorie: formData.get('categorie'),
                    numero_serie: formData.get('numero_serie'),
                    date_achat: new Date(formData.get('date_achat')).getTime(),
                    prix_achat: parseFloat(formData.get('prix_achat')),
                    etat: formData.get('etat'),
                    derniere_maintenance: formData.get('derniere_maintenance') ? new Date(formData.get('derniere_maintenance')).getTime() : null,
                    prochaine_maintenance: formData.get('prochaine_maintenance') ? new Date(formData.get('prochaine_maintenance')).getTime() : null,
                    notes: formData.get('notes')
                };
                
                await Utils.update('materiels', id, data);
                App.hideLoading();
                App.showNotification('Matériel modifié avec succès');
                modal.remove();
                this.render(document.getElementById('content-area'));
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors de la modification', 'error');
                console.error(error);
            }
        });
    },
    
    async deleteMateriel(id) {
        if (!Utils.confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) {
            return;
        }
        
        try {
            App.showLoading();
            await Utils.delete('materiels', id);
            App.hideLoading();
            App.showNotification('Matériel supprimé avec succès');
            this.render(document.getElementById('content-area'));
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de la suppression', 'error');
            console.error(error);
        }
    }
};
