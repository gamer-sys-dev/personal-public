// Emberwake: painted art. Where a character has art here it replaces their pixel sprite in battles,
// conversations and menus (the siege and keep scenes still use the pixel sprites).
// idle and attack face left (towards the enemy); portrait is a head and shoulders picture.
(function (root) {
'use strict';
root.ART = {
  bram: { idle: 'art/bram_idle.webp', attack: 'art/bram_attack.webp', portrait: 'art/bram_portrait.webp' },
  wren: { idle: 'art/wren_idle.webp', attack: 'art/wren_attack.webp', portrait: 'art/wren_portrait.webp' },
};
})(this);
