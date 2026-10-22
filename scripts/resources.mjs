import { readFile, writeFile } from 'node:fs/promises';
export async function buildResources(root, siteUrl, video, videoBlock) {
  const pages = JSON.parse(await readFile(`${root}/src/resources.json`, 'utf8'));
  const esc = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  for (const page of pages) {
    const url = siteUrl + page.path;
    const schema = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', '@id': url, url, name: page.title, description: page.description, inLanguage: 'ru-RU', spatialCoverage: { '@type': 'Place', name: 'Омск' } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Собрание родителей в Омске', item: siteUrl }, { '@type': 'ListItem', position: 2, name: page.heading, item: url }] },
      ...(page.path === 'videopriglashenie.html' ? [{ ...video, '@id': `${url}#video`, mainEntityOfPage: url }] : [])
    ] };
    const body = page.body.replace('%%WATCH_VIDEO%%', videoBlock);
    await writeFile(`${root}/dist/${page.path}`, `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(page.title)}</title><meta name="description" content="${esc(page.description)}"><link rel="canonical" href="${url}"><link rel="stylesheet" href="assets/styles.css"><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><meta property="og:type" content="website"><meta property="og:locale" content="ru_RU"><meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${siteUrl}assets/social.png"><script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script></head><body><a class="skip-link" href="#main">Перейти к содержанию</a><main class="resource-page" id="main"><nav class="resource-nav" aria-label="Навигация"><a href="./">Собрание родителей · Омск</a><a href="tel:+79836212148">+7 983 621-21-48</a></nav><h1>${page.heading}</h1>${body}<h2>Запись и место встречи</h2><address>Омск, ул. Нефтезаводская, 10 · студия подкастов</address><p>Дата, время, вход и возможность участия — по телефону <a href="tel:+79836212148">+7 983 621-21-48</a>.</p><h2>По теме</h2><ul>${pages.filter(other => other.path !== page.path).map(other => `<li><a href="${other.path}">${other.heading}</a></li>`).join('')}<li><a href="./#questions">Ответы на вопросы о собрании</a></li></ul></main><a class="floating-phone" href="tel:+79836212148"><span><small>Запись на собрание · Омск</small>+7 983 621-21-48</span></a></body></html>`);
  }
  return pages;
}
