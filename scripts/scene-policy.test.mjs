import test from 'node:test';
import assert from 'node:assert/strict';
import { initialQuality, lowerQuality, sampleQuality, shouldPreload, QUALITY } from '../src/scenePolicy.js';

test('constrained hardware gets a conservative starting quality', () => {
  assert.equal(initialQuality({ cores: 8, memory: 8 }), 'high');
  assert.equal(initialQuality({ cores: 4 }), 'balanced');
  assert.equal(initialQuality({ memory: 2 }), 'balanced');
  assert.equal(initialQuality({ coarsePointer: true }), 'balanced');
  assert.equal(initialQuality(), 'high');
});
test('measured slow frames lower quality without oscillation', () => {
  assert.equal(lowerQuality('high', 40), 'balanced');
  assert.equal(lowerQuality('balanced', 25), 'low');
  assert.equal(lowerQuality('balanced', 60), 'balanced');
  assert.equal(lowerQuality('low', 120), 'low');
  assert.equal(lowerQuality('high', 60), 'high');
  assert.equal(QUALITY.low.bloomHeight, 0);
  assert.ok(Object.values(QUALITY).every(quality => quality.dpr <= 1.5));
});
test('automatic scene loading respects data saver and slow connections', () => {
  assert.equal(shouldPreload(), true);
  assert.equal(shouldPreload({ effectiveType: '4g' }), true);
  assert.equal(shouldPreload({ saveData: true }), false);
  for (const effectiveType of ['slow-2g', '2g', '3g']) assert.equal(shouldPreload({ effectiveType }), false);
});
test('adaptation requires two consecutive slow windows, not a brief stutter', () => {
  const sample = { elapsed: 0, frames: 0, windows: 0 };
  const window = fps => {
    sample.elapsed = 0;
    sample.frames = 0;
    for (let frame = 0; frame < fps * 2 + 1; frame++) {
      const tier = sampleQuality(sample, 'high', 1 / fps);
      if (tier !== 'high') return tier;
    }
    return 'high';
  };
  assert.equal(window(30), 'high');
  assert.equal(window(60), 'high');
  assert.equal(sample.windows, 0);
  assert.equal(window(30), 'high');
  assert.equal(window(30), 'balanced');
});
