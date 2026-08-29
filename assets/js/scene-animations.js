(function () {
    if (!window.SceneNav || typeof gsap === 'undefined') return;

    // Cards/buttons/links across the site carry their own CSS `transition` (.liquid-glass-
    // interactive's `transition: all 0.4s`, Tailwind's `transition-transform`, etc.) for their
    // hover states. That transition fights GSAP's per-frame inline writes on the same property
    // during an entrance tween -- .gsap-animating{transition:none!important} suspends it for the
    // duration of the tween only, so hover behavior is untouched the rest of the time.
    function suspendTransitions(targets) {
        const list = [...targets];
        list.forEach((t) => t.classList.add('gsap-animating'));
        return () => list.forEach((t) => t.classList.remove('gsap-animating'));
    }

    // Entrance animations run in two phases, wired to the two hooks scene-nav.js exposes:
    //
    //   1. hide  -- SceneNav.onBeforeChange, fires the instant a transition starts, BEFORE the
    //      slide's first frame paints. Instantly (gsap.set, no tween) puts the incoming scene's
    //      content into its "entrance" state.
    //   2. reveal -- SceneNav.onChange, fires once the ~800ms slide completes. Animates from
    //      that pre-hidden state to normal.
    //
    // Without the split, content has nothing hiding it while the scene slides into view (it's
    // just sitting at its normal, fully-visible state), so the user sees it arrive fully formed
    // and only THEN watches it reset and replay the entrance -- reads as "I already saw it, then
    // it flashed and popped in again". Hiding it before the slide starts means the incoming scene
    // is invisible for the whole slide and only reveals itself once it has arrived.
    function hideSet(el, selector, vars) {
        const targets = el.querySelectorAll(selector);
        if (!targets.length) return;
        gsap.killTweensOf(targets);
        gsap.set(targets, vars);
    }
    const isMobileViewport = !window.matchMedia('(min-width: 1024px)').matches;

    function revealTo(el, selector, vars) {
        const targets = el.querySelectorAll(selector);
        if (!targets.length) return;
        gsap.killTweensOf(targets);
        const clear = suspendTransitions(targets);
        const defaultDuration = isMobileViewport ? 0.35 : 0.6;
        const defaultStagger = isMobileViewport ? 0.04 : 0.08;
        gsap.to(targets, Object.assign({ duration: defaultDuration, stagger: defaultStagger, ease: 'power2.out', force3D: true, onComplete: clear, onInterrupt: clear }, vars));
    }

    const NEUTRAL = { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 };

    const SCENES = {
        hero: {
            hide: (el) => hideSet(el, '.hero-anim', { opacity: 0, scale: 0.92 }),
            reveal: (el) => revealTo(el, '.hero-anim', NEUTRAL),
        },

        // The separate .education-anim branch here (a scale + rotate settling the orbital ring
        // into place, guarded on offsetParent so it was skipped while the ring was still hidden
        // waiting on data) went with the ring itself. The details list that replaced it carries
        // .about-anim, so it rides the same staggered slide-in as the heading and intro text.
        about: {
            hide: (el) => hideSet(el, '.about-anim', { opacity: 0, x: -40 }),
            reveal: (el) => revealTo(el, '.about-anim', Object.assign({ stagger: 0.1 }, NEUTRAL)),
        },

        work: {
            hide: (el) => hideSet(el, '.work-anim, #projects-list > *, #community-list > *', { opacity: 0, y: 24 }),
            reveal: (el) => revealTo(el, '.work-anim, #projects-list > *, #community-list > *', Object.assign({ stagger: 0.06 }, NEUTRAL)),
        },

        skills: {
            hide: (el) => hideSet(el, '.skills-anim, #skills-list > *', { opacity: 0, y: 32 }),
            reveal: (el) => revealTo(el, '.skills-anim, #skills-list > *', Object.assign({ stagger: 0.05 }, NEUTRAL)),
        },

        experience: {
            hide: (el) => {
                hideSet(el, '.experience-anim', { opacity: 0, y: 20 });
                hideSet(el, '.experience-line', { scaleY: 0 });
                hideSet(el, '.experience-card', { opacity: 0, y: 30 });
            },
            reveal: (el) => {
                revealTo(el, '.experience-anim', NEUTRAL);

                const line = el.querySelector('.experience-line');
                const cards = el.querySelectorAll('.experience-card');
                const tl = gsap.timeline();
                if (line) {
                    gsap.killTweensOf(line);
                    const clear = suspendTransitions([line]);
                    tl.to(line, { scaleY: 1, duration: 0.6, ease: 'power2.out', onComplete: clear, onInterrupt: clear });
                }
                if (cards.length) {
                    gsap.killTweensOf(cards);
                    const clear = suspendTransitions(cards);
                    tl.to(cards, { opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: 'power2.out', onComplete: clear, onInterrupt: clear }, line ? '-=0.2' : 0);
                }
            },
        },

        testimonials: {
            hide: (el) => hideSet(el, '.testimonials-anim, #testimonials-list', { opacity: 0, x: 24 }),
            reveal: (el) => revealTo(el, '.testimonials-anim, #testimonials-list', Object.assign({ stagger: 0.1 }, NEUTRAL)),
        },

        contact: {
            hide: (el) => hideSet(el, '.contact-anim', { opacity: 0, y: 24 }),
            reveal: (el) => revealTo(el, '.contact-anim', NEUTRAL),
        },
    };

    if (window.matchMedia('(min-width: 1024px)').matches) {
        window.SceneNav.onBeforeChange((_index, id) => {
            const el = document.getElementById(id);
            if (el && SCENES[id]) SCENES[id].hide(el);
        });

        window.SceneNav.onChange((_index, id) => {
            const el = document.getElementById(id);
            if (el && SCENES[id]) SCENES[id].reveal(el);

            // Pause whichever scene-owned timer (orbit auto-rotate, testimonial autoplay) was
            // running for the scene we just left, and resume the one for the scene we just entered
            // -- avoids every scene's animation timers running forever in the background.
            if (window.SceneTimers) window.SceneTimers.setActive(id);
        });

        // The very first scene on page load never goes through a real SceneNav transition (there's
        // nothing to slide in from), so onBeforeChange/onChange above never fire for it -- without
        // this, Hero would just appear instantly instead of getting its fade+scale entrance. A short
        // fixed delay (rather than trying to sync with the preloader's variable/toggleable timing)
        // keeps this simple: if the preloader is showing, this plays invisibly behind it, harmlessly.
        const initialId = window.SceneNav.current();
        const initialEl = document.getElementById(initialId);
        if (initialEl && SCENES[initialId]) {
            SCENES[initialId].hide(initialEl);
            setTimeout(() => SCENES[initialId].reveal(initialEl), 200);
        }
    } else {
        // Mobile: native continuous vertical scrolling runs directly on GPU compositor at 60-120fps.
        // Elements stay visible immediately with zero scroll-blocking JS calculations.
        window.SceneNav.onChange((_index, id) => {
            if (window.SceneTimers) window.SceneTimers.setActive(id);
        });
    }

    // ---- Floating skill chips: hover particle burst (glow/scale are pure CSS, see styles.css) ----
    const BURST_COLORS = ['#00f0ff', '#ffffff'];
    function burst(chip) {
        const rect = chip.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
            const dist = 18 + Math.random() * 14;
            const p = document.createElement('span');
            p.className = 'chip-burst-particle';
            p.style.left = `${originX}px`;
            p.style.top = `${originY}px`;
            p.style.background = BURST_COLORS[i % BURST_COLORS.length];
            p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
            p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
            document.body.appendChild(p);
            p.addEventListener('animationend', () => p.remove());
        }
    }
    document.addEventListener('mouseenter', (e) => {
        if (e.target.classList && e.target.classList.contains('marquee-chip')) burst(e.target);
    }, true);
})();
