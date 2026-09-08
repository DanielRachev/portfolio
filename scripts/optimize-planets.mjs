import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
export const planetIO = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder,
  'meshopt.decoder': MeshoptDecoder,
});

// Encode existing buffers without quantization, simplification, or texture changes.
export async function optimizePlanet(bytes) {
  const document = await planetIO.readBinary(bytes);
  document.createExtension(EXTMeshoptCompression).setRequired(true)
    .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
  return planetIO.writeBinary(document);
}
