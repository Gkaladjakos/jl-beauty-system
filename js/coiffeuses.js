// =========================================================================
// coiffeuses.js — avec support Salariée / Commission
// =========================================================================
const Coiffeuses = {
    data: [],

    // =========================================================================
    // render()
    // =========================================================================
    async render(container) {
        await this.loadData();

        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <div>
                    <button onclick="Coiffeuses.showAddModal()"
                            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
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
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrat / Rémunération</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="coiffeuses-table" class="divide-y divide-gray-200"></tbody>
                    </table>
                </div>
            </div>
        `;

        this.renderTable();
        this.setupSearch();
    },

    // =========================================================================
    // loadData()
    // =========================================================================
    async loadData() {
        try {
            const response = await Utils.get('coiffeuses');
            this.data = response.data || [];
        } catch (error) {
            console.error('Error loading coiffeuses:', error);
            this.data = [];
        }
    },

    // =========================================================================
    // _renderRemunerationBadge() — affichage selon type de contrat
    // =========================================================================
    _renderRemunerationBadge(coiffeuse) {
        if (coiffeuse.type_contrat === 'Salariée') {
            return `
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <i class="fas fa-id-badge mr-1"></i> Salariée
                </span>
                ${coiffeuse.salaire_base
                    ? `<p class="text-xs text-gray-500 mt-1">
                           ${Utils.formatCurrency(coiffeuse.salaire_base)} / mois
                       </p>`
                    : ''}
            `;
        }

        // Commission (par défaut)
        return `
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <i class="fas fa-percent mr-1"></i> Commission
            </span>
            <p class="text-xs text-gray-500 mt-1">${coiffeuse.taux_commission || 0}%</p>
        `;
    },

    // =========================================================================
    // renderTable()
    // =========================================================================
    renderTable(filteredData = null) {
        const dataToRender = filteredData || this.data;
        const tbody = document.getElementById('coiffeuses-table');
        if (!tbody) return;

        if (dataToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-user-tie text-4xl mb-2 block"></i>
                        <p>Aucune coiffeuse enregistrée</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = dataToRender.map(coiffeuse => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <img src="${coiffeuse.photo_url ||
                            'https://ui-avatars.com/api/?name=' +
                            encodeURIComponent(coiffeuse.nom) +
                            '&background=9333ea&color=fff'}"
                             class="w-10 h-10 rounded-full mr-3" alt="${coiffeuse.nom}">
                        <div>
                            <p class="font-medium text-gray-800">${coiffeuse.nom}</p>
                            <p class="text-sm text-gray-500">
                                Depuis ${Utils.formatDate(coiffeuse.date_embauche)}
                            </p>
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
                    ${this._renderRemunerationBadge(coiffeuse)}
                </td>
                <td class="px-6 py-4">
                    ${Utils.getStatusBadge(coiffeuse.statut)}
                </td>
                <td class="px-6 py-4">
                    <button onclick="Coiffeuses.showEditModal('${coiffeuse.id}')"
                            class="text-blue-600 hover:text-blue-800 mr-3" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="Coiffeuses.deleteCoiffeuse('${coiffeuse.id}')"
                            class="text-red-600 hover:text-red-800" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    // =========================================================================
    // setupSearch()
    // =========================================================================
    setupSearch() {
        const searchInput = document.getElementById('search-coiffeuses');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = this.data.filter(c =>
                c.nom.toLowerCase().includes(query) ||
                (c.telephone && c.telephone.includes(query)) ||
                (c.email && c.email.toLowerCase().includes(query))
            );
            this.renderTable(filtered);
        });
    },

    // =========================================================================
    // _buildFormContent() — formulaire partagé Add / Edit
    // =========================================================================
    _buildFormContent(coiffeuse = null) {
        const isEdit        = coiffeuse !== null;
        const typeContrat   = coiffeuse?.type_contrat   || 'Commission';
        const tauxCommission = coiffeuse?.taux_commission ?? 25;
        const salaireBase   = coiffeuse?.salaire_base   || '';
        const dateEmbauche  = isEdit
            ? new Date(coiffeuse.date_embauche).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        return `
            <form id="coiffeuse-form" class="space-y-4">

                <!-- Nom / Téléphone -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                        <input type="text" name="nom" required
                               value="${coiffeuse?.nom || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                        <input type="tel" name="telephone" required
                               value="${coiffeuse?.telephone || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>

                <!-- Email -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email"
                           value="${coiffeuse?.email || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>

                <!-- Spécialités -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Spécialités <span class="text-gray-400 text-xs">(séparer par virgule)</span>
                    </label>
                    <input type="text" name="specialites"
                           placeholder="Coupe, Coloration, Coiffage..."
                           value="${(coiffeuse?.specialites || []).join(', ')}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>

                <!-- ✅ Type de contrat -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Type de contrat *</label>
                    <div class="flex gap-4 mt-1">
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="type_contrat" value="Commission"
                                   id="radio-commission"
                                   ${typeContrat === 'Commission' ? 'checked' : ''}
                                   class="mr-2 accent-purple-600">
                            <span class="text-sm text-gray-700">
                                <i class="fas fa-percent mr-1 text-purple-600"></i>
                                À la commission
                            </span>
                        </label>
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="type_contrat" value="Salariée"
                                   id="radio-salariee"
                                   ${typeContrat === 'Salariée' ? 'checked' : ''}
                                   class="mr-2 accent-blue-600">
                            <span class="text-sm text-gray-700">
                                <i class="fas fa-id-badge mr-1 text-blue-600"></i>
                                Salariée fixe
                            </span>
                        </label>
                    </div>
                </div>

                <!-- ✅ Section Commission -->
                <div id="section-commission"
                     class="${typeContrat === 'Salariée' ? 'hidden' : ''}">
                    <div class="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <label class="block text-sm font-medium text-purple-700 mb-1">
                            Taux de commission (%) *
                        </label>
                        <input type="number" name="taux_commission"
                               value="${tauxCommission}"
                               min="0" max="100" step="1"
                               class="w-full px-3 py-2 border border-purple-300 rounded-lg
                                      focus:ring-2 focus:ring-purple-500 bg-white">
                        <p class="text-xs text-purple-600 mt-1">
                            <i class="fas fa-info-circle mr-1"></i>
                            Recommandé : 15–40% selon ancienneté et performance
                        </p>
                    </div>
                </div>

                <!-- ✅ Section Salaire -->
                <div id="section-salaire"
                     class="${typeContrat !== 'Salariée' ? 'hidden' : ''}">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <label class="block text-sm font-medium text-blue-700 mb-1">
                            Salaire de base mensuel (FC) *
                        </label>
                        <input type="number" name="salaire_base"
                               value="${salaireBase}"
                               min="0" step="1000" placeholder="Ex: 150000"
                               class="w-full px-3 py-2 border border-blue-300 rounded-lg
                                      focus:ring-2 focus:ring-blue-500 bg-white">
                        <p class="text-xs text-blue-600 mt-1">
                            <i class="fas fa-info-circle mr-1"></i>
                            Aucune commission ne sera calculée pour cette coiffeuse
                        </p>
                    </div>
                </div>

                <!-- Statut / Date -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select name="statut"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Actif"   ${coiffeuse?.statut === 'Actif'   ? 'selected' : ''}>Actif</option>
                            <option value="Congé"   ${coiffeuse?.statut === 'Congé'   ? 'selected' : ''}>Congé</option>
                            <option value="Inactif" ${coiffeuse?.statut === 'Inactif' ? 'selected' : ''}>Inactif</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date d'embauche</label>
                        <input type="date" name="date_embauche" value="${dateEmbauche}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>

                <!-- Photo URL -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">URL Photo</label>
                    <input type="url" name="photo_url"
                           placeholder="https://..."
                           value="${coiffeuse?.photo_url || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
            </form>
        `;
    },

    // =========================================================================
    // _setupContratToggle() — active/masque Commission ↔ Salaire
    // =========================================================================
    _setupContratToggle(modal) {
        const radios           = modal.querySelectorAll('input[name="type_contrat"]');
        const sectionCommission = modal.querySelector('#section-commission');
        const sectionSalaire   = modal.querySelector('#section-salaire');
        const inputCommission  = modal.querySelector('[name="taux_commission"]');
        const inputSalaire     = modal.querySelector('[name="salaire_base"]');

        const toggle = (value) => {
            if (value === 'Salariée') {
                sectionCommission.classList.add('hidden');
                sectionSalaire.classList.remove('hidden');
                inputCommission.required = false;
                inputSalaire.required    = true;
            } else {
                sectionCommission.classList.remove('hidden');
                sectionSalaire.classList.add('hidden');
                inputCommission.required = true;
                inputSalaire.required    = false;
            }
        };

        radios.forEach(radio => {
            radio.addEventListener('change', () => toggle(radio.value));
        });

        // Init selon valeur actuelle
        const checked = modal.querySelector('input[name="type_contrat"]:checked');
        toggle(checked?.value || 'Commission');
    },

    // =========================================================================
    // _collectFormData() — lecture du formulaire → objet
    // =========================================================================
    _collectFormData(form, base = {}) {
        const formData    = new FormData(form);
        const typeContrat = formData.get('type_contrat');

        return {
            ...base,
            nom:              formData.get('nom'),
            telephone:        formData.get('telephone'),
            email:            formData.get('email') || '',
            specialites:      formData.get('specialites')
                                  .split(',').map(s => s.trim()).filter(s => s),
            type_contrat:     typeContrat,
            // Commission : valeur réelle si Commission, 0 sinon
            taux_commission:  typeContrat === 'Commission'
                                  ? parseFloat(formData.get('taux_commission')) || 0
                                  : 0,
            // Salaire : valeur réelle si Salariée, null sinon
            salaire_base:     typeContrat === 'Salariée'
                                  ? parseFloat(formData.get('salaire_base')) || 0
                                  : null,
            statut:           formData.get('statut'),
            date_embauche:    new Date(formData.get('date_embauche')).getTime(),
            photo_url:        formData.get('photo_url') || ''
        };
    },

    // =========================================================================
    // showAddModal()
    // =========================================================================
    showAddModal() {
        const modal = Utils.createModal(
            'Ajouter une coiffeuse',
            this._buildFormContent(),
            async (modal) => {
                const form = modal.querySelector('#coiffeuse-form');
                if (!form.checkValidity()) { form.reportValidity(); return; }

                try {
                    App.showLoading();
                    await Utils.create('coiffeuses', this._collectFormData(form));
                    App.hideLoading();
                    App.showNotification('Coiffeuse ajoutée avec succès');
                    modal.remove();
                    this.render(document.getElementById('content-area'));
                } catch (error) {
                    App.hideLoading();
                    App.showNotification("Erreur lors de l'ajout", 'error');
                    console.error(error);
                }
            }
        );

        this._setupContratToggle(modal);
    },

    // =========================================================================
    // showEditModal()
    // =========================================================================
    async showEditModal(id) {
        const coiffeuse = this.data.find(c => c.id === id);
        if (!coiffeuse) return;

        const modal = Utils.createModal(
            'Modifier la coiffeuse',
            this._buildFormContent(coiffeuse),
            async (modal) => {
                const form = modal.querySelector('#coiffeuse-form');
                if (!form.checkValidity()) { form.reportValidity(); return; }

                try {
                    App.showLoading();
                    await Utils.update('coiffeuses', id, this._collectFormData(form, coiffeuse));
                    App.hideLoading();
                    App.showNotification('Coiffeuse modifiée avec succès');
                    modal.remove();
                    this.render(document.getElementById('content-area'));
                } catch (error) {
                    App.hideLoading();
                    App.showNotification('Erreur lors de la modification', 'error');
                    console.error(error);
                }
            }
        );

        this._setupContratToggle(modal);
    },

    // =========================================================================
    // deleteCoiffeuse()
    // =========================================================================
    async deleteCoiffeuse(id) {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette coiffeuse ?')) return;

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