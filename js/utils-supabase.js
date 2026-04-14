// ============================================
// UTILS - SUPABASE VERSION
// JL BEAUTY SYSTEM
// ============================================

const Utils = {

    // =========================================================================
    // ── FORMAT MONNAIE ────────────────────────────────────────────────────────
    // =========================================================================

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

    // =========================================================================
    // ── FORMAT DATES ──────────────────────────────────────────────────────────
    // =========================================================================

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            year:  'numeric',
            month: 'long',
            day:   'numeric'
        }).format(date);
    },

    formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            year:   'numeric',
            month:  '2-digit',
            day:    '2-digit',
            hour:   '2-digit',
            minute: '2-digit'
        }).format(date);
    },

    formatTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            hour:   '2-digit',
            minute: '2-digit'
        }).format(date);
    },

    // =========================================================================
    // ── BADGES STATUT ─────────────────────────────────────────────────────────
    // =========================================================================

    getStatusBadge(status, type = 'default') {
        const colors = {
            'Actif':       'bg-green-100 text-green-800',
            'Inactif':     'bg-gray-100 text-gray-800',
            'VIP':         'bg-purple-100 text-purple-800',
            'Congé':       'bg-yellow-100 text-yellow-800',
            'Programmé':   'bg-blue-100 text-blue-800',
            'Confirmé':    'bg-green-100 text-green-800',
            'En cours':    'bg-yellow-100 text-yellow-800',
            'Terminé':     'bg-gray-100 text-gray-800',
            'Annulé':      'bg-red-100 text-red-800',
            'Reporté':     'bg-orange-100 text-orange-800',
            'Absent':      'bg-orange-100 text-orange-800',
            'Excellent':   'bg-green-100 text-green-800',
            'Bon':         'bg-blue-100 text-blue-800',
            'Moyen':       'bg-yellow-100 text-yellow-800',
            'Défectueux':  'bg-orange-100 text-orange-800',
            'Hors service':'bg-red-100 text-red-800',
            'Calculé':     'bg-blue-100 text-blue-800',
            'Payé':        'bg-green-100 text-green-800'
        };
        const color = colors[status] || 'bg-gray-100 text-gray-800';
        return `<span class="badge ${color}">${status}</span>`;
    },

    // =========================================================================
    // ── API CALLS ─────────────────────────────────────────────────────────────
    // =========================================================================

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
                    data:  data || [],
                    total: data?.length || 0,
                    page:  1,
                    limit: data?.length || 0,
                    table
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

            // ✅ Mode offline → stocker en local
            if (!navigator.onLine && window.OfflineManager) {
                await OfflineManager.addPendingOp('create', table, data);
                console.warn(`📴 [${table}] Sauvegardé offline`);
                return { ...data, id: 'offline_' + Date.now(), _offline: true };
            }

            const { id, ...cleanData } = data;
            if (id) console.warn(`⚠️ [${table}] Champ "id" retiré automatiquement.`);

            const { data: result, error } = await window.supabase
                .from(table)
                .insert([cleanData])
                .select()
                .single();

            if (error) {
                console.error(`❌ Error creating ${table}:`, error.message);
                console.error('📦 Data envoyée:', cleanData);
                throw error;
            }

            console.log(`✅ [${table}] Enregistrement créé:`, result);
            return result;

        } catch (error) {
            // ✅ Erreur réseau → basculer offline automatiquement
            if (
                error.message?.includes('fetch')   ||
                error.message?.includes('network') ||
                error.message?.includes('Failed to fetch')
            ) {
                console.warn(`⚠️ [${table}] Erreur réseau → mode offline`);
                if (window.OfflineManager) {
                    await OfflineManager.addPendingOp('create', table, data);
                    OfflineManager.showBanner('offline');
                    return { ...data, id: 'offline_' + Date.now(), _offline: true };
                }
            }
            console.error(`Error creating ${table}:`, error.message);
            throw error;
        }
    },

    async update(table, id, data) {
        try {
            if (!window.supabase) throw new Error('Supabase client not initialized');

            // ✅ Mode offline → stocker en local
            if (!navigator.onLine && window.OfflineManager) {
                await OfflineManager.addPendingOp('update', table, { ...data, id });
                console.warn(`📴 [${table}] Update sauvegardé offline`);
                return { ...data, id, _offline: true };
            }

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
            // ✅ Erreur réseau → basculer offline automatiquement
            if (
                error.message?.includes('fetch')   ||
                error.message?.includes('network') ||
                error.message?.includes('Failed to fetch')
            ) {
                console.warn(`⚠️ [${table}] Erreur réseau → mode offline`);
                if (window.OfflineManager) {
                    await OfflineManager.addPendingOp('update', table, { ...data, id });
                    OfflineManager.showBanner('offline');
                    return { ...data, id, _offline: true };
                }
            }
            console.error(`Error updating ${table}:`, error);
            throw error;
        }
    },

    async delete(table, id) {
        try {
            if (!window.supabase) throw new Error('Supabase client not initialized');

            // ✅ Mode offline → stocker en local
            if (!navigator.onLine && window.OfflineManager) {
                await OfflineManager.addPendingOp('delete', table, { id });
                console.warn(`📴 [${table}] Delete sauvegardé offline`);
                return { _offline: true };
            }

            const { error } = await window.supabase
                .from(table)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;

        } catch (error) {
            // ✅ Erreur réseau → basculer offline automatiquement
            if (
                error.message?.includes('fetch')   ||
                error.message?.includes('network') ||
                error.message?.includes('Failed to fetch')
            ) {
                console.warn(`⚠️ [${table}] Erreur réseau → mode offline`);
                if (window.OfflineManager) {
                    await OfflineManager.addPendingOp('delete', table, { id });
                    OfflineManager.showBanner('offline');
                    return { _offline: true };
                }
            }
            console.error(`Error deleting ${table}:`, error);
            throw error;
        }
    },

    // =========================================================================
    // ── UI HELPERS ────────────────────────────────────────────────────────────
    // =========================================================================

    confirm(message) {
        return window.confirm(message);
    },

    // =========================================================================
    // createModal()
    // =========================================================================
    // Paramètres :
    //   title          — string HTML du titre
    //   content        — string HTML du corps
    //   onSave         — function callback du bouton principal
    //                    null  → aucun bouton d'action (ex : modale info / logs)
    //   saveLabel      — libellé du bouton principal (défaut : "Enregistrer")
    //   showSaveButton — forcer l'affichage du bouton même sans onSave
    //                    (usage rare, garde la compatibilité avec l'ancien code)
    // =========================================================================
    createModal(
        title,
        content,
        onSave         = null,
        saveLabel      = 'Enregistrer',
        showSaveButton = null   // ← null = auto (true si onSave fourni)
    ) {
        // ── Résolution automatique de showSaveButton ──────────────────────
        // Si l'appelant passe explicitement true/false on l'honore,
        // sinon on déduit : bouton visible seulement si onSave est une fonction.
        //
        // Compatibilité ascendante :
        //   createModal(title, content, null)          → pas de bouton  ✅
        //   createModal(title, content, fn)            → bouton "Enregistrer" ✅
        //   createModal(title, content, fn, 'Confirm') → bouton "Confirm" ✅
        //   createModal(title, content, null, '', true)→ bouton sans handler ✅
        if (showSaveButton === null) {
            showSaveButton = typeof onSave === 'function';
        }

        // ── Création du DOM ───────────────────────────────────────────────
        const modal       = document.createElement('div');
        modal.className   =
            'modal-overlay fixed inset-0 bg-black bg-opacity-50 ' +
            'flex items-center justify-center z-50 p-4';

        modal.innerHTML = `
            <div class="modal-content bg-white rounded-xl shadow-2xl
                        w-full max-w-2xl max-h-[90vh] overflow-y-auto
                        flex flex-col">

                <!-- ── En-tête ── -->
                <div class="modal-header flex items-center justify-between
                            px-6 py-4 border-b border-gray-200
                            sticky top-0 bg-white z-10 flex-shrink-0">
                    <h3 class="text-lg font-bold text-gray-800
                               flex items-center gap-2">
                        ${title}
                    </h3>
                    <button class="modal-close w-8 h-8 flex items-center
                                   justify-center rounded-lg text-gray-400
                                   hover:text-gray-600 hover:bg-gray-100
                                   transition-colors text-xl leading-none"
                            onclick="this.closest('.modal-overlay').remove()"
                            aria-label="Fermer">
                        &times;
                    </button>
                </div>

                <!-- ── Corps ── -->
                <div class="modal-body px-6 py-5 flex-1">
                    ${content}
                </div>

                <!-- ── Pied (conditionnel) ── -->
                ${showSaveButton ? `
                <div class="modal-footer flex justify-end gap-3
                            px-6 py-4 border-t border-gray-200
                            sticky bottom-0 bg-white flex-shrink-0">
                    <button class="modal-cancel px-4 py-2 rounded-lg
                                   bg-gray-100 text-gray-700 text-sm font-medium
                                   hover:bg-gray-200 transition-colors"
                            onclick="this.closest('.modal-overlay').remove()">
                        Annuler
                    </button>
                    <button class="modal-save px-5 py-2 rounded-lg text-sm
                                   font-medium text-white transition-colors
                                   bg-gradient-to-r from-yellow-500 to-black
                                   hover:shadow-lg hover:opacity-90">
                        ${saveLabel}
                    </button>
                </div>` : ''}
            </div>`;

        // ── Attacher le callback ──────────────────────────────────────────
        if (typeof onSave === 'function' && showSaveButton) {
            const saveBtn = modal.querySelector('.modal-save');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => onSave(modal));
            }
        }

        // ── Fermer au clic sur l'overlay (hors contenu) ───────────────────
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // ── Fermer à la touche Echap ──────────────────────────────────────
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        document.body.appendChild(modal);
        return modal;
    },

    // =========================================================================
    // ✅ closeModal()
    // Ferme la modale la plus haute dans le DOM
    // Pratique pour l'appeler depuis n'importe quel module
    // =========================================================================
    closeModal(modal = null) {
        if (modal && modal.parentNode) {
            modal.remove();
            return;
        }
        // Sinon fermer la dernière overlay visible
        const overlays = document.querySelectorAll('.modal-overlay');
        if (overlays.length > 0) {
            overlays[overlays.length - 1].remove();
        }
    },

    // =========================================================================
    // ✅ showToast()
    // Notification légère non-bloquante (alternative à App.showNotification)
    // Usage : Utils.showToast('Message', 'success' | 'error' | 'warning' | 'info')
    // =========================================================================
    showToast(message, type = 'info', duration = 3500) {
        const colors = {
            success: 'bg-green-600',
            error:   'bg-red-600',
            warning: 'bg-yellow-500',
            info:    'bg-blue-600',
        };
        const icons = {
            success: 'fa-check-circle',
            error:   'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info:    'fa-info-circle',
        };

        const toast = document.createElement('div');
        toast.className =
            `fixed bottom-5 right-5 z-[9999] flex items-center gap-3
             px-4 py-3 rounded-xl text-white text-sm font-medium shadow-xl
             transition-all duration-300 opacity-0 translate-y-2
             ${colors[type] || colors.info}`;
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>`;

        document.body.appendChild(toast);

        // Animer l'entrée
        requestAnimationFrame(() => {
            toast.classList.remove('opacity-0', 'translate-y-2');
        });

        // Retirer après `duration` ms
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    },

    // =========================================================================
    // getFormData()
    // =========================================================================
    getFormData(form, fields = null) {
        const formData = new FormData(form);
        const data     = {};

        if (!fields) {
            for (const [key] of formData.entries()) {
                const input = form.elements[key];
                if (input) {
                    if (input.type === 'checkbox') {
                        data[key] = input.checked;
                    } else if (input.type === 'number') {
                        data[key] = formData.get(key) === ''
                            ? 0
                            : parseFloat(formData.get(key));
                    } else {
                        data[key] = formData.get(key);
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
                        data[field] = formData.get(field) === ''
                            ? 0
                            : parseFloat(formData.get(field));
                    } else {
                        data[field] = formData.get(field);
                    }
                }
            });
        }

        return data;
    },

    // =========================================================================
    // Export / Import (non disponible en mode Supabase cloud)
    // =========================================================================
    exportToFile() {
        alert(
            'Export non disponible en version Supabase. ' +
            'Utilisez le dashboard Supabase pour exporter vos données.'
        );
    },

    importFromFile() {
        alert(
            'Import non disponible en version Supabase. ' +
            'Utilisez le dashboard Supabase pour importer vos données.'
        );
    }
};

// ── Export global ────────────────────────────────────────────────────────────
window.Utils = Utils;
console.log('✅ Utils (Supabase version) loaded successfully');
