// Emberwake: screens, menus and the battle UI. Rules live in engine.js.
(function () {
'use strict';
const D = window.DATA, W = window.WORLD, E = window.ENGINE, SP = window.SPRITES, SG = window.SIEGE, SUI = window.SIEGEUI;
let stopScene = null;
const AU = window.AUDIO || { unlock() {}, play() {}, sfx() {}, set() {} };
const MOOD = { thornwood: 'wood', millroad: 'wood', barrows: 'dark', fenmire: 'dark', tower: 'dark', greyfort_keep: 'dark', kingsbridge_town: 'dark', drowned_temple: 'dark', hollow_court: 'dread' };
const DREAD = ['the_raid', 'wren_hollow', 'tower_boss', 'millroad_boss', 'fenmire_out', 'dream_1', 'dream_2', 'tower_in', 'aldric_stair'];
const SAD = ['raid_after', 'wren_dies', 'aldric_holds', 'hale_redeemed', 'hale_ended', 'warden_end_dark', 'wren_banished'];
document.addEventListener('pointerdown', () => AU.unlock(), { capture: true });
const KEY = 'emberwake-save-v1';
const app = document.getElementById('app');
const ACT = {}; // every tap handler, by data-a name
let S = null;          // the save
let view = { name: 'title' };

// ---------- helpers ----------
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (a, b) => b ? Math.max(0, Math.min(100, a / b * 100)) : 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const T = ms => sleep(ms * (S && S.opts.speed === 2 ? 0.5 : 1));
// A sprite, or a hero's painted portrait (cropped to the face) where we have one.
const ART = window.ART || {};
const img = (id, px, cls) => {
  const s = SP.spriteURL(id, px);
  if (ART[id] && ART[id].portrait) return `<img class="face ${cls || ''}" src="${ART[id].portrait}" width="${s.w}" height="${s.h}" alt="">`;
  return `<img class="px ${cls || ''}" src="${s.url}" width="${s.w}" height="${s.h}" alt="">`;
};
const STAT_NAMES = { hp: 'HP', mp: 'MP', str: 'Strength', mag: 'Magic', def: 'Defence', res: 'Resistance', spd: 'Speed', crit: 'Critical %' };
const SHORT = { hp: 'HP', mp: 'MP', str: 'STR', mag: 'MAG', def: 'DEF', res: 'RES', spd: 'SPD', crit: 'CRIT' };
const STATUS = { poison: 'Poison', burn: 'Burn', slow: 'Slow', haste: 'Haste', defUp: 'Guard ▲', defDown: 'Armour ▼', resUp: 'Ward ▲', strUp: 'Fury ▲', taunt: 'Taunt', regen: 'Regen' };
const statLine = st => Object.keys(st || {}).map(k => `${st[k] > 0 ? '+' : ''}${st[k]} ${SHORT[k]}`).join(', ');
const heroName = id => D.HEROES[id].name;
const costText = c => [c.gold ? c.gold + ' g' : ''].concat(Object.keys(c.mats || {}).map(m => `<span class="${(S.mats[m] || 0) >= c.mats[m] ? '' : 'down'}">${c.mats[m]} ${D.MATS[m].name} (${S.mats[m] || 0})</span>`)).filter(Boolean).join(', ');

function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ } }
function load() {
  try { const t = localStorage.getItem(KEY); return t ? JSON.parse(t) : null; } catch (e) { return null; }
}
function toast(msg, ms) {
  const t = document.createElement('div');
  t.className = 'toast'; t.innerHTML = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms || 2400);
}
function go(name, extra) {
  view = Object.assign({ name }, extra || {}); render(); window.scrollTo(0, 0);
  AU.play(name === 'title' ? 'title' : name === 'area' ? MOOD[view.id] || 'wood' : name === 'market' ? 'arena' : 'keep');
  if (name === 'keep' && S && S.areas.barrows && S.areas.barrows.cleared && !S.flags.raid_done && !S.flags.seen.the_raid) setTimeout(startRaid, 500);
}
function render() {
  if (S) save();
  if (stopScene) { stopScene(); stopScene = null; }
  const f = SCREENS[view.name];
  app.innerHTML = f ? f() : '';
  const kc = document.getElementById('keepscene');
  if (kc && SUI) { try { stopScene = SUI.mountKeep(kc, S); } catch (e) { kc.remove(); } }
}
function overlay(html, cls) {
  closeOverlay();
  const o = document.createElement('div');
  o.className = 'overlay ' + (cls || ''); o.id = 'ov';
  o.innerHTML = html;
  document.body.appendChild(o);
  return o;
}
function closeOverlay() { const o = document.getElementById('ov'); if (o) o.remove(); }

function heroRow(id) {
  const h = S.heroes[id], st = E.heroStats(S, id);
  return `<div class="hero-mini ${h.hp <= 0 ? 'ko' : ''}">${img(D.HEROES[id].sprite, 3)}
    <div><div class="spread small"><b>${heroName(id)}</b><span class="muted">Lv ${h.lvl}${h.points ? ` <span class="pill on">${h.points} pt${h.points > 1 ? 's' : ''}</span>` : ''}</span></div>
    <div class="spread small muted" style="margin-top:3px"><span>HP ${h.hp}/${st.maxHp}</span><span>MP ${h.mp}/${st.maxMp}</span></div>
    <div class="grid2" style="gap:6px;margin-top:3px"><div class="bar ${h.hp < st.maxHp * .3 ? 'low' : ''}"><i style="width:${pct(h.hp, st.maxHp)}%"></i></div><div class="bar mp"><i style="width:${pct(h.mp, st.maxMp)}%"></i></div></div>
    ${h.hp <= 0 ? '<div class="small" style="color:var(--bad);margin-top:3px">Knocked out</div>' : ''}</div></div>`;
}
function creatureRow(c, extra) {
  const st = E.creatureStats(c);
  return `<div class="hero-mini ${c.hp <= 0 ? 'ko' : ''}">${img(E.creatureSprite(c), 2)}
    <div><div class="spread small"><b>${E.creatureName(c)}</b><span class="muted">Lv ${c.lvl} · ${W.STANCES[c.stance].name}</span></div>
    <div class="bar ${c.hp < st.maxHp * .3 ? 'low' : ''}" style="margin-top:5px"><i style="width:${pct(c.hp, st.maxHp)}%"></i></div>${extra || ''}</div></div>`;
}
function partyMini() {
  const c = E.creatureOf(S, S.companion);
  return S.party.map(heroRow).join('') + (c ? creatureRow(c) : '');
}
function partyStrip() {
  const c = E.creatureOf(S, S.companion);
  const cell = (sprite, name, hp, max, ko) => `<div class="strip-cell ${ko ? 'ko' : ''}">${img(sprite, 2)}<div class="grow"><div class="small">${name}</div><div class="bar ${hp < max * .3 ? 'low' : ''}"><i style="width:${pct(hp, max)}%"></i></div></div></div>`;
  return `<div class="strip" data-a="bag">${S.party.map(id => { const st = E.heroStats(S, id), h = S.heroes[id]; return cell(D.HEROES[id].sprite, heroName(id), h.hp, st.maxHp, h.hp <= 0); }).join('')}
    ${c ? cell(E.creatureSprite(c), E.creatureName(c), c.hp, E.creatureStats(c).maxHp, c.hp <= 0) : ''}</div>`;
}

function objective() {
  const f = S.flags, has = id => S.roster.includes(id);
  const lines = [];
  const next = D.AREAS.find(a => !S.areas[a.id].cleared);
  const main = {
    thornwood: 'Find whatever is killing the sheep in Thornwood.',
    millroad: 'Follow the trail to the Old Mill Road and deal with the bandits.',
    barrows: 'Cross the Barrow Hills, where the dead are walking.',
    fenmire: 'Find a way through Fenmire to the tower.',
    tower: 'Climb the Hollow Tower and face the Warden.',
  };
  lines.push(next ? main[next.id] : 'Chapter One is done. Every area is still open for training, taming and treasure.');
  if (f.hesk_quest && !f.poachers) lines.push('Side quest: free Hesk\'s animals from the poacher camp in Thornwood.');
  if (f.poachers && !has('hesk')) lines.push('Side quest: take the animals back to Hesk\'s hut.');
  if (S.areas.thornwood.cleared && !has('dace') && S.unlocked >= 2) lines.push('Rumour: the Mill Road bandits are holding a prisoner in their stockade.');
  if (has('dace') && !S.flags.got.lucky_coin) lines.push('Dace could open the old hunting lodge in Thornwood.');
  if (f.aldric_met && !f.seal_found) lines.push('Side quest: find King Edric\'s seal in the royal vault in the Barrow Hills.');
  if (f.seal_found && !has('aldric')) lines.push('Side quest: take the seal back to the knight\'s tomb.');
  if (f.morwen_met && !has('morwen')) lines.push(`Side quest: find Morwen's three lanterns in Fenmire (${E.lanterns(S)} of 3).`);
  if (has('aldric') && !S.flags.got.kings_signet) lines.push('Aldric can open the oathbound door in the Barrow Hills.');
  if (has('morwen') && !S.flags.got.witch_lantern) lines.push('Morwen can see the path through the mist in Fenmire.');
  return lines.map((l, i) => `<div class="${i ? 'small muted' : ''}" style="${i ? 'margin-top:6px' : ''}">${l}</div>`).join('');
}
function boardReady() { return W.BOARD.some(b => E.boardStatus(S, b) === 'ready'); }

// ---------- Story ----------
const STX = window.STORYX || { STORY5: {}, CHOICES: {} };
// Lines can carry a condition, and heroes who have left the party don't speak.
function lineOk(l) {
  const c = l[2], gone = S.flags.gone || [];
  if (l[0] && gone.includes(l[0])) return false;
  if (!c) return true;
  const neg = c[0] === '!', [kind, val] = (neg ? c.slice(1) : c).split(':');
  const v = kind === 'has' ? S.roster.includes(val) : !!S.flags[val];
  return neg ? !v : v;
}
const dynScenes = {};
function sceneLines(key) { return (dynScenes[key] || STX.STORY5[key] || D.STORY[key] || W.STORY2[key] || W.STORY3[key] || W.STORY4[key] || []).filter(lineOk); }
function scene(key, then) {
  if (STX.CHOICES[key]) { choiceScene(key, then); return; }
  if (SAD.includes(key)) AU.play('sad');
  else if (DREAD.includes(key)) AU.play('dread');
  const lines = sceneLines(key);
  if (!lines.length) { then && then(); return; }
  S.flags.seen[key] = true; save();
  let i = 0;
  const o = overlay('', 'scene');
  const show = () => {
    if (i >= lines.length) { closeOverlay(); then && then(); return; }
    const [who, text] = lines[i];
    const hero = D.HEROES[who];
    o.innerHTML = `<div class="dialog" data-a="sceneNext">
      ${hero ? `<div class="who">${img(hero.sprite, 3)}${hero.name}</div>` : ''}
      <div class="text ${hero ? '' : 'narr'}">${esc(text)}</div>
      <div class="next">${i + 1}/${lines.length} · tap</div>
      <button class="link" style="position:absolute;right:6px;top:4px" data-a="sceneSkip">Skip</button></div>`;
  };
  o.onclick = e => {
    if (e.target.closest('[data-a="sceneSkip"]')) { i = lines.length; show(); return; }
    i++; show();
  };
  show();
}
// A scene that ends in a decision. Options set flags, may act, then play their own scene.
function choiceScene(key, then) {
  const ch = STX.CHOICES[key], lines = ch.lines.filter(lineOk);
  S.flags.seen[key] = true; save();
  let i = 0;
  const o = overlay('', 'scene');
  const show = () => {
    if (i < lines.length) {
      const [who, text] = lines[i], hero = D.HEROES[who];
      o.innerHTML = `<div class="dialog">${hero ? `<div class="who">${img(hero.sprite, 3)}${hero.name}</div>` : ''}<div class="text ${hero ? '' : 'narr'}">${esc(text)}</div><div class="next">${i + 1}/${lines.length} · tap</div></div>`;
      o.onclick = () => { i++; show(); };
      return;
    }
    o.onclick = null;
    o.innerHTML = `<div class="dialog"><div class="text narr" style="margin-bottom:10px">${esc(ch.prompt)}</div>
      ${ch.choices.map((c, k) => `<button class="big" data-a="storyPick" data-v="${k}">${esc(c.label)}</button>`).join('')}</div>`;
  };
  ACT.storyPick = k => {
    const c = ch.choices[+k];
    closeOverlay();
    Object.assign(S.flags, c.flags || {});
    save();
    const after = () => { save(); if (c.scene) scene(c.scene, then); else if (then) then(); };
    if (c.act) STORY_ACTS[c.act](after, then); else after();
  };
  show();
}
const STORY_ACTS = {
  banish_wren(next) { E.removeHero(S, 'wren'); next(); },
  aldric_holds(next) {
    E.removeHero(S, 'aldric');
    const g = E.addGear(S, 'aldric_candle'); S.flags.got.aldric_candle = true;
    next();
    setTimeout(() => equipPrompt(g), 400);
  },
  stand_fight(next, then) {
    startBattle([{ t: 'soldier', lvl: 12 }, { t: 'soldier', lvl: 12 }, { t: 'soldier', lvl: 11 }, { t: 'hound', lvl: 11 }],
      { area: 'tower', boss: true, story: true, onWin: () => { S.flags.stair = 'together'; save(); scene('stand_together', () => { go('area', { id: 'tower', msg: 'The stair is clear. The Warden\'s hall is above.' }); }); } });
  },
  surge3(next) { S.surgeTier = 3; next(); },
};
function startRaid() {
  if (S.flags.raid_done || document.getElementById('battle') || document.getElementById('ov')) return;
  if (stopScene) { stopScene(); stopScene = null; }
  const fight = () => startBattle([{ t: 'hand', lvl: 9 }, { t: 'soldier', lvl: 7 }],
    { area: 'tower', boss: true, story: true, onWin: () => { S.flags.raid_done = true; save(); scene('raid_after', () => { go('keep'); toast('Morvane has Maud. The road to the tower runs through Fenmire.', 4000); }); } });
  if (!S.flags.seen.the_raid) scene('the_raid', fight); else fight();
}
// After the upper stair: Aldric may choose to hold it.
function afterStair() {
  if (S.roster.includes('aldric') && !S.flags.stair) { scene('aldric_stair', () => go('area', { id: 'tower', msg: null })); return true; }
  return false;
}
function chapterEnd() {
  const f = S.flags, L = [];
  L.push(['', 'Dawn comes up over the Hollow Tower. Maud walks out of the doors on Bram\'s arm, swearing at every step.']);
  if (f.wren_fate === 'dead') L.push(['', 'They bury Wren on the hill at Emberwake, facing the woods she knew better than anyone.']);
  else if (f.wren_fate === 'saved') L.push(['wren', 'I owe you a life, witch.'], ['morwen', 'You owe me three. I\'m counting.']);
  else if (S.roster.includes('wren')) L.push(['wren', 'So. A frozen king who wants to eat the sun. Fine. I\'ve got a bow.']);
  if (f.stair === 'aldric') L.push(['', 'Aldric\'s candle hangs over Emberwake\'s gate now. Nobody ever lets it go out.']);
  else if (f.stair === 'together') L.push(['aldric', 'My king rests. My oath is yours now, for whatever is left of me.']);
  if (f.ending === 'redeemed') L.push(['isolde', 'Vael. We know his name now. That\'s a start.']);
  else L.push(['isolde', 'He\'s coming for the ember. Let him come. I\'ll be ready.']);
  L.push(['bram', 'Then we\'ll need more than walls.'], ['isolde', 'We\'ll need an army.'],
    ['', 'End of Chapter One. Every choice you made is remembered. Emberwake will need all of them.']);
  dynScenes.chapter_end = L;
}
function scenes(list, then) {
  const next = () => { const k = list.shift(); if (!k) { then && then(); return; } scene(k, next); };
  next();
}

// ---------- Screens ----------
const SCREENS = {};

SCREENS.title = () => {
  const has = !!load();
  return `<div class="title">
    <svg class="flame" viewBox="0 0 64 64"><path d="M32 4c4 10 14 16 14 30a14 14 0 0 1-28 0c0-7 3-11 6-15 0 6 3 9 6 9-2-8 0-16 2-24z" fill="#ff8a3d"/><path d="M32 30c2 5 7 7 7 14a7 7 0 0 1-14 0c0-4 2-6 4-8 0 3 1 4 3 4-1-4-1-7 0-10z" fill="#ffe08a"/></svg>
    <h1>EMBERWAKE</h1>
    <p class="muted">Chapter One · The Hollow Tower</p>
    <div style="max-width:320px;margin:36px auto 0">
      ${has ? '<button class="primary big" data-a="continue">Continue</button>' : ''}
      <button class="big ${has ? '' : 'primary'}" data-a="newGame">New game</button>
      <button class="link" style="margin-top:14px" data-a="importFile">Load a backup file</button>
    </div></div>`;
};

// Hunt bounties on the keep screen: who to kill, where, and what it pays.
function bountyCard(onlyArea) {
  const list = E.bounties(S).filter(b => !onlyArea || b.area === onlyArea);
  if (!list.length) return '';
  return `<div class="card"><div class="spread"><b>Hunt bounties</b><span class="muted small">${S.bountiesDone || 0} paid · every 3rd adds a tome</span></div>
    ${list.map(b => `<div class="spread small" style="margin-top:6px"><span>${D.ENEMIES[b.t].name} in ${E.area(b.area).name}</span><span><b>${b.have}/${b.need}</b> · <span class="goldtxt">${b.gold} g</span></span></div>`).join('')}</div>`;
}
SCREENS.keep = () => {
  const shopName = S.flags.raid_done ? 'Tilly\'s stall' : S.shopTier >= 2 ? 'Hob\'s Trading Post' : 'Supplies';
  const pts = S.roster.some(id => S.heroes[id].points > 0 || E.readyToEvolve(S, id).length || E.pathsReady(S, id).length);
  const bench = S.roster.filter(id => !S.party.includes(id));
  const raid = S.flags.raid ? `<div class="card defend ${S.siege.best ? '' : 'alert'}"><div class="spread"><b class="serif" style="font-size:1.1rem">${S.siege.best ? 'Defend Emberwake' : 'The Hollow are coming!'}</b>
      <span class="pill on">${S.siege.best >= SG.MAX_NIGHT ? 'All nights held' : 'Night ' + (S.siege.best + 1)}</span></div>
      <div class="small muted" style="margin-top:4px">${S.siege.best ? `${S.siege.best} night${S.siege.best > 1 ? 's' : ''} held. Each new night pays well the first time.` : 'Rook told them where you are. Man the walls before they arrive.'}</div>
      <button class="big ${S.siege.best ? 'gold' : 'primary'}" data-a="defend">Man the walls</button></div>` : '';
  const attack = S.areas.barrows && S.areas.barrows.cleared && !S.flags.raid_done ? `<div class="card defend alert"><b class="serif" style="font-size:1.1rem;color:var(--bad)">Emberwake is under attack!</b>
      <div class="small muted" style="margin-top:4px">Morvane's Hand is in the yard. Rest, gear up, then drive them out.</div><button class="primary big" data-a="raid">Drive them out</button></div>` : '';
  return `<div class="topbar"><h1>Emberwake Keep</h1><span class="goldtxt">${S.gold} g</span></div>
    <canvas id="keepscene" class="keepscene"></canvas>${attack}${warCard()}${raid}
    <p class="muted">${S.buildings.yard || S.buildings.kennels ? 'The keep is waking up. ' + [S.buildings.yard ? 'A training yard' : '', S.buildings.kennels ? 'kennels' : ''].filter(Boolean).join(' and ') + ' where there was rubble.' : 'A ruined keep on the hill. Half a roof, a cold forge and some bedrolls.'}</p>
    <div class="card"><div class="small muted">Next</div>${objective()}</div>
    ${bountyCard()}
    <div class="card">${partyMini()}${bench.length ? `<div class="small muted" style="margin-top:6px">On the bench: ${bench.map(heroName).join(', ')}${S.buildings.yard ? ' (training)' : ''}</div>` : ''}</div>
    ${S.surgeTier ? `<div class="card"><div class="spread small"><b style="color:var(--ember)">Ember Surge${S.surgeTier >= 2 ? ' II' : ''}</b><span class="muted">${S.surge}%</span></div><div class="bar surge" style="margin-top:6px"><i style="width:${S.surge}%"></i></div><div class="small muted" style="margin-top:6px">Builds as you fight and carries over. Save it for a boss or spend it when things get rough.</div></div>` : ''}
    <button class="primary big" data-a="map">Set out</button>
    <div class="grid2" style="margin-top:8px">
      <button data-a="rest">Rest (free)</button>
      <button data-a="board" class="${boardReady() ? 'gold' : ''}">Noticeboard${boardReady() ? ' ●' : ''}</button>
      <button data-a="party">${pts ? 'Party ●' : 'Party'}</button>
      ${S.roster.includes('hesk') ? `<button data-a="creatures">Creatures (${S.creatures.length}/${E.capacity(S)})</button>` : ''}
      ${S.buildings.yard ? '<button data-a="yard">Training yard</button>' : ''}
      <button data-a="shop">${shopName}</button>
      <button data-a="forge">Bram's forge</button>
      <button data-a="bag">Bag</button>
      <button data-a="settings">Settings</button>
    </div>`;
};

SCREENS.board = () => {
  const icon = { done: '<span class="pill good">Done</span>', ready: '<span class="pill on">Ready</span>', locked: '<span class="pill">Locked</span>', future: '<span class="pill">Coming</span>' };
  const rows = W.BOARD.map(b => {
    const st = E.boardStatus(S, b);
    let action = '';
    if (b.build) {
      const lvl = S.buildings[b.build] || 0, bd = W.BUILDINGS[b.build], c = E.buildCost(S, b.build);
      if (st === 'ready' || (st === 'done' && c)) {
        action = `<div class="small" style="margin-top:6px">${lvl ? 'Upgrade' : 'Build'}: ${bd.levels[lvl].text}<br><span class="muted">${costText(c)}</span></div>
          <button class="sm gold" style="margin-top:6px" data-a="build" data-v="${b.build}" ${E.canAfford(S, c) ? '' : 'disabled'}>${lvl ? 'Upgrade' : 'Build'}</button>`;
      }
    }
    return `<div style="${st === 'locked' || st === 'future' ? 'opacity:.7' : ''}"><div class="spread"><b>${b.name}</b>${icon[st]}</div>
      <div class="small muted">${st === 'done' && b.build ? W.BUILDINGS[b.build].desc : b.how}</div>${action}</div>`;
  }).join('');
  return `<div class="topbar"><h1>Noticeboard</h1><button class="sm" data-a="keep">Back</button></div>
    <p class="muted">What's been done, what's next and what's still out there.</p>
    <div class="card list">${rows}</div>`;
};

SCREENS.map = () => {
  const rows = D.AREAS.filter(a => !a.c2).map((a, i) => {
    const st = S.areas[a.id], open = i < S.unlocked;
    if (!open) return `<div class="card" style="opacity:.5"><div class="spread"><b class="serif">???</b><span class="pill">Locked</span></div><p class="muted">Clear ${D.AREAS[i - 1].name} first.</p></div>`;
    const ex = E.explored(S, a.id);
    return `<div class="card"><div class="spread"><b class="serif" style="font-size:1.1rem">${a.name}</b>
      <span class="pill ${st.cleared ? 'good' : 'on'}">${st.cleared ? 'Cleared' : 'Lv ' + a.lvl[0] + ' to ' + a.lvl[1]}</span></div>
      <p class="muted">${a.desc}</p>
      <div class="bar xp"><i style="width:${ex}%"></i></div>
      <div class="spread small muted" style="margin-top:4px"><span>${ex}% explored</span><span>${D.MATS[a.mat].name} here</span></div>
      <button class="big ${st.cleared ? '' : 'primary'}" data-a="enter" data-v="${a.id}">${ex > 10 ? 'Go back' : 'Explore'}</button></div>`;
  }).join('');
  const market = S.flags.market ? `<div class="card town"><div class="spread"><b class="serif" style="font-size:1.1rem">Brightwater Market</b><span class="pill on">Town</span></div>
    <p class="muted">A busy market town east along the road, with a fighting pit at its heart.</p>
    <div class="small muted">Arena: ${['bronze', 'silver', 'gold'].map((r, i) => { const rank = W.ARENA[i]; const won = rank.bouts.filter(b => S.arena.won[b.id]).length; return `${rank.name} ${won}/${rank.bouts.length}`; }).join(' · ')}</div>
    <button class="big gold" data-a="market">Go to Brightwater</button></div>` : '';
  const c2 = warOn() ? `<h2 class="serif" style="margin:14px 0 4px">Chapter two</h2>` + D.AREAS.filter(a => a.c2).map(a => {
    const st = S.areas[a.id], open = E.areaOpen(S, a), R = WAR.REGIONS[a.opens];
    if (!open) return `<div class="card" style="opacity:.55"><div class="spread"><b class="serif">${a.name}</b><span class="pill">Locked</span></div><p class="muted small">${a.id === 'hollow_court' && WAR.owns(S, a.opens) ? 'The Gate is sealed while any marshal lives.' : `Take ${R.name} on the war map first.`}</p></div>`;
    const ex = E.explored(S, a.id);
    return `<div class="card"><div class="spread"><b class="serif" style="font-size:1.1rem">${a.name}</b><span class="pill ${st.cleared ? 'good' : 'bad'}">${st.cleared ? 'Cleared' : 'Lv ' + a.lvl[0] + ' to ' + a.lvl[1]}</span></div>
      <p class="muted">${a.desc}</p><div class="bar xp"><i style="width:${ex}%"></i></div>
      <div class="spread small muted" style="margin-top:4px"><span>${ex}% explored</span><span>${D.MATS[a.mat].name} here</span></div>
      <button class="big ${st.cleared ? '' : 'primary'}" data-a="enter" data-v="${a.id}">${ex > 10 ? 'Go back' : 'Go inside'}</button></div>`;
  }).join('') : '';
  return `<div class="topbar"><h1>Where to?</h1><button class="sm" data-a="keep">Keep</button></div>${market}${c2}<h2 class="serif" style="margin:14px 0 4px">${warOn() ? 'Chapter one' : ''}</h2>${rows}`;
};

// Node icons, drawn small in white.
const ICON = {
  start: '<path d="M-2.6 1.6v-2.4l2.6-2 2.6 2v2.4z" fill="#fff"/>',
  fight: '<path d="M-2.6-2.6l5.2 5.2M2.6-2.6l-5.2 5.2" stroke="#fff" stroke-width="1.1"/>',
  treasure: '<rect x="-2.6" y="-1.8" width="5.2" height="3.8" rx=".6" fill="#fff"/><rect x="-2.6" y="-.6" width="5.2" height=".7" fill="#00000066"/>',
  gather: '<path d="M-2.4 2.4C-2.4-1.6 0-2.8 2.6-2.6 2.6 0.4 1 2.4-2.4 2.4z" fill="#fff"/>',
  camp: '<path d="M-3 2.4L0-2.8 3 2.4z" fill="#fff"/>',
  event: '<text y="2" text-anchor="middle" font-size="5.5" font-weight="700" fill="#fff">?</text>',
  den: '<circle cx="-1.6" cy="-1.4" r=".9" fill="#fff"/><circle cx="1.6" cy="-1.4" r=".9" fill="#fff"/><circle cx="0" cy="1.2" r="1.5" fill="#fff"/>',
  quest: '<text y="2" text-anchor="middle" font-size="5.5" font-weight="700" fill="#fff">!</text>',
  boss: '<path d="M-3 2V-1.6l1.5 1.4L0-2.6l1.5 2.4L3-1.6V2z" fill="#fff"/>',
  lock: '<rect x="-2" y="-.4" width="4" height="3" rx=".4" fill="#fff"/><path d="M-1.2-.4v-1a1.2 1.2 0 0 1 2.4 0v1" stroke="#fff" stroke-width=".8" fill="none"/>',
};
const NODE_COL = { start: '#5a6a8a', fight: '#b4442f', treasure: '#c8952a', gather: '#4f8a3a', camp: '#2f7d6f', event: '#7a5ab8', den: '#a0642a', quest: '#d4a630', boss: '#8a1a3a' };
const X = x => 10 + x * 20, Y = y => 8 + y * 13;
function mapSVG(id) {
  const m = E.map(id), st = E.mapState(S, id), rev = E.revealed(S, id);
  let lines = '', nodes = '';
  for (const [a, b] of m.edges) {
    if (!rev.has(a) || !rev.has(b)) continue;
    const na = E.node(id, a), nb = E.node(id, b);
    const walked = st.visited[a] && st.visited[b];
    lines += `<line x1="${X(na.x)}" y1="${Y(na.y)}" x2="${X(nb.x)}" y2="${Y(nb.y)}" stroke="${walked ? '#8a8470' : '#4a4a5a'}" stroke-width="${walked ? 1.1 : .8}" ${walked ? '' : 'stroke-dasharray="1.6 1.4"'}/>`;
  }
  for (const n of m.nodes) {
    if (!rev.has(n.id)) continue;
    const here = st.at === n.id, done = st.done[n.id] || (n.t === 'boss' && S.areas[id].cleared);
    const blocked = !E.meets(S, n.need) && !st.done[n.id];
    const visited = st.visited[n.id];
    const col = blocked ? '#3a3a48' : NODE_COL[n.t];
    const dim = (done && n.t !== 'den' && n.t !== 'camp' && n.t !== 'gather' && n.t !== 'quest') || (n.t === 'gather' && st.used[n.id]);
    nodes += `<g transform="translate(${X(n.x)} ${Y(n.y)})" data-a="node" data-v="${n.id}" style="cursor:pointer">
      ${here ? '<circle r="7.6" fill="none" stroke="#ffd76a" stroke-width="1.2"><animate attributeName="r" values="7;8.2;7" dur="1.6s" repeatCount="indefinite"/></circle>' : ''}
      <circle r="9" fill="transparent"/>
      <circle r="5.4" fill="${col}" stroke="${visited ? '#00000088' : '#ffffff55'}" stroke-width=".6" opacity="${dim ? .45 : 1}"/>
      <g opacity="${dim ? .5 : 1}">${blocked ? ICON.lock : ICON[n.t] || ''}</g>
      ${!visited && !blocked ? '<circle cx="4" cy="-4" r="1.3" fill="#ffd76a"/>' : ''}</g>`;
  }
  return `<svg class="mapsvg" viewBox="0 0 100 ${Y(7) + 8}">${lines}${nodes}</svg>`;
}

SCREENS.area = () => {
  const id = view.id, a = E.area(id), st = E.mapState(S, id), n = E.node(id, st.at);
  const bossName = D.ENEMIES[a.boss[0].t].name;
  const allKo = S.party.every(h => S.heroes[h].hp <= 0);
  const acts = [];
  if (n.t === 'boss' && !S.areas[id].cleared) acts.push(`<button class="primary big" data-a="boss" ${allKo ? 'disabled' : ''}>Face ${bossName}</button>`);
  if (n.t === 'den' && st.done[n.id]) {
    const kinds = [...new Set(n.hunt)].filter(k => D.ENEMIES[k].tame);
    const why = !S.party.includes('hesk') ? 'Hesk has to be in the party to tame anything. Swap her in from Party, Line-up.'
      : '';
    acts.push(`<div class="card"><b>Beast hunt</b><div class="small muted" style="margin-top:4px">Lives here: ${kinds.map(k => D.ENEMIES[k].name + (S.dex && S.dex[D.ENEMIES[k].tame] ? ' (tamed before)' : ' <b style="color:var(--gold)">(new!)</b>')).join(', ')}.</div>
      <div class="small" style="margin-top:4px">Wear a beast down, then use Hesk's <b>Tame</b> button. The more hurt it is and the higher Hesk's level above it, the better the odds. Hunting here adds 15%.</div>
      ${why ? `<div class="small" style="color:var(--bad);margin-top:4px">${why}</div>` : ''}
      <button class="big gold" data-a="hunt" ${allKo || why ? 'disabled' : ''}>Hunt for a beast to tame</button></div>`);
  }
  if (n.t === 'quest') acts.push('<button class="big gold" data-a="talk">Talk</button>');
  if (n.t === 'event' && !st.done[n.id]) acts.push('<button class="big gold" data-a="eventGo">Look closer</button>');
  acts.push(`<button class="big" data-a="train" ${allKo ? 'disabled' : ''}>Look for a fight</button>`);
  if (S.areas[id].cleared && W.APEX[id]) acts.push(huntCard(id, allKo));
  return `<div class="topbar"><h1>${a.name}</h1><span class="goldtxt">${S.gold} g</span></div>
    <div class="spread small muted"><span>${E.explored(S, id)}% explored</span><span>Enemies Lv ${a.lvl[0]} to ${a.lvl[1] + (S.areas[id].cleared ? 1 : 0)}</span></div>
    <div class="mapwrap">${mapSVG(id)}</div>
    <div class="small muted" style="text-align:center;margin:-2px 0 6px">Tap a spot next to you to move. Gold dots are unexplored.</div>
    <div class="card"><div class="spread"><b class="serif" style="font-size:1.05rem">${n.name}</b>${n.t === 'boss' && !S.areas[id].cleared ? bossGap(a.boss[0].lvl) : ''}</div>
      <div class="muted small">${n.desc}</div>
      ${view.msg ? `<div class="eventtxt" style="margin-top:8px">${view.msg}</div>` : ''}</div>
    ${partyStrip()}
    ${acts.join('')}
    <div class="grid3" style="margin-top:8px"><button data-a="party">Party</button><button data-a="bag">Bag</button><button data-a="keep">Keep</button></div>`;
};

// The hunting grounds: hard respawning fights, a chain bonus, the apex beast and this area's bounties.
function huntCard(id, allKo) {
  const ch = E.huntChain(S, id), ap = W.APEX[id], up = E.apexUp(S, id), apL = E.apexSpec(S, id)[0].lvl;
  const killed = (S.apexKills || {})[id];
  return `<div class="card huntcard"><div class="spread"><b class="serif" style="font-size:1.05rem">Hunting grounds</b><span class="pill ${ch ? 'on' : ''}">${ch ? `Chain ${ch} · ×${E.huntMult(S, id).toFixed(1)}` : 'No chain yet'}</span></div>
    <div class="small muted" style="margin-top:4px">Enemies Lv ${E.huntLevel(S, id)}+, often elites. Win fights in a row to build a chain: +20% XP, gold and drops per win, up to double. Only a short breather between fights, and they get tougher as the chain grows. Lose, run or rest at the keep and the chain breaks.</div>
    <button class="big gold" data-a="ground" ${allKo ? 'disabled' : ''}>${ch ? 'Push on' : 'Hunt'} (Lv ${E.huntLevel(S, id)})</button>
    <div class="apex ${up ? '' : 'gone'}"><div class="spread"><b>${ap.name}</b><span class="pill bad">Apex · Lv ${apL}</span></div>
      <div class="small muted">${ap.desc} ${killed ? `Brought down ${killed} time${killed > 1 ? 's' : ''}.` : `First kill: <b style="color:var(--gold)">${D.GEAR[ap.trophy].name}</b> and a Tome of Insight.`} Hesk can tame it as an Alpha (half the usual odds).</div>
      ${up ? `<button class="big" data-a="apex" ${allKo ? 'disabled' : ''}>Hunt ${ap.name}</button>` : '<div class="small muted" style="margin-top:6px">Gone to ground. It comes back after you rest at the keep.</div>'}</div>
    ${bountyCard(id).replace('class="card"', 'class="bountyin"')}</div>`;
}
// The boss's level against the party's, so you can watch the gap close.
function bossGap(bl) {
  const pl = Math.round(S.party.reduce((t, h) => t + S.heroes[h].lvl, 0) / S.party.length), gap = bl - pl;
  const cls = gap >= 2 ? 'bad' : gap >= 1 ? 'on' : 'good';
  return `<span class="pill ${cls}">Boss Lv ${bl} · you ${pl}${gap > 0 ? ` · ${gap} short` : ''}</span>`;
}
SCREENS.party = () => {
  const id = view.hero || S.party[0], tab = view.tab || 'stats';
  if (tab === 'lineup') return partyFrame(lineupHTML());
  const h = S.heroes[id], st = E.heroStats(S, id), def = D.HEROES[id];
  let body = '';
  if (tab === 'stats') {
    body = `<div class="card"><div class="spread"><b class="serif" style="font-size:1.15rem">${def.name}</b><span class="muted">${E.heroTitle(h) ? `<b style="color:var(--gold)">${E.heroTitle(h)}</b>` : def.role}</span></div>
      <p class="muted">${def.blurb}</p>
      <div class="spread small"><span>Level ${h.lvl}</span><span class="muted">${h.xp}/${E.xpNext(h.lvl)} XP</span></div>
      <div class="bar xp" style="margin:4px 0 12px"><i style="width:${pct(h.xp, E.xpNext(h.lvl))}%"></i></div>
      <div class="stats">
        <div><span>HP</span><b>${h.hp}/${st.maxHp}</b></div><div><span>MP</span><b>${h.mp}/${st.maxMp}</b></div>
        ${['str', 'mag', 'def', 'res', 'spd', 'crit'].map(k => `<div><span>${STAT_NAMES[k]}</span><b>${st[k]}</b></div>`).join('')}
      </div>
      ${S.surgeTier ? `<p class="small" style="margin-top:10px"><b style="color:var(--ember)">Surge: ${D.SKILLS[D.SURGE[id]].name}</b> <span class="muted">${D.SKILLS[D.SURGE[id]].desc}</span></p>` : ''}
      ${(def.innate || []).map(s => `<p class="small"><b>${D.SKILLS[s].name}</b> <span class="muted">${D.SKILLS[s].desc}</span></p>`).join('')}
      ${awakenCard(id)}
      <p class="muted" style="margin-top:10px">Talent points: <b style="color:var(--gold)">${h.points}</b>. Two per level, plus any Tomes of Insight you find.</p></div>`;
  } else if (tab === 'talents') {
    body = `<div class="card"><div class="spread"><b>Talent points</b><span class="pill on">${h.points}</span></div>
      <p class="muted small">Anyone can learn any tree. Ranks unlock at levels ${D.TALENT_REQ.join(', ')} and cost ${D.TALENT_COST.join(', ')} points. Master all six and the tree <b>evolves</b>: pick one of two paths with three more ranks. Two trees at rank ${D.COMBO_RANK} teach a <b>combo art</b> only that pair can do.</p>
      ${Object.keys(D.TREES).map(tk => {
        const tr = D.TREES[tk], r = h.talents[tk] || 0, n = E.talentNext(S, id, tk), path = h.paths && h.paths[tk];
        const rankLine = (rk, i) => {
          const label = rk.skill ? `<b>${D.SKILLS[rk.skill].name}</b> <span class="muted">${D.SKILLS[rk.skill].mp} MP. ${D.SKILLS[rk.skill].desc || ''}</span>` : rk.text;
          const cls = i < r ? 'have' : i === r ? 'next' : 'locked';
          const req = i < 6 ? D.TALENT_REQ[i] : D.PATH_REQ[i - 6], cost = i < 6 ? D.TALENT_COST[i] : D.PATH_COST[i - 6];
          return `<div class="rank ${cls}">${i + 1}. ${label} <span class="muted small">(Lv ${req}, ${cost} pt)</span></div>`;
        };
        const all = E.treeRanks(h, tk).map(rankLine);
        const ranks = all.slice(0, 6).join('') + (path != null ? `<div class="small" style="color:${tr.colour};margin:8px 0 2px">Path of the ${tr.paths[path].name}</div>` + all.slice(6).join('') : '');
        const pathBox = n.path ? `<div class="evochoice"><div class="small" style="color:var(--gold);margin:6px 0 4px">Mastered. Choose the path ${tr.name} takes:</div>
          ${tr.paths.map((pp, k) => `<button class="sm gold evobtn" data-a="choosePath" data-v="${tk}:${k}"><b>${pp.name}</b><span class="small">${pp.desc} Learns ${pp.ranks.filter(x => x.skill).map(x => D.SKILLS[x.skill].name).join(' and ')}.</span></button>`).join('')}</div>`
          : r >= 4 && path == null ? `<div class="small muted" style="margin-top:6px">At six ranks this tree evolves into ${tr.paths.map(pp => pp.name).join(' or ')}.</div>` : '';
        const total = path != null ? 9 : 6, ttl = path != null ? ` <span class="small" style="color:${tr.colour}">${tr.paths[path].name}</span>` : '';
        const btn = n.done ? '<span class="pill good">Mastered</span>' : n.path ? '<span class="pill on">Evolve</span>' : `<button class="sm ${n.ok ? 'gold' : ''}" data-a="learn" data-v="${tk}" ${n.ok ? '' : 'disabled'}>${h.lvl < n.req ? 'Lv ' + n.req : 'Learn ' + n.cost}</button>`;
        return `<details ${view.open === tk || n.path ? 'open' : ''}><summary><div class="spread">
          <div><b style="color:${tr.colour}">${tr.name}</b>${ttl} <span class="dots" style="color:${tr.colour}">${'●'.repeat(Math.min(r, total))}${'○'.repeat(Math.max(0, total - r))}</span><div class="muted small">${tr.desc}</div></div>
          ${btn}</div></summary>${ranks}${pathBox}</details>`;
      }).join('')}
      ${comboList(h)}</div>`;
  } else if (tab === 'gear') {
    body = `<div class="card">${['weapon', 'armour', 'charm'].map(slot => {
      const g = E.gearOf(S, h.equip[slot]);
      return `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="spread"><div><div class="muted small">${slot[0].toUpperCase() + slot.slice(1)}</div>
        <b>${g ? E.gearName(g) : 'Nothing'}</b><div class="small muted">${g ? gearDesc(g) : ''}</div></div>
        <button class="sm" data-a="slot" data-v="${slot}">Change</button></div></div>`;
    }).join('')}</div>
    ${view.slot ? slotPicker(id, view.slot) : ''}`;
  } else {
    const skills = st.skills.filter(s => s !== 'attack' && !(def.innate || []).includes(s));
    body = `<div class="card"><p class="muted small">Skills get stronger the more you use them. Each mastery star adds 10% power. At four stars a skill can <b>evolve</b> into one of two stronger forms, and starts earning stars again.</p>
      ${skills.length ? skills.map(s => {
        const sk = D.SKILLS[s], uses = h.mastery[s] || 0, lv = E.masteryLevel(uses), nextAt = E.MASTERY[lv];
        const evo = E.canEvolve(S, id, s) ? `<div class="evochoice"><div class="small" style="color:var(--gold);margin:6px 0 4px">Mastered. Choose what it becomes:</div>
          ${D.SKILL_EVO[s].map((o, k) => `<button class="sm gold evobtn" data-a="evolveSkill" data-v="${s}:${k}"><b>${o.name}</b><span class="small">${o.desc} ${D.SKILLS[o.id].mp || 0} MP</span></button>`).join('')}</div>`
          : D.SKILL_EVO[s] ? `<div class="small muted">Evolves at four stars into ${D.SKILL_EVO[s].map(o => o.name).join(' or ')}.</div>` : sk.evolvedFrom ? `<div class="small" style="color:var(--gold)">Evolved from ${D.SKILLS[sk.evolvedFrom].name}.</div>` : '';
        return `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="spread"><b>${sk.name}</b><span style="color:var(--gold)">${'★'.repeat(lv)}${'☆'.repeat(4 - lv)}</span></div>
          <div class="small muted">${sk.mp || 0} MP. ${sk.desc || ''} Used ${uses} times${nextAt ? `, next star at ${nextAt}` : ', fully mastered'}.</div>${evo}</div>`;
      }).join('') : '<p class="muted">No skills yet. Learn some in Talents.</p>'}</div>`;
  }
  return partyFrame(body, id);
};
// Combo arts this hero has, and the ones within reach (one of the pair already started).
function comboList(h) {
  const near = D.COMBOS.filter(c => c.trees.some(t => (h.talents[t] || 0) > 0));
  if (!near.length) return '';
  return `<div style="margin-top:12px"><b>Combo arts</b><div class="muted small">Two trees at rank ${D.COMBO_RANK} or more teach these.</div>
    ${near.map(c => {
      const has = c.trees.every(t => (h.talents[t] || 0) >= D.COMBO_RANK), sk = D.SKILLS[c.skill];
      const need = c.trees.map(t => `<span style="color:${D.TREES[t].colour}">${D.TREES[t].name} ${Math.min(h.talents[t] || 0, D.COMBO_RANK)}/${D.COMBO_RANK}</span>`).join(' + ');
      return `<div class="rank ${has ? 'have' : 'locked'}"><b>${sk.name}</b> <span class="muted">${sk.mp} MP. ${sk.desc}</span><div class="small">${need}</div></div>`;
    }).join('')}</div>`;
}
function partyFrame(body, id) {
  const tab = view.tab || 'stats';
  const tabs = ['stats', 'talents', 'gear', 'skills', 'lineup'].map(t => {
    const dot = (t === 'talents' && id && (S.heroes[id].points || E.pathsReady(S, id).length)) || (t === 'skills' && id && E.readyToEvolve(S, id).length);
    return `<button class="${t === tab ? 'on' : ''}" data-a="ptab" data-v="${t}">${t === 'lineup' ? 'Line-up' : t[0].toUpperCase() + t.slice(1)}${dot ? ' ●' : ''}</button>`;
  }).join('');
  return `<div class="topbar"><h1>Party</h1><button class="sm" data-a="back">Back</button></div>
    ${tab === 'lineup' ? '' : `<div class="herotabs">${S.roster.map(pid => `<button class="${pid === id ? 'on' : ''}" data-a="phero" data-v="${pid}">${img(D.HEROES[pid].sprite, 2)}<span class="small">${heroName(pid)}${S.heroes[pid].points ? ' ●' : ''}</span></button>`).join('')}</div>`}
    <div class="tabs">${tabs}</div>${body}`;
}
function lineupHTML() {
  const bench = S.roster.filter(id => !S.party.includes(id));
  const c = E.creatureOf(S, S.companion);
  return `<div class="card"><h2>In the party</h2><p class="muted small">Three go out. Who you take decides which locked places you can open: Fire burns through brambles, Dace picks locks, Hesk can get near wild beasts.</p>
    ${S.party.map(id => `<div class="spread" style="padding:6px 0;border-bottom:1px solid var(--line)"><div class="grow">${heroRow(id)}</div>
      ${bench.length ? `<button class="sm" data-a="swapOut" data-v="${id}">Swap</button>` : ''}</div>`).join('')}</div>
    ${bench.length ? `<div class="card"><h2>On the bench</h2><p class="muted small">${S.buildings.yard ? `Bench heroes earn ${Math.round(W.YARD_RATE[S.buildings.yard] * 100)}% of fight XP at the training yard.` : 'Build a training yard so bench heroes earn XP while you fight.'} Heroes behind the leader always earn bonus XP to catch up.</p>
      ${bench.map(id => { const gen = warOn() && WAR.generalOf(S, id), hurt = false; return `<div class="spread" style="padding:6px 0;border-bottom:1px solid var(--line)"><div class="grow">${heroRow(id)}${gen ? `<div class="small" style="color:var(--gold)">Leading ${gen.name}</div>` : hurt ? `<div class="small" style="color:#ffb0a0">Wounded: ${S.war.wounded[id]} more days</div>` : ''}</div><button class="sm gold" data-a="swapIn" data-v="${id}">Bring in</button></div>`; }).join('')}</div>` : '<div class="card muted small">Nobody on the bench yet. Recruits will join as you find them.</div>'}
    ${S.roster.includes('hesk') ? `<div class="card"><h2>Creature</h2>${c ? creatureRow(c) : '<p class="muted">None chosen.</p>'}<button class="sm" style="margin-top:8px" data-a="creatures">Change creature</button></div>` : ''}`;
}

function gearDesc(g) {
  const d = D.GEAR[g.id];
  return [statLine(E.gearStats(g)), d.desc].filter(Boolean).join('. ');
}
function deltaFor(heroId, slot, uid) {
  const before = E.heroStats(S, heroId);
  const copy = JSON.parse(JSON.stringify(S));
  E.equip(copy, heroId, slot, uid);
  const after = E.heroStats(copy, heroId);
  const out = [];
  for (const k of ['maxHp', 'maxMp', 'str', 'mag', 'def', 'res', 'spd', 'crit']) {
    const d = after[k] - before[k];
    if (d) out.push(`<span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d} ${SHORT[k.replace('max', '').toLowerCase()] || k}</span>`);
  }
  return out.join(' ') || '<span class="muted">no change</span>';
}
function slotPicker(heroId, slot) {
  const items = S.gear.filter(g => D.GEAR[g.id].slot === slot && g.uid !== S.heroes[heroId].equip[slot]);
  return `<div class="card"><h2>Choose ${slot}</h2>
    ${items.length ? items.map(g => {
      const by = E.equippedBy(S, g.uid);
      return `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="spread"><div class="grow"><b>${E.gearName(g)}</b>${by ? ` <span class="pill">${heroName(by)}</span>` : ''}
        <div class="small muted">${gearDesc(g)}</div><div class="small">${deltaFor(heroId, slot, g.uid)}</div></div>
        <button class="sm gold" data-a="equip" data-v="${g.uid}">Equip</button></div></div>`;
    }).join('') : '<p class="muted">Nothing else to wear here. Buy more from the shop or find it out there.</p>'}
    ${slot === 'charm' && S.heroes[heroId].equip.charm ? '<button class="sm" data-a="equip" data-v="none">Take off charm</button>' : ''}
    <button class="link" data-a="slot" data-v="">Close</button></div>`;
}

const stars = n => `<span class="pot">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span>`;
// Gear and training on each creature card.
function awakenCard(id) {
  const h = S.heroes[id], sk = D.SKILLS[D.AWAKEN[id]];
  if (h.awakened) return `<div class="awaken done"><b>Awakened.</b> <span class="small muted">+10% to every stat. Signature move: <b>${sk.name}</b>.</span></div>`;
  return `<div class="awaken"><div class="spread"><b>Awakening</b><span class="pill ${h.lvl >= D.AWAKEN_LVL ? 'on' : ''}">Level ${D.AWAKEN_LVL}</span></div>
    <div class="small muted" style="margin-top:4px">+10% to every stat and a signature move: <b>${sk.name}</b>, ${sk.desc} Costs ${costText(D.AWAKEN_COST)}.</div>
    ${h.lvl >= D.AWAKEN_LVL ? `<button class="sm gold" style="margin-top:6px" data-a="awaken" ${E.canAwaken(S, id) ? '' : 'disabled'}>Awaken ${heroName(id)}</button>` : ''}</div>`;
}
ACT.awaken = () => {
  if (E.awaken(S, view.hero)) { AU.sfx('surge'); toast(`${heroName(view.hero)} awakens. <b>${D.SKILLS[D.AWAKEN[view.hero]].name}</b> learned.`, 3500); save(); render(); }
};
function beastBlock(c) {
  const g = E.beastGearOf(S, c), pts = E.trainPoints(c), tr = c.train || {};
  const lines = Object.keys(E.TRAIN).map(k => {
    const d = E.TRAIN[k], r = tr[k] || 0, locked = d.needForm && !c.form;
    return `<div class="spread small" style="margin-top:4px"><span><b>${d.name}</b> <span class="pot">${'●'.repeat(r)}<span class="off">${'●'.repeat(d.max - r)}</span></span> <span class="muted">${locked ? 'after its first evolution' : d.desc}</span></span>
      ${r < d.max && !locked ? `<button class="sm ${E.canTrain(c, k) ? 'gold' : ''}" data-a="trainBeast" data-v="${c.cid}:${k}" ${E.canTrain(c, k) ? '' : 'disabled'}>+${E.trainCost(r)}</button>` : ''}</div>`;
  }).join('');
  return `<div class="beastbox"><div class="spread small"><span>Gear: <b>${g ? E.gearName(g) : 'none'}</b> ${g ? `<span class="muted">${statLine(E.gearStats(g))}</span>` : ''}</span><button class="sm" data-a="beastGear" data-v="${c.cid}">Change</button></div>
    <details ${pts ? 'open' : ''}><summary class="small">Training <span class="${pts ? 'goldtxt' : 'muted'}">${pts} point${pts === 1 ? '' : 's'}</span> <span class="muted">(one per level)</span></summary>${lines}</details></div>`;
}
ACT.trainBeast = v => {
  const [cid, k] = v.split(':'), c = E.creatureOf(S, +cid);
  if (c && E.trainCreature(c, k)) { save(); render(); }
};
ACT.beastGear = v => {
  const c = E.creatureOf(S, +v);
  const list = S.gear.filter(g => D.GEAR[g.id].slot === 'beast');
  overlay(`<div class="sheet"><h2>Gear for ${esc(E.creatureName(c))}</h2>
    ${list.length ? list.map(g => { const o = E.beastOwner(S, g.uid); return `<div class="spread" style="padding:6px 0;border-bottom:1px solid var(--line)"><div class="grow"><b>${E.gearName(g)}</b><div class="small muted">${statLine(E.gearStats(g))}${o && o !== c ? ' · on ' + esc(E.creatureName(o)) : ''}</div></div>
      ${c.gear === g.uid ? '<span class="pill good">On</span>' : `<button class="sm gold" data-a="beastOn" data-v="${c.cid}:${g.uid}">Equip</button>`}</div>`; }).join('') : '<p class="muted">No beast gear yet. Collars and barding are sold at the market.</p>'}
    ${c.gear != null ? `<button class="big" data-a="beastOn" data-v="${c.cid}:none">Take it off</button>` : ''}
    <button class="big" data-a="closeOv">Done</button></div>`);
};
ACT.beastOn = v => {
  const [cid, uid] = v.split(':');
  E.equipBeast(S, +cid, uid === 'none' ? null : +uid);
  closeOverlay(); save(); render();
};
// Buying beast gear: pick which creature wears it.
function beastPicker(inst) {
  overlay(`<div class="sheet"><h2>${E.gearName(inst)}</h2><p class="muted small">${statLine(E.gearStats(inst))}</p><p>Which creature should wear it?</p>
    ${S.creatures.map(c => `<div class="spread" style="padding:6px 0;border-bottom:1px solid var(--line)"><div class="row">${img(E.creatureSprite(c), 2)}<div><b>${esc(E.creatureName(c))}</b><div class="small muted">Lv ${c.lvl}${E.beastGearOf(S, c) ? ' · wearing ' + E.gearName(E.beastGearOf(S, c)) : ''}</div></div></div>
      <button class="sm gold" data-a="beastOn" data-v="${c.cid}:${inst.uid}">Equip</button></div>`).join('') || '<p class="muted">No creatures yet.</p>'}
    <button class="big" data-a="closeOv">Keep it for later</button></div>`);
}
function kennelUpgrade() {
  const c = E.buildCost(S, 'kennels');
  if (!c || !S.buildings.kennels) return '';
  const next = W.KENNEL_CAP[S.buildings.kennels + 1];
  return `<div class="card"><div class="spread"><b>Expand the kennels</b><span class="pill">${E.capacity(S)} → ${next} places</span></div>
    <div class="small muted" style="margin-top:4px">${c.text} Costs ${costText(c)}.</div>
    <button class="sm gold" style="margin-top:6px" data-a="kennelUp" ${E.canAfford(S, c) ? '' : 'disabled'}>Expand</button></div>`;
}
SCREENS.creatures = () => {
  const cap = E.capacity(S), advice = E.releaseAdvice(S);
  const list = S.creatures.map(c => {
    const pot = E.potential(c);
    const st = E.creatureStats(c), t = c.tally, total = t.attack + t.guard + t.support;
    const lean = ['attack', 'guard', 'support'].sort((a, b) => t[b] - t[a])[0];
    const evo = c.mythic ? `<div class="small" style="color:var(--gold)">An Elder. Nothing left to become.</div>` : c.final ? `<div class="small" style="color:var(--gold)">Becomes an <b>Elder ${W.EVO2[c.sp][c.form]}</b> at level ${W.EVO3_LVL}: a quarter stronger and a new move.</div>` : c.form ? `<div class="small" style="color:var(--gold)">Evolved: ${W.STANCES[c.form].name} form. Evolves once more at level ${W.EVO2_LVL} into a <b>${W.EVO2[c.sp][c.form]}</b>.</div>`
      : `<div class="small muted">Evolves three times: at levels ${W.EVO_LVL}, ${W.EVO2_LVL} and ${W.EVO3_LVL}. ${total ? `Leaning ${W.STANCES[lean].name} (${t.attack} attack, ${t.guard} guard, ${t.support} support turns), which would make it a <b>${W.CREATURES[c.sp].evo[lean]}</b>.` : 'Its stance in battle decides what it becomes.'}</div>`;
    return `<div class="card ${advice[c.cid] ? 'advise' : ''}"><div class="spread"><div class="row">${img(E.creatureSprite(c), 3)}<div><b>${E.creatureName(c)}</b><div class="small muted">Lv ${c.lvl} · HP ${c.hp}/${st.maxHp} · STR ${st.str} · MAG ${st.mag} · DEF ${st.def}</div>
      <div class="small">Potential ${stars(pot.stars)} <span class="muted">${c.mythic ? 'at its peak form' : c.final ? 'becomes an Elder ' + W.EVO2[c.sp][c.form] + ' at ' + W.EVO3_LVL : 'tops out as ' + (c.form ? '' : 'up to ') + (/^[AEIOU]/.test(pot.tops) ? 'an ' : 'a ') + pot.tops}</span></div></div></div>
      ${S.companion === c.cid ? '<span class="pill good">With you</span>' : `<button class="sm gold" data-a="companion" data-v="${c.cid}">Take along</button>`}</div>
      <div class="bar xp" style="margin:8px 0 4px"><i style="width:${pct(c.xp, E.xpNext(c.lvl))}%"></i></div>${evo}
      <div class="row" style="margin-top:8px">${Object.keys(W.STANCES).map(s => `<button class="sm ${c.stance === s ? 'gold' : ''}" data-a="stance" data-v="${c.cid}:${s}">${W.STANCES[s].name}</button>`).join('')}
      <button class="sm ${advice[c.cid] ? 'bad' : ''}" data-a="release" data-v="${c.cid}" ${S.companion === c.cid ? 'disabled' : ''}>Release</button></div>
      <div class="small muted" style="margin-top:4px">${W.STANCES[c.stance].desc}</div>
      ${beastBlock(c)}
      ${advice[c.cid] ? `<div class="small advice">Suggested to release. ${advice[c.cid]}</div>` : ''}</div>`;
  }).join('');
  return `<div class="topbar"><h1>Creatures</h1><button class="sm" data-a="back">Back</button></div>
    <p class="muted">${S.creatures.length} of ${cap} places. Hesk can tame a beast in battle once it's badly hurt, even with the kennels full: you choose who to let go after. One creature fights beside you and earns XP. ${S.buildings.kennels >= 3 ? 'The rest earn three quarters XP in the kennels.' : S.buildings.kennels >= 2 ? 'The rest earn half XP in the kennels.' : ''} Potential is how strong a creature can end up, not how strong it is now.</p>
    ${kennelUpgrade()}
    ${list || '<div class="card muted">No creatures yet.</div>'}
    ${!S.buildings.kennels ? '<button class="big" data-a="board">More room: build kennels on the noticeboard</button>' : ''}
    <div class="card"><h2>Beast book</h2><p class="muted small">${Object.keys(S.dex || {}).length} of ${Object.keys(W.CREATURES).length} kinds tamed. Rewards at 3, 5, 8 and 10.</p>
      <div class="list">${Object.keys(W.CREATURES).map(k => { const has = S.dex && S.dex[k]; return `<div class="row">${has ? img(W.CREATURES[k].sprite, 2) : `<span style="opacity:.25;filter:brightness(0)">${img(W.CREATURES[k].sprite, 2)}</span>`}<div class="grow"><b>${has ? W.CREATURES[k].name : '???'}</b><div class="small muted">${W.HABITAT[k]}</div></div></div>`; }).join('')}</div></div>`;
};

SCREENS.yard = () => {
  const cost = E.sparCost(S);
  return `<div class="topbar"><h1>Training yard</h1><span class="goldtxt">${S.gold} g</span></div>
    <p class="muted">Heroes on the bench earn ${Math.round(W.YARD_RATE[S.buildings.yard] * 100)}% of fight XP here. Anyone behind the leader earns bonus XP in every fight. A sparring session gives a big chunk of XP to one hero, once each per rest.</p>
    <div class="card list">${S.roster.map(id => {
      const h = S.heroes[id];
      return `<div class="spread"><div class="grow"><b>${heroName(id)}</b> <span class="muted small">Lv ${h.lvl}${S.party.includes(id) ? '' : ', bench'}</span>
        <div class="bar xp" style="margin-top:4px"><i style="width:${pct(h.xp, E.xpNext(h.lvl))}%"></i></div></div>
        <button class="sm gold" data-a="spar" data-v="${id}" ${S.spar[id] || S.gold < cost ? 'disabled' : ''}>${S.spar[id] ? 'Done' : `Spar ${cost} g (+${E.sparXp(S, id)} XP)`}</button></div>`;
    }).join('')}</div>
    <button class="big" data-a="keep">Back</button>`;
};

SCREENS.shop = () => {
  const tab = view.tab || 'buy';
  const name = S.flags.raid_done ? 'Tilly\'s stall' : S.shopTier >= 2 ? 'Hob\'s Trading Post' : 'Supplies';
  let body = '';
  if (tab === 'buy') {
    const items = Object.keys(D.ITEMS).filter(k => D.ITEMS[k].tier <= S.shopTier);
    const gear = Object.keys(D.GEAR).filter(k => !D.GEAR[k].unique && D.GEAR[k].tier && D.GEAR[k].tier <= S.shopTier);
    body = `<div class="card"><h2>Supplies</h2><div class="list">${items.map(k => {
      const it = D.ITEMS[k];
      return `<div class="spread"><div class="grow"><b>${it.name}</b> <span class="muted small">× ${S.bag[k] || 0}</span><div class="small muted">${it.desc}</div></div>
        <button class="sm gold" data-a="buy" data-v="${k}" ${S.gold < it.price ? 'disabled' : ''}>${it.price} g</button></div>`;
    }).join('')}</div></div>
    <div class="card"><h2>Arms and armour</h2>${S.shopTier < 3 ? `<p class="muted small">${S.shopTier < 2 ? 'Basic stock only. A proper trader would carry better.' : 'Steel will come once the roads are safer.'}</p>` : ''}
    <div class="list">${gear.sort((a, b) => D.GEAR[a].slot.localeCompare(D.GEAR[b].slot) || D.GEAR[a].price - D.GEAR[b].price).map(k => {
      const g = D.GEAR[k], own = S.gear.filter(x => x.id === k).length;
      return `<div class="spread"><div class="grow"><b>${g.name}</b> <span class="muted small">${g.slot}${own ? ', own ' + own : ''}</span><div class="small muted">${gearDesc({ id: k, plus: 0 })}</div></div>
        <button class="sm gold" data-a="buyGear" data-v="${k}" ${S.gold < g.price ? 'disabled' : ''}>${g.price} g</button></div>`;
    }).join('')}</div></div>`;
  } else {
    const spare = S.gear.filter(g => !E.equippedBy(S, g.uid));
    body = `<div class="card"><h2>Sell spare gear</h2><p class="muted small">Only gear nobody is wearing.</p><div class="list">${spare.length ? spare.map(g => `<div class="spread"><div class="grow"><b>${E.gearName(g)}</b><div class="small muted">${gearDesc(g)}</div></div>
      <button class="sm" data-a="sell" data-v="${g.uid}">Sell ${E.sellPrice(g)} g</button></div>`).join('') : '<p class="muted">Nothing spare.</p>'}</div></div>`;
  }
  return `<div class="topbar"><h1>${name}</h1><span class="goldtxt">${S.gold} g</span></div>
    <div class="tabs"><button class="${tab === 'buy' ? 'on' : ''}" data-a="stab" data-v="buy">Buy</button><button class="${tab === 'sell' ? 'on' : ''}" data-a="stab" data-v="sell">Sell</button><button data-a="keep">Back</button></div>${body}`;
};

SCREENS.forge = () => {
  const mats = Object.keys(D.MATS).map(m => `<span class="pill">${D.MATS[m].name} ${S.mats[m] || 0}</span>`).join(' ');
  const list = S.gear.slice().sort((a, b) => (E.equippedBy(S, b.uid) ? 1 : 0) - (E.equippedBy(S, a.uid) ? 1 : 0)).map(g => {
    const c = E.forgeCost(g), by = E.equippedBy(S, g.uid);
    const next = c ? E.gearStats({ id: g.id, plus: g.plus + 1 }) : null;
    return `<div><div class="spread"><div class="grow"><b>${E.gearName(g)}</b>${by ? ` <span class="pill">${heroName(by)}</span>` : ''}
      <div class="small muted">${gearDesc(g)}</div>
      ${c ? `<div class="small">Next: <span class="up">${statLine(next)}</span></div><div class="small muted">${costText(c)}</div>` : '<div class="small" style="color:var(--gold)">Fully forged</div>'}</div>
      ${c && Object.keys(D.GEAR[g.id].stats || {}).length ? `<button class="sm gold" data-a="forgeIt" data-v="${g.uid}" ${E.canForge(S, g) ? '' : 'disabled'}>Forge</button>` : ''}</div></div>`;
  }).join('');
  return `<div class="topbar"><h1>Bram's forge</h1><span class="goldtxt">${S.gold} g</span></div>
    <p class="muted">His father's tools, cleaned and hung back up. Each level adds 15% to a piece's stats, up to +5. Materials come from fights and foraging.</p>
    <div class="card">${mats}</div><div class="card list">${list}</div><button class="big" data-a="keep">Back</button>`;
};

SCREENS.bag = () => {
  const items = Object.keys(D.ITEMS).filter(k => S.bag[k] > 0);
  const casters = [];
  for (const id of S.roster) {
    const st = E.heroStats(S, id);
    for (const s of st.skills) if (['heal', 'revive'].includes(D.SKILLS[s].type)) casters.push({ id, s });
  }
  return `<div class="topbar"><h1>Bag</h1><button class="sm" data-a="back">Back</button></div>
    <div class="card">${partyMini()}</div>
    <div class="card"><h2>Items</h2><div class="list">${items.length ? items.map(k => {
      const it = D.ITEMS[k], field = !it.bomb && !it.flee && !it.cure && !it.foeStatus;
      return `<div class="spread"><div class="grow"><b>${it.name}</b> <span class="muted small">× ${S.bag[k]}</span><div class="small muted">${it.desc}</div></div>
        ${field ? `<button class="sm gold" data-a="useItem" data-v="${k}">Use</button>` : '<span class="muted small">In battle</span>'}</div>`;
    }).join('') : '<p class="muted">Empty.</p>'}</div></div>
    ${casters.length ? `<div class="card"><h2>Healing magic</h2><div class="list">${casters.map(c => {
      const sk = D.SKILLS[c.s];
      return `<div class="spread"><div class="grow"><b>${sk.name}</b> <span class="muted small">${heroName(c.id)}, ${sk.mp} MP (has ${S.heroes[c.id].mp})</span></div>
        <button class="sm gold" data-a="castField" data-v="${c.id}:${c.s}">Cast</button></div>`;
    }).join('')}</div></div>` : ''}
    <div class="card"><h2>Materials</h2>${Object.keys(D.MATS).map(m => `<span class="pill">${D.MATS[m].name} ${S.mats[m] || 0}</span>`).join(' ')}</div>`;
};

SCREENS.settings = () => `<div class="topbar"><h1>Settings</h1><button class="sm" data-a="keep">Back</button></div>
  <div class="card"><h2>Battle speed</h2><div class="row">
    <button class="${S.opts.speed !== 2 ? 'gold' : ''}" data-a="speed" data-v="1">Normal</button>
    <button class="${S.opts.speed === 2 ? 'gold' : ''}" data-a="speed" data-v="2">Fast</button></div>
    <div class="row"><span class="muted small" style="flex:1">Screen shake on big hits</span><button class="sm ${S.opts.shake !== false ? 'gold' : ''}" data-a="shakeOpt">${S.opts.shake !== false ? 'On' : 'Off'}</button></div>
    <p class="muted small">Auto battle can be switched on and off during any fight. Handy for training.</p></div>
  <div class="card"><h2>Sound</h2><div class="row">
    <button class="${S.opts.music !== false ? 'gold' : ''}" data-a="music">Music ${S.opts.music !== false ? 'on' : 'off'}</button>
    <button class="${S.opts.sfx !== false ? 'gold' : ''}" data-a="sfx">Sounds ${S.opts.sfx !== false ? 'on' : 'off'}</button></div>
    <p class="muted small">On iPhone, the ring/silent switch mutes the game.</p></div>
  <div class="card"><h2>Your save</h2><p class="muted small">The game saves itself on this phone after every step. Browsers can clear saved data, so save a backup file now and then. On Android it opens the share sheet: send it to Drive, email or a chat with yourself.</p>
    <button class="primary" data-a="exportSave">Save a backup file</button> <button data-a="importFile">Load a backup file</button>
    <div style="margin-top:10px"><button class="link small" data-a="importOpen">Paste a save code instead</button></div></div>
  <div class="card"><h2>Record</h2><p class="muted small">${S.stats.wins} fights won of ${S.stats.battles}. ${S.stats.steps} moves on the map.</p></div>
  <div class="card"><h2>Start again</h2><p class="muted small">Wipes this save.</p><button data-a="wipe" style="border-color:var(--bad);color:var(--bad)">New game</button></div>`;

const FOE_SHORT = t => SG.FOES[t].name;
SCREENS.defend = () => {
  const best = S.siege.best, next = Math.min(SG.MAX_NIGHT, best + 1);
  const types = n => [...new Set(SG.night(n).flat().map(e => e.t))];
  const ms = n => {
    const m = SG.MILESTONES[n];
    if (!m) return '';
    return 'First time: ' + [m.gold ? m.gold + ' gold' : '', m.tome ? 'a Tome of Insight' : '', m.gear ? D.GEAR[m.gear].name : '', m.mats ? Object.keys(m.mats).map(k => m.mats[k] + ' ' + D.MATS[k].name).join(', ') : ''].filter(Boolean).join(', ');
  };
  const troops = ['archer', 'sword', 'spear', 'priest', 'knight', 'ballista'].map(k => {
    const d = SG.UNITS[k], ok = !d.req || (S.buildings[d.req[0]] || 0) >= d.req[1];
    return `<div class="spread" style="${ok ? '' : 'opacity:.5'}"><div class="row">${img(d.sprite, 2)}<div><b>${d.name}</b> <span class="muted small">${d.cost} levy</span><div class="small muted">${ok ? d.desc : 'Needs ' + (d.req[0] === 'barracks' ? 'barracks level ' + d.req[1] : 'stone walls')}</div></div></div></div>`;
  }).join('');
  const powers = S.party.map(id => `<div class="small"><b>${heroName(id)}: ${SG.POWERS[id].name}</b> <span class="muted">${SG.POWERS[id].desc}</span></div>`).join('');
  const stars = n => '★'.repeat(S.siege.stars[n] || 0) + '☆'.repeat(3 - (S.siege.stars[n] || 0));
  const past = [];
  for (let n = best; n >= 1; n--) past.push(`<div class="spread"><span>Night ${n} <span style="color:var(--gold)">${stars(n)}</span></span><button class="sm" data-a="night" data-v="${n}">Replay</button></div>`);
  return `<div class="topbar"><h1>Defend Emberwake</h1><button class="sm" data-a="keep">Back</button></div>
    <p class="muted">The Hollow come at night. Spend levy on soldiers, place your heroes and use their powers. Tap your soldiers to select them and tap the ground to send them where they're needed. Hold until dawn. The keep falls if its hall is broken.</p>
    ${best < SG.MAX_NIGHT ? `<div class="card defend alert"><div class="spread"><b class="serif" style="font-size:1.15rem">Night ${next}</b><span class="pill bad">${SG.night(next).length} waves</span></div>
      <div class="small muted" style="margin-top:4px">Expect: ${types(next).map(FOE_SHORT).join(', ')}.</div>
      <div class="small" style="margin-top:4px;color:var(--gold)">${ms(next) || 'Gold, iron and shadow shards.'}</div>
      <button class="primary big" data-a="night" data-v="${next}">Man the walls</button></div>` : '<div class="card">Every night held. Emberwake stands. Replay any night for more stars and materials.</div>'}
    ${best >= 1 ? `<div class="card defend"><div class="spread"><b class="serif" style="font-size:1.1rem">Your castle</b><span class="pill">${SG.castle(S).pieces.length} pieces</span></div>
      <div class="small muted" style="margin-top:4px">Lay out walls, towers, moats, stakes, killing pits and pitch ditches in front of the gate, and braziers and mangonels in the yard. The Hollow have to go round what you build, or smash through it. Anything broken is rebuilt for the next night.</div>
      <button class="big gold" data-a="fortify">Fortify the castle</button></div>` : ''}
    <div class="card"><h2>Your defences</h2>
      <div class="small">Gate ${Math.round(700 * [1, 1.5, 2.1][S.buildings.walls || 0])} · ${S.buildings.walls ? 'Stone walls' : 'Wooden palisade'}${S.buildings.walls >= 2 ? ' with burning oil' : ''} · Barracks ${S.buildings.barracks ? 'level ' + S.buildings.barracks : 'not built'}</div>
      <div class="list" style="margin-top:6px">${troops}</div>
      <h3>Hero powers</h3>${powers}<p class="muted small">Heroes fight at the strength they have in your party, so levels and gear count here too. Change who goes from Party, Line-up.</p>
      <button class="sm" data-a="board">Build barracks and walls</button></div>
    ${past.length ? `<div class="card"><h2>Nights held</h2><div class="list">${past.join('')}</div><p class="muted small">Replays pay less gold but still give iron and shards.</p></div>` : ''}`;
};

SCREENS.market = () => {
  const ranks = W.ARENA.map((rank, ri) => {
    const prevFinal = ri > 0 ? W.ARENA[ri - 1].bouts[W.ARENA[ri - 1].bouts.length - 1] : null;
    const open = !prevFinal || S.arena.won[prevFinal.id];
    const bouts = rank.bouts.map((b, bi) => {
      const won = S.arena.won[b.id], can = E.boutOpen(S, ri, bi);
      const foes = E.boutFoes(b).map(f => `${f.name || D.ENEMIES[f.t].name} Lv ${f.lvl}`).join(', ');
      const pz = b.prize, prize = [pz.gold ? pz.gold + ' gold' : '', pz.tome ? 'Tome of Insight' : '', pz.gear ? D.GEAR[pz.gear].name : '', pz.creature ? 'a rare creature' : '', pz.items ? Object.keys(pz.items).map(k => pz.items[k] + ' ' + D.ITEMS[k].name).join(', ') : ''].filter(Boolean).join(', ');
      return `<div class="bout ${won ? 'won' : ''} ${b.final ? 'final' : ''}" style="${can || won ? '' : 'opacity:.5'}"><div class="spread"><b>${b.name}</b>${won ? '<span class="pill good">Won</span>' : b.final ? '<span class="pill bad">Final</span>' : ''}</div>
        <div class="small muted">${b.desc}</div><div class="small" style="margin-top:4px">${foes}</div>
        <div class="small" style="color:var(--gold);margin-top:2px">${won ? 'Rematch pays gold' : 'Prize: ' + prize}</div>
        ${can ? `<button class="sm ${won ? '' : 'gold'}" style="margin-top:6px" data-a="bout" data-v="${b.id}">${won ? 'Rematch' : 'Fight'}</button>` : ''}</div>`;
    }).join('');
    return `<div class="card"><div class="spread"><h2 style="margin:0">${rank.name}</h2><span class="muted small">Suggested Lv ${rank.lvl}</span></div>
      ${open ? '' : `<p class="muted small">Win the ${W.ARENA[ri - 1].name} final to enter.</p>`}${bouts}</div>`;
  }).join('');
  return `<div class="topbar"><h1>Brightwater</h1><span class="goldtxt">${S.gold} g</span></div>
    <p class="muted">The pit master takes your names. Healers patch you up before every bout, and losing costs nothing but pride.</p>
    ${ranks}<button class="big" data-a="map">Back to the road</button>`;
};

// ---------- Actions ----------
ACT.newGame = () => {
  if (load() && !confirm('Start a new game? Your current save will be replaced.')) return;
  S = E.newGame(); save();
  scene('intro', () => { go('keep'); toast('Check the Noticeboard to see what you can unlock.', 3200); });
};
function boot(obj) {
  S = E.migrate(obj);
  AU.set({ music: S.opts && S.opts.music !== false, sfx: S.opts && S.opts.sfx !== false });
  if (!S.opts) S.opts = { speed: 1 };
  // first-version war saves: named squads become companies. Never let a failed upgrade stop the game loading.
  if (S.war && WAR) { try { WAR.upgrade(S); } catch (e) { console.error(e); } }
  E.clampParty(S); save();
}
ACT.continue = () => {
  const old = load();
  const wasV1 = old && (!old.v || old.v < 2);
  boot(old);
  go('keep');
  if (wasV1) overlay(`<div class="sheet"><h2>Emberwake has changed</h2><p>Areas are now maps you explore, there are people to recruit, creatures to tame, Ember Surge and a noticeboard of things to unlock.</p>
    <p class="muted small">Your heroes, levels, gear, gold and cleared areas are kept. Maps start fresh, so there's treasure to find even in places you've cleared.</p>
    <button class="primary big" data-a="closeOv">Let's see</button></div>`, 'center');
};
ACT.keep = () => go('keep');
ACT.raid = () => startRaid();
ACT.defend = () => go('defend');
ACT.fortify = () => {
  if (stopScene) { stopScene(); stopScene = null; }
  SUI.runFortify(S, () => { save(); go('defend'); });
};
ACT.night = v => {
  const n = +v;
  if (stopScene) { stopScene(); stopScene = null; }
  SUI.runSiege(S, n, r => siegeOver(r));
};
function siegeOver(r) {
  if (r.result === 'retreat') { go('defend'); return; }
  if (r.result === 'lost') {
    save(); go('defend');
    overlay(`<div class="sheet" style="text-align:center"><h2>Emberwake falls</h2><p>The Hollow break into the hall. The survivors drive them out at dawn with pitchforks and fire, but it was close.</p>
      <p class="muted">Nothing is lost. Level up your heroes, build the barracks and walls, then try Night ${r.n} again.</p>
      <button class="primary big" data-a="closeOv">Back</button></div>`, 'center');
    return;
  }
  const out = SG.reward(S, r.n, r.stars);
  save(); go('defend');
  overlay(`<div class="sheet" style="text-align:center"><h2>Dawn! Night ${r.n} held</h2>
    <div class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)}</div>
    <p class="muted small">${r.kills} Hollow fell. ${r.lost ? r.lost + ' of your soldiers died.' : 'Not one soldier lost.'} ${r.stars < 3 ? 'Keep the gate intact and the hall unharmed for three stars.' : ''}</p>
    <p><b class="goldtxt">${out.got.join(', ')}</b></p>${out.text ? `<p>${out.text}</p>` : ''}
    <button class="primary big" data-a="siegeDone">Continue</button></div>`, 'center');
  ACT.siegeDone = () => {
    closeOverlay();
    const after = () => { if (out.gearUid) equipPrompt(E.gearOf(S, out.gearUid)); };
    if (r.n === 1 && out.first) scene('siege1_won', () => { go('keep'); after(); });
    else after();
  };
}
ACT.market = () => {
  if (!S.flags.seen.arena_intro) scene('arena_intro', () => go('market'));
  else go('market');
};
ACT.bout = id => {
  const b = E.findBout(id);
  E.healParty(S);
  startBattle(E.boutFoes(b), { area: 'arena', boss: true, arena: id });
};
ACT.map = () => go('map');
ACT.board = () => go('board');
ACT.yard = () => go('yard');
ACT.creatures = () => go('creatures', { from: view.name === 'creatures' ? view.from : view.name, fromId: view.id, fromTab: view.tab });
ACT.rest = () => {
  E.restParty(S);
  if (!warOn()) { toast('The party rests. Everyone is back to full, and foraging spots have grown back.'); render(); return; }
  const rep = WAR.day(S);
  // Generals and the wounded can't fight in the party.
  save();
  dayReport(rep, () => { if (rep.siege) warSiege(rep); else render(); });
};
ACT.party = () => go('party', { hero: S.party[0], tab: 'stats', from: view.name === 'party' ? view.from : view.name, fromId: view.id });
ACT.bag = () => go('bag', { from: view.name, fromId: view.id });
ACT.back = () => {
  if (view.from === 'area') go('area', { id: view.fromId });
  else if (view.from === 'party') go('party', { hero: S.party[0], tab: view.fromTab || 'lineup', from: 'keep' });
  else go(view.from || 'keep');
};
ACT.shop = () => go('shop', { tab: 'buy' });
ACT.forge = () => go('forge');
ACT.settings = () => go('settings');
ACT.phero = v => { view.hero = v; view.slot = null; render(); };
ACT.ptab = v => { view.tab = v; view.slot = null; if (!view.hero) view.hero = S.party[0]; render(); };
ACT.stab = v => { view.tab = v; render(); };
ACT.learn = v => {
  if (E.learnTalent(S, view.hero, v)) {
    const h = S.heroes[view.hero], r = h.talents[v], rk = E.treeRanks(h, v)[r - 1];
    toast(`${heroName(view.hero)} learned ${rk.skill ? D.SKILLS[rk.skill].name : rk.text}`);
    if (r === D.COMBO_RANK) for (const c of E.combosOf(h).filter(c => c.trees.includes(v))) setTimeout(() => toast(`Combo art! ${heroName(view.hero)} can now use <b>${D.SKILLS[c.skill].name}</b>.`, 3200), 900);
    if (r === 6) setTimeout(() => toast(`${D.TREES[v].name} mastered. Choose the path it takes.`, 3200), 900);
    view.open = v; render();
  }
};
ACT.slot = v => { view.slot = v || null; render(); };
ACT.equip = v => { E.equip(S, view.hero, view.slot, v === 'none' ? null : +v); view.slot = null; render(); };
ACT.swapIn = v => {
  overlay(`<div class="sheet"><h2>Bring in ${heroName(v)} for</h2>${S.party.map(id => `<button class="big" data-a="swapDo" data-v="${v}:${id}">${heroName(id)}</button>`).join('')}<button class="link" data-a="closeOv">Cancel</button></div>`);
};
ACT.swapOut = v => {
  const bench = S.roster.filter(id => !S.party.includes(id));
  overlay(`<div class="sheet"><h2>Swap ${heroName(v)} for</h2>${bench.map(id => `<button class="big" data-a="swapDo" data-v="${id}:${v}">${heroName(id)}</button>`).join('')}<button class="link" data-a="closeOv">Cancel</button></div>`);
};
ACT.swapDo = v => {
  const [inn, out] = v.split(':');
  S.party = S.party.map(id => id === out ? inn : id);
  closeOverlay(); toast(`${heroName(inn)} is in, ${heroName(out)} sits out.`); render();
};
ACT.companion = v => { S.companion = +v; toast(E.creatureName(E.creatureOf(S, +v)) + ' comes with you.'); render(); };
ACT.stance = v => { const [cid, s] = v.split(':'); E.creatureOf(S, +cid).stance = s; render(); };
ACT.release = v => {
  const c = E.creatureOf(S, +v), pot = E.potential(c);
  overlay(`<div class="sheet" style="text-align:center"><h2>Release ${esc(E.creatureName(c))}?</h2>${img(E.creatureSprite(c), 4)}
    <p>Level ${c.lvl} · Potential ${stars(pot.stars)}</p><p class="muted small">It goes back to the wild. This can't be undone.</p>
    <button class="primary big" data-a="releaseGo" data-v="${c.cid}">Release</button><button class="big" data-a="closeOv">Keep it</button></div>`, 'center');
};
ACT.releaseGo = v => {
  const c = E.creatureOf(S, +v);
  closeOverlay();
  if (!c) return;
  S.creatures = S.creatures.filter(x => x !== c);
  if (S.companion === c.cid) S.companion = S.creatures[0] ? S.creatures[0].cid : null;
  toast(`${E.creatureName(c)} runs off into the trees.`);
  save();
  if (ACT.afterRoom) { const f = ACT.afterRoom; if (S.creatures.length <= E.capacity(S)) { ACT.afterRoom = null; f(); } else makeRoom(f); return; }
  render();
};
ACT.kennelUp = () => { if (E.build(S, 'kennels')) { toast(`Kennels expanded: room for ${E.capacity(S)}.`); save(); render(); } };
// Over capacity after a tame: pick who goes, new arrival included. The suggested ones are marked.
function makeRoom(then) {
  ACT.afterRoom = then;
  const advice = E.releaseAdvice(S), cap = E.capacity(S);
  overlay(`<div class="sheet levelup"><h2>The kennels are full</h2><p class="muted">${S.creatures.length} creatures, room for ${cap}. Let one go.</p>
    ${S.creatures.slice().sort((a, b) => (advice[b.cid] ? 1 : 0) - (advice[a.cid] ? 1 : 0) || E.potential(a).score - E.potential(b).score).map(c => {
      const pot = E.potential(c), isNew = c === S.creatures[S.creatures.length - 1];
      return `<div class="lvcard ${advice[c.cid] ? 'advise' : ''}"><div class="spread"><div class="row">${img(E.creatureSprite(c), 3)}<div><b>${esc(E.creatureName(c))}</b>${isNew ? ' <span class="pill good">New</span>' : ''}${S.companion === c.cid ? ' <span class="pill">With you</span>' : ''}
        <div class="small">Lv ${c.lvl} · ${stars(pot.stars)}</div></div></div>
        <button class="sm ${advice[c.cid] ? 'bad' : ''}" data-a="releaseGo" data-v="${c.cid}" ${S.companion === c.cid ? 'disabled' : ''}>Release</button></div>
        ${advice[c.cid] ? `<div class="small advice">${advice[c.cid]}</div>` : ''}</div>`;
    }).join('')}
    ${E.buildCost(S, 'kennels') && E.canAfford(S, E.buildCost(S, 'kennels')) && S.buildings.kennels ? `<button class="big gold" data-a="roomUp">Expand the kennels instead (${costText(E.buildCost(S, 'kennels'))})</button>` : ''}</div>`, 'center');
}
ACT.roomUp = () => { E.build(S, 'kennels'); save(); closeOverlay(); toast(`Kennels expanded: room for ${E.capacity(S)}.`); const f = ACT.afterRoom; ACT.afterRoom = null; if (S.creatures.length > E.capacity(S)) makeRoom(f); else f(); };
ACT.build = b => {
  if (E.build(S, b)) { toast(`${W.BUILDINGS[b].name} built. ${W.BUILDINGS[b].levels[S.buildings[b] - 1].text}`, 3200); render(); }
};
ACT.spar = id => {
  const r = E.spar(S, id);
  if (r) { toast(`${heroName(id)} spars. +${r.xp} XP${r.levels ? ` · <b style="color:var(--gold)">Level ${S.heroes[id].lvl}!</b>` : ''}`); render(); }
};
ACT.buy = k => {
  const it = D.ITEMS[k];
  if (S.gold < it.price) return;
  S.gold -= it.price; S.bag[k] = (S.bag[k] || 0) + 1; render();
};
ACT.buyGear = k => {
  const g = D.GEAR[k];
  if (S.gold < g.price) return;
  S.gold -= g.price;
  const inst = E.addGear(S, k);
  render();
  equipPrompt(inst);
};
function equipPrompt(inst) {
  if (!inst) return;
  const slot = D.GEAR[inst.id].slot;
  if (slot === 'beast') { beastPicker(inst); return; }
  overlay(`<div class="sheet"><h2>${E.gearName(inst)}</h2><p class="muted small">${gearDesc(inst)}</p><p>Who should use it?</p>
    ${S.roster.map(id => `<div class="spread" style="padding:6px 0;border-bottom:1px solid var(--line)"><div class="grow"><b>${heroName(id)}</b><div class="small">${deltaFor(id, slot, inst.uid)}</div></div>
      <button class="sm gold" data-a="equipOn" data-v="${id}:${inst.uid}">Equip</button></div>`).join('')}
    <button class="big" data-a="closeOv">Keep it in the bag</button></div>`);
}
ACT.equipOn = v => {
  const [id, uid] = v.split(':');
  E.equip(S, id, D.GEAR[E.gearOf(S, +uid).id].slot, +uid);
  closeOverlay(); toast(`${heroName(id)} equips it.`); render();
};
ACT.closeOv = () => closeOverlay();
ACT.sell = v => {
  const g = E.gearOf(S, +v);
  if (!g || E.equippedBy(S, g.uid) || E.beastOwner(S, g.uid)) return;
  S.gold += E.sellPrice(g);
  S.gear = S.gear.filter(x => x !== g);
  render();
};
ACT.forgeIt = v => { if (E.forge(S, +v)) { toast('Forged ' + E.gearName(E.gearOf(S, +v))); render(); } };
ACT.useItem = k => {
  const it = D.ITEMS[k];
  if (it.partyHeal) { if (E.fieldItem(S, k)) { toast('Everyone eats. HP and MP restored.'); render(); } return; }
  pickHero(`Use ${it.name} on`, id => {
    if (E.fieldItem(S, k, id)) { toast(`${it.name} used on ${heroName(id)}`); render(); }
    else toast('That wouldn\'t do anything.');
  }, it.revive);
};
ACT.castField = v => {
  const [caster, s] = v.split(':'), sk = D.SKILLS[s];
  const run = target => { if (E.fieldHeal(S, caster, s, target)) { toast(`${sk.name} cast`); render(); } else toast('Not now. Not enough MP, or nobody needs it.'); };
  if (sk.target === 'ally' || sk.target === 'deadAlly') pickHero(`${sk.name} on`, run, sk.target === 'deadAlly');
  else run(caster);
};
function pickHero(title, cb, dead) {
  overlay(`<div class="sheet"><h2>${title}</h2>${S.roster.map(id => {
    const h = S.heroes[id], st = E.heroStats(S, id);
    return `<button class="big" data-a="pickHero" data-v="${id}" ${dead ? (h.hp > 0 ? 'disabled' : '') : (h.hp <= 0 ? 'disabled' : '')}>${heroName(id)} · HP ${h.hp}/${st.maxHp} · MP ${h.mp}/${st.maxMp}</button>`;
  }).join('')}<button class="link" data-a="closeOv">Cancel</button></div>`);
  ACT.pickHero = id => { closeOverlay(); cb(id); };
}
ACT.evolveSkill = v => {
  const [skill, k] = v.split(':'), id = view.hero, opt = D.SKILL_EVO[skill][+k];
  overlay(`<div class="sheet" style="text-align:center"><h2>Evolve ${D.SKILLS[skill].name}?</h2><p><b style="color:var(--gold)">${opt.name}</b>: ${opt.desc}</p>
    <p class="muted small">This can't be undone. The other choice will be gone for ${heroName(id)}.</p>
    <button class="primary big" data-a="evolveGo" data-v="${v}">Evolve</button><button class="big" data-a="closeOv">Not yet</button></div>`, 'center');
};
ACT.choosePath = v => {
  const [tk, k] = v.split(':'), pp = D.TREES[tk].paths[+k];
  overlay(`<div class="sheet" style="text-align:center"><h2>The path of the ${pp.name}?</h2><p>${pp.desc}</p>
    <div style="text-align:left">${pp.ranks.map((rk, i) => `<div class="rank">${i + 7}. ${rk.skill ? `<b>${D.SKILLS[rk.skill].name}</b> <span class="muted">${D.SKILLS[rk.skill].desc}</span>` : rk.text} <span class="muted small">(Lv ${D.PATH_REQ[i]})</span></div>`).join('')}</div>
    <p class="muted small">This can't be undone. The other path will be gone for ${heroName(view.hero)}.</p>
    <button class="primary big" data-a="pathGo" data-v="${v}">Choose ${pp.name}</button><button class="big" data-a="closeOv">Not yet</button></div>`, 'center');
};
ACT.pathGo = v => {
  const [tk, k] = v.split(':');
  closeOverlay();
  if (E.choosePath(S, view.hero, tk, +k)) { AU.sfx('level'); toast(`${heroName(view.hero)} walks the path of the <b>${D.TREES[tk].paths[+k].name}</b>.`, 3000); }
  view.open = tk; render();
};
ACT.evolveGo = v => {
  const [skill, k] = v.split(':'), opt = E.evolveSkill(S, view.hero, skill, +k);
  closeOverlay();
  if (opt) { AU.sfx('level'); toast(`${D.SKILLS[skill].name} evolved into <b>${opt.name}</b>!`, 3000); }
  render();
};
ACT.music = () => { S.opts.music = S.opts.music === false; AU.set({ music: S.opts.music }); render(); };
ACT.sfx = () => { S.opts.sfx = S.opts.sfx === false; AU.set({ sfx: S.opts.sfx }); render(); };
ACT.speed = v => { S.opts.speed = +v; render(); };
ACT.shakeOpt = () => { S.opts.shake = S.opts.shake === false; render(); };

// Save files
const saveCode = () => 'EMBER1.' + btoa(unescape(encodeURIComponent(JSON.stringify(S))));
function parseCode(t) {
  const m = String(t || '').match(/EMBER1\.([A-Za-z0-9+/=]+)/);
  if (!m) return null;
  try { const o = JSON.parse(decodeURIComponent(escape(atob(m[1])))); return o.heroes && o.areas ? o : null; } catch (e) { return null; }
}
ACT.exportSave = async () => {
  const d = new Date(), stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const name = `emberwake-save-${stamp}.txt`, text = saveCode();
  const file = new File([text], name, { type: 'text/plain' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Emberwake save' }); toast('Backup sent.'); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('Backup file saved to your downloads.');
};
ACT.importFile = () => {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.txt,text/plain';
  inp.onchange = () => {
    const f = inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const obj = parseCode(r.result);
      if (!obj) { toast('That file isn\'t an Emberwake save.'); return; }
      if (S && !confirm('Replace the game on this phone with this backup?')) return;
      boot(obj); toast('Save loaded.'); go('keep');
    };
    r.readAsText(f);
  };
  inp.click();
};
ACT.importOpen = () => overlay(`<div class="sheet"><h2>Paste a save code</h2><p class="muted small">Paste a code that starts EMBER1. This replaces the game on this phone.</p>
  <textarea id="imp"></textarea><button class="primary big" data-a="importGo">Load it</button><button class="link" data-a="closeOv">Cancel</button></div>`);
ACT.importGo = () => {
  const obj = parseCode(document.getElementById('imp').value);
  if (!obj) { toast('That code didn\'t work. Check you copied all of it, or use a backup file.'); return; }
  boot(obj); closeOverlay(); toast('Save loaded.'); go('keep');
};
ACT.wipe = () => {
  if (!confirm('Wipe this save and start again? This can\'t be undone unless you have a backup file.')) return;
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  S = null; go('title');
};

// ---------- Exploring ----------
ACT.enter = id => {
  const st = E.mapState(S, id);
  const open = () => go('area', { id, msg: null });
  if (!S.flags.seen[id + '_in']) scene(id + '_in', open); else open();
  void st;
};
function areaMsg(msg) { view.msg = msg; render(); }
ACT.node = nid => {
  const id = view.id, block = E.moveBlock(S, id, nid);
  if (block) { if (nid !== E.mapState(S, id).at) toast(block); return; }
  const r = E.move(S, id, nid);
  view.msg = null; render();
  if (r.ambush) startBattle(r.ambush, { area: id, ambush: true, after: arrive });
  else arrive();
};
function arrive() {
  const id = view.id, a = E.arrive(S, id), st = E.mapState(S, id);
  switch (a.type) {
    case 'fight':
      if (a.node === 'w13' && S.flags.wren_banished && !S.flags.wren_fate) {
        scene('wren_hollow', () => startBattle([{ t: 'hwren', lvl: 11 }, { t: 'soldier', lvl: 10 }], { area: id, boss: true, story: true, onWin: () => {
          E.winNode(S, id, 'w13');
          const saved = S.roster.includes('morwen');
          S.flags.wren_fate = saved ? 'saved' : 'dead';
          if (saved) E.rejoinHero(S, 'wren');
          save();
          scene(saved ? 'wren_saved' : 'wren_dies', () => { go('area', { id, msg: null }); afterStair(); });
        } }));
        return;
      }
      startBattle(a.enemies, { area: id, node: a.node }); return;
    case 'treasure':
      areaMsg(`Found <b class="goldtxt">${a.got.join(', ')}</b>.`);
      if (a.gearUid) setTimeout(() => equipPrompt(E.gearOf(S, a.gearUid)), 50);
      return;
    case 'gather': areaMsg(`Gathered <b>${a.got.join(', ')}</b>. It grows back after you rest at the keep.`); return;
    case 'camp': {
      const msg = a.healed ? 'You make camp for a while. <span class="up">Everyone recovers 35% HP and MP.</span>' : 'You\'ve already rested here. Rest at the keep and it will help again.';
      areaMsg(msg);
      if (a.talk) scene(a.talk, render);
      return;
    }
    case 'event': runEvent(); return;
    case 'quest': ACT.talk(); return;
    case 'boss': areaMsg(`${D.ENEMIES[E.area(id).boss[0].t].name} is here. Rest first if you need to. The keep is free.`); return;
    default: areaMsg(a.note || null); void st;
  }
}
function runEvent() {
  const id = view.id, st = E.mapState(S, id), n = E.node(id, st.at), ev = W.EVENTS[n.ev];
  scenes([], () => {});
  let i = 0;
  const o = overlay('', 'scene');
  const show = () => {
    if (i < ev.lines.length) {
      const [who, text] = ev.lines[i], hero = D.HEROES[who];
      o.innerHTML = `<div class="dialog">${hero ? `<div class="who">${img(hero.sprite, 3)}${hero.name}</div>` : ''}<div class="text ${hero ? '' : 'narr'}">${esc(text)}</div><div class="next">tap</div></div>`;
      o.onclick = () => { i++; show(); };
      return;
    }
    o.onclick = null;
    o.innerHTML = `<div class="dialog"><div class="text narr" style="margin-bottom:10px">What do you do?</div>
      ${ev.choices.map((c, k) => `<button class="big" data-a="choose" data-v="${k}">${c.label}</button>`).join('')}</div>`;
  };
  ACT.choose = k => {
    const text = E.eventChoice(S, id, n.id, +k);
    closeOverlay();
    areaMsg(esc(text || ''));
  };
  show();
}
ACT.eventGo = () => runEvent();
ACT.talk = () => {
  const id = view.id, n = E.node(id, E.mapState(S, id).at);
  const before = S.roster.length;
  const key = E.quest(S, n.q);
  save();
  scene(key, () => {
    render();
    if (S.roster.length > before) joinCard(S.roster[S.roster.length - 1]);
  });
};
const JOIN = {
  hesk: ['She brings a wolf cub that fights beside the party. In battle Hesk can <b>Tame</b> wounded beasts.', 'New on the noticeboard: kennels.'],
  dace: ['He can <b>Steal</b> in battle and pick locks. Take him back to the locked lodge in Thornwood and the toll house on the road.', ''],
  aldric: ['A wall in armour with holy steel. <b>Stand Fast</b> draws enemy attacks for free, and once his Oath tree is trained he refuses to fall. He opens <b>oathbound doors</b>: one in these hills, one in the tower.', 'His siege power, Oath of Iron, halves damage to every defender.'],
  morwen: ['Curses, drains and <b>Mire</b>, which slows every enemy at once. She sees <b>hidden paths</b>: one in this fen, one in the tower.', 'Her siege power, Mire, bogs down a whole crowd.'],
};
function joinCard(id) {
  const j = JOIN[id] || ['', ''];
  overlay(`<div class="sheet" style="text-align:center">${img(D.HEROES[id].sprite, 4)}<h2 style="margin-top:8px">${heroName(id)} joins!</h2>
    <p>${j[0]}</p><p class="muted small">${j[1]} Swap people in and out from Party, Line-up.</p>
    <button class="primary big" data-a="closeOv">Brilliant</button></div>`, 'center');
}
ACT.train = () => {
  const id = view.id, n = E.node(id, E.mapState(S, id).at);
  startBattle(E.randomFight(S, id, n), { area: id });
};
ACT.hunt = () => {
  const id = view.id, n = E.node(id, E.mapState(S, id).at), lvl = E.nodeLevel(S, id, n);
  const k = 1 + Math.floor(Math.random() * 2);
  const specs = [];
  for (let i = 0; i < k; i++) specs.push({ t: n.hunt[Math.floor(Math.random() * n.hunt.length)], lvl });
  startBattle(specs, { area: id, hunt: true });
};
ACT.ground = () => {
  const id = view.id;
  startBattle(E.huntFight(S, id), { area: id, ground: true, huntMult: E.huntMult(S, id) });
};
ACT.apex = () => {
  const id = view.id;
  startBattle(E.apexSpec(S, id), { area: id, ground: true, apex: true, huntMult: E.huntMult(S, id) });
};
ACT.boss = () => {
  const id = view.id, a = E.area(id);
  const specs = E.bossSpecs(a);
  if (id === 'tower' && S.flags.warden_secret) specs[0].hpx = 0.82;
  const el = a.c2 ? learnedEl() : null;
  if (el) specs[0].resist = el;
  const fight = () => startBattle(specs, { area: id, boss: true, learned: el });
  const pre = [];
  if (!S.flags.seen[id + '_boss']) pre.push(id + '_boss');
  if (id === 'barrows' && S.party.includes('aldric') && !S.flags.seen.shade_aldric) pre.push('shade_aldric');
  if (pre.length) scenes(pre, fight); else fight();
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const f = ACT[el.dataset.a];
  if (f) { e.preventDefault(); f(el.dataset.v, el); }
});

// ---------- The war (chapter two) ----------
const WAR = window.WAR;
const OWN_COL = { p: '#d4a630', h: '#7a3ab8' };
const warOn = () => WAR && WAR.active(S);
const pctTxt = p => Math.round(p * 100) + '%';
const pctPlus = x => (x >= 0 ? '+' : '') + Math.round(x * 100) + '%';
const ACT_COL = { march: '#7ad8ff', attack: '#e0574a', relieve: '#ffb84a' };
const ACT_TXT = { march: 'March', attack: 'Attack', relieve: 'Relieve' };
function regionState(id) {
  const r = S.war.regions[id];
  if (WAR.locked(S, id)) return { txt: 'Sealed', cls: '' };
  if (r.owner === 'p' && r.lost) return { txt: 'Ruins', cls: '' };
  if (r.owner === 'p') return { txt: r.siege ? 'Under siege!' : 'Yours', cls: r.siege ? 'bad' : 'good' };
  return { txt: r.lost ? 'Lost' : 'Hollow', cls: 'bad' };
}
const selArmy = () => S.war.armies.find(a => a.id === view.army) || null;
function warMapSVG() {
  const w = S.war, sel = view.region, army = selArmy();
  let g = '';
  for (const [a, b] of WAR.ROADS) { const A = WAR.REGIONS[a], B = WAR.REGIONS[b]; g += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="#3a3d52" stroke-width="1.1"/>`; }
  for (const h of w.hollow) {
    const next = WAR.path(h.at, h.to)[0], A = WAR.REGIONS[h.at];
    if (next) { const B = WAR.REGIONS[next]; g += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="#e0574a" stroke-width="1.4" stroke-dasharray="2 1.5"/>`; }
  }
  for (const id in WAR.REGIONS) {
    const R = WAR.REGIONS[id], r = w.regions[id], act = army ? WAR.action(S, army, id).kind : null;
    const col = WAR.locked(S, id) ? '#22222c' : r.lost && r.owner === 'p' ? '#5a5560' : OWN_COL[r.owner];
    const shape = R.kind === 'fort' || R.kind === 'citadel' ? `<rect x="-3.6" y="-3.6" width="7.2" height="7.2" rx="1" fill="${col}" stroke="${sel === id ? '#fff' : '#00000088'}" stroke-width="${sel === id ? 0.9 : 0.5}"/>`
      : `<circle r="${R.kind === 'keep' || R.kind === 'town' ? 4.2 : 3.4}" fill="${col}" stroke="${sel === id ? '#fff' : '#00000088'}" stroke-width="${sel === id ? 0.9 : 0.5}"/>`;
    g += `<g transform="translate(${R.x} ${R.y})" data-a="wRegion" data-v="${id}" style="cursor:pointer">
      ${act ? `<circle r="6.2" fill="none" stroke="${ACT_COL[act]}" stroke-width=".9" stroke-dasharray="1.6 1"/><text y="-7" text-anchor="middle" font-size="2.8" font-weight="700" fill="${ACT_COL[act]}">${ACT_TXT[act]}</text>` : ''}
      ${r.siege ? '<circle r="5.6" fill="none" stroke="#e0574a" stroke-width="1"><animate attributeName="r" values="5;6.5;5" dur="1s" repeatCount="indefinite"/></circle>' : ''}
      <circle r="7" fill="transparent"/>${shape}
      ${R.named && !r.lost ? '<circle cx="2.8" cy="-2.8" r="1.1" fill="#fff"/>' : ''}
      <text y="7.6" text-anchor="middle" font-size="2.9" fill="${r.lost ? '#8a8590' : '#e8e2d0'}">${R.name}</text></g>`;
  }
  const at = {};
  for (const a of w.armies) {
    const R = WAR.REGIONS[a.at], k = at[a.at] = (at[a.at] || 0) + 1, ready = WAR.ready(S, a);
    g += `<g transform="translate(${R.x - 6 + k * 2.6} ${R.y - 6.8})" data-a="wSel" data-v="${a.id}" style="cursor:pointer"><path d="M0 0h2.8v3.4l-1.4-.9-1.4.9z" fill="${a.id === view.army ? '#7ad8ff' : ready ? '#4a8ad8' : '#3a4050'}" stroke="#000" stroke-width=".3"/></g>`;
  }
  for (const h of w.hollow) { const R = WAR.REGIONS[h.at]; g += `<g transform="translate(${R.x + 3} ${R.y - 6.8})"><path d="M0 3.2L1.5 0 3 3.2z" fill="#e0574a" stroke="#000" stroke-width=".3"/></g>`; }
  return `<svg class="warsvg" viewBox="0 -4 100 104">${g}</svg>`;
}
function bonusText(b) {
  if (!b) return '';
  const n = { stat: 'hero stats', heroXp: 'hero XP', soldierXp: 'soldier XP', soldierPower: 'soldier strength', creatureXp: 'creature XP' };
  return Object.keys(b).map(k => k === 'shop' ? `tier ${b[k]} gear in the shops` : k === 'armyHeal' ? 'armies recover faster' : `+${Math.round(b[k] * 100)}% ${n[k]}`).join(', ');
}
function yieldText(y) { return y ? Object.keys(y).map(k => `${y[k]} ${k === 'gold' ? 'gold' : k === 'levy' ? 'levy' : D.MATS[k].name}`).join(', ') + ' a day' : ''; }
// "Soldiers 180 + Aldric +48% + forts +15% = 293"
function mineSum(a, b) {
  const parts = [`Soldiers ${b.soldiers}`];
  if (b.gen) parts.push(`${heroName(a.general)} ${pctPlus(b.gen)}`);
  if (b.lead) parts.push(`Leaders ${pctPlus(b.lead)}`);
  if (b.held) parts.push(`Forts held ${pctPlus(b.held)}`);
  if (b.tired) parts.push(`Regrouping ${pctPlus(b.tired)}`);
  return `${parts.join(' · ')} = <b>${b.total}</b>`;
}
function foeSum(f) {
  const parts = [];
  if (f.garrison) parts.push(f.walls > 1 ? `Garrison ${f.garrison} × walls ${f.walls}` : `Garrison ${f.garrison}`);
  if (f.armies) parts.push(`Hollow army ${f.armies}`);
  return `${parts.join(' + ')} = <b>${f.total}</b>`;
}
function oddsWord(p) { return p >= 0.8 ? 'very likely' : p >= 0.6 ? 'likely' : p >= 0.4 ? 'a coin toss' : p >= 0.2 ? 'unlikely' : 'very unlikely'; }
const WAR_HELP = `<details class="card"><summary><b>How the war works</b></summary><ol class="small" style="margin:6px 0 0 16px;padding:0">
  <li><b>Your turn:</b> each army can do one thing a day. Pick an army (blue flag), and the map shows where it can <span style="color:#7ad8ff">March</span> (your own ground), <span style="color:#e0574a">Attack</span> (Hollow ground) or <span style="color:#ffb84a">Relieve</span> (Hollow besieging your place). Only the next region along a road.</li>
  <li><b>Battles:</b> strength against strength. Auto-resolve rolls the odds shown. Fight it yourself and your party of three fights alongside the army's companies, which act on their own like your creature. Your party gives you a real edge.</li>
  <li><b>End the day</b> (or rest at the keep): the Hollow move. A Hollow army reaching your ground besieges it for a day. Relieve it the next day or it falls. An army standing there defends it automatically.</li>
  <li><b>Places with people</b> (white dot) are lost for good if they fall.</li>
  <li><b>Getting stronger:</b> recruit on your own ground, rank companies up in battle and spend their points, give each army a general (+2% strength per hero level), and hold forts for bonuses. Barracks and forts let armies grow bigger.</li></ol></details>`;
SCREENS.war = () => {
  const w = S.war, inc = WAR.income(S), mods = WAR.mods(S), sel = view.region, army = selArmy();
  let card = '';
  if (sel) {
    const R = WAR.REGIONS[sel], r = w.regions[sel], st = regionState(sel), foe = WAR.foeBreakdown(S, sel);
    let act = '';
    if (army) {
      const a = WAR.action(S, army, sel);
      if (a.kind === 'march') act = `<button class="big primary" data-a="wMarch" data-v="${sel}">March ${army.name} here</button>`;
      else if (a.kind) {
        const f = WAR.forecast(S, army, sel);
        act = `<div class="odds"><div class="small">${army.name}: ${mineSum(army, f.mine)}</div><div class="small">The Hollow: ${foeSum(f.foe)}</div>
          <div class="spread" style="margin-top:4px"><b>${pctTxt(f.p)} to win on auto</b><span class="small muted">${oddsWord(f.p)} · about ${f.lost} of ${WAR.soldiers(army)} would fall</span></div></div>
          <button class="big primary" data-a="wFight" data-v="${sel}">⚔ Fight it yourself (party + army)</button>
          <button class="big" data-a="wAuto" data-v="${sel}">Auto-resolve · ${pctTxt(f.p)}</button>`;
      } else act = `<div class="small muted" style="margin-top:6px">${a.why}</div>`;
    } else act = '<div class="small muted" style="margin-top:6px">Pick an army first (a blue flag, or Select below).</div>';
    card = `<div class="card"><div class="spread"><b class="serif" style="font-size:1.1rem">${R.name}</b><span class="pill ${st.cls}">${st.txt}</span></div>
      <div class="small muted" style="margin-top:4px">${sel === 'hollowgate' && S.flags.gate_open ? 'The Gate stands open. Whatever is inside is waiting for Isolde.' : r.lost ? `${R.people ? R.people.replace(/^./, c => c.toUpperCase()) + ' are gone. ' : ''}Only ruins left. Holding it gives nothing now.` : R.desc}</div>
      ${!r.lost && R.bonus ? `<div class="small" style="margin-top:4px;color:var(--gold)">Holding it: ${bonusText(R.bonus)}.</div>` : ''}
      ${!r.lost && R.yields ? `<div class="small muted">Pays ${yieldText(R.yields)}.</div>` : ''}
      ${foe.total ? `<div class="small" style="margin-top:4px;color:#ffb0a0">Hollow here: ${foeSum(foe)}</div>` : ''}
      ${act}${chapter2Buttons(sel)}</div>`;
  }
  const threats = w.hollow.map(h => { const route = WAR.path(h.at, h.to); return `<div class="spread small" style="margin-top:4px"><span><b style="color:#ffb0a0">${h.name}</b> (${h.power}) at ${WAR.REGIONS[h.at].name}</span><span class="muted">→ ${WAR.REGIONS[h.to].name}, ${route.length ? route.length + ' day' + (route.length > 1 ? 's' : '') : h.besieging ? 'besieging' : 'there now'}</span></div>`; }).join('');
  return `<div class="topbar"><h1>The war · Day ${w.day}</h1><button class="sm" data-a="keep">Keep</button></div>
    <div class="spread small"><span class="goldtxt">${S.gold} g</span><span>Levy <b>${w.levy}</b></span><span class="muted">+${inc.gold || 0} g, +${inc.levy || 0} levy a day</span></div>
    ${army ? `<div class="selbar">Selected: <b>${army.name}</b> at ${WAR.REGIONS[army.at].name} · ${WAR.ready(S, army) ? '<span style="color:var(--good)">ready to act</span>' : army.broken ? `<span style="color:#ffb0a0">regrouping ${army.broken}d</span>` : '<span class="muted">done for today</span>'}. Tap a ringed place.</div>` : ''}
    <div class="mapwrap">${warMapSVG()}</div>
    ${card}
    ${threats ? `<div class="card"><b>Hollow on the march</b>${threats}</div>` : ''}
    <div class="card"><div class="spread"><b>Your armies</b><span class="muted small">${w.armies.length} of ${WAR.armySlots(S)} · up to ${WAR.armyCap(S)} soldiers each</span></div>
      ${w.armies.map(a => { const b = WAR.breakdown(S, a, 'atk'); return `<div class="warmy ${a.id === view.army ? 'on' : ''}"><div><b>${a.name}</b> <span class="small muted">at ${WAR.REGIONS[a.at].name} · ${WAR.ready(S, a) ? 'ready' : a.broken ? 'regrouping' : 'done today'}</span>
        <div class="small">${WAR.soldiers(a)} soldiers in ${a.companies.length} compan${a.companies.length === 1 ? 'y' : 'ies'} · strength <b>${b.total}</b></div>
        <div class="small muted">${mineSum(a, b)}</div></div>
        <div class="row" style="margin-top:6px"><button class="sm ${a.id === view.army ? 'gold' : ''}" data-a="wSel" data-v="${a.id}">${a.id === view.army ? 'Selected' : 'Select'}</button><button class="sm" data-a="wArmy" data-v="${a.id}">Manage</button></div></div>`; }).join('')}
      ${w.armies.length < WAR.armySlots(S) ? `<button class="big" data-a="wNewArmy">Raise a new army (${w.armies.length + 1} of ${WAR.armySlots(S)})</button>` : '<div class="small muted" style="margin-top:6px">More armies: barracks levels, forts held and Ashby each add one.</div>'}</div>
    <div class="card"><b>What you hold gives you</b><div class="small" style="margin-top:4px">${bonusText(Object.fromEntries(Object.entries(mods).filter(([, v]) => v))) || '<span class="muted">Nothing yet. Take forts and keep villages safe.</span>'}</div></div>
    ${WAR_HELP}
    <button class="primary big" data-a="wDay">End the day (rest at the keep)</button>
    ${w.reports[0] ? '<button class="link small" data-a="wLast">Yesterday\'s report</button>' : ''}`;
};
ACT.war = () => { go('war', { region: null, army: (S.war.armies.find(a => WAR.ready(S, a)) || S.war.armies[0] || {}).id }); setTimeout(storyBeat, 200); };
ACT.wRegion = v => { view.region = v; render(); };
ACT.wSel = v => { view.army = +v; render(); };
ACT.wMarch = rid => { const err = WAR.march(S, selArmy(), rid); if (err) toast(err); else { save(); toast(`${selArmy().name} marches to ${WAR.REGIONS[rid].name}.`); } render(); };
ACT.wAuto = rid => {
  const a = selArmy(), rep = WAR.attack(S, a, rid);
  if (rep.error) { toast(rep.error); return; }
  save(); battleReport(rep, () => render());
};
ACT.wNewArmy = () => { const a = WAR.newArmy(S); save(); go('army', { id: a.id }); };
ACT.wArmy = v => go('army', { id: +v });
ACT.wDay = () => ACT.rest();
ACT.wLast = () => dayReport(S.war.reports[0], () => {});
function battleCard(b) {
  return `<div class="lvcard"><div class="spread"><b>${b.defend ? '🛡' : '⚔'} ${b.army} at ${b.where}</b><span class="pill ${b.won ? 'good' : 'bad'}">${b.won ? 'Won' : 'Lost'}</span></div>
    ${b.P ? `<div class="small muted">${b.P} against ${b.Q} · ${pctTxt(b.p)} odds</div>` : ''}
    ${b.losses.length ? `<div class="small" style="color:#ffb0a0">Fallen: ${b.losses.map(l => `${l.dead} of the ${esc(l.name)}`).join(', ')}</div>` : '<div class="small" style="color:var(--good)">Nobody fell.</div>'}
    ${b.promoted.length ? `<div class="small" style="color:var(--gold)">Promoted: ${b.promoted.map(p => `${esc(p.name)} now ${WAR.RANKS[p.rank - 1]}`).join(', ')}</div>` : ''}
    ${b.heroXp ? `<div class="small">General +${b.heroXp} XP${b.heroLevels ? ' <b style="color:var(--gold)">Level up!</b>' : ''}</div>` : ''}
    ${b.captured ? `<div class="small" style="color:var(--gold)"><b>${b.where} is yours!</b></div>` : ''}</div>`;
}
function battleReport(b, then) {
  overlay(`<div class="sheet levelup"><h2>${b.won ? 'Victory' : 'Beaten'}</h2>${battleCard(b)}<button class="primary big" data-a="repOk">Back to the war</button></div>`, 'center');
  ACT.repOk = () => { closeOverlay(); then(); storyBeat(); };
}
function dayReport(rep, then) {
  const inc = rep.income || {};
  overlay(`<div class="sheet levelup"><h2>Day ${rep.day} ends</h2>
    ${rep.lines.map(l => `<p class="small" style="${l.cls === 'bad' ? 'color:#ffb0a0' : l.cls === 'good' ? 'color:var(--good)' : l.cls === 'warn' ? 'color:var(--gold)' : ''}">${l.t}</p>`).join('') || '<p class="muted">A quiet night.</p>'}
    ${rep.battles.map(battleCard).join('')}<p class="small muted">Income: ${Object.keys(inc).map(k => `${inc[k]} ${k === 'gold' || k === 'levy' ? k : D.MATS[k].name}`).join(', ')}</p>
    <button class="primary big" data-a="repOk">${rep.siege ? 'Man the walls!' : 'Continue'}</button></div>`, 'center');
  ACT.repOk = () => { closeOverlay(); then(); setTimeout(storyBeat, 200); };
}
// Fight a war battle yourself: the party, plus the army's companies acting on their own, against Hollow companies.
ACT.wFight = rid => {
  const a = selArmy(), act = WAR.action(S, a, rid);
  if (!a || !(act.kind === 'attack' || act.kind === 'relieve')) { toast(act.why || 'Nothing to fight there.'); return; }
  if (S.party.every(h => S.heroes[h].hp <= 0)) { toast('Your party needs to rest first.'); return; }
  const L = E.partyLevel(S), kind = WAR.REGIONS[rid].kind;
  S.war.fightingArmy = a.id;
  startBattle(WAR.hordeSpecs(S, rid, L), { area: ['fort', 'citadel', 'mine'].includes(kind) ? 'tower' : kind === 'temple' ? 'fenmire' : 'millroad', boss: true, story: true, war: { aid: a.id, rid }, allies: WAR.battleUnits(S, a, L) });
};
// Called from endBattle for war battles.
function warBattleEnd(res, c, close) {
  const a = S.war.armies.find(x => x.id === c.war.aid), losses = {};
  for (const u of B.heroes.filter(h => h.isCompany)) losses[u.cls] = res.won ? 1 - u.hp / u.maxHp : Math.max(0.6, 1 - u.hp / u.maxHp);
  const rep = WAR.foughtResult(S, a, c.war.rid, { won: res.won, losses });
  if (!res.won) E.restParty(S);
  save(); close();
  go('war', { region: c.war.rid, army: a.id });
  const after = () => { if (res.levels && Object.keys(res.levels).length) levelUpScreen(res, () => {}); };
  battleReport(rep, after);
}
// The Hollow reached Emberwake: a siege night at a strength to match the army.
function warSiege(rep) {
  const n = WAR.siegeNight(rep.siege.power);
  SUI.runSiege(S, n, r => {
    const won = r.result === 'won', lost = WAR.siegeResult(S, rep.siege.hid, won);
    E.restParty(S); save();
    overlay(`<div class="sheet" style="text-align:center"><h2>${won ? 'Emberwake holds' : 'They broke in'}</h2><p>${won ? 'The Hollow column breaks on your walls and scatters into the dark.' : `They burned the stores before the survivors drove them off. Lost ${lost} gold and half the levy.`}</p>
      <button class="primary big" data-a="closeOv">Back to the keep</button></div>`, 'center');
    go('keep');
  });
}
SCREENS.army = () => {
  const a = S.war.armies.find(x => x.id === view.id);
  if (!a) return SCREENS.war();
  const gens = S.roster.filter(id => !(S.flags.gone || []).includes(id)), atk = WAR.breakdown(S, a, 'atk'), def = WAR.breakdown(S, a, 'def'), cap = WAR.armyCap(S);
  return `<div class="topbar"><h1>${a.name}</h1><button class="sm" data-a="war">War map</button></div>
    <div class="card"><div class="small">At <b>${WAR.REGIONS[a.at].name}</b> · ${WAR.soldiers(a)} of ${cap} soldiers · ${a.companies.length} of ${WAR.COMPANIES} companies</div>
      <div class="small" style="margin-top:4px">Attacking: ${mineSum(a, atk)}</div><div class="small">Defending: ${mineSum(a, def)}</div></div>
    <div class="card"><b>General</b><div class="small muted">A hero who leads an army adds +2% strength per level (+15% more if Awakened) and earns XP from its battles. They stay in your party too.</div>
      <div class="row" style="flex-wrap:wrap;margin-top:6px">${gens.map(id => { const other = WAR.generalOf(S, id), bonus = 0.02 * S.heroes[id].lvl + (S.heroes[id].awakened ? 0.15 : 0); return `<button class="sm ${a.general === id ? 'gold' : ''}" data-a="wGen" data-v="${a.id}:${id}" ${other && other !== a ? 'disabled' : ''}>${heroName(id)} ${pctPlus(bonus)}${other && other !== a ? ' (' + other.name + ')' : ''}</button>`; }).join('')}
      ${a.general ? `<button class="sm" data-a="wGen" data-v="${a.id}:">Nobody</button>` : ''}</div></div>
    <div class="card"><div class="spread"><b>Recruit</b><span class="small">Levy <b>${S.war.levy}</b> · <span class="goldtxt">${S.gold} g</span></span></div>
      <div class="small muted">Five at a time, into a company of that kind. Only on your own ground.</div>
      ${Object.keys(WAR.TYPES).map(t => { const d = WAR.TYPES[t], ok = WAR.unlocked(S, t), c = WAR.recruitCost(t, 5); return `<div class="spread" style="padding:5px 0;border-bottom:1px solid var(--line)"><div class="small"><b>${d.name}</b> <span class="muted">${d.desc}${ok ? '' : ' Needs ' + (d.req[0] === 'barracks' ? 'barracks level ' + d.req[1] : WAR.REGIONS[d.req[1]].name + ' held')}.</span></div>
        <button class="sm ${ok ? 'gold' : ''}" data-a="wRecruit" data-v="${a.id}:${t}" ${ok ? '' : 'disabled'}>+5 · ${c.gold}g ${c.levy}L</button></div>`; }).join('')}</div>
    <div class="card"><b>Companies</b> <span class="muted small">They rank up together from battles. Each rank and star is a point to spend: tap one.</span>
      ${a.companies.map(c => { const pts = WAR.points(c), next = WAR.nextRankXp(c);
        return `<div class="soldier" data-a="wCompany" data-v="${a.id}:${c.id}"><div class="spread"><span><b>${esc(c.name)}</b> <span class="small muted">×${c.n}</span></span><span class="pot">${'★'.repeat(WAR.stars(c))}<span class="off">${'★'.repeat(5 - WAR.stars(c))}</span></span></div>
          <div class="spread small"><span class="muted">${WAR.title(c)} · ${c.battles} battles · strength ${Math.round(WAR.companyPower(S, c, 'atk'))}</span>${pts ? `<span class="goldtxt">${pts} point${pts > 1 ? 's' : ''}</span>` : ''}</div>
          ${next ? `<div class="bar xp" style="margin-top:3px"><i style="width:${Math.min(100, 100 * c.xp / next)}%"></i></div>` : '<div class="small" style="color:var(--gold)">Legendary.</div>'}</div>`; }).join('') || '<p class="muted">No soldiers yet. Recruit above.</p>'}</div>`;
};
ACT.wGen = v => { const [aid, id] = v.split(':'), err = WAR.setGeneral(S, +aid, id || null); if (err) toast(err); save(); render(); };
ACT.wRecruit = v => { const [aid, t] = v.split(':'), r = WAR.recruit(S, +aid, t, 5); if (typeof r === 'string') toast(r); else toast(`Five ${WAR.TYPES[t].name.toLowerCase()} join the ${esc(r.name)}.`); save(); render(); };
ACT.wCompany = v => {
  const [aid, cid] = v.split(':'), c = S.war.armies.find(x => x.id === +aid).companies.find(x => x.id === +cid), pts = WAR.points(c);
  overlay(`<div class="sheet"><h2>${esc(c.name)}</h2><p class="small muted">×${c.n} · ${WAR.title(c)}, rank ${c.rank} of 10 · ${c.battles} battles · ${pts} point${pts === 1 ? '' : 's'} to spend</p>
    ${Object.keys(WAR.PERKS).map(k => { const d = WAR.PERKS[k], r = c.perks[k] || 0; return `<div class="spread" style="padding:6px 0;border-bottom:1px solid var(--line)"><div><b>${d.name}</b> <span class="pot">${'●'.repeat(r)}<span class="off">${'●'.repeat(d.max - r)}</span></span><div class="small muted">${d.desc}</div></div>
      ${r < d.max ? `<button class="sm ${pts ? 'gold' : ''}" data-a="wPerk" data-v="${v}:${k}" ${pts ? '' : 'disabled'}>+1</button>` : ''}</div>`; }).join('')}
    <button class="big" data-a="closeOv">Done</button></div>`);
};
ACT.wPerk = v => { const [aid, cid, k] = v.split(':'), c = S.war.armies.find(x => x.id === +aid).companies.find(x => x.id === +cid); if (WAR.buyPerk(c, k)) { save(); render(); ACT.wCompany(aid + ':' + cid); } };

// ---------- Chapter two: the marshals, the Gate and the king ----------
// The element the Hollow have learned from you: whichever you've used most in the war, once it's been used a lot.
function learnedEl() {
  const a = S.adapt || {}, top = Object.keys(a).sort((x, y) => a[y] - a[x])[0];
  return top && a[top] >= 20 ? top : null;
}
function chapter2Buttons(rid) {
  const area = D.AREAS.find(a => a.c2 && a.opens === rid);
  if (area && E.areaOpen(S, area)) return `<button class="big primary" data-a="enter" data-v="${area.id}">Go inside: ${area.name}${S.areas[area.id].cleared ? '' : ' · ' + bossGap(area.boss[0].lvl)}</button>`;
  if (area && WAR.owns(S, rid) && area.id === 'hollow_court') return '<div class="small muted" style="margin-top:6px">The Gate is sealed while any marshal lives.</div>';
  return '';
}
function chapter2ButtonsOld(rid) {
  if (!S.war.regions[rid] || S.war.regions[rid].owner !== 'p') return '';
  const l = WAR.LIEUTENANTS[rid];
  if (l && !S.flags[l.flag]) return `<button class="big primary" data-a="corner" data-v="${rid}">Corner ${D.ENEMIES[l.t].name} in the keep · ${bossGap(D.ENEMIES[l.t].lvl)}</button><div class="small muted">The fort is yours, but its marshal has dug in. While any marshal lives, every Hollow army is stronger and the Gate stays sealed.</div>`;
  if (rid === 'hollowgate' && !S.flags.vael_dead) return `<button class="big primary" data-a="faceVael">Go into the Hollow Gate · ${bossGap(D.ENEMIES.vael.lvl)}</button>`;
  return '';
}
// Story bosses have set levels, so training for them pays off. Their escorts are two levels below.
function storyFight(specs, onWin) {
  const L = D.ENEMIES[specs[0].t].lvl, el = learnedEl();
  startBattle(specs.map((sp, i) => Object.assign({ lvl: i === 0 ? L : L - 2, resist: i === 0 ? el : null }, sp)), { area: 'tower', boss: true, story: true, learned: el, onWin });
}
ACT.corner = rid => {
  const l = WAR.LIEUTENANTS[rid];
  scene(l.scene, () => storyFight(l.t === 'saint' ? [{ t: l.t }, { t: 'acolyte' }] : l.t === 'grieve' ? [{ t: l.t }, { t: 'soldier' }, { t: 'soldier' }] : [{ t: l.t }, { t: 'soldier' }], () => {
    S.flags[l.flag] = true; save();
    scene(l.after, () => {
      if (!WAR.marshalsAlive(S) && !S.flags.gate_open) { S.flags.gate_open = true; save(); scene('gate_open', () => go('war', { region: 'hollowgate' })); }
      else go('war', { region: rid });
    });
  }));
};
ACT.faceVael = () => scene('vael_meet', () => storyFight([{ t: 'vael' }, { t: 'soldier' }], () => {
  S.flags.vael_dead = true; S.flags.toll_low = (S.toll || 0) <= 5; save();
  scene('vael_choice', () => scene('chapter2_end', () => { S.flags.chapter2_done = true; save(); go('keep'); }));
}));
// ---------- Chapter two story beats: scenes as the war moves ----------
const BEATS = [
  ['c2_day2', () => S.war.day >= 2],
  ['c2_ashby', () => WAR.owns(S, 'ashby')],
  ['c2_prisoner', () => S.war.day >= 4 || Object.keys(S.war.regions).some(id => S.war.regions[id].taken)],
  ['c2_first_loss', () => Object.values(S.war.regions).some(r => r.lost)],
  ['c2_kindle_dream', () => (S.toll || 0) >= 2],
  ['c2_first_fort', () => ['barrowwatch', 'stonecut', 'greyfort', 'kingsbridge', 'temple'].some(id => WAR.owns(S, id))],
  ['c2_one_down', () => WAR.marshalsAlive(S) <= 2],
  ['c2_ash_hands', () => (S.toll || 0) >= 5],
];
function storyBeat() {
  if (!warOn() || document.getElementById('ov') || document.getElementById('battle') || document.getElementById('siege')) return;
  const b = BEATS.find(([k, ok]) => !S.flags.seen[k] && ok());
  if (b) scene(b[0], () => render());
}
// Starting the war after chapter one.
ACT.warBegin = () => scene('war_begins', () => scene('kindle_first', () => { WAR.start(S); S.shopTier = Math.max(S.shopTier, 4); save(); ACT.war(); }));
function warCard() {
  if (!WAR) return '';
  if (!warOn()) return S.areas.tower && S.areas.tower.cleared ? `<div class="card defend alert"><b class="serif" style="font-size:1.1rem;color:var(--bad)">The beacons are lit</b>
    <div class="small muted" style="margin-top:4px">Fire on every hill to the north. Something is coming.</div><button class="primary big" data-a="warBegin">Go to the walls</button></div>` : '';
  setTimeout(storyBeat, 400);
  const w = S.war, threat = w.hollow.find(h => WAR.REGIONS[h.to].named || h.to === 'emberwake'), siege = Object.keys(w.regions).find(id => w.regions[id].siege);
  return `<div class="card defend ${siege ? 'alert' : ''}"><div class="spread"><b class="serif" style="font-size:1.1rem">The war</b><span class="pill on">Day ${w.day}</span></div>
    <div class="small muted" style="margin-top:4px">${siege ? `<b style="color:var(--bad)">${WAR.REGIONS[siege].name} is under siege!</b> Relieve it today or it falls.` : !w.armies.some(a => WAR.ready(S, a)) ? 'Every army has acted. Rest to end the day.' : threat ? `${threat.name} is marching on ${WAR.REGIONS[threat.to].name}.` : `${WAR.owned(S).length} regions held. Resting here ends the day.`}</div>
    <button class="big gold" data-a="war">War map</button></div>`;
}

// ---------- Battle UI ----------
const BG = {
  arena: ['#3a2a20', '#5a4232', '#d8b878', '#a8844c'],
  thornwood: ['#6fa0c8', '#b8d4e0', '#3a6a32', '#1f3d1c'],
  millroad: ['#e08a5a', '#f0c890', '#7a6a44', '#4a3e28'],
  barrows: ['#4a5468', '#8a94a8', '#55665a', '#2e3a30'],
  fenmire: ['#3a5048', '#6a8478', '#34463a', '#1a261c'],
  tower: ['#2a2040', '#5a4878', '#463e56', '#22202c'],
};
let B = null, ctx = null, pending = null, FX = null;
const unitEl = a => document.getElementById('u-' + a.key);
function shakeField(hard) {
  const f = document.querySelector('#battle .field');
  if (!f || S.opts.shake === false) return;
  f.classList.remove('shake', 'shake2'); void f.offsetWidth; f.classList.add(hard ? 'shake2' : 'shake');
}
// Big hits land with a short freeze, a white flash on the target and a flash over the field.
async function impact(who, level) {
  const u = unitEl(who), f = document.querySelector('#battle .field');
  if (u) u.classList.add('impact');
  if (f) { f.classList.remove('hitflash', 'hitflash2'); void f.offsetWidth; f.classList.add(level >= 2 ? 'hitflash2' : 'hitflash'); }
  await sleep(level >= 2 ? 150 : 90);
  if (u) u.classList.remove('impact');
  shakeField(level >= 2);
}
// How a fighter moves before their action lands: a lunge for blows, a glow and gathering sparks for spells,
// then a bolt across the field for ranged attacks and spells aimed at an enemy.
const RANGED = ['wren', 'isolde', 'morwen'];
async function actMotion(a, c, u) {
  if (!u || !c) { await T(150); return; }
  // painted heroes switch to their attack picture for any action, then back
  const art = ART[a.sprite], pic = art && art.attack && u.querySelector('img.paint');
  if (pic) { pic.src = art.attack; setTimeout(() => { pic.src = art.idle; }, 700 * (S.opts.speed === 2 ? 0.5 : 1)); }
  const sk = c.kind === 'skill' ? D.SKILLS[c.id] : c.kind === 'surge' ? D.SKILLS[D.SURGE[a.id]] : null;
  const type = sk ? sk.type : c.kind === 'item' ? 'item' : 'phys';
  const el = sk && sk.el ? (sk.el === 'light' ? 'light' : sk.el === 'dark' ? 'dark' : sk.el) : type === 'heal' ? 'heal' : 'mag';
  u.classList.add('step');
  if (type === 'mag' || type === 'heal' || type === 'buff' || type === 'revive') {
    u.classList.add(type === 'heal' || type === 'revive' ? 'castheal' : 'cast');
    if (FX) FX.gather(u, el);
    await T(260);
    const t = c.target && unitEl(c.target);
    if (FX && t && type === 'mag') { FX.bolt(u, t, el); await T(230); }
    return;
  }
  if (type === 'phys') {
    const ranged = a.side === 'h' ? RANGED.includes(a.id) || a.cls === 'archers' : a.ranged || /arrow|volley|bolt|spit/.test(c.id || '');
    const t = c.target && unitEl(c.target);
    if (ranged && t && FX) { u.classList.add('cast'); await T(120); FX.bolt(u, t, sk && sk.el ? el : 'phys', 0.2); await T(180); return; }
    u.classList.add('lunge'); u.style.setProperty('--dir', a.side === 'h' ? '-1' : '1');
    await T(200);
    return;
  }
  await T(150);
}
// Combo Arts, Ember Surges and Awakened moves: the field darkens, the hero's portrait sweeps across and the name comes up.
async function bigMove(text, kind, who) {
  const f = document.querySelector('#battle .field');
  if (!f) return;
  const d = document.createElement('div');
  d.className = 'bigmove ' + kind;
  const face = who && who.sprite && !who.isCompany ? `<div class="cutin">${img(who.sprite, 9)}</div>` : '';
  d.innerHTML = `${face}<small>${kind === 'combo' ? 'Combo Art' : kind === 'awaken' ? 'Awakened' : 'Ember Surge'}</small><b>${esc(text)}</b>`;
  f.appendChild(d);
  await T(kind === 'combo' ? 650 : 750);
  setTimeout(() => d.remove(), 500);
  d.classList.add('out');
}

function startBattle(specs, c) {
  ctx = c;
  AU.play(c.arena ? 'arena' : (c.boss || c.story) ? 'boss' : 'battle');
  B = new E.Battle(S, specs, { boss: !!c.boss, autoItems: false, tameBonus: c.hunt ? 0.15 : 0, huntMult: c.huntMult || 1, allies: c.allies });
  const bgKey = (E.area(c.area) || {}).bg || c.area;
  const bg = BG[bgKey] || BG.thornwood;
  const el = document.createElement('div');
  el.id = 'battle';
  el.innerHTML = `<div class="field"><div class="sky" style="background:linear-gradient(180deg,${bg[0]},${bg[1]})"></div>
    <div class="ground" style="background:linear-gradient(180deg,${bg[2]},${bg[3]})"></div><canvas class="bgc" id="bgc"></canvas>
    <div class="foes" id="foes"></div><div class="friends" id="friends"></div><div class="banner" id="banner"></div></div>
    <div class="pbars" id="pbars"></div><div class="cmd" id="cmd"></div>`;
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
  if (window.BFX) {
    try { BFX.paint(el.querySelector('#bgc'), bgKey || 'thornwood'); } catch (e) { /* plain gradient stays */ }
    try { FX = BFX.fx(el.querySelector('.field')); } catch (e) { FX = null; }
  }
  // Taming fights start holding back, so nobody kills the beast before Hesk gets a go.
  B.holdBack = !!(c.hunt || c.apex) && B.heroes.some(h => h.skills && h.skills.includes('tame'));
  drawUnits(); drawBars(); drawCmd();
  if (c.ambush) banner('Ambush!');
  if (c.hunt) banner('Beast hunt: weaken one, then Tame it', true);
  if (c.learned) warnBanner(`They have learned your ${c.learned}. ${B.enemies[0].name} resists it now. Try something else.`);
  if (c.apex) warnBanner(`${W.APEX[c.area].name}, the apex of ${E.area(c.area).name}!`);
  else if (c.ground && B.enemies.some(e => e.elite)) warnBanner(B.enemies.filter(e => e.elite).map(e => `${e.name}: ${D.ELITES[e.elite].desc}`).join(' '), false);
  else if (B.enemies.some(e => e.elite)) warnBanner(B.enemies.filter(e => e.elite).map(e => `Elite! ${e.name}: ${D.ELITES[e.elite].desc}`).join(' '), false);
  runBattle();
}
function unitHTML(a) {
  let px;
  if (a.side === 'h') px = a.isCreature ? 3 : 4;
  else {
    const big = a.isBoss || B.enemies.filter(e => e.hp > 0).length <= 2;
    const sp = SP.variant(a.sprite);
    px = Math.round((big ? 4 : 3) * (sp.scale || 1));
  }
  if (a.isCreature) px = Math.round(3 * (SP.variant(a.sprite).scale || 1));
  if (a.isCompany) px = 3;
  return `<div class="unit ${a.hp <= 0 ? 'ko' : ''} ${a.isCreature ? 'pet' : ''} ${ART[a.sprite] && ART[a.sprite].idle && !a.isCompany ? 'hasart' : ''}" id="u-${a.key}" data-a="tgt" data-v="${a.key}">
    <div class="spr" style="animation-delay:-${(Math.random() * 2).toFixed(2)}s">${ART[a.sprite] && ART[a.sprite].idle && !a.isCompany ? `<img class="paint" src="${ART[a.sprite].idle}" alt="">` : img(a.sprite, px)}</div>
    ${a.isCompany ? `<div class="uname">${esc(a.name)}</div>` : ''}${a.side === 'e' ? `<div class="uname">${esc(a.name)}</div><div class="hpmini"><i style="width:${pct(a.hp, a.maxHp)}%"></i></div>` : ''}
    <div class="sts"></div></div>`;
}
function drawUnits() {
  const foes = document.getElementById('foes');
  const live = B.enemies.filter(e => e.hp > 0);
  foes.className = 'foes' + (live.length === 1 ? ' one' : '');
  foes.innerHTML = live.map(unitHTML).join('');
  const fr = document.getElementById('friends'); fr.classList.toggle('many', B.heroes.length > 5); fr.innerHTML = B.heroes.map(unitHTML).join('');
  refreshUnits();
}
function refreshUnits() {
  for (const a of B.all()) {
    const u = document.getElementById('u-' + a.key);
    if (!u) continue;
    u.classList.toggle('ko', a.hp <= 0);
    const bar = u.querySelector('.hpmini i'); if (bar) bar.style.width = pct(a.hp, a.maxHp) + '%';
    u.querySelector('.sts').textContent = stsText(a);
    u.classList.toggle('elite', !!a.elite);
    u.classList.toggle('charging', !!a.charge);
    u.classList.toggle('marked', B.enemies.some(e => e.hp > 0 && e.charge && e.charge.target === a));
  }
  const sg = document.getElementById('surgebar');
  if (sg) { sg.style.width = B.surge + '%'; sg.parentNode.classList.toggle('full', B.surgeReady()); }
}
// Statuses plus the boss and elite states that matter: armour to break, a wind-up, a mirror, a ward.
function stsText(a) {
  const out = Object.keys(a.statuses).map(s => STATUS[s]);
  if (a.plated) out.unshift('Armoured');
  if (a.charge) out.unshift('Winding up!');
  if (a.mirror) out.unshift('Mirror');
  if (a.mech && a.mech.warded && B.alive(B.enemies).some(o => o !== a)) out.unshift('Shielded');
  if (a.side === 'h' && B.enemies.some(e => e.hp > 0 && e.charge && e.charge.target === a)) out.unshift('MARKED');
  return out.join(' ');
}
function drawBars(active) {
  document.getElementById('pbars').innerHTML = B.heroes.map(h => h.isCreature || h.isCompany
    ? `<div class="prow pet ${h.hp <= 0 ? 'ko' : ''}" id="r-${h.key}" data-a="tgt" data-v="${h.key}">
        <div><div class="nm">${esc(h.name)}</div><div class="sts">${Object.keys(h.statuses).map(s => STATUS[s]).join(' ')}</div></div>
        <div style="grid-column:span 2"><div class="num"><span>HP</span><span>${h.hp}/${h.maxHp}</span></div><div class="bar ${h.hp < h.maxHp * .3 ? 'low' : ''}"><i style="width:${pct(h.hp, h.maxHp)}%"></i></div></div>
        <div class="small muted" style="text-align:right">${h.isCompany ? 'Auto' : W.STANCES[h.stance].name}</div></div>`
    : `<div class="prow ${h.hp <= 0 ? 'ko' : ''} ${active === h ? 'active' : ''}" id="r-${h.key}" data-a="tgt" data-v="${h.key}">
    <div><div class="nm">${h.name}</div><div class="sts">${stsText(h)}</div></div>
    <div><div class="num"><span>HP</span><span>${h.hp}/${h.maxHp}</span></div><div class="bar ${h.hp < h.maxHp * .3 ? 'low' : ''}"><i style="width:${pct(h.hp, h.maxHp)}%"></i></div></div>
    <div><div class="num"><span>MP</span><span>${h.mp}/${h.maxMp}</span></div><div class="bar mp"><i style="width:${pct(h.mp, h.maxMp)}%"></i></div></div>
    <div><div class="num"><span>ATB</span></div><div class="bar atb"><i style="width:${h.hp > 0 ? h.gauge : 0}%"></i></div></div></div>`).join('');
}
function updateGauges() {
  for (const h of B.heroes) {
    const r = document.getElementById('r-' + h.key);
    const i = r && r.querySelector('.atb i');
    if (i) i.style.width = (h.hp > 0 ? h.gauge : 0) + '%';
  }
}
function banner(text, big) {
  const b = document.getElementById('banner');
  if (!b) return;
  b.textContent = text; b.classList.add('show'); b.classList.toggle('big', !!big);
  clearTimeout(banner.t); banner.t = setTimeout(() => b.classList.remove('show'), (big ? 1300 : 900) * (S.opts.speed === 2 ? 0.6 : 1));
}
// A boss changing phase: the screen flashes red, the boss swells and glows from then on, and says what's happening.
async function bossPhase(who, text, stype) {
  text = stype === 'summon' ? `${text}. Reinforcements are coming` : stype === 'buff' ? `${text}. Something has changed in it` : text;
  const u = unitEl(who), f = document.querySelector('#battle .field');
  AU.sfx('gate');
  if (f) { f.classList.remove('phaseflash'); void f.offsetWidth; f.classList.add('phaseflash'); }
  if (u) u.classList.add('enraged');
  shakeField(true);
  warnBanner(`${who.name} changes. ${text}!`);
  await T(1300);
}
function warnBanner(text, good) {
  const f = document.querySelector('#battle .field');
  if (!f) return;
  const d = document.createElement('div');
  d.className = 'warnban' + (good ? ' good' : '');
  d.textContent = text;
  f.appendChild(d);
  setTimeout(() => d.remove(), 2600 * (S.opts.speed === 2 ? 0.6 : 1));
}
function floatText(a, text, cls) {
  const u = document.getElementById('u-' + a.key);
  if (!u) return;
  const f = document.createElement('div');
  f.className = 'float ' + (cls || ''); f.textContent = text;
  u.appendChild(f);
  setTimeout(() => f.remove(), 1000);
}
function pulse(a, cls) {
  const u = document.getElementById('u-' + a.key);
  if (!u) return;
  u.classList.remove(cls); void u.offsetWidth; u.classList.add(cls);
  setTimeout(() => u.classList.remove(cls), 320);
}
async function play(evs) {
  for (const ev of evs) {
    switch (ev.t) {
      case 'say':
        if (ev.combo || ev.awaken) { AU.sfx('surge'); await bigMove(ev.text, ev.combo ? 'combo' : 'awaken', ev.who); break; }
        if (ev.phase && ev.who && ev.who.isBoss) { await bossPhase(ev.who, ev.text, ev.stype); break; }
        banner(ev.text); await T(ev.who ? 380 : 650); break;
      case 'surge': {
        AU.sfx('surge');
        const f = document.querySelector('.field'); f.classList.add('surgeflash'); setTimeout(() => f.classList.remove('surgeflash'), 700);
        if (FX) FX.surge(); shakeField(true);
        await bigMove(ev.text, 'surge', ev.who);
        refreshUnits(); break;
      }
      case 'dmg': {
        const lvl = ev.dot ? 0 : ev.special ? 2 : ev.crit || ev.weak ? 1 : ev.big ? 1 : 0;
        const cls = ev.special ? 'huge' : ev.crit ? 'crit' : ev.weak ? 'weak' : ev.resist ? 'resist' : '';
        floatText(ev.who, ev.n + (ev.crit || ev.special ? '!' : ''), cls);
        if (ev.crit) floatText(ev.who, 'CRITICAL', 'label crit');
        if (ev.weak) floatText(ev.who, 'WEAK!', 'label weak');
        if (ev.resist) floatText(ev.who, ev.who.plated ? 'armour holds' : 'resisted', 'label');
        if (B && B.holdingBack(ev.who) && ev.who.hp <= 1) floatText(ev.who, 'held back', 'label');
        if (ev.reflect) floatText(ev.who, 'reflected!', 'label weak');
        if (ev.dot) floatText(ev.who, STATUS[ev.dot], 'label');
        { const hu = unitEl(ev.who); if (hu) hu.style.setProperty('--kb', ev.who.side === 'h' ? '1' : '-1'); }
        pulse(ev.who, 'hit'); pulse(ev.who, 'flash');
        if (FX) FX.hit(unitEl(ev.who), ev.dot === 'poison' ? 'poison' : ev.dot === 'burn' ? 'fire' : ev.el || 'phys', lvl > 0);
        AU.sfx(ev.crit || lvl >= 2 ? 'crit' : ev.el === 'fire' ? 'fire' : ev.el === 'frost' ? 'frost' : ev.el && ev.el !== 'phys' ? 'magic' : 'hit');
        refreshUnits(); drawBars();
        if (lvl) await impact(ev.who, lvl);
        await T(lvl ? 260 : 300); break;
      }
      case 'heal': AU.sfx('heal'); floatText(ev.who, '+' + ev.n, 'heal'); if (FX) FX.puff(unitEl(ev.who), 'heal'); refreshUnits(); drawBars(); await T(280); break;
      case 'mp': floatText(ev.who, '+' + ev.n + ' MP', 'mp'); drawBars(); await T(280); break;
      case 'revive': floatText(ev.who, 'Back up!', 'heal'); if (FX) FX.puff(unitEl(ev.who), 'light'); refreshUnits(); drawBars(); await T(400); break;
      case 'status': floatText(ev.who, STATUS[ev.s], 'label'); refreshUnits(); drawBars(); await T(230); break;
      case 'immune': floatText(ev.who, 'Immune', 'label'); await T(230); break;
      case 'warn': {
        AU.sfx(ev.good ? 'crit' : 'gate');
        warnBanner(ev.text, ev.good);
        pulse(ev.who, 'flash'); if (!ev.good) shakeField();
        refreshUnits(); drawBars(); await T(ev.good ? 900 : 1500); break;
      }
      case 'off': refreshUnits(); drawBars(); break;
      case 'ko': {
        AU.sfx('ko');
        const ku = unitEl(ev.who);
        if (ev.who.side === 'e' && ku) { ku.classList.add('dying'); if (FX) FX.puff(ku, 'death'); await T(420); }
        refreshUnits(); drawBars(); await T(200); break;
      }
      case 'tamed': AU.sfx('tame'); floatText(ev.who, 'Tamed!', 'heal'); banner(ev.who.name + ' is tamed!', true); await T(900); break;
      case 'stole': floatText(ev.who, ev.text, 'label'); await T(300); break;
      case 'summon': drawUnits(); pulse(ev.who, 'flash'); banner(ev.who.name + ' joins the fight'); await T(500); break;
      case 'mastery': toast(ev.lvl >= 4 && D.SKILL_EVO[ev.skill] ? `<b>${D.SKILLS[ev.skill].name} mastered!</b> Evolve it from Party, Skills.` : `${D.SKILLS[ev.skill].name} mastery ${'★'.repeat(ev.lvl)}`, ev.lvl >= 4 ? 3500 : 2200); break;
    }
  }
  refreshUnits();
}
async function runBattle() {
  await T(350);
  while (!B.over) {
    const a = B.advance();
    if (!a) break;
    updateGauges();
    await T(a.side === 'h' ? 170 : 130);
    const pre = B.startTurn(a);
    if (pre.length) await play(pre);
    if (B.over) break;
    if (a.hp <= 0) continue;
    let c;
    if (a.isCreature) c = B.creatureChoice(a);
    else if (a.isCompany) c = B.companyChoice(a);
    else if (a.side === 'h') {
      drawBars(a);
      const u0 = document.getElementById('u-' + a.key); if (u0) u0.classList.add('active');
      c = S.opts.auto ? B.autoChoice(a) : await choose(a);
      if (u0) u0.classList.remove('active');
    } else c = B.enemyChoice(a);
    const u = document.getElementById('u-' + a.key);
    await actMotion(a, c, u);
    const ev = B.act(a, c);
    await play(ev);
    if (u) u.classList.remove('step', 'lunge', 'cast', 'castheal');
    drawBars();
    if (a.side === 'h') drawCmd();
  }
  await T(400);
  endBattle();
}

function choose(a) { return new Promise(res => { pending = { a, res, mode: 'main' }; drawCmd(); }); }
function resolve(c) {
  const p = pending; pending = null;
  clearTargets(); drawCmd();
  p.res(c);
}
function clearTargets() { document.querySelectorAll('.targetable').forEach(x => x.classList.remove('targetable')); }
function surgeHTML() {
  if (!S.surgeTier) return '';
  return `<div class="surgewrap ${B.surgeReady() ? 'full' : ''}"><span>Surge</span><div class="bar surge"><i id="surgebar" style="width:${B.surge}%"></i></div></div>`;
}
function drawCmd() {
  const el = document.getElementById('cmd');
  if (!el) return;
  const canHold = B && B.heroes.some(h => h.skills && h.skills.includes('tame')) && B.enemies.some(e => e.hp > 0 && e.tpl.tame && !e.isBoss);
  const autoBtn = (canHold ? `<button class="sm holdbtn ${B.holdBack ? 'on' : ''}" data-a="bHold">Hold back ${B.holdBack ? 'on' : 'off'}</button>` : '') + `<button class="sm autobtn ${S.opts.auto ? 'on' : ''}" data-a="bAuto">Auto ${S.opts.auto ? 'on' : 'off'}</button>`;
  if (!pending) { el.innerHTML = `<div class="cmdtop"><span class="muted small">${ctx && ctx.arena ? 'Arena' : B && B.boss ? 'Boss fight' : ''}</span>${surgeHTML()}${autoBtn}</div>`; return; }
  const a = pending.a;
  if (pending.mode === 'main') {
    const surge = B.surgeReady() ? `<button class="surgebtn" data-a="bSurge">EMBER SURGE · ${D.SKILLS[D.SURGE[a.id]].name}</button>` : '';
    const beasts = a.skills.includes('tame') ? B.enemies.filter(e => e.hp > 0 && e.tpl.tame && !e.isBoss) : [];
    const best = beasts.sort((x, y) => B.tameOdds(y, a) - B.tameOdds(x, a))[0];
    const tameBtn = best ? `<button class="gold" style="width:100%;margin-bottom:8px" data-a="bSkill" data-v="tame">Tame · best odds ${Math.round(B.tameOdds(best, a) * 100)}% (${esc(best.name)})</button>` : '';
    const kindle = a.id === 'isolde' && warOn() && !B.kindled ? `<button class="kindlebtn" data-a="bKindle">Kindle the Ember <span class="small">(${S.toll || 0} so far)</span></button>` : '';
    el.innerHTML = `<div class="cmdtop"><b class="serif">${a.name}'s turn</b>${surgeHTML()}${autoBtn}</div>${surge}${kindle}${tameBtn}
      <div class="grid2"><button class="primary" data-a="bAttack">Attack</button><button data-a="bSkills">Skills</button>
      <button data-a="bItems">Items</button><button data-a="bDefend">Defend</button></div>
      ${B.boss ? '' : '<button class="link" style="width:100%;margin-top:6px" data-a="bFlee">Try to run</button>'}`;
  } else if (pending.mode === 'skills') {
    const list = a.skills.filter(s => s !== 'attack');
    el.innerHTML = `<div class="cmdtop"><b class="serif">${a.name} · MP ${a.mp}</b><button class="sm" data-a="bBack">Back</button></div>
      ${list.length ? list.map(s => {
        const sk = D.SKILLS[s], cost = B.mpCost(a, sk), lv = E.masteryLevel(S.heroes[a.id].mastery[s]);
        return `<button class="skill" data-a="bSkill" data-v="${s}" ${a.mp < cost ? 'disabled' : ''}><span>${sk.name} <span style="color:var(--gold);font-size:.75rem">${'★'.repeat(lv)}</span></span><span class="c">${cost ? cost + ' MP' : ''}</span></button>`;
      }).join('') : '<p class="muted">No skills yet. Learn talents from the Party menu.</p>'}`;
  } else if (pending.mode === 'items') {
    const list = Object.keys(D.ITEMS).filter(k => S.bag[k] > 0 && !D.ITEMS[k].field);
    el.innerHTML = `<div class="cmdtop"><b class="serif">Items</b><button class="sm" data-a="bBack">Back</button></div>
      ${list.length ? list.map(k => `<button class="skill" data-a="bItem" data-v="${k}"><span>${D.ITEMS[k].name}</span><span class="c">× ${S.bag[k]}</span></button>`).join('') : '<p class="muted">Nothing usable.</p>'}`;
  } else if (pending.mode === 'target') {
    el.innerHTML = `<div class="cmdtop"><b class="serif">${pending.label}: choose a target</b><button class="sm" data-a="bBack">Back</button></div>
      <p class="muted small">Tap ${pending.kind === 'enemy' ? 'an enemy' : 'a party member'} above.${pending.hint ? ' ' + pending.hint : ''}</p>`;
  }
}
function startTargeting(kind, choice, label, hint) {
  pending.mode = 'target'; pending.kind = kind; pending.choice = choice; pending.label = label; pending.hint = hint;
  clearTargets();
  const list = kind === 'enemy' ? B.enemies.filter(e => e.hp > 0) : kind === 'deadAlly' ? B.heroes.filter(h => h.hp <= 0) : B.heroes.filter(h => h.hp > 0);
  if (!list.length) { toast('No one to target.'); pending.mode = 'main'; drawCmd(); return; }
  if (list.length === 1) { resolve(Object.assign({}, choice, { target: list[0] })); return; }
  for (const t of list) { const u = document.getElementById('u-' + t.key); if (u) u.classList.add('targetable'); }
  drawCmd();
}
ACT.tgt = key => {
  if (!pending || pending.mode !== 'target') return;
  const t = B.all().find(x => x.key === key);
  if (!t) return;
  const ok = pending.kind === 'enemy' ? (t.side === 'e' && t.hp > 0) : pending.kind === 'deadAlly' ? (t.side === 'h' && t.hp <= 0) : (t.side === 'h' && t.hp > 0);
  if (!ok) return;
  resolve(Object.assign({}, pending.choice, { target: t }));
};
ACT.bAttack = () => startTargeting('enemy', { kind: 'skill', id: 'attack' }, 'Attack');
ACT.bSkills = () => { pending.mode = 'skills'; drawCmd(); };
ACT.bItems = () => { pending.mode = 'items'; drawCmd(); };
ACT.bBack = () => { pending.mode = 'main'; clearTargets(); drawCmd(); };
ACT.bDefend = () => resolve({ kind: 'defend' });
ACT.bFlee = () => resolve({ kind: 'flee' });
ACT.bKindle = () => resolve({ kind: 'kindle' });
ACT.bSurge = () => {
  const sk = D.SKILLS[D.SURGE[pending.a.id]];
  if (sk.target === 'enemy') startTargeting('enemy', { kind: 'surge' }, sk.name);
  else resolve({ kind: 'surge' });
};
ACT.bSkill = s => {
  const sk = D.SKILLS[s], c = { kind: 'skill', id: s };
  if (sk.type === 'tame') {
    const beasts = B.enemies.filter(e => e.hp > 0 && e.tpl.tame && !e.isBoss);
    if (!beasts.length) { toast('Nothing here can be tamed.'); return; }
    const odds = beasts.map(e => `${e.name} ${Math.round(B.tameOdds(e, pending.a) * 100)}%`).join(', ');
    startTargeting('enemy', c, 'Tame', `Odds now: ${odds}. Wear them down first.`);
    return;
  }
  if (sk.target === 'enemy' || sk.target === 'ally' || sk.target === 'deadAlly') startTargeting(sk.target, c, sk.name);
  else resolve(c);
};
ACT.bItem = k => {
  const it = D.ITEMS[k], c = { kind: 'item', id: k };
  if (it.target === 'ally' || it.target === 'deadAlly') startTargeting(it.target, c, it.name);
  else resolve(c);
};
ACT.bHold = () => { B.holdBack = !B.holdBack; toast(B.holdBack ? 'Holding back: blows leave beasts on 1 HP so Hesk can tame them.' : 'No holding back.', 2200); drawCmd(); };
ACT.bAuto = () => {
  S.opts.auto = !S.opts.auto; save();
  if (S.opts.auto && pending) resolve(B.autoChoice(pending.a));
  else drawCmd();
};

function endBattle() {
  const res = E.finishBattle(S, B);
  AU.play(null); AU.sfx(res.won ? 'victory' : res.fled ? 'click' : 'defeat');
  if (Object.keys(res.levels || {}).length) setTimeout(() => AU.sfx('level'), 700);
  const c = ctx, area = c.area;
  let nodeOut = null, bossScenes = null;
  if (res.won && c.node) nodeOut = E.winNode(S, area, c.node);
  const huntOut = c.ground ? E.huntResult(S, area, res) : null;
  if (c.ground && res.fled) S.hunt = null;
  const bountyOut = res.won && res.kills ? E.bountyKills(S, area, res.kills) : [];
  if (res.won && c.boss && !c.arena && !c.story) bossScenes = E.clearArea(S, area);
  if (bossScenes && area === 'tower') {
    chapterEnd();
    bossScenes = [E.pages(S) >= 3 ? 'hale_choice' : 'warden_end_dark', 'chapter_end'];
    dynScenes.chapter_end = null;
    S.flags.pendingEnd = true;
  }
  save();
  const close = () => { if (FX) { FX.stop(); FX = null; } const b = document.getElementById('battle'); if (b) b.remove(); document.body.style.overflow = ''; B = null; };
  if (c.war) { warBattleEnd(res, c, close); return; }
  if (c.arena) {
    if (!res.won) {
      E.healParty(S); save();
      overlay(`<div class="sheet" style="text-align:center"><h2>Beaten</h2><p>The crowd groans. The healers drag you off the sand and patch you up.</p><p class="muted">No harm done. Train, forge and come back.</p>
        <button class="primary big" data-a="afterArena">Back to the pit</button></div>`, 'center');
      ACT.afterArena = () => { closeOverlay(); close(); go('market'); };
      return;
    }
    const out = E.arenaWin(S, c.arena), bout = E.findBout(c.arena);
    E.healParty(S); save();
    const xpLines = S.party.map(id => res.heroXp[id] ? `${heroName(id)} +${res.heroXp[id]} XP${res.levels[id] ? ` <b style="color:var(--gold)">Level ${S.heroes[id].lvl}!</b>` : ''}` : '').filter(Boolean).join('<br>');
    overlay(`<div class="sheet" style="text-align:center"><h2>${bout.final && out.first ? 'Champion!' : 'The crowd roars'}</h2>
      <p class="small">${xpLines}</p><p><span class="goldtxt">+${res.gold} gold</span></p>
      <p><b style="color:var(--gold)">${out.first ? 'Prize: ' : ''}${out.got.join(', ')}</b></p>
      <button class="primary big" data-a="afterArena">Continue</button></div>`, 'center');
    ACT.afterArena = () => {
      closeOverlay(); close(); go('market');
      const after = () => { if (out.gearUid) equipPrompt(E.gearOf(S, out.gearUid)); };
      if (out.creature && !S.flags.seen.fox_won) scene('fox_won', () => { go('market'); after(); });
      else after();
    };
    return;
  }
  if (res.fled) { close(); go('area', { id: area, msg: 'You got away. Nobody\'s proud of it.' }); return; }
  if (!res.won) {
    const lost = E.defeatPenalty(S); save();
    overlay(`<div class="sheet" style="text-align:center"><h2>Defeated</h2><p>The party drags itself back to Emberwake and wakes the next morning, sore but alive.</p>
      <p class="muted">Lost ${lost} gold. Everything else is kept, including experience. Train, forge, learn, then go again.</p>
      <button class="primary big" data-a="afterLoss">Back to the keep</button></div>`, 'center');
    ACT.afterLoss = () => { closeOverlay(); close(); go('keep'); };
    return;
  }
  const lines = [];
  for (const id of S.roster) {
    const xp = res.heroXp[id], bx = res.bench[id], lv = res.levels[id];
    if (!xp && !bx && !S.party.includes(id)) continue;
    lines.push(`<div class="spread"><span>${heroName(id)}${bx ? ' <span class="muted small">(bench)</span>' : ''}</span><span>${xp || bx ? '+' + (xp || bx) + ' XP' : '<span class="muted">Knocked out, no XP</span>'}${lv ? ` <b style="color:var(--gold)">Level ${S.heroes[id].lvl}!</b>` : ''}</span></div>`);
  }
  if (res.creature) lines.push(`<div class="spread"><span>${res.creature.name}</span><span>+${res.creature.xp} XP${res.creature.ups ? ` <b style="color:var(--gold)">Level ${res.creature.lvl}!</b>` : ''}</span></div>`);
  const loot = [];
  for (const m in res.mats) loot.push(`${res.mats[m]} ${D.MATS[m].name}`);
  for (const i in res.items) loot.push(`${res.items[i]} ${D.ITEMS[i].name}`);
  for (const g of res.gear) loot.push(`<b style="color:var(--gold)">${D.GEAR[g].name}</b>`);
  if (nodeOut && nodeOut.got && nodeOut.got.length) loot.push(...nodeOut.got.map(x => `<b style="color:var(--gold)">${x}</b>`));
  if (huntOut) loot.push(...huntOut.got.map(x => `<b style="color:var(--gold)">${x}</b>`));
  const chainLine = c.ground ? `<p class="small" style="color:var(--gold)">Hunting chain ${E.huntChain(S, area)}. Next fight pays ×${E.huntMult(S, area).toFixed(1)}. A short breather: everyone standing gets back a fifth of their health.</p>` : '';
  const bountyLine = bountyOut.map(o => `<p class="small" style="color:var(--good)"><b>Bounty paid:</b> ${o.b.need} ${D.ENEMIES[o.b.t].name}. ${o.got.join(', ')}</p>`).join('');
  const anyLevel = Object.keys(res.levels).length;
  overlay(`<div class="sheet"><h2>Victory</h2><div class="list">${lines.join('')}</div>
    <p><span class="goldtxt">+${res.gold} gold</span>${loot.length ? ' · ' + loot.join(', ') : ''}</p>
    ${chainLine}${bountyLine}
    ${res.tamed.length ? `<p style="color:var(--good)"><b>Tamed: ${res.tamed.join(', ')}!</b> It's in your kennels. Set it as your companion from Creatures at the keep.</p>` : ''}
    ${(S.dexNews || []).map(t => `<p style="color:var(--gold)"><b>Beast book: ${t}</b></p>`).join('')}
    ${anyLevel ? '' : nextUpLines(2)}
    <button class="primary big" data-a="afterWin">Continue</button></div>`, 'center');
  S.dexNews = []; save();
  ACT.afterWin = () => {
    closeOverlay(); close();
    const queue = [];
    if (anyLevel) queue.push(() => levelUpScreen(res, next));
    if (S.creatures.length > E.capacity(S)) queue.push(() => makeRoom(next));
    for (const ev of (res.evolved || [])) queue.push(() => evolveScreen(ev, next));
    for (const g of res.gear) { const inst = S.gear.slice().reverse().find(x => x.id === g); if (inst) queue.push(() => { equipPrompt(inst); ACT.closeOv = () => { closeOverlay(); ACT.closeOv = () => closeOverlay(); next(); }; }); }
    if (huntOut && huntOut.gearUid) queue.push(() => { equipPrompt(E.gearOf(S, huntOut.gearUid)); ACT.closeOv = () => { closeOverlay(); ACT.closeOv = () => closeOverlay(); next(); }; });
    if (nodeOut && nodeOut.gearUid) queue.push(() => { equipPrompt(E.gearOf(S, nodeOut.gearUid)); ACT.closeOv = () => { closeOverlay(); ACT.closeOv = () => closeOverlay(); next(); }; });
    function next() {
      ACT.closeOv = () => closeOverlay();
      const f = queue.shift();
      if (f) { f(); return; }
      if (c.onWin) { c.onWin(); return; }
      if (bossScenes && area === 'tower') {
        scene(bossScenes[0], () => { chapterEnd(); scene('chapter_end', () => go('keep')); });
        return;
      }
      if (c.node === 'w13' && !nodeOut.scene) { go('area', { id: area, msg: 'The upper stair is clear.' }); afterStair(); return; }
      if (bossScenes) {
        scenes(bossScenes.slice(), () => { go('keep'); if (!E.area(area).c2 && area !== 'tower') toast('A new area is open on the map. Check the noticeboard too.', 3500); });
        return;
      }
      if (nodeOut && nodeOut.scene) {
        scene(nodeOut.scene, () => {
          go('area', { id: area, msg: null });
          if (S.roster.includes('dace') && nodeOut.scene === 'dace_join') joinCard('dace');
          if (nodeOut.scene === 'lantern_got' || nodeOut.scene === 'seal_found') toast(nodeOut.scene === 'seal_found' ? 'Take the seal back to the knight\'s tomb.' : `Lanterns found: ${E.lanterns(S)} of 3.`, 3000);
        });
        return;
      }
      if (c.after) { go('area', { id: area, msg: null }); c.after(); return; }
      go('area', { id: area, msg: 'The fight is won.' });
    }
    next();
  };
}
// The level up screen: every stat that went up, old and new, then what's close.
const LV_STATS = [['maxHp', 'HP'], ['maxMp', 'MP'], ['str', 'Strength'], ['mag', 'Magic'], ['def', 'Defence'], ['res', 'Resistance'], ['spd', 'Speed'], ['crit', 'Critical %']];
function levelUpScreen(res, then) {
  const ids = Object.keys(res.levels);
  const cards = ids.map(id => {
    const h = S.heroes[id], a = res.before[id], b = E.heroStats(S, id), ups = res.levels[id];
    const rows = LV_STATS.filter(([k]) => b[k] !== a[k]).map(([k, n]) => `<div class="lvrow"><span>${n}</span><span class="muted">${a[k]}</span><span class="arrow">→</span><b>${b[k]}</b><span class="up">+${b[k] - a[k]}</span></div>`).join('');
    const near = E.nextUp(S, id).slice(0, 3).map(x => `<div class="small nextup">▸ ${x.text}</div>`).join('');
    return `<div class="lvcard"><div class="spread"><div style="display:flex;align-items:center;gap:8px">${img(D.HEROES[id].sprite, 3)}<b class="serif" style="font-size:1.1rem">${heroName(id)}</b></div>
      <div class="lvnum"><span class="muted">Lv ${h.lvl - ups}</span> → <b>${h.lvl}</b></div></div>
      ${rows}<div class="small" style="color:var(--gold);margin-top:4px">+${2 * ups} talent points</div>${near ? `<div style="margin-top:6px">${near}</div>` : ''}</div>`;
  }).join('');
  const cr = res.creature && res.creature.ups ? `<div class="lvcard"><div class="spread"><b>${esc(res.creature.name)}</b><div class="lvnum"><span class="muted">Lv ${res.creature.lvl - res.creature.ups}</span> → <b>${res.creature.lvl}</b></div></div>${E.creatureNextUp(S) ? `<div class="small nextup">▸ ${E.creatureNextUp(S)}</div>` : ''}</div>` : '';
  overlay(`<div class="sheet levelup"><h2 class="lvtitle">Level up!</h2>${cards}${cr}
    <p class="muted small" style="text-align:center">Spend talent points from Party.</p>
    <button class="primary big" data-a="lvDone">Continue</button></div>`, 'center');
  ACT.lvDone = () => { closeOverlay(); then(); };
}
// One or two nudges for the victory screen: whatever is closest to happening.
function nextUpLines(n) {
  const all = [];
  const cn = E.creatureNextUp(S);
  if (cn) all.push({ when: 0.5, text: cn });
  for (const id of S.party) for (const x of E.nextUp(S, id)) all.push({ when: x.when, text: `${heroName(id)}: ${x.text}` });
  all.sort((a, b) => a.when - b.when);
  return all.length ? `<div style="margin:6px 0">${all.slice(0, n).map(x => `<div class="small nextup">▸ ${x.text}</div>`).join('')}</div>` : '';
}
function evolveScreen(ev, then) {
  const c = S.creatures.find(x => E.creatureName(x) === ev.to);
  const sprite = c ? E.creatureSprite(c) : null;
  overlay(`<div class="sheet" style="text-align:center"><p class="muted">Something is happening to ${esc(ev.from)}...</p>
    ${sprite ? `<div class="evo">${img(ev.mythic ? sprite : ev.final ? sprite.slice(0, -1) : sprite.split('@')[0], 4)}<span>→</span>${img(sprite, 4)}</div>` : ''}
    <h2>${esc(ev.from)} became a ${esc(ev.to)}!</h2><p class="muted small">${ev.mythic ? 'An Elder: a quarter stronger again, with a move that changes fights.' : ev.final ? 'Its last form but one. Stronger in every way, with its most powerful move. At level ' + W.EVO3_LVL + ' it can become an Elder.' : W.STANCES[ev.form].name + ' form, shaped by how it fought. It\'s stronger in every way and learned new moves.'}</p>
    <button class="primary big" data-a="evoOk">Brilliant</button></div>`, 'center');
  ACT.evoOk = () => { closeOverlay(); then(); };
}

// ---------- Boot ----------
go('title');
})();
