// =========================================================================
// Services Management Module
// =========================================================================
const Services = {
    data: [],
    categories: [],

    // =========================================================================
    // Couleurs par défaut (si pas de couleur définie sur la catégorie)
    // =========================================================================
    defaultColors: [
        'from-purple-500 to-pink-500',
        'from-pink-500 to-red-500',
        'from-green-500 to-teal-500',
        'from-blue-500 to-indigo-500',
        'from-yellow-500 to-orange-500',
        'from-teal-500 to-cyan-500',
        'from-orange-500 to-red-500',
        'from-indigo-500 to-purple-500'
    ],

    // =========================================================================
    // render()
    // =========================================================================
    async render(container) {
        await this.loadCategories();
        await this.loadData();

        container.innerHTML = `
            <!-- HEADER -->
            <div class="mb-6 flex flex-wrap gap-3 justify-between items-center">
                <div class="flex gap-3 flex-wrap">
                    <!-- Recherche par nom -->
                    <div class="relative">
                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input 
                            type="text" 
                            id="search-service" 
                            placeholder="Rechercher un service..." 
                            class="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 w-64"
                        />
                    </div>
                    <!-- Filtre catégorie -->
                    <select id="filter-categorie" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="">Toutes les catégories</option>
                        ${this.categories.map(c => `
                            <option value="${c.nom}">${c.nom}</option>
                        `).join('')}
                    </select>
                    <!-- Filtre statut -->
                    <select id="filter-statut" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="">Tous les statuts</option>
                        <option value="actif">Actifs</option>
                        <option value="inactif">Inactifs</option>
                    </select>
                </div>

                <div class="flex gap-3">
                    <!-- Gérer les catégories -->
                    <button onclick="Services.showCategoriesManager()" 
                            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300">
                        <i class="fas fa-tags mr-2"></i>Catégories
                    </button>
                    <!-- Ajouter un service -->
                    <button onclick="Services.showAddModal()" 
                            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <i class="fas fa-plus mr-2"></i>Ajouter un service
                    </button>
                </div>
            </div>

            <!-- STATS RAPIDES -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" id="services-stats"></div>

            <!-- GRILLE SERVICES -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="services-grid"></div>
        `;

        this.renderStats();
        this.renderGrid();
        this.setupFilters();
    },

    // =========================================================================
    // loadData()
    // =========================================================================
    async loadData() {
        try {
            const response = await Utils.get('services');
            this.data = response.data || [];
        } catch (error) {
            console.error('Error loading services:', error);
            this.data = [];
        }
    },

    // =========================================================================
    // loadCategories()
    // =========================================================================
    async loadCategories() {
        try {
            const response = await Utils.get('categories_services');
            this.categories = response.data || [];
        } catch (error) {
            console.warn('⚠️ categories_services table not found, using defaults');
            // Fallback si la table n'existe pas encore
            this.categories = [
                { id: '1', nom: 'Coupe',      couleur: 'from-purple-500 to-pink-500' },
                { id: '2', nom: 'Coloration',  couleur: 'from-pink-500 to-red-500' },
                { id: '3', nom: 'Traitement',  couleur: 'from-green-500 to-teal-500' },
                { id: '4', nom: 'Tissage',     couleur: 'from-blue-500 to-indigo-500' },
                { id: '5', nom: 'Maquillage',  couleur: 'from-yellow-500 to-orange-500' },
                { id: '6', nom: 'Soins',       couleur: 'from-teal-500 to-cyan-500' }
            ];
        }
    },

    // =========================================================================
    // getCategoryColor()
    // =========================================================================
    getCategoryColor(categorieNom) {
        const cat = this.categories.find(c => c.nom === categorieNom);
        if (cat?.couleur) return cat.couleur;
        // Couleur auto basée sur le nom si pas définie
        const idx = categorieNom?.charCodeAt(0) % this.defaultColors.length || 0;
        return this.defaultColors[idx];
    },

    // =========================================================================
    // renderStats()
    // =========================================================================
    renderStats() {
        const statsEl = document.getElementById('services-stats');
        if (!statsEl) return;

        const total   = this.data.length;
        const actifs  = this.data.filter(s => s.actif).length;
        const nbCats  = this.categories.length;
        const prixMoy = total > 0
            ? (this.data.reduce((sum, s) => sum + s.prix, 0) / total).toFixed(0)
            : 0;

        statsEl.innerHTML = `
            ${[
                { label: 'Total services',   value: total,             icon: 'fa-briefcase',  color: 'purple' },
                { label: 'Services actifs',  value: actifs,            icon: 'fa-check-circle', color: 'green' },
                { label: 'Catégories',       value: nbCats,            icon: 'fa-tags',       color: 'blue'   },
                { label: 'Prix moyen',       value: Utils.formatCurrency(prixMoy), icon: 'fa-tag', color: 'orange' }
            ].map(s => `
                <div class="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-${s.color}-100 flex items-center justify-center">
                        <i class="fas ${s.icon} text-${s.color}-600"></i>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">${s.label}</p>
                        <p class="text-xl font-bold text-gray-800">${s.value}</p>
                    </div>
                </div>
            `).join('')}
        `;
    },

    // =========================================================================
    // renderGrid()
    // =========================================================================
    renderGrid(filteredData = null) {
        const dataToRender = filteredData !== null ? filteredData : this.data;
        const grid = document.getElementById('services-grid');
        if (!grid) return;

        if (dataToRender.length === 0) {
            grid.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <i class="fas fa-briefcase text-4xl text-gray-400 mb-2"></i>
                    <p class="text-gray-500">Aucun service trouvé</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = dataToRender.map(service => `
            <div class="card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div class="bg-gradient-to-r ${this.getCategoryColor(service.categorie)} h-28 flex items-center justify-center relative">
                    <i class="fas fa-cut text-white text-4xl opacity-80"></i>
                    <span class="absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-full bg-white/20 text-white">
                        ${service.categorie}
                    </span>
                </div>
                <div class="p-5">
                    <div class="flex items-start justify-between mb-2">
                        <h3 class="text-lg font-semibold text-gray-800">${service.nom}</h3>
                        ${service.actif
                            ? '<span class="badge bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Actif</span>'
                            : '<span class="badge bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">Inactif</span>'
                        }
                    </div>
                    <p class="text-sm text-gray-500 mb-4 line-clamp-2">${service.description || 'Aucune description'}</p>
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <p class="text-xs text-gray-400">Durée</p>
                            <p class="font-medium text-gray-700">
                                <i class="far fa-clock mr-1 text-gray-400"></i>${service.duree} min
                            </p>
                        </div>
                        <p class="text-2xl font-bold text-purple-600">${Utils.formatCurrency(service.prix)}</p>
                    </div>
                    <div class="flex items-center justify-end gap-2 pt-3 border-t">
                        <button onclick="Services.showEditModal('${service.id}')" 
                                class="flex items-center gap-1 text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button onclick="Services.deleteService('${service.id}')" 
                                class="flex items-center gap-1 text-sm px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // =========================================================================
    // setupFilters()
    // =========================================================================
    setupFilters() {
        const applyFilters = () => {
            const search    = document.getElementById('search-service')?.value.trim().toLowerCase() || '';
            const categorie = document.getElementById('filter-categorie')?.value || '';
            const statut    = document.getElementById('filter-statut')?.value || '';

            let filtered = this.data;

            if (search) {
                filtered = filtered.filter(s =>
                    s.nom.toLowerCase().includes(search) ||
                    (s.description || '').toLowerCase().includes(search)
                );
            }
            if (categorie) {
                filtered = filtered.filter(s => s.categorie === categorie);
            }
            if (statut === 'actif') {
                filtered = filtered.filter(s => s.actif);
            } else if (statut === 'inactif') {
                filtered = filtered.filter(s => !s.actif);
            }

            this.renderGrid(filtered);
        };

        document.getElementById('search-service')    ?.addEventListener('input',  applyFilters);
        document.getElementById('filter-categorie')  ?.addEventListener('change', applyFilters);
        document.getElementById('filter-statut')     ?.addEventListener('change', applyFilters);
    },

    // =========================================================================
    // _buildCategoryOptions()  — helper pour éviter la duplication
    // =========================================================================
    _buildCategoryOptions(selected = '') {
        return this.categories.map(c => `
            <option value="${c.nom}" ${c.nom === selected ? 'selected' : ''}>${c.nom}</option>
        `).join('');
    },

    // =========================================================================
    // showAddModal()
    // =========================================================================
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
                        <input type="number" name="prix" required step="0.01" min="0"
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
                            ${this._buildCategoryOptions()}
                        </select>
                    </div>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" name="actif" id="actif-add" checked
                           class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <label for="actif-add" class="ml-2 text-sm text-gray-700">Service actif</label>
                </div>
            </form>
        `;

        Utils.createModal('Ajouter un service', modalContent, async (modal) => {
            const form = modal.querySelector('#service-form');
            if (!form.checkValidity()) { form.reportValidity(); return; }

            try {
                App.showLoading();
                const formData = new FormData(form);
                await Utils.create('services', {
                    nom:         formData.get('nom'),
                    description: formData.get('description'),
                    prix:        parseFloat(formData.get('prix')),
                    duree:       parseInt(formData.get('duree')),
                    categorie:   formData.get('categorie'),
                    actif:       formData.get('actif') === 'on'
                });
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

    // =========================================================================
    // showEditModal()
    // =========================================================================
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
                        <input type="number" name="prix" required step="0.01" min="0" value="${service.prix}"
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
                            ${this._buildCategoryOptions(service.categorie)}
                        </select>
                    </div>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" name="actif" id="actif-edit" ${service.actif ? 'checked' : ''}
                           class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <label for="actif-edit" class="ml-2 text-sm text-gray-700">Service actif</label>
                </div>
            </form>
        `;

        Utils.createModal('Modifier le service', modalContent, async (modal) => {
            const form = modal.querySelector('#service-form');
            if (!form.checkValidity()) { form.reportValidity(); return; }

            try {
                App.showLoading();
                const formData = new FormData(form);
                await Utils.update('services', id, {
                    ...service,
                    nom:         formData.get('nom'),
                    description: formData.get('description'),
                    prix:        parseFloat(formData.get('prix')),
                    duree:       parseInt(formData.get('duree')),
                    categorie:   formData.get('categorie'),
                    actif:       formData.get('actif') === 'on'
                });
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

    // =========================================================================
    // deleteService()
    // =========================================================================
    async deleteService(id) {
        if (!Utils.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;

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
    },

    // =========================================================================
    // showCategoriesManager()
    // =========================================================================
    showCategoriesManager() {
        const buildList = () => {
            if (this.categories.length === 0) {
                return `<p class="text-center text-gray-400 py-4">Aucune catégorie</p>`;
            }
            return this.categories.map(cat => {
                const usedBy = this.data.filter(s => s.categorie === cat.nom).length;
                return `
                    <div class="flex items-center justify-between py-3 px-4 border border-gray-200 rounded-lg mb-2">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-r ${cat.couleur || this.defaultColors[0]}"></div>
                            <div>
                                <p class="font-medium text-gray-800">${cat.nom}</p>
                                <p class="text-xs text-gray-400">${usedBy} service(s) lié(s)</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="Services._editCategory('${cat.id}')"
                                    class="text-sm px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="Services._deleteCategory('${cat.id}', ${usedBy})"
                                    class="text-sm px-2 py-1 bg-red-50 text-red-500 rounded hover:bg-red-100
                                           ${usedBy > 0 ? 'opacity-50 cursor-not-allowed' : ''}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        };

        const modalContent = `
            <div class="space-y-4">
                <!-- Ajouter une catégorie -->
                <div class="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-300">
                    <p class="text-sm font-medium text-gray-600 mb-3">
                        <i class="fas fa-plus-circle mr-1 text-purple-500"></i>Nouvelle catégorie
                    </p>
                    <div class="flex gap-2">
                        <input type="text" id="new-cat-nom" placeholder="Nom de la catégorie"
                               class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
                        <select id="new-cat-couleur"
                                class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
                            <option value="from-purple-500 to-pink-500">Violet → Rose</option>
                            <option value="from-pink-500 to-red-500">Rose → Rouge</option>
                            <option value="from-green-500 to-teal-500">Vert → Teal</option>
                            <option value="from-blue-500 to-indigo-500">Bleu → Indigo</option>
                            <option value="from-yellow-500 to-orange-500">Jaune → Orange</option>
                            <option value="from-teal-500 to-cyan-500">Teal → Cyan</option>
                            <option value="from-orange-500 to-red-500">Orange → Rouge</option>
                            <option value="from-indigo-500 to-purple-500">Indigo → Violet</option>
                        </select>
                        <button onclick="Services._addCategory()"
                                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                            Ajouter
                        </button>
                    </div>
                </div>

                <!-- Liste des catégories -->
                <div id="categories-list">
                    ${buildList()}
                </div>
            </div>
        `;

        // Pas de bouton "Enregistrer", tout est en temps réel
        Utils.createModal('Gestion des catégories', modalContent, null, { hideConfirm: true });
    },

    // =========================================================================
    // _addCategory()
    // =========================================================================
    async _addCategory() {
        const nom     = document.getElementById('new-cat-nom')?.value.trim();
        const couleur = document.getElementById('new-cat-couleur')?.value || this.defaultColors[0];

        if (!nom) {
            App.showNotification('Le nom de la catégorie est requis', 'error');
            return;
        }
        if (this.categories.find(c => c.nom.toLowerCase() === nom.toLowerCase())) {
            App.showNotification('Cette catégorie existe déjà', 'error');
            return;
        }

        try {
            App.showLoading();
            await Utils.create('categories_services', { nom, couleur });
            await this.loadCategories();
            App.hideLoading();
            App.showNotification('Catégorie ajoutée');

            // Rafraîchir la liste dans le modal ouvert
            const list = document.getElementById('categories-list');
            if (list) {
                list.innerHTML = this.categories.map(cat => {
                    const usedBy = this.data.filter(s => s.categorie === cat.nom).length;
                    return `
                        <div class="flex items-center justify-between py-3 px-4 border border-gray-200 rounded-lg mb-2">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-gradient-to-r ${cat.couleur}"></div>
                                <div>
                                    <p class="font-medium text-gray-800">${cat.nom}</p>
                                    <p class="text-xs text-gray-400">${usedBy} service(s) lié(s)</p>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="Services._editCategory('${cat.id}')"
                                        class="text-sm px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="Services._deleteCategory('${cat.id}', ${usedBy})"
                                        class="text-sm px-2 py-1 bg-red-50 text-red-500 rounded hover:bg-red-100
                                               ${usedBy > 0 ? 'opacity-50 cursor-not-allowed' : ''}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
            document.getElementById('new-cat-nom').value = '';
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de l\'ajout de la catégorie', 'error');
            console.error(error);
        }
    },

    // =========================================================================
    // _editCategory()
    // =========================================================================
    async _editCategory(id) {
        const cat = this.categories.find(c => c.id === id);
        if (!cat) return;

        const modalContent = `
            <form id="edit-cat-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input type="text" name="nom" required value="${cat.nom}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                    <select name="couleur"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="from-purple-500 to-pink-500"  ${cat.couleur === 'from-purple-500 to-pink-500'  ? 'selected':''}>Violet → Rose</option>
                        <option value="from-pink-500 to-red-500"     ${cat.couleur === 'from-pink-500 to-red-500'     ? 'selected':''}>Rose → Rouge</option>
                        <option value="from-green-500 to-teal-500"   ${cat.couleur === 'from-green-500 to-teal-500'   ? 'selected':''}>Vert → Teal</option>
                        <option value="from-blue-500 to-indigo-500"  ${cat.couleur === 'from-blue-500 to-indigo-500'  ? 'selected':''}>Bleu → Indigo</option>
                        <option value="from-yellow-500 to-orange-500"${cat.couleur === 'from-yellow-500 to-orange-500'? 'selected':''}>Jaune → Orange</option>
                        <option value="from-teal-500 to-cyan-500"    ${cat.couleur === 'from-teal-500 to-cyan-500'    ? 'selected':''}>Teal → Cyan</option>
                        <option value="from-orange-500 to-red-500"   ${cat.couleur === 'from-orange-500 to-red-500'   ? 'selected':''}>Orange → Rouge</option>
                        <option value="from-indigo-500 to-purple-500"${cat.couleur === 'from-indigo-500 to-purple-500'? 'selected':''}>Indigo → Violet</option>
                    </select>
                </div>
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    <i class="fas fa-info-circle mr-1"></i>
                    Renommer la catégorie mettra automatiquement à jour tous les services liés.
                </div>
            </form>
        `;

        Utils.createModal('Modifier la catégorie', modalContent, async (modal) => {
            const form = modal.querySelector('#edit-cat-form');
            if (!form.checkValidity()) { form.reportValidity(); return; }

            try {
                App.showLoading();
                const formData = new FormData(form);
                const newNom   = formData.get('nom').trim();
                const couleur  = formData.get('couleur');

                // 1) Mise à jour de la catégorie
                await Utils.update('categories_services', id, { nom: newNom, couleur });

                // 2) Propager le nouveau nom sur tous les services liés à l'ancien nom
                if (newNom !== cat.nom) {
                    const servicesLies = this.data.filter(s => s.categorie === cat.nom);
                    await Promise.all(servicesLies.map(s =>
                        Utils.update('services', s.id, { ...s, categorie: newNom })
                    ));
                    console.log(`✅ ${servicesLies.length} service(s) mis à jour → catégorie: ${newNom}`);
                }

                await this.loadCategories();
                await this.loadData();
                App.hideLoading();
                App.showNotification('Catégorie modifiée avec succès');
                modal.remove();
                this.render(document.getElementById('content-area'));
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors de la modification', 'error');
                console.error(error);
            }
        });
    },

    // =========================================================================
    // _deleteCategory()
    // =========================================================================
    async _deleteCategory(id, usedBy) {
        if (usedBy > 0) {
            App.showNotification(
                `Impossible : ${usedBy} service(s) utilisent cette catégorie. Réaffectez-les d'abord.`,
                'error'
            );
            return;
        }

        if (!Utils.confirm('Supprimer cette catégorie ?')) return;

        try {
            App.showLoading();
            await Utils.delete('categories_services', id);
            await this.loadCategories();
            App.hideLoading();
            App.showNotification('Catégorie supprimée');
            // Fermer le gestionnaire et ré-ouvrir pour rafraîchir
            document.querySelector('.modal-overlay')?.remove();
            this.showCategoriesManager();
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de la suppression', 'error');
            console.error(error);
        }
    }
};