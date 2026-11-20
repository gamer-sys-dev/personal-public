# Emberwake

A fantasy party RPG for one player on a phone. Underdog party, turn based fights with ATB gauges, deep character building, training always pays off. Built in layers.

- data.js holds all content (heroes, talent trees, skills, gear, items, enemies, areas, story). engine.js holds the rules with no DOM so it runs in node for balance tests. sprites.js draws pixel art from text maps. game.js is the screens and battle UI.
- Saves are localStorage on the phone (key emberwake-save-v1), plus a copyable EMBER1. save code in Settings.
- Design rule from the player: no filler. Every side system must feed main progress (gear, talent points, materials, XP).
- Bump VERSION in sw.js whenever a file changes.

## Layer one (20 November 2026)

- Party of three: Bram (tank, sword), Wren (fast, bow), Isolde (mage, carries the ember). Any hero can learn any of six talent trees (Blade, Guard, Hunt, Fire, Frost, Light), six ranks each, ranks unlock at levels 1, 3, 5, 8, 11, 14 and cost 1, 1, 2, 2, 3, 3 points. Two points per level, plus Tomes of Insight.
- Skills gain mastery stars with use (5, 15, 35, 70 uses), +10% power each.
- Gear in weapon, armour and charm slots. Shop tiers open as the story goes. Bram's forge upgrades any piece to +5 (15% of base stats per level) with gold and materials.
- Five areas, each a path of 12 to 16 steps with fights, treasure, foraging, camps, a tome and a unique item, then a boss. Cleared areas stay open for training.
- Battles: ATB with time stopped while choosing (wait mode), weaknesses, statuses, summons and boss phases. Auto battle toggle. Losing sends you to the keep and costs 10% gold, nothing else.
- Balance target from simulation: about 60 fights for a straight run, bosses won most of the time at arrival level, the final boss needs some training.

## Next layers

- Creature companions that level and evolve by how they're used.
- Arena ladder with prizes that feed the story.
- Rebuilding Emberwake (Stronghold style): buildings that unlock shops, training and recruits.
- War campaigns with archers, swordsmen and cavalry on a grid, taking territory for resources.
