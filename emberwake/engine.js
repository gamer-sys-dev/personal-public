// Emberwake engine: game rules with no DOM, so it also runs in node for balance tests.
(function (root) {
'use strict';
const D = root.DATA || require('./data.js');
const W = root.WORLD || require('./world.js');
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
    v: 2, gold: 120, bag: { potion: 4, antidote: 2, ether: 1 }, mats: {}, gear: [], nextUid: 1, nextCid: 1,
    heroes: {}, roster: [], party: [], creatures: [], companion: null,
    areas: {}, maps: {}, unlocked: 1, shopTier: 1, buildings: { yard: 0, kennels: 0 },
    surge: 0, surgeTier: 0, spar: {},
    flags: { seen: {}, got: {} }, stats: { battles: 0, wins: 0, steps: 0 },
    opts: { speed: 1 },
  };
  for (const id of D.PARTY) E.recruit(S, id, 1);
  for (const a of D.AREAS) S.areas[a.id] = { cleared: false };
  E.ensure(S);
  E.restParty(S);
  return S;
};
// Fills in anything a save from an older layer is missing.
E.ensure = function (S) {
  S.buildings = Object.assign({ yard: 0, kennels: 0, barracks: 0, walls: 0 }, S.buildings || {});
  S.siege = S.siege || { best: 0, stars: {} };
  S.arena = S.arena || { won: {} };
  S.flags = S.flags || { seen: {}, got: {} };
  if (S.areas && S.areas.millroad && S.areas.millroad.cleared) { S.flags.raid = true; S.flags.market = true; }
  return S;
};

E.recruit = function (S, id, lvl) {
  if (S.roster.includes(id)) return;
  const def = D.HEROES[id];
  if (lvl == null) lvl = Math.max(1, Math.round(S.party.reduce((s, p) => s + S.heroes[p].lvl, 0) / Math.max(1, S.party.length)));
  const h = { lvl, xp: 0, hp: 0, mp: 0, talents: Object.assign({}, def.start.talents), points: 1 + 2 * (lvl - 1), equip: { weapon: null, armour: null, charm: null }, mastery: {} };
  S.heroes[id] = h;
  for (const slot in def.start.equip) h.equip[slot] = E.addGear(S, def.start.equip[slot]).uid;
  S.roster.push(id);
  if (S.party.length < 3) S.party.push(id);
  const st = E.heroStats(S, id);
  h.hp = st.maxHp; h.mp = st.maxMp;
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
  for (const id of S.roster) for (const s in S.heroes[id].equip) if (S.heroes[id].equip[s] === uid) return id;
  return null;
};

// ---------- Hero stats ----------
E.heroStats = function (S, id) {
  const h = S.heroes[id], def = D.HEROES[id], L = h.lvl;
  const st = {}, flags = { immune: [] }, skills = ['attack'].concat(def.innate || []);
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

// ---------- Creatures ----------
E.creatureName = c => c.form ? W.CREATURES[c.sp].evo[c.form] : W.CREATURES[c.sp].name;
E.creatureSprite = c => W.CREATURES[c.sp].sprite + (c.form ? '@' + c.form : '');
E.creatureStats = function (c) {
  const sp = W.CREATURES[c.sp], L = c.lvl, m = Object.assign({}, sp.m);
  if (c.form) for (const k in W.EVO_MULT[c.form]) m[k] = (m[k] || 1) * W.EVO_MULT[c.form][k];
  const skills = sp.attack.slice();
  if (c.form === 'attack') skills.push('rend');
  skills.push(c.form === 'support' ? 'mend' : sp.support, 'guard_ally', 'howl');
  return {
    maxHp: Math.round(m.hp * (36 + 19 * L) * 0.9), maxMp: 0,
    str: Math.floor(m.str * (8 + 2.9 * L) * 0.85), mag: Math.floor(m.mag * (8 + 2.9 * L) * 0.85),
    def: Math.floor(m.def * (4 + 2.2 * L)), res: Math.floor(m.res * (4 + 2.2 * L)),
    spd: Math.floor(m.spd * (8 + 0.8 * L)), crit: 5, skills,
  };
};
E.capacity = S => W.KENNEL_CAP[S.buildings.kennels || 0];
E.addCreature = function (S, sp, lvl) {
  const c = { cid: S.nextCid++, sp, lvl: lvl || 1, xp: 0, hp: 0, stance: 'attack', tally: { attack: 0, guard: 0, support: 0 }, form: null };
  c.hp = E.creatureStats(c).maxHp;
  S.creatures.push(c);
  if (S.companion == null) S.companion = c.cid;
  return c;
};
E.creatureOf = (S, cid) => S.creatures.find(c => c.cid === cid) || null;
E.creatureXp = function (S, c, n) {
  let ups = 0, evolved = null;
  c.xp += n;
  while (c.xp >= E.xpNext(c.lvl)) {
    const before = E.creatureStats(c).maxHp;
    c.xp -= E.xpNext(c.lvl); c.lvl++; ups++;
    if (c.hp > 0) c.hp += E.creatureStats(c).maxHp - before;
    if (!c.form && c.lvl >= W.EVO_LVL) {
      const t = c.tally;
      const form = ['attack', 'guard', 'support'].sort((a, b) => t[b] - t[a])[0];
      const from = E.creatureName(c);
      c.form = form;
      c.hp = E.creatureStats(c).maxHp;
      evolved = { from, to: E.creatureName(c), form };
    }
  }
  return { ups, evolved };
};

E.restParty = function (S) {
  for (const id of S.roster) {
    const st = E.heroStats(S, id);
    S.heroes[id].hp = st.maxHp;
    S.heroes[id].mp = st.maxMp;
  }
  for (const c of S.creatures) c.hp = E.creatureStats(c).maxHp;
  for (const id in S.maps) S.maps[id].used = {};
  S.spar = {};
};
// Heals everyone without touching foraging spots or sparring (used by the arena healers).
E.healParty = function (S) {
  for (const id of S.roster) { const st = E.heroStats(S, id); S.heroes[id].hp = st.maxHp; S.heroes[id].mp = st.maxMp; }
  for (const c of S.creatures) c.hp = E.creatureStats(c).maxHp;
};
E.clampParty = function (S) {
  for (const id of S.roster) {
    const st = E.heroStats(S, id), h = S.heroes[id];
    h.hp = clamp(h.hp, 0, st.maxHp); h.mp = clamp(h.mp, 0, st.maxMp);
  }
};
E.setParty = function (S, ids) {
  if (!ids.length || ids.length > 3) return false;
  if (ids.length < Math.min(3, S.roster.length)) return false;
  S.party = ids.slice();
  return true;
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
E.canAfford = function (S, c) {
  if (!c || S.gold < c.gold) return false;
  for (const m in (c.mats || {})) if ((S.mats[m] || 0) < c.mats[m]) return false;
  return true;
};
E.pay = function (S, c) {
  S.gold -= c.gold;
  for (const m in (c.mats || {})) S.mats[m] -= c.mats[m];
};
E.canForge = (S, g) => E.canAfford(S, E.forgeCost(g));
E.forge = function (S, uid) {
  const g = E.gearOf(S, uid);
  if (!g || !E.canForge(S, g)) return false;
  E.pay(S, E.forgeCost(g));
  g.plus++;
  E.clampParty(S);
  return true;
};
E.sellPrice = g => Math.floor(D.GEAR[g.id].price * 0.4 * (1 + 0.3 * g.plus));

// ---------- Buildings and training ----------
E.buildCost = (S, b) => W.BUILDINGS[b].levels[S.buildings[b] || 0] || null;
E.build = function (S, b) {
  const c = E.buildCost(S, b);
  if (!c || !E.canAfford(S, c)) return false;
  E.pay(S, c);
  S.buildings[b] = (S.buildings[b] || 0) + 1;
  return true;
};
E.sparCost = S => 40 + 20 * (S.buildings.yard || 0);
E.sparXp = (S, id) => Math.round(E.xpNext(S.heroes[id].lvl) * (S.buildings.yard >= 2 ? 0.5 : 0.35));
E.spar = function (S, id) {
  if (!S.buildings.yard || S.spar[id] || S.gold < E.sparCost(S)) return null;
  S.gold -= E.sparCost(S);
  S.spar[id] = true;
  const xp = E.sparXp(S, id);
  return { xp, levels: E.gainXp(S, id, xp) };
};

// ---------- Maps ----------
const mapCache = {};
E.areaIndex = id => D.AREAS.findIndex(a => a.id === id);
E.area = id => D.AREAS[E.areaIndex(id)];
E.map = function (id) {
  if (W.MAPS[id]) return W.MAPS[id];
  return mapCache[id] || (mapCache[id] = W.genMap(E.area(id)));
};
E.node = (id, nid) => E.map(id).nodes.find(n => n.id === nid);
E.mapState = function (S, id) {
  if (!S.maps[id]) {
    const start = E.map(id).nodes[0].id;
    S.maps[id] = { at: start, visited: { [start]: true }, done: {}, used: {} };
  }
  return S.maps[id];
};
E.neighbours = function (id, nid) {
  const out = [];
  for (const [a, b] of E.map(id).edges) { if (a === nid) out.push(b); else if (b === nid) out.push(a); }
  return out;
};
E.visible = (S, n) => !n.hidden || !!S.flags[n.hidden];
E.revealed = function (S, id) {
  const st = E.mapState(S, id), out = new Set();
  for (const n of E.map(id).nodes) {
    if (!E.visible(S, n)) continue;
    if (st.visited[n.id]) { out.add(n.id); for (const x of E.neighbours(id, n.id)) if (E.visible(S, E.node(id, x))) out.add(x); }
  }
  return out;
};
E.NEED = {
  burn: 'Needs someone who knows Fire magic in the party.',
  lock: 'Needs Dace in the party to pick the lock.',
  beast: 'Needs Hesk in the party to get near the animals.',
};
E.meets = function (S, need) {
  if (!need) return true;
  if (need === 'burn') return S.party.some(h => (S.heroes[h].talents.fire || 0) >= 1);
  if (need === 'lock') return S.party.includes('dace');
  if (need === 'beast') return S.party.includes('hesk');
  return !!S.flags[need];
};
// Can the party walk to this node now? Returns null if fine, or a reason.
E.moveBlock = function (S, id, nid) {
  const st = E.mapState(S, id), n = E.node(id, nid);
  if (!n || !E.revealed(S, id).has(nid)) return 'You can\'t see a way there yet.';
  if (nid === st.at) return 'You\'re already here.';
  const adjacent = E.neighbours(id, st.at).includes(nid);
  if (!adjacent && !st.visited[nid]) return 'Too far. Get closer first.';
  if (!E.meets(S, n.need) && !st.done[nid]) return E.NEED[n.need] || 'Something is missing.';
  return null;
};
E.nodeLevel = function (S, id, n) {
  const a = E.area(id);
  if (S.areas[id].cleared) return a.lvl[1];
  return Math.round(a.lvl[0] + (a.lvl[1] - a.lvl[0]) * (7 - n.y) / 7);
};
E.randomFight = function (S, id, n, rng) {
  rng = rng || Math.random;
  const a = E.area(id), base = E.nodeLevel(S, id, n);
  const size = a.size[0] + Math.floor(rng() * (a.size[1] - a.size[0] + 1));
  const out = [];
  for (let i = 0; i < size; i++) out.push({ t: a.pool[Math.floor(rng() * a.pool.length)], lvl: clamp(base + Math.round(rng() - 0.3), a.lvl[0], a.lvl[1] + 1) });
  return out;
};
// Moves along the map. May return an ambush to fight before arriving.
E.move = function (S, id, nid, rng) {
  rng = rng || Math.random;
  const st = E.mapState(S, id), n = E.node(id, nid);
  const firstTime = !st.visited[nid];
  st.at = nid; st.visited[nid] = true; S.stats.steps++;
  const calm = ['start', 'camp', 'boss', 'quest'].includes(n.t) || ((n.t === 'fight' || n.t === 'den') && !st.done[nid]);
  if (!calm && rng() < (firstTime ? 0.3 : 0.18)) return { ambush: E.randomFight(S, id, n, rng) };
  return {};
};
E.applyReward = function (S, r) {
  const out = [];
  if (!r) return out;
  if (r.gold) { S.gold += r.gold; out.push(r.gold + ' gold'); }
  for (const k in (r.items || {})) { S.bag[k] = (S.bag[k] || 0) + r.items[k]; out.push(r.items[k] + ' ' + D.ITEMS[k].name); }
  for (const k in (r.mats || {})) { S.mats[k] = (S.mats[k] || 0) + r.mats[k]; out.push(r.mats[k] + ' ' + D.MATS[k].name); }
  if (r.gear) { const g = E.addGear(S, r.gear); S.flags.got[r.gear] = true; out.push(D.GEAR[r.gear].name); r._uid = g.uid; }
  if (r.tome) { for (const h of S.roster) S.heroes[h].points += 1; out.push('a Tome of Insight (+1 talent point each)'); }
  return out;
};
// What happens on arriving at the current node.
E.arrive = function (S, id) {
  const st = E.mapState(S, id), n = E.node(id, st.at);
  switch (n.t) {
    case 'fight': case 'den':
      if (!st.done[n.id]) return { type: 'fight', enemies: n.enemies, node: n.id };
      return { type: 'none' };
    case 'treasure': {
      if (st.done[n.id]) return { type: 'none' };
      st.done[n.id] = true;
      const got = E.applyReward(S, n.reward);
      return { type: 'treasure', got, gearUid: n.reward && n.reward._uid };
    }
    case 'gather': {
      if (st.used[n.id]) return { type: 'none', note: 'Picked clean for now. It grows back after you rest at the keep.' };
      st.used[n.id] = true;
      return { type: 'gather', got: E.applyReward(S, { mats: n.mats, items: n.items }) };
    }
    case 'camp': {
      let healed = false;
      if (!st.used[n.id]) {
        st.used[n.id] = true; healed = true;
        for (const h of S.roster) {
          const hs = E.heroStats(S, h), x = S.heroes[h];
          if (x.hp > 0) { x.hp = Math.min(hs.maxHp, x.hp + Math.round(hs.maxHp * 0.35)); x.mp = Math.min(hs.maxMp, x.mp + Math.round(hs.maxMp * 0.35)); }
        }
        for (const c of S.creatures) if (c.hp > 0) c.hp = Math.min(E.creatureStats(c).maxHp, c.hp + Math.round(E.creatureStats(c).maxHp * 0.35));
      }
      const talk = (n.talks || []).find(k => !S.flags.seen[k] && (k === 'camp_hesk' ? S.roster.includes('hesk') : k === 'camp_dace' ? S.roster.includes('dace') : true));
      return { type: 'camp', healed, talk };
    }
    case 'event': return st.done[n.id] ? { type: 'none' } : { type: 'event', ev: n.ev };
    case 'quest': return { type: 'quest', q: n.q };
    case 'boss': return S.areas[id].cleared ? { type: 'none' } : { type: 'boss' };
    default: return { type: 'none' };
  }
};
// After winning a fixed fight on a node.
E.winNode = function (S, id, nid) {
  const st = E.mapState(S, id), n = E.node(id, nid);
  if (st.done[nid]) return {};
  st.done[nid] = true;
  const out = { got: E.applyReward(S, n.reward), gearUid: n.reward && n.reward._uid };
  if (n.win) {
    if (n.win.flag) S.flags[n.win.flag] = true;
    if (n.win.recruit) E.recruit(S, n.win.recruit);
    out.scene = n.win.scene;
  }
  return out;
};
E.eventChoice = function (S, id, nid, idx) {
  const st = E.mapState(S, id), n = E.node(id, nid), ev = W.EVENTS[n.ev];
  if (st.done[nid]) return null;
  st.done[nid] = true;
  const o = ev.choices[idx].out;
  if (o.flag) S.flags[o.flag] = true;
  E.applyReward(S, o);
  if (o.xp) for (const h of S.party) if (S.heroes[h].hp > 0) E.gainXp(S, h, o.xp);
  return o.text;
};
E.quest = function (S, q) {
  if (q === 'hesk') {
    if (!S.flags.hesk_quest) { S.flags.hesk_quest = true; return 'hesk_meet'; }
    if (!S.flags.poachers) return 'hesk_wait';
    if (!S.roster.includes('hesk')) {
      E.recruit(S, 'hesk');
      const lvl = Math.max(2, S.heroes.hesk.lvl - 1);
      E.addCreature(S, 'wolf', lvl);
      return 'hesk_join';
    }
    return 'hesk_after';
  }
  return null;
};
E.explored = function (S, id) {
  const st = E.mapState(S, id), nodes = E.map(id).nodes.filter(n => E.visible(S, n));
  const v = nodes.filter(n => st.visited[n.id]).length;
  return Math.round(v / nodes.length * 100);
};

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
    this.heroes = S.party.map((id, i) => this.makeHero(id, i));
    const c = E.creatureOf(S, S.companion);
    if (c && c.hp > 0) this.heroes.push(this.makeCreature(c));
    this.bond = Math.max(0, ...this.heroes.filter(h => !h.isCreature).map(h => h.flags.beastBond || 0));
    this.enemies = [];
    this.letters = {};
    for (const sp of specs) this.addEnemy(sp.t, sp.lvl, sp);
    this.renameEnemies();
    this.over = false; this.won = false; this.fled = false; this.turns = 0; this.dead = []; this.tamed = [];
    this.surge = S.surgeTier ? (S.surge || 0) : 0;
    for (const a of this.all()) a.gauge = this.rng() * 40 + (a.flags && a.flags.firstStrike ? 50 : 0);
  }
  makeHero(id, i) {
    const st = E.heroStats(this.S, id), h = this.S.heroes[id];
    return Object.assign(st, { side: 'h', id, key: 'h' + i, name: D.HEROES[id].name, sprite: D.HEROES[id].sprite, lvl: h.lvl,
      hp: clamp(h.hp, 0, st.maxHp), mp: clamp(h.mp, 0, st.maxMp), statuses: {}, gauge: 0, weak: {} });
  }
  makeCreature(c) {
    const st = E.creatureStats(c);
    return Object.assign(st, { side: 'h', isCreature: true, cid: c.cid, rec: c, key: 'c0', name: E.creatureName(c), sprite: E.creatureSprite(c), lvl: c.lvl,
      hp: clamp(c.hp, 0, st.maxHp), mp: 0, statuses: {}, gauge: 0, weak: {}, flags: { immune: [] }, stance: c.stance });
  }
  addEnemy(t, lvl, o) {
    o = o || {};
    const tpl = D.ENEMIES[t], st = enemyStats(tpl, lvl);
    if (o.hpx) st.maxHp = Math.round(st.maxHp * o.hpx);
    if (o.pow) { st.str *= o.pow; st.mag *= o.pow; }
    const name = o.name || tpl.name;
    const a = Object.assign(st, { side: 'e', t, tpl, key: 'e' + (this.enemies.length), name, sprite: tpl.sprite, lvl,
      hp: st.maxHp, mp: 999, maxMp: 999, statuses: {}, gauge: this.rng() * 30, weak: tpl.weak || {}, flags: { immune: [] },
      isBoss: !!tpl.boss || !!o.boss, used: {}, base: name, big: !!o.hpx || !!o.boss });
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
  addSurge(n) {
    if (!this.S.surgeTier || this.surging) return;
    this.surge = Math.min(100, this.surge + n);
  }
  surgeReady() { return this.S.surgeTier > 0 && this.surge >= 100; }
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
    if (a.side === 'e' && !this.dead.includes(a)) { this.dead.push(a); this.addSurge(4); }
  }
  check() {
    if (this.over) return;
    if (!this.alive(this.enemies).length) { this.over = true; this.won = true; }
    else if (!this.alive(this.heroes.filter(h => !h.isCreature)).length) { this.over = true; this.won = false; }
  }
  addStatus(t, s, dur, ev) {
    if (t.hp <= 0) return;
    if (t.flags && t.flags.immune && t.flags.immune.includes(s)) { ev.push({ t: 'immune', who: t, s }); return; }
    t.statuses[s] = Math.max(t.statuses[s] || 0, dur);
    ev.push({ t: 'status', who: t, s });
  }
  baseDmg(a, t, sk) {
    const phys = sk.type === 'phys';
    const A = phys ? this.stat(a, 'str') : this.stat(a, 'mag');
    const Df = phys ? this.stat(t, 'def') : this.stat(t, 'res');
    let n = sk.power * A * (phys ? 2.2 : 2.6) * 60 / (60 + Df);
    if (sk.el && t.weak[sk.el] != null) n *= t.weak[sk.el];
    if (a.flags && sk.el && a.flags['boost_' + sk.el]) n *= 1 + a.flags['boost_' + sk.el];
    if (sk.execute && t.hp / t.maxHp < sk.execute) n *= 2;
    if (a.isCreature && this.bond) n *= 1 + this.bond;
    return n;
  }
  calc(a, t, sk, mult) {
    let n = this.baseDmg(a, t, sk) * (mult || 1);
    const el = sk.el && t.weak[sk.el] != null ? t.weak[sk.el] : 1;
    let crit = false;
    if (sk.type === 'phys' && this.rng() * 100 < a.crit) { crit = true; n *= 1.6; }
    n *= 0.9 + this.rng() * 0.2;
    if (t.flags && t.flags.bulwark) n *= 1 - t.flags.bulwark;
    if (t.defending) n *= 0.5;
    return { n: Math.max(1, Math.round(n)), crit, weak: el > 1, resist: el < 1 };
  }
  expect(a, t, sk, mult) {
    let n = this.baseDmg(a, t, sk) * (sk.hits || 1) * (mult || 1);
    if (sk.type === 'phys') n *= 1 + 0.6 * a.crit / 100;
    return Math.min(n, t.hp * (sk.target === 'random' ? 2 : 1));
  }
  hit(a, t, sk, mult, ev, noCounter) {
    if (t.hp <= 0) return;
    const r = this.calc(a, t, sk, mult);
    t.hp = Math.max(0, t.hp - r.n);
    ev.push({ t: 'dmg', who: t, n: r.n, crit: r.crit, weak: r.weak, resist: r.resist, el: sk.el || (sk.type === 'phys' ? 'phys' : 'mag'), by: a, big: r.n > t.maxHp * 0.25 });
    if (a.side === 'h') this.addSurge(2); else this.addSurge(3);
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
  // choice: { kind: 'skill'|'item'|'defend'|'flee'|'surge', id, target }
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
    if (c.kind === 'surge') {
      if (!this.surgeReady()) return ev;
      const id = D.SURGE[a.id], sk = D.SKILLS[id];
      this.surge = 0; this.surging = true;
      ev.push({ t: 'surge', who: a, text: sk.name });
      this.perform(a, sk, c.target, this.S.surgeTier >= 2 ? 1.5 : 1, ev);
      this.surging = false;
      this.check();
      return ev;
    }
    const sk = D.SKILLS[c.id];
    const cost = this.mpCost(a, sk);
    if (a.mp < cost) { ev.push({ t: 'say', text: 'Not enough MP' }); return ev; }
    a.mp -= cost;
    if (c.id !== 'attack') ev.push({ t: 'say', text: sk.name, who: a });
    let mult = 1;
    if (a.side === 'h' && !a.isCreature && c.id !== 'attack' && sk.type !== 'tame' && sk.type !== 'steal') {
      const h = this.S.heroes[a.id];
      const before = E.masteryLevel(h.mastery[c.id]);
      h.mastery[c.id] = (h.mastery[c.id] || 0) + 1;
      const after = E.masteryLevel(h.mastery[c.id]);
      mult = E.masteryMult(h.mastery[c.id] - 1);
      if (after > before) ev.push({ t: 'mastery', who: a, skill: c.id, lvl: after });
    }
    if (a.isCreature) a.rec.tally[a.stance] = (a.rec.tally[a.stance] || 0) + 1;
    if (sk.type === 'summon') {
      const room = 4 - this.alive(this.enemies).length;
      for (const t of sk.summon.slice(0, Math.max(0, room))) {
        const e = this.addEnemy(t, Math.max(1, a.lvl - 2));
        ev.push({ t: 'summon', who: e });
      }
      this.renameEnemies();
      return ev;
    }
    if (sk.type === 'tame') { this.tame(a, c.target, ev); this.check(); return ev; }
    if (sk.type === 'steal') { this.steal(a, c.target, ev); return ev; }
    this.perform(a, sk, c.target, mult, ev);
    this.check();
    return ev;
  }
  perform(a, sk, chosen, mult, ev) {
    if (sk.target === 'random') {
      for (let i = 0; i < (sk.hits || 1); i++) {
        const foes = this.alive(this.foes(a));
        if (!foes.length) break;
        this.hit(a, foes[Math.floor(this.rng() * foes.length)], sk, mult, ev);
      }
    } else {
      const targets = this.targetsFor(a, sk.target, chosen);
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
    }
    if (sk.after) for (const t of this.alive(this.friends(a))) for (const s in sk.after) this.addStatus(t, s, sk.after[s], ev);
  }
  tame(a, t, ev) {
    if (!t || t.hp <= 0) t = this.alive(this.enemies)[0];
    if (!t) return;
    if (!t.tpl.tame || t.isBoss) { ev.push({ t: 'say', text: t.name + ' can\'t be tamed' }); return; }
    if (this.S.creatures.length + this.tamed.length >= E.capacity(this.S)) { ev.push({ t: 'say', text: 'No room. Build or expand the kennels' }); return; }
    const p = clamp(0.08 + 0.85 * Math.pow(1 - t.hp / t.maxHp, 1.3), 0.08, 0.9);
    if (this.rng() < p) {
      t.tamed = true;
      this.tamed.push({ sp: t.tpl.tame, lvl: t.lvl });
      ev.push({ t: 'tamed', who: t });
      this.ko(t, ev);
    } else ev.push({ t: 'say', text: t.name + ' shakes free (' + Math.round(p * 100) + '% chance)' });
  }
  steal(a, t, ev) {
    if (!t || t.hp <= 0) t = this.alive(this.enemies)[0];
    if (!t) return;
    if (t.stolen) { ev.push({ t: 'say', text: 'Nothing left on ' + t.name }); return; }
    t.stolen = true;
    const S = this.S, r = this.rng();
    if (r < 0.2) { ev.push({ t: 'say', text: 'Missed' }); return; }
    let text;
    if (a.flags.stealPlus && this.rng() < 0.35) {
      const pool = ['ether', 'hi_potion', 'feather'];
      const it = pool[Math.floor(this.rng() * pool.length)];
      S.bag[it] = (S.bag[it] || 0) + 1; text = D.ITEMS[it].name;
    } else if (r < 0.6) {
      const g = Math.round((5 + 3 * t.lvl) * 2 * (t.tpl.gold || 1)); S.gold += g; text = g + ' gold';
    } else {
      const d = (t.tpl.drops || []).find(x => x.mat || x.item);
      if (d && d.mat) { S.mats[d.mat] = (S.mats[d.mat] || 0) + 1; text = D.MATS[d.mat].name; }
      else { const it = d && d.item ? d.item : 'potion'; S.bag[it] = (S.bag[it] || 0) + 1; text = D.ITEMS[it].name; }
    }
    ev.push({ t: 'say', text: 'Stole ' + text });
    ev.push({ t: 'stole', who: t, text });
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
        const n = Math.round(it.bomb * (t.weak[it.el] || 1) * (0.9 + this.rng() * 0.2));
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
    if (it.mpHeal && t.hp > 0 && !t.isCreature) { const n = Math.min(it.mpHeal, t.maxMp - t.mp); t.mp += n; ev.push({ t: 'mp', who: t, n }); }
    if (it.cure) for (const s of it.cure) if (t.statuses[s]) { delete t.statuses[s]; ev.push({ t: 'off', who: t, s }); }
    return ev;
  }
  enemyChoice(e) {
    const tpl = e.tpl;
    for (const s of tpl.skills) {
      if (s.phase && !e.used[s.id] && e.hp / e.maxHp <= s.phase) { e.used[s.id] = true; return this.withTarget(e, s.id); }
    }
    const allies = this.alive(this.enemies);
    const ok = tpl.skills.filter(s => s.w > 0 && (
      s.when !== 'allyHurt' || allies.some(x => x.hp / x.maxHp < 0.6)) &&
      (D.SKILLS[s.id].type !== 'summon' || allies.length < 4));
    const total = ok.reduce((x, s) => x + s.w, 0);
    let r = this.rng() * total, pick = ok[0];
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
  creatureChoice(a) {
    const foes = this.alive(this.enemies), friends = this.alive(this.heroes);
    const atk = a.skills.filter(s => D.SKILLS[s].type === 'phys' || D.SKILLS[s].type === 'mag');
    const heal = a.skills.find(s => D.SKILLS[s].type === 'heal');
    const pickAtk = () => {
      const id = a.skills.includes('rend') && this.rng() < 0.4 ? 'rend' : atk[Math.floor(this.rng() * atk.length)];
      const t = foes.slice().sort((x, y) => x.hp - y.hp)[0];
      return { kind: 'skill', id, target: t };
    };
    if (a.stance === 'guard') return a.statuses.taunt ? pickAtk() : { kind: 'skill', id: 'guard_ally' };
    if (a.stance === 'support') {
      const hurt = friends.filter(f => f.hp / f.maxHp < 0.6).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp);
      if (hurt.length && heal) return { kind: 'skill', id: heal, target: hurt[0] };
      if (!friends.some(f => f.statuses.strUp) && this.rng() < 0.5) return { kind: 'skill', id: 'howl' };
    }
    return pickAtk();
  }
  autoChoice(a) {
    const S = this.S;
    if (a.isCreature) return this.creatureChoice(a);
    const friends = this.heroes, live = this.alive(friends), foes = this.alive(this.enemies);
    const can = id => a.skills.includes(id) && a.mp >= this.mpCost(a, D.SKILLS[id]);
    if (this.surgeReady() && (this.boss || foes.reduce((s, f) => s + f.hp, 0) > a.maxHp * 2)) return { kind: 'surge', target: foes.sort((x, y) => y.hp - x.hp)[0] };
    const dead = friends.filter(f => f.hp <= 0 && !f.isCreature);
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
    const thrifty = !this.boss && a.mp < a.maxMp * 0.35;
    let best = { kind: 'skill', id: 'attack', target: foes[0] }, bestV = -1;
    for (const id of a.skills) {
      const sk = D.SKILLS[id];
      if (!(sk.type === 'phys' || sk.type === 'mag') || !can(id) || (thrifty && sk.mp)) continue;
      const mult = E.masteryMult(S.heroes[a.id].mastery[id]);
      if (sk.target === 'enemies' || sk.target === 'random') {
        const v = (sk.target === 'random' ? this.expect(a, foes[0], sk, mult) : foes.reduce((s, t) => s + this.expect(a, t, sk, mult), 0)) - (sk.mp || 0) * 1.5;
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
  for (const h of B.heroes) {
    if (h.isCreature) h.rec.hp = h.hp;
    else { S.heroes[h.id].hp = h.hp; S.heroes[h.id].mp = h.mp; }
  }
  if (S.surgeTier) S.surge = Math.round(B.surge);
  S.stats.battles++;
  const out = { won: B.won, fled: B.fled, xp: 0, gold: 0, mats: {}, items: {}, gear: [], levels: {}, heroXp: {}, bench: {}, tamed: [], creature: null };
  if (!B.won) return out;
  S.stats.wins++;
  const rng = B.rng;
  let xp = 0, gold = 0, lsum = 0;
  for (const e of B.dead) {
    xp += e.tpl.xp * (8 + 5 * e.lvl);
    gold += e.tpl.gold * (5 + 3 * e.lvl);
    lsum += e.lvl;
    if (e.tamed) continue;
    for (const d of (e.tpl.drops || [])) {
      if (rng() >= d.c) continue;
      if (d.mat) out.mats[d.mat] = (out.mats[d.mat] || 0) + (d.n || 1);
      if (d.item) out.items[d.item] = (out.items[d.item] || 0) + 1;
      if (d.gear && !(d.once && S.flags.got[d.gear])) { out.gear.push(d.gear); S.flags.got[d.gear] = true; }
    }
  }
  const avgL = lsum / Math.max(1, B.dead.length);
  const goldBonus = Math.max(0, ...B.heroes.map(h => (h.flags && h.flags.goldBonus) || 0));
  out.gold = Math.round(gold * (1 + goldBonus));
  S.gold += out.gold;
  for (const m in out.mats) S.mats[m] = (S.mats[m] || 0) + out.mats[m];
  for (const i in out.items) S.bag[i] = (S.bag[i] || 0) + out.items[i];
  for (const g of out.gear) E.addGear(S, g);
  out.xp = Math.round(xp);
  const top = Math.max(...S.roster.map(id => S.heroes[id].lvl));
  const factor = L => clamp(1 + 0.12 * (avgL - L), 0.2, 1.5);
  const catchUp = L => 1 + 0.25 * clamp(top - L, 0, 4);
  for (const id of S.roster) {
    const hs = S.heroes[id], actor = B.heroes.find(h => h.id === id && !h.isCreature);
    let gain = 0;
    if (actor) {
      if (actor.hp <= 0) continue;
      gain = xp * factor(hs.lvl) * catchUp(hs.lvl) * (1 + (actor.flags.xpBonus || 0));
      out.heroXp[id] = Math.max(1, Math.round(gain));
    } else {
      const rate = W.YARD_RATE[S.buildings.yard || 0];
      if (!rate) continue;
      gain = xp * factor(hs.lvl) * catchUp(hs.lvl) * rate;
      out.bench[id] = Math.max(1, Math.round(gain));
    }
    const lv = E.gainXp(S, id, Math.max(1, Math.round(gain)));
    if (lv) out.levels[id] = lv;
  }
  const comp = B.heroes.find(h => h.isCreature);
  for (const c of S.creatures) {
    const fighting = comp && comp.cid === c.cid;
    if (fighting && comp.hp <= 0) continue;
    const rate = fighting ? 1 : (S.buildings.kennels >= 2 ? 0.5 : 0);
    if (!rate) continue;
    const gain = Math.max(1, Math.round(xp * factor(c.lvl) * rate));
    const r = E.creatureXp(S, c, gain);
    if (fighting) out.creature = { name: E.creatureName(c), xp: gain, ups: r.ups, lvl: c.lvl };
    if (r.evolved) (out.evolved = out.evolved || []).push(r.evolved);
  }
  for (const t of B.tamed) {
    if (S.creatures.length >= E.capacity(S)) break;
    const c = E.addCreature(S, t.sp, t.lvl);
    out.tamed.push(E.creatureName(c));
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
  for (const id in S.maps) S.maps[id].at = E.map(id).nodes[0].id;
  return lost;
};

// After a boss win: unlocks the next area, shop tiers and surge. Returns story scenes to show.
E.clearArea = function (S, areaId) {
  const i = E.areaIndex(areaId);
  if (i < 0 || !S.areas[areaId]) return [];
  S.areas[areaId].cleared = true;
  S.unlocked = Math.max(S.unlocked, Math.min(D.AREAS.length, i + 2));
  const scenes = [areaId + '_out'];
  if (areaId === 'thornwood' && S.surgeTier < 1) { S.surgeTier = 1; scenes.push('surge1'); }
  if (areaId === 'millroad') {
    S.shopTier = Math.max(S.shopTier, 2);
    if (S.surgeTier < 2) { S.surgeTier = 2; scenes.push('surge2'); }
    if (!S.flags.raid) { S.flags.raid = true; S.flags.market = true; scenes.push('raid_warn'); }
  }
  if (areaId === 'barrows') S.shopTier = Math.max(S.shopTier, 3);
  return scenes;
};
E.bossSpecs = area => area.boss.map(b => ({ t: b.t, lvl: b.lvl }));

// ---------- Noticeboard ----------
E.boardStatus = function (S, b) {
  if (b.future) return 'future';
  const has = id => S.roster.includes(id);
  switch (b.id) {
    case 'surge1': return S.surgeTier >= 1 ? 'done' : 'locked';
    case 'surge2': return S.surgeTier >= 2 ? 'done' : 'locked';
    case 'hesk': case 'creatures': return has('hesk') ? 'done' : 'locked';
    case 'dace': case 'locks': return has('dace') ? 'done' : 'locked';
    case 'trader': return S.shopTier >= 2 ? 'done' : 'locked';
    case 'evolve': return S.creatures.some(c => c.form) ? 'done' : 'locked';
    case 'yard': return S.buildings.yard ? 'done' : S.areas.thornwood.cleared ? 'ready' : 'locked';
    case 'kennels': return S.buildings.kennels ? 'done' : has('hesk') ? 'ready' : 'locked';
    case 'siege': return S.siege.best >= 1 ? 'done' : S.flags.raid ? 'ready' : 'locked';
    case 'barracks': return S.buildings.barracks ? 'done' : S.siege.best >= 1 ? 'ready' : 'locked';
    case 'walls': return S.buildings.walls ? 'done' : S.siege.best >= 1 ? 'ready' : 'locked';
    case 'night5': return S.siege.best >= 5 ? 'done' : S.flags.raid ? 'ready' : 'locked';
    case 'arena': return S.arena.won.b1 ? 'done' : S.flags.market ? 'ready' : 'locked';
    case 'bronze': return S.arena.won.b5 ? 'done' : S.flags.market ? 'ready' : 'locked';
    case 'emberfox': return S.arena.won.s5 ? 'done' : S.arena.won.b5 ? 'ready' : 'locked';
    case 'goldrank': return S.arena.won.g4 ? 'done' : S.arena.won.s5 ? 'ready' : 'locked';
    default: return 'locked';
  }
};

// ---------- Out of battle ----------
E.fieldItem = function (S, itemId, heroId) {
  const it = D.ITEMS[itemId];
  if (!S.bag[itemId] || it.bomb || it.flee) return false;
  if (it.partyHeal) {
    for (const id of S.roster) {
      const h = S.heroes[id], hs = E.heroStats(S, id);
      if (h.hp > 0) h.hp = Math.min(hs.maxHp, h.hp + Math.round(hs.maxHp * it.partyHeal));
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
E.fieldHeal = function (S, casterId, skillId, targetId) {
  const sk = D.SKILLS[skillId], c = S.heroes[casterId], cs = E.heroStats(S, casterId);
  if (!cs.skills.includes(skillId) || c.hp <= 0) return false;
  let cost = sk.mp; if (cs.flags.mpCut) cost = Math.ceil(cost * (1 - cs.flags.mpCut));
  if (c.mp < cost) return false;
  const mult = E.masteryMult(c.mastery[skillId]) * (1 + (cs.flags.healBoost || 0));
  const amount = sk.pct ? null : Math.round(sk.power * (cs.mag * 2.2 + 15) * mult);
  const targets = sk.target === 'allies' ? S.roster : sk.target === 'self' ? [casterId] : [targetId];
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

// ---------- Saves from layer one ----------
E.migrate = function (S) {
  if (!S) return S;
  if (S.v >= 2) return E.ensure(S);
  S.v = 2;
  S.roster = D.PARTY.slice(); S.party = D.PARTY.slice();
  S.creatures = []; S.companion = null; S.nextCid = 1;
  S.buildings = { yard: 0, kennels: 0 }; S.spar = {}; S.maps = {};
  S.surge = 0;
  S.surgeTier = S.areas.millroad && S.areas.millroad.cleared ? 2 : S.areas.thornwood && S.areas.thornwood.cleared ? 1 : 0;
  for (const a of D.AREAS) {
    const old = S.areas[a.id] || {};
    S.areas[a.id] = { cleared: !!old.cleared };
    // Don't hand out tomes twice to players who already found one on the old path.
    const tomeFound = Object.keys(old.found || {}).some(k => a.unique[k] && a.unique[k].tome);
    const st = E.mapState(S, a.id);
    for (const n of E.map(a.id).nodes) {
      if (!n.reward) continue;
      if ((n.reward.tome && tomeFound) || (n.reward.gear && S.flags.got[n.reward.gear])) st.done[n.id] = true;
    }
  }
  S.opts = S.opts || { speed: 1 };
  return E.ensure(S);
};

// ---------- Arena ----------
// A bout is open when every earlier bout in its rank is won and the previous rank's final is won.
E.boutOpen = function (S, rankIdx, boutIdx) {
  const ranks = W.ARENA;
  if (!S.flags.market) return false;
  if (rankIdx > 0) { const prev = ranks[rankIdx - 1]; if (!S.arena.won[prev.bouts[prev.bouts.length - 1].id]) return false; }
  for (let i = 0; i < boutIdx; i++) if (!S.arena.won[ranks[rankIdx].bouts[i].id]) return false;
  return true;
};
// Arena fighters are seasoned: tougher than the same beast in the wild.
E.boutFoes = b => b.foes.map(f => Object.assign({}, f, { lvl: f.lvl + 2, hpx: (f.hpx || 1) * 1.8, pow: 1.2 }));
E.findBout = function (id) {
  for (const r of W.ARENA) for (const b of r.bouts) if (b.id === id) return b;
  return null;
};
E.arenaWin = function (S, id) {
  const b = E.findBout(id), first = !S.arena.won[id];
  S.arena.won[id] = true;
  const out = { first, got: [] };
  if (first) {
    const p = Object.assign({}, b.prize);
    out.got = E.applyReward(S, p);
    out.gearUid = p._uid;
    if (p.creature) {
      const lvl = Math.max(8, Math.round(S.party.reduce((s, h) => s + S.heroes[h].lvl, 0) / S.party.length) - 1);
      const c = E.addCreature(S, p.creature, lvl);
      out.creature = E.creatureName(c);
      out.got.push('an ' + out.creature);
    }
  } else {
    const g = 40 + 10 * Math.max(...b.foes.map(f => f.lvl));
    S.gold += g; out.got.push(g + ' gold');
  }
  return out;
};

if (typeof module !== 'undefined' && module.exports) module.exports = E; else root.ENGINE = E;
})(this);
