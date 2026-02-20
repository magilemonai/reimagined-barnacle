/**
 * Valisar: Shadows of the Eldspyre
 * Main Game Orchestrator
 *
 * This is the LAST file loaded. It ties together all other systems
 * (engine, sprites, maps, dialogue, entities) and drives the full
 * game loop from title screen through victory.
 *
 * Assigns to window.Game and auto-starts.
 */

(function () {
    'use strict';

    // =====================================================================
    // LOCAL ALIASES
    // =====================================================================

    var C         = window.C;
    var Input     = window.Input;
    var Audio     = window.Audio;
    var Particles = window.Particles;
    var Utils     = window.Utils;
    var Sprites   = window.Sprites;
    var Maps      = window.Maps;
    var Dialogue  = window.Dialogue;
    var Entities  = window.Entities;
    var Music     = window.Music;
    var buf       = window.buf;
    var display   = window.display;
    var TILE      = window.TILE;
    var COLS      = window.COLS;
    var ROWS      = window.ROWS;
    var W         = window.W;
    var H         = window.H;

    // =====================================================================
    // GAME STATE OBJECT
    // =====================================================================

    var Game = {
        state: 'title', // title, select, intro, game, boss_intro, boss, victory, gameover, paused

        // Character selection
        selectedChar: 0,
        characters: ['daxon', 'luigi', 'lirielle'],
        charNames: ['Daxon Lamn', 'Luigi Bonemoon', 'Lirielle'],
        charClasses: ['Eldritch Knight', 'Warlock', 'Circle of Stars Druid'],
        charDescs: [
            'A warrior of Ebon Vale. Strong melee attacks and a defensive shield.',
            'A warlock bound by the Bonemoon prophecy. Ranged blasts and familiar Brog.',
            'An elven druid seeking her lost parents. Quick strikes and healing magic.'
        ],

        // Game objects
        player: null,
        enemies: [],
        npcs: [],
        heartDrops: [],
        boss: null,
        currentRoom: null,

        // Flags
        flags: {
            puzzleCrown: false,
            puzzleCape: false,
            puzzleScepter: false,
            puzzleSolved: false,
            bossDefeated: false
        },

        // Room clearing
        clearedRooms: {},

        // Collected items tracking (item ids that have been picked up)
        collectedItems: {},

        // Screen transition
        transition: { active: false, timer: 0, maxTime: 30, type: 'fade', targetRoom: null, spawnX: 0, spawnY: 0 },

        // Cutscene
        cutsceneTimer: 0,

        // Screenshake
        shake: 0,
        shakeIntensity: 0, // variable shake magnitude (pixels)

        // Frame counter
        frame: 0,

        // Game over
        gameOverTimer: 0,

        // Item interaction prompts
        nearNPC: null,
        nearItem: null,

        // Room name display
        roomNameTimer: 0,
        roomNameText: '',

        // Boss fight sub-state for dialogue progression
        bossDialogueStage: 0,
        bossDeathTimer: 0,

        // Floating damage/heal numbers
        floatingTexts: [],

        // Screen flash system (overlay color for impact moments)
        screenFlash: null, // { color, life, maxLife }

        // Enemy kill counter (for HUD)
        enemiesDefeated: 0,

        // Luigi Brog special tracking
        brogTarget: null,
        brogTimer: 0,
        brogActive: false,

        // Title screen sparkle particles (manual, separate from Particles system)
        titleSparkles: [],

        // Epilogue cutscene
        epilogueTimer: 0,

        // Victory credits
        creditsY: 0,
        victoryDialogueDone: false,

        // Safe room for respawn
        lastSafeRoom: 'ebon_vale_square',
        lastSafeX: 7,
        lastSafeY: 7,

        // Pause menu
        pausedFromState: null,
        playTime: 0, // frames of gameplay

        // Save system
        hasSaveData: false,

        // Difficulty: 0=Easy, 1=Normal, 2=Hard
        difficulty: 1,

        // Speed run timer (opt-in)
        speedRunEnabled: false,
        speedRunTime: 0,

        // Goblin teeth currency (drop from goblins)
        goblinTeeth: 0,

        // Shop state
        shopOpen: false,
        shopIndex: 0,

        // Soren's blessing active
        sorenBlessing: false,
        sorenBlessingTimer: 0,

        // Spike trap damage cooldown
        spikeCooldown: 0,

        // Temple puzzle boulders blocking boss entrance
        boulders: [],
        bouldersClearing: false,

        // Sign interaction
        nearSign: null,

        // Area name banner slide animation
        roomBannerSlide: 0,

        // Title screen enhancements
        titleStars: [],
        subtitleReveal: 0,

        // Difficulty menu
        difficultyMenuIndex: 1,

        // Heart shake timers for damage animation (Pass 6D)
        _heartShakeTimers: [],
        _prevHeartHP: -1,

        // Puzzle item collection sparkle timers (Pass 6D)
        _puzzleSparkles: { crown: 0, cape: 0, scepter: 0 },
        _prevPuzzleFlags: { puzzleCrown: false, puzzleCape: false, puzzleScepter: false },

        // --- Pass 6E: Pause menu overhaul + bestiary ---
        pauseMenuIndex: 0,
        pauseSubMenu: null, // null = main, 'controls', 'bestiary'
        bestiaryTab: 0,     // 0 = Enemies, 1 = Characters, 2 = Lore
        bestiaryScroll: 0,
        // Track encountered enemies/NPCs for bestiary
        encounteredEnemies: {},
        metNPCs: {},
        loreEntries: {},

        // --- Pass 6F: Game over screen ---
        gameOverMenuIndex: 0,
        gameOverDesatTimer: 0,

        // --- Pass 7E: Difficulty + adaptive ---
        deathCounts: {},    // roomId -> death count
        playerHasDied: false,

        // --- Pass 8A-8D: World details, micro-animations ---
        grassBends: [],     // {x, y, dir, timer}
        waterRipples: [],   // {x, y, radius, life}
        npcTalkedFirst: null, // tracks which NPC player talked to first

        // --- Pass 6A: Title screen overhaul ---
        titleLandscapeOffset: 0,    // scrolling landscape X offset
        titleEmbers: [],             // falling ember particles from top
        titleMenuAlpha: 0,           // menu fade-in alpha (0-1)
        titleMenuFadeStart: false,   // whether menu fade has been triggered

        // --- Pass 6B: Character select redesign ---
        selectSlideOffset: 0,        // slide transition offset in pixels
        selectSlideDir: 0,            // -1 = sliding left, 1 = sliding right, 0 = idle
        selectSlideFrom: 0,           // character index sliding away
        selectSlideTo: 0,             // character index sliding in
        selectSlideTimer: 0,          // frames remaining in slide
        selectConfirmTimer: 0,        // action pose countdown (20 frames)
        selectConfirmChar: -1,        // which character was confirmed

        // --- Pass 7A: Destructible objects (crates, barrels) ---
        destructibles: [],

        // --- Pass 7A: Spike trap timer ---
        spikeTimer: 0,

        // --- Pass 8B: Torch flame react + Door animation ---
        torchReacts: [],   // {col, row, dir, timer} - torch lean-away
        doorAnimTimer: 0,  // frames remaining in door open animation

        // --- Heart heal animation timers ---
        _healAnimTimers: [],

        // --- Crumbling floor hazard ---
        crumblingTiles: [],

        // --- Poison mushroom cooldown ---
        _poisonMushroomCD: 0,

        // --- Relic pickup slow-motion + camera hold ---
        slowMotion: 0,
        cameraHold: 0
    };

    window.Game = Game;

    // =====================================================================
    // HELPER: Safe sprite draw (fallback to colored rect)
    // =====================================================================

    function safeDraw(ctx, key, x, y, flip) {
        try {
            var sprData = Sprites.get(key);
            if (sprData) {
                Sprites.draw(ctx, key, x, y, flip);
            } else {
                // Fallback colored rectangle
                ctx.fillStyle = C.gray;
                ctx.fillRect(Math.floor(x), Math.floor(y), TILE, TILE);
            }
        } catch (e) {
            ctx.fillStyle = C.gray;
            ctx.fillRect(Math.floor(x), Math.floor(y), TILE, TILE);
        }
    }

    // =====================================================================
    // HELPER: Center text (calculate X for centered text)
    // =====================================================================

    function centerTextX(text, size) {
        var charW = 6 * (size || 1);
        return Math.floor((W - text.length * charW) / 2);
    }

    // =====================================================================
    // FLOATING DAMAGE/HEAL NUMBERS
    // =====================================================================

    function spawnFloatingText(x, y, text, color, big) {
        // Slight random x-offset so stacked hits don't overlap
        var offsetX = (Math.random() - 0.5) * 8;
        Game.floatingTexts.push({
            x: x + offsetX,
            y: y,
            text: String(text),
            color: color || C.white,
            life: 45,
            maxLife: 45,
            scale: big ? 2 : 1,
            vy: -0.8, // initial upward velocity
            vx: offsetX * 0.02 // slight drift matching offset
        });
        // Cap pool at 12 active numbers
        if (Game.floatingTexts.length > 12) {
            Game.floatingTexts.shift();
        }
    }

    function updateFloatingTexts() {
        for (var i = Game.floatingTexts.length - 1; i >= 0; i--) {
            var ft = Game.floatingTexts[i];
            ft.y += ft.vy;
            ft.x += ft.vx;
            ft.vy += 0.015; // gravity: numbers rise fast then slow down
            ft.life--;
            if (ft.life <= 0) {
                Game.floatingTexts.splice(i, 1);
            }
        }
    }

    function renderFloatingTexts(ctx) {
        for (var i = 0; i < Game.floatingTexts.length; i++) {
            var ft = Game.floatingTexts[i];
            var alpha = Math.min(1, ft.life / (ft.maxLife * 0.4));
            // Pop-in effect: scale up briefly on spawn
            var age = ft.maxLife - ft.life;
            var popScale = age < 4 ? 1.0 + (4 - age) * 0.15 : 1.0;
            var finalScale = ft.scale * popScale;

            ctx.globalAlpha = alpha;
            // Draw shadow for readability
            Utils.drawText(ctx, ft.text, Math.floor(ft.x) + 1, Math.floor(ft.y) + 1, C.black, finalScale);
            Utils.drawText(ctx, ft.text, Math.floor(ft.x), Math.floor(ft.y), ft.color, finalScale);
            ctx.globalAlpha = 1;
        }
    }

    // =====================================================================
    // SCREEN FLASH SYSTEM (impact overlays)
    // =====================================================================

    function triggerScreenFlash(color, duration) {
        Game.screenFlash = { color: color, life: duration, maxLife: duration };
    }

    function updateScreenFlash() {
        if (Game.screenFlash) {
            Game.screenFlash.life--;
            if (Game.screenFlash.life <= 0) {
                Game.screenFlash = null;
            }
        }
    }

    function renderScreenFlash(ctx) {
        if (!Game.screenFlash) return;
        var sf = Game.screenFlash;
        var alpha = sf.life / sf.maxLife;
        // First few frames are full opacity, then fade
        if (sf.life > sf.maxLife - 3) alpha = 1;
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = sf.color;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
    }

    // =====================================================================
    // MUSIC THEME SELECTION
    // =====================================================================

    function getMusicForRoom(roomId) {
        if (!roomId) return 'town';
        if (roomId.indexOf('ebon_vale') === 0)   return 'town';
        if (roomId.indexOf('ebon_forest') === 0)  return 'forest';
        if (roomId === 'temple_boss')              return null; // boss music handled separately
        if (roomId.indexOf('temple') === 0)        return 'temple';
        return 'town';
    }

    function playRoomMusic(roomId) {
        if (!Music) return;
        var theme = getMusicForRoom(roomId);
        if (theme) Music.play(theme);
    }

    // =====================================================================
    // PARALLAX BACKGROUND RENDERING
    // =====================================================================

    function renderParallaxBG(ctx) {
        if (!Game.currentRoom) return;
        var roomId = Game.currentRoom.id;

        if (roomId && roomId.indexOf('ebon_forest') === 0) {
            // Forest rooms: 3 horizontal strips of darker green at slowly shifting Y positions
            ctx.fillStyle = 'rgba(10,40,10,0.15)';
            var yOff1 = Math.sin(Game.frame * 0.01) * 3;
            var yOff2 = Math.sin(Game.frame * 0.015 + 1.5) * 4;
            var yOff3 = Math.sin(Game.frame * 0.008 + 3.0) * 2;
            ctx.fillRect(0, 20 + yOff1, W, 12);
            ctx.fillRect(0, 70 + yOff2, W, 16);
            ctx.fillRect(0, 130 + yOff3, W, 10);
        } else if (roomId && roomId.indexOf('temple') === 0 && roomId !== 'temple_boss') {
            // Temple rooms: dark blue-gray strips at top
            ctx.fillStyle = 'rgba(15,15,30,0.2)';
            var tOff1 = Math.sin(Game.frame * 0.008) * 2;
            var tOff2 = Math.sin(Game.frame * 0.012 + 2.0) * 3;
            ctx.fillRect(0, 5 + tOff1, W, 8);
            ctx.fillRect(0, 25 + tOff2, W, 6);
            ctx.fillRect(0, 50 + Math.sin(Game.frame * 0.006 + 4.0) * 2, W, 10);
        } else if (roomId === 'temple_boss') {
            // Boss room: slowly shifting purple-black gradient strips
            ctx.fillStyle = 'rgba(30,10,40,0.12)';
            var bOff1 = Math.sin(Game.frame * 0.006) * 4;
            var bOff2 = Math.sin(Game.frame * 0.01 + 1.0) * 3;
            var bOff3 = Math.sin(Game.frame * 0.008 + 2.5) * 5;
            ctx.fillRect(0, 10 + bOff1, W, 14);
            ctx.fillRect(0, 60 + bOff2, W, 18);
            ctx.fillRect(0, 120 + bOff3, W, 12);
            ctx.fillRect(0, 160 + Math.sin(Game.frame * 0.005 + 4.0) * 3, W, 10);
        }
    }

    // =====================================================================
    // MAP RENDERING
    // =====================================================================

    function renderMap(ctx, room) {
        if (!room || !room.tiles) return;
        var waterFrame = Math.floor(Game.frame / 30) % 2; // alternate every 30 frames
        // Spike cycle: 40 frames up (damaging), 20 frames down (safe) = 60 frame cycle
        var spikeCycle = Game.spikeTimer % 60;
        var spikesUp = spikeCycle < 40;     // 0-39 = up, 40-59 = down
        var spikeEmerge = spikeCycle < 4;   // first 4 frames: emerging
        var spikeRetract = spikeCycle >= 37 && spikeCycle < 40; // frames 37-39: about to retract
        for (var row = 0; row < ROWS; row++) {
            for (var col = 0; col < COLS; col++) {
                var tileId = Maps.getTile(room, col, row);
                var tileProp = window.TileProps[tileId];
                if (tileProp) {
                    var spriteKey = tileProp.name;
                    // Animated water tiles
                    if (tileId === window.T.WATER && waterFrame === 1) {
                        spriteKey = 'tile_water_1';
                    }
                    safeDraw(ctx, spriteKey, col * TILE, row * TILE);

                    // Spike trap animation: emerging/retracting + retracted overlay
                    if (tileId === window.T.SPIKE) {
                        var sx = col * TILE;
                        var sy = row * TILE;
                        if (spikesUp) {
                            // Emerging: first 4 frames show partial spikes rising
                            if (spikeEmerge) {
                                var emergeH = Math.floor((spikeCycle + 1) * 3); // 3,6,9,12
                                ctx.fillStyle = C.lightGray;
                                ctx.globalAlpha = 0.6;
                                ctx.fillRect(sx + 3, sy + 12 - emergeH, 2, emergeH);
                                ctx.fillRect(sx + 7, sy + 12 - emergeH, 2, emergeH);
                                ctx.fillRect(sx + 11, sy + 12 - emergeH, 2, emergeH);
                                ctx.globalAlpha = 1;
                            } else if (spikeRetract) {
                                // About to retract: flicker/dim spikes
                                ctx.fillStyle = C.lightGray;
                                ctx.globalAlpha = 0.3 + (39 - spikeCycle) * 0.1;
                                ctx.fillRect(sx + 3, sy + 4, 2, 8);
                                ctx.fillRect(sx + 7, sy + 4, 2, 8);
                                ctx.fillRect(sx + 11, sy + 4, 2, 8);
                                ctx.globalAlpha = 1;
                            }
                            // Normal up state: spikes are drawn by the sprite itself
                        } else {
                            // Spikes retracted: semi-transparent holes overlay
                            ctx.fillStyle = C.darkGray;
                            ctx.globalAlpha = 0.4;
                            ctx.fillRect(sx + 3, sy + 10, 2, 3);
                            ctx.fillRect(sx + 7, sy + 10, 2, 3);
                            ctx.fillRect(sx + 11, sy + 10, 2, 3);
                            ctx.globalAlpha = 1;
                        }
                    }
                }
            }
        }
    }

    // =====================================================================
    // ROOM LOADING
    // =====================================================================

    function loadRoom(roomId) {
        var room = Maps.getRoom(roomId);
        if (!room) {
            console.warn('Room not found: ' + roomId);
            return;
        }

        Game.currentRoom = room;
        Game.roomNameText = room.name || roomId;
        Game.roomNameTimer = 90;

        // Create NPCs
        Game.npcs = [];
        if (room.npcs && room.npcs.length > 0) {
            for (var n = 0; n < room.npcs.length; n++) {
                var npcData = room.npcs[n];
                var npc = new Entities.NPC(npcData);
                Game.npcs.push(npc);
            }
        }

        // Create enemies (only if room not cleared)
        Game.enemies = [];
        if (!Game.clearedRooms[roomId] && room.enemies && room.enemies.length > 0) {
            for (var i = 0; i < room.enemies.length; i++) {
                var eData = room.enemies[i];
                var etype = eData.type;
                if (etype === 'goblin_archer') {
                    var archer = new Entities.GoblinArcher(eData.x, eData.y);
                    Game.enemies.push(archer);
                    Game.encounteredEnemies['goblin_archer'] = true; // Bestiary tracking
                } else {
                    // Normalize enemy type: maps use 'goblin_lackey', entity expects 'goblin'
                    if (etype === 'goblin_lackey') etype = 'goblin';
                    var enemy = new Entities.Enemy(etype, eData.x, eData.y);
                    // Apply difficulty scaling (Pass 7E)
                    var roomDeaths = Game.deathCounts[roomId] || 0;
                    if (Game.difficulty === 0) { // Easy
                        enemy.speed *= 0.7;
                        enemy.damage = Math.max(1, enemy.damage - 1);
                    } else if (Game.difficulty === 2) { // Hard
                        enemy.speed *= 1.2;
                        enemy.maxHp = Math.ceil(enemy.maxHp * 1.5);
                        enemy.hp = enemy.maxHp;
                    }
                    // Adaptive difficulty: mercy after 3+ deaths in same room
                    if (roomDeaths >= 3) {
                        enemy.damage = Math.max(1, enemy.damage - 1);
                        enemy.speed *= 0.85;
                    }
                    // Reward no-death players after temple entrance
                    if (!Game.playerHasDied && Game.visitedRooms['temple_entrance']) {
                        enemy.speed *= 1.1;
                    }
                    Game.enemies.push(enemy);
                    Game.encounteredEnemies[etype] = true; // Bestiary tracking
                }
            }
        }

        // Clear heart drops
        Game.heartDrops = [];

        // Clear boss reference (unless boss room)
        if (roomId !== 'temple_boss') {
            Game.boss = null;
        }

        // Play appropriate music for this room
        playRoomMusic(roomId);

        // Mark room as visited for minimap
        Game.visitedRooms[roomId] = true;


        // Track safe rooms (town rooms)
        if (roomId === 'ebon_vale_square' || roomId === 'ebon_vale_market' || roomId === 'ebon_vale_north') {
            Game.lastSafeRoom = roomId;
            if (Game.player) {
                Game.lastSafeX = Math.floor(Game.player.x / TILE);
                Game.lastSafeY = Math.floor(Game.player.y / TILE);
            }
        }

        // Spawn boulders blocking boss entrance in temple puzzle
        Game.boulders = [];
        Game.bouldersClearing = false;
        if (roomId === 'temple_puzzle' && !Game.flags.puzzleSolved) {
            Game.boulders = [
                { x: 6 * TILE, y: 0 * TILE, vx: 0, vy: 0, active: true },
                { x: 7 * TILE, y: 0 * TILE, vx: 0, vy: 0, active: true },
                { x: 8 * TILE, y: 0 * TILE, vx: 0, vy: 0, active: true },
                { x: 9 * TILE, y: 0 * TILE, vx: 0, vy: 0, active: true }
            ];
        }

        // Pass 7A: Spawn destructible objects (crates/barrels in appropriate rooms)
        Game.destructibles = [];
        if (room.destructibles && room.destructibles.length > 0) {
            for (var di = 0; di < room.destructibles.length; di++) {
                var dData = room.destructibles[di];
                Game.destructibles.push(new Entities.Destructible(dData.type, dData.x, dData.y));
            }
        } else {
            // Default destructibles for certain rooms (forest/temple rooms)
            if (roomId === 'ebon_forest_entry') {
                Game.destructibles.push(new Entities.Destructible('crate', 3, 8));
                Game.destructibles.push(new Entities.Destructible('barrel', 12, 6));
            } else if (roomId === 'ebon_forest_deep') {
                Game.destructibles.push(new Entities.Destructible('crate', 2, 10));
                Game.destructibles.push(new Entities.Destructible('crate', 3, 10));
                Game.destructibles.push(new Entities.Destructible('barrel', 13, 4));
            } else if (roomId === 'temple_entrance') {
                Game.destructibles.push(new Entities.Destructible('crate', 2, 9));
                Game.destructibles.push(new Entities.Destructible('barrel', 13, 9));
                Game.destructibles.push(new Entities.Destructible('barrel', 5, 6));
            } else if (roomId === 'temple_puzzle') {
                Game.destructibles.push(new Entities.Destructible('crate', 2, 10));
                Game.destructibles.push(new Entities.Destructible('crate', 13, 10));
            }
        }

        // Pass 8B: Door animation on room entry
        Game.doorAnimTimer = 4;

        // Pass 8B: Clear torch reacts on room transition
        Game.torchReacts = [];
    }

    // =====================================================================
    // ROOM TRANSITION
    // =====================================================================

    function startTransition(targetRoom, spawnX, spawnY) {
        Game.transition.active = true;
        Game.transition.timer = Game.transition.maxTime;
        Game.transition.targetRoom = targetRoom;
        Game.transition.spawnX = spawnX;
        Game.transition.spawnY = spawnY;

        Audio.play('whoosh');

        // Auto-save on room transitions
        saveGame();
    }

    function updateTransition() {
        if (!Game.transition.active) return;

        Game.transition.timer--;

        // At midpoint: switch room
        if (Game.transition.timer === Math.floor(Game.transition.maxTime / 2)) {
            loadRoom(Game.transition.targetRoom);
            if (Game.player) {
                Game.player.x = Game.transition.spawnX * TILE;
                Game.player.y = Game.transition.spawnY * TILE;
            }
        }

        if (Game.transition.timer <= 0) {
            Game.transition.active = false;
        }
    }

    function renderTransition(ctx) {
        if (!Game.transition.active) return;

        var half = Math.floor(Game.transition.maxTime / 2);
        var progress; // 0 = fully open, 1 = fully closed

        if (Game.transition.timer > half) {
            // Closing: diamonds shrink to cover screen
            progress = 1 - (Game.transition.timer - half) / half;
        } else {
            // Opening: diamonds grow to reveal screen
            progress = Game.transition.timer / half;
        }

        // Diamond wipe: draw a grid of diamond-shaped masks
        var diamondSize = 20; // size of each diamond cell
        var cols = Math.ceil(W / diamondSize) + 1;
        var rows = Math.ceil(H / diamondSize) + 1;

        ctx.fillStyle = C.black;
        ctx.beginPath();

        for (var row = -1; row < rows; row++) {
            for (var col = -1; col < cols; col++) {
                var cx = col * diamondSize + diamondSize / 2;
                var cy = row * diamondSize + diamondSize / 2;
                var r = progress * diamondSize * 0.75;

                if (r > 0.5) {
                    // Draw a diamond (rotated square)
                    ctx.moveTo(cx, cy - r);
                    ctx.lineTo(cx + r, cy);
                    ctx.lineTo(cx, cy + r);
                    ctx.lineTo(cx - r, cy);
                    ctx.closePath();
                }
            }
        }

        ctx.fill();
    }

    // =====================================================================
    // CHECK ROOM EXITS
    // =====================================================================

    function checkRoomExits() {
        if (!Game.player || !Game.currentRoom || Game.transition.active) return;
        if (Dialogue.isActive()) return;

        var px = Game.player.x;
        var py = Game.player.y;
        var exits = Game.currentRoom.exits;

        // North exit
        if (exits.north && py < 2) {
            // Special: temple_puzzle north exit is locked until puzzle is solved
            if (Game.currentRoom.id === 'temple_puzzle' && (!Game.flags.puzzleSolved || Game.boulders.length > 0)) {
                // Push player back - boulders still blocking
                Game.player.y = 2;
                return;
            }
            startTransition(exits.north.room, exits.north.spawnX, exits.north.spawnY);
        }
        // South exit
        if (exits.south && py > (ROWS - 1) * TILE - 4) {
            startTransition(exits.south.room, exits.south.spawnX, exits.south.spawnY);
        }
        // East exit
        if (exits.east && px > (COLS - 1) * TILE - 4) {
            startTransition(exits.east.room, exits.east.spawnX, exits.east.spawnY);
        }
        // West exit
        if (exits.west && px < 2) {
            startTransition(exits.west.room, exits.west.spawnX, exits.west.spawnY);
        }
    }

    // =====================================================================
    // NPC INTERACTION
    // =====================================================================

    // --- Pass 4D: Context-sensitive dialogue selection ---
    function getContextDialogue(npc) {
        var id = npc.id || '';
        var base = id.replace('npc_', '').replace('brother_', '');
        var DD = window.DialogueData;

        // Post-boss victory dialogue (highest priority)
        if (Game.flags.bossDefeated && DD[base + '_victory']) {
            return base + '_victory';
        }

        // Mid-game dialogue (after visiting forest)
        if (Game.visitedRooms && Game.visitedRooms['ebon_forest'] && DD[base + '_midgame']) {
            if (npc.interacted) {
                return base + '_midgame';
            }
        }

        // Return visit dialogue (already interacted once)
        if (npc.interacted && DD[base + '_return']) {
            // Pass 8A: Health-aware Que'Rubra
            if (base === 'querubra' && Game.player) {
                if (Game.player.hp < Game.player.maxHp && DD['querubra_return_hurt']) {
                    return 'querubra_return_hurt';
                } else if (Game.player.hp >= Game.player.maxHp && DD['querubra_return_healthy']) {
                    return 'querubra_return_healthy';
                }
            }
            return base + '_return';
        }

        // Pass 8A: Character-specific NPC reactions
        if (!npc.interacted && Game.player) {
            var charId = Game.player.characterId;
            if (DD[base + '_greeting_' + charId]) {
                return base + '_greeting_' + charId;
            }
        }

        // Pass 8A: NPC memory — who player talked to first
        if (!npc.interacted && Game.npcTalkedFirst) {
            if (base === 'fawks' && Game.npcTalkedFirst !== 'fawks' && Game.npcTalkedFirst === 'helena') {
                // Fawks knows you already met Helena
            }
        }

        return null; // Use default dialogue
    }

    function checkNPCInteraction() {
        if (!Game.player) return;
        Game.nearNPC = null;

        for (var i = 0; i < Game.npcs.length; i++) {
            var npc = Game.npcs[i];
            var d = Utils.dist(
                { x: Game.player.x + 8, y: Game.player.y + 8 },
                { x: npc.x + 8, y: npc.y + 8 }
            );

            if (d < 24) {
                Game.nearNPC = npc;

                // Pass 8B: NPCs turn to face player when within range
                if (Game.player) {
                    var dx = Game.player.x - npc.x;
                    var dy = Game.player.y - npc.y;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        npc.facing = dx > 0 ? 'right' : 'left';
                    } else {
                        npc.facing = dy > 0 ? 'down' : 'up';
                    }
                }

                if (Input.pressed['z'] && !Dialogue.isActive()) {
                    // Bestiary: track met NPCs
                    var npcBaseId = (npc.id || '').replace('npc_', '').replace('brother_', '');
                    if (npcBaseId) Game.metNPCs[npcBaseId] = true;

                    // Track first NPC talked to (Pass 8A)
                    if (!Game.npcTalkedFirst) Game.npcTalkedFirst = npcBaseId;

                    // Special NPC interactions
                    if (npc.id === 'npc_braxon') {
                        if (npc.interacted) {
                            // Return visits go straight to shop
                            openShop();
                        } else {
                            // First visit: character-specific greeting, then open shop
                            npc.interacted = true;
                            var braxonDialogue = npc.dialogueId;
                            if (Game.player && Game.player.characterId === 'daxon' && window.DialogueData['braxon_greeting_daxon']) {
                                braxonDialogue = 'braxon_greeting_daxon';
                            }
                            Dialogue.start(braxonDialogue, function () {
                                openShop();
                            });
                            Audio.play('select');
                        }
                    } else if (npc.id === 'npc_brother_soren') {
                        if (npc.interacted) {
                            // Return visits give blessing directly
                            sorenBlessing();
                            Dialogue.start(null, null, 'May the light guide you, child. I have restored your strength.');
                        } else {
                            // First visit: show greeting, then bless
                            npc.interacted = true;
                            Dialogue.start(npc.dialogueId, function () {
                                sorenBlessing();
                            });
                            Audio.play('select');
                        }
                    } else {
                        // Pass 4D: Context-sensitive dialogue tiers
                        var dialogueId2 = getContextDialogue(npc) || npc.dialogueId || npc.dialogue;
                        if (dialogueId2) {
                            if (typeof dialogueId2 === 'string' && window.DialogueData[dialogueId2]) {
                                Dialogue.start(dialogueId2);
                            } else {
                                npc.interact();
                            }
                            Audio.play('select');
                        }
                    }
                }
                break;
            }
        }
    }

    // =====================================================================
    // PUZZLE ITEM LOGIC (temple_puzzle room)
    // =====================================================================

    function checkPuzzleItems() {
        if (!Game.currentRoom || Game.currentRoom.id !== 'temple_puzzle') return;
        if (!Game.player) return;
        if (Dialogue.isActive()) return;

        var items = Game.currentRoom.items;
        if (!items) return;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (Game.collectedItems[item.id]) continue;

            var ix = item.x * TILE;
            var iy = item.y * TILE;
            var d = Utils.dist(
                { x: Game.player.x + 8, y: Game.player.y + 8 },
                { x: ix + 8, y: iy + 8 }
            );

            if (d < 20) {
                // Check if the zone is clear of enemies
                var zoneClear = isZoneClear(item);

                if (zoneClear && Input.pressed['z']) {
                    // Pick up the item
                    Game.collectedItems[item.id] = true;

                    if (item.type === 'item_crown') {
                        Game.flags.puzzleCrown = true;
                        Dialogue.start('puzzle_crown');
                    } else if (item.type === 'item_cape') {
                        Game.flags.puzzleCape = true;
                        Dialogue.start('puzzle_cape');
                    } else if (item.type === 'item_scepter') {
                        Game.flags.puzzleScepter = true;
                        Dialogue.start('puzzle_scepter');
                    }

                    // Relic pickup slow-motion + golden flash
                    Game.slowMotion = 30;
                    triggerScreenFlash('#FFD700', 10);

                    Audio.play('pickup');
                }
            }
        }

        // Check central altar interaction (altar is at row 9, statue above at row 7)
        if (Game.flags.puzzleCrown && Game.flags.puzzleCape && Game.flags.puzzleScepter && !Game.flags.puzzleSolved) {
            // Altar is at col 7-8, row 9
            var statueX = 7 * TILE + 8;
            var statueY = 9 * TILE + 8;
            var distToStatue = Utils.dist(
                { x: Game.player.x + 8, y: Game.player.y + 8 },
                { x: statueX, y: statueY }
            );

            if (distToStatue < 28 && Input.pressed['z']) {
                Game.flags.puzzleSolved = true;
                Audio.play('fanfare');
                // Camera hold + slow motion for the big moment
                Game.cameraHold = 60;
                Game.slowMotion = 30;
                triggerScreenFlash('#FFD700', 12);
                Dialogue.start('statue_complete', function () {
                    // Animate boulders rolling away
                    Game.bouldersClearing = true;
                    Game.shake = 6;
                    Audio.play('explosion');
                    for (var b = 0; b < Game.boulders.length; b++) {
                        var boulder = Game.boulders[b];
                        // Roll left/right away from center
                        boulder.vx = (boulder.x < 7.5 * TILE) ? -2.5 : 2.5;
                        boulder.vy = -0.5;
                    }
                });
                Particles.ring(statueX, statueY, 20, 16, C.purple);
                Particles.burst(statueX, statueY, 25, C.gold);
                Particles.confetti(statueX, statueY - 10, 12);
                Game.shake = 8;
            }
        }
    }

    function isZoneClear(item) {
        // Left zone: cols 0-4 (crown at x=2)
        // Right zone: cols 11-15 (cape at x=13)
        // Top zone: rows 0-4 (scepter at y=1)
        var zoneEnemies = 0;

        for (var e = 0; e < Game.enemies.length; e++) {
            var enemy = Game.enemies[e];
            if (enemy.dead) continue;

            var eCol = Math.floor(enemy.x / TILE);
            var eRow = Math.floor(enemy.y / TILE);

            if (item.type === 'item_crown') {
                // Left zone: cols 0-4
                if (eCol <= 4) zoneEnemies++;
            } else if (item.type === 'item_cape') {
                // Right zone: cols 11-15
                if (eCol >= 11) zoneEnemies++;
            } else if (item.type === 'item_scepter') {
                // Top center zone: rows 0-4 AND cols 5-10 (only center guards, not side alcoves)
                if (eRow <= 4 && eCol >= 5 && eCol <= 10) zoneEnemies++;
            }
        }

        return zoneEnemies === 0;
    }

    // =====================================================================
    // SIGN INTERACTION
    // =====================================================================

    function checkSignInteraction() {
        if (!Game.player || !Game.currentRoom || !Game.currentRoom.signs) return;
        if (Dialogue.isActive()) return;
        Game.nearSign = null;

        for (var i = 0; i < Game.currentRoom.signs.length; i++) {
            var sign = Game.currentRoom.signs[i];
            var sx = sign.x * TILE;
            var sy = sign.y * TILE;
            var d = Utils.dist(
                { x: Game.player.x + 8, y: Game.player.y + 8 },
                { x: sx + 8, y: sy + 8 }
            );

            if (d < 24) {
                Game.nearSign = sign;
                if (Input.pressed['z']) {
                    // Show sign text as dialogue
                    Dialogue.start(null, null, sign.text);
                    Audio.play('select');
                    // Lore tracking for bestiary
                    if (sign.dialogueId === 'sign_temple' || sign.text && sign.text.indexOf('Nitriti') >= 0) {
                        Game.loreEntries['lore_nitriti'] = true;
                    }
                    if (sign.dialogueId === 'sign_warning' || sign.text && sign.text.indexOf('EBON') >= 0) {
                        Game.loreEntries['lore_ebonvale'] = true;
                    }
                }
                break;
            }
        }
    }

    function renderSignPrompt(ctx) {
        if (!Game.nearSign || Dialogue.isActive()) return;
        var sign = Game.nearSign;
        var bobY = Math.sin(Game.frame * 0.15) * 2;
        var promptX = Math.floor(sign.x * TILE + 4);
        var promptY = Math.floor(sign.y * TILE - 10 + bobY);
        Utils.drawText(ctx, 'Z', promptX, promptY, C.yellow, 1);
    }

    // =====================================================================
    // SPIKE TRAP HAZARD
    // =====================================================================

    function checkSpikeTraps() {
        if (!Game.player || !Game.currentRoom) return;

        // Increment spike timer each frame
        Game.spikeTimer++;

        if (Game.spikeCooldown > 0) { Game.spikeCooldown--; return; }

        // Check if player is standing on a spike tile
        var cx = Math.floor((Game.player.x + Game.player.w / 2) / TILE);
        var cy = Math.floor((Game.player.y + Game.player.h / 2) / TILE);
        var tileId = Maps.getTile(Game.currentRoom, cx, cy);

        if (tileId === window.T.SPIKE) {
            // Spike cycle: 40 frames up (damaging), 20 frames down (safe) = 60 frame cycle
            var spikeCycle = Game.spikeTimer % 60;
            var spikesUp = spikeCycle < 40;
            if (spikesUp) { // Spikes are up
                var dmg = 1;
                if (Game.difficulty === 2) dmg = 2; // Hard mode
                if (Game.difficulty === 0) dmg = 0; // Easy mode - no spike damage

                if (dmg > 0 && Game.player.invincible <= 0) {
                    Game.player.hp -= dmg;
                    Game.player.invincible = 30;
                    Game.player._wasHurt = true;
                    Game.spikeCooldown = 30;
                    Audio.play('spike');
                    Particles.burst(Game.player.x + 5, Game.player.y + 6, 6, C.red);
                    spawnFloatingText(Game.player.x + 2, Game.player.y - 4, dmg, C.red);
                }
            }
        }
    }

    // =====================================================================
    // CRUMBLING FLOOR HAZARD (tile ID 30 = CRACKED)
    // =====================================================================

    function updateCrumblingTiles() {
        if (!Game.player || !Game.currentRoom) return;

        // Check if player is standing on a CRACKED tile
        var cx = Math.floor((Game.player.x + Game.player.w / 2) / TILE);
        var cy = Math.floor((Game.player.y + Game.player.h / 2) / TILE);
        var tileId = Maps.getTile(Game.currentRoom, cx, cy);

        if (tileId === 30) { // CRACKED tile
            // Check if this tile is already tracked
            var alreadyTracked = false;
            for (var c = 0; c < Game.crumblingTiles.length; c++) {
                if (Game.crumblingTiles[c].col === cx && Game.crumblingTiles[c].row === cy) {
                    alreadyTracked = true;
                    break;
                }
            }
            if (!alreadyTracked) {
                Game.crumblingTiles.push({ col: cx, row: cy, timer: 60, triggered: false });
            }
        }

        // Update crumbling tile timers
        for (var ct = Game.crumblingTiles.length - 1; ct >= 0; ct--) {
            var tile = Game.crumblingTiles[ct];
            tile.timer--;

            if (tile.timer <= 0 && !tile.triggered) {
                tile.triggered = true;
                // Deal 1 damage if player is still on the tile
                var pcx = Math.floor((Game.player.x + Game.player.w / 2) / TILE);
                var pcy = Math.floor((Game.player.y + Game.player.h / 2) / TILE);
                if (pcx === tile.col && pcy === tile.row && Game.player.invincible <= 0) {
                    Game.player.hp -= 1;
                    Game.player.invincible = 20;
                    Game.player._wasHurt = true;
                    Audio.play('spike');
                    spawnFloatingText(Game.player.x + 2, Game.player.y - 4, 1, C.red);
                }
                // Particle effect
                Particles.burst(tile.col * TILE + 8, tile.row * TILE + 8, 8, '#8a7a6a');
                Audio.play('explosion');
            }

            // Remove after triggered + 30 extra frames
            if (tile.triggered && tile.timer < -30) {
                Game.crumblingTiles.splice(ct, 1);
            }
        }
    }

    function renderCrumblingTiles(ctx) {
        for (var ct = 0; ct < Game.crumblingTiles.length; ct++) {
            var tile = Game.crumblingTiles[ct];
            var tx = tile.col * TILE;
            var ty = tile.row * TILE;

            if (!tile.triggered) {
                // Draw increasing visual cracks as timer decreases
                var crackProgress = 1 - (tile.timer / 60); // 0 to 1
                ctx.fillStyle = '#2a2020';
                ctx.globalAlpha = crackProgress * 0.8;
                // Crack line 1
                ctx.fillRect(tx + 3, ty + 4, 6, 1);
                if (crackProgress > 0.3) {
                    // Crack line 2
                    ctx.fillRect(tx + 8, ty + 8, 1, 5);
                }
                if (crackProgress > 0.6) {
                    // Crack line 3
                    ctx.fillRect(tx + 2, ty + 10, 5, 1);
                }
                ctx.globalAlpha = 1;

                // Flash warning when about to collapse
                if (tile.timer < 15 && Math.floor(Game.frame / 4) % 2 === 0) {
                    ctx.fillStyle = 'rgba(200,60,30,0.25)';
                    ctx.fillRect(tx, ty, TILE, TILE);
                }
            } else {
                // After triggered: show broken floor (dark hole)
                ctx.fillStyle = '#1a1010';
                ctx.globalAlpha = 0.6;
                ctx.fillRect(tx + 2, ty + 2, TILE - 4, TILE - 4);
                ctx.globalAlpha = 1;
            }
        }
    }

    // =====================================================================
    // POISON MUSHROOM HAZARD (tile ID 29 = MUSHROOM)
    // =====================================================================

    function updatePoisonMushroom() {
        if (!Game.player || !Game.currentRoom || !Game.currentRoom.tiles) return;

        // Check if player is within 14px of any MUSHROOM tile
        var px = Game.player.x + Game.player.w / 2;
        var py = Game.player.y + Game.player.h / 2;
        var nearMushroom = false;
        var closestMX = 0, closestMY = 0;

        // Check surrounding tiles (3x3 grid around player)
        for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
                var checkCol = Math.floor(px / TILE) + dx;
                var checkRow = Math.floor(py / TILE) + dy;
                if (checkCol < 0 || checkCol >= COLS || checkRow < 0 || checkRow >= ROWS) continue;
                var tid = Maps.getTile(Game.currentRoom, checkCol, checkRow);
                if (tid === 29) { // MUSHROOM tile
                    var mx = checkCol * TILE + TILE / 2;
                    var my = checkRow * TILE + TILE / 2;
                    var dist = Math.sqrt((px - mx) * (px - mx) + (py - my) * (py - my));
                    if (dist < 14) {
                        nearMushroom = true;
                        closestMX = mx;
                        closestMY = my;
                        // Continuous spore cloud — much more visible
                        if (Game.frame % 6 === 0) {
                            Particles.add(mx + (Math.random() - 0.5) * 10, my - 2, {
                                vx: (Math.random() - 0.5) * 0.5,
                                vy: -(0.3 + Math.random() * 0.4),
                                life: 35,
                                color: Utils.choice(['#40a040', '#60c060', '#308030']),
                                size: Utils.choice([1, 2, 2]),
                                gravity: -0.02
                            });
                        }
                        break;
                    }
                }
            }
            if (nearMushroom) break;
        }

        if (nearMushroom) {
            // Warning: green tint overlay while near mushroom
            Game._poisonNear = true;

            if (Game._poisonMushroomCD <= 0) {
                // Deal poison damage every 90 frames
                var poisonDmg = 1;
                if (Game.difficulty === 0) poisonDmg = 0; // Adventurer: no poison damage
                if (poisonDmg > 0 && Game.player.invincible <= 0) {
                    Game.player.hp -= poisonDmg;
                    Game.player.invincible = 15;
                    Game.player._wasHurt = true;
                    Audio.play('poison');
                    spawnFloatingText(Game.player.x + 2, Game.player.y - 4, poisonDmg, '#40a040');
                    // Bigger green poison puff
                    Particles.burst(Game.player.x + 8, Game.player.y + 4, 12, '#40a040');
                    Particles.burst(closestMX, closestMY - 4, 8, '#60c060');
                    // Green screen flash
                    Game._poisonFlash = 8;
                }
                Game._poisonMushroomCD = 90;
            }
        } else {
            Game._poisonNear = false;
        }

        if (Game._poisonMushroomCD > 0) Game._poisonMushroomCD--;
        if (Game._poisonFlash > 0) Game._poisonFlash--;
    }

    // =====================================================================
    // PASS 4E: EXAMINE OBJECTS SYSTEM
    // =====================================================================

    // Lookup by room ID: objects at tile positions with dialogue keys
    var EXAMINE_OBJECTS = {
        ebon_vale_market: [
            { tx: 3,  ty: 5,  key: 'examine_market_stall' },
            { tx: 12, ty: 5,  key: 'examine_market_stall' },
            { tx: 7,  ty: 3,  key: 'examine_forge_anvil' }
        ],
        ebon_vale_square: [
            { tx: 7,  ty: 5,  key: 'examine_well' }
        ],
        ebon_vale_north: [
            { tx: 7,  ty: 3,  key: 'examine_fountain' }
        ],
        temple_entrance: [
            { tx: 2,  ty: 2,  key: 'examine_bookshelf' },
            { tx: 13, ty: 2,  key: 'examine_bookshelf' },
            { tx: 4,  ty: 3,  key: 'examine_pillar' },
            { tx: 11, ty: 3,  key: 'examine_pillar' },
            { tx: 7,  ty: 4,  key: 'examine_tapestry' }
        ],
        temple_puzzle: [
            { tx: 7,  ty: 7,  key: 'examine_puzzle_statue' },
            { tx: 8,  ty: 7,  key: 'examine_puzzle_statue' },
            { tx: 3,  ty: 3,  key: 'examine_pillar' },
            { tx: 12, ty: 3,  key: 'examine_pillar' },
            { tx: 2,  ty: 8,  key: 'examine_rubble' },
            { tx: 13, ty: 8,  key: 'examine_rubble' }
        ],
        temple_boss: [
            { tx: 7,  ty: 2,  key: 'examine_altar' },
            { tx: 8,  ty: 2,  key: 'examine_altar' },
            { tx: 3,  ty: 4,  key: 'examine_pillar' },
            { tx: 12, ty: 4,  key: 'examine_pillar' },
            { tx: 5,  ty: 7,  key: 'examine_goblin_banner' },
            { tx: 10, ty: 7,  key: 'examine_goblin_banner' }
        ],
        ebon_forest_entry: [
            { tx: 6,  ty: 3,  key: 'examine_bones' }
        ],
        ebon_forest_deep: [
            { tx: 4,  ty: 6,  key: 'examine_bones' },
            { tx: 11, ty: 4,  key: 'examine_rubble' }
        ]
    };

    function checkExamineObjects() {
        if (!Game.player || !Game.currentRoom) return;
        if (Dialogue.isActive()) return;
        if (!Input.pressed['z']) return;

        // Don't trigger examine if near an NPC or enemy
        if (Game.nearNPC) return;

        var roomId = Game.currentRoom.id;
        var examineList = EXAMINE_OBJECTS[roomId];
        if (!examineList) return;

        var px = Game.player.x + Game.player.w / 2;
        var py = Game.player.y + Game.player.h / 2;

        for (var i = 0; i < examineList.length; i++) {
            var obj = examineList[i];
            var ox = obj.tx * TILE + TILE / 2;
            var oy = obj.ty * TILE + TILE / 2;
            var dx = px - ox;
            var dy = py - oy;
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 20) {
                // Check no enemy is in interaction range either
                var enemyNear = false;
                for (var e = 0; e < Game.enemies.length; e++) {
                    if (Game.enemies[e].dead) continue;
                    var ex = Game.enemies[e].x + Game.enemies[e].w / 2;
                    var ey = Game.enemies[e].y + Game.enemies[e].h / 2;
                    var eDist = Math.sqrt((px - ex) * (px - ex) + (py - ey) * (py - ey));
                    if (eDist < 24) { enemyNear = true; break; }
                }
                if (enemyNear) return;

                Dialogue.start(obj.key);
                Audio.play('select');
                return;
            }
        }

        // Also check torch tiles for examine
        if (Game.currentRoom.tiles) {
            var tileX = Math.floor(px / TILE);
            var tileY = Math.floor(py / TILE);
            // Check tiles around player
            for (var dy2 = -1; dy2 <= 1; dy2++) {
                for (var dx2 = -1; dx2 <= 1; dx2++) {
                    var checkX = tileX + dx2;
                    var checkY = tileY + dy2;
                    if (checkX < 0 || checkX >= COLS || checkY < 0 || checkY >= ROWS) continue;
                    var checkTile = Maps.getTile(Game.currentRoom, checkX, checkY);
                    if (checkTile === window.T.TORCH) {
                        var torchCX = checkX * TILE + TILE / 2;
                        var torchCY = checkY * TILE + TILE / 2;
                        var tDist = Math.sqrt((px - torchCX) * (px - torchCX) + (py - torchCY) * (py - torchCY));
                        if (tDist < 20) {
                            Dialogue.start('examine_torch');
                            Audio.play('select');
                            return;
                        }
                    }
                }
            }
        }
    }

    // =====================================================================
    // PASS 7B: PUZZLE ROOM VISUAL ENHANCEMENTS (alcove glows, gem slots)
    // =====================================================================

    function renderPuzzleRoomGlows(ctx) {
        if (!Game.currentRoom || Game.currentRoom.id !== 'temple_puzzle') return;

        var flickerSeed = Game.frame * 0.08;

        // Crown alcove: gold pulsing glow (left side of puzzle room)
        // Cape alcove: purple glow (right side)
        // Scepter alcove: silver/white glow (center/back)
        var alcoves = [
            { tx: 3,  ty: 6,  flag: 'puzzleCrown',   color1: 'rgba(232,184,48,', color2: 'rgba(255,210,80,' },
            { tx: 12, ty: 6,  flag: 'puzzleCape',     color1: 'rgba(122,58,170,', color2: 'rgba(170,106,218,' },
            { tx: 7,  ty: 2,  flag: 'puzzleScepter',  color1: 'rgba(180,180,200,', color2: 'rgba(220,220,240,' }
        ];

        for (var i = 0; i < alcoves.length; i++) {
            var alc = alcoves[i];
            var ax = alc.tx * TILE + TILE / 2;
            var ay = alc.ty * TILE + TILE / 2;

            // If relic collected, extinguish glow
            if (Game.flags[alc.flag]) continue;

            // Pulsing glow alpha
            var pulseAlpha = 0.2 + Math.sin(flickerSeed + i * 2.1) * 0.1;
            var glowRadius = 14 + Math.sin(flickerSeed * 1.3 + i * 1.7) * 3;

            // Outer glow
            var grad = ctx.createRadialGradient(ax, ay, 0, ax, ay, glowRadius);
            grad.addColorStop(0, alc.color2 + (pulseAlpha + 0.1) + ')');
            grad.addColorStop(0.5, alc.color1 + pulseAlpha + ')');
            grad.addColorStop(1, alc.color1 + '0)');
            ctx.fillStyle = grad;
            ctx.fillRect(ax - glowRadius, ay - glowRadius, glowRadius * 2, glowRadius * 2);

            // Inner bright core
            var coreR = 4 + Math.sin(flickerSeed * 2 + i * 3) * 1.5;
            ctx.fillStyle = alc.color2 + '0.15)';
            ctx.fillRect(ax - coreR, ay - coreR, coreR * 2, coreR * 2);
        }

        // Altar pedestal glow: pulsing violet light draws eye to the central altar (now at row 9)
        var altarCX = 7 * TILE + TILE;  // center of the 2 altar tiles
        var altarCY = 9 * TILE + TILE / 2;

        if (!Game.flags.puzzleSolved) {
            // Always show a subtle pedestal glow on the altar
            var pedestalAlpha = 0.08 + Math.sin(flickerSeed * 0.6) * 0.04;
            ctx.globalAlpha = pedestalAlpha;
            ctx.fillStyle = '#8060c0';
            ctx.fillRect(7 * TILE - 2, 9 * TILE - 2, TILE * 2 + 4, TILE + 4);
            ctx.globalAlpha = 1;

            // Statue glow above altar (row 7)
            var statueCY = 7 * TILE + TILE / 2;
            var statueGlow = 0.06 + Math.sin(flickerSeed * 0.4) * 0.03;
            ctx.globalAlpha = statueGlow;
            ctx.fillStyle = '#9070d0';
            ctx.fillRect(7 * TILE - 2, 7 * TILE - 2, TILE * 2 + 4, TILE + 4);
            ctx.globalAlpha = 1;
        }

        // Gem slot indicators on the altar — large and obvious
        var gemSize = 6;
        var gemSpacing = 10;
        var startGemX = altarCX - gemSpacing - gemSize / 2;
        var gemY = altarCY - gemSize / 2;
        var relics = [
            { flag: 'puzzleCrown',   filledColor: C.gold,     emptyColor: '#3a3020' },
            { flag: 'puzzleCape',    filledColor: C.purple,   emptyColor: '#2a1a3a' },
            { flag: 'puzzleScepter', filledColor: C.lightGray, emptyColor: '#2a2a30' }
        ];
        for (var gi = 0; gi < relics.length; gi++) {
            var gx = startGemX + gi * gemSpacing;
            if (Game.flags[relics[gi].flag]) {
                // Filled gem: bright with glow halo
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = relics[gi].filledColor;
                ctx.fillRect(gx - 2, gemY - 2, gemSize + 4, gemSize + 4);
                ctx.globalAlpha = 1;
                ctx.fillStyle = relics[gi].filledColor;
                ctx.fillRect(gx, gemY, gemSize, gemSize);
                // Sparkle highlight
                if (Game.frame % 20 < 4) {
                    ctx.fillStyle = C.white;
                    ctx.fillRect(gx + 1, gemY, 2, 1);
                    ctx.fillRect(gx + gemSize - 2, gemY + gemSize - 1, 1, 1);
                }
                // Border
                ctx.strokeStyle = C.white;
                ctx.lineWidth = 1;
                ctx.strokeRect(gx - 0.5, gemY - 0.5, gemSize + 1, gemSize + 1);
            } else {
                // Empty slot: visible hollow with pulsing border
                ctx.fillStyle = relics[gi].emptyColor;
                ctx.fillRect(gx, gemY, gemSize, gemSize);
                // Dark inner border
                ctx.fillStyle = '#111118';
                ctx.fillRect(gx + 1, gemY + 1, gemSize - 2, gemSize - 2);
                // Pulsing bright border
                var slotPulse = 0.4 + Math.sin(flickerSeed * 1.5 + gi * 2.1) * 0.25;
                ctx.globalAlpha = slotPulse;
                ctx.strokeStyle = '#b090e0';
                ctx.lineWidth = 1;
                ctx.strokeRect(gx - 0.5, gemY - 0.5, gemSize + 1, gemSize + 1);
                ctx.globalAlpha = 1;
            }
        }

        // When all relics collected but not placed: strong "come here" glow on altar
        if (Game.flags.puzzleCrown && Game.flags.puzzleCape && Game.flags.puzzleScepter && !Game.flags.puzzleSolved) {
            var beckAlpha = 0.15 + Math.sin(flickerSeed * 0.8) * 0.08;
            var beckR = 20 + Math.sin(flickerSeed * 1.2) * 4;
            var grad2 = ctx.createRadialGradient(altarCX, altarCY, 0, altarCX, altarCY, beckR);
            grad2.addColorStop(0, 'rgba(180,140,255,' + (beckAlpha + 0.1) + ')');
            grad2.addColorStop(0.6, 'rgba(120,80,200,' + beckAlpha + ')');
            grad2.addColorStop(1, 'rgba(80,40,160,0)');
            ctx.fillStyle = grad2;
            ctx.fillRect(altarCX - beckR, altarCY - beckR, beckR * 2, beckR * 2);
            // Rising sparkle particles from altar
            if (Game.frame % 12 === 0) {
                Particles.add(altarCX + (Math.random() - 0.5) * 20, altarCY + 4, {
                    vx: (Math.random() - 0.5) * 0.2, vy: -0.4,
                    life: 30, color: '#b090e0', size: 1, gravity: -0.01
                });
            }
        }
    }

    // =====================================================================
    // PASS 7A: DESTRUCTIBLE OBJECTS UPDATE/RENDER
    // =====================================================================

    function updateDestructibles() {
        for (var i = Game.destructibles.length - 1; i >= 0; i--) {
            var d = Game.destructibles[i];
            d.update();
            if (d.dead) {
                Game.destructibles.splice(i, 1);
            }
        }
    }

    function renderDestructibles(ctx) {
        for (var i = 0; i < Game.destructibles.length; i++) {
            Game.destructibles[i].render(ctx);
        }
    }

    function checkDestructibleCombat() {
        if (!Game.player || !Game.player.attacking || !Game.player.attackHitbox || Game.player.attackDealt) return;
        for (var i = 0; i < Game.destructibles.length; i++) {
            var d = Game.destructibles[i];
            if (d.dead) continue;
            var dBox = { x: d.x, y: d.y, w: d.w, h: d.h };
            if (Utils.aabb(Game.player.attackHitbox, dBox)) {
                var atkDmg = (Game.player.characterId === 'daxon') ? 3 : 2;
                d.takeDamage(atkDmg, Game.player.x + Game.player.w / 2, Game.player.y + Game.player.h / 2);
                Game.player.attackDealt = true;
                Game.player.hitstop = 2;
                Game.player._hitShake = 1;
                break;
            }
        }
    }

    // =====================================================================
    // PASS 8B: TORCH FLAME REACT
    // =====================================================================

    function updateTorchReacts() {
        if (!Game.player || !Game.currentRoom) return;

        var px = Game.player.x + Game.player.w / 2;
        var py = Game.player.y + Game.player.h / 2;

        // Check proximity to torch tiles
        if (Game.currentRoom.tiles && Game.player.moving) {
            var torches = getTorchPositions(Game.currentRoom);
            for (var i = 0; i < torches.length; i++) {
                var t = torches[i];
                var dx = px - t.x;
                var dy = py - t.y;
                var dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 24) {
                    // Check if this torch already has an active react
                    var col = Math.floor(t.x / TILE);
                    var row = Math.floor(t.y / TILE);
                    var hasReact = false;
                    for (var j = 0; j < Game.torchReacts.length; j++) {
                        if (Game.torchReacts[j].col === col && Game.torchReacts[j].row === row) {
                            hasReact = true;
                            break;
                        }
                    }
                    if (!hasReact) {
                        // Direction: flame leans away from player
                        var leanDir = dx > 0 ? -1 : 1;
                        Game.torchReacts.push({
                            col: col,
                            row: row,
                            dir: leanDir,
                            timer: 12    // 6 frames lean + 6 frames spring back
                        });
                    }
                }
            }
        }

        // Update torch react timers
        for (var k = Game.torchReacts.length - 1; k >= 0; k--) {
            Game.torchReacts[k].timer--;
            if (Game.torchReacts[k].timer <= 0) {
                Game.torchReacts.splice(k, 1);
            }
        }

        // Cap torch reacts
        if (Game.torchReacts.length > 20) {
            Game.torchReacts = Game.torchReacts.slice(-20);
        }
    }

    function renderTorchReacts(ctx) {
        for (var i = 0; i < Game.torchReacts.length; i++) {
            var tr = Game.torchReacts[i];
            var tx = tr.col * TILE;
            var ty = tr.row * TILE;

            // Calculate lean offset: first 6 frames lean, last 6 spring back
            var leanAmount;
            if (tr.timer > 6) {
                // Leaning phase (frames 12-7): increasing lean
                leanAmount = (12 - tr.timer) / 6;
            } else {
                // Spring back phase (frames 6-1): decreasing lean
                leanAmount = tr.timer / 6;
            }

            var offsetX = Math.floor(tr.dir * leanAmount * 3);

            // Draw flame lean overlay (orange/yellow shifted pixels)
            ctx.fillStyle = '#ff9920';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(tx + 5 + offsetX, ty + 1, 4, 4);
            ctx.fillStyle = '#ffcc40';
            ctx.globalAlpha = 0.4;
            ctx.fillRect(tx + 6 + offsetX, ty + 2, 2, 2);
            ctx.globalAlpha = 1;
        }
    }

    // =====================================================================
    // PASS 8B: DOOR OPEN ANIMATION
    // =====================================================================

    function renderDoorAnimation(ctx) {
        if (Game.doorAnimTimer <= 0) return;
        Game.doorAnimTimer--;

        // Find door tiles in the current room
        if (!Game.currentRoom || !Game.currentRoom.tiles) return;

        var openProgress = (4 - Game.doorAnimTimer) / 4; // 0 to 1 over 4 frames

        for (var row = 0; row < ROWS; row++) {
            for (var col = 0; col < COLS; col++) {
                var tileId = Maps.getTile(Game.currentRoom, col, row);
                if (tileId === window.T.WOOD_DOOR || tileId === window.T.TEMPLE_DOOR) {
                    var dx = col * TILE;
                    var dy = row * TILE;

                    // Progressive door opening: draw dark overlay that slides open
                    var doorHalf = Math.floor(TILE / 2 * (1 - openProgress));
                    if (doorHalf > 0) {
                        ctx.fillStyle = tileId === window.T.TEMPLE_DOOR ? '#2a2a35' : '#4a3020';
                        // Left half closes from center
                        ctx.fillRect(dx, dy, doorHalf, TILE);
                        // Right half closes from center
                        ctx.fillRect(dx + TILE - doorHalf, dy, doorHalf, TILE);
                    }
                }
            }
        }
    }

    // =====================================================================
    // AMBIENT SOUNDS
    // =====================================================================

    function updateAmbientSounds() {
        if (!Game.currentRoom) return;
        var roomId = Game.currentRoom.id;

        // Forest: occasional bird chirps + crickets
        if (roomId && roomId.indexOf('ebon_forest') === 0) {
            if (Game.frame % 180 === 0 && Math.random() < 0.5) {
                Audio.play('bird');
            }
            if (Game.frame % 300 === 0 && Math.random() < 0.3) {
                Audio.play('wind');
            }
            // Pass 3D: Cricket ambient every ~4 seconds
            if (Game.frame % 240 === 0 && Math.random() < 0.6) {
                Audio.play('cricket');
            }
        }

        // Temple: water drips (echo)
        if (roomId && roomId.indexOf('temple') === 0) {
            if (Game.frame % 120 === 0 && Math.random() < 0.4) {
                Audio.play('drip');
            }
        }

        // Town: crowd murmur ambient
        if (roomId && roomId.indexOf('ebon_vale') === 0) {
            if (Game.frame % 360 === 0 && Math.random() < 0.3) {
                Audio.play('murmur');
            }
        }

        // Pass 3D: Low health heartbeat (60 BPM = every 60 frames)
        if (Game.player && Game.player.hp <= 2 && Game.player.hp > 0) {
            if (Game.frame % 60 === 0) {
                Audio.play('heartbeat');
            }
            // Dip music volume at low HP
            if (Music && Game.frame % 60 === 0) {
                Music.dipVolume(0.4, 0.3);
            }
        } else if (Game.player && Game.player.hp > 2) {
            // Restore volume when healthy
            if (Music && Game.frame % 120 === 0 && Game._lowHPMusicDipped) {
                Music.restoreVolume();
                Game._lowHPMusicDipped = false;
            }
            if (Game.player.hp <= 2) Game._lowHPMusicDipped = true;
        }

        // Pass 3D: Terrain-specific footsteps (every 12 frames while moving)
        if (Game.player && Game.player.moving && Game.frame % 12 === 0) {
            var charId = Game.player.characterId;
            var terrain = getTerrainType(roomId);
            // Pass 8C: Character-specific pitch
            if (charId === 'daxon') {
                Audio.play('footstep_heavy');
            } else if (charId === 'luigi') {
                Audio.play('footstep_shuffle');
            } else if (charId === 'lirielle') {
                Audio.play('footstep_light');
            } else if (terrain === 'stone') {
                Audio.play('footstep_stone');
            } else if (terrain === 'wood') {
                Audio.play('footstep_wood');
            } else if (terrain === 'grass') {
                Audio.play('footstep_grass');
            } else {
                Audio.play('footstep');
            }
        }
    }

    function getTerrainType(roomId) {
        if (!roomId) return 'grass';
        if (roomId.indexOf('temple') === 0) return 'stone';
        if (roomId.indexOf('ebon_forest') === 0) return 'grass';
        if (roomId.indexOf('ebon_vale_market') === 0) return 'wood';
        return 'grass';
    }

    // =====================================================================
    // HEART DROP LOGIC
    // =====================================================================

    function updateHeartDrops() {
        if (!Game.player) return;

        for (var i = Game.heartDrops.length - 1; i >= 0; i--) {
            var hd = Game.heartDrops[i];

            // Bob animation
            hd.bobTimer = (hd.bobTimer || 0) + 1;

            // Despawn timer
            hd.life = (hd.life || 300) - 1;
            if (hd.life <= 0) {
                Game.heartDrops.splice(i, 1);
                continue;
            }

            // Check pickup by player
            var d = Utils.dist(
                { x: Game.player.x + 8, y: Game.player.y + 8 },
                { x: hd.x + 4, y: hd.y + 4 }
            );

            if (d < 14) {
                // Heal 1 heart (2 HP)
                var hpBefore = Game.player.hp;
                if (Game.player.hp < Game.player.maxHp) {
                    Game.player.hp = Math.min(Game.player.hp + 2, Game.player.maxHp);
                }
                // Trigger heal animation timer for the affected heart index
                if (Game.player.hp > hpBefore) {
                    var healedHeartIdx = Math.floor(hpBefore / 2);
                    while (Game._healAnimTimers.length <= healedHeartIdx + 1) {
                        Game._healAnimTimers.push(0);
                    }
                    Game._healAnimTimers[healedHeartIdx] = 15;
                    if (healedHeartIdx + 1 < Game._healAnimTimers.length) {
                        Game._healAnimTimers[healedHeartIdx + 1] = 15;
                    }
                }
                Audio.play('pickup');
                Particles.sparkle(hd.x + 4, hd.y + 4, C.lightRed);
                Game.heartDrops.splice(i, 1);
            }
        }
    }

    function spawnHeartDrop(x, y) {
        // Pass 7E: Legend difficulty — no heart drops from enemies
        if (Game.difficulty === 2) return;
        Game.heartDrops.push({
            x: x,
            y: y,
            bobTimer: 0,
            life: 300
        });
    }

    // Expose spawnHeartDrop on Game for Destructible entities (Pass 7A)
    Game.spawnHeartDrop = spawnHeartDrop;

    // =====================================================================
    // ENEMY DEATH & DROPS
    // =====================================================================

    function checkDeadEnemies() {
        for (var i = Game.enemies.length - 1; i >= 0; i--) {
            var enemy = Game.enemies[i];
            if (enemy.dead && (!enemy.deathTimer || enemy.deathTimer <= 0)) {
                // Use the entity's own drop flag (set in die() at 30% chance)
                if (enemy._dropItem) {
                    spawnHeartDrop(enemy._dropItem.x, enemy._dropItem.y);
                }
                Game.enemiesDefeated++;
                // Drop goblin teeth (currency) from goblin-type enemies
                if (enemy.type === 'goblin' || enemy.type === 'goblin_archer') {
                    Game.goblinTeeth += 1;
                } else if (enemy.type === 'spinecleaver') {
                    Game.goblinTeeth += 2;
                }
                Game.enemies.splice(i, 1);
            }
        }

        // Check if room is cleared
        if (Game.currentRoom && Game.enemies.length === 0 &&
            Game.currentRoom.enemies && Game.currentRoom.enemies.length > 0 &&
            !Game.clearedRooms[Game.currentRoom.id]) {
            Game.clearedRooms[Game.currentRoom.id] = true;
        }
    }

    // =====================================================================
    // LUIGI'S BROG SPECIAL
    // =====================================================================

    function handleBrogSpecial() {
        if (!Game.player || !Game.player._pendingProjectile) return;

        Game.player._pendingProjectile = false;

        // Find nearest non-dead enemy
        var target = null;
        var minDist = Infinity;

        var allTargets = Game.enemies.slice();
        if (Game.boss && !Game.boss.dead) {
            allTargets.push(Game.boss);
        }

        for (var i = 0; i < allTargets.length; i++) {
            var e = allTargets[i];
            if (e.dead) continue;
            var d = Utils.dist(
                { x: Game.player.x, y: Game.player.y },
                { x: e.x, y: e.y }
            );
            if (d < minDist) {
                minDist = d;
                target = e;
            }
        }

        // Create burst of teal particles from player toward target
        var tx = Game.player.x + 8;
        var ty = Game.player.y + 8;

        if (target) {
            var dx = target.x + 8 - tx;
            var dy = target.y + 8 - ty;
            var dist = Math.sqrt(dx * dx + dy * dy) || 1;
            var nx = dx / dist;
            var ny = dy / dist;

            for (var p = 0; p < 12; p++) {
                var speed = 2 + Math.random() * 3;
                Particles.add(tx, ty, {
                    vx: nx * speed + (Math.random() - 0.5) * 1.5,
                    vy: ny * speed + (Math.random() - 0.5) * 1.5,
                    life: 20 + Math.floor(Math.random() * 10),
                    color: Math.random() > 0.5 ? C.teal : C.darkTeal,
                    size: 2,
                    gravity: 0
                });
            }

            // Set up delayed damage
            Game.brogTarget = target;
            Game.brogTimer = 15;
            Game.brogActive = true;
        } else {
            // No target, just particles
            for (var p2 = 0; p2 < 12; p2++) {
                var angle = Math.random() * Math.PI * 2;
                var spd = 1 + Math.random() * 2;
                Particles.add(tx, ty, {
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd,
                    life: 20,
                    color: C.teal,
                    size: 2,
                    gravity: 0
                });
            }
        }
    }

    function updateBrogDamage() {
        if (!Game.brogActive) return;

        Game.brogTimer--;
        if (Game.brogTimer <= 0) {
            Game.brogActive = false;
            if (Game.brogTarget && !Game.brogTarget.dead) {
                // Deal 4 damage
                Game.brogTarget.hp = (Game.brogTarget.hp || 0) - 4;
                if (Game.brogTarget.hp <= 0) {
                    Game.brogTarget.dead = true;
                    Game.brogTarget.deathTimer = 30;
                    Audio.play('death');
                    Particles.burst(Game.brogTarget.x + 8, Game.brogTarget.y + 8, 12, C.teal);
                } else {
                    Audio.play('hit');
                    Particles.burst(Game.brogTarget.x + 8, Game.brogTarget.y + 8, 6, C.teal);
                }
                Game.shake = 2;
            }
            Game.brogTarget = null;
        }
    }

    // =====================================================================
    // DAXON'S SHIELD SLAM SHOCKWAVE
    // =====================================================================

    function handleDaxonShockwave() {
        if (!Game.player || !Game.player._pendingShockwave) return;
        Game.player._pendingShockwave = false;

        var px = Game.player.x + Game.player.w / 2;
        var py = Game.player.y + Game.player.h / 2;
        var shockRadius = 40; // pixels
        var shockDmg = 2;

        // Damage all enemies in radius
        var allTargets = Game.enemies.slice();
        if (Game.boss && !Game.boss.dead) allTargets.push(Game.boss);

        for (var i = 0; i < allTargets.length; i++) {
            var e = allTargets[i];
            if (e.dead) continue;
            var ex = e.x + (e.w || 12) / 2;
            var ey = e.y + (e.h || 12) / 2;
            var dist = Math.sqrt((px - ex) * (px - ex) + (py - ey) * (py - ey));
            if (dist < shockRadius) {
                if (e.takeDamage) {
                    e.takeDamage(shockDmg, px, py);
                } else {
                    e.hp -= shockDmg;
                    if (e.hp <= 0) { e.dead = true; e.deathTimer = 30; }
                }
                Particles.burst(ex, ey, 6, C.lightBlue);
            }
        }

        Game.shake = 4;
    }

    // =====================================================================
    // LIRIELLE'S NATURE BURST
    // =====================================================================

    function handleLirielleNatureBurst() {
        if (!Game.player || !Game.player._pendingNatureBurst) return;
        Game.player._pendingNatureBurst = false;

        var px = Game.player.x + Game.player.w / 2;
        var py = Game.player.y + Game.player.h / 2;
        var burstRadius = 36; // pixels
        var burstDmg = 3;

        // Damage all enemies in radius
        var allTargets = Game.enemies.slice();
        if (Game.boss && !Game.boss.dead) allTargets.push(Game.boss);

        for (var i = 0; i < allTargets.length; i++) {
            var e = allTargets[i];
            if (e.dead) continue;
            var ex = e.x + (e.w || 12) / 2;
            var ey = e.y + (e.h || 12) / 2;
            var dist = Math.sqrt((px - ex) * (px - ex) + (py - ey) * (py - ey));
            if (dist < burstRadius) {
                if (e.takeDamage) {
                    e.takeDamage(burstDmg, px, py);
                } else {
                    e.hp -= burstDmg;
                    if (e.hp <= 0) { e.dead = true; e.deathTimer = 30; }
                }
                Particles.burst(ex, ey, 6, C.green);
                // Thorn impact particles
                Particles.add(ex, ey, { vx: 0, vy: -1, life: 12, color: '#88dd44', size: 2, gravity: 0 });
            }
        }

        Game.shake = 2;
    }

    // =====================================================================
    // SPECIAL ROOM EVENTS
    // =====================================================================

    function checkSpecialRoomEvents() {
        if (!Game.currentRoom) return;

        // Temple boss room - spawn boss on first entry
        if (Game.currentRoom.id === 'temple_boss' && !Game.flags.bossDefeated && !Game.boss) {
            if (Game.state === 'game') {
                Game.state = 'boss_intro';
                Game.bossDialogueStage = 0;
                Game.encounteredEnemies['boss'] = true; // Bestiary
                if (Music) Music.stop();
                Dialogue.start('boss_intro', function () {
                    // Spawn boss at center of room
                    try {
                        Game.boss = new Entities.Boss(7 * TILE, 6 * TILE);
                    } catch (e) {
                        console.warn('Error creating boss:', e);
                    }
                    Game.state = 'boss';
                    if (Music) Music.play('boss');
                });
            }
        }
    }

    // =====================================================================
    // GAME OVER CHECK
    // =====================================================================

    function checkGameOver() {
        if (!Game.player) return;
        if (Game.player.hp <= 0 && Game.state !== 'gameover') {
            Game.state = 'gameover';
            Game.gameOverTimer = 0;
            Game.gameOverMenuIndex = 0;
            Audio.play('death');
            // Pass 6F: Stop music, play mournful sting after brief pause
            if (Music) Music.stop();
            setTimeout(function () { Audio.play('gameover_sting'); }, 400);
        }
    }

    // =====================================================================
    // WEATHER / AMBIENT PARTICLES
    // =====================================================================

    // =====================================================================
    // ENVIRONMENTAL PARTICLE SYSTEMS
    // =====================================================================

    // --- Forest Falling Leaves (persistent array, not Particles system) ---
    var _leafParticles = [];
    var _leafWindDir = 1;       // 1 = right, -1 = left
    var _leafWindTimer = 0;

    function initLeaves() {
        _leafParticles = [];
        var leafColors = [C.green, C.darkGreen, C.brown, C.lightBrown, '#c07020'];
        for (var i = 0; i < 10; i++) {
            _leafParticles.push({
                x: Utils.randInt(0, W),
                y: Utils.randInt(-20, H),
                phase: Math.random() * Math.PI * 2,  // sin-wave x offset phase
                speed: 0.3 + Math.random() * 0.3,    // fall speed
                drift: 0.4 + Math.random() * 0.3,    // sin amplitude for x drift
                color: Utils.choice(leafColors),
                w: 2,
                h: 3
            });
        }
    }

    function updateLeaves() {
        // Wind direction shifts every 120 frames
        _leafWindTimer++;
        if (_leafWindTimer >= 120) {
            _leafWindTimer = 0;
            _leafWindDir = -_leafWindDir;
        }

        for (var i = 0; i < _leafParticles.length; i++) {
            var lf = _leafParticles[i];
            // Sine-wave horizontal drift + wind bias
            lf.x += Math.sin(lf.phase + Game.frame * 0.04) * lf.drift * 0.3 + _leafWindDir * 0.15;
            lf.y += lf.speed;
            lf.phase += 0.02;

            // Reset when leaf falls off screen
            if (lf.y > H + 10 || lf.x < -20 || lf.x > W + 20) {
                var leafColors = [C.green, C.darkGreen, C.brown, C.lightBrown, '#c07020'];
                lf.x = Utils.randInt(-10, W + 10);
                lf.y = -Utils.randInt(5, 20);
                lf.phase = Math.random() * Math.PI * 2;
                lf.speed = 0.3 + Math.random() * 0.3;
                lf.drift = 0.4 + Math.random() * 0.3;
                lf.color = Utils.choice(leafColors);
            }
        }
    }

    function renderLeaves(ctx) {
        for (var i = 0; i < _leafParticles.length; i++) {
            var lf = _leafParticles[i];
            ctx.fillStyle = lf.color;
            ctx.fillRect(Math.floor(lf.x), Math.floor(lf.y), lf.w, lf.h);
        }
    }

    // --- Town Dust Motes ---
    var _dustMotes = [];

    function initDustMotes() {
        _dustMotes = [];
        for (var i = 0; i < 5; i++) {
            _dustMotes.push({
                x: Utils.randInt(16, W - 16),
                y: Utils.randInt(20, H),
                vy: -(0.1 + Math.random() * 0.15),
                vx: (Math.random() - 0.5) * 0.2,
                phase: Math.random() * Math.PI * 2,
                life: Utils.randInt(120, 240)
            });
        }
    }

    function updateDustMotes() {
        for (var i = 0; i < _dustMotes.length; i++) {
            var dm = _dustMotes[i];
            dm.x += dm.vx + Math.sin(dm.phase + Game.frame * 0.02) * 0.1;
            dm.y += dm.vy;
            dm.life--;
            if (dm.life <= 0 || dm.y < -5) {
                dm.x = Utils.randInt(16, W - 16);
                dm.y = Utils.randInt(H * 0.5, H);
                dm.vy = -(0.1 + Math.random() * 0.15);
                dm.vx = (Math.random() - 0.5) * 0.2;
                dm.phase = Math.random() * Math.PI * 2;
                dm.life = Utils.randInt(120, 240);
            }
        }
    }

    function renderDustMotes(ctx) {
        for (var i = 0; i < _dustMotes.length; i++) {
            var dm = _dustMotes[i];
            var alpha = Math.min(0.5, dm.life / 60);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = C.white;
            ctx.fillRect(Math.floor(dm.x), Math.floor(dm.y), 1, 1);
        }
        ctx.globalAlpha = 1;
    }

    // --- Temple Ember Particles (near torches) ---
    var _emberParticles = [];

    function initEmbers(room) {
        _emberParticles = [];
        var torches = getTorchPositions(room);
        // 2 embers per torch
        for (var t = 0; t < torches.length; t++) {
            for (var i = 0; i < 2; i++) {
                _emberParticles.push({
                    x: torches[t].x + (Math.random() - 0.5) * 10,
                    y: torches[t].y,
                    baseX: torches[t].x,
                    baseY: torches[t].y,
                    vy: -(0.2 + Math.random() * 0.3),
                    vx: (Math.random() - 0.5) * 0.3,
                    life: Utils.randInt(40, 80),
                    maxLife: 80
                });
            }
        }
    }

    function updateEmbers(room) {
        var torches = getTorchPositions(room);
        for (var i = 0; i < _emberParticles.length; i++) {
            var em = _emberParticles[i];
            em.x += em.vx + (Math.random() - 0.5) * 0.2;
            em.y += em.vy;
            em.life--;
            if (em.life <= 0) {
                // Respawn near a random torch
                var src = torches.length > 0 ? torches[Utils.randInt(0, torches.length - 1)] : { x: W / 2, y: H / 2 };
                em.x = src.x + (Math.random() - 0.5) * 12;
                em.y = src.y - Math.random() * 4;
                em.baseX = src.x;
                em.baseY = src.y;
                em.vy = -(0.2 + Math.random() * 0.3);
                em.vx = (Math.random() - 0.5) * 0.3;
                em.life = Utils.randInt(40, 80);
            }
        }
    }

    function renderEmbers(ctx) {
        for (var i = 0; i < _emberParticles.length; i++) {
            var em = _emberParticles[i];
            var alpha = Math.min(0.8, em.life / 20);
            ctx.globalAlpha = alpha;
            // Orange-yellow ember color
            ctx.fillStyle = Math.random() > 0.5 ? C.gold : '#ff8030';
            ctx.fillRect(Math.floor(em.x), Math.floor(em.y), 1, 1);
        }
        ctx.globalAlpha = 1;
    }

    // --- Boss Room: Purple Energy Wisps orbiting pillars ---
    var _bossWisps = [];
    // Pillar positions in boss room (diamond pattern from map data)
    var _bossPillars = [
        { x: 7 * TILE + TILE / 2, y: 4 * TILE + TILE / 2 },   // top
        { x: 4 * TILE + TILE / 2, y: 6 * TILE + TILE / 2 },   // left
        { x: 11 * TILE + TILE / 2, y: 6 * TILE + TILE / 2 },  // right
        { x: 8 * TILE + TILE / 2, y: 8 * TILE + TILE / 2 }    // bottom
    ];

    function initBossWisps() {
        _bossWisps = [];
        for (var i = 0; i < _bossPillars.length; i++) {
            // 2 wisps per pillar
            for (var w = 0; w < 2; w++) {
                _bossWisps.push({
                    pillarIdx: i,
                    angle: Math.random() * Math.PI * 2,
                    radius: 12 + Math.random() * 6,
                    speed: 0.03 + Math.random() * 0.02,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }
    }

    function updateBossWisps() {
        // Accelerate wisps in boss phase 3
        var speedMult = (Game.boss && Game.boss.phase >= 3) ? 2.5 : 1.0;
        for (var i = 0; i < _bossWisps.length; i++) {
            var bw = _bossWisps[i];
            bw.angle += bw.speed * speedMult;
        }
    }

    function renderBossWisps(ctx) {
        for (var i = 0; i < _bossWisps.length; i++) {
            var bw = _bossWisps[i];
            var pil = _bossPillars[bw.pillarIdx];
            var wx = pil.x + Math.cos(bw.angle) * bw.radius;
            var wy = pil.y + Math.sin(bw.angle) * bw.radius;
            var alpha = 0.5 + Math.sin(bw.phase + Game.frame * 0.08) * 0.3;
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            ctx.fillStyle = C.purple;
            ctx.fillRect(Math.floor(wx), Math.floor(wy), 2, 2);
            // Subtle trail
            ctx.globalAlpha = Math.max(0, alpha * 0.3);
            ctx.fillStyle = C.lightPurple;
            var trailX = pil.x + Math.cos(bw.angle - 0.3) * bw.radius;
            var trailY = pil.y + Math.sin(bw.angle - 0.3) * bw.radius;
            ctx.fillRect(Math.floor(trailX), Math.floor(trailY), 1, 1);
        }
        ctx.globalAlpha = 1;
    }

    // --- Deep Forest Fireflies ---
    var _fireflies = [];

    function initFireflies() {
        _fireflies = [];
        for (var i = 0; i < 6; i++) {
            _fireflies.push({
                x: Utils.randInt(20, W - 20),
                y: Utils.randInt(30, H - 30),
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function updateFireflies() {
        for (var i = 0; i < _fireflies.length; i++) {
            var ff = _fireflies[i];
            ff.x += ff.vx + (Math.random() - 0.5) * 0.15;
            ff.y += ff.vy + (Math.random() - 0.5) * 0.15;
            // Gently bound to screen
            if (ff.x < 16) ff.vx = Math.abs(ff.vx);
            if (ff.x > W - 16) ff.vx = -Math.abs(ff.vx);
            if (ff.y < 16) ff.vy = Math.abs(ff.vy);
            if (ff.y > H - 16) ff.vy = -Math.abs(ff.vy);
        }
    }

    function renderFireflies(ctx) {
        for (var i = 0; i < _fireflies.length; i++) {
            var ff = _fireflies[i];
            // Sin-wave alpha pulse
            var alpha = 0.4 + Math.sin(ff.phase + Game.frame * 0.06 + i * 1.5) * 0.4;
            alpha = Math.max(0, Math.min(1, alpha));
            ctx.globalAlpha = alpha;
            ctx.fillStyle = C.yellow;
            ctx.fillRect(Math.floor(ff.x), Math.floor(ff.y), 2, 2);
        }
        ctx.globalAlpha = 1;
    }

    // --- Environment init tracking ---
    var _envInitRoom = null;

    function ensureEnvInit(roomId, room) {
        if (_envInitRoom === roomId) return;
        _envInitRoom = roomId;

        // Initialize particles for the current room type
        if (roomId && roomId.indexOf('ebon_forest') === 0) {
            initLeaves();
            if (roomId === 'ebon_forest_deep') {
                initFireflies();
            }
        }
        if (roomId && roomId.indexOf('ebon_vale') === 0) {
            initDustMotes();
        }
        if (roomId && isTempleRoom(roomId) && roomId !== 'temple_boss') {
            initEmbers(room);
        }
        if (roomId === 'temple_boss') {
            initEmbers(room);
            initBossWisps();
        }
    }

    function updateWeather() {
        if (!Game.currentRoom) return;
        var roomId = Game.currentRoom.id;

        // Ensure environmental particles are initialized for this room
        ensureEnvInit(roomId, Game.currentRoom);

        // Forest: falling leaves (persistent leaf system, all forest rooms)
        if (roomId && roomId.indexOf('ebon_forest') === 0) {
            updateLeaves();
            // Deep forest: fireflies
            if (roomId === 'ebon_forest_deep') {
                updateFireflies();
            }
        }

        // Town rooms: dust motes drifting upward
        if (roomId && roomId.indexOf('ebon_vale') === 0) {
            updateDustMotes();
        }

        // Temple rooms: ember particles near torches
        if (roomId && isTempleRoom(roomId)) {
            updateEmbers(Game.currentRoom);
        }

        // Boss room: purple energy wisps orbiting pillars
        if (roomId === 'temple_boss') {
            updateBossWisps();
        }
    }

    // Render environmental particles (called from render functions)
    function renderEnvironmentParticles(ctx) {
        if (!Game.currentRoom) return;
        var roomId = Game.currentRoom.id;

        if (roomId && roomId.indexOf('ebon_forest') === 0) {
            renderLeaves(ctx);
            if (roomId === 'ebon_forest_deep') {
                renderFireflies(ctx);
            }
        }

        if (roomId && roomId.indexOf('ebon_vale') === 0) {
            renderDustMotes(ctx);
        }

        if (roomId && isTempleRoom(roomId)) {
            renderEmbers(ctx);
        }

        if (roomId === 'temple_boss') {
            renderBossWisps(ctx);
        }
    }

    // =====================================================================
    // TEMPLE LIGHTING SYSTEM
    // =====================================================================

    // Cache torch positions per room to avoid scanning every frame
    var _torchCache = {};

    function getTorchPositions(room) {
        if (!room || !room.tiles) return [];
        if (_torchCache[room.id]) return _torchCache[room.id];

        var torches = [];
        var T = window.T;
        for (var row = 0; row < ROWS; row++) {
            for (var col = 0; col < COLS; col++) {
                if (room.tiles[row][col] === T.TORCH) {
                    torches.push({
                        x: col * TILE + TILE / 2,
                        y: row * TILE + TILE / 2
                    });
                }
            }
        }
        _torchCache[room.id] = torches;
        return torches;
    }

    function isTempleRoom(roomId) {
        return roomId && roomId.indexOf('temple') === 0;
    }

    function renderTorchGlow(ctx, room) {
        if (!room || !isTempleRoom(room.id)) return;

        var torches = getTorchPositions(room);
        var flickerSeed = Game.frame * 0.12;

        // Draw torch glow circles (warm light around each torch)
        for (var i = 0; i < torches.length; i++) {
            var tx = torches[i].x;
            var ty = torches[i].y;
            // Pulsing radius 24-32px using sin wave (matches darkness cutout)
            var flickerR = 28 + Math.sin(flickerSeed + i * 2.5) * 4;
            // Random jitter ±2px for flicker
            flickerR += (Math.random() - 0.5) * 4;
            var flickerA = 0.14 + Math.sin(flickerSeed * 1.3 + i) * 0.05;

            // Warm glow gradient — two-layer for richer look
            var grad = ctx.createRadialGradient(tx, ty, 0, tx, ty, flickerR);
            grad.addColorStop(0, 'rgba(255,210,90,' + (flickerA + 0.08) + ')');
            grad.addColorStop(0.35, 'rgba(255,160,50,' + (flickerA + 0.03) + ')');
            grad.addColorStop(0.7, 'rgba(255,100,20,' + (flickerA * 0.5) + ')');
            grad.addColorStop(1, 'rgba(255,80,10,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(tx - flickerR, ty - flickerR, flickerR * 2, flickerR * 2);

            // Inner bright core for added flicker punch
            var coreR = 6 + Math.sin(flickerSeed * 2.1 + i * 3.7) * 2;
            var coreA = 0.10 + Math.sin(flickerSeed * 1.7 + i * 1.3) * 0.04;
            var coreGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, coreR);
            coreGrad.addColorStop(0, 'rgba(255,240,180,' + coreA + ')');
            coreGrad.addColorStop(1, 'rgba(255,200,100,0)');
            ctx.fillStyle = coreGrad;
            ctx.fillRect(tx - coreR, ty - coreR, coreR * 2, coreR * 2);
        }
    }

    // Reusable offscreen canvas for darkness overlay (avoid creating each frame)
    var _darknessCanvas = null;
    var _darknessCtx = null;

    function getDarknessCanvas() {
        if (!_darknessCanvas) {
            _darknessCanvas = document.createElement('canvas');
            _darknessCanvas.width = W;
            _darknessCanvas.height = H;
            _darknessCtx = _darknessCanvas.getContext('2d');
        }
        return { canvas: _darknessCanvas, ctx: _darknessCtx };
    }

    function renderDarknessOverlay(ctx, room) {
        if (!room || !isTempleRoom(room.id)) return;

        var torches = getTorchPositions(room);
        var flickerSeed = Game.frame * 0.12;

        // Reuse offscreen canvas for the darkness mask
        var dc = getDarknessCanvas();
        var dCtx = dc.ctx;

        // Clear and fill with 80% opacity darkness
        dCtx.globalCompositeOperation = 'source-over';
        dCtx.clearRect(0, 0, W, H);
        dCtx.fillStyle = 'rgba(0,0,10,0.80)';
        dCtx.fillRect(0, 0, W, H);

        // Cut out light circles using destination-out compositing
        dCtx.globalCompositeOperation = 'destination-out';

        // Light around each torch: pulsing radius 24-32px via sin wave, ±2px random jitter
        for (var i = 0; i < torches.length; i++) {
            var tx = torches[i].x;
            var ty = torches[i].y;
            // Base pulsing radius: oscillates between 24 and 32 using sin wave
            var pulseR = 28 + Math.sin(flickerSeed + i * 2.5) * 4;
            // Random jitter ±2px each frame for flicker effect
            var jitter = (Math.random() - 0.5) * 4; // -2 to +2
            var lr = pulseR + jitter;

            var grad = dCtx.createRadialGradient(tx, ty, 0, tx, ty, lr);
            grad.addColorStop(0, 'rgba(0,0,0,1)');
            grad.addColorStop(0.5, 'rgba(0,0,0,0.8)');
            grad.addColorStop(0.8, 'rgba(0,0,0,0.3)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            dCtx.fillStyle = grad;
            dCtx.beginPath();
            dCtx.arc(tx, ty, lr, 0, Math.PI * 2);
            dCtx.fill();
        }

        // Light around the player: 40px radius, shrinks to 28px at low HP
        if (Game.player) {
            var px = Game.player.x + Game.player.w / 2;
            var py = Game.player.y + Game.player.h / 2;
            // Player light shrinks as HP drops: 40px at full, 28px at 0 HP
            var hpRatio = Game.player.maxHp > 0 ? (Game.player.hp / Game.player.maxHp) : 0;
            hpRatio = Math.max(0, Math.min(1, hpRatio));
            var pr = 28 + hpRatio * 12; // 28 at 0hp, 40 at full hp

            var pGrad = dCtx.createRadialGradient(px, py, 0, px, py, pr);
            pGrad.addColorStop(0, 'rgba(0,0,0,1)');
            pGrad.addColorStop(0.4, 'rgba(0,0,0,0.85)');
            pGrad.addColorStop(0.75, 'rgba(0,0,0,0.3)');
            pGrad.addColorStop(1, 'rgba(0,0,0,0)');
            dCtx.fillStyle = pGrad;
            dCtx.beginPath();
            dCtx.arc(px, py, pr, 0, Math.PI * 2);
            dCtx.fill();
        }

        // Light around boss projectiles: 16px radius
        if (Game.boss && Game.boss.projectiles) {
            for (var j = 0; j < Game.boss.projectiles.length; j++) {
                var p = Game.boss.projectiles[j];
                var ppGrad = dCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16);
                ppGrad.addColorStop(0, 'rgba(0,0,0,0.9)');
                ppGrad.addColorStop(0.6, 'rgba(0,0,0,0.4)');
                ppGrad.addColorStop(1, 'rgba(0,0,0,0)');
                dCtx.fillStyle = ppGrad;
                dCtx.beginPath();
                dCtx.arc(p.x, p.y, 16, 0, Math.PI * 2);
                dCtx.fill();
            }
        }

        // Draw the darkness overlay onto the main buffer
        dCtx.globalCompositeOperation = 'source-over';
        ctx.drawImage(dc.canvas, 0, 0);
    }

    // =====================================================================
    // MINIMAP DATA
    // =====================================================================

    // Rooms progress linearly north: market (south) to boss (north)
    // Minimap column: row 0 = top (boss/north), row 7 = bottom (market/south)
    var MINIMAP_ROOMS = [
        { id: 'temple_boss',        col: 0, row: 0, color: '#a33' },
        { id: 'temple_puzzle',      col: 0, row: 1, color: '#666' },
        { id: 'temple_entrance',    col: 0, row: 2, color: '#666' },
        { id: 'ebon_forest_deep',   col: 0, row: 3, color: '#276' },
        { id: 'ebon_forest_entry',  col: 0, row: 4, color: '#276' },
        { id: 'ebon_vale_north',    col: 0, row: 5, color: '#4a7' },
        { id: 'ebon_vale_square',   col: 0, row: 6, color: '#4a7' },
        { id: 'ebon_vale_market',   col: 0, row: 7, color: '#4a7' }
    ];

    // Track visited rooms for minimap
    Game.visitedRooms = {};

    // =====================================================================
    // HUD RENDERING
    // =====================================================================

    function renderHUD(ctx) {
        if (!Game.player) return;

        // Hearts - top left (with damage shake and low HP pulse)
        var maxHearts = Math.ceil(Game.player.maxHp / 2);
        var currentHP = Game.player.hp;

        // Low HP pulse: when player has 1-2 half-hearts (hp <= 2), pulse between red and dark red
        var isLowHP = currentHP > 0 && currentHP <= 2;
        var lowHPPulseActive = false;
        if (isLowHP) {
            // 30-frame cycle: first 15 frames = normal, last 15 = dark pulse
            lowHPPulseActive = (Game.frame % 30) >= 15;
        }

        for (var i = 0; i < maxHearts; i++) {
            var hx = 4 + i * 12;
            var hy = 4;
            var hpForThisHeart = currentHP - i * 2;

            // Heart damage shake: offset +/-1px randomly while timer active
            if (Game._heartShakeTimers && Game._heartShakeTimers[i] > 0) {
                hx += (Math.random() < 0.5 ? -1 : 1);
                hy += (Math.random() < 0.5 ? -1 : 1);
            }

            if (hpForThisHeart >= 2) {
                // Low HP pulse: tint remaining hearts darker on pulse cycle
                if (isLowHP && lowHPPulseActive) {
                    ctx.globalAlpha = 0.6;
                }
                safeDraw(ctx, 'item_heart', hx, hy);
                if (isLowHP && lowHPPulseActive) {
                    ctx.globalAlpha = 1;
                }
            } else if (hpForThisHeart === 1) {
                if (isLowHP && lowHPPulseActive) {
                    ctx.globalAlpha = 0.6;
                }
                safeDraw(ctx, 'item_heart_half', hx, hy);
                if (isLowHP && lowHPPulseActive) {
                    ctx.globalAlpha = 1;
                }
            } else {
                safeDraw(ctx, 'item_heart_empty', hx, hy);
            }

            // Heal animation: green overlay wipe from bottom to top
            if (Game._healAnimTimers && Game._healAnimTimers[i] > 0) {
                var healT = Game._healAnimTimers[i];
                var healProgress = 1 - (healT / 15); // 0 to 1 as timer counts down
                var greenH = Math.floor(TILE * (1 - healProgress)); // shrinks from full to 0
                if (greenH > 0) {
                    ctx.fillStyle = '#40c040';
                    ctx.globalAlpha = 0.45;
                    ctx.fillRect(hx, hy + (TILE - greenH), TILE, greenH);
                    ctx.globalAlpha = 1;
                }
                Game._healAnimTimers[i]--;
            }
        }

        // Special ability cooldown bar under hearts with label
        if (Game.player.specialCooldown !== undefined && Game.player.specialMaxCooldown) {
            var barX = 4;
            var barY = 16;
            var barW = 40;
            var barH = 3;
            var ratio = 1 - (Game.player.specialCooldown / Game.player.specialMaxCooldown);

            // "SP" label
            Utils.drawText(ctx, 'SP', barX, barY - 1, C.gray, 0.5);

            ctx.fillStyle = C.darkGray;
            ctx.fillRect(barX + 8, barY, barW - 8, barH);

            if (ratio >= 1) {
                ctx.fillStyle = C.teal;
            } else {
                ctx.fillStyle = C.blue;
            }
            ctx.fillRect(barX + 8, barY, Math.floor((barW - 8) * ratio), barH);
        }

        // Enemy counter (in combat rooms)
        if (Game.enemies.length > 0) {
            var aliveEnemies = 0;
            for (var ei = 0; ei < Game.enemies.length; ei++) {
                if (!Game.enemies[ei].dead) aliveEnemies++;
            }
            if (aliveEnemies > 0) {
                var ecX = 4;
                var ecY = 22;
                // Small skull icon (4x5 pixel)
                ctx.fillStyle = C.lightGray;
                ctx.fillRect(ecX, ecY, 4, 3);
                ctx.fillRect(ecX + 1, ecY + 3, 2, 1);
                ctx.fillStyle = C.darkGray;
                ctx.fillRect(ecX, ecY + 1, 1, 1);
                ctx.fillRect(ecX + 3, ecY + 1, 1, 1);
                Utils.drawText(ctx, 'x' + aliveEnemies, ecX + 6, ecY, C.lightGray, 1);
            }
        }

        // Puzzle items - top right: show silhouettes for uncollected, real sprites for collected
        var puzzleSlots = [
            { flag: 'puzzleCrown',   sprite: 'item_crown',   sparkle: 'crown' },
            { flag: 'puzzleCape',    sprite: 'item_cape',    sparkle: 'cape' },
            { flag: 'puzzleScepter', sprite: 'item_scepter', sparkle: 'scepter' }
        ];
        var pix = W - 16;
        for (var pi = 0; pi < puzzleSlots.length; pi++) {
            var ps = puzzleSlots[pi];
            var psx = pix - pi * 14;
            var psy = 4;

            if (Game.flags[ps.flag]) {
                // Collected: draw the real sprite
                safeDraw(ctx, ps.sprite, psx, psy);

                // Brief sparkle effect on collection
                var sparkleTimer = Game._puzzleSparkles[ps.sparkle];
                if (sparkleTimer > 0) {
                    // Draw 4 sparkle pixels around the item, cycling positions
                    ctx.fillStyle = C.gold;
                    var sparkPhase = Math.floor(sparkleTimer / 4) % 4;
                    var offsets = [
                        [-2, -1], [8, -1], [-2, 8], [8, 8],   // corners
                        [3, -2], [3, 9], [-2, 3], [9, 3]      // edges
                    ];
                    for (var sp = 0; sp < 4; sp++) {
                        var oi = (sp + sparkPhase) % offsets.length;
                        ctx.fillRect(psx + offsets[oi][0], psy + offsets[oi][1], 1, 1);
                    }
                    // Extra white sparkle center dot
                    ctx.fillStyle = C.white;
                    ctx.fillRect(psx + 3, psy + 3, 2, 2);
                }
            } else {
                // Uncollected: draw dark gray silhouette placeholder
                ctx.fillStyle = C.darkGray;
                ctx.globalAlpha = 0.5;
                // Draw a generic silhouette shape (8x8 dark rounded rect)
                ctx.fillRect(psx + 1, psy, 6, 8);
                ctx.fillRect(psx, psy + 1, 8, 6);
                ctx.globalAlpha = 1;
                // Question mark in the silhouette center
                Utils.drawText(ctx, '?', psx + 1, psy + 1, C.gray, 1);
            }
        }

        // Minimap - bottom right corner
        renderMinimap(ctx);
    }

    // =====================================================================
    // MINIMAP RENDERING
    // =====================================================================

    function renderMinimap(ctx) {
        var cellW = 9;
        var cellH = 5;
        var padding = 2;
        // Calculate minimap bounds (1 column x 8 rows, vertical strip)
        var mapW = 1 * cellW + padding * 2;
        var mapH = 8 * cellH + padding * 2;
        var mapX = W - mapW - 3;
        var mapY = H - mapH - 3;

        // Semi-transparent background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(mapX, mapY, mapW, mapH);
        ctx.strokeStyle = C.gray;
        ctx.lineWidth = 1;
        ctx.strokeRect(mapX + 0.5, mapY + 0.5, mapW - 1, mapH - 1);

        var currentId = Game.currentRoom ? Game.currentRoom.id : null;

        for (var i = 0; i < MINIMAP_ROOMS.length; i++) {
            var mr = MINIMAP_ROOMS[i];
            var rx = mapX + padding + mr.col * cellW;
            var ry = mapY + padding + mr.row * cellH;

            if (Game.visitedRooms[mr.id]) {
                // Visited room: show colored
                ctx.fillStyle = mr.color;
                ctx.fillRect(rx, ry, cellW - 1, cellH - 1);

                // Cleared rooms get a dot
                if (Game.clearedRooms[mr.id]) {
                    ctx.fillStyle = C.white;
                    ctx.fillRect(rx + 2, ry + 1, 2, 2);
                }
            } else {
                // Unvisited: dim
                ctx.fillStyle = 'rgba(60,60,60,0.4)';
                ctx.fillRect(rx, ry, cellW - 1, cellH - 1);
            }

            // Special room indicators (NPC, boss, puzzle)
            if (Game.visitedRooms[mr.id]) {
                var dotCX = rx + Math.floor((cellW - 1) / 2);
                var dotCY = ry + Math.floor((cellH - 1) / 2);
                // NPC rooms: blue dot
                if (mr.id === 'ebon_vale_square' || mr.id === 'ebon_vale_market' || mr.id === 'ebon_forest_entry') {
                    ctx.fillStyle = '#4488ff';
                    ctx.fillRect(dotCX, dotCY, 1, 1);
                }
                // Boss room: red dot
                if (mr.id === 'temple_boss') {
                    ctx.fillStyle = '#ff3333';
                    ctx.fillRect(dotCX, dotCY, 1, 1);
                }
                // Puzzle room: gold dot
                if (mr.id === 'temple_puzzle') {
                    ctx.fillStyle = '#ffcc33';
                    ctx.fillRect(dotCX, dotCY, 1, 1);
                }
            }

            // Current room: blinking border
            if (mr.id === currentId) {
                if (Math.floor(Game.frame / 15) % 2 === 0) {
                    ctx.strokeStyle = C.yellow;
                    ctx.strokeRect(rx - 0.5, ry - 0.5, cellW, cellH);
                }
            }
        }
    }

    // =====================================================================
    // NPC INTERACTION PROMPT
    // =====================================================================

    function renderNPCPrompt(ctx) {
        if (!Game.nearNPC || Dialogue.isActive()) return;

        var npc = Game.nearNPC;
        var bobY = Math.sin(Game.frame * 0.15) * 2;
        var promptX = Math.floor(npc.x + 4);
        var promptY = Math.floor(npc.y - 10 + bobY);

        Utils.drawText(ctx, 'Z', promptX, promptY, C.yellow, 1);
    }

    // =====================================================================
    // ROOM NAME DISPLAY
    // =====================================================================

    function renderRoomName(ctx) {
        if (Game.roomNameTimer <= 0) return;

        Game.roomNameTimer--;

        var alpha = 1;
        // Slide in during first 15 frames, slide out during last 15
        var slideX = 0;
        var totalTime = 120; // frames for the banner
        var elapsed = totalTime - Game.roomNameTimer;
        if (elapsed < 15) {
            slideX = -W + (W * elapsed / 15);
            alpha = elapsed / 15;
        } else if (Game.roomNameTimer < 15) {
            slideX = W * (1 - Game.roomNameTimer / 15);
            alpha = Game.roomNameTimer / 15;
        }

        ctx.globalAlpha = alpha;

        // Build decorated room name with em-dashes: "-- Room Name --"
        var decoratedName = '-- ' + Game.roomNameText + ' --';

        // Draw banner background with gold border
        var textLen = decoratedName.length * 6;
        var bannerW = textLen + 24; // extra padding for decorative dots
        var bannerX = Math.floor((W - bannerW) / 2 + slideX);
        var bannerY = 18;

        ctx.fillStyle = C.black;
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillRect(bannerX, bannerY, bannerW, 14);
        ctx.globalAlpha = alpha;
        // Gold border top and bottom
        ctx.fillStyle = C.gold;
        ctx.fillRect(bannerX, bannerY, bannerW, 1);
        ctx.fillRect(bannerX, bannerY + 13, bannerW, 1);
        // Left and right border
        ctx.fillRect(bannerX, bannerY, 1, 14);
        ctx.fillRect(bannerX + bannerW - 1, bannerY, 1, 14);

        // Small pixel dots at the ends (decorative flourishes)
        ctx.fillStyle = C.gold;
        // Left dot cluster: 2x2 pixel dot at inner-left
        ctx.fillRect(bannerX + 3, bannerY + 6, 2, 2);
        // Right dot cluster: 2x2 pixel dot at inner-right
        ctx.fillRect(bannerX + bannerW - 5, bannerY + 6, 2, 2);

        var tx = Math.floor(bannerX + 12);
        Utils.drawText(ctx, decoratedName, tx, bannerY + 4, C.white, 1);
        ctx.globalAlpha = 1;
    }

    // =====================================================================
    // SPEED RUN TIMER
    // =====================================================================

    function renderSpeedRunTimer(ctx) {
        var totalSecs = Math.floor(Game.speedRunTime / 60);
        var mins = Math.floor(totalSecs / 60);
        var secs = totalSecs % 60;
        var frames = Game.speedRunTime % 60;
        var timeStr = mins + ':' + (secs < 10 ? '0' : '') + secs + '.' + (frames < 10 ? '0' : '') + frames;
        Utils.drawText(ctx, timeStr, W - 58, 2, C.lightGray, 1);
    }

    // =====================================================================
    // GOBLIN TEETH COUNTER
    // =====================================================================

    function renderTeethCount(ctx) {
        // Small icon + count next to enemy counter area
        Utils.drawText(ctx, 'TEETH:' + Game.goblinTeeth, W - 70, H - 10, C.gold, 1);
    }

    // =====================================================================
    // BLACKSMITH SHOP
    // =====================================================================

    var SHOP_ITEMS = [
        { name: 'Healing Salve',    cost: 3, desc: 'Restore 4 HP',       action: 'heal' },
        { name: 'Toughened Hide',   cost: 8, desc: '+2 Max HP',          action: 'maxhp' },
        { name: 'Keen Edge',        cost: 6, desc: 'Stronger attacks',   action: 'damage' },
    ];

    function openShop() {
        Game.shopOpen = true;
        Game.shopIndex = 0;
    }

    function updateShop() {
        if (!Game.shopOpen) return;

        if (Input.pressed['ArrowUp']) {
            Game.shopIndex = (Game.shopIndex - 1 + SHOP_ITEMS.length) % SHOP_ITEMS.length;
            Audio.play('select');
        }
        if (Input.pressed['ArrowDown']) {
            Game.shopIndex = (Game.shopIndex + 1) % SHOP_ITEMS.length;
            Audio.play('select');
        }
        if (Input.pressed['z']) {
            var item = SHOP_ITEMS[Game.shopIndex];
            if (Game.goblinTeeth >= item.cost) {
                Game.goblinTeeth -= item.cost;
                Audio.play('buy');
                switch (item.action) {
                    case 'heal':
                        if (Game.player) {
                            Game.player.hp = Math.min(Game.player.maxHp, Game.player.hp + 4);
                            Particles.sparkle(Game.player.x + 5, Game.player.y, C.lightGreen);
                        }
                        break;
                    case 'maxhp':
                        if (Game.player) {
                            Game.player.maxHp += 2;
                            Game.player.hp += 2;
                            Particles.ring(Game.player.x + 5, Game.player.y + 6, 10, 8, C.red);
                        }
                        break;
                    case 'damage':
                        if (Game.player) {
                            Game.player._dmgBoost = (Game.player._dmgBoost || 0) + 1;
                            Particles.sparkle(Game.player.x + 5, Game.player.y, C.gold);
                        }
                        break;
                }
            } else {
                Audio.play('deny');
            }
        }
        if (Input.pressed['x'] || Input.pressed['Escape']) {
            Game.shopOpen = false;
            Audio.play('select');
        }
    }

    function renderShop(ctx) {
        if (!Game.shopOpen) return;

        // Semi-transparent background
        ctx.fillStyle = C.black;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(30, 30, W - 60, H - 60);
        ctx.globalAlpha = 1;

        // Border
        ctx.fillStyle = C.gold;
        ctx.fillRect(30, 30, W - 60, 1);
        ctx.fillRect(30, H - 31, W - 60, 1);
        ctx.fillRect(30, 30, 1, H - 60);
        ctx.fillRect(W - 31, 30, 1, H - 60);

        Utils.drawText(ctx, "BRAXON'S FORGE", centerTextX("BRAXON'S FORGE", 1), 38, C.gold, 1);
        Utils.drawText(ctx, 'TEETH: ' + Game.goblinTeeth, centerTextX('TEETH: ' + Game.goblinTeeth, 1), 50, C.yellow, 1);

        for (var i = 0; i < SHOP_ITEMS.length; i++) {
            var item = SHOP_ITEMS[i];
            var y = 68 + i * 28;
            var color = (Game.goblinTeeth >= item.cost) ? C.white : C.gray;
            if (i === Game.shopIndex) {
                ctx.fillStyle = C.darkPurple;
                ctx.globalAlpha = 0.5;
                ctx.fillRect(36, y - 2, W - 72, 22);
                ctx.globalAlpha = 1;
                Utils.drawText(ctx, '>', 38, y + 2, C.yellow, 1);
            }
            Utils.drawText(ctx, item.name, 48, y + 2, color, 1);
            Utils.drawText(ctx, item.cost + ' TEETH', W - 90, y + 2, C.gold, 1);
            Utils.drawText(ctx, item.desc, 48, y + 12, C.lightGray, 1);
        }

        Utils.drawText(ctx, 'Z: BUY  X: CLOSE', centerTextX('Z: BUY  X: CLOSE', 1), H - 42, C.lightGray, 1);
    }

    // =====================================================================
    // BROTHER SOREN'S BLESSING
    // =====================================================================

    function sorenBlessing() {
        if (!Game.player) return;
        // Heal player (Pass 7E: Legend difficulty only heals 2 HP)
        if (Game.difficulty === 2) {
            Game.player.hp = Math.min(Game.player.maxHp, Game.player.hp + 2);
        } else {
            Game.player.hp = Game.player.maxHp;
        }
        // Temporary speed boost
        Game.sorenBlessing = true;
        Game.sorenBlessingTimer = 600; // 10 seconds
        Game.player.speed = 2.0;
        Audio.play('heal');
        Particles.ring(Game.player.x + 5, Game.player.y + 6, 15, 12, C.paleBlue);
        Particles.sparkle(Game.player.x + 5, Game.player.y, C.white);
    }

    // =====================================================================
    // PUZZLE ITEM RENDERING (glowing, bobbing uncollected items)
    // =====================================================================

    function renderPuzzleItems(ctx) {
        if (!Game.currentRoom || Game.currentRoom.id !== 'temple_puzzle') return;

        var items = Game.currentRoom.items;
        if (!items) return;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (Game.collectedItems[item.id]) continue;

            var ix = item.x * TILE;
            var iy = item.y * TILE;

            // Bob animation
            var bob = Math.sin(Game.frame * 0.08 + i) * 2;

            // Glow effect (pulsing bright rectangle behind item)
            var glowAlpha = 0.3 + Math.sin(Game.frame * 0.1 + i * 2) * 0.15;
            ctx.fillStyle = C.gold;
            ctx.globalAlpha = glowAlpha;
            ctx.fillRect(ix - 2, iy - 2 + bob, TILE + 4, TILE + 4);
            ctx.globalAlpha = 1;

            // Draw item sprite
            safeDraw(ctx, item.type, ix, iy + bob);
        }
    }

    // =====================================================================
    // BOULDER UPDATE & RENDER (temple puzzle door blockers)
    // =====================================================================

    function updateBoulders() {
        if (!Game.boulders || Game.boulders.length === 0) return;
        if (!Game.bouldersClearing) return;

        var allGone = true;
        for (var b = 0; b < Game.boulders.length; b++) {
            var boulder = Game.boulders[b];
            if (!boulder.active) continue;
            boulder.x += boulder.vx;
            boulder.y += boulder.vy;
            // Dust particles as they roll
            if (Game.frame % 3 === 0) {
                Particles.add(boulder.x + 8, boulder.y + 14, {
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -0.3 - Math.random() * 0.3,
                    life: 15,
                    color: '#8a7a6a',
                    size: 1
                });
            }
            // Deactivate when off-screen
            if (boulder.x < -TILE || boulder.x > COLS * TILE) {
                boulder.active = false;
            } else {
                allGone = false;
            }
        }
        if (allGone) {
            Game.boulders = [];
            Game.bouldersClearing = false;
        }
    }

    function renderBoulders(ctx) {
        if (!Game.boulders || Game.boulders.length === 0) return;
        for (var b = 0; b < Game.boulders.length; b++) {
            var boulder = Game.boulders[b];
            if (!boulder.active) continue;
            var bx = Math.floor(boulder.x);
            var by = Math.floor(boulder.y);
            // Draw a rocky boulder - dark stone with highlights
            ctx.fillStyle = '#4a4a50';
            ctx.fillRect(bx + 1, by + 2, 14, 12);
            ctx.fillStyle = '#3a3a40';
            ctx.fillRect(bx + 2, by + 3, 12, 10);
            ctx.fillStyle = '#5a5a64';
            ctx.fillRect(bx + 3, by + 3, 4, 3);
            ctx.fillRect(bx + 9, by + 6, 3, 2);
            ctx.fillStyle = '#2a2a30';
            ctx.fillRect(bx + 5, by + 8, 6, 2);
        }
    }

    function isBoulderBlocking(px, py) {
        if (!Game.boulders || Game.boulders.length === 0) return false;
        for (var b = 0; b < Game.boulders.length; b++) {
            var boulder = Game.boulders[b];
            if (!boulder.active) continue;
            if (px >= boulder.x && px < boulder.x + TILE &&
                py >= boulder.y && py < boulder.y + TILE) {
                return true;
            }
        }
        return false;
    }

    // =====================================================================
    // GENERAL ITEM RENDERING (potions etc in non-puzzle rooms)
    // =====================================================================

    function renderItems(ctx) {
        if (!Game.currentRoom || !Game.currentRoom.items) return;
        if (Game.currentRoom.id === 'temple_puzzle') return; // Handled separately

        for (var i = 0; i < Game.currentRoom.items.length; i++) {
            var item = Game.currentRoom.items[i];
            if (Game.collectedItems[item.id]) continue;

            var ix = item.x * TILE;
            var iy = item.y * TILE;
            var bob = Math.sin(Game.frame * 0.08 + i) * 1;

            safeDraw(ctx, item.type, ix, iy + bob);
        }
    }

    function checkItemPickup() {
        if (!Game.player || !Game.currentRoom || !Game.currentRoom.items) return;
        if (Dialogue.isActive()) return;

        // Non-puzzle items (potions etc.)
        if (Game.currentRoom.id === 'temple_puzzle') return; // puzzle items handled separately

        for (var i = 0; i < Game.currentRoom.items.length; i++) {
            var item = Game.currentRoom.items[i];
            if (Game.collectedItems[item.id]) continue;

            var ix = item.x * TILE;
            var iy = item.y * TILE;
            var d = Utils.dist(
                { x: Game.player.x + 8, y: Game.player.y + 8 },
                { x: ix + 8, y: iy + 8 }
            );

            if (d < 16) {
                Game.collectedItems[item.id] = true;
                Audio.play('pickup');
                Particles.sparkle(ix + 8, iy + 8, C.lightGreen);

                // If potion, heal
                if (item.type === 'item_potion') {
                    if (Game.player.hp < Game.player.maxHp) {
                        Game.player.hp = Math.min(Game.player.hp + 4, Game.player.maxHp);
                    }
                    Dialogue.start('pickup_potion');
                }
            }
        }
    }

    // =====================================================================
    // TITLE SCREEN
    // =====================================================================

    // Title screen menu selection (0 = New Game or Continue, 1 = secondary option)
    Game.titleMenuIndex = 0;
    Game.hasSaveData = false;

    function updateTitle() {
        // Check for save data
        Game.hasSaveData = hasSaveData();

        // Initialize title stars once
        if (Game.titleStars.length === 0) {
            for (var si = 0; si < 40; si++) {
                Game.titleStars.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    speed: 0.1 + Math.random() * 0.3,
                    brightness: Math.random(),
                    size: Math.random() < 0.3 ? 2 : 1
                });
            }
        }

        // Initialize falling embers once (6A)
        if (Game.titleEmbers.length === 0) {
            for (var ei = 0; ei < 6; ei++) {
                Game.titleEmbers.push({
                    x: Math.random() * W,
                    y: Math.random() * H * 0.5,
                    vy: 0.3 + Math.random() * 0.4,
                    swayPhase: Math.random() * Math.PI * 2,
                    brightness: 0.4 + Math.random() * 0.5,
                    size: 1
                });
            }
        }

        // Update stars (parallax drift)
        for (var si2 = 0; si2 < Game.titleStars.length; si2++) {
            var star = Game.titleStars[si2];
            star.y += star.speed;
            star.brightness = 0.3 + Math.sin(Game.frame * 0.05 + si2) * 0.4;
            if (star.y > H) { star.y = 0; star.x = Math.random() * W; }
        }

        // Update falling embers (6A)
        for (var ei2 = 0; ei2 < Game.titleEmbers.length; ei2++) {
            var ember = Game.titleEmbers[ei2];
            ember.y += ember.vy;
            ember.x += Math.sin(Game.frame * 0.03 + ember.swayPhase) * 0.3;
            ember.brightness = 0.3 + Math.sin(Game.frame * 0.04 + ei2 * 1.7) * 0.3;
            if (ember.y > H) {
                ember.y = -2;
                ember.x = Math.random() * W;
            }
            if (ember.x < 0) ember.x = W;
            if (ember.x > W) ember.x = 0;
        }

        // Scroll landscape background (6A)
        Game.titleLandscapeOffset = (Game.titleLandscapeOffset + 0.25) % 512;

        // Letter-by-letter subtitle reveal
        if (Game.subtitleReveal < 23) { // "Shadows of the Eldspyre" = 23 chars
            if (Game.frame % 4 === 0) Game.subtitleReveal++;
        }

        // Trigger menu fade-in after subtitle reveal completes (6A)
        if (Game.subtitleReveal >= 23 && !Game.titleMenuFadeStart) {
            Game.titleMenuFadeStart = true;
            Game.titleMenuAlpha = 0;
        }
        if (Game.titleMenuFadeStart && Game.titleMenuAlpha < 1) {
            Game.titleMenuAlpha = Math.min(1, Game.titleMenuAlpha + (1 / 30));
        }

        // Generate sparkle particles on title screen
        if (Game.frame % 8 === 0) {
            Particles.add(Utils.randInt(20, W - 20), H - 10, {
                vx: (Math.random() - 0.5) * 0.5,
                vy: -(0.5 + Math.random() * 1),
                life: 60 + Utils.randInt(0, 40),
                color: Utils.choice([C.gold, C.yellow, C.teal, C.lightPurple]),
                size: 1,
                gravity: -0.01
            });
        }

        Particles.update();

        // Menu navigation if save exists (only after fade-in starts)
        if (Game.hasSaveData && Game.titleMenuAlpha > 0) {
            if (Input.pressed['ArrowUp'] || Input.pressed['ArrowDown']) {
                Game.titleMenuIndex = 1 - Game.titleMenuIndex;
                Audio.play('select');
            }
        }

        if (Input.pressed['Enter'] && Game.titleMenuAlpha >= 1) {
            if (Game.hasSaveData && Game.titleMenuIndex === 0) {
                // Continue from save
                if (loadGame()) {
                    Audio.play('select');
                    if (Music) Music.stop();
                    Particles.particles = [];
                    return;
                }
            }
            // New Game (or continue failed, fall through to new game)
            Game.state = 'select';
            Audio.play('select');
            if (Music) Music.stop();
            Particles.particles = [];
            if (Game.hasSaveData && Game.titleMenuIndex === 0) {
                // Shouldn't reach here, but just in case
            }
        }
    }

    // --- 6A: Procedural landscape drawing (512px wide, seamless loop) ---
    function drawTitleLandscape(ctx, offset) {
        var lw = 512; // landscape width
        // Draw two copies for seamless scrolling
        for (var copy = 0; copy < 2; copy++) {
            var baseX = -offset + copy * lw;
            if (baseX > W) continue;
            if (baseX + lw < 0) continue;

            // Green hills silhouette at bottom
            for (var hx = 0; hx < lw; hx++) {
                var screenX = Math.floor(baseX + hx);
                if (screenX < 0 || screenX >= W) continue;
                // Varying hill heights using sine waves
                var hillH = 28 + Math.sin(hx * 0.015) * 12
                           + Math.sin(hx * 0.04 + 1.2) * 6
                           + Math.sin(hx * 0.008 + 0.5) * 8;
                var hillTop = Math.floor(H - hillH);
                // Dark green hill fill
                ctx.fillStyle = '#0e3a0e';
                ctx.fillRect(screenX, hillTop, 1, H - hillTop);
                // Slightly lighter top edge
                ctx.fillStyle = '#16501a';
                ctx.fillRect(screenX, hillTop, 1, 2);
            }

            // Tree silhouettes scattered on hills
            var treePositions = [30, 80, 140, 200, 260, 330, 400, 460];
            for (var ti = 0; ti < treePositions.length; ti++) {
                var tx = Math.floor(baseX + treePositions[ti]);
                if (tx < -10 || tx > W + 10) continue;
                var thx = treePositions[ti];
                var tHillH = 28 + Math.sin(thx * 0.015) * 12
                            + Math.sin(thx * 0.04 + 1.2) * 6
                            + Math.sin(thx * 0.008 + 0.5) * 8;
                var tBaseY = Math.floor(H - tHillH);
                // Trunk
                ctx.fillStyle = '#1a2a0a';
                ctx.fillRect(tx + 2, tBaseY - 10, 2, 10);
                // Canopy (triangle-ish)
                ctx.fillStyle = '#0a2a0a';
                ctx.fillRect(tx, tBaseY - 16, 6, 4);
                ctx.fillRect(tx + 1, tBaseY - 20, 4, 4);
                ctx.fillRect(tx + 2, tBaseY - 22, 2, 2);
            }

            // Distant temple silhouette on right portion (around x=350-410)
            var templeX = Math.floor(baseX + 365);
            if (templeX > -50 && templeX < W + 50) {
                var templeHillH = 28 + Math.sin(365 * 0.015) * 12
                                 + Math.sin(365 * 0.04 + 1.2) * 6
                                 + Math.sin(365 * 0.008 + 0.5) * 8;
                var templeBaseY = Math.floor(H - templeHillH);
                // Temple body
                ctx.fillStyle = '#12241a';
                ctx.fillRect(templeX, templeBaseY - 20, 24, 20);
                // Temple roof / spire
                ctx.fillRect(templeX + 2, templeBaseY - 26, 20, 6);
                ctx.fillRect(templeX + 6, templeBaseY - 32, 12, 6);
                ctx.fillRect(templeX + 10, templeBaseY - 36, 4, 4);
                ctx.fillRect(templeX + 11, templeBaseY - 39, 2, 3);
                // Temple pillars
                ctx.fillStyle = '#1a3a2a';
                ctx.fillRect(templeX + 2, templeBaseY - 18, 2, 18);
                ctx.fillRect(templeX + 20, templeBaseY - 18, 2, 18);
                ctx.fillRect(templeX + 11, templeBaseY - 18, 2, 18);
            }
        }
    }

    function renderTitle() {
        var ctx = buf;

        // Dark gradient background (alternate dark rows)
        for (var row = 0; row < H; row++) {
            var shade = Math.floor(10 + (row / H) * 15);
            ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + Math.floor(shade * 1.8) + ')';
            ctx.fillRect(0, row, W, 1);
        }

        // 6A: Scrolling landscape background (behind stars, above gradient)
        drawTitleLandscape(ctx, Game.titleLandscapeOffset);

        // Render parallax star field
        for (var si = 0; si < Game.titleStars.length; si++) {
            var star = Game.titleStars[si];
            ctx.globalAlpha = Math.max(0, Math.min(1, star.brightness));
            ctx.fillStyle = C.white;
            ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
        }
        ctx.globalAlpha = 1;

        // 6A: Render falling embers
        for (var ei = 0; ei < Game.titleEmbers.length; ei++) {
            var ember = Game.titleEmbers[ei];
            ctx.globalAlpha = Math.max(0, Math.min(1, ember.brightness));
            ctx.fillStyle = C.gold;
            ctx.fillRect(Math.floor(ember.x), Math.floor(ember.y), ember.size, ember.size);
            // Tiny glow around ember
            ctx.globalAlpha = Math.max(0, ember.brightness * 0.3);
            ctx.fillStyle = C.yellow;
            ctx.fillRect(Math.floor(ember.x) - 1, Math.floor(ember.y), 3, 1);
            ctx.fillRect(Math.floor(ember.x), Math.floor(ember.y) - 1, 1, 3);
        }
        ctx.globalAlpha = 1;

        // Eldspyre crystal in center
        var cx = W / 2;
        var cy = H / 2 - 10;

        // Blue outline diamond
        ctx.fillStyle = C.darkBlue;
        drawDiamond(ctx, cx, cy, 22, 30);

        // Teal center diamond
        ctx.fillStyle = C.teal;
        drawDiamond(ctx, cx, cy, 16, 22);

        // Inner bright center
        ctx.fillStyle = C.paleBlue;
        drawDiamond(ctx, cx, cy, 8, 12);

        // Pulsing glow around crystal
        var glowAlpha = 0.15 + Math.sin(Game.frame * 0.05) * 0.08;
        ctx.globalAlpha = glowAlpha;
        ctx.fillStyle = C.teal;
        drawDiamond(ctx, cx, cy, 30, 40);
        ctx.globalAlpha = 1;

        // White sparkle pixels on crystal
        var sparkleOffset = Math.sin(Game.frame * 0.1) * 2;
        ctx.fillStyle = C.white;
        ctx.fillRect(cx - 1, cy - 6 + sparkleOffset, 2, 2);
        ctx.fillRect(cx + 4, cy + sparkleOffset, 2, 2);
        ctx.fillRect(cx - 5, cy + 2 - sparkleOffset, 2, 2);

        // Title: "VALISAR" in gold, size 3 with shadow
        var titleText = 'VALISAR';
        var titleX = centerTextX(titleText, 3);
        Utils.drawText(ctx, titleText, titleX + 1, 31, C.darkBrown, 3);
        Utils.drawText(ctx, titleText, titleX, 30, C.gold, 3);

        // Subtitle with letter-by-letter reveal
        var subTextFull = 'Shadows of the Eldspyre';
        var subTextVisible = subTextFull.substring(0, Math.min(Game.subtitleReveal, subTextFull.length));
        var subX = centerTextX(subTextFull, 1);
        Utils.drawText(ctx, subTextVisible, subX, 58, C.paleBlue, 1);
        // Cursor blink at end of reveal
        if (Game.subtitleReveal < subTextFull.length && Math.floor(Game.frame / 8) % 2 === 0) {
            var cursorX = subX + subTextVisible.length * 6;
            ctx.fillStyle = C.paleBlue;
            ctx.fillRect(cursorX, 58, 5, 7);
        }

        // Menu options with fade-in (6A)
        var menuAlpha = Math.max(0, Math.min(1, Game.titleMenuAlpha));
        ctx.globalAlpha = menuAlpha;

        if (Game.hasSaveData) {
            // Two options: Continue and New Game
            var contOpt = 'Continue';
            var newOpt = 'New Game';
            var contX = centerTextX(contOpt, 1);
            var newX = centerTextX(newOpt, 1);
            var menuY = H - 46;

            // Selection arrow and selected option bounce (6A)
            var arrowBob = Math.sin(Game.frame * 0.15) * 2;
            var textBounce = Math.sin(Game.frame * 0.15) * 2; // extends to text itself

            if (Game.titleMenuIndex === 0) {
                Utils.drawText(ctx, '>', contX - 10 + arrowBob, menuY, C.yellow, 1);
                Utils.drawText(ctx, contOpt, contX + textBounce, menuY, C.white, 1);
                Utils.drawText(ctx, newOpt, newX, menuY + 12, C.gray, 1);
            } else {
                Utils.drawText(ctx, contOpt, contX, menuY, C.gray, 1);
                Utils.drawText(ctx, '>', newX - 10 + arrowBob, menuY + 12, C.yellow, 1);
                Utils.drawText(ctx, newOpt, newX + textBounce, menuY + 12, C.white, 1);
            }
        } else {
            // No save: "Press ENTER to Start" with fade-in (no more blink gating on alpha)
            if (Math.floor(Game.frame / 30) % 2 === 0 || menuAlpha < 1) {
                var startText = 'Press ENTER to Start';
                var stX = centerTextX(startText, 1);
                var startBounce = Math.sin(Game.frame * 0.15) * 2;
                Utils.drawText(ctx, startText, stX + startBounce, H - 38, C.white, 1);
            }
        }

        ctx.globalAlpha = 1;

        // Particles (sparkles floating up)
        Particles.render(ctx);

        // Credits and controls hint at bottom
        var credText = 'Based on the Valisar Campaign World';
        var crX = centerTextX(credText, 1);
        Utils.drawText(ctx, credText, crX, H - 14, C.gray, 1);
        var ctrlText = 'Arrows:Move  Z:Attack  X:Special  P:Pause';
        Utils.drawText(ctx, ctrlText, centerTextX(ctrlText, 0.7), H - 6, C.darkGray, 0.7);
    }

    function drawDiamond(ctx, cx, cy, halfW, halfH) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - halfH);
        ctx.lineTo(cx + halfW, cy);
        ctx.lineTo(cx, cy + halfH);
        ctx.lineTo(cx - halfW, cy);
        ctx.closePath();
        ctx.fill();
    }

    // =====================================================================
    // CHARACTER SELECT SCREEN
    // =====================================================================

    function updateSelect() {
        // If confirm action pose is playing, count down and transition (6B)
        if (Game.selectConfirmTimer > 0) {
            Game.selectConfirmTimer--;
            // Spawn action particles during confirm
            var confirmChar = Game.characters[Game.selectConfirmChar];
            var pcx = W / 2;
            var pcy = 80;
            if (confirmChar === 'daxon') {
                // Sword swing sparkles (white) to his right
                if (Game.selectConfirmTimer % 3 === 0) {
                    Particles.add(pcx + 12 + Math.random() * 10, pcy - 10 + Math.random() * 20, {
                        vx: 0.5 + Math.random() * 1, vy: (Math.random() - 0.5) * 0.8,
                        life: 15, color: C.white, size: 1, gravity: 0
                    });
                }
            } else if (confirmChar === 'luigi') {
                // Energy particles (purple) around him
                if (Game.selectConfirmTimer % 2 === 0) {
                    var angle = Math.random() * Math.PI * 2;
                    Particles.add(pcx + Math.cos(angle) * 14, pcy + Math.sin(angle) * 14, {
                        vx: Math.cos(angle) * 0.5, vy: Math.sin(angle) * 0.5,
                        life: 15, color: C.lightPurple, size: 1, gravity: 0
                    });
                }
            } else if (confirmChar === 'lirielle') {
                // Leaf particles (green) rising
                if (Game.selectConfirmTimer % 3 === 0) {
                    Particles.add(pcx - 8 + Math.random() * 16, pcy + 10, {
                        vx: (Math.random() - 0.5) * 0.5, vy: -(0.5 + Math.random() * 0.8),
                        life: 18, color: C.lightGreen, size: 1, gravity: -0.02
                    });
                }
            }
            Particles.update();
            if (Game.selectConfirmTimer <= 0) {
                Game.state = 'intro';
            }
            return;
        }

        // If slide transition is active, count down (6B)
        if (Game.selectSlideTimer > 0) {
            Game.selectSlideTimer--;
            // Ease the slide: linear interpolation over 12 frames
            var slideTotal = 12;
            var progress = 1 - (Game.selectSlideTimer / slideTotal);
            Game.selectSlideOffset = Math.floor(W * progress) * Game.selectSlideDir;
            if (Game.selectSlideTimer <= 0) {
                Game.selectedChar = Game.selectSlideTo;
                Game.selectSlideOffset = 0;
                Game.selectSlideDir = 0;
            }
            Particles.update();
            return;
        }

        if (Input.pressed['ArrowLeft']) {
            var prevChar = Game.selectedChar;
            var nextChar = (Game.selectedChar + 2) % 3;
            Game.selectSlideFrom = prevChar;
            Game.selectSlideTo = nextChar;
            Game.selectSlideDir = 1; // sliding right (new comes from left)
            Game.selectSlideTimer = 12;
            Game.selectSlideOffset = 0;
            Audio.play('select');
        }
        if (Input.pressed['ArrowRight']) {
            var prevChar2 = Game.selectedChar;
            var nextChar2 = (Game.selectedChar + 1) % 3;
            Game.selectSlideFrom = prevChar2;
            Game.selectSlideTo = nextChar2;
            Game.selectSlideDir = -1; // sliding left (new comes from right)
            Game.selectSlideTimer = 12;
            Game.selectSlideOffset = 0;
            Audio.play('select');
        }
        if (Input.pressed['ArrowUp']) {
            Game.difficulty = (Game.difficulty + 2) % 3;
            Audio.play('select');
        }
        if (Input.pressed['ArrowDown']) {
            Game.difficulty = (Game.difficulty + 1) % 3;
            Audio.play('select');
        }
        if (Input.pressed['x']) {
            // Toggle speed run timer
            Game.speedRunEnabled = !Game.speedRunEnabled;
            Audio.play('select');
        }
        if (Input.pressed['z']) {
            // Confirm character selection with action pose (6B)
            Audio.play('select');
            Game.selectConfirmTimer = 20;
            Game.selectConfirmChar = Game.selectedChar;
        }

        Particles.update();
    }

    // Character stats for select screen display
    var CHAR_STATS = {
        daxon:    { hp: 4, atk: 4, spd: 3, spc: 'Shield', spcDesc: 'Invincibility' },
        luigi:    { hp: 3, atk: 3, spd: 3, spc: 'Brog',   spcDesc: 'Homing bolt' },
        lirielle: { hp: 3, atk: 2, spd: 3, spc: 'Heal',   spcDesc: 'Restore HP' }
    };

    // Helper: word-wrap text to fit maxW pixels at given charWidth
    function wrapTextToWidth(text, maxW, charW) {
        var maxChars = Math.floor(maxW / charW);
        if (text.length <= maxChars) return [text];
        var words = text.split(' ');
        var lines = [];
        var cur = '';
        for (var i = 0; i < words.length; i++) {
            var test = cur ? cur + ' ' + words[i] : words[i];
            if (test.length <= maxChars) { cur = test; }
            else { if (cur) lines.push(cur); cur = words[i]; }
        }
        if (cur) lines.push(cur);
        return lines;
    }

    // 6B helper: draw a single character's select display at given center x
    function drawSelectCharacter(ctx, charIdx, centerX, showAnim) {
        var charId = Game.characters[charIdx];
        var stats = CHAR_STATS[charId];

        // "Stage" underneath character (6B)
        var stageY = 104;
        if (charId === 'daxon') {
            // Stone platform (gray rectangle)
            ctx.fillStyle = C.stone;
            ctx.fillRect(centerX - 18, stageY, 36, 6);
            ctx.fillStyle = C.darkStone;
            ctx.fillRect(centerX - 18, stageY + 4, 36, 2);
        } else if (charId === 'luigi') {
            // Mystical circle (purple circle/glow)
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = C.purple;
            ctx.beginPath();
            ctx.arc(centerX, stageY + 2, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = C.lightPurple;
            ctx.beginPath();
            ctx.arc(centerX, stageY + 2, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (charId === 'lirielle') {
            // Grass patch (green)
            ctx.fillStyle = C.darkGreen;
            ctx.fillRect(centerX - 18, stageY, 36, 6);
            ctx.fillStyle = C.green;
            // Little grass tufts
            for (var gi = 0; gi < 8; gi++) {
                ctx.fillRect(centerX - 16 + gi * 4, stageY - 2, 2, 3);
            }
        }

        // Draw character at 2x scale (32x48 display) centered (6B)
        var walkFrame = showAnim ? (Math.floor(Game.frame / 12) % 2) : 0;
        var sprKey = charId + '_down_' + walkFrame;
        var sprCanvas = Sprites.get(sprKey);
        // Character sprite drawn at 2x: 32 wide, 48 tall (from 16x24 base)
        var sprDrawW = 32;
        var sprDrawH = 48;
        var sprX = centerX - Math.floor(sprDrawW / 2);
        var sprY = stageY - sprDrawH - 2;

        if (sprCanvas) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(sprCanvas, sprX, sprY, sprCanvas.width * 2, sprCanvas.height * 2);
        } else {
            ctx.fillStyle = charIdx === 0 ? C.blue : (charIdx === 1 ? C.purple : C.lightGreen);
            ctx.fillRect(sprX + 4, sprY + 4, 24, 40);
        }

        // Name
        var name = Game.charNames[charIdx];
        var nameScale = 1;
        var nameCharW = 6;
        if (name.length * nameCharW > 90) {
            nameScale = 0.8;
            nameCharW = 5;
        }
        var nameX = centerX - Math.floor(name.length * nameCharW / 2);
        Utils.drawText(ctx, name, nameX, stageY + 10, C.white, nameScale);

        // Class
        var cls = Game.charClasses[charIdx];
        var clsCharW = 4;
        var clsScale = 0.7;
        var clsX = centerX - Math.floor(cls.length * clsCharW / 2);
        Utils.drawText(ctx, cls, clsX, stageY + 20, C.lightGray, clsScale);

        // Stat bars centered
        var statBarW = 60;
        var barH = 3;
        var statBaseX = centerX - Math.floor(statBarW / 2);
        var statY = stageY + 30;

        // HP bar
        Utils.drawText(ctx, 'HP', statBaseX, statY, C.lightRed, 0.7);
        ctx.fillStyle = C.darkGray;
        ctx.fillRect(statBaseX + 16, statY + 1, statBarW - 16, barH);
        ctx.fillStyle = C.red;
        ctx.fillRect(statBaseX + 16, statY + 1, Math.floor((statBarW - 16) * stats.hp / 5), barH);

        // ATK bar
        statY += 9;
        Utils.drawText(ctx, 'ATK', statBaseX, statY, C.gold, 0.7);
        ctx.fillStyle = C.darkGray;
        ctx.fillRect(statBaseX + 20, statY + 1, statBarW - 20, barH);
        ctx.fillStyle = C.gold;
        ctx.fillRect(statBaseX + 20, statY + 1, Math.floor((statBarW - 20) * stats.atk / 5), barH);

        // SPD bar
        statY += 9;
        Utils.drawText(ctx, 'SPD', statBaseX, statY, C.teal, 0.7);
        ctx.fillStyle = C.darkGray;
        ctx.fillRect(statBaseX + 20, statY + 1, statBarW - 20, barH);
        ctx.fillStyle = C.teal;
        ctx.fillRect(statBaseX + 20, statY + 1, Math.floor((statBarW - 20) * stats.spd / 5), barH);

        // Special ability
        statY += 10;
        var spcLabel = stats.spc + ': ' + stats.spcDesc;
        var spcCharW = 4;
        var spcX = centerX - Math.floor(spcLabel.length * spcCharW / 2);
        Utils.drawText(ctx, spcLabel, spcX, statY, C.paleBlue, 0.7);

        // Sparkle on character
        if (showAnim && Game.frame % 15 === 0) {
            Particles.sparkle(centerX, sprY + 20, C.gold);
        }
    }

    function renderSelect() {
        var ctx = buf;

        // Dark background
        ctx.fillStyle = C.black;
        ctx.fillRect(0, 0, W, H);

        // Title
        var titleText = 'Choose Your Hero';
        var titleX = centerTextX(titleText, 2);
        Utils.drawText(ctx, titleText, titleX, 8, C.gold, 2);

        // Gold border frame around character area
        ctx.strokeStyle = C.gold;
        ctx.lineWidth = 1;
        ctx.strokeRect(20, 28, W - 40, 140);

        // 6B: Slide transition or static display
        var isSliding = Game.selectSlideTimer > 0;

        if (isSliding) {
            // Draw the outgoing character sliding away
            ctx.save();
            ctx.beginPath();
            ctx.rect(21, 29, W - 42, 138);
            ctx.clip();

            var slideOffset = Game.selectSlideOffset;
            drawSelectCharacter(ctx, Game.selectSlideFrom, W / 2 + slideOffset, false);
            // Draw the incoming character sliding in from opposite side
            drawSelectCharacter(ctx, Game.selectSlideTo, W / 2 + slideOffset - W * Game.selectSlideDir, true);

            ctx.restore();
        } else if (Game.selectConfirmTimer > 0) {
            // During confirm, draw the confirmed character with flash
            ctx.save();
            ctx.beginPath();
            ctx.rect(21, 29, W - 42, 138);
            ctx.clip();

            drawSelectCharacter(ctx, Game.selectConfirmChar, W / 2, true);

            // Flash overlay during confirm
            if (Game.selectConfirmTimer < 5) {
                ctx.globalAlpha = (5 - Game.selectConfirmTimer) / 5 * 0.6;
                ctx.fillStyle = C.white;
                ctx.fillRect(21, 29, W - 42, 138);
                ctx.globalAlpha = 1;
            }

            ctx.restore();
        } else {
            // Static: draw selected character centered
            drawSelectCharacter(ctx, Game.selectedChar, W / 2, true);
        }

        // Small character indicators at top (all three, highlight selected)
        var indicatorY = 30;
        for (var i = 0; i < 3; i++) {
            var indX = W / 2 - 30 + i * 20;
            var indCharId = Game.characters[i];
            var isSel = (i === Game.selectedChar) && !isSliding;
            ctx.fillStyle = isSel ? C.gold : C.darkGray;
            ctx.fillRect(indX, indicatorY, 12, 2);
            // Tiny character icon (colored dot)
            var dotColor = indCharId === 'daxon' ? C.blue : (indCharId === 'luigi' ? C.purple : C.lightGreen);
            ctx.fillStyle = isSel ? dotColor : C.gray;
            ctx.fillRect(indX + 4, indicatorY + 4, 4, 4);
        }

        Particles.render(ctx);

        // Description text below character area
        var activeChar = isSliding ? Game.selectSlideTo : Game.selectedChar;
        if (Game.selectConfirmTimer > 0) activeChar = Game.selectConfirmChar;
        var desc = Game.charDescs[activeChar];
        var descLines = wrapTextToWidth(desc, W - 20, 5);
        if (descLines.length > 2) descLines.length = 2;

        var descY = 172;
        for (var l = 0; l < descLines.length; l++) {
            var lx = Math.floor((W - descLines[l].length * 5) / 2);
            Utils.drawText(ctx, descLines[l], lx, descY + l * 9, C.white, 0.8);
        }

        // Bottom controls - single row for difficulty + speed run (Pass 7E names)
        var ctrlY = H - 28;
        var diffNames = ['ADVENTURER', 'HERO', 'LEGEND'];
        var diffDescs = ['+2 HP, less dmg', 'Standard', '+HP/spd enemies'];
        var diffColors = [C.lightGreen, C.gold, C.red];
        Utils.drawText(ctx, diffNames[Game.difficulty], 10, ctrlY, diffColors[Game.difficulty], 0.8);
        Utils.drawText(ctx, diffDescs[Game.difficulty], 10, ctrlY + 9, C.darkGray, 0.6);

        var srText = Game.speedRunEnabled ? 'SPEED:ON' : 'SPEED:OFF';
        Utils.drawText(ctx, srText, W - 52, ctrlY, Game.speedRunEnabled ? C.gold : C.darkGray, 0.8);
        Utils.drawText(ctx, 'X:TOGGLE', W - 52, ctrlY + 9, C.darkGray, 0.6);

        // "Z to Confirm" blinking (hide during confirm)
        if (Game.selectConfirmTimer <= 0) {
            if (Math.floor(Game.frame / 30) % 2 === 0) {
                var confText = 'Z to Confirm';
                var confX = centerTextX(confText, 1);
                Utils.drawText(ctx, confText, confX, H - 10, C.yellow, 1);
            }
        }

        // Arrow key hints (hide during confirm)
        if (Game.selectConfirmTimer <= 0) {
            var arrowBob = Math.sin(Game.frame * 0.1) * 2;
            Utils.drawText(ctx, '<', 10 + arrowBob, 90, C.gold, 2);
            Utils.drawText(ctx, '>', W - 22 - arrowBob, 90, C.gold, 2);
        }
    }

    // =====================================================================
    // INTRO CUTSCENE
    // =====================================================================

    function updateIntro() {
        if (!Dialogue.isActive() && Game.cutsceneTimer === 0) {
            Dialogue.start('intro_cutscene', function () {
                startGame();
            });
            Game.cutsceneTimer = 1;
        }

        Dialogue.update();

        if (Input.pressed['z']) {
            Dialogue.advance();
        }
        // X to skip seen dialogue
        if (Input.pressed['x'] && Dialogue._canSkip) {
            Dialogue.skipAll();
        }
    }

    // Pixel art cutscene scene renderers
    function drawCutsceneTown(ctx) {
        // Night sky gradient
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, W, 100);
        // Stars
        ctx.fillStyle = '#ffffff';
        var stars = [[20,8],[55,15],[90,5],[140,12],[180,20],[220,8],[35,30],[110,25],[200,35],[160,42],[70,38],[245,18]];
        for (var i = 0; i < stars.length; i++) {
            ctx.fillRect(stars[i][0], stars[i][1], 1, 1);
        }
        // Moon
        ctx.fillStyle = '#e8e0c0';
        ctx.fillRect(200, 10, 12, 12);
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(204, 8, 12, 12);
        // Ground
        ctx.fillStyle = '#1a3a1a';
        ctx.fillRect(0, 100, W, 60);
        // Road
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(100, 100, 56, 60);
        // Buildings - row of houses
        // House 1 (left)
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(16, 68, 40, 32);
        ctx.fillStyle = '#5a3020';
        ctx.fillRect(16, 58, 40, 12); // roof
        ctx.fillStyle = '#e8a830';
        ctx.fillRect(28, 80, 6, 6); // window glow
        ctx.fillRect(40, 80, 6, 6);
        // House 2
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(64, 72, 32, 28);
        ctx.fillStyle = '#5a3020';
        ctx.fillRect(64, 64, 32, 10);
        ctx.fillStyle = '#e8a830';
        ctx.fillRect(72, 82, 6, 6);
        // Inn (center) - "The Dancing Pig"
        ctx.fillStyle = '#4a3020';
        ctx.fillRect(108, 58, 44, 42);
        ctx.fillStyle = '#6a4030';
        ctx.fillRect(108, 48, 44, 12);
        ctx.fillStyle = '#e8a830';
        ctx.fillRect(118, 70, 8, 8);
        ctx.fillRect(134, 70, 8, 8);
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(124, 84, 12, 16); // door
        // House 3
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(160, 72, 36, 28);
        ctx.fillStyle = '#5a3020';
        ctx.fillRect(160, 64, 36, 10);
        ctx.fillStyle = '#e8a830';
        ctx.fillRect(170, 82, 6, 6);
        ctx.fillRect(182, 82, 6, 6);
        // House 4 (right)
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(204, 68, 36, 32);
        ctx.fillStyle = '#5a3020';
        ctx.fillRect(204, 58, 36, 12);
        ctx.fillStyle = '#e8a830';
        ctx.fillRect(214, 80, 6, 6);
        // Dark fog wisps at edges
        ctx.fillStyle = 'rgba(30,10,40,0.5)';
        ctx.fillRect(0, 90, 16, 70);
        ctx.fillRect(240, 90, 16, 70);
    }

    function drawCutsceneForest(ctx) {
        // Dark forest canopy
        ctx.fillStyle = '#0a1a0a';
        ctx.fillRect(0, 0, W, 160);
        // Ground
        ctx.fillStyle = '#1a2a0a';
        ctx.fillRect(0, 110, W, 50);
        // Path
        ctx.fillStyle = '#3a3020';
        ctx.fillRect(80, 110, 40, 50);
        ctx.fillRect(60, 130, 80, 30);
        // Tree trunks
        ctx.fillStyle = '#2a1a0a';
        var trunks = [10, 40, 70, 140, 175, 210, 240];
        for (var t = 0; t < trunks.length; t++) {
            ctx.fillRect(trunks[t], 50, 8, 70);
        }
        // Tree canopy (dark green circles)
        ctx.fillStyle = '#0a3a0a';
        var canopy = [[6,30,20],[36,40,16],[66,35,18],[136,38,18],[171,30,20],[206,40,16],[236,35,18]];
        for (var c = 0; c < canopy.length; c++) {
            ctx.fillRect(canopy[c][0], canopy[c][1], canopy[c][2], canopy[c][2]);
        }
        ctx.fillStyle = '#0a4a0a';
        for (var c2 = 0; c2 < canopy.length; c2++) {
            ctx.fillRect(canopy[c2][0]+2, canopy[c2][1]+2, canopy[c2][2]-4, canopy[c2][2]-4);
        }
        // Goblin eyes (pairs of red dots)
        ctx.fillStyle = '#ff2020';
        ctx.fillRect(25, 90, 2, 2); ctx.fillRect(31, 90, 2, 2);
        ctx.fillRect(155, 85, 2, 2); ctx.fillRect(161, 85, 2, 2);
        ctx.fillRect(195, 95, 2, 2); ctx.fillRect(201, 95, 2, 2);
        // Fog
        ctx.fillStyle = 'rgba(20,30,20,0.4)';
        ctx.fillRect(0, 100, W, 20);
    }

    function drawCutsceneTemple(ctx) {
        // Dark interior
        ctx.fillStyle = '#0a0a10';
        ctx.fillRect(0, 0, W, 160);
        // Stone floor
        ctx.fillStyle = '#2a2a30';
        ctx.fillRect(0, 110, W, 50);
        // Floor tile grid
        ctx.strokeStyle = '#1a1a20';
        ctx.lineWidth = 1;
        for (var fx = 0; fx < 16; fx++) {
            for (var fy = 0; fy < 3; fy++) {
                ctx.strokeRect(fx * 16 + 0.5, 110 + fy * 16 + 0.5, 15, 15);
            }
        }
        // Temple pillars
        ctx.fillStyle = '#3a3a44';
        ctx.fillRect(40, 20, 12, 100);
        ctx.fillRect(100, 20, 12, 100);
        ctx.fillRect(148, 20, 12, 100);
        ctx.fillRect(208, 20, 12, 100);
        // Pillar caps
        ctx.fillStyle = '#4a4a54';
        ctx.fillRect(37, 16, 18, 6);
        ctx.fillRect(97, 16, 18, 6);
        ctx.fillRect(145, 16, 18, 6);
        ctx.fillRect(205, 16, 18, 6);
        // Dark altar at center
        ctx.fillStyle = '#1a0a1a';
        ctx.fillRect(112, 60, 32, 24);
        ctx.fillStyle = '#2a1a2a';
        ctx.fillRect(114, 62, 28, 20);
        // Purple glow on altar
        ctx.fillStyle = 'rgba(120,40,160,0.4)';
        ctx.fillRect(108, 56, 40, 32);
        // Shadow tendrils
        ctx.fillStyle = 'rgba(60,20,80,0.5)';
        ctx.fillRect(120, 40, 4, 20);
        ctx.fillRect(132, 35, 4, 25);
        ctx.fillRect(126, 84, 4, 30);
        // Candle flames
        ctx.fillStyle = '#e8a830';
        ctx.fillRect(108, 56, 3, 3);
        ctx.fillRect(145, 56, 3, 3);
    }

    function drawCutsceneHeroes(ctx) {
        // Dawn sky
        ctx.fillStyle = '#1a0a2a';
        ctx.fillRect(0, 0, W, 40);
        ctx.fillStyle = '#2a1a3a';
        ctx.fillRect(0, 40, W, 30);
        ctx.fillStyle = '#4a2a3a';
        ctx.fillRect(0, 70, W, 20);
        ctx.fillStyle = '#6a3a2a';
        ctx.fillRect(0, 90, W, 10);
        // Ground
        ctx.fillStyle = '#1a3a1a';
        ctx.fillRect(0, 100, W, 60);
        // Road
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(0, 115, W, 20);
        // Three heroes silhouettes walking right
        var heroColors = ['#4060c0', '#c04040', '#40a040'];
        var heroX = [80, 120, 160];
        for (var h = 0; h < 3; h++) {
            // Body
            ctx.fillStyle = heroColors[h];
            ctx.fillRect(heroX[h], 96, 10, 16);
            // Head
            ctx.fillStyle = '#e0c0a0';
            ctx.fillRect(heroX[h] + 1, 88, 8, 8);
            // Legs
            ctx.fillStyle = heroColors[h];
            ctx.fillRect(heroX[h], 112, 4, 6);
            ctx.fillRect(heroX[h] + 6, 112, 4, 6);
        }
        // Warrior sword
        ctx.fillStyle = '#c0c0d0';
        ctx.fillRect(92, 92, 2, 12);
        ctx.fillStyle = '#a08040';
        ctx.fillRect(91, 103, 4, 2);
        // Mage staff
        ctx.fillStyle = '#6a4a2a';
        ctx.fillRect(130, 86, 2, 20);
        ctx.fillStyle = '#60a0e0';
        ctx.fillRect(129, 83, 4, 4);
        // Rogue dagger
        ctx.fillStyle = '#c0c0d0';
        ctx.fillRect(170, 100, 6, 2);
        // Dawn glow behind heroes
        ctx.fillStyle = 'rgba(200,120,60,0.15)';
        ctx.fillRect(60, 70, 160, 50);
        // Distant town silhouette
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(10, 94, 30, 16);
        ctx.fillRect(15, 88, 20, 8);
        ctx.fillRect(220, 96, 26, 14);
        ctx.fillRect(224, 90, 18, 8);
    }

    var cutsceneRenderers = {
        town: drawCutsceneTown,
        forest: drawCutsceneForest,
        temple: drawCutsceneTemple,
        heroes: drawCutsceneHeroes
    };

    function renderIntro() {
        var ctx = buf;

        // Black background
        ctx.fillStyle = C.black;
        ctx.fillRect(0, 0, W, H);

        // Draw pixel art scene based on current dialogue's scene property
        var scene = Dialogue.getScene();
        if (scene && cutsceneRenderers[scene]) {
            cutsceneRenderers[scene](ctx);
            // Dim overlay so text is readable
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, 0, W, H);
        }

        // Render dialogue
        Dialogue.render(ctx);
    }

    function startGame() {
        // Create player based on selected character
        var charType = Game.characters[Game.selectedChar];
        try {
            Game.player = new Entities.Player(
                charType,
                Maps.startX * TILE,
                Maps.startY * TILE
            );
        } catch (e) {
            console.warn('Error creating player:', e);
        }

        // Apply difficulty scaling to player
        if (Game.player) {
            if (Game.difficulty === 0) { // Easy
                Game.player.maxHp += 4;
                Game.player.hp = Game.player.maxHp;
                Game.player.speed = 1.7;
            } else if (Game.difficulty === 2) { // Hard
                Game.player.maxHp = Math.max(4, Game.player.maxHp - 2);
                Game.player.hp = Game.player.maxHp;
            }
        }

        // Reset speed run timer
        Game.speedRunTime = 0;

        // Load starting room
        loadRoom(Maps.startRoom);

        Game.state = 'game';
        Game.cutsceneTimer = 0;
    }

    // =====================================================================
    // MAIN GAMEPLAY UPDATE
    // =====================================================================

    function updateGame() {
        // Track play time
        Game.playTime++;
        if (Game.speedRunEnabled) Game.speedRunTime++;

        // Soren's blessing timer
        if (Game.sorenBlessing && Game.sorenBlessingTimer > 0) {
            Game.sorenBlessingTimer--;
            if (Game.sorenBlessingTimer <= 0) {
                Game.sorenBlessing = false;
                if (Game.player) Game.player.speed = 1.5; // Reset speed
            }
        }

        // Pause check
        if (Input.pressed['p'] || Input.pressed['Escape']) {
            Game.pausedFromState = 'game';
            Game.state = 'paused';
            Game.pauseMenuIndex = 0;
            Game.pauseSubMenu = null;
            Audio.play('select');
            return;
        }

        // If shop is open: only update shop
        if (Game.shopOpen) {
            updateShop();
            return;
        }

        // If dialogue is active: only update dialogue (+ screen flash/particles so overlays fade properly)
        if (Dialogue.isActive()) {
            Dialogue.update();
            updateScreenFlash();
            Particles.update();
            if (Input.pressed['z']) {
                Dialogue.advance();
            }
            if (Input.pressed['x'] && Dialogue._canSkip) {
                Dialogue.skipAll();
            }
            return;
        }

        // If transition is active: only update transition
        if (Game.transition.active) {
            updateTransition();
            return;
        }

        // Slow motion: skip entity updates every other frame
        if (Game.slowMotion > 0) {
            Game.slowMotion--;
            if (Game.frame % 2 === 0) {
                // Skip entity updates this frame (effectively halving game speed)
                updateFloatingTexts();
                updateScreenFlash();
                Particles.update();
                return;
            }
        }

        // Camera hold: freeze camera on current position
        if (Game.cameraHold > 0) {
            Game.cameraHold--;
        }

        // Normal gameplay update
        if (Game.player) {
            // Update player (movement, attack)
            if (Game.player.update) {
                Game.player.update(Game.currentRoom);
            }

            // Check NPC interaction
            checkNPCInteraction();

            // Check item pickups
            checkItemPickup();

            // Check puzzle items
            checkPuzzleItems();
        }

        // Update boulders (temple puzzle)
        updateBoulders();

        // Update enemies
        for (var i = 0; i < Game.enemies.length; i++) {
            var enemy = Game.enemies[i];
            if (enemy.update) {
                enemy.update(Game.currentRoom, Game.player, Game.enemies);
            }
        }

        // Update heart drops
        updateHeartDrops();

        // Track HP before combat for floating damage numbers
        var playerHPBefore = Game.player ? Game.player.hp : 0;
        var enemyHPBefore = [];
        for (var ei = 0; ei < Game.enemies.length; ei++) {
            enemyHPBefore.push(Game.enemies[ei].hp);
        }

        // Combat resolution
        if (Game.player) {
            Entities.resolveCombat(Game.player, Game.enemies, Game.boss);
        }

        // Spawn floating damage numbers based on HP changes
        if (Game.player && Game.player.hp < playerHPBefore) {
            var dmg = playerHPBefore - Game.player.hp;
            var isBig = dmg >= 2;
            spawnFloatingText(Game.player.x + 2, Game.player.y - 4, dmg, C.red, isBig);
        }
        // Healing numbers (green) — detect HP increase
        if (Game.player && Game.player.hp > playerHPBefore) {
            var healed = Game.player.hp - playerHPBefore;
            spawnFloatingText(Game.player.x + 2, Game.player.y - 4, '+' + healed, C.paleGreen, false);
        }
        for (var ej = 0; ej < Game.enemies.length; ej++) {
            if (ej < enemyHPBefore.length && Game.enemies[ej].hp < enemyHPBefore[ej]) {
                var edmg = enemyHPBefore[ej] - Game.enemies[ej].hp;
                var eBig = edmg >= 3; // big number for heavy hits
                spawnFloatingText(Game.enemies[ej].x + 2, Game.enemies[ej].y - 6, edmg, C.white, eBig);
            }
        }

        // Heart shake timers: detect which hearts lost HP and shake them
        if (Game.player) {
            var maxHearts = Math.ceil(Game.player.maxHp / 2);
            // Initialize shake timers array if needed
            while (Game._heartShakeTimers.length < maxHearts) {
                Game._heartShakeTimers.push(0);
            }
            // If player took damage, find which hearts changed and shake them
            if (Game.player.hp < playerHPBefore) {
                var oldHP = playerHPBefore;
                var newHP = Game.player.hp;
                for (var hi = 0; hi < maxHearts; hi++) {
                    var oldHeart = Math.min(2, Math.max(0, oldHP - hi * 2));
                    var newHeart = Math.min(2, Math.max(0, newHP - hi * 2));
                    if (newHeart < oldHeart) {
                        Game._heartShakeTimers[hi] = 8;
                    }
                }
            }
            Game._prevHeartHP = Game.player.hp;
            // Tick down shake timers
            for (var hs = 0; hs < Game._heartShakeTimers.length; hs++) {
                if (Game._heartShakeTimers[hs] > 0) Game._heartShakeTimers[hs]--;
            }
        }

        // Puzzle item sparkle detection: detect newly collected items
        if (Game.flags.puzzleCrown && !Game._prevPuzzleFlags.puzzleCrown) {
            Game._puzzleSparkles.crown = 30;
        }
        if (Game.flags.puzzleCape && !Game._prevPuzzleFlags.puzzleCape) {
            Game._puzzleSparkles.cape = 30;
        }
        if (Game.flags.puzzleScepter && !Game._prevPuzzleFlags.puzzleScepter) {
            Game._puzzleSparkles.scepter = 30;
        }
        Game._prevPuzzleFlags.puzzleCrown = Game.flags.puzzleCrown;
        Game._prevPuzzleFlags.puzzleCape = Game.flags.puzzleCape;
        Game._prevPuzzleFlags.puzzleScepter = Game.flags.puzzleScepter;
        // Tick down sparkle timers
        if (Game._puzzleSparkles.crown > 0) Game._puzzleSparkles.crown--;
        if (Game._puzzleSparkles.cape > 0) Game._puzzleSparkles.cape--;
        if (Game._puzzleSparkles.scepter > 0) Game._puzzleSparkles.scepter--;

        // Handle character specials
        handleBrogSpecial();
        updateBrogDamage();
        handleDaxonShockwave();
        handleLirielleNatureBurst();

        // Check dead enemies & drops
        checkDeadEnemies();

        // Update floating texts and screen flash
        updateFloatingTexts();
        updateScreenFlash();

        // Update weather/ambient particles
        updateWeather();

        // Update particles
        Particles.update();

        // Check sign interaction
        checkSignInteraction();

        // Check spike trap hazards
        checkSpikeTraps();

        // Crumbling floor hazard
        updateCrumblingTiles();

        // Poison mushroom hazard
        updatePoisonMushroom();

        // Pass 4E: Check examine objects
        checkExamineObjects();

        // Pass 7A: Update destructible objects
        updateDestructibles();
        checkDestructibleCombat();

        // Pass 8B: Update torch flame reacts
        updateTorchReacts();

        // Ambient sounds
        updateAmbientSounds();

        // Pass 8B: Micro-animations
        updateMicroAnimations();


        // Check room exits
        checkRoomExits();

        // Check special room events
        checkSpecialRoomEvents();

        // Check game over
        checkGameOver();

        // Screenshake from player damage — scales with damage taken
        if (Game.player && Game.player._wasHurt) {
            var dmgShake = (Game.player._lastDamage >= 2) ? 6 : 4;
            Game.shake = Math.max(Game.shake, dmgShake);
            Game.shakeIntensity = (Game.player._lastDamage >= 2) ? 3 : 2;
            Game.player._wasHurt = false;
        }
        // Screenshake from player landing hits
        if (Game.player && Game.player._hitShake) {
            Game.shake = Math.max(Game.shake, Game.player._hitShake);
            Game.shakeIntensity = Math.max(Game.shakeIntensity || 1, Game.player._hitShake > 2 ? 2 : 1);
            Game.player._hitShake = 0;
        }
    }

    function renderGame() {
        var ctx = buf;

        // Clear buffer
        ctx.fillStyle = C.black;
        ctx.fillRect(0, 0, W, H);

        if (!Game.currentRoom) return;

        // Parallax background layer (subtle depth effect)
        renderParallaxBG(ctx);

        // Render map tiles
        renderMap(ctx, Game.currentRoom);

        // Crumbling floor tile overlay
        renderCrumblingTiles(ctx);

        // Torch warm glow (drawn on top of map, under entities)
        renderTorchGlow(ctx, Game.currentRoom);

        // Pass 8B: Torch flame react (lean-away animation)
        renderTorchReacts(ctx);

        // Pass 8B: Door open animation
        renderDoorAnimation(ctx);

        // Pass 7B: Puzzle room alcove glows + gem slots
        renderPuzzleRoomGlows(ctx);

        // Pass 8B: Micro-animations (grass bends, water ripples)
        renderMicroAnimations(ctx);

        // Render general items (potions, etc.)
        renderItems(ctx);

        // Render puzzle items (glowing, bobbing)
        renderPuzzleItems(ctx);

        // Render boulders (temple puzzle entrance blockers)
        renderBoulders(ctx);

        // Pass 7A: Render destructible objects (crates, barrels)
        renderDestructibles(ctx);

        // Render NPCs
        for (var n = 0; n < Game.npcs.length; n++) {
            var npc = Game.npcs[n];
            if (npc.render) {
                npc.render(ctx);
            } else {
                safeDraw(ctx, npc.sprite || npc.spriteKey, npc.x, npc.y);
            }
        }

        // Render heart drops (with scale-pulse animation)
        for (var h = 0; h < Game.heartDrops.length; h++) {
            var hd = Game.heartDrops[h];
            var bob = Math.sin((hd.bobTimer || 0) * 0.1) * 2;
            // Blink if about to despawn
            if (hd.life < 60 && Game.frame % 4 < 2) continue;
            // Scale pulse: oscillate between 0.9 and 1.1 using bobTimer
            var hdPulse = Math.sin((hd.bobTimer || 0) * 0.15);
            if (hdPulse > 0.5) {
                // Draw 1px larger (shift draw by -1, -1)
                safeDraw(ctx, 'item_heart', hd.x - 1, hd.y + bob - 1);
            } else {
                safeDraw(ctx, 'item_heart', hd.x, hd.y + bob);
            }
        }

        // Sort enemies by Y for painter's algorithm, then render
        var sortedEnemies = Game.enemies.slice().sort(function (a, b) {
            return a.y - b.y;
        });
        for (var e = 0; e < sortedEnemies.length; e++) {
            var enemy = sortedEnemies[e];
            if (enemy.render) {
                enemy.render(ctx);
            } else {
                safeDraw(ctx, enemy.sprite || enemy.spriteKey || 'enemy_goblin', enemy.x, enemy.y);
            }
        }

        // Render player
        if (Game.player && Game.player.render) {
            Game.player.render(ctx);
        }

        // Render environment particles (leaves, dust, embers, fireflies, wisps)
        renderEnvironmentParticles(ctx);

        // Render particles
        Particles.render(ctx);

        // Temple darkness overlay (over entities, under HUD)
        renderDarknessOverlay(ctx, Game.currentRoom);

        // Render floating damage numbers
        renderFloatingTexts(ctx);

        // Screen flash overlay (impact moments)
        renderScreenFlash(ctx);

        // Poison flash overlay (green tint when mushroom damages player)
        if (Game._poisonFlash && Game._poisonFlash > 0) {
            ctx.fillStyle = 'rgba(40,160,40,' + (Game._poisonFlash / 12) + ')';
            ctx.fillRect(0, 0, W, H);
        }
        // Subtle green vignette while standing near poison mushrooms
        if (Game._poisonNear) {
            var vingAlpha = 0.04 + Math.sin(Game.frame * 0.1) * 0.02;
            ctx.fillStyle = 'rgba(30,120,30,' + vingAlpha + ')';
            ctx.fillRect(0, 0, W, 3);
            ctx.fillRect(0, H - 3, W, 3);
            ctx.fillRect(0, 0, 3, H);
            ctx.fillRect(W - 3, 0, 3, H);
        }

        // Render HUD
        renderHUD(ctx);

        // Render NPC interaction prompt
        renderNPCPrompt(ctx);

        // Render sign interaction prompt
        renderSignPrompt(ctx);

        // Render speed run timer
        if (Game.speedRunEnabled) renderSpeedRunTimer(ctx);

        // Render goblin teeth count (when player has some)
        if (Game.goblinTeeth > 0) renderTeethCount(ctx);

        // Render dialogue box
        Dialogue.render(ctx);

        // Render shop overlay
        renderShop(ctx);

        // Render transition overlay
        renderTransition(ctx);

        // Render room name
        renderRoomName(ctx);

        // Render Soren blessing indicator
        if (Game.sorenBlessing) {
            var blinkOn = Math.floor(Game.sorenBlessingTimer / 30) % 2 === 0 || Game.sorenBlessingTimer > 120;
            if (blinkOn) {
                Utils.drawText(ctx, 'BLESSED', 2, H - 20, C.paleBlue, 1);
            }
        }
    }

    // =====================================================================
    // BOSS INTRO STATE
    // =====================================================================

    function updateBossIntro() {
        Dialogue.update();

        if (Input.pressed['z']) {
            Dialogue.advance();
        }
        if (Input.pressed['x'] && Dialogue._canSkip) {
            Dialogue.skipAll();
        }
    }

    function renderBossIntro() {
        // Render the game scene behind dialogue
        renderGame();
    }

    // =====================================================================
    // BOSS FIGHT STATE
    // =====================================================================

    function updateBoss() {
        // Track play time
        Game.playTime++;

        // Pause check
        if (Input.pressed['p'] || Input.pressed['Escape']) {
            Game.pausedFromState = 'boss';
            Game.state = 'paused';
            Game.pauseMenuIndex = 0;
            Game.pauseSubMenu = null;
            Audio.play('select');
            return;
        }

        // If dialogue is active: only update dialogue (+ screen flash/particles so overlays fade)
        if (Dialogue.isActive()) {
            Dialogue.update();
            updateScreenFlash();
            Particles.update();
            if (Input.pressed['z']) {
                Dialogue.advance();
            }
            if (Input.pressed['x'] && Dialogue._canSkip) {
                Dialogue.skipAll();
            }
            return;
        }

        // If transition is active
        if (Game.transition.active) {
            updateTransition();
            return;
        }

        // Update player
        if (Game.player && Game.player.update) {
            Game.player.update(Game.currentRoom);
        }

        // Update boss
        if (Game.boss && Game.boss.update) {
            Game.boss.update(Game.currentRoom, Game.player);
        }

        // Update enemies (boss may summon minions)
        for (var i = 0; i < Game.enemies.length; i++) {
            if (Game.enemies[i].update) {
                Game.enemies[i].update(Game.currentRoom, Game.player, Game.enemies);
            }
        }

        // Track HP before combat for floating damage numbers
        var bPlayerHP = Game.player ? Game.player.hp : 0;
        var bBossHP = (Game.boss && !Game.boss.dead) ? Game.boss.hp : 0;

        // Combat resolution
        if (Game.player) {
            Entities.resolveCombat(Game.player, Game.enemies, Game.boss);
        }

        // Spawn floating damage numbers
        if (Game.player && Game.player.hp < bPlayerHP) {
            spawnFloatingText(Game.player.x + 2, Game.player.y - 4, bPlayerHP - Game.player.hp, C.red);
        }
        if (Game.boss && !Game.boss.dead && Game.boss.hp < bBossHP) {
            spawnFloatingText(Game.boss.x + 8, Game.boss.y - 6, bBossHP - Game.boss.hp, C.white);
        }

        // Handle character specials
        handleBrogSpecial();
        updateBrogDamage();
        handleDaxonShockwave();
        handleLirielleNatureBurst();

        // Heart drops
        updateHeartDrops();

        // Dead enemies
        checkDeadEnemies();

        // Update floating texts and screen flash
        updateFloatingTexts();
        updateScreenFlash();

        // Update weather/ambient particles (boss wisps, embers)
        updateWeather();

        // Particles
        Particles.update();

        // Check game over
        checkGameOver();

        // Screenshake from player damage — scales with damage taken
        if (Game.player && Game.player._wasHurt) {
            var bDmgShake = (Game.player._lastDamage >= 2) ? 7 : 5;
            Game.shake = Math.max(Game.shake, bDmgShake);
            Game.shakeIntensity = (Game.player._lastDamage >= 2) ? 4 : 2;
            Game.player._wasHurt = false;
        }
        // Screenshake from player landing hits on boss
        if (Game.player && Game.player._hitShake) {
            Game.shake = Math.max(Game.shake, Game.player._hitShake + 1);
            Game.shakeIntensity = Math.max(Game.shakeIntensity || 1, 2);
            Game.player._hitShake = 0;
        }

        // Boss screenshake on hit (increased)
        if (Game.boss && Game.boss._wasHurt) {
            Game.shake = 5;
            Game.boss._wasHurt = false;
        }

        // Boss Phase 2: spawn minion goblins
        if (Game.boss && Game.boss._requestMinions && !Game.boss.dead) {
            Game.boss._requestMinions = false;
            // Spawn 2 goblins at opposite corners
            Game.enemies.push(new Entities.Enemy('goblin', 2, 10));
            Game.enemies.push(new Entities.Enemy('goblin', 13, 10));
            Particles.burst(2 * TILE + 8, 10 * TILE + 8, 8, C.green);
            Particles.burst(13 * TILE + 8, 10 * TILE + 8, 8, C.green);
        }

        // Check boss defeated
        if (Game.boss && Game.boss.dead) {
            Game.bossDeathTimer++;
            var bx = Game.boss.x + 8;
            var by = Game.boss.y + 8;
            var t = Game.bossDeathTimer;

            // === PHASE 1: INITIAL SHOCK (frames 1-30) ===
            if (t === 1) {
                Game.shake = 12;
                Audio.play('explosion');
                Particles.burst(bx, by, 40, C.red);
                Particles.burst(bx, by, 25, C.darkPurple);
                if (Music) Music.stop();
            }
            if (t === 12) {
                Game.shake = 8;
                Audio.play('explosion');
                Particles.burst(bx - 12, by + 10, 20, C.gold);
                Particles.burst(bx + 14, by - 6, 15, C.red);
            }
            if (t === 22) {
                Game.shake = 6;
                Audio.play('explosion');
                // Shadow wisps flying outward
                for (var sw = 0; sw < 10; sw++) {
                    var angle = (sw / 10) * Math.PI * 2;
                    Particles.add(bx, by, {
                        vx: Math.cos(angle) * 1.5,
                        vy: Math.sin(angle) * 1.5,
                        life: 45,
                        color: C.darkPurple,
                        size: 2,
                        gravity: -0.02
                    });
                }
            }

            // === PHASE 2: STAGGERED ERUPTIONS (frames 30-80) ===
            if (t === 35) {
                Game.shake = 10;
                Audio.play('explosion');
                Particles.burst(bx + 20, by - 8, 30, C.red);
                Particles.ring(bx, by, 30, 20, C.purple);
            }
            if (t === 48) {
                Game.shake = 8;
                Audio.play('explosion');
                Particles.burst(bx - 18, by + 14, 25, C.gold);
                Particles.burst(bx + 10, by + 10, 15, C.red);
            }
            if (t === 60) {
                Game.shake = 12;
                Audio.play('explosion');
                Particles.ring(bx, by, 40, 25, C.gold);
                Particles.burst(bx, by, 35, C.white);
                triggerScreenFlash('#FFFFFF', 8);
            }
            if (t === 72) {
                Game.shake = 6;
                Audio.play('explosion');
                Particles.burst(bx - 20, by - 10, 20, C.purple);
                Particles.burst(bx + 22, by + 8, 20, C.red);
            }

            // Continuous sparks through eruptions
            if (t > 25 && t < 85 && t % 4 === 0) {
                var sparkX = bx + (Math.random() - 0.5) * 36;
                var sparkY = by + (Math.random() - 0.5) * 24;
                Particles.burst(sparkX, sparkY, 4, Utils.choice([C.red, C.purple, C.darkPurple, C.gold]));
            }

            // === PHASE 3: "IT'S FINALLY OVER" FAKE-OUT (frames 85-180) ===
            // Things calm down... the sparks stop... a gentle beat...
            // 90 full frames of silence for maximum comedy
            if (t === 90) {
                Particles.ring(bx, by, 50, 30, C.paleBlue);
            }

            // === PHASE 4: NOPE, EVEN BIGGER (frames 180-240) ===
            if (t === 180) {
                Game.shake = 16;
                Audio.play('explosion');
                Audio.play('explosion');
                Particles.burst(bx, by, 50, C.red);
                Particles.burst(bx, by, 40, C.gold);
                Particles.ring(bx, by, 60, 35, C.white);
                triggerScreenFlash('#FF4400', 10);
            }
            if (t === 192) {
                Game.shake = 12;
                Audio.play('explosion');
                Particles.burst(bx - 25, by, 30, C.purple);
                Particles.burst(bx + 25, by, 30, C.red);
                Particles.confetti(bx, by - 20, 15);
            }
            if (t === 204) {
                Game.shake = 14;
                Audio.play('explosion');
                Particles.ring(bx, by, 45, 30, C.gold);
                Particles.burst(bx, by - 10, 35, C.lightRed);
            }
            if (t === 215) {
                Game.shake = 10;
                Audio.play('explosion');
                Particles.burst(bx + 15, by - 15, 25, C.white);
                Particles.burst(bx - 15, by + 15, 25, C.gold);
            }
            // Rapid fire sparks
            if (t > 180 && t < 230 && t % 3 === 0) {
                var sx2 = bx + (Math.random() - 0.5) * 50;
                var sy2 = by + (Math.random() - 0.5) * 40;
                Particles.burst(sx2, sy2, 6, Utils.choice([C.red, C.gold, C.white, C.purple]));
                if (t % 6 === 0) Audio.play('explosion');
            }

            // === PHASE 5: ANOTHER CALM... (frames 240-270) ===
            if (t === 240) {
                triggerScreenFlash('#FFFFFF', 12);
                Game.shake = 18;
                Audio.play('explosion');
                Particles.burst(bx, by, 60, C.white);
                Particles.ring(bx, by, 70, 40, C.gold);
            }

            // === PHASE 6: RIDICULOUS GRAND FINALE (frames 270-360) ===
            // Explosions start chaining across the whole room
            if (t === 275) {
                Game.shake = 14;
                Audio.play('explosion');
                Particles.burst(3 * TILE, 4 * TILE, 25, C.red);
                Particles.burst(12 * TILE, 4 * TILE, 25, C.gold);
            }
            if (t === 285) {
                Game.shake = 16;
                Audio.play('explosion');
                Particles.burst(5 * TILE, 9 * TILE, 30, C.purple);
                Particles.burst(10 * TILE, 3 * TILE, 30, C.red);
                Particles.ring(bx, by, 55, 30, C.lightPurple);
            }
            if (t === 295) {
                Game.shake = 12;
                Audio.play('explosion');
                Particles.burst(2 * TILE, 7 * TILE, 20, C.gold);
                Particles.burst(13 * TILE, 8 * TILE, 20, C.red);
                Particles.confetti(bx, by - 10, 20);
            }
            if (t === 305) {
                Game.shake = 18;
                Audio.play('explosion');
                Particles.burst(bx, by, 45, C.gold);
                Particles.burst(7 * TILE, 2 * TILE, 25, C.white);
                Particles.burst(8 * TILE, 10 * TILE, 25, C.purple);
            }
            if (t === 315) {
                Game.shake = 14;
                Audio.play('explosion');
                // Ring from every corner
                Particles.ring(0, 0, 30, 15, C.red);
                Particles.ring(W, 0, 30, 15, C.gold);
                Particles.ring(0, H, 30, 15, C.purple);
                Particles.ring(W, H, 30, 15, C.white);
            }
            if (t === 325) {
                Game.shake = 20;
                Audio.play('explosion');
                Particles.burst(bx, by, 60, C.red);
                Particles.ring(bx, by, 80, 50, C.gold);
                triggerScreenFlash('#FF2200', 10);
            }
            if (t === 335) {
                Game.shake = 16;
                Audio.play('explosion');
                Particles.confetti(bx - 30, by, 15);
                Particles.confetti(bx + 30, by, 15);
                Particles.confetti(bx, by - 20, 15);
                Particles.burst(bx, by, 40, C.lightPurple);
            }
            // Constant chaos during finale
            if (t > 270 && t < 345 && t % 3 === 0) {
                var fx = Math.random() * W;
                var fy = Math.random() * H;
                Particles.burst(fx, fy, 8, Utils.choice([C.red, C.gold, C.purple, C.white, C.lightRed, C.lightPurple]));
            }

            // === PHASE 7: THE ACTUAL FINAL EXPLOSION (frames 350-380) ===
            if (t === 350) {
                Game.shake = 25;
                Audio.play('explosion');
                Audio.play('explosion');
                triggerScreenFlash('#FFFFFF', 20);
                // Everything at once
                Particles.burst(bx, by, 80, C.white);
                Particles.burst(bx, by, 60, C.gold);
                Particles.burst(bx, by, 40, C.red);
                Particles.ring(bx, by, 100, 60, C.paleBlue);
                Particles.confetti(bx, by - 30, 30);
                Particles.confetti(bx - 40, by, 20);
                Particles.confetti(bx + 40, by, 20);
            }
            if (t === 365) {
                // Room brightens - the darkness finally lifts
                Particles.ring(W / 2, H / 2, 90, 50, C.paleBlue);
                Particles.ring(W / 2, H / 2, 60, 30, C.white);
            }

            // === PHASE 8: BARGNOT REACHES OUT (frames 370-409) ===
            if (t >= 370 && t < 410) {
                Game._bossReachOut = true;
            }
            if (t === 410) {
                Game._bossReachOut = false;
            }

            // === PHASE 9: BARGNOT'S LAST WORDS (frame 410) ===
            if (t === 410) {
                Game.bossDialogueStage = 1;
                Dialogue.start('boss_defeat', function () {
                    // Rorik rescue dialogue
                    Game.bossDialogueStage = 2;
                    Dialogue.start('victory_rorik', function () {
                        // Switch to epilogue cutscene for Nitriti
                        Game.bossDialogueStage = 3;
                        Game.state = 'epilogue';
                        Game.epilogueTimer = 0;
                    });
                });
            }
        }
    }

    function renderBoss() {
        var ctx = buf;

        // Clear buffer
        ctx.fillStyle = C.black;
        ctx.fillRect(0, 0, W, H);

        if (!Game.currentRoom) return;

        // Parallax background layer (subtle depth effect)
        renderParallaxBG(ctx);

        // Render map tiles
        renderMap(ctx, Game.currentRoom);

        // Torch warm glow
        renderTorchGlow(ctx, Game.currentRoom);

        // Pass 8B: Torch flame react
        renderTorchReacts(ctx);

        // Pass 8B: Door open animation
        renderDoorAnimation(ctx);

        // Render NPCs
        for (var n = 0; n < Game.npcs.length; n++) {
            var npc = Game.npcs[n];
            if (npc.render) {
                npc.render(ctx);
            } else {
                safeDraw(ctx, npc.sprite || npc.spriteKey, npc.x, npc.y);
            }
        }

        // Render heart drops (with scale-pulse animation)
        for (var h = 0; h < Game.heartDrops.length; h++) {
            var hd = Game.heartDrops[h];
            var bob = Math.sin((hd.bobTimer || 0) * 0.1) * 2;
            if (hd.life < 60 && Game.frame % 4 < 2) continue;
            var hdPulse2 = Math.sin((hd.bobTimer || 0) * 0.15);
            if (hdPulse2 > 0.5) {
                safeDraw(ctx, 'item_heart', hd.x - 1, hd.y + bob - 1);
            } else {
                safeDraw(ctx, 'item_heart', hd.x, hd.y + bob);
            }
        }

        // Render enemies (sorted by Y)
        var sortedEnemies = Game.enemies.slice().sort(function (a, b) {
            return a.y - b.y;
        });
        for (var e = 0; e < sortedEnemies.length; e++) {
            var enemy = sortedEnemies[e];
            if (enemy.render) {
                enemy.render(ctx);
            }
        }

        // Boss charge floor-tile telegraph
        if (Game.boss && !Game.boss.dead && Game.boss.state === 'charge' && Game.boss.stateTimer > Game.boss._chargeWindup) {
            // Telegraph phase: draw flashing red rectangles along the charge lane
            var chargeAngle = Game.boss._chargeAngle || 0;
            var bossCX = Game.boss.x + Game.boss.w / 2;
            var bossCY = Game.boss.y + Game.boss.h / 2;
            var flashVisible = Math.floor(Game.frame / 4) % 2 === 0;
            if (flashVisible) {
                ctx.fillStyle = 'rgba(200,40,40,0.35)';
                for (var tStep = 1; tStep <= 12; tStep++) {
                    var telegX = bossCX + Math.cos(chargeAngle) * tStep * TILE;
                    var telegY = bossCY + Math.sin(chargeAngle) * tStep * TILE;
                    // Clamp to screen
                    if (telegX < -TILE || telegX > W + TILE || telegY < -TILE || telegY > H + TILE) break;
                    ctx.fillRect(Math.floor(telegX - TILE * 1.5), Math.floor(telegY - TILE / 2), TILE * 3, TILE);
                }
            }
        }

        // Render boss (with death animation effects)
        if (Game.boss && Game.boss.render) {
            if (Game.boss.dead && Game.bossDeathTimer > 0) {
                var dt = Game.bossDeathTimer;
                // Flicker during explosions, speed up flickering as it goes on
                var flickerRate = dt < 180 ? 3 : dt < 270 ? 2 : 1;
                var deathFlicker = dt < 350 && Math.floor(dt / flickerRate) % 2 === 0;
                // Fade out during the final explosion
                var deathAlpha = dt < 350 ? 1 : Math.max(0, 1 - (dt - 350) / 40);
                ctx.globalAlpha = deathAlpha;
                if (!deathFlicker) {
                    // Boss reaches out toward player during final frames
                    if (Game._bossReachOut && Game.player) {
                        ctx.save();
                        var reachDx = Game.player.x - Game.boss.x;
                        var reachAngle = reachDx > 0 ? 0.15 : -0.15;
                        ctx.translate(Game.boss.x + Game.boss.w / 2, Game.boss.y + Game.boss.h / 2);
                        ctx.rotate(reachAngle);
                        ctx.translate(-(Game.boss.x + Game.boss.w / 2), -(Game.boss.y + Game.boss.h / 2));
                        Game.boss.render(ctx);
                        ctx.restore();
                    } else {
                        Game.boss.render(ctx);
                    }
                }
                ctx.globalAlpha = 1;
            } else {
                Game.boss.render(ctx);
            }
        }

        // Render player
        if (Game.player && Game.player.render) {
            Game.player.render(ctx);
        }

        // Environment particles (embers, boss wisps)
        renderEnvironmentParticles(ctx);

        // Particles
        Particles.render(ctx);

        // Temple darkness overlay (lighten during boss death)
        if (Game.boss && Game.boss.dead && Game.bossDeathTimer > 240) {
            // Room gradually brightens - the darkness lifts after the chaos
            var brightAlpha = Math.min(1, (Game.bossDeathTimer - 240) / 80);
            ctx.fillStyle = 'rgba(200,200,255,' + (brightAlpha * 0.08) + ')';
            ctx.fillRect(0, 0, W, H);
        } else {
            renderDarknessOverlay(ctx, Game.currentRoom);
        }

        // White flash at the moment of the grand final explosion
        if (Game.boss && Game.boss.dead && Game.bossDeathTimer > 348 && Game.bossDeathTimer < 370) {
            var flashAlpha = Math.max(0, 1 - (Game.bossDeathTimer - 348) / 22);
            ctx.fillStyle = 'rgba(255,255,255,' + flashAlpha + ')';
            ctx.fillRect(0, 0, W, H);
        }

        // Floating damage numbers
        renderFloatingTexts(ctx);

        // Screen flash overlay
        renderScreenFlash(ctx);

        // HUD
        renderHUD(ctx);

        // Boss health bar: rendered by boss entity (renderHPBar) during both alive and death states

        // Dialogue
        Dialogue.render(ctx);

        // Room name
        renderRoomName(ctx);
    }

    // =====================================================================
    // GAME OVER SCREEN
    // =====================================================================

    // --- Pass 6F: Cinematic game over screen ---

    function updateGameOver() {
        Game.gameOverTimer++;

        // Track death for adaptive difficulty (Pass 7E)
        if (Game.gameOverTimer === 1) {
            Game.playerHasDied = true;
            var roomId = Game.currentRoom ? Game.currentRoom.id : 'unknown';
            Game.deathCounts[roomId] = (Game.deathCounts[roomId] || 0) + 1;
        }

        // Menu appears after 50 frames
        if (Game.gameOverTimer > 50) {
            if (Input.pressed['ArrowUp'] || Input.pressed['ArrowDown']) {
                Game.gameOverMenuIndex = Game.gameOverMenuIndex === 0 ? 1 : 0;
                Audio.play('select');
            }
            if (Input.pressed['z'] || Input.pressed['Enter']) {
                Audio.play('select');
                if (Game.gameOverMenuIndex === 0) {
                    // Continue: respawn at last safe room
                    if (Game.player) {
                        Game.player.hp = Game.player.maxHp;
                        Game.player.dead = false;
                    }
                    Game.boss = null;
                    Game.bossDeathTimer = 0;
                    Game.bossDialogueStage = 0;
                    Game.state = 'game';
                    loadRoom(Game.lastSafeRoom);
                    if (Game.player) {
                        Game.player.x = Game.lastSafeX * TILE;
                        Game.player.y = Game.lastSafeY * TILE;
                    }
                } else {
                    // Quit to title
                    fullReset();
                }
            }
        }
    }

    function renderGameOver() {
        var ctx = buf;
        var t = Game.gameOverTimer;

        // Slow desaturation: render game scene, then overlay
        if (Game.pausedFromState === 'boss') {
            renderBoss();
        } else if (t < 30) {
            renderGame();
        }

        // Progressive darken + red tint
        var desatAlpha = Math.min(t / 25, 1.0);
        ctx.fillStyle = 'rgba(0,0,5,' + (desatAlpha * 0.85).toFixed(2) + ')';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(60,5,5,' + (desatAlpha * 0.35).toFixed(2) + ')';
        ctx.fillRect(0, 0, W, H);

        // Player silhouette kneeling (after desaturation completes)
        if (t > 15 && Game.player) {
            var charId = Game.player.characterId;
            var sprKey = charId + '_down_0';
            var sprCanvas = Sprites.get(sprKey);
            if (sprCanvas) {
                var sprAlpha = Math.min((t - 15) / 20, 0.7);
                ctx.save();
                ctx.globalAlpha = sprAlpha;
                // Draw kneeling (rotated slightly)
                ctx.translate(W / 2, H / 2 - 44);
                ctx.rotate(0.3);
                ctx.drawImage(sprCanvas, -8, -12);
                ctx.restore();
            }
        }

        // "GAME OVER" text fades in
        if (t > 20) {
            var textAlpha = Math.min((t - 20) / 20, 1.0);
            ctx.globalAlpha = textAlpha;
            var goText = 'GAME OVER';
            var goX = centerTextX(goText, 2);
            // Shadow
            Utils.drawText(ctx, goText, goX + 1, H / 2 - 19, C.darkRed, 2);
            Utils.drawText(ctx, goText, goX, H / 2 - 20, C.red, 2);
            ctx.globalAlpha = 1;
        }

        // Flavor text
        if (t > 35) {
            var flavorAlpha = Math.min((t - 35) / 20, 0.8);
            ctx.globalAlpha = flavorAlpha;
            var flavorText = 'The darkness claims another...';
            Utils.drawText(ctx, flavorText, centerTextX(flavorText, 1), H / 2 - 2, C.lightGray, 1);
            ctx.globalAlpha = 1;
        }

        // Menu options appear after 50 frames
        if (t > 50) {
            var menuAlpha = Math.min((t - 50) / 15, 1.0);
            ctx.globalAlpha = menuAlpha;

            var opts = ['Continue', 'Quit to Title'];
            for (var i = 0; i < opts.length; i++) {
                var oy = H / 2 + 24 + i * 16;
                var isSel = (i === Game.gameOverMenuIndex);

                if (isSel) {
                    var bounce = Math.floor(Math.sin(Game.frame * 0.12) * 2);
                    Utils.drawText(ctx, '>', centerTextX(opts[i], 1) - 10 + bounce, oy, C.gold, 1);
                }
                Utils.drawText(ctx, opts[i], centerTextX(opts[i], 1), oy, isSel ? C.white : C.gray, 1);
            }
            ctx.globalAlpha = 1;
        }
    }

    // =====================================================================
    // EPILOGUE CUTSCENE (Nitriti's message after boss defeat)
    // =====================================================================

    function updateEpilogue() {
        Game.epilogueTimer++;

        if (!Dialogue.isActive() && Game.epilogueTimer === 1) {
            // Start ethereal music for Nitriti's monologue
            if (Music) Music.play('epilogue');
            Dialogue.start('ending_nitriti', function () {
                Game.flags.bossDefeated = true;
                // Unlock lore entries from the ending
                Game.loreEntries['lore_nitriti'] = true;
                Game.loreEntries['lore_smaldge'] = true;
                Game.loreEntries['lore_bonemoon'] = true;
                Game.loreEntries['lore_eldspyre'] = true;
                Game.state = 'victory';
                Game.victoryDialogueDone = false;
                Game.creditsY = H + 20;
                Audio.play('victory');
                if (Music) Music.play('victory');
            });
        }

        Dialogue.update();

        if (Input.pressed['z']) {
            Dialogue.advance();
        }
        if (Input.pressed['x'] && Dialogue._canSkip) {
            Dialogue.skipAll();
        }

        // Ambient particles - gentle spirit sparkles
        if (Game.epilogueTimer % 8 === 0) {
            Particles.add(Utils.randInt(20, W - 20), H + 5, {
                vx: (Math.random() - 0.5) * 0.3,
                vy: -(0.3 + Math.random() * 0.5),
                life: 80 + Utils.randInt(0, 40),
                color: Utils.choice([C.paleBlue, '#aaccff', '#8ab8f0', C.white]),
                size: 1,
                gravity: -0.01
            });
        }

        Particles.update();
    }

    function drawEpilogueNitriti(ctx) {
        // Ethereal spirit realm - deep blue void with starlight
        ctx.fillStyle = '#050818';
        ctx.fillRect(0, 0, W, 160);

        // Stars in varying sizes
        ctx.fillStyle = '#ffffff';
        var epiStars = [[15,12],[40,30],[80,8],[120,22],[160,15],[200,28],[240,10],
                        [30,50],[70,42],[110,55],[150,38],[190,48],[230,42],
                        [25,70],[60,80],[100,68],[140,75],[180,65],[220,78]];
        for (var s = 0; s < epiStars.length; s++) {
            var twinkle = Math.sin(Game.epilogueTimer * 0.05 + s) * 0.5 + 0.5;
            ctx.globalAlpha = 0.3 + twinkle * 0.7;
            ctx.fillRect(epiStars[s][0], epiStars[s][1], 1, 1);
        }
        ctx.globalAlpha = 1;

        // Nitriti's spirit form - tall ethereal figure, pale blue
        var centerX = 118;
        var floatY = Math.sin(Game.epilogueTimer * 0.03) * 3;
        // Flowing robes
        ctx.fillStyle = '#4060a0';
        ctx.fillRect(centerX, 60 + floatY, 20, 40);
        ctx.fillRect(centerX - 4, 75 + floatY, 28, 30);
        ctx.fillRect(centerX - 8, 90 + floatY, 36, 20);
        // Body glow
        ctx.fillStyle = 'rgba(120,170,240,0.3)';
        ctx.fillRect(centerX - 12, 50 + floatY, 44, 70);
        // Face
        ctx.fillStyle = '#c0d8f0';
        ctx.fillRect(centerX + 4, 52 + floatY, 12, 12);
        // Eyes (glowing)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(centerX + 6, 56 + floatY, 2, 2);
        ctx.fillRect(centerX + 12, 56 + floatY, 2, 2);
        // Crown/halo
        ctx.fillStyle = '#8ab8f0';
        ctx.fillRect(centerX + 2, 48 + floatY, 16, 3);
        ctx.fillStyle = '#aad0ff';
        ctx.fillRect(centerX + 6, 45 + floatY, 8, 3);
        // Spirit trails flowing down
        ctx.fillStyle = 'rgba(100,150,220,0.2)';
        for (var t = 0; t < 3; t++) {
            var tx = centerX + 4 + t * 6 + Math.sin(Game.epilogueTimer * 0.04 + t) * 3;
            ctx.fillRect(tx, 110 + floatY, 2, 40);
        }
    }

    function drawEpilogueDarkness(ctx) {
        // Ominous scene - dark swirling void with red undertones
        ctx.fillStyle = '#080408';
        ctx.fillRect(0, 0, W, 160);

        // Bone moon
        ctx.fillStyle = '#d0c8b0';
        ctx.fillRect(188, 15, 20, 20);
        ctx.fillStyle = '#e0d8c0';
        ctx.fillRect(190, 17, 16, 16);
        // Craters
        ctx.fillStyle = '#b0a890';
        ctx.fillRect(193, 20, 4, 3);
        ctx.fillRect(199, 25, 3, 2);

        // Dark tendrils reaching across the sky
        ctx.fillStyle = 'rgba(60,10,20,0.6)';
        for (var i = 0; i < 6; i++) {
            var ty = 30 + i * 18 + Math.sin(Game.epilogueTimer * 0.02 + i * 1.5) * 8;
            ctx.fillRect(0, ty, W, 4);
        }

        // Darkened landscape silhouette
        ctx.fillStyle = '#0a0408';
        ctx.fillRect(0, 110, W, 50);
        // Dead trees
        ctx.fillStyle = '#1a0a10';
        ctx.fillRect(30, 85, 4, 30);
        ctx.fillRect(26, 80, 12, 6);
        ctx.fillRect(90, 90, 4, 25);
        ctx.fillRect(86, 86, 12, 5);
        ctx.fillRect(180, 88, 4, 27);
        ctx.fillRect(176, 83, 12, 6);

        // Red glow on horizon
        ctx.fillStyle = 'rgba(80,10,10,0.4)';
        ctx.fillRect(0, 100, W, 20);
    }

    function drawEpilogueEldspyre(ctx) {
        var t = Game.epilogueTimer;

        // Night sky gradient - deep blue to purple horizon
        ctx.fillStyle = '#05051a';
        ctx.fillRect(0, 0, W, 30);
        ctx.fillStyle = '#0a0a25';
        ctx.fillRect(0, 30, W, 20);
        ctx.fillStyle = '#10102a';
        ctx.fillRect(0, 50, W, 15);
        ctx.fillStyle = '#1a1035';
        ctx.fillRect(0, 65, W, 10);
        ctx.fillStyle = '#251540';
        ctx.fillRect(0, 75, W, 8);
        ctx.fillStyle = '#301a3a';
        ctx.fillRect(0, 83, W, 7);

        // Animated stars - slowly drifting across the sky
        var starField = [
            [30,6,1.2],[55,12,0.8],[80,4,1.0],[110,18,0.6],[140,8,1.1],
            [170,14,0.9],[200,5,0.7],[230,10,1.3],[15,22,0.5],[65,26,1.0],
            [95,20,0.8],[125,3,1.2],[155,24,0.6],[185,16,1.1],[215,9,0.9],
            [245,20,0.7],[40,16,1.0],[100,28,0.5],[160,2,1.3],[190,22,0.8],
            [10,10,0.6],[50,30,0.9],[120,10,1.1],[175,28,0.7],[210,18,1.0],
            [70,8,1.2],[135,22,0.5],[225,4,0.9],[20,28,1.1],[150,12,0.6]
        ];
        for (var si = 0; si < starField.length; si++) {
            var sx = (starField[si][0] + t * starField[si][2] * 0.15) % W;
            var sy = starField[si][1];
            var sBright = 0.4 + Math.sin(t * 0.05 + si * 1.7) * 0.35;
            ctx.fillStyle = 'rgba(255,255,255,' + sBright + ')';
            var sSize = (si % 3 === 0) ? 2 : 1;
            ctx.fillRect(sx, sy, sSize, sSize);
            // Twinkle cross for brighter stars
            if (sSize === 2 && sBright > 0.6) {
                ctx.fillStyle = 'rgba(255,255,255,' + (sBright * 0.4) + ')';
                ctx.fillRect(sx - 1, sy + 0.5, 1, 1);
                ctx.fillRect(sx + 2, sy + 0.5, 1, 1);
            }
        }

        // Mountain range - layered silhouettes
        // Far mountains (lighter)
        ctx.fillStyle = '#1a1a30';
        // Far left mountain
        ctx.fillRect(0, 72, 45, 18);
        ctx.fillRect(5, 65, 35, 7);
        ctx.fillRect(12, 58, 21, 7);
        ctx.fillRect(18, 52, 9, 6);
        // Far center-left
        ctx.fillRect(35, 70, 50, 20);
        ctx.fillRect(42, 60, 36, 10);
        ctx.fillRect(50, 50, 20, 10);
        ctx.fillRect(56, 44, 8, 6);
        // Far right
        ctx.fillRect(180, 68, 76, 22);
        ctx.fillRect(190, 58, 56, 10);
        ctx.fillRect(200, 48, 36, 10);
        ctx.fillRect(210, 40, 16, 8);
        ctx.fillRect(214, 34, 8, 6);

        // Mid mountains (darker)
        ctx.fillStyle = '#12122a';
        ctx.fillRect(60, 75, 70, 15);
        ctx.fillRect(70, 65, 50, 10);
        ctx.fillRect(80, 55, 30, 10);
        ctx.fillRect(88, 48, 14, 7);
        ctx.fillRect(92, 42, 6, 6);

        // Near mountains (darkest)
        ctx.fillStyle = '#0a0a20';
        // The Eldspyre - tallest peak, center
        ctx.fillRect(100, 78, 60, 12);
        ctx.fillRect(108, 65, 44, 13);
        ctx.fillRect(116, 52, 28, 13);
        ctx.fillRect(122, 40, 16, 12);
        ctx.fillRect(126, 32, 8, 8);
        ctx.fillRect(128, 26, 4, 6);

        // Glowing tip of the Eldspyre
        var glowPulse = Math.sin(t * 0.06) * 0.3 + 0.7;
        ctx.fillStyle = 'rgba(255,200,100,' + (glowPulse * 0.4) + ')';
        ctx.fillRect(125, 22, 10, 10);
        ctx.fillStyle = 'rgba(255,220,150,' + (glowPulse * 0.6) + ')';
        ctx.fillRect(127, 24, 6, 6);
        ctx.fillStyle = 'rgba(255,255,200,' + (glowPulse * 0.9) + ')';
        ctx.fillRect(129, 26, 2, 2);

        // Light rays upward from peak
        ctx.fillStyle = 'rgba(255,200,100,' + (glowPulse * 0.08) + ')';
        ctx.fillRect(126, 0, 8, 26);
        ctx.fillStyle = 'rgba(255,200,100,' + (glowPulse * 0.05) + ')';
        ctx.fillRect(122, 0, 16, 22);

        // Ground / cliff edge the heroes stand on
        ctx.fillStyle = '#0c1a0c';
        ctx.fillRect(0, 90, W, 70);
        // Grass tufts on the cliff edge
        ctx.fillStyle = '#142a14';
        ctx.fillRect(10, 89, 3, 2); ctx.fillRect(35, 88, 4, 3);
        ctx.fillRect(70, 89, 3, 2); ctx.fillRect(160, 88, 4, 3);
        ctx.fillRect(200, 89, 3, 2); ctx.fillRect(240, 88, 2, 3);

        // Three hero silhouettes on the cliff edge, looking at mountains
        // They're drawn as dark pixel art outlines with subtle color hints

        // Left hero (warrior stance - Daxon) at x=85
        var hx = 85;
        var hy = 74;
        ctx.fillStyle = '#080818';
        // Head
        ctx.fillRect(hx+2, hy, 4, 4);
        // Neck
        ctx.fillRect(hx+3, hy+4, 2, 1);
        // Shoulders + torso
        ctx.fillRect(hx, hy+5, 8, 2);
        ctx.fillRect(hx+1, hy+7, 6, 4);
        // Legs
        ctx.fillRect(hx+1, hy+11, 2, 4);
        ctx.fillRect(hx+5, hy+11, 2, 4);
        // Sword silhouette on back
        ctx.fillRect(hx+7, hy+2, 1, 8);
        ctx.fillRect(hx+6, hy+2, 3, 1);
        // Blue armor hint
        ctx.fillStyle = 'rgba(60,80,160,0.3)';
        ctx.fillRect(hx+2, hy+6, 4, 3);

        // Center hero (cloaked - Luigi) at x=118
        hx = 118;
        hy = 73;
        ctx.fillStyle = '#080818';
        // Head + hood
        ctx.fillRect(hx+1, hy, 6, 3);
        ctx.fillRect(hx+2, hy-1, 4, 1);
        ctx.fillRect(hx+2, hy+3, 4, 1);
        // Shoulders
        ctx.fillRect(hx, hy+4, 8, 2);
        // Robes
        ctx.fillRect(hx+1, hy+6, 6, 5);
        ctx.fillRect(hx, hy+11, 8, 3);
        ctx.fillRect(hx+1, hy+14, 6, 1);
        // Purple magic hint
        ctx.fillStyle = 'rgba(120,60,180,0.3)';
        ctx.fillRect(hx+2, hy+5, 4, 4);

        // Right hero (nature pose - Lirielle) at x=150
        hx = 150;
        hy = 75;
        ctx.fillStyle = '#080818';
        // Head + flowing hair
        ctx.fillRect(hx+2, hy, 4, 4);
        ctx.fillRect(hx+5, hy+1, 2, 5);
        // Neck
        ctx.fillRect(hx+3, hy+4, 2, 1);
        // Torso
        ctx.fillRect(hx+1, hy+5, 6, 2);
        ctx.fillRect(hx+1, hy+7, 5, 3);
        // Legs
        ctx.fillRect(hx+1, hy+10, 2, 4);
        ctx.fillRect(hx+4, hy+10, 2, 4);
        // Staff
        ctx.fillRect(hx-1, hy-2, 1, 16);
        ctx.fillRect(hx-2, hy-2, 3, 1);
        // Green nature hint
        ctx.fillStyle = 'rgba(60,160,80,0.3)';
        ctx.fillRect(hx+2, hy+6, 3, 3);
        // Staff glow
        ctx.fillStyle = 'rgba(80,200,100,' + (0.2 + Math.sin(t * 0.04) * 0.1) + ')';
        ctx.fillRect(hx-2, hy-3, 3, 2);

        ctx.globalAlpha = 1;
    }

    var epilogueRenderers = {
        nitriti: drawEpilogueNitriti,
        darkness: drawEpilogueDarkness,
        eldspyre: drawEpilogueEldspyre
    };

    // -----------------------------------------------------------------
    // Victory / ending_final scene renderers
    // -----------------------------------------------------------------

    function drawVictoryValePeace(ctx) {
        // Peaceful night sky over Ebon Vale - warm lights in windows
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, W, 50);
        ctx.fillStyle = '#0c0c22';
        ctx.fillRect(0, 50, W, 20);
        ctx.fillStyle = '#101830';
        ctx.fillRect(0, 70, W, 15);

        // Stars
        var peaceStars = [[15,8],[40,20],[70,5],[100,18],[135,10],[170,22],[200,6],[230,14],[55,30],[160,35],[245,25],[25,38],[110,32],[190,40]];
        for (var ps = 0; ps < peaceStars.length; ps++) {
            ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.sin(Game.frame * 0.03 + ps * 2) * 0.2) + ')';
            ctx.fillRect(peaceStars[ps][0], peaceStars[ps][1], 1, 1);
        }

        // Ground
        ctx.fillStyle = '#0c1a0c';
        ctx.fillRect(0, 85, W, 75);

        // Left building silhouette
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(20, 60, 40, 25);
        ctx.fillRect(15, 55, 50, 6);  // roof
        // Window glow
        ctx.fillStyle = 'rgba(255,180,80,0.5)';
        ctx.fillRect(28, 68, 4, 5);
        ctx.fillRect(44, 68, 4, 5);
        // Warm light spill
        ctx.fillStyle = 'rgba(255,180,80,0.1)';
        ctx.fillRect(26, 74, 8, 11);
        ctx.fillRect(42, 74, 8, 11);

        // Center building (tavern)
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(95, 55, 55, 30);
        ctx.fillRect(90, 50, 65, 6);
        // Windows
        ctx.fillStyle = 'rgba(255,200,100,0.6)';
        ctx.fillRect(103, 63, 5, 6);
        ctx.fillRect(118, 63, 5, 6);
        ctx.fillRect(133, 63, 5, 6);
        // Door glow
        ctx.fillStyle = 'rgba(255,200,100,0.3)';
        ctx.fillRect(118, 72, 8, 13);

        // Right building
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(185, 62, 45, 23);
        ctx.fillRect(180, 57, 55, 6);
        ctx.fillStyle = 'rgba(255,180,80,0.4)';
        ctx.fillRect(193, 70, 4, 5);
        ctx.fillRect(213, 70, 4, 5);
        ctx.fillStyle = 'rgba(255,180,80,0.1)';
        ctx.fillRect(191, 76, 8, 9);

        // Well silhouette in center
        ctx.fillStyle = '#080810';
        ctx.fillRect(122, 88, 10, 6);
        ctx.fillRect(120, 87, 14, 2);

        // Path
        ctx.fillStyle = '#141a14';
        ctx.fillRect(115, 85, 20, 75);

        // Tiny figure near the tavern (peaceful NPC)
        ctx.fillStyle = '#0e0e18';
        ctx.fillRect(140, 86, 3, 5);
    }

    function drawVictoryBonemoon(ctx) {
        // Ominous dark sky with the Bonemoon - a sickly pale moon
        ctx.fillStyle = '#020208';
        ctx.fillRect(0, 0, W, H);

        // Subtle dark purple clouds
        ctx.fillStyle = 'rgba(30,10,40,0.5)';
        ctx.fillRect(0, 30, 80, 8);
        ctx.fillRect(100, 20, 60, 6);
        ctx.fillRect(180, 35, 76, 7);
        ctx.fillRect(30, 50, 50, 5);
        ctx.fillRect(200, 55, 56, 5);

        // The Bonemoon - large, pale, sickly
        var moonX = 118, moonY = 40, moonR = 20;
        // Outer eerie glow
        var moonPulse = 0.7 + Math.sin(Game.frame * 0.02) * 0.15;
        ctx.fillStyle = 'rgba(180,160,200,' + (moonPulse * 0.08) + ')';
        ctx.fillRect(moonX - moonR - 12, moonY - moonR - 12, (moonR + 12) * 2, (moonR + 12) * 2);
        ctx.fillStyle = 'rgba(200,180,220,' + (moonPulse * 0.12) + ')';
        ctx.fillRect(moonX - moonR - 6, moonY - moonR - 6, (moonR + 6) * 2, (moonR + 6) * 2);

        // Moon body - pale bone color
        ctx.fillStyle = 'rgba(220,210,230,' + (moonPulse * 0.3) + ')';
        ctx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);
        ctx.fillStyle = 'rgba(200,190,210,' + (moonPulse * 0.5) + ')';
        ctx.fillRect(moonX - moonR + 4, moonY - moonR + 4, moonR * 2 - 8, moonR * 2 - 8);
        ctx.fillStyle = 'rgba(180,170,200,' + (moonPulse * 0.7) + ')';
        ctx.fillRect(moonX - moonR + 8, moonY - moonR + 8, moonR * 2 - 16, moonR * 2 - 16);

        // Craters / dark patches on the moon
        ctx.fillStyle = 'rgba(100,80,120,' + (moonPulse * 0.3) + ')';
        ctx.fillRect(moonX - 6, moonY - 8, 5, 4);
        ctx.fillRect(moonX + 4, moonY + 2, 6, 5);
        ctx.fillRect(moonX - 10, moonY + 4, 4, 3);

        // Few dim stars being swallowed by darkness
        var dimStars = [[30,15],[70,60],[200,20],[240,50],[160,70],[45,45],[230,30]];
        for (var ds = 0; ds < dimStars.length; ds++) {
            var fade = 0.15 + Math.sin(Game.frame * 0.02 + ds * 1.5) * 0.1;
            ctx.fillStyle = 'rgba(255,255,255,' + fade + ')';
            ctx.fillRect(dimStars[ds][0], dimStars[ds][1], 1, 1);
        }

        // Dark tendrils creeping from edges
        ctx.fillStyle = 'rgba(10,0,20,0.6)';
        ctx.fillRect(0, 80, W, 80);
        ctx.fillStyle = 'rgba(10,0,20,0.3)';
        ctx.fillRect(0, 70, 60, 10);
        ctx.fillRect(W - 60, 70, 60, 10);
    }

    function drawVictoryHeroesPath(ctx) {
        // Three heroes walking forward on a winding road into the unknown
        ctx.fillStyle = '#0a0a18';
        ctx.fillRect(0, 0, W, 50);
        ctx.fillStyle = '#0e0e20';
        ctx.fillRect(0, 50, W, 15);
        ctx.fillStyle = '#121228';
        ctx.fillRect(0, 65, W, 10);

        // Distant horizon glow
        ctx.fillStyle = 'rgba(60,40,80,0.3)';
        ctx.fillRect(0, 72, W, 8);

        // Stars
        var pathStars = [[20,6],[60,18],[100,8],[140,22],[180,10],[220,15],[40,30],[160,5],[250,28],[80,35],[200,38]];
        for (var i = 0; i < pathStars.length; i++) {
            ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.sin(Game.frame * 0.04 + i) * 0.2) + ')';
            ctx.fillRect(pathStars[i][0], pathStars[i][1], 1, 1);
        }

        // Ground
        ctx.fillStyle = '#0c120c';
        ctx.fillRect(0, 80, W, 80);

        // Winding road
        ctx.fillStyle = '#161a16';
        ctx.fillRect(110, 80, 30, 80);
        ctx.fillRect(105, 85, 40, 6);
        ctx.fillRect(100, 92, 50, 4);

        // Road narrows into distance
        ctx.fillStyle = '#141814';
        ctx.fillRect(118, 75, 14, 5);
        ctx.fillRect(122, 70, 6, 5);

        // Three heroes walking up the road (from behind)
        var baseX = 108, baseY = 86;

        // Left hero (warrior) - blue hint
        ctx.fillStyle = '#060610';
        ctx.fillRect(baseX + 4, baseY, 4, 4);     // head
        ctx.fillRect(baseX + 3, baseY + 4, 6, 6);  // body
        ctx.fillRect(baseX + 3, baseY + 10, 2, 4); // legs
        ctx.fillRect(baseX + 7, baseY + 10, 2, 4);
        ctx.fillRect(baseX + 8, baseY + 1, 1, 7);  // sword
        ctx.fillStyle = 'rgba(40,70,180,0.25)';
        ctx.fillRect(baseX + 4, baseY + 5, 4, 4);

        // Center hero (warlock) - purple hint
        ctx.fillStyle = '#060610';
        ctx.fillRect(baseX + 16, baseY - 1, 5, 4);  // hooded head
        ctx.fillRect(baseX + 15, baseY + 3, 7, 7);   // robes
        ctx.fillRect(baseX + 15, baseY + 10, 7, 4);  // robe hem
        ctx.fillStyle = 'rgba(100,50,160,0.25)';
        ctx.fillRect(baseX + 16, baseY + 4, 5, 5);

        // Right hero (druid) - green hint
        ctx.fillStyle = '#060610';
        ctx.fillRect(baseX + 28, baseY, 4, 4);      // head
        ctx.fillRect(baseX + 30, baseY + 1, 2, 4);   // hair
        ctx.fillRect(baseX + 27, baseY + 4, 6, 6);   // body
        ctx.fillRect(baseX + 27, baseY + 10, 2, 4);  // legs
        ctx.fillRect(baseX + 31, baseY + 10, 2, 4);
        ctx.fillRect(baseX + 26, baseY - 2, 1, 12);  // staff
        ctx.fillStyle = 'rgba(50,150,70,0.25)';
        ctx.fillRect(baseX + 28, baseY + 5, 4, 4);
    }

    function drawVictoryTitleCard(ctx) {
        // Dramatic title card with the game name
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, W, H);

        // Subtle radial glow behind title
        var pulse = 0.5 + Math.sin(Game.frame * 0.025) * 0.2;
        ctx.fillStyle = 'rgba(100,60,20,' + (pulse * 0.1) + ')';
        ctx.fillRect(40, 20, W - 80, 60);
        ctx.fillStyle = 'rgba(100,60,20,' + (pulse * 0.15) + ')';
        ctx.fillRect(60, 30, W - 120, 40);

        // "VALISAR" in large text
        var titleText = 'VALISAR';
        var titleX = Math.floor((W - titleText.length * 18) / 2);
        // Shadow
        Utils.drawText(ctx, titleText, titleX + 1, 31, '#2a1a0a', 3);
        // Gold text
        Utils.drawText(ctx, titleText, titleX, 30, C.gold, 3);

        // "SHADOWS OF THE ELDSPYRE" subtitle
        var subText = 'SHADOWS OF THE ELDSPYRE';
        var subX = Math.floor((W - subText.length * 6) / 2);
        Utils.drawText(ctx, subText, subX, 58, C.lightGray, 1);

        // Decorative line
        ctx.fillStyle = C.gold;
        ctx.fillRect(60, 72, W - 120, 1);

        // Small stars scattered
        var titleStars = [[20,15],[50,80],[80,10],[180,85],[210,12],[240,75],[30,50],[155,8],[250,45]];
        for (var ts = 0; ts < titleStars.length; ts++) {
            ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + Math.sin(Game.frame * 0.03 + ts * 1.3) * 0.15) + ')';
            ctx.fillRect(titleStars[ts][0], titleStars[ts][1], 1, 1);
        }
    }

    var victorySceneRenderers = {
        vale_peace: drawVictoryValePeace,
        bonemoon: drawVictoryBonemoon,
        heroes_path: drawVictoryHeroesPath,
        title_card: drawVictoryTitleCard
    };

    function renderEpilogue() {
        var ctx = buf;

        // Dark background
        ctx.fillStyle = '#050818';
        ctx.fillRect(0, 0, W, H);

        // Draw pixel art scene based on current dialogue's scene property
        var scene = Dialogue.getScene();
        if (scene && epilogueRenderers[scene]) {
            epilogueRenderers[scene](ctx);
            // Slight dim overlay for readability
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(0, 0, W, H);
        }

        // Spirit particles
        Particles.render(ctx);

        // Render dialogue
        Dialogue.render(ctx);
    }

    // =====================================================================
    // VICTORY SCREEN
    // =====================================================================

    function updateVictory() {
        if (!Game.victoryDialogueDone && !Dialogue.isActive()) {
            Dialogue.start('ending_final', function () {
                Game.victoryDialogueDone = true;
                Game.creditsY = H;
            });
        }

        if (Dialogue.isActive()) {
            Dialogue.update();
            if (Input.pressed['z']) {
                Dialogue.advance();
            }
            if (Input.pressed['x'] && Dialogue._canSkip) {
                Dialogue.skipAll();
            }
            return;
        }

        // Gold particles floating up
        if (Game.frame % 6 === 0) {
            Particles.add(Utils.randInt(20, W - 20), H + 5, {
                vx: (Math.random() - 0.5) * 0.3,
                vy: -(0.5 + Math.random() * 0.8),
                life: 80 + Utils.randInt(0, 40),
                color: Utils.choice([C.gold, C.yellow, C.lightBrown]),
                size: 1,
                gravity: -0.005
            });
        }

        Particles.update();

        // Scroll credits
        if (Game.victoryDialogueDone) {
            Game.creditsY -= 0.3;
        }

        // Press Enter to restart
        if (Game.victoryDialogueDone && Input.pressed['Enter']) {
            fullReset();
        }
    }

    function renderVictory() {
        var ctx = buf;

        // Black background
        ctx.fillStyle = C.black;
        ctx.fillRect(0, 0, W, H);

        // Draw scene art during dialogue phase
        if (!Game.victoryDialogueDone && Dialogue.isActive()) {
            var vScene = Dialogue.getScene();
            if (vScene && victorySceneRenderers[vScene]) {
                victorySceneRenderers[vScene](ctx);
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.fillRect(0, 0, W, H);
            }
        }

        // Particles behind text
        Particles.render(ctx);

        // Walking character animation at bottom
        if (Game.victoryDialogueDone && Game.player) {
            var walkX = (Game.frame * 0.5) % (W + 32) - 16;
            var walkFrame = Math.floor(Game.frame / 10) % 2;
            var charSprKey = Game.player.characterId + '_right_' + walkFrame;
            var charSpr = Sprites.get(charSprKey);
            if (charSpr) {
                ctx.drawImage(charSpr, Math.floor(walkX), H - 40);
            }
        }

        if (Game.victoryDialogueDone) {
            // "THE END" in large gold text with shadow
            var endText = 'THE END';
            var endX = centerTextX(endText, 3);
            Utils.drawText(ctx, endText, endX + 1, 31, C.darkBrown, 3);
            Utils.drawText(ctx, endText, endX, 30, C.gold, 3);

            // "...for now"
            var forNow = '...for now';
            var fnX = centerTextX(forNow, 1);
            Utils.drawText(ctx, forNow, fnX, 58, C.lightGray, 1);

            // Play stats
            var totalSeconds = Math.floor((Game.playTime || 0) / 60);
            var minutes = Math.floor(totalSeconds / 60);
            var seconds = totalSeconds % 60;

            // Credits scrolling (with stats)
            var creditsLines = [
                'VALISAR: SHADOWS OF THE ELDSPYRE',
                '',
                'Based on the Valisar Campaign',
                '',
                'Hero: ' + (Game.charNames[Game.selectedChar] || ''),
                'Class: ' + (Game.charClasses[Game.selectedChar] || ''),
                '',
                'Enemies Defeated: ' + (Game.enemiesDefeated || 0),
                'Goblin Teeth Earned: ' + (Game.goblinTeeth || 0),
                'Rooms Explored: ' + Object.keys(Game.visitedRooms || {}).length + '/8',
                'Time: ' + minutes + ':' + (seconds < 10 ? '0' : '') + seconds,
                Game.speedRunEnabled ? ('Speed Run: ' + Math.floor(Game.speedRunTime / 3600) + ':' + (Math.floor((Game.speedRunTime % 3600) / 60) < 10 ? '0' : '') + Math.floor((Game.speedRunTime % 3600) / 60)) : '',
                'Difficulty: ' + ['Easy', 'Normal', 'Hard'][Game.difficulty],
                '',
                'Heroes of Ebon Vale:',
                'Daxon Lamn - Eldritch Knight',
                'Luigi Bonemoon - Warlock',
                'Lirielle - Circle of Stars Druid',
                '',
                'Villain: Queen Bargnot',
                '',
                'World created for the',
                'Valisar D&D Campaign',
                '',
                'Thank you for playing!',
                '',
                'Press ENTER to play again'
            ];

            var lineHeight = 12;
            for (var i = 0; i < creditsLines.length; i++) {
                var line = creditsLines[i];
                if (!line) continue;
                var ly = Math.floor(Game.creditsY + i * lineHeight);
                if (ly < 70 || ly > H + 10) continue;

                var lx = centerTextX(line, 1);
                var color = C.white;
                if (i === 0) color = C.gold;
                if (line.indexOf('Press') === 0) {
                    // Blink the restart prompt
                    if (Math.floor(Game.frame / 30) % 2 === 0) {
                        Utils.drawText(ctx, line, lx, ly, C.yellow, 1);
                    }
                } else {
                    Utils.drawText(ctx, line, lx, ly, color, 1);
                }
            }
        }

        // Dialogue box on top
        Dialogue.render(ctx);
    }

    // =====================================================================
    // SAVE SYSTEM (localStorage)
    // =====================================================================

    var SAVE_KEY = 'valisar_save';

    function saveGame() {
        if (!Game.player || !Game.currentRoom) return;
        try {
            var data = {
                characterId: Game.player.characterId,
                selectedChar: Game.selectedChar,
                hp: Game.player.hp,
                maxHp: Game.player.maxHp,
                roomId: Game.currentRoom.id,
                playerX: Game.player.x,
                playerY: Game.player.y,
                flags: Game.flags,
                clearedRooms: Game.clearedRooms,
                collectedItems: Game.collectedItems,
                visitedRooms: Game.visitedRooms,
                enemiesDefeated: Game.enemiesDefeated,
                playTime: Game.playTime,
                lastSafeRoom: Game.lastSafeRoom,
                lastSafeX: Game.lastSafeX,
                lastSafeY: Game.lastSafeY,
                encounteredEnemies: Game.encounteredEnemies,
                metNPCs: Game.metNPCs,
                loreEntries: Game.loreEntries,
                deathCounts: Game.deathCounts,
                playerHasDied: Game.playerHasDied,
                difficulty: Game.difficulty,
                npcTalkedFirst: Game.npcTalkedFirst
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        } catch (e) {
            // Silently fail if localStorage unavailable
        }
    }

    function loadGame() {
        try {
            var raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return false;
            var data = JSON.parse(raw);
            if (!data || !data.characterId || !data.roomId) return false;

            // Restore character selection
            Game.selectedChar = data.selectedChar || 0;

            // Create player
            Game.player = new Entities.Player(
                data.characterId,
                data.playerX || 7 * TILE,
                data.playerY || 7 * TILE
            );
            Game.player.hp = data.hp;
            Game.player.maxHp = data.maxHp;

            // Restore flags
            Game.flags = data.flags || Game.flags;
            Game.clearedRooms = data.clearedRooms || {};
            Game.collectedItems = data.collectedItems || {};
            Game.visitedRooms = data.visitedRooms || {};
            Game.enemiesDefeated = data.enemiesDefeated || 0;
            Game.playTime = data.playTime || 0;
            Game.lastSafeRoom = data.lastSafeRoom || 'ebon_vale_square';
            Game.lastSafeX = data.lastSafeX || 7;
            Game.lastSafeY = data.lastSafeY || 7;
            Game.encounteredEnemies = data.encounteredEnemies || {};
            Game.metNPCs = data.metNPCs || {};
            Game.loreEntries = data.loreEntries || {};
            Game.deathCounts = data.deathCounts || {};
            Game.playerHasDied = data.playerHasDied || false;
            Game.difficulty = data.difficulty != null ? data.difficulty : 1;
            Game.npcTalkedFirst = data.npcTalkedFirst || null;

            // Load the room
            loadRoom(data.roomId);
            Game.state = 'game';

            return true;
        } catch (e) {
            return false;
        }
    }

    function hasSaveData() {
        try {
            var raw = localStorage.getItem(SAVE_KEY);
            return !!raw;
        } catch (e) {
            return false;
        }
    }

    function deleteSave() {
        try {
            localStorage.removeItem(SAVE_KEY);
        } catch (e) {}
    }

    // =====================================================================
    // PAUSE MENU
    // =====================================================================

    // --- Pass 6E: Pause menu overhaul with bestiary ---

    var PAUSE_MENU_ITEMS = ['Resume', 'Controls', 'Bestiary', 'Save & Quit'];

    // Bestiary data definitions
    var BESTIARY_ENEMIES = [
        { id: 'goblin', name: 'Goblin Lackey', desc: 'Desperate foot soldiers of Bargnot\'s horde.' },
        { id: 'goblin_archer', name: 'Goblin Archer', desc: 'Cowardly snipers who flee when cornered.' },
        { id: 'spinecleaver', name: 'Spinecleaver', desc: 'Armored brutes with unbreakable shields.' },
        { id: 'boss', name: 'Queen Bargnot', desc: 'A desperate queen who bargained with shadow.' }
    ];

    var BESTIARY_CHARACTERS = [
        { id: 'fawks', name: 'Fawks', desc: 'Tavern owner. Warm, gossipy, nervous.' },
        { id: 'helena', name: 'Helena', desc: 'Mayor. Dignified and exhausted.' },
        { id: 'elira', name: 'Elira Voss', desc: 'Guard Captain. Blunt, military, worried.' },
        { id: 'braxon', name: 'Braxon', desc: 'Blacksmith. Gruff but fatherly.' },
        { id: 'soren', name: 'Brother Soren', desc: 'Tabaxi monk. Serene with dry wit.' },
        { id: 'svana', name: 'Svana Ironveil', desc: 'Dwarf refugee. Fierce, heartbroken.' },
        { id: 'querubra', name: 'Que\'Rubra', desc: 'Ancient forest spirit. Cryptic and vast.' }
    ];

    var BESTIARY_LORE = [
        { id: 'lore_nitriti', name: 'Temple of Nitriti', desc: 'They Who Guard the veil between worlds.' },
        { id: 'lore_smaldge', name: 'Smaldge', desc: 'A spirit of hunger and shadow, bound by ancient pacts.' },
        { id: 'lore_bonemoon', name: 'The Bonemoon', desc: 'An omen of darkness gathering beyond the veil.' },
        { id: 'lore_eldspyre', name: 'The Eldspyre', desc: 'Source of all magic. A mountain that burns with starlight.' },
        { id: 'lore_ebonvale', name: 'Ebon Vale', desc: 'Too small for kings to notice. Too stubborn to die.' }
    ];

    function drawPixelFrame(ctx, x, y, w, h, accentColor) {
        // Consistent pixel art border matching dialogue box style (Pass 6C)
        var borderColor = '#6a6a7a';
        var innerColor = '#4a4a5a';
        var cornerColor = accentColor || C.gold;

        // Background
        ctx.fillStyle = 'rgba(10, 10, 25, 0.92)';
        ctx.fillRect(x, y, w, h);

        // Noise texture
        ctx.fillStyle = 'rgba(30, 30, 50, 0.4)';
        for (var ny = y; ny < y + h; ny += 2) {
            for (var nx = x; nx < x + w; nx += 2) {
                if (((nx * 7 + ny * 13) % 8) === 0) {
                    ctx.fillRect(nx, ny, 1, 1);
                }
            }
        }

        // Outer border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

        // Inner border
        ctx.strokeStyle = innerColor;
        ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);

        // Corner ornaments
        ctx.fillStyle = cornerColor;
        ctx.fillRect(x, y, 3, 1); ctx.fillRect(x, y, 1, 3);
        ctx.fillRect(x + w - 3, y, 3, 1); ctx.fillRect(x + w - 1, y, 1, 3);
        ctx.fillRect(x, y + h - 1, 3, 1); ctx.fillRect(x, y + h - 3, 1, 3);
        ctx.fillRect(x + w - 3, y + h - 1, 3, 1); ctx.fillRect(x + w - 1, y + h - 3, 1, 3);
    }

    function updatePaused() {
        if (Game.pauseSubMenu === null) {
            // Main pause menu navigation
            if (Input.pressed['ArrowUp']) {
                Game.pauseMenuIndex = (Game.pauseMenuIndex - 1 + PAUSE_MENU_ITEMS.length) % PAUSE_MENU_ITEMS.length;
                Audio.play('select');
            }
            if (Input.pressed['ArrowDown']) {
                Game.pauseMenuIndex = (Game.pauseMenuIndex + 1) % PAUSE_MENU_ITEMS.length;
                Audio.play('select');
            }
            if (Input.pressed['z'] || Input.pressed['Enter']) {
                Audio.play('select');
                if (Game.pauseMenuIndex === 0) {
                    // Resume
                    Game.state = Game.pausedFromState || 'game';
                    Game.pausedFromState = null;
                } else if (Game.pauseMenuIndex === 1) {
                    Game.pauseSubMenu = 'controls';
                } else if (Game.pauseMenuIndex === 2) {
                    Game.pauseSubMenu = 'bestiary';
                    Game.bestiaryTab = 0;
                    Game.bestiaryScroll = 0;
                } else if (Game.pauseMenuIndex === 3) {
                    // Save & Quit
                    saveGame();
                    fullReset();
                }
            }
            if (Input.pressed['p'] || Input.pressed['Escape']) {
                Game.state = Game.pausedFromState || 'game';
                Game.pausedFromState = null;
                Audio.play('select');
            }
        } else if (Game.pauseSubMenu === 'controls') {
            if (Input.pressed['x'] || Input.pressed['Escape'] || Input.pressed['z']) {
                Game.pauseSubMenu = null;
                Audio.play('select');
            }
        } else if (Game.pauseSubMenu === 'bestiary') {
            if (Input.pressed['x'] || Input.pressed['Escape']) {
                Game.pauseSubMenu = null;
                Audio.play('select');
            }
            if (Input.pressed['ArrowLeft']) {
                Game.bestiaryTab = (Game.bestiaryTab - 1 + 3) % 3;
                Game.bestiaryScroll = 0;
                Audio.play('select');
            }
            if (Input.pressed['ArrowRight']) {
                Game.bestiaryTab = (Game.bestiaryTab + 1) % 3;
                Game.bestiaryScroll = 0;
                Audio.play('select');
            }
            if (Input.pressed['ArrowDown']) {
                Game.bestiaryScroll++;
                Audio.play('select');
            }
            if (Input.pressed['ArrowUp'] && Game.bestiaryScroll > 0) {
                Game.bestiaryScroll--;
                Audio.play('select');
            }
        }
    }

    function renderPaused() {
        var ctx = buf;

        // Render game scene underneath (frozen + desaturated)
        if (Game.pausedFromState === 'boss') {
            renderBoss();
        } else {
            renderGame();
        }

        // Dark tint overlay (desaturated feel)
        ctx.fillStyle = 'rgba(0,0,15,0.75)';
        ctx.fillRect(0, 0, W, H);

        if (Game.pauseSubMenu === 'controls') {
            renderControlsScreen(ctx);
            return;
        }
        if (Game.pauseSubMenu === 'bestiary') {
            renderBestiary(ctx);
            return;
        }

        // Main pause menu
        var frameX = W / 2 - 70;
        var frameY = 20;
        var frameW = 140;
        var frameH = 180;
        drawPixelFrame(ctx, frameX, frameY, frameW, frameH, C.gold);

        // "PAUSED" title
        var pauseText = 'PAUSED';
        Utils.drawText(ctx, pauseText, centerTextX(pauseText, 2), frameY + 8, C.gold, 2);

        // Character info
        if (Game.player) {
            var charName = Game.charNames[Game.selectedChar] || '';
            Utils.drawText(ctx, charName, centerTextX(charName, 1), frameY + 30, C.white, 1);
            var hpText = 'HP: ' + Game.player.hp + '/' + Game.player.maxHp;
            Utils.drawText(ctx, hpText, centerTextX(hpText, 1), frameY + 42, C.red, 1);
        }

        // Collected relics
        var relicY = frameY + 56;
        var relicX = W / 2 - 20;
        if (Game.flags.puzzleCrown) safeDraw(ctx, 'item_crown', relicX - 8, relicY);
        else { ctx.fillStyle = 'rgba(60,60,80,0.5)'; ctx.fillRect(relicX - 8, relicY, 12, 12); }
        if (Game.flags.puzzleCape) safeDraw(ctx, 'item_cape', relicX + 8, relicY);
        else { ctx.fillStyle = 'rgba(60,60,80,0.5)'; ctx.fillRect(relicX + 8, relicY, 12, 12); }
        if (Game.flags.puzzleScepter) safeDraw(ctx, 'item_scepter', relicX + 24, relicY);
        else { ctx.fillStyle = 'rgba(60,60,80,0.5)'; ctx.fillRect(relicX + 24, relicY, 12, 12); }

        // Menu items with icons
        var pauseIconKeys = ['icon_resume', 'icon_controls', 'icon_bestiary', 'icon_quit'];
        var menuStartY = frameY + 78;
        for (var i = 0; i < PAUSE_MENU_ITEMS.length; i++) {
            var label = PAUSE_MENU_ITEMS[i];
            var itemY = menuStartY + i * 18;
            var isSelected = (i === Game.pauseMenuIndex);

            if (isSelected) {
                // Highlight bar
                ctx.fillStyle = 'rgba(60, 60, 100, 0.6)';
                ctx.fillRect(frameX + 6, itemY - 1, frameW - 12, 13);

                // Animated arrow
                var arrowBounce = Math.floor(Math.sin(Game.frame * 0.15) * 2);
                Utils.drawText(ctx, '>', frameX + 10 + arrowBounce, itemY, C.gold, 1);
            }

            // Draw 8x8 icon before label text
            safeDraw(ctx, pauseIconKeys[i], frameX + 12, itemY - 1);

            var labelColor = isSelected ? C.white : C.lightGray;
            Utils.drawText(ctx, label, frameX + 32, itemY, labelColor, 1);
        }

        // Play time
        var totalSeconds = Math.floor((Game.playTime || 0) / 60);
        var mins = Math.floor(totalSeconds / 60);
        var secs = totalSeconds % 60;
        var timeText = mins + ':' + (secs < 10 ? '0' : '') + secs;
        Utils.drawText(ctx, timeText, centerTextX(timeText, 1), frameY + frameH - 20, C.lightGray, 1);

        // Room name
        if (Game.currentRoom) {
            var rn = Game.currentRoom.name || '';
            Utils.drawText(ctx, rn, centerTextX(rn, 1), frameY + frameH - 10, C.paleBlue, 1);
        }
    }

    function renderControlsScreen(ctx) {
        var fx = 16, fy = 16, fw = W - 32, fh = H - 32;
        drawPixelFrame(ctx, fx, fy, fw, fh, C.paleBlue);

        Utils.drawText(ctx, 'CONTROLS', centerTextX('CONTROLS', 2), fy + 10, C.paleBlue, 2);

        var controls = [
            ['Arrow Keys', 'Move'],
            ['Z', 'Attack / Interact'],
            ['X', 'Special Ability / Back'],
            ['P / ESC', 'Pause / Menu'],
            ['Enter', 'Confirm']
        ];

        var cy = fy + 38;
        for (var i = 0; i < controls.length; i++) {
            Utils.drawText(ctx, controls[i][0], fx + 16, cy + i * 16, C.gold, 1);
            Utils.drawText(ctx, controls[i][1], fx + 96, cy + i * 16, C.lightGray, 1);
        }

        var specY = cy + controls.length * 16 + 12;
        if (Game.player) {
            var specNames = { daxon: 'Shield Barrier', luigi: 'Summon Brog', lirielle: 'Nature\'s Embrace' };
            var specDesc = { daxon: 'Block incoming attacks', luigi: 'Send familiar to attack', lirielle: 'Heal over time' };
            var cid = Game.player.characterId;
            Utils.drawText(ctx, 'Special: ' + (specNames[cid] || ''), fx + 16, specY, C.lightPurple, 1);
            Utils.drawText(ctx, specDesc[cid] || '', fx + 16, specY + 12, C.lightGray, 1);
        }

        if (Math.floor(Game.frame / 30) % 2 === 0) {
            Utils.drawText(ctx, 'Press Z or X to return', centerTextX('Press Z or X to return', 1), fy + fh - 14, C.yellow, 1);
        }
    }

    function renderBestiary(ctx) {
        var fx = 8, fy = 8, fw = W - 16, fh = H - 16;
        drawPixelFrame(ctx, fx, fy, fw, fh, C.lightPurple);

        Utils.drawText(ctx, 'BESTIARY', centerTextX('BESTIARY', 2), fy + 8, C.gold, 2);

        // Tabs
        var tabNames = ['Enemies', 'NPCs', 'Lore'];
        var tabW = 56;
        var tabStartX = fx + (fw - tabW * 3) / 2;
        for (var t = 0; t < 3; t++) {
            var tx = tabStartX + t * tabW;
            var isActiveTab = (t === Game.bestiaryTab);
            if (isActiveTab) {
                ctx.fillStyle = 'rgba(60, 50, 100, 0.7)';
                ctx.fillRect(tx, fy + 26, tabW - 4, 12);
            }
            Utils.drawText(ctx, tabNames[t], tx + 4, fy + 28, isActiveTab ? C.white : C.gray, 1);
        }

        // Separator line
        ctx.fillStyle = C.gray;
        ctx.fillRect(fx + 6, fy + 40, fw - 12, 1);

        // Content area
        var contentY = fy + 46;
        var contentH = fh - 56;
        var lineH = 20;
        var maxVisible = Math.floor(contentH / lineH);
        var entries, discovered;

        if (Game.bestiaryTab === 0) {
            entries = BESTIARY_ENEMIES;
            discovered = Game.encounteredEnemies;
        } else if (Game.bestiaryTab === 1) {
            entries = BESTIARY_CHARACTERS;
            discovered = Game.metNPCs;
        } else {
            entries = BESTIARY_LORE;
            discovered = Game.loreEntries;
        }

        // Clamp scroll
        var maxScroll = Math.max(0, entries.length - maxVisible);
        if (Game.bestiaryScroll > maxScroll) Game.bestiaryScroll = maxScroll;

        for (var i = 0; i < maxVisible && (i + Game.bestiaryScroll) < entries.length; i++) {
            var entry = entries[i + Game.bestiaryScroll];
            var ey = contentY + i * lineH;
            var known = discovered[entry.id];

            if (known) {
                Utils.drawText(ctx, entry.name, fx + 12, ey, C.white, 1);
                Utils.drawText(ctx, entry.desc, fx + 12, ey + 9, C.lightGray, 1);
            } else {
                Utils.drawText(ctx, '???', fx + 12, ey, C.darkGray, 1);
                Utils.drawText(ctx, 'Not yet discovered.', fx + 12, ey + 9, C.darkGray, 1);
            }
        }

        // Scroll indicators
        if (Game.bestiaryScroll > 0) {
            Utils.drawText(ctx, '^', fx + fw - 16, contentY, C.gold, 1);
        }
        if (Game.bestiaryScroll < maxScroll) {
            Utils.drawText(ctx, 'v', fx + fw - 16, contentY + contentH - 10, C.gold, 1);
        }

        // Navigation hint
        if (Math.floor(Game.frame / 30) % 2 === 0) {
            Utils.drawText(ctx, '</>: Tabs  X: Back', centerTextX('</>: Tabs  X: Back', 1), fy + fh - 12, C.yellow, 1);
        }
    }

    // =====================================================================
    // FULL GAME RESET
    // =====================================================================

    // =====================================================================
    // PASS 8B: MICRO-ANIMATIONS (grass bends, water ripples)
    // =====================================================================

    function updateMicroAnimations() {
        if (!Game.player || !Game.currentRoom) return;

        var px = Game.player.x;
        var py = Game.player.y;
        var room = Game.currentRoom;

        // Grass bending: when player walks on grass tiles
        if (Game.player._moving && room.tiles) {
            var tileX = Math.floor((px + 8) / TILE);
            var tileY = Math.floor((py + 12) / TILE);
            if (tileX >= 0 && tileX < COLS && tileY >= 0 && tileY < ROWS) {
                var tileId = room.tiles[tileY] ? room.tiles[tileY][tileX] : 0;
                // Grass tiles are typically 1 or type 'grass'
                if (tileId === 1 || tileId === 2) {
                    // Check if there's already a bend here
                    var hasBend = false;
                    for (var b = 0; b < Game.grassBends.length; b++) {
                        if (Game.grassBends[b].x === tileX && Game.grassBends[b].y === tileY) {
                            hasBend = true;
                            break;
                        }
                    }
                    if (!hasBend) {
                        var dir = Game.player.facing === 'left' ? -1 : 1;
                        Game.grassBends.push({ x: tileX, y: tileY, dir: dir, timer: 12 });
                    }
                }

                // Water ripples near water tiles
                if (tileId === 5 || tileId === 6) { // water-like tiles
                    if (Game.frame % 16 === 0) {
                        Game.waterRipples.push({
                            x: (tileX * TILE) + 8,
                            y: (tileY * TILE) + 8,
                            radius: 1,
                            maxRadius: 8,
                            life: 20
                        });
                    }
                }
            }
        }

        // Update grass bends (spring back)
        for (var g = Game.grassBends.length - 1; g >= 0; g--) {
            Game.grassBends[g].timer--;
            if (Game.grassBends[g].timer <= 0) {
                Game.grassBends.splice(g, 1);
            }
        }
        // Cap grass bends
        if (Game.grassBends.length > 20) {
            Game.grassBends = Game.grassBends.slice(-20);
        }

        // Update water ripples
        for (var w = Game.waterRipples.length - 1; w >= 0; w--) {
            var rip = Game.waterRipples[w];
            rip.life--;
            rip.radius = rip.maxRadius * (1 - rip.life / 20);
            if (rip.life <= 0) {
                Game.waterRipples.splice(w, 1);
            }
        }
        if (Game.waterRipples.length > 10) {
            Game.waterRipples = Game.waterRipples.slice(-10);
        }
    }

    function renderMicroAnimations(ctx) {
        // Render grass bends
        for (var g = 0; g < Game.grassBends.length; g++) {
            var gb = Game.grassBends[g];
            var gx = gb.x * TILE;
            var gy = gb.y * TILE;
            var bendOffset = Math.floor(gb.dir * (gb.timer / 12) * 2);
            ctx.fillStyle = C.darkGreen;
            ctx.globalAlpha = gb.timer / 12;
            // Small grass tuft bending
            ctx.fillRect(gx + 6 + bendOffset, gy + 10, 2, 3);
            ctx.fillRect(gx + 10 + bendOffset, gy + 9, 2, 4);
            ctx.globalAlpha = 1;
        }

        // Render water ripples
        for (var w = 0; w < Game.waterRipples.length; w++) {
            var rip = Game.waterRipples[w];
            ctx.strokeStyle = C.white;
            ctx.globalAlpha = rip.life / 20 * 0.4;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(Math.floor(rip.x), Math.floor(rip.y), Math.floor(rip.radius), 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    // =====================================================================
    // PASS 8D: CAMERA ZOOM SYSTEM
    // =====================================================================


    // =====================================================================
    // PASS 7E: DIFFICULTY SELECTION
    // =====================================================================

    // Difficulty is already tracked in Game.difficulty (0=Easy, 1=Normal, 2=Hard)
    // and the select screen already has a difficulty menu.
    // Adaptive difficulty is handled in loadRoom enemy scaling.
    // Add explicit selection in the select screen.

    function getDifficultyName() {
        var names = ['Adventurer', 'Hero', 'Legend'];
        return names[Game.difficulty] || 'Hero';
    }

    function getDifficultyColor() {
        var colors = [C.lightGreen, C.gold, C.red];
        return colors[Game.difficulty] || C.gold;
    }

    function fullReset() {
        // Clear save data on full reset (after victory or explicit restart)
        deleteSave();

        Game.state = 'title';
        Game.selectedChar = 0;
        Game.player = null;
        Game.enemies = [];
        Game.npcs = [];
        Game.heartDrops = [];
        Game.boss = null;
        Game.currentRoom = null;
        Game.flags = {
            puzzleCrown: false,
            puzzleCape: false,
            puzzleScepter: false,
            puzzleSolved: false,
            bossDefeated: false
        };
        Game.clearedRooms = {};
        Game.collectedItems = {};
        Game.visitedRooms = {};
        Game.transition = { active: false, timer: 0, maxTime: 30, type: 'fade', targetRoom: null, spawnX: 0, spawnY: 0 };
        Game.cutsceneTimer = 0;
        Game.shake = 0;
        Game.frame = 0;
        Game.gameOverTimer = 0;
        Game.nearNPC = null;
        Game.nearItem = null;
        Game.roomNameTimer = 0;
        Game.roomNameText = '';
        Game.bossDialogueStage = 0;
        Game.bossDeathTimer = 0;
        Game.brogTarget = null;
        Game.brogTimer = 0;
        Game.brogActive = false;
        Game.floatingTexts = [];
        Game.enemiesDefeated = 0;
        Game.titleSparkles = [];
        Game.creditsY = 0;
        Game.victoryDialogueDone = false;
        Game.lastSafeRoom = 'ebon_vale_square';
        Game.lastSafeX = 7;
        Game.lastSafeY = 7;
        Game.pausedFromState = null;
        Game.playTime = 0;
        Game.titleMenuIndex = 0;
        Game.hasSaveData = false;
        Game.epilogueTimer = 0;
        Game.boulders = [];
        Game.bouldersClearing = false;
        Game._heartShakeTimers = [];
        Game._prevHeartHP = -1;
        Game._puzzleSparkles = { crown: 0, cape: 0, scepter: 0 };
        Game._prevPuzzleFlags = { puzzleCrown: false, puzzleCape: false, puzzleScepter: false };

        // Pass 6E + 6F + 7E + 8A resets
        Game.pauseMenuIndex = 0;
        Game.pauseSubMenu = null;
        Game.bestiaryTab = 0;
        Game.bestiaryScroll = 0;
        Game.encounteredEnemies = {};
        Game.metNPCs = {};
        Game.loreEntries = {};
        Game.gameOverMenuIndex = 0;
        Game.deathCounts = {};
        Game.playerHasDied = false;
        Game.grassBends = [];
        Game.waterRipples = [];
        Game.npcTalkedFirst = null;

        // Pass 6A resets
        Game.titleLandscapeOffset = 0;
        Game.titleEmbers = [];
        Game.titleMenuAlpha = 0;
        Game.titleMenuFadeStart = false;

        // Pass 6B resets
        Game.selectSlideOffset = 0;
        Game.selectSlideDir = 0;
        Game.selectSlideFrom = 0;
        Game.selectSlideTo = 0;
        Game.selectSlideTimer = 0;
        Game.selectConfirmTimer = 0;
        Game.selectConfirmChar = -1;

        // Pass 7A/8B resets
        Game.destructibles = [];
        Game.spikeTimer = 0;
        Game.torchReacts = [];
        Game.doorAnimTimer = 0;

        // New feature resets
        Game._healAnimTimers = [];
        Game.crumblingTiles = [];
        Game._poisonMushroomCD = 0;
        Game.slowMotion = 0;
        Game.cameraHold = 0;

        Particles.particles = [];

        if (Dialogue.active) {
            Dialogue.close();
        }

        if (Music) Music.play('title');
    }

    // =====================================================================
    // MAIN GAME LOOP
    // =====================================================================

    function gameLoop() {
        Game.frame++;

        // Update based on current state
        switch (Game.state) {
            case 'title':      updateTitle();     break;
            case 'select':     updateSelect();    break;
            case 'intro':      updateIntro();     break;
            case 'game':       updateGame();      break;
            case 'boss_intro': updateBossIntro(); break;
            case 'boss':       updateBoss();      break;
            case 'epilogue':   updateEpilogue();  break;
            case 'victory':    updateVictory();   break;
            case 'gameover':   updateGameOver();  break;
            case 'paused':     updatePaused();    break;
        }

        // Render based on current state
        switch (Game.state) {
            case 'title':      renderTitle();     break;
            case 'select':     renderSelect();    break;
            case 'intro':      renderIntro();     break;
            case 'game':       renderGame();      break;
            case 'boss_intro': renderBossIntro(); break;
            case 'boss':       renderBoss();      break;
            case 'epilogue':   renderEpilogue();  break;
            case 'victory':    renderVictory();   break;
            case 'gameover':   renderGameOver();  break;
            case 'paused':     renderPaused();    break;
        }

        // Blit offscreen buffer to display canvas (with screenshake + camera zoom)
        display.imageSmoothingEnabled = false;
        var sx = 0, sy = 0;
        if (Game.shake > 0) {
            var intensity = Game.shakeIntensity || 2;
            sx = Utils.randInt(-intensity, intensity);
            sy = Utils.randInt(-intensity, intensity);
            Game.shake--;
            if (Game.shake <= 0) {
                Game.shakeIntensity = 0;
            }
        }
        display.clearRect(0, 0, display.canvas.width, display.canvas.height);

        display.drawImage(buf.canvas, sx * 3, sy * 3, display.canvas.width, display.canvas.height);

        // Clear pressed keys for next frame
        Input.update();

        requestAnimationFrame(gameLoop);
    }

    // =====================================================================
    // INITIALIZATION
    // =====================================================================

    function init() {
        // Initialize sprites
        if (Sprites && Sprites.init) {
            Sprites.init();
        }

        // Audio init on first user interaction
        var audioStarted = false;
        document.addEventListener('keydown', function () {
            if (!audioStarted) {
                if (Audio && Audio.init) {
                    Audio.init();
                }
                if (Music && Music.init) {
                    Music.init();
                    Music.play('title');
                }
                audioStarted = true;
            }
        });

        // Start game loop
        gameLoop();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
