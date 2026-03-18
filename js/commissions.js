// Commissions Module - Version 2 with Individual Reports
const Commissions = {
    data: [],
    coiffeuses: [],
    ventes: [],
    
    async render(container) {
        await this.loadAllData();
        
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <div class="flex space-x-3">
                    <button onclick="Commissions.calculerCommissions()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <i class="fas fa-calculator mr-2"></i>Calculer les commissions du mois
                    </button>
                    <button onclick="Commissions.showHistorique()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-history mr-2"></i>Historique
                    </button>
                </div>
                <select id="filter-coiffeuse" class="px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Toutes les coiffeuses</option>
                    ${this.coiffeuses.map(c => `<option value="${c.id}">${c.nom}</option>`).join('')}
                </select>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Commissions du mois</p>
                    <p id="commission-mois" class="text-2xl font-bold text-purple-600 mt-2">$0.00</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Commissions payées</p>
                    <p id="commission-payees" class="text-2xl font-bold text-green-600 mt-2">$0.00</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Commissions en attente</p>
                    <p id="commission-attente" class="text-2xl font-bold text-orange-600 mt-2">$0.00</p>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="table-container">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coiffeuse</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Services Rendus</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="commissions-table" class="divide-y divide-gray-200">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        this.renderTable();
        this.updateStats();
        this.setupFilters();
    },
    
    async loadAllData() {
        try {
            const [commissionsData, coiffeusesData, ventesData] = await Promise.all([
                Utils.get('commissions'),
                Utils.get('coiffeuses'),
                Utils.get('ventes')
            ]);
            
            this.data = commissionsData.data || [];
            this.coiffeuses = coiffeusesData.data || [];
            this.ventes = ventesData.data || [];
        } catch (error) {
            console.error('Error loading data:', error);
        }
    },
    
    updateStats() {
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        
        const commissionsThisMonth = this.data
            .filter(c => {
                const date = new Date(c.date_calcul);
                return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
            })
            .reduce((sum, c) => sum + c.total_commission, 0);
        
        const commissionsPaid = this.data
            .filter(c => c.statut === 'Payé')
            .reduce((sum, c) => sum + c.total_commission, 0);
        
        const commissionsAttente = this.data
            .filter(c => c.statut === 'Calculé')
            .reduce((sum, c) => sum + c.total_commission, 0);
        
        document.getElementById('commission-mois').textContent = Utils.formatCurrency(commissionsThisMonth);
        document.getElementById('commission-payees').textContent = Utils.formatCurrency(commissionsPaid);
        document.getElementById('commission-attente').textContent = Utils.formatCurrency(commissionsAttente);
    },
    
    renderTable(filteredData = null) {
        const dataToRender = (filteredData || this.data).sort((a, b) => 
            new Date(b.date_calcul) - new Date(a.date_calcul)
        );
        const tbody = document.getElementById('commissions-table');
        
        if (!tbody) return;
        
        if (dataToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-money-bill-wave text-4xl mb-2"></i>
                        <p>Aucune commission calculée</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = dataToRender.map(comm => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <p class="font-medium text-gray-800">${comm.coiffeuse_nom}</p>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-800">${comm.periode}</p>
                </td>
                <td class="px-6 py-4">
                    <p class="font-medium text-gray-800">${comm.nb_services} services</p>
                    <p class="text-xs text-gray-500">CA: ${Utils.formatCurrency(comm.total_ventes)}</p>
                </td>
                <td class="px-6 py-4">
                    <p class="font-bold text-green-600">${Utils.formatCurrency(comm.total_commission)}</p>
                </td>
                <td class="px-6 py-4">
                    ${Utils.getStatusBadge(comm.statut)}
                </td>
                <td class="px-6 py-4">
                    <button onclick="Commissions.showRapportModal('${comm.id}')" 
                            class="text-purple-600 hover:text-purple-800 mr-3" title="Rapport détaillé">
                        <i class="fas fa-file-alt"></i>
                    </button>
                    ${comm.statut === 'Calculé' ? `
                    <button onclick="Commissions.marquerPayee('${comm.id}')" 
                            class="text-green-600 hover:text-green-800 mr-3" title="Marquer payée">
                        <i class="fas fa-check-circle"></i>
                    </button>
                    ` : ''}
                    <button onclick="Commissions.deleteCommission('${comm.id}')" 
                            class="text-red-600 hover:text-red-800" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },
    
    setupFilters() {
        const filterCoiffeuse = document.getElementById('filter-coiffeuse');
        
        if (filterCoiffeuse) {
            filterCoiffeuse.addEventListener('change', () => {
                const coiffeuseId = filterCoiffeuse.value;
                
                if (!coiffeuseId) {
                    this.renderTable();
                } else {
                    const filtered = this.data.filter(c => c.coiffeuse_id === coiffeuseId);
                    this.renderTable(filtered);
                }
            });
        }
    },
    
    async calculerCommissions() {
        try {
            App.showLoading();
            
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();
            const periode = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            
            // Check if already calculated
            const existant = this.data.find(c => c.periode === periode);
            if (existant) {
                const confirm = Utils.confirm('Les commissions de ce mois ont déjà été calculées. Recalculer ?');
                if (!confirm) {
                    App.hideLoading();
                    return;
                }
            }
            
            // Group sales by coiffeuse (services only) - UPDATED FOR MULTI-COIFFEUSES
            const coiffeuseVentes = {};
            
            this.ventes.forEach(v => {
                const vDate = new Date(v.date_vente);
                if (vDate.getMonth() === thisMonth && vDate.getFullYear() === thisYear && v.type === 'Service') {
                    
                    // Check if this is a multi-coiffeuse sale (new format)
                    if (v.items && Array.isArray(v.items)) {
                        // Each service can have a different coiffeuse
                        v.items.forEach(item => {
                            const coiffeuseId = item.coiffeuse_id;
                            const coiffeuseNom = item.coiffeuse_nom;
                            
                            if (!coiffeuseVentes[coiffeuseId]) {
                                coiffeuseVentes[coiffeuseId] = {
                                    nom: coiffeuseNom,
                                    ventes: [],
                                    totalVentes: 0,
                                    totalCommission: 0,
                                    nbServices: 0
                                };
                            }
                            
                            // Create a virtual sale for this service
                            const virtualSale = {
                                id: v.id,
                                date_vente: v.date_vente,
                                client_nom: v.client_nom,
                                client_telephone: v.client_telephone,
                                service_nom: item.service_nom,
                                montant_total: item.prix,
                                commission: item.commission,
                                mode_paiement: v.mode_paiement
                            };
                            
                            coiffeuseVentes[coiffeuseId].ventes.push(virtualSale);
                            coiffeuseVentes[coiffeuseId].totalVentes += item.prix;
                            coiffeuseVentes[coiffeuseId].totalCommission += item.commission;
                            coiffeuseVentes[coiffeuseId].nbServices += 1;
                        });
                    } else {
                        // Old format: single coiffeuse (backward compatibility)
                        const id = v.coiffeuse_id;
                        
                        if (!coiffeuseVentes[id]) {
                            coiffeuseVentes[id] = {
                                nom: v.coiffeuse_nom,
                                ventes: [],
                                totalVentes: 0,
                                totalCommission: 0,
                                nbServices: 0
                            };
                        }
                        
                        coiffeuseVentes[id].ventes.push(v);
                        coiffeuseVentes[id].totalVentes += v.montant_total || 0;
                        coiffeuseVentes[id].totalCommission += v.commission || 0;
                        coiffeuseVentes[id].nbServices += 1;
                    }
                }
            });
            
            // Delete all old commissions for this month
            const oldCommissions = this.data.filter(c => c.periode === periode);
            for (const oldComm of oldCommissions) {
                await Utils.delete('commissions', oldComm.id);
            }
            
            // Create commission records
            let created = 0;
            for (const [coiffeuseId, data] of Object.entries(coiffeuseVentes)) {
                const commissionData = {
                    id: Utils.generateId(),
                    coiffeuse_id: coiffeuseId,
                    coiffeuse_nom: data.nom,
                    periode: periode,
                    nb_services: data.nbServices,
                    total_ventes: data.totalVentes,
                    total_commission: data.totalCommission,
                    statut: 'Calculé',
                    date_calcul: Date.now(),
                    ventes_detail: data.ventes
                };
                
                await Utils.create('commissions', commissionData);
                created++;
            }
            
            App.hideLoading();
            App.showNotification(`${created} commission(s) calculée(s) avec succès`);
            this.render(document.getElementById('content-area'));
            
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors du calcul', 'error');
            console.error(error);
        }
    },
    
    async marquerPayee(id) {
        try {
            App.showLoading();
            const commission = this.data.find(c => c.id === id);
            
            await Utils.update('commissions', id, {
                ...commission,
                statut: 'Payé',
                date_paiement: Date.now()
            });
            
            App.hideLoading();
            App.showNotification('Commission marquée comme payée');
            this.render(document.getElementById('content-area'));
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur', 'error');
        }
    },
    
    async deleteCommission(id) {
        if (!Utils.confirm('Supprimer cette commission ?')) return;
        
        try {
            App.showLoading();
            await Utils.delete('commissions', id);
            App.hideLoading();
            App.showNotification('Commission supprimée');
            this.render(document.getElementById('content-area'));
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur', 'error');
        }
    },
    
    showHistorique() {
        // Same as current render but sorted by date
        this.render(document.getElementById('content-area'));
    },
    
    showRapportModal(commissionId) {
        const commission = this.data.find(c => c.id === commissionId);
        if (!commission) return;
        
        const ventes = commission.ventes_detail || [];
        
        // Calculate stats
        let totalCA = 0;
        let totalCommission = 0;
        const serviceCount = {};
        
        ventes.forEach(v => {
            totalCA += v.montant_total || 0;
            totalCommission += v.commission || 0;
            
            // Count services
            if (v.items && Array.isArray(v.items)) {
                v.items.forEach(item => {
                    serviceCount[item.nom] = (serviceCount[item.nom] || 0) + 1;
                });
            } else if (v.item_nom) {
                serviceCount[v.item_nom] = (serviceCount[v.item_nom] || 0) + 1;
            }
        });
        
        const servicesList = Object.entries(serviceCount)
            .sort((a, b) => b[1] - a[1])
            .map(([nom, count]) => `<li class="text-sm">${nom}: <strong>${count}x</strong></li>`)
            .join('');
        
        const modalContent = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-6 rounded-lg -m-6 mb-6">
                    <h3 class="text-2xl font-bold">${commission.coiffeuse_nom}</h3>
                    <p class="text-purple-100 mt-1">Rapport de commission - ${commission.periode}</p>
                </div>
                
                <!-- Stats Cards -->
                <div class="grid grid-cols-3 gap-4">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <p class="text-sm text-blue-700">Services rendus</p>
                        <p class="text-3xl font-bold text-blue-600 mt-2">${ventes.length}</p>
                    </div>
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p class="text-sm text-green-700">CA généré</p>
                        <p class="text-2xl font-bold text-green-600 mt-2">${Utils.formatCurrency(totalCA)}</p>
                    </div>
                    <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                        <p class="text-sm text-purple-700">Commission</p>
                        <p class="text-2xl font-bold text-purple-600 mt-2">${Utils.formatCurrency(totalCommission)}</p>
                    </div>
                </div>
                
                <!-- Services Breakdown -->
                <div class="border-t pt-4">
                    <h4 class="font-semibold text-gray-800 mb-3">
                        <i class="fas fa-scissors mr-2"></i>Répartition par service
                    </h4>
                    <ul class="space-y-1 bg-gray-50 p-4 rounded-lg">
                        ${servicesList}
                    </ul>
                </div>
                
                <!-- Detailed Sales Table -->
                <div class="border-t pt-4">
                    <h4 class="font-semibold text-gray-800 mb-3">
                        <i class="fas fa-list mr-2"></i>Détail des ventes
                    </h4>
                    <div class="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50 sticky top-0">
                                <tr>
                                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Client</th>
                                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Service(s)</th>
                                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Montant</th>
                                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Commission</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${ventes.map(v => {
                                    let servicesText = '';
                                    if (v.items && Array.isArray(v.items)) {
                                        servicesText = v.items.map(i => i.nom).join(', ');
                                    } else {
                                        servicesText = v.item_nom || '-';
                                    }
                                    
                                    return `
                                    <tr>
                                        <td class="px-3 py-2">${Utils.formatDate(v.date_vente)}</td>
                                        <td class="px-3 py-2">${v.client_nom || 'Anonyme'}</td>
                                        <td class="px-3 py-2">${servicesText}</td>
                                        <td class="px-3 py-2 text-right font-medium">${Utils.formatCurrency(v.montant_total)}</td>
                                        <td class="px-3 py-2 text-right font-medium text-green-600">${Utils.formatCurrency(v.commission)}</td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                            <tfoot class="bg-gray-50 font-bold">
                                <tr>
                                    <td colspan="3" class="px-3 py-2 text-right">TOTAL :</td>
                                    <td class="px-3 py-2 text-right">${Utils.formatCurrency(totalCA)}</td>
                                    <td class="px-3 py-2 text-right text-green-600">${Utils.formatCurrency(totalCommission)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                
                <!-- Export Buttons -->
                <div class="flex justify-end space-x-3 border-t pt-4">
                    <button onclick="Commissions.exportRapportHTML('${commissionId}')" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-file-code mr-2"></i>Exporter HTML
                    </button>
                    <button onclick="Commissions.exportRapportCSV('${commissionId}')" 
                            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <i class="fas fa-file-csv mr-2"></i>Exporter CSV
                    </button>
                </div>
            </div>
        `;
        
        Utils.createModal(`Rapport de commission`, modalContent, null);
    },
    
    exportRapportHTML(commissionId) {
        const commission = this.data.find(c => c.id === commissionId);
        if (!commission) return;
        
        const ventes = commission.ventes_detail || [];
        const totalCA = ventes.reduce((sum, v) => sum + (v.montant_total || 0), 0);
        const totalCommission = ventes.reduce((sum, v) => sum + (v.commission || 0), 0);
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rapport Commission - ${commission.coiffeuse_nom}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #9333ea; }
        .header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
        .stats { display: flex; gap: 20px; margin-bottom: 30px; }
        .stat-card { flex: 1; border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #9333ea; color: white; }
        tfoot { background-color: #f3f4f6; font-weight: bold; }
        .right { text-align: right; }
        .print-button { margin: 20px 0; padding: 10px 20px; background: #9333ea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        .print-button:hover { background: #7e22ce; }
        @media print {
            .print-button { display: none; }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">
        🖨️ Imprimer ce rapport
    </button>

    <div class="header">
        <h1>${commission.coiffeuse_nom}</h1>
        <p>Rapport de commission - ${commission.periode}</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <h3>Services rendus</h3>
            <h2>${commission.nb_services}</h2>
        </div>
        <div class="stat-card">
            <h3>CA généré</h3>
            <h2>${Utils.formatCurrency(totalCA)}</h2>
        </div>
        <div class="stat-card">
            <h3>Commission</h3>
            <h2>${Utils.formatCurrency(totalCommission)}</h2>
        </div>
    </div>
    
    <h3>Détail des ventes</h3>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Service</th>
                <th class="right">Montant</th>
                <th class="right">Commission</th>
            </tr>
        </thead>
        <tbody>
            ${ventes.map(v => {
                // Get service name correctly
                let serviceName = v.service_nom || v.item_nom || '-';
                
                return `
                <tr>
                    <td>${Utils.formatDate(v.date_vente)}</td>
                    <td>${v.client_nom || 'Anonyme'}</td>
                    <td>${serviceName}</td>
                    <td class="right">${Utils.formatCurrency(v.montant_total)}</td>
                    <td class="right">${Utils.formatCurrency(v.commission)}</td>
                </tr>
                `;
            }).join('')}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3" class="right">TOTAL :</td>
                <td class="right">${Utils.formatCurrency(totalCA)}</td>
                <td class="right">${Utils.formatCurrency(totalCommission)}</td>
            </tr>
        </tfoot>
    </table>
    
    <p style="margin-top: 40px; color: #6b7280;">
        Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
    </p>
    
    <script>
        // Optional: Auto-print on load
        // window.onload = function() { window.print(); };
    </script>
</body>
</html>
        `;
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-commission-${commission.coiffeuse_nom.replace(/\s+/g, '-')}-${commission.periode.replace(/\s+/g, '-')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        App.showNotification('Rapport HTML téléchargé');
    },
    
    exportRapportCSV(commissionId) {
        const commission = this.data.find(c => c.id === commissionId);
        if (!commission) return;
        
        const ventes = commission.ventes_detail || [];
        
        let csv = 'Date,Client,Service,Montant,Commission\n';
        
        ventes.forEach(v => {
            // Get service name correctly
            let serviceName = v.service_nom || v.item_nom || '-';
            
            csv += `${Utils.formatDate(v.date_vente)},`;
            csv += `"${(v.client_nom || 'Anonyme').replace(/"/g, '""')}",`;
            csv += `"${serviceName.replace(/"/g, '""')}",`;
            csv += `${v.montant_total || 0},`;
            csv += `${v.commission || 0}\n`;
        });
        
        // Add totals
        const totalCA = ventes.reduce((sum, v) => sum + (v.montant_total || 0), 0);
        const totalCommission = ventes.reduce((sum, v) => sum + (v.commission || 0), 0);
        csv += `\nTOTAL,,,${totalCA},${totalCommission}\n`;
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-commission-${commission.coiffeuse_nom.replace(/\s+/g, '-')}-${commission.periode.replace(/\s+/g, '-')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        App.showNotification('Rapport CSV téléchargé');
    }
};
