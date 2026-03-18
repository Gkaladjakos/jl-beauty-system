// Clients Management Module
const Clients = {
    data: [],
    
    async render(container) {
        await this.loadData();
        
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <div>
                    <button onclick="Clients.showAddModal()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <i class="fas fa-plus mr-2"></i>Ajouter un client
                    </button>
                </div>
                <div class="flex space-x-3">
                    <select id="filter-statut" class="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Tous les statuts</option>
                        <option value="Actif">Actif</option>
                        <option value="VIP">VIP</option>
                        <option value="Inactif">Inactif</option>
                    </select>
                    <input type="text" id="search-clients" placeholder="Rechercher..." 
                           class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="table-container">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fidélité</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inscription</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="clients-table" class="divide-y divide-gray-200">
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
            const response = await Utils.get('clients');
            this.data = response.data || [];
        } catch (error) {
            console.error('Error loading clients:', error);
            this.data = [];
        }
    },
    
    renderTable(filteredData = null) {
        const dataToRender = filteredData || this.data;
        const tbody = document.getElementById('clients-table');
        
        if (!tbody) return;
        
        if (dataToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-users text-4xl mb-2"></i>
                        <p>Aucun client enregistré</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = dataToRender.map(client => {
            // Display name or "Client +phone"
            const displayName = client.nom && client.nom.trim() !== '' 
                ? client.nom 
                : `Client ${client.telephone}`;
            
            return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=ec4899&color=fff" 
                             class="w-10 h-10 rounded-full mr-3" alt="${displayName}">
                        <div>
                            <p class="font-medium text-gray-800">${displayName}</p>
                            ${client.preferences ? `<p class="text-xs text-gray-500">${client.preferences.substring(0, 30)}...</p>` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-800"><i class="fas fa-phone text-gray-400 mr-1"></i>${client.telephone || '-'}</p>
                    ${client.email ? `<p class="text-sm text-gray-500"><i class="fas fa-envelope text-gray-400 mr-1"></i>${client.email}</p>` : ''}
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <i class="fas fa-star text-yellow-500 mr-2"></i>
                        <span class="font-medium text-gray-800">${client.points_fidelite || 0} points</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    ${Utils.getStatusBadge(client.statut)}
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-800">${Utils.formatDate(client.date_inscription)}</p>
                </td>
                <td class="px-6 py-4">
                    <button onclick="Clients.showDetailModal('${client.id}')" 
                            class="text-purple-600 hover:text-purple-800 mr-3" title="Voir détails">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="Clients.showEditModal('${client.id}')" 
                            class="text-blue-600 hover:text-blue-800 mr-3" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="Clients.deleteClient('${client.id}')" 
                            class="text-red-600 hover:text-red-800" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    },
    
    setupSearch() {
        const searchInput = document.getElementById('search-clients');
        const filterStatut = document.getElementById('filter-statut');
        
        const applyFilters = () => {
            const query = searchInput?.value.toLowerCase() || '';
            const statut = filterStatut?.value || '';
            
            const filtered = this.data.filter(c => {
                const displayName = c.nom && c.nom.trim() !== '' ? c.nom : `Client ${c.telephone}`;
                const matchesSearch = !query || 
                    displayName.toLowerCase().includes(query) ||
                    (c.telephone && c.telephone.includes(query)) ||
                    (c.email && c.email.toLowerCase().includes(query));
                
                const matchesStatut = !statut || c.statut === statut;
                
                return matchesSearch && matchesStatut;
            });
            
            this.renderTable(filtered);
        };
        
        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (filterStatut) filterStatut.addEventListener('change', applyFilters);
    },
    
    showAddModal() {
        const modalContent = `
            <form id="client-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Nom complet <span class="text-gray-500 text-xs">(facultatif)</span>
                        </label>
                        <input type="text" name="nom" 
                               placeholder="Laissez vide pour afficher uniquement le téléphone"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                        <input type="tel" name="telephone" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                        <input type="date" name="date_naissance" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input type="text" name="adresse" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Préférences et notes</label>
                    <textarea name="preferences" rows="3" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Points de fidélité</label>
                        <input type="number" name="points_fidelite" value="0" min="0" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select name="statut" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Actif">Actif</option>
                            <option value="VIP">VIP</option>
                            <option value="Inactif">Inactif</option>
                        </select>
                    </div>
                </div>
            </form>
        `;
        
        Utils.createModal('Ajouter un client', modalContent, async (modal) => {
            const form = modal.querySelector('#client-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            try {
                App.showLoading();
                const formData = new FormData(form);
                const data = {
                    id: Utils.generateId(),
                    nom: formData.get('nom') || '', // Empty if not provided
                    telephone: formData.get('telephone'),
                    email: formData.get('email') || '',
                    date_naissance: formData.get('date_naissance') ? new Date(formData.get('date_naissance')).getTime() : null,
                    adresse: formData.get('adresse') || '',
                    preferences: formData.get('preferences') || '',
                    points_fidelite: parseInt(formData.get('points_fidelite')) || 0,
                    statut: formData.get('statut'),
                    date_inscription: Date.now()
                };
                
                await Utils.create('clients', data);
                App.hideLoading();
                App.showNotification('Client ajouté avec succès');
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
        const client = this.data.find(c => c.id === id);
        if (!client) return;
        
        const modalContent = `
            <form id="client-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Nom complet <span class="text-gray-500 text-xs">(facultatif)</span>
                        </label>
                        <input type="text" name="nom" value="${client.nom || ''}"
                               placeholder="Laissez vide pour afficher uniquement le téléphone"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                        <input type="tel" name="telephone" required value="${client.telephone || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" value="${client.email || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                        <input type="date" name="date_naissance" 
                               value="${client.date_naissance ? new Date(client.date_naissance).toISOString().split('T')[0] : ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input type="text" name="adresse" value="${client.adresse || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Préférences et notes</label>
                    <textarea name="preferences" rows="3" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${client.preferences || ''}</textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Points de fidélité</label>
                        <input type="number" name="points_fidelite" value="${client.points_fidelite || 0}" min="0" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select name="statut" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Actif" ${client.statut === 'Actif' ? 'selected' : ''}>Actif</option>
                            <option value="VIP" ${client.statut === 'VIP' ? 'selected' : ''}>VIP</option>
                            <option value="Inactif" ${client.statut === 'Inactif' ? 'selected' : ''}>Inactif</option>
                        </select>
                    </div>
                </div>
            </form>
        `;
        
        Utils.createModal('Modifier le client', modalContent, async (modal) => {
            const form = modal.querySelector('#client-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            try {
                App.showLoading();
                const formData = new FormData(form);
                const data = {
                    ...client,
                    nom: formData.get('nom'),
                    telephone: formData.get('telephone'),
                    email: formData.get('email'),
                    date_naissance: formData.get('date_naissance') ? new Date(formData.get('date_naissance')).getTime() : null,
                    adresse: formData.get('adresse'),
                    preferences: formData.get('preferences'),
                    points_fidelite: parseInt(formData.get('points_fidelite')) || 0,
                    statut: formData.get('statut')
                };
                
                await Utils.update('clients', id, data);
                App.hideLoading();
                App.showNotification('Client modifié avec succès');
                modal.remove();
                this.render(document.getElementById('content-area'));
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors de la modification', 'error');
                console.error(error);
            }
        });
    },
    
    async showDetailModal(id) {
        const client = this.data.find(c => c.id === id);
        if (!client) return;
        
        // Display name or "Client +phone"
        const displayName = client.nom && client.nom.trim() !== '' 
            ? client.nom 
            : `Client ${client.telephone}`;
        
        // Load client's appointments history
        let rdvHistory = '';
        try {
            const rdvData = await Utils.get('rendez_vous');
            const clientRdv = rdvData.data ? rdvData.data.filter(r => r.client_id === id) : [];
            
            if (clientRdv.length > 0) {
                rdvHistory = clientRdv.map(rdv => `
                    <div class="flex justify-between items-center py-2 border-b">
                        <div>
                            <p class="text-sm font-medium">${rdv.service_nom}</p>
                            <p class="text-xs text-gray-500">${Utils.formatDateTime(rdv.date_rdv)} - ${rdv.coiffeuse_nom}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-medium">${Utils.formatCurrency(rdv.prix)}</p>
                            ${Utils.getStatusBadge(rdv.statut)}
                        </div>
                    </div>
                `).join('');
            } else {
                rdvHistory = '<p class="text-gray-500 text-sm">Aucun historique</p>';
            }
        } catch (error) {
            rdvHistory = '<p class="text-red-500 text-sm">Erreur de chargement</p>';
        }
        
        const modalContent = `
            <div class="space-y-6">
                <div class="flex items-center space-x-4">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=ec4899&color=fff&size=80" 
                         class="w-20 h-20 rounded-full" alt="${displayName}">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${displayName}</h3>
                        ${Utils.getStatusBadge(client.statut)}
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-600">Téléphone</p>
                        <p class="font-medium">${client.telephone || '-'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Email</p>
                        <p class="font-medium">${client.email || '-'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Date de naissance</p>
                        <p class="font-medium">${client.date_naissance ? Utils.formatDate(client.date_naissance) : '-'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Points de fidélité</p>
                        <p class="font-medium text-yellow-600"><i class="fas fa-star"></i> ${client.points_fidelite || 0} points</p>
                    </div>
                </div>
                
                <div>
                    <p class="text-sm text-gray-600">Adresse</p>
                    <p class="font-medium">${client.adresse || '-'}</p>
                </div>
                
                ${client.preferences ? `
                <div>
                    <p class="text-sm text-gray-600">Préférences</p>
                    <p class="font-medium">${client.preferences}</p>
                </div>
                ` : ''}
                
                <div>
                    <p class="text-sm text-gray-600 mb-2">Date d'inscription</p>
                    <p class="font-medium">${Utils.formatDate(client.date_inscription)}</p>
                </div>
                
                <div class="border-t pt-4">
                    <h4 class="font-semibold text-gray-800 mb-3">Historique des rendez-vous</h4>
                    <div class="max-h-60 overflow-y-auto">
                        ${rdvHistory}
                    </div>
                </div>
            </div>
        `;
        
        const modal = Utils.createModal('Détails du client', modalContent, null);
        // Hide save button for detail modal
        modal.querySelector('.save-modal').style.display = 'none';
    },
    
    async deleteClient(id) {
        if (!Utils.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
            return;
        }
        
        try {
            App.showLoading();
            await Utils.delete('clients', id);
            App.hideLoading();
            App.showNotification('Client supprimé avec succès');
            this.render(document.getElementById('content-area'));
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de la suppression', 'error');
            console.error(error);
        }
    }
};
