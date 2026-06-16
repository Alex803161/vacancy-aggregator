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
<yml_catalog date="${currentDate}">
  <shop>
    <name>ВКАНСА</name>
    <company>ВКАНСА</company>
    <url>${BASE_URL}</url>
    <currencies>
      <currency id="RUR" rate="1"/>
    </currencies>
    <categories>
      <category id="1">Работа</category>
    </categories>
    <offers>`;

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
    <offer id="${v.id}" available="true">
      <name>${title}</name>
      <url>${url}</url>
      <description>${description}</description>
      <employer>${employer}</employer>
      <area>${area}</area>
      <salary from="${salaryFrom}" to="${salaryTo}" currency="${currency}"/>
      <date>${publishedDate}</date>
      <picture>${picture}</picture>
      <categoryId>1</categoryId>
      <param name="конверсия"></param>
    </offer>`;
  }

  xml += `
    </offers>
  </shop>
</yml_catalog>`;

  // Удаляем дублирующиеся <param name="конверсия">, которые могли появиться после ручных правок
  xml = xml.replace(/<param name="конверсия"><\/param>\s*\n\s*<param name="конверсия"><\/param>/g, '<param name="конверсия"></param>');

  return xml;
}

async function main() {
  console.log('Сбор вакансий для Яндекс.Работы...');
  const vacancies = await fetchVacancies();
  if (vacancies.length === 0) {
    console.log('Нет вакансий, создаю пустой фид.');
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${formatDate(new Date().toISOString())}">
  <shop>
    <name>ВКАНСА</name>
    <company>ВКАНСА</company>
    <url>${BASE_URL}</url>
    <currencies>
      <currency id="RUR" rate="1"/>
    </currencies>
    <categories>
      <category id="1">Работа</category>
    </categories>
    <offers/>
  </shop>
</yml_catalog>`;
    await fs.writeFile(OUTPUT_FILE, emptyXml, 'utf8');
    return;
  }
  const xml = buildXml(vacancies);
  await fs.writeFile(OUTPUT_FILE, xml, 'utf8');
  console.log(`Файл ${OUTPUT_FILE} создан, вакансий: ${vacancies.length}`);
}

main().catch(console.error);
