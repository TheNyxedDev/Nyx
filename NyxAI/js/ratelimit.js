/* ══════════════════════════════════════════════════════════════
   Nyx — Quota Manager (Client-side, no auth required)
   ══════════════════════════════════════════════════════════════ */

const QuotaManager = (() => {
    const DAILY_LIMITS = {
        fast: 60,
        pro: 30
    };

    let quotas = {};
    let lastReset = 0;

    function save() {
        localStorage.setItem('nyx_quotas', JSON.stringify({ quotas, lastReset }));
    }

    function load() {
        try {
            const data = JSON.parse(localStorage.getItem('nyx_quotas') || '{}');
            quotas = data.quotas || {};
            lastReset = data.lastReset || 0;
            checkReset();
        } catch (e) { 
            resetQuotas(); 
        }
    }

    function checkReset() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        if (lastReset < startOfDay) {
            resetQuotas();
        }
    }

    function resetQuotas() {
        quotas = { ...DAILY_LIMITS };
        lastReset = Date.now();
        save();
    }

    load();

    return {
        init() {
            // No auth modal needed
        },
        consume(modelCategory) {
            checkReset();
            if (quotas[modelCategory] > 0) {
                quotas[modelCategory] -= 1;
                save();

                // Notifications
                if (quotas[modelCategory] === 5) {
                    Nyx.toast(`Warning: 5 ${modelCategory} messages left today`, 'error');
                }

                return true;
            }
            return false;
        },
        getUsageText(modelCategory) {
            checkReset();
            const left = quotas[modelCategory] || 0;
            const total = DAILY_LIMITS[modelCategory];
            return `${left} / ${total} ${modelCategory.toUpperCase()}`;
        },
        getLeft(modelCategory) {
            checkReset();
            return quotas[modelCategory] || 0;
        },
        getTotal(modelCategory) {
            return DAILY_LIMITS[modelCategory] || 1;
        }
    };
})();

// Bridge RateLimit to QuotaManager to preserve interface
const RateLimit = {
    recordRequest(mk) {
        const cfg = NyxConfig.MODELS[mk];
        if (cfg) QuotaManager.consume(cfg.category);
    },
    canUse(mk) {
        const cfg = NyxConfig.MODELS[mk];
        if (cfg) return QuotaManager.getLeft(cfg.category) > 0;
        return false;
    },
    findAlternative(mk) {
        return null;
    },
    handleRateLimited() { },
    updateFromHeaders() { },
    getStatusInfo(mk) {
        const cfg = NyxConfig.MODELS[mk];
        if (!cfg) return { color: '#6b7280' };
        const left = QuotaManager.getLeft(cfg.category);
        const total = QuotaManager.getTotal(cfg.category);
        if (left === 0) return { color: '#ef4444' };
        if (left / total < 0.2) return { color: '#fbbf24' };
        return { color: '#34d399' };
    },
    getUsageStats(mk) {
        const cfg = NyxConfig.MODELS[mk];
        if (!cfg) return { used: 0, limit: 1 };
        const left = QuotaManager.getLeft(cfg.category);
        const total = QuotaManager.getTotal(cfg.category);
        return { used: total - left, limit: total };
    }
};

document.addEventListener('DOMContentLoaded', () => QuotaManager.init());
