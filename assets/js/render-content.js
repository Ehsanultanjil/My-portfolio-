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

    function renderCards(containerId, items) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = items.map((p) => {
            const thumbHtml = p.image_url
                ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.title)}" class="w-full h-full object-cover">`
                : `<span class="material-symbols-outlined text-on-surface-variant" style="font-size: 36px;">image</span>`;

            const thumbClass = p.image_url
                ? 'w-28 sm:w-32 shrink-0 rounded-2xl overflow-hidden flex items-center justify-center'
                : 'w-28 sm:w-32 shrink-0 rounded-2xl border border-white/10 border-dashed bg-white/[0.02] flex items-center justify-center';

            const linkButtons = [];
            if (p.link_url) linkButtons.push(`<a href="${escapeHtml(p.link_url)}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(p.title)}" class="liquid-glass-refractive liquid-glass-interactive bounce-feedback w-10 h-10 rounded-full flex items-center justify-center text-primary-container transition-transform hover:brightness-125"><span class="material-symbols-outlined text-lg">open_in_new</span></a>`);
            if (p.github_url) linkButtons.push(`<a href="${escapeHtml(p.github_url)}" target="_blank" rel="noopener noreferrer" aria-label="View source of ${escapeHtml(p.title)}" class="liquid-glass-refractive liquid-glass-interactive bounce-feedback w-10 h-10 rounded-full flex items-center justify-center text-primary-container transition-transform hover:brightness-125"><i class="fa-brands fa-github"></i></a>`);
            const linkHtml = linkButtons.length
                ? `<div class="mt-auto flex justify-end gap-2">${linkButtons.join('')}</div>`
                : `<div class="mt-auto flex justify-end"><div class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant opacity-40"><span class="material-symbols-outlined text-lg">open_in_new</span></div></div>`;

            const tagHtml = p.tag
                ? `<span class="px-3 py-1 rounded-full liquid-glass-refractive text-[10px] font-bold self-start mb-2">${escapeHtml(p.tag)}</span>`
                : '';

            return `<div class="min-w-[88vw] sm:min-w-[440px] liquid-glass-refractive liquid-glass-interactive bounce-feedback rounded-4xl p-4 flex gap-4" style="will-change: transform;">
<div class="${thumbClass}" style="aspect-ratio: 3/4;">
${thumbHtml}
</div>
<div class="flex flex-col flex-1 min-w-0 py-1">
${tagHtml}
<h3 class="font-headline-lg text-lg mb-2">${escapeHtml(p.title)}</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant brightness-110 leading-relaxed line-clamp-3 mb-3">${escapeHtml(p.description)}</p>
${linkHtml}
</div>
</div>`;
        }).join('');
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
        // change in tailwind-config.js.
        const pillsHtml = allNames.map((n) => `<div class="marquee-chip px-5 py-1.5 liquid-glass-refractive flex items-center gap-2 rounded-full">
<span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span class="font-body-sm text-body-sm">${escapeHtml(n)}</span>
</div>`).join('');

        set1.innerHTML = pillsHtml;
        set2.innerHTML = pillsHtml;
    }

    function renderSkills(groups) {
        const container = document.getElementById('skills-list');
        if (!container) return;

        container.innerHTML = groups.map((g, i) => `<div class="skill-card liquid-glass-refractive liquid-glass-interactive p-3 sm:p-6 rounded-2xl sm:rounded-4xl h-full flex flex-col" style="will-change: transform; animation-delay: ${(i % 4) * 0.15}s;">
<div class="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary-container/10 flex items-center justify-center mb-2 sm:mb-5">
<span class="material-symbols-outlined text-primary-container text-lg sm:text-2xl">${escapeHtml(g.icon)}</span>
</div>
<h3 class="font-headline-lg text-sm sm:text-lg mb-2 sm:mb-4">${escapeHtml(g.category)}</h3>
<div class="flex flex-wrap gap-1 sm:gap-2 content-start">
${g.names.map((n) => `<span class="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/5 text-on-surface-variant text-[10px] sm:text-xs">${escapeHtml(n)}</span>`).join('')}
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
                    el.setAttribute('href', `mailto:${value}`);
                    el.textContent = value;
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

    // Settings that don't map cleanly onto a single "find element(s), set an
    // attribute" rule -- document head tags, feature toggles, the nav logo
    // slot, and the maintenance overlay. All optional/no-op if unset.
    function applySiteExtras(byKey) {
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

        const extraContact = document.getElementById('contact-extra');
        if (extraContact) {
            const pills = [];
            if (byKey.contact_phone) pills.push(`<a href="tel:${escapeHtml(byKey.contact_phone.replace(/[^0-9+]/g, ''))}" class="liquid-glass-refractive rounded-full px-4 py-2 hover:text-primary-container transition-colors">${escapeHtml(byKey.contact_phone)}</a>`);
            if (byKey.contact_whatsapp) pills.push(`<a href="https://wa.me/${escapeHtml(byKey.contact_whatsapp.replace(/[^0-9]/g, ''))}" target="_blank" rel="noopener noreferrer" class="liquid-glass-refractive rounded-full px-4 py-2 hover:text-primary-container transition-colors">WhatsApp</a>`);
            if (byKey.contact_address) pills.push(`<span class="liquid-glass-refractive rounded-full px-4 py-2">${escapeHtml(byKey.contact_address)}</span>`);
            extraContact.innerHTML = pills.join('');
        }

        return { orbitEnabled: byKey.orbit_enabled !== 'false' };
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

    function renderSocialLinks(rows) {
        const container = document.getElementById('footer-social-links');
        if (!container) return;
        const visible = (rows || []).filter((s) => s.visible !== false);
        if (!visible.length) return;
        container.innerHTML = visible.map((s) => `<a class="font-label-md text-label-md text-on-surface-variant hover:text-primary-fixed-dim transition-colors opacity-80 hover:opacity-100 brightness-110" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label)}</a>`).join('');
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
        const visible = (rows || []).filter((s) => s.visible !== false);
        if (!visible.length) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = visible.map((s) => {
            const icon = iconForLabel(s.label);
            const iconHtml = icon.type === 'fa'
                ? `<i class="${icon.cls}"></i>`
                : `<span class="material-symbols-outlined text-lg">${icon.name}</span>`;
            return `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(s.label)}" class="w-8 h-8 sm:w-10 sm:h-10 liquid-glass-refractive liquid-glass-interactive bounce-feedback flex items-center justify-center rounded-full transition-transform hover:brightness-125">
${iconHtml}
</a>`;
        }).join('');
    }

    // ---------- Experience: vertical timeline (a growing line with cards stacked along it).
    // The line-grow + card-stagger entrance itself is handled by assets/js/scene-animations.js
    // (targets .experience-line / .experience-card) when the "experience" scene becomes active.
    function renderExperience(rows) {
        const section = document.getElementById('experience');
        const container = document.getElementById('experience-list');
        if (!section || !container) return;
        if (!rows || !rows.length) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        const cardsHtml = rows.map((x) => {
            const thumbHtml = x.image_url
                ? `<img src="${escapeHtml(x.image_url)}" alt="${escapeHtml(x.title)}" class="w-full h-full object-cover">`
                : `<span class="material-symbols-outlined text-on-surface-variant" style="font-size: 28px;">work</span>`;

            const thumbClass = x.image_url
                ? 'w-14 h-14 shrink-0 rounded-xl overflow-hidden flex items-center justify-center'
                : 'w-14 h-14 shrink-0 rounded-xl border border-white/10 border-dashed bg-white/[0.02] flex items-center justify-center';

            const range = [x.start_date, x.end_date].filter(Boolean).join(' — ');

            return `<div class="relative pl-10 sm:pl-12">
<span class="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-primary-container shadow-[0_0_10px_rgba(0,240,255,0.6)]"></span>
<div class="experience-card liquid-glass-refractive liquid-glass-interactive rounded-4xl p-5 sm:p-6 flex gap-4">
<div class="${thumbClass}">
${thumbHtml}
</div>
<div class="flex flex-col flex-1 min-w-0 py-0.5">
${range ? `<span class="px-3 py-1 rounded-full liquid-glass-refractive text-[10px] font-bold self-start mb-2">${escapeHtml(range)}</span>` : ''}
<h3 class="font-headline-lg text-lg mb-1">${escapeHtml(x.title)}</h3>
<p class="font-body-sm text-body-sm text-primary-container mb-2">${escapeHtml(x.organization)}</p>
${x.description ? `<p class="font-body-sm text-body-sm text-on-surface-variant brightness-110 leading-relaxed line-clamp-3">${escapeHtml(x.description)}</p>` : ''}
</div>
</div>
</div>`;
        }).join('');

        container.innerHTML = `<div class="experience-line absolute left-[5px] sm:left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary-container/70 via-primary-container/25 to-transparent"></div>
<div class="flex flex-col gap-10 sm:gap-12">${cardsHtml}</div>`;
    }

    // ---------- Education (orbital timeline: nodes rotate around a center,
    // click one to expand its details). Lives in the right column of About Me.
    let orbitalTimer = null;

    function renderEducationOrbital(rows, orbitEnabled) {
        const wrap = document.getElementById('orbital-timeline-wrap');
        const container = document.getElementById('orbital-timeline');
        if (!wrap || !container) return;

        if (orbitalTimer) {
            clearInterval(orbitalTimer);
            orbitalTimer = null;
        }

        if (!rows || !rows.length) {
            wrap.classList.add('hidden');
            wrap.classList.remove('flex');
            return;
        }

        wrap.classList.remove('hidden');
        wrap.classList.add('flex');
        // The scale+rotate entrance is handled by assets/js/scene-animations.js when the
        // "about" scene becomes active, not by a scroll listener -- there's no page scroll
        // to tie a reveal to anymore.

        container.innerHTML = `
<div class="absolute inset-0 rounded-full border border-white/10 pointer-events-none"></div>
<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center pointer-events-none" style="background: linear-gradient(135deg, #a855f7, #3b82f6, #14b8a6);">
<div class="absolute w-20 h-20 rounded-full border border-white/20 animate-ping" style="opacity: 0.7;"></div>
<div class="absolute w-24 h-24 rounded-full border border-white/10 animate-ping" style="opacity: 0.5; animation-delay: 0.5s;"></div>
<div class="w-8 h-8 rounded-full bg-white/80" style="backdrop-filter: blur(8px);"></div>
</div>`;

        const total = rows.length;
        const radius = container.clientWidth ? container.clientWidth / 2 : 175;
        let angle = 0;
        let autoRotate = orbitEnabled !== false;
        let expandedId = null;

        const nodes = rows.map((row) => {
            const range = [row.start_date, row.end_date].filter(Boolean).join(' — ');
            const isInProgress = !row.end_date;
            const statusLabel = isInProgress ? 'IN PROGRESS' : 'COMPLETED';
            const statusColor = isInProgress ? '#60a5fa' : '#4ade80';
            const wrapEl = document.createElement('div');
            wrapEl.className = 'absolute left-1/2 top-1/2';
            wrapEl.innerHTML = `
<button type="button" class="orbital-btn w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center border-2 bg-black text-white border-white/40" style="transition: background-color 0.3s, border-color 0.3s, color 0.3s, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;">
${row.short_name ? `<span class="text-[11px] font-bold tracking-tight">${escapeHtml(row.short_name)}</span>` : `<span class="material-symbols-outlined text-2xl">school</span>`}
</button>
<div class="orbital-label absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-white/70 transition-all duration-300">${escapeHtml(row.degree)}</div>
<div class="orbital-card hidden absolute top-16 left-1/2 -translate-x-1/2 w-64 rounded-lg overflow-visible text-left" style="background: rgba(0,0,0,0.9); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 0 15px ${statusColor}66;">
<div class="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3" style="background: rgba(255,255,255,0.5);"></div>
<div class="p-4">
<div class="flex justify-between items-center mb-2">
<span class="px-2 text-[10px] font-bold border" style="color:${statusColor}; background:#000; border-color:${statusColor};">${statusLabel}</span>
${range ? `<span class="text-[11px] text-white/50" style="font-family: ui-monospace, monospace;">${escapeHtml(range)}</span>` : ''}
</div>
<p class="font-bold text-sm text-white mt-1">${escapeHtml(row.degree)}</p>
${row.institution ? `<p class="text-white/80 text-xs mt-1">${escapeHtml(row.institution)}</p>` : ''}
${row.grade ? `<p class="text-white/60 text-xs mt-1">Grade: ${escapeHtml(row.grade)}</p>` : ''}
${row.description ? `<p class="text-white/60 text-xs leading-relaxed mt-3 pt-3" style="border-top: 1px solid rgba(255,255,255,0.1);">${escapeHtml(row.description)}</p>` : ''}
</div>
</div>`;
            container.appendChild(wrapEl);

            const node = {
                row,
                wrapEl,
                btn: wrapEl.querySelector('.orbital-btn'),
                label: wrapEl.querySelector('.orbital-label'),
                card: wrapEl.querySelector('.orbital-card'),
            };

            node.btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const opening = expandedId !== row.id;
                expandedId = opening ? row.id : null;
                autoRotate = expandedId === null && orbitEnabled !== false;

                if (opening) {
                    // Rotate the ring so the clicked node lands at the top,
                    // with a springy "pop" transition on the way there.
                    const idx = rows.findIndex((r) => r.id === row.id);
                    angle = (270 - (idx / total) * 360 + 360) % 360;
                    nodes.forEach((n) => {
                        n.wrapEl.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    });
                    setTimeout(() => {
                        nodes.forEach((n) => { n.wrapEl.style.transition = ''; });
                    }, 650);
                }

                update();
            });

            return node;
        });

        function update() {
            nodes.forEach((n, i) => {
                const a = ((i / total) * 360 + angle) % 360;
                const rad = (a * Math.PI) / 180;
                const x = radius * Math.cos(rad);
                const y = radius * Math.sin(rad);
                const isExpanded = expandedId === n.row.id;
                const z = isExpanded ? 50 : Math.round(10 + 10 * Math.cos(rad));

                n.wrapEl.style.transform = `translate(${x}px, ${y}px)`;
                n.wrapEl.style.zIndex = z;
                n.btn.classList.toggle('bg-white', isExpanded);
                n.btn.classList.toggle('text-black', isExpanded);
                n.btn.classList.toggle('border-white', isExpanded);
                n.btn.classList.toggle('scale-150', isExpanded);
                n.btn.style.boxShadow = isExpanded ? '0 0 12px rgba(255,255,255,0.4)' : '';
                n.btn.classList.toggle('bg-black', !isExpanded);
                n.btn.classList.toggle('text-white', !isExpanded);
                n.btn.classList.toggle('border-white/40', !isExpanded);
                n.label.classList.toggle('text-white', isExpanded);
                n.label.classList.toggle('scale-125', isExpanded);
                n.label.classList.toggle('text-white/70', !isExpanded);
                n.card.classList.toggle('hidden', !isExpanded);
            });
        }

        update();
        // Paused whenever the "about" scene isn't the one on screen (see window.SceneTimers
        // above) so the orbit isn't recalculating/repainting while translated off-viewport.
        let timerPaused = true;
        orbitalTimer = setInterval(() => {
            if (timerPaused || !autoRotate) return;
            angle = (angle + 0.15) % 360;
            update();
        }, 50);
        window.SceneTimers.register('about', {
            pause: () => { timerPaused = true; },
            resume: () => { timerPaused = false; },
        });

        container.addEventListener('click', (e) => {
            if (e.target !== container) return;
            expandedId = null;
            autoRotate = orbitEnabled !== false;
            update();
        });
    }

    function testimonialCardHtml(t) {
        const rating = Math.max(0, Math.min(5, Number(t.rating) || 0));
        const stars = Array.from({ length: 5 }, (_, si) => `<span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' ${si < rating ? 1 : 0};">star</span>`).join('');
        const photo = t.photo_url
            ? `<img src="${escapeHtml(t.photo_url)}" class="w-9 h-9 rounded-full object-cover shrink-0">`
            : `<div class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-on-surface-variant text-base">person</span></div>`;
        // position/company hold country/platform for these reviews (e.g. "United Kingdom · Fiverr").
        const roleLine = [t.position, t.company].filter(Boolean).join(' · ');
        return `<div class="testimonial-card liquid-glass-refractive rounded-3xl p-4 sm:p-5 flex flex-col gap-3">
<div class="flex text-primary-container">${stars}</div>
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
    function renderCarousel(container, items) {
        if (!items.length) {
            container.innerHTML = `<div class="liquid-glass-refractive rounded-4xl p-10 text-center text-on-surface-variant text-sm min-h-[200px] flex items-center justify-center">No reviews in this category yet.</div>`;
            return () => {};
        }

        if (items.length === 1) {
            container.innerHTML = `<div class="max-w-md mx-auto">${testimonialCardHtml(items[0])}</div>`;
            return () => {};
        }

        const N = items.length;

        if (N < 5) {
            // Too few reviews for the 5-slot infinite-loop mechanism (buffers would overlap
            // with visible slots) -- just show them all, no looping/nav needed.
            container.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-${Math.min(N, 3)} gap-4">${items.map(testimonialCardHtml).join('')}</div>`;
            return () => {};
        }

        // The two arrows are `hidden sm:flex`: on a phone they'd cost about 100px of a 375px
        // screen (two 44px buttons plus the row gaps), over a quarter of the width, which is
        // what was squeezing the card. Below 640px the card takes the full width instead and
        // the dot strip below plus a swipe replace them -- see the swipe handler and
        // renderDots() further down.
        container.innerHTML = `<div class="flex items-center gap-2 sm:gap-4">
<button type="button" class="testimonial-prev w-10 h-10 sm:w-11 sm:h-11 rounded-full liquid-glass-refractive liquid-glass-interactive hidden sm:flex items-center justify-center bounce-feedback shrink-0" aria-label="Previous review"><span class="material-symbols-outlined text-lg">chevron_left</span></button>
<div class="testimonial-viewport flex-1">
<div class="testimonial-track"></div>
</div>
<button type="button" class="testimonial-next w-10 h-10 sm:w-11 sm:h-11 rounded-full liquid-glass-refractive liquid-glass-interactive hidden sm:flex items-center justify-center bounce-feedback shrink-0" aria-label="Next review"><span class="material-symbols-outlined text-lg">chevron_right</span></button>
</div>
<div class="testimonial-dots mt-5 flex sm:hidden justify-center items-center gap-2" aria-hidden="true"></div>`;

        const track = container.querySelector('.testimonial-track');
        const REST_ROLES = ['buffer', 'side', 'center', 'side', 'buffer'];
        let center = 0;
        let animating = false;

        // On mobile only 1 slot is visible (see .testimonial-track's responsive width in
        // styles.css) -- centering that single visible slot on the true "center" slot (index 2)
        // needs a -40% resting offset instead of the -20% that correctly centers the 3-wide
        // (desktop) or 2-wide (tablet) window. Without this, the one card mobile shows would be
        // a dim "side" slot instead of the featured "center" one.
        function restOffsetPct() {
            return window.matchMedia('(min-width: 640px)').matches ? -20 : -40;
        }

        // Phone-only position indicator, standing in for the hidden arrows: it's what tells you
        // there are more reviews at all, which a lone full-width card with nothing either side
        // of it otherwise doesn't. Dots stop working as a count past roughly eight -- they
        // either overflow the width or shrink into an unreadable smear -- so a plain "n / N"
        // counter takes over from there rather than trying to squeeze in one dot per review.
        //
        // Built once and then only re-flagged, never re-rendered: .testimonial-dot animates its
        // width to stretch the active one into a pill, and a fresh element out of innerHTML has
        // no previous value to transition from, so rebuilding the strip each time would make it
        // snap instead. (The >8 counter is plain text with nothing to animate, so it rewrites.)
        const dotsEl = container.querySelector('.testimonial-dots');
        const DOTS_MAX = 8;

        if (N <= DOTS_MAX) {
            dotsEl.innerHTML = items.map(() => '<span class="testimonial-dot"></span>').join('');
        }

        function syncDots() {
            if (N <= DOTS_MAX) {
                [...dotsEl.children].forEach((dot, i) => { dot.dataset.active = String(i === center); });
            } else {
                dotsEl.innerHTML = `<span class="font-label-md text-label-md text-on-surface-variant opacity-80">${center + 1} / ${N}</span>`;
            }
        }

        function renderSlots() {
            track.innerHTML = [-2, -1, 0, 1, 2].map((offset, i) => {
                const idx = ((center + offset) % N + N) % N;
                return `<div class="testimonial-slot" data-role="${REST_ROLES[i]}">${testimonialCardHtml(items[idx])}</div>`;
            }).join('');
            track.style.transform = `translateX(${restOffsetPct()}%)`;
        }

        function shift(direction) {
            if (animating) return;
            animating = true;

            // `center` advances here rather than in onEnd (nothing below it depends on the old
            // value -- the role retag and the transform are both purely relative) so the dots
            // can move off it in the same frame the slide starts. Updating them at the end
            // instead would leave the indicator sitting 600ms behind the card it describes,
            // which reads as lag.
            center = ((center + direction) % N + N) % N;
            syncDots();

            const slots = [...track.children];
            const oldRoles = slots.map((s) => s.dataset.role);
            slots.forEach((s, i) => {
                s.dataset.role = oldRoles[i - direction] || 'buffer';
            });
            track.style.transform = `translateX(${restOffsetPct() - direction * 20}%)`;

            const onEnd = () => {
                track.removeEventListener('transitionend', onEnd);
                track.classList.add('no-transition');
                renderSlots(); // also snaps the transform back to restOffsetPct()
                void track.offsetWidth; // commit the no-transition state before re-enabling it
                track.classList.remove('no-transition');
                animating = false;
            };
            track.addEventListener('transitionend', onEnd, { once: true });
        }

        renderSlots();
        syncDots();

        container.querySelector('.testimonial-prev').addEventListener('click', () => shift(-1));
        container.querySelector('.testimonial-next').addEventListener('click', () => shift(1));

        // Swipe. Registered unconditionally rather than behind a matchMedia check -- it's
        // harmless on a touch-capable laptop, which still has the arrows -- but it's the only
        // manual control that exists below 640px, where they're hidden.
        //
        // The gesture has to be clearly horizontal to count: mobile scrolls the page itself
        // vertically (scene-nav.js's initMobile), so a drag that's mostly vertical, or that
        // started as a swipe and turned into a scroll, belongs to the page and must not also
        // advance the carousel. Listeners stay passive since nothing here calls preventDefault
        // -- a horizontal drag doesn't scroll anything, so there's nothing to suppress.
        let touchX = null;
        let touchY = null;
        const viewport = container.querySelector('.testimonial-viewport');
        viewport.addEventListener('touchstart', (e) => {
            touchX = e.touches[0].clientX;
            touchY = e.touches[0].clientY;
        }, { passive: true });
        viewport.addEventListener('touchend', (e) => {
            if (touchX == null) return;
            const dx = touchX - e.changedTouches[0].clientX;
            const dy = touchY - e.changedTouches[0].clientY;
            touchX = null;
            touchY = null;
            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
            shift(dx > 0 ? 1 : -1); // drag left (positive dx) reveals the next review
        }, { passive: true });

        // Autoplay is torn down and rebuilt (not just flagged on/off) every time it should
        // start or stop, so the next tick is always exactly 4s from whenever it actually
        // starts -- a single always-running interval would keep ticking on its original phase
        // from mount time, so the first tick after becoming active could land anywhere from
        // 0-4s later rather than a full 4s, and could even double-fire within one "4 second"
        // wait if the phase happened to align that way.
        let sceneActive = false;
        let hovering = false;
        let intervalId = null;

        function syncAutoplay() {
            if (intervalId) { clearInterval(intervalId); intervalId = null; }
            if (sceneActive && !hovering) {
                intervalId = setInterval(() => { if (!animating) shift(1); }, 4000);
            }
        }

        container.addEventListener('mouseenter', () => { hovering = true; syncAutoplay(); });
        container.addEventListener('mouseleave', () => { hovering = false; syncAutoplay(); });

        window.SceneTimers.register('testimonials', {
            pause: () => { sceneActive = false; syncAutoplay(); },
            resume: () => { sceneActive = true; syncAutoplay(); },
        });

        return () => { if (intervalId) clearInterval(intervalId); };
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

        function setActiveTab() {
            if (!tabsEl) return;
            tabsEl.querySelectorAll('.testimonial-tab').forEach((btn) => {
                const active = btn.dataset.section === activeSection;
                btn.classList.toggle('bg-primary-container', active);
                btn.classList.toggle('text-on-primary-container', active);
                btn.classList.toggle('text-on-surface-variant', !active);
            });
        }

        function mount() {
            if (stopAutoplay) stopAutoplay();
            stopAutoplay = renderCarousel(container, groups[activeSection]);
        }

        if (tabsEl) {
            tabsEl.querySelectorAll('.testimonial-tab').forEach((btn) => {
                btn.addEventListener('click', () => {
                    if (btn.dataset.section === activeSection) return;
                    activeSection = btn.dataset.section;
                    setActiveTab();
                    mount();
                });
            });
        }

        setActiveTab();
        mount();
    }

    // Every extra table here is independent of the others and of Supabase being
    // configured at all: a table that doesn't exist yet (migration not run) or a
    // query that errors just means that section silently keeps its default
    // hardcoded/hidden state instead of breaking the rest of the page.
    async function loadExtras() {
        const client = window.supabaseClient;
        if (!client) return;

        const safe = (query) => query.then((r) => (r.error ? { data: null } : r)).catch(() => ({ data: null }));

        const [siteContent, socialLinks, experience, education, testimonials] = await Promise.all([
            safe(client.from('site_content').select('*')),
            safe(client.from('social_links').select('*').order('sort_order', { ascending: true })),
            safe(client.from('experience').select('*').order('sort_order', { ascending: true })),
            safe(client.from('education').select('*').order('sort_order', { ascending: true })),
            safe(client.from('testimonials').select('*').order('sort_order', { ascending: true })),
        ]);

        applySiteContent(siteContent.data);

        const byKey = {};
        (siteContent.data || []).forEach((r) => { byKey[r.key] = r.value; });
        const { orbitEnabled } = applySiteExtras(byKey);

        renderSocialLinks(socialLinks.data);
        renderHeroSocialIcons(socialLinks.data);
        renderExperience(experience.data);
        renderEducationOrbital(education.data, orbitEnabled);
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
            renderCards('projects-list', data.engineering.length ? data.engineering : FALLBACK_ENGINEERING);
            renderCards('community-list', data.community.length ? data.community : FALLBACK_COMMUNITY);
            renderSkills(data.skills);
            renderMarquee(data.skills);
        } else {
            renderCards('projects-list', FALLBACK_ENGINEERING);
            renderCards('community-list', FALLBACK_COMMUNITY);
            renderSkills(FALLBACK_SKILLS);
            renderMarquee(FALLBACK_SKILLS);
        }
    });

    loadExtras();
})();
