// Commissions Module - Version 3 with Period Filter & Payment Status
const CommissionsV3 = {
    data: [],
    coiffeuses: [],
    ventes: [],
    currentPeriod: null,
    
    async render(container) {
        await this.loadAllData();
        
        container.innerHTML = `
            <div class="mb-6 space-y-4">
                <!-- Top Actions -->
                <div class="flex justify-between items-center">
                    <div class="flex space-x-3">
                        <button onclick="CommissionsV3.calculerCommissions()" 
                                class="px-4 py-2 bg-gradient-to-r from-yellow-500 to-black text-white rounded-lg hover:shadow-lg">
                            <i class="fas fa-calculator mr-2"></i>Calculer les commissions
                        </button>
                        <button onclick="CommissionsV3.markAllAsPaid()" 
                                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i class="fas fa-check-double mr-2"></i>Marquer toutes comme payées
                        </button>
                        <button onclick="CommissionsV3.exportCommissions()" 
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-file-export mr-2"></i>Exporter
                        </button>
                    </div>
                </div>
                
                <!-- Period Filter -->
                <div id="period-filter-container"></div>
                
                <!-- Filters -->
                <div class="flex space-x-3">
                    <select id="filter-coiffeuse" class="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Toutes les coiffeuses</option>
                        ${this.coiffeuses.map(c => `<option value="${c.id}">${c.nom}</option>`).join('')}
                    </select>
                    <select id="filter-statut" class="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Tous les statuts</option>
                        <option value="Calculé">En attente (non payé)</option>
                        <option value="Payé">Payé</option>
                    </select>
                </div>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Commissions totales</p>
                    <p id="commission-total" class="text-2xl font-bold text-purple-600 mt-2">$0.00</p>
                    <p class="text-xs text-gray-500 mt-1">Période sélectionnée</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Payées</p>
                    <p id="commission-payees" class="text-2xl font-bold text-green-600 mt-2">$0.00</p>
                    <p class="text-xs text-gray-500 mt-1">✓ Déjà versées</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">En attente</p>
                    <p id="commission-attente" class="text-2xl font-bold text-orange-600 mt-2">$0.00</p>
                    <p class="text-xs text-gray-500 mt-1">⏳ À payer</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <p class="text-sm text-gray-600">Coiffeuses actives</p>
                    <p id="coiffeuses-count" class="text-2xl font-bold text-blue-600 mt-2">0</p>
                    <p class="text-xs text-gray-500 mt-1">Dans la période</p>
                </div>
            </div>
            
            <!-- Commissions Table -->
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
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Paiement</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="commissions-table" class="divide-y divide-gray-200">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Initialize period filter
        const filterContainer = document.getElementById('period-filter-container');
        if (filterContainer && typeof PeriodFilter !== 'undefined') {
            filterContainer.innerHTML = PeriodFilter.render();
            PeriodFilter.onPeriodChange((period) => {
                this.currentPeriod = period;
                this.renderTable();
                this.updateStats();
            });
        }
        
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
    
    /**
     * Filter data by period
     */
    filterByPeriod(data) {
        if (!this.currentPeriod) return data;
        
        return data.filter(item => {
            const itemDate = new Date(item.date_calcul || item.created_at);
            return itemDate >= this.currentPeriod.start && itemDate <= this.currentPeriod.end;
        });
    },
    
    updateStats() {
        const filteredData = this.filterByPeriod(this.data);
        
        const totalCommission = filteredData.reduce((sum, c) => sum + (c.total_commission || 0), 0);
        
        const commissionsPaid = filteredData
            .filter(c => c.statut === 'Payé')
            .reduce((sum, c) => sum + (c.total_commission || 0), 0);
        
        const commissionsAttente = filteredData
            .filter(c => c.statut === 'Calculé' || c.statut === 'En attente')
            .reduce((sum, c) => sum + (c.total_commission || 0), 0);
        
        // Count unique coiffeuses with commissions in period
        const uniqueCoiffeuses = new Set(filteredData.map(c => c.coiffeuse_id)).size;
        
        document.getElementById('commission-total').textContent = Utils.formatCurrency(totalCommission);
        document.getElementById('commission-payees').textContent = Utils.formatCurrency(commissionsPaid);
        document.getElementById('commission-attente').textContent = Utils.formatCurrency(commissionsAttente);
        document.getElementById('coiffeuses-count').textContent = uniqueCoiffeuses;
    },
    
    renderTable(filteredData = null) {
        let dataToRender = filteredData || this.filterByPeriod(this.data);
        dataToRender = dataToRender.sort((a, b) => new Date(b.date_calcul) - new Date(a.date_calcul));
        
        const tbody = document.getElementById('commissions-table');
        if (!tbody) return;
        
        if (dataToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-money-bill-wave text-4xl mb-2"></i>
                        <p>Aucune commission pour la période sélectionnée</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = dataToRender.map(comm => {
            const coiffeuse = this.coiffeuses.find(c => c.id === comm.coiffeuse_id);
            const isPaid = comm.statut === 'Payé';
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                        <p class="font-medium text-gray-800">${comm.coiffeuse_nom || coiffeuse?.nom || 'N/A'}</p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-sm text-gray-800">${comm.periode}</p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-sm text-gray-800">${comm.nombre_services || 0} service(s)</p>
                        <p class="text-xs text-gray-500">Total: ${Utils.formatCurrency(comm.total_ventes || 0)}</p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="font-bold text-purple-600">${Utils.formatCurrency(comm.total_commission)}</p>
                    </td>
                    <td class="px-6 py-4">
                        ${isPaid ? 
                            `<span class="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                <i class="fas fa-check-circle mr-1"></i>Payé
                            </span>` :
                            `<span class="px-3 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                                <i class="fas fa-clock mr-1"></i>En attente
                            </span>`
                        }
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-sm text-gray-800">
                            ${comm.date_paiement ? Utils.formatDate(comm.date_paiement) : '-'}
                        </p>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex space-x-2">
                            ${!isPaid ? `
                                <button onclick="CommissionsV3.markAsPaid('${comm.id}')" 
                                        class="text-green-600 hover:text-green-800" 
                                        title="Marquer comme payé">
                                    <i class="fas fa-dollar-sign"></i>
                                </button>
                            ` : ''}
                            <button onclick="CommissionsV3.showDetails('${comm.id}')" 
                                    class="text-blue-600 hover:text-blue-800" 
                                    title="Voir détails">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="CommissionsV3.printReceipt('${comm.id}')" 
                                    class="text-purple-600 hover:text-purple-800" 
                                    title="Imprimer reçu">
                                <i class="fas fa-print"></i>
                            </button>
                            <button onclick="CommissionsV3.deleteCommission('${comm.id}')" 
                                    class="text-red-600 hover:text-red-800" 
                                    title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    setupFilters() {
        const filterCoiffeuse = document.getElementById('filter-coiffeuse');
        const filterStatut = document.getElementById('filter-statut');
        
        const applyFilters = () => {
            const coiffeuseId = filterCoiffeuse?.value || '';
            const statut = filterStatut?.value || '';
            
            let filtered = this.filterByPeriod(this.data);
            
            if (coiffeuseId) {
                filtered = filtered.filter(c => c.coiffeuse_id === coiffeuseId);
            }
            
            if (statut) {
                filtered = filtered.filter(c => c.statut === statut);
            }
            
            this.renderTable(filtered);
        };
        
        if (filterCoiffeuse) filterCoiffeuse.addEventListener('change', applyFilters);
        if (filterStatut) filterStatut.addEventListener('change', applyFilters);
    },
    
    /**
     * Mark a single commission as paid
     */
    async markAsPaid(commissionId) {
        const commission = this.data.find(c => c.id === commissionId);
        if (!commission) return;
        
        if (!confirm(`Confirmer le paiement de ${Utils.formatCurrency(commission.total_commission)} à ${commission.coiffeuse_nom} ?`)) {
            return;
        }
        
        try {
            App.showLoading();
            
            const updatedData = {
                ...commission,
                statut: 'Payé',
                date_paiement: Date.now()
            };
            
            await Utils.update('commissions', commissionId, updatedData);
            
            await this.loadAllData();
            this.renderTable();
            this.updateStats();
            
            App.hideLoading();
            App.showNotification('Commission marquée comme payée', 'success');
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de la mise à jour', 'error');
            console.error(error);
        }
    },
    
    /**
     * Mark all unpaid commissions as paid
     */
    async markAllAsPaid() {
        const filteredData = this.filterByPeriod(this.data);
        const unpaidCommissions = filteredData.filter(c => c.statut !== 'Payé');
        
        if (unpaidCommissions.length === 0) {
            App.showNotification('Aucune commission en attente', 'info');
            return;
        }
        
        const totalAmount = unpaidCommissions.reduce((sum, c) => sum + c.total_commission, 0);
        
        if (!confirm(`Marquer ${unpaidCommissions.length} commission(s) comme payées pour un total de ${Utils.formatCurrency(totalAmount)} ?`)) {
            return;
        }
        
        try {
            App.showLoading();
            
            const paymentDate = Date.now();
            
            for (const commission of unpaidCommissions) {
                await Utils.update('commissions', commission.id, {
                    ...commission,
                    statut: 'Payé',
                    date_paiement: paymentDate
                });
            }
            
            await this.loadAllData();
            this.renderTable();
            this.updateStats();
            
            App.hideLoading();
            App.showNotification(`${unpaidCommissions.length} commission(s) marquée(s) comme payées`, 'success');
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de la mise à jour', 'error');
            console.error(error);
        }
    },
    
    /**
     * Calculate commissions for a period
     */
    async calculerCommissions() {
        if (!this.currentPeriod) {
            App.showNotification('Veuillez sélectionner une période', 'error');
            return;
        }
        
        try {
            App.showLoading();
            
            // Filter sales by period
            const salesInPeriod = this.ventes.filter(vente => {
                const venteDate = new Date(vente.date_vente || vente.created_at);
                return venteDate >= this.currentPeriod.start && 
                       venteDate <= this.currentPeriod.end &&
                       vente.type === 'Service';
            });
            
            if (salesInPeriod.length === 0) {
                App.hideLoading();
                App.showNotification('Aucune vente de service dans cette période', 'info');
                return;
            }
            
            // Group by coiffeuse
            const commissionsByCoiffeuse = {};
            
            salesInPeriod.forEach(vente => {
                const coiffeuseId = vente.coiffeuse_id;
                const commission = vente.commission || 0;
                
                if (!commissionsByCoiffeuse[coiffeuseId]) {
                    const coiffeuse = this.coiffeuses.find(c => c.id === coiffeuseId);
                    commissionsByCoiffeuse[coiffeuseId] = {
                        coiffeuse_id: coiffeuseId,
                        coiffeuse_nom: coiffeuse?.nom || 'N/A',
                        total_commission: 0,
                        total_ventes: 0,
                        nombre_services: 0,
                        details: []
                    };
                }
                
                commissionsByCoiffeuse[coiffeuseId].total_commission += commission;
                commissionsByCoiffeuse[coiffeuseId].total_ventes += (vente.montant_total || 0);
                commissionsByCoiffeuse[coiffeuseId].nombre_services += 1;
                commissionsByCoiffeuse[coiffeuseId].details.push({
                    service_nom: vente.article_nom,
                    montant: vente.montant_total,
                    commission: commission,
                    date: vente.date_vente
                });
            });
            
            // Save commissions
            const periodLabel = PeriodFilter.getPeriodLabel(this.currentPeriod);
            
            for (const coiffeuseId in commissionsByCoiffeuse) {
                const commData = commissionsByCoiffeuse[coiffeuseId];
                
                await Utils.create('commissions', {
                    id: Utils.generateId(),
                    coiffeuse_id: commData.coiffeuse_id,
                    coiffeuse_nom: commData.coiffeuse_nom,
                    periode: periodLabel,
                    date_calcul: Date.now(),
                    nombre_services: commData.nombre_services,
                    total_ventes: commData.total_ventes,
                    total_commission: commData.total_commission,
                    details: JSON.stringify(commData.details),
                    statut: 'Calculé',
                    date_paiement: null
                });
            }
            
            await this.loadAllData();
            this.renderTable();
            this.updateStats();
            
            App.hideLoading();
            App.showNotification(`Commissions calculées pour ${Object.keys(commissionsByCoiffeuse).length} coiffeuse(s)`, 'success');
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors du calcul des commissions', 'error');
            console.error(error);
        }
    },
    
    /**
     * Show commission details
     */
    showDetails(commissionId) {
        const commission = this.data.find(c => c.id === commissionId);
        if (!commission) return;
        
        let details = [];
        try {
            details = JSON.parse(commission.details || '[]');
        } catch (e) {
            details = [];
        }
        
        const modalContent = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <p class="text-sm text-gray-600">Coiffeuse</p>
                        <p class="font-bold">${commission.coiffeuse_nom}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Période</p>
                        <p class="font-bold">${commission.periode}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Services rendus</p>
                        <p class="font-bold">${commission.nombre_services}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Total ventes</p>
                        <p class="font-bold">${Utils.formatCurrency(commission.total_ventes)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Commission totale</p>
                        <p class="font-bold text-purple-600 text-xl">${Utils.formatCurrency(commission.total_commission)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Statut</p>
                        <p class="font-bold ${commission.statut === 'Payé' ? 'text-green-600' : 'text-orange-600'}">
                            ${commission.statut}
                        </p>
                    </div>
                </div>
                
                ${details.length > 0 ? `
                    <div>
                        <h3 class="font-bold mb-2">Détail des services</h3>
                        <div class="max-h-64 overflow-y-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th class="px-3 py-2 text-left">Service</th>
                                        <th class="px-3 py-2 text-right">Montant</th>
                                        <th class="px-3 py-2 text-right">Commission</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${details.map(d => `
                                        <tr class="border-b">
                                            <td class="px-3 py-2">${d.service_nom}</td>
                                            <td class="px-3 py-2 text-right">${Utils.formatCurrency(d.montant)}</td>
                                            <td class="px-3 py-2 text-right font-bold">${Utils.formatCurrency(d.commission)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : '<p class="text-gray-500 text-center">Aucun détail disponible</p>'}
            </div>
        `;
        
        Utils.createModal('Détails de la commission', modalContent, null, false);
    },
    
    /**
     * Print commission receipt
     */
    printReceipt(commissionId) {
        const commission = this.data.find(c => c.id === commissionId);
        if (!commission) return;
        
        let details = [];
        try {
            details = JSON.parse(commission.details || '[]');
        } catch (e) {
            details = [];
        }
        
        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Reçu de Commission</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
                </style>
            </head>
            <body>
                <h1>JL Beauty System</h1>
                <h2>Reçu de Commission</h2>
                <p><strong>Coiffeuse:</strong> ${commission.coiffeuse_nom}</p>
                <p><strong>Période:</strong> ${commission.periode}</p>
                <p><strong>Date de calcul:</strong> ${Utils.formatDate(commission.date_calcul)}</p>
                <p><strong>Statut:</strong> ${commission.statut}</p>
                ${commission.date_paiement ? `<p><strong>Date de paiement:</strong> ${Utils.formatDate(commission.date_paiement)}</p>` : ''}
                
                <table>
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Montant</th>
                            <th>Commission</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${details.map(d => `
                            <tr>
                                <td>${d.service_nom}</td>
                                <td>${Utils.formatCurrency(d.montant)}</td>
                                <td>${Utils.formatCurrency(d.commission)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total">
                    <p>Total des ventes: ${Utils.formatCurrency(commission.total_ventes)}</p>
                    <p>Commission totale: ${Utils.formatCurrency(commission.total_commission)}</p>
                </div>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.print();
    },
    
    /**
     * Export commissions to CSV
     */
    exportCommissions() {
        const filtered = this.filterByPeriod(this.data);
        
        if (filtered.length === 0) {
            App.showNotification('Aucune commission à exporter', 'info');
            return;
        }
        
        const headers = ['Coiffeuse', 'Période', 'Services', 'Total Ventes', 'Commission', 'Statut', 'Date Paiement'];
        const rows = filtered.map(c => [
            c.coiffeuse_nom,
            c.periode,
            c.nombre_services,
            c.total_ventes,
            c.total_commission,
            c.statut,
            c.date_paiement ? Utils.formatDate(c.date_paiement) : '-'
        ]);
        
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `commissions-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        App.showNotification('Commissions exportées', 'success');
    },
    
    /**
     * Delete a commission
     */
    async deleteCommission(commissionId) {
        if (!confirm('Supprimer cette commission ?')) return;
        
        try {
            App.showLoading();
            await Utils.delete('commissions', commissionId);
            await this.loadAllData();
            this.renderTable();
            this.updateStats();
            App.hideLoading();
            App.showNotification('Commission supprimée', 'success');
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de la suppression', 'error');
            console.error(error);
        }
    }
};
