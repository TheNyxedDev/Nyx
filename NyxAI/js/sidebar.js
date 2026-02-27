/* ══════════════════════════════════════════════════════════════
   Nyx — Sidebar (History + Usage only, no model selector)
   ══════════════════════════════════════════════════════════════ */

const Sidebar = (() => {
    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    async function refresh() {
        const list = document.getElementById('historyList');
        if (!list) return;
        const chats = await Storage.getAll();
        const cur = Chat.getChatId();
        if (!chats.length) { list.innerHTML = '<div class="hist-empty">No chats yet</div>'; return; }

        list.innerHTML = chats.map(c => `
      <button class="hist-item ${c.id === cur ? 'active' : ''}" data-id="${c.id}">
        <span class="hist-title">${esc(c.title || 'Untitled')}</span>
        <span class="hist-del" data-del="${c.id}" title="Delete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </span>
      </button>`).join('');

        list.querySelectorAll('.hist-item').forEach(item => {
            item.addEventListener('click', async e => {
                const del = e.target.closest('.hist-del');
                if (del) { e.stopPropagation(); await Storage.remove(del.dataset.del); if (del.dataset.del === Chat.getChatId()) Chat.newChat(); refresh(); return; }
                const data = await Storage.get(item.dataset.id);
                if (data) { Chat.loadChat(data); refresh(); }
                if (window.innerWidth <= 768) toggle(false);
            });
        });
    }

    function updateStatus() {
        const mk = Chat.getModelKey();
        const stats = RateLimit.getUsageStats(mk);
        const info = RateLimit.getStatusInfo(mk);
        const bar = document.getElementById('usageBar');
        const label = document.getElementById('usageLabel');
        const dot = document.getElementById('usageDot');

        if (bar) {
            const pct = Math.min(100, (stats.used / stats.limit) * 100);
            bar.style.width = pct + '%';
            bar.className = 'usage-fill' + (pct > 80 ? ' crit' : pct > 50 ? ' warn' : '');
        }
        if (label) label.textContent = window.QuotaManager ? QuotaManager.getUsageText(NyxConfig.MODELS[mk]?.category || 'fast') : `${stats.used} / ${stats.limit} req/min`;
        if (dot) { dot.style.color = info.color; dot.title = info.label; }
    }

    function toggle(show) {
        const sb = document.getElementById('sidebar');
        if (!sb) return;
        if (show === undefined) sb.classList.toggle('collapsed');
        else show ? sb.classList.remove('collapsed') : sb.classList.add('collapsed');
    }

    return {
        refresh,
        updateStatus,
        toggle,
        init() {
            document.getElementById('sidebarClose')?.addEventListener('click', () => toggle(false));
            document.getElementById('sidebarOpen')?.addEventListener('click', () => toggle(true));
            document.getElementById('newChatBtn')?.addEventListener('click', () => { Chat.newChat(); if (window.innerWidth <= 768) toggle(false); });
            document.getElementById('clearBtn')?.addEventListener('click', () => { if (confirm('Clear this conversation?')) Chat.clearChat(); });
            if (window.innerWidth <= 768) toggle(false);
            setInterval(updateStatus, 5000);
            refresh();
            updateStatus();
        }
    };
})();
