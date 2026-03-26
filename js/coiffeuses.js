// Coiffeuses Management Module
const Coiffeuses = {
    data: [],
    
    async render(container) {
        await this.loadData();
        
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <div>
                    <button onclick="Coiffeuses.showAddModal()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <i class="fas fa-plus mr-2"></i>Ajouter une coiffeuse
                    </button>
                </div>
                <div>
                    <input type="text" id="search-coiffeuses" placeholder="Rechercher..." 
                           class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="table-container">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coiffeuse</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spécialités</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="coiffeuses-table" class="divide-y divide-gray-200">
                            <!-- Data will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        this.renderTable();
        this.setupSearch();
    },
    
    async loadData() {
        try {
            const response = await Utils.get('coiffeuses');
            this.data = response.data || [];
        } catch (error) {
            console.error('Error loading coiffeuses:', error);
            this.data = [];
        }
    },
    
    renderTable(filteredData = null) {
        const dataToRender = filteredData || this.data;
        const tbody = document.getElementById('coiffeuses-table');
        
        if (!tbody) return;
        
        if (dataToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-user-tie text-4xl mb-2"></i>
                        <p>Aucune coiffeuse enregistrée</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = dataToRender.map(coiffeuse => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <img src="${coiffeuse.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(coiffeuse.nom) + '&background=9333ea&color=fff'}" 
                             class="w-10 h-10 rounded-full mr-3" alt="${coiffeuse.nom}">
                        <div>
                            <p class="font-medium text-gray-800">${coiffeuse.nom}</p>
                            <p class="text-sm text-gray-500">Depuis ${Utils.formatDate(coiffeuse.date_embauche)}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-800">${coiffeuse.telephone || '-'}</p>
                    <p class="text-sm text-gray-500">${coiffeuse.email || '-'}</p>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-1">
                        ${(coiffeuse.specialites || []).map(spec => 
                            `<span class="badge bg-purple-100 text-purple-800 text-xs">${spec}</span>`
                        ).join('')}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <p class="font-medium text-gray-800">${coiffeuse.taux_commission}%</p>
                </td>
                <td class="px-6 py-4">
                    ${Utils.getStatusBadge(coiffeuse.statut)}
                </td>
                <td class="px-6 py-4">
                    <button onclick="Coiffeuses.showEditModal('${coiffeuse.id}')" 
                            class="text-blue-600 hover:text-blue-800 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="Coiffeuses.deleteCoiffeuse('${coiffeuse.id}')" 
                            class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },
    
    setupSearch() {
        const searchInput = document.getElementById('search-coiffeuses');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = this.data.filter(c => 
                    c.nom.toLowerCase().includes(query) ||
                    (c.telephone && c.telephone.includes(query)) ||
                    (c.email && c.email.toLowerCase().includes(query))
                );
                this.renderTable(filtered);
            });
        }
    },
    
    showAddModal() {
        const modalContent = `
            <form id="coiffeuse-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                        <input type="text" name="nom" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                        <input type="tel" name="telephone" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Spécialités (séparer par virgule)</label>
                    <input type="text" name="specialites" placeholder="Coupe, Coloration, Coiffage..." 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Taux de commission (%) *</label>
                        <input type="number" name="taux_commission" value="25" min="15" max="40" step="1" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <p class="text-xs text-gray-500 mt-1">Recommandé: 15-40% selon ancienneté et performance</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select name="statut" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Actif">Actif</option>
                            <option value="Congé">Congé</option>
                            <option value="Inactif">Inactif</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date d'embauche</label>
                    <input type="date" name="date_embauche" 
                           value="${new Date().toISOString().split('T')[0]}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">URL Photo</label>
                    <input type="url" name="photo_url" placeholder="https://..." 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
            </form>
        `;
        
        Utils.createModal('Ajouter une coiffeuse', modalContent, async (modal) => {
            const form = modal.querySelector('#coiffeuse-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            try {
                App.showLoading();
                const formData = new FormData(form);
                const data = {
                    nom: formData.get('nom'),
                    telephone: formData.get('telephone'),
                    email: formData.get('email'),
                    specialites: formData.get('specialites').split(',').map(s => s.trim()).filter(s => s),
                    taux_commission: parseFloat(formData.get('taux_commission')) || 25,
                    statut: formData.get('statut'),
                    date_embauche: new Date(formData.get('date_embauche')).getTime(),
                    photo_url: formData.get('photo_url')
                };
                
                await Utils.create('coiffeuses', data);
                App.hideLoading();
                App.showNotification('Coiffeuse ajoutée avec succès');
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
        const coiffeuse = this.data.find(c => c.id === id);
        if (!coiffeuse) return;
        
        const modalContent = `
            <form id="coiffeuse-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                        <input type="text" name="nom" required value="${coiffeuse.nom}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                        <input type="tel" name="telephone" required value="${coiffeuse.telephone || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value="${coiffeuse.email || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Spécialités (séparer par virgule)</label>
                    <input type="text" name="specialites" value="${(coiffeuse.specialites || []).join(', ')}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Taux de commission (%) *</label>
                        <input type="number" name="taux_commission" value="${coiffeuse.taux_commission || 25}" min="15" max="40" step="1" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <p class="text-xs text-gray-500 mt-1">Recommandé: 15-40% selon ancienneté et performance</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select name="statut" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Actif" ${coiffeuse.statut === 'Actif' ? 'selected' : ''}>Actif</option>
                            <option value="Congé" ${coiffeuse.statut === 'Congé' ? 'selected' : ''}>Congé</option>
                            <option value="Inactif" ${coiffeuse.statut === 'Inactif' ? 'selected' : ''}>Inactif</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date d'embauche</label>
                    <input type="date" name="date_embauche" 
                           value="${new Date(coiffeuse.date_embauche).toISOString().split('T')[0]}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">URL Photo</label>
                    <input type="url" name="photo_url" value="${coiffeuse.photo_url || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
            </form>
        `;
        
        Utils.createModal('Modifier la coiffeuse', modalContent, async (modal) => {
            const form = modal.querySelector('#coiffeuse-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            try {
                App.showLoading();
                const formData = new FormData(form);
                const data = {
                    ...coiffeuse,
                    nom: formData.get('nom'),
                    telephone: formData.get('telephone'),
                    email: formData.get('email'),
                    specialites: formData.get('specialites').split(',').map(s => s.trim()).filter(s => s),
                    taux_commission: parseFloat(formData.get('taux_commission')) || 25,
                    statut: formData.get('statut'),
                    date_embauche: new Date(formData.get('date_embauche')).getTime(),
                    photo_url: formData.get('photo_url')
                };
                
                await Utils.update('coiffeuses', id, data);
                App.hideLoading();
                App.showNotification('Coiffeuse modifiée avec succès');
                modal.remove();
                this.render(document.getElementById('content-area'));
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors de la modification', 'error');
                console.error(error);
            }
        });
    },
    
    async deleteCoiffeuse(id) {
        if (!Utils.confirm('Êtes-vous sûr de vouloir supprimer cette coiffeuse ?')) {
            return;
        }
        
        try {
            App.showLoading();
            await Utils.delete('coiffeuses', id);
            App.hideLoading();
            App.showNotification('Coiffeuse supprimée avec succès');
            this.render(document.getElementById('content-area'));
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de la suppression', 'error');
            console.error(error);
        }
    }
};
