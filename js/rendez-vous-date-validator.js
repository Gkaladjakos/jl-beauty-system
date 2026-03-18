// Date & Time Validator for Rendez-vous Module
const DateValidator = {
    /**
     * Get current date/time
     */
    now() {
        return new Date();
    },
    
    /**
     * Check if a date/time is in the past
     */
    isPast(dateString, timeString) {
        const selectedDateTime = new Date(`${dateString}T${timeString}`);
        return selectedDateTime < this.now();
    },
    
    /**
     * Format date for input field (YYYY-MM-DD)
     */
    formatDateForInput(date = null) {
        const d = date || this.now();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    /**
     * Format time for input field (HH:MM)
     */
    formatTimeForInput(date = null) {
        const d = date || this.now();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    },
    
    /**
     * Set minimum date/time on input fields
     */
    setMinDateTime(dateInput, timeInput) {
        if (!dateInput) return;
        
        const today = this.formatDateForInput();
        dateInput.setAttribute('min', today);
        dateInput.value = today;
        
        if (timeInput) {
            // If today is selected, set min time to current time + 30min
            const minTime = this.getMinTimeForDate(dateInput.value);
            if (minTime) {
                timeInput.setAttribute('min', minTime);
            }
            
            // Update min time when date changes
            dateInput.addEventListener('change', () => {
                const newMinTime = this.getMinTimeForDate(dateInput.value);
                if (newMinTime) {
                    timeInput.setAttribute('min', newMinTime);
                    // Reset time if it's now invalid
                    if (timeInput.value && timeInput.value < newMinTime) {
                        timeInput.value = newMinTime;
                    }
                } else {
                    timeInput.removeAttribute('min');
                }
            });
        }
    },
    
    /**
     * Get minimum time for a given date
     * Returns null if date is in the future, or current time + 30min if today
     */
    getMinTimeForDate(dateString) {
        if (!dateString) return null;
        
        const selectedDate = new Date(dateString + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // If selected date is today, return current time + 30 minutes
        if (selectedDate.getTime() === today.getTime()) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 30);
            return this.formatTimeForInput(now);
        }
        
        // Future dates have no min time restriction
        return null;
    },
    
    /**
     * Validate date/time before submission
     */
    validate(dateString, timeString) {
        if (!dateString || !timeString) {
            return {
                valid: false,
                message: 'Veuillez sélectionner une date et une heure'
            };
        }
        
        if (this.isPast(dateString, timeString)) {
            return {
                valid: false,
                message: 'Impossible de créer un rendez-vous dans le passé. Veuillez choisir une date et heure futures.'
            };
        }
        
        const selectedDateTime = new Date(`${dateString}T${timeString}`);
        const now = this.now();
        const minDateTime = new Date(now.getTime() + 30 * 60000); // +30 minutes
        
        if (selectedDateTime < minDateTime) {
            return {
                valid: false,
                message: 'Le rendez-vous doit être planifié au moins 30 minutes à l\'avance'
            };
        }
        
        return {
            valid: true,
            message: 'OK'
        };
    },
    
    /**
     * Show error message
     */
    showError(message, container = null) {
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'mt-2 text-sm text-red-600';
            errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle mr-1"></i>${message}`;
            container.appendChild(errorDiv);
            
            setTimeout(() => errorDiv.remove(), 5000);
        } else {
            App.showNotification(message, 'error');
        }
    }
};
