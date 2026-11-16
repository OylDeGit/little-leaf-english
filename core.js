import { sceneMap } from './scenes.js';
import { wordMap } from './data.js';
export const KEY = 'little-leaf:v1';
export function perfectListeningRound(session) {
  return session?.type === 'listen' && session.queue?.length === 10 &&
    session.position === 10 && session.results?.length === 10 &&
    session.results.every(result => result.correct === true);
}
export const dayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const emptyState = () => ({
  version: 1,
  records: {},
  days: {},
  favorites: [],
  contacts: {},
  settings: { goal: 10, rate: 0.85, showChinese: true, autoNext: false },
  updatedAt: 0,
});
export const normalize = (s) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/, '')
    .replace(/\s+/g, ' ');
// Contact is a first encounter, not a correct answer or a mastery event.
export function contactWord(state, id, now = Date.now()) {
  if (!wordMap.has(id)) return false;
  state.contacts ||= {};
  if (state.contacts[id]) return false;
  state.contacts[id] = now;
  state.updatedAt = Math.max(state.updatedAt || 0, now);
  return true;
}
export function learningStats(state) {
  return {
    contacted: new Set([...Object.keys(state.contacts || {}), ...Object.keys(state.records)]).size,
    practiced: Object.keys(state.records).length,
    mastered: Object.values(state.records).filter(r => r.level >= 3).length,
  };
}
export function lessonWords(state, pool, now = Date.now()) {
  const unique = [...new Map(pool.map(w => [w.id, w])).values()];
  const due = unique.filter(w => state.records[w.id]?.due <= now)
    .sort((a,b) => state.records[a.id].due - state.records[b.id].due);
  const touched = unique.filter(w => state.contacts?.[w.id] && !state.records[w.id]);
  const fresh = unique.filter(w => !state.contacts?.[w.id] && !state.records[w.id]);
  const later = unique.filter(w => state.records[w.id]?.due > now);
  return [...due, ...touched, ...fresh, ...later].slice(0, 5);
}
export function answer(state, id, correct, now = Date.now()) {
  if (!wordMap.has(id)) throw Error('Unknown word');
  const old = state.records[id] || { seen: 0, correct: 0, wrong: 0, level: 0 };
  const advance = !old.due || old.due <= now;
  const level = correct ? (advance ? Math.min(5, old.level + 1) : old.level) : 0;
  state.records[id] = {
    seen: old.seen + 1,
    correct: old.correct + (correct ? 1 : 0),
    wrong: old.wrong + (correct ? 0 : 1),
    level,
    due:
      correct && !advance
        ? old.due
        : now + (correct ? [1, 3, 7, 14, 30][Math.max(0, level - 1)] * 86400000 : 600000),
    updatedAt: now,
  };
  const day = dayKey(new Date(now));
  state.days[day] = (state.days[day] || 0) + 1;
  state.updatedAt = now;
  return state;
}
export function studyQueue(state, pool, now = Date.now(), limit = 10) {
  const due = pool
    .filter((w) => state.records[w.id]?.due <= now)
    .sort((a, b) => state.records[a.id].due - state.records[b.id].due);
  const fresh = shuffle(pool.filter((w) => !state.records[w.id]));
  const later = pool
    .filter((w) => state.records[w.id]?.due > now)
    .sort((a, b) => state.records[a.id].level - state.records[b.id].level);
  return [...due, ...fresh, ...later].slice(0, limit);
}
export const dueWords = (s, pool, now = Date.now()) => pool.filter((w) => s.records[w.id]?.due <= now);
export function validateBackup(input) {
  if (
    !input ||
    input.version !== 1 ||
    !input.records ||
    typeof input.records !== 'object' ||
    Array.isArray(input.records)
  )
    throw Error('备份格式不正确');
  const s = emptyState();
  for (const [id, r] of Object.entries(input.records)) {
    if (!wordMap.has(id)) continue;
    if (
      !r ||
      !['seen', 'correct', 'wrong', 'level', 'due', 'updatedAt'].every(
        (k) => Number.isSafeInteger(r[k]) && r[k] >= 0,
      ) ||
      r.level > 5 ||
      r.seen !== r.correct + r.wrong ||
      r.due > 4102444800000 ||
      r.updatedAt > 4102444800000
    )
      throw Error('单词进度数据无效');
    s.records[id] = {
      seen: r.seen,
      correct: r.correct,
      wrong: r.wrong,
      level: r.level,
      due: r.due,
      updatedAt: r.updatedAt,
    };
  }
  if (input.days && (typeof input.days !== 'object' || Array.isArray(input.days)))
    throw Error('每日记录无效');
  for (const [day, n] of Object.entries(input.days || {})) {
    if (!validDay(day) || !Number.isSafeInteger(n) || n < 0 || n > 100000) throw Error('每日记录无效');
    s.days[day] = n;
  }
  if (input.contacts != null && (typeof input.contacts !== 'object' || Array.isArray(input.contacts)))
    throw Error('接触记录无效');
  for (const [id, at] of Object.entries(input.contacts || {})) {
    if (!wordMap.has(id)) continue;
    if (!Number.isSafeInteger(at) || at <= 0 || at > 4102444800000) throw Error('接触记录无效');
    s.contacts[id] = at;
  }
  s.favorites = Array.isArray(input.favorites)
    ? [...new Set(input.favorites.filter((id) => wordMap.has(id)))]
    : [];
  if (input.settings) {
    if ([5, 10, 15, 20].includes(input.settings.goal)) s.settings.goal = input.settings.goal;
    if ([0.7, 0.85, 1].includes(input.settings.rate)) s.settings.rate = input.settings.rate;
    if (typeof input.settings.showChinese === 'boolean') s.settings.showChinese = input.settings.showChinese;
    if (typeof input.settings.autoNext === 'boolean') s.settings.autoNext = input.settings.autoNext;
  }
  s.updatedAt = Number.isSafeInteger(input.updatedAt) && input.updatedAt >= 0 ? input.updatedAt : 0;
  return s;
}
export function mergeBackup(current, incoming) {
  const other = validateBackup(incoming),
    s = structuredClone(current);
  for (const [id, r] of Object.entries(other.records))
    if (!s.records[id] || r.updatedAt > s.records[id].updatedAt) s.records[id] = r;
  for (const [day, n] of Object.entries(other.days)) s.days[day] = Math.max(s.days[day] || 0, n);
  s.favorites = [...new Set([...s.favorites, ...other.favorites])];
  s.contacts ||= {};
  for (const [id, at] of Object.entries(other.contacts))
    s.contacts[id] = s.contacts[id] ? Math.min(s.contacts[id], at) : at;
  s.updatedAt = Math.max(s.updatedAt, other.updatedAt);
  return s;
}
export function streak(s, now = new Date()) {
  const d = new Date(now);
  let count = 0;
  if (!s.days[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (s.days[dayKey(d)]) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export const SESSION_KEY = 'little-leaf:session:v1';
export function validDay(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const [y, m, d] = day.split('-').map(Number),
    date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
export function shuffle(items, rng = Math.random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export function matchesSpelling(word, text) {
  return [word.word, ...(word.variants || [])].some((v) => normalize(v) === normalize(text));
}
export function quizOptions(target, pool, rng = Math.random, strictPool = false) {
  const prohibited = new Set([target.word, ...(target.variants || [])].map(normalize));
  const unique = new Set([target.imageKey || target.emoji]);
  const acceptable = (w) =>
    w.id !== target.id &&
    !prohibited.has(normalize(w.word)) &&
    !(w.variants || []).some((v) => prohibited.has(normalize(v)));
  const candidates = [
    ...shuffle(pool.filter(acceptable), rng),
    ...(strictPool ? [] : shuffle([...wordMap.values()].filter(acceptable), rng)),
  ];
  const others = [];
  for (const w of candidates) {
    if (unique.has(w.imageKey || w.emoji)) continue;
    unique.add(w.imageKey || w.emoji);
    others.push(w);
    if (others.length === 3) break;
  }
  return shuffle([target, ...others], rng);
}
export function dailyRoundSize(state, now = new Date()) {
  const remaining = state.settings.goal - (state.days[dayKey(now)] || 0);
  return remaining > 0 ? Math.min(10, remaining) : 10;
}
export function validateSession(raw) {
  if (
    !raw ||
    raw.version !== 1 ||
    !['listen', 'spell'].includes(raw.type) ||
    !['theme', 'daily', 'due', 'favorites', 'retry', 'scene', 'lesson'].includes(raw.source)
  )
    throw Error('练习记录无效');
  if (raw.source === 'scene' && !sceneMap.has(raw.sceneId)) throw Error('场景记录无效');
  if (raw.sceneId != null && (!sceneMap.has(raw.sceneId) || !Array.isArray(raw.pool) || raw.pool.some(id => !sceneMap.get(raw.sceneId).wordIds.includes(id)))) throw Error('场景词集无效');
  const validIds = (v, max) =>
    Array.isArray(v) &&
    v.length > 0 &&
    v.length <= max &&
    v.every((id) => wordMap.has(id)) &&
    new Set(v).size === v.length;
  if (raw.lessonIds != null && (!validIds(raw.lessonIds, 5) ||
    !Array.isArray(raw.pool) || raw.pool.some(id => !raw.lessonIds.includes(id))))
    throw Error('小课堂词组无效');
  if (raw.source === 'lesson' && (!raw.lessonIds || raw.queue?.length > 3))
    throw Error('小课堂练习无效');
  if (
    !validIds(raw.queue, 10) ||
    !validIds(raw.pool, wordMap.size) ||
    raw.queue.some((id) => !raw.pool.includes(id)) ||
    !Number.isInteger(raw.position) ||
    raw.position < 0 ||
    raw.position >= raw.queue.length
  )
    throw Error('练习队列无效');
  if (
    typeof raw.answered !== 'boolean' ||
    !Array.isArray(raw.results) ||
    raw.results.length !== raw.position + (raw.answered ? 1 : 0)
  )
    throw Error('答题记录无效');
  const results = raw.results.map((r, i) => {
    if (r.id !== raw.queue[i] || typeof r.correct !== 'boolean') throw Error('答题记录无效');
    return { id: r.id, correct: r.correct };
  });
  const options = raw.options || [];
  if (
    raw.type === 'listen' &&
    (!validIds(options, 4) || ((!raw.lessonIds && !raw.sceneId) && options.length !== 4) || !options.includes(raw.queue[raw.position]) || (raw.lessonIds && options.some(id => !raw.lessonIds.includes(id))) || (raw.sceneId && options.some(id => !sceneMap.get(raw.sceneId).wordIds.includes(id))))
  )
    throw Error('选项无效');
  const lastCorrect = raw.answered ? results.at(-1).correct : undefined;
  return {
    version: 1,
    type: raw.type,
    source: raw.source,
    sceneId: raw.sceneId || null,
    sceneScroll: Number.isFinite(raw.sceneScroll) && raw.sceneScroll >= 0 ? Math.min(raw.sceneScroll, 100000) : 0,
    lessonIds: raw.lessonIds || null,
    queue: raw.queue,
    pool: raw.pool,
    categoryId: typeof raw.categoryId === 'string' ? raw.categoryId : null,
    position: raw.position,
    answered: raw.answered,
    results,
    options: raw.type === 'listen' ? options : [],
    correct: results.filter((r) => r.correct).length,
    lastCorrect,
    chosen: options.includes(raw.chosen) ? raw.chosen : null,
    typed: typeof raw.typed === 'string' ? raw.typed.slice(0, 100) : undefined,
  };
}

// Keep original case and punctuation around the target word, including plural suffixes.
export function sentenceParts(word) {
  const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const at = word.sentence.search(new RegExp(`\\b${escaped}(?=\\b|s\\b|es\\b)`, 'i'));
  if (at < 0) throw Error(`Sentence must contain target word: ${word.id}`);
  return {
    before: word.sentence.slice(0, at),
    target: word.sentence.slice(at, at + word.word.length),
    after: word.sentence.slice(at + word.word.length),
  };
}
