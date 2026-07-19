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

// Arrow navigation for whichever project rail (Engineering/Community) is currently visible.
const workArrowPrev = document.querySelector('.work-arrow-prev');
const workArrowNext = document.querySelector('.work-arrow-next');

function activeCardList() {
    const panel = [...workPanels].find(p => !p.classList.contains('hidden'));
    return panel ? panel.querySelector('[id$="-list"]') : null;
}

function scrollActiveList(direction) {
    const list = activeCardList();
    if (!list) return;
    const card = list.querySelector(':scope > *');
    const step = card ? card.getBoundingClientRect().width + 24 : list.clientWidth * 0.8; // 24px = gap-6
    list.scrollBy({ left: direction * step, behavior: 'smooth' });
}

if (workArrowPrev) workArrowPrev.addEventListener('click', () => scrollActiveList(-1));
if (workArrowNext) workArrowNext.addEventListener('click', () => scrollActiveList(1));
