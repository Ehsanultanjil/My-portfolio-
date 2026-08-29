(function () {
    const glow = document.querySelector('.ambient-glow');
    if (!glow) return;

    if (localStorage.getItem('cursor_light_enabled') === 'false') {
        glow.style.display = 'none';
        return;
    }

    const radius = 160;
    let mouseX = -1000;
    let mouseY = -1000;
    let rafId = null;

    function renderGlow() {
        // Direct, instantaneous 120 FPS cursor tracking with 0ms lag
        glow.style.transform = `translate3d(${mouseX - radius}px, ${mouseY - radius}px, 0)`;
        rafId = null;
    }

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!rafId) {
            rafId = requestAnimationFrame(renderGlow);
        }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        glow.style.opacity = '0';
    }, { passive: true });

    document.addEventListener('mouseenter', () => {
        glow.style.opacity = '1';
    }, { passive: true });
})();
