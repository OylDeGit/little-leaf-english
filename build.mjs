import {
  audioSources as sourceAudio,
  imageSources as sourceImages,
  fallbackSources as sourceFallback,
} from './media.js';
import { cp, mkdir, rm, readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex').slice(0, 12);
const modules = ['app.js', 'core.js', 'data.js', 'vocabulary.js', 'media.js'];
const source = Object.fromEntries(
  await Promise.all(modules.map(async (f) => [f, await readFile(f, 'utf8')])),
);
const css = await readFile('style.css', 'utf8'),
  html = await readFile('index.html', 'utf8');
const workerSource = await readFile('sw.js', 'utf8');
const attributionSource = (
  await Promise.all(
    ['ATTRIBUTION.md', 'photo-credits.html', 'photo-credits.json'].map((f) => readFile(f, 'utf8')),
  )
).join('');
await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets/images', { recursive: true });
await mkdir('dist/assets/audio', { recursive: true });
const media = [];
const paths = new Map();
for (const folder of ['images', 'photos', 'audio'])
  for (const filename of (await readdir(`assets/${folder}`)).sort()) {
    const input = `assets/${folder}/${filename}`,
      bytes = await readFile(input),
      ext = filename.slice(filename.lastIndexOf('.'));
    const target = `assets/${folder === 'audio' ? 'audio' : 'images'}/${hash(bytes)}${ext}`;
    paths.set(input, target);
    if (!media.includes(target)) {
      await writeFile(`dist/${target}`, bytes);
      media.push(target);
    }
  }
const version = hash(
  JSON.stringify(source) + css + html + workerSource + JSON.stringify([...paths]) + attributionSource,
);
for (const file of modules) {
  let text = source[file].replace(
    /from (['"])(\.\/[^'"]+\.js)\1/g,
    (_m, q, path) => `from ${q}${path}?v=${version}${q}`,
  );
  if (file === 'media.js') {
    const mapped = (object) =>
      Object.fromEntries(
        Object.entries(object).map(([id, path]) => {
          const target = paths.get(path);
          if (!target) throw Error(`Missing media for ${id}: ${path}`);
          return [id, target];
        }),
      );
    text =
      'export const audioSources=' +
      JSON.stringify(mapped(sourceAudio)) +
      ';\nexport const imageSources=' +
      JSON.stringify(mapped(sourceImages)) +
      ';\nexport const fallbackSources=' +
      JSON.stringify(mapped(sourceFallback)) +
      ';\n';
  }
  await writeFile(`dist/${file}`, text);
}
await writeFile(
  'dist/index.html',
  html
    .replace('href="style.css"', `href="style.css?v=${version}"`)
    .replace('src="app.js"', `src="app.js?v=${version}"`),
);
await writeFile('dist/style.css', css);
for (const file of [
  'icon.svg',
  'manifest.webmanifest',
  '.nojekyll',
  'ATTRIBUTION.md',
  'photo-credits.html',
  'photo-credits.json',
])
  await cp(file, `dist/${file}`);
const core = [
  './',
  'index.html',
  `style.css?v=${version}`,
  ...modules.map((f) => `${f}?v=${version}`),
  'icon.svg',
  'manifest.webmanifest',
  'photo-credits.html',
  'photo-credits.json',
  'ATTRIBUTION.md',
];
await writeFile('dist/offline-assets.json', JSON.stringify([...core, ...media]));
const worker = workerSource
  .replace("const RELEASE = 'development';", `const RELEASE = '${version}';`)
  .replace('const CORE_FILES = null;', `const CORE_FILES = ${JSON.stringify(core)};`);
await writeFile('dist/sw.js', worker);
await writeFile(
  'dist/release.json',
  JSON.stringify({ version, words: 300, themes: 25, photos: Object.keys(sourceFallback).length }),
);
console.log(`Built release ${version}: 300 words, 25 themes, ${media.length} deduplicated media files.`);
