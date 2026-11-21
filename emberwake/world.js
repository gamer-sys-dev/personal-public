// Emberwake world data, layer two: area maps, creatures, events, buildings and the noticeboard.
(function (root) {
'use strict';
const D = root.DATA || require('./data.js');

// ---------- Creatures ----------
// Tamed beasts. Stats scale like enemies. Each evolves at EVO_LVL into one of three forms,
// decided by the stance it spent most turns in.
const CREATURES = {
  rat:      { name: 'Thorn Rat', sprite: 'rat', m: { hp: .85, str: .95, mag: .6, def: .8, res: .7, spd: 1.25 }, attack: ['bite'], support: 'lick',
              evo: { attack: 'Plague Rat', guard: 'Burrow Rat', support: 'Hedge Rat' } },
  wolf:     { name: 'Wolf', sprite: 'wolf', m: { hp: 1.05, str: 1, mag: .6, def: .9, res: .8, spd: 1.15 }, attack: ['bite', 'savage_bite'], support: 'lick',
              evo: { attack: 'Dire Wolf', guard: 'Shieldfang', support: 'Moon Wolf' } },
  boarling: { name: 'Wild Boar', sprite: 'boarling', m: { hp: 1.3, str: 1.05, mag: .5, def: 1.15, res: .8, spd: .9 }, attack: ['gore'], support: 'lick',
              evo: { attack: 'Tusker', guard: 'Ironhide', support: 'Rootboar' } },
  briar:    { name: 'Briar Sprite', sprite: 'briar', m: { hp: .85, str: .5, mag: 1.05, def: .7, res: 1.05, spd: 1 }, attack: ['thorn_lash'], support: 'sap',
              evo: { attack: 'Thornfiend', guard: 'Bramble Guard', support: 'Bloom Sprite' } },
  crows:    { name: 'Crow Swarm', sprite: 'crow', m: { hp: .8, str: .9, mag: .5, def: .6, res: .7, spd: 1.4 }, attack: ['peck'], support: 'lick',
              evo: { attack: 'Murder of Crows', guard: 'Ironbeaks', support: 'Omen Crows' } },
  bat:      { name: 'Grave Bat', sprite: 'bat', m: { hp: .8, str: .95, mag: .6, def: .75, res: .75, spd: 1.4 }, attack: ['drain'], support: 'lick',
              evo: { attack: 'Vampire Bat', guard: 'Cave Warden', support: 'Dusk Bat' } },
  slime:    { name: 'Mire Slime', sprite: 'slime', m: { hp: 1.3, str: .9, mag: .6, def: 1.6, res: .6, spd: .8 }, attack: ['engulf'], support: 'sap',
              evo: { attack: 'Acid Slime', guard: 'Rock Slime', support: 'Dew Slime' } },
  lurker:   { name: 'Bog Lurker', sprite: 'lurker', m: { hp: 1.35, str: 1.1, mag: .5, def: 1.1, res: .8, spd: .8 }, attack: ['drag', 'spit'], support: 'lick',
              evo: { attack: 'Bog Horror', guard: 'Mud Wall', support: 'Reed Lurker' } },
  hound:    { name: 'Shadow Hound', sprite: 'hound', m: { hp: 1, str: 1.15, mag: .6, def: .9, res: .8, spd: 1.35 }, attack: ['bite', 'pounce'], support: 'lick',
              evo: { attack: 'Nightmare Hound', guard: 'Ward Hound', support: 'Shade Hound' } },
};
const EVO_LVL = 8;
const EVO_MULT = {
  attack:  { hp: 1.1, str: 1.4, mag: 1.2, spd: 1.1 },
  guard:   { hp: 1.5, def: 1.5, res: 1.3 },
  support: { hp: 1.15, mag: 1.7, res: 1.3, spd: 1.05 },
};
const STANCES = {
  attack:  { name: 'Attack', desc: 'Goes for the enemy every turn.' },
  guard:   { name: 'Guard', desc: 'Draws attacks away from the party and braces.' },
  support: { name: 'Support', desc: 'Heals whoever is hurt and fires the party up.' },
};

// ---------- Buildings at the keep ----------
const BUILDINGS = {
  yard: { name: 'Training yard', desc: 'Heroes on the bench train while you fight. Behind on levels? Spar to catch up.',
    levels: [
      { gold: 150, mats: { pelt: 3 }, text: 'Bench heroes get 50% of fight XP. Sparring opens.' },
      { gold: 450, mats: { ore: 4, pelt: 2 }, text: 'Bench heroes get 80% of fight XP. Sparring gives more.' },
    ] },
  kennels: { name: 'Kennels', desc: 'Room for the creatures you tame.',
    levels: [
      { gold: 120, mats: { pelt: 2 }, text: 'Room for 4 creatures.' },
      { gold: 400, mats: { ore: 3, pelt: 3 }, text: 'Room for 8 creatures. Creatures in kennels earn half XP.' },
    ] },
};
const YARD_RATE = [0, 0.5, 0.8];
const KENNEL_CAP = [2, 4, 8];

// ---------- Maps ----------
// Grid: x 0 to 4 across, y 0 (far end) to 7 (entrance).
// t: start | fight | treasure | gather | camp | event | den | quest | boss
// need: 'burn' (someone with Fire in the party) | 'lock' (Dace in the party) | 'beast' (Hesk in the party)
// hidden: a flag that must be set before the node shows on the map.
const MAPS = {
  thornwood: {
    nodes: [
      { id: 't0', x: 2, y: 7, t: 'start', name: 'Edge of the wood', desc: 'The keep is a short walk back up the hill.' },
      { id: 't1', x: 2, y: 6, t: 'fight', name: 'Wolf track', desc: 'Fresh prints in the mud.', enemies: [{ t: 'wolf', lvl: 1 }, { t: 'wolf', lvl: 1 }] },
      { id: 't2', x: 1, y: 5, t: 'gather', name: 'Trapper\'s line', desc: 'Old snares. Some still hold something.', mats: { pelt: 2 } },
      { id: 't3', x: 3, y: 5, t: 'treasure', name: 'Hollow log', desc: 'Someone hid supplies here before Ashby fell.', reward: { gold: 40, items: { potion: 2 } } },
      { id: 't4', x: 2, y: 4, t: 'camp', name: 'Stream clearing', desc: 'Clear water and soft ground. A good place to stop.', talks: ['camp_thorn', 'camp_hesk'] },
      { id: 't5', x: 0, y: 5, t: 'fight', name: 'Rat warren', desc: 'The ground is riddled with holes.', enemies: [{ t: 'rat', lvl: 2 }, { t: 'rat', lvl: 2 }, { t: 'rat', lvl: 2 }] },
      { id: 't6', x: 0, y: 4, t: 'treasure', need: 'burn', name: 'Bramble-choked hollow', desc: 'Something glints behind a wall of thorns too thick to cut.', reward: { tome: true } },
      { id: 't7', x: 1, y: 3, t: 'event', ev: 'fox', name: 'A snare', desc: 'Something is thrashing in the undergrowth.' },
      { id: 't8', x: 4, y: 4, t: 'quest', q: 'hesk', name: 'Hermit\'s hut', desc: 'A turf-roofed hut with empty animal pens.' },
      { id: 't9', x: 3, y: 3, t: 'fight', name: 'Briar thicket', desc: 'The thorns move when you aren\'t looking at them.', enemies: [{ t: 'briar', lvl: 2 }, { t: 'briar', lvl: 2 }, { t: 'wolf', lvl: 2 }] },
      { id: 't10', x: 4, y: 2, t: 'fight', hidden: 'hesk_quest', name: 'Poacher camp', desc: 'Cages, a cookfire and three men who don\'t want company.',
        enemies: [{ t: 'cutthroat', lvl: 3 }, { t: 'cutthroat', lvl: 3 }, { t: 'archer', lvl: 3 }], win: { flag: 'poachers', scene: 'poachers_done' } },
      { id: 't11', x: 3, y: 1, t: 'den', need: 'beast', name: 'Boar wallow', desc: 'Wild boar root and wallow here. Hesk could get close enough to tame one.',
        enemies: [{ t: 'boarling', lvl: 3 }, { t: 'boarling', lvl: 3 }], hunt: ['boarling', 'boarling', 'wolf'], reward: { gear: 'wolfbone_bow' } },
      { id: 't12', x: 1, y: 2, t: 'gather', name: 'Mushroom ring', desc: 'Pale mushrooms in a perfect circle. Some are useful.', mats: { pelt: 1 }, items: { potion: 1 } },
      { id: 't13', x: 2, y: 1, t: 'fight', name: 'Trampled path', desc: 'Something huge came through here. Recently.', enemies: [{ t: 'wolf', lvl: 3 }, { t: 'boarling', lvl: 3 }] },
      { id: 't14', x: 2, y: 0, t: 'boss', name: 'Tusk\'s clearing', desc: 'Flattened brambles and the smell of something big.' },
      { id: 't15', x: 0, y: 1, t: 'treasure', need: 'lock', name: 'Old hunting lodge', desc: 'A lord\'s lodge, boarded up. The strongroom lock is solid.', reward: { gold: 120, gear: 'lucky_coin' } },
      { id: 't16', x: 0, y: 2, t: 'treasure', hidden: 'fox_cache', name: 'Fox\'s earth', desc: 'The fox led you to a den full of things it has stolen.', reward: { gold: 80, items: { feather: 1, ether: 1 } } },
    ],
    edges: [['t0', 't1'], ['t1', 't2'], ['t1', 't3'], ['t2', 't5'], ['t5', 't6'], ['t2', 't4'], ['t3', 't4'], ['t4', 't7'], ['t4', 't9'], ['t9', 't8'],
      ['t8', 't10'], ['t10', 't11'], ['t6', 't7'], ['t7', 't12'], ['t7', 't16'], ['t12', 't13'], ['t11', 't13'], ['t13', 't14'], ['t12', 't15'], ['t16', 't15']],
  },
  millroad: {
    nodes: [
      { id: 'm0', x: 2, y: 7, t: 'start', name: 'Thornwood turn-off', desc: 'The road runs east to market. Nobody is on it.' },
      { id: 'm1', x: 2, y: 6, t: 'fight', name: 'Overturned carts', desc: 'Carts on their sides and their loads gone.', enemies: [{ t: 'cutthroat', lvl: 3 }, { t: 'cutthroat', lvl: 3 }] },
      { id: 'm2', x: 1, y: 5, t: 'treasure', name: 'Looted wagon', desc: 'The bandits missed a false floor.', reward: { gold: 90, items: { antidote: 2 } } },
      { id: 'm3', x: 3, y: 5, t: 'gather', name: 'Old quarry', desc: 'Iron streaks in the rock face.', mats: { ore: 2 } },
      { id: 'm4', x: 2, y: 4, t: 'camp', name: 'Waystation', desc: 'An empty waystation with a fire pit still warm.', talks: ['camp_mill', 'camp_dace'] },
      { id: 'm5', x: 0, y: 4, t: 'event', ev: 'scout', name: 'Blood on the road', desc: 'A trail of dark blood leads into a ditch.' },
      { id: 'm6', x: 3, y: 3, t: 'fight', name: 'Crow-picked field', desc: 'The crows here have stopped being afraid of people.', enemies: [{ t: 'crows', lvl: 4 }, { t: 'crows', lvl: 4 }, { t: 'crows', lvl: 4 }] },
      { id: 'm7', x: 4, y: 2, t: 'fight', name: 'Bandit stockade', desc: 'Sharpened stakes, a gate and somebody shouting from inside.',
        enemies: [{ t: 'cutthroat', lvl: 5 }, { t: 'archer', lvl: 5 }, { t: 'cutthroat', lvl: 4 }], win: { flag: 'stockade', scene: 'dace_join', recruit: 'dace' } },
      { id: 'm8', x: 0, y: 2, t: 'treasure', need: 'lock', name: 'Toll house strongbox', desc: 'Rook\'s takings, in an iron box with a very good lock.', reward: { gold: 220, gear: 'stilettos' } },
      { id: 'm9', x: 1, y: 3, t: 'fight', name: 'Milestone ambush', desc: 'A perfect spot for an ambush. Someone else thought so too.', enemies: [{ t: 'cutthroat', lvl: 4 }, { t: 'archer', lvl: 4 }] },
      { id: 'm10', x: 4, y: 4, t: 'den', need: 'beast', name: 'Crow roost', desc: 'A dead oak black with crows. Hesk could coax one down.',
        enemies: [{ t: 'crows', lvl: 4 }, { t: 'crows', lvl: 4 }], hunt: ['crows', 'crows', 'rat'], reward: { items: { ether: 2 } } },
      { id: 'm11', x: 2, y: 2, t: 'treasure', name: 'Ditch-hidden satchel', desc: 'A scholar\'s satchel, soaked but intact.', reward: { tome: true } },
      { id: 'm12', x: 3, y: 1, t: 'gather', name: 'Mill pond', desc: 'Rusted ironwork from the old mill.', mats: { ore: 2 }, items: { potion: 1 } },
      { id: 'm13', x: 2, y: 1, t: 'fight', name: 'Rook\'s lookouts', desc: 'Red sashes in the trees.', enemies: [{ t: 'archer', lvl: 5 }, { t: 'archer', lvl: 5 }, { t: 'cutthroat', lvl: 5 }] },
      { id: 'm14', x: 2, y: 0, t: 'boss', name: 'The red camp', desc: 'Rook the Red holds court on an overturned cart.' },
      { id: 'm15', x: 1, y: 1, t: 'treasure', need: 'burn', name: 'Thorn-sealed chapel', desc: 'A roadside chapel swallowed by briars. Fire would clear it.', reward: { gear: 'boar_spear', items: { ether: 2 } } },
    ],
    edges: [['m0', 'm1'], ['m1', 'm2'], ['m1', 'm3'], ['m2', 'm4'], ['m3', 'm4'], ['m2', 'm5'], ['m3', 'm10'], ['m4', 'm9'], ['m4', 'm6'], ['m5', 'm9'],
      ['m9', 'm8'], ['m10', 'm6'], ['m6', 'm7'], ['m9', 'm11'], ['m6', 'm11'], ['m7', 'm12'], ['m11', 'm13'], ['m12', 'm13'], ['m11', 'm15'], ['m15', 'm13'], ['m13', 'm14']],
  },
};

// Later areas get a generated map until they're hand built in a later layer.
function seeded(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
const GEN = {
  barrows: { names: ['Sunken mound', 'Standing stones', 'Open barrow', 'Grave path', 'Kings\' row', 'Bone pit', 'Mist hollow', 'Broken cairn'], uniqueGear: 'prayer_beads', den: ['bat', 'bat', 'skeleton'] },
  fenmire: { names: ['Reed bed', 'Black pool', 'Sunken boat', 'Causeway', 'Hag\'s hut', 'Drowned grove', 'Eel weir', 'Peat cutting'], uniqueGear: 'fenwitch_staff', den: ['slime', 'lurker', 'slime'] },
  tower:   { names: ['Outer gate', 'Barracks', 'Stair', 'Armoury', 'Chapel of nothing', 'Guard post', 'Long gallery', 'Upper stair'], uniqueGear: 'iron_heart', den: ['hound', 'hound', 'soldier'] },
};
function genMap(area) {
  const g = GEN[area.id], rng = seeded(area.id);
  const nodes = [{ id: 'g0', x: 2, y: 7, t: 'start', name: 'The way in', desc: area.desc }];
  const edges = [];
  let prev = 'g0', n = 1, ni = 0;
  const lvlAt = y => Math.round(area.lvl[0] + (area.lvl[1] - area.lvl[0]) * (7 - y) / 6);
  const pick = () => area.pool[Math.floor(rng() * area.pool.length)];
  const fightAt = y => { const k = area.size[0] + Math.floor(rng() * (area.size[1] - area.size[0] + 1)); const out = []; for (let i = 0; i < k; i++) out.push({ t: pick(), lvl: lvlAt(y) }); return out; };
  const name = () => g.names[(ni++) % g.names.length];
  for (let y = 6; y >= 1; y--) {
    const x = 1 + Math.floor(rng() * 3);
    const id = 'g' + n++;
    const main = y === 4 ? { t: 'camp', name: 'Safe ground', desc: 'Somewhere to stop and breathe.', talks: [] }
      : { t: 'fight', name: name(), desc: 'Hostile ground.', enemies: fightAt(y) };
    nodes.push(Object.assign({ id, x, y }, main));
    edges.push([prev, id]);
    const sx = x <= 2 ? 4 : 0;
    const sid = 'g' + n++;
    let side;
    if (y === 5) side = { t: 'treasure', name: name(), desc: 'Something was left behind here.', reward: { tome: true } };
    else if (y === 3) side = { t: 'den', need: 'beast', name: 'Beast lair', desc: 'Hesk could tame something here.', enemies: fightAt(y).slice(0, 2).map(e => ({ t: g.den[0], lvl: e.lvl })), hunt: g.den, reward: { items: { hi_potion: 2 } } };
    else if (y === 2) side = { t: 'treasure', need: rng() < 0.5 ? 'lock' : 'burn', name: name(), desc: 'Sealed. You\'ll need the right person to get in.', reward: { gear: g.uniqueGear } };
    else if (y === 6) side = { t: 'gather', name: name(), desc: 'Good pickings for the forge.', mats: { [area.mat]: 2 } };
    else side = { t: 'treasure', name: name(), desc: 'A stash.', reward: { gold: 60 + 25 * area.lvl[0], items: { potion: 2 } } };
    nodes.push(Object.assign({ id: sid, x: sx, y }, side));
    edges.push([id, sid]);
    prev = id;
  }
  nodes.push({ id: 'g' + n, x: 2, y: 0, t: 'boss', name: 'The end of the road', desc: 'It is waiting.' });
  edges.push([prev, 'g' + n]);
  return { nodes, edges };
}

// ---------- Events with choices ----------
const EVENTS = {
  fox: {
    lines: [['', 'A fox is caught in a wire snare, half dead from fighting it.'], ['wren', 'Good pelt on that. Just saying.'], ['isolde', 'Wren.']],
    choices: [
      { label: 'Cut it free', out: { flag: 'fox_cache', text: 'The fox limps a few yards, stops and looks back at you. It wants you to follow. A new spot is marked on your map.' } },
      { label: 'Take the pelt', out: { mats: { pelt: 3 }, text: 'Wren is quick and quiet about it. Three good pelts for the forge.' } },
    ],
  },
  scout: {
    lines: [['', 'In the ditch lies a Hollow scout, black armour split open. Whatever is under it is breathing, just.'], ['bram', 'It\'s still alive. If that\'s the word.']],
    choices: [
      { label: 'Question it', out: { flag: 'scout_talked', items: { smoke_bomb: 2 }, text: 'It talks in a voice like wind under a door. Rook\'s men hold a thief in their stockade, the one who robbed Rook blind. And the Hollow pay Rook in silver for warm stones. It dies before it can say more. It had two smoke bombs on it.' } },
      { label: 'End it', out: { xp: 60, mats: { ore: 2 }, text: 'Bram does it quickly. Its armour is good iron under the black. Everyone learns something from how it fought.' } },
    ],
  },
};

// ---------- Story added in layer two ----------
const STORY2 = {
  camp_thorn: [
    ['wren', 'I keep thinking about the bakery. Stupid. Out of everything in Ashby, it\'s the bakery.'],
    ['bram', 'Mam used to send me for the bread. Every morning, before the forge got going.'],
    ['isolde', 'We\'ll have bread again. We\'ll have a keep with a kitchen in it.'],
    ['wren', 'Can it have a roof as well? I\'d settle for a roof.'],
  ],
  camp_hesk: [
    ['hesk', 'Your wolf trusts you. That\'s not nothing. Animals know who the Hollow are. They run from them.'],
    ['isolde', 'Do they run from me? From the stone?'],
    ['hesk', 'No. They come closer. Like you\'re a fire on a cold night.'],
  ],
  camp_mill: [
    ['isolde', 'My master used to walk this road every spring to buy ink. She said the market had the best ink in the north.'],
    ['bram', 'What happened to her?'],
    ['isolde', 'She pushed the stone into my hands and told me to run. I didn\'t look back. I should have looked back.'],
    ['wren', 'No. You did exactly right. That\'s why you\'re here to feel bad about it.'],
  ],
  camp_dace: [
    ['dace', 'So. A smith, a poacher, a witch and me. What\'s the plan, exactly?'],
    ['bram', 'Get strong enough that they stop coming.'],
    ['dace', 'That\'s not a plan, that\'s a wish. But I\'ve robbed worse people for worse reasons. I\'m in.'],
  ],
  hesk_meet: [
    ['', 'A woman in a patched fur hood is sitting on the step of the hut, staring at her empty pens. She has a spear across her knees.'],
    ['hesk', 'If you\'re poachers, you\'re too late. They\'ve already been.'],
    ['bram', 'We\'re from Ashby. What\'s left of it.'],
    ['hesk', 'Then you know what it is to have things taken. Men with red sashes. They took my animals for the Hollow. Something about the beasts being driven at the farms.'],
    ['wren', 'Old Tusk. They\'re the ones who shot him.'],
    ['hesk', 'Their camp is north east, past the thicket. Get my animals back and I\'m yours. I know every beast in this wood and how to talk to it.'],
  ],
  hesk_wait: [['hesk', 'North east, past the thicket. Bring them home.']],
  poachers_done: [
    ['', 'The cages are full. A wolf cub, a pair of hares, a badger with a torn ear. They watch you very carefully.'],
    ['wren', 'Hesk will want these back. Let\'s take them to her hut.'],
  ],
  hesk_join: [
    ['', 'Hesk opens the cages one by one. The animals pour out into the trees. All but the wolf cub, who sits at her feet.'],
    ['hesk', 'This one\'s mother is dead. She\'ll go with whoever is kind to her. That\'s you, it seems.'],
    ['hesk', 'I\'m coming too. The Hollow are using the wild against you. I can turn it back on them.'],
    ['', 'Hesk joins the party. She can tame wounded beasts in battle, and she gives you the wolf cub. Creatures fight beside you and evolve by how you use them.'],
  ],
  hesk_after: [['', 'The hut is quiet. Hesk has left a note on the door for anyone passing: GONE TO WAR. FEED NOTHING.']],
  dace_join: [
    ['', 'Inside the stockade a wiry young man is chained to a post. He looks at the bodies, then at you.'],
    ['dace', 'Well, that\'s my afternoon looking up. Key\'s on the big one. No, the other big one.'],
    ['dace', 'Name\'s Dace. I took Rook\'s strongbox key and his best knives, and he took offence. Get me out and the key\'s yours. So am I, for a while.'],
    ['wren', 'Can we trust him?'],
    ['dace', 'Course not. But I can open any lock in the north, and I hate Rook more than you do.'],
    ['', 'Dace joins the party. He can steal from enemies and pick locks. There are locked places back in Thornwood and along this road.'],
  ],
  surge1: [
    ['', 'As Old Tusk falls, Isolde\'s stone flares so bright that everyone flinches. For a moment all three of them feel it, warm in the chest.'],
    ['isolde', 'Did you feel that? It\'s not just mine. It\'s reaching for all of us.'],
    ['', 'EMBER SURGE unlocked. A shared gauge fills as you fight and carries over between battles. When it\'s full, any hero can unleash their Surge.'],
  ],
  surge2: [
    ['', 'Rook\'s camp burns. The stone drinks in the heat and glows deeper, darker.'],
    ['isolde', 'It\'s stronger. Or I am. I can\'t tell the difference any more.'],
    ['', 'EMBER SURGE II. Surge attacks now hit half as hard again.'],
  ],
};

// ---------- Noticeboard ----------
// Shown at the keep. Each entry is a goal you can see and work towards.
const BOARD = [
  { id: 'surge1', name: 'Ember Surge', how: 'Defeat Old Tusk in Thornwood.' },
  { id: 'hesk', name: 'Recruit: the hermit of Thornwood', how: 'Someone lives in a hut deep in Thornwood. Find them.' },
  { id: 'creatures', name: 'Creatures', how: 'Recruit Hesk. She can tame beasts.' },
  { id: 'yard', name: 'Build: training yard', how: 'Defeat Old Tusk, then build it here.', build: 'yard' },
  { id: 'kennels', name: 'Build: kennels', how: 'Recruit Hesk, then build them here.', build: 'kennels' },
  { id: 'dace', name: 'Recruit: Rook\'s prisoner', how: 'The bandits on the Mill Road are holding someone in their stockade.' },
  { id: 'locks', name: 'Locked places', how: 'Recruit Dace. He can open the lodge in Thornwood and the toll house on the road.' },
  { id: 'trader', name: 'Hob\'s trading post', how: 'Defeat Rook the Red.' },
  { id: 'surge2', name: 'Ember Surge II', how: 'Defeat Rook the Red.' },
  { id: 'evolve', name: 'First evolution', how: 'Raise a creature to level ' + EVO_LVL + '. How you use it decides what it becomes.' },
  { id: 'arena', name: 'The market arena', how: 'Coming in the next update. Past Rook\'s camp lies the market town and its fighting pit.', future: true },
  { id: 'siege', name: 'Defend the keep', how: 'Coming in a later update. The Hollow will come for Emberwake.', future: true },
];

const WORLD = { CREATURES, EVO_LVL, EVO_MULT, STANCES, BUILDINGS, YARD_RATE, KENNEL_CAP, MAPS, genMap, EVENTS, STORY2, BOARD };
if (typeof module !== 'undefined' && module.exports) module.exports = WORLD; else root.WORLD = WORLD;
})(this);
