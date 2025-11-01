// Help Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize help page functionality
    initializeSearch();
    initializeQuickAccess();
    initializeFAQ();
    initializeNavigation();
    
    // Scroll to top functionality
    window.scrollToTop = function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };
});

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const suggestionTags = document.querySelectorAll('.suggestion-tag');
    
    // Search button click
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    // Search input enter key
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Real-time search suggestions
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            if (query.length > 2) {
                highlightSearchResults(query);
            } else {
                clearHighlights();
            }
        });
    }
    
    // Suggestion tags click
    suggestionTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const searchTerm = this.getAttribute('data-search');
            if (searchInput) {
                searchInput.value = searchTerm;
                performSearch();
            }
        });
    });
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    if (!query) {
        showSearchMessage('Por favor, ingresa un término de búsqueda');
        return;
    }
    
    // Clear previous highlights
    clearHighlights();
    
    // Search in content
    const results = searchInContent(query);
    
    if (results.length > 0) {
        // Show first relevant section
        showContentSection(results[0].section);
        
        // Highlight results
        highlightSearchResults(query);
        
        // Scroll to first result
        setTimeout(() => {
            const firstResult = document.querySelector('.search-highlight');
            if (firstResult) {
                firstResult.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }, 300);
        
        showSearchMessage(`Se encontraron ${results.length} resultado(s) para "${query}"`);
    } else {
        showSearchMessage(`No se encontraron resultados para "${query}". Intenta con otros términos.`);
    }
}

function searchInContent(query) {
    const results = [];
    const sections = document.querySelectorAll('.content-section');
    
    sections.forEach(section => {
        const sectionId = section.id.replace('-content', '');
        const textContent = section.textContent.toLowerCase();
        
        if (textContent.includes(query)) {
            const matches = (textContent.match(new RegExp(query, 'gi')) || []).length;
            results.push({
                section: sectionId,
                matches: matches
            });
        }
    });
    
    // Sort by number of matches
    return results.sort((a, b) => b.matches - a.matches);
}

function highlightSearchResults(query) {
    const textNodes = getTextNodes(document.body);
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    
    textNodes.forEach(node => {
        if (node.parentElement.closest('.content-section')) {
            const text = node.textContent;
            if (regex.test(text)) {
                const highlightedText = text.replace(regex, '<mark class="search-highlight">$1</mark>');
                const wrapper = document.createElement('span');
                wrapper.innerHTML = highlightedText;
                node.parentNode.replaceChild(wrapper, node);
            }
        }
    });
}

function clearHighlights() {
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });
}

function getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let node;
    while (node = walker.nextNode()) {
        if (node.textContent.trim()) {
            textNodes.push(node);
        }
    }
    
    return textNodes;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function showSearchMessage(message) {
    // Remove existing message
    const existingMessage = document.querySelector('.search-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'search-message alert alert-info mt-3';
    messageDiv.innerHTML = `<i class="bi bi-info-circle me-2"></i>${message}`;
    
    const searchBox = document.querySelector('.search-help-box');
    if (searchBox) {
        searchBox.appendChild(messageDiv);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Quick access cards functionality
function initializeQuickAccess() {
    const quickAccessCards = document.querySelectorAll('.quick-access-card');
    
    quickAccessCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            showContentSection(category);
            
            // Scroll to content
            document.getElementById('help-content').scrollIntoView({ 
                behavior: 'smooth' 
            });
            
            // Add visual feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
        
        // Hover effect enhancement
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.card-icon');
            if (icon) {
                icon.style.animation = 'pulse 1s infinite';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.card-icon');
            if (icon) {
                icon.style.animation = '';
            }
        });
    });
}

// Content section switching
function showContentSection(sectionId) {
    // Hide all sections
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId + '-content');
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Update navigation dots if they exist
        updateNavigationDots(sectionId);
        
        // Animate section appearance
        targetSection.style.opacity = '0';
        targetSection.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            targetSection.style.transition = 'all 0.5s ease';
            targetSection.style.opacity = '1';
            targetSection.style.transform = 'translateY(0)';
        }, 50);
    }
}

// FAQ functionality
function initializeFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            // Close all other FAQs
            faqQuestions.forEach(q => {
                if (q !== this) {
                    q.setAttribute('aria-expanded', 'false');
                    const otherIcon = q.querySelector('.faq-icon');
                    if (otherIcon) {
                        otherIcon.classList.remove('bi-dash');
                        otherIcon.classList.add('bi-plus');
                    }
                }
            });
            
            // Toggle current FAQ
            this.setAttribute('aria-expanded', !isExpanded);
            const icon = this.querySelector('.faq-icon');
            if (icon) {
                if (isExpanded) {
                    icon.classList.remove('bi-dash');
                    icon.classList.add('bi-plus');
                } else {
                    icon.classList.remove('bi-plus');
                    icon.classList.add('bi-dash');
                }
            }
            
            // Add ripple effect
            createRippleEffect(this, event);
        });
    });
}

// Navigation functionality
function initializeNavigation() {
    createNavigationDots();
    
    // Smooth scroll for internal links
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Scroll spy functionality
    window.addEventListener('scroll', handleScrollSpy);
}

function createNavigationDots() {
    const sections = ['getting-started', 'user-manual', 'processes', 'faq'];
    const navigation = document.createElement('div');
    navigation.className = 'content-navigation';
    
    sections.forEach((section, index) => {
        const dot = document.createElement('div');
        dot.className = 'nav-dot';
        dot.setAttribute('data-section', section);
        dot.title = getSectionTitle(section);
        
        if (index === 0) {
            dot.classList.add('active');
        }
        
        dot.addEventListener('click', function() {
            showContentSection(section);
            document.getElementById('help-content').scrollIntoView({ 
                behavior: 'smooth' 
            });
        });
        
        navigation.appendChild(dot);
    });
    
    document.body.appendChild(navigation);
}

function updateNavigationDots(activeSection) {
    const dots = document.querySelectorAll('.nav-dot');
    dots.forEach(dot => {
        dot.classList.remove('active');
        if (dot.getAttribute('data-section') === activeSection) {
            dot.classList.add('active');
        }
    });
}

function getSectionTitle(sectionId) {
    const titles = {
        'getting-started': 'Primeros Pasos',
        'user-manual': 'Manual de Usuario',
        'processes': 'Procesos',
        'faq': 'FAQ'
    };
    return titles[sectionId] || '';
}

function handleScrollSpy() {
    const sections = document.querySelectorAll('.content-section');
    const navigation = document.querySelector('.content-navigation');
    
    if (!navigation) return;
    
    // Show/hide navigation based on scroll position
    const helpContent = document.getElementById('help-content');
    if (helpContent) {
        const rect = helpContent.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 200) {
            navigation.classList.add('active');
        } else {
            navigation.classList.remove('active');
        }
    }
}

// Utility functions
function createRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(29, 45, 131, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add CSS animation for ripple effect
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    .search-highlight {
        background: #fff3cd;
        color: #856404;
        padding: 2px 4px;
        border-radius: 3px;
        font-weight: 600;
    }
    
    .search-message {
        animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput === document.activeElement) {
            searchInput.value = '';
            clearHighlights();
            const message = document.querySelector('.search-message');
            if (message) {
                message.remove();
            }
        }
    }
});

// Print functionality
function printHelpSection() {
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ZONDA ERP - Centro de Ayuda</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                    h1, h2, h3, h4 { color: #132336; }
                    .help-list { list-style-type: disc; margin-left: 20px; }
                    .manual-list { list-style-type: disc; margin-left: 20px; }
                    .process-step { margin-bottom: 15px; }
                    .faq-item { margin-bottom: 20px; }
                    .faq-question { font-weight: bold; margin-bottom: 5px; }
                    .faq-answer { margin-left: 20px; }
                    @media print {
                        body { margin: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>ZONDA ERP - Centro de Ayuda</h1>
                ${activeSection.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// Export print function to global scope
window.printHelpSection = printHelpSection;

// Analytics tracking (placeholder for future implementation)
function trackHelpInteraction(action, section, query = null) {
    // Placeholder for analytics tracking
    console.log('Help interaction:', { action, section, query });
}

// Enhanced accessibility
function enhanceAccessibility() {
    // Add ARIA labels and roles where needed
    const quickAccessCards = document.querySelectorAll('.quick-access-card');
    quickAccessCards.forEach((card, index) => {
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Acceder a ${card.querySelector('h5').textContent}`);
        
        // Keyboard navigation
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    // FAQ accessibility
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.setAttribute('role', 'button');
        question.setAttribute('tabindex', '0');
        
        question.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

// Initialize accessibility enhancements
document.addEventListener('DOMContentLoaded', enhanceAccessibility);

// Loading state management
function showLoadingState(element) {
    const loader = document.createElement('div');
    loader.className = 'loading-spinner';
    loader.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Cargando...';
    element.appendChild(loader);
}

function hideLoadingState(element) {
    const loader = element.querySelector('.loading-spinner');
    if (loader) {
        loader.remove();
    }
}

// Add spinner CSS
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
    .loading-spinner {
        text-align: center;
        padding: 20px;
        color: #6c757d;
    }
    
    .spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(spinnerStyle);