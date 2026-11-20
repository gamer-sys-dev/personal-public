// Emberwake: screens, menus and the battle UI. Rules live in engine.js.
(function () {
'use strict';
const D = window.DATA, E = window.ENGINE, SP = window.SPRITES;
const KEY = 'emberwake-save-v1';
const app = document.getElementById('app');
let S = null;          // the save
let view = { name: 'title' };

// ---------- helpers ----------
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (a, b) => b ? Math.max(0, Math.min(100, a / b * 100)) : 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const T = ms => sleep(ms * (S && S.opts.speed === 2 ? 0.5 : 1));
const img = (id, px, cls) => { const s = SP.spriteURL(id, px); return `<img class="px ${cls || ''}" src="${s.url}" width="${s.w}" height="${s.h}" alt="">`; };
const STAT_NAMES = { hp: 'HP', mp: 'MP', str: 'Strength', mag: 'Magic', def: 'Defence', res: 'Resistance', spd: 'Speed', crit: 'Critical %' };
const SHORT = { hp: 'HP', mp: 'MP', str: 'STR', mag: 'MAG', def: 'DEF', res: 'RES', spd: 'SPD', crit: 'CRIT' };
const STATUS = { poison: 'Poison', burn: 'Burn', slow: 'Slow', haste: 'Haste', defUp: 'Guard ▲', defDown: 'Armour ▼', resUp: 'Ward ▲', strUp: 'Fury ▲', taunt: 'Taunt', regen: 'Regen' };
const statLine = st => Object.keys(st || {}).map(k => `${st[k] > 0 ? '+' : ''}${st[k]} ${SHORT[k]}`).join(', ');

function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ } }
function load() {
  try { const t = localStorage.getItem(KEY); return t ? JSON.parse(t) : null; } catch (e) { return null; }
}
function toast(msg, ms) {
  const t = document.createElement('div');
  t.className = 'toast'; t.innerHTML = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms || 2200);
}
function go(name, extra) { view = Object.assign({ name }, extra || {}); render(); window.scrollTo(0, 0); }
function render() {
  if (S) save();
  const f = SCREENS[view.name];
  app.innerHTML = f ? f() : '';
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

function partyMini(showStatus) {
  return D.PARTY.map(id => {
    const h = S.heroes[id], st = E.heroStats(S, id);
    return `<div class="hero-mini ${h.hp <= 0 ? 'ko' : ''}">${img(D.HEROES[id].sprite, 3)}
      <div><div class="spread small"><b>${D.HEROES[id].name}</b><span class="muted">Lv ${h.lvl}${h.points ? ` <span class="pill on">${h.points} pt${h.points > 1 ? "s" : ""}</span>` : ''}</span></div>
      <div class="spread small muted" style="margin-top:3px"><span>HP ${h.hp}/${st.maxHp}</span><span>MP ${h.mp}/${st.maxMp}</span></div>
      <div class="grid2" style="gap:6px;margin-top:3px"><div class="bar ${h.hp < st.maxHp * .3 ? 'low' : ''}"><i style="width:${pct(h.hp, st.maxHp)}%"></i></div><div class="bar mp"><i style="width:${pct(h.mp, st.maxMp)}%"></i></div></div>
      ${showStatus && h.hp <= 0 ? '<div class="small" style="color:var(--bad);margin-top:3px">Knocked out</div>' : ''}</div></div>`;
  }).join('');
}

function objective() {
  const next = D.AREAS.find(a => !S.areas[a.id].cleared);
  if (!next) return 'Chapter One is done. Keep training, forging and mastering skills. Every area is still open.';
  const lines = {
    thornwood: 'Find whatever is killing the sheep in Thornwood.',
    millroad: 'Follow the trail to the Old Mill Road and deal with the bandits.',
    barrows: 'Cross the Barrow Hills, where the dead are walking.',
    fenmire: 'Find a way through Fenmire to the tower.',
    tower: 'Climb the Hollow Tower and face the Warden.',
  };
  return lines[next.id];
}

// ---------- Story scenes ----------
function scene(key, then) {
  const lines = D.STORY[key];
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
      <button class="link" style="margin-top:14px" data-a="importOpen">Load a saved game code</button>
    </div></div>`;
};

SCREENS.keep = () => {
  const shopName = S.shopTier >= 2 ? 'Hob\'s Trading Post' : 'Supplies';
  const pts = D.PARTY.some(id => S.heroes[id].points > 0);
  return `<div class="topbar"><h1>Emberwake Keep</h1><span class="goldtxt">${S.gold} g</span></div>
    <p class="muted">${S.shopTier >= 3 ? 'The keep is coming back to life. Hob\'s stall, Bram\'s forge and three beds that are almost dry.' : 'A ruined keep on the hill. Half a roof, a cold forge and three bedrolls.'}</p>
    <div class="card"><div class="small muted">Next</div><div>${objective()}</div></div>
    <div class="card">${partyMini(true)}</div>
    <button class="primary big" data-a="map">Set out</button>
    <div class="grid2" style="margin-top:8px">
      <button data-a="rest">Rest (free)</button>
      <button data-a="party">${pts ? 'Party ●' : 'Party'}</button>
      <button data-a="shop">${shopName}</button>
      <button data-a="forge">Bram's forge</button>
      <button data-a="bag">Bag</button>
      <button data-a="settings">Settings</button>
    </div>`;
};

SCREENS.map = () => {
  const rows = D.AREAS.map((a, i) => {
    const st = S.areas[a.id], open = i < S.unlocked;
    if (!open) return `<div class="card" style="opacity:.5"><div class="spread"><b class="serif">???</b><span class="pill">Locked</span></div><p class="muted">Clear ${D.AREAS[i - 1].name} first.</p></div>`;
    return `<div class="card"><div class="spread"><b class="serif" style="font-size:1.1rem">${a.name}</b>
      <span class="pill ${st.cleared ? 'good' : 'on'}">${st.cleared ? 'Cleared' : 'Lv ' + a.lvl[0] + ' to ' + a.lvl[1]}</span></div>
      <p class="muted">${a.desc}</p>
      <div class="bar xp"><i style="width:${pct(st.progress, a.steps)}%"></i></div>
      <div class="spread small muted" style="margin-top:4px"><span>${st.cleared ? 'Roam to train and gather' : `Path ${st.progress}/${a.steps}`}</span><span>${D.MATS[a.mat].name} here</span></div>
      <button class="big ${st.cleared ? '' : 'primary'}" data-a="enter" data-v="${a.id}">${st.cleared ? 'Roam' : st.progress ? 'Carry on' : 'Explore'}</button></div>`;
  }).join('');
  return `<div class="topbar"><h1>Where to?</h1><button class="sm" data-a="keep">Keep</button></div>${rows}`;
};

SCREENS.area = () => {
  const a = D.AREAS[E.areaIndex(view.id)], st = S.areas[a.id];
  const atBoss = !st.cleared && st.progress >= a.steps;
  const bossName = D.ENEMIES[a.boss[0].t].name;
  const lvl = Math.round(D.PARTY.reduce((s, id) => s + S.heroes[id].lvl, 0) / 3);
  const allKo = D.PARTY.every(id => S.heroes[id].hp <= 0);
  return `<div class="topbar"><h1>${a.name}</h1><span class="goldtxt">${S.gold} g</span></div>
    <div class="bar xp"><i style="width:${pct(st.progress, a.steps)}%"></i></div>
    <div class="spread small muted" style="margin:4px 0 8px"><span>${st.cleared ? 'Cleared. Roaming.' : `Path ${st.progress}/${a.steps}`}</span><span>Enemies Lv ${a.lvl[0]} to ${a.lvl[1] + (st.cleared ? 1 : 0)}</span></div>
    <div class="card"><div class="eventtxt">${view.msg || esc(a.desc)}</div></div>
    <div class="card">${partyMini(true)}</div>
    ${atBoss ? `<div class="card" style="border-color:var(--ember)"><b class="serif">${bossName}</b><p class="muted">Waits at the end of the path. Suggested level ${a.boss[0].lvl}. Your party averages ${lvl}. Rest first, it's free at the keep.</p>
       <button class="primary big" data-a="boss" ${allKo ? 'disabled' : ''}>Face ${bossName}</button></div>`
      : `<button class="primary big" data-a="explore" ${allKo ? 'disabled' : ''}>${st.cleared ? 'Roam' : 'Press on'}</button>`}
    ${atBoss ? `<button class="big" data-a="explore" data-v="train" ${allKo ? 'disabled' : ''}>Train here first</button>` : ''}
    <div class="grid3" style="margin-top:8px"><button data-a="party">Party</button><button data-a="bag">Bag</button><button data-a="keep">Keep</button></div>`;
};

SCREENS.party = () => {
  const id = view.hero || 'bram', tab = view.tab || 'stats';
  const h = S.heroes[id], st = E.heroStats(S, id), def = D.HEROES[id];
  const tabs = ['stats', 'talents', 'gear', 'skills'].map(t => `<button class="${t === tab ? 'on' : ''}" data-a="ptab" data-v="${t}">${t === 'talents' && h.points ? 'Talents ●' : t[0].toUpperCase() + t.slice(1)}</button>`).join('');
  let body = '';
  if (tab === 'stats') {
    body = `<div class="card"><div class="spread"><b class="serif" style="font-size:1.15rem">${def.name}</b><span class="muted">${def.role}</span></div>
      <p class="muted">${def.blurb}</p>
      <div class="spread small"><span>Level ${h.lvl}</span><span class="muted">${h.xp}/${E.xpNext(h.lvl)} XP</span></div>
      <div class="bar xp" style="margin:4px 0 12px"><i style="width:${pct(h.xp, E.xpNext(h.lvl))}%"></i></div>
      <div class="stats">
        <div><span>HP</span><b>${h.hp}/${st.maxHp}</b></div><div><span>MP</span><b>${h.mp}/${st.maxMp}</b></div>
        ${['str', 'mag', 'def', 'res', 'spd', 'crit'].map(k => `<div><span>${STAT_NAMES[k]}</span><b>${st[k]}</b></div>`).join('')}
      </div>
      <p class="muted" style="margin-top:10px">Talent points: <b style="color:var(--gold)">${h.points}</b>. Two per level, plus any Tomes of Insight you find.</p></div>`;
  } else if (tab === 'talents') {
    body = `<div class="card"><div class="spread"><b>Talent points</b><span class="pill on">${h.points}</span></div>
      <p class="muted small">Anyone can learn any tree. Ranks unlock at levels ${D.TALENT_REQ.join(', ')} and cost ${D.TALENT_COST.join(', ')} points.</p>
      ${Object.keys(D.TREES).map(tk => {
        const tr = D.TREES[tk], r = h.talents[tk] || 0, n = E.talentNext(S, id, tk);
        const ranks = tr.ranks.map((rk, i) => {
          const label = rk.skill ? `<b>${D.SKILLS[rk.skill].name}</b> <span class="muted">${D.SKILLS[rk.skill].mp} MP. ${D.SKILLS[rk.skill].desc || ''}</span>` : rk.text;
          const cls = i < r ? 'have' : i === r ? 'next' : 'locked';
          return `<div class="rank ${cls}">${i + 1}. ${label} <span class="muted small">(Lv ${D.TALENT_REQ[i]}, ${D.TALENT_COST[i]} pt)</span></div>`;
        }).join('');
        return `<details ${view.open === tk ? 'open' : ''}><summary><div class="spread">
          <div><b style="color:${tr.colour}">${tr.name}</b> <span class="dots" style="color:${tr.colour}">${'●'.repeat(r)}${'○'.repeat(6 - r)}</span><div class="muted small">${tr.desc}</div></div>
          ${n.max ? '<span class="pill good">Mastered</span>' : `<button class="sm ${n.ok ? 'gold' : ''}" data-a="learn" data-v="${tk}" ${n.ok ? '' : 'disabled'}>${h.lvl < n.req ? 'Lv ' + n.req : 'Learn ' + n.cost}</button>`}
          </div></summary>${ranks}</details>`;
      }).join('')}</div>`;
  } else if (tab === 'gear') {
    body = `<div class="card">${['weapon', 'armour', 'charm'].map(slot => {
      const g = E.gearOf(S, h.equip[slot]);
      return `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="spread"><div><div class="muted small">${slot[0].toUpperCase() + slot.slice(1)}</div>
        <b>${g ? E.gearName(g) : 'Nothing'}</b><div class="small muted">${g ? gearDesc(g) : ''}</div></div>
        <button class="sm" data-a="slot" data-v="${slot}">Change</button></div></div>`;
    }).join('')}</div>
    ${view.slot ? slotPicker(id, view.slot) : ''}`;
  } else {
    const skills = st.skills.filter(s => s !== 'attack');
    body = `<div class="card"><p class="muted small">Skills get stronger the more you use them. Each mastery star adds 10% power.</p>
      ${skills.length ? skills.map(s => {
        const sk = D.SKILLS[s], uses = h.mastery[s] || 0, lv = E.masteryLevel(uses), nextAt = E.MASTERY[lv];
        return `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="spread"><b>${sk.name}</b><span style="color:var(--gold)">${'★'.repeat(lv)}${'☆'.repeat(4 - lv)}</span></div>
          <div class="small muted">${sk.mp || 0} MP. ${sk.desc || ''} Used ${uses} times${nextAt ? `, next star at ${nextAt}` : ', fully mastered'}.</div></div>`;
      }).join('') : '<p class="muted">No skills yet. Learn some in Talents.</p>'}</div>`;
  }
  return `<div class="topbar"><h1>Party</h1><button class="sm" data-a="back">Back</button></div>
    <div class="herotabs">${D.PARTY.map(pid => `<button class="${pid === id ? 'on' : ''}" data-a="phero" data-v="${pid}">${img(D.HEROES[pid].sprite, 3)}<span class="small">${D.HEROES[pid].name}${S.heroes[pid].points ? ' ●' : ''}</span></button>`).join('')}</div>
    <div class="tabs">${tabs}</div>${body}`;
};

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
      return `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="spread"><div class="grow"><b>${E.gearName(g)}</b>${by ? ` <span class="pill">${D.HEROES[by].name}</span>` : ''}
        <div class="small muted">${gearDesc(g)}</div><div class="small">${deltaFor(heroId, slot, g.uid)}</div></div>
        <button class="sm gold" data-a="equip" data-v="${g.uid}">Equip</button></div></div>`;
    }).join('') : '<p class="muted">Nothing else to wear here. Buy more from the shop or find it out there.</p>'}
    ${slot === 'charm' && S.heroes[heroId].equip.charm ? '<button class="sm" data-a="equip" data-v="none">Take off charm</button>' : ''}
    <button class="link" data-a="slot" data-v="">Close</button></div>`;
}

SCREENS.shop = () => {
  const tab = view.tab || 'buy';
  const name = S.shopTier >= 2 ? 'Hob\'s Trading Post' : 'Supplies';
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
    const costTxt = c ? `${c.gold} g, ` + Object.keys(c.mats).map(m => `<span class="${(S.mats[m] || 0) >= c.mats[m] ? '' : 'down'}">${c.mats[m]} ${D.MATS[m].name} (${S.mats[m] || 0})</span>`).join(', ') : '';
    return `<div><div class="spread"><div class="grow"><b>${E.gearName(g)}</b>${by ? ` <span class="pill">${D.HEROES[by].name}</span>` : ''}
      <div class="small muted">${gearDesc(g)}</div>
      ${c ? `<div class="small">Next: <span class="up">${statLine(next)}</span></div><div class="small muted">${costTxt}</div>` : '<div class="small" style="color:var(--gold)">Fully forged</div>'}</div>
      ${c && Object.keys(D.GEAR[g.id].stats || {}).length ? `<button class="sm gold" data-a="forgeIt" data-v="${g.uid}" ${E.canForge(S, g) ? '' : 'disabled'}>Forge</button>` : ''}</div></div>`;
  }).join('');
  return `<div class="topbar"><h1>Bram's forge</h1><span class="goldtxt">${S.gold} g</span></div>
    <p class="muted">His father's tools, cleaned and hung back up. Each level adds 15% to a piece's stats, up to +5. Materials come from fights and foraging.</p>
    <div class="card">${mats}</div><div class="card list">${list}</div><button class="big" data-a="keep">Back</button>`;
};

SCREENS.bag = () => {
  const items = Object.keys(D.ITEMS).filter(k => S.bag[k] > 0);
  const casters = [];
  for (const id of D.PARTY) {
    const st = E.heroStats(S, id);
    for (const s of st.skills) if (['heal', 'mass_heal', 'raise', 'second_wind', 'sanctuary'].includes(s)) casters.push({ id, s });
  }
  return `<div class="topbar"><h1>Bag</h1><button class="sm" data-a="back">Back</button></div>
    <div class="card">${partyMini(true)}</div>
    <div class="card"><h2>Items</h2><div class="list">${items.length ? items.map(k => {
      const it = D.ITEMS[k], field = !it.bomb && !it.flee && !it.cure;
      return `<div class="spread"><div class="grow"><b>${it.name}</b> <span class="muted small">× ${S.bag[k]}</span><div class="small muted">${it.desc}</div></div>
        ${field ? `<button class="sm gold" data-a="useItem" data-v="${k}">Use</button>` : '<span class="muted small">In battle</span>'}</div>`;
    }).join('') : '<p class="muted">Empty.</p>'}</div></div>
    ${casters.length ? `<div class="card"><h2>Healing magic</h2><div class="list">${casters.map(c => {
      const sk = D.SKILLS[c.s];
      return `<div class="spread"><div class="grow"><b>${sk.name}</b> <span class="muted small">${D.HEROES[c.id].name}, ${sk.mp} MP (has ${S.heroes[c.id].mp})</span></div>
        <button class="sm gold" data-a="castField" data-v="${c.id}:${c.s}">Cast</button></div>`;
    }).join('')}</div></div>` : ''}
    <div class="card"><h2>Materials</h2>${Object.keys(D.MATS).map(m => `<span class="pill">${D.MATS[m].name} ${S.mats[m] || 0}</span>`).join(' ')}</div>`;
};

SCREENS.settings = () => `<div class="topbar"><h1>Settings</h1><button class="sm" data-a="keep">Back</button></div>
  <div class="card"><h2>Battle speed</h2><div class="row">
    <button class="${S.opts.speed !== 2 ? 'gold' : ''}" data-a="speed" data-v="1">Normal</button>
    <button class="${S.opts.speed === 2 ? 'gold' : ''}" data-a="speed" data-v="2">Fast</button></div>
    <p class="muted small">Auto battle can be switched on and off during any fight. Handy for training.</p></div>
  <div class="card"><h2>Your save</h2><p class="muted small">The game saves itself on this phone after every step. Browsers can clear saved data, so copy a save code now and then and keep it somewhere safe, like a note or an email to yourself.</p>
    <button data-a="exportSave">Copy a save code</button> <button data-a="importOpen">Load a save code</button></div>
  <div class="card"><h2>Record</h2><p class="muted small">${S.stats.wins} fights won of ${S.stats.battles}. ${S.stats.steps} steps explored.</p></div>
  <div class="card"><h2>Start again</h2><p class="muted small">Wipes this save.</p><button data-a="wipe" style="border-color:var(--bad);color:var(--bad)">New game</button></div>`;

// ---------- Actions ----------
const ACT = {};
ACT.newGame = () => {
  if (load() && !confirm('Start a new game? Your current save will be replaced.')) return;
  S = E.newGame(); save();
  scene('intro', () => { go('keep'); toast('Tip: you can rest at the keep for free, any time.', 3000); });
};
ACT.continue = () => { S = load(); if (!S.opts) S.opts = { speed: 1 }; E.clampParty(S); go('keep'); };
ACT.keep = () => go('keep');
ACT.map = () => go('map');
ACT.rest = () => { E.restParty(S); toast('The party rests. Everyone is back to full.'); render(); };
ACT.party = () => go('party', { hero: view.hero || 'bram', tab: 'stats', from: view.name === 'party' ? view.from : view.name, fromId: view.id });
ACT.bag = () => go('bag', { from: view.name, fromId: view.id });
ACT.back = () => { if (view.from === 'area') go('area', { id: view.fromId }); else go(view.from || 'keep'); };
ACT.shop = () => go('shop', { tab: 'buy' });
ACT.forge = () => go('forge');
ACT.settings = () => go('settings');
ACT.phero = v => { view.hero = v; view.slot = null; render(); };
ACT.ptab = v => { view.tab = v; view.slot = null; render(); };
ACT.stab = v => { view.tab = v; render(); };
ACT.learn = v => {
  if (E.learnTalent(S, view.hero, v)) {
    const r = S.heroes[view.hero].talents[v], rk = D.TREES[v].ranks[r - 1];
    toast(`${D.HEROES[view.hero].name} learned ${rk.skill ? D.SKILLS[rk.skill].name : rk.text}`);
    view.open = v; render();
  }
};
ACT.slot = v => { view.slot = v || null; render(); };
ACT.equip = v => {
  E.equip(S, view.hero, view.slot, v === 'none' ? null : +v);
  view.slot = null; render();
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
  const slot = D.GEAR[inst.id].slot;
  overlay(`<div class="sheet"><h2>${E.gearName(inst)}</h2><p class="muted small">${gearDesc(inst)}</p><p>Who should use it?</p>
    ${D.PARTY.map(id => `<div class="spread" style="padding:6px 0;border-bottom:1px solid var(--line)"><div class="grow"><b>${D.HEROES[id].name}</b><div class="small">${deltaFor(id, slot, inst.uid)}</div></div>
      <button class="sm gold" data-a="equipOn" data-v="${id}:${inst.uid}">Equip</button></div>`).join('')}
    <button class="big" data-a="closeOv">Keep it in the bag</button></div>`);
}
ACT.equipOn = v => {
  const [id, uid] = v.split(':');
  E.equip(S, id, D.GEAR[E.gearOf(S, +uid).id].slot, +uid);
  closeOverlay(); toast(`${D.HEROES[id].name} equips it.`); render();
};
ACT.closeOv = () => closeOverlay();
ACT.sell = v => {
  const g = E.gearOf(S, +v);
  if (!g || E.equippedBy(S, g.uid)) return;
  S.gold += E.sellPrice(g);
  S.gear = S.gear.filter(x => x !== g);
  render();
};
ACT.forgeIt = v => { if (E.forge(S, +v)) { toast('Forged ' + E.gearName(E.gearOf(S, +v))); render(); } };
ACT.useItem = k => {
  const it = D.ITEMS[k];
  if (it.partyHeal) { if (E.fieldItem(S, k)) { toast('Everyone eats. HP and MP restored.'); render(); } return; }
  pickHero(`Use ${it.name} on`, id => {
    if (E.fieldItem(S, k, id)) { toast(`${it.name} used on ${D.HEROES[id].name}`); render(); }
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
  overlay(`<div class="sheet"><h2>${title}</h2>${D.PARTY.map(id => {
    const h = S.heroes[id], st = E.heroStats(S, id);
    return `<button class="big" data-a="pickHero" data-v="${id}" ${dead ? (h.hp > 0 ? 'disabled' : '') : (h.hp <= 0 ? 'disabled' : '')}>${D.HEROES[id].name} · HP ${h.hp}/${st.maxHp} · MP ${h.mp}/${st.maxMp}</button>`;
  }).join('')}<button class="link" data-a="closeOv">Cancel</button></div>`);
  ACT.pickHero = id => { closeOverlay(); cb(id); };
}
ACT.speed = v => { S.opts.speed = +v; render(); };
ACT.exportSave = async () => {
  const code = 'EMBER1.' + btoa(unescape(encodeURIComponent(JSON.stringify(S))));
  try { await navigator.clipboard.writeText(code); toast('Save code copied. Paste it somewhere safe.'); }
  catch (e) { overlay(`<div class="sheet"><h2>Your save code</h2><p class="muted small">Copy all of this.</p><textarea readonly>${code}</textarea><button class="big" data-a="closeOv">Done</button></div>`); }
};
ACT.importOpen = () => overlay(`<div class="sheet"><h2>Load a save code</h2><p class="muted small">Paste a code that starts EMBER1. This replaces the game on this phone.</p>
  <textarea id="imp"></textarea><button class="primary big" data-a="importGo">Load it</button><button class="link" data-a="closeOv">Cancel</button></div>`);
ACT.importGo = () => {
  const t = (document.getElementById('imp').value || '').trim();
  const m = t.match(/EMBER1\.([A-Za-z0-9+/=]+)/);
  try {
    const obj = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    if (!obj.heroes || !obj.areas) throw new Error('bad');
    S = obj; if (!S.opts) S.opts = { speed: 1 }; save(); closeOverlay(); toast('Save loaded.'); go('keep');
  } catch (e) { toast('That code didn\'t work. Check you copied all of it.'); }
};
ACT.wipe = () => {
  if (!confirm('Wipe this save and start again? This can\'t be undone unless you copied a save code.')) return;
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  S = null; go('title');
};
ACT.enter = id => {
  const st = S.areas[id];
  const msg = st.cleared ? 'Back on familiar ground. Good for training and gathering.' : null;
  if (!S.flags.seen[id + '_in']) scene(id + '_in', () => go('area', { id, msg }));
  else go('area', { id, msg });
};

const FLAVOUR = {
  thornwood: { gold: 'tucked in a hollow log', camp: 'A sunny clearing with a clear stream.' },
  millroad: { gold: 'in a bandit\'s stash under a loose milestone', camp: 'An empty waystation with a fire pit still warm.' },
  barrows: { gold: 'among grave goods nobody will miss', camp: 'A ring of standing stones the dead won\'t cross.' },
  fenmire: { gold: 'in a sunken boat', camp: 'A dry hummock with a fisher\'s shelter on it.' },
  tower: { gold: 'on a fallen Hollow captain', camp: 'A guardroom with a door that locks from the inside.' },
};
ACT.explore = v => {
  const id = view.id, a = D.AREAS[E.areaIndex(id)], st = S.areas[id];
  if (v === 'train') {
    const specs = E.encounter(a, { progress: a.steps, cleared: false });
    return startBattle(specs, { area: id });
  }
  const ev = E.explore(S, id);
  const f = FLAVOUR[id];
  let msg = '';
  switch (ev.type) {
    case 'boss': render(); return;
    case 'battle': return startBattle(ev.enemies, { area: id, advance: ev.advance });
    case 'treasure': msg = ev.gold ? `Found <b class="goldtxt">${ev.gold} gold</b> ${f.gold}.` : `Found a <b>${D.ITEMS[ev.item].name}</b>.`; break;
    case 'gather': msg = `Gathered <b>${ev.n} ${D.MATS[ev.mat].name}</b>. Good for the forge.`; break;
    case 'camp': msg = `${f.camp} The party rests a while. <span class="up">Recovered 30% HP and MP.</span>`; break;
    case 'tome': msg = '<b style="color:var(--gold)">A Tome of Insight!</b> Everyone reads a little of it. <span class="up">+1 talent point each.</span>'; break;
    case 'unique': msg = `<b style="color:var(--gold)">Found ${D.GEAR[ev.gear].name}!</b> ${gearDesc({ id: ev.gear, plus: 0 })}.`;
      setTimeout(() => equipPrompt(S.gear[S.gear.length - 1]), 50); break;
  }
  if (!st.cleared && st.progress >= a.steps && ev.type !== 'boss') msg += ` <br><br>The path ends ahead. Something big is waiting.`;
  view.msg = msg; render();
};
ACT.boss = () => {
  const id = view.id, a = D.AREAS[E.areaIndex(id)];
  const fight = () => startBattle(E.bossSpecs(a), { area: id, boss: true });
  if (!S.flags.seen[id + '_boss']) scene(id + '_boss', fight); else fight();
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const f = ACT[el.dataset.a];
  if (f) { e.preventDefault(); f(el.dataset.v, el); }
});

// ---------- Battle UI ----------
const BG = {
  thornwood: ['#6fa0c8', '#b8d4e0', '#2f5a2a', '#1f3d1c'],
  millroad: ['#e08a5a', '#f0c890', '#6a5a3a', '#4a3e28'],
  barrows: ['#4a5468', '#8a94a8', '#4a5a4a', '#2e3a30'],
  fenmire: ['#3a5048', '#6a8478', '#2a3a2a', '#1a261c'],
  tower: ['#2a2040', '#5a4878', '#3a3448', '#22202c'],
};
let B = null, ctx = null, pending = null;

function startBattle(specs, c) {
  ctx = c;
  B = new E.Battle(S, specs, { boss: !!c.boss, autoItems: false });
  const bg = BG[c.area] || BG.thornwood;
  const el = document.createElement('div');
  el.id = 'battle';
  el.innerHTML = `<div class="field"><div class="sky" style="background:linear-gradient(180deg,${bg[0]},${bg[1]})"></div>
    <div class="ground" style="background:linear-gradient(180deg,${bg[2]},${bg[3]})"></div>
    <div class="foes" id="foes"></div><div class="friends" id="friends"></div><div class="banner" id="banner"></div></div>
    <div class="pbars" id="pbars"></div><div class="cmd" id="cmd"></div>`;
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
  drawUnits(); drawBars(); drawCmd();
  runBattle();
}
function unitHTML(a) {
  const big = a.side === 'e' && (a.isBoss || B.enemies.length <= 2);
  const sp = SP.SPRITES[a.sprite] || {};
  const px = a.side === 'h' ? 4 : Math.round((big ? 4 : 3) * (sp.scale || 1));
  return `<div class="unit ${a.hp <= 0 ? 'ko' : ''}" id="u-${a.key}" data-a="tgt" data-v="${a.key}">
    ${img(a.sprite, px)}
    ${a.side === 'e' ? `<div class="uname">${esc(a.name)}</div><div class="hpmini"><i style="width:${pct(a.hp, a.maxHp)}%"></i></div>` : ''}
    <div class="sts"></div></div>`;
}
function drawUnits() {
  const foes = document.getElementById('foes');
  const live = B.enemies.filter(e => e.hp > 0);
  foes.className = 'foes' + (live.length === 1 ? ' one' : '');
  foes.innerHTML = live.map(unitHTML).join('');
  document.getElementById('friends').innerHTML = B.heroes.map(unitHTML).join('');
  refreshUnits();
}
function refreshUnits() {
  for (const a of B.all()) {
    const u = document.getElementById('u-' + a.key);
    if (!u) continue;
    u.classList.toggle('ko', a.hp <= 0);
    const bar = u.querySelector('.hpmini i'); if (bar) bar.style.width = pct(a.hp, a.maxHp) + '%';
    u.querySelector('.sts').textContent = Object.keys(a.statuses).map(s => STATUS[s]).join(' ');
  }
}
function drawBars(active) {
  document.getElementById('pbars').innerHTML = B.heroes.map(h => `<div class="prow ${h.hp <= 0 ? 'ko' : ''} ${active === h ? 'active' : ''}" id="r-${h.key}" data-a="tgt" data-v="${h.key}">
    <div><div class="nm">${h.name}</div><div class="sts">${Object.keys(h.statuses).map(s => STATUS[s]).join(' ')}</div></div>
    <div><div class="num"><span>HP</span><span>${h.hp}/${h.maxHp}</span></div><div class="bar ${h.hp < h.maxHp * .3 ? 'low' : ''}"><i style="width:${pct(h.hp, h.maxHp)}%"></i></div></div>
    <div><div class="num"><span>MP</span><span>${h.mp}/${h.maxMp}</span></div><div class="bar mp"><i style="width:${pct(h.mp, h.maxMp)}%"></i></div></div>
    <div><div class="num"><span>ATB</span></div><div class="bar atb"><i style="width:${h.hp > 0 ? h.gauge : 0}%"></i></div></div></div>`).join('');
}
function updateGauges() {
  for (const h of B.heroes) {
    const r = document.getElementById('r-' + h.key);
    if (r) r.querySelector('.atb i').style.width = (h.hp > 0 ? h.gauge : 0) + '%';
  }
}
function banner(text) {
  const b = document.getElementById('banner');
  if (!b) return;
  b.textContent = text; b.classList.add('show');
  clearTimeout(banner.t); banner.t = setTimeout(() => b.classList.remove('show'), 900 * (S.opts.speed === 2 ? 0.6 : 1));
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
      case 'say': banner(ev.text); await T(ev.who ? 380 : 650); break;
      case 'dmg':
        floatText(ev.who, ev.n + (ev.crit ? '!' : ''), ev.crit ? 'crit' : '');
        if (ev.weak) floatText(ev.who, 'WEAK', 'label');
        if (ev.resist) floatText(ev.who, 'RESIST', 'label');
        if (ev.dot) floatText(ev.who, STATUS[ev.dot], 'label');
        pulse(ev.who, 'hit'); pulse(ev.who, 'flash');
        refreshUnits(); drawBars(); await T(330); break;
      case 'heal': floatText(ev.who, '+' + ev.n, 'heal'); refreshUnits(); drawBars(); await T(300); break;
      case 'mp': floatText(ev.who, '+' + ev.n + ' MP', 'mp'); drawBars(); await T(300); break;
      case 'revive': floatText(ev.who, 'Back up!', 'heal'); refreshUnits(); drawBars(); await T(400); break;
      case 'status': floatText(ev.who, STATUS[ev.s], 'label'); refreshUnits(); drawBars(); await T(250); break;
      case 'immune': floatText(ev.who, 'Immune', 'label'); await T(250); break;
      case 'off': refreshUnits(); drawBars(); break;
      case 'ko': refreshUnits(); drawBars(); await T(350); break;
      case 'summon': drawUnits(); pulse(ev.who, 'flash'); banner(ev.who.name + ' joins the fight'); await T(500); break;
      case 'mastery': toast(`${D.SKILLS[ev.skill].name} mastery ${'★'.repeat(ev.lvl)}`); break;
    }
  }
}
async function runBattle() {
  await T(350);
  while (!B.over) {
    const a = B.advance();
    if (!a) break;
    updateGauges();
    await T(a.side === 'h' ? 180 : 140);
    const pre = B.startTurn(a);
    if (pre.length) await play(pre);
    if (B.over) break;
    if (a.hp <= 0) continue;
    let c;
    if (a.side === 'h') {
      drawBars(a);
      document.getElementById('u-' + a.key).classList.add('active');
      c = S.opts.auto ? B.autoChoice(a) : await choose(a);
      const u = document.getElementById('u-' + a.key); if (u) u.classList.remove('active');
    } else {
      c = B.enemyChoice(a);
    }
    const u = document.getElementById('u-' + a.key);
    if (u) { u.classList.add('step'); }
    await T(160);
    const ev = B.act(a, c);
    await play(ev);
    if (u) u.classList.remove('step');
    drawBars();
    if (a.side === 'h') drawCmd();
  }
  await T(400);
  endBattle();
}

// Command menu
function choose(a) {
  return new Promise(res => { pending = { a, res, mode: 'main' }; drawCmd(); });
}
function resolve(c) {
  const p = pending; pending = null;
  clearTargets(); drawCmd();
  p.res(c);
}
function clearTargets() { document.querySelectorAll('.targetable').forEach(x => x.classList.remove('targetable')); }
function drawCmd() {
  const el = document.getElementById('cmd');
  if (!el) return;
  const autoBtn = `<button class="sm autobtn ${S.opts.auto ? 'on' : ''}" data-a="bAuto">Auto ${S.opts.auto ? 'on' : 'off'}</button>`;
  if (!pending) { el.innerHTML = `<div class="cmdtop"><span class="muted small">${B && B.boss ? 'Boss fight' : ''}</span>${autoBtn}</div>`; return; }
  const a = pending.a;
  if (pending.mode === 'main') {
    el.innerHTML = `<div class="cmdtop"><b class="serif">${a.name}'s turn</b>${autoBtn}</div>
      <div class="grid2"><button class="primary" data-a="bAttack">Attack</button><button data-a="bSkills">Skills</button>
      <button data-a="bItems">Items</button><button data-a="bDefend">Defend</button></div>
      ${B.boss ? '' : '<button class="link" style="width:100%;margin-top:6px" data-a="bFlee">Try to run</button>'}`;
  } else if (pending.mode === 'skills') {
    const list = a.skills.filter(s => s !== 'attack');
    el.innerHTML = `<div class="cmdtop"><b class="serif">${a.name} · MP ${a.mp}</b><button class="sm" data-a="bBack">Back</button></div>
      ${list.length ? list.map(s => {
        const sk = D.SKILLS[s], cost = B.mpCost(a, sk), lv = E.masteryLevel(S.heroes[a.id].mastery[s]);
        return `<button class="skill" data-a="bSkill" data-v="${s}" ${a.mp < cost ? 'disabled' : ''}><span>${sk.name} <span style="color:var(--gold);font-size:.75rem">${'★'.repeat(lv)}</span></span><span class="c">${cost} MP</span></button>`;
      }).join('') : '<p class="muted">No skills yet. Learn talents at the keep or from the Party menu.</p>'}`;
  } else if (pending.mode === 'items') {
    const list = Object.keys(D.ITEMS).filter(k => S.bag[k] > 0 && !D.ITEMS[k].field);
    el.innerHTML = `<div class="cmdtop"><b class="serif">Items</b><button class="sm" data-a="bBack">Back</button></div>
      ${list.length ? list.map(k => `<button class="skill" data-a="bItem" data-v="${k}"><span>${D.ITEMS[k].name}</span><span class="c">× ${S.bag[k]}</span></button>`).join('') : '<p class="muted">Nothing usable.</p>'}`;
  } else if (pending.mode === 'target') {
    el.innerHTML = `<div class="cmdtop"><b class="serif">${pending.label}: choose a target</b><button class="sm" data-a="bBack">Back</button></div>
      <p class="muted small">Tap ${pending.kind === 'enemy' ? 'an enemy' : 'a party member'} above.</p>`;
  }
}
function startTargeting(kind, choice, label) {
  pending.mode = 'target'; pending.kind = kind; pending.choice = choice; pending.label = label;
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
ACT.bSkill = s => {
  const sk = D.SKILLS[s], c = { kind: 'skill', id: s };
  if (sk.target === 'enemy' || sk.target === 'ally' || sk.target === 'deadAlly') startTargeting(sk.target, c, sk.name);
  else resolve(c);
};
ACT.bItem = k => {
  const it = D.ITEMS[k], c = { kind: 'item', id: k };
  if (it.target === 'ally' || it.target === 'deadAlly') startTargeting(it.target, c, it.name);
  else resolve(c);
};
ACT.bAuto = () => {
  S.opts.auto = !S.opts.auto; save();
  if (S.opts.auto && pending) resolve(B.autoChoice(pending.a));
  else drawCmd();
};

function endBattle() {
  const res = E.finishBattle(S, B);
  const wasBoss = ctx.boss, area = ctx.area;
  if (res.won && ctx.advance) S.areas[area].progress = Math.min(S.areas[area].progress + 1, D.AREAS[E.areaIndex(area)].steps);
  if (res.won && wasBoss) E.clearArea(S, area);
  save();
  const close = () => { const b = document.getElementById('battle'); if (b) b.remove(); document.body.style.overflow = ''; B = null; };
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
  for (const id of D.PARTY) {
    const xp = res.heroXp[id];
    const lv = res.levels[id];
    lines.push(`<div class="spread"><span>${D.HEROES[id].name}</span><span>${xp ? '+' + xp + ' XP' : '<span class="muted">Knocked out, no XP</span>'}${lv ? ` <b style="color:var(--gold)">Level ${S.heroes[id].lvl}!</b>` : ''}</span></div>`);
  }
  const loot = [];
  for (const m in res.mats) loot.push(`${res.mats[m]} ${D.MATS[m].name}`);
  for (const i in res.items) loot.push(`${res.items[i]} ${D.ITEMS[i].name}`);
  for (const g of res.gear) loot.push(`<b style="color:var(--gold)">${D.GEAR[g].name}</b>`);
  const anyLevel = Object.keys(res.levels).length;
  overlay(`<div class="sheet"><h2>Victory</h2><div class="list">${lines.join('')}</div>
    <p><span class="goldtxt">+${res.gold} gold</span>${loot.length ? ' · ' + loot.join(', ') : ''}</p>
    ${anyLevel ? '<p class="muted small">New talent points to spend in Party.</p>' : ''}
    <button class="primary big" data-a="afterWin">Continue</button></div>`, 'center');
  ACT.afterWin = () => {
    closeOverlay(); close();
    const prompts = () => { for (const g of res.gear) { const inst = S.gear.slice().reverse().find(x => x.id === g); if (inst) setTimeout(() => equipPrompt(inst), 60); } };
    if (wasBoss) { scene(area + '_out', () => { go('keep'); prompts(); if (area !== 'tower') toast('A new area is open on the map.', 3000); }); return; }
    const st = S.areas[area], a = D.AREAS[E.areaIndex(area)];
    let msg = 'The fight is won.';
    if (!st.cleared && st.progress >= a.steps) msg += ' The path ends ahead. Something big is waiting.';
    go('area', { id: area, msg });
    prompts();
  };
}

// ---------- Boot ----------
go('title');
})();
