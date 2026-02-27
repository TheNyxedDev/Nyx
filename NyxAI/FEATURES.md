# Nyx Features Guide

## 🧠 Reasoning Mode (Think Button)

The Think button enables advanced reasoning capabilities on any model:

### How it works:
1. Click the **Think** button in the input area (sun icon)
2. When active, it glows blue and shows "Thinking"
3. Your current model switches to its reasoning variant:
   - Fast → Fast + Reasoning (DeepSeek R1 Distill 70B)
   - Pro → Pro + Reasoning (DeepSeek R1)

### What you get:
- Detailed step-by-step reasoning process
- Collapsible reasoning sections (click to expand)
- Reasoning token count displayed after response
- Better accuracy on complex problems
- Mathematical and logical problem solving

### When to use:
- Complex coding problems
- Mathematical calculations
- Logic puzzles
- Multi-step reasoning tasks
- When you need to see the "thinking process"

---

## 🎯 Advanced Model Selector

Click the model button (shows current model icon + name) to open the selector.

### Available Models:

#### ⚡ Fast
- **Engine**: Step 3.5 Flash
- **Best for**: Quick questions, simple tasks, casual chat
- **Quota**: 60 requests/day
- **Speed**: Fastest responses

#### 👑 Pro
- **Engine**: Trinity Large Preview
- **Best for**: Complex tasks, detailed explanations
- **Quota**: 30 requests/day
- **Speed**: Moderate

#### 🧠 Fast + Reasoning
- **Engine**: DeepSeek R1 Distill 70B
- **Best for**: Fast reasoning, math, coding problems
- **Quota**: 60 requests/day (shares with Fast)
- **Speed**: Fast with reasoning overhead
- **Special**: Shows thinking process

#### 🔬 Pro + Reasoning
- **Engine**: DeepSeek R1
- **Best for**: Most complex reasoning tasks
- **Quota**: 30 requests/day (shares with Pro)
- **Speed**: Slower but most thorough
- **Special**: Most detailed reasoning

### Model Selector Features:
- Real-time quota display for each model
- Visual indicators (icons and colors)
- One-click switching
- Remembers your choice per chat

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send your message (Shift+Enter for new line) |
| `Ctrl + Enter` | Also sends your message |
| `Ctrl + Shift + M` | Cycle through all 4 models |
| `Escape` | Stop generation or close modals |

---

## 💡 Tips

1. **Start with Fast** for quick questions, switch to Pro for complex ones
2. **Enable reasoning** when you need to understand the solution process
3. **Watch your quota** - reasoning models count toward their base model quota
4. **Use keyboard shortcuts** for faster workflow
5. **Export important chats** before clearing history

---

## 🎨 UI Elements

### Input Area Layout:
- **Left side**: Attach button (+ menu) and Think toggle
- **Center**: Text input area
- **Right side**: Model selector, microphone, and send button

### Think Button States:
- **Inactive** (gray): Regular mode, shows "Think"
- **Active** (blue glow): Reasoning mode enabled, shows "Thinking"

### Model Selector:
- Located on the right side of the input area
- Shows current model icon and name
- Click to open dropdown menu (opens upward)
- Each option shows quota remaining
- Hover for visual feedback

### Status Indicators:
- **Green dot**: Plenty of quota remaining
- **Yellow dot**: Running low on quota
- **Red dot**: Quota exhausted

---

## 🔧 Technical Details

### Reasoning Models:
- Use `<think>` tags to show reasoning process
- Automatically collapsed in UI (click to expand)
- Display reasoning token count
- Support for complex mathematical notation

### Model Switching:
- Instant switching (no page reload)
- Preserves chat history
- Updates UI immediately
- Saves preference per conversation

### Quota System:
- Daily limits reset at midnight
- Shared between base and reasoning variants
- Visual warnings at 20% and 0% remaining
- Prevents requests when quota exhausted
