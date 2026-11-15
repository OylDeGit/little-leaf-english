// Content authoring helper: macOS say/afconvert; local audio is committed for all other platforms.
import { dialogues } from './dialogues.js';
import { access, unlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
const exec = promisify(execFile),
  lines = dialogues.flatMap((d) => d.lines);
let cursor = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (cursor < lines.length) {
      const line = lines[cursor++];
      try {
        await access(line.audio);
        continue;
      } catch {}
      const temp = `${tmpdir()}/little-leaf-${line.audio.split('/').pop()}.aiff`;
      try {
        await exec('say', ['-v', 'Samantha', '-r', '135', '-o', temp, line.en]);
        await exec('afconvert', ['-f', 'm4af', '-d', 'aac ', temp, line.audio]);
      } finally {
        await unlink(temp).catch(() => {});
      }
    }
  }),
);
console.log(`${lines.length} dialogue recordings ready.`);
