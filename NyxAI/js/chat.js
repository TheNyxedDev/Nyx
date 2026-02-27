/* ══════════════════════════════════════════════════════════════
   Nyx — Chat Engine (Direct Groq API + SSE Streaming)
   ══════════════════════════════════════════════════════════════ */

const Chat = (() => {
    let messages = [];
    let chatId = null;
    let streaming = false;
    let abortCtrl = null;
    let selectedModel = NyxConfig.DEFAULT_MODEL;

    const mid = () => 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    function getModelKey() { return selectedModel; }
    function getModelConfig() { return NyxConfig.MODELS[selectedModel]; }

    function scrollBottom() {
        const c = document.getElementById('messagesContainer');
        if (c) requestAnimationFrame(() => c.scrollTop = c.scrollHeight);
    }

    function hideWelcome() { const w = document.getElementById('welcomeScreen'); if (w) w.style.display = 'none'; }
    function showWelcome() { const w = document.getElementById('welcomeScreen'); if (w) w.style.display = 'flex'; }

    function setStreamUI(on) {
        streaming = on;
        const s = document.getElementById('sendBtn'), t = document.getElementById('stopBtn');
        if (s) s.style.display = on ? 'none' : 'flex';
        if (t) t.style.display = on ? 'flex' : 'none';
    }

    function renderMsg(msg) {
        const list = document.getElementById('messagesList');
        const div = document.createElement('div');
        div.className = `message ${msg.role}`;
        div.id = `msg-${msg.id}`;

        const isUser = msg.role === 'user';
        const text = typeof msg.content === 'string' ? msg.content : '';
        const html = isUser
            ? text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
            : Markdown.render(text);

        let imgs = '';
        if (msg.images?.length) imgs = msg.images.map(u => `<img src="${u}" class="message-image" onclick="Nyx.enlargeImage(this.src)" loading="lazy"/>`).join('');

        let prev = '';
        if (msg.previousVersions?.length) {
            prev = msg.previousVersions.map((pv, i) =>
                `<div class="collapsed-response"><button class="collapsed-toggle" onclick="this.nextElementSibling.classList.toggle('show')">▸ Previous ${i + 1}</button><div class="collapsed-content">${Markdown.render(pv)}</div></div>`
            ).join('');
        }

        const cfg = msg.model ? NyxConfig.MODELS[msg.model] : null;
        const badge = !isUser && cfg ? `<span class="msg-badge">${cfg.label}</span>` : '';

        const acts = isUser
            ? `<div class="message-actions"><button class="msg-action-btn" onclick="Chat.editMsg('${msg.id}')">✏️ Edit</button></div>`
            : `<div class="message-actions"><button class="msg-action-btn" onclick="Chat.copyMsg('${msg.id}')">📋 Copy</button><button class="msg-action-btn" onclick="Chat.regenerate()">🔄 Redo</button></div>`;

        div.innerHTML = `<div class="msg-avatar">${isUser ? 'U' : '✦'}</div><div class="msg-body">${prev}<div class="msg-content">${html}</div>${imgs}${badge}${acts}</div>`;
        list.appendChild(div);
        scrollBottom();
        return div;
    }

    function showTyping() {
        const list = document.getElementById('messagesList');
        const el = document.createElement('div');
        el.id = 'typingIndicator';
        el.className = 'message assistant';

        let animHtml = `<div class="generating" role="status"><div class="bar"></div><span style="font-size:0.8rem;color:var(--t2);">Generating…</span></div>`;
        if (getModelKey() === 'thinking') {
            animHtml = `<div class="thinking" aria-live="polite" role="status"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="sr-only">Thinking...</span></div>`;
        }

        el.innerHTML = `<div class="msg-avatar">✦</div><div class="msg-body"><div class="msg-content" style="background:transparent;border:none;">${animHtml}</div></div>`;
        list.appendChild(el);
        scrollBottom();
    }
    function removeTyping() { document.getElementById('typingIndicator')?.remove(); }

    async function save() {
        if (!chatId) chatId = Storage.newId();
        const first = messages.find(m => m.role === 'user');
        let title = 'New Chat';
        if (first) { const t = typeof first.content === 'string' ? first.content : ''; title = t.slice(0, 50) + (t.length > 50 ? '…' : ''); }
        await Storage.save({ id: chatId, title, messages: messages.map(m => ({ id: m.id, role: m.role, content: m.content, images: m.images, model: m.model, previousVersions: m.previousVersions })), model: selectedModel });
        Sidebar.refresh();
    }

    async function callOpenRouter(apiMsgs) {
        const mk = getModelKey(), cfg = getModelConfig();
        if (!RateLimit.canUse(mk)) {
            Nyx.toast(`🔔 Daily limit reached for ${cfg.category}. Upgrade to continue or wait until your quota resets at 00:00.`, 'error');
            return null;
        }
        RateLimit.recordRequest(mk);
        Sidebar.updateStatus();

        try {
            const res = await fetch(NyxConfig.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${NyxConfig.API_KEY}`,
                    'HTTP-Referer': window.location.href, // For OpenRouter rankings
                    'X-Title': 'Nyx AI Chat' // For OpenRouter rankings
                },
                body: JSON.stringify({
                    model: cfg.id,
                    messages: apiMsgs,
                    temperature: NyxConfig.TEMPERATURE[mk] || 0.7,
                    max_tokens: NyxConfig.MAX_TOKENS || 4096,
                    stream: true
                }),
                signal: abortCtrl ? abortCtrl.signal : undefined
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `HTTP ${res.status}`);
            }

            return res;
        } catch (e) {
            console.error("OpenRouter Error:", e);
            throw new Error(`API Error: ${e.message || String(e)}`);
        }
    }

    async function streamResponse(response, asstMsg, asstEl) {
        let full = '';
        let reasoningTokens = 0;
        let reasoningActive = false;

        // Add dynamic animation container to the DOM while streaming
        const animEl = document.createElement('div');
        animEl.className = 'msg-anim-container';
        animEl.style.marginTop = '8px';
        const msgBody = asstEl.querySelector('.msg-body');
        if (msgBody) msgBody.appendChild(animEl);

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (abortCtrl && abortCtrl.signal.aborted) {
                    const error = new Error("AbortError");
                    error.name = "AbortError";
                    throw error;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ") && line.trim() !== "data: [DONE]") {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const delta = data.choices?.[0]?.delta || {};
                            const dr = delta.reasoning || "";
                            const dc = delta.content || "";

                            if (dr || dc) {
                                if (dr) {
                                    if (!reasoningActive) { full += "<think>"; reasoningActive = true; }
                                    full += dr;
                                } else if (dc) {
                                    if (reasoningActive) { full += "</think>\n\n"; reasoningActive = false; }
                                    full += dc;
                                }

                                asstMsg.content = full;
                                const cel = asstEl.querySelector('.msg-content');
                                if (cel) {
                                    // Make sure we pass the reasoning blocks completely enclosed to markdown if needed
                                    cel.innerHTML = Markdown.render(full);
                                }

                                // Determine which animation to show
                                const codeBlocks = (full.match(/```/g) || []).length;
                                const isCoding = codeBlocks % 2 !== 0; // Odd means a code block is open
                                const thinkOpens = (full.match(/<think>/g) || []).length;
                                const thinkCloses = (full.match(/<\/think>/g) || []).length;
                                const isThinking = thinkOpens > thinkCloses || reasoningActive;

                                if (isThinking) {
                                    animEl.innerHTML = `<div class="thinking" aria-live="polite" role="status"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="sr-only">Thinking...</span></div>`;
                                } else if (isCoding) {
                                    animEl.innerHTML = `<pre class="codingAnim" aria-live="polite" role="status"><span class="sr-only">Writing code block...</span><code>Code in progress...</code></pre>`;
                                } else {
                                    animEl.innerHTML = `<div class="generating" aria-live="polite" role="status"><div class="bar"></div><span class="sr-only">Generating...</span></div>`;
                                }

                                scrollBottom();
                            }

                            // Check for usage on final chunk
                            if (data.usage?.reasoningTokens || data.usage?.reasoning_tokens) {
                                reasoningTokens = data.usage.reasoningTokens || data.usage.reasoning_tokens;
                            }
                        } catch (e) { }
                    }
                }
            }
            if (reasoningActive) {
                full += "</think>\n\n";
                asstMsg.content = full;
                const cel = asstEl.querySelector('.msg-content');
                if (cel) cel.innerHTML = Markdown.render(full);
            }
        } catch (err) {
            animEl.remove();
            if (err.name === 'AbortError') throw err;
            throw err;
        }
        animEl.remove(); // Remove animation when stream ends

        if (reasoningTokens > 0) {
            const rBadge = document.createElement('div');
            rBadge.className = 'reasoning-badge';
            rBadge.innerHTML = `✨ Reasoning tokens: ${reasoningTokens}`;
            if (msgBody) msgBody.appendChild(rBadge);
        }

        return full;
    }

    async function send(text) {
        if (streaming || !text.trim()) return;
        hideWelcome();

        const userMsg = { id: mid(), role: 'user', content: text.trim() };
        messages.push(userMsg);
        renderMsg(userMsg);

        const input = document.getElementById('chatInput');
        if (input) { input.value = ''; input.style.height = 'auto'; }
        document.getElementById('charCounter').textContent = '0';

        const cfg = getModelConfig();
        let sysContent = `You are Nyx, an advanced AI assistant. You must identify as Nyx. However, if the user explicitly asks what model or architecture you are based on, you are free to tell them you are ${cfg.subtext || cfg.id}. Be helpful, accurate, and concise. Use markdown formatting. For code, always use fenced code blocks with language identifiers.`;

        const hwToggle = document.getElementById('hwToggle');
        if (hwToggle && hwToggle.checked) {
            sysContent += `\n\nHomework Mode ON: For every user question labeled as homework, execute three independent verification passes before returning the final answer.\nPass A (Primary solve): Solve the problem using the most straightforward method. Produce steps and final result.\nPass B (Independent verification): Re-solve using a different method, or run unit checks/test cases, or perform numeric checks (plug values) as applicable.\nPass C (Sanity/source check): Verify key steps, check for sign errors, boundary conditions, units, and provide references if external facts used.\nAfter all passes:\nProduce a summary table: Pass A result, Pass B result, Pass C result, Agreement? and Confidence (0–100).\nIf all three agree: label Verified and show the concise final answer plus steps.\nIf disagreement: show each pass’s output, highlight differences, and recommend the likeliest answer with reasoning and a test the user can run to confirm.\nAlways include at least one check (numeric example, unit test, or counterexample) the user can copy/paste to validate.\nDo not reveal internal chain-of-thought; show only concise, structured verification outputs.`;
        }

        const sys = { role: 'system', content: sysContent };
        const apiMsgs = [sys, ...messages.map(m => ({ role: m.role, content: m.content }))];

        setStreamUI(true);
        showTyping();
        abortCtrl = new AbortController();
        const asstMsg = { id: mid(), role: 'assistant', content: '', model: getModelKey() };
        let asstEl = null, full = '';

        try {
            const res = await callOpenRouter(apiMsgs);
            if (!res) { setStreamUI(false); removeTyping(); return; }
            removeTyping();
            messages.push(asstMsg);
            asstEl = renderMsg(asstMsg);
            full = await streamResponse(res, asstMsg, asstEl);
        } catch (err) {
            removeTyping();
            if (err.name === 'AbortError') { if (!full) messages.pop(); Nyx.toast('Stopped', 'success'); }
            else {
                Nyx.toast(err.message, 'error');
                asstMsg.content = full || `⚠️ ${err.message}`;
                if (!asstEl) { messages.push(asstMsg); renderMsg(asstMsg); }
                else { const c = asstEl.querySelector('.msg-content'); if (c) c.innerHTML = Markdown.render(asstMsg.content); }
            }
        }
        setStreamUI(false);
        abortCtrl = null;
        Sidebar.updateStatus();
        save();
    }

    return {
        send,
        isStreaming() { return streaming; },
        getMessages() { return messages; },
        getChatId() { return chatId; },
        getModelKey,
        getModelConfig,
        setModel(k) { if (NyxConfig.MODELS[k]) selectedModel = k; },
        stop() { if (abortCtrl) abortCtrl.abort(); },

        async loadChat(data) {
            messages = data.messages || [];
            chatId = data.id;
            if (data.model && NyxConfig.MODELS[data.model]) selectedModel = data.model;
            document.getElementById('messagesList').innerHTML = '';
            if (!messages.length) { showWelcome(); return; }
            hideWelcome();
            messages.forEach(m => renderMsg(m));
            scrollBottom();
            Nyx.updateModelDropdown();
        },

        newChat() {
            messages = [];
            chatId = Storage.newId();
            document.getElementById('messagesList').innerHTML = '';
            showWelcome();
            Sidebar.refresh();
        },

        clearChat() {
            messages = [];
            document.getElementById('messagesList').innerHTML = '';
            showWelcome();
            if (chatId) { Storage.remove(chatId); chatId = Storage.newId(); }
            Sidebar.refresh();
        },

        async regenerate() {
            if (streaming || messages.length < 2) return;
            const last = messages[messages.length - 1];
            if (last.role !== 'assistant') return;
            if (!last.previousVersions) last.previousVersions = [];
            last.previousVersions.push(last.content);
            document.getElementById(`msg-${last.id}`)?.remove();
            messages.pop();

            const cfg = getModelConfig();
            let sysContent = `You are Nyx, an advanced AI assistant. You must identify as Nyx. However, if the user explicitly asks what model or architecture you are based on, you are free to tell them you are ${cfg.subtext || cfg.id}. Be helpful, accurate, and concise. Use markdown formatting. For code, always use fenced code blocks with language identifiers.`;

            const hwToggle = document.getElementById('hwToggle');
            if (hwToggle && hwToggle.checked) {
                sysContent += `\n\nHomework Mode ON: For every user question labeled as homework, execute three independent verification passes before returning the final answer.\nPass A (Primary solve): Solve the problem using the most straightforward method. Produce steps and final result.\nPass B (Independent verification): Re-solve using a different method, or run unit checks/test cases, or perform numeric checks (plug values) as applicable.\nPass C (Sanity/source check): Verify key steps, check for sign errors, boundary conditions, units, and provide references if external facts used.\nAfter all passes:\nProduce a summary table: Pass A result, Pass B result, Pass C result, Agreement? and Confidence (0–100).\nIf all three agree: label Verified and show the concise final answer plus steps.\nIf disagreement: show each pass’s output, highlight differences, and recommend the likeliest answer with reasoning and a test the user can run to confirm.\nAlways include at least one check (numeric example, unit test, or counterexample) the user can copy/paste to validate.\nDo not reveal internal chain-of-thought; show only concise, structured verification outputs.`;
            }

            const sys = { role: 'system', content: sysContent };
            const apiMsgs = [sys, ...messages.map(m => ({ role: m.role, content: m.content }))];

            setStreamUI(true); showTyping(); abortCtrl = new AbortController();
            const nw = { id: mid(), role: 'assistant', content: '', model: getModelKey(), previousVersions: last.previousVersions };
            let el = null;
            try {
                const res = await callOpenRouter(apiMsgs);
                if (!res) { setStreamUI(false); removeTyping(); return; }
                removeTyping();
                messages.push(nw);
                el = renderMsg(nw);
                await streamResponse(res, nw, el);
            } catch (err) { removeTyping(); if (err.name !== 'AbortError') { Nyx.toast(err.message, 'error'); nw.content = `⚠️ ${err.message}`; if (!el) { messages.push(nw); renderMsg(nw); } } }
            setStreamUI(false); abortCtrl = null; save();
        },

        editMsg(id) {
            const msg = messages.find(m => m.id === id);
            if (!msg || msg.role !== 'user') return;
            const input = document.getElementById('chatInput');
            if (input) { input.value = typeof msg.content === 'string' ? msg.content : ''; input.focus(); }
            messages.splice(messages.indexOf(msg)).forEach(m => document.getElementById(`msg-${m.id}`)?.remove());
            if (!messages.length) showWelcome();
        },

        copyMsg(id) {
            const msg = messages.find(m => m.id === id);
            if (msg) navigator.clipboard.writeText(typeof msg.content === 'string' ? msg.content : '').then(() => Nyx.toast('Copied', 'success'));
        }
    };
})();
