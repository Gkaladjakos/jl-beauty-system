// Ventes Module - Part 3: Save and Utility Functions

// Save vente
Ventes.saveVente = async function(modal) {
    // Validation
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
    
    // Validate payment
    if (montantPercu > 0 && montantPercu < this.currentTotal) {
        App.showNotification('Montant perçu insuffisant', 'error');
        return;
    }
    
    try {
        App.showLoading();
        
        // Build vente data
        const venteData = {
            date_vente: Date.now().toISOString()
            type: this.currentType,
            client_id: null, // Could be linked to client if exists
            client_telephone: clientTelephone,
            client_nom: document.getElementById('client-nom').value.trim() || '',
            items: JSON.stringify(this.selectedItems),
            montant_total: this.currentTotal,
            montant_percu: montantPercu || null,
            monnaie: montantPercu ? (montantPercu - this.currentTotal) : null,
            mode_paiement: modePaiement,
            commission: this.selectedItems.reduce((sum, item) => sum + (item.commission || 0), 0)
        };
        
        // For backward compatibility, also store first item details
        if (this.selectedItems.length > 0) {
            const firstItem = this.selectedItems[0];
            venteData.item_id = firstItem.id;
            venteData.item_nom = firstItem.nom;
            venteData.quantite = firstItem.quantite;
            venteData.prix_unitaire = firstItem.prix_unitaire;
            
            if (firstItem.coiffeuse_id) {
                venteData.coiffeuse_id = firstItem.coiffeuse_id;
                venteData.coiffeuse_nom = firstItem.coiffeuse_nom;
            }
        }
        
        // Save vente
        await Utils.create('ventes', venteData);
        
        // Update stock if products
        if (this.currentType === 'Produit') {
            for (const item of this.selectedItems) {
                const produit = this.produits.find(p => p.id === item.id);
                if (produit) {
                    produit.stock_actuel -= item.quantite;
                    await Utils.update('produits', produit.id, produit);
                }
            }
        }
        
        App.hideLoading();
        App.showNotification('Vente enregistrée avec succès');
        modal.remove();
        
        // Ask to print receipt
        if (confirm('Voulez-vous imprimer le reçu?')) {
            ThermalReceipt.print(venteData);
        }
        
        // Reload
        this.render(document.getElementById('content-area'));
        
    } catch (error) {
        App.hideLoading();
        App.showNotification('Erreur lors de l\'enregistrement', 'error');
        console.error('[Ventes] Save error:', error);
    }
};

// Show vente details
Ventes.showDetails = function(id) {
    const vente = this.data.find(v => v.id === id);
    if (!vente) return;
    
    let itemsHTML = '';
    let totalCommission = 0;
    
    if (vente.items && Array.isArray(vente.items)) {
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
                    ${vente.items.map(item => {
                        const subtotal = item.prix_unitaire * (item.quantite || 1);
                        if (item.commission) totalCommission += item.commission;
                        
                        let name = item.item_nom || item.service_nom || item.nom;
                        if (item.coiffeuse_nom) {
                            name += `<br><small class="text-gray-500">${item.coiffeuse_nom}</small>`;
                        }
                        
                        return `
                            <tr class="border-b border-gray-200">
                                <td class="py-2">${name}</td>
                                <td class="text-center">${item.quantite || 1}</td>
                                <td class="text-right">${Utils.formatCurrency(item.prix_unitaire)}</td>
                                <td class="text-right font-medium">${Utils.formatCurrency(subtotal)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } else {
        itemsHTML = `
            <div class="bg-gray-50 rounded p-3 mb-4">
                <p class="font-medium">${vente.item_nom}</p>
                <p class="text-sm text-gray-600">Quantité: ${vente.quantite || 1} × ${Utils.formatCurrency(vente.prix_unitaire)}</p>
            </div>
        `;
        totalCommission = vente.commission || 0;
    }
    
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
                    <p class="text-sm text-gray-500">${vente.client_telephone}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Mode de paiement</p>
                    <p class="font-medium">${vente.mode_paiement}</p>
                </div>
            </div>
            
            <div>
                <h4 class="font-medium text-gray-700 mb-2">Détails des articles:</h4>
                ${itemsHTML}
            </div>
            
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-medium">TOTAL:</span>
                    <span class="text-2xl font-bold text-purple-700">${Utils.formatCurrency(vente.montant_total)}</span>
                </div>
                
                ${vente.montant_percu ? `
                    <div class="border-t border-purple-300 mt-3 pt-3 space-y-1">
                        <div class="flex justify-between text-sm">
                            <span>Montant perçu:</span>
                            <span class="font-medium">${Utils.formatCurrency(vente.montant_percu)}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span>Monnaie rendue:</span>
                            <span class="font-medium text-green-700">${Utils.formatCurrency(vente.monnaie)}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${totalCommission > 0 ? `
                    <div class="border-t border-purple-300 mt-3 pt-3">
                        <div class="flex justify-between text-sm">
                            <span>Commission:</span>
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
                <button onclick="ThermalReceipt.download(${JSON.stringify(vente).replace(/"/g, '&quot;')})" 
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
    
    // Remove save button (details only)
    const saveBtn = modal.querySelector('button[onclick*="onSave"]');
    if (saveBtn) saveBtn.remove();
    
    document.body.appendChild(modal);
};

// Print receipt
Ventes.printReceipt = function(id) {
    const vente = this.data.find(v => v.id === id);
    if (!vente) {
        App.showNotification('Vente introuvable', 'error');
        return;
    }
    
    ThermalReceipt.print(vente);
};

// Export period
Ventes.exportPeriod = function() {
    const filteredData = PeriodFilter.filterData(this.data, 'date_vente');
    const periodLabel = PeriodFilter.getPeriodLabel();
    
    if (filteredData.length === 0) {
        App.showNotification('Aucune vente à exporter pour cette période', 'info');
        return;
    }
    
    // Build CSV
    let csv = 'Date;Type;Client;Téléphone;Articles;Montant;Commission;Paiement;Montant Perçu;Monnaie\n';
    
    filteredData.forEach(vente => {
        const date = new Date(vente.date_vente).toLocaleString('fr-FR');
        const items = vente.items && Array.isArray(vente.items) 
            ? vente.items.map(i => i.nom || i.item_nom).join(', ')
            : vente.item_nom;
        
        csv += `${date};${vente.type};${vente.client_nom || 'Anonyme'};${vente.client_telephone};`;
        csv += `"${items}";${vente.montant_total};${vente.commission || 0};${vente.mode_paiement};`;
        csv += `${vente.montant_percu || ''};${vente.monnaie || ''}\n`;
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventes-${periodLabel.replace(/\s+/g, '-')}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    App.showNotification(`Export réussi: ${filteredData.length} ventes`);
};
