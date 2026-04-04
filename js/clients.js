// =========================================================================
// clients.js — FICHIER COMPLET CORRIGÉ
// =========================================================================
const Clients = {
    data: [],

    // =====================================================================
    // SYSTÈME DE FIDÉLITÉ — CONSTANTES
    // =====================================================================
    PASSAGES_POUR_REDUCTION: 10,
    TAUX_REDUCTION: 0.30,

    getFideliteInfo(client) {
        // ✅ Protection renforcée — nombre_passages toujours numérique
        const passages         = parseInt(client?.nombre_passages) || 0;
        const cycle            = passages % this.PASSAGES_POUR_REDUCTION;
        const passagesRestants = this.PASSAGES_POUR_REDUCTION - cycle;
        const reductionActive  = cycle === 0 && passages > 0;

        return {
            passages,
            cycle,
            passagesRestants,
            reductionActive,
            taux: this.TAUX_REDUCTION,
            label: reductionActive
                ? `🎉 -30% sur cette visite !`
                : `${cycle}/${this.PASSAGES_POUR_REDUCTION} passages`
        };
    },

    // ✅ FIX PRINCIPAL — incrementerPassages met maintenant à jour Clients.data
    // dans les deux branches (client trouvé ET non trouvé en mémoire)
    async incrementerPassages(clientId) {
        try {
            // Toujours récupérer depuis la DB pour avoir la valeur la plus récente
            const response     = await Utils.get('clients');
            const allClients   = response.data || [];
            const found        = allClients.find(c => c.id === clientId);

            if (!found) {
                console.warn('incrementerPassages: client introuvable id=', clientId);
                return null;
            }

            const nouveauxPassages = (parseInt(found.nombre_passages) || 0) + 1;

            await Utils.update('clients', clientId, {
                ...found,
                nombre_passages: nouveauxPassages
            });

            // ✅ Mettre à jour Clients.data dans les deux cas
            const localIndex = this.data.findIndex(c => c.id === clientId);
            if (localIndex !== -1) {
                // Client déjà en mémoire → mise à jour directe
                this.data[localIndex].nombre_passages = nouveauxPassages;
            } else {
                // Client pas encore en mémoire → on recharge tout
                await this.loadData();
            }

            return nouveauxPassages;

        } catch (error) {
            console.error('Erreur incrementerPassages:', error);
            return null;
        }
    },

    // Badge fidélité visuel
    getFideliteBadge(client) {
        const info = this.getFideliteInfo(client);

        if (info.reductionActive) {
            return `
                <span class="badge bg-green-100 text-green-800 border border-green-300 px-2 py-1 rounded text-xs">
                    🎉 -30% ACTIF
                </span>`;
        }

        const pct     = (info.cycle / this.PASSAGES_POUR_REDUCTION) * 100;
        const couleur = pct >= 80
            ? 'bg-orange-500'
            : pct >= 50
            ? 'bg-yellow-400'
            : 'bg-purple-400';

        return `
            <div class="flex flex-col" title="${info.passages} passage(s) total">
                <div class="flex items-center space-x-1 mb-1">
                    <i class="fas fa-walking text-purple-500 text-xs"></i>
                    <span class="text-xs font-semibold text-gray-700">
                        ${info.cycle}/${this.PASSAGES_POUR_REDUCTION}
                    </span>
                    ${info.passagesRestants <= 3 && !info.reductionActive
                        ? `<span class="text-xs text-orange-500 font-bold">
                               (${info.passagesRestants} restant${info.passagesRestants > 1 ? 's' : ''})
                           </span>`
                        : ''}
                </div>
                <div class="w-24 bg-gray-200 rounded-full h-1.5">
                    <div class="${couleur} h-1.5 rounded-full transition-all"
                         style="width: ${pct}%"></div>
                </div>
            </div>`;
    },

    // =====================================================================
    // Render principal
    // =====================================================================
    async render(container) {
        await this.loadData();

        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <div>
                    <button onclick="Clients.showAddModal()"
                            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
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
                    <input type="text" id="search-clients"
                           placeholder="Rechercher..."
                           class="px-4 py-2 border border-gray-300 rounded-lg
                                  focus:ring-2 focus:ring-purple-500 focus:outline-none">
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="table-container">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passages</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fidélité</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inscription</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="clients-table" class="divide-y divide-gray-200"></tbody>
                    </table>
                </div>
            </div>
        `;

        this.renderTable();
        this.setupSearch();
    },

    // =====================================================================
    // Chargement des données
    // =====================================================================
    async loadData() {
        try {
            const response = await Utils.get('clients');
            // ✅ Normalisation : garantit que nombre_passages est toujours un entier
            this.data = (response.data || []).map(c => ({
                ...c,
                nombre_passages: parseInt(c.nombre_passages) || 0
            }));
        } catch (error) {
            console.error('Error loading clients:', error);
            this.data = [];
        }
    },

    // =====================================================================
    // Tableau
    // =====================================================================
    renderTable(filteredData = null) {
        const dataToRender = filteredData || this.data;
        const tbody        = document.getElementById('clients-table');
        if (!tbody) return;

        if (dataToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-users text-4xl mb-2 block"></i>
                        <p>Aucun client enregistré</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = dataToRender.map(client => {
            const displayName = client.nom && client.nom.trim() !== ''
                ? client.nom
                : `Client ${client.telephone}`;

            const info = this.getFideliteInfo(client);

            return `
            <tr class="hover:bg-gray-50 ${info.reductionActive ? 'bg-green-50' : ''}">

                <!-- Client -->
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="relative">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=ec4899&color=fff"
                                 class="w-10 h-10 rounded-full mr-3" alt="${displayName}">
                            ${info.reductionActive
                                ? `<span class="absolute -top-1 -right-1 w-4 h-4 bg-green-500
                                              rounded-full flex items-center justify-center"
                                         title="Réduction -30% active">
                                       <i class="fas fa-gift text-white" style="font-size:8px"></i>
                                   </span>`
                                : ''}
                        </div>
                        <div>
                            <p class="font-medium text-gray-800">${displayName}</p>
                            ${client.preferences
                                ? `<p class="text-xs text-gray-500">
                                       ${client.preferences.substring(0, 30)}...
                                   </p>`
                                : ''}
                        </div>
                    </div>
                </td>

                <!-- Contact -->
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-800">
                        <i class="fas fa-phone text-gray-400 mr-1"></i>
                        ${client.telephone || '-'}
                    </p>
                    ${client.email
                        ? `<p class="text-sm text-gray-500">
                               <i class="fas fa-envelope text-gray-400 mr-1"></i>
                               ${client.email}
                           </p>`
                        : ''}
                </td>

                <!-- ✅ Passages — toujours affiché grâce à parseInt dans loadData -->
                <td class="px-6 py-4">
                    <div class="flex flex-col items-start">
                        <span class="text-lg font-bold ${info.reductionActive
                            ? 'text-green-600'
                            : 'text-purple-600'}">
                            ${info.passages}
                        </span>
                        <span class="text-xs text-gray-500">
                            visite${info.passages !== 1 ? 's' : ''}
                        </span>
                    </div>
                </td>

                <!-- Fidélité -->
                <td class="px-6 py-4">
                    ${this.getFideliteBadge(client)}
                </td>

                <!-- Statut -->
                <td class="px-6 py-4">
                    ${Utils.getStatusBadge(client.statut)}
                </td>

                <!-- Inscription -->
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-800">
                        ${Utils.formatDate(client.date_inscription)}
                    </p>
                </td>

                <!-- Actions -->
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
            </tr>`;
        }).join('');
    },

    // =====================================================================
    // Recherche & filtres
    // =====================================================================
    setupSearch() {
        const searchInput  = document.getElementById('search-clients');
        const filterStatut = document.getElementById('filter-statut');

        const applyFilters = () => {
            const query  = searchInput?.value.toLowerCase() || '';
            const statut = filterStatut?.value || '';

            const filtered = this.data.filter(c => {
                const displayName = c.nom && c.nom.trim() !== ''
                    ? c.nom : `Client ${c.telephone}`;
                const matchesSearch = !query ||
                    displayName.toLowerCase().includes(query) ||
                    (c.telephone && c.telephone.includes(query)) ||
                    (c.email && c.email.toLowerCase().includes(query));
                const matchesStatut = !statut || c.statut === statut;
                return matchesSearch && matchesStatut;
            });

            this.renderTable(filtered);
        };

        searchInput ?.addEventListener('input',  applyFilters);
        filterStatut?.addEventListener('change', applyFilters);
    },

    // =====================================================================
    // Modal — Ajouter
    // =====================================================================
    showAddModal() {
        const modalContent = `
            <form id="client-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Nom complet
                            <span class="text-gray-500 text-xs">(facultatif)</span>
                        </label>
                        <input type="text" name="nom"
                               placeholder="Laissez vide pour afficher le téléphone"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                      focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Téléphone *
                        </label>
                        <input type="tel" name="telephone" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                      focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                      focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Date de naissance
                        </label>
                        <input type="date" name="date_naissance"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                      focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input type="text" name="adresse"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                  focus:ring-2 focus:ring-purple-500">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Préférences et notes
                    </label>
                    <textarea name="preferences" rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                     focus:ring-2 focus:ring-purple-500"></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Points de fidélité
                        </label>
                        <input type="number" name="points_fidelite"
                               value="0" min="0"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                      focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select name="statut"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                       focus:ring-2 focus:ring-purple-500">
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
            if (!form.checkValidity()) { form.reportValidity(); return; }

            try {
                App.showLoading();
                const formData = new FormData(form);
                await Utils.create('clients', {
                    nom:              formData.get('nom') || '',
                    telephone:        formData.get('telephone'),
                    email:            formData.get('email') || '',
                    date_naissance:   formData.get('date_naissance')
                                      ? new Date(formData.get('date_naissance')).getTime()
                                      : null,
                    adresse:          formData.get('adresse') || '',
                    preferences:      formData.get('preferences') || '',
                    points_fidelite:  parseInt(formData.get('points_fidelite')) || 0,
                    // ✅ nombre_passages toujours initialisé à 0
                    nombre_passages:  0,
                    statut:           formData.get('statut'),
                    date_inscription: Date.now()
                });

                App.hideLoading();
                App.showNotification('Client ajouté avec succès');
                modal.remove();
                this.render(document.getElementById('content-area'));
            } catch (error) {
                App.hideLoading();
                App.showNotification("Erreur lors de l'ajout", 'error');
                console.error(error);
            }
        });
    },

    // =====================================================================
    // Modal — Modifier
    // =====================================================================
    async showEditModal(id) {
        const client = this.data.find(c => c.id === id);
        if (!client) return;

        const info = this.getFideliteInfo(client);

        const modalContent = `
            <form id="client-form" class="space-y-4">

                <!-- Bandeau fidélité -->
                <div class="p-3 rounded-lg ${info.reductionActive
                    ? 'bg-green-50 border border-green-300'
                    : 'bg-purple-50 border border-purple-200'}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-walking ${info.reductionActive
                                ? 'text-green-600' : 'text-purple-500'}"></i>
                            <span class="text-sm font-semibold ${info.reductionActive
                                ? 'text-green-700' : 'text-purple-700'}">
                                ${info.passages} passage${info.passages > 1 ? 's' : ''} au total
                            </span>
                        </div>
                        <span class="text-sm font-bold ${info.reductionActive
                            ? 'text-green-600' : 'text-gray-600'}">
                            ${info.label}
                        </span>
                    </div>
                    <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div class="${info.reductionActive ? 'bg-green-500' : 'bg-purple-500'}
                                    h-2 rounded-full transition-all"
                             style="width: ${info.reductionActive
                                ? 100
                                : (info.cycle / this.PASSAGES_POUR_REDUCTION) * 100}%">
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Nom complet
                            <span class="text-gray-500 text-xs">(facultatif)</span>
                        </label>
                        <input type="text" name="nom"
                               value="${client.nom || ''}"
                               placeholder="Laissez vide pour afficher le téléphone"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                      focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Téléphone *
                        </label>
                        <input type="tel" name="telephone" required
                               value="${client.telephone || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                      focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email"
                               value="${client.email || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                      focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Date de naissance
                        </label>
                        <input type="date" name="date_naissance"
                               value="${client.date_naissance
                                   ? new Date(client.date_naissance).toISOString().split('T')[0]
                                   : ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                      focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input type="text" name="adresse"
                           value="${client.adresse || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                  focus:ring-2 focus:ring-purple-500">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Préférences et notes
                    </label>
                    <textarea name="preferences" rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                     focus:ring-2 focus:ring-purple-500"
                    >${client.preferences || ''}</textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Points de fidélité
                        </label>
                        <input type="number" name="points_fidelite"
                               value="${client.points_fidelite || 0}" min="0"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                      focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select name="statut"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg
                                       focus:ring-2 focus:ring-purple-500">
                            <option value="Actif"   ${client.statut === 'Actif'   ? 'selected' : ''}>Actif</option>
                            <option value="VIP"     ${client.statut === 'VIP'     ? 'selected' : ''}>VIP</option>
                            <option value="Inactif" ${client.statut === 'Inactif' ? 'selected' : ''}>Inactif</option>
                        </select>
                    </div>
                </div>

                <!-- ✅ Correction passages manuelle (admin) -->
                <div class="border-t pt-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        <i class="fas fa-walking text-purple-500 mr-1"></i>
                        Nombre de passages (correction manuelle)
                    </label>
                    <div class="flex items-center space-x-3">
                        <input type="number" name="nombre_passages"
                               value="${info.passages}" min="0"
                               class="w-32 px-3 py-2 border border-gray-300 rounded-lg
                                      focus:ring-2 focus:ring-purple-500">
                        <p class="text-xs text-gray-500">
                            <i class="fas fa-info-circle"></i>
                            Modifiable uniquement pour corriger une erreur de comptage
                        </p>
                    </div>
                </div>
            </form>
        `;

        Utils.createModal('Modifier le client', modalContent, async (modal) => {
            const form = modal.querySelector('#client-form');
            if (!form.checkValidity()) { form.reportValidity(); return; }

            try {
                App.showLoading();
                const formData = new FormData(form);
                await Utils.update('clients', id, {
                    ...client,
                    nom:             formData.get('nom') || '',
                    telephone:       formData.get('telephone'),
                    email:           formData.get('email') || '',
                    date_naissance:  formData.get('date_naissance')
                                     ? new Date(formData.get('date_naissance')).getTime()
                                     : null,
                    adresse:         formData.get('adresse') || '',
                    preferences:     formData.get('preferences') || '',
                    points_fidelite: parseInt(formData.get('points_fidelite')) || 0,
                    // ✅ nombre_passages maintenant inclus dans la mise à jour
                    nombre_passages: parseInt(formData.get('nombre_passages')) || 0,
                    statut:          formData.get('statut')
                });

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

    // =====================================================================
    // Modal — Détails
    // =====================================================================
    async showDetailModal(id) {
        const client = this.data.find(c => c.id === id);
        if (!client) {
            App.showNotification('Client introuvable', 'error');
            return;
        }

        const displayName = client.nom && client.nom.trim() !== ''
            ? client.nom
            : `Client ${client.telephone}`;

        const info = this.getFideliteInfo(client);

        let rdvHistory = '';
        try {
            const rdvData   = await Utils.get('rendez_vous');
            const clientRdv = (rdvData.data || [])
                .filter(r => r.client_id === id)
                .sort((a, b) => new Date(b.date_rdv) - new Date(a.date_rdv));

            rdvHistory = clientRdv.length > 0
                ? clientRdv.map(rdv => `
                    <div class="flex justify-between items-center py-2 border-b">
                        <div>
                            <p class="text-sm font-medium">${rdv.service_nom}</p>
                            <p class="text-xs text-gray-500">
                                ${Utils.formatDateTime(rdv.date_rdv)} — ${rdv.coiffeuse_nom}
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-medium">${Utils.formatCurrency(rdv.prix)}</p>
                            ${Utils.getStatusBadge(rdv.statut)}
                        </div>
                    </div>`).join('')
                : '<p class="text-gray-500 text-sm">Aucun historique</p>';
        } catch (error) {
            rdvHistory = '<p class="text-red-500 text-sm">Erreur de chargement</p>';
        }

        const modalContent = `
            <div class="space-y-6">

                <!-- En-tête -->
                <div class="flex items-center space-x-4">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=ec4899&color=fff&size=80"
                         class="w-20 h-20 rounded-full" alt="${displayName}">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${displayName}</h3>
                        ${Utils.getStatusBadge(client.statut)}
                    </div>
                </div>

                <!-- Carte fidélité -->
                <div class="p-4 rounded-xl ${info.reductionActive
                    ? 'bg-green-50 border-2 border-green-400'
                    : 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200'}">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold ${info.reductionActive
                            ? 'text-green-700' : 'text-purple-700'}">
                            <i class="fas fa-crown mr-1"></i> Carte de fidélité
                        </h4>
                        ${info.reductionActive
                            ? `<span class="px-3 py-1 bg-green-500 text-white text-sm
                                          font-bold rounded-full animate-pulse">
                                   🎉 -30% DISPONIBLE
                               </span>`
                            : `<span class="text-sm text-gray-600">
                                   ${info.passagesRestants} passage(s) avant -30%
                               </span>`}
                    </div>

                    <div class="flex items-end justify-between">
                        <div>
                            <p class="text-3xl font-bold ${info.reductionActive
                                ? 'text-green-600' : 'text-purple-600'}">
                                ${info.passages}
                            </p>
                            <p class="text-xs text-gray-500">passage(s) total</p>
                        </div>
                        <div class="text-right text-sm text-gray-600">
                            <p>Cycle : <strong>${info.cycle}/${this.PASSAGES_POUR_REDUCTION}</strong></p>
                        </div>
                    </div>

                    <div class="mt-3">
                        <div class="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progression vers la prochaine réduction</span>
                            <span>${Math.round(
                                (info.cycle / this.PASSAGES_POUR_REDUCTION) * 100
                            )}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-3">
                            <div class="${info.reductionActive ? 'bg-green-500' : 'bg-purple-500'}
                                        h-3 rounded-full"
                                 style="width: ${info.reductionActive
                                     ? 100
                                     : (info.cycle / this.PASSAGES_POUR_REDUCTION) * 100}%">
                            </div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-400 mt-1">
                            ${Array.from(
                                { length: this.PASSAGES_POUR_REDUCTION },
                                (_, i) => `
                                    <span class="${i < info.cycle || info.reductionActive
                                        ? 'text-purple-500 font-bold' : ''}">
                                        ${i + 1}
                                    </span>`
                            ).join('')}
                        </div>
                    </div>
                </div>

                <!-- Infos contact -->
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
                        <p class="font-medium">
                            ${client.date_naissance ? Utils.formatDate(client.date_naissance) : '-'}
                        </p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Points de fidélité</p>
                        <p class="font-medium text-yellow-600">
                            <i class="fas fa-star"></i> ${client.points_fidelite || 0} points
                        </p>
                    </div>
                </div>

                <div>
                    <p class="text-sm text-gray-600">Adresse</p>
                    <p class="font-medium">${client.adresse || '-'}</p>
                </div>

                ${client.preferences
                    ? `<div>
                           <p class="text-sm text-gray-600">Préférences</p>
                           <p class="font-medium">${client.preferences}</p>
                       </div>`
                    : ''}

                <div>
                    <p class="text-sm text-gray-600 mb-1">Date d'inscription</p>
                    <p class="font-medium">${Utils.formatDate(client.date_inscription)}</p>
                </div>

                <!-- Historique RDV -->
                <div class="border-t pt-4">
                    <h4 class="font-semibold text-gray-800 mb-3">
                        Historique des rendez-vous
                    </h4>
                    <div class="max-h-60 overflow-y-auto">
                        ${rdvHistory}
                    </div>
                </div>
            </div>
        `;

        const modal = Utils.createModal('Détails du client', modalContent, null);

        // ✅ Cacher le bouton Sauvegarder avec vérification null
        if (modal) {
            const saveBtn = modal.querySelector('.save-modal');
            if (saveBtn) saveBtn.style.display = 'none';
        }
    },

    // =====================================================================
    // Suppression
    // =====================================================================
    async deleteClient(id) {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

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