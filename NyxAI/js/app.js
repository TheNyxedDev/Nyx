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

    /* ── Think Toggle ───────── */
    function initThinkToggle() {
        const toggle = document.getElementById('thinkToggle');
        const input = document.getElementById('chatInput');

        toggle?.addEventListener('click', () => {
            const isActive = toggle.classList.toggle('active');
            const currentModel = Chat.getModelKey();
            
            // Toggle reasoning mode
            let newModel;
            if (isActive) {
                // Enable reasoning
                if (currentModel === 'fast') {
                    newModel = 'fast-reasoning';
                } else if (currentModel === 'pro') {
                    newModel = 'pro-reasoning';
                } else {
                    newModel = currentModel; // Already in reasoning mode
                }
            } else {
                // Disable reasoning
                if (currentModel === 'fast-reasoning') {
                    newModel = 'fast';
                } else if (currentModel === 'pro-reasoning') {
                    newModel = 'pro';
                } else {
                    newModel = currentModel; // Already not in reasoning mode
                }
            }
            
            Chat.setModel(newModel);

            if (input) {
                input.placeholder = isActive ? 'Ask for deep analysis...' : 'Ask anything';
            }

            updateInputUI();
            Sidebar.updateStatus();
        });
    }

    function updateInputUI() {
        const active = Chat.getModelKey();
        const cfg = Chat.getModelConfig();
        const toggle = document.getElementById('thinkToggle');
        const label = document.getElementById('thinkLabel');
        const input = document.getElementById('chatInput');
        const modelBtn = document.getElementById('modelSelectorBtn');

        // Update think toggle
        if (toggle && label) {
            const isReasoning = cfg?.supportsReasoning || false;
            toggle.classList.toggle('active', isReasoning);
            label.textContent = isReasoning ? 'Thinking' : 'Think';
            if (input) input.placeholder = isReasoning ? 'Ask for deep analysis...' : 'Ask anything';
        }

        // Update model selector button
        if (modelBtn && cfg) {
            modelBtn.innerHTML = `
                <span class="model-icon">${cfg.icon}</span>
                <span class="model-name">${cfg.label}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            `;
        }

        // Update topbar label
        const topLabel = document.getElementById('topbarLabel');
        if (topLabel && cfg) topLabel.textContent = `Nyx · ${cfg.label}`;
    }

    /* ── Input ─────────────────────────────────────────────── */
    function initInput() {
        const input = document.getElementById('chatInput');
        input?.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 180) + 'px';
        });

        // Enter key to send (Shift+Enter for new line)
        input?.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.value.trim()) {
                    Chat.send(input.value);
                }
            }
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
                const modelKeys = Object.keys(NyxConfig.MODELS);
                const cur = Chat.getModelKey();
                const curIdx = modelKeys.indexOf(cur);
                const nextIdx = (curIdx + 1) % modelKeys.length;
                Chat.setModel(modelKeys[nextIdx]);
                updateInputUI();
                Sidebar.updateStatus();
                Nyx.toast(`Switched to ${NyxConfig.MODELS[modelKeys[nextIdx]].label}`, 'success');
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

    function initModelSelector() {
        const btn = document.getElementById('modelSelectorBtn');
        const menu = document.getElementById('modelSelectorMenu');
        
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

            // Populate model options
            const modelList = menu.querySelector('.model-list');
            if (modelList) {
                modelList.innerHTML = Object.entries(NyxConfig.MODELS).map(([key, model]) => `
                    <button class="model-option" data-model="${key}">
                        <div class="model-option-header">
                            <span class="model-option-icon">${model.icon}</span>
                            <span class="model-option-name">${model.label}</span>
                            ${model.supportsReasoning ? '<span class="reasoning-badge-small">🧠</span>' : ''}
                        </div>
                        <div class="model-option-desc">${model.description}</div>
                        <div class="model-option-quota">${QuotaManager.getUsageText(model.category)}</div>
                    </button>
                `).join('');

                // Add click handlers
                modelList.querySelectorAll('.model-option').forEach(opt => {
                    opt.addEventListener('click', () => {
                        const modelKey = opt.dataset.model;
                        Chat.setModel(modelKey);
                        updateInputUI();
                        Sidebar.updateStatus();
                        menu.classList.remove('show');
                        Nyx.toast(`Switched to ${NyxConfig.MODELS[modelKey].label}`, 'success');
                    });
                });
            }
        }
    }
    return {
        toast,
        enlargeImage,
        updateInputUI,
        init() {
            Sidebar.init();
            initThinkToggle();
            initModelSelector();
            initInput();
            initDragDrop();
            initKeys();
            initExport();
            initAttachBtn();
            updateInputUI();
            document.getElementById('chatInput')?.focus();
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => Nyx.init());
