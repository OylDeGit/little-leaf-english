import { dailyPlan, allocateLesson, homeGuide, learningRewards, lessonTopicPool, validateDialogueRound, DIALOGUE_DRAFT_KEY } from './learning.js';
import { VIEW_KEY, DRAFT_KEY, LESSON_KEY, validateView, validateLesson, routeFor, parseRoute } from './navigation.js';
import { scenes, sceneMap, alphabet } from './scenes.js';
import { dialogues } from './dialogues.js';
import { audioSources, sentenceSources } from './media.js';
import { categories, words, wordMap, categoryMap, imagePath } from './data.js';
import {
  KEY,
  contactWord,
  learningStats,
  lessonWords,
  perfectListeningRound,
  emptyState,
  validateBackup,
  mergeBackup,
  answer,
  recordPracticeAnswer,
  studyQueue,
  dueWords,
  dayKey,
  streak,
  normalize,
  SESSION_KEY,
  validateSession,
  matchesSpelling,
  sentenceParts,
  shuffle,
  quizOptions,
  dailyRoundSize,
} from './core.js';
const $ = (s) => document.querySelector(s),
  app = $('#app'),
  modal = $('#modal');
let state;
try {
  const raw = localStorage.getItem(KEY);
  state = raw ? validateBackup(JSON.parse(raw)) : emptyState();
} catch {
  state = emptyState();
  setTimeout(() => toast('暂时无法读取进度，请检查浏览器存储或导入备份'), 300);
}
let savedSession = null;
try {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    const checked=validateSession(JSON.parse(raw));
    savedSession=checked;
  }
} catch {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}
const SPELLING_DRAFT_KEY='little-leaf:advanced:v1';
let savedSpelling=savedSession?.type==='spell'?savedSession:null;
try{const raw=localStorage.getItem(SPELLING_DRAFT_KEY);if(!savedSpelling&&raw){const checked=validateSession(JSON.parse(raw));if(checked.type==='spell')savedSpelling=checked;}if(savedSpelling)localStorage.setItem(SPELLING_DRAFT_KEY,JSON.stringify(savedSpelling));}catch{}
let parentOpen=false, advancedPractice=false, correction=null, dialogueCorrection=false;
const dialogueDrafts={};
try { const raw=JSON.parse(localStorage.getItem(DIALOGUE_DRAFT_KEY)||'{}');
  for(const d of dialogues){const round=validateDialogueRound(d.id,raw[d.id]);if(round)dialogueDrafts[d.id]=round;}
} catch {}
let themeView = 'topics', selectedSceneWord = null, sceneReturnScroll = 0;
let shown = 8,
  allSearch = '';
let dialogueLesson = null,
  dialoguePractice = null,
  dialogueChinese = true;
let page = 'home',
  category = null,
  mode = 'cards',
  search = '',
  filter = 'all',
  index = 0,
  session = null,
  audio = null,
  sentenceHidden = false,
  sentenceFeedback = null,
  sentenceRecorded = new Set(),
  playToken = 0;
let activeLesson=null, navigationReady=false, restoringView=false, viewTimer;
const drafts=new Map(), browseViews=new Map(), audioCache=new Map();
try {
  activeLesson=validateLesson(JSON.parse(localStorage.getItem(LESSON_KEY)||'null'));
  for (const [key,value] of JSON.parse(sessionStorage.getItem(DRAFT_KEY)||'[]')) drafts.set(key,value);
  for (const [key,value] of JSON.parse(sessionStorage.getItem(VIEW_KEY+':browse')||'[]')) {
    const view=validateView(value); if(view) browseViews.set(key,view);
  }
} catch {}
const icons = {
  leaf: '<path d="M5 18C1 5 13 2 21 3c0 11-5 19-14 16M4 21 17 8M9 15 8 9m5 3h5"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  book: '<path d="M12 5v16M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',
  chart: '<path d="M4 3v17h17M8 15v-4m5 4V7m5 8V4"/>',
  settings: '<path d="M3 7h18M3 17h18"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  sound: '<path d="M4 9h4l5-5v16l-5-5H4Zm12-2c4 3 4 7 0 10m3-13c6 5 6 11 0 16"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="m14 5-7 7 7 7"/>',
  star: '<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>',
  refresh: '<path d="M20 7A9 9 0 1 0 21 15M20 2v6h-6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 17v2M1 12h3m17 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
};
const icon = (n) =>
  `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[n] || icons.star}</svg>`;
const img = (w, cls = '', alt = '') =>
  `<img class="${cls}" src="${imagePath(w)}" alt="${alt}" draggable="false" loading="lazy" decoding="async">`;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const btn = (text, action, cls = 'primary', extra = '') =>
  `<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
const today = () => state.days[dayKey()] || 0;
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    toast('保存失败：浏览器存储不可用，请导出备份');
    return false;
  }
}
let toastTimer, autoNextTimer, fireworksTimer;
function toast(t, duration = 4000) {
  $('#toast').textContent = t;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), duration);
}

function setPlaying(id,playing) {
  document.querySelectorAll(`[data-audio-id="${id}"],[data-action="speak:${id}"],[data-action="scene-word:${id}"]`).forEach(node=>{
    node.classList.toggle('speaking',playing); node.setAttribute('aria-busy',String(playing));
    if(node.classList.contains('sound-button')) node.innerHTML=icon('sound')+(playing?'正在播放…':'再听一遍');
  });
}
function stopMedia() {
  stopFireworkSound();
  clearTimeout(autoNextTimer); playToken++;
  document.querySelectorAll('.speaking').forEach(node=>{
    node.classList.remove('speaking');node.setAttribute('aria-busy','false');
    if(node.classList.contains('sound-button')) node.innerHTML=icon('sound')+'再听一遍';
  });
  if(audio){audio.onended=null;audio.pause();audio.currentTime=0;audio=null;}
}
function cachedAudio(id) {
  const source=id.startsWith('sentence-')?sentenceSources[id.slice(9)]:audioSources[id];
  if(!source) return null;
  let clip=audioCache.get(id);
  if(clip) audioCache.delete(id);
  else {clip=new Audio(source);clip.preload='auto';}
  audioCache.set(id,clip);
  while(audioCache.size>8){
    const oldest=[...audioCache.keys()].find(key=>audioCache.get(key)!==audio);
    if(!oldest) break; audioCache.delete(oldest);
  }
  return clip;
}
function preloadNearby() {
  if(session&&['listen','spell'].includes(mode))
    session.queue.slice(session.position,session.position+2).forEach(w=>cachedAudio(w.id));
  if(session?.type==='listen'&&session.queue.length===10&&session.position>=8)
    cachedAudio('fireworks');
}
function recordContact(id) {
  if(!contactWord(state,id)) return;
  save();
  document.querySelectorAll(`[data-contact-status="${id}"]`).forEach(n=>{n.textContent=wordStage(id);});
  const counts=learningStats(state);
  for(const key of ['contacted','practiced','mastered'])
    document.querySelectorAll(`[data-stage-count="${key}"]`).forEach(n=>{n.textContent=counts[key];});
  if(mode==='lesson'&&$('#lesson-contact-count')) $('#lesson-contact-count').textContent=lessonContactCount();
}
async function speak(id,automatic=false) {
  stopMedia();
  const token=playToken;
  const text=wordMap.get(id)?.word||alphabet.find(l=>l.audioId===id)?.upper;
  if(!text) return toast('这个发音暂不可用，请换一个再试。');
  setPlaying(id,true);
  const ended=()=>{if(token===playToken){setPlaying(id,false);audio=null;scheduleAutoNext();}};
  try {
    const clip=cachedAudio(id);if(!clip) throw Error('Missing audio');
    audio=clip;clip.currentTime=0;clip.playbackRate=state.settings.rate;clip.preservesPitch=true;clip.onended=ended;
    await clip.play();if(token===playToken) recordContact(id);
  } catch(error) {
    if(token!==playToken||error.name==='AbortError') return;
    if(audio) audio.onended=null;audio=null;
    if(automatic&&error.name==='NotAllowedError'){
      setPlaying(id,false);toast('点一下播放按钮，就能听到声音。');return;
    }
    setPlaying(id,false);toast('音频暂时没加载好，点一下重试，或请家长下载离线内容。');
  }
}

function currentPool() {
  return session?.pool&&['listen','spell'].includes(mode)?session.pool:category?category.words:words;
}
function visibleWords() {
  let p = currentPool();
  if (filter === 'favorites') p = p.filter((w) => state.favorites.includes(w.id));
  if (filter === 'new') p = p.filter((w) => !hasContact(w.id));
  if (filter === 'learned') p = p.filter((w) => state.records[w.id]?.level >= 3);
  return p.filter((w) => searchText(w).toLowerCase().includes(search.toLowerCase()));
}

function nav(n) {
  saveDialogueDraft();
  if(['parent','progress'].includes(n)){if(n==='progress'&&!parentOpen)n='parent';}
  else parentOpen=false;
  stopMedia();dialogueLesson=null;dialoguePractice=null;page=n;category=null;session=null;
  index=0;search='';filter='all';
  const bookmark=n==='themes'&&browseViews.get('list:'+themeView);
  if(bookmark) return restoreView(bookmark);
  render();window.scrollTo(0,0);
}

function render() {
  clearFireworks();
  document.body.classList.toggle('hide-dialogue-chinese', !dialogueChinese);
  document.body.classList.toggle('hide-translations',!state.settings.showChinese);
  document.body.classList.toggle(
    'studying',
    (!!category && !['cards', 'scene'].includes(mode)) || (page === 'dialogues' && !!dialoguePractice),
  );
  const learned = Object.values(state.records).filter((r) => r.level >= 3).length;
  app.innerHTML = `<aside class="sidebar"><a class="brand" href="#" data-action="home"><span class="brand-icon">${icon('leaf')}</span><span>小叶子英语<small>LITTLE LEAF ENGLISH</small></span></a><div class="sidebar-label">我的学习空间</div><nav>${[
    ['home', 'home', '学习首页'],
    ['themes', 'grid', '发现英语'],
    ['parent', 'chart', '家长中心'],
  ]
    .map(([id, i, t]) =>
      btn(
        icon(i) + t,
        `nav:${id}`,
        `nav-link ${page === id ? 'active' : ''}`,
        page === id ? 'aria-current="page"' : '',
      ),
    )
    .join(
      '',
    )}</nav><div class="sidebar-bottom"><div class="grow-note"><span>🌱</span><strong>每天一点，自然生长</strong><p>每一个新单词，<br>都是一片小小的新叶子。</p></div>${btn(icon('settings') + '家长中心', 'nav:parent', 'nav-link')}<small>给好奇心，一点生长的空间</small></div></aside><div class="workspace"><header class="topbar"><div class="breadcrumb">我的学习空间 <span>/</span> <strong>${category ? esc(category.name) : { home: '学习首页', themes: '探索主题', review: '我的复习', dialogues: '生活对话', parent: '家长中心', rewards: '小动物贴纸册', progress: '成长记录' }[page]}</strong></div><div class="top-meta">${page === 'dialogues' && dialoguePractice ? btn(icon('back'), 'nav:dialogues', 'icon-button study-exit', 'aria-label="退出对话练习"') : ''}${category && !['cards', 'scene'].includes(mode) ? btn(icon('back'), 'back-study', 'icon-button study-exit', 'aria-label="退出练习，返回学习内容"') : ''}<span class="streak">${icon('sun')} 连续学习 ${streak(state)} 天</span><button class="avatar parent-shortcut" data-action="nav:parent" aria-label="进入家长中心">家长</button></div></header><main id="main" tabindex="-1">${category ? renderCategory() : page === 'home' ? home() : page === 'themes' ? themes() : page === 'review' ? review() : page === 'dialogues' ? dialogueView() : page === 'rewards' ? rewardsView() : page === 'parent' || (page === 'progress' && !parentOpen) ? parentView() : progress(learned)}</main><footer>让英语，从看见、听见，到自然说出口。<span>Little steps. Big discoveries.</span></footer></div><nav class="mobile-nav" aria-label="主导航">${[
    ['home', 'home', '首页'],
    ['themes', 'grid', '发现'],
    ['parent', 'chart', '家长'],
  ]
    .map(([id, i, t]) => btn(icon(i) + `<span>${t}</span>`, `nav:${id}`, page === id ? 'active' : ''))
    .join('')}</nav>`;
  preloadNearby();
}
function heading(kicker, title, sub, right = '') {
  return `<div class="heading"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p class="muted">${sub}</p></div>${right}</div>`;
}

function stageSummary() {
  const stats=learningStats(state);
  return `<section class="stage-summary" aria-label="学习足迹">${[['contacted','接触过'],['practiced','练习过'],['mastered','已巩固']].map(([key,label])=>`<div><strong data-stage-count="${key}">${stats[key]}</strong><span>${label}</span></div>`).join('')}</section>`;
}
function home() {
  const guide=homeGuide(state,resumablePractice(),activeLesson,advancedPractice), rewards=learningRewards(state), plan=dailyPlan(state);
  return `${heading('HELLO, LITTLE EXPLORER','今天，玩一会儿英语吧 🌱','听一听 · 看一看 · 慢慢学')}
  <div class="child-summary">${btn('⭐ '+rewards.stars+' 颗星 · 贴纸册','nav:rewards','secondary')}${btn('家长中心','nav:parent','text-button')}</div>
  <section class="start-learning-card"><div><span class="pill">每天最多安排 5 个词</span><h2>${guide.title}</h2><p>${guide.note}</p><p class="small">今日已安排 ${plan.ids.length} / 5 个词，不必一次学完。</p>${btn(guide.title+' '+icon('arrow'),guide.kind,'primary')}</div><div class="start-learning-art" aria-hidden="true">${img(wordMap.get('apple'))}${img(wordMap.get('butterfly'))}</div></section>
  <section class="child-review panel"><h2>复习旧朋友</h2><p>${dueWords(state,words).length?'有 '+dueWords(state,words).length+' 个词等你再见一面。':'今天暂时不用复习，旧朋友下次在这里等你。'}</p><div class="button-row">${btn(dueWords(state,words).length?'去复习':activeLesson&&!activeLesson.completed?'继续小课堂':plan.remaining?'认识今天的词':'自由认识单词',dueWords(state,words).length?'due':activeLesson&&!activeLesson.completed?'lesson-resume':plan.remaining?'lesson-today':'theme-list','secondary')}${btn('我的收藏与复习','nav:review','text-button')}</div></section>
  <section class="sticker-entry panel"><h2>我的小动物贴纸册 🐰</h2><p>${rewards.today>=3?'今天的小星星已点亮，休息一下也很棒！':'今天认真练习 '+rewards.today+' / 3 次，就能点亮一颗星。答错也算努力！'}</p>${btn('看看小动物朋友','nav:rewards','secondary')}</section>
  <div class="section-title"><h2>到生活里找一找</h2>${btn('更多场景','scene-list','text-button')}</div><div class="scene-catalog home-scenes">${scenes.filter(s=>['clothes','supermarket','zoo','mealtime'].includes(s.id)).map(sceneCover).join('')}</div>
  <div class="home-more-links">${btn('全部主题','theme-list','secondary')}${btn('生活对话','nav:dialogues','secondary')}</div>`;
}
function parentView(){
 if(!parentOpen)return `<section class="panel parent-gate"><span class="intro-emoji">🌿</span><h1>家长中心</h1><p>这里可以查看学习记录、调整语速、备份进度和开启进阶练习。</p><p class="small muted">这只是防误触提示，不是密码或身份认证。</p><div class="button-row">${btn('我是家长，继续','parent-unlock','primary')}${btn('返回学习','home','secondary')}</div></section>`;
 return `${heading('GROW TOGETHER','陪孩子，一点点长大','不必追求全对，每一次认真练习都值得鼓励。')}${stageSummary()}<section class="panel"><h2>学习记录与设置</h2><p>今天练习 ${today()} 次 · ${learningRewards(state).stars} 颗学习星星</p><div class="button-row">${btn('查看详细记录','nav:progress','secondary')}${btn('学习设置、备份与离线','settings','primary')}${btn('小动物贴纸册','nav:rewards','secondary')}</div></section><section class="panel"><h2>进阶练习</h2><p>开启后可使用拼写和例句填空，仅本次打开期间有效。</p>${btn(advancedPractice?'关闭进阶练习':'开启进阶练习','advanced-toggle','secondary','aria-pressed="'+advancedPractice+'"')}${savedSpelling?btn('继续未完成的拼写','resume-spelling','text-button',advancedPractice?'':'disabled'):''}</section><p class="small muted">数据保存在当前浏览器，不自动同步；换设备前请导出备份。</p>`;
}
function rewardsView(){
 const r=learningRewards(state),next=r.stickers.find(s=>!s.unlocked);
 return `${heading('LITTLE STEPS COUNT','我的小动物贴纸册','每天认真练习 3 次，点亮 1 颗星；每天最多 1 颗。')}<section class="panel"><h2>⭐ ${r.stars} 颗学习星星</h2><p>今天 ${r.today} / 3 次 · ${next?'再收集 '+Math.max(0,next.required-r.stars)+' 颗星，就能见到'+next.name:'五位小动物朋友都来啦！'}</p><p>休息几天也没关系，星星和朋友不会消失。</p></section><div class="sticker-grid">${r.stickers.map(s=>`<article class="panel sticker ${s.unlocked?'unlocked':''}"><span aria-hidden="true">${s.emoji}</span><h2>${s.name}</h2><p>${s.unlocked?'已成为朋友':s.required+' 颗星解锁'}</p></article>`).join('')}</div>${btn('回去学一点','home','primary')}`;
}
function categoryCard(c) {
  const done = c.words.filter((w) => hasContact(w.id)).length;
  return `<button class="category-card" data-action="category:${c.id}" style="--tint:${c.color}"><div class="category-pictures">${c.words
    .slice(0, 3)
    .map((w) => img(w))
    .join(
      '',
    )}<span class="category-go">${icon('arrow')}</span></div><div class="category-info"><h3>${c.name}<small>${c.en}</small></h3><span class="word-count">${c.words.length} 个单词</span></div><div class="category-progress"><span style="width:${(done / c.words.length) * 100}%"></span></div><div class="category-foot"><span>${done ? '接触过 ' + done + ' 个' : '等待你的第一个发现'}</span><span>${Math.round((done / c.words.length) * 100)}%</span></div></button>`;
}
function themes() {
  const tabs = `${btn('生活对话 '+icon('sound'),'nav:dialogues','secondary')}<div class="explore-tabs mode-tabs" role="group" aria-label="探索方式">${btn('主题词库', 'theme-view:topics', themeView === 'topics' ? 'selected' : '', `aria-pressed="${themeView === 'topics'}"`)}${btn('场景学习', 'theme-view:scenes', themeView === 'scenes' ? 'selected' : '', `aria-pressed="${themeView === 'scenes'}"`)}</div>`;
  if (themeView === 'scenes') return `${heading('WORDS COME TO LIFE', '走进生活的小世界', '13 个场景 · 轻点物品听发音 · 让英语与生活相遇')}${tabs}${sceneList()}`;
  return `${heading('YOUR WORLD OF WORDS', '每一个主题，都是新发现', categories.length + ' 个生活主题 · ' + words.length + ' 个启蒙单词 · 随时点读')}${tabs}<label class="search global-search">${icon('search')}<input id="all-search" type="search" placeholder="搜索全部单词：中文 / English" aria-label="搜索全部单词" value="${esc(allSearch)}"></label><div id="all-results">${allSearch ? globalResults() : `<div class="category-grid">${categories.map(categoryCard).join('')}</div>`}</div>`;
}
function globalResults() {
  const list = words.filter((w) =>
    (searchText(w) + ' ' + categoryMap.get(w.category).name)
      .toLowerCase()
      .includes(allSearch.trim().toLowerCase()),
  );
  return `<p class="search-count" role="status">找到 ${list.length} 个单词，显示 ${Math.min(shown, list.length)} 个</p><div class="word-grid">${list.slice(0, shown).map(wordCard).join('') || empty('🔎', '没有找到这个词', '试试英文、中文或主题名称。')}</div>${list.length > shown ? btn('再显示 8 个', 'more-global', 'secondary more-button') : ''}`;
}
function wordResults() {
  const list = visibleWords();
  return `${list.slice(0, shown).map(wordCard).join('') || empty('🔎', '还没有找到单词', '试试其他关键词或筛选条件。')}${list.length > shown ? btn('再显示 8 个', 'more', 'secondary more-button') : ''}`;
}
function review() {
  const due = dueWords(state, words),
    wrong = words.filter((w) => state.records[w.id]?.level === 0);
  return `${heading('A LITTLE REVIEW GOES A LONG WAY', '和老朋友，再见一面', '答对后的复习间隔为 1、3、7、14、30 天，答错后 10 分钟再练。')}<section class="review-banner"><div><span class="eyebrow">READY WHEN YOU ARE</span><h2>${due.length ? '有 ' + due.length + ' 个单词想你啦' : '暂时没有到期的单词'}</h2><p>${due.length ? '听一听，选一选，让记忆再长牢一点。' : '可以复习收藏，或者去探索一个新主题。'}</p></div>${btn(due.length ? '开始到期复习 ' + icon('arrow') : '去探索主题 ' + icon('arrow'), due.length ? 'due' : 'nav:themes')}</section><div class="section-title"><h2>需要多见几次 <span>${wrong.length} 个词</span></h2></div><div class="word-grid">${wrong.map(wordCard).join('') || empty('🌿', '现在没有薄弱词', '练习后，需要巩固的词会出现在这里。')}</div><div class="section-title"><h2>我的收藏 <span data-favorites-count>${state.favorites.length} 个词</span></h2>${state.favorites.length ? btn('练习收藏', 'favorites', 'text-button') : ''}</div><div class="word-grid favorites-grid">${state.favorites.map((id) => wordCard(wordMap.get(id))).join('') || empty('☆', '收集你喜欢的单词', '点击词卡右上角的星星，即可放进这里。')}</div>`;
}
function progress(learned) {
  const seen = learningStats(state).contacted,
    correct = Object.values(state.records).reduce((n, r) => n + r.correct, 0),
    total = Object.values(state.records).reduce((n, r) => n + r.seen, 0),
    now = new Date();
  return `${heading('EVERY LITTLE STEP COUNTS', '你的成长，看得见', '慢慢来，每一次练习都在让你更熟悉英语。')}<div class="growth-explanation">点读留下接触足迹；完成答题后算练习过，按复习计划巩固后再标记已巩固。</div>${stageSummary()}<div class="progress-stats">${[
    ['接触范围', seen + '/' + words.length],
    ['已巩固', learned + ' 个'],
    ['练习正确率', total ? Math.round((correct / total) * 100) + '%' : '—'],
    ['累计学习', Object.keys(state.days).length + ' 天'],
  ]
    .map(([t, n]) => `<article><small>${t}</small><strong>${n}</strong></article>`)
    .join(
      '',
    )}</div><section class="panel"><h2>最近 7 天 <span class="muted small">练习次数</span></h2><div class="week">${Array.from(
    { length: 7 },
    (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - 6 + i);
      const n = state.days[dayKey(d)] || 0;
      return `<div><span>${n}</span><div class="bar" style="height:${Math.max(5, Math.min(120, n * 8))}px"></div><small>${d.getMonth() + 1}/${d.getDate()}</small></div>`;
    },
  ).join(
    '',
  )}</div></section><section class="panel"><h2>主题成长</h2><div class="topic-progress">${categories.map((c) => `<div><span>${c.emoji} ${c.name}</span><div class="category-progress"><span style="width:${(c.words.filter((w) => hasContact(w.id)).length / c.words.length) * 100}%"></span></div><small>${c.words.filter((w) => hasContact(w.id)).length}/${c.words.length}</small></div>`).join('')}</div></section><div class="gentle-tip">${icon('leaf')}<span>进度自动保存在当前浏览器。换设备前，请在学习设置里导出备份；设备之间不会自动同步。</span></div>`;
}
function empty(emoji, title, text) {
  return `<div class="empty"><span>${emoji}</span><h3>${title}</h3><p>${text}</p></div>`;
}

function hasContact(id){return !!state.contacts?.[id]||!!state.records[id];}
function wordStage(id){return state.records[id]?.level>=3?'已巩固':state.records[id]?'练习过':hasContact(id)?'接触过':'等你来认识';}
function wordCard(w) {
  const favorite=state.favorites.includes(w.id);
  return `<article class="word-card" data-word-id="${w.id}">
    <button class="favorite ${favorite?'on':''}" data-action="favorite:${w.id}" aria-label="${favorite?'取消收藏':'收藏'} ${esc(w.word)}" aria-pressed="${favorite}">${icon('star')}</button>
    <button class="word-play" data-action="speak:${w.id}" data-audio-id="${w.id}" aria-label="播放 ${esc(w.word)}">${img(w)}<strong>${esc(w.word)}</strong>
      <span data-translation>${esc(w.zh)}</span><span class="listen-label">${icon('sound')} 点一下，听发音</span></button>
    <small class="word-stage" data-contact-status="${w.id}">${wordStage(w.id)}</small></article>`;
}
function studyHeading(){return `<div class="study-heading">${btn(icon('back')+'返回学习内容','back-study','text-button')}<h1>${esc(category.name)}</h1></div>`;}
function modeTabs(){
  const primary=category.sceneId?'scene':'cards';
  const labels={scene:'场景点读',cards:'词卡',listen:'听音选图',sentences:'例句学习',spell:'拼写'};
  const button=id=>btn(labels[id],`mode:${id}`,mode===id?'selected':'',`aria-pressed="${mode===id}"`);
  const modes=[primary,'listen',...['cards','sentences'].filter(id=>id!==primary),...(advancedPractice?['spell']:[])];
  return `<div class="mode-tabs" role="group" aria-label="学习模式">${modes.map(button).join('')}</div>`;
}


function renderCategory(){
  if(mode==='lesson') return studyHeading()+lessonView();
  if(session?.lessonIds&&['listen','spell'].includes(mode)) return studyHeading()+`<p class="lesson-step">认识这组词 → 找图游戏</p>`+quizView();
  return `<div class="study-heading">${btn(icon('back')+(category.sceneId?'返回场景列表':'返回主题'),category.sceneId?'scene-list':'nav:themes','text-button')}
    <span class="eyebrow">${esc(category.en)}</span><h1>${esc(category.name)}</h1><p class="muted">${esc(category.description)}</p></div>
    <div class="study-toolbar">${modeTabs()}${mode==='cards'?`<label class="search">${icon('search')}<input id="search" type="search" placeholder="找一个单词…" aria-label="搜索单词" value="${esc(search)}"></label>`:''}</div>
    ${mode==='scene'?sceneView():mode==='cards'?`<div class="lesson-banner"><div><strong>先认识一小组，再练这组词</strong><p>5 个词 · 最多 3 道找图题</p></div>${btn('开始小课堂','lesson-start','secondary')}</div>
    <div class="filter-row">${[['all','全部'],['new','未接触'],['learned','已巩固'],['favorites','已收藏']].map(([id,t])=>btn(t,`filter:${id}`,filter===id?'chip active':'chip')).join('')}
    <label class="check-label"><input id="chinese" type="checkbox" ${state.settings.showChinese?'checked':''}> 显示中文</label></div><div id="word-results" class="word-grid">${wordResults()}</div>`:mode==='sentences'?sentenceCard():quizView()}`;
}

function sentenceCard() {
  const w = category.words[index],
    parts = sentenceParts(w);
  const showAnswer = !sentenceHidden || sentenceFeedback !== null;
  return `<section class="reading panel sentence-card" aria-label="例句学习" tabindex="-1"><div class="reading-top"><span>${index + 1} / ${category.words.length}</span><span>把单词放进句子里</span></div>${img(w, 'reading-image')}<h2>${esc(w.zh)}</h2><div class="example sentence-example"><p>${esc(parts.before)}${showAnswer ? `<mark>${esc(parts.target)}</mark>` : '<span class="sentence-gap" aria-label="待补全单词">____</span>'}${esc(parts.after)}</p></div><div class="button-row sentence-controls">${btn(icon('sound') + '听例句', `sentence:${w.id}`, 'primary')}${showAnswer ? btn(icon('sound') + '听单词', `speak:${w.id}`, 'secondary') : ''}</div>${showAnswer ? `<p class="small muted">先听一遍，留意标出的关键词，再试着补全句子。</p>${sentenceFeedback !== null ? `<div class="feedback ${sentenceFeedback.correct ? 'good' : 'retry'}" role="status"><strong>${sentenceFeedback.correct ? '填对了！' : '再看一遍完整例句'}</strong><p>你填写的是：${esc(sentenceFeedback.typed)}</p></div>` : ''}${advancedPractice?btn(sentenceFeedback !== null ? '再练一次' : '隐藏关键词，做填空', 'sentence-try', 'secondary'):''}` : `<form id="sentence-form"><label for="sentence-answer">补全句子里的英文关键词</label><div class="spell-input"><input id="sentence-answer" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="done" maxlength="100" placeholder="写出图里的英文"><button class="primary">检查答案</button></div></form>`}<p class="small muted">先听句子，再指一指图里的物品。进阶填空每词本轮只记分一次。</p><div class="reading-nav">${btn('上一个', 'previous', 'secondary', index === 0 ? 'disabled' : '')}${btn('下一个', 'next', 'secondary', index === category.words.length - 1 ? 'disabled' : '')}</div></section>`;
}
let pendingQuiz=null;
function startQuiz(pool, type = 'listen', source = 'theme', config = {}) {
  if(!config.replace && resumablePractice()){
    pendingQuiz=()=>startQuiz(pool,type,source,{...config,replace:true});
    modal.innerHTML=`<h2>上次练习还在</h2><p>继续上次，或换一组新的。已经记录的练习不会清除。</p><div class="button-row">${btn('继续上次','keep-quiz','primary')}${btn('开始新的','replace-quiz','secondary')}</div>`;modal.showModal();return;
  }
  if(type==='spell'&&!advancedPractice){nav('parent');return;}
  stopMedia();
  if (!pool.length) {
    toast('这里暂时没有可练习的单词');
    return;
  }
  correction=null;
  session = {
    queue: studyQueue(
      state,
      pool,
      Date.now(),
      Math.min(source === 'daily' ? dailyRoundSize(state) : config.lessonIds ? 3 : 10, pool.length),
    ),
    pool: config.lessonIds ? config.lessonIds.map(id=>wordMap.get(id)) : pool,
    lessonIds: config.lessonIds || null,
    position: 0,
    correct: 0,
    answered: false,
    type,
    source,
    retryOnly:config.retryOnly===true,
    sceneId: category?.sceneId || null,
    sceneScroll: category?.sceneId ? sceneReturnScroll : 0,
    options: [],
    results: [],
  };
  if (!category || category.id === 'session') {
    page = 'review';
    category = {
      id: 'session',
      name:
        source === 'daily'
          ? '今日学习'
          : source === 'due'
            ? '到期复习'
            : source === 'retry'
              ? '错题再练'
              : '收藏练习',
      en: 'A LITTLE PRACTICE',
      description: '每一步，都是新进步',
      words: pool,
      practiceSource: source,
    };
  }
  mode = type;
  prepareQuestion();
  persistSession();
  render();
  scrollToStudy();
  playQuestion();
}
function playQuestion() {
  if (mode === 'listen' && session && !session.answered && session.position < session.queue.length)
    speak(session.queue[session.position].id, true);
}
function prepareQuestion() {
  if (!session || session.answered || session.options.length || session.position >= session.queue.length)
    return;
  session.options = quizOptions(session.queue[session.position], session.lessonIds ? session.pool : category?.sceneId
    ? sceneMap.get(category.sceneId).wordIds.map(id => wordMap.get(id))
    : currentPool(), Math.random, !!(session.lessonIds || category?.sceneId));
}

function serializePractice(value=session){
  if(!value) return null;
  return {...value,version:1,queue:value.queue.map(w=>w.id),options:value.options.map(w=>w.id),
    pool:(value.pool||currentPool()).map(w=>w.id),categoryId:category?.id==='session'?null:category?.id};
}
function restorePractice(raw){
  if(!raw || (raw.type==='spell'&&!advancedPractice)) return null;
  try {
    let checked;
    if(Array.isArray(raw.queue)&&raw.position===raw.queue.length){
      const last=wordMap.get(raw.queue.at(-1));
      checked=validateSession({...raw,position:raw.queue.length-1,answered:true,
        options:raw.type==='listen'&&last?quizOptions(last,raw.pool.map(id=>wordMap.get(id)),Math.random,!!(raw.lessonIds||raw.sceneId)).map(w=>w.id):[]});
      checked.position=raw.queue.length;checked.options=[];
    } else checked=validateSession(raw);
    return {...checked,queue:checked.queue.map(id=>wordMap.get(id)),options:checked.options.map(id=>wordMap.get(id)),pool:checked.pool.map(id=>wordMap.get(id))};
  } catch{return null;}
}
function practiceKey(raw=serializePractice()){
  if(!raw) return '';
  const context=raw.sceneId?'scene:'+raw.sceneId:raw.categoryId?'theme:'+raw.categoryId:'session:'+raw.source;
  return context+':'+(raw.lessonIds?raw.lessonIds.join(',')+':':'')+raw.type;
}
function persistSession(){
  if(!session) return;
  try {
    const raw=serializePractice(),key=practiceKey(raw);
    if(raw.type==='spell'){
      savedSpelling=raw.position<raw.queue.length?validateSession(raw):null;
      if(savedSpelling)localStorage.setItem(SPELLING_DRAFT_KEY,JSON.stringify(savedSpelling));else localStorage.removeItem(SPELLING_DRAFT_KEY);
    }
    drafts.delete(key);drafts.set(key,raw);
    while(drafts.size>10) drafts.delete(drafts.keys().next().value);
    sessionStorage.setItem(DRAFT_KEY,JSON.stringify([...drafts]));
    const latest=[...drafts.values()].reverse().find(r=>r.position<r.queue.length&&restorePractice(r));
    savedSession=latest?validateSession(latest):null;
    if(savedSession) localStorage.setItem(SESSION_KEY,JSON.stringify(savedSession));
    else localStorage.removeItem(SESSION_KEY);
  } catch{toast('练习暂存失败，请检查浏览器存储');}
}
function rememberPractice(){saveDialogueDraft();if(session) persistSession();}
function resumablePractice(){
  for(const raw of [savedSession,...[...drafts.values()].reverse(),savedSpelling]){
    if(!raw||(raw.type==='spell'&&!advancedPractice)||raw.position>=raw.queue.length)continue;
    try{return validateSession(raw);}catch{}
  }
  return null;
}
function resumeSession(r=resumablePractice()){
  if(!r) return;
  if(r.type==='spell'&&!advancedPractice){toast('请家长先开启进阶练习，再继续拼写。');nav('parent');return;}
  stopMedia();
  category=r.sceneId?sceneCategory(r.sceneId):categoryMap.get(r.categoryId)||{
    id:'session',name:'继续上次练习',en:'KEEP GROWING',description:'接着上次的小冒险',practiceSource:r.source,words:r.pool.map(id=>wordMap.get(id))};
  session=restorePractice(r);if(!session) return;
  if(r.lessonIds){activeLesson={ids:r.lessonIds,sceneId:r.sceneId,categoryId:categoryMap.has(r.categoryId)?r.categoryId:null,completed:false};saveLesson();}
  page='themes';mode=r.type;sceneReturnScroll=r.sceneScroll||0;
  render();scrollToStudy();playQuestion();
}

function scrollToStudy() {
  requestAnimationFrame(() => {
    const node = document.querySelector('.quiz,.quiz-intro,.reading');
    if (node) {
      node.setAttribute('tabindex', '-1');
      node.focus({ preventScroll: true });
      node.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  });
}
function quizView() {
  if (!session)
    return `<section class="quiz-intro panel"><span class="intro-emoji">${mode === 'spell' ? '✏️' : '🎧'}</span><h2>${mode === 'spell' ? '看图写单词' : '听听看，是哪一位朋友？'}</h2><p>每轮最多 10 题，优先复习到期词。答错也没关系，会给你提示。</p>${btn('开始练习 ' + icon('arrow'), 'begin')}</section>`;
  if (session.position >= session.queue.length) {
    if(session.lessonIds) return `<section class="quiz-intro panel lesson-complete"><span class="intro-emoji">🌱</span><h2>这组词，又熟悉一点了！</h2>
      <p>本组 ${session.lessonIds.length} 个词 · 完成 ${session.queue.length} 题 · 答对 ${session.correct} 题</p>${roundSummary()}
      <div class="button-row">${btn(dailyPlan(state).remaining?'下一小组':'去生活里找一找',dailyPlan(state).remaining?'lesson-next':'scene-list')}${session.results.some(r=>!r.correct)?btn('再练错题','retry','secondary'):''}${btn('再听这组词','lesson-resume','secondary')}${btn('回到首页','home','text-button')}</div></section>`;
    return `<section class="quiz-intro panel ${perfectListeningRound(session)?'perfect-round':''}"><span class="intro-emoji">${perfectListeningRound(session)?'✦':'🌟'}</span><span class="eyebrow">LITTLE STEPS, BIG DISCOVERIES</span><h2>${perfectListeningRound(session)?'10 题全对，太棒了！':'又长出了一片新叶子！'}</h2><p>完成 ${session.queue.length} 题 · 答对 ${session.correct} 题</p><div class="result-score">${Math.round((session.correct / session.queue.length) * 100)}<small>%</small></div>${roundSummary()}${btn('回到首页 ' + icon('arrow'), 'home')}${session.results.some((r) => !r.correct) ? btn('再练错题', 'retry', 'secondary') : ''}${btn('再练一轮', 'begin', 'secondary')}</section>`;
  }
  prepareQuestion();
  const w = session.queue[session.position];
  if(mode==='listen') return listeningQuestion(w);
  return `<section class="quiz panel"><div class="quiz-top"><span>第 ${session.position + 1} / ${session.queue.length} 题</span><span>已答对 ${session.correct} 题</span></div><div class="category-progress"><span style="width:${(session.position / session.queue.length) * 100}%"></span></div><h2>${mode === 'spell' ? '看图，写出它的英文' : '听声音，选择对应的图'}</h2>${btn(icon('sound') + '播放单词', `speak:${w.id}`, 'sound-button')}${mode === 'spell' ? `${img(w, 'spell-image')}<form id="spell-form"><label for="spelling">英文单词</label><div class="spell-input"><input id="spelling" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" enterkeyhint="done" maxlength="100" value="${session.answered && !correction ? esc(session.typed || '') : ''}" placeholder="输入你想到的单词" ${session.answered && !correction ? 'disabled' : ''}><button class="primary" ${session.answered && !correction ? 'disabled' : ''}>检查答案</button></div></form>` : `<div class="quiz-options">${session.options.map((o) => `<button data-action="${session.answered ? 'speak' : 'answer'}:${o.id}" aria-label="${session.answered ? '播放 ' + o.word : '选项 ' + (session.options.indexOf(o) + 1)}" class="quiz-option ${session.answered ? (o.id === w.id ? 'correct' : o.id === session.chosen ? 'incorrect' : '') : ''}">${img(o, '', o.zh)}${session.answered ? `<span>${o.word} · ${o.zh} ${icon('sound')}</span>` : ''}</button>`).join('')}</div>`}<div class="feedback ${mode === 'listen' ? 'listening-feedback' : ''} ${session.answered ? (session.lastCorrect ? 'good' : 'retry') : ''}" role="status">${session.answered ? `<strong>${mode === 'listen' ? (session.lastCorrect ? (session.position + 1 === session.queue.length ? (state.settings.autoNext ? '答对了，即将显示本轮结果…' : '答对啦！看看本轮收获吧。') : (state.settings.autoNext ? '答对了，即将进入下一题…' : '答对啦！准备好了再下一题。')) : '再听一听，看看正确答案') : session.lastCorrect ? '答对啦，真棒！' : '再认识一下这位朋友'}</strong><p>${w.word} · ${w.zh}${mode === 'spell' && session.typed ? `<br>你输入的是：${esc(session.typed)}` : ''}</p>${!session.lastCorrect&&!correction?.solved?btn('再试一次','retry-word','secondary'):''}${btn(session.position + 1 === session.queue.length ? '查看本轮收获 ' + icon('arrow') : '下一题 ' + icon('arrow'), 'continue')}` : (mode==='spell'?'<span>看图写单词，也可以点播放听一听。</span>':'<span>听单词后选图，没听清可以重播。</span>')}</div></section>`;
}

function listeningQuestion(w){
  const answered=session.answered, final=session.position+1===session.queue.length, correcting=correction&&!correction.solved;
  const feedback=answered?`<div class="listening-answer"><strong>${correction?.solved?'这次找对啦！':session.lastCorrect?'答对啦！':correcting?'再听一遍，试试看':'正确答案'}</strong><p>${correcting?'这次不计分，听清楚再选。':esc(w.word)+' · '+esc(w.zh)}</p></div><div class="answer-actions">${!session.lastCorrect&&!correction?.solved?btn('再试一次','retry-word','secondary'):''}${btn(final?'看结果':'下一题 '+icon('arrow'),'continue','primary')}</div>`:'<span class="listening-hint">点图选答案，没听清可以重听。</span>';
  return `<section class="quiz panel listening-quiz" aria-label="听音选图练习"><div class="quiz-top"><span>第 ${session.position+1} / ${session.queue.length} 题</span><span>首次答对 ${session.correct} 题</span></div><div class="category-progress"><span style="width:${session.position/session.queue.length*100}%"></span></div><div class="listening-prompt"><h2>听一听，选图片</h2>${btn(icon('sound')+'再听一遍','speak:'+w.id,'sound-button')}</div><div class="quiz-options">${session.options.map((o,i)=>`<button data-action="${correcting?'correction-answer':answered?'speak':'answer'}:${o.id}" aria-label="${answered&&!correcting?'播放 '+esc(o.word):'选项 '+(i+1)}" class="quiz-option ${correcting?(o.id===correction.chosen?'incorrect':''):answered?(o.id===w.id?'correct':o.id===session.chosen?'incorrect':''):''}">${img(o,'',o.zh)}<span class="quiz-option-label" ${answered&&!correcting?'':'aria-hidden="true"'}>${esc(o.word)} · ${esc(o.zh)} ${icon('sound')}</span></button>`).join('')}</div><div class="feedback listening-feedback ${answered?(session.lastCorrect||correction?.solved?'good':'retry'):''}" role="status">${feedback}</div></section>`;
}
function updateQuiz(){
  const old=document.querySelector('.quiz,.quiz-intro');
  if(!old){render();return;}
  const host=document.createElement('div');host.innerHTML=quizView();old.replaceWith(host.firstElementChild);preloadNearby();
  const focus=document.querySelector(session?.answered?'.quiz .feedback':'.quiz,.quiz-intro');
  focus?.setAttribute('tabindex','-1');focus?.focus({preventScroll:true});
}
function continueQuestion(){
  correction=null;
  if(!session?.answered) return;
  stopMedia();clearTimeout(toastTimer);$('#toast').classList.remove('visible');
  session.position++;session.answered=false;session.options=[];
  if(session.position<session.queue.length) prepareQuestion();
  else if(session.lessonIds&&activeLesson){activeLesson.completed=true;saveLesson();}
  persistSession();updateQuiz();queueViewSave();playQuestion();
  if(perfectListeningRound(session)) celebratePerfectRound();
}

function clearFireworks(){
  clearTimeout(fireworksTimer);
  stopFireworkSound();
  document.querySelector('.orange-fireworks')?.remove();
}
function stopFireworkSound(){
  document.querySelectorAll('audio.fireworks-audio').forEach(clip=>{clip.pause();clip.remove();});
}
function playFireworkSound(){
  const clip=cachedAudio('fireworks');
  clip.className='fireworks-audio';clip.hidden=true;clip.volume=.25;
  clip.currentTime=0;clip.playbackRate=1;
  clip.onended=()=>clip.remove();
  document.body.append(clip);
  clip.play().catch(()=>clip.remove());
}
function celebratePerfectRound(){
  clearFireworks();
  if(document.hidden) return;
  playFireworkSound();
  fireworksTimer=setTimeout(clearFireworks,3800);
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer=document.createElement('div');
  layer.className='orange-fireworks';layer.setAttribute('aria-hidden','true');
  const colors=['#ff8a1c','#ffb347','#ef6c16','#ffd08a'];
  const bursts=[[22,32,0],[78,30,450],[50,48,950],[22,60,1450],[80,58,1900]];
  for(const [x,y,delay] of bursts){
    const burst=document.createElement('div');
    burst.className='firework-burst';
    burst.style.cssText=`left:${x}%;top:${y}%;--delay:${delay}ms`;
    for(let i=0;i<20;i++){
      const angle=i*Math.PI*2/20,radius=i%2?82:110;
      const spark=document.createElement('i');spark.className='firework-spark';
      spark.style.cssText=`--dx:${Math.round(Math.cos(angle)*radius)}px;--dy:${Math.round(Math.sin(angle)*radius)}px;--spark:${colors[i%colors.length]};--angle:${angle}rad;--spark-delay:${delay+400}ms`;
      burst.append(spark);
    }
    layer.append(burst);
  }
  document.body.append(layer);
}

function scheduleAutoNext() {
  clearTimeout(autoNextTimer);
  if (
    !state.settings.autoNext ||
    mode !== 'listen' ||
    (audio && !audio.paused) ||
    !session?.answered ||
    !session.lastCorrect ||
    session.position >= session.queue.length ||
    modal.open ||
    document.hidden
  )
    return;
  const current = session,
    position = session.position;
  autoNextTimer = setTimeout(() => {
    if (
      session === current &&
      session.position === position &&
      mode === 'listen' &&
      session.answered &&
      session.lastCorrect &&
      !modal.open &&
      !document.hidden
    )
      continueQuestion();
  }, 1500);
}
modal.addEventListener('close', scheduleAutoNext);
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMedia();clearFireworks();}else scheduleAutoNext();});
function submitAnswer(id, typed) {
  correction=null;
  if (!session || session.answered) return;
  stopMedia();
  const w = session.queue[session.position],
    correct = typed !== undefined ? matchesSpelling(w, typed) : id === w.id;
  session.answered = true;
  session.chosen = id;
  session.typed = typed;
  session.lastCorrect = correct;
  session.correct += correct ? 1 : 0;
  session.results.push({ id: w.id, correct });
  if(recordPracticeAnswer(state,session,w.id,correct))save();
  persistSession();
  updateQuiz();
  queueViewSave();
  scheduleAutoNext();
  if (correct) toast('✓ 答对了，真棒！', 1800);
  if (mode === 'spell' && session.answered) {
    $('#spelling').value = typed;
    $('#spelling').blur();
  }
  if (mode === 'spell')
    requestAnimationFrame(() =>
      document.querySelector('.feedback')?.scrollIntoView({ block: 'nearest', behavior: 'instant' }),
    );
}
function settings() {
  if(!parentOpen){nav('parent');return;}
  modal.classList.remove('word-detail-dialog');
  clearTimeout(autoNextTimer);
  stopMedia();
  modal.innerHTML = `<div class="modal-title"><div><span class="eyebrow">MAKE IT YOURS</span><h2>按照你的节奏来</h2></div>${btn(icon('close'), 'close', 'icon-button', 'aria-label="关闭设置"')}</div><label class="setting-row">每日练习目标<select id="goal">${[5, 10, 15, 20].map((n) => `<option ${state.settings.goal === n ? 'selected' : ''} value="${n}">${n} 次</option>`).join('')}</select></label><label class="setting-row">英语播放速度<select id="rate">${[
    [0.7, '慢一点'],
    [0.85, '自然慢速'],
    [1, '正常速度'],
  ]
    .map(([v, t]) => `<option value="${v}" ${state.settings.rate === v ? 'selected' : ''}>${t}</option>`)
    .join(
      '',
    )}</select></label><label class="setting-row"><span>答对后自动下一题<small>答对自动前进；答错停留；重听时等待播放结束</small></span><input id="auto-next" type="checkbox" ${state.settings.autoNext?'checked':''}></label><div class="settings-block"><h3>带着小叶子去旅行</h3><p>下载离线学习内容后，场景插图、单词、字母名和生活对话音频可断网使用；例句也使用预生成美音，可随完整离线内容下载。</p>${btn('下载 / 更新离线内容', 'offline', 'secondary', 'id="offline-btn"')}<p id="offline-status" role="status"></p><p class="small">手机浏览器菜单可尝试“添加到主屏幕”；安装支持由浏览器决定。</p></div><div class="settings-block"><h3>把成长好好收藏</h3><p>学习进度保存在当前浏览器，不会自动同步。建议定期备份，或用备份换设备。</p><div class="button-row">${btn('导出进度备份', 'export', 'secondary')}<label class="secondary import-label">合并导入备份<input id="import-file" type="file" accept="application/json,.json"></label></div><p class="small">导入按单词保留较新记录，每日次数取较大值，收藏合并。当前学习设置不变。</p></div><div class="settings-block attribution"><p>原创双语词库 · 插图：原创 SVG、<a href="https://github.com/microsoft/fluentui-emoji" target="_blank" rel="noopener">Fluent Emoji</a>（MIT）与 <a href="https://github.com/jdecked/twemoji" target="_blank" rel="noopener">Twemoji</a>（CC BY 4.0）<br>不含广告，无需账号。无需麦克风。<br>词库 ${words.length} 词 · ${categories.length} 主题 · 13 场景 · v3.0.0</p><a href="https://github.com/OylDeGit/little-leaf-english" target="_blank" rel="noopener">查看 GitHub 项目 ↗</a></div>`;
  modal.showModal();
}
async function offlineDownload() {
  const b = $('#offline-btn');
  b.disabled = true;
  const label = $('#offline-status');
  try {
    if (!('serviceWorker' in navigator)) throw Error('当前浏览器不支持离线缓存');
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(Error('离线服务尚未就绪，请刷新后重试')), 10000)),
    ]);
    const worker = reg.active;
    if (!worker) throw Error('离线服务正在启动，请稍后重试');
    const channel = new MessageChannel();
    channel.port1.onmessage = (e) => {
      label.textContent = e.data.error || `已缓存 ${e.data.done} / ${e.data.total} 项`;
      if (e.data.finished || e.data.error) {
        b.disabled = false;
        if (e.data.finished) {
          label.textContent =
            '✓ ' + words.length + ' 个单词、26 个字母名、13 个场景和 ' + dialogues.length + ' 组对话的离线内容已就绪。';
          localStorage.setItem('little-leaf:offline', String(words.length));
        }
        channel.port1.close();
      }
    };
    worker.postMessage({ type: 'DOWNLOAD' }, [channel.port2]);
  } catch (e) {
    label.textContent = e.message;
    b.disabled = false;
  }
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  const play = b.dataset.action.startsWith('speak:');
  e.preventDefault();
  const [a,id]=b.dataset.action.split(':');
  const navigating=['home','nav','scene-list','theme-list','theme-view','scene','category','mode','begin','daily','due','favorites','resume','back-study','scene-example','lesson-start','lesson-group','lesson-today','lesson-resume','lesson-practice','lesson-next','retry'].includes(a);
  if(navigating){rememberPractice();syncView(false);}
  switch (a) {
    case 'parent-unlock': parentOpen=true;render();break;
    case 'advanced-toggle': advancedPractice=!advancedPractice;render();break;
    case 'keep-quiz': modal.close();pendingQuiz=null;resumeSession();break;
    case 'replace-quiz': {const start=pendingQuiz;pendingQuiz=null;modal.close();start?.();break;}
    case 'retry-word':
      if(!session?.answered||session.lastCorrect)break;
      correction={solved:false,chosen:null};updateQuiz();speak(session.queue[session.position].id);break;
    case 'correction-answer':
      if(!correction||correction.solved||!session?.answered||session.lastCorrect)break;
      correction.chosen=id;correction.solved=id===session.queue[session.position].id;
      updateQuiz();if(correction.solved)toast('这次找对啦！',1500);else speak(session.queue[session.position].id);break;
    case 'dialogue-open':
      dialogueLesson = dialogues.find((d) => d.id === id);
      dialoguePractice = dialogueDrafts[id] ? structuredClone(dialogueDrafts[id]) : null;
      dialogueCorrection=false;render();
      window.scrollTo(0, 0);
      break;
    case 'dialogue-chinese':
      dialogueChinese = !dialogueChinese;
      document.body.classList.toggle('hide-dialogue-chinese', !dialogueChinese);
      e.target.closest('[data-action]').textContent=dialogueChinese?'隐藏中文':'显示中文';
      e.target.closest('[data-action]').setAttribute('aria-pressed',String(dialogueChinese));
      break;
    case 'dialogue-play':
      speakDialogue(Number(id));
      break;
    case 'dialogue-read':
      saveDialogueDraft();dialoguePractice = null;
      render();
      window.scrollTo(0, 0);
      break;
    case 'dialogue-begin':
      if(!dialogueLesson)break;
      if(dialogueDrafts[dialogueLesson.id]&&dialogueDrafts[dialogueLesson.id].step<3){
        modal.innerHTML=`<h2>这段对话还没练完</h2><p>可以接着来，或重新开始本轮。</p><div class="button-row">${btn('继续本轮','dialogue-resume','primary')}${btn('重新开始','dialogue-new','secondary')}</div>`;modal.showModal();break;
      }
      beginDialogue();break;
    case 'dialogue-new': modal.close();beginDialogue();break;
    case 'dialogue-resume': modal.close();dialoguePractice=structuredClone(dialogueDrafts[dialogueLesson.id]);dialogueCorrection=false;render();break;
    case 'dialogue-retry': {
      const steps=dialoguePractice?.results.filter(r=>!r.correct).map(r=>r.step)||[];
      if(steps.length)beginDialogue(steps,true);break;
    }
    case 'dialogue-correct': dialogueCorrection=true;render();speakDialogue(dialoguePractice.step*2+1);break;
    case 'dialogue-answer': {
      const practice=dialoguePractice,choice=Number(id);
      if(!practice||!practice.options[choice]||(practice.answered&&!dialogueCorrection))break;
      const right=practice.options[choice].en===dialogueLesson.lines[practice.step*2+1].en;
      if(dialogueCorrection){if(right){dialogueCorrection=false;toast('这次回应得很合适！');render();}else toast('听听正确回应，再试试看。');break;}
      practice.chosen=choice;practice.answered=true;practice.results.push({step:practice.step,correct:right});
      practice.correct=practice.results.filter(r=>r.correct).length;
      saveDialogueDraft();render();break;
    }
    case 'dialogue-next':
      if(!dialoguePractice?.answered)break;
      dialogueCorrection=false;
      dialoguePractice.position++;
      dialoguePractice.step=dialoguePractice.position>=dialoguePractice.steps.length?3:dialoguePractice.steps[dialoguePractice.position];
      if(dialoguePractice.step<3)prepareDialogueStep();
      else if(!dialoguePractice.retryOnly){
        const old=state.dialogueCompletions[dialogueLesson.id];
        state.dialogueCompletions[dialogueLesson.id]={completedAt:Date.now(),bestCorrect:Math.max(old?.bestCorrect||0,dialoguePractice.correct)};
        state.updatedAt=Date.now();save();
      }
      saveDialogueDraft();render();window.scrollTo(0,0);
      if(dialoguePractice.step<3)speakDialogue(dialoguePractice.step*2);break;
    case 'resume-spelling':
      resumeSession(savedSpelling);break;
    case 'resume':
      resumeSession();
      break;
    case 'more':
      appendWordResults(false);
      break;
    case 'more-global':
      appendWordResults(true);
      break;
    case 'retry': {
      const pool = session.results.filter((r) => !r.correct).map((r) => wordMap.get(r.id));
      const lessonIds=session.lessonIds;
      startQuiz(pool,mode,'retry',{lessonIds,retryOnly:true});
      break;
    }
    case 'sentence':
      speakSentence(id);
      break;
    case 'home':
      nav('home');
      break;
    case 'nav':
      nav(id);
      break;
    case 'theme-list':
      themeView='topics';nav('themes');break;
    case 'scene-list':
      themeView = 'scenes';
      nav('themes');
      break;
    case 'theme-view':
      themeView = id;
      render();
      break;
    case 'scene':
      openScene(id);
      break;

    case 'scene-word':
      selectedSceneWord=id;sceneReturnScroll=window.scrollY;updateSceneSelection();speak(id);
      break;
    case 'scene-dismiss':
      selectedSceneWord=null;updateSceneSelection();
      break;
    case 'scene-details':
      openWordDetails(id);
      break;
    case 'scene-example':
      if(modal.open) modal.close();
      stopMedia();mode='sentences';index=category.words.findIndex(w=>w.id===id);
      sentenceHidden=false;sentenceFeedback=null;sentenceRecorded=new Set();session=null;
      render();scrollToStudy();
      break;
    case 'back-study':
      returnToBrowse();
      break;
    case 'category':
      openCategory(id);
      break;

    case 'settings':
      settings();
      break;
    case 'close':
      modal.close();
      break;
    case 'speak':
      speak(id);
      break;

    case 'favorite':
      state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];
      state.updatedAt=Date.now();save();updateFavorite(id);
      break;
    case 'mode': {
      if(id==='spell'&&!advancedPractice) break;
      if(mode===id) break;
      stopMedia();
      const raw={categoryId:category?.id==='session'?null:category?.id,sceneId:category?.sceneId,source:category?.sceneId?'scene':category?.practiceSource||'theme',type:id};
      if(category?.sceneId) category=sceneCategory(category.sceneId);
      session=['listen','spell'].includes(id)?restorePractice(drafts.get(practiceKey(raw))):null;
      mode=id;sentenceHidden=false;sentenceFeedback=null;
      if(id!=='sentences') index=0;
      render();if(['listen','spell','sentences'].includes(id)) scrollToStudy();
      break;
    }

    case 'filter':
      shown = 8;
      filter = id;
      render();
      break;
    case 'previous':
      turnSentence(-1);
      break;
    case 'next':
      turnSentence(1);
      break;
    case 'sentence-try':
      if (mode !== 'sentences' || !category || !advancedPractice) break;
      sentenceHidden = true;
      sentenceFeedback = null;
      render();
      $('#sentence-answer')?.focus();
      break;
    case 'begin':
      startQuiz(currentPool(), mode === 'spell' ? 'spell' : 'listen', category?.sceneId ? 'scene' : category?.practiceSource || 'theme');
      break;

    case 'lesson-start':
      beginLesson(visibleWords());
      break;
    case 'lesson-group': {
      const group=sceneMap.get(category.sceneId).groups[Number(id)];
      beginLesson([...new Set(group.items.map(i=>i.wordId))].map(id=>wordMap.get(id)));
      break;
    }
    case 'lesson-today': {
      const pool=lessonTopicPool(state);
      if(!pool.length){nav('themes');break;}
      category=categoryMap.get(pool[0].category);
      beginLesson(pool);
      break;
    }
    case 'lesson-resume':
      resumeLesson();
      break;
    case 'lesson-practice':
      if(activeLesson) startQuiz(activeLesson.ids.map(id=>wordMap.get(id)),'listen','lesson',{lessonIds:activeLesson.ids});
      break;
    case 'lesson-next':
      if(activeLesson){
        const pool=activeLesson.sceneId?sceneMap.get(activeLesson.sceneId).wordIds.map(id=>wordMap.get(id)):categoryMap.get(activeLesson.categoryId)?.words||words;
        const remaining=pool.filter(w=>!activeLesson.ids.includes(w.id));
        beginLesson(remaining.length?remaining:pool);
      }
      break;
    case 'daily':
      category = null;
      startQuiz(words, 'listen', 'daily');
      window.scrollTo(0, 0);
      break;
    case 'due':
      startQuiz(dueWords(state, words), 'listen', 'due');
      break;
    case 'favorites':
      startQuiz(
        state.favorites.map((id) => wordMap.get(id)),
        'listen',
        'favorites',
      );
      break;
    case 'answer':
      submitAnswer(id);
      break;
    case 'continue':
      continueQuestion();
      break;
    case 'export': {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }),
        url = URL.createObjectURL(blob),
        a = document.createElement('a');
      a.href = url;
      a.download = `little-leaf-backup-${dayKey()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('备份已导出，请妥善保存');
      break;
    }
    case 'offline':
      offlineDownload();
      break;
  }
  if(navigating) { if(restoringView) requestAnimationFrame(()=>syncView(true)); else syncView(true); } else queueViewSave();
});
document.addEventListener('input', (e) => {
  if(e.isComposing) return;
  if (e.target.id === 'all-search') {
    allSearch = e.target.value;
    shown = 8;
    $('#all-results').innerHTML = allSearch.trim()
      ? globalResults()
      : `<div class="category-grid">${categories.map(categoryCard).join('')}</div>`;
  }
  if (e.target.id === 'search') {
    search = e.target.value;
    shown = 8;
    $('#word-results').innerHTML = wordResults();
  }
  queueViewSave();
});
document.addEventListener('compositionend',e=>e.target.dispatchEvent(new Event('input',{bubbles:true})));
document.addEventListener('change', async (e) => {
  if (e.target.id === 'chinese') {
    state.settings.showChinese=e.target.checked;save();
    document.body.classList.toggle('hide-translations',!state.settings.showChinese);
  }
  if(e.target.id==='auto-next'){state.settings.autoNext=e.target.checked;save();scheduleAutoNext();}
  if (e.target.id === 'goal' || e.target.id === 'rate') {
    state.settings[e.target.id]=Number(e.target.value);
    if(audio) audio.playbackRate=state.settings.rate;
    save();
  }
  if (e.target.id === 'import-file') {
    const f = e.target.files[0];
    if (!f) return;
    try {
      if (f.size > 2000000) throw Error('备份文件过大');
      const merged = mergeBackup(state, JSON.parse(await f.text()));
      localStorage.setItem(KEY, JSON.stringify(merged));
      state = merged;
      render();
      toast('备份已合并，原有较新进度已保留');
    } catch (err) {
      toast('导入失败：' + (err.message || '文件格式不正确'));
    }
    e.target.value = '';
  }
});
document.addEventListener('submit', (e) => {
  if (e.target.id === 'spell-form') {
    e.preventDefault();
    const input = $('#spelling').value;
    if (!input.trim()) return toast('先试着输入一个单词吧');
    if(correction){if(correction.solved)return;correction.solved=matchesSpelling(session.queue[session.position],input);updateQuiz();toast(correction.solved?'这次写对啦！':'再听一听正确发音');return;}
    submitAnswer(null, input);
  }
});
window.addEventListener('pagehide', () => {
  saveDialogueDraft();
  syncView(false);
  persistSession();
  stopMedia();
});
if ('serviceWorker' in navigator)
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
initNavigation();

function turnSentence(delta) {
  if (!category || mode !== 'sentences') return;
  stopMedia();
  index = Math.max(0, Math.min(category.words.length - 1, index + delta));
  sentenceHidden = false;
  sentenceFeedback = null;
  render();
  scrollToStudy();
}
async function speakSentence(id) {
  stopMedia();const token=playToken,clip=cachedAudio('sentence-'+id);
  if(!clip)return toast('例句音频暂不可用，请稍后重试。');
  audio=clip;clip.currentTime=0;clip.playbackRate=state.settings.rate;clip.preservesPitch=true;
  clip.onended=()=>{if(token===playToken)audio=null;};
  try{await clip.play();}catch(error){if(token===playToken&&error.name!=='AbortError'){audio=null;toast('请点一下重试，或请家长下载离线内容。');}}
}

let touchStart = null;
document.addEventListener(
  'touchstart',
  (e) => {
    if (mode !== 'sentences' || !e.target.closest('.reading') || e.target.closest('button,a,audio,input'))
      return;
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  },
  { passive: true },
);
document.addEventListener(
  'touchend',
  (e) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x,
      dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) turnSentence(dx < 0 ? 1 : -1);
  },
  { passive: true },
);
document.addEventListener('keydown', (e) => {
  if (modal.open || e.target.closest('input,select,textarea,[contenteditable]')) return;
  if (mode === 'sentences' && category && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
    turnSentence(e.key === 'ArrowRight' ? 1 : -1);
  }
});
function keyboardLayout() {
  const input = document.activeElement?.matches('input,textarea');
  const height = window.visualViewport?.height || window.innerHeight;
  document.body.classList.toggle('keyboard-open', !!input && height < window.innerHeight - 120);
}
window.visualViewport?.addEventListener('resize', keyboardLayout);
document.addEventListener('focusin', keyboardLayout);
document.addEventListener('focusout', () => document.body.classList.remove('keyboard-open'));

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'sentence-form') return;
  event.preventDefault();
  if (mode !== 'sentences' || !category || sentenceFeedback !== null) return;
  const typed = $('#sentence-answer').value.trim();
  if (!typed) {
    toast('先填一个单词，再检查答案');
    return;
  }
  const w = category.words[index],
    correct = matchesSpelling(w, typed);
  sentenceFeedback = { typed, correct };
  if (!sentenceRecorded.has(w.id)) {
    sentenceRecorded.add(w.id);
    answer(state, w.id, correct);
    save();
  }
  render();
});

function dialogueView(){
 if(!dialogueLesson)return `${heading('LITTLE TALKS, REAL LIFE','生活里的小对话','先听一句，再试着接下一句；稍后回来也能继续。')}<div class="dialogue-grid">${dialogues.map(d=>`<button class="dialogue-topic panel" data-action="dialogue-open:${d.id}"><span class="dialogue-emoji" aria-hidden="true">${d.emoji}</span><small>${d.group}</small><h2>${esc(d.title)}</h2><p>${esc(d.lines[0].role)} ↔ ${esc(d.lines[1].role)}</p><span>${dialogueDrafts[d.id]?.step<3?'继续第 '+(dialogueDrafts[d.id].position+1)+' 轮':state.dialogueCompletions[d.id]?'已完成 · 最佳 '+state.dialogueCompletions[d.id].bestCorrect+'/3':'听对话，再试着回应 →'}</span></button>`).join('')}</div><p class="small muted">对话完成记录会保存在本机；对话不计入单词打卡次数。</p>`;
 const d=dialogueLesson,p=dialoguePractice,controls=`<div class="dialogue-toolbar">${btn('← 全部对话','nav:dialogues','text-button')}${btn(dialogueChinese?'隐藏中文':'显示中文','dialogue-chinese','secondary',`aria-pressed="${dialogueChinese}"`)}</div>`;
 if(!p)return `${controls}${heading(d.group,d.title,'点击每句话听发音，然后试着接下一句。')}<section class="dialogue-transcript" aria-label="完整对话">${d.lines.map((line,i)=>`<button class="dialogue-line panel ${i%2?'guest':''}" data-action="dialogue-play:${i}" aria-label="播放第 ${i+1} 句：${esc(line.en)}"><small>${esc(line.role)} ${icon('sound')}</small><strong>${esc(line.en)}</strong><span data-dialogue-translation>${esc(line.zh)}</span></button>`).join('')}</section><div class="dialogue-start">${btn(dialogueDrafts[d.id]?.step<3?'继续本轮回应':'试着回应 · 3 小题','dialogue-begin','primary')}</div>`;
 if(p.step>=3)return `${controls}<section class="panel dialogue-result"><span class="intro-emoji">🌟</span><h1>这段对话，练完啦！</h1><p>首次答对 ${p.correct} / ${p.steps.length} 题</p><p>可以再听完整对话，模仿说出每一句。</p><div class="button-row">${btn('再听完整对话','dialogue-read','primary')}${btn('重练回应','dialogue-begin','secondary')}${p.results.some(r=>!r.correct)?btn('只练答错的回应','dialogue-retry','secondary'):''}</div></section>`;
 const prompt=d.lines[p.step*2],reply=d.lines[p.step*2+1];
 return `${controls}<section class="panel dialogue-exercise"><div class="quiz-top"><span>第 ${p.position+1} / ${p.steps.length} 题</span><span>你来扮演：${esc(reply.role)}</span></div><p class="eyebrow">${esc(d.group)} · ${esc(d.title)}</p><h1>接下来，你会怎么说？</h1>${btn('先听完整对话','dialogue-read','text-button')}<button class="dialogue-line" data-action="dialogue-play:${p.step*2}"><small>${esc(prompt.role)} ${icon('sound')}</small><strong>${esc(prompt.en)}</strong><span data-dialogue-translation>${esc(prompt.zh)}</span></button><div class="dialogue-options">${p.options.map((o,i)=>`<button class="secondary dialogue-choice ${p.answered&&!dialogueCorrection?(o.en===reply.en?'right':i===p.chosen?'wrong':''):''}" data-action="dialogue-answer:${i}" ${p.answered&&!dialogueCorrection?'disabled':''}><strong>${esc(o.en)}</strong><span data-dialogue-translation>${esc(o.zh)}</span></button>`).join('')}</div>${p.answered?`<div class="feedback ${p.options[p.chosen]?.en===reply.en?'good':'retry'}" role="status"><strong>${p.options[p.chosen]?.en===reply.en?'回应得很合适！':'这时可以这样回应'}</strong><p>${esc(reply.en)}<br>${esc(reply.zh)}</p>${btn(icon('sound')+'听正确回应',`dialogue-play:${p.step*2+1}`,'secondary')}${p.options[p.chosen]?.en!==reply.en?btn('再试一次','dialogue-correct','text-button'):''}</div><div class="dialogue-next">${btn(p.position+1===p.steps.length?'查看本轮结果':'下一轮对话 →','dialogue-next','primary')}</div>`:'<p class="small muted">点击上方句子可重听，再选一个合适的回应。</p>'}</section>`;
}
function saveDialogueDraft(){
 if(!dialogueLesson||!dialoguePractice)return;
 const checked=validateDialogueRound(dialogueLesson.id,dialoguePractice);if(!checked)return;
 dialogueDrafts[dialogueLesson.id]=checked;
 try{localStorage.setItem(DIALOGUE_DRAFT_KEY,JSON.stringify(dialogueDrafts));}catch{toast('对话暂存失败，请检查浏览器存储。');}
}
function beginDialogue(steps=[0,1,2],retryOnly=false){
 dialogueCorrection=false;dialoguePractice={steps,position:0,step:steps[0],results:[],correct:0,retryOnly};
 prepareDialogueStep();saveDialogueDraft();render();window.scrollTo(0,0);speakDialogue(steps[0]*2);
}
async function speakDialogue(index) {
  const line = dialogueLesson?.lines[index];
  if (!line) return;
  stopMedia();
  const token = playToken,
    clip = new Audio(line.audio);
  audio = clip;
  clip.playbackRate = state.settings.rate;clip.preservesPitch=true;
  const node = document.querySelector(`.dialogue-line[data-action="dialogue-play:${index}"]`);
  try {
    await clip.play();
    if (token !== playToken) return;
    node?.classList.add('speaking');
    clip.addEventListener('ended', () => node?.classList.remove('speaking'), { once: true });
  } catch (error) {
    if (token === playToken && error.name !== 'AbortError') toast('请点句子重新播放，并检查设备音量');
  }
}
function prepareDialogueStep() {
  dialoguePractice.options = shuffle(dialogueLesson.lines[dialoguePractice.step * 2 + 1].options);
  dialoguePractice.answered = false;
  dialoguePractice.chosen = null;
}

function searchText(w) {
  return [w.word, w.zh, ...(w.variants || []), ...(w.searchAliases || [])].join(' ');
}
function sceneCategory(id, pool) {
  const scene = sceneMap.get(id);
  return { ...scene, id: `scene:${id}`, sceneId: id,
    words: (pool || scene.wordIds).map(id => wordMap.get(id)) };
}

function openCategory(id){
  stopMedia();
  const bookmark=browseViews.get('theme:'+id);if(bookmark) return restoreView(bookmark);
  category=categoryMap.get(id);page='themes';mode='cards';session=null;
  shown=8;index=0;search='';filter='all';selectedSceneWord=null;
  render();window.scrollTo(0,0);
}
function openScene(id,top=true){
  stopMedia();
  const bookmark=browseViews.get('scene:'+id);if(top&&bookmark) return restoreView(bookmark);
  category=sceneCategory(id);page='themes';themeView='scenes';mode='scene';
  session=null;selectedSceneWord=null;search='';filter='all';index=0;
  render();if(top) window.scrollTo(0,0);
}
function sceneCover(s,i){
  return `<button class="scene-cover" data-action="scene:${s.id}" style="--scene-tint:${s.color}">
    <div class="scene-cover-art">${s.wordIds.slice(0,3).map(id=>img(wordMap.get(id))).join('')}<span class="scene-cover-arrow">${icon('arrow')}</span></div>
    <div class="scene-cover-copy"><span class="eyebrow">${s.en}</span><h2>${s.name}</h2><span class="muted">${s.wordIds.length} 个词 · 点读与小课堂</span></div></button>`;
}
function sceneList(){return `<div class="scene-catalog">${scenes.map(sceneCover).join('')}</div>`;}


function sceneItem(item){
  const w=wordMap.get(item.wordId);
  return `<button class="scene-object ${selectedSceneWord===w.id?'is-selected':''}" data-action="scene-word:${w.id}" aria-label="播放 ${esc(w.word)}" aria-pressed="${selectedSceneWord===w.id}">
    ${img(w)}<strong>${esc(w.word)}</strong><span data-translation>${esc(item.label||w.zh)}</span><span class="scene-listen">${icon('sound')}</span></button>`;
}
function compactSelection(){
  const w=wordMap.get(selectedSceneWord);if(!w) return '';
  return `<div class="selected-word-bar" role="region" aria-label="选中词汇"><div><strong>${esc(w.word)}</strong><span data-translation>${esc(w.zh)}</span></div>
    ${btn(icon('sound'),`speak:${w.id}`,'icon-button',`aria-label="重听 ${esc(w.word)}"`)}
    ${btn('详情',`scene-details:${w.id}`,'secondary')}${btn(icon('close'),'scene-dismiss','icon-button','aria-label="关闭词条栏"')}</div>`;
}
function sceneView(){
  const scene=sceneMap.get(category.sceneId);
  return `<section class="scene-learning" aria-label="${esc(scene.name)}场景">
    <div class="scene-guide"><span>${icon('sound')} 点图听英文，想多了解时再点详情。</span><label class="check-label"><input id="chinese" type="checkbox" ${state.settings.showChinese?'checked':''}> 显示中文</label></div>
    <div class="scene-selection">${compactSelection()}</div>
    ${scene.id==='alphabet'?alphabetView():`<div class="scene-world scene-${scene.id}" style="--scene-tint:${scene.color}">
      ${scene.groups.map((g,i)=>`<section class="scene-zone zone-${i}"><div class="scene-zone-title"><h2>${g.name}</h2>${btn('学这一组',`lesson-group:${i}`,'text-button')}</div>
      <div class="scene-objects">${g.items.map(sceneItem).join('')}</div></section>`).join('')}</div>`}
    <p class="scene-footnote">点读会留下接触足迹；完成答题后计入练习与复习计划。</p></section>`;
}
function updateSceneSelection(){
  document.querySelectorAll('.scene-object').forEach(node=>{
    const selected=node.dataset.action==='scene-word:'+selectedSceneWord;
    node.classList.toggle('is-selected',selected);node.setAttribute('aria-pressed',String(selected));
  });
  const host=document.querySelector('.scene-selection');if(host) host.innerHTML=compactSelection();
}
function openWordDetails(id){
  const w=wordMap.get(id);if(!w) return;
  modal.classList.add('word-detail-dialog');
  modal.innerHTML=`<div class="modal-title"><h2>${esc(w.word)}</h2>${btn(icon('close'),'close','icon-button','aria-label="关闭词汇详情"')}</div>
    ${img(w,'detail-image')}<p data-translation>${esc(w.zh)}</p><p class="detail-sentence">${esc(w.sentence)}</p>
    <div class="button-row">${btn(icon('sound')+'再听一遍',`speak:${id}`,'primary')}
    ${btn(icon('star')+(state.favorites.includes(id)?'已收藏':'收藏'),`favorite:${id}`,'secondary',`aria-pressed="${state.favorites.includes(id)}"`)}
    ${btn('学例句',`scene-example:${id}`,'secondary')}</div>`;
  modal.showModal();
}

function alphabetView() {
  return `<p class="gentle-tip">点大小写字母听字母名，点插图听示例词。示例词用于认识字母。</p><div class="alphabet-grid">${alphabet.map(l => {
    const w = wordMap.get(l.wordId);
    return `<article class="alphabet-tile">${btn(`${l.upper}<small>${l.lower}</small>${icon('sound')}`, `speak:${l.audioId}`, 'letter-play', `aria-label="播放字母 ${l.upper} 的名称"`)}${sceneItem({wordId: w.id})}</article>`;
  }).join('')}</div>`;
}

function lessonContactCount(){return activeLesson?.ids.filter(hasContact).length||0;}
function saveLesson(){
  try{if(activeLesson) localStorage.setItem(LESSON_KEY,JSON.stringify(activeLesson));else localStorage.removeItem(LESSON_KEY);}catch{}
}
function beginLesson(pool){
  if(activeLesson&&!activeLesson.completed){resumeLesson();return;}
  if(!dailyPlan(state).remaining){toast('今天的 5 个词已安排好啦，点读和自由练习还可以继续。');return;}
  const previous=structuredClone(state),chosen=allocateLesson(state,pool);
  if(!chosen.length){toast('这组暂时没有新词或到期词，换个主题看看吧。');return;}
  if(!save()){state=previous;return;}
  stopMedia();activeLesson={ids:chosen.map(w=>w.id),sceneId:category?.sceneId||null,categoryId:categoryMap.has(category?.id)?category.id:null,completed:false};
  saveLesson();session=null;mode='lesson';page='themes';
  if(!category)category={id:'session',name:'今天的 '+chosen.length+' 词小课堂',en:'LITTLE WORDS',description:'认识一小组词，再一起找图。',words:chosen};
  render();window.scrollTo(0,0);
}
function resumeLesson(){
  if(!activeLesson) return;
  stopMedia();
  category=activeLesson.sceneId?sceneCategory(activeLesson.sceneId):categoryMap.get(activeLesson.categoryId)||{
    id:'session',name:'今天的小课堂',en:'FIVE LITTLE WORDS',description:'认识一小组词，再一起找图。',words:activeLesson.ids.map(id=>wordMap.get(id))};
  session=null;page='themes';mode='lesson';render();window.scrollTo(0,0);
}
function lessonView(){
  if(!activeLesson) return '';
  const count=Math.min(3,activeLesson.ids.length);
  return `<section class="lesson-learn"><p class="lesson-step">第一步 · 认识这 ${activeLesson.ids.length} 个词</p><h2>点图听一听，再玩同组找图</h2>
    <p>每次一小组，不着急。已点读 <strong id="lesson-contact-count">${lessonContactCount()}</strong> / ${activeLesson.ids.length} 个词。</p>
    <div class="word-grid lesson-word-grid">${activeLesson.ids.map(id=>wordCard(wordMap.get(id))).join('')}</div>
    <div class="lesson-practice-cta">${btn('开始同组找图（'+count+' 题） '+icon('arrow'),'lesson-practice')}<span>只练上面这组词，想多听几遍也可以。</span></div></section>`;
}
function updateFavorite(id){
  const on=state.favorites.includes(id),w=wordMap.get(id);
  document.querySelectorAll(`[data-action="favorite:${id}"]`).forEach(node=>{
    node.classList.toggle('on',on);node.setAttribute('aria-pressed',String(on));
    if(node.classList.contains('favorite')) node.setAttribute('aria-label',(on?'取消收藏':'收藏')+' '+w.word);
    else node.innerHTML=icon('star')+(on?'已收藏':'收藏');
  });
  if(!on&&filter==='favorites'&&mode==='cards') document.querySelectorAll(`#word-results .word-card[data-word-id="${id}"]`).forEach(n=>n.remove());
  if(!on) document.querySelectorAll(`.favorites-grid .word-card[data-word-id="${id}"]`).forEach(n=>n.remove());
  document.querySelectorAll('[data-favorites-count]').forEach(n=>n.textContent=state.favorites.length+' 个词');
  const favorites=document.querySelector('.favorites-grid');
  if(favorites&&!favorites.querySelector('.word-card')) favorites.innerHTML=empty('☆','收集你喜欢的单词','点击词卡右上角的星星，即可放进这里。');
  if(!state.favorites.length) document.querySelectorAll('[data-action="favorites"]').forEach(n=>n.remove());
  const results=document.querySelector('#word-results');
  if(results&&filter==='favorites'&&!results.querySelector('.word-card')) results.innerHTML=empty('☆','这里还没有收藏','换个筛选，发现喜欢的单词。');
}
function appendWordResults(global){
  const oldShown=shown;shown+=8;
  const list=global?words.filter(w=>(searchText(w)+' '+categoryMap.get(w.category).name).toLowerCase().includes(allSearch.trim().toLowerCase())):visibleWords();
  const host=global?$('#all-results'):$('#word-results'),grid=global?host.querySelector('.word-grid'):host,more=host.querySelector('.more-button');
  if(global) grid.insertAdjacentHTML('beforeend',list.slice(oldShown,shown).map(wordCard).join(''));
  else if(more) more.insertAdjacentHTML('beforebegin',list.slice(oldShown,shown).map(wordCard).join(''));
  if(shown>=list.length) more?.remove();
  if(global) host.querySelector('.search-count').textContent=`找到 ${list.length} 个单词，显示 ${Math.min(shown,list.length)} 个`;
}
function captureView(){
  return validateView({page,categoryId:category?.id,sceneId:category?.sceneId,mode,themeView,search,allSearch,filter,shown,index,
    scroll:window.scrollY,dialogueId:dialogueLesson?.id,selectedSceneWord,lesson:activeLesson,practice:serializePractice()});
}
function browseKey(view){
  if(!view) return '';
  if(view.sceneId) return 'scene:'+view.sceneId;
  if(view.categoryId&&view.categoryId!=='session') return 'theme:'+view.categoryId;
  if(view.page==='themes') return 'list:'+view.themeView;
  return view.page;
}
function syncView(push=false){
  if(!navigationReady||restoringView) return;
  clearTimeout(viewTimer);
  const view=captureView();if(!view) return;
  if(!category||['cards','scene'].includes(mode)) browseViews.set(browseKey(view),view);
  try{
    const depth=(history.state?.leafDepth||0)+(push?1:0);
    history[push?'pushState':'replaceState']({leaf:view,leafDepth:depth},'',routeFor(view));
    sessionStorage.setItem(VIEW_KEY,JSON.stringify(view));
    sessionStorage.setItem(VIEW_KEY+':browse',JSON.stringify([...browseViews]));
  }catch{}
}
function queueViewSave(){if(!restoringView){clearTimeout(viewTimer);viewTimer=setTimeout(()=>syncView(false),160);}}
function restoreView(input){
  saveDialogueDraft();
  const view=validateView(input);if(!view) return;
  restoringView=true;stopMedia();
  page=view.page;dialogueLesson=page==='dialogues'?dialogues.find(d=>d.id===view.dialogueId)||null:null;dialoguePractice=dialogueLesson?dialogueDrafts[dialogueLesson.id]||null:null;dialogueCorrection=false;if(!['parent','progress'].includes(page))parentOpen=false;themeView=view.themeView;mode=view.mode;search=view.search;allSearch=view.allSearch;
  filter=view.filter;shown=view.shown;selectedSceneWord=view.selectedSceneWord;
  if(view.lesson) activeLesson=view.lesson;
  if(mode==='spell'&&!advancedPractice)mode=view.sceneId?'scene':'cards';
  category=view.sceneId?sceneCategory(view.sceneId):categoryMap.get(view.categoryId)||null;
  let raw=view.practice;
  if(raw){
    const latest=drafts.get(practiceKey(raw));
    if(latest&&JSON.stringify(latest.queue)===JSON.stringify(raw.queue)&&latest.position>=raw.position) raw=latest;
  }
  session=restorePractice(raw);
  if(!category&&(session||mode==='lesson')) category={id:'session',name:mode==='lesson'?'今天的小课堂':'继续上次练习',
    en:'KEEP GROWING',description:'接着上次的小冒险',practiceSource:session?.source,words:session?.pool||activeLesson?.ids.map(id=>wordMap.get(id))||[]};
  if(!category&&mode!=='cards') mode='cards';
  index=Math.min(view.index,Math.max(0,(category?.words.length||1)-1));
  sentenceHidden=false;sentenceFeedback=null;sentenceRecorded=new Set();
  render();requestAnimationFrame(()=>{window.scrollTo(0,view.scroll);restoringView=false;});
}
function returnToBrowse(){
  stopMedia();
  const key=category?.sceneId?'scene:'+category.sceneId:category?.id&&category.id!=='session'?'theme:'+category.id:'home';
  const view=browseViews.get(key);if(view) return restoreView(view);
  if(category&&category.id!=='session'){session=null;mode=category.sceneId?'scene':'cards';render();window.scrollTo(0,sceneReturnScroll||0);}
  else nav('home');
}
function initNavigation(){
  let initial=null;
  try{initial=history.state?.leaf||(location.hash?parseRoute(location.hash):JSON.parse(sessionStorage.getItem(VIEW_KEY)||'null'));}catch{}
  navigationReady=true;
  if(initial&&validateView(initial)){
    restoreView(initial);requestAnimationFrame(()=>{restoringView=false;syncView(false);});
  }else{render();syncView(false);}
  window.addEventListener('popstate',event=>{rememberPractice();restoreView(event.state?.leaf||parseRoute(location.hash));});
  window.addEventListener('hashchange',()=>{if(routeFor(captureView())!==location.hash&&!restoringView) restoreView(parseRoute(location.hash));});
  window.addEventListener('scroll',queueViewSave,{passive:true});
}

function roundSummary(){
 const missed=session.results.filter(r=>!r.correct).map(r=>wordMap.get(r.id));
 const rewards=learningRewards(state);
 return `<div class="round-summary"><p>首次答对 ${session.correct} / ${session.queue.length} · 待巩固 ${missed.length} 个词</p>${missed.length?`<p>${missed.map(w=>esc(w.word)+' · '+esc(w.zh)).join('，')}</p>`:'<p>认真练习，真棒！</p>'}<p>⭐ ${rewards.stars} 颗星 · 今天认真练习 ${rewards.today} / 3 次</p>${btn('去看看小动物','nav:rewards','text-button')}<p class="small muted">复习会按计划安排，明天记得再看看旧朋友。</p></div>`;
}
