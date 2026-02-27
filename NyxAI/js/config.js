/* ══════════════════════════════════════════════════════════════
   Nyx — Configuration
   ══════════════════════════════════════════════════════════════ */

const NyxConfig = {
    API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    API_KEY: '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',

    MODELS: {
        'fast': {
            id: 'stepfun/step-3.5-flash:free',
            label: 'Fast',
            icon: '⚡',
            subtext: 'Nyx Fast',
            category: 'fast',
            rateLimit: 60,
            maxConcurrent: 12,
            color: '#34d399',
            description: 'Quick responses for everyday tasks'
        },
        'pro': {
            id: 'arcee-ai/trinity-large-preview:free',
            label: 'Pro',
            icon: '👑',
            subtext: 'Nyx Pro',
            category: 'pro',
            rateLimit: 30,
            maxConcurrent: 6,
            color: '#a78bfa',
            description: 'Advanced reasoning for complex problems'
        },
        'fast-reasoning': {
            id: 'deepseek/deepseek-r1-distill-llama-70b:free',
            label: 'Fast + Reasoning',
            icon: '🧠',
            subtext: 'Fast with Deep Thinking',
            category: 'fast',
            rateLimit: 60,
            maxConcurrent: 12,
            color: '#38bdf8',
            description: 'Fast model with reasoning capabilities',
            supportsReasoning: true
        },
        'pro-reasoning': {
            id: 'deepseek/deepseek-r1:free',
            label: 'Pro + Reasoning',
            icon: '🔬',
            subtext: 'Pro with Deep Thinking',
            category: 'pro',
            rateLimit: 30,
            maxConcurrent: 6,
            color: '#8b5cf6',
            description: 'Most powerful reasoning model',
            supportsReasoning: true
        }
    },

    DEFAULT_MODEL: 'fast',

    TEMPERATURE: { 
        'fast': 0.7, 
        'pro': 0.7,
        'fast-reasoning': 0.6,
        'pro-reasoning': 0.6
    },
    MAX_TOKENS: 4096
};
