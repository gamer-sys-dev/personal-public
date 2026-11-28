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
};
})(this);
