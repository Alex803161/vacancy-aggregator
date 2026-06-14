const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

const API_URL = 'https://functions.yandexcloud.net/d4e1urrsv08ehb7k6uk8';
const BASE_URL = 'https://vakansa24.ru/vacancy-aggregator';
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
  return (res.data.items || []).slice(0, 100);
}

function buildXml(vacancies) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<jobs>\n  <employer>\n    <name>ВКАНСА</name>\n    <url>${BASE_URL}</url>\n  </employer>`;

  for (const v of vacancies) {
    const salary = v.salary
      ? (v.salary.from ? `от ${v.salary.from}` : '') + (v.salary.to ? ` до ${v.salary.to}` : '') + (v.salary.currency ? ` ${v.salary.currency}` : '')
      : 'Не указана';
    xml += `
  <job>
    <title>${(v.name || 'Без названия').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
    <description>${(v.description || '').substring(0, 500).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</description>
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
  if (vacancies.length === 0) {
    console.log('Нет вакансий, фид не создан.');
    // Создаём пустой файл, чтобы избежать ошибки git add
    await fs.writeFile(OUTPUT_FILE, '<?xml version="1.0" encoding="UTF-8"?>\n<jobs>\n</jobs>', 'utf8');
    return;
  }
  const xml = buildXml(vacancies);
  await fs.writeFile(OUTPUT_FILE, xml, 'utf8');
  console.log(`Файл ${OUTPUT_FILE} создан, вакансий: ${vacancies.length}`);
}

main().catch(console.error);
