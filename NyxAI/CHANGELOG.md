# Changelog

## Latest Update - Removed Login System

### ✅ Login System Removed
- **No authentication required** - app works immediately
- Removed auth modal and all login UI
- Simplified quota management (local storage only)
- Daily limits: 60 fast requests, 30 pro requests
- Quotas reset automatically at midnight
- Cleaner, faster user experience

---

## Previous Update - Enhanced UI & Functionality

### ✅ Completed Changes

#### 1. Enter Key Submission
- **Enter** key now sends messages (previously required Ctrl+Enter)
- **Shift+Enter** creates a new line in the textarea
- **Ctrl+Enter** still works as an alternative
- More intuitive chat experience matching modern chat apps

#### 2. Model Selector Repositioned
- Moved from left side to **right side** of input area
- Now positioned between the text input and microphone button
- Dropdown menu opens upward and aligns to the right
- Better visual balance and more accessible placement

#### 3. Input Area Layout
```
[Attach] [Think] ────── [Text Input] ────── [Model] [Mic] [Send]
   Left                    Center                Right
```

#### 4. Reasoning Mode (Think Button)
- Toggle button enables deep reasoning on any model
- Fast → Fast + Reasoning (DeepSeek R1 Distill 70B)
- Pro → Pro + Reasoning (DeepSeek R1)
- Visual feedback with blue glow when active
- Shows reasoning process in collapsible sections

#### 5. Advanced Model Selector
- 4 models available:
  - ⚡ Fast (Step 3.5 Flash)
  - 👑 Pro (Trinity Large)
  - 🧠 Fast + Reasoning (DeepSeek R1 Distill 70B)
  - 🔬 Pro + Reasoning (DeepSeek R1)
- Real-time quota display for each model
- Smooth animations and hover effects
- Toast notifications on model switch

#### 6. Keyboard Shortcuts Enhanced
- `Enter` - Send message
- `Shift+Enter` - New line
- `Ctrl+Enter` - Send message (alternative)
- `Ctrl+Shift+M` - Cycle through all 4 models
- `Escape` - Stop generation or close modals

### 🎨 UI Improvements
- Modern, polished design
- Smooth transitions and animations
- Better visual hierarchy
- Responsive layout
- Consistent spacing and alignment

### 📝 Documentation Updates
- Updated README.md with new features
- Created FEATURES.md with detailed usage guide
- Updated keyboard shortcuts documentation
- Added this CHANGELOG.md

### 🔧 Technical Details

#### Files Modified:
- `js/app.js` - Added Enter key handler, repositioned model selector logic
- `js/config.js` - Added 4 models with reasoning variants
- `index.html` - Moved model selector to right side of input
- `css/styles.css` - Updated model selector positioning (right-aligned)
- `README.md` - Updated documentation
- `FEATURES.md` - Created comprehensive feature guide

#### Key Functions:
- `initInput()` - Added Enter key listener for message submission
- `initModelSelector()` - Handles model selection UI
- `initThinkToggle()` - Manages reasoning mode toggle
- `updateInputUI()` - Updates all UI elements when model changes

### 🚀 Usage
1. Type your message in the input area
2. Press **Enter** to send (or click send button)
3. Use **Shift+Enter** for multi-line messages
4. Click model selector (right side) to choose a model
5. Click **Think** button to enable reasoning mode
6. Use **Ctrl+Shift+M** to quickly cycle through models

### 🎯 Benefits
- More intuitive message sending (Enter key)
- Better visual layout (model selector on right)
- Easy access to reasoning capabilities
- Clear model selection with quota info
- Professional, modern interface
