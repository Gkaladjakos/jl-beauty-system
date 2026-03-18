// Utility functions for API calls and common operations
const Utils = {
    // API Base URL - using relative paths for RESTful Table API
    apiBase: 'tables',
    
    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XAF' // Change to your currency code
        }).format(amount);
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
    
    // API Calls
    async get(table, id = null) {
        try {
            const url = id ? `${this.apiBase}/${table}/${id}` : `${this.apiBase}/${table}?limit=1000`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Erreur de chargement');
            return await response.json();
        } catch (error) {
            console.error('GET Error:', error);
            throw error;
        }
    },
    
    async create(table, data) {
        try {
            const response = await fetch(`${this.apiBase}/${table}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Erreur de création');
            return await response.json();
        } catch (error) {
            console.error('POST Error:', error);
            throw error;
        }
    },
    
    async update(table, id, data) {
        try {
            const response = await fetch(`${this.apiBase}/${table}/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Erreur de mise à jour');
            return await response.json();
        } catch (error) {
            console.error('PUT Error:', error);
            throw error;
        }
    },
    
    async delete(table, id) {
        try {
            const response = await fetch(`${this.apiBase}/${table}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Erreur de suppression');
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
    getFormData(modal, fields) {
        const data = {};
        fields.forEach(field => {
            const input = modal.querySelector(`[name="${field}"]`);
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
        return data;
    }
};
