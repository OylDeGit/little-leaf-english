import { imageSources } from './media.js';
import { vocabulary } from './vocabulary.js';
export const categories = vocabulary;
export const words = categories.flatMap((c) => c.words);
export const wordMap = new Map(words.map((w) => [w.id, w]));
export const categoryMap = new Map(categories.map((c) => [c.id, c]));
export function imagePath(w) {
  return imageSources[w.id];
}
