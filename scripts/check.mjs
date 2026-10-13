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
assert.equal(schema['@graph'][0].telephone, '+79836212148');
assert.equal(schema['@graph'][2].mainEntity.length, 4);
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
  if (href.startsWith('#')) assert.ok(ids.has(href.slice(1)), `Missing anchor: ${href}`);
  if (href.startsWith('tel:')) assert.equal(href, 'tel:+79836212148', 'Wrong contact phone');
}
for (const [, asset] of html.matchAll(/(?:src|href)="(assets\/[^"?#]+)"/g)) await access(resolve(root, asset));
await access(resolve(root, 'assets/social.png'));
const canonical = html.match(/rel="canonical" href="([^"]+)"/)[1];
assert.ok(canonical.startsWith('https://'));
assert.ok((await readFile(resolve(root, 'sitemap.xml'), 'utf8')).includes(`<loc>${canonical}</loc>`));
assert.ok((await readFile(resolve(root, 'robots.txt'), 'utf8')).includes(`Sitemap: ${canonical}sitemap.xml`));
console.log('Passed: contact links, navigation, local assets, SEO metadata, sitemap and structured data.');
