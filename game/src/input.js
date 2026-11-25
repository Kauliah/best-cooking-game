// Copper Ladle — mouse + keyboard input, hit-tested against the layout.

import { LAYOUT, INGREDIENTS, W, H } from './config.js';
import { clickIngredient, clickStation, servePlate, trashPlate, removePlateItem, startShift } from './state.js';
import { ensureAudio, setMuted, isMuted } from './audio.js';

function inRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function stationSlotAt(kind, px, py) {
  const p = kind === 'grill' ? LAYOUT.grill : LAYOUT.pot;
  const slotW = (p.w - 32) / 2, slotH = p.h - 52;
  for (let i = 0; i < 2; i++) {
    const sx = p.x + 12 + i * (slotW + 8), sy = p.y + 34;
    if (px >= sx && px <= sx + slotW && py >= sy && py <= sy + slotH) return i;
  }
  return -1;
}

export function attachInput(canvas, state) {
  function toGame(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  }

  canvas.addEventListener('click', (e) => {
    ensureAudio();
    const { x, y } = toGame(e);
    if (state.screen === 'title') { startShift(state); return; }
    if (state.screen === 'over') { startShift(state); return; }
    if (state.screen === 'paused') { state.screen = 'playing'; return; }

    // Serve button.
    if (inRect(x, y, LAYOUT.serve)) { servePlate(state); return; }
    // Trash button.
    if (inRect(x, y, LAYOUT.trash)) { trashPlate(state); return; }
    // Grill / pot slots.
    const g = stationSlotAt('grill', x, y);
    if (g !== -1) { clickStation(state, 'grill', g); return; }
    const p = stationSlotAt('pot', x, y);
    if (p !== -1) { clickStation(state, 'pot', p); return; }
    // Plate: click a plated item to remove it.
    const pl = LAYOUT.plate;
    const dx = x - pl.x, dy = y - pl.y;
    if (dx * dx + dy * dy <= pl.r * pl.r && state.plate.length > 0) {
      let best = 0, bestD = Infinity;
      state.plate.forEach((ing, i) => {
        const a = -Math.PI / 2 + (i / state.plate.length) * Math.PI * 2;
        const rr2 = state.plate.length === 1 ? 0 : 30;
        const ix = pl.x + Math.cos(a) * rr2, iy = pl.y + Math.sin(a) * rr2;
        const d = (x - ix) ** 2 + (y - iy) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      removePlateItem(state, best);
      return;
    }
    // Ingredient bins.
    const b = LAYOUT.bins;
    INGREDIENTS.forEach((ing, i) => {
      const bx = b.x + i * (b.w + b.gap);
      if (x >= bx && x <= bx + b.w && y >= b.y && y <= b.y + b.h) clickIngredient(state, ing.id);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    ensureAudio();
    const k = e.key.toLowerCase();
    if (k === 'm') { setMuted(!isMuted()); return; }
    if (state.screen === 'title' && (k === 'enter' || k === ' ')) { startShift(state); return; }
    if (state.screen === 'over' && (k === 'r' || k === 'enter' || k === ' ')) { startShift(state); return; }
    if (k === 'p' && (state.screen === 'playing' || state.screen === 'paused')) {
      state.screen = state.screen === 'playing' ? 'paused' : 'playing';
      return;
    }
    if (state.screen !== 'playing') return;
    if (k === ' ') { e.preventDefault(); servePlate(state); return; }
    if (k === 't' || k === 'backspace' || k === 'delete') { trashPlate(state); return; }
    const ing = INGREDIENTS.find((i) => i.key === k);
    if (ing) clickIngredient(state, ing.id);
  });
}
