/**
 * PULSE — Interactive Intelligence OS
 * Enhanced UI/UX Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('[SYSTEM_BOOT] Intelligence layers active.');

    // ─────────────────────────────────────
    // 1. AOS - Animate On Scroll
    // ─────────────────────────────────────
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            once: true,
            mirror: false,
            offset: 50,
            delay: 0,
            disable: function() {
                return window.innerWidth < 768; // Disable on mobile for performance
            }
        });
    }

    // ─────────────────────────────────────
    // 2. Sticky Navigation - Scroll Effects
    // ─────────────────────────────────────
    const nav = document.querySelector('.sticky-nav');
    let lastScroll = 0;
    const scrollThreshold = 100;

    function handleScroll() {
        const currentScroll = window.scrollY;

        if (nav) {
            // Add scrolled class when past threshold
            if (currentScroll > scrollThreshold) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        }

        lastScroll = currentScroll;
    }

    // Use passive scroll listener for performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    // ─────────────────────────────────────
    // 3. Parallax Hero Aura - Mouse Follow
    // ─────────────────────────────────────
    const heroAuras = document.querySelectorAll('.hero-aura, .hero-aura-enhanced');

    if (heroAuras.length > 0) {
        let mouseX = 0;
        let mouseY = 0;
        let currentX = 0;
        let currentY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Smooth parallax animation
        function animateAura() {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // Calculate target position (subtle movement)
            const targetX = (mouseX / windowWidth - 0.5) * 30;
            const targetY = (mouseY / windowHeight - 0.5) * 30;

            // Smooth interpolation (lerp)
            currentX += (targetX - currentX) * 0.05;
            currentY += (targetY - currentY) * 0.05;

            heroAuras.forEach(aura => {
                const baseTransform = getComputedStyle(aura).transform;
                const isEnhanced = aura.classList.contains('hero-aura-enhanced');

                if (isEnhanced) {
                    aura.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
                } else {
                    aura.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
                }
            });

            requestAnimationFrame(animateAura);
        }

        animateAura();
    }

    // ─────────────────────────────────────
    // 4. Typewriter Effect for Status Bar
    // ─────────────────────────────────────
    const typewriterElement = document.getElementById('typewriter-status');

    if (typewriterElement) {
        const messages = [
            "Analyzing community health in real-time...",
            "Synthesizing contributor telemetry...",
            "Neural nodes operational.",
            "Awaiting telemetry packets..."
        ];

        let msgIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typeSpeed = 100;

        function type() {
            const currentMsg = messages[msgIndex];

            if (isDeleting) {
                typewriterElement.textContent = currentMsg.substring(0, charIndex - 1);
                charIndex--;
                typeSpeed = 50;
            } else {
                typewriterElement.textContent = currentMsg.substring(0, charIndex + 1);
                charIndex++;
                typeSpeed = 100;
            }

            if (!isDeleting && charIndex === currentMsg.length) {
                isDeleting = true;
                typeSpeed = 2000; // Pause at end
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                msgIndex = (msgIndex + 1) % messages.length;
                typeSpeed = 500;
            }

            setTimeout(type, typeSpeed);
        }

        type();
    }

    // ─────────────────────────────────────
    // 5. Form Handling with Loading States
    // ─────────────────────────────────────
    const forms = document.querySelectorAll('.email-form, form');

    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            // Only prevent default for email-form (mock), let actual forms submit
            if (form.classList.contains('email-form')) {
                e.preventDefault();
            }

            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn ? btn.textContent : '';

            if (btn && !btn.disabled) {
                // Add loading state with accessibility
                btn.classList.add('btn-loading');
                btn.disabled = true;
                btn.setAttribute('aria-busy', 'true');
                btn.setAttribute('aria-label', 'Submitting, please wait');

                // Announce loading state to screen readers
                const statusRegion = document.getElementById('form-status');
                if (statusRegion) {
                    statusRegion.textContent = 'Form is being submitted...';
                    statusRegion.setAttribute('aria-live', 'polite');
                }

                // For mock email form
                if (form.classList.contains('email-form')) {
                    setTimeout(() => {
                        btn.classList.remove('btn-loading');
                        btn.removeAttribute('aria-busy');
                        btn.removeAttribute('aria-label');
                        btn.textContent = "ACCESS REQUESTED";
                        btn.style.background = "var(--accent-green)";
                        form.reset();

                        // Announce success to screen readers
                        if (statusRegion) {
                            statusRegion.textContent = 'Access requested successfully!';
                        }

                        // Reset button after a few seconds
                        setTimeout(() => {
                            btn.textContent = originalText;
                            btn.style.background = "";
                            btn.disabled = false;
                            if (statusRegion) {
                                statusRegion.textContent = '';
                            }
                        }, 3000);
                    }, 1500);
                }
            }
        });
    });

    // ─────────────────────────────────────
    // 6. Smooth Anchor Scrolling
    // ─────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');

            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();
                const headerOffset = 96; // Account for fixed header
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ─────────────────────────────────────
    // 7. Button Ripple Effect
    // ─────────────────────────────────────
    document.querySelectorAll('.btn, button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Only add ripple if not already loading or disabled
            if (this.classList.contains('btn-loading') || this.disabled) return;

            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                pointer-events: none;
                width: 100px;
                height: 100px;
                left: ${x - 50}px;
                top: ${y - 50}px;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
            `;

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add ripple keyframe dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ─────────────────────────────────────
    // 8. Interactive Card Hover Effects
    // ─────────────────────────────────────
    document.querySelectorAll('.glass-panel, .premium-card, .feature-card').forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            // Add subtle tilt effect on mouse move within card
            this.style.transform = 'translateY(-4px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // ─────────────────────────────────────
    // 9. Lazy Load Images with Fade In
    // ─────────────────────────────────────
    const images = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for older browsers
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    }

    // Add loaded class CSS
    const imgStyle = document.createElement('style');
    imgStyle.textContent = `
        img { opacity: 1; transition: opacity 0.3s ease; }
        img.loading { opacity: 0; }
        img.loaded { opacity: 1; }
    `;
    document.head.appendChild(imgStyle);

    // ─────────────────────────────────────
    // 10. Enhanced Keyboard Navigation
    // ─────────────────────────────────────
    // Trap focus in modal/mobile menu when open
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenu) {
        const focusableElements = mobileMenu.querySelectorAll('a, button');
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        mobileMenu.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
    }

    // ─────────────────────────────────────
    // 11. Performance: Reduce animations on low-power devices
    // ─────────────────────────────────────
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (prefersReducedMotion.matches) {
        // Disable non-essential JS animations
        console.log('[SYSTEM] Reduced motion mode active');
    }

    // ─────────────────────────────────────
    // 12. Initialize GSAP-like animations (CSS-based)
    // ─────────────────────────────────────
    // Only add custom animations if AOS is not available (avoid conflicts)
    if (typeof AOS === 'undefined') {
        const gridItems = document.querySelectorAll('.responsive-grid > *, .features-grid > *');

        gridItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

            // Intersection Observer for triggering animations
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, index * 100); // Stagger delay
                        observer.unobserve(item);
                    }
                });
            }, { threshold: 0.1 });

            observer.observe(item);
        });
    }

    console.log('[SYSTEM] UI/UX enhancements loaded.');
});
