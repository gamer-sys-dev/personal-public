# Emberwake

A fantasy party RPG for one player on a phone. Underdog party, turn based fights with ATB gauges, deep character building, training always pays off. Built in layers.

- data.js holds core content (heroes, talent trees, skills, gear, items, enemies, areas, story). world.js holds maps, creatures, events, buildings and the noticeboard. engine.js holds the rules with no DOM so it runs in node for balance tests. siege.js holds the real time siege rules (also no DOM). sprites.js draws pixel art from text maps. siegeui.js draws the keep and runs the siege on a canvas. battlefx.js paints battle backgrounds and spell effects. game.js is the screens and battle UI.
- Saves are localStorage on the phone (key emberwake-save-v1, save version in S.v). Settings saves a backup .txt file (share sheet on Android, download elsewhere) holding an EMBER1. code, and loads it back. Android's clipboard truncates long text, so the file is the main route. E.migrate upgrades older saves.
- Player feedback after layer one: graphics basic but fine for now, exploring was one button, nothing to aim for, too little story, knocked out heroes fell behind. Wants to keep unlocking new people, creatures, systems and places, not just grind levels.
- Design rule from the player: no filler. Every side system must feed main progress (gear, talent points, materials, XP).
- Bump VERSION in sw.js whenever a file changes.

## Layer one (20 November 2026)

- Party of three: Bram (tank, sword), Wren (fast, bow), Isolde (mage, carries the ember). Any hero can learn any of six talent trees (Blade, Guard, Hunt, Fire, Frost, Light), six ranks each, ranks unlock at levels 1, 3, 5, 8, 11, 14 and cost 1, 1, 2, 2, 3, 3 points. Two points per level, plus Tomes of Insight.
- Skills gain mastery stars with use (6, 20, 45, 90 uses since layer six), +10% power each.
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

## Layer four, part two (22 November 2026)

- Player feedback: hunting at dens seemed to do nothing. Taming was hidden in Hesk's skill list. Now: the den shows a Beast hunt card (what lives there, new or tamed before, how taming works, and why you can't if Hesk isn't in the party or the kennels are full). Hunts open with a banner and give +15% tame odds. Hesk's turn shows a Tame button with the best odds on the field.
- Beast book on the Creatures screen: every kind, silhouettes for ones not yet tamed, where to find each. Rewards for 3, 5, 8 and 10 kinds (feathers, two tomes, Crown of the Wild). S.dex tracks kinds tamed.
- Player feedback: siege is okay but should feel more like Stronghold. He wants: build your own castle, command troops, bigger battles. Adventure stays the main game, the castle is a deep side mode.

## Siege, Stronghold style (22 November 2026)

- Fortify screen (after night 1, from Defend Emberwake): a 4 unit grid. Field pieces in front of the wall (rows 11 to 24): stone wall, tower (2x2, holds two archers or a ballista, +20% range, extra armour), moat (slow), stakes (slow and cut), killing pit (hidden, one big hit per night), pitch ditch (tap to light, joined ditches catch together, Ember Nova lights them too). Yard pieces: brazier (fire arrows for archers nearby), mangonel (2x2, needs stone walls, lobs rocks at the thickest crowd). Paid in gold and iron; demolish refunds half gold. Stored in S.castle.pieces. Broken pieces are rebuilt free each night.
- Enemies route with a flow field (Dijkstra on the grid) to the gate, or to the wall for ladder crews, around blocks and paying extra to wade moats. Fully walled in, they smash the nearest wall or tower. Catapults (from night 4) stay back and smash walls, towers and the gate. Stragglers who hang back 75 seconds charge.
- Commanding: tap one of your soldiers to select, then All of that type, Everyone, or clear. Tap the ground to send them; archers and ballistas take free wall or tower spots. Troops cross through your own gate.
- Bigger battles: roughly 1.7x the enemies at a bit less health each, army cap 30 (archers count), more levy.
- Balance (bot): with no castle nights 1 to 5 hold, 8 and up fall. With a good castle all nights to 12 hold. Building matters.

## Layer five: story and sound (22 November 2026)

Player feedback: taming should scale with level (done: +7% per level Hesk is above the beast), siege controls fiddly and the map too small (to fix next), building felt pointless (same fix), story "doesn't feel like it's going anywhere", skills master too fast (evolve after mastery, to do), and overall not yet as exciting as the old games. He chose: surprise him with the plot, FF7 level darkness, real branches.

SPOILERS (he asked to be surprised; don't reveal these to him):
- story.js holds STORY5 (rewritten scenes, take priority over older keys) and CHOICES (story decisions). Lines can carry a condition ('has:id', '!has:id', 'flag:x'); heroes in S.flags.gone never speak.
- Wren sold the news of Hale's stone to Rook. Rook reveals it after his fight; Isolde forgives her or banishes her (E.removeHero). Banished Wren returns hollowed on the tower's upper stair (w13): Morwen in the roster saves her (E.rejoinHero), otherwise she dies.
- Maud, Bram's mother, survived Ashby and arrives with the survivors after Rook. After the Barrow Hills the keep is raided (Morvane's Hand, a story fight from a keep button): Hob dies, Maud is taken, Tilly runs the stall. Maud is the prisoner in the tower cells.
- Warden Morvane is Magister Hale, Isolde's master. Hints: the figure on the Thornwood ridge, the journal in the barrows, the letter signed H, the Drowned Knight's ring. The Hollow King, Vael, speaks in Isolde's dreams at camps.
- Hale's journal: page 1 from the barrows boss, page 2 from the smuggler's chest or the mist path in Fenmire, page 3 from the chapel, the false wall or the strongbox in the tower. All three let Isolde reach for the man inside (redemption, Surge III at double power, Vael named); otherwise he dies unredeemed.
- On the upper stair Aldric (if recruited) offers to hold it alone: he dies and leaves Aldric's Candle (survive one killing blow), or the party stands together in a hard fight.
- The chapter end is assembled from the choices (chapterEnd in game.js).
- audio.js: see layer six. Settings has music and sound switches. Starts on the first tap (browsers require it).

## Layer six: orchestra, skill evolution, siege rebuild (22 November 2026)

Player feedback: the music sounded like Pokemon; he wants sampled orchestral strings, rock guitar and choir, character leitmotifs, melancholy and tension, closer to the PlayStation era. Also finish skill evolution and the siege rebuild.
- Music: audio.js is a small sequencer playing real instrument samples from music/ (strings, violin, cello, bass, pizzicato, harp, timpani, choir, horn, brass, flute, oboe, piano, organ, guitar, electric bass, drums). Each is one mp3 holding a note every few semitones, listed in music/manifest.json; notes in between are pitch shifted. Rendered offline from the GeneralUser GS soundfont with FluidSynth (licence and credit in music/LICENSE.txt), about 3.3MB, cached by the service worker on first play. Convolver reverb and a compressor on the master. Scores are written as text ("D4:1.5", chords with +, rests r, repeats (...)xN). Leitmotifs: the Ember (D E F A) for Isolde and the main theme, the Warden's chromatic fall for Morvane and dread scenes, the Hearth (F A C Bb A) for the keep and Maud, choir for Vael. Tracks: title, keep, wood, dark, battle, boss, siege, arena, sad, dread, victory, defeat. Nobody in the build has heard it: needs his ear.
- Skill evolution: at four stars a skill offers a choice of two evolved forms (SKILL_EVO in data.js, 33 skills), for example Power Strike into Crushing Blow or Twin Strike. Stored in hero.evolved; heroStats swaps the skill. The choice is permanent. A dot on the hero and the Skills tab shows when one is ready.
- Siege rebuild: the battlefield is 180 by 200 (was 100 by 150). The old keep and yard layout sits in the middle, shifted by (40, 48) (GEO.OX, OY); old castle saves move with it (castle.v = 2). Twelve wall spots, a full width yard with survivor cottages that grow with nights held. Enemies move 30% faster to cover the longer field. Camera: drag to pan, pinch or wheel to zoom, +, - and whole map buttons; the world is painted once at 8 px per unit and the visible part copied each frame. Red marks at the screen edge show enemies out of view. Three modes: Command (tap to select, Box to drag a selection rectangle, All of a type, Everyone, tap ground to send, tap pitch to light, hero powers), Recruit (soldiers, and placing heroes before the horn) and Build (any piece, mid battle too, paid in gold and iron and kept for later nights; not on top of people). Taps only place things in Recruit or Build, so selecting troops can't place a soldier by accident.
- Balance (bot): bare walls hold to about night 5, half of night 8, none of 10. A built castle holds all twelve.

## Layer six, part two (22 November 2026)

Player feedback: talents also need to evolve once mastered (all trees top out by level 14), and there was no clear reason to put points in a second tree. Building in the siege was unforgiving: no undo, confirm or full sell back.
- Talent paths: a tree at six ranks offers a choice of two paths (PATHS in data.js), each with three more ranks at levels 15, 18 and 21 costing 3, 3 and 4 points. Stored in hero.paths; E.treeRanks joins them on. The path names a title shown on the Stats page (Warlord, Duellist, Bastion, Avenger, Marksman, Stalker, Pyromancer, Emberheart, Glacier, Winterward, Packlord, Berserker, Assassin, Rogue, Paladin, Templar, Plaguebringer, Soulreaver, Saint, Lightbringer).
- Combo arts: two trees both at rank 4 teach a move only that pair has (COMBOS, 22 pairs, for example Blade and Fire make Flame Blade). Listed on the Talents tab with progress for any pair the hero has started.
- Building is a plan until confirmed: taps place ghost pieces (or mark pieces to sell with a red cross), tap a planned piece to take it back, Undo, Clear, Confirm. Selling pays full price in daylight (Fortify) and half mid battle. Leaving Fortify with plans asks whether to confirm or throw them away.

## Next layers

- War campaigns (agreed as the next big piece): a territory map, Hollow held villages and forts, battles with the soldiers trained for the siege plus heroes, captured ground paying out daily.
- Chapter two: Vael, the Hollow King.
- Better art: bigger shaded sprites, idle and attack animations, spell effects.
- Rebuilding Emberwake (Stronghold style): buildings that unlock shops, training and recruits.
- War campaigns with archers, swordsmen and cavalry on a grid, taking territory for resources.
