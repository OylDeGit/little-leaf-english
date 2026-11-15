import { writeMediaIndex } from './write-media-index.mjs';
import { fetchReviewedIllustration } from './prepare-illustrations.mjs';
import { sceneIllustration } from './scene-illustrations.js';
import { alphabet } from './scenes.js';
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
  plum: '<ellipse cx="50" cy="57" rx="31" ry="35" fill="#71508d"/><path d="M50 28Q44 8 58 6" fill="none" stroke="#73533d" stroke-width="5"/><ellipse cx="66" cy="18" rx="17" ry="7" fill="#709950"/>',
  pomegranate:
    '<circle cx="50" cy="58" r="34" fill="#b83e4f"/><path d="m39 26-4-18 12 6 9-8 5 17" fill="#b83e4f"/><ellipse cx="53" cy="60" rx="24" ry="27" fill="#f5d3af"/><ellipse cx="42" cy="43" rx="4" ry="5" fill="#b83e4f"/><ellipse cx="56" cy="43" rx="4" ry="5" fill="#b83e4f"/><ellipse cx="68" cy="53" rx="4" ry="5" fill="#b83e4f"/><ellipse cx="38" cy="59" rx="4" ry="5" fill="#b83e4f"/><ellipse cx="52" cy="59" rx="4" ry="5" fill="#b83e4f"/><ellipse cx="45" cy="75" rx="4" ry="5" fill="#b83e4f"/><ellipse cx="61" cy="74" rx="4" ry="5" fill="#b83e4f"/>',
  papaya:
    '<ellipse cx="50" cy="52" rx="30" ry="44" fill="#69a254"/><ellipse cx="50" cy="52" rx="25" ry="38" fill="#f39c50"/><ellipse cx="50" cy="53" rx="10" ry="27" fill="#eac18c"/><circle cx="47" cy="34" r="3" fill="#41372e"/><circle cx="54" cy="40" r="3" fill="#41372e"/><circle cx="46" cy="48" r="3" fill="#41372e"/><circle cx="54" cy="55" r="3" fill="#41372e"/><circle cx="47" cy="62" r="3" fill="#41372e"/><circle cx="53" cy="71" r="3" fill="#41372e"/>',
  lime: '<circle cx="50" cy="55" r="34" fill="#7ca544"/><circle cx="50" cy="55" r="28" fill="#d6e9a0"/><path d="M50 55 50 27" stroke="#faf5d5" stroke-width="3"/><path d="M50 55 78 55" stroke="#faf5d5" stroke-width="3"/><path d="M50 55 50 83" stroke="#faf5d5" stroke-width="3"/><path d="M50 55 22 55" stroke="#faf5d5" stroke-width="3"/><path d="M50 55 30 35" stroke="#faf5d5" stroke-width="3"/><path d="M50 55 70 75" stroke="#faf5d5" stroke-width="3"/><path d="M50 55 30 75" stroke="#faf5d5" stroke-width="3"/><path d="M50 55 70 35" stroke="#faf5d5" stroke-width="3"/>',
  apricot:
    '<circle cx="50" cy="56" r="32" fill="#e8a250"/><path d="M53 27q-8 28 0 59M50 25 54 12" stroke="#a36a36" stroke-width="3" fill="none"/><ellipse cx="67" cy="17" rx="16" ry="6" fill="#88a766"/>',
  radish:
    '<path d="M47 34Q26 6 20 17M49 32Q50 1 62 12M51 33Q78 8 80 24" stroke="#6b9b50" stroke-width="8" fill="none"/><path d="M20 53C20 24 79 23 80 54Q75 81 52 94Q29 80 20 53" fill="#d55d70"/><path d="m42 86 10 8 7-9" fill="#f5e7cf"/>',
  peas: '<path d="M10 78Q17 17 90 22Q82 82 10 78" fill="#79a955"/><path d="M17 72 82 28" stroke="#c1db8c" stroke-width="6"/><circle cx="29" cy="65" r="12" fill="#acd274"/><circle cx="49" cy="51" r="12" fill="#acd274"/><circle cx="70" cy="36" r="12" fill="#acd274"/>',
  eraser:
    '<path d="m12 62 31-40 45 20-31 40Z" fill="#d897a7"/><path d="m12 62 20 9 31-40-20-9Z" fill="#9fb7cf"/><path d="m12 62 45 20 17-21-45-20Z" fill="#e5b3bb"/>',
  glue: '<rect x="32" y="32" width="37" height="60" rx="10" fill="#eee9d6"/><path d="M38 34V23h26v11M43 23V8h16v15" fill="#dd925d"/><rect x="36" y="51" width="29" height="24" rx="4" fill="#91b9bc"/>',
  stapler:
    '<path d="M16 69h71v15H16Z" fill="#526c83"/><path d="m18 30 68 18-6 18-64-21Z" fill="#8cb1c7"/><path d="m18 45 64 21" stroke="#526c83" stroke-width="5"/><path d="M24 50v18" stroke="#a9a9a1" stroke-width="5"/>',
  head: '<path d="M30 87v-9Q10 64 20 37Q27 12 55 16Q78 18 77 44l11 15-13 4v14H57v10" fill="#d8ad87"/><path d="M19 43Q13 10 48 8Q80 8 78 36Q55 20 19 43" fill="#795b45"/><circle cx="68" cy="43" r="3" fill="#554135"/>',
  neck: '<path d="M37 10h27v40q5 12 28 19v21H8V69q25-7 29-19Z" fill="#ddb494"/><path d="M33 30h35v23H33Z" fill="#c7886d"/>',
  knee: '<path d="M24 5h29l-5 42 38 19-13 25-49-31Q16 54 19 42Z" fill="#dab08c"/><circle cx="35" cy="50" r="12" fill="#bb8567"/>',
  shoulder:
    '<path d="M38 10h24v20Q92 33 92 59v31H8V59Q8 33 38 30Z" fill="#dcb38f"/><path d="M16 59v31h68V59L64 35 50 49 36 35Z" fill="#9ab7c9"/><circle cx="24" cy="43" r="10" fill="#d18f72"/>',

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
      const reviewed = await fetchReviewedIllustration(w.id);
      if (reviewed) svg = reviewed.toString('utf8');
      else if (w.emoji.startsWith('custom:'))
        svg = sceneIllustration(w.id) || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${w.number !== undefined ? `<rect x="8" y="8" width="84" height="84" rx="18" fill="#6289bc"/><text x="50" y="67" fill="white" font-family="sans-serif" font-weight="bold" text-anchor="middle" font-size="${w.number === 1000 ? 36 : 46}">${w.number}</text>` : custom[w.id]}</svg>`;
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
for (const letter of alphabet) {
  const target = new URL(`assets/audio/${letter.audioId}.m4a`, root);
  if (await exists(target)) continue;
  const temp = `${tmpdir()}/little-leaf-${letter.audioId}.aiff`;
  await exec('say', ['-v', 'Samantha', '-r', '145', '-o', temp, `${letter.upper}.`]);
  await exec('afconvert', ['-f', 'm4af', '-d', 'aac ', temp, target.pathname]);
}
await writeMediaIndex();

console.log(`All ${words.length} words and ${alphabet.length} letter names are ready.`);
