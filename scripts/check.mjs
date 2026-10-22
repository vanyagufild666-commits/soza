import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '../dist');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
assert.match(html, /<html lang="ru">/);
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Exactly one h1 required');
assert.match(html, /Нефтезаводская, 10/);
assert.match(html, /студия подкастов/);
assert.ok(!/%%[A-Z_]+%%/.test(html), 'No unresolved placeholders');
assert.ok(!/noindex/.test(html), 'Landing must allow indexing');
assert.ok(!/(?:src|href)="http:\/\//.test(html), 'No mixed HTTP resources');
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
const faq = schema['@graph'].find(item => item['@type'] === 'FAQPage');
const visibleFaq = [...html.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/gs)];
assert.equal(faq.mainEntity.length, visibleFaq.length, 'Structured FAQ must match the visible FAQ');
for (const [i, [, question, answer]] of visibleFaq.entries()) {
  assert.equal(faq.mainEntity[i].name, question);
  assert.equal(faq.mainEntity[i].acceptedAnswer.text, answer);
}
const video = schema['@graph'].find(item => item['@type'] === 'VideoObject');
assert.equal(video.contentUrl, `${html.match(/rel="canonical" href="([^"]+)"/)[1]}assets/invitation.mp4`);
assert.ok(html.includes(video.name), 'Video name must match its accessible label');
assert.equal((html.match(/<video\b/g) || []).length, 1, 'Only one invitation player');
assert.ok(!schema['@graph'].some(item => item['@type'] === 'Event'), 'Do not invent an event date');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
  if (href.startsWith('#')) assert.ok(ids.has(href.slice(1)), `Missing anchor: ${href}`);
  if (href.startsWith('tel:')) assert.equal(href, 'tel:+79836212148', 'Wrong contact phone');
}
for (const [, asset] of html.matchAll(/(?:src|href|poster)="(assets\/[^"?#]+)"/g)) await access(resolve(root, asset));
await access(resolve(root, 'assets/social.png'));
const canonical = html.match(/rel="canonical" href="([^"]+)"/)[1];
assert.ok(canonical.startsWith('https://'));
assert.ok((await readFile(resolve(root, 'sitemap.xml'), 'utf8')).includes(`<loc>${canonical}</loc>`));
assert.ok((await readFile(resolve(root, 'robots.txt'), 'utf8')).includes(`Sitemap: ${canonical}sitemap.xml`));
console.log('Passed: contact links, navigation, local assets, SEO metadata, sitemap and structured data.');

const resources = JSON.parse(await readFile(resolve(root, '../src/resources.json'), 'utf8'));
const titles = new Set([html.match(/<title>(.*?)<\/title>/s)[1]]);
const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
for (const page of resources) {
  const content = await readFile(resolve(root, page.path), 'utf8');
  const title = content.match(/<title>(.*?)<\/title>/s)[1];
  assert.ok(!titles.has(title), 'Distinct search intents need distinct titles');
  titles.add(title);
  assert.equal((content.match(/<h1\b/g) || []).length, 1);
  assert.ok(content.includes(`rel="canonical" href="${canonical}${page.path}"`));
  assert.ok(sitemap.includes(`<loc>${canonical}${page.path}</loc>`));
  assert.ok(html.includes(`href="${page.path}"`), 'No orphan support pages');
  assert.ok(!/%%[A-Z_]+%%|noindex/.test(content));
  const graph = JSON.parse(content.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.ok(graph['@graph'].some(item => item['@type'] === 'BreadcrumbList'));
  for (const [, href] of content.matchAll(/(?:href|src|poster)="([^"]+)"/g)) {
    if (/^(https?:|tel:|#)/.test(href) || href.startsWith('./')) continue;
    await access(resolve(root, href));
  }
  if (page.path === 'videopriglashenie.html') {
    assert.equal((content.match(/<video\b/g) || []).length, 1);
    assert.ok(graph['@graph'].some(item => item['@type'] === 'VideoObject'));
  }
}
console.log('Passed: resource canonicals, distinct titles, discoverable links, sitemap, breadcrumbs, local video.');
