import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';
import {
  access,
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { optimizePlanet } from './optimize-planets.mjs';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const privateAssetDirectory = path.join(repositoryRoot, 'private-assets', 'planets');
const outputDirectory = path.join(repositoryRoot, 'public', 'assets', 'planets');
const keyPath = path.join(repositoryRoot, '.planet-key');

const assets = [
  { source: 'Planet_30.glb', output: 'p-c7b5e103.planet' },
  { source: 'Planet_24.glb', output: 'p-a91f2d4c.planet' },
  { source: 'Planet_45.glb', output: 'p-e48279ad.planet' },
];

const magic = Buffer.from('PLNT', 'ascii');
const formatVersion = 1;
const algorithmAes256Gcm = 1;
const headerLength = 24;
const authenticationTagLength = 16;

async function pathExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function loadOrCreateKey() {
  if (!(await pathExists(keyPath))) {
    if (!process.argv.includes('--generate-key')) {
      throw new Error(
        'Missing .planet-key. Run `npm run assets:setup` once to generate it.',
      );
    }

    await writeFile(keyPath, randomBytes(32).toString('hex'), {
      encoding: 'utf8',
      flag: 'wx',
    });
    process.stdout.write('Created local .planet-key. Keep it private.\n');
  }

  const keyHex = (await readFile(keyPath, 'utf8')).trim();

  if (!/^[a-f0-9]{64}$/i.test(keyHex)) {
    throw new Error('.planet-key must contain exactly 32 bytes encoded as hexadecimal.');
  }

  return Buffer.from(keyHex, 'hex');
}

function encryptContainer(plaintext, key) {
  const initializationVector = randomBytes(12);
  const header = Buffer.alloc(headerLength);

  magic.copy(header, 0);
  header.writeUInt8(formatVersion, 4);
  header.writeUInt8(algorithmAes256Gcm, 5);
  header.writeUInt16LE(headerLength, 6);
  header.writeUInt32LE(plaintext.length, 8);
  initializationVector.copy(header, 12);

  const cipher = createCipheriv('aes-256-gcm', key, initializationVector);
  cipher.setAAD(header);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authenticationTag = cipher.getAuthTag();

  if (authenticationTag.length !== authenticationTagLength) {
    throw new Error('Unexpected AES-GCM authentication tag length.');
  }

  return Buffer.concat([header, ciphertext, authenticationTag]);
}

function verifyContainer(container, expectedPlaintext, key) {
  const header = container.subarray(0, headerLength);
  const initializationVector = header.subarray(12, 24);
  const authenticationTag = container.subarray(-authenticationTagLength);
  const ciphertext = container.subarray(headerLength, -authenticationTagLength);
  const decipher = createDecipheriv('aes-256-gcm', key, initializationVector);

  decipher.setAAD(header);
  decipher.setAuthTag(authenticationTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  if (!plaintext.equals(expectedPlaintext)) {
    throw new Error('Encrypted container failed its lossless verification.');
  }
}

async function packageAssets() {
  const key = await loadOrCreateKey();
  await mkdir(outputDirectory, { recursive: true });

  for (const asset of assets) {
    const sourcePath = path.join(privateAssetDirectory, asset.source);
    const outputPath = path.join(outputDirectory, asset.output);
    const original = await readFile(sourcePath);
    const plaintext = Buffer.from(await optimizePlanet(original));
    const container = encryptContainer(plaintext, key);

    verifyContainer(container, plaintext, key);
    await writeFile(outputPath, container);
    process.stdout.write(
      `Packaged ${asset.source} as ${asset.output} (${container.length} bytes).\n`,
    );
  }
}

packageAssets().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
