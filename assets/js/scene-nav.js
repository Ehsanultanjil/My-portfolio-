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

    let currentId = getScenes()[0] ? getScenes()[0].id : null;
    let isAnimating = false;
    const listeners = [];
    const beforeListeners = [];

    // While the cursor is over the Work section's project carousel, the wheel controls it
    // exclusively -- full-page navigation is suspended entirely (not just deferred-until-the-
    // carousel-is-exhausted), so scrolling aggressively to reach the last project can never
    // accidentally page away from Work. Restored the instant the cursor leaves.
    let isInteractingWithProjects = false;
    document.querySelectorAll('.work-panel').forEach((panel) => {
        panel.addEventListener('mouseenter', () => { isInteractingWithProjects = true; });
        panel.addEventListener('mouseleave', () => { isInteractingWithProjects = false; });
    });

    function indexOf(id) {
        return getScenes().findIndex((s) => s.id === id);
    }

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

        if (isInteractingWithProjects) {
            e.preventDefault();
            const rail = document.querySelector('.work-panel:not(.hidden) [id$="-list"]');
            if (rail) rail.scrollLeft += (e.deltaX || e.deltaY); // trackpad horizontal swipes send deltaX; wheel/vertical swipes send deltaY
            return; // never falls through to page navigation while the cursor is over the carousel
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
    // metaphor 1:1 rather than the horizontal direction scenes visually move in.
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
})();
