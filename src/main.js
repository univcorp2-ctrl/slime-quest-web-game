import { SlimeQuest, formatTime } from './game.js';
import { loadRanking, saveTime } from './storage.js';

const canvas = document.querySelector('#gameCanvas');
const overlay = document.querySelector('#overlay');
const overlayTitle = document.querySelector('#overlayTitle');
const overlayMessage = document.querySelector('#overlayMessage');
const startButton = document.querySelector('#startButton');
const pauseButton = document.querySelector('#pauseButton');
const soundButton = document.querySelector('#soundButton');
const lifeValue = document.querySelector('#lifeValue');
const coinValue = document.querySelector('#coinValue');
const timeValue = document.querySelector('#timeValue');
const bestValue = document.querySelector('#bestValue');
const rankingList = document.querySelector('#rankingList');

let ranking = loadRanking();
let muted = false;

function renderRanking() {
  bestValue.textContent = ranking.length ? `${formatTime(ranking[0])}s` : '--';
  rankingList.replaceChildren();
  if (!ranking.length) {
    const item = document.createElement('li'); item.textContent = 'まだ記録がありません'; rankingList.append(item); return;
  }
  ranking.forEach((seconds) => {
    const item = document.createElement('li'); item.textContent = `${formatTime(seconds)} 秒`; rankingList.append(item);
  });
}

const game = new SlimeQuest(canvas, {
  onUpdate(snapshot) {
    lifeValue.textContent = '♥'.repeat(snapshot.lives) + '♡'.repeat(3 - snapshot.lives);
    coinValue.textContent = `${snapshot.collected} / ${snapshot.totalCoins}`;
    timeValue.textContent = formatTime(snapshot.elapsed);
  },
  onState(state, snapshot) {
    if (state === 'playing') { overlay.hidden = true; pauseButton.textContent = '⏸'; return; }
    overlay.hidden = false;
    if (state === 'paused') {
      overlayTitle.textContent = 'PAUSED'; overlayMessage.textContent = 'ひと休み中。ボタンまたは P キーで再開できます。'; startButton.textContent = 'ゲームに戻る'; pauseButton.textContent = '▶';
    } else if (state === 'won') {
      ranking = saveTime(snapshot.elapsed); renderRanking();
      overlayTitle.textContent = 'QUEST CLEAR!'; overlayMessage.textContent = `${formatTime(snapshot.elapsed)}秒でクリア！ ベストタイムを更新できるかな？`; startButton.textContent = 'もう一度遊ぶ';
    } else if (state === 'lost') {
      overlayTitle.textContent = 'TRY AGAIN'; overlayMessage.textContent = '森はまだ待っています。コインの場所を覚えて再挑戦しよう。'; startButton.textContent = 'リトライ';
    }
  }
});

const controlKeys = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump'
};

window.addEventListener('keydown', (event) => {
  if (controlKeys[event.code]) { event.preventDefault(); game.setControl(controlKeys[event.code], true); }
  if (event.code === 'KeyP') game.togglePause();
});
window.addEventListener('keyup', (event) => {
  if (controlKeys[event.code]) { event.preventDefault(); game.setControl(controlKeys[event.code], false); }
});
window.addEventListener('blur', () => { game.setControl('left', false); game.setControl('right', false); game.setControl('jump', false); });

for (const button of document.querySelectorAll('[data-control]')) {
  const control = button.dataset.control;
  const set = (active) => { game.setControl(control, active); button.classList.toggle('active', active); };
  button.addEventListener('pointerdown', (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); set(true); });
  button.addEventListener('pointerup', () => set(false));
  button.addEventListener('pointercancel', () => set(false));
}

startButton.addEventListener('click', () => {
  if (game.state === 'paused') game.togglePause(); else game.start();
});
pauseButton.addEventListener('click', () => game.togglePause());
soundButton.addEventListener('click', () => {
  muted = !muted; game.setMuted(muted); soundButton.textContent = muted ? '🔇' : '🔊'; soundButton.setAttribute('aria-label', muted ? 'サウンドをオン' : 'サウンドをオフ');
});

renderRanking();
game.draw();
