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
| P | Pause |
| Tab | Toggle minimap |
| M | Toggle music |

### Game Flow

Title screen -> Character select -> Intro cutscene -> Gameplay -> Boss fight -> Victory

The game auto-saves progress on room transitions. A "Continue" option appears on the title screen when a save exists.

---

## Source Documents

The game is adapted from two campaign documents in the repo root:

- **`DM Notes_ Valisar Worldbuilding Master Doc (2).txt`** - Full worldbuilding: geography, factions, deities, NPCs, lore
- **`Valisar Active Campaign Notes First Arc only.txt`** - Session-by-session notes (Sessions 0-9) covering the first arc

### Campaign Arc (Sessions 0-9)

The party (Daxon Lamn, Luigi Bonemoon, Lirielle) starts in **Ebon Vale**, investigates goblin threats, ventures through the **Ebon Forest**, enters the **Temple of Nitriti**, solves a puzzle (Crown, Cape, Scepter for a statue), and defeats **Queen Bargnot** who is performing a sacrifice ritual. After the boss fight, the spirit of Nitriti hallows the temple, Rorik Flamebeard is rescued, and the Bonemoon prophecy is teased.

---

## Architecture

Pure client-side JavaScript. No frameworks, no bundler, no npm. Seven source files loaded in dependency order via `<script>` tags in `index.html`.

### File Map

```
index.html              - HTML shell, loads all scripts in order
style.css               - Dark theme, pixelated canvas, purple glow aesthetic
src/
  engine.js    (845 lines)   - Canvas, input, audio SFX, particles, bitmap font, utils
  sprites.js   (1301 lines)  - Procedural pixel art sprite generation (directional characters, NPCs, enemies, tiles)
  maps.js      (557 lines)   - 8 room layouts, tile system, sub-tile collision, Maps API
  dialogue.js  (760 lines)   - Typewriter dialogue system, NPC conversations, speaker portraits
  entities.js  (1396 lines)  - Player, Enemy, NPC, Boss, Projectile, combat resolution
  music.js     (611 lines)   - Procedural chiptune music system (6 themes, multi-track sequencer)
  game.js      (2507 lines)  - Main game loop, state machine, HUD, minimap, save system, transitions
```

**Total: ~8,100 lines of JavaScript**

### Load Order and Dependencies

```
engine.js    -> window.{TILE, COLS, ROWS, W, H, C, Input, Audio/GameAudio, Particles, Utils, Engine, buf, display}
sprites.js   -> window.Sprites  (depends on: C)
maps.js      -> window.{T, TileProps, Maps}
dialogue.js  -> window.{DialogueData, Dialogue}  (depends on: Utils, GameAudio, C)
entities.js  -> window.Entities  (depends on: C, Input, Sprites, Maps, Particles, Audio, Utils, Dialogue)
music.js     -> window.Music  (depends on: nothing, uses own AudioContext)
game.js      -> window.Game  (depends on: everything above)
```

### Technical Specs

- **Resolution**: 256x224 internal (SNES), scaled 3x to 768x672 display
- **Rendering**: Offscreen canvas buffer -> display canvas with nearest-neighbor scaling
- **Sprites**: All procedurally generated at init time using Canvas 2D API, cached as offscreen canvases. Characters have directional sprites (down/up/right + canvas flip for left) with 2-frame walk animation.
- **Audio**: Web Audio API with procedurally generated sound effects (16 sounds) and 6 chiptune music themes
- **Music**: Pattern-based sequencer using OscillatorNode + GainNode chains. Multi-track compositions (3-5 tracks per theme) with crossfading between themes on room transitions.
- **Font**: Custom 5x7 bitmap font (A-Z, 0-9, punctuation)
- **Tiles**: 16x16px, 16 columns x 14 rows per room (28+ tile types with sub-tile collision hitboxes)
- **Collision**: Sub-tile hitbox system - tiles like pillars and statues have tightened collision rectangles smaller than the full 16x16 tile
- **Persistence**: localStorage save system - saves room, HP, items, cleared rooms, puzzle flags on room transitions
- **Frame rate**: requestAnimationFrame (targets 60fps)

---

## Game Content

### Three Playable Characters

| Character | Class | HP | Speed | Special (X key) |
|-----------|-------|----|-------|-----------------|
| Daxon Lamn | Eldritch Knight Fighter | 8 half-hearts | 2.0 | Shield (1.5s invincibility) |
| Luigi Bonemoon | Warlock | 6 half-hearts | 2.2 | Brog familiar (homing projectile) |
| Lirielle | Circle of Stars Druid | 6 half-hearts | 2.0 | Heal (restores 2 half-hearts) |

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

Room connectivity (linear north): `market <-> square <-> north <-> forest_entry <-> forest_deep <-> temple_entrance <-> temple_puzzle <-> temple_boss`

### Enemy Types

| Enemy | HP | Damage | Speed | Behavior |
|-------|----|--------|-------|----------|
| Goblin | 3 | 1 | 0.6 | Patrol + chase within 80px, melee attack. Retreats at low HP (30% chance to flee for 2s). Staggers after 3 consecutive hits. |
| Spinecleaver | 6 | 2 | 0.5 | Same base AI, tankier. Has shield bash attack (20% chance in melee range, wider hitbox + more knockback). |

Both enemy types telegraph attacks with a 6-frame white flash before striking.

### Boss: Queen Bargnot (3 Phases)

- **Phase 1** (100%-50% HP): Chase + single projectiles. 40 HP total. Speed 1.0.
- **Phase 2** (50%-25%): Adds charge attacks with 3-phase structure (30-frame telegraph -> 16-frame dash at 2x speed -> 12-frame exhaustion/vulnerability window). Speed +0.15. Dialogue trigger.
- **Phase 3** (below 25%): Barrage attack (3-spread projectiles every 12 frames), shadow particles, purple aura, 2 damage per hit. Speed +0.15.

### Combat System

- **Hitstop**: 3-frame freeze on hit for both attacker and target
- **Knockback**: Collision-aware (checks map tiles, falls back to per-axis movement). Velocity decay at 0.7x per frame.
- **Screen shake**: 4 frames on player damage, 5 frames on boss hit, 8 frames on boss phase transition, 2 frames on enemy kill
- **Stagger**: 3 rapid hits on an enemy triggers 30-frame stun state
- **Invincibility frames**: Player gets brief invincibility after taking damage

### Music System

6 procedural chiptune themes with rich multi-track compositions:
- **Title "Valisar's Call"** (72 BPM): Atmospheric pad with hero's call motif (E-G-C), crystalline accents
- **Town "Ebon Vale"** (112 BPM): Warm waltz feel, bouncy bass, question-and-answer melody
- **Forest "Whispers in Shadow"** (84 BPM): Chromatic creeping bass, eerie melody with dark motif (C-Eb-D-C), descending drones
- **Temple "Temple of Nitriti"** (60 BPM): Grinding chromatic bass descent, tritone motifs, cathedral drips, heartbeat pulse
- **Boss "Queen Bargnot"** (152 BPM): Driving bass with chromatic turnaround, fierce angular melody, kick-snare percussion
- **Victory "Dawn Returns"** (104 BPM): Fanfare melody, warm harmony pad, bright sparkle accents

Themes crossfade on room transitions. Toggle with M key.

### Puzzle Mechanic

In `temple_puzzle`, three items (Crown, Cape, Scepter) are hidden in alcoves guarded by goblins. Collect all three, then interact with the central Ascendant Shadow statue to unlock the north passage to the boss room.

### UI Features

- **Minimap**: Vertical column in top-right corner showing all 8 rooms. Color-coded (green=town, dark green=forest, gray=temple, red=boss). Current room highlighted, visited rooms shown, unvisited dimmed. Toggle with Tab.
- **HUD**: Heart-based HP display, puzzle item indicators, special ability cooldown bar
- **Pause menu**: P key - shows room name, character stats, collected items
- **Save system**: Auto-saves on room transition. Continue option on title screen.
- **Diamond wipe**: Crystal-themed expanding diamond transition between rooms
- **Dialogue**: Typewriter text reveal with speaker portraits, slide-up animation, hold Z to speed up text
- **NPC idle**: Subtle breathing/bobbing animation for town NPCs

### Game States

```
title -> select -> intro -> game -> boss_intro -> boss -> victory
                                 -> gameover (respawn to last safe room)
                                 -> pause (P key, resume with P or Escape)
```

---

## Known Issues

- **Heart drop conflict**: Enemy.die() has 30% heart drop chance, game.js checkDeadEnemies() has separate 40% check - drops can double-fire
- **Boss double damage**: Boss melee + contact damage can both trigger on same frame
- **Audio constructor shadow**: `window.Audio` shadows native `Audio` constructor; `window.GameAudio` exists as safe alias
- **Sprite aliases are runtime copies**: `npc_elira_voss`, `npc_brother_soren`, `npc_mayor_helena` are set as `S.cache[alias] = S.cache[original]` after NPC sprites are created
- **Enemy type normalization**: `goblin_lackey` from maps is normalized to `goblin` in game.js `loadRoom()` - bypassing this normalization would break enemy stats

---

## Future Improvements

See **PLAN.md** for a comprehensive, prioritized improvement plan covering:

1. **Visual atmosphere** - Temple lighting/darkness overlay, forest weather effects, animated water, boss projectile upgrades
2. **Combat & gameplay depth** - Floating damage numbers, blacksmith shop system, Soren's blessing, bug fixes
3. **UI/UX polish** - Enhanced HUD with enemy counter, improved character select, game over screen, area name banners
4. **Content expansion** - Progress-aware NPC dialogue, sign interactions, environmental details, boss Phase 2 minion summons
5. **Audio & sound design** - Footstep sounds, ambient forest/temple sounds, room transition whoosh, puzzle solve fanfare
6. **Polish & feel** - Title/victory screen enhancements, input buffering, gamepad support, particle effect helpers
7. **Advanced features** - Difficulty selection, speed run timer, bestiary/journal, new enemy types, environmental hazards, dialogue choices

---

## Development Notes

### How It Was Built

The game was built by breaking the work into parallel agents, each responsible for one source file. This avoided the problem of trying to write 8000+ lines in a single pass. The files were then assembled and integration bugs were fixed. Subsequent improvements were made iteratively: music system, combat feel, boss rebalance, sprite system, and UI features.

### Integration Fixes Applied

1. **NPC constructor mismatch**: game.js passed individual args but NPC class expects a data object `{id, sprite, x, y, dialogue}`. Fixed in game.js `loadRoom()`.
2. **Enemy constructor mismatch**: game.js passed `(x*TILE, y*TILE, type)` but Enemy expects `(type, x, y)` with tile coords (internally multiplied). Fixed argument order and removed premultiplication.
3. **Enemy type normalization**: Maps use `goblin_lackey` but entities check `type === 'goblin'`. Fixed by adding normalization in game.js.
4. **Player constructor argument order**: game.js called `Player(x, y, charType)` but constructor is `Player(characterId, x, y)`. Fixed.
5. **Character select sprite keys**: Used `char_daxon_front` but actual keys are `daxon_down_0`. Fixed to use correct key with `ctx.drawImage` for 2x scaling.
6. **Missing sprite aliases**: Maps reference `npc_elira_voss`, `npc_brother_soren`, `npc_mayor_helena` but sprites only had `npc_elira`, `npc_soren`, `npc_helena`. Added aliases in sprites.js.
7. **Missing dialogue entries**: `rorik_market_greeting` and `rorik_rescue` referenced by maps but not defined. Added to dialogue.js.
8. **Double boss_defeat dialogue**: Both entities.js and game.js triggered `boss_defeat` dialogue. Removed the one in entities.js since game.js has the proper callback chain.
9. **Left sprite rendering**: Player.render() built `daxon_left_0` key which doesn't exist - fixed to use `right` sprite key with canvas flip for left direction.
10. **Minimap layout**: MINIMAP_ROOMS was a 4-column grid but game progression is linear north - fixed to single vertical column.
11. **Collision trapping**: Pillar/statue hitboxes were too large, knockback didn't check map collision - tightened hitboxes, added collision-aware knockback with pushOutOfSolids rescue.
12. **Boss charge balance**: 18-frame telegraph was too short, 3x speed too fast - restructured into 3-phase charge (30-frame telegraph, 2x speed dash, 12-frame exhaustion window).
