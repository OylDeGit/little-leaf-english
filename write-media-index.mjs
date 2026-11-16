// Authoring helper. Runtime indexes contain local paths and small image fingerprints only.
import { vocabulary } from './vocabulary.js';
import { alphabet } from './scenes.js';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export async function writeMediaIndex() {
  const words = vocabulary.flatMap(c => c.words);
  const imageKeys = Object.fromEntries(await Promise.all(words.map(async w => [
    w.id,
    createHash('sha256').update(await readFile(new URL('assets/images/' + w.id + '.svg', import.meta.url))).digest('hex').slice(0, 12),
  ])));
  const audioSources = Object.fromEntries([
    ...words.map(w => [w.id, 'assets/audio/' + w.id + '.m4a']),
    ...alphabet.map(l => [l.audioId, 'assets/audio/' + l.audioId + '.m4a']),
    ['fireworks', 'assets/audio/fireworks.m4a'],
  ]);
  const imageSources = Object.fromEntries(words.map(w => [w.id, 'assets/images/' + w.id + '.svg']));
  await writeFile(new URL('media.js', import.meta.url),
    '// Generated local resource paths and image fingerprints. No runtime CDN dependency.\n' +
    'export const audioSources=' + JSON.stringify(audioSources, null, 2) + ';\n' +
    'export const imageSources=' + JSON.stringify(imageSources, null, 2) + ';\n' +
    'export const imageKeys=' + JSON.stringify(imageKeys, null, 2) + ';\n');
}
