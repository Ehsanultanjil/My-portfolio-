(function () {
    const client = window.supabaseClient;

    const notConfiguredView = document.getElementById('not-configured-view');
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');

    if (!client) {
        notConfiguredView.classList.remove('hidden');
        return;
    }

    // ================= Shared helpers =================

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str == null ? '' : String(str);
        return div.innerHTML;
    }

    function timeAgo(iso) {
        const diff = Date.now() - new Date(iso).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return 'just now';
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        const d = Math.floor(h / 24);
        if (d < 30) return `${d}d ago`;
        return new Date(iso).toLocaleDateString();
    }

    function setFieldValue(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = value === 'true';
        else el.value = value == null ? '' : value;
    }

    function getFieldValue(id) {
        const el = document.getElementById(id);
        if (!el) return '';
        if (el.type === 'checkbox') return el.checked ? 'true' : 'false';
        return el.value.trim();
    }

    // ================= Toasts =================

    const toastStack = document.getElementById('toast-stack');
    function toast(message, type) {
        const el = document.createElement('div');
        const color = type === 'error' ? '#ff8a80' : (type === 'info' ? '#7cf3ff' : '#4ade80');
        el.className = 'toast liquid-glass-refractive rounded-2xl px-5 py-4 flex items-center gap-3';
        el.innerHTML = `<span class="w-2 h-2 rounded-full shrink-0" style="background:${color}; box-shadow:0 0 8px ${color};"></span><span class="text-sm">${escapeHtml(message)}</span>`;
        toastStack.appendChild(el);
        requestAnimationFrame(() => el.classList.add('toast-in'));
        setTimeout(() => {
            el.classList.remove('toast-in');
            setTimeout(() => el.remove(), 400);
        }, 3200);
    }

    // ================= Modals =================

    function openModal(id) {
        const overlay = document.getElementById(`${id}-overlay`);
        if (!overlay) return;
        overlay.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
    }
    function closeModal(overlayEl) {
        overlayEl.classList.remove('modal-open');
        document.body.style.overflow = '';
    }
    function closeAllModals() {
        document.querySelectorAll('.modal-overlay.modal-open').forEach(closeModal);
    }

    document.querySelectorAll('[data-open-modal]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.openModal;
            if (id === 'project-modal') resetProjectForm();
            if (id === 'skill-modal') resetSkillForm();
            if (id === 'experience-modal') resetExperienceForm();
            if (id === 'education-modal') resetEducationForm();
            if (id === 'testimonial-modal') resetTestimonialForm();
            if (id === 'social-modal') resetSocialForm();
            if (id === 'app-modal') resetAppForm();
            if (id === 'bg-video-modal') resetBackgroundVideoForm();
            openModal(id);
        });
    });
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay);
        });
        overlay.querySelectorAll('.modal-close').forEach((btn) => {
            btn.addEventListener('click', () => closeModal(overlay));
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });

    // ================= Confirm delete =================

    const confirmOverlay = document.getElementById('confirm-modal-overlay');
    const confirmText = document.getElementById('confirm-modal-text');
    const confirmOkBtn = document.getElementById('confirm-modal-ok');

    function confirmDelete(message, onConfirm) {
        confirmText.textContent = message;
        openModal('confirm-modal');
        const handler = async () => {
            confirmOkBtn.removeEventListener('click', handler);
            closeModal(confirmOverlay);
            await onConfirm();
        };
        confirmOkBtn.addEventListener('click', handler);
    }

    // ================= Sidebar / router =================

    const sidebar = document.getElementById('admin-sidebar');
    const sidebarOverlay = document.getElementById('admin-sidebar-overlay');
    const pageTitle = document.getElementById('page-title');
    const navItems = document.querySelectorAll('.admin-nav-item');
    const pages = document.querySelectorAll('.admin-page');

    const PAGE_TITLES = {
        dashboard: 'Dashboard', home: 'Home Page', projects: 'Projects', skills: 'Skills',
        experience: 'Experience', education: 'Education', testimonials: 'Testimonials',
        apps: 'Apps', 'bg-videos': 'Background Videos', contact: 'Contact', social: 'Social Links', settings: 'Website Settings',
    };

    function showPage(name) {
        pages.forEach((p) => p.classList.toggle('hidden', p.dataset.page !== name));
        navItems.forEach((n) => n.classList.toggle('active', n.dataset.page === name));
        pageTitle.textContent = PAGE_TITLES[name] || name;
        closeSidebar();
        window.scrollTo(0, 0);
        document.querySelector('.admin-page[data-page="' + name + '"]')?.closest('main')?.scrollTo?.(0, 0);
        const main = document.querySelector('#dashboard-view .overflow-y-auto');
        if (main) main.scrollTop = 0;
    }

    function openSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('open');
    }
    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('open');
    }

    navItems.forEach((btn) => btn.addEventListener('click', () => showPage(btn.dataset.page)));
    document.getElementById('sidebar-open-btn').addEventListener('click', openSidebar);
    document.getElementById('sidebar-close-btn').addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // ================= Collapsible cards (Home page) =================

    document.querySelectorAll('.collapse-toggle').forEach((btn) => {
        btn.addEventListener('click', () => {
            const panel = document.getElementById(btn.dataset.target);
            const chevron = btn.querySelector('.material-symbols-outlined');
            const isOpen = !panel.classList.contains('hidden');
            panel.classList.toggle('hidden', isOpen);
            chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        });
    });

    // ================= Clock =================

    function tickClock() {
        const el = document.getElementById('admin-clock');
        if (el) el.textContent = new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    }
    tickClock();
    setInterval(tickClock, 1000 * 30);

    // ================= Drag-and-drop reorder =================
    // Generic: attach to any list container whose direct children have
    // draggable="true" and data-id. On drop, recomputes sort_order for every
    // visible item (1-indexed by DOM position) and writes it back.

    function enableDragReorder(container, table, onDone) {
        let dragEl = null;

        container.addEventListener('dragstart', (e) => {
            const item = e.target.closest('[draggable="true"]');
            if (!item) return;
            dragEl = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        container.addEventListener('dragend', () => {
            if (dragEl) dragEl.classList.remove('dragging');
            container.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach((el) => {
                el.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            dragEl = null;
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const item = e.target.closest('[draggable="true"]');
            if (!item || item === dragEl) return;
            container.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach((el) => {
                if (el !== item) el.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            const rect = item.getBoundingClientRect();
            const before = (e.clientY - rect.top) < rect.height / 2;
            item.classList.toggle('drag-over-top', before);
            item.classList.toggle('drag-over-bottom', !before);
        });

        container.addEventListener('drop', async (e) => {
            e.preventDefault();
            const item = e.target.closest('[draggable="true"]');
            container.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach((el) => {
                el.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            if (!item || !dragEl || item === dragEl) return;

            const rect = item.getBoundingClientRect();
            const before = (e.clientY - rect.top) < rect.height / 2;
            item.insertAdjacentElement(before ? 'beforebegin' : 'afterend', dragEl);

            const ids = [...container.querySelectorAll('[draggable="true"]')].map((el) => el.dataset.id);
            try {
                await Promise.all(ids.map((id, i) => client.from(table).update({ sort_order: i + 1 }).eq('id', id)));
                toast('Order updated');
                if (onDone) onDone();
            } catch (err) {
                toast('Reorder failed: ' + err.message, 'error');
            }
        });
    }

    // ================= Auth =================

    function showLoggedOut() {
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
    }

    function showLoggedIn() {
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        showPage('dashboard');
        loadStats();
        loadRecentActivity();
        loadHomeContent();
        loadProjects();
        loadSkills();
        loadExperience();
        loadEducation();
        loadTestimonials();
        loadSocialLinks();
        loadApps();
        loadBackgroundVideos();
    }

    // Both of these used to call showLoggedIn()/showLoggedOut() directly, which meant the full
    // dashboard bootstrap -- showPage('dashboard') plus all ten loaders -- ran on every auth
    // event rather than on an actual change of who is signed in. Two ways that went wrong:
    //
    //   - supabase-js v2 emits INITIAL_SESSION as soon as onAuthStateChange subscribes, so it
    //     duplicated the getSession() result on every page load: twenty concurrent queries and
    //     two renders racing to fill the same containers.
    //   - TOKEN_REFRESHED and SIGNED_IN also fire on the refresh timer and whenever the tab
    //     regains focus. Each one called showPage('dashboard'), so sitting on Projects and
    //     switching away and back silently threw you to the Dashboard page -- the buttons you
    //     were looking at "disappeared" -- and refetched every list behind it.
    //
    // Routing both through one handler keyed on the user id fixes both: a repeat event for the
    // same user is a no-op, and only a genuine sign-in/sign-out/user-switch rebuilds anything.
    // `signedInAs` starts undefined rather than null so that the first resolve is always a
    // change, including the logged-out case, which has to run showLoggedOut() to reveal the
    // login form.
    let signedInAs;

    function handleSession(session) {
        const userId = session ? session.user.id : null;
        if (userId === signedInAs) return;
        signedInAs = userId;
        if (userId) showLoggedIn(); else showLoggedOut();
    }

    // getSession() is kept alongside the subscription, rather than relying on INITIAL_SESSION
    // alone, so a supabase-js build that doesn't emit it still boots. It's free now that a
    // duplicate resolves to the same user id and returns early.
    client.auth.getSession().then(({ data }) => handleSession(data.session));
    client.auth.onAuthStateChange((_event, session) => handleSession(session));

    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
            loginError.textContent = error.message;
            loginError.classList.remove('hidden');
        }
    });
    document.getElementById('logout-btn').addEventListener('click', () => client.auth.signOut());

    // ================= Dashboard: stats =================

    async function loadStats() {
        const [projects, skills, experience, education, testimonials, views, downloads] = await Promise.all([
            client.from('projects').select('*', { count: 'exact', head: true }),
            client.from('skills').select('*', { count: 'exact', head: true }),
            client.from('experience').select('*', { count: 'exact', head: true }),
            client.from('education').select('*', { count: 'exact', head: true }),
            client.from('testimonials').select('*', { count: 'exact', head: true }),
            client.from('page_views').select('*', { count: 'exact', head: true }),
            client.from('resume_clicks').select('*', { count: 'exact', head: true }),
        ]);
        const displayCount = (r) => (r.error || r.count == null) ? '—' : r.count;
        document.getElementById('stat-projects').textContent = displayCount(projects);
        document.getElementById('stat-skills').textContent = displayCount(skills);
        document.getElementById('stat-experience').textContent = displayCount(experience);
        document.getElementById('stat-education').textContent = displayCount(education);
        document.getElementById('stat-testimonials').textContent = displayCount(testimonials);
        document.getElementById('stat-visitors').textContent = displayCount(views);
        document.getElementById('stat-downloads').textContent = displayCount(downloads);
    }

    async function loadRecentActivity() {
        const list = document.getElementById('recent-activity-list');
        const [projects, skills, testimonials, views] = await Promise.all([
            client.from('projects').select('title,created_at').order('created_at', { ascending: false }).limit(3),
            client.from('skills').select('name,created_at').order('created_at', { ascending: false }).limit(3),
            client.from('testimonials').select('client_name,created_at').order('created_at', { ascending: false }).limit(3),
            client.from('page_views').select('viewed_at').order('viewed_at', { ascending: false }).limit(1),
        ]);

        const items = [];
        (projects.data || []).forEach((p) => items.push({ icon: 'work', text: `Project added: ${p.title}`, at: p.created_at }));
        (skills.data || []).forEach((s) => items.push({ icon: 'bolt', text: `Skill added: ${s.name}`, at: s.created_at }));
        (testimonials.data || []).forEach((t) => items.push({ icon: 'format_quote', text: `Testimonial added: ${t.client_name}`, at: t.created_at }));
        if (views.data && views.data[0]) items.push({ icon: 'visibility', text: 'Latest visitor', at: views.data[0].viewed_at });

        items.sort((a, b) => new Date(b.at) - new Date(a.at));

        if (!items.length) {
            list.innerHTML = `<p class="text-on-surface-variant text-sm">Nothing yet.</p>`;
            return;
        }
        list.innerHTML = items.slice(0, 6).map((it) => `<div class="liquid-glass-refractive rounded-2xl px-5 py-3 flex items-center gap-3">
<span class="material-symbols-outlined text-primary-container text-lg">${it.icon}</span>
<span class="text-sm flex-1">${escapeHtml(it.text)}</span>
<span class="text-xs text-on-surface-variant">${timeAgo(it.at)}</span>
</div>`).join('');
    }

    // ================= Home Page: Hero / About / Titles =================

    const HERO_KEYS = ['hero_badge', 'hero_heading', 'hero_heading_highlight', 'hero_bio', 'hero_photo_url', 'resume_url', 'hero_button_text', 'primary_cta_link', 'hire_button_image_url', 'hero_bg_image_url', 'hero_glow_enabled'];
    const ABOUT_KEYS = ['about_eyebrow', 'about_heading', 'about_text'];
    const TITLES_KEYS = ['work_heading', 'skills_heading', 'skills_heading_highlight', 'experience_heading', 'testimonials_heading', 'footer_name'];
    const CONTACT_KEYS = ['contact_heading', 'contact_text', 'contact_email', 'contact_phone', 'contact_address', 'contact_whatsapp', 'contact_form_email'];
    // 'orbit_enabled' was dropped from this list along with its toggle in admin.html: it gated
    // the auto-rotation of the Education orbital ring on the public site, and that ring is gone.
    // Any existing site_content row for the key is simply left alone -- nothing reads it now.
    const SETTINGS_KEYS = ['seo_title', 'seo_description', 'favicon_url', 'logo_url', 'maintenance_mode', 'ga_id', 'gsc_verification', 'particles_enabled', 'cursor_light_enabled', 'preloader_enabled', 'video_bg_enabled', 'video_bg_url', 'bg_image_url'];

    let siteContentCache = {};

    async function loadHomeContent() {
        const { data, error } = await client.from('site_content').select('*');
        if (error || !data) return;
        siteContentCache = {};
        data.forEach((row) => { siteContentCache[row.key] = row.value; });

        [...HERO_KEYS, ...ABOUT_KEYS, ...TITLES_KEYS, ...CONTACT_KEYS, ...SETTINGS_KEYS].forEach((key) => {
            if (siteContentCache[key] != null) setFieldValue(`sc-${key}`, siteContentCache[key]);
        });

        if (siteContentCache.hero_photo_url) {
            document.getElementById('sc-hero-photo-preview').src = siteContentCache.hero_photo_url;
            document.getElementById('sc-hero-photo-preview').classList.remove('hidden');
        }
        if (siteContentCache.hero_bg_image_url) {
            document.getElementById('sc-hero-bg-preview').src = siteContentCache.hero_bg_image_url;
            document.getElementById('sc-hero-bg-preview').classList.remove('hidden');
            document.getElementById('sc-hero-bg-clear').classList.remove('hidden');
        }
        if (siteContentCache.resume_url) {
            document.getElementById('sc-resume-current').href = siteContentCache.resume_url;
            document.getElementById('sc-resume-current').classList.remove('hidden');
        }
        if (siteContentCache.hire_button_image_url) {
            document.getElementById('sc-hire-image-preview').src = siteContentCache.hire_button_image_url;
            document.getElementById('sc-hire-image-preview').classList.remove('hidden');
            document.getElementById('sc-hire-image-clear').classList.remove('hidden');
        }
        if (siteContentCache.favicon_url) {
            document.getElementById('sc-favicon-preview').src = siteContentCache.favicon_url;
            document.getElementById('sc-favicon-preview').classList.remove('hidden');
        }
        if (siteContentCache.logo_url) {
            document.getElementById('sc-logo-preview').src = siteContentCache.logo_url;
            document.getElementById('sc-logo-preview').classList.remove('hidden');
            document.getElementById('sc-logo-clear').classList.remove('hidden');
        }
        if (siteContentCache.video_bg_url) {
            const videoPrev = document.getElementById('sc-video-bg-preview');
            if (videoPrev) {
                videoPrev.src = siteContentCache.video_bg_url;
                videoPrev.classList.remove('hidden');
                document.getElementById('sc-video-bg-clear').classList.remove('hidden');
            }
        }
        if (siteContentCache.bg_image_url) {
            document.getElementById('sc-bg-image-preview').src = siteContentCache.bg_image_url;
            document.getElementById('sc-bg-image-preview').classList.remove('hidden');
            document.getElementById('sc-bg-image-clear').classList.remove('hidden');
        }

        document.getElementById('site-status-dot').style.background = siteContentCache.maintenance_mode === 'true' ? '#facc15' : '#4ade80';
        document.getElementById('site-status-dot').style.boxShadow = siteContentCache.maintenance_mode === 'true' ? '0 0 8px #facc15' : '0 0 8px #4ade80';
        document.getElementById('site-status-text').textContent = siteContentCache.maintenance_mode === 'true' ? 'Maintenance' : 'Online';
    }

    async function uploadTo(bucket, file) {
        const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error } = await client.storage.from(bucket).upload(path, file, { upsert: true });
        if (error) throw error;
        return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    }

    async function saveContentKeys(keys, successMessage) {
        const rows = keys.map((key) => ({ key, value: getFieldValue(`sc-${key}`) }));
        const { error } = await client.from('site_content').upsert(rows, { onConflict: 'key' });
        if (error) throw error;
        toast(successMessage);
    }

    // Image upload wiring shared by every "file input -> preview -> hidden url field" pair.
    function wireImageUpload(fileInputId, previewId, hiddenId, clearBtnId) {
        const fileInput = document.getElementById(fileInputId);
        const preview = document.getElementById(previewId);
        if (!fileInput) return;
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (!file) return;
            preview.src = URL.createObjectURL(file);
            preview.classList.remove('hidden');
            if (clearBtnId) document.getElementById(clearBtnId).classList.remove('hidden');
        });
        if (clearBtnId) {
            document.getElementById(clearBtnId).addEventListener('click', () => {
                fileInput.value = '';
                preview.classList.add('hidden');
                preview.src = '';
                document.getElementById(clearBtnId).classList.add('hidden');
                document.getElementById(hiddenId).value = '';
            });
        }
    }
    wireImageUpload('sc-hero-photo-file', 'sc-hero-photo-preview', 'sc-hero_photo_url', null);
    wireImageUpload('sc-hero-bg-file', 'sc-hero-bg-preview', 'sc-hero_bg_image_url', 'sc-hero-bg-clear');
    wireImageUpload('sc-hire-image-file', 'sc-hire-image-preview', 'sc-hire_button_image_url', 'sc-hire-image-clear');
    wireImageUpload('sc-favicon-file', 'sc-favicon-preview', 'sc-favicon_url', null);
    wireImageUpload('sc-logo-file', 'sc-logo-preview', 'sc-logo_url', 'sc-logo-clear');

    // Video upload wiring — similar to wireImageUpload but uses video element (src, not img.src)
    (function wireVideoUpload() {
        const fileInput = document.getElementById('sc-video-bg-file');
        const preview = document.getElementById('sc-video-bg-preview');
        const clearBtn = document.getElementById('sc-video-bg-clear');
        if (!fileInput) return;
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (!file) return;
            preview.src = URL.createObjectURL(file);
            preview.classList.remove('hidden');
            clearBtn.classList.remove('hidden');
        });
        clearBtn.addEventListener('click', () => {
            fileInput.value = '';
            preview.classList.add('hidden');
            preview.src = '';
            clearBtn.classList.add('hidden');
            document.getElementById('sc-video_bg_url').value = '';
        });
    })();

    wireImageUpload('sc-bg-image-file', 'sc-bg-image-preview', 'sc-bg_image_url', 'sc-bg-image-clear');

    async function handleFormUpload(fileInputId, bucket, hiddenId) {
        const file = document.getElementById(fileInputId).files[0];
        if (!file) return;
        const url = await uploadTo(bucket, file);
        document.getElementById(hiddenId).value = url;
    }

    document.getElementById('hero-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        try {
            await handleFormUpload('sc-hero-photo-file', 'project-images', 'sc-hero_photo_url');
            await handleFormUpload('sc-hero-bg-file', 'project-images', 'sc-hero_bg_image_url');
            await handleFormUpload('sc-resume-file', 'resume-files', 'sc-resume_url');
            await handleFormUpload('sc-hire-image-file', 'project-images', 'sc-hire_button_image_url');
            await saveContentKeys(HERO_KEYS, 'Hero section saved');
            document.getElementById('sc-hero-photo-file').value = '';
            document.getElementById('sc-hero-bg-file').value = '';
            document.getElementById('sc-resume-file').value = '';
            document.getElementById('sc-hire-image-file').value = '';
        } catch (err) {
            toast(err.message || String(err), 'error');
        } finally {
            btn.disabled = false;
        }
    });

    document.getElementById('about-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await saveContentKeys(ABOUT_KEYS, 'About Me saved');
        } catch (err) {
            toast(err.message || String(err), 'error');
        }
    });

    document.getElementById('titles-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await saveContentKeys(TITLES_KEYS, 'Section titles saved');
        } catch (err) {
            toast(err.message || String(err), 'error');
        }
    });

    document.getElementById('contact-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await saveContentKeys(CONTACT_KEYS, 'Contact info saved');
        } catch (err) {
            toast(err.message || String(err), 'error');
        }
    });

    document.getElementById('settings-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('settings-error');
        errorEl.classList.add('hidden');
        try {
            await handleFormUpload('sc-favicon-file', 'project-images', 'sc-favicon_url');
            await handleFormUpload('sc-logo-file', 'project-images', 'sc-logo_url');
            await handleFormUpload('sc-video-bg-file', 'project-images', 'sc-video_bg_url');
            await handleFormUpload('sc-bg-image-file', 'project-images', 'sc-bg_image_url');
            await saveContentKeys(SETTINGS_KEYS, 'Settings saved');
            document.getElementById('sc-favicon-file').value = '';
            document.getElementById('sc-logo-file').value = '';
            document.getElementById('sc-video-bg-file').value = '';
            document.getElementById('sc-bg-image-file').value = '';
            loadHomeContent();
        } catch (err) {
            errorEl.textContent = err.message || String(err);
            errorEl.classList.remove('hidden');
        }
    });

    // ================= Projects =================

    let cachedProjects = [];
    const SECTION_LABELS = { engineering: 'Engineering Work', community: 'Community Work' };

    async function loadProjects() {
        const list = document.getElementById('projects-admin-list');
        const { data, error } = await client.from('projects').select('*').order('section', { ascending: true }).order('sort_order', { ascending: true });
        if (error) { list.innerHTML = `<p style="color:#ff8a80;">Failed to load: ${escapeHtml(error.message)}</p>`; return; }
        cachedProjects = data || [];
        renderProjects();
    }

    function renderProjects() {
        const list = document.getElementById('projects-admin-list');
        const empty = document.getElementById('projects-empty');
        const search = document.getElementById('project-search').value.toLowerCase();
        const filter = document.getElementById('project-filter').value;

        const filtered = cachedProjects.filter((p) => {
            const matchesSearch = !search || p.title.toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search);
            const matchesFilter = !filter || (p.section || 'engineering') === filter;
            return matchesSearch && matchesFilter;
        });

        if (!filtered.length) {
            empty.classList.remove('hidden');
            empty.innerHTML = `<div class="liquid-glass-refractive rounded-3xl p-10 text-center"><span class="material-symbols-outlined text-3xl text-on-surface-variant">work_off</span><p class="text-on-surface-variant text-sm mt-2">${cachedProjects.length ? 'No projects match your search.' : 'No projects yet — add your first one.'}</p></div>`;
            list.innerHTML = '';
            return;
        }
        empty.classList.add('hidden');

        list.innerHTML = filtered.map((p) => {
            const thumb = p.image_url
                ? `<img src="${escapeHtml(p.image_url)}" class="w-14 h-14 rounded-xl object-cover shrink-0">`
                : `<div class="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-on-surface-variant">image</span></div>`;
            return `<div draggable="true" data-id="${p.id}" class="liquid-glass-refractive rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
<div class="flex items-center gap-3 min-w-0 flex-1">
<span class="material-symbols-outlined drag-handle text-on-surface-variant shrink-0">drag_indicator</span>
${thumb}
<div class="min-w-0 flex-1">
<div class="flex items-center gap-2 flex-wrap">
<p class="font-bold">${escapeHtml(p.title)}</p>
<span class="text-[10px] px-2 py-0.5 rounded-full liquid-glass-refractive uppercase tracking-wide whitespace-nowrap">${escapeHtml(SECTION_LABELS[p.section] || 'Engineering Work')}</span>
${p.featured ? '<span class="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap" style="background:rgba(0,219,233,0.15); color:#7cf3ff;">Featured</span>' : ''}
${p.visible === false ? '<span class="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap" style="background:rgba(255,138,128,0.15); color:#ff8a80;">Hidden</span>' : ''}
</div>
<p class="text-on-surface-variant text-sm truncate">${escapeHtml(p.description || '')}</p>
</div>
</div>
<div class="flex items-center justify-between sm:justify-end gap-2 shrink-0">
<span class="text-xs text-on-surface-variant">#${p.sort_order}</span>
<span class="toggle-switch" title="Visible on website"><input type="checkbox" data-toggle-visible="${p.id}" ${p.visible === false ? '' : 'checked'}><span class="toggle-track"></span></span>
<div class="flex gap-1">
<button data-duplicate="${p.id}" title="Duplicate" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">content_copy</span></button>
<button data-edit="${p.id}" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">edit</span></button>
<button data-delete="${p.id}" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">delete</span></button>
</div>
</div>
</div>`;
        }).join('');

        list.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editProject(btn.dataset.edit)));
        list.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => {
            const p = cachedProjects.find((x) => String(x.id) === btn.dataset.delete);
            confirmDelete(`Delete project "${p?.title}"?`, async () => {
                const { error } = await client.from('projects').delete().eq('id', btn.dataset.delete);
                if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
                toast('Project deleted');
                loadProjects(); loadStats();
            });
        }));
        list.querySelectorAll('[data-duplicate]').forEach((btn) => btn.addEventListener('click', async () => {
            const p = cachedProjects.find((x) => String(x.id) === btn.dataset.duplicate);
            if (!p) return;
            const { id, created_at, ...rest } = p;
            rest.title = `${rest.title} (Copy)`;
            const { error } = await client.from('projects').insert(rest);
            if (error) { toast('Duplicate failed: ' + error.message, 'error'); return; }
            toast('Project duplicated');
            loadProjects(); loadStats();
        }));
        list.querySelectorAll('[data-toggle-visible]').forEach((cb) => cb.addEventListener('change', async () => {
            const { error } = await client.from('projects').update({ visible: cb.checked }).eq('id', cb.dataset.toggleVisible);
            if (error) { toast('Update failed: ' + error.message, 'error'); cb.checked = !cb.checked; return; }
            toast(cb.checked ? 'Project shown on website' : 'Project hidden from website');
            loadProjects();
        }));

        enableDragReorder(list, 'projects', loadProjects);
    }

    document.getElementById('project-search').addEventListener('input', renderProjects);
    document.getElementById('project-filter').addEventListener('change', renderProjects);

    const projectForm = document.getElementById('project-form');
    const projectImageInput = document.getElementById('project-image');
    const projectImagePreview = document.getElementById('project-image-preview');

    projectImageInput.addEventListener('change', () => {
        const file = projectImageInput.files[0];
        if (!file) return;
        projectImagePreview.src = URL.createObjectURL(file);
        projectImagePreview.classList.remove('hidden');
    });

    function resetProjectForm() {
        projectForm.reset();
        document.getElementById('project-modal-title').textContent = 'Add Project';
        document.getElementById('project-id').value = '';
        document.getElementById('project-existing-image').value = '';
        projectImagePreview.classList.add('hidden');
        projectImagePreview.src = '';
        document.getElementById('project-visible').checked = true;
        document.getElementById('project-featured').checked = false;
        document.getElementById('project-error').classList.add('hidden');
        const section = document.getElementById('project-section').value;
        const countInSection = cachedProjects.filter((p) => (p.section || 'engineering') === section).length;
        document.getElementById('project-sort').value = countInSection + 1;
    }

    function editProject(id) {
        const p = cachedProjects.find((x) => String(x.id) === id);
        if (!p) return;
        document.getElementById('project-modal-title').textContent = 'Edit Project';
        document.getElementById('project-id').value = p.id;
        document.getElementById('project-existing-image').value = p.image_url || '';
        document.getElementById('project-section').value = p.section || 'engineering';
        document.getElementById('project-title').value = p.title || '';
        document.getElementById('project-description').value = p.description || '';
        document.getElementById('project-website').value = p.link_url || '';
        document.getElementById('project-github').value = p.github_url || '';
        document.getElementById('project-tag').value = p.tag || '';
        document.getElementById('project-sort').value = p.sort_order || 1;
        document.getElementById('project-visible').checked = p.visible !== false;
        document.getElementById('project-featured').checked = !!p.featured;
        projectImageInput.value = '';
        if (p.image_url) { projectImagePreview.src = p.image_url; projectImagePreview.classList.remove('hidden'); }
        else { projectImagePreview.classList.add('hidden'); }
        document.getElementById('project-error').classList.add('hidden');
        openModal('project-modal');
    }

    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('project-error');
        errorEl.classList.add('hidden');
        const submitBtn = projectForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        try {
            let imageUrl = document.getElementById('project-existing-image').value || null;
            const file = projectImageInput.files[0];
            if (file) imageUrl = await uploadTo('project-images', file);

            const row = {
                title: document.getElementById('project-title').value.trim(),
                description: document.getElementById('project-description').value.trim(),
                link_url: document.getElementById('project-website').value.trim() || null,
                github_url: document.getElementById('project-github').value.trim() || null,
                tag: document.getElementById('project-tag').value.trim() || '',
                section: document.getElementById('project-section').value,
                sort_order: Number(document.getElementById('project-sort').value) || 1,
                image_url: imageUrl,
                visible: document.getElementById('project-visible').checked,
                featured: document.getElementById('project-featured').checked,
            };

            const id = document.getElementById('project-id').value;
            const { error } = id ? await client.from('projects').update(row).eq('id', id) : await client.from('projects').insert(row);
            if (error) throw error;

            closeModal(document.getElementById('project-modal-overlay'));
            toast(id ? 'Project updated' : 'Project added');
            loadProjects(); loadStats(); loadRecentActivity();
        } catch (err) {
            errorEl.textContent = err.message || String(err);
            errorEl.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
        }
    });

    // ================= Apps =================

    let cachedApps = [];

    async function loadApps() {
        const list = document.getElementById('apps-admin-list');
        const { data, error } = await client.from('apps').select('*').order('sort_order', { ascending: true });
        if (error) { list.innerHTML = `<p style="color:#ff8a80;">Failed to load: ${escapeHtml(error.message)}</p>`; return; }
        cachedApps = data || [];
        renderApps();
    }

    function renderApps() {
        const list = document.getElementById('apps-admin-list');
        const empty = document.getElementById('apps-empty');
        const search = document.getElementById('app-search').value.toLowerCase();

        const filtered = cachedApps.filter((a) => !search || a.name.toLowerCase().includes(search));

        if (!filtered.length) {
            empty.classList.remove('hidden');
            empty.innerHTML = `<div class="liquid-glass-refractive rounded-3xl p-10 text-center"><span class="material-symbols-outlined text-3xl text-on-surface-variant">apps</span><p class="text-on-surface-variant text-sm mt-2">${cachedApps.length ? 'No apps match your search.' : 'No apps yet — add your first one.'}</p></div>`;
            list.innerHTML = '';
            return;
        }
        empty.classList.add('hidden');

        list.innerHTML = filtered.map((a) => {
            const thumb = a.icon_url
                ? `<img src="${escapeHtml(a.icon_url)}" class="w-14 h-14 rounded-xl object-cover shrink-0">`
                : `<div class="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-on-surface-variant">apps</span></div>`;
            return `<div draggable="true" data-id="${a.id}" class="liquid-glass-refractive rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
<div class="flex items-center gap-3 min-w-0 flex-1">
<span class="material-symbols-outlined drag-handle text-on-surface-variant shrink-0">drag_indicator</span>
${thumb}
<div class="min-w-0 flex-1">
<p class="font-bold">${escapeHtml(a.name)}</p>
<p class="text-on-surface-variant text-sm truncate">${escapeHtml(a.drive_url)}</p>
</div>
</div>
<div class="flex items-center justify-between sm:justify-end gap-2 shrink-0">
<span class="text-xs text-on-surface-variant">#${a.sort_order}</span>
<div class="flex gap-1">
<button data-edit="${a.id}" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">edit</span></button>
<button data-delete="${a.id}" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">delete</span></button>
</div>
</div>
</div>`;
        }).join('');

        list.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editApp(btn.dataset.edit)));
        list.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => {
            const a = cachedApps.find((x) => String(x.id) === btn.dataset.delete);
            confirmDelete(`Delete app "${a?.name}"?`, async () => {
                const { error } = await client.from('apps').delete().eq('id', btn.dataset.delete);
                if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
                toast('App deleted');
                loadApps();
            });
        }));

        enableDragReorder(list, 'apps', loadApps);
    }

    document.getElementById('app-search').addEventListener('input', renderApps);

    const appForm = document.getElementById('app-form');
    const appIconInput = document.getElementById('app-icon');
    const appIconPreview = document.getElementById('app-icon-preview');

    appIconInput.addEventListener('change', () => {
        const file = appIconInput.files[0];
        if (!file) return;
        appIconPreview.src = URL.createObjectURL(file);
        appIconPreview.classList.remove('hidden');
    });

    function resetAppForm() {
        appForm.reset();
        document.getElementById('app-modal-title').textContent = 'Add App';
        document.getElementById('app-id').value = '';
        document.getElementById('app-existing-icon').value = '';
        appIconPreview.classList.add('hidden');
        appIconPreview.src = '';
        document.getElementById('app-error').classList.add('hidden');
        document.getElementById('app-sort').value = cachedApps.length + 1;
    }

    function editApp(id) {
        const a = cachedApps.find((x) => String(x.id) === id);
        if (!a) return;
        document.getElementById('app-modal-title').textContent = 'Edit App';
        document.getElementById('app-id').value = a.id;
        document.getElementById('app-existing-icon').value = a.icon_url || '';
        document.getElementById('app-name').value = a.name || '';
        document.getElementById('app-drive-url').value = a.drive_url || '';
        document.getElementById('app-sort').value = a.sort_order || 1;
        appIconInput.value = '';
        if (a.icon_url) { appIconPreview.src = a.icon_url; appIconPreview.classList.remove('hidden'); }
        else { appIconPreview.classList.add('hidden'); }
        document.getElementById('app-error').classList.add('hidden');
        openModal('app-modal');
    }

    appForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('app-error');
        errorEl.classList.add('hidden');
        const submitBtn = appForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        try {
            let iconUrl = document.getElementById('app-existing-icon').value || null;
            const file = appIconInput.files[0];
            if (file) iconUrl = await uploadTo('project-images', file);

            const row = {
                name: document.getElementById('app-name').value.trim(),
                drive_url: document.getElementById('app-drive-url').value.trim(),
                sort_order: Number(document.getElementById('app-sort').value) || 1,
                icon_url: iconUrl,
            };

            const id = document.getElementById('app-id').value;
            const { error } = id ? await client.from('apps').update(row).eq('id', id) : await client.from('apps').insert(row);
            if (error) throw error;

            closeModal(document.getElementById('app-modal-overlay'));
            toast(id ? 'App updated' : 'App added');
            loadApps();
        } catch (err) {
            errorEl.textContent = err.message || String(err);
            errorEl.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
        }
    });

    // ================= Background Videos =================

    let cachedBgVideos = [];

    async function loadBackgroundVideos() {
        const list = document.getElementById('bg-videos-admin-list');
        if (!list) return;
        const { data, error } = await client.from('background_videos').select('*').order('sort_order', { ascending: true });
        if (error) { list.innerHTML = `<p style="color:#ff8a80;">Failed to load: ${escapeHtml(error.message)}</p>`; return; }
        cachedBgVideos = data || [];
        renderBackgroundVideos();
    }

    function renderBackgroundVideos() {
        const list = document.getElementById('bg-videos-admin-list');
        const empty = document.getElementById('bg-videos-empty');
        if (!list) return;
        const search = (document.getElementById('bg-video-search')?.value || '').toLowerCase();

        const filtered = cachedBgVideos.filter((v) => !search || v.title.toLowerCase().includes(search));

        if (!filtered.length) {
            empty.classList.remove('hidden');
            empty.innerHTML = `<div class="liquid-glass-refractive rounded-3xl p-10 text-center"><span class="material-symbols-outlined text-3xl text-on-surface-variant">videocam_off</span><p class="text-on-surface-variant text-sm mt-2">${cachedBgVideos.length ? 'No background videos match your search.' : 'No background videos yet — add your first one.'}</p></div>`;
            list.innerHTML = '';
            return;
        }
        empty.classList.add('hidden');

        list.innerHTML = filtered.map((v) => {
            const thumb = v.video_url
                ? `<video src="${escapeHtml(v.video_url)}" class="w-16 h-12 rounded-xl object-cover shrink-0" muted></video>`
                : `<div class="w-16 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-on-surface-variant">videocam</span></div>`;
            return `<div draggable="true" data-id="${v.id}" class="liquid-glass-refractive rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
<div class="flex items-center gap-3 min-w-0 flex-1">
<span class="material-symbols-outlined drag-handle text-on-surface-variant shrink-0">drag_indicator</span>
${thumb}
<div class="min-w-0 flex-1">
<div class="flex items-center gap-2 flex-wrap">
<p class="font-bold">${escapeHtml(v.title)}</p>
${v.visible === false ? '<span class="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap" style="background:rgba(255,138,128,0.15); color:#ff8a80;">Hidden in Switcher</span>' : '<span class="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap" style="background:rgba(0,219,233,0.15); color:#7cf3ff;">Active</span>'}
</div>
<p class="text-on-surface-variant text-sm truncate">${escapeHtml(v.video_url)}</p>
</div>
</div>
<div class="flex items-center justify-between sm:justify-end gap-2 shrink-0">
<span class="text-xs text-on-surface-variant">#${v.sort_order}</span>
<span class="toggle-switch" title="Visible in Hero Switcher"><input type="checkbox" data-toggle-visible="${v.id}" ${v.visible === false ? '' : 'checked'}><span class="toggle-track"></span></span>
<div class="flex gap-1">
<button data-edit="${v.id}" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">edit</span></button>
<button data-delete="${v.id}" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">delete</span></button>
</div>
</div>
</div>`;
        }).join('');

        list.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editBackgroundVideo(btn.dataset.edit)));
        list.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => {
            const v = cachedBgVideos.find((x) => String(x.id) === btn.dataset.delete);
            confirmDelete(`Delete video "${v?.title}"?`, async () => {
                const { error } = await client.from('background_videos').delete().eq('id', btn.dataset.delete);
                if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
                toast('Video deleted');
                loadBackgroundVideos();
            });
        }));
        list.querySelectorAll('[data-toggle-visible]').forEach((cb) => cb.addEventListener('change', async () => {
            const { error } = await client.from('background_videos').update({ visible: cb.checked }).eq('id', cb.dataset.toggleVisible);
            if (error) { toast('Update failed: ' + error.message, 'error'); cb.checked = !cb.checked; return; }
            toast(cb.checked ? 'Video shown in switcher' : 'Video hidden from switcher');
            loadBackgroundVideos();
        }));

        enableDragReorder(list, 'background_videos', loadBackgroundVideos);
    }

    document.getElementById('bg-video-search')?.addEventListener('input', renderBackgroundVideos);

    const bgVideoForm = document.getElementById('bg-video-form');
    const bgVideoFileInput = document.getElementById('bg-video-file');
    const bgVideoFilePreview = document.getElementById('bg-video-preview');

    bgVideoFileInput?.addEventListener('change', () => {
        const file = bgVideoFileInput.files[0];
        if (!file) return;
        bgVideoFilePreview.src = URL.createObjectURL(file);
        bgVideoFilePreview.classList.remove('hidden');
    });

    function resetBackgroundVideoForm() {
        bgVideoForm.reset();
        document.getElementById('bg-video-modal-title').textContent = 'Add Background Video';
        document.getElementById('bg-video-id').value = '';
        document.getElementById('bg-video-existing-url').value = '';
        if (bgVideoFilePreview) {
            bgVideoFilePreview.classList.add('hidden');
            bgVideoFilePreview.src = '';
        }
        document.getElementById('bg-video-visible').checked = true;
        document.getElementById('bg-video-error').classList.add('hidden');
        document.getElementById('bg-video-sort').value = cachedBgVideos.length + 1;
    }

    function editBackgroundVideo(id) {
        const v = cachedBgVideos.find((x) => String(x.id) === id);
        if (!v) return;
        document.getElementById('bg-video-modal-title').textContent = 'Edit Background Video';
        document.getElementById('bg-video-id').value = v.id;
        document.getElementById('bg-video-existing-url').value = v.video_url || '';
        document.getElementById('bg-video-title').value = v.title || '';
        document.getElementById('bg-video-url').value = v.video_url || '';
        document.getElementById('bg-video-sort').value = v.sort_order || 1;
        document.getElementById('bg-video-visible').checked = v.visible !== false;
        if (bgVideoFileInput) bgVideoFileInput.value = '';
        if (v.video_url) {
            bgVideoFilePreview.src = v.video_url;
            bgVideoFilePreview.classList.remove('hidden');
        } else {
            bgVideoFilePreview.classList.add('hidden');
        }
        document.getElementById('bg-video-error').classList.add('hidden');
        openModal('bg-video-modal');
    }

    bgVideoForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('bg-video-error');
        errorEl.classList.add('hidden');
        const submitBtn = bgVideoForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        try {
            let videoUrl = document.getElementById('bg-video-url').value.trim() || document.getElementById('bg-video-existing-url').value || '';
            const file = bgVideoFileInput.files[0];
            if (file) videoUrl = await uploadTo('project-images', file);

            if (!videoUrl) {
                throw new Error('Please upload a video file or provide a video URL.');
            }

            const row = {
                title: document.getElementById('bg-video-title').value.trim(),
                video_url: videoUrl,
                sort_order: Number(document.getElementById('bg-video-sort').value) || 1,
                visible: document.getElementById('bg-video-visible').checked,
            };

            const id = document.getElementById('bg-video-id').value;
            const { error } = id ? await client.from('background_videos').update(row).eq('id', id) : await client.from('background_videos').insert(row);
            if (error) throw error;

            closeModal(document.getElementById('bg-video-modal-overlay'));
            toast(id ? 'Background video updated' : 'Background video added');
            loadBackgroundVideos();
        } catch (err) {
            errorEl.textContent = err.message || String(err);
            errorEl.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
        }
    });

    // ================= Skills =================

    let cachedSkills = [];

    async function loadSkills() {
        const list = document.getElementById('skills-admin-list');
        const { data, error } = await client.from('skills').select('*').order('category', { ascending: true }).order('sort_order', { ascending: true });
        if (error) { list.innerHTML = `<p style="color:#ff8a80;">Failed to load: ${escapeHtml(error.message)}</p>`; return; }
        cachedSkills = data || [];

        const filterSelect = document.getElementById('skill-filter');
        const categories = [...new Set(cachedSkills.map((s) => s.category))];
        const current = filterSelect.value;
        filterSelect.innerHTML = '<option value="">All categories</option>' + categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
        filterSelect.value = categories.includes(current) ? current : '';

        renderSkills();
    }

    function renderSkills() {
        const list = document.getElementById('skills-admin-list');
        const empty = document.getElementById('skills-empty');
        const search = document.getElementById('skill-search').value.toLowerCase();
        const filter = document.getElementById('skill-filter').value;

        const filtered = cachedSkills.filter((s) => {
            const matchesSearch = !search || s.name.toLowerCase().includes(search) || s.category.toLowerCase().includes(search);
            const matchesFilter = !filter || s.category === filter;
            return matchesSearch && matchesFilter;
        });

        if (!filtered.length) {
            empty.classList.remove('hidden');
            empty.innerHTML = `<div class="liquid-glass-refractive rounded-3xl p-10 text-center"><span class="material-symbols-outlined text-3xl text-on-surface-variant">bolt</span><p class="text-on-surface-variant text-sm mt-2">${cachedSkills.length ? 'No skills match your search.' : 'No skills yet — add your first one.'}</p></div>`;
            list.innerHTML = '';
            return;
        }
        empty.classList.add('hidden');

        const groups = [];
        const byCategory = {};
        filtered.forEach((s) => {
            if (!byCategory[s.category]) { byCategory[s.category] = []; groups.push(s.category); }
            byCategory[s.category].push(s);
        });

        list.innerHTML = groups.map((cat) => `<div>
<h3 class="font-bold text-sm text-on-surface-variant uppercase tracking-widest mb-2">${escapeHtml(cat)}</h3>
<div class="flex flex-col gap-2 skill-group" data-category="${escapeHtml(cat)}">
${byCategory[cat].map((s) => `<div draggable="true" data-id="${s.id}" class="liquid-glass-refractive rounded-2xl p-3 flex items-center gap-3">
<span class="material-symbols-outlined drag-handle text-on-surface-variant text-lg">drag_indicator</span>
<span class="material-symbols-outlined text-primary-container">${escapeHtml(s.icon || 'code')}</span>
<span class="font-bold text-sm flex-1">${escapeHtml(s.name)}</span>
${s.level ? `<span class="text-[10px] px-2 py-0.5 rounded-full liquid-glass-refractive">${escapeHtml(s.level)}</span>` : ''}
<button data-edit="${s.id}" class="liquid-glass-refractive liquid-glass-interactive w-8 h-8 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-sm">edit</span></button>
<button data-delete="${s.id}" class="liquid-glass-refractive liquid-glass-interactive w-8 h-8 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-sm">delete</span></button>
</div>`).join('')}
</div>
</div>`).join('');

        list.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editSkill(btn.dataset.edit)));
        list.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => {
            const s = cachedSkills.find((x) => String(x.id) === btn.dataset.delete);
            confirmDelete(`Delete skill "${s?.name}"?`, async () => {
                const { error } = await client.from('skills').delete().eq('id', btn.dataset.delete);
                if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
                toast('Skill deleted');
                loadSkills(); loadStats();
            });
        }));
        list.querySelectorAll('.skill-group').forEach((group) => enableDragReorder(group, 'skills', loadSkills));
    }

    document.getElementById('skill-search').addEventListener('input', renderSkills);
    document.getElementById('skill-filter').addEventListener('change', renderSkills);

    const skillForm = document.getElementById('skill-form');
    function resetSkillForm() {
        skillForm.reset();
        document.getElementById('skill-modal-title').textContent = 'Add Skill';
        document.getElementById('skill-id').value = '';
        document.getElementById('skill-sort').value = 0;
        document.getElementById('skill-error').classList.add('hidden');
    }
    function editSkill(id) {
        const s = cachedSkills.find((x) => String(x.id) === id);
        if (!s) return;
        document.getElementById('skill-modal-title').textContent = 'Edit Skill';
        document.getElementById('skill-id').value = s.id;
        document.getElementById('skill-category').value = s.category || '';
        document.getElementById('skill-icon').value = s.icon || '';
        document.getElementById('skill-name').value = s.name || '';
        document.getElementById('skill-level').value = s.level || '';
        document.getElementById('skill-sort').value = s.sort_order || 0;
        document.getElementById('skill-error').classList.add('hidden');
        openModal('skill-modal');
    }
    skillForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('skill-error');
        errorEl.classList.add('hidden');
        const row = {
            category: document.getElementById('skill-category').value.trim(),
            icon: document.getElementById('skill-icon').value.trim() || 'code',
            name: document.getElementById('skill-name').value.trim(),
            level: document.getElementById('skill-level').value,
            sort_order: Number(document.getElementById('skill-sort').value) || 0,
        };
        const id = document.getElementById('skill-id').value;
        const { error } = id ? await client.from('skills').update(row).eq('id', id) : await client.from('skills').insert(row);
        if (error) { errorEl.textContent = error.message; errorEl.classList.remove('hidden'); return; }
        closeModal(document.getElementById('skill-modal-overlay'));
        toast(id ? 'Skill updated' : 'Skill added');
        loadSkills(); loadStats(); loadRecentActivity();
    });

    // ================= Experience =================

    let cachedExperience = [];

    async function loadExperience() {
        const list = document.getElementById('experience-admin-list');
        const { data, error } = await client.from('experience').select('*').order('sort_order', { ascending: true });
        if (error) { list.innerHTML = `<p style="color:#ff8a80;">Failed to load: ${escapeHtml(error.message)}</p>`; return; }
        cachedExperience = data || [];
        renderExperience();
    }

    function renderExperience() {
        const list = document.getElementById('experience-admin-list');
        const empty = document.getElementById('experience-empty');
        const search = document.getElementById('experience-search').value.toLowerCase();
        const filtered = cachedExperience.filter((x) => !search || x.title.toLowerCase().includes(search) || (x.organization || '').toLowerCase().includes(search));

        if (!filtered.length) {
            empty.classList.remove('hidden');
            empty.innerHTML = `<div class="liquid-glass-refractive rounded-3xl p-10 text-center"><span class="material-symbols-outlined text-3xl text-on-surface-variant">business_center</span><p class="text-on-surface-variant text-sm mt-2">${cachedExperience.length ? 'No matches.' : 'No experience entries yet.'}</p></div>`;
            list.innerHTML = '';
            return;
        }
        empty.classList.add('hidden');

        list.innerHTML = filtered.map((x) => {
            const thumb = x.image_url
                ? `<img src="${escapeHtml(x.image_url)}" class="w-12 h-12 rounded-xl object-cover shrink-0">`
                : `<div class="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-on-surface-variant text-lg">business_center</span></div>`;
            return `<div draggable="true" data-id="${x.id}" class="liquid-glass-refractive rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
<div class="flex items-center gap-3 min-w-0 flex-1">
<span class="material-symbols-outlined drag-handle text-on-surface-variant shrink-0">drag_indicator</span>
${thumb}
<div class="min-w-0 flex-1">
<p class="font-bold truncate">${escapeHtml(x.title)}</p>
<p class="text-on-surface-variant text-sm truncate">${escapeHtml(x.organization)} · ${escapeHtml([x.start_date, x.end_date].filter(Boolean).join(' — '))}</p>
</div>
</div>
<div class="flex gap-1 justify-end shrink-0">
<button data-duplicate="${x.id}" title="Duplicate" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">content_copy</span></button>
<button data-edit="${x.id}" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">edit</span></button>
<button data-delete="${x.id}" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">delete</span></button>
</div>
</div>`;
        }).join('');

        list.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editExperience(btn.dataset.edit)));
        list.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => {
            const x = cachedExperience.find((r) => String(r.id) === btn.dataset.delete);
            confirmDelete(`Delete "${x?.title}"?`, async () => {
                const { error } = await client.from('experience').delete().eq('id', btn.dataset.delete);
                if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
                toast('Experience deleted');
                loadExperience(); loadStats();
            });
        }));
        list.querySelectorAll('[data-duplicate]').forEach((btn) => btn.addEventListener('click', async () => {
            const x = cachedExperience.find((r) => String(r.id) === btn.dataset.duplicate);
            if (!x) return;
            const { id, created_at, ...rest } = x;
            rest.title = `${rest.title} (Copy)`;
            const { error } = await client.from('experience').insert(rest);
            if (error) { toast('Duplicate failed: ' + error.message, 'error'); return; }
            toast('Experience duplicated');
            loadExperience(); loadStats();
        }));
        enableDragReorder(list, 'experience', loadExperience);
    }
    document.getElementById('experience-search').addEventListener('input', renderExperience);

    const experienceForm = document.getElementById('experience-form');
    const experienceImageInput = document.getElementById('experience-image');
    const experienceImagePreview = document.getElementById('experience-image-preview');
    experienceImageInput.addEventListener('change', () => {
        const file = experienceImageInput.files[0];
        if (!file) return;
        experienceImagePreview.src = URL.createObjectURL(file);
        experienceImagePreview.classList.remove('hidden');
    });
    function resetExperienceForm() {
        experienceForm.reset();
        document.getElementById('experience-modal-title').textContent = 'Add Experience';
        document.getElementById('experience-id').value = '';
        document.getElementById('experience-existing-image').value = '';
        experienceImagePreview.classList.add('hidden');
        experienceImagePreview.src = '';
        document.getElementById('experience-sort').value = cachedExperience.length + 1;
        document.getElementById('experience-error').classList.add('hidden');
    }
    function editExperience(id) {
        const x = cachedExperience.find((r) => String(r.id) === id);
        if (!x) return;
        document.getElementById('experience-modal-title').textContent = 'Edit Experience';
        document.getElementById('experience-id').value = x.id;
        document.getElementById('experience-existing-image').value = x.image_url || '';
        document.getElementById('experience-title').value = x.title || '';
        document.getElementById('experience-organization').value = x.organization || '';
        document.getElementById('experience-website').value = x.website_url || '';
        document.getElementById('experience-start').value = x.start_date || '';
        document.getElementById('experience-end').value = x.end_date || '';
        document.getElementById('experience-description').value = x.description || '';
        document.getElementById('experience-sort').value = x.sort_order || 0;
        experienceImageInput.value = '';
        if (x.image_url) { experienceImagePreview.src = x.image_url; experienceImagePreview.classList.remove('hidden'); }
        else experienceImagePreview.classList.add('hidden');
        document.getElementById('experience-error').classList.add('hidden');
        openModal('experience-modal');
    }
    experienceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('experience-error');
        errorEl.classList.add('hidden');
        const submitBtn = experienceForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        try {
            let imageUrl = document.getElementById('experience-existing-image').value || null;
            const file = experienceImageInput.files[0];
            if (file) imageUrl = await uploadTo('project-images', file);
            const row = {
                title: document.getElementById('experience-title').value.trim(),
                organization: document.getElementById('experience-organization').value.trim(),
                website_url: document.getElementById('experience-website').value.trim() || null,
                start_date: document.getElementById('experience-start').value.trim(),
                end_date: document.getElementById('experience-end').value.trim(),
                description: document.getElementById('experience-description').value.trim(),
                image_url: imageUrl,
                sort_order: Number(document.getElementById('experience-sort').value) || 0,
            };
            const id = document.getElementById('experience-id').value;
            const { error } = id ? await client.from('experience').update(row).eq('id', id) : await client.from('experience').insert(row);
            if (error) throw error;
            closeModal(document.getElementById('experience-modal-overlay'));
            toast(id ? 'Experience updated' : 'Experience added');
            loadExperience(); loadStats(); loadRecentActivity();
        } catch (err) {
            errorEl.textContent = err.message || String(err);
            errorEl.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
        }
    });

    // ================= Education =================

    let cachedEducation = [];

    async function loadEducation() {
        const list = document.getElementById('education-admin-list');
        const { data, error } = await client.from('education').select('*').order('sort_order', { ascending: true });
        if (error) { list.innerHTML = `<p style="color:#ff8a80;">Failed to load: ${escapeHtml(error.message)}</p>`; return; }
        cachedEducation = data || [];
        renderEducation();
    }

    function renderEducation() {
        const list = document.getElementById('education-admin-list');
        const empty = document.getElementById('education-empty');
        const search = document.getElementById('education-search').value.toLowerCase();
        const filtered = cachedEducation.filter((x) => !search || x.degree.toLowerCase().includes(search) || (x.institution || '').toLowerCase().includes(search));

        if (!filtered.length) {
            empty.classList.remove('hidden');
            empty.innerHTML = `<div class="liquid-glass-refractive rounded-3xl p-10 text-center"><span class="material-symbols-outlined text-3xl text-on-surface-variant">school</span><p class="text-on-surface-variant text-sm mt-2">${cachedEducation.length ? 'No matches.' : 'No education entries yet.'}</p></div>`;
            list.innerHTML = '';
            return;
        }
        empty.classList.add('hidden');

        list.innerHTML = filtered.map((x) => `<div draggable="true" data-id="${x.id}" class="liquid-glass-refractive rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
<div class="flex items-center gap-3 min-w-0 flex-1">
<span class="material-symbols-outlined drag-handle text-on-surface-variant shrink-0">drag_indicator</span>
<div class="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-xs font-bold">${escapeHtml(x.short_name || '?')}</div>
<div class="min-w-0 flex-1">
<p class="font-bold truncate">${escapeHtml(x.degree)}</p>
<p class="text-on-surface-variant text-sm truncate">${escapeHtml(x.institution)} · ${escapeHtml([x.start_date, x.end_date].filter(Boolean).join(' — ') || 'In progress')}${x.grade ? ' · ' + escapeHtml(x.grade) : ''}</p>
</div>
</div>
<div class="flex gap-1 justify-end shrink-0">
<button data-duplicate="${x.id}" title="Duplicate" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">content_copy</span></button>
<button data-edit="${x.id}" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">edit</span></button>
<button data-delete="${x.id}" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">delete</span></button>
</div>
</div>`).join('');

        list.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editEducation(btn.dataset.edit)));
        list.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => {
            const x = cachedEducation.find((r) => String(r.id) === btn.dataset.delete);
            confirmDelete(`Delete "${x?.degree}"?`, async () => {
                const { error } = await client.from('education').delete().eq('id', btn.dataset.delete);
                if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
                toast('Education deleted');
                loadEducation(); loadStats();
            });
        }));
        list.querySelectorAll('[data-duplicate]').forEach((btn) => btn.addEventListener('click', async () => {
            const x = cachedEducation.find((r) => String(r.id) === btn.dataset.duplicate);
            if (!x) return;
            const { id, created_at, ...rest } = x;
            rest.degree = `${rest.degree} (Copy)`;
            const { error } = await client.from('education').insert(rest);
            if (error) { toast('Duplicate failed: ' + error.message, 'error'); return; }
            toast('Education duplicated');
            loadEducation(); loadStats();
        }));
        enableDragReorder(list, 'education', loadEducation);
    }
    document.getElementById('education-search').addEventListener('input', renderEducation);

    const educationForm = document.getElementById('education-form');
    function resetEducationForm() {
        educationForm.reset();
        document.getElementById('education-modal-title').textContent = 'Add Education';
        document.getElementById('education-id').value = '';
        document.getElementById('education-sort').value = cachedEducation.length + 1;
        document.getElementById('education-error').classList.add('hidden');
    }
    function editEducation(id) {
        const x = cachedEducation.find((r) => String(r.id) === id);
        if (!x) return;
        document.getElementById('education-modal-title').textContent = 'Edit Education';
        document.getElementById('education-id').value = x.id;
        document.getElementById('education-degree').value = x.degree || '';
        document.getElementById('education-short-name').value = x.short_name || '';
        document.getElementById('education-institution').value = x.institution || '';
        document.getElementById('education-start').value = x.start_date || '';
        document.getElementById('education-end').value = x.end_date || '';
        document.getElementById('education-grade').value = x.grade || '';
        document.getElementById('education-description').value = x.description || '';
        document.getElementById('education-sort').value = x.sort_order || 0;
        document.getElementById('education-error').classList.add('hidden');
        openModal('education-modal');
    }
    educationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('education-error');
        errorEl.classList.add('hidden');
        const row = {
            degree: document.getElementById('education-degree').value.trim(),
            short_name: document.getElementById('education-short-name').value.trim(),
            institution: document.getElementById('education-institution').value.trim(),
            start_date: document.getElementById('education-start').value.trim(),
            end_date: document.getElementById('education-end').value.trim(),
            grade: document.getElementById('education-grade').value.trim(),
            description: document.getElementById('education-description').value.trim(),
            sort_order: Number(document.getElementById('education-sort').value) || 0,
        };
        const id = document.getElementById('education-id').value;
        const { error } = id ? await client.from('education').update(row).eq('id', id) : await client.from('education').insert(row);
        if (error) { errorEl.textContent = error.message; errorEl.classList.remove('hidden'); return; }
        closeModal(document.getElementById('education-modal-overlay'));
        toast(id ? 'Education updated' : 'Education added');
        loadEducation(); loadStats(); loadRecentActivity();
    });

    // ================= Testimonials =================

    let cachedTestimonials = [];

    async function loadTestimonials() {
        const list = document.getElementById('testimonials-admin-list');
        const { data, error } = await client.from('testimonials').select('*').order('sort_order', { ascending: true });
        if (error) { list.innerHTML = `<p style="color:#ff8a80;">Failed to load: ${escapeHtml(error.message)}</p>`; return; }
        cachedTestimonials = data || [];
        renderTestimonials();
    }

    function renderTestimonials() {
        const list = document.getElementById('testimonials-admin-list');
        const empty = document.getElementById('testimonials-empty');
        const search = document.getElementById('testimonial-search').value.toLowerCase();
        const filtered = cachedTestimonials.filter((x) => !search || x.client_name.toLowerCase().includes(search) || (x.quote || '').toLowerCase().includes(search));

        if (!filtered.length) {
            empty.classList.remove('hidden');
            empty.innerHTML = `<div class="liquid-glass-refractive rounded-3xl p-10 text-center col-span-full"><span class="material-symbols-outlined text-3xl text-on-surface-variant">format_quote</span><p class="text-on-surface-variant text-sm mt-2">${cachedTestimonials.length ? 'No matches.' : 'No testimonials yet.'}</p></div>`;
            list.innerHTML = '';
            return;
        }
        empty.classList.add('hidden');

        list.innerHTML = filtered.map((x) => {
            const photo = x.photo_url
                ? `<img src="${escapeHtml(x.photo_url)}" class="w-10 h-10 rounded-full object-cover shrink-0">`
                : `<div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-on-surface-variant text-base">person</span></div>`;
            const stars = '★'.repeat(Math.max(0, Math.min(5, Number(x.rating) || 0)));
            return `<div draggable="true" data-id="${x.id}" class="liquid-glass-refractive rounded-3xl p-4 flex flex-col gap-2">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined drag-handle text-on-surface-variant text-lg">drag_indicator</span>
${photo}
<div class="min-w-0 flex-1">
<p class="font-bold text-sm truncate">${escapeHtml(x.client_name)} <span class="text-primary-container text-xs">${stars}</span></p>
<p class="text-on-surface-variant text-xs truncate">${escapeHtml([x.position, x.company].filter(Boolean).join(' · '))}</p>
</div>
<span class="text-[10px] px-2 py-0.5 rounded-full liquid-glass-refractive uppercase tracking-wide whitespace-nowrap shrink-0">${escapeHtml(SECTION_LABELS[x.section] || 'Engineering Work')}</span>
<span class="toggle-switch shrink-0" title="Visible"><input type="checkbox" data-toggle-visible="${x.id}" ${x.visible === false ? '' : 'checked'}><span class="toggle-track"></span></span>
</div>
<p class="text-on-surface-variant text-sm line-clamp-2">${escapeHtml(x.quote)}</p>
<div class="flex gap-1 justify-end">
<button data-duplicate="${x.id}" title="Duplicate" class="liquid-glass-refractive liquid-glass-interactive w-8 h-8 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-sm">content_copy</span></button>
<button data-edit="${x.id}" class="liquid-glass-refractive liquid-glass-interactive w-8 h-8 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-sm">edit</span></button>
<button data-delete="${x.id}" class="liquid-glass-refractive liquid-glass-interactive w-8 h-8 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-sm">delete</span></button>
</div>
</div>`;
        }).join('');

        list.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editTestimonial(btn.dataset.edit)));
        list.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => {
            const x = cachedTestimonials.find((r) => String(r.id) === btn.dataset.delete);
            confirmDelete(`Delete testimonial from "${x?.client_name}"?`, async () => {
                const { error } = await client.from('testimonials').delete().eq('id', btn.dataset.delete);
                if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
                toast('Testimonial deleted');
                loadTestimonials(); loadStats();
            });
        }));
        list.querySelectorAll('[data-duplicate]').forEach((btn) => btn.addEventListener('click', async () => {
            const x = cachedTestimonials.find((r) => String(r.id) === btn.dataset.duplicate);
            if (!x) return;
            const { id, created_at, ...rest } = x;
            rest.client_name = `${rest.client_name} (Copy)`;
            const { error } = await client.from('testimonials').insert(rest);
            if (error) { toast('Duplicate failed: ' + error.message, 'error'); return; }
            toast('Testimonial duplicated');
            loadTestimonials(); loadStats();
        }));
        list.querySelectorAll('[data-toggle-visible]').forEach((cb) => cb.addEventListener('change', async () => {
            const { error } = await client.from('testimonials').update({ visible: cb.checked }).eq('id', cb.dataset.toggleVisible);
            if (error) { toast('Update failed: ' + error.message, 'error'); cb.checked = !cb.checked; return; }
            toast(cb.checked ? 'Testimonial shown' : 'Testimonial hidden');
            loadTestimonials();
        }));
        enableDragReorder(list, 'testimonials', loadTestimonials);
    }
    document.getElementById('testimonial-search').addEventListener('input', renderTestimonials);

    const testimonialForm = document.getElementById('testimonial-form');
    const testimonialPhotoInput = document.getElementById('testimonial-photo');
    const testimonialPhotoPreview = document.getElementById('testimonial-photo-preview');
    testimonialPhotoInput.addEventListener('change', () => {
        const file = testimonialPhotoInput.files[0];
        if (!file) return;
        testimonialPhotoPreview.src = URL.createObjectURL(file);
        testimonialPhotoPreview.classList.remove('hidden');
    });
    function resetTestimonialForm() {
        testimonialForm.reset();
        document.getElementById('testimonial-modal-title').textContent = 'Add Testimonial';
        document.getElementById('testimonial-id').value = '';
        document.getElementById('testimonial-existing-photo').value = '';
        testimonialPhotoPreview.classList.add('hidden');
        testimonialPhotoPreview.src = '';
        document.getElementById('testimonial-rating').value = 5;
        document.getElementById('testimonial-section').value = 'engineering';
        document.getElementById('testimonial-sort').value = cachedTestimonials.length + 1;
        document.getElementById('testimonial-visible').checked = true;
        document.getElementById('testimonial-error').classList.add('hidden');
    }
    function editTestimonial(id) {
        const x = cachedTestimonials.find((r) => String(r.id) === id);
        if (!x) return;
        document.getElementById('testimonial-modal-title').textContent = 'Edit Testimonial';
        document.getElementById('testimonial-id').value = x.id;
        document.getElementById('testimonial-existing-photo').value = x.photo_url || '';
        document.getElementById('testimonial-client').value = x.client_name || '';
        document.getElementById('testimonial-position').value = x.position || '';
        document.getElementById('testimonial-company').value = x.company || '';
        document.getElementById('testimonial-quote').value = x.quote || '';
        document.getElementById('testimonial-rating').value = x.rating || 5;
        document.getElementById('testimonial-section').value = x.section || 'engineering';
        document.getElementById('testimonial-sort').value = x.sort_order || 0;
        document.getElementById('testimonial-visible').checked = x.visible !== false;
        testimonialPhotoInput.value = '';
        if (x.photo_url) { testimonialPhotoPreview.src = x.photo_url; testimonialPhotoPreview.classList.remove('hidden'); }
        else testimonialPhotoPreview.classList.add('hidden');
        document.getElementById('testimonial-error').classList.add('hidden');
        openModal('testimonial-modal');
    }
    testimonialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('testimonial-error');
        errorEl.classList.add('hidden');
        const submitBtn = testimonialForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        try {
            let photoUrl = document.getElementById('testimonial-existing-photo').value || null;
            const file = testimonialPhotoInput.files[0];
            if (file) photoUrl = await uploadTo('project-images', file);
            const row = {
                client_name: document.getElementById('testimonial-client').value.trim(),
                section: document.getElementById('testimonial-section').value,
                position: document.getElementById('testimonial-position').value.trim(),
                company: document.getElementById('testimonial-company').value.trim(),
                photo_url: photoUrl,
                quote: document.getElementById('testimonial-quote').value.trim(),
                rating: Math.max(1, Math.min(5, Number(document.getElementById('testimonial-rating').value) || 5)),
                sort_order: Number(document.getElementById('testimonial-sort').value) || 0,
                visible: document.getElementById('testimonial-visible').checked,
            };
            const id = document.getElementById('testimonial-id').value;
            const { error } = id ? await client.from('testimonials').update(row).eq('id', id) : await client.from('testimonials').insert(row);
            if (error) throw error;
            closeModal(document.getElementById('testimonial-modal-overlay'));
            toast(id ? 'Testimonial updated' : 'Testimonial added');
            loadTestimonials(); loadStats(); loadRecentActivity();
        } catch (err) {
            errorEl.textContent = err.message || String(err);
            errorEl.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
        }
    });

    // ================= Social Links =================

    let cachedSocial = [];

    async function loadSocialLinks() {
        const list = document.getElementById('social-admin-list');
        const { data, error } = await client.from('social_links').select('*').order('sort_order', { ascending: true });
        if (error) { list.innerHTML = `<p style="color:#ff8a80;">Failed to load: ${escapeHtml(error.message)}</p>`; return; }
        cachedSocial = data || [];
        renderSocialLinks();
    }

    function renderSocialLinks() {
        const list = document.getElementById('social-admin-list');
        const empty = document.getElementById('social-empty');
        if (!cachedSocial.length) {
            empty.classList.remove('hidden');
            empty.innerHTML = `<div class="liquid-glass-refractive rounded-3xl p-10 text-center"><span class="material-symbols-outlined text-3xl text-on-surface-variant">share</span><p class="text-on-surface-variant text-sm mt-2">No links yet.</p></div>`;
            list.innerHTML = '';
            return;
        }
        empty.classList.add('hidden');
        list.innerHTML = cachedSocial.map((s) => `<div draggable="true" data-id="${s.id}" class="liquid-glass-refractive rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
<div class="flex items-center gap-3 min-w-0 flex-1">
<span class="material-symbols-outlined drag-handle text-on-surface-variant shrink-0">drag_indicator</span>
<div class="min-w-0 flex-1">
<p class="font-bold">${escapeHtml(s.label)}</p>
<p class="text-on-surface-variant text-sm truncate">${escapeHtml(s.url)}</p>
</div>
</div>
<div class="flex items-center justify-between sm:justify-end gap-2 shrink-0">
<span class="toggle-switch" title="Visible"><input type="checkbox" data-toggle-visible="${s.id}" ${s.visible === false ? '' : 'checked'}><span class="toggle-track"></span></span>
<div class="flex gap-1">
<button data-edit="${s.id}" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">edit</span></button>
<button data-delete="${s.id}" class="liquid-glass-refractive liquid-glass-interactive w-9 h-9 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-base">delete</span></button>
</div>
</div>
</div>`).join('');

        list.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editSocial(btn.dataset.edit)));
        list.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => {
            const s = cachedSocial.find((r) => String(r.id) === btn.dataset.delete);
            confirmDelete(`Delete "${s?.label}" link?`, async () => {
                const { error } = await client.from('social_links').delete().eq('id', btn.dataset.delete);
                if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
                toast('Link deleted');
                loadSocialLinks();
            });
        }));
        list.querySelectorAll('[data-toggle-visible]').forEach((cb) => cb.addEventListener('change', async () => {
            const { error } = await client.from('social_links').update({ visible: cb.checked }).eq('id', cb.dataset.toggleVisible);
            if (error) { toast('Update failed: ' + error.message, 'error'); cb.checked = !cb.checked; return; }
            toast(cb.checked ? 'Link shown' : 'Link hidden');
            loadSocialLinks();
        }));
        enableDragReorder(list, 'social_links', loadSocialLinks);
    }

    const socialForm = document.getElementById('social-form');
    function resetSocialForm() {
        socialForm.reset();
        document.getElementById('social-modal-title').textContent = 'Add Link';
        document.getElementById('social-id').value = '';
        document.getElementById('social-sort').value = cachedSocial.length + 1;
        document.getElementById('social-visible').checked = true;
        document.getElementById('social-error').classList.add('hidden');
    }
    function editSocial(id) {
        const s = cachedSocial.find((r) => String(r.id) === id);
        if (!s) return;
        document.getElementById('social-modal-title').textContent = 'Edit Link';
        document.getElementById('social-id').value = s.id;
        document.getElementById('social-label').value = s.label || '';
        document.getElementById('social-url').value = s.url || '';
        document.getElementById('social-sort').value = s.sort_order || 0;
        document.getElementById('social-visible').checked = s.visible !== false;
        document.getElementById('social-error').classList.add('hidden');
        openModal('social-modal');
    }
    socialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('social-error');
        errorEl.classList.add('hidden');
        const row = {
            label: document.getElementById('social-label').value.trim(),
            url: document.getElementById('social-url').value.trim(),
            sort_order: Number(document.getElementById('social-sort').value) || 0,
            visible: document.getElementById('social-visible').checked,
        };
        const id = document.getElementById('social-id').value;
        const { error } = id ? await client.from('social_links').update(row).eq('id', id) : await client.from('social_links').insert(row);
        if (error) { errorEl.textContent = error.message; errorEl.classList.remove('hidden'); return; }
        closeModal(document.getElementById('social-modal-overlay'));
        toast(id ? 'Link updated' : 'Link added');
        loadSocialLinks();
    });
})();
