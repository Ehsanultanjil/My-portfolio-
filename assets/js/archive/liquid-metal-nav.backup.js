/**
 * ARCHIVE BACKUP: Liquid Metal WebGL Navigation Shader
 * 
 * This file contains the complete, working Liquid Metal WebGL Shader navigation
 * component (powered by @paper-design/shaders).
 * 
 * HOW TO RESTORE IN THE FUTURE:
 * 1. Add back to index.html before </body>:
 *    <script type="module" src="assets/js/archive/liquid-metal-nav.backup.js"></script>
 * 
 * 2. Ensure CSS classes .liquid-metal, .liquid-metal-shader, .liquid-metal-panel,
 *    and .liquid-metal-ripple-host are in styles.css.
 */

const UNIFORMS = {
    u_repetition: 4,
    u_softness: 0.5,
    u_shiftRed: 0.3,
    u_shiftBlue: 0.3,
    u_distortion: 0,
    u_contour: 0,
    u_angle: 45,
    u_scale: 8,
    u_shape: 0,
    u_offsetX: 0.1,
    u_offsetY: -0.1,
};

function buildLayers(el) {
    const rippleHost = document.createElement('div');
    rippleHost.className = 'liquid-metal-ripple-host';
    const panel = document.createElement('div');
    panel.className = 'liquid-metal-panel';
    const shader = document.createElement('div');
    shader.className = 'liquid-metal-shader';
    el.prepend(rippleHost);
    el.prepend(panel);
    el.prepend(shader);
    return { shader, panel, rippleHost };
}

function wireInteractions(el, mount, rippleHost) {
    let hovered = false;

    el.addEventListener('mouseenter', () => {
        hovered = true;
        mount.setSpeed?.(1);
    });
    el.addEventListener('mouseleave', () => {
        hovered = false;
        el.classList.remove('is-pressed');
        mount.setSpeed?.(0.6);
    });
    el.addEventListener('mousedown', () => el.classList.add('is-pressed'));
    el.addEventListener('mouseup', () => el.classList.remove('is-pressed'));

    el.addEventListener('click', (e) => {
        mount.setSpeed?.(2.4);
        setTimeout(() => mount.setSpeed?.(hovered ? 1 : 0.6), 300);

        const rect = el.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'liquid-metal-ripple';
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        rippleHost.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
}

function mount(el, lib) {
    el.classList.add('liquid-metal');
    const { shader, panel, rippleHost } = buildLayers(el);
    try {
        const shaderMount = new lib.ShaderMount(shader, lib.liquidMetalFragmentShader, UNIFORMS, undefined, 0.6);
        wireInteractions(el, shaderMount, rippleHost);
    } catch (err) {
        console.warn('[liquid-metal] shader mount failed, falling back to plain glass look:', err);
        shader.remove();
        panel.remove();
        rippleHost.remove();
        el.classList.remove('liquid-metal');
    }
}

if (window.innerWidth >= 768) {
    import('https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.77/+esm')
        .then((lib) => {
            const nav = document.querySelector('nav.fixed.liquid-glass-refractive');
            if (nav) mount(nav, lib);
        })
        .catch((err) => {
            console.warn('[liquid-metal] shader library failed to load, nav keeps its plain glass look:', err);
        });
}
