// Composant réutilisable pour les filtres de période
const PeriodFilter = {
    // Alias: render() -> renderHTML() for compatibility
    render(containerId = 'period-filter') {
        return this.renderHTML(containerId);
    },

    // Generate period filter HTML
    renderHTML(containerId = 'period-filter') {
        return `
            <div id="${containerId}" class="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm mb-4">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-calendar-alt text-gray-600"></i>
                    <label class="text-sm font-medium text-gray-700">Période:</label>
                </div>
                
                <select id="period-type" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="today">Aujourd'hui</option>
                    <option value="yesterday">Hier</option>
                    <option value="this-week">Cette semaine</option>
                    <option value="last-week">Semaine dernière</option>
                    <option value="this-month" selected>Ce mois-ci</option>
                    <option value="last-month">Mois dernier</option>
                    <option value="this-year">Cette année</option>
                    <option value="last-year">Année dernière</option>
                    <option value="custom">Personnalisée</option>
                </select>
                
                <div id="custom-dates" class="hidden flex items-center space-x-2">
                    <input type="date" id="date-start" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <span class="text-gray-500">à</span>
                    <input type="date" id="date-end" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <button onclick="PeriodFilter.applyFilter()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <i class="fas fa-filter mr-2"></i>Filtrer
                </button>
                
                <button onclick="PeriodFilter.exportPeriod()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <i class="fas fa-file-export mr-2"></i>Exporter
                </button>
            </div>
        `;
    },
    
    // Setup event listeners
    setup(onFilterChange) {
        this.onFilterChange = onFilterChange;
        
        const periodType = document.getElementById('period-type');
        const customDates = document.getElementById('custom-dates');
        
        if (periodType) {
            periodType.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customDates.classList.remove('hidden');
                } else {
                    customDates.classList.add('hidden');
                    this.applyFilter();
                }
            });
        }
        
        // Set default dates for custom
        const today = new Date().toISOString().split('T')[0];
        const startDate = document.getElementById('date-start');
        const endDate = document.getElementById('date-end');
        
        if (startDate) {
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            startDate.value = firstDayOfMonth.toISOString().split('T')[0];
        }
        
        if (endDate) {
            endDate.value = today;
        }
    },
    
    // Get date range based on period type
    getDateRange() {
        const periodType = document.getElementById('period-type')?.value;
        const now = new Date();
        let startDate, endDate;
        
        switch(periodType) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(23, 59, 59, 999));
                break;
                
            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                startDate = new Date(yesterday.setHours(0, 0, 0, 0));
                endDate = new Date(yesterday.setHours(23, 59, 59, 999));
                break;
                
            case 'this-week':
                const firstDayOfWeek = new Date(now);
                firstDayOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
                startDate = new Date(firstDayOfWeek.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(23, 59, 59, 999));
                break;
                
            case 'last-week':
                const lastWeekStart = new Date(now);
                lastWeekStart.setDate(now.getDate() - now.getDay() - 6); // Last Monday
                const lastWeekEnd = new Date(lastWeekStart);
                lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // Last Sunday
                startDate = new Date(lastWeekStart.setHours(0, 0, 0, 0));
                endDate = new Date(lastWeekEnd.setHours(23, 59, 59, 999));
                break;
                
            case 'this-month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
                
            case 'last-month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                break;
                
            case 'this-year':
                startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
                
            case 'last-year':
                startDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
                endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
                break;
                
            case 'custom':
                const dateStart = document.getElementById('date-start')?.value;
                const dateEnd = document.getElementById('date-end')?.value;
                
                if (!dateStart || !dateEnd) {
                    App.showNotification('Veuillez sélectionner les dates de début et fin', 'error');
                    return null;
                }
                
                startDate = new Date(dateStart + 'T00:00:00');
                endDate = new Date(dateEnd + 'T23:59:59');
                break;
                
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        
        return {
            start: startDate.getTime(),
            end: endDate.getTime(),
            startDate: startDate,
            endDate: endDate
        };
    },
    
    // Get period label
    getPeriodLabel() {
        const periodType = document.getElementById('period-type')?.value;
        const range = this.getDateRange();
        
        if (!range) return '';
        
        const formatDate = (date) => {
            return new Intl.DateTimeFormat('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).format(date);
        };
        
        if (periodType === 'custom') {
            return `Du ${formatDate(range.startDate)} au ${formatDate(range.endDate)}`;
        }
        
        const labels = {
            'today': "Aujourd'hui",
            'yesterday': 'Hier',
            'this-week': 'Cette semaine',
            'last-week': 'Semaine dernière',
            'this-month': 'Ce mois-ci',
            'last-month': 'Mois dernier',
            'this-year': 'Cette année',
            'last-year': 'Année dernière'
        };
        
        return labels[periodType] || '';
    },
    
    // Filter data by period
    filterData(data, dateField = 'date') {
        const range = this.getDateRange();
        if (!range) return data;
        
        return data.filter(item => {
            const itemDate = typeof item[dateField] === 'number' 
                ? item[dateField] 
                : new Date(item[dateField]).getTime();
            
            return itemDate >= range.start && itemDate <= range.end;
        });
    },
    
    // Apply filter (calls callback)
    applyFilter() {
        if (this.onFilterChange) {
            this.onFilterChange(this.getDateRange());
        }
    },
    
    // Export period data
    exportPeriod() {
        if (this.onExport) {
            this.onExport(this.getDateRange());
        } else {
            App.showNotification('Export non configuré pour ce module', 'info');
        }
    }
};
