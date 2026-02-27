/* ══════════════════════════════════════════════════════════════
   Nyx — Quota & Auth Manager (Client-side mock for GitHub Pages)
   ══════════════════════════════════════════════════════════════ */

const QuotaManager = (() => {
    const PLANS = {
        free: { buckets: { fast: 50, thinking: 20, pro: 10 } },
        normal: { buckets: { fast: 500, thinking: 200, pro: 100 } },
        max: { buckets: { fast: 2000, thinking: 1000, pro: 500 } }
    };

    let userPlan = 'free';
    let isLoggedIn = false;
    let quotas = {};
    let lastReset = 0;

    function save() {
        localStorage.setItem('nyx_auth', JSON.stringify({ isLoggedIn, userPlan, quotas, lastReset }));
    }

    function load() {
        try {
            const data = JSON.parse(localStorage.getItem('nyx_auth') || '{}');
            isLoggedIn = data.isLoggedIn || false;
            userPlan = data.userPlan || 'free';
            quotas = data.quotas || {};
            lastReset = data.lastReset || 0;
            checkReset();
        } catch (e) { resetToPlan(); }
    }

    function checkReset() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        if (lastReset < startOfDay) {
            resetToPlan();
        }
    }

    function resetToPlan() {
        quotas = { ...PLANS[userPlan].buckets };
        lastReset = Date.now();
        save();
    }

    function getNowStr() {
        return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    load();

    return {
        init() {
            setTimeout(this.checkAuthUI, 500);
        },
        checkAuthUI() {
            if (!isLoggedIn) {
                const el = document.getElementById('authModal');
                if (el) el.style.display = 'flex';
            }
        },
        signIn(plan = 'free') {
            const usernameInput = document.getElementById('authUsername');
            const username = usernameInput ? usernameInput.value.trim() : 'User';

            if (usernameInput && !username) {
                Nyx.toast('Username is required.', 'error');
                return;
            }

            if (PLANS[plan]) {
                isLoggedIn = true;
                userPlan = plan; // "Plans can only be upgraded later" — default is usually 'free'
                resetToPlan();
                const el = document.getElementById('authModal');
                if (el) el.style.display = 'none';
                Nyx.toast(`Welcome, ${username}!`, 'success');
                Sidebar.updateStatus();
            }
        },
        signOut() {
            isLoggedIn = false;
            save();
            this.checkAuthUI();
        },
        consume(modelCategory) {
            checkReset();
            // Free plan limits check
            if (quotas[modelCategory] > 0) {
                quotas[modelCategory] -= 1;
                save();

                // Notifications
                if (quotas[modelCategory] === 5) Nyx.toast(`Warning: 5 ${modelCategory} messages left today`, 'error');

                return true;
            }
            return false;
        },
        getUsageText(modelCategory) {
            checkReset();
            const left = quotas[modelCategory] || 0;
            const total = PLANS[userPlan].buckets[modelCategory];
            return `${left} / ${total} ${modelCategory.toUpperCase()}`;
        },
        getLeft(modelCategory) {
            checkReset();
            return quotas[modelCategory] || 0;
        },
        getTotal(modelCategory) {
            return PLANS[userPlan].buckets[modelCategory] || 1;
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
