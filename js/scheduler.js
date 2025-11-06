// Meeting Scheduler JavaScript
class MeetingScheduler {
    constructor() {
        
        // EmailJS Configuration (frontend safe: publicKey)
        this.emailJSConfig = {
            publicKey: 'FVBRMeBcGeLym1gyx',
            serviceId: 'service_99y7v5w',
            templateId: 'template_el42gt7c'
        };

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

        // Initialize EmailJS
        this.initializeEmailJS();

        // NOTE: removed initializeGoogleAPI() that used gapi/auth in frontend

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
        // Usar evento 'hide.bs.modal' para resetear ANTES de que el modal se oculte
        this.modal?.addEventListener('hide.bs.modal', () => this.resetScheduler());
    }

    initializeEmailJS() {
        // Inicializar EmailJS con la clave pública
        if (typeof emailjs !== 'undefined' && this.emailJSConfig.publicKey) {
            emailjs.init(this.emailJSConfig.publicKey);
            console.log('📧 EmailJS inicializado correctamente');
        } else {
            console.warn('⚠️ EmailJS no está disponible o falta la configuración');
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

            // Comparar solo la fecha, no la hora. Para la fecha actual, debe estar habilitada.
            const isPastDate = (new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())).getTime()
                                < (new Date(today.getFullYear(), today.getMonth(), today.getDate())).getTime() && !isToday;

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

        const now = new Date();
        const isToday = this.isSameDay(this.selectedDate, now);

        for (let hour = startHour; hour < endHour; hour++) {
            // Two 30-minute slots per hour
            for (let minutes of [0, 30]) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';

                const time24 = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                const time12 = this.formatTime12Hour(hour, minutes);

                timeSlot.textContent = time12;
                timeSlot.dataset.time = time24;

                // Check if slot is available
                const slotDateTime = new Date(this.selectedDate);
                slotDateTime.setHours(hour, minutes, 0, 0);

                // Deshabilitar si es una hora en el pasado (con un buffer de 10 minutos)
                if (slotDateTime.getTime() <= now.getTime() + (10 * 60 * 1000) && isToday) {
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
        // Quitar la selección anterior visualmente
        this.calendarGrid.querySelectorAll('.calendar-day.selected')
            .forEach(el => el.classList.remove('selected'));

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

            // Create event object resource (event body for API)
            const eventResource = this.createCalendarEvent(formData);

            // Attempt to create calendar event through backend
            let createdEvent = null;
            try {
                createdEvent = await this.createGoogleCalendarEvent(eventResource);
                // If backend returned an error structure, normalize to null
                if (!createdEvent || createdEvent.error) {
                    console.warn('Backend returned an error creating the event:', createdEvent?.error || createdEvent);
                    createdEvent = null;
                } else {
                    console.log('Evento creado en backend:', createdEvent);
                }
            } catch (backendError) {
                console.error('Error calling backend to create event:', backendError);
                createdEvent = null;
            }

            // Extraer el enlace de Meet de la respuesta del backend o usar texto de fallback
            let meetLink = 'El enlace se enviará en el correo de confirmación antes de la reunión.';
            if (createdEvent) {
                // intentar varias rutas para obtener el link
                if (createdEvent.hangoutLink) {
                    meetLink = createdEvent.hangoutLink;
                } else if (createdEvent.conferenceData?.entryPoints instanceof Array) {
                    const ep = createdEvent.conferenceData.entryPoints.find(e => e.entryPointType === 'video');
                    if (ep?.uri) meetLink = ep.uri;
                } else if (createdEvent.conferenceData?.conferenceSolution?.name) {
                    // fallback posible
                    meetLink = createdEvent.htmlLink || meetLink;
                } else if (createdEvent.htmlLink) {
                    meetLink = createdEvent.htmlLink;
                }
            }

            // Send notification email with EmailJS
            const emailSent = await this.sendNotificationEmail(formData, eventResource, meetLink);

            // Show success message
            this.showSuccessMessage(formData, !!createdEvent, emailSent, meetLink);

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

        return {
            summary: `Reunión ZONDA ERP - ${formData.name}`,
            description: `Reunión de consulta sobre ZONDA ERP

Cliente: ${formData.name}
Email: ${formData.email}
${formData.phone ? `Teléfono: ${formData.phone}` : ''}
${formData.company ? `Empresa: ${formData.company}` : ''}
${formData.plan ? `Plan de interés: ${formData.plan}` : ''}

${formData.notes ? `Notas: ${formData.notes}` : ''}`,
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
                { email: 'contacto@zondaerp.com' } // organizador se define en backend/service account
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
            const response = await fetch('../api/create_event.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(event)
            });

            // If server returns non-JSON or error status, throw
            const text = await response.text();
            try {
                const json = JSON.parse(text);
                return json;
            } catch (e) {
                // fallback: return raw text on non-json
                console.warn('Backend returned non-json response:', text);
                return { raw: text };
            }
        } catch (err) {
            console.error('Network or fetch error to backend:', err);
            throw err;
        }
    }

    async sendNotificationEmail(formData, event, meetLink) {
        if (typeof emailjs === 'undefined') {
            console.warn('EmailJS no está disponible');
            return false;
        }

        try {
            // Formatear la fecha de la reunión
            const startDateTime = new Date(event.start.dateTime);
            const meetingDateFormatted = startDateTime.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Preparar los parámetros para el template de EmailJS
            const templateParams = {
                to_email: formData.email,
                to_name: formData.name,
                from_name: 'Equipo ZONDA ERP',
                meeting_date: meetingDateFormatted,
                meeting_time: `${formData.timeFormatted} - ${this.getEndTime()}`,
                meeting_duration: `${this.meetingDuration} minutos`,
                meeting_timezone: 'Hora de México (CST)',
                meeting_link: meetLink,
                client_name: formData.name,
                client_email: formData.email,
                client_phone: formData.phone || 'No proporcionado',
                client_company: formData.company || 'No proporcionado',
                client_plan: formData.plan || 'Por definir',
                client_notes: formData.notes || 'Ninguna',
                message: `
🗓️ CONFIRMACIÓN DE REUNIÓN - ZONDA ERP

Hola ${formData.name},

¡Tu reunión ha sido confirmada exitosamente!

📅 DETALLES DE LA REUNIÓN:
• Fecha: ${meetingDateFormatted}
• Hora: ${formData.timeFormatted} - ${this.getEndTime()}
• Duración: ${this.meetingDuration} minutos
• Zona horaria: Hora de México (CST)
• Modalidad: Virtual por Google Meet

🔗 ENLACE DE GOOGLE MEET:
${meetLink}

👤 TUS DATOS:
• Nombre: ${formData.name}
• Email: ${formData.email}
• Teléfono: ${formData.phone || 'No proporcionado'}
• Empresa: ${formData.company || 'No proporcionado'}
• Plan de interés: ${formData.plan || 'Por definir'}

${formData.notes ? `📝 NOTAS ADICIONALES:\n${formData.notes}\n` : ''}
                `.trim(),
                date: new Date().toLocaleString('es-ES'),
                reply_to: formData.email
            };

            // Enviar email usando EmailJS
            let response;
            try {
                response = await emailjs.send(
                    this.emailJSConfig.serviceId,
                    this.emailJSConfig.templateId,
                    templateParams
                );
                console.log('✅ Email de confirmación enviado exitosamente:', response);
            } catch (templateError) {
                console.warn('⚠️ Template de reuniones no encontrado o error, se produjo:', templateError);
                // Intentar fallback si existe
                const contactTemplateId = window.API_CONFIG?.EMAILJS_TEMPLATE_ID_CONTACT;
                if (contactTemplateId) {
                    response = await emailjs.send(
                        this.emailJSConfig.serviceId,
                        contactTemplateId,
                        templateParams
                    );
                    console.log('✅ Email enviado con template de contacto (fallback):', response);
                } else {
                    throw templateError;
                }
            }

            return true;

        } catch (error) {
            console.error('❌ Error al enviar email de confirmación:', error);
            return false;
        }
    }

    showSuccessMessage(formData, calendarEventCreated, emailSent, meetLink) {
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

                <div class="alert alert-primary mt-3 text-break">
                    <i class="bi bi-camera-video me-2"></i>
                    <strong>Enlace de Google Meet:</strong> 
                    ${ meetLink.startsWith('http') ? `<a href="${meetLink}" target="_blank">${meetLink}</a>` : meetLink }
                </div>

                ${emailSent ? 
                    `<div class="alert alert-success">
                        <i class="bi bi-envelope-check-fill me-2"></i>
                        ¡Email de confirmación enviado exitosamente a <strong>${formData.email}</strong>!
                    </div>` : 
                    `<div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        No se pudo enviar el email de confirmación. Por favor, guarda los detalles y el enlace de Meet.
                    </div>`
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
        console.error(`[ALERTA ${type.toUpperCase()}]: ${message}`); 
        alert(message);
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
