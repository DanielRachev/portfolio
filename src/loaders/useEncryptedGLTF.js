import { useLoader } from '@react-three/fiber';
import {
  FileLoader,
  Loader,
  LoaderUtils,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* global __PLANET_KEY_PARTS__ */

const formatMagic = 'PLNT';
const formatVersion = 1;
const algorithmAes256Gcm = 1;
const headerLength = 24;
const authenticationTagLength = 16;

function reconstructKey({ encoded, mask, order }) {
  if (encoded.length !== 32 || mask.length !== 32 || order.length !== 32) {
    throw new Error('Invalid planet asset key material.');
  }
  const key = new Uint8Array(32);

  for (let index = 0; index < order.length; index += 1) {
    key[order[index]] = encoded[index] ^ mask[index];
  }

  return key;
}

const importedKey = globalThis.crypto.subtle.importKey(
  'raw',
  reconstructKey(__PLANET_KEY_PARTS__),
  'AES-GCM',
  false,
  ['decrypt'],
);

function assertContainerHeader(bytes) {
  if (bytes.byteLength < headerLength + authenticationTagLength) {
    throw new Error('Planet container is truncated.');
  }

  const magic = String.fromCharCode(...bytes.subarray(0, 4));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (magic !== formatMagic) {
    throw new Error('Planet container has an invalid signature.');
  }

  if (view.getUint8(4) !== formatVersion) {
    throw new Error('Planet container version is not supported.');
  }

  if (view.getUint8(5) !== algorithmAes256Gcm) {
    throw new Error('Planet container encryption algorithm is not supported.');
  }

  if (view.getUint16(6, true) !== headerLength) {
    throw new Error('Planet container header is invalid.');
  }

  return view.getUint32(8, true);
}

async function decryptContainer(container) {
  const bytes = new Uint8Array(container);
  const expectedPlaintextLength = assertContainerHeader(bytes);
  const initializationVector = bytes.slice(12, 24);
  const authenticatedHeader = bytes.slice(0, headerLength);
  const ciphertextAndTag = bytes.slice(headerLength);
  const key = await importedKey;
  const plaintext = await globalThis.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: initializationVector,
      additionalData: authenticatedHeader,
      tagLength: authenticationTagLength * 8,
    },
    key,
    ciphertextAndTag,
  );

  if (plaintext.byteLength !== expectedPlaintextLength) {
    throw new Error('Planet container payload length is invalid.');
  }

  return plaintext;
}

class EncryptedGLTFLoader extends Loader {
  load(url, onLoad, onProgress, onError) {
    const fileLoader = new FileLoader(this.manager);
    fileLoader.setPath(this.path);
    fileLoader.setResponseType('arraybuffer');
    fileLoader.setRequestHeader(this.requestHeader);
    fileLoader.setWithCredentials(this.withCredentials);

    fileLoader.load(
      url,
      async (container) => {
        try {
          const plaintext = await decryptContainer(container);
          const gltfLoader = new GLTFLoader(this.manager);
          const resourcePath = LoaderUtils.extractUrlBase(`${this.path || ''}${url}`);

          gltfLoader.parse(plaintext, resourcePath, onLoad, onError);
        } catch (error) {
          onError?.(error);
        }
      },
      onProgress,
      onError,
    );
  }
}

export function useEncryptedGLTF(path) {
  return useLoader(EncryptedGLTFLoader, path);
}

useEncryptedGLTF.preload = (path) => useLoader.preload(EncryptedGLTFLoader, path);
