const HH_PROXY_URL = "https://functions.yandexcloud.net/d4enif5klq871kh78jdp";

const FALLBACK_VACANCIES = [
    { id: 1001, title: "Программист 1С", salary: "150 000 – 200 000 ₽", salary_details: "на руки", experience: "От 1 года до 3 лет", payment: "Выплаты: два раза в месяц", company: "ТехноПроект", city: "Москва", metro: ["Фрунзенская"], description: "Разработка и доработка конфигураций 1С:Предприятие.", requirements: "Опыт работы с 1С от 1 года, знание платформы 8.3.", link: "#", logo: null, phone: "+7 (495) 123-45-67", schedule: "Полный день", rating: 4.2, reviews: 156, isPremium: false },
    { id: 1002, title: "Python разработчик", salary: "180 000 – 250 000 ₽", salary_details: "до вычета налогов", experience: "От 3 до 6 лет", payment: "Выплаты: раз в месяц", company: "ИТ Решения", city: "Санкт-Петербург", metro: ["Петроградская"], description: "Разработка бэкенд-сервисов на FastAPI.", requirements: "Опыт коммерческой разработки на Python от 3 лет, знание SQLAlchemy, Docker.", link: "#", logo: null, phone: "+7 (812) 987-65-43", schedule: "Гибкий график", rating: 4.5, reviews: 89, isPremium: false },
    { id: 1003, title: "Frontend-разработчик React", salary: "200 000 – 250 000 ₽", salary_details: "на руки", experience: "От 3 до 6 лет", payment: "Выплаты: два раза в месяц", company: "ВебСтудия", city: "Москва", metro: ["Китай-город"], description: "Разработка интерфейсов на React, TypeScript.", requirements: "Опыт работы с React от 3 лет, знание Redux, Next.js.", link: "#", logo: null, phone: "+7 (495) 555-12-34", schedule: "Удалённо", rating: 4.7, reviews: 45, isPremium: true }
];

async function fetchVacanciesFromAPI(query, signal) {
    const params = new URLSearchParams({ text: query || "", per_page: "100", order_by: "relevance" });
    try {
        const resp = await fetch(`${HH_PROXY_URL}?${params}`, { signal });
        if (resp.ok) {
            const data = await resp.json();
            if (data.items && data.items.length) return mapHHVacancies(data.items);
        }
        console.warn("⚠️ Прокси недоступен или вернул ошибку, используем резервные вакансии");
    } catch (e) {
        if (e.name !== 'AbortError') console.error("Ошибка запроса к прокси:", e);
    }
    return getFallbackVacancies(query);
}

function getFallbackVacancies(query) {
    if (!query) return FALLBACK_VACANCIES;
    const q = query.toLowerCase();
    return FALLBACK_VACANCIES.filter(v => v.title.toLowerCase().includes(q) || v.company.toLowerCase().includes(q));
}

function mapHHVacancies(items) {
    const expMap = { "noExperience": "Без опыта", "between1And3": "От 1 года до 3 лет", "between3And6": "От 3 до 6 лет", "moreThan6": "Более 6 лет" };
    return items.map(item => ({
        id: parseInt(item.id), title: item.name,
        salary: item.salary ? `${item.salary.from ? `от ${item.salary.from.toLocaleString()}` : ""} ${item.salary.to ? `до ${item.salary.to.toLocaleString()}` : ""} ${item.salary.currency === "RUR" ? "₽" : item.salary.currency || "₽"}`.trim() || "Не указана" : "Не указана",
        salary_details: item.salary?.gross ? "до вычета налогов" : "",
        experience: expMap[item.experience?.id] || item.experience?.name || "Не указан",
        payment: "Выплаты: два раза в месяц",
        company: item.employer?.name || "Неизвестная компания",
        city: item.area?.name || "",
        metro: (item.address?.metro_stations || []).map(m => m.station_name),
        description: item.snippet?.responsibility || "",
        requirements: item.snippet?.requirement || "",
        link: item.alternate_url || `https://hh.ru/vacancy/${item.id}`,
        logo: item.employer?.logo_urls?.["90"] || null,
        phone: item.contacts?.phones?.[0]?.formatted || null,
        schedule: item.work_schedule_by_days?.map(d => d.name).join(', ') || null,
        isPremium: false, rating: 4.0, reviews: Math.floor(Math.random() * 5000)
    }));
}
