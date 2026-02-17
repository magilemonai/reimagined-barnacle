# Valisar: Shadows of the Eldspyre - Comprehensive Improvement Plan

## Overview

This plan covers improvements across every aspect of the game: audio, visuals, gameplay, UI/UX, bug fixes, and content. Each section includes specific, actionable changes with file locations.

---

## 1. PROCEDURAL BACKGROUND MUSIC (engine.js)

The single biggest missing feature. The game has no music at all - only SFX.

### Add a `Music` system to engine.js using Web Audio API:
- **Town theme** (Ebon Vale rooms): Gentle, warm melody in C major. Use square + triangle waves at low volume. Arpeggiated chords (C-E-G pattern) with a slow tempo (~100 BPM). Conveys safety and homeliness.
- **Forest theme** (Ebon Forest rooms): Mysterious, minor key melody (A minor). Slightly faster tempo, use detuned sawtooth for eerie feel. Add subtle filter sweeps.
- **Temple theme** (Temple rooms): Dark, foreboding. Low bass drones (sine wave), sparse high notes. Reverb-like delay via feedback gain nodes. Slower tempo (~70 BPM).
- **Boss theme** (Boss fight): Intense, fast tempo (~140 BPM). Driving bass line, aggressive square wave lead. Increase intensity per phase (add layers, raise pitch, faster arpeggios).
- **Victory fanfare**: Triumphant ascending melody over major chord progression.
- **Title screen theme**: Atmospheric pad with the crystal sparkle motif.

### Implementation:
- Create `Music` object on `window.Music` alongside `GameAudio`
- Use `OscillatorNode` + `GainNode` chains scheduled via `AudioContext.currentTime`
- Pattern-based sequencer: arrays of note frequencies + durations, looped
- Crossfade between themes on room transitions (fade out old over 1s, fade in new)
- Volume control independent from SFX (default 0.15 master for music)
- Each "track" is a function that schedules ~4-8 bars of notes, then re-calls itself

---

## 2. ENHANCED VISUALS & EFFECTS (sprites.js, engine.js, game.js)

### 2a. Animated Water Tiles (sprites.js + engine.js)
- Create 2 water tile frames (`tile_water_0`, `tile_water_1`) with shifted highlight positions
- Alternate frames every 30 game frames for a flowing water effect
- Update `renderMap()` in game.js to use frame-based tile key for water tiles

### 2b. Torch Flicker Effect (game.js)
- Torch tiles emit warm light: draw a semi-transparent orange/yellow circle (radius 24px) around each torch tile position
- Pulse the radius and alpha using sine wave tied to game frame
- Adds dramatic atmosphere to temple rooms

### 2c. Shadow/Lighting System for Temple (game.js)
- Temple rooms get a darkness overlay: fill entire screen with dark semi-transparent layer
- Cut out circular "light" holes around torches, the player, and boss projectiles
- Use `globalCompositeOperation = 'destination-out'` on a separate overlay canvas
- Creates a dramatic "exploring a dark temple by torchlight" feeling

### 2d. Improved Particle Effects (engine.js)
- Add `trail()` helper: leaves a fading trail behind a moving point (for boss charges, projectiles)
- Add `ring()` helper: expand an expanding ring of particles (for phase transitions, puzzle completion)
- Add `confetti()` helper: colorful burst for victory screen
- Increase particle pool visual variety: add rotation property for non-square particles

### 2e. Weather Effects for Forest (game.js)
- Forest rooms: light falling leaf particles (green/brown, slow drift, sine-wave horizontal motion)
- Adds life and movement to the forest areas that currently feel static

### 2f. Screen Transitions (game.js)
- Replace simple fade-to-black with a more stylish **diamond wipe** (expanding diamond shape reveals new room) - fits the crystal/Eldspyre theme
- Keep fade as fallback for boss transitions

### 2g. NPC Idle Animations (sprites.js, entities.js)
- NPCs currently have static sprites. Add a subtle breathing/bobbing animation:
  - Every 40 frames, shift NPC sprite Y by 1 pixel up then back down
  - Gives the town a living, breathing feel

---

## 3. GAMEPLAY IMPROVEMENTS (entities.js, game.js)

### 3a. Pause Menu (game.js)
- P key opens pause overlay: semi-transparent black with "PAUSED" text
- Show current room name, character stats, collected items
- Resume with P or Escape
- Add 'paused' to the game state machine

### 3b. Combat Feel Improvements (entities.js)
- **Hitstop/Freeze frames**: On landing a hit, pause both attacker and target for 3 frames. This is the #1 technique for making melee combat feel impactful.
- **Enhanced knockback**: Increase enemy knockback distance from 4 to 6 px/frame, reduce timer from 6 to 4 frames (faster, punchier)
- **Screen shake tuning**: Player damage = 4 frames (up from 2), boss hit = 5 frames (up from 3), boss phase transition = 8 frames
- **Attack wind-up visual**: Brief anticipation flash (1 frame bright, then swing) so attacks have readable startup
- **Camera/shake on kill**: When an enemy dies, brief 2-frame shake + particles burst

### 3c. Improved Enemy AI (entities.js)
- **Goblin retreat behavior**: When HP < 50%, goblins have 30% chance to flee for 2 seconds before re-engaging. Makes them feel more alive.
- **Spinecleaver shield bash**: Spinecleavers occasionally (20% chance when in melee range) do a shield bash that has a wider hitbox and more knockback. Gives them a distinct feel from goblins.
- **Enemy telegraph**: Enemies flash briefly (white flash 6 frames) before attacking, giving the player a chance to dodge. Currently attacks come with no warning.
- **Stagger on consecutive hits**: If player hits an enemy 3 times rapidly, enemy enters a "staggered" state for 30 frames (stunned, no actions). Rewards aggressive play.

### 3d. Difficulty Curve (maps.js, game.js)
- **Room 3 (North Gate)**: Add 1 goblin as a tutorial enemy. Currently goes from 0 enemies to 3 with no warmup.
- **Forest Entry**: Reduce from 3 goblins to 2. Place them more spread out.
- **Forest Deep**: Keep as-is (good challenge curve with spinecleaver introduction)

### 3e. Potion/Item Improvements (game.js, entities.js)
- **Potion pickup auto-use**: Currently potions are auto-consumed. Instead, show a brief "HP RESTORED!" floating text that rises and fades.
- **Floating damage numbers**: When player or enemies take damage, show the damage number briefly floating upward from the hit point. Color-coded: red for damage taken, white for damage dealt.

### 3f. Boss Fight Enhancements (entities.js)
- **Boss telegraph**: Before charge attacks, Bargnot pauses for 20 frames with a visible "wind-up" (sprite flashes, particles gather toward her). Currently charges feel sudden and unfair.
- **Projectile visual improvement**: Boss projectiles should have a spinning rotation effect and particle trail, not just flat colored squares.
- **Phase 2: Summon minions**: At the start of Phase 2, spawn 2 goblins to create chaos. This is mentioned in the README as something the boss "may summon" but doesn't.
- **Boss defeat spectacle**: Larger explosion cascade - 3 bursts at 0/15/30 frame offsets, screen shake for 15 frames, flash white for 4 frames.

### 3g. localStorage Save System (game.js)
- Save on room transition: current room, player HP, collected items, cleared rooms, puzzle flags
- Load on page open: check for save, offer "Continue" on title screen alongside "New Game"
- Clear save on victory or explicit reset
- Minimal footprint: single JSON object in `localStorage.setItem('valisar_save', ...)`

---

## 4. UI/UX IMPROVEMENTS (game.js, dialogue.js)

### 4a. Minimap (game.js)
- Small 8-room minimap in top-right corner (only during gameplay, not during boss)
- Each room = small colored rectangle (6x5 pixels)
- Current room highlighted with blinking border
- Visited rooms shown, unvisited rooms dimmed
- Room colors: green for town, dark green for forest, gray for temple, red for boss
- Togglable with Tab key (default on)

### 4b. Area Name Banner (game.js)
- Replace simple centered text with a proper banner: dark semi-transparent rectangle behind the text, gold border top and bottom (1px lines)
- Slide in from top, hold, slide out (instead of just fading)

### 4c. Enhanced HUD (game.js)
- **Enemy counter**: Show remaining enemies as small skull icon + count in top-left below cooldown bar (only in combat rooms)
- **Key indicator**: Show "Z: Attack  X: Special" faintly at bottom of screen for first 2 combat rooms, then hide (tutorial helper)
- **Cooldown bar label**: Add tiny "SP" label before the cooldown bar

### 4d. Improved Character Select (game.js)
- Add character stat bars below the class name:
  - HP bar (visual, colored)
  - ATK bar
  - SPD bar
- Show the special ability name and brief description
- Animate the selected character sprite (cycle between frame 0 and 1)

### 4e. Dialogue System Enhancements (dialogue.js)
- **Speaker portrait**: Small 16x16 sprite of the speaker in the top-left of the dialogue box. Use existing NPC sprites, cropped to head area.
- **Text speed options**: If player holds Z during typewriter, speed up text reveal to 1 frame per character (fast-forward without skipping)
- **Dialogue box entry animation**: Slide up from bottom over 6 frames instead of appearing instantly

### 4f. Game Over Screen Enhancement (game.js)
- Show player character sprite in a "defeated" pose (lying down)
- Display stats: rooms explored, enemies defeated, time played
- Fade the game scene to grayscale behind the overlay (instead of pure black + red)

---

## 5. BUG FIXES (various files)

### 5a. Double Damage Prevention (entities.js)
- In `resolveCombat()`: Boss melee + contact damage can both trigger on the same frame. Add a flag `_hitThisFrame` to player that's checked before applying damage and reset each frame. Only one damage source should apply per frame.

### 5b. Heart Drop Conflict (entities.js + game.js)
- Enemy.die() has 30% heart drop chance. game.js checkDeadEnemies() has 40% chance. Remove the check in game.js and rely solely on the entity's `_dropItem` property. Currently drops can double-fire.

### 5c. Pause Functionality (game.js)
- P key is tracked by Input but does nothing. Implement actual pause (see 3a above).

### 5d. tile_dark Sprite Verification (sprites.js)
- Verify `tile_dark` renders as solid black. Currently defined in sprites.js line 113 - looks correct but should be tested.

---

## 6. CONTENT EXPANSION (maps.js, dialogue.js, sprites.js)

### 6a. Blacksmith Shop (game.js, dialogue.js)
- When interacting with Braxon, open a simple shop overlay:
  - "Sharpen Blade" - costs 3 enemy kills (tracked as currency). Increases attack damage by 1 for the rest of the run.
  - "Reinforce Armor" - costs 5 kills. Adds 2 max HP.
- This gives the market area actual gameplay purpose.
- Track "goblin teeth" as a kill-based currency (shown in HUD when in market)

### 6b. Brother Soren's Blessing (game.js, dialogue.js)
- Soren can give a one-time blessing: full heal + temporary speed boost for 10 seconds
- Triggered by talking to him after visiting the forest (adds a reason to backtrack)

### 6c. Expanded NPC Dialogue (dialogue.js)
- NPCs have different dialogue based on game progress:
  - Before forest: current dialogue (warning about goblins)
  - After clearing forest: new dialogue acknowledging your progress
  - After boss: celebratory dialogue
- Check `Game.clearedRooms` and `Game.flags.bossDefeated` to select dialogue variant

### 6d. Sign Interaction (game.js)
- The sign tile in North Gate (Sg) and Town Square (Sg) should be interactable
- When player presses Z near a sign tile, show the `sign_warning` dialogue
- Currently signs are just decorative solid tiles

### 6e. Environmental Details (maps.js)
- Add more flowers and decorative tiles to break up monotony
- Forest rooms: vary tree placement slightly for visual interest
- Temple: add more torch placement for better lighting atmosphere

---

## 7. AUDIO IMPROVEMENTS (engine.js)

### 7a. Enhanced Sound Effects
- **Footstep sounds**: Subtle, quiet footstep blip every 10 frames while player is moving. Different pitch for grass vs stone vs wood tiles.
- **Ambient sounds**: Forest rooms get occasional bird chirp (random interval 3-8 seconds). Temple rooms get occasional drip sound.
- **Boss phase transition sound**: Deeper, more dramatic explosion + ascending tone for phase transitions.
- **Puzzle solve fanfare**: Ascending arpeggio (like Zelda puzzle solve) when placing all 3 relics.
- **Door/transition sound**: Whoosh sound when changing rooms.

---

## 8. POLISH & FEEL

### 8a. Title Screen Improvements (game.js)
- Animate the Eldspyre crystal: slow rotation effect (redraw diamond at slightly different angles each frame)
- Add subtitle text fade-in (appear letter by letter after VALISAR is shown)
- Background: very slow vertical parallax star field (tiny white dots drifting upward)

### 8b. Victory Screen Improvements (game.js)
- Show the chosen character's sprite walking into the sunset (simple animation: sprite walking right, golden gradient background)
- Fireworks particle effects (bursts of colored particles at random screen positions)
- Music: victory fanfare transitions into a gentle ending theme

### 8c. Input Improvements (engine.js)
- **Gamepad support**: Add basic gamepad API support (D-pad for movement, A button for Z, B for X, Start for Enter). Many players expect controller support for retro games.
- **Input buffering**: Buffer the last pressed action for 6 frames. If player presses Z slightly before attack cooldown ends, queue the attack. Makes combat feel more responsive.

---

## Implementation Priority Order

1. **Background Music** (biggest impact on atmosphere)
2. **Bug Fixes** (double damage, heart drops, pause)
3. **Combat Feel** (hitstop, knockback tuning, screen shake)
4. **Enemy AI Improvements** (telegraphs, flee behavior)
5. **Minimap & HUD** (navigation & information)
6. **Temple Lighting** (torch glow, darkness overlay)
7. **Save System** (player retention)
8. **Floating Damage Numbers** (combat feedback)
9. **Boss Fight Enhancements** (telegraphs, minion summons)
10. **Particle & Weather Effects** (forest leaves, improved trails)
11. **Character Select Improvements** (stat bars, animations)
12. **Dialogue Portraits & Animations** (NPC character)
13. **Blacksmith Shop** (gameplay depth)
14. **Expanded NPC Dialogue** (world feeling alive)
15. **Title/Victory Screen Polish** (first/last impressions)
16. **Sound Effects** (footsteps, ambient)
17. **Gamepad Support** (accessibility)
18. **Diamond Wipe Transitions** (visual flair)

---

## Files Modified Per Feature

| Feature | engine.js | sprites.js | maps.js | dialogue.js | entities.js | game.js |
|---------|-----------|------------|---------|-------------|-------------|---------|
| Music | X | | | | | X |
| Water Animation | | X | | | | X |
| Torch Glow | | | | | | X |
| Temple Lighting | X | | | | | X |
| Particles | X | | | | | |
| Forest Weather | | | | | | X |
| Transitions | | | | | | X |
| NPC Idle | | | | | X | |
| Pause | | | | | | X |
| Combat Feel | | | | | X | X |
| Enemy AI | | | | | X | |
| Difficulty | | | X | | | X |
| Floating Numbers | | | | | | X |
| Boss Enhancements | | | | | X | X |
| Save System | | | | | | X |
| Minimap | | | | | | X |
| HUD | | | | | | X |
| Char Select | | | | | | X |
| Dialogue Polish | | | | X | | |
| Bug Fixes | | | | | X | X |
| Shop | | | | X | | X |
| NPC Dialogue | | | | X | | X |
| Signs | | | | | | X |
| Sound FX | X | | | | | |
| Title/Victory | | | | | | X |
| Gamepad | X | | | | | |
