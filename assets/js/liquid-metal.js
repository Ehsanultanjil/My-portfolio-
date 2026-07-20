const UNIFORMS = {
    u_repetition: 4,
    u_softness: 0.5,
    u_shiftRed: 0.3,
    u_shiftBlue: 0.3,
    u_distortion: 0,
    u_contour: 0,
    u_angle: 45,
    u_scale: 8,
    // 0 = the shader's "full-fill on canvas" mode, covering the whole element regardless of
    // aspect ratio. The reference component's u_shape:1 ("circle") is a compact centered blob
    // tuned for a small square-ish button -- on the nav's much wider pill it only lit up a
    // patch near the center instead of the full bar.
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
    // Prepend in reverse so paint order (later DOM children paint on top) ends up
    // shader -> panel -> ripple-host -> the element's real content, all behind it.
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

// Mounting can fail for reasons entirely outside our control -- WebGL2 unavailable/blocklisted
// GPU, a dropped frame during context creation. Failing loudly here would leave the nav with
// its `.liquid-metal` class already applied (transparent background, cyan tint stripped) but
// no actual shader behind it -- i.e. invisible. So on any failure this rolls it all the way
// back to the original plain liquid-glass-refractive look instead.
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

// Dynamic import (not a static top-level `import`) so a CDN hiccup can't take the whole
// script down with it -- without this, if the fetch fails, NONE of the code below it would
// run either, and the failure is silent (module scripts don't surface import errors the way
// a normal script tag's parse error would).
import('https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.77/+esm')
    .then((lib) => {
        const nav = document.querySelector('nav.fixed.liquid-glass-refractive');
        if (nav) mount(nav, lib);
    })
    .catch((err) => {
        console.warn('[liquid-metal] shader library failed to load, nav keeps its plain glass look:', err);
    });
