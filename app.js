/* Plates — gym + meal tracker with a coach. Single-user, data stays on the phone. */
'use strict';

const APP_VERSION = '1.2.2';
const STORE_KEY = 'plates.v1';

/* ---------- Error banner: show any crash instead of failing silently ---------- */
function showError(msg) {
  const el = document.getElementById('err');
  if (!el) return;
  el.querySelector('.msg').textContent = 'Something went wrong: ' + msg + '. Tap Reload. Your data is safe.';
  el.classList.add('on');
}
window.addEventListener('error', e => showError(e.message || 'unknown error'));
window.addEventListener('unhandledrejection', e => showError((e.reason && e.reason.message) || String(e.reason)));

/* If the cached page and script don't match after an update, reload once */
if (window.SHELL_VERSION && window.SHELL_VERSION !== APP_VERSION) {
  try {
    if (sessionStorage.getItem('plates.reloaded') !== APP_VERSION) {
      sessionStorage.setItem('plates.reloaded', APP_VERSION);
      location.reload();
    }
  } catch (e) { /* ignore */ }
}

/* ---------- Utilities ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = n => Math.round(n * 10) / 10;
const fmtInt = n => Math.round(n).toLocaleString('en-GB');
const fmt1 = n => { const x = r1(n); return Number.isInteger(x) ? String(x) : x.toFixed(1); };
const num = v => { if (v === null || v === undefined) return NaN; const s = String(v).trim().replace(',', '.'); return s === '' ? NaN : Number(s); };
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const dkey = (d = new Date()) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const weekStart = k => { const d = parseKey(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dkey(d); };
const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 864e5);
const dateLabel = k => parseKey(k).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = k => parseKey(k).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const dur = ms => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`; };
const durWords = ms => { const m = Math.round(ms / 60000); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };
const relDay = k => { const n = daysBetween(k, dkey()); return n === 0 ? 'Today' : n === 1 ? 'Yesterday' : n < 7 ? `${n} days ago` : shortDate(k); };
const e1rm = (w, r) => (w > 0 && r > 0) ? w * (1 + Math.min(r, 15) / 30) : 0;

/* ---------- Icons ---------- */
const I = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const ICON = {
  today: I('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/><circle cx="12" cy="15" r="1.6" fill="currentColor"/>'),
  sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
  moon: I('<path d="M19.5 14.6A7.8 7.8 0 1 1 9.4 4.5a6.3 6.3 0 0 0 10.1 10.1z"/>'),
  train: I('<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>'),
  eat: I('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/>'),
  progress: I('<path d="M4 19.5h16"/><path d="M6 15.5l4-4.5 3.5 3 5-6.5"/>'),
  coach: I('<path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5h-1.5z"/><path d="M8.5 9.5h7M8.5 12.5h4"/>'),
  settings: I('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  left: I('<path d="M15 6l-6 6 6 6"/>'),
  right: I('<path d="M9 6l6 6-6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: I('<path d="M5 12.5l4.5 4.5L19 7" stroke-width="2.4"/>'),
  more: I('<circle cx="5.5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18.5" cy="12" r="1.2" fill="currentColor"/>'),
  drop: I('<path d="M12 3.5s6 6.8 6 10.8a6 6 0 0 1-12 0c0-4 6-10.8 6-10.8z"/>'),
  scale: I('<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 10a3.5 3.5 0 0 1 7 0M12 10l1.2-2"/>'),
  fork: I('<path d="M7 3.5v6a2 2 0 0 0 4 0v-6M9 11.5v9M16.5 3.5c-1.8 1-2.5 4-2.5 8h2.5v9"/>'),
  play: I('<path d="M7.5 5.5v13l11-6.5z" fill="currentColor"/>'),
  search: I('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>'),
  trophy: I('<path d="M8 4.5h8v4.5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v3.5M8.5 20h7M10 16.5h4"/>'),
  trash: I('<path d="M4.5 7h15M10 4h4M6.5 7l1 12.5h9l1-12.5"/>'),
  up: I('<path d="M6 15l6-6 6 6"/>'),
  down: I('<path d="M6 9l6 6 6-6"/>'),
  camera: I('<path d="M4 8.5a2 2 0 0 1 2-2h2l1.5-2h5l1.5 2h2a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>'),
  image: I('<rect x="4" y="5" width="16" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M5 17l4.5-4.5 3 3 2.5-2.5 4 4"/>')
};

/* ---------- Data lookups ---------- */
const DEFAULT_FOOD_PICKS = ['Chicken breast, cooked', 'Brânză de vaci (cottage cheese)', 'Skyr', 'Egg, whole', 'Tuna, canned in water', 'Whey protein', 'Greek yogurt 2%', 'Turkey breast, cooked'];
let EX_MAP = {};
function rebuildExMap() { EX_MAP = {}; for (const e of EXERCISES.concat(S.customEx)) EX_MAP[e.id] = e; }
function ex(id) { return EX_MAP[id] || { id, n: 'Unknown exercise', m: 'abs', s: [], eq: 'other', rr: [8, 12] }; }
function allFoods() { return FOODS.concat(S.customFoods); }
/* Romanian name to show under a food, unless the food is already named in Romanian */
function roLabel(f) { if (!f.ro) return ''; const r = f.ro.split(' / ')[0]; return norm(f.n).includes(norm(r)) ? '' : r; }
/* Search English and Romanian names, ignoring diacritics; best matches first */
function searchFoods(query, limit = 50) {
  const q = norm(query.trim()); if (!q) return [];
  const toks = q.split(/\s+/);
  const words = t => t.split(/[^a-z0-9%]+/).filter(Boolean);
  const allWordStarts = t => { const w = words(t); return toks.every(k => w.some(x => x.startsWith(k))); };
  const scored = [];
  for (const f of allFoods()) {
    const n = norm(f.n), names = (f.ro ? norm(f.ro).split(' / ') : []), hay = [n, ...names].join(' / ');
    if (!toks.every(t => hay.includes(t))) continue;
    let score;
    if (n === q || names.includes(q)) score = -1;                      // exact name, e.g. "ou", "cafea"
    else if (n.startsWith(q)) score = 0;                                // name starts with the search
    else if (names.some(x => x.startsWith(q))) score = 0.5;             // Romanian name starts with it
    else if (allWordStarts(n) || names.some(allWordStarts)) score = 1;  // every word matches one name, e.g. "piept pui"
    else if (hay.includes(q)) score = 1.5;
    else score = words(hay).some(w => w.startsWith(toks[0])) ? 2 : 3;
    if (f.custom) score -= 0.25;
    scored.push([score, f.n.length, f]);
  }
  return scored.sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, limit).map(x => x[2]);
}

function foodById(id) { return allFoods().find(f => f.id === id); }

/* ---------- State ---------- */
function defaults() {
  return {
    v: 1, onboarded: false,
    profile: { name: '', sex: 'male', age: 30, height: 178, weight: 78, activity: 1.55, goal: 'build' },
    targets: { kcal: 2700, p: 140, c: 340, f: 75, water: 2700 }, autoTargets: true,
    settings: { theme: 'auto', rest: 120, tips: 'sometimes' },
    customEx: [], templates: PRESET_TEMPLATES.map(t => ({ ...t, ex: [...t.ex] })),
    workouts: [], active: null,
    food: {}, water: {}, weights: [], customFoods: [],
    tipLog: { lastPopup: 0, shown: {}, dismissed: {} }
  };
}
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { s = null; }
  const d = defaults();
  if (!s || typeof s !== 'object') return d;
  for (const k of Object.keys(d)) if (s[k] === undefined || s[k] === null && k !== 'active') s[k] = d[k];
  s.profile = { ...d.profile, ...s.profile };
  s.settings = { ...d.settings, ...s.settings };
  s.targets = { ...d.targets, ...s.targets };
  s.tipLog = { ...d.tipLog, ...s.tipLog };
  // prune old dismissals
  const today = dkey();
  for (const [k, v] of Object.entries(s.tipLog.dismissed)) if (v !== today) delete s.tipLog.dismissed[k];
  return s;
}
let S = load();
function save() {
  _sorted = null;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
  catch (e) { toast('Couldn’t save. Your phone storage may be full.'); }
}
rebuildExMap();

const ui = {
  tab: (() => { try { return localStorage.getItem('plates.tab') || 'today'; } catch (e) { return 'today'; } })(),
  eatDate: dkey(), range: 30, coachFilter: 'all', tipOffset: 0,
  food: null, picker: null, tplEdit: null, confirm: null
};

/* ---------- Targets ---------- */
const GOALS = { build: 'Build muscle', cut: 'Lose fat', recomp: 'Recomp', maintain: 'Maintain' };
const GOAL_SHORT = { build: 'Muscle', cut: 'Fat loss', recomp: 'Recomp', maintain: 'Maintain' };
const GOAL_HELP = { build: 'Small calorie surplus to build muscle with little fat.', cut: 'Calorie deficit to lose fat while keeping muscle.', recomp: 'Eat near maintenance with high protein to slowly swap fat for muscle.', maintain: 'Keep your weight steady and stay strong.' };
const ACTIVITY = [
  [1.2, 'Desk job, little exercise'],
  [1.375, 'Light: 1–3 workouts a week'],
  [1.55, 'Moderate: 3–5 workouts a week'],
  [1.725, 'Very active: 6–7 workouts or a physical job'],
  [1.9, 'Athlete: hard training and a physical job']
];
function calcTargets(p) {
  const w = Number(p.weight) || 75, h = Number(p.height) || 175, a = Number(p.age) || 30;
  const bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === 'female' ? -161 : 5);
  const tdee = bmr * (Number(p.activity) || 1.55);
  const adj = { build: 250, cut: -Math.min(500, tdee * 0.2), recomp: -100, maintain: 0 }[p.goal] ?? 0;
  const floor = p.sex === 'female' ? 1300 : 1600;
  const kcal = Math.max(floor, Math.round((tdee + adj) / 50) * 50);
  const ppk = { build: 1.8, cut: 2.2, recomp: 2.0, maintain: 1.6 }[p.goal] ?? 1.8;
  const prot = Math.round(w * ppk / 5) * 5;
  const fat = Math.round(Math.max(w * 0.7, kcal * 0.25 / 9) / 5) * 5;
  const carbs = Math.max(50, Math.round((kcal - prot * 4 - fat * 9) / 4 / 5) * 5);
  const water = Math.max(2000, Math.round(w * 35 / 100) * 100);
  return { kcal, p: prot, c: carbs, f: fat, water, tdee: Math.round(tdee) };
}
function refreshTargets() {
  if (!S.autoTargets) return;
  const t = calcTargets(S.profile);
  S.targets = { kcal: t.kcal, p: t.p, c: t.c, f: t.f, water: t.water };
}

/* ---------- Food helpers ---------- */
function dayEntries(k) { return S.food[k] || []; }
function dayTotals(k) {
  const t = { k: 0, p: 0, c: 0, f: 0 };
  for (const e of dayEntries(k)) { t.k += e.k || 0; t.p += e.p || 0; t.c += e.c || 0; t.f += e.f || 0; }
  return t;
}
function portion(food, g) { const m = g / 100; return { k: food.k * m, p: food.p * m, c: food.c * m, f: food.f * m }; }
function defaultMeal() { const h = new Date().getHours(); return h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 17 ? 'snacks' : h < 22 ? 'dinner' : 'snacks'; }
const MEALS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks' };
function recentFoods(limit = 12) {
  const seen = new Set(), out = [];
  const keys = Object.keys(S.food).sort().reverse();
  for (const k of keys) {
    const list = [...S.food[k]].sort((a, b) => (b.t || 0) - (a.t || 0));
    for (const e of list) {
      if (!e.foodId || seen.has(e.foodId)) continue;
      const f = foodById(e.foodId); if (!f) continue;
      seen.add(e.foodId); out.push({ food: f, g: e.g });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/* ---------- Workout helpers ---------- */
function doneSets(w) { let n = 0; for (const x of w.exercises) for (const s of x.sets) if (s.done) n++; return n; }
function volume(w) { let v = 0; for (const x of w.exercises) for (const s of x.sets) if (s.done) v += (s.w || 0) * (s.r || 0); return v; }
function prCount(w) { let n = 0; for (const x of w.exercises) for (const s of x.sets) if (s.pr) n++; return n; }
let _sorted = null;
function sortedWorkouts() { if (!_sorted || _sorted.src !== S.workouts || _sorted.n !== S.workouts.length) _sorted = { src: S.workouts, n: S.workouts.length, list: [...S.workouts].sort((a, b) => b.start - a.start) }; return _sorted.list; }
function lastSession(exId) {
  for (const w of sortedWorkouts()) {
    const x = w.exercises.find(e => e.exId === exId);
    if (x) { const sets = x.sets.filter(s => s.done); if (sets.length) return { w, sets }; }
  }
  return null;
}
function sessionsFor(exId, n = 3) {
  const out = [];
  for (const w of sortedWorkouts()) {
    const x = w.exercises.find(e => e.exId === exId);
    if (x) { const sets = x.sets.filter(s => s.done); if (sets.length) out.push({ w, sets }); }
    if (out.length >= n) break;
  }
  return out;
}
function bestE1rm(exId) {
  let best = 0, set = null;
  for (const w of S.workouts) for (const x of w.exercises) if (x.exId === exId) for (const s of x.sets) if (s.done) { const v = e1rm(s.w, s.r); if (v > best) { best = v; set = s; } }
  return { best, set };
}
function increment(e) { return e.eq === 'dumbbell' ? 2 : (e.eq === 'bodyweight' ? 2.5 : 2.5); }
/* Double progression: hit the top of the rep range on every set, then add weight */
function progression(exId) {
  const e = ex(exId), last = lastSession(exId);
  if (!last) return null;
  const sets = last.sets;
  const topW = Math.max(...sets.map(s => s.w || 0));
  const allTop = sets.every(s => (s.r || 0) >= e.rr[1]);
  const anyLow = sets.some(s => (s.r || 0) < e.rr[0]);
  return { last, sets, topW, ready: allTop && sets.length > 0, low: anyLow, next: topW > 0 ? topW + increment(e) : 0 };
}
function setLabel(s) { return s.w ? `${fmt1(s.w)}×${s.r}` : `${s.r} reps`; }
function placeholders(exId, i) {
  const pg = progression(exId);
  const e = ex(exId);
  if (!pg) return { w: '', r: String(e.rr[0]) };
  const ref = pg.sets[Math.min(i, pg.sets.length - 1)];
  if (pg.ready && pg.next) return { w: fmt1(ref.w ? ref.w + increment(e) : 0), r: String(e.rr[0]) };
  return { w: ref.w ? fmt1(ref.w) : '', r: String(ref.r || e.rr[0]) };
}
function muscleSets(sinceKey, untilKey = dkey()) {
  const m = {}; for (const k of Object.keys(MUSCLES)) m[k] = 0;
  for (const w of S.workouts) {
    const k = dkey(w.start); if (k < sinceKey || k > untilKey) continue;
    for (const x of w.exercises) {
      const e = ex(x.exId); const n = x.sets.filter(s => s.done).length;
      if (m[e.m] !== undefined) m[e.m] += n;
      for (const s of e.s || []) if (m[s] !== undefined) m[s] += n * 0.5;
    }
  }
  return m;
}
function nextTemplate() {
  if (!S.templates.length) return null;
  const last = sortedWorkouts().find(w => w.tplId && S.templates.some(t => t.id === w.tplId));
  if (!last) return S.templates[0];
  const i = S.templates.findIndex(t => t.id === last.tplId);
  return S.templates[(i + 1) % S.templates.length];
}
function lastDoneTpl(id) { const w = sortedWorkouts().find(x => x.tplId === id); return w ? dkey(w.start) : null; }

/* ---------- Weight helpers ---------- */
function weightsSorted() { return [...S.weights].sort((a, b) => a.d < b.d ? -1 : 1); }
function latestWeight() { const w = weightsSorted(); return w.length ? w[w.length - 1].kg : Number(S.profile.weight) || null; }
/* kg per week from a least-squares line through the last `days` days */
function weightTrend(days = 21) {
  const since = addDays(dkey(), -days);
  const pts = weightsSorted().filter(w => w.d >= since);
  if (pts.length < 4) return null;
  const span = daysBetween(pts[0].d, pts[pts.length - 1].d);
  if (span < 10) return null;
  const xs = pts.map(p => daysBetween(pts[0].d, p.d)), ys = pts.map(p => p.kg);
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  let nu = 0, de = 0; for (let i = 0; i < xs.length; i++) { nu += (xs[i] - mx) * (ys[i] - my); de += (xs[i] - mx) ** 2; }
  const perDay = de ? nu / de : 0;
  const perWeek = perDay * 7;
  return { perWeek, pct: perWeek / my * 100, avg: my };
}

/* ---------- Coach engine ---------- */
function tipFor(t) { return { id: t.id, cat: t.cat, t: t.t, b: t.b }; }
function contextTips() {
  const out = [];
  const now = new Date(), h = now.getHours(), k = dkey();
  const T = S.targets, tot = dayTotals(k), water = S.water[k] || 0, goal = S.profile.goal;
  const entries = dayEntries(k);
  const bw = latestWeight() || 75;

  // Protein pacing
  const pLeft = T.p - tot.p;
  if (entries.length && h >= 15 && tot.p < T.p * 0.5) {
    out.push({ id: 'c_protein_low', cat: 'food', pr: 3, t: `${Math.round(pLeft)} g of protein to go`,
      b: `You're at ${Math.round(tot.p)} g of ${T.p} g. Easy ways to close the gap: a 250 g tub of brânză de vaci (~38 g), 150 g chicken breast (~46 g), a skyr (~15 g) or a scoop of whey (~23 g).`,
      action: { label: 'Log food', a: 'openFood' } });
  } else if (entries.length && h >= 19 && pLeft > 25) {
    out.push({ id: 'c_protein_eve', cat: 'food', pr: 2, t: `Still ${Math.round(pLeft)} g protein short`,
      b: 'A protein-rich snack before bed, like Greek yogurt, skyr or brânză de vaci, is an easy way to finish the day on target.',
      action: { label: 'Log food', a: 'openFood' } });
  }
  // Calories
  if (entries.length && h >= 20) {
    if ((goal === 'build') && tot.k < T.kcal * 0.75) {
      out.push({ id: 'c_kcal_low_bulk', cat: 'food', pr: 2, t: `${fmtInt(T.kcal - tot.k)} kcal under target`,
        b: 'Muscle needs a small surplus. Calorie-dense additions help: oats cooked in milk, a handful of nuts (~180 kcal), peanut butter on bread, or a glass of milk with dinner.' });
    } else if (goal === 'cut' && tot.k > T.kcal * 1.15) {
      out.push({ id: 'c_kcal_over_cut', cat: 'food', pr: 1, t: 'Over target today',
        b: 'One day over doesn’t undo a cut. Don’t compensate by starving tomorrow; just return to your normal target. The 7-day average is what counts.' });
    }
  }
  // Nothing logged
  if (!entries.length && h >= 13) {
    out.push({ id: 'c_no_food', cat: 'food', pr: 1, t: 'No meals logged today',
      b: 'Log what you eat and the coach can tell you how your protein and calories are tracking.',
      action: { label: 'Log food', a: 'openFood' } });
  }
  // Water
  if (h >= 14 && water < S.targets.water * 0.4) {
    out.push({ id: 'c_water', cat: 'water', pr: 1, t: 'Drink some water',
      b: `You've logged ${fmt1(water / 1000)} L of ${fmt1(S.targets.water / 1000)} L. Even mild dehydration makes training feel harder.`,
      action: { label: '+250 ml', a: 'water', ml: 250 } });
  }

  // Training recency
  const ws = sortedWorkouts();
  const last = ws[0];
  if (!S.active) {
    if (last) {
      const gap = daysBetween(dkey(last.start), k);
      if (gap >= 4) out.push({ id: 'c_gap', cat: 'train', pr: 2, t: `${gap} days since your last workout`,
        b: 'Short on time? A 30-minute full-body session with one press, one pull and one leg exercise keeps your progress moving.',
        action: { label: 'Start workout', a: 'startNext' } });
    } else if (S.onboarded) {
      out.push({ id: 'c_first', cat: 'train', pr: 2, t: 'Log your first workout',
        b: 'Pick a template on the Train tab. After one session, Plates will show your last numbers on every set and tell you when to add weight.',
        action: { label: 'Start workout', a: 'startNext' } });
    }
  }
  // Too many days in a row
  let streak = 0; for (let i = 0; i < 10; i++) { const d = addDays(k, -i); if (ws.some(w => dkey(w.start) === d)) streak++; else if (i > 0) break; }
  if (streak >= 6) out.push({ id: 'c_streak', cat: 'recover', pr: 2, t: `${streak} days of training in a row`, b: 'Muscle is built while you recover. Take a rest day or keep it to an easy walk.' });

  // Weekly volume per muscle (only once there's enough training to judge)
  const recent = ws.filter(w => daysBetween(dkey(w.start), k) <= 6);
  if (recent.length >= 2) {
    const ms = muscleSets(addDays(k, -6));
    const big = ['chest', 'back', 'quads', 'hamstrings', 'shoulders'];
    const low = big.filter(m => ms[m] < 6).sort((a, b) => ms[a] - ms[b]);
    if (low.length) {
      const m = low[0];
      const ideas = { chest: 'incline dumbbell press or dips', back: 'rows or pulldowns', quads: 'squats, leg press or split squats', hamstrings: 'Romanian deadlifts or leg curls', shoulders: 'lateral raises or overhead press' }[m];
      out.push({ id: 'c_vol_' + m, cat: 'train', pr: 2, t: `${MUSCLES[m]}: only ${fmt1(ms[m])} sets this week`,
        b: `Most people grow best with 10–20 hard sets per muscle a week. Add a few sets of ${ideas} to your next session.` });
    }
    const high = Object.keys(ms).filter(m => ms[m] > 24);
    if (high.length) out.push({ id: 'c_vol_high', cat: 'recover', pr: 1, t: `${MUSCLES[high[0]]}: ${fmt1(ms[high[0]])} sets this week`,
      b: 'That’s more than most people can recover from. If your numbers are stalling, cut back to about 15–20 sets.' });
  }

  // Progressive overload + stalls (last 14 days of exercises)
  const recentEx = [];
  for (const w of ws) { if (daysBetween(dkey(w.start), k) > 14) break; for (const x of w.exercises) if (!recentEx.includes(x.exId)) recentEx.push(x.exId); }
  let progTip = null, stallTip = null;
  for (const id of recentEx) {
    const pg = progression(id), e = ex(id);
    if (!progTip && pg && pg.ready && pg.topW > 0) {
      progTip = { id: 'c_prog_' + id, cat: 'train', pr: 3, t: `Ready to go heavier: ${e.n}`,
        b: `Last time you hit ${pg.sets.map(s => s.r).join(', ')} reps at ${fmt1(pg.topW)} kg, the top of the ${e.rr[0]}–${e.rr[1]} range. Next time use ${fmt1(pg.next)} kg and build the reps back up.` };
    }
    if (!stallTip && !(pg && pg.ready)) {
      const ss = sessionsFor(id, 3);
      if (ss.length === 3) {
        const best = ss.map(s => Math.max(...s.sets.map(x => e1rm(x.w, x.r))));
        const span = (ss[0].w.start - ss[2].w.start) / 864e5;
        if (best[2] > 0 && best[0] <= best[2] * 1.01 && best[1] <= best[2] * 1.01 && span >= 7) {
          stallTip = { id: 'c_stall_' + id, cat: 'train', pr: 2, t: `${e.n} has stalled`,
            b: 'No progress in your last three sessions. Check sleep and protein first. If those are fine, drop the weight 10% and build back up, or switch to a similar exercise for a few weeks.' };
        }
      }
    }
  }
  if (progTip) out.push(progTip);
  if (stallTip) out.push(stallTip);

  // Bodyweight trend vs goal
  const tr = weightTrend();
  if (tr) {
    const pct = tr.pct;
    const kgw = `${tr.perWeek >= 0 ? '+' : ''}${fmt1(tr.perWeek)} kg a week`;
    if (goal === 'build' && pct < 0.15) out.push({ id: 'c_w_bulk_slow', cat: 'food', pr: 3, t: 'Your weight is barely moving', b: `Trend: ${kgw}. For a lean bulk aim for about +${fmt1(bw * 0.0025)}–${fmt1(bw * 0.005)} kg a week. Add about 150–200 kcal a day, for example an extra 50 g of oats or a glass of milk.` });
    if (goal === 'build' && pct > 0.6) out.push({ id: 'c_w_bulk_fast', cat: 'food', pr: 2, t: 'Gaining faster than needed', b: `Trend: ${kgw}. Above ~0.5% of bodyweight a week, most of the extra is fat. Trim about 150–200 kcal a day.` });
    if (goal === 'cut' && pct > -0.25) out.push({ id: 'c_w_cut_slow', cat: 'food', pr: 3, t: 'Fat loss has slowed', b: `Trend: ${kgw}. Aim for 0.5–1% of bodyweight a week. Cut about 150–200 kcal a day or add a daily 30-minute walk.` });
    if (goal === 'cut' && pct < -1.1) out.push({ id: 'c_w_cut_fast', cat: 'food', pr: 3, t: 'Losing weight very fast', b: `Trend: ${kgw}. Losing more than ~1% a week risks muscle and strength. Add about 200 kcal a day, mostly from carbs around training.` });
  }
  // Weigh-in reminder
  const ws2 = weightsSorted();
  const lastW = ws2.length ? ws2[ws2.length - 1].d : null;
  if (S.onboarded && (!lastW || daysBetween(lastW, k) >= 7)) out.push({ id: 'c_weigh', cat: 'recover', pr: 1, t: 'Time for a weigh-in',
    b: 'Weigh yourself in the morning after the toilet, 3–4 times a week. The trend tells the coach whether your calories are right.', action: { label: 'Log weight', a: 'weightSheet' } });

  // Just trained
  if (last && !S.active && (Date.now() - (last.end || last.start)) < 2 * 3600e3 && tot.p < T.p * 0.7) {
    out.push({ id: 'c_post', cat: 'food', pr: 2, t: 'Refuel after training', b: 'Have a meal with 25–40 g of protein and some carbs in the next couple of hours, like chicken with rice or skyr with a banana and oats.', action: { label: 'Log food', a: 'openFood' } });
  }

  return out.filter(t => S.tipLog.dismissed[t.id] !== k).sort((a, b) => b.pr - a.pr);
}
function libraryForGoal() { const g = S.profile.goal; return TIPS.filter(t => !t.g || t.g.includes(g)); }
function dayIndex() { return Math.floor(parseKey(dkey()).getTime() / 864e5); }
function tipOfDay() { const lib = libraryForGoal(); return tipFor(lib[dayIndex() % lib.length]); }
function todayTipQueue() {
  const ctx = contextTips().filter(t => t.pr >= 2);
  const lib = libraryForGoal(); const start = dayIndex() % lib.length;
  const gen = []; for (let i = 0; i < lib.length; i++) gen.push(tipFor(lib[(start + i) % lib.length]));
  return ctx.concat(gen);
}
const POP = { often: { cool: 40 * 60e3, chance: 0.75 }, sometimes: { cool: 3 * 3600e3, chance: 0.4 }, off: null };
function maybeCoach(trigger) {
  const cfg = POP[S.settings.tips]; if (!cfg) return;
  if (S.active) return;
  const now = Date.now();
  if (now - (S.tipLog.lastPopup || 0) < cfg.cool) return;
  if (Math.random() > cfg.chance) return;
  const want = { food: ['food', 'water'], weight: ['food'], open: ['food', 'train', 'recover', 'water'], workout: ['train', 'food'] }[trigger] || ['food', 'train', 'recover'];
  const recentlyShown = id => now - (S.tipLog.shown[id] || 0) < 12 * 3600e3;
  let tip = contextTips().find(t => want.includes(t.cat) && !recentlyShown(t.id) && (trigger !== 'open' || t.pr >= 2));
  if (!tip) {
    const lib = libraryForGoal().filter(t => want.includes(t.cat) && now - (S.tipLog.shown[t.id] || 0) > 3 * 864e5);
    if (lib.length) tip = tipFor(lib[Math.floor(Math.random() * lib.length)]);
  }
  if (!tip) return;
  S.tipLog.lastPopup = now; S.tipLog.shown[tip.id] = now;
  // keep the shown-log small
  const ids = Object.keys(S.tipLog.shown); if (ids.length > 120) for (const id of ids.slice(0, ids.length - 100)) delete S.tipLog.shown[id];
  save();
  coachPop(tip);
}

/* ---------- Rendering ---------- */
const TABS = [['today', 'Today'], ['train', 'Train'], ['eat', 'Eat'], ['progress', 'Progress'], ['coach', 'Coach']];
function renderTabbar() {
  $('#tabbar').innerHTML = TABS.map(([id, label]) => `<button class="tab" data-a="tab" data-tab="${id}" ${ui.tab === id ? 'aria-current="page"' : ''}>${ICON[id]}<span>${label}</span>${id === 'train' && S.active ? '<span class="dot" aria-label="Workout in progress"></span>' : ''}</button>`).join('');
}
function render(resetScroll = false) {
  const v = $('#view'); const st = v.scrollTop;
  renderTabbar();
  v.innerHTML = VIEWS[ui.tab]();
  v.scrollTop = resetScroll ? 0 : st;
  tick();
}
function setTab(t) {
  ui.tab = t; try { localStorage.setItem('plates.tab', t); } catch (e) { /* ignore */ }
  render(true);
}
const isDark = () => S.settings.theme === 'dark' || (S.settings.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
function themeBtn() {
  const d = isDark();
  return `<button class="icon-btn" data-a="toggleTheme" aria-label="${d ? 'Switch to light mode' : 'Switch to dark mode'}" title="${d ? 'Light mode' : 'Dark mode'}">${d ? ICON.sun : ICON.moon}</button>`;
}
function applyTheme() {
  const t = S.settings.theme;
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  const dark = isDark();
  $('#theme-color').setAttribute('content', dark ? '#1A1D22' : '#EDEFF1');
}

/* ----- Today ----- */
function plateCol(cls, label, val, target, unit, decimals) {
  const pct = target > 0 ? clamp(val / target, 0, 1) : 0;
  const over = val > target * 1.05;
  const show = v => decimals ? fmt1(v) : fmtInt(v);
  return `<div class="plate-col ${cls}">
    <div class="plate" role="img" aria-label="${label}: ${show(val)} of ${show(target)} ${unit}"><div class="fill" style="height:${(pct * 100).toFixed(1)}%"></div>${over ? '<span class="over">over</span>' : ''}</div>
    <div class="plate-val">${show(val)}<small> / ${show(target)}${unit}</small></div>
    <div class="plate-lbl">${label}</div></div>`;
}
function viewToday() {
  const k = dkey(), T = S.targets, tot = dayTotals(k), water = S.water[k] || 0;
  const left = T.kcal - tot.k;
  const h = new Date().getHours();
  const greet = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return `<div class="screen">
    <header class="top">
      <div><div class="date-line">${dateLabel(k)}</div><h1 class="h-title">${greet}${S.profile.name ? ', ' + esc(S.profile.name) : ''}</h1></div>
      <div style="display:flex;gap:2px">${themeBtn()}<button class="icon-btn" data-a="settings" aria-label="Settings">${ICON.settings}</button></div>
    </header>
    <section class="fuel" aria-label="Today's food">
      <div class="kcal"><span class="kcal-big">${fmtInt(Math.abs(left))}</span><span class="kcal-unit">kcal ${left >= 0 ? 'left' : 'over'}</span></div>
      <div class="kcal-sub">${fmtInt(tot.k)} eaten of ${fmtInt(T.kcal)}</div>
      <div class="kbar"><i style="width:${clamp(tot.k / T.kcal * 100, 0, 100).toFixed(1)}%"></i></div>
      <div class="rack">
        ${plateCol('pc-protein', 'Protein', tot.p, T.p, ' g')}
        ${plateCol('pc-carbs', 'Carbs', tot.c, T.c, ' g')}
        ${plateCol('pc-fat', 'Fat', tot.f, T.f, ' g')}
        ${plateCol('pc-water', 'Water', water / 1000, T.water / 1000, ' L', true)}
      </div>
    </section>
    ${coachCard()}
    <h2 class="h-sec">Training</h2>
    ${trainCard()}
    <div class="quick">
      <button class="qt" data-a="water" data-ml="250"><span style="color:var(--water)">${ICON.drop}</span>+250 ml water</button>
      <button class="qt" data-a="openFood"><span style="color:var(--blue)">${ICON.fork}</span>Log food</button>
      <button class="qt" data-a="snap"><span style="color:var(--red)">${ICON.camera}</span>Snap a meal</button>
      <button class="qt" data-a="weightSheet"><span style="color:var(--green)">${ICON.scale}</span>Log weight</button>
    </div>
    ${weekStrip()}
  </div>`;
}
function coachCard() {
  const q = todayTipQueue(); if (!q.length) return '';
  const tip = q[ui.tipOffset % q.length];
  const act = tip.action ? `<button class="btn sm primary" data-a="${tip.action.a}" ${tip.action.ml ? `data-ml="${tip.action.ml}"` : ''}>${esc(tip.action.label)}</button>` : '';
  return `<section class="coach cat-${tip.cat}" aria-label="Coach tip">
    <div class="who">${ICON.coach}<span>Coach</span></div>
    <h3>${esc(tip.t)}</h3><p>${esc(tip.b)}</p>
    <div class="acts">${act}<button class="btn sm ghost" data-a="nextTip">Next tip</button><button class="btn sm ghost" data-a="tab" data-tab="coach">All tips</button></div>
  </section>`;
}
function trainCard() {
  if (S.active) {
    const a = S.active;
    return `<div class="start-card"><div class="label">Workout in progress</div><div class="what">${esc(a.name)}</div>
      <div class="list"><span data-tick="elapsed">${dur(Date.now() - a.start)}</span> so far, ${doneSets(a)} set${doneSets(a) === 1 ? '' : 's'} done</div>
      <button class="btn primary wide big" data-a="tab" data-tab="train">${ICON.play} Resume workout</button></div>`;
  }
  const k = dkey();
  const todayW = sortedWorkouts().filter(w => dkey(w.start) === k);
  const nt = nextTemplate();
  const doneLine = todayW.length ? `<div class="list" style="margin-bottom:10px">Done today: ${todayW.map(w => `${esc(w.name)} (${durWords((w.end || w.start) - w.start)}, ${doneSets(w)} sets)`).join(', ')}</div>` : '';
  if (!nt) return `<div class="start-card">${doneLine}<button class="btn primary wide big" data-a="startEmpty">${ICON.play} Start workout</button></div>`;
  return `<div class="start-card">${doneLine}
    <div class="label">${todayW.length ? 'Next in your rotation' : 'Up next'}</div>
    <div class="what">${esc(nt.name)}</div>
    <div class="list">${nt.ex.slice(0, 4).map(id => esc(ex(id).n)).join(', ')}${nt.ex.length > 4 ? ` and ${nt.ex.length - 4} more` : ''}</div>
    <button class="btn primary wide big" data-a="startTpl" data-id="${nt.id}">${ICON.play} Start ${esc(nt.name)}</button>
    <div class="chips mt">${S.templates.filter(t => t.id !== nt.id).map(t => `<button class="chip" data-a="startTpl" data-id="${t.id}">${esc(t.name)}</button>`).join('')}<button class="chip" data-a="startEmpty">Empty workout</button></div>
  </div>`;
}
function weekStrip() {
  const k = dkey(), ws = weekStart(k);
  const days = []; let n = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(ws, i);
    const trained = S.workouts.some(w => dkey(w.start) === d);
    if (trained) n++;
    const hit = dayTotals(d).p >= S.targets.p * 0.9;
    days.push(`<div class="wd ${trained ? 'trained' : ''} ${d === k ? 'today' : ''}" aria-label="${dateLabel(d)}${trained ? ', trained' : ''}${hit ? ', protein target hit' : ''}">
      <span>${'MTWTFSS'[i]}</span><span class="disc">${trained ? ICON.check : ''}</span><span class="pbar ${hit ? 'hit' : ''}"></span></div>`);
  }
  return `<h2 class="h-sec">This week <span class="aside">${n} workout${n === 1 ? '' : 's'}</span></h2>
    <div class="card"><div class="week" style="margin-top:0">${days.join('')}</div>
    <div class="legend"><span><i style="background:var(--red)"></i>Trained</span><span><i style="background:var(--blue);border-radius:2px;height:4px;width:14px;vertical-align:3px"></i>Protein target hit</span></div></div>`;
}

/* ----- Train ----- */
function viewTrain() {
  if (S.active) return viewActive();
  const hist = sortedWorkouts();
  const shown = hist.slice(0, ui.histMore ? 200 : 15);
  return `<div class="screen">
    <header class="top"><h1 class="h-title">Train</h1>${themeBtn()}</header>
    <div class="mt2"><button class="btn primary wide big" data-a="startEmpty">${ICON.play} Start empty workout</button></div>
    <h2 class="h-sec">Templates <button class="btn sm ghost" data-a="newTpl">${ICON.plus} New</button></h2>
    ${S.templates.length ? `<div class="tpl-grid">${S.templates.map(t => {
      const last = lastDoneTpl(t.id);
      return `<div class="tpl"><button class="tpl-hit" style="position:absolute;inset:0;border-radius:18px" data-a="startTpl" data-id="${t.id}" aria-label="Start ${esc(t.name)}"></button>
        <div class="name">${esc(t.name)}</div><div class="exs">${t.ex.slice(0, 4).map(id => esc(ex(id).n)).join('<br>')}${t.ex.length > 4 ? `<br>+${t.ex.length - 4} more` : ''}</div>
        <div class="when">${last ? 'Last done ' + relDay(last).toLowerCase() : 'Not done yet'}</div>
        <button class="more" data-a="editTpl" data-id="${t.id}" aria-label="Edit ${esc(t.name)}">${ICON.more}</button></div>`;
    }).join('')}</div>` : '<div class="group"><div class="empty">No templates yet. Create one to start workouts in one tap.</div></div>'}
    <h2 class="h-sec">History <span class="aside">${hist.length} workout${hist.length === 1 ? '' : 's'}</span></h2>
    ${hist.length ? `<div class="group">${shown.map(w => `<button class="row" data-a="woDetail" data-id="${w.id}">
        <div class="grow"><div class="title">${esc(w.name)} ${prCount(w) ? `<span class="badge">${ICON.trophy.replace('<svg', '<svg style="width:12px;height:12px"')} ${prCount(w)}</span>` : ''}</div>
        <div class="meta">${relDay(dkey(w.start))}, ${durWords((w.end || w.start) - w.start)}, ${doneSets(w)} sets, ${fmtInt(volume(w))} kg lifted</div></div>
        <span class="muted">${ICON.right.replace('<svg', '<svg style="width:18px;height:18px"')}</span></button>`).join('')}</div>
      ${hist.length > shown.length ? '<button class="btn text wide" data-a="histMore">Show all</button>' : ''}`
    : '<div class="group"><div class="empty">Finished workouts show up here.</div></div>'}
  </div>`;
}
function viewActive() {
  const a = S.active;
  const restLeft = a.restEnd ? a.restEnd - Date.now() : 0;
  return `<div class="screen" style="padding-top:0">
    <div class="wo-head">
      <div class="line1"><input class="wo-name" value="${esc(a.name)}" data-in="woName" aria-label="Workout name" enterkeyhint="done">
      ${themeBtn()}<button class="btn primary sm" data-a="finishWo">Finish</button></div>
      <div class="wo-meta"><span data-tick="elapsed">${dur(Date.now() - a.start)}</span>, <span>${doneSets(a)} set${doneSets(a) === 1 ? '' : 's'}</span>, <span>${fmtInt(volume(a))} kg</span></div>
      <div class="rest ${restLeft > 0 ? '' : 'hidden'}" id="rest"><span class="t"><small>Rest</small><span data-tick="rest">${dur(Math.max(0, restLeft))}</span></span>
        <button data-a="rest" data-d="-15">−15</button><button data-a="rest" data-d="15">+15</button><button data-a="rest" data-d="skip">Skip</button></div>
    </div>
    ${a.exercises.map((x, ei) => exBlock(x, ei)).join('') || '<div class="card mt2 empty">Add your first exercise to start logging sets.</div>'}
    <div class="mt"><button class="btn ghost wide big" data-a="addEx">${ICON.plus} Add exercise</button></div>
    <div class="mt2" style="text-align:center"><button class="btn text danger" data-a="cancelWo">Discard workout</button></div>
  </div>`;
}
function exBlock(x, ei) {
  const e = ex(x.exId);
  const pg = progression(x.exId);
  let hint;
  if (!pg) hint = `<p class="hint">First time logging this. Aim for ${e.rr[0]}–${e.rr[1]} reps with 1–3 left in the tank.</p>`;
  else if (pg.ready && pg.topW > 0) hint = `<p class="hint go">Last: ${pg.sets.map(setLabel).join(', ')}. <b>Go up to ${fmt1(pg.next)} kg</b> and aim for ${e.rr[0]}+ reps.</p>`;
  else if (pg.ready) hint = `<p class="hint go">Last: ${pg.sets.map(setLabel).join(', ')}. <b>Make it harder</b>: add weight or slow the reps down.</p>`;
  else hint = `<p class="hint">Last: ${pg.sets.map(setLabel).join(', ')}. <b>Beat it by one rep</b>, up to ${e.rr[1]} per set.</p>`;
  const rows = x.sets.map((s, si) => {
    const ph = placeholders(x.exId, si);
    const prev = pg ? pg.sets[si] : null;
    return `<span class="set-n ${s.pr ? 'pr' : s.done ? 'on' : ''}" title="${s.pr ? 'Personal record' : ''}">${s.pr ? '★' : si + 1}</span>
      <span class="set-prev">${prev ? setLabel(prev) : '–'}</span>
      <input class="${s.done ? 'on' : ''}" type="text" inputmode="decimal" enterkeyhint="next" data-in="w" data-ei="${ei}" data-si="${si}" value="${s.w ?? ''}" placeholder="${ph.w || 'kg'}" aria-label="Set ${si + 1} weight in kg">
      <input class="${s.done ? 'on' : ''}" type="text" inputmode="numeric" enterkeyhint="done" data-in="r" data-ei="${ei}" data-si="${si}" value="${s.r ?? ''}" placeholder="${ph.r}" aria-label="Set ${si + 1} reps">
      <button class="check ${s.done ? 'on' : ''}" data-a="toggleSet" data-ei="${ei}" data-si="${si}" aria-label="${s.done ? 'Undo' : 'Complete'} set ${si + 1}" aria-pressed="${s.done ? 'true' : 'false'}">${ICON.check}</button>`;
  }).join('');
  return `<section class="ex-block" aria-label="${esc(e.n)}">
    <div class="ex-top"><div style="flex:1;min-width:0"><h3>${esc(e.n)}</h3><div class="tag">${MUSCLES[e.m] || ''}, ${e.rr[0]}–${e.rr[1]} reps</div></div>
      <button class="icon-btn" data-a="exMenu" data-ei="${ei}" aria-label="Options for ${esc(e.n)}" style="margin:-8px -6px 0 0">${ICON.more}</button></div>
    ${hint}
    <div class="sets"><span class="hd l">Set</span><span class="hd l">Last</span><span class="hd">kg</span><span class="hd">Reps</span><span></span>${rows}</div>
    <div class="ex-foot"><button class="btn text" data-a="addSet" data-ei="${ei}">${ICON.plus} Add set</button></div>
  </section>`;
}

/* ----- Eat ----- */
function viewEat() {
  const k = ui.eatDate, T = S.targets, tot = dayTotals(k), water = S.water[k] || 0;
  const isToday = k === dkey();
  const label = isToday ? 'Today' : k === addDays(dkey(), -1) ? 'Yesterday' : dateLabel(k);
  const mbar = (cls, name, v, t) => `<div class="mbar ${cls}"><div class="lbl"><span>${name}</span></div><div class="v">${fmtInt(v)}<small> / ${fmtInt(t)} g</small></div><div class="track"><i style="width:${clamp(v / t * 100, 0, 100).toFixed(1)}%"></i></div></div>`;
  const glasses = Math.max(8, Math.ceil(T.water / 250));
  const full = Math.floor(water / 250);
  const meals = Object.entries(MEALS).map(([m, name]) => {
    const list = dayEntries(k).filter(e => e.meal === m);
    const mk = list.reduce((a, e) => a + e.k, 0);
    return `<div class="meal-h"><h2>${name}</h2><span class="k">${list.length ? fmtInt(mk) + ' kcal' : ''}</span></div>
      <div class="group">${list.map(e => `<button class="row food-r" data-a="editEntry" data-id="${e.id}">
          <div class="grow"><div class="title">${esc(e.name)}</div><div class="meta">${e.g ? fmtInt(e.g) + ' g, ' : ''}P ${fmtInt(e.p)} g, C ${fmtInt(e.c)} g, F ${fmtInt(e.f)} g</div></div>
          <div class="end"><span class="k">${fmtInt(e.k)}</span> <span class="small muted">kcal</span></div></button>`).join('')}
        <div class="row add-split"><button class="add-row" data-a="openFood" data-meal="${m}">${ICON.plus}<span>Add food</span></button><button class="icon-btn" data-a="snap" data-meal="${m}" aria-label="Snap a photo for ${name.toLowerCase()}" style="color:var(--red)">${ICON.camera}</button></div></div>`;
  }).join('');
  return `<div class="screen">
    <header class="top"><h1 class="h-title">Eat</h1>${themeBtn()}</header>
    <div class="daynav"><button class="icon-btn" data-a="eatDay" data-d="-1" aria-label="Previous day">${ICON.left}</button><span class="d">${label}</span><button class="icon-btn" data-a="eatDay" data-d="1" aria-label="Next day" ${isToday ? 'disabled style="opacity:.3"' : ''}>${ICON.right}</button></div>
    <div class="card mt">
      <div class="kcal"><span class="kcal-big" style="font-size:56px">${fmtInt(tot.k)}</span><span class="kcal-unit">of ${fmtInt(T.kcal)} kcal</span></div>
      <div class="kbar"><i style="width:${clamp(tot.k / T.kcal * 100, 0, 100).toFixed(1)}%"></i></div>
      <div class="macros">${mbar('pc-protein', 'Protein', tot.p, T.p)}${mbar('pc-carbs', 'Carbs', tot.c, T.c)}${mbar('pc-fat', 'Fat', tot.f, T.f)}</div>
    </div>
    <div class="card mt pc-water">
      <div class="water"><div style="flex:1"><div class="small muted" style="font-weight:600">Water</div><div class="num" style="font-size:26px">${fmt1(water / 1000)}<span class="small muted" style="font-family:var(--text)"> / ${fmt1(T.water / 1000)} L</span></div></div>
        <button class="btn sm ghost" data-a="water" data-ml="-250" aria-label="Remove 250 ml">−250</button>
        <button class="btn sm ghost" data-a="water" data-ml="250">+250</button>
        <button class="btn sm ghost" data-a="water" data-ml="500">+500</button></div>
      <div class="glasses" aria-hidden="true">${Array.from({ length: glasses }, (_, i) => `<span class="glass ${i < full ? 'full' : ''}"></span>`).join('')}</div>
    </div>
    ${meals}
  </div>`;
}

/* ----- Progress ----- */
function viewProgress() {
  const k = dkey();
  const wsorted = weightsSorted();
  const cur = wsorted.length ? wsorted[wsorted.length - 1] : null;
  const monthAgo = wsorted.filter(w => w.d <= addDays(k, -28));
  const ref = monthAgo.length ? monthAgo[monthAgo.length - 1] : (wsorted[0] || null);
  const change = cur && ref && ref !== cur ? cur.kg - ref.kg : null;
  const tr = weightTrend();
  const goalTxt = { build: 'For a lean bulk, about +0.25–0.5% of bodyweight a week is ideal.', cut: 'For a cut, about −0.5–1% of bodyweight a week is ideal.', recomp: 'For a recomp, your weight should stay about flat.', maintain: 'For maintenance, your weight should stay about flat.' }[S.profile.goal];

  // sets per muscle (last 7 days)
  const ms = muscleSets(addDays(k, -6));
  const maxSets = 24;
  const mrows = Object.entries(MUSCLES).map(([m, n]) => {
    const v = ms[m]; const cls = v === 0 ? '' : v < 10 ? 'low' : v <= 20 ? 'ok' : 'high';
    return `<div class="mrow"><span class="n">${n}</span><div class="mtrack"><span class="zone" style="left:${10 / maxSets * 100}%;width:${10 / maxSets * 100}%"></span><i class="${cls}" style="width:${clamp(v / maxSets * 100, v ? 3 : 0, 100)}%"></i></div><span class="v">${fmt1(v)}</span></div>`;
  }).join('');

  // workouts per week, 8 weeks
  const wk = []; const ws0 = weekStart(k);
  for (let i = 7; i >= 0; i--) { const s = addDays(ws0, -7 * i), e = addDays(s, 6); wk.push({ label: shortDate(s), v: S.workouts.filter(w => { const d = dkey(w.start); return d >= s && d <= e; }).length }); }

  // nutrition 7 days
  const nd = []; for (let i = 6; i >= 0; i--) { const d = addDays(k, -i); const t = dayTotals(d); nd.push({ d, label: 'MTWTFSS'[(parseKey(d).getDay() + 6) % 7], k: t.k, p: t.p, logged: dayEntries(d).length > 0 }); }
  const logged = nd.filter(x => x.logged);
  const avgK = logged.length ? logged.reduce((a, x) => a + x.k, 0) / logged.length : 0;
  const avgP = logged.length ? logged.reduce((a, x) => a + x.p, 0) / logged.length : 0;

  // PRs
  const exIds = [...new Set(S.workouts.flatMap(w => w.exercises.map(x => x.exId)))];
  const prs = exIds.map(id => ({ id, ...bestE1rm(id) })).filter(x => x.best > 0 && x.set && x.set.w > 0).sort((a, b) => b.best - a.best).slice(0, 10);

  return `<div class="screen">
    <header class="top"><h1 class="h-title">Progress</h1>${themeBtn()}</header>
    <h2 class="h-sec">Bodyweight</h2>
    <div class="card">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px">
        <div><div class="stat-big">${cur ? fmt1(cur.kg) : '–'}<small>kg</small></div>
        <div class="small muted" style="margin-top:6px">${change !== null ? `${change >= 0 ? '+' : ''}${fmt1(change)} kg since ${shortDate(ref.d)}` : 'Log a few weigh-ins to see your trend'}</div></div>
        <button class="btn sm dark" data-a="weightSheet">${ICON.plus} Log</button>
      </div>
      <div class="seg mt" role="group" aria-label="Chart range">${[[30, '1 month'], [90, '3 months'], [3650, 'All']].map(([d, l]) => `<button data-a="range" data-d="${d}" aria-pressed="${ui.range === d}">${l}</button>`).join('')}</div>
      ${weightChart(wsorted, ui.range)}
      ${tr ? `<p class="small muted" style="margin:10px 0 0">Trend over 3 weeks: <b style="color:var(--ink)">${tr.perWeek >= 0 ? '+' : ''}${fmt1(tr.perWeek)} kg a week</b> (${tr.pct >= 0 ? '+' : ''}${tr.pct.toFixed(2)}%). ${goalTxt}</p>` : ''}
    </div>
    <h2 class="h-sec">Sets per muscle <span class="aside">last 7 days</span></h2>
    <div class="card">${mrows}<p class="small muted" style="margin:8px 0 0">Green band: 10–20 hard sets a week, the range that suits most people. Secondary muscles count as half a set.</p></div>
    <h2 class="h-sec">Workouts per week</h2>
    <div class="card">${barChart(wk.map(x => x.v), wk.map(x => x.label), { color: 'var(--red)', int: true })}</div>
    <h2 class="h-sec">Food <span class="aside">last 7 days</span></h2>
    <div class="card">
      <div class="grid2"><div><div class="small muted">Average calories</div><div class="num" style="font-size:30px">${logged.length ? fmtInt(avgK) : '–'}<span class="small muted" style="font-family:var(--text)"> / ${fmtInt(S.targets.kcal)}</span></div></div>
      <div><div class="small muted">Average protein</div><div class="num" style="font-size:30px">${logged.length ? fmtInt(avgP) : '–'}<span class="small muted" style="font-family:var(--text)"> / ${S.targets.p} g</span></div></div></div>
      ${barChart(nd.map(x => x.k), nd.map(x => x.label), { color: 'var(--red)', target: S.targets.kcal })}
      <p class="small muted" style="margin:6px 0 0">Averages only count days with food logged (${logged.length} of 7).</p>
    </div>
    <h2 class="h-sec">Personal records</h2>
    ${prs.length ? `<div class="group">${prs.map(x => `<div class="row"><span style="color:var(--yellow-ink)">${ICON.trophy.replace('<svg', '<svg style="width:22px;height:22px"')}</span><div class="grow"><div class="title">${esc(ex(x.id).n)}</div><div class="meta">Best set ${fmt1(x.set.w)} kg × ${x.set.r}</div></div><div class="end"><div class="num" style="font-size:22px">${fmtInt(x.best)}</div><div class="small muted">est. 1RM kg</div></div></div>`).join('')}</div>`
    : '<div class="group"><div class="empty">Your best lifts appear here after your first workouts.</div></div>'}
  </div>`;
}
function weightChart(all, days) {
  const since = addDays(dkey(), -days);
  const pts = all.filter(w => w.d >= since);
  if (pts.length < 2) return `<div class="empty" style="padding:28px 0 12px">${pts.length ? 'One more weigh-in and your chart appears here.' : 'No weigh-ins in this range yet.'}</div>`;
  const W = 340, H = 160, L = 30, R = 8, T = 10, B = 22;
  const d0 = pts[0].d, span = Math.max(1, daysBetween(d0, pts[pts.length - 1].d));
  let lo = Math.min(...pts.map(p => p.kg)), hi = Math.max(...pts.map(p => p.kg));
  if (hi - lo < 2) { const m = (hi + lo) / 2; lo = m - 1; hi = m + 1; }
  lo = Math.floor(lo - 0.3); hi = Math.ceil(hi + 0.3);
  const x = d => L + daysBetween(d0, d) / span * (W - L - R);
  const y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  // 7-day rolling average
  const avg = pts.map(p => { const win = pts.filter(q => q.d <= p.d && q.d > addDays(p.d, -7)); return { d: p.d, kg: win.reduce((a, q) => a + q.kg, 0) / win.length }; });
  const ticks = [lo, (lo + hi) / 2, hi];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bodyweight chart from ${shortDate(pts[0].d)} to ${shortDate(pts[pts.length - 1].d)}">
    ${ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)"/><text x="${L - 6}" y="${y(t) + 3}" text-anchor="end">${fmt1(t)}</text>`).join('')}
    ${pts.map(p => `<circle cx="${x(p.d).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="3" fill="var(--steel)" opacity=".55"/>`).join('')}
    <path d="${avg.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)} ${y(p.kg).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <text x="${L}" y="${H - 4}">${shortDate(pts[0].d)}</text><text x="${W - R}" y="${H - 4}" text-anchor="end">${shortDate(pts[pts.length - 1].d)}</text>
  </svg><div class="small muted">Dots are weigh-ins, the line is your 7-day average.</div>`;
}
function barChart(vals, labels, o = {}) {
  const W = 340, H = 130, L = 4, R = 4, T = 14, B = 20;
  const max = Math.max(1, ...vals, o.target ? o.target * 1.1 : 0);
  const n = vals.length, slot = (W - L - R) / n, bw = Math.min(26, slot * 0.6);
  const y = v => T + (1 - v / max) * (H - T - B);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart">
    ${o.target ? `<line x1="${L}" x2="${W - R}" y1="${y(o.target)}" y2="${y(o.target)}" stroke="var(--ink-2)" stroke-dasharray="4 4"/><text x="${W - R}" y="${y(o.target) - 4}" text-anchor="end">target</text>` : ''}
    ${vals.map((v, i) => { const cx = L + slot * i + slot / 2; const h = (H - T - B) - (y(v) - T); return `${v > 0 ? `<rect x="${(cx - bw / 2).toFixed(1)}" y="${y(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" rx="4" fill="${o.color}"/>` : `<rect x="${(cx - bw / 2).toFixed(1)}" y="${H - B - 2}" width="${bw.toFixed(1)}" height="2" rx="1" fill="var(--surface-2)"/>`}
      ${o.int && v > 0 ? `<text x="${cx}" y="${y(v) - 4}" text-anchor="middle" style="fill:var(--ink);font-weight:700">${v}</text>` : ''}
      <text x="${cx}" y="${H - 5}" text-anchor="middle">${esc(labels[i])}</text>`; }).join('')}
  </svg>`;
}

/* ----- Coach ----- */
function viewCoach() {
  const ctx = contextTips();
  const td = tipOfDay();
  const lib = libraryForGoal().filter(t => ui.coachFilter === 'all' || t.cat === ui.coachFilter);
  return `<div class="screen">
    <header class="top"><h1 class="h-title">Coach</h1>${themeBtn()}</header>
    <p class="muted" style="margin:8px 0 0">Tips based on your training, food and bodyweight, set for your goal: <b style="color:var(--ink)">${GOALS[S.profile.goal].toLowerCase()}</b>.</p>
    <h2 class="h-sec">Right now</h2>
    ${ctx.length ? ctx.map(t => `<div class="ctx cat-${t.cat}"><h3>${esc(t.t)}</h3><p>${esc(t.b)}</p>
      <div class="acts">${t.action ? `<button class="btn sm primary" data-a="${t.action.a}" ${t.action.ml ? `data-ml="${t.action.ml}"` : ''}>${esc(t.action.label)}</button>` : ''}<button class="btn sm ghost" data-a="dismissTip" data-id="${t.id}">Hide for today</button></div></div>`).join('')
    : '<div class="group"><div class="empty">Nothing to flag right now. Keep logging workouts, meals and weigh-ins and the coach will speak up when something needs attention.</div></div>'}
    <h2 class="h-sec">Tip of the day</h2>
    <div class="coach cat-${td.cat}" style="margin-top:0"><div class="who">${ICON.coach}<span>${{ train: 'Training', food: 'Food', recover: 'Recovery' }[td.cat]}</span></div><h3>${esc(td.t)}</h3><p>${esc(td.b)}</p></div>
    <h2 class="h-sec">Pop-up tips</h2>
    <div class="seg" role="group" aria-label="How often tips pop up">${[['often', 'Often'], ['sometimes', 'Sometimes'], ['off', 'Off']].map(([v, l]) => `<button data-a="tipFreq" data-v="${v}" aria-pressed="${S.settings.tips === v}">${l}</button>`).join('')}</div>
    <p class="small muted" style="margin:8px 2px 0">Short tips appear after you log food, a weigh-in or a workout.</p>
    <h2 class="h-sec">Library</h2>
    <div class="chips" style="margin-bottom:12px">${[['all', 'All'], ['train', 'Training'], ['food', 'Food'], ['recover', 'Recovery']].map(([v, l]) => `<button class="chip" data-a="coachFilter" data-v="${v}" aria-pressed="${ui.coachFilter === v}">${l}</button>`).join('')}</div>
    ${lib.map(t => `<details class="tip cat-${t.cat}"><summary><i></i>${esc(t.t)}</summary><p>${esc(t.b)}</p></details>`).join('')}
    <p class="foot-note">General guidance for healthy adults, not medical advice. Talk to a doctor before big changes if you have a health condition.</p>
  </div>`;
}

const VIEWS = { today: viewToday, train: viewTrain, eat: viewEat, progress: viewProgress, coach: viewCoach };

/* ---------- Sheets ---------- */
function openSheet(html, o = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.dataset.kind = o.kind || '';
  wrap.innerHTML = `<div class="sheet-backdrop" ${o.locked ? '' : 'data-a="closeSheet"'}></div><div class="sheet ${o.full ? 'full' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  $('#sheets').appendChild(wrap);
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
  return wrap;
}
function topSheet() { const all = $$('#sheets .sheet-wrap:not(.closing)'); return all[all.length - 1] || null; }
function setSheet(html) { const s = topSheet(); if (s) s.querySelector('.sheet').innerHTML = html; }
function closeSheet() {
  const w = topSheet(); if (!w) return;
  if (w.dataset.kind === 'confirm' && ui.confirm) { const r = ui.confirm; ui.confirm = null; r(false); }
  w.classList.add('closing'); w.classList.remove('open');
  setTimeout(() => w.remove(), 260);
}
function closeAllSheets() { while (topSheet()) closeSheet(); }
const sheetHead = (title, closable = true) => `<div class="grab"></div><div class="sheet-h"><h2>${title}</h2>${closable ? `<button class="icon-btn" data-a="closeSheet" aria-label="Close">${ICON.close}</button>` : ''}</div>`;
function confirmBox(title, body, ok = 'Confirm', danger = false) {
  return new Promise(res => {
    ui.confirm = res;
    openSheet(`${sheetHead(esc(title), false)}<p class="muted" style="margin:4px 0 18px">${esc(body)}</p>
      <div class="grid2"><button class="btn ghost" data-a="confirmNo">Cancel</button><button class="btn ${danger ? 'primary' : 'dark'}" data-a="confirmYes">${esc(ok)}</button></div>`, { kind: 'confirm' });
  });
}

/* ----- Toasts ----- */
function dropToasts(sel) { $$(sel, $('#toasts')).forEach(t => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); }); }
function toast(msg, o = {}) {
  dropToasts('.toast:not(.coachpop)');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="grow">${esc(msg)}</span>${o.undo ? '<button type="button">Undo</button>' : ''}`;
  if (o.undo) el.querySelector('button').onclick = () => { o.undo(); el.remove(); };
  $('#toasts').appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, o.ms || 3200);
}
function coachPop(tip) {
  dropToasts('.coachpop');
  const el = document.createElement('div');
  el.className = `toast coachpop cat-${tip.cat}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `<div class="who">Coach tip</div><h4>${esc(tip.t)}</h4><p>${esc(tip.b)}</p><div class="acts"><button type="button" data-x="more">More tips</button><button type="button" data-x="ok">Got it</button></div>`;
  const kill = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); };
  el.querySelector('[data-x=ok]').onclick = kill;
  el.querySelector('h4').onclick = kill; el.querySelector('p').onclick = kill;
  el.querySelector('[data-x=more]').onclick = () => { kill(); closeAllSheets(); setTab('coach'); };
  $('#toasts').appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(kill, 10000);
}

/* ----- Onboarding & settings ----- */
function profileFields(p) {
  return `<label class="field"><span>Your name</span><input class="input" data-pf="name" value="${esc(p.name)}" placeholder="Optional" autocomplete="given-name"></label>
    <div class="field"><span>Goal</span><div class="seg" role="group">${Object.entries(GOAL_SHORT).map(([v, l]) => `<button data-a="pf" data-k="goal" data-v="${v}" aria-pressed="${p.goal === v}" aria-label="${GOALS[v]}">${l}</button>`).join('')}</div><p class="small muted" data-goalhelp style="margin:6px 2px 0">${GOAL_HELP[p.goal]}</p></div>
    <div class="field"><span>Sex (for the calorie formula)</span><div class="seg" role="group">${[['male', 'Male'], ['female', 'Female']].map(([v, l]) => `<button data-a="pf" data-k="sex" data-v="${v}" aria-pressed="${p.sex === v}">${l}</button>`).join('')}</div></div>
    <div class="grid3">
      <label class="field"><span>Age</span><input class="input" data-pf="age" inputmode="numeric" value="${esc(p.age)}"></label>
      <label class="field"><span>Height, cm</span><input class="input" data-pf="height" inputmode="numeric" value="${esc(p.height)}"></label>
      <label class="field"><span>Weight, kg</span><input class="input" data-pf="weight" inputmode="decimal" value="${esc(p.weight)}"></label>
    </div>
    <label class="field"><span>Activity</span><select class="select" data-pf="activity">${ACTIVITY.map(([v, l]) => `<option value="${v}" ${Number(p.activity) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
}
function targetsPreview(p) {
  const t = calcTargets(p);
  return `<div class="portion-macros" id="tprev">
    <div class="pm kc"><div class="v">${fmtInt(t.kcal)}</div><div class="l">kcal</div></div>
    <div class="pm pr"><div class="v">${t.p}</div><div class="l">protein g</div></div>
    <div class="pm cb"><div class="v">${t.c}</div><div class="l">carbs g</div></div>
    <div class="pm ft"><div class="v">${t.f}</div><div class="l">fat g</div></div></div>
    <p class="small muted" style="margin:8px 2px 0">Maintenance is about ${fmtInt(t.tdee)} kcal. Water target ${fmt1(t.water / 1000)} L.</p>`;
}
function onboarding() {
  ui.draft = { ...S.profile };
  openSheet(`${sheetHead('Set up Plates', false)}
    <p class="muted" style="margin:0 0 4px">A few details so the app can set your food targets and tailor the coach. Everything stays on this phone.</p>
    <div data-pform>${profileFields(ui.draft)}</div>
    <div class="sub-h">Your daily targets</div><div data-tprev>${targetsPreview(ui.draft)}</div>
    <div class="sticky-foot"><button class="btn primary wide big" data-a="finishOnboard">Start using Plates</button></div>`, { full: true, locked: true, kind: 'onboard' });
}
function settingsSheet() {
  ui.draft = { ...S.profile };
  ui.draftAuto = S.autoTargets;
  const T = S.targets;
  openSheet(`${sheetHead('Settings')}
    <div class="sub-h">Profile</div>
    <div data-pform>${profileFields(ui.draft)}</div>
    <div class="sub-h">Daily targets</div>
    <div class="seg" role="group">${[[true, 'Calculate for me'], [false, 'Set my own']].map(([v, l]) => `<button data-a="autoT" data-v="${v}" aria-pressed="${S.autoTargets === v}">${l}</button>`).join('')}</div>
    <div data-tprev>${S.autoTargets ? targetsPreview(ui.draft) : ''}</div>
    <div class="${S.autoTargets ? 'hidden' : ''}" data-manual>
      <div class="grid2"><label class="field"><span>Calories, kcal</span><input class="input" data-tf="kcal" inputmode="numeric" value="${T.kcal}"></label>
      <label class="field"><span>Protein, g</span><input class="input" data-tf="p" inputmode="numeric" value="${T.p}"></label>
      <label class="field"><span>Carbs, g</span><input class="input" data-tf="c" inputmode="numeric" value="${T.c}"></label>
      <label class="field"><span>Fat, g</span><input class="input" data-tf="f" inputmode="numeric" value="${T.f}"></label></div>
      <label class="field"><span>Water, ml</span><input class="input" data-tf="water" inputmode="numeric" value="${T.water}"></label>
    </div>
    <div class="sub-h">Rest timer</div>
    <div class="seg" role="group">${[60, 90, 120, 150, 180].map(v => `<button data-a="setRest" data-v="${v}" aria-pressed="${S.settings.rest === v}">${v < 120 ? v + 's' : (v / 60) + ' min'}</button>`).join('')}</div>
    <div class="sub-h">Coach pop-ups</div>
    <div class="seg" role="group">${[['often', 'Often'], ['sometimes', 'Sometimes'], ['off', 'Off']].map(([v, l]) => `<button data-a="tipFreq" data-v="${v}" aria-pressed="${S.settings.tips === v}">${l}</button>`).join('')}</div>
    <div class="sub-h">Dark mode</div>
    <div class="seg" role="group">${[['auto', 'Match phone'], ['light', 'Off'], ['dark', 'On']].map(([v, l]) => `<button data-a="theme" data-v="${v}" aria-pressed="${S.settings.theme === v}">${l}</button>`).join('')}</div>
    <div class="sub-h">Photo logging</div>
    <div data-aisetup>${aiSetupHTML('settings')}</div>
    <div class="sub-h">Your data</div>
    <div class="group">
      <button class="row" data-a="exportData"><div class="grow"><div class="title">Save a backup</div><div class="meta">Download all workouts, meals and settings as a file</div></div></button>
      <button class="row" data-a="importData"><div class="grow"><div class="title">Restore from backup</div><div class="meta">Replaces everything in the app with the file</div></div></button>
      <button class="row" data-a="resetAll"><div class="grow"><div class="title" style="color:var(--red)">Erase all data</div></div></button>
    </div>
    <input type="file" id="importFile" accept="application/json,.json" class="hidden">
    <div class="sticky-foot"><button class="btn dark wide big" data-a="saveSettings">Save</button></div>
    <p class="foot-note">Plates ${APP_VERSION}. Targets are estimates from the Mifflin–St Jeor formula, not medical advice.</p>`, { full: true, kind: 'settings' });
}
function readProfileForm(root) {
  const d = ui.draft;
  $$('[data-pf]', root).forEach(el => {
    const k = el.dataset.pf; let v = el.value;
    if (k === 'name') d.name = v.trim().slice(0, 30);
    else if (k === 'activity') d.activity = Number(v);
    else { const n = num(v); if (!isNaN(n) && n > 0) d[k] = n; }
  });
  return d;
}

/* ----- Weight sheet ----- */
function weightSheet() {
  const recent = weightsSorted().slice(-6).reverse();
  openSheet(`${sheetHead('Log weight')}
    <div class="grid2"><label class="field"><span>Weight, kg</span><input class="input" id="wkg" inputmode="decimal" value="${latestWeight() ? fmt1(latestWeight()) : ''}" enterkeyhint="done"></label>
    <label class="field"><span>Date</span><input class="input" id="wdate" type="date" value="${dkey()}" max="${dkey()}"></label></div>
    <p class="small muted" style="margin:10px 2px 0">Best taken in the morning, after the toilet, before eating.</p>
    <div class="mt"><button class="btn primary wide big" data-a="saveWeight">Save weight</button></div>
    ${recent.length ? `<div class="sub-h">Recent</div><div class="group">${recent.map(w => `<div class="row"><div class="grow"><div class="title">${fmt1(w.kg)} kg</div><div class="meta">${dateLabel(w.d)}</div></div><button class="icon-btn" data-a="delWeight" data-d="${w.d}" aria-label="Delete weigh-in from ${shortDate(w.d)}">${ICON.trash}</button></div>`).join('')}</div>` : ''}`, { kind: 'weight' });
}

/* ----- Food sheet ----- */
function openFood(meal, date) {
  ui.food = { meal: meal || defaultMeal(), date: date || (ui.tab === 'eat' ? ui.eatDate : dkey()), mode: 'search', q: '', food: null, g: 100, editId: null };
  openSheet('', { full: true, kind: 'food' });
  renderFood();
}
function foodResultsHTML() {
  const f = ui.food, q = norm(f.q.trim());
  const item = (food, g) => `<button class="row" data-a="pickFood" data-id="${food.id}" ${g ? `data-g="${g}"` : ''}><div class="grow"><div class="title">${esc(food.n)}</div><div class="meta">${roLabel(food) ? `${esc(roLabel(food))}, ` : ''}${g ? `${fmtInt(g)} g last time, ` : ''}${fmtInt(food.k)} kcal, P ${fmt1(food.p)} g per 100 g</div></div><span class="muted">${ICON.plus.replace('<svg', '<svg style="width:20px;height:20px"')}</span></button>`;
  if (!q) {
    const rec = recentFoods();
    const picks = DEFAULT_FOOD_PICKS.map(n => FOODS.find(x => x.n === n)).filter(Boolean);
    return `${rec.length ? `<div class="sub-h">Recent</div><div class="group">${rec.map(r => item(r.food, r.g)).join('')}</div>` : ''}
      <div class="sub-h">High-protein picks</div><div class="group">${picks.map(p => item(p)).join('')}</div>`;
  }
  const res = searchFoods(f.q);
  return `${res.length ? `<div class="group mt">${res.map(r => item(r)).join('')}</div>` : `<div class="group mt"><div class="empty">No match for “${esc(f.q)}”.</div></div>`}
    <div class="mt"><button class="btn ghost wide" data-a="foodMode" data-v="new">${ICON.plus} Create “${esc(f.q.trim())}” as a new food</button></div>`;
}
function mealSeg(cur) { return `<div class="seg" role="group" aria-label="Meal">${Object.entries(MEALS).map(([v, l]) => `<button data-a="foodMeal" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join('')}</div>`; }
function renderFood() {
  const f = ui.food; if (!f) return;
  const title = f.editId ? 'Edit entry' : f.mode === 'photo' ? 'Snap a meal' : `Add to ${MEALS[f.meal].toLowerCase()}`;
  let body = '';
  if (f.mode === 'photo') {
    body = `<div class="seg mt" role="group">${modeBtns(f)}</div>${photoHTML(f)}`;
  } else if (f.mode === 'portion' && f.food) {
    const food = f.food, m = portion(food, f.g || 0);
    const servings = [['100 g', 100], ...(food.sv || [])];
    body = `${f.editId ? '' : `<button class="btn text" data-a="foodMode" data-v="search" style="margin-left:-8px">${ICON.left} Back</button>`}
      <h3 style="margin:4px 2px 2px;font-size:20px">${esc(food.n)}</h3>${roLabel(food) ? `<div class="small muted" style="margin:0 2px 2px">${esc(roLabel(food))}</div>` : ''}
      <div class="small muted" style="margin:0 2px">Per 100 g: ${fmtInt(food.k)} kcal, P ${fmt1(food.p)}, C ${fmt1(food.c)}, F ${fmt1(food.f)} g</div>
      <div class="chips mt">${servings.map(([l, g]) => `<button class="chip" data-a="foodServ" data-g="${g}" aria-pressed="${Number(f.g) === g}">${esc(l)}${l.endsWith(' g') ? '' : ` (${g} g)`}</button>`).join('')}</div>
      <label class="field"><span>Amount, grams</span><input class="input" id="fgrams" inputmode="decimal" value="${f.g ?? ''}" enterkeyhint="done" style="font-size:22px;font-weight:700"></label>
      <div class="portion-macros" id="fmac">${macroBoxes(m)}</div>
      <div class="field"><span>Meal</span>${mealSeg(f.meal)}</div>
      <div class="sticky-foot">${f.editId ? `<div class="grid2"><button class="btn ghost danger" data-a="delEntry">Delete</button><button class="btn primary" data-a="saveEntry">Save</button></div>` : `<button class="btn primary wide big" data-a="addEntry">Add to ${MEALS[f.meal].toLowerCase()}</button>`}</div>`;
  } else if (f.mode === 'quick') {
    const e = f.quick || {};
    body = `<div class="seg mt" role="group">${modeBtns(f)}</div>
      <p class="small muted" style="margin:12px 2px 0">For restaurant meals or food you can’t weigh. Enter what you know; only calories are required.</p>
      <label class="field"><span>Name</span><input class="input" id="qname" value="${esc(e.name || '')}" placeholder="e.g. Lunch at work"></label>
      <div class="grid2"><label class="field"><span>Calories, kcal</span><input class="input" id="qk" inputmode="numeric" value="${e.k ?? ''}"></label>
      <label class="field"><span>Protein, g</span><input class="input" id="qp" inputmode="decimal" value="${e.p ?? ''}"></label>
      <label class="field"><span>Carbs, g</span><input class="input" id="qc" inputmode="decimal" value="${e.c ?? ''}"></label>
      <label class="field"><span>Fat, g</span><input class="input" id="qf" inputmode="decimal" value="${e.f ?? ''}"></label></div>
      <div class="field"><span>Meal</span>${mealSeg(f.meal)}</div>
      <div class="sticky-foot">${f.editId ? `<div class="grid2"><button class="btn ghost danger" data-a="delEntry">Delete</button><button class="btn primary" data-a="saveQuick">Save</button></div>` : `<button class="btn primary wide big" data-a="saveQuick">Add to ${MEALS[f.meal].toLowerCase()}</button>`}</div>`;
  } else if (f.mode === 'new') {
    body = `<div class="seg mt" role="group">${modeBtns(f)}</div>
      <p class="small muted" style="margin:12px 2px 0">Copy the values per 100 g from the packet. The food is saved for next time.</p>
      <label class="field"><span>Name</span><input class="input" id="nname" value="${esc(f.q.trim())}" placeholder="e.g. Protein pudding"></label>
      <div class="grid2"><label class="field"><span>kcal per 100 g</span><input class="input" id="nk" inputmode="decimal"></label>
      <label class="field"><span>Protein per 100 g</span><input class="input" id="np" inputmode="decimal"></label>
      <label class="field"><span>Carbs per 100 g</span><input class="input" id="nc" inputmode="decimal"></label>
      <label class="field"><span>Fat per 100 g</span><input class="input" id="nf" inputmode="decimal"></label>
      <label class="field"><span>Serving name (optional)</span><input class="input" id="nsv" placeholder="e.g. 1 pot"></label>
      <label class="field"><span>Serving, g</span><input class="input" id="nsg" inputmode="decimal"></label></div>
      <div class="sticky-foot"><button class="btn primary wide big" data-a="saveNewFood">Save food</button></div>`;
  } else {
    body = `<div class="seg mt" role="group">${modeBtns(f)}</div>
      <div class="search mt">${ICON.search}<input class="input" id="fq" type="search" placeholder="Search in English or Romanian" value="${esc(f.q)}" autocomplete="off" enterkeyhint="search"></div>
      <div id="fres">${foodResultsHTML()}</div>`;
  }
  setSheet(sheetHead(title) + body);
}
function modeBtns(f) { return [['search', 'Search'], ['photo', 'Photo'], ['quick', 'Quick add'], ['new', 'New food']].map(([v, l]) => `<button data-a="foodMode" data-v="${v}" aria-pressed="${f.mode === v}">${l}</button>`).join(''); }
function macroBoxes(m) {
  return `<div class="pm kc"><div class="v">${fmtInt(m.k)}</div><div class="l">kcal</div></div><div class="pm pr"><div class="v">${fmt1(m.p)}</div><div class="l">protein</div></div><div class="pm cb"><div class="v">${fmt1(m.c)}</div><div class="l">carbs</div></div><div class="pm ft"><div class="v">${fmt1(m.f)}</div><div class="l">fat</div></div>`;
}

/* ----- Photo logging: Google Gemini (free tier) or Claude, called straight from the phone with the user's own key ----- */
const AI_KEY = 'plates.ai';           // kept apart from the main data so backups never contain a key
const PROVIDERS = {
  gemini: {
    name: 'Gemini', seg: 'Gemini (free)',
    models: {
      best: { id: 'gemini-3.8-flash', label: 'Flash', cost: 'Free, about 20 photos a day. Plates switches to Flash-Lite if you go over.' },
      cheap: { id: 'gemini-3.5-flash-lite', label: 'Flash-Lite', cost: 'Free, hundreds of photos a day, a little less accurate.' }
    }
  },
  claude: {
    name: 'Claude', seg: 'Claude (paid)',
    models: {
      best: { id: 'claude-sonnet-5-5', label: 'Most accurate', cost: 'About 1 US cent per photo.' },
      cheap: { id: 'claude-haiku-5-5', label: 'Cheapest', cost: 'About 0.05 US cents per photo.' }
    }
  }
};
function aiCfg() {
  let c = {}; try { c = JSON.parse(localStorage.getItem(AI_KEY) || '{}') || {}; } catch (e) { c = {}; }
  // Someone who already saved a Claude key keeps Claude; everyone else starts on Gemini
  return { provider: c.provider || (c.key ? 'claude' : 'gemini'), key: '', gkey: '', model: 'best', gmodel: 'best', ...c, ...(c.provider ? {} : { provider: c.key ? 'claude' : 'gemini' }) };
}
function saveAi(c) { try { localStorage.setItem(AI_KEY, JSON.stringify(c)); } catch (e) { toast('Couldn’t save the key on this phone.'); } }
const aiKeyOf = c => c.provider === 'gemini' ? c.gkey : c.key;
const aiModelOf = c => c.provider === 'gemini' ? c.gmodel : c.model;
const hasAiKey = () => !!aiKeyOf(aiCfg());
const aiName = () => PROVIDERS[aiCfg().provider].name;

function aiSetupHTML(where) {
  const c = aiCfg(), P = PROVIDERS[c.provider], mk = aiModelOf(c);
  const provSeg = `<div class="seg" role="group" aria-label="AI service">${Object.entries(PROVIDERS).map(([v, p]) => `<button data-a="aiProvider" data-v="${v}" data-where="${where}" aria-pressed="${c.provider === v}">${p.seg}</button>`).join('')}</div>`;
  const models = `<div class="seg" role="group" aria-label="Photo accuracy">${Object.entries(P.models).map(([v, m]) => `<button data-a="aiModel" data-v="${v}" aria-pressed="${mk === v}">${m.label}</button>`).join('')}</div>
    <p class="small muted" style="margin:6px 2px 0" data-aicost>${P.models[mk].cost}</p>`;
  const key = aiKeyOf(c);
  if (key) {
    return `${provSeg}<div class="group mt"><div class="row"><div class="grow"><div class="title">${P.name} key saved</div><div class="meta">Ends in …${esc(key.slice(-4))}. Stored only on this phone.</div></div>
      <button class="btn sm ghost danger" data-a="aiRemoveKey" data-where="${where}">Remove</button></div></div>
      <div class="mt">${aiTestHTML()}<p class="small" data-aitest style="margin:8px 2px 0" aria-live="polite"></p></div>
      <div class="field"><span>Model</span>${models}</div>`;
  }
  const steps = c.provider === 'gemini'
    ? `<p style="margin:0 0 6px">Plates uses <b>Google Gemini</b> to recognise food in photos. You need a free API key from Google. No card is needed, and you must be 18 or older.</p>
      <ol class="small muted" style="margin:8px 0 0;padding-left:20px;line-height:1.55">
        <li>Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--blue)">aistudio.google.com/apikey</a> and sign in with your Google account.</li>
        <li>Accept the terms if asked, then tap <b>Create API key</b>.</li>
        <li>Copy the key. New keys start with <b>AQ.</b> and older ones with <b>AIza</b>. Both work.</li>
        <li>Paste it below.</li>
      </ol>`
    : `<p style="margin:0 0 6px">Plates uses <b>Claude</b>, Anthropic’s AI, to recognise food in photos. It needs your own API key. Each photo costs about 1 US cent on “Most accurate”, and new accounts get a small amount of free credit.</p>
      <ol class="small muted" style="margin:8px 0 0;padding-left:20px;line-height:1.55">
        <li>Open <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noopener" style="color:var(--blue)">platform.claude.com/settings/keys</a> and sign up or log in.</li>
        <li>Add credit under <b>Billing</b> if you have none. You can set a monthly spend limit there too.</li>
        <li>Tap <b>Create key</b>, choose the <b>Default</b> workspace, and copy the key.</li>
        <li>Paste it below.</li>
      </ol>`;
  const privacy = c.provider === 'gemini'
    ? 'The key stays on this phone and isn’t included in backups. For users in the EU, Google doesn’t use your photos to improve its products.'
    : 'The key stays on this phone and isn’t included in backups. Anthropic doesn’t use API photos to train its models.';
  return `${provSeg}<div class="card mt">${steps}
      <label class="field"><span>API key</span><input class="input" id="aikey" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${c.provider === 'gemini' ? 'AQ.…' : 'sk-ant-…'}"></label>
      <div class="field"><span>Model</span>${models}</div>
      <div class="mt"><button class="btn primary wide" data-a="aiSaveKey" data-where="${where}">Save key</button></div>
      <p class="small muted" style="margin:10px 2px 0">${privacy}</p>
    </div>`;
}
/* Quick check that the saved key works, without using a photo */
async function aiTest() {
  const c = aiCfg(), t0 = Date.now();
  const secs = () => ((Date.now() - t0) / 1000).toFixed(1);
  try {
    if (c.provider === 'gemini') {
      const res = await aiFetch(`https://generativelanguage.googleapis.com/v1beta/models/${PROVIDERS.gemini.models[c.gmodel].id}`, { headers: { 'x-goog-api-key': c.gkey } }, 20000);
      let data = null; try { data = await res.json(); } catch (e) { /* ignore */ }
      if (res.ok) return { ok: true, text: `Your key works. Google answered in ${secs()} s.` };
      const e = geminiHttpError(res, data);
      if (e instanceof QuotaError) return { ok: res.status !== 404, text: res.status === 404 ? 'Your key works, but this model isn’t available to it. Pick the other model above.' : 'Your key works, but today’s free limit is used up.', detail: e.detail };
      return { ok: false, text: e.message, detail: e.detail };
    }
    const res = await aiFetch('https://api.anthropic.com/v1/models', { headers: { 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' } }, 20000);
    let data = null; try { data = await res.json(); } catch (e) { /* ignore */ }
    if (res.ok) return { ok: true, text: `Your key works. Claude answered in ${secs()} s.` };
    const msg = (data && data.error && data.error.message) || '';
    return { ok: false, text: res.status === 401 ? 'Claude didn’t accept this key. Create a new one and save it here.' : `Claude returned an error (${res.status}).`, detail: `HTTP ${res.status}${msg ? ': ' + msg : ''}` };
  } catch (e) {
    return { ok: false, text: e instanceof NetError ? `Couldn’t connect to ${aiName()} at all. Check that other websites open, and turn off any VPN or ad blocker for a moment.` : e.message, detail: e.detail || '' };
  }
}
function aiTestHTML() { return `<button class="btn ghost wide" data-a="aiTest">Test key</button>`; }
function refreshAiSetup(where) {
  if (where === 'photo' && ui.food && ui.food.mode === 'photo') { renderFood(); return; }
  const box = $('[data-aisetup]'); if (box) box.innerHTML = aiSetupHTML('settings');
  if (ui.food && ui.food.mode === 'photo' && where !== 'settings') renderFood();
}

/* Shrink the photo on the phone before sending: faster, uses less quota, same accuracy for food */
function prepImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1024, sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * sc)), h = Math.max(1, Math.round(img.naturalHeight * sc));
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const dataUrl = cv.toDataURL('image/jpeg', 0.82);
      res({ dataUrl, b64: dataUrl.split(',')[1] });
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('That file isn’t a photo Plates can read.')); };
    img.src = url;
  });
}

const AI_FIELDS = {
  name: 'Short English name, e.g. "Sarmale" or "Grilled chicken breast"',
  name_ro: 'Romanian name',
  match: 'Number of the closest FOOD LIST entry for the same food, or -1 if none fits',
  grams: 'Estimated edible amount shown, in grams (1 ml of drink = 1 g)'
};
const AI_TOOL = {
  name: 'log_foods',
  description: 'Record every food and drink identified in the photo.',
  input_schema: {
    type: 'object',
    properties: {
      items: { type: 'array', items: { type: 'object', properties: {
        name: { type: 'string', description: AI_FIELDS.name }, name_ro: { type: 'string', description: AI_FIELDS.name_ro },
        match: { type: 'integer', description: AI_FIELDS.match }, grams: { type: 'number', description: AI_FIELDS.grams },
        kcal_100g: { type: 'number' }, protein_100g: { type: 'number' }, carbs_100g: { type: 'number' }, fat_100g: { type: 'number' },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
      }, required: ['name', 'match', 'grams', 'kcal_100g', 'protein_100g', 'carbs_100g', 'fat_100g', 'confidence'] } },
      note: { type: 'string', description: 'One short plain sentence for the user, e.g. the portion size assumed, or why no food was found' }
    },
    required: ['items', 'note']
  }
};
/* Same shape for Gemini, in its schema dialect */
const GEMINI_SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      name: { type: 'STRING', description: AI_FIELDS.name }, name_ro: { type: 'STRING', description: AI_FIELDS.name_ro },
      match: { type: 'INTEGER', description: AI_FIELDS.match }, grams: { type: 'NUMBER', description: AI_FIELDS.grams },
      kcal_100g: { type: 'NUMBER' }, protein_100g: { type: 'NUMBER' }, carbs_100g: { type: 'NUMBER' }, fat_100g: { type: 'NUMBER' },
      confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] }
    }, required: ['name', 'name_ro', 'match', 'grams', 'kcal_100g', 'protein_100g', 'carbs_100g', 'fat_100g', 'confidence'],
      propertyOrdering: ['name', 'name_ro', 'match', 'grams', 'kcal_100g', 'protein_100g', 'carbs_100g', 'fat_100g', 'confidence'] } },
    note: { type: 'STRING', description: 'One short plain sentence for the user, e.g. the portion size assumed, or why no food was found' }
  },
  required: ['items', 'note'], propertyOrdering: ['items', 'note']
};
function aiSystem(list, provider) {
  return `You look at a photo of food and estimate what is in it for a calorie-tracking app. The user lives in Romania, so expect Romanian dishes as well as international food and supermarket products.
${provider === 'gemini' ? 'Answer only with JSON that matches the response schema.' : 'Call the log_foods tool exactly once.'}
- One item per separate food or drink the person will eat. Split a plate into its parts when they are visibly separate (for example sarmale, mămăligă and smântână). Treat mixed dishes such as soup, stew or pasta with sauce as one item.
- grams: your best estimate of the edible amount shown, not the plate or packaging. Use size cues such as dinner plates (about 26 cm), cutlery, hands, glasses and cans.
- match: the number of the FOOD LIST entry that is the same food prepared roughly the same way, otherwise -1.
- Per-100 g values: your best estimate for the food as shown. If a nutrition label is visible, copy its per-100 g values.
- confidence: how sure you are about both what it is and how much.
- note: one short sentence, such as the portion size you assumed. If the photo has no food or drink, return no items and say so in the note.
FOOD LIST:
${list.map((f, i) => `${i}: ${f.n}${roLabel(f) ? ` (${roLabel(f)})` : ''}`).join('\n')}`;
}
/* When Google's free daily quota resets (midnight Pacific time), in the phone's own time zone */
function geminiResetTime() {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hourCycle: 'h23' });
    const d = new Date(); d.setMinutes(0, 0, 0);
    for (let i = 1; i <= 26; i++) { const t = new Date(d.getTime() + i * 3600e3); if (Number(fmt.format(t)) === 0) return t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  } catch (e) { /* fall through */ }
  return null;
}
function aiErr(msg, detail) { const e = new Error(msg); e.detail = detail || ''; return e; }
class NetError extends Error { constructor(msg, detail) { super(msg); this.detail = detail; } }
async function aiFetch(url, opts, ms = 60000) {
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
  catch (e) {
    if (e.name === 'AbortError') throw aiErr(`${aiName()} took too long to answer. Try again, or pick Flash-Lite in Settings for faster answers.`, `No answer after ${Math.round(ms / 1000)} seconds`);
    if (navigator.onLine === false) throw aiErr('You’re offline. Photo logging needs an internet connection.', `${e.name}: ${e.message}`);
    throw new NetError(`Couldn’t connect to ${aiName()}.`, `${e.name}: ${e.message}`);
  } finally { clearTimeout(timer); }
}
async function claudeCall(c, list, b64, hint) {
  const res = await aiFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({
      model: PROVIDERS.claude.models[c.model].id, max_tokens: 1500,
      system: aiSystem(list, 'claude'),
      tools: [AI_TOOL], tool_choice: { type: 'tool', name: 'log_foods' },
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
        { type: 'text', text: 'What food is in this photo, and how much?' + (hint ? `\nDetails from me: ${hint}` : '') }
      ] }]
    })
  });
  let data = null; try { data = await res.json(); } catch (e) { /* not JSON */ }
  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || '';
    if (res.status === 401) throw new Error('Claude didn’t accept your API key. It may have expired or been mistyped. Add a new one in Settings, under Photo logging.');
    if (/workspace/i.test(msg)) throw new Error('This key isn’t linked to a workspace. Create a new key, choose the Default workspace, and save it in Settings.');
    if (/credit balance/i.test(msg)) throw new Error('Your Anthropic account is out of credit. Add credit in the Claude Console under Billing.');
    if (res.status === 403) throw new Error('This key isn’t allowed to use Claude. Check its permissions in the Claude Console.');
    if (res.status === 404 || (/model/i.test(msg) && res.status === 400)) throw new Error('That AI model isn’t available on your account. Switch the model in Settings and try again.');
    if (res.status === 429) throw new Error('Too many photos in a short time. Wait a minute and try again.');
    if (res.status >= 500) throw new Error('Claude is busy right now. Try again in a moment.');
    throw new Error(`Claude returned an error (${res.status})${msg ? ': ' + msg : ''}.`);
  }
  const block = data && Array.isArray(data.content) && data.content.find(b => b.type === 'tool_use');
  if (!block || !block.input) throw new Error('Claude’s answer couldn’t be read. Try again.');
  return block.input;
}
class QuotaError extends Error {}
function geminiHttpError(res, data) {
  const err = (data && data.error) || {}, msg = err.message || '', st = err.status || '';
  const reasons = JSON.stringify(err.details || []);
  const detail = `HTTP ${res.status}${st ? ' ' + st : ''}${msg ? ': ' + msg : ''}`.slice(0, 300);
  if (/API_KEY_INVALID|API key not valid|API key expired/i.test(msg + reasons)) return aiErr('Google didn’t accept your Gemini API key. It may have been mistyped or deleted. Add a new one in Settings, under Photo logging.', detail);
  if (res.status === 401 || st === 'UNAUTHENTICATED' || /ACCESS_TOKEN_TYPE_UNSUPPORTED/.test(reasons)) return aiErr('Google refused this key. Some new AQ. keys from AI Studio have this problem on Google’s side. Create a new key in AI Studio (in a new project if it offers one) and save it in Settings, or switch to Claude there.', detail);
  if (/location is not supported/i.test(msg)) return aiErr('Google doesn’t offer the Gemini API where you are right now.', detail);
  if (res.status === 429 || st === 'RESOURCE_EXHAUSTED') { const q = new QuotaError(msg); q.detail = detail; return q; }
  if (res.status === 403) return aiErr('This key can’t use the Gemini API. Create a new key at aistudio.google.com/apikey and save it in Settings.', detail);
  if (res.status === 404) { const q = new QuotaError('model not found'); q.detail = detail; return q; }   // try the other model
  if (res.status >= 500) return aiErr('Gemini is busy right now. Try again in a moment.', detail);
  return aiErr(`Gemini returned an error (${res.status}).`, detail);
}
async function geminiCall(c, list, b64, hint, modelKey, think = true) {
  const model = PROVIDERS.gemini.models[modelKey].id;
  const gen = { responseMimeType: 'application/json', responseSchema: GEMINI_SCHEMA, temperature: 0.2 };
  if (think && modelKey === 'best') gen.thinkingConfig = { thinkingLevel: 'low' };   // Flash thinks at "medium" by default; "low" answers faster
  const res = await aiFetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': c.gkey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: aiSystem(list, 'gemini') }] },
      contents: [{ role: 'user', parts: [
        { inlineData: { mimeType: 'image/jpeg', data: b64 } },
        { text: 'What food is in this photo, and how much?' + (hint ? `\nDetails from me: ${hint}` : '') }
      ] }],
      generationConfig: gen
    })
  });
  let data = null; try { data = await res.json(); } catch (e) { /* not JSON */ }
  if (!res.ok) {
    const m = (data && data.error && data.error.message) || '';
    if (res.status === 400 && gen.thinkingConfig && /thinking/i.test(m)) return geminiCall(c, list, b64, hint, modelKey, false);
    throw geminiHttpError(res, data);
  }
  if (data && data.promptFeedback && data.promptFeedback.blockReason) throw aiErr('Gemini wouldn’t analyse this photo. Try another one.', 'Blocked: ' + data.promptFeedback.blockReason);
  const cand = data && data.candidates && data.candidates[0];
  const text = cand && cand.content && Array.isArray(cand.content.parts) ? cand.content.parts.filter(p => typeof p.text === 'string' && !p.thought).map(p => p.text).join('') : '';
  if (!text) throw aiErr(cand && cand.finishReason === 'SAFETY' ? 'Gemini wouldn’t analyse this photo. Try another one.' : 'Gemini’s answer was empty. Try again.', cand && cand.finishReason ? 'finishReason: ' + cand.finishReason : '');
  try { return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); }
  catch (e) { throw aiErr('Gemini’s answer couldn’t be read. Try again.', text.slice(0, 120)); }
}
async function aiAnalyze(b64, hint) {
  const c = aiCfg();
  const list = allFoods();
  let raw, extraNote = '', lastErr = null;
  if (c.provider === 'gemini') {
    const order = c.gmodel === 'cheap' ? ['cheap'] : ['best', 'cheap'];
    for (let i = 0; i < order.length; i++) {
      try { raw = await geminiCall(c, list, b64, hint, order[i]); if (i > 0) extraNote = lastErr instanceof QuotaError ? 'Used Flash-Lite because the free daily limit for Flash was reached.' : 'Used Flash-Lite because Flash didn’t answer.'; break; }
      catch (e) {
        lastErr = e;
        const canFallBack = e instanceof QuotaError || e instanceof NetError;
        if (!canFallBack) throw e;
        if (i === order.length - 1) {
          if (e instanceof NetError) throw aiErr('Couldn’t connect to Gemini. If your internet works, Google may be refusing the key in a way the phone can’t show. Tap Test key below to check it.', e.detail);
          const t = geminiResetTime();
          throw aiErr(`You’ve used Google’s free photo limit for today${t ? `. It resets at ${t}` : ''}. You can still log food with search or quick add.`, e.detail);
        }
      }
    }
  } else {
    try { raw = await claudeCall(c, list, b64, hint); }
    catch (e) { if (e instanceof NetError) throw aiErr('Couldn’t connect to Claude. Check your internet, then tap Test key below.', e.detail); throw e; }
  }
  if (!raw || !Array.isArray(raw.items)) throw new Error(`${aiName()}’s answer couldn’t be read. Try again.`);
  const n = v => (typeof v === 'number' && isFinite(v) ? v : Number(v) || 0);
  const items = raw.items.slice(0, 12).map(it => {
    const mi = Number(it.match);
    const m = Number.isInteger(mi) && mi >= 0 && mi < list.length ? list[mi] : null;
    const p100 = m ? { k: m.k, p: m.p, c: m.c, f: m.f } : { k: clamp(n(it.kcal_100g), 0, 900), p: clamp(n(it.protein_100g), 0, 100), c: clamp(n(it.carbs_100g), 0, 100), f: clamp(n(it.fat_100g), 0, 100) };
    return { on: true, name: m ? m.n : String(it.name || 'Food').slice(0, 60), seen: String(it.name || ''), ro: it.name_ro ? String(it.name_ro).slice(0, 60) : '', food: m, p100, g: Math.round(clamp(n(it.grams), 1, 3000)), conf: ['high', 'medium', 'low'].includes(it.confidence) ? it.confidence : 'medium' };
  });
  const note = [String(raw.note || '').slice(0, 240), extraNote].filter(Boolean).join(' ');
  return { items, note };
}

function photoHTML(f) {
  const ph = f.photo || { state: 'idle' };
  if (!hasAiKey()) return `<div class="mt">${aiSetupHTML('photo')}</div>`;
  if (ph.state === 'idle') {
    return `<div class="photo-pick mt">
        <button class="btn primary wide big" data-a="photoPick" data-src="cam">${ICON.camera} Take a photo</button>
        <button class="btn ghost wide big" data-a="photoPick" data-src="lib">${ICON.image} Choose from photos</button>
      </div>
      <p class="small muted" style="margin:12px 2px 0">Works best from above, with the whole plate in view and good light. You can also snap a nutrition label.</p>`;
  }
  const img = ph.dataUrl ? `<img class="photo-prev" src="${ph.dataUrl}" alt="Your food photo">` : '';
  if (ph.state === 'loading') return `${img}<div class="ai-wait" role="status"><span class="spin" aria-hidden="true"></span>${aiName()} is looking at your food… <span data-aielapsed="${ph.started || Date.now()}">0 s</span></div>
      <p class="small muted hidden" data-aislow style="text-align:center;margin:0">This can take up to half a minute. Keep Plates open.</p>`;
  if (ph.state === 'error') return `${img}<div class="card mt" role="alert"><p style="margin:0">${esc(ph.error)}</p>${ph.detail ? `<p class="small muted" style="margin:8px 0 0;word-break:break-word">Details: ${esc(ph.detail)}</p>` : ''}</div>
      <div class="grid2 mt"><button class="btn ghost" data-a="photoReset">New photo</button><button class="btn primary" data-a="photoRetry">Try again</button></div>
      <div class="mt">${aiTestHTML()}<p class="small" data-aitest style="margin:8px 2px 0" aria-live="polite"></p></div>`;
  // review
  const items = ph.items || [];
  const rows = items.map((it, i) => {
    const m = portion(it.p100, it.g || 0);
    const sub = it.food ? 'From the food list' : 'AI estimate';
    const sure = it.conf === 'low' ? ', not sure: check it' : '';
    return `<div class="ai-item ${it.on ? '' : 'off'}">
        <button class="ai-check ${it.on ? 'on' : ''}" data-a="aiToggle" data-i="${i}" aria-pressed="${it.on}" aria-label="Include ${esc(it.name)}">${ICON.check}</button>
        <div class="grow"><div class="title">${esc(it.name)}</div><div class="meta">${sub}${sure}${it.ro && !it.food ? `, ${esc(it.ro)}` : ''}</div>
          <div class="ai-k" data-aik="${i}">${fmtInt(m.k)} kcal, P ${fmt1(m.p)} g</div></div>
        <label class="ai-g"><input class="input" inputmode="decimal" data-in="aiG" data-i="${i}" value="${it.g}" aria-label="${esc(it.name)} grams"><span>g</span></label>
      </div>`;
  }).join('');
  const t = aiTotals(items);
  return `${img}
    ${ph.note ? `<p class="small muted" style="margin:10px 2px 0">${esc(ph.note)}</p>` : ''}
    ${items.length ? `<div class="group mt">${rows}</div>
      <div class="portion-macros" id="aitot">${macroBoxes(t)}</div>
      <div class="field"><span>Meal</span>${mealSeg(f.meal)}</div>`
      : '<div class="group mt"><div class="empty">No food found in this photo.</div></div>'}
    <div class="field"><span>Not quite right? Add details and try again</span><div style="display:flex;gap:8px"><input class="input" id="aihint" placeholder="e.g. 2 eggs, milk is 1.5%, ate half" value="${esc(ph.hint || '')}" style="flex:1"><button class="btn ghost" data-a="photoRetry">Retry</button></div></div>
    ${items.length ? `<div class="sticky-foot"><button class="btn primary wide big" data-a="aiAdd" ${t.n ? '' : 'disabled'}>Add ${t.n} item${t.n === 1 ? '' : 's'} to ${MEALS[f.meal].toLowerCase()}</button></div>` : `<div class="mt"><button class="btn ghost wide" data-a="photoReset">New photo</button></div>`}`;
}
function aiTotals(items) {
  const t = { k: 0, p: 0, c: 0, f: 0, n: 0 };
  for (const it of items) if (it.on) { const m = portion(it.p100, it.g || 0); t.k += m.k; t.p += m.p; t.c += m.c; t.f += m.f; t.n++; }
  return t;
}
async function runPhoto(file) {
  const f = ui.food; if (!f) return;
  f.mode = 'photo';
  try {
    const img = await prepImage(file);
    f.photo = { state: 'loading', dataUrl: img.dataUrl, b64: img.b64, hint: '', started: Date.now() };
  } catch (e) { f.photo = { state: 'error', error: e.message }; renderFood(); return; }
  renderFood();
  await analyzeCurrent();
}
async function analyzeCurrent() {
  const f = ui.food; if (!f || !f.photo || !f.photo.b64) return;
  const ph = f.photo; ph.state = 'loading'; ph.started = Date.now(); renderFood();
  try {
    const r = await aiAnalyze(ph.b64, ph.hint);
    if (ui.food !== f) return;                 // sheet was closed meanwhile
    Object.assign(ph, { state: 'review', items: r.items, note: r.note });
  } catch (e) {
    if (ui.food !== f) return;
    Object.assign(ph, { state: 'error', error: e.message, detail: e.detail || '' });
  }
  renderFood();
}

/* ----- Exercise picker ----- */
function openPicker(target) {
  ui.picker = { target, q: '', m: 'all', sel: [] };
  openSheet('', { full: true, kind: 'picker' });
  renderPicker();
}
function pickerListHTML() {
  const p = ui.picker, q = norm(p.q.trim());
  const list = EXERCISES.concat(S.customEx).filter(e => (p.m === 'all' || e.m === p.m) && (!q || q.split(/\s+/).every(t => norm(e.n).includes(t))));
  const used = new Set(); for (const w of S.workouts) for (const x of w.exercises) used.add(x.exId);
  list.sort((a, b) => (used.has(b.id) - used.has(a.id)) || a.n.localeCompare(b.n));
  const rows = list.map(e => {
    const on = p.sel.includes(e.id);
    return `<button class="row" data-a="pickEx" data-id="${e.id}" aria-pressed="${on}"><div class="grow"><div class="title">${esc(e.n)}</div><div class="meta">${MUSCLES[e.m]}${e.custom ? ', your exercise' : ''}${used.has(e.id) ? ', done before' : ''}</div></div><span class="${on ? 'picked' : 'muted'}">${on ? ICON.check : ICON.plus.replace('<svg', '<svg style="width:20px;height:20px"')}</span></button>`;
  }).join('');
  return `${list.length ? `<div class="group mt">${rows}</div>` : '<div class="group mt"><div class="empty">No exercise matches.</div></div>'}
    ${q ? `<div class="mt"><button class="btn ghost wide" data-a="newEx">${ICON.plus} Create “${esc(p.q.trim())}”</button></div>` : ''}`;
}
function renderPicker() {
  const p = ui.picker;
  setSheet(`${sheetHead('Add exercises')}
    <div class="search">${ICON.search}<input class="input" id="pq" type="search" placeholder="Search exercises" value="${esc(p.q)}" autocomplete="off"></div>
    <div class="chips mt">${[['all', 'All'], ...Object.entries(MUSCLES)].map(([v, l]) => `<button class="chip" data-a="pickM" data-v="${v}" aria-pressed="${p.m === v}">${l}</button>`).join('')}</div>
    <div id="pres">${pickerListHTML()}</div>
    <div class="sticky-foot"><button class="btn primary wide big" data-a="pickDone" ${p.sel.length ? '' : 'disabled'}>${p.sel.length ? `Add ${p.sel.length} exercise${p.sel.length > 1 ? 's' : ''}` : 'Select exercises'}</button></div>`);
}
function newExSheet(name) {
  openSheet(`${sheetHead('New exercise')}
    <label class="field"><span>Name</span><input class="input" id="exn" value="${esc(name)}"></label>
    <label class="field"><span>Main muscle</span><select class="select" id="exm">${Object.entries(MUSCLES).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
    <label class="field"><span>Equipment</span><select class="select" id="exq">${['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'].map(v => `<option value="${v}">${v[0].toUpperCase() + v.slice(1)}</option>`).join('')}</select></label>
    <div class="grid2"><label class="field"><span>Reps from</span><input class="input" id="exr0" inputmode="numeric" value="8"></label><label class="field"><span>Reps to</span><input class="input" id="exr1" inputmode="numeric" value="12"></label></div>
    <div class="mt2"><button class="btn primary wide big" data-a="saveNewEx">Create exercise</button></div>`, { kind: 'newex' });
}

/* ----- Template editor ----- */
function tplSheet(id) {
  const t = id ? S.templates.find(x => x.id === id) : null;
  ui.tplEdit = { id: t ? t.id : null, name: t ? t.name : '', ex: t ? [...t.ex] : [] };
  openSheet('', { full: true, kind: 'tpl' });
  renderTpl();
}
function renderTpl() {
  const t = ui.tplEdit;
  setSheet(`${sheetHead(t.id ? 'Edit template' : 'New template')}
    <label class="field"><span>Name</span><input class="input" id="tname" value="${esc(t.name)}" placeholder="e.g. Upper A"></label>
    <div class="sub-h">Exercises</div>
    <div class="group">${t.ex.map((id, i) => `<div class="row"><div class="grow"><div class="title">${esc(ex(id).n)}</div><div class="meta">${MUSCLES[ex(id).m]}</div></div>
      <button class="icon-btn" data-a="tplMove" data-i="${i}" data-d="-1" aria-label="Move up" ${i === 0 ? 'disabled style="opacity:.3"' : ''}>${ICON.up}</button>
      <button class="icon-btn" data-a="tplMove" data-i="${i}" data-d="1" aria-label="Move down" ${i === t.ex.length - 1 ? 'disabled style="opacity:.3"' : ''}>${ICON.down}</button>
      <button class="icon-btn" data-a="tplDel" data-i="${i}" aria-label="Remove">${ICON.close}</button></div>`).join('')}
      <button class="row add-row" data-a="tplAddEx">${ICON.plus}<span>Add exercises</span></button></div>
    <div class="sticky-foot">${t.id ? `<div class="grid2"><button class="btn ghost danger" data-a="tplDelete">Delete</button><button class="btn primary" data-a="tplSave">Save</button></div>` : '<button class="btn primary wide big" data-a="tplSave">Save template</button>'}</div>`);
}

/* ----- Workout detail / summary ----- */
function woDetailHTML(w, summary) {
  const prs = [];
  for (const x of w.exercises) for (const s of x.sets) if (s.pr) prs.push(`${ex(x.exId).n}: ${fmt1(s.w)} kg × ${s.r}`);
  return `<div class="summary-stats">
      <div class="pm"><div class="v">${durWords((w.end || w.start) - w.start)}</div><div class="l">time</div></div>
      <div class="pm"><div class="v">${doneSets(w)}</div><div class="l">sets</div></div>
      <div class="pm"><div class="v">${fmtInt(volume(w))}</div><div class="l">kg lifted</div></div></div>
    ${prs.length ? `<div class="sub-h">New records</div><div class="card" style="padding:4px 16px">${prs.map(p => `<div class="pr-line"><span style="color:var(--yellow-ink)">${ICON.trophy.replace('<svg', '<svg style="width:22px;height:22px"')}</span><span>${esc(p)}</span></div>`).join('')}</div>` : ''}
    ${summary ? '' : `<div class="sub-h">Exercises</div>`}
    ${summary ? '' : `<div class="group">${w.exercises.map(x => `<div class="row" style="align-items:flex-start"><div class="grow"><div class="title">${esc(ex(x.exId).n)}</div><div class="meta" style="white-space:normal">${x.sets.filter(s => s.done).map(s => (s.pr ? '★ ' : '') + setLabel(s)).join(', ')}</div></div></div>`).join('')}</div>`}`;
}
function finishSummary(w) {
  const pTip = (() => { const c = contextTips().find(t => t.cat === 'train' && t.id.startsWith('c_vol')); return c; })();
  const lib = libraryForGoal().filter(t => t.cat === 'train' || t.id === 'n_post');
  const tip = pTip || tipFor(lib[Math.floor(Math.random() * lib.length)]);
  openSheet(`${sheetHead('Workout done')}
    <p class="muted" style="margin:0 2px">${esc(w.name)}, ${dateLabel(dkey(w.start))}</p>
    ${woDetailHTML(w, true)}
    <div class="coach cat-${tip.cat}"><div class="who">${ICON.coach}<span>Coach</span></div><h3>${esc(tip.t)}</h3><p>${esc(tip.b)}</p></div>
    <div class="mt2 grid2">${w.tplId ? '' : `<button class="btn ghost" data-a="saveAsTpl" data-id="${w.id}">Save as template</button>`}<button class="btn primary ${w.tplId ? 'wide' : ''}" data-a="closeSheet" style="${w.tplId ? 'grid-column:span 2' : ''}">Done</button></div>`, { kind: 'summary' });
}

/* ---------- Workout actions ---------- */
function startWorkout(name, exIds, tplId) {
  if (S.active) { setTab('train'); return; }
  S.active = { id: uid(), name, tplId: tplId || null, start: Date.now(), restEnd: null,
    exercises: exIds.map(id => { const last = lastSession(id); const n = last ? clamp(last.sets.length, 1, 6) : 3; return { exId: id, sets: Array.from({ length: n }, () => ({ w: null, r: null, done: false })) }; }) };
  save(); unlockAudio(); dropToasts('.coachpop'); setTab('train');
}
function finishWorkout() {
  const a = S.active; if (!a) return;
  a.exercises = a.exercises.map(x => ({ ...x, sets: x.sets.filter(s => s.done) })).filter(x => x.sets.length);
  a.end = Date.now(); delete a.restEnd;
  S.workouts.push(a); S.active = null; save();
  render(true);
  finishSummary(a);
}

/* ---------- Rest timer + clock ---------- */
let audioCtx = null;
function unlockAudio() {
  try { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) { /* no audio */ }
}
function beep() {
  try {
    if (!audioCtx) return;
    [0, 0.22].forEach(off => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      const t = audioCtx.currentTime + off;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.start(t); o.stop(t + 0.2);
    });
  } catch (e) { /* ignore */ }
  if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
}
function tick() {
  $$('[data-aielapsed]').forEach(el => { const s2 = Math.floor((Date.now() - Number(el.dataset.aielapsed)) / 1000); el.textContent = s2 + ' s'; const slow = $('[data-aislow]'); if (slow && s2 >= 12) slow.classList.remove('hidden'); });
  const a = S.active;
  if (a) {
    $$('[data-tick=elapsed]').forEach(el => { el.textContent = dur(Date.now() - a.start); });
    const rest = $('#rest');
    if (a.restEnd) {
      const left = a.restEnd - Date.now();
      if (left <= 0) { a.restEnd = null; save(); beep(); toast('Rest is over. Time for the next set.'); if (rest) rest.classList.add('hidden'); }
      else { if (rest) rest.classList.remove('hidden'); $$('[data-tick=rest]').forEach(el => { el.textContent = dur(left + 999); }); }
    } else if (rest) rest.classList.add('hidden');
  }
}
setInterval(tick, 1000);

/* ---------- Actions ---------- */
const A = {
  tab: el => { closeAllSheets(); setTab(el.dataset.tab); },
  settings: () => settingsSheet(),
  toggleTheme: () => { S.settings.theme = isDark() ? 'light' : 'dark'; save(); applyTheme(); render(); },
  closeSheet: () => closeSheet(),
  confirmYes: () => { const r = ui.confirm; ui.confirm = null; closeSheet(); if (r) r(true); },
  confirmNo: () => closeSheet(),
  nextTip: () => { ui.tipOffset++; render(); },
  dismissTip: el => { S.tipLog.dismissed[el.dataset.id] = dkey(); save(); render(); },
  tipFreq: el => { S.settings.tips = el.dataset.v; save(); $$('[data-a=tipFreq]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === S.settings.tips))); if (!topSheet()) render(); },
  coachFilter: el => { ui.coachFilter = el.dataset.v; render(); },
  range: el => { ui.range = Number(el.dataset.d); render(); },
  histMore: () => { ui.histMore = true; render(); },

  water: el => {
    const k = ui.tab === 'eat' ? ui.eatDate : dkey(); const ml = Number(el.dataset.ml);
    S.water[k] = Math.max(0, (S.water[k] || 0) + ml); save(); render();
    if (ml > 0) toast(`${fmt1(S.water[k] / 1000)} L of water today`, { ms: 1800, undo: () => { S.water[k] = Math.max(0, S.water[k] - ml); save(); render(); } });
  },
  openFood: el => { closeAllSheets(); openFood(el.dataset.meal); },
  weightSheet: () => { closeAllSheets(); weightSheet(); },
  saveWeight: () => {
    const kg = num($('#wkg').value), d = $('#wdate').value || dkey();
    if (!(kg > 20 && kg < 400)) { toast('Enter your weight in kg, for example 78.4'); return; }
    S.weights = S.weights.filter(w => w.d !== d); S.weights.push({ d, kg: r1(kg) });
    if (d >= (weightsSorted().slice(-1)[0] || { d: '' }).d) { S.profile.weight = r1(kg); refreshTargets(); }
    save(); closeSheet(); render(); toast(`Saved ${fmt1(kg)} kg`);
    setTimeout(() => maybeCoach('weight'), 900);
  },
  delWeight: el => { S.weights = S.weights.filter(w => w.d !== el.dataset.d); save(); closeSheet(); weightSheet(); render(); },

  // Train
  startEmpty: () => startWorkout('Workout', [], null),
  startTpl: el => { const t = S.templates.find(x => x.id === el.dataset.id); if (t) startWorkout(t.name, t.ex, t.id); },
  startNext: () => { closeAllSheets(); const t = nextTemplate(); if (t) startWorkout(t.name, t.ex, t.id); else setTab('train'); },
  addEx: () => openPicker('active'),
  addSet: el => {
    const x = S.active.exercises[+el.dataset.ei];
    const prev = x.sets[x.sets.length - 1];
    x.sets.push({ w: prev && prev.w != null ? prev.w : null, r: null, done: false }); save(); render();
  },
  toggleSet: el => {
    unlockAudio();
    const ei = +el.dataset.ei, si = +el.dataset.si, x = S.active.exercises[ei], s = x.sets[si];
    if (s.done) { s.done = false; s.pr = false; save(); render(); return; }
    const ph = placeholders(x.exId, si);
    const wIn = $(`input[data-in=w][data-ei="${ei}"][data-si="${si}"]`), rIn = $(`input[data-in=r][data-ei="${ei}"][data-si="${si}"]`);
    let w = num(wIn ? wIn.value : s.w), r = num(rIn ? rIn.value : s.r);
    if (isNaN(w)) w = num(ph.w); if (isNaN(r)) r = num(ph.r);
    if (isNaN(w)) {
      if (ex(x.exId).eq !== 'bodyweight') { toast('Enter the weight in kg'); if (wIn) wIn.focus(); return; }
      w = 0;
    }
    if (!(r > 0)) { toast('Enter how many reps you did'); if (rIn) rIn.focus(); return; }
    s.w = r1(w); s.r = Math.round(r); s.done = true;
    // PR check against history (and earlier sets in this session)
    const hist = bestE1rm(x.exId).best;
    let sessionBest = 0; S.active.exercises.forEach(xx => { if (xx.exId === x.exId) xx.sets.forEach(ss => { if (ss !== s && ss.done) sessionBest = Math.max(sessionBest, e1rm(ss.w, ss.r)); }); });
    const v = e1rm(s.w, s.r);
    if (hist > 0 && v > hist && v > sessionBest) {
      S.active.exercises.forEach(xx => { if (xx.exId === x.exId) xx.sets.forEach(ss => { ss.pr = false; }); });
      s.pr = true;
      toast(`New record on ${ex(x.exId).n}: ${fmt1(s.w)} kg × ${s.r}`, { ms: 4000 });
    }
    S.active.restEnd = Date.now() + S.settings.rest * 1000;
    save(); render();
  },
  rest: el => {
    const a = S.active; if (!a) return;
    if (el.dataset.d === 'skip') a.restEnd = null;
    else if (a.restEnd) a.restEnd = Math.max(Date.now() + 1000, a.restEnd + Number(el.dataset.d) * 1000);
    save(); tick();
  },
  exMenu: el => {
    const ei = +el.dataset.ei, x = S.active.exercises[ei];
    openSheet(`${sheetHead(esc(ex(x.exId).n))}<div class="group">
      ${ei > 0 ? `<button class="row" data-a="exMove" data-ei="${ei}" data-d="-1">${ICON.up}<span>Move up</span></button>` : ''}
      ${ei < S.active.exercises.length - 1 ? `<button class="row" data-a="exMove" data-ei="${ei}" data-d="1">${ICON.down}<span>Move down</span></button>` : ''}
      ${x.sets.length > 1 ? `<button class="row" data-a="exDelSet" data-ei="${ei}">${ICON.close}<span>Remove last set</span></button>` : ''}
      <button class="row" data-a="exRemove" data-ei="${ei}" style="color:var(--red)">${ICON.trash}<span>Remove exercise</span></button></div>`, { kind: 'exmenu' });
  },
  exMove: el => { const ei = +el.dataset.ei, d = +el.dataset.d, arr = S.active.exercises; [arr[ei], arr[ei + d]] = [arr[ei + d], arr[ei]]; save(); closeSheet(); render(); },
  exDelSet: el => { S.active.exercises[+el.dataset.ei].sets.pop(); save(); closeSheet(); render(); },
  exRemove: el => {
    const ei = +el.dataset.ei; const removed = S.active.exercises.splice(ei, 1)[0]; save(); closeSheet(); render();
    toast(`Removed ${ex(removed.exId).n}`, { undo: () => { S.active.exercises.splice(ei, 0, removed); save(); render(); } });
  },
  finishWo: async () => {
    if (!doneSets(S.active)) {
      if (await confirmBox('No sets completed', 'Tick off at least one set to save this workout. Discard it instead?', 'Discard', true)) { S.active = null; save(); render(true); }
      return;
    }
    const open = S.active.exercises.reduce((n, x) => n + x.sets.filter(s => !s.done).length, 0);
    if (open && !(await confirmBox('Finish workout?', `${open} unticked set${open > 1 ? 's' : ''} won’t be saved.`, 'Finish'))) return;
    finishWorkout();
  },
  cancelWo: async () => { if (await confirmBox('Discard workout?', 'Everything logged in this session will be deleted.', 'Discard', true)) { S.active = null; save(); render(true); } },
  woDetail: el => {
    const w = S.workouts.find(x => x.id === el.dataset.id); if (!w) return;
    openSheet(`${sheetHead(esc(w.name))}<p class="muted" style="margin:0 2px">${dateLabel(dkey(w.start))}, started ${new Date(w.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
      ${woDetailHTML(w, false)}
      <div class="mt2 grid2"><button class="btn ghost danger" data-a="delWo" data-id="${w.id}">Delete</button><button class="btn primary" data-a="repeatWo" data-id="${w.id}">Do it again</button></div>`, { full: true, kind: 'wodetail' });
  },
  repeatWo: el => { const w = S.workouts.find(x => x.id === el.dataset.id); if (!w) return; closeAllSheets(); startWorkout(w.name, w.exercises.map(x => x.exId), w.tplId); },
  delWo: async el => {
    if (!(await confirmBox('Delete workout?', 'This removes it from your history and records.', 'Delete', true))) return;
    S.workouts = S.workouts.filter(x => x.id !== el.dataset.id); save(); closeAllSheets(); render();
  },
  saveAsTpl: el => {
    const w = S.workouts.find(x => x.id === el.dataset.id); if (!w) return;
    const t = { id: uid(), name: w.name === 'Workout' ? `Workout ${S.templates.length + 1}` : w.name, ex: w.exercises.map(x => x.exId) };
    S.templates.push(t); w.tplId = t.id; save(); closeSheet(); render(); toast(`Saved “${t.name}” as a template`);
  },

  // Picker
  pickM: el => { ui.picker.m = el.dataset.v; renderPicker(); },
  pickEx: el => { const p = ui.picker, id = el.dataset.id; p.sel = p.sel.includes(id) ? p.sel.filter(x => x !== id) : [...p.sel, id]; const q = $('#pq'); const v = q ? q.value : ''; p.q = v; renderPicker(); },
  pickDone: () => {
    const p = ui.picker; if (!p.sel.length) return;
    if (p.target === 'active' && S.active) {
      for (const id of p.sel) { const last = lastSession(id); const n = last ? clamp(last.sets.length, 1, 6) : 3; S.active.exercises.push({ exId: id, sets: Array.from({ length: n }, () => ({ w: null, r: null, done: false })) }); }
      save(); closeSheet(); render();
    } else if (p.target === 'tpl' && ui.tplEdit) {
      const tn = $('#tname'); ui.tplEdit.name = tn ? tn.value : ui.tplEdit.name;
      ui.tplEdit.ex.push(...p.sel); closeSheet(); setTimeout(renderTpl, 0);
    }
  },
  newEx: () => newExSheet(ui.picker.q.trim()),
  saveNewEx: () => {
    let n = $('#exn').value.trim(); if (!n) { toast('Give the exercise a name'); return; }
    n = n[0].toUpperCase() + n.slice(1);
    let r0 = Math.round(num($('#exr0').value)) || 8, r1v = Math.round(num($('#exr1').value)) || 12; if (r1v < r0) [r0, r1v] = [r1v, r0];
    const e = { id: 'cx_' + uid(), n, m: $('#exm').value, s: [], eq: $('#exq').value, rr: [r0, r1v], custom: true };
    S.customEx.push(e); rebuildExMap(); save(); closeSheet();
    if (ui.picker) { ui.picker.sel.push(e.id); ui.picker.q = ''; renderPicker(); }
  },

  // Templates
  newTpl: () => tplSheet(null),
  editTpl: el => tplSheet(el.dataset.id),
  tplAddEx: () => { const tn = $('#tname'); if (tn) ui.tplEdit.name = tn.value; openPicker('tpl'); },
  tplMove: el => { const t = ui.tplEdit, i = +el.dataset.i, d = +el.dataset.d; t.name = $('#tname').value; [t.ex[i], t.ex[i + d]] = [t.ex[i + d], t.ex[i]]; renderTpl(); },
  tplDel: el => { const t = ui.tplEdit; t.name = $('#tname').value; t.ex.splice(+el.dataset.i, 1); renderTpl(); },
  tplSave: () => {
    const t = ui.tplEdit; t.name = $('#tname').value.trim();
    if (!t.name) { toast('Give the template a name'); return; }
    if (!t.ex.length) { toast('Add at least one exercise'); return; }
    if (t.id) { const x = S.templates.find(y => y.id === t.id); x.name = t.name; x.ex = [...t.ex]; }
    else S.templates.push({ id: uid(), name: t.name, ex: [...t.ex] });
    save(); closeSheet(); render(); toast(`Saved “${t.name}”`);
  },
  tplDelete: async () => {
    const t = ui.tplEdit;
    if (!(await confirmBox(`Delete “${t.name}”?`, 'Your past workouts stay in your history.', 'Delete', true))) return;
    S.templates = S.templates.filter(x => x.id !== t.id); save(); closeSheet(); render();
  },

  // Photo logging
  snap: el => {
    closeAllSheets();
    openFood(el.dataset.meal); ui.food.mode = 'photo'; renderFood();
    if (hasAiKey()) $('#camIn').click();          // straight to the camera, inside the same tap
  },
  photoPick: el => { (el.dataset.src === 'cam' ? $('#camIn') : $('#picIn')).click(); },
  photoReset: () => { if (ui.food) { ui.food.photo = { state: 'idle' }; renderFood(); } },
  photoRetry: () => { const f = ui.food; if (!f || !f.photo) return; const h = $('#aihint'); if (h) f.photo.hint = h.value.trim().slice(0, 200); if (f.photo.b64) analyzeCurrent(); else A.photoReset(); },
  aiToggle: el => { const it = ui.food.photo.items[+el.dataset.i]; it.on = !it.on; const h = $('#aihint'); if (h) ui.food.photo.hint = h.value; renderFood(); },
  aiAdd: () => {
    const f = ui.food, ph = f.photo, now = Date.now();
    const added = [];
    for (const it of ph.items) {
      if (!it.on || !(it.g > 0)) continue;
      const m = portion(it.p100, it.g);
      const e = { id: uid(), meal: f.meal, name: it.name, foodId: it.food ? it.food.id : null, g: r1(it.g), k: m.k, p: m.p, c: m.c, f: m.f, t: now, src: 'photo' };
      if (!it.food) e.p100 = { ...it.p100 };
      added.push(e);
    }
    if (!added.length) return;
    (S.food[f.date] = S.food[f.date] || []).push(...added); save();
    const ids = new Set(added.map(e => e.id)), date = f.date;
    closeSheet(); render();
    toast(`Added ${added.length} item${added.length === 1 ? '' : 's'} to ${MEALS[f.meal].toLowerCase()}`, { undo: () => { S.food[date] = S.food[date].filter(x => !ids.has(x.id)); save(); render(); } });
    setTimeout(() => maybeCoach('food'), 1200);
  },
  aiTest: async el => {
    const out = el.parentElement.querySelector('[data-aitest]');
    el.disabled = true; if (out) out.textContent = 'Checking…';
    const r = await aiTest();
    el.disabled = false;
    if (out) { out.innerHTML = `<span style="color:${r.ok ? 'var(--green)' : 'var(--red)'};font-weight:600">${esc(r.text)}</span>${r.detail ? `<br><span class="muted" style="word-break:break-word">Details: ${esc(r.detail)}</span>` : ''}`; }
  },
  aiProvider: el => { const c = aiCfg(); c.provider = el.dataset.v; saveAi(c); refreshAiSetup(el.dataset.where); },
  aiModel: el => {
    const c = aiCfg(); if (c.provider === 'gemini') c.gmodel = el.dataset.v; else c.model = el.dataset.v; saveAi(c);
    $$('[data-a=aiModel]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === el.dataset.v)));
    $$('[data-aicost]').forEach(x => { x.textContent = PROVIDERS[c.provider].models[el.dataset.v].cost; });
  },
  aiSaveKey: el => {
    const key = (($('#aikey') || {}).value || '').trim().replace(/\s+/g, '');
    const c = aiCfg();
    if (c.provider === 'gemini') {
      if (!/^(AIza[0-9A-Za-z_\-]{30,}|AQ\.?[0-9A-Za-z_\-.]{20,})$/.test(key)) { toast('That doesn\u2019t look like a Gemini API key. It starts with AQ. or AIza'); return; }
      c.gkey = key;
    } else {
      if (!/^sk-ant-/.test(key) || key.length < 30) { toast('That doesn\u2019t look like a Claude API key. It starts with sk-ant-'); return; }
      c.key = key;
    }
    saveAi(c);
    if (el.dataset.where === 'photo' && ui.food) ui.food.photo = { state: 'idle' };
    refreshAiSetup(el.dataset.where);
    toast('Key saved. You can snap a meal now.');
  },
  aiRemoveKey: async el => {
    const where = el.dataset.where;
    if (!(await confirmBox('Remove the API key?', 'Photo logging will stop working until you add a key again.', 'Remove', true))) return;
    const c = aiCfg(); if (c.provider === 'gemini') c.gkey = ''; else c.key = ''; saveAi(c);
    refreshAiSetup(where);
  },

  // Eat
  eatDay: el => { const d = addDays(ui.eatDate, +el.dataset.d); if (d > dkey()) return; ui.eatDate = d; render(); },
  foodMode: el => { const f = ui.food; const q = $('#fq'); if (q) f.q = q.value; f.mode = el.dataset.v; if (f.mode === 'search') f.food = null; if (f.mode === 'photo' && !f.photo) f.photo = { state: 'idle' }; renderFood(); },
  foodMeal: el => { const f = ui.food; const g = $('#fgrams'); if (g) f.g = num(g.value); if (f.mode === 'quick') f.quick = readQuick(); if (f.mode === 'photo' && f.photo) { const h = $('#aihint'); if (h) f.photo.hint = h.value; } f.meal = el.dataset.v; renderFood(); },
  pickFood: el => { const f = ui.food; const food = foodById(el.dataset.id); if (!food) return; const q = $('#fq'); if (q) f.q = q.value; f.food = food; f.g = el.dataset.g ? Number(el.dataset.g) : (food.sv && food.sv[0] ? food.sv[0][1] : 100); f.mode = 'portion'; renderFood(); },
  foodServ: el => { ui.food.g = Number(el.dataset.g); renderFood(); },
  addEntry: () => {
    const f = ui.food, g = num($('#fgrams').value);
    if (!(g > 0)) { toast('Enter the amount in grams'); return; }
    const m = portion(f.food, g);
    const e = { id: uid(), meal: f.meal, name: f.food.n, foodId: f.food.id, g: r1(g), k: m.k, p: m.p, c: m.c, f: m.f, t: Date.now() };
    (S.food[f.date] = S.food[f.date] || []).push(e); save();
    closeSheet(); render();
    toast(`Added ${f.food.n} to ${MEALS[f.meal].toLowerCase()}`, { undo: () => { S.food[f.date] = S.food[f.date].filter(x => x.id !== e.id); save(); render(); } });
    setTimeout(() => maybeCoach('food'), 1200);
  },
  editEntry: el => {
    const k = ui.eatDate, e = dayEntries(k).find(x => x.id === el.dataset.id); if (!e) return;
    const food = e.foodId ? foodById(e.foodId) : (e.p100 ? { id: null, n: e.name, k: e.p100.k, p: e.p100.p, c: e.p100.c, f: e.p100.f, sv: [] } : null);
    ui.food = { meal: e.meal, date: k, mode: food ? 'portion' : 'quick', q: '', food, g: e.g, editId: e.id, quick: { name: e.name, k: Math.round(e.k), p: r1(e.p), c: r1(e.c), f: r1(e.f) } };
    openSheet('', { full: true, kind: 'food' }); renderFood();
  },
  saveEntry: () => {
    const f = ui.food, g = num($('#fgrams').value);
    if (!(g > 0)) { toast('Enter the amount in grams'); return; }
    const e = dayEntries(f.date).find(x => x.id === f.editId); if (!e) return;
    const m = portion(f.food, g); Object.assign(e, { g: r1(g), k: m.k, p: m.p, c: m.c, f: m.f, meal: f.meal });
    save(); closeSheet(); render(); toast('Entry updated');
  },
  delEntry: () => {
    const f = ui.food; const list = S.food[f.date] || []; const i = list.findIndex(x => x.id === f.editId); if (i < 0) return;
    const [e] = list.splice(i, 1); save(); closeSheet(); render();
    toast(`Deleted ${e.name}`, { undo: () => { (S.food[f.date] = S.food[f.date] || []).splice(i, 0, e); save(); render(); } });
  },
  saveQuick: () => {
    const f = ui.food, q = readQuick();
    if (!(q.k > 0)) { toast('Enter the calories'); return; }
    const vals = { name: q.name || 'Quick add', k: q.k, p: q.p || 0, c: q.c || 0, f: q.f || 0, meal: f.meal };
    if (f.editId) { const e = dayEntries(f.date).find(x => x.id === f.editId); if (e) Object.assign(e, vals); save(); closeSheet(); render(); toast('Entry updated'); return; }
    const e = { id: uid(), foodId: null, g: null, t: Date.now(), ...vals };
    (S.food[f.date] = S.food[f.date] || []).push(e); save(); closeSheet(); render();
    toast(`Added ${vals.name}`, { undo: () => { S.food[f.date] = S.food[f.date].filter(x => x.id !== e.id); save(); render(); } });
    setTimeout(() => maybeCoach('food'), 1200);
  },
  saveNewFood: () => {
    const n = $('#nname').value.trim(), k = num($('#nk').value);
    if (!n) { toast('Give the food a name'); return; }
    if (!(k >= 0)) { toast('Enter kcal per 100 g'); return; }
    const svn = $('#nsv').value.trim(), svg = num($('#nsg').value);
    const food = { id: 'cf_' + uid(), n, k, p: num($('#np').value) || 0, c: num($('#nc').value) || 0, f: num($('#nf').value) || 0, sv: svg > 0 ? [[svn || '1 serving', svg]] : [], custom: true };
    S.customFoods.push(food); save();
    const f = ui.food; f.food = food; f.g = svg > 0 ? svg : 100; f.mode = 'portion'; renderFood();
  },

  // Settings
  pf: el => { const root = el.closest('.sheet'); readProfileForm(root); ui.draft[el.dataset.k] = el.dataset.v; $$(`[data-a=pf][data-k=${el.dataset.k}]`, root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === el.dataset.v))); const gh = $('[data-goalhelp]', root); if (gh) gh.textContent = GOAL_HELP[ui.draft.goal]; updatePreview(root); },
  autoT: el => { ui.draftAuto = el.dataset.v === 'true'; const root = el.closest('.sheet'); $$('[data-a=autoT]', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(ui.draftAuto)))); $('[data-manual]', root).classList.toggle('hidden', ui.draftAuto); updatePreview(root); },
  setRest: el => { S.settings.rest = Number(el.dataset.v); $$('[data-a=setRest]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === el.dataset.v))); save(); },
  theme: el => { S.settings.theme = el.dataset.v; $$('[data-a=theme]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === el.dataset.v))); save(); applyTheme(); render(); },
  saveSettings: () => {
    const root = topSheet().querySelector('.sheet');
    const prevW = Number(S.profile.weight);
    S.profile = { ...readProfileForm(root) };
    S.autoTargets = ui.draftAuto;
    if (S.autoTargets) refreshTargets();
    else { $$('[data-tf]', root).forEach(el => { const v = num(el.value); if (v > 0) S.targets[el.dataset.tf] = Math.round(v); }); }
    if (Number(S.profile.weight) !== prevW) { const d = dkey(); S.weights = S.weights.filter(w => w.d !== d); S.weights.push({ d, kg: r1(Number(S.profile.weight)) }); }
    save(); closeSheet(); render(); toast('Settings saved');
  },
  finishOnboard: () => {
    const root = topSheet().querySelector('.sheet');
    S.profile = { ...readProfileForm(root) };
    S.autoTargets = true; refreshTargets();
    S.onboarded = true;
    if (S.profile.weight) { S.weights = S.weights.filter(w => w.d !== dkey()); S.weights.push({ d: dkey(), kg: r1(Number(S.profile.weight)) }); }
    save(); closeSheet(); render(true);
    toast('You’re set. Your targets are on the Today tab.');
  },
  exportData: async () => {
    const name = `plates-backup-${dkey()}.json`;
    const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
    try {
      const file = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Plates backup' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  },
  importData: () => $('#importFile').click(),
  resetAll: async () => {
    if (!(await confirmBox('Erase everything?', 'All workouts, meals, weigh-ins and settings will be deleted from this phone. Save a backup first if you might want them.', 'Erase all', true))) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    S = defaults(); rebuildExMap(); save(); closeAllSheets(); ui.tab = 'today'; render(true); setTimeout(onboarding, 300);
  }
};
function readQuick() {
  const g = id => { const el = $(id); return el ? el.value : ''; };
  return { name: g('#qname').trim(), k: num(g('#qk')), p: num(g('#qp')), c: num(g('#qc')), f: num(g('#qf')) };
}
function updatePreview(root) {
  const box = $('[data-tprev]', root); if (!box) return;
  const kind = topSheet() && topSheet().dataset.kind;
  box.innerHTML = (kind === 'onboard' || (kind === 'settings' ? ui.draftAuto : S.autoTargets)) ? targetsPreview(ui.draft) : '';
}

/* ---------- Event wiring ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.a];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.in === 'w' || t.dataset.in === 'r') {
    const s = S.active && S.active.exercises[+t.dataset.ei] && S.active.exercises[+t.dataset.ei].sets[+t.dataset.si];
    if (!s) return;
    const v = num(t.value);
    s[t.dataset.in] = isNaN(v) ? null : (t.dataset.in === 'r' ? Math.round(v) : v);
    save();
  } else if (t.dataset.in === 'woName' && S.active) { S.active.name = t.value.slice(0, 40) || 'Workout'; save(); }
  else if (t.id === 'fq' && ui.food) { ui.food.q = t.value; $('#fres').innerHTML = foodResultsHTML(); }
  else if (t.id === 'pq' && ui.picker) { ui.picker.q = t.value; $('#pres').innerHTML = pickerListHTML(); }
  else if (t.id === 'fgrams' && ui.food && ui.food.food) {
    const g = num(t.value); ui.food.g = isNaN(g) ? null : g;
    $('#fmac').innerHTML = macroBoxes(portion(ui.food.food, g > 0 ? g : 0));
    $$('[data-a=foodServ]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.g) === g)));
  } else if (t.dataset.in === 'aiG' && ui.food && ui.food.photo && ui.food.photo.items) {
    const ph = ui.food.photo, it = ph.items[+t.dataset.i], g = num(t.value);
    it.g = g > 0 ? Math.min(g, 5000) : 0;
    const m = portion(it.p100, it.g); const k = $(`[data-aik="${t.dataset.i}"]`); if (k) k.textContent = `${fmtInt(m.k)} kcal, P ${fmt1(m.p)} g`;
    const tt = aiTotals(ph.items); $('#aitot').innerHTML = macroBoxes(tt);
  } else if (t.dataset.pf) {
    const root = t.closest('.sheet'); readProfileForm(root); updatePreview(root);
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.pf === 'activity') { const root = t.closest('.sheet'); readProfileForm(root); updatePreview(root); }
  if ((t.id === 'camIn' || t.id === 'picIn') && t.files && t.files[0]) {
    const file = t.files[0]; t.value = '';
    if (!ui.food) openFood();
    runPhoto(file);
    return;
  }
  if (t.id === 'importFile' && t.files && t.files[0]) {
    const file = t.files[0]; const rd = new FileReader();
    rd.onload = async () => {
      let data; try { data = JSON.parse(rd.result); } catch (err) { toast('That file isn’t a Plates backup'); return; }
      if (!data || typeof data !== 'object' || !Array.isArray(data.workouts) || typeof data.food !== 'object') { toast('That file isn’t a Plates backup'); return; }
      const n = data.workouts.length, d = Object.keys(data.food || {}).length;
      if (!(await confirmBox('Restore backup?', `This replaces everything in the app with ${n} workouts and ${d} days of food from the file.`, 'Restore', true))) return;
      localStorage.setItem(STORE_KEY, JSON.stringify(data)); S = load(); rebuildExMap(); save(); closeAllSheets(); render(true); toast('Backup restored');
    };
    rd.readAsText(file); t.value = '';
  }
});
// Enter on the weight/reps inputs moves to the next field
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const t = e.target;
  if (t.dataset.in === 'w') { e.preventDefault(); const r = $(`input[data-in=r][data-ei="${t.dataset.ei}"][data-si="${t.dataset.si}"]`); if (r) r.focus(); }
  else if (t.dataset.in === 'r' || t.dataset.in === 'woName' || t.id === 'fgrams') { e.preventDefault(); t.blur(); }
});
// iOS home-screen apps: put the page back after the keyboard closes
document.addEventListener('focusout', () => { setTimeout(() => { if (!document.activeElement || document.activeElement === document.body) window.scrollTo(0, 0); }, 60); });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { applyTheme(); if (S.settings.theme === 'auto') render(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (ui.eatDate > dkey()) ui.eatDate = dkey();
    if (!topSheet() && !document.activeElement.matches('input')) render();
    tick();
  }
});

/* ---------- Boot ---------- */
applyTheme();
if (!VIEWS[ui.tab]) ui.tab = 'today';
render(true);
if (!S.onboarded) setTimeout(onboarding, 250);
else setTimeout(() => maybeCoach('open'), 2500);
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable */ });
}
