const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

// ИСПРАВЛЕНО: Используем тот же API URL, что и на основном сайте
const API_URL = 'https://functions.yandexcloud.net/d4e1urrsv08ehb7k6uk8';
const OUTPUT_DIR = path.join(__dirname, 'vacancies');
const SITEMAP_PATH = path.join(__dirname, 'sitemap.xml');
const BASE_URL = 'https://alex803161.github.io/vacancy-aggregator';

const CITIES = [
  { id: '1', name: 'Москва', slug: 'moskva' },
  { id: '2', name: 'Санкт-Петербург', slug: 'sankt-peterburg' },
  { id: '88', name: 'Казань', slug: 'kazan' },
  { id: '4', name: 'Новосибирск', slug: 'novosibirsk' },
  { id: '3', name: 'Екатеринбург', slug: 'ekaterinburg' },
  { id: '66', name: 'Нижний Новгород', slug: 'nizhnij-novgorod' },
  { id: '113', name: 'Россия', slug: 'rossiya' }
];

const PROFESSIONS = [
  'водитель', 'продавец', 'менеджер', 'бухгалтер', 'программист',
  'строитель', 'инженер', 'врач', 'учитель', 'курьер'
];

async function fetchVacanciesForArea(areaId, text = '', perPage = 50) {
  const params = new URLSearchParams({
    action: 'vacancies',
    text: text,
    area: areaId,
    per_page: perPage,
    order_by: 'publication_time'
  });
  console.log(`Запрос к API: ${API_URL}?${params.toString()}`);
  const res = await axios.get(`${API_URL}?${params.toString()}`);
  console.log(`Статус ответа: ${res.status}, всего вакансий: ${res.data.items?.length || 0}`);
  return res.data.items || [];
}

// Функции buildCityPage и buildProfessionPage остались без изменений
function buildCityPage(city, vacancies) {
  const title = `Работа в ${city.name} – свежие вакансии | ВКАНСА`;
  const description = `Найдите работу в ${city.name}. Актуальные вакансии от прямых работодателей и кадровых агентств. Удобный поиск и фильтры.`;
  let html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${BASE_URL}/vacancies/rossiya/${city.slug}.html">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${BASE_URL}/vacancies/rossiya/${city.slug}.html">
  <link rel="stylesheet" href="${BASE_URL}/style.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Главная", "item": "${BASE_URL}/" },
      { "@type": "ListItem", "position": 2, "name": "${city.name}" }
    ]
  }
  </script>
</head>
<body>
  <div class="container">
    <nav class="breadcrumbs">
      <a href="${BASE_URL}/">Главная</a> <span>→</span> <span>${city.name}</span>
    </nav>
    <div class="header">
      <h1>Работа в ${city.name}</h1>
      <p>Свежие вакансии от проверенных работодателей</p>
    </div>
    <div class="vacancies-list">`;

  for (const v of vacancies) {
    const emp = v.employer?.name || 'Компания не указана';
    const salary = v.salary
      ? (v.salary.from ? `от ${v.salary.from}` : '') + (v.salary.to ? ` до ${v.salary.to}` : '') + (v.salary.currency ? ` ${v.salary.currency}` : '')
      : 'З/П не указана';
    html += `
      <div class="vacancy-card">
        <h3><a href="${BASE_URL}/vacancy.html?id=${v.id}">${v.name}</a></h3>
        <div class="company">${emp}</div>
        <div class="salary">${salary}</div>
        <div class="address">${v.area?.name || city.name}</div>
      </div>`;
  }

  html += `
    </div>
    <p><a href="${BASE_URL}/">← На главную</a></p>
    <div class="section-title" style="margin-top:30px;">Другие города</div>
    <div class="companies-grid">
      ${CITIES.filter(c => c.slug !== city.slug).map(c => `<a href="${BASE_URL}/vacancies/rossiya/${c.slug}.html" class="company-card">${c.name}</a>`).join('')}
    </div>
  </div>
</body>
</html>`;
  return html;
}

function buildProfessionPage(profession, vacancies) {
  const title = `Работа ${profession} – свежие вакансии | ВКАНСА`;
  const description = `Вакансии ${profession} по всей России. Актуальные предложения от прямых работодателей. Удобный поиск и фильтры.`;
  let html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${BASE_URL}/vacancies/professiya/${profession}.html">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${BASE_URL}/vacancies/professiya/${profession}.html">
  <link rel="stylesheet" href="${BASE_URL}/style.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Главная", "item": "${BASE_URL}/" },
      { "@type": "ListItem", "position": 2, "name": "Профессия ${profession}" }
    ]
  }
  </script>
</head>
<body>
  <div class="container">
    <nav class="breadcrumbs">
      <a href="${BASE_URL}/">Главная</a> <span>→</span> <span>Профессия ${profession}</span>
    </nav>
    <div class="header">
      <h1>Работа ${profession} в России</h1>
      <p>Свежие вакансии от проверенных работодателей</p>
    </div>
    <div class="vacancies-list">`;

  for (const v of vacancies) {
    const emp = v.employer?.name || 'Компания не указана';
    const salary = v.salary
      ? (v.salary.from ? `от ${v.salary.from}` : '') + (v.salary.to ? ` до ${v.salary.to}` : '') + (v.salary.currency ? ` ${v.salary.currency}` : '')
      : 'З/П не указана';
    html += `
      <div class="vacancy-card">
        <h3><a href="${BASE_URL}/vacancy.html?id=${v.id}">${v.name}</a></h3>
        <div class="company">${emp}</div>
        <div class="salary">${salary}</div>
        <div class="address">${v.area?.name || ''}</div>
      </div>`;
  }

  html += `
    </div>
    <p><a href="${BASE_URL}/">← На главную</a></p>
    <div class="section-title" style="margin-top:30px;">Другие профессии</div>
    <div class="companies-grid">
      ${PROFESSIONS.filter(p => p !== profession).map(p => `<a href="${BASE_URL}/vacancies/professiya/${p}.html" class="company-card">${p}</a>`).join('')}
    </div>
  </div>
</body>
</html>`;
  return html;
}

async function generateSitemap(citySlugs, professionSlugs) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/index.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  for (const slug of citySlugs) {
    xml += `
  <url>
    <loc>${BASE_URL}/vacancies/rossiya/${slug}.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  }

  for (const slug of professionSlugs) {
    xml += `
  <url>
    <loc>${BASE_URL}/vacancies/professiya/${slug}.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  xml += `
</urlset>`;
  await fs.writeFile(SITEMAP_PATH, xml, 'utf8');
  console.log('sitemap.xml обновлён');
}

async function main() {
  console.log('Запуск генерации страниц городов и профессий...');
  const citySlugs = [];
  const professionSlugs = [];

  for (const city of CITIES) {
    try {
      console.log(`Получение вакансий для города ${city.name}...`);
      const vacancies = await fetchVacanciesForArea(city.id, '', 20);
      if (vacancies.length > 0) {
        const html = buildCityPage(city, vacancies);
        const dir = path.join(OUTPUT_DIR, 'rossiya');
        await fs.ensureDir(dir);
        const filePath = path.join(dir, `${city.slug}.html`);
        await fs.writeFile(filePath, html, 'utf8');
        citySlugs.push(city.slug);
        console.log(`Сгенерирована страница города ${city.name}`);
      } else {
        console.log(`Нет вакансий для города ${city.name}, пропущено`);
      }
    } catch (e) {
      console.error(`Ошибка для города ${city.name}: ${e.message}`);
    }
  }

  for (const prof of PROFESSIONS) {
    try {
      console.log(`Получение вакансий для профессии "${prof}"...`);
      const vacancies = await fetchVacanciesForArea('113', prof, 20);
      if (vacancies.length > 0) {
        const html = buildProfessionPage(prof, vacancies);
        const dir = path.join(OUTPUT_DIR, 'professiya');
        await fs.ensureDir(dir);
        const filePath = path.join(dir, `${prof}.html`);
        await fs.writeFile(filePath, html, 'utf8');
        professionSlugs.push(prof);
        console.log(`Сгенерирована страница профессии "${prof}"`);
      } else {
        console.log(`Нет вакансий для профессии "${prof}", пропущено`);
      }
    } catch (e) {
      console.error(`Ошибка для профессии "${prof}": ${e.message}`);
    }
  }

  console.log('Обновление sitemap.xml...');
  await generateSitemap(citySlugs, professionSlugs);
  console.log('Готово!');
}

main().catch(console.error);
