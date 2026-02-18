# Valisar: Shadows of the Eldspyre - Auteur Improvement Plan

## Philosophy

The best indie games feel *authored* — every pixel, every line of dialogue, every sound effect serves a unified vision. Think Undertale's writing that makes you laugh then breaks your heart. Hyper Light Drifter's atmosphere that tells stories without words. Celeste's screen shake and particles that make every jump feel alive. A Link to the Past's dungeons that teach through design.

This plan transforms Valisar from a competent retro game into something with *soul*.

**Core Principles:**
- Every NPC is a person, not an exposition machine
- Combat should feel crunchy — hits land with weight, dodges feel earned
- The world tells its story through environment, not just text
- UI is invisible when it should be, beautiful when it's seen
- Silence and restraint are as powerful as spectacle

---

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

## Improvement Pass 3: "Game Feel & Atmosphere"

*The Celeste / Hyper Light Drifter pass. Make every interaction feel physical.*

### 3A. Bug Fixes (Do First)

#### Heart Drop Conflict
- Remove duplicate 40% roll in `game.js` `checkDeadEnemies()`, keep 30% in `Enemy.die()`
- **Files**: entities.js, game.js

#### Boss Double Damage
- Add per-frame hit flag on player to prevent melee + contact damage both triggering on same frame
- **Files**: entities.js

### 3B. Combat Juice

#### Floating Damage Numbers
- Spawn floating number at hit point, rises 20px and fades over 40 frames
- Color-coded: red for player taking damage, white for enemy damage, green for healing
- Number pool of 8 max active. Slight random x-offset so stacked hits don't overlap
- Font scale 1 for normal hits, scale 2 for crits/boss hits
- **Files**: game.js

#### Enhanced Hit Feedback
- **Hitstop variation**: Light hits = 3 frames, heavy hits = 6 frames, boss hits = 8 frames (currently flat)
- **Directional knockback**: Enemies knock away FROM player's facing direction, not just away from center
- **Hit flash**: Entity goes full white for 2 frames on hit (draw sprite, then overlay white rect with `globalCompositeOperation: 'source-atop'`)
- **Enemy hurt animation**: Enemies visually recoil — compress sprite 1px vertically for 4 frames on hit
- **Screen shake variation**: Sword hit = 2px 4-frame shake. Boss charge = 4px 8-frame shake. Boss death = 6px 15-frame shake. Currently uses single shake intensity
- **Files**: entities.js, game.js, engine.js

#### Attack Telegraphs
- Enemies show a 1px red line in their attack direction for 12 frames before swinging
- Spinecleavers raise their weapon visibly (sprite swap) for 20 frames before shield bash
- Boss charge attack: floor tiles in the charge path flash red for 15 frames
- Goblin archers: arrow drawn notched and aimed for 18 frames before firing
- **Files**: entities.js, sprites.js

#### Player Attack Feel
- **Sword slash arc**: Draw a 3-frame white arc in the attack direction (quarter-circle, 12px radius)
- **Attack lunge**: Player moves 2px forward during attack frames then snaps back
- **Special ability VFX**: Daxon shield = animated rotating hexagonal barrier with blue glow. Luigi Brog = visible familiar sprite with glowing trail. Lirielle heal = expanding green ring with leaf particles rising
- **Files**: entities.js, game.js, sprites.js

### 3C. Atmosphere & Environment

#### Temple Darkness & Torchlight
- Temple rooms get a darkness overlay (full-screen dark layer at 85% opacity)
- Cut circular light holes around: torches (pulsing radius 24-32px, sin wave), player (constant 40px radius), projectiles (16px radius), boss aura (48px in phase 3)
- Uses offscreen canvas + `globalCompositeOperation = 'destination-out'` for the light cutouts
- Light flickers: torch radius jitters ±2px randomly each frame for organic feel
- Player light radius shrinks to 28px at low health (visual tension)
- **Files**: game.js

#### Forest Falling Leaves
- 10 leaf particles in forest rooms, drifting with sine-wave horizontal motion
- Each leaf: random green/orange/brown color, 2x3px, rotates slowly
- Leaves drift from random x at top, reset when below screen
- Wind direction shifts every 120 frames (gentle left-right sway)
- **Files**: game.js

#### Animated Water Tiles
- 2 animation frames for water tiles, swap every 20 game frames
- Frame 1: current water. Frame 2: shifted highlight pattern
- Water edge tiles get subtle white foam pixels where water meets land
- **Files**: sprites.js, game.js

#### Environmental Particles
- Town rooms: occasional dust motes (tiny white pixels drifting slowly upward, 4-5 active)
- Temple rooms: ember particles near torches (orange dots rising, 2 per torch)
- Boss room: purple energy wisps orbiting pillars (accelerate during phase 3)
- Forest: fireflies in deep forest (tiny yellow dots with sin-wave alpha pulse, 6 active)
- **Files**: game.js

### 3D. Audio Polish

#### Contextual SFX
- Footstep sounds that change by terrain: stone tap in temple, soft thud in forest, wood creak in buildings
- Footsteps play every 12 frames while moving (not every frame — rhythmic)
- Ambient background loops: forest has layered cricket/bird chirps, temple has distant dripping water echo, town has faint crowd murmur
- Room transition whoosh (quick filtered noise sweep)
- Puzzle solve: ascending 4-note fanfare sting (C-E-G-C, 0.5s total)
- **Files**: engine.js, game.js

#### Dynamic Music
- Boss Phase 2: tempo increases 10 BPM, add a new aggressive counter-melody track
- Boss Phase 3: strip to bass + percussion only for 4 bars, then ALL tracks return fortissimo
- Low health: music dips in volume, add a low heartbeat pulse (60 BPM sine throb)
- **Files**: music.js, game.js

---

## Improvement Pass 4: "Every NPC Is a Person"

*The Undertale pass. Dialogue should make you laugh, make you care, and occasionally break your heart.*

### 4A. Writing Principles

- **No exposition dumps.** NPCs share information through personality, not briefings. Helena doesn't say "goblins grow bolder each day" — she says something that reveals who *she* is while mentioning goblins.
- **Character > function.** Soren doesn't exist to heal you. He's a refugee tabaxi monk grappling with faith in a world that's failing. He also heals you.
- **Subtext.** Svana doesn't just say "find Rorik." Her dialogue reveals their relationship — maybe she's angry at him for being captured, maybe she blames herself.
- **Humor lives next to gravity.** Fawks cracks jokes. Elira is deadpan. Luigi mutters sarcastic asides. This makes the serious moments land harder.
- **The boss is a person too.** Bargnot isn't evil for evil's sake. She's desperate. The Ascendant Shadow promised her something she can't get any other way.

### 4B. Rewritten NPC Dialogue

#### Fawks (Tavern Owner — warm, gossipy, nervous)
```
fawks_greeting:
  "Welcome to The Dancing Pig! ...Don't mind the name. Long story involving my ex-husband and an actual pig."
  "Listen — those goblins? They took Rorik Flamebeard right out of the market. Broad daylight. Nobody did a thing."
  "I just pour drinks. But Braxon's forge is south of here, and Brother Soren's chapel. They can actually help."

fawks_return:
  "Back already? You look like you need a drink more than I do."
  "Helena's putting on a brave face but I can tell — she hasn't slept in days."
```

#### Helena (Mayor — dignified, exhausted, hiding fear)
```
helena_greeting:
  "You must be the ones Braxon sent word about. Thank the spirits."
  "I won't dress this up. We're losing. The goblins took Rorik, they've cut our supply lines, and my guard captain is running on fury and stubbornness."
  "Head south to the market. Braxon will outfit you. Brother Soren can bless your journey. And then... north. Into the forest."
  "I wish I could send soldiers with you. I can only send my hope."

helena_return:
  "Still standing. That's more than I expected. ...That came out wrong. I believe in you. I do."
```

#### Elira Voss (Guard Captain — blunt, military, secretly worried)
```
elira_greeting:
  "Captain Voss. I command what's left of the town guard, which is six people and a dog."
  "We caught some goblin scouts. They talk tough until you separate them. Their queen, Bargnot — she's the real threat."
  "I don't trust spirits, prophecies, or chosen ones. But I trust sharp steel. Don't let me down."

elira_return:
  "My scouts report archers deeper in the forest. They shoot first, miss often, but often isn't always."
```

#### Braxon (Blacksmith — gruff, fatherly, hides his worry in work)
```
braxon_greeting (generic):
  "Name's Braxon. I make weapons. Lately I've been making a lot of weapons."
  "If you're heading to that temple, you'll want something better than whatever you're carrying. Take what you need from the forge."
  "And if you see my boy Daxon out there... tell him his old man still worries."

braxon_greeting_daxon:
  "...Daxon? DAXON! Boy, get over here!"
  "Let me look at you. You've gotten thinner. Are you eating? You're not eating."
  "Your mother would kill me if she knew I was sending you into a goblin-infested temple. Good thing she's not here."
  "Take whatever you need from the forge. And Daxon — come back. That's not a request."

braxon_return:
  "Still here? Good. I worry less when you're within shouting distance."
```

#### Brother Soren (Tabaxi Monk — serene, dry wit, carries old grief)
```
soren_greeting:
  "Ah. Adventurers. I can smell the determination on you. ...And the road. Mostly the road."
  "I am Brother Soren. I tend to the refugees here — what remains of the mountain dwarves after the goblins came."
  "The spirits have been restless since Bargnot entered the temple. I can feel it in my whiskers. That sounds absurd but it's true."
  "Come. Let me bless you before you go. It's the least the spirits can offer."

soren_return:
  "You've returned. The spirits told me you would. ...Actually I just heard the door. Sit. Rest. Let me tend your wounds."
```

#### Svana Ironveil (Dwarf Refugee — fierce, heartbroken, won't show weakness)
```
svana_greeting:
  "What are you looking at? ...Sorry. I'm Svana. I haven't slept."
  "They took my cousin Rorik. Dragged him to their temple for some ritual. He's strong but he's not... he's not invincible."
  "If you find him in there — when you find him — tell him Svana says he's an idiot for getting caught."
  "...And tell him to come home."

svana_return:
  "No news? ...No. Don't answer that. Just keep going. He's alive. I know he is."
```

#### Que'Rubra (Ancient Forest Spirit — cryptic, weary, vast)
```
querubra_greeting:
  "... Be still. I feel your footsteps like splinters in old wood."
  "I am Que'Rubra. I have watched this forest for longer than your kingdoms have had names."
  "The goblin queen desecrates Nitriti's temple. She means to bind the spirit Smaldge — a thing of hunger and shadow. She does not understand what she summons."
  "The temple demands three offerings: the Crown of Authority, the Cape of Presence, the Scepter of Command. Place them on the statue in the antechamber."
  "I cannot help you further. The old agreements bind me to this grove. But I can tell you this: Bargnot is afraid. That makes her dangerous."

querubra_return:
  "The forest knows your progress. You have collected [X] of the three relics."
  "Hurry. I can feel Nitriti's temple crying out. The walls themselves remember what they were."
```

### 4C. Rewritten Boss Dialogue

#### Queen Bargnot — Make Her a Person
```
boss_intro:
  "Ah. Helena's little rescue party. How... predictable."
  "Do you know why I took this temple? Why I need the dwarf?"
  "My people are dying. The mountain clans push us out. Your towns burn our warrens. And Smaldge — Smaldge promised us a place in the world."
  "So yes, the dwarf bleeds tonight. And yes, the Shadow rises. Because YOU left us no other choice."
  "Enough talk. DEFEND YOURSELVES!"

boss_phase2:
  "You're stronger than I expected. Good. I was getting bored."
  "But strength won't save you. SMALDGE! GIVE ME WHAT YOU PROMISED!"

boss_phase3:
  "I can feel it... oh gods, I can feel it... this is too much... NO. I WILL NOT STOP."
  "THE SHADOW IS MINE TO COMMAND! MINE!"

boss_defeat:
  "The shadow... it's pulling me apart... I only wanted... my people to be safe..."
  "Was I wrong...?"
```

### 4D. Context-Sensitive Dialogue

- Track game progress flags: `visitedForest`, `clearedTempleEntrance`, `puzzleSolved`, `bossDefeated`
- NPCs get 3 dialogue tiers: pre-forest, mid-dungeon, post-boss
- **Post-boss dialogue** for every NPC (reward the player for returning to town):
  - Fawks: "Drinks are on the house tonight! ...Don't tell Helena I said that."
  - Helena: "You did it. You actually did it. I'm going to sleep for the first time in a month."
  - Elira: "Heard you took down the goblin queen. ...Okay. Maybe I trust chosen ones a little."
  - Svana (if Rorik rescued): "RORIK! You absolute fool, I thought you were — don't you EVER — come here."
- **Files**: dialogue.js, game.js

### 4E. Environmental Text & World Details

#### Richer Sign Text
```
sign_warning:
  "EBON FOREST — NORTH. 'Goblins sighted beyond this point. Travel in groups. By order of Captain Voss.' Someone has scratched underneath: 'GOOD LUCK'"

sign_market:
  "EBON VALE MARKET — Braxon's Forge. Chapel of the Wandering Spirit. 'All are welcome at The Dancing Pig (children must be accompanied by an adult).'"

sign_temple:
  "The stone is ancient. Most of the carving has been clawed away. You can make out: '...Nitriti, She Who Guards... between worlds... speak only... truth...'"
```

#### Examine Objects (new interaction type)
- Interacting with non-NPC objects gives brief atmospheric flavor text
- Bookshelves: "Dusty tomes. Most are water-damaged. One is titled 'Goblin Cuisine: A Cautionary Tale.'"
- Statues: "The statue's face has been clawed away. Only the eyes remain, watching."
- Torches: "The flame burns without fuel. Old magic, still holding on."
- Altar (boss room, pre-fight): "Rorik is bound here, unconscious. Dark runes pulse on the stone beneath him."
- **Files**: dialogue.js, game.js, maps.js (add `examineObjects` data keyed by room + tile position)

### 4F. Intro Cutscene Rewrite

Replace generic narrator text with something that earns the player's attention:
```
intro_cutscene:
  [scene: town] "Ebon Vale was never a grand place. Too small for kings to notice, too stubborn to die. For a while, that was enough."
  [scene: forest] "Then the goblins came. Not raiders — refugees. Desperate, starving, and following a queen who promised them the world."
  [scene: temple] "Bargnot found the Temple of Nitriti. Found the old rituals. Found a spirit called Smaldge who whispered terrible, beautiful lies."
  [scene: heroes] "And so three travelers arrived at the edge of everything going wrong, carrying nothing but sharp steel, old magic, and the kind of stubbornness that starts revolutions."
```

---

## Improvement Pass 5: "Pixel Craft"

*The Hyper Light Drifter pass. Every sprite should feel designed, not generated.*

### 5A. Animation Expansion

#### 4-Frame Walk Cycles (Currently 2)
- All player characters: 4 frames per direction (contact, passing, contact, passing with opposite leg)
- Interpolate between poses — frame 1: left foot forward, frame 2: upright center, frame 3: right foot forward, frame 4: upright center (mirrored)
- Each frame held for 8 game frames at normal speed (full cycle = 32 frames = ~0.53 seconds)
- NPCs get 2-frame idle breathing animation (slight 1px vertical shift every 60 frames)
- **Files**: sprites.js, entities.js

#### Attack Animations
- Player attack: 3-frame sequence — wind-up (arm back, 4 frames), swing (arm extended + weapon arc, 4 frames), recovery (return to idle, 4 frames)
- Currently attack is 1 frame swap. The new 12-frame sequence gives weight and readability
- Goblin attack: 2-frame — raise weapon (6 frames held), slam down (4 frames)
- Spinecleaver: 3-frame — shield forward (8 frames telegraph), bash (4 frames), stagger back (4 frames)
- Archer: 2-frame — draw bow (12 frames held), release (snap to idle)
- **Files**: sprites.js, entities.js

#### Death Animations
- Enemies: 4-frame death — hit stagger (2 frames), kneel/collapse (4 frames), fade to transparent over 12 frames, then gone
- During fade: spawn 4-6 small particles in enemy's palette color (dismantling effect)
- Player death: slump animation (8 frames), held for 30 frames, then game over transition
- Boss death: existing 90-frame spectacle is good — add a frame where Bargnot reaches out toward the player before dissolving
- **Files**: sprites.js, entities.js, game.js

#### Idle Animations
- Player: breathing (1px chest rise every 90 frames) + occasional blink (close eyes 4 frames every 200-300 frames, randomized)
- NPCs: unique idle per character — Fawks wipes bar counter, Helena looks toward forest, Elira crosses arms, Braxon hammers anvil, Soren meditates (tail sway), Svana paces
- Que'Rubra: slow branch-sway animation (leaves shift 1px left/right on 120-frame cycle)
- **Files**: sprites.js, entities.js, game.js

### 5B. Sprite Art Improvements

#### Character Portraits (New)
- 32x32 pixel art portrait for each speaking character, displayed in dialogue box
- Portraits show character from chest up with expression
- 2 expression variants per character: neutral and emotional (Braxon: neutral/worried, Bargnot: arrogant/desperate, Svana: stoic/pleading)
- Portrait slot: left side of dialogue box, 36x36 area with 2px border
- **Files**: sprites.js, dialogue.js

#### Boss Phase Visual Distinction
- Phase 1 (Queen): Crown upright, red robes flowing, scepter held forward. Confident stance
- Phase 2 (Rage): Crown tilts, robes tattered, veins of purple energy visible on skin. Hunched forward, aggressive
- Phase 3 (Shadow): Crown gone, body partially transparent with shadow tendrils extending from back. Floating 2px off ground. Eyes are bright white pinpoints
- These should be distinct sprites, not recolors — silhouette should change per phase
- **Files**: sprites.js

#### Item Sprites
- Crown: golden circlet with 3 points, small purple gem in center, 1px sparkle animation (pixel toggles white every 30 frames)
- Cape: flowing dark cloth shape with purple trim, subtle wave animation (bottom edge shifts 1px)
- Scepter: dark rod with orb at top, orb pulses between purple/dark
- Heart drops: redo as a proper chunky pixel heart with highlight, 2-frame pulse (scale 8x8 → 9x9 every 20 frames)
- Potions: glass bottle shape with colored liquid, liquid line wobbles 1px
- **Files**: sprites.js

#### Tile Art Polish
- Grass tiles: 3 variants (plain, tall grass tuft, flowers) randomly assigned at room load for visual variety
- Stone floor tiles: 2 variants (clean, cracked) — cracked tiles appear more frequently deeper in the temple
- Tree canopy tiles: add 1px leaf detail variation between trees so they don't look copy-pasted
- Water tiles: reflective highlight pixels that shift position each animation frame
- Torch tiles: flame shape redraws each frame (3 flame variants cycling) instead of static
- **Files**: sprites.js, maps.js

### 5C. Visual Effects Layer

#### Boss Projectile Polish
- Projectiles spin (rotate sprite 90° each 8 frames)
- Particle trail: spawn 1 small particle every 4 frames behind projectile, fades over 16 frames
- Phase 3 projectiles: purple glow halo (draw a slightly larger, lower-opacity purple circle behind the projectile)
- On-hit burst: 8 particles explode outward when projectile contacts player or wall
- **Files**: entities.js, game.js

#### Screen Flash Events
- Boss phase transition: full white flash for 3 frames, fade over 8 frames
- Puzzle solved: golden flash (warm overlay) for 4 frames
- Player death: red flash for 2 frames
- Boss death: 3 alternating white/purple flashes over 15 frames
- Implemented as a screen-wide rectangle with varying alpha drawn after everything else
- **Files**: game.js

#### Parallax Backgrounds (Subtle)
- Forest rooms: distant tree line layer scrolls at 0.3x player movement speed behind main tile layer
- Temple rooms: distant wall texture with cracks/runes scrolls at 0.2x
- Boss room: swirling purple void visible behind pillars, rotates slowly independent of player
- Implementation: pre-render a 512px-wide background strip, draw it offset by `(playerX * parallaxFactor) % stripWidth`
- **Files**: game.js, sprites.js

---

## Improvement Pass 6: "Interface as Art"

*The Papers, Please pass. UI should have personality. Menus should feel like part of the world.*

### 6A. Title Screen Overhaul

#### Animated Title Scene
- Background: slow pan across a pixel art landscape (Ebon Vale → forest edge → temple silhouette in distance)
- Pan is a 512px-wide scene that scrolls left at 0.25 px/frame, loops seamlessly
- Foreground: title text "VALISAR" in large custom pixel letters (not bitmap font — hand-drawn title sprite, ~80px wide) with purple glow pulse
- Subtitle "Shadows of the Eldspyre" in standard font below, fades in 30 frames after title
- Falling particle effect: tiny embers/stars drift downward across the scene
- Menu options ("New Game" / "Continue" / "Controls") fade in sequentially with 10-frame delays
- Selected option: gentle left-right bounce (2px) + brighter color, not just color swap
- **Files**: game.js, sprites.js

#### Title Screen Music Sync
- Title theme's hero motif (the E-G-C rising call) syncs with the title text appearing
- A brief 1-second silence before music begins, letting the scene establish itself
- **Files**: game.js, music.js

### 6B. Character Select Redesign

#### Full Character Showcase
- Each character displayed at 2x scale (32x48) in the center, with their walk animation playing
- Character stands on a small "stage" — stone for Daxon, mystical circle for Luigi, grass patch for Lirielle
- Name, class, and description text positioned cleanly to the right
- Stats shown as visual bars, not just numbers: HP bar (red), Speed bar (blue), with pip markers
- Special ability has its own box with icon + brief description
- **Left/Right arrows**: smooth slide transition between characters (current slides out left, new slides in from right, 12 frames)
- **Z to confirm**: character does a brief action pose (Daxon raises sword, Luigi summons energy, Lirielle raises hand with leaf particles) held for 20 frames before transitioning
- **Files**: game.js, sprites.js

### 6C. Dialogue Box Redesign

#### Pixel Art Dialogue Frame
- Replace semi-transparent rectangle with a proper pixel art border — double-line frame with corner ornaments
- Border is a 9-slice tileable pattern (corners + edges) so it scales to any box size
- Inner background: dark blue-black with very subtle noise texture (random dark pixels for visual interest)
- Speaker name in its own small tab above the main box (extends 2px above the top border)
- Name tab color matches the speaker's color (gold for Fawks, green for Helena, etc.)
- **Files**: dialogue.js, sprites.js

#### Character Portraits in Dialogue
- 32x32 portrait displayed in the left side of the dialogue box when an NPC speaks
- Portrait has its own mini-frame (2px border matching speaker color)
- Portrait swaps expression based on dialogue tone (set via `emotion` property on dialogue lines)
- No portrait for signs/inscriptions/narrator — box adjusts text position to fill the space
- **Files**: dialogue.js, sprites.js

#### Text Presentation
- Typewriter speed slightly slower for dramatic lines (configurable `speed` property on dialogue entries, default 2 chars/frame, slow = 1 char/frame)
- Punctuation pauses: period/exclamation/question mark holds for 8 extra frames before next char. Comma holds 4 frames. Ellipsis holds 12 frames
- Text that gets **loud** (boss yelling) renders in a larger font scale and shakes 1px
- Narrator text renders in italic style (slightly different pixel font or color tint — pale blue)
- Advance indicator: small animated down-arrow bouncing at bottom-right of box when page is complete
- **Files**: dialogue.js, engine.js

### 6D. HUD Redesign

#### Health Display
- Hearts positioned top-left with 1px spacing
- Current: simple heart shapes. New: hand-drawn pixel hearts with highlight (bright red spot at top-left of each heart)
- Damage: heart that loses HP does a quick shake (4 frames) and flash before emptying
- Healing: heart fills with a green-to-red wipe animation (bottom to top, 8 frames)
- Low HP (1-2 half-hearts): remaining hearts pulse red/dark red on a 30-frame cycle
- **Files**: game.js, sprites.js

#### Item Display
- Collected puzzle items (Crown/Cape/Scepter) shown as small 8x8 icons in top-right corner
- Uncollected items show as dark silhouettes (you know there's something to find, but not what)
- When an item is collected: icon does a sparkle animation (white pixel burst, 12 frames)
- **Files**: game.js, sprites.js

#### Room Name Display
- On room enter: room name appears center-top in slightly larger text with a fade-in/fade-out over 90 frames
- Add a thin decorative line (—— Room Name ——) style with small pixel ornaments at the ends
- **Files**: game.js

#### Minimap Improvements
- Current room highlighted with a pulsing border
- Rooms with NPCs get a tiny dot (blue). Rooms cleared of enemies get a checkmark
- Boss room shows a skull icon. Puzzle room shows a key icon
- Unexplored rooms (never entered) show as dark/dim outlines
- **Files**: game.js

### 6E. Menu & Pause Screen

#### Pause Menu Overhaul
- Same pixel-art bordered frame as dialogue box (consistent visual language)
- Options: Resume, Controls, Bestiary, Save & Quit
- Each option has a small 8x8 icon to the left (play arrow, gamepad, book, door)
- Selected option indicated by animated arrow + highlight bar
- Background: game world visible but desaturated and darkened (draw game frame, overlay dark tint)
- **Files**: game.js, sprites.js

#### Bestiary / Journal (New Feature)
- Accessible from pause menu
- Tabs: Enemies, Characters, Lore
- **Enemies tab**: shows encountered enemy types with sprite, name, and 1-line flavor text. Unencountered enemies show as "???" silhouettes
- **Characters tab**: shows met NPCs with portrait and 1-line description that updates based on story progress
- **Lore tab**: collectible lore entries found by examining objects in the world (inscriptions, books, etc.)
- Entries unlock as the player discovers them — rewards exploration and re-reading dialogue
- **Files**: game.js, sprites.js, dialogue.js (add lore entry data)

### 6F. Game Over Screen

- Current: likely a simple "Game Over" text. New: cinematic sequence
- Screen slowly desaturates over 20 frames as player falls
- "Game Over" text fades in with the player character's silhouette kneeling
- Below: "The darkness claims another..." in small italic text
- Options appear after 40 frames: "Continue" (respawn at last safe room) / "Quit to Title"
- Selected option bounces gently like title screen
- A quiet, 3-note descending melody plays (not the death SFX — a separate mournful sting)
- **Files**: game.js, music.js

---

## Improvement Pass 7: "The Dungeon Breathes"

*The Link to the Past pass. Dungeons teach, escalate, and surprise. The boss fight is a story told through mechanics.*

### 7A. Environmental Dungeon Design

#### Temple Visual Progression
- **Temple Entrance**: Clean stone, intact torches, carpet. This was a holy place. Faint remnants of beauty
- **Temple Puzzle Room**: Cracked stone tiles, goblin graffiti scratched on walls (new tile variant), scattered bones. Occupation damage visible
- **Boss Room**: Obsidian-dark floor, pulsing purple rune tiles, Rorik's altar glowing with dark energy. The corruption is total
- Implement by adding tile variant IDs per room — same base tile types but different palettes per temple room
- **Files**: sprites.js, maps.js

#### Destructible Objects
- Crates and barrels in temple rooms — 2 hits to destroy, drop nothing or rarely a heart
- Breaking them feels good (wood particle burst, satisfying crack SFX) even without reward
- 2-3 crates per temple room, placed to partially block pathways (route complexity without hard walls)
- Implementation: new entity type `Destructible` with HP, sprite, and `onDestroy()` callback
- **Files**: entities.js, sprites.js, maps.js

#### Environmental Hazards
- **Spike traps**: Retract/emerge on 60-frame cycle (40 up, 20 down). Deal 1 damage on contact. Visual tell: spikes glint 8 frames before emerging
- **Crumbling floor**: Tiles crack when stepped on (1 second), then collapse into void (1 damage if standing on them). Respawn after 3 seconds. Only in temple_puzzle room
- **Poison mushrooms**: In deep forest room, release a green cloud if player walks within 8px. Cloud persists 90 frames, deals 1 damage on contact. Destroyed by any attack
- Spike tiles already exist in TileProps — wire up the damage logic and add the visual cycling
- **Files**: entities.js, maps.js, game.js, sprites.js

### 7B. Puzzle Room Enhancement

#### Visual Puzzle Language
- Each alcove in temple_puzzle has a distinct color glow matching its relic: gold for Crown, purple for Cape, silver for Scepter
- Alcove glow is visible even before clearing enemies — tells the player what's in each one
- When a relic is collected, its alcove glow extinguishes. The central statue gains that color in one of three slots
- Statue has 3 empty gem slots that visually fill as relics are placed — clear progress indicator
- **Files**: sprites.js, maps.js, game.js

#### Puzzle Feedback
- Each relic pickup: brief slow-motion effect (game speed drops to 0.5x for 30 frames) + golden screen tint
- Relic count shown in HUD corner (see 6D)
- Placing final relic: camera holds on statue for 60 frames, dramatic music sting, light erupts from statue, then boulders roll away
- **Files**: game.js, music.js

### 7C. Boss Fight Overhaul — Queen Bargnot

#### Phase 1: "The Queen" (100% - 50% HP)
- **Attack pattern A — Scepter Swing**: Bargnot walks toward player, winds up (12-frame telegraph with scepter raised), wide melee swing. Dodge window is generous. 1 damage
- **Attack pattern B — Dark Orb**: Stops, aims at player for 8 frames (purple line telegraph), fires single projectile. Moderate speed. 1 damage
- **Movement**: Walks at player speed. Pauses between attacks for 40-60 frames (randomized)
- **Arena**: 4 pillars for cover. Bargnot's projectiles break on pillars (pillars don't take damage, projectiles do)
- **Personality**: Bargnot taunts between attacks. Every 3rd attack cycle, she pauses to monologue for 2 seconds (exploitable opening — teaches player that patience is rewarded)

#### Phase 2: "The Fury" (50% - 25% HP) — Triggered by dialogue
- **New attack — Charge**: 20-frame telegraph (Bargnot crouches, floor tiles in charge lane flash red), then dashes across the room. 2 damage. Exhaustion window: stands dizzy for 40 frames after charge (head bobble animation). This is the main DPS window
- **New attack — Minion Summon**: Once at phase start, Bargnot screams and 2 half-HP goblins spawn from room edges. She doesn't summon again. Goblins are a distraction, not a real threat
- **Dark Orb upgrade**: Now fires 2 orbs in a slight spread
- **Movement**: 1.3x speed. More aggressive, shorter pauses between attacks (30-40 frames)
- **Music**: tempo +10 BPM, aggressive counter-melody added

#### Phase 3: "The Shadow" (below 25% HP) — Triggered by dialogue
- **Bargnot transforms**: Sprite swaps to shadow form (semi-transparent, floating, tendrils). She teleports between pillar positions every 4 seconds instead of walking
- **New attack — Shadow Barrage**: 3 orbs fired in fan spread. Orbs are slower but larger
- **New attack — Void Zone**: Teleports to center, marks a 3x3 tile area that pulses dark for 30 frames, then erupts (2 damage to anyone standing on it). 2 void zones per cycle
- **Charge removed**: replaced by teleport aggression. She's no longer physical — she's losing control
- **Music**: breaks down to bass + percussion for 4 bars, then FULL return with all tracks fortissimo
- **Visual**: purple energy wisps accelerate around room. Screen edges get subtle purple vignette. Room gets darker (torch light radius shrinks)

#### Defeat Sequence Enhancement
- Existing 5-phase 90-frame spectacle is the foundation. Add:
- Frame 0-15: Bargnot staggers, reaches hand toward player (new sprite)
- Frame 15-30: Shadow tendrils retract into her body, she shrinks back to normal form
- Frame 30-60: Flickering, white flashes (existing)
- Frame 60-75: Bargnot kneels, delivers final line: "Was I wrong...?"
- Frame 75-90: Dissolves into purple particles that drift upward and extinguish
- Room brightens dramatically. Rorik's altar runes go dark. Silence for 2 seconds before epilogue music
- **Files**: entities.js, game.js, sprites.js, music.js

### 7D. Enemy AI Improvements

#### Goblin Tactical Behavior
- Goblins in groups coordinate: if 2+ goblins are aggro, they try to flank (one approaches from left, one from right)
- Implementation: goblins share a target and check ally positions. If an ally is within 30px on one side of the player, approach from the opposite side
- Goblins telegraph more clearly: hop in place for 6 frames before lunging to attack
- When a goblin's ally dies, surviving goblins briefly flee (30 frames of running away) then re-aggro. Moment of fear
- **Files**: entities.js

#### Archer Positioning AI
- Archers actively maintain distance: if player gets within 48px, archer dodges backward or sideways
- Archers prefer positions near walls/obstacles (scan adjacent tiles for walls, move toward them)
- When low HP, archer fires one panicked rapid-fire burst (3 arrows in 12 frames, less accurate) then tries to flee off-screen
- **Files**: entities.js

#### Spinecleaver as Mini-Boss
- Spinecleavers get a brief HP bar displayed above them (like a mini boss bar)
- Shield bash now deflects player projectiles (Luigi's Brog bounces back if it hits shield-front)
- After shield bash, shield drops for 20 frames (visible: arm drops to side). Back attacks during this window deal 2x damage
- **Files**: entities.js, game.js

### 7E. Difficulty & Accessibility

#### Adaptive Difficulty (Subtle)
- If player dies 3+ times to the same room: enemy damage reduced by 1, enemy speed reduced 15%
- No notification — just a quiet mercy. The game wants you to see the ending
- If player has never died: enemies get +10% speed after temple_entrance (reward for skill)
- **Files**: game.js, entities.js

#### Difficulty Selection (Explicit)
- On "New Game": choice of Adventurer (easy), Hero (normal), Legend (hard)
- Adventurer: 2 extra hearts, enemies deal -1 damage, Soren heals fully every visit
- Hero: current balance
- Legend: enemies +30% HP, +20% speed, no heart drops from enemies, Soren only heals 2 HP
- Shown on character select screen as a secondary choice below character
- **Files**: game.js

---

## Improvement Pass 8: "The Details Nobody Notices (But Everyone Feels)"

*The Stardew Valley pass. The tiny things that make a world feel loved.*

### 8A. World Details

- **Weather awareness**: Que'Rubra's dialogue mentions if the player has taken damage ("I smell blood on you. Be more careful.") or is at full health ("You are unscathed. Impressive.")
- **NPC memory**: If player talks to Fawks before Helena, Fawks says "Helena's looking for you, by the way." If Helena first, Helena says "I see Fawks already got to you."
- **Character-specific NPC reactions**: Luigi gets unique lines from Soren (recognizes warlock magic: "Warlock pact energy. Dangerous but powerful. I won't judge — the spirits certainly don't."). Lirielle gets unique lines from Que'Rubra (druid recognizes druid: "A child of the Circle. The forest welcomes you differently than it welcomes the others.")
- **Files**: dialogue.js, game.js

### 8B. Micro-Animations

- Grass tiles near the player bend slightly when walked through (1px shift toward player direction, springs back over 8 frames)
- Torch flames react to player passing nearby (flame leans away from player for 6 frames)
- Water tiles near the player create small ripple rings (expanding circles, 1px wide, fade over 16 frames)
- Door tiles have a brief 4-frame open animation on room transition (currently instant)
- NPCs turn to face the player when within 24px (change their facing sprite direction)
- **Files**: game.js, sprites.js, entities.js

### 8C. Sound Design Details

- Unique footstep pitch per character (Daxon: lower/heavier, Luigi: shuffling/soft, Lirielle: light/quick)
- Text typewriter sound: very subtle click per character. Pitch shifts slightly for different speakers
- Menu selection: crisp tick sound. Menu confirm: bright chime. Menu back: soft thud
- Chest open: satisfying wooden creak + magical sparkle
- Boss phase transition: dramatic low boom (filtered noise burst with long decay)
- Silence after boss death before epilogue music: 2 full seconds of nothing. Let the player breathe
- **Files**: engine.js, game.js, music.js

### 8D. Camera & Framing

- **Room enter**: very subtle zoom from 0.98x to 1.0x over 15 frames (barely perceptible but adds "arrival" feel)
- **Boss intro**: camera slowly pushes toward boss from 1.0x to 1.05x during dialogue, snaps back to 1.0x when fight begins
- **Cutscene scenes**: gentle parallax between foreground and background elements in pixel art scenes (foreground layer shifts 1-2px on a slow sine wave)
- Implement as a render scale multiplier applied to the buffer → display blit
- **Files**: game.js

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

### Implementation Priority Order

The passes should be implemented in this order, with each one building on the last:

1. **Pass 3A** (Bug fixes) — Fix what's broken first
2. **Pass 3B** (Combat juice) — Make hitting things feel great
3. **Pass 7C** (Boss overhaul) — The climax of the game should be unforgettable
4. **Pass 4B-4C** (Dialogue rewrite) — Give the world its voice
5. **Pass 5A** (Animation expansion) — 4-frame walks, attack anims, death anims
6. **Pass 6C-6D** (Dialogue box + HUD) — Make the interface beautiful
7. **Pass 3C** (Atmosphere: darkness, leaves, particles) — Set the mood
8. **Pass 5B** (Sprite art: portraits, boss phases, items) — Visual upgrade
9. **Pass 7A-7B** (Dungeon environment + puzzle) — The world tells a story
10. **Pass 6A-6B** (Title + character select) — First impressions matter
11. **Pass 7D** (Enemy AI) — Smarter, scarier foes
12. **Pass 4E-4F** (Environmental text + intro rewrite) — Flavor and atmosphere
13. **Pass 3D + 8C** (Audio polish + sound design) — The invisible layer
14. **Pass 6E** (Pause menu + bestiary) — Reward completionists
15. **Pass 8A-8B-8D** (World details, micro-animations, camera) — The final 10% that makes it 100%
16. **Pass 7E** (Difficulty + accessibility) — Let everyone play
