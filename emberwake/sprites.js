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
  ram: [
    '....................',
    '......kkkkkkkk......',
    '....kkRRRRRRRRkk....',
    '...kRRrRRRRrRRRRk...',
    '..kRRRRRRrRRRRRRRk..',
    '.kkkkkkkkkkkkkkkkkk.',
    'kIIWWWWwWWWWWwWWWWkk',
    'kIIWWWWWWWWWWWWWWWk.',
    '.kkkkkkkkkkkkkkkkkk.',
    '..kBk..........kBk..',
    '.kBbBk........kBbBk.',
    '..kBk..........kBk..',
  ],
  ballista: [
    '................',
    '..k.........k...',
    '..kWk.....kWk...',
    '...kWk...kWk....',
    '....kWkkkWk.....',
    'kIISSSSSSSSSSSk.',
    '....kWWWWWk.....',
    '.....kWWWk......',
    '....kBkkkBk.....',
    '...kBBk.kBBk....',
    '....kk...kk.....',
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
  // Chapter two
  h_knight: { shape: 'knight', flip: true, pal: { k: '#05030a', H: '#3a2a1a', S: '#4a3e30', E: '#ff3a3a', A: '#7a5a2a', a: '#b08a3a', B: '#2a1c10', L: '#4a3a24', F: '#1a1208', W: '#c8b080', g: '#d4a630', D: '#5a3a1a', d: '#ff3a3a' } },
  h_crossbow: { shape: 'ranger', flip: true, pal: { k: '#05030a', G: '#2a2438', H: '#1a1424', S: '#3a3450', E: '#ff3a3a', T: '#2a2438', t: '#4a4060', B: '#140e1c', L: '#2a2438', F: '#0e0a14', b: '#5a5478' } },
  cinder_imp: { shape: 'fairy', flip: true, pal: { k: '#1a0804', W: '#ff6a2a', w: '#ffd27a', L: '#b02a10', l: '#ff9a3d', E: '#fff6a0' } },
  ash_hound: { shape: 'wolf', flip: false, pal: { k: '#1a0804', G: '#5a2a1a', g: '#c84a1a', E: '#ffd23a' } },
  drowned_dead: { shape: 'skeleton', flip: true, pal: { k: '#04100e', W: '#8ac0b0', E: '#7affd0' } },
  deep_lurker: { shape: 'slime', pal: { k: '#04100e', G: '#1a4a4a', g: '#0e2a2e', W: '#4a8a8a', E: '#7affd0' } },
  court_guard: { shape: 'knight', flip: true, pal: { k: '#05030a', H: '#14101c', S: '#2a2438', E: '#ffd76a', A: '#1a1424', a: '#3a3450', B: '#0e0a14', L: '#1a1424', F: '#08060c', W: '#d4a630', g: '#ffd76a', D: '#2a2438', d: '#ffd76a' } },
  hollow_noble: { shape: 'mage', flip: true, pal: { k: '#05030a', P: '#3a3020', R: '#d4a630', O: '#ffd76a', o: '#fff6c8', s: '#3a3020', H: '#1a1424', S: '#8a8070', E: '#ff3a3a' } },
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
  // Layer three: militia, Hollow siege troops, arena fighters, the ember fox.
  m_sword:  { shape: 'knight', pal: { k: K, H: '#6a4a2a', S: SKIN, E: EYE, A: '#3f63a0', a: '#7a9ad0', B: '#3a2616', L: '#3a3f53', F: '#2a1c10', W: '#dfe6ee', g: '#d4a630', D: '#2f4f8a', d: '#e0b252' } },
  m_spear:  { shape: 'knight', pal: { k: K, H: '#3a2a1a', S: SKIN, E: EYE, A: '#3f7a4a', a: '#7ab07a', B: '#3a2616', L: '#3a4a3a', F: '#2a1c10', W: '#c8b080', g: '#8a6a3a', D: '#2f5a3a', d: '#e0b252' } },
  m_archer: { shape: 'ranger', pal: { k: K, G: '#2f4f8a', H: '#8a5a2a', S: SKIN, E: EYE, T: '#5a4a3a', t: '#7a6650', B: '#3a2616', L: '#3a3f53', F: '#2a1c10', b: '#a0703a' } },
  m_priest: { shape: 'mage', pal: { k: K, P: '#d8d2c2', R: '#d4a630', O: '#fff0a0', o: '#ffffff', s: '#8a6a3a', H: '#8a8a8a', S: SKIN, E: EYE } },
  m_knight: { shape: 'knight', scale: 1.2, pal: { k: K, H: '#b8c0d0', S: '#b8c0d0', E: '#1a2a4a', A: '#c0c8d8', a: '#eef2f8', B: '#3a2616', L: '#8a94a8', F: '#4a5468', W: '#eef2f8', g: '#d4a630', D: '#2f4f8a', d: '#e0b252' } },
  ballista: { shape: 'ballista', pal: { k: K, W: '#8a5a2a', S: '#dfe6ee', I: '#5a5a6a', B: '#4a3a2a' } },
  ram:      { shape: 'ram', flip: false, scale: 1.4, pal: { k: '#05030a', R: '#3a3048', r: '#4a4060', W: '#5a3a26', w: '#6a4a30', I: '#6a6a7a', B: '#2a2438', b: '#8a84a8' } },
  h_bowman: { shape: 'ranger', flip: true, pal: { k: '#05030a', G: '#2a2438', H: '#1a1424', S: '#3a3450', E: '#ff3a3a', T: '#2a2438', t: '#3a3450', B: '#140e1c', L: '#1a1424', F: '#0a0610', b: '#5a5478' } },
  h_ladder: { shape: 'bandit', flip: true, pal: { k: '#05030a', C: '#2a2438', M: '#1a1424', S: '#3a3450', E: '#ff3a3a', T: '#3a3450', t: '#4a4060', B: '#140e1c', L: '#1a1424', F: '#0a0610', W: '#8a84a8' } },
  h_brute:  { shape: 'knight', flip: true, scale: 1.4, pal: { k: '#05030a', H: '#3a1a2a', S: '#4a2a3a', E: '#ff6a2a', A: '#3a2a3a', a: '#5a3a4a', B: '#1a1014', L: '#2a1a24', F: '#140a10', W: '#a08098', g: '#6a3a4a', D: '#2a1a24', d: '#ff6a2a' } },
  gladiator:{ shape: 'bandit', flip: true, pal: { k: K, C: '#a07a2a', M: '#6a4a1a', S: SKIN, E: EYE, T: '#6a3a2a', t: '#8a5a3a', B: '#3a2616', L: '#5a3a2a', F: '#2a1c10', W: '#e0e6ee' } },
  pitmage:  { shape: 'mage', flip: true, pal: { k: K, P: '#8a2a2a', R: '#e0b252', O: '#ff6a2a', o: '#fff0a0', s: '#4a2a1a', H: '#2a1a1a', S: SKIN, E: EYE } },
  shieldbearer: { shape: 'knight', flip: true, scale: 1.25, pal: { k: K, H: '#7a8494', S: '#7a8494', E: '#1a1a2a', A: '#6a7a8a', a: '#a0aab8', B: '#3a2616', L: '#4a5464', F: '#2a3040', W: '#dfe6ee', g: '#a08040', D: '#8a5a2a', d: '#e0b252' } },
  beastmaster: { shape: 'ranger', flip: true, scale: 1.2, pal: { k: K, G: '#6a4a2a', H: '#1a1410', S: '#c8946a', E: EYE, T: '#4a3a2a', t: '#6a5440', B: '#2a1c10', L: '#3a2a1a', F: '#1a1008', b: '#c8a070' } },
  aldric:   { shape: 'knight', pal: { k: '#0a1420', H: '#9aa8c0', S: '#c8d4e4', E: '#a0f0ff', A: '#8a9ab8', a: '#c8d8f0', B: '#4a5068', L: '#6a7490', F: '#3a4058', W: '#e8f4ff', g: '#d4a630', D: '#3a4a7a', d: '#ffe27a' } },
  morwen:   { shape: 'mage', pal: { k: K, P: '#2a4a3a', R: '#7ad0a0', O: '#7affb0', o: '#e0fff0', s: '#4a3a2a', H: '#1a2a20', S: '#c8d0b0', E: '#2a1a10' } },
  h_catapult: { shape: 'ballista', flip: true, scale: 1.5, pal: { k: '#05030a', W: '#3a2a3a', S: '#8a84a8', I: '#2a2438', B: '#1a1424' } },
  hwren:    { shape: 'ranger', flip: true, pal: { k: '#05030a', G: '#2a2438', H: '#b5652a', S: '#8a8098', E: '#ff3a3a', T: '#3a3450', t: '#4a4060', B: '#140e1c', L: '#1a1424', F: '#0a0610', b: '#5a5478' } },
  hand:     { shape: 'knight', flip: true, scale: 1.4, pal: { k: '#05030a', H: '#140e1c', S: '#2a2438', E: '#ff2a2a', A: '#1a1424', a: '#3a2a3a', B: '#0a0610', L: '#140e1c', F: '#05030a', W: '#c03030', g: '#c03030', D: '#140e1c', d: '#c03030' } },
  emberfox: { shape: 'wolf', flip: false, pal: { k: K, G: '#e0702a', g: '#fff0d8', E: '#ffe07a' } },
};

// Evolved creatures: the base sprite recoloured by the form it took, and a little bigger.
const TINT = { attack: ['#8a1a1a', 0.4, '#ff3030'], guard: ['#8fa0b8', 0.45, '#a0e0ff'], support: ['#f0e0a0', 0.45, '#7affb0'] };
function mix(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function variant(id) {
  const [base, f] = id.split('@');
  const sp = SPRITES[base] || SPRITES.rat;
  const final = f && f.endsWith('2'), form = final ? f.slice(0, -1) : f;
  if (!form || !TINT[form]) return sp;
  const [col, t, eye] = TINT[form], pal = {};
  const tt = final ? Math.min(0.7, t * 1.5) : t;
  for (const k in sp.pal) pal[k] = k === 'k' ? (final ? '#000000' : sp.pal[k]) : k === 'E' ? (final ? '#ffffff' : eye) : mix(sp.pal[k], col, tt);
  return Object.assign({}, sp, { pal, scale: (sp.scale || 1) * (final ? 1.35 : 1.15) });
}
const cache = {}, ccache = {};
// Shading: light falls from above and a little to the left. Tops of shapes catch the light, undersides and
// right edges fall into shadow, so flat pixel art reads as solid. Near-black outline pixels are left alone.
const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const lum = ([r, g, b]) => (0.3 * r + 0.59 * g + 0.11 * b) / 255;
function tint(col, f) {
  if (!/^#[0-9a-f]{6}$/i.test(col)) return col;
  const c = hexRgb(col);
  if (lum(c) < 0.1) return col;
  const out = c.map(v => Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)));
  return '#' + out.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
function paint(g, sp, px) {
  const rows = SHAPES[sp.shape], w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const at = (x, y) => (y >= 0 && y < h && x >= 0 && x < rows[y].length ? sp.pal[rows[y][x]] : null);
  for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
    let col = at(x, y);
    if (!col) continue;
    const up = at(x, y - 1), down = at(x, y + 1), left = at(x - 1, y), right = at(x + 1, y);
    let f = 0;
    if (!up) f += 0.22; else if (!left) f += 0.08;
    if (!down) f -= 0.25; else if (!right) f -= 0.12;
    if (f) col = tint(col, f);
    g.fillStyle = col;
    g.fillRect((sp.flip ? (w - 1 - x) : x) * px, y * px, px, px);
  }
  return { w, h };
}
function spriteCanvas(id, px) {
  px = px || 1;
  const key = id + '@' + px;
  if (ccache[key]) return ccache[key];
  const sp = variant(id), rows = SHAPES[sp.shape];
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const c = document.createElement('canvas');
  c.width = w * px; c.height = h * px;
  paint(c.getContext('2d'), sp, px);
  return (ccache[key] = { canvas: c, w: w * px, h: h * px, scale: sp.scale || 1 });
}
function spriteURL(id, px) {
  px = px || 4;
  const key = id + '@' + px;
  if (cache[key]) return cache[key];
  const sc = spriteCanvas(id, px);
  return (cache[key] = { url: sc.canvas.toDataURL(), w: sc.w, h: sc.h, scale: sc.scale });
}

root.SPRITES = { spriteURL, spriteCanvas, SPRITES, variant };
})(this);
