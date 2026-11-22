import { compactM4a } from './compact-m4a.mjs';
// Authoring only. Requires kokoro-js@1.2.1 in a separate tool directory and the official local q8 model.
// node --expose-gc prepare-natural-audio.mjs /absolute/tool-dir /absolute/output-dir [--samples]
import { vocabulary } from './vocabulary.js';
import { alphabet } from './scenes.js';
import { dialogues } from './dialogues.js';
import { readFile, writeFile, mkdir, unlink, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec=promisify(execFile), tool=resolve(process.argv[2]), out=resolve(process.argv[3]);
await mkdir(out,{recursive:true});
const {env}=await import(pathToFileURL(join(tool,'node_modules/@huggingface/transformers/dist/transformers.node.mjs')));
env.allowRemoteModels=false;env.cacheDir=join(tool,'cache');env.backends.onnx.wasm.numThreads=2;
const {KokoroTTS}=await import(pathToFileURL(join(tool,'node_modules/kokoro-js/dist/kokoro.js')));
const modelFile=join(tool,'model/onnx/model_quantized.onnx');
if((await stat(modelFile)).size<80000000)throw Error('Incomplete official model');
const modelHash=createHash('sha256').update(await readFile(modelFile)).digest('hex');
console.log('Loading offline Kokoro q8 model…');
const tts=await KokoroTTS.from_pretrained(join(tool,'model'),{dtype:'q8',device:'cpu'});
const words=vocabulary.flatMap(c=>c.words);
const jobs=[...words.map(w=>({id:w.id,text:w.word,voice:'af_heart',kind:'word'})),...words.map(w=>({id:'sentence-'+w.id,text:w.sentence,voice:'af_heart',kind:'sentence'})),...alphabet.map(l=>({id:l.audioId,text:l.upper,voice:'af_heart',kind:'letter'})),...dialogues.flatMap(d=>d.lines.map((line,i)=>({id:line.audio.split('/').pop().replace('.m4a',''),text:line.en,voice:i%2?'am_fenrir':'af_heart',kind:'dialogue'})))];
const sampleIds=['apple','thirteen','thirty','forty','hundred','thousand','ear','orange','vegetable','pomegranate','sentence-apple','sentence-thirteen','sentence-vegetable','sentence-ear','dialogue-fruit-shop-0','dialogue-fruit-shop-1','dialogue-drink-order-0','dialogue-drink-order-1','letter-z'];
const sampleOnly=process.argv.includes('--samples');
let manifest={};try{manifest=JSON.parse(await readFile(join(out,'manifest.json'),'utf8'));}catch{}
const ordered=[...jobs.filter(j=>sampleIds.includes(j.id)),...jobs.filter(j=>!sampleIds.includes(j.id))];
let done=0;
for(const job of ordered){
 if(sampleOnly&&!sampleIds.includes(job.id))continue;
 const fingerprint=createHash('sha256').update(JSON.stringify({...job,modelHash,speed:1,encoding:'aac64-rms20-trim-v1'})).digest('hex');
 const path=join(out,job.id+'.m4a');
 if(manifest[job.id]?.fingerprint===fingerprint){try{if((await stat(path)).size>1000){done++;continue;}}catch{}}
 const raw=await tts.generate(job.text,{voice:job.voice,speed:1});
 const a=raw.audio, sr=24000;
 let first=0,last=a.length-1;while(first<last&&Math.abs(a[first])<0.006)first++;while(last>first&&Math.abs(a[last])<0.006)last--;
 first=Math.max(0,first-Math.round(sr*.08));last=Math.min(a.length,last+Math.round(sr*.15));
 const samples=a.slice(first,last);let sum=0,peak=0;for(const v of samples){sum+=v*v;peak=Math.max(peak,Math.abs(v));}
 const rms=Math.sqrt(sum/samples.length);if(peak<.01||samples.length<sr*.15)throw Error('Silent or truncated speech: '+job.id);
 const gain=Math.min(.1/rms,.89/peak), bytes=Buffer.alloc(44+samples.length*2);
 bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(sr,24);bytes.writeUInt32LE(sr*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(samples.length*2,40);
 samples.forEach((v,i)=>bytes.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v*gain))*32767),44+i*2));
 const wav=join(out,job.id+'.wav');await writeFile(wav,bytes);
 await exec('afconvert',['-f','m4af','-d','aac ','-b','64000','-c','1',wav,path]);
 await writeFile(path,compactM4a(await readFile(path)));
 if(!sampleIds.includes(job.id))await unlink(wav);
 manifest[job.id]={...job,fingerprint,modelHash,duration:samples.length/sr,rmsDb:20*Math.log10(rms*gain),peak:peak*gain,bytes:(await stat(path)).size};
 await writeFile(join(out,'manifest.json'),JSON.stringify(manifest,null,2));
 done++;if(done<=sampleIds.length||done%25===0)console.log(`${done}/${sampleOnly?sampleIds.length:jobs.length}: ${job.id}`);
 if(done%20===0)global.gc?.();
}
console.log('Speech generation complete:',done);
