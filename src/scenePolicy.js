export const QUALITY = {
  high: { stars: 5000, dpr: 1.5, bloomHeight: 300, multisampling: 4 },
  balanced: { stars: 2500, dpr: 1.25, bloomHeight: 180, multisampling: 0 },
  low: { stars: 1200, dpr: 1, bloomHeight: 0, multisampling: 0 },
};

export function initialQuality({ cores, memory, coarsePointer } = {}) {
  return (cores && cores <= 4) || (memory && memory <= 4) || coarsePointer ? 'balanced' : 'high';
}

// Only step down during a visit: avoid oscillation and visible star-count flicker.
export function lowerQuality(tier, fps) {
  if (tier === 'high' && fps < 45) return 'balanced';
  if (tier === 'balanced' && fps < 30) return 'low';
  return tier;
}

export function sampleQuality(sample, tier, delta) {
  sample.elapsed += delta;
  sample.frames++;
  if (sample.elapsed < 2) return tier;
  const next = lowerQuality(tier, sample.frames / sample.elapsed);
  sample.windows = next !== tier ? sample.windows + 1 : 0;
  sample.elapsed = 0;
  sample.frames = 0;
  return sample.windows >= 2 ? next : tier;
}

export function shouldPreload(connection) {
  return !connection?.saveData && !['slow-2g', '2g', '3g'].includes(connection?.effectiveType);
}
