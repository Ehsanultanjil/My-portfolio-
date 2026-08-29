const glow = document.querySelector('.ambient-glow');
if (glow) {
    let mouseX = 50;
    let mouseY = 50;
    let rafId = null;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 100;
        mouseY = (e.clientY / window.innerHeight) * 100;
        if (!rafId) {
            rafId = requestAnimationFrame(() => {
                glow.style.setProperty('--x', `${mouseX}%`);
                glow.style.setProperty('--y', `${mouseY}%`);
                rafId = null;
            });
        }
    }, { passive: true });
}
