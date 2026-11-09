// Content authoring helper: requires macOS say/afconvert. Existing assets are reused.
import { vocabulary } from './vocabulary.js';
import { writeFile, mkdir, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
const exec = promisify(execFile),
  root = new URL('./', import.meta.url),
  words = vocabulary.flatMap((c) => c.words);
const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};
await mkdir(new URL('assets/images/', root), { recursive: true });
await mkdir(new URL('assets/audio/', root), { recursive: true });
const custom = {
  pink: '<circle cx="50" cy="50" r="42" fill="#ed9cbd"/>',
  gray: '<circle cx="50" cy="50" r="42" fill="#8b959e"/>',
  gold: '<circle cx="50" cy="50" r="42" fill="#d3a52e"/>',
  pentagon: '<path d="M50 5 95 38 77 90H23L5 38Z" fill="#ad89c8"/>',
  hexagon: '<path d="m27 10 46 0 24 40-24 40H27L3 50Z" fill="#6aaf9c"/>',
  cube: '<path d="m50 5 42 23v44L50 96 8 72V28Z" fill="#79b1dc"/><path d="m8 28 42 24 42-24M50 52v44" fill="none" stroke="#406e9b" stroke-width="4"/>',
  crescent: '<path d="M72 8a43 43 0 1 0 0 84A46 46 0 0 1 72 8" fill="#e5b84d"/>',
  eleven:
    '<rect x="8" y="8" width="84" height="84" rx="18" fill="#6289bc"/><text x="50" y="68" fill="white" font-family="sans-serif" font-weight="bold" text-anchor="middle" font-size="50">11</text>',
  twelve:
    '<rect x="8" y="8" width="84" height="84" rx="18" fill="#6289bc"/><text x="50" y="68" fill="white" font-family="sans-serif" font-weight="bold" text-anchor="middle" font-size="50">12</text>',
};
let cursor = 0,
  done = 0;
async function worker() {
  while (cursor < words.length) {
    const w = words[cursor++],
      im = new URL(`assets/images/${w.id}.svg`, root),
      au = new URL(`assets/audio/${w.id}.m4a`, root);
    if (!(await exists(im))) {
      let svg;
      if (w.emoji.startsWith('custom:'))
        svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${custom[w.id]}</svg>`;
      else {
        const code = Array.from(w.emoji)
          .filter((c) => w.emoji.includes('\u200d') || c.codePointAt(0) !== 0xfe0f)
          .map((c) => c.codePointAt(0).toString(16))
          .join('-');
        svg = (
          await exec('curl', [
            '-fsSL',
            '--retry',
            '2',
            '--max-time',
            '30',
            `https://raw.githubusercontent.com/jdecked/twemoji/v15.1.0/assets/svg/${code}.svg`,
          ])
        ).stdout;
      }
      if (!svg.includes('<svg') || svg.includes('undefined')) throw Error(`Invalid image: ${w.id}`);
      await writeFile(im, svg);
    }
    if (!(await exists(au))) {
      const temp = `${tmpdir()}/little-leaf-${w.id}.aiff`;
      await exec('say', ['-v', 'Samantha', '-r', '145', '-o', temp, w.word]);
      await exec('afconvert', ['-f', 'm4af', '-d', 'aac ', temp, au.pathname]);
    }
    done++;
    if (done % 50 === 0) console.log(`${done}/${words.length} words ready`);
  }
}
await Promise.all(Array.from({ length: 5 }, worker));
await writeFile(
  new URL('media.js', root),
  '// Generated local resource paths. No runtime CDN dependency.\nexport const audioSources=' +
    JSON.stringify(Object.fromEntries(words.map((w) => [w.id, `assets/audio/${w.id}.m4a`])), null, 2) +
    ';\nexport const imageSources=' +
    JSON.stringify(Object.fromEntries(words.map((w) => [w.id, `assets/images/${w.id}.svg`])), null, 2) +
    ';\n',
);
console.log(`All ${words.length} illustrations and pronunciations are ready.`);
