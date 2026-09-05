/**
 * ═══════════════════════════════════════════════════════════════
 * 🌹 ROSHANA PLATFORM - UNIFIED FRONTEND SCRIPT
 * Modern API Platform with Dark Theme Support
 * ═══════════════════════════════════════════════════════════════
 */

class RoshanaApp {
    constructor() {
        this.apiBase = window.location.origin;
        this.init();
    }

    init() {
        this.hideLoader();
        this.loadTheme();
        this.initHeroCode();
        this.checkApiStatus();
        this.initNavigation();
        this.initAnimations();
        this.animateCounters();
        this.initNavbarScroll();
    }

    // ───────────────────────────────────────────────────────────
    // LOADER
    // ───────────────────────────────────────────────────────────
    hideLoader() {
        setTimeout(() => {
            const loader = document.querySelector('.loader');
            if (loader) {
                loader.classList.add('hidden');
            }
        }, 1000);
    }

    // ───────────────────────────────────────────────────────────
    // THEME MANAGEMENT
    // ───────────────────────────────────────────────────────────
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);

        const themeToggle = document.getElementById('themeToggle');
        themeToggle?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.updateThemeIcon(newTheme);
        });
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    // ───────────────────────────────────────────────────────────
    // HERO CODE ANIMATION
    // ───────────────────────────────────────────────────────────
    initHeroCode() {
        const codeElement = document.getElementById('heroCode');
        if (!codeElement) return;

        const codeSnippets = [
            `{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "محمد امین",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": ${Date.now()}
}`,
            `{
  "status": "online",
  "services": {
    "roshana-sci": "active",
    "fartak": "active",
    "proxy": "ready"
  },
  "version": "2.0.0"
}`,
            `{
  "message": "دسترسی مجاز",
  "resource": "ieeexplore.ieee.org",
  "allowed": true,
  "latency": "45ms"
}`,
            `curl -X POST \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  "https://api.roshana.io/api/v1/auth/login"`
        ];

        let currentIndex = 0;

        const animateCode = () => {
            codeElement.style.opacity = '0';
            codeElement.style.transform = 'translateY(10px)';

            setTimeout(() => {
                codeElement.textContent = codeSnippets[currentIndex];
                codeElement.style.opacity = '1';
                codeElement.style.transform = 'translateY(0)';
                currentIndex = (currentIndex + 1) % codeSnippets.length;
            }, 300);
        };

        codeElement.style.transition = 'all 0.3s ease';
        setInterval(animateCode, 4000);
        animateCode();
    }

    // ───────────────────────────────────────────────────────────
    // API STATUS CHECK
    // ───────────────────────────────────────────────────────────
    async checkApiStatus() {
        // Check endpoint-status elements
        const endpointStatuses = document.querySelectorAll('.endpoint-status');
        for (const endpoint of endpointStatuses) {
            const url = endpoint.dataset.endpoint;
            try {
                const response = await fetch(`${this.apiBase}${url}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                    endpoint.classList.add('online');
                } else {
                    endpoint.classList.add('offline');
                }
            } catch (error) {
                endpoint.classList.add('offline');
            }
        }

        // Check status-indicator elements
        try {
            const response = await fetch('/health');
            const data = await response.json();

            if (!data.success) {
                document.querySelectorAll('.status-indicator').forEach(indicator => {
                    indicator.classList.remove('online');
                    indicator.style.background = '#ef4444';
                });
            }
        } catch (error) {
            console.warn('Health check endpoint not available');
        }
    }

    // ───────────────────────────────────────────────────────────
    // NAVIGATION
    // ───────────────────────────────────────────────────────────
    initNavigation() {
        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobileToggle');
        const navMenu = document.querySelector('.navbar__menu');

        mobileToggle?.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Smooth scroll for nav links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href !== '#') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });

        // Active nav link on scroll
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (window.scrollY >= sectionTop - 200) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }

    // ───────────────────────────────────────────────────────────
    // NAVBAR SCROLL EFFECT
    // ───────────────────────────────────────────────────────────
    initNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(3, 7, 18, 0.95)';
                navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.3)';
            } else {
                const theme = document.documentElement.getAttribute('data-theme');
                if (theme === 'dark') {
                    navbar.style.background = 'rgba(3, 7, 18, 0.8)';
                } else {
                    navbar.style.background = 'rgba(255, 255, 255, 0.9)';
                }
                navbar.style.boxShadow = 'none';
            }
        });
    }

    // ───────────────────────────────────────────────────────────
    // COUNTER ANIMATION
    // ───────────────────────────────────────────────────────────
    animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        if (counters.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseFloat(counter.dataset.count);
                    const isDecimal = target % 1 !== 0;
                    this.animateValue(counter, 0, target, 2000, isDecimal);
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    }

    animateValue(element, start, end, duration, isDecimal = false) {
        let startTimestamp = null;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            const value = start + (end - start) * easeProgress;

            if (isDecimal) {
                element.textContent = value.toFixed(1);
            } else {
                element.textContent = Math.floor(value);
            }

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }

    // ───────────────────────────────────────────────────────────
    // SCROLL ANIMATIONS
    // ───────────────────────────────────────────────────────────
    initAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Add animation styles and observe elements
        const animatedElements = document.querySelectorAll(
            '.feature-card, .endpoint, .status-card, .quick-card, .contact-item'
        );

        animatedElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
            observer.observe(el);
        });

        // Apply animation when visible
        const applyAnimation = () => {
            document.querySelectorAll('.animate').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        };

        // Use requestAnimationFrame for smoother updates
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    applyAnimation();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
}

// ───────────────────────────────────────────────────────────────
// INITIALIZE APP
// ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.roshanaApp = new RoshanaApp();
});

// ───────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ───────────────────────────────────────────────────────────────

/**
 * Format number with Persian digits
 */
function formatPersianNumber(num) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, d => persianDigits[d]);
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Copy to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show toast notification
        const toast = document.createElement('div');
        toast.className = 'toast toast--success';
        toast.innerHTML = '<i class="fas fa-check"></i> کپی شد!';
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    });
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}