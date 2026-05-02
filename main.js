/**
 * KRI // VIRTUAL_IDENTITY
 * Main JavaScript — Interactions & Animations
 */

/* ============================================================
   CUSTOM CURSOR
============================================================ */
const cursor = document.getElementById('custom-cursor');
const follower = document.getElementById('cursor-follower');

// Separate RAF-driven positions for smooth follower lag
let mouseX = -100, mouseY = -100;
let followerX = -100, followerY = -100;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Dot snaps immediately
    cursor.style.transform = `translate3d(${mouseX - 5}px, ${mouseY - 5}px, 0)`;

    // Orb parallax
    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 0.03;
        const dx = (window.innerWidth / 2 - mouseX) * speed;
        const dy = (window.innerHeight / 2 - mouseY) * speed;
        orb.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    });
});

// Follower trails with lerp in RAF
function lerpFollower() {
    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;
    follower.style.transform = `translate3d(${followerX - 20}px, ${followerY - 20}px, 0)`;
    requestAnimationFrame(lerpFollower);
}
lerpFollower();

/* ============================================================
   INTERACTIVE CURSOR — HOVER STATE
============================================================ */
document.querySelectorAll('a, button, .cyber-btn, .tech-tile').forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.style.width = '24px';
        cursor.style.height = '24px';
        cursor.style.mixBlendMode = 'difference';
        follower.style.width = '60px';
        follower.style.height = '60px';
        follower.style.borderColor = 'var(--neon-blue)';
    });
    el.addEventListener('mouseleave', () => {
        cursor.style.width = '10px';
        cursor.style.height = '10px';
        cursor.style.mixBlendMode = 'normal';
        follower.style.width = '40px';
        follower.style.height = '40px';
        follower.style.borderColor = 'var(--neon-purple)';
    });
});

/* ============================================================
   FLOATING ORBS — PARALLAX
============================================================ */
const orbs = document.querySelectorAll('.orb');

/* ============================================================
   3D TILT CARDS
============================================================ */
document.querySelectorAll('.tilt-card-container').forEach(container => {
    const card = container.querySelector('.tilt-card');

    container.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 15;
        const rotateY = -(x - centerX) / 15;

        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    });

    container.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
});

/* ============================================================
   MOBILE MENU TOGGLE
============================================================ */
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuBtn?.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('hidden') === false;
    mobileMenuBtn.setAttribute('aria-expanded', isOpen);
    const icon = mobileMenuBtn.querySelector('iconify-icon');
    if (icon) icon.setAttribute('icon', isOpen ? 'lucide:x' : 'lucide:menu');
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        const icon = mobileMenuBtn.querySelector('iconify-icon');
        if (icon) icon.setAttribute('icon', 'lucide:menu');
    });
});

/* ============================================================
   SCROLL-SPY — Highlight Active Nav Link
============================================================ */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

const observerOptions = {
    root: null,
    rootMargin: '-40% 0px -40% 0px',
    threshold: 0,
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => {
                link.classList.toggle(
                    'text-magenta-400',
                    link.getAttribute('href') === `#${entry.target.id}`
                );
            });
        }
    });
}, observerOptions);

sections.forEach(sec => sectionObserver.observe(sec));

/* ============================================================
   SCROLL REVEAL — Fade-in elements as they enter viewport
============================================================ */
const revealEls = document.querySelectorAll(
    '.tilt-card-container, .tech-tile, #proj-1, #proj-2, #proj-3'
);

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

revealEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(32px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    revealObserver.observe(el);
});

/* ============================================================
   TERMINAL READOUT — Animated typing effect
============================================================ */
const terminalLines = document.querySelectorAll(
    '.absolute.bottom-8.left-8.mono-font div'
);

function typewriterSequence(lines, delay = 800) {
    lines.forEach((line, i) => {
        const original = line.textContent;
        line.textContent = '';
        setTimeout(() => {
            let j = 0;
            const interval = setInterval(() => {
                line.textContent += original[j];
                j++;
                if (j >= original.length) clearInterval(interval);
            }, 35);
        }, i * delay);
    });
}

// Observe holographic panel and trigger typewriter
const holo = document.querySelector('.sticky');
if (holo) {
    const holoObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            typewriterSequence(terminalLines);
            holoObserver.disconnect();
        }
    }, { threshold: 0.5 });
    holoObserver.observe(holo);
}

/* ============================================================
   TEXT PRESSURE — Variable Font Proximity Effect
   Font axes used: wght (100–900), wdth (25–151), ital (0–1)
============================================================ */
(function initTextPressure() {
    const container = document.getElementById('text-pressure');
    if (!container) return;

    // Use the text content from the HTML as the source, or default to KRITIKA GHOSH
    const TEXT = container.textContent.trim() || 'KRITIKA GHOSH';

    /* ── Configuration ──────────────────────────────────────── */
    const MAX_DIST   = 280;   // px — influence radius
    const WGHT_MIN   = 200;   const WGHT_MAX  = 900;
    const WDTH_MIN   = 80;    const WDTH_MAX  = 151;
    const ITAL_MIN   = 0;     const ITAL_MAX  = 1;

    /* ── Build character spans ───────────────────────────────── */
    container.innerHTML = '';
    const charSpans = [];

    for (let i = 0; i < TEXT.length; i++) {
        const ch = TEXT[i];
        if (ch === ' ') {
            const sp = document.createElement('span');
            sp.className = 'pressure-char-space';
            sp.setAttribute('aria-hidden', 'true');
            container.appendChild(sp);
        } else {
            const span = document.createElement('span');
            span.className = 'pressure-char';
            span.textContent = ch;
            span.setAttribute('aria-hidden', 'true');
            container.appendChild(span);
            charSpans.push(span);
        }
    }

    /* ── Mouse tracking ──────────────────────────────────────── */
    let mx = -9999, my = -9999;
    let insideWindow = false;

    window.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        insideWindow = true;
    });

    window.addEventListener('mouseleave', () => {
        insideWindow = false;
    });

    /* ── Lerp helper ─────────────────────────────────────────── */
    function lerp(a, b, t) { return a + (b - a) * t; }

    /* ── Ease: inverse-square falloff for a punchy feel ───────── */
    function proximityToFactor(dist) {
        if (dist >= MAX_DIST) return 0;
        const t = 1 - dist / MAX_DIST;
        return t * t; 
    }

    /* ── RAF loop ────────────────────────────────────────────── */
    let currentWght = Array(charSpans.length).fill(WGHT_MIN);
    let currentWdth = Array(charSpans.length).fill(WDTH_MIN);
    let currentItal = Array(charSpans.length).fill(ITAL_MIN);
    const LERP_SPEED = 0.14;

    function updatePressure() {
        for (let i = 0; i < charSpans.length; i++) {
            const span = charSpans[i];
            const rect = span.getBoundingClientRect();

            const cx = rect.left + rect.width  / 2;
            const cy = rect.top  + rect.height / 2;

            const dx   = mx - cx;
            const dy   = my - cy;
            const dist = insideWindow ? Math.sqrt(dx * dx + dy * dy) : MAX_DIST;

            const factor = proximityToFactor(dist);

            const tWght = lerp(WGHT_MIN, WGHT_MAX, factor);
            const tWdth = lerp(WDTH_MIN, WDTH_MAX, factor);
            const tItal = lerp(ITAL_MIN, ITAL_MAX, factor);

            currentWght[i] += (tWght - currentWght[i]) * LERP_SPEED;
            currentWdth[i] += (tWdth - currentWdth[i]) * LERP_SPEED;
            currentItal[i] += (tItal - currentItal[i]) * LERP_SPEED;

            span.style.fontVariationSettings =
                `'wght' ${currentWght[i].toFixed(1)}, ` +
                `'wdth' ${currentWdth[i].toFixed(1)}, ` +
                `'ital' ${currentItal[i].toFixed(3)}`;

            if (factor > 0.6) {
                span.style.color = `hsl(${lerp(270, 300, factor)}, 100%, ${lerp(100, 80, factor)}%)`;
                span.style.textShadow =
                    `0 0 ${lerp(10, 40, factor).toFixed(0)}px rgba(217,70,239,${(factor * 0.8).toFixed(2)}),` +
                    `0 0 ${lerp(20, 80, factor).toFixed(0)}px rgba(168,85,247,${(factor * 0.4).toFixed(2)})`;
            } else {
                span.style.color = '';
                span.style.textShadow = '';
            }
        }

        requestAnimationFrame(updatePressure);
    }

    requestAnimationFrame(updatePressure);
})();
