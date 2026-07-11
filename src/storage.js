import { rankTimes } from './logic.js';

const KEY = 'slime-quest-ranking-v1';

export function loadRanking(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(KEY) ?? '[]');
    return rankTimes(Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}

export function saveTime(seconds, storage = globalThis.localStorage) {
  const ranking = rankTimes([...loadRanking(storage), seconds]);
  storage.setItem(KEY, JSON.stringify(ranking));
  return ranking;
}
