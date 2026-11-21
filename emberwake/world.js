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
  emberfox: { name: 'Ember Fox', sprite: 'emberfox', rare: true, m: { hp: 1, str: 1.05, mag: 1.3, def: .9, res: 1.1, spd: 1.3 }, attack: ['fox_flame', 'bite'], support: 'sap',
              evo: { attack: 'Blaze Fox', guard: 'Hearth Fox', support: 'Dawn Fox' } },
  hound:    { name: 'Shadow Hound', sprite: 'hound', m: { hp: 1, str: 1.15, mag: .6, def: .9, res: .8, spd: 1.35 }, attack: ['bite', 'pounce'], support: 'lick',
              evo: { attack: 'Nightmare Hound', guard: 'Ward Hound', support: 'Shade Hound' } },
};
const EVO_LVL = 8, EVO2_LVL = 16;
// Where each kind of beast can be found. Shown in the bestiary.
const HABITAT = {
  rat: 'Thornwood, all over. The rat warren is thick with them.',
  wolf: 'Thornwood and the Mill Road. Hunt at the boar wallow too.',
  boarling: 'Thornwood, at the boar wallow.',
  briar: 'Thornwood, in the briar thicket.',
  crows: 'The Mill Road. Hunt at the crow roost.',
  bat: 'The Barrow Hills. Hunt at the bat roost.',
  slime: 'Fenmire. Hunt at the slime pools.',
  lurker: 'Fenmire, in the reed beds and slime pools.',
  hound: 'The Hollow Tower. Hunt at the hound pens.',
  emberfox: 'Only one exists. It\'s the prize for winning the Silver rank at the Brightwater arena.',
};
// Rewards for taming different kinds of beast.
const DEX_REWARDS = { 3: { items: { feather: 2 } }, 5: { tome: true }, 8: { tome: true }, 10: { gear: 'wild_crown' } };
// Final forms at level 16 follow the first form.
const EVO2 = {
  rat: { attack: 'Plague Lord', guard: 'Warren King', support: 'Hedge Mother' },
  wolf: { attack: 'Bloodfang', guard: 'Wallfang', support: 'Moonhowler' },
  boarling: { attack: 'Warboar', guard: 'Bastion Boar', support: 'Elderroot' },
  briar: { attack: 'Thornlord', guard: 'Bramblewall', support: 'Bloom Queen' },
  crows: { attack: 'Storm of Crows', guard: 'Iron Rookery', support: 'Crow Oracle' },
  bat: { attack: 'Nightreaver', guard: 'Cavern Lord', support: 'Twilight Bat' },
  slime: { attack: 'Ooze Tyrant', guard: 'Stone Slime', support: 'Living Spring' },
  lurker: { attack: 'Fen Terror', guard: 'Bog Bastion', support: 'Reed Mother' },
  emberfox: { attack: 'Inferno Fox', guard: 'Ember Guardian', support: 'Sunrise Fox' },
  hound: { attack: 'Dread Hound', guard: 'Aegis Hound', support: 'Spirit Hound' },
};
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
  barracks: { name: 'Barracks', desc: 'Drills the militia and trains new kinds of soldier for the defence of the keep.',
    levels: [
      { gold: 300, mats: { ore: 4 }, text: 'Spearmen and priests. Militia 15% tougher. More levy, faster.' },
      { gold: 700, mats: { ore: 6, bone: 4 }, text: 'Knights. Militia 30% tougher. More levy again.' },
    ] },
  walls: { name: 'Stone walls', desc: 'Stone in place of the palisade, a stronger gate and towers beside it.',
    levels: [
      { gold: 350, mats: { ore: 6 }, text: 'Stone walls. Gate half as strong again. Two gate towers for ballistas.' },
      { gold: 800, mats: { ore: 8, moss: 4 }, text: 'Gate twice as strong. Burning oil scalds anything hitting it.' },
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
  barrows: {
    nodes: [
      { id: 'b0', x: 2, y: 7, t: 'start', name: 'The hill path', desc: 'Mist sits in the hollows. The keep is a long walk behind you now.' },
      { id: 'b1', x: 2, y: 6, t: 'fight', name: 'Open grave', desc: 'The earth is turned outwards, not in.', enemies: [{ t: 'skeleton', lvl: 5 }, { t: 'skeleton', lvl: 5 }] },
      { id: 'b2', x: 1, y: 5, t: 'treasure', name: 'Grave goods', desc: 'A chieftain\'s burial, already half robbed.', reward: { gold: 120, items: { antidote: 2 } } },
      { id: 'b3', x: 3, y: 5, t: 'gather', name: 'Bone field', desc: 'Old bones, ground fine by the wind. The forge has a use for them.', mats: { bone: 2 } },
      { id: 'b4', x: 2, y: 4, t: 'camp', name: 'Ring of stones', desc: 'The dead won\'t cross this circle. Nobody remembers why.', talks: ['camp_barrows', 'camp_aldric'] },
      { id: 'b5', x: 0, y: 5, t: 'fight', name: 'Bat-choked hollow', desc: 'Something rustles overhead. A lot of somethings.', enemies: [{ t: 'bat', lvl: 5 }, { t: 'bat', lvl: 5 }, { t: 'bat', lvl: 6 }] },
      { id: 'b6', x: 0, y: 4, t: 'treasure', need: 'burn', name: 'Cobwebbed crypt', desc: 'Webs as thick as sailcloth seal the door. Fire would clear them.', reward: { tome: true } },
      { id: 'b7', x: 4, y: 4, t: 'quest', q: 'aldric', name: 'A knight\'s tomb', desc: 'A stone tomb with its lid pushed aside. Someone stands guard at it.' },
      { id: 'b8', x: 1, y: 3, t: 'event', ev: 'stone', name: 'The weeping stone', desc: 'A standing stone that runs with water on a dry day.' },
      { id: 'b9', x: 3, y: 3, t: 'fight', name: 'Barrow mouth', desc: 'Cold air breathes out of the hill.', enemies: [{ t: 'skeleton', lvl: 6 }, { t: 'wight', lvl: 6 }] },
      { id: 'b10', x: 4, y: 2, t: 'fight', hidden: 'aldric_met', name: 'The king\'s vault', desc: 'Behind a false wall, the old king\'s treasury. Its guards never left.',
        enemies: [{ t: 'wight', lvl: 7 }, { t: 'wight', lvl: 7 }, { t: 'skeleton', lvl: 7 }], win: { flag: 'seal_found', scene: 'seal_found' } },
      { id: 'b11', x: 3, y: 1, t: 'den', need: 'beast', name: 'Bat roost', desc: 'A cave packed with grave bats. Hesk could coax one down.',
        enemies: [{ t: 'bat', lvl: 6 }, { t: 'bat', lvl: 6 }], hunt: ['bat', 'bat'], reward: { items: { hi_potion: 2 } } },
      { id: 'b12', x: 1, y: 2, t: 'gather', name: 'Barrow moss', desc: 'Grey moss that grows only on old graves.', mats: { bone: 1 }, items: { ether: 1 } },
      { id: 'b13', x: 2, y: 1, t: 'fight', name: 'Kings\' row', desc: 'A line of mounds, every one of them open.', enemies: [{ t: 'wight', lvl: 7 }, { t: 'skeleton', lvl: 7 }, { t: 'skeleton', lvl: 7 }] },
      { id: 'b14', x: 2, y: 0, t: 'boss', name: 'The great barrow', desc: 'The largest mound of all. A crown glints in the dark of its doorway.' },
      { id: 'b15', x: 0, y: 1, t: 'treasure', need: 'lock', name: 'Grave robbers\' cache', desc: 'An iron box chained to a tree, full of what the robbers took. Good lock.', reward: { gold: 200, gear: 'prayer_beads' } },
      { id: 'b16', x: 1, y: 1, t: 'treasure', need: 'seal', name: 'The oathbound door', desc: 'A door sealed by a knight\'s vow. Only one of the old king\'s knights could open it.', reward: { tome: true, gear: 'kings_signet' } },
    ],
    edges: [['b0', 'b1'], ['b1', 'b2'], ['b1', 'b3'], ['b2', 'b5'], ['b5', 'b6'], ['b2', 'b4'], ['b3', 'b4'], ['b4', 'b8'], ['b4', 'b9'], ['b9', 'b7'],
      ['b7', 'b10'], ['b10', 'b11'], ['b6', 'b8'], ['b8', 'b12'], ['b12', 'b13'], ['b11', 'b13'], ['b13', 'b14'], ['b12', 'b15'], ['b12', 'b16'], ['b15', 'b16']],
  },
  fenmire: {
    nodes: [
      { id: 'f0', x: 2, y: 7, t: 'start', name: 'Edge of the fen', desc: 'The road gives up here. After this it\'s planks, tussocks and black water.' },
      { id: 'f1', x: 2, y: 6, t: 'fight', name: 'Reed bed', desc: 'The reeds close in behind you.', enemies: [{ t: 'lurker', lvl: 7 }, { t: 'lurker', lvl: 7 }] },
      { id: 'f2', x: 1, y: 5, t: 'gather', name: 'Moss banks', desc: 'Thick green moss. The forge will want it.', mats: { moss: 2 } },
      { id: 'f3', x: 3, y: 5, t: 'treasure', name: 'Sunken boat', desc: 'A fisher\'s boat, upside down in the mud.', reward: { gold: 150, items: { potion: 2 } } },
      { id: 'f4', x: 2, y: 4, t: 'camp', name: 'Fisher\'s hummock', desc: 'A dry island with a turf shelter on it.', talks: ['camp_fen', 'camp_morwen'] },
      { id: 'f5', x: 0, y: 5, t: 'quest', q: 'morwen', name: 'Hut on stilts', desc: 'A crooked hut on stilts, lit from inside by green lanterns.' },
      { id: 'f6', x: 0, y: 3, t: 'treasure', hidden: 'morwen_met', need: 'burn', flag: 'lantern1', name: 'Frozen pool', desc: 'A lantern glows under a skin of black ice. Fire would melt it.', reward: { items: { ether: 1 } } },
      { id: 'f7', x: 1, y: 3, t: 'event', ev: 'wisp', name: 'Will-o\'-the-wisp', desc: 'A pale light bobs over the water, just out of reach.' },
      { id: 'f8', x: 4, y: 4, t: 'den', need: 'beast', name: 'Slime pools', desc: 'Warm pools full of something that moves. Hesk could tame one.',
        enemies: [{ t: 'slime', lvl: 8 }, { t: 'slime', lvl: 8 }], hunt: ['slime', 'slime', 'lurker'], reward: { items: { ether: 2 } } },
      { id: 'f9', x: 3, y: 3, t: 'fight', name: 'Hag circle', desc: 'Three stumps, three fires and three old women who aren\'t.', enemies: [{ t: 'hag', lvl: 8 }, { t: 'hag', lvl: 8 }, { t: 'lurker', lvl: 7 }] },
      { id: 'f10', x: 4, y: 2, t: 'fight', hidden: 'morwen_met', name: 'Lantern thieves', desc: 'Something has dragged a lantern into its nest.',
        enemies: [{ t: 'lurker', lvl: 9 }, { t: 'lurker', lvl: 9 }, { t: 'hag', lvl: 8 }], win: { flag: 'lantern2', scene: 'lantern_got' } },
      { id: 'f11', x: 2, y: 2, t: 'treasure', hidden: 'morwen_met', flag: 'lantern3', name: 'Eel weir', desc: 'A lantern hangs from the weir posts, still lit after all these years.', reward: { items: { potion: 1 } } },
      { id: 'f12', x: 1, y: 2, t: 'gather', name: 'Peat cutting', desc: 'Old peat cuttings, and moss in every one.', mats: { moss: 2 }, items: { hi_potion: 1 } },
      { id: 'f13', x: 2, y: 1, t: 'fight', name: 'The causeway', desc: 'Stone under the water. Things wait beside it.', enemies: [{ t: 'lurker', lvl: 9 }, { t: 'hag', lvl: 9 }, { t: 'slime', lvl: 9 }] },
      { id: 'f14', x: 2, y: 0, t: 'boss', name: 'The drowned causeway', desc: 'A knight stands chest deep in the water, blocking the way.' },
      { id: 'f15', x: 3, y: 1, t: 'treasure', need: 'lock', name: 'Smuggler\'s chest', desc: 'A chest sunk on a rope under the planks. Locked tight.', reward: { gold: 260, gear: 'fenwitch_staff' } },
      { id: 'f16', x: 0, y: 1, t: 'treasure', need: 'hex', name: 'Path through the mist', desc: 'The mist here hides a path. Only someone who knows the fen could see it.', reward: { tome: true, gear: 'witch_lantern' } },
    ],
    edges: [['f0', 'f1'], ['f1', 'f2'], ['f1', 'f3'], ['f2', 'f5'], ['f2', 'f4'], ['f3', 'f4'], ['f3', 'f8'], ['f4', 'f7'], ['f4', 'f9'], ['f5', 'f6'], ['f6', 'f7'],
      ['f8', 'f9'], ['f9', 'f10'], ['f10', 'f15'], ['f7', 'f11'], ['f7', 'f12'], ['f11', 'f13'], ['f12', 'f13'], ['f12', 'f16'], ['f15', 'f13'], ['f13', 'f14']],
  },
  tower: {
    nodes: [
      { id: 'w0', x: 2, y: 7, t: 'start', name: 'The open doors', desc: 'The tower doors stand open. Nothing inside makes a sound.' },
      { id: 'w1', x: 2, y: 6, t: 'fight', name: 'Gatehouse', desc: 'Hollow soldiers turn their empty helms towards you.', enemies: [{ t: 'soldier', lvl: 9 }, { t: 'soldier', lvl: 9 }] },
      { id: 'w2', x: 1, y: 5, t: 'treasure', name: 'Quartermaster\'s store', desc: 'Supplies for an army that doesn\'t eat.', reward: { gold: 200, items: { hi_potion: 2 } } },
      { id: 'w3', x: 3, y: 5, t: 'gather', name: 'Shard seam', desc: 'Black crystal grows out of the walls like frost.', mats: { shard: 2 } },
      { id: 'w4', x: 2, y: 4, t: 'camp', name: 'A guardroom that locks', desc: 'A door that bolts from the inside. That will do.', talks: ['camp_tower', 'camp_ember'] },
      { id: 'w5', x: 0, y: 5, t: 'fight', name: 'Hollow kennels', desc: 'Chains, bowls and the things that eat from them.', enemies: [{ t: 'hound', lvl: 9 }, { t: 'hound', lvl: 9 }, { t: 'hound', lvl: 10 }] },
      { id: 'w6', x: 0, y: 4, t: 'den', need: 'beast', name: 'Hound pens', desc: 'Shadow hounds, starved and angry. Hesk thinks she could turn one.',
        enemies: [{ t: 'hound', lvl: 10 }, { t: 'hound', lvl: 10 }], hunt: ['hound', 'hound'], reward: { items: { feather: 1 } } },
      { id: 'w7', x: 1, y: 3, t: 'event', ev: 'prisoner', name: 'The cells', desc: 'Someone is crying in the dark. A human voice.' },
      { id: 'w8', x: 3, y: 3, t: 'fight', name: 'Long gallery', desc: 'Portraits with the faces scratched out.', enemies: [{ t: 'soldier', lvl: 10 }, { t: 'acolyte', lvl: 10 }, { t: 'hound', lvl: 10 }] },
      { id: 'w9', x: 4, y: 4, t: 'treasure', need: 'seal', name: 'Chapel of the old order', desc: 'Emberwake\'s knights built this chapel before the Hollow took the tower. The door answers to their oath.', reward: { tome: true, items: { feather: 2 } } },
      { id: 'w10', x: 4, y: 2, t: 'treasure', need: 'hex', name: 'The false wall', desc: 'A wall that isn\'t quite there. Morwen can see the room behind it.', reward: { gold: 300, gear: 'iron_heart' } },
      { id: 'w11', x: 3, y: 1, t: 'fight', name: 'Acolyte choir', desc: 'They are singing. You wish they weren\'t.', enemies: [{ t: 'acolyte', lvl: 11 }, { t: 'acolyte', lvl: 11 }, { t: 'soldier', lvl: 11 }] },
      { id: 'w12', x: 1, y: 2, t: 'gather', name: 'Armoury racks', desc: 'Black iron weapons, and shards in the hilts.', mats: { shard: 1, ore: 2 }, items: { hi_potion: 1 } },
      { id: 'w13', x: 2, y: 1, t: 'fight', name: 'Upper stair', desc: 'The last stair. Something waits above.', enemies: [{ t: 'soldier', lvl: 11 }, { t: 'soldier', lvl: 11 }, { t: 'hound', lvl: 11 }] },
      { id: 'w14', x: 2, y: 0, t: 'boss', name: 'The Warden\'s hall', desc: 'A tall figure in black iron stands at the window.' },
      { id: 'w15', x: 0, y: 2, t: 'treasure', need: 'lock', name: 'Warden\'s strongbox', desc: 'Everything the Warden took from Ashby, behind a very good lock.', reward: { gold: 400, items: { feather: 2 } } },
      { id: 'w16', x: 1, y: 1, t: 'treasure', need: 'burn', name: 'Black ice stair', desc: 'A side stair choked with black ice. Fire would clear it.', reward: { tome: true } },
    ],
    edges: [['w0', 'w1'], ['w1', 'w2'], ['w1', 'w3'], ['w2', 'w5'], ['w5', 'w6'], ['w2', 'w4'], ['w3', 'w4'], ['w3', 'w9'], ['w4', 'w7'], ['w4', 'w8'], ['w8', 'w9'],
      ['w8', 'w10'], ['w10', 'w11'], ['w7', 'w12'], ['w7', 'w15'], ['w12', 'w13'], ['w11', 'w13'], ['w12', 'w16'], ['w16', 'w13'], ['w13', 'w14']],
  },
};

// Older saves used generated maps for the last three areas. genMap is kept to migrate them. until they're hand built in a later layer.
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
  stone: {
    lines: [['', 'Water runs down the standing stone and pools at its foot. It is clear and very cold.'], ['isolde', 'There\'s old magic in it. Kind magic, I think.'], ['wren', 'You think.']],
    choices: [
      { label: 'Drink from the pool', out: { xp: 140, text: 'It tastes of snow. Everyone feels steadier and sharper, as if they\'d slept a week. The party gains experience.' } },
      { label: 'Take the carved capstone', out: { items: { feather: 1 }, mats: { bone: 2 }, text: 'Under the capstone is an ember feather wrapped in oilcloth, and a scatter of bone dust. The stone stops weeping.' } },
    ],
  },
  wisp: {
    lines: [['', 'A pale light floats over the water, waiting.'], ['bram', 'Every story I know says don\'t follow those.']],
    choices: [
      { label: 'Follow it', out: { gold: 220, text: 'It leads you, dry footed, to a drowned purse caught in the roots of a willow. Then it winks out. Bram looks very uncomfortable about the whole thing.' } },
      { label: 'Let it go', out: { mats: { moss: 3 }, items: { ether: 1 }, text: 'You stay on the planks. Wren spots a stash of moss and a stoppered bottle a smuggler left behind.' } },
    ],
  },
  prisoner: {
    lines: [['', 'In the last cell is a woman in a torn Ashby apron. She stares at you as if you might not be real.'], ['', '"You came from Emberwake? Then it still stands. Oh, thank the stars."'], ['bram', 'Mistress Penn. She ran the bakery.'], ['wren', '...The bakery.']],
    choices: [
      { label: 'Free her and send her home', out: { flag: 'penn_freed', items: { hi_potion: 2 }, text: 'Penn presses two potions on you and slips out by the servants\' stair. Emberwake gains another pair of hands: every siege night now starts with 5 more levy.' } },
      { label: 'Ask what she knows first', out: { flag: 'warden_secret', flag2: 'penn_freed', text: 'Penn talks fast. She\'s been mending the Warden\'s armour for weeks, and she has been mending it badly. "Hit him under the left arm. It\'ll give." The Warden will be easier to break. Then she runs for home.' } },
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

// ---------- Arena ----------
// Bouts are fought in order within a rank. A rank's final opens the next rank.
// Foes can carry a name, an HP multiplier (hpx) and boss status (no fleeing, no taming).
const ARENA = [
  { id: 'bronze', name: 'Bronze', lvl: '6 to 9', bouts: [
    { id: 'b1', name: 'The Grey Brothers', desc: 'Three wolves raised in the pit. They hunt as one.', foes: [{ t: 'wolf', lvl: 6, name: 'Grey Brother' }, { t: 'wolf', lvl: 6, name: 'Grey Brother' }, { t: 'wolf', lvl: 6, name: 'Grey Brother' }], prize: { gold: 150 } },
    { id: 'b2', name: 'Mag the Mauler', desc: 'A boar with a temper and a fan club.', foes: [{ t: 'boarling', lvl: 8, name: 'Mag the Mauler', hpx: 3.2 }], prize: { items: { hi_potion: 2 } } },
    { id: 'b3', name: 'Pit fighters', desc: 'Two gladiators who have never lost in front of a crowd.', foes: [{ t: 'gladiator', lvl: 7 }, { t: 'gladiator', lvl: 7 }], prize: { gold: 250 } },
    { id: 'b4', name: 'The Crowkeeper', desc: 'She brings her birds. Lots of them.', foes: [{ t: 'beastmaster', lvl: 8, name: 'The Crowkeeper' }, { t: 'crows', lvl: 7 }, { t: 'crows', lvl: 7 }], prize: { tome: true } },
    { id: 'b5', name: 'Sir Halbrecht the Unbowed', desc: 'The Bronze champion. Hasn\'t taken a step back in eleven years.', final: true,
      foes: [{ t: 'shieldbearer', lvl: 9, name: 'Sir Halbrecht', hpx: 2.6, boss: true }, { t: 'pitmage', lvl: 8 }], prize: { gear: 'gladius', gold: 300 } },
  ] },
  { id: 'silver', name: 'Silver', lvl: '10 to 13', bouts: [
    { id: 's1', name: 'The Bone Dancers', desc: 'Skeletons dug out of the barrows and taught to fight for coin.', foes: [{ t: 'skeleton', lvl: 10 }, { t: 'skeleton', lvl: 10 }, { t: 'skeleton', lvl: 10 }], prize: { gold: 320 } },
    { id: 's2', name: 'The Twins', desc: 'Two pit mages who finish each other\'s spells.', foes: [{ t: 'pitmage', lvl: 11, name: 'Ash Twin' }, { t: 'pitmage', lvl: 11, name: 'Cinder Twin' }], prize: { items: { ether: 3 } } },
    { id: 's3', name: 'Old Gnasher', desc: 'Something from the fens, kept in a tank under the stands.', foes: [{ t: 'lurker', lvl: 12, name: 'Old Gnasher', hpx: 3.2 }], prize: { gear: 'crowd_favour' } },
    { id: 's4', name: 'The Gilded Three', desc: 'Rich, famous and very good at this.', foes: [{ t: 'gladiator', lvl: 11 }, { t: 'shieldbearer', lvl: 11 }, { t: 'pitmage', lvl: 11 }], prize: { tome: true } },
    { id: 's5', name: 'Varga the Beastqueen', desc: 'The Silver champion, and her hounds.', final: true,
      foes: [{ t: 'beastmaster', lvl: 13, name: 'Varga', hpx: 3, boss: true }, { t: 'hound', lvl: 11 }, { t: 'hound', lvl: 11 }], prize: { gear: 'beastqueen_lash', creature: 'emberfox' } },
  ] },
  { id: 'gold', name: 'Gold', lvl: '14 and up', bouts: [
    { id: 'g1', name: 'The Deserters', desc: 'Hollow soldiers who walked away from the tower. Nobody knows why.', foes: [{ t: 'soldier', lvl: 14 }, { t: 'soldier', lvl: 14 }, { t: 'acolyte', lvl: 14 }], prize: { gold: 600 } },
    { id: 'g2', name: 'The Grave Pair', desc: 'Two wights bound in silver chains.', foes: [{ t: 'wight', lvl: 15 }, { t: 'wight', lvl: 15 }], prize: { tome: true } },
    { id: 'g3', name: 'The Sunken Champion', desc: 'A knight from Fenmire who fights for whoever feeds him.', foes: [{ t: 'drowned', lvl: 14, name: 'The Sunken Champion', hpx: 0.45, boss: true }], prize: { items: { feather: 3, hi_potion: 3 } } },
    { id: 'g4', name: 'Tarrant the Undefeated', desc: 'Never lost. Not once. He\'d like to keep it that way.', final: true,
      foes: [{ t: 'gladiator', lvl: 17, name: 'Tarrant', hpx: 4, boss: true }, { t: 'shieldbearer', lvl: 15 }, { t: 'pitmage', lvl: 15 }], prize: { gear: 'champion_band', gold: 1000 } },
  ] },
];

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
  { id: 'aldric', name: 'Recruit: the knight in the barrow', how: 'Someone still stands guard over a tomb in the Barrow Hills.' },
  { id: 'morwen', name: 'Recruit: the witch of Fenmire', how: 'A hut on stilts in Fenmire, lit by green lanterns. Its owner wants something.' },
  { id: 'sealed', name: 'Oathbound doors', how: 'Recruit Aldric. He can open doors sealed by the old knights in the barrows and the tower.' },
  { id: 'hidden', name: 'Hidden paths', how: 'Recruit Morwen. She can see paths hidden by magic in Fenmire and the tower.' },
  { id: 'bestiary', name: 'Beast book', how: 'Tame different kinds of beast. Rewards at 3, 5, 8 and all 10 kinds: ember feathers, two tomes and the Crown of the Wild.' },
  { id: 'evolve', name: 'First evolution', how: 'Raise a creature to level ' + EVO_LVL + '. How you use it decides what it becomes.' },
  { id: 'evolve2', name: 'Final evolution', how: 'Raise an evolved creature to level 16. It becomes the final version of what it became.' },
  { id: 'siege', name: 'Defend Emberwake', how: 'Defeat Rook the Red. He\'ll tell the Hollow where you are.' },
  { id: 'barracks', name: 'Build: barracks', how: 'Survive the first night at Emberwake, then build it here.', build: 'barracks' },
  { id: 'walls', name: 'Build: stone walls', how: 'Survive the first night at Emberwake, then build them here.', build: 'walls' },
  { id: 'night5', name: 'Hold for five nights', how: 'Survive five nights. The keep\'s smiths will forge you something special.' },
  { id: 'arena', name: 'The Brightwater arena', how: 'Defeat Rook the Red to open the road east to Brightwater market.' },
  { id: 'bronze', name: 'Arena: Bronze champion', how: 'Beat Sir Halbrecht, the Bronze champion.' },
  { id: 'emberfox', name: 'A rare creature', how: 'Win the Silver rank at the arena. Something with fire in it waits for the winner.' },
  { id: 'goldrank', name: 'Arena: the Undefeated', how: 'Win the Gold rank. Nobody has done it in living memory.' },
  { id: 'war', name: 'War campaigns', how: 'Coming in a later update. Take your army out from Emberwake and take ground back from the Hollow.', future: true },
];

const STORY3 = {
  raid_warn: [
    ['', 'That night carts come up the hill to Emberwake. Families from Ashby who hid in the woods, a miller and his sons, two of Rook\'s men who\'d had enough of him.'],
    ['bram', 'There are thirty people in the yard. Thirty.'],
    ['wren', 'And Rook got away. He knows where we are, and he knows what Isolde carries.'],
    ['isolde', 'Then the Hollow know too. They\'ll come here.'],
    ['bram', 'Let them. We\'ve got walls, mostly. And now we\'ve got people to stand on them.'],
    ['', 'DEFEND EMBERWAKE unlocked. When night falls the Hollow will come. Put archers on the walls, soldiers at the gate and your heroes where they\'re needed most.'],
    ['', 'The road east to Brightwater market is open too. They say its arena pays well.'],
  ],
  siege1_won: [
    ['', 'Dawn comes up grey over the hill. The Hollow are gone and the gate still stands.'],
    ['wren', 'We held. Thirty farmers and us, and we held.'],
    ['bram', 'They\'ll want proper training. And proper walls. I can build both, given time and iron.'],
    ['isolde', 'They\'ll be back every few nights, and stronger. So will we.'],
    ['', 'The survivors patch the keep\'s roof that morning. Build a barracks and stone walls from the noticeboard. More nights wait, each harder than the last, with rewards to match.'],
  ],
  arena_intro: [
    ['', 'Brightwater market is loud, crowded and, for the first time in weeks, safe. At its heart is a sand pit ringed with benches, and every bench is full.'],
    ['wren', 'Fighting for money in front of a crowd. Finally, something I\'m qualified for.'],
    ['', 'The pit master runs three ranks: Bronze, Silver and Gold. Every bout has a prize, and each rank\'s final has a big one. Arena healers patch you up before every bout, and losing costs nothing but pride.'],
  ],
  fox_won: [
    ['', 'Varga yields. The crowd is on its feet. The pit master brings out a small iron cage, and inside it something glows.'],
    ['hesk', 'An ember fox. I thought they were a story. They\'re drawn to fire, and to anything that burns from the inside.'],
    ['isolde', 'It\'s looking at me.'],
    ['', 'The Ember Fox joins your creatures. It breathes fire and evolves like any other beast.'],
  ],
};

const STORY4 = {
  camp_barrows: [
    ['isolde', 'The stone has been quiet since the Shade spoke. Like it\'s listening.'],
    ['wren', 'Can you not say things like that in a graveyard?'],
    ['bram', 'My grandad said the barrow kings were good kings. Fair. Hard, but fair.'],
    ['isolde', 'Then whatever woke them must be very cruel.'],
  ],
  camp_aldric: [
    ['aldric', 'You keep looking at my hands.'],
    ['wren', 'They\'re a bit... see through. In this light.'],
    ['aldric', 'I know. I have known for some time, I think. I simply chose not to look.'],
    ['aldric', 'Let me stand with you while I can. A knight who outlived his king should at least die well. Again.'],
  ],
  aldric_meet: [
    ['', 'Beside the open tomb stands a knight in armour a century out of date. His shield bears a crown and a candle.'],
    ['', '"Halt. This is the resting place of the king\'s champion. None may pass while the king lives."'],
    ['bram', 'The king? Which king?'],
    ['', '"King Edric the Fair, of course. I await his seal and his summons. Have you news from court?"'],
    ['isolde', 'He doesn\'t know. He doesn\'t know any of it.'],
    ['', '"His seal lies in the royal vault, beyond the false wall to the north east. If you are true, fetch it, and I will know the king\'s will."'],
  ],
  aldric_wait: [['', '"The seal. The royal vault, beyond the false wall to the north east. I will wait. I am good at waiting."']],
  seal_found: [
    ['', 'In the vault, among cold gold, lies a heavy seal on a broken chain. King Edric\'s seal. It is dated a hundred and four years ago.'],
    ['isolde', 'We have to take this back to him. Even if it hurts.'],
  ],
  aldric_join: [
    ['', 'The knight takes the seal and turns it over and over in gauntleted hands.'],
    ['', '"A hundred years. And I stood here the whole time. My king is the thing in the great barrow, isn\'t he? The crowned shadow."'],
    ['bram', 'I\'m sorry.'],
    ['', '"Don\'t be. Now I know what I am for. I am Aldric, last of the king\'s champions, and I will put my king to rest."'],
    ['', 'Aldric joins the party. He is tough as a wall, fights with holy steel and can open doors sealed by the old knights\' oath. One is in these hills. Another is in the Hollow Tower.'],
  ],
  aldric_after: [['', 'The tomb is empty now, and the lid is back in place. Someone has scratched a candle on it.']],
  shade_aldric: [
    ['aldric', 'My king. It is Aldric. I have come to relieve you of your watch.'],
    ['', 'For a moment the Shade hesitates. Then the cold fire in its eyes flares, and it lifts its sword.'],
    ['aldric', 'Then forgive me, sire.'],
  ],
  camp_fen: [
    ['wren', 'I have mud in places mud should never be.'],
    ['bram', 'You said that in Thornwood.'],
    ['wren', 'And it was true then too. It\'s just more true now.'],
    ['isolde', 'The tower\'s close. I can feel it, like a draught on the back of my neck.'],
  ],
  camp_morwen: [
    ['morwen', 'You\'re wondering what I want with you.'],
    ['isolde', 'A bit.'],
    ['morwen', 'The Hollow poisoned my fen. Rotted my eels, drowned my lanterns, set the hags on me. I want them gone. And I want to see what that stone of yours does when it\'s angry.'],
  ],
  morwen_meet: [
    ['', 'The door of the stilt hut opens before you knock. A woman with river weed in her hair looks you over.'],
    ['morwen', 'Ember carrier. I wondered when you\'d come squelching by.'],
    ['morwen', 'The Hollow put my three lanterns out and scattered them. Without them I can\'t see through the mist, and neither can anyone else.'],
    ['morwen', 'One sits in a frozen pool to the west. One was dragged off by lurkers to the east. One hangs on the eel weir. Bring all three and I\'ll walk with you. I know paths here nobody else does.'],
  ],
  morwen_wait: [['morwen', 'Three lanterns. The frozen pool, the lurkers\' nest and the eel weir. I can wait. The fen can\'t.']],
  lantern_got: [['', 'In the nest, among bones and rags, a green lantern still glows. Morwen\'s.']],
  morwen_join: [
    ['', 'Morwen hangs the three lanterns from the eaves. Green light spills over the black water, and paths appear that weren\'t there before.'],
    ['morwen', 'There. Now I can see properly. And what I see is a tower full of things that need cursing.'],
    ['', 'Morwen joins the party. She curses, drains and slows, and she can see paths hidden by magic. There is one in this fen and another in the Hollow Tower.'],
  ],
  morwen_after: [['', 'The lanterns burn green over the hut. Morwen has left a sign: BACK WHEN THEY\'RE DEAD.']],
  camp_tower: [
    ['bram', 'Whatever happens up there, we came a long way from the sheep in Thornwood.'],
    ['wren', 'I liked the sheep. The sheep didn\'t have empty helmets.'],
    ['isolde', 'If I lose control of the stone up there, run. Don\'t wait for me.'],
    ['bram', 'No.'],
  ],
  camp_ember: [
    ['isolde', 'My master told me something before the end. I didn\'t understand it then.'],
    ['isolde', '"The ember is a piece of the first fire. The Hollow King is what\'s left when that fire goes out." I think he wants it back to light himself again.'],
    ['wren', 'So we keep it away from him. Easy.'],
    ['isolde', 'Or we use it to finish him. Harder.'],
  ],
};

const WORLD = { HABITAT, DEX_REWARDS, EVO2_LVL, EVO2, STORY4, ARENA, STORY3, CREATURES, EVO_LVL, EVO_MULT, STANCES, BUILDINGS, YARD_RATE, KENNEL_CAP, MAPS, genMap, EVENTS, STORY2, BOARD };
if (typeof module !== 'undefined' && module.exports) module.exports = WORLD; else root.WORLD = WORLD;
})(this);
