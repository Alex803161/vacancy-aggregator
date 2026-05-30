const PROXY_URL = "https://api.allorigins.win/raw?url=";
const HH_API_URL = "https://api.hh.ru/vacancies";

async function fetchVacanciesFromAPI(query) {
    const params = new URLSearchParams({
        text: query || "",
        per_page: "20",
        order_by: "relevance"
    });
    const targetUrl = `${HH_API_URL}?${params.toString()}`;
    const proxyUrl = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;
    
    try {
        const resp = await fetch(proxyUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const wrapper = await resp.json();
        const data = wrapper.contents ? JSON.parse(wrapper.contents) : wrapper;
        if (data.items && data.items.length) return data.items;
        return [];
    } catch (e) {
        console.error("Ошибка:", e);
        return [];
    }
}
