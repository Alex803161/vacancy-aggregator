// ssr-generator.js
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

const API_URL = 'https://functions.yandexcloud.net/d4e5m82nlqkadc3ap5o5'; // Node.js функция
const OUTPUT_DIR = path.join(__dirname, 'vacancies'); // папка для статических страниц
const SITEMAP_PATH = path.join(__dirname, 'sitemap.xml');
const BASE_URL = 'https://alex803161.github.io/vacancy-aggregator';

async function fetchVacanciesList() {
    // Получаем популярные вакансии (последние, Россия)
    const params = new URLSearchParams({
        action: 'search',
        text: '',
        area: '113', // Россия
        per_page: 100,
        order_by: 'publication_time'
    });
    const res = await axios.get(`${API_URL}?${params.toString()}`);
    return res.data.items || [];
}

async function fetchVacancyDetail(id) {
    const res = await axios.get(`${API_URL}?action=vacancy&id=${id}`);
    return res.data;
}

function buildStaticHTML(vacancy) {
    const title = `${vacancy.name} — вакансия в компании ${vacancy.employer?.name || 'не указана'} — ВКАНСА`;
    const description = (vacancy.description || '').replace(/<[^>]*>/g, '').substring(0, 160);
    const salary = vacancy.salary
        ? (vacancy.salary.from ? `от ${vacancy.salary.from}` : '') +
          (vacancy.salary.to ? ` до ${vacancy.salary.to}` : '') +
          (vacancy.salary.currency ? ` ${vacancy.salary.currency}` : '')
        : 'не указана';
    const city = vacancy.area?.name || '';
    const employerName = vacancy.employer?.name || 'Компания не указана';
    const datePosted = vacancy.published_at ? new Date(vacancy.published_at).toISOString() : new Date().toISOString();

    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${BASE_URL}/vacancies/${vacancy.id}.html">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${BASE_URL}/vacancies/${vacancy.id}.html">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": "${vacancy.name}",
      "description": "${(vacancy.description || '').replace(/"/g, '\\"').substring(0, 500)}",
      "hiringOrganization": {
        "@type": "Organization",
        "name": "${employerName}"
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "${city}"
        }
      },
      "datePosted": "${datePosted}",
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "${vacancy.salary?.currency || 'RUR'}",
        "value": {
          "@type": "QuantitativeValue",
          "minValue": ${vacancy.salary?.from || 'null'},
          "maxValue": ${vacancy.salary?.to || 'null'},
          "unitText": "MONTH"
        }
      }
    }
    </script>
</head>
<body>
    <h1>${vacancy.name}</h1>
    <p><strong>Компания:</strong> ${employerName}</p>
    <p><strong>Зарплата:</strong> ${salary}</p>
    <p><strong>Город:</strong> ${city}</p>
    <p><strong>Дата публикации:</strong> ${new Date(vacancy.published_at).toLocaleDateString('ru-RU')}</p>
    <div>
        <h2>Описание</h2>
        <div>${vacancy.description || 'Описание отсутствует'}</div>
    </div>
    <p><strong>Навыки:</strong> ${(vacancy.key_skills || []).map(s => s.name).join(', ') || 'не указаны'}</p>
    <p><a href="${vacancy.alternate_url || '#'}" rel="nofollow">Оригинал вакансии на hh.ru</a></p>
    <p><a href="${BASE_URL}/">Перейти к поиску вакансий</a></p>
</body>
</html>`;
}

async function generateSitemap(vacancyIds) {
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
  </url>
  <url>
    <loc>${BASE_URL}/vacancies.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

    for (const id of vacancyIds) {
        xml += `
  <url>
    <loc>${BASE_URL}/vacancies/${id}.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    xml += `
  <url>
    <loc>${BASE_URL}/favorites.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/history.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${BASE_URL}/post-job.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${BASE_URL}/admin.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${BASE_URL}/privacy.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${BASE_URL}/terms.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${BASE_URL}/contacts.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>`;

    await fs.writeFile(SITEMAP_PATH, xml, 'utf8');
    console.log('sitemap.xml обновлён');
}

async function main() {
    console.log('Получение списка вакансий...');
    const vacancies = await fetchVacanciesList();
    console.log(`Найдено ${vacancies.length} вакансий`);

    const vacancyIds = [];
    await fs.ensureDir(OUTPUT_DIR);

    for (const vac of vacancies) {
        if (!vac.id) continue;
        try {
            console.log(`Получение деталей вакансии ${vac.id}...`);
            const detail = await fetchVacancyDetail(vac.id);
            if (detail && detail.id) {
                const html = buildStaticHTML(detail);
                const filePath = path.join(OUTPUT_DIR, `${detail.id}.html`);
                await fs.writeFile(filePath, html, 'utf8');
                vacancyIds.push(detail.id);
                console.log(`Сгенерирован файл vacancies/${detail.id}.html`);
            }
        } catch (e) {
            console.error(`Ошибка для вакансии ${vac.id}: ${e.message}`);
        }
    }

    console.log('Генерация sitemap.xml...');
    await generateSitemap(vacancyIds);
    console.log('Готово!');
}

main().catch(console.error);
