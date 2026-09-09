import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3, Quaternion } from 'three';
import { projects } from '../src/content.js';
import { initialOrbitAngle, orbitPosition, overviewPosition, smoothProgress, labelOpacity, RETURN_DURATION } from '../src/sceneMotion.js';

test('orbit positions and future-project fallback angles are deterministic', () => {
  assert.equal(initialOrbitAngle(1, -1), -1);
  assert.equal(initialOrbitAngle('future'), initialOrbitAngle('future'));
  assert.notEqual(initialOrbitAngle('future'), initialOrbitAngle('another'));
  assert.deepEqual(orbitPosition(10, -1), orbitPosition(10, -1));
  assert.ok(Math.abs(Math.hypot(...orbitPosition(10, -1)) - 10) < 1e-10);
});

test('composed opening positions fit desktop and narrow portrait views', () => {
  for (const aspect of [1440 / 1000, 390 / 844, 320 / 844]) {
    const camera = new PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(...overviewPosition(aspect));
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    for (const project of projects) {
      const center = new Vector3(...orbitPosition(project.orbitalRadius, project.initialAngle));
      for (const [x, y] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const point = center.clone().add(new Vector3(x, y, 0).applyQuaternion(camera.quaternion).multiplyScalar(project.visualRadius)).project(camera);
        assert.ok(Math.abs(point.x) < 0.98 && Math.abs(point.y) < 0.9, `${project.projectInfo} fits at aspect ${aspect}`);
      }
    }
  }
});

test('camera return starts gently and completes at the same time across frame rates', () => {
  assert.equal(smoothProgress(0), 0);
  assert.equal(smoothProgress(1), 1);
  assert.equal(smoothProgress(2), 1);
  assert.ok(smoothProgress(0.05) < 0.01);
  const start = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
  const target = new Quaternion();
  for (const fps of [30, 60, 120]) {
    let elapsed = 0;
    for (let frame = 0; frame < Math.ceil(RETURN_DURATION * fps); frame++) elapsed += 1 / fps;
    const t = smoothProgress(elapsed / RETURN_DURATION);
    assert.ok(Math.abs(t - 1) < 1e-10);
    assert.ok(new Quaternion().slerpQuaternions(start, target, t).angleTo(target) < 1e-7);
  }
});

test('small labels fade out smoothly while hovered planets retain their popup', () => {
  assert.equal(labelOpacity(5, false), 0);
  assert.equal(labelOpacity(12, false), 0);
  assert.equal(labelOpacity(17, false), 0.5);
  assert.equal(labelOpacity(22, false), 1);
  assert.equal(labelOpacity(80, false), 1);
  assert.equal(labelOpacity(5, true), 1);
});
