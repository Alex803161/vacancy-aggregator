const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

const API_URL = 'https://functions.yandexcloud.net/d4e1urrsv08ehb7k6uk8';
// Исправляем BASE_URL — без /vacancy-aggregator
const BASE_URL = 'https://vakansa24.ru';
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

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
<jobs>`;

  for (const v of vacancies) {
    const id = v.id || '';
    const title = v.name || 'Без названия';
    const employer = v.employer?.name || 'Компания не указана';
    const area = v.area?.name || '';
    // Правильная ссылка на страницу вакансии
    const url = `${BASE_URL}/vacancy.html?id=${id}`;
    // Описание – до 10000 символов (ограничение Яндекса), безопасно оборачиваем в CDATA
    const description = (v.description || 'Описание отсутствует').substring(0, 10000);
    const publishedDate = v.published_at ? formatDate(v.published_at) : currentDate;

    // Зарплата
    let salaryXml = '';
    if (v.salary && (v.salary.from || v.salary.to)) {
      salaryXml = `<salary>`;
      if (v.salary.from) salaryXml += `<from>${v.salary.from}</from>`;
      if (v.salary.to) salaryXml += `<to>${v.salary.to}</to>`;
      if (v.salary.currency) salaryXml += `<currency>${v.salary.currency === 'RUR' ? 'RUR' : v.salary.currency}</currency>`;
      salaryXml += `</salary>`;
    }

    xml += `
  <job>
    <job-id>${id}</job-id>
    <job-title>${escapeXml(title)}</job-title>
    <job-employer>${escapeXml(employer)}</job-employer>
    <job-area>${escapeXml(area)}</job-area>
    <job-url>${escapeXml(url)}</job-url>
    <job-date>${publishedDate}</job-date>
    ${salaryXml}
    <job-description><![CDATA[${description}]]></job-description>
  </job>`;
  }

  xml += `
</jobs>`;
  return xml;
}

async function main() {
  console.log('Сбор вакансий для Яндекс.Работы...');
  const vacancies = await fetchVacancies();
  if (vacancies.length === 0) {
    console.log('Нет вакансий, создаю пустой фид.');
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<jobs/>`;
    await fs.writeFile(OUTPUT_FILE, emptyXml, 'utf8');
    return;
  }
  const xml = buildXml(vacancies);
  await fs.writeFile(OUTPUT_FILE, xml, 'utf8');
  console.log(`Файл ${OUTPUT_FILE} создан, вакансий: ${vacancies.length}`);
}

main().catch(console.error);
