// Emberwake: painted art. Where a character has art here it replaces their pixel sprite in battles,
// conversations and menus (the siege and keep scenes still use the pixel sprites).
// idle and attack face left (towards the enemy); portrait is a head and shoulders picture.
(function (root) {
'use strict';
root.ART = {
  bram: { idle: 'art/bram_idle.webp', attack: 'art/bram_attack.webp', portrait: 'art/bram_portrait.webp' },
  wren: { idle: 'art/wren_idle.webp', attack: 'art/wren_attack.webp', portrait: 'art/wren_portrait.webp' },
  isolde: { idle: 'art/isolde_idle.webp', attack: 'art/isolde_attack.webp', portrait: 'art/isolde_portrait.webp' },
  hesk: { idle: 'art/hesk_idle.webp', attack: 'art/hesk_attack.webp', portrait: 'art/hesk_portrait.webp' },
  dace: { idle: 'art/dace_idle.webp', attack: 'art/dace_attack.webp', portrait: 'art/dace_portrait.webp' },
  aldric: { idle: 'art/aldric_idle.webp', attack: 'art/aldric_attack.webp', portrait: 'art/aldric_portrait.webp' },
  morwen: { idle: 'art/morwen_idle.webp', attack: 'art/morwen_attack.webp', portrait: 'art/morwen_portrait.webp' },
};
// Battle backgrounds, keyed by area id (or the background key it borrows). Square, ground in the bottom third.
root.ART_BG = {};
for (const k of ['thornwood', 'millroad', 'barrows', 'fenmire', 'tower', 'arena', 'greyfort_keep', 'kingsbridge_town', 'drowned_temple', 'hollow_court']) root.ART_BG[k] = 'art/bg_' + k + '.webp';
// Enemies and bosses, keyed by enemy id (not sprite: some chapter two bosses borrow a chapter one sprite). Face right.
root.ART_FOE = {};
for (const k of ['old_tusk', 'rook', 'shade', 'drowned', 'hand', 'warden']) root.ART_FOE[k] = { idle: 'art/boss_' + k + '.webp' };
for (const k of ['soldier', 'hound', 'acolyte', 'wolf', 'cutthroat', 'archer', 'skeleton', 'wight', 'lurker', 'hag', 'boarling', 'rat', 'briar', 'crows', 'bat', 'slime']) root.ART_FOE[k] = { idle: 'art/foe_' + k + '.webp' };
// beasts stand lower than a person
root.ART_FOE.wolf.scale = 0.75; root.ART_FOE.hound.scale = 0.75; root.ART_FOE.lurker.scale = 0.85;
Object.assign(root.ART_FOE.boarling, { scale: 0.75 }); Object.assign(root.ART_FOE.rat, { scale: 0.6 }); Object.assign(root.ART_FOE.briar, { scale: 0.8 });
Object.assign(root.ART_FOE.bat, { scale: 0.9 }); Object.assign(root.ART_FOE.slime, { scale: 0.7 });
})(this);
