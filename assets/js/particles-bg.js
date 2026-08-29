(function () {
    if (document.documentElement.classList.contains('no-particles')) return;

    const container = document.getElementById('site-particles');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'block w-full h-full';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

    // Balanced 120 FPS particle count
    const MAX_PARTICLES = 85;
    const MAX_BG_PARTICLES = 25;
    const MOUSE_RADIUS = 150;
    const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
    const RETURN_SPEED = 0.08;
    const DAMPING = 0.9;
    const REPULSION_STRENGTH = 1.2;

    // Cache accent color
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

    // Pre-rendered offscreen sprites for zero-trig, hardware-accelerated texture blitting
    let whiteStarSprite = createStarSprite(255, 255, 255);
    let accentStarSprite = createStarSprite(currentAccent.r, currentAccent.g, currentAccent.b);
    let bgStarSprite = createStarSprite(255, 255, 255, 0.6);

    function createStarSprite(r, g, b, alpha = 1) {
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = 16;
        spriteCanvas.height = 16;
        const sCtx = spriteCanvas.getContext('2d');
        const grad = sCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        grad.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        sCtx.fillStyle = grad;
        sCtx.fillRect(0, 0, 16, 16);
        return spriteCanvas;
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'site_accent_color' && e.newValue) {
            currentAccent = parseAccentColor(e.newValue);
            accentStarSprite = createStarSprite(currentAccent.r, currentAccent.g, currentAccent.b);
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
        const count = Math.min(Math.floor(width * height * 0.000065), MAX_PARTICLES);
        particles = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = randomRange(1.2, 2.5);
            particles.push({
                x, y,
                originX: x, originY: y,
                vx: 0, vy: 0,
                size,
                halfSize: size,
                isAccent: Math.random() > 0.88
            });
        }

        const bgCount = Math.min(Math.floor(width * height * 0.000022), MAX_BG_PARTICLES);
        bgParticles = [];
        for (let i = 0; i < bgCount; i++) {
            const size = randomRange(0.8, 1.8);
            bgParticles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                size,
                halfSize: size,
                alpha: randomRange(0.2, 0.5),
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        if (width === 0 || height === 0) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
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

        // 1. Drifting Background Twinkle Stars (Fast GPU Sprite Blit)
        for (let i = 0; i < bgParticles.length; i++) {
            const p = bgParticles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = width;
            else if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            else if (p.y > height) p.y = 0;

            const d = p.halfSize * 2;
            ctx.drawImage(bgStarSprite, p.x - p.halfSize, p.y - p.halfSize, d, d);
        }

        // 2. Interactive Repulsion + Spring Physics
        const hasMouse = mouse.isActive;
        const mx = mouse.x;
        const my = mouse.y;

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

            const sprite = p.isAccent ? accentStarSprite : whiteStarSprite;
            const d = p.halfSize * 2;
            ctx.drawImage(sprite, p.x - p.halfSize, p.y - p.halfSize, d, d);
        }

        frameId = requestAnimationFrame(animate);
    }

    // Passive pointer tracking
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
