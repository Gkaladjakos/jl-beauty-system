const Coiffeuses = {

    data: [],

    // =========================================================================
    // 1. render()
    // =========================================================================
    async render(container) {
        await this.loadData();

        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
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
                    <i class="fas fa-plus mr-2"></i>Ajouter
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${this.data.length === 0
                    ? `<div class="col-span-3 text-center py-12 text-gray-400">
                           <i class="fas fa-user-slash text-4xl mb-3 block"></i>
                           <p>Aucune coiffeuse enregistrée</p>
                       </div>`
                    : this.data.map(c => this._renderCard(c)).join('')
                }
            </div>`;
    },

    // =========================================================================
    // 2. loadData()
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
    // 3. _renderCard()
    // =========================================================================
    _renderCard(c) {
        const badge = c.statut === 'active'
            ? `<span class="px-2 py-0.5 rounded-full text-xs font-medium
                           bg-green-100 text-green-700">Actif</span>`
            : `<span class="px-2 py-0.5 rounded-full text-xs font-medium
                           bg-gray-100 text-gray-600">Inactif</span>`;

        const remuneration = c.type_remuneration === 'pourcentage'
            ? `<span class="text-purple-600 font-semibold">
                   ${c.pourcentage_commission ?? 0} %
               </span>
               <span class="text-xs text-gray-400 ml-1">commission</span>`
            : `<span class="text-blue-600 font-semibold">
                   ${Utils.formatCurrency(c.salaire_fixe ?? 0)}
               </span>
               <span class="text-xs text-gray-400 ml-1">/ mois</span>`;

        return `
            <div class="bg-white rounded-lg shadow-md p-5 hover:shadow-lg
                        transition-shadow">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 rounded-full bg-purple-100
                                    flex items-center justify-center">
                            ${c.photo_url
                                ? `<img src="${c.photo_url}" alt="${c.nom}"
                                        class="w-12 h-12 rounded-full object-cover">`
                                : `<i class="fas fa-user text-purple-500 text-xl"></i>`
                            }
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-800">${c.nom}</h4>
                            <p class="text-xs text-gray-500">
                                ${c.specialite || 'Polyvalente'}
                            </p>
                        </div>
                    </div>
                    ${badge}
                </div>

                <div class="text-sm text-gray-600 space-y-1 mb-4">
                    ${c.telephone
                        ? `<p><i class="fas fa-phone w-4 text-gray-400"></i>
                               ${c.telephone}</p>`
                        : ''}
                    <p class="flex items-center">
                        <i class="fas fa-wallet w-4 text-gray-400 mr-1"></i>
                        ${remuneration}
                    </p>
                </div>

                <div class="flex space-x-2 pt-3 border-t border-gray-100">
                    <button onclick="Coiffeuses.showModal('${c.id}')"
                            class="flex-1 px-3 py-1.5 text-xs bg-purple-50
                                   text-purple-700 rounded hover:bg-purple-100">
                        <i class="fas fa-edit mr-1"></i>Modifier
                    </button>
                    <button onclick="Coiffeuses.toggleStatut('${c.id}', '${c.statut}')"
                            class="px-3 py-1.5 text-xs bg-gray-50 text-gray-600
                                   rounded hover:bg-gray-100">
                        <i class="fas fa-toggle-on mr-1"></i>
                        ${c.statut === 'active' ? 'Désactiver' : 'Activer'}
                    </button>
                    <button onclick="Coiffeuses.deleteCoiffeuse('${c.id}')"
                            class="px-3 py-1.5 text-xs bg-red-50 text-red-600
                                   rounded hover:bg-red-100">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
    },

    // =========================================================================
    // 4. showModal()
    // =========================================================================
    async showModal(id = null) {
        let coiffeuse = null;

        if (id) {
            coiffeuse = this.data.find(c => c.id === id) || null;
        }

        const typeRemun = coiffeuse?.type_remuneration || 'pourcentage';

        const modalContent = `
            <div class="space-y-4" id="coiffeuse-form">

                <!-- Nom -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Nom complet *
                    </label>
                    <input type="text" id="c-nom" required
                           value="${coiffeuse?.nom || ''}"
                           placeholder="Ex : Marie Dubois"
                           class="w-full px-3 py-2 border border-gray-300
                                  rounded-lg text-sm">
                </div>

                <!-- Téléphone -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                    </label>
                    <input type="tel" id="c-telephone"
                           value="${coiffeuse?.telephone || ''}"
                           placeholder="Ex : +243 81 234 5678"
                           class="w-full px-3 py-2 border border-gray-300
                                  rounded-lg text-sm">
                </div>

                <!-- Spécialité -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Spécialité
                    </label>
                    <input type="text" id="c-specialite"
                           value="${coiffeuse?.specialite || ''}"
                           placeholder="Ex : Tresses, colorations..."
                           class="w-full px-3 py-2 border border-gray-300
                                  rounded-lg text-sm">
                </div>

                <!-- Type de rémunération -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Mode de rémunération *
                    </label>
                    <div class="grid grid-cols-2 gap-3">
                        <button type="button"
                                onclick="Coiffeuses.setTypeRemuneration('pourcentage')"
                                id="btn-pourcentage"
                                class="px-4 py-3 rounded-lg font-medium text-sm
                                       border-2 ${typeRemun === 'pourcentage'
                                           ? 'border-purple-600 bg-purple-50 text-purple-700'
                                           : 'border-gray-300 text-gray-600'}">
                            <i class="fas fa-percent mr-2"></i>Commission %
                        </button>
                        <button type="button"
                                onclick="Coiffeuses.setTypeRemuneration('salaire')"
                                id="btn-salaire"
                                class="px-4 py-3 rounded-lg font-medium text-sm
                                       border-2 ${typeRemun === 'salaire'
                                           ? 'border-blue-600 bg-blue-50 text-blue-700'
                                           : 'border-gray-300 text-gray-600'}">
                            <i class="fas fa-money-bill-wave mr-2"></i>Salaire fixe
                        </button>
                    </div>
                    <input type="hidden" id="c-type-remuneration" value="${typeRemun}">
                </div>

                <!-- Bloc pourcentage -->
                <div id="bloc-pourcentage"
                     class="${typeRemun === 'salaire' ? 'hidden' : ''}">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Pourcentage de commission *
                    </label>
                    <div class="relative">
                        <input type="number" id="c-pourcentage"
                               min="0" max="100" step="0.1"
                               value="${coiffeuse?.pourcentage_commission ?? ''}"
                               placeholder="Ex : 30"
                               class="w-full px-3 py-2 pr-10 border
                                      border-gray-300 rounded-lg text-sm">
                        <span class="absolute right-3 top-2.5 text-gray-400
                                     font-bold">%</span>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">
                        Appliqué sur chaque prestation réalisée
                    </p>
                </div>

                <!-- Bloc salaire -->
                <div id="bloc-salaire"
                     class="${typeRemun === 'pourcentage' ? 'hidden' : ''}">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Salaire fixe mensuel *
                    </label>
                    <div class="relative">
                        <input type="number" id="c-salaire-fixe"
                               min="0" step="0.01"
                               value="${coiffeuse?.salaire_fixe ?? ''}"
                               placeholder="Ex : 500.00"
                               class="w-full px-3 py-2 pl-8 border
                                      border-gray-300 rounded-lg text-sm">
                        <span class="absolute left-3 top-2.5 text-gray-400
                                     font-bold">$</span>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">
                        Le pourcentage sera enregistré comme null
                    </p>
                </div>

                <!-- Statut -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Statut
                    </label>
                    <select id="c-statut"
                            class="w-full px-3 py-2 border border-gray-300
                                   rounded-lg text-sm">
                        <option value="active"
                                ${(coiffeuse?.statut ?? 'active') === 'active'
                                    ? 'selected' : ''}>
                            Actif
                        </option>
                        <option value="inactive"
                                ${coiffeuse?.statut === 'inactive'
                                    ? 'selected' : ''}>
                            Inactif
                        </option>
                    </select>
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
    // 5. setTypeRemuneration()
    // =========================================================================
    setTypeRemuneration(type) {
        // Mettre à jour le champ caché
        const input = document.getElementById('c-type-remuneration');
        if (input) input.value = type;

        const btnP  = document.getElementById('btn-pourcentage');
        const btnS  = document.getElementById('btn-salaire');
        const blocP = document.getElementById('bloc-pourcentage');
        const blocS = document.getElementById('bloc-salaire');

        if (type === 'pourcentage') {
            if (btnP) btnP.className =
                'px-4 py-3 rounded-lg font-medium text-sm border-2 '
              + 'border-purple-600 bg-purple-50 text-purple-700';
            if (btnS) btnS.className =
                'px-4 py-3 rounded-lg font-medium text-sm border-2 '
              + 'border-gray-300 text-gray-600';

            blocP?.classList.remove('hidden');
            blocS?.classList.add('hidden');

            // Vider le salaire quand on bascule en %
            const inputSalaire = document.getElementById('c-salaire-fixe');
            if (inputSalaire) inputSalaire.value = '';

        } else {
            if (btnS) btnS.className =
                'px-4 py-3 rounded-lg font-medium text-sm border-2 '
              + 'border-blue-600 bg-blue-50 text-blue-700';
            if (btnP) btnP.className =
                'px-4 py-3 rounded-lg font-medium text-sm border-2 '
              + 'border-gray-300 text-gray-600';

            blocS?.classList.remove('hidden');
            blocP?.classList.add('hidden');

            // Vider le % quand on bascule en salaire
            const inputPct = document.getElementById('c-pourcentage');
            if (inputPct) inputPct.value = '';
        }
    },

    // =========================================================================
    // 6. _collectFormData()  ← FIX PRINCIPAL
    // =========================================================================
    _collectFormData() {
        const nom        = document.getElementById('c-nom')?.value?.trim();
        const telephone  = document.getElementById('c-telephone')?.value?.trim();
        const typeRemun  = document.getElementById('c-type-remuneration')?.value
                                || 'pourcentage';
        const statut     = document.getElementById('c-statut')?.value || 'active';
    
        // ✅ Spécialités en tableau
        const specialitesRaw = document.getElementById('c-specialites')?.value || '';
        const specialites    = specialitesRaw
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
    
        // ✅ Rémunération : null selon le type
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
    
        const payload = {
            nom,
            telephone:              telephone || null,
            specialites,
            type_remuneration:      typeRemun,
            pourcentage_commission,
            salaire_fixe,
            statut,
        };
    
        console.log('[Coiffeuses] Payload envoyé :', payload);
        return payload;
    },

    // =========================================================================
    // 7. saveCoiffeuse()
    // =========================================================================
    async saveCoiffeuse(id = null) {
        const payload = this._collectFormData();

        // ── Validations ───────────────────────────────────────────────────
        if (!payload.nom) {
            App.showNotification('Le nom est obligatoire', 'error');
            return;
        }

        if (payload.type_remuneration === 'pourcentage') {
            if (payload.pourcentage_commission === null ||
                payload.pourcentage_commission < 0    ||
                payload.pourcentage_commission > 100) {
                App.showNotification(
                    'Entrez un pourcentage valide (0 – 100)', 'error'
                );
                return;
            }
        } else {
            if (payload.salaire_fixe === null ||
                payload.salaire_fixe < 0) {
                App.showNotification(
                    'Entrez un salaire fixe valide', 'error'
                );
                return;
            }
        }

        console.log('[Coiffeuses] Payload envoyé :', payload);

        try {
            App.showLoading?.();

            const result = id
                ? await Utils.update('coiffeuses', id, payload)
                : await Utils.create('coiffeuses', payload);

            if (result.error) throw new Error(result.error.message);

            App.hideLoading?.();
            document.querySelector('.modal-overlay')?.remove();

            App.showNotification(
                id ? 'Coiffeuse modifiée !' : 'Coiffeuse ajoutée !',
                'success'
            );

            await this.loadData();
            this.render(document.getElementById('content-area'));

        } catch (error) {
            App.hideLoading?.();
            console.error('[Coiffeuses] saveCoiffeuse error:', error);
            App.showNotification('Erreur : ' + error.message, 'error');
        }
    },

    // =========================================================================
    // 8. toggleStatut()
    // =========================================================================
    async toggleStatut(id, statutActuel) {
        const nouveauStatut = statutActuel === 'active' ? 'inactive' : 'active';
        try {
            App.showLoading?.();
            await Utils.update('coiffeuses', id, { statut: nouveauStatut });
            App.hideLoading?.();
            App.showNotification(
                `Coiffeuse ${nouveauStatut === 'active' ? 'activée' : 'désactivée'}`,
                'success'
            );
            await this.loadData();
            this.render(document.getElementById('content-area'));
        } catch (error) {
            App.hideLoading?.();
            App.showNotification('Erreur : ' + error.message, 'error');
        }
    },

    // =========================================================================
    // 9. deleteCoiffeuse()
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
            App.showNotification('Erreur : ' + error.message, 'error');
        }
    },
};