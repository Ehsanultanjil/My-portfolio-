(function () {
    const client = window.supabaseClient;

    const notConfiguredView = document.getElementById('not-configured-view');
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');

    if (!client) {
        notConfiguredView.classList.remove('hidden');
        return;
    }

    // ---------- Auth ----------

    function showLoggedOut() {
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
    }

    function showLoggedIn() {
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        loadProjects();
        loadSkills();
        loadStats();
    }

    // ---------- Stats ----------

    async function loadStats() {
        const [projectsCount, skillsCount, viewsCount] = await Promise.all([
            client.from('projects').select('*', { count: 'exact', head: true }),
            client.from('skills').select('*', { count: 'exact', head: true }),
            client.from('page_views').select('*', { count: 'exact', head: true }),
        ]);

        // count comes back null (not just .error set) when a table doesn't
        // exist yet -- e.g. page_views before migration_3 has been run --
        // so check both, or "0 projects" and "not migrated yet" look identical.
        const displayCount = (result) => (result.error || result.count == null) ? '—' : result.count;

        document.getElementById('stat-projects').textContent = displayCount(projectsCount);
        document.getElementById('stat-skills').textContent = displayCount(skillsCount);
        document.getElementById('stat-visitors').textContent = displayCount(viewsCount);
    }

    // ---------- Accordion (Projects / Skills sections) ----------
    // Only one section open at a time; clicking the open one closes it.

    const accordionToggles = document.querySelectorAll('.accordion-toggle');

    function openAccordion(name) {
        accordionToggles.forEach((toggle) => {
            const isTarget = toggle.dataset.accordion === name;
            const panel = document.querySelector(`.accordion-panel[data-panel="${toggle.dataset.accordion}"]`);
            const chevron = toggle.querySelector('.material-symbols-outlined');
            panel.classList.toggle('hidden', !isTarget);
            toggle.setAttribute('aria-expanded', String(isTarget));
            chevron.style.transform = isTarget ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    }

    function closeAllAccordions() {
        accordionToggles.forEach((toggle) => {
            const panel = document.querySelector(`.accordion-panel[data-panel="${toggle.dataset.accordion}"]`);
            panel.classList.add('hidden');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.querySelector('.material-symbols-outlined').style.transform = 'rotate(0deg)';
        });
    }

    accordionToggles.forEach((toggle) => {
        toggle.addEventListener('click', () => {
            const name = toggle.dataset.accordion;
            const isOpen = toggle.getAttribute('aria-expanded') === 'true';
            isOpen ? closeAllAccordions() : openAccordion(name);
        });
    });

    document.getElementById('quick-add-project').addEventListener('click', () => {
        openAccordion('projects');
        document.getElementById('project-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('project-title').focus();
    });

    document.getElementById('quick-add-skill').addEventListener('click', () => {
        openAccordion('skills');
        document.getElementById('skill-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('skill-category').focus();
    });

    client.auth.getSession().then(({ data }) => {
        if (data.session) {
            showLoggedIn();
        } else {
            showLoggedOut();
        }
    });

    client.auth.onAuthStateChange((_event, session) => {
        if (session) {
            showLoggedIn();
        } else {
            showLoggedOut();
        }
    });

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

    document.getElementById('logout-btn').addEventListener('click', () => {
        client.auth.signOut();
    });

    // ---------- Shared helpers ----------

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str == null ? '' : String(str);
        return div.innerHTML;
    }

    function rowCard(innerHtml) {
        return `<div class="liquid-glass-refractive rounded-3xl p-4 flex items-center justify-between gap-4">${innerHtml}</div>`;
    }

    // ---------- Projects ----------

    const projectForm = document.getElementById('project-form');
    const projectIdField = document.getElementById('project-id');
    const projectExistingImageField = document.getElementById('project-existing-image');
    const projectSectionField = document.getElementById('project-section');
    const projectSortField = document.getElementById('project-sort');
    const projectImageInput = document.getElementById('project-image');
    const projectImagePreview = document.getElementById('project-image-preview');
    const projectCancelBtn = document.getElementById('project-cancel');
    const projectError = document.getElementById('project-error');

    const SECTION_LABELS = { engineering: 'Engineering Work', community: 'Community Work' };

    let cachedProjects = [];

    // Live preview of a newly-chosen photo before saving.
    projectImageInput.addEventListener('change', () => {
        const file = projectImageInput.files[0];
        if (!file) return;
        projectImagePreview.src = URL.createObjectURL(file);
        projectImagePreview.classList.remove('hidden');
    });

    // Suggest the next position automatically (only while adding new, not editing).
    function suggestNextSortOrder() {
        if (projectIdField.value) return; // don't override while editing an existing card
        const section = projectSectionField.value;
        const countInSection = cachedProjects.filter((p) => (p.section || 'engineering') === section).length;
        projectSortField.value = countInSection + 1;
    }
    projectSectionField.addEventListener('change', suggestNextSortOrder);

    async function loadProjects() {
        const list = document.getElementById('projects-admin-list');
        const { data, error } = await client.from('projects').select('*').order('section', { ascending: true }).order('sort_order', { ascending: true });

        if (error) {
            list.innerHTML = `<p style="color:#ff8a80;">Failed to load projects: ${escapeHtml(error.message)}</p>`;
            return;
        }

        cachedProjects = data;
        suggestNextSortOrder();

        if (!data.length) {
            list.innerHTML = `<p class="text-on-surface-variant text-sm">No projects yet.</p>`;
            return;
        }

        list.innerHTML = data.map((p) => {
            const thumb = p.image_url
                ? `<img src="${escapeHtml(p.image_url)}" class="w-12 h-12 rounded-xl object-cover shrink-0">`
                : `<div class="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-on-surface-variant text-lg">image</span></div>`;

            return rowCard(`
${thumb}
<div class="min-w-0 flex-1">
<p class="font-bold">${escapeHtml(p.title)}</p>
<p class="text-on-surface-variant text-sm truncate">${escapeHtml(SECTION_LABELS[p.section] || 'Engineering Work')} · ${escapeHtml(p.description)}</p>
</div>
<div class="flex gap-2 shrink-0">
<button data-edit-project="${p.id}" class="liquid-glass-refractive liquid-glass-interactive w-10 h-10 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-lg">edit</span></button>
<button data-delete-project="${p.id}" class="liquid-glass-refractive liquid-glass-interactive w-10 h-10 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-lg">delete</span></button>
</div>
`);
        }).join('');

        list.querySelectorAll('[data-edit-project]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const project = data.find((p) => String(p.id) === btn.dataset.editProject);
                if (!project) return;
                projectIdField.value = project.id;
                projectExistingImageField.value = project.image_url || '';
                projectSectionField.value = project.section || 'engineering';
                document.getElementById('project-title').value = project.title || '';
                document.getElementById('project-description').value = project.description || '';
                document.getElementById('project-link').value = project.link_url || '';
                document.getElementById('project-tag').value = project.tag || '';
                projectSortField.value = project.sort_order || 1;
                projectImageInput.value = '';
                if (project.image_url) {
                    projectImagePreview.src = project.image_url;
                    projectImagePreview.classList.remove('hidden');
                } else {
                    projectImagePreview.classList.add('hidden');
                }
                projectCancelBtn.classList.remove('hidden');
                openAccordion('projects');
                projectForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });

        list.querySelectorAll('[data-delete-project]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this project?')) return;
                const { error } = await client.from('projects').delete().eq('id', btn.dataset.deleteProject);
                if (error) {
                    alert('Delete failed: ' + error.message);
                    return;
                }
                loadProjects();
                loadStats();
            });
        });
    }

    function resetProjectForm() {
        projectForm.reset();
        projectIdField.value = '';
        projectExistingImageField.value = '';
        projectImagePreview.classList.add('hidden');
        projectImagePreview.src = '';
        projectCancelBtn.classList.add('hidden');
        projectError.classList.add('hidden');
        suggestNextSortOrder();
    }

    projectCancelBtn.addEventListener('click', resetProjectForm);

    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        projectError.classList.add('hidden');

        const submitBtn = projectForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            let imageUrl = projectExistingImageField.value || null;
            const file = projectImageInput.files[0];

            if (file) {
                const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                const { error: uploadError } = await client.storage.from('project-images').upload(path, file, { upsert: true });
                if (uploadError) throw uploadError;
                imageUrl = client.storage.from('project-images').getPublicUrl(path).data.publicUrl;
            }

            const row = {
                title: document.getElementById('project-title').value.trim(),
                description: document.getElementById('project-description').value.trim(),
                link_url: document.getElementById('project-link').value.trim() || null,
                tag: document.getElementById('project-tag').value.trim() || null,
                section: projectSectionField.value,
                sort_order: Number(projectSortField.value) || 1,
                image_url: imageUrl,
            };

            const id = projectIdField.value;
            const { error } = id
                ? await client.from('projects').update(row).eq('id', id)
                : await client.from('projects').insert(row);

            if (error) throw error;

            resetProjectForm();
            loadProjects();
            loadStats();
        } catch (err) {
            projectError.textContent = err.message || String(err);
            projectError.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
        }
    });

    // ---------- Skills ----------

    const skillForm = document.getElementById('skill-form');
    const skillIdField = document.getElementById('skill-id');
    const skillCancelBtn = document.getElementById('skill-cancel');
    const skillError = document.getElementById('skill-error');

    async function loadSkills() {
        const list = document.getElementById('skills-admin-list');
        const { data, error } = await client.from('skills').select('*').order('category', { ascending: true }).order('sort_order', { ascending: true });

        if (error) {
            list.innerHTML = `<p style="color:#ff8a80;">Failed to load skills: ${escapeHtml(error.message)}</p>`;
            return;
        }

        if (!data.length) {
            list.innerHTML = `<p class="text-on-surface-variant text-sm">No skills yet.</p>`;
            return;
        }

        list.innerHTML = data.map((s) => rowCard(`
<div class="min-w-0">
<p class="font-bold">${escapeHtml(s.name)}</p>
<p class="text-on-surface-variant text-sm">${escapeHtml(s.category)} · ${escapeHtml(s.icon)}</p>
</div>
<div class="flex gap-2 shrink-0">
<button data-edit-skill="${s.id}" class="liquid-glass-refractive liquid-glass-interactive w-10 h-10 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-lg">edit</span></button>
<button data-delete-skill="${s.id}" class="liquid-glass-refractive liquid-glass-interactive w-10 h-10 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-lg">delete</span></button>
</div>
`)).join('');

        list.querySelectorAll('[data-edit-skill]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const skill = data.find((s) => String(s.id) === btn.dataset.editSkill);
                if (!skill) return;
                skillIdField.value = skill.id;
                document.getElementById('skill-category').value = skill.category || '';
                document.getElementById('skill-icon').value = skill.icon || '';
                document.getElementById('skill-name').value = skill.name || '';
                document.getElementById('skill-sort').value = skill.sort_order || 0;
                skillCancelBtn.classList.remove('hidden');
                openAccordion('skills');
                skillForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });

        list.querySelectorAll('[data-delete-skill]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this skill?')) return;
                const { error } = await client.from('skills').delete().eq('id', btn.dataset.deleteSkill);
                if (error) {
                    alert('Delete failed: ' + error.message);
                    return;
                }
                loadSkills();
                loadStats();
            });
        });
    }

    function resetSkillForm() {
        skillForm.reset();
        skillIdField.value = '';
        document.getElementById('skill-sort').value = 0;
        skillCancelBtn.classList.add('hidden');
        skillError.classList.add('hidden');
    }

    skillCancelBtn.addEventListener('click', resetSkillForm);

    skillForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        skillError.classList.add('hidden');

        const row = {
            category: document.getElementById('skill-category').value.trim(),
            icon: document.getElementById('skill-icon').value.trim() || 'code',
            name: document.getElementById('skill-name').value.trim(),
            sort_order: Number(document.getElementById('skill-sort').value) || 0,
        };

        const id = skillIdField.value;
        const { error } = id
            ? await client.from('skills').update(row).eq('id', id)
            : await client.from('skills').insert(row);

        if (error) {
            skillError.textContent = error.message;
            skillError.classList.remove('hidden');
            return;
        }

        resetSkillForm();
        loadSkills();
        loadStats();
    });
})();
