import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { sampleQuality } from './scenePolicy';

export default function ScenePerformance({ active, tier, onQualityChange, onError }) {
  const { gl } = useThree();
  const sample = useRef({ elapsed: 0, frames: 0, windows: 0 });
  useEffect(() => {
    const lost = event => { event.preventDefault(); onError(); };
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onError]);
  useEffect(() => {
    sample.current = { elapsed: 0, frames: 0, windows: 0 };
  }, [active, tier]);
  useFrame((_, delta) => {
    if (!active || document.hidden || delta > 1) {
      sample.current = { elapsed: 0, frames: 0, windows: 0 };
      return;
    }
    const next = sampleQuality(sample.current, tier, delta);
    if (next !== tier) onQualityChange(next);
  });
  return null;
}
