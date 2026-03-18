// Categories Manager for Products Module
const CategoriesManager = {
    categories: [],
    
    /**
     * Load categories from localStorage or use defaults
     */
    load() {
        const stored = localStorage.getItem('product_categories');
        if (stored) {
            try {
                this.categories = JSON.parse(stored);
            } catch (e) {
                this.categories = this.getDefaultCategories();
            }
        } else {
            this.categories = this.getDefaultCategories();
            this.save();
        }
        return this.categories;
    },
    
    /**
     * Save categories to localStorage
     */
    save() {
        localStorage.setItem('product_categories', JSON.stringify(this.categories));
    },
    
    /**
     * Get default categories
     */
    getDefaultCategories() {
        return [
            { id: 'cat-1', nom: 'Soins capillaires', actif: true },
            { id: 'cat-2', nom: 'Coloration', actif: true },
            { id: 'cat-3', nom: 'Mèches', actif: true },
            { id: 'cat-4', nom: 'Coiffage', actif: true },
            { id: 'cat-5', nom: 'Accessoires', actif: true },
            { id: 'cat-6', nom: 'Produits de beauté', actif: true }
        ];
    },
    
    /**
     * Get all categories
     */
    getAll() {
        return this.load();
    },
    
    /**
     * Get active categories
     */
    getActive() {
        return this.load().filter(c => c.actif);
    },
    
    /**
     * Get category by ID
     */
    getById(id) {
        return this.load().find(c => c.id === id);
    },
    
    /**
     * Add new category
     */
    add(nom) {
        if (!nom || nom.trim() === '') {
            throw new Error('Le nom de la catégorie est requis');
        }
        
        // Check for duplicates
        const exists = this.categories.find(c => 
            c.nom.toLowerCase() === nom.trim().toLowerCase()
        );
        
        if (exists) {
            throw new Error('Cette catégorie existe déjà');
        }
        
        const newCategory = {
            id: 'cat-' + Date.now(),
            nom: nom.trim(),
            actif: true
        };
        
        this.categories.push(newCategory);
        this.save();
        
        return newCategory;
    },
    
    /**
     * Update category
     */
    update(id, nom) {
        if (!nom || nom.trim() === '') {
            throw new Error('Le nom de la catégorie est requis');
        }
        
        const category = this.categories.find(c => c.id === id);
        if (!category) {
            throw new Error('Catégorie introuvable');
        }
        
        // Check for duplicates (excluding current)
        const exists = this.categories.find(c => 
            c.id !== id && 
            c.nom.toLowerCase() === nom.trim().toLowerCase()
        );
        
        if (exists) {
            throw new Error('Une catégorie avec ce nom existe déjà');
        }
        
        category.nom = nom.trim();
        this.save();
        
        return category;
    },
    
    /**
     * Delete category
     */
    delete(id) {
        const index = this.categories.findIndex(c => c.id === id);
        if (index === -1) {
            throw new Error('Catégorie introuvable');
        }
        
        this.categories.splice(index, 1);
        this.save();
    },
    
    /**
     * Toggle category active status
     */
    toggleActive(id) {
        const category = this.categories.find(c => c.id === id);
        if (!category) {
            throw new Error('Catégorie introuvable');
        }
        
        category.actif = !category.actif;
        this.save();
        
        return category;
    },
    
    /**
     * Show categories management modal
     */
    showModal(onSave = null) {
        const categories = this.getAll();
        
        const modalContent = `
            <div class="space-y-4">
                <!-- Add new category -->
                <div class="flex space-x-2">
                    <input type="text" id="new-category-input" 
                           placeholder="Nom de la nouvelle catégorie" 
                           class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <button onclick="CategoriesManager.addFromModal()" 
                            class="px-4 py-2 bg-gradient-to-r from-yellow-500 to-black text-white rounded-lg hover:shadow-lg">
                        <i class="fas fa-plus mr-1"></i>Ajouter
                    </button>
                </div>
                
                <!-- Categories list -->
                <div class="border rounded-lg max-h-96 overflow-y-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 sticky top-0">
                            <tr>
                                <th class="px-4 py-2 text-left text-sm font-medium text-gray-600">Catégorie</th>
                                <th class="px-4 py-2 text-center text-sm font-medium text-gray-600">Statut</th>
                                <th class="px-4 py-2 text-center text-sm font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="categories-list" class="divide-y">
                            ${categories.map(cat => `
                                <tr>
                                    <td class="px-4 py-3">
                                        <input type="text" value="${cat.nom}" 
                                               id="cat-name-${cat.id}" 
                                               class="w-full px-2 py-1 border border-gray-300 rounded" 
                                               disabled>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <span class="px-2 py-1 text-xs rounded-full ${cat.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                            ${cat.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <div class="flex justify-center space-x-2">
                                            <button onclick="CategoriesManager.editCategory('${cat.id}')" 
                                                    class="text-blue-600 hover:text-blue-800" 
                                                    title="Modifier">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="CategoriesManager.toggleActiveFromModal('${cat.id}')" 
                                                    class="text-${cat.actif ? 'orange' : 'green'}-600 hover:text-${cat.actif ? 'orange' : 'green'}-800" 
                                                    title="${cat.actif ? 'Désactiver' : 'Activer'}">
                                                <i class="fas fa-${cat.actif ? 'eye-slash' : 'eye'}"></i>
                                            </button>
                                            <button onclick="CategoriesManager.deleteFromModal('${cat.id}')" 
                                                    class="text-red-600 hover:text-red-800" 
                                                    title="Supprimer">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        this.currentModal = Utils.createModal('Gestion des catégories', modalContent, () => {
            if (onSave) onSave();
        }, false);
    },
    
    /**
     * Add category from modal
     */
    addFromModal() {
        const input = document.getElementById('new-category-input');
        if (!input) return;
        
        const nom = input.value.trim();
        if (!nom) {
            App.showNotification('Veuillez entrer un nom de catégorie', 'error');
            return;
        }
        
        try {
            this.add(nom);
            input.value = '';
            this.refreshModalList();
            App.showNotification('Catégorie ajoutée', 'success');
        } catch (error) {
            App.showNotification(error.message, 'error');
        }
    },
    
    /**
     * Edit category name
     */
    editCategory(id) {
        const input = document.getElementById(`cat-name-${id}`);
        if (!input) return;
        
        if (input.disabled) {
            // Enable editing
            input.disabled = false;
            input.focus();
            input.select();
            
            // Save on Enter or blur
            const saveEdit = () => {
                try {
                    this.update(id, input.value);
                    input.disabled = true;
                    this.refreshModalList();
                    App.showNotification('Catégorie modifiée', 'success');
                } catch (error) {
                    App.showNotification(error.message, 'error');
                    input.focus();
                }
            };
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') saveEdit();
            });
            
            input.addEventListener('blur', saveEdit, { once: true });
        }
    },
    
    /**
     * Toggle category active status from modal
     */
    toggleActiveFromModal(id) {
        try {
            this.toggleActive(id);
            this.refreshModalList();
            App.showNotification('Statut modifié', 'success');
        } catch (error) {
            App.showNotification(error.message, 'error');
        }
    },
    
    /**
     * Delete category from modal
     */
    deleteFromModal(id) {
        const category = this.getById(id);
        if (!category) return;
        
        if (!confirm(`Supprimer la catégorie "${category.nom}" ?`)) return;
        
        try {
            this.delete(id);
            this.refreshModalList();
            App.showNotification('Catégorie supprimée', 'success');
        } catch (error) {
            App.showNotification(error.message, 'error');
        }
    },
    
    /**
     * Refresh the modal categories list
     */
    refreshModalList() {
        const tbody = document.getElementById('categories-list');
        if (!tbody) return;
        
        const categories = this.getAll();
        
        tbody.innerHTML = categories.map(cat => `
            <tr>
                <td class="px-4 py-3">
                    <input type="text" value="${cat.nom}" 
                           id="cat-name-${cat.id}" 
                           class="w-full px-2 py-1 border border-gray-300 rounded" 
                           disabled>
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 text-xs rounded-full ${cat.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${cat.actif ? 'Actif' : 'Inactif'}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex justify-center space-x-2">
                        <button onclick="CategoriesManager.editCategory('${cat.id}')" 
                                class="text-blue-600 hover:text-blue-800" 
                                title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="CategoriesManager.toggleActiveFromModal('${cat.id}')" 
                                class="text-${cat.actif ? 'orange' : 'green'}-600 hover:text-${cat.actif ? 'orange' : 'green'}-800" 
                                title="${cat.actif ? 'Désactiver' : 'Activer'}">
                            <i class="fas fa-${cat.actif ? 'eye-slash' : 'eye'}"></i>
                        </button>
                        <button onclick="CategoriesManager.deleteFromModal('${cat.id}')" 
                                class="text-red-600 hover:text-red-800" 
                                title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
};
