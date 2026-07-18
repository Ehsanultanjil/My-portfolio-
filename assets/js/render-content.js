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

            const linkHtml = p.link_url
                ? `<div class="mt-auto flex justify-end"><a href="${escapeHtml(p.link_url)}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(p.title)}" class="liquid-glass-refractive liquid-glass-interactive bounce-feedback w-10 h-10 rounded-full flex items-center justify-center text-primary-container transition-transform hover:brightness-125"><span class="material-symbols-outlined text-lg">open_in_new</span></a></div>`
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
        const pillsHtml = allNames.map((n) => `<div class="px-8 py-3 liquid-glass-refractive flex items-center gap-3 rounded-full">
<span class="w-2 h-2 rounded-full bg-primary-container"></span>
<span class="font-body-md text-body-md">${escapeHtml(n)}</span>
</div>`).join('');

        set1.innerHTML = pillsHtml;
        set2.innerHTML = pillsHtml;
    }

    function renderSkills(groups) {
        const container = document.getElementById('skills-list');
        if (!container) return;

        container.innerHTML = groups.map((g) => `<div class="liquid-glass-refractive liquid-glass-interactive p-6 rounded-4xl" style="will-change: transform;">
<div class="w-12 h-12 rounded-2xl bg-primary-container/10 flex items-center justify-center mb-5">
<span class="material-symbols-outlined text-primary-container">${escapeHtml(g.icon)}</span>
</div>
<h3 class="font-headline-lg text-lg mb-4">${escapeHtml(g.category)}</h3>
<div class="flex flex-wrap gap-2">
${g.names.map((n) => `<span class="px-3 py-1 rounded-full bg-white/5 text-on-surface-variant text-xs">${escapeHtml(n)}</span>`).join('')}
</div>
</div>`).join('');
    }

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

            const engineering = projects.filter((p) => p.section !== 'community');
            const community = projects.filter((p) => p.section === 'community');

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
        primary_cta_link: { selector: '#nav-hire-link, #hero-cta-link', mode: 'href' },
        resume_url: { selector: '#hero-resume-link', mode: 'resume' },
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
                }
            });
        });
    }

    function renderSocialLinks(rows) {
        const container = document.getElementById('footer-social-links');
        if (!container || !rows || !rows.length) return;
        container.innerHTML = rows.map((s) => `<a class="font-label-md text-label-md text-on-surface-variant hover:text-primary-fixed-dim transition-colors opacity-80 hover:opacity-100 brightness-110" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label)}</a>`).join('');
    }

    // ---------- Experience (same card style as Work, with a photo) ----------
    function renderExperience(rows) {
        const section = document.getElementById('experience');
        const container = document.getElementById('experience-list');
        if (!section || !container) return;
        if (!rows || !rows.length) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        container.innerHTML = rows.map((x) => {
            const thumbHtml = x.image_url
                ? `<img src="${escapeHtml(x.image_url)}" alt="${escapeHtml(x.title)}" class="w-full h-full object-cover">`
                : `<span class="material-symbols-outlined text-on-surface-variant" style="font-size: 36px;">work</span>`;

            const thumbClass = x.image_url
                ? 'w-28 sm:w-32 shrink-0 rounded-2xl overflow-hidden flex items-center justify-center'
                : 'w-28 sm:w-32 shrink-0 rounded-2xl border border-white/10 border-dashed bg-white/[0.02] flex items-center justify-center';

            const range = [x.start_date, x.end_date].filter(Boolean).join(' — ');

            return `<div class="min-w-[88vw] sm:min-w-[440px] liquid-glass-refractive liquid-glass-interactive bounce-feedback rounded-4xl p-4 flex gap-4" style="will-change: transform;">
<div class="${thumbClass}" style="aspect-ratio: 3/4;">
${thumbHtml}
</div>
<div class="flex flex-col flex-1 min-w-0 py-1">
${range ? `<span class="px-3 py-1 rounded-full liquid-glass-refractive text-[10px] font-bold self-start mb-2">${escapeHtml(range)}</span>` : ''}
<h3 class="font-headline-lg text-lg mb-1">${escapeHtml(x.title)}</h3>
<p class="font-body-sm text-body-sm text-primary-container mb-2">${escapeHtml(x.organization)}</p>
${x.description ? `<p class="font-body-sm text-body-sm text-on-surface-variant brightness-110 leading-relaxed line-clamp-3">${escapeHtml(x.description)}</p>` : ''}
</div>
</div>`;
        }).join('');
    }

    // ---------- Education (orbital timeline: nodes rotate around a center,
    // click one to expand its details). Lives in the right column of About Me.
    let orbitalTimer = null;

    function renderEducationOrbital(rows) {
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

        // Tied directly to scroll position (not a one-shot trigger): fades and
        // scales in as it's scrolled up into view, and reverses back out if
        // you scroll back up past it -- same in both directions.
        if (!wrap.dataset.scrollRevealBound) {
            wrap.dataset.scrollRevealBound = 'true';
            const updateReveal = () => {
                const rect = wrap.getBoundingClientRect();
                const vh = window.innerHeight;
                const start = vh; // wrap's top at the bottom edge of the viewport = 0%
                const end = vh * 0.5; // wrap's top at mid-viewport = 100%
                const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
                wrap.style.opacity = String(progress);
                wrap.style.transform = `scale(${0.8 + 0.2 * progress})`;
            };
            window.addEventListener('scroll', updateReveal, { passive: true });
            window.addEventListener('resize', updateReveal);
            updateReveal();
        }

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
        let autoRotate = true;
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
                autoRotate = expandedId === null;

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
        orbitalTimer = setInterval(() => {
            if (!autoRotate) return;
            angle = (angle + 0.15) % 360;
            update();
        }, 50);

        container.addEventListener('click', (e) => {
            if (e.target !== container) return;
            expandedId = null;
            autoRotate = true;
            update();
        });
    }

    // ---------- Testimonials ----------
    function renderTestimonials(rows) {
        const section = document.getElementById('testimonials');
        const container = document.getElementById('testimonials-list');
        if (!section || !container) return;
        if (!rows || !rows.length) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        container.innerHTML = rows.map((t) => {
            const rating = Math.max(0, Math.min(5, Number(t.rating) || 0));
            const stars = Array.from({ length: 5 }, (_, i) => `<span class="material-symbols-outlined text-base" style="font-variation-settings: 'FILL' ${i < rating ? 1 : 0};">star</span>`).join('');
            return `<div class="liquid-glass-refractive rounded-4xl p-6 flex flex-col gap-3">
<div class="flex text-primary-container">${stars}</div>
<p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed flex-1">"${escapeHtml(t.quote)}"</p>
<p class="font-bold text-sm">${escapeHtml(t.client_name)}</p>
</div>`;
        }).join('');
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
        renderSocialLinks(socialLinks.data);
        renderExperience(experience.data);
        renderEducationOrbital(education.data);
        renderTestimonials(testimonials.data);
    }

    // Real visitor count for the admin dashboard -- one row per page load.
    // Fire-and-forget: never blocks rendering, and a failure here (e.g. the
    // page_views table not migrated yet) is silently ignored.
    if (window.supabaseClient) {
        window.supabaseClient.from('page_views').insert({}).then(() => {}).catch(() => {});
    }

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
