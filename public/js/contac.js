/**
 * Maneja el formulario de contacto con:
 * - Validación
 * - Envío con EmailJS
 * - Fallback a cliente de email (mailto)
 */

class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitBtn = this.form.querySelector('.contact-submit-btn');
        this.btnText = this.submitBtn.querySelector('.btn-text');
        this.btnLoading = this.submitBtn.querySelector('.btn-loading');
        this.formMessage = this.form.querySelector('.form-message');
        this.messageAlert = this.formMessage.querySelector('.alert');
        this.emailFallbackBtn = document.getElementById('emailFallbackBtn');
        
        // Initialize EmailJS 
        this.emailJSConfig = {
            publicKey: 'FVBRMeBcGeLym1gyx',        
            serviceId: 'service_99y7v5w',
            templateId: 'template_kxbgnd8'   
        };
        
        this.init();
    }

    /**
     * Inicializa el manejador del formulario
     */
    init() {
        // Inicializar EmailJS
        if (typeof emailjs !== 'undefined') {
            emailjs.init(this.emailJSConfig.publicKey);
        }
        
        // Event listeners
        this.setupEventListeners();
        this.setupRealTimeValidation();
        this.autoSelectPlan();
        
        console.log('📧 Contact Form Handler iniciado correctamente');
    }

    /**
     * Configura todos los event listeners
     */
    setupEventListeners() {
        // Form submit
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Email fallback button
        this.emailFallbackBtn.addEventListener('click', () => this.openEmailClient());
    }

    /**
     * Configura validación en tiempo real
     */
    setupRealTimeValidation() {
        const formInputs = this.form.querySelectorAll('input, select, textarea');
        
        formInputs.forEach(input => {
            // Validación en blur
            input.addEventListener('blur', () => {
                if (input.hasAttribute('required')) {
                    this.validateField(input);
                }
            });

            // Limpiar validación en focus
            input.addEventListener('focus', () => {
                input.classList.remove('is-invalid', 'is-valid');
            });
        });
    }

    /**
     * Valida un campo individual
     */
    validateField(field) {
        const value = field.type === 'checkbox' ? field.checked : field.value.trim();
        
        if (!value) {
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');
            return false;
        } else {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            
            // Validación específica para email
            if (field.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    field.classList.add('is-invalid');
                    field.classList.remove('is-valid');
                    return false;
                }
            }
            
            return true;
        }
    }

    /**
     * Valida todo el formulario
     */
    validateForm() {
        let isValid = true;
        const requiredFields = this.form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    /**
     * Muestra mensajes al usuario
     */
    showMessage(type, text) {
        this.formMessage.classList.remove('d-none');
        this.messageAlert.className = `alert alert-${type}`;
        this.messageAlert.textContent = text;
        
        // Auto hide después de 5 segundos
        setTimeout(() => {
            this.formMessage.classList.add('d-none');
        }, 5000);
        
        // Scroll hacia el mensaje
        this.messageAlert.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }

    /**
     * Cambia el estado del botón (loading/normal)
     */
    setButtonState(isLoading) {
        this.submitBtn.disabled = isLoading;
        
        if (isLoading) {
            this.btnText.classList.add('d-none');
            this.btnLoading.classList.remove('d-none');
        } else {
            this.btnText.classList.remove('d-none');
            this.btnLoading.classList.add('d-none');
        }
    }

    /**
     * Obtiene los datos del formulario
     */
    getFormData() {
        const formData = new FormData(this.form);
        return Object.fromEntries(formData);
    }

    /**
     * Prepara los parámetros para EmailJS
     */
    prepareEmailParams(data) {
        // Crear mensaje completo con toda la información
        const fullMessage = `
📧 NUEVA CONSULTA ZONDA ERP

👤 INFORMACIÓN DE CONTACTO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Nombre: ${data.firstName} ${data.lastName}
• Email: ${data.email}
• Teléfono: ${data.phone || 'No proporcionado'}
• Empresa: ${data.company || 'No proporcionado'}
• Plan de interés: ${data.plan}

💬 MENSAJE DEL CLIENTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Información adicional:
• Email de contacto directo: ${data.email}
• Fecha de consulta: ${new Date().toLocaleDateString('es-ES')}
• Origen: Formulario web ZONDA ERP
        `;

        return {
            // Variables para el template por defecto de EmailJS
            name: `${data.firstName} ${data.lastName}`,
            time: new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            message: fullMessage,
            
            // Variables adicionales por si quieres un template personalizado
            to_email: 'zonda.desarrollo@gmail.com',
            from_name: `${data.firstName} ${data.lastName}`,
            from_email: data.email,
            phone: data.phone || 'No proporcionado',
            company: data.company || 'No proporcionado',
            plan: data.plan,
            original_message: data.message,
            date: new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    }

    /**
     * Envía el email usando EmailJS
     */
    async sendEmailJS(templateParams) {
        if (typeof emailjs === 'undefined') {
            throw new Error('EmailJS no está disponible');
        }

        return await emailjs.send(
            this.emailJSConfig.serviceId,
            this.emailJSConfig.templateId,
            templateParams
        );
    }

    /**
     * Abre el cliente de email con datos pre-llenados
     */
    openEmailClient(formData = null) {
        const data = formData || this.getFormData();
        
        const subject = encodeURIComponent(
            `Nueva consulta ZONDA ERP - ${data.firstName || '[Nombre]'} ${data.lastName || '[Apellido]'}`
        );
        
        const body = encodeURIComponent(`
Hola equipo de ZONDA,

Me interesa conocer más sobre sus planes de ERP para control de plagas.

INFORMACIÓN DE CONTACTO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Nombre: ${data.firstName || '[Por completar]'} ${data.lastName || '[Por completar]'}
📧 Email: ${data.email || '[Por completar]'}
📞 Teléfono: ${data.phone || '[Por completar]'}
🏢 Empresa: ${data.company || '[Por completar]'}
📋 Plan de interés: ${data.plan || '[Por completar]'}

MENSAJE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.message || '[Por completar - describe tu empresa, número de técnicos, clientes actuales y funcionalidades que necesitas]'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Enviado desde: https://zondaerp.com
Fecha: ${new Date().toLocaleString('es-ES')}

¡Espero su respuesta!
Saludos cordiales.
        `);
        
        // Abrir cliente de email
        window.location.href = `mailto:zonda.desarrollo@gmail.com?subject=${subject}&body=${body}`;
    }

    /**
     * Resetea el formulario
     */
    resetForm() {
        this.form.reset();
        const formInputs = this.form.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });
    }

    /**
     * Auto-selecciona plan basado en URL
     */
    autoSelectPlan() {
        const urlParams = new URLSearchParams(window.location.search);
        const planParam = urlParams.get('plan');
        
        if (planParam) {
            const planSelect = document.getElementById('plan');
            if (planSelect) {
                planSelect.value = planParam;
            }
        }
    }

    /**
     * Manejador principal del submit del formulario
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        console.log('📤 Procesando envío de formulario...');
        
        // Validar formulario
        if (!this.validateForm()) {
            this.showMessage('danger', 'Por favor, completa todos los campos requeridos correctamente.');
            return;
        }

        // Mostrar estado de loading
        this.setButtonState(true);

        try {
            // Obtener datos del formulario
            const formData = this.getFormData();
            console.log('📋 Datos del formulario:', formData);
            
            // Preparar parámetros para EmailJS
            const templateParams = this.prepareEmailParams(formData);
            
            // Intentar enviar con EmailJS
            const response = await this.sendEmailJS(templateParams);
            console.log('✅ Email enviado exitosamente via EmailJS:', response);
            
            // Mostrar mensaje de éxito
            this.showMessage(
                'success', 
                '¡Gracias por contactarnos! Tu mensaje ha sido enviado exitosamente. Nos pondremos en contacto contigo pronto.'
            );
            
            // Resetear formulario
            this.resetForm();
            
        } catch (error) {
            console.error('❌ Error al enviar via EmailJS:', error);
            
            // Fallback: abrir cliente de email
            const formData = this.getFormData();
            this.openEmailClient(formData);
            
            this.showMessage(
                'warning', 
                'Se ha abierto tu cliente de email con los datos pre-llenados. Por favor, envía el email desde tu aplicación de correo.'
            );
            
        } finally {
            // Resetear estado del botón
            this.setButtonState(false);
        }
    }
}

/**
 * Inicializar el manejador cuando el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que el formulario existe
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        // Inicializar el manejador del formulario
        window.contactFormHandler = new ContactFormHandler();
        console.log('🚀 Sistema de contacto inicializado correctamente');
    } else {
        console.warn('⚠️ Formulario de contacto no encontrado');
    }
});