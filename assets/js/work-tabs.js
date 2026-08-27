(function () {
    const tabsContainer = document.getElementById('work-tabs');
    const workTabs = document.querySelectorAll('.work-tab');
    const workPanels = document.querySelectorAll('.work-panel');
    if (!tabsContainer || !workTabs.length) return;

    // Create sliding glider pill
    let glider = tabsContainer.querySelector('.tab-glider');
    if (!glider) {
        glider = document.createElement('div');
        glider.className = 'tab-glider';
        tabsContainer.insertBefore(glider, tabsContainer.firstChild);
    }

    function updateGlider(activeTab, animated = true) {
        if (!activeTab) return;
        if (!animated) {
            glider.style.transition = 'none';
        } else {
            glider.style.transition = 'transform 450ms cubic-bezier(0.25, 1, 0.5, 1), width 450ms cubic-bezier(0.25, 1, 0.5, 1)';
        }
        const offsetLeft = activeTab.offsetLeft;
        const width = activeTab.offsetWidth;
        glider.style.width = `${width}px`;
        glider.style.transform = `translateX(${offsetLeft}px)`;
        if (!animated) {
            requestAnimationFrame(() => {
                glider.style.transition = '';
            });
        }
    }

    let switching = false;

    function selectTab(tab, animated = true) {
        const target = tab.dataset.tab;
        const nextPanel = [...workPanels].find(p => p.dataset.panel === target);
        const activePanel = [...workPanels].find(p => !p.classList.contains('hidden'));

        workTabs.forEach(t => {
            const active = t === tab;
            t.classList.remove('bg-primary-container');
            t.classList.toggle('text-on-primary-container', active);
            t.classList.toggle('text-on-surface-variant', !active);
        });

        updateGlider(tab, animated);

        if (!nextPanel || activePanel === nextPanel) return;
        if (switching) return;
        switching = true;

        if (activePanel) {
            activePanel.style.transition = 'opacity 220ms ease, transform 220ms ease';
            activePanel.style.opacity = '0';
            activePanel.style.transform = 'scale(0.98)';
        }

        setTimeout(() => {
            if (activePanel) {
                activePanel.classList.add('hidden');
                activePanel.style.transform = '';
            }
            nextPanel.classList.remove('hidden');
            nextPanel.style.opacity = '0';
            nextPanel.style.transform = 'scale(0.98)';
            nextPanel.style.transition = 'opacity 280ms cubic-bezier(0.25, 1, 0.5, 1), transform 280ms cubic-bezier(0.25, 1, 0.5, 1)';

            void nextPanel.offsetWidth;
            nextPanel.style.opacity = '1';
            nextPanel.style.transform = 'scale(1)';
            switching = false;
        }, 200);
    }

    workTabs.forEach(tab => {
        tab.addEventListener('click', () => selectTab(tab, true));
    });

    // Position glider immediately on load
    const initialActive = tabsContainer.querySelector('.work-tab.bg-primary-container') || workTabs[0];
    selectTab(initialActive, false);

    window.addEventListener('resize', () => {
        const active = tabsContainer.querySelector('.work-tab.text-on-primary-container') || workTabs[0];
        updateGlider(active, false);
    });
})();
