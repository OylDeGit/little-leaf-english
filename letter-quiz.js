import { alphabet } from './scenes.js';
export const LETTER_ROUND_KEY='little-leaf:letters:v1';
const letters=alphabet.map(l=>l.upper);
const shuffled=(items,random)=>{
 const result=[...items];
 for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
 return result;
};
export function createLetterRound(random=Math.random){
 const queue=shuffled(letters,random).slice(0,10);
 return {type:'listen',queue,options:queue.map(target=>shuffled([target,...shuffled(letters.filter(l=>l!==target),random).slice(0,3)],random)),position:0,results:[],answered:false,lastCorrect:false};
}
export function validateLetterRound(raw){
 if(!raw||raw.type!=='listen'||!Array.isArray(raw.queue)||raw.queue.length!==10||new Set(raw.queue).size!==10||raw.queue.some(l=>!letters.includes(l))||!Array.isArray(raw.options)||raw.options.length!==10||!Number.isInteger(raw.position)||raw.position<0||raw.position>10||!Array.isArray(raw.results))return null;
 if(raw.options.some((opts,i)=>!Array.isArray(opts)||opts.length!==4||new Set(opts).size!==4||!opts.includes(raw.queue[i])||opts.some(l=>!letters.includes(l))))return null;
 if(raw.results.length!==raw.position+(raw.answered===true&&raw.position<10?1:0)||raw.results.some((r,i)=>!r||!raw.options[i].includes(r.chosen)||r.correct!==(r.chosen===raw.queue[i])))return null;
 if(typeof raw.answered!=='boolean'||typeof raw.lastCorrect!=='boolean'||raw.answered!==(raw.position<10&&raw.results.length>raw.position)||raw.lastCorrect!==(raw.answered&&raw.results[raw.position].correct))return null;
 return structuredClone(raw);
}
export function answerLetter(round,chosen){
 if(!round||round.answered||round.position>=round.queue.length||!round.options[round.position].includes(chosen))return false;
 round.answered=true;round.lastCorrect=chosen===round.queue[round.position];round.results.push({chosen,correct:round.lastCorrect});return true;
}
export function advanceLetter(round){
 if(!round?.answered||round.position>=round.queue.length)return false;
 round.position++;round.answered=false;round.lastCorrect=false;return true;
}
