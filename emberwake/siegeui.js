// Emberwake: drawing the keep and running the siege screen. Rules live in siege.js.
(function (root) {
'use strict';
const SG = root.SIEGE, SP = root.SPRITES, E = root.ENGINE, D = root.DATA;
const G = SG.GEO;
const RIGHT_SHAPES = ['wolf', 'rat', 'boar', 'crow', 'ram'];

// ---------- small helpers ----------
function seeded(seed) {
  let h = seed >>> 0 || 1;
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
const view = (x0, y0, w, h, cw, ch) => {
  const s = Math.min(cw / w, ch / h);
  return { x0, y0, w, h, s, ox: (cw - w * s) / 2, oy: (ch - h * s) / 2 };
};
const X = (V, x) => V.ox + (x - V.x0) * V.s;
const Y = (V, y) => V.oy + (y - V.y0) * V.s;
function rect(ctx, V, x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(X(V, x), Y(V, y), w * V.s, h * V.s); }

const whiteCache = {};
function whiteOf(id) {
  if (whiteCache[id]) return whiteCache[id];
  const sc = SP.spriteCanvas(id, 1), c = document.createElement('canvas');
  c.width = sc.w; c.height = sc.h;
  const g = c.getContext('2d');
  g.drawImage(sc.canvas, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#fff'; g.fillRect(0, 0, sc.w, sc.h);
  return (whiteCache[id] = c);
}
function nativeRight(id) { const v = SP.variant(id); return RIGHT_SHAPES.includes(v.shape) !== !!v.flip; }
// Draws a sprite with its feet at (sx, sy) on screen, `unit` screen pixels per sprite pixel.
function drawSprite(ctx, id, sx, sy, unit, face, flash, alpha) {
  const sc = SP.spriteCanvas(id, 1);
  const k = unit * sc.scale, w = sc.w * k, h = sc.h * k;
  const flip = face != null && ((face === 1) !== nativeRight(id));
  ctx.save();
  if (alpha != null) ctx.globalAlpha = alpha;
  ctx.translate(Math.round(sx), Math.round(sy));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(sc.canvas, Math.round(-w / 2), Math.round(-h), Math.round(w), Math.round(h));
  if (flash > 0) { ctx.globalAlpha = Math.min(1, flash) * (alpha == null ? 1 : alpha); ctx.drawImage(whiteOf(id), Math.round(-w / 2), Math.round(-h), Math.round(w), Math.round(h)); }
  ctx.restore();
  return h;
}

// ---------- the static scene: ground, wall, keep and buildings ----------
// The yard, hall and buildings are drawn in the old 100 wide layout through a view shifted by (OX, OY).
const shifted = V => Object.assign({}, V, { ox: V.ox + G.OX * V.s, oy: V.oy + G.OY * V.s });
// Cottages for the survivors on either side of the hall. More go up as more nights are held.
const COTTAGES = [[14, 168], [160, 168], [28, 176], [146, 176], [10, 186], [164, 186], [26, 192], [148, 192], [40, 188], [134, 188], [18, 178], [156, 178]];
const cottageCount = S => S.areas && S.areas.millroad && S.areas.millroad.cleared ? Math.min(COTTAGES.length, 2 + ((S.siege && S.siege.best) || 0)) : 0;
function drawScene(ctx, V, S, opt) {
  const night = !!opt.night, wl = S.buildings.walls || 0, W = G.W, H = G.H, GX = G.GX;
  const r = seeded(4242);
  // Field
  let g = ctx.createLinearGradient(0, Y(V, 0), 0, Y(V, G.WALL_Y));
  g.addColorStop(0, night ? '#14241a' : '#4d7a3c'); g.addColorStop(1, night ? '#243c22' : '#6b9a4a');
  ctx.fillStyle = g; ctx.fillRect(X(V, 0), Y(V, 0), W * V.s, G.WALL_Y * V.s);
  for (let i = 0; i < 2600; i++) {
    const x = r() * W, y = r() * G.WALL_Y;
    ctx.fillStyle = r() < 0.5 ? (night ? 'rgba(10,20,10,.5)' : 'rgba(40,70,30,.45)') : (night ? 'rgba(60,90,50,.35)' : 'rgba(150,190,100,.35)');
    ctx.fillRect(X(V, x), Y(V, y), Math.max(1, V.s * 0.5), Math.max(1, V.s * (0.5 + r())));
  }
  // Road to the gate
  ctx.fillStyle = night ? '#3a3024' : '#9a8460';
  ctx.beginPath(); ctx.moveTo(X(V, GX - 4), Y(V, 0)); ctx.lineTo(X(V, GX + 4), Y(V, 0)); ctx.lineTo(X(V, GX + 9), Y(V, G.WALL_Y)); ctx.lineTo(X(V, GX - 9), Y(V, G.WALL_Y)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = night ? 'rgba(0,0,0,.3)' : 'rgba(80,60,40,.35)'; ctx.lineWidth = Math.max(1, V.s * 0.4);
  for (const off of [-2.5, 2.5]) { ctx.beginPath(); ctx.moveTo(X(V, GX + off * 0.8), Y(V, 0)); ctx.lineTo(X(V, GX + off * 1.6), Y(V, G.WALL_Y)); ctx.stroke(); }
  // Rocks
  for (let i = 0; i < 46; i++) {
    const x = r() * W, y = 30 + r() * (G.WALL_Y - 40);
    if (Math.abs(x - GX) < 12) continue;
    ctx.fillStyle = night ? '#3a3f44' : '#8a8f94';
    ctx.beginPath(); ctx.ellipse(X(V, x), Y(V, y), V.s * (0.8 + r()), V.s * (0.5 + r() * 0.5), 0, 0, Math.PI * 2); ctx.fill();
  }
  // Pines framing the field and the far wood
  const trees = [];
  for (let i = 0; i < 70; i++) {
    const side = r() < 0.5, x = side ? r() * 9 : W - 9 + r() * 9, y = 2 + r() * (G.WALL_Y - 14);
    trees.push([x, y, 3 + r() * 3]);
  }
  for (let i = 0; i < 60; i++) { const x = r() * W; if (Math.abs(x - GX) > 7) trees.push([x, -2 + r() * 16, 3 + r() * 3]); }
  trees.sort((a, b) => a[1] - b[1]);
  for (const [x, y, h] of trees) pine(ctx, V, x, y, h, night);
  // Yard
  g = ctx.createLinearGradient(0, Y(V, G.YARD_Y), 0, Y(V, H));
  g.addColorStop(0, night ? '#2e2a26' : '#8a7a62'); g.addColorStop(1, night ? '#24201c' : '#76684f');
  ctx.fillStyle = g; ctx.fillRect(X(V, 0), Y(V, G.WALL_Y), W * V.s, (H - G.WALL_Y) * V.s);
  for (let i = 0; i < 700; i++) {
    const x = r() * W, y = G.YARD_Y + r() * (H - G.YARD_Y);
    ctx.fillStyle = night ? 'rgba(0,0,0,.25)' : 'rgba(60,50,35,.3)';
    ctx.fillRect(X(V, x), Y(V, y), V.s * (0.6 + r() * 1.2), V.s * 0.5);
  }
  // Vegetable plots at the far corners
  for (const x0 of [4, W - 36]) for (let k = 0; k < 5; k++) {
    rect(ctx, V, x0, 194 + k * 1.2 - 4, 32, 0.6, night ? '#2a3a20' : '#5a7a3a');
  }
  // Cottages
  for (const [x, y] of COTTAGES.slice(0, cottageCount(S))) cottage(ctx, V, x, y, night || opt.lit);
  // Path from gate to keep
  const VS = shifted(V);
  ctx.fillStyle = night ? '#38332c' : '#a8977a';
  ctx.fillRect(X(VS, 45), Y(VS, G.YARD_Y - G.OY), 10 * V.s, (134 - (G.YARD_Y - G.OY)) * V.s);
  buildings(ctx, VS, S, night, opt);
  keepHall(ctx, VS, S, night, opt);
  wall(ctx, V, S, night, wl, opt);
}
function cottage(ctx, V, x, y, lit) {
  rect(ctx, V, x - 4, y - 4, 8, 4.5, '#6a5038');
  rect(ctx, V, x - 4, y - 4, 8, 0.8, '#7a5e44');
  ctx.fillStyle = '#8a6a3a';
  ctx.beginPath(); ctx.moveTo(X(V, x - 5), Y(V, y - 3.6)); ctx.lineTo(X(V, x), Y(V, y - 7.5)); ctx.lineTo(X(V, x + 5), Y(V, y - 3.6)); ctx.closePath(); ctx.fill();
  rect(ctx, V, x - 0.8, y - 2.4, 1.6, 2.9, '#2a1a0e');
  rect(ctx, V, x + 1.8, y - 3, 1.4, 1.2, lit ? '#ffcf6a' : '#2a2a30');
  rect(ctx, V, x - 3.2, y - 3, 1.4, 1.2, lit ? '#ffcf6a' : '#2a2a30');
}
function pine(ctx, V, x, y, h, night) {
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(X(V, x), Y(V, y + 0.4), V.s * h * 0.35, V.s * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = night ? '#2a1c12' : '#5a3a22';
  ctx.fillRect(X(V, x - 0.3), Y(V, y - 1), V.s * 0.6, V.s * 1.2);
  const cols = night ? ['#0e1c14', '#132418', '#18301e'] : ['#1f4a2a', '#2a5e34', '#357040'];
  for (let k = 0; k < 3; k++) {
    const w = h * (0.55 - k * 0.12), top = y - 1 - h * (0.45 + k * 0.28), base = y - 0.8 - h * k * 0.22;
    ctx.fillStyle = cols[k];
    ctx.beginPath(); ctx.moveTo(X(V, x), Y(V, top)); ctx.lineTo(X(V, x + w), Y(V, base)); ctx.lineTo(X(V, x - w), Y(V, base)); ctx.closePath(); ctx.fill();
  }
}
function wall(ctx, V, S, night, wl, opt) {
  const y = G.WALL_Y, h = G.WALL_H;
  if (wl === 0) {
    // Wooden palisade
    rect(ctx, V, 0, y + 2.5, G.W, h - 2.5, night ? '#2a2016' : '#6a5038');
    for (let x = 0; x < G.W; x += 1.6) {
      if (x > G.GATE_X0 - 0.5 && x < G.GATE_X1) continue;
      rect(ctx, V, x, y, 1.3, h - 1.5, night ? '#4a3622' : '#8a6440');
      ctx.fillStyle = night ? '#5a4430' : '#a07a50';
      ctx.beginPath(); ctx.moveTo(X(V, x), Y(V, y)); ctx.lineTo(X(V, x + 0.65), Y(V, y - 1.2)); ctx.lineTo(X(V, x + 1.3), Y(V, y)); ctx.fill();
    }
  } else {
    rect(ctx, V, 0, y, G.W, h, night ? '#4a4a50' : '#9a9690');
    ctx.strokeStyle = night ? 'rgba(0,0,0,.35)' : 'rgba(60,55,50,.45)'; ctx.lineWidth = 1;
    for (let row = 0; row < 3; row++) {
      const yy = y + row * h / 3;
      ctx.beginPath(); ctx.moveTo(X(V, 0), Y(V, yy)); ctx.lineTo(X(V, G.W), Y(V, yy)); ctx.stroke();
      for (let x = (row % 2) * 2; x < G.W; x += 4) { ctx.beginPath(); ctx.moveTo(X(V, x), Y(V, yy)); ctx.lineTo(X(V, x), Y(V, yy + h / 3)); ctx.stroke(); }
    }
    rect(ctx, V, 0, y + h - 1.6, G.W, 1.6, night ? '#3a3a40' : '#7a7670');
    for (let x = 0; x < G.W; x += 3) {
      if (x > G.GATE_X0 - 2 && x < G.GATE_X1 + 1) continue;
      rect(ctx, V, x, y - 1.4, 1.8, 1.6, night ? '#55555c' : '#aaa69e');
    }
    for (const tx of G.TOWERS) {
      rect(ctx, V, tx - 4, y - 3, 8, h + 5, night ? '#505058' : '#a8a49c');
      for (let k = 0; k < 4; k++) rect(ctx, V, tx - 4 + k * 2.2, y - 4.4, 1.4, 1.6, night ? '#5c5c64' : '#b8b4ac');
      rect(ctx, V, tx - 2.5, y - 1, 5, 4, night ? '#3a3a40' : '#8a867e');
    }
  }
  // Wall slots
  if (opt && opt.slots) for (const sx of G.SLOTS) {
    ctx.fillStyle = night ? 'rgba(255,215,106,.18)' : 'rgba(255,215,106,.25)';
    ctx.beginPath(); ctx.arc(X(V, sx), Y(V, y + 2), V.s * 1.6, 0, Math.PI * 2); ctx.fill();
  }
}
function keepHall(ctx, V, S, night, opt) {
  const ruined = !(S.siege && S.siege.best >= 1);
  const stone = night ? '#55524e' : '#a8a196', dark = night ? '#3a3834' : '#7a756c';
  // corner towers
  for (const tx of [33, 67]) {
    rect(ctx, V, tx - 3, 129, 6, 21, dark);
    rect(ctx, V, tx - 3, 127.5, 6, 1.6, stone);
    for (let k = 0; k < 3; k++) rect(ctx, V, tx - 3 + k * 2.2, 126.2, 1.4, 1.4, stone);
  }
  rect(ctx, V, 36, 134, 28, 16, stone);
  ctx.strokeStyle = night ? 'rgba(0,0,0,.3)' : 'rgba(60,55,50,.35)'; ctx.lineWidth = 1;
  for (let yy = 136; yy < 150; yy += 2.4) { ctx.beginPath(); ctx.moveTo(X(V, 36), Y(V, yy)); ctx.lineTo(X(V, 64), Y(V, yy)); ctx.stroke(); }
  // roof
  ctx.fillStyle = night ? '#2a2c38' : '#4a5068';
  ctx.beginPath(); ctx.moveTo(X(V, 34), Y(V, 134.5)); ctx.lineTo(X(V, 38), Y(V, 129)); ctx.lineTo(X(V, 62), Y(V, 129)); ctx.lineTo(X(V, 66), Y(V, 134.5)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = night ? 'rgba(0,0,0,.4)' : 'rgba(30,30,50,.4)';
  for (let x = 38; x < 63; x += 2) { ctx.beginPath(); ctx.moveTo(X(V, x), Y(V, 129)); ctx.lineTo(X(V, x - 1.2), Y(V, 134.5)); ctx.stroke(); }
  if (ruined) {
    ctx.fillStyle = '#0c0a0a';
    ctx.beginPath(); ctx.moveTo(X(V, 52), Y(V, 129)); ctx.lineTo(X(V, 59), Y(V, 129)); ctx.lineTo(X(V, 57), Y(V, 132)); ctx.lineTo(X(V, 54), Y(V, 133)); ctx.closePath(); ctx.fill();
    rect(ctx, V, 41, 130, 2.5, 1.5, '#0c0a0a');
  }
  // door and windows
  rect(ctx, V, 47, 143, 6, 7, night ? '#3a2616' : '#5a3a22');
  ctx.fillStyle = night ? '#3a2616' : '#5a3a22';
  ctx.beginPath(); ctx.arc(X(V, 50), Y(V, 143), V.s * 3, Math.PI, 0); ctx.fill();
  for (const wx of [39.5, 44, 56, 60.5]) rect(ctx, V, wx - 0.9, 138, 1.8, 2.6, night || opt.lit ? '#ffcf6a' : '#2a2a30');
  // banner
  rect(ctx, V, 49.7, 129, 0.6, 5, '#3a2616');
  ctx.fillStyle = '#9a2a2a';
  ctx.beginPath(); ctx.moveTo(X(V, 47.5), Y(V, 130)); ctx.lineTo(X(V, 52.5), Y(V, 130)); ctx.lineTo(X(V, 52.5), Y(V, 136.5)); ctx.lineTo(X(V, 50), Y(V, 135)); ctx.lineTo(X(V, 47.5), Y(V, 136.5)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff9a3d';
  ctx.beginPath(); ctx.moveTo(X(V, 50), Y(V, 130.8)); ctx.quadraticCurveTo(X(V, 51.8), Y(V, 132.6), X(V, 50), Y(V, 134)); ctx.quadraticCurveTo(X(V, 48.2), Y(V, 132.6), X(V, 50), Y(V, 130.8)); ctx.fill();
}
function buildings(ctx, V, S, night) {
  const b = S.buildings || {};
  const wood = night ? '#3a2a1c' : '#7a5a3a', woodL = night ? '#4a3624' : '#9a7450', thatch = night ? '#4a3a20' : '#b08a4a';
  // Forge, always there: Bram's father's tools
  rect(ctx, V, 10, 113, 12, 8, night ? '#4a4844' : '#8a857c');
  rect(ctx, V, 9, 111.5, 14, 2, night ? '#2a2c38' : '#4a5068');
  rect(ctx, V, 18, 108.5, 2.6, 4, night ? '#3a3834' : '#6a655c');
  rect(ctx, V, 12, 117, 3.5, 3, '#ff7a2a');
  rect(ctx, V, 23, 118, 2.2, 1.4, '#2a2a30');
  rect(ctx, V, 23.6, 119.4, 1, 1.2, '#2a2a30');
  // Well
  ctx.fillStyle = night ? '#4a4844' : '#8a857c';
  ctx.beginPath(); ctx.ellipse(X(V, 60), Y(V, 121), V.s * 2, V.s * 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = night ? '#0a1420' : '#2a4a6a';
  ctx.beginPath(); ctx.ellipse(X(V, 60), Y(V, 121), V.s * 1.2, V.s * 0.7, 0, 0, Math.PI * 2); ctx.fill();
  if (S.shopTier >= 2) {
    rect(ctx, V, 29, 116, 8, 3, wood);
    for (let k = 0; k < 4; k++) rect(ctx, V, 28.5 + k * 2.25, 113, 2.25, 2.2, k % 2 ? '#e8e0d0' : '#b83a3a');
    rect(ctx, V, 29, 115.2, 0.5, 3.8, wood); rect(ctx, V, 36.5, 115.2, 0.5, 3.8, wood);
    for (let k = 0; k < 3; k++) rect(ctx, V, 30 + k * 2.4, 115.6, 1.4, 0.9, ['#5a9a4a', '#d4a630', '#7a5ab8'][k]);
  }
  if (b.yard) {
    ctx.strokeStyle = woodL; ctx.lineWidth = Math.max(1, V.s * 0.3);
    ctx.strokeRect(X(V, 70), Y(V, 112), 20 * V.s, 10 * V.s);
    for (const [dx, dy] of [[74, 117], [80, 115], [86, 118]]) {
      rect(ctx, V, dx - 0.3, dy - 3, 0.6, 3.6, wood);
      rect(ctx, V, dx - 1.5, dy - 2.4, 3, 0.6, thatch);
      ctx.fillStyle = thatch; ctx.beginPath(); ctx.arc(X(V, dx), Y(V, dy - 3.4), V.s * 0.9, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (b.kennels) {
    rect(ctx, V, 12, 125, 10, 6, wood);
    ctx.fillStyle = thatch;
    ctx.beginPath(); ctx.moveTo(X(V, 11), Y(V, 125.5)); ctx.lineTo(X(V, 17), Y(V, 121.5)); ctx.lineTo(X(V, 23), Y(V, 125.5)); ctx.closePath(); ctx.fill();
    rect(ctx, V, 15.5, 127.5, 3, 3.5, '#120c08');
  }
  if (b.barracks) {
    rect(ctx, V, 72, 125, 20, 7, wood);
    ctx.fillStyle = thatch;
    ctx.beginPath(); ctx.moveTo(X(V, 71), Y(V, 125.5)); ctx.lineTo(X(V, 74), Y(V, 121.5)); ctx.lineTo(X(V, 90), Y(V, 121.5)); ctx.lineTo(X(V, 93), Y(V, 125.5)); ctx.closePath(); ctx.fill();
    for (const dx of [76, 82, 88]) rect(ctx, V, dx, 127.5, 2, 2.5, '#120c08');
    rect(ctx, V, 92.5, 118, 0.5, 7, wood);
    ctx.fillStyle = '#2f4f8a'; ctx.beginPath(); ctx.moveTo(X(V, 93), Y(V, 118)); ctx.lineTo(X(V, 97), Y(V, 119.2)); ctx.lineTo(X(V, 93), Y(V, 120.4)); ctx.fill();
  }
}
function drawGate(ctx, V, gate, wl, night) {
  const x0 = G.GATE_X0, w = G.GATE_X1 - G.GATE_X0, y = G.WALL_Y, h = G.WALL_H;
  if (gate.broken) {
    ctx.fillStyle = night ? '#38332c' : '#a8977a';
    ctx.fillRect(X(V, x0), Y(V, y), w * V.s, h * V.s);
    const r = seeded(77);
    for (let i = 0; i < 9; i++) { ctx.save(); ctx.translate(X(V, x0 + r() * w), Y(V, y + r() * h)); ctx.rotate(r() * 3); ctx.fillStyle = '#5a3a22'; ctx.fillRect(-V.s, -V.s * 0.25, V.s * 2.2, V.s * 0.5); ctx.restore(); }
    return;
  }
  rect(ctx, V, x0, y, w, h, night ? '#4a3220' : '#7a5232');
  ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1;
  for (let x = x0; x <= x0 + w; x += 1.5) { ctx.beginPath(); ctx.moveTo(X(V, x), Y(V, y)); ctx.lineTo(X(V, x), Y(V, y + h)); ctx.stroke(); }
  rect(ctx, V, x0, y + 1.2, w, 0.7, '#2a2a30'); rect(ctx, V, x0, y + h - 2, w, 0.7, '#2a2a30');
  rect(ctx, V, G.GX - 0.2, y, 0.4, h, '#1a1010');
  if (wl >= 1) { rect(ctx, V, x0 - 1, y - 1.5, 1.4, h + 1.5, '#7a7670'); rect(ctx, V, x0 + w - 0.4, y - 1.5, 1.4, h + 1.5, '#7a7670'); }
  const dmg = 1 - gate.hp / gate.max, cracks = Math.floor(dmg * 7);
  const r = seeded(31);
  ctx.strokeStyle = '#120a06'; ctx.lineWidth = Math.max(1, V.s * 0.35);
  for (let i = 0; i < cracks; i++) {
    let cx = x0 + 1 + r() * (w - 2), cy = y + r() * h;
    ctx.beginPath(); ctx.moveTo(X(V, cx), Y(V, cy));
    for (let k = 0; k < 3; k++) { cx += (r() - 0.5) * 2.2; cy += (r() - 0.3) * 1.6; ctx.lineTo(X(V, cx), Y(V, cy)); }
    ctx.stroke();
  }
}
function drawLadder(ctx, V, l, night) {
  const x = l.x, y0 = G.WALL_Y - 4.5, y1 = G.WALL_Y + 1.5;
  ctx.strokeStyle = night ? '#6a4a2a' : '#8a6a3a'; ctx.lineWidth = Math.max(1.5, V.s * 0.45);
  ctx.beginPath(); ctx.moveTo(X(V, x - 1), Y(V, y0)); ctx.lineTo(X(V, x - 0.8), Y(V, y1)); ctx.moveTo(X(V, x + 1), Y(V, y0)); ctx.lineTo(X(V, x + 0.8), Y(V, y1)); ctx.stroke();
  ctx.lineWidth = Math.max(1, V.s * 0.3);
  for (let yy = y0 + 0.8; yy < y1; yy += 1.2) { ctx.beginPath(); ctx.moveTo(X(V, x - 1), Y(V, yy)); ctx.lineTo(X(V, x + 1), Y(V, yy)); ctx.stroke(); }
}

// ---------- particles ----------
class Particles {
  constructor() { this.list = []; }
  add(p) { if (this.list.length < 700) this.list.push(Object.assign({ vx: 0, vy: 0, life: 0.6, age: 0, size: 0.5, grav: 0, col: '#fff', glow: false, shrink: true }, p)); }
  burst(x, y, n, o) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (o.speed || 10) * (0.3 + Math.random());
      this.add(Object.assign({}, o, { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp + (o.up ? -o.up : 0), life: (o.life || 0.6) * (0.6 + Math.random() * 0.6), col: Array.isArray(o.col) ? o.col[Math.floor(Math.random() * o.col.length)] : o.col }));
    }
  }
  step(dt) {
    for (const p of this.list) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt; p.vx *= 0.96; }
    this.list = this.list.filter(p => p.age < p.life);
  }
  draw(ctx, V, glowPass) {
    for (const p of this.list) {
      if (!!p.glow !== glowPass) continue;
      const t = 1 - p.age / p.life, sz = p.size * (p.shrink ? t : 1) * V.s;
      ctx.globalAlpha = Math.min(1, t * 1.5);
      ctx.fillStyle = p.col;
      if (p.line) { ctx.strokeStyle = p.col; ctx.lineWidth = (p.lw || 2) * t; ctx.beginPath(); ctx.moveTo(X(V, p.x - p.line[0]), Y(V, p.y - p.line[1])); ctx.lineTo(X(V, p.x + p.line[0]), Y(V, p.y + p.line[1])); ctx.stroke(); continue; }
      if (p.ring) { ctx.strokeStyle = p.col; ctx.lineWidth = (p.lw || V.s * 0.5) * t; ctx.beginPath(); ctx.arc(X(V, p.x), Y(V, p.y), (1 - t) * p.ring * V.s, 0, Math.PI * 2); ctx.stroke(); continue; }
      if (p.text) { ctx.font = `bold ${Math.round(V.s * 2.6)}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(p.text, X(V, p.x), Y(V, p.y)); ctx.fillText(p.text, X(V, p.x), Y(V, p.y)); continue; }
      if (p.arrow) { ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = Math.max(1, V.s * 0.25); ctx.beginPath(); ctx.moveTo(X(V, p.x), Y(V, p.y)); ctx.lineTo(X(V, p.x - p.vx * 0.04), Y(V, p.y - p.vy * 0.04)); ctx.stroke(); continue; }
      ctx.fillRect(X(V, p.x) - sz / 2, Y(V, p.y) - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
  }
}

// ---------- castle pieces ----------
function drawPieces(ctx, V, pieces, opt) {
  opt = opt || {};
  const night = !!opt.night, t = opt.t || 0, C = G.CELL;
  for (const p of pieces) {
    const d = SG.PIECES[p.k], x = p.c * C, y = p.r * C, w = d.size * C;
    const full = p.max ? p.hp / p.max : 1, down = d.block && p.max && p.hp <= 0;
    if (down) {
      const r = seeded(p.c * 31 + p.r * 7);
      for (let i = 0; i < 6 * d.size; i++) rect(ctx, V, x + r() * w, y + r() * w, 0.8 + r(), 0.6 + r() * 0.6, night ? '#3a3a40' : '#8a867e');
      continue;
    }
    switch (p.k) {
      case 'wall': {
        rect(ctx, V, x + 0.2, y + 0.6, w - 0.4, w - 0.6, night ? '#4a4a52' : '#9a968e');
        rect(ctx, V, x + 0.2, y + 0.6, w - 0.4, 1, night ? '#5c5c64' : '#b8b4ac');
        for (let k = 0; k < 2; k++) rect(ctx, V, x + 0.4 + k * 2, y - 0.4, 1.2, 1.1, night ? '#5c5c64' : '#b8b4ac');
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X(V, x + 0.2), Y(V, y + 2.6)); ctx.lineTo(X(V, x + w - 0.2), Y(V, y + 2.6)); ctx.moveTo(X(V, x + 2), Y(V, y + 1.6)); ctx.lineTo(X(V, x + 2), Y(V, y + 2.6)); ctx.stroke();
        break;
      }
      case 'tower': {
        rect(ctx, V, x + 0.3, y + 0.8, w - 0.6, w - 0.8, night ? '#505058' : '#a8a49c');
        rect(ctx, V, x + 0.3, y + 0.8, w - 0.6, 1.4, night ? '#64646c' : '#c0bcb4');
        for (let k = 0; k < 4; k++) rect(ctx, V, x + 0.5 + k * 1.95, y - 0.3, 1.2, 1.3, night ? '#64646c' : '#c0bcb4');
        rect(ctx, V, x + 2.2, y + 4.5, 3.6, 3.5, night ? '#2a2a30' : '#6a665e');
        break;
      }
      case 'moat': {
        rect(ctx, V, x, y, w, w, night ? '#0e1a2c' : '#2a5a8a');
        ctx.strokeStyle = night ? 'rgba(120,160,220,.3)' : 'rgba(200,230,255,.45)'; ctx.lineWidth = 1;
        const o = (t * 1.5 + p.c) % 2;
        ctx.beginPath(); ctx.moveTo(X(V, x + 0.5), Y(V, y + 1.2 + o)); ctx.lineTo(X(V, x + 2), Y(V, y + 1.2 + o)); ctx.moveTo(X(V, x + 2.2), Y(V, y + 2.8 - o * 0.5)); ctx.lineTo(X(V, x + 3.5), Y(V, y + 2.8 - o * 0.5)); ctx.stroke();
        break;
      }
      case 'stakes': {
        ctx.strokeStyle = night ? '#6a4a2a' : '#8a6438'; ctx.lineWidth = Math.max(1.5, V.s * 0.35);
        for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) { const sx = x + 0.7 + k * 1.3, sy = y + 1.2 + j * 1.8; ctx.beginPath(); ctx.moveTo(X(V, sx), Y(V, sy + 1)); ctx.lineTo(X(V, sx + 0.6), Y(V, sy - 0.6)); ctx.stroke(); }
        break;
      }
      case 'pit':
        if (p.used) { ctx.fillStyle = '#0a0806'; ctx.beginPath(); ctx.ellipse(X(V, x + 2), Y(V, y + 2), V.s * 1.8, V.s * 1.3, 0, 0, 7); ctx.fill(); }
        else if (opt.build) { ctx.strokeStyle = 'rgba(255,215,106,.6)'; ctx.setLineDash([2, 2]); ctx.strokeRect(X(V, x + 0.4), Y(V, y + 0.4), (w - 0.8) * V.s, (w - 0.8) * V.s); ctx.setLineDash([]); rect(ctx, V, x + 0.8, y + 0.8, w - 1.6, w - 1.6, 'rgba(90,70,40,.5)'); }
        break;
      case 'pitch':
        rect(ctx, V, x + 0.1, y + 0.1, w - 0.2, w - 0.2, p.used && !p.lit ? '#1a1410' : '#120e0a');
        if (p.lit > 0) rect(ctx, V, x, y, w, w, `rgba(255,${100 + Math.random() * 80 | 0},30,${0.35 + Math.random() * 0.3})`);
        else if (!p.used) { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(X(V, x + 1), Y(V, y + 1), V.s * 0.8, V.s * 0.5); }
        break;
      case 'brazier':
        rect(ctx, V, x + 1.2, y + 2.2, 1.6, 1.6, '#4a4a52');
        ctx.fillStyle = '#ffb84a'; ctx.beginPath(); ctx.arc(X(V, x + 2), Y(V, y + 1.8 - Math.random() * 0.4), V.s * 0.9, 0, 7); ctx.fill();
        break;
      case 'mangonel': {
        rect(ctx, V, x + 1, y + 4, w - 2, 2.5, night ? '#4a3220' : '#7a5232');
        rect(ctx, V, x + 1.2, y + 6.4, 1.2, 1.2, '#2a1c10'); rect(ctx, V, x + w - 2.4, y + 6.4, 1.2, 1.2, '#2a1c10');
        const ang = p.cd > 4.4 ? -1.2 : -0.35;
        ctx.save(); ctx.translate(X(V, x + 4), Y(V, y + 4.5)); ctx.rotate(ang);
        ctx.fillStyle = night ? '#5a3a22' : '#8a6438'; ctx.fillRect(0, -V.s * 0.3, V.s * 4.5, V.s * 0.6);
        ctx.fillStyle = '#3a3a40'; ctx.beginPath(); ctx.arc(V.s * 4.5, 0, V.s * 0.8, 0, 7); ctx.fill();
        ctx.restore();
        break;
      }
    }
    if (d.block && p.max && full < 1) {
      ctx.strokeStyle = 'rgba(10,6,4,.8)'; ctx.lineWidth = Math.max(1, V.s * 0.3);
      const r = seeded(p.c * 13 + p.r);
      for (let i = 0; i < Math.floor((1 - full) * 4 * d.size); i++) { const cx = x + 0.5 + r() * (w - 1), cy = y + 1 + r() * (w - 1.5); ctx.beginPath(); ctx.moveTo(X(V, cx), Y(V, cy)); ctx.lineTo(X(V, cx + (r() - 0.5) * 2), Y(V, cy + r() * 1.5)); ctx.stroke(); }
    }
  }
}

// ---------- the camera: drag to pan, pinch or wheel to zoom ----------
const BG_S = 8; // the whole world is painted once at 8 pixels per unit, then the visible part is copied each frame
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
function worldCanvas(S, opt) {
  const c = document.createElement('canvas');
  c.width = G.W * BG_S; c.height = G.H * BG_S;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const V = { x0: 0, y0: 0, s: BG_S, ox: 0, oy: 0 };
  drawScene(g, V, S, opt);
  if (opt.gate) drawGate(g, V, { hp: 1, max: 1 }, S.buildings.walls || 0, !!opt.night);
  return c;
}
// Copies the visible part of the world. The source rectangle is kept inside the image (Safari draws nothing otherwise).
function blit(ctx, bg, V, cw, ch) {
  const k = V.s / BG_S;
  let sx = V.x0 * BG_S, sy = V.y0 * BG_S, sw = cw / k, sh = ch / k, dx = 0, dy = 0, dw = cw, dh = ch;
  if (sx < 0) { dx = -sx * k; dw -= dx; sw += sx; sx = 0; }
  if (sy < 0) { dy = -sy * k; dh -= dy; sh += sy; sy = 0; }
  if (sx + sw > bg.width) { const o = sx + sw - bg.width; sw -= o; dw -= o * k; }
  if (sy + sh > bg.height) { const o = sy + sh - bg.height; sh -= o; dh -= o * k; }
  if (sw <= 0 || sh <= 0) return;
  ctx.imageSmoothingEnabled = k < 1;
  ctx.drawImage(bg, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.imageSmoothingEnabled = false;
}
// o: bounds [x0, y0, x1, y1], start(cw, ch) -> { cx, cy, s }, tap(world, screen), box() -> bool, boxEnd(a, b)
function Camera(canvas, o) {
  const [bx0, by0, bx1, by1] = o.bounds;
  const cam = { cx: (bx0 + bx1) / 2, cy: (by0 + by1) / 2, s: 4, cw: 0, ch: 0, V: null, box: null };
  cam.minS = () => Math.min(cam.cw / (bx1 - bx0), cam.ch / (by1 - by0));
  cam.maxS = () => Math.max(cam.minS() * 1.5, cam.cw / 34);
  cam.fix = () => {
    cam.s = clampN(cam.s, cam.minS(), cam.maxS());
    const hw = cam.cw / 2 / cam.s, hh = cam.ch / 2 / cam.s;
    cam.cx = hw * 2 >= bx1 - bx0 ? (bx0 + bx1) / 2 : clampN(cam.cx, bx0 + hw, bx1 - hw);
    cam.cy = hh * 2 >= by1 - by0 ? (by0 + by1) / 2 : clampN(cam.cy, by0 + hh, by1 - hh);
    cam.V = { x0: cam.cx - hw, y0: cam.cy - hh, s: cam.s, ox: 0, oy: 0 };
  };
  cam.resize = (w, h) => { const first = !cam.cw; cam.cw = w; cam.ch = h; if (first) Object.assign(cam, o.start(w, h)); cam.fix(); };
  cam.toWorld = (sx, sy) => ({ x: cam.V.x0 + sx / cam.s, y: cam.V.y0 + sy / cam.s });
  cam.zoomAt = (f, sx, sy) => {
    const w = cam.toWorld(sx, sy);
    cam.s = clampN(cam.s * f, cam.minS(), cam.maxS());
    cam.cx = w.x - (sx - cam.cw / 2) / cam.s; cam.cy = w.y - (sy - cam.ch / 2) / cam.s;
    cam.fix();
  };
  cam.look = (x, y) => { cam.cx = x; cam.cy = y; cam.fix(); };
  const pts = new Map();
  let g = null;
  const local = ev => { const r = canvas.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
  canvas.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* not supported */ }
    const p = local(ev);
    pts.set(ev.pointerId, p);
    if (pts.size === 1) {
      g = { kind: o.box && o.box() ? 'box' : 'pan', sx: p.x, sy: p.y, cx: cam.cx, cy: cam.cy, moved: false };
      if (g.kind === 'box') cam.box = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      g = { kind: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: cam.s, w: cam.toWorld(mx, my) };
      cam.box = null;
    }
  });
  canvas.addEventListener('pointermove', ev => {
    if (!pts.has(ev.pointerId) || !g) return;
    const p = local(ev);
    pts.set(ev.pointerId, p);
    if (g.kind === 'pan' || g.kind === 'box') {
      const dx = p.x - g.sx, dy = p.y - g.sy;
      if (!g.moved && Math.hypot(dx, dy) > 9) g.moved = true;
      if (!g.moved) return;
      if (g.kind === 'pan') { cam.cx = g.cx - dx / cam.s; cam.cy = g.cy - dy / cam.s; cam.fix(); }
      else { cam.box.x1 = p.x; cam.box.y1 = p.y; }
    } else if (g.kind === 'pinch' && pts.size >= 2) {
      const [a, b] = [...pts.values()], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      cam.s = clampN(g.s * Math.hypot(a.x - b.x, a.y - b.y) / g.d, cam.minS(), cam.maxS());
      cam.cx = g.w.x - (mx - cam.cw / 2) / cam.s; cam.cy = g.w.y - (my - cam.ch / 2) / cam.s;
      cam.fix();
    }
  });
  const up = ev => {
    if (!pts.has(ev.pointerId)) return;
    const p = local(ev);
    pts.delete(ev.pointerId);
    if (g && pts.size === 0 && ev.type === 'pointerup') {
      if ((g.kind === 'pan' || g.kind === 'box') && !g.moved) o.tap(cam.toWorld(p.x, p.y), p);
      else if (g.kind === 'box' && g.moved && o.boxEnd) { const b = cam.box; o.boxEnd(cam.toWorld(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1)), cam.toWorld(Math.max(b.x0, b.x1), Math.max(b.y0, b.y1))); }
    }
    if (pts.size === 0) { g = null; cam.box = null; }
    else if (g && g.kind === 'pinch') g = { kind: 'none' };
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', ev => { ev.preventDefault(); const p = local(ev); cam.zoomAt(ev.deltaY < 0 ? 1.15 : 1 / 1.15, p.x, p.y); }, { passive: false });
  return cam;
}
function zoomButtons(stage, cam) {
  const z = document.createElement('div');
  z.className = 'sg-zoom';
  z.innerHTML = '<button class="sm" data-z="in" aria-label="Zoom in">+</button><button class="sm" data-z="out" aria-label="Zoom out">−</button><button class="sm" data-z="fit" aria-label="Whole map">⤢</button>';
  z.querySelectorAll('button').forEach(b => b.onclick = () => {
    if (b.dataset.z === 'fit') { cam.s = cam.minS(); cam.fix(); }
    else cam.zoomAt(b.dataset.z === 'in' ? 1.35 : 1 / 1.35, cam.cw / 2, cam.ch / 2);
  });
  stage.appendChild(z);
}

// ---------- fortify: building the castle between nights ----------
const PIECE_ORDER = ['wall', 'tower', 'moat', 'stakes', 'pit', 'pitch', 'brazier', 'mangonel'];
const costTxt = c => (c.gold ? c.gold + 'g' : '') + Object.keys(c.mats || {}).map(m => ' ' + c.mats[m] + ' ' + (m === 'ore' ? 'iron' : D.MATS[m].name)).join('');
// Where a tap puts a piece: 2x2 pieces centre on the tap.
function pieceCell(k, x, y) {
  const sz = SG.PIECES[k].size;
  if (sz === 2) return { c: Math.max(0, Math.round(x / G.CELL) - 1), r: Math.round(y / G.CELL) - 1 };
  return SG.cellOf(x, y);
}
function pieceCards(S, tool) {
  return PIECE_ORDER.map(k => {
    const d = SG.PIECES[k], locked = d.req && (S.buildings[d.req[0]] || 0) < d.req[1];
    return `<button class="sg-card fcard ${tool === k ? 'on' : ''} ${locked || !E.canAfford(S, d.cost) ? 'poor' : ''}" data-p="${k}"><i class="sw sw-${k}"></i><span>${d.name}</span><b>${costTxt(d.cost)}</b></button>`;
  }).join('') + `<button class="sg-card fcard ${tool === 'demolish' ? 'on' : ''}" data-p="demolish"><i class="sw sw-demolish"></i><span>Demolish</span><b>half back</b></button>`;
}
function drawGrid(ctx, V, tool) {
  const z = SG.PIECES[tool] && SG.PIECES[tool].zone === 'yard' ? G.YBUILD : G.BUILD;
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
  for (let c = 0; c <= G.COLS; c++) { ctx.beginPath(); ctx.moveTo(X(V, c * G.CELL), Y(V, z.r0 * G.CELL)); ctx.lineTo(X(V, c * G.CELL), Y(V, (z.r1 + 1) * G.CELL)); ctx.stroke(); }
  for (let r = z.r0; r <= z.r1 + 1; r++) { ctx.beginPath(); ctx.moveTo(X(V, 0), Y(V, r * G.CELL)); ctx.lineTo(X(V, G.W), Y(V, r * G.CELL)); ctx.stroke(); }
}
function runFortify(S, done) {
  const el = document.createElement('div');
  el.id = 'siege';
  el.innerHTML = `<div class="sg-top"><div><b class="serif">Fortify Emberwake</b> <span class="muted small">Build in daylight, fight at night</span></div>
      <span class="goldtxt" id="fgold"></span><button class="sm primary" id="fdone">Done</button></div>
    <div class="sg-stage" id="sgstage"><canvas id="sgc"></canvas><div class="sg-banner" id="sgbanner"></div><div class="sg-hint" id="sghint" style="display:block"></div></div>
    <div class="sg-bottom"><div class="sg-cards" id="fcards"></div></div>`;
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
  const stage = el.querySelector('#sgstage'), canvas = el.querySelector('#sgc');
  const dpr = Math.min(2, window.devicePixelRatio || 1), ctx = canvas.getContext('2d');
  const bg = worldCanvas(S, { night: false, slots: true, gate: true });
  let cw = 0, ch = 0, tool = 'wall', raf = 0, alive = true;
  const cam = Camera(canvas, {
    bounds: [0, 0, G.W, G.H],
    start: (w, h) => ({ cx: G.GX, cy: G.WALL_Y - 24, s: Math.max(w / 120, h / 150) }),
    tap: w => {
      if (tool === 'demolish') { if (!SG.demolish(S, SG.cellOf(w.x, w.y).c, SG.cellOf(w.x, w.y).r)) banner('Nothing there to pull down.', 'warn'); }
      else { const { c, r } = pieceCell(tool, w.x, w.y), err = SG.build(S, tool, c, r); if (err) banner(err, 'warn'); }
      cards();
    },
  });
  zoomButtons(stage, cam);
  el._cam = cam; // for tests
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h || (w === cw && h === ch)) return;
    cw = w; ch = h;
    canvas.width = cw * dpr; canvas.height = ch * dpr; canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
    cam.resize(cw, ch);
  }
  layout();
  const ro = window.ResizeObserver ? new ResizeObserver(layout) : null;
  if (ro) ro.observe(stage);
  const banner = (t, cls) => { const b = el.querySelector('#sgbanner'); b.className = 'sg-banner show ' + (cls || ''); b.textContent = t; clearTimeout(banner.t); banner.t = setTimeout(() => { b.className = 'sg-banner'; }, 1600); };
  function cards() {
    el.querySelector('#fcards').innerHTML = pieceCards(S, tool);
    el.querySelectorAll('.fcard').forEach(b => b.onclick = () => { tool = b.dataset.p; cards(); hint(); });
    el.querySelector('#fgold').textContent = `${S.gold} g · ${S.mats.ore || 0} iron`;
  }
  function hint() {
    const d = SG.PIECES[tool];
    el.querySelector('#sghint').innerHTML = (tool === 'demolish' ? 'Tap a piece to pull it down. You get half the gold back.' : `<b>${d.name}</b>: ${d.desc} Tap the ${d.zone === 'yard' ? 'yard' : 'ground in front of the wall'} to build.`) + ' <span class="muted">Drag to look around, pinch to zoom.</span>';
  }
  function frame(now) {
    if (!alive) return;
    const t = now / 1000, V = cam.V;
    ctx.fillStyle = '#08090f'; ctx.fillRect(0, 0, cw, ch);
    blit(ctx, bg, V, cw, ch);
    drawGrid(ctx, V, tool);
    drawPieces(ctx, V, SG.castle(S).pieces.map(p => Object.assign({ size: SG.PIECES[p.k].size }, p)), { build: true, t });
    raf = requestAnimationFrame(frame);
  }
  el.querySelector('#fdone').onclick = () => { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); el.remove(); document.body.style.overflow = ''; done(); };
  cards(); hint();
  raf = requestAnimationFrame(frame);
}

// ---------- the keep, alive, for the keep screen ----------
function mountKeep(canvas, S) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cw = canvas.clientWidth, ch = canvas.clientHeight;
  canvas.width = cw * dpr; canvas.height = ch * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr); ctx.imageSmoothingEnabled = false;
  const V = view(G.OX, G.OY + 97, 100, 53, cw, ch);
  V.ox = 0; V.s = cw / 100; V.oy = ch - 53 * V.s; // fill the width
  const bg = document.createElement('canvas');
  bg.width = cw * dpr; bg.height = ch * dpr;
  const bctx = bg.getContext('2d'); bctx.scale(dpr, dpr); bctx.imageSmoothingEnabled = false;
  drawScene(bctx, V, S, { night: false, lit: false });
  drawGate(bctx, V, { hp: 1, max: 1 }, S.buildings.walls || 0, false);
  drawPieces(bctx, V, SG.castle(S).pieces.filter(p => SG.PIECES[p.k].zone === 'yard').map(p => Object.assign({ size: SG.PIECES[p.k].size }, p)), {});
  const P = new Particles();
  // Who's about
  const people = [];
  const spot = () => { const x = G.OX + 6 + Math.random() * 88; return { x, y: G.YARD_Y + 4 + Math.random() * (x > G.OX + 30 && x < G.OX + 70 ? 15 : 22) }; };
  const survivors = S.areas && S.areas.millroad && S.areas.millroad.cleared ? 4 + 2 * Math.min(6, (S.siege && S.siege.best) || 0) : 0;
  const villagers = ['m_sword', 'm_archer', 'm_spear', 'm_priest'];
  for (let i = 0; i < survivors; i++) people.push(Object.assign(spot(), { sprite: villagers[i % 4], speed: 3 + Math.random() * 2, face: 1, wait: Math.random() * 3 }));
  S.party.forEach((id, i) => people.push({ sprite: D.HEROES[id].sprite, x: G.OX + 42 + i * 7, y: G.OY + 126, speed: 4, face: -1, wait: 2 + i * 2, hero: true }));
  const c = E.creatureOf(S, S.companion);
  if (c) people.push({ sprite: E.creatureSprite(c), x: G.OX + 60, y: G.OY + 126, speed: 6, face: 1, wait: 1, pet: true });
  if (S.buildings.kennels) for (const k of S.creatures.filter(x => x.cid !== S.companion).slice(0, 3)) people.push({ sprite: E.creatureSprite(k), x: G.OX + 18, y: G.OY + 132, speed: 5, face: 1, wait: Math.random() * 3, pet: true, home: { x: G.OX + 17, y: G.OY + 133 } });
  for (const p of people) p.goal = spot();
  let last = performance.now(), raf = 0, t = 0, alive = true;
  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    for (const p of people) {
      if (p.wait > 0) { p.wait -= dt; continue; }
      const dx = p.goal.x - p.x, dy = p.goal.y - p.y, d = Math.hypot(dx, dy);
      if (d < 0.5) {
        p.wait = 1 + Math.random() * 4;
        p.goal = p.home ? { x: p.home.x + (Math.random() - 0.5) * 8, y: p.home.y + (Math.random() - 0.5) * 3 } : spot();
        continue;
      }
      p.x += dx / d * p.speed * dt; p.y += dy / d * p.speed * dt; p.face = dx > 0 ? 1 : -1; p.moving = true;
    }
    if (Math.random() < dt * 5) P.add({ x: G.OX + 19.3 + Math.random(), y: G.OY + 108.5, vx: 1 + Math.random(), vy: -3 - Math.random() * 2, life: 2.5, size: 1.2 + Math.random(), col: 'rgba(200,200,210,.5)', shrink: false });
    if (Math.random() < dt * 8) P.add({ x: G.OX + 13 + Math.random() * 2.5, y: G.OY + 117.5, vx: (Math.random() - 0.5) * 2, vy: -3, life: 0.6, size: 0.5, col: ['#ffb84a', '#ff7a2a'][Math.random() < 0.5 ? 0 : 1], glow: true });
    P.step(dt);
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(bg, 0, 0, cw, ch);
    P.draw(ctx, V, false);
    const unit = V.s * 0.3;
    for (const p of people.slice().sort((a, b) => a.y - b.y)) {
      const bob = p.wait > 0 ? 0 : Math.abs(Math.sin(t * 9 + p.x)) * V.s * 0.4;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(X(V, p.x), Y(V, p.y), V.s * 1.3, V.s * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      drawSprite(ctx, p.sprite, X(V, p.x), Y(V, p.y) - bob, p.pet ? unit * 0.8 : unit, p.face);
    }
    ctx.globalCompositeOperation = 'lighter'; P.draw(ctx, V, true); ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { alive = false; cancelAnimationFrame(raf); };
}

// ---------- the siege screen ----------
const UNIT_ORDER = ['archer', 'sword', 'spear', 'priest', 'knight', 'ballista'];
const AUD = () => root.AUDIO || { play() {}, sfx() {} };
const PLURAL = { Swordsman: 'swordsmen', Spearman: 'spearmen', Archer: 'archers', Priest: 'priests', Knight: 'knights', Wolf: 'wolves', Ballista: 'ballistas' };
function runSiege(S, n, done) {
  const sg = new SG.Siege(S, n);
  AUD().play('siege');
  const tutorial = !(S.siege && S.siege.best >= 1) && n === 1;
  const el = document.createElement('div');
  el.id = 'siege';
  el.innerHTML = `<div class="sg-top"><div><b class="serif">Night ${n}</b> <span class="muted small" id="sgwave">Prepare the defences</span></div>
      <div class="sg-hp"><span>Gate</span><div class="bar"><i id="sggate"></i></div><span>Keep</span><div class="bar"><i id="sgkeep"></i></div></div>
      <button class="sm" id="sgspeed">1x</button><button class="sm" id="sgpause">❚❚</button></div>
    <div class="sg-stage" id="sgstage"><canvas id="sgc"></canvas><div class="sg-banner" id="sgbanner"></div><div class="sg-hint" id="sghint"></div></div>
    <div class="sg-bottom"><div class="spread"><div class="sg-levy">Levy <b id="sglevy">0</b><span class="muted small"> +${sg.regen.toFixed(2).replace(/0$/, '')}/s</span></div><span class="muted small" id="sgcount"></span></div>
      <div class="sg-tabs" id="sgtabs"><button data-t="command">Command</button><button data-t="recruit">Recruit</button><button data-t="build">Build</button></div>
      <div class="sg-panel" id="sgpanel"></div>
      <button class="primary big" id="sgstart">Sound the horn</button></div>`;
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
  const stage = el.querySelector('#sgstage'), canvas = el.querySelector('#sgc');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const ctx = canvas.getContext('2d');
  const bg = worldCanvas(S, { night: true, lit: true, slots: true });
  const light = document.createElement('canvas'), lctx = light.getContext('2d');
  let cw = 0, ch = 0;
  let mode = null, tab = 'recruit', tool = 'wall', boxMode = false;
  const cam = Camera(canvas, {
    bounds: [0, 0, G.W, G.H],
    // Start on the wall and yard, about the old map's width across.
    start: (w, h) => ({ cx: G.GX, cy: G.H, s: Math.max(w / 112, h / 170) }),
    tap: w => tap(w),
    box: () => tab === 'command' && boxMode,
    boxEnd: (a, b) => {
      const pick = sg.units.filter(u => u.side === 'p' && u.hp > 0 && u.type !== 'ballista' && u.x >= a.x - 1 && u.x <= b.x + 1 && u.y >= a.y - 1 && u.y <= b.y + 3);
      if (!pick.length) { banner('Nobody of yours in there.', 'warn'); return; }
      sg.selected = pick.map(u => u.uid); boxMode = false;
      for (const u of pick) P.add({ x: u.x, y: u.y, ring: 3, life: 0.3, col: '#7ad8ff', glow: true });
      refreshUI(true);
    },
  });
  zoomButtons(stage, cam);
  el._cam = cam; // for tests
  // Sizes the battlefield to its box, and again whenever the box changes.
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h || (w === cw && h === ch)) return;
    cw = w; ch = h;
    canvas.width = cw * dpr; canvas.height = ch * dpr; canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
    cam.resize(cw, ch);
    light.width = Math.ceil(cw / 2); light.height = Math.ceil(ch / 2);
  }
  layout();
  const ro = window.ResizeObserver ? new ResizeObserver(layout) : null;
  if (ro) ro.observe(stage);
  const P = new Particles();
  const lights = [];
  for (let x = 6; x < G.W; x += 12) if (Math.abs(x - G.GX) > 12) lights.push({ x, y: G.WALL_Y + 1, r: 13, torch: true });
  for (const x of [G.GX - 8.5, G.GX + 8.5]) lights.push({ x, y: G.WALL_Y - 1, r: 16, torch: true });
  for (const wx of [39.5, 44, 56, 60.5]) lights.push({ x: wx + G.OX, y: 139 + G.OY, r: 7 });
  lights.push({ x: 14 + G.OX, y: 118 + G.OY, r: 10 });
  for (const [x, y] of COTTAGES.slice(0, cottageCount(S))) lights.push({ x, y: y - 2, r: 6 });
  let speed = 1, paused = false, shake = 0, last = performance.now(), acc = 0, raf = 0, ended = false, flash = 0;
  const pos = {};
  let tipShown = {};

  function setHint(t) { el.querySelector('#sghint').innerHTML = t || ''; el.querySelector('#sghint').style.display = t ? 'block' : 'none'; }
  function banner(t, cls) {
    const b = el.querySelector('#sgbanner');
    b.className = 'sg-banner show ' + (cls || ''); b.textContent = t;
    clearTimeout(banner.t); banner.t = setTimeout(() => { b.className = 'sg-banner'; }, 1800);
  }
  // ----- the three modes -----
  function setTab(t) {
    tab = t; mode = null; boxMode = false;
    el.querySelectorAll('#sgtabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    const box = el.querySelector('#sgpanel');
    if (t === 'command') box.innerHTML = '<div class="sg-sel" id="sgsel"></div><div class="sg-heroes" id="sgheroes"></div>';
    else if (t === 'recruit') box.innerHTML = '<div class="sg-cards" id="sgcards"></div><div class="sg-heroes" id="sgheroes"></div>';
    else box.innerHTML = '<div class="sg-cards" id="sgbuild"></div><div class="muted small" id="sgbgold"></div>';
    cards(); heroes(); buildCards(); refreshUI(true);
  }
  el.querySelectorAll('#sgtabs button').forEach(b => b.onclick = () => setTab(b.dataset.t));
  function cards() {
    const box = el.querySelector('#sgcards');
    if (!box) return;
    box.innerHTML = UNIT_ORDER.filter(k => sg.unlocked(k)).map(k => {
      const d = SG.UNITS[k];
      return `<button class="sg-card ucard" data-k="${k}"><img class="px" src="${SP.spriteURL(d.sprite, 2).url}" alt=""><span>${d.name}</span><b>${d.cost}</b></button>`;
    }).join('');
    box.querySelectorAll('.ucard').forEach(b => b.onclick = () => { sg.selected = []; mode = mode && mode.k === b.dataset.k ? null : { kind: 'unit', k: b.dataset.k }; refreshUI(true); });
  }
  function buildCards() {
    const box = el.querySelector('#sgbuild');
    if (!box) return;
    box.innerHTML = pieceCards(S, tool);
    box.querySelectorAll('.fcard').forEach(b => b.onclick = () => { tool = b.dataset.p; buildCards(); refreshUI(true); });
    el.querySelector('#sgbgold').textContent = `${S.gold} g · ${S.mats.ore || 0} iron. Pieces stay for every night after this one.`;
  }
  function heroes() {
    const box = el.querySelector('#sgheroes');
    if (!box) return;
    const placing = tab === 'recruit';
    if (placing && sg.phase !== 'deploy') { box.innerHTML = ''; return; }
    box.innerHTML = S.party.map(id => {
      const p = SG.POWERS[id];
      return `<button class="sg-hero" data-id="${id}"><img class="px" src="${SP.spriteURL(D.HEROES[id].sprite, 2).url}" alt=""><span class="nm">${placing ? 'Place ' + D.HEROES[id].name : p.name}</span><i class="cdv"></i></button>`;
    }).join('');
    box.querySelectorAll('.sg-hero').forEach(b => b.onclick = () => {
      const id = b.dataset.id;
      if (placing) { if (sg.placedHeroes[id]) { banner(D.HEROES[id].name + ' is in place'); return; } mode = mode && mode.id === id ? null : { kind: 'hero', id }; refreshUI(true); return; }
      const p = SG.POWERS[id];
      if (sg.phase === 'deploy') { banner('Powers charge once the horn sounds'); return; }
      if (sg.powers[id].cd > 0) { banner(p.name + ' is still charging'); return; }
      if (!p.aim) { sg.usePower(id); mode = null; refreshUI(true); return; }
      mode = mode && mode.id === id ? null : { kind: 'power', id }; refreshUI(true);
    });
  }
  let lastUI = 0;
  function selRow() {
    const selBox = el.querySelector('#sgsel');
    if (!selBox) return;
    const us = sg.units.filter(u => sg.selected.includes(u.uid)), first = us[0];
    const label = !us.length ? 'Nobody selected' : us.length === 1 ? first.name : `${us.length} selected`;
    const key = `${label}|${first ? first.type : ''}|${boxMode}`;
    if (selBox.dataset.key === key) return;
    selBox.dataset.key = key;
    const all = first && first.type !== 'hero' ? `<button class="sm" data-s="type">All ${PLURAL[first.name] || first.name + 's'}</button>` : '';
    selBox.innerHTML = `<b>${label}</b><button class="sm ${boxMode ? 'on' : ''}" data-s="box">▭ Box</button>${all}<button class="sm" data-s="all">Everyone</button>${us.length ? '<button class="sm" data-s="none">✕</button>' : ''}`;
    selBox.querySelectorAll('button').forEach(b => b.onclick = () => {
      const s = b.dataset.s;
      if (s === 'box') boxMode = !boxMode;
      else if (s === 'none') sg.selected = [];
      else if (s === 'all') sg.selected = sg.units.filter(u => u.side === 'p' && u.hp > 0 && u.type !== 'ballista').map(u => u.uid);
      else sg.selected = sg.units.filter(u => u.side === 'p' && u.hp > 0 && u.type === first.type).map(u => u.uid);
      refreshUI(true);
    });
  }
  function refreshUI(force) {
    const now = performance.now();
    if (!force && now - lastUI < 150) return;
    lastUI = now;
    el.querySelector('#sglevy').textContent = Math.floor(sg.levy);
    el.querySelector('#sggate').style.width = (sg.gate.hp / sg.gate.max * 100) + '%';
    el.querySelector('#sgkeep').style.width = (Math.max(0, sg.keep.hp) / sg.keep.max * 100) + '%';
    el.querySelector('#sgcount').textContent = `Army ${sg.meleeCount()}/${SG.ARMY_CAP}`;
    sg.selected = sg.selected.filter(id => sg.units.some(u => u.uid === id && u.hp > 0));
    selRow();
    el.querySelectorAll('.ucard').forEach(b => {
      const d = SG.UNITS[b.dataset.k];
      b.classList.toggle('poor', sg.levy < d.cost);
      b.classList.toggle('on', !!(mode && mode.k === b.dataset.k));
    });
    el.querySelectorAll('.sg-hero').forEach(b => {
      const id = b.dataset.id;
      b.classList.toggle('on', !!(mode && mode.id === id));
      if (tab === 'recruit') { b.classList.toggle('done', !!sg.placedHeroes[id]); b.querySelector('.cdv').style.height = '0'; return; }
      if (sg.phase === 'deploy') { b.querySelector('.cdv').style.height = '0'; return; }
      const cd = sg.powers[id].cd / SG.POWERS[id].cd;
      b.querySelector('.cdv').style.height = (cd * 100) + '%';
      b.classList.toggle('ready', cd <= 0);
      const hu = sg.units.find(u => u.hero === id);
      b.classList.toggle('down', !!(hu && hu.hp <= 0));
    });
    if (tutorial) tutorialHint(); else setHint(modeHint());
  }
  function modeHint() {
    if (mode && mode.kind === 'power') return `${SG.POWERS[mode.id].name}: tap where to use it.`;
    if (tab === 'command') {
      if (boxMode) return 'Drag a box around the soldiers you want. Two fingers move the map.';
      if (sg.selected.length) return 'Tap where to send them. Archers take free spots on walls and towers.';
      return '';
    }
    if (tab === 'recruit') {
      if (mode && mode.kind === 'unit') return SG.UNITS[mode.k].desc;
      if (mode && mode.kind === 'hero') return `Tap in front of the wall or in the yard to place ${D.HEROES[mode.id].name}.`;
      return 'Pick a soldier, then tap the map to place them.';
    }
    if (tool === 'demolish') return 'Tap a piece to pull it down. You get half the gold back.';
    return `<b>${SG.PIECES[tool].name}</b>: ${SG.PIECES[tool].desc}`;
  }
  function tutorialHint() {
    const archers = sg.units.filter(u => u.type === 'archer').length, swords = sg.units.filter(u => u.type === 'sword').length;
    let h = '';
    if (sg.phase === 'deploy') {
      if (tab !== 'recruit') h = modeHint();
      else if (archers < 2) h = 'Tap <b>Archer</b> below, then tap a gold spot on the wall. Drag to look around, pinch to zoom.';
      else if (swords < 1) h = 'Now a <b>Swordsman</b>: tap it, then tap the ground just in front of the gate.';
      else h = 'Place your heroes with the buttons below, or let them pick their own spots. Then sound the horn.';
    } else if (sg.phase === 'fight' || sg.phase === 'break') {
      if (sg.ladders.length && !tipShown.ladder) { tipShown.ladder = sg.t; }
      if (tipShown.ladder && sg.t - tipShown.ladder < 9) h = 'A ladder! Enemies will climb into the yard. A swordsman placed <b>in the yard</b> will pull it down.';
      else if (sg.t < 12) h = 'You\'re in <b>Command</b> now: tap a soldier, then tap the ground to send them. Use <b>Recruit</b> to add more as levy builds.';
      else if (sg.t < 24) h = 'Hero powers charge up: tap one, then tap where to use it. <b>Box</b> lets you drag round a group.';
      else h = modeHint();
    }
    if (mode && mode.kind === 'power') h = `${SG.POWERS[mode.id].name}: tap where to use it.`;
    setHint(h);
  }
  function buildAt(w) {
    if (tool === 'demolish') {
      const { c, r } = SG.cellOf(w.x, w.y);
      if (SG.demolish(S, c, r)) { sg.syncPieces(); P.burst(w.x, w.y, 12, { col: ['#a8a49c', '#7a766e'], speed: 9, life: 0.5, size: 0.7, grav: 25 }); }
      else banner('Nothing there to pull down.', 'warn');
      buildCards(); return;
    }
    const { c, r } = pieceCell(tool, w.x, w.y);
    const err = SG.canBuild(S, tool, c, r) || (sg.standingIn(tool, c, r) ? 'Someone is standing there.' : null);
    if (err) { banner(err, 'warn'); return; }
    SG.build(S, tool, c, r); sg.syncPieces();
    const d = SG.PIECES[tool];
    AUD().sfx('place');
    P.burst((c + d.size / 2) * G.CELL, (r + d.size / 2) * G.CELL, 14, { col: ['#c8b890', '#a89870'], speed: 8, life: 0.5, size: 0.7 });
    buildCards();
  }
  function tap(w) {
    if (sg.phase === 'won' || sg.phase === 'lost') return;
    let err = null;
    if (mode && mode.kind === 'power') { err = sg.usePower(mode.id, w.x, w.y); if (!err) mode = null; }
    else if (tab === 'build') { buildAt(w); refreshUI(true); return; }
    else if (tab === 'recruit') {
      if (!mode) { banner('Pick a soldier below first.', 'warn'); return; }
      if (mode.kind === 'unit') err = sg.place(mode.k, w.x, w.y);
      else if (mode.kind === 'hero') { err = sg.placeHero(mode.id, w.x, w.y); if (!err) { mode = null; heroes(); } }
    } else {
      // Tap a soldier to select them; with soldiers selected, tap the ground to send them.
      let best = null, bd = Math.max(3.6, 16 / cam.s);
      for (const u of sg.units) if (u.side === 'p' && u.hp > 0) { const d = Math.hypot(u.x - w.x, u.y - 2 - w.y); if (d < bd) { bd = d; best = u; } }
      if (best) { sg.selected = [best.uid]; P.add({ x: best.x, y: best.y, ring: 3, life: 0.3, col: '#7ad8ff', glow: true }); refreshUI(true); return; }
      if (sg.selected.length) {
        err = sg.order(sg.selected, w.x, w.y);
        if (!err) P.add({ x: w.x, y: w.y, ring: 3, life: 0.4, col: '#7ad8ff', glow: true });
      } else if (sg.lightPitchAt(w.x, w.y)) { banner('The pitch catches!', 'bad'); return; }
    }
    if (err) banner(err, 'warn');
    refreshUI(true);
  }
  el.querySelector('#sgstart').onclick = () => {
    sg.start();
    el.querySelector('#sgstart').style.display = 'none';
    setTab('command');
  };
  el.querySelector('#sgspeed').onclick = e => { speed = speed === 1 ? 2 : 1; e.target.textContent = speed + 'x'; };
  el.querySelector('#sgpause').onclick = () => {
    paused = true;
    const o = document.createElement('div');
    o.className = 'overlay center'; o.id = 'sgpauseov';
    o.innerHTML = `<div class="sheet" style="text-align:center"><h2>Paused</h2><button class="primary big" id="sgres">Carry on</button><button class="big" id="sgquit">Fall back (no reward)</button></div>`;
    document.body.appendChild(o);
    o.querySelector('#sgres').onclick = () => { o.remove(); paused = false; last = performance.now(); };
    o.querySelector('#sgquit').onclick = () => { o.remove(); finish('retreat'); };
  };

  function handleFx() {
    for (const f of sg.fx) {
      switch (f.k) {
        case 'hit':
          P.burst(f.x, f.y, f.power ? 8 : 3, { col: f.fire ? ['#ffb84a', '#ff6a2a'] : f.side === 'e' ? ['#e8e0ff', '#b8a0ff'] : ['#ffffff', '#ffd0a0'], speed: 12, life: 0.3, size: 0.6, glow: true });
          if (f.power && f.n) P.add({ x: f.x, y: f.y - 2, vy: -6, life: 0.9, text: String(f.n), col: '#ffe9a0', shrink: false });
          break;
        case 'die':
          P.burst(f.x, f.y - 2, f.large ? 26 : 12, { col: f.side === 'e' ? ['#2a1e3a', '#4a3a6a', '#120c1a'] : ['#8a7a62', '#6a5a48'], speed: 6, up: 3, life: 0.9, size: f.large ? 2 : 1.3, shrink: true });
          if (f.side === 'e') P.burst(f.x, f.y - 2, 5, { col: '#b03aff', speed: 8, life: 0.5, size: 0.5, glow: true });
          break;
        case 'boom':
          if (!f.small) AUD().sfx('boom');
          P.burst(f.x, f.y, f.small ? 14 : 60, { col: f.fire ? ['#fff0a0', '#ffb84a', '#ff6a2a', '#ff3a1a'] : ['#fff0c0', '#ffb84a', '#8a8a8a'], speed: f.small ? 14 : 30, life: f.small ? 0.4 : 0.9, size: f.small ? 0.8 : 1.6, glow: true });
          if (!f.small) { P.add({ x: f.x, y: f.y, ring: f.r, life: 0.5, col: f.fire ? '#ffb84a' : '#fff0c0', glow: true }); shake = Math.max(shake, 0.4); flash = 0.35; lights.push({ x: f.x, y: f.y, r: f.r * 2.2, ttl: 0.6 }); }
          else lights.push({ x: f.x, y: f.y, r: 6, ttl: 0.25 });
          break;
        case 'keg': P.add({ x: f.x, y: f.y, ring: 3, life: f.t, col: '#ff6a2a', glow: true, shrink: false }); break;
        case 'arrowfall': P.add({ x: f.x - 2, y: f.y - 10, vx: 40, vy: 200, life: 0.05, arrow: true }); P.burst(f.x, f.y, 4, { col: '#e8d8b0', speed: 6, life: 0.25, size: 0.4 }); break;
        case 'heal': P.burst(f.x, f.y - 3, 5, { col: f.dark ? '#b03aff' : '#7aff9a', speed: 3, up: 6, life: 0.7, size: 0.6, glow: true }); break;
        case 'ember': P.add({ x: f.x + (Math.random() - 0.5) * 2, y: f.y, vy: -6, life: 0.5, size: 0.6, col: '#ff8a3d', glow: true }); break;
        case 'gatehit':
          if (f.big) AUD().sfx('gate');
          P.burst(f.x, G.WALL_Y + 1, f.big ? 14 : 4, { col: ['#7a5232', '#a07a50', '#3a2616'], speed: 10, life: 0.5, size: 0.7, grav: 30 });
          shake = Math.max(shake, f.big ? 0.35 : 0.08);
          break;
        case 'keephit': P.burst(f.x, f.y, 4, { col: ['#a8a196', '#7a756c'], speed: 8, life: 0.4, size: 0.6, grav: 20 }); shake = Math.max(shake, 0.1); break;
        case 'gatebroken': banner('The gate is down!', 'bad'); shake = 0.8; P.burst(G.GX, G.WALL_Y + 3, 50, { col: ['#7a5232', '#a07a50', '#3a2616'], speed: 20, life: 1, size: 1.2, grav: 30 }); break;
        case 'ladder': banner('Ladder on the wall!', 'warn'); break;
        case 'ladderdown': P.burst(f.x, G.WALL_Y, 12, { col: ['#8a6a3a', '#6a4a2a'], speed: 10, life: 0.6, size: 0.8, grav: 30 }); break;
        case 'wave': el.querySelector('#sgwave').textContent = `Wave ${f.n} of ${f.of}`; banner(f.n === f.of ? 'Last wave!' : `Wave ${f.n}`, f.n === f.of ? 'bad' : ''); break;
        case 'break': el.querySelector('#sgwave').textContent = 'A moment to breathe'; banner('They fall back. Ready yourselves.'); break;
        case 'place': AUD().sfx('place'); P.burst(f.x, f.y, 8, { col: ['#c8b890', '#a89870'], speed: 6, life: 0.4, size: 0.6 }); break;
        case 'power': P.add({ x: f.x || G.GX, y: f.y || G.KEEP.y - 18, ring: f.r || 30, life: 0.5, col: '#ffd76a', glow: true }); break;
        case 'herodown': banner(`${D.HEROES[f.id].name} is down! Back in 20 seconds.`, 'bad'); break;
        case 'heroback': banner(`${D.HEROES[f.id].name} is back on their feet.`); break;
        case 'piecehit': P.burst(f.x, f.y, f.big ? 10 : 4, { col: ['#a8a49c', '#7a766e', '#5a5650'], speed: 9, life: 0.5, size: 0.7, grav: 25 }); if (f.big) shake = Math.max(shake, 0.2); break;
        case 'piecedown': P.burst(f.x, f.y, 30 * f.size, { col: ['#a8a49c', '#7a766e', '#c8c0b0'], speed: 16, up: 6, life: 1, size: 1.2, grav: 25 }); shake = Math.max(shake, 0.4); banner(f.size === 2 ? 'A tower has fallen!' : 'A wall is breached!', 'bad'); break;
        case 'pit': P.burst(f.x, f.y, 18, { col: ['#5a4028', '#3a2818'], speed: 10, up: 8, life: 0.7, size: 1, grav: 30 }); banner('Killing pit!'); break;
        case 'won': case 'lost': AUD().play(null); AUD().sfx(f.k === 'won' ? 'victory' : 'defeat'); setTimeout(() => finish(f.k), 1400); break;
      }
    }
    sg.fx = [];
  }

  function draw(t) {
    const V = cam.V;
    const lit = lights.concat(sg.pieces.filter(p => p.k === 'brazier' && p.hp >= 0).map(p => ({ x: p.x, y: p.y, r: 11, torch: true })));
    ctx.fillStyle = '#08090f'; ctx.fillRect(0, 0, cw, ch);
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 10, (Math.random() - 0.5) * shake * 10);
    blit(ctx, bg, V, cw, ch);
    if (tab === 'build') drawGrid(ctx, V, tool);
    drawGate(ctx, V, sg.gate, S.buildings.walls || 0, true);
    drawPieces(ctx, V, sg.pieces, { night: true, t });
    for (const l of sg.ladders) drawLadder(ctx, V, l, true);
    // selected troops and where they're heading
    for (const u of sg.units) if (u.hp > 0 && sg.selected.includes(u.uid)) {
      ctx.strokeStyle = 'rgba(122,216,255,.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(X(V, u.x), Y(V, u.y), V.s * 2, V.s * 0.8, 0, 0, Math.PI * 2); ctx.stroke();
      if (u.dest) { ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(V, u.x), Y(V, u.y)); for (const wp of u.path || []) ctx.lineTo(X(V, wp.x), Y(V, wp.y)); ctx.stroke(); ctx.setLineDash([]); }
    }
    // placement guides
    if (mode && (mode.kind === 'unit' || mode.kind === 'hero')) {
      const d = mode.kind === 'unit' ? SG.UNITS[mode.k] : {};
      ctx.fillStyle = 'rgba(120,255,150,.10)'; ctx.strokeStyle = 'rgba(120,255,150,.5)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      if (d.zone === 'wall' || d.zone === 'tower') {
        for (const sp of sg.freeSpots(d.zone === 'tower')) {
          ctx.fillStyle = 'rgba(255,215,106,.6)';
          ctx.beginPath(); ctx.arc(X(V, sp.x), Y(V, sp.y), V.s * (1.6 + Math.sin(t * 6) * 0.3), 0, Math.PI * 2); ctx.fill();
        }
      } else {
        for (const z of [[3, G.FIELD.y0, G.W - 6, G.FIELD.y1 - G.FIELD.y0], [3, G.YARD.y0, G.W - 6, G.YARD.y1 - G.YARD.y0]]) {
          ctx.fillRect(X(V, z[0]), Y(V, z[1]), z[2] * V.s, z[3] * V.s); ctx.strokeRect(X(V, z[0]), Y(V, z[1]), z[2] * V.s, z[3] * V.s);
        }
      }
      ctx.setLineDash([]);
    }
    if (mode && mode.kind === 'power' && SG.POWERS[mode.id].r) {
      ctx.strokeStyle = 'rgba(255,215,106,.35)'; ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
      ctx.strokeRect(X(V, 1), Y(V, 1), (G.W - 2) * V.s, (G.H - 3) * V.s); ctx.setLineDash([]);
    }
    // units, back to front
    const list = sg.units.filter(u => u.hp > 0).sort((a, b) => a.y - b.y);
    const unit = V.s * 0.34;
    for (const u of list) {
      const p = pos[u.uid] || (pos[u.uid] = { x: u.x, y: u.y });
      const moving = Math.hypot(u.x - p.x, u.y - p.y) > 0.01;
      p.x = u.x; p.y = u.y;
      const sx = X(V, u.x) + (u.atk > 0 ? u.face * V.s * 0.9 : 0), sy = Y(V, u.y) - (moving ? Math.abs(Math.sin(t * 12 + u.uid)) * V.s * 0.5 : 0);
      const onWall = u.zone === 'wall' || u.zone === 'tower';
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.ellipse(X(V, u.x), Y(V, u.y), V.s * (u.large ? 2.6 : 1.4), V.s * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      if (u.hero) { ctx.strokeStyle = 'rgba(255,215,106,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(X(V, u.x), Y(V, u.y), V.s * 1.8, V.s * 0.7, 0, 0, Math.PI * 2); ctx.stroke(); }
      const k = u.hero ? unit * 1.15 : u.type === 'pet' || u.type === 'wolf' ? unit * 0.75 : u.type === 'hound' ? unit * 0.8 : unit;
      const h = drawSprite(ctx, u.sprite, sx, sy + (onWall ? 0 : 0), k, u.face, u.hurt / 0.15, u.state === 'climb' ? 0.85 : 1);
      if (u.burn > 0 && Math.random() < 0.5) P.add({ x: u.x + (Math.random() - 0.5) * 1.5, y: u.y - Math.random() * 3, vy: -5, life: 0.35, size: 0.6, col: '#ff8a3d', glow: true });
      if (u.hp < u.max) {
        const bw = V.s * (u.large ? 7 : 4.5), bx = X(V, u.x) - bw / 2, by = sy - h - V.s * 0.9;
        ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(bx - 1, by - 1, bw + 2, Math.max(3, V.s * 0.55) + 2);
        ctx.fillStyle = u.side === 'e' ? '#e0574a' : u.hero ? '#ffd76a' : '#6ad07a';
        ctx.fillRect(bx, by, bw * Math.max(0, u.hp / u.max), Math.max(3, V.s * 0.55));
      }
      if (u.hero) { ctx.fillStyle = '#ffd76a'; ctx.font = `bold ${Math.round(V.s * 1.8)}px system-ui`; ctx.textAlign = 'center'; ctx.fillText('★', X(V, u.x), sy - h - V.s * 1.4); }
    }
    // projectiles
    for (const p of sg.proj) {
      const a = p.ang || Math.PI / 2, px = X(V, p.x), py = Y(V, p.y);
      if (p.kind === 'rock') {
        const ry = Y(V, p.y - (p.arc || 0));
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(px, py, V.s * 0.9, V.s * 0.4, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#7a7a82'; ctx.beginPath(); ctx.arc(px, ry, V.s * (p.mangonel ? 1 : 1.2), 0, 7); ctx.fill();
        ctx.fillStyle = '#a8a8b0'; ctx.beginPath(); ctx.arc(px - V.s * 0.3, ry - V.s * 0.3, V.s * 0.4, 0, 7); ctx.fill();
        continue;
      }
      if (p.kind === 'firearrow') {
        const len = 2.6 * V.s;
        ctx.strokeStyle = '#ffb84a'; ctx.lineWidth = Math.max(1.5, V.s * 0.3);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - Math.cos(a) * len, py - Math.sin(a) * len); ctx.stroke();
        if (Math.random() < 0.5) P.add({ x: p.x, y: p.y, life: 0.25, size: 0.5, col: '#ff8a3d', glow: true });
        continue;
      }
      if (p.kind === 'fire') {
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(px, py, 0, px, py, V.s * 2);
        g.addColorStop(0, 'rgba(255,240,160,1)'); g.addColorStop(0.4, 'rgba(255,140,40,.8)'); g.addColorStop(1, 'rgba(255,60,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, V.s * 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        if (Math.random() < 0.6) P.add({ x: p.x, y: p.y, life: 0.3, size: 0.7, col: '#ff8a3d', glow: true });
      } else {
        const len = (p.kind === 'bolt' ? 4 : 2.4) * V.s;
        ctx.strokeStyle = p.kind === 'bolt' ? '#3a2a1a' : p.src.side === 'e' ? '#6a5a8a' : '#d8c8a0';
        ctx.lineWidth = Math.max(1, V.s * (p.kind === 'bolt' ? 0.6 : 0.25));
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - Math.cos(a) * len, py - Math.sin(a) * len); ctx.stroke();
        ctx.fillStyle = '#eef'; ctx.fillRect(px - 1, py - 1, 2, 2);
      }
    }
    P.draw(ctx, V, false);
    // night: darkness with holes for the lights
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, light.width, light.height);
    lctx.fillStyle = 'rgba(6,8,28,.58)'; lctx.fillRect(0, 0, light.width, light.height);
    lctx.globalCompositeOperation = 'destination-out';
    const ls = 0.5;
    const hole = (x, y, r, a) => {
      const gx = X(V, x) * ls, gy = Y(V, y) * ls, gr = r * V.s * ls;
      if (gx < -gr || gy < -gr || gx > light.width + gr || gy > light.height + gr) return;
      const g = lctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g; lctx.beginPath(); lctx.arc(gx, gy, gr, 0, Math.PI * 2); lctx.fill();
    };
    for (const l of lit) hole(l.x, l.y, l.r * (l.torch ? 0.92 + Math.sin(t * 13 + l.x) * 0.08 : 1), l.ttl != null ? Math.min(1, l.ttl * 2) : 0.95);
    for (const p of sg.proj) if (p.kind === 'fire' || p.kind === 'firearrow') hole(p.x, p.y, p.kind === 'fire' ? 7 : 4, 0.8);
    for (const p of sg.pieces) if (p.lit > 0) hole(p.x, p.y, 9, 0.9);
    for (const u of sg.units) if (u.burn > 0 && u.hp > 0) hole(u.x, u.y - 2, 6, 0.6);
    hole(G.GX, 80, 100, 0.25);
    ctx.drawImage(light, 0, 0, light.width, light.height, 0, 0, cw, ch);
    // warm glow on top
    ctx.globalCompositeOperation = 'lighter';
    for (const l of lit) if (l.torch) {
      const gx = X(V, l.x), gy = Y(V, l.y), gr = V.s * 4;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      g.addColorStop(0, `rgba(255,170,70,${0.35 + Math.sin(t * 17 + l.x) * 0.08})`); g.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd27a'; ctx.fillRect(gx - V.s * 0.3, gy - V.s * 1.2 - Math.random() * V.s * 0.4, V.s * 0.6, V.s * 0.9);
    }
    P.draw(ctx, V, true);
    ctx.globalCompositeOperation = 'source-over';
    // spawn fog
    const fog = ctx.createLinearGradient(0, Y(V, 0), 0, Y(V, 18));
    fog.addColorStop(0, 'rgba(10,8,20,.9)'); fog.addColorStop(1, 'rgba(10,8,20,0)');
    ctx.fillStyle = fog; ctx.fillRect(0, Y(V, 0), cw, 18 * V.s);
    if (flash > 0) { ctx.fillStyle = `rgba(255,200,120,${flash * 0.6})`; ctx.fillRect(0, 0, cw, ch); }
    ctx.restore();
    // enemies out of sight show as red marks at the edge of the screen
    ctx.fillStyle = 'rgba(255,90,70,.85)';
    for (const u of sg.units) if (u.side === 'e' && u.hp > 0) {
      const sx = X(V, u.x), sy = Y(V, u.y);
      if (sx >= 0 && sx <= cw && sy >= 0 && sy <= ch) continue;
      const ex = Math.max(6, Math.min(cw - 6, sx)), ey = Math.max(6, Math.min(ch - 6, sy));
      ctx.beginPath(); ctx.arc(ex, ey, u.large ? 5 : 3, 0, Math.PI * 2); ctx.fill();
    }
    if (cam.box) {
      const b = cam.box;
      ctx.strokeStyle = '#7ad8ff'; ctx.fillStyle = 'rgba(122,216,255,.12)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      ctx.fillRect(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1), Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0));
      ctx.strokeRect(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1), Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0));
      ctx.setLineDash([]);
    }
  }

  function frame(now) {
    if (ended) return;
    let dt = Math.min(0.1, (now - last) / 1000); last = now;
    const t = now / 1000;
    if (!paused) {
      acc += dt * speed;
      let steps = 0;
      while (acc >= 1 / 30 && steps < 8) { sg.step(1 / 30); acc -= 1 / 30; steps++; }
      P.step(dt * speed);
      shake = Math.max(0, shake - dt * 1.5); flash = Math.max(0, flash - dt * 1.5);
      for (const l of lights) if (l.ttl != null) l.ttl -= dt;
      for (let i = lights.length - 1; i >= 0; i--) if (lights[i].ttl != null && lights[i].ttl <= 0) lights.splice(i, 1);
      handleFx();
    }
    draw(t);
    refreshUI();
    raf = requestAnimationFrame(frame);
  }
  function finish(result) {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(raf);
    if (ro) ro.disconnect();
    el.remove();
    document.body.style.overflow = '';
    done({ result, stars: sg.stars(), kills: sg.kills, lost: sg.lost, n });
  }
  setTab('recruit');
  if (tutorial) banner('Night falls on Emberwake');
  raf = requestAnimationFrame(frame);
  return sg;
}

root.SIEGEUI = { runSiege, runFortify, mountKeep, Particles };
})(this);
