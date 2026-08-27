(function () {
    const track = document.getElementById('scene-track');
    if (!track) return;

    // Visible scenes are re-queried live (not cached once) because Experience/Testimonials
    // toggle `.hidden` asynchronously once their Supabase data resolves -- flex layout auto-
    // compacts hidden children, so recomputing indices from the live list keeps translateX
    // math correct without any extra bookkeeping.
    function getScenes() {
        return [...track.querySelectorAll(':scope > .scene')].filter((el) => !el.classList.contains('hidden'));
    }

    function indexOf(id) {
        return getScenes().findIndex((s) => s.id === id);
    }

    // Desktop: the original horizontal transform-paging engine, unchanged. Mobile: native
    // vertical document scroll instead, with window.SceneNav swapped for a lighter
    // IntersectionObserver-backed implementation of the exact same API (goTo/next/prev/
    // current/indexOf/onChange/onBeforeChange) -- every consumer (nav.js's active-link
    // tracking, the footer back-to-top button, scene-animations.js's entrance animations)
    // keeps working unchanged, since they only ever talk to window.SceneNav, never to the
    // transform/scroll mechanics directly.
    //
    // The mode is decided once at load, not hot-swapped live on resize: crossing this
    // breakpoint means switching between two fundamentally different navigation engines, and
    // real devices don't resize across 1024px mid-session (that's a desktop-devtools-testing
    // scenario, not real usage). If it does happen, reload rather than trying to live-migrate
    // scroll position between "scrollLeft via transform" and "native scrollTop".
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    desktopQuery.addEventListener('change', () => window.location.reload());

    if (desktopQuery.matches) {
        initDesktop();
    } else {
        initMobile();
    }

    function initDesktop() {
        let currentId = getScenes()[0] ? getScenes()[0].id : null;
        let isAnimating = false;
        const listeners = [];
        const beforeListeners = [];

        // The 3D coverflow carousel uses arrows/dots/click/keyboard for navigation,
        // so wheel events over .work-panel fall through to scene-change as normal.

        // The whole strip of scenes is one flex row inside #scene-track, so "current slides left"
        // and "next slides in from right" are literally the same translateX -- a single GSAP tween
        // moving the track is exactly a perfect, unbreakable cross-transition: there's no way for
        // one half to run ahead of or wait on the other, because it's one motion, not two.
        function goTo(target) {
            const scenes = getScenes();
            const currentIndex = scenes.findIndex((s) => s.id === currentId);
            const targetIndex = typeof target === 'number' ? target : scenes.findIndex((s) => s.id === target);

            if (isAnimating || targetIndex < 0 || targetIndex >= scenes.length || targetIndex === currentIndex) return;

            isAnimating = true;
            const direction = targetIndex > currentIndex ? 'next' : 'prev';
            const targetId = scenes[targetIndex].id;

            // Fired synchronously, before the slide's first frame paints -- lets
            // assets/js/scene-animations.js instantly hide the incoming scene's content so it
            // stays invisible while it slides into view, instead of arriving fully visible and
            // only then resetting itself to play the entrance animation (which reads as "I saw
            // the content, then it flashed and popped in again"). The staggered heading/text/
            // cards/buttons reveal only starts once onComplete below fires, i.e. after the scene
            // is fully centered -- never mid-slide.
            beforeListeners.forEach((cb) => cb(targetIndex, targetId, direction));

            const endX = -targetIndex * window.innerWidth;

            function finish() {
                currentId = targetId;
                isAnimating = false; // scroll stays locked (onWheel checks this) until exactly this point
                listeners.forEach((cb) => cb(targetIndex, currentId, direction));
            }

            if (typeof gsap === 'undefined') {
                // GSAP failed to load (e.g. CDN unreachable) -- snap instantly rather than leave
                // navigation completely broken.
                track.style.transform = `translateX(${endX}px)`;
                finish();
                return;
            }

            gsap.to(track, {
                x: endX,
                duration: 0.8, // 700-900ms range
                ease: 'power3.inOut',
                onComplete: finish,
            });
        }

        function next() {
            const scenes = getScenes();
            goTo(scenes.findIndex((s) => s.id === currentId) + 1);
        }
        function prev() {
            goTo(getScenes().findIndex((s) => s.id === currentId) - 1);
        }

        // Nested-scroll passthrough: if the wheel is over a vertically-scrollable region inside the
        // active scene that isn't at its edge yet, let that scroll happen instead of paging -- only
        // once it's exhausted does the wheel gesture fall through to a scene change (same
        // reconciliation fullpage.js-style libraries use). This is for scenes whose content genuinely
        // overflows 100vh (About/Skills/Experience with enough admin-added items) -- it's a deferred
        // handoff, unlike the project carousel's hard gate above, because there's no separate "leave
        // this area" signal for a region that's just part of the scene's normal vertical flow.
        function findScrollableAncestorY(el, root) {
            while (el && el !== document.body && el !== document.documentElement) {
                const style = getComputedStyle(el);
                const canScrollY = (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1;
                if (canScrollY) return el;
                if (el === root) break; // .scene itself is the outermost candidate -- don't walk past it
                el = el.parentElement;
            }
            return null;
        }

        function onWheel(e) {
            if (isAnimating) {
                e.preventDefault();
                return;
            }



            const scenes = getScenes();
            const activeScene = scenes.find((s) => s.id === currentId);
            const scrollable = activeScene ? findScrollableAncestorY(e.target, activeScene) : null;

            if (scrollable) {
                const goingDown = e.deltaY > 0;
                const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;
                const atTop = scrollable.scrollTop <= 1;
                if ((goingDown && !atBottom) || (!goingDown && !atTop)) {
                    // Driven explicitly (same pattern as the project carousel above) rather than
                    // left to the browser's raw wheel-scroll default, which jumps scrollTop
                    // instantly per tick with no easing -- .scene has scroll-behavior:smooth, so
                    // this animates the same way the carousel's scrollLeft does.
                    e.preventDefault();
                    scrollable.scrollTop += e.deltaY;
                    return;
                }
            }

            e.preventDefault();
            if (e.deltaY > 0) next();
            else if (e.deltaY < 0) prev();
        }
        window.addEventListener('wheel', onWheel, { passive: false });

        // Touch: a vertical swipe drives the scene change, mirroring the desktop "vertical input"
        // metaphor 1:1 rather than the horizontal direction scenes visually move in. (Desktop-mode
        // only -- a touch-capable desktop/laptop still pages this way; phones/tablets run
        // initMobile() instead and never register these.)
        let touchStartY = null;
        window.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        window.addEventListener('touchend', (e) => {
            if (touchStartY == null || isAnimating) { touchStartY = null; return; }
            const dy = touchStartY - e.changedTouches[0].clientY;
            touchStartY = null;
            if (Math.abs(dy) < 50) return;
            if (dy > 0) next();
            else prev();
        }, { passive: true });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); next(); }
            else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); prev(); }
        });

        // Snap (no animation) to the current scene's correct pixel offset after a viewport resize,
        // since the transform math is in px, not vw.
        window.addEventListener('resize', () => {
            const idx = indexOf(currentId);
            if (idx >= 0 && !isAnimating) track.style.transform = `translateX(${-idx * window.innerWidth}px)`;
        });

        window.SceneNav = {
            goTo,
            next,
            prev,
            current: () => currentId,
            indexOf,
            onChange: (cb) => listeners.push(cb),
            onBeforeChange: (cb) => beforeListeners.push(cb),
        };

        const initIdx = indexOf(currentId);
        if (initIdx > 0) track.style.transform = `translateX(${-initIdx * window.innerWidth}px)`;
    }

    function initMobile() {
        let currentId = getScenes()[0] ? getScenes()[0].id : null;
        const listeners = [];
        const beforeListeners = []; // kept for API parity -- natural scroll has no discrete
                                     // "about to change" moment distinct from onChange, so this
                                     // never actually fires on mobile.
        const seen = new Set();

        function goTo(target) {
            const scenes = getScenes();
            const targetIndex = typeof target === 'number' ? target : scenes.findIndex((s) => s.id === target);
            if (targetIndex < 0 || targetIndex >= scenes.length) return;
            scenes[targetIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        function next() { goTo(indexOf(currentId) + 1); }
        function prev() { goTo(indexOf(currentId) - 1); }

        // Deliberately not IntersectionObserver: a fast fling, or scrollIntoView jumping several
        // sections at once, can move the viewport past a section entirely between two observed
        // frames -- its visibility window is never sampled, so it never fires *any* threshold,
        // leaving its entrance animation (assets/js/scene-animations.js, gated on onChange
        // firing at least once per id) permanently stuck hidden. Checking every scene's actual
        // position on each scroll tick instead can't skip anything, since it compares current
        // geometry rather than relying on catching a transient crossing.
        function check() {
            const scenes = track.querySelectorAll(':scope > .scene');
            let closestId = null;
            let closestDistance = Infinity;

            scenes.forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.height === 0) return; // class="hidden" (Experience/Testimonials pre-data)

                // Pre-reveal approaching sections 350px before entering the viewport,
                // so during fast continuous scrolling, elements are already smoothly painted.
                if (rect.top < window.innerHeight + 350 && !seen.has(el.id)) {
                    seen.add(el.id);
                    listeners.forEach((cb) => cb(indexOf(el.id), el.id, 'next'));
                }

                const distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestId = el.id;
                }
            });

            if (closestId) currentId = closestId;
        }

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => { check(); ticking = false; });
        }, { passive: true });

        // Deferred to the window 'load' event rather than called synchronously here: this runs
        // inside scene-nav.js, a separate, earlier <script> than scene-animations.js (which
        // depends on the GSAP CDN <script> loading first). A requestAnimationFrame here isn't
        // late enough -- the browser can paint a frame (firing it) while still blocked on that
        // GSAP fetch, before scene-animations.js has even registered its onChange listener, so
        // whatever's already in view (Hero, and on a tall enough phone, About too) gets marked
        // "seen" with nothing listening, silently losing its reveal forever. 'load' is
        // guaranteed to fire only after every blocking script has finished executing.
        window.addEventListener('load', check);

        window.SceneNav = {
            goTo,
            next,
            prev,
            current: () => currentId,
            indexOf,
            onChange: (cb) => listeners.push(cb),
            onBeforeChange: (cb) => beforeListeners.push(cb),
        };
    }
})();
