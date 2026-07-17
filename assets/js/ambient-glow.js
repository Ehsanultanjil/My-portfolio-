const glow = document.querySelector('.ambient-glow');
window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    glow.style.setProperty('--x', `${x}%`);
    glow.style.setProperty('--y', `${y}%`);
});
