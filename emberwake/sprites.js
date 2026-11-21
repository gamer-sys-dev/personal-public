// Pixel art drawn from text maps. Each shape is drawn facing left; `flip` mirrors it.
(function (root) {
'use strict';

const SHAPES = {
  knight: [
    '................',
    '......kkkk......',
    '.....kHHHHk.....',
    '....kHHHHHHk....',
    '..W.kSSHHHHk....',
    '..W.kESSHHk.....',
    '..W..kSSSk......',
    '..W.kAAAAAkDD...',
    '..W.kAaAAAkDdD..',
    '.kgkkAaAAAkDdD..',
    '.kSkAAAAAAkDDD..',
    '..kkBBBBBBkDD...',
    '....kLLkLLk.....',
    '....kLLkLLk.....',
    '...kFFkkFFk.....',
    '................',
  ],
  ranger: [
    '................',
    '.....kkkkk......',
    '....kGGGGGk.....',
    '...kGGHHGGGk....',
    '.b.kGSSHGGGk....',
    'b..kSESSGGk.....',
    'b...kSSSGk......',
    'b..kGTTTTGk.....',
    'bkSSkTTtTTk.....',
    'b..kGTTtTTGk....',
    'b...kTTTTTk.....',
    '.b..kBBBBBk.....',
    '....kLLkLLk.....',
    '....kLLkLLk.....',
    '...kFFkkFFk.....',
    '................',
  ],
  mage: [
    '...O............',
    '..OoO...kk......',
    '...O...kPPk.....',
    '...s..kPPPPk....',
    '...s.kPPPPPPk...',
    '...skkkkkkkkkk..',
    '...s.kHSSHHk....',
    '...s.kESSHHk....',
    '...s..kSSSk.....',
    '..kSkPPRPPPk....',
    '...skPPRPPPPk...',
    '...skPPPPPPPk...',
    '...skPPPPPPPPk..',
    '...kPPPPPPPPPPk.',
    '....kkkkkkkkkk..',
    '................',
  ],
  bandit: [
    '................',
    '.....kkkkk......',
    '....kCCCCCk.....',
    '...kCCCCCCCk....',
    '...kCMMSCCCk....',
    '...kMEMSCCk.....',
    '....kMMMCk......',
    '...kCTTTTCk.....',
    '..kSkTTtTTTk....',
    '.kWkkTTtTTTk....',
    'kWk.kTTTTTk.....',
    '.k..kBBBBBk.....',
    '....kLLkLLk.....',
    '....kLLkLLk.....',
    '...kFFkkFFk.....',
    '................',
  ],
  wolf: [
    '................kk.k.',
    '...............kGkkGk',
    '...............kGGGGk',
    '.kk...........kGGEGGkk',
    'kGGk.........kGGGGGGGk',
    '.kGGk........kGGGGkkkk',
    '..kGGkkkkkkkkGGGGGk...',
    '...kGGGGGGGGGGGGGk....',
    '...kGGGGGGGGGGGGGk....',
    '...kgGGGGGGGGGGgGk....',
    '...kgggGGGGGGgggk.....',
    '...kGk.kGk..kGk.kGk...',
    '...kGk.kGk..kGk.kGk...',
    '...kkk.kkk..kkk.kkk...',
  ],
  rat: [
    '................',
    '..........kk....',
    '.........kRRk...',
    '......kkkRRERk..',
    '.....kRRRRRRRRk.',
    'k...kRRRRRRRRRP.',
    '.k.kRRRRRRRRk...',
    '..kRRrrrrRRk....',
    '...kRk..kRk.....',
    '...kk...kk......',
  ],
  boar: [
    '......................',
    '..........kkkkk.......',
    '........kkBBBBBkk.....',
    '......kkBBBBBBBBBkk...',
    '....kkBBBBBBBBBBBBBk..',
    '...kBBBBBBBBBBBBBEBBk.',
    '..kBBBBBBBBBBBBBBBBBBk',
    '.kBBBBBBBBBBBBBBBBBPPk',
    'kBkBBBBBBBBBBBBBBBkPPk',
    '...kBBBbbbbbbbBBBkWkk.',
    '...kBBkkkkkkkkBBk.W...',
    '...kBk.......kBk......',
    '...kBk.......kBk......',
    '...kkk.......kkk......',
  ],
  fairy: [
    '..............',
    '.WW.......WW..',
    'WwwW.kk..WwwW.',
    'WwwWkLLk.WwwW.',
    '.WWkLLELkWW...',
    '...kLLLLk.....',
    '....kLLk......',
    '...kLLLLk.....',
    '..kLLllLLk....',
    '...kLLLLk.....',
    '....kLLk......',
    '.....kk.......',
  ],
  skeleton: [
    '................',
    '.....kkkk.......',
    '....kWWWWk......',
    '...kWWWWWWk.....',
    '...kEWWEWWk.....',
    '...kWWWWWWk.....',
    '....kWkWkk......',
    '.....kWWk.......',
    '..kkkWkkWkkk....',
    '.kWWkWWWWkWWk...',
    '..k.kWkkWk.k....',
    '....kWWWWk......',
    '.....kWWk.......',
    '....kWkkWk......',
    '....kWk.kWk.....',
    '...kkk..kkk.....',
  ],
  wraith: [
    '................',
    '.....kkkkk......',
    '....kGGGGGk.....',
    '...kGGGGGGGk....',
    '...kGEGGEGGk....',
    '...kGGGGGGGk....',
    '..kGGGGGGGGGk...',
    '.kGgGGGGGGGgGk..',
    'kGgkGGGGGGGkgGk.',
    'kgk.kGGGGGk.kgk.',
    '.k..kGGGGGGk.k..',
    '....kGGgGGGk....',
    '...kGGk.kGGGk...',
    '...kGk..kgGk....',
    '..kGk....kGk....',
    '..kk......kk....',
  ],
  bat: [
    '..................',
    'k......kk.k......k',
    'kk....kBBkBk....kk',
    'kBk...kBEBEk...kBk',
    'kBBk..kBBBBk..kBBk',
    'kBBBkkkBBBBkkkBBBk',
    '.kBBBBBBBBBBBBBBk.',
    '..kBBkBBBBBBkBBk..',
    '...kk.kBBBBk.kk...',
    '......kkBBkk......',
    '........kk........',
  ],
  crow: [
    '................',
    '..........kkk...',
    '.........kBBBk..',
    '.........kBEBYY.',
    '..kkk....kBBBk..',
    '.kBBBkkkkBBBk...',
    'kBBBBBBBBBBk....',
    '.kkBBBBBBBk.....',
    '...kBBBBBk......',
    '....kkYkYk......',
    '......Y.Y.......',
  ],
  slime: [
    '................',
    '......kkkk......',
    '....kkGGGGkk....',
    '...kGGGGGGGGk...',
    '..kGGWGGGGGGGk..',
    '..kGWGGEGGEGGk..',
    '.kGGGGGGGGGGGGk.',
    '.kGGGGGGkkGGGGk.',
    'kGGGGGGGGGGGGGGk',
    'kgGGGGGGGGGGGGgk',
    '.kggggggggggggk.',
    '..kkkkkkkkkkkk..',
  ],
};

const SKIN = '#e7b48a', EYE = '#231510', K = '#141018';
// Sprite id -> shape, colours, scale and facing.
const SPRITES = {
  bram:   { shape: 'knight', pal: { k: K, H: '#7a4a24', S: SKIN, E: EYE, A: '#8b97a8', a: '#c3ccd8', B: '#5a3a1e', L: '#4a4f63', F: '#3a2616', W: '#dfe6ee', g: '#d4a630', D: '#7c2b2b', d: '#d4a630' } },
  wren:   { shape: 'ranger', pal: { k: K, G: '#3f6b3a', H: '#b5652a', S: SKIN, E: EYE, T: '#6b4a2b', t: '#8c6640', B: '#3a2616', L: '#4d3b2a', F: '#2a1c10', b: '#a0703a' } },
  isolde: { shape: 'mage',   pal: { k: K, P: '#5b3f8f', R: '#d4a630', O: '#ff9a3d', o: '#fff0b0', s: '#8a5a2b', H: '#d9b56a', S: SKIN, E: EYE } },

  hesk:   { shape: 'ranger', pal: { k: K, G: '#8a7f70', H: '#2e2418', S: '#d9a47a', E: EYE, T: '#5a4a3a', t: '#7a6650', B: '#3a2616', L: '#4a3a2a', F: '#2a1c10', b: '#b89a6a' } },
  dace:   { shape: 'bandit', pal: { k: K, C: '#2f5f6a', M: '#1a2a30', S: SKIN, E: EYE, T: '#3a4a4a', t: '#5a6a6a', B: '#2a1c10', L: '#2a3030', F: '#1a1410', W: '#e0e6ee' } },
  boarling: { shape: 'boar', flip: false, scale: 0.85, pal: { k: K, B: '#6a4a30', b: '#8a6448', E: '#ffd23a', P: '#c88a7a', W: '#f2ead8' } },
  rat:    { shape: 'rat',   flip: false, pal: { k: K, R: '#7a5a48', r: '#a3846c', E: '#ff4a3a', P: '#e0a0a0' } },
  wolf:   { shape: 'wolf',  flip: false, pal: { k: K, G: '#8a8f99', g: '#c5c9cf', E: '#ffd23a' } },
  hound:  { shape: 'wolf',  flip: false, pal: { k: '#05030a', G: '#2c2540', g: '#4a3f6b', E: '#ff3a3a' } },
  briar:  { shape: 'fairy', flip: true,  pal: { k: K, W: '#7fbf5a', w: '#c8f0a0', L: '#4f8a3a', l: '#8fcf6a', E: '#ffef7a' } },
  boar:   { shape: 'boar',  flip: false, scale: 1.4, pal: { k: K, B: '#5a3a26', b: '#7a5440', E: '#ff4a3a', P: '#c88a7a', W: '#f2ead8' } },
  bandit: { shape: 'bandit', flip: true, pal: { k: K, C: '#6b2a2a', M: '#2a2a2a', S: SKIN, E: EYE, T: '#4a3a2a', t: '#6a5440', B: '#2a1c10', L: '#3a3030', F: '#1a1410', W: '#c8ced6' } },
  bandit_archer: { shape: 'ranger', flip: true, pal: { k: K, G: '#7a2e2e', H: '#2a2a2a', S: SKIN, E: EYE, T: '#4a3a2a', t: '#6a5440', B: '#2a1c10', L: '#3a3030', F: '#1a1410', b: '#8a6a3a' } },
  rook:   { shape: 'knight', flip: true, scale: 1.3, pal: { k: K, H: '#2a1a1a', S: SKIN, E: EYE, A: '#a02828', a: '#d04a3a', B: '#2a1c10', L: '#3a3030', F: '#1a1410', W: '#dfe6ee', g: '#d4a630', D: '#4a2a1a', d: '#a02828' } },
  crow:   { shape: 'crow',  flip: false, pal: { k: '#05030a', B: '#26222e', E: '#ffd23a', Y: '#d4a630' } },
  skeleton:{ shape: 'skeleton', flip: true, pal: { k: K, W: '#e8e2cf', E: '#ff5a3a' } },
  bat:    { shape: 'bat',   pal: { k: K, B: '#4a3050', E: '#ff3a5a' } },
  wight:  { shape: 'wraith', flip: true, pal: { k: '#0a1420', G: '#5a7a9a', g: '#8ab0d0', E: '#a0f0ff' } },
  shade:  { shape: 'wraith', flip: true, scale: 1.5, pal: { k: '#0a0614', G: '#4a3a6a', g: '#8a6ac0', E: '#ffd23a' } },
  lurker: { shape: 'slime', pal: { k: K, G: '#4a5a2a', g: '#2e3a1a', W: '#8a9a5a', E: '#ffd23a' } },
  slime:  { shape: 'slime', pal: { k: K, G: '#3a8a6a', g: '#2a6a4a', W: '#a0f0d0', E: '#141018' } },
  hag:    { shape: 'mage',  flip: true, pal: { k: K, P: '#3a5a3a', R: '#8a7a3a', O: '#7aff9a', o: '#e0ffe0', s: '#5a4a2a', H: '#c8c8b8', S: '#a8c090', E: '#ffd23a' } },
  drowned:{ shape: 'knight', flip: true, scale: 1.4, pal: { k: '#061410', H: '#2a5a5a', S: '#7aa098', E: '#c0ffef', A: '#3a6a5a', a: '#6aa08a', B: '#2a3a2a', L: '#2a4a4a', F: '#1a2a2a', W: '#a0c0b8', g: '#8a7a3a', D: '#2a4a3a', d: '#d4a630' } },
  soldier:{ shape: 'knight', flip: true, pal: { k: '#05030a', H: '#2a2438', S: '#3a3450', E: '#ff3a3a', A: '#3a3450', a: '#5a5478', B: '#1a1424', L: '#2a2438', F: '#140e1c', W: '#8a84a8', g: '#5a5478', D: '#2a2438', d: '#ff3a3a' } },
  acolyte:{ shape: 'mage',  flip: true, pal: { k: '#05030a', P: '#2a1e3a', R: '#8a2a4a', O: '#b03aff', o: '#f0c0ff', s: '#3a2a3a', H: '#1a1424', S: '#5a5078', E: '#ff3a3a' } },
  warden: { shape: 'knight', flip: true, scale: 1.75, pal: { k: '#05030a', H: '#1a1424', S: '#2a2438', E: '#ffb03a', A: '#2a2438', a: '#4a3f6b', B: '#140e1c', L: '#1a1424', F: '#0a0610', W: '#b0a0e0', g: '#ffb03a', D: '#1a1424', d: '#ffb03a' } },
};

// Evolved creatures: the base sprite recoloured by the form it took, and a little bigger.
const TINT = { attack: ['#8a1a1a', 0.4, '#ff3030'], guard: ['#8fa0b8', 0.45, '#a0e0ff'], support: ['#f0e0a0', 0.45, '#7affb0'] };
function mix(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function variant(id) {
  const [base, form] = id.split('@');
  const sp = SPRITES[base] || SPRITES.rat;
  if (!form || !TINT[form]) return sp;
  const [col, t, eye] = TINT[form], pal = {};
  for (const k in sp.pal) pal[k] = k === 'k' ? sp.pal[k] : k === 'E' ? eye : mix(sp.pal[k], col, t);
  return Object.assign({}, sp, { pal, scale: (sp.scale || 1) * 1.15 });
}
const cache = {};
function spriteURL(id, px) {
  px = px || 4;
  const key = id + '@' + px;
  if (cache[key]) return cache[key];
  const sp = variant(id);
  const rows = SHAPES[sp.shape];
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const c = document.createElement('canvas');
  c.width = w * px; c.height = h * px;
  const g = c.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const col = sp.pal[ch];
      if (!col) continue;
      g.fillStyle = col;
      const dx = sp.flip ? (w - 1 - x) : x;
      g.fillRect(dx * px, y * px, px, px);
    }
  });
  return (cache[key] = { url: c.toDataURL(), w: w * px, h: h * px, scale: sp.scale || 1 });
}

root.SPRITES = { spriteURL, SPRITES, variant };
})(this);
