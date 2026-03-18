// Utility functions for LOCAL VERSION (using localStorage)
const Utils = {
    // Format currency (USD with optional CDF)
    formatCurrency(amount, showBoth = false) {
        if (typeof CurrencyConfig === 'undefined') {
            // Fallback if currency-config.js not loaded
            return '$' + parseFloat(amount).toFixed(2);
        }
        
        if (showBoth) {
            return CurrencyConfig.formatBoth(amount);
        } else {
            return CurrencyConfig.format(amount);
        }
    },
    
    // Format currency in USD only
    formatUSD(amount) {
        if (typeof CurrencyConfig !== 'undefined') {
            return CurrencyConfig.format(amount, 'USD');
        }
        return '$' + parseFloat(amount).toFixed(2);
    },
    
    // Format currency in CDF only
    formatCDF(amount) {
        if (typeof CurrencyConfig !== 'undefined') {
            const cdfAmount = CurrencyConfig.convertToCDF(amount);
            return CurrencyConfig.format(cdfAmount, 'CDF');
        }
        return Math.round(amount * 2800) + ' FC';
    },
    
    // Format date
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    },
    
    // Format date and time
    formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },
    
    // Format time only
    formatTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },
    
    // Get status badge HTML
    getStatusBadge(status, type = 'default') {
        const colors = {
            'Actif': 'bg-green-100 text-green-800',
            'Inactif': 'bg-gray-100 text-gray-800',
            'VIP': 'bg-purple-100 text-purple-800',
            'Congé': 'bg-yellow-100 text-yellow-800',
            'Programmé': 'bg-blue-100 text-blue-800',
            'Confirmé': 'bg-green-100 text-green-800',
            'En cours': 'bg-yellow-100 text-yellow-800',
            'Terminé': 'bg-gray-100 text-gray-800',
            'Annulé': 'bg-red-100 text-red-800',
            'Reporté': 'bg-orange-100 text-orange-800',
            'Absent': 'bg-orange-100 text-orange-800',
            'Excellent': 'bg-green-100 text-green-800',
            'Bon': 'bg-blue-100 text-blue-800',
            'Moyen': 'bg-yellow-100 text-yellow-800',
            'Défectueux': 'bg-orange-100 text-orange-800',
            'Hors service': 'bg-red-100 text-red-800',
            'Calculé': 'bg-blue-100 text-blue-800',
            'Payé': 'bg-green-100 text-green-800'
        };
        
        const color = colors[status] || 'bg-gray-100 text-gray-800';
        return `<span class="badge ${color}">${status}</span>`;
    },
    
    // API Calls - Modified to use LocalDB instead of REST API
    async get(table, id = null) {
        try {
            // Simulate async behavior
            await new Promise(resolve => setTimeout(resolve, 50));
            
            if (id) {
                const record = LocalDB.getById(table, id);
                return record;
            } else {
                const data = LocalDB.getAll(table);
                return {
                    data: data,
                    total: data.length,
                    page: 1,
                    limit: data.length,
                    table: table
                };
            }
        } catch (error) {
            console.error('GET Error:', error);
            throw error;
        }
    },
    
    async create(table, data) {
        try {
            console.log('[Utils] CREATE called:', table, data);
            // Simulate async behavior
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const created = LocalDB.create(table, data);
            console.log('[Utils] CREATE result:', created);
            return created;
        } catch (error) {
            console.error('POST Error:', error);
            throw error;
        }
    },
    
    async update(table, id, data) {
        try {
            // Simulate async behavior
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const updated = LocalDB.update(table, id, data);
            return updated;
        } catch (error) {
            console.error('PUT Error:', error);
            throw error;
        }
    },
    
    async delete(table, id) {
        try {
            // Simulate async behavior
            await new Promise(resolve => setTimeout(resolve, 50));
            
            LocalDB.delete(table, id);
            return true;
        } catch (error) {
            console.error('DELETE Error:', error);
            throw error;
        }
    },
    
    // Generate unique ID
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // Show confirmation dialog
    confirm(message) {
        return window.confirm(message);
    },
    
    // Create modal
    createModal(title, content, onSave) {
        const modal = document.createElement('div');
        modal.className = 'modal active fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between p-6 border-b">
                    <h3 class="text-xl font-semibold text-gray-800">${title}</h3>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="p-6">
                    ${content}
                </div>
                <div class="flex justify-end space-x-3 p-6 border-t">
                    <button class="close-modal px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
                        Annuler
                    </button>
                    <button class="save-modal px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700">
                        Enregistrer
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal handlers
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        // Save handler
        modal.querySelector('.save-modal').addEventListener('click', () => {
            if (onSave) onSave(modal);
        });
        
        return modal;
    },
    
    // Get input value from modal
    getFormData(formOrModal, fields = null) {
        const data = {};
        
        // If no fields specified, get all inputs from the form
        if (!fields) {
            const inputs = formOrModal.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.name) {
                    if (input.type === 'checkbox') {
                        data[input.name] = input.checked;
                    } else if (input.type === 'number') {
                        data[input.name] = parseFloat(input.value) || 0;
                    } else {
                        data[input.name] = input.value;
                    }
                }
            });
        } else {
            // Original behavior with field list
            fields.forEach(field => {
                const input = formOrModal.querySelector(`[name="${field}"]`);
                if (input) {
                    if (input.type === 'checkbox') {
                        data[field] = input.checked;
                    } else if (input.type === 'number') {
                        data[field] = parseFloat(input.value) || 0;
                    } else {
                        data[field] = input.value;
                    }
                }
            });
        }
        return data;
    },
    
    // Export data to JSON file
    exportToFile() {
        const data = LocalDB.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `glamsalon-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        App.showNotification('Données exportées avec succès');
    },
    
    // Import data from JSON file
    importFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const success = LocalDB.importData(event.target.result);
                        if (success) {
                            App.showNotification('Données importées avec succès');
                            window.location.reload();
                        } else {
                            App.showNotification('Erreur lors de l\'importation', 'error');
                        }
                    } catch (error) {
                        App.showNotification('Fichier invalide', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    },
    


    // Reset to demo data
    resetToDemoData() {
        if (Utils.confirm('⚠️ Cela va SUPPRIMER toutes vos données et recharger les données de démonstration. Continuer ?')) {
            localStorage.removeItem('glamsalon_demo_loaded');
            LocalDB.loadDemoData();
            App.showNotification('Données de démonstration rechargées');
            window.location.reload();
        }
    }
};
