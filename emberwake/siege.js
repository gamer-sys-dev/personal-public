// Emberwake siege: real time defence of the keep. Pure rules, no DOM, so it runs in node for balance tests.
// World is 100 wide by 150 tall. Enemies come from the top, the wall runs across, the keep sits at the bottom.
(function (root) {
'use strict';
const D = root.DATA || require('./data.js');
const E = root.ENGINE || require('./engine.js');
const SG = {};

const WALL_Y = 102, WALL_H = 6, YARD_Y = WALL_Y + WALL_H;
const GEO = {
  W: 100, H: 150, WALL_Y, WALL_H, YARD_Y, GATE_X0: 44, GATE_X1: 56,
  KEEP: { x: 50, y: 138 },
  SLOTS: [8, 19, 30, 70, 81, 92], TOWERS: [38, 62],
  FIELD: { y0: 54, y1: WALL_Y - 3 }, YARD: { y0: YARD_Y + 3, y1: 129 },
};
SG.GEO = GEO;

SG.UNITS = {
  archer:   { name: 'Archer', cost: 6, hp: 45, dmg: 6, rate: 1.3, range: 46, armour: 0, zone: 'wall', sprite: 'm_archer', proj: 'arrow', desc: 'Shoots from the wall. Place on a gold wall spot.' },
  sword:    { name: 'Swordsman', cost: 8, hp: 130, dmg: 10, rate: 1.0, range: 3.5, speed: 10, armour: 3, sprite: 'm_sword', desc: 'Holds a spot outside the gate or in the yard.' },
  spear:    { name: 'Spearman', cost: 10, hp: 115, dmg: 9, rate: 1.1, range: 5, speed: 9, armour: 2, vsLarge: 3, sprite: 'm_spear', req: ['barracks', 1], desc: 'Triple damage to rams and brutes.' },
  priest:   { name: 'Priest', cost: 10, hp: 60, heal: 14, rate: 1.6, range: 24, speed: 8, armour: 0, sprite: 'm_priest', req: ['barracks', 1], desc: 'Heals the most hurt defender nearby.' },
  knight:   { name: 'Knight', cost: 16, hp: 250, dmg: 17, rate: 1.0, range: 4, speed: 15, armour: 5, sprite: 'm_knight', req: ['barracks', 2], desc: 'Heavy and fast. Rides down anything near its post.' },
  ballista: { name: 'Ballista', cost: 14, hp: 140, dmg: 48, rate: 3.2, range: 90, armour: 4, zone: 'tower', sprite: 'ballista', proj: 'bolt', splash: 4, pierce: true, req: ['walls', 1], desc: 'Gate towers only. Huge bolts that ignore armour.' },
};
SG.FOES = {
  grunt:   { name: 'Hollow Soldier', hp: 85, dmg: 8, rate: 1.1, range: 3.5, speed: 6, armour: 2, sprite: 'soldier', cost: 1 },
  hound:   { name: 'Shadow Hound', hp: 45, dmg: 6, rate: 0.7, range: 3, speed: 15, armour: 0, sprite: 'hound', cost: 0.8 },
  bowman:  { name: 'Hollow Bowman', hp: 50, dmg: 6, rate: 1.5, range: 40, speed: 6, armour: 1, sprite: 'h_bowman', ranged: true, proj: 'arrow', cost: 1.5 },
  acolyte: { name: 'Hollow Acolyte', hp: 65, heal: 12, rate: 2.0, range: 20, speed: 5, armour: 1, sprite: 'acolyte', healer: true, cost: 2 },
  ladder:  { name: 'Ladder crew', hp: 80, dmg: 5, rate: 1.2, range: 3, speed: 5.5, armour: 1, sprite: 'h_ladder', ladder: true, cost: 2 },
  ram:     { name: 'Battering Ram', hp: 420, dmg: 50, rate: 2.2, range: 3, speed: 3.2, armour: 7, large: true, sprite: 'ram', gateOnly: true, cost: 6 },
  brute:   { name: 'Hollow Brute', hp: 330, dmg: 22, rate: 1.4, range: 4.5, speed: 4.5, armour: 4, large: true, sprite: 'h_brute', cost: 5 },
  captain: { name: 'Hollow Captain', hp: 1500, dmg: 28, rate: 1.2, range: 5, speed: 4, armour: 6, large: true, boss: true, aura: true, sprite: 'warden', cost: 0 },
};
SG.POWERS = {
  bram:   { name: 'Rally', cd: 35, aim: false, desc: 'Every defender heals 35% and hits 40% harder for 8 seconds.' },
  wren:   { name: 'Arrow Storm', cd: 28, aim: true, r: 12, desc: 'Rains arrows over the spot you tap.' },
  isolde: { name: 'Ember Nova', cd: 32, aim: true, r: 13, desc: 'A blast of fire that leaves everything burning.' },
  hesk:   { name: 'Wild Hunt', cd: 40, aim: true, r: 6, desc: 'Three wolves charge in where you tap.' },
  aldric: { name: 'Oath of Iron', cd: 38, aim: false, desc: 'Every defender takes half damage for 7 seconds.' },
  morwen: { name: 'Mire', cd: 30, aim: true, r: 14, desc: 'The ground turns to bog. Everything there slows right down and rots.' },
  dace:   { name: 'Powder Keg', cd: 30, aim: true, r: 10, desc: 'A keg goes off after a moment. Wrecks rams and brutes.' },
};
SG.BUILDINGS = {
  barracks: { name: 'Barracks', desc: 'Drills the militia and trains new kinds of soldier.',
    levels: [
      { gold: 300, mats: { ore: 4 }, text: 'Spearmen and priests. Militia 15% tougher. More levy to start and faster levy.' },
      { gold: 700, mats: { ore: 6, bone: 4 }, text: 'Knights. Militia 30% tougher. More levy again.' },
    ] },
  walls: { name: 'Stone walls', desc: 'A stronger gate and towers beside it.',
    levels: [
      { gold: 350, mats: { ore: 6 }, text: 'Gate half as strong again. Two gate towers for ballistas.' },
      { gold: 800, mats: { ore: 8, moss: 4 }, text: 'Gate twice as strong. Burning oil scalds anything hitting the gate.' },
    ] },
};
// First time rewards for each night. Repeats pay gold and materials.
SG.MILESTONES = {
  1: { text: 'The survivors swear themselves to Emberwake. The barracks can be built.', gold: 150 },
  2: { tome: true },
  3: { gear: 'ashby_banner' },
  4: { gold: 400, mats: { shard: 3 } },
  5: { gear: 'emberwake_blade' },
  7: { tome: true },
  8: { gold: 900 },
  10: { gear: 'keepers_mantle' },
};
SG.MAX_NIGHT = 12;

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
      const g = [5, 6, 6][w], h = [1, 3, 3][w];
      for (let i = 0; i < g; i++) add('grunt', i * 1.6 + rng());
      for (let i = 0; i < h; i++) add('hound', 3 + i * 2 + rng());
      if (w === 2) { add('ladder', 2); add('ladder', 6); }
    } else {
      let budget = 12 + n * 2.6 + w * 3.5;
      const pool = ['grunt', 'grunt', 'hound'];
      if (w >= 1) pool.push('ladder');
      if (n >= 2) pool.push('bowman');
      if (n >= 4) pool.push('acolyte');
      if (n >= 5) pool.push('brute');
      let ram = n >= 3 && w >= 1 && rng() < 0.7, t = 0;
      if (ram) { add('ram', 4 + rng() * 3); budget -= SG.FOES.ram.cost; }
      const cap = { brute: 1 + Math.floor(n / 4), acolyte: 1 + Math.floor(n / 5), ladder: 2 + Math.floor(n / 4), bowman: 2 + Math.floor(n / 3) };
      const have = {};
      let guard = 0;
      while (budget > 0 && guard++ < 200) {
        const k = pool[Math.floor(rng() * pool.length)];
        if (cap[k] != null && (have[k] || 0) >= cap[k]) continue;
        have[k] = (have[k] || 0) + 1;
        add(k, t); t += 0.45 + rng() * 0.9;
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

class Siege {
  constructor(S, n, opts) {
    opts = opts || {};
    this.S = S; this.n = n; this.rng = opts.rng || Math.random;
    this.t = 0; this.phase = 'deploy';
    const b = S.buildings.barracks || 0, wl = S.buildings.walls || 0;
    this.levy = 30 + 8 * b + (S.flags && S.flags.penn_freed ? 5 : 0); this.regen = 0.7 + 0.2 * b; this.drill = 1 + 0.15 * b;
    const gateHp = 700 * [1, 1.5, 2.1][wl];
    this.gate = { hp: gateHp, max: gateHp, oil: wl >= 2 };
    this.keep = { hp: 900, max: 900 };
    this.waves = SG.night(n);
    this.wave = -1; this.waveT = 0; this.queue = []; this.breakT = 0;
    this.units = []; this.proj = []; this.ladders = []; this.delayed = []; this.fx = [];
    this.scale = { hp: 1.6 * (1 + 0.13 * (n - 1)), dmg: 1.3 * (1 + 0.085 * (n - 1)) };
    this.powers = {}; this.rally = 0;
    for (const id of S.party) this.powers[id] = { cd: 0 };
    this.placedHeroes = {};
    this.kills = 0; this.lost = 0;
  }
  // ----- placing -----
  unlocked(type) {
    const d = SG.UNITS[type];
    return !d.req || (this.S.buildings[d.req[0]] || 0) >= d.req[1];
  }
  meleeCount() { return this.units.filter(u => u.side === 'p' && !u.hero && !u.temp && (u.zone === 'field' || u.zone === 'yard') && u.hp > 0).length; }
  zoneAt(x, y) {
    if (y >= GEO.FIELD.y0 && y <= GEO.FIELD.y1 && x >= 4 && x <= 96) return 'field';
    if (y >= GEO.YARD.y0 && y <= GEO.YARD.y1 && x >= 6 && x <= 94) return 'yard';
    return null;
  }
  slotAt(x, y, tower) {
    if (Math.abs(y - (WALL_Y + 2)) > 9) return null;
    const list = tower ? (this.S.buildings.walls >= 1 ? GEO.TOWERS : []) : GEO.SLOTS;
    let best = null;
    for (const sx of list) {
      if (Math.abs(sx - x) > 6) continue;
      const taken = this.units.some(u => u.hp > 0 && u.side === 'p' && (u.zone === 'wall' || u.zone === 'tower') && u.x === sx);
      if (!taken && (!best || Math.abs(sx - x) < Math.abs(best - x))) best = sx;
    }
    return best;
  }
  canPlace(type, x, y) {
    const d = SG.UNITS[type];
    if (!d || !this.unlocked(type)) return 'Not trained yet.';
    if (this.levy < d.cost) return 'Not enough levy yet.';
    if (d.zone === 'wall' || d.zone === 'tower') {
      if (this.slotAt(x, y, d.zone === 'tower') == null) return d.zone === 'tower' ? 'Ballistas go on the gate towers.' : 'Archers need a free gold spot on the wall.';
      return null;
    }
    if (!this.zoneAt(x, y)) return 'Place soldiers in front of the wall or in the yard.';
    if (this.meleeCount() >= 16) return 'That\'s as many soldiers as you can field.';
    return null;
  }
  place(type, x, y) {
    const err = this.canPlace(type, x, y);
    if (err) return err;
    const d = SG.UNITS[type];
    this.levy -= d.cost;
    let zone = d.zone, px = x, py = y;
    if (zone === 'wall' || zone === 'tower') { px = this.slotAt(x, y, zone === 'tower'); py = WALL_Y + 2; }
    else zone = this.zoneAt(x, y);
    const k = type === 'ballista' ? 1 : this.drill;
    this.units.push(this.makeUnit('p', type, d, px, py, zone, { hp: d.hp * k, dmg: (d.dmg || 0) * k, heal: (d.heal || 0) * k }));
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
      gateOnly: !!d.gateOnly, boss: !!d.boss, aura: !!d.aura, atk: 0, hurt: 0,
      hero: over.hero || null, temp: over.temp || 0, respawn: 0,
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
        const pet = this.makeUnit('p', 'pet', { name: E.creatureName(c), sprite: E.creatureSprite(c), hp: cs.maxHp * 2, dmg: cs.str * 0.8, rate: 1.0, range: 3.5, speed: 14, armour: cs.def / 4 }, x + 4, y + 1, zone, {});
        this.units.push(pet);
      }
    }
    return null;
  }
  start() {
    const spots = [[50, 94], [41, 92], [59, 92], [35, 96], [65, 96]];
    let i = 0;
    for (const id of this.S.party) if (!this.placedHeroes[id] && this.S.heroes[id]) { const [x, y] = spots[i++ % spots.length]; this.placeHero(id, x, y); }
    this.phase = 'fight';
    this.nextWave();
  }
  nextWave() {
    this.wave++;
    this.waveT = 0;
    this.queue = this.waves[this.wave].slice();
    this.fx.push({ k: 'wave', n: this.wave + 1, of: this.waves.length });
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
    } else if (id === 'hesk') {
      const zone = y < WALL_Y ? 'field' : 'yard';
      const py = zone === 'field' ? clamp(y, GEO.FIELD.y0, GEO.FIELD.y1) : clamp(y, GEO.YARD.y0, GEO.YARD.y1);
      for (let i = 0; i < 3; i++) {
        const w = this.makeUnit('p', 'wolf', { name: 'Wolf', sprite: 'wolf', hp: 110 + st.str * 2, dmg: st.str * 0.5, rate: 0.8, range: 3, speed: 16, armour: 2 }, x + (i - 1) * 4, py, zone, { temp: 18 });
        this.units.push(w);
      }
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
    if (!o.pierce && !(src && src.pierce)) n = n * 10 / (10 + t.armour + (t.zone === 'wall' || t.zone === 'tower' ? 4 : 0));
    n *= 0.9 + this.rng() * 0.2;
    t.hp -= n; t.hurt = 0.15;
    this.fx.push({ k: 'hit', x: t.x, y: t.y - 2, side: t.side, power: !!o.power, n: Math.round(n), fire: !!o.fire });
    if (t.hp <= 0) this.kill(t);
  }
  kill(u) {
    u.hp = 0;
    this.fx.push({ k: 'die', x: u.x, y: u.y, side: u.side, large: u.large });
    if (u.side === 'e') { this.kills++; this.levy = Math.min(99, this.levy + (u.large ? 3 : 0.6)); }
    else if (u.hero) { u.respawn = 20; this.fx.push({ k: 'herodown', id: u.hero }); }
    else if (!u.temp) this.lost++;
  }
  breakLadder(l) {
    if (l.hp <= 0) return;
    l.hp = 0;
    this.fx.push({ k: 'ladderdown', x: l.x, y: WALL_Y });
    for (const u of this.units) if (u.side === 'e' && u.state === 'climb' && u.ladderRef === l) { u.state = 'move'; u.y = WALL_Y - 2; this.damage(null, u, 30, {}); }
  }
  hitGate(src) {
    let n = src.dmg * this.scaleDmg(src);
    this.gate.hp = Math.max(0, this.gate.hp - n);
    this.fx.push({ k: 'gatehit', big: src.large, x: src.x, y: WALL_Y });
    if (this.gate.oil) this.damage(null, src, 8 * src.rate, { pierce: true });
    if (this.gate.hp <= 0 && !this.gate.broken) { this.gate.broken = true; this.fx.push({ k: 'gatebroken' }); }
  }
  scaleDmg(u) { return u.side === 'e' ? 1 : 1; }
  shoot(src, t) {
    this.proj.push({ x: src.x, y: src.y - 3, t, kind: src.proj || 'arrow', src, dmg: src.dmg, splash: src.splash, speed: src.proj === 'bolt' ? 110 : src.proj === 'fire' ? 60 : 85 });
  }
  moveTo(u, x, y, dt) {
    const dx = x - u.x, dy = y - u.y, d = Math.hypot(dx, dy);
    if (d < 0.3) return true;
    let sp = u.speed * (u.slow > 0 ? 0.5 : 1) * dt;
    if (sp >= d) { u.x = x; u.y = y; return true; }
    u.x += dx / d * sp; u.y += dy / d * sp;
    if (Math.abs(dx) > 0.2) u.face = dx > 0 ? 1 : -1;
    return false;
  }
  enemiesAlive() { return this.units.some(u => u.side === 'e' && u.hp > 0) || this.queue.length > 0; }
  spawn(s) {
    const d = SG.FOES[s.t];
    const u = this.makeUnit('e', s.t, d, s.x, -2, 'field', { hp: d.hp * this.scale.hp, dmg: (d.dmg || 0) * this.scale.dmg, heal: (d.heal || 0) * this.scale.dmg });
    if (u.ladder) {
      let lx = s.x;
      if (Math.abs(lx - 50) < 12) lx = lx < 50 ? 50 - 13 - this.rng() * 20 : 50 + 13 + this.rng() * 20;
      u.goalX = clamp(lx, 6, 94);
    }
    this.units.push(u);
  }

  step(dt) {
    if (this.phase !== 'fight' && this.phase !== 'break') return;
    this.t += dt;
    this.levy = Math.min(99, this.levy + this.regen * dt);
    for (const id in this.powers) this.powers[id].cd = Math.max(0, this.powers[id].cd - dt);
    this.rally = Math.max(0, this.rally - dt);
    this.oath = Math.max(0, (this.oath || 0) - dt);
    if (this.phase === 'break') {
      this.breakT -= dt;
      if (this.breakT <= 0) { this.phase = 'fight'; this.nextWave(); }
    } else {
      this.waveT += dt;
      while (this.queue.length && this.queue[0].at <= this.waveT) this.spawn(this.queue.shift());
    }
    for (let i = this.delayed.length - 1; i >= 0; i--) {
      const d = this.delayed[i]; d.t -= dt;
      if (d.t <= 0) { this.delayed.splice(i, 1); d.fn(); }
    }
    for (const u of this.units) {
      if (u.hp <= 0) {
        if (u.hero && u.respawn > 0) {
          u.respawn -= dt;
          if (u.respawn <= 0) { u.hp = u.max * 0.6; u.x = GEO.KEEP.x; u.y = GEO.YARD.y1; u.state = 'move'; this.fx.push({ k: 'heroback', id: u.hero }); }
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
    // tidy
    this.units = this.units.filter(u => u.hp > 0 || (u.hero && u.respawn > 0));
    this.ladders = this.ladders.filter(l => l.hp > 0);
    if (this.keep.hp <= 0) { this.phase = 'lost'; this.fx.push({ k: 'lost' }); return; }
    if (this.phase === 'fight' && !this.enemiesAlive()) {
      if (this.wave >= this.waves.length - 1) { this.phase = 'won'; this.fx.push({ k: 'won' }); }
      else { this.phase = 'break'; this.breakT = 7; this.fx.push({ k: 'break', t: 7 }); }
    }
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
    // Healers mend the most hurt ally in reach.
    if (u.healer) {
      const hurt = this.units.filter(o => o.side === 'e' && o.hp > 0 && o !== u && o.hp < o.max * 0.85 && dist(o, u) <= u.range).sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
      if (hurt && u.cd <= 0) { hurt.hp = Math.min(hurt.max, hurt.hp + u.heal); u.cd = u.rate; this.fx.push({ k: 'heal', x: hurt.x, y: hurt.y, dark: true }); }
      const front = this.units.filter(o => o.side === 'e' && o.hp > 0 && o !== u && !o.healer).sort((a, b) => b.y - a.y)[0];
      const gy = front ? Math.max(4, front.y - 10) : WALL_Y - 18;
      this.moveTo(u, front ? front.x : 50, Math.min(gy, WALL_Y - 12), dt);
      return;
    }
    // Ranged: hold back and shoot.
    if (u.ranged) {
      const t = this.nearest(u, o => o.side === 'p' && o.hp > 0, u.range);
      if (t) { if (u.cd <= 0) { this.shoot(u, t); u.cd = u.rate; u.atk = 0.2; } u.face = t.x > u.x ? 1 : -1; return; }
      this.moveTo(u, u.x, Math.min(WALL_Y - 34, u.y + 20), dt);
      return;
    }
    // Melee: fight anything close on the same side of the wall.
    if (!u.gateOnly) {
      const aggro = u.type === 'hound' ? 10 : 7;
      const t = this.nearest(u, o => o.side === 'p' && o.hp > 0 && o.zone !== 'wall' && o.zone !== 'tower' && this.inside(o) === inside, aggro)
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
    // Outside the wall.
    if (this.gate.broken && !u.ladder) {
      if (Math.abs(u.x - 50) > 3.5 && u.y < WALL_Y - 4) this.moveTo(u, 50, WALL_Y - 4, dt);
      else this.moveTo(u, 50 + clamp(u.x - 50, -3, 3), YARD_Y + 3, dt);
      return;
    }
    if (u.ladder) {
      const near = this.ladders.find(l => Math.abs(l.x - u.goalX) < 8);
      if (near) u.goalX = near.x;
      if (this.moveTo(u, u.goalX, WALL_Y - 1.5, dt)) {
        if (near) { u.state = 'climb'; u.timer = 2.5; u.ladderRef = near; u.x = near.x; }
        else { u.state = 'plant'; u.timer = 3; }
      }
      return;
    }
    // Use a ladder if one is closer than the gate.
    if (!u.large) {
      const gateD = Math.hypot(u.x - 50, u.y - WALL_Y);
      const l = this.ladders.slice().sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
      if (l && Math.hypot(u.x - l.x, u.y - WALL_Y) < gateD - 4) {
        if (this.moveTo(u, l.x, WALL_Y - 1.5, dt)) { u.state = 'climb'; u.timer = 2.5; u.ladderRef = l; u.x = l.x; }
        return;
      }
    }
    const gx = 50 + clamp(u.x - 50, -5, 5), gy = WALL_Y - 2;
    if (this.moveTo(u, gx, gy, dt) || (u.y >= WALL_Y - 3.5 && Math.abs(u.x - 50) < 7)) {
      if (u.cd <= 0) { this.hitGate(u); u.cd = u.rate; u.atk = 0.25; }
    }
  }
  playerStep(u, dt) {
    if (u.zone === 'wall' || u.zone === 'tower') {
      const t = u.type === 'ballista'
        ? this.units.filter(o => o.side === 'e' && o.hp > 0 && o.state !== 'climb' && dist(o, u) <= u.range).sort((a, b) => b.hp - a.hp)[0]
        : this.nearest(u, o => o.side === 'e' && o.hp > 0, u.range);
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
    const g = this.units.filter(u => u.hp > 0 && u.zone !== 'wall' && u.zone !== 'tower' && u.state !== 'climb' && u.state !== 'plant');
    for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) {
      const a = g[i], b = g[j], r = (a.large || b.large) ? 4.2 : 2.6;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
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
    }
  }
  stepProj(dt) {
    for (const p of this.proj) {
      const tx = p.t.x, ty = p.t.y - 2;
      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), sp = p.speed * dt;
      p.ang = Math.atan2(dy, dx);
      if (d <= sp || p.t.hp <= 0) {
        p.done = true;
        if (p.t.hp > 0 || p.splash) {
          if (p.splash) {
            this.fx.push({ k: p.kind === 'fire' ? 'boom' : 'spark', x: tx, y: ty, r: p.splash, fire: p.kind === 'fire', small: true });
            for (const u of this.units) if (u.side !== p.src.side && u.hp > 0 && Math.hypot(u.x - tx, u.y - ty) <= p.splash) this.damage(p.src, u, u === p.t ? p.dmg : p.dmg * 0.6, { fire: p.kind === 'fire' });
          } else this.damage(p.src, p.t, p.dmg, {});
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

// Applies rewards after a won night. Returns what was given.
SG.reward = function (S, n, stars) {
  S.siege = S.siege || { best: 0, stars: {} };
  const first = n > S.siege.best;
  const out = { first, got: [] };
  S.siege.stars[n] = Math.max(S.siege.stars[n] || 0, stars);
  if (first) {
    S.siege.best = n;
    const m = SG.MILESTONES[n];
    if (m) {
      if (m.gear) {
        if (!D.GEAR[m.gear]) throw new Error('missing gear ' + m.gear);
      }
      out.got = out.got.concat(E.applyReward(S, m));
      out.gearUid = m._uid; delete m._uid;
      if (m.text) out.text = m.text;
    }
  }
  const gold = 60 + 35 * n, mats = { ore: 1 + Math.floor(n / 3), shard: n >= 3 ? Math.ceil(n / 3) : 0 };
  if (!mats.shard) delete mats.shard;
  out.got = out.got.concat(E.applyReward(S, { gold: first ? gold : Math.round(gold * 0.6), mats }));
  return out;
};

if (typeof module !== 'undefined' && module.exports) module.exports = SG; else root.SIEGE = SG;
})(this);
