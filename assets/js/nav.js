const nav = document.querySelector('nav.fixed.liquid-glass-refractive');
const indicator = document.getElementById('nav-indicator');
const links = [...document.getElementById('nav-links').querySelectorAll('a')];

function moveIndicator(target) {
    const rect = target.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    indicator.style.width = `${rect.width}px`;
    indicator.style.left = `${rect.left - navRect.left}px`;
    indicator.style.opacity = '1';
}

function setActiveLink(target) {
    links.forEach(link => {
        link.classList.remove('text-primary', 'font-bold');
        link.classList.add('text-on-surface/70');
    });
    target.classList.remove('text-on-surface/70');
    target.classList.add('text-primary', 'font-bold');
}

let activeLink = links[0];
let hovering = false;

links.forEach(link => {
    link.addEventListener('mouseenter', (e) => {
        hovering = true;
        moveIndicator(e.target);
    });
    link.addEventListener('click', (e) => moveIndicator(e.target));
});

nav.addEventListener('mouseleave', () => {
    hovering = false;
    moveIndicator(activeLink);
});

// Scroll spy: keep the indicator and active link in sync with the section in view
const sections = links
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

if (sections.length > 0) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const link = links.find(l => l.getAttribute('href') === `#${entry.target.id}`);
            if (!link) return;
            activeLink = link;
            setActiveLink(link);
            if (!hovering) moveIndicator(link);
        });
    }, { rootMargin: '-100px 0px -80% 0px' });

    sections.forEach(section => observer.observe(section));
}

// Fallback for the last section: if it's short enough that the page can't
// scroll it up into the trigger band above, fall back to "scrolled to the
// bottom of the page" instead.
window.addEventListener('scroll', () => {
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (!atBottom) return;
    const lastLink = links[links.length - 1];
    if (activeLink !== lastLink) {
        activeLink = lastLink;
        setActiveLink(lastLink);
    }
    if (!hovering) moveIndicator(lastLink);
}, { passive: true });

// Initialize
if (links.length > 0) {
    setActiveLink(activeLink);
    setTimeout(() => moveIndicator(activeLink), 100);
}
