import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const configuredUrl = process.env.SITE_URL || 'https://vanyagufild666-commits.github.io/soza/';
const url = new URL(configuredUrl);
if (url.protocol !== 'https:' || url.search || url.hash) throw new Error('SITE_URL must be an absolute HTTPS URL without query or hash');
const siteUrl = url.href.endsWith('/') ? url.href : `${url.href}/`;
let html = await readFile(resolve(root, 'src/index.html'), 'utf8');
const organization = {
  '@type': 'Organization', '@id': `${siteUrl}#group`,
  name: 'Собрания созависимых в Омске', url: siteUrl, telephone: '+79836212148',
  address: { '@type': 'PostalAddress', addressLocality: 'Омск', streetAddress: 'ул. Нефтезаводская, 10, студия подкастов', addressCountry: 'RU' }
};
const questions = [...html.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/gs)].map(([, question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } }));
const schema = { '@context': 'https://schema.org', '@graph': [organization, { '@type': 'WebPage', '@id': `${siteUrl}#page`, url: siteUrl, name: 'Собрания созависимых в Омске', inLanguage: 'ru-RU', about: { '@id': `${siteUrl}#group` } }, { '@type': 'FAQPage', '@id': `${siteUrl}#questions`, mainEntity: questions }] };
const videoBlock = await readFile(resolve(root, 'src/video.html'), 'utf8');
html = html.replaceAll('%%SITE_URL%%', siteUrl).replace('%%STRUCTURED_DATA%%', `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`).replace('%%VIDEO_BLOCK%%', videoBlock);
if (/%%[A-Z_]+%%/.test(html)) throw new Error('Unresolved build placeholders');
await mkdir(resolve(root, 'dist'), { recursive: true });
await cp(resolve(root, 'src/assets'), resolve(root, 'dist/assets'), { recursive: true });
await writeFile(resolve(root, 'dist/index.html'), html);
await writeFile(resolve(root, 'dist/robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`);
await writeFile(resolve(root, 'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl.replaceAll('&', '&amp;')}</loc></url></urlset>\n`);
await writeFile(resolve(root, 'dist/.nojekyll'), '');
await writeFile(resolve(root, 'dist/404.html'), `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Страница не найдена</title><body style="background:#f8f7f2;color:#303d32;font:18px/1.7 Arial,sans-serif;padding:8vw"><h1>Страница не найдена</h1><p><a href="${siteUrl}">Перейти на сайт собраний созависимых в Омске</a></p><p><a href="tel:+79836212148">Связаться: +7 983 621-21-48</a></p></body></html>`);
console.log(`Built static site: ${siteUrl}`);
