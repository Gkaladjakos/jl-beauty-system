// Ventes Module - Part 3: Save and Utility Functions

// ─── Save vente ────────────────────────────────────────────────────────────────
Ventes.saveVente = async function(modal) {

    // Validation articles
    if (this.selectedItems.length === 0) {
        App.showNotification('Veuillez ajouter au moins un article', 'error');
        return;
    }

    const clientTelephone = document.getElementById('client-telephone').value.trim();
    if (!clientTelephone) {
        App.showNotification('Le téléphone client est obligatoire', 'error');
        return;
    }

    const modePaiement = document.querySelector('[name="mode_paiement"]').value;
    const montantPercu = parseFloat(document.getElementById('montant-percu')?.value) || 0;

    // Validation paiement insuffisant
    if (montantPercu > 0 && montantPercu < this.currentTotal) {
        App.showNotification('Montant perçu insuffisant', 'error');
        return;
    }

    try {
        App.showLoading();

        // ✅ FIX 1 — date_vente : Date.now() retourne un number, pas de .toISOString()
        //           → utiliser new Date().toISOString() à la place
        const venteData = {
            date_vente: new Date().toISOString(),
            type: this.currentType,
            client_id: null,
            client_telephone: clientTelephone,
            client_nom: document.getElementById('client-nom').value.trim() || '',
            items: JSON.stringify(this.selectedItems),
            montant_total: this.currentTotal,
            montant_percu: montantPercu || null,
            // ✅ FIX 2 — monnaie : s'assurer qu'elle ne soit jamais négative
            monnaie: montantPercu ? Math.max(0, montantPercu - this.currentTotal) : null,
            mode_paiement: modePaiement,
            commission: this.selectedItems.reduce((sum, item) => sum + (item.commission || 0), 0)
        };

        // Compatibilité rétrograde : stocker le premier article à plat
        if (this.selectedItems.length > 0) {
            const firstItem = this.selectedItems[0];
            venteData.item_id      = firstItem.id;
            venteData.item_nom     = firstItem.nom;
            venteData.quantite     = firstItem.quantite;
            venteData.prix_unitaire = firstItem.prix_unitaire;

            if (firstItem.coiffeuse_id) {
                venteData.coiffeuse_id  = firstItem.coiffeuse_id;
                venteData.coiffeuse_nom = firstItem.coiffeuse_nom;
            }
        }

        // Sauvegarde
        const result = await Utils.create('ventes', venteData);

        // ✅ FIX 3 — récupérer l'id retourné par Supabase pour l'impression du reçu
        const savedVente = (result?.data?.[0]) || venteData;

        // Mise à jour stock produits
        if (this.currentType === 'Produit') {
            for (const item of this.selectedItems) {
                const produit = this.produits.find(p => p.id === item.id);
                if (produit) {
                    // ✅ FIX 4 — ne pas descendre en dessous de 0
                    const newStock = Math.max(0, (produit.stock_actuel || 0) - item.quantite);
                    await Utils.update('produits', produit.id, { stock_actuel: newStock });
                }
            }
        }

        App.hideLoading();
        App.showNotification('Vente enregistrée avec succès');
        modal.remove();

        // Impression du reçu
        if (confirm('Voulez-vous imprimer le reçu ?')) {
            ThermalReceipt.print(savedVente);
        }

        // Rechargement
        this.render(document.getElementById('content-area'));

    } catch (error) {
        App.hideLoading();
        App.showNotification('Erreur lors de l\'enregistrement', 'error');
        console.error('[Ventes] Save error:', error);
    }
};

// ─── Détails d'une vente ────────────────────────────────────────────────────────
Ventes.showDetails = function(id) {
    const vente = this.data.find(v => v.id === id);
    if (!vente) return;

    let itemsHTML      = '';
    let totalCommission = 0;

    // ✅ FIX 5 — parser items si Supabase retourne une string JSON
    const items = typeof vente.items === 'string'
        ? (() => { try { return JSON.parse(vente.items); } catch(e) { return null; } })()
        : vente.items;

    if (items && Array.isArray(items) && items.length > 0) {
        itemsHTML = `
            <table class="w-full text-sm mb-4">
                <thead class="border-b-2 border-gray-300">
                    <tr>
                        <th class="text-left py-2">Article</th>
                        <th class="text-center py-2">Qté</th>
                        <th class="text-right py-2">P.U.</th>
                        <th class="text-right py-2">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => {
                        const subtotal = (item.prix_unitaire || 0) * (item.quantite || 1);
                        if (item.commission) totalCommission += item.commission;

                        let name = item.item_nom || item.service_nom || item.nom || '-';
                        if (item.coiffeuse_nom) {
                            name += `<br><small class="text-gray-500">${item.coiffeuse_nom}</small>`;
                        }

                        return `
                            <tr class="border-b border-gray-200">
                                <td class="py-2">${name}</td>
                                <td class="text-center">${item.quantite || 1}</td>
                                <td class="text-right">${Utils.formatCurrency(item.prix_unitaire || 0)}</td>
                                <td class="text-right font-medium">${Utils.formatCurrency(subtotal)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } else {
        // Fallback ancien format
        itemsHTML = `
            <div class="bg-gray-50 rounded p-3 mb-4">
                <p class="font-medium">${vente.item_nom || '-'}</p>
                <p class="text-sm text-gray-600">
                    Quantité: ${vente.quantite || 1} × ${Utils.formatCurrency(vente.prix_unitaire || 0)}
                </p>
            </div>
        `;
        totalCommission = vente.commission || 0;
    }

    // ✅ FIX 6 — sérialisation sécurisée pour l'attribut onclick (évite les " cassant le HTML)
    const venteJson = encodeURIComponent(JSON.stringify(vente));

    const modalContent = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                    <p class="text-sm text-gray-600">Date</p>
                    <p class="font-medium">${Utils.formatDateTime(vente.date_vente)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Type</p>
                    <p class="font-medium">${vente.type}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Client</p>
                    <p class="font-medium">${vente.client_nom || 'Anonyme'}</p>
                    <p class="text-sm text-gray-500">${vente.client_telephone || '-'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Mode de paiement</p>
                    <p class="font-medium">${vente.mode_paiement || '-'}</p>
                </div>
            </div>

            <div>
                <h4 class="font-medium text-gray-700 mb-2">Détails des articles :</h4>
                ${itemsHTML}
            </div>

            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-medium">TOTAL :</span>
                    <span class="text-2xl font-bold text-purple-700">${Utils.formatCurrency(vente.montant_total)}</span>
                </div>

                ${vente.montant_percu ? `
                    <div class="border-t border-purple-300 mt-3 pt-3 space-y-1">
                        <div class="flex justify-between text-sm">
                            <span>Montant perçu :</span>
                            <span class="font-medium">${Utils.formatCurrency(vente.montant_percu)}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span>Monnaie rendue :</span>
                            <span class="font-medium text-green-700">${Utils.formatCurrency(vente.monnaie || 0)}</span>
                        </div>
                    </div>
                ` : ''}

                ${totalCommission > 0 ? `
                    <div class="border-t border-purple-300 mt-3 pt-3">
                        <div class="flex justify-between text-sm">
                            <span>Commission :</span>
                            <span class="font-medium text-orange-700">${Utils.formatCurrency(totalCommission)}</span>
                        </div>
                    </div>
                ` : ''}
            </div>

            <div class="flex space-x-3">
                <button onclick="Ventes.printReceipt('${vente.id}')"
                        class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <i class="fas fa-print mr-2"></i>Imprimer reçu
                </button>
                <!-- ✅ FIX 6 — Télécharger via encodeURIComponent pour éviter les quotes cassant le HTML -->
                <button onclick="ThermalReceipt.download(JSON.parse(decodeURIComponent('${venteJson}')))"
                        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <i class="fas fa-download mr-2"></i>Télécharger
                </button>
            </div>
        </div>
    `;

    const modal = Utils.createModal(
        '<i class="fas fa-receipt mr-2"></i>Détails de la vente',
        modalContent,
        null
    );

    // ✅ FIX 7 — supprimer le bouton save via classe standard (pas via onclick string fragile)
    const saveBtn = modal.querySelector('.modal-save');
    if (saveBtn) saveBtn.remove();

    document.body.appendChild(modal);
};

// ─── Impression reçu ───────────────────────────────────────────────────────────
Ventes.printReceipt = function(id) {
    const vente = this.data.find(v => v.id === id);
    if (!vente) {
        App.showNotification('Vente introuvable', 'error');
        return;
    }
    ThermalReceipt.print(vente);
};

// ─── Export CSV de la période ──────────────────────────────────────────────────
Ventes.exportPeriod = function() {
    const filteredData = PeriodFilter.filterData(this.data, 'date_vente');
    const periodLabel  = PeriodFilter.getPeriodLabel();

    if (filteredData.length === 0) {
        App.showNotification('Aucune vente à exporter pour cette période', 'info');
        return;
    }

    // En-tête CSV
    let csv = 'Date;Type;Client;Téléphone;Articles;Montant;Commission;Paiement;Montant Perçu;Monnaie\n';

    filteredData.forEach(vente => {
        const date = new Date(vente.date_vente).toLocaleString('fr-FR');

        // ✅ FIX 8 — parser items JSON string si besoin
        const rawItems = typeof vente.items === 'string'
            ? (() => { try { return JSON.parse(vente.items); } catch(e) { return null; } })()
            : vente.items;

        const items = rawItems && Array.isArray(rawItems)
            ? rawItems.map(i => i.nom || i.item_nom || i.service_nom || '?').join(', ')
            : (vente.item_nom || '-');

        // ✅ FIX 9 — échapper les guillemets dans les champs CSV
        const safeName  = (vente.client_nom  || 'Anonyme').replace(/"/g, '""');
        const safeItems = items.replace(/"/g, '""');

        csv += `${date};${vente.type};"${safeName}";${vente.client_telephone || ''};"${safeItems}";`;
        csv += `${vente.montant_total};${vente.commission || 0};${vente.mode_paiement || ''};`;
        csv += `${vente.montant_percu || ''};${vente.monnaie || ''}\n`;
    });

    // Téléchargement
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ventes-${periodLabel.replace(/\s+/g, '-')}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    App.showNotification(`Export réussi : ${filteredData.length} vente(s)`);
};
