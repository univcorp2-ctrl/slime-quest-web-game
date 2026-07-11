import { clamp, createLevel, formatTime, intersects } from './logic.js';

const W = 960;
const H = 540;
const GRAVITY = 0.72;
const MOVE_SPEED = 5.2;
const JUMP_SPEED = 14.2;

export class SlimeQuest {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;
    this.keys = { left: false, right: false, jump: false };
    this.muted = false;
    this.audio = null;
    this.animationId = null;
    this.state = 'ready';
    this.reset();
  }

  reset() {
    this.level = createLevel();
    this.player = { x: 95, y: 400, w: 54, h: 54, vx: 0, vy: 0, grounded: false, invincible: 0, face: 1 };
    this.cameraX = 0;
    this.lives = 3;
    this.startedAt = 0;
    this.elapsed = 0;
    this.lastFrame = performance.now();
    this.jumpLatch = false;
    this.callbacks.onUpdate?.(this.snapshot());
    this.draw();
  }

  snapshot() {
    const collected = this.level.coins.filter((coin) => coin.collected).length;
    return { state: this.state, lives: this.lives, collected, totalCoins: this.level.coins.length, elapsed: this.elapsed };
  }

  start() {
    this.cancelFrame();
    this.reset();
    this.state = 'playing';
    this.startedAt = performance.now();
    this.lastFrame = this.startedAt;
    this.beep(440, .06);
    this.loop(this.lastFrame);
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.callbacks.onState?.('paused', this.snapshot());
      this.draw();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.startedAt = performance.now() - this.elapsed * 1000;
      this.lastFrame = performance.now();
      this.callbacks.onState?.('playing', this.snapshot());
      this.loop(this.lastFrame);
    }
  }

  setControl(control, active) { this.keys[control] = active; }
  setMuted(muted) { this.muted = muted; }
  cancelFrame() { if (this.animationId) cancelAnimationFrame(this.animationId); this.animationId = null; }

  loop = (now) => {
    if (this.state !== 'playing') return;
    const dt = clamp((now - this.lastFrame) / 16.667, 0.25, 2);
    this.lastFrame = now;
    this.elapsed = (now - this.startedAt) / 1000;
    this.update(dt);
    this.draw();
    this.callbacks.onUpdate?.(this.snapshot());
    this.animationId = requestAnimationFrame(this.loop);
  };

  update(dt) {
    const p = this.player;
    const previousY = p.y;
    p.vx = this.keys.left ? -MOVE_SPEED : this.keys.right ? MOVE_SPEED : p.vx * .72;
    if (Math.abs(p.vx) < .08) p.vx = 0;
    if (p.vx !== 0) p.face = Math.sign(p.vx);

    if (this.keys.jump && p.grounded && !this.jumpLatch) {
      p.vy = -JUMP_SPEED;
      p.grounded = false;
      this.jumpLatch = true;
      this.beep(620, .05);
    }
    if (!this.keys.jump) this.jumpLatch = false;

    p.vy += GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.x = clamp(p.x, 0, this.level.worldWidth - p.w);
    p.grounded = false;

    for (const platform of this.level.platforms) {
      const crossedTop = previousY + p.h <= platform.y + 4 && p.y + p.h >= platform.y;
      const horizontallyInside = p.x + p.w > platform.x && p.x < platform.x + platform.w;
      if (p.vy >= 0 && crossedTop && horizontallyInside) {
        p.y = platform.y - p.h;
        p.vy = 0;
        p.grounded = true;
      }
    }

    if (p.y > H + 120) this.damage(true);
    if (p.invincible > 0) p.invincible -= dt;

    for (const coin of this.level.coins) {
      if (!coin.collected && intersects(p, { x: coin.x - coin.r, y: coin.y - coin.r, w: coin.r * 2, h: coin.r * 2 })) {
        coin.collected = true;
        this.beep(880, .04);
      }
    }

    for (const hazard of this.level.hazards) if (intersects(p, hazard)) this.damage(false);
    for (const enemy of this.level.enemies) {
      enemy.x += enemy.vx * dt;
      if (enemy.x < enemy.minX || enemy.x > enemy.maxX) enemy.vx *= -1;
      if (intersects(p, enemy)) this.damage(false);
    }

    const allCoins = this.level.coins.every((coin) => coin.collected);
    if (allCoins && intersects(p, this.level.goal)) this.finish('won');
    this.cameraX = clamp(p.x - W * .36, 0, this.level.worldWidth - W);
  }

  damage(fell) {
    if (this.player.invincible > 0 || this.state !== 'playing') return;
    this.lives -= 1;
    this.beep(150, .16);
    if (this.lives <= 0) return this.finish('lost');
    this.player.x = Math.max(40, this.player.x - (fell ? 300 : 120));
    this.player.y = 300;
    this.player.vy = -5;
    this.player.invincible = 90;
  }

  finish(result) {
    this.state = result;
    this.cancelFrame();
    this.callbacks.onUpdate?.(this.snapshot());
    this.callbacks.onState?.(result, this.snapshot());
    this.beep(result === 'won' ? 1040 : 110, .25);
  }

  beep(frequency, duration) {
    if (this.muted) return;
    try {
      this.audio ??= new AudioContext();
      const oscillator = this.audio.createOscillator();
      const gain = this.audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.07, this.audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, this.audio.currentTime + duration);
      oscillator.connect(gain).connect(this.audio.destination);
      oscillator.start();
      oscillator.stop(this.audio.currentTime + duration);
    } catch { /* Audio is an enhancement; gameplay remains available. */ }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);
    this.drawBackground(ctx);
    ctx.save();
    ctx.translate(-this.cameraX, 0);
    this.drawWorld(ctx);
    ctx.restore();
  }

  drawBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#142f3d');
    gradient.addColorStop(.58, '#1c5a4b');
    gradient.addColorStop(1, '#0c3327');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(169, 255, 213, .08)';
    for (let i = 0; i < 18; i++) {
      const x = ((i * 137 - this.cameraX * .18) % 1100) - 70;
      ctx.fillRect(x, 90 + (i % 4) * 24, 46, 360);
      ctx.beginPath(); ctx.arc(x + 23, 85 + (i % 3) * 18, 64, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(5, 28, 22, .42)';
    ctx.beginPath(); ctx.moveTo(0, 430);
    for (let x = 0; x <= W; x += 60) ctx.lineTo(x, 390 + Math.sin((x + this.cameraX * .12) / 80) * 30);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  }

  drawWorld(ctx) {
    for (const platform of this.level.platforms) {
      ctx.fillStyle = '#5e3b26'; ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.fillStyle = '#4eab48'; ctx.fillRect(platform.x, platform.y, platform.w, 13);
      ctx.fillStyle = '#7cdf57'; ctx.fillRect(platform.x, platform.y, platform.w, 5);
      ctx.fillStyle = 'rgba(24,12,8,.18)';
      for (let x = platform.x + 20; x < platform.x + platform.w; x += 46) ctx.fillRect(x, platform.y + 28, 24, 12);
    }

    for (const hazard of this.level.hazards) {
      ctx.fillStyle = '#d7e4df';
      for (let x = hazard.x; x < hazard.x + hazard.w; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, hazard.y + hazard.h); ctx.lineTo(x + 10, hazard.y); ctx.lineTo(x + 20, hazard.y + hazard.h); ctx.fill();
      }
    }

    for (const coin of this.level.coins) if (!coin.collected) {
      ctx.fillStyle = '#ffc83f'; ctx.beginPath(); ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff0a4'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#f29d24'; ctx.fillRect(coin.x - 2, coin.y - 7, 4, 14);
    }

    for (const enemy of this.level.enemies) {
      ctx.fillStyle = '#4c3f71'; ctx.beginPath(); ctx.roundRect(enemy.x, enemy.y, enemy.w, enemy.h, 14); ctx.fill();
      ctx.fillStyle = '#ff7676'; ctx.fillRect(enemy.x + 10, enemy.y + 13, 7, 5); ctx.fillRect(enemy.x + 27, enemy.y + 13, 7, 5);
      ctx.fillStyle = '#242033'; ctx.beginPath(); ctx.moveTo(enemy.x, enemy.y + 18); ctx.lineTo(enemy.x - 13, enemy.y + 9); ctx.lineTo(enemy.x - 5, enemy.y + 28); ctx.fill();
    }

    const goal = this.level.goal;
    const unlocked = this.level.coins.every((coin) => coin.collected);
    ctx.fillStyle = unlocked ? '#85f9ff' : '#6b7380';
    ctx.beginPath(); ctx.moveTo(goal.x + goal.w / 2, goal.y); ctx.lineTo(goal.x + goal.w, goal.y + 34); ctx.lineTo(goal.x + goal.w / 2, goal.y + goal.h); ctx.lineTo(goal.x, goal.y + 34); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = unlocked ? 24 : 0; ctx.shadowColor = '#7cf7ff'; ctx.strokeStyle = '#e4ffff'; ctx.lineWidth = 4; ctx.stroke(); ctx.shadowBlur = 0;

    this.drawPlayer(ctx);
  }

  drawPlayer(ctx) {
    const p = this.player;
    if (p.invincible > 0 && Math.floor(p.invincible / 5) % 2 === 0) return;
    ctx.save(); ctx.translate(p.x + p.w / 2, p.y + p.h / 2); ctx.scale(p.face, 1);
    ctx.fillStyle = '#58c8f0'; ctx.beginPath();
    ctx.moveTo(-25, 18); ctx.bezierCurveTo(-29, -9, -15, -27, 0, -27); ctx.bezierCurveTo(18, -27, 29, -7, 25, 18); ctx.quadraticCurveTo(0, 27, -25, 18); ctx.fill();
    ctx.strokeStyle = '#1f739a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#173d55'; ctx.beginPath(); ctx.arc(-8, -3, 3.6, 0, Math.PI * 2); ctx.arc(8, -3, 3.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#215d79'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 4, 8, .2, Math.PI - .2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.48)'; ctx.beginPath(); ctx.ellipse(-10, -15, 7, 4, -.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

export { formatTime };
