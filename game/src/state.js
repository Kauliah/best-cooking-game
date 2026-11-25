// Copper Ladle — game state: orders, cooking stations, plate, score.
// Pure logic; rendering lives in render.js, input in input.js.

import { INGREDIENTS, ING_BY_ID, RECIPES, TUNING, SHIFT_SECONDS, mulberry32 } from './config.js';
import { sfx, startMusic } from './audio.js';

export function newGame(seed) {
  const rng = mulberry32(seed >>> 0 || 1);
  return {
    screen: 'title', // title | playing | paused | over
    seed,
    rng,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    orders: [], // {id, recipe, patience, patienceMax, progress: {ing: count}}
    nextOrderId: 1,
    spawnIn: TUNING.spawnFirstSecs,
    plate: [], // ingredient ids on the plate, in added order
    grill: [null, null], // {ing, t, dur, burn} | null
    pot: [null, null],
    toast: null, // {text, until}
    flash: null, // {kind: 'serve'|'wrong'|'expire', until}
    lastServe: null, // {points, coins, name} for the serve banner
    shake: 0, // ms of screen shake left
    best: 0, // best score, loaded from localStorage by main.js
    frozen: false, // screenshot staging: render but do not advance time
    stats: { servedByDish: {} },
  };
}

function difficulty(state) {
  const p = Math.min(1, state.elapsed / SHIFT_SECONDS);
  return {
    spawnInterval: TUNING.spawnIntervalStart + (TUNING.spawnIntervalEnd - TUNING.spawnIntervalStart) * p,
    patience: TUNING.patienceStart + (TUNING.patienceEnd - TUNING.patienceStart) * p,
  };
}

function pickRecipe(rng, orders) {
  // Avoid repeating the same dish twice in a row on the board when possible.
  const onBoard = new Set(orders.map((o) => o.recipe.id));
  const pool = RECIPES.filter((r) => !onBoard.has(r.id));
  const list = pool.length ? pool : RECIPES;
  return list[Math.floor(rng() * list.length)];
}

export function spawnOrder(state) {
  const { patience } = difficulty(state);
  const recipe = pickRecipe(state.rng, state.orders);
  state.orders.push({
    id: state.nextOrderId++,
    recipe,
    patience,
    patienceMax: patience,
    progress: {},
  });
}

export function setToast(state, text, ms = 1600) {
  state.toast = { text, until: performance.now() + ms };
}

function plateMatches(recipe, plate) {
  const need = {};
  for (const ing of recipe.needs) need[ing] = (need[ing] || 0) + 1;
  const have = {};
  for (const ing of plate) have[ing] = (have[ing] || 0) + 1;
  const keys = new Set([...Object.keys(need), ...Object.keys(have)]);
  for (const k of keys) if ((need[k] || 0) !== (have[k] || 0)) return false;
  return true;
}

export function matchingOrder(state) {
  for (const order of state.orders) {
    if (plateMatches(order.recipe, state.plate)) return order;
  }
  return null;
}

export function addToPlate(state, ingId) {
  if (state.plate.length >= TUNING.maxPlate) {
    setToast(state, 'Plate is full — serve it or trash it!');
    sfx.buzz();
    return false;
  }
  state.plate.push(ingId);
  sfx.add();
  return true;
}

export function clickIngredient(state, ingId) {
  if (state.screen !== 'playing') return;
  const ing = ING_BY_ID[ingId];
  if (!ing) return;
  if (ing.cooksAt === 'grill' || ing.cooksAt === 'pot') {
    const slots = ing.cooksAt === 'grill' ? state.grill : state.pot;
    const free = slots.findIndex((s) => s === null);
    if (free === -1) {
      setToast(state, ing.cooksAt === 'grill' ? 'Grill is full!' : 'Pot is full!');
      sfx.buzz();
      return;
    }
    slots[free] = { ing: ingId, t: 0, dur: ing.cookSecs, burn: ing.burnSecs, state: 'cooking' };
    sfx.place();
    setToast(state, `${ing.name} on the ${ing.cooksAt === 'grill' ? 'grill' : 'pot'} — wait for the ding!`, 1200);
    return;
  }
  addToPlate(state, ingId);
}

export function clickStation(state, station, slotIndex) {
  if (state.screen !== 'playing') return;
  const slots = station === 'grill' ? state.grill : state.pot;
  const slot = slots[slotIndex];
  if (!slot) return;
  if (slot.state === 'burnt') {
    slots[slotIndex] = null;
    sfx.chop();
    setToast(state, 'Burnt! Tossed in the bin.', 1200);
    return;
  }
  if (slot.state === 'ready') {
    const cookedId = ING_BY_ID[slot.ing].cookedId;
    if (addToPlate(state, cookedId)) {
      slots[slotIndex] = null;
      sfx.ding();
    }
    return;
  }
  setToast(state, 'Still cooking — wait for the ding!', 1000);
  sfx.click();
}

export function servePlate(state) {
  if (state.screen !== 'playing') return;
  if (state.plate.length === 0) {
    setToast(state, 'Plate is empty — add ingredients first!');
    sfx.click();
    return;
  }
  const order = matchingOrder(state);
  if (!order) {
    state.combo = 0;
    state.flash = { kind: 'wrong', until: performance.now() + 450 };
    state.shake = 180;
    sfx.buzz();
    setToast(state, 'No order matches this plate — check the board!', 1800);
    return;
  }
  const timeBonus = Math.round(order.patience);
  const comboBonus = state.combo * 5;
  const points = order.recipe.points + Math.min(30, timeBonus) + comboBonus;
  state.score += points;
  state.coins += order.recipe.coins;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.stats.servedByDish[order.recipe.id] = (state.stats.servedByDish[order.recipe.id] || 0) + 1;
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.plate = [];
  state.lastServe = { points, coins: order.recipe.coins, name: order.recipe.name, combo: state.combo };
  state.flash = { kind: 'serve', until: performance.now() + 700 };
  sfx.serve();
  setTimeout(() => sfx.coin(), 250);
  state.spawnIn = Math.min(state.spawnIn, 4);
}

export function trashPlate(state) {
  if (state.screen !== 'playing') return;
  if (state.plate.length === 0) { sfx.click(); return; }
  state.plate = [];
  sfx.chop();
  setToast(state, 'Plate cleared.', 900);
}

export function removePlateItem(state, index) {
  if (state.screen !== 'playing') return;
  if (index < 0 || index >= state.plate.length) return;
  state.plate.splice(index, 1);
  sfx.click();
}

export function startShift(state) {
  state.screen = 'playing';
  state.timeLeft = SHIFT_SECONDS;
  state.elapsed = 0;
  state.score = 0;
  state.coins = 0;
  state.served = 0;
  state.lost = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.orders = [];
  state.plate = [];
  state.grill = [null, null];
  state.pot = [null, null];
  state.spawnIn = TUNING.spawnFirstSecs;
  state.lastServe = null;
  state.toast = null;
  sfx.start();
  startMusic();
  spawnOrder(state);
}

export function starsFor(score) {
  let stars = 0;
  for (const t of TUNING.stars) if (score >= t) stars++;
  return stars;
}

export function update(state, dt) {
  if (state.screen !== 'playing' || state.frozen) return;
  state.elapsed += dt;
  state.timeLeft -= dt;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 1000);

  // Spawn orders.
  state.spawnIn -= dt;
  if (state.spawnIn <= 0 && state.orders.length < TUNING.maxOrders) {
    spawnOrder(state);
    state.spawnIn = difficulty(state).spawnInterval;
  }

  // Patience drains; expired orders are lost.
  for (const order of [...state.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) {
      state.orders = state.orders.filter((o) => o.id !== order.id);
      state.lost += 1;
      state.combo = 0;
      state.flash = { kind: 'expire', until: performance.now() + 450 };
      sfx.expire();
      setToast(state, `Order lost: ${order.recipe.name} walked out!`, 1800);
    }
  }

  // Cooking stations.
  for (const slots of [state.grill, state.pot]) {
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot) continue;
      slot.t += dt;
      if (slot.state === 'cooking' && slot.t >= slot.dur) {
        slot.state = 'ready';
        sfx.ding();
        setToast(state, `${ING_BY_ID[slot.ing].name} is ready — click it onto the plate!`, 1400);
      } else if (slot.state === 'ready' && slot.t >= slot.burn) {
        slot.state = 'burnt';
        sfx.burn();
        setToast(state, `Burnt on the ${slots === state.grill ? 'grill' : 'pot'}! Click it to toss it.`, 1800);
      }
    }
  }

  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.screen = 'over';
    sfx.over();
    try {
      const prev = Number(localStorage.getItem('copper-ladle-best') || 0);
      if (state.score > prev) localStorage.setItem('copper-ladle-best', String(state.score));
      state.best = Math.max(prev, state.score);
    } catch { /* storage unavailable: best stays in-session */ }
  }
}
