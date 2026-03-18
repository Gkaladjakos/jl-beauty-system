// Services Management Module
const Services = {
    data: [],
    
    async render(container) {
        await this.loadData();
        
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <button onclick="Services.showAddModal()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <i class="fas fa-plus mr-2"></i>Ajouter un service
                </button>
                <select id="filter-categorie" class="px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Toutes les catégories</option>
                    <option value="Coupe">Coupe</option>
                    <option value="Coloration">Coloration</option>
                    <option value="Traitement">Traitement</option>
                    <option value="Coiffage">Coiffage</option>
                    <option value="Maquillage">Maquillage</option>
                    <option value="Soins">Soins</option>
                </select>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="services-grid">
                <!-- Services cards will be loaded here -->
            </div>
        `;
        
        this.renderGrid();
        this.setupFilters();
    },
    
    async loadData() {
        try {
            const response = await Utils.get('services');
            this.data = response.data || [];
        } catch (error) {
            console.error('Error loading services:', error);
            this.data = [];
        }
    },
    
    renderGrid(filteredData = null) {
        const dataToRender = filteredData || this.data;
        const grid = document.getElementById('services-grid');
        
        if (!grid) return;
        
        if (dataToRender.length === 0) {
            grid.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <i class="fas fa-briefcase text-4xl text-gray-400 mb-2"></i>
                    <p class="text-gray-500">Aucun service disponible</p>
                </div>
            `;
            return;
        }
        
        const categoryColors = {
            'Coupe': 'from-purple-500 to-pink-500',
            'Coloration': 'from-pink-500 to-red-500',
            'Traitement': 'from-green-500 to-teal-500',
            'Coiffage': 'from-blue-500 to-indigo-500',
            'Maquillage': 'from-yellow-500 to-orange-500',
            'Soins': 'from-teal-500 to-cyan-500'
        };
        
        grid.innerHTML = dataToRender.map(service => `
            <div class="card bg-white rounded-lg shadow-md overflow-hidden">
                <div class="bg-gradient-to-r ${categoryColors[service.categorie] || 'from-gray-500 to-gray-600'} h-32 flex items-center justify-center">
                    <i class="fas fa-cut text-white text-4xl"></i>
                </div>
                <div class="p-6">
                    <div class="flex items-start justify-between mb-2">
                        <h3 class="text-lg font-semibold text-gray-800">${service.nom}</h3>
                        ${service.actif ? 
                            '<span class="badge bg-green-100 text-green-800 text-xs">Actif</span>' : 
                            '<span class="badge bg-gray-100 text-gray-800 text-xs">Inactif</span>'
                        }
                    </div>
                    <p class="text-sm text-gray-600 mb-4">${service.description || 'Aucune description'}</p>
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <p class="text-sm text-gray-500">Catégorie</p>
                            <p class="font-medium text-gray-800">${service.categorie}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-500">Durée</p>
                            <p class="font-medium text-gray-800">${service.duree} min</p>
                        </div>
                    </div>
                    <div class="flex items-center justify-between pt-4 border-t">
                        <p class="text-2xl font-bold text-purple-600">${Utils.formatCurrency(service.prix)}</p>
                        <div class="space-x-2">
                            <button onclick="Services.showEditModal('${service.id}')" 
                                    class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="Services.deleteService('${service.id}')" 
                                    class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    setupFilters() {
        const filterCategorie = document.getElementById('filter-categorie');
        if (filterCategorie) {
            filterCategorie.addEventListener('change', (e) => {
                const categorie = e.target.value;
                const filtered = categorie ? this.data.filter(s => s.categorie === categorie) : this.data;
                this.renderGrid(filtered);
            });
        }
    },
    
    showAddModal() {
        const modalContent = `
            <form id="service-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nom du service *</label>
                    <input type="text" name="nom" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" rows="3" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix *</label>
                        <input type="number" name="prix" required step="0.01"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Durée (min) *</label>
                        <input type="number" name="duree" required min="5" step="5"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                        <select name="categorie" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="">Choisir...</option>
                            <option value="Coupe">Coupe</option>
                            <option value="Coloration">Coloration</option>
                            <option value="Traitement">Traitement</option>
                            <option value="Coiffage">Coiffage</option>
                            <option value="Maquillage">Maquillage</option>
                            <option value="Soins">Soins</option>
                        </select>
                    </div>
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" name="actif" id="actif" checked
                           class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <label for="actif" class="ml-2 text-sm text-gray-700">Service actif</label>
                </div>
            </form>
        `;
        
        Utils.createModal('Ajouter un service', modalContent, async (modal) => {
            const form = modal.querySelector('#service-form');
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
                    prix: parseFloat(formData.get('prix')),
                    duree: parseInt(formData.get('duree')),
                    categorie: formData.get('categorie'),
                    actif: formData.get('actif') === 'on'
                };
                
                await Utils.create('services', data);
                App.hideLoading();
                App.showNotification('Service ajouté avec succès');
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
        const service = this.data.find(s => s.id === id);
        if (!service) return;
        
        const modalContent = `
            <form id="service-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nom du service *</label>
                    <input type="text" name="nom" required value="${service.nom}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" rows="3" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${service.description || ''}</textarea>
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prix *</label>
                        <input type="number" name="prix" required step="0.01" value="${service.prix}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Durée (min) *</label>
                        <input type="number" name="duree" required min="5" step="5" value="${service.duree}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                        <select name="categorie" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Coupe" ${service.categorie === 'Coupe' ? 'selected' : ''}>Coupe</option>
                            <option value="Coloration" ${service.categorie === 'Coloration' ? 'selected' : ''}>Coloration</option>
                            <option value="Traitement" ${service.categorie === 'Traitement' ? 'selected' : ''}>Traitement</option>
                            <option value="Coiffage" ${service.categorie === 'Coiffage' ? 'selected' : ''}>Coiffage</option>
                            <option value="Maquillage" ${service.categorie === 'Maquillage' ? 'selected' : ''}>Maquillage</option>
                            <option value="Soins" ${service.categorie === 'Soins' ? 'selected' : ''}>Soins</option>
                        </select>
                    </div>
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" name="actif" id="actif" ${service.actif ? 'checked' : ''}
                           class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <label for="actif" class="ml-2 text-sm text-gray-700">Service actif</label>
                </div>
            </form>
        `;
        
        Utils.createModal('Modifier le service', modalContent, async (modal) => {
            const form = modal.querySelector('#service-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            try {
                App.showLoading();
                const formData = new FormData(form);
                const data = {
                    ...service,
                    nom: formData.get('nom'),
                    description: formData.get('description'),
                    prix: parseFloat(formData.get('prix')),
                    duree: parseInt(formData.get('duree')),
                    categorie: formData.get('categorie'),
                    actif: formData.get('actif') === 'on'
                };
                
                await Utils.update('services', id, data);
                App.hideLoading();
                App.showNotification('Service modifié avec succès');
                modal.remove();
                this.render(document.getElementById('content-area'));
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors de la modification', 'error');
                console.error(error);
            }
        });
    },
    
    async deleteService(id) {
        if (!Utils.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
            return;
        }
        
        try {
            App.showLoading();
            await Utils.delete('services', id);
            App.hideLoading();
            App.showNotification('Service supprimé avec succès');
            this.render(document.getElementById('content-area'));
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de la suppression', 'error');
            console.error(error);
        }
    }
};
