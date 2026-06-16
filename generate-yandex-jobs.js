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
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${new Date().toISOString().split('T')[0]}">
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
    const salaryFrom = v.salary?.from || 0;
    const salaryTo = v.salary?.to || 0;
    const price = salaryFrom > 0 ? salaryFrom : (salaryTo > 0 ? salaryTo : 0);
    const currency = v.salary?.currency === 'RUR' ? 'RUR' : 'RUR';
    const area = (v.area?.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const url = `${BASE_URL}/vacancy.html?id=${v.id}`;
    const description = (v.description || '').substring(0, 500).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const picture = v.employer?.logo_urls?.original || v.employer?.logo_urls?.['90'] || `${BASE_URL}/icon.svg`;
    const date = v.published_at ? new Date(v.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    xml += `
    <offer id="${v.id}" available="true">
      <name>${title}</name>
      <price>${price}</price>
      <currencyId>${currency}</currencyId>
      <categoryId>1</categoryId>
      <vendor>${employer}</vendor>
      <url>${url}</url>
      <picture>${picture}</picture>
      <description>${description}</description>
      <param name="Город">${area}</param>
      <param name="Дата публикации">${date}</param>
      <param name="Зарплата от">${salaryFrom}</param>
      <param name="Зарплата до">${salaryTo}</param>
      <param name="Валюта">${currency}</param>
    </offer>`;
  }

  xml += `
    </offers>
  </shop>
</yml_catalog>`;
  return xml;
}

async function main() {
  console.log('Сбор вакансий для Яндекс.Работы...');
  const vacancies = await fetchVacancies();
  if (vacancies.length === 0) {
    console.log('Нет вакансий, создаю пустой фид.');
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${new Date().toISOString().split('T')[0]}">
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
