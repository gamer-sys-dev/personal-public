// Emberwake music and sound.
// Music: a small sequencer playing a written score on real instrument samples rendered from the
// GeneralUser GS soundfont (music/LICENSE.txt). Instruments load in the background after the first tap.
// The score uses leitmotifs: the Ember theme (Isolde and the stone), the Warden's falling chromatic line,
// the Hearth theme (home), and a low choir for the cold thing in the north.
(function (root) {
'use strict';
const BASE = 'music/';

// ---------- notation ----------
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteNum(s) {
  const m = s.match(/^([A-G])(#|b)?(-?\d)$/);
  if (!m) return null;
  return 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
function expand(str) {
  let s = str, prev;
  do { prev = s; s = s.replace(/\(([^()]*)\)x(\d+)/g, (_, body, n) => Array(+n).fill(body).join(' ')); } while (s !== prev);
  return s.replace(/\|/g, ' ').trim().split(/\s+/).filter(Boolean);
}
function chordTones(name) {
  const m = name.match(/^([A-G])(#|b)?(m|dim|sus4|5)?(7|maj7)?$/);
  const r = PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const q = m[3] || '';
  let t = q === 'm' ? [0, 3, 7] : q === 'dim' ? [0, 3, 6] : q === 'sus4' ? [0, 5, 7] : q === '5' ? [0, 7] : [0, 4, 7];
  if (m[4] === '7') t = t.concat([q === 'm' ? 10 : 10]);
  if (m[4] === 'maj7') t = t.concat([11]);
  return { r, t };
}
function chordList(str) { return expand(str).map(tok => { const [c, d] = tok.split(':'); return { c, d: d ? +d : 4 }; }); }

// Compiles a part into events { b: beat, d: beats, i: instrument, n: note or drum, v: volume }.
const DRUM = { k: 'kick', s: 'snare', h: 'hat', c: 'crash', t: 'tom', r: 'ride' };
function compile(part) {
  const ev = [], v = part.vol == null ? 0.5 : part.vol;
  let b = 0;
  if (part.seq) {
    for (const tok of expand(part.seq)) {
      const [what, d] = tok.split(':'), dur = d ? +d : 1;
      if (part.inst === 'drums') { if (what !== '-') for (const k of what.split('+')) ev.push({ b, d: dur, i: 'drums', n: DRUM[k], v: v * (k === 'h' ? 0.45 : 1) }); }
      else if (what !== 'r') for (const n of what.split('+')) ev.push({ b, d: dur * (part.legato || 1), i: part.inst, n: noteNum(n), v });
      b += dur;
    }
    return { ev, len: b };
  }
  const base = 12 * ((part.oct || 3) + 1);
  for (const { c, d } of chordList(part.chords)) {
    const { r, t } = chordTones(c), root = base + r;
    if (part.type === 'pad') for (const x of t.slice(0, 3).concat([12])) ev.push({ b, d, i: part.inst, n: root + x, v });
    if (part.type === 'roots') { let x = 0; for (const rd of part.rhythm || [d]) { if (x >= d) break; ev.push({ b: b + x, d: Math.min(rd, d - x), i: part.inst, n: root, v }); x += rd; } }
    if (part.type === 'chug') { let x = 0; for (const rd of part.rhythm || [0.5]) { if (x >= d) break; for (const y of [0, 7, 12]) ev.push({ b: b + x, d: rd * 0.9, i: part.inst, n: root + y, v: v * (x === 0 ? 1 : 0.75) }); x += rd; } }
    if (part.type === 'arp') {
      const tones = t.slice(0, 3).concat([12, t[1] + 12, t[2] + 12, 24]), step = part.step || 0.5, pat = part.pattern || [0, 1, 2, 3];
      for (let x = 0, k = 0; x < d - 0.001; x += step, k++) ev.push({ b: b + x, d: step * (part.ring || 2), i: part.inst, n: root + tones[pat[k % pat.length]], v });
    }
    b += d;
  }
  return { ev, len: b };
}

// ---------- the score ----------
// Ember theme: D E F A, rising then falling. The Warden: a slow chromatic fall. Hearth: F A C Bb A.
const T = {};
T.title = { bpm: 72, parts: [
  { type: 'pad', inst: 'strings', oct: 3, vol: 0.28, chords: 'Dm Bb F C Dm Bb Gm A Dm Bb F C Gm Bb A A' },
  { type: 'roots', inst: 'bass', oct: 2, vol: 0.4, chords: 'Dm Bb F C Dm Bb Gm A Dm Bb F C Gm Bb A A', rhythm: [4] },
  { type: 'arp', inst: 'harp', oct: 4, vol: 0.22, step: 0.5, pattern: [0, 1, 2, 3, 4, 3, 2, 1], chords: 'Dm Bb F C Dm Bb Gm A Dm Bb F C Gm Bb A A' },
  { inst: 'horn', vol: 0.55, seq: 'D4:1.5 E4:0.5 F4:1 A4:1 | D5:3 C5:0.5 Bb4:0.5 | A4:2 C5:1 F4:1 | G4:3 r:1 | D4:1.5 E4:0.5 F4:1 A4:1 | F5:2 D5:1 Bb4:1 | Bb4:1.5 A4:0.5 G4:1 Bb4:1 | A4:3 r:1 | (r:4)x8' },
  { inst: 'violin', vol: 0.5, legato: 1.05, seq: '(r:4)x8 | D5:1.5 E5:0.5 F5:1 A5:1 | F5:2 D5:1 Bb4:1 | C5:2 A4:1 F4:1 | E4:2 G4:2 | Bb4:2 D5:2 | F5:2 E5:1 D5:1 | C#5:2 E5:2 | A4:4' },
  { type: 'pad', inst: 'choir', oct: 4, vol: 0.2, chords: 'Dm:32 Dm Bb F C Gm Bb A A' },
  { inst: 'timpani', vol: 0.55, seq: 'D2:4 (r:4)x3 D2:4 (r:4)x3 D2:4 (r:4)x3 G2:4 r:4 (A1:0.5)x16' },
] };
T.keep = { bpm: 80, parts: [
  { type: 'arp', inst: 'harp', oct: 4, vol: 0.3, step: 0.5, pattern: [0, 2, 3, 2, 1, 2, 3, 2], chords: 'F C Dm Bb F C Bb C Dm Am Bb F Gm C F F' },
  { type: 'pad', inst: 'strings', oct: 3, vol: 0.18, chords: 'F C Dm Bb F C Bb C Dm Am Bb F Gm C F F' },
  { type: 'roots', inst: 'cello', oct: 2, vol: 0.3, chords: 'F C Dm Bb F C Bb C Dm Am Bb F Gm C F F', rhythm: [2, 2] },
  { inst: 'flute', vol: 0.45, seq: 'F5:1 A5:1 C6:1.5 Bb5:0.5 | A5:1 G5:1 E5:2 | F5:1 A5:1 D6:1.5 C6:0.5 | Bb5:2 A5:1 G5:1 | A5:1.5 G5:0.5 F5:1 C5:1 | E5:1 F5:1 G5:2 | D5:1 F5:1 Bb5:1.5 A5:0.5 | G5:4 | F5:1.5 E5:0.5 D5:1 A5:1 | C6:2 Bb5:1 A5:1 | D6:2 C6:1 Bb5:1 | A5:3 r:1 | G5:1 Bb5:1 D6:1.5 C6:0.5 | Bb5:1 A5:1 G5:2 | F5:2 A5:1 C6:1 | F5:4' },
] };
T.wood = { bpm: 100, parts: [
  { type: 'arp', inst: 'pizz', oct: 3, vol: 0.4, step: 0.5, ring: 1, pattern: [0, 2, 1, 2, 3, 2, 1, 2], chords: 'Em C G D Em C Am B7 Em C G D C D Em Em' },
  { type: 'roots', inst: 'bass', oct: 2, vol: 0.3, chords: 'Em C G D Em C Am B7 Em C G D C D Em Em', rhythm: [2, 2] },
  { type: 'pad', inst: 'strings', oct: 3, vol: 0.12, chords: 'Em C G D Em C Am B7 Em C G D C D Em Em' },
  { inst: 'oboe', vol: 0.45, seq: 'E5:1 G5:0.5 B5:0.5 A5:1 G5:1 | E5:1.5 D5:0.5 E5:1 G5:1 | D5:1 B4:1 D5:1 G5:1 | F#5:3 r:1 | E5:1 G5:0.5 B5:0.5 A5:1 G5:1 | C6:1.5 B5:0.5 A5:1 G5:1 | A5:1 C6:1 E5:1 A5:1 | F#5:2 D#5:2 | (r:4)x8' },
  { inst: 'flute', vol: 0.45, seq: '(r:4)x8 | B5:1.5 A5:0.5 G5:1 E5:1 | G5:1 E5:1 C5:2 | D5:0.5 E5:0.5 G5:1 B5:1 D6:1 | A5:3 F#5:1 | G5:1.5 E5:0.5 C6:2 | A5:1.5 F#5:0.5 D6:2 | B5:2 G5:1 E5:1 | E5:4' },
  { inst: 'drums', vol: 0.25, seq: '(k:1 h:0.5 h:0.5 -:1 h:0.5 h:0.5)x16' },
] };
T.dark = { bpm: 76, parts: [
  { type: 'roots', inst: 'bass', oct: 1, vol: 0.45, chords: 'Dm Dm Bb A Dm Gm Bb A Dm Dm Eb A Gm Bb A A', rhythm: [4] },
  { type: 'pad', inst: 'strings', oct: 3, vol: 0.18, chords: 'Dm Dm Bb A Dm Gm Bb A Dm Dm Eb A Gm Bb A A' },
  { type: 'pad', inst: 'choir', oct: 3, vol: 0.16, chords: 'Dm:32 Dm Dm Eb A Gm Bb A A' },
  { inst: 'cello', vol: 0.55, legato: 1.05, seq: 'r:4 | A3:2 G#3:1 G3:1 | F3:3 D3:1 | E3:2 C#3:2 | D3:4 | r:2 Bb3:1 A3:1 | G3:2 F3:1 D3:1 | E3:4 | (r:4)x8' },
  { inst: 'oboe', vol: 0.42, seq: '(r:4)x8 | D5:1.5 E5:0.5 F5:1 A5:1 | G5:2 F5:1 E5:1 | G5:3 Bb4:1 | A4:3 r:1 | Bb4:1 D5:1 G5:2 | F5:2 D5:2 | E5:2 C#5:1 E5:1 | A4:4' },
  { inst: 'timpani', vol: 0.45, seq: 'D2:4 (r:4)x3 D2:4 (r:4)x3 D2:4 (r:4)x3 D2:4 r:4 r:4 (A1:1)x4' },
] };
T.battle = { bpm: 150, parts: [
  { type: 'chug', inst: 'guitar', oct: 2, vol: 0.32, rhythm: [0.5], chords: 'Am F G E Am F Dm E Am F G Am F G E E' },
  { type: 'roots', inst: 'ebass', oct: 1, vol: 0.45, rhythm: [0.5], chords: 'Am F G E Am F Dm E Am F G Am F G E E' },
  { type: 'arp', inst: 'strings', oct: 4, vol: 0.18, step: 0.5, ring: 1, pattern: [0, 1, 2, 1, 3, 1, 2, 1], chords: 'Am F G E Am F Dm E Am F G Am F G E E' },
  { inst: 'brass', vol: 0.5, seq: 'A4:1.5 B4:0.5 C5:1 E5:1 | F5:2 E5:1 C5:1 | D5:1.5 E5:0.5 D5:1 B4:1 | E5:3 G#4:1 | A4:1.5 B4:0.5 C5:1 E5:1 | A5:2 G5:1 F5:1 | F5:1 E5:1 D5:1 F5:1 | E5:2 D5:1 B4:1 | C5:1 E5:1 A5:2 | A5:1 G5:1 F5:1 C5:1 | D5:1 G5:1 B5:2 | A5:3 E5:1 | F5:1.5 E5:0.5 D5:1 C5:1 | D5:1.5 C5:0.5 B4:1 D5:1 | E5:2 G#5:2 | B5:4' },
  { inst: 'drums', vol: 0.55, seq: 'k+c:1 s:1 k:0.5 k:0.5 s:1 | (k:1 s:1 k:0.5 k:0.5 s:1)x7 | k+c:1 s:1 k:0.5 k:0.5 s:1 | (k:1 s:1 k:0.5 k:0.5 s:1)x5 | s:0.5 s:0.5 s:0.5 s:0.5 t:0.5 t:0.5 t:0.5 t:0.5 | k+c:1 s:0.5 s:0.5 s:0.5 s:0.5 s:0.25 s:0.25 s:0.25 s:0.25' },
  { inst: 'drums', vol: 0.3, seq: '(h:0.5)x128' },
] };
T.boss = { bpm: 156, parts: [
  { type: 'pad', inst: 'choir', oct: 3, vol: 0.32, chords: 'Dm Bb Gm A Dm Bb Eb A Dm C Bb A Gm Eb A A' },
  { type: 'pad', inst: 'organ', oct: 2, vol: 0.2, chords: 'Dm Bb Gm A Dm Bb Eb A Dm C Bb A Gm Eb A A' },
  { type: 'chug', inst: 'guitar', oct: 2, vol: 0.28, rhythm: [0.5, 0.5, 0.25, 0.25, 0.5], chords: 'Dm Bb Gm A Dm Bb Eb A Dm C Bb A Gm Eb A A' },
  { type: 'roots', inst: 'timpani', oct: 2, vol: 0.5, rhythm: [1, 1, 1, 1], chords: 'Dm Bb Gm A Dm Bb Eb A Dm C Bb A Gm Eb A A' },
  { type: 'arp', inst: 'strings', oct: 4, vol: 0.2, step: 0.5, ring: 1, pattern: [0, 1, 2, 3, 2, 1, 0, 1], chords: 'Dm Bb Gm A Dm Bb Eb A Dm C Bb A Gm Eb A A' },
  { inst: 'brass', vol: 0.55, seq: 'D4:2 A4:2 | Bb4:1.5 A4:0.5 G4:1 F4:1 | G4:2 D5:2 | C#5:2 E5:1 C#5:1 | D5:2 A4:1 F4:1 | Bb4:2 D5:2 | G5:1.5 F5:0.5 Eb5:1 Bb4:1 | A4:2 C#5:1 E5:1 | F5:2 E5:1 D5:1 | E5:2 G5:2 | F5:1 D5:1 Bb4:2 | A4:1 G#4:1 A4:1 C#5:1 | D5:2 G5:2 | G5:1.5 F5:0.5 Eb5:2 | E5:2 C#5:2 | A4:4' },
  { inst: 'cello', vol: 0.45, seq: '(r:4)x8 | A3:1 G#3:1 G3:1 F#3:1 | F3:2 E3:2 | D3:1 C#3:1 D3:2 | A2:4 | (r:4)x4' },
  { inst: 'drums', vol: 0.5, seq: '(k+c:1 s:1 k:1 s:1 | (k:1 s:1 k:0.5 k:0.5 s:1)x3)x4' },
] };
T.siege = { bpm: 116, parts: [
  { type: 'pad', inst: 'strings', oct: 3, vol: 0.2, chords: 'Em C D Em Em C Am B Em G D Em C D B B' },
  { type: 'roots', inst: 'bass', oct: 2, vol: 0.4, rhythm: [1, 1, 1, 1], chords: 'Em C D Em Em C Am B Em G D Em C D B B' },
  { type: 'roots', inst: 'timpani', oct: 2, vol: 0.5, rhythm: [2, 2], chords: 'Em C D Em Em C Am B Em G D Em C D B B' },
  { inst: 'brass', vol: 0.5, seq: 'E4:1 E4:0.5 E4:0.5 G4:1 B4:1 | C5:2 B4:1 A4:1 | A4:1 A4:0.5 A4:0.5 F#4:1 D4:1 | E4:3 r:1 | E4:1 E4:0.5 E4:0.5 G4:1 B4:1 | E5:2 D5:1 C5:1 | C5:1 B4:1 A4:1 C5:1 | B4:3 r:1 | G4:1 G4:0.5 G4:0.5 B4:1 E5:1 | D5:2 B4:2 | A4:1 D5:1 F#5:2 | E5:3 r:1 | C5:1.5 D5:0.5 E5:1 G5:1 | F#5:2 E5:1 D5:1 | D#5:2 F#5:2 | B4:4' },
  { inst: 'horn', vol: 0.35, seq: '(r:4)x8 | E4:2 G4:2 | B3:2 D4:2 | D4:2 A4:2 | B3:4 | E4:2 G4:2 | A4:2 F#4:2 | F#4:4 | D#4:4' },
  { inst: 'drums', vol: 0.45, seq: '(s:0.5 s:0.25 s:0.25 s:1 s:0.5 s:0.5 s:1)x15 | s:0.25 s:0.25 s:0.25 s:0.25 s:0.25 s:0.25 s:0.25 s:0.25 s+c:2' },
] };
T.arena = { bpm: 138, parts: [
  { type: 'chug', inst: 'guitar', oct: 2, vol: 0.3, rhythm: [0.5], chords: 'C G Am F C G F G Am F C G Am F G G' },
  { type: 'roots', inst: 'ebass', oct: 2, vol: 0.45, rhythm: [0.5], chords: 'C G Am F C G F G Am F C G Am F G G' },
  { inst: 'brass', vol: 0.45, seq: 'E5:1 G5:1 C6:1.5 B5:0.5 | D6:2 B5:2 | C6:1 A5:1 E5:1 A5:1 | F5:3 r:1 | E5:1 G5:1 C6:1.5 D6:0.5 | E6:2 D6:1 B5:1 | C6:1 A5:1 F5:1 A5:1 | G5:4 | A5:1.5 B5:0.5 C6:1 E6:1 | D6:2 C6:1 A5:1 | G5:1 C6:1 E6:2 | D6:3 r:1 | C6:1 B5:1 A5:1 E5:1 | F5:1 A5:1 C6:2 | B5:2 D6:2 | G5:4' },
  { inst: 'drums', vol: 0.5, seq: '(k+c:1 s:1 k:0.5 k:0.5 s:1 | (k:1 s:1 k:0.5 k:0.5 s:1)x3)x4' },
  { inst: 'drums', vol: 0.3, seq: '(h:0.5)x128' },
] };
T.sad = { bpm: 62, parts: [
  { type: 'arp', inst: 'piano', oct: 3, vol: 0.32, step: 0.5, ring: 3, pattern: [0, 2, 3, 4, 3, 2, 1, 2], chords: 'Dm Bb F A Dm Gm C F Bb F Gm Dm Bb Gm A Dm' },
  { type: 'pad', inst: 'strings', oct: 3, vol: 0.16, chords: 'Dm Bb F A Dm Gm C F Bb F Gm Dm Bb Gm A Dm' },
  { type: 'roots', inst: 'cello', oct: 2, vol: 0.3, rhythm: [4], chords: 'Dm Bb F A Dm Gm C F Bb F Gm Dm Bb Gm A Dm' },
  { inst: 'violin', vol: 0.45, legato: 1.05, seq: 'A4:1.5 D5:0.5 F5:2 | F5:1.5 E5:0.5 D5:2 | C5:2 A4:2 | C#5:3 E5:1 | D5:1.5 E5:0.5 F5:1 A5:1 | Bb5:2 A5:1 G5:1 | G5:2 E5:2 | F5:4 | (r:4)x8' },
  { inst: 'piano', vol: 0.5, seq: '(r:4)x8 | D5:1.5 F5:0.5 Bb5:2 | A5:2 F5:1 C5:1 | Bb4:1 D5:1 G5:2 | F5:2 A4:2 | D5:1.5 C5:0.5 Bb4:1 D5:1 | G5:2 F5:1 E5:1 | E5:2 C#5:2 | D5:4' },
] };
T.dread = { bpm: 66, parts: [
  { type: 'roots', inst: 'bass', oct: 1, vol: 0.45, rhythm: [4], chords: 'Dm Dm Eb Eb Dm Dm Bb A' },
  { type: 'pad', inst: 'choir', oct: 3, vol: 0.3, chords: 'D5 D5 Eb5 Eb5 D5 D5 Bb5 A5' },
  { type: 'pad', inst: 'organ', oct: 2, vol: 0.14, chords: 'Dm Dm Eb Eb Dm Dm Bb A' },
  { inst: 'cello', vol: 0.55, legato: 1.05, seq: 'A2:2 G#2:2 | G2:2 F#2:2 | F2:4 | E2:2 Eb2:2 | D2:4 | r:4 | F2:2 E2:2 | A1:4' },
  { inst: 'timpani', vol: 0.4, seq: '(D2:0.5 D2:0.5 r:3)x6 (A1:0.5 A1:0.5 r:3)x2' },
] };
T.victory = { bpm: 120, once: true, parts: [
  { inst: 'brass', vol: 0.55, seq: 'G4:0.5 C5:0.5 E5:0.5 G5:1.5 E5:0.5 G5:3' },
  { inst: 'strings', vol: 0.3, seq: 'C4+E4+G4:3 C4+F4+A4:0.5 C4+E4+G4:3' },
  { inst: 'timpani', vol: 0.5, seq: 'C2:0.5 C2:0.5 C2:0.5 G1:1.5 C2:3.5' },
] };
T.defeat = { bpm: 60, once: true, parts: [
  { inst: 'strings', vol: 0.4, seq: 'A3+C4+E4:2 G3+Bb3+D4:2 F3+A3+C4:4' },
  { inst: 'cello', vol: 0.4, seq: 'A2:2 G2:2 F2:4' },
] };
const COMPILED = {};
function track(name) {
  if (COMPILED[name]) return COMPILED[name];
  const tr = T[name];
  if (!tr) return null;
  let ev = [], len = 0;
  for (const p of tr.parts) { const c = compile(p); ev = ev.concat(c.ev); len = Math.max(len, c.len); }
  ev.sort((a, b) => a.b - b.b);
  const insts = [...new Set(ev.map(e => e.i))];
  return (COMPILED[name] = { name, bpm: tr.bpm, once: !!tr.once, ev, len, insts });
}

// ---------- samples ----------
let ctx = null, master = null, musicBus = null, sfxGain = null, noise = null, reverb = null;
let manifest = null, loading = null;
const buf = {}, pending = {};
const ENV = { // attack, release (seconds)
  strings: [0.18, 0.6], violin: [0.06, 0.4], cello: [0.06, 0.4], bass: [0.03, 0.3], pizz: [0, 0.2], harp: [0, 0.8],
  timpani: [0, 1.2], choir: [0.25, 0.8], horn: [0.05, 0.4], brass: [0.02, 0.25], flute: [0.04, 0.3], oboe: [0.03, 0.3],
  piano: [0, 1.0], organ: [0.05, 0.4], guitar: [0, 0.15], ebass: [0, 0.15], drums: [0, 0.3],
};
function decode(ab) { return new Promise((res, rej) => { const p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); }); }
async function loadInst(name) {
  if (buf[name]) return buf[name];
  if (pending[name]) return pending[name];
  pending[name] = (async () => {
    if (!manifest) manifest = await (await fetch(BASE + 'manifest.json')).json();
    const info = manifest[name];
    const ab = await (await fetch(BASE + name + '.mp3')).arrayBuffer();
    const b = await decode(ab);
    const data = b.getChannelData(0), sr = b.sampleRate, count = (info.notes || info.keys).length;
    // Find each note's true start, whatever padding the decoder added.
    const starts = [];
    for (let i = 0; i < count; i++) {
      const s0 = Math.max(0, Math.floor((info.start + i * info.slot - 0.12) * sr)), s1 = Math.min(data.length, s0 + Math.floor(0.5 * sr));
      let at = s0 + Math.floor(0.12 * sr);
      for (let k = s0; k < s1; k++) if (Math.abs(data[k]) > 0.004) { at = k; break; }
      starts.push(at / sr);
    }
    return (buf[name] = { b, starts, info });
  })().catch(() => { pending[name] = null; return null; });
  return pending[name];
}
function sampleNote(inst, n, t, dur, vol, dest) {
  const s = buf[inst];
  if (!s) return;
  const notes = s.info.notes;
  let k = 0;
  for (let i = 1; i < notes.length; i++) if (Math.abs(notes[i] - n) < Math.abs(notes[k] - n)) k = i;
  const rate = Math.pow(2, (n - notes[k]) / 12);
  const [att, rel] = ENV[inst] || [0.02, 0.3];
  const avail = (s.info.slot - 0.2) / rate;
  const hold = Math.max(0.05, Math.min(dur, avail - rel));
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = s.b; src.playbackRate.value = rate;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + Math.max(0.005, att));
  g.gain.setValueAtTime(vol, t + Math.max(hold, att + 0.01));
  g.gain.linearRampToValueAtTime(0, t + Math.max(hold, att + 0.01) + rel);
  src.connect(g); g.connect(dest);
  src.start(t, s.starts[k], (hold + rel + 0.05) * rate);
}
function drumHit(key, t, vol, dest) {
  const s = buf.drums;
  if (!s) return;
  const k = s.info.keys.indexOf(key);
  if (k < 0) return;
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = s.b; g.gain.value = vol;
  src.connect(g); g.connect(dest);
  src.start(t, s.starts[k], key === 'crash' ? 1.3 : 0.6);
}

// ---------- the player ----------
const state = { music: true, sfx: true };
let cur = null, curName = null, trackBus = null, timer = 0, startT = 0, idx = 0, loops = 0;
function unlock() {
  if (!ctx) {
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = state.music ? 0.9 : 0;
    // A gentle room: a short convolution reverb made from decaying noise.
    reverb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 2.2), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    reverb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.22;
    musicBus.connect(master); musicBus.connect(reverb); reverb.connect(wet); wet.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = state.sfx ? 0.7 : 0; sfxGain.connect(master);
    const nl = ctx.sampleRate;
    noise = ctx.createBuffer(1, nl, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < nl; i++) d[i] = Math.random() * 2 - 1;
    // Load everything in the background, the current track's instruments first.
    const want = curName && track(curName) ? track(curName).insts : [];
    const all = ['strings', 'harp', 'horn', 'violin', 'bass', 'choir', 'timpani', 'flute', 'cello', 'pizz', 'oboe', 'brass', 'guitar', 'ebass', 'drums', 'piano', 'organ'];
    loading = (async () => { for (const n of want.concat(all.filter(x => !want.includes(x)))) await loadInst(n); })();
    if (curName) { const n = curName; curName = null; play(n); }
  }
  if (ctx.state === 'suspended') ctx.resume();
}
function play(name) {
  if (name === curName) return;
  curName = name;
  if (!ctx) return;
  // Fade the old track out over a second and a half.
  if (trackBus) { const old = trackBus; old.gain.cancelScheduledValues(ctx.currentTime); old.gain.setValueAtTime(old.gain.value, ctx.currentTime); old.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5); setTimeout(() => old.disconnect(), 2000); }
  trackBus = null; cur = null;
  const tr = name && track(name);
  if (!tr) return;
  Promise.all(tr.insts.map(loadInst)).then(() => {
    if (curName !== name) return;
    trackBus = ctx.createGain(); trackBus.gain.value = 0; trackBus.connect(musicBus);
    trackBus.gain.linearRampToValueAtTime(1, ctx.currentTime + 1);
    cur = tr; idx = 0; loops = 0; startT = ctx.currentTime + 0.15;
    if (!timer) timer = setInterval(tick, 40);
  });
}
function stop() { play(null); }
function tick() {
  if (!ctx || !cur || !trackBus) return;
  const spb = 60 / cur.bpm, horizon = ctx.currentTime + 0.35;
  while (true) {
    if (idx >= cur.ev.length) {
      if (cur.once) { cur = null; return; }
      idx = 0; loops++; startT += cur.len * spb;
    }
    const e = cur.ev[idx], t = startT + e.b * spb;
    if (t > horizon) break;
    if (t >= ctx.currentTime - 0.05) {
      if (e.i === 'drums') drumHit(e.n, t, e.v, trackBus);
      else sampleNote(e.i, e.n, t, e.d * spb, e.v, trackBus);
    }
    idx++;
  }
}

// ---------- sound effects (synthesised, short) ----------
const freq = m => 440 * Math.pow(2, (m - 69) / 12);
function tone(type, f, t, dur, vol, dest, slideTo) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
}
function hiss(t, dur, vol, dest, hp, lp) {
  const s = ctx.createBufferSource(), g = ctx.createGain();
  s.buffer = noise;
  let node = s;
  if (hp) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; node.connect(f); node = f; }
  if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; node.connect(f); node = f; }
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  node.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
const SFX = {
  hit(t) { if (buf.drums) drumHit('tom', t, 0.35, sfxGain); hiss(t, 0.08, 0.25, sfxGain, 500, 5000); },
  crit(t) { if (buf.drums) drumHit('snare', t, 0.6, sfxGain); hiss(t, 0.16, 0.4, sfxGain, 300); },
  magic(t) { if (buf.harp) [0, 4, 7, 11].forEach((s, i) => sampleNote('harp', 72 + s, t + i * 0.04, 0.3, 0.3, sfxGain)); else tone('triangle', 600, t, 0.3, 0.08, sfxGain, 1800); },
  fire(t) { hiss(t, 0.4, 0.35, sfxGain, 150, 2500); if (buf.timpani) sampleNote('timpani', 40, t, 0.3, 0.3, sfxGain); },
  frost(t) { if (buf.harp) [0, 7, 12, 19].forEach((s, i) => sampleNote('harp', 84 + s, t + i * 0.035, 0.25, 0.25, sfxGain)); else tone('triangle', 1400, t, 0.12, 0.06, sfxGain); },
  heal(t) { if (buf.harp) [0, 4, 7, 12, 16].forEach((s, i) => sampleNote('harp', 67 + s, t + i * 0.06, 0.4, 0.3, sfxGain)); else [0, 4, 7].forEach((s, i) => tone('sine', freq(72 + s), t + i * 0.06, 0.25, 0.12, sfxGain)); },
  ko(t) { if (buf.timpani) sampleNote('timpani', 36, t, 0.5, 0.35, sfxGain); else tone('square', 400, t, 0.35, 0.1, sfxGain, 60); },
  level(t) { if (buf.brass) [0, 4, 7, 12].forEach((s, i) => sampleNote('brass', 67 + s, t + i * 0.1, i === 3 ? 0.6 : 0.15, 0.35, sfxGain)); },
  tame(t) { if (buf.harp) [0, 4, 7, 12, 16, 19].forEach((s, i) => sampleNote('harp', 72 + s, t + i * 0.05, 0.4, 0.3, sfxGain)); },
  victory() { play('victory'); },
  defeat() { play('defeat'); },
  surge(t) { hiss(t, 0.9, 0.35, sfxGain, 100, 3000); if (buf.choir) [0, 7, 12].forEach(s => sampleNote('choir', 62 + s, t, 0.8, 0.3, sfxGain)); if (buf.timpani) sampleNote('timpani', 38, t, 0.8, 0.5, sfxGain); },
  boom(t) { hiss(t, 0.6, 0.5, sfxGain, 0, 900); if (buf.timpani) sampleNote('timpani', 33, t, 0.6, 0.6, sfxGain); },
  place(t) { if (buf.drums) drumHit('tom', t, 0.25, sfxGain); },
  gate(t) { hiss(t, 0.25, 0.4, sfxGain, 0, 600); if (buf.drums) drumHit('kick', t, 0.7, sfxGain); },
  click(t) { tone('square', 900, t, 0.03, 0.02, sfxGain); },
};
const lastSfx = {};
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
  if (musicBus) musicBus.gain.value = state.music ? 0.9 : 0;
  if (sfxGain) sfxGain.gain.value = state.sfx ? 0.7 : 0;
}

root.AUDIO = { unlock, play, stop, sfx, set, state, TRACKS: T, track, loadInst, _ctx: () => ctx };
})(this);
