import { readFile, access, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { vocabulary } from './vocabulary.js';
const root = new URL('./dist/', import.meta.url),
  release = JSON.parse(await readFile(new URL('release.json', root), 'utf8'));
const files = JSON.parse(await readFile(new URL('offline-assets.json', root), 'utf8'));
assert.match(release.version, /^[a-f0-9]{12}$/);
assert.equal(release.words, vocabulary.flatMap((c) => c.words).length);
assert.equal(release.themes, vocabulary.length);
for (const file of files) await access(new URL(file.split('?')[0] || 'index.html', root));
const media = await import(new URL(`media.js?test=${release.version}`, root));
for (const word of vocabulary.flatMap((c) => c.words))
  for (const file of [media.imageSources[word.id], media.audioSources[word.id]]) {
    assert.ok(files.includes(file), word.id);
    assert.match(file, /assets\/(images|audio)\/[a-f0-9]{12}\.(svg|m4a)$/);
  }
for (const file of ['app.js', 'core.js', 'data.js', 'vocabulary.js', 'media.js', 'dialogues.js', 'scene-content.js', 'scenes.js', 'navigation.js']) {
  const text = await readFile(new URL(file, root), 'utf8');
  for (const m of text.matchAll(/from ['"](.+?)['"]/g)) {
    assert.ok(m[1].endsWith(`?v=${release.version}`), m[1]);
    await access(new URL(m[1].split('?')[0], root));
  }
  assert.ok(!text.includes('data:audio/'), 'Do not eagerly embed audio');
}
const html = await readFile(new URL('index.html', root), 'utf8');
assert.ok(html.includes(`app.js?v=${release.version}`));
assert.ok(html.includes(`style.css?v=${release.version}`));
const sw = await readFile(new URL('sw.js', root), 'utf8');
assert.ok(sw.includes(`const RELEASE = '${release.version}'`));
assert.ok(!sw.includes('const CORE_FILES = null;'));
const dataSize = (await stat(new URL('media.js', root))).size;
assert.ok(dataSize < 100000);
console.log(
  `Verified build ${release.version}: complete media, versioned module graph, offline manifest and worker.`,
);

const { dialogues } = await import(new URL(`dialogues.js?test=${release.version}`, root));
assert.equal(dialogues.length, 8);
assert.equal(release.dialogues, dialogues.length);
for (const line of dialogues.flatMap((d) => d.lines)) {
  assert.match(line.audio, /^assets\/audio\/[a-f0-9]{12}\.m4a$/);
  assert.ok(files.includes(line.audio));
}

const { alphabet, scenes } = await import(new URL(`scenes.js?test=${release.version}`, root));
assert.ok(files.includes(media.audioSources.fireworks), 'Celebration sound must work offline');
assert.equal(scenes.length, 13);
for (const letter of alphabet) {
  assert.ok(files.includes(media.audioSources[letter.audioId]), letter.upper);
}

const notice = await readFile(new URL('licenses/fluent-emoji-LICENSE.txt', root), 'utf8');
assert.ok(notice.includes('MIT License') && notice.includes('Microsoft Corporation'));
assert.ok(files.includes('ATTRIBUTION.md'));
assert.ok(files.includes('licenses/fluent-emoji-LICENSE.txt'));
for (const word of vocabulary.flatMap(c => c.words)) {
  assert.equal(media.imageKeys[word.id], media.imageSources[word.id].split('/').pop().slice(0,12));
}
assert.ok(!files.includes('illustration-sources.json'), 'Full provenance is authoring metadata, not a runtime dependency');
