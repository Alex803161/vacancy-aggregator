/* ========== Утилиты ========== */

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getEmployerName(employer) {
    if (!employer) return 'Компания не указана';
    return typeof employer === 'object' ? escapeHtml(employer.name) : escapeHtml(employer);
}

function formatSalary(salary) {
    if (!salary) return 'З/П не указана';
    let parts = [];
    if (salary.from) parts.push('от ' + salary.from.toLocaleString());
    if (salary.to) parts.push('до ' + salary.to.toLocaleString());
    if (salary.currency) parts.push(salary.currency === 'RUR' ? '₽' : salary.currency);
    return parts.join(' ') || 'З/П не указана';
}

function parseSalaryString(str) {
    if (!str) return null;
    const fromMatch = str.match(/от\s*([\d\s]+)/);
    const toMatch = str.match(/до\s*([\d\s]+)/);
    const currencyMatch = str.match(/[₽$€р]/);
    let currency = '₽';
    if (currencyMatch) {
        if (currencyMatch[0] === 'р') currency = '₽';
        else if (currencyMatch[0] === '$') currency = 'USD';
        else if (currencyMatch[0] === '€') currency = 'EUR';
        else currency = currencyMatch[0];
    }
    return {
        from: fromMatch ? parseInt(fromMatch[1].replace(/\s/g, '')) : null,
        to: toMatch ? parseInt(toMatch[1].replace(/\s/g, '')) : null,
        currency: currency
    };
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 3600) return Math.floor(diff / 60) + ' мин. назад';
    if (diff < 86400) return Math.floor(diff / 3600) + ' ч. назад';
    if (diff < 604800) return Math.floor(diff / 86400) + ' дн. назад';
    return date.toLocaleDateString('ru-RU');
}

/* ========== Избранное ========== */

function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function saveFavorites(favs) {
    localStorage.setItem('favorites', JSON.stringify(favs));
}

function getDeletedNotes() {
    return JSON.parse(localStorage.getItem('deletedNotes') || '{}');
}

function saveDeletedNotes(notes) {
    localStorage.setItem('deletedNotes', JSON.stringify(notes));
}

function isFavorite(id) {
    return getFavorites().some(v => v.id === id);
}

function toggleFavorite(vacancy) {
    let favs = getFavorites();
    const index = favs.findIndex(v => v.id === vacancy.id);
    if (index > -1) {
        const deletedNotes = getDeletedNotes();
        deletedNotes[vacancy.id] = favs[index].note || '';
        saveDeletedNotes(deletedNotes);
        favs.splice(index, 1);
    } else {
        const deletedNotes = getDeletedNotes();
        const restoredNote = deletedNotes[vacancy.id] || '';
        favs.push({
            id: vacancy.id,
            name: vacancy.name,
            employer: getEmployerName(vacancy.employer),
            salary: vacancy.salary || null,
            area: vacancy.area?.name || '',
            alternate_url: vacancy.alternate_url || '',
            source: vacancy.source || '',
            note: restoredNote
        });
    }
    saveFavorites(favs);
}

/* ========== Список сравнения ========== */

function getCompareList() {
    return JSON.parse(localStorage.getItem('compareList') || '[]');
}

function saveCompareList(list) {
    localStorage.setItem('compareList', JSON.stringify(list));
}

function isInCompare(id) {
    return getCompareList().some(v => v.id === id);
}

function toggleCompare(vacancy) {
    let list = getCompareList();
    const index = list.findIndex(v => v.id === vacancy.id);
    if (index > -1) {
        list.splice(index, 1);
    } else {
        list.push({
            id: vacancy.id,
            name: vacancy.name,
            employer: typeof vacancy.employer === 'object' ? vacancy.employer?.name : vacancy.employer,
            salary: vacancy.salary || null,
            area: vacancy.area?.name || '',
            schedule: vacancy.schedule?.name || vacancy.schedule || '',
            employment: vacancy.employment?.name || vacancy.employment || '',
            experience: vacancy.experience?.name || vacancy.experience || '',
            key_skills: (vacancy.key_skills || []).map(s => typeof s === 'object' ? s.name : s),
            published_at: vacancy.published_at || null,
            alternate_url: vacancy.alternate_url || ''
        });
    }
    saveCompareList(list);
}

/* ========== Тема (с автосинхронизацией) ========== */

function applyTheme(mode) {
    if (mode === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setupThemeToggle(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    const savedTheme = localStorage.getItem('theme');
    let currentTheme;
    if (savedTheme === 'dark' || savedTheme === 'light') {
        currentTheme = savedTheme;
    } else {
        currentTheme = getSystemTheme();
        localStorage.setItem('theme', 'auto');
    }
    applyTheme(currentTheme);
    btn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

    btn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
        const saved = localStorage.getItem('theme');
        if (saved !== 'dark' && saved !== 'light') {
            applyTheme(e.matches ? 'dark' : 'light');
            btn.textContent = e.matches ? '☀️' : '🌙';
        }
    });
}

/* ========== Кнопка "Наверх" ========== */

function setupBackToTop(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.style.display = window.scrollY > 300 ? 'flex' : 'none';
    });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ========== Service Worker ========== */

function registerSW(scope) {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(scope + 'sw.js')
                .then(registration => {
                    console.log('SW зарегистрирован:', registration.scope);
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                const toast = document.createElement('div');
                                toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#0047cc; color:white; padding:12px 24px; border-radius:40px; cursor:pointer; z-index:9999;';
                                toast.textContent = 'Доступна новая версия. Обновите страницу.';
                                toast.onclick = () => window.location.reload();
                                document.body.appendChild(toast);
                            }
                        };
                    };
                })
                .catch(err => console.log('Ошибка регистрации SW:', err));
        });
    }
}

/* ========== Индекс совпадения ========== */

function calculateMatchScore(vacancy, query) {
    if (!query || query.trim().length < 2) return 0;
    const keyword = query.trim().toLowerCase();
    const title = (vacancy.name || '').toLowerCase();
    const desc = (vacancy.description || '').toLowerCase();
    const keywords = keyword.split(/\s+/);

    let score = 0;

    // Название (50%)
    if (title.includes(keyword)) score += 50;
    else {
        const matchedWords = keywords.filter(w => title.includes(w)).length;
        if (matchedWords > 0) score += 25;
    }

    // Описание (30%)
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const descMatches = (desc.match(new RegExp(escapedKeyword, 'g')) || []).length;
    if (descMatches >= 3) score += 30;
    else if (descMatches >= 1) score += 15;

    // Бонус за зарплату (20%)
    if (vacancy.salary && (vacancy.salary.from || vacancy.salary.to)) score += 10;
    if (vacancy.salary && vacancy.salary.from > 150000) score += 10;

    return Math.min(score, 100);
}
