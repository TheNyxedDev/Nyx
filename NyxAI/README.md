# Nyx — AI Chat

A blazing-fast AI chat app powered by Groq. Three model tiers: **Pro**, **Think**, and **Fast**.

## Setup for GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source → Deploy from branch → `main`**
3. Your site will be live at `https://username.github.io/repo-name/`

## Models

| Model | Engine | Limit |
|-------|--------|-------|
| **Nyx Pro** | Llama 4 Maverick | 30 req/min, 6 users |
| **Nyx Think** | QwQ 32B Reasoning | 30 req/min, 6 users |
| **Nyx Fast** | GPT-OSS 20B / Qwen3 32B | 60 req/min, 12 users |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Enter` | Send |
| `Ctrl+Shift+M` | Cycle model |
| `Escape` | Stop / close |

## Features

- SSE streaming responses
- Rate limit tracking with heavy-use indicators
- Chat history (IndexedDB)
- Markdown + code highlighting + LaTeX
- Export to Markdown / JSON / PDF
- Image paste & drag-drop
- Think-block rendering for reasoning model
