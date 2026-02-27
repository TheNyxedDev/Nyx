/* ══════════════════════════════════════════════════════════════
   Nyx — Markdown Rendering (Marked + Highlight.js + KaTeX)
   ══════════════════════════════════════════════════════════════ */

const Markdown = (() => {
    if (window.marked) {
        marked.setOptions({ breaks: true, gfm: true, headerIds: false, mangle: false });
    }

    function sanitize(html) {
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/javascript\s*:/gi, '');
    }

    function renderLatex(html) {
        if (!window.katex) return html;
        html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => {
            try { return katex.renderToString(t.trim(), { displayMode: true, throwOnError: false }); } catch { return _; }
        });
        html = html.replace(/\$([^\$\n]+?)\$/g, (_, t) => {
            try { return katex.renderToString(t.trim(), { displayMode: false, throwOnError: false }); } catch { return _; }
        });
        return html;
    }

    // Handle <think> blocks from reasoning models
    function renderThinkBlocks(text) {
        return text.replace(/<think>([\s\S]*?)<\/think>/g, (_, content) => {
            return `\n\n---\n**🧠 Thinking Process:**\n<details><summary>Click to expand reasoning</summary>\n\n${content.trim()}\n\n</details>\n\n---\n`;
        });
    }

    function wrapCodeBlocks(html) {
        const d = document.createElement('div');
        d.innerHTML = html;
        d.querySelectorAll('pre code').forEach(code => {
            const pre = code.parentElement;
            const lc = [...code.classList].find(c => c.startsWith('language-'));
            const lang = lc ? lc.replace('language-', '') : 'text';

            // Heuristic for codeType
            let codeType = 'snippet';
            if (['sql'].includes(lang)) codeType = 'sql';
            else if (['yaml', 'yml', 'json', 'toml', 'ini'].includes(lang)) codeType = 'config';
            else if (['bash', 'sh', 'dockerfile', 'hcl', 'terraform'].includes(lang)) codeType = 'infra';
            else if (['test', 'spec', 'jest'].includes(lang)) codeType = 'test';
            else if (['python', 'javascript', 'js', 'ts', 'java', 'c', 'cpp', 'rust', 'go'].includes(lang)) codeType = 'algorithm';

            if (window.hljs) {
                try {
                    if (lang !== 'text' && hljs.getLanguage(lang)) code.innerHTML = hljs.highlight(code.textContent, { language: lang }).value;
                    else hljs.highlightElement(code);
                } catch { }
            }

            const w = document.createElement('div');
            w.className = 'code-embed';
            w.dataset.type = codeType;
            w.innerHTML = `
                <div class="code-header">
                    <div class="legend">${codeType} (${lang})</div>
                    <div class="actions">
                       <button onclick="Markdown.copyCode(this)">Copy</button>
                       <button onclick="Nyx.toast('Sandboxing not available in Free tier', 'error')">Run</button>
                       <button onclick="Markdown.downloadCode(this, '${lang}')">Download</button>
                       <button onclick="Markdown.annotateCode(this)">Annotate</button>
                    </div>
                </div>
            `;
            pre.parentNode.insertBefore(w, pre);
            w.appendChild(pre);
        });
        return d.innerHTML;
    }

    return {
        render(text) {
            if (!text) return '';
            text = renderThinkBlocks(text);
            let html;
            try { html = marked.parse(text); }
            catch { html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'); }
            return wrapCodeBlocks(renderLatex(sanitize(html)));
        },
        copyCode(btn) {
            const code = btn.closest('.code-embed')?.querySelector('code');
            if (!code) return;
            navigator.clipboard.writeText(code.textContent).then(() => {
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
            });
        },
        downloadCode(btn, lang) {
            const code = btn.closest('.code-embed')?.querySelector('code');
            if (!code) return;
            const extMap = { 'javascript': 'js', 'python': 'py', 'java': 'java', 'html': 'html', 'css': 'css', 'json': 'json', 'yaml': 'yaml', 'bash': 'sh', 'text': 'txt' };
            const ext = extMap[lang] || 'txt';
            const blob = new Blob([code.textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `snippet.${ext}`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            Nyx.toast('Downloaded snippet', 'success');
        },
        annotateCode(btn) {
            const embed = btn.closest('.code-embed');
            if (!embed) return;
            embed.classList.toggle('annotated');
            if (embed.classList.contains('annotated')) {
                embed.style.borderLeft = '4px solid var(--accent)';
                btn.textContent = 'Hide Annotations';
                Nyx.toast('Annotations enabled', 'success');
            } else {
                embed.style.borderLeft = 'none';
                btn.textContent = 'Annotate';
            }
        }
    };
})();
