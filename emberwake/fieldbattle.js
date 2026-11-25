// Emberwake: war battles you fight yourself. One unit per squad in your army, plus the general.
// Open field (meeting a Hollow army) or storming a Hollow-held place (walls, a gate, bowmen on top, a banner to take).
// Rules (class Field) need no DOM; runField draws it on a canvas with the siege screen's camera.
(function (root) {
'use strict';
const FW = 160, FH = 130, WALL_Y = 36, GATE = [72, 88], FLAG = { x: 80, y: 12 };
const PT = {
  sword:  { sp: 'm_sword', range: 3.5, speed: 8 },
  archer: { sp: 'm_archer', range: 30, speed: 7, ranged: true },
  spear:  { sp: 'm_spear', range: 4.5, speed: 7.5, vsLarge: 1.8 },
  priest: { sp: 'm_priest', range: 20, speed: 7, heal: true },
  knight: { sp: 'm_knight', range: 4, speed: 13 },
  rider:  { sp: 'm_knight', range: 4, speed: 16, charge: 1.5 },
};
const ET = {
  grunt:   { sp: 'soldier', range: 3.5, speed: 7, share: 1 },
  hound:   { sp: 'hound', range: 3, speed: 14, share: 0.7 },
  bowman:  { sp: 'h_bowman', range: 30, speed: 6.5, share: 0.8, ranged: true },
  brute:   { sp: 'h_brute', range: 4.5, speed: 5.5, share: 2.4, large: true },
  acolyte: { sp: 'acolyte', range: 20, speed: 6, share: 0.8, heal: true },
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

class Field {
  // army: the WAR army; Q: Hollow strength; o: { fort, boss: { name, sprite, mult }, rng }
  constructor(S, army, Q, o) {
    o = o || {};
    this.S = S; this.army = army; this.Q = Q; this.fort = !!o.fort; this.rng = o.rng || Math.random;
    this.units = []; this.fx = []; this.t = 0; this.over = false; this.won = false; this.flagT = 0; this.rally = 0; this.rallyCd = 0;
    this.selected = [];
    const WAR = root.WAR, mode = this.fort ? 'atk' : 'def';
    // your squads, in a line at the bottom
    const n = army.squads.length;
    army.squads.forEach((sid, i) => {
      const s = S.war.soldiers[sid], d = PT[s.type], pw = WAR.soldierPower(S, s, mode) * (1 + (WAR.mods(S).soldierPower || 0));
      this.add({ side: 'p', sid, sp: d.sp, name: WAR.title(s) + ' ' + s.name, x: FW / 2 + (i - (n - 1) / 2) * 11, y: FH - 14 - (d.ranged || d.heal ? 6 : 0),
        hp: 40 + pw * 9, dps: pw * 0.8, range: d.range, speed: d.speed, heal: d.heal, ranged: d.ranged, vsLarge: d.vsLarge, charge: d.charge, rank: s.rank });
    });
    if (army.general) {
      const h = S.heroes[army.general], g = WAR.generalMult(S, army);
      this.add({ side: 'p', hero: army.general, sp: root.DATA.HEROES[army.general].sprite, name: root.DATA.HEROES[army.general].name, x: FW / 2, y: FH - 6,
        hp: 100 + h.lvl * 16, dps: (4 + h.lvl * 0.5) * g, range: 4, speed: 9 });
      this.genMult = g;
    }
    // the Hollow
    const kinds = this.fort ? ['grunt', 'grunt', 'bowman', 'bowman', 'brute', 'acolyte'] : ['grunt', 'grunt', 'grunt', 'hound', 'bowman', 'brute'];
    // In a fort the walls stand for its defence bonus, so the troops inside are that much weaker.
    const Qu = this.fort ? Q / 1.35 : Q;
    const count = clamp(Math.round(Qu / 16), 6, 18), list = [];
    for (let i = 0; i < count; i++) list.push(kinds[Math.floor(this.rng() * kinds.length)]);
    const shares = list.reduce((t, k) => t + ET[k].share, 0);
    list.forEach((k, i) => {
      const d = ET[k], pw = Qu / shares * d.share;
      let x = 10 + this.rng() * (FW - 20), y = this.fort ? 14 + this.rng() * 16 : 14 + this.rng() * 26;
      if (this.fort && d.ranged) y = WALL_Y - 2;
      this.add({ side: 'e', sp: d.sp, name: 'Hollow', x, y, hp: 40 + pw * 9, dps: pw * 0.8, range: d.range, speed: d.speed, ranged: d.ranged, heal: d.heal, large: d.large, onWall: this.fort && d.ranged });
    });
    if (o.boss) this.add({ side: 'e', sp: o.boss.sprite, name: o.boss.name, x: FLAG.x, y: this.fort ? 18 : 22, hp: (300 + Q * 6) * (o.boss.mult || 1), dps: Q * 0.18 * (o.boss.mult || 1), range: 5, speed: 6, large: true, boss: true });
    // walls: segments, the gate weaker
    this.walls = [];
    if (this.fort) for (let x = 0; x < FW; x += 16) {
      const gate = x === GATE[0] - 8 || (x <= GATE[0] && x + 16 >= GATE[1]);
      const isGate = x + 8 >= GATE[0] && x + 8 <= GATE[1];
      this.walls.push({ x0: x, x1: x + 16, hp: (isGate ? 0.6 : 1) * (150 + Q * 1.2), max: (isGate ? 0.6 : 1) * (150 + Q * 1.2), gate: isGate });
    }
  }
  add(u) { u.id = this.units.length + 1; u.max = u.hp; u.cd = this.rng(); u.face = u.side === 'p' ? -1 : 1; this.units.push(u); return u; }
  alive(side) { return this.units.filter(u => u.hp > 0 && (!side || u.side === side)); }
  wallAt(x) { return this.walls.find(w => x >= w.x0 && x < w.x1); }
  passable(x) { const w = this.wallAt(x); return !w || w.hp <= 0; }
  order(ids, x, y) {
    const tgt = this.alive('e').find(e => Math.hypot(e.x - x, e.y - y) < 5);
    const us = this.units.filter(u => ids.includes(u.id) && u.hp > 0);
    us.forEach((u, i) => {
      if (tgt) { u.focus = tgt; u.dest = null; }
      else { const a = i * 2.4; u.dest = { x: clamp(x + Math.cos(a) * Math.sqrt(i) * 3, 2, FW - 2), y: clamp(y + Math.sin(a) * Math.sqrt(i) * 3, 2, FH - 2) }; u.focus = null; }
    });
    return tgt;
  }
  useRally() { if (this.rallyCd > 0 || !this.genMult) return false; this.rally = 8; this.rallyCd = 30; this.fx.push({ k: 'rally' }); return true; }
  step(dt) {
    if (this.over) return;
    this.t += dt; this.rally = Math.max(0, this.rally - dt); this.rallyCd = Math.max(0, this.rallyCd - dt);
    for (const u of this.units) if (u.hp > 0) this.unitStep(u, dt);
    // a little room between friends
    const live = this.alive();
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j], d = dist(a, b), min = (a.large || b.large) ? 4 : 2.6;
      if (d > 0 && d < min && a.side === b.side) { const px = (a.x - b.x) / d * (min - d) / 2, py = (a.y - b.y) / d * (min - d) / 2; a.x += px; a.y += py; b.x -= px; b.y -= py; }
    }
    for (const u of live) { u.x = clamp(u.x, 1, FW - 1); u.y = clamp(u.y, 1, FH - 1); this.keepOut(u); }
    // the banner
    if (this.fort) {
      const mine = this.alive('p').some(u => dist(u, FLAG) < 7), theirs = this.alive('e').some(u => dist(u, FLAG) < 12);
      this.flagT = mine && !theirs ? this.flagT + dt : Math.max(0, this.flagT - dt * 2);
      if (this.flagT >= 5) { this.over = true; this.won = true; this.fx.push({ k: 'flag' }); }
    }
    if (!this.alive('e').length) { this.over = true; this.won = true; }
    if (!this.alive('p').length) { this.over = true; this.won = false; }
  }
  // Walls stop anyone going through standing segments. The bowmen on top stay up there.
  keepOut(u) {
    if (!this.fort || u.onWall) return;
    const near = Math.abs(u.y - WALL_Y) < 2.2;
    if (near && !this.passable(u.x)) u.y = u.side === 'p' ? Math.max(u.y, WALL_Y + 2.2) : Math.min(u.y, WALL_Y - 2.2);
  }
  unitStep(u, dt) {
    const foes = this.alive(u.side === 'p' ? 'e' : 'p');
    u.cd -= dt;
    if (u.heal) {
      const hurt = this.alive(u.side).filter(f => f !== u && f.hp < f.max * 0.9).sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
      if (hurt && dist(u, hurt) <= u.range) { if (u.cd <= 0) { hurt.hp = Math.min(hurt.max, hurt.hp + u.max * 0.12); u.cd = 1.5; this.fx.push({ k: 'heal', x: hurt.x, y: hurt.y }); } return; }
      if (hurt && !u.dest) { this.move(u, hurt.x, hurt.y + (u.side === 'p' ? 6 : -6), dt); return; }
    }
    if (u.dest) {
      if (this.move(u, u.dest.x, u.dest.y, dt)) u.dest = null;
      else { const near = foes.find(f => dist(f, u) <= u.range && u.ranged); if (near && u.cd <= 0) this.strike(u, near); return; }
    }
    let t = u.focus && u.focus.hp > 0 ? u.focus : null;
    if (!t) {
      const aggro = u.side === 'p' ? 45 : (this.fort && !u.onWall && !this.breached() ? 0 : 90);
      t = foes.filter(f => dist(f, u) < aggro || u.onWall).sort((a, b) => dist(a, u) - dist(b, u))[0];
      if (u.onWall) t = foes.filter(f => dist(f, u) <= u.range).sort((a, b) => dist(a, u) - dist(b, u))[0];
    }
    if (!t) {
      // nothing in reach: your side storms the wall in front (or makes for the banner once through), the Hollow hold their ground
      if (u.side === 'p' && this.fort && u.ranged && !u.heal && u.y > WALL_Y + 24) { this.move(u, u.x, WALL_Y + 22, dt); return; }
      if (u.side === 'p' && this.fort && !u.ranged) {
        if (this.passable(u.x) || u.y < WALL_Y) { this.move(u, FLAG.x, FLAG.y + 2, dt); return; }
        const w = this.targetWall(u); if (w) this.hitWall(u, w, dt);
      }
      // the Hollow keep together and come on as one line, not one at a time
      if (u.side === 'e' && !this.fort && !u.onWall) { const front = Math.max(...this.alive('e').map(e => e.y)); if (u.y < front - 6) this.move(u, u.x, front, dt); }
      return;
    }
    u.face = t.x > u.x ? 1 : -1;
    if (dist(t, u) <= u.range + (t.large ? 1.5 : 0) + (t.onWall ? 3 : 0)) { if (u.cd <= 0) this.strike(u, t); return; }
    if (u.onWall) return;
    // a wall in the way: hit it
    if (this.fort && u.side === 'p' && t.y < WALL_Y && u.y > WALL_Y && !this.passable(u.x)) {
      const open = this.walls.filter(w => w.hp <= 0).sort((a, b) => Math.abs((a.x0 + a.x1) / 2 - u.x) - Math.abs((b.x0 + b.x1) / 2 - u.x))[0];
      if (open && Math.abs((open.x0 + open.x1) / 2 - u.x) < 50) { this.move(u, (open.x0 + open.x1) / 2, WALL_Y - 3, dt); return; }
      if (u.ranged) return;
      const w = this.targetWall(u); if (w) { this.hitWall(u, w, dt); return; }
    }
    if (u.side === 'e' && !this.fort && dist(t, u) > 25) { const slow = Math.min(u.speed, 6); const sp = u.speed; u.speed = slow; this.move(u, t.x, t.y, dt); u.speed = sp; return; }
    this.move(u, t.x, t.y, dt);
  }
  breached() { return this.walls.some(w => w.hp <= 0); }
  targetWall(u) { const w = this.wallAt(u.x); if (!w || w.hp <= 0) return null; if (u.y > WALL_Y + 4) { this.move(u, u.x, WALL_Y + 2.2, 1 / 30); return null; } return w; }
  hitWall(u, w, dt) {
    if (u.cd > 0) return;
    u.cd = 1;
    w.hp -= u.dps * (w.gate ? 1.6 : 1) * (this.rally ? 1.4 : 1);
    this.fx.push({ k: 'wallhit', x: u.x, y: WALL_Y });
    if (w.hp <= 0) { w.hp = 0; this.fx.push({ k: 'breach', x: (w.x0 + w.x1) / 2, gate: w.gate }); }
  }
  strike(u, t) {
    u.cd = 1;
    let n = u.dps * (0.85 + this.rng() * 0.3);
    if (u.side === 'p' && this.rally) n *= 1.4;
    if (u.vsLarge && t.large) n *= u.vsLarge;
    if (u.charge && !u.charged) { n *= u.charge; u.charged = true; }
    t.hp -= n;
    this.fx.push({ k: u.ranged ? 'arrow' : 'hit', x: t.x, y: t.y, fx: u.x, fy: u.y, side: u.side, big: n > t.max * 0.2 });
    if (t.hp <= 0) { t.hp = 0; this.fx.push({ k: 'die', x: t.x, y: t.y, side: t.side, boss: t.boss }); }
  }
  move(u, x, y, dt) {
    const dx = x - u.x, dy = y - u.y, d = Math.hypot(dx, dy);
    if (d < 0.6) return true;
    const v = u.speed * dt * (this.rally && u.side === 'p' ? 1.15 : 1);
    u.x += dx / d * Math.min(v, d); u.y += dy / d * Math.min(v, d);
    u.face = dx > 0 ? 1 : -1;
    return false;
  }
  // Which squads went down, for the war's books.
  outcome() {
    return { won: this.won, dead: this.units.filter(u => u.side === 'p' && u.sid && u.hp <= 0).map(u => u.sid), heroDown: this.units.some(u => u.hero && u.hp <= 0), Q: this.Q };
  }
}

// ---------- the screen ----------
function runField(S, army, Q, o, done) {
  const SUI = root.SIEGEUI, D = root.DATA, AUD = root.AUDIO || { play() {}, sfx() {} };
  const f = new Field(S, army, Q, o);
  const el = document.createElement('div');
  el.id = 'siege';
  el.innerHTML = `<div class="sg-top"><div><b class="serif">${o.title || army.name}</b> <span class="muted small" id="fbsub">${f.fort ? 'Break the wall, take their banner' : 'Break their line'}</span></div>
      <button class="sm" id="fbspeed">1x</button><button class="sm" id="fbquit">Retreat</button></div>
    <div class="sg-stage" id="fbstage"><canvas id="fbc"></canvas><div class="sg-banner" id="fbban"></div><div class="sg-hint" id="fbhint" style="display:block"></div></div>
    <div class="sg-bottom"><div class="sg-sel" id="fbsel"></div><button class="primary big" id="fbrally" style="display:${f.genMult ? 'block' : 'none'}">Rally (+40% for 8s)</button></div>`;
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
  AUD.play('battle');
  const stage = el.querySelector('#fbstage'), canvas = el.querySelector('#fbc'), ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let cw = 0, ch = 0, boxMode = false, speed = 1, last = performance.now(), acc = 0, raf = 0, ended = false;
  const P = new SUI.Particles();
  const cam = SUI.Camera(canvas, {
    bounds: [0, 0, FW, FH],
    start: (w, h) => ({ cx: FW / 2, cy: FH, s: Math.max(w / 110, h / 140) }),
    box: () => boxMode,
    boxEnd: (a, b) => { f.selected = f.alive('p').filter(u => u.x >= a.x - 1 && u.x <= b.x + 1 && u.y >= a.y - 1 && u.y <= b.y + 3).map(u => u.id); boxMode = false; ui(); },
    tap: w => {
      const mine = f.alive('p').filter(u => Math.hypot(u.x - w.x, u.y - 2 - w.y) < Math.max(3.5, 16 / cam.s)).sort((a, b) => dist(a, w) - dist(b, w))[0];
      if (mine) { f.selected = [mine.id]; ui(); return; }
      if (!f.selected.length) { banner('Tap one of your squads first, or use Everyone.'); return; }
      const t = f.order(f.selected, w.x, w.y);
      P.add({ x: w.x, y: w.y, ring: 3, life: 0.4, col: t ? '#e0574a' : '#7ad8ff', glow: true });
    },
  });
  SUI.zoomButtons(stage, cam);
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h || (w === cw && h === ch)) return;
    cw = w; ch = h; canvas.width = cw * dpr; canvas.height = ch * dpr; canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false; cam.resize(cw, ch);
  }
  layout();
  const ro = window.ResizeObserver ? new ResizeObserver(layout) : null; if (ro) ro.observe(stage);
  const banner = t => { const b = el.querySelector('#fbban'); b.className = 'sg-banner show'; b.textContent = t; clearTimeout(banner.t); banner.t = setTimeout(() => { b.className = 'sg-banner'; }, 1800); };
  function ui() {
    const n = f.selected.filter(id => f.units[id - 1] && f.units[id - 1].hp > 0).length;
    el.querySelector('#fbsel').style.display = 'flex';
    el.querySelector('#fbsel').innerHTML = `<b>${n ? n + ' selected' : 'Nobody selected'}</b><button class="sm ${boxMode ? 'on' : ''}" data-f="box">▭ Box</button><button class="sm" data-f="all">Everyone</button>${n ? '<button class="sm" data-f="none">✕</button>' : ''}`;
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { const k = b.dataset.f; if (k === 'box') boxMode = !boxMode; else if (k === 'all') f.selected = f.alive('p').map(u => u.id); else f.selected = []; ui(); });
    el.querySelector('#fbhint').innerHTML = n ? 'Tap the ground to move them, or a Hollow to attack it.' : f.fort ? 'Tap a squad (or Everyone), then tap the wall to batter it. The gate breaks fastest. Then take their banner at the top.' : 'Tap a squad (or Everyone), then tap a Hollow to attack it. Drag to look around.';
    el.querySelector('#fbrally').disabled = f.rallyCd > 0;
    el.querySelector('#fbrally').textContent = f.rallyCd > 0 ? `Rally in ${Math.ceil(f.rallyCd)}s` : `Rally (+40% for 8s)`;
  }
  el.querySelector('#fbrally').onclick = () => { if (f.useRally()) { AUD.sfx('surge'); banner('Rally! Your soldiers surge forward'); } };
  el.querySelector('#fbspeed').onclick = e => { speed = speed === 1 ? 2 : 1; e.target.textContent = speed + 'x'; };
  el.querySelector('#fbquit').onclick = () => { f.over = true; f.won = false; f.retreat = true; finish(); };
  const X = (V, x) => (x - V.x0) * V.s, Y = (V, y) => (y - V.y0) * V.s;
  function draw(t) {
    const V = cam.V;
    ctx.fillStyle = '#08090f'; ctx.fillRect(0, 0, cw, ch);
    const g = ctx.createLinearGradient(0, Y(V, 0), 0, Y(V, FH));
    g.addColorStop(0, f.fort ? '#2a2a32' : '#26402a'); g.addColorStop(1, '#3a5a34');
    ctx.fillStyle = g; ctx.fillRect(X(V, 0), Y(V, 0), FW * V.s, FH * V.s);
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    for (let i = 0; i < 160; i++) { const x = (i * 37) % FW, y = (i * 53) % FH; ctx.fillRect(X(V, x), Y(V, y), V.s * 0.8, V.s * 0.5); }
    if (f.fort) {
      ctx.fillStyle = '#4a4550'; ctx.fillRect(X(V, 0), Y(V, 0), FW * V.s, (WALL_Y - 3) * V.s);
      for (const w of f.walls) {
        if (w.hp <= 0) { ctx.fillStyle = '#3a3640'; for (let k = 0; k < 6; k++) ctx.fillRect(X(V, w.x0 + k * 2.6), Y(V, WALL_Y - 1 + (k % 2)), V.s * 2, V.s * 1.2); continue; }
        ctx.fillStyle = w.gate ? '#5a3a22' : '#7a7680'; ctx.fillRect(X(V, w.x0), Y(V, WALL_Y - 3), 16 * V.s, 4 * V.s);
        ctx.fillStyle = w.gate ? '#3a2616' : '#9a96a0'; for (let k = 0; k < 4; k++) ctx.fillRect(X(V, w.x0 + 1 + k * 4), Y(V, WALL_Y - 4.4), V.s * 2, V.s * 1.4);
        if (w.hp < w.max) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(X(V, w.x0 + 2), Y(V, WALL_Y + 1.6), 12 * V.s, V.s * 0.7); ctx.fillStyle = '#e0574a'; ctx.fillRect(X(V, w.x0 + 2), Y(V, WALL_Y + 1.6), 12 * V.s * w.hp / w.max, V.s * 0.7); }
      }
      ctx.fillStyle = '#3a2616'; ctx.fillRect(X(V, FLAG.x - 0.3), Y(V, FLAG.y - 8), V.s * 0.6, V.s * 8);
      ctx.fillStyle = f.flagT > 0 ? '#d4a630' : '#7a3ab8'; ctx.fillRect(X(V, FLAG.x), Y(V, FLAG.y - 8), V.s * 5, V.s * 3.4);
      if (f.flagT > 0) { ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X(V, FLAG.x), Y(V, FLAG.y), V.s * 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f.flagT / 5); ctx.stroke(); }
    }
    const unit = V.s * 0.34;
    for (const u of f.units.filter(u => u.hp > 0).sort((a, b) => a.y - b.y)) {
      const sx = X(V, u.x), sy = Y(V, u.y);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(sx, sy, V.s * (u.large ? 2.6 : 1.4), V.s * 0.5, 0, 0, 7); ctx.fill();
      if (f.selected.includes(u.id)) { ctx.strokeStyle = '#7ad8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(sx, sy, V.s * 2, V.s * 0.8, 0, 0, 7); ctx.stroke(); }
      if (u.hero) { ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(sx, sy, V.s * 1.8, V.s * 0.7, 0, 0, 7); ctx.stroke(); }
      const h = SUI.drawSprite(ctx, u.sp, sx, sy - (u.dest ? Math.abs(Math.sin(t * 12 + u.id)) * V.s * 0.5 : 0), unit * (u.large || u.boss ? 1.3 : u.hero ? 1.15 : 1), u.face);
      const bw = V.s * (u.large ? 7 : 4.5);
      ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(sx - bw / 2 - 1, sy - h - V.s - 1, bw + 2, Math.max(3, V.s * 0.55) + 2);
      ctx.fillStyle = u.side === 'e' ? '#e0574a' : u.hero ? '#ffd76a' : '#6ad07a'; ctx.fillRect(sx - bw / 2, sy - h - V.s, bw * u.hp / u.max, Math.max(3, V.s * 0.55));
      if (u.boss) { ctx.font = `bold ${Math.round(V.s * 2)}px system-ui`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffb0a0'; ctx.fillText(u.name, sx, sy - h - V.s * 2); }
    }
    P.draw(ctx, V, false); ctx.globalCompositeOperation = 'lighter'; P.draw(ctx, V, true); ctx.globalCompositeOperation = 'source-over';
    if (f.rally) { ctx.fillStyle = 'rgba(255,200,90,.08)'; ctx.fillRect(0, 0, cw, ch); }
    if (cam.box) { const b = cam.box; ctx.strokeStyle = '#7ad8ff'; ctx.setLineDash([5, 4]); ctx.strokeRect(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1), Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0)); ctx.setLineDash([]); }
  }
  function handleFx() {
    for (const e of f.fx) {
      if (e.k === 'hit') { P.burst(e.x, e.y - 2, e.big ? 8 : 3, { col: e.side === 'p' ? ['#fff', '#ffd0a0'] : ['#b8a0ff', '#e8e0ff'], speed: 10, life: 0.3, size: 0.6, glow: true }); if (e.big) AUD.sfx('hit'); }
      else if (e.k === 'arrow') P.add({ x: e.x, y: e.y - 2, life: 0.15, line: [(e.fx - e.x) * 0.12, (e.fy - e.y) * 0.12], col: e.side === 'p' ? '#d8c8a0' : '#6a5a8a', lw: 1.5 });
      else if (e.k === 'die') { P.burst(e.x, e.y - 2, e.boss ? 40 : 12, { col: e.side === 'e' ? ['#2a1e3a', '#4a3a6a', '#b03aff'] : ['#8a7a62', '#6a5a48'], speed: 7, up: 3, life: 0.9, size: 1.2 }); if (e.boss) banner('Their leader falls!'); }
      else if (e.k === 'heal') P.burst(e.x, e.y - 3, 4, { col: '#7aff9a', speed: 3, up: 5, life: 0.6, size: 0.5, glow: true });
      else if (e.k === 'wallhit') P.burst(e.x, e.y, 3, { col: ['#9a96a0', '#5a3a22'], speed: 8, life: 0.4, size: 0.6, grav: 25 });
      else if (e.k === 'breach') { AUD.sfx('gate'); P.burst(e.x, WALL_Y, 40, { col: ['#9a96a0', '#7a7680', '#5a3a22'], speed: 18, up: 6, life: 1, size: 1.2, grav: 25 }); banner(e.gate ? 'The gate is down!' : 'The wall is breached!'); }
      else if (e.k === 'flag') banner('Their banner is yours!');
    }
    f.fx = [];
  }
  function frame(now) {
    if (ended) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    acc += dt * speed;
    let n = 0; while (acc >= 1 / 30 && n++ < 6) { f.step(1 / 30); acc -= 1 / 30; }
    P.step(dt * speed); handleFx(); draw(now / 1000);
    if (Math.floor(now / 250) !== frame.k) { frame.k = Math.floor(now / 250); ui(); }
    if (f.over) { setTimeout(finish, 900); ended = true; return; }
    raf = requestAnimationFrame(frame);
  }
  function finish() {
    if (finish.done) return; finish.done = true;
    ended = true; cancelAnimationFrame(raf); if (ro) ro.disconnect(); el.remove(); document.body.style.overflow = ''; AUD.play(null);
    AUD.sfx(f.won ? 'victory' : 'defeat');
    done(Object.assign(f.outcome(), { retreat: !!f.retreat }));
  }
  ui();
  raf = requestAnimationFrame(frame);
  return f;
}

root.FIELD = { Field, runField, FW, FH };
if (typeof module !== 'undefined' && module.exports) module.exports = root.FIELD;
})(typeof window !== 'undefined' ? window : globalThis);
