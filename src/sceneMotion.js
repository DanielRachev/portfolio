export const RETURN_DURATION = 1.8;

export function orbitPosition(radius, angle) {
  return [Math.sin(angle) * radius, 0, Math.cos(angle) * radius];
}

export function initialOrbitAngle(id, angle) {
  if (Number.isFinite(angle)) return angle;
  // Stable fallback for future projects without a hand-composed angle.
  let hash = 0;
  for (const character of String(id)) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return (hash % 360) * Math.PI / 180;
}

export function overviewPosition(aspect) {
  const scale = Math.max(1, 1.3 / Math.max(aspect, 0.2));
  return [0, 20 * scale, 25 * scale];
}

export function smoothProgress(progress) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
}

export function labelOpacity(projectedRadius, hovered) {
  if (hovered) return 1;
  return smoothProgress((projectedRadius - 12) / 10);
}
