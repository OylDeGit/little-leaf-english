// Remove authoring-tool padding without transcoding the AAC stream.
export function compactM4a(input){
 const atoms=[];for(let p=0;p<input.length;){const n=input.readUInt32BE(p);if(n<8||p+n>input.length)throw Error('Invalid MP4 atom');atoms.push({p,n,t:input.toString('ascii',p+4,p+8)});p+=n;}
 const removed=atoms.filter(a=>a.t==='free');if(!removed.length)return input;
 const shift=offset=>removed.filter(a=>a.p+a.n<=offset).reduce((n,a)=>n+a.n,0);
 const b=Buffer.from(input),containers=new Set(['moov','trak','mdia','minf','stbl','edts','udta']);
 function patch(start,end){for(let p=start;p<end;){const n=b.readUInt32BE(p),t=b.toString('ascii',p+4,p+8);if(n<8||p+n>end)throw Error('Invalid MP4 container');
  if(t==='stco'||t==='co64'){const count=b.readUInt32BE(p+12),wide=t==='co64',size=wide?8:4;for(let i=0;i<count;i++){const pos=p+16+i*size,old=wide?Number(b.readBigUInt64BE(pos)):b.readUInt32BE(pos);if(wide)b.writeBigUInt64BE(BigInt(old-shift(old)),pos);else b.writeUInt32BE(old-shift(old),pos);}}
  else if(containers.has(t))patch(p+8,p+n);p+=n;
 }}patch(0,b.length);
 return Buffer.concat(atoms.filter(a=>a.t!=='free').map(a=>b.subarray(a.p,a.p+a.n)));
}
