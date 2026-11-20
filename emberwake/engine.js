// Emberwake engine: game rules with no DOM, so it also runs in node for balance tests.
(function (root) {
'use strict';
const D = root.DATA || require('./data.js');
const E = {};

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
E.clamp = clamp;
E.xpNext = L => Math.round(20 * Math.pow(L, 1.85) + 10);
E.MASTERY = [5, 15, 35, 70];
E.masteryLevel = uses => E.MASTERY.filter(n => (uses || 0) >= n).length;
E.masteryMult = uses => 1 + 0.1 * E.masteryLevel(uses);

// ---------- New game and save helpers ----------
E.newGame = function () {
  const S = {
    v: 1, gold: 120, bag: { potion: 4, antidote: 2, ether: 1 }, mats: {}, gear: [], nextUid: 1,
    heroes: {}, areas: {}, unlocked: 1, shopTier: 1,
    flags: { seen: {}, got: {} }, stats: { battles: 0, wins: 0, steps: 0 },
    opts: { speed: 1 },
  };
  for (const id of D.PARTY) {
    const def = D.HEROES[id];
    const h = { lvl: 1, xp: 0, hp: 0, mp: 0, talents: Object.assign({}, def.start.talents), points: 1, equip: { weapon: null, armour: null, charm: null }, mastery: {} };
    S.heroes[id] = h;
    for (const slot in def.start.equip) h.equip[slot] = E.addGear(S, def.start.equip[slot]).uid;
  }
  for (const a of D.AREAS) S.areas[a.id] = { progress: 0, cleared: false, found: {} };
  E.restParty(S);
  return S;
};

E.addGear = function (S, id, plus) {
  const g = { uid: S.nextUid++, id, plus: plus || 0 };
  S.gear.push(g);
  return g;
};
E.gearOf = (S, uid) => S.gear.find(g => g.uid === uid) || null;
E.gearStats = function (g) {
  const def = D.GEAR[g.id], out = {};
  for (const k in (def.stats || {})) {
    const b = def.stats[k];
    out[k] = b < 0 ? b : b + Math.ceil(b * 0.15 * g.plus);
  }
  return out;
};
E.gearName = g => D.GEAR[g.id].name + (g.plus ? ' +' + g.plus : '');
E.equippedBy = function (S, uid) {
  for (const id of D.PARTY) for (const s in S.heroes[id].equip) if (S.heroes[id].equip[s] === uid) return id;
  return null;
};

// ---------- Hero stats ----------
E.heroStats = function (S, id) {
  const h = S.heroes[id], def = D.HEROES[id], L = h.lvl;
  const st = {}, flags = { immune: [] }, skills = ['attack'];
  for (const k of D.STATS) st[k] = def.base[k] + def.growth[k] * (L - 1);
  const addFlags = f => {
    for (const k in f) {
      if (k === 'immune') flags.immune = flags.immune.concat(f.immune);
      else flags[k] = (flags[k] || 0) + f[k];
    }
  };
  for (const tree in h.talents) {
    const ranks = D.TREES[tree].ranks;
    for (let r = 0; r < h.talents[tree]; r++) {
      const rk = ranks[r];
      if (rk.skill) skills.push(rk.skill);
      if (rk.stats) for (const k in rk.stats) st[k] += rk.stats[k];
      if (rk.flags) addFlags(rk.flags);
    }
  }
  for (const slot of ['weapon', 'armour', 'charm']) {
    const g = E.gearOf(S, h.equip[slot]);
    if (!g) continue;
    const gs = E.gearStats(g);
    for (const k in gs) st[k] += gs[k];
    if (D.GEAR[g.id].flags) addFlags(D.GEAR[g.id].flags);
  }
  for (const k of D.STATS) st[k] = Math.max(k === 'hp' ? 1 : 0, Math.floor(st[k]));
  st.maxHp = st.hp; st.maxMp = st.mp; delete st.hp; delete st.mp;
  st.flags = flags; st.skills = skills;
  return st;
};

E.restParty = function (S) {
  for (const id of D.PARTY) {
    const st = E.heroStats(S, id);
    S.heroes[id].hp = st.maxHp;
    S.heroes[id].mp = st.maxMp;
  }
};
E.clampParty = function (S) {
  for (const id of D.PARTY) {
    const st = E.heroStats(S, id), h = S.heroes[id];
    h.hp = clamp(h.hp, 0, st.maxHp); h.mp = clamp(h.mp, 0, st.maxMp);
  }
};

// ---------- Talents ----------
E.talentNext = function (S, id, tree) {
  const h = S.heroes[id], r = h.talents[tree] || 0;
  if (r >= 6) return { max: true };
  return { rank: r, cost: D.TALENT_COST[r], req: D.TALENT_REQ[r], ok: h.lvl >= D.TALENT_REQ[r] && h.points >= D.TALENT_COST[r] };
};
E.learnTalent = function (S, id, tree) {
  const n = E.talentNext(S, id, tree);
  if (!n.ok) return false;
  const h = S.heroes[id], before = E.heroStats(S, id);
  h.points -= n.cost;
  h.talents[tree] = n.rank + 1;
  const after = E.heroStats(S, id);
  h.hp += Math.max(0, after.maxHp - before.maxHp);
  h.mp += Math.max(0, after.maxMp - before.maxMp);
  return true;
};

// ---------- Equipment ----------
E.equip = function (S, id, slot, uid) {
  const before = E.heroStats(S, id);
  if (uid != null) {
    const other = E.equippedBy(S, uid);
    if (other) for (const s in S.heroes[other].equip) if (S.heroes[other].equip[s] === uid) S.heroes[other].equip[s] = null;
  }
  S.heroes[id].equip[slot] = uid;
  const after = E.heroStats(S, id), h = S.heroes[id];
  h.hp += Math.max(0, after.maxHp - before.maxHp);
  h.mp += Math.max(0, after.maxMp - before.maxMp);
  E.clampParty(S);
};
E.forgeCost = g => (g.plus >= 5 ? null : D.FORGE[g.plus]);
E.canForge = function (S, g) {
  const c = E.forgeCost(g);
  if (!c) return false;
  if (S.gold < c.gold) return false;
  for (const m in c.mats) if ((S.mats[m] || 0) < c.mats[m]) return false;
  return true;
};
E.forge = function (S, uid) {
  const g = E.gearOf(S, uid);
  if (!g || !E.canForge(S, g)) return false;
  const c = E.forgeCost(g);
  S.gold -= c.gold;
  for (const m in c.mats) S.mats[m] -= c.mats[m];
  g.plus++;
  E.clampParty(S);
  return true;
};
E.sellPrice = g => Math.floor(D.GEAR[g.id].price * 0.4 * (1 + 0.3 * g.plus));

// ---------- Exploring ----------
E.areaIndex = id => D.AREAS.findIndex(a => a.id === id);
E.encounter = function (area, st, rng) {
  rng = rng || Math.random;
  let n = area.size[0] + Math.floor(rng() * (area.size[1] - area.size[0] + 1));
  if (!st.cleared && st.progress < 2) n = Math.min(n, area.size[0] + 1);
  const span = area.lvl[1] - area.lvl[0];
  const base = st.cleared ? area.lvl[1] : area.lvl[0] + span * st.progress / area.steps;
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = area.pool[Math.floor(rng() * area.pool.length)];
    const lvl = clamp(Math.round(base + rng() - 0.5), area.lvl[0], area.lvl[1] + (st.cleared ? 1 : 0));
    out.push({ t, lvl });
  }
  return out;
};

// One step along an area's path. Returns what happened; battles are run by the caller.
E.explore = function (S, areaId, rng) {
  rng = rng || Math.random;
  const area = D.AREAS[E.areaIndex(areaId)], st = S.areas[areaId];
  S.stats.steps++;
  if (!st.cleared && st.progress >= area.steps) return { type: 'boss' };
  const next = st.progress + 1;
  if (!st.cleared && area.unique[next] && !st.found[next]) {
    st.found[next] = true; st.progress = next;
    const u = area.unique[next];
    if (u.tome) { for (const id of D.PARTY) S.heroes[id].points += 1; return { type: 'tome' }; }
    if (u.gear) { E.addGear(S, u.gear); S.flags.got[u.gear] = true; return { type: 'unique', gear: u.gear }; }
  }
  const r = rng();
  const advance = () => { if (!st.cleared) st.progress = next; };
  if (r < 0.64) return { type: 'battle', enemies: E.encounter(area, st, rng), advance: !st.cleared };
  const L = area.lvl[0];
  if (r < 0.78) {
    advance();
    const roll = rng();
    if (roll < 0.45) { const g = Math.round((20 + 12 * L) * (0.7 + rng() * 0.6)); S.gold += g; return { type: 'treasure', gold: g }; }
    const pool = ['potion', 'potion', 'ether', 'antidote'];
    if (S.shopTier >= 2) pool.push('hi_potion', 'firebomb');
    if (rng() < 0.15) pool.push('feather');
    const it = pool[Math.floor(rng() * pool.length)];
    S.bag[it] = (S.bag[it] || 0) + 1;
    return { type: 'treasure', item: it };
  }
  if (r < 0.92) {
    advance();
    const n = 1 + Math.floor(rng() * 2);
    S.mats[area.mat] = (S.mats[area.mat] || 0) + n;
    return { type: 'gather', mat: area.mat, n };
  }
  advance();
  for (const id of D.PARTY) {
    const h = S.heroes[id], hs = E.heroStats(S, id);
    if (h.hp > 0) { h.hp = Math.min(hs.maxHp, h.hp + Math.round(hs.maxHp * 0.3)); h.mp = Math.min(hs.maxMp, h.mp + Math.round(hs.maxMp * 0.3)); }
  }
  return { type: 'camp' };
};

E.bossSpecs = area => area.boss.map(b => ({ t: b.t, lvl: b.lvl }));

// ---------- Battle ----------
function enemyStats(tpl, L) {
  const m = tpl.m;
  return {
    maxHp: Math.round(m.hp * (36 + 19 * L)),
    str: m.str * (8 + 2.9 * L), mag: m.mag * (8 + 2.9 * L),
    def: m.def * (4 + 2.2 * L), res: m.res * (4 + 2.2 * L),
    spd: m.spd * (8 + 0.8 * L), crit: 5,
  };
}

class Battle {
  constructor(S, specs, opts) {
    opts = opts || {};
    this.S = S; this.boss = !!opts.boss; this.rng = opts.rng || Math.random; this.opts = opts;
    this.heroes = D.PARTY.map((id, i) => this.makeHero(id, i));
    this.enemies = [];
    this.letters = {};
    for (const sp of specs) this.addEnemy(sp.t, sp.lvl);
    this.renameEnemies();
    this.over = false; this.won = false; this.fled = false; this.turns = 0; this.uses = {}; this.dead = [];
    for (const a of this.all()) a.gauge = this.rng() * 40 + (a.flags && a.flags.firstStrike ? 50 : 0);
  }
  makeHero(id, i) {
    const st = E.heroStats(this.S, id), h = this.S.heroes[id];
    return Object.assign(st, { side: 'h', id, key: 'h' + i, name: D.HEROES[id].name, sprite: D.HEROES[id].sprite, lvl: h.lvl,
      hp: clamp(h.hp, 0, st.maxHp), mp: clamp(h.mp, 0, st.maxMp), statuses: {}, gauge: 0, weak: {} });
  }
  addEnemy(t, lvl) {
    const tpl = D.ENEMIES[t], st = enemyStats(tpl, lvl);
    const a = Object.assign(st, { side: 'e', t, tpl, key: 'e' + (this.enemies.length), name: tpl.name, sprite: tpl.sprite, lvl,
      hp: st.maxHp, mp: 999, maxMp: 999, statuses: {}, gauge: this.rng() * 30, weak: tpl.weak || {}, flags: { immune: [] },
      isBoss: !!tpl.boss, used: {}, base: tpl.name });
    this.enemies.push(a);
    return a;
  }
  renameEnemies() {
    const counts = {};
    for (const e of this.enemies) counts[e.base] = (counts[e.base] || 0) + 1;
    for (const e of this.enemies) {
      if (counts[e.base] > 1 && !e.lettered) {
        this.letters[e.base] = (this.letters[e.base] || 0) + 1;
        e.name = e.base + ' ' + String.fromCharCode(64 + this.letters[e.base]);
        e.lettered = true;
      }
    }
  }
  all() { return this.heroes.concat(this.enemies); }
  alive(list) { return list.filter(a => a.hp > 0); }
  foes(a) { return a.side === 'h' ? this.enemies : this.heroes; }
  friends(a) { return a.side === 'h' ? this.heroes : this.enemies; }

  stat(a, k) {
    let v = a[k], s = a.statuses;
    if (k === 'str' && s.strUp) v *= 1.3;
    if (k === 'def') { if (s.defUp) v *= 1.5; if (s.defDown) v *= 0.6; }
    if (k === 'res' && s.resUp) v *= 1.5;
    return v;
  }
  rate(a) {
    let r = (a.spd + 20);
    if (a.statuses.slow) r *= 0.5;
    if (a.statuses.haste) r *= 1.6;
    return r;
  }
  // Moves time forward until someone is ready. Returns that actor.
  advance() {
    const live = this.alive(this.all());
    let dt = Infinity;
    for (const a of live) dt = Math.min(dt, Math.max(0, (100 - a.gauge) / this.rate(a)));
    for (const a of live) a.gauge = Math.min(100, a.gauge + this.rate(a) * dt);
    const ready = live.filter(a => a.gauge >= 99.999).sort((x, y) => y.spd - x.spd);
    return ready[0];
  }
  mpCost(a, sk) {
    let c = sk.mp || 0;
    if (a.side === 'h' && a.flags.mpCut) c = Math.ceil(c * (1 - a.flags.mpCut));
    return c;
  }
  startTurn(a) {
    const ev = [];
    a.defending = false;
    const s = a.statuses;
    const tickDmg = (pct, label) => {
      const n = Math.max(1, Math.round(a.maxHp * (a.isBoss ? pct / 2.5 : pct)));
      a.hp = Math.max(0, a.hp - n);
      ev.push({ t: 'dmg', who: a, n, dot: label });
    };
    if (s.poison) tickDmg(0.07, 'poison');
    if (s.burn && a.hp > 0) tickDmg(0.06, 'burn');
    if (s.regen && a.hp > 0) { const n = Math.round(a.maxHp * 0.08); a.hp = Math.min(a.maxHp, a.hp + n); ev.push({ t: 'heal', who: a, n }); }
    for (const k of Object.keys(s)) {
      s[k]--;
      if (s[k] <= 0) { delete s[k]; ev.push({ t: 'off', who: a, s: k }); }
    }
    if (a.hp <= 0) this.ko(a, ev);
    this.check();
    return ev;
  }
  ko(a, ev) {
    a.hp = 0; a.statuses = {}; a.gauge = 0; a.defending = false;
    ev.push({ t: 'ko', who: a });
    if (a.side === 'e' && !this.dead.includes(a)) this.dead.push(a);
  }
  check() {
    if (this.over) return;
    if (!this.alive(this.enemies).length) { this.over = true; this.won = true; }
    else if (!this.alive(this.heroes).length) { this.over = true; this.won = false; }
  }
  addStatus(t, s, dur, ev) {
    if (t.hp <= 0) return;
    if (t.flags && t.flags.immune && t.flags.immune.includes(s)) { ev.push({ t: 'immune', who: t, s }); return; }
    t.statuses[s] = Math.max(t.statuses[s] || 0, dur);
    ev.push({ t: 'status', who: t, s });
  }
  calc(a, t, sk, mult) {
    const phys = sk.type === 'phys';
    const A = phys ? this.stat(a, 'str') : this.stat(a, 'mag');
    const Df = phys ? this.stat(t, 'def') : this.stat(t, 'res');
    let n = sk.power * A * (phys ? 2.2 : 2.6) * 60 / (60 + Df) * (mult || 1);
    let el = 1;
    if (sk.el && t.weak[sk.el] != null) el = t.weak[sk.el];
    n *= el;
    if (a.flags && sk.el && a.flags['boost_' + sk.el]) n *= 1 + a.flags['boost_' + sk.el];
    let crit = false;
    if (phys && this.rng() * 100 < a.crit) { crit = true; n *= 1.6; }
    n *= 0.9 + this.rng() * 0.2;
    if (t.flags && t.flags.bulwark) n *= 1 - t.flags.bulwark;
    if (t.defending) n *= 0.5;
    return { n: Math.max(1, Math.round(n)), crit, weak: el > 1, resist: el < 1 };
  }
  // Expected damage without randomness, used by the auto battler.
  expect(a, t, sk, mult) {
    const phys = sk.type === 'phys';
    const A = phys ? this.stat(a, 'str') : this.stat(a, 'mag');
    const Df = phys ? this.stat(t, 'def') : this.stat(t, 'res');
    let n = sk.power * (sk.hits || 1) * A * (phys ? 2.2 : 2.6) * 60 / (60 + Df) * (mult || 1);
    if (sk.el && t.weak[sk.el] != null) n *= t.weak[sk.el];
    if (a.flags && sk.el && a.flags['boost_' + sk.el]) n *= 1 + a.flags['boost_' + sk.el];
    if (phys) n *= 1 + 0.6 * a.crit / 100;
    return Math.min(n, t.hp);
  }
  hit(a, t, sk, mult, ev, noCounter) {
    if (t.hp <= 0) return;
    const r = this.calc(a, t, sk, mult);
    t.hp = Math.max(0, t.hp - r.n);
    ev.push({ t: 'dmg', who: t, n: r.n, crit: r.crit, weak: r.weak, resist: r.resist });
    if (sk.drain && a.hp > 0) { const h = Math.round(r.n * sk.drain); a.hp = Math.min(a.maxHp, a.hp + h); ev.push({ t: 'heal', who: a, n: h }); }
    if (t.hp <= 0) { this.ko(t, ev); return; }
    if (sk.status && this.rng() < (sk.chance == null ? 1 : sk.chance)) for (const s in sk.status) this.addStatus(t, s, sk.status[s], ev);
    if (sk.el === 'fire' && a.flags && a.flags.burnChance && this.rng() < a.flags.burnChance) this.addStatus(t, 'burn', 3, ev);
    if (!noCounter && sk.type === 'phys' && t.side === 'h' && t.flags.counter && a.hp > 0 && this.rng() < t.flags.counter) {
      ev.push({ t: 'say', text: t.name + ' counters!' });
      this.hit(t, a, D.SKILLS.attack, 1, ev, true);
    }
  }
  healAmount(a, sk, mult) {
    let n = sk.power * (this.stat(a, 'mag') * 2.2 + 15) * (mult || 1);
    if (a.flags && a.flags.healBoost) n *= 1 + a.flags.healBoost;
    return Math.round(n * (0.95 + this.rng() * 0.1));
  }
  targetsFor(a, kind, chosen) {
    const foes = this.alive(this.foes(a)), friends = this.friends(a);
    switch (kind) {
      case 'enemy': return chosen && chosen.hp > 0 && foes.includes(chosen) ? [chosen] : foes.length ? [foes[Math.floor(this.rng() * foes.length)]] : [];
      case 'enemies': return foes;
      case 'ally': {
        if (chosen && chosen.hp > 0 && friends.includes(chosen)) return [chosen];
        const live = this.alive(friends).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp);
        return live.slice(0, 1);
      }
      case 'allies': return this.alive(friends);
      case 'self': return [a];
      case 'deadAlly': {
        if (chosen && chosen.hp <= 0 && friends.includes(chosen)) return [chosen];
        return friends.filter(f => f.hp <= 0).slice(0, 1);
      }
      default: return [];
    }
  }
  // choice: { kind: 'skill'|'item'|'defend'|'flee', id, target }
  act(a, c) {
    const ev = [];
    a.gauge = 0; this.turns++;
    if (a.hp <= 0) return ev;
    if (c.kind === 'defend') { a.defending = true; ev.push({ t: 'say', text: a.name + ' braces' }); return ev; }
    if (c.kind === 'flee') {
      if (this.boss) { ev.push({ t: 'say', text: 'No running from this one' }); return ev; }
      const hs = this.alive(this.heroes), es = this.alive(this.enemies);
      const avg = l => l.reduce((s, x) => s + x.spd, 0) / Math.max(1, l.length);
      const p = clamp(0.5 + (avg(hs) - avg(es)) * 0.03, 0.25, 0.9);
      if (this.rng() < p) { this.over = true; this.fled = true; ev.push({ t: 'say', text: 'Got away' }); }
      else ev.push({ t: 'say', text: 'Couldn\'t get away' });
      return ev;
    }
    if (c.kind === 'item') return this.useItem(a, c, ev);
    const sk = D.SKILLS[c.id];
    const cost = this.mpCost(a, sk);
    if (a.mp < cost) { ev.push({ t: 'say', text: 'Not enough MP' }); return ev; }
    a.mp -= cost;
    if (c.id !== 'attack') ev.push({ t: 'say', text: sk.name, who: a });
    let mult = 1;
    if (a.side === 'h' && c.id !== 'attack') {
      const S = this.S, h = S.heroes[a.id];
      const before = E.masteryLevel(h.mastery[c.id]);
      h.mastery[c.id] = (h.mastery[c.id] || 0) + 1;
      const after = E.masteryLevel(h.mastery[c.id]);
      mult = E.masteryMult(h.mastery[c.id] - 1);
      if (after > before) ev.push({ t: 'mastery', who: a, skill: c.id, lvl: after });
    }
    if (sk.type === 'summon') {
      const room = 4 - this.alive(this.enemies).length;
      for (const t of sk.summon.slice(0, Math.max(0, room))) {
        const e = this.addEnemy(t, Math.max(1, a.lvl - 2));
        ev.push({ t: 'summon', who: e });
      }
      this.renameEnemies();
      return ev;
    }
    const targets = this.targetsFor(a, sk.target, c.target);
    for (const t of targets) {
      if (sk.type === 'phys' || sk.type === 'mag') {
        for (let i = 0; i < (sk.hits || 1); i++) this.hit(a, t, sk, mult, ev);
      } else if (sk.type === 'heal') {
        if (t.hp <= 0) continue;
        const n = sk.pct ? Math.round(t.maxHp * sk.pct) : this.healAmount(a, sk, mult);
        t.hp = Math.min(t.maxHp, t.hp + n);
        ev.push({ t: 'heal', who: t, n });
        if (sk.status) for (const s in sk.status) this.addStatus(t, s, sk.status[s], ev);
      } else if (sk.type === 'revive') {
        if (t.hp > 0) continue;
        t.hp = Math.max(1, Math.round(t.maxHp * sk.pct));
        ev.push({ t: 'revive', who: t, n: t.hp });
      } else if (sk.type === 'buff') {
        for (const s in sk.status) this.addStatus(t, s, sk.status[s], ev);
      }
    }
    this.check();
    return ev;
  }
  useItem(a, c, ev) {
    const it = D.ITEMS[c.id], bag = this.S.bag;
    if (!bag[c.id]) { ev.push({ t: 'say', text: 'None left' }); return ev; }
    bag[c.id]--;
    ev.push({ t: 'say', text: it.name, who: a });
    if (it.flee) {
      if (this.boss) { ev.push({ t: 'say', text: 'The smoke does nothing here' }); return ev; }
      this.over = true; this.fled = true; ev.push({ t: 'say', text: 'Got away' }); return ev;
    }
    if (it.bomb) {
      for (const t of this.alive(this.enemies)) {
        let n = it.bomb * (t.weak[it.el] || 1) * (0.9 + this.rng() * 0.2);
        n = Math.round(n);
        t.hp = Math.max(0, t.hp - n);
        ev.push({ t: 'dmg', who: t, n, weak: (t.weak[it.el] || 1) > 1 });
        if (t.hp <= 0) this.ko(t, ev);
      }
      this.check();
      return ev;
    }
    const t = this.targetsFor(a, it.target, c.target)[0];
    if (!t) return ev;
    if (it.revive) { if (t.hp <= 0) { t.hp = Math.max(1, Math.round(t.maxHp * it.revive)); ev.push({ t: 'revive', who: t, n: t.hp }); } }
    if (it.heal && t.hp > 0) { const n = Math.min(it.heal, t.maxHp - t.hp); t.hp += n; ev.push({ t: 'heal', who: t, n }); }
    if (it.mpHeal && t.hp > 0) { const n = Math.min(it.mpHeal, t.maxMp - t.mp); t.mp += n; ev.push({ t: 'mp', who: t, n }); }
    if (it.cure) for (const s of it.cure) if (t.statuses[s]) { delete t.statuses[s]; ev.push({ t: 'off', who: t, s }); }
    return ev;
  }
  // Enemy decision.
  enemyChoice(e) {
    const tpl = e.tpl;
    for (const s of tpl.skills) {
      if (s.phase && !e.used[s.id] && e.hp / e.maxHp <= s.phase) { e.used[s.id] = true; return this.withTarget(e, s.id); }
    }
    const allies = this.alive(this.enemies);
    const ok = tpl.skills.filter(s => s.w > 0 && (
      s.when !== 'allyHurt' || allies.some(x => x.hp / x.maxHp < 0.6)) &&
      (D.SKILLS[s.id].type !== 'summon' || allies.length < 4));
    let total = ok.reduce((x, s) => x + s.w, 0), r = this.rng() * total;
    let pick = ok[0];
    for (const s of ok) { r -= s.w; if (r <= 0) { pick = s; break; } }
    return this.withTarget(e, pick.id);
  }
  withTarget(e, id) {
    const sk = D.SKILLS[id];
    let target = null;
    if (sk.target === 'enemy') {
      const hs = this.alive(this.heroes);
      const taunt = hs.filter(h => h.statuses.taunt);
      if (taunt.length && this.rng() < 0.75) target = taunt[0];
      else target = hs[Math.floor(this.rng() * hs.length)];
    }
    return { kind: 'skill', id, target };
  }
  // Simple, sensible choices for the Auto button and balance tests.
  autoChoice(a) {
    const S = this.S;
    const friends = this.heroes, live = this.alive(friends), foes = this.alive(this.enemies);
    const can = id => a.skills.includes(id) && a.mp >= this.mpCost(a, D.SKILLS[id]);
    const dead = friends.filter(f => f.hp <= 0);
    if (dead.length && can('raise')) return { kind: 'skill', id: 'raise', target: dead[0] };
    if (dead.length && S.bag.feather && this.opts.autoItems) return { kind: 'item', id: 'feather', target: dead[0] };
    const hurt = live.filter(f => f.hp / f.maxHp < 0.45);
    if (hurt.length >= 2 && can('sanctuary')) return { kind: 'skill', id: 'sanctuary' };
    if (hurt.length >= 2 && can('mass_heal')) return { kind: 'skill', id: 'mass_heal' };
    if (hurt.length && can('heal')) return { kind: 'skill', id: 'heal', target: hurt.sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0] };
    if (a.hp / a.maxHp < 0.35 && can('second_wind')) return { kind: 'skill', id: 'second_wind' };
    if (hurt.length && this.opts.autoItems) {
      const t = hurt.sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
      if (t.hp / t.maxHp < 0.3) {
        if (S.bag.hi_potion && t.maxHp - t.hp > 120) return { kind: 'item', id: 'hi_potion', target: t };
        if (S.bag.potion) return { kind: 'item', id: 'potion', target: t };
      }
    }
    // Damage: best expected total, saving MP unless it's a boss or the party has plenty.
    const thrifty = !this.boss && a.mp < a.maxMp * 0.35;
    let best = { kind: 'skill', id: 'attack', target: foes[0] }, bestV = -1;
    for (const id of a.skills) {
      const sk = D.SKILLS[id];
      if (!(sk.type === 'phys' || sk.type === 'mag')) continue;
      if (!can(id)) continue;
      if (thrifty && sk.mp) continue;
      const mult = E.masteryMult(S.heroes[a.id].mastery[id]);
      if (sk.target === 'enemies') {
        const v = foes.reduce((s, t) => s + this.expect(a, t, sk, mult), 0) - (sk.mp || 0) * 1.5;
        if (v > bestV) { bestV = v; best = { kind: 'skill', id }; }
      } else {
        for (const t of foes) {
          let v = this.expect(a, t, sk, mult) - (sk.mp || 0) * 1.5;
          if (sk.status && sk.status.poison && !t.statuses.poison) v += t.maxHp * 0.07 * 2;
          if (v > bestV) { bestV = v; best = { kind: 'skill', id, target: t }; }
        }
      }
    }
    if (this.boss && can('shield_wall') && !a.statuses.defUp && this.rng() < 0.25) return { kind: 'skill', id: 'shield_wall' };
    return best;
  }
}
E.Battle = Battle;

// Writes the battle back to the save and works out rewards.
E.finishBattle = function (S, B) {
  for (const h of B.heroes) { S.heroes[h.id].hp = h.hp; S.heroes[h.id].mp = h.mp; }
  S.stats.battles++;
  const out = { won: B.won, fled: B.fled, xp: 0, gold: 0, mats: {}, items: {}, gear: [], levels: {} };
  if (!B.won) return out;
  S.stats.wins++;
  const rng = B.rng;
  let xp = 0, gold = 0, lsum = 0;
  for (const e of B.dead) {
    xp += e.tpl.xp * (8 + 5 * e.lvl);
    gold += e.tpl.gold * (5 + 3 * e.lvl);
    lsum += e.lvl;
    for (const d of (e.tpl.drops || [])) {
      if (rng() >= d.c) continue;
      if (d.mat) out.mats[d.mat] = (out.mats[d.mat] || 0) + (d.n || 1);
      if (d.item) out.items[d.item] = (out.items[d.item] || 0) + 1;
      if (d.gear && !(d.once && S.flags.got[d.gear])) { out.gear.push(d.gear); S.flags.got[d.gear] = true; }
    }
  }
  const avgL = lsum / Math.max(1, B.dead.length);
  const goldBonus = Math.max(0, ...B.heroes.map(h => h.flags.goldBonus || 0));
  out.gold = Math.round(gold * (1 + goldBonus));
  S.gold += out.gold;
  for (const m in out.mats) S.mats[m] = (S.mats[m] || 0) + out.mats[m];
  for (const i in out.items) S.bag[i] = (S.bag[i] || 0) + out.items[i];
  for (const g of out.gear) E.addGear(S, g);
  out.xp = Math.round(xp);
  out.heroXp = {};
  for (const h of B.heroes) {
    if (h.hp <= 0) continue;
    const hs = S.heroes[h.id];
    const f = clamp(1 + 0.12 * (avgL - hs.lvl), 0.2, 1.5) * (1 + (h.flags.xpBonus || 0));
    const gain = Math.max(1, Math.round(xp * f));
    out.heroXp[h.id] = gain;
    const lv = E.gainXp(S, h.id, gain);
    if (lv) out.levels[h.id] = lv;
  }
  return out;
};

E.gainXp = function (S, id, n) {
  const h = S.heroes[id];
  let ups = 0;
  h.xp += n;
  while (h.xp >= E.xpNext(h.lvl)) {
    const before = E.heroStats(S, id);
    h.xp -= E.xpNext(h.lvl); h.lvl++; h.points += 2; ups++;
    const after = E.heroStats(S, id);
    if (h.hp > 0) h.hp += after.maxHp - before.maxHp;
    h.mp += after.maxMp - before.maxMp;
  }
  return ups;
};

E.defeatPenalty = function (S) {
  const lost = Math.floor(S.gold * 0.1);
  S.gold -= lost;
  E.restParty(S);
  return lost;
};

// Called after a boss win: unlocks the next area and shop tiers.
E.clearArea = function (S, areaId) {
  const i = E.areaIndex(areaId), st = S.areas[areaId];
  st.cleared = true; st.progress = D.AREAS[i].steps;
  S.unlocked = Math.max(S.unlocked, Math.min(D.AREAS.length, i + 2));
  if (areaId === 'millroad') S.shopTier = Math.max(S.shopTier, 2);
  if (areaId === 'barrows') S.shopTier = Math.max(S.shopTier, 3);
};

// Out of battle item use.
E.fieldItem = function (S, itemId, heroId) {
  const it = D.ITEMS[itemId];
  if (!S.bag[itemId] || it.bomb || it.flee) return false;
  if (it.partyHeal) {
    for (const id of D.PARTY) {
      const h = S.heroes[id], hs = E.heroStats(S, id);
      if (h.hp > 0) { h.hp = Math.min(hs.maxHp, h.hp + Math.round(hs.maxHp * it.partyHeal)); }
      h.mp = Math.min(hs.maxMp, h.mp + Math.round(hs.maxMp * it.partyHeal));
    }
    S.bag[itemId]--; return true;
  }
  const h = S.heroes[heroId], hs = E.heroStats(S, heroId);
  if (it.revive) { if (h.hp > 0) return false; h.hp = Math.max(1, Math.round(hs.maxHp * it.revive)); }
  else if (h.hp <= 0) return false;
  if (it.heal) { if (h.hp >= hs.maxHp) return false; h.hp = Math.min(hs.maxHp, h.hp + it.heal); }
  if (it.mpHeal) { if (h.mp >= hs.maxMp) return false; h.mp = Math.min(hs.maxMp, h.mp + it.mpHeal); }
  if (it.cure) return false;
  S.bag[itemId]--;
  return true;
};

// Field spells: heal out of battle using a hero's MP.
E.fieldHeal = function (S, casterId, skillId, targetId) {
  const sk = D.SKILLS[skillId], c = S.heroes[casterId], cs = E.heroStats(S, casterId);
  if (!cs.skills.includes(skillId) || c.hp <= 0) return false;
  let cost = sk.mp; if (cs.flags.mpCut) cost = Math.ceil(cost * (1 - cs.flags.mpCut));
  if (c.mp < cost) return false;
  const mult = E.masteryMult(c.mastery[skillId]) * (1 + (cs.flags.healBoost || 0));
  const amount = sk.pct ? null : Math.round(sk.power * (cs.mag * 2.2 + 15) * mult);
  const targets = sk.target === 'allies' ? D.PARTY : sk.target === 'self' ? [casterId] : [targetId];
  let did = false;
  for (const id of targets) {
    const h = S.heroes[id], hs = E.heroStats(S, id);
    if (sk.type === 'revive') { if (h.hp <= 0) { h.hp = Math.max(1, Math.round(hs.maxHp * sk.pct)); did = true; } continue; }
    if (h.hp <= 0 || h.hp >= hs.maxHp) continue;
    h.hp = Math.min(hs.maxHp, h.hp + (amount == null ? Math.round(hs.maxHp * sk.pct) : amount));
    did = true;
  }
  if (!did) return false;
  c.mp -= cost;
  return true;
};

if (typeof module !== 'undefined' && module.exports) module.exports = E; else root.ENGINE = E;
})(this);
