// Emberwake: cinematics built from the painted art (camera moves, letterbox, weather and fire drawn in code,
// text that fades in line by line), boss arrival cards, the drifting backdrop and embers behind menus.
(function (root) {
'use strict';

// ---------- particles: one small engine shared by cinematics and the menu embers ----------
const KINDS = {
  embers: { n: 70, make: (w, h) => ({ x: Math.random() * w, y: h + Math.random() * h * .4, vx: (Math.random() - .5) * 18, vy: -(25 + Math.random() * 55), r: .8 + Math.random() * 2.2, life: 1, hue: 18 + Math.random() * 25 }) },
  ash:    { n: 60, make: (w, h) => ({ x: Math.random() * w, y: -Math.random() * h, vx: 6 + Math.random() * 12, vy: 14 + Math.random() * 22, r: .8 + Math.random() * 1.8, life: 1, grey: 140 + Math.random() * 80 }) },
  rain:   { n: 140, make: (w, h) => ({ x: Math.random() * w * 1.2, y: -Math.random() * h, vx: -120, vy: 700 + Math.random() * 300, r: 1, life: 1 }) },
  snow:   { n: 70, make: (w, h) => ({ x: Math.random() * w, y: -Math.random() * h, vx: (Math.random() - .5) * 20, vy: 20 + Math.random() * 30, r: 1 + Math.random() * 2.4, life: 1 }) },
  motes:  { n: 40, make: (w, h) => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * 8, vy: -4 - Math.random() * 8, r: .8 + Math.random() * 1.6, life: 1, ph: Math.random() * 6 }) },
  fog:    { n: 9, make: (w, h) => ({ x: Math.random() * w, y: h * (.45 + Math.random() * .5), vx: 6 + Math.random() * 10, vy: 0, r: w * (.25 + Math.random() * .3), life: 1 }) },
};
function particles(canvas, kinds, opts) {
  opts = opts || {};
  const g = canvas.getContext('2d'), dpr = Math.min(2, root.devicePixelRatio || 1);
  let w = 0, h = 0, parts = [], raf = 0, last = 0, alive = true;
  const size = () => { w = Math.min(canvas.clientWidth, 2000); h = Math.min(canvas.clientHeight, 3000); canvas.width = w * dpr; canvas.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const seed = list => {
    parts = [];
    for (const k of list) { const K = KINDS[k]; if (!K) continue; const n = Math.round(K.n * (opts.density || 1));
      for (let i = 0; i < n; i++) { const p = K.make(w, h); p.k = k; if (k === 'embers') p.y = Math.random() * h; parts.push(p); } }
  };
  size(); seed(kinds);
  const tick = t => {
    if (!alive) return;
    const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
    if (Math.min(canvas.clientWidth, 2000) !== w || Math.min(canvas.clientHeight, 3000) !== h) size();
    g.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      const K = KINDS[p.k];
      if (p.k === 'embers') {
        p.vx += (Math.random() - .5) * 40 * dt; p.life -= dt * .22;
        if (p.y < -10 || p.life <= 0) Object.assign(p, K.make(w, h));
        const a = Math.max(0, Math.min(1, p.life)) * (opts.alpha || 1);
        g.fillStyle = `hsla(${p.hue},100%,${60 + p.r * 6}%,${a})`; g.shadowColor = `hsla(${p.hue},100%,55%,${a})`; g.shadowBlur = 8;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); g.shadowBlur = 0;
      } else if (p.k === 'ash' || p.k === 'snow') {
        p.vx += Math.sin(t / 900 + p.r) * 4 * dt;
        if (p.y > h + 10) Object.assign(p, K.make(w, h), { y: -10 });
        g.fillStyle = p.k === 'snow' ? 'rgba(235,240,255,.8)' : `rgba(${p.grey},${p.grey - 10},${p.grey - 20},.7)`;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
      } else if (p.k === 'rain') {
        if (p.y > h) Object.assign(p, K.make(w, h), { y: -20 });
        g.strokeStyle = 'rgba(190,205,230,.35)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + p.vx * .03, p.y + p.vy * .03); g.stroke();
      } else if (p.k === 'motes') {
        if (p.y < -5) p.y = h + 5;
        const a = .35 + .35 * Math.sin(t / 600 + p.ph);
        g.fillStyle = `rgba(${opts.mote || '150,240,220'},${a})`; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
      } else if (p.k === 'fog') {
        if (p.x - p.r > w) p.x = -p.r;
        const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        gr.addColorStop(0, `rgba(${opts.fog || '200,200,210'},.16)`); gr.addColorStop(1, 'rgba(200,200,210,0)');
        g.fillStyle = gr; g.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return { set(list, o) { if (o) opts = o; seed(list || []); }, stop() { alive = false; cancelAnimationFrame(raf); } };
}

// ---------- menu backdrop and embers ----------
let bdEl = null, emb = null;
function backdrop(url) {
  if (!bdEl) { bdEl = document.createElement('div'); bdEl.id = 'backdrop'; document.body.prepend(bdEl); }
  const v = url ? `url("${url}")` : 'none';
  if (bdEl.style.backgroundImage !== v) bdEl.style.backgroundImage = v;
}
function ambient(on) {
  if (on && !emb) {
    const c = document.createElement('canvas'); c.id = 'embers';
    // sized inline so it can never grow, even if the stylesheet fails to load
    c.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:-1;pointer-events:none';
    document.body.prepend(c);
    emb = particles(c, ['embers'], { density: .45, alpha: .7 }); emb.el = c;
  } else if (!on && emb) { emb.stop(); emb.el.remove(); emb = null; }
}
document.addEventListener('visibilitychange', () => { if (document.hidden && emb) { emb.stop(); emb.el.remove(); emb = null; root.__embersWanted = true; } else if (!document.hidden && root.__embersWanted) { root.__embersWanted = false; ambient(true); } });

// ---------- cinematic player ----------
// shot: { bg, from:[scale,x%,y%], to:[scale,x%,y%], dur, fx:[...], fxo:{}, tint, figs:[{src,x,b,h,flip,dark,enter,glow,delay}],
//         text:[lines] | string, title, sub, boss, shake, flash, bars }
function play(shots, done, opts) {
  opts = opts || {};
  const el = document.createElement('div'); el.id = 'cine';
  el.innerHTML = `<div class="stage"></div><canvas class="cfx"></canvas><div class="flash"></div><div class="bars"></div>
    <div class="ctitle"></div><div class="ctext"></div>${opts.noSkip ? '' : '<button class="cskip">Skip</button>'}<div class="ctap">TAP</div>`;
  document.body.appendChild(el);
  const stage = el.querySelector('.stage'), txt = el.querySelector('.ctext'), ttl = el.querySelector('.ctitle'), fl = el.querySelector('.flash');
  const fx = particles(el.querySelector('canvas.cfx'), []);
  let i = -1, timer = 0, lineTimers = [], finished = false, cur = null;
  const end = () => {
    if (finished) return; finished = true; clearTimeout(timer); lineTimers.forEach(clearTimeout);
    el.classList.add('out'); setTimeout(() => { fx.stop(); el.remove(); done && done(); }, 550);
  };
  const allShown = () => [...txt.querySelectorAll('span')].every(s => s.classList.contains('on'));
  const next = () => {
    clearTimeout(timer); lineTimers.forEach(clearTimeout); lineTimers = [];
    i++;
    if (i >= shots.length) { end(); return; }
    const s = shots[i];
    // new layer: painting with a slow camera move, figures, colour wash
    const L = document.createElement('div'); L.className = 'layer'; L.style.opacity = 0; L.style.transition = 'opacity 1.1s';
    const from = s.from || [1.1, 0, 0], to = s.to || [1.2, 0, 0], dur = s.dur || Math.max(4500, (Array.isArray(s.text) ? s.text.join(' ') : s.text || '').length * 60 + 2600);
    if (s.bg) {
      const im = document.createElement('img'); im.className = 'cbg'; im.src = s.bg; im.alt = '';
      if (s.bgFilter) im.style.filter = s.bgFilter;
      const tf = v => `translate(-50%,-50%) translate(${v[1]}%,${v[2]}%) scale(${v[0]})`;
      im.style.transform = tf(from); L.appendChild(im);
      requestAnimationFrame(() => requestAnimationFrame(() => { im.style.transition = `transform ${dur + 1200}ms linear`; im.style.transform = tf(to); }));
    }
    for (const f of s.figs || []) {
      const fi = document.createElement('img'); fi.className = 'fig'; fi.src = f.src; fi.alt = '';
      fi.style.left = (f.x || 50) + '%'; fi.style.bottom = (f.b || 8) + '%'; fi.style.height = (f.h || 40) + 'vh';
      const base = `translateX(-50%)${f.flip ? ' scaleX(-1)' : ''}`;
      const filt = [f.dark ? `brightness(${f.dark})` : '', f.glow ? `drop-shadow(0 0 18px ${f.glow})` : ''].join(' ').trim();
      if (filt) fi.style.filter = filt;
      const startT = { left: ' translateX(-40%)', right: ' translateX(40%)', up: ' translateY(25%)', fade: '' }[f.enter || 'fade'] || '';
      fi.style.opacity = 0; fi.style.transform = base + startT;
      L.appendChild(fi);
      setTimeout(() => { fi.style.opacity = 1; fi.style.transform = base + (f.drift ? ` translateX(${f.drift}%)` : ''); }, 250 + (f.delay || 0));
      if (f.drift) fi.style.transition = `opacity .9s, transform ${dur}ms linear`;
    }
    const sh = document.createElement('div'); sh.className = 'shade';
    sh.style.background = (s.tint ? s.tint + ',' : '') + 'radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,.7) 100%)';
    L.appendChild(sh);
    stage.appendChild(L);
    requestAnimationFrame(() => { L.style.opacity = 1; });
    if (cur) { const old = cur; old.style.opacity = 0; setTimeout(() => old.remove(), 1200); }
    cur = L;
    fx.set(s.fx || [], s.fxo || {});
    el.querySelector('.bars').style.display = s.bars === false ? 'none' : '';
    // title card
    ttl.className = 'ctitle' + (s.boss ? ' boss' : '');
    ttl.innerHTML = s.title ? `<div class="t"${s.titleSize ? ` style="font-size:${s.titleSize}rem"` : ''}>${s.title}</div>${s.sub ? `<div class="s">${s.sub}</div>` : ''}<div class="rule"></div>` : '';
    if (s.title && s.titleDelay) { ttl.style.visibility = 'hidden'; lineTimers.push(setTimeout(() => { ttl.style.visibility = ''; ttl.innerHTML = ttl.innerHTML; }, s.titleDelay)); } else ttl.style.visibility = '';
    // lines fade in one after another
    const lines = s.text ? (Array.isArray(s.text) ? s.text : [s.text]) : [];
    txt.innerHTML = lines.map(t => `<span>${t}</span>`).join('<br>');
    [...txt.querySelectorAll('span')].forEach((sp, k) => lineTimers.push(setTimeout(() => sp.classList.add('on'), 700 + k * 1500)));
    if (s.flash) lineTimers.push(setTimeout(() => { fl.style.background = s.flash; fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go'); }, s.flashAt || 0));
    if (s.shake) lineTimers.push(setTimeout(() => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }, s.shakeAt || s.flashAt || 0));
    if (s.lightning) for (let k = 0; k < 3; k++) lineTimers.push(setTimeout(() => { fl.style.background = '#cfe0ff'; fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go'); }, 900 + k * 2100 + Math.random() * 600));
    timer = setTimeout(next, dur);
  };
  el.addEventListener('click', e => {
    if (e.target.closest('.cskip')) { end(); return; }
    if (!allShown()) { txt.querySelectorAll('span').forEach(sp => sp.classList.add('on')); lineTimers.forEach(clearTimeout); return; }
    next();
  });
  next();
  return end;
}

// A boss steps out of the dark: their painting rises in, a flash and shake, the name lands.
function bossIntro(o, done) {
  const shots = [{
    bg: o.bg, from: [1.25, 0, 4], to: [1.38, 0, 2], dur: 3600, fx: o.fx || ['embers', 'fog'], fxo: { fog: '120,90,90', density: .8 },
    tint: 'linear-gradient(180deg, rgba(60,0,0,.35), rgba(0,0,0,.55))', bgFilter: 'brightness(.6) saturate(1.2)',
    figs: o.src ? [{ src: o.src, x: 50, b: 13, h: o.h || 48, enter: 'up', dark: 1, glow: 'rgba(255,40,20,.45)', flip: o.flip }] : [],
    title: o.name, sub: o.sub, boss: true, titleSize: o.size, titleDelay: 900, flash: 'rgba(255,90,60,.9)', flashAt: 850, shake: true,
  }];
  return play(shots, done, { noSkip: true });
}

root.CINE = { play, bossIntro, backdrop, ambient, particles };
})(this);
