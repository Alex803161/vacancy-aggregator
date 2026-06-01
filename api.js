const API_URL = "https://functions.yandexcloud.net/d4enif5klq871kh78jdp";

async function fetchVacanciesFromAPI(query, filters = {}) {
    const params = new URLSearchParams();
    if (query) params.set('text', query);
    if (filters.area) params.set('area', filters.area);
    if (filters.employment) params.set('employment', filters.employment);
    if (filters.schedule) params.set('schedule', filters.schedule);
    if (filters.order_by) params.set('order_by', filters.order_by);
    if (filters.per_page) params.set('per_page', filters.per_page);
    if (filters.page !== undefined) params.set('page', filters.page);

    const url = `${API_URL}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    // Если облачная функция возвращает объект с полем items – берём его, иначе сам data (на случай старой версии)
    if (data && Array.isArray(data.items)) {
        return data.items;
    }
    // Если data уже массив (старый формат)
    if (Array.isArray(data)) {
        return data;
    }
    // На случай, если что-то пошло не так
    return [];
}
