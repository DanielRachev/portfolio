import { readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const directory = new URL('../dist/assets/', import.meta.url);
const rows = [];
for (const file of await readdir(directory)) {
  if (!file.endsWith('.js')) continue;
  const bytes = await readFile(new URL(file, directory));
  rows.push({ file, bytes: bytes.length, gzipBytes: gzipSync(bytes).length });
}
console.table(rows);
console.log('Gzip sizes are local estimates, not measurements of hosting transfer encoding.');
