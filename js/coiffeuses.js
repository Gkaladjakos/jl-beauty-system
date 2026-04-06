// =========================================================================
// coiffeuses.js — VERSION FINALE CORRIGÉE
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
                    <h3 class="text-lg font-semibold text-gray-800">
                        Gestion des coiffeuses
                    </h3>
                    <p class="text-sm text-gray-500">
                        ${this.data.length} coiffeuse(s) enregistrée(s)
                    </p>
                </div>
                <button onclick="Coiffeuses.showModal()"
                        class="px-4 py-2 bg-purple-600 text-white
                               rounded-lg hover:bg-purple-700">
                    <i class="fas fa-plus mr-2"></i>Ajouter une coiffeuse
                </button>
            </div>

            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="table-container">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium
                                           text-gray-500 uppercase">Coiffeuse</th>
                                <th class="px-6 py-3 text-left text-xs font-medium
                                           text-gray-500 uppercase">Contact</th>
                                <th class="px-6 py-3 text-left text-xs font-medium
                                           text-gray-500 uppercase">Spécialités</th>
                                <th class="px-6 py-3 text-left text-xs font-medium
                                           text-gray-500 uppercase">Rémunération</th>
                                <th class="px-6 py-3 text-left text-xs font-medium
                                           text-gray-500 uppercase">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium
                                           text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="coiffeuses-table"
                               class="divide-y divide-gray-200"></tbody>
                    </table>
                </div>
            </div>`;

        this.renderTable();
        this.setupSearch();
    },

    // =========================================================================
    // loadData()
    // =========================================================================
    async loadData() {
        try {
            const result = await Utils.get('coiffeuses');
            this.data = result.data || [];
        } catch (e) {
            console.error('[Coiffeuses] loadData error:', e);
            this.data = [];
        }
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

        tbody.innerHTML = dataToRender.map(c => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <img src="${c.photo_url ||
                            'https://ui-avatars.com/api/?name=' +
                            encodeURIComponent(c.nom) +
                            '&background=9333ea&color=fff'}"
                             class="w-10 h-10 rounded-full mr-3 object-cover"
                             alt="${c.nom}">
                        <div>
                            <p class="font-medium text-gray-800">${c.nom}</p>
                            <p class="text-sm text-gray-500">
                                Depuis ${Utils.formatDate(c.date_embauche)}
                            </p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-800">${c.telephone || '-'}</p>
                    <p class="text-sm text-gray-500">${c.email    || '-'}</p>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-1">
                        ${(c.specialites || []).map(s =>
                            `<span class="px-2 py-0.5 rounded-full text-xs
                                          bg-purple-100 text-purple-800">
                                 ${s}
                             </span>`
                        ).join('')}
                    </div>
                </td>
                <td class="px-6 py-4">
                    ${this._renderRemunerationBadge(c)}
                </td>
                <td class="px-6 py-4">
                    ${Utils.getStatusBadge(c.statut)}
                </td>
                <td class="px-6 py-4">
                    <button onclick="Coiffeuses.showModal('${c.id}')"
                            class="text-blue-600 hover:text-blue-800 mr-3"
                            title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="Coiffeuses.deleteCoiffeuse('${c.id}')"
                            class="text-red-600 hover:text-red-800"
                            title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`).join('');
    },

    // =========================================================================
    // _renderRemunerationBadge()
    // =========================================================================
    _renderRemunerationBadge(c) {
        if (c.type_remuneration === 'salaire') {
            return `
                <span class="inline-flex items-center px-2 py-1 rounded-full
                             text-xs font-medium bg-blue-100 text-blue-800">
                    <i class="fas fa-id-badge mr-1"></i>Salariée
                </span>
                <p class="text-xs text-gray-500 mt-1">
                    ${Utils.formatCurrency(c.salaire_fixe || 0)} / mois
                </p>`;
        }
        return `
            <span class="inline-flex items-center px-2 py-1 rounded-full
                         text-xs font-medium bg-purple-100 text-purple-800">
                <i class="fas fa-percent mr-1"></i>Commission
            </span>
            <p class="text-xs text-gray-500 mt-1">
                ${c.pourcentage_commission || 0}%
            </p>`;
    },

    // =========================================================================
    // setupSearch()
    // =========================================================================
    setupSearch() {
        const input = document.getElementById('search-coiffeuses');
        if (!input) return;
        input.addEventListener('input', e => {
            const q = e.target.value.toLowerCase();
            const filtered = this.data.filter(c =>
                c.nom.toLowerCase().includes(q) ||
                (c.telephone && c.telephone.includes(q)) ||
                (c.email && c.email.toLowerCase().includes(q))
            );
            this.renderTable(filtered);
        });
    },

    // =========================================================================
    // showModal()  — Add & Edit
    // =========================================================================
    async showModal(id = null) {
        const coiffeuse = id
            ? (this.data.find(c => c.id === id) || null)
            : null;

        const typeRemun = coiffeuse?.type_remuneration || 'pourcentage';

        // ✅ Date d'embauche — toujours une valeur par défaut = aujourd'hui
        const dateEmbauche = coiffeuse?.date_embauche
            ? new Date(coiffeuse.date_embauche).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        const modalContent = `
            <div class="space-y-4">

                <!-- Nom / Téléphone -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium
                                      text-gray-700 mb-1">Nom complet *</label>
                        <input type="text" id="c-nom" required
                               value="${coiffeuse?.nom || ''}"
                               placeholder="Ex : Marie Dupont"
                               class="w-full px-3 py-2 border border-gray-300
                                      rounded-lg text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium
                                      text-gray-700 mb-1">Téléphone</label>
                        <input type="tel" id="c-telephone"
                               value="${coiffeuse?.telephone || ''}"
                               placeholder="Ex : +243 81 234 5678"
                               class="w-full px-3 py-2 border border-gray-300
                                      rounded-lg text-sm">
                    </div>
                </div>

                <!-- Email -->
                <div>
                    <label class="block text-sm font-medium
                                  text-gray-700 mb-1">Email</label>
                    <input type="email" id="c-email"
                           value="${coiffeuse?.email || ''}"
                           placeholder="Ex : marie@salon.com"
                           class="w-full px-3 py-2 border border-gray-300
                                  rounded-lg text-sm">
                </div>

                <!-- Spécialités -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Spécialités
                        <span class="text-gray-400 text-xs">
                            (séparées par virgule)
                        </span>
                    </label>
                    <input type="text" id="c-specialites"
                           value="${(coiffeuse?.specialites || []).join(', ')}"
                           placeholder="Coupe, Coloration, Tresses..."
                           class="w-full px-3 py-2 border border-gray-300
                                  rounded-lg text-sm">
                </div>

                <!-- Mode de rémunération -->
                <div>
                    <label class="block text-sm font-medium
                                  text-gray-700 mb-2">Mode de rémunération *</label>
                    <div class="grid grid-cols-2 gap-3">
                        <button type="button"
                                onclick="Coiffeuses.setTypeRemuneration('pourcentage')"
                                id="btn-pourcentage"
                                class="px-4 py-3 rounded-lg font-medium text-sm
                                       border-2 transition-colors
                                       ${typeRemun === 'pourcentage'
                                           ? 'border-purple-600 bg-purple-50 text-purple-700'
                                           : 'border-gray-300 text-gray-600'}">
                            <i class="fas fa-percent mr-2"></i>Commission
                        </button>
                        <button type="button"
                                onclick="Coiffeuses.setTypeRemuneration('salaire')"
                                id="btn-salaire"
                                class="px-4 py-3 rounded-lg font-medium text-sm
                                       border-2 transition-colors
                                       ${typeRemun === 'salaire'
                                           ? 'border-blue-600 bg-blue-50 text-blue-700'
                                           : 'border-gray-300 text-gray-600'}">
                            <i class="fas fa-money-bill-wave mr-2"></i>Salaire fixe
                        </button>
                    </div>
                    <input type="hidden" id="c-type-remuneration"
                           value="${typeRemun}">
                </div>

                <!-- Bloc pourcentage -->
                <div id="bloc-pourcentage"
                     class="${typeRemun === 'salaire' ? 'hidden' : ''}">
                    <label class="block text-sm font-medium
                                  text-gray-700 mb-1">
                        Taux de commission (%) *
                    </label>
                    <div class="relative">
                        <input type="number" id="c-pourcentage"
                               min="0" max="100" step="1"
                               value="${coiffeuse?.pourcentage_commission ?? ''}"
                               placeholder="Ex : 30"
                               class="w-full px-3 py-2 pr-10 border
                                      border-gray-300 rounded-lg text-sm">
                        <span class="absolute right-3 top-2.5
                                     text-gray-400 font-bold">%</span>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">
                        Entre 0 et 100 — Ex : 30 pour 30%
                    </p>
                </div>

                <!-- Bloc salaire -->
                <div id="bloc-salaire"
                     class="${typeRemun === 'pourcentage' ? 'hidden' : ''}">
                    <label class="block text-sm font-medium
                                  text-gray-700 mb-1">
                        Salaire fixe mensuel *
                    </label>
                    <div class="relative">
                        <input type="number" id="c-salaire-fixe"
                               min="0" step="0.01"
                               value="${coiffeuse?.salaire_fixe ?? ''}"
                               placeholder="Ex : 500.00"
                               class="w-full px-3 py-2 pl-8 border
                                      border-gray-300 rounded-lg text-sm">
                        <span class="absolute left-3 top-2.5
                                     text-gray-400 font-bold">$</span>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">
                        Le taux de commission sera enregistré comme null
                    </p>
                </div>

                <!-- Statut / Date embauche -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium
                                      text-gray-700 mb-1">Statut</label>
                        <!-- ✅ FIX : valeurs = 'Actif','Congé','Inactif'
                                       pour respecter coiffeuses_statut_check -->
                        <select id="c-statut"
                                class="w-full px-3 py-2 border border-gray-300
                                       rounded-lg text-sm">
                            <option value="Actif"
                                    ${(coiffeuse?.statut ?? 'Actif') === 'Actif'
                                        ? 'selected' : ''}>
                                Actif
                            </option>
                            <option value="Congé"
                                    ${coiffeuse?.statut === 'Congé'
                                        ? 'selected' : ''}>
                                Congé
                            </option>
                            <option value="Inactif"
                                    ${coiffeuse?.statut === 'Inactif'
                                        ? 'selected' : ''}>
                                Inactif
                            </option>
                        </select>
                    </div>
                    <div>
                        <!-- ✅ FIX : champ date_embauche présent
                                       valeur par défaut = aujourd'hui -->
                        <label class="block text-sm font-medium
                                      text-gray-700 mb-1">Date d'embauche *</label>
                        <input type="date" id="c-date-embauche"
                               value="${dateEmbauche}"
                               class="w-full px-3 py-2 border border-gray-300
                                      rounded-lg text-sm">
                    </div>
                </div>

                <!-- Photo URL -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        URL Photo
                        <span class="text-gray-400 text-xs">(optionnel)</span>
                    </label>
                    <input type="url" id="c-photo-url"
                           value="${coiffeuse?.photo_url || ''}"
                           placeholder="https://..."
                           class="w-full px-3 py-2 border border-gray-300
                                  rounded-lg text-sm">
                </div>
            </div>`;

        const modal = Utils.createModal(
            id ? '✏️ Modifier la coiffeuse' : '➕ Nouvelle coiffeuse',
            modalContent,
            () => Coiffeuses.saveCoiffeuse(id)
        );

        document.body.appendChild(modal);
    },

    // =========================================================================
    // setTypeRemuneration()
    // =========================================================================
    setTypeRemuneration(type) {
        const input = document.getElementById('c-type-remuneration');
        if (input) input.value = type;

        const btnP  = document.getElementById('btn-pourcentage');
        const btnS  = document.getElementById('btn-salaire');
        const blocP = document.getElementById('bloc-pourcentage');
        const blocS = document.getElementById('bloc-salaire');

        if (type === 'pourcentage') {
            if (btnP) btnP.className =
                'px-4 py-3 rounded-lg font-medium text-sm border-2 transition-colors '
              + 'border-purple-600 bg-purple-50 text-purple-700';
            if (btnS) btnS.className =
                'px-4 py-3 rounded-lg font-medium text-sm border-2 transition-colors '
              + 'border-gray-300 text-gray-600';
            blocP?.classList.remove('hidden');
            blocS?.classList.add('hidden');
            const s = document.getElementById('c-salaire-fixe');
            if (s) s.value = '';
        } else {
            if (btnS) btnS.className =
                'px-4 py-3 rounded-lg font-medium text-sm border-2 transition-colors '
              + 'border-blue-600 bg-blue-50 text-blue-700';
            if (btnP) btnP.className =
                'px-4 py-3 rounded-lg font-medium text-sm border-2 transition-colors '
              + 'border-gray-300 text-gray-600';
            blocS?.classList.remove('hidden');
            blocP?.classList.add('hidden');
            const p = document.getElementById('c-pourcentage');
            if (p) p.value = '';
        }
    },

    // =========================================================================
    // _collectFormData()
    // =========================================================================
    _collectFormData() {
        const nom    = document.getElementById('c-nom')?.value?.trim();
        const tel    = document.getElementById('c-telephone')?.value?.trim();
        const email  = document.getElementById('c-email')?.value?.trim();
        const photo  = document.getElementById('c-photo-url')?.value?.trim();
        const statut = document.getElementById('c-statut')?.value || 'Actif';

        // ✅ Spécialités → tableau
        const specsRaw  = document.getElementById('c-specialites')?.value || '';
        const specialites = specsRaw
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        // ✅ Type de rémunération
        const typeRemun = document.getElementById('c-type-remuneration')?.value
            || 'pourcentage';

        // ✅ Logique null stricte
        let pourcentage_commission = null;
        let salaire_fixe           = null;

        if (typeRemun === 'pourcentage') {
            const val = parseFloat(
                document.getElementById('c-pourcentage')?.value
            );
            pourcentage_commission = isNaN(val) ? null : val;
            salaire_fixe           = null;
        } else {
            const val = parseFloat(
                document.getElementById('c-salaire-fixe')?.value
            );
            salaire_fixe           = isNaN(val) ? null : val;
            pourcentage_commission = null;
        }

        // ✅ Date d'embauche — jamais null
        const dateRaw       = document.getElementById('c-date-embauche')?.value;
        const date_embauche = dateRaw
            ? new Date(dateRaw + 'T12:00:00').toISOString()
            : new Date().toISOString();

        return {
            nom,
            telephone:              tel       || null,
            email:                  email     || null,
            specialites,
            type_remuneration:      typeRemun,
            pourcentage_commission,
            salaire_fixe,
            statut,
            date_embauche,
            photo_url:              photo     || null,
        };
    },

    // =========================================================================
    // _validatePayload()
    // =========================================================================
    _validatePayload(p) {
        if (!p.nom) {
            App.showNotification('Le nom est obligatoire', 'error');
            return false;
        }
        if (p.type_remuneration === 'pourcentage') {
            if (p.pourcentage_commission === null ||
                p.pourcentage_commission < 0      ||
                p.pourcentage_commission > 100) {
                App.showNotification(
                    'Entrez un pourcentage valide entre 0 et 100', 'error'
                );
                return false;
            }
        } else {
            if (p.salaire_fixe === null || p.salaire_fixe < 0) {
                App.showNotification(
                    'Entrez un salaire fixe valide', 'error'
                );
                return false;
            }
        }
        return true;
    },

    // =========================================================================
    // saveCoiffeuse()
    // =========================================================================
    async saveCoiffeuse(id = null) {
        const payload = this._collectFormData();

        console.log('[Coiffeuses] Payload envoyé :', payload);

        if (!this._validatePayload(payload)) return;

        try {
            App.showLoading?.();

            const result = id
                ? await Utils.update('coiffeuses', id, payload)
                : await Utils.create('coiffeuses', payload);

            App.hideLoading?.();

            if (result?.error) {
                console.error('[Coiffeuses] Erreur Supabase :', result.error);
                App.showNotification(
                    '❌ Erreur : ' + result.error.message, 'error'
                );
                return;
            }

            document.querySelector('.modal-overlay')?.remove();
            App.showNotification(
                id ? '✅ Coiffeuse modifiée !' : '✅ Coiffeuse ajoutée !',
                'success'
            );
            await this.loadData();
            this.render(document.getElementById('content-area'));

        } catch (error) {
            App.hideLoading?.();
            console.error('[Coiffeuses] saveCoiffeuse error:', error);
            App.showNotification('❌ Erreur : ' + error.message, 'error');
        }
    },

    // =========================================================================
    // deleteCoiffeuse()
    // =========================================================================
    async deleteCoiffeuse(id) {
        if (!confirm('Supprimer cette coiffeuse ? Action irréversible.')) return;
        try {
            App.showLoading?.();
            await Utils.delete('coiffeuses', id);
            App.hideLoading?.();
            App.showNotification('Coiffeuse supprimée', 'success');
            await this.loadData();
            this.render(document.getElementById('content-area'));
        } catch (error) {
            App.hideLoading?.();
            App.showNotification('❌ Erreur : ' + error.message, 'error');
        }
    },
};