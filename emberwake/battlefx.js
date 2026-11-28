// Emberwake: painted battle backgrounds and spell effects for turn based fights.
(function (root) {
'use strict';
function seeded(seed) {
  let h = seed >>> 0 || 1;
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };

function hills(g, w, hy, amp, col, r, base) {
  g.fillStyle = col;
  g.beginPath(); g.moveTo(0, hy + base);
  let y = hy - amp * r();
  for (let x = 0; x <= w + 20; x += 20) { y += (r() - 0.5) * amp * 0.6; y = Math.max(hy - amp, Math.min(hy, y)); g.lineTo(x, y); }
  g.lineTo(w, hy + base); g.closePath(); g.fill();
}
function pines(g, w, hy, n, hmin, hmax, col, r) {
  g.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const x = r() * w, h = hmin + r() * (hmax - hmin), y = hy + r() * 4;
    g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + h * 0.32, y); g.lineTo(x - h * 0.32, y); g.closePath(); g.fill();
  }
}
function groundSpecks(g, w, h, hy, n, cols, r) {
  for (let i = 0; i < n; i++) {
    const y = hy + Math.pow(r(), 0.8) * (h - hy), x = r() * w, s = 1 + (y - hy) / (h - hy) * 2.5;
    g.fillStyle = cols[Math.floor(r() * cols.length)];
    g.fillRect(x, y, s, s * (0.6 + r()));
  }
}

const PAINT = {
  thornwood(g, w, h, hy, r) {
    g.fillStyle = lin(g, 0, 0, 0, hy, [[0, '#6aa0cc'], [1, '#cfe3ea']]); g.fillRect(0, 0, w, hy + 2);
    g.fillStyle = 'rgba(255,250,220,.5)'; g.beginPath(); g.arc(w * 0.8, hy * 0.35, hy * 0.18, 0, 7); g.fill();
    hills(g, w, hy, hy * 0.35, '#8fb0a0', r, 4);
    pines(g, w, hy, 40, 14, 26, '#5a7e68', r);
    pines(g, w, hy + 4, 18, 30, 52, '#2f5a3a', r);
    g.fillStyle = lin(g, 0, hy, 0, h, [[0, '#4f8040'], [1, '#24461f']]); g.fillRect(0, hy, w, h - hy);
    groundSpecks(g, w, h, hy, 500, ['#3a6a30', '#6a9a4a', '#2a5224', '#e8e0a0'], r);
  },
  millroad(g, w, h, hy, r) {
    g.fillStyle = lin(g, 0, 0, 0, hy, [[0, '#d8704a'], [0.6, '#f0b070'], [1, '#f8dca0']]); g.fillRect(0, 0, w, hy + 2);
    g.fillStyle = 'rgba(255,230,160,.9)'; g.beginPath(); g.arc(w * 0.72, hy * 0.82, hy * 0.22, 0, 7); g.fill();
    hills(g, w, hy, hy * 0.3, '#9a6a50', r, 4);
    // windmill on a hill
    const mx = w * 0.22, my = hy - hy * 0.12;
    g.fillStyle = '#4a3028';
    g.beginPath(); g.moveTo(mx - 8, my); g.lineTo(mx + 8, my); g.lineTo(mx + 5, my - 34); g.lineTo(mx - 5, my - 34); g.closePath(); g.fill();
    g.strokeStyle = '#4a3028'; g.lineWidth = 3;
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; g.beginPath(); g.moveTo(mx, my - 32); g.lineTo(mx + Math.cos(a) * 26, my - 32 + Math.sin(a) * 26); g.stroke(); }
    g.fillStyle = lin(g, 0, hy, 0, h, [[0, '#9a8450'], [1, '#5a4626']]); g.fillRect(0, hy, w, h - hy);
    g.fillStyle = 'rgba(200,170,120,.45)';
    g.beginPath(); g.moveTo(w * 0.42, hy); g.lineTo(w * 0.58, hy); g.lineTo(w * 0.95, h); g.lineTo(w * 0.05, h); g.closePath(); g.fill();
    g.fillStyle = '#5a4030';
    for (let x = 6; x < w; x += 26) { g.fillRect(x, hy + 6, 3, 12); }
    g.fillRect(0, hy + 9, w, 2);
    groundSpecks(g, w, h, hy, 400, ['#7a6438', '#b09a60', '#5a4a2a'], r);
  },
  barrows(g, w, h, hy, r) {
    g.fillStyle = lin(g, 0, 0, 0, hy, [[0, '#46506a'], [1, '#a0a8b8']]); g.fillRect(0, 0, w, hy + 2);
    g.fillStyle = '#3e4e46';
    for (let i = 0; i < 5; i++) { const x = r() * w, rw = 40 + r() * 70; g.beginPath(); g.ellipse(x, hy + 4, rw, 18 + r() * 14, 0, Math.PI, 0); g.fill(); }
    g.fillStyle = '#6a6e74';
    for (let i = 0; i < 7; i++) { const x = r() * w, sh = 14 + r() * 14; g.fillRect(x, hy - sh + 4, 6 + r() * 4, sh); }
    g.fillStyle = lin(g, 0, hy, 0, h, [[0, '#4e5e50'], [1, '#26322a']]); g.fillRect(0, hy, w, h - hy);
    groundSpecks(g, w, h, hy, 400, ['#3a4a3e', '#5e6e60', '#8a8e88'], r);
    for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(220,225,235,.10)'; g.fillRect(0, hy - 6 + i * 22 + r() * 10, w, 10 + r() * 8); }
  },
  fenmire(g, w, h, hy, r) {
    g.fillStyle = lin(g, 0, 0, 0, hy, [[0, '#2a3e3a'], [1, '#748e80']]); g.fillRect(0, 0, w, hy + 2);
    g.strokeStyle = '#1c2a26'; g.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const x = r() * w, th = 30 + r() * 30;
      g.beginPath(); g.moveTo(x, hy + 4); g.lineTo(x + (r() - 0.5) * 6, hy - th);
      g.moveTo(x, hy - th * 0.6); g.lineTo(x + 12 * (r() < 0.5 ? -1 : 1), hy - th * 0.9); g.stroke();
    }
    g.fillStyle = lin(g, 0, hy, 0, h, [[0, '#34463a'], [1, '#18241c']]); g.fillRect(0, hy, w, h - hy);
    g.fillStyle = 'rgba(40,70,70,.8)'; g.fillRect(0, hy + (h - hy) * 0.18, w, (h - hy) * 0.22);
    g.strokeStyle = 'rgba(180,220,210,.25)'; g.lineWidth = 1;
    for (let i = 0; i < 30; i++) { const y = hy + (h - hy) * (0.2 + r() * 0.18), x = r() * w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 + r() * 20, y); g.stroke(); }
    g.strokeStyle = '#2a3a22'; g.lineWidth = 2;
    for (let i = 0; i < 60; i++) { const x = r() * w, y = hy + 2 + r() * 10, l = 10 + r() * 18; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y - l); g.stroke(); }
    groundSpecks(g, w, h, hy, 300, ['#2a3a2a', '#4a5a3a'], r);
    for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(200,220,210,.09)'; g.fillRect(0, hy - 10 + i * 30 + r() * 12, w, 14); }
  },
  tower(g, w, h, hy, r) {
    g.fillStyle = lin(g, 0, 0, 0, hy, [[0, '#120c24'], [1, '#4a3868']]); g.fillRect(0, 0, w, hy + 2);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`; g.fillRect(r() * w, r() * hy * 0.8, 1, 1); }
    const tx = w * 0.5, tw = w * 0.16;
    g.fillStyle = '#0e0a18';
    g.fillRect(tx - tw / 2, hy - hy * 0.95, tw, hy * 0.95 + 4);
    for (let k = 0; k < 5; k++) g.fillRect(tx - tw / 2 - 3 + k * (tw + 6) / 5, hy - hy * 0.95 - 8, (tw + 6) / 8, 9);
    g.fillRect(tx - tw * 0.9, hy - hy * 0.4, tw * 1.8, hy * 0.4 + 4);
    hills(g, w, hy, hy * 0.18, '#1e182c', r, 4);
    g.fillStyle = lin(g, 0, hy, 0, h, [[0, '#3a3448'], [1, '#1a1724']]); g.fillRect(0, hy, w, h - hy);
    g.fillStyle = '#2a2436';
    for (let i = 0; i < 8; i++) { const x = r() * w, y = hy + 8 + r() * (h - hy) * 0.6, s = 6 + r() * 10; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x, y - s * 1.4); g.lineTo(x + s, y); g.fill(); }
    groundSpecks(g, w, h, hy, 300, ['#2a2436', '#4a4058', '#5a3a7a'], r);
  },
  arena(g, w, h, hy, r) {
    g.fillStyle = '#3a2a20'; g.fillRect(0, 0, w, hy + 4);
    for (let row = 0; row < 6; row++) {
      const y = 6 + row * (hy - 10) / 6;
      g.fillStyle = row % 2 ? '#5a4232' : '#4e3828'; g.fillRect(0, y, w, (hy - 10) / 6);
      for (let x = 4 + (row % 2) * 4; x < w; x += 8 + r() * 3) {
        g.fillStyle = ['#c86a4a', '#e0c070', '#6a8ac8', '#8ac06a', '#d8d0c0', '#a05aa0', '#e8a07a'][Math.floor(r() * 7)];
        g.fillRect(x, y + 2, 4, 5); g.fillStyle = '#e0b48a'; g.fillRect(x + 0.5, y - 1, 3, 3);
      }
    }
    for (const bx of [0.15, 0.5, 0.85]) {
      g.fillStyle = bx === 0.5 ? '#c8a040' : '#9a2a2a';
      g.beginPath(); g.moveTo(w * bx - 10, 0); g.lineTo(w * bx + 10, 0); g.lineTo(w * bx + 10, 30); g.lineTo(w * bx, 24); g.lineTo(w * bx - 10, 30); g.closePath(); g.fill();
    }
    g.fillStyle = '#6a5040'; g.fillRect(0, hy - 2, w, 8);
    g.fillStyle = lin(g, 0, hy, 0, h, [[0, '#d8b878'], [1, '#a8844c']]); g.fillRect(0, hy + 6, w, h - hy);
    g.strokeStyle = 'rgba(140,100,60,.35)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(w / 2, hy + (h - hy) * 0.55, w * 0.42, (h - hy) * 0.32, 0, 0, 7); g.stroke();
    groundSpecks(g, w, h, hy + 6, 300, ['#c8a468', '#e8cc90', '#9a7a48'], r);
  },
};

// Paints the background for an area onto a canvas sized to its box.
function paint(canvas, kind) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const g = canvas.getContext('2d');
  g.scale(dpr, dpr);
  const hy = Math.round(h * 0.32);
  (PAINT[kind] || PAINT.thornwood)(g, w, h, hy, seeded(kind.length * 977 + 3));
}

// Particle effects on a canvas laid over the battlefield.
function fx(field) {
  const c = document.createElement('canvas');
  c.className = 'fxc';
  field.appendChild(c);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = field.clientWidth, h = field.clientHeight;
  c.width = w * dpr; c.height = h * dpr;
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  const P = new root.SIEGEUI.Particles();
  const V = { x0: 0, y0: 0, s: 1, ox: 0, oy: 0 };
  let alive = true, last = performance.now();
  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    P.step(dt);
    g.clearRect(0, 0, w, h);
    P.draw(g, V, false);
    g.globalCompositeOperation = 'lighter'; P.draw(g, V, true); g.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  const where = el => {
    const fr = field.getBoundingClientRect(), img = el && (el.querySelector('img') || el), r = img.getBoundingClientRect();
    return { x: r.left - fr.left + r.width / 2, y: r.top - fr.top + r.height * 0.5, w: r.width, h: r.height };
  };
  const STYLE = {
    phys:   { col: ['#ffffff', '#ffe0b0', '#ffc080'], speed: 140, life: 0.35, size: 4, glow: true },
    fire:   { col: ['#fff0a0', '#ffb84a', '#ff6a2a', '#ff3a1a'], speed: 110, up: 60, life: 0.6, size: 6, glow: true },
    frost:  { col: ['#e0f8ff', '#a0e0ff', '#6ac0ff'], speed: 120, life: 0.55, size: 5, glow: true, shrink: false },
    light:  { col: ['#fff8d0', '#ffe27a', '#ffd040'], speed: 80, up: 70, life: 0.8, size: 4, glow: true },
    dark:   { col: ['#b03aff', '#6a2aaa', '#2a1040'], speed: 100, life: 0.6, size: 6, glow: false },
    nature: { col: ['#8ad06a', '#5aa04a', '#c8f0a0'], speed: 90, up: 30, life: 0.7, size: 5, grav: 120 },
    mag:    { col: ['#c0d0ff', '#8aa0ff', '#ffffff'], speed: 110, life: 0.5, size: 4, glow: true },
    heal:   { col: ['#7aff9a', '#c8ffd0'], speed: 30, up: 70, life: 0.9, size: 4, glow: true },
    poison: { col: ['#8aff6a', '#4ac04a'], speed: 30, up: 40, life: 0.8, size: 5 },
    death:  { col: ['#2a1e3a', '#4a3a6a', '#8a8a9a'], speed: 60, up: 40, life: 0.9, size: 8 },
    surge:  { col: ['#fff0a0', '#ffb84a', '#ff6a2a'], speed: 260, life: 0.9, size: 7, glow: true },
  };
  return {
    hit(el, kind, big) {
      if (!el) return;
      const p = where(el), st = STYLE[kind] || STYLE.mag;
      P.burst(p.x, p.y, big ? 30 : 14, st);
      if (kind === 'phys') {
        const a = Math.random() * Math.PI;
        P.add({ x: p.x, y: p.y, line: [Math.cos(a) * p.w * 0.45, Math.sin(a) * p.w * 0.45], lw: big ? 5 : 3, life: 0.22, col: '#ffffff', glow: true });
      }
      if (kind === 'fire') P.add({ x: p.x, y: p.y, ring: p.w * 0.7, lw: 4, life: 0.4, col: '#ff9a3d', glow: true });
      if (kind === 'frost') for (let i = 0; i < 6; i++) P.add({ x: p.x + (Math.random() - 0.5) * p.w * 0.6, y: p.y - p.h * 0.6, vy: 220, life: 0.3, size: 3, col: '#e0f8ff', glow: true });
    },
    puff(el, kind) { if (el) { const p = where(el); P.burst(p.x, p.y, 16, STYLE[kind] || STYLE.heal); } },
    // A spell or arrow flying from the caster to the target: a glowing head with a trail.
    bolt(from, to, kind, dur) {
      if (!from || !to) return;
      const a = where(from), b = where(to), st = STYLE[kind] || STYLE.mag, n = 10, t = (dur || 0.28);
      for (let i = 0; i < n; i++) {
        const k = i / n;
        setTimeout(() => {
          const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * 18;
          P.add({ x, y, life: 0.25, size: st.size + 2, col: st.col[i % st.col.length], glow: true });
          P.add({ x, y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, life: 0.35, size: st.size * 0.6, col: st.col[0], glow: true });
        }, k * t * 1000);
      }
    },
    // A caster gathering power: sparks drawn in towards them.
    gather(el, kind) {
      if (!el) return;
      const p = where(el), st = STYLE[kind] || STYLE.mag;
      for (let i = 0; i < 14; i++) { const ang = Math.random() * Math.PI * 2, r = 40 + Math.random() * 20; P.add({ x: p.x + Math.cos(ang) * r, y: p.y + Math.sin(ang) * r, vx: -Math.cos(ang) * r * 3, vy: -Math.sin(ang) * r * 3, life: 0.3, size: st.size, col: st.col[i % st.col.length], glow: true }); }
    },
    surge() { P.burst(w / 2, h * 0.55, 80, STYLE.surge); P.add({ x: w / 2, y: h * 0.55, ring: w * 0.6, lw: 6, life: 0.6, col: '#ffb84a', glow: true }); },
    stop() { alive = false; c.remove(); },
  };
}

root.BFX = { paint, fx };
})(this);
