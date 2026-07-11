import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRanking, saveTime } from '../src/storage.js';

class MemoryStorage {
  constructor() { this.data = new Map(); }
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, value); }
}

test('saveTime persists the best five times', () => {
  const storage = new MemoryStorage();
  [20, 11, 18, 9, 14, 30].forEach((time) => saveTime(time, storage));
  assert.deepEqual(loadRanking(storage), [9, 11, 14, 18, 20]);
});

test('loadRanking survives invalid JSON', () => {
  const storage = new MemoryStorage();
  storage.setItem('slime-quest-ranking-v1', '{bad');
  assert.deepEqual(loadRanking(storage), []);
});
