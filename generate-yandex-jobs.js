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

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yy}-${mm}-${dd} ${hh}:${min}`;
}

function buildXml(vacancies) {
  const now = new Date();
  const currentDate = formatDate(now.toISOString());

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<vacancies>`;

  for (const v of vacancies) {
    const title = (v.name || 'Без названия').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const employer = (v.employer?.name || 'Компания не указана').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const area = (v.area?.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const url = `${BASE_URL}/vacancy.html?id=${v.id}`;
    const description = (v.description || 'Описание отсутствует').substring(0, 500).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const picture = v.employer?.logo_urls?.original || v.employer?.logo_urls?.['90'] || `${BASE_URL}/icon.svg`;
    const publishedDate = v.published_at ? formatDate(v.published_at) : currentDate;

    const salaryFrom = v.salary?.from || 0;
    const salaryTo = v.salary?.to || 0;
    const currency = v.salary?.currency === 'RUR' ? 'RUR' : 'RUR';

    xml += `
  <vacancy>
    <vacancy-title>${title}</vacancy-title>
    <vacancy-salary from="${salaryFrom}" to="${salaryTo}" currency="${currency}"/>
    <vacancy-area>${area}</vacancy-area>
    <vacancy-url>${url}</vacancy-url>
    <vacancy-employer>${employer}</vacancy-employer>
    <vacancy-date>${publishedDate}</vacancy-date>
    <vacancy-picture>${picture}</vacancy-picture>
    <vacancy-description>${description}</vacancy-description>
    <param name="конверсия"></param>
  </vacancy>`;
  }

  xml += `
</vacancies>`;
  return xml;
}

async function main() {
  console.log('Сбор вакансий для Яндекс.Работы...');
  const vacancies = await fetchVacancies();
  if (vacancies.length === 0) {
    console.log('Нет вакансий, создаю пустой фид.');
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<vacancies/>`;
    await fs.writeFile(OUTPUT_FILE, emptyXml, 'utf8');
    return;
  }
  const xml = buildXml(vacancies);
  await fs.writeFile(OUTPUT_FILE, xml, 'utf8');
  console.log(`Файл ${OUTPUT_FILE} создан, вакансий: ${vacancies.length}`);
}

main().catch(console.error);
