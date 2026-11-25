// Copper Ladle — a tiny kitchen rush.
// Config: canvas size, layout, ingredients, recipes, tuning.
// All art, names and sounds in this game are original.

export const W = 960;
export const H = 600;
export const SHIFT_SECONDS = 180;

// ---- Layout (fixed coordinates, shared by render + input) ----
export const LAYOUT = {
  header: { x: 0, y: 0, w: 960, h: 56 },
  board: { x: 12, y: 68, w: 288, h: 280 },
  grill: { x: 312, y: 68, w: 312, h: 128 },
  pot: { x: 636, y: 68, w: 312, h: 128 },
  plate: { x: 480, y: 268, r: 64 },
  serve: { x: 648, y: 224, w: 116, h: 88 },
  trash: { x: 316, y: 236, w: 76, h: 64 },
  bins: { x: 19, y: 352, w: 110, h: 168, gap: 6 },
  hint: { x: 0, y: 536, w: 960, h: 64 },
};

// ---- Ingredients ----
export const INGREDIENTS = [
  { id: 'bread', name: 'Bread', key: '1', color: '#e8b96a', cooksAt: null },
  { id: 'patty', name: 'Patty', key: '2', color: '#b06a4a', cooksAt: 'grill', cookSecs: 5, burnSecs: 10, cookedId: 'patty_cooked' },
  { id: 'cheese', name: 'Cheese', key: '3', color: '#f5c542', cooksAt: null },
  { id: 'tomato', name: 'Tomato', key: '4', color: '#d9392b', cooksAt: null },
  { id: 'lettuce', name: 'Lettuce', key: '5', color: '#5da24a', cooksAt: null },
  { id: 'onion', name: 'Onion', key: '6', color: '#e8dff2', cooksAt: null },
  { id: 'pasta', name: 'Pasta', key: '7', color: '#f2d06b', cooksAt: 'pot', cookSecs: 6, burnSecs: 11, cookedId: 'pasta_cooked' },
  { id: 'sauce', name: 'Sauce', key: '8', color: '#a83226', cooksAt: null },
];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));
// Cooked products behave like ingredients on the plate.
ING_BY_ID.patty_cooked = { id: 'patty_cooked', name: 'Grilled Patty', color: '#7a4a2e', cooksAt: null };
ING_BY_ID.pasta_cooked = { id: 'pasta_cooked', name: 'Cooked Pasta', color: '#f7dc8a', cooksAt: null };

// ---- Recipes (the menu) ----
export const RECIPES = [
  { id: 'salad', name: 'Garden Salad', needs: ['lettuce', 'tomato', 'onion'], points: 40, coins: 8 },
  { id: 'grilled_cheese', name: 'Grilled Cheese', needs: ['bread', 'cheese'], points: 50, coins: 10 },
  { id: 'sandwich', name: 'Veggie Sandwich', needs: ['bread', 'lettuce', 'tomato', 'cheese'], points: 80, coins: 14 },
  { id: 'pasta', name: 'Pasta Marinara', needs: ['pasta_cooked', 'sauce', 'tomato'], points: 90, coins: 16 },
  { id: 'cheesy_pasta', name: 'Cheesy Pasta', needs: ['pasta_cooked', 'cheese', 'sauce'], points: 95, coins: 17 },
  { id: 'burger', name: 'Classic Burger', needs: ['bread', 'patty_cooked', 'cheese', 'lettuce'], points: 100, coins: 20 },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// ---- Tuning ----
export const TUNING = {
  maxOrders: 3,
  maxPlate: 6,
  spawnFirstSecs: 2,
  spawnIntervalStart: 13,
  spawnIntervalEnd: 8,
  patienceStart: 48,
  patienceEnd: 32,
  wrongServePenaltySecs: 0,
  stars: [400, 900, 1500], // score thresholds for 1/2/3 stars
};

// Deterministic RNG (mulberry32) so ?seed= replays the same shift.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fmtTime(secs) {
  const s = Math.max(0, Math.ceil(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
