import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { projects, featuredProjects } from '../src/content.js';
import { planetAssets } from './planet-assets.mjs';

test('the selected collection has four featured and eight other projects', () => {
  assert.deepEqual(new Set(featuredProjects.map(p => p.projectInfo)), new Set([
    'Resource & Cost Tracker', 'ResumAI', 'Distributed Checkout', 'Aperture',
  ]));
  assert.equal(featuredProjects.length, 4);
  assert.deepEqual(new Set(projects.filter(p => !p.featured).map(p => p.projectInfo)), new Set([
    'Modelling Chord', 'TALIO', 'Ulam Spiral', 'Chore Scheduler', 'UnMed', 'Boskalis SDK', 'DODA', 'LLM Eco Tracker',
  ]));
  assert.equal(projects.length, 12);
  assert.equal(new Set(projects.map(p => p.id)).size, 12);
  assert.deepEqual(projects.map(p => p.sequence).sort(), Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')));
  const chord = projects.find(p => p.id === 2);
  assert.equal(chord.projectInfo, 'Modelling Chord');
  assert.equal(chord.featured, false);
});

test('every project has panel content, a short preview, and a distinct packaged model', async () => {
  assert.equal(new Set(projects.map(p => p.modelPath)).size, 12);
  assert.deepEqual(new Set(projects.map(p => p.modelPath.split('/').at(-1))), new Set(planetAssets.map(p => p.output)));
  for (const project of projects) {
    for (const field of ['summary', 'description', 'role', 'category', 'kind']) assert.ok(project[field], `${project.projectInfo}: ${field}`);
    assert.ok(project.technologies.length > 0);
    assert.ok(project.previewDescription.split(/\s+/).length <= 6);
    assert.ok(Number.isFinite(project.initialAngle));
    assert.ok(project.orbitalRadius > project.visualRadius);
    const bytes = await readFile(new URL(`../public${project.modelPath}`, import.meta.url));
    assert.equal(bytes.subarray(0, 4).toString(), 'PLNT');
    assert.equal(bytes.readUInt32LE(8) + 40, bytes.length);
  }
});

test('planets sharing an orbit remain separated while moving', () => {
  for (let i = 0; i < projects.length; i++) {
    for (const other of projects.slice(i + 1)) {
      const planet = projects[i];
      if (planet.orbitalRadius !== other.orbitalRadius) continue;
      assert.equal(planet.orbitalSpeed, other.orbitalSpeed);
      const distance = 2 * planet.orbitalRadius * Math.abs(Math.sin((planet.initialAngle - other.initialAngle) / 2));
      assert.ok(distance > (planet.visualRadius + other.visualRadius) * 1.1);
    }
  }
});
