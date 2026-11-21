# Emberwake

A fantasy party RPG for one player on a phone. Underdog party, turn based fights with ATB gauges, deep character building, training always pays off. Built in layers.

- data.js holds core content (heroes, talent trees, skills, gear, items, enemies, areas, story). world.js holds maps, creatures, events, buildings and the noticeboard. engine.js holds the rules with no DOM so it runs in node for balance tests. siege.js holds the real time siege rules (also no DOM). sprites.js draws pixel art from text maps. siegeui.js draws the keep and runs the siege on a canvas. battlefx.js paints battle backgrounds and spell effects. game.js is the screens and battle UI.
- Saves are localStorage on the phone (key emberwake-save-v1, save version in S.v). Settings saves a backup .txt file (share sheet on Android, download elsewhere) holding an EMBER1. code, and loads it back. Android's clipboard truncates long text, so the file is the main route. E.migrate upgrades older saves.
- Player feedback after layer one: graphics basic but fine for now, exploring was one button, nothing to aim for, too little story, knocked out heroes fell behind. Wants to keep unlocking new people, creatures, systems and places, not just grind levels.
- Design rule from the player: no filler. Every side system must feed main progress (gear, talent points, materials, XP).
- Bump VERSION in sw.js whenever a file changes.

## Layer one (20 November 2026)

- Party of three: Bram (tank, sword), Wren (fast, bow), Isolde (mage, carries the ember). Any hero can learn any of six talent trees (Blade, Guard, Hunt, Fire, Frost, Light), six ranks each, ranks unlock at levels 1, 3, 5, 8, 11, 14 and cost 1, 1, 2, 2, 3, 3 points. Two points per level, plus Tomes of Insight.
- Skills gain mastery stars with use (5, 15, 35, 70 uses), +10% power each.
- Gear in weapon, armour and charm slots. Shop tiers open as the story goes. Bram's forge upgrades any piece to +5 (15% of base stats per level) with gold and materials.
- Five areas, each a path of 12 to 16 steps with fights, treasure, foraging, camps, a tome and a unique item, then a boss. Cleared areas stay open for training.
- Battles: ATB with time stopped while choosing (wait mode), weaknesses, statuses, summons and boss phases. Auto battle toggle. Losing sends you to the keep and costs 10% gold, nothing else.
- Balance target from simulation: about 60 fights for a straight run, bosses won most of the time at arrival level, the final boss needs some training.

## Layer two (21 November 2026)

- Areas are maps of connected spots. Tap a spot next to you to move, or any visited spot to go back. Moving can trigger an ambush. Spot types: fight, treasure, gather (regrows after resting at the keep), camp (heals 35% once per rest, plays party conversations), event with a choice, den (tame beasts, needs Hesk), quest, boss. Some spots need the right party member: Fire for brambles, Dace for locks, Hesk for dens. All five areas are hand built (the last three since layer four).
- Recruits: Hesk (beast tamer, Wild tree, innate Tame) via the hermit's hut quest in Thornwood. Dace (cutpurse, Shadow tree, innate Steal) from the bandit stockade on the Mill Road. Roster of five, three in the party, swap from Party, Line-up. Recruits join at the party's level with matching talent points.
- Creatures: Hesk tames beasts below about half health (odds shown when targeting). One creature fights beside the party under AI with a stance (Attack, Guard, Support). At level 8 it evolves into one of three forms by the stance it used most. Kennel space 2, 4 or 8.
- Ember Surge: a shared gauge that fills as you deal and take hits and carries between battles. Unlocked by beating Old Tusk; Surge II (1.5x) by beating Rook. Each hero has their own surge move.
- Keep: noticeboard of goals and unlocks, training yard (bench heroes earn 50% then 80% of fight XP, sparring once per hero per rest), kennels. Heroes behind the leader always earn up to double XP to catch up.
- Battle field: horizon raised and shadows added so everyone stands on the ground.
- Balance: bosses toughened (30% more HP, 12% more strength) because the creature and surge made things easier. A bot that plays well now loses one or two fights in a full run.

## Layer three (21 November 2026)

- Defend Emberwake: a real time siege on a canvas, at night with torchlight. Unlocked by beating Rook (raid_warn scene). Deploy phase, then waves. Levy builds over time; spend it on archers (wall spots), swordsmen (in front of the gate or in the yard), and with the barracks spearmen, priests and knights; ballistas on the gate towers once the stone walls are built. Party heroes fight as champions at their RPG strength, with one aimed power each (Rally, Arrow Storm, Ember Nova, Wild Hunt, Powder Keg). Ladder crews climb into the yard, rams batter the gate, a captain leads every fifth night. The keep falls if its hall is broken. Twelve nights, stars for gate and hall, first clear milestones (tomes, Ashby Banner, Emberwake Blade, Keeper's Mantle), replays pay iron and shards. Losing costs nothing.
- Keep buildings: barracks (two levels) and stone walls (two levels, the palisade becomes stone with gate towers, then burning oil).
- Brightwater market (after Rook) with an arena: Bronze, Silver and Gold ranks, bouts in order, named champions, arena healers before every bout, no penalty for losing. Prizes: gold, tomes, the Pit Gladius, Crowd's Favour, Beastqueen's Lash, Champion's Band and the Ember Fox, a rare creature only found here. Arena foes are boosted (E.boutFoes: two levels up, 1.8x HP, 1.2x power).
- The keep screen shows a living picture of Emberwake that changes with progress: roof patched after the first night, Hob's stall, training yard, kennels, barracks, stone walls, survivors walking about, the party and creatures.
- Battles have painted backgrounds per area and the arena, particle effects by element, idle animation and screen shake on big hits.
- Balance from simulation: a good bot clears nights 1 to 6 comfortably, night 8 most of the time, night 10 needs levels and upgrades, night 12 is a stretch. Arena finals around 35 to 70% at the suggested level.

## Layer four (22 November 2026)

- Hand built maps for Barrow Hills, Fenmire and the Hollow Tower (17 spots each), with events that have real choices (the weeping stone, the will-o'-the-wisp, Mistress Penn in the tower cells). Every boss is reachable without any recruit; recruits open extra rewards. Saves on the old generated maps are moved onto the new ones in E.ensure, keeping tomes and unique gear already found.
- Arena fix: arena bouts count as boss fights, so wins no longer try to clear an area.
- Aldric, barrow knight (Oath tree: holy strikes, party wards, survive one killing blow per battle; innate Stand Fast). Quest: meet him at the knight's tomb, fetch King Edric's seal from the royal vault, bring it back. Opens oathbound doors (need 'seal') in the barrows and the tower. Extra scene before the Shade if he's in the party.
- Morwen, fen witch (Hex tree: curses, drains, Doom; innate Mire slows every enemy). Quest: find her three lanterns in Fenmire (frozen pool, lurker nest, eel weir). Sees hidden paths (need 'hex') in Fenmire and the tower.
- Both have surge moves (The King's Judgement, Drowning Dark) and siege powers (Oath of Iron halves damage to defenders, Mire slows and rots a crowd).
- Freeing Penn adds 5 starting levy to every siege night. Asking her first also weakens the Warden (82% HP).
- Final creature evolutions at level 16, following the first form (Bloodfang, Wallfang, Moonhowler and so on), 25% stronger again with a top move (Ravage or Greater Mend).
- New uniques: King's Signet, Witch's Lantern, Hollow Crown (reserved for later).

## Next layers

- War campaigns (agreed as the next big piece): a territory map, Hollow held villages and forts, battles with the soldiers trained for the siege plus heroes, captured ground paying out daily.
- Chapter two: the Hollow King.
- Better art: bigger shaded sprites, idle and attack animations, spell effects.
- Rebuilding Emberwake (Stronghold style): buildings that unlock shops, training and recruits.
- War campaigns with archers, swordsmen and cavalry on a grid, taking territory for resources.
