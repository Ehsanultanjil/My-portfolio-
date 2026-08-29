(function () {
    if (document.documentElement.classList.contains('no-particles')) return;

    const container = document.getElementById('site-particles');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'block w-full h-full';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const PARTICLE_DENSITY = 0.00015;
    const BG_PARTICLE_DENSITY = 0.00005;
    const MOUSE_RADIUS = 160;
    const RETURN_SPEED = 0.08;
    const DAMPING = 0.9;
    const REPULSION_STRENGTH = 1.2;

    function getAccentRgb() {
        const hex = localStorage.getItem('site_accent_color') || '#00f0ff';
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { hex, r, g, b };
        }
        return { hex: '#00f0ff', r: 0, g: 240, b: 255 };
    }

    let particles = [];
    let bgParticles = [];
    // Mouse position is tracked in viewport coordinates since this is a
    // position:fixed, full-viewport canvas (not tied to page scroll).
    let mouse = { x: -1000, y: -1000, isActive: false };
    let frameId = null;
    let width = 0;
    let height = 0;

    function randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    function initParticles() {
        const particleCount = Math.floor(width * height * PARTICLE_DENSITY);
        const accent = getAccentRgb();
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            particles.push({
                x, y,
                originX: x, originY: y,
                vx: 0, vy: 0,
                size: randomRange(1, 2.5),
                color: Math.random() > 0.9 ? accent.hex : '#ffffff',
            });
        }

        const bgCount = Math.floor(width * height * BG_PARTICLE_DENSITY);
        bgParticles = [];
        for (let i = 0; i < bgCount; i++) {
            bgParticles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                size: randomRange(0.5, 1.5),
                alpha: randomRange(0.1, 0.4),
                phase: Math.random() * Math.PI * 2,
            });
        }
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        if (width === 0 || height === 0) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        // Reset transform before scaling so repeated resizes don't compound the DPR scale.
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        initParticles();
    }

    function animate(time) {
        ctx.clearRect(0, 0, width, height);

        // Pulsating radial glow
        const centerX = width / 2;
        const centerY = height / 2;
        const pulseOpacity = Math.sin(time * 0.0008) * 0.025 + 0.05;
        const accent = getAccentRgb();

        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, Math.max(width, height) * 0.7
        );
        gradient.addColorStop(0, `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${pulseOpacity})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Drifting background particles
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < bgParticles.length; i++) {
            const p = bgParticles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            const twinkle = Math.sin(time * 0.002 + p.phase) * 0.5 + 0.5;
            ctx.globalAlpha = p.alpha * (0.3 + 0.7 * twinkle);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Mouse repulsion + spring-back-to-origin forces
        const mouseRadiusSq = MOUSE_RADIUS * MOUSE_RADIUS;
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            if (mouse.isActive) {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < mouseRadiusSq && distSq > 0.01) {
                    const distance = Math.sqrt(distSq);
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
                    const repulsion = force * REPULSION_STRENGTH;
                    p.vx -= forceDirectionX * repulsion * 5;
                    p.vy -= forceDirectionY * repulsion * 5;
                }
            }

            p.vx += (p.originX - p.x) * RETURN_SPEED;
            p.vy += (p.originY - p.y) * RETURN_SPEED;

            // Integrate motion
            p.vx *= DAMPING;
            p.vy *= DAMPING;
            p.x += p.vx;
            p.y += p.vy;

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

            const velocity = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const opacity = Math.min(0.3 + velocity * 0.1, 1);

            ctx.fillStyle = p.color === '#ffffff'
                ? `rgba(255, 255, 255, ${opacity})`
                : accent.hex;
            ctx.fill();
        }

        frameId = requestAnimationFrame(animate);
    }

    // Listening on window (not the canvas/container) means the particle
    // layer still gets accurate cursor coordinates even though it sits
    // behind every other element in stacking order.
    window.addEventListener('mousemove', (e) => {
        mouse = { x: e.clientX, y: e.clientY, isActive: true };
    });

    document.addEventListener('mouseleave', () => {
        mouse.isActive = false;
    });

    window.addEventListener('resize', resize);
    resize();
    frameId = requestAnimationFrame(animate);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (frameId) {
                cancelAnimationFrame(frameId);
                frameId = null;
            }
        } else {
            if (!frameId) {
                frameId = requestAnimationFrame(animate);
            }
        }
    });

    window.addEventListener('beforeunload', () => {
        if (frameId) cancelAnimationFrame(frameId);
    });
})();
