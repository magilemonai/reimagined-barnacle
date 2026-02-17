# Valisar: Shadows of the Eldspyre - Comprehensive Improvement Plan

## Current State (as of Feb 2026)

The game is a fully playable SNES-style top-down action adventure at ~8,100 lines across 8 source files. The following major systems have been implemented:

### Completed Features
- **Procedural chiptune music** (music.js) - 6 deeply crafted themes with multi-track compositions, crossfading on room transitions
- **Combat feel** - Hitstop/freeze frames, enhanced knockback (collision-aware with per-axis fallback), screen shake tuning, kill shake
- **Enemy AI** - Goblin retreat at low HP, spinecleaver shield bash, enemy attack telegraphs (white flash), stagger on consecutive hits
- **Boss rebalance** - 3-phase charge (telegraph/dash/exhaustion), rebalanced phase scaling, readable attack patterns
- **Minimap** - Vertical column layout in top-right, color-coded rooms, current room highlight, visited/unvisited tracking
- **Save system** - localStorage persistence, Continue option on title screen, save on room transition
- **Pause menu** - P key, shows room name, character stats, collected items
- **Diamond wipe transitions** - Crystal-themed room transitions
- **NPC idle animations** - Subtle breathing/bobbing
- **Dialogue enhancements** - Speaker portraits, text speed-up on hold, slide-up entry animation
- **Directional sprites** - Full procedural sprite system with down/up/right directions and canvas flip for left
- **Sub-tile collision** - Tightened hitboxes for pillars, statues, altars
- **Collision-aware knockback** - Player and enemy knockback checks map collision, with pushOutOfSolids rescue

### Known Remaining Bugs
- **Heart drop conflict**: Enemy.die() has 30% chance, game.js checkDeadEnemies() has 40% chance - can double-fire
- **Boss double damage**: Boss melee + contact damage can both trigger on the same frame
- **Audio constructor shadow**: `window.Audio` shadows native `Audio` constructor; `window.GameAudio` alias exists as workaround

---

## NEXT IMPROVEMENTS - Prioritized

### Priority 1: Visual Atmosphere (High Impact, Moderate Effort)

#### 1a. Temple Torch Glow & Darkness Overlay (game.js)
- Temple rooms get a darkness overlay: fill screen with `rgba(0,0,0,0.85)` layer
- Cut out circular light holes around torches (radius 32px), the player (radius 40px), and boss projectiles (radius 16px)
- Use `globalCompositeOperation = 'destination-out'` on an overlay canvas composited over the scene
- Torch tiles pulse: vary radius ±4px and alpha ±0.1 using `Math.sin(frameCount * 0.08)`
- Creates dramatic "exploring by torchlight" atmosphere in temple rooms
- **Files**: game.js (renderMap overlay pass, torch position scan)

#### 1b. Forest Weather - Falling Leaves (game.js)
- Forest rooms (`ebon_forest_entry`, `ebon_forest_deep`): spawn leaf particles
- 8-12 active leaves at any time, respawn when offscreen
- Each leaf: random green/brown/gold color, slow vertical drift (0.3-0.6 px/frame), horizontal sine-wave motion (`Math.sin(frame * 0.02 + offset) * 0.5`)
- Draw as 2x2 or 3x3 pixel squares with slight rotation
- Adds life to currently static forest scenes
- **Files**: game.js (leaf particle pool, update/render in game state)

#### 1c. Animated Water Tiles (sprites.js + game.js)
- Create 2 water tile frames with shifted highlight pixel positions
- `tile_water_0`: current water sprite, `tile_water_1`: highlights shifted 2px right and 1px down
- Alternate frames every 30 game frames in `renderMap()`
- Adds subtle motion to river/water areas
- **Files**: sprites.js (second frame generation), game.js (frame-based tile key in renderMap)

#### 1d. Boss Projectile Visual Upgrade (entities.js, game.js)
- Boss projectiles get spinning rotation: increment angle by 0.15 radians/frame, draw rotated
- Add particle trail: spawn 1 particle per frame behind projectile in its color, life=10 frames, shrinking
- Phase 3 projectiles get a dark purple glow (draw larger semi-transparent circle behind)
- **Files**: entities.js (Projectile class render/update), game.js (particle spawning)

---

### Priority 2: Combat & Gameplay Depth (High Impact, Moderate Effort)

#### 2a. Floating Damage Numbers (game.js)
- When player or enemies take damage, spawn a floating number at the hit point
- Number rises at 0.5px/frame for 40 frames, fades out over last 15 frames
- Color-coded: red `#f44` for player damage taken, white `#fff` for damage dealt to enemies, green `#4f4` for healing
- Pool of up to 8 active numbers, oldest replaced if pool full
- Display using the existing bitmap font at 1x scale
- "HP RESTORED!" text for potion pickups instead of silent consumption
- **Files**: game.js (FloatingNumber pool, spawn on damage events in update loop, render in HUD pass)

#### 2b. Blacksmith Shop System (game.js, dialogue.js, entities.js)
- Track "goblin teeth" as kill currency: increment `Game.teeth` on each enemy death
- Display teeth count in HUD when in market room (small fang icon + number)
- Braxon NPC interaction opens shop overlay instead of just dialogue:
  - "Sharpen Blade" (3 teeth): +1 attack damage for remainder of run
  - "Reinforce Armor" (5 teeth): +2 max HP (add hearts)
  - "Speed Oil" (4 teeth): +0.15 movement speed
- Simple overlay: dark background, 3 options listed, arrow key selection, Z to buy, X to cancel
- Save purchased upgrades in localStorage save data
- **Files**: game.js (shop state, teeth tracking, HUD), dialogue.js (Braxon shop trigger), entities.js (teeth drop on Enemy.die)

#### 2c. Brother Soren's Blessing (game.js, dialogue.js)
- After player has visited any forest room, talking to Soren triggers a new dialogue branch
- One-time blessing: full HP heal + 10-second speed boost (1.5x movement speed)
- Visual: golden particles swirl around player during blessing, speed boost shows faint gold trail while active
- Check `Game.visitedRooms` includes a forest room and `!Game.flags.sorenBlessing`
- **Files**: game.js (blessing state, speed buff timer), dialogue.js (conditional dialogue branch)

#### 2d. Double Damage Prevention Fix (entities.js)
- Add `player._hitThisFrame = false` flag, set to `true` after first damage source applies
- Reset to `false` at start of each update cycle
- Check flag in `resolveCombat()` before applying boss melee and contact damage
- Only the first damage source per frame applies
- **Files**: entities.js (resolveCombat, Player.update)

#### 2e. Heart Drop Conflict Fix (entities.js, game.js)
- Remove the 40% heart drop check in game.js `checkDeadEnemies()`
- Rely solely on Enemy.die() `_dropItem` property (30% chance)
- Ensure game.js only reads `_dropItem` from dead enemies, doesn't independently roll
- **Files**: entities.js (keep as-is), game.js (remove duplicate roll)

---

### Priority 3: UI/UX Polish (Medium Impact, Low-Medium Effort)

#### 3a. Enhanced HUD (game.js)
- **Enemy counter**: Small skull icon (4x5 px drawn inline) + remaining enemy count, top-left below cooldown bar, only in rooms with enemies
- **Key hints**: Show "Z:ATK X:SPL" faintly (`rgba(255,255,255,0.3)`) at bottom of screen for the first 2 combat rooms encountered, then hide permanently
- **Cooldown bar label**: Tiny "SP" text before the cooldown bar
- **Area name in HUD**: Small text showing current area name persistently in top-center (8px below top edge)
- **Files**: game.js (renderHUD function)

#### 3b. Improved Character Select Screen (game.js)
- Below each character name, show stat comparison bars:
  - HP: red bar (Daxon=full, Luigi/Lirielle=75%)
  - ATK: orange bar (all equal or class-based)
  - SPD: blue bar (all equal base speed)
- Show special ability name and 1-line description below stats
- Animate selected character sprite: alternate frame 0 and frame 1 every 20 game frames
- Subtle highlight glow behind selected character
- **Files**: game.js (renderSelect state)

#### 3c. Game Over Screen Enhancement (game.js)
- Instead of pure black + red text, fade the game scene to desaturated/darkened state
- Show player character sprite lying down (draw sprite rotated 90 degrees)
- Display run stats: rooms explored count, enemies defeated count, time played (formatted as mm:ss)
- Track these stats in Game state during gameplay
- "Press Enter to retry" with pulsing text
- **Files**: game.js (gameover state rendering, stat tracking)

#### 3d. Area Name Banner Upgrade (game.js)
- Dark semi-transparent rectangle behind area name text (`rgba(0,0,0,0.7)`)
- Gold border lines (1px) above and below the rectangle
- Slide in from top (start at y=-20, animate to y=center over 12 frames)
- Hold for 60 frames, then slide up and out over 12 frames
- Replace current simple centered text with this banner system
- **Files**: game.js (room transition rendering)

---

### Priority 4: Content Expansion (Medium Impact, Higher Effort)

#### 4a. Expanded NPC Dialogue (dialogue.js, game.js)
- NPCs have different dialogue based on game progress:
  - **Before forest**: Current dialogue (warnings about goblins, town flavor)
  - **After clearing forest**: New dialogue acknowledging progress ("The forest feels safer now", "You've proven yourself")
  - **After boss defeat**: Celebratory dialogue ("The temple is cleansed!", "You saved Rorik!")
- Implementation: dialogue keys become arrays, selected by checking `Game.clearedRooms` and `Game.flags.bossDefeated`
- Que'Rubra in Forest Deep gets post-clear dialogue about the temple ahead
- **Files**: dialogue.js (add dialogue variants), game.js (dialogue selection logic)

#### 4b. Sign Interaction (game.js, maps.js)
- Sign tiles (Sg) in North Gate and Town Square become interactable
- When player presses Z within 20px of a sign tile, trigger sign dialogue
- North Gate sign: "DANGER: Goblin territory beyond this point. Travel at your own risk."
- Town Square sign: "Welcome to Ebon Vale - The Last Hearth Before the Wild"
- Detect sign tiles by scanning adjacent tiles when Z is pressed and no NPC is nearby
- **Files**: game.js (interaction logic), maps.js (sign tile positions already exist)

#### 4c. Environmental Map Details (maps.js)
- **Town rooms**: Add scattered flower tiles (Fw) to soften the stone/grass grid
- **Forest rooms**: Vary tree density - add small clearings, mushroom clusters near trees
- **Temple rooms**: Add more torch placement at corridor intersections for better lighting atmosphere (ties into 1a)
- Keep changes subtle - enhance without disrupting gameplay paths
- **Files**: maps.js (room tile arrays)

#### 4d. Phase 2 Minion Summon (entities.js, game.js)
- When boss enters Phase 2, spawn 2 goblin enemies at fixed positions (left and right of arena)
- Goblins have reduced HP (2 instead of 3) so they're manageable distractions
- Boss dialogue references "my servants" before summon
- Visual: dark particles coalesce at spawn points over 15 frames, then goblins appear
- Only triggers once per fight
- **Files**: entities.js (Boss.enterPhase), game.js (enemy spawning during boss state)

---

### Priority 5: Audio & Sound Design (Medium Impact, Low-Medium Effort)

#### 5a. Footstep Sounds (engine.js, game.js)
- Play a subtle quiet blip every 10 frames while player is moving
- Pitch varies by terrain: grass tiles = higher pitch (600Hz), stone = lower (400Hz), wood = mid (500Hz)
- Volume very low (0.03) - should be felt more than heard
- Determine tile type under player center point each step
- **Files**: engine.js (new SFX definition), game.js (trigger in player movement check)

#### 5b. Ambient Sounds (engine.js, game.js)
- Forest rooms: random bird chirp every 3-8 seconds (random interval timer)
  - Short sine sweep 1200Hz->800Hz over 0.05s, very quiet
- Temple rooms: occasional water drip every 4-10 seconds
  - Short sine blip at 2000Hz, 0.02s duration, reverb-like echo (quieter repeat at +0.15s)
- Only play when in the matching room type, stop on room change
- **Files**: engine.js (ambient SFX definitions), game.js (ambient timer management)

#### 5c. Room Transition Whoosh (engine.js, game.js)
- Brief noise-based whoosh sound when changing rooms
- White noise burst, 0.1s duration, bandpass filter sweep from 2000Hz to 500Hz
- Plays during the diamond wipe transition
- **Files**: engine.js (whoosh SFX), game.js (trigger on room change)

#### 5d. Puzzle Solve Fanfare (engine.js, game.js)
- When all 3 relics are placed on the statue, play ascending arpeggio
- C5->E5->G5->C6, each note 0.1s, square wave, moderate volume
- Zelda-style "puzzle solved" feel
- **Files**: engine.js (fanfare SFX definition), game.js (trigger on puzzle completion)

---

### Priority 6: Polish & Feel (Lower Impact, Various Effort)

#### 6a. Title Screen Enhancements (game.js)
- Animate Eldspyre crystal: slow pulsing glow (radius oscillates ±3px, alpha oscillates 0.3-0.6)
- Background: very slow parallax star field (tiny 1px white dots drifting upward at 0.1px/frame, wrap around)
- Subtitle "Shadows of the Eldspyre" fades in letter-by-letter after title appears
- Sparkle particles already exist - enhance with occasional larger "twinkle" particle
- **Files**: game.js (title state rendering)

#### 6b. Victory Screen Enhancements (game.js)
- Show chosen character sprite walking rightward (animate between frames, move x position slowly)
- Golden gradient background (warm sunset colors)
- Fireworks: periodic bursts of 15-20 colored particles at random screen positions (every 45-60 frames)
- Victory music already plays - ensure it loops nicely
- **Files**: game.js (victory state rendering)

#### 6c. Input Buffering (engine.js)
- Buffer the last Z/X press for 6 frames
- If player presses Z while attack is on cooldown, queue it
- When cooldown expires within the buffer window, auto-trigger the buffered action
- Makes combat feel more responsive - no more "swallowed" inputs
- **Files**: engine.js (Input system, add buffer tracking)

#### 6d. Gamepad Support (engine.js)
- Poll `navigator.getGamepads()` each frame
- Map: D-pad/left stick = movement, A button (index 0) = Z action, B button (index 1) = X action, Start (index 9) = Enter
- Merge gamepad input with keyboard input in the Input object
- Add deadzone of 0.3 for analog sticks
- **Files**: engine.js (Input object, add gamepad polling)

#### 6e. Improved Particle Effects (engine.js)
- `Particles.trail(x, y, color, count)`: spawns particles behind a moving point, short life (8 frames), shrinking
- `Particles.ring(x, y, color, count)`: expanding ring of particles for phase transitions, puzzle completion
- `Particles.confetti(x, y)`: multi-colored burst for victory screen
- Add rotation property to particles for visual variety (rotate drawn square by particle.rotation)
- **Files**: engine.js (Particles object)

---

### Priority 7: Advanced Features (Lower Priority, Higher Effort)

#### 7a. Difficulty Selection (game.js)
- Add difficulty choice on title screen or character select: Easy / Normal / Hard
- Easy: enemies have 70% HP and damage, more heart drops (50%), boss charge telegraph +10 frames
- Hard: enemies have 130% HP and damage, fewer heart drops (15%), boss charge telegraph -5 frames
- Normal: current values (default)
- Save difficulty preference in localStorage
- **Files**: game.js (difficulty multipliers, select screen)

#### 7b. Speed Run Timer (game.js)
- Optional real-time timer shown in top-right corner (mm:ss.ms format)
- Starts on first room load after intro, stops on boss defeat
- Toggled with T key
- Show final time on victory screen
- Best time saved in localStorage
- **Files**: game.js (timer state, HUD rendering, victory display)

#### 7c. Bestiary / Journal (game.js)
- Accessible from pause menu
- Records enemies encountered with their sprite, name, HP, and description
- Records NPCs met with name and brief flavor text
- Records rooms visited
- Simple scrollable list overlay
- **Files**: game.js (bestiary state, pause menu extension)

#### 7d. New Enemy Type: Goblin Archer (entities.js, sprites.js, maps.js)
- Ranged enemy: stands still, fires arrow projectiles at player every 90 frames
- 2 HP, 1 damage per arrow, arrow speed 1.5px/frame
- Flees if player gets within 32px (moves away at 0.8 speed)
- Sprite: goblin body with bow (brownish, smaller than spinecleaver)
- Place 1-2 in temple_entrance or forest_deep for variety
- **Files**: entities.js (new enemy type), sprites.js (archer sprite), maps.js (enemy placement)

#### 7e. Environmental Hazards (maps.js, game.js)
- **Spike traps** in temple: tiles that deal 1 damage if stepped on, with 60-frame cooldown
- **Crumbling floor** in temple: tiles that break away after player stands on them for 30 frames, becoming pits (impassable)
- Visual: spike tiles have small triangular spikes drawn, crumbling tiles get cracks that widen
- New tile types in maps.js TileProps
- **Files**: maps.js (new tile definitions), game.js (hazard damage logic, tile state tracking)

#### 7f. Dialogue Choices (dialogue.js, game.js)
- Some NPC conversations offer 2-3 response options
- Player uses up/down to select, Z to confirm
- Different choices lead to different dialogue branches
- Example: Que'Rubra asks "Will you brave the temple?" -> "Yes" (encouragement) / "Tell me more" (lore) / "Not yet" (different response)
- **Files**: dialogue.js (branching dialogue data structure, choice rendering), game.js (choice input handling)

---

## Implementation Priority Summary

| # | Feature | Impact | Effort | Files |
|---|---------|--------|--------|-------|
| 1 | Temple lighting & torch glow | High | Medium | game.js |
| 2 | Floating damage numbers | High | Low | game.js |
| 3 | Forest falling leaves | Medium | Low | game.js |
| 4 | Bug fixes (double damage, heart drops) | High | Low | entities.js, game.js |
| 5 | Blacksmith shop | High | Medium | game.js, dialogue.js, entities.js |
| 6 | Boss projectile visuals | Medium | Low | entities.js |
| 7 | Enhanced HUD | Medium | Low | game.js |
| 8 | Animated water tiles | Medium | Low | sprites.js, game.js |
| 9 | Expanded NPC dialogue | Medium | Medium | dialogue.js, game.js |
| 10 | Soren's blessing | Medium | Low | game.js, dialogue.js |
| 11 | Area name banner | Low | Low | game.js |
| 12 | Character select upgrade | Medium | Low | game.js |
| 13 | Game over screen | Low | Low | game.js |
| 14 | Sign interaction | Low | Low | game.js |
| 15 | Footstep sounds | Medium | Low | engine.js, game.js |
| 16 | Ambient sounds | Medium | Low | engine.js, game.js |
| 17 | Room transition whoosh | Low | Low | engine.js, game.js |
| 18 | Puzzle solve fanfare | Low | Low | engine.js, game.js |
| 19 | Title screen polish | Low | Low | game.js |
| 20 | Victory screen polish | Low | Low | game.js |
| 21 | Input buffering | Medium | Low | engine.js |
| 22 | Gamepad support | Medium | Medium | engine.js |
| 23 | Phase 2 minion summon | Medium | Medium | entities.js, game.js |
| 24 | Environmental details | Low | Low | maps.js |
| 25 | Particle effect helpers | Medium | Low | engine.js |
| 26 | Difficulty selection | Medium | Medium | game.js |
| 27 | Speed run timer | Low | Low | game.js |
| 28 | Bestiary/Journal | Low | Medium | game.js |
| 29 | Goblin archer enemy | Medium | High | entities.js, sprites.js, maps.js |
| 30 | Environmental hazards | Medium | High | maps.js, game.js |
| 31 | Dialogue choices | Low | High | dialogue.js, game.js |

---

## Architecture Notes for Implementation

### File Responsibilities
| File | Lines | Role |
|------|-------|------|
| engine.js | 845 | Canvas, input, audio SFX, particles, bitmap font, utilities |
| sprites.js | 1,301 | Procedural pixel art generation for all game sprites |
| maps.js | 557 | 8 room tile layouts, tile properties, sub-tile collision |
| dialogue.js | 760 | Typewriter dialogue system, NPC conversation data, portraits |
| entities.js | 1,396 | Player, Enemy, NPC, Boss, Projectile, combat resolution |
| game.js | 2,507 | Main loop, state machine, HUD, minimap, save, transitions |
| music.js | 611 | 6-theme procedural chiptune music system |

### Global Dependencies
```
engine.js    -> window.{TILE, COLS, ROWS, W, H, C, Input, Audio/GameAudio, Particles, Utils, Engine, buf, display}
sprites.js   -> window.Sprites  (depends on: C)
maps.js      -> window.{T, TileProps, Maps}
dialogue.js  -> window.{DialogueData, Dialogue}  (depends on: Utils, GameAudio, C)
entities.js  -> window.Entities  (depends on: C, Input, Sprites, Maps, Particles, Audio, Utils, Dialogue)
music.js     -> window.Music  (depends on: nothing, uses own AudioContext)
game.js      -> window.Game  (depends on: everything above)
```

### Key Conventions
- All modules use IIFE pattern with `window.*` exports
- Sprites are procedurally drawn pixel-by-pixel using string arrays with palette objects
- Collision uses sub-tile hitboxes in `TileProps[tileId].hitbox = {x, y, w, h}`
- Game state machine: `title -> select -> intro -> game -> boss_intro -> boss -> victory / gameover`
- Music themes: `title`, `town`, `forest`, `temple`, `boss`, `victory` - crossfade on transition
- Player sprite keys: `{characterId}_{direction}_{frame}` (e.g., `daxon_down_0`), left uses right sprite with canvas flip
