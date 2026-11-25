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
  aldric: {
    name: 'Aldric', role: 'Barrow knight', sprite: 'aldric', recruit: true,
    blurb: 'A knight of the old king who has guarded an empty tomb for a hundred years. He is not entirely sure he is alive. He is right to wonder.',
    base:   { hp: 130, mp: 18, str: 13, mag: 7, def: 14, res: 10, spd: 7, crit: 5 },
    growth: { hp: 15, mp: 2, str: 2.1, mag: 1, def: 2, res: 1.4, spd: 0.6, crit: 0 },
    innate: ['stand_fast'],
    start: { talents: { oath: 1 }, equip: { weapon: 'iron_sword', armour: 'chainmail' } },
  },
  morwen: {
    name: 'Morwen', role: 'Fen witch', sprite: 'morwen', recruit: true,
    blurb: 'She lives on stilts above the black water and trades in secrets. Curses, drains and slows. Sees through things meant to stay hidden.',
    base:   { hp: 80, mp: 45, str: 5, mag: 16, def: 6, res: 13, spd: 11, crit: 5 },
    growth: { hp: 9, mp: 5, str: 0.6, mag: 2.6, def: 0.8, res: 1.9, spd: 0.9, crit: 0 },
    innate: ['mire'],
    start: { talents: { hex: 1 }, equip: { weapon: 'oak_staff', armour: 'woven_robe' } },
  },
};
const PARTY = ['bram', 'wren', 'isolde'];
const ROSTER = ['bram', 'wren', 'isolde', 'hesk', 'dace', 'aldric', 'morwen'];
// Ember Surge moves, one per hero. Unlocked by the story.
const SURGE = { bram: 'anvil_fall', wren: 'arrow_storm', isolde: 'ember_nova', hesk: 'wild_hunt', dace: 'thousand_cuts', aldric: 'kings_judgement', morwen: 'drowning_dark' };


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
  oath: { name: 'Oath', colour: '#b8c8e8', desc: 'An old knight\'s vows. Holy steel, warding and refusing to fall.',
    ranks: [
      { skill: 'oath_strike' },
      { stats: { hp: 30, def: 3 }, text: '+30 HP, +3 Defence' },
      { skill: 'grave_ward' },
      { flags: { undying: 1 }, text: 'Once per battle, survive a killing blow with 1 HP' },
      { skill: 'judgement' },
      { stats: { str: 5, res: 5, hp: 50 }, text: '+5 Strength, +5 Resistance, +50 HP' },
    ] },
  hex: { name: 'Hex', colour: '#8ad0a0', desc: 'Curses and drains from the fen. Weakens everything it touches.',
    ranks: [
      { skill: 'curse' },
      { stats: { mag: 3, mp: 10 }, text: '+3 Magic, +10 MP' },
      { skill: 'leech' },
      { stats: { mag: 4, res: 3 }, text: '+4 Magic, +3 Resistance' },
      { skill: 'doom' },
      { stats: { mag: 6 }, flags: { boost_dark: 0.25, mpCut: 0.1 }, text: '+6 Magic, dark damage +25%, spells cost 10% less' },
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
  // Oath and Hex
  oath_strike:  { name: 'Oath Strike', type: 'phys', el: 'light', power: 1.5, target: 'enemy', mp: 5, drain: 0.2, desc: 'Holy steel. Heals Aldric for a fifth of the damage.' },
  grave_ward:   { name: 'Grave Ward', type: 'buff', target: 'allies', mp: 9, status: { defUp: 3, resUp: 3 }, desc: 'Raises the whole party\'s defence and resistance.' },
  judgement:    { name: 'Judgement', type: 'phys', el: 'light', power: 1.2, target: 'enemies', mp: 16, desc: 'Holy damage to every enemy. Ruinous to the dead.' },
  curse:        { name: 'Curse', type: 'mag', el: 'dark', power: 0.9, target: 'enemy', mp: 5, status: { defDown: 3 }, chance: 0.9, desc: 'Dark damage that breaks armour.' },
  leech:        { name: 'Leech', type: 'mag', el: 'dark', power: 1.4, target: 'enemy', mp: 10, drain: 0.5, desc: 'Drains life. Morwen heals for half.' },
  doom:         { name: 'Doom', type: 'mag', el: 'dark', power: 1.3, target: 'enemies', mp: 20, status: { slow: 2 }, chance: 0.6, desc: 'Darkness over every enemy. Many slow down.' },
  stand_fast:   { name: 'Stand Fast', type: 'buff', target: 'self', mp: 0, status: { taunt: 2, defUp: 2 }, desc: 'Draw the enemy\'s attacks and brace. Costs nothing.' },
  mire:         { name: 'Mire', type: 'buff', target: 'enemies', mp: 6, status: { slow: 2 }, foe: true, desc: 'The ground turns to bog under every enemy. They slow.' },
  kings_judgement: { name: 'The King\'s Judgement', type: 'phys', el: 'light', power: 1.7, target: 'enemies', surge: true, after: { regen: 3 }, desc: 'Light breaks over the field. The party regenerates after.' },
  drowning_dark:{ name: 'Drowning Dark', type: 'mag', el: 'dark', power: 1.6, target: 'enemies', surge: true, status: { slow: 3, defDown: 3 }, chance: 1, desc: 'Black water rises. Every enemy slows and their armour rots.' },
  ravage:       { name: 'Ravage', type: 'phys', power: 2.1, target: 'enemy' },
  greater_mend: { name: 'Greater Mend', type: 'heal', power: 1.5, target: 'ally' },
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
  fox_flame:    { name: 'Fox Flame', type: 'mag', el: 'fire', power: 1.1, target: 'enemy', status: { burn: 3 }, chance: 0.35 },
  firebolt:     { name: 'Firebolt', type: 'mag', el: 'fire', power: 1.1, target: 'enemy' },
  fire_rain:    { name: 'Fire Rain', type: 'mag', el: 'fire', power: 0.6, target: 'enemies' },
  shield_bash:  { name: 'Shield Bash', type: 'phys', power: 1.2, target: 'enemy', status: { slow: 2 }, chance: 0.5 },
  whistle_beasts: { name: 'Whistle', type: 'summon', summon: ['wolf', 'wolf'] },
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
  raise_dead_again: { name: 'Raise Dead', type: 'summon', summon: ['skeleton', 'wight'] },
  // Boss moves that are announced a turn ahead (see mech.windup)
  apex_fury:    { name: 'Apex Fury', type: 'phys', power: 1.7, target: 'enemies' },
  tusk_charge:  { name: 'Tusk Charge', type: 'phys', power: 1.5, target: 'enemies' },
  execution:    { name: 'Execution', type: 'phys', power: 3.4, target: 'enemy' },
  hollow_rend:  { name: 'Hollow Rend', type: 'phys', power: 1.7, target: 'enemies', status: { defDown: 2 }, chance: 0.5 },
  grave_toll:   { name: 'Grave Toll', type: 'mag', el: 'dark', power: 1.8, target: 'enemies' },
  drowning_tide:{ name: 'Drowning Tide', type: 'mag', el: 'frost', power: 1.9, target: 'enemies', status: { slow: 2 }, chance: 0.6 },
  warden_doom:  { name: 'Hollow Doom', type: 'mag', el: 'dark', power: 2.1, target: 'enemies' },
  rust_plate:   { name: 'Rust Plate', type: 'buff', target: 'self', status: { defUp: 3 }, replate: true },
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
  kings_signet:   { name: 'King\'s Signet', slot: 'charm', stats: { mag: 4, res: 4, mp: 15, hp: 20 }, price: 900, unique: true },
  witch_lantern:  { name: 'Witch\'s Lantern', slot: 'charm', flags: { boost_dark: 0.2, boost_light: 0.2 }, stats: { mag: 3 }, price: 900, unique: true, desc: 'Light and dark damage +20%' },
  aldric_candle:  { name: 'Aldric\'s Candle', slot: 'charm', stats: { hp: 40, def: 4, res: 4 }, flags: { undying: 1 }, price: 0, unique: true, desc: 'Once per battle, the wearer survives a killing blow. It is still warm' },
  wild_crown:     { name: 'Crown of the Wild', slot: 'charm', stats: { hp: 30, str: 3, mag: 3, spd: 3 }, flags: { beastBond: 0.4 }, price: 2000, unique: true, desc: 'Creature damage +40% while the wearer is in the party' },
  hollow_crown:   { name: 'Hollow Crown', slot: 'charm', stats: { hp: 30, str: 5, mag: 5, spd: 3 }, price: 2400, unique: true },
  // Layer three: siege and arena prizes
  ashby_banner:   { name: 'Ashby Banner', slot: 'charm', stats: { hp: 20, str: 2, mag: 2, def: 2, res: 2 }, price: 500, unique: true },
  emberwake_blade:{ name: 'Emberwake Blade', slot: 'weapon', stats: { str: 16, crit: 8 }, price: 1100, unique: true },
  keepers_mantle: { name: 'Keeper\'s Mantle', slot: 'armour', stats: { def: 16, res: 12, hp: 60 }, price: 1400, unique: true },
  gladius:        { name: 'Pit Gladius', slot: 'weapon', stats: { str: 11, spd: 2, crit: 4 }, price: 700, unique: true },
  crowd_favour:   { name: 'Crowd\'s Favour', slot: 'charm', stats: { spd: 2 }, flags: { goldBonus: 0.3, xpBonus: 0.1 }, price: 700, unique: true, desc: '+30% gold and +10% XP for the wearer' },
  beastqueen_lash:{ name: 'Beastqueen\'s Lash', slot: 'weapon', stats: { str: 13, mag: 6, spd: 2 }, flags: { beastBond: 0.3 }, price: 1200, unique: true, desc: 'Creature damage +30% while the wearer is in the party' },
  champion_band:  { name: 'Champion\'s Band', slot: 'charm', stats: { hp: 40, str: 4, mag: 4, def: 3, res: 3, spd: 2 }, price: 2000, unique: true },
  // Apex trophies, first kill of each area's apex beast
  greymane_fang:  { name: 'Greymane\'s Fang', slot: 'charm', stats: { str: 6, spd: 3, crit: 6 }, price: 900, unique: true },
  murder_crown:   { name: 'Crown of the Murder', slot: 'charm', stats: { spd: 7, crit: 4 }, flags: { firstStrike: 1 }, price: 1100, unique: true, desc: 'Start every fight half ready' },
  night_wing:     { name: 'Old Night\'s Wing', slot: 'charm', stats: { mag: 8, res: 5, mp: 25 }, price: 1200, unique: true },
  lurker_heart:   { name: 'Mother Lurker\'s Heart', slot: 'charm', stats: { hp: 110, def: 7 }, price: 1300, unique: true },
  black_collar:   { name: 'The Black Collar', slot: 'charm', stats: { str: 8, mag: 8, spd: 3 }, flags: { beastBond: 0.25 }, price: 1600, unique: true, desc: 'Creature damage +25% while the wearer is in the party' },
  iron_heart:     { name: 'Iron Heart', slot: 'charm', stats: { hp: 40, def: 3 }, price: 600, tier: 3 },
  // Tier 4: chapter two, Brightwater's war stock
  knight_blade:   { name: 'Knight\'s Blade', slot: 'weapon', stats: { str: 18, crit: 3 }, price: 1300, tier: 4 },
  warbow:         { name: 'Warbow', slot: 'weapon', stats: { str: 14, spd: 4, crit: 7 }, price: 1300, tier: 4 },
  starsteel_staff:{ name: 'Starsteel Staff', slot: 'weapon', stats: { mag: 18, mp: 25, res: 3 }, price: 1300, tier: 4 },
  war_pike:       { name: 'War Pike', slot: 'weapon', stats: { str: 15, mag: 4, def: 3 }, price: 1300, tier: 4 },
  nightfang:      { name: 'Nightfang Knives', slot: 'weapon', stats: { str: 13, spd: 3, crit: 9 }, price: 1300, tier: 4 },
  plate_harness:  { name: 'Plate Harness', slot: 'armour', stats: { def: 22, hp: 70, spd: -1 }, price: 1400, tier: 4 },
  archmage_robe:  { name: 'Archmage\'s Robe', slot: 'armour', stats: { def: 7, res: 15, mp: 35 }, price: 1300, tier: 4 },
  stalker_coat:   { name: 'Stalker\'s Coat', slot: 'armour', stats: { def: 15, res: 8, spd: 3, crit: 3 }, price: 1350, tier: 4 },
  guardian_amulet:{ name: 'Guardian Amulet', slot: 'charm', stats: { hp: 80, def: 5, res: 5 }, price: 1200, tier: 4 },
  focus_gem:      { name: 'Focus Gem', slot: 'charm', stats: { mag: 8, mp: 20 }, price: 1200, tier: 4 },
  hunters_eye:    { name: 'Hunter\'s Eye', slot: 'charm', stats: { crit: 10, spd: 3 }, price: 1200, tier: 4 },
  tamer_whistle:  { name: 'Tamer\'s Whistle', slot: 'charm', stats: { str: 4 }, flags: { beastBond: 0.3 }, price: 1200, tier: 4, desc: 'Creature damage +30% while the wearer is in the party' },
  // Tier 5: once Kingsbridge is held, the royal armouries open
  kingsbane:      { name: 'Kingsbane', slot: 'weapon', stats: { str: 26, crit: 6 }, price: 2600, tier: 5 },
  skyreaver:      { name: 'Skyreaver Bow', slot: 'weapon', stats: { str: 20, spd: 6, crit: 10 }, price: 2600, tier: 5 },
  ember_sceptre:  { name: 'Ember Sceptre', slot: 'weapon', stats: { mag: 26, mp: 40, res: 5 }, flags: { boost_fire: 0.15 }, price: 2700, tier: 5, desc: 'Fire damage +15%' },
  dragon_pike:    { name: 'Dragon Pike', slot: 'weapon', stats: { str: 21, mag: 6, def: 5 }, price: 2600, tier: 5 },
  whisper_blades: { name: 'Whisper Blades', slot: 'weapon', stats: { str: 19, spd: 5, crit: 14 }, price: 2600, tier: 5 },
  starsteel_plate:{ name: 'Starsteel Plate', slot: 'armour', stats: { def: 32, hp: 120, res: 8 }, price: 2900, tier: 5 },
  robe_of_stars:  { name: 'Robe of Stars', slot: 'armour', stats: { def: 10, res: 22, mp: 50, mag: 4 }, price: 2700, tier: 5 },
  phantom_coat:   { name: 'Phantom Coat', slot: 'armour', stats: { def: 22, res: 12, spd: 5, crit: 5 }, price: 2800, tier: 5 },
  heart_of_oak:   { name: 'Heart of Oak', slot: 'charm', stats: { hp: 150, def: 8 }, price: 2400, tier: 5 },
  sage_eye:       { name: 'Sage\'s Eye', slot: 'charm', stats: { mag: 12, res: 6, mp: 30 }, price: 2400, tier: 5 },
  war_horn:       { name: 'War Horn', slot: 'charm', stats: { str: 8, spd: 4, crit: 6 }, price: 2400, tier: 5 },
  // Beast gear: one piece per creature
  leather_collar: { name: 'Leather Collar', slot: 'beast', stats: { hp: 30, def: 3 }, price: 200, tier: 2 },
  spiked_collar:  { name: 'Spiked Collar', slot: 'beast', stats: { str: 8, spd: 2 }, price: 650, tier: 3 },
  iron_barding:   { name: 'Iron Barding', slot: 'beast', stats: { def: 10, hp: 60 }, price: 650, tier: 3 },
  runed_collar:   { name: 'Runed Collar', slot: 'beast', stats: { str: 12, mag: 12 }, price: 1300, tier: 4 },
  starsteel_barding: { name: 'Starsteel Barding', slot: 'beast', stats: { def: 18, hp: 120, res: 8 }, price: 1400, tier: 4 },
  emberbrand:     { name: 'Emberbrand', slot: 'beast', stats: { str: 18, mag: 18, spd: 4 }, price: 2600, tier: 5 },
  wardens_chain:  { name: 'Warden\'s Chain', slot: 'beast', stats: { hp: 200, def: 22, res: 14 }, price: 2600, tier: 5 },
};

const ITEMS = {
  potion:     { name: 'Potion', price: 25, tier: 1, target: 'ally', heal: 70, desc: 'Restores 70 HP' },
  hi_potion:  { name: 'Greater Potion', price: 90, tier: 2, target: 'ally', heal: 200, desc: 'Restores 200 HP' },
  ether:      { name: 'Mana Tonic', price: 70, tier: 1, target: 'ally', mpHeal: 30, desc: 'Restores 30 MP' },
  feather:    { name: 'Ember Feather', price: 150, tier: 1, target: 'deadAlly', revive: 0.3, desc: 'Revives a fallen ally with 30% HP' },
  antidote:   { name: 'Antidote', price: 12, tier: 1, target: 'ally', cure: ['poison', 'burn', 'slow', 'defDown'], desc: 'Cures poison, burns, slow and broken armour' },
  rust_acid:  { name: 'Rust Acid', price: 45, tier: 1, target: 'enemies', foeStatus: { defDown: 3 }, desc: 'Eats through armour: breaks every enemy\'s defence, and shatters boss plate' },
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
  starsteel: { name: 'Starsteel' },
  emberglass: { name: 'Emberglass' },
};
// Forge costs to go from +n to +n+1.
const FORGE = [
  { gold: 80, mats: { pelt: 2 } },
  { gold: 200, mats: { pelt: 2, ore: 2 } },
  { gold: 420, mats: { ore: 3, bone: 2 } },
  { gold: 800, mats: { bone: 3, moss: 3 } },
  { gold: 1400, mats: { moss: 3, shard: 3 } },
  // +6 to +10: war materials. Starsteel from the Stonecut mine and fallen forts, emberglass from Hollow lieutenants and apex beasts.
  { gold: 2200, mats: { ore: 6, starsteel: 2 } },
  { gold: 3000, mats: { starsteel: 3, shard: 3 } },
  { gold: 4000, mats: { starsteel: 4, emberglass: 1 } },
  { gold: 5500, mats: { starsteel: 5, emberglass: 2 } },
  { gold: 7500, mats: { starsteel: 6, emberglass: 3 } },
];

// Enemies. Stats scale with level; multipliers shape each type.
// weak: damage taken multiplier by element. tags: undead, hollow.
// Elite enemies: a tougher version of a normal enemy with one twist and better drops.
const ELITES = {
  ironhide:     { name: 'Ironhide', desc: 'Armour turns most blows until something breaks it.' },
  bloodthirsty: { name: 'Bloodthirsty', desc: 'Heals from every wound it deals.' },
  swift:        { name: 'Swift', desc: 'Acts far more often.' },
  spellward:    { name: 'Spellward', desc: 'Magic barely touches it.' },
  vengeful:     { name: 'Vengeful', desc: 'Bursts when it falls, hurting the whole party.' },
};
const ENEMIES = {
  boarling: { name: 'Wild Boar', sprite: 'boarling', tame: 'boarling', m: { hp: 1.25, str: 1.1, mag: .5, def: 1.1, res: .7, spd: .9 }, xp: 1.1, gold: .8,
              skills: [{ id: 'gore', w: 1 }, { id: 'bite', w: 1 }], drops: [{ mat: 'pelt', c: .5 }] },
  rat:      { name: 'Thorn Rat', tame: 'rat', sprite: 'rat', m: { hp: .7, str: .8, mag: .5, def: .7, res: .6, spd: 1.2 }, xp: .8, gold: .7,
              skills: [{ id: 'bite', w: 1 }], drops: [{ mat: 'pelt', c: .2 }] },
  wolf:     { name: 'Grey Wolf', tame: 'wolf', sprite: 'wolf', m: { hp: 1, str: 1, mag: .5, def: .9, res: .7, spd: 1.15 }, xp: 1, gold: 1,
              skills: [{ id: 'bite', w: 3 }, { id: 'savage_bite', w: 1 }], drops: [{ mat: 'pelt', c: .5 }] },
  briar:    { name: 'Briar Sprite', tame: 'briar', sprite: 'briar', m: { hp: .8, str: .5, mag: 1, def: .6, res: 1, spd: 1 }, xp: 1, gold: 1, weak: { fire: 1.6 },
              skills: [{ id: 'thorn_lash', w: 1 }], drops: [{ item: 'potion', c: .15 }] },
  old_tusk: { name: 'Old Tusk', sprite: 'boar', boss: true,
              mech: { windup: { every: 4, skill: 'tusk_charge', text: 'Old Tusk paws the ground. A huge charge is coming. Defend!' } }, m: { hp: 11.7, str: 1.51, mag: .5, def: 1.3, res: .9, spd: .85 }, xp: 6, gold: 6,
              skills: [{ id: 'gore', w: 3 }, { id: 'trample', w: 2 }, { id: 'enrage', w: 0, phase: .5 }],
              drops: [{ mat: 'pelt', c: 1, n: 3 }, { gear: 'tusk_charm', c: 1, once: true }] },

  cutthroat:{ name: 'Cutthroat', sprite: 'bandit', m: { hp: 1, str: 1.1, mag: .5, def: 1, res: .8, spd: 1.1 }, xp: 1, gold: 1.4,
              skills: [{ id: 'slash', w: 3 }, { id: 'dirty_cut', w: 1 }], drops: [{ mat: 'ore', c: .3 }, { item: 'potion', c: .1 }] },
  archer:   { name: 'Bandit Archer', sprite: 'bandit_archer', m: { hp: .85, str: 1.05, mag: .5, def: .8, res: .8, spd: 1.05 }, xp: 1, gold: 1.3,
              skills: [{ id: 'arrow', w: 3 }, { id: 'volley', w: 1 }], drops: [{ mat: 'ore', c: .2 }] },
  crows:    { name: 'Crow Swarm', tame: 'crows', sprite: 'crow', m: { hp: .7, str: .85, mag: .5, def: .5, res: .6, spd: 1.4 }, xp: .9, gold: .5, weak: { fire: 1.3, frost: 1.3 },
              skills: [{ id: 'peck', w: 1 }], drops: [{ mat: 'pelt', c: .2 }] },
  rook:     { name: 'Rook the Red', sprite: 'rook', boss: true,
              mech: { windup: { every: 4, skill: 'execution', mark: true, text: 'Rook marks {t} for execution. Defend, or draw his eye with a taunt!' } }, m: { hp: 11.7, str: 1.46, mag: .6, def: 1.1, res: 1, spd: 1.1 }, xp: 6, gold: 10,
              skills: [{ id: 'slash', w: 3 }, { id: 'volley', w: 1 }, { id: 'war_cry', w: 1 }, { id: 'whistle', w: 0, phase: .5 }],
              drops: [{ mat: 'ore', c: 1, n: 3 }, { gear: 'redcap_cutlass', c: 1, once: true }] },

  skeleton: { name: 'Skeleton', sprite: 'skeleton', tags: ['undead'], m: { hp: 1, str: 1.1, mag: .5, def: 1.2, res: .7, spd: .95 }, xp: 1, gold: 1,
              weak: { light: 2, fire: 1.3, frost: .5 }, skills: [{ id: 'slash', w: 2 }, { id: 'bone_rattle', w: 1 }], drops: [{ mat: 'bone', c: .4 }] },
  bat:      { name: 'Grave Bat', tame: 'bat', sprite: 'bat', m: { hp: .7, str: .9, mag: .5, def: .7, res: .7, spd: 1.4 }, xp: .9, gold: .8,
              weak: { light: 1.5, fire: 1.3 }, skills: [{ id: 'drain', w: 1 }], drops: [{ mat: 'pelt', c: .2 }] },
  wight:    { name: 'Barrow Wight', sprite: 'wight', tags: ['undead'], m: { hp: 1.1, str: .6, mag: 1.15, def: .8, res: 1.2, spd: 1 }, xp: 1.2, gold: 1.2,
              weak: { light: 2, fire: 1.5, frost: .5 }, skills: [{ id: 'frost_touch', w: 2 }, { id: 'shadow_bolt', w: 2 }], drops: [{ mat: 'bone', c: .3 }, { item: 'ether', c: .1 }] },
  shade:    { name: 'The Barrow King\'s Shade', sprite: 'shade', boss: true, tags: ['undead'],
              mech: { warded: 'The Shade is shielded while its dead stand. Put them down first.', windup: { every: 4, skill: 'grave_toll', text: 'The barrow bell starts to toll. Brace yourselves!' } }, m: { hp: 13.0, str: 0.9, mag: 1.35, def: 1, res: 1.3, spd: 1 }, xp: 7, gold: 10,
              weak: { light: 1.8, fire: 1.2, frost: .5 },
              skills: [{ id: 'shadow_bolt', w: 3 }, { id: 'grave_chill', w: 2 }, { id: 'drain', w: 1 }, { id: 'raise_dead', w: 0, phase: .6 }, { id: 'raise_dead_again', w: 0, phase: .3 }],
              drops: [{ mat: 'bone', c: 1, n: 3 }, { gear: 'barrow_blade', c: 1, once: true }] },

  lurker:   { name: 'Bog Lurker', tame: 'lurker', sprite: 'lurker', m: { hp: 1.3, str: 1.1, mag: .5, def: 1.1, res: .8, spd: .8 }, xp: 1.1, gold: 1,
              weak: { fire: 1.3 }, skills: [{ id: 'spit', w: 1 }, { id: 'drag', w: 2 }], drops: [{ mat: 'moss', c: .4 }] },
  hag:      { name: 'Fen Hag', sprite: 'hag', m: { hp: .9, str: .5, mag: 1.15, def: .8, res: 1.1, spd: 1 }, xp: 1.2, gold: 1.3,
              weak: { fire: 1.4 }, skills: [{ id: 'hex', w: 2 }, { id: 'frost_touch', w: 2 }, { id: 'mend', w: 2, when: 'allyHurt' }], drops: [{ mat: 'moss', c: .3 }, { item: 'ether', c: .15 }] },
  slime:    { name: 'Mire Slime', tame: 'slime', sprite: 'slime', m: { hp: 1.2, str: .9, mag: .5, def: 1.7, res: .5, spd: .8 }, xp: 1, gold: .9,
              weak: { fire: 1.6, frost: 1.4 }, skills: [{ id: 'engulf', w: 1 }], drops: [{ mat: 'moss', c: .3 }, { item: 'potion', c: .2 }] },
  drowned:  { name: 'The Drowned Knight', sprite: 'drowned', boss: true,
              mech: { plated: 'Rusted plate turns most blows. Break his armour first.', windup: { every: 4, skill: 'drowning_tide', text: 'The water rises around the Drowned Knight. Brace!' } }, m: { hp: 18.2, str: 1.74, mag: .9, def: 1.5, res: .9, spd: .95 }, xp: 8, gold: 12,
              weak: { fire: 1.3, light: 1.3 },
              skills: [{ id: 'slash', w: 3 }, { id: 'tidal_sweep', w: 2 }, { id: 'rust_curse', w: 1 }, { id: 'rust_plate', w: 0, phase: .5 }],
              drops: [{ mat: 'moss', c: 1, n: 3 }, { gear: 'drowned_plate', c: 1, once: true }] },

  soldier:  { name: 'Hollow Soldier', sprite: 'soldier', tags: ['hollow'], m: { hp: 1.2, str: 1.15, mag: .5, def: 1.3, res: 1, spd: .95 }, xp: 1.2, gold: 1.2,
              weak: { light: 1.6 }, skills: [{ id: 'slash', w: 3 }, { id: 'brace', w: 1 }], drops: [{ mat: 'shard', c: .3 }] },
  hound:    { name: 'Shadow Hound', tame: 'hound', sprite: 'hound', tags: ['hollow'], m: { hp: 1, str: 1.2, mag: .5, def: .9, res: .8, spd: 1.4 }, xp: 1.1, gold: 1,
              weak: { light: 1.5, fire: 1.2 }, skills: [{ id: 'bite', w: 2 }, { id: 'pounce', w: 1 }], drops: [{ mat: 'shard', c: .2 }, { mat: 'pelt', c: .3 }] },
  acolyte:  { name: 'Hollow Acolyte', sprite: 'acolyte', tags: ['hollow'], m: { hp: .9, str: .5, mag: 1.25, def: .9, res: 1.2, spd: 1 }, xp: 1.3, gold: 1.4,
              weak: { light: 1.6 }, skills: [{ id: 'shadow_bolt', w: 3 }, { id: 'dark_rite', w: 1 }, { id: 'mend', w: 2, when: 'allyHurt' }], drops: [{ mat: 'shard', c: .3 }, { item: 'ether', c: .15 }] },
  gladiator:{ name: 'Gladiator', sprite: 'gladiator', m: { hp: 1.25, str: 1.2, mag: .5, def: 1.1, res: .9, spd: 1.05 }, xp: 1.2, gold: 1.4,
              skills: [{ id: 'slash', w: 3 }, { id: 'power_strike', w: 1 }, { id: 'war_cry', w: 1 }], drops: [] },
  pitmage:  { name: 'Pit Mage', sprite: 'pitmage', m: { hp: .95, str: .5, mag: 1.3, def: .8, res: 1.2, spd: 1 }, xp: 1.2, gold: 1.4, weak: { frost: 1.3 },
              skills: [{ id: 'firebolt', w: 3 }, { id: 'fire_rain', w: 1 }], drops: [{ item: 'ether', c: .2 }] },
  shieldbearer: { name: 'Shieldbearer', sprite: 'shieldbearer', m: { hp: 1.5, str: 1.1, mag: .5, def: 1.7, res: 1.1, spd: .85 }, xp: 1.3, gold: 1.4,
              skills: [{ id: 'slash', w: 3 }, { id: 'shield_bash', w: 2 }, { id: 'brace', w: 1 }], drops: [] },
  beastmaster: { name: 'Beastmaster', sprite: 'beastmaster', m: { hp: 1.1, str: 1.15, mag: .7, def: 1, res: 1, spd: 1.1 }, xp: 1.3, gold: 1.4,
              skills: [{ id: 'arrow', w: 3 }, { id: 'rally_cry', w: 1 }, { id: 'whistle_beasts', w: 0, phase: .6 }], drops: [] },
  hand:     { name: 'Morvane\'s Hand', sprite: 'hand', boss: true, tags: ['hollow'],
              mech: { windup: { every: 4, skill: 'hollow_rend', text: 'The Hand raises its blade high. Defend!' } }, m: { hp: 5.5, str: 1.15, mag: 0.95, def: 1.2, res: 1.1, spd: 0.95 }, xp: 7, gold: 10,
              weak: { light: 1.3 }, skills: [{ id: 'slash', w: 3 }, { id: 'hollow_cleave', w: 2 }, { id: 'shadow_bolt', w: 2 }, { id: 'call_hollow', w: 0, phase: .5 }], drops: [{ mat: 'shard', c: 1, n: 3 }] },
  hwren:    { name: 'Hollowed Wren', sprite: 'hwren', boss: true, tags: ['hollow'], m: { hp: 7, str: 1.45, mag: .8, def: 1.1, res: 1.1, spd: 1.5 }, xp: 6, gold: 0,
              skills: [{ id: 'arrow', w: 3 }, { id: 'volley', w: 2 }, { id: 'pounce', w: 1 }], drops: [] },
  warden:   { name: 'Warden Morvane', sprite: 'warden', boss: true, tags: ['hollow'],
              mech: { warded: 'Morvane is shielded while his Hollow stand.', mirror: { at: .6, turns: 2, text: 'Morvane raises a mirror of black glass. Magic will turn back on its caster!' },
                      windup: { every: 5, skill: 'warden_doom', text: 'Darkness gathers in Morvane\'s hands. Brace!' } }, m: { hp: 18.2, str: 1.46, mag: 1.3, def: 1.3, res: 1.3, spd: 1 }, xp: 12, gold: 25,
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

// Skill evolutions: when a skill is mastered (four stars) the hero chooses one of two evolved forms.
// [name, description, changes to the base skill]
const SKILL_EVO = {
  power_strike: [['Crushing Blow', '2.2x damage, may break armour.', { power: 2.2, status: { defDown: 2 }, chance: 0.5 }], ['Twin Strike', 'Two strikes at 1.1x each.', { power: 1.1, hits: 2 }]],
  cleave:       [['Whirlwind', 'Hits every enemy harder.', { power: 1.1, mp: 10 }], ['Reaping Cleave', 'Hits every enemy, may slow them.', { power: 0.95, status: { slow: 2 }, chance: 0.5 }]],
  sunder:       [['Shatter', '2.6x damage and armour broken for longer.', { power: 2.6, status: { defDown: 4 } }], ['Executioner', 'Double damage on anyone below 40% health.', { power: 2.0, execute: 0.4, status: null }]],
  shield_wall:  [['Bastion', 'Party defence and resistance up for 4 turns.', { status: { defUp: 4, resUp: 4 }, mp: 9 }], ['Living Wall', 'Party defence up and regenerating.', { status: { defUp: 3, regen: 3 }, mp: 9 }]],
  provoke:      [['Challenge', 'Draws attacks, braces and gets angry.', { status: { taunt: 4, defUp: 4, strUp: 3 } }], ['Iron Hide', 'Draws attacks, braces and regenerates.', { status: { taunt: 3, defUp: 3, regen: 3 } }]],
  second_wind:  [['Second Life', 'Recover 65% of health.', { pct: 0.65, mp: 10 }], ['Battle Trance', 'Recover 35%, then strike harder and faster.', { pct: 0.35, status: { strUp: 3, haste: 2 } }]],
  venom_shot:   [['Death Cap', 'Harder hit and a long, certain poison.', { power: 1.3, status: { poison: 6 }, chance: 1 }], ['Venom Spray', 'Poisons every enemy.', { power: 0.7, target: 'enemies', chance: 0.7, mp: 9 }]],
  double_shot:  [['Triple Shot', 'Three quick hits.', { power: 0.75, hits: 3, mp: 9 }], ['Scatter Shot', 'Five arrows at random enemies.', { power: 0.6, hits: 5, target: 'random', mp: 9 }]],
  hamstring:    [['Cripple', 'Slows them for longer and breaks armour.', { power: 1.6, status: { slow: 4, defDown: 3 }, chance: 1 }], ['Pinning Shot', 'Hits and may slow every enemy.', { power: 1.2, target: 'enemies', status: { slow: 2 }, chance: 0.6, mp: 13 }]],
  fire:         [['Searing Flame', 'Heavy single target fire that usually burns.', { power: 1.7, status: { burn: 3 }, chance: 0.8, mp: 8 }], ['Fire Lash', 'Fire across every enemy.', { power: 0.8, target: 'enemies', mp: 9 }]],
  blaze:        [['Wildfire', 'Stronger, and may set everyone burning.', { power: 1.0, status: { burn: 3 }, chance: 0.5, mp: 15 }], ['Firestorm', 'Two waves of fire over every enemy.', { power: 0.6, hits: 2, mp: 15 }]],
  inferno:      [['Sunfall', 'A huge blast over every enemy.', { power: 2.0, mp: 30 }], ['Cinder Sea', 'Fire that leaves everything burning.', { power: 1.4, status: { burn: 4 }, chance: 1, mp: 28 }]],
  frost:        [['Glacial Spike', 'Heavy frost, often slows.', { power: 1.6, status: { slow: 3 }, chance: 0.6, mp: 8 }], ['Hoarfrost', 'Frost over every enemy.', { power: 0.8, target: 'enemies', chance: 0.4, mp: 10 }]],
  ice_lance:    [['Frozen Heart', 'An enormous single hit.', { power: 2.6, mp: 15 }], ['Shardstorm', 'Four shards at random enemies.', { power: 0.7, hits: 4, target: 'random', mp: 14 }]],
  frostguard:   [['Winter Ward', 'Party resistance and defence up.', { status: { resUp: 4, defUp: 3 }, mp: 11 }], ['Ice Mirror', 'Party resistance up and regenerating.', { status: { resUp: 3, regen: 3 }, mp: 11 }]],
  blizzard:     [['Whiteout', 'Much stronger, slows most of them.', { power: 1.7, status: { slow: 3 }, chance: 0.7, mp: 28 }], ['Deep Freeze', 'Slows and cracks every enemy\'s armour.', { power: 1.2, status: { slow: 4, defDown: 3 }, chance: 0.8, mp: 26 }]],
  heal:         [['Greater Heal', 'A much bigger heal.', { power: 1.8, mp: 8 }], ['Renew', 'A heal that keeps healing.', { power: 0.9, status: { regen: 3 }, mp: 7 }]],
  mass_heal:    [['Grand Mending', 'A big heal for everyone.', { power: 1.15, mp: 18 }], ['Soothing Light', 'Heals everyone and keeps healing.', { power: 0.6, status: { regen: 3 }, mp: 15 }]],
  raise:        [['Resurrection', 'Back on their feet with 75% health.', { pct: 0.75, mp: 22 }], ['Swift Return', 'A cheap raise with 35% health.', { pct: 0.35, mp: 9 }]],
  smite:        [['Holy Lance', 'A huge holy strike.', { power: 2.3, mp: 14 }], ['Radiance', 'Holy light over every enemy.', { power: 0.9, target: 'enemies', mp: 16 }]],
  sanctuary:    [['Benediction', 'An enormous heal with long regeneration.', { power: 1.8, status: { regen: 4 }, mp: 34 }], ['Haven', 'Heals, regenerates and braces everyone.', { power: 1.1, status: { regen: 3, defUp: 3 }, mp: 30 }]],
  rally_cry:    [['Battle Hymn', 'Party strength up, and faster.', { status: { strUp: 4, haste: 2 }, mp: 10 }], ['War Chant', 'Party strength and defence up.', { status: { strUp: 3, defUp: 3 }, mp: 10 }]],
  maul:         [['Savage Maul', 'A brutal hit that festers.', { power: 2.3, status: { poison: 3 }, chance: 0.8, mp: 11 }], ['Rending Maul', 'Two tearing hits.', { power: 1.4, hits: 2, status: null, mp: 11 }]],
  feral_howl:   [['Terrify', 'Breaks every enemy\'s armour and slows them.', { status: { defDown: 4, slow: 2 }, mp: 13 }], ['Pack Howl', 'Breaks their armour and fires up the party.', { after: { strUp: 3 }, mp: 13 }]],
  cheap_shot:   [['Low Blow', 'Hurts more and nearly always slows.', { power: 1.8, status: { slow: 3 }, chance: 0.9, mp: 7 }], ['Smoke and Knives', 'Cuts every enemy, may slow them.', { power: 0.9, target: 'enemies', chance: 0.4, mp: 9 }]],
  flurry:       [['Blade Dance', 'Six cuts at random enemies.', { power: 0.55, hits: 6, mp: 13 }], ['Whirling Steel', 'One sweep through every enemy.', { power: 0.9, hits: 1, target: 'enemies', mp: 12 }]],
  assassinate:  [['Death Mark', '3x damage, doubled on anyone below half health.', { power: 3.0, execute: 0.5, mp: 18 }], ['Shadow Step', 'Cheaper and quicker to reach for.', { power: 2.2, mp: 9 }]],
  oath_strike:  [['Sacred Blade', 'Holy steel, heals Aldric more.', { power: 2.1, drain: 0.3, mp: 7 }], ['Shield of Faith', 'Holy strike, then the party braces.', { power: 1.4, after: { defUp: 2 }, mp: 7 }]],
  grave_ward:   [['Last Rites', 'Strong wards and a little regeneration.', { status: { defUp: 4, resUp: 4, regen: 2 }, mp: 13 }], ['Hallowed Ground', 'Wards and steady regeneration.', { status: { defUp: 3, resUp: 3, regen: 3 }, mp: 13 }]],
  judgement:    [['Final Judgement', 'Far stronger holy damage to every enemy.', { power: 1.8, mp: 22 }], ['Dawnbreak', 'Holy damage, then the party regenerates.', { power: 1.1, after: { regen: 3 }, mp: 18 }]],
  curse:        [['Wither', 'Breaks armour and slows, every time.', { power: 1.4, status: { defDown: 4, slow: 2 }, chance: 1, mp: 8 }], ['Plague', 'Breaks every enemy\'s armour.', { power: 0.6, target: 'enemies', chance: 0.7, mp: 10 }]],
  leech:        [['Devour', 'A huge drain.', { power: 2.0, drain: 0.7, mp: 14 }], ['Blood Pact', 'Drains every enemy at once.', { power: 0.8, target: 'enemies', drain: 0.4, mp: 15 }]],
  doom:         [['Oblivion', 'Far stronger darkness that slows.', { power: 2.0, status: { slow: 3 }, chance: 0.8, mp: 28 }], ['Creeping Doom', 'Poisons and slows every enemy.', { power: 1.0, status: { poison: 5, slow: 2 }, chance: 1, mp: 22 }]],
};
for (const base in SKILL_EVO) SKILL_EVO[base] = SKILL_EVO[base].map(([name, desc, mod], i) => {
  const id = base + '_' + (i ? 'b' : 'a');
  const sk = Object.assign({}, SKILLS[base], mod, { name, desc, evolvedFrom: base });
  for (const k in mod) if (mod[k] === null) delete sk[k];
  SKILLS[id] = sk;
  return { id, name, desc };
});

// Talent paths: once a tree has all six ranks, the hero picks one of two paths for it (permanent),
// opening three more ranks. Paths give the hero a title.
const PATH_REQ = [15, 18, 21];
const PATH_COST = [3, 3, 4];
const PATHS = {
  blade: [
    { name: 'Warlord', desc: 'Sweeping blows that break whole lines.', ranks: [
      { skill: 'ruin_sweep' }, { stats: { str: 6, hp: 40 }, text: '+6 Strength, +40 HP' }, { skill: 'warlords_rage' }] },
    { name: 'Duellist', desc: 'One opponent, one perfect cut.', ranks: [
      { skill: 'heartseeker' }, { stats: { crit: 12, spd: 3 }, flags: { counter: 0.25 }, text: '+12% critical chance, +3 Speed, 25% more counters' }, { skill: 'deathblow' }] },
  ],
  guard: [
    { name: 'Bastion', desc: 'Nothing gets past. Nothing.', ranks: [
      { skill: 'iron_wall' }, { stats: { hp: 80, def: 6 }, text: '+80 HP, +6 Defence' }, { flags: { bulwark: 0.15 }, stats: { res: 6 }, text: 'Take 15% less damage again, +6 Resistance' }] },
    { name: 'Avenger', desc: 'Every blow taken is paid back.', ranks: [
      { skill: 'payback' }, { flags: { counter: 0.35 }, stats: { str: 5 }, text: '35% chance to counter when hit, +5 Strength' }, { skill: 'retribution' }] },
  ],
  hunt: [
    { name: 'Marksman', desc: 'Long shots that never miss what matters.', ranks: [
      { skill: 'eagle_shot' }, { stats: { crit: 15, str: 4 }, text: '+15% critical chance, +4 Strength' }, { skill: 'rain_of_arrows' }] },
    { name: 'Stalker', desc: 'Poison, traps and patience.', ranks: [
      { skill: 'black_venom' }, { stats: { spd: 5 }, flags: { firstStrike: 1 }, text: '+5 Speed, start fights fully ready' }, { skill: 'crippling_trap' }] },
  ],
  fire: [
    { name: 'Pyromancer', desc: 'More fire. Then more.', ranks: [
      { skill: 'firestorm' }, { stats: { mag: 8 }, flags: { boost_fire: 0.2 }, text: '+8 Magic, fire damage +20% more' }, { skill: 'phoenix_flame' }] },
    { name: 'Emberheart', desc: 'Fire that warms friends as it burns foes.', ranks: [
      { skill: 'kindle' }, { stats: { mag: 5, res: 5 }, flags: { burnChance: 0.3 }, text: '+5 Magic, +5 Resistance, burns more often' }, { skill: 'hearthfire' }] },
  ],
  frost: [
    { name: 'Glacier', desc: 'Stops armies in their tracks.', ranks: [
      { skill: 'deep_freeze' }, { stats: { mag: 6, mp: 20 }, text: '+6 Magic, +20 MP' }, { skill: 'absolute_zero' }] },
    { name: 'Winterward', desc: 'Ice as armour for the whole party.', ranks: [
      { skill: 'rime_shield' }, { stats: { res: 8, def: 4 }, flags: { mpCut: 0.1 }, text: '+8 Resistance, +4 Defence, spells cost 10% less' }, { skill: 'winters_embrace' }] },
  ],
  wild: [
    { name: 'Packlord', desc: 'Your beast becomes a terror.', ranks: [
      { skill: 'alpha_call' }, { flags: { beastBond: 0.3 }, stats: { hp: 40 }, text: 'Creature damage +30% more, +40 HP' }, { skill: 'stampede' }] },
    { name: 'Berserker', desc: 'The beast inside, let out.', ranks: [
      { skill: 'blood_frenzy' }, { stats: { str: 8, spd: 3 }, text: '+8 Strength, +3 Speed' }, { skill: 'rampage' }] },
  ],
  shadow: [
    { name: 'Assassin', desc: 'Finish them before they know you\'re there.', ranks: [
      { skill: 'shadowstep' }, { stats: { crit: 15, str: 4 }, text: '+15% critical chance, +4 Strength' }, { skill: 'killing_stroke' }] },
    { name: 'Rogue', desc: 'Dirty tricks and deep pockets.', ranks: [
      { skill: 'smoke_bomb' }, { stats: { spd: 6 }, flags: { stealPlus: 1, goldBonus: 0.25 }, text: '+6 Speed, steal even better, +25% gold from fights' }, { skill: 'thousand_cuts' }] },
  ],
  oath: [
    { name: 'Paladin', desc: 'Holy steel and a shield for everyone.', ranks: [
      { skill: 'holy_charge' }, { stats: { str: 5, res: 6 }, text: '+5 Strength, +6 Resistance' }, { skill: 'final_vow' }] },
    { name: 'Templar', desc: 'The vow that will not let you fall.', ranks: [
      { skill: 'martyrs_ward' }, { stats: { hp: 80, def: 5 }, flags: { undying: 1 }, text: '+80 HP, +5 Defence, survive a second killing blow' }, { skill: 'consecration' }] },
  ],
  hex: [
    { name: 'Plaguebringer', desc: 'Rot everything, slowly.', ranks: [
      { skill: 'plague' }, { stats: { mag: 6 }, flags: { boost_dark: 0.2 }, text: '+6 Magic, dark damage +20% more' }, { skill: 'black_death' }] },
    { name: 'Soulreaver', desc: 'Every curse feeds the caster.', ranks: [
      { skill: 'soul_drain' }, { stats: { mag: 5, hp: 50 }, text: '+5 Magic, +50 HP' }, { skill: 'harvest' }] },
  ],
  light: [
    { name: 'Saint', desc: 'No one dies on your watch.', ranks: [
      { skill: 'miracle' }, { stats: { res: 6, mp: 25 }, flags: { healBoost: 0.2 }, text: '+6 Resistance, +25 MP, healing +20%' }, { skill: 'resurrection' }] },
    { name: 'Lightbringer', desc: 'Healing turned into a weapon.', ranks: [
      { skill: 'radiance' }, { stats: { mag: 7 }, flags: { boost_light: 0.25 }, text: '+7 Magic, light damage +25%' }, { skill: 'judgement_day' }] },
  ],
};
// Combo arts: a hero with two trees at rank four or more learns a move that only that pair can make.
const COMBO_RANK = 4;
const COMBOS = [
  { trees: ['blade', 'fire'], skill: 'flame_blade' },
  { trees: ['blade', 'frost'], skill: 'frost_edge' },
  { trees: ['blade', 'shadow'], skill: 'blade_dance' },
  { trees: ['blade', 'oath'], skill: 'righteous_charge' },
  { trees: ['blade', 'guard'], skill: 'shield_breaker' },
  { trees: ['guard', 'light'], skill: 'aegis' },
  { trees: ['guard', 'oath'], skill: 'last_bastion' },
  { trees: ['guard', 'wild'], skill: 'iron_pack' },
  { trees: ['hunt', 'frost'], skill: 'frost_volley' },
  { trees: ['hunt', 'wild'], skill: 'pack_hunt' },
  { trees: ['hunt', 'shadow'], skill: 'pinning_shot' },
  { trees: ['hunt', 'fire'], skill: 'fire_arrows' },
  { trees: ['fire', 'frost'], skill: 'thermal_shock' },
  { trees: ['fire', 'light'], skill: 'sunfire' },
  { trees: ['fire', 'hex'], skill: 'hellfire' },
  { trees: ['frost', 'hex'], skill: 'black_ice' },
  { trees: ['frost', 'light'], skill: 'aurora' },
  { trees: ['shadow', 'hex'], skill: 'hexblade' },
  { trees: ['oath', 'light'], skill: 'dawns_promise' },
  { trees: ['light', 'hex'], skill: 'eclipse' },
  { trees: ['wild', 'shadow'], skill: 'ambush' },
  { trees: ['wild', 'light'], skill: 'wild_bloom' },
];
Object.assign(SKILLS, {
  // Path skills
  ruin_sweep:     { name: 'Ruinous Sweep', type: 'phys', power: 1.3, target: 'enemies', mp: 16, status: { defDown: 2 }, chance: 0.5, desc: 'Hits every enemy hard, may break armour.' },
  warlords_rage:  { name: 'Warlord\'s Rage', type: 'phys', power: 1.9, target: 'enemies', mp: 28, after: { strUp: 3 }, desc: 'A storm of steel on every enemy, then the party\'s strength rises.' },
  heartseeker:    { name: 'Heartseeker', type: 'phys', power: 2.6, target: 'enemy', mp: 14, execute: 0.3, desc: '2.6x damage, doubled on anyone below 30% health.' },
  deathblow:      { name: 'Deathblow', type: 'phys', power: 3.6, target: 'enemy', mp: 24, status: { defDown: 3 }, chance: 1, desc: '3.6x damage and shatters their armour.' },
  iron_wall:      { name: 'Iron Wall', type: 'buff', target: 'allies', mp: 12, status: { defUp: 4, resUp: 4 }, desc: 'The whole party\'s defence and resistance rise for 4 turns.' },
  payback:        { name: 'Payback', type: 'phys', power: 2.0, target: 'enemy', mp: 8, drain: 0.3, desc: '2x damage. Heals you for 30% of it.' },
  retribution:    { name: 'Retribution', type: 'phys', power: 1.5, target: 'enemies', mp: 20, after: { defUp: 3 }, desc: 'Hits every enemy, then the party braces.' },
  eagle_shot:     { name: 'Eagle Shot', type: 'phys', power: 2.5, target: 'enemy', mp: 12, desc: '2.5x damage from range.' },
  rain_of_arrows: { name: 'Rain of Arrows', type: 'phys', power: 0.6, hits: 6, target: 'random', mp: 22, desc: 'Six arrows at random enemies.' },
  black_venom:    { name: 'Black Venom', type: 'phys', power: 1.5, target: 'enemy', mp: 10, status: { poison: 6, slow: 3 }, chance: 1, desc: 'Poisons and slows for a long time.' },
  crippling_trap: { name: 'Crippling Trap', type: 'buff', target: 'enemies', mp: 16, status: { slow: 3, defDown: 3, poison: 3 }, foe: true, desc: 'Every enemy slows, weakens and bleeds.' },
  firestorm:      { name: 'Firestorm', type: 'mag', el: 'fire', power: 2.0, target: 'enemies', mp: 32, desc: 'The sky burns over every enemy.' },
  phoenix_flame:  { name: 'Phoenix Flame', type: 'mag', el: 'fire', power: 3.0, target: 'enemy', mp: 26, status: { burn: 4 }, chance: 1, desc: '3x fire damage and a burn that lingers.' },
  kindle:         { name: 'Kindle', type: 'heal', power: 0.8, target: 'allies', mp: 14, status: { strUp: 3 }, desc: 'Warms the party: a heal and more strength.' },
  hearthfire:     { name: 'Hearthfire', type: 'mag', el: 'fire', power: 1.5, target: 'enemies', mp: 26, after: { regen: 3 }, desc: 'Fire on every enemy; the party regenerates after.' },
  deep_freeze:    { name: 'Deep Freeze', type: 'mag', el: 'frost', power: 2.4, target: 'enemy', mp: 16, status: { slow: 4 }, chance: 1, desc: '2.4x frost and the target barely moves.' },
  absolute_zero:  { name: 'Absolute Zero', type: 'mag', el: 'frost', power: 2.0, target: 'enemies', mp: 34, status: { slow: 3 }, chance: 0.8, desc: 'Every enemy freezes over.' },
  rime_shield:    { name: 'Rime Shield', type: 'buff', target: 'allies', mp: 12, status: { resUp: 4, defUp: 3 }, desc: 'Ice armour on the whole party.' },
  winters_embrace:{ name: 'Winter\'s Embrace', type: 'heal', power: 1.2, target: 'allies', mp: 24, status: { resUp: 3, regen: 3 }, desc: 'Heals the party and wraps them in frost.' },
  alpha_call:     { name: 'Alpha Call', type: 'buff', target: 'allies', mp: 10, status: { strUp: 4, regen: 2 }, desc: 'The pack answers. Strength and regeneration for all.' },
  stampede:       { name: 'Stampede', type: 'phys', power: 1.8, target: 'enemies', mp: 26, status: { slow: 2 }, chance: 0.6, desc: 'Everything with legs runs them down.' },
  blood_frenzy:   { name: 'Blood Frenzy', type: 'phys', power: 0.7, hits: 4, target: 'enemy', mp: 12, drain: 0.25, desc: 'Four savage hits. Heals you a little.' },
  rampage:        { name: 'Rampage', type: 'phys', power: 0.8, hits: 6, target: 'random', mp: 22, desc: 'Six wild blows at anything in reach.' },
  shadowstep:     { name: 'Shadowstep', type: 'phys', power: 2.2, target: 'enemy', mp: 10, execute: 0.5, desc: '2.2x damage, doubled below half health.' },
  killing_stroke: { name: 'Killing Stroke', type: 'phys', power: 3.4, target: 'enemy', mp: 22, execute: 0.5, desc: '3.4x damage, doubled below half health.' },
  smoke_bomb:     { name: 'Smoke Bomb', type: 'buff', target: 'enemies', mp: 8, status: { slow: 3 }, foe: true, desc: 'Every enemy chokes and slows.' },
  thousand_cuts:  { name: 'Thousand Cuts', type: 'phys', power: 0.45, hits: 8, target: 'random', mp: 20, status: { poison: 2 }, chance: 0.4, desc: 'Eight cuts at random enemies. Some fester.' },
  holy_charge:    { name: 'Holy Charge', type: 'phys', el: 'light', power: 2.3, target: 'enemy', mp: 12, drain: 0.25, desc: '2.3x holy damage. Heals you for a quarter.' },
  final_vow:      { name: 'Final Vow', type: 'phys', el: 'light', power: 1.8, target: 'enemies', mp: 28, after: { defUp: 3, resUp: 3 }, desc: 'Light on every enemy; the party is warded after.' },
  martyrs_ward:   { name: 'Martyr\'s Ward', type: 'buff', target: 'allies', mp: 14, status: { defUp: 4, resUp: 4, regen: 2 }, desc: 'Takes the party under the vow: defence, resistance, regeneration.' },
  consecration:   { name: 'Consecration', type: 'heal', power: 1.4, target: 'allies', mp: 26, status: { regen: 3 }, desc: 'Holy ground. A big heal and regeneration.' },
  plague:         { name: 'Plague', type: 'mag', el: 'dark', power: 1.1, target: 'enemies', mp: 16, status: { poison: 5 }, chance: 1, desc: 'Poisons every enemy for a long time.' },
  black_death:    { name: 'Black Death', type: 'mag', el: 'dark', power: 2.0, target: 'enemies', mp: 32, status: { poison: 4, defDown: 3 }, chance: 1, desc: 'Darkness that rots armour and flesh.' },
  soul_drain:     { name: 'Soul Drain', type: 'mag', el: 'dark', power: 2.2, target: 'enemy', mp: 14, drain: 0.6, desc: 'Takes life and gives most of it to you.' },
  harvest:        { name: 'Harvest', type: 'mag', el: 'dark', power: 1.6, target: 'enemies', mp: 28, drain: 0.3, desc: 'Drains every enemy at once.' },
  miracle:        { name: 'Miracle', type: 'heal', power: 2.0, target: 'allies', mp: 30, desc: 'A full heal for the whole party.' },
  resurrection:   { name: 'Resurrection', type: 'revive', pct: 1, target: 'deadAlly', mp: 28, desc: 'Brings a fallen ally back at full health.' },
  radiance:       { name: 'Radiance', type: 'mag', el: 'light', power: 1.5, target: 'enemies', mp: 18, desc: 'Light over every enemy.' },
  judgement_day:  { name: 'Judgement Day', type: 'mag', el: 'light', power: 2.4, target: 'enemies', mp: 36, after: { regen: 3 }, desc: 'The sky opens on every enemy. The party regenerates after.' },
  // Combo arts
  flame_blade:    { name: 'Flame Blade', type: 'phys', el: 'fire', power: 2.0, target: 'enemy', mp: 12, status: { burn: 3 }, chance: 0.6, combo: true, desc: 'A burning sword stroke. May set them alight.' },
  frost_edge:     { name: 'Frost Edge', type: 'phys', el: 'frost', power: 1.9, target: 'enemy', mp: 11, status: { slow: 3 }, chance: 0.8, combo: true, desc: 'An ice cold cut that slows.' },
  blade_dance:    { name: 'Blade Dance', type: 'phys', power: 0.7, hits: 5, target: 'random', mp: 14, combo: true, desc: 'Five cuts at random enemies.' },
  righteous_charge:{ name: 'Righteous Charge', type: 'phys', el: 'light', power: 2.4, target: 'enemy', mp: 13, drain: 0.2, combo: true, desc: '2.4x holy steel. Heals a little.' },
  shield_breaker: { name: 'Shield Breaker', type: 'phys', power: 1.7, target: 'enemy', mp: 9, status: { defDown: 3, slow: 2 }, chance: 1, combo: true, desc: 'A shield rush that wrecks their guard.' },
  aegis:          { name: 'Aegis', type: 'buff', target: 'allies', mp: 16, status: { defUp: 3, resUp: 3, regen: 3 }, combo: true, desc: 'Defence, resistance and regeneration for the whole party.' },
  last_bastion:   { name: 'Last Bastion', type: 'buff', target: 'self', mp: 6, status: { taunt: 3, defUp: 4, resUp: 4, regen: 3 }, combo: true, desc: 'Take every hit for the party, and keep standing.' },
  iron_pack:      { name: 'Iron Pack', type: 'buff', target: 'allies', mp: 12, status: { defUp: 3, strUp: 3 }, combo: true, desc: 'Strength and defence for the whole pack.' },
  frost_volley:   { name: 'Frost Volley', type: 'phys', el: 'frost', power: 0.95, target: 'enemies', mp: 15, status: { slow: 2 }, chance: 0.5, combo: true, desc: 'Frozen arrows over every enemy.' },
  pack_hunt:      { name: 'Pack Hunt', type: 'phys', power: 1.2, target: 'enemies', mp: 15, status: { poison: 3 }, chance: 0.5, combo: true, desc: 'You and the beasts run them all down.' },
  pinning_shot:   { name: 'Pinning Shot', type: 'phys', power: 2.2, target: 'enemy', mp: 13, status: { slow: 3, defDown: 3 }, chance: 1, combo: true, desc: 'Pins them in place and opens their guard.' },
  fire_arrows:    { name: 'Fire Arrows', type: 'phys', el: 'fire', power: 0.7, hits: 4, target: 'random', mp: 14, status: { burn: 2 }, chance: 0.4, combo: true, desc: 'Four burning arrows at random enemies.' },
  thermal_shock:  { name: 'Thermal Shock', type: 'mag', power: 1.6, target: 'enemies', mp: 22, status: { defDown: 2 }, chance: 0.6, combo: true, desc: 'Fire then frost. Armour cracks across every enemy.' },
  sunfire:        { name: 'Sunfire', type: 'mag', el: 'light', power: 1.4, target: 'enemies', mp: 22, status: { burn: 2 }, chance: 0.5, combo: true, desc: 'Holy fire over every enemy.' },
  hellfire:       { name: 'Hellfire', type: 'mag', el: 'dark', power: 2.3, target: 'enemy', mp: 16, drain: 0.3, status: { burn: 3 }, chance: 0.7, combo: true, desc: 'Black flame. Burns them and feeds you.' },
  black_ice:      { name: 'Black Ice', type: 'mag', el: 'frost', power: 1.2, target: 'enemies', mp: 20, status: { slow: 3 }, chance: 0.8, combo: true, desc: 'Cursed ice under every enemy.' },
  aurora:         { name: 'Aurora', type: 'heal', power: 1.0, target: 'allies', mp: 18, status: { resUp: 3 }, combo: true, desc: 'Cold light heals the party and wards them.' },
  hexblade:       { name: 'Hexblade', type: 'phys', el: 'dark', power: 1.7, target: 'enemy', mp: 11, status: { poison: 4, defDown: 3 }, chance: 0.9, combo: true, desc: 'A cursed knife. Poisons and weakens.' },
  dawns_promise:  { name: 'Dawn\'s Promise', type: 'heal', power: 1.1, target: 'allies', mp: 20, status: { regen: 3, defUp: 2 }, combo: true, desc: 'Heals the party, then regenerates and guards them.' },
  eclipse:        { name: 'Eclipse', type: 'mag', el: 'dark', power: 1.1, target: 'enemies', mp: 22, drain: 0.3, combo: true, desc: 'Light and dark together. Drains every enemy.' },
  ambush:         { name: 'Ambush', type: 'phys', power: 2.8, target: 'enemy', mp: 12, execute: 0.4, combo: true, desc: 'You and the beast strike from cover. Brutal on the wounded.' },
  wild_bloom:     { name: 'Wild Bloom', type: 'heal', power: 0.9, target: 'allies', mp: 14, status: { regen: 4 }, combo: true, desc: 'The forest heals the party for a long while.' },
});
for (const tk in PATHS) TREES[tk].paths = PATHS[tk];

// Awakening: at level 20 a hero can awaken (gold and shadow shards): +10% to every stat and a signature move.
const AWAKEN = {
  bram: 'iron_tempest', wren: 'thousand_arrows', isolde: 'emberfall', hesk: 'pack_storm',
  dace: 'deaths_door', aldric: 'last_light', morwen: 'blackwater',
};
const AWAKEN_LVL = 20, AWAKEN_COST = { gold: 2500, mats: { shard: 6 } };
Object.assign(SKILLS, {
  iron_tempest:   { name: 'Iron Tempest', type: 'phys', power: 2.0, target: 'enemies', mp: 24, after: { defUp: 3 }, awaken: true, desc: 'A storm of steel over every enemy, then the party braces behind him.' },
  thousand_arrows:{ name: 'Thousand Arrows', type: 'phys', power: 0.55, hits: 9, target: 'random', mp: 22, awaken: true, desc: 'Nine arrows at random enemies.' },
  emberfall:      { name: 'Emberfall', type: 'mag', el: 'fire', power: 2.4, target: 'enemies', mp: 34, status: { burn: 3 }, chance: 0.6, awaken: true, desc: 'The sky rains fire on every enemy.' },
  pack_storm:     { name: 'Pack Storm', type: 'phys', power: 1.6, target: 'enemies', mp: 22, after: { strUp: 3, regen: 2 }, awaken: true, desc: 'Every beast in the land answers. The party is stronger after.' },
  deaths_door:    { name: 'Death\'s Door', type: 'phys', power: 4.0, target: 'enemy', mp: 20, execute: 0.5, awaken: true, desc: '4x damage, doubled below half health.' },
  last_light:     { name: 'Last Light', type: 'heal', power: 1.6, target: 'allies', mp: 30, status: { defUp: 3, resUp: 3, regen: 3 }, awaken: true, desc: 'Heals the whole party and wards them.' },
  blackwater:     { name: 'Blackwater', type: 'mag', el: 'dark', power: 2.1, target: 'enemies', mp: 30, status: { slow: 3, defDown: 3 }, chance: 1, awaken: true, desc: 'Black water drowns every enemy. All slow and their armour rots.' },
  // Elder creature moves (third evolution, level 24)
  cataclysm:      { name: 'Cataclysm', type: 'phys', power: 1.5, target: 'enemies' },
  bulwark_roar:   { name: 'Bulwark Roar', type: 'buff', target: 'allies', status: { defUp: 3, resUp: 3 } },
  renewal:        { name: 'Renewal', type: 'heal', power: 0.9, target: 'allies', status: { regen: 3 } },
});
const DATA = { AWAKEN, AWAKEN_LVL, AWAKEN_COST, ELITES, SKILL_EVO, PATH_REQ, PATH_COST, COMBOS, COMBO_RANK, STATS, HEROES, PARTY, ROSTER, SURGE, TALENT_REQ, TALENT_COST, TREES, SKILLS, GEAR, ITEMS, MATS, FORGE, ENEMIES, AREAS, STORY };
if (typeof module !== 'undefined' && module.exports) module.exports = DATA; else root.DATA = DATA;
})(this);
