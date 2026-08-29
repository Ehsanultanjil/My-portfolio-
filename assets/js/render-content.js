(function () {
    // Used whenever Supabase isn't configured yet, or a fetch fails -- keeps
    // the public site looking correct (matches what was previously hardcoded)
    // instead of showing an empty section.
    const FALLBACK_ENGINEERING = [
        { title: 'Project Title', description: 'Short project description goes here.', tag: 'COMING SOON', link_url: null, image_url: null },
        { title: 'Project Title', description: 'Short project description goes here.', tag: 'COMING SOON', link_url: null, image_url: null },
        { title: 'Project Title', description: 'Short project description goes here.', tag: 'COMING SOON', link_url: null, image_url: null },
    ];

    const FALLBACK_COMMUNITY = [
        { title: 'Moderation & Safety', description: 'Keeping Telegram communities safe, active, and spam-free with hands-on, responsive moderation.', tag: '', link_url: 'https://www.fiverr.com/rafikhand1', image_url: null },
        { title: 'Member Engagement', description: 'Growing engagement and retention through active, day-to-day community management.', tag: '', link_url: 'https://www.fiverr.com/rafikhand1', image_url: null },
        { title: 'Client Support', description: 'Fiverr Level 2 Seller with 65+ reviews and a 4.9★ rating for reliable, responsive service.', tag: '', link_url: 'https://www.fiverr.com/rafikhand1', image_url: null },
    ];

    const FALLBACK_SKILLS = [
        { category: 'Development', icon: 'code', names: ['Claude', 'ChatGPT', 'Cursor', 'React.js', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'Git & GitHub'] },
        { category: 'Design', icon: 'palette', names: ['Figma', 'Adobe Photoshop', 'UI/UX Design'] },
        { category: 'Video Editing', icon: 'movie', names: ['Premiere Pro', 'After Effects'] },
        { category: 'Community & Client Work', icon: 'groups', names: ['Telegram Moderation', 'Community Management', 'Fiverr Freelancing'] },
    ];

    const FALLBACK_SOCIAL = [
        { label: 'GitHub', url: '#', visible: true },
        { label: 'LinkedIn', url: '#', visible: true },
        { label: 'Fiverr', url: 'https://www.fiverr.com/rafikhand1', visible: true },
    ];

    let activeSiteContent = {};

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str == null ? '' : String(str);
        return div.innerHTML;
    }

    // Lets scene-owned animation timers (orbit auto-rotate, testimonial autoplay) pause
    // themselves while their scene isn't the one on screen, instead of running forever in the
    // background. assets/js/scene-animations.js calls setActive(id) on every scene change.
    window.SceneTimers = (function () {
        const registry = {};
        let activeId = window.SceneNav ? window.SceneNav.current() : null;
        return {
            register(sceneId, handlers) {
                registry[sceneId] = handlers;
                if (sceneId === activeId) handlers.resume();
            },
            setActive(sceneId) {
                if (activeId && registry[activeId] && activeId !== sceneId) registry[activeId].pause();
                activeId = sceneId;
                if (registry[sceneId]) registry[sceneId].resume();
            },
        };
    })();

    // ==================== 3D Coverflow Carousel ====================
    // Converted from a React component to vanilla JS. Each call creates an independent
    // carousel instance with its own state, autoplay timer, and event listeners.

    // Inline SVG icons (zero external dependencies, matching the React original)
    const CHEVRON_LEFT_SVG = '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>';
    const CHEVRON_RIGHT_SVG = '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>';
    const ARROW_RIGHT_SVG = '<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>';

    // 3D position presets: [translateX, scale, rotateY, opacity, zIndex, brightness, blur]
    // Designed for 5-card visible range (center + 2 each side) that fit comfortably within viewport.
    function getCoverflowTransform(offset, total) {
        const o = ((offset % total) + total) % total;
        if (o === 0)         return { tx: 0,    s: 1,    ry: 0,   op: 1,    z: 30, br: 1,    bl: 0 };
        if (o === 1)         return { tx: 235,  s: 0.84, ry: -24, op: 0.65, z: 20, br: 0.75, bl: 0 };
        if (o === 2)         return { tx: 420,  s: 0.68, ry: -38, op: 0.35, z: 10, br: 0.55, bl: 0 };
        if (o === total - 1) return { tx: -235, s: 0.84, ry: 24,  op: 0.65, z: 20, br: 0.75, bl: 0 };
        if (o === total - 2) return { tx: -420, s: 0.68, ry: 38,  op: 0.35, z: 10, br: 0.55, bl: 0 };
        return { tx: 0, s: 0.4, ry: 0, op: 0, z: 0, br: 0.4, bl: 0 };
    }

    // Mobile-adjusted offsets
    function getCoverflowTransformMobile(offset, total) {
        const o = ((offset % total) + total) % total;
        if (o === 0)         return { tx: 0,    s: 1,    ry: 0,   op: 1,    z: 30, br: 1,    bl: 0 };
        if (o === 1)         return { tx: 145,  s: 0.82, ry: -18, op: 0.6,  z: 20, br: 0.75, bl: 0 };
        if (o === 2)         return { tx: 250,  s: 0.65, ry: -28, op: 0.3,  z: 10, br: 0.55, bl: 0 };
        if (o === total - 1) return { tx: -145, s: 0.82, ry: 18,  op: 0.6,  z: 20, br: 0.75, bl: 0 };
        if (o === total - 2) return { tx: -250, s: 0.65, ry: 28,  op: 0.3,  z: 10, br: 0.55, bl: 0 };
        return { tx: 0, s: 0.4, ry: 0, op: 0, z: 0, br: 0.4, bl: 0 };
    }

    function isMobile() { return window.innerWidth < 640; }

    function renderCoverflow(containerId, items) {
        const container = document.getElementById(containerId);
        if (!container || !items || items.length === 0) return;

        const total = items.length;
        let currentIndex = 0;
        let hovered = false;
        let autoplayTimer = null;
        let touchStartX = 0;

        // ---------- Build DOM ----------
        const wrap = document.createElement('div');
        wrap.className = 'coverflow-wrap';

        // Ambient background removed — cards sit on the site's own background.

        // 3D stage
        const stage = document.createElement('div');
        stage.className = 'coverflow-stage';

        // Build each card
        const cards = items.map((item, idx) => {
            const card = document.createElement('div');
            card.className = 'coverflow-card';
            card.dataset.idx = idx;

            // Image or placeholder
            if (item.image_url) {
                const img = document.createElement('img');
                img.className = 'coverflow-card-img';
                img.src = item.image_url;
                img.alt = item.title || '';
                img.loading = 'lazy';
                card.appendChild(img);
            } else {
                const ph = document.createElement('div');
                ph.className = 'coverflow-card-placeholder';
                ph.innerHTML = '<span class="material-symbols-outlined">image</span>';
                card.appendChild(ph);
            }

            // Gradient overlay
            const grad = document.createElement('div');
            grad.className = 'coverflow-card-gradient';
            card.appendChild(grad);

            // Content overlay
            const content = document.createElement('div');
            content.className = 'coverflow-card-content';

            // Tag (top-right)
            const tagDiv = document.createElement('div');
            tagDiv.style.textAlign = 'right';
            tagDiv.style.width = '100%';
            if (item.tag) {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'coverflow-card-tag';
                tagSpan.textContent = item.tag;
                tagDiv.appendChild(tagSpan);
            }
            content.appendChild(tagDiv);

            // Body (bottom section)
            const body = document.createElement('div');
            body.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;margin-top:auto;padding-bottom:4px;';

            // Title
            const title = document.createElement('h3');
            title.className = 'coverflow-card-title';
            title.textContent = item.title || '';
            body.appendChild(title);

            // Divider
            const divider = document.createElement('div');
            divider.className = 'coverflow-card-divider';
            body.appendChild(divider);

            // Description
            if (item.description) {
                const desc = document.createElement('p');
                desc.className = 'coverflow-card-desc';
                desc.textContent = item.description;
                body.appendChild(desc);
            }

            // CTA buttons
            const actions = document.createElement('div');
            actions.className = 'coverflow-card-actions';

            if (item.link_url) {
                const cta = document.createElement('a');
                cta.href = item.link_url;
                cta.target = '_blank';
                cta.rel = 'noopener noreferrer';
                cta.className = 'coverflow-cta';
                cta.innerHTML = '<span>View Project</span>' + ARROW_RIGHT_SVG;
                actions.appendChild(cta);
            }
            if (item.github_url) {
                const gh = document.createElement('a');
                gh.href = item.github_url;
                gh.target = '_blank';
                gh.rel = 'noopener noreferrer';
                gh.className = 'coverflow-cta-github';
                gh.innerHTML = '<i class="fa-brands fa-github"></i>';
                gh.setAttribute('aria-label', 'View source on GitHub');
                actions.appendChild(gh);
            }
            // If no links at all, show a muted icon
            if (!item.link_url && !item.github_url) {
                const muted = document.createElement('div');
                muted.style.cssText = 'width:36px;height:36px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:rgba(185,202,203,0.35);';
                muted.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px">open_in_new</span>';
                actions.appendChild(muted);
            }

            body.appendChild(actions);
            content.appendChild(body);
            card.appendChild(content);

            // Click side cards to navigate
            card.addEventListener('click', () => {
                if (idx !== currentIndex) goTo(idx);
            });

            stage.appendChild(card);
            return card;
        });

        wrap.appendChild(stage);

        // Nav arrows
        const prevBtn = document.createElement('button');
        prevBtn.className = 'coverflow-arrow coverflow-arrow-prev';
        prevBtn.setAttribute('aria-label', 'Previous');
        prevBtn.innerHTML = CHEVRON_LEFT_SVG;
        prevBtn.addEventListener('click', prev);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'coverflow-arrow coverflow-arrow-next';
        nextBtn.setAttribute('aria-label', 'Next');
        nextBtn.innerHTML = CHEVRON_RIGHT_SVG;
        nextBtn.addEventListener('click', next);

        stage.appendChild(prevBtn);
        stage.appendChild(nextBtn);

        // Pagination dots
        const dotsWrap = document.createElement('div');
        dotsWrap.className = 'coverflow-dots';
        const dots = items.map((_, idx) => {
            const dot = document.createElement('button');
            dot.className = 'coverflow-dot';
            dot.setAttribute('aria-label', 'Go to slide ' + (idx + 1));
            dot.addEventListener('click', () => goTo(idx));
            dotsWrap.appendChild(dot);
            return dot;
        });
        wrap.appendChild(dotsWrap);

        // Mount
        container.innerHTML = '';
        container.appendChild(wrap);

        // ---------- State management ----------
        function update() {
            const getT = isMobile() ? getCoverflowTransformMobile : getCoverflowTransform;
            cards.forEach((card, idx) => {
                const offset = idx - currentIndex;
                const t = getT(offset, total);
                const isCenter = (offset % total + total) % total === 0;

                card.style.transform = `translateX(${t.tx}px) scale(${t.s}) rotateY(${t.ry}deg)`;
                card.style.opacity = t.op;
                card.style.zIndex = t.z;

                if (isCenter) {
                    card.classList.add('is-center');
                    card.style.filter = 'none';
                } else {
                    card.classList.remove('is-center');
                    card.style.filter = t.bl ? `brightness(${t.br}) blur(${t.bl}px)` : (t.br < 1 ? `brightness(${t.br})` : 'none');
                }
            });



            // Update dots
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === currentIndex);
            });
        }

        function next() { currentIndex = (currentIndex + 1) % total; update(); }
        function prev() { currentIndex = (currentIndex - 1 + total) % total; update(); }
        function goTo(idx) { currentIndex = idx % total; update(); }

        // ---------- Autoplay ----------
        function startAutoplay() {
            stopAutoplay();
            if (total <= 1) return;
            autoplayTimer = setInterval(() => {
                if (!hovered) next();
            }, 5000);
        }
        function stopAutoplay() {
            if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
        }

        wrap.addEventListener('mouseenter', () => { hovered = true; });
        wrap.addEventListener('mouseleave', () => { hovered = false; });

        // ---------- Touch swipe ----------
        wrap.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        wrap.addEventListener('touchend', (e) => {
            const diff = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(diff) > 45) {
                if (diff < 0) next(); else prev();
            }
        }, { passive: true });

        // ---------- Keyboard (only when this panel is visible) ----------
        function handleKey(e) {
            // Only respond if this coverflow's panel is visible
            const panel = container.closest('.work-panel');
            if (panel && panel.classList.contains('hidden')) return;
            if (e.key === 'ArrowLeft') { prev(); e.preventDefault(); }
            if (e.key === 'ArrowRight') { next(); e.preventDefault(); }
        }
        window.addEventListener('keydown', handleKey);

        // ---------- Responsive resize ----------
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(update, 150);
        });

        // ---------- Init ----------
        update();
        startAutoplay();

        // Pause autoplay when the work scene isn't active (via SceneTimers)
        // The carousel registers itself once; SceneTimers handles pause/resume.
        if (window.SceneTimers && !window._coverflowSceneRegistered) {
            window._coverflowSceneRegistered = true;
            window.SceneTimers.register('work', {
                resume() { startAutoplay(); },
                pause() { stopAutoplay(); },
            });
        }
    }

    // The floating marquee pulls every skill name across all categories (not
    // just one group) so the loop is long and varied instead of visibly
    // repeating every few seconds. Both halves get identical content -- that
    // duplication is what makes the CSS animation loop seamlessly.
    // Categories are otherwise ordered alphabetically (see the Supabase query
    // below), which buried the recognizable tech-stack names under
    // "Community & Client Work" / "Design". Lead with Development instead so
    // the familiar names show up immediately, not partway through the loop.
    const MARQUEE_CATEGORY_PRIORITY = ['Development', 'Design', 'Video Editing', 'Community & Client Work'];

    function renderMarquee(groups) {
        const set1 = document.getElementById('marquee-set-1');
        const set2 = document.getElementById('marquee-set-2');
        if (!set1 || !set2) return;

        const ordered = [...groups].sort((a, b) => {
            const ai = MARQUEE_CATEGORY_PRIORITY.indexOf(a.category);
            const bi = MARQUEE_CATEGORY_PRIORITY.indexOf(b.category);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        });

        const allNames = ordered.flatMap((g) => g.names);
        // Slimmer than the original px-8 py-3 / 16px text, which made each pill about 48px tall
        // and gave the band more visual weight than a background detail wants. Note this also
        // slows the drift on its own: the marquee animation covers a fixed -50% of the track in
        // a fixed time, so a narrower track is fewer pixels per second even before the duration
        const pillsHtml = allNames.map((n) => `<div class="marquee-chip px-5 py-1.5 flex items-center gap-2 rounded-full">
<span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span class="font-body-sm text-body-sm">${escapeHtml(n)}</span>
</div>`).join('');

        set1.innerHTML = pillsHtml;
        set2.innerHTML = pillsHtml;
    }

    function renderSkills(groups) {
        const container = document.getElementById('skills-list');
        if (!container) return;

        container.innerHTML = groups.map((g, i) => `<div class="skill-card liquid-glass-refractive liquid-glass-interactive p-3.5 sm:p-5 lg:p-5 rounded-2xl sm:rounded-3xl h-full flex flex-col" style="will-change: transform; animation-delay: ${(i % 4) * 0.15}s;">
<div class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-primary-container/10 flex items-center justify-center mb-2 sm:mb-3">
<span class="material-symbols-outlined text-primary-container text-lg sm:text-2xl">${escapeHtml(g.icon)}</span>
</div>
<h3 class="font-headline-lg text-sm sm:text-base font-bold mb-2 sm:mb-2.5">${escapeHtml(g.category)}</h3>
<div class="flex flex-wrap gap-1 sm:gap-1.5 content-start">
${g.names.map((n) => `<span class="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/5 text-on-surface-variant text-[10px] sm:text-xs">${escapeHtml(n)}</span>`).join('')}
</div>
</div>`).join('');
    }

    // The row of category filter pills that used to sit above this grid ("All" plus one per
    // category, fading non-matching cards out in place) is gone, along with the #skills-filter
    // container in index.html, the data-category attribute the cards carried for it to match
    // on, and the .skill-card-hidden class in styles.css that did the fading. Every category is
    // always shown now.

    // Flat skill rows (one per skill, sharing a category+icon) grouped into
    // { category, icon, names[] } for rendering.
    function groupSkills(rows) {
        const grouped = [];
        const byCategory = {};
        rows.forEach((row) => {
            if (!byCategory[row.category]) {
                byCategory[row.category] = { category: row.category, icon: row.icon, names: [] };
                grouped.push(byCategory[row.category]);
            }
            byCategory[row.category].names.push(row.name);
        });
        return grouped;
    }

    async function loadFromSupabase() {
        const client = window.supabaseClient;
        if (!client) return null;

        try {
            const [{ data: projects, error: pErr }, { data: skills, error: sErr }] = await Promise.all([
                client.from('projects').select('*').order('sort_order', { ascending: true }),
                client.from('skills').select('*').order('category', { ascending: true }).order('sort_order', { ascending: true }),
            ]);

            if (pErr || sErr || !projects || !skills || projects.length === 0 || skills.length === 0) {
                return null;
            }

            const visibleProjects = projects.filter((p) => p.visible !== false);
            const engineering = visibleProjects.filter((p) => p.section !== 'community');
            const community = visibleProjects.filter((p) => p.section === 'community');

            return { engineering, community, skills: groupSkills(skills) };
        } catch (e) {
            return null;
        }
    }

    // ---------- Site-wide editable text (hero, headings, contact, footer) ----------
    // Every entry here is optional: if the site_content table isn't migrated yet,
    // or a given key was never set, the hardcoded text already in the HTML stays
    // as the fallback -- nothing is overwritten with blanks.
    const SITE_CONTENT_TARGETS = {
        hero_badge: { selector: '#hero-badge', mode: 'text' },
        hero_heading: { selector: '#hero-heading', mode: 'text' },
        hero_heading_highlight: { selector: '#hero-heading-highlight', mode: 'text' },
        hero_bio: { selector: '#hero-bio', mode: 'text' },
        hero_button_text: { selector: '#hero-button-text', mode: 'text' },
        // #hero-cta-link intentionally excluded -- it's a fixed link to apps.html now (the
        // "browse my apps" button), not admin-configurable through this shared CTA-link
        // setting anymore. Only the nav "Hire Me" pill still follows it.
        primary_cta_link: { selector: '#nav-hire-link', mode: 'href' },
        hire_button_image_url: { selector: '#nav-hire-link', mode: 'image' },
        resume_url: { selector: '#hero-resume-link', mode: 'resume' },
        hero_photo_url: { selector: '#hero-photo-img', mode: 'src' },
        about_eyebrow: { selector: '#about-eyebrow', mode: 'text' },
        about_heading: { selector: '#about-heading', mode: 'text' },
        about_text: { selector: '#about-text', mode: 'text' },
        work_heading: { selector: '#work-heading', mode: 'text' },
        skills_eyebrow: { selector: '#skills-eyebrow', mode: 'text' },
        skills_heading: { selector: '#skills-heading', mode: 'text' },
        skills_heading_highlight: { selector: '#skills-heading-highlight', mode: 'text' },
        experience_heading: { selector: '#experience-heading', mode: 'text' },
        testimonials_heading: { selector: '#testimonials-heading', mode: 'text' },
        contact_heading: { selector: '#contact-heading', mode: 'text' },
        contact_text: { selector: '#contact-text', mode: 'text' },
        contact_email: { selector: '#contact-email-link', mode: 'email' },
        footer_name: { selector: '#footer-name', mode: 'text' },
        footer_copyright: { selector: '#footer-copyright', mode: 'text' },
    };

    function applySiteContent(rows) {
        if (!rows || !rows.length) return;
        const byKey = {};
        rows.forEach((r) => { byKey[r.key] = r.value; });

        Object.entries(SITE_CONTENT_TARGETS).forEach(([key, target]) => {
            const value = byKey[key];
            if (value == null || value === '') return;
            document.querySelectorAll(target.selector).forEach((el) => {
                if (target.mode === 'text') el.textContent = value;
                else if (target.mode === 'href') el.setAttribute('href', value);
                else if (target.mode === 'email') {
                    el.setAttribute('href', `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(value)}`);
                    el.setAttribute('target', '_blank');
                    el.setAttribute('rel', 'noopener noreferrer');
                    const textEl = el.querySelector('#contact-email-text');
                    if (textEl) textEl.textContent = value;
                } else if (target.mode === 'resume') {
                    el.setAttribute('href', value);
                    el.setAttribute('target', '_blank');
                    el.setAttribute('rel', 'noopener noreferrer');
                } else if (target.mode === 'image') {
                    el.classList.remove('px-3', 'sm:px-6', 'py-1.5', 'sm:py-2', 'whitespace-nowrap');
                    el.classList.add('overflow-hidden', 'p-0', 'w-20', 'h-8', 'sm:w-28', 'sm:h-9');
                    el.innerHTML = `<img src="${escapeHtml(value)}" alt="Hire Me" class="w-full h-full object-cover">`;
                } else if (target.mode === 'src') {
                    el.setAttribute('src', value);
                }
            });
        });
    }

    function applyAccentColor(hex) {
        if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
        localStorage.setItem('site_accent_color', hex);
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        document.documentElement.style.setProperty('--color-primary-container', hex);
        document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);

        let styleEl = document.getElementById('dynamic-accent-theme');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'dynamic-accent-theme';
            document.head.appendChild(styleEl);
        }

        styleEl.textContent = `
            :root {
                --primary-container: ${hex} !important;
                --primary-fixed-dim: ${hex} !important;
                --primary-accent: ${hex} !important;
                --accent-rgb: ${r}, ${g}, ${b} !important;
            }
            .text-primary-container, .text-primary {
                color: ${hex} !important;
            }
            .bg-primary-container {
                background-color: ${hex} !important;
            }
            .border-primary-container, .border-primary-container\\/30, .border-primary-container\\/40 {
                border-color: rgba(${r}, ${g}, ${b}, 0.4) !important;
            }
            .liquid-glass-refractive {
                border-color: rgba(${r}, ${g}, ${b}, 0.2) !important;
            }
            .liquid-glass-refractive:hover, .liquid-glass-interactive:hover {
                border-color: rgba(${r}, ${g}, ${b}, 0.5) !important;
                box-shadow: 0 0 25px rgba(${r}, ${g}, ${b}, 0.25) !important;
            }
            .ambient-glow {
                background: radial-gradient(circle at center, rgba(${r}, ${g}, ${b}, 0.16) 0%, transparent 65%) !important;
            }
            #hero-glow {
                background-color: rgba(${r}, ${g}, ${b}, 0.35) !important;
            }
            /* Tab Glider Pill & Toggle Buttons */
            .tab-glider {
                background: ${hex} !important;
                box-shadow: 0 0 20px rgba(${r}, ${g}, ${b}, 0.5), 0 4px 12px rgba(0, 0, 0, 0.5) !important;
            }
            .work-tab.text-on-primary-container, .testimonial-tab.text-on-primary-container {
                color: #000000 !important;
                font-weight: 800 !important;
            }
            .toggle-switch input:checked + .toggle-track {
                background: rgba(${r}, ${g}, ${b}, 0.6) !important;
                border-color: rgba(${r}, ${g}, ${b}, 0.85) !important;
                box-shadow: 0 0 10px rgba(${r}, ${g}, ${b}, 0.5) !important;
            }
            #nav-indicator {
                background: rgba(${r}, ${g}, ${b}, 0.25) !important;
                border-color: rgba(${r}, ${g}, ${b}, 0.5) !important;
                box-shadow: 0 0 15px rgba(${r}, ${g}, ${b}, 0.25) !important;
            }
            /* Project Coverflow */
            .coverflow-card {
                border-color: rgba(${r}, ${g}, ${b}, 0.22) !important;
            }
            .coverflow-card.is-center {
                border-color: rgba(${r}, ${g}, ${b}, 0.6) !important;
                box-shadow: 0 20px 50px rgba(0,0,0,0.85), 0 0 35px rgba(${r}, ${g}, ${b}, 0.28), 0 0 1px 1px rgba(${r}, ${g}, ${b}, 0.3) !important;
            }
            .coverflow-card-tag {
                color: ${hex} !important;
            }
            .coverflow-card-divider {
                background: ${hex} !important;
                box-shadow: 0 0 10px rgba(${r}, ${g}, ${b}, 0.7) !important;
            }
            .coverflow-cta {
                background: linear-gradient(135deg, ${hex} 0%, rgba(${r}, ${g}, ${b}, 0.75) 100%) !important;
                color: #000000 !important;
                box-shadow: 0 4px 14px rgba(0,0,0,0.4), 0 0 18px rgba(${r}, ${g}, ${b}, 0.4) !important;
            }
            .coverflow-cta:hover {
                box-shadow: 0 6px 20px rgba(0,0,0,0.5), 0 0 25px rgba(${r}, ${g}, ${b}, 0.6) !important;
            }
            .coverflow-cta-github {
                border-color: rgba(${r}, ${g}, ${b}, 0.4) !important;
                color: ${hex} !important;
                background: rgba(${r}, ${g}, ${b}, 0.1) !important;
            }
            .coverflow-cta-github:hover {
                background: rgba(${r}, ${g}, ${b}, 0.25) !important;
            }
            .coverflow-arrow {
                border-color: rgba(${r}, ${g}, ${b}, 0.3) !important;
            }
            .coverflow-arrow:hover {
                background: rgba(${r}, ${g}, ${b}, 0.18) !important;
                border-color: rgba(${r}, ${g}, ${b}, 0.6) !important;
                box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 14px rgba(${r}, ${g}, ${b}, 0.3) !important;
            }
            .coverflow-dot.active {
                background: ${hex} !important;
                box-shadow: 0 0 12px rgba(${r}, ${g}, ${b}, 0.7) !important;
            }
            .coverflow-card-placeholder {
                background: linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.08) 0%, rgba(0,0,0,0.3) 100%) !important;
            }
            /* Experience */
            .elastic-card {
                border-color: rgba(${r}, ${g}, ${b}, 0.2) !important;
            }
            .elastic-card:hover {
                border-color: rgba(${r}, ${g}, ${b}, 0.4) !important;
            }
            .elastic-card.is-active {
                border-color: rgba(${r}, ${g}, ${b}, 0.7) !important;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 35px rgba(${r}, ${g}, ${b}, 0.3), 0 0 1px 1px rgba(${r}, ${g}, ${b}, 0.3) !important;
            }
            .elastic-card-org {
                color: ${hex} !important;
            }
            .elastic-card-tag, .elastic-card-cta {
                background: rgba(${r}, ${g}, ${b}, 0.15) !important;
                border-color: rgba(${r}, ${g}, ${b}, 0.4) !important;
                color: ${hex} !important;
            }
            .elastic-card-cta:hover {
                background: rgba(${r}, ${g}, ${b}, 0.3) !important;
            }
            /* Testimonials */
            .testimonial-coverflow-card {
                border-color: rgba(${r}, ${g}, ${b}, 0.22) !important;
            }
            .testimonial-coverflow-card.is-center {
                border-color: rgba(${r}, ${g}, ${b}, 0.6) !important;
                box-shadow: 0 20px 50px rgba(0,0,0,0.85), 0 0 35px rgba(${r}, ${g}, ${b}, 0.28) !important;
            }
            .testimonial-coverflow-arrow {
                border-color: rgba(${r}, ${g}, ${b}, 0.3) !important;
            }
            .testimonial-coverflow-arrow:hover {
                background: rgba(${r}, ${g}, ${b}, 0.18) !important;
                border-color: rgba(${r}, ${g}, ${b}, 0.6) !important;
            }
            .testimonial-coverflow-dot.active {
                background: ${hex} !important;
                box-shadow: 0 0 12px rgba(${r}, ${g}, ${b}, 0.7) !important;
            }
            /* Skills */
            .skill-card {
                border-color: rgba(${r}, ${g}, ${b}, 0.18) !important;
            }
            .skill-card:hover {
                border-color: rgba(${r}, ${g}, ${b}, 0.5) !important;
                box-shadow: 0 0 25px rgba(${r}, ${g}, ${b}, 0.2) !important;
            }
            .floating-chip {
                border-color: rgba(${r}, ${g}, ${b}, 0.3) !important;
            }
            .floating-chip:hover {
                border-color: rgba(${r}, ${g}, ${b}, 0.6) !important;
                box-shadow: 0 0 15px rgba(${r}, ${g}, ${b}, 0.25) !important;
            }
        `;
    }

    // Settings that don't map cleanly onto a single "find element(s), set an
    // attribute" rule -- document head tags, feature toggles, the nav logo
    // slot, and the maintenance overlay. All optional/no-op if unset.
    function applySiteExtras(byKey, bgVideos) {
        if (byKey.accent_color) applyAccentColor(byKey.accent_color);

        if (byKey.seo_title) document.title = byKey.seo_title;

        if (byKey.seo_description) {
            let meta = document.querySelector('meta[name="description"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('name', 'description');
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', byKey.seo_description);
        }

        if (byKey.favicon_url) {
            let link = document.querySelector('link[rel="icon"]');
            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', 'icon');
                document.head.appendChild(link);
            }
            link.setAttribute('href', byKey.favicon_url);
        }

        if (byKey.logo_url) {
            const logo = document.getElementById('nav-logo');
            if (logo) {
                logo.src = byKey.logo_url;
                logo.classList.remove('hidden');
            }
        }

        if (byKey.hero_bg_image_url) {
            const layer = document.getElementById('hero-bg-layer');
            if (layer) {
                layer.style.backgroundImage = `url('${byKey.hero_bg_image_url}')`;
                layer.classList.remove('hidden');
            }
        }

        if (byKey.hero_glow_enabled === 'false') {
            const glow = document.getElementById('hero-glow');
            if (glow) glow.style.display = 'none';
        }

        // Cached so the next load can skip starting particles-bg.js's canvas + animation loop
        // entirely, synchronously, before this setting is even fetched again (see the inline
        // script at the top of index.html's <body>) -- without it, particles always render
        // for a beat regardless of this setting, since it can only ever be cleared after this
        // async fetch resolves.
        localStorage.setItem('particles_enabled', byKey.particles_enabled === 'false' ? 'false' : 'true');

        if (byKey.particles_enabled === 'false') {
            const particles = document.getElementById('site-particles');
            if (particles) particles.innerHTML = '';
        }

        // Custom background (video, image, or default particles)
        localStorage.setItem('video_bg_enabled', byKey.video_bg_enabled === 'true' ? 'true' : 'false');

        const videoBg = document.getElementById('site-video-bg');
        const imageBg = document.getElementById('site-image-bg');
        const videoEl = document.getElementById('site-video-el');
        const imageEl = document.getElementById('site-image-el');
        const particlesEl = document.getElementById('site-particles');
        const switcher = document.getElementById('hero-bg-video-switcher');

        // Build complete list of available background options
        const allOptions = [
            { id: 'particles', title: 'Default (Particles)', type: 'particles' }
        ];

        const visibleVideos = (bgVideos || []).filter((v) => v.visible !== false && v.video_url);
        if (!visibleVideos.length && byKey.video_bg_url) {
            visibleVideos.push({ id: 'default-video', title: 'Default Video', video_url: byKey.video_bg_url });
        }

        visibleVideos.forEach((v) => {
            allOptions.push({ id: String(v.id), title: v.title, type: 'video', video_url: v.video_url });
        });

        if (byKey.bg_image_url) {
            allOptions.push({ id: 'custom-image', title: 'Background Image', type: 'image', image_url: byKey.bg_image_url });
        }

        if (allOptions.length > 1) {
            // Determine active background option:
            // 1. User's saved preference in localStorage (if valid)
            // 2. Otherwise: if admin toggle is ON -> first custom video/image; if toggle is OFF -> 'particles' (default)
            const savedId = localStorage.getItem('active_bg_video_id');
            let activeOption = allOptions.find((o) => o.id === String(savedId));

            if (!activeOption) {
                if (byKey.video_bg_enabled === 'true' && allOptions.length > 1) {
                    activeOption = allOptions[1]; // First custom video/image
                } else {
                    activeOption = allOptions[0]; // Default particles
                }
            }

            function applyBackground(opt) {
                if (opt.type === 'video' && opt.video_url && videoBg && videoEl) {
                    videoEl.src = opt.video_url;
                    videoBg.style.display = '';
                    if (imageBg) imageBg.style.display = 'none';
                    if (particlesEl) particlesEl.style.display = 'none';
                    document.documentElement.classList.add('has-video-bg');
                } else if (opt.type === 'image' && opt.image_url && imageBg && imageEl) {
                    imageEl.src = opt.image_url;
                    imageBg.style.display = '';
                    if (videoBg) videoBg.style.display = 'none';
                    if (particlesEl) particlesEl.style.display = 'none';
                    document.documentElement.classList.add('has-video-bg');
                } else {
                    // Default particles
                    if (videoBg) videoBg.style.display = 'none';
                    if (imageBg) imageBg.style.display = 'none';
                    if (particlesEl) particlesEl.style.display = '';
                    document.documentElement.classList.remove('has-video-bg');
                }
            }

            applyBackground(activeOption);

            // Pause background video when tab is hidden to save GPU cycles and battery
            document.addEventListener('visibilitychange', () => {
                if (!videoEl || videoBg.style.display === 'none') return;
                if (document.hidden) {
                    videoEl.pause();
                } else {
                    videoEl.play().catch(() => {});
                }
            });

            // Always show the switcher in the top right on desktop
            if (switcher) {
                switcher.classList.remove('hidden');
                const btn = document.getElementById('hero-bg-video-btn');
                const icon = document.getElementById('hero-bg-video-icon');
                const menu = document.getElementById('hero-bg-video-menu');
                const optionsContainer = document.getElementById('hero-bg-video-options');

                function updateSwitcherUI(currOpt) {
                    if (btn) btn.setAttribute('title', `Background: ${currOpt.title}`);
                    if (optionsContainer) {
                        optionsContainer.innerHTML = allOptions.map((opt) => {
                            const isCur = opt.id === currOpt.id;
                            const iconName = opt.type === 'particles' ? 'auto_awesome' : (opt.type === 'image' ? 'image' : 'videocam');
                            return `<button type="button" data-bg-id="${escapeHtml(opt.id)}" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs text-left transition-all ${isCur ? 'bg-primary-container text-on-primary-container font-bold shadow-md' : 'hover:bg-white/10 text-on-surface'}">
                                <span class="flex items-center gap-2 truncate mr-2 font-medium">
                                    <span class="material-symbols-outlined text-xs shrink-0">${iconName}</span>
                                    <span class="truncate">${escapeHtml(opt.title)}</span>
                                </span>
                                ${isCur ? '<span class="material-symbols-outlined text-sm shrink-0">check</span>' : ''}
                            </button>`;
                        }).join('');

                        optionsContainer.querySelectorAll('[data-bg-id]').forEach((optBtn) => {
                            optBtn.addEventListener('click', () => {
                                const targetOpt = allOptions.find((o) => o.id === optBtn.dataset.bgId);
                                if (targetOpt) {
                                    activeOption = targetOpt;
                                    applyBackground(targetOpt);
                                    localStorage.setItem('active_bg_video_id', targetOpt.id);
                                    updateSwitcherUI(targetOpt);
                                    closeMenu();
                                }
                            });
                        });
                    }
                }

                function openMenu() {
                    if (!menu) return;
                    menu.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2', 'scale-95');
                    menu.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0', 'scale-100');
                    if (icon) icon.style.transform = 'rotate(15deg) scale(1.15)';
                }
                function closeMenu() {
                    if (!menu) return;
                    menu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0', 'scale-100');
                    menu.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2', 'scale-95');
                    if (icon) icon.style.transform = 'rotate(0deg) scale(1)';
                }
                function toggleMenu() {
                    if (!menu) return;
                    const isOpen = menu.classList.contains('opacity-100');
                    if (isOpen) closeMenu(); else openMenu();
                }

                if (btn) {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        toggleMenu();
                    };
                }

                document.addEventListener('click', (e) => {
                    if (switcher && !switcher.contains(e.target)) {
                        closeMenu();
                    }
                });

                updateSwitcherUI(activeOption);
            }
        } else {
            if (videoBg) videoBg.style.display = 'none';
            if (imageBg) imageBg.style.display = 'none';
            if (particlesEl) particlesEl.style.display = '';
            if (switcher) switcher.classList.add('hidden');
            document.documentElement.classList.remove('has-video-bg');
        }

        if (byKey.cursor_light_enabled === 'false') {
            document.querySelectorAll('.ambient-glow').forEach((el) => { el.style.display = 'none'; });
        }

        // Cached so the very next load can hide the preloader synchronously, before this
        // setting is even fetched again (see the inline script at the top of index.html's
        // <body> -- without it, the preloader always flashes visible first regardless of this
        // setting, since it can only ever be turned off after this async fetch resolves).
        localStorage.setItem('preloader_enabled', byKey.preloader_enabled === 'false' ? 'false' : 'true');

        if (byKey.preloader_enabled === 'false') {
            const preloader = document.getElementById('preloader');
            if (preloader) preloader.classList.add('preloader-exit');
        }

        if (byKey.ga_id) {
            const s1 = document.createElement('script');
            s1.async = true;
            s1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(byKey.ga_id)}`;
            document.head.appendChild(s1);
            const s2 = document.createElement('script');
            s2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${byKey.ga_id.replace(/'/g, '')}');`;
            document.head.appendChild(s2);
        }

        if (byKey.gsc_verification) {
            const meta = document.createElement('meta');
            meta.setAttribute('name', 'google-site-verification');
            meta.setAttribute('content', byKey.gsc_verification);
            document.head.appendChild(meta);
        }

        if (byKey.maintenance_mode === 'true') {
            const overlay = document.getElementById('maintenance-overlay');
            if (overlay) overlay.classList.remove('hidden');
        }

        activeSiteContent = byKey || {};

        const extraContact = document.getElementById('contact-extra');
        if (extraContact) {
            const pills = [];
            if (byKey.contact_address) pills.push(`<span class="liquid-glass-refractive rounded-full px-4 py-2">${escapeHtml(byKey.contact_address)}</span>`);
            extraContact.innerHTML = pills.join('');
        }

        activeSiteContent = byKey;

        // The `orbit_enabled` setting used to be read out here and returned to the caller, where
        // it gated the auto-rotation of the Education orbital ring. That ring is gone, so the
        // toggle in admin.html still saves to site_content but has nothing left to act on. Left
        // in the database rather than migrated away, so nothing breaks if it ever comes back.
    }

    // Real "resume download" count for the admin dashboard -- only counted
    // when the button actually points at an uploaded resume, not the
    // scroll-to-Work fallback.
    function wireResumeClickTracking() {
        const link = document.getElementById('hero-resume-link');
        if (!link) return;
        link.addEventListener('click', () => {
            if (link.getAttribute('href') === '#work') return;
            if (window.supabaseClient) window.supabaseClient.from('resume_clicks').insert({}).then(() => {}).catch(() => {});
        });
    }

    function createSocialButtonHtml(s, sizeClass = 'w-8 h-8 sm:w-10 sm:h-10') {
        const icon = iconForLabel(s.label);
        const iconHtml = icon.type === 'fa'
            ? `<i class="${icon.cls}"></i>`
            : `<span class="material-symbols-outlined text-base sm:text-lg">${icon.name}</span>`;
        return `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(s.label)}" title="${escapeHtml(s.label)}" class="${sizeClass} liquid-glass-refractive liquid-glass-interactive bounce-feedback flex items-center justify-center rounded-full transition-transform hover:brightness-125 text-on-surface hover:text-primary-container">
${iconHtml}
</a>`;
    }

    function renderSocialLinks(rows) {
        const container = document.getElementById('footer-social-links');
        if (!container) return;
        const visible = (rows && rows.length ? rows : FALLBACK_SOCIAL).filter((s) => s.visible !== false);
        if (!visible.length) return;
        container.innerHTML = visible.map((s) => createSocialButtonHtml(s, 'w-8 h-8 sm:w-10 sm:h-10')).join('');
    }

    // Picks a real brand icon (Font Awesome Brands) based on the link's label --
    // no extra admin field needed, just matches common platform names
    // (case-insensitive). Platforms with no official Font Awesome brand icon
    // (Fiverr) fall back to a generic Material Symbols glyph.
    const SOCIAL_ICON_MAP = [
        [/github/i, { type: 'fa', cls: 'fa-brands fa-github' }],
        [/linkedin/i, { type: 'fa', cls: 'fa-brands fa-linkedin-in' }],
        [/twitter|\bx\b/i, { type: 'fa', cls: 'fa-brands fa-x-twitter' }],
        [/instagram/i, { type: 'fa', cls: 'fa-brands fa-instagram' }],
        [/facebook/i, { type: 'fa', cls: 'fa-brands fa-facebook-f' }],
        [/youtube/i, { type: 'fa', cls: 'fa-brands fa-youtube' }],
        [/telegram/i, { type: 'fa', cls: 'fa-brands fa-telegram' }],
        [/discord/i, { type: 'fa', cls: 'fa-brands fa-discord' }],
        [/whatsapp/i, { type: 'fa', cls: 'fa-brands fa-whatsapp' }],
        [/fiverr/i, { type: 'material', name: 'storefront' }],
        [/mail|email/i, { type: 'material', name: 'mail' }],
    ];

    function iconForLabel(label) {
        const match = SOCIAL_ICON_MAP.find(([re]) => re.test(label || ''));
        return match ? match[1] : { type: 'material', name: 'language' };
    }

    // Hero photo icon rail -- same Social Links rows as the footer, rendered
    // as small icon buttons instead of text.
    function renderHeroSocialIcons(rows) {
        const container = document.getElementById('hero-social-icons');
        if (!container) return;
        let visible = (rows && rows.length ? rows : FALLBACK_SOCIAL).filter((s) => s.visible !== false);
        if (activeSiteContent && activeSiteContent.contact_whatsapp) {
            const hasWa = visible.some((s) => /whatsapp/i.test(s.label || ''));
            if (!hasWa) {
                const cleanNum = activeSiteContent.contact_whatsapp.replace(/[^0-9]/g, '');
                if (cleanNum) visible = [...visible, { label: 'WhatsApp', url: `https://wa.me/${cleanNum}`, visible: true }];
            }
        }
        if (!visible.length) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = visible.map((s) => createSocialButtonHtml(s, 'w-8 h-8 sm:w-10 sm:h-10')).join('');
    }

    // Contact card icon rail -- matches hero social icons
    function renderContactSocialIcons(rows) {
        const container = document.getElementById('contact-social-icons');
        if (!container) return;
        let visible = (rows && rows.length ? rows : FALLBACK_SOCIAL).filter((s) => s.visible !== false);
        if (activeSiteContent && activeSiteContent.contact_whatsapp) {
            const hasWa = visible.some((s) => /whatsapp/i.test(s.label || ''));
            if (!hasWa) {
                const cleanNum = activeSiteContent.contact_whatsapp.replace(/[^0-9]/g, '');
                if (cleanNum) visible = [...visible, { label: 'WhatsApp', url: `https://wa.me/${cleanNum}`, visible: true }];
            }
        }
        if (!visible.length) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = visible.map((s) => createSocialButtonHtml(s, 'w-9 h-9 sm:w-11 sm:h-11 text-base sm:text-lg')).join('');
    }

    // Curated dark tech stock images for experience cards if no custom image is uploaded
    const STOCK_EXPERIENCE_IMAGES = [
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    ];

    // ---------- Experience: Elastic Accordion Gallery ----------
    // Converted from React ElasticGallery component.
    // Expands active card with cubic-bezier spring curves, background zoom, and dual state.
    function renderExperience(rows) {
        const section = document.getElementById('experience');
        const container = document.getElementById('experience-list');
        if (!section || !container) return;
        if (!rows || !rows.length) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');

        let activeIdx = -1; // No card is active by default — all start collapsed

        const gallery = document.createElement('div');
        gallery.className = 'elastic-gallery';

        const cards = rows.map((x, idx) => {
            const card = document.createElement('div');
            card.className = 'elastic-card experience-card';
            card.dataset.idx = idx;

            const bgSrc = x.image_url || STOCK_EXPERIENCE_IMAGES[idx % STOCK_EXPERIENCE_IMAGES.length];
            const range = [x.start_date, x.end_date].filter(Boolean).join(' — ');
            const link = x.website_url || x.website || x.link_url || x.url || x.company_url || '';
            const linkBtnHtml = link
                ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="elastic-card-cta" onclick="event.stopPropagation()">
                    <span>View Details</span>
                    <span class="material-symbols-outlined text-xs">arrow_outward</span>
                </a>`
                : '';

            card.innerHTML = `
                <img class="elastic-card-bg" src="${escapeHtml(bgSrc)}" alt="${escapeHtml(x.title)}" loading="lazy">
                <div class="elastic-card-overlay"></div>
                <div class="elastic-card-content">
                    <div class="flex items-center justify-between">
                        ${range ? `<span class="elastic-card-tag">${escapeHtml(range)}</span>` : '<span></span>'}
                    </div>
                    <div class="elastic-collapsed-label">${escapeHtml(x.title)}</div>
                    <div class="elastic-active-content">
                        <h3 class="elastic-card-title">${escapeHtml(x.title)}</h3>
                        <p class="elastic-card-org">${escapeHtml(x.organization)}</p>
                        ${x.description ? `<p class="elastic-card-desc">${escapeHtml(x.description)}</p>` : ''}
                        ${linkBtnHtml}
                    </div>
                </div>
            `;

            function activate() {
                if (activeIdx === idx) return;
                activeIdx = idx;
                gallery.classList.add('has-active');
                cards.forEach((c, i) => {
                    c.classList.toggle('is-active', i === activeIdx);
                });
            }

            card.addEventListener('mouseenter', activate);
            card.addEventListener('click', activate);

            gallery.appendChild(card);
            return card;
        });

        // When cursor leaves the entire gallery, collapse all cards
        gallery.addEventListener('mouseleave', () => {
            activeIdx = -1;
            gallery.classList.remove('has-active');
            cards.forEach((c) => {
                c.classList.remove('is-active');
            });
        });

        container.innerHTML = '';
        container.appendChild(gallery);
    }

    // The Education orbital ring that lived in the right-hand column of About -- nodes spaced
    // around a circle, auto-rotating on a 50ms interval, click one to swing it to the top and
    // expand a detail card -- has been removed, along with its SceneTimers registration (there
    // is no timer left to pause) and the #orbital-timeline markup it rendered into.
    //
    // Nothing renders the `education` table now. The rows are still there and still editable in
    // admin.html, they just aren't shown anywhere on the public site; the Degree row in About's
    // details list is hardcoded in index.html, not read from them.

    function testimonialCardHtml(t) {
        const rating = Math.max(0, Math.min(5, Number(t.rating) || 0));
        const stars = Array.from({ length: 5 }, (_, si) => `<span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' ${si < rating ? 1 : 0};">star</span>`).join('');
        const photo = t.photo_url
            ? `<img src="${escapeHtml(t.photo_url)}" class="w-9 h-9 rounded-full object-cover shrink-0">`
            : `<div class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-on-surface-variant text-base">person</span></div>`;
        // position/company hold country/platform for these reviews (e.g. "United Kingdom · Fiverr").
        const roleLine = [t.position, t.company].filter(Boolean).join(' · ');
        return `<div class="testimonial-card liquid-glass-refractive rounded-3xl p-4 sm:p-5 flex flex-col gap-3">
<div class="flex text-[#FFB800] gap-0.5" style="filter: drop-shadow(0 0 6px rgba(255, 184, 0, 0.45));">${stars}</div>
<div class="flex-1 min-h-0"><p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed line-clamp-4">"${escapeHtml(t.quote)}"</p></div>
<div class="flex items-center gap-2.5 pt-2 border-t border-white/10">
${photo}
<div class="min-w-0">
<p class="font-bold text-xs sm:text-sm truncate">${escapeHtml(t.client_name)}</p>
${roleLine ? `<p class="text-[10px] sm:text-[11px] text-on-surface-variant truncate">${escapeHtml(roleLine)}</p>` : ''}
</div>
</div>
</div>`;
    }

    // ---------- Testimonials: 3-up infinite sliding carousel, split into Engineering Work /
    // Community Work tabs (same split as Work's project rails). Only 5 DOM cards ever exist
    // (2 invisible buffers + up to 3 visible) no matter how many reviews there are -- see the
    // .testimonial-track/.testimonial-slot comment in styles.css for how the responsive
    // 1/2/3-visible layout and the -20%/-40%/0% shift math work.
    //
    // Each shift() call is two phases: (1) immediately re-tag every slot's data-role toward
    // its destination (center/side/buffer) and start the position slide -- both animate
    // together over the same 600ms, which is what makes a card's scale/glow grow in step with
    // it physically arriving at the center instead of popping once it gets there; (2) once the
    // slide finishes, instantly (transitions suspended) rebuild all 5 slots' content for the
    // new center and snap the track back to its -20% resting position -- content doesn't
    // actually need to change until this point, since the slide only ever moves already-correct
    // buffered content into view (the buffer slot for "what's coming next" is populated one
    // step ahead by the previous cycle's rebuild).
    //
    // Autoplay pauses on hover and whenever the "testimonials" scene isn't on screen (via
    // window.SceneTimers); switching tabs re-registers it against the new review set and
    // clears the previous tab's interval so only one is ever running.
    // ==================== Testimonials 3D Physics Coverflow Carousel ====================
    // Converted from React coverflow-carousel component to vanilla JS.
    // Supports continuous pointer drag with momentum throw, 3D perspective rotation,
    // depth recession, autoplay, dots, keyboard, and SceneTimers integration.

    function renderTestimonialsCoverflow(container, items) {
        if (!items || !items.length) {
            container.innerHTML = `<div class="liquid-glass-refractive rounded-4xl p-10 text-center text-on-surface-variant text-sm min-h-[200px] flex items-center justify-center">No reviews in this category yet.</div>`;
            return () => {};
        }

        const count = items.length;
        const loop = count > 2;

        // Constants for 3D physics
        const rotate = 36; // degrees of tilt
        const depth = 0.65; // depth recession fraction
        const falloff = 0.55;

        let pos = 0;
        let target = 0;
        let selected = 0;
        let cardWidth = 280;
        let rafId = null;
        let drag = null;
        let autoplayTimer = null;
        let hovering = false;
        let sceneActive = false;

        function indexAt(p) {
            return ((Math.round(p) % count) + count) % count;
        }

        function clamp(p) {
            return loop ? p : Math.max(0, Math.min(count - 1, p));
        }

        function getPitch() {
            const isMob = window.innerWidth < 640;
            return isMob ? cardWidth * 0.72 : cardWidth * 0.76;
        }

        // Build DOM
        const wrapper = document.createElement('div');
        wrapper.className = 'testimonial-coverflow-wrapper';

        const frame = document.createElement('div');
        frame.className = 'testimonial-coverflow-frame';
        frame.setAttribute('tabindex', '0');
        frame.setAttribute('role', 'region');
        frame.setAttribute('aria-label', 'Testimonials carousel');

        const stage = document.createElement('div');
        stage.className = 'testimonial-coverflow-stage';

        const cardEls = items.map((t, idx) => {
            const card = document.createElement('div');
            card.className = 'testimonial-coverflow-card';
            card.dataset.idx = idx;

            const rating = Math.max(0, Math.min(5, Number(t.rating) || 5));
            const stars = Array.from({ length: 5 }, (_, si) =>
                `<span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' ${si < rating ? 1 : 0};">star</span>`
            ).join('');

            const photo = t.photo_url
                ? `<img src="${escapeHtml(t.photo_url)}" class="w-9 h-9 rounded-full object-cover shrink-0 border border-primary-container/30">`
                : `<div class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10"><span class="material-symbols-outlined text-on-surface-variant text-base">person</span></div>`;

            const roleLine = [t.position, t.company].filter(Boolean).join(' · ');

            card.innerHTML = `
                <div class="flex items-center justify-between pointer-events-none">
                    <div class="flex text-[#FFB800] gap-0.5" style="filter: drop-shadow(0 0 6px rgba(255, 184, 0, 0.45));">${stars}</div>
                    <span class="material-symbols-outlined text-white/20 text-2xl">format_quote</span>
                </div>
                <p class="testimonial-card-quote pointer-events-none">"${escapeHtml(t.quote)}"</p>
                <div class="flex items-center gap-2.5 pt-3 border-t border-white/10 pointer-events-none">
                    ${photo}
                    <div class="min-w-0">
                        <p class="font-bold text-xs sm:text-sm text-on-surface truncate">${escapeHtml(t.client_name)}</p>
                        ${roleLine ? `<p class="text-[10px] sm:text-[11px] text-on-surface-variant truncate">${escapeHtml(roleLine)}</p>` : ''}
                    </div>
                </div>
            `;

            card.addEventListener('click', (e) => {
                e.stopPropagation();
                goTo(idx);
            });

            stage.appendChild(card);
            return card;
        });

        frame.appendChild(stage);

        // Arrows
        const prevBtn = document.createElement('button');
        prevBtn.className = 'testimonial-arrow testimonial-arrow-prev';
        prevBtn.setAttribute('aria-label', 'Previous review');
        prevBtn.innerHTML = CHEVRON_LEFT_SVG;
        prevBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
        prevBtn.addEventListener('click', (e) => { e.stopPropagation(); nudge(-1); });

        const nextBtn = document.createElement('button');
        nextBtn.className = 'testimonial-arrow testimonial-arrow-next';
        nextBtn.setAttribute('aria-label', 'Next review');
        nextBtn.innerHTML = CHEVRON_RIGHT_SVG;
        nextBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
        nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nudge(1); });

        frame.appendChild(prevBtn);
        frame.appendChild(nextBtn);

        wrapper.appendChild(frame);

        // Dots
        const dotsWrap = document.createElement('div');
        dotsWrap.className = 'testimonial-coverflow-dots';
        const dotEls = items.map((_, idx) => {
            const dot = document.createElement('button');
            dot.className = 'testimonial-coverflow-dot';
            dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
            dot.addEventListener('pointerdown', (e) => e.stopPropagation());
            dot.addEventListener('click', (e) => { e.stopPropagation(); goTo(idx); });
            dotsWrap.appendChild(dot);
            return dot;
        });
        wrapper.appendChild(dotsWrap);

        container.innerHTML = '';
        container.appendChild(wrapper);

        // Paint 3D transformations
        function paint() {
            if (!cardWidth) return;
            const pitch = getPitch();

            cardEls.forEach((card, index) => {
                let offset = index - pos;
                if (loop) {
                    offset = ((offset % count) + count) % count;
                    if (offset > count / 2) offset -= count;
                }

                const distance = Math.abs(offset);
                if (distance > 2.3) {
                    card.style.opacity = '0';
                    card.style.pointerEvents = 'none';
                    return;
                }

                const ramp = Math.pow(distance, falloff);
                const tilt = Math.min(rotate * ramp, 76) * Math.sign(offset);

                card.style.transform =
                    `translateX(calc(-50% + ${offset * pitch}px)) ` +
                    `translateZ(${-depth * cardWidth * ramp}px) rotateY(${-tilt}deg)`;

                const opacity = distance <= 1
                    ? (1 - distance * 0.35)
                    : Math.max(0, 0.65 - (distance - 1) * 0.45);

                card.style.opacity = String(opacity);
                card.style.pointerEvents = 'auto';
                card.style.zIndex = String(100 - Math.round(distance * 10));

                if (distance < 0.45) {
                    card.classList.add('is-center');
                } else {
                    card.classList.remove('is-center');
                }
            });

            dotEls.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === selected);
            });
        }

        function settle(dest) {
            if (rafId !== null) cancelAnimationFrame(rafId);
            target = dest;
            selected = indexAt(dest);

            const step = () => {
                const remaining = target - pos;
                if (Math.abs(remaining) < 0.0004) {
                    pos = target;
                    paint();
                    rafId = null;
                    return;
                }
                pos += remaining * 0.16;
                paint();
                rafId = requestAnimationFrame(step);
            };
            rafId = requestAnimationFrame(step);
        }

        function goTo(index) {
            const dest = loop
                ? index + Math.round((target - index) / count) * count
                : index;
            settle(clamp(dest));
        }

        function nudge(by) {
            settle(clamp(Math.round(target) + by));
        }

        // Pointer Drag & Velocity Throw
        function onPointerDown(e) {
            if (e.target.closest('.testimonial-arrow') || e.target.closest('.testimonial-coverflow-dot')) return;
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            drag = {
                id: e.pointerId,
                startX: e.clientX,
                x: e.clientX,
                pos: pos,
                v: 0,
                t: performance.now(),
                captured: false,
            };
        }

        function onPointerMove(e) {
            if (!drag || drag.id !== e.pointerId) return;
            const pitch = getPitch();
            if (!pitch) return;

            if (!drag.captured && Math.abs(e.clientX - drag.startX) > 4) {
                try { frame.setPointerCapture(e.pointerId); } catch (err) {}
                drag.captured = true;
            }

            const now = performance.now();
            const prev = pos;
            pos = clamp(drag.pos - (e.clientX - drag.startX) / pitch);
            drag.v = ((pos - prev) / Math.max(now - drag.t, 1)) * 1000;
            drag.t = now;
            drag.x = e.clientX;

            const idx = indexAt(pos);
            if (idx !== selected) selected = idx;
            paint();
        }

        function endDrag(e) {
            if (!drag || drag.id !== e.pointerId) return;
            const isClick = Math.abs(e.clientX - drag.startX) < 6;
            const carried = isClick ? 0 : Math.max(-2, Math.min(2, drag.v * 0.18));
            drag = null;
            settle(clamp(Math.round(pos + carried)));
        }

        frame.addEventListener('pointerdown', onPointerDown);
        frame.addEventListener('pointermove', onPointerMove);
        frame.addEventListener('pointerup', endDrag);
        frame.addEventListener('pointercancel', endDrag);

        frame.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-1); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); nudge(1); }
        });

        // Resize observation
        function measure() {
            if (cardEls[0]) {
                cardWidth = cardEls[0].offsetWidth;
                frame.style.perspective = `${cardWidth * 3.2}px`;
                paint();
            }
        }
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(frame);

        // Autoplay
        function syncAutoplay() {
            if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
            if (sceneActive && !hovering && count > 1) {
                autoplayTimer = setInterval(() => { nudge(1); }, 4500);
            }
        }

        wrapper.addEventListener('mouseenter', () => { hovering = true; syncAutoplay(); });
        wrapper.addEventListener('mouseleave', () => { hovering = false; syncAutoplay(); });

        window.SceneTimers.register('testimonials', {
            pause: () => { sceneActive = false; syncAutoplay(); },
            resume: () => { sceneActive = true; syncAutoplay(); },
        });

        return () => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            if (autoplayTimer) clearInterval(autoplayTimer);
            ro.disconnect();
        };
    }

    function renderTestimonials(rows) {
        const section = document.getElementById('testimonials');
        const container = document.getElementById('testimonials-list');
        const tabsEl = document.getElementById('testimonials-tabs');
        if (!section || !container) return;
        const visible = (rows || []).filter((t) => t.visible !== false);
        if (!visible.length) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');

        const groups = {
            engineering: visible.filter((t) => (t.section || 'engineering') !== 'community'),
            community: visible.filter((t) => (t.section || 'engineering') === 'community'),
        };

        let activeSection = groups.engineering.length ? 'engineering' : 'community';
        let stopAutoplay = null;

        let glider = tabsEl ? tabsEl.querySelector('.tab-glider') : null;
        if (tabsEl && !glider) {
            glider = document.createElement('div');
            glider.className = 'tab-glider';
            tabsEl.insertBefore(glider, tabsEl.firstChild);
        }

        function updateGlider(activeTab, animated = true) {
            if (!glider || !activeTab) return;
            if (!animated) {
                glider.style.transition = 'none';
            } else {
                glider.style.transition = 'transform 450ms cubic-bezier(0.25, 1, 0.5, 1), width 450ms cubic-bezier(0.25, 1, 0.5, 1)';
            }
            glider.style.width = `${activeTab.offsetWidth}px`;
            glider.style.transform = `translateX(${activeTab.offsetLeft}px)`;
            if (!animated) {
                requestAnimationFrame(() => {
                    glider.style.transition = '';
                });
            }
        }

        function setActiveTab(animated = true) {
            if (!tabsEl) return;
            let activeBtn = null;
            tabsEl.querySelectorAll('.testimonial-tab').forEach((btn) => {
                const active = btn.dataset.section === activeSection;
                if (active) activeBtn = btn;
                btn.classList.remove('bg-primary-container');
                btn.classList.toggle('text-on-primary-container', active);
                btn.classList.toggle('text-on-surface-variant', !active);
            });
            if (activeBtn) updateGlider(activeBtn, animated);
        }

        function mount() {
            if (stopAutoplay) stopAutoplay();
            stopAutoplay = renderTestimonialsCoverflow(container, groups[activeSection]);
        }

        if (tabsEl) {
            tabsEl.querySelectorAll('.testimonial-tab').forEach((btn) => {
                btn.addEventListener('click', () => {
                    if (btn.dataset.section === activeSection) return;
                    activeSection = btn.dataset.section;
                    setActiveTab(true);
                    mount();
                });
            });
        }

        setActiveTab(false);
        mount();
    }

    // Every extra table here is independent of the others and of Supabase being
    // configured at all: a table that doesn't exist yet (migration not run) or a
    // query that errors just means that section silently keeps its default
    // hardcoded/hidden state instead of breaking the rest of the page.
    async function loadExtras() {
        const client = window.supabaseClient;
        if (!client) {
            renderSocialLinks(FALLBACK_SOCIAL);
            renderHeroSocialIcons(FALLBACK_SOCIAL);
            renderContactSocialIcons(FALLBACK_SOCIAL);
            return;
        }

        const safe = (query) => query.then((r) => (r.error ? { data: null } : r)).catch(() => ({ data: null }));

        // The `education` table is deliberately not fetched here any more -- the orbital ring
        // that consumed it is gone, so this was a query whose result nothing read. The rows and
        // the admin screen that edits them are untouched.
        const [siteContent, socialLinks, experience, testimonials, bgVideos] = await Promise.all([
            safe(client.from('site_content').select('*')),
            safe(client.from('social_links').select('*').order('sort_order', { ascending: true })),
            safe(client.from('experience').select('*').order('sort_order', { ascending: true })),
            safe(client.from('testimonials').select('*').order('sort_order', { ascending: true })),
            safe(client.from('background_videos').select('*').order('sort_order', { ascending: true })),
        ]);

        applySiteContent(siteContent.data);

        const byKey = {};
        (siteContent.data || []).forEach((r) => { byKey[r.key] = r.value; });
        applySiteExtras(byKey, bgVideos.data);

        renderSocialLinks(socialLinks.data);
        renderHeroSocialIcons(socialLinks.data);
        renderContactSocialIcons(socialLinks.data);
        renderExperience(experience.data);
        renderTestimonials(testimonials.data);
    }

    // Real visitor count for the admin dashboard -- one row per page load.
    // Fire-and-forget: never blocks rendering, and a failure here (e.g. the
    // page_views table not migrated yet) is silently ignored.
    if (window.supabaseClient) {
        window.supabaseClient.from('page_views').insert({}).then(() => {}).catch(() => {});
    }
    wireResumeClickTracking();

    loadFromSupabase().then((data) => {
        if (data) {
            renderCoverflow('projects-list', data.engineering.length ? data.engineering : FALLBACK_ENGINEERING);
            renderCoverflow('community-list', data.community.length ? data.community : FALLBACK_COMMUNITY);
            renderSkills(data.skills);
            renderMarquee(data.skills);
        } else {
            renderCoverflow('projects-list', FALLBACK_ENGINEERING);
            renderCoverflow('community-list', FALLBACK_COMMUNITY);
            renderSkills(FALLBACK_SKILLS);
            renderMarquee(FALLBACK_SKILLS);
        }
    });

    loadExtras();
})();
