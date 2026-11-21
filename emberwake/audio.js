// Emberwake music and sound, made live with Web Audio. No files to download.
// Each track is a chord progression; bass, arpeggio, a seeded lead melody and drums are built from it.
(function (root) {
'use strict';
const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const freq = m => 440 * Math.pow(2, (m - 69) / 12);
function chord(name) {
  const m = name.match(/^([A-G][b#]?)(m?)(7?)$/);
  const root = NOTE[m[1]], minor = m[2] === 'm';
  const tones = [0, minor ? 3 : 4, 7];
  if (m[3]) tones.push(minor ? 10 : 10);
  return { root, tones };
}
function seeded(seed) {
  let h = seed >>> 0 || 1;
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}

const TRACKS = {
  title:   { bpm: 72, prog: ['Am', 'F', 'C', 'G', 'Am', 'F', 'E', 'E'], style: 'calm', oct: 5, seed: 3 },
  keep:    { bpm: 84, prog: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G'], style: 'calm', oct: 5, seed: 11 },
  wood:    { bpm: 104, prog: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B'], style: 'walk', oct: 5, seed: 21 },
  dark:    { bpm: 86, prog: ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'Gm', 'A'], style: 'walk', oct: 4, seed: 33, dark: true },
  battle:  { bpm: 152, prog: ['Am', 'F', 'G', 'E', 'Am', 'F', 'Dm', 'E'], style: 'battle', oct: 5, seed: 41 },
  boss:    { bpm: 164, prog: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm', 'A'], style: 'battle', oct: 5, seed: 57, heavy: true },
  siege:   { bpm: 126, prog: ['Em', 'C', 'D', 'B', 'Em', 'C', 'Am', 'B'], style: 'march', oct: 5, seed: 63 },
  arena:   { bpm: 142, prog: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'], style: 'battle', oct: 5, seed: 71 },
  sad:     { bpm: 62, prog: ['Am', 'Dm', 'G', 'C', 'F', 'Dm', 'E', 'E'], style: 'calm', oct: 5, seed: 89, nodrums: true },
};

let ctx = null, master = null, musicGain = null, sfxGain = null, noise = null;
let cur = null, curName = null, timer = 0, nextTime = 0, step = 0;
const state = { music: true, sfx: true };

function unlock() {
  if (!ctx) {
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = state.music ? 0.5 : 0; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = state.sfx ? 0.7 : 0; sfxGain.connect(master);
    const len = ctx.sampleRate;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (curName) { const n = curName; curName = null; play(n); }
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(type, f, t, dur, vol, dest, slideTo) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.02);
}
function hiss(t, dur, vol, dest, hp, lp) {
  const s = ctx.createBufferSource(), g = ctx.createGain();
  s.buffer = noise;
  let node = s;
  if (hp) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; node.connect(f); node = f; }
  if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; node.connect(f); node = f; }
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  node.connect(g); g.connect(dest);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
function kick(t, vol) { tone('sine', 140, t, 0.18, vol, musicGain, 40); }

// Builds a repeating lead line for a track: chord tones on strong beats, steps between.
function buildLead(tr) {
  const r = seeded(tr.seed), bars = tr.prog.length, notes = [];
  const scale = tr.prog[0].endsWith('m') ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const key = chord(tr.prog[0]).root;
  // A four bar phrase, played twice; the second time it resolves differently.
  const phrase = [];
  for (let b = 0; b < 4; b++) {
    const ch = chord(tr.prog[b]);
    const rhythm = tr.style === 'calm' ? [0, 4] : tr.style === 'battle' ? [0, 2, 3, 4, 6] : [0, 2, 4, 6];
    const pick = tr.style === 'calm' && r() < 0.5 ? [0, 3, 4] : rhythm;
    for (const pos of pick) {
      let semis;
      if (pos === 0 || r() < 0.55) semis = ch.root - key + ch.tones[Math.floor(r() * ch.tones.length)];
      else semis = scale[Math.floor(r() * scale.length)];
      phrase.push({ bar: b, pos, semis: ((semis % 12) + 12) % 12 + (r() < 0.2 ? 12 : 0), len: pos === 0 && tr.style === 'calm' ? 3 : 1 });
    }
  }
  for (let rep = 0; rep < bars / 4; rep++) for (const n of phrase) {
    const last = rep === bars / 4 - 1 && n.bar === 3;
    notes.push(Object.assign({}, n, { bar: n.bar + rep * 4, semis: last && n.pos >= 4 ? 0 : n.semis }));
  }
  return { notes, key };
}

function play(name) {
  if (name === curName) return;
  curName = name;
  if (!ctx) return;
  cur = TRACKS[name] || null;
  if (cur && !cur.lead) cur.lead = buildLead(cur);
  step = 0; nextTime = ctx.currentTime + 0.12;
  if (!timer) timer = setInterval(tick, 25);
}
function stop() { curName = null; cur = null; }

// The scheduler: queues the next quarter of a second of music, eighth note by eighth note.
function tick() {
  if (!ctx || !cur) return;
  const tr = cur, eighth = 60 / tr.bpm / 2;
  while (nextTime < ctx.currentTime + 0.25) {
    const bar = Math.floor(step / 8) % tr.prog.length, pos = step % 8, ch = chord(tr.prog[bar]);
    const t = nextTime, base = 12 * (tr.oct || 5);
    // bass
    const bassM = 12 * 2 + ch.root + 12;
    if (tr.style === 'calm' ? pos % 4 === 0 : tr.style === 'battle' ? true : pos % 2 === 0)
      tone('triangle', freq(bassM + (tr.style === 'battle' && pos % 2 ? 12 : 0)), t, eighth * (tr.style === 'calm' ? 3.6 : 0.9), 0.22, musicGain);
    // arpeggio
    if (tr.style !== 'march' || pos % 2 === 0) {
      const tones = ch.tones.concat([12]);
      const arpM = base - 12 + ch.root + tones[(tr.style === 'calm' ? pos >> 1 : pos) % tones.length];
      tone('square', freq(arpM), t, eighth * 0.8, tr.style === 'calm' ? 0.03 : 0.035, musicGain);
    }
    // lead
    for (const n of tr.lead.notes) if (n.bar === bar && n.pos === pos) {
      tone(tr.dark ? 'triangle' : 'square', freq(base + tr.lead.key + n.semis), t, eighth * n.len * (tr.style === 'calm' ? 1.6 : 0.95), tr.dark ? 0.11 : 0.06, musicGain);
    }
    // drums
    if (!tr.nodrums) {
      if (tr.style === 'battle') {
        if (pos === 0 || pos === 4 || (tr.heavy && pos === 6)) kick(t, 0.5);
        if (pos === 2 || pos === 6) hiss(t, 0.12, 0.18, musicGain, 1500);
        hiss(t, 0.03, 0.05, musicGain, 7000);
      } else if (tr.style === 'march') {
        if (pos === 0 || pos === 4) kick(t, 0.45);
        if (pos === 2 || pos === 6 || pos === 7) hiss(t, 0.08, 0.13, musicGain, 1800);
      } else if (tr.style === 'walk') {
        if (pos === 0) kick(t, 0.3);
        if (pos === 4) hiss(t, 0.06, 0.08, musicGain, 2500);
        if (pos % 2) hiss(t, 0.02, 0.03, musicGain, 8000);
      }
    }
    nextTime += eighth; step++;
  }
}

const SFX = {
  hit(t) { hiss(t, 0.09, 0.35, sfxGain, 300, 4000); tone('square', 160, t, 0.08, 0.12, sfxGain, 60); },
  crit(t) { hiss(t, 0.16, 0.5, sfxGain, 200); tone('square', 320, t, 0.14, 0.15, sfxGain, 70); },
  magic(t) { tone('square', 300, t, 0.25, 0.08, sfxGain, 1200); tone('triangle', 600, t + 0.04, 0.3, 0.08, sfxGain, 1800); },
  fire(t) { hiss(t, 0.35, 0.35, sfxGain, 200, 2500); tone('sawtooth', 120, t, 0.3, 0.08, sfxGain, 60); },
  frost(t) { for (let i = 0; i < 4; i++) tone('triangle', 1400 + i * 300, t + i * 0.04, 0.12, 0.06, sfxGain); },
  heal(t) { [0, 4, 7, 12].forEach((s, i) => tone('sine', freq(72 + s), t + i * 0.06, 0.25, 0.12, sfxGain)); },
  ko(t) { tone('square', 400, t, 0.35, 0.1, sfxGain, 60); },
  level(t) { [0, 4, 7, 12, 16].forEach((s, i) => tone('square', freq(72 + s), t + i * 0.07, 0.2, 0.07, sfxGain)); },
  tame(t) { [0, 7, 12, 19, 24].forEach((s, i) => tone('sine', freq(76 + s), t + i * 0.05, 0.3, 0.1, sfxGain)); },
  victory(t) { [[0, 0.12], [4, 0.12], [7, 0.12], [12, 0.5]].forEach(([s, d], i) => { tone('square', freq(72 + s), t + i * 0.13, d, 0.08, sfxGain); tone('triangle', freq(48 + s), t + i * 0.13, d, 0.15, sfxGain); }); },
  defeat(t) { [[0, 0.3], [-2, 0.3], [-5, 0.3], [-9, 0.8]].forEach(([s, d], i) => tone('triangle', freq(64 + s), t + i * 0.3, d, 0.15, sfxGain)); },
  surge(t) { hiss(t, 0.8, 0.4, sfxGain, 100, 3000); tone('sawtooth', 80, t, 0.8, 0.12, sfxGain, 400); [0, 7, 12].forEach((s, i) => tone('square', freq(64 + s), t + 0.1 + i * 0.08, 0.5, 0.06, sfxGain)); },
  boom(t) { hiss(t, 0.6, 0.6, sfxGain, 0, 900); kick(t, 0.6); },
  place(t) { tone('triangle', 220, t, 0.08, 0.15, sfxGain, 110); },
  gate(t) { hiss(t, 0.25, 0.4, sfxGain, 0, 600); tone('square', 90, t, 0.2, 0.15, sfxGain, 50); },
  click(t) { tone('square', 900, t, 0.03, 0.03, sfxGain); },
  page(t) { hiss(t, 0.12, 0.08, sfxGain, 3000); },
};
let lastSfx = {};
function sfx(name) {
  if (!ctx || !state.sfx || !SFX[name]) return;
  const now = ctx.currentTime;
  if (lastSfx[name] && now - lastSfx[name] < 0.05) return;
  lastSfx[name] = now;
  SFX[name](now + 0.01);
}
function set(opts) {
  if (opts.music != null) state.music = !!opts.music;
  if (opts.sfx != null) state.sfx = !!opts.sfx;
  if (musicGain) musicGain.gain.value = state.music ? 0.5 : 0;
  if (sfxGain) sfxGain.gain.value = state.sfx ? 0.7 : 0;
}

root.AUDIO = { unlock, play, stop, sfx, set, state, TRACKS };
})(this);
