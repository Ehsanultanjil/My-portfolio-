(function () {
    const glow = document.querySelector('.ambient-glow');
    if (!glow) return;

    if (localStorage.getItem('cursor_light_enabled') === 'false') {
        glow.style.display = 'none';
        return;
    }

    const radius = 300;
    let targetX = -1000;
    let targetY = -1000;
    let currentX = -1000;
    let currentY = -1000;
    let rafId = null;

    function renderGlow() {
        // 120 FPS direct GPU translation -- zero CPU rasterization
        currentX += (targetX - currentX) * 0.45;
        currentY += (targetY - currentY) * 0.45;
        glow.style.transform = `translate3d(${currentX - radius}px, ${currentY - radius}px, 0)`;

        if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
            rafId = requestAnimationFrame(renderGlow);
        } else {
            rafId = null;
        }
    }

    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        if (currentX === -1000) {
            currentX = targetX;
            currentY = targetY;
        }
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
