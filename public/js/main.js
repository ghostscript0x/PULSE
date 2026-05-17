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
});
