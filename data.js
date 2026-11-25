import { imageSources, imageKeys } from './media.js';
import { vocabulary } from './vocabulary.js';
export const categories = vocabulary;
// Display order does not change daily lesson allocation or stored category IDs.
export const topicCategories = [...categories.filter(c => c.id === 'numbers'), ...categories.filter(c => c.id !== 'numbers')];
export const words = categories.flatMap((c) => c.words);
for (const word of words) word.imageKey = imageKeys[word.id];
export const wordMap = new Map(words.map((w) => [w.id, w]));
export const categoryMap = new Map(categories.map((c) => [c.id, c]));
export function imagePath(w) {
  return imageSources[w.id];
}
