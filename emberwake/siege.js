// Emberwake siege: real time defence of the keep. Pure rules, no DOM, so it runs in node for balance tests.
// World is 100 wide by 150 tall. Enemies come from the top, the wall runs across, the keep sits at the bottom.
// The player builds a castle on a grid in front of the wall (walls, towers, moats, traps) and in the yard
// (mangonels, braziers). Enemies route around what's built using a flow field, or smash through it.
(function (root) {
'use strict';
const D = root.DATA || require('./data.js');
const E = root.ENGINE || require('./engine.js');
const SG = {};

const WALL_Y = 102, WALL_H = 6, YARD_Y = WALL_Y + WALL_H;
const CELL = 4, COLS = 25, ROWS = 26; // field grid rows 0..25 cover y 0..104
const GEO = {
  W: 100, H: 150, WALL_Y, WALL_H, YARD_Y, GATE_X0: 44, GATE_X1: 56, CELL, COLS,
  KEEP: { x: 50, y: 138 },
  SLOTS: [8, 19, 30, 70, 81, 92], TOWERS: [38, 62],
  FIELD: { y0: 40, y1: WALL_Y - 3 }, YARD: { y0: YARD_Y + 3, y1: 129 },
  BUILD: { r0: 11, r1: 24 }, // field rows you can build on (y 44 to 100)
  YBUILD: { r0: 28, r1: 31 }, // yard rows for mangonels and braziers (y 112 to 128)
};
SG.GEO = GEO;

SG.UNITS = {
  archer:   { name: 'Archer', cost: 6, hp: 45, dmg: 6, rate: 1.3, range: 46, armour: 0, zone: 'wall', sprite: 'm_archer', proj: 'arrow', desc: 'Shoots from the wall or a tower. Place on a gold spot.' },
  sword:    { name: 'Swordsman', cost: 8, hp: 130, dmg: 10, rate: 1.0, range: 3.5, speed: 10, armour: 3, sprite: 'm_sword', desc: 'Holds ground in front of the gate or in the yard.' },
  spear:    { name: 'Spearman', cost: 10, hp: 115, dmg: 9, rate: 1.1, range: 5, speed: 9, armour: 2, vsLarge: 3, sprite: 'm_spear', req: ['barracks', 1], desc: 'Triple damage to rams, brutes and catapults.' },
  priest:   { name: 'Priest', cost: 10, hp: 60, heal: 14, rate: 1.6, range: 24, speed: 8, armour: 0, sprite: 'm_priest', req: ['barracks', 1], desc: 'Heals the most hurt defender nearby.' },
  knight:   { name: 'Knight', cost: 16, hp: 250, dmg: 17, rate: 1.0, range: 4, speed: 15, armour: 5, sprite: 'm_knight', req: ['barracks', 2], desc: 'Heavy and fast. Rides down anything near its post.' },
  ballista: { name: 'Ballista', cost: 14, hp: 140, dmg: 48, rate: 3.2, range: 90, armour: 4, zone: 'tower', sprite: 'ballista', proj: 'bolt', splash: 4, pierce: true, req: ['walls', 1], desc: 'Towers only. Huge bolts that ignore armour.' },
};
SG.FOES = {
  grunt:    { name: 'Hollow Soldier', hp: 70, dmg: 8, rate: 1.1, range: 3.5, speed: 6, armour: 2, sprite: 'soldier', cost: 1 },
  hound:    { name: 'Shadow Hound', hp: 38, dmg: 6, rate: 0.7, range: 3, speed: 15, armour: 0, sprite: 'hound', cost: 0.8 },
  bowman:   { name: 'Hollow Bowman', hp: 42, dmg: 6, rate: 1.5, range: 40, speed: 6, armour: 1, sprite: 'h_bowman', ranged: true, proj: 'arrow', cost: 1.5 },
  acolyte:  { name: 'Hollow Acolyte', hp: 55, heal: 12, rate: 2.0, range: 20, speed: 5, armour: 1, sprite: 'acolyte', healer: true, cost: 2 },
  ladder:   { name: 'Ladder crew', hp: 70, dmg: 5, rate: 1.2, range: 3, speed: 5.5, armour: 1, sprite: 'h_ladder', ladder: true, cost: 2 },
  ram:      { name: 'Battering Ram', hp: 380, dmg: 50, rate: 2.2, range: 3, speed: 3.2, armour: 7, large: true, sprite: 'ram', gateOnly: true, cost: 6 },
  brute:    { name: 'Hollow Brute', hp: 290, dmg: 22, rate: 1.4, range: 4.5, speed: 4.5, armour: 4, large: true, sprite: 'h_brute', cost: 5 },
  catapult: { name: 'Hollow Catapult', hp: 260, dmg: 55, rate: 6, range: 62, speed: 3, armour: 5, large: true, sprite: 'h_catapult', siege: true, proj: 'rock', splash: 6, cost: 6 },
  captain:  { name: 'Hollow Captain', hp: 1400, dmg: 28, rate: 1.2, range: 5, speed: 4, armour: 6, large: true, boss: true, aura: true, sprite: 'warden', cost: 0 },
};
// Castle pieces. Field pieces sit in front of the wall, yard pieces behind it.
SG.PIECES = {
  wall:     { name: 'Stone wall', zone: 'field', size: 1, hp: 320, block: true, cost: { gold: 20 }, desc: 'Blocks the way. The Hollow must go round or break through.' },
  tower:    { name: 'Tower', zone: 'field', size: 2, hp: 750, block: true, slots: 2, cost: { gold: 120, mats: { ore: 2 } }, desc: 'Holds two archers or a ballista. Longer range and hard to hit.' },
  moat:     { name: 'Moat', zone: 'field', size: 1, slow: 0.3, cost: { gold: 12 }, desc: 'Anything wading through slows to a crawl.' },
  stakes:   { name: 'Stakes', zone: 'field', size: 1, slow: 0.6, dps: 9, cost: { gold: 15 }, desc: 'Slows and cuts anything that walks through.' },
  pit:      { name: 'Killing pit', zone: 'field', size: 1, trap: 200, cost: { gold: 25 }, desc: 'Hidden. The first enemy to step on it takes a huge hit. Resets each night.' },
  pitch:    { name: 'Pitch ditch', zone: 'field', size: 1, fire: 45, cost: { gold: 20 }, desc: 'Tap it during the fight to set it alight. Burns anything in it. Joined ditches catch together.' },
  brazier:  { name: 'Brazier', zone: 'yard', size: 1, cost: { gold: 50 }, desc: 'Archers within reach shoot fire arrows: harder hitting, and they burn.' },
  mangonel: { name: 'Mangonel', zone: 'yard', size: 2, hp: 300, cost: { gold: 200, mats: { ore: 3 } }, req: ['walls', 1], desc: 'Hurls rocks at the thickest crowd of Hollow. Needs stone walls.' },
};
SG.POWERS = {
  bram:   { name: 'Rally', cd: 35, aim: false, desc: 'Every defender heals 35% and hits 40% harder for 8 seconds.' },
  wren:   { name: 'Arrow Storm', cd: 28, aim: true, r: 12, desc: 'Rains arrows over the spot you tap.' },
  isolde: { name: 'Ember Nova', cd: 32, aim: true, r: 13, desc: 'A blast of fire that leaves everything burning.' },
  hesk:   { name: 'Wild Hunt', cd: 40, aim: true, r: 6, desc: 'Three wolves charge in where you tap.' },
  aldric: { name: 'Oath of Iron', cd: 38, aim: false, desc: 'Every defender takes half damage for 7 seconds.' },
  morwen: { name: 'Mire', cd: 30, aim: true, r: 14, desc: 'The ground turns to bog. Everything there slows right down and rots.' },
  dace:   { name: 'Powder Keg', cd: 30, aim: true, r: 10, desc: 'A keg goes off after a moment. Wrecks rams and catapults.' },
};
SG.BUILDINGS = {
  barracks: { name: 'Barracks', desc: 'Drills the militia and trains new kinds of soldier.',
    levels: [
      { gold: 300, mats: { ore: 4 }, text: 'Spearmen and priests. Militia 15% tougher. More levy to start and faster levy.' },
      { gold: 700, mats: { ore: 6, bone: 4 }, text: 'Knights. Militia 30% tougher. More levy again.' },
    ] },
  walls: { name: 'Stone walls', desc: 'A stronger gate and towers beside it.',
    levels: [
      { gold: 350, mats: { ore: 6 }, text: 'Gate half as strong again. Two gate towers for ballistas. Mangonels can be built.' },
      { gold: 800, mats: { ore: 8, moss: 4 }, text: 'Gate twice as strong. Burning oil scalds anything hitting it. Your castle walls and towers are half as strong again.' },
    ] },
};
SG.MILESTONES = {
  1: { text: 'The survivors swear themselves to Emberwake. The barracks can be built, and you can fortify the castle between nights.', gold: 150 },
  2: { tome: true },
  3: { gear: 'ashby_banner' },
  4: { gold: 400, mats: { shard: 3 } },
  5: { gear: 'emberwake_blade' },
  7: { tome: true },
  8: { gold: 900 },
  10: { gear: 'keepers_mantle' },
};
SG.MAX_NIGHT = 12;
SG.ARMY_CAP = 30;

// ---------- Castle building (between nights) ----------
SG.castle = S => (S.castle = S.castle || { pieces: [] });
const cellOf = (x, y) => ({ c: Math.floor(x / CELL), r: Math.floor(y / CELL) });
SG.cellOf = cellOf;
SG.pieceCells = p => { const n = SG.PIECES[p.k].size, out = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out.push([p.c + i, p.r + j]); return out; };
SG.pieceAt = (S, c, r) => SG.castle(S).pieces.find(p => SG.pieceCells(p).some(([a, b]) => a === c && b === r));
SG.canBuild = function (S, k, c, r) {
  const d = SG.PIECES[k];
  if (!d) return 'Unknown piece.';
  if (d.req && (S.buildings[d.req[0]] || 0) < d.req[1]) return d.name + ' needs stone walls first.';
  const z = d.zone === 'yard' ? GEO.YBUILD : GEO.BUILD;
  for (let i = 0; i < d.size; i++) for (let j = 0; j < d.size; j++) {
    const cc = c + i, rr = r + j;
    if (cc < 0 || cc >= COLS || rr < z.r0 || rr > z.r1) return d.zone === 'yard' ? 'Build that in the yard.' : 'Build that in front of the wall.';
    if (d.zone === 'yard' && cc >= 8 && cc <= 16 && rr >= 29) return 'Keep the path to the hall clear.';
    if (SG.pieceAt(S, cc, rr)) return 'Something is already there.';
  }
  if (!E.canAfford(S, d.cost)) return 'Not enough gold or iron.';
  return null;
};
SG.build = function (S, k, c, r) {
  const err = SG.canBuild(S, k, c, r);
  if (err) return err;
  E.pay(S, SG.PIECES[k].cost);
  SG.castle(S).pieces.push({ k, c, r });
  return null;
};
SG.demolish = function (S, c, r) {
  const p = SG.pieceAt(S, c, r);
  if (!p) return false;
  const d = SG.PIECES[p.k];
  S.gold += Math.floor((d.cost.gold || 0) * 0.5);
  SG.castle(S).pieces = SG.castle(S).pieces.filter(x => x !== p);
  return true;
};

// ---------- Nights ----------
function seeded(n) {
  let h = (n * 2654435761) >>> 0 || 1;
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
SG.night = function (n) {
  const rng = seeded(n * 7919 + 13);
  const waves = [];
  const count = Math.min(6, 3 + Math.floor((n - 1) / 3));
  const pickX = () => 8 + rng() * 84;
  for (let w = 0; w < count; w++) {
    const list = [];
    const add = (t, at) => list.push({ t, at, x: pickX() });
    if (n === 1) {
      const g = [8, 10, 11][w], h = [2, 4, 5][w];
      for (let i = 0; i < g; i++) add('grunt', i * 1.1 + rng());
      for (let i = 0; i < h; i++) add('hound', 3 + i * 1.5 + rng());
      if (w === 2) { add('ladder', 2); add('ladder', 6); }
    } else {
      let budget = (12 + n * 2.2 + w * 3) * 1.7;
      const pool = ['grunt', 'grunt', 'hound'];
      if (w >= 1) pool.push('ladder');
      if (n >= 2) pool.push('bowman');
      if (n >= 4) pool.push('acolyte');
      if (n >= 5) pool.push('brute');
      let t = 0;
      if (n >= 3 && w >= 1 && rng() < 0.8) { add('ram', 4 + rng() * 3); budget -= SG.FOES.ram.cost; }
      if (n >= 4 && w >= 1 && rng() < 0.6) { add('catapult', 1 + rng() * 2); budget -= SG.FOES.catapult.cost; }
      if (n >= 8 && w >= 2) { add('catapult', 3 + rng() * 3); budget -= SG.FOES.catapult.cost; }
      const cap = { brute: Math.ceil((1 + Math.floor(n / 4)) * 1.8), acolyte: Math.ceil((1 + Math.floor(n / 5)) * 1.8), ladder: Math.ceil((2 + Math.floor(n / 4)) * 1.6), bowman: Math.ceil((2 + Math.floor(n / 3)) * 1.8) };
      const have = {};
      let guard = 0;
      while (budget > 0 && guard++ < 400) {
        const k = pool[Math.floor(rng() * pool.length)];
        if (cap[k] != null && (have[k] || 0) >= cap[k]) continue;
        have[k] = (have[k] || 0) + 1;
        add(k, t); t += 0.3 + rng() * 0.6;
        budget -= SG.FOES[k].cost;
      }
      if (w === count - 1 && n % 5 === 0) add('captain', t + 2);
    }
    waves.push(list.sort((a, b) => a.at - b.at));
  }
  return waves;
};

// ---------- The siege ----------
let UID = 1;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const NB = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.41], [-1, 1, 1.41], [1, -1, 1.41], [-1, -1, 1.41]];

class Siege {
  constructor(S, n, opts) {
    opts = opts || {};
    this.S = S; this.n = n; this.rng = opts.rng || Math.random;
    this.t = 0; this.phase = 'deploy';
    const b = S.buildings.barracks || 0, wl = S.buildings.walls || 0;
    this.levy = 40 + 10 * b + (S.flags && S.flags.penn_freed ? 5 : 0); this.regen = 1.05 + 0.3 * b; this.drill = 1 + 0.15 * b;
    const gateHp = 700 * [1, 1.5, 2.1][wl];
    this.gate = { hp: gateHp, max: gateHp, oil: wl >= 2 };
    this.keep = { hp: 900, max: 900 };
    this.waves = SG.night(n);
    this.wave = -1; this.waveT = 0; this.queue = []; this.breakT = 0;
    this.units = []; this.proj = []; this.ladders = []; this.delayed = []; this.fx = [];
    this.scale = { hp: 1.6 * (1 + 0.1 * (n - 1)), dmg: 1.3 * (1 + 0.07 * (n - 1)) };
    this.powers = {}; this.rally = 0; this.oath = 0;
    for (const id of S.party) this.powers[id] = { cd: 0 };
    this.placedHeroes = {};
    this.kills = 0; this.lost = 0;
    // The castle for tonight: fresh copies of every piece, at full strength.
    const hpk = wl >= 2 ? 1.5 : 1;
    this.pieces = SG.castle(S).pieces.map((p, i) => {
      const d = SG.PIECES[p.k];
      return { id: i, k: p.k, c: p.c, r: p.r, size: d.size, hp: (d.hp || 0) * hpk, max: (d.hp || 0) * hpk, used: false, lit: 0,
        x: (p.c + d.size / 2) * CELL, y: (p.r + d.size / 2) * CELL, cd: 0 };
    });
    this.flowDirty = true;
    this.selected = [];
  }
  // ----- the castle grid -----
  blockedCell(c, r) { const p = this.pieceIn(c, r); return !!(p && SG.PIECES[p.k].block && p.hp > 0); }
  pieceIn(c, r) {
    for (const p of this.pieces) if (c >= p.c && c < p.c + p.size && r >= p.r && r < p.r + p.size && (p.hp > 0 || !SG.PIECES[p.k].block)) return p;
    return null;
  }
  // Dijkstra over the field grid from a set of goal cells. Returns distances.
  flowFrom(goals) {
    const N = COLS * ROWS, d = new Float32Array(N).fill(Infinity), open = [];
    for (const [c, r] of goals) { if (this.blockedCell(c, r)) continue; d[r * COLS + c] = 0; open.push(r * COLS + c); }
    while (open.length) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (d[open[i]] < d[open[bi]]) bi = i;
      const cur = open.splice(bi, 1)[0], c = cur % COLS, r = (cur / COLS) | 0;
      for (const [dc, dr, w] of NB) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
        if (this.blockedCell(nc, nr)) continue;
        if (dc && dr && (this.blockedCell(c + dc, r) || this.blockedCell(c, r + dr))) continue;
        const p = this.pieceIn(nc, nr), k = p ? SG.PIECES[p.k] : null;
        const cost = w * (k && k.slow ? 1 / k.slow : 1);
        const nd = d[cur] + cost, ni = nr * COLS + nc;
        if (nd < d[ni]) { if (d[ni] === Infinity) open.push(ni); d[ni] = nd; }
      }
    }
    return d;
  }
  flows() {
    if (!this.flowDirty) return;
    this.flowDirty = false;
    const gate = [], wall = [];
    for (let c = 0; c < COLS; c++) {
      const x = c * CELL + 2, atGate = x > GEO.GATE_X0 && x < GEO.GATE_X1;
      (atGate ? gate : wall).push([c, ROWS - 1]);
    }
    this.flowGate = this.flowFrom(gate);
    this.flowWall = this.flowFrom(wall);
  }
  // Steers along a flow field. Returns false if there's no way through.
  steer(u, field, dt) {
    this.flows();
    const { c, r } = cellOf(clamp(u.x, 0, 99.9), clamp(u.y, 0, ROWS * CELL - 0.1));
    const here = field[r * COLS + c];
    if (here === Infinity && !this.blockedCell(c, r)) return false;
    let best = null, bd = here;
    for (const [dc, dr] of NB) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const v = field[nr * COLS + nc];
      if (v < bd) { bd = v; best = [nc, nr]; }
    }
    if (!best) return here !== Infinity;
    this.moveTo(u, best[0] * CELL + CELL / 2, best[1] * CELL + CELL / 2, dt);
    return true;
  }
  // The nearest standing wall or tower, for enemies with no way round.
  nearestBlock(u) {
    let best = null, bd = Infinity;
    for (const p of this.pieces) if (SG.PIECES[p.k].block && p.hp > 0) { const d = Math.hypot(p.x - u.x, p.y - u.y); if (d < bd) { bd = d; best = p; } }
    return best;
  }
  hitPiece(src, p, amount) {
    if (p.hp <= 0) return;
    p.hp -= amount;
    this.fx.push({ k: 'piecehit', x: p.x, y: p.y, big: src && src.large });
    if (p.hp <= 0) {
      p.hp = 0; this.flowDirty = true;
      this.fx.push({ k: 'piecedown', x: p.x, y: p.y, size: p.size });
      for (const u of this.units) if (u.towerRef === p && u.hp > 0) { u.towerRef = null; u.zone = 'field'; u.post = { x: u.x, y: u.y + 3 }; this.damage(null, u, u.max * 0.3, {}); }
    }
  }
  pieceSlots(p) { return p.size === 2 ? [{ x: p.x - 1.6, y: p.y }, { x: p.x + 1.6, y: p.y }] : []; }
  // ----- placing -----
  unlocked(type) {
    const d = SG.UNITS[type];
    return !d.req || (this.S.buildings[d.req[0]] || 0) >= d.req[1];
  }
  meleeCount() { return this.units.filter(u => u.side === 'p' && !u.hero && !u.temp && u.type !== 'pet' && u.hp > 0).length; }
  zoneAt(x, y) {
    if (y >= GEO.FIELD.y0 && y <= GEO.FIELD.y1 && x >= 3 && x <= 97) { const { c, r } = cellOf(x, y); if (this.blockedCell(c, r)) return null; return 'field'; }
    if (y >= GEO.YARD.y0 && y <= GEO.YARD.y1 && x >= 6 && x <= 94) return 'yard';
    return null;
  }
  occupied(x, y) { return this.units.some(u => u.hp > 0 && u.side === 'p' && (u.zone === 'wall' || u.zone === 'tower') && Math.abs(u.x - x) < 0.5 && Math.abs(u.y - y) < 0.5); }
  // Finds a free wall spot or tower spot near (x, y). Ballistas only use towers.
  slotAt(x, y, towerOnly) {
    const spots = [];
    if (!towerOnly) for (const sx of GEO.SLOTS) spots.push({ x: sx, y: WALL_Y + 2, zone: 'wall' });
    if (this.S.buildings.walls >= 1) for (const tx of GEO.TOWERS) spots.push({ x: tx, y: WALL_Y + 1, zone: 'tower' });
    for (const p of this.pieces) if (p.k === 'tower' && p.hp > 0) for (const s of this.pieceSlots(p)) spots.push({ x: s.x, y: s.y, zone: 'tower', ref: p });
    let best = null, bd = 7;
    for (const s of spots) {
      if (this.occupied(s.x, s.y) || this.units.some(u => u.side === 'p' && u.hp > 0 && u.dest && Math.abs(u.dest.x - s.x) < 0.5 && Math.abs(u.dest.y - s.y) < 0.5)) continue;
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }
  freeSpots(towerOnly) {
    const out = [];
    for (let x = 0; x <= 100; x += 2) { const s = this.slotAt(x, WALL_Y + 2, towerOnly); if (s && !out.some(o => o.x === s.x && o.y === s.y)) out.push(s); }
    for (const p of this.pieces) if (p.k === 'tower' && p.hp > 0) for (const sp of this.pieceSlots(p)) { const s = this.slotAt(sp.x, sp.y, towerOnly); if (s && !out.some(o => o.x === s.x && o.y === s.y)) out.push(s); }
    return out;
  }
  canPlace(type, x, y) {
    const d = SG.UNITS[type];
    if (!d || !this.unlocked(type)) return 'Not trained yet.';
    if (this.levy < d.cost) return 'Not enough levy yet.';
    if (this.meleeCount() >= SG.ARMY_CAP) return 'That\'s as many soldiers as Emberwake can field.';
    if (d.zone === 'wall' || d.zone === 'tower') {
      if (!this.slotAt(x, y, d.zone === 'tower')) return d.zone === 'tower' ? 'Ballistas go on a free tower spot.' : 'Archers need a free gold spot on the wall or a tower.';
      return null;
    }
    if (!this.zoneAt(x, y)) return 'Place soldiers in front of the wall or in the yard.';
    return null;
  }
  place(type, x, y) {
    const err = this.canPlace(type, x, y);
    if (err) return err;
    const d = SG.UNITS[type];
    this.levy -= d.cost;
    let zone = d.zone, px = x, py = y, ref = null;
    if (zone === 'wall' || zone === 'tower') { const s = this.slotAt(x, y, zone === 'tower'); px = s.x; py = s.y; zone = s.zone; ref = s.ref || null; }
    else zone = this.zoneAt(x, y);
    const k = type === 'ballista' ? 1 : this.drill;
    const u = this.makeUnit('p', type, d, px, py, zone, { hp: d.hp * k, dmg: (d.dmg || 0) * k, heal: (d.heal || 0) * k });
    u.towerRef = ref;
    this.units.push(u);
    this.fx.push({ k: 'place', x: px, y: py });
    return null;
  }
  makeUnit(side, type, d, x, y, zone, over) {
    over = over || {};
    const hp = over.hp || d.hp;
    return {
      uid: UID++, side, type, name: d.name, sprite: d.sprite, x, y, hp, max: hp,
      dmg: over.dmg != null ? over.dmg : d.dmg || 0, heal: over.heal != null ? over.heal : d.heal || 0,
      rate: d.rate, range: d.range, speed: d.speed || 0, armour: d.armour || 0, cd: this.rng() * d.rate,
      post: { x, y }, zone, target: null, state: 'move', timer: 0, burn: 0, burnDps: 0, face: side === 'p' ? -1 : 1,
      large: !!d.large, vsLarge: d.vsLarge || 1, proj: d.proj, splash: d.splash || 0, pierce: !!d.pierce,
      ranged: !!d.ranged || (d.range || 0) > 10, healer: !!d.healer || (!!d.heal && !d.dmg), ladder: !!d.ladder,
      gateOnly: !!d.gateOnly, siege: !!d.siege, boss: !!d.boss, aura: !!d.aura, atk: 0, hurt: 0,
      hero: over.hero || null, temp: over.temp || 0, respawn: 0, path: null,
    };
  }
  heroUnitDef(id) {
    const st = E.heroStats(this.S, id), def = D.HEROES[id];
    const base = { name: def.name, sprite: def.sprite, hp: Math.round(st.maxHp * 2), armour: st.def / 5, speed: 12, rate: 1.0, range: 4, dmg: st.str * 0.7 };
    if (id === 'wren') Object.assign(base, { range: 48, dmg: st.str * 0.6, proj: 'arrow' });
    if (id === 'isolde') Object.assign(base, { range: 38, dmg: st.mag * 0.55, proj: 'fire', splash: 4.5, rate: 1.3 });
    if (id === 'dace') Object.assign(base, { rate: 0.65, range: 3.5, dmg: st.str * 0.55 });
    if (id === 'hesk') Object.assign(base, { dmg: st.str * 0.65 });
    if (id === 'aldric') Object.assign(base, { hp: Math.round(st.maxHp * 2.4), armour: st.def / 4, dmg: st.str * 0.65 });
    if (id === 'morwen') Object.assign(base, { range: 36, dmg: st.mag * 0.5, proj: 'fire', splash: 3, rate: 1.2 });
    return { base, st };
  }
  placeHero(id, x, y) {
    if (this.placedHeroes[id]) return 'Already placed.';
    const zone = this.zoneAt(x, y);
    if (!zone) return 'Heroes stand in front of the wall or in the yard.';
    const { base } = this.heroUnitDef(id);
    const u = this.makeUnit('p', 'hero', base, x, y, zone, { hero: id });
    this.units.push(u);
    this.placedHeroes[id] = true;
    this.fx.push({ k: 'place', x, y });
    if (id === 'hesk') {
      const c = E.creatureOf(this.S, this.S.companion);
      if (c) {
        const cs = E.creatureStats(c);
        this.units.push(this.makeUnit('p', 'pet', { name: E.creatureName(c), sprite: E.creatureSprite(c), hp: cs.maxHp * 2, dmg: cs.str * 0.8, rate: 1.0, range: 3.5, speed: 14, armour: cs.def / 4 }, x + 4, y + 1, zone, {}));
      }
    }
    return null;
  }
  start() {
    const spots = [[50, 94], [41, 92], [59, 92], [35, 96], [65, 96]];
    let i = 0;
    for (const id of this.S.party) if (!this.placedHeroes[id] && this.S.heroes[id]) {
      let [x, y] = spots[i++ % spots.length];
      if (!this.zoneAt(x, y)) y = GEO.YARD.y0 + 4;
      this.placeHero(id, x, y);
    }
    this.phase = 'fight';
    this.nextWave();
  }
  nextWave() {
    this.wave++;
    this.waveT = 0;
    this.queue = this.waves[this.wave].slice();
    this.fx.push({ k: 'wave', n: this.wave + 1, of: this.waves.length });
  }
  // ----- orders -----
  // Which side of the wall a point is on: 'out' (field), 'in' (yard) or 'wall'.
  sideOf(x, y) { return y < WALL_Y - 0.5 ? 'out' : y > YARD_Y - 0.5 ? 'in' : 'wall'; }
  order(uids, x, y) {
    const us = this.units.filter(u => uids.includes(u.uid) && u.side === 'p' && u.hp > 0);
    if (!us.length) return 'Nobody selected.';
    let sent = 0;
    const ringAt = i => { if (!i) return [0, 0]; const a = i * 2.4, r = 2.6 * Math.sqrt(i); return [Math.cos(a) * r, Math.sin(a) * r]; };
    let k = 0;
    for (const u of us) {
      const ranged = u.ranged && u.type !== 'hero' ? true : u.ranged;
      let dest = null;
      if (ranged || u.type === 'ballista') {
        const s = this.slotAt(x, y, u.type === 'ballista');
        if (s) dest = { x: s.x, y: s.y, zone: s.zone, ref: s.ref || null };
      }
      if (!dest) {
        if (u.type === 'ballista') continue;
        const [ox, oy] = ringAt(k++);
        const tx = clamp(x + ox, 4, 96), ty = y + oy;
        const z = this.zoneAt(tx, ty) || this.zoneAt(x, y);
        if (!z) continue;
        dest = { x: this.zoneAt(tx, ty) ? tx : x, y: this.zoneAt(tx, ty) ? ty : y, zone: z };
      }
      this.route(u, dest);
      sent++;
    }
    return sent ? null : 'They can\'t go there.';
  }
  route(u, dest) {
    const from = this.sideOf(u.x, u.y), to = dest.zone === 'field' ? 'out' : dest.zone === 'yard' ? 'in' : dest.zone === 'tower' && dest.ref ? 'out' : 'wall';
    const path = [];
    const inGate = { x: 50, y: YARD_Y + 3 }, outGate = { x: 50, y: WALL_Y - 4 };
    if (from === 'wall' && to !== 'wall') path.push({ x: u.x, y: YARD_Y + 3 });
    const fromSide = from === 'wall' ? 'in' : from;
    if (fromSide === 'in' && to === 'out') path.push(inGate, outGate);
    if (fromSide === 'out' && (to === 'in' || to === 'wall')) path.push(outGate, inGate);
    path.push({ x: dest.x, y: dest.y });
    u.path = path; u.dest = dest;
    u.zone = 'march'; u.towerRef = null;
    u.speed = u.speed || 10;
  }
  // ----- powers -----
  usePower(id, x, y) {
    const p = this.powers[id], d = SG.POWERS[id];
    if (!p || p.cd > 0 || this.phase !== 'fight' && this.phase !== 'break') return 'Not ready.';
    const st = E.heroStats(this.S, id);
    p.cd = d.cd;
    this.fx.push({ k: 'power', id, x, y, r: d.r });
    const foesNear = (px, py, r) => this.units.filter(u => u.side === 'e' && u.hp > 0 && Math.hypot(u.x - px, u.y - py) <= r);
    if (id === 'bram') {
      for (const u of this.units) if (u.side === 'p' && u.hp > 0) { u.hp = Math.min(u.max, u.hp + u.max * 0.35); this.fx.push({ k: 'heal', x: u.x, y: u.y }); }
      this.rally = 8;
    } else if (id === 'wren') {
      for (let i = 0; i < 18; i++) {
        const a = this.rng() * Math.PI * 2, r = Math.sqrt(this.rng()) * d.r, ix = x + Math.cos(a) * r, iy = y + Math.sin(a) * r;
        this.delayed.push({ t: 0.3 + i * 0.06, fn: () => {
          this.fx.push({ k: 'arrowfall', x: ix, y: iy });
          for (const u of foesNear(ix, iy, 2.6)) this.damage(null, u, st.str * 0.8, { power: true });
        } });
      }
    } else if (id === 'isolde') {
      this.fx.push({ k: 'boom', x, y, r: d.r, fire: true });
      for (const u of foesNear(x, y, d.r)) { this.damage(null, u, st.mag * 3.2, { power: true, fire: true }); u.burn = 5; u.burnDps = st.mag * 0.4; }
      for (const pc of this.pieces) if (pc.k === 'pitch' && !pc.used && Math.hypot(pc.x - x, pc.y - y) <= d.r) this.ignite(pc);
    } else if (id === 'hesk') {
      const zone = y < WALL_Y ? 'field' : 'yard';
      const py = zone === 'field' ? clamp(y, GEO.FIELD.y0, GEO.FIELD.y1) : clamp(y, GEO.YARD.y0, GEO.YARD.y1);
      for (let i = 0; i < 3; i++) this.units.push(this.makeUnit('p', 'wolf', { name: 'Wolf', sprite: 'wolf', hp: 110 + st.str * 2, dmg: st.str * 0.5, rate: 0.8, range: 3, speed: 16, armour: 2 }, x + (i - 1) * 4, py, zone, { temp: 18 }));
    } else if (id === 'aldric') {
      this.oath = 7;
      for (const u of this.units) if (u.side === 'p' && u.hp > 0) this.fx.push({ k: 'heal', x: u.x, y: u.y });
    } else if (id === 'morwen') {
      this.fx.push({ k: 'boom', x, y, r: d.r });
      for (const u of foesNear(x, y, d.r)) { u.slow = 7; this.damage(null, u, st.mag * 2, { power: true }); u.burn = 4; u.burnDps = st.mag * 0.25; }
    } else if (id === 'dace') {
      this.fx.push({ k: 'keg', x, y, t: 1.5 });
      this.delayed.push({ t: 1.5, fn: () => {
        this.fx.push({ k: 'boom', x, y, r: d.r });
        for (const u of foesNear(x, y, d.r)) this.damage(null, u, st.str * 10, { power: true, pierce: true });
        for (const l of this.ladders) if (Math.hypot(l.x - x, WALL_Y - y) <= d.r + 2) this.breakLadder(l);
      } });
    }
    return null;
  }
  // Pitch ditches: lighting one lights every ditch joined to it.
  ignite(p) {
    if (!p || p.k !== 'pitch' || p.used) return false;
    const todo = [p];
    while (todo.length) {
      const q = todo.pop();
      if (q.used) continue;
      q.used = true; q.lit = 9;
      this.fx.push({ k: 'boom', x: q.x, y: q.y, r: 3, fire: true, small: true });
      for (const o of this.pieces) if (o.k === 'pitch' && !o.used && Math.abs(o.c - q.c) <= 1 && Math.abs(o.r - q.r) <= 1) todo.push(o);
    }
    return true;
  }
  lightPitchAt(x, y) {
    const { c, r } = cellOf(x, y);
    for (const p of this.pieces) if (p.k === 'pitch' && !p.used && Math.abs(p.c - c) <= 1 && Math.abs(p.r - r) <= 1) return this.ignite(p);
    return false;
  }
  // ----- combat -----
  damage(src, t, amount, o) {
    o = o || {};
    if (t.hp <= 0) return;
    let n = amount;
    if (src && src.side === 'p' && this.rally > 0) n *= 1.4;
    if (t.side === 'p' && this.oath > 0) n *= 0.5;
    if (src && src.side === 'e') {
      const cap = this.units.find(u => u.aura && u.hp > 0 && dist(u, src) < 15);
      if (cap) n *= 1.3;
    }
    if (src && t.large) n *= src.vsLarge || 1;
    if (!o.pierce && !(src && src.pierce)) n = n * 10 / (10 + t.armour + (t.zone === 'wall' || t.zone === 'tower' ? (t.towerRef ? 11 : 4) : 0));
    n *= 0.9 + this.rng() * 0.2;
    t.hp -= n; t.hurt = 0.15;
    this.fx.push({ k: 'hit', x: t.x, y: t.y - 2, side: t.side, power: !!o.power, n: Math.round(n), fire: !!o.fire });
    if (t.hp <= 0) this.kill(t);
  }
  kill(u) {
    u.hp = 0;
    this.fx.push({ k: 'die', x: u.x, y: u.y, side: u.side, large: u.large });
    if (u.side === 'e') { this.kills++; this.levy = Math.min(99, this.levy + (u.large ? 3 : 0.5)); }
    else if (u.hero) { u.respawn = 20; this.fx.push({ k: 'herodown', id: u.hero }); }
    else if (!u.temp) this.lost++;
    this.selected = this.selected.filter(id => id !== u.uid || u.hero);
  }
  breakLadder(l) {
    if (l.hp <= 0) return;
    l.hp = 0;
    this.fx.push({ k: 'ladderdown', x: l.x, y: WALL_Y });
    for (const u of this.units) if (u.side === 'e' && u.state === 'climb' && u.ladderRef === l) { u.state = 'move'; u.y = WALL_Y - 2; this.damage(null, u, 30, {}); }
  }
  hitGate(src) {
    this.gate.hp = Math.max(0, this.gate.hp - src.dmg);
    this.fx.push({ k: 'gatehit', big: src.large, x: src.x, y: WALL_Y });
    if (this.gate.oil) this.damage(null, src, 8 * src.rate, { pierce: true });
    if (this.gate.hp <= 0 && !this.gate.broken) { this.gate.broken = true; this.fx.push({ k: 'gatebroken' }); }
  }
  shoot(src, t, extra) {
    const fire = src.side === 'p' && src.type === 'archer' && this.pieces.some(p => p.k === 'brazier' && Math.hypot(p.x - src.x, p.y - src.y) < 26);
    this.proj.push(Object.assign({ x: src.x, y: src.y - 3, t, tx: t.x, ty: t.y, kind: fire ? 'firearrow' : src.proj || 'arrow', src, dmg: src.dmg * (fire ? 1.3 : 1) * (src.towerRef ? 1.15 : 1), splash: src.splash,
      speed: src.proj === 'bolt' ? 110 : src.proj === 'fire' ? 60 : src.proj === 'rock' ? 32 : 85, sx: src.x, sy: src.y - 3, burn: fire }, extra || {}));
  }
  moveTo(u, x, y, dt) {
    const dx = x - u.x, dy = y - u.y, d = Math.hypot(dx, dy);
    if (d < 0.3) return true;
    let mult = u.slow > 0 ? 0.5 : 1;
    if (u.side === 'e' && u.y < WALL_Y) {
      const p = this.pieceIn(...Object.values(cellOf(clamp(u.x, 0, 99.9), clamp(u.y, 0, 103))));
      if (p && SG.PIECES[p.k].slow) mult *= SG.PIECES[p.k].slow;
    }
    const sp = u.speed * mult * dt;
    if (sp >= d) { u.x = x; u.y = y; return true; }
    u.x += dx / d * sp; u.y += dy / d * sp;
    if (Math.abs(dx) > 0.2) u.face = dx > 0 ? 1 : -1;
    return false;
  }
  enemiesAlive() { return this.units.some(u => u.side === 'e' && u.hp > 0) || this.queue.length > 0; }
  spawn(s) {
    const d = SG.FOES[s.t];
    const u = this.makeUnit('e', s.t, d, s.x, -2, 'field', { hp: d.hp * this.scale.hp, dmg: (d.dmg || 0) * this.scale.dmg, heal: (d.heal || 0) * this.scale.dmg });
    u.holdY = 26 + this.rng() * 10;
    this.units.push(u);
  }

  step(dt) {
    if (this.phase !== 'fight' && this.phase !== 'break') return;
    this.t += dt;
    this.levy = Math.min(99, this.levy + this.regen * dt);
    for (const id in this.powers) this.powers[id].cd = Math.max(0, this.powers[id].cd - dt);
    this.rally = Math.max(0, this.rally - dt);
    this.oath = Math.max(0, this.oath - dt);
    if (this.phase === 'break') {
      this.breakT -= dt;
      if (this.breakT <= 0) { this.phase = 'fight'; this.nextWave(); }
    } else {
      this.waveT += dt;
      while (this.queue.length && this.queue[0].at <= this.waveT) { this.spawn(this.queue.shift()); this.lastSpawn = this.waveT; }
      // Stragglers who hang back too long lose their nerve and charge.
      if (!this.queue.length && this.waveT - (this.lastSpawn || 0) > 75) for (const u of this.units) if (u.side === 'e' && u.hp > 0) { u.ranged = false; u.siege = false; u.healer = false; }
    }
    for (let i = this.delayed.length - 1; i >= 0; i--) {
      const d = this.delayed[i]; d.t -= dt;
      if (d.t <= 0) { this.delayed.splice(i, 1); d.fn(); }
    }
    this.stepPieces(dt);
    for (const u of this.units) {
      if (u.hp <= 0) {
        if (u.hero && u.respawn > 0) {
          u.respawn -= dt;
          if (u.respawn <= 0) { u.hp = u.max * 0.6; u.x = GEO.KEEP.x; u.y = GEO.YARD.y1; u.state = 'move'; u.zone = 'yard'; u.post = { x: u.x, y: u.y }; u.path = null; this.fx.push({ k: 'heroback', id: u.hero }); }
        }
        continue;
      }
      u.cd -= dt; u.atk = Math.max(0, u.atk - dt); u.hurt = Math.max(0, u.hurt - dt); u.slow = Math.max(0, (u.slow || 0) - dt);
      if (u.burn > 0) { u.burn -= dt; u.hp -= u.burnDps * dt; if (this.rng() < dt * 6) this.fx.push({ k: 'ember', x: u.x, y: u.y - 3 }); if (u.hp <= 0) { this.kill(u); continue; } }
      if (u.temp) { u.temp -= dt; if (u.temp <= 0) { u.hp = 0; this.fx.push({ k: 'die', x: u.x, y: u.y, side: 'p' }); continue; } }
      if (u.side === 'e') this.enemyStep(u, dt); else this.playerStep(u, dt);
    }
    this.separate();
    this.stepProj(dt);
    this.units = this.units.filter(u => u.hp > 0 || (u.hero && u.respawn > 0));
    this.ladders = this.ladders.filter(l => l.hp > 0);
    if (this.keep.hp <= 0) { this.phase = 'lost'; this.fx.push({ k: 'lost' }); return; }
    if (this.phase === 'fight' && !this.enemiesAlive()) {
      if (this.wave >= this.waves.length - 1) { this.phase = 'won'; this.fx.push({ k: 'won' }); }
      else { this.phase = 'break'; this.breakT = 7; this.fx.push({ k: 'break', t: 7 }); }
    }
  }
  stepPieces(dt) {
    for (const p of this.pieces) {
      const d = SG.PIECES[p.k];
      if (p.k === 'pitch' && p.lit > 0) {
        p.lit -= dt;
        if (this.rng() < dt * 10) this.fx.push({ k: 'ember', x: p.c * CELL + this.rng() * CELL, y: p.r * CELL + this.rng() * CELL });
        for (const u of this.units) if (u.side === 'e' && u.hp > 0 && this.inPiece(u, p, 1)) { u.hp -= d.fire * this.scale.dmg * 0.6 * dt; if (u.hp <= 0) this.kill(u); }
      }
      if (p.k === 'stakes') for (const u of this.units) if (u.side === 'e' && u.hp > 0 && this.inPiece(u, p, 0)) { u.hp -= d.dps * dt; if (u.hp <= 0) this.kill(u); }
      if (p.k === 'pit' && !p.used) {
        const v = this.units.find(u => u.side === 'e' && u.hp > 0 && this.inPiece(u, p, -0.5));
        if (v) { p.used = true; this.fx.push({ k: 'pit', x: p.x, y: p.y }); this.damage(null, v, v.large ? v.max * 0.45 : d.trap * this.scale.hp * 0.6, { pierce: true, power: true }); if (v.hp > 0) v.slow = 4; }
      }
      if (p.k === 'mangonel' && p.hp > 0) {
        p.cd -= dt;
        if (p.cd <= 0) {
          const foes = this.units.filter(u => u.side === 'e' && u.hp > 0 && u.y < WALL_Y - 6 && u.state !== 'climb' && Math.hypot(u.x - p.x, u.y - p.y) < 90 && Math.hypot(u.x - p.x, u.y - p.y) > 20);
          let best = null, bs = 0;
          for (const f of foes) { const s = foes.filter(o => Math.hypot(o.x - f.x, o.y - f.y) < 6).length + (f.large ? 2 : 0); if (s > bs) { bs = s; best = f; } }
          if (best) { p.cd = 5; this.proj.push({ x: p.x, y: p.y - 3, t: best, tx: best.x, ty: best.y, kind: 'rock', src: { side: 'p', x: p.x, y: p.y }, dmg: 70, splash: 6, speed: 34, sx: p.x, sy: p.y - 3, mangonel: true }); }
        }
      }
    }
  }
  inPiece(u, p, pad) {
    const x0 = p.c * CELL - pad, y0 = p.r * CELL - pad, s = p.size * CELL + pad * 2;
    return u.x >= x0 && u.x <= x0 + s && u.y >= y0 && u.y <= y0 + s;
  }
  inside(u) { return u.y > YARD_Y - 1; }
  enemyStep(u, dt) {
    if (u.state === 'plant') {
      u.timer -= dt;
      if (u.timer <= 0) {
        const l = { x: u.x, hp: 120 * this.scale.hp, max: 120 * this.scale.hp };
        this.ladders.push(l);
        this.fx.push({ k: 'ladder', x: u.x });
        u.state = 'climb'; u.timer = 2.5; u.ladderRef = l; u.y = WALL_Y - 1;
      }
      return;
    }
    if (u.state === 'climb') {
      u.timer -= dt;
      u.y = WALL_Y - 1 + (1 - u.timer / 2.5) * 6;
      if (u.timer <= 0) { u.state = 'move'; u.y = YARD_Y + 2; u.ladderRef = null; }
      return;
    }
    const inside = this.inside(u);
    if (u.healer) {
      const hurt = this.units.filter(o => o.side === 'e' && o.hp > 0 && o !== u && o.hp < o.max * 0.85 && dist(o, u) <= u.range).sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
      if (hurt && u.cd <= 0) { hurt.hp = Math.min(hurt.max, hurt.hp + u.heal); u.cd = u.rate; this.fx.push({ k: 'heal', x: hurt.x, y: hurt.y, dark: true }); }
      const front = this.units.filter(o => o.side === 'e' && o.hp > 0 && o !== u && !o.healer).sort((a, b) => b.y - a.y)[0];
      const gy = front ? Math.max(4, front.y - 10) : WALL_Y - 18;
      this.moveTo(u, front ? front.x : 50, Math.min(gy, WALL_Y - 12), dt);
      return;
    }
    // Catapults stop well back and smash walls, towers and anything on the wall.
    if (u.siege) {
      if (u.y < u.holdY) { this.moveTo(u, u.x, u.holdY, dt); return; }
      if (u.cd > 0) return;
      const pc = this.pieces.filter(p => SG.PIECES[p.k].block && p.hp > 0 && Math.hypot(p.x - u.x, p.y - u.y) <= u.range).sort((a, b) => b.y - a.y)[0];
      const un = this.nearest(u, o => o.side === 'p' && o.hp > 0, u.range);
      const tgt = pc ? { x: pc.x, y: pc.y, hp: 1, piece: pc } : un || (Math.hypot(50 - u.x, WALL_Y - u.y) <= u.range + 30 ? { x: 50, y: WALL_Y, hp: 1, gate: true } : null);
      if (tgt) {
        u.cd = u.rate; u.atk = 0.4;
        this.proj.push({ x: u.x, y: u.y - 3, t: tgt.piece || tgt.gate ? null : tgt, tx: tgt.x, ty: tgt.y, piece: tgt.piece || null, gate: !!tgt.gate, kind: 'rock', src: u, dmg: u.dmg, splash: u.splash, speed: 32, sx: u.x, sy: u.y - 3 });
      } else this.moveTo(u, u.x, u.y + 10, dt);
      return;
    }
    if (u.ranged) {
      const t = u.y >= WALL_Y - 40 ? this.nearest(u, o => o.side === 'p' && o.hp > 0, u.range) : null;
      if (t) { if (u.cd <= 0) { this.shoot(u, t); u.cd = u.rate; u.atk = 0.2; } u.face = t.x > u.x ? 1 : -1; return; }
      if (u.y < WALL_Y - 30) { this.flows(); if (!this.steer(u, this.flowGate, dt)) this.moveTo(u, u.x, u.y + 5, dt); }
      return;
    }
    if (!u.gateOnly) {
      const aggro = u.type === 'hound' ? 10 : 7;
      const t = this.nearest(u, o => o.side === 'p' && o.hp > 0 && o.zone !== 'wall' && o.zone !== 'tower' && o.zone !== 'march' && this.inside(o) === inside, aggro)
        || (inside ? this.nearest(u, o => o.side === 'p' && o.hp > 0 && (o.zone === 'wall'), 6) : null);
      if (t) { this.melee(u, t, dt); return; }
    }
    if (inside) {
      const kx = GEO.KEEP.x + clamp(u.x - 50, -8, 8), ky = GEO.KEEP.y - 7;
      if (this.moveTo(u, kx, ky, dt) || Math.hypot(u.x - kx, u.y - ky) < 2) {
        if (u.cd <= 0) { this.keep.hp -= u.dmg; u.cd = u.rate; u.atk = 0.2; this.fx.push({ k: 'keephit', x: u.x, y: u.y }); }
      }
      return;
    }
    // Outside: smashing through a wall in the way, if there's no way round.
    if (u.bash) {
      if (u.bash.hp <= 0) { u.bash = null; return; }
      if (Math.hypot(u.bash.x - u.x, u.bash.y - u.y) > u.range + u.bash.size * 2.2) { this.moveTo(u, u.bash.x, u.bash.y, dt); return; }
      if (u.cd <= 0) { this.hitPiece(u, u.bash, u.dmg * (u.large ? 2 : 1)); u.cd = u.rate; u.atk = 0.25; u.face = u.bash.x > u.x ? 1 : -1; }
      return;
    }
    const nearWall = u.y >= WALL_Y - 7;
    if (this.gate.broken && !u.ladder && nearWall) {
      if (Math.abs(u.x - 50) > 3.5 && u.y < WALL_Y - 4) this.moveTo(u, 50, WALL_Y - 4, dt);
      else this.moveTo(u, 50 + clamp(u.x - 50, -3, 3), YARD_Y + 3, dt);
      return;
    }
    if (u.ladder && nearWall) {
      if (Math.abs(u.x - 50) < 9) { this.moveTo(u, u.x < 50 ? 38 : 62, WALL_Y - 2, dt); return; }
      const near = this.ladders.find(l => Math.abs(l.x - u.x) < 8);
      if (near) { if (this.moveTo(u, near.x, WALL_Y - 1.5, dt)) { u.state = 'climb'; u.timer = 2.5; u.ladderRef = near; u.x = near.x; } }
      else if (this.moveTo(u, u.x, WALL_Y - 1.5, dt)) { u.state = 'plant'; u.timer = 3; }
      return;
    }
    if (!u.large && !u.ladder && nearWall) {
      const l = this.ladders.slice().sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
      if (l && Math.abs(u.x - l.x) < Math.abs(u.x - 50) - 4) {
        if (this.moveTo(u, l.x, WALL_Y - 1.5, dt)) { u.state = 'climb'; u.timer = 2.5; u.ladderRef = l; u.x = l.x; }
        return;
      }
    }
    if (nearWall && !u.ladder && Math.abs(u.x - 50) < 9) {
      const gx = 50 + clamp(u.x - 50, -5, 5), gy = WALL_Y - 2;
      if (this.moveTo(u, gx, gy, dt) || (u.y >= WALL_Y - 3.5 && Math.abs(u.x - 50) < 7)) {
        if (u.cd <= 0) { this.hitGate(u); u.cd = u.rate; u.atk = 0.25; }
      }
      return;
    }
    // Far from the wall: follow the flow field, or bash through if walled in.
    this.flows();
    if (!this.steer(u, u.ladder ? this.flowWall : this.flowGate, dt)) {
      u.bash = this.nearestBlock(u);
      if (!u.bash) this.moveTo(u, 50, WALL_Y - 2, dt);
    }
  }
  playerStep(u, dt) {
    if (u.zone === 'march') {
      const wp = u.path && u.path[0];
      if (!wp) { this.arrive(u); return; }
      const sp = u.speed; u.speed = Math.max(sp, 9);
      if (this.moveTo(u, wp.x, wp.y, dt)) u.path.shift();
      u.speed = sp;
      if (!u.path.length) this.arrive(u);
      return;
    }
    if (u.zone === 'wall' || u.zone === 'tower') {
      const t = u.type === 'ballista'
        ? this.units.filter(o => o.side === 'e' && o.hp > 0 && o.state !== 'climb' && dist(o, u) <= u.range).sort((a, b) => b.hp - a.hp)[0]
        : this.nearest(u, o => o.side === 'e' && o.hp > 0, u.range * (u.towerRef ? 1.2 : 1));
      if (t && u.cd <= 0) { this.shoot(u, t); u.cd = u.rate; u.atk = 0.2; u.face = t.x > u.x ? 1 : -1; }
      return;
    }
    if (u.healer) {
      const hurt = this.units.filter(o => o.side === 'p' && o.hp > 0 && o.hp < o.max * 0.9 && dist(o, u) <= u.range).sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
      if (hurt && u.cd <= 0) { hurt.hp = Math.min(hurt.max, hurt.hp + u.heal); u.cd = u.rate; u.atk = 0.2; this.fx.push({ k: 'heal', x: hurt.x, y: hurt.y }); }
      this.moveTo(u, u.post.x, u.post.y, dt);
      return;
    }
    const field = u.zone === 'field';
    const ok = o => o.side === 'e' && o.hp > 0 && o.state !== 'climb' && (field ? !this.inside(o) : this.inside(o));
    if (u.ranged) {
      const t = this.nearest(u, ok, u.range);
      if (t) { if (u.cd <= 0) { this.shoot(u, t); u.cd = u.rate; u.atk = 0.2; } u.face = t.x > u.x ? 1 : -1; }
      else this.moveTo(u, u.post.x, u.post.y, dt);
      return;
    }
    const aggro = field ? 16 : 26;
    const t = this.units.filter(o => ok(o) && dist(o, u) <= aggro && Math.hypot(o.x - u.post.x, o.y - u.post.y) <= aggro + 10)
      .sort((a, b) => dist(a, u) - dist(b, u))[0];
    if (t) { this.melee(u, t, dt); return; }
    if (!field) {
      const l = this.ladders.filter(l => Math.abs(l.x - u.post.x) < 30).sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
      if (l) {
        if (this.moveTo(u, l.x, YARD_Y + 2, dt) || Math.hypot(u.x - l.x, u.y - YARD_Y - 2) < 3) {
          if (u.cd <= 0) { l.hp -= u.dmg; u.cd = u.rate; u.atk = 0.2; this.fx.push({ k: 'hit', x: l.x, y: YARD_Y, side: 'l' }); if (l.hp <= 0) this.breakLadder(l); }
        }
        return;
      }
    }
    this.moveTo(u, u.post.x, u.post.y, dt);
  }
  arrive(u) {
    const d = u.dest || { x: u.x, y: u.y, zone: this.zoneAt(u.x, u.y) || 'yard' };
    u.path = null; u.dest = null;
    u.x = d.x; u.y = d.y; u.post = { x: d.x, y: d.y };
    u.zone = d.zone; u.towerRef = d.ref || null;
    if (u.zone === 'tower' && !u.towerRef && !GEO.TOWERS.includes(Math.round(u.x))) u.zone = 'wall';
  }
  melee(u, t, dt) {
    const d = dist(u, t);
    if (d > u.range) { this.moveTo(u, t.x, t.y, dt); if (u.side === 'e' && !this.inside(u)) u.y = Math.min(u.y, WALL_Y - 1.5); return; }
    u.face = t.x > u.x ? 1 : -1;
    if (u.cd <= 0) { this.damage(u, t, u.dmg); u.cd = u.rate; u.atk = 0.2; }
  }
  nearest(u, pred, range) {
    let best = null, bd = range;
    for (const o of this.units) { if (!pred(o)) continue; const d = dist(o, u); if (d <= bd) { bd = d; best = o; } }
    return best;
  }
  separate() {
    const g = this.units.filter(u => u.hp > 0 && u.zone !== 'wall' && u.zone !== 'tower' && u.zone !== 'march' && u.state !== 'climb' && u.state !== 'plant');
    for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) {
      const a = g[i], b = g[j], r = (a.large || b.large) ? 4.2 : 2.4;
      const dx = b.x - a.x, dy = b.y - a.y;
      if (Math.abs(dx) > r || Math.abs(dy) > r) continue;
      const d = Math.hypot(dx, dy);
      if (d > 0.01 && d < r) {
        const push = (r - d) / 2, nx = dx / d, ny = dy / d;
        const wa = a.large && !b.large ? 0.2 : 1, wb = b.large && !a.large ? 0.2 : 1;
        a.x -= nx * push * wa; a.y -= ny * push * wa; b.x += nx * push * wb; b.y += ny * push * wb;
      }
    }
    for (const u of g) {
      u.x = clamp(u.x, 2, 98);
      if (u.side === 'e' && !this.inside(u) && !(this.gate.broken && Math.abs(u.x - 50) < 5)) u.y = Math.min(u.y, WALL_Y - 1.2);
      if (u.side === 'p' && u.zone === 'field') u.y = Math.min(u.y, WALL_Y - 1.5);
      if (u.side === 'p' && u.zone === 'yard') u.y = clamp(u.y, YARD_Y + 1, GEO.KEEP.y - 4);
      if (u.side === 'e' && this.inside(u)) u.y = Math.min(u.y, GEO.KEEP.y - 4);
      // Nobody stands inside a wall or tower: push out to the nearest edge.
      if (u.y < WALL_Y) {
        const { c, r } = cellOf(clamp(u.x, 0, 99.9), clamp(u.y, 0, 103.9));
        const p = this.pieceIn(c, r);
        if (p && SG.PIECES[p.k].block && p.hp > 0) {
          const x0 = p.c * CELL, y0 = p.r * CELL, x1 = x0 + p.size * CELL, y1 = y0 + p.size * CELL;
          const opts = [[x0 - 0.6, u.y, u.x - x0], [x1 + 0.6, u.y, x1 - u.x], [u.x, y0 - 0.6, u.y - y0], [u.x, y1 + 0.6, y1 - u.y]].sort((a, b) => a[2] - b[2]);
          u.x = opts[0][0]; u.y = opts[0][1];
        }
      }
    }
  }
  stepProj(dt) {
    for (const p of this.proj) {
      if (p.t && p.t.hp > 0) { p.tx = p.t.x; p.ty = p.t.y - 2; }
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy), sp = p.speed * dt;
      p.ang = Math.atan2(dy, dx);
      if (p.kind === 'rock') { const tot = Math.hypot(p.tx - p.sx, p.ty - p.sy) || 1; p.arc = Math.sin(Math.PI * clamp(1 - d / tot, 0, 1)) * Math.min(14, tot * 0.25); }
      if (d <= sp || (p.t && p.t.hp <= 0 && !p.splash)) {
        p.done = true;
        const tx = p.tx, ty = p.ty;
        if (p.kind === 'rock') {
          this.fx.push({ k: 'boom', x: tx, y: ty, r: p.splash, rock: true, small: !p.src.large && !p.mangonel });
          if (p.piece) this.hitPiece(p.src, p.piece, p.dmg * 2.2);
          if (p.gate) this.hitGate({ dmg: p.dmg, large: true, x: tx, rate: 0 });
          const foeSide = p.src.side === 'p' ? 'e' : 'p';
          for (const u of this.units) if (u.side === foeSide && u.hp > 0 && u.state !== 'climb' && Math.hypot(u.x - tx, u.y - ty) <= p.splash) this.damage(p.src.uid ? p.src : null, u, p.dmg * (p.mangonel ? 1 : 0.7), { pierce: !!p.mangonel });
          continue;
        }
        if (p.t && (p.t.hp > 0 || p.splash)) {
          if (p.splash) {
            this.fx.push({ k: p.kind === 'fire' ? 'boom' : 'spark', x: tx, y: ty, r: p.splash, fire: p.kind === 'fire', small: true });
            for (const u of this.units) if (u.side !== p.src.side && u.hp > 0 && Math.hypot(u.x - tx, u.y - ty) <= p.splash) this.damage(p.src, u, u === p.t ? p.dmg : p.dmg * 0.6, { fire: p.kind === 'fire' });
          } else {
            this.damage(p.src, p.t, p.dmg, { fire: p.burn });
            if (p.burn && p.t.hp > 0 && this.rng() < 0.3) { p.t.burn = 3; p.t.burnDps = 4; }
          }
        }
      } else { p.x += dx / d * sp; p.y += dy / d * sp; }
    }
    this.proj = this.proj.filter(p => !p.done);
  }
  stars() {
    if (this.phase !== 'won') return 0;
    if (!this.gate.broken && this.keep.hp >= this.keep.max * 0.9) return 3;
    return this.keep.hp > this.keep.max * 0.5 ? 2 : 1;
  }
}
SG.Siege = Siege;

SG.reward = function (S, n, stars) {
  S.siege = S.siege || { best: 0, stars: {} };
  const first = n > S.siege.best;
  const out = { first, got: [] };
  S.siege.stars[n] = Math.max(S.siege.stars[n] || 0, stars);
  if (first) {
    S.siege.best = n;
    const m = SG.MILESTONES[n];
    if (m) {
      const r = Object.assign({}, m);
      out.got = out.got.concat(E.applyReward(S, r));
      out.gearUid = r._uid;
      if (m.text) out.text = m.text;
    }
  }
  const gold = 80 + 45 * n, mats = { ore: 2 + Math.floor(n / 2), shard: n >= 3 ? Math.ceil(n / 3) : 0 };
  if (!mats.shard) delete mats.shard;
  out.got = out.got.concat(E.applyReward(S, { gold: first ? gold : Math.round(gold * 0.6), mats }));
  return out;
};

if (typeof module !== 'undefined' && module.exports) module.exports = SG; else root.SIEGE = SG;
})(this);
