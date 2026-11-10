import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { words, categories, wordMap, imagePath } from './data.js';
import { audioSources } from './media.js';
import {
  emptyState,
  answer,
  studyQueue,
  validateBackup,
  mergeBackup,
  dayKey,
  streak,
  normalize,
  matchesSpelling,
  quizOptions,
  dailyRoundSize,
  validateSession,
} from './core.js';

test('300 unique bilingual words across 25 themes have usable local illustrations and audio', () => {
  assert.equal(words.length, 300);
  assert.equal(categories.length, 25);
  assert.equal(new Set(words.map((w) => w.id)).size, 300);
  for (const w of words) {
    assert.ok(w.word && w.zh && w.sentence && w.category);
    const svg = readFileSync(new URL(imagePath(w), import.meta.url), 'utf8');
    assert.ok(svg.includes('<svg') && !svg.includes('undefined'));
    const audio = readFileSync(new URL(audioSources[w.id], import.meta.url));
    assert.ok(audio.length > 1000);
    assert.ok(audio.subarray(0, 40).includes(Buffer.from('ftyp')));
  }
});
test('review intervals advance on due dates and stop at 30 days', () => {
  const s = emptyState();
  let now = 1794210000000;
  for (const days of [1, 3, 7, 14, 30, 30]) {
    answer(s, 'apple', true, now);
    assert.equal(s.records.apple.due, now + days * 86400000);
    now = s.records.apple.due;
  }
  answer(s, 'apple', false, now);
  assert.equal(s.records.apple.level, 0);
  assert.equal(s.records.apple.due, now + 600000);
  assert.equal(s.records.apple.seen, 7);
});
test('repeated same-day answers cannot manufacture mastery or postpone the due date', () => {
  const s = emptyState(),
    now = 1794210000000;
  answer(s, 'apple', true, now);
  const due = s.records.apple.due;
  answer(s, 'apple', true, now + 1000);
  answer(s, 'apple', true, now + 2000);
  assert.equal(s.records.apple.level, 1);
  assert.equal(s.records.apple.due, due);
  assert.equal(s.records.apple.seen, 3);
  answer(s, 'apple', false, now + 3000);
  answer(s, 'apple', true, now + 4000);
  assert.equal(s.records.apple.level, 0);
});
test('queue puts oldest due words ahead of new words and future reviews', () => {
  const s = emptyState(),
    now = 1794210000000;
  answer(s, 'banana', false, now - 700000);
  answer(s, 'apple', true, now);
  const q = studyQueue(s, words, now, 10);
  assert.equal(q[0].id, 'banana');
  assert.ok(!q.some((w) => w.id === 'apple'));
  assert.equal(new Set(q.map((w) => w.id)).size, 10);
});
test('backup merge retains newer records, unions favorites and does not double daily totals', () => {
  const s = emptyState(),
    b = emptyState(),
    now = 1794210000000;
  answer(s, 'apple', true, now);
  answer(b, 'apple', false, now - 1000);
  answer(b, 'banana', true, now);
  b.favorites = ['apple', 'apple'];
  const merged = mergeBackup(s, b);
  assert.equal(merged.records.apple.level, 1);
  assert.equal(merged.records.banana.level, 1);
  assert.equal(merged.days[dayKey(new Date(now))], 2);
  assert.deepEqual(merged.favorites, ['apple']);
  assert.equal(s.records.banana, undefined);
});
test('v1 progress and favorites survive the expanded vocabulary', () => {
  const old = emptyState();
  answer(old, 'apple', true, 1794210000000);
  answer(old, 'cricket', false, 1794210000000);
  old.favorites = ['orange-color', 'rectangle'];
  const restored = validateBackup(JSON.parse(JSON.stringify(old)));
  assert.deepEqual(restored, old);
  assert.ok(
    wordMap.has('apple') && wordMap.has('cricket') && wordMap.has('orange-color') && wordMap.has('rectangle'),
  );
});
test('malformed records and impossible calendar dates are rejected without mutation', () => {
  const s = emptyState(),
    b = emptyState();
  b.records.apple = { seen: 1, correct: 1, wrong: 1, level: 3, due: 0, updatedAt: 0 };
  assert.throws(() => mergeBackup(s, b));
  assert.deepEqual(s, emptyState());
  assert.throws(() => validateBackup({ version: 5, records: {} }));
  assert.throws(() => validateBackup({ ...emptyState(), days: { '2026-02-30': 1 } }));
  assert.throws(() => validateBackup({ ...emptyState(), days: [] }));
});
test('local calendar streak includes yesterday before today is started', () => {
  const s = emptyState(),
    d = new Date(2026, 10, 9, 12);
  s.days['2026-11-08'] = 1;
  s.days['2026-11-07'] = 2;
  assert.equal(streak(s, d), 2);
  s.days['2026-11-09'] = 1;
  assert.equal(streak(s, d), 3);
  assert.equal(streak(emptyState(), d), 0);
});
test('spelling accepts common regional variants, casing and spacing', () => {
  assert.equal(normalize(' Apple. '), 'apple');
  assert.ok(matchesSpelling(wordMap.get('gray'), ' Grey '));
  assert.ok(matchesSpelling(wordMap.get('airplane'), 'aeroplane'));
  assert.ok(matchesSpelling(wordMap.get('donut'), 'doughnut'));
  assert.ok(matchesSpelling(wordMap.get('ice-cream'), ' ICE   CREAM '));
  assert.ok(!matchesSpelling(wordMap.get('apple'), 'appl'));
});
test('every listening question has four distinct pictures and only one spoken answer', () => {
  for (const w of words) {
    const options = quizOptions(w, categories.find((c) => c.id === w.category).words);
    assert.equal(options.length, 4, w.id);
    assert.equal(new Set(options.map((o) => o.emoji)).size, 4, w.id);
    assert.equal(options.filter((o) => matchesSpelling(w, o.word)).length, 1, w.id);
    assert.equal(options.filter((o) => o.id === w.id).length, 1, w.id);
  }
  const orange = quizOptions(wordMap.get('orange'), words);
  assert.ok(!orange.some((o) => o.id === 'orange-color'));
});
test('single-word favorites still receive four useful quiz options', () => {
  const w = wordMap.get('apple');
  assert.equal(quizOptions(w, [w]).length, 4);
});
test('daily rounds respect the remaining goal and cap each round at ten', () => {
  const s = emptyState();
  s.settings.goal = 20;
  assert.equal(dailyRoundSize(s), 10);
  s.days[dayKey()] = 17;
  assert.equal(dailyRoundSize(s), 3);
  s.days[dayKey()] = 20;
  assert.equal(dailyRoundSize(s), 10);
});
const sampleSession = () => ({
  version: 1,
  type: 'listen',
  source: 'theme',
  queue: ['apple', 'banana'],
  pool: ['apple', 'banana', 'pear', 'grape'],
  position: 0,
  answered: true,
  results: [{ id: 'apple', correct: false }],
  options: ['apple', 'banana', 'pear', 'grape'],
  chosen: 'pear',
  categoryId: 'fruit',
});
test('resumable practice keeps answered feedback and recomputes score from results', () => {
  const raw = sampleSession();
  raw.correct = 99;
  const r = validateSession(JSON.parse(JSON.stringify(raw)));
  assert.equal(r.correct, 0);
  assert.equal(r.answered, true);
  assert.equal(r.lastCorrect, false);
  assert.equal(r.position, 0);
  assert.equal(r.chosen, 'pear');
  assert.equal(r.queue[1], 'banana');
});
test('invalid or completed practice snapshots cannot be resumed', () => {
  const s = sampleSession();
  assert.throws(() => validateSession({ ...s, position: 2 }));
  assert.throws(() => validateSession({ ...s, queue: ['missing-word'] }));
  assert.throws(() => validateSession({ ...s, options: ['apple', 'apple', 'pear', 'grape'] }));
  assert.throws(() => validateSession({ ...s, results: [] }));
});

test('all 96 original IDs remain valid, preserving every existing word record', () => {
  const ids = JSON.parse(readFileSync(new URL('./legacy-word-ids.json', import.meta.url), 'utf8'));
  assert.equal(ids.length, 96);
  for (const id of ids) assert.ok(wordMap.has(id), id);
});

test('cached audio serves exact, open-ended and suffix byte ranges and rejects invalid ones',async()=>{
 const {runInNewContext}=await import('node:vm');const context={self:{location:{href:'https://example.com/english/sw.js'},addEventListener(){}},URL,Response,Headers,Request};runInNewContext(readFileSync(new URL('./sw.js',import.meta.url),'utf8'),context);
 const response=()=>new Response('0123456789',{headers:{'Content-Type':'audio/mp4'}});
 const partial=await context.responseForRange(response(),'bytes=2-5');assert.equal(partial.status,206);assert.equal(partial.headers.get('Content-Range'),'bytes 2-5/10');assert.equal(partial.headers.get('Content-Length'),'4');assert.equal(await partial.text(),'2345');
 assert.equal(await(await context.responseForRange(response(),'bytes=7-')).text(),'789');assert.equal(await(await context.responseForRange(response(),'bytes=-3')).text(),'789');assert.equal((await context.responseForRange(response(),'bytes=20-')).status,416);assert.equal((await context.responseForRange(response(),'bytes=-0')).status,416);
});
test('range playback fetches and caches a full 200 response before returning a partial response',async()=>{
 const {runInNewContext}=await import('node:vm');let cachedStatus,requestRange;const context={self:{location:{href:'https://example.com/english/sw.js'},addEventListener(){}},URL,Response,Headers,Request,fetch:async request=>{requestRange=request.headers.get('range');return new Response('abcdefghij',{headers:{'Content-Type':'audio/mp4'}});}};
 runInNewContext(readFileSync(new URL('./sw.js',import.meta.url),'utf8'),context);
 const cache={match:async()=>undefined,put:async(_request,response)=>{cachedStatus=response.status;}};
 const response=await context.assetResponse(new Request('https://example.com/english/assets/audio/sample.m4a',{headers:{Range:'bytes=3-6'}}),cache);
 assert.equal(requestRange,null);assert.equal(cachedStatus,200);assert.equal(response.status,206);assert.equal(await response.text(),'defg');
 const fullCache={match:async()=>new Response('cached-audio',{headers:{'Content-Type':'audio/mp4'}})};
 assert.equal(await(await context.assetResponse(new Request('https://example.com/english/assets/audio/sample.m4a',{headers:{Range:'bytes=0-5'}}),fullCache)).text(),'cached');
});


test('photo rollback frees retired photos while retaining SVG, audio and unrelated cached assets', async () => {
  const { runInNewContext } = await import('node:vm');
  const handlers = {}, deleted = [], deletedCaches = [];
  const urls = [
    'https://example.com/english/assets/images/photo.jpg',
    'https://example.com/english/assets/images/photo.PNG?old=1',
    'https://example.com/english/assets/photos/original.webp',
    'https://example.com/english/assets/images/apple.svg',
    'https://example.com/english/assets/audio/apple.m4a',
    'https://example.com/another/assets/images/photo.jpg',
  ];
  let claimed = false;
  const context = {
    self: {
      location: { href: 'https://example.com/english/sw.js' },
      addEventListener: (type, handler) => { handlers[type] = handler; },
      clients: { claim: async () => { claimed = true; } },
    },
    URL,
    caches: {
      keys: async () => ['little-leaf-core-old', 'little-leaf-core-development', 'little-leaf-media-v2', 'unrelated'],
      delete: async key => { deletedCaches.push(key); },
      open: async key => {
        assert.equal(key, 'little-leaf-media-v2');
        return { keys: async () => urls.map(url => ({ url })), delete: async request => { deleted.push(request.url); } };
      },
    },
  };
  runInNewContext(readFileSync(new URL('./sw.js', import.meta.url), 'utf8'), context);
  let activation;
  handlers.activate({ waitUntil: promise => { activation = promise; } });
  await activation;
  assert.deepEqual(deleted, urls.slice(0, 3));
  assert.deepEqual(deletedCaches, ['little-leaf-core-old']);
  assert.ok(claimed);
});
