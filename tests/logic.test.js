import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp, createLevel, formatTime, intersects, rankTimes } from '../src/logic.js';

test('clamp keeps a value in range', () => {
  assert.equal(clamp(-2, 0, 10), 0);
  assert.equal(clamp(4, 0, 10), 4);
  assert.equal(clamp(12, 0, 10), 10);
});

test('intersects detects overlapping rectangles', () => {
  assert.equal(intersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 9, w: 3, h: 3 }), true);
  assert.equal(intersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 3, h: 3 }), false);
});

test('rankTimes filters, sorts and limits records', () => {
  assert.deepEqual(rankTimes([12.5, NaN, -1, 8.1, 10, 7.9], 3), [7.9, 8.1, 10]);
});

test('formatTime returns one decimal place', () => {
  assert.equal(formatTime(12.345), '12.3');
  assert.equal(formatTime(-1), '--');
});

test('level contains a reachable objective and collectibles', () => {
  const level = createLevel();
  assert.ok(level.worldWidth > 960);
  assert.ok(level.coins.length >= 10);
  assert.ok(level.goal.x < level.worldWidth);
  assert.ok(level.platforms.length > 0);
});
