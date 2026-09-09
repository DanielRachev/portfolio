import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { planetIO, optimizePlanet } from './optimize-planets.mjs';
import { planetAssets } from './planet-assets.mjs';

planetIO.registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'draco3d.decoder': await draco3d.createDecoderModule(),
});

const rows = [];
const canonicalTriangles = array => {
  const result = [];
  for (let i = 0; i < array.length; i += 3) {
    const [a, b, c] = array.slice(i, i + 3);
    result.push([`${a},${b},${c}`, `${b},${c},${a}`, `${c},${a},${b}`].sort()[0]);
  }
  return result;
};
for (const { source: name } of planetAssets) {
  const original = new Uint8Array(await readFile(new URL(`../private-assets/planets/${name}`, import.meta.url)));
  const meshopt = await optimizePlanet(original);
  const source = await planetIO.readBinary(original);
  const decoded = await planetIO.readBinary(meshopt);
  // Triangle encoding can cyclically rotate indices, preserving triangle winding.
  const indices = new Set(source.getRoot().listMeshes().flatMap(mesh => mesh.listPrimitives().map(p => p.getIndices())));
  assert.equal(source.getRoot().listAccessors().length, decoded.getRoot().listAccessors().length);
  source.getRoot().listAccessors().forEach((accessor, i) => {
    const actual = decoded.getRoot().listAccessors()[i].getArray();
    assert.deepEqual(indices.has(accessor) ? canonicalTriangles(actual) : actual,
      indices.has(accessor) ? canonicalTriangles(accessor.getArray()) : accessor.getArray());
  });
  source.getRoot().listTextures().forEach((texture, i) => {
    assert.deepEqual(decoded.getRoot().listTextures()[i].getImage(), texture.getImage());
  });
  await source.transform(draco({ quantizePosition: 16, quantizeNormal: 14, quantizeTexcoord: 14 }));
  const dracoBytes = await planetIO.writeBinary(source);
  for (const [codec, bytes] of [['original', original], ['meshopt-lossless', meshopt], ['draco-quantized', dracoBytes]]) {
    await planetIO.readBinary(bytes); // Warm decoder; not a network or mobile GPU benchmark.
    const times = [];
    for (let run = 0; run < 9; run++) {
      const start = performance.now();
      await planetIO.readBinary(bytes);
      times.push(performance.now() - start);
    }
    rows.push({ model: name, codec, bytes: bytes.length, medianParseMs: +times.sort((a, b) => a - b)[4].toFixed(2) });
  }
}
console.table(rows);
console.log('PASS: Meshopt preserves vertex data, triangle winding, and embedded textures.');
