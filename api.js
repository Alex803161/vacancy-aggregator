const PROXY_URL = "https://cors-anywhere.herokuapp.com/";
const API_URL = "https://api.hh.ru/vacancies";

async function fetchVacanciesFromAPI(query) {
    const targetUrl = `${API_URL}?text=${encodeURIComponent(query)}&per_page=30&order_by=relevance`;
    const proxyUrl = PROXY_URL + targetUrl;
    try {
        const resp = await fetch(proxyUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.items && data.items.length) {
            return data.items.map(item => ({
                id: item.id,
                title: item.name,
                salary: formatSalary(item.salary),
                company: item.employer?.name || 'Не указана',
                city: item.area?.name || '',
                experience: item.experience?.name || 'Не указан',
                description: item.snippet?.responsibility || '',
                requirements: item.snippet?.requirement || '',
                link: item.alternate_url
            }));
        }
        return [];
    } catch (e) {
        console.error("Ошибка загрузки вакансий:", e);
        return [];
    }
}

function formatSalary(s) {
    if (!s) return 'з/п не указана';
    let from = s.from ? `от ${s.from.toLocaleString()}` : '';
    let to = s.to ? `до ${s.to.toLocaleString()}` : '';
    let cur = s.currency === 'RUR' ? '₽' : (s.currency || '');
    if (from && to) return `${from} ${to} ${cur}`;
    if (from) return `${from} ${cur}`;
    if (to) return `${to} ${cur}`;
    return 'з/п не указана';
}
