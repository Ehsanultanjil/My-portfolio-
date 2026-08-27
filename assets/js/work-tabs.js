const workTabs = document.querySelectorAll('.work-tab');
const workPanels = document.querySelectorAll('.work-panel');

let switching = false;

workTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        const nextPanel = [...workPanels].find(p => p.dataset.panel === target);
        const activePanel = [...workPanels].find(p => !p.classList.contains('hidden'));

        if (switching || !nextPanel || activePanel === nextPanel) return;
        switching = true;

        workTabs.forEach(t => {
            const active = t === tab;
            t.classList.toggle('bg-primary-container', active);
            t.classList.toggle('text-on-primary-container', active);
            t.classList.toggle('text-on-surface-variant', !active);
        });

        activePanel.classList.add('opacity-0');

        setTimeout(() => {
            activePanel.classList.add('hidden');
            nextPanel.classList.remove('hidden');
            nextPanel.classList.add('opacity-0');

            // Force a reflow so the browser registers the starting state
            // before the opacity change below is animated.
            void nextPanel.offsetWidth;

            nextPanel.classList.remove('opacity-0');
            switching = false;
        }, 300);
    });
});


// Arrow navigation for the old horizontal card rail has been removed --
// the 3D coverflow carousel (render-content.js) includes its own prev/next
// arrows, pagination dots, keyboard, and touch-swipe handlers.
