// Dashboard Module - Version 3 - Compatible ventes Mixte
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

    // =========================================================================
    // render()
    // =========================================================================
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

            <!-- Evolution Chart -->
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

            <!-- Top Performers Row -->
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

    // =========================================================================
    // loadStats() — montant_total couvre tous les types (Service/Produit/Mixte)
    // =========================================================================
    async loadStats() {
        try {
            const [clientsData, rdvData, ventesData] = await Promise.all([
                Utils.get('clients'),
                Utils.get('rendez_vous'),
                Utils.get('ventes')
            ]);

            const clients = clientsData.data || [];
            const rdv     = rdvData.data     || [];
            const ventes  = ventesData.data  || [];

            // Rendez-vous aujourd'hui (non annulés/reportés)
            const today = new Date().toDateString();
            this.stats.rendezVousAujourdhui = rdv.filter(r => {
                const rdvDate = new Date(r.date_rdv).toDateString();
                return rdvDate === today &&
                       r.statut !== 'Annulé' &&
                       r.statut !== 'Reporté';
            }).length;

            // Total clients
            this.stats.clientsTotal = clients.length;

            // Revenus du jour — tous types confondus
            this.stats.revenusJour = ventes
                .filter(v => new Date(v.date_vente).toDateString() === today)
                .reduce((sum, v) => sum + (v.montant_total || 0), 0);

            // Revenus du mois — tous types confondus
            const thisMonth = new Date().getMonth();
            const thisYear  = new Date().getFullYear();
            this.stats.revenusMois = ventes
                .filter(v => {
                    const d = new Date(v.date_vente);
                    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
                })
                .reduce((sum, v) => sum + (v.montant_total || 0), 0);

        } catch (error) {
            console.error('[Dashboard] loadStats error:', error);
        }
    },

    // =========================================================================
    // renderCharts()
    // =========================================================================
    async renderCharts() {
        try {
            const ventesData = await Utils.get('ventes');
            const ventes = ventesData.data || [];

            // Détruire les graphiques existants
            Object.keys(this.charts).forEach(key => {
                if (this.charts[key]) {
                    this.charts[key].destroy();
                    this.charts[key] = null;
                }
            });

            await this.renderRevenusChart(ventes);
            await this.renderServicesChart(ventes);
            await this.renderEvolutionChart('ca');

        } catch (error) {
            console.error('[Dashboard] renderCharts error:', error);
        }
    },

    // =========================================================================
    // renderRevenusChart() — montant_total couvre tous les types
    // =========================================================================
    async renderRevenusChart(ventes) {
        const ctx = document.getElementById('revenusChart');
        if (!ctx) return;

        const last7Days = [];
        const revenues  = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));

            const dayRevenue = ventes
                .filter(v => new Date(v.date_vente).toDateString() === date.toDateString())
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
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => Utils.formatCurrency(ctx.parsed.y)
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: v => Utils.formatCurrency(v) }
                    }
                }
            }
        });
    },

    // =========================================================================
    // renderServicesChart() ✅ CORRIGÉ — supporte Service, Mixte, JSON string
    // =========================================================================
    async renderServicesChart(ventes) {
        const ctx = document.getElementById('servicesChart');
        if (!ctx) return;

        const serviceCounts = {};

        ventes.forEach(v => {
            // Traiter Service ET Mixte
            if (v.type !== 'Service' && v.type !== 'Mixte') return;

            // Parser les items (JSON string ou tableau)
            const items = typeof v.items === 'string'
                ? (() => { try { return JSON.parse(v.items); } catch(e) { return null; } })()
                : v.items;

            if (items && Array.isArray(items) && items.length > 0) {
                items.forEach(item => {
                    // Pour les ventes Mixte, ne compter que les items Service
                    if (v.type === 'Mixte' && item.item_type !== 'Service') return;

                    const nom = item.item_nom || item.nom || item.service_nom;
                    if (nom) {
                        serviceCounts[nom] = (serviceCounts[nom] || 0) + 1;
                    }
                });
            } else if (v.item_nom) {
                // Fallback vente à item unique sans tableau items
                serviceCounts[v.item_nom] = (serviceCounts[v.item_nom] || 0) + 1;
            }
        });

        // Top 5
        const sorted = Object.entries(serviceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (sorted.length === 0) {
            const wrapper = ctx.parentElement;
            if (wrapper) {
                wrapper.innerHTML = `
                    <p class="text-gray-400 text-sm text-center py-8">
                        Aucun service enregistré
                    </p>`;
            }
            return;
        }

        const labels = sorted.map(s => s[0]);
        const data   = sorted.map(s => s[1]);
        const colors = ['#9333ea', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

        this.charts.services = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
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
                        labels: { padding: 15, font: { size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label} : ${ctx.parsed} fois`
                        }
                    }
                }
            }
        });
    },

    // =========================================================================  
    // renderEvolutionChart() — montant_total couvre tous les types  
    // =========================================================================  
    async renderEvolutionChart(type) {  
        const ctx = document.getElementById('evolutionChart');  
        if (!ctx) return;  

        if (this.charts.evolution) {  
            this.charts.evolution.destroy();  
            this.charts.evolution = null;  
        }  

        const last30Days = [];  
        const values     = [];  

        if (type === 'ca') {  
            const ventesData = await Utils.get('ventes');  
            const ventes     = ventesData.data || [];  

            for (let i = 29; i >= 0; i--) {  
                const date = new Date();  
                date.setDate(date.getDate() - i);  
                last30Days.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));  

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
                        label: "Chiffre d'affaire",  
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
                        legend: { display: false },  
                        tooltip: {  
                            callbacks: {  
                                label: ctx => Utils.formatCurrency(ctx.parsed.y)  
                            }  
                        }  
                    },  
                    scales: {  
                        y: {  
                            beginAtZero: true,  
                            ticks: { callback: v => Utils.formatCurrency(v) }  
                        },  
                        x: { ticks: { maxTicksLimit: 10 } }  
                    }  
                }  
            });  

        } else {  
            // Nouveaux clients  
            const clientsData = await Utils.get('clients');  
            const clients     = clientsData.data || [];  

            for (let i = 29; i >= 0; i--) {  
                const date = new Date();  
                date.setDate(date.getDate() - i);  
                last30Days.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));  

                const dayClients = clients.filter(c => {  
                    if (!c.date_inscription) return false;  
                    return new Date(c.date_inscription).toDateString() === date.toDateString();  
                }).length;  

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
                    plugins: { legend: { display: false } },  
                    scales: {  
                        y: { beginAtZero: true, ticks: { stepSize: 1 } },  
                        x: { ticks: { maxTicksLimit: 10 } }  
                    }  
                }  
            });  
        }  
    },  

    // =========================================================================  
    // switchEvolutionChart()  
    // =========================================================================  
    switchEvolutionChart(type) {  
        const btnCA      = document.getElementById('btn-ev-ca');  
        const btnClients = document.getElementById('btn-ev-clients');  
        if (!btnCA || !btnClients) return;  

        const activeClass   = 'px-3 py-1 text-sm rounded bg-purple-600 text-white';  
        const inactiveClass = 'px-3 py-1 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300';  

        btnCA.className      = type === 'ca'      ? activeClass : inactiveClass;  
        btnClients.className = type === 'clients' ? activeClass : inactiveClass;  

        this.renderEvolutionChart(type);  
    },  

    // =========================================================================  
    // loadTopCoiffeuses() ✅ CORRIGÉ — parcourt les items pour les ventes Mixte  
    // =========================================================================  
    async loadTopCoiffeuses() {  
        try {  
            const [ventesData, coiffeusesData] = await Promise.all([  
                Utils.get('ventes'),  
                Utils.get('coiffeuses')  
            ]);  
            const ventes     = ventesData.data     || [];  
            const coiffeuses = coiffeusesData.data || [];  

            const thisMonth = new Date().getMonth();  
            const thisYear  = new Date().getFullYear();  

            const coiffeuseCA = {};  

            ventes.forEach(v => {  
                const d = new Date(v.date_vente);  
                if (d.getMonth() !== thisMonth || d.getFullYear() !== thisYear) return;  

                // Traiter uniquement les ventes contenant des services  
                if (v.type !== 'Service' && v.type !== 'Mixte') return;  

                const items = typeof v.items === 'string'  
                    ? (() => { try { return JSON.parse(v.items); } catch(e) { return null; } })()  
                    : v.items;  

                if (items && Array.isArray(items) && items.length > 0) {  
                    items.forEach(item => {  
                        // Pour les ventes Mixte, ne prendre que les items Service  
                        if (v.type === 'Mixte' && item.item_type !== 'Service') return;  

                        const coifId  = item.coiffeuse_id;  
                        const coifNom = item.coiffeuse_nom;  
                        if (!coifId || !coifNom) return;  

                        const subtotal = (item.prix_unitaire || 0) * (item.quantite || 1);  
                        if (!coiffeuseCA[coifId]) {  
                            coiffeuseCA[coifId] = { nom: coifNom, ca: 0 };  
                        }  
                        coiffeuseCA[coifId].ca += subtotal;  
                    });  
                } else {  
                    // Fallback — vente simple sans tableau items  
                    const coifId  = v.coiffeuse_id;  
                    const coifNom = v.coiffeuse_nom;  
                    if (coifId && coifNom) {  
                        if (!coiffeuseCA[coifId]) {  
                            coiffeuseCA[coifId] = { nom: coifNom, ca: 0 };  
                        }  
                        coiffeuseCA[coifId].ca += v.montant_total || 0;  
                    }  
                }  
            });  

            // Enrichir avec la table coiffeuses si nom manquant  
            Object.keys(coiffeuseCA).forEach(id => {  
                if (!coiffeuseCA[id].nom) {  
                    const found = coiffeuses.find(c => c.id === id);  
                    if (found) coiffeuseCA[id].nom = found.nom;  
                }  
            });  

            const top3 = Object.values(coiffeuseCA)  
                .filter(c => c.nom)  
                .sort((a, b) => b.ca - a.ca)  
                .slice(0, 3);  

            const container = document.getElementById('top-coiffeuses');  
            if (!container) return;  

            if (top3.length === 0) {  
                container.innerHTML = '<p class="text-gray-500 text-sm">Aucune donnée ce mois</p>';  
                return;  
            }  

            const medals = ['🥇', '🥈', '🥉'];  
            const colors = [  
                'bg-yellow-50 border-yellow-200',  
                'bg-gray-50 border-gray-200',  
                'bg-orange-50 border-orange-200'  
            ];  

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
            console.error('[Dashboard] loadTopCoiffeuses error:', error);  
        }  
    },  

    // =========================================================================  
    // loadTopClients() ✅ CORRIGÉ — groupement par téléphone si client_id absent  
    // =========================================================================  
    async loadTopClients() {  
        try {  
            const ventesData = await Utils.get('ventes');  
            const ventes     = ventesData.data || [];  

            const clientTotals = {};  

            ventes.forEach(v => {  
                // Clé de regroupement : client_id si dispo, sinon téléphone  
                const key = v.client_id || v.client_telephone || 'anonyme';  
                const nom = v.client_nom       || 'Client anonyme';  
                const tel = v.client_telephone || '';  

                if (!clientTotals[key]) {  
                    clientTotals[key] = { nom, tel, total: 0 };  
                }  
                // Mettre à jour le nom si on avait "Client anonyme" et qu'on a mieux  
                if (clientTotals[key].nom === 'Client anonyme' && nom !== 'Client anonyme') {  
                    clientTotals[key].nom = nom;  
                }  
                clientTotals[key].total += v.montant_total || 0;  
            });  

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
            console.error('[Dashboard] loadTopClients error:', error);  
        }  
    },  

    // =========================================================================  
    // loadProchainRendezVous() ✅ CORRIGÉ — comparaison de dates robuste  
    // =========================================================================  
    async loadProchainRendezVous() {  
        try {  
            const rdvData = await Utils.get('rendez_vous');  
            const rdv     = rdvData.data || [];  

            const now = Date.now();  

            const upcoming = rdv  
                .filter(r => {  
                    const rdvTime = new Date(r.date_rdv).getTime();  
                    return rdvTime > now &&  
                           r.statut !== 'Annulé'  &&  
                           r.statut !== 'Reporté' &&  
                           r.statut !== 'Terminé';  
                })  
                .sort((a, b) => new Date(a.date_rdv) - new Date(b.date_rdv))  
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
                        <p class="font-medium text-gray-800">${r.client_nom || 'Client'}</p>  
                        <p class="text-sm text-gray-600">  
                            ${r.service_nom || '-'} • ${r.coiffeuse_nom || '-'}  
                        </p>  
                        <p class="text-xs text-gray-500">${Utils.formatDateTime(r.date_rdv)}</p>  
                    </div>  
                    <div class="text-right">  
                        <p class="font-medium text-gray-800">${Utils.formatCurrency(r.prix || 0)}</p>  
                        ${typeof Utils.getStatusBadge === 'function' ? Utils.getStatusBadge(r.statut) : ''}  
                    </div>  
                </div>  
            `).join('');  

        } catch (error) {  
            console.error('[Dashboard] loadProchainRendezVous error:', error);  
        }  
    },  

     // =========================================================================
    // loadAlertesStock() ✅ CORRIGÉ — vérification actif robuste (true/1/'true')
    // =========================================================================
    async loadAlertesStock() {
        try {
            const [produitsData, consommablesData] = await Promise.all([
                Utils.get('produits'),
                Utils.get('consommables')
            ]);

            const produits     = produitsData.data     || [];
            const consommables = consommablesData.data || [];

            // ✅ Normaliser le champ actif (peut être boolean, int ou string selon la DB)
            const isActif = val => val === true || val === 1 || val === 'true' || val === '1';

            const lowStockProduits = produits.filter(p =>
                isActif(p.actif) &&
                p.stock_minimum !== undefined &&
                (p.stock_actuel || 0) <= (p.stock_minimum || 0)
            );

            const lowStockConsommables = consommables.filter(c =>
                isActif(c.actif) &&
                c.stock_minimum !== undefined &&
                (c.stock_actuel || 0) <= (c.stock_minimum || 0)
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

            // ✅ Section Produits
            if (lowStockProduits.length > 0) {
                html += `
                    <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2 mt-2">
                        <i class="fas fa-box mr-1"></i>Produits
                    </h4>`;
                html += lowStockProduits.map(p => `
                    <div class="flex items-center justify-between py-3 border-b last:border-0">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-exclamation-circle text-red-500 text-xl"></i>
                            <div>
                                <p class="font-medium text-gray-800">${p.nom}</p>
                                <p class="text-sm text-gray-600">${p.categorie || '-'}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-medium text-red-600">Stock : ${p.stock_actuel ?? 0}</p>
                            <p class="text-xs text-gray-500">Min : ${p.stock_minimum ?? 0}</p>
                        </div>
                    </div>
                `).join('');
            }

            // ✅ Section Consommables
            if (lowStockConsommables.length > 0) {
                html += `
                    <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2 mt-4">
                        <i class="fas fa-flask mr-1"></i>Consommables
                    </h4>`;
                html += lowStockConsommables.map(c => `
                    <div class="flex items-center justify-between py-3 border-b last:border-0">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-exclamation-triangle text-orange-500 text-xl"></i>
                            <div>
                                <p class="font-medium text-gray-800">${c.nom}</p>
                                <p class="text-sm text-gray-600">${c.categorie || '-'}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-medium text-orange-600">
                                Stock : ${c.stock_actuel ?? 0} ${c.unite || ''}
                            </p>
                            <p class="text-xs text-gray-500">
                                Min : ${c.stock_minimum ?? 0} ${c.unite || ''}
                            </p>
                        </div>
                    </div>
                `).join('');
            }

            container.innerHTML = html;

        } catch (error) {
            console.error('[Dashboard] loadAlertesStock error:', error);
            const container = document.getElementById('alertes-stock');
            if (container) {
                container.innerHTML = `
                    <p class="text-sm text-red-500">
                        <i class="fas fa-exclamation-circle mr-1"></i>
                        Impossible de charger les alertes stock
                    </p>`;
            }
        }
    }

};