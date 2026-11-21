// Emberwake game data: heroes, talents, skills, items, enemies, areas and story.
// Plain data only. engine.js reads it in the browser and in node (for balance tests).
(function (root) {
'use strict';

const STATS = ['hp', 'mp', 'str', 'mag', 'def', 'res', 'spd', 'crit'];

const HEROES = {
  bram: {
    name: 'Bram', role: 'Smith\'s son', sprite: 'bram',
    blurb: 'Big, steady and hard to knock down. Hits like the hammer he grew up with.',
    base:   { hp: 120, mp: 15, str: 14, mag: 4,  def: 12, res: 6,  spd: 8,  crit: 5 },
    growth: { hp: 15,  mp: 2,  str: 2.4, mag: 0.6, def: 1.8, res: 0.9, spd: 0.6, crit: 0 },
    start: { talents: { blade: 1 }, equip: { weapon: 'rusty_sword', armour: 'padded_jerkin' } },
  },
  wren: {
    name: 'Wren', role: 'Poacher', sprite: 'wren',
    blurb: 'Quick, sharp tongued and sharper eyed. Gets two goes while others get one.',
    base:   { hp: 92, mp: 20, str: 12, mag: 6, def: 7, res: 7, spd: 14, crit: 10 },
    growth: { hp: 11, mp: 2.5, str: 2.1, mag: 1, def: 1.1, res: 1, spd: 1.1, crit: 0 },
    start: { talents: { hunt: 1 }, equip: { weapon: 'short_bow', armour: 'padded_jerkin' } },
  },
  isolde: {
    name: 'Isolde', role: 'Apprentice', sprite: 'isolde',
    blurb: 'Never finished her training. Carries a warm stone that makes every spell come out bigger.',
    base:   { hp: 72, mp: 40, str: 5, mag: 15, def: 5, res: 11, spd: 10, crit: 5 },
    growth: { hp: 8, mp: 5, str: 0.7, mag: 2.5, def: 0.8, res: 1.8, spd: 0.8, crit: 0 },
    start: { talents: { fire: 1, light: 1 }, equip: { weapon: 'ash_staff', armour: 'apprentice_robe' } },
  },
  hesk: {
    name: 'Hesk', role: 'Beast tamer', sprite: 'hesk', recruit: true,
    blurb: 'Lived alone in Thornwood with her animals until the poachers came. Can tame wounded beasts and fights beside them.',
    base:   { hp: 100, mp: 25, str: 11, mag: 9, def: 9, res: 9, spd: 11, crit: 6 },
    growth: { hp: 12, mp: 3, str: 1.8, mag: 1.4, def: 1.3, res: 1.2, spd: 0.9, crit: 0 },
    innate: ['tame'],
    start: { talents: { wild: 1 }, equip: { weapon: 'hunting_spear', armour: 'padded_jerkin' } },
  },
  dace: {
    name: 'Dace', role: 'Cutpurse', sprite: 'dace', recruit: true,
    blurb: 'A thief the bandits locked up for stealing from them. Picks locks, picks pockets and fights dirty with two knives.',
    base:   { hp: 88, mp: 22, str: 13, mag: 6, def: 7, res: 7, spd: 15, crit: 15 },
    growth: { hp: 10, mp: 2.5, str: 2.2, mag: 0.8, def: 1, res: 1, spd: 1.2, crit: 0 },
    innate: ['steal'],
    start: { talents: { shadow: 1 }, equip: { weapon: 'twin_knives', armour: 'padded_jerkin' } },
  },
};
const PARTY = ['bram', 'wren', 'isolde'];
const ROSTER = ['bram', 'wren', 'isolde', 'hesk', 'dace'];
// Ember Surge moves, one per hero. Unlocked by the story.
const SURGE = { bram: 'anvil_fall', wren: 'arrow_storm', isolde: 'ember_nova', hesk: 'wild_hunt', dace: 'thousand_cuts' };


// Talent trees. Any hero can learn any tree. Rank n needs hero level REQ[n] and costs COST[n] points.
const TALENT_REQ = [1, 3, 5, 8, 11, 14];
const TALENT_COST = [1, 1, 2, 2, 3, 3];
const TREES = {
  blade: { name: 'Blade', colour: '#d86a4a', desc: 'Heavy weapon work. Big single hits and sweeps.',
    ranks: [
      { skill: 'power_strike' },
      { stats: { str: 3 }, text: '+3 Strength' },
      { skill: 'cleave' },
      { stats: { crit: 10 }, text: '+10% critical chance' },
      { skill: 'sunder' },
      { stats: { str: 6 }, flags: { counter: 0.25 }, text: '+6 Strength, 25% chance to counter when hit' },
    ] },
  guard: { name: 'Guard', colour: '#6a8fd8', desc: 'Stand in front and take it. Health, defence and cover.',
    ranks: [
      { skill: 'shield_wall' },
      { stats: { hp: 30, def: 3 }, text: '+30 HP, +3 Defence' },
      { skill: 'provoke' },
      { stats: { hp: 50, def: 4, res: 3 }, text: '+50 HP, +4 Defence, +3 Resistance' },
      { skill: 'second_wind' },
      { flags: { bulwark: 0.15 }, stats: { hp: 60 }, text: 'Take 15% less damage, +60 HP' },
    ] },
  hunt: { name: 'Hunt', colour: '#7fbf5a', desc: 'Speed, poison and crippling shots.',
    ranks: [
      { skill: 'venom_shot' },
      { stats: { spd: 3 }, text: '+3 Speed' },
      { skill: 'double_shot' },
      { stats: { crit: 12 }, text: '+12% critical chance' },
      { skill: 'hamstring' },
      { stats: { spd: 4, str: 4 }, flags: { firstStrike: 1 }, text: '+4 Speed, +4 Strength, start every fight half ready' },
    ] },
  fire: { name: 'Fire', colour: '#ff8a3d', desc: 'Raw damage. Burns what it touches.',
    ranks: [
      { skill: 'fire' },
      { stats: { mag: 3 }, text: '+3 Magic' },
      { skill: 'blaze' },
      { flags: { burnChance: 0.35 }, text: 'Fire spells have a 35% chance to burn' },
      { skill: 'inferno' },
      { stats: { mag: 6 }, flags: { boost_fire: 0.2 }, text: '+6 Magic, fire damage +20%' },
    ] },
  frost: { name: 'Frost', colour: '#7fd3ff', desc: 'Slows the enemy down and hits hard in one place.',
    ranks: [
      { skill: 'frost' },
      { stats: { res: 3, mp: 10 }, text: '+3 Resistance, +10 MP' },
      { skill: 'ice_lance' },
      { skill: 'frostguard' },
      { skill: 'blizzard' },
      { stats: { mag: 6 }, flags: { mpCut: 0.15 }, text: '+6 Magic, all spells cost 15% less MP' },
    ] },
  wild: { name: 'Wild', colour: '#c8955a', desc: 'Fight as a pack. Makes your creature hit harder.',
    ranks: [
      { skill: 'rally_cry' },
      { stats: { str: 3, spd: 2 }, text: '+3 Strength, +2 Speed' },
      { skill: 'maul' },
      { flags: { beastBond: 0.25 }, text: 'Your creature deals 25% more damage while this hero is in the party' },
      { skill: 'feral_howl' },
      { stats: { hp: 40, str: 5 }, flags: { beastBond: 0.25 }, text: '+40 HP, +5 Strength, creature damage +25% more' },
    ] },
  shadow: { name: 'Shadow', colour: '#9a8ad8', desc: 'Dirty fighting. Quick strikes and finishing blows.',
    ranks: [
      { skill: 'cheap_shot' },
      { stats: { spd: 3, crit: 5 }, text: '+3 Speed, +5% critical chance' },
      { skill: 'flurry' },
      { flags: { stealPlus: 1 }, text: 'Steal can lift rarer things' },
      { skill: 'assassinate' },
      { stats: { str: 5, crit: 10 }, text: '+5 Strength, +10% critical chance' },
    ] },
  light: { name: 'Light', colour: '#ffe27a', desc: 'Healing, bringing people back and burning the dead.',
    ranks: [
      { skill: 'heal' },
      { stats: { res: 3, mp: 10 }, text: '+3 Resistance, +10 MP' },
      { skill: 'mass_heal' },
      { skill: 'raise' },
      { skill: 'smite' },
      { skill: 'sanctuary' },
    ] },
};

// Skills. type: phys | mag | heal | buff | revive | summon | item
// target: enemy | enemies | ally | allies | self | deadAlly
const SKILLS = {
  attack:       { name: 'Attack', type: 'phys', power: 1, target: 'enemy', mp: 0 },
  // Blade
  power_strike: { name: 'Power Strike', type: 'phys', power: 1.6, target: 'enemy', mp: 4, desc: 'A full weight swing. 1.6x damage.' },
  cleave:       { name: 'Cleave', type: 'phys', power: 0.85, target: 'enemies', mp: 8, desc: 'Hits every enemy.' },
  sunder:       { name: 'Sunder', type: 'phys', power: 2.1, target: 'enemy', mp: 12, status: { defDown: 3 }, chance: 1, desc: '2.1x damage and breaks their armour.' },
  // Guard
  shield_wall:  { name: 'Shield Wall', type: 'buff', target: 'allies', mp: 6, status: { defUp: 3 }, desc: 'Raises the whole party\'s defence for 3 turns.' },
  provoke:      { name: 'Provoke', type: 'buff', target: 'self', mp: 3, status: { taunt: 3, defUp: 3 }, desc: 'Draws enemy attacks onto you and braces.' },
  second_wind:  { name: 'Second Wind', type: 'heal', target: 'self', mp: 8, pct: 0.4, desc: 'Recover 40% of your health.' },
  // Hunt
  venom_shot:   { name: 'Venom Shot', type: 'phys', power: 1.0, target: 'enemy', mp: 5, status: { poison: 4 }, chance: 0.85, desc: 'Poisons the target.' },
  double_shot:  { name: 'Double Shot', type: 'phys', power: 0.8, hits: 2, target: 'enemy', mp: 7, desc: 'Two quick hits.' },
  hamstring:    { name: 'Hamstring', type: 'phys', power: 1.4, target: 'enemy', mp: 9, status: { slow: 3 }, chance: 0.9, desc: 'Damage and slows the target.' },
  // Fire
  fire:         { name: 'Fire', type: 'mag', el: 'fire', power: 1.0, target: 'enemy', mp: 5 },
  blaze:        { name: 'Blaze', type: 'mag', el: 'fire', power: 0.75, target: 'enemies', mp: 12, desc: 'Fire across every enemy.' },
  inferno:      { name: 'Inferno', type: 'mag', el: 'fire', power: 1.5, target: 'enemies', mp: 24, desc: 'A wall of fire over every enemy.' },
  // Frost
  frost:        { name: 'Frost', type: 'mag', el: 'frost', power: 1.0, target: 'enemy', mp: 5, status: { slow: 2 }, chance: 0.25, desc: 'May slow the target.' },
  ice_lance:    { name: 'Ice Lance', type: 'mag', el: 'frost', power: 1.9, target: 'enemy', mp: 11, desc: 'Heavy single target frost.' },
  frostguard:   { name: 'Frostguard', type: 'buff', target: 'allies', mp: 8, status: { resUp: 3 }, desc: 'Raises the party\'s resistance for 3 turns.' },
  blizzard:     { name: 'Blizzard', type: 'mag', el: 'frost', power: 1.3, target: 'enemies', mp: 22, status: { slow: 2 }, chance: 0.4, desc: 'Frost over every enemy, may slow.' },
  // Light
  heal:         { name: 'Heal', type: 'heal', power: 1.0, target: 'ally', mp: 5 },
  mass_heal:    { name: 'Mass Heal', type: 'heal', power: 0.7, target: 'allies', mp: 12, desc: 'Heals the whole party.' },
  raise:        { name: 'Raise', type: 'revive', pct: 0.35, target: 'deadAlly', mp: 16, desc: 'Brings a fallen ally back with 35% health.' },
  smite:        { name: 'Smite', type: 'mag', el: 'light', power: 1.5, target: 'enemy', mp: 10, desc: 'Holy damage. Brutal on the dead and the Hollow.' },
  sanctuary:    { name: 'Sanctuary', type: 'heal', power: 1.3, target: 'allies', mp: 26, status: { regen: 3 }, desc: 'Big party heal plus regeneration.' },

  // Wild and Shadow
  rally_cry:    { name: 'Rally Cry', type: 'buff', target: 'allies', mp: 6, status: { strUp: 3 }, desc: 'Raises the party\'s strength for 3 turns.' },
  maul:         { name: 'Maul', type: 'phys', power: 1.7, target: 'enemy', mp: 8, status: { poison: 3 }, chance: 0.6, desc: '1.7x damage. Wounds can fester.' },
  feral_howl:   { name: 'Feral Howl', type: 'buff', target: 'enemies', mp: 10, status: { defDown: 3 }, foe: true, desc: 'Breaks every enemy\'s nerve and armour.' },
  cheap_shot:   { name: 'Cheap Shot', type: 'phys', power: 1.3, target: 'enemy', mp: 5, status: { slow: 2 }, chance: 0.7, desc: 'Hit them where it hurts. May slow.' },
  flurry:       { name: 'Flurry', type: 'phys', power: 0.5, hits: 4, target: 'random', mp: 9, desc: 'Four quick cuts at random enemies.' },
  assassinate:  { name: 'Assassinate', type: 'phys', power: 2.4, target: 'enemy', mp: 14, execute: 0.4, desc: '2.4x damage, doubled on anyone below 40% health.' },
  // Innate
  tame:         { name: 'Tame', type: 'tame', target: 'enemy', mp: 0, desc: 'Try to tame a wounded beast. The lower its health, the better the odds.' },
  steal:        { name: 'Steal', type: 'steal', target: 'enemy', mp: 0, desc: 'Lift something from an enemy. Once per enemy.' },
  // Ember Surge
  anvil_fall:   { name: 'Anvil Fall', type: 'phys', power: 3.2, target: 'enemy', surge: true, after: { defUp: 3 }, desc: 'A crushing blow, then the whole party braces.' },
  arrow_storm:  { name: 'Arrow Storm', type: 'phys', power: 0.9, hits: 3, target: 'enemies', surge: true, desc: 'Three volleys over every enemy.' },
  ember_nova:   { name: 'Ember Nova', type: 'mag', el: 'fire', power: 2.3, target: 'enemies', surge: true, status: { burn: 3 }, chance: 1, desc: 'The stone lets go. Fire over everything, and it burns.' },
  wild_hunt:    { name: 'Wild Hunt', type: 'phys', power: 1.8, target: 'enemies', surge: true, after: { strUp: 3, haste: 2 }, desc: 'Hesk and her creature run the enemy down. The party is fired up after.' },
  thousand_cuts:{ name: 'Thousand Cuts', type: 'phys', power: 0.7, hits: 7, target: 'random', surge: true, desc: 'Seven cuts at random enemies.' },
  // Creature moves
  guard_ally:   { name: 'Guard', type: 'buff', target: 'self', status: { taunt: 2, defUp: 2 } },
  lick:         { name: 'Lick Wounds', type: 'heal', power: 0.6, target: 'ally' },
  sap:          { name: 'Healing Sap', type: 'heal', power: 0.9, target: 'ally' },
  howl:         { name: 'Howl', type: 'buff', target: 'allies', status: { strUp: 2 } },
  rend:         { name: 'Rend', type: 'phys', power: 1.6, target: 'enemy' },
  // Enemy skills
  bite:         { name: 'Bite', type: 'phys', power: 1.0, target: 'enemy' },
  savage_bite:  { name: 'Savage Bite', type: 'phys', power: 1.45, target: 'enemy' },
  thorn_lash:   { name: 'Thorn Lash', type: 'mag', el: 'nature', power: 1.0, target: 'enemy' },
  gore:         { name: 'Gore', type: 'phys', power: 1.35, target: 'enemy' },
  trample:      { name: 'Trample', type: 'phys', power: 0.7, target: 'enemies' },
  enrage:       { name: 'Enrage', type: 'buff', target: 'self', status: { haste: 4, strUp: 4 } },
  slash:        { name: 'Slash', type: 'phys', power: 1.0, target: 'enemy' },
  dirty_cut:    { name: 'Dirty Cut', type: 'phys', power: 0.8, target: 'enemy', status: { poison: 3 }, chance: 0.7 },
  arrow:        { name: 'Arrow', type: 'phys', power: 1.0, target: 'enemy' },
  volley:       { name: 'Volley', type: 'phys', power: 0.6, target: 'enemies' },
  peck:         { name: 'Peck', type: 'phys', power: 0.45, hits: 3, target: 'enemy' },
  war_cry:      { name: 'War Cry', type: 'buff', target: 'self', status: { strUp: 4 } },
  whistle:      { name: 'Whistle', type: 'summon', summon: ['cutthroat', 'archer'] },
  bone_rattle:  { name: 'Bone Rattle', type: 'phys', power: 0.9, target: 'enemy', status: { defDown: 3 }, chance: 0.6 },
  drain:        { name: 'Drain', type: 'phys', power: 0.9, target: 'enemy', drain: 0.5 },
  frost_touch:  { name: 'Frost Touch', type: 'mag', el: 'frost', power: 1.0, target: 'enemy', status: { slow: 2 }, chance: 0.4 },
  shadow_bolt:  { name: 'Shadow Bolt', type: 'mag', el: 'dark', power: 1.15, target: 'enemy' },
  grave_chill:  { name: 'Grave Chill', type: 'mag', el: 'frost', power: 0.75, target: 'enemies' },
  raise_dead:   { name: 'Raise Dead', type: 'summon', summon: ['skeleton', 'skeleton'] },
  spit:         { name: 'Bog Spit', type: 'phys', power: 0.8, target: 'enemy', status: { poison: 4 }, chance: 0.8 },
  drag:         { name: 'Drag Under', type: 'phys', power: 1.25, target: 'enemy' },
  hex:          { name: 'Hex', type: 'mag', el: 'dark', power: 0.6, target: 'enemy', status: { defDown: 3 }, chance: 0.9 },
  mend:         { name: 'Mend', type: 'heal', power: 1.0, target: 'ally' },
  engulf:       { name: 'Engulf', type: 'phys', power: 1.1, target: 'enemy' },
  tidal_sweep:  { name: 'Tidal Sweep', type: 'phys', power: 0.85, target: 'enemies' },
  rust_curse:   { name: 'Rust Curse', type: 'mag', el: 'dark', power: 0.5, target: 'enemies', status: { defDown: 3 }, chance: 0.6 },
  brace:        { name: 'Brace', type: 'buff', target: 'self', status: { defUp: 3 } },
  pounce:       { name: 'Pounce', type: 'phys', power: 1.5, target: 'enemy' },
  dark_rite:    { name: 'Dark Rite', type: 'buff', target: 'allies', status: { strUp: 3 } },
  hollow_cleave:{ name: 'Hollow Cleave', type: 'phys', power: 0.8, target: 'enemies' },
  soul_drain:   { name: 'Soul Drain', type: 'mag', el: 'dark', power: 1.1, target: 'enemy', drain: 0.6 },
  call_hollow:  { name: 'Call the Hollow', type: 'summon', summon: ['soldier', 'hound'] },
  ember_hunger: { name: 'Ember Hunger', type: 'buff', target: 'self', status: { haste: 6, strUp: 6 } },
};

// Gear. Forge upgrades add 15% of the base stats per level (rounded up), up to +5.
const GEAR = {
  // Weapons
  rusty_sword:    { name: 'Rusty Sword', slot: 'weapon', stats: { str: 3 }, price: 60, tier: 1 },
  short_bow:      { name: 'Short Bow', slot: 'weapon', stats: { str: 2, spd: 1 }, price: 60, tier: 1 },
  ash_staff:      { name: 'Ash Staff', slot: 'weapon', stats: { mag: 3, mp: 5 }, price: 60, tier: 1 },
  iron_sword:     { name: 'Iron Sword', slot: 'weapon', stats: { str: 7 }, price: 280, tier: 2 },
  yew_bow:        { name: 'Yew Bow', slot: 'weapon', stats: { str: 5, spd: 2, crit: 3 }, price: 280, tier: 2 },
  oak_staff:      { name: 'Oak Staff', slot: 'weapon', stats: { mag: 7, mp: 10 }, price: 280, tier: 2 },
  steel_blade:    { name: 'Steel Blade', slot: 'weapon', stats: { str: 12 }, price: 650, tier: 3 },
  longbow:        { name: 'Longbow', slot: 'weapon', stats: { str: 9, spd: 3, crit: 5 }, price: 650, tier: 3 },
  runed_staff:    { name: 'Runed Staff', slot: 'weapon', stats: { mag: 12, mp: 15, res: 2 }, price: 650, tier: 3 },
  hunting_spear:  { name: 'Hunting Spear', slot: 'weapon', stats: { str: 4, mag: 1 }, price: 120, tier: 1 },
  twin_knives:    { name: 'Twin Knives', slot: 'weapon', stats: { str: 4, crit: 4 }, price: 120, tier: 1 },
  boar_spear:     { name: 'Boar Spear', slot: 'weapon', stats: { str: 8, mag: 2 }, price: 300, tier: 2 },
  stilettos:      { name: 'Stilettos', slot: 'weapon', stats: { str: 7, spd: 2, crit: 6 }, price: 300, tier: 2 },
  wolfbone_bow:   { name: 'Wolfbone Bow', slot: 'weapon', stats: { str: 6, spd: 2, crit: 6 }, price: 400, unique: true },
  redcap_cutlass: { name: 'Redcap Cutlass', slot: 'weapon', stats: { str: 9, crit: 6 }, price: 500, unique: true },
  barrow_blade:   { name: 'Barrow Blade', slot: 'weapon', stats: { str: 15, res: 3 }, price: 800, unique: true },
  fenwitch_staff: { name: 'Fenwitch Staff', slot: 'weapon', stats: { mag: 16, mp: 20 }, price: 900, unique: true },
  // Armour
  padded_jerkin:  { name: 'Padded Jerkin', slot: 'armour', stats: { def: 2, hp: 5 }, price: 50, tier: 1 },
  apprentice_robe:{ name: 'Apprentice Robe', slot: 'armour', stats: { def: 1, res: 2, mp: 5 }, price: 50, tier: 1 },
  leather_armour: { name: 'Leather Armour', slot: 'armour', stats: { def: 5, res: 1, hp: 10 }, price: 160, tier: 1 },
  chainmail:      { name: 'Chainmail', slot: 'armour', stats: { def: 9, hp: 25, spd: -1 }, price: 360, tier: 2 },
  woven_robe:     { name: 'Woven Robe', slot: 'armour', stats: { def: 3, res: 5, mp: 10 }, price: 300, tier: 2 },
  ranger_leathers:{ name: 'Ranger Leathers', slot: 'armour', stats: { def: 6, res: 3, spd: 1 }, price: 320, tier: 2 },
  scale_mail:     { name: 'Scale Mail', slot: 'armour', stats: { def: 14, hp: 40, spd: -1 }, price: 720, tier: 3 },
  silk_robe:      { name: 'Silk Robe', slot: 'armour', stats: { def: 5, res: 9, mp: 20 }, price: 650, tier: 3 },
  shadow_leathers:{ name: 'Shadow Leathers', slot: 'armour', stats: { def: 10, res: 5, spd: 2 }, price: 680, tier: 3 },
  drowned_plate:  { name: 'Drowned Plate', slot: 'armour', stats: { def: 18, res: 6, hp: 50 }, price: 1000, unique: true },
  // Charms
  lucky_coin:     { name: 'Lucky Coin', slot: 'charm', flags: { goldBonus: 0.25 }, price: 200, tier: 1, desc: '+25% gold from fights' },
  tusk_charm:     { name: 'Tusk Charm', slot: 'charm', stats: { hp: 15, str: 2 }, price: 250, unique: true },
  swift_feather:  { name: 'Swift Feather', slot: 'charm', stats: { spd: 3 }, price: 400, tier: 2 },
  scholar_ring:   { name: 'Scholar\'s Ring', slot: 'charm', flags: { xpBonus: 0.2 }, price: 450, tier: 2, desc: '+20% experience for the wearer' },
  ward_stone:     { name: 'Ward Stone', slot: 'charm', flags: { immune: ['poison', 'burn'] }, price: 350, tier: 2, desc: 'Immune to poison and burns' },
  ember_charm:    { name: 'Ember Charm', slot: 'charm', flags: { boost_fire: 0.2 }, price: 600, tier: 3, desc: 'Fire damage +20%' },
  rime_charm:     { name: 'Rime Charm', slot: 'charm', flags: { boost_frost: 0.2 }, price: 600, tier: 3, desc: 'Frost damage +20%' },
  prayer_beads:   { name: 'Prayer Beads', slot: 'charm', flags: { boost_light: 0.2, healBoost: 0.2 }, price: 600, tier: 3, desc: 'Light damage and healing +20%' },
  iron_heart:     { name: 'Iron Heart', slot: 'charm', stats: { hp: 40, def: 3 }, price: 600, tier: 3 },
};

const ITEMS = {
  potion:     { name: 'Potion', price: 25, tier: 1, target: 'ally', heal: 70, desc: 'Restores 70 HP' },
  hi_potion:  { name: 'Greater Potion', price: 90, tier: 2, target: 'ally', heal: 200, desc: 'Restores 200 HP' },
  ether:      { name: 'Mana Tonic', price: 70, tier: 1, target: 'ally', mpHeal: 30, desc: 'Restores 30 MP' },
  feather:    { name: 'Ember Feather', price: 150, tier: 1, target: 'deadAlly', revive: 0.3, desc: 'Revives a fallen ally with 30% HP' },
  antidote:   { name: 'Antidote', price: 12, tier: 1, target: 'ally', cure: ['poison', 'burn', 'slow', 'defDown'], desc: 'Cures poison, burns, slow and broken armour' },
  firebomb:   { name: 'Firebomb', price: 55, tier: 2, target: 'enemies', bomb: 80, el: 'fire', desc: '80 fire damage to every enemy' },
  smoke_bomb: { name: 'Smoke Bomb', price: 40, tier: 1, target: 'none', flee: true, desc: 'Escape any fight except a boss' },
  tonic:      { name: 'Camp Stew', price: 120, tier: 2, target: 'none', field: true, partyHeal: 0.5, desc: 'Out of battle only. Restores half HP and MP to the whole party' },
};

const MATS = {
  pelt:  { name: 'Wolf Pelt' },
  ore:   { name: 'Iron Ore' },
  bone:  { name: 'Bone Dust' },
  moss:  { name: 'Fen Moss' },
  shard: { name: 'Shadow Shard' },
};
// Forge costs to go from +n to +n+1.
const FORGE = [
  { gold: 80, mats: { pelt: 2 } },
  { gold: 200, mats: { pelt: 2, ore: 2 } },
  { gold: 420, mats: { ore: 3, bone: 2 } },
  { gold: 800, mats: { bone: 3, moss: 3 } },
  { gold: 1400, mats: { moss: 3, shard: 3 } },
];

// Enemies. Stats scale with level; multipliers shape each type.
// weak: damage taken multiplier by element. tags: undead, hollow.
const ENEMIES = {
  boarling: { name: 'Wild Boar', sprite: 'boarling', tame: 'boarling', m: { hp: 1.25, str: 1.1, mag: .5, def: 1.1, res: .7, spd: .9 }, xp: 1.1, gold: .8,
              skills: [{ id: 'gore', w: 1 }, { id: 'bite', w: 1 }], drops: [{ mat: 'pelt', c: .5 }] },
  rat:      { name: 'Thorn Rat', tame: 'rat', sprite: 'rat', m: { hp: .7, str: .8, mag: .5, def: .7, res: .6, spd: 1.2 }, xp: .8, gold: .7,
              skills: [{ id: 'bite', w: 1 }], drops: [{ mat: 'pelt', c: .2 }] },
  wolf:     { name: 'Grey Wolf', tame: 'wolf', sprite: 'wolf', m: { hp: 1, str: 1, mag: .5, def: .9, res: .7, spd: 1.15 }, xp: 1, gold: 1,
              skills: [{ id: 'bite', w: 3 }, { id: 'savage_bite', w: 1 }], drops: [{ mat: 'pelt', c: .5 }] },
  briar:    { name: 'Briar Sprite', tame: 'briar', sprite: 'briar', m: { hp: .8, str: .5, mag: 1, def: .6, res: 1, spd: 1 }, xp: 1, gold: 1, weak: { fire: 1.6 },
              skills: [{ id: 'thorn_lash', w: 1 }], drops: [{ item: 'potion', c: .15 }] },
  old_tusk: { name: 'Old Tusk', sprite: 'boar', boss: true, m: { hp: 11.7, str: 1.51, mag: .5, def: 1.3, res: .9, spd: .85 }, xp: 6, gold: 6,
              skills: [{ id: 'gore', w: 3 }, { id: 'trample', w: 2 }, { id: 'enrage', w: 0, phase: .5 }],
              drops: [{ mat: 'pelt', c: 1, n: 3 }, { gear: 'tusk_charm', c: 1, once: true }] },

  cutthroat:{ name: 'Cutthroat', sprite: 'bandit', m: { hp: 1, str: 1.1, mag: .5, def: 1, res: .8, spd: 1.1 }, xp: 1, gold: 1.4,
              skills: [{ id: 'slash', w: 3 }, { id: 'dirty_cut', w: 1 }], drops: [{ mat: 'ore', c: .3 }, { item: 'potion', c: .1 }] },
  archer:   { name: 'Bandit Archer', sprite: 'bandit_archer', m: { hp: .85, str: 1.05, mag: .5, def: .8, res: .8, spd: 1.05 }, xp: 1, gold: 1.3,
              skills: [{ id: 'arrow', w: 3 }, { id: 'volley', w: 1 }], drops: [{ mat: 'ore', c: .2 }] },
  crows:    { name: 'Crow Swarm', tame: 'crows', sprite: 'crow', m: { hp: .7, str: .85, mag: .5, def: .5, res: .6, spd: 1.4 }, xp: .9, gold: .5, weak: { fire: 1.3, frost: 1.3 },
              skills: [{ id: 'peck', w: 1 }], drops: [{ mat: 'pelt', c: .2 }] },
  rook:     { name: 'Rook the Red', sprite: 'rook', boss: true, m: { hp: 11.7, str: 1.46, mag: .6, def: 1.1, res: 1, spd: 1.1 }, xp: 6, gold: 10,
              skills: [{ id: 'slash', w: 3 }, { id: 'volley', w: 1 }, { id: 'war_cry', w: 1 }, { id: 'whistle', w: 0, phase: .5 }],
              drops: [{ mat: 'ore', c: 1, n: 3 }, { gear: 'redcap_cutlass', c: 1, once: true }] },

  skeleton: { name: 'Skeleton', sprite: 'skeleton', tags: ['undead'], m: { hp: 1, str: 1.1, mag: .5, def: 1.2, res: .7, spd: .95 }, xp: 1, gold: 1,
              weak: { light: 2, fire: 1.3, frost: .5 }, skills: [{ id: 'slash', w: 2 }, { id: 'bone_rattle', w: 1 }], drops: [{ mat: 'bone', c: .4 }] },
  bat:      { name: 'Grave Bat', tame: 'bat', sprite: 'bat', m: { hp: .7, str: .9, mag: .5, def: .7, res: .7, spd: 1.4 }, xp: .9, gold: .8,
              weak: { light: 1.5, fire: 1.3 }, skills: [{ id: 'drain', w: 1 }], drops: [{ mat: 'pelt', c: .2 }] },
  wight:    { name: 'Barrow Wight', sprite: 'wight', tags: ['undead'], m: { hp: 1.1, str: .6, mag: 1.15, def: .8, res: 1.2, spd: 1 }, xp: 1.2, gold: 1.2,
              weak: { light: 2, fire: 1.5, frost: .5 }, skills: [{ id: 'frost_touch', w: 2 }, { id: 'shadow_bolt', w: 2 }], drops: [{ mat: 'bone', c: .3 }, { item: 'ether', c: .1 }] },
  shade:    { name: 'The Barrow King\'s Shade', sprite: 'shade', boss: true, tags: ['undead'], m: { hp: 13.0, str: 0.9, mag: 1.35, def: 1, res: 1.3, spd: 1 }, xp: 7, gold: 10,
              weak: { light: 1.8, fire: 1.2, frost: .5 },
              skills: [{ id: 'shadow_bolt', w: 3 }, { id: 'grave_chill', w: 2 }, { id: 'drain', w: 1 }, { id: 'raise_dead', w: 0, phase: .6 }],
              drops: [{ mat: 'bone', c: 1, n: 3 }, { gear: 'barrow_blade', c: 1, once: true }] },

  lurker:   { name: 'Bog Lurker', tame: 'lurker', sprite: 'lurker', m: { hp: 1.3, str: 1.1, mag: .5, def: 1.1, res: .8, spd: .8 }, xp: 1.1, gold: 1,
              weak: { fire: 1.3 }, skills: [{ id: 'spit', w: 1 }, { id: 'drag', w: 2 }], drops: [{ mat: 'moss', c: .4 }] },
  hag:      { name: 'Fen Hag', sprite: 'hag', m: { hp: .9, str: .5, mag: 1.15, def: .8, res: 1.1, spd: 1 }, xp: 1.2, gold: 1.3,
              weak: { fire: 1.4 }, skills: [{ id: 'hex', w: 2 }, { id: 'frost_touch', w: 2 }, { id: 'mend', w: 2, when: 'allyHurt' }], drops: [{ mat: 'moss', c: .3 }, { item: 'ether', c: .15 }] },
  slime:    { name: 'Mire Slime', tame: 'slime', sprite: 'slime', m: { hp: 1.2, str: .9, mag: .5, def: 1.7, res: .5, spd: .8 }, xp: 1, gold: .9,
              weak: { fire: 1.6, frost: 1.4 }, skills: [{ id: 'engulf', w: 1 }], drops: [{ mat: 'moss', c: .3 }, { item: 'potion', c: .2 }] },
  drowned:  { name: 'The Drowned Knight', sprite: 'drowned', boss: true, m: { hp: 18.2, str: 1.74, mag: .9, def: 1.5, res: .9, spd: .95 }, xp: 8, gold: 12,
              weak: { fire: 1.3, light: 1.3 },
              skills: [{ id: 'slash', w: 3 }, { id: 'tidal_sweep', w: 2 }, { id: 'rust_curse', w: 1 }, { id: 'brace', w: 0, phase: .5 }],
              drops: [{ mat: 'moss', c: 1, n: 3 }, { gear: 'drowned_plate', c: 1, once: true }] },

  soldier:  { name: 'Hollow Soldier', sprite: 'soldier', tags: ['hollow'], m: { hp: 1.2, str: 1.15, mag: .5, def: 1.3, res: 1, spd: .95 }, xp: 1.2, gold: 1.2,
              weak: { light: 1.6 }, skills: [{ id: 'slash', w: 3 }, { id: 'brace', w: 1 }], drops: [{ mat: 'shard', c: .3 }] },
  hound:    { name: 'Shadow Hound', tame: 'hound', sprite: 'hound', tags: ['hollow'], m: { hp: 1, str: 1.2, mag: .5, def: .9, res: .8, spd: 1.4 }, xp: 1.1, gold: 1,
              weak: { light: 1.5, fire: 1.2 }, skills: [{ id: 'bite', w: 2 }, { id: 'pounce', w: 1 }], drops: [{ mat: 'shard', c: .2 }, { mat: 'pelt', c: .3 }] },
  acolyte:  { name: 'Hollow Acolyte', sprite: 'acolyte', tags: ['hollow'], m: { hp: .9, str: .5, mag: 1.25, def: .9, res: 1.2, spd: 1 }, xp: 1.3, gold: 1.4,
              weak: { light: 1.6 }, skills: [{ id: 'shadow_bolt', w: 3 }, { id: 'dark_rite', w: 1 }, { id: 'mend', w: 2, when: 'allyHurt' }], drops: [{ mat: 'shard', c: .3 }, { item: 'ether', c: .15 }] },
  warden:   { name: 'Warden Morvane', sprite: 'warden', boss: true, tags: ['hollow'], m: { hp: 18.2, str: 1.46, mag: 1.3, def: 1.3, res: 1.3, spd: 1 }, xp: 12, gold: 25,
              weak: { light: 1.3 },
              skills: [{ id: 'slash', w: 2 }, { id: 'hollow_cleave', w: 2 }, { id: 'shadow_bolt', w: 2 }, { id: 'soul_drain', w: 1 },
                       { id: 'call_hollow', w: 0, phase: .6 }, { id: 'ember_hunger', w: 0, phase: .3 }],
              drops: [{ mat: 'shard', c: 1, n: 5 }] },
};

// Areas, in story order. Each is a path of `steps`. Bosses wait at the end.
const AREAS = [
  { id: 'thornwood', name: 'Thornwood', lvl: [1, 3], steps: 12, size: [1, 3], mat: 'pelt',
    pool: ['rat', 'rat', 'wolf', 'wolf', 'briar'], boss: [{ t: 'old_tusk', lvl: 4 }],
    unique: { 5: { tome: true }, 9: { gear: 'wolfbone_bow' } },
    desc: 'Pine and bramble below the keep. Something has been tearing up the farms.' },
  { id: 'millroad', name: 'Old Mill Road', lvl: [3, 5], steps: 13, size: [2, 3], mat: 'ore',
    pool: ['cutthroat', 'cutthroat', 'archer', 'crows'], boss: [{ t: 'rook', lvl: 6 }, { t: 'cutthroat', lvl: 5 }],
    unique: { 6: { tome: true }, 10: { gear: 'leather_armour' } },
    desc: 'The road to market. Bandits have moved in now nobody is guarding it.' },
  { id: 'barrows', name: 'Barrow Hills', lvl: [5, 7], steps: 14, size: [2, 3], mat: 'bone',
    pool: ['skeleton', 'skeleton', 'bat', 'wight'], boss: [{ t: 'shade', lvl: 8 }],
    unique: { 6: { tome: true }, 11: { gear: 'prayer_beads' } },
    desc: 'Old kings sleep under these hills. They have stopped sleeping.' },
  { id: 'fenmire', name: 'Fenmire', lvl: [7, 9], steps: 15, size: [2, 4], mat: 'moss',
    pool: ['lurker', 'lurker', 'hag', 'slime'], boss: [{ t: 'drowned', lvl: 10 }],
    unique: { 7: { tome: true }, 12: { gear: 'fenwitch_staff' } },
    desc: 'Black water and reeds taller than Bram. The only way to the tower.' },
  { id: 'tower', name: 'The Hollow Tower', lvl: [9, 11], steps: 16, size: [2, 4], mat: 'shard',
    pool: ['soldier', 'soldier', 'hound', 'acolyte'], boss: [{ t: 'warden', lvl: 12 }],
    unique: { 5: { tome: true }, 11: { gear: 'iron_heart' } },
    desc: 'Where the raids come from. Its windows show no light at all.' },
];

// Story scenes. Each line is [speaker, text]. Speaker '' is narration.
const STORY = {
  intro: [
    ['', 'Ashby burned three nights ago. The Hollow came out of the north with no banners and no faces, and by morning the village was ash.'],
    ['', 'Three got out. A smith\'s son, a poacher and an apprentice who never finished her training. They ran to the only shelter left, the ruined keep of Emberwake on the hill.'],
    ['wren', 'Well. It\'s got walls. Mostly.'],
    ['bram', 'They\'ll come back. They were looking for something and they didn\'t find it.'],
    ['isolde', 'They were looking for me.'],
    ['isolde', 'My master gave me a stone before the end. It\'s always warm. Every spell I\'ve cast since has come out wrong. Bigger.'],
    ['bram', 'Then we get stronger than they are. Starting with whatever\'s killing the sheep in Thornwood. We need food, and we need to know we can fight.'],
    ['wren', 'Three nobodies against an army. I like those odds less every time I count.'],
  ],
  thornwood_in: [
    ['wren', 'Tracks everywhere. Wolves mostly. And something heavier.'],
    ['bram', 'Stay close. If it goes bad we walk back to the keep. No shame in it.'],
  ],
  thornwood_boss: [
    ['', 'The brambles are flattened in a wide path. At the end of it, a boar the size of a cart lifts its head.'],
    ['wren', 'Old Tusk. Farmers have been trying to kill him for ten years.'],
    ['bram', 'Then he\'s due.'],
  ],
  thornwood_out: [
    ['', 'Bram pulls a black arrow out of Old Tusk\'s hide. The shaft is cold to the touch, colder than the night.'],
    ['bram', 'Hollow make. Someone shot him and drove him at the farms.'],
    ['wren', 'So they\'re herding things at us. Lovely.'],
    ['isolde', 'The tracks came from the Mill Road. If the Hollow are using it, the bandits there will know.'],
  ],
  millroad_in: [
    ['', 'The road is quiet in the wrong way. Carts lie on their sides with their loads gone.'],
    ['wren', 'Bandits. They\'ll have heard Ashby went down and come for the pickings.'],
  ],
  millroad_boss: [
    ['', 'A red coated man sits on an overturned cart, a trader tied up at his feet.'],
    ['', 'Rook the Red. Every child in Ashby knew his name.'],
    ['', 'He looks Isolde over and smiles.'],
    ['', '"The Hollow pay silver for anyone carrying a warm stone. I wasn\'t expecting you to walk up and hand yourself in."'],
  ],
  millroad_out: [
    ['', 'Rook runs for the trees. The trader, Hob, is shaking but unhurt.'],
    ['', '"Bless you. I\'ll set up at your keep, if you\'ll have me. Proper stock, better blades. Better prices for friends."'],
    ['', '"And listen. The Hollow came down from the tower beyond Fenmire. They pass through the Barrow Hills, and the dead have been walking since."'],
    ['bram', 'Then the barrows are next.'],
  ],
  barrows_in: [
    ['', 'Mist sits in the hollows between the mounds. Some of the mounds are open.'],
    ['isolde', 'My stone is hot. Really hot. Whatever is down here can feel it.'],
  ],
  barrows_boss: [
    ['', 'At the heart of the largest barrow a crowned shape rises out of a stone coffin.'],
    ['', '"The ember... carried by a child. The Warden said you would come. The King hungers for it."'],
  ],
  barrows_out: [
    ['', 'The Shade falls apart into cold ash. Isolde\'s stone glows bright enough to light the tomb.'],
    ['isolde', 'It\'s an ember. A piece of something old. That\'s why they want it, and that\'s why my magic is like this.'],
    ['wren', 'So we keep it, and we use it, and we make them sorry.'],
    ['', 'With the barrows quiet, Hob\'s caravans get through. His shop at the keep now stocks steel.'],
  ],
  fenmire_in: [
    ['', 'The road to the tower runs through Fenmire. The water is black and the reeds close in behind you.'],
    ['bram', 'Watch your feet. Things live under this.'],
  ],
  fenmire_boss: [
    ['', 'A knight in green, rusted plate stands chest deep in the water, blocking the causeway. Emberwake\'s crest is still on his shield.'],
    ['', '"None pass to the Warden. None."'],
  ],
  fenmire_out: [
    ['', 'The knight sinks to his knees. The hate drains out of his eyes.'],
    ['', '"Emberwake... I was its captain, once. I held it. Not well enough."'],
    ['', '"Take my plate. Hold it better than I did."'],
    ['', 'Beyond the causeway the Hollow Tower stands against the sky.'],
  ],
  tower_in: [
    ['', 'The tower doors stand open. Nothing inside makes a sound, not even your footsteps.'],
    ['wren', 'I hate this. For the record.'],
  ],
  tower_boss: [
    ['', 'At the top of the tower a tall figure in black iron turns from the window.'],
    ['', '"Little ember. You came all this way to me. How thoughtful."'],
    ['isolde', 'We came to stop you.'],
    ['', '"You came to be collected."'],
  ],
  tower_out: [
    ['', 'Warden Morvane falls. For a moment the tower is silent, then his laugh comes up out of the armour.'],
    ['', '"You\'ve won a tower. The Hollow King has a hundred more. He will come for the ember himself, with every soldier he has."'],
    ['bram', 'Then we\'ll need more than three of us.'],
    ['wren', 'And walls that aren\'t "mostly".'],
    ['isolde', 'We\'ll need an army.'],
    ['', 'End of Chapter One. Your party, gear and progress are saved and carry on into the next chapter, when Emberwake rises again.'],
  ],
};

const DATA = { STATS, HEROES, PARTY, ROSTER, SURGE, TALENT_REQ, TALENT_COST, TREES, SKILLS, GEAR, ITEMS, MATS, FORGE, ENEMIES, AREAS, STORY };
if (typeof module !== 'undefined' && module.exports) module.exports = DATA; else root.DATA = DATA;
})(this);
