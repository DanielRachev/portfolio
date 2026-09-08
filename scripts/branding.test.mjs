import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const meta = name => html.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]+)"`))?.[1];

test('canonical and social metadata use the public GitHub Pages address', () => {
  const canonical = 'https://danielrachev.github.io/portfolio/';
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}"`));
  assert.equal(meta('og:url'), canonical);
  assert.equal(meta('og:type'), 'website');
  assert.equal(meta('og:title'), 'Daniel Rachev · Software Engineer');
  assert.equal(meta('twitter:title'), meta('og:title'));
  assert.equal(meta('twitter:card'), 'summary_large_image');
  assert.equal(meta('og:image'), `${canonical}social-preview.png`);
  assert.equal(meta('twitter:image'), meta('og:image'));
  assert.ok(meta('og:image:alt'));
  assert.equal(meta('twitter:image:alt'), meta('og:image:alt'));
  assert.ok(meta('description').includes('TU Delft'));
  assert.equal(meta('theme-color'), '#000010');
  assert.ok(!html.includes('Vite + React') && !html.includes('vite.svg'));
});

test('social image and fallback icons have the declared dimensions', async () => {
  for (const [name, width, height] of [
    ['social-preview.png', 1200, 630],
    ['favicon-32.png', 32, 32],
    ['apple-touch-icon.png', 180, 180],
  ]) {
    const bytes = await readFile(new URL(`public/${name}`, root));
    const actual = await sharp(bytes).metadata();
    assert.equal(actual.format, 'png');
    assert.equal(actual.width, width);
    assert.equal(actual.height, height);
    assert.ok(bytes.length < 300_000, `${name} stays lightweight`);
  }
  assert.equal(meta('og:image:width'), '1200');
  assert.equal(meta('og:image:height'), '630');
  assert.ok(html.includes('href="%BASE_URL%favicon.svg"'));
  const favicon = await readFile(new URL('public/favicon.svg', root), 'utf8');
  assert.ok(favicon.includes('lucide-orbit') && favicon.includes('#000010'));
});
