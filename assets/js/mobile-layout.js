(function () {
    // Desktop keeps #floating-chips as fixed viewport chrome (see index.html/styles.css) --
    // this only runs the relocation on mobile, and only once at load (matching scene-nav.js's
    // own once-at-load mode decision, not hot-swapped on resize).
    if (window.matchMedia('(min-width: 1024px)').matches) return;

    const chips = document.getElementById('floating-chips');
    const heroPhotoBlock = document.querySelector('#hero .hero-anim.group');
    if (chips && heroPhotoBlock) {
        // Moves the existing element (not a clone) -- it's automatically removed from its old
        // spot before nav/scene-viewport, so assets/js/render-content.js's renderMarquee()
        // keeps working unchanged, it just fills in content wherever this div currently lives.
        heroPhotoBlock.insertAdjacentElement('afterend', chips);
    }
})();
