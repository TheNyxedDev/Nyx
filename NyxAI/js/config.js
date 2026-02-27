/* ══════════════════════════════════════════════════════════════
   Nyx — Configuration
   ══════════════════════════════════════════════════════════════ */

const NyxConfig = {
    API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    API_KEY: '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',

    MODELS: {
        pro: {
            id: 'arcee-ai/trinity-large-preview:free',
            label: 'Pro',
            icon: '👑',
            subtext: 'Nyx Pro',
            category: 'pro',
            rateLimit: 30,
            maxConcurrent: 6,
            color: '#a78bfa'
        },
        thinking: {
            id: 'arcee-ai/trinity-large-preview:free',
            label: 'Think',
            icon: '🧠',
            subtext: 'Nyx Reasoning',
            category: 'thinking',
            rateLimit: 30,
            maxConcurrent: 6,
            color: '#38bdf8'
        },
        fast: {
            id: 'stepfun/step-3.5-flash:free',
            label: 'Fast',
            icon: '⚡',
            subtext: 'Nyx Fast',
            category: 'fast',
            rateLimit: 60,
            maxConcurrent: 12,
            color: '#34d399'
        }
    },

    DEFAULT_MODEL: 'pro',

    TEMPERATURE: { pro: 0.7, thinking: 0.6, fast: 0.7 },
    MAX_TOKENS: 4096
};
