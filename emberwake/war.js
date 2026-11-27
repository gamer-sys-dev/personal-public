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

// ---------- companies ----------
// Soldiers serve in companies of one kind. A company ranks up as a whole (veterans teach the new blood),
// earns stars and perk points, and loses men in battle. power is per soldier.
const TYPES = {
  sword:  { name: 'Swordsmen', power: 3, gold: 30, levy: 0.4, desc: 'Steady line infantry.', cls: 'infantry', sprite: 'm_sword' },
  archer: { name: 'Archers', power: 2.7, gold: 30, levy: 0.4, desc: 'Strong when defending.', def: 0.2, cls: 'archers', sprite: 'm_archer' },
  spear:  { name: 'Spearmen', power: 3.6, gold: 45, levy: 0.4, req: ['barracks', 1], desc: 'Break charges and big brutes.', cls: 'infantry', sprite: 'm_spear' },
  priest: { name: 'Priests', power: 1.8, gold: 45, levy: 0.4, req: ['barracks', 1], desc: 'Each priest in an army saves soldiers who would have died.', saves: 0.012, cls: 'priests', sprite: 'm_priest' },
  knight: { name: 'Knights', power: 6, gold: 90, levy: 0.8, req: ['barracks', 2], desc: 'Heavy cavalry of the old order.', cls: 'cavalry', sprite: 'm_knight' },
  rider:  { name: 'Outriders', power: 4.5, gold: 70, levy: 0.8, req: ['region', 'ashby'], desc: 'Fast horse from Ashby. Strong when attacking.', atk: 0.2, cls: 'cavalry', sprite: 'm_knight' },
};
const RANKS = ['Green', 'Drilled', 'Seasoned', 'Veteran', 'Hardened', 'Elite', 'Famous', 'Renowned', 'Heroic', 'Legendary'];
const RANK_XP = [0, 75, 200, 400, 700, 1100, 1600, 2250, 3000, 4000];
const STAR_AT = [3, 5, 7, 9, 10];
const PERKS = {
  might:   { name: 'Might', max: 5, desc: '+10% strength per rank' },
  armour:  { name: 'Armour', max: 3, desc: '-20% deaths per rank' },
  assault: { name: 'Assault', max: 3, desc: '+15% when attacking per rank' },
  bulwark: { name: 'Bulwark', max: 3, desc: '+15% when defending per rank' },
  leader:  { name: 'Leader', max: 3, desc: '+4% to the whole army per rank' },
};
const COMPANY_NAMES = ['Ashby', 'Emberwake', 'Millbrook', 'Haywood', 'Brightwater', 'Hillside', 'Thornwood', 'Riverside', 'Old Guard', 'Lantern', 'Greyhill', 'Fenwick'];
const W2 = {};
W2.REGIONS = REGIONS; W2.ROADS = ROADS; W2.NEAR = NEAR; W2.TYPES = TYPES; W2.RANKS = RANKS; W2.PERKS = PERKS; W2.FORT_DEF = FORT_DEF;
W2.COMPANIES = 6; W2.COMPANY_MAX = 40;
W2.active = S => !!(S.war && S.war.on);

// ---------- state ----------
W2.start = function (S) {
  if (S.war && S.war.on) return W2.upgrade(S);
  const regions = {};
  for (const id in REGIONS) regions[id] = { owner: REGIONS[id].owner, garrison: REGIONS[id].garrison || 0, siege: 0, lost: false, taken: 0 };
  S.war = { v: 2, on: true, day: 1, levy: 10, regions, armies: [], nextAid: 1, nextCid: 1, hollow: [], nextHid: 1, reports: [], spawnT: 2 };
  const a = W2.newArmy(S, 'First Company');
  W2.addCompany(S, a, 'sword', 16); W2.addCompany(S, a, 'archer', 14);
  return S.war;
};
// Saves from the first version of the war: named squads become companies of their kind.
W2.upgrade = function (S) {
  const w = S.war;
  if (w.v === 2) return w;
  w.v = 2; w.nextCid = w.nextCid || 1; w.levy = Math.max(w.levy || 0, 10);
  w.armies = w.armies || []; w.hollow = w.hollow || []; w.reports = w.reports || [];
  const soldiers = w.soldiers || {};
  for (const a of w.armies) { a.squadsOld = a.squads || []; a.companies = []; }
  for (const a of w.armies) {
    const by = {};
    for (const sid of a.squadsOld) { const s = soldiers[sid]; if (!s || !TYPES[s.type]) continue; (by[s.type] = by[s.type] || []).push(s); }
    for (const t in by) { const c = W2.addCompany(S, a, t, by[t].length * 5); c.rank = Math.max(...by[t].map(s => s.rank)); c.xp = RANK_XP[c.rank - 1]; }
    delete a.squads; delete a.squadsOld; delete a.target;
    a.acted = 0; a.broken = 0;
  }
  w.reports = []; // old reports name soldiers that no longer exist
  delete w.soldiers; delete w.nextSid;
  return w;
};
W2.newArmy = function (S, name) {
  const a = { id: S.war.nextAid++, name: name || W2.armyName(S), general: null, companies: [], at: 'emberwake', acted: 0, broken: 0 };
  S.war.armies.push(a);
  return a;
};
W2.armyName = S => ['First Company', 'Second Army', 'The Ashby Guard', 'The Grey Banners', 'The Ember Host', 'The Last Watch'][S.war.armies.length] || 'Army ' + (S.war.armies.length + 1);
W2.armySlots = S => Math.min(6, 1 + (S.buildings.barracks || 0) + W2.owned(S).filter(id => REGIONS[id].kind === 'fort').length + (W2.owns(S, 'ashby') ? 1 : 0));
// How many soldiers one army can field: grows with barracks and every fort or mine you hold.
W2.armyCap = S => 30 + 15 * (S.buildings.barracks || 0) + 10 * W2.owned(S).filter(id => ['fort', 'mine', 'temple', 'citadel'].includes(REGIONS[id].kind)).length + (W2.owns(S, 'ashby') ? 5 : 0);
W2.soldiers = a => a.companies.reduce((t, c) => t + c.n, 0);
W2.addCompany = function (S, a, type, n) {
  const used = new Set(S.war.armies.flatMap(x => x.companies.map(c => c.name)));
  let name = TYPES[type].name;
  for (const p of COMPANY_NAMES) if (!used.has(p + ' ' + TYPES[type].name)) { name = p + ' ' + TYPES[type].name; break; }
  const c = { id: S.war.nextCid++, type, n, rank: 1, xp: 0, perks: {}, battles: 0, name };
  a.companies.push(c);
  return c;
};
W2.unlocked = (S, t) => { const r = TYPES[t].req; if (!r) return true; return r[0] === 'barracks' ? (S.buildings.barracks || 0) >= r[1] : W2.owns(S, r[1]); };
W2.recruitCost = (t, n) => ({ gold: Math.round(TYPES[t].gold * n), levy: Math.ceil(TYPES[t].levy * n) });
// Five at a time into a company of that kind (a new one if there's none, or it's full).
W2.recruit = function (S, armyId, t, n) {
  n = n || 5;
  const a = S.war.armies.find(x => x.id === armyId), cost = W2.recruitCost(t, n);
  if (!a || !W2.unlocked(S, t)) return 'Not trained yet.';
  if (a.at !== 'emberwake' && !W2.owns(S, a.at)) return 'Recruits can only reach an army on your own ground.';
  if (W2.soldiers(a) + n > W2.armyCap(S)) return `That army is at its limit of ${W2.armyCap(S)} soldiers.`;
  if (S.gold < cost.gold || S.war.levy < cost.levy) return 'Not enough gold or levy.';
  let c = a.companies.find(x => x.type === t && x.n + n <= W2.COMPANY_MAX);
  if (!c && a.companies.length >= W2.COMPANIES) return 'No room for another company in that army.';
  S.gold -= cost.gold; S.war.levy -= cost.levy;
  if (c) c.n += n; else c = W2.addCompany(S, a, t, n);
  return c;
};
W2.owns = (S, id) => S.war.regions[id] && S.war.regions[id].owner === 'p';
W2.owned = S => Object.keys(S.war.regions).filter(id => W2.owns(S, id));

// ---------- ranks, stars, perks ----------
W2.stars = c => STAR_AT.filter(r => c.rank >= r).length;
W2.points = c => (c.rank - 1) + W2.stars(c) - Object.values(c.perks).reduce((a, b) => a + b, 0);
W2.title = c => RANKS[c.rank - 1];
W2.buyPerk = function (c, k) { if (W2.points(c) <= 0 || (c.perks[k] || 0) >= PERKS[k].max) return false; c.perks[k] = (c.perks[k] || 0) + 1; return true; };
W2.companyXp = function (S, c, n) {
  c.xp += Math.round(n * (1 + (W2.mods(S).soldierXp || 0)));
  const ups = [];
  while (c.rank < 10 && c.xp >= RANK_XP[c.rank]) { c.rank++; ups.push(c.rank); }
  return ups;
};
W2.nextRankXp = c => (c.rank < 10 ? RANK_XP[c.rank] : null);
W2.companyPower = function (S, c, mode) {
  const d = TYPES[c.type], p = c.perks;
  let n = c.n * d.power * (1 + 0.2 * (c.rank - 1)) * (1 + 0.1 * W2.stars(c)) * (1 + 0.1 * (p.might || 0));
  if (mode === 'atk') n *= 1 + 0.15 * (p.assault || 0) + (d.atk || 0);
  else n *= 1 + 0.15 * (p.bulwark || 0) + (d.def || 0);
  return n;
};
// ---------- generals ----------
W2.generalBonus = function (S, a) {
  if (!a.general) return 0;
  const h = S.heroes[a.general];
  return 0.02 * h.lvl + (h.awakened ? 0.15 : 0);
};
W2.setGeneral = function (S, armyId, heroId) {
  const a = S.war.armies.find(x => x.id === armyId);
  if (!a) return 'No such army.';
  if (heroId && S.war.armies.some(x => x.general === heroId && x !== a)) return 'Already leading another army.';
  if (heroId && (S.flags.gone || []).includes(heroId)) return 'Not here.';
  a.general = heroId || null;
  return null;
};
W2.generalOf = (S, heroId) => (S.war && S.war.on ? S.war.armies.find(a => a.general === heroId) : null) || null;
W2.wounded = (S, heroId) => !!(S.war && S.war.wounded && S.war.wounded[heroId] > 0);

// ---------- strength, plainly ----------
// Every number on the army card, so the player can see where the strength comes from.
W2.breakdown = function (S, a, mode) {
  const soldiers = a.companies.reduce((t, c) => t + W2.companyPower(S, c, mode), 0);
  const lead = a.companies.reduce((t, c) => t + 0.04 * (c.perks.leader || 0), 0);
  const gen = W2.generalBonus(S, a), held = W2.mods(S).soldierPower || 0, tired = a.broken ? -0.4 : 0;
  const total = Math.round(soldiers * (1 + lead + gen + held + tired));
  return { soldiers: Math.round(soldiers), lead, gen, held, tired, total };
};
W2.armyPower = (S, a, mode) => W2.breakdown(S, a, mode).total;
// What's waiting in a region: its garrison behind any walls, plus Hollow armies standing there.
W2.foeBreakdown = function (S, rid) {
  const r = S.war.regions[rid], k = FORT_DEF[REGIONS[rid].kind] || 1;
  const garrison = r.owner === 'h' ? Math.round(r.garrison) : 0, walls = r.owner === 'h' ? k : 1;
  const armies = S.war.hollow.filter(h => h.at === rid).reduce((t, h) => t + h.power, 0);
  return { garrison, walls, armies, total: Math.round(garrison * walls + armies) };
};
W2.foePower = (S, rid) => W2.foeBreakdown(S, rid).total;
// The odds are just the two numbers against each other: even at equal strength, near certain at double.
W2.odds = (P, Q) => (Q <= 0 ? 1 : Math.max(0.03, Math.min(0.97, 0.5 + 1.6 * (P - Q) / (P + Q))));
W2.deathShare = (P, Q, won) => (won ? Math.max(0.03, Math.min(0.3, 0.18 * Q / Math.max(1, P))) : Math.min(0.6, 0.3 + 0.15 * Q / Math.max(1, P)));
W2.savesIn = a => Math.min(0.5, a.companies.reduce((t, c) => t + (TYPES[c.type].saves || 0) * c.n, 0));
W2.forecast = function (S, a, rid) {
  const mine = W2.breakdown(S, a, 'atk'), foe = W2.foeBreakdown(S, rid), p = W2.odds(mine.total, foe.total);
  const lost = Math.round(W2.soldiers(a) * W2.deathShare(mine.total, foe.total, true) * (1 - W2.savesIn(a)));
  return { mine, foe, p, lost };
};
// Takes losses across companies, veterans dying less. share: fraction of the army that falls.
W2.takeLosses = function (S, a, share, rng) {
  rng = rng || Math.random;
  const saved = 1 - W2.savesIn(a), out = [];
  for (const c of a.companies) {
    const k = share * saved * (1 - 0.2 * (c.perks.armour || 0)) * (1 - 0.04 * (c.rank - 1));
    const dead = Math.min(c.n, Math.round(c.n * k + (rng() - 0.5)));
    if (dead > 0) { c.n -= dead; out.push({ name: c.name, dead }); }
  }
  a.companies = a.companies.filter(c => c.n > 0);
  return out;
};
W2.reward = function (S, a, Q, won) {
  const promoted = [];
  for (const c of a.companies) {
    c.battles++;
    const ups = W2.companyXp(S, c, (won ? 20 : 8) + Q / 10);
    if (ups.length) promoted.push({ name: c.name, rank: c.rank });
  }
  let heroXp = 0, heroLevels = 0;
  if (a.general) { heroXp = Math.round((won ? 1 : 0.4) * Q * 3 * (1 + (W2.mods(S).heroXp || 0))); heroLevels = E.gainXp(S, a.general, heroXp); }
  return { promoted, heroXp, heroLevels };
};
// One auto-resolved battle. Returns the report.
W2.battle = function (S, a, Q, rng) {
  rng = rng || Math.random;
  const P = W2.armyPower(S, a, 'atk'), p = W2.odds(P, Q), won = rng() < p;
  const losses = W2.takeLosses(S, a, W2.deathShare(P, Q, won), rng);
  const rew = W2.reward(S, a, Q, won);
  if (!won) { a.broken = 2; if (a.general) { S.war.wounded = S.war.wounded || {}; S.war.wounded[a.general] = 2; } }
  return Object.assign({ won, P, Q, p, losses }, rew);
};
// The war's side of a won battle: the region changes hands, Hollow armies there are gone.
W2.capture = function (S, a, rid) {
  const r = S.war.regions[rid];
  S.war.hollow = S.war.hollow.filter(h => h.at !== rid);
  a.at = rid; r.siege = 0;
  if (r.owner === 'h') { r.owner = 'p'; r.garrison = 0; r.taken++; return true; }
  return false;
};

// ---------- your turn: one action per army per day ----------
W2.locked = (S, rid) => !!REGIONS[rid].locked && !(S.flags && S.flags.gate_open);
W2.LIEUTENANTS = { greyfort: { t: 'grieve', flag: 'grieve_dead', scene: 'grieve_corner', after: 'grieve_dies', sprite: 'hand' }, kingsbridge: { t: 'cinder', flag: 'cinder_dead', scene: 'cinder_corner', after: 'cinder_dies', sprite: 'pitmage' }, temple: { t: 'saint', flag: 'saint_dead', scene: 'saint_corner', after: 'saint_dies', sprite: 'drowned' } };
W2.marshalsAlive = S => Object.values(W2.LIEUTENANTS).filter(l => !(S.flags && S.flags[l.flag])).length;
W2.ready = (S, a) => a.acted !== S.war.day && !a.broken && a.companies.length > 0;
// What the selected army can do with a region: 'march', 'attack', 'relieve' (attack Hollow besieging your place), or why not.
W2.action = function (S, a, rid) {
  if (!a || W2.locked(S, rid)) return { kind: null, why: 'Sealed.' };
  const foe = W2.foePower(S, rid), mine = W2.owns(S, rid);
  const near = a.at === rid || (NEAR[a.at] || []).includes(rid);
  if (!near) return { kind: null, why: `${a.name} is at ${REGIONS[a.at].name}. Armies only reach the next region along a road.` };
  if (a.broken) return { kind: null, why: `${a.name} is regrouping for ${a.broken} more day${a.broken > 1 ? 's' : ''}.` };
  if (a.acted === S.war.day) return { kind: null, why: `${a.name} has already acted today. End the day.` };
  if (!a.companies.length) return { kind: null, why: 'That army has no soldiers.' };
  if (foe > 0) return { kind: mine ? 'relieve' : 'attack' };
  if (a.at === rid) return { kind: null, why: `${a.name} is here.` };
  if (mine) return { kind: 'march' };
  return { kind: 'attack' };
};
W2.march = function (S, a, rid) {
  const act = W2.action(S, a, rid);
  if (act.kind !== 'march') return act.why || 'Can\'t march there.';
  a.at = rid; a.acted = S.war.day;
  return null;
};
// Attack (or relieve) now, auto-resolved. Returns the report.
W2.attack = function (S, a, rid, rng) {
  const act = W2.action(S, a, rid);
  if (act.kind !== 'attack' && act.kind !== 'relieve') return { error: act.why || 'Nothing to attack there.' };
  const Q = W2.foePower(S, rid), b = W2.battle(S, a, Q, rng);
  a.acted = S.war.day;
  b.where = REGIONS[rid].name; b.army = a.name;
  if (b.won) b.captured = W2.capture(S, a, rid);
  return b;
};
// ---------- battles you fight yourself (turn based) ----------
// The army goes in as up to four units, one per kind (infantry, archers, cavalry, priests), each as strong as its share.
const CLS = {
  infantry: { name: 'Infantry', skill: 'company_strike', sprite: 'm_sword' },
  archers:  { name: 'Archers', skill: 'company_volley', sprite: 'm_archer' },
  cavalry:  { name: 'Cavalry', skill: 'company_charge', sprite: 'm_knight', spd: 5 },
  priests:  { name: 'Priests', skill: 'company_mend', sprite: 'm_priest' },
};
W2.CLS = CLS;
// A unit is a level-L Hollow soldier scaled by its strength: more men, more health; better men, harder hits.
const unitStats = (P, L, t) => {
  const b = E.enemyStats(D.ENEMIES[t || 'soldier'], L);
  return { maxHp: Math.round(b.maxHp * (1.2 + P / 55)), str: Math.round(b.str * (0.8 + P / 110)), mag: Math.round(Math.max(b.str, b.mag) * (0.6 + P / 400)), def: Math.round(b.def), res: Math.round(b.res), spd: Math.round(b.spd) };
};
W2.battleUnits = function (S, a, L) {
  const b = W2.breakdown(S, a, 'atk'), mult = b.total / Math.max(1, b.soldiers), out = [];
  for (const cls in CLS) {
    const cs = a.companies.filter(c => TYPES[c.type].cls === cls);
    if (!cs.length) continue;
    const P = cs.reduce((t, c) => t + W2.companyPower(S, c, 'atk'), 0) * mult, n = cs.reduce((t, c) => t + c.n, 0);
    const st = unitStats(P, L);
    if (CLS[cls].spd) st.spd += CLS[cls].spd;
    out.push(Object.assign(st, { cls, name: `${CLS[cls].name} ×${n}`, sprite: (cs.find(c => c.type !== 'sword') || cs[0]) && TYPES[cs[0].type].sprite, skill: CLS[cls].skill, lvl: L }));
  }
  return out;
};
// The Hollow side: their strength split across a few companies of soldiers, hounds and acolytes.
// When you fight it yourself your party is there too, so the Hollow bring matching strength (W2.partyWorth).
W2.partyWorth = (S, k) => Math.round((k || 3) * S.party.reduce((t, id) => t + S.heroes[id].lvl, 0));
W2.hordeSpecs = function (S, rid, L, k) {
  const Q = W2.foePower(S, rid) + W2.partyWorth(S, k), parts = Q > 260 ? [['soldier', 0.45], ['soldier', 0.2], ['hound', 0.2], ['acolyte', 0.15]] : Q > 120 ? [['soldier', 0.55], ['hound', 0.25], ['acolyte', 0.2]] : [['soldier', 0.65], ['hound', 0.35]];
  const names = { soldier: 'Hollow Soldiers', hound: 'Shadow Hounds', acolyte: 'Hollow Acolytes' };
  void names;
  // outnumbered, they hit harder; outnumbering them, they hit softer
  const a0 = S.war.armies.find(x => x.id === S.war.fightingArmy), mine = (a0 ? W2.armyPower(S, a0, 'atk') : 100) + W2.partyWorth(S, k), ratio = Math.max(0.5, Math.min(3, (Q - W2.partyWorth(S, k) * 0.5) / Math.max(1, mine - W2.partyWorth(S, k) * 0.5)));
  return parts.map(([t, k2]) => { const P = Q * k2, st = unitStats(P, L, t); st.str = Math.round(st.str * (0.3 + 0.85 * ratio)); st.def = Math.round(st.def * (0.8 + 0.4 * ratio)); return { t, lvl: L, horde: true, xpx: 2, hpSet: st.maxHp, strSet: st.str, defSet: st.def, name: `${names[t]} ×${Math.max(3, Math.round(P / 3))}` }; });
};
// Books a battle you fought yourself. out: { won, losses: { cls: share of that unit's health lost } }.
W2.foughtResult = function (S, a, rid, out, rng) {
  rng = rng || Math.random;
  const Q = W2.foePower(S, rid), w = S.war, saved = 1 - W2.savesIn(a), dead = [];
  for (const c of a.companies) {
    const share = (out.losses[TYPES[c.type].cls] || 0) * 0.5 * saved * (1 - 0.2 * (c.perks.armour || 0)) * (1 - 0.04 * (c.rank - 1));
    const n = Math.min(c.n, Math.round(c.n * share + (rng() - 0.5)));
    if (n > 0) { c.n -= n; dead.push({ name: c.name, dead: n }); }
  }
  a.companies = a.companies.filter(c => c.n > 0);
  const rew = W2.reward(S, a, Q * 1.25, out.won);
  a.acted = w.day;
  const rep = Object.assign({ won: out.won, Q, losses: dead, where: REGIONS[rid].name, army: a.name }, rew);
  if (out.won) rep.captured = W2.capture(S, a, rid);
  else a.broken = 2;
  return rep;
};
// ---------- bonuses and income ----------
W2.mods = function (S) {
  const out = { stat: 0, heroXp: 0, soldierXp: 0, soldierPower: 0, creatureXp: 0, armyHeal: 0, shop: 0 };
  if (!S.war || !S.war.on) return out;
  for (const id of W2.owned(S)) {
    if (S.war.regions[id].lost) continue;
    const b = REGIONS[id].bonus || {};
    for (const k in b) out[k] = k === 'shop' ? Math.max(out[k], b[k]) : out[k] + b[k];
  }
  return out;
};
W2.income = function (S) {
  const out = { gold: 0, levy: 2 };
  for (const id of W2.owned(S)) if (!S.war.regions[id].lost) for (const k in (REGIONS[id].yields || {})) out[k] = (out[k] || 0) + REGIONS[id].yields[k];
  return out;
};

// ---------- the Hollow's turn ----------
W2.path = function (from, to) {
  const prev = { [from]: null }, q = [from];
  while (q.length) { const c = q.shift(); if (c === to) break; for (const n of NEAR[c] || []) if (!(n in prev)) { prev[n] = c; q.push(n); } }
  const out = [];
  for (let c = to; c && c !== from; c = prev[c]) out.unshift(c);
  return out;
};
W2.hollowPower = S => Math.round((50 + 6 * S.war.day + 30 * Object.values(S.war.regions).reduce((t, r) => t + (r.taken ? 1 : 0), 0)) * (1 + 0.1 * W2.marshalsAlive(S)));
W2.spawn = function (S, rng) {
  rng = rng || Math.random;
  const forts = Object.keys(S.war.regions).filter(id => S.war.regions[id].owner === 'h' && S.war.regions[id].garrison > 0);
  const cap = Math.min(5, 1 + Math.floor(S.war.day / 4));
  if (!forts.length || S.war.hollow.length >= cap) return null;
  const targets = W2.owned(S);
  if (!targets.length) return null;
  const from = forts[Math.floor(rng() * forts.length)];
  const score = id => W2.path(from, id).length - (REGIONS[id].named && !S.war.regions[id].lost ? 1.5 : 0) + rng();
  const to = targets.sort((x, y) => score(x) - score(y))[0];
  const h = { id: S.war.nextHid++, from, at: from, to, power: Math.round(W2.hollowPower(S) * (0.8 + rng() * 0.4)), name: ['A Hollow warband', 'A Hollow column', 'A Hollow raiding party', 'A Hollow host'][Math.floor(rng() * 4)] };
  S.war.hollow.push(h);
  return h;
};
W2.retreat = function (S, from) { for (const n of NEAR[from] || []) if (W2.owns(S, n)) return n; return 'emberwake'; };
// Ending the day: the Hollow march and attack, places under siege fall, holdings pay, wounds mend.
W2.day = function (S, rng) {
  rng = rng || Math.random;
  const w = S.war, rep = { day: w.day, lines: [], battles: [], captured: [], lost: [], siege: null };
  const say = (t, cls) => rep.lines.push({ t, cls });
  for (const h of w.hollow.slice()) {
    const route = W2.path(h.at, h.to);
    if (route.length && !(w.regions[h.at].owner === 'p' && h.besieging)) { h.at = route[0]; h.besieging = 0; }
    const r = w.regions[h.at], here = w.armies.filter(a => a.at === h.at && a.companies.length);
    if (r.owner !== 'p') continue;
    if (here.length) {
      // your army there defends: walls help, archers and Bulwark count
      const a = here.sort((x, y) => W2.armyPower(S, y, 'def') - W2.armyPower(S, x, 'def'))[0];
      const P = Math.round(W2.armyPower(S, a, 'def') * (FORT_DEF[REGIONS[h.at].kind] || 1)), p = W2.odds(P, h.power), won = rng() < p;
      const losses = W2.takeLosses(S, a, W2.deathShare(P, h.power, won), rng), rew = W2.reward(S, a, h.power, won);
      rep.battles.push(Object.assign({ army: a.name, where: REGIONS[h.at].name, defend: true, won, P, Q: h.power, p, losses }, rew));
      if (won) { w.hollow = w.hollow.filter(x => x !== h); say(`${a.name} holds ${REGIONS[h.at].name} and breaks ${h.name.toLowerCase()}.`, 'good'); continue; }
      say(`${h.name} beats ${a.name} at ${REGIONS[h.at].name}. They fall back to ${REGIONS[W2.retreat(S, h.at)].name}.`, 'bad');
      a.at = W2.retreat(S, h.at); a.broken = 2; h.power = Math.round(h.power * 0.7);
    }
    if (h.at === 'emberwake') { rep.siege = { power: h.power, hid: h.id }; say(`${h.name} reaches Emberwake. Man the walls tonight!`, 'bad'); continue; }
    h.besieging = (h.besieging || 0) + 1;
    if (h.besieging === 1) { r.siege = 1; say(`${h.name} besieges ${REGIONS[h.at].name}. Attack them there tomorrow or it falls.`, 'bad'); continue; }
    r.siege = 0;
    if (REGIONS[h.at].named && !r.lost) { r.lost = true; say(`${REGIONS[h.at].name} falls. ${REGIONS[h.at].people.replace(/^./, c => c.toUpperCase())} are gone.`, 'bad'); }
    else say(`${REGIONS[h.at].name} falls to the Hollow.`, 'bad');
    r.owner = 'h'; r.garrison = Math.round(h.power * 0.6); rep.lost.push(h.at);
    w.hollow = w.hollow.filter(x => x !== h);
  }
  for (const id in w.regions) if (!w.hollow.some(h => h.at === id)) w.regions[id].siege = 0;
  w.spawnT--;
  if (w.spawnT <= 0) { const h = W2.spawn(S, rng); if (h) say(`${h.name} (strength ${h.power}) marches out of ${REGIONS[h.from].name}, heading for ${REGIONS[h.to].name}.`, 'warn'); w.spawnT = w.day < 8 ? 3 : 2; }
  for (const id in w.regions) { const r = w.regions[id]; if (r.owner === 'h' && REGIONS[id].garrison) r.garrison = Math.min(REGIONS[id].garrison * 1.5, r.garrison + 3); }
  const inc = W2.income(S);
  S.gold += inc.gold || 0; w.levy += inc.levy || 0;
  for (const m of ['ore', 'starsteel', 'emberglass']) if (inc[m]) S.mats[m] = (S.mats[m] || 0) + inc[m];
  rep.income = inc;
  const heal = W2.mods(S).armyHeal ? 2 : 1;
  for (const a of w.armies) if (a.broken) a.broken = Math.max(0, a.broken - heal);
  for (const id in (w.wounded || {})) { w.wounded[id] = Math.max(0, w.wounded[id] - 1); if (!w.wounded[id]) delete w.wounded[id]; }
  if (W2.mods(S).shop) S.shopTier = Math.max(S.shopTier, W2.mods(S).shop);
  w.day++;
  w.reports.unshift(rep); w.reports = w.reports.slice(0, 10);
  return rep;
};
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
