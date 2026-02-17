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

        // Enemy kill counter (for HUD)
        enemiesDefeated: 0,

        // Luigi Brog special tracking
        brogTarget: null,
        brogTimer: 0,
        brogActive: false,

        // Title screen sparkle particles (manual, separate from Particles system)
        titleSparkles: [],

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

        // Sign interaction
        nearSign: null,

        // Area name banner slide animation
        roomBannerSlide: 0,

        // Title screen enhancements
        titleStars: [],
        subtitleReveal: 0,

        // Difficulty menu
        difficultyMenuIndex: 1
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

    function spawnFloatingText(x, y, text, color) {
        Game.floatingTexts.push({
            x: x,
            y: y,
            text: String(text),
            color: color || C.white,
            life: 40,
            maxLife: 40
        });
    }

    function updateFloatingTexts() {
        for (var i = Game.floatingTexts.length - 1; i >= 0; i--) {
            var ft = Game.floatingTexts[i];
            ft.y -= 0.5;
            ft.life--;
            if (ft.life <= 0) {
                Game.floatingTexts.splice(i, 1);
            }
        }
    }

    function renderFloatingTexts(ctx) {
        for (var i = 0; i < Game.floatingTexts.length; i++) {
            var ft = Game.floatingTexts[i];
            var alpha = ft.life / ft.maxLife;
            ctx.globalAlpha = alpha;
            Utils.drawText(ctx, ft.text, Math.floor(ft.x), Math.floor(ft.y), ft.color, 1);
            ctx.globalAlpha = 1;
        }
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
    // MAP RENDERING
    // =====================================================================

    function renderMap(ctx, room) {
        if (!room || !room.tiles) return;
        var waterFrame = Math.floor(Game.frame / 30) % 2; // alternate every 30 frames
        var spikePhase = Math.floor(Game.frame / 40) % 2; // spikes toggle
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

                    // Spike trap retracted state: draw floor-only when spikes are down
                    if (tileId === window.T.SPIKE && spikePhase === 1) {
                        // Draw a semi-transparent overlay to show spikes are retracted
                        ctx.fillStyle = C.lightGray;
                        ctx.globalAlpha = 0.4;
                        ctx.fillRect(col * TILE + 2, row * TILE + 10, 12, 4);
                        ctx.globalAlpha = 1;
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
                } else {
                    // Normalize enemy type: maps use 'goblin_lackey', entity expects 'goblin'
                    if (etype === 'goblin_lackey') etype = 'goblin';
                    var enemy = new Entities.Enemy(etype, eData.x, eData.y);
                    // Apply difficulty scaling
                    if (Game.difficulty === 0) { // Easy
                        enemy.speed *= 0.7;
                        enemy.damage = Math.max(1, enemy.damage - 1);
                    } else if (Game.difficulty === 2) { // Hard
                        enemy.speed *= 1.2;
                        enemy.maxHp = Math.ceil(enemy.maxHp * 1.5);
                        enemy.hp = enemy.maxHp;
                    }
                    Game.enemies.push(enemy);
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
            if (Game.currentRoom.id === 'temple_puzzle' && !Game.flags.puzzleSolved) {
                // Push player back
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
                if (Input.pressed['z'] && !Dialogue.isActive()) {
                    // Special NPC interactions
                    if (npc.id === 'npc_braxon') {
                        if (npc.interacted && Game.goblinTeeth > 0) {
                            openShop();
                        } else {
                            var dialogueId = npc.dialogueId || npc.dialogue;
                            if (dialogueId) {
                                npc.interact();
                            }
                        }
                    } else if (npc.id === 'npc_brother_soren' && npc.interacted) {
                        // Brother Soren gives blessing on return visits
                        sorenBlessing();
                        Dialogue.start(null, null, 'May the light guide you, child. I have restored your strength.');
                    } else {
                        var dialogueId2 = npc.dialogueId || npc.dialogue;
                        if (dialogueId2) {
                            npc.interact();
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

                    Audio.play('pickup');
                }
            }
        }

        // Check central statue interaction
        if (Game.flags.puzzleCrown && Game.flags.puzzleCape && Game.flags.puzzleScepter && !Game.flags.puzzleSolved) {
            // Statue is at col 7-8, row 7
            var statueX = 7 * TILE + 8;
            var statueY = 7 * TILE + 8;
            var distToStatue = Utils.dist(
                { x: Game.player.x + 8, y: Game.player.y + 8 },
                { x: statueX, y: statueY }
            );

            if (distToStatue < 28 && Input.pressed['z']) {
                Game.flags.puzzleSolved = true;
                Audio.play('fanfare');
                Dialogue.start('statue_complete');
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
                // Top zone: rows 0-4
                if (eRow <= 4) zoneEnemies++;
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
        if (Game.spikeCooldown > 0) { Game.spikeCooldown--; return; }

        // Check if player is standing on a spike tile
        var cx = Math.floor((Game.player.x + Game.player.w / 2) / TILE);
        var cy = Math.floor((Game.player.y + Game.player.h / 2) / TILE);
        var tileId = Maps.getTile(Game.currentRoom, cx, cy);

        if (tileId === window.T.SPIKE) {
            // Spikes activate in a cycle: up for 40 frames, down for 40 frames
            var spikePhase = Math.floor(Game.frame / 40) % 2;
            if (spikePhase === 0) { // Spikes are up
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
    // AMBIENT SOUNDS
    // =====================================================================

    function updateAmbientSounds() {
        if (!Game.currentRoom) return;
        var roomId = Game.currentRoom.id;

        // Forest: occasional bird chirps
        if (roomId && roomId.indexOf('ebon_forest') === 0) {
            if (Game.frame % 180 === 0 && Math.random() < 0.5) {
                Audio.play('bird');
            }
            // Wind gusts
            if (Game.frame % 300 === 0 && Math.random() < 0.3) {
                Audio.play('wind');
            }
        }

        // Temple: water drips
        if (roomId && roomId.indexOf('temple') === 0) {
            if (Game.frame % 120 === 0 && Math.random() < 0.4) {
                Audio.play('drip');
            }
        }
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
                if (Game.player.hp < Game.player.maxHp) {
                    Game.player.hp = Math.min(Game.player.hp + 2, Game.player.maxHp);
                }
                Audio.play('pickup');
                Particles.sparkle(hd.x + 4, hd.y + 4, C.lightRed);
                Game.heartDrops.splice(i, 1);
            }
        }
    }

    function spawnHeartDrop(x, y) {
        Game.heartDrops.push({
            x: x,
            y: y,
            bobTimer: 0,
            life: 300
        });
    }

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
    // SPECIAL ROOM EVENTS
    // =====================================================================

    function checkSpecialRoomEvents() {
        if (!Game.currentRoom) return;

        // Temple boss room - spawn boss on first entry
        if (Game.currentRoom.id === 'temple_boss' && !Game.flags.bossDefeated && !Game.boss) {
            if (Game.state === 'game') {
                Game.state = 'boss_intro';
                Game.bossDialogueStage = 0;
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
            Audio.play('death');
        }
    }

    // =====================================================================
    // WEATHER / AMBIENT PARTICLES
    // =====================================================================

    function updateWeather() {
        if (!Game.currentRoom) return;
        var roomId = Game.currentRoom.id;

        // Forest: falling leaves
        if (roomId && roomId.indexOf('ebon_forest') === 0) {
            if (Game.frame % 20 === 0) {
                Particles.add(Utils.randInt(-10, W + 10), -5, {
                    vx: 0.3 + Math.random() * 0.4,
                    vy: 0.4 + Math.random() * 0.3,
                    life: 120 + Utils.randInt(0, 60),
                    color: Utils.choice([C.green, C.darkGreen, C.brown, C.lightBrown]),
                    size: 2,
                    gravity: 0.005
                });
            }
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
            var flickerR = 28 + Math.sin(flickerSeed + i * 2.5) * 4;
            var flickerA = 0.12 + Math.sin(flickerSeed * 1.3 + i) * 0.04;

            // Warm glow gradient
            var grad = ctx.createRadialGradient(tx, ty, 0, tx, ty, flickerR);
            grad.addColorStop(0, 'rgba(255,200,80,' + (flickerA + 0.06) + ')');
            grad.addColorStop(0.5, 'rgba(255,150,40,' + flickerA + ')');
            grad.addColorStop(1, 'rgba(255,100,20,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(tx - flickerR, ty - flickerR, flickerR * 2, flickerR * 2);
        }
    }

    function renderDarknessOverlay(ctx, room) {
        if (!room || !isTempleRoom(room.id)) return;

        var torches = getTorchPositions(room);
        var flickerSeed = Game.frame * 0.12;

        // Create a temporary canvas for the darkness mask
        var dCanvas = document.createElement('canvas');
        dCanvas.width = W;
        dCanvas.height = H;
        var dCtx = dCanvas.getContext('2d');

        // Fill with semi-darkness
        dCtx.fillStyle = 'rgba(0,0,10,0.55)';
        dCtx.fillRect(0, 0, W, H);

        // Cut out light circles using destination-out compositing
        dCtx.globalCompositeOperation = 'destination-out';

        // Light around each torch
        for (var i = 0; i < torches.length; i++) {
            var tx = torches[i].x;
            var ty = torches[i].y;
            var lr = 32 + Math.sin(flickerSeed + i * 2.5) * 5;

            var grad = dCtx.createRadialGradient(tx, ty, 0, tx, ty, lr);
            grad.addColorStop(0, 'rgba(0,0,0,1)');
            grad.addColorStop(0.6, 'rgba(0,0,0,0.6)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            dCtx.fillStyle = grad;
            dCtx.beginPath();
            dCtx.arc(tx, ty, lr, 0, Math.PI * 2);
            dCtx.fill();
        }

        // Light around the player
        if (Game.player) {
            var px = Game.player.x + Game.player.w / 2;
            var py = Game.player.y + Game.player.h / 2;
            var pr = 36;

            var pGrad = dCtx.createRadialGradient(px, py, 0, px, py, pr);
            pGrad.addColorStop(0, 'rgba(0,0,0,1)');
            pGrad.addColorStop(0.5, 'rgba(0,0,0,0.7)');
            pGrad.addColorStop(1, 'rgba(0,0,0,0)');
            dCtx.fillStyle = pGrad;
            dCtx.beginPath();
            dCtx.arc(px, py, pr, 0, Math.PI * 2);
            dCtx.fill();
        }

        // Light around boss projectiles
        if (Game.boss && Game.boss.projectiles) {
            for (var j = 0; j < Game.boss.projectiles.length; j++) {
                var p = Game.boss.projectiles[j];
                var ppGrad = dCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
                ppGrad.addColorStop(0, 'rgba(0,0,0,0.8)');
                ppGrad.addColorStop(1, 'rgba(0,0,0,0)');
                dCtx.fillStyle = ppGrad;
                dCtx.beginPath();
                dCtx.arc(p.x, p.y, 14, 0, Math.PI * 2);
                dCtx.fill();
            }
        }

        // Draw the darkness overlay onto the main buffer
        dCtx.globalCompositeOperation = 'source-over';
        ctx.drawImage(dCanvas, 0, 0);
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

        // Hearts - top left
        var maxHearts = Math.ceil(Game.player.maxHp / 2);
        var currentHP = Game.player.hp;

        for (var i = 0; i < maxHearts; i++) {
            var hx = 4 + i * 12;
            var hy = 4;
            var hpForThisHeart = currentHP - i * 2;

            if (hpForThisHeart >= 2) {
                safeDraw(ctx, 'item_heart', hx, hy);
            } else if (hpForThisHeart === 1) {
                safeDraw(ctx, 'item_heart_half', hx, hy);
            } else {
                safeDraw(ctx, 'item_heart_empty', hx, hy);
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

        // Puzzle items collected - top right (above minimap)
        var ix = W - 16;
        if (Game.flags.puzzleCrown) {
            safeDraw(ctx, 'item_crown', ix, 4);
            ix -= 14;
        }
        if (Game.flags.puzzleCape) {
            safeDraw(ctx, 'item_cape', ix, 4);
            ix -= 14;
        }
        if (Game.flags.puzzleScepter) {
            safeDraw(ctx, 'item_scepter', ix, 4);
            ix -= 14;
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

        // Draw banner background with gold border
        var textLen = Game.roomNameText.length * 6;
        var bannerW = textLen + 20;
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

        var tx = Math.floor(bannerX + 10);
        Utils.drawText(ctx, Game.roomNameText, tx, bannerY + 4, C.white, 1);
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
        // Heal player to full
        Game.player.hp = Game.player.maxHp;
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

        // Update stars (parallax drift)
        for (var si2 = 0; si2 < Game.titleStars.length; si2++) {
            var star = Game.titleStars[si2];
            star.y += star.speed;
            star.brightness = 0.3 + Math.sin(Game.frame * 0.05 + si2) * 0.4;
            if (star.y > H) { star.y = 0; star.x = Math.random() * W; }
        }

        // Letter-by-letter subtitle reveal
        if (Game.subtitleReveal < 23) { // "Shadows of the Eldspyre" = 23 chars
            if (Game.frame % 4 === 0) Game.subtitleReveal++;
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

        // Menu navigation if save exists
        if (Game.hasSaveData) {
            if (Input.pressed['ArrowUp'] || Input.pressed['ArrowDown']) {
                Game.titleMenuIndex = 1 - Game.titleMenuIndex;
                Audio.play('select');
            }
        }

        if (Input.pressed['Enter']) {
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

    function renderTitle() {
        var ctx = buf;

        // Dark gradient background (alternate dark rows)
        for (var row = 0; row < H; row++) {
            var shade = Math.floor(10 + (row / H) * 15);
            ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + Math.floor(shade * 1.8) + ')';
            ctx.fillRect(0, row, W, 1);
        }

        // Render parallax star field
        for (var si = 0; si < Game.titleStars.length; si++) {
            var star = Game.titleStars[si];
            ctx.globalAlpha = Math.max(0, Math.min(1, star.brightness));
            ctx.fillStyle = C.white;
            ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
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

        // Menu options
        if (Game.hasSaveData) {
            // Two options: Continue and New Game
            var contOpt = 'Continue';
            var newOpt = 'New Game';
            var contX = centerTextX(contOpt, 1);
            var newX = centerTextX(newOpt, 1);
            var menuY = H - 46;

            // Selection arrow
            var arrowBob = Math.sin(Game.frame * 0.15) * 2;
            if (Game.titleMenuIndex === 0) {
                Utils.drawText(ctx, '>', contX - 10 + arrowBob, menuY, C.yellow, 1);
                Utils.drawText(ctx, contOpt, contX, menuY, C.white, 1);
                Utils.drawText(ctx, newOpt, newX, menuY + 12, C.gray, 1);
            } else {
                Utils.drawText(ctx, contOpt, contX, menuY, C.gray, 1);
                Utils.drawText(ctx, '>', newX - 10 + arrowBob, menuY + 12, C.yellow, 1);
                Utils.drawText(ctx, newOpt, newX, menuY + 12, C.white, 1);
            }
        } else {
            // No save: just "Press ENTER to Start" blinking
            if (Math.floor(Game.frame / 30) % 2 === 0) {
                var startText = 'Press ENTER to Start';
                var stX = centerTextX(startText, 1);
                Utils.drawText(ctx, startText, stX, H - 38, C.white, 1);
            }
        }

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
        if (Input.pressed['ArrowLeft']) {
            Game.selectedChar = (Game.selectedChar + 2) % 3;
            Audio.play('select');
        }
        if (Input.pressed['ArrowRight']) {
            Game.selectedChar = (Game.selectedChar + 1) % 3;
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
            // Confirm character selection
            Audio.play('select');
            Game.state = 'intro';
            // Player will be created after intro
        }
    }

    // Character stats for select screen display
    var CHAR_STATS = {
        daxon:    { hp: 4, atk: 4, spd: 3, spc: 'Shield', spcDesc: 'Invincibility' },
        luigi:    { hp: 3, atk: 3, spd: 3, spc: 'Brog',   spcDesc: 'Homing bolt' },
        lirielle: { hp: 3, atk: 2, spd: 3, spc: 'Heal',   spcDesc: 'Restore HP' }
    };

    function renderSelect() {
        var ctx = buf;

        // Dark background
        ctx.fillStyle = C.black;
        ctx.fillRect(0, 0, W, H);

        // Title
        var titleText = 'Choose Your Hero';
        var titleX = centerTextX(titleText, 2);
        Utils.drawText(ctx, titleText, titleX, 8, C.gold, 2);

        // Three panels
        var panelW = 72;
        var panelH = 130;
        var startX = Math.floor((W - panelW * 3 - 8 * 2) / 2);
        var panelY = 28;

        for (var i = 0; i < 3; i++) {
            var px = startX + i * (panelW + 8);
            var isSelected = (i === Game.selectedChar);
            var charId = Game.characters[i];
            var stats = CHAR_STATS[charId];

            // Selected panel slides up slightly
            var yOff = isSelected ? -2 : 0;

            // Panel border (selected glows)
            ctx.strokeStyle = isSelected ? C.gold : C.darkGray;
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(px + 0.5, panelY + yOff + 0.5, panelW - 1, panelH - 1);

            // Panel background
            ctx.fillStyle = isSelected ? 'rgba(232,184,48,0.1)' : 'rgba(20,20,30,0.6)';
            ctx.fillRect(px + 1, panelY + yOff + 1, panelW - 2, panelH - 2);

            // Animated character sprite (walking cycle for selected)
            var walkFrame = isSelected ? (Math.floor(Game.frame / 12) % 2) : 0;
            var sprKey = charId + '_down_' + walkFrame;
            var sprCanvas = Sprites.get(sprKey);
            var sprX = px + Math.floor((panelW - 32) / 2);
            var sprY = panelY + yOff + 6;

            if (sprCanvas) {
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(sprCanvas, sprX, sprY, sprCanvas.width * 2, sprCanvas.height * 2);
            } else {
                ctx.fillStyle = i === 0 ? C.blue : (i === 1 ? C.purple : C.lightGreen);
                ctx.fillRect(sprX + 4, sprY + 4, 24, 24);
            }

            // Name
            var name = Game.charNames[i];
            var nameX = px + Math.floor((panelW - name.length * 6) / 2);
            Utils.drawText(ctx, name, nameX, panelY + yOff + 58, isSelected ? C.white : C.gray, 1);

            // Class
            var cls = Game.charClasses[i];
            var clsX = px + Math.floor((panelW - cls.length * 5) / 2);
            Utils.drawText(ctx, cls, clsX, panelY + yOff + 68, C.lightGray, 0.8);

            // Stat bars (only for selected character, or small for all)
            var statY = panelY + yOff + 80;
            var statBarW = panelW - 16;
            var barH = 3;

            // HP bar
            Utils.drawText(ctx, 'HP', px + 4, statY, C.lightRed, 0.7);
            ctx.fillStyle = C.darkGray;
            ctx.fillRect(px + 16, statY + 1, statBarW - 12, barH);
            ctx.fillStyle = C.red;
            ctx.fillRect(px + 16, statY + 1, Math.floor((statBarW - 12) * stats.hp / 5), barH);

            // ATK bar
            statY += 10;
            Utils.drawText(ctx, 'ATK', px + 4, statY, C.gold, 0.7);
            ctx.fillStyle = C.darkGray;
            ctx.fillRect(px + 20, statY + 1, statBarW - 16, barH);
            ctx.fillStyle = C.gold;
            ctx.fillRect(px + 20, statY + 1, Math.floor((statBarW - 16) * stats.atk / 5), barH);

            // SPD bar
            statY += 10;
            Utils.drawText(ctx, 'SPD', px + 4, statY, C.teal, 0.7);
            ctx.fillStyle = C.darkGray;
            ctx.fillRect(px + 20, statY + 1, statBarW - 16, barH);
            ctx.fillStyle = C.teal;
            ctx.fillRect(px + 20, statY + 1, Math.floor((statBarW - 16) * stats.spd / 5), barH);

            // Special ability label
            statY += 12;
            var spcText = stats.spc + ': ' + stats.spcDesc;
            var spcX = px + Math.floor((panelW - spcText.length * 4.5) / 2);
            Utils.drawText(ctx, spcText, Math.max(px + 2, spcX), statY, C.paleBlue, 0.7);

            // Sparkle on selected
            if (isSelected && Game.frame % 15 === 0) {
                Particles.sparkle(sprX + 16, sprY + 16, C.gold);
            }
        }

        Particles.update();
        Particles.render(ctx);

        // Description text at bottom
        var desc = Game.charDescs[Game.selectedChar];
        var words = desc.split(' ');
        var lines = [];
        var currentLine = '';
        for (var w = 0; w < words.length; w++) {
            if (currentLine.length + words[w].length + 1 <= 38) {
                currentLine = currentLine ? currentLine + ' ' + words[w] : words[w];
            } else {
                lines.push(currentLine);
                currentLine = words[w];
            }
        }
        if (currentLine) lines.push(currentLine);

        for (var l = 0; l < lines.length; l++) {
            var lx = centerTextX(lines[l], 1);
            Utils.drawText(ctx, lines[l], lx, panelY + panelH + 8 + l * 10, C.white, 1);
        }

        // Difficulty selector
        var diffNames = ['EASY', 'NORMAL', 'HARD'];
        var diffColors = [C.lightGreen, C.yellow, C.red];
        var diffStr = 'DIFFICULTY: ' + diffNames[Game.difficulty];
        var diffX = centerTextX(diffStr, 1);
        Utils.drawText(ctx, diffStr, diffX, H - 34, diffColors[Game.difficulty], 1);
        Utils.drawText(ctx, 'UP/DOWN TO CHANGE', centerTextX('UP/DOWN TO CHANGE', 1), H - 24, C.darkGray, 1);

        // Speed run toggle
        var srText = 'SPEED RUN: ' + (Game.speedRunEnabled ? 'ON' : 'OFF');
        Utils.drawText(ctx, srText, W - 80, H - 34, Game.speedRunEnabled ? C.gold : C.darkGray, 1);
        Utils.drawText(ctx, 'X:TOGGLE', W - 56, H - 24, C.darkGray, 1);

        // "Z to Confirm" blinking with arrow indicators
        if (Math.floor(Game.frame / 30) % 2 === 0) {
            var confText = 'Z to Confirm';
            var confX = centerTextX(confText, 1);
            Utils.drawText(ctx, confText, confX, H - 12, C.yellow, 1);
        }
        // Arrow key hints
        var arrowBob = Math.sin(Game.frame * 0.1) * 2;
        Utils.drawText(ctx, '<', 8 + arrowBob, H / 2 + 10, C.gold, 2);
        Utils.drawText(ctx, '>', W - 18 - arrowBob, H / 2 + 10, C.gold, 2);
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
            Audio.play('select');
            return;
        }

        // If shop is open: only update shop
        if (Game.shopOpen) {
            updateShop();
            return;
        }

        // If dialogue is active: only update dialogue
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

        // If transition is active: only update transition
        if (Game.transition.active) {
            updateTransition();
            return;
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

        // Update enemies
        for (var i = 0; i < Game.enemies.length; i++) {
            var enemy = Game.enemies[i];
            if (enemy.update) {
                enemy.update(Game.currentRoom, Game.player);
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
            spawnFloatingText(Game.player.x + 2, Game.player.y - 4, dmg, C.red);
        }
        for (var ej = 0; ej < Game.enemies.length; ej++) {
            if (ej < enemyHPBefore.length && Game.enemies[ej].hp < enemyHPBefore[ej]) {
                var edmg = enemyHPBefore[ej] - Game.enemies[ej].hp;
                spawnFloatingText(Game.enemies[ej].x + 2, Game.enemies[ej].y - 6, edmg, C.white);
            }
        }

        // Handle Luigi's Brog special
        handleBrogSpecial();
        updateBrogDamage();

        // Check dead enemies & drops
        checkDeadEnemies();

        // Update floating texts
        updateFloatingTexts();

        // Update weather/ambient particles
        updateWeather();

        // Update particles
        Particles.update();

        // Check sign interaction
        checkSignInteraction();

        // Check spike trap hazards
        checkSpikeTraps();

        // Ambient sounds
        updateAmbientSounds();

        // Check room exits
        checkRoomExits();

        // Check special room events
        checkSpecialRoomEvents();

        // Check game over
        checkGameOver();

        // Screenshake from player damage (increased for impact)
        if (Game.player && Game.player._wasHurt) {
            Game.shake = 4;
            Game.player._wasHurt = false;
        }
    }

    function renderGame() {
        var ctx = buf;

        // Clear buffer
        ctx.fillStyle = C.black;
        ctx.fillRect(0, 0, W, H);

        if (!Game.currentRoom) return;

        // Render map tiles
        renderMap(ctx, Game.currentRoom);

        // Torch warm glow (drawn on top of map, under entities)
        renderTorchGlow(ctx, Game.currentRoom);

        // Render general items (potions, etc.)
        renderItems(ctx);

        // Render puzzle items (glowing, bobbing)
        renderPuzzleItems(ctx);

        // Render NPCs
        for (var n = 0; n < Game.npcs.length; n++) {
            var npc = Game.npcs[n];
            if (npc.render) {
                npc.render(ctx);
            } else {
                safeDraw(ctx, npc.sprite || npc.spriteKey, npc.x, npc.y);
            }
        }

        // Render heart drops
        for (var h = 0; h < Game.heartDrops.length; h++) {
            var hd = Game.heartDrops[h];
            var bob = Math.sin((hd.bobTimer || 0) * 0.1) * 2;
            // Blink if about to despawn
            if (hd.life < 60 && Game.frame % 4 < 2) continue;
            safeDraw(ctx, 'item_heart', hd.x, hd.y + bob);
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

        // Render particles
        Particles.render(ctx);

        // Temple darkness overlay (over entities, under HUD)
        renderDarknessOverlay(ctx, Game.currentRoom);

        // Render floating damage numbers
        renderFloatingTexts(ctx);

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
            Audio.play('select');
            return;
        }

        // If dialogue is active: only update dialogue
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
                Game.enemies[i].update(Game.currentRoom, Game.player);
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

        // Handle Luigi's Brog special
        handleBrogSpecial();
        updateBrogDamage();

        // Heart drops
        updateHeartDrops();

        // Dead enemies
        checkDeadEnemies();

        // Update floating texts
        updateFloatingTexts();

        // Particles
        Particles.update();

        // Check game over
        checkGameOver();

        // Screenshake from player damage (increased for impact)
        if (Game.player && Game.player._wasHurt) {
            Game.shake = 4;
            Game.player._wasHurt = false;
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

            // Cascading explosion spectacle
            if (Game.bossDeathTimer === 1) {
                Game.shake = 10;
                Audio.play('explosion');
                Particles.burst(Game.boss.x + 8, Game.boss.y + 8, 30, C.red);
                Particles.burst(Game.boss.x + 8, Game.boss.y + 8, 20, C.darkPurple);
            }
            if (Game.bossDeathTimer === 15) {
                Game.shake = 6;
                Audio.play('explosion');
                Particles.burst(Game.boss.x - 10, Game.boss.y + 12, 20, C.gold);
            }
            if (Game.bossDeathTimer === 30) {
                Game.shake = 8;
                Audio.play('explosion');
                Particles.burst(Game.boss.x + 20, Game.boss.y - 5, 25, C.red);
                Particles.burst(Game.boss.x + 12, Game.boss.y + 12, 15, C.purple);
            }
            if (Game.bossDeathTimer === 45) {
                // Final big burst
                Game.shake = 12;
                Particles.burst(Game.boss.x + 8, Game.boss.y + 8, 40, C.gold);
                Particles.burst(Game.boss.x + 8, Game.boss.y + 8, 30, C.white);
            }

            if (Game.bossDeathTimer === 60) {
                Game.bossDialogueStage = 1;
                Dialogue.start('boss_defeat', function () {
                    Game.bossDialogueStage = 2;
                    Dialogue.start('victory_rorik', function () {
                        Game.bossDialogueStage = 3;
                        Dialogue.start('ending_nitriti', function () {
                            Game.flags.bossDefeated = true;
                            Game.state = 'victory';
                            Game.victoryDialogueDone = false;
                            Game.creditsY = H + 20;
                            Audio.play('victory');
                            if (Music) Music.play('victory');
                        });
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

        // Render map tiles
        renderMap(ctx, Game.currentRoom);

        // Torch warm glow
        renderTorchGlow(ctx, Game.currentRoom);

        // Render NPCs
        for (var n = 0; n < Game.npcs.length; n++) {
            var npc = Game.npcs[n];
            if (npc.render) {
                npc.render(ctx);
            } else {
                safeDraw(ctx, npc.sprite || npc.spriteKey, npc.x, npc.y);
            }
        }

        // Render heart drops
        for (var h = 0; h < Game.heartDrops.length; h++) {
            var hd = Game.heartDrops[h];
            var bob = Math.sin((hd.bobTimer || 0) * 0.1) * 2;
            if (hd.life < 60 && Game.frame % 4 < 2) continue;
            safeDraw(ctx, 'item_heart', hd.x, hd.y + bob);
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

        // Render boss
        if (Game.boss && Game.boss.render) {
            Game.boss.render(ctx);
        }

        // Render player
        if (Game.player && Game.player.render) {
            Game.player.render(ctx);
        }

        // Particles
        Particles.render(ctx);

        // Temple darkness overlay
        renderDarknessOverlay(ctx, Game.currentRoom);

        // Floating damage numbers
        renderFloatingTexts(ctx);

        // HUD
        renderHUD(ctx);

        // Boss health bar at top center
        if (Game.boss && !Game.boss.dead) {
            var bossBarW = 120;
            var bossBarH = 6;
            var bossBarX = Math.floor((W - bossBarW) / 2);
            var bossBarY = 4;

            // Background
            ctx.fillStyle = C.darkGray;
            ctx.fillRect(bossBarX - 1, bossBarY - 1, bossBarW + 2, bossBarH + 2);

            // Health
            var bossHPRatio = Math.max(0, Game.boss.hp / (Game.boss.maxHp || 1));
            ctx.fillStyle = bossHPRatio > 0.3 ? C.red : C.darkRed;
            ctx.fillRect(bossBarX, bossBarY, Math.floor(bossBarW * bossHPRatio), bossBarH);

            // Label
            Utils.drawText(ctx, 'Queen Bargnot', bossBarX, bossBarY + bossBarH + 2, C.lightRed, 1);
        }

        // Dialogue
        Dialogue.render(ctx);

        // Room name
        renderRoomName(ctx);
    }

    // =====================================================================
    // GAME OVER SCREEN
    // =====================================================================

    function updateGameOver() {
        Game.gameOverTimer++;

        if (Game.gameOverTimer > 60 && Input.pressed['Enter']) {
            // Reset player HP and return to safe room
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
        }
    }

    function renderGameOver() {
        var ctx = buf;

        // Fade to dark red tint
        ctx.fillStyle = C.black;
        ctx.fillRect(0, 0, W, H);

        // Red tint overlay
        ctx.fillStyle = 'rgba(80, 10, 10, 0.7)';
        ctx.fillRect(0, 0, W, H);

        // Character sprite lying down (rotated)
        if (Game.player) {
            var charId = Game.player.characterId;
            var sprKey = charId + '_down_0';
            var sprCanvas = Sprites.get(sprKey);
            if (sprCanvas) {
                ctx.save();
                ctx.translate(W / 2, H / 2 - 40);
                ctx.rotate(Math.PI / 2); // Lying on side
                ctx.globalAlpha = 0.6;
                ctx.drawImage(sprCanvas, -8, -12);
                ctx.globalAlpha = 1;
                ctx.restore();
            }
        }

        // "YOU HAVE FALLEN" text
        var deathText = 'YOU HAVE FALLEN';
        var dtX = centerTextX(deathText, 2);
        Utils.drawText(ctx, deathText, dtX + 1, H / 2 - 15, C.darkRed, 2);
        Utils.drawText(ctx, deathText, dtX, H / 2 - 16, C.red, 2);

        // Run stats
        var statsY = H / 2 + 8;
        var playMins = Math.floor(Game.playTime / 3600);
        var playSecs = Math.floor((Game.playTime % 3600) / 60);
        var timeStr = 'TIME: ' + playMins + ':' + (playSecs < 10 ? '0' : '') + playSecs;
        Utils.drawText(ctx, timeStr, centerTextX(timeStr, 1), statsY, C.lightGray, 1);

        var enemyStr = 'ENEMIES DEFEATED: ' + Game.enemiesDefeated;
        Utils.drawText(ctx, enemyStr, centerTextX(enemyStr, 1), statsY + 12, C.lightGray, 1);

        var teethStr = 'GOBLIN TEETH: ' + Game.goblinTeeth;
        Utils.drawText(ctx, teethStr, centerTextX(teethStr, 1), statsY + 24, C.gold, 1);

        // Difficulty indicator
        var diffNames = ['EASY', 'NORMAL', 'HARD'];
        var diffStr = 'DIFFICULTY: ' + diffNames[Game.difficulty];
        Utils.drawText(ctx, diffStr, centerTextX(diffStr, 1), statsY + 36, C.gray, 1);

        // "Press ENTER to Continue" blinking
        if (Game.gameOverTimer > 60 && Math.floor(Game.frame / 30) % 2 === 0) {
            var contText = 'Press ENTER to Continue';
            var cX = centerTextX(contText, 1);
            Utils.drawText(ctx, contText, cX, H - 20, C.white, 1);
        }
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

        // Firework confetti bursts
        if (Game.victoryDialogueDone && Game.frame % 90 === 0) {
            var fx = Utils.randInt(40, W - 40);
            var fy = Utils.randInt(20, H / 2);
            Particles.confetti(fx, fy, 15);
            Audio.play('fanfare');
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
                lastSafeY: Game.lastSafeY
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

    function updatePaused() {
        if (Input.pressed['p'] || Input.pressed['Escape']) {
            // Unpause
            Game.state = Game.pausedFromState || 'game';
            Game.pausedFromState = null;
            Audio.play('select');
        }
    }

    function renderPaused() {
        var ctx = buf;

        // Render the game scene underneath (frozen)
        if (Game.pausedFromState === 'boss') {
            renderBoss();
        } else {
            renderGame();
        }

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0,0,15,0.7)';
        ctx.fillRect(0, 0, W, H);

        // "PAUSED" title
        var pauseText = 'PAUSED';
        var ptX = centerTextX(pauseText, 2);
        Utils.drawText(ctx, pauseText, ptX, 30, C.gold, 2);

        // Character info
        if (Game.player) {
            var charName = Game.charNames[Game.selectedChar] || '';
            var charClass = Game.charClasses[Game.selectedChar] || '';
            Utils.drawText(ctx, charName, centerTextX(charName, 1), 60, C.white, 1);
            Utils.drawText(ctx, charClass, centerTextX(charClass, 1), 72, C.lightGray, 1);

            // HP display
            var hpText = 'HP: ' + Game.player.hp + '/' + Game.player.maxHp;
            Utils.drawText(ctx, hpText, centerTextX(hpText, 1), 90, C.red, 1);
        }

        // Current room
        if (Game.currentRoom) {
            var roomText = Game.currentRoom.name || '';
            Utils.drawText(ctx, roomText, centerTextX(roomText, 1), 108, C.paleBlue, 1);
        }

        // Stats
        var statsY = 126;
        var defeatedText = 'Enemies Defeated: ' + (Game.enemiesDefeated || 0);
        Utils.drawText(ctx, defeatedText, centerTextX(defeatedText, 1), statsY, C.lightGray, 1);

        var roomsText = 'Rooms Explored: ' + Object.keys(Game.visitedRooms || {}).length + '/8';
        Utils.drawText(ctx, roomsText, centerTextX(roomsText, 1), statsY + 12, C.lightGray, 1);

        // Collected items
        var itemsY = statsY + 30;
        if (Game.flags.puzzleCrown) safeDraw(ctx, 'item_crown', W/2 - 24, itemsY);
        if (Game.flags.puzzleCape)  safeDraw(ctx, 'item_cape',  W/2 - 8, itemsY);
        if (Game.flags.puzzleScepter) safeDraw(ctx, 'item_scepter', W/2 + 8, itemsY);

        // Play time
        var totalSeconds = Math.floor((Game.playTime || 0) / 60);
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = totalSeconds % 60;
        var timeText = 'Time: ' + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
        Utils.drawText(ctx, timeText, centerTextX(timeText, 1), statsY + 50, C.lightGray, 1);

        // Resume hint (blinking)
        if (Math.floor(Game.frame / 30) % 2 === 0) {
            var resumeText = 'Press P or ESC to Resume';
            Utils.drawText(ctx, resumeText, centerTextX(resumeText, 1), H - 18, C.yellow, 1);
        }
    }

    // =====================================================================
    // FULL GAME RESET
    // =====================================================================

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
            case 'victory':    renderVictory();   break;
            case 'gameover':   renderGameOver();  break;
            case 'paused':     renderPaused();    break;
        }

        // Blit offscreen buffer to display canvas (with screenshake)
        display.imageSmoothingEnabled = false;
        var sx = 0, sy = 0;
        if (Game.shake > 0) {
            sx = Utils.randInt(-2, 2);
            sy = Utils.randInt(-2, 2);
            Game.shake--;
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
