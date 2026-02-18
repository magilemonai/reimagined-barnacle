# Valisar: Shadows of the Eldspyre - Improvement Plan

## Current State (as of Feb 18, 2026)

~9,700 lines across 7 source files. Fully playable from title screen through boss defeat, epilogue, and victory credits with pixel art cutscenes throughout.

---

## Completed Work

### Initial Build
- Procedural chiptune music (6 themes with crossfading)
- Combat feel (hitstop, knockback, screen shake, stagger)
- Enemy AI (goblin retreat, spinecleaver shield bash, attack telegraphs, goblin archers)
- Boss 3-phase design (chase, charge, barrage) with balanced telegraph windows
- Minimap, save system, pause menu, diamond wipe transitions
- Directional sprites with walk/attack animations, sub-tile collision

### Improvement Pass 1
- Dialogue overhaul: 2-lines-per-screen, pagination, skip-seen tracking, narrator mode
- Intro cutscene: 4 pixel art scenes (town, forest, temple, heroes) over narrator dialogue
- Market room accessibility: doorways into Braxon's forge and Soren's chapel
- Forest sign visibility fix

### Improvement Pass 2
- **Lore fixes**: Rorik replaced by Svana Ironveil in market (Rorik is imprisoned in temple). Soren is a tabaxi (cat-person sprite with ears/fur/tail). Svana is a dwarf (stocky build, braids, armored).
- **Gameplay flow**: Braxon opens shop after first dialogue. Soren blesses on first dialogue. Braxon has character-specific dialogue recognizing Daxon as his son.
- **Boulder system**: Rocks block temple boss entrance until puzzle solved, then animate rolling away.
- **Boss defeat**: 5-phase 90-frame spectacle (flickering, flash, screen shake, room brightening).
- **Epilogue state**: New game state after boss defeat. 3 pixel art scenes (Nitriti spirit, darkness with moon, heroes facing Eldspyre mountain range under animated starfield).
- **Victory cutscenes**: 4 pixel art scenes during ending_final prophecy (Ebon Vale at peace with lit windows, Bonemoon omen, heroes walking into the unknown, dramatic title card).
- **Character select**: Fixed text collision with auto-scaling names, word-wrapped class text, compact stat layout.
- **Text rendering**: Fixed blurry text by snapping all drawText pixel positions to integers (Math.round/Math.ceil).
- **Sprite updates**: Luigi has grey hair (old man). Lirielle has blonde hair. All NPC/enemy sprites overhauled for connected anatomy.
- **Map overhaul**: All village buildings rebuilt as 4-wide structures with 2-row roofs and south-facing doors. Market buildings got rooftop tiles. Temple puzzle statue expanded to altar+torch centerpiece. Mushrooms added to forest rooms.
- **UX**: Helena moved away from sign. Victory fireworks removed. Signs readable at market south exit.

---

## Remaining Improvements

### High Priority

#### Temple Torch Glow & Darkness Overlay
- Temple rooms get darkness overlay with circular light holes around torches, player, and projectiles
- Uses `globalCompositeOperation = 'destination-out'` on overlay canvas
- Torch tiles pulse radius/alpha with sin wave
- **Files**: game.js

#### Floating Damage Numbers
- Spawn floating number at hit point, rises and fades over 40 frames
- Color-coded: red (player damage), white (enemy damage), green (healing)
- Pool of up to 8 active numbers
- **Files**: game.js

#### Bug Fixes
- Heart drop conflict: Remove duplicate 40% roll in game.js checkDeadEnemies(), keep 30% in Enemy.die()
- Boss double damage: Add per-frame hit flag to prevent melee + contact both triggering
- **Files**: entities.js, game.js

### Medium Priority

#### Forest Weather - Falling Leaves
- 8-12 leaf particles drifting with sine-wave horizontal motion in forest rooms
- **Files**: game.js

#### Animated Water Tiles
- 2 water tile frames alternating every 30 game frames
- **Files**: sprites.js, game.js

#### Boss Projectile Visuals
- Spinning rotation, particle trail, Phase 3 purple glow
- **Files**: entities.js, game.js

#### Expanded NPC Dialogue
- Different dialogue based on game progress (before forest / after clearing / after boss)
- **Files**: dialogue.js, game.js

#### Phase 2 Minion Summon
- Boss spawns 2 reduced-HP goblins when entering Phase 2
- **Files**: entities.js, game.js

### Lower Priority

#### Audio Additions
- Footstep sounds (terrain-dependent pitch)
- Ambient sounds (forest birds, temple drips)
- Room transition whoosh
- Puzzle solve fanfare
- **Files**: engine.js, game.js

#### Advanced Features
- Bestiary/journal accessible from pause menu
- Environmental hazards (spike traps, crumbling floor) - tile types exist but no damage logic
- Dialogue choices for NPCs (branching conversations)
- **Files**: game.js, dialogue.js, maps.js

---

## Architecture Reference

### Key Conventions
- All modules use IIFE pattern with `window.*` exports
- Sprites drawn pixel-by-pixel using string arrays with palette objects via `dp()` function
- NPCs: 16x24 via `makeNPC(name, rows, palette)`. Characters: 16x24 via `makeCharacter(name, palette)` with 9 frames (3 directions x 3 poses)
- Collision uses sub-tile hitboxes in `TileProps[tileId].hitbox = {x, y, w, h}`
- Game states: `title -> select -> intro -> game -> boss_intro -> boss -> epilogue -> victory / gameover`
- Dialogue `scene` property maps to renderer functions (epilogueRenderers, victorySceneRenderers, cutsceneRenderers)
- Player character accessible as `Game.player.characterId` ('daxon', 'luigi', 'lirielle')
- NPC special interactions handled in `checkNPCInteraction()` with character-specific dialogue lookup
