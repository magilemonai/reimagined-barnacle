# Valisar: Shadows of the Eldspyre

An SNES-style top-down action adventure game (Zelda: A Link to the Past inspired) built as a pure web app. Based on the **Valisar D&D campaign** worldbuilding documents and session notes found in this repo.

## How to Play

Open `index.html` in a web browser. No build step or dependencies required.

If the screen is blank, serve it locally instead:
```
python3 -m http.server 8000
# then open http://localhost:8000
```

### Controls

| Key | Action |
|-----|--------|
| Arrow Keys | Move |
| Z | Attack / Confirm dialogue |
| X | Special ability |
| Enter | Start / Menu |

### Game Flow

Title screen -> Character select -> Intro cutscene -> Gameplay -> Boss fight -> Victory

---

## Source Documents

The game is adapted from two campaign documents in the repo root:

- **`DM Notes_ Valisar Worldbuilding Master Doc (2).txt`** - Full worldbuilding: geography, factions, deities, NPCs, lore
- **`Valisar Active Campaign Notes First Arc only.txt`** - Session-by-session notes (Sessions 0-9) covering the first arc

### Campaign Arc (Sessions 0-9)

The party (Daxon Lamn, Luigi Bonemoon, Lirielle) starts in **Ebon Vale**, investigates goblin threats, ventures through the **Ebon Forest**, enters the **Temple of Nitriti**, solves a puzzle (Crown, Cape, Scepter for a statue), and defeats **Queen Bargnot** who is performing a sacrifice ritual. After the boss fight, the spirit of Nitriti hallows the temple, Rorik Flamebeard is rescued, and the Bonemoon prophecy is teased.

---

## Architecture

Pure client-side JavaScript. No frameworks, no bundler, no npm. Six source files loaded in dependency order via `<script>` tags in `index.html`.

### File Map

```
index.html              - HTML shell, loads all scripts in order
style.css               - Dark theme, pixelated canvas, purple glow aesthetic
src/
  engine.js    (769 lines)  - Canvas, input, audio, particles, bitmap font, utils
  sprites.js   (129 lines)  - Procedural pixel art sprite generation (minified)
  maps.js      (542 lines)  - 8 room layouts, tile system, Maps API
  dialogue.js  (644 lines)  - Typewriter dialogue system + all NPC conversation data
  entities.js  (1177 lines) - Player, Enemy, NPC, Boss, Projectile, combat resolution
  game.js      (1737 lines) - Main game loop, state machine, HUD, transitions
```

### Load Order and Dependencies

```
engine.js    -> window.{TILE, COLS, ROWS, W, H, C, Input, Audio/GameAudio, Particles, Utils, Engine, buf, display}
sprites.js   -> window.Sprites  (depends on: C)
maps.js      -> window.{T, TileProps, Maps}
dialogue.js  -> window.{DialogueData, Dialogue}  (depends on: Utils, GameAudio, C)
entities.js  -> window.Entities  (depends on: C, Input, Sprites, Maps, Particles, Audio, Utils, Dialogue)
game.js      -> window.Game  (depends on: everything above)
```

### Technical Specs

- **Resolution**: 256x224 internal (SNES), scaled 3x to 768x672 display
- **Rendering**: Offscreen canvas buffer -> display canvas with nearest-neighbor scaling
- **Sprites**: All procedurally generated at init time using Canvas 2D API, cached as offscreen canvases
- **Audio**: Web Audio API with procedurally generated sound effects (10 sounds: sword, hit, hurt, pickup, select, dialogue, bosshit, death, victory, explosion)
- **Font**: Custom 5x7 bitmap font (A-Z, 0-9, punctuation)
- **Tiles**: 16x16px, 16 columns x 14 rows per room (28 tile types)
- **Frame rate**: requestAnimationFrame (targets 60fps)

---

## Game Content

### Three Playable Characters

| Character | Class | HP | Special (X key) |
|-----------|-------|----|-----------------|
| Daxon Lamn | Eldritch Knight Fighter | 8 half-hearts | Shield (1.5s invincibility) |
| Luigi Bonemoon | Warlock | 6 half-hearts | Brog familiar (homing projectile) |
| Lirielle | Circle of Stars Druid | 6 half-hearts | Heal (restores 2 half-hearts) |

### 8 Rooms

| # | Room ID | Area | Enemies | NPCs |
|---|---------|------|---------|------|
| 1 | `ebon_vale_square` | Town Square (START) | None | Fawks, Mayor Helena, Captain Elira Voss |
| 2 | `ebon_vale_market` | Market District | None | Braxon, Brother Soren, Rorik Flamebeard |
| 3 | `ebon_vale_north` | North Gate | None | None (signpost warning) |
| 4 | `ebon_forest_entry` | Forest Edge | 3 goblin lackeys | None |
| 5 | `ebon_forest_deep` | Que'Rubra's Grove | 2 goblins + 1 spinecleaver | Que'Rubra |
| 6 | `temple_entrance` | Temple Entry Hall | 2 spinecleavers | None |
| 7 | `temple_puzzle` | Antechamber of Shadows | 6 goblins (2 per alcove) | None |
| 8 | `temple_boss` | Inner Sanctum | Queen Bargnot (boss) | Rorik (bound at altar) |

Room connectivity: `market <-> square <-> north <-> forest_entry <-> forest_deep <-> temple_entrance <-> temple_puzzle <-> temple_boss`

### Enemy Types

| Enemy | HP | Damage | Speed | Behavior |
|-------|----|--------|-------|----------|
| Goblin | 3 | 1 | 0.6 | Patrol + chase within 80px, melee attack |
| Spinecleaver | 6 | 2 | 0.5 | Same AI, tankier, harder hitting |

### Boss: Queen Bargnot (3 Phases)

- **Phase 1** (100%-50% HP): Chase + single projectiles. 40 HP total.
- **Phase 2** (50%-25%): Adds charge attacks, more projectiles, speed increase. Dialogue trigger.
- **Phase 3** (below 25%): Barrage attack (4-spread projectiles), shadow particles, purple aura, 3 damage per hit.

### Puzzle Mechanic

In `temple_puzzle`, three items (Crown, Cape, Scepter) are hidden in alcoves guarded by goblins. Collect all three, then interact with the central Ascendant Shadow statue to unlock the north passage to the boss room.

### Game States

```
title -> select -> intro -> game -> boss_intro -> boss -> victory
                                 -> gameover (respawn to last safe room)
```

---

## Known Issues and Improvement Areas

### Bugs / Polish

- **No `tile_dark` sprite**: The dark/void tile (ID 27) may not have a sprite defined - verify it renders correctly at temple room edges
- **Sprite aliases are runtime copies**: `npc_elira_voss`, `npc_brother_soren`, `npc_mayor_helena` are set as `S.cache[alias] = S.cache[original]` after the NPC sprites are created. If sprite init order changes, these could break.
- **`item_` prefix mismatch**: Maps define item types as `item_potion`, `item_crown`, etc. Verify game.js pickup logic matches these exact keys. Sprites use the same prefix.
- **Player sprite rendering**: Player render uses `characterId + '_' + dir + '_' + frame` keys (e.g. `daxon_down_0`). Left-facing uses the `right` sprite with canvas flip. Verify the flip works correctly in the `Sprites.draw()` method.
- **Enemy type normalization**: `goblin_lackey` from maps is normalized to `goblin` in game.js `loadRoom()`. If any code path bypasses this normalization, enemies won't get correct stats.
- **Heart drop from enemies**: 30% chance in `entities.js` Enemy.die(), but game.js also has a 40% check. One of these may be redundant or conflicting.
- **Boss melee + contact damage**: Both trigger independently, so the boss can double-hit the player on the same frame from both its melee hitbox and body collision. May want to add a check to prevent this.
- **No pause functionality**: The `p` key is tracked by Input but no pause state exists yet.
- **Audio initialization**: `window.Audio` shadows the native `Audio` constructor. Code also exposes `window.GameAudio` as a safe alias. If any code tries to use `new Audio()` for HTML5 audio, it will break.

### Visual / UX Improvements

- **Character sprites are 16x24** (taller than a tile) but the select screen draws them at 2x. The proportions may look odd - consider adjusting the select screen layout.
- **No walking animation for left/right**: Sprites only define `down`, `up`, `right` directions with a canvas flip for left. The flip may cause rendering artifacts if sprites aren't perfectly symmetric.
- **Room transition**: Fade to/from black works, but there's no room name display duration tuning. Currently 90 frames with fade-out.
- **No minimap or area indicator**: Players may get lost navigating 8 rooms.
- **HUD is minimal**: Hearts + puzzle items + cooldown bar. Could add an area name, enemy count, or minimap.
- **Title screen**: Has sparkle particles and a crystal diamond shape, but no actual game logo sprite or title art.
- **Victory screen**: Scrolling credits text, but fairly plain.
- **No screen shake tuning**: Boss screenshake is 3 frames, player damage is 2. These may need adjusting for feel.

### Gameplay Improvements

- **Combat feels**: Attack hitboxes, knockback distances, and invincibility frame durations may need tuning after playtesting.
- **Enemy AI is simple**: Patrol + chase + melee. Could add projectile enemies, different movement patterns, or fleeing behavior.
- **Boss projectile speed**: 1.5 px/frame may be too slow or fast - needs playtesting.
- **Difficulty curve**: Jump from 0 enemies in town to 3 goblins in forest entry may be too sudden. Could add a tutorial encounter.
- **No item shop or equipment**: The blacksmith (Braxon) and market exist narratively but have no gameplay function.
- **Puzzle items only accessible after killing zone enemies**: This design may confuse players since there's no visual indicator.
- **No save system**: Game resets on page refresh. Could add localStorage save.
- **Only 8 rooms**: The campaign has more content that could be expanded into additional areas.
- **No background music**: Only sound effects. Adding procedural chiptune music would greatly improve atmosphere.

### Content Expansion Ideas (from campaign docs)

- **More NPCs**: The worldbuilding doc has dozens of named NPCs not yet included (Lord Regent Aldric Vane, The Warden, Zek the Fence, etc.)
- **Side quests**: Session notes mention several side activities that could become optional objectives
- **Second arc**: The campaign notes tease a continuation with the Bonemoon prophecy
- **More enemy types**: The docs mention various goblin variants, undead, and other creatures
- **Environmental hazards**: Water, traps, crumbling floors from the temple
- **Dialogue choices**: Currently all dialogue is linear. Could add branching conversations.
- **Multiple endings**: Based on which character was chosen or NPCs talked to

---

## Development Notes

### How It Was Built

The game was built by breaking the work into 6 parallel agents, each responsible for one source file. This avoided the problem of trying to write 5000+ lines in a single pass. The files were then assembled and integration bugs were fixed.

### Integration Fixes Applied

1. **NPC constructor mismatch**: game.js passed individual args but NPC class expects a data object `{id, sprite, x, y, dialogue}`. Fixed in game.js `loadRoom()`.
2. **Enemy constructor mismatch**: game.js passed `(x*TILE, y*TILE, type)` but Enemy expects `(type, x, y)` with tile coords (internally multiplied). Fixed argument order and removed premultiplication.
3. **Enemy type normalization**: Maps use `goblin_lackey` but entities check `type === 'goblin'`. Fixed by adding normalization in game.js.
4. **Player constructor argument order**: game.js called `Player(x, y, charType)` but constructor is `Player(characterId, x, y)`. Fixed.
5. **Character select sprite keys**: Used `char_daxon_front` but actual keys are `daxon_down_0`. Fixed to use correct key with `ctx.drawImage` for 2x scaling.
6. **Missing sprite aliases**: Maps reference `npc_elira_voss`, `npc_brother_soren`, `npc_mayor_helena` but sprites only had `npc_elira`, `npc_soren`, `npc_helena`. Added aliases in sprites.js.
7. **Missing dialogue entries**: `rorik_market_greeting` and `rorik_rescue` referenced by maps but not defined. Added to dialogue.js.
8. **Double boss_defeat dialogue**: Both entities.js and game.js triggered `boss_defeat` dialogue. Removed the one in entities.js since game.js has the proper callback chain.

### Branch

All work is on branch `claude/snes-zelda-adventure-game-7o7sG`.
