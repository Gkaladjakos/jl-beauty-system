// Dashboard Module - Version 2 with Enhanced Charts
const Dashboard = {
    stats: {
        rendezVousAujourdhui: 0,
        clientsTotal: 0,
        revenusJour: 0,
        revenusMois: 0
    },
    
    charts: {
        revenus: null,
        services: null,
        evolution: null,
        topClients: null
    },
    
    async render(container) {
        await this.loadStats();
        
        container.innerHTML = `
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="card bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Rendez-vous aujourd'hui</p>
                            <p class="text-3xl font-bold text-purple-600 mt-2">${this.stats.rendezVousAujourdhui}</p>
                        </div>
                        <div class="bg-purple-100 p-4 rounded-full">
                            <i class="fas fa-calendar-check text-2xl text-purple-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Clients Total</p>
                            <p class="text-3xl font-bold text-blue-600 mt-2">${this.stats.clientsTotal}</p>
                        </div>
                        <div class="bg-blue-100 p-4 rounded-full">
                            <i class="fas fa-users text-2xl text-blue-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Revenus du jour</p>
                            <p class="text-2xl font-bold text-green-600 mt-2">${Utils.formatCurrency(this.stats.revenusJour)}</p>
                        </div>
                        <div class="bg-green-100 p-4 rounded-full">
                            <i class="fas fa-money-bill-wave text-2xl text-green-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Revenus du mois</p>
                            <p class="text-2xl font-bold text-orange-600 mt-2">${Utils.formatCurrency(this.stats.revenusMois)}</p>
                        </div>
                        <div class="bg-orange-100 p-4 rounded-full">
                            <i class="fas fa-chart-line text-2xl text-orange-600"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Evolution Charts (New) -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">
                        <i class="fas fa-chart-area mr-2 text-purple-600"></i>
                        Évolution sur 30 jours
                    </h3>
                    <div class="flex space-x-2">
                        <button onclick="Dashboard.switchEvolutionChart('ca')" 
                                id="btn-ev-ca" 
                                class="px-3 py-1 text-sm rounded bg-purple-600 text-white">
                            Chiffre d'affaire
                        </button>
                        <button onclick="Dashboard.switchEvolutionChart('clients')" 
                                id="btn-ev-clients"
                                class="px-3 py-1 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300">
                            Nouveaux clients
                        </button>
                    </div>
                </div>
                <div style="height: 350px;">
                    <canvas id="evolutionChart"></canvas>
                </div>
            </div>
            
            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-dollar-sign mr-2 text-green-600"></i>
                        Revenus des 7 derniers jours
                    </h3>
                    <div style="height: 300px;">
                        <canvas id="revenusChart"></canvas>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-scissors mr-2 text-blue-600"></i>
                        Services les plus demandés
                    </h3>
                    <div style="height: 300px;">
                        <canvas id="servicesChart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Top Performers Row (New) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-trophy mr-2 text-yellow-600"></i>
                        Top 3 Coiffeuses (CA généré ce mois)
                    </h3>
                    <div id="top-coiffeuses" class="space-y-3"></div>
                </div>
                
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-star mr-2 text-purple-600"></i>
                        Top 5 Clients (plus gros dépensiers)
                    </h3>
                    <div id="top-clients" class="space-y-3"></div>
                </div>
            </div>
            
            <!-- Recent Activities -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-clock mr-2 text-blue-600"></i>
                        Prochains rendez-vous
                    </h3>
                    <div id="prochains-rdv"></div>
                </div>
                
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-exclamation-triangle mr-2 text-orange-600"></i>
                        Alertes stock produits
                    </h3>
                    <div id="alertes-stock"></div>
                </div>
            </div>
        `;
        
        await this.renderCharts();
        await this.loadProchainRendezVous();
        await this.loadAlertesStock();
        await this.loadTopCoiffeuses();
        await this.loadTopClients();
    },
    
    async loadStats() {
        try {
            // Load all data
            const [clientsData, rdvData, ventesData] = await Promise.all([
                Utils.get('clients'),
                Utils.get('rendez_vous'),
                Utils.get('ventes')
            ]);
            
            const clients = clientsData.data || [];
            const rdv = rdvData.data || [];
            const ventes = ventesData.data || [];
            
            // Today's appointments (not cancelled)
            const today = new Date().toDateString();
            this.stats.rendezVousAujourdhui = rdv.filter(r => {
                const rdvDate = new Date(r.date_rdv).toDateString();
                return rdvDate === today && r.statut !== 'Annulé' && r.statut !== 'Reporté';
            }).length;
            
            // Total clients
            this.stats.clientsTotal = clients.length;
            
            // Today's revenue
            this.stats.revenusJour = ventes
                .filter(v => new Date(v.date_vente).toDateString() === today)
                .reduce((sum, v) => sum + (v.montant_total || 0), 0);
            
            // This month's revenue
            const thisMonth = new Date().getMonth();
            const thisYear = new Date().getFullYear();
            this.stats.revenusMois = ventes
                .filter(v => {
                    const d = new Date(v.date_vente);
                    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
                })
                .reduce((sum, v) => sum + (v.montant_total || 0), 0);
                
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },
    
    async renderCharts() {
        try {
            const ventesData = await Utils.get('ventes');
            const ventes = ventesData.data || [];
            
            // Destroy existing charts
            Object.keys(this.charts).forEach(key => {
                if (this.charts[key]) {
                    this.charts[key].destroy();
                    this.charts[key] = null;
                }
            });
            
            // 1. Revenue Chart (Last 7 days)
            await this.renderRevenusChart(ventes);
            
            // 2. Services Chart (Most popular)
            await this.renderServicesChart(ventes);
            
            // 3. Evolution Chart (30 days)
            await this.renderEvolutionChart('ca');
            
        } catch (error) {
            console.error('Error rendering charts:', error);
        }
    },
    
    async renderRevenusChart(ventes) {
        const ctx = document.getElementById('revenusChart');
        if (!ctx) return;
        
        // Get last 7 days
        const last7Days = [];
        const revenues = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
            last7Days.push(dateStr);
            
            // Calculate revenue for this day
            const dayRevenue = ventes
                .filter(v => {
                    const vDate = new Date(v.date_vente);
                    return vDate.toDateString() === date.toDateString();
                })
                .reduce((sum, v) => sum + (v.montant_total || 0), 0);
            
            revenues.push(dayRevenue);
        }
        
        this.charts.revenus = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Revenus',
                    data: revenues,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return Utils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    },
    
    async renderServicesChart(ventes) {
        const ctx = document.getElementById('servicesChart');
        if (!ctx) return;
        
        // Count services
        const serviceCounts = {};
        
        ventes.forEach(v => {
            if (v.type === 'Service') {
                if (v.items && Array.isArray(v.items)) {
                    // Multi-services
                    v.items.forEach(item => {
                        serviceCounts[item.nom] = (serviceCounts[item.nom] || 0) + 1;
                    });
                } else if (v.item_nom) {
                    // Single service
                    serviceCounts[v.item_nom] = (serviceCounts[v.item_nom] || 0) + 1;
                }
            }
        });
        
        // Get top 5 services
        const sorted = Object.entries(serviceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const labels = sorted.map(s => s[0]);
        const data = sorted.map(s => s[1]);
        
        const colors = [
            '#9333ea', // purple
            '#ec4899', // pink
            '#3b82f6', // blue
            '#10b981', // green
            '#f59e0b'  // orange
        ];
        
        this.charts.services = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + ' fois';
                            }
                        }
                    }
                }
            }
        });
    },
    
    async renderEvolutionChart(type) {
        const ctx = document.getElementById('evolutionChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.charts.evolution) {
            this.charts.evolution.destroy();
        }
        
        const last30Days = [];
        const values = [];
        
        if (type === 'ca') {
            // Chiffre d'affaire
            const ventesData = await Utils.get('ventes');
            const ventes = ventesData.data || [];
            
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                last30Days.push(dateStr);
                
                const dayRevenue = ventes
                    .filter(v => new Date(v.date_vente).toDateString() === date.toDateString())
                    .reduce((sum, v) => sum + (v.montant_total || 0), 0);
                
                values.push(dayRevenue);
            }
            
            this.charts.evolution = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: last30Days,
                    datasets: [{
                        label: 'Chiffre d\'affaire',
                        data: values,
                        borderColor: 'rgb(147, 51, 234)',
                        backgroundColor: 'rgba(147, 51, 234, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return Utils.formatCurrency(context.parsed.y);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return Utils.formatCurrency(value);
                                }
                            }
                        },
                        x: {
                            ticks: {
                                maxTicksLimit: 10
                            }
                        }
                    }
                }
            });
            
        } else {
            // Nouveaux clients
            const clientsData = await Utils.get('clients');
            const clients = clientsData.data || [];
            
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                last30Days.push(dateStr);
                
                const dayClients = clients
                    .filter(c => {
                        if (!c.date_inscription) return false;
                        return new Date(c.date_inscription).toDateString() === date.toDateString();
                    })
                    .length;
                
                values.push(dayClients);
            }
            
            this.charts.evolution = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: last30Days,
                    datasets: [{
                        label: 'Nouveaux clients',
                        data: values,
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        },
                        x: {
                            ticks: {
                                maxTicksLimit: 10
                            }
                        }
                    }
                }
            });
        }
    },
    
    switchEvolutionChart(type) {
        // Update button styles
        document.getElementById('btn-ev-ca').className = 
            type === 'ca' 
            ? 'px-3 py-1 text-sm rounded bg-purple-600 text-white'
            : 'px-3 py-1 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300';
        
        document.getElementById('btn-ev-clients').className = 
            type === 'clients' 
            ? 'px-3 py-1 text-sm rounded bg-purple-600 text-white'
            : 'px-3 py-1 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300';
        
        // Render new chart
        this.renderEvolutionChart(type);
    },
    
    async loadTopCoiffeuses() {
        try {
            const ventesData = await Utils.get('ventes');
            const ventes = ventesData.data || [];
            
            // Get this month's sales
            const thisMonth = new Date().getMonth();
            const thisYear = new Date().getFullYear();
            
            const coiffeuseCA = {};
            
            ventes.forEach(v => {
                const d = new Date(v.date_vente);
                if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
                    const id = v.coiffeuse_id;
                    const nom = v.coiffeuse_nom;
                    
                    if (!coiffeuseCA[id]) {
                        coiffeuseCA[id] = { nom: nom, ca: 0 };
                    }
                    coiffeuseCA[id].ca += v.montant_total || 0;
                }
            });
            
            // Get top 3
            const top3 = Object.values(coiffeuseCA)
                .sort((a, b) => b.ca - a.ca)
                .slice(0, 3);
            
            const container = document.getElementById('top-coiffeuses');
            if (!container) return;
            
            if (top3.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-sm">Aucune donnée ce mois</p>';
                return;
            }
            
            const medals = ['🥇', '🥈', '🥉'];
            const colors = ['bg-yellow-50 border-yellow-200', 'bg-gray-50 border-gray-200', 'bg-orange-50 border-orange-200'];
            
            container.innerHTML = top3.map((coif, idx) => `
                <div class="flex items-center justify-between p-3 border-2 ${colors[idx]} rounded-lg">
                    <div class="flex items-center space-x-3">
                        <span class="text-2xl">${medals[idx]}</span>
                        <div>
                            <p class="font-medium text-gray-800">${coif.nom}</p>
                            <p class="text-sm text-gray-600">${Utils.formatCurrency(coif.ca)}</p>
                        </div>
                    </div>
                    <span class="text-2xl font-bold text-gray-400">#${idx + 1}</span>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading top coiffeuses:', error);
        }
    },
    
    async loadTopClients() {
        try {
            const ventesData = await Utils.get('ventes');
            const ventes = ventesData.data || [];
            
            const clientTotals = {};
            
            ventes.forEach(v => {
                const id = v.client_id;
                const nom = v.client_nom || 'Client anonyme';
                const tel = v.client_telephone || '';
                
                if (!clientTotals[id]) {
                    clientTotals[id] = { nom: nom, tel: tel, total: 0 };
                }
                clientTotals[id].total += v.montant_total || 0;
            });
            
            // Get top 5
            const top5 = Object.values(clientTotals)
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);
            
            const container = document.getElementById('top-clients');
            if (!container) return;
            
            if (top5.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-sm">Aucune vente enregistrée</p>';
                return;
            }
            
            container.innerHTML = top5.map((client, idx) => `
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span class="font-bold text-purple-600">${idx + 1}</span>
                        </div>
                        <div>
                            <p class="font-medium text-gray-800">${client.nom}</p>
                            ${client.tel ? `<p class="text-xs text-gray-500">${client.tel}</p>` : ''}
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-purple-600">${Utils.formatCurrency(client.total)}</p>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading top clients:', error);
        }
    },
    
    async loadProchainRendezVous() {
        try {
            const rdvData = await Utils.get('rendez_vous');
            const rdv = rdvData.data || [];
            
            // Filter future appointments (not cancelled or reporté)
            const now = Date.now();
            const upcoming = rdv
                .filter(r => {
                    return r.date_rdv > now && 
                           r.statut !== 'Annulé' && 
                           r.statut !== 'Reporté' &&
                           r.statut !== 'Terminé';
                })
                .sort((a, b) => a.date_rdv - b.date_rdv)
                .slice(0, 5);
            
            const container = document.getElementById('prochains-rdv');
            if (!container) return;
            
            if (upcoming.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-sm">Aucun rendez-vous à venir</p>';
                return;
            }
            
            container.innerHTML = upcoming.map(r => `
                <div class="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                        <p class="font-medium text-gray-800">${r.client_nom}</p>
                        <p class="text-sm text-gray-600">${r.service_nom} • ${r.coiffeuse_nom}</p>
                        <p class="text-xs text-gray-500">${Utils.formatDateTime(r.date_rdv)}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-medium text-gray-800">${Utils.formatCurrency(r.prix)}</p>
                        ${Utils.getStatusBadge(r.statut)}
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading rendez-vous:', error);
        }
    },
    
    async loadAlertesStock() {
        try {
            const [produitsData, consommablesData] = await Promise.all([
                Utils.get('produits'),
                Utils.get('consommables')
            ]);
            
            const produits = produitsData.data || [];
            const consommables = consommablesData.data || [];
            
            // Filter low stock products
            const lowStockProduits = produits.filter(p => 
                p.actif && p.stock_actuel <= p.stock_minimum
            );
            
            // Filter low stock consommables
            const lowStockConsommables = consommables.filter(c => 
                c.actif && c.stock_actuel <= c.stock_minimum
            );
            
            const container = document.getElementById('alertes-stock');
            if (!container) return;
            
            if (lowStockProduits.length === 0 && lowStockConsommables.length === 0) {
                container.innerHTML = `
                    <div class="flex items-center space-x-2 text-green-600">
                        <i class="fas fa-check-circle"></i>
                        <p class="text-sm">Tous les stocks sont suffisants</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            
            // Display low stock products
            if (lowStockProduits.length > 0) {
                html += '<h4 class="text-xs font-semibold text-gray-500 uppercase mb-2 mt-2"><i class="fas fa-box mr-1"></i>Produits</h4>';
                html += lowStockProduits.map(p => `
                    <div class="flex items-center justify-between py-3 border-b last:border-0">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-exclamation-circle text-red-500 text-xl"></i>
                            <div>
                                <p class="font-medium text-gray-800">${p.nom}</p>
                                <p class="text-sm text-gray-600">${p.categorie}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-medium text-red-600">Stock: ${p.stock_actuel}</p>
                            <p class="text-xs text-gray-500">Min: ${p.stock_minimum}</p>
                        </div>
                    </div>
                `).join('');
            }
            
            // Display low stock consommables
            if (lowStockConsommables.length > 0) {
                html += '<h4 class="text-xs font-semibold text-gray-500 uppercase mb-2 mt-4"><i class="fas fa-flask mr-1"></i>Consommables</h4>';
                html += lowStockConsommables.map(c => `
                    <div class="flex items-center justify-between py-3 border-b last:border-0">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-exclamation-triangle text-orange-500 text-xl"></i>
                            <div>
                                <p class="font-medium text-gray-800">${c.nom}</p>
                                <p class="text-sm text-gray-600">${c.categorie}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-medium text-orange-600">Stock: ${c.stock_actuel} ${c.unite}</p>
                            <p class="text-xs text-gray-500">Min: ${c.stock_minimum} ${c.unite}</p>
                        </div>
                    </div>
                `).join('');
            }
            
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading stock alerts:', error);
        }
    }
};
