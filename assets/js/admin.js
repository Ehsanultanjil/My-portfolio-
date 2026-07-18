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
        loadContent();
        loadSocialLinks();
        loadExperience();
        loadEducation();
        loadTestimonials();
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

    // ---------- Site Text (single key/value fields, one save-all form) ----------

    const CONTENT_KEYS = [
        'hero_badge', 'hero_heading', 'hero_heading_highlight', 'hero_bio', 'hero_button_text', 'primary_cta_link',
        'about_eyebrow', 'about_heading', 'about_text',
        'work_heading', 'skills_eyebrow', 'skills_heading', 'skills_heading_highlight',
        'experience_heading', 'education_heading', 'testimonials_heading',
        'contact_heading', 'contact_text', 'contact_email',
        'footer_name', 'footer_copyright',
    ];

    const contentForm = document.getElementById('content-form');
    const contentError = document.getElementById('content-error');
    const contentSuccess = document.getElementById('content-success');

    async function loadContent() {
        const { data, error } = await client.from('site_content').select('*');
        if (error || !data) return;
        const byKey = {};
        data.forEach((row) => { byKey[row.key] = row.value; });
        CONTENT_KEYS.forEach((key) => {
            const field = document.getElementById(`sc-${key}`);
            if (field && byKey[key] != null) field.value = byKey[key];
        });
    }

    contentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        contentError.classList.add('hidden');
        contentSuccess.classList.add('hidden');

        const rows = CONTENT_KEYS.map((key) => ({
            key,
            value: document.getElementById(`sc-${key}`).value.trim(),
        }));

        const { error } = await client.from('site_content').upsert(rows, { onConflict: 'key' });
        if (error) {
            contentError.textContent = error.message;
            contentError.classList.remove('hidden');
            return;
        }
        contentSuccess.classList.remove('hidden');
    });

    // ---------- Social Links ----------

    const socialForm = document.getElementById('social-form');
    const socialIdField = document.getElementById('social-id');
    const socialCancelBtn = document.getElementById('social-cancel');
    const socialError = document.getElementById('social-error');

    async function loadSocialLinks() {
        const list = document.getElementById('social-admin-list');
        const { data, error } = await client.from('social_links').select('*').order('sort_order', { ascending: true });

        if (error) {
            list.innerHTML = `<p style="color:#ff8a80;">Failed to load social links: ${escapeHtml(error.message)}</p>`;
            return;
        }
        if (!data.length) {
            list.innerHTML = `<p class="text-on-surface-variant text-sm">No links yet.</p>`;
            return;
        }

        list.innerHTML = data.map((s) => rowCard(`
<div class="min-w-0">
<p class="font-bold">${escapeHtml(s.label)}</p>
<p class="text-on-surface-variant text-sm truncate">${escapeHtml(s.url)}</p>
</div>
<div class="flex gap-2 shrink-0">
<button data-edit-social="${s.id}" class="liquid-glass-refractive liquid-glass-interactive w-10 h-10 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-lg">edit</span></button>
<button data-delete-social="${s.id}" class="liquid-glass-refractive liquid-glass-interactive w-10 h-10 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-lg">delete</span></button>
</div>
`)).join('');

        list.querySelectorAll('[data-edit-social]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const row = data.find((s) => String(s.id) === btn.dataset.editSocial);
                if (!row) return;
                socialIdField.value = row.id;
                document.getElementById('social-label').value = row.label || '';
                document.getElementById('social-url').value = row.url || '';
                document.getElementById('social-sort').value = row.sort_order || 0;
                socialCancelBtn.classList.remove('hidden');
                openAccordion('social');
                socialForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });

        list.querySelectorAll('[data-delete-social]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this link?')) return;
                const { error } = await client.from('social_links').delete().eq('id', btn.dataset.deleteSocial);
                if (error) { alert('Delete failed: ' + error.message); return; }
                loadSocialLinks();
            });
        });
    }

    function resetSocialForm() {
        socialForm.reset();
        socialIdField.value = '';
        document.getElementById('social-sort').value = 0;
        socialCancelBtn.classList.add('hidden');
        socialError.classList.add('hidden');
    }

    socialCancelBtn.addEventListener('click', resetSocialForm);

    socialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        socialError.classList.add('hidden');

        const row = {
            label: document.getElementById('social-label').value.trim(),
            url: document.getElementById('social-url').value.trim(),
            sort_order: Number(document.getElementById('social-sort').value) || 0,
        };

        const id = socialIdField.value;
        const { error } = id
            ? await client.from('social_links').update(row).eq('id', id)
            : await client.from('social_links').insert(row);

        if (error) {
            socialError.textContent = error.message;
            socialError.classList.remove('hidden');
            return;
        }
        resetSocialForm();
        loadSocialLinks();
    });

    // ---------- Experience ----------

    const experienceForm = document.getElementById('experience-form');
    const experienceIdField = document.getElementById('experience-id');
    const experienceExistingImageField = document.getElementById('experience-existing-image');
    const experienceImageInput = document.getElementById('experience-image');
    const experienceImagePreview = document.getElementById('experience-image-preview');
    const experienceCancelBtn = document.getElementById('experience-cancel');
    const experienceError = document.getElementById('experience-error');

    experienceImageInput.addEventListener('change', () => {
        const file = experienceImageInput.files[0];
        if (!file) return;
        experienceImagePreview.src = URL.createObjectURL(file);
        experienceImagePreview.classList.remove('hidden');
    });

    async function loadExperience() {
        const list = document.getElementById('experience-admin-list');
        const { data, error } = await client.from('experience').select('*').order('sort_order', { ascending: true });

        if (error) {
            list.innerHTML = `<p style="color:#ff8a80;">Failed to load experience: ${escapeHtml(error.message)}</p>`;
            return;
        }
        if (!data.length) {
            list.innerHTML = `<p class="text-on-surface-variant text-sm">No entries yet.</p>`;
            return;
        }

        list.innerHTML = data.map((x) => {
            const thumb = x.image_url
                ? `<img src="${escapeHtml(x.image_url)}" class="w-12 h-12 rounded-xl object-cover shrink-0">`
                : `<div class="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-on-surface-variant text-lg">image</span></div>`;

            return rowCard(`
${thumb}
<div class="min-w-0 flex-1">
<p class="font-bold">${escapeHtml(x.title)}</p>
<p class="text-on-surface-variant text-sm truncate">${escapeHtml(x.organization)} · ${escapeHtml([x.start_date, x.end_date].filter(Boolean).join(' — '))}</p>
</div>
<div class="flex gap-2 shrink-0">
<button data-edit-experience="${x.id}" class="liquid-glass-refractive liquid-glass-interactive w-10 h-10 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-lg">edit</span></button>
<button data-delete-experience="${x.id}" class="liquid-glass-refractive liquid-glass-interactive w-10 h-10 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-lg">delete</span></button>
</div>
`);
        }).join('');

        list.querySelectorAll('[data-edit-experience]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const row = data.find((x) => String(x.id) === btn.dataset.editExperience);
                if (!row) return;
                experienceIdField.value = row.id;
                experienceExistingImageField.value = row.image_url || '';
                document.getElementById('experience-title').value = row.title || '';
                document.getElementById('experience-organization').value = row.organization || '';
                document.getElementById('experience-start').value = row.start_date || '';
                document.getElementById('experience-end').value = row.end_date || '';
                document.getElementById('experience-description').value = row.description || '';
                document.getElementById('experience-sort').value = row.sort_order || 0;
                experienceImageInput.value = '';
                if (row.image_url) {
                    experienceImagePreview.src = row.image_url;
                    experienceImagePreview.classList.remove('hidden');
                } else {
                    experienceImagePreview.classList.add('hidden');
                }
                experienceCancelBtn.classList.remove('hidden');
                openAccordion('experience');
                experienceForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });

        list.querySelectorAll('[data-delete-experience]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this entry?')) return;
                const { error } = await client.from('experience').delete().eq('id', btn.dataset.deleteExperience);
                if (error) { alert('Delete failed: ' + error.message); return; }
                loadExperience();
            });
        });
    }

    function resetExperienceForm() {
        experienceForm.reset();
        experienceIdField.value = '';
        experienceExistingImageField.value = '';
        experienceImagePreview.classList.add('hidden');
        experienceImagePreview.src = '';
        document.getElementById('experience-sort').value = 0;
        experienceCancelBtn.classList.add('hidden');
        experienceError.classList.add('hidden');
    }

    experienceCancelBtn.addEventListener('click', resetExperienceForm);

    experienceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        experienceError.classList.add('hidden');

        const submitBtn = experienceForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            let imageUrl = experienceExistingImageField.value || null;
            const file = experienceImageInput.files[0];

            if (file) {
                const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                const { error: uploadError } = await client.storage.from('project-images').upload(path, file, { upsert: true });
                if (uploadError) throw uploadError;
                imageUrl = client.storage.from('project-images').getPublicUrl(path).data.publicUrl;
            }

            const row = {
                title: document.getElementById('experience-title').value.trim(),
                organization: document.getElementById('experience-organization').value.trim(),
                start_date: document.getElementById('experience-start').value.trim(),
                end_date: document.getElementById('experience-end').value.trim(),
                description: document.getElementById('experience-description').value.trim(),
                image_url: imageUrl,
                sort_order: Number(document.getElementById('experience-sort').value) || 0,
            };

            const id = experienceIdField.value;
            const { error } = id
                ? await client.from('experience').update(row).eq('id', id)
                : await client.from('experience').insert(row);

            if (error) throw error;

            resetExperienceForm();
            loadExperience();
        } catch (err) {
            experienceError.textContent = err.message || String(err);
            experienceError.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
        }
    });

    // ---------- Education ----------

    const educationForm = document.getElementById('education-form');
    const educationIdField = document.getElementById('education-id');
    const educationCancelBtn = document.getElementById('education-cancel');
    const educationError = document.getElementById('education-error');

    async function loadEducation() {
        const list = document.getElementById('education-admin-list');
        const { data, error } = await client.from('education').select('*').order('sort_order', { ascending: true });

        if (error) {
            list.innerHTML = `<p style="color:#ff8a80;">Failed to load education: ${escapeHtml(error.message)}</p>`;
            return;
        }
        if (!data.length) {
            list.innerHTML = `<p class="text-on-surface-variant text-sm">No entries yet.</p>`;
            return;
        }

        list.innerHTML = data.map((x) => rowCard(`
<div class="min-w-0">
<p class="font-bold">${escapeHtml(x.degree)}</p>
<p class="text-on-surface-variant text-sm truncate">${escapeHtml(x.institution)} · ${escapeHtml([x.start_date, x.end_date].filter(Boolean).join(' — '))}</p>
</div>
<div class="flex gap-2 shrink-0">
<button data-edit-education="${x.id}" class="liquid-glass-refractive liquid-glass-interactive w-10 h-10 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-lg">edit</span></button>
<button data-delete-education="${x.id}" class="liquid-glass-refractive liquid-glass-interactive w-10 h-10 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-lg">delete</span></button>
</div>
`)).join('');

        list.querySelectorAll('[data-edit-education]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const row = data.find((x) => String(x.id) === btn.dataset.editEducation);
                if (!row) return;
                educationIdField.value = row.id;
                document.getElementById('education-degree').value = row.degree || '';
                document.getElementById('education-institution').value = row.institution || '';
                document.getElementById('education-start').value = row.start_date || '';
                document.getElementById('education-end').value = row.end_date || '';
                document.getElementById('education-description').value = row.description || '';
                document.getElementById('education-sort').value = row.sort_order || 0;
                educationCancelBtn.classList.remove('hidden');
                openAccordion('education');
                educationForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });

        list.querySelectorAll('[data-delete-education]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this entry?')) return;
                const { error } = await client.from('education').delete().eq('id', btn.dataset.deleteEducation);
                if (error) { alert('Delete failed: ' + error.message); return; }
                loadEducation();
            });
        });
    }

    function resetEducationForm() {
        educationForm.reset();
        educationIdField.value = '';
        document.getElementById('education-sort').value = 0;
        educationCancelBtn.classList.add('hidden');
        educationError.classList.add('hidden');
    }

    educationCancelBtn.addEventListener('click', resetEducationForm);

    educationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        educationError.classList.add('hidden');

        const row = {
            degree: document.getElementById('education-degree').value.trim(),
            institution: document.getElementById('education-institution').value.trim(),
            start_date: document.getElementById('education-start').value.trim(),
            end_date: document.getElementById('education-end').value.trim(),
            description: document.getElementById('education-description').value.trim(),
            sort_order: Number(document.getElementById('education-sort').value) || 0,
        };

        const id = educationIdField.value;
        const { error } = id
            ? await client.from('education').update(row).eq('id', id)
            : await client.from('education').insert(row);

        if (error) {
            educationError.textContent = error.message;
            educationError.classList.remove('hidden');
            return;
        }
        resetEducationForm();
        loadEducation();
    });

    // ---------- Testimonials ----------

    const testimonialForm = document.getElementById('testimonial-form');
    const testimonialIdField = document.getElementById('testimonial-id');
    const testimonialCancelBtn = document.getElementById('testimonial-cancel');
    const testimonialError = document.getElementById('testimonial-error');

    async function loadTestimonials() {
        const list = document.getElementById('testimonials-admin-list');
        const { data, error } = await client.from('testimonials').select('*').order('sort_order', { ascending: true });

        if (error) {
            list.innerHTML = `<p style="color:#ff8a80;">Failed to load testimonials: ${escapeHtml(error.message)}</p>`;
            return;
        }
        if (!data.length) {
            list.innerHTML = `<p class="text-on-surface-variant text-sm">No testimonials yet.</p>`;
            return;
        }

        list.innerHTML = data.map((x) => rowCard(`
<div class="min-w-0">
<p class="font-bold">${escapeHtml(x.client_name)} · ${'★'.repeat(Math.max(0, Math.min(5, Number(x.rating) || 0)))}</p>
<p class="text-on-surface-variant text-sm truncate">${escapeHtml(x.quote)}</p>
</div>
<div class="flex gap-2 shrink-0">
<button data-edit-testimonial="${x.id}" class="liquid-glass-refractive liquid-glass-interactive w-10 h-10 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-lg">edit</span></button>
<button data-delete-testimonial="${x.id}" class="liquid-glass-refractive liquid-glass-interactive w-10 h-10 rounded-full flex items-center justify-center bounce-feedback"><span class="material-symbols-outlined text-lg">delete</span></button>
</div>
`)).join('');

        list.querySelectorAll('[data-edit-testimonial]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const row = data.find((x) => String(x.id) === btn.dataset.editTestimonial);
                if (!row) return;
                testimonialIdField.value = row.id;
                document.getElementById('testimonial-client').value = row.client_name || '';
                document.getElementById('testimonial-quote').value = row.quote || '';
                document.getElementById('testimonial-rating').value = row.rating || 5;
                document.getElementById('testimonial-sort').value = row.sort_order || 0;
                testimonialCancelBtn.classList.remove('hidden');
                openAccordion('testimonials');
                testimonialForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });

        list.querySelectorAll('[data-delete-testimonial]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this testimonial?')) return;
                const { error } = await client.from('testimonials').delete().eq('id', btn.dataset.deleteTestimonial);
                if (error) { alert('Delete failed: ' + error.message); return; }
                loadTestimonials();
            });
        });
    }

    function resetTestimonialForm() {
        testimonialForm.reset();
        testimonialIdField.value = '';
        document.getElementById('testimonial-rating').value = 5;
        document.getElementById('testimonial-sort').value = 0;
        testimonialCancelBtn.classList.add('hidden');
        testimonialError.classList.add('hidden');
    }

    testimonialCancelBtn.addEventListener('click', resetTestimonialForm);

    testimonialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        testimonialError.classList.add('hidden');

        const row = {
            client_name: document.getElementById('testimonial-client').value.trim(),
            quote: document.getElementById('testimonial-quote').value.trim(),
            rating: Math.max(1, Math.min(5, Number(document.getElementById('testimonial-rating').value) || 5)),
            sort_order: Number(document.getElementById('testimonial-sort').value) || 0,
        };

        const id = testimonialIdField.value;
        const { error } = id
            ? await client.from('testimonials').update(row).eq('id', id)
            : await client.from('testimonials').insert(row);

        if (error) {
            testimonialError.textContent = error.message;
            testimonialError.classList.remove('hidden');
            return;
        }
        resetTestimonialForm();
        loadTestimonials();
    });
})();
