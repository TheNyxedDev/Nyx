/* ══════════════════════════════════════════════════════════════
   Nyx — Main App Controller
   ══════════════════════════════════════════════════════════════ */

const Nyx = (() => {
    let toastTimer = null;

    function toast(msg, type = 'error') {
        let t = document.querySelector('.toast');
        if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
        t.textContent = msg;
        t.className = `toast ${type}`;
        clearTimeout(toastTimer);
        requestAnimationFrame(() => t.classList.add('show'));
        toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
    }

    function enlargeImage(src) {
        const m = document.getElementById('imageModal'), img = document.getElementById('imageModalImg');
        if (m && img) { img.src = src; m.style.display = 'flex'; }
    }

    /* ── Model Dropdown (inside right side of input) ───────── */
    function initModelDropdown() {
        const btn = document.getElementById('modelSelectBtn');
        const menu = document.getElementById('modelMenu');
        const opts = document.querySelectorAll('.menu-opt');

        btn?.addEventListener('click', e => {
            e.stopPropagation();
            menu?.classList.toggle('show');
        });

        opts.forEach(opt => {
            opt.addEventListener('click', e => {
                e.stopPropagation();
                Chat.setModel(opt.dataset.model);
                menu?.classList.remove('show');
                updateModelDropdown();
                Sidebar.updateStatus();
            });
        });

        // Close dropdown on outside click
        document.addEventListener('click', () => menu?.classList.remove('show'));
    }

    function updateModelDropdown() {
        const active = Chat.getModelKey();
        const cfg = Chat.getModelConfig();

        // Update main button label & styling
        const btnHtml = document.getElementById('modelBtnLabel');
        const btnBtn = document.getElementById('modelSelectBtn');
        if (btnHtml && cfg) {
            let cls = 'pro-dot';
            if (active === 'thinking') cls = 'think-dot';
            if (active === 'fast') cls = 'fast-dot';
            btnBtn.innerHTML = `<span class="m-dot ${cls}"></span> <span id="modelBtnLabel">${cfg.icon} ${cfg.label} <small style="font-size:0.75em; color:var(--text-muted, #a1a1aa); opacity:0.6; margin-left:6px;">${cfg.subtext || cfg.id}</small></span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

            const status = RateLimit.getStatusInfo(active);
            const dot = btnBtn.querySelector('.m-dot');
            if (dot) dot.style.background = status.color;
        }

        // Update menu selections
        document.querySelectorAll('.menu-opt').forEach(o => {
            o.classList.toggle('active', o.dataset.model === active);
            const st = RateLimit.getStatusInfo(o.dataset.model);
            const d = o.querySelector('.m-dot');
            if (d) d.style.background = st.color;
        });

        // Update topbar label
        const label = document.getElementById('topbarLabel');
        if (label && cfg) label.textContent = `Nyx · ${cfg.label}`;
    }

    /* ── Input ─────────────────────────────────────────────── */
    function initInput() {
        const input = document.getElementById('chatInput');
        const counter = document.getElementById('charCounter');

        input?.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 180) + 'px';
            if (counter) counter.textContent = input.value.length;
        });

        document.getElementById('sendBtn')?.addEventListener('click', () => { if (input) Chat.send(input.value); });
        document.getElementById('stopBtn')?.addEventListener('click', () => Chat.stop());

        // Paste images
        input?.addEventListener('paste', e => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith('image/') && item.kind === 'file') {
                    e.preventDefault();
                    toast('Image pasting requires a vision model.', 'error');
                }
            }
        });

        // Welcome chips
        document.querySelectorAll('.w-chip').forEach(chip => {
            chip.addEventListener('click', () => { if (chip.dataset.prompt) Chat.send(chip.dataset.prompt); });
        });
    }

    /* ── Drag & Drop ───────────────────────────────────────── */
    function initDragDrop() {
        let dc = 0;
        const ov = document.getElementById('dropOverlay');
        document.addEventListener('dragenter', e => { e.preventDefault(); dc++; ov?.classList.add('show'); });
        document.addEventListener('dragleave', e => { e.preventDefault(); dc--; if (dc <= 0) { dc = 0; ov?.classList.remove('show'); } });
        document.addEventListener('dragover', e => e.preventDefault());
        document.addEventListener('drop', e => { e.preventDefault(); dc = 0; ov?.classList.remove('show'); });
    }

    /* ── Keyboard ──────────────────────────────────────────── */
    function initKeys() {
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); const i = document.getElementById('chatInput'); if (i) Chat.send(i.value); }
            if (e.key === 'Escape') { if (Chat.isStreaming()) Chat.stop(); document.getElementById('imageModal').style.display = 'none'; document.getElementById('exportModal').style.display = 'none'; }
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                const cats = ['pro', 'thinking', 'fast'];
                const cur = Chat.getModelKey();
                Chat.setModel(cats[(cats.indexOf(cur) + 1) % cats.length]);
                updateModelDropdown();
                Sidebar.updateStatus();
            }
        });
    }

    /* ── Export ─────────────────────────────────────────────── */
    function initExport() {
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            if (!Chat.getMessages().length) { toast('No messages', 'error'); return; }
            document.getElementById('exportModal').style.display = 'flex';
        });
        document.getElementById('exportModalClose')?.addEventListener('click', () => { document.getElementById('exportModal').style.display = 'none'; });
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const fmt = btn.dataset.format, msgs = Chat.getMessages();
                document.getElementById('exportModal').style.display = 'none';

                if (fmt === 'markdown') {
                    let md = '# Nyx Chat\n\n';
                    msgs.forEach(m => { if (m.role !== 'system') md += `### ${m.role === 'user' ? '👤 You' : '✦ Nyx'}\n\n${m.content}\n\n---\n\n`; });
                    dl(`nyx-${Date.now()}.md`, md, 'text/markdown');
                } else if (fmt === 'json') {
                    dl(`nyx-${Date.now()}.json`, JSON.stringify({ exported: new Date().toISOString(), messages: msgs.filter(m => m.role !== 'system') }, null, 2), 'application/json');
                } else if (fmt === 'pdf' && window.html2pdf) {
                    const clone = document.getElementById('messagesList').cloneNode(true);
                    clone.querySelectorAll('.message-actions,.welcome').forEach(e => e.remove());
                    html2pdf().set({ margin: 10, filename: `nyx-${Date.now()}.pdf` }).from(clone).save();
                }
                toast('Exported!', 'success');
            });
        });
        document.querySelectorAll('.modal-overlay').forEach(m => { m.addEventListener('click', e => { if (e.target === m) m.style.display = 'none'; }); });
    }

    function dl(name, content, type) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([content], { type }));
        a.download = name; document.body.appendChild(a); a.click(); a.remove();
    }

    function initAttachBtn() {
        const btn = document.getElementById('attachBtn');
        const menu = document.getElementById('attachMenu');
        if (btn && menu) {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                menu.classList.toggle('show');
            });
            document.addEventListener('click', e => {
                if (!menu.contains(e.target) && e.target !== btn) {
                    menu.classList.remove('show');
                }
            });
        }
    }

    return {
        toast,
        enlargeImage,
        updateModelDropdown,
        init() {
            Sidebar.init();
            initModelDropdown();
            initInput();
            initDragDrop();
            initKeys();
            initExport();
            initAttachBtn();
            updateModelDropdown();
            document.getElementById('chatInput')?.focus();
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => Nyx.init());
