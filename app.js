import { dialogues } from './dialogues.js';
import { audioSources } from './media.js';
import { categories, words, wordMap, categoryMap, imagePath } from './data.js';
import {
  KEY,
  emptyState,
  validateBackup,
  mergeBackup,
  answer,
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
  if (raw) savedSession = validateSession(JSON.parse(raw));
} catch {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}
let shown = 24,
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
let toastTimer, autoNextTimer;
function toast(t, duration = 4000) {
  $('#toast').textContent = t;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), duration);
}
function stopMedia() {
  playToken++;
  document.querySelectorAll('.dialogue-line.speaking').forEach((node) => node.classList.remove('speaking'));
  document.querySelectorAll('.quiz-option.speaking').forEach((node) => node.classList.remove('speaking'));
  const playingButton = document.querySelector('.sound-button');
  if (playingButton) playingButton.innerHTML = icon('sound') + '再听一遍';
  if (audio) {
    audio.pause();
    audio = null;
  }
  window.speechSynthesis?.cancel();
}
async function speak(id, automatic = false) {
  stopMedia();
  const token = playToken;
  const clip = new Audio(audioSources[id]);
  audio = clip;
  clip.playbackRate = state.settings.rate;
  try {
    await clip.play();
    const option = document.querySelector(`.quiz-option[data-action="speak:${id}"]`);
    if (option && token === playToken) {
      option.classList.add('speaking');
      clip.addEventListener('ended', () => option.classList.remove('speaking'), { once: true });
    }
    const button = document.querySelector(`.sound-button[data-action="speak:${id}"]`);
    if (button && token === playToken) {
      button.innerHTML = icon('sound') + '正在播放…';
      clip.addEventListener(
        'ended',
        () => {
          if (token === playToken && button.isConnected) button.innerHTML = icon('sound') + '再听一遍';
        },
        { once: true },
      );
    }
  } catch (error) {
    if (token !== playToken || error.name === 'AbortError') return;
    if (automatic && error.name === 'NotAllowedError') {
      toast('浏览器需要点一下“播放单词”才能开启声音');
      return;
    }
    const w = wordMap.get(id);
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(w.word);
      u.lang = 'en-US';
      u.rate = state.settings.rate;
      u.onerror = (e) => {
        if (token === playToken && !['canceled', 'interrupted'].includes(e.error))
          toast('语音暂不可用，请检查音量或重新播放');
      };
      window.speechSynthesis.speak(u);
    } else toast('暂时无法播放，请检查设备音量和浏览器设置');
  }
}
function currentPool() {
  return category ? category.words : words;
}
function visibleWords() {
  let p = currentPool();
  if (filter === 'favorites') p = p.filter((w) => state.favorites.includes(w.id));
  if (filter === 'new') p = p.filter((w) => !state.records[w.id]);
  if (filter === 'learned') p = p.filter((w) => state.records[w.id]?.level >= 3);
  return p.filter((w) => (w.word + ' ' + w.zh).toLowerCase().includes(search.toLowerCase()));
}
function nav(n) {
  stopMedia();
  dialogueLesson = null;
  dialoguePractice = null;
  page = n;
  category = null;
  session = null;
  index = 0;
  search = '';
  filter = 'all';
  render();
  window.scrollTo(0, 0);
}
function render() {
  stopMedia();
  document.body.classList.toggle(
    'studying',
    (!!category && mode !== 'cards') || (page === 'dialogues' && !!dialoguePractice),
  );
  const learned = Object.values(state.records).filter((r) => r.level >= 3).length;
  app.innerHTML = `<aside class="sidebar"><a class="brand" href="#" data-action="home"><span class="brand-icon">${icon('leaf')}</span><span>小叶子英语<small>LITTLE LEAF ENGLISH</small></span></a><div class="sidebar-label">我的学习空间</div><nav>${[
    ['home', 'home', '学习首页'],
    ['themes', 'grid', '探索主题'],
    ['dialogues', 'sound', '生活对话'],
    ['review', 'book', '我的复习'],
    ['progress', 'chart', '成长记录'],
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
    )}</nav><div class="sidebar-bottom"><div class="grow-note"><span>🌱</span><strong>每天一点，自然生长</strong><p>每一个新单词，<br>都是一片小小的新叶子。</p></div>${btn(icon('settings') + '学习设置', 'settings', 'nav-link')}<small>给好奇心，一点生长的空间</small></div></aside><div class="workspace"><header class="topbar"><div class="breadcrumb">我的学习空间 <span>/</span> <strong>${category ? esc(category.name) : { home: '学习首页', themes: '探索主题', review: '我的复习', dialogues: '生活对话', progress: '成长记录' }[page]}</strong></div><div class="top-meta">${page === 'dialogues' && dialoguePractice ? btn(icon('back'), 'nav:dialogues', 'icon-button study-exit', 'aria-label="退出对话练习"') : ''}${category && mode !== 'cards' ? btn(icon('back'), 'nav:themes', 'icon-button study-exit', 'aria-label="退出练习，返回主题"') : ''}<span class="streak">${icon('sun')} 连续学习 ${streak(state)} 天</span><button class="avatar" data-action="settings" aria-label="打开学习设置">🌱</button></div></header><main id="main" tabindex="-1">${category ? renderCategory() : page === 'home' ? home() : page === 'themes' ? themes() : page === 'review' ? review() : page === 'dialogues' ? dialogueView() : progress(learned)}</main><footer>让英语，从看见、听见，到自然说出口。<span>Little steps. Big discoveries.</span></footer></div><nav class="mobile-nav" aria-label="主导航">${[
    ['home', 'home', '首页'],
    ['themes', 'grid', '主题'],
    ['dialogues', 'sound', '对话'],
    ['review', 'book', '复习'],
    ['progress', 'chart', '成长'],
  ]
    .map(([id, i, t]) => btn(icon(i) + `<span>${t}</span>`, `nav:${id}`, page === id ? 'active' : ''))
    .join('')}</nav>`;
  scheduleAutoNext();
}
function heading(kicker, title, sub, right = '') {
  return `<div class="heading"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p class="muted">${sub}</p></div>${right}</div>`;
}
function home() {
  const due = dueWords(state, words).length,
    known = Object.keys(state.records).length;
  return `${heading('A LITTLE ENGLISH, EVERY DAY', '今天，也一起长大一点 <span class="wave">☀️</span>', '看一看，听一听。让好奇心带你认识英语。')}<section class="hero"><div class="hero-copy"><span class="pill">${icon('leaf')} 每天 5 分钟的小小冒险</span><h2>认识世界，<br>从一个单词开始<span>。</span></h2><p>把英语装进生活里。<br>和小叶子一起，轻松学英语。</p>${btn((today() >= state.settings.goal ? '今日已达标 · 自由练习' : '开始今日学习') + ' ' + icon('arrow'), 'daily', 'primary')}<div class="hero-caption"><span class="tiny-dots">● ● ●</span> ${due ? `先复习 ${Math.min(due, 10)} 个到期词` : today() >= state.settings.goal ? '今日目标已完成，继续自由探索吧' : '今天从感兴趣的主题开始'}</div></div><div class="hero-art" aria-label="苹果、蝴蝶与英语词卡插图"><span class="scribble one">✧</span><span class="scribble two">✦</span><div class="float-label">Hello, little explorer!</div><div class="art-card apple">${img(wordMap.get('apple'))}<strong>apple</strong><span>苹果</span></div><div class="art-card butterfly">${img(wordMap.get('butterfly'))}<strong>butterfly</strong></div><div class="art-badge">${icon('sound')} Listen & discover</div><span class="art-leaf">🌿</span><span class="orbit">✧</span></div></section>${savedSession ? `<section class="resume-banner"><div><strong>接着上次的小冒险</strong><p>第 ${savedSession.position + 1} / ${savedSession.queue.length} 题 · ${savedSession.type === 'spell' ? '拼写练习' : '听音选图'}</p></div>${btn('继续学习 ' + icon('arrow'), 'resume', 'secondary')}</section>` : ''}<section class="quick-stats" aria-label="学习概况"><div><span class="stat-icon green">${icon('check')}</span><span><small>今日已练习</small><strong>${today()} <em>/ ${state.settings.goal} 次</em></strong></span><div class="mini-ring" style="--p:${Math.min(100, (today() / state.settings.goal) * 100)}%"></div></div><div><span class="stat-icon orange">${icon('book')}</span><span><small>等待温习</small><strong>${due} <em>个单词</em></strong></span>${btn(icon('arrow'), 'nav:review', 'icon-button', 'aria-label="去复习"')}</div><div><span class="stat-icon lavender">${icon('leaf')}</span><span><small>已经探索</small><strong>${known} <em>/ ${words.length} 个单词</em></strong></span><span class="little-spark">✧</span></div></section><section class="dialogue-banner"><div><span class="eyebrow">LITTLE TALKS, REAL LIFE</span><h2>把英语用在生活里</h2><p>购物、点餐 · 8 组短对话 · 听句子，试着接下一句</p></div>${btn('开始生活对话 ' + icon('arrow'), 'nav:dialogues', 'primary')}</section><div class="section-title"><div><h2>探索你的小世界 <span>Explore by topic</span></h2><p>从喜欢的主题开始，每一次发现都算数。</p></div>${btn('全部主题 ' + icon('arrow'), 'nav:themes', 'text-button')}</div><div class="category-grid">${categories.slice(0, 6).map(categoryCard).join('')}</div><div class="gentle-tip">${icon('sound')}<span><strong>小小建议</strong>　先听单词，再到例句学习里听一听、填一填，让单词用起来。</span></div>`;
}
function categoryCard(c) {
  const done = c.words.filter((w) => state.records[w.id]).length;
  return `<button class="category-card" data-action="category:${c.id}" style="--tint:${c.color}"><div class="category-pictures">${c.words
    .slice(0, 3)
    .map((w) => img(w))
    .join(
      '',
    )}<span class="category-go">${icon('arrow')}</span></div><div class="category-info"><h3>${c.name}<small>${c.en}</small></h3><span class="word-count">${c.words.length} 个单词</span></div><div class="category-progress"><span style="width:${(done / c.words.length) * 100}%"></span></div><div class="category-foot"><span>${done ? '已探索 ' + done + ' 个' : '等待你的第一个发现'}</span><span>${Math.round((done / c.words.length) * 100)}%</span></div></button>`;
}
function themes() {
  return `${heading('YOUR WORLD OF WORDS', '每一个主题，都是新发现', categories.length + ' 个生活主题 · ' + words.length + ' 个启蒙单词 · 随时点读')}<label class="search global-search">${icon('search')}<input id="all-search" type="search" placeholder="搜索全部单词：中文 / English" aria-label="搜索全部单词" value="${esc(allSearch)}"></label><div id="all-results">${allSearch ? globalResults() : `<div class="category-grid">${categories.map(categoryCard).join('')}</div>`}</div>`;
}
function globalResults() {
  const list = words.filter((w) =>
    (w.word + ' ' + w.zh + ' ' + categoryMap.get(w.category).name)
      .toLowerCase()
      .includes(allSearch.trim().toLowerCase()),
  );
  return `<p class="search-count" role="status">找到 ${list.length} 个单词，显示 ${Math.min(shown, list.length)} 个</p><div class="word-grid">${list.slice(0, shown).map(wordCard).join('') || empty('🔎', '没有找到这个词', '试试英文、中文或主题名称。')}</div>${list.length > shown ? btn('再显示 24 个', 'more-global', 'secondary more-button') : ''}`;
}
function wordResults() {
  const list = visibleWords();
  return `${list.slice(0, shown).map(wordCard).join('') || empty('🔎', '还没有找到单词', '试试其他关键词或筛选条件。')}${list.length > shown ? btn('再显示 24 个', 'more', 'secondary more-button') : ''}`;
}
function review() {
  const due = dueWords(state, words),
    wrong = words.filter((w) => state.records[w.id]?.level === 0);
  return `${heading('A LITTLE REVIEW GOES A LONG WAY', '和老朋友，再见一面', '答对后的复习间隔为 1、3、7、14、30 天，答错后 10 分钟再练。')}<section class="review-banner"><div><span class="eyebrow">READY WHEN YOU ARE</span><h2>${due.length ? '有 ' + due.length + ' 个单词想你啦' : '暂时没有到期的单词'}</h2><p>${due.length ? '听一听，选一选，让记忆再长牢一点。' : '可以复习收藏，或者去探索一个新主题。'}</p></div>${btn(due.length ? '开始到期复习 ' + icon('arrow') : '去探索主题 ' + icon('arrow'), due.length ? 'due' : 'nav:themes')}</section><div class="section-title"><h2>需要多见几次 <span>${wrong.length} 个词</span></h2></div><div class="word-grid">${wrong.map(wordCard).join('') || empty('🌿', '现在没有薄弱词', '练习后，需要巩固的词会出现在这里。')}</div><div class="section-title"><h2>我的收藏 <span>${state.favorites.length} 个词</span></h2>${state.favorites.length ? btn('练习收藏', 'favorites', 'text-button') : ''}</div><div class="word-grid">${state.favorites.map((id) => wordCard(wordMap.get(id))).join('') || empty('☆', '收集你喜欢的单词', '点击词卡右上角的星星，即可放进这里。')}</div>`;
}
function progress(learned) {
  const seen = Object.keys(state.records).length,
    correct = Object.values(state.records).reduce((n, r) => n + r.correct, 0),
    total = Object.values(state.records).reduce((n, r) => n + r.seen, 0),
    now = new Date();
  return `${heading('EVERY LITTLE STEP COUNTS', '你的成长，看得见', '慢慢来，每一次练习都在让你更熟悉英语。')}<div class="progress-stats">${[
    ['已探索', seen + '/' + words.length],
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
  )}</div></section><section class="panel"><h2>主题成长</h2><div class="topic-progress">${categories.map((c) => `<div><span>${c.emoji} ${c.name}</span><div class="category-progress"><span style="width:${(c.words.filter((w) => state.records[w.id]).length / c.words.length) * 100}%"></span></div><small>${c.words.filter((w) => state.records[w.id]).length}/${c.words.length}</small></div>`).join('')}</div></section><div class="gentle-tip">${icon('leaf')}<span>进度自动保存在当前浏览器。换设备前，请在学习设置里导出备份；设备之间不会自动同步。</span></div>`;
}
function empty(emoji, title, text) {
  return `<div class="empty"><span>${emoji}</span><h3>${title}</h3><p>${text}</p></div>`;
}
function wordCard(w) {
  const r = state.records[w.id];
  return `<article class="word-card"><button class="favorite ${state.favorites.includes(w.id) ? 'on' : ''}" data-action="favorite:${w.id}" aria-label="${state.favorites.includes(w.id) ? '取消收藏' : '收藏'} ${w.word}" aria-pressed="${state.favorites.includes(w.id)}">${icon('star')}</button><button class="word-play" data-action="speak:${w.id}" aria-label="播放 ${w.word}">${img(w)}<strong>${w.word}</strong><small class="word-topic">${categoryMap.get(w.category).name}</small>${state.settings.showChinese ? `<span>${w.zh}</span>` : ''}<span class="listen-label">${icon('sound')} 点一下，听发音</span></button>${r?.level >= 3 ? '<span class="mastered">✓ 已巩固</span>' : ''}</article>`;
}
function renderCategory() {
  return `<div class="study-heading">${btn(icon('back') + '返回主题', 'nav:themes', 'text-button')}<span class="eyebrow">${category.en}</span><h1>${category.name}</h1><p class="muted">${category.description}</p></div><div class="study-toolbar"><div class="mode-tabs" role="group" aria-label="学习模式">${[
    ['cards', 'grid', '词卡'],
    ['listen', 'sound', '听音选图'],
    ['sentences', 'book', '例句学习'],
    ['spell', 'book', '拼写'],
  ]
    .map(([id, i, t]) =>
      btn(icon(i) + t, `mode:${id}`, mode === id ? 'selected' : '', 'aria-pressed="' + (mode === id) + '"'),
    )
    .join(
      '',
    )}</div>${mode === 'cards' ? `<label class="search">${icon('search')}<input id="search" type="search" placeholder="找一个单词…" aria-label="搜索单词" value="${esc(search)}"></label>` : ''}</div>${
    mode === 'cards'
      ? `<div class="filter-row">${[
          ['all', '全部'],
          ['new', '未探索'],
          ['learned', '已巩固'],
          ['favorites', '已收藏'],
        ]
          .map(([id, t]) => btn(t, `filter:${id}`, filter === id ? 'chip active' : 'chip'))
          .join(
            '',
          )}<label class="check-label"><input id="chinese" type="checkbox" ${state.settings.showChinese ? 'checked' : ''}> 显示中文</label></div><div id="word-results" class="word-grid">${wordResults()}</div>`
      : mode === 'sentences'
        ? sentenceCard()
        : quizView()
  }`;
}
function sentenceCard() {
  const w = category.words[index],
    parts = sentenceParts(w);
  const showAnswer = !sentenceHidden || sentenceFeedback !== null;
  return `<section class="reading panel sentence-card" aria-label="例句学习" tabindex="-1"><div class="reading-top"><span>${index + 1} / ${category.words.length}</span><span>把单词放进句子里</span></div>${img(w, 'reading-image')}<h2>${esc(w.zh)}</h2><div class="example sentence-example"><p>${esc(parts.before)}${showAnswer ? `<mark>${esc(parts.target)}</mark>` : '<span class="sentence-gap" aria-label="待补全单词">____</span>'}${esc(parts.after)}</p></div><div class="button-row sentence-controls">${btn(icon('sound') + '听例句', `sentence:${w.id}`, 'primary')}${showAnswer ? btn(icon('sound') + '听单词', `speak:${w.id}`, 'secondary') : ''}</div>${showAnswer ? `<p class="small muted">先听一遍，留意标出的关键词，再试着补全句子。</p>${sentenceFeedback !== null ? `<div class="feedback ${sentenceFeedback.correct ? 'good' : 'retry'}" role="status"><strong>${sentenceFeedback.correct ? '填对了！' : '再看一遍完整例句'}</strong><p>你填写的是：${esc(sentenceFeedback.typed)}</p></div>` : ''}${btn(sentenceFeedback !== null ? '再练一次' : '隐藏关键词，做填空', 'sentence-try', 'secondary')}` : `<form id="sentence-form"><label for="sentence-answer">补全句子里的英文关键词</label><div class="spell-input"><input id="sentence-answer" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="done" maxlength="100" placeholder="写出图里的英文"><button class="primary">检查答案</button></div></form>`}<p class="small muted">每词本轮首次填空计入复习，重试不重复记分。例句语音使用设备语音。</p><div class="reading-nav">${btn('上一个', 'previous', 'secondary', index === 0 ? 'disabled' : '')}${btn('下一个', 'next', 'secondary', index === category.words.length - 1 ? 'disabled' : '')}</div></section>`;
}
function startQuiz(pool, type = 'listen', source = 'theme') {
  stopMedia();
  if (!pool.length) {
    toast('这里暂时没有可练习的单词');
    return;
  }
  session = {
    queue: studyQueue(
      state,
      pool,
      Date.now(),
      Math.min(source === 'daily' ? dailyRoundSize(state) : 10, pool.length),
    ),
    position: 0,
    correct: 0,
    answered: false,
    type,
    source,
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
    };
  }
  mode = type;
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
  session.options = quizOptions(session.queue[session.position], currentPool());
}
function persistSession() {
  try {
    if (!session) return;
    if (session.position >= session.queue.length) {
      savedSession = null;
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    const raw = {
      ...session,
      version: 1,
      queue: session.queue.map((w) => w.id),
      options: session.options.map((w) => w.id),
      pool: currentPool().map((w) => w.id),
      categoryId: category?.id === 'session' ? null : category?.id,
    };
    savedSession = validateSession(raw);
    localStorage.setItem(SESSION_KEY, JSON.stringify(savedSession));
  } catch {
    toast('练习暂存失败，请检查浏览器存储');
  }
}
function resumeSession() {
  if (!savedSession) return;
  const r = savedSession;
  category = categoryMap.get(r.categoryId) || {
    id: 'session',
    name: '继续上次练习',
    en: 'KEEP GROWING',
    description: '回到刚才的进度，继续你的小冒险',
    words: r.pool.map((id) => wordMap.get(id)),
  };
  page = 'themes';
  mode = r.type;
  session = {
    ...r,
    queue: r.queue.map((id) => wordMap.get(id)),
    options: r.options.map((id) => wordMap.get(id)),
  };
  render();
  scrollToStudy();
  playQuestion();
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
    persistSession();
    return `<section class="quiz-intro panel"><span class="intro-emoji">🌟</span><span class="eyebrow">LITTLE STEPS, BIG DISCOVERIES</span><h2>又长出了一片新叶子！</h2><p>完成 ${session.queue.length} 题 · 答对 ${session.correct} 题</p><div class="result-score">${Math.round((session.correct / session.queue.length) * 100)}<small>%</small></div><p>需要巩固的单词已加入复习安排。</p>${btn('回到首页 ' + icon('arrow'), 'home')}${session.results.some((r) => !r.correct) ? btn('再练错题', 'retry', 'secondary') : ''}${btn('再练一轮', 'begin', 'secondary')}</section>`;
  }
  prepareQuestion();
  persistSession();
  const w = session.queue[session.position];
  return `<section class="quiz panel"><div class="quiz-top"><span>第 ${session.position + 1} / ${session.queue.length} 题</span><span>已答对 ${session.correct} 题</span></div><div class="category-progress"><span style="width:${(session.position / session.queue.length) * 100}%"></span></div><h2>${mode === 'spell' ? '看图，写出它的英文' : '听声音，选择对应的图'}</h2>${btn(icon('sound') + '播放单词', `speak:${w.id}`, 'sound-button')}${mode === 'spell' ? `${img(w, 'spell-image')}<form id="spell-form"><label for="spelling">英文单词</label><div class="spell-input"><input id="spelling" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" enterkeyhint="done" maxlength="100" value="${session.answered ? esc(session.typed || '') : ''}" placeholder="输入你想到的单词" ${session.answered ? 'disabled' : ''}><button class="primary" ${session.answered ? 'disabled' : ''}>检查答案</button></div></form>` : `<div class="quiz-options">${session.options.map((o) => `<button data-action="${session.answered ? 'speak' : 'answer'}:${o.id}" aria-label="${session.answered ? '播放 ' + o.word : '选项 ' + (session.options.indexOf(o) + 1)}" class="quiz-option ${session.answered ? (o.id === w.id ? 'correct' : o.id === session.chosen ? 'incorrect' : '') : ''}">${img(o, '', o.zh)}${session.answered ? `<span>${o.word} · ${o.zh} ${icon('sound')}</span>` : ''}</button>`).join('')}</div>`}<div class="feedback ${mode === 'listen' ? 'listening-feedback' : ''} ${session.answered ? (session.lastCorrect ? 'good' : 'retry') : ''}" role="status">${session.answered ? `<strong>${mode === 'listen' ? (session.lastCorrect ? (session.position + 1 === session.queue.length ? '答对了，即将显示本轮结果…' : '答对了，即将进入下一题…') : '再听一听，看看正确答案') : session.lastCorrect ? '答对啦，真棒！' : '再认识一下这位朋友'}</strong><p>${w.word} · ${w.zh}${mode === 'spell' && session.typed ? `<br>你输入的是：${esc(session.typed)}` : ''}</p>${btn(session.position + 1 === session.queue.length ? '查看本轮收获 ' + icon('arrow') : '下一题 ' + icon('arrow'), 'continue')}` : '<span>听单词后选图，没听清可以重播。</span>'}</div></section>`;
}
function continueQuestion() {
  if (!session?.answered) return;
  clearTimeout(autoNextTimer);
  stopMedia();
  clearTimeout(toastTimer);
  $('#toast').classList.remove('visible');
  session.position++;
  session.answered = false;
  session.options = [];
  render();
  scrollToStudy();
  playQuestion();
}
function scheduleAutoNext() {
  clearTimeout(autoNextTimer);
  if (
    mode !== 'listen' ||
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
document.addEventListener('visibilitychange', scheduleAutoNext);
function submitAnswer(id, typed) {
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
  answer(state, w.id, correct);
  save();
  render();
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
  clearTimeout(autoNextTimer);
  stopMedia();
  modal.innerHTML = `<div class="modal-title"><div><span class="eyebrow">MAKE IT YOURS</span><h2>按照你的节奏来</h2></div>${btn(icon('close'), 'close', 'icon-button', 'aria-label="关闭设置"')}</div><label class="setting-row">每日练习目标<select id="goal">${[5, 10, 15, 20].map((n) => `<option ${state.settings.goal === n ? 'selected' : ''} value="${n}">${n} 次</option>`).join('')}</select></label><label class="setting-row">单词播放速度<select id="rate">${[
    [0.7, '慢一点'],
    [0.85, '自然慢速'],
    [1, '正常速度'],
  ]
    .map(([v, t]) => `<option value="${v}" ${state.settings.rate === v ? 'selected' : ''}>${t}</option>`)
    .join(
      '',
    )}</select></label><div class="settings-block"><h3>带着小叶子去旅行</h3><p>下载离线学习内容后，图片、单词和生活对话音频可断网使用；例句朗读使用设备语音，是否离线可用由系统决定。</p>${btn('下载 / 更新离线内容', 'offline', 'secondary', 'id="offline-btn"')}<p id="offline-status" role="status"></p><p class="small">手机浏览器菜单可尝试“添加到主屏幕”；安装支持由浏览器决定。</p></div><div class="settings-block"><h3>把成长好好收藏</h3><p>学习进度保存在当前浏览器，不会自动同步。建议定期备份，或用备份换设备。</p><div class="button-row">${btn('导出进度备份', 'export', 'secondary')}<label class="secondary import-label">合并导入备份<input id="import-file" type="file" accept="application/json,.json"></label></div><p class="small">导入按单词保留较新记录，每日次数取较大值，收藏合并。当前学习设置不变。</p></div><div class="settings-block attribution"><p>原创双语词库 · 图片：<a href="https://github.com/jdecked/twemoji" target="_blank" rel="noopener">Twemoji</a>（CC BY 4.0）<br>不含广告，无需账号。无需麦克风。<br>词库 ${words.length} 词 · ${categories.length} 主题 · v2.6.0</p><a href="https://github.com/OylDeGit/little-leaf-english" target="_blank" rel="noopener">查看 GitHub 项目 ↗</a></div>`;
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
            '✓ ' + words.length + ' 个单词和 ' + dialogues.length + ' 组对话的离线内容已就绪。';
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
  const [a, id] = b.dataset.action.split(':');
  switch (a) {
    case 'dialogue-open':
      dialogueLesson = dialogues.find((d) => d.id === id);
      dialoguePractice = null;
      render();
      window.scrollTo(0, 0);
      break;
    case 'dialogue-chinese':
      dialogueChinese = !dialogueChinese;
      render();
      break;
    case 'dialogue-play':
      speakDialogue(Number(id));
      break;
    case 'dialogue-read':
      dialoguePractice = null;
      render();
      window.scrollTo(0, 0);
      break;
    case 'dialogue-begin':
      if (!dialogueLesson) break;
      dialoguePractice = { step: 0, correct: 0 };
      prepareDialogueStep();
      render();
      window.scrollTo(0, 0);
      speakDialogue(0);
      break;
    case 'dialogue-answer': {
      const practice = dialoguePractice,
        choice = Number(id);
      if (!practice || practice.answered || !practice.options[choice]) break;
      practice.chosen = choice;
      practice.answered = true;
      if (practice.options[choice].en === dialogueLesson.lines[practice.step * 2 + 1].en) practice.correct++;
      render();
      break;
    }
    case 'dialogue-next':
      if (!dialoguePractice?.answered) break;
      dialoguePractice.step++;
      if (dialoguePractice.step < 3) prepareDialogueStep();
      render();
      window.scrollTo(0, 0);
      if (dialoguePractice.step < 3) speakDialogue(dialoguePractice.step * 2);
      break;
    case 'resume':
      resumeSession();
      break;
    case 'more':
      shown += 24;
      $('#word-results').innerHTML = wordResults();
      break;
    case 'more-global':
      shown += 24;
      $('#all-results').innerHTML = globalResults();
      break;
    case 'retry': {
      const pool = session.results.filter((r) => !r.correct).map((r) => wordMap.get(r.id));
      category = null;
      startQuiz(pool, mode, 'retry');
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
    case 'category':
      stopMedia();
      shown = 24;
      category = categories.find((c) => c.id === id);
      page = 'themes';
      mode = 'cards';
      session = null;
      index = 0;
      search = '';
      filter = 'all';
      render();
      window.scrollTo(0, 0);
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
      state.favorites = state.favorites.includes(id)
        ? state.favorites.filter((x) => x !== id)
        : [...state.favorites, id];
      state.updatedAt = Date.now();
      save();
      render();
      break;
    case 'mode':
      stopMedia();
      mode = id;
      index = 0;
      sentenceHidden = false;
      sentenceFeedback = null;
      sentenceRecorded = new Set();
      session = null;
      render();
      scrollToStudy();
      break;
    case 'filter':
      shown = 24;
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
      if (mode !== 'sentences' || !category) break;
      sentenceHidden = true;
      sentenceFeedback = null;
      render();
      $('#sentence-answer')?.focus();
      break;
    case 'begin':
      startQuiz(currentPool(), mode === 'spell' ? 'spell' : 'listen');
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
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'all-search') {
    allSearch = e.target.value;
    shown = 24;
    $('#all-results').innerHTML = allSearch.trim()
      ? globalResults()
      : `<div class="category-grid">${categories.map(categoryCard).join('')}</div>`;
  }
  if (e.target.id === 'search') {
    search = e.target.value;
    shown = 24;
    $('#word-results').innerHTML = wordResults();
  }
});
document.addEventListener('change', async (e) => {
  if (e.target.id === 'chinese') {
    state.settings.showChinese = e.target.checked;
    save();
    render();
  }
  if (e.target.id === 'goal' || e.target.id === 'rate') {
    state.settings[e.target.id] = Number(e.target.value);
    save();
    render();
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
    submitAnswer(null, input);
  }
});
window.addEventListener('pagehide', () => {
  persistSession();
  stopMedia();
});
if ('serviceWorker' in navigator)
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
render();

function turnSentence(delta) {
  if (!category || mode !== 'sentences') return;
  stopMedia();
  index = Math.max(0, Math.min(category.words.length - 1, index + delta));
  sentenceHidden = false;
  sentenceFeedback = null;
  render();
  scrollToStudy();
}
function speakSentence(id) {
  if (!('speechSynthesis' in window)) {
    toast('此设备没有可用的例句语音');
    return;
  }
  stopMedia();
  const token = playToken;
  const u = new SpeechSynthesisUtterance(wordMap.get(id).sentence);
  u.lang = 'en-US';
  u.rate = state.settings.rate;
  u.onerror = (e) => {
    if (token === playToken && !['canceled', 'interrupted'].includes(e.error))
      toast('例句语音暂不可用，单词仍可点读');
  };
  window.speechSynthesis.speak(u);
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

function dialogueView() {
  if (!dialogueLesson)
    return `${heading('LITTLE TALKS, REAL LIFE', '生活里的小对话', '每组 6 句 · 3 次回应练习 · 音频可离线下载')}<div class="dialogue-grid">${dialogues.map((d) => `<button class="dialogue-topic panel" data-action="dialogue-open:${d.id}"><span class="dialogue-emoji" aria-hidden="true">${d.emoji}</span><small>${d.group}</small><h2>${esc(d.title)}</h2><p>${esc(d.lines[0].role)} ↔ ${esc(d.lines[1].role)}</p><span>听对话，再试着回应 →</span></button>`).join('')}</div><p class="small muted">对话练习单独显示本轮结果，不计入单词打卡次数。</p>`;
  const d = dialogueLesson,
    practice = dialoguePractice;
  const controls = `<div class="dialogue-toolbar">${btn('← 全部对话', 'nav:dialogues', 'text-button')}${btn(dialogueChinese ? '隐藏中文' : '显示中文', 'dialogue-chinese', 'secondary', `aria-pressed="${dialogueChinese}"`)}</div>`;
  if (!practice)
    return `${controls}${heading(d.group, d.title, '点击每句话听发音，然后试着接下一句。')}<section class="dialogue-transcript" aria-label="完整对话">${d.lines.map((line, i) => `<button class="dialogue-line panel ${i % 2 ? 'guest' : ''}" data-action="dialogue-play:${i}" aria-label="播放第 ${i + 1} 句：${esc(line.en)}"><small>${esc(line.role)} ${icon('sound')}</small><strong>${esc(line.en)}</strong>${dialogueChinese ? `<span>${esc(line.zh)}</span>` : ''}</button>`).join('')}</section><div class="dialogue-start">${btn('试着回应 · 3 小题', 'dialogue-begin', 'primary')}</div>`;
  if (practice.step >= 3)
    return `${controls}<section class="panel dialogue-result"><span class="intro-emoji">🌟</span><h1>这段对话，练完啦！</h1><p>首次答对 ${practice.correct} / 3 题</p><p>可以再听完整对话，模仿说出每一句。</p><div class="button-row">${btn('再听完整对话', 'dialogue-read', 'primary')}${btn('重练回应', 'dialogue-begin', 'secondary')}</div></section>`;
  const prompt = d.lines[practice.step * 2],
    reply = d.lines[practice.step * 2 + 1];
  return `${controls}<section class="panel dialogue-exercise"><div class="quiz-top"><span>第 ${practice.step + 1} / 3 题</span><span>你来扮演：${esc(reply.role)}</span></div><p class="eyebrow">${esc(d.group)} · ${esc(d.title)}</p><h1>接下来，你会怎么说？</h1><button class="dialogue-line" data-action="dialogue-play:${practice.step * 2}"><small>${esc(prompt.role)} ${icon('sound')}</small><strong>${esc(prompt.en)}</strong>${dialogueChinese ? `<span>${esc(prompt.zh)}</span>` : ''}</button><div class="dialogue-options">${practice.options.map((option, i) => `<button class="secondary dialogue-choice ${practice.answered && option.en === reply.en ? 'right' : practice.answered && i === practice.chosen ? 'wrong' : ''}" data-action="dialogue-answer:${i}" ${practice.answered ? 'disabled' : ''}><strong>${esc(option.en)}</strong>${dialogueChinese ? `<span>${esc(option.zh)}</span>` : ''}</button>`).join('')}</div>${practice.answered ? `<div class="feedback ${practice.options[practice.chosen].en === reply.en ? 'good' : 'retry'}" role="status"><strong>${practice.options[practice.chosen].en === reply.en ? '回应得很合适！' : '这时可以这样回应'}</strong><p>${esc(reply.en)}<br>${esc(reply.zh)}</p>${btn(icon('sound') + '听正确回应', `dialogue-play:${practice.step * 2 + 1}`, 'secondary')}</div><div class="dialogue-next">${btn(practice.step === 2 ? '查看本轮结果' : '下一轮对话 →', 'dialogue-next', 'primary')}</div>` : '<p class="small muted">点击上方句子可重听，再选一个合适的回应。</p>'}</section>`;
}
async function speakDialogue(index) {
  const line = dialogueLesson?.lines[index];
  if (!line) return;
  stopMedia();
  const token = playToken,
    clip = new Audio(line.audio);
  audio = clip;
  clip.playbackRate = state.settings.rate;
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
