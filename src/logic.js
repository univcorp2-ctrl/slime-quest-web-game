export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '--';
  return seconds.toFixed(1);
}

export function rankTimes(times, limit = 5) {
  return [...times]
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b)
    .slice(0, limit);
}

export function createLevel() {
  return {
    worldWidth: 3150,
    groundY: 470,
    platforms: [
      { x: 0, y: 470, w: 680, h: 100 },
      { x: 770, y: 470, w: 540, h: 100 },
      { x: 1430, y: 470, w: 660, h: 100 },
      { x: 2180, y: 470, w: 970, h: 100 },
      { x: 430, y: 350, w: 210, h: 28 },
      { x: 850, y: 330, w: 190, h: 28 },
      { x: 1130, y: 250, w: 185, h: 28 },
      { x: 1510, y: 340, w: 240, h: 28 },
      { x: 1810, y: 270, w: 190, h: 28 },
      { x: 2260, y: 350, w: 220, h: 28 },
      { x: 2550, y: 265, w: 210, h: 28 }
    ],
    coins: [
      [260,420],[470,300],[580,300],[850,420],[930,280],[1210,200],[1510,420],
      [1610,290],[1710,290],[1870,220],[2280,420],[2370,300],[2630,215],[2730,215],[2910,420]
    ].map(([x,y]) => ({ x, y, r: 11, collected: false })),
    hazards: [
      { x: 685, y: 448, w: 80, h: 22 },
      { x: 1320, y: 448, w: 100, h: 22 },
      { x: 2100, y: 448, w: 70, h: 22 }
    ],
    enemies: [
      { x: 1000, y: 428, w: 44, h: 42, minX: 820, maxX: 1250, vx: 1.25 },
      { x: 1650, y: 298, w: 44, h: 42, minX: 1520, maxX: 1700, vx: 1.1 },
      { x: 2460, y: 428, w: 44, h: 42, minX: 2210, maxX: 2680, vx: 1.45 }
    ],
    goal: { x: 3030, y: 374, w: 58, h: 96 }
  };
}
