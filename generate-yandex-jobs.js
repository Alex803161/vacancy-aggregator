// generate-yandex-jobs.js
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

const API_URL = 'https://functions.yandexcloud.net/d4e1urrsv08ehb7k6uk8';
const BASE_URL = 'https://vkansa24.ru/vacancy-aggregator';
const OUTPUT_FILE = path.join(__dirname, 'yandex_jobs.xml');

async function fetchVacancies() {
  const params = new URLSearchParams({
    action: 'vacancies',
    text: '',
    area: '113',
    per_page: 100,
    order_by: 'publication_time'
  });
  const res = await axios.get(`${API_URL}?${params.toString()}`);
  const items = res.data.items || [];
  // Добавляем прямые вакансии
  const direct = JSON.parse(require('fs').readFileSync(path.join(__dirname, 'direct_jobs.json'), 'utf8') || '[]');
  const directItems = direct.map(j => ({
    id: j.id,
    name: j.title,
    employer: { name: j.company },
    salary: j.salary,
    area: { name: j.city },
    published_at: j.timestamp
  }));
  return [...items, ...directItems].slice(0, 100);
}

function buildXml(vacancies) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<jobs>
  <employer>
    <name>ВКАНСА</name>
    <url>${BASE_URL}</url>
  </employer>`;

  for (const v of vacancies) {
    const salary = v.salary
      ? (v.salary.from ? `от ${v.salary.from}` : '') + (v.salary.to ? ` до ${v.salary.to}` : '') + (v.salary.currency ? ` ${v.salary.currency}` : '')
      : 'Не указана';
    xml += `
  <job>
    <title>${v.name || 'Без названия'}</title>
    <description>${(v.description || '').substring(0, 500)}</description>
    <salary>${salary}</salary>
    <area>${v.area?.name || ''}</area>
    <url>${BASE_URL}/vacancy.html?id=${v.id}</url>
    <date>${v.published_at || new Date().toISOString()}</date>
  </job>`;
  }

  xml += '\n</jobs>';
  return xml;
}

async function main() {
  console.log('Сбор вакансий для Яндекс.Работы...');
  const vacancies = await fetchVacancies();
  const xml = buildXml(vacancies);
  await fs.writeFile(OUTPUT_FILE, xml, 'utf8');
  console.log(`Файл ${OUTPUT_FILE} создан, вакансий: ${vacancies.length}`);
}

main().catch(console.error);
