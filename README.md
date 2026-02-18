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

```
Title -> Character Select -> Intro Cutscene -> Gameplay -> Boss Fight -> Epilogue -> Victory
```

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
  engine.js    (~1100 lines)  - Canvas, input, audio SFX, particles, bitmap font, utils
  sprites.js   (~1400 lines)  - Procedural pixel art (characters, NPCs, enemies, tiles)
  maps.js      (~580 lines)   - 8 room layouts, tile system, sub-tile collision, Maps API
  dialogue.js  (~720 lines)   - Typewriter dialogue, NPC conversations, scene properties
  entities.js  (~1400 lines)  - Player, Enemy, NPC, Boss, Projectile, combat
  music.js     (~610 lines)   - Procedural chiptune music (6 themes, multi-track sequencer)
  game.js      (~3900 lines)  - Game loop, state machine, HUD, cutscenes, save system
```

**Total: ~9,700+ lines of JavaScript**

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
- **Font**: Custom 5x7 bitmap font (A-Z, 0-9, punctuation). All pixel positions snapped to integers to prevent sub-pixel blur at fractional scales.
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
| Luigi Bonemoon | Warlock (old man, grey hair) | 6 half-hearts | 2.2 | Brog familiar (homing projectile) |
| Lirielle | Circle of Stars Druid (blonde) | 6 half-hearts | 2.0 | Heal (restores 2 half-hearts) |

### 8 Rooms

| # | Room ID | Area | Enemies | NPCs |
|---|---------|------|---------|------|
| 1 | `ebon_vale_square` | Town Square (START) | None | Fawks, Mayor Helena, Captain Elira Voss |
| 2 | `ebon_vale_market` | Market District | None | Braxon (blacksmith), Brother Soren (tabaxi monk), Svana Ironveil (dwarf refugee) |
| 3 | `ebon_vale_north` | North Gate | None | None (signpost warning) |
| 4 | `ebon_forest_entry` | Forest Edge | 3 goblin lackeys + 1 archer | None |
| 5 | `ebon_forest_deep` | Que'Rubra's Grove | 2 goblins + 1 spinecleaver + 1 archer | Que'Rubra |
| 6 | `temple_entrance` | Temple Entry Hall | 2 spinecleavers | None |
| 7 | `temple_puzzle` | Antechamber of Shadows | 6 goblins (2 per alcove) | None |
| 8 | `temple_boss` | Inner Sanctum | Queen Bargnot (boss) | Rorik (bound at altar) |

Room connectivity (linear north): `market <-> square <-> north <-> forest_entry <-> forest_deep <-> temple_entrance <-> temple_puzzle <-> temple_boss`

### Enemy Types

| Enemy | HP | Damage | Speed | Behavior |
|-------|----|--------|-------|----------|
| Goblin | 3 | 1 | 0.6 | Patrol + chase within 80px, melee attack. Retreats at low HP. |
| Goblin Archer | 2 | 1 | 0.5 | Ranged AI, fires arrows, flees if player gets close. |
| Spinecleaver | 6 | 2 | 0.5 | Tankier goblin with shield bash attack. |

### Boss: Queen Bargnot (3 Phases)

- **Phase 1** (100%-50% HP): Chase + single projectiles. 40 HP total.
- **Phase 2** (50%-25%): Adds charge attacks (30-frame telegraph -> dash -> exhaustion window).
- **Phase 3** (below 25%): Barrage attack (3-spread projectiles), shadow particles, purple aura.
- **Defeat**: 5-phase 90-frame spectacle with flickering, flash, and screen shake.

### Puzzle Mechanic

In `temple_puzzle`, three items (Crown, Cape, Scepter) are hidden in alcoves guarded by goblins. Collect all three, then interact with the Ascendant Shadow statue (altar centerpiece flanked by torches and statues) to unlock the north passage. Boulders blocking the boss entrance animate rolling away when the puzzle is solved.

### Cutscene System

- **Intro**: 4 pixel art scenes (town, forest, temple, heroes) with narrator dialogue
- **Epilogue** (after boss defeat): 3 scenes via `ending_nitriti` dialogue (Nitriti spirit, darkness, Eldspyre peak with heroes)
- **Victory**: 4 scenes via `ending_final` dialogue (vale at peace, Bonemoon prophecy, heroes on the path, title card)
- Scenes are tied to dialogue entries via `scene` property, rendered by dedicated pixel art functions

### Character-Specific Interactions

- Braxon recognizes Daxon as his son with unique father-son dialogue. Luigi and Lirielle get a generic blacksmith greeting.
- Braxon opens his shop after first dialogue (no re-engagement needed).
- Brother Soren gives a blessing (full heal + speed boost) after first dialogue.

### Game States

```
title -> select -> intro -> game -> boss_intro -> boss -> epilogue -> victory
                                 -> gameover (respawn to last safe room)
                                 -> pause (P key)
```

---

## Known Issues

- **Heart drop conflict**: Enemy.die() has 30% heart drop chance, game.js checkDeadEnemies() has separate 40% check - drops can double-fire
- **Boss double damage**: Boss melee + contact damage can both trigger on same frame
- **Audio constructor shadow**: `window.Audio` shadows native `Audio` constructor; `window.GameAudio` exists as safe alias

---

## Development History

### Initial Build (Feb 2026)
Game built by breaking work into parallel agents, each responsible for one source file. Files assembled and 12 integration bugs fixed (NPC/Enemy/Player constructor mismatches, sprite key issues, collision trapping, boss charge balance).

### Improvement Pass 1 (Feb 2026)
Systematic improvements across all files: enhanced combat feel, music system, sprite overhaul, minimap, save system, diamond wipe transitions, NPC idle animations, dialogue enhancements.

### Improvement Pass 2 (Feb 18, 2026)
Focused on player-reported issues across 5 rounds of feedback:

1. **NPC accessibility & dialogue UX**: Market room doorways added, forest sign fixed, dialogue consolidated to 2-lines-per-screen with skip-seen, narrator mode for intro cutscene with pixel art scenes.
2. **Lore & gameplay flow**: Replaced Rorik (imprisoned in temple) with Svana Ironveil in market. Braxon auto-opens shop on first talk, Soren auto-blesses. Rolling boulder system for temple puzzle. Extended boss defeat animation. Nitriti epilogue cutscene state added.
3. **Polish**: Helena moved away from sign to prevent interaction overlap. Victory fireworks removed. Complete sprite overhaul for connected anatomy.
4. **Visual & layout**: Character select text collision fixed (auto-scaling, word-wrap). Soren redesigned as tabaxi (cat ears, fur, tail). Svana redesigned as proper dwarf (stocky, braided, armored). All village buildings rebuilt as 4-wide structures with 2-row roofs. Final cutscene: 3 hero silhouettes facing mountain range under animated starfield.
5. **Final polish**: Blurry text fixed (integer pixel snapping in drawText). Luigi grey hair, Lirielle blonde hair. Temple puzzle statue expanded to altar+statue+torch centerpiece. Braxon character-specific dialogue for Daxon. Victory cutscene scenes added (vale peace, Bonemoon, heroes path, title card).
