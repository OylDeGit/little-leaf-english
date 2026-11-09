import { readFile, access, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { vocabulary } from './vocabulary.js';
const root = new URL('./dist/', import.meta.url),
  release = JSON.parse(await readFile(new URL('release.json', root), 'utf8'));
const files = JSON.parse(await readFile(new URL('offline-assets.json', root), 'utf8'));
assert.match(release.version, /^[a-f0-9]{12}$/);
assert.equal(release.words, 300);
assert.equal(release.themes, 25);
for (const file of files) await access(new URL(file.split('?')[0] || 'index.html', root));
const media = await import(new URL(`media.js?test=${release.version}`, root));
for (const word of vocabulary.flatMap((c) => c.words))
  for (const file of [media.imageSources[word.id], media.audioSources[word.id]]) {
    assert.ok(files.includes(file), word.id);
    assert.match(file, /assets\/(images|audio)\/[a-f0-9]{12}\.(svg|m4a|jpg|jpeg|png|webp)$/);
  }
for (const file of ['app.js', 'core.js', 'data.js', 'vocabulary.js', 'media.js']) {
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
assert.ok(dataSize < 90000);

for (const file of Object.values(media.fallbackSources)) {
  assert.ok(files.includes(file));
  await access(new URL(file, root));
}
const credits = JSON.parse(await readFile(new URL('photo-credits.json', root), 'utf8'));
assert.equal(Object.keys(credits).length, release.photos);
for (const [id, item] of Object.entries(credits)) {
  assert.ok(media.fallbackSources[id]);
  assert.ok(item.source && item.author && item.license && item.licenseUrl);
}

for (const file of ['photo-credits.html', 'photo-credits.json', 'ATTRIBUTION.md'])
  assert.ok(files.includes(file), `Offline attribution missing: ${file}`);
console.log(
  `Verified build ${release.version}: ${release.photos} credited photos, complete media, versioned modules and offline attribution.`,
);
