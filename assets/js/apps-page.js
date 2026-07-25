(function () {
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str == null ? '' : String(str);
        return div.innerHTML;
    }

    function render(rows) {
        const list = document.getElementById('apps-list');
        const empty = document.getElementById('apps-empty');

        if (!rows || !rows.length) {
            empty.classList.remove('hidden');
            list.innerHTML = '';
            return;
        }
        empty.classList.add('hidden');

        list.innerHTML = rows.map((a) => {
            const icon = a.icon_url
                ? `<img src="${escapeHtml(a.icon_url)}" alt="" class="w-14 h-14 rounded-2xl object-cover shrink-0">`
                : `<div class="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-2xl text-on-surface-variant">apps</span></div>`;
            return `<a href="${escapeHtml(a.drive_url)}" target="_blank" rel="noopener noreferrer" class="liquid-glass-refractive liquid-glass-interactive bounce-feedback rounded-4xl p-5 flex items-center gap-4">
${icon}
<div class="min-w-0 flex-1">
<p class="font-bold truncate">${escapeHtml(a.name)}</p>
<p class="text-on-surface-variant text-sm">Download</p>
</div>
<span class="material-symbols-outlined text-on-surface-variant shrink-0">download</span>
</a>`;
        }).join('');
    }

    const client = window.supabaseClient;
    if (!client) {
        document.getElementById('apps-empty').classList.remove('hidden');
        return;
    }

    client.from('apps').select('*').order('sort_order', { ascending: true }).then(({ data, error }) => {
        render(error ? null : data);
    });
})();
