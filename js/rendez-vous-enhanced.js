// Rendez-vous Module - Enhancements
// Add to existing RendezVous object

// Add calendar view toggle
RendezVous.showCalendarView = false;

// Enhanced render with calendar view option
RendezVous.renderEnhanced = async function(container) {
    await this.loadAllData();
    
    container.innerHTML = `
        <div class="mb-6 flex justify-between items-center">
            <div class="flex space-x-3">
                <button onclick="RendezVous.showAddModal()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <i class="fas fa-plus mr-2"></i>Nouveau rendez-vous
                </button>
                <button onclick="RendezVous.toggleView()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <i class="fas fa-${this.showCalendarView ? 'list' : 'calendar'} mr-2"></i>
                    ${this.showCalendarView ? 'Vue liste' : 'Vue calendrier'}
                </button>
            </div>
            <div class="flex space-x-3">
                <select id="filter-statut" class="px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Tous les statuts</option>
                    <option value="Programmé">Programmé</option>
                    <option value="Confirmé">Confirmé</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Annulé">Annulé</option>
                    <option value="Reporté">Reporté</option>
                </select>
            </div>
        </div>
        
        <div id="rdv-view-container"></div>
    `;
    
    this.renderCurrentView();
    this.setupFilters();
};

RendezVous.toggleView = function() {
    this.showCalendarView = !this.showCalendarView;
    this.renderCurrentView();
    
    // Update button
    const btn = document.querySelector('button[onclick="RendezVous.toggleView()"]');
    if (btn) {
        btn.innerHTML = `
            <i class="fas fa-${this.showCalendarView ? 'list' : 'calendar'} mr-2"></i>
            ${this.showCalendarView ? 'Vue liste' : 'Vue calendrier'}
        `;
    }
};

RendezVous.renderCurrentView = function() {
    const container = document.getElementById('rdv-view-container');
    if (!container) return;
    
    if (this.showCalendarView) {
        this.renderCalendarView();
    } else {
        this.renderListView();
    }
};

RendezVous.renderCalendarView = function() {
    const container = document.getElementById('rdv-view-container');
    if (!container) return;
    
    // Filter by status
    const statusFilter = document.getElementById('filter-statut')?.value;
    let filteredData = this.data;
    
    if (statusFilter) {
        filteredData = filteredData.filter(rdv => rdv.statut === statusFilter);
    }
    
    CalendarView.render(container, filteredData, async (updatedRdv) => {
        await Utils.update('rendez_vous', updatedRdv.id, updatedRdv);
        await this.loadAllData();
        this.renderCalendarView();
    });
};

RendezVous.renderListView = function() {
    const container = document.getElementById('rdv-view-container');
    if (!container) return;
    
    // Original table rendering
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="table-container">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Heure</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coiffeuse</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="rdv-table" class="divide-y divide-gray-200">
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    this.renderTable();
};

// Date validation function
RendezVous.validateDateTime = function(dateStr, timeStr) {
    const selectedDateTime = new Date(dateStr + 'T' + timeStr);
    const now = new Date();
    
    if (selectedDateTime < now) {
        App.showNotification('Impossible de créer un rendez-vous dans le passé', 'error');
        return false;
    }
    
    return true;
};

// Enhanced showAddModal with date validation
RendezVous.showAddModalEnhanced = function() {
    // Get today's date for minimum
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const modalContent = `
        <form id="rdv-form" class="space-y-4">
            <!-- Client Selection -->
            <div>
                <label class="flex items-center mb-2">
                    <input type="radio" name="client-type" value="existing" checked 
                           onchange="RendezVous.toggleClientType()" class="mr-2">
                    <span class="text-sm font-medium text-gray-700">Client existant</span>
                </label>
                <label class="flex items-center mb-2">
                    <input type="radio" name="client-type" value="new" 
                           onchange="RendezVous.toggleClientType()" class="mr-2">
                    <span class="text-sm font-medium text-gray-700">Nouveau client</span>
                </label>
            </div>
            
            <div id="existing-client-section">
                <label class="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <select id="client-select" name="client_id" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        onchange="RendezVous.onClientSelect()">
                    <option value="">Sélectionner un client...</option>
                    ${this.clients.map(c => 
                        `<option value="${c.id}" data-telephone="${c.telephone}" data-nom="${c.nom}">
                            ${c.nom || c.telephone} ${c.nom ? '(' + c.telephone + ')' : ''}
                        </option>`
                    ).join('')}
                </select>
            </div>
            
            <div id="new-client-section" class="hidden space-y-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                    <input type="tel" id="new-client-telephone" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                           placeholder="+243 XXX XXX XXX">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nom (optionnel)</label>
                    <input type="text" id="new-client-nom"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                           placeholder="Nom du client">
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                    <select name="service_id" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            onchange="RendezVous.onServiceSelect(this)">
                        <option value="">Sélectionner...</option>
                        ${this.services.filter(s => s.actif).map(s => 
                            `<option value="${s.id}" data-prix="${s.prix}" data-duree="${s.duree}">
                                ${s.nom} (${s.duree}min - ${Utils.formatCurrency(s.prix)})
                            </option>`
                        ).join('')}
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Coiffeuse *</label>
                    <select name="coiffeuse_id" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="">Sélectionner...</option>
                        ${this.coiffeuses.filter(c => c.statut === 'Actif').map(c => 
                            `<option value="${c.id}" data-nom="${c.nom}">
                                ${c.nom}
                            </option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" id="rdv-date" name="date" required min="${today}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                           onchange="RendezVous.validateDateInput()">
                    <p class="text-xs text-gray-500 mt-1">Minimum: Aujourd'hui</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
                    <input type="time" id="rdv-time" name="heure" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                           onchange="RendezVous.validateDateInput()">
                    <p id="time-hint" class="text-xs text-gray-500 mt-1"></p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Durée (minutes)</label>
                    <input type="number" name="duree" min="5" value="60" readonly
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Prix estimé</label>
                    <input type="text" name="prix_display" readonly
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <input type="hidden" name="prix">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" rows="2"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Informations complémentaires..."></textarea>
            </div>
        </form>
    `;
    
    const modal = Utils.createModal(
        '<i class="fas fa-calendar-plus mr-2"></i>Nouveau rendez-vous',
        modalContent,
        () => this.saveRdv(modal)
    );
    
    document.body.appendChild(modal);
};

RendezVous.validateDateInput = function() {
    const dateInput = document.getElementById('rdv-date');
    const timeInput = document.getElementById('rdv-time');
    const timeHint = document.getElementById('time-hint');
    
    if (!dateInput || !timeInput) return;
    
    const selectedDate = dateInput.value;
    const selectedTime = timeInput.value;
    
    if (!selectedDate || !selectedTime) return;
    
    const selectedDateTime = new Date(selectedDate + 'T' + selectedTime);
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];
    
    // If selected date is today
    if (selectedDate === today) {
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        timeInput.min = currentTime;
        timeHint.textContent = `Minimum: ${currentTime}`;
        timeHint.className = 'text-xs text-orange-600 mt-1';
    } else {
        timeInput.removeAttribute('min');
        timeHint.textContent = '';
    }
    
    // Validate
    if (selectedDateTime < now) {
        timeHint.textContent = '⚠️ Cette heure est dans le passé';
        timeHint.className = 'text-xs text-red-600 mt-1';
        return false;
    }
    
    return true;
};

// Patch existing saveRdv to include validation
RendezVous.saveRdvEnhanced = async function(modal) {
    const form = modal.querySelector('#rdv-form');
    if (!form) return;
    
    const formData = Utils.getFormData(form);
    
    // Validate date/time
    if (!this.validateDateTime(formData.date, formData.heure)) {
        return;
    }
    
    // Continue with original save logic...
    // Call original saveRdv or implement full logic
};
