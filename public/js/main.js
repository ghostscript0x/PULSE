/**
 * PULSE — Interactive Intelligence OS
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('[SYSTEM_BOOT] Intelligence layers active.');

    // 0. Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            once: true,
            mirror: false
        });
    }

    // 0.1 Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
        });

        // Close menu on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        });
    }

    // 1. Typewriter Effect for Status Bar
    const typewriterElement = document.getElementById('typewriter-status');
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
        if (!typewriterElement) return;
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

    if (typewriterElement) type();

    // 2. Sticky Nav Scroll Effect
    const nav = document.querySelector('.sticky-nav');
    window.addEventListener('scroll', () => {
        if (nav) {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        }
    });

    // 3. Parallax Hero Aura
    const heroAura = document.querySelector('.hero-aura');
    if (heroAura) {
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 40;
            const y = (e.clientY / window.innerHeight - 0.5) * 40;
            heroAura.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        });
    }

    // 4. Form Handling (Mock)
    const forms = document.querySelectorAll('.email-form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button');
            if (btn) {
                btn.textContent = "SYNCHRONIZING...";
                btn.disabled = true;
                
                setTimeout(() => {
                    btn.textContent = "ACCESS REQUESTED";
                    btn.style.background = "var(--accent-green)";
                    form.reset();
                }, 1500);
            }
        });
    });

    // 5. Password Toggle Logic
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = toggle.querySelector('svg');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
                toggle.style.color = 'var(--accent-cyan)';
            } else {
                input.type = 'password';
                icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
                toggle.style.color = 'var(--text-muted)';
            }
        });
    });
});
