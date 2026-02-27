# Nyx — AI Chat

A blazing-fast AI chat app powered by OpenRouter with advanced reasoning capabilities.

## Features

### 🧠 Reasoning Mode
Click the "Think" button to enable deep reasoning on any model. When active:
- Fast model switches to DeepSeek R1 Distill (70B)
- Pro model switches to DeepSeek R1 (full model)
- Get detailed step-by-step reasoning in responses
- See reasoning token usage statistics

### 🎯 Advanced Model Selector
Choose from 4 powerful models:
- **⚡ Fast** - Quick responses for everyday tasks (Step 3.5 Flash)
- **👑 Pro** - Advanced reasoning for complex problems (Trinity Large)
- **🧠 Fast + Reasoning** - Fast model with deep thinking (DeepSeek R1 Distill 70B)
- **🔬 Pro + Reasoning** - Most powerful reasoning model (DeepSeek R1)

### 🚀 Quick Start
1. Open `index.html` in your browser
2. Start chatting immediately - no login required!
3. Select your preferred model from the dropdown
4. Toggle reasoning mode for complex questions
5. Enjoy 60 fast or 30 pro requests per day (resets daily)

## Setup for GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source → Deploy from branch → `main`**
3. Your site will be live at `https://username.github.io/repo-name/`

## Models

| Model | Engine | Category | Limit |
|-------|--------|----------|-------|
| **Fast** | Step 3.5 Flash | fast | 60 req/day |
| **Pro** | Trinity Large | pro | 30 req/day |
| **Fast + Reasoning** | DeepSeek R1 Distill 70B | fast | 60 req/day |
| **Pro + Reasoning** | DeepSeek R1 | pro | 30 req/day |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Send message (Shift+Enter for new line) |
| `Ctrl + Enter` | Also sends message |
| `Ctrl + Shift + M` | Cycle through models |
| `Escape` | Stop generation / close modals |

## Features

- No login required - start chatting instantly
- SSE streaming responses with real-time rendering
- Advanced model selector with quota display
- Reasoning mode toggle for deep thinking
- Rate limit tracking with visual indicators (60 fast / 30 pro per day)
- Chat history persistence (IndexedDB)
- Markdown + code highlighting + LaTeX support
- Export to Markdown / JSON / PDF
- Image paste & drag-drop support
- Think-block rendering for reasoning models
- Code embedding with syntax highlighting
- Collapsible reasoning sections

## Tech Stack

- Vanilla JavaScript (no frameworks)
- OpenRouter API for model access
- Marked.js for Markdown rendering
- Highlight.js for code syntax highlighting
- KaTeX for math rendering
- IndexedDB for local storage
