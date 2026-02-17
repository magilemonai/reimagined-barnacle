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
        state: 'title', // title, select, intro, game, boss_intro, boss, victory, gameover

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
        lastSafeY: 7
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
        for (var row = 0; row < ROWS; row++) {
            for (var col = 0; col < COLS; col++) {
                var tileId = Maps.getTile(room, col, row);
                var tileProp = window.TileProps[tileId];
                if (tileProp) {
                    var spriteKey = tileProp.name;
                    safeDraw(ctx, spriteKey, col * TILE, row * TILE);
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
                // Normalize enemy type: maps use 'goblin_lackey', entity expects 'goblin'
                var etype = eData.type;
                if (etype === 'goblin_lackey') etype = 'goblin';
                var enemy = new Entities.Enemy(etype, eData.x, eData.y);
                Game.enemies.push(enemy);
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
        var alpha;

        if (Game.transition.timer > half) {
            // Fading to black
            alpha = 1 - (Game.transition.timer - half) / half;
        } else {
            // Fading from black
            alpha = Game.transition.timer / half;
        }

        ctx.fillStyle = C.black;
        ctx.globalAlpha = alpha;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
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
                    var dialogueId = npc.dialogueId || npc.dialogue;
                    if (dialogueId) {
                        Dialogue.start(dialogueId);
                        Audio.play('select');
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
                Audio.play('pickup');
                Dialogue.start('statue_complete');
                Particles.burst(statueX, statueY, 20, C.purple);
                Game.shake = 5;
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

    var MINIMAP_ROOMS = [
        { id: 'ebon_vale_market',   col: 0, row: 0, color: '#4a7' },
        { id: 'ebon_vale_square',   col: 1, row: 0, color: '#4a7' },
        { id: 'ebon_vale_north',    col: 2, row: 0, color: '#4a7' },
        { id: 'ebon_forest_entry',  col: 3, row: 0, color: '#276' },
        { id: 'ebon_forest_deep',   col: 3, row: 1, color: '#276' },
        { id: 'temple_entrance',    col: 3, row: 2, color: '#666' },
        { id: 'temple_puzzle',      col: 3, row: 3, color: '#666' },
        { id: 'temple_boss',        col: 3, row: 4, color: '#a33' }
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
        var cellW = 7;
        var cellH = 5;
        var padding = 2;
        // Calculate minimap bounds (4 cols wide x 5 rows tall)
        var mapW = 4 * cellW + padding * 2;
        var mapH = 5 * cellH + padding * 2;
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
        if (Game.roomNameTimer < 30) {
            alpha = Game.roomNameTimer / 30;
        }

        ctx.globalAlpha = alpha;
        var tx = centerTextX(Game.roomNameText, 1);
        Utils.drawText(ctx, Game.roomNameText, tx, 22, C.white, 1);
        ctx.globalAlpha = 1;
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

    function updateTitle() {
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

        if (Input.pressed['Enter']) {
            Game.state = 'select';
            Audio.play('select');
            if (Music) Music.stop();
            // Clear particles for clean transition
            Particles.particles = [];
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

        // White sparkle pixels on crystal
        var sparkleOffset = Math.sin(Game.frame * 0.1) * 2;
        ctx.fillStyle = C.white;
        ctx.fillRect(cx - 1, cy - 6 + sparkleOffset, 2, 2);
        ctx.fillRect(cx + 4, cy + sparkleOffset, 2, 2);
        ctx.fillRect(cx - 5, cy + 2 - sparkleOffset, 2, 2);

        // Title: "VALISAR" in gold, size 3
        var titleText = 'VALISAR';
        var titleX = centerTextX(titleText, 3);
        Utils.drawText(ctx, titleText, titleX, 30, C.gold, 3);

        // Subtitle
        var subText = 'Shadows of the Eldspyre';
        var subX = centerTextX(subText, 1);
        Utils.drawText(ctx, subText, subX, 58, C.paleBlue, 1);

        // "Press ENTER to Start" - blinking
        if (Math.floor(Game.frame / 30) % 2 === 0) {
            var startText = 'Press ENTER to Start';
            var stX = centerTextX(startText, 1);
            Utils.drawText(ctx, startText, stX, H - 38, C.white, 1);
        }

        // Particles (sparkles floating up)
        Particles.render(ctx);

        // Credits at very bottom
        var credText = 'Based on the Valisar Campaign World';
        var crX = centerTextX(credText, 1);
        Utils.drawText(ctx, credText, crX, H - 14, C.gray, 1);
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
        if (Input.pressed['z']) {
            // Confirm character selection
            Audio.play('select');
            Game.state = 'intro';
            // Player will be created after intro
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
        Utils.drawText(ctx, titleText, titleX, 12, C.gold, 2);

        // Three panels
        var panelW = 70;
        var panelH = 120;
        var startX = Math.floor((W - panelW * 3 - 10 * 2) / 2);
        var panelY = 36;

        for (var i = 0; i < 3; i++) {
            var px = startX + i * (panelW + 10);
            var isSelected = (i === Game.selectedChar);

            // Panel border
            ctx.strokeStyle = isSelected ? C.gold : C.darkGray;
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(px + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

            // Panel background
            ctx.fillStyle = isSelected ? 'rgba(232,184,48,0.08)' : 'rgba(20,20,30,0.6)';
            ctx.fillRect(px + 1, panelY + 1, panelW - 2, panelH - 2);

            // Character sprite at 2x size (center of panel)
            var sprKey = Game.characters[i] + '_down_0';
            var sprCanvas = Sprites.get(sprKey);
            var sprX = px + Math.floor((panelW - 32) / 2);
            var sprY = panelY + 10;

            if (sprCanvas) {
                // Draw the sprite canvas at 2x scale
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(sprCanvas, sprX, sprY, sprCanvas.width * 2, sprCanvas.height * 2);
            } else {
                // Fallback character representation
                ctx.fillStyle = i === 0 ? C.blue : (i === 1 ? C.purple : C.lightGreen);
                ctx.fillRect(sprX + 4, sprY + 4, 24, 24);
            }

            // Name
            var name = Game.charNames[i];
            var nameX = px + Math.floor((panelW - name.length * 6) / 2);
            Utils.drawText(ctx, name, nameX, panelY + 80, C.white, 1);

            // Class
            var cls = Game.charClasses[i];
            var clsX = px + Math.floor((panelW - cls.length * 6) / 2);
            Utils.drawText(ctx, cls, clsX, panelY + 92, C.lightGray, 1);

            // Sparkle on selected
            if (isSelected && Game.frame % 15 === 0) {
                Particles.sparkle(sprX + 16, sprY + 16, C.gold);
            }
        }

        Particles.update();
        Particles.render(ctx);

        // Description text at bottom
        var desc = Game.charDescs[Game.selectedChar];
        // Word wrap the description
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
            Utils.drawText(ctx, lines[l], lx, panelY + panelH + 12 + l * 10, C.white, 1);
        }

        // "Z to Confirm" blinking
        if (Math.floor(Game.frame / 30) % 2 === 0) {
            var confText = 'Z to Confirm';
            var confX = centerTextX(confText, 1);
            Utils.drawText(ctx, confText, confX, H - 14, C.yellow, 1);
        }
    }

    // =====================================================================
    // INTRO CUTSCENE
    // =====================================================================

    function updateIntro() {
        if (!Dialogue.isActive() && Game.cutsceneTimer === 0) {
            Dialogue.start('intro_cutscene', function () {
                // After intro dialogue, start game
                startGame();
            });
            Game.cutsceneTimer = 1;
        }

        Dialogue.update();

        if (Input.pressed['z']) {
            Dialogue.advance();
        }
    }

    function renderIntro() {
        var ctx = buf;

        // Black background
        ctx.fillStyle = C.black;
        ctx.fillRect(0, 0, W, H);

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

        // Load starting room
        loadRoom(Maps.startRoom);

        Game.state = 'game';
        Game.cutsceneTimer = 0;
    }

    // =====================================================================
    // MAIN GAMEPLAY UPDATE
    // =====================================================================

    function updateGame() {
        // If dialogue is active: only update dialogue
        if (Dialogue.isActive()) {
            Dialogue.update();
            if (Input.pressed['z']) {
                Dialogue.advance();
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

        // Update particles
        Particles.update();

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

        // Render dialogue box
        Dialogue.render(ctx);

        // Render transition overlay
        renderTransition(ctx);

        // Render room name
        renderRoomName(ctx);
    }

    // =====================================================================
    // BOSS INTRO STATE
    // =====================================================================

    function updateBossIntro() {
        Dialogue.update();

        if (Input.pressed['z']) {
            Dialogue.advance();
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
        // If dialogue is active: only update dialogue
        if (Dialogue.isActive()) {
            Dialogue.update();
            if (Input.pressed['z']) {
                Dialogue.advance();
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

        // Check boss defeated
        if (Game.boss && Game.boss.dead) {
            Game.bossDeathTimer++;

            if (Game.bossDeathTimer === 1) {
                Game.shake = 5;
                Audio.play('explosion');
                Particles.burst(Game.boss.x + 8, Game.boss.y + 8, 30, C.red);
                Particles.burst(Game.boss.x + 8, Game.boss.y + 8, 20, C.darkPurple);
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

        // "YOU HAVE FALLEN" text
        var deathText = 'YOU HAVE FALLEN';
        var dtX = centerTextX(deathText, 2);
        Utils.drawText(ctx, deathText, dtX, H / 2 - 20, C.red, 2);

        // "Press ENTER to Continue" blinking
        if (Game.gameOverTimer > 60 && Math.floor(Game.frame / 30) % 2 === 0) {
            var contText = 'Press ENTER to Continue';
            var cX = centerTextX(contText, 1);
            Utils.drawText(ctx, contText, cX, H / 2 + 20, C.white, 1);
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

        // Particles behind text
        Particles.render(ctx);

        if (Game.victoryDialogueDone) {
            // "THE END" in large gold text
            var endText = 'THE END';
            var endX = centerTextX(endText, 3);
            Utils.drawText(ctx, endText, endX, 30, C.gold, 3);

            // "...for now"
            var forNow = '...for now';
            var fnX = centerTextX(forNow, 1);
            Utils.drawText(ctx, forNow, fnX, 58, C.lightGray, 1);

            // Credits scrolling
            var creditsLines = [
                'VALISAR: SHADOWS OF THE ELDSPYRE',
                '',
                'Based on the Valisar Campaign',
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
    // FULL GAME RESET
    // =====================================================================

    function fullReset() {
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
