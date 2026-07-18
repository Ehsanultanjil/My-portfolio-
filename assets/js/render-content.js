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

    loadFromSupabase().then((data) => {
        if (data) {
            renderCards('projects-list', data.engineering.length ? data.engineering : FALLBACK_ENGINEERING);
            renderCards('community-list', data.community.length ? data.community : FALLBACK_COMMUNITY);
            renderSkills(data.skills);
        } else {
            renderCards('projects-list', FALLBACK_ENGINEERING);
            renderCards('community-list', FALLBACK_COMMUNITY);
            renderSkills(FALLBACK_SKILLS);
        }
    });
})();
