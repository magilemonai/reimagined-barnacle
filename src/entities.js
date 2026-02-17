/**
 * Valisar: Shadows of the Eldspyre
 * Entity System & Combat Resolution
 *
 * Provides: Player, Enemy, NPC, Boss (Queen Bargnot), HeartDrop, Projectile,
 *           and the resolveCombat function.
 *
 * Globals expected:
 *   window.C, window.Input, window.Sprites, window.Maps, window.Particles,
 *   window.Audio, window.Utils, window.Dialogue, window.buf,
 *   window.TILE (16), window.W (256), window.H (224)
 */
(function () {
    "use strict";

    /* ===================================================================
     *  Player
     * =================================================================*/
    class Player {
        constructor(characterId, x, y) {
            this.x = x;            // pixel position (top-left of hitbox)
            this.y = y;
            this.w = 10;           // hitbox size (smaller than sprite for forgiveness)
            this.h = 12;
            this.spriteW = 16;
            this.spriteH = 24;
            this.speed = 1.5;
            this.dir = 'down';     // down, up, left, right
            this.frame = 0;        // animation frame (0 or 1)
            this.frameTimer = 0;
            this.moving = false;

            this.characterId = characterId; // 'daxon', 'luigi', 'lirielle'
            this.maxHp = (characterId === 'daxon') ? 8 : 6; // half-hearts
            this.hp = this.maxHp;
            this.attacking = false;
            this.attackTimer = 0;
            this.attackDuration = 15;   // frames
            this.attackCooldown = 0;
            this.attackHitbox = null;   // {x,y,w,h} active during attack
            this.attackDealt = false;   // prevent multi-hit per swing

            this.specialCooldown = 0;
            this.specialMaxCooldown = 120; // 2 seconds at 60 fps

            this.invincible = 0;    // invincibility frames after taking damage
            this.knockback = null;  // {vx, vy, timer}
            this.flash = 0;         // white flash frames

            this.items = [];        // collected item IDs
            this.hasItem = function (id) { return this.items.indexOf(id) !== -1; };

            // Flag set by useSpecial when Luigi fires a projectile
            this._pendingProjectile = false;

            // Hitstop: freezes the entity for N frames on hit for juicy impact feel
            this.hitstop = 0;
        }

        /* ----- main update ------------------------------------------ */
        update(room) {
            // Hitstop: freeze in place for dramatic impact
            if (this.hitstop > 0) {
                this.hitstop--;
                return;
            }

            // Handle knockback (collision-aware so we don't get pushed into walls)
            if (this.knockback) {
                var kbx = this.x + this.knockback.vx;
                var kby = this.y + this.knockback.vy;
                // Try full knockback, then per-axis, then stop
                if (!this.collidesWithMap(room, kbx, kby)) {
                    this.x = kbx;
                    this.y = kby;
                } else if (!this.collidesWithMap(room, kbx, this.y)) {
                    this.x = kbx;
                } else if (!this.collidesWithMap(room, this.x, kby)) {
                    this.y = kby;
                }
                // Decay knockback velocity so it doesn't just stop abruptly
                this.knockback.vx *= 0.7;
                this.knockback.vy *= 0.7;
                this.knockback.timer--;
                if (this.knockback.timer <= 0) this.knockback = null;
                this.clampToRoom();
                this.pushOutOfSolids(room);
                return; // can't act during knockback
            }

            // Decrement timers
            if (this.invincible > 0) this.invincible--;
            if (this.attackCooldown > 0) this.attackCooldown--;
            if (this.specialCooldown > 0) this.specialCooldown--;
            if (this.flash > 0) this.flash--;

            // Handle attack animation
            if (this.attacking) {
                this.attackTimer--;
                this.updateAttackHitbox();
                if (this.attackTimer <= 0) {
                    this.attacking = false;
                    this.attackHitbox = null;
                    this.attackDealt = false;
                }
                return; // can't move during attack
            }

            // Movement input
            var dx = 0, dy = 0;
            if (Input.keys['ArrowLeft'])  { dx = -1; this.dir = 'left';  }
            if (Input.keys['ArrowRight']) { dx = 1;  this.dir = 'right'; }
            if (Input.keys['ArrowUp'])    { dy = -1; this.dir = 'up';    }
            if (Input.keys['ArrowDown'])  { dy = 1;  this.dir = 'down';  }

            // Normalize diagonal movement
            if (dx !== 0 && dy !== 0) {
                dx *= 0.707;
                dy *= 0.707;
            }

            this.moving = (dx !== 0 || dy !== 0);

            // Apply movement with per-axis collision
            if (this.moving) {
                var newX = this.x + dx * this.speed;
                var newY = this.y + dy * this.speed;

                // Check X movement
                if (!this.collidesWithMap(room, newX, this.y)) {
                    this.x = newX;
                }
                // Check Y movement
                if (!this.collidesWithMap(room, this.x, newY)) {
                    this.y = newY;
                }

                // Walk animation
                this.frameTimer++;
                if (this.frameTimer >= 10) {
                    this.frame = 1 - this.frame;
                    this.frameTimer = 0;
                    // Play footstep sound on each step
                    if (this.frame === 0) {
                        Audio.play('footstep');
                    }
                }
            } else {
                this.frame = 0;
                this.frameTimer = 0;
            }

            // Attack input (Z key)
            if (Input.pressed['z'] && !this.attacking && this.attackCooldown <= 0) {
                this.startAttack();
            }

            // Special ability input (X key)
            if (Input.pressed['x'] && this.specialCooldown <= 0) {
                this.useSpecial();
            }

            this.clampToRoom();
            this.pushOutOfSolids(room);
        }

        /* ----- attack helpers --------------------------------------- */
        startAttack() {
            this.attacking = true;
            this.attackTimer = this.attackDuration;
            this.attackCooldown = 8;
            this.attackDealt = false;
            this.updateAttackHitbox();
            Audio.play('sword');
        }

        updateAttackHitbox() {
            // Create hitbox in front of player based on direction
            var hx = this.x + this.w / 2 - 8;
            var hy = this.y + this.h / 2 - 8;
            var hw = 16, hh = 16;

            switch (this.dir) {
                case 'down':  hy += this.h;  break;
                case 'up':    hy -= 16;      break;
                case 'left':  hx -= 16;      break;
                case 'right': hx += this.w;  break;
            }

            // Luigi has ranged attack -- extend hitbox further
            if (this.characterId === 'luigi') {
                switch (this.dir) {
                    case 'down':  hh = 32;            break;
                    case 'up':    hy -= 16; hh = 32;  break;
                    case 'left':  hx -= 16; hw = 32;  break;
                    case 'right': hw = 32;            break;
                }
            }

            this.attackHitbox = { x: hx, y: hy, w: hw, h: hh };
        }

        /* ----- special ability -------------------------------------- */
        useSpecial() {
            this.specialCooldown = this.specialMaxCooldown;

            if (this.characterId === 'daxon') {
                // Shield: brief invincibility
                this.invincible = 90; // 1.5 seconds
                this.flash = 90;
                Particles.sparkle(this.x + this.w / 2, this.y, C.lightBlue);
                Audio.play('pickup');
            } else if (this.characterId === 'luigi') {
                // Brog attack: a seeking projectile (created by the game layer)
                this._pendingProjectile = true;
                Audio.play('sword');
            } else if (this.characterId === 'lirielle') {
                // Heal 2 half-hearts
                this.hp = Math.min(this.hp + 2, this.maxHp);
                Particles.sparkle(this.x + this.w / 2, this.y, C.paleGreen);
                Audio.play('pickup');
            }
        }

        /* ----- damage / knockback ----------------------------------- */
        takeDamage(amount, fromX, fromY) {
            if (this.invincible > 0) return;
            this.hp -= amount;
            this.invincible = 60; // 1 second invincibility
            this.flash = 8;

            // Knockback away from damage source
            var angle = Math.atan2(this.y - fromY, this.x - fromX);
            this.knockback = {
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                timer: 8
            };

            Audio.play('hurt');
            Particles.burst(this.x + this.w / 2, this.y + this.h / 2, 5, C.red);

            if (this.hp <= 0) {
                this.hp = 0;
                // Game-over is handled by the main game loop
            }
        }

        /* ----- collision helpers ------------------------------------ */
        collidesWithMap(room, px, py) {
            // Check corners of hitbox against solid tiles
            var points = [
                { x: px + 1,          y: py + 1 },
                { x: px + this.w - 2, y: py + 1 },
                { x: px + 1,          y: py + this.h - 2 },
                { x: px + this.w - 2, y: py + this.h - 2 }
            ];
            for (var i = 0; i < points.length; i++) {
                if (Maps.isSolidAt(room, points[i].x, points[i].y)) return true;
            }
            return false;
        }

        clampToRoom() {
            this.x = Utils.clamp(this.x, 0, W - this.w);
            this.y = Utils.clamp(this.y, 0, H - this.h);
        }

        /** Push player out of solid tiles if stuck (e.g. after knockback) */
        pushOutOfSolids(room) {
            if (!this.collidesWithMap(room, this.x, this.y)) return;
            // Try small offsets in each direction to escape
            var step = 1;
            for (var dist = step; dist <= 16; dist += step) {
                if (!this.collidesWithMap(room, this.x, this.y - dist)) { this.y -= dist; return; }
                if (!this.collidesWithMap(room, this.x, this.y + dist)) { this.y += dist; return; }
                if (!this.collidesWithMap(room, this.x - dist, this.y)) { this.x -= dist; return; }
                if (!this.collidesWithMap(room, this.x + dist, this.y)) { this.x += dist; return; }
            }
        }

        /** Returns exit direction if player is at room edge, else null */
        checkExit() {
            if (this.y <= 0)          return 'north';
            if (this.y >= H - this.h) return 'south';
            if (this.x <= 0)          return 'west';
            if (this.x >= W - this.w) return 'east';
            return null;
        }

        /* ----- rendering -------------------------------------------- */
        render(ctx) {
            // Invincibility flashing -- skip every other 3-frame group
            if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0) return;

            // Use 'right' sprites for left direction (flipped horizontally)
            var spriteDir = (this.dir === 'left') ? 'right' : this.dir;
            var spriteKey = this.characterId + '_' + spriteDir + '_';
            if (this.attacking) {
                spriteKey += 'atk';
            } else {
                spriteKey += this.frame;
            }

            // Draw sprite centered on hitbox, bottom-aligned
            var sx = this.x + this.w / 2 - this.spriteW / 2;
            var sy = this.y + this.h - this.spriteH;

            // White flash overlay
            if (this.flash > 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fillRect(Math.floor(sx), Math.floor(sy), this.spriteW, this.spriteH);
            }

            var flip = (this.dir === 'left');
            Sprites.draw(ctx, spriteKey, Math.floor(sx), Math.floor(sy), flip);

            // Draw attack effect
            if (this.attacking && this.attackHitbox) {
                this.renderAttackEffect(ctx);
            }
        }

        renderAttackEffect(ctx) {
            var ah = this.attackHitbox;
            var progress = 1 - (this.attackTimer / this.attackDuration);

            if (this.characterId === 'luigi') {
                // Teal energy blast
                ctx.fillStyle = C.teal;
                ctx.globalAlpha = 0.6 * (1 - progress);
                ctx.fillRect(Math.floor(ah.x + 2), Math.floor(ah.y + 2), ah.w - 4, ah.h - 4);
                ctx.globalAlpha = 1;
            } else if (this.characterId === 'lirielle') {
                // Green sparkle arc
                ctx.fillStyle = C.lightGreen;
                ctx.globalAlpha = 0.5 * (1 - progress);
                ctx.fillRect(Math.floor(ah.x + 3), Math.floor(ah.y + 3), ah.w - 6, ah.h - 6);
                ctx.globalAlpha = 1;
            } else {
                // Daxon: sword arc -- white flash
                ctx.fillStyle = C.white;
                ctx.globalAlpha = 0.4 * (1 - progress);
                ctx.fillRect(Math.floor(ah.x + 2), Math.floor(ah.y + 2), ah.w - 4, ah.h - 4);
                ctx.globalAlpha = 1;
            }
        }
    }

    /* ===================================================================
     *  Enemy
     * =================================================================*/
    class Enemy {
        constructor(type, x, y) {
            this.type = type;        // 'goblin' or 'spinecleaver'
            this.x = x * TILE;      // convert tile coords to pixels
            this.y = y * TILE;
            this.w = 12;
            this.h = 12;
            this.spriteW = 16;
            this.spriteH = 16;
            this.dir = 'down';
            this.frame = 0;
            this.frameTimer = 0;

            this.speed       = (type === 'goblin') ? 0.6 : 0.5;
            this.maxHp       = (type === 'goblin') ? 3   : 6;
            this.hp          = this.maxHp;
            this.damage      = (type === 'goblin') ? 1   : 2;   // half-hearts
            this.attackRange = (type === 'goblin') ? 20  : 24;
            this.aggroRange  = 80; // pixels -- start chasing player

            this.state       = 'idle';   // idle, patrol, chase, attack, hurt, dead
            this.stateTimer  = 0;
            this.patrolDir   = Utils.choice(['left', 'right', 'up', 'down']);
            this.patrolTimer = 60;

            this.attacking      = false;
            this.attackTimer    = 0;
            this.attackCooldown = 0;
            this.invincible     = 0;
            this.knockback      = null;
            this.flash          = 0;
            this.dead           = false;
            this.deathTimer     = 0;

            // Item drop set on death
            this._dropItem = null;

            // Hitstop: freezes entity for impact feel
            this.hitstop = 0;

            // Stagger: consecutive hits stun the enemy
            this.staggerCount = 0;
            this.staggerTimer = 0;
            this.staggered = false;
        }

        /**
         * @returns {boolean} true when the enemy should be removed from the list
         */
        update(room, player) {
            // Death animation
            if (this.dead) {
                this.deathTimer--;
                return this.deathTimer <= 0; // remove when done
            }

            // Hitstop: freeze for impact feel
            if (this.hitstop > 0) {
                this.hitstop--;
                return false;
            }

            // Stagger: stunned from consecutive hits
            if (this.staggered) {
                this.staggerTimer--;
                if (this.staggerTimer <= 0) {
                    this.staggered = false;
                    this.staggerCount = 0;
                }
                // Flash while staggered
                this.flash = 2;
                return false;
            }

            // Decay stagger count over time
            if (this.staggerCount > 0 && !this.staggered) {
                this.staggerTimer--;
                if (this.staggerTimer <= 0) {
                    this.staggerCount = 0;
                }
            }

            // Knockback (collision-aware)
            if (this.knockback) {
                var kbx = this.x + this.knockback.vx;
                var kby = this.y + this.knockback.vy;
                if (!this.collidesWithMap(room, kbx, kby)) {
                    this.x = kbx;
                    this.y = kby;
                } else if (!this.collidesWithMap(room, kbx, this.y)) {
                    this.x = kbx;
                } else if (!this.collidesWithMap(room, this.x, kby)) {
                    this.y = kby;
                }
                this.knockback.timer--;
                if (this.knockback.timer <= 0) this.knockback = null;
                this.clampToRoom();
                return false;
            }

            // Tick timers
            if (this.invincible > 0)     this.invincible--;
            if (this.attackCooldown > 0) this.attackCooldown--;
            if (this.flash > 0)          this.flash--;

            // Attack animation lock
            if (this.attacking) {
                this.attackTimer--;
                if (this.attackTimer <= 0) {
                    this.attacking = false;
                    this.attackCooldown = 45;
                }
                return false;
            }

            var distToPlayer = Utils.dist(this, player);

            // ----- AI state machine -----
            if (distToPlayer < this.aggroRange) {
                this.state = 'chase';
            } else if (this.state === 'chase') {
                this.state = 'patrol';
                this.patrolTimer = 60 + Utils.randInt(0, 60);
            }

            if (this.state === 'chase') {
                // Move toward player
                var angle = Math.atan2(player.y - this.y, player.x - this.x);
                var dx = Math.cos(angle) * this.speed;
                var dy = Math.sin(angle) * this.speed;

                this.dir = this.angleToDir(angle);

                var newX = this.x + dx;
                var newY = this.y + dy;
                if (!this.collidesWithMap(room, newX, this.y)) this.x = newX;
                if (!this.collidesWithMap(room, this.x, newY)) this.y = newY;

                // Attack if in range - with telegraph warning
                if (distToPlayer < this.attackRange && this.attackCooldown <= 0) {
                    if (!this._telegraphing) {
                        // Start telegraph: flash for 8 frames before attacking
                        this._telegraphing = true;
                        this._telegraphTimer = 8;
                        this.flash = 8;
                    } else {
                        this._telegraphTimer--;
                        if (this._telegraphTimer <= 0) {
                            this.attacking = true;
                            this.attackTimer = 20;
                            this._telegraphing = false;
                        }
                    }
                } else {
                    this._telegraphing = false;
                }
            } else {
                // Patrol: walk in current direction, change periodically
                this.patrolTimer--;
                if (this.patrolTimer <= 0) {
                    this.patrolDir = Utils.choice(['left', 'right', 'up', 'down']);
                    this.patrolTimer = 60 + Utils.randInt(0, 90);
                }

                var pdx = 0, pdy = 0;
                if (this.patrolDir === 'left')  pdx = -1;
                if (this.patrolDir === 'right') pdx = 1;
                if (this.patrolDir === 'up')    pdy = -1;
                if (this.patrolDir === 'down')  pdy = 1;

                this.dir = this.patrolDir;
                var nx = this.x + pdx * this.speed * 0.4;
                var ny = this.y + pdy * this.speed * 0.4;
                if (!this.collidesWithMap(room, nx, this.y)) this.x = nx;
                if (!this.collidesWithMap(room, this.x, ny)) this.y = ny;
            }

            // Animation
            this.frameTimer++;
            if (this.frameTimer >= 12) {
                this.frame = 1 - this.frame;
                this.frameTimer = 0;
            }

            // Clamp to room
            this.clampToRoom();

            return false;
        }

        /* ----- helpers ---------------------------------------------- */
        angleToDir(angle) {
            var deg = angle * 180 / Math.PI;
            if (deg > -45 && deg <= 45)   return 'right';
            if (deg > 45 && deg <= 135)   return 'down';
            if (deg > -135 && deg <= -45) return 'up';
            return 'left';
        }

        takeDamage(amount, fromX, fromY) {
            if (this.invincible > 0 || this.dead) return;
            this.hp -= amount;
            this.invincible = 20;
            this.flash = 6;

            // Hitstop: both attacker and target freeze for 3 frames
            this.hitstop = 3;

            // Stagger system: 3 rapid hits = stunned
            this.staggerCount++;
            this.staggerTimer = 45; // window for consecutive hits
            if (this.staggerCount >= 3) {
                this.staggered = true;
                this.staggerTimer = 40; // stun duration
                Particles.burst(this.x + this.w / 2, this.y - 4, 6, C.yellow);
                Audio.play('stagger');
            }

            var angle = Math.atan2(this.y - fromY, this.x - fromX);
            this.knockback = {
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                timer: 5
            };

            Audio.play('hit');
            Particles.blood(this.x + this.w / 2, this.y + this.h / 2);

            if (this.hp <= 0) {
                this.die();
            }
        }

        die() {
            this.dead = true;
            this.deathTimer = 30;
            Audio.play('death');
            Particles.burst(this.x + this.w / 2, this.y + this.h / 2, 12, C.green);

            // 30% chance to drop a health pickup
            if (Math.random() < 0.3) {
                this._dropItem = { type: 'heart_drop', x: this.x, y: this.y };
            }
        }

        /** Return the melee attack hitbox while attacking, or null */
        getAttackHitbox() {
            if (!this.attacking) return null;
            var hx = this.x, hy = this.y;
            switch (this.dir) {
                case 'down':  hy += this.h;  break;
                case 'up':    hy -= 14;      break;
                case 'left':  hx -= 14;      break;
                case 'right': hx += this.w;  break;
            }
            return { x: hx, y: hy, w: 14, h: 14 };
        }

        collidesWithMap(room, px, py) {
            var points = [
                { x: px + 1,          y: py + 1 },
                { x: px + this.w - 2, y: py + 1 },
                { x: px + 1,          y: py + this.h - 2 },
                { x: px + this.w - 2, y: py + this.h - 2 }
            ];
            for (var i = 0; i < points.length; i++) {
                if (Maps.isSolidAt(room, points[i].x, points[i].y)) return true;
            }
            return false;
        }

        clampToRoom() {
            this.x = Utils.clamp(this.x, 0, W - this.w);
            this.y = Utils.clamp(this.y, 0, H - this.h);
        }

        /* ----- rendering -------------------------------------------- */
        render(ctx) {
            if (this.dead) {
                // Fade out death animation
                ctx.globalAlpha = this.deathTimer / 30;
            }

            if (this.invincible > 0 && Math.floor(this.invincible / 2) % 2 === 0) {
                if (!this.dead) { ctx.globalAlpha = 1; return; }
            }

            var spriteKey = this.type + '_';
            if (this.attacking) {
                spriteKey += 'atk';
            } else {
                spriteKey += this.frame;
            }

            var sx = this.x + this.w / 2 - this.spriteW / 2;
            var sy = this.y + this.h - this.spriteH;

            if (this.flash > 0) {
                ctx.fillStyle = C.white;
                ctx.fillRect(Math.floor(sx), Math.floor(sy), this.spriteW, this.spriteH);
            }

            var flip = (this.dir === 'left');
            Sprites.draw(ctx, spriteKey, Math.floor(sx), Math.floor(sy), flip);

            ctx.globalAlpha = 1;
        }
    }

    /* ===================================================================
     *  NPC
     * =================================================================*/
    class NPC {
        constructor(data) {
            this.id         = data.id;
            this.sprite     = data.sprite;
            this.x          = data.x * TILE;
            this.y          = data.y * TILE;
            this.w          = 12;
            this.h          = 14;
            this.dialogueId = data.dialogue;
            this.interacted = false;
            this._idleTimer = Math.random() * 100; // offset so NPCs don't all bob in sync
        }

        /** Check if player can interact (close enough and pressed Z) */
        canInteract(player) {
            var d = Utils.dist(this, player);
            return d < 28 && Input.pressed['z'];
        }

        interact() {
            // Use return-visit dialogue if already interacted
            if (this.interacted) {
                var returnId = this.dialogueId.replace('_greeting', '_return')
                    .replace('_market_greeting', '_return');
                if (returnId !== this.dialogueId && window.DialogueData && window.DialogueData[returnId]) {
                    Dialogue.start(returnId);
                } else {
                    Dialogue.start(this.dialogueId);
                }
            } else {
                Dialogue.start(this.dialogueId);
                this.interacted = true;
            }
            Audio.play('select');
        }

        update() {
            this._idleTimer++;
        }

        render(ctx) {
            // Gentle idle bob animation
            var bob = Math.sin(this._idleTimer * 0.06) * 1.5;
            Sprites.draw(ctx, this.sprite, Math.floor(this.x - 2), Math.floor(this.y - 10 + bob));

            // Exclamation mark indicator if NPC hasn't been talked to yet
            if (!this.interacted) {
                var indicatorBob = Math.sin(this._idleTimer * 0.12) * 2;
                ctx.fillStyle = C.yellow;
                // Small "!" mark
                ctx.fillRect(Math.floor(this.x + 4), Math.floor(this.y - 18 + indicatorBob), 2, 4);
                ctx.fillRect(Math.floor(this.x + 4), Math.floor(this.y - 13 + indicatorBob), 2, 1);
            }
        }
    }

    /* ===================================================================
     *  Boss  --  Queen Bargnot
     * =================================================================*/
    class Boss {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.w = 24;
            this.h = 24;
            this.spriteW = 32;
            this.spriteH = 32;
            this.speed = 0.7;
            this.dir = 'down';

            this.maxHp  = 40;
            this.hp     = this.maxHp;
            this.phase  = 1;    // 1, 2, or 3
            this.damage = 2;    // half-hearts per hit

            this.state      = 'idle';  // idle, chase, attack, summon, charge, hurt
            this.stateTimer = 0;
            this.frame      = 0;
            this.frameTimer = 0;

            this.attacking      = false;
            this.attackTimer    = 0;
            this.attackCooldown = 0;

            this.invincible = 0;
            this.knockback  = null;
            this.flash      = 0;
            this.dead       = false;

            this.projectiles          = []; // boss projectiles
            this.actionQueue          = []; // sequence of actions
            this.phaseTransition      = false;
            this.phaseTransitionTimer = 0;
            this._chargeWindup        = 0; // set per-charge for telegraph timing
            this._summonedPhase2      = false; // track if we already summoned minions
        }

        /* ----- main update ------------------------------------------ */
        update(room, player) {
            if (this.dead) return;

            // Phase transition animation
            if (this.phaseTransition) {
                this.phaseTransitionTimer--;
                this.flash = 2;
                if (this.phaseTransitionTimer <= 0) {
                    this.phaseTransition = false;
                }
                return;
            }

            // Knockback
            if (this.knockback) {
                this.x += this.knockback.vx;
                this.y += this.knockback.vy;
                this.knockback.timer--;
                if (this.knockback.timer <= 0) this.knockback = null;
                this.clamp();
                return;
            }

            // Tick timers
            if (this.invincible > 0)     this.invincible--;
            if (this.attackCooldown > 0) this.attackCooldown--;
            if (this.flash > 0)          this.flash--;

            // Phase transitions based on HP thresholds
            if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
                this.enterPhase(2);
                return;
            }
            if (this.phase === 2 && this.hp <= this.maxHp * 0.25) {
                this.enterPhase(3);
                return;
            }

            // Choose next action when timer runs out
            this.stateTimer--;
            if (this.stateTimer <= 0) {
                this.chooseAction(player);
            }

            this.executeState(room, player);

            // Update projectiles
            this.projectiles = this.projectiles.filter(function (p) {
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                return p.life > 0 && p.x > -16 && p.x < W + 16 && p.y > -16 && p.y < H + 16;
            });

            // Animation
            this.frameTimer++;
            if (this.frameTimer >= 15) {
                this.frame = 1 - this.frame;
                this.frameTimer = 0;
            }
        }

        /* ----- phase management ------------------------------------- */
        enterPhase(phase) {
            this.phase = phase;
            this.phaseTransition = true;
            this.phaseTransitionTimer = 90; // 1.5 s transition
            this.invincible = 90;
            this.speed += 0.2;
            this.damage = (phase === 3) ? 3 : 2;

            if (phase === 2) {
                Dialogue.start('boss_phase2');
                // Signal game.js to spawn minions
                this._requestMinions = true;
            } else if (phase === 3) {
                Dialogue.start('boss_phase3');
            }

            Audio.play('explosion');
            Particles.burst(
                this.x + this.w / 2, this.y + this.h / 2, 20,
                (phase === 3) ? C.purple : C.red
            );
        }

        /* ----- AI --------------------------------------------------- */
        chooseAction(player) {
            var dist = Utils.dist(this, player);
            var actions;

            if (this.phase === 1) {
                actions = ['chase', 'chase', 'shoot'];
                this.stateTimer = 60 + Utils.randInt(0, 30);
            } else if (this.phase === 2) {
                actions = ['chase', 'charge', 'shoot', 'shoot'];
                this.stateTimer = 45 + Utils.randInt(0, 20);
            } else {
                actions = ['charge', 'shoot', 'shoot', 'barrage'];
                this.stateTimer = 35 + Utils.randInt(0, 15);
            }

            this.state = Utils.choice(actions);

            // Set charge telegraph timing
            if (this.state === 'charge') {
                this._chargeWindup = this.stateTimer - 18; // 18 frames of wind-up
            }

            // If close to player, prefer melee
            if (dist < 30 && this.attackCooldown <= 0) {
                this.state = 'attack';
                this.stateTimer = 25;
            }
        }

        executeState(room, player) {
            var angle = Math.atan2(player.y - this.y, player.x - this.x);

            switch (this.state) {
                case 'chase':
                    this.x += Math.cos(angle) * this.speed;
                    this.y += Math.sin(angle) * this.speed;
                    this.dir = this.angleToDir(angle);
                    break;

                case 'charge':
                    // Telegraph: first 20 frames of charge are wind-up
                    if (this.stateTimer > this._chargeWindup) {
                        // Wind-up: boss pauses, particles gather inward
                        this.flash = 2;
                        if (this.stateTimer % 4 === 0) {
                            var gatherAngle = Math.random() * Math.PI * 2;
                            var gatherDist = 20 + Math.random() * 15;
                            Particles.add(
                                this.x + this.w / 2 + Math.cos(gatherAngle) * gatherDist,
                                this.y + this.h / 2 + Math.sin(gatherAngle) * gatherDist,
                                {
                                    vx: -Math.cos(gatherAngle) * 1.5,
                                    vy: -Math.sin(gatherAngle) * 1.5,
                                    life: 12,
                                    color: (this.phase === 3) ? C.purple : C.red,
                                    size: 2,
                                    gravity: 0
                                }
                            );
                        }
                    } else {
                        // Actual charge: fast dash
                        this.x += Math.cos(angle) * this.speed * 3;
                        this.y += Math.sin(angle) * this.speed * 3;
                        this.dir = this.angleToDir(angle);
                        if (this.stateTimer % 3 === 0) {
                            Particles.burst(
                                this.x + this.w / 2, this.y + this.h / 2, 2,
                                (this.phase === 3) ? C.purple : C.red
                            );
                        }
                    }
                    break;

                case 'shoot':
                    // Fire projectile at player at specific timer values
                    if (this.stateTimer === 30 || this.stateTimer === 15) {
                        this.fireProjectile(angle);
                    }
                    this.dir = this.angleToDir(angle);
                    break;

                case 'barrage':
                    // Phase 3: fire in multiple directions
                    if (this.stateTimer % 8 === 0) {
                        for (var i = 0; i < 4; i++) {
                            this.fireProjectile(angle + (i * Math.PI / 6) - Math.PI / 4);
                        }
                    }
                    break;

                case 'attack':
                    // Melee attack
                    if (!this.attacking && this.attackCooldown <= 0) {
                        this.attacking = true;
                        this.attackTimer = 20;
                        this.attackCooldown = 40;
                        Audio.play('bosshit');
                    }
                    if (this.attacking) {
                        this.attackTimer--;
                        if (this.attackTimer <= 0) this.attacking = false;
                    }
                    break;
            }

            this.clamp();
        }

        /* ----- projectile helper ------------------------------------ */
        fireProjectile(angle) {
            this.projectiles.push({
                x:      this.x + this.w / 2,
                y:      this.y + this.h / 2,
                vx:     Math.cos(angle) * 1.5,
                vy:     Math.sin(angle) * 1.5,
                life:   120,
                damage: (this.phase === 3) ? 2 : 1,
                color:  (this.phase === 3) ? C.purple : C.red,
                w:      6,
                h:      6
            });
            Audio.play('sword');
        }

        angleToDir(angle) {
            var deg = angle * 180 / Math.PI;
            if (deg > -45 && deg <= 45)   return 'right';
            if (deg > 45 && deg <= 135)   return 'down';
            if (deg > -135 && deg <= -45) return 'up';
            return 'left';
        }

        /** Return the melee attack hitbox while attacking, or null */
        getAttackHitbox() {
            if (!this.attacking) return null;
            // Larger melee hitbox for boss
            return {
                x: this.x - 8,
                y: this.y - 8,
                w: this.w + 16,
                h: this.h + 16
            };
        }

        /* ----- damage ----------------------------------------------- */
        takeDamage(amount, fromX, fromY) {
            if (this.invincible > 0 || this.dead || this.phaseTransition) return;
            this.hp -= amount;
            this.invincible = 15;
            this.flash = 4;

            var angle = Math.atan2(this.y - fromY, this.x - fromX);
            this.knockback = {
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                timer: 5
            };

            Audio.play('bosshit');
            Particles.burst(
                this.x + this.w / 2, this.y + this.h / 2, 6,
                (this.phase === 3) ? C.purple : C.red
            );

            if (this.hp <= 0) {
                this.hp = 0;
                this.dead = true;
                Audio.play('explosion');
                Particles.burst(this.x + this.w / 2, this.y + this.h / 2, 30, C.gold);
                // boss_defeat dialogue is triggered by game.js with proper callback chain
            }
        }

        clamp() {
            this.x = Utils.clamp(this.x, 16, W - this.w - 16);
            this.y = Utils.clamp(this.y, 16, H - this.h - 16);
        }

        /* ----- rendering -------------------------------------------- */
        render(ctx) {
            // Invincibility flash (skip frame)
            if (this.invincible > 0 && Math.floor(this.invincible / 2) % 2 === 0 && !this.phaseTransition) return;

            // Phase aura effect
            if (this.phase >= 2) {
                var auraColor = (this.phase === 3) ? C.darkPurple : C.darkRed;
                ctx.fillStyle = auraColor;
                ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.1;
                ctx.fillRect(
                    Math.floor(this.x - 4 + this.w / 2 - this.spriteW / 2),
                    Math.floor(this.y - 4 + this.h - this.spriteH),
                    this.spriteW + 8, this.spriteH + 8
                );
                ctx.globalAlpha = 1;
            }

            // Phase 3: ambient shadow particles
            if (this.phase === 3 && Math.random() < 0.3) {
                Particles.sparkle(
                    this.x + Utils.randInt(-8, this.w + 8),
                    this.y + Utils.randInt(-8, this.h + 8),
                    C.purple
                );
            }

            // Choose sprite
            var spriteKey;
            if (this.attacking) {
                spriteKey = 'bargnot_atk';
            } else if (this.phase === 3) {
                spriteKey = 'bargnot_shadow';
            } else if (this.phase === 2) {
                spriteKey = 'bargnot_rage';
            } else {
                spriteKey = 'bargnot_' + this.frame;
            }

            var sx = this.x + this.w / 2 - this.spriteW / 2;
            var sy = this.y + this.h - this.spriteH;

            if (this.flash > 0) {
                ctx.fillStyle = C.white;
                ctx.fillRect(Math.floor(sx), Math.floor(sy), this.spriteW, this.spriteH);
            }

            Sprites.draw(ctx, spriteKey, Math.floor(sx), Math.floor(sy));

            // Boss HP bar
            this.renderHPBar(ctx);

            // Render projectiles with spinning and trailing
            for (var i = 0; i < this.projectiles.length; i++) {
                var p = this.projectiles[i];
                var px = Math.floor(p.x);
                var py = Math.floor(p.y);
                var spin = (120 - p.life) * 0.3; // rotation angle

                // Trailing particle
                if (p.life % 3 === 0) {
                    Particles.add(px, py, {
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        life: 8,
                        color: p.color,
                        size: 1,
                        gravity: 0
                    });
                }

                // Outer glow
                ctx.globalAlpha = 0.2;
                ctx.fillStyle = p.color;
                ctx.fillRect(px - p.w / 2 - 2, py - p.h / 2 - 2, p.w + 4, p.h + 4);
                ctx.globalAlpha = 1;

                // Spinning diamond shape
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(spin);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                // Bright center
                ctx.fillStyle = C.white;
                ctx.globalAlpha = 0.6;
                ctx.fillRect(-1, -1, 2, 2);
                ctx.globalAlpha = 1;
                ctx.restore();
            }
        }

        renderHPBar(ctx) {
            var barW = 80;
            var barH = 4;
            var barX = W / 2 - barW / 2;
            var barY = 4;

            // Background
            ctx.fillStyle = C.black;
            ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

            // Empty bar
            ctx.fillStyle = C.darkRed;
            ctx.fillRect(barX, barY, barW, barH);

            // Filled bar
            var fillW = (this.hp / this.maxHp) * barW;
            var barColor = (this.phase === 3) ? C.purple : (this.phase === 2) ? C.red : C.lightRed;
            ctx.fillStyle = barColor;
            ctx.fillRect(barX, barY, fillW, barH);

            // Label
            Utils.drawText(ctx, 'QUEEN BARGNOT', barX, barY - 8, C.gold, 1);
        }
    }

    /* ===================================================================
     *  HeartDrop  --  collectible health pickup dropped by enemies
     * =================================================================*/
    class HeartDrop {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.w = 10;
            this.h = 10;
            this.life = 300;     // despawn after 5 seconds (at 60 fps)
            this.bobTimer = 0;
        }

        /** @returns {boolean} true when the drop should be removed */
        update() {
            this.life--;
            this.bobTimer++;
            return this.life <= 0;
        }

        render(ctx) {
            // Blink when about to despawn
            if (this.life < 60 && Math.floor(this.life / 4) % 2 === 0) return;

            var bob = Math.sin(this.bobTimer / 10) * 2;
            Sprites.draw(ctx, 'item_heart', Math.floor(this.x - 3), Math.floor(this.y - 3 + bob));
        }
    }

    /* ===================================================================
     *  Projectile  --  generic projectile (used for Luigi special, etc.)
     * =================================================================*/
    class Projectile {
        constructor(x, y, vx, vy, opts) {
            this.x  = x;
            this.y  = y;
            this.vx = vx;
            this.vy = vy;
            this.w  = (opts && opts.w) || 6;
            this.h  = (opts && opts.h) || 6;
            this.life   = (opts && opts.life)   || 90;
            this.damage = (opts && opts.damage) || 2;
            this.color  = (opts && opts.color)  || C.teal;
            this.homing = (opts && opts.homing) || false;
            this.speed  = (opts && opts.speed)  || 2;
            this.friendly = true; // damages enemies, not the player
        }

        /**
         * @param {Array} enemies  current enemy list (used for homing)
         * @returns {boolean} true when the projectile should be removed
         */
        update(enemies) {
            // Homing: steer toward nearest enemy
            if (this.homing && enemies && enemies.length > 0) {
                var closest = null;
                var closestDist = Infinity;
                for (var i = 0; i < enemies.length; i++) {
                    if (enemies[i].dead) continue;
                    var d = Utils.dist(this, enemies[i]);
                    if (d < closestDist) {
                        closestDist = d;
                        closest = enemies[i];
                    }
                }
                if (closest) {
                    var desired = Math.atan2(closest.y - this.y, closest.x - this.x);
                    var current = Math.atan2(this.vy, this.vx);
                    // Gradually steer (max turn rate ~6 degrees/frame)
                    var diff = desired - current;
                    // Normalize to [-PI, PI]
                    while (diff > Math.PI)  diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    var turnRate = 0.1;
                    current += diff * turnRate;
                    this.vx = Math.cos(current) * this.speed;
                    this.vy = Math.sin(current) * this.speed;
                }
            }

            this.x += this.vx;
            this.y += this.vy;
            this.life--;

            return this.life <= 0 || this.x < -16 || this.x > W + 16 || this.y < -16 || this.y > H + 16;
        }

        render(ctx) {
            ctx.fillStyle = this.color;
            ctx.fillRect(Math.floor(this.x - this.w / 2), Math.floor(this.y - this.h / 2), this.w, this.h);

            // Glow
            ctx.globalAlpha = 0.3;
            ctx.fillRect(
                Math.floor(this.x - this.w / 2 - 1),
                Math.floor(this.y - this.h / 2 - 1),
                this.w + 2, this.h + 2
            );
            ctx.globalAlpha = 1;
        }
    }

    /* ===================================================================
     *  Combat Resolution  --  called from the main game loop each frame
     * =================================================================*/
    function resolveCombat(player, enemies, boss, projectiles) {
        var i, enemy, atkBox, enemyBox, playerBox, bossBox, bossAtk, projBox, pBox, p;

        // Per-frame hit guard: only allow one damage source to hit the player per frame
        var playerHitThisFrame = false;

        // Determine player attack damage
        var atkDmg = (player.characterId === 'daxon') ? 3 : 2;

        // --- Player melee attacks hitting enemies ---
        if (player.attacking && player.attackHitbox && !player.attackDealt) {
            for (i = 0; i < enemies.length; i++) {
                enemy = enemies[i];
                if (enemy.dead) continue;
                enemyBox = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
                if (Utils.aabb(player.attackHitbox, enemyBox)) {
                    enemy.takeDamage(atkDmg, player.x + player.w / 2, player.y + player.h / 2);
                    player.attackDealt = true;
                    player.hitstop = 3; // Attacker also freezes for juicy impact
                }
            }

            // Player melee attacks hitting boss
            if (boss && !boss.dead) {
                bossBox = { x: boss.x, y: boss.y, w: boss.w, h: boss.h };
                if (Utils.aabb(player.attackHitbox, bossBox)) {
                    boss.takeDamage(atkDmg, player.x + player.w / 2, player.y + player.h / 2);
                    player.attackDealt = true;
                    player.hitstop = 3;
                }
            }
        }

        // --- Friendly projectiles hitting enemies / boss ---
        if (projectiles) {
            for (i = projectiles.length - 1; i >= 0; i--) {
                p = projectiles[i];
                if (!p.friendly) continue;
                projBox = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };

                for (var j = 0; j < enemies.length; j++) {
                    enemy = enemies[j];
                    if (enemy.dead) continue;
                    enemyBox = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
                    if (Utils.aabb(projBox, enemyBox)) {
                        enemy.takeDamage(p.damage, p.x, p.y);
                        p.life = 0; // destroy projectile
                        break;
                    }
                }

                if (boss && !boss.dead && p.life > 0) {
                    bossBox = { x: boss.x, y: boss.y, w: boss.w, h: boss.h };
                    if (Utils.aabb(projBox, bossBox)) {
                        boss.takeDamage(p.damage, p.x, p.y);
                        p.life = 0;
                    }
                }
            }
        }

        // --- Enemies attacking player (melee + contact) ---
        for (i = 0; i < enemies.length; i++) {
            if (playerHitThisFrame) break;
            enemy = enemies[i];
            if (enemy.dead) continue;

            // Melee attack hitbox (priority over contact)
            atkBox = enemy.getAttackHitbox();
            if (atkBox) {
                playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
                if (Utils.aabb(atkBox, playerBox)) {
                    player.takeDamage(enemy.damage, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
                    playerHitThisFrame = true;
                    continue;
                }
            }

            // Contact damage (only if melee didn't hit)
            enemyBox = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
            playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
            if (Utils.aabb(enemyBox, playerBox)) {
                player.takeDamage(enemy.damage, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
                playerHitThisFrame = true;
            }
        }

        // --- Boss attacks hitting player ---
        if (boss && !boss.dead && !playerHitThisFrame) {
            // Melee
            bossAtk = boss.getAttackHitbox();
            if (bossAtk && !playerHitThisFrame) {
                playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
                if (Utils.aabb(bossAtk, playerBox)) {
                    player.takeDamage(boss.damage, boss.x + boss.w / 2, boss.y + boss.h / 2);
                    playerHitThisFrame = true;
                }
            }

            // Contact damage (only if melee didn't hit)
            if (!playerHitThisFrame) {
                bossBox = { x: boss.x, y: boss.y, w: boss.w, h: boss.h };
                playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
                if (Utils.aabb(bossBox, playerBox)) {
                    player.takeDamage(boss.damage, boss.x + boss.w / 2, boss.y + boss.h / 2);
                    playerHitThisFrame = true;
                }
            }

            // Boss projectiles hitting player
            if (!playerHitThisFrame) {
                for (i = 0; i < boss.projectiles.length; i++) {
                    p = boss.projectiles[i];
                    projBox = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
                    pBox    = { x: player.x, y: player.y, w: player.w, h: player.h };
                    if (Utils.aabb(projBox, pBox)) {
                        player.takeDamage(p.damage, p.x, p.y);
                        p.life = 0; // destroy projectile on hit
                        playerHitThisFrame = true;
                        break;
                    }
                }
            }
        }
    }

    /* ===================================================================
     *  Export
     * =================================================================*/
    window.Entities = {
        Player:        Player,
        Enemy:         Enemy,
        NPC:           NPC,
        Boss:          Boss,
        HeartDrop:     HeartDrop,
        Projectile:    Projectile,
        resolveCombat: resolveCombat
    };

})();
