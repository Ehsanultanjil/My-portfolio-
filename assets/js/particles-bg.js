(function () {
    if (document.documentElement.classList.contains('no-particles')) return;

    const container = document.getElementById('site-particles');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'block w-full h-full';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

    // Efficient particle counts -- provides identical full-screen aesthetics without GPU fill-rate exhaustion
    const MAX_PARTICLES = 95;
    const MAX_BG_PARTICLES = 30;
    const MOUSE_RADIUS = 150;
    const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
    const RETURN_SPEED = 0.08;
    const DAMPING = 0.88;
    const REPULSION_STRENGTH = 1.1;

    // Cache accent color once instead of reading localStorage 60 times per second
    let currentAccent = parseAccentColor(localStorage.getItem('site_accent_color') || '#00f0ff');

    function parseAccentColor(hex) {
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            return {
                hex,
                r: parseInt(hex.slice(1, 3), 16),
                g: parseInt(hex.slice(3, 5), 16),
                b: parseInt(hex.slice(5, 7), 16)
            };
        }
        return { hex: '#00f0ff', r: 0, g: 240, b: 255 };
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'site_accent_color' && e.newValue) {
            currentAccent = parseAccentColor(e.newValue);
        }
    });

    let particles = [];
    let bgParticles = [];
    let mouse = { x: -2000, y: -2000, isActive: false };
    let frameId = null;
    let width = 0;
    let height = 0;

    function randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    function initParticles() {
        const count = Math.min(Math.floor(width * height * 0.00007), MAX_PARTICLES);
        particles = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            particles.push({
                x, y,
                originX: x, originY: y,
                vx: 0, vy: 0,
                size: randomRange(1, 2.2),
                isAccent: Math.random() > 0.88
            });
        }

        const bgCount = Math.min(Math.floor(width * height * 0.000025), MAX_BG_PARTICLES);
        bgParticles = [];
        for (let i = 0; i < bgCount; i++) {
            bgParticles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                size: randomRange(0.6, 1.4),
                alpha: randomRange(0.12, 0.38),
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        if (width === 0 || height === 0) return;

        // Cap DPR at 1.5 to prevent massive 4K fill-rate bottlenecks on Retina screens
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        initParticles();
    }

    function animate(time) {
        ctx.clearRect(0, 0, width, height);

        // Pulsating center radial aura
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        const pulseOpacity = (Math.sin(time * 0.0008) * 0.025 + 0.05).toFixed(4);

        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, Math.max(width, height) * 0.65
        );
        gradient.addColorStop(0, `rgba(${currentAccent.r}, ${currentAccent.g}, ${currentAccent.b}, ${pulseOpacity})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 1. Drifting Twinkle Stars (Single-Path Batched Draw)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (let i = 0; i < bgParticles.length; i++) {
            const p = bgParticles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = width;
            else if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            else if (p.y > height) p.y = 0;

            const twinkle = Math.sin(time * 0.002 + p.phase) * 0.5 + 0.5;
            const starAlpha = p.alpha * (0.3 + 0.7 * twinkle);
            
            // Draw circle in batch path
            ctx.moveTo(p.x + p.size, p.y);
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // 2. Interactive Repulsion + Spring Physics
        const hasMouse = mouse.isActive;
        const mx = mouse.x;
        const my = mouse.y;

        // Separate particle indices for batched white vs accent drawing
        ctx.beginPath();
        let hasWhite = false;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            if (hasMouse) {
                const dx = mx - p.x;
                const dy = my - p.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < MOUSE_RADIUS_SQ && distSq > 0.01) {
                    const distance = Math.sqrt(distSq);
                    const force = ((MOUSE_RADIUS - distance) / MOUSE_RADIUS) * REPULSION_STRENGTH * 5;
                    p.vx -= (dx / distance) * force;
                    p.vy -= (dy / distance) * force;
                }
            }

            p.vx = (p.vx + (p.originX - p.x) * RETURN_SPEED) * DAMPING;
            p.vy = (p.vy + (p.originY - p.y) * RETURN_SPEED) * DAMPING;
            p.x += p.vx;
            p.y += p.vy;

            if (!p.isAccent) {
                ctx.moveTo(p.x + p.size, p.y);
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                hasWhite = true;
            }
        }

        if (hasWhite) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.fill();
        }

        // 3. Batched Accent Particles Draw
        ctx.beginPath();
        let hasAccent = false;
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            if (p.isAccent) {
                ctx.moveTo(p.x + p.size, p.y);
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                hasAccent = true;
            }
        }
        if (hasAccent) {
            ctx.fillStyle = currentAccent.hex;
            ctx.fill();
        }

        frameId = requestAnimationFrame(animate);
    }

    // Passive, non-blocking pointer tracking
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.isActive = true;
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        mouse.isActive = false;
    }, { passive: true });

    window.addEventListener('resize', resize, { passive: true });
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
