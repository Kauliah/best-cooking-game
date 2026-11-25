// Copper Ladle — all canvas drawing. Every sprite is drawn with paths;
// the game ships no image files at all.

import { W, H, LAYOUT, INGREDIENTS, ING_BY_ID, RECIPE_BY_ID, fmtTime, TUNING } from './config.js';
import { matchingOrder, starsFor } from './state.js';

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'center', font = 'Trebuchet MS, sans-serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---- Ingredient sprites (original vector art) ----
export function drawIngredient(ctx, id, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  const u = s / 64; // unit scale
  ctx.lineWidth = 2 * u;
  if (id === 'bread') {
    ctx.fillStyle = '#d99a4e';
    rr(ctx, -26 * u, -14 * u, 52 * u, 30 * u, 10 * u); ctx.fill();
    ctx.fillStyle = '#f2cd8d';
    rr(ctx, -21 * u, -10 * u, 42 * u, 22 * u, 8 * u); ctx.fill();
    ctx.strokeStyle = '#c98a3a';
    ctx.beginPath(); ctx.moveTo(-12 * u, -4 * u); ctx.lineTo(12 * u, -4 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12 * u, 4 * u); ctx.lineTo(8 * u, 4 * u); ctx.stroke();
  } else if (id === 'patty' || id === 'patty_cooked') {
    const cooked = id === 'patty_cooked';
    ctx.fillStyle = cooked ? '#6e3f22' : '#a85f3c';
    rr(ctx, -28 * u, -13 * u, 56 * u, 26 * u, 12 * u); ctx.fill();
    ctx.fillStyle = cooked ? '#8a5a30' : '#c07a52';
    for (const [dx, dy] of [[-16, -4], [0, 3], [14, -5], [8, 5], [-6, 6]]) {
      ctx.beginPath(); ctx.arc(dx * u, dy * u, 3 * u, 0, Math.PI * 2); ctx.fill();
    }
    if (cooked) {
      ctx.strokeStyle = '#3d2412'; ctx.lineWidth = 3 * u;
      for (const dx of [-12, 0, 12]) {
        ctx.beginPath(); ctx.moveTo(dx * u - 4 * u, -10 * u); ctx.lineTo(dx * u + 4 * u, 10 * u); ctx.stroke();
      }
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f2b705';
    ctx.beginPath(); ctx.moveTo(-26 * u, 12 * u); ctx.lineTo(26 * u, 12 * u); ctx.lineTo(26 * u, -6 * u); ctx.lineTo(-8 * u, -14 * u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath(); ctx.moveTo(-26 * u, 12 * u); ctx.lineTo(26 * u, 12 * u); ctx.lineTo(26 * u, -6 * u); ctx.lineTo(8 * u, -11 * u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d99a00';
    for (const [dx, dy] of [[-12, 4], [4, 2], [16, 5]]) {
      ctx.beginPath(); ctx.arc(dx * u, dy * u, 3.5 * u, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'tomato') {
    ctx.fillStyle = '#d9392b';
    ctx.beginPath(); ctx.arc(0, 2 * u, 24 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8604f';
    ctx.beginPath(); ctx.arc(-7 * u, -5 * u, 9 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f8f3a';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      ctx.lineTo(Math.cos(a) * 12 * u, -18 * u + Math.sin(a) * 6 * u);
      const a2 = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a2) * 5 * u, -18 * u + Math.sin(a2) * 3 * u);
    }
    ctx.closePath(); ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#4c9a3f';
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = 24 * u * (i % 2 === 0 ? 1 : 0.82);
      const px = Math.cos(a) * r, py = Math.sin(a) * r * 0.9;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7cc46a'; ctx.lineWidth = 2.5 * u;
    ctx.beginPath(); ctx.moveTo(0, -16 * u); ctx.lineTo(0, 16 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12 * u, -8 * u); ctx.lineTo(0, 0); ctx.lineTo(12 * u, -8 * u); ctx.stroke();
  } else if (id === 'onion') {
    ctx.fillStyle = '#efe6f7';
    ctx.beginPath(); ctx.arc(0, 0, 23 * u, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b48ec9'; ctx.lineWidth = 2.5 * u;
    for (const r of [17, 11, 5]) { ctx.beginPath(); ctx.arc(0, 0, r * u, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#7fb069';
    ctx.beginPath(); ctx.moveTo(-4 * u, -20 * u); ctx.lineTo(0, -30 * u); ctx.lineTo(5 * u, -20 * u); ctx.closePath(); ctx.fill();
  } else if (id === 'pasta' || id === 'pasta_cooked') {
    const cooked = id === 'pasta_cooked';
    ctx.strokeStyle = cooked ? '#f7dc8a' : '#e8b93f';
    ctx.lineWidth = 5 * u; ctx.lineCap = 'round';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-24 * u, i * 9 * u);
      ctx.bezierCurveTo(-12 * u, i * 9 * u - 7 * u, 12 * u, i * 9 * u + 7 * u, 24 * u, i * 9 * u);
      ctx.stroke();
    }
    if (cooked) {
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 2 * u;
      for (const dx of [-10, 6]) {
        ctx.beginPath(); ctx.moveTo(dx * u, -14 * u);
        ctx.bezierCurveTo(dx * u - 5 * u, -22 * u, dx * u + 5 * u, -26 * u, dx * u, -32 * u); ctx.stroke();
      }
    }
  } else if (id === 'sauce') {
    ctx.fillStyle = '#8c2f22';
    ctx.beginPath(); ctx.arc(0, 6 * u, 24 * u, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.ellipse(0, 4 * u, 24 * u, 8 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.ellipse(-6 * u, 2 * u, 12 * u, 4 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f8f3a';
    ctx.beginPath(); ctx.arc(8 * u, -2 * u, 3 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-12 * u, 0, 2.5 * u, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ---- Panels ----
function panel(ctx, x, y, w, h, fill = '#fff3d6', stroke = '#8a5a2b') {
  ctx.fillStyle = fill;
  rr(ctx, x, y, w, h, 12); ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 12); ctx.stroke();
}

function drawStation(ctx, state, kind, px, py, pw, ph, t) {
  const slots = kind === 'grill' ? state.grill : state.pot;
  const label = kind === 'grill' ? 'GRILL' : 'POT';
  ctx.fillStyle = '#5b3a1e';
  rr(ctx, px, py, pw, ph, 12); ctx.fill();
  ctx.fillStyle = kind === 'grill' ? '#3a3a3a' : '#2e4a5a';
  rr(ctx, px + 8, py + 26, pw - 16, ph - 36, 8); ctx.fill();
  text(ctx, label, px + pw / 2, py + 14, 14, '#ffd98a');
  const slotW = (pw - 32) / 2, slotH = ph - 52;
  // flame / bubbles
  if (kind === 'grill') {
    ctx.fillStyle = `rgba(255,${120 + Math.floor(40 * Math.sin(t / 200))},40,0.85)`;
    for (const dx of [30, 90, 150, 210, 260]) {
      const h = 8 + 4 * Math.sin(t / 160 + dx);
      ctx.beginPath(); ctx.ellipse(px + dx, py + ph - 6, 10, h, 0, Math.PI, 0); ctx.fill();
    }
  } else {
    // Steam bubbles rise only inside occupied pot slots.
    slots.forEach((slot, i) => {
      if (!slot) return;
      const sx = px + 12 + i * (slotW + 8), sy = py + 34;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (const k of [0, 1]) {
        const bx = sx + 24 + k * (slotW - 48);
        const by = sy + slotH - 8 - ((t / 22 + k * 19 + i * 31) % (slotH - 16));
        ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fill();
      }
    });
  }
  slots.forEach((slot, i) => {
    const sx = px + 12 + i * (slotW + 8), sy = py + 34;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    rr(ctx, sx, sy, slotW, slotH, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
    rr(ctx, sx, sy, slotW, slotH, 8); ctx.stroke();
    if (!slot) {
      text(ctx, kind === 'grill' ? 'empty' : 'empty', sx + slotW / 2, sy + slotH / 2, 11, 'rgba(255,255,255,0.45)');
      return;
    }
    const cx = sx + slotW / 2, cy = sy + slotH / 2 - 8;
    drawIngredient(ctx, slot.ing, cx, cy, 52);
    if (slot.state === 'cooking') {
      const p = Math.min(1, slot.t / slot.dur);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      rr(ctx, sx + 8, sy + slotH - 16, slotW - 16, 8, 4); ctx.fill();
      ctx.fillStyle = '#ffb347';
      rr(ctx, sx + 8, sy + slotH - 16, (slotW - 16) * p, 8, 4); ctx.fill();
    } else if (slot.state === 'ready') {
      const pulse = 0.6 + 0.4 * Math.sin(t / 150);
      ctx.strokeStyle = `rgba(120,255,120,${pulse})`; ctx.lineWidth = 3;
      rr(ctx, sx + 2, sy + 2, slotW - 4, slotH - 4, 8); ctx.stroke();
      text(ctx, 'READY!', cx, sy + slotH - 12, 12, '#8dff8d');
    } else {
      ctx.fillStyle = 'rgba(20,20,20,0.55)';
      rr(ctx, sx, sy, slotW, slotH, 8); ctx.fill();
      text(ctx, 'BURNT!', cx, cy, 15, '#ff7a5c');
      text(ctx, 'click to toss', cx, cy + 20, 10, '#ffc9b8');
    }
  });
}

function drawTicket(ctx, order, x, y, w, h, state) {
  const urgent = order.patience < 12;
  panel(ctx, x, y, w, h, urgent ? '#ffe3d6' : '#fffaf0', urgent ? '#c0392b' : '#8a5a2b');
  text(ctx, order.recipe.name, x + 12, y + 16, 15, '#3d2b1f', 'bold', 'left');
  text(ctx, `+${order.recipe.points} pts`, x + w - 10, y + 16, 12, '#b87333', 'bold', 'right');
  // ingredient chips: needed, ticked when on the plate
  const counts = {};
  for (const ing of order.recipe.needs) counts[ing] = (counts[ing] || 0) + 1;
  const plateCounts = {};
  for (const ing of state.plate) plateCounts[ing] = (plateCounts[ing] || 0) + 1;
  let cx = x + 16;
  for (const ing of Object.keys(counts)) {
    const need = counts[ing], have = Math.min(need, plateCounts[ing] || 0);
    const done = have >= need;
    ctx.fillStyle = done ? '#dff5d8' : '#f3e2c2';
    rr(ctx, cx, y + 30, 30, 30, 7); ctx.fill();
    ctx.strokeStyle = done ? '#4c9a3f' : '#c9a86a'; ctx.lineWidth = 1.5;
    rr(ctx, cx, y + 30, 30, 30, 7); ctx.stroke();
    drawIngredient(ctx, ing, cx + 15, y + 45, 26);
    if (need > 1) text(ctx, `x${need}`, cx + 24, y + 56, 10, '#3d2b1f');
    if (done) {
      ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx + 6, y + 45); ctx.lineTo(cx + 13, y + 52); ctx.lineTo(cx + 24, y + 38); ctx.stroke();
    }
    cx += 36;
  }
  // patience bar
  const p = Math.max(0, order.patience / order.patienceMax);
  ctx.fillStyle = '#e8d5b5';
  rr(ctx, x + 12, y + h - 16, w - 24, 8, 4); ctx.fill();
  ctx.fillStyle = p > 0.5 ? '#5da24a' : p > 0.25 ? '#e8a13c' : '#d9392b';
  rr(ctx, x + 12, y + h - 16, (w - 24) * p, 8, 4); ctx.fill();
  text(ctx, `${Math.ceil(order.patience)}s`, x + w - 12, y + h - 11, 10, '#3d2b1f', 'bold', 'right');
}

export function render(ctx, state, t) {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
  }

  // Wall + tile backsplash + wooden counter.
  ctx.fillStyle = '#f6e7c8'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#8fc1b5';
  for (let x = 0; x < W; x += 48) {
    ctx.fillRect(x, 56, 46, 140);
    ctx.fillStyle = '#7fb0a4'; ctx.fillRect(x, 56, 46, 4);
    ctx.fillStyle = '#8fc1b5';
  }
  ctx.fillStyle = '#a9743f'; ctx.fillRect(0, 196, W, 10);
  ctx.fillStyle = '#c98f4e'; ctx.fillRect(0, 336, W, 16);
  ctx.fillStyle = '#8a5a2b'; ctx.fillRect(0, 348, W, 4);
  ctx.fillStyle = '#e9d9b8'; ctx.fillRect(0, 352, W, 184);
  ctx.fillStyle = '#d9c49a';
  for (let x = 0; x < W; x += 64) ctx.fillRect(x, 352, 2, 184);

  // ---- Header ----
  ctx.fillStyle = '#3d2b1f'; ctx.fillRect(0, 0, W, 56);
  ctx.fillStyle = '#b87333'; ctx.fillRect(0, 54, W, 2);
  text(ctx, 'COPPER LADLE', 16, 29, 22, '#ffd98a', 'bold', 'left', 'Georgia, serif');
  text(ctx, 'a tiny kitchen rush', 218, 30, 12, '#d9b380', 'normal', 'left', 'Georgia, serif');
  const timeColor = state.timeLeft <= 30 && state.screen === 'playing' ? '#ff7a5c' : '#fff6e5';
  text(ctx, fmtTime(state.timeLeft), 480, 29, 24, timeColor);
  text(ctx, `SCORE ${state.score}`, 700, 24, 17, '#fff6e5', 'bold', 'right');
  text(ctx, `Coins ${state.coins}   Combo x${state.combo}`, 700, 44, 13, '#ffd98a', 'bold', 'right');
  text(ctx, `served ${state.served}`, 940, 29, 13, '#d9b380', 'bold', 'right');

  if (state.screen === 'title') { renderTitle(ctx, state, t); ctx.restore(); return; }

  // ---- Order board ----
  panel(ctx, LAYOUT.board.x, LAYOUT.board.y, LAYOUT.board.w, LAYOUT.board.h, '#e8c98f', '#8a5a2b');
  text(ctx, 'ORDER BOARD', LAYOUT.board.x + 16, LAYOUT.board.y + 16, 15, '#3d2b1f', 'bold', 'left');
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet —', LAYOUT.board.x + 144, LAYOUT.board.y + 90, 14, '#7a5a34');
    text(ctx, 'the lunch rush is coming!', LAYOUT.board.x + 144, LAYOUT.board.y + 112, 14, '#7a5a34');
  }
  state.orders.forEach((order, i) => {
    drawTicket(ctx, order, LAYOUT.board.x + 12, LAYOUT.board.y + 34 + i * 86, LAYOUT.board.w - 24, 78, state);
  });

  // ---- Stations ----
  drawStation(ctx, state, 'grill', LAYOUT.grill.x, LAYOUT.grill.y, LAYOUT.grill.w, LAYOUT.grill.h, t);
  drawStation(ctx, state, 'pot', LAYOUT.pot.x, LAYOUT.pot.y, LAYOUT.pot.w, LAYOUT.pot.h, t);

  // ---- Assembly: trash, plate, serve ----
  const tr = LAYOUT.trash;
  ctx.fillStyle = '#7a7a7a'; rr(ctx, tr.x, tr.y, tr.w, tr.h, 10); ctx.fill();
  ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 2; rr(ctx, tr.x, tr.y, tr.w, tr.h, 10); ctx.stroke();
  ctx.fillStyle = '#5a5a5a'; ctx.fillRect(tr.x + 14, tr.y + 12, tr.w - 28, 8);
  ctx.fillStyle = '#8a8a8a';
  for (const dx of [20, 38, 56]) ctx.fillRect(tr.x + dx, tr.y + 26, 4, tr.h - 34);
  text(ctx, 'TRASH', tr.x + tr.w / 2, tr.y + tr.h - 12, 11, '#fff');

  const pl = LAYOUT.plate;
  ctx.fillStyle = '#f8f4ec';
  ctx.beginPath(); ctx.arc(pl.x, pl.y, pl.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b8a888'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(pl.x, pl.y, pl.r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#d8cbb2'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(pl.x, pl.y, pl.r - 12, 0, Math.PI * 2); ctx.stroke();
  if (state.plate.length === 0) {
    text(ctx, 'Empty plate', pl.x, pl.y, 13, '#a89878');
    text(ctx, 'click ingredients', pl.x, pl.y + 18, 11, '#b8a888');
  } else {
    state.plate.forEach((ing, i) => {
      const a = -Math.PI / 2 + (i / state.plate.length) * Math.PI * 2;
      const rr2 = state.plate.length === 1 ? 0 : 30;
      drawIngredient(ctx, ing, pl.x + Math.cos(a) * rr2, pl.y + Math.sin(a) * rr2, 44);
    });
  }

  const sv = LAYOUT.serve;
  const match = state.screen === 'playing' ? matchingOrder(state) : null;
  const ready = !!match;
  const glow = ready ? 0.75 + 0.25 * Math.sin(t / 150) : 1;
  ctx.fillStyle = ready ? `rgba(93,162,74,${glow})` : '#b87333';
  rr(ctx, sv.x, sv.y, sv.w, sv.h, 14); ctx.fill();
  ctx.strokeStyle = ready ? '#2e7d32' : '#7a4a1e'; ctx.lineWidth = 3;
  rr(ctx, sv.x, sv.y, sv.w, sv.h, 14); ctx.stroke();
  // bell
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(sv.x + sv.w / 2, sv.y + 32, 22, Math.PI, 0); ctx.fill();
  ctx.fillRect(sv.x + sv.w / 2 - 26, sv.y + 30, 52, 6);
  ctx.beginPath(); ctx.arc(sv.x + sv.w / 2, sv.y + 42, 5, 0, Math.PI * 2); ctx.fill();
  text(ctx, ready ? 'SERVE!' : 'SERVE', sv.x + sv.w / 2, sv.y + 68, ready ? 20 : 16, '#fff');
  if (ready) text(ctx, match.recipe.name, sv.x + sv.w / 2, sv.y + 82, 10, '#eaffea');

  // ---- Ingredient bins ----
  const b = LAYOUT.bins;
  INGREDIENTS.forEach((ing, i) => {
    const x = b.x + i * (b.w + b.gap), y = b.y;
    ctx.fillStyle = '#c98f4e'; rr(ctx, x, y, b.w, b.h, 10); ctx.fill();
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 2; rr(ctx, x, y, b.w, b.h, 10); ctx.stroke();
    ctx.fillStyle = '#a9743f'; ctx.fillRect(x + 6, y + 6, b.w - 12, 10);
    drawIngredient(ctx, ing.id, x + b.w / 2, y + 74, 62);
    text(ctx, ing.name, x + b.w / 2, y + 126, 14, '#fff6e5');
    const cooks = ing.cooksAt ? `→ ${ing.cooksAt}` : 'ready to plate';
    text(ctx, cooks, x + b.w / 2, y + 144, 10, '#ffe9bf');
    ctx.fillStyle = '#3d2b1f';
    ctx.beginPath(); ctx.arc(x + 14, y + 26, 11, 0, Math.PI * 2); ctx.fill();
    text(ctx, ing.key, x + 14, y + 26, 12, '#ffd98a');
  });

  // ---- Hint bar ----
  text(ctx, 'Click ingredients to build the plate  •  Patties go on the grill, pasta in the pot  •  Space = serve,  T = trash,  P = pause,  M = sound', 480, 566, 13, '#6b4a26');

  // ---- Serve banner ----
  if (state.lastServe && state.screen === 'playing') {
    const age = performance.now() - (state.flash?.until ?? 0);
    if (age < 900) {
      ctx.fillStyle = 'rgba(46,125,50,0.92)';
      rr(ctx, 330, 322, 300, 26, 13); ctx.fill();
      text(ctx, `+${state.lastServe.points}  ${state.lastServe.name} served!  Coins +${state.lastServe.coins}`, 480, 335, 14, '#fff');
    }
  }

  // ---- Toast ----
  if (state.toast && performance.now() < state.toast.until) {
    const tw = ctx.measureText(state.toast.text).width + 28;
    ctx.fillStyle = 'rgba(61,43,31,0.92)';
    rr(ctx, 480 - tw / 2, 322, tw, 26, 13); ctx.fill();
    text(ctx, state.toast.text, 480, 335, 13, '#fff6e5', 'normal');
  }

  // ---- Flash ----
  if (state.flash && performance.now() < state.flash.until) {
    const a = 0.18 * (1 - (state.flash.until - performance.now()) / 450);
    ctx.fillStyle = state.flash.kind === 'serve' ? `rgba(120,255,120,${a})` : `rgba(255,60,40,${a})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (state.screen === 'paused') {
    ctx.fillStyle = 'rgba(30,20,10,0.6)'; ctx.fillRect(0, 0, W, H);
    text(ctx, 'PAUSED', 480, 280, 44, '#fff6e5', 'bold', 'center', 'Georgia, serif');
    text(ctx, 'Press P to keep cooking', 480, 330, 16, '#ffd98a');
  }
  if (state.screen === 'over') renderOver(ctx, state, t);
  ctx.restore();
}

function renderTitle(ctx, state, t) {
  ctx.fillStyle = 'rgba(61,43,31,0.88)'; ctx.fillRect(0, 0, W, H);
  const bob = Math.sin(t / 500) * 4;
  // Draw a little copper ladle above the title instead of an emoji.
  ctx.save();
  ctx.translate(480, 104 + bob);
  ctx.strokeStyle = '#b87333'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 22); ctx.stroke();
  ctx.fillStyle = '#b87333';
  ctx.beginPath(); ctx.arc(0, 34, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f6e7c8';
  ctx.beginPath(); ctx.arc(0, 34, 10, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  text(ctx, 'COPPER LADLE', 480, 185, 58, '#ffd98a', 'bold', 'center', 'Georgia, serif');
  text(ctx, 'a tiny kitchen rush', 480, 225, 20, '#fff6e5', 'normal', 'center', 'Georgia, serif');
  text(ctx, 'Orders fly in on the board. Build each dish on the plate,', 480, 285, 16, '#ffe9bf');
  text(ctx, 'grill the patties, mind the pot — and serve before patience runs out!', 480, 308, 16, '#ffe9bf');
  text(ctx, 'Mouse: click ingredients, grill, pot and the bell  •  Keys: 1–8 ingredients, Space serve, T trash, P pause', 480, 345, 13, '#d9b380');
  text(ctx, 'One shift: 3 minutes. Serve fast for tips — combos pay extra.', 480, 368, 13, '#d9b380');
  if (state.best > 0) text(ctx, `Best score: ${state.best}`, 480, 400, 15, '#ffd98a');
  const pulse = 0.7 + 0.3 * Math.sin(t / 300);
  ctx.fillStyle = `rgba(184,115,51,${pulse})`;
  rr(ctx, 330, 425, 300, 52, 14); ctx.fill();
  ctx.strokeStyle = '#ffd98a'; ctx.lineWidth = 2; rr(ctx, 330, 425, 300, 52, 14); ctx.stroke();
  text(ctx, 'CLICK OR PRESS ENTER TO START', 480, 452, 17, '#fff');
}

function renderOver(ctx, state, t) {
  ctx.fillStyle = 'rgba(30,20,10,0.72)'; ctx.fillRect(0, 0, W, H);
  panel(ctx, 230, 120, 500, 360, '#fff3d6', '#8a5a2b');
  text(ctx, 'SHIFT OVER!', 480, 165, 36, '#3d2b1f', 'bold', 'center', 'Georgia, serif');
  text(ctx, 'The kitchen closes its doors.', 480, 195, 14, '#7a5a34');
  text(ctx, `SCORE  ${state.score}`, 480, 245, 30, '#b87333');
  const stars = starsFor(state.score);
  text(ctx, '★'.repeat(stars) + '☆'.repeat(3 - stars), 480, 285, 30, '#e8a13c');
  text(ctx, `Dishes served: ${state.served}     Lost: ${state.lost}`, 480, 325, 16, '#3d2b1f');
  text(ctx, `Coins earned: ${state.coins}     Best combo: x${state.bestCombo}`, 480, 350, 16, '#3d2b1f');
  const verdict = stars === 3 ? 'Head chef material!' : stars === 2 ? 'A solid shift, chef.' : stars === 1 ? 'The lunch rush won this time.' : 'The kitchen needs practice!';
  text(ctx, verdict, 480, 385, 16, '#5da24a');
  if (state.score >= state.best && state.score > 0) text(ctx, '★ New best score! ★', 480, 410, 15, '#b87333');
  text(ctx, 'Press R to play again', 480, 445, 15, '#7a5a34');
}
