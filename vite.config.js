import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const planetKeyPath = fileURLToPath(new URL('./.planet-key', import.meta.url));

function readPlanetKey() {
  let key;

  try {
    key = readFileSync(planetKeyPath, 'utf8').trim();
  } catch {
    throw new Error(
      'Missing .planet-key. Restore it or run `npm run assets:setup` with the private GLBs available.',
    );
  }

  if (!/^[a-f0-9]{64}$/i.test(key)) {
    throw new Error('.planet-key must contain exactly 32 bytes encoded as hexadecimal.');
  }

  return key.toLowerCase();
}

function encodePlanetKey(keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  const mask = randomBytes(key.length);
  const order = Array.from({ length: key.length }, (_, index) => index);

  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = randomBytes(2).readUInt16LE(0) % (index + 1);
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }

  return {
    encoded: order.map((sourceIndex) => key[sourceIndex] ^ mask[sourceIndex]),
    mask: order.map((sourceIndex) => mask[sourceIndex]),
    order,
  };
}

export default defineConfig({
  base: '/portfolio/',
  plugins: [react(), glsl()],
  define: {
    __PLANET_KEY_PARTS__: JSON.stringify(encodePlanetKey(readPlanetKey())),
  },
  build: {
    minify: 'esbuild',
    sourcemap: false,
  },
})
