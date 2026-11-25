// Copper Ladle — entry point: game loop, screenshot staging, best score.
// Open game/index.html in desktop Chrome; no network requests are made.

import { W, H, RECIPES, ING_BY_ID } from './config.js';
import { newGame, update } from './state.js';
import { render } from './render.js';
import { attachInput } from './input.js';
import { ensureAudio } from './audio.js';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 20261125);
const shot = params.get('shot');
const state = newGame(seed);
try {
  state.best = Number(localStorage.getItem('copper-ladle-best') || 0);
} catch { state.best = 0; }

const canvas = document.getElementById('game');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');
attachInput(canvas, state);

// ---- Screenshot staging (?shot=start|play|serve|end) ----
// Stages a fixed, deterministic scene from the game's own state so the
// screenshots are real renders of the game code, as the kit's starter does.
function stageShot(name) {
  state.frozen = true;
  if (name === 'start') {
    state.screen = 'title';
    state.best = 1240;
  } else if (name === 'play' || name === 'serve') {
    state.screen = 'playing';
    state.timeLeft = name === 'play' ? 134 : 98;
    state.elapsed = 180 - state.timeLeft;
    state.score = name === 'play' ? 160 : 240;
    state.coins = name === 'play' ? 26 : 40;
    state.served = name === 'play' ? 3 : 4;
    state.combo = 2;
    state.bestCombo = 3;
    const burger = RECIPES.find((r) => r.id === 'burger');
    const salad = RECIPES.find((r) => r.id === 'salad');
    const pasta = RECIPES.find((r) => r.id === 'pasta');
    state.orders = [
      { id: 1, recipe: burger, patience: 26, patienceMax: 44, progress: {} },
      { id: 2, recipe: salad, patience: 38, patienceMax: 48, progress: {} },
      { id: 3, recipe: pasta, patience: 12, patienceMax: 40, progress: {} },
    ];
    // Grill: patty mid-cook; pot: pasta ready (play) or empty (serve).
    state.grill = name === 'play'
      ? [{ ing: 'patty', t: 3, dur: 5, burn: 10, state: 'cooking' }, null]
      : [null, null];
    state.pot = name === 'play'
      ? [{ ing: 'pasta', t: 6, dur: 6, burn: 11, state: 'ready' }, null]
      : [null, null];
    // Plate mid-assembly (play) or a finished burger ready to serve (serve).
    state.plate = name === 'play'
      ? ['bread', 'lettuce']
      : ['bread', 'patty_cooked', 'cheese', 'lettuce'];
    if (name === 'serve') state.lastServe = null;
  } else if (name === 'end') {
    state.screen = 'over';
    state.timeLeft = 0;
    state.score = 1240;
    state.coins = 214;
    state.served = 14;
    state.lost = 2;
    state.combo = 0;
    state.bestCombo = 6;
    state.best = 1240;
    state.stats.servedByDish = { burger: 5, pasta: 3, salad: 3, sandwich: 2, grilled_cheese: 1 };
  }
}

if (shot) stageShot(shot);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  update(state, dt);
  render(ctx, state, now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Expose the state for automated play-testing (no network involved).
window.__copperLadle = state;

document.addEventListener('pointerdown', ensureAudio, { once: true });
