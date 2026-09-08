import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Orbit } from 'lucide-react';
import sharp from 'sharp';
import { openSync } from 'fontkit';

const output = new URL('../public/', import.meta.url);
await mkdir(output, { recursive: true });
const orbit = (size, extra = {}) => renderToStaticMarkup(createElement(Orbit, {
  size, color: '#8ac9ec', strokeWidth: 1.6, ...extra,
}));
const license = `Lucide Orbit icon — ISC License
Copyright (c) 2026 Lucide Icons and Contributors
Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.
THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
`;
await writeFile(new URL('branding-license.txt', output), license);

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
<!-- ${license} -->
<rect width="64" height="64" rx="12" fill="#000010"/>
${orbit(48, { x: 8, y: 8, strokeWidth: 2 })}
</svg>`;
await writeFile(new URL('favicon.svg', output), favicon);
await sharp(Buffer.from(favicon)).resize(32, 32).png().toFile(fileURLToPath(new URL('favicon-32.png', output)));
await sharp(Buffer.from(favicon)).resize(180, 180).flatten({ background: '#000010' })
  .png().toFile(fileURLToPath(new URL('apple-touch-icon.png', output)));

const fontFile = (family, weight) => fileURLToPath(new URL(`../node_modules/@fontsource/${family}/files/${family}-latin-${weight}-normal.woff`, import.meta.url));
async function textLayer(text, size, file, color, left, top) {
  // Outline the bundled font glyphs; no system fonts or font cache required.
  const font = openSync(file);
  const run = font.layout(text);
  const scale = size / font.unitsPerEm;
  let x = 0;
  const paths = run.glyphs.map((glyph, index) => {
    const position = run.positions[index];
    const path = `<path transform="translate(${x + position.xOffset} ${position.yOffset})" d="${glyph.path.toSVG()}"/>`;
    x += position.xAdvance;
    return path;
  }).join('');
  const width = Math.ceil(x * scale) + 2;
  const height = Math.ceil((font.ascent - font.descent) * scale) + 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g fill="${color}" transform="translate(0 ${font.ascent * scale}) scale(${scale} ${-scale})">${paths}</g></svg>`;
  const input = await sharp(Buffer.from(svg)).png().toBuffer();
  return { input, left, top };
}

const decoration = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#000010"/>
<path d="M80 494H1120" stroke="#263248"/>
</svg>`);
const mono = fontFile('jetbrains-mono', 400);
const body = fontFile('inter', 400);
const heading = fontFile('plus-jakarta-sans', 600);
const layers = [
  await textLayer('PORTFOLIO', 17, mono, '#8ac9ec', 80, 80),
  await textLayer('Daniel Rachev', 72, heading, '#f4f5f8', 80, 182),
  await textLayer('Software Engineer', 30, body, '#b7becd', 84, 287),
  await textLayer('MSc Computer Science · TU Delft', 22, body, '#9aa3b5', 84, 353),
  await textLayer('Exploring distributed systems.', 22, body, '#9aa3b5', 84, 388),
  { input: await sharp(Buffer.from(orbit(164))).png().toBuffer(), left: 946, top: 234 },
  await textLayer('danielrachev.github.io/portfolio', 18, mono, '#8ac9ec', 80, 525),
];
await sharp(decoration).composite(layers).png().toFile(fileURLToPath(new URL('social-preview.png', output)));
console.log('Generated SVG/PNG favicons, Apple touch icon, and 1200×630 social preview.');
