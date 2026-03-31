// Rendez-vous Management Module (Version 4 — Intégration fidélité)
const RendezVous = {
    data: [],
    clients: [],
    coiffeuses: [],
    services: [],
    currentView: 'table',
    draggedAppointmentId: null,

    async render(container) {
        await this.loadAllData();

        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <div class="flex space-x-3">
                    <button onclick="RendezVous.showAddModal()"
                            class="px-4 py-2 bg-gradient-to-r from-yellow-500 to-black text-white rounded-lg hover:shadow-lg">
                        <i class="fas fa-plus mr-2"></i>Nouveau rendez-vous
                    </button>

                    <div class="flex bg-gray-100 rounded-lg p-1">
                        <button id="view-table-btn"
                                onclick="RendezVous.switchView('table')"
                                class="px-4 py-2 rounded-lg transition-colors ${this.currentView === 'table' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}">
                            <i class="fas fa-list mr-2"></i>Liste
                        </button>
                        <button id="view-calendar-btn"
                                onclick="RendezVous.switchView('calendar')"
                                class="px-4 py-2 rounded-lg transition-colors ${this.currentView === 'calendar' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}">
                            <i class="fas fa-calendar-week mr-2"></i>Calendrier
                        </button>
                    </div>
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
                        <option value="Absent">Absent</option>
                    </select>
                    <input type="date" id="filter-date"
                           class="px-4 py-2 border border-gray-300 rounded-lg">
                </div>
            </div>

            <div id="rdv-content-area">
                ${this.renderContentArea()}
            </div>
        `;

        if (this.currentView === 'table') this.renderTable();
        this.setupFilters();
    },

    switchView(view) {
        this.currentView = view;
        const contentArea = document.getElementById('rdv-content-area');
        if (!contentArea) return;

        contentArea.innerHTML = this.renderContentArea();

        const tableBtn    = document.getElementById('view-table-btn');
        const calendarBtn = document.getElementById('view-calendar-btn');

        if (tableBtn) {
            tableBtn.className = `px-4 py-2 rounded-lg transition-colors ${
                view === 'table'
                    ? 'bg-white shadow text-gray-800'
                    : 'text-gray-500 hover:text-gray-700'
            }`;
        }
        if (calendarBtn) {
            calendarBtn.className = `px-4 py-2 rounded-lg transition-colors ${
                view === 'calendar'
                    ? 'bg-white shadow text-gray-800'
                    : 'text-gray-500 hover:text-gray-700'
            }`;
        }

        if (view === 'table') this.renderTable();
    },

    renderContentArea() {
        if (this.currentView === 'calendar') {
            return CalendarView.init(this.data);
        }

        return `
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="table-container">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Heure</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coiffeuse</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="rdv-table" class="divide-y divide-gray-200"></tbody>
                    </table>
                </div>
            </div>
        `;
    },

    calendarPreviousWeek() {
        const contentArea = document.getElementById('rdv-content-area');
        if (contentArea) contentArea.innerHTML = CalendarView.previousWeek();
    },

    calendarNextWeek() {
        const contentArea = document.getElementById('rdv-content-area');
        if (contentArea) contentArea.innerHTML = CalendarView.nextWeek();
    },

    calendarToday() {
        const contentArea = document.getElementById('rdv-content-area');
        if (contentArea) contentArea.innerHTML = CalendarView.goToToday();
    },

    handleDragStart(event) {
        this.draggedAppointmentId = event.target.getAttribute('data-apt-id');
        event.dataTransfer.effectAllowed = 'move';
        event.target.style.opacity = '0.5';
    },

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        event.currentTarget.classList.add('bg-yellow-100');
    },

    async handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('bg-yellow-100');
        if (!this.draggedAppointmentId) return;

        const newDate = event.currentTarget.getAttribute('data-date');
        if (!newDate) return;

        const appointment = this.data.find(apt => apt.id === this.draggedAppointmentId);
        if (!appointment) return;

        const oldTime = this._toLocalTimeString(appointment.date_rdv);

        if (DateValidator.isPast(newDate, oldTime)) {
            App.showNotification('Impossible de reporter un rendez-vous dans le passé', 'error');
            this.draggedAppointmentId = null;
            return;
        }

        if (!window.confirm(
            `Reporter le rendez-vous de ${appointment.client_nom}\n` +
            `du ${Utils.formatDate(appointment.date_rdv)} au ${newDate} ?`
        )) {
            this.draggedAppointmentId = null;
            return;
        }

        try {
            App.showLoading();
            const newDateTime = new Date(`${newDate}T${oldTime}`);

            await Utils.update('rendez_vous', appointment.id, {
                ...appointment,
                date_rdv:          newDateTime.getTime(),
                statut:            'Reporté',
                rdv_precedent_id:  appointment.id,
                notes:             (appointment.notes || '') +
                                   `\n[Reporté depuis le ${Utils.formatDate(appointment.date_rdv)}]`
            });

            await this.loadAllData();
            const contentArea = document.getElementById('rdv-content-area');
            if (contentArea) contentArea.innerHTML = CalendarView.init(this.data);

            App.hideLoading();
            App.showNotification('Rendez-vous reporté avec succès', 'success');
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors du report du rendez-vous', 'error');
            console.error(error);
        }

        this.draggedAppointmentId = null;
    },

    async loadAllData() {
        try {
            const [rdvData, clientsData, coiffeusesData, servicesData] = await Promise.all([
                Utils.get('rendez_vous'),
                Utils.get('clients'),
                Utils.get('coiffeuses'),
                Utils.get('services')
            ]);

            this.data       = rdvData.data       || [];
            this.clients    = clientsData.data    || [];
            this.coiffeuses = coiffeusesData.data || [];
            this.services   = servicesData.data   || [];
        } catch (error) {
            console.error('Error loading data:', error);
        }
    },

    // ─── Utilitaires timezone-safe ────────────────────────────────────────────
    _toLocalDateString(timestamp) {
        const d = new Date(timestamp);
        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0')
        ].join('-');
    },

    _toLocalTimeString(timestamp) {
        const d = new Date(timestamp);
        return [
            String(d.getHours()).padStart(2, '0'),
            String(d.getMinutes()).padStart(2, '0')
        ].join(':');
    },

    // ─── Tableau ──────────────────────────────────────────────────────────────
    renderTable(filteredData = null) {
        const dataToRender = (filteredData || this.data).sort(
            (a, b) => new Date(b.date_rdv) - new Date(a.date_rdv)
        );
        const tbody = document.getElementById('rdv-table');
        if (!tbody) return;

        if (dataToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-calendar-alt text-4xl mb-2"></i>
                        <p>Aucun rendez-vous</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = dataToRender.map(rdv => {
            // ✅ Vérifier si le client a une réduction active
            const clientData = this.clients.find(c => c.id === rdv.client_id);
            const fideliteInfo = clientData
                ? Clients.getFideliteInfo(clientData)
                : null;

            const reductionBadge = fideliteInfo?.reductionActive
                ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 ml-1"
                          title="Réduction -30% applicable sur cette visite">
                       🎉 -30%
                   </span>`
                : '';

            // ✅ Prix avec réduction affichée si applicable
            const prixAffiche = fideliteInfo?.reductionActive
                ? `<p class="font-medium text-green-600">
                       ${Utils.formatCurrency(rdv.prix * (1 - Clients.TAUX_REDUCTION))}
                       <span class="line-through text-gray-400 text-xs ml-1">
                           ${Utils.formatCurrency(rdv.prix)}
                       </span>
                   </p>`
                : `<p class="font-medium text-gray-800">${Utils.formatCurrency(rdv.prix)}</p>`;

            return `
            <tr class="hover:bg-gray-50 ${fideliteInfo?.reductionActive ? 'bg-green-50' : ''}">
                <td class="px-6 py-4">
                    <p class="font-medium text-gray-800">${Utils.formatDate(rdv.date_rdv)}</p>
                    <p class="text-sm text-gray-600">${Utils.formatTime(rdv.date_rdv)}</p>
                    ${rdv.rdv_precedent_id
                        ? '<p class="text-xs text-orange-600"><i class="fas fa-link"></i> Reporté</p>'
                        : ''}
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div>
                            <p class="font-medium text-gray-800">
                                ${rdv.client_nom}${reductionBadge}
                            </p>
                            ${rdv.client_telephone
                                ? `<p class="text-xs text-gray-500">${rdv.client_telephone}</p>`
                                : ''}
                            ${clientData
                                ? `<p class="text-xs text-purple-600">
                                       <i class="fas fa-walking mr-1"></i>
                                       ${clientData.nombre_passages || 0} passage(s)
                                   </p>`
                                : ''}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-800">${rdv.coiffeuse_nom}</p>
                </td>
                <td class="px-6 py-4">
                    <p class="font-medium text-gray-800">${rdv.service_nom}</p>
                    <p class="text-sm text-gray-600">${rdv.duree} minutes</p>
                </td>
                <td class="px-6 py-4">
                    ${prixAffiche}
                </td>
                <td class="px-6 py-4">
                    ${Utils.getStatusBadge(rdv.statut)}
                </td>
                <td class="px-6 py-4">
                    <button onclick="RendezVous.showEditModal('${rdv.id}')"
                            class="text-blue-600 hover:text-blue-800 mr-3" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${rdv.statut !== 'Reporté' ? `
                    <button onclick="RendezVous.reporterRdv('${rdv.id}')"
                            class="text-orange-600 hover:text-orange-800 mr-3" title="Reporter">
                        <i class="fas fa-calendar-plus"></i>
                    </button>` : ''}
                    <button onclick="RendezVous.deleteRdv('${rdv.id}')"
                            class="text-red-600 hover:text-red-800" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    },

    setupFilters() {
        const filterStatut = document.getElementById('filter-statut');
        const filterDate   = document.getElementById('filter-date');

        const applyFilters = () => {
            const statut = filterStatut?.value || '';
            const date   = filterDate?.value   || '';

            const filtered = this.data.filter(rdv => {
                const matchesStatut  = !statut || rdv.statut === statut;
                const rdvDateStr     = this._toLocalDateString(rdv.date_rdv);
                const matchesDate    = !date   || rdvDateStr === date;
                return matchesStatut && matchesDate;
            });

            this.renderTable(filtered);
        };

        if (filterStatut) filterStatut.addEventListener('change', applyFilters);
        if (filterDate)   filterDate.addEventListener('change', applyFilters);
    },
     // ✅ Bandeau fidélité client — affiché dans les modals
     _renderClientFideliteBanner(client) {
        if (!client) return '';
        const info = Clients.getFideliteInfo(client);

        if (info.reductionActive) {
            return `
                <div class="mt-2 p-3 bg-green-50 border border-green-300 rounded-lg flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <span class="text-2xl">🎉</span>
                        <div>
                            <p class="text-sm font-bold text-green-700">Réduction -30% active !</p>
                            <p class="text-xs text-green-600">
                                ${info.passages} passages — La réduction s'applique sur cette visite
                            </p>
                        </div>
                    </div>
                    <span class="text-lg font-black text-green-600">-30%</span>
                </div>`;
        }

        return `
            <div class="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xs text-purple-700 font-medium">
                        <i class="fas fa-walking mr-1"></i>
                        ${info.passages} passage(s) — encore ${info.passagesRestants} avant -30%
                    </span>
                    <span class="text-xs text-gray-500">${info.cycle}/${Clients.PASSAGES_POUR_REDUCTION}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1.5">
                    <div class="bg-purple-500 h-1.5 rounded-full"
                         style="width: ${(info.cycle / Clients.PASSAGES_POUR_REDUCTION) * 100}%"></div>
                </div>
            </div>`;
    },

    showAddModal() {
        const modalContent = `
            <form id="rdv-form" class="space-y-4">

                <!-- Mode client -->
                <div class="flex items-center space-x-4 mb-2">
                    <label class="flex items-center cursor-pointer">
                        <input type="radio" name="client-mode" value="existing" checked class="mr-2">
                        Client existant
                    </label>
                    <label class="flex items-center cursor-pointer">
                        <input type="radio" name="client-mode" value="new" class="mr-2">
                        Nouveau client
                    </label>
                </div>

                <!-- Client existant -->
                <div id="existing-client-section">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                    <select name="client_id" id="client-select"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="">Sélectionner un client</option>
                        ${this.clients.map(c => {
                            const info = Clients.getFideliteInfo(c);
                            const displayName = c.nom && c.nom.trim() !== ''
                                ? c.nom
                                : `Client ${c.telephone}`;
                            const reductionLabel = info.reductionActive ? ' 🎉 -30%' : '';
                            return `<option value="${c.id}"
                                            data-passages="${c.nombre_passages || 0}"
                                            data-reduction="${info.reductionActive}">
                                        ${displayName} (${c.telephone})${reductionLabel}
                                    </option>`;
                        }).join('')}
                    </select>
                    <!-- ✅ Zone fidélité — mise à jour dynamiquement -->
                    <div id="client-fidelite-info"></div>
                </div>

                <!-- Nouveau client -->
                <div id="new-client-section" style="display:none;">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p class="text-sm text-blue-800">
                            <i class="fas fa-info-circle mr-1"></i>
                            Le client sera automatiquement ajouté dans votre base
                        </p>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                            <input type="tel" name="new_client_telephone" id="new-client-tel"
                                   placeholder="+243 XXX XXX XXX"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Nom <span class="text-gray-500 text-xs">(facultatif)</span>
                            </label>
                            <input type="text" name="new_client_nom" id="new-client-name"
                                   placeholder="Laissez vide si anonyme"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        </div>
                    </div>
                </div>

                <!-- Coiffeuse -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Coiffeuse *</label>
                    <select name="coiffeuse_id" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="">Sélectionner une coiffeuse</option>
                        ${this.coiffeuses
                            .filter(c => c.statut === 'Actif')
                            .map(c => `<option value="${c.id}">${c.nom}</option>`)
                            .join('')}
                    </select>
                </div>

                <!-- Service -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                    <select name="service_id" required id="service-select"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="">Sélectionner un service</option>
                        ${this.services
                            .filter(s => s.actif)
                            .map(s => `<option value="${s.id}"
                                               data-prix="${s.prix}"
                                               data-duree="${s.duree}">
                                           ${s.nom} - ${Utils.formatCurrency(s.prix)} (${s.duree} min)
                                       </option>`)
                            .join('')}
                    </select>
                    <!-- ✅ Aperçu du prix avec réduction éventuelle -->
                    <div id="prix-apercu"></div>
                </div>

                <!-- Date / Heure -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                        <input type="date" name="date" id="rdv-date-input" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <p class="text-xs text-gray-500 mt-1">
                            <i class="fas fa-info-circle"></i> Minimum aujourd'hui
                        </p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
                        <input type="time" name="heure" id="rdv-time-input" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <p class="text-xs text-gray-500 mt-1">
                            <i class="fas fa-clock"></i> Au moins 30 min d'avance
                        </p>
                    </div>
                </div>

                <div id="date-validation-error"></div>

                <!-- Statut -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select name="statut"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="Programmé">Programmé</option>
                        <option value="Confirmé">Confirmé</option>
                    </select>
                </div>

                <!-- Notes -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea name="notes" rows="2"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                </div>
            </form>
        `;

        const modal = Utils.createModal('Nouveau rendez-vous', modalContent, async (modal) => {
            const form       = modal.querySelector('#rdv-form');
            const clientMode = form.querySelector('input[name="client-mode"]:checked').value;

            let clientId, clientNom, clientTelephone;

            if (clientMode === 'new') {
                const newTel = form.querySelector('[name="new_client_telephone"]').value.trim();
                const newNom = form.querySelector('[name="new_client_nom"]').value.trim();

                if (!newTel) {
                    App.showNotification('Veuillez entrer le numéro de téléphone du client', 'error');
                    return;
                }

                try {
                    App.showLoading();
                    const newClient = await Utils.create('clients', {
                        nom:             newNom || '',
                        telephone:       newTel,
                        email:           '',
                        date_naissance:  null,
                        adresse:         '',
                        preferences:     '',
                        points_fidelite: 0,
                        nombre_passages: 0,
                        statut:          'Actif',
                        date_inscription: Date.now()
                    });

                    clientId        = newClient.id;
                    clientNom       = newNom || `Client ${newTel}`;
                    clientTelephone = newTel;

                    await this.loadAllData();
                    App.hideLoading();
                } catch (error) {
                    App.hideLoading();
                    App.showNotification('Erreur lors de la création du client', 'error');
                    console.error(error);
                    return;
                }
            } else {
                const selectedClientId = form.querySelector('[name="client_id"]').value;
                if (!selectedClientId) {
                    App.showNotification('Veuillez sélectionner un client', 'error');
                    return;
                }

                const client = this.clients.find(c => c.id === selectedClientId);
                if (!client) {
                    App.showNotification('Client introuvable', 'error');
                    return;
                }

                clientId        = client.id;
                clientNom       = client.nom && client.nom.trim() !== ''
                                    ? client.nom
                                    : `Client ${client.telephone}`;
                clientTelephone = client.telephone;
            }

            if (!form.checkValidity()) { form.reportValidity(); return; }

            const dateInput  = form.querySelector('[name="date"]').value;
            const timeInput  = form.querySelector('[name="heure"]').value;
            const validation = DateValidator.validate(dateInput, timeInput);

            if (!validation.valid) {
                App.showNotification(validation.message, 'error');
                const errBox = modal.querySelector('#date-validation-error');
                if (errBox) {
                    errBox.innerHTML = `
                        <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            <i class="fas fa-exclamation-triangle mr-2"></i>${validation.message}
                        </div>`;
                }
                return;
            }

            try {
                App.showLoading();
                const formData  = new FormData(form);
                const coiffeuse = this.coiffeuses.find(c => c.id === formData.get('coiffeuse_id'));
                const service   = this.services.find(s => s.id === formData.get('service_id'));

                if (!coiffeuse || !service) {
                    App.showNotification('Veuillez sélectionner une coiffeuse et un service', 'error');
                    App.hideLoading();
                    return;
                }

                const dateTime = new Date(`${formData.get('date')}T${formData.get('heure')}`);

                await Utils.create('rendez_vous', {
                    client_id:        clientId,
                    client_nom:       clientNom,
                    client_telephone: clientTelephone,
                    coiffeuse_id:     coiffeuse.id,
                    coiffeuse_nom:    coiffeuse.nom,
                    service_id:       service.id,
                    service_nom:      service.nom,
                    date_rdv:         dateTime.getTime(),
                    duree:            service.duree,
                    prix:             service.prix,
                    statut:           formData.get('statut'),
                    notes:            formData.get('notes') || ''
                });

                App.hideLoading();
                App.showNotification('Rendez-vous créé avec succès');
                modal.remove();
                this.render(document.getElementById('content-area'));
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors de la création', 'error');
                console.error(error);
            }
        });

        // ── Init date/heure min ────────────────────────────────────────────────
        const dateInput = modal.querySelector('#rdv-date-input');
        const timeInput = modal.querySelector('#rdv-time-input');
        DateValidator.setMinDateTime(dateInput, timeInput);

        // ── Toggle client existant / nouveau ──────────────────────────────────
        const radioButtons    = modal.querySelectorAll('input[name="client-mode"]');
        const existingSection = modal.querySelector('#existing-client-section');
        const newSection      = modal.querySelector('#new-client-section');
        const clientSelect    = modal.querySelector('#client-select');
        const newClientTel    = modal.querySelector('#new-client-tel');

        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'existing') {
                    existingSection.style.display = 'block';
                    newSection.style.display      = 'none';
                    clientSelect.required         = true;
                    newClientTel.required         = false;
                } else {
                    existingSection.style.display = 'none';
                    newSection.style.display      = 'block';
                    clientSelect.required         = false;
                    newClientTel.required         = true;
                    modal.querySelector('#client-fidelite-info').innerHTML = '';
                    modal.querySelector('#prix-apercu').innerHTML = '';
                }
            });
        });

        // ── ✅ Affichage fidélité dynamique au choix du client ─────────────────
        const fideliteZone = modal.querySelector('#client-fidelite-info');
        const prixApercu   = modal.querySelector('#prix-apercu');
        const serviceSelect = modal.querySelector('#service-select');

        const updatePrixApercu = () => {
            const selectedClientId = clientSelect.value;
            const selectedServiceId = serviceSelect.value;
            const client  = this.clients.find(c => c.id === selectedClientId);
            const service = this.services.find(s => s.id === selectedServiceId);

            if (!client || !service) { prixApercu.innerHTML = ''; return; }

            const info = Clients.getFideliteInfo(client);
            if (info.reductionActive) {
                const prixReduit = service.prix * (1 - Clients.TAUX_REDUCTION);
                prixApercu.innerHTML = `
                    <div class="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                        <span class="text-green-700 font-bold">
                            Prix après réduction : ${Utils.formatCurrency(prixReduit)}
                        </span>
                        <span class="text-gray-400 line-through ml-2">
                            ${Utils.formatCurrency(service.prix)}
                        </span>
                    </div>`;
            } else {
                prixApercu.innerHTML = '';
            }
        };

        clientSelect.addEventListener('change', () => {
            const selectedClientId = clientSelect.value;
            const client = this.clients.find(c => c.id === selectedClientId);
            fideliteZone.innerHTML = this._renderClientFideliteBanner(client);
            updatePrixApercu();
        });

        serviceSelect.addEventListener('change', updatePrixApercu);
    },
    // ✅ Cœur du système — appelé quand un RDV passe au statut "Terminé"
    async _handleRdvTermine(rdv) {
        try {
            const nouveauxPassages = await Clients.incrementerPassages(rdv.client_id);
            if (nouveauxPassages === null) return;

            const info = Clients.getFideliteInfo({ nombre_passages: nouveauxPassages });

            if (info.reductionActive) {
                // ✅ Notification spéciale — le 10e, 20e, 30e... passage
                App.showNotification(
                    `🎉 ${rdv.client_nom} atteint ${nouveauxPassages} passages — Réduction -30% sur la prochaine visite !`,
                    'success'
                );
            } else {
                const restants = Clients.PASSAGES_POUR_REDUCTION - info.cycle;
                App.showNotification(
                    `✅ Passage enregistré pour ${rdv.client_nom} — ${info.cycle}/${Clients.PASSAGES_POUR_REDUCTION} `+
                    `(encore ${restants} avant -30%)`,
                    'success'
                );
            }

            // Recharger clients en mémoire pour les prochains affichages
            await this.loadAllData();
        } catch (error) {
            console.error('Erreur lors de la mise à jour des passages:', error);
        }
    },

    async showEditModal(id) {
        const rdv = this.data.find(r => r.id === id);
        if (!rdv) return;

        const dateStr = this._toLocalDateString(rdv.date_rdv);
        const timeStr = this._toLocalTimeString(rdv.date_rdv);

        // ✅ Récupérer les infos fidélité du client pour affichage
        const clientData   = this.clients.find(c => c.id === rdv.client_id);
        const fideliteInfo = clientData ? Clients.getFideliteInfo(clientData) : null;

        // Bandeau fidélité adapté au contexte modification
        const fideliteBannerEdit = fideliteInfo ? `
            <div class="p-3 rounded-lg mb-2 ${fideliteInfo.reductionActive
                ? 'bg-green-50 border border-green-300'
                : 'bg-purple-50 border border-purple-200'}">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium ${fideliteInfo.reductionActive
                        ? 'text-green-700' : 'text-purple-700'}">
                        <i class="fas fa-walking mr-1"></i>
                        ${fideliteInfo.passages} passage(s) total
                    </span>
                    <span class="text-sm font-bold ${fideliteInfo.reductionActive
                        ? 'text-green-600' : 'text-gray-500'}">
                        ${fideliteInfo.label}
                    </span>
                </div>
                <div class="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div class="${fideliteInfo.reductionActive ? 'bg-green-500' : 'bg-purple-500'} h-1.5 rounded-full"
                         style="width: ${fideliteInfo.reductionActive ? 100
                             : (fideliteInfo.cycle / Clients.PASSAGES_POUR_REDUCTION) * 100}%">
                    </div>
                </div>
                ${fideliteInfo.reductionActive
                    ? `<p class="text-xs text-green-600 mt-1 font-semibold">
                           🎉 En marquant ce RDV "Terminé", la réduction sera enregistrée
                       </p>`
                    : `<p class="text-xs text-purple-600 mt-1">
                           En marquant "Terminé", le compteur passera à ${fideliteInfo.passages + 1}
                       </p>`}
            </div>` : '';

        const modalContent = `
            <form id="rdv-form" class="space-y-4">

                <!-- ✅ Bandeau fidélité client -->
                ${fideliteBannerEdit}

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <input type="text" value="${rdv.client_nom}" disabled
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600">
                    <p class="text-xs text-gray-500 mt-1">Le client ne peut pas être modifié après création</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Coiffeuse *</label>
                    <select name="coiffeuse_id" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        ${this.coiffeuses.map(c => `
                            <option value="${c.id}" ${c.id === rdv.coiffeuse_id ? 'selected' : ''}>
                                ${c.nom}
                            </option>`).join('')}
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                    <select name="service_id" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        ${this.services.map(s => `
                            <option value="${s.id}" ${s.id === rdv.service_id ? 'selected' : ''}>
                                ${s.nom} - ${Utils.formatCurrency(s.prix)}
                            </option>`).join('')}
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                        <input type="date" name="date" required value="${dateStr}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
                        <input type="time" name="heure" required value="${timeStr}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
                    <select name="statut" required id="statut-select"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="Programmé" ${rdv.statut === 'Programmé' ? 'selected' : ''}>Programmé</option>
                        <option value="Confirmé"  ${rdv.statut === 'Confirmé'  ? 'selected' : ''}>Confirmé</option>
                        <option value="En cours"  ${rdv.statut === 'En cours'  ? 'selected' : ''}>En cours</option>
                        <option value="Terminé"   ${rdv.statut === 'Terminé'   ? 'selected' : ''}>Terminé</option>
                        <option value="Annulé"    ${rdv.statut === 'Annulé'    ? 'selected' : ''}>Annulé</option>
                        <option value="Reporté"   ${rdv.statut === 'Reporté'   ? 'selected' : ''}>Reporté</option>
                        <option value="Absent"    ${rdv.statut === 'Absent'    ? 'selected' : ''}>Absent</option>
                    </select>
                    <!-- ✅ Alerte contextuelle passage -->
                    <div id="statut-fidelite-hint" class="mt-1"></div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea name="notes" rows="2"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${rdv.notes || ''}</textarea>
                </div>
            </form>
        `;

        const modal = Utils.createModal('Modifier le rendez-vous', modalContent, async (modal) => {
            const form = modal.querySelector('#rdv-form');
            if (!form.checkValidity()) { form.reportValidity(); return; }

            try {
                App.showLoading();
                const formData    = new FormData(form);
                const coiffeuse   = this.coiffeuses.find(c => c.id === formData.get('coiffeuse_id'));
                const service     = this.services.find(s => s.id === formData.get('service_id'));
                const nouveauStatut = formData.get('statut');
                const dateTime    = new Date(`${formData.get('date')}T${formData.get('heure')}`);

                const data = {
                    ...rdv,
                    coiffeuse_id:  coiffeuse.id,
                    coiffeuse_nom: coiffeuse.nom,
                    service_id:    service.id,
                    service_nom:   service.nom,
                    date_rdv:      dateTime.getTime(),
                    duree:         service.duree,
                    prix:          service.prix,
                    statut:        nouveauStatut,
                    notes:         formData.get('notes') || ''
                };

                await Utils.update('rendez_vous', id, data);

                // ✅ Si passage à "Terminé" et que ce n'était pas déjà "Terminé"
                if (nouveauStatut === 'Terminé' && rdv.statut !== 'Terminé') {
                    App.hideLoading();
                    modal.remove();
                    // Déclencher l'incrément et la notification fidélité
                    await this._handleRdvTermine(rdv);
                    this.render(document.getElementById('content-area'));
                    return;
                }

                App.hideLoading();
                App.showNotification('Rendez-vous modifié avec succès');
                modal.remove();
                this.render(document.getElementById('content-area'));
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors de la modification', 'error');
                console.error(error);
            }
        });

        // ✅ Alerte dynamique selon statut sélectionné
        const statutSelect  = modal.querySelector('#statut-select');
        const statutHint    = modal.querySelector('#statut-fidelite-hint');

        if (statutSelect && statutHint && fideliteInfo) {
            const updateStatutHint = () => {
                const val = statutSelect.value;
                if (val === 'Terminé' && rdv.statut !== 'Terminé') {
                    const nextPassages = fideliteInfo.passages + 1;
                    const nextInfo     = Clients.getFideliteInfo({ nombre_passages: nextPassages });
                    statutHint.innerHTML = nextInfo.reductionActive
                        ? `<p class="text-xs text-green-600 font-semibold mt-1">
                               🎉 Ce passage (n°${nextPassages}) déclenchera une réduction -30% !
                           </p>`
                        : `<p class="text-xs text-purple-600 mt-1">
                               <i class="fas fa-walking mr-1"></i>
                               Ce passage portera le compteur à ${nextPassages}/${Clients.PASSAGES_POUR_REDUCTION}
                           </p>`;
                } else {
                    statutHint.innerHTML = '';
                }
            };

            statutSelect.addEventListener('change', updateStatutHint);
            updateStatutHint(); // Init au chargement
        }
    },

    async reporterRdv(id) {
        const rdv = this.data.find(r => r.id === id);
        if (!rdv) return;

        const modalContent = `
            <form id="reporter-form" class="space-y-4">
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p class="text-sm text-orange-800">
                        <i class="fas fa-info-circle mr-2"></i>
                        <strong>Reporter un rendez-vous</strong><br>
                        L'ancien sera marqué "Reporté" et un nouveau sera créé automatiquement.
                    </p>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-medium text-gray-700 mb-2">Rendez-vous actuel</h4>
                    <p class="text-sm text-gray-600">
                        <strong>Client :</strong> ${rdv.client_nom}<br>
                        <strong>Coiffeuse :</strong> ${rdv.coiffeuse_nom}<br>
                        <strong>Service :</strong> ${rdv.service_nom}<br>
                        <strong>Date :</strong> ${Utils.formatDateTime(rdv.date_rdv)}
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nouvelle date *</label>
                        <input type="date" name="nouvelle_date" id="reporter-date-input" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <p class="text-xs text-gray-500 mt-1">
                            <i class="fas fa-info-circle"></i> Minimum aujourd'hui
                        </p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nouvelle heure *</label>
                        <input type="time" name="nouvelle_heure" id="reporter-time-input" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <p class="text-xs text-gray-500 mt-1">
                            <i class="fas fa-clock"></i> Au moins 30 min d'avance
                        </p>
                    </div>
                </div>

                <div id="reporter-date-error"></div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Raison du report</label>
                    <textarea name="raison" rows="2"
                              placeholder="Ex: Client indisponible, urgence, etc."
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                </div>
            </form>
        `;

        const modal = Utils.createModal('Reporter le rendez-vous', modalContent, async (modal) => {
            const form = modal.querySelector('#reporter-form');
            if (!form.checkValidity()) { form.reportValidity(); return; }

            const formData   = new FormData(form);
            const newDate    = formData.get('nouvelle_date');
            const newTime    = formData.get('nouvelle_heure');
            const validation = DateValidator.validate(newDate, newTime);

            if (!validation.valid) {
                App.showNotification(validation.message, 'error');
                const errBox = modal.querySelector('#reporter-date-error');
                if (errBox) {
                    errBox.innerHTML = `
                        <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            <i class="fas fa-exclamation-triangle mr-2"></i>${validation.message}
                        </div>`;
                }
                return;
            }

            try {
                App.showLoading();
                const raison      = formData.get('raison') || 'Rendez-vous reporté';
                const newDateTime = new Date(`${newDate}T${newTime}`);

                // 1. Marquer l'ancien comme Reporté
                await Utils.update('rendez_vous', id, {
                    ...rdv,
                    statut: 'Reporté',
                    notes:  (rdv.notes || '') + `\n[REPORTÉ] ${raison}`
                });

                // 2. Créer le nouveau RDV
                await Utils.create('rendez_vous', {
                    client_id:        rdv.client_id,
                    client_nom:       rdv.client_nom,
                    client_telephone: rdv.client_telephone,
                    coiffeuse_id:     rdv.coiffeuse_id,
                    coiffeuse_nom:    rdv.coiffeuse_nom,
                    service_id:       rdv.service_id,
                    service_nom:      rdv.service_nom,
                    date_rdv:         newDateTime.getTime(),
                    duree:            rdv.duree,
                    prix:             rdv.prix,
                    statut:           'Programmé',
                    notes:            `[REPORT DE ${Utils.formatDate(rdv.date_rdv)}] ${raison}`,
                    rdv_precedent_id: id
                });

                App.hideLoading();
                App.showNotification('Rendez-vous reporté — un nouveau rendez-vous a été créé');
                modal.remove();
                this.render(document.getElementById('content-area'));
            } catch (error) {
                App.hideLoading();
                App.showNotification('Erreur lors du report', 'error');
                console.error(error);
            }
        });

        // Validation min date/heure
        const dateInput = modal.querySelector('#reporter-date-input');
        const timeInput = modal.querySelector('#reporter-time-input');
        DateValidator.setMinDateTime(dateInput, timeInput);
    },

    async deleteRdv(id) {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) return;

        try {
            App.showLoading();
            await Utils.delete('rendez_vous', id);
            App.hideLoading();
            App.showNotification('Rendez-vous supprimé avec succès');
            this.render(document.getElementById('content-area'));
        } catch (error) {
            App.hideLoading();
            App.showNotification('Erreur lors de la suppression', 'error');
            console.error(error);
        }
    }
};
