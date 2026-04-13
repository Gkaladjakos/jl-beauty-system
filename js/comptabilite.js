// =============================================================================
// COMPTABILITE MODULE — comptabilite.js
// Basé sur la même structure que Ventes.js — rien n'est altéré
// Fonctionnalités :
//   ✅ Mouvements de caisse (entrées / sorties)
//   ✅ Bilan comptable selon le plan OHADA
//   ✅ Comptes OHADA : 57 (Caisse), 70 (Ventes), 60 (Charges), etc.
//   ✅ Intégration automatique des ventes comme entrées
//   ✅ Export PDF du bilan
// =============================================================================

const Comptabilite = {

    // ─── État ────────────────────────────────────────────────────────────────
    mouvements:    [],
    ventes:        [],
    categories:    [],
    currentTotal:  0,

    // ─── Plan comptable OHADA simplifié ──────────────────────────────────────
    COMPTES_OHADA: {
        // Classe 5 — Trésorerie
        '57':  { libelle: 'Caisse',                      classe: '5', type: 'actif'  },
        '521': { libelle: 'Banque',                      classe: '5', type: 'actif'  },

        // Classe 7 — Produits (Revenus)
        '701': { libelle: 'Ventes de services',          classe: '7', type: 'produit' },
        '702': { libelle: 'Ventes de produits',          classe: '7', type: 'produit' },
        '706': { libelle: 'Autres produits d\'activité', classe: '7', type: 'produit' },
        '771': { libelle: 'Produits financiers',         classe: '7', type: 'produit' },

        // Classe 6 — Charges
        '601': { libelle: 'Achats de marchandises',      classe: '6', type: 'charge'  },
        '621': { libelle: 'Personnel — salaires',        classe: '6', type: 'charge'  },
        '622': { libelle: 'Personnel — commissions',     classe: '6', type: 'charge'  },
        '631': { libelle: 'Loyer et charges locatives',  classe: '6', type: 'charge'  },
        '641': { libelle: 'Électricité / eau / internet',classe: '6', type: 'charge'  },
        '651': { libelle: 'Fournitures de bureau',       classe: '6', type: 'charge'  },
        '661': { libelle: 'Frais bancaires',             classe: '6', type: 'charge'  },
        '671': { libelle: 'Charges exceptionnelles',     classe: '6', type: 'charge'  },
        '681': { libelle: 'Dotations amortissements',    classe: '6', type: 'charge'  },

        // Classe 4 — Tiers
        '421': { libelle: 'Personnel — avances',         classe: '4', type: 'passif'  },
        '441': { libelle: 'État — taxes et impôts',      classe: '4', type: 'passif'  },
    },

    // =========================================================================
    // HELPER — parseItems()
    // =========================================================================
    parseItems(raw) {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        try { return JSON.parse(raw); } catch(e) { return []; }
    },

    // =========================================================================
    // 1. render()
    // =========================================================================
    async render(container) {
        await this.loadAllData();

        container.innerHTML = `
            ${PeriodFilter.renderHTML('compta-period-filter')}

            <!-- ── Onglets ── -->
            <div class="mb-6 border-b border-gray-200">
                <nav class="flex space-x-4" id="compta-tabs">
                    <button onclick="Comptabilite.switchTab('mouvements')"
                            id="tab-mouvements"
                            class="tab-btn active-tab px-4 py-3 text-sm font-medium
                                   border-b-2 border-purple-600 text-purple-600">
                        <i class="fas fa-exchange-alt mr-2"></i>Mouvements de caisse
                    </button>
                    <button onclick="Comptabilite.switchTab('bilan')"
                            id="tab-bilan"
                            class="tab-btn px-4 py-3 text-sm font-medium
                                   border-b-2 border-transparent text-gray-500
                                   hover:text-gray-700 hover:border-gray-300">
                        <i class="fas fa-balance-scale mr-2"></i>Bilan OHADA
                    </button>
                    <button onclick="Comptabilite.switchTab('compte-resultat')"
                            id="tab-compte-resultat"
                            class="tab-btn px-4 py-3 text-sm font-medium
                                   border-b-2 border-transparent text-gray-500
                                   hover:text-gray-700 hover:border-gray-300">
                        <i class="fas fa-chart-line mr-2"></i>Compte de résultat
                    </button>
                </nav>
            </div>

            <!-- ── Cartes stats ── -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white rounded-lg shadow-md p-5">
                    <p class="text-xs text-gray-500 uppercase font-medium">
                        Solde caisse
                    </p>
                    <p id="stat-solde"
                       class="text-2xl font-bold text-purple-600 mt-1">$0.00</p>
                    <p class="text-xs text-gray-400 mt-1">Compte 57</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-5">
                    <p class="text-xs text-gray-500 uppercase font-medium">
                        Total entrées
                    </p>
                    <p id="stat-entrees"
                       class="text-2xl font-bold text-green-600 mt-1">$0.00</p>
                    <p class="text-xs text-gray-400 mt-1">Produits classe 7</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-5">
                    <p class="text-xs text-gray-500 uppercase font-medium">
                        Total sorties
                    </p>
                    <p id="stat-sorties"
                       class="text-2xl font-bold text-red-600 mt-1">$0.00</p>
                    <p class="text-xs text-gray-400 mt-1">Charges classe 6</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-5">
                    <p class="text-xs text-gray-500 uppercase font-medium">
                        Résultat net
                    </p>
                    <p id="stat-resultat"
                       class="text-2xl font-bold text-blue-600 mt-1">$0.00</p>
                    <p class="text-xs text-gray-400 mt-1">Produits - Charges</p>
                </div>
            </div>

            <!-- ── Bouton enregistrer mouvement ── -->
            <div id="compta-actions" class="mb-4 flex justify-between items-center">
                <button onclick="Comptabilite.showAddModal()"
                        class="px-4 py-2 bg-purple-600 text-white rounded-lg
                               hover:bg-purple-700">
                    <i class="fas fa-plus mr-2"></i>Enregistrer un mouvement
                </button>
                <button onclick="Comptabilite.importVentes()"
                        class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg
                               hover:bg-blue-200 border border-blue-300">
                    <i class="fas fa-sync mr-2"></i>Importer les ventes du jour
                </button>
            </div>

            <!-- ── Panneaux ── -->
            <div id="panel-mouvements">
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="table-container">
                        <table class="w-full">
                            <thead class="bg-gray-50 border-b">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs
                                               font-medium text-gray-500 uppercase">
                                        Date
                                    </th>
                                    <th class="px-4 py-3 text-left text-xs
                                               font-medium text-gray-500 uppercase">
                                        Libellé
                                    </th>
                                    <th class="px-4 py-3 text-left text-xs
                                               font-medium text-gray-500 uppercase">
                                        Compte OHADA
                                    </th>
                                    <th class="px-4 py-3 text-left text-xs
                                               font-medium text-gray-500 uppercase">
                                        Type
                                    </th>
                                    <th class="px-4 py-3 text-right text-xs
                                               font-medium text-gray-500 uppercase">
                                        Débit
                                    </th>
                                    <th class="px-4 py-3 text-right text-xs
                                               font-medium text-gray-500 uppercase">
                                        Crédit
                                    </th>
                                    <th class="px-4 py-3 text-right text-xs
                                               font-medium text-gray-500 uppercase">
                                        Solde
                                    </th>
                                    <th class="px-4 py-3 text-center text-xs
                                               font-medium text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="mouvements-table"
                                   class="divide-y divide-gray-200"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="panel-bilan" class="hidden"></div>
            <div id="panel-compte-resultat" class="hidden"></div>`;

        PeriodFilter.setup(() => {
            this.renderMouvements();
            this.updateStats();
        });

        this.renderMouvements();
        this.updateStats();
    },

    // =========================================================================
    // 2. loadAllData()
    // =========================================================================
    async loadAllData() {
        try {
            const [mvtData, ventesData] = await Promise.all([
                Utils.get('mouvements_caisse'),
                Utils.get('ventes')
            ]);
            this.mouvements = mvtData.data    || [];
            this.ventes     = ventesData.data || [];
        } catch (error) {
            console.error('[Comptabilite] loadAllData error:', error);
        }
    },

    // =========================================================================
    // 3. updateStats()
    // =========================================================================
    updateStats() {
        const filtered = PeriodFilter.filterData(this.mouvements, 'date_mouvement');

        const totalEntrees = filtered
            .filter(m => m.type_mouvement === 'Entree')
            .reduce((s, m) => s + (m.montant || 0), 0);

        const totalSorties = filtered
            .filter(m => m.type_mouvement === 'Sortie')
            .reduce((s, m) => s + (m.montant || 0), 0);

        const solde    = totalEntrees - totalSorties;
        const resultat = totalEntrees - totalSorties;

        document.getElementById('stat-solde').textContent
            = Utils.formatCurrency(solde);
        document.getElementById('stat-entrees').textContent
            = Utils.formatCurrency(totalEntrees);
        document.getElementById('stat-sorties').textContent
            = Utils.formatCurrency(totalSorties);
        document.getElementById('stat-resultat').textContent
            = Utils.formatCurrency(resultat);

        // Couleur dynamique du résultat
        const resultEl = document.getElementById('stat-resultat');
        if (resultEl) {
            resultEl.className = resultat >= 0
                ? 'text-2xl font-bold text-green-600 mt-1'
                : 'text-2xl font-bold text-red-600 mt-1';
        }
    },

    // =========================================================================
    // 4. switchTab()
    // =========================================================================
    switchTab(tab) {
        // Masquer tous les panneaux
        ['mouvements', 'bilan', 'compte-resultat'].forEach(t => {
            document.getElementById(`panel-${t}`)?.classList.add('hidden');
        });

        // Désactiver tous les boutons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.className = btn.className
                .replace('border-purple-600 text-purple-600', '')
                .replace('border-transparent text-gray-500', '')
                + ' border-b-2 border-transparent text-gray-500';
        });

        // Activer le panneau sélectionné
        document.getElementById(`panel-${tab}`)?.classList.remove('hidden');
        const activeBtn = document.getElementById(`tab-${tab}`);
        if (activeBtn) {
            activeBtn.className = activeBtn.className
                .replace('border-transparent text-gray-500', '')
                + ' border-purple-600 text-purple-600';
        }

        // Afficher les boutons d'action seulement sur mouvements
        const actions = document.getElementById('compta-actions');
        if (actions) {
            actions.style.display = tab === 'mouvements' ? '' : 'none';
        }

        // Rendre le contenu du panneau
        if (tab === 'bilan')           this.renderBilan();
        if (tab === 'compte-resultat') this.renderCompteResultat();
    },

// =========================================================================
// 5. renderMouvements()  ✅ CORRIGÉ
// =========================================================================
renderMouvements() {
    const tbody = document.getElementById('mouvements-table');
    if (!tbody) return;

    const filtered = PeriodFilter.filterData(
        this.mouvements, 'date_mouvement'
    ).sort((a, b) =>
        new Date(b.date_mouvement) - new Date(a.date_mouvement)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-2 block"></i>
                    <p>Aucun mouvement pour cette période</p>
                </td>
            </tr>`;
        return;
    }

    // Calculer le solde cumulatif
    let soldeCumul = 0;
    const lignes = [...filtered].reverse().map(mvt => {
        if (mvt.type_mouvement === 'Entree') {
            soldeCumul += mvt.montant || 0;
        } else {
            soldeCumul -= mvt.montant || 0;
        }
        return { ...mvt, soldeCumul };
    }).reverse();

    // ✅ CORRECTION 1 — Ligne supprimée (mvt hors scope + jamais utilisée)
    // ❌ const compte = this.COMPTES_OHADA[mvt?.compte_ohada] || null;

    tbody.innerHTML = lignes.map(mvt => {
        const compteInfo  = this.COMPTES_OHADA[mvt.compte_ohada];
        const compteLabel = compteInfo
            ? `<span class="font-mono text-xs bg-gray-100 px-1 rounded">
                   ${mvt.compte_ohada}
               </span>
               <span class="text-xs text-gray-500 ml-1">
                   ${compteInfo.libelle}
               </span>`
            : `<span class="text-xs text-gray-400">—</span>`;

        const typeBadge = mvt.type_mouvement === 'Entree'
            ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs
                           font-medium bg-green-100 text-green-800">
                   <i class="fas fa-arrow-down mr-1"></i>Entrée
               </span>`
            // ✅ CORRECTION 2 — "bg-red-100 -800" → "bg-red-100 text-red-800"
            : `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs
                           font-medium bg-red-100 text-red-800">
                   <i class="fas fa-arrow-up mr-1"></i>Sortie
               </span>`;

        const debit  = mvt.type_mouvement === 'Sortie'
            ? `<span class="text-red-600 font-medium">
                   ${Utils.formatCurrency(mvt.montant)}
               </span>`
            : '<span class="text-gray-300">—</span>';

        const credit = mvt.type_mouvement === 'Entree'
            ? `<span class="text-green-600 font-medium">
                   ${Utils.formatCurrency(mvt.montant)}
               </span>`
            : '<span class="text-gray-300">—</span>';

        const soldeClass = mvt.soldeCumul >= 0
            ? 'text-blue-700 font-semibold'
            : 'text-red-700 font-semibold';

        const sourceIcon = mvt.source === 'vente'
            ? '<i class="fas fa-shopping-cart text-purple-400 mr-1"'
              + ' title="Importé depuis les ventes"></i>'
            : '';

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-xs text-gray-600">
                    ${Utils.formatDateTime(mvt.date_mouvement)}
                </td>
                <td class="px-4 py-3 text-sm">
                    ${sourceIcon}
                    <span class="font-medium">${mvt.libelle || '—'}</span>
                    ${mvt.reference
                        ? `<div class="text-xs text-gray-400">
                               Réf: ${mvt.reference}
                           </div>`
                        : ''}
                </td>
                <td class="px-4 py-3">${compteLabel}</td>
                <td class="px-4 py-3">${typeBadge}</td>
                <td class="px-4 py-3 text-right text-sm">${debit}</td>
                <td class="px-4 py-3 text-right text-sm">${credit}</td>
                <td class="px-4 py-3 text-right text-sm ${soldeClass}">
                    ${Utils.formatCurrency(mvt.soldeCumul)}
                </td>
                <td class="px-4 py-3 text-center">
                    ${mvt.source !== 'vente' ? `
                    <button onclick="Comptabilite.deleteMouvement('${mvt.id}')"
                            class="text-red-400 hover:text-red-600 text-xs"
                            title="Supprimer">
                        <i class="fas fa-trash-alt"></i>
                    </button>` : ''}
                </td>
            </tr>`;
    }).join('');
},
    // =========================================================================
    // 6. showAddModal()
    // =========================================================================
    showAddModal() {
        const today = new Date().toISOString().slice(0, 10);

        const comptesEntree = Object.entries(this.COMPTES_OHADA)
            .filter(([_, c]) => c.type === 'produit' || c.type === 'actif')
            .map(([code, c]) => `
                <option value="${code}">
                    ${code} — ${c.libelle}
                </option>`)
            .join('');

        const comptesSortie = Object.entries(this.COMPTES_OHADA)
            .filter(([_, c]) => c.type === 'charge' || c.type === 'passif')
            .map(([code, c]) => `
                <option value="${code}">
                    ${code} — ${c.libelle}
                </option>`)
            .join('');

        const modalContent = `
            <form id="mouvement-form" class="space-y-4">

                <!-- Type de mouvement -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Type de mouvement *
                    </label>
                    <div class="grid grid-cols-2 gap-3">
                        <button type="button"
                                onclick="Comptabilite.setMouvementType('Entree')"
                                id="btn-entree"
                                class="px-4 py-3 border-2 border-green-600
                                       bg-green-50 text-green-700 rounded-lg
                                       font-medium hover:bg-green-100">
                            <i class="fas fa-arrow-down mr-2"></i>Entrée
                        </button>
                        <button type="button"
                                onclick="Comptabilite.setMouvementType('Sortie')"
                                id="btn-sortie"
                                class="px-4 py-3 border-2 border-gray-300
                                       text-gray-600 rounded-lg font-medium
                                       hover:bg-gray-50">
                            <i class="fas fa-arrow-up mr-2"></i>Sortie
                        </button>
                    </div>
                    <input type="hidden" id="type-mouvement" value="Entree">
                </div>

                <!-- Date -->
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <label class="block text-sm font-medium text-amber-800 mb-1">
                        <i class="fas fa-calendar-alt mr-2"></i>Date du mouvement
                    </label>
                    <input type="date" id="date-mouvement"
                           value="${today}"
                           class="w-full px-3 py-2 border border-amber-300
                                  rounded-lg bg-white text-sm">
                </div>

                <!-- Libellé -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Libellé *
                    </label>
                    <input type="text" id="mouvement-libelle" required
                           class="w-full px-3 py-2 border border-gray-300
                                  rounded-lg text-sm"
                           placeholder="Ex: Paiement loyer janvier">
                </div>

                <!-- Compte OHADA -->
                <div id="compte-selector">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Compte OHADA *
                    </label>
                    <select id="compte-ohada"
                            class="w-full px-3 py-2 border border-gray-300
                                   rounded-lg text-sm">
                        <option value="">Choisir un compte...</option>
                        ${comptesEntree}
                    </select>
                    <p id="compte-description"
                       class="text-xs text-gray-400 mt-1"></p>
                </div>

                <!-- Montant -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Montant *
                        </label>
                        <input type="number" id="mouvement-montant"
                               step="0.01" min="0.01" required
                               class="w-full px-3 py-2 border border-gray-300
                                      rounded-lg text-sm"
                               placeholder="0.00">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Référence (optionnel)
                        </label>
                        <input type="text" id="mouvement-reference"
                               class="w-full px-3 py-2 border border-gray-300
                                      rounded-lg text-sm"
                               placeholder="N° facture, reçu...">
                    </div>
                </div>

                <!-- Mode de paiement -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Mode de paiement
                    </label>
                    <select id="mouvement-mode-paiement"
                            class="w-full px-3 py-2 border border-gray-300
                                   rounded-lg text-sm">
                        <option value="Espèces">Espèces</option>
                        <option value="Banque">Virement bancaire</option>
                        <option value="Mobile Money">Mobile Money</option>
                        <option value="Chèque">Chèque</option>
                    </select>
                </div>

                <!-- Note -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Note (optionnel)
                    </label>
                    <textarea id="mouvement-note" rows="2"
                              class="w-full px-3 py-2 border border-gray-300
                                     rounded-lg text-sm"
                              placeholder="Informations complémentaires..."></textarea>
                </div>
            </form>`;

        const modal = Utils.createModal(
            '<i class="fas fa-exchange-alt mr-2"></i>Enregistrer un mouvement',
            modalContent,
            () => Comptabilite.saveMouvement(modal)
        );

        document.body.appendChild(modal);
        this.setMouvementType('Entree');

        document.getElementById('compte-ohada')
            ?.addEventListener('change', function() {
                const code = this.value;
                const desc = document.getElementById('compte-description');
                const info = Comptabilite.COMPTES_OHADA[code];
                if (desc && info) {
                    desc.textContent =
                        `Classe ${info.classe} — ${info.type.toUpperCase()}`;
                }
            });
    },

    // =========================================================================
    // 7. setMouvementType()
    // =========================================================================
    setMouvementType(type) {
        document.getElementById('type-mouvement').value = type;

        const btnE = document.getElementById('btn-entree');
        const btnS = document.getElementById('btn-sortie');

        if (type === 'Entree') {
            btnE.className = 'px-4 py-3 border-2 border-green-600 ' +
                'bg-green-50 text-green-700 rounded-lg font-medium ' +
                'hover:bg-green-100';
            btnS.className = 'px-4 py-3 border-2 border-gray-300 ' +
                'text-gray-600 rounded-lg font-medium hover:bg-gray-50';
        } else {
            btnS.className = 'px-4 py-3 border-2 border-red-600 ' +
                'bg-red-50 text-red-700 rounded-lg font-medium ' +
                'hover:bg-red-100';
            btnE.className = 'px-4 py-3 border-2 border-gray-300 ' +
                'text-gray-600 rounded-lg font-medium hover:bg-gray-50';
        }

        // Recharger les comptes OHADA selon le type
        const select   = document.getElementById('compte-ohada');
        const isEntree = type === 'Entree';
        const filtres  = isEntree
            ? ['produit', 'actif']
            : ['charge', 'passif'];

        select.innerHTML = '<option value="">Choisir un compte...</option>';
        Object.entries(this.COMPTES_OHADA)
            .filter(([_, c]) => filtres.includes(c.type))
            .forEach(([code, c]) => {
                const opt = document.createElement('option');
                opt.value       = code;
                opt.textContent = `${code} — ${c.libelle}`;
                select.appendChild(opt);
            });
    },

    // =========================================================================
    // 8. saveMouvement()
    // =========================================================================
    async saveMouvement(modal) {
        const type         = document.getElementById('type-mouvement')?.value;
        const date         = document.getElementById('date-mouvement')?.value;
        const libelle      = document.getElementById('mouvement-libelle')?.value?.trim();
        const compte       = document.getElementById('compte-ohada')?.value;
        const montant      = parseFloat(
            document.getElementById('mouvement-montant')?.value
        );
        const reference    = document.getElementById('mouvement-reference')?.value?.trim();
        const modePaiement = document.getElementById('mouvement-mode-paiement')?.value;
        const note         = document.getElementById('mouvement-note')?.value?.trim();

        if (!type || !libelle || !compte || !montant || montant <= 0) {
            App.showNotification(
                'Veuillez remplir tous les champs obligatoires', 'error'
            );
            return;
        }

        const payload = {
            type_mouvement: type,
            date_mouvement: date
                ? new Date(date + 'T12:00:00').toISOString()
                : new Date().toISOString(),
            libelle,
            compte_ohada:    compte,
            montant,
            reference:       reference || null,
            mode_paiement:   modePaiement,
            note:            note || null,
            source:          'manuel',
        };

        try {
            App.showLoading?.();
            const result = await Utils.create('mouvements_caisse', payload);
            if (result.error) throw new Error(result.error.message);
            App.hideLoading?.();

            if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
            else if (modal) modal.style.display = 'none';

            App.showNotification('Mouvement enregistré !', 'success');

            await this.loadAllData();
            this.renderMouvements();
            this.updateStats();

        } catch (error) {
            App.hideLoading?.();
            console.error('[Comptabilite] saveMouvement error:', error);
            App.showNotification('Erreur : ' + error.message, 'error');
        }
    },

    // =========================================================================
    // 9. importVentes()
    // =========================================================================
    async importVentes() {
        const today  = new Date().setHours(0, 0, 0, 0);
        const ventes = this.ventes.filter(v => {
            const d = new Date(v.date_vente).setHours(0, 0, 0, 0);
            return d === today;
        });

        if (ventes.length === 0) {
            App.showNotification('Aucune vente à importer pour aujourd\'hui', 'info');
            return;
        }

        const dejaImportes = this.mouvements.filter(
            m => m.source === 'vente'
        ).map(m => m.reference);

        const aImporter = ventes.filter(
            v => !dejaImportes.includes(v.id)
        );

        if (aImporter.length === 0) {
            App.showNotification('Toutes les ventes du jour sont déjà importées', 'info');
            return;
        }

        try {
            App.showLoading?.();
            let count = 0;

            for (const vente of aImporter) {
                const compteOhada = vente.type === 'Produit' ? '702' : '701';
                await Utils.create('mouvements_caisse', {
                    type_mouvement: 'Entree',
                    date_mouvement: vente.date_vente,
                    libelle:        `Vente — ${vente.client_nom || 'Anonyme'}`,
                    compte_ohada:   compteOhada,
                    montant:        vente.montant_total,
                    reference:      vente.id,
                    mode_paiement:  vente.mode_paiement || 'Espèces',
                    note:           `Type: ${vente.type}`,
                    source:         'vente',
                });
                count++;
            }

            App.hideLoading?.();
            App.showNotification(
                `${count} vente(s) importée(s) en comptabilité !`, 'success'
            );

            await this.loadAllData();
            this.renderMouvements();
            this.updateStats();

        } catch (error) {
            App.hideLoading?.();
            console.error('[Comptabilite] importVentes error:', error);
            App.showNotification('Erreur lors de l\'import : ' + error.message, 'error');
        }
    },

    // =========================================================================
    // 10. deleteMouvement()
    // =========================================================================
    async deleteMouvement(id) {
        if (!confirm('Supprimer ce mouvement ?')) return;
        try {
            await Utils.delete('mouvements_caisse', id);
            App.showNotification('Mouvement supprimé', 'success');
            await this.loadAllData();
            this.renderMouvements();
            this.updateStats();
        } catch (error) {
            App.showNotification('Erreur : ' + error.message, 'error');
        }
    },
      // =========================================================================
    // 11. renderBilan()  ✅ Structure OHADA
    // =========================================================================
    renderBilan() {
        const panel    = document.getElementById('panel-bilan');
        const filtered = PeriodFilter.filterData(
            this.mouvements, 'date_mouvement'
        );

        // Regrouper par compte
        const parCompte = {};
        filtered.forEach(mvt => {
            const code = mvt.compte_ohada;
            if (!parCompte[code]) parCompte[code] = { debit: 0, credit: 0 };
            if (mvt.type_mouvement === 'Entree') parCompte[code].credit += mvt.montant || 0;
            else                                  parCompte[code].debit  += mvt.montant || 0;
        });

        const renderLigneCompte = (code) => {
            const info   = this.COMPTES_OHADA[code];
            const totaux = parCompte[code] || { debit: 0, credit: 0 };
            const solde  = totaux.credit - totaux.debit;
            if (solde === 0 && !parCompte[code]) return '';
            return `
                <tr class="hover:bg-gray-50 border-b border-gray-100">
                    <td class="px-4 py-2 font-mono text-sm text-gray-600">
                        ${code}
                    </td>
                    <td class="px-4 py-2 text-sm">${info?.libelle || '—'}</td>
                    <td class="px-4 py-2 text-right text-sm text-red-600">
                        ${totaux.debit > 0 ? Utils.formatCurrency(totaux.debit) : '—'}
                    </td>
                    <td class="px-4 py-2 text-right text-sm text-green-600">
                        ${totaux.credit > 0 ? Utils.formatCurrency(totaux.credit) : '—'}
                    </td>
                    <td class="px-4 py-2 text-right text-sm font-semibold
                               ${solde >= 0 ? 'text-blue-600' : 'text-red-600'}">
                        ${Utils.formatCurrency(Math.abs(solde))}
                        ${solde < 0 ? '<span class="text-xs">(D)</span>' : ''}
                    </td>
                </tr>`;
        };

        const totalActif = Object.entries(parCompte)
            .filter(([code]) => {
                const info = this.COMPTES_OHADA[code];
                return info?.type === 'actif';
            })
            .reduce((s, [_, t]) => s + (t.credit - t.debit), 0);

        const totalPassif = Object.entries(parCompte)
            .filter(([code]) => {
                const info = this.COMPTES_OHADA[code];
                return info?.type === 'passif';
            })
            .reduce((s, [_, t]) => s + (t.credit - t.debit), 0);

        const totalProduits = Object.entries(parCompte)
            .filter(([code]) => this.COMPTES_OHADA[code]?.type === 'produit')
            .reduce((s, [_, t]) => s + (t.credit - t.debit), 0);

        const totalCharges = Object.entries(parCompte)
            .filter(([code]) => this.COMPTES_OHADA[code]?.type === 'charge')
            .reduce((s, [_, t]) => s + (t.debit - t.credit), 0);

        const resultatNet = totalProduits - totalCharges;

        const lignesActif    = ['57', '521']
            .map(renderLigneCompte).join('');
        const lignesPassif   = ['421', '441']
            .map(renderLigneCompte).join('');
        const lignesProduits = ['701', '702', '706', '771']
            .map(renderLigneCompte).join('');
        const lignesCharges  = ['601', '621', '622', '631',
                                '641', '651', '661', '671', '681']
            .map(renderLigneCompte).join('');

        panel.innerHTML = `
            <div class="space-y-6">

                <!-- Bouton export -->
                <div class="flex justify-end">
                    <button onclick="Comptabilite.exportBilan()"
                            class="px-4 py-2 bg-purple-600 text-white
                                   rounded-lg hover:bg-purple-700 text-sm">
                        <i class="fas fa-file-pdf mr-2"></i>Exporter le bilan PDF
                    </button>
                </div>

                <!-- ─ ACTIF ─ -->
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="bg-blue-700 px-6 py-3">
                        <h3 class="text-white font-bold text-sm uppercase
                                   tracking-wide">
                            <i class="fas fa-coins mr-2"></i>
                            ACTIF — Classe 5 (Trésorerie)
                        </h3>
                    </div>
                    <table class="w-full">
                        <thead class="bg-blue-50 border-b">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs
                                           font-medium text-gray-500">N° Cpte</th>
                                <th class="px-4 py-2 text-left text-xs
                                           font-medium text-gray-500">Libellé</th>
                                <th class="px-4 py-2 text-right text-xs
                                           font-medium text-gray-500">Débit</th>
                                <th class="px-4 py-2 text-right text-xs
                                           font-medium text-gray-500">Crédit</th>
                                <th class="px-4 py-2 text-right text-xs
                                           font-medium text-gray-500">Solde</th>
                            </tr>
                        </thead>
                        <tbody>${lignesActif || '<tr><td colspan="5" class="text-center py-4 text-gray-400">Aucun mouvement</td></tr>'}</tbody>
                        <tfoot class="bg-blue-50 border-t-2 border-blue-200">
                            <tr>
                                <td colspan="4" class="px-4 py-2 font-bold text-blue-800">
                                    TOTAL ACTIF
                                </td>
                                <td class="px-4 py-2 text-right font-bold text-blue-800">
                                    ${Utils.formatCurrency(Math.abs(totalActif))}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- ─ PRODUITS ─ -->
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="bg-green-700 px-6 py-3">
                        <h3 class="text-white font-bold text-sm uppercase tracking-wide">
                            <i class="fas fa-arrow-down mr-2"></i>
                            PRODUITS — Classe 7
                        </h3>
                    </div>
                    <table class="w-full">
                        <thead class="bg-green-50 border-b">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs
                                           font-medium text-gray-500">N° Cpte</th>
                                <th class="px-4 py-2 text-left text-xs
                                           font-medium text-gray-500">Libellé</th>
                                <th class="px-4 py-2 text-right text-xs
                                           font-medium text-gray-500">Débit</th>
                                <th class="px-4 py-2 text-right text-xs
                                           font-medium text-gray-500">Crédit</th>
                                <th class="px-4 py-2 text-right text-xs
                                           font-medium text-gray-500">Montant</th>
                            </tr>
                        </thead>
                        <tbody>${lignesProduits || '<tr><td colspan="5" class="text-center py-4 text-gray-400">Aucun produit</td></tr>'}</tbody>
                        <tfoot class="bg-green-50 border-t-2 border-green-200">
                            <tr>
                                <td colspan="4"
                                    class="px-4 py-2 font-bold text-green-800">
                                    TOTAL PRODUITS
                                </td>
                                <td class="px-4 py-2 text-right font-bold text-green-800">
                                    ${Utils.formatCurrency(totalProduits)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- ─ CHARGES ─ -->
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="bg-red-700 px-6 py-3">
                        <h3 class="text-white font-bold text-sm uppercase tracking-wide">
                            <i class="fas fa-arrow-up mr-2"></i>
                            CHARGES — Classe 6
                        </h3>
                    </div>
                    <table class="w-full">
                        <thead class="bg-red-50 border-b">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs
                                           font-medium text-gray-500">N° Cpte</th>
                                <th class="px-4 py-2 text-left text-xs
                                           font-medium text-gray-500">Libellé</th>
                                <th class="px-4 py-2 text-right text-xs
                                           font-medium text-gray-500">Débit</th>
                                <th class="px-4 py-2 text-right text-xs
                                           font-medium text-gray-500">Crédit</th>
                                <th class="px-4 py-2 text-right text-xs
                                           font-medium text-gray-500">Montant</th>
                            </tr>
                        </thead>
                        <tbody>${lignesCharges || '<tr><td colspan="5" class="text-center py-4 text-gray-400">Aucune charge</td></tr>'}</tbody>
                        <tfoot class="bg-red-50 border-t-2 border-red-200">
                            <tr>
                                <td colspan="4"
                                    class="px-4 py-2 font-bold text-red-800">
                                    TOTAL CHARGES
                                </td>
                                <td class="px-4 py-2 text-right font-bold text-red-800">
                                    ${Utils.formatCurrency(totalCharges)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- ─ RÉSULTAT NET ─ -->
                <div class="rounded-lg p-6 border-2
                            ${resultatNet >= 0
                                ? 'bg-green-50 border-green-400'
                                : 'bg-red-50 border-red-400'}">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="text-lg font-bold
                                       ${resultatNet >= 0
                                           ? 'text-green-800'
                                           : 'text-red-800'}">
                                <i class="fas fa-balance-scale mr-2"></i>
                                RÉSULTAT NET DE L'EXERCICE
                            </h3>
                            <p class="text-sm text-gray-500 mt-1">
                                Total Produits − Total Charges
                            </p>
                        </div>
                        <div class="text-3xl font-bold
                                    ${resultatNet >= 0
                                        ? 'text-green-700'
                                        : 'text-red-700'}">
                            ${resultatNet >= 0 ? '+' : ''}${Utils.formatCurrency(resultatNet)}
                            <div class="text-sm font-normal text-gray-500 text-right mt-1">
                                ${resultatNet >= 0 ? '✅ Bénéfice' : '⚠️ Déficit'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    // =========================================================================
    // 12. renderCompteResultat()
    // =========================================================================
    renderCompteResultat() {
        const panel    = document.getElementById('panel-compte-resultat');
        const filtered = PeriodFilter.filterData(
            this.mouvements, 'date_mouvement'
        );

        const produits = filtered.filter(m => {
            return this.COMPTES_OHADA[m.compte_ohada]?.type === 'produit';
        });
        const charges = filtered.filter(m => {
            return this.COMPTES_OHADA[m.compte_ohada]?.type === 'charge';
        });

        const totalProduits = produits.reduce((s, m) => s + (m.montant || 0), 0);
        const totalCharges  = charges.reduce((s,  m) => s + (m.montant || 0), 0);
        const resultat      = totalProduits - totalCharges;
        const margePercent  = totalProduits > 0
            ? ((resultat / totalProduits) * 100).toFixed(1)
            : 0;

        // Regrouper produits par compte
        const groupProduits = {};
        produits.forEach(m => {
            const code = m.compte_ohada;
            if (!groupProduits[code]) {
                groupProduits[code] = {
                    libelle: this.COMPTES_OHADA[code]?.libelle || code,
                    montant: 0
                };
            }
            groupProduits[code].montant += m.montant || 0;
        });

        // Regrouper charges par compte
        const groupCharges = {};
        charges.forEach(m => {
            const code = m.compte_ohada;
            if (!groupCharges[code]) {
                groupCharges[code] = {
                    libelle: this.COMPTES_OHADA[code]?.libelle || code,
                    montant: 0
                };
            }
            groupCharges[code].montant += m.montant || 0;
        });

        const renderGroup = (group, colorClass) =>
            Object.entries(group).map(([code, data]) => `
                <div class="flex justify-between items-center
                            py-2 border-b border-gray-100">
                    <div>
                        <span class="font-mono text-xs text-gray-400
                                     mr-2">${code}</span>
                        <span class="text-sm">${data.libelle}</span>
                    </div>
                    <span class="font-medium ${colorClass}">
                        ${Utils.formatCurrency(data.montant)}
                    </span>
                </div>`).join('');

        panel.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                <!-- Colonne Produits -->
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="bg-green-700 px-6 py-3 flex justify-between">
                        <h3 class="text-white font-bold text-sm uppercase">
                            <i class="fas fa-plus-circle mr-2"></i>PRODUITS
                        </h3>
                        <span class="text-green-200 text-sm font-bold">
                            ${Utils.formatCurrency(totalProduits)}
                        </span>
                    </div>
                    <div class="p-4 space-y-1">
                        ${renderGroup(groupProduits, 'text-green-700')
                            || '<p class="text-gray-400 text-sm text-center py-4">Aucun produit</p>'}
                    </div>
                    <div class="bg-green-50 px-4 py-3 flex justify-between
                                border-t-2 border-green-200 font-bold">
                        <span class="text-green-800">TOTAL PRODUITS</span>
                        <span class="text-green-800">
                            ${Utils.formatCurrency(totalProduits)}
                        </span>
                    </div>
                </div>

                <!-- Colonne Charges -->
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="bg-red-700 px-6 py-3 flex justify-between">
                        <h3 class="text-white font-bold text-sm uppercase">
                            <i class="fas fa-minus-circle mr-2"></i>CHARGES
                        </h3>
                        <span class="text-red-200 text-sm font-bold">
                            ${Utils.formatCurrency(totalCharges)}
                        </span>
                    </div>
                    <div class="p-4 space-y-1">
                        ${renderGroup(groupCharges, 'text-red-700')
                            || '<p class="text-gray-400 text-sm text-center py-4">Aucune charge</p>'}
                    </div>
                    <div class="bg-red-50 px-4 py-3 flex justify-between
                                border-t-2 border-red-200 font-bold">
                        <span class="text-red-800">TOTAL CHARGES</span>
                        <span class="text-red-800">
                            ${Utils.formatCurrency(totalCharges)}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Résultat final -->
            <div class="mt-6 bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                    <i class="fas fa-chart-line mr-2 text-purple-600"></i>
                    Synthèse du compte de résultat
                </h3>
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div class="bg-green-50 rounded-lg p-4">
                        <p class="text-xs text-gray-500 uppercase font-medium">
                            Produits
                        </p>
                        <p class="text-2xl font-bold text-green-700 mt-1">
                            ${Utils.formatCurrency(totalProduits)}
                        </p>
                    </div>
                    <div class="bg-red-50 rounded-lg p-4">
                        <p class="text-xs text-gray-500 uppercase font-medium">
                            Charges
                        </p>
                        <p class="text-2xl font-bold text-red-700 mt-1">
                            ${Utils.formatCurrency(totalCharges)}
                        </p>
                    </div>
                    <div class="rounded-lg p-4
                                ${resultat >= 0 ? 'bg-blue-50' : 'bg-orange-50'}">
                        <p class="text-xs text-gray-500 uppercase font-medium">
                            Résultat net
                        </p>
                        <p class="text-2xl font-bold mt-1
                                  ${resultat >= 0
                                      ? 'text-blue-700'
                                      : 'text-orange-700'}">
                            ${resultat >= 0 ? '+' : ''}${Utils.formatCurrency(resultat)}
                        </p>
                        <p class="text-xs text-gray-400 mt-1">
                            Marge : ${margePercent}%
                        </p>
                    </div>
                </div>
            </div>`;
    },

    // =========================================================================
    // 13. exportBilan()  ✅ Export PDF via window.print()
    // =========================================================================
    exportBilan() {
        const periodeLabel = PeriodFilter.getLabel?.() || 'Période sélectionnée';
        const dateExport   = new Date().toLocaleString('fr-FR');
        const panel        = document.getElementById('panel-bilan');

        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Bilan OHADA — ${periodeLabel}</title>
    <style>
        @page { size: A4; margin: 15mm; }
        body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            color: #111;
        }
        h1 { font-size: 16pt; text-align: center; margin-bottom: 4px; }
        .subtitle { text-align: center; color: #666; font-size: 9pt; }
        .section-title {
            background: #1e3a5f;
            color: white;
            padding: 6px 12px;
            font-weight: bold;
            margin-top: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
        }
        th {
            background: #f0f4f8;
            border: 1px solid #ccc;
            padding: 5px 8px;
            text-align: left;
            font-size: 9pt;
        }
        td {
            border: 1px solid #ccc;
            padding: 5px 8px;
            font-size: 9pt;
        }
        .text-right { text-align: right; }
        .total-row {
            background: #e8f0fe;
            font-weight: bold;
        }
        .resultat-box {
            margin-top: 16px;
            border: 2px solid #1e3a5f;
            padding: 12px;
            text-align: center;
        }
        .resultat-box .montant {
            font-size: 18pt;
            font-weight: bold;
            color: #1e3a5f;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 8pt;
            color: #888;
            border-top: 1px solid #ccc;
            padding-top: 8px;
        }
    </style>
</head>
<body>
    <h1>JL BEAUTY — BILAN COMPTABLE</h1>
    <p class="subtitle">
        Plan comptable OHADA — ${periodeLabel}
        <br>Édité le ${dateExport}
    </p>
    ${panel?.innerHTML || '<p>Aucune donnée</p>'}
    <div class="footer">
        Document généré automatiquement — JL Beauty Management System
    </div>
</body>
</html>`;

        const win = window.open('', '_blank', 'width=800,height=900');
        if (!win) {
            App.showNotification(
                'Autorisez les popups pour exporter', 'warning'
            );
            return;
        }
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.onload = () => win.print();
    },

}; // ← fin Comptabilite