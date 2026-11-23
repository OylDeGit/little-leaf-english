// Web-only learning state: no account, cloud SDK, or private service configuration.
import { wordMap, categories } from './data.js';
import { dialogues } from './dialogues.js';
const lessonById=new Map(dialogues.map(d=>[d.id,d]));
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const time=v=>Number.isSafeInteger(v)&&v>0&&v<=4102444800000;
const day=d=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;const[y,m,n]=d.split('-').map(Number),v=new Date(y,m-1,n);return v.getFullYear()===y&&v.getMonth()===m-1&&v.getDate()===n;};
export const localDay=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const DIALOGUE_DRAFT_KEY='little-leaf:dialogues:v1';
export function validateLearningFields(input){
 const dailyLessonWords={},dialogueCompletions={};
 if(input.dailyLessonWords!=null&&!object(input.dailyLessonWords))throw Error('每日词单无效');
 for(const[d,ids]of Object.entries(input.dailyLessonWords||{})){
  if(!day(d)||!Array.isArray(ids)||ids.length>5||new Set(ids).size!==ids.length||ids.some(id=>!wordMap.has(id)))throw Error('每日词单无效');
  dailyLessonWords[d]=[...ids];
 }
 if(input.dialogueCompletions!=null&&!object(input.dialogueCompletions))throw Error('对话记录无效');
 for(const[id,c]of Object.entries(input.dialogueCompletions||{})){
  if(!lessonById.has(id))continue;
  if(!object(c)||!time(c.completedAt)||!Number.isInteger(c.bestCorrect)||c.bestCorrect<0||c.bestCorrect>3)throw Error('对话记录无效');
  dialogueCompletions[id]={completedAt:c.completedAt,bestCorrect:c.bestCorrect};
 }
 return{dailyLessonWords,dialogueCompletions};
}
export function mergeLearningFields(current,incoming){
 const a=validateLearningFields(current),b=validateLearningFields(incoming);
 for(const[d,ids]of Object.entries(b.dailyLessonWords))if(!a.dailyLessonWords[d])a.dailyLessonWords[d]=ids;
 for(const[id,c]of Object.entries(b.dialogueCompletions)){
  const old=a.dialogueCompletions[id];a.dialogueCompletions[id]=old?{completedAt:Math.max(old.completedAt,c.completedAt),bestCorrect:Math.max(old.bestCorrect,c.bestCorrect)}:c;
 }
 return a;
}
export function dailyPlan(state,date=new Date()){
 const key=localDay(date),ids=state.dailyLessonWords?.[key]||[];
 return{day:key,ids,remaining:Math.max(0,5-ids.length)};
}
export function allocateLesson(state,pool,date=new Date()){
 const plan=dailyPlan(state,date);if(!plan.remaining)return[];
 const unique=[...new Map(pool.map(w=>[w.id,w])).values()].filter(w=>!plan.ids.includes(w.id));
 const fresh=unique.filter(w=>!state.contacts?.[w.id]&&!state.records[w.id]);
 const due=unique.filter(w=>state.records[w.id]?.due<=date.getTime()).sort((a,b)=>state.records[a.id].due-state.records[b.id].due);
 const chosen=(fresh.length?fresh:due).slice(0,plan.remaining);
 if(chosen.length){state.dailyLessonWords||={};state.dailyLessonWords[plan.day]=[...plan.ids,...chosen.map(w=>w.id)];state.updatedAt=date.getTime();}
 return chosen;
}
export function homeGuide(state,saved,lesson,advanced=false,now=new Date()){
 if(saved&&(saved.type!=='spell'||advanced))return{kind:'resume',title:'继续刚才的练习',note:`上次到第 ${saved.position+1} / ${saved.queue.length} 题`};
 if(lesson&&!lesson.completed)return{kind:'lesson-resume',title:`继续这 ${lesson.ids.length} 个词`,note:'今天的小课堂还在，不必一次学完'};
 const due=Object.values(state.records).filter(r=>r.due<=now.getTime()).length;
 if(due)return{kind:'due',title:'复习旧朋友',note:`${due} 个待复习，先轻松练一小组`};
 const remaining=dailyPlan(state,now).remaining;
 const fresh=[...wordMap.values()].some(w=>!state.contacts?.[w.id]&&!state.records[w.id]);
 if(remaining&&fresh)return{kind:'lesson-today',title:`开始今天的 ${remaining} 词小课堂`,note:'先听发音，再一起找图片'};
 return{kind:'scene-list',title:'去生活里找一找',note:'今天的词安排好啦，自由探索也很棒'};
}
export const animals=[['🐰','小兔',1],['🐻','小熊',3],['🦊','小狐狸',5],['🐼','小熊猫',7],['🐱','小猫',10]];
export function learningRewards(state,now=new Date()){
 const stars=Object.entries(state.days||{}).filter(([d,n])=>day(d)&&Number.isSafeInteger(n)&&n>=3).length;
 return{stars,today:Math.min(3,state.days?.[localDay(now)]||0),stickers:animals.map(([emoji,name,required])=>({emoji,name,required,unlocked:stars>=required}))};
}
export function validateDialogueRound(id,raw){
 const d=lessonById.get(id);if(!d||!object(raw))return null;
 const steps=raw.steps||[0,1,2];
 if(!Array.isArray(steps)||!steps.length||steps.length>3||new Set(steps).size!==steps.length||steps.some(n=>!Number.isInteger(n)||n<0||n>2))return null;
 if(!Number.isInteger(raw.position)||raw.position<0||raw.position>steps.length||typeof raw.answered!=='boolean'||!Array.isArray(raw.results))return null;
 const done=raw.position===steps.length;
 if(raw.results.length!==(done?steps.length:raw.position+(raw.answered?1:0)))return null;
 if(raw.results.some((r,i)=>!object(r)||r.step!==steps[i]||typeof r.correct!=='boolean'))return null;
 const step=done?steps.at(-1):steps[raw.position],allowed=d.lines[step*2+1].options;
 if(!Array.isArray(raw.options)||raw.options.length!==allowed.length||raw.options.some(o=>!object(o))||new Set(raw.options.map(o=>o.en)).size!==allowed.length||raw.options.some(o=>!allowed.some(a=>a.en===o.en&&a.zh===o.zh)))return null;
 if(!done&&raw.answered&&(!Number.isInteger(raw.chosen)||raw.chosen<0||raw.chosen>=allowed.length))return null;
 return{steps:[...steps],position:raw.position,step:done?3:step,answered:done?true:raw.answered,chosen:raw.answered?raw.chosen:null,options:raw.options.map(o=>({en:o.en,zh:o.zh})),results:raw.results.map(r=>({...r})),correct:raw.results.filter(r=>r.correct).length,retryOnly:raw.retryOnly===true};
}
export function lessonTopicPool(state){
 return categories.find(c=>c.words.some(w=>!state.contacts?.[w.id]&&!state.records[w.id]))?.words||[];
}

// Small lists stay whole; larger lists grow in bounded batches while retaining bookmarks.
export const WORD_BATCH=16;
export const SMALL_WORD_LIST=32;
export function wordWindow(total,shown=WORD_BATCH){
 const size=Number.isSafeInteger(total)?Math.max(0,total):0;
 const limit=Number.isSafeInteger(shown)?Math.max(WORD_BATCH,shown):WORD_BATCH;
 return size<=SMALL_WORD_LIST?size:Math.min(size,limit);
}
