const HH_PROXY_URL = "https://functions.yandexcloud.net/d4enif5klq871kh78jdp";

async function fetchVacanciesFromAPI(query, signal, retries = 3) {
    const params = new URLSearchParams({ text: query || "", per_page: "100", order_by: "relevance" });
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const resp = await fetch(`${HH_PROXY_URL}?${params}`, { signal });
            if (resp.ok) {
                const data = await resp.json();
                return mapHHVacancies(data.items || []);
            }
            if (resp.status >= 500 && attempt < retries) {
                console.warn(`Прокси вернул ${resp.status}, повторная попытка ${attempt}...`);
                await new Promise(r => setTimeout(r, 1000 * attempt));
                continue;
            }
            throw new Error(`HTTP ${resp.status}`);
        } catch (e) {
            if (e.name === 'AbortError') throw e;
            if (attempt === retries) {
                console.error(`Ошибка API после ${retries} попыток:`, e);
                return [];  // возвращаем пустой массив, не падаем
            }
            console.warn(`Ошибка, повторная попытка ${attempt}...`);
            await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }
    return [];
}

function mapHHVacancies(items) {
    const experienceMap = {
        "noExperience": "Без опыта",
        "between1And3": "От 1 года до 3 лет",
        "between3And6": "От 3 до 6 лет",
        "moreThan6": "Более 6 лет"
    };
    return items.map(item => {
        let salaryStr = "Не указана";
        let salaryDetails = "";
        if (item.salary) {
            const from = item.salary.from ? `от ${item.salary.from.toLocaleString()}` : "";
            const to = item.salary.to ? `до ${item.salary.to.toLocaleString()}` : "";
            const currency = item.salary.currency === "RUR" ? "₽" : item.salary.currency || "₽";
            if (from && to) salaryStr = `${from} – ${to} ${currency}`;
            else if (from) salaryStr = `${from} ${currency}`;
            else if (to) salaryStr = `до ${to} ${currency}`;
            if (item.salary.gross) salaryDetails = "до вычета налогов";
        }
        const logo = item.employer?.logo_urls?.["90"] || item.employer?.logo_urls?.original || null;
        const phone = item.contacts?.phones?.[0]?.formatted || null;
        const schedule = item.work_schedule_by_days?.map(d => d.name).join(', ') || null;
        return {
            id: parseInt(item.id),
            title: item.name,
            salary: salaryStr,
            salary_details: salaryDetails,
            experience: experienceMap[item.experience?.id] || item.experience?.name || "Не указан",
            company: item.employer?.name || "Неизвестная компания",
            city: item.area?.name || "",
            metro: (item.address?.metro_stations || []).map(m => m.station_name),
            description: item.snippet?.responsibility || "",
            requirements: item.snippet?.requirement || "",
            link: item.alternate_url || `https://hh.ru/vacancy/${item.id}`,
            logo: logo,
            phone: phone,
            schedule: schedule,
            isPremium: false,
            payment: "Выплаты: два раза в месяц",
            rating: 4.0,
            reviews: Math.floor(Math.random() * 5000)
        };
    });
}
