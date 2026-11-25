// Emberwake: the war campaign (chapter two). Rules only, no DOM, so it runs in node for balance tests.
// A map of regions. Each day (every rest at the keep) your armies march, the Hollow march, battles are fought and
// holdings pay out. Villages with people in them can be lost for good. Forts held raise the whole party.
(function (root) {
'use strict';
const D = root.DATA || (typeof require !== 'undefined' && require('./data.js'));
const E = root.ENGINE || (typeof require !== 'undefined' && require('./engine.js'));

// ---------- the map ----------
// owner: 'p' yours, 'h' Hollow. named: a place with people in it; if it falls it is lost for good.
// garrison: Hollow strength holding it at the start. bonus: what holding it gives (fractions are +%).
const REGIONS = {
  emberwake:   { name: 'Emberwake', x: 50, y: 90, kind: 'keep', owner: 'p', yields: { gold: 50, levy: 2 }, desc: 'Home. If the Hollow reach it, you hold the walls yourself.' },
  lodge:       { name: 'Hunter\'s Lodge', x: 20, y: 80, kind: 'village', owner: 'p', named: true, people: 'Old Garth and the Thornwood trappers', yields: { gold: 20, levy: 1 }, bonus: { creatureXp: 0.25 }, desc: 'Trappers who know every beast in the wood.' },
  millbrook:   { name: 'Millbrook', x: 80, y: 80, kind: 'village', owner: 'p', named: true, people: 'the miller Agnes and forty families', yields: { gold: 35, levy: 2 }, bonus: { armyHeal: 1 }, desc: 'Grain for the armies. Wounded soldiers mend here.' },
  ashby:       { name: 'Ashby', x: 32, y: 62, kind: 'ruin', owner: 'h', garrison: 70, yields: { levy: 2 }, bonus: { stat: 0.05 }, desc: 'Bram\'s village, burned in the first raid. Retaking it puts heart in everyone: +5% to every hero\'s stats.' },
  haywood:     { name: 'Haywood', x: 58, y: 66, kind: 'village', owner: 'p', named: true, people: 'Reeve Tobin and the Haywood shepherds', yields: { gold: 25, levy: 1 }, bonus: { heroXp: 0.1 }, desc: 'Shepherds who\'ve seen the Hollow come over the hills before.' },
  brightwater: { name: 'Brightwater', x: 86, y: 58, kind: 'town', owner: 'p', yields: { gold: 70 }, bonus: { shop: 4 }, desc: 'The market town. While it holds, the market and the arena stay open.' },
  barrowwatch: { name: 'Barrow Watch', x: 12, y: 42, kind: 'fort', owner: 'h', garrison: 120, yields: { gold: 30 }, bonus: { heroXp: 0.15 }, desc: 'An old watchtower over the barrows. Holding it: +15% hero XP.' },
  stonecut:    { name: 'Stonecut Mine', x: 40, y: 42, kind: 'mine', owner: 'h', garrison: 140, yields: { ore: 2, starsteel: 1 }, desc: 'Starsteel lies deep in Stonecut. Needed for forging past +5.' },
  temple:      { name: 'Temple of the Drowned Light', x: 72, y: 40, kind: 'temple', owner: 'h', garrison: 170, yields: { gold: 20 }, bonus: { stat: 0.05, armyHeal: 1 }, desc: 'A drowned shrine. Holding it: +5% to every hero\'s stats and armies mend faster.' },
  fenwick:     { name: 'Fenwick', x: 92, y: 28, kind: 'village', owner: 'p', named: true, people: 'the eel fishers of Fenwick', yields: { gold: 25, levy: 1 }, bonus: { creatureXp: 0.15 }, desc: 'A stilt village on the edge of the fen. Hard to reach, harder to defend.' },
  greyfort:    { name: 'Greyfort', x: 22, y: 22, kind: 'fort', owner: 'h', garrison: 260, yields: { gold: 40, starsteel: 1 }, bonus: { soldierPower: 0.15 }, desc: 'A Hollow stronghold. Holding it: +15% to every soldier\'s strength.' },
  kingsbridge: { name: 'Kingsbridge', x: 58, y: 20, kind: 'fort', owner: 'h', garrison: 320, yields: { gold: 60, emberglass: 1 }, bonus: { soldierXp: 0.25, shop: 5 }, desc: 'The old royal crossing and its armouries. Holding it: +25% soldier XP and the best gear in the shops.' },
  hollowgate:  { name: 'The Hollow Gate', x: 40, y: 4, kind: 'citadel', owner: 'h', garrison: 600, locked: true, desc: 'Where the Hollow come from. Not yet.' },
};
const ROADS = [['emberwake', 'lodge'], ['emberwake', 'millbrook'], ['emberwake', 'haywood'], ['emberwake', 'ashby'], ['lodge', 'ashby'], ['millbrook', 'haywood'],
  ['millbrook', 'brightwater'], ['haywood', 'brightwater'], ['haywood', 'stonecut'], ['ashby', 'barrowwatch'], ['ashby', 'stonecut'], ['brightwater', 'temple'],
  ['brightwater', 'fenwick'], ['temple', 'fenwick'], ['temple', 'stonecut'], ['barrowwatch', 'greyfort'], ['stonecut', 'greyfort'], ['stonecut', 'kingsbridge'],
  ['temple', 'kingsbridge'], ['greyfort', 'hollowgate'], ['kingsbridge', 'hollowgate']];
const NEAR = {};
for (const [a, b] of ROADS) { (NEAR[a] = NEAR[a] || []).push(b); (NEAR[b] = NEAR[b] || []).push(a); }
const FORT_DEF = { fort: 1.35, citadel: 1.6, mine: 1.15, temple: 1.2, keep: 1.3, town: 1.1, village: 1, ruin: 1 };

// ---------- soldiers ----------
const TYPES = {
  sword:  { name: 'Swordsmen', one: 'Swordsman', power: 10, gold: 60, levy: 1, desc: 'Steady line infantry.' },
  archer: { name: 'Archers', one: 'Archer', power: 9, gold: 60, levy: 1, desc: 'Strong when defending.', def: 0.2 },
  spear:  { name: 'Spearmen', one: 'Spearman', power: 12, gold: 90, levy: 1, req: ['barracks', 1], desc: 'Break charges and big brutes.' },
  priest: { name: 'Priests', one: 'Priest', power: 6, gold: 90, levy: 1, req: ['barracks', 1], desc: 'Fewer of your soldiers die in any battle they join.', saves: 0.07 },
  knight: { name: 'Knights', one: 'Knight', power: 20, gold: 180, levy: 2, req: ['barracks', 2], desc: 'Heavy cavalry of the old order.' },
  rider:  { name: 'Outriders', one: 'Outrider', power: 15, gold: 150, levy: 2, req: ['region', 'ashby'], desc: 'Fast horse from Ashby. Strong when attacking.', atk: 0.2 },
};
const RANKS = ['Recruit', 'Soldier', 'Veteran', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain', 'Champion', 'Hero', 'Legend'];
const RANK_XP = [0, 20, 50, 100, 170, 260, 380, 540, 750, 1000];
const STAR_AT = [3, 5, 7, 9, 10]; // a star at each of these ranks
// Perks bought with points: one point per rank above the first and one per star.
const PERKS = {
  might:   { name: 'Might', max: 5, desc: '+10% strength per rank' },
  armour:  { name: 'Armour', max: 3, desc: '-20% chance to fall per rank' },
  assault: { name: 'Assault', max: 3, desc: '+15% when attacking per rank' },
  bulwark: { name: 'Bulwark', max: 3, desc: '+15% when defending per rank' },
  leader:  { name: 'Leader', max: 3, desc: '+3% to the whole army per rank' },
};
const FIRST = ['Edda', 'Hal', 'Wynn', 'Brom', 'Tilda', 'Osric', 'Mae', 'Corin', 'Ines', 'Dunstan', 'Rhea', 'Garrick', 'Elsa', 'Tam', 'Nell', 'Aldo', 'Bree', 'Cuthbert', 'Ysolde', 'Piers', 'Mags', 'Rowan', 'Hester', 'Jory', 'Lise', 'Ned', 'Orla', 'Silas', 'Tova', 'Wat'];
const LAST = ['Marsh', 'Cole', 'Ashdown', 'Reed', 'Hale', 'Thatcher', 'Brook', 'Fenn', 'Holt', 'Crane', 'Barrow', 'Wick', 'Stone', 'Fletcher', 'Mill', 'Hart', 'Ford', 'Moss', 'Tanner', 'Webb'];

// ---------- state ----------
const W2 = {};
W2.REGIONS = REGIONS; W2.ROADS = ROADS; W2.NEAR = NEAR; W2.TYPES = TYPES; W2.RANKS = RANKS; W2.PERKS = PERKS;
W2.active = S => !!(S.war && S.war.on);
W2.start = function (S) {
  if (S.war && S.war.on) return S.war;
  const regions = {};
  for (const id in REGIONS) regions[id] = { owner: REGIONS[id].owner, garrison: REGIONS[id].garrison || 0, siege: 0, lost: false, taken: 0 };
  S.war = { on: true, day: 1, levy: 6, regions, armies: [], soldiers: {}, nextSid: 1, nextAid: 1, hollow: [], nextHid: 1, log: [], reports: [], spawnT: 2 };
  // The first army: what the siege taught you, six squads.
  const a = W2.newArmy(S, 'First Company');
  for (const t of ['sword', 'sword', 'archer', 'archer', 'sword', 'archer']) W2.addSoldier(S, a, t);
  return S.war;
};
W2.newArmy = function (S, name) {
  const a = { id: S.war.nextAid++, name: name || W2.armyName(S), general: null, squads: [], at: 'emberwake', target: null, broken: 0 };
  S.war.armies.push(a);
  return a;
};
W2.armyName = S => ['First Company', 'Second Company', 'Ashby Guard', 'The Grey Banners', 'The Ember Host', 'The Last Watch'][S.war.armies.length] || 'Company ' + (S.war.armies.length + 1);
W2.armySlots = S => Math.min(6, 1 + (S.buildings.barracks || 0) + W2.owned(S).filter(id => REGIONS[id].kind === 'fort').length + (W2.owns(S, 'ashby') ? 1 : 0));
W2.SQUADS = 8;
W2.addSoldier = function (S, army, type, rng) {
  rng = rng || Math.random;
  const sid = S.war.nextSid++;
  const taken = new Set(Object.values(S.war.soldiers).map(x => x.name));
  let name = '';
  for (let i = 0; i < 20 && (!name || taken.has(name)); i++) name = FIRST[Math.floor(rng() * FIRST.length)] + ' ' + LAST[Math.floor(rng() * LAST.length)];
  const s = { sid, type, name, rank: 1, xp: 0, perks: {}, battles: 0, kills: 0 };
  S.war.soldiers[sid] = s;
  if (army) army.squads.push(sid);
  return s;
};
W2.unlocked = (S, t) => { const r = TYPES[t].req; if (!r) return true; return r[0] === 'barracks' ? (S.buildings.barracks || 0) >= r[1] : W2.owns(S, r[1]); };
W2.recruit = function (S, armyId, t) {
  const a = S.war.armies.find(x => x.id === armyId), d = TYPES[t];
  if (!a || !W2.unlocked(S, t)) return 'Not trained yet.';
  if (a.squads.length >= W2.SQUADS) return 'That army is full.';
  if (S.gold < d.gold || S.war.levy < d.levy) return 'Not enough gold or levy.';
  if (a.at !== 'emberwake' && !W2.owns(S, a.at)) return 'Recruits can only reach an army on your own ground.';
  S.gold -= d.gold; S.war.levy -= d.levy;
  return W2.addSoldier(S, a, t);
};
W2.owns = (S, id) => S.war.regions[id] && S.war.regions[id].owner === 'p';
W2.owned = S => Object.keys(S.war.regions).filter(id => W2.owns(S, id));

// ---------- soldiers: ranks, stars, perks ----------
W2.stars = s => STAR_AT.filter(r => s.rank >= r).length;
W2.points = s => (s.rank - 1) + W2.stars(s) - Object.values(s.perks).reduce((a, b) => a + b, 0);
W2.title = s => RANKS[s.rank - 1];
W2.buyPerk = function (s, k) {
  if (W2.points(s) <= 0 || (s.perks[k] || 0) >= PERKS[k].max) return false;
  s.perks[k] = (s.perks[k] || 0) + 1;
  return true;
};
W2.soldierXp = function (S, s, n) {
  s.xp += Math.round(n * (1 + (W2.mods(S).soldierXp || 0)));
  const ups = [];
  while (s.rank < 10 && s.xp >= RANK_XP[s.rank]) { s.rank++; ups.push(s.rank); }
  return ups;
};
// A squad's strength. mode: 'atk' or 'def'.
W2.soldierPower = function (S, s, mode) {
  const d = TYPES[s.type], p = s.perks;
  let n = d.power * (1 + 0.25 * (s.rank - 1)) * (1 + 0.1 * W2.stars(s)) * (1 + 0.1 * (p.might || 0));
  if (mode === 'atk') n *= 1 + 0.15 * (p.assault || 0) + (d.atk || 0);
  else n *= 1 + 0.15 * (p.bulwark || 0) + (d.def || 0);
  return n;
};
// The general: a hero leading the army. Not in the party while they lead.
W2.generalMult = function (S, a) {
  if (!a.general) return 1;
  const h = S.heroes[a.general];
  return 1 + 0.02 * h.lvl + (h.awakened ? 0.15 : 0);
};
W2.armyPower = function (S, a, mode) {
  let n = 0, lead = 0;
  for (const sid of a.squads) { const s = S.war.soldiers[sid]; n += W2.soldierPower(S, s, mode); lead += 0.03 * (s.perks.leader || 0); }
  return Math.round(n * (1 + lead) * W2.generalMult(S, a) * (1 + (W2.mods(S).soldierPower || 0)) * (a.broken ? 0.6 : 1));
};
W2.setGeneral = function (S, armyId, heroId) {
  const a = S.war.armies.find(x => x.id === armyId);
  if (!a) return 'No such army.';
  if (heroId && S.war.armies.some(x => x.general === heroId && x !== a)) return 'Already leading another army.';
  if (heroId && S.party.length <= 1 && S.party.includes(heroId)) return 'Someone has to stay in the party.';
  if (heroId && (S.flags.gone || []).includes(heroId)) return 'Not here.';
  a.general = heroId || null;
  if (heroId && S.party.includes(heroId)) {
    S.party = S.party.filter(x => x !== heroId);
    const free = S.roster.filter(id => !S.party.includes(id) && !W2.generalOf(S, id));
    while (S.party.length < 3 && free.length) S.party.push(free.shift());
  }
  return null;
};
W2.generalOf = (S, heroId) => (S.war && S.war.on ? S.war.armies.find(a => a.general === heroId) : null) || null;
W2.wounded = (S, heroId) => !!(S.war && S.war.wounded && S.war.wounded[heroId] > 0);

// ---------- bonuses from regions held ----------
W2.mods = function (S) {
  const out = { stat: 0, heroXp: 0, soldierXp: 0, soldierPower: 0, creatureXp: 0, armyHeal: 0, shop: 0 };
  if (!S.war || !S.war.on) return out;
  for (const id of W2.owned(S)) {
    if (S.war.regions[id].lost) continue; // a ruin, nobody left to help
    const b = REGIONS[id].bonus || {};
    for (const k in b) out[k] = k === 'shop' ? Math.max(out[k], b[k]) : out[k] + b[k];
  }
  return out;
};
W2.income = function (S) {
  const out = { gold: 0, levy: 1 };
  for (const id of W2.owned(S)) if (!S.war.regions[id].lost) for (const k in (REGIONS[id].yields || {})) out[k] = (out[k] || 0) + REGIONS[id].yields[k];
  return out;
};

// ---------- battles ----------
// Odds and expected losses for an attack on a region (its garrison and any Hollow army standing there).
W2.foePower = function (S, rid) {
  const r = S.war.regions[rid];
  let n = r.owner === 'h' ? r.garrison * (FORT_DEF[REGIONS[rid].kind] || 1) : 0;
  for (const h of S.war.hollow) if (h.at === rid) n += h.power;
  return Math.round(n);
};
W2.odds = (P, Q) => (Q <= 0 ? 1 : Math.pow(P, 2.5) / (Math.pow(P, 2.5) + Math.pow(Q, 2.5)));
W2.forecast = function (S, a, rid, mode) {
  const P = W2.armyPower(S, a, mode || 'atk'), Q = mode === 'def' ? W2.hollowAt(S, rid) : W2.foePower(S, rid);
  const p = W2.odds(P, Q);
  const lossWin = Math.round(a.squads.length * W2.lossRate(Q / Math.max(1, P), true) * W2.deathMult(S, a));
  return { P, Q, p, lossWin };
};
W2.hollowAt = (S, rid) => S.war.hollow.filter(h => h.at === rid).reduce((t, h) => t + h.power, 0);
W2.lossRate = (ratio, won) => Math.max(0.03, Math.min(0.8, won ? 0.2 * ratio : 0.35 + 0.2 * ratio));
W2.deathMult = function (S, a) {
  let saves = 0;
  for (const sid of a.squads) saves += TYPES[S.war.soldiers[sid].type].saves || 0;
  return 1 - Math.min(0.35, saves);
};
// Fights one battle between an army and a Hollow force. Returns what happened.
W2.battle = function (S, a, Q, mode, rng) {
  rng = rng || Math.random;
  const P = W2.armyPower(S, a, mode), p = W2.odds(P, Q), won = rng() < p;
  const ratio = Q / Math.max(1, P), rate = W2.lossRate(ratio, won) * W2.deathMult(S, a);
  const fallen = [], promoted = [];
  for (const sid of a.squads.slice()) {
    const s = S.war.soldiers[sid];
    const die = rate * (1 - 0.2 * (s.perks.armour || 0)) * (1 - 0.06 * (s.rank - 1));
    if (rng() < die) { fallen.push(s); a.squads = a.squads.filter(x => x !== sid); delete S.war.soldiers[sid]; continue; }
    s.battles++;
    const ups = W2.soldierXp(S, s, (won ? 25 : 10) + Q / 8);
    if (ups.length) promoted.push({ s, rank: s.rank });
  }
  let heroXp = 0, heroLevels = 0;
  if (a.general) {
    heroXp = Math.round((won ? 1 : 0.4) * Q * 3 * (1 + (W2.mods(S).heroXp || 0)));
    heroLevels = E.gainXp(S, a.general, heroXp);
  }
  if (!won) {
    a.broken = 3;
    if (a.general) { S.war.wounded = S.war.wounded || {}; S.war.wounded[a.general] = 3; }
  }
  return { won, P: Math.round(P), Q: Math.round(Q), p, fallen, promoted, heroXp, heroLevels };
};

// ---------- battles you fight yourself (fieldbattle.js) ----------
// What you'd face leading an attack on a region now, or riding out against a Hollow army in it.
W2.fieldSpec = function (S, rid) {
  const r = S.war.regions[rid], R = REGIONS[rid];
  const fort = r.owner === 'h' && r.garrison > 0 && ['fort', 'citadel', 'mine', 'temple'].includes(R.kind);
  return { Q: W2.foePower(S, rid), fort, hollowHere: S.war.hollow.filter(h => h.at === rid) };
};
W2.canLead = (S, a, rid) => !a.broken && a.squads.length && a.acted !== S.war.day && (a.at === rid || W2.canMove(S, a, rid)) && W2.foePower(S, rid) > 0;
// Books the result of a battle you fought yourself. out: { won, dead: [sid], Q, retreat }.
W2.fieldResult = function (S, a, rid, out, rng) {
  rng = rng || Math.random;
  const w = S.war, fallen = [], promoted = [];
  a.acted = w.day; a.target = null;
  for (const sid of a.squads.slice()) {
    const s = w.soldiers[sid];
    if (out.dead.includes(sid) && rng() < 0.6 * (1 - 0.2 * (s.perks.armour || 0)) * (1 - 0.04 * (s.rank - 1))) {
      fallen.push(s); a.squads = a.squads.filter(x => x !== sid); delete w.soldiers[sid]; continue;
    }
    s.battles++;
    if (out.retreat && !out.won) continue;
    const ups = W2.soldierXp(S, s, (out.won ? 35 : 12) + out.Q / 7);
    if (ups.length) promoted.push({ s, rank: s.rank });
  }
  let heroXp = 0, heroLevels = 0;
  if (a.general) { heroXp = Math.round((out.won ? 1.2 : 0.4) * out.Q * 3 * (1 + (W2.mods(S).heroXp || 0))); heroLevels = E.gainXp(S, a.general, heroXp); }
  const rep = { army: a.name, where: REGIONS[rid].name, won: out.won, fallen, promoted, heroXp, heroLevels, captured: false };
  if (out.won) {
    w.hollow = w.hollow.filter(h => h.at !== rid);
    a.at = rid;
    const r = w.regions[rid];
    if (r.owner === 'h') { r.owner = 'p'; r.garrison = 0; r.taken++; rep.captured = true; }
    r.siege = 0;
  } else {
    a.broken = out.retreat ? 1 : 3;
    if (a.general && !out.retreat) { w.wounded = w.wounded || {}; w.wounded[a.general] = 3; }
  }
  return rep;
};
// ---------- orders ----------
// The Hollow Gate stays sealed until all three marshals are dead.
W2.LIEUTENANTS = { greyfort: { t: 'grieve', flag: 'grieve_dead', scene: 'grieve_corner', after: 'grieve_dies', sprite: 'hand' }, kingsbridge: { t: 'cinder', flag: 'cinder_dead', scene: 'cinder_corner', after: 'cinder_dies', sprite: 'pitmage' }, temple: { t: 'saint', flag: 'saint_dead', scene: 'saint_corner', after: 'saint_dies', sprite: 'drowned' } };
W2.locked = (S, rid) => !!REGIONS[rid].locked && !(S.flags && S.flags.gate_open);
W2.marshalsAlive = S => Object.values(W2.LIEUTENANTS).filter(l => !(S.flags && S.flags[l.flag])).length;
W2.canMove = (S, a, rid) => a.at !== rid && (NEAR[a.at] || []).includes(rid) && !W2.locked(S, rid);
W2.order = function (S, armyId, rid) {
  const a = S.war.armies.find(x => x.id === armyId);
  if (!a) return 'No such army.';
  if (!a.squads.length) return 'That army has no soldiers.';
  if (a.broken && rid) return `${a.name} is regrouping for ${a.broken} more day${a.broken > 1 ? 's' : ''}.`;
  if (rid && !W2.canMove(S, a, rid)) return 'Armies march one region a day, along the roads.';
  a.target = rid || null;
  return null;
};

// ---------- the Hollow ----------
// Shortest path by roads (any owner), for Hollow armies marching on a target.
W2.path = function (from, to) {
  const prev = { [from]: null }, q = [from];
  while (q.length) { const c = q.shift(); if (c === to) break; for (const n of NEAR[c] || []) if (!(n in prev)) { prev[n] = c; q.push(n); } }
  const out = [];
  for (let c = to; c && c !== from; c = prev[c]) out.unshift(c);
  return out;
};
// The Hollow grow with time and with how much you've taken from them.
W2.hollowPower = S => Math.round((50 + 6 * S.war.day + 30 * Object.values(S.war.regions).reduce((t, r) => t + (r.taken ? 1 : 0), 0)) * (1 + 0.1 * W2.marshalsAlive(S)));
W2.spawn = function (S, rng) {
  rng = rng || Math.random;
  const forts = Object.keys(S.war.regions).filter(id => S.war.regions[id].owner === 'h' && S.war.regions[id].garrison > 0);
  const cap = Math.min(5, 1 + Math.floor(S.war.day / 4));
  if (!forts.length || S.war.hollow.length >= cap) return null;
  const targets = W2.owned(S);
  if (!targets.length) return null;
  const from = forts[Math.floor(rng() * forts.length)];
  // Prefer places with people in them, then whatever is nearest.
  const score = id => W2.path(from, id).length - (REGIONS[id].named ? 1.5 : 0) - (id === 'emberwake' ? -1 : 0) + rng();
  const to = targets.sort((x, y) => score(x) - score(y))[0];
  const h = { id: S.war.nextHid++, from, at: from, to, power: Math.round(W2.hollowPower(S) * (0.8 + rng() * 0.4)), name: ['A Hollow warband', 'A Hollow column', 'A Hollow raiding party', 'A Hollow host'][Math.floor(rng() * 4)] };
  S.war.hollow.push(h);
  return h;
};

// ---------- the day ----------
// Runs one day of the war. Returns a report: battles, captures, losses, income, and whether Emberwake is attacked tonight.
W2.day = function (S, rng) {
  rng = rng || Math.random;
  const w = S.war, rep = { day: w.day, lines: [], battles: [], captured: [], lost: [], promoted: [], fallen: 0, siege: null };
  const say = (t, cls) => rep.lines.push({ t, cls });
  // 1. your armies march and attack
  for (const a of w.armies) {
    if (a.broken) { a.broken--; continue; }
    if (a.acted === w.day) { a.target = null; continue; }
    if (!a.target) continue;
    const rid = a.target; a.target = null;
    const r = w.regions[rid];
    const enemy = W2.foePower(S, rid);
    if (enemy > 0) {
      const b = W2.battle(S, a, enemy, 'atk', rng);
      rep.battles.push(Object.assign({ army: a.name, where: REGIONS[rid].name, attack: true }, b));
      rep.fallen += b.fallen.length; rep.promoted.push(...b.promoted);
      if (b.won) {
        w.hollow = w.hollow.filter(h => h.at !== rid);
        a.at = rid;
        if (r.owner === 'h') { r.owner = 'p'; r.garrison = 0; r.taken++; rep.captured.push(rid); say(`${a.name} takes ${REGIONS[rid].name}!`, 'good'); }
        else say(`${a.name} drives the Hollow from ${REGIONS[rid].name}.`, 'good');
      } else say(`${a.name} is thrown back from ${REGIONS[rid].name}. ${b.fallen.length} fall.`, 'bad');
    } else { a.at = rid; if (r.owner === 'h' || r.lost) { r.owner = 'p'; rep.captured.push(rid); say(`${a.name} marches into ${REGIONS[rid].name} unopposed.`); } }
  }
  // 2. the Hollow march
  for (const h of w.hollow.slice()) {
    const route = W2.path(h.at, h.to);
    if (route.length && !(w.regions[h.at].owner === 'p' && h.besieging)) { h.at = route[0]; h.besieging = 0; }
    const r = w.regions[h.at], here = w.armies.filter(a => a.at === h.at && a.squads.length);
    if (r.owner !== 'p') continue;
    if (here.length) {
      const a = here.sort((x, y) => W2.armyPower(S, y, 'def') - W2.armyPower(S, x, 'def'))[0];
      const b = W2.battle(S, a, h.power * (1 / (FORT_DEF[REGIONS[h.at].kind] || 1)), 'def', rng);
      rep.battles.push(Object.assign({ army: a.name, where: REGIONS[h.at].name, attack: false, foe: h.name }, b));
      rep.fallen += b.fallen.length; rep.promoted.push(...b.promoted);
      if (b.won) { w.hollow = w.hollow.filter(x => x !== h); say(`${a.name} breaks ${h.name.toLowerCase()} at ${REGIONS[h.at].name}.`, 'good'); continue; }
      say(`${h.name} beats ${a.name} at ${REGIONS[h.at].name}.`, 'bad');
      a.at = W2.retreat(S, h.at);
      h.power = Math.round(h.power * 0.7);
    }
    if (h.at === 'emberwake') { rep.siege = { power: h.power, hid: h.id }; say(`${h.name} reaches Emberwake. Man the walls tonight!`, 'bad'); continue; }
    h.besieging = (h.besieging || 0) + 1;
    if (h.besieging === 1) { r.siege = 1; say(`${h.name} besieges ${REGIONS[h.at].name}. Relieve it by tomorrow or it falls.`, 'bad'); continue; }
    // falls
    r.siege = 0;
    if (REGIONS[h.at].named && !r.lost) { r.owner = 'h'; r.lost = true; r.garrison = Math.round(h.power * 0.5); rep.lost.push(h.at); say(`${REGIONS[h.at].name} falls. ${REGIONS[h.at].people.replace(/^./, c => c.toUpperCase())} are gone.`, 'bad'); }
    else { r.owner = 'h'; r.garrison = Math.round(h.power * 0.6); rep.lost.push(h.at); say(`${REGIONS[h.at].name} falls to the Hollow.`, 'bad'); }
    w.hollow = w.hollow.filter(x => x !== h);
  }
  for (const id in w.regions) if (!w.hollow.some(h => h.at === id)) w.regions[id].siege = 0;
  // 3. new Hollow armies
  w.spawnT--;
  if (w.spawnT <= 0) { const h = W2.spawn(S, rng); if (h) say(`${h.name} marches out of ${REGIONS[h.from].name}, heading for ${REGIONS[h.to].name}.`, 'warn'); w.spawnT = w.day < 8 ? 3 : 2; }
  // Hollow garrisons rebuild slowly
  for (const id in w.regions) { const r = w.regions[id]; if (r.owner === 'h' && REGIONS[id].garrison) r.garrison = Math.min(REGIONS[id].garrison * 1.5, r.garrison + 3); }
  // 4. income, healing, wounds
  const inc = W2.income(S);
  S.gold += inc.gold || 0; w.levy += inc.levy || 0;
  for (const m of ['ore', 'starsteel', 'emberglass']) if (inc[m]) S.mats[m] = (S.mats[m] || 0) + inc[m];
  rep.income = inc;
  const heal = W2.mods(S).armyHeal ? 2 : 1;
  for (const a of w.armies) if (a.broken) a.broken = Math.max(0, a.broken - (heal - 1));
  for (const id in (w.wounded || {})) { w.wounded[id] = Math.max(0, w.wounded[id] - 1); if (!w.wounded[id]) delete w.wounded[id]; }
  if (W2.mods(S).shop) S.shopTier = Math.max(S.shopTier, W2.mods(S).shop);
  w.day++;
  w.reports.unshift(rep); w.reports = w.reports.slice(0, 10);
  return rep;
};
// Where a beaten army falls back to: the nearest region you hold, Emberwake if nothing else.
W2.retreat = function (S, from) {
  for (const n of NEAR[from] || []) if (W2.owns(S, n)) return n;
  return 'emberwake';
};
// After a siege night at Emberwake: the attacking Hollow army is gone either way, but losing burns stores.
W2.siegeResult = function (S, hid, won) {
  S.war.hollow = S.war.hollow.filter(h => h.id !== hid);
  if (!won) { const lost = Math.floor(S.gold * 0.2); S.gold -= lost; S.war.levy = Math.floor(S.war.levy / 2); return lost; }
  return 0;
};
W2.siegeNight = power => Math.max(1, Math.min(12, Math.round(power / 35)));

if (E) E.warMods = S => W2.mods(S);
root.WAR = W2;
if (typeof module !== 'undefined' && module.exports) module.exports = W2;
})(typeof window !== 'undefined' ? window : globalThis);
