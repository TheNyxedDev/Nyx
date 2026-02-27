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

    DEFAULT_MODEL: 'fast',

    TEMPERATURE: { pro: 0.7, fast: 0.7 },
    MAX_TOKENS: 4096
};
