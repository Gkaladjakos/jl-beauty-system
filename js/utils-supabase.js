// Utility functions for SUPABASE VERSION
const Utils = {
    // Format currency (USD with optional CDF)
    formatCurrency(amount, showBoth = false) {
        if (typeof CurrencyConfig === 'undefined') {
            return '$' + parseFloat(amount).toFixed(2);
        }
        if (showBoth) {
            return CurrencyConfig.formatBoth(amount);
        } else {
            return CurrencyConfig.format(amount);
        }
    },

    formatUSD(amount) {
        if (typeof CurrencyConfig !== 'undefined') {
            return CurrencyConfig.format(amount, 'USD');
        }
        return '$' + parseFloat(amount).toFixed(2);
    },

    formatCDF(amount) {
        if (typeof CurrencyConfig !== 'undefined') {
            const cdfAmount = CurrencyConfig.convertToCDF(amount);
            return CurrencyConfig.format(cdfAmount, 'CDF');
        }
        return Math.round(amount * 2800) + ' FC';
    },

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    },

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

    formatTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },

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

    // ─── API Calls ──────────────────────────────────────────────────────────────

    async get(table, id = null) {
        try {
            if (!window.supabase) throw new Error('Supabase client not initialized');

            if (id) {
                const { data, error } = await window.supabase
                    .from(table)
                    .select('*')
                    .eq('id', id)
                    .single();
                if (error) throw error;
                return data;
            } else {
                const { data, error } = await window.supabase
                    .from(table)
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                return {
                    data: data || [],
                    total: data?.length || 0,
                    page: 1,
                    limit: data?.length || 0,
                    table: table
                };
            }
        } catch (error) {
            console.error(`Error fetching ${table}:`, error);
            throw error;
        }
    },

    async create(table, data) {
        try {
            if (!window.supabase) throw new Error('Supabase client not initialized');

            // ✅ FIX PRINCIPAL : Supprime l'id avant insertion
            // Supabase génère les UUIDs automatiquement côté serveur
            const { id, ...cleanData } = data;

            if (id) {
                console.warn(`⚠️ [${table}] Champ "id" retiré automatiquement avant insertion Supabase.`);
            }

            const { data: result, error } = await window.supabase
                .from(table)
                .insert([cleanData])   // ✅ cleanData sans id
                .select()
                .single();

            if (error) {
                console.error(`❌ Error creating ${table}:`, error.message);
                console.error('📦 Data envoyée (sans id):', cleanData);
                throw error;
            }

            console.log(`✅ [${table}] Enregistrement créé avec succès:`, result);
            return result;

        } catch (error) {
            console.error(`Error creating ${table}:`, error.message);
            throw error;
        }
    },

    async update(table, id, data) {
        try {
            if (!window.supabase) throw new Error('Supabase client not initialized');

            // ✅ Retire aussi l'id du payload de mise à jour
            const { id: _id, ...cleanData } = data;

            const { data: result, error } = await window.supabase
                .from(table)
                .update(cleanData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error(`❌ Error updating ${table}:`, error.message);
                throw error;
            }

            console.log(`✅ [${table}] Enregistrement mis à jour:`, result);
            return result;

        } catch (error) {
            console.error(`Error updating ${table}:`, error);
            throw error;
        }
    },

    async delete(table, id) {
        try {
            if (!window.supabase) throw new Error('Supabase client not initialized');

            const { error } = await window.supabase
                .from(table)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;

        } catch (error) {
            console.error(`Error deleting ${table}:`, error);
            throw error;
        }
    },

    // ⚠️ NE PAS UTILISER avec Supabase — IDs générés automatiquement
    generateId() {
        console.warn('⚠️ generateId() should not be used with Supabase. IDs are auto-generated.');
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },

    // ─── UI Helpers ─────────────────────────────────────────────────────────────

    confirm(message) {
        return window.confirm(message);
    },

    createModal(title, content, onSave = null, showSaveButton = true) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

        modal.innerHTML = `
            <div class="modal-content bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="modal-header px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                    <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                    <button class="modal-close text-gray-400 hover:text-gray-600 text-2xl leading-none" onclick="this.closest('.modal-overlay').remove()">
                        &times;
                    </button>
                </div>
                <div class="modal-body px-6 py-4">
                    ${content}
                </div>
                ${showSaveButton ? `
                <div class="modal-footer px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white">
                    <button class="modal-cancel px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300" onclick="this.closest('.modal-overlay').remove()">
                        Annuler
                    </button>
                    <button class="modal-save px-4 py-2 bg-gradient-to-r from-yellow-500 to-black text-white rounded-lg hover:shadow-lg">
                        Enregistrer
                    </button>
                </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modal);

        if (onSave && showSaveButton) {
            const saveBtn = modal.querySelector('.modal-save');
            saveBtn.addEventListener('click', () => onSave(modal));
        }

        return modal;
    },

    getFormData(form, fields = null) {
        const formData = new FormData(form);
        const data = {};

        if (!fields) {
            for (const [key, value] of formData.entries()) {
                const input = form.elements[key];
                if (input) {
                    if (input.type === 'checkbox') {
                        data[key] = input.checked;
                    } else if (input.type === 'number') {
                        data[key] = value === '' ? 0 : parseFloat(value);
                    } else {
                        data[key] = value;
                    }
                }
            }
        } else {
            fields.forEach(field => {
                const input = form.elements[field];
                if (input) {
                    if (input.type === 'checkbox') {
                        data[field] = input.checked;
                    } else if (input.type === 'number') {
                        data[field] = formData.get(field) === '' ? 0 : parseFloat(formData.get(field));
                    } else {
                        data[field] = formData.get(field);
                    }
                }
            });
        }

        return data;
    },

    exportToFile() {
        alert('Export non disponible en version Supabase. Utilisez le dashboard Supabase pour exporter vos données.');
    },

    importFromFile() {
        alert('Import non disponible en version Supabase. Utilisez le dashboard Supabase pour importer vos données.');
    }
};

// Export Utils globally
window.Utils = Utils;
console.log('✅ Utils (Supabase version) loaded successfully');
