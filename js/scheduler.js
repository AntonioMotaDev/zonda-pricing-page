// Meeting Scheduler JavaScript
class MeetingScheduler {
    constructor() {
        // Google Calendar API Configuration
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/calendar';
        
        // Load API keys from config file (NOT committed to GitHub)
        this.API_KEY = window.API_CONFIG?.GOOGLE_API_KEY || '';
        this.CLIENT_ID = window.API_CONFIG?.GOOGLE_CLIENT_ID || ''; 
        
        // Business hours configuration (Mexico Time Zone)
        this.businessHours = {
            start: 9, // 9 AM
            end: 15,  // 3 PM
            timezone: 'America/Mexico_City'
        };
        
        // Meeting duration in minutes
        this.meetingDuration = 30;
        
        // Current state
        this.currentStep = 'date';
        this.selectedDate = null;
        this.selectedTime = null;
        this.currentMonth = new Date();
        this.gapi = null;
        this.isSignedIn = false;
        
        // Initialize the scheduler
        this.init();
    }
    
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeElements());
        } else {
            this.initializeElements();
        }
    }
    
    initializeElements() {
        // Get DOM elements
        this.modal = document.getElementById('schedulerModal');
        this.openBtn = document.getElementById('openSchedulerBtn');
        this.scheduleBtn = document.getElementById('scheduleButton');
        
        // Step elements
        this.dateStep = document.getElementById('dateStep');
        this.timeStep = document.getElementById('timeStep');
        this.detailsStep = document.getElementById('detailsStep');
        
        // Calendar elements
        this.calendarGrid = document.getElementById('calendarGrid');
        this.currentMonthYear = document.getElementById('currentMonthYear');
        this.prevMonthBtn = document.getElementById('prevMonth');
        this.nextMonthBtn = document.getElementById('nextMonth');
        
        // Time slots
        this.timeSlotsContainer = document.getElementById('timeSlotsContainer');
        this.selectedDateDisplay = document.getElementById('selectedDateDisplay');
        
        // Navigation buttons
        this.backToDateBtn = document.getElementById('backToDate');
        this.backToTimeBtn = document.getElementById('backToTime');
        
        // Form elements
        this.meetingForm = document.getElementById('meetingDetailsForm');
        this.summaryDate = document.getElementById('summaryDate');
        this.summaryTime = document.getElementById('summaryTime');
        
        // Bind event listeners
        this.bindEvents();
        
        // Initialize Google API
        this.initializeGoogleAPI();
        
        // Generate initial calendar
        this.generateCalendar();
    }
    
    bindEvents() {
        // Open modal button
        this.openBtn?.addEventListener('click', () => this.openModal());
        
        // Calendar navigation
        this.prevMonthBtn?.addEventListener('click', () => this.previousMonth());
        this.nextMonthBtn?.addEventListener('click', () => this.nextMonth());
        
        // Step navigation
        this.backToDateBtn?.addEventListener('click', () => this.showStep('date'));
        this.backToTimeBtn?.addEventListener('click', () => this.showStep('time'));
        
        // Schedule button
        this.scheduleBtn?.addEventListener('click', () => this.scheduleMeeting());
        
        // Form validation
        this.meetingForm?.addEventListener('input', () => this.validateForm());
        
        // Modal events
        this.modal?.addEventListener('hidden.bs.modal', () => this.resetScheduler());
    }
    
    async initializeGoogleAPI() {
        try {
            // Initialize gapi
            await new Promise((resolve) => {
                if (typeof gapi !== 'undefined') {
                    gapi.load('api:auth2', resolve);
                } else {
                    // If gapi is not loaded, we'll handle it without Google Calendar integration
                    console.warn('Google API not loaded. Scheduler will work without calendar integration.');
                    resolve();
                }
            });
            
            if (typeof gapi !== 'undefined') {
                // Initialize the API
                await gapi.client.init({
                    apiKey: this.API_KEY,
                    clientId: this.CLIENT_ID,
                    discoveryDocs: [this.DISCOVERY_DOC],
                    scope: this.SCOPES
                });
                
                this.gapi = gapi;
                this.isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
                
                console.log('Google Calendar API initialized successfully');
            }
        } catch (error) {
            console.error('Error initializing Google API:', error);
        }
    }
    
    openModal() {
        // Reset to first step
        this.showStep('date');
        this.generateCalendar();
        
        // Show modal using Bootstrap
        const bsModal = new bootstrap.Modal(this.modal);
        bsModal.show();
    }
    
    showStep(step) {
        // Hide all steps
        this.dateStep?.classList.add('d-none');
        this.timeStep?.classList.add('d-none');
        this.detailsStep?.classList.add('d-none');
        
        // Show target step
        switch (step) {
            case 'date':
                this.dateStep?.classList.remove('d-none');
                this.currentStep = 'date';
                break;
            case 'time':
                this.timeStep?.classList.remove('d-none');
                this.currentStep = 'time';
                this.generateTimeSlots();
                break;
            case 'details':
                this.detailsStep?.classList.remove('d-none');
                this.currentStep = 'details';
                this.updateSummary();
                break;
        }
        
        this.updateScheduleButton();
    }
    
    generateCalendar() {
        if (!this.calendarGrid || !this.currentMonthYear) return;
        
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        // Update header
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        this.currentMonthYear.textContent = `${monthNames[month]} ${year}`;
        
        // Clear calendar
        this.calendarGrid.innerHTML = '';
        
        // Add day headers
        const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            this.calendarGrid.appendChild(header);
        });
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        
        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            this.calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const currentDate = new Date(year, month, day);
            const isToday = this.isSameDay(currentDate, today);
            const isWeekday = this.isWeekday(currentDate);
            const isPastDate = currentDate < today && !isToday;
            
            // Add classes based on conditions
            if (isToday) dayElement.classList.add('today');
            if (isPastDate || !isWeekday) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.classList.add('available');
                dayElement.addEventListener('click', () => this.selectDate(currentDate));
            }
            
            // Highlight selected date
            if (this.selectedDate && this.isSameDay(currentDate, this.selectedDate)) {
                dayElement.classList.add('selected');
            }
            
            this.calendarGrid.appendChild(dayElement);
        }
    }
    
    generateTimeSlots() {
        if (!this.timeSlotsContainer || !this.selectedDate) return;
        
        // Update date display
        if (this.selectedDateDisplay) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            this.selectedDateDisplay.textContent = this.selectedDate.toLocaleDateString('es-ES', options);
        }
        
        // Clear existing time slots
        this.timeSlotsContainer.innerHTML = '';
        
        // Create time slots grid container
        const gridContainer = document.createElement('div');
        gridContainer.className = 'time-slots-grid';
        
        // Generate time slots
        const startHour = this.businessHours.start;
        const endHour = this.businessHours.end;
        
        for (let hour = startHour; hour < endHour; hour++) {
            // Two 30-minute slots per hour
            for (let minutes of [0, 30]) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                
                const time24 = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                const time12 = this.formatTime12Hour(hour, minutes);
                
                timeSlot.textContent = time12;
                timeSlot.dataset.time = time24;
                
                // Check if slot is available (you can add more sophisticated logic here)
                const slotDateTime = new Date(this.selectedDate);
                slotDateTime.setHours(hour, minutes, 0, 0);
                
                const now = new Date();
                if (slotDateTime <= now) {
                    timeSlot.classList.add('unavailable');
                } else {
                    timeSlot.addEventListener('click', () => this.selectTime(time24, time12));
                    
                    // Highlight selected time
                    if (this.selectedTime === time24) {
                        timeSlot.classList.add('selected');
                    }
                }
                
                gridContainer.appendChild(timeSlot);
            }
        }
        
        this.timeSlotsContainer.appendChild(gridContainer);
    }
    
    selectDate(date) {
        this.selectedDate = new Date(date);
        this.selectedTime = null; // Reset time selection
        this.generateCalendar(); // Refresh calendar to show selection
        
        // Move to time selection step
        setTimeout(() => this.showStep('time'), 300);
    }
    
    selectTime(time24, time12) {
        this.selectedTime = time24;
        this.selectedTimeFormatted = time12;
        this.generateTimeSlots(); // Refresh to show selection
        
        // Move to details step
        setTimeout(() => this.showStep('details'), 300);
    }
    
    updateSummary() {
        if (!this.selectedDate || !this.selectedTime) return;
        
        if (this.summaryDate) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            this.summaryDate.textContent = this.selectedDate.toLocaleDateString('es-ES', options);
        }
        
        if (this.summaryTime && this.selectedTimeFormatted) {
            this.summaryTime.textContent = `${this.selectedTimeFormatted} - ${this.getEndTime()} (Hora de México)`;
        }
    }
    
    validateForm() {
        const name = document.getElementById('meetingName')?.value.trim();
        const email = document.getElementById('meetingEmail')?.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        const isValid = name && email && emailRegex.test(email) && 
                       this.selectedDate && this.selectedTime;
        
        if (this.scheduleBtn) {
            this.scheduleBtn.disabled = !isValid;
        }
        
        return isValid;
    }
    
    async scheduleMeeting() {
        if (!this.validateForm()) {
            this.showAlert('Por favor, completa todos los campos requeridos.', 'danger');
            return;
        }
        
        // Show loading state
        this.scheduleBtn.innerHTML = '<i class="spinner-border spinner-border-sm me-2"></i>Agendando...';
        this.scheduleBtn.disabled = true;
        
        try {
            // Get form data
            const formData = this.getFormData();
            
            // Create event object
            const event = this.createCalendarEvent(formData);
            
            // Try to create calendar event (if Google API is available)
            let calendarEventCreated = false;
            if (this.gapi && this.API_KEY !== 'YOUR_API_KEY_HERE') {
                calendarEventCreated = await this.createGoogleCalendarEvent(event);
            }
            
            // Send notification email (you can implement this with your backend)
            await this.sendNotificationEmail(formData, event);
            
            // Show success message
            this.showSuccessMessage(formData, calendarEventCreated);
            
        } catch (error) {
            console.error('Error scheduling meeting:', error);
            this.showAlert('Hubo un error al agendar la reunión. Por favor, intenta nuevamente.', 'danger');
        } finally {
            // Reset button
            this.scheduleBtn.innerHTML = '<i class="bi bi-calendar-check me-2"></i>Confirmar Reunión';
            this.scheduleBtn.disabled = false;
        }
    }
    
    getFormData() {
        return {
            name: document.getElementById('meetingName')?.value.trim() || '',
            email: document.getElementById('meetingEmail')?.value.trim() || '',
            phone: document.getElementById('meetingPhone')?.value.trim() || '',
            company: document.getElementById('meetingCompany')?.value.trim() || '',
            plan: document.getElementById('meetingPlan')?.value || '',
            notes: document.getElementById('meetingNotes')?.value.trim() || '',
            date: this.selectedDate,
            time: this.selectedTime,
            timeFormatted: this.selectedTimeFormatted
        };
    }
    
    createCalendarEvent(formData) {
        const startDateTime = new Date(formData.date);
        const [hours, minutes] = formData.time.split(':');
        startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + this.meetingDuration);
        
        // Generate Google Meet link (this would typically be done server-side)
        const meetLink = `https://meet.google.com/new`; // Placeholder - you'd generate a real link
        
        return {
            summary: `Reunión ZONDA ERP - ${formData.name}`,
            description: `Reunión de consulta sobre ZONDA ERP
            
Cliente: ${formData.name}
Email: ${formData.email}
${formData.phone ? `Teléfono: ${formData.phone}` : ''}
${formData.company ? `Empresa: ${formData.company}` : ''}
${formData.plan ? `Plan de interés: ${formData.plan}` : ''}

${formData.notes ? `Notas: ${formData.notes}` : ''}

Google Meet: ${meetLink}`,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: this.businessHours.timezone
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: this.businessHours.timezone
            },
            attendees: [
                { email: formData.email },
                { email: 'contacto@zondaerp.com' } // Your business email
            ],
            conferenceData: {
                createRequest: {
                    requestId: 'meeting-' + Date.now(),
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            }
        };
    }
    
    async createGoogleCalendarEvent(event) {
        try {
            // Sign in if not already signed in
            if (!this.isSignedIn) {
                await this.gapi.auth2.getAuthInstance().signIn();
                this.isSignedIn = true;
            }
            
            // Create the calendar event
            const response = await this.gapi.client.calendar.events.insert({
                calendarId: 'primary',
                resource: event,
                conferenceDataVersion: 1
            });
            
            console.log('Calendar event created:', response);
            return true;
        } catch (error) {
            console.error('Error creating calendar event:', error);
            return false;
        }
    }
    
    async sendNotificationEmail(formData, event) {
        // This would typically be handled by your backend
        // For now, we'll just log the data that would be sent
        const emailData = {
            to: formData.email,
            cc: 'contacto@zondaerp.com',
            subject: 'Confirmación de Reunión - ZONDA ERP',
            body: `Hola ${formData.name},
            
Tu reunión ha sido confirmada para el ${event.start.dateTime} (Hora de México).

Detalles de la reunión:
- Fecha: ${this.selectedDate.toLocaleDateString('es-ES')}
- Hora: ${formData.timeFormatted} - ${this.getEndTime()}
- Duración: ${this.meetingDuration} minutos
- Modalidad: Virtual por Google Meet

Te enviaremos el enlace de Google Meet por correo electrónico antes de la reunión.

¡Esperamos conocer más sobre tu empresa y cómo ZONDA ERP puede ayudarte!

Saludos,
Equipo ZONDA ERP`
        };
        
        console.log('Email data to be sent:', emailData);
        
        // Here you would typically make an API call to your backend
        // return await fetch('/api/send-email', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(emailData)
        // });
        
        return Promise.resolve(); // Simulate successful email sending
    }
    
    showSuccessMessage(formData, calendarEventCreated) {
        const modalBody = this.modal.querySelector('.scheduler-modal-body');
        const modalFooter = this.modal.querySelector('.scheduler-modal-footer');
        
        modalBody.innerHTML = `
            <div class="success-message">
                <div class="success-icon">
                    <i class="bi bi-check-circle-fill"></i>
                </div>
                <h4 class="success-title">¡Reunión Agendada!</h4>
                <p class="success-text">
                    Tu reunión ha sido confirmada para el <strong>${this.selectedDate.toLocaleDateString('es-ES')}</strong> 
                    a las <strong>${formData.timeFormatted}</strong>.
                </p>
                <div class="alert alert-info">
                    <i class="bi bi-envelope-fill me-2"></i>
                    Te hemos enviado un correo de confirmación a <strong>${formData.email}</strong> 
                    con todos los detalles y el enlace de Google Meet.
                </div>
                ${calendarEventCreated ? 
                    '<div class="alert alert-success"><i class="bi bi-calendar-check me-2"></i>El evento también se ha agregado a tu Google Calendar.</div>' : 
                    '<div class="alert alert-warning"><i class="bi bi-info-circle me-2"></i>Por favor, agrega manualmente el evento a tu calendario.</div>'
                }
            </div>
        `;
        
        // Update footer
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                <i class="bi bi-check-lg me-2"></i>
                Perfecto
            </button>
        `;
    }
    
    showAlert(message, type = 'info') {
        // You can implement this to show alerts in your preferred way
        alert(message); // Simple fallback
    }
    
    resetScheduler() {
        this.selectedDate = null;
        this.selectedTime = null;
        this.selectedTimeFormatted = null;
        this.currentStep = 'date';
        
        // Reset form
        if (this.meetingForm) {
            this.meetingForm.reset();
        }
        
        // Reset button
        if (this.scheduleBtn) {
            this.scheduleBtn.innerHTML = '<i class="bi bi-calendar-check me-2"></i>Confirmar Reunión';
            this.scheduleBtn.disabled = true;
        }
    }
    
    updateScheduleButton() {
        if (!this.scheduleBtn) return;
        
        this.scheduleBtn.disabled = this.currentStep !== 'details' || !this.validateForm();
    }
    
    // Utility methods
    previousMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
        this.generateCalendar();
    }
    
    nextMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
        this.generateCalendar();
    }
    
    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }
    
    isWeekday(date) {
        const day = date.getDay();
        return day >= 1 && day <= 5; // Monday to Friday
    }
    
    formatTime12Hour(hour, minutes) {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    getEndTime() {
        if (!this.selectedTime) return '';
        
        const [hours, minutes] = this.selectedTime.split(':');
        const endDate = new Date();
        endDate.setHours(parseInt(hours), parseInt(minutes) + this.meetingDuration, 0, 0);
        
        return this.formatTime12Hour(endDate.getHours(), endDate.getMinutes());
    }
}

// Initialize scheduler when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.meetingScheduler = new MeetingScheduler();
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MeetingScheduler;
}