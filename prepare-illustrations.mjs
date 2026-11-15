// Fetch only the reviewed Flat SVGs, from a pinned upstream revision, with integrity checks.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { writeMediaIndex } from './write-media-index.mjs';
const exec = promisify(execFile);
const manifest = JSON.parse(await readFile(new URL('illustration-sources.json', import.meta.url), 'utf8'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export async function fetchReviewedIllustration(id) {
  const item = manifest.images[id];
  if (!item) return null;
  const url = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/' + manifest.revision + '/' +
    item.path.split('/').map(encodeURIComponent).join('/');
  const { stdout } = await exec('curl', ['-fsSL', '--retry', '2', '--max-time', '40', url],
    { encoding: 'buffer', maxBuffer: 1024 * 1024 });
  if (stdout.length !== item.bytes || digest(stdout) !== item.sha256)
    throw Error('Illustration integrity check failed: ' + id);
  const svg = stdout.toString('utf8');
  if (!svg.includes('<svg') || /<script\b|<foreignObject\b|\bon\w+\s*=|(?:href|src)\s*=\s*["'](?:https?:|data:)/i.test(svg))
    throw Error('Unsafe SVG: ' + id);
  return stdout;
}
async function prepare() {
  const entries = Object.entries(manifest.images);
  let index = 0, updated = 0;
  async function worker() {
    while (index < entries.length) {
      const [id, item] = entries[index++];
      const file = new URL('assets/images/' + id + '.svg', import.meta.url);
      let current;
      try { current = await readFile(file); } catch {}
      if (current && digest(current) === item.sha256) continue;
      await writeFile(file, await fetchReviewedIllustration(id));
      updated++;
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  await writeMediaIndex();
  console.log('Reviewed illustrations ready: ' + entries.length + '; updated: ' + updated);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await prepare();
