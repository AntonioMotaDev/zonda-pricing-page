      function toggleBilling(period) {
        // Actualizar botones activos
        document.querySelectorAll('.toggle-option').forEach(btn => {
          btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Actualizar precios
        document.querySelectorAll('.price-amount').forEach(priceElement => {
          const monthlyPrice = priceElement.getAttribute('data-monthly');
          const yearlyPrice = priceElement.getAttribute('data-yearly');
          
          if (period === 'monthly') {
            priceElement.textContent = monthlyPrice;
          } else {
            priceElement.textContent = yearlyPrice;
          }
        });

        // Actualizar período
        document.querySelectorAll('.price-period').forEach(periodElement => {
          periodElement.textContent = period === 'monthly' ? '/mes' : '/año';
        });
      }

      // Smooth scroll para los links de navegación
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });

      // Función para scroll hacia arriba
      function scrollToTop() {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }

      // WhatsApp Floating Button Enhancement
      document.addEventListener('DOMContentLoaded', function() {
        const whatsappButton = document.querySelector('.whatsapp-float');
        
        if (whatsappButton) {
          // Add bounce animation on page load
          setTimeout(() => {
            whatsappButton.style.animation = 'whatsappBounce 1s ease-in-out';
            setTimeout(() => {
              whatsappButton.style.animation = 'whatsappPulse 2s infinite';
            }, 1000);
          }, 2000);

          // Track clicks for analytics (optional)
          whatsappButton.addEventListener('click', function() {
            // Add bounce effect on click
            this.style.animation = 'whatsappBounce 0.6s ease-in-out';
            
            // Reset animation after bounce
            setTimeout(() => {
              this.style.animation = 'whatsappPulse 2s infinite';
            }, 600);

            // Optional: Track WhatsApp clicks for analytics
            if (typeof gtag !== 'undefined') {
              gtag('event', 'click', {
                'event_category': 'WhatsApp',
                'event_label': 'Floating Button',
                'value': 1
              });
            }

            // Optional: Track with other analytics services
            if (typeof fbq !== 'undefined') {
              fbq('track', 'Contact', {
                contact_method: 'WhatsApp'
              });
            }
          });

          // Hide button when scrolling up rapidly (optional UX enhancement)
          let lastScrollY = window.scrollY;
          let hideTimeout;

          window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            // If scrolling up rapidly, temporarily hide the button
            if (lastScrollY - currentScrollY > 100) {
              whatsappButton.style.opacity = '0.3';
              whatsappButton.style.transform = 'scale(0.8) translateY(10px)';
              
              clearTimeout(hideTimeout);
              hideTimeout = setTimeout(() => {
                whatsappButton.style.opacity = '1';
                whatsappButton.style.transform = 'scale(1) translateY(0)';
              }, 1000);
            }
            
            lastScrollY = currentScrollY;
          });

          // Add tooltip functionality (if tooltip element exists)
          const tooltip = whatsappButton.querySelector('.tooltip-text');
          if (!tooltip) {
            // Create tooltip if it doesn't exist
            const tooltipElement = document.createElement('span');
            tooltipElement.className = 'tooltip-text';
            tooltipElement.textContent = '¡Chatea con nosotros!';
            whatsappButton.appendChild(tooltipElement);
          }

          // Show tooltip on first visit (optional)
          const hasSeenTooltip = localStorage.getItem('whatsapp-tooltip-shown');
          if (!hasSeenTooltip) {
            setTimeout(() => {
              const tooltipEl = whatsappButton.querySelector('.tooltip-text');
              if (tooltipEl) {
                tooltipEl.style.opacity = '1';
                tooltipEl.style.visibility = 'visible';
                tooltipEl.style.transform = 'translateY(-50%) translateX(-5px)';
                
                setTimeout(() => {
                  tooltipEl.style.opacity = '0';
                  tooltipEl.style.visibility = 'hidden';
                  tooltipEl.style.transform = 'translateY(-50%) translateX(0)';
                  localStorage.setItem('whatsapp-tooltip-shown', 'true');
                }, 3000);
              }
            }, 5000);
          }

          // Improve accessibility
          whatsappButton.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.click();
            }
          });

          // Add focus styles for keyboard navigation
          whatsappButton.addEventListener('focus', function() {
            this.style.outline = '3px solid rgba(37, 211, 102, 0.5)';
            this.style.outlineOffset = '2px';
          });

          whatsappButton.addEventListener('blur', function() {
            this.style.outline = 'none';
          });
        }
      });

      // Enhanced WhatsApp message based on current page section
      function getContextualWhatsAppMessage() {
        const currentHash = window.location.hash;
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        
        // Determine which section user is viewing
        let message = 'Hola, me gustaría obtener más información sobre ZONDA ERP';
        
        if (currentHash === '#pricing' || document.querySelector('#pricing').offsetTop - scrollPosition < windowHeight) {
          message = 'Hola, me interesa conocer más sobre los planes y precios de ZONDA ERP';
        } else if (currentHash === '#comparative') {
          message = 'Hola, quisiera una explicación detallada de las funcionalidades de ZONDA ERP';
        } else if (currentHash === '#contact') {
          message = 'Hola, me gustaría agendar una reunión para conocer ZONDA ERP';
        }
        
        return encodeURIComponent(message);
      }

      // Update WhatsApp link based on context
      function updateWhatsAppLink() {
        const whatsappButton = document.querySelector('.whatsapp-float');
        if (whatsappButton) {
          const baseUrl = 'https://wa.me/524448447798?text=';
          const message = getContextualWhatsAppMessage();
          whatsappButton.href = baseUrl + message;
        }
      }

      // Update WhatsApp message when scrolling or hash changes
      window.addEventListener('scroll', updateWhatsAppLink);
      window.addEventListener('hashchange', updateWhatsAppLink);

      // Device detection for enhanced mobile experience
      function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      }

      // Add mobile-specific enhancements
      if (isMobileDevice()) {
        document.addEventListener('DOMContentLoaded', function() {
          const whatsappButton = document.querySelector('.whatsapp-float');
          if (whatsappButton) {
            // Add haptic feedback on mobile (if supported)
            whatsappButton.addEventListener('touchstart', function() {
              if (navigator.vibrate) {
                navigator.vibrate(50); // Short vibration
              }
            });

            // Prevent double-tap zoom on the button
            let lastTouchEnd = 0;
            whatsappButton.addEventListener('touchend', function(e) {
              const now = (new Date()).getTime();
              if (now - lastTouchEnd <= 300) {
                e.preventDefault();
              }
              lastTouchEnd = now;
            }, false);
          }
        });
      }

      // Enhanced Collapse Management for Comparative Section
      document.addEventListener('DOMContentLoaded', function() {
        // Handle collapse state changes for visual feedback
        const collapseElements = document.querySelectorAll('.modulo-contenido.collapse');
        
        collapseElements.forEach(function(collapseEl) {
          const trigger = document.querySelector(`[data-bs-target="#${collapseEl.id}"]`);
          
          if (trigger) {
            // Update visual state of trigger when collapse changes
            collapseEl.addEventListener('show.bs.collapse', function() {
              trigger.classList.remove('collapsed');
            });
            
            collapseEl.addEventListener('hide.bs.collapse', function() {
              trigger.classList.add('collapsed');
            });

            // Initialize collapsed state for non-shown elements
            if (!collapseEl.classList.contains('show')) {
              trigger.classList.add('collapsed');
            }
          }
        });

        // Add "Expand All" / "Collapse All" functionality for each system
        const sistemas = document.querySelectorAll('.sistema');
        
        sistemas.forEach(function(sistema) {
          const sistemaHeader = sistema.querySelector('.sistema-header');
          
          // Create single toggle button
          const toggleBtn = document.createElement('button');
          toggleBtn.className = 'toggle-all-modules-btn';
          toggleBtn.setAttribute('aria-label', 'Expandir/Colapsar todos los módulos');
          toggleBtn.innerHTML = `
            <i class="fas fa-chevron-up toggle-icon"></i>
            <span class="toggle-text">Colapsar Todo</span>
          `;
          
          // Add the button to the header
          sistemaHeader.appendChild(toggleBtn);
          
          // Toggle all functionality
          toggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const collapses = sistema.querySelectorAll('.modulo-contenido.collapse');
            const icon = toggleBtn.querySelector('.toggle-icon');
            const text = toggleBtn.querySelector('.toggle-text');
            
            // Check if any are shown
            const anyShown = Array.from(collapses).some(collapse => collapse.classList.contains('show'));
            
            if (anyShown) {
              // Collapse all
              collapses.forEach(function(collapse) {
                if (collapse.classList.contains('show')) {
                  const bsCollapse = new bootstrap.Collapse(collapse, {toggle: false});
                  bsCollapse.hide();
                }
              });
              icon.classList.remove('fa-chevron-up');
              icon.classList.add('fa-chevron-down');
              text.textContent = 'Expandir Todo';
              toggleBtn.classList.add('collapsed');
            } else {
              // Expand all
              collapses.forEach(function(collapse) {
                if (!collapse.classList.contains('show')) {
                  const bsCollapse = new bootstrap.Collapse(collapse, {toggle: false});
                  bsCollapse.show();
                }
              });
              icon.classList.remove('fa-chevron-down');
              icon.classList.add('fa-chevron-up');
              text.textContent = 'Colapsar Todo';
              toggleBtn.classList.remove('collapsed');
            }
          });
        });

        // Add keyboard navigation support
        document.querySelectorAll('.modulo-titulo').forEach(function(titulo) {
          titulo.setAttribute('tabindex', '0');
          
          titulo.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              titulo.click();
            }
          });
        });

        // Add smooth height transitions for better UX
        collapseElements.forEach(function(element) {
          element.addEventListener('show.bs.collapse', function() {
            this.style.transition = 'all 0.35s ease';
          });
          
          element.addEventListener('hide.bs.collapse', function() {
            this.style.transition = 'all 0.35s ease';
          });
        });

        // Track which modules are most viewed (for analytics)
        const observerOptions = {
          threshold: 0.5,
          rootMargin: '0px 0px -50px 0px'
        };
        
        const moduleObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              const moduleTitle = entry.target.querySelector('.modulo-titulo');
              if (moduleTitle && typeof gtag !== 'undefined') {
                gtag('event', 'module_viewed', {
                  'event_category': 'Comparative',
                  'event_label': moduleTitle.textContent.trim(),
                  'value': 1
                });
              }
            }
          });
        }, observerOptions);

        // Observe all modules for analytics
        document.querySelectorAll('.modulo').forEach(function(modulo) {
          moduleObserver.observe(modulo);
        });
      });
