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
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.getAttribute('href').slice(1);
        const idx = window.SceneNav ? window.SceneNav.indexOf(id) : -1;
        if (idx !== -1) window.SceneNav.goTo(idx);
        moveIndicator(e.target);
    });
});

nav.addEventListener('mouseleave', () => {
    hovering = false;
    moveIndicator(activeLink);
});

// Active link / indicator now track the current scene (assets/js/scene-nav.js) instead of
// page scroll position -- there's no page scroll left to spy on once scenes are transform-paged.
if (window.SceneNav) {
    window.SceneNav.onChange((_index, id) => {
        const link = links.find(l => l.getAttribute('href') === `#${id}`);
        if (!link) return; // Hero/Testimonials have no nav link -- leave the indicator where it was
        activeLink = link;
        setActiveLink(link);
        if (!hovering) moveIndicator(link);
    });
}

// Initialize
if (links.length > 0) {
    setActiveLink(activeLink);
    setTimeout(() => moveIndicator(activeLink), 100);
}
