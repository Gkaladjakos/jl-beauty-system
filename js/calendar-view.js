// Calendar View Component for Appointments
// Weekly calendar with drag & drop functionality

const CalendarView = {
    currentWeek: new Date(),
    appointments: [],
    onUpdate: null,
    
    render(container, appointments, onUpdate) {
        this.appointments = appointments;
        this.onUpdate = onUpdate;
        
        const weekDays = this.getWeekDays();
        const hours = this.getHours();
        
        const html = `
            <div class="bg-white rounded-lg shadow-md p-4 mb-6">
                <div class="flex justify-between items-center mb-4">
                    <button onclick="CalendarView.previousWeek()" class="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <h3 class="text-lg font-semibold">${this.getWeekLabel()}</h3>
                    <button onclick="CalendarView.nextWeek()" class="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <div class="calendar-grid">
                    <div class="calendar-header">
                        <div class="calendar-hour-label"></div>
                        ${weekDays.map(day => `
                            <div class="calendar-day-header">
                                <div class="day-name">${day.dayName}</div>
                                <div class="day-date">${day.date}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="calendar-body">
                        ${hours.map(hour => `
                            <div class="calendar-row">
                                <div class="calendar-hour-label">${hour}</div>
                                ${weekDays.map(day => {
                                    const cellId = `cell-${day.dateStr}-${hour}`;
                                    const rdvInCell = this.getAppointmentsForCell(day.dateStr, hour);
                                    
                                    return `
                                        <div class="calendar-cell" 
                                             id="${cellId}"
                                             data-date="${day.dateStr}" 
                                             data-hour="${hour}"
                                             ondrop="CalendarView.handleDrop(event)"
                                             ondragover="CalendarView.handleDragOver(event)">
                                            ${rdvInCell.map(rdv => this.renderAppointment(rdv)).join('')}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <style>
                .calendar-grid {
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .calendar-header {
                    display: grid;
                    grid-template-columns: 60px repeat(7, 1fr);
                    background: #f9fafb;
                    border-bottom: 2px solid #e5e7eb;
                }
                
                .calendar-day-header {
                    padding: 12px 8px;
                    text-align: center;
                    border-left: 1px solid #e5e7eb;
                }
                
                .day-name {
                    font-weight: 600;
                    color: #374151;
                    font-size: 14px;
                }
                
                .day-date {
                    color: #6b7280;
                    font-size: 12px;
                    margin-top: 4px;
                }
                
                .calendar-body {
                    max-height: 600px;
                    overflow-y: auto;
                }
                
                .calendar-row {
                    display: grid;
                    grid-template-columns: 60px repeat(7, 1fr);
                    border-bottom: 1px solid #e5e7eb;
                    min-height: 60px;
                }
                
                .calendar-hour-label {
                    padding: 8px;
                    text-align: center;
                    font-size: 12px;
                    color: #6b7280;
                    font-weight: 500;
                    background: #f9fafb;
                    border-right: 1px solid #e5e7eb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .calendar-cell {
                    border-left: 1px solid #e5e7eb;
                    padding: 4px;
                    position: relative;
                    min-height: 60px;
                    background: #fff;
                    transition: background 0.2s;
                }
                
                .calendar-cell:hover {
                    background: #f3f4f6;
                }
                
                .calendar-cell.drag-over {
                    background: #dbeafe;
                    border: 2px dashed #3b82f6;
                }
                
                .calendar-appointment {
                    padding: 4px 6px;
                    margin-bottom: 2px;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: move;
                    border-left: 3px solid;
                    background: rgba(255, 255, 255, 0.9);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                
                .calendar-appointment:hover {
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                .calendar-appointment.status-Programmé {
                    border-left-color: #3b82f6;
                    background: #dbeafe;
                }
                
                .calendar-appointment.status-Confirmé {
                    border-left-color: #10b981;
                    background: #d1fae5;
                }
                
                .calendar-appointment.status-En-cours {
                    border-left-color: #f59e0b;
                    background: #fef3c7;
                }
                
                .calendar-appointment.status-Terminé {
                    border-left-color: #6b7280;
                    background: #f3f4f6;
                }
                
                .rdv-time {
                    font-weight: 600;
                    color: #111827;
                }
                
                .rdv-client {
                    color: #374151;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .rdv-service {
                    color: #6b7280;
                    font-size: 10px;
                }
            </style>
        `;
        
        container.innerHTML = html;
    },
    
    getWeekDays() {
        const days = [];
        const startOfWeek = new Date(this.currentWeek);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            
            days.push({
                dayName: day.toLocaleDateString('fr-FR', { weekday: 'short' }),
                date: day.getDate(),
                dateStr: day.toISOString().split('T')[0],
                fullDate: day
            });
        }
        
        return days;
    },
    
    getHours() {
        const hours = [];
        for (let h = 8; h <= 19; h++) {
            hours.push(`${h.toString().padStart(2, '0')}:00`);
        }
        return hours;
    },
    
    getWeekLabel() {
        const weekDays = this.getWeekDays();
        const start = weekDays[0].fullDate;
        const end = weekDays[6].fullDate;
        
        return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    },
    
    getAppointmentsForCell(dateStr, hour) {
        return this.appointments.filter(rdv => {
            const rdvDate = new Date(rdv.date_rdv);
            const rdvDateStr = rdvDate.toISOString().split('T')[0];
            const rdvHour = rdvDate.getHours().toString().padStart(2, '0') + ':00';
            
            return rdvDateStr === dateStr && rdvHour === hour;
        });
    },
    
    renderAppointment(rdv) {
        const time = new Date(rdv.date_rdv).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const statusClass = rdv.statut.replace(/\s+/g, '-');
        
        return `
            <div class="calendar-appointment status-${statusClass}" 
                 draggable="true"
                 ondragstart="CalendarView.handleDragStart(event, '${rdv.id}')"
                 onclick="CalendarView.showAppointmentDetails('${rdv.id}')">
                <div class="rdv-time">${time}</div>
                <div class="rdv-client">${rdv.client_nom}</div>
                <div class="rdv-service">${rdv.service_nom}</div>
            </div>
        `;
    },
    
    handleDragStart(event, rdvId) {
        event.dataTransfer.setData('rdvId', rdvId);
        event.dataTransfer.effectAllowed = 'move';
    },
    
    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        event.currentTarget.classList.add('drag-over');
    },
    
    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        
        const rdvId = event.dataTransfer.getData('rdvId');
        const cell = event.currentTarget;
        const newDate = cell.dataset.date;
        const newHour = cell.dataset.hour;
        
        this.moveAppointment(rdvId, newDate, newHour);
    },
    
    async moveAppointment(rdvId, newDate, newHour) {
        const rdv = this.appointments.find(r => r.id === rdvId);
        if (!rdv) return;
        
        const confirmed = confirm(
            `Déplacer le rendez-vous de ${rdv.client_nom} au ${newDate} à ${newHour}?`
        );
        
        if (!confirmed) return;
        
        // Create new date
        const [hours, minutes] = newHour.split(':');
        const newDateTime = new Date(newDate);
        newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Update appointment
        rdv.date_rdv = newDateTime.getTime();
        
        if (this.onUpdate) {
            await this.onUpdate(rdv);
        }
        
        App.showNotification('Rendez-vous déplacé avec succès');
    },
    
    showAppointmentDetails(rdvId) {
        // Trigger the main module's showDetails function
        if (window.RendezVous && window.RendezVous.showDetails) {
            window.RendezVous.showDetails(rdvId);
        }
    },
    
    previousWeek() {
        this.currentWeek.setDate(this.currentWeek.getDate() - 7);
        if (window.RendezVous && window.RendezVous.renderCalendarView) {
            window.RendezVous.renderCalendarView();
        }
    },
    
    nextWeek() {
        this.currentWeek.setDate(this.currentWeek.getDate() + 7);
        if (window.RendezVous && window.RendezVous.renderCalendarView) {
            window.RendezVous.renderCalendarView();
        }
    }
};

// Remove drag-over class when dragging leaves
document.addEventListener('dragleave', (e) => {
    if (e.target.classList.contains('calendar-cell')) {
        e.target.classList.remove('drag-over');
    }
});
