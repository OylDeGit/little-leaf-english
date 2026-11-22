// Authoring step; generation/model files remain outside the published site.
import {readFile,writeFile,stat,copyFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {compactM4a} from './compact-m4a.mjs';
import {vocabulary} from './vocabulary.js';
import {alphabet} from './scenes.js';
import {dialogues} from './dialogues.js';
import {writeMediaIndex} from './write-media-index.mjs';
const input=resolve(process.argv[2]||'../../work/voice-generated');
const manifest=JSON.parse(await readFile(join(input,'manifest.json'),'utf8'));
const jobs=[...vocabulary.flatMap(c=>c.words).flatMap(w=>[{id:w.id,text:w.word,kind:'word',voice:'af_heart'},{id:'sentence-'+w.id,text:w.sentence,kind:'sentence',voice:'af_heart'}]),...alphabet.map(l=>({id:l.audioId,text:l.upper,kind:'letter',voice:'af_heart'})),...dialogues.flatMap(d=>d.lines.map((l,i)=>({id:l.audio.split('/').pop().replace('.m4a',''),text:l.en,kind:'dialogue',voice:i%2?'am_fenrir':'af_heart'})))];
if(jobs.some(j=>!manifest[j.id]))throw Error('Speech generation is incomplete');
const audit={engine:'Kokoro-82M v1.0',runtime:'kokoro-js 1.2.1',model:'onnx-community/Kokoro-82M-v1.0-ONNX',encoding:'AAC 64 kbps mono, 24 kHz',normalization:'RMS target -20 dBFS, peak <= 0.89; edge trim with 80/150ms padding',clips:{}};
for(const job of jobs){
 const info=manifest[job.id];if(info.text!==job.text||info.voice!==job.voice||info.duration<.15||info.peak>.9||info.rmsDb<-40)throw Error('Invalid speech: '+job.id);
 const b=compactM4a(await readFile(join(input,job.id+'.m4a')));
 await writeFile('assets/audio/'+job.id+'.m4a',b);
 audit.clips[job.id]={...info,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};
}
await writeFile('audio-provenance.json',JSON.stringify(audit,null,2)+'\n');
await writeMediaIndex();
console.log('Installed',jobs.length,'natural speech clips;',Object.values(audit.clips).reduce((n,c)=>n+c.bytes,0),'bytes');
