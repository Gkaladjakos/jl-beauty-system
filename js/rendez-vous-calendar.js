// Weekly Calendar View with Drag & Drop for Rendez-vous Module
const CalendarView = {
    currentWeek: new Date(),
    weekStart: null,
    weekEnd: null,
    appointments: [],
    
    /**
     * Initialize calendar view
     */
    init(appointments) {
        this.appointments = appointments;
        this.setWeekRange();
        return this.render();
    },
    
    /**
     * Set week start and end dates
     */
    setWeekRange() {
        const date = new Date(this.currentWeek);
        // Get Monday of current week
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        this.weekStart = new Date(date.setDate(diff));
        this.weekStart.setHours(0, 0, 0, 0);
        
        // Get Sunday (end of week)
        this.weekEnd = new Date(this.weekStart);
        this.weekEnd.setDate(this.weekStart.getDate() + 6);
        this.weekEnd.setHours(23, 59, 59, 999);
    },
    
    /**
     * Navigate to previous week
     */
    previousWeek() {
        this.currentWeek.setDate(this.currentWeek.getDate() - 7);
        this.setWeekRange();
        return this.render();
    },
    
    /**
     * Navigate to next week
     */
    nextWeek() {
        this.currentWeek.setDate(this.currentWeek.getDate() + 7);
        this.setWeekRange();
        return this.render();
    },
    
    /**
     * Go to today
     */
    goToToday() {
        this.currentWeek = new Date();
        this.setWeekRange();
        return this.render();
    },
    
    /**
     * Get week days array
     */
    getWeekDays() {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(this.weekStart);
            date.setDate(this.weekStart.getDate() + i);
            days.push(date);
        }
        return days;
    },
    
    /**
     * Get appointments for a specific date
     */
    getAppointmentsForDate(date) {
        const dateStr = this.formatDate(date);
        return this.appointments.filter(apt => {
            const aptDate = new Date(apt.date_rdv);
            return this.formatDate(aptDate) === dateStr;
        }).sort((a, b) => new Date(a.date_rdv) - new Date(b.date_rdv));
    },
    
    /**
     * Format date as YYYY-MM-DD
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    /**
     * Format date for display (French)
     */
    formatDisplayDate(date) {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
    },
    
    /**
     * Format time from datetime
     */
    formatTime(datetime) {
        const date = new Date(datetime);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    },
    
    /**
     * Check if date is today
     */
    isToday(date) {
        const today = new Date();
        return this.formatDate(date) === this.formatDate(today);
    },
    
    /**
     * Check if date is in past
     */
    isPast(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    },
    
    /**
     * Render calendar HTML
     */
    render() {
        const weekDays = this.getWeekDays();
        const monthYear = this.weekStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        
        const html = `
            <div class="bg-white rounded-lg shadow-md p-6">
                <!-- Calendar Header -->
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800 capitalize">${monthYear}</h2>
                        <p class="text-sm text-gray-600">
                            ${this.formatDisplayDate(this.weekStart)} - ${this.formatDisplayDate(this.weekEnd)}
                        </p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="RendezVous.calendarPreviousWeek()" 
                                class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button onclick="RendezVous.calendarToday()" 
                                class="px-4 py-2 bg-gradient-to-r from-yellow-500 to-black text-white rounded-lg hover:shadow-lg">
                            Aujourd'hui
                        </button>
                        <button onclick="RendezVous.calendarNextWeek()" 
                                class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Week Grid -->
                <div class="grid grid-cols-7 gap-2">
                    ${weekDays.map(day => {
                        const appointments = this.getAppointmentsForDate(day);
                        const isToday = this.isToday(day);
                        const isPast = this.isPast(day);
                        const dateStr = this.formatDate(day);
                        
                        return `
                            <div class="calendar-day min-h-[200px] border-2 rounded-lg p-3 ${isToday ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-gray-50'} ${isPast ? 'opacity-60' : ''}"
                                 data-date="${dateStr}"
                                 ondrop="RendezVous.handleDrop(event)"
                                 ondragover="RendezVous.handleDragOver(event)">
                                <div class="font-bold text-sm mb-2 ${isToday ? 'text-yellow-600' : 'text-gray-700'}">
                                    ${this.formatDisplayDate(day)}
                                    ${isToday ? '<span class="ml-1 text-xs">(Aujourd\'hui)</span>' : ''}
                                </div>
                                <div class="space-y-1">
                                    ${appointments.length === 0 ? 
                                        `<p class="text-xs text-gray-400 italic">Aucun RDV</p>` :
                                        appointments.map(apt => this.renderAppointmentCard(apt)).join('')
                                    }
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <!-- Legend -->
                <div class="mt-6 flex items-center justify-center space-x-6 text-sm">
                    <div class="flex items-center">
                        <span class="inline-block w-3 h-3 bg-blue-500 rounded mr-2"></span>
                        <span>Programmé</span>
                    </div>
                    <div class="flex items-center">
                        <span class="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span>
                        <span>Confirmé</span>
                    </div>
                    <div class="flex items-center">
                        <span class="inline-block w-3 h-3 bg-purple-500 rounded mr-2"></span>
                        <span>En cours</span>
                    </div>
                    <div class="flex items-center">
                        <span class="inline-block w-3 h-3 bg-gray-500 rounded mr-2"></span>
                        <span>Terminé</span>
                    </div>
                </div>
                
                <!-- Drag info -->
                <div class="mt-4 text-center text-xs text-gray-500">
                    <i class="fas fa-info-circle mr-1"></i>
                    Glissez-déposez un rendez-vous pour le reporter à une autre date
                </div>
            </div>
        `;
        
        return html;
    },
    
    /**
     * Render appointment card
     */
    renderAppointmentCard(apt) {
        const statusColors = {
            'Programmé': 'bg-blue-500',
            'Confirmé': 'bg-green-500',
            'En cours': 'bg-purple-500',
            'Terminé': 'bg-gray-500',
            'Annulé': 'bg-red-500',
            'Reporté': 'bg-orange-500',
            'Absent': 'bg-yellow-500'
        };
        
        const color = statusColors[apt.statut] || 'bg-gray-500';
        const canDrag = !['Terminé', 'Annulé', 'Absent'].includes(apt.statut);
        
        return `
            <div class="apt-card text-xs p-2 rounded ${color} text-white cursor-pointer hover:shadow-lg transition-shadow"
                 data-apt-id="${apt.id}"
                 draggable="${canDrag}"
                 ondragstart="RendezVous.handleDragStart(event)"
                 onclick="RendezVous.showViewModal('${apt.id}')">
                <div class="font-bold">${this.formatTime(apt.date_rdv)}</div>
                <div class="truncate">${apt.client_nom}</div>
                <div class="truncate text-xs opacity-90">${apt.service_nom}</div>
                <div class="text-xs opacity-75">${apt.coiffeuse_nom}</div>
            </div>
        `;
    }
};
