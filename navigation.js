import { categoryMap, wordMap } from './data.js';
import { sceneMap } from './scenes.js';
export const VIEW_KEY = 'little-leaf:view:v1';
export const DRAFT_KEY = 'little-leaf:drafts:v1';
export const LESSON_KEY = 'little-leaf:lesson:v1';
const pages = ['home', 'themes', 'review', 'progress', 'dialogues'];
const modes = ['cards', 'scene', 'listen', 'sentences', 'lesson'];
export function validateLesson(raw) {
  if (!raw || !Array.isArray(raw.ids) || !raw.ids.length || raw.ids.length > 5 ||
    new Set(raw.ids).size !== raw.ids.length || raw.ids.some(id => !wordMap.has(id))) return null;
  const sceneId = sceneMap.has(raw.sceneId) ? raw.sceneId : null;
  const categoryId = categoryMap.has(raw.categoryId) ? raw.categoryId : null;
  const pool = sceneId ? sceneMap.get(sceneId).wordIds :
    categoryId ? categoryMap.get(categoryId).words.map(w => w.id) : null;
  if (pool && raw.ids.some(id => !pool.includes(id))) return null;
  return { ids: raw.ids, sceneId, categoryId, completed: raw.completed === true };
}
export function validateView(raw) {
  if (!raw || !pages.includes(raw.page)) return null;
  const sceneId = sceneMap.has(raw.sceneId) ? raw.sceneId : null;
  const categoryId = categoryMap.has(raw.categoryId) || raw.categoryId === 'session' ? raw.categoryId : null;
  return {
    page: raw.page, sceneId, categoryId,
    mode: modes.includes(raw.mode) ? raw.mode : sceneId ? 'scene' : 'cards',
    themeView: raw.themeView === 'scenes' ? 'scenes' : 'topics',
    search: typeof raw.search === 'string' ? raw.search.slice(0,100) : '',
    allSearch: typeof raw.allSearch === 'string' ? raw.allSearch.slice(0,100) : '',
    filter: ['all','new','learned','favorites'].includes(raw.filter) ? raw.filter : 'all',
    shown: Number.isSafeInteger(raw.shown) ? Math.max(24, Math.min(wordMap.size, raw.shown)) : 24,
    index: Number.isSafeInteger(raw.index) ? Math.max(0,raw.index) : 0,
    scroll: Number.isFinite(raw.scroll) ? Math.max(0,Math.min(100000,raw.scroll)) : 0,
    selectedSceneWord: wordMap.has(raw.selectedSceneWord) ? raw.selectedSceneWord : null,
    lesson: validateLesson(raw.lesson),
    practice: raw.practice?.type === 'spell' ? null : raw.practice || null,
  };
}
export function routeFor(view) {
  if (view.sceneId) return '#/scene/' + encodeURIComponent(view.sceneId);
  if (view.categoryId && view.categoryId !== 'session') return '#/theme/' + encodeURIComponent(view.categoryId);
  if (view.page === 'themes' && view.themeView === 'scenes') return '#/scenes';
  return '#/' + view.page;
}
export function parseRoute(hash) {
  let parts;
  try { parts = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent); }
  catch { return { page: 'home' }; }
  if (parts[0] === 'scene' && sceneMap.has(parts[1]))
    return { page: 'themes', sceneId: parts[1], mode: 'scene', themeView:'scenes' };
  if (parts[0] === 'theme' && categoryMap.has(parts[1]))
    return { page: 'themes', categoryId: parts[1], mode: 'cards' };
  if (parts[0] === 'scenes') return { page:'themes', themeView:'scenes' };
  return { page: pages.includes(parts[0]) ? parts[0] : 'home' };
}
