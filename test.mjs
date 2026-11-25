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
  sentenceParts,
  quizOptions,
  dailyRoundSize,
  validateSession,
  contactWord,
  learningStats,
  lessonWords,
  perfectListeningRound,
} from './core.js';
import { validateLesson, validateView, routeFor, parseRoute } from './navigation.js';

test('the original fireworks sound is a small local M4A in the authoring media index', () => {
  assert.equal(audioSources.fireworks,'assets/audio/fireworks.m4a');
  const clip=readFileSync(new URL(audioSources.fireworks,import.meta.url));
  assert.ok(clip.length>1000 && clip.length<32768);
  assert.ok(clip.subarray(0,40).includes(Buffer.from('ftyp')));
});

test('orange fireworks require a completed ten-question listening round with every answer correct', () => {
  const round={type:'listen',queue:Array(10).fill('apple'),position:10,results:Array.from({length:10},()=>({correct:true}))};
  assert.equal(perfectListeningRound(round),true);
  assert.equal(perfectListeningRound({...round,position:9}),false);
  assert.equal(perfectListeningRound({...round,queue:round.queue.slice(0,3),position:3,results:round.results.slice(0,3)}),false);
  assert.equal(perfectListeningRound({...round,type:'spell'}),false);
  assert.equal(perfectListeningRound({...round,results:round.results.map((r,i)=>i===9?{correct:false}:r)}),false);
  assert.equal(perfectListeningRound({...round,results:[]}),false);
  assert.equal(perfectListeningRound(null),false);
});

test('first contact is idempotent and never changes scores, review records or daily counts', () => {
  const s = emptyState();
  assert.equal(contactWord(s, 'apple', 1794210000000), true);
  assert.equal(contactWord(s, 'apple', 1794210000100), false);
  assert.equal(contactWord(s, 'missing'), false);
  assert.deepEqual(s.records, {});
  assert.deepEqual(s.days, {});
  assert.deepEqual(learningStats(s), {contacted:1, practiced:0, mastered:0});
  answer(s, 'pear', true, 1794210000000);
  assert.deepEqual(learningStats(s), {contacted:2, practiced:1, mastered:0});
  contactWord(s, 'pear', 1794210000000);
  assert.equal(learningStats(s).contacted, 2);
  s.records.pear.level = 3;
  assert.equal(learningStats(s).mastered, 1);
});
test('contact footprints survive backup import and preserve the earliest encounter on merge', () => {
  const s = emptyState(), other = emptyState();
  contactWord(s, 'apple', 1794210000000);
  contactWord(other, 'apple', 1794200000000);
  contactWord(other, 'pear', 1794210000000);
  const imported = validateBackup(other);
  const merged = mergeBackup(s, imported);
  assert.equal(merged.contacts.apple, 1794200000000);
  assert.equal(merged.contacts.pear, 1794210000000);
  const legacy = emptyState(); delete legacy.contacts; delete legacy.settings.autoNext;
  assert.deepEqual(validateBackup(legacy).contacts, {});
  assert.equal(validateBackup(legacy).settings.autoNext, true);
  assert.throws(()=>validateBackup({...s, contacts:{apple:'yesterday'}}));
  assert.deepEqual(validateBackup({...s, contacts:{missing:1794210000000}}).contacts, {});
});
test('small lessons choose at most five unique words, prioritizing due and contacted words', () => {
  const s=emptyState(), now=1794210000000;
  answer(s, 'apple', true, now);
  answer(s, 'pear', false, now-86400000);
  contactWord(s, 'banana', now);
  const pool=['apple','orange','pear','banana','grape','lemon','peach','banana'].map(id=>wordMap.get(id));
  assert.deepEqual(lessonWords(s,pool,now).map(w=>w.id), ['pear','banana','orange','grape','lemon']);
});
test('strict lesson distractors stay inside the group, including groups smaller than four', () => {
  const pool=['apple','orange','banana'].map(id=>wordMap.get(id));
  for(const target of pool){
    const options=quizOptions(target,pool,()=>0.5,true);
    assert.equal(options.length,3);
    assert.ok(options.every(w=>pool.includes(w)));
    assert.equal(new Set(options.map(w=>w.imageKey)).size, options.length);
  }
});
test('lesson and view bookmarks validate context, deduplicate IDs and bound stored UI values', () => {
  const lesson={ids:['apple','banana'],sceneId:'supermarket',completed:false};
  assert.ok(validateLesson(lesson));
  assert.equal(validateLesson({...lesson,ids:['apple','apple']}),null);
  assert.equal(validateLesson({...lesson,sceneId:'bathroom'}),null);
  const view=validateView({page:'themes',sceneId:'supermarket',mode:'scene',scroll:Infinity,shown:999999,search:'x'.repeat(200),lesson});
  assert.equal(view.scroll,0);
  assert.equal(view.shown,526);
  assert.equal(view.search.length,100);
  assert.equal(view.lesson.ids.length,2);
  assert.equal(validateView({page:'unknown'}),null);
  const oldSpelling=validateView({page:'themes',sceneId:'supermarket',mode:'spell',practice:{type:'spell'}});
  assert.equal(oldSpelling.mode,'spell');
  assert.equal(oldSpelling.practice.type,'spell');
  assert.equal(validateView({page:'themes',categoryId:'fruit',mode:'spell'}).mode,'spell');
});
test('known scene, category and list routes round-trip and malformed hashes fall back safely', () => {
  for(const scene of sceneMap.values()){
    const view=parseRoute(routeFor({sceneId:scene.id}));
    assert.equal(view.sceneId,scene.id);
    assert.equal(view.mode,'scene');
  }
  for(const category of categories) assert.equal(parseRoute(routeFor({categoryId:category.id})).categoryId,category.id);
  assert.equal(parseRoute('#/scenes').themeView,'scenes');
  assert.equal(parseRoute('#/%E0%A4%A').page,'home');
  assert.equal(parseRoute('#/scene/missing').page,'home');
});

test('526 unique bilingual words across 27 themes have usable local illustrations and audio', () => {
  assert.equal(words.length, 526);
  assert.equal(categories.length, 27);
  assert.equal(new Set(words.map((w) => w.id)).size, 526);
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
    assert.equal(new Set(options.map((o) => o.imageKey)).size, 4, w.id);
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
test('lesson snapshots retain the same group and feedback and reject outside options', () => {
  const raw={...sampleSession(),source:'lesson',lessonIds:['apple','banana','pear'],pool:['apple','banana','pear'],options:['apple','banana','pear']};
  const r=validateSession(raw);
  assert.deepEqual(r.lessonIds,raw.lessonIds);
  assert.deepEqual(r.options,raw.options);
  assert.equal(r.answered,true);
  assert.equal(r.lastCorrect,false);
  assert.throws(()=>validateSession({...raw,options:['apple','banana','grape']}));
  assert.throws(()=>validateSession({...raw,lessonIds:['banana','pear']}));
  assert.throws(()=>validateSession({...raw,queue:['apple','banana','pear','grape']}));
});

test('all 96 original IDs remain valid, preserving every existing word record', () => {
  const ids = JSON.parse(readFileSync(new URL('./legacy-word-ids.json', import.meta.url), 'utf8'));
  assert.equal(ids.length, 96);
  for (const id of ids) assert.ok(wordMap.has(id), id);
});

test('cached audio serves exact, open-ended and suffix byte ranges and rejects invalid ones', async () => {
  const { runInNewContext } = await import('node:vm');
  const context = {
    self: { location: { href: 'https://example.com/english/sw.js' }, addEventListener() {} },
    URL,
    Response,
    Headers,
    Request,
  };
  runInNewContext(readFileSync(new URL('./sw.js', import.meta.url), 'utf8'), context);
  const response = () => new Response('0123456789', { headers: { 'Content-Type': 'audio/mp4' } });
  const partial = await context.responseForRange(response(), 'bytes=2-5');
  assert.equal(partial.status, 206);
  assert.equal(partial.headers.get('Content-Range'), 'bytes 2-5/10');
  assert.equal(partial.headers.get('Content-Length'), '4');
  assert.equal(await partial.text(), '2345');
  assert.equal(await (await context.responseForRange(response(), 'bytes=7-')).text(), '789');
  assert.equal(await (await context.responseForRange(response(), 'bytes=-3')).text(), '789');
  assert.equal((await context.responseForRange(response(), 'bytes=20-')).status, 416);
  assert.equal((await context.responseForRange(response(), 'bytes=-0')).status, 416);
});
test('range playback fetches and caches a full 200 response before returning a partial response', async () => {
  const { runInNewContext } = await import('node:vm');
  let cachedStatus, requestRange;
  const context = {
    self: { location: { href: 'https://example.com/english/sw.js' }, addEventListener() {} },
    URL,
    Response,
    Headers,
    Request,
    fetch: async (request) => {
      requestRange = request.headers.get('range');
      return new Response('abcdefghij', { headers: { 'Content-Type': 'audio/mp4' } });
    },
  };
  runInNewContext(readFileSync(new URL('./sw.js', import.meta.url), 'utf8'), context);
  const cache = {
    match: async () => undefined,
    put: async (_request, response) => {
      cachedStatus = response.status;
    },
  };
  const response = await context.assetResponse(
    new Request('https://example.com/english/assets/audio/sample.m4a', { headers: { Range: 'bytes=3-6' } }),
    cache,
  );
  assert.equal(requestRange, null);
  assert.equal(cachedStatus, 200);
  assert.equal(response.status, 206);
  assert.equal(await response.text(), 'defg');
  const fullCache = {
    match: async () => new Response('cached-audio', { headers: { 'Content-Type': 'audio/mp4' } }),
  };
  assert.equal(
    await (
      await context.assetResponse(
        new Request('https://example.com/english/assets/audio/sample.m4a', {
          headers: { Range: 'bytes=0-5' },
        }),
        fullCache,
      )
    ).text(),
    'cached',
  );
});

test('photo rollback frees retired photos while retaining SVG, audio and unrelated cached assets', async () => {
  const { runInNewContext } = await import('node:vm');
  const handlers = {},
    deleted = [],
    deletedCaches = [];
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
      addEventListener: (type, handler) => {
        handlers[type] = handler;
      },
      clients: {
        claim: async () => {
          claimed = true;
        },
      },
    },
    URL,
    caches: {
      keys: async () => [
        'little-leaf-core-old',
        'little-leaf-core-development',
        'little-leaf-media-v2',
        'unrelated',
      ],
      delete: async (key) => {
        deletedCaches.push(key);
      },
      open: async (key) => {
        assert.equal(key, 'little-leaf-media-v2');
        return {
          keys: async () => urls.map((url) => ({ url })),
          delete: async (request) => {
            deleted.push(request.url);
          },
        };
      },
    },
  };
  runInNewContext(readFileSync(new URL('./sw.js', import.meta.url), 'utf8'), context);
  let activation;
  handlers.activate({
    waitUntil: (promise) => {
      activation = promise;
    },
  });
  await activation;
  assert.deepEqual(deleted, urls.slice(0, 3));
  assert.deepEqual(deletedCaches, ['little-leaf-core-old']);
  assert.ok(claimed);
});

test('all example sentences can be reconstructed from a non-empty target blank', () => {
  for (const w of words) {
    const { before, target, after } = sentenceParts(w);
    assert.equal(before + target + after, w.sentence, w.id);
    assert.equal(target.toLowerCase(), w.word.toLowerCase(), w.id);
    assert.ok(matchesSpelling(w, target), w.id);
  }
  assert.throws(() => sentenceParts({ id: 'bad', word: 'apple', sentence: 'A different word.' }));
});
test('expanded numeric progression and original IDs remain available', () => {
  assert.equal(categories.find((c) => c.id === 'numbers').words.length, 32);
  assert.equal(categories.find((c) => c.id === 'fruit').words.length, 21);
  for (const id of [
    'zero',
    'thirteen',
    'twenty',
    'twenty-one',
    'forty',
    'hundred',
    'thousand',
    'mango',
    'papaya',
  ])
    assert.ok(wordMap.has(id));
});

test('sentence blank avoids matching a target inside another word', () => {
  assert.equal(
    sentenceParts({ id: 'ear', word: 'ear', sentence: 'I hear with my ear.' }).before,
    'I hear with my ',
  );
  assert.equal(
    sentenceParts({ id: 'one', word: 'one', sentence: 'Someone has one apple.' }).before,
    'Someone has ',
  );
});

test('eight bilingual dialogues contain three unambiguous response checks and complete local audio', async () => {
  const { dialogues } = await import('./dialogues.js');
  assert.equal(dialogues.length, 8);
  assert.equal(new Set(dialogues.map((d) => d.id)).size, 8);
  assert.equal(dialogues.filter((d) => d.group === '购物').length, 4);
  assert.equal(dialogues.filter((d) => d.group === '点餐').length, 4);
  for (const d of dialogues) {
    assert.equal(d.lines.length, 6, d.id);
    for (const [i, line] of d.lines.entries()) {
      assert.ok(line.en && line.zh && line.role, d.id);
      const bytes = readFileSync(new URL(line.audio, import.meta.url));
      assert.ok(bytes.length > 1000);
      assert.ok(bytes.subarray(0, 40).includes(Buffer.from('ftyp')));
      if (i % 2) {
        assert.equal(line.options.length, 3);
        assert.equal(new Set(line.options.map((o) => o.en)).size, 3);
        assert.equal(line.options.filter((o) => o.en === line.en && o.zh === line.zh).length, 1);
      }
    }
  }
});

// Scene data and all reference mappings are part of the shipped content contract.
import { scenes, sceneMap, alphabet } from './scenes.js';
import { extraWords } from './scene-content.js';
import { createHash } from 'node:crypto';
test('all 340 previous words retain their IDs', () => {
  const ids = JSON.parse(readFileSync(new URL('./baseline-word-ids.json', import.meta.url)));
  assert.equal(ids.length, 340);
  for (const id of ids) assert.ok(wordMap.has(id), id);
  assert.equal(extraWords.length, 186);
  assert.equal(new Set([...ids, ...extraWords.map(w => w.id)]).size, 526);
});
test('13 scenes cover every readable reference label with canonical words', () => {
  assert.equal(scenes.length, 13);
  assert.equal(sceneMap.size, 13);
  const ledger = JSON.parse(readFileSync(new URL('./reference-vocabulary.json', import.meta.url)));
  assert.equal(ledger.entries.length, 281);
  assert.equal(new Set(ledger.entries.map(e => e.photo)).size, 13);
  for (const s of scenes) {
    assert.ok(s.wordIds.length > 0);
    assert.equal(new Set(s.wordIds).size, s.wordIds.length);
    for (const id of s.wordIds) assert.ok(wordMap.has(id), `${s.id}: ${id}`);
    assert.deepEqual(s.wordIds, [...new Set(s.groups.flatMap(g => g.items.map(i => i.wordId)))]);
    for (const target of s.wordIds.map(id => wordMap.get(id))) {
      const options = quizOptions(target, s.wordIds.map(id => wordMap.get(id)));
      const hashes = options.map(w => createHash('sha256').update(readFileSync(new URL(imagePath(w), import.meta.url))).digest('hex'));
      assert.equal(new Set(hashes).size, 4, `Duplicate scene picture: ${target.id}`);
      assert.equal(options.filter(w => matchesSpelling(target, w.word)).length, 1);
    }
  }
  for (const e of ledger.entries) {
    assert.ok(sceneMap.get(e.sceneId).wordIds.includes(e.wordId));
    assert.equal(wordMap.get(e.wordId).word, e.english);
    assert.ok(e.originalEnglish && e.originalChinese);
  }
});
test('letter names have separate local clips and the exact A–Z reference examples', () => {
  const expected = 'acorn balloon can door envelope fan gift hourglass ice juice key lock mop net owl pumpkin queen ring sunglasses tea umbrella vase watch x-ray yo-yo zipper'.split(' ');
  assert.equal(alphabet.length, 26);
  assert.deepEqual(alphabet.map(l => l.wordId), expected);
  for (const [i, l] of alphabet.entries()) {
    assert.equal(l.upper, String.fromCharCode(65 + i));
    assert.equal(l.lower, l.upper.toLowerCase());
    assert.ok(!wordMap.has(l.audioId));
    const audio = readFileSync(new URL(audioSources[l.audioId], import.meta.url));
    assert.ok(audio.length > 1000 && audio.subarray(0,40).includes(Buffer.from('ftyp')));
  }
});
test('scene sessions preserve source, scope, return position and answered feedback', () => {
  const raw = { ...sampleSession(), source: 'scene', sceneId: 'supermarket', categoryId: 'scene:supermarket', sceneScroll: 520 };
  const restored = validateSession(raw);
  assert.equal(restored.sceneId, 'supermarket');
  assert.equal(restored.sceneScroll, 520);
  assert.equal(restored.answered, true);
  assert.equal(restored.chosen, 'pear');
  assert.equal(restored.correct, 0);
  assert.equal(validateSession({...raw, source:'retry'}).sceneId, 'supermarket');
  assert.throws(() => validateSession({...raw, sceneId:'missing'}));
  assert.throws(() => validateSession({...raw, sceneId:null}));
  assert.throws(() => validateSession({...raw, sceneId:'bedroom'}));
  assert.equal(validateSession(sampleSession()).sceneId, null);
});
test('a previous scene retry can retain distractors from its full scene with a one-word target pool', () => {
  const raw={...sampleSession(),source:'retry',sceneId:'supermarket',categoryId:'scene:supermarket',queue:['apple'],pool:['apple']};
  assert.equal(validateSession(raw).options.length,4);
  assert.throws(()=>validateSession({...raw,options:['apple','banana','pear','toilet']}));
});
test('family relations share progress and chicken food has its own meaning', () => {
  const family = sceneMap.get('family');
  const labels = family.groups.flatMap(g => g.items).filter(i => i.wordId === 'grandfather');
  assert.deepEqual(labels.map(i => i.label), ['爷爷','外公']);
  assert.equal(wordMap.get('chicken').zh, '鸡');
  assert.equal(wordMap.get('chicken-meat').zh, '鸡肉');
  assert.ok(matchesSpelling(wordMap.get('airplane'), 'plane'));
  assert.ok(matchesSpelling(wordMap.get('grandfather'), 'grandpa'));
  assert.ok(matchesSpelling(wordMap.get('cinema'), 'cinema'));
  assert.ok(!matchesSpelling(wordMap.get('me'), 'I'));
});

const illustrationManifest = JSON.parse(readFileSync(new URL('./illustration-sources.json', import.meta.url)));
const illustrationReview = JSON.parse(readFileSync(new URL('./illustration-review.json', import.meta.url)));
test('reviewed Flat illustrations retain pinned, verifiable sources and a local MIT notice', () => {
  assert.equal(illustrationManifest.revision, '1ffb34c752ecf5d402f04cfb4b392c77f57c54bc');
  assert.equal(illustrationManifest.license, 'MIT');
  assert.equal(Object.keys(illustrationManifest.images).length, 322);
  for (const [id, entry] of Object.entries(illustrationManifest.images)) {
    assert.ok(wordMap.has(id), id);
    assert.match(entry.path, /^assets\/.+\/Flat\/.+\.svg$/);
    assert.ok(!entry.path.includes('..'));
    assert.ok(entry.bytes > 0 && entry.bytes <= 12000);
    const svg = readFileSync(new URL(imagePath(wordMap.get(id)), import.meta.url));
    assert.equal(svg.length, entry.bytes, id);
    assert.equal(createHash('sha256').update(svg).digest('hex'), entry.sha256, id);
    assert.doesNotMatch(svg.toString('utf8'), /<script\b|<foreignObject\b|\bon\w+\s*=|(?:href|src)\s*=\s*["'](?:https?:|data:)/i);
  }
  const license = readFileSync(new URL('./licenses/fluent-emoji-LICENSE.txt', import.meta.url), 'utf8');
  assert.ok(license.includes('MIT License') && license.includes('Microsoft Corporation'));
});
test('every word has an audited image decision and a current content fingerprint', () => {
  assert.equal(illustrationReview.entries.length, 526);
  assert.equal(new Set(illustrationReview.entries.map(r => r.wordId)).size, 526);
  assert.equal(illustrationReview.entries.filter(r => r.decision === 'replaced').length, 322);
  assert.equal(illustrationReview.entries.filter(r => r.decision === 'retained').length, 204);
  let total = 0;
  for (const row of illustrationReview.entries) {
    const w = wordMap.get(row.wordId);
    assert.ok(w && row.reason);
    const svg = readFileSync(new URL(imagePath(w), import.meta.url));
    const sha = createHash('sha256').update(svg).digest('hex');
    assert.equal(sha, row.afterSha256, row.wordId);
    assert.equal(w.imageKey, sha.slice(0,12), row.wordId);
    if (row.decision === 'retained') assert.equal(row.beforeSha256, row.afterSha256);
    else assert.notEqual(row.beforeSha256, row.afterSha256);
    total += svg.length;
  }
  assert.equal(total, illustrationReview.summary.afterBytes);
  assert.ok(total < 1024 * 1024, 'Keep the complete 526-card SVG collection under 1 MiB');
});
test('quiz pictures are deduplicated by actual image content rather than emoji labels', () => {
  const target = wordMap.get('apple');
  const duplicate = { ...wordMap.get('pear'), imageKey: target.imageKey, emoji: 'different-label' };
  const options = quizOptions(target, [target, duplicate], () => 0.5);
  assert.ok(!options.includes(duplicate));
  assert.equal(new Set(options.map(w => w.imageKey)).size, 4);
  assert.equal(wordMap.get('coffee').imageKey, wordMap.get('cup').imageKey);
  assert.ok(!quizOptions(wordMap.get('cup'), words).some(w => w.id === 'coffee'));
});

// The small daily lesson and rewards share the existing version-1 progress.
import { dailyPlan, allocateLesson, homeGuide, learningRewards, validateDialogueRound } from './learning.js';
import { dialogues as learningDialogues } from './dialogues.js';
test('daily allocation is stable, limited to five across themes, and rolls over by local date',()=>{
 const s=emptyState(),date=new Date(2026,10,22,23,50),pool=words.slice(0,12);
 assert.equal(allocateLesson(s,pool.slice(0,2),date).length,2);
 assert.equal(allocateLesson(s,pool,date).length,3);
 const ids=[...dailyPlan(s,date).ids];assert.equal(new Set(ids).size,5);
 assert.deepEqual(allocateLesson(s,words,date),[]);
 assert.deepEqual(dailyPlan(validateBackup(s),date).ids,ids);
 assert.equal(dailyPlan(s,new Date(2026,10,23,0,1)).remaining,5);
 assert.deepEqual(s.records,{});assert.deepEqual(s.days,{});
});
test('daily lessons prefer genuinely new words, do not allocate previously contacted words as new',()=>{
 const s=emptyState(),date=new Date(2026,10,22);
 contactWord(s,'apple',date.getTime());
 assert.deepEqual(allocateLesson(s,['apple','pear','banana'].map(id=>wordMap.get(id)),date).map(w=>w.id),['pear','banana']);
});
test('home priority respects pending quiz, unfinished lesson, review and daily cap',()=>{
 const s=emptyState(),now=new Date(2026,10,22),lesson={ids:['apple'],completed:false},pending={type:'listen',position:0,queue:['apple']};
 assert.equal(homeGuide(s,pending,lesson,false,now).kind,'resume');
 assert.equal(homeGuide(s,{...pending,type:'spell'},lesson,false,now).kind,'lesson-resume');
 assert.equal(homeGuide(s,{...pending,type:'spell'},lesson,true,now).kind,'resume');
 answer(s,'apple',false,now.getTime()-86400000);
 assert.equal(homeGuide(s,null,null,false,now).kind,'due');
 s.records={};allocateLesson(s,words,now);
 assert.equal(homeGuide(s,null,null,false,now).kind,'scene-list');
});
test('stars use formal daily counts retroactively, once per day, without streak penalties',()=>{
 const s=emptyState();s.days={'2026-11-01':3,'2026-11-03':300,'2026-11-22':2};
 let r=learningRewards(s,new Date(2026,10,22));assert.equal(r.stars,2);assert.equal(r.today,2);assert.equal(r.stickers.filter(v=>v.unlocked).length,1);
 s.days['2026-11-22']=3;r=learningRewards(s,new Date(2026,10,22));assert.equal(r.stars,3);assert.equal(r.stickers.filter(v=>v.unlocked).length,2);
 assert.equal(learningRewards(s,new Date(2026,11,1)).stars,3);
});
test('new optional progress fields are validated and merge without replacing the current daily assignment',()=>{
 const a=emptyState(),b=emptyState();a.dailyLessonWords={'2026-11-22':['apple']};b.dailyLessonWords={'2026-11-22':['pear'],'2026-11-21':['banana']};
 const id=learningDialogues[0].id;a.dialogueCompletions[id]={completedAt:1794210000000,bestCorrect:3};b.dialogueCompletions[id]={completedAt:1794210000100,bestCorrect:1};
 const merged=mergeBackup(a,b);assert.deepEqual(merged.dailyLessonWords['2026-11-22'],['apple']);assert.deepEqual(merged.dailyLessonWords['2026-11-21'],['banana']);assert.equal(merged.dialogueCompletions[id].bestCorrect,3);
 for(const bad of [{'2026-02-30':['apple']},{'2026-11-22':['apple','apple']},{'2026-11-22':['missing']},{'2026-11-22':words.slice(0,6).map(w=>w.id)}])assert.throws(()=>validateBackup({...a,dailyLessonWords:bad}));
 const old=emptyState();delete old.dailyLessonWords;delete old.dialogueCompletions;old.settings.rate=.85;old.settings.autoNext=false;
 assert.equal(validateBackup(old).settings.rate,.85);assert.equal(validateBackup(old).settings.autoNext,false);assert.deepEqual(validateBackup(old).dailyLessonWords,{});
 assert.equal(emptyState().settings.rate,1);
});
test('dialogue draft validates ordered first answers, canonical options and completion, rejecting corruption',()=>{
 const d=learningDialogues[0],options=d.lines[1].options;
 const initial={steps:[0,1,2],position:0,answered:false,chosen:null,options,results:[],correct:99};
 assert.equal(validateDialogueRound(d.id,initial).correct,0);
 const answered={...initial,answered:true,chosen:0,results:[{step:0,correct:false}]};assert.equal(validateDialogueRound(d.id,answered).correct,0);
 assert.equal(validateDialogueRound(d.id,{...answered,results:[]}),null);
 assert.equal(validateDialogueRound(d.id,{...initial,options:[...options.slice(1),{en:'injected',zh:'bad'}]}),null);
 assert.equal(validateDialogueRound(d.id,{...initial,steps:[0,0]}),null);
 const done={...answered,position:3,results:[0,1,2].map(step=>({step,correct:true})),options:d.lines[5].options};assert.equal(validateDialogueRound(d.id,done).step,3);
});

import { compactM4a } from './compact-m4a.mjs';
test('M4A compaction preserves AAC payload and patches chunk offsets without another lossy encode',()=>{
 const atom=(name,data=Buffer.alloc(0))=>{const b=Buffer.alloc(8+data.length);b.writeUInt32BE(b.length);b.write(name,4);data.copy(b,8);return b;};
 const stcoData=Buffer.alloc(12);stcoData.writeUInt32BE(1,4);
 const moov=()=>atom('moov',atom('trak',atom('mdia',atom('minf',atom('stbl',atom('stco',stcoData))))));
 const ftyp=atom('ftyp',Buffer.from('M4A ')),free=atom('free',Buffer.alloc(2048)),payload=Buffer.from([1,3,5,7,9]);
 stcoData.writeUInt32BE(ftyp.length+moov().length+free.length+8,8);
 const before=Buffer.concat([ftyp,moov(),free,atom('mdat',payload)]),after=compactM4a(before);
 assert.equal(after.length,before.length-free.length);
 const stco=after.indexOf(Buffer.from('stco'));const offset=after.readUInt32BE(stco+12);
 assert.deepEqual(after.subarray(offset),payload);
 assert.deepEqual(compactM4a(after),after);
});
test('dialogue draft corruption fails safely when a stored option is null',()=>{
 const d=learningDialogues[0];assert.equal(validateDialogueRound(d.id,{steps:[0],position:0,answered:false,options:[null],results:[]}),null);
});
import { recordPracticeAnswer } from './core.js';
test('gentle correction rounds leave daily counts, first scores and review schedule unchanged, including after draft validation',()=>{
 const s=emptyState(),now=1794210000000;answer(s,'apple',false,now);const before=structuredClone(s);
 const raw={version:1,type:'listen',source:'retry',retryOnly:true,queue:['apple'],pool:['apple','pear','banana','grape'],position:0,answered:false,results:[],options:['apple','pear','banana','grape']};
 const draft=validateSession(raw);assert.equal(draft.retryOnly,true);
 assert.equal(recordPracticeAnswer(s,draft,'apple',true,now+100),false);assert.deepEqual(s,before);
 assert.equal(validateSession({...raw,source:'theme'}).retryOnly,false);
 recordPracticeAnswer(s,{retryOnly:false},'pear',true,now);assert.equal(s.records.pear.seen,1);
});

import { wordWindow, WORD_BATCH, SMALL_WORD_LIST } from './learning.js';
test('small word lists display completely, including filtered results and the threshold boundary',()=>{
 for(const count of [0,1,8,12,21,32])assert.equal(wordWindow(count),count);
 assert.equal(SMALL_WORD_LIST,32);assert.equal(wordWindow(12,500),12);
});
test('large word lists load in bounded batches and preserve expanded bookmark counts',()=>{
 assert.equal(wordWindow(85),WORD_BATCH);
 assert.equal(wordWindow(85,WORD_BATCH*2),32);
 assert.equal(wordWindow(85,80+WORD_BATCH),85);
 assert.equal(wordWindow(526,64),64);
 assert.equal(wordWindow(85,8),16);
 assert.equal(wordWindow(85,NaN),16);
 assert.equal(wordWindow(85,999),85);
 assert.equal(wordWindow(-1),0);
});

import { createAutoAdvance } from './auto-next.js';
function autoNextHarness(overrides={}){
 let now=0,id=0;const timers=new Map(),callbacks=[],advances=[];
 const context={enabled:true,mode:'listen',session:{type:'listen',queue:['apple','pear','banana'],position:0,answered:true,lastCorrect:true},playing:false,blocked:false,hidden:false,...overrides};
 const control=createAutoAdvance({read:()=>context,advance:()=>{advances.push(context.session.position);context.session.position++;context.session.answered=false;},
  setTimer:(fn,delay)=>{const key=++id;timers.set(key,{fn,at:now+delay});callbacks.push(fn);return key;},clearTimer:key=>timers.delete(key)});
 return{context,control,advances,callbacks,tick(ms){const end=now+ms;for(;;){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;now=next[1].at;timers.delete(next[0]);next[1].fn();}now=end;}};
}
test('correct listening answers advance once after 1500ms, never before or twice',()=>{
 const h=autoNextHarness();h.control.schedule();h.tick(1499);assert.deepEqual(h.advances,[]);h.tick(1);assert.deepEqual(h.advances,[0]);h.tick(5000);assert.deepEqual(h.advances,[0]);
});
test('wrong answers, manual preference, spelling, and unanswered questions never auto-advance',()=>{
 for(const change of [{enabled:false},{mode:'spell'},{session:{type:'listen',queue:['apple'],position:0,answered:true,lastCorrect:false}},{session:{type:'listen',queue:['apple'],position:0,answered:false,lastCorrect:true}}]){
  const h=autoNextHarness(change);h.control.schedule();h.tick(10000);assert.deepEqual(h.advances,[]);
 }
});
test('restored answered questions restart their countdown, including the last question',()=>{
 const h=autoNextHarness({session:{type:'listen',queue:['apple','pear','banana'],position:2,answered:true,lastCorrect:true}});
 h.control.schedule();h.tick(1500);assert.deepEqual(h.advances,[2]);assert.equal(h.context.session.position,3);
 h.control.schedule();h.tick(1500);assert.deepEqual(h.advances,[2]);
});
test('replay cancels the previous countdown and resumes only after audio ends or fails',()=>{
 for(const completion of ['ended','failed']){
  const h=autoNextHarness();h.control.schedule();h.tick(1000);h.control.cancel();h.context.playing=true;h.control.schedule();h.tick(5000);assert.deepEqual(h.advances,[],completion);
  h.context.playing=false;h.control.schedule();h.tick(1499);assert.deepEqual(h.advances,[]);h.tick(1);assert.deepEqual(h.advances,[0],completion);
 }
});
test('modal and hidden-page pauses resume with a fresh full countdown',()=>{
 for(const flag of ['blocked','hidden']){
  const h=autoNextHarness();h.control.schedule();h.tick(1200);h.context[flag]=true;h.control.cancel();h.control.schedule();h.tick(5000);assert.deepEqual(h.advances,[]);
  h.context[flag]=false;h.control.schedule();h.tick(1499);assert.deepEqual(h.advances,[]);h.tick(1);assert.deepEqual(h.advances,[0]);
 }
});
test('a stale queued timer cannot advance after cancellation, rescheduling or manual next',()=>{
 const h=autoNextHarness();h.control.schedule();const stale=h.callbacks[0];h.control.cancel();h.control.schedule();stale();assert.deepEqual(h.advances,[]);h.tick(1500);assert.deepEqual(h.advances,[0]);
 const moved=autoNextHarness();moved.control.schedule();moved.context.session.position=1;moved.tick(1500);assert.deepEqual(moved.advances,[]);
});
test('timer completion rechecks settings, playback, visibility, mode and session identity',()=>{
 const changes=[c=>c.enabled=false,c=>c.playing=true,c=>c.hidden=true,c=>c.blocked=true,c=>c.mode='cards',c=>c.session={...c.session},c=>c.session=null];
 for(const change of changes){const h=autoNextHarness();h.control.schedule();change(h.context);h.tick(1500);assert.deepEqual(h.advances,[]);}
});

import { lessonExploreAction } from './learning.js';
test('fruit lessons route directly to the supermarket from completion and the home guide',()=>{
 const lesson={ids:['apple','banana','grape','pear','orange'],categoryId:'fruit',completed:true};
 assert.equal(lessonExploreAction(lesson),'scene:supermarket');
 assert.equal(lessonExploreAction({ids:lesson.ids}),'scene:supermarket');
 assert.equal(lessonExploreAction({ids:['apple','car']}),'scene-list');
 assert.equal(lessonExploreAction(null),'scene-list');
 const state=emptyState(),date=new Date(2026,10,25);state.dailyLessonWords={'2026-11-25':lesson.ids};
 assert.equal(homeGuide(state,null,lesson,false,date).kind,'scene:supermarket');
 assert.equal(homeGuide(state,null,{...lesson,completed:false},false,date).kind,'lesson-resume');
});

test('learning topics route to appropriate existing scenes',()=>{
 const cases={fruit:'supermarket',vegetables:'supermarket',wild:'zoo',farm:'farm',food:'mealtime',drinks:'mealtime',clothes:'clothes',transport:'vehicles',places:'city',family:'family','alphabet-words':'alphabet'};
 for(const [topic,scene] of Object.entries(cases)){
  const ids=categories.find(c=>c.id===topic).words.slice(0,5).map(w=>w.id);
  assert.ok(sceneMap.has(scene));
  assert.equal(lessonExploreAction({categoryId:topic,ids}),`scene:${scene}`,topic);
  assert.equal(lessonExploreAction({ids}),`scene:${scene}`,topic+' inferred from saved words');
 }
});
test('home lessons choose the matching room and scene-based lessons keep their original context',()=>{
 const cases={bedroom:['bed','pillow','quilt'],bathroom:['soap','toothbrush','toothpaste'],kitchen:['pan','spatula','kettle'],'living-room':['sofa','television','remote-control'],mealtime:['spoon','plate','fork']};
 for(const [scene,ids] of Object.entries(cases))assert.equal(lessonExploreAction({categoryId:'home',ids}),`scene:${scene}`);
 assert.equal(lessonExploreAction({categoryId:'home',ids:['house']}),'scene:living-room');
 assert.equal(lessonExploreAction({sceneId:'farm',categoryId:'wild',ids:['rabbit']}),'scene:farm');
});
test('unrelated lessons retain scene selection and mixed relevant words can share a real scene',()=>{
 for(const topic of ['music','shapes','colors','numbers','body']){
  const ids=categories.find(c=>c.id===topic).words.slice(0,5).map(w=>w.id);
  assert.equal(lessonExploreAction({categoryId:topic,ids}),'scene-list',topic);
 }
 assert.equal(lessonExploreAction({ids:['apple','tomato','banana']}),'scene:supermarket');
 assert.equal(lessonExploreAction({ids:['apple','car']}),'scene-list');
});
test('home exploration uses the same destination and describes it without changing resume priority',()=>{
 for(const [topic,scene] of [['wild','zoo'],['food','mealtime'],['clothes','clothes']]){
  const ids=categories.find(c=>c.id===topic).words.slice(0,5).map(w=>w.id),lesson={ids,categoryId:topic,completed:true},state=emptyState(),date=new Date(2026,10,25);
  state.dailyLessonWords={'2026-11-25':ids};
  const guide=homeGuide(state,null,lesson,false,date);assert.equal(guide.kind,`scene:${scene}`);assert.ok(guide.note.includes(sceneMap.get(scene).name));
  assert.equal(homeGuide(state,null,{...lesson,completed:false},false,date).kind,'lesson-resume');
 }
});
