import {wordMap} from './data.js';
export const KEY='little-leaf:v1';
export const dayKey=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const emptyState=()=>({version:1,records:{},days:{},favorites:[],settings:{goal:10,rate:0.85,showChinese:true},updatedAt:0});
export const normalize=s=>s.trim().toLowerCase().replace(/[.!?]+$/,'').replace(/\s+/g,' ');
export function answer(state,id,correct,now=Date.now()){
 if(!wordMap.has(id))throw Error('Unknown word');
 const old=state.records[id]||{seen:0,correct:0,wrong:0,level:0};
 const level=correct?Math.min(5,old.level+1):0;
 state.records[id]={seen:old.seen+1,correct:old.correct+(correct?1:0),wrong:old.wrong+(correct?0:1),level,due:now+(correct?[1,3,7,14,30][level-1]*86400000:600000),updatedAt:now};
 const day=dayKey(new Date(now)); state.days[day]=(state.days[day]||0)+1; state.updatedAt=now;
 return state;
}
export function studyQueue(state,pool,now=Date.now(),limit=10){
 const due=pool.filter(w=>state.records[w.id]?.due<=now).sort((a,b)=>state.records[a.id].due-state.records[b.id].due);
 const fresh=pool.filter(w=>!state.records[w.id]);
 const later=pool.filter(w=>state.records[w.id]?.due>now).sort((a,b)=>state.records[a.id].level-state.records[b.id].level);
 return [...due,...fresh,...later].slice(0,limit);
}
export const dueWords=(s,pool,now=Date.now())=>pool.filter(w=>s.records[w.id]?.due<=now);
export function validateBackup(input){
 if(!input||input.version!==1||!input.records||typeof input.records!=='object'||Array.isArray(input.records))throw Error('备份格式不正确');
 const s=emptyState();
 for(const [id,r] of Object.entries(input.records)){
  if(!wordMap.has(id))continue;
  if(!r||!['seen','correct','wrong','level','due','updatedAt'].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0)||r.level>5||r.seen!==r.correct+r.wrong||r.due>4102444800000||r.updatedAt>4102444800000)throw Error('单词进度数据无效');
  s.records[id]={seen:r.seen,correct:r.correct,wrong:r.wrong,level:r.level,due:r.due,updatedAt:r.updatedAt};
 }
 for(const [day,n] of Object.entries(input.days||{})){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isSafeInteger(n)||n<0||n>100000)throw Error('每日记录无效');s.days[day]=n;
 }
 s.favorites=Array.isArray(input.favorites)?[...new Set(input.favorites.filter(id=>wordMap.has(id)))]:[];
 if(input.settings){
  if([5,10,15,20].includes(input.settings.goal))s.settings.goal=input.settings.goal;
  if([0.7,0.85,1].includes(input.settings.rate))s.settings.rate=input.settings.rate;
  if(typeof input.settings.showChinese==='boolean')s.settings.showChinese=input.settings.showChinese;
 }
 s.updatedAt=Number.isSafeInteger(input.updatedAt)&&input.updatedAt>=0?input.updatedAt:0;
 return s;
}
export function mergeBackup(current,incoming){
 const other=validateBackup(incoming),s=structuredClone(current);
 for(const [id,r] of Object.entries(other.records))if(!s.records[id]||r.updatedAt>s.records[id].updatedAt)s.records[id]=r;
 for(const [day,n] of Object.entries(other.days))s.days[day]=Math.max(s.days[day]||0,n);
 s.favorites=[...new Set([...s.favorites,...other.favorites])];s.updatedAt=Math.max(s.updatedAt,other.updatedAt);return s;
}
export function streak(s,now=new Date()){
 const d=new Date(now);let count=0;
 if(!s.days[dayKey(d)])d.setDate(d.getDate()-1);
 while(s.days[dayKey(d)]){count++;d.setDate(d.getDate()-1);}return count;
}
