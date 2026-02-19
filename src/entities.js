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
            this.walkPhase = 0;    // 4-phase walk cycle: 0,1,2,3
            this.moving = false;
            this._idleTimer = 0;   // timer for idle breathing animation
            this._blinkTimer = Math.floor(Math.random() * 200);
            this._blinkFrame = 0;

            this.characterId = characterId; // 'daxon', 'luigi', 'lirielle'
            this.maxHp = (characterId === 'daxon') ? 8 : 6; // half-hearts
            this.hp = this.maxHp;
            this.attacking = false;
            this.attackTimer = 0;
            this.attackDuration = 15;   // frames
            this.attackCooldown = 0;
            this.attackHitbox = null;   // {x,y,w,h} active during attack
            this.attackDealt = false;   // prevent multi-hit per swing
            this.attackPhase = 0;       // 0=wind-up, 1=swing, 2=recovery

            this.specialCooldown = 0;
            this.specialMaxCooldown = 120; // 2 seconds at 60 fps

            this.invincible = 0;    // invincibility frames after taking damage
            this.knockback = null;  // {vx, vy, timer}
            this.flash = 0;         // white flash frames

            this.items = [];        // collected item IDs
            this.hasItem = function (id) { return this.items.indexOf(id) !== -1; };

            this._deathTimer = 0;       // death animation counter

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
                // Multi-frame attack phases: wind-up / swing / recovery
                if (this.attackTimer >= 11) {
                    this.attackPhase = 0;  // wind-up (frames 15-11)
                } else if (this.attackTimer >= 6) {
                    this.attackPhase = 1;  // swing/active (frames 10-6)
                } else {
                    this.attackPhase = 2;  // recovery (frames 5-0)
                }
                this.updateAttackHitbox();
                if (this.attackTimer <= 0) {
                    this.attacking = false;
                    this.attackHitbox = null;
                    this.attackDealt = false;
                    this.attackPhase = 0;
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
                this._idleTimer = 0;
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

                // Walk animation: 4-phase cycle (0->1->2->3) with 8-tick hold per phase
                // Sprite mapping: phase 0,2 = frame 0 (stride), phase 1,3 = frame 1 (upright)
                this.frameTimer++;
                if (this.frameTimer >= 8) {
                    this.walkPhase = (this.walkPhase + 1) % 4;
                    this.frame = (this.walkPhase % 2 === 0) ? 0 : 1;
                    this.frameTimer = 0;
                    // Play footstep sound at the start of each stride (phases 0 and 2)
                    if (this.walkPhase === 0 || this.walkPhase === 2) {
                        Audio.play('footstep');
                    }
                }
            } else {
                this.frame = 0;
                this.frameTimer = 0;
                this.walkPhase = 0;
                this._idleTimer++;
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
                // Shield: brief invincibility with barrier VFX
                this.invincible = 90; // 1.5 seconds
                this.flash = 6;
                // Blue barrier ring burst
                Particles.ring(this.x + this.w / 2, this.y + this.h / 2, 14, 12, C.lightBlue);
                Particles.sparkle(this.x + this.w / 2, this.y, C.lightBlue);
                Audio.play('pickup');
            } else if (this.characterId === 'luigi') {
                // Brog attack: a seeking projectile (created by the game layer)
                this._pendingProjectile = true;
                // Purple energy gather effect
                Particles.ring(this.x + this.w / 2, this.y + this.h / 2, 8, 8, C.purple);
                Audio.play('sword');
            } else if (this.characterId === 'lirielle') {
                // Heal 2 half-hearts with expanding green ring + leaf burst
                this.hp = Math.min(this.hp + 2, this.maxHp);
                // Expanding heal ring
                Particles.ring(this.x + this.w / 2, this.y + this.h / 2, 10, 10, C.paleGreen);
                // Leaf particles rising
                for (var i = 0; i < 6; i++) {
                    Particles.add(
                        this.x + this.w / 2 + (Math.random() * 12 - 6),
                        this.y + this.h / 2 + (Math.random() * 8 - 4), {
                        vx: (Math.random() - 0.5) * 0.4,
                        vy: -0.5 - Math.random() * 0.6,
                        life: 25 + Math.floor(Math.random() * 15),
                        color: Math.random() < 0.5 ? C.green : C.lightGreen,
                        size: 1, gravity: -0.015
                    });
                }
                Audio.play('heal');
            }
        }

        /* ----- damage / knockback ----------------------------------- */
        takeDamage(amount, fromX, fromY) {
            if (this.invincible > 0) return;
            this.hp -= amount;
            this.invincible = 60; // 1 second invincibility
            this.flash = 10;
            this.hitWhite = 3; // full white sprite overlay frames
            this.hurtSquash = 6; // visual recoil frames

            // Hitstop scales with damage: light = 4, heavy = 7
            this.hitstop = amount >= 2 ? 7 : 4;

            // Knockback away from damage source — stronger for bigger hits
            var kbForce = amount >= 2 ? 4.5 : 3;
            var angle = Math.atan2(this.y - fromY, this.x - fromX);
            this.knockback = {
                vx: Math.cos(angle) * kbForce,
                vy: Math.sin(angle) * kbForce,
                timer: 10
            };

            Audio.play('hurt');
            Particles.burst(this.x + this.w / 2, this.y + this.h / 2, 8, C.red);

            // Flag for game layer to spawn screen shake + floating number
            this._wasHurt = true;
            this._lastDamage = amount;

            if (this.hp <= 0) {
                this.hp = 0;
                this._deathTimer = 30;
                this._deathSlump = true;
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
            // Death slump animation
            if (this.hp <= 0) {
                this._deathTimer++;
                var slumpProgress = Math.min(this._deathTimer / 30, 1);
                var slumpRotation = slumpProgress * 0.5; // rotate up to 0.5 radians
                var slumpDrop = slumpProgress * 4; // shift down 4px
                var slumpAlpha = 1.0 - slumpProgress * 0.7; // reduce alpha from 1.0 to 0.3
                var spriteKey2 = this.characterId + '_down_0';
                var sx2 = this.x + this.w / 2 - this.spriteW / 2;
                var sy2 = this.y + this.h - this.spriteH + slumpDrop;
                ctx.save();
                ctx.globalAlpha = slumpAlpha;
                ctx.translate(Math.floor(sx2 + 8), Math.floor(sy2 + 12));
                ctx.rotate(slumpRotation);
                Sprites.draw(ctx, spriteKey2, -8, -12);
                ctx.restore();
                return;
            }

            // Invincibility flashing -- skip every other 3-frame group
            if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0) return;

            // Use 'right' sprites for left direction (flipped horizontally)
            var spriteDir = (this.dir === 'left') ? 'right' : this.dir;
            var spriteKey = this.characterId + '_' + spriteDir + '_';
            if (this.attacking) {
                if (this.attackPhase === 0) {
                    spriteKey += 'atk';    // wind-up pose
                } else if (this.attackPhase === 1) {
                    spriteKey += 'atk';    // swing (same sprite, different VFX)
                } else {
                    // Recovery frame: use 'atk2' if available, fallback to 'atk'
                    var recoveryKey = spriteKey + 'atk2';
                    if (window.Sprites.get(recoveryKey)) {
                        spriteKey += 'atk2';
                    } else {
                        spriteKey += 'atk';
                    }
                }
            } else {
                spriteKey += this.frame;
            }

            // Draw sprite centered on hitbox, bottom-aligned
            var sx = this.x + this.w / 2 - this.spriteW / 2;
            var sy = this.y + this.h - this.spriteH;

            // Idle breathing: 1px vertical shift on 90-frame cycle when not moving
            if (!this.moving && !this.attacking) {
                var breathCycle = this._idleTimer % 90;
                if (breathCycle >= 45) {
                    sy += 1;
                }
            }

            // Player blink: every ~250 frames idle, blink for 4 frames
            if (!this.moving && !this.attacking) {
                this._blinkTimer++;
                var blinkCycle = this._blinkTimer % 250;
                if (blinkCycle >= 0 && blinkCycle < 4) {
                    this._blinkFrame = 4 - blinkCycle;
                }
            }

            // Hurt squash: compress sprite 1px vertically during recoil
            var squashOffset = 0;
            if (this.hurtSquash && this.hurtSquash > 0) {
                squashOffset = 1;
                this.hurtSquash--;
            }

            var flip = (this.dir === 'left');
            var drawX = Math.floor(sx);
            var drawY = Math.floor(sy) + squashOffset;

            // Attack lunge: move 2px forward during attack frames
            if (this.attacking && this.attackTimer > 5) {
                switch (this.dir) {
                    case 'down':  drawY += 2; break;
                    case 'up':    drawY -= 2; break;
                    case 'left':  drawX -= 2; break;
                    case 'right': drawX += 2; break;
                }
            }

            // Draw the sprite
            Sprites.draw(ctx, spriteKey, drawX, drawY, flip);

            // Blink: draw 2x1 skin-color rect over eyes during blink frames
            if (this._blinkFrame > 0 && this.dir === 'down' && !this.attacking) {
                ctx.fillStyle = C.skin || '#d4a574';
                ctx.fillRect(drawX + 5, drawY + 6, 2, 1);
                ctx.fillRect(drawX + 9, drawY + 6, 2, 1);
            }

            // Hit white overlay: full white for 3 frames on taking damage
            if (this.hitWhite && this.hitWhite > 0) {
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(drawX, drawY, this.spriteW, this.spriteH);
                ctx.globalCompositeOperation = 'source-over';
                this.hitWhite--;
            } else if (this.flash > 0) {
                // Softer flash after white frames
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillRect(drawX, drawY, this.spriteW, this.spriteH);
            }

            // Daxon shield VFX: rotating barrier
            if (this.characterId === 'daxon' && this.invincible > 30 && this.specialCooldown > 0) {
                this.renderShieldVFX(ctx, drawX, drawY);
            }

            // Draw attack effect (slash arc)
            if (this.attacking && this.attackHitbox) {
                this.renderAttackEffect(ctx);
            }
        }

        renderAttackEffect(ctx) {
            var ah = this.attackHitbox;
            var progress = 1 - (this.attackTimer / this.attackDuration);
            var cx = this.x + this.w / 2;
            var cy = this.y + this.h / 2;
            var alpha = 0.7 * (1 - progress);

            if (this.characterId === 'luigi') {
                // Teal energy blast — expanding ring
                ctx.fillStyle = C.teal;
                ctx.globalAlpha = 0.6 * (1 - progress);
                ctx.fillRect(Math.floor(ah.x + 2), Math.floor(ah.y + 2), ah.w - 4, ah.h - 4);
                // Energy crackle particles
                if (progress < 0.3) {
                    Particles.trail(ah.x + ah.w / 2, ah.y + ah.h / 2, C.teal, 1);
                }
                ctx.globalAlpha = 1;
            } else if (this.characterId === 'lirielle') {
                // Green crescent slash with leaf particles
                ctx.globalAlpha = alpha;
                this._drawSlashArc(ctx, cx, cy, 14, C.lightGreen, progress);
                if (progress < 0.4 && Math.random() < 0.4) {
                    Particles.add(ah.x + Math.random() * ah.w, ah.y + Math.random() * ah.h, {
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: -0.5 - Math.random() * 0.3,
                        life: 12, color: C.green, size: 1, gravity: -0.01
                    });
                }
                ctx.globalAlpha = 1;
            } else {
                // Daxon: crisp white sword slash arc
                ctx.globalAlpha = alpha;
                this._drawSlashArc(ctx, cx, cy, 14, C.white, progress);
                // Spark particles on hit frame
                if (progress > 0.2 && progress < 0.5 && this.attackDealt) {
                    Particles.add(ah.x + ah.w / 2 + (Math.random() * 6 - 3), ah.y + ah.h / 2, {
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        life: 6, color: C.white, size: 1, gravity: 0
                    });
                }
                ctx.globalAlpha = 1;
            }
        }

        /** Draw a directional slash arc (quarter-circle of pixels) */
        _drawSlashArc(ctx, cx, cy, radius, color, progress) {
            ctx.fillStyle = color;
            var startAngle, sweepDir;
            switch (this.dir) {
                case 'down':  startAngle = -0.3; sweepDir = 1; cy += 10; break;
                case 'up':    startAngle = Math.PI - 0.3; sweepDir = 1; cy -= 14; break;
                case 'left':  startAngle = Math.PI / 2 - 0.3; sweepDir = 1; cx -= 12; break;
                case 'right': startAngle = -Math.PI / 2 - 0.3; sweepDir = 1; cx += 12; break;
                default:      startAngle = 0; sweepDir = 1;
            }
            // 3-frame arc: draw pixels along an arc path
            var arcLen = Math.PI * 0.6; // sweep ~108 degrees
            var steps = 8;
            var arcProgress = Math.min(progress * 2.5, 1); // arc completes in first 40% of attack
            var thickness = Math.max(1, Math.floor(2 * (1 - progress)));
            for (var i = 0; i < Math.floor(steps * arcProgress); i++) {
                var t = i / steps;
                var a = startAngle + t * arcLen * sweepDir;
                var r = radius - 2 + t * 4;
                var px = Math.round(cx + Math.cos(a) * r);
                var py = Math.round(cy + Math.sin(a) * r);
                ctx.fillRect(px, py, thickness, thickness);
            }
        }

        /** Render Daxon's shield special VFX — rotating hexagonal barrier */
        renderShieldVFX(ctx, sx, sy) {
            var cx = sx + this.spriteW / 2;
            var cy = sy + this.spriteH / 2;
            var r = 12 + Math.sin(this.invincible * 0.15) * 2;
            var rotation = this.invincible * 0.08;
            ctx.globalAlpha = 0.35 + Math.sin(this.invincible * 0.2) * 0.15;
            ctx.strokeStyle = C.lightBlue;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (var i = 0; i <= 6; i++) {
                var a = rotation + (i / 6) * Math.PI * 2;
                var px = cx + Math.cos(a) * r;
                var py = cy + Math.sin(a) * r;
                if (i === 0) ctx.moveTo(Math.round(px), Math.round(py));
                else ctx.lineTo(Math.round(px), Math.round(py));
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
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
            this.walkPhase = 0;    // 4-phase walk cycle: 0,1,2,3

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

            // Flanking: goblins approach from offset angles
            this._flankOffset = (Math.random() < 0.5) ? -Math.PI / 3 : Math.PI / 3;
            this._flankTimer = Utils.randInt(0, 60); // stagger initial assignments

            // Fear: flee briefly when an ally dies nearby
            this._fearTimer = 0;
            this._fearAngle = 0;

            // Spinecleaver shield-down vulnerability window
            this._shieldDown = 0;
        }

        /**
         * @param {Array} [allies] optional array of all enemies in the room (for group AI)
         * @returns {boolean} true when the enemy should be removed from the list
         */
        update(room, player, allies) {
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
                    // Spinecleaver: shield drops after attack, creating vulnerability
                    if (this.type === 'spinecleaver') {
                        this._shieldDown = 20;
                    }
                }
                return false;
            }

            // Tick shield-down timer for spinecleaver
            if (this._shieldDown > 0) this._shieldDown--;

            // --- Fear reaction: flee when a nearby ally dies ---
            if (this._fearTimer > 0) {
                this._fearTimer--;
                var fearDx = Math.cos(this._fearAngle) * this.speed * 1.5;
                var fearDy = Math.sin(this._fearAngle) * this.speed * 1.5;
                var fearX = this.x + fearDx;
                var fearY = this.y + fearDy;
                if (!this.collidesWithMap(room, fearX, this.y)) this.x = fearX;
                if (!this.collidesWithMap(room, this.x, fearY)) this.y = fearY;
                this.dir = this.angleToDir(this._fearAngle);
                this.clampToRoom();
                return false;
            }

            // Check for freshly dead allies nearby — triggers fear
            if (allies && this.type === 'goblin') {
                for (var ai = 0; ai < allies.length; ai++) {
                    var ally = allies[ai];
                    if (ally === this || !ally.dead) continue;
                    if (ally.deathTimer >= 28 && ally.deathTimer <= 30) {
                        // Ally just died (within first 2 frames of death anim)
                        var allyDist = Utils.dist(this, ally);
                        if (allyDist < 60) {
                            this._fearTimer = 30;
                            this._fearAngle = Math.atan2(this.y - ally.y, this.x - ally.x);
                            this.state = 'flee';
                            return false;
                        }
                    }
                }
            }

            // --- Flanking: reassign flank offset every 60 frames ---
            if (this.type === 'goblin') {
                this._flankTimer++;
                if (this._flankTimer >= 60) {
                    this._flankTimer = 0;
                    this._flankOffset = (Math.random() < 0.5) ? -Math.PI / 3 : Math.PI / 3;
                }
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
                // Move toward player (goblins apply flank offset when allies are nearby)
                var angle = Math.atan2(player.y - this.y, player.x - this.x);
                if (this.type === 'goblin' && allies && distToPlayer > this.attackRange) {
                    // Check if another goblin is chasing the same player within 30px on the same side
                    var shouldFlank = false;
                    for (var fi = 0; fi < allies.length; fi++) {
                        var other = allies[fi];
                        if (other === this || other.dead || other.state !== 'chase') continue;
                        if (other.type !== 'goblin') continue;
                        var otherDist = Utils.dist(other, player);
                        if (otherDist < this.aggroRange) {
                            // Another goblin is also chasing — apply flanking
                            shouldFlank = true;
                            break;
                        }
                    }
                    if (shouldFlank) {
                        angle += this._flankOffset;
                    }
                }
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

            // Animation: 4-phase walk cycle with 8-tick hold per phase
            this.frameTimer++;
            if (this.frameTimer >= 8) {
                this.walkPhase = (this.walkPhase + 1) % 4;
                this.frame = (this.walkPhase % 2 === 0) ? 0 : 1;
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

            // Spinecleaver shield: deflect from front when shield up, back-attack 2x when shield down
            if (this.type === 'spinecleaver' && fromX !== undefined && fromY !== undefined) {
                var attackAngle = Math.atan2(fromY - this.y, fromX - this.x);
                var facingAngle = this.dir === 'up' ? -Math.PI/2 : this.dir === 'down' ? Math.PI/2 : this.dir === 'left' ? Math.PI : 0;
                var angleDiff = Math.abs(attackAngle - facingAngle);
                if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                if (this._shieldDown <= 0) {
                    // Shield is UP: check if attack is from the front
                    if (angleDiff < Math.PI * 0.4) {
                        // Front attack: deflect — halve damage (minimum 1)
                        amount = Math.max(1, Math.floor(amount / 2));
                        // Play deflect sound (fallback to 'hit')
                        try { Audio.play('deflect'); } catch (e) { Audio.play('hit'); }
                    }
                } else {
                    // Shield is DOWN: back attacks deal 2x damage
                    if (angleDiff > Math.PI * 0.6) {
                        amount = Math.floor(amount * 2);  // back attack bonus
                    }
                }
            }

            this.hp -= amount;
            this.invincible = 20;
            this.flash = 8;
            this.hitWhite = 3; // full white sprite overlay
            this.hurtSquash = 6; // visual recoil: compress 1px vertically

            // Hitstop scales with damage: light = 4, heavy = 6, crit = 8
            this.hitstop = amount >= 3 ? 8 : (amount >= 2 ? 6 : 4);

            // Stagger system: 3 rapid hits = stunned
            this.staggerCount++;
            this.staggerTimer = 45; // window for consecutive hits
            if (this.staggerCount >= 3) {
                this.staggered = true;
                this.staggerTimer = 40; // stun duration
                Particles.burst(this.x + this.w / 2, this.y - 4, 8, C.yellow);
                Audio.play('stagger');
            }

            // Directional knockback — away from attacker, scales with damage
            var kbForce = amount >= 3 ? 7 : (amount >= 2 ? 6 : 5);
            var angle = Math.atan2(this.y - fromY, this.x - fromX);
            this.knockback = {
                vx: Math.cos(angle) * kbForce,
                vy: Math.sin(angle) * kbForce,
                timer: 6
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
                var deathProgress = 1 - (this.deathTimer / 30);
                ctx.globalAlpha = 1 - deathProgress;
                // Stagger and collapse
                if (this.deathTimer > 20) {
                    // Stagger: shake horizontally
                    var staggerX = Math.sin(this.deathTimer * 2) * 2;
                    ctx.save();
                    ctx.translate(staggerX, 0);
                } else if (this.deathTimer > 10) {
                    // Kneel: sink down
                    var kneelDrop = (1 - this.deathTimer / 20) * 4;
                    ctx.save();
                    ctx.translate(0, kneelDrop);
                } else {
                    // Fade: rotate and dissolve
                    ctx.save();
                    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
                    ctx.rotate(deathProgress * 0.3);
                    ctx.translate(-(this.x + this.w / 2), -(this.y + this.h / 2));
                }
                // Spawn dissolution particles
                if (this.deathTimer > 0 && this.deathTimer % 4 === 0) {
                    Particles.add(
                        this.x + Math.random() * this.w,
                        this.y + Math.random() * this.h, {
                        vx: (Math.random() - 0.5) * 0.8,
                        vy: -0.3 - Math.random() * 0.5,
                        life: 12 + Math.floor(Math.random() * 8),
                        color: this.type === 'spinecleaver' ? C.gray : C.green,
                        size: 1, gravity: -0.02
                    });
                }
            }

            if (this.invincible > 0 && Math.floor(this.invincible / 2) % 2 === 0) {
                if (!this.dead) { ctx.globalAlpha = 1; return; }
            }

            var spriteKey = this.type + '_';
            if (this.attacking) {
                if (this.attackTimer > 10) {
                    spriteKey += 'atk_1';  // wind-up
                } else if (this.attackTimer > 4) {
                    spriteKey += 'atk';    // swing
                } else {
                    spriteKey += 'atk_2';  // recovery (use frame 0 as fallback)
                }
            } else {
                spriteKey += this.frame;
            }

            // Fallback: if atk_1/atk_2 sprite doesn't exist, use atk
            if (this.attacking && !window.Sprites.get(spriteKey)) {
                spriteKey = this.type + '_atk';
            }

            var sx = this.x + this.w / 2 - this.spriteW / 2;
            var sy = this.y + this.h - this.spriteH;

            // Hurt squash: compress 1px vertically on hit
            var squashY = 0;
            if (this.hurtSquash && this.hurtSquash > 0) {
                squashY = 1;
                this.hurtSquash--;
            }

            // Telegraph hop: 1px up when winding up to attack
            var telegraphHop = 0;
            if (this._telegraphing && this._telegraphTimer > 2) {
                telegraphHop = -1;
            }

            var drawX = Math.floor(sx);
            var drawY = Math.floor(sy) + squashY + telegraphHop;
            var flip = (this.dir === 'left');

            Sprites.draw(ctx, spriteKey, drawX, drawY, flip);

            // Hit white overlay — full white for impact frames
            if (this.hitWhite && this.hitWhite > 0) {
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(drawX, drawY, this.spriteW, this.spriteH);
                ctx.globalCompositeOperation = 'source-over';
                this.hitWhite--;
            } else if (this.flash > 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.fillRect(drawX, drawY, this.spriteW, this.spriteH);
            }

            // --- Spinecleaver mini-boss: HP bar above sprite ---
            if (this.type === 'spinecleaver' && !this.dead) {
                var hpBarW = this.spriteW;  // 16px wide bar
                var hpBarH = 2;
                var hpBarX = drawX;
                var hpBarY = drawY - 4;
                // Background
                ctx.fillStyle = C.black;
                ctx.fillRect(hpBarX - 1, hpBarY - 1, hpBarW + 2, hpBarH + 2);
                // Empty
                ctx.fillStyle = C.darkRed;
                ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
                // Filled
                var hpFill = (this.hp / this.maxHp) * hpBarW;
                ctx.fillStyle = C.red;
                ctx.fillRect(hpBarX, hpBarY, hpFill, hpBarH);
            }

            // --- Spinecleaver: shield-down vulnerability indicator ---
            if (this.type === 'spinecleaver' && this._shieldDown > 0 && !this.dead) {
                // Flashing blue outline to indicate vulnerability window
                if (Math.floor(this._shieldDown / 3) % 2 === 0) {
                    ctx.strokeStyle = C.lightBlue;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(drawX, drawY, this.spriteW, this.spriteH);
                }
                // Small down-arrow indicator above the HP bar
                ctx.fillStyle = C.yellow;
                var indicatorX = drawX + this.spriteW / 2;
                var indicatorY = drawY - 8;
                ctx.fillRect(Math.floor(indicatorX - 1), Math.floor(indicatorY), 3, 2);
                ctx.fillRect(Math.floor(indicatorX), Math.floor(indicatorY + 2), 1, 1);
            }

            if (this.dead) {
                ctx.restore();
            }

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
            this._animTimer = 0;
            this._facing = null; // direction NPC faces toward player
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

        update(player) {
            this._idleTimer++;
            this._animTimer++;
            // Face player when within 24px
            if (player) {
                var dx = player.x - this.x;
                var dy = player.y - this.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 24) {
                    this._faceDir = dx > 0 ? 'right' : 'left';
                    this._facing = dx > 0 ? 'right' : 'left';
                } else {
                    this._faceDir = null;
                    this._facing = null;
                }
            }
        }

        render(ctx) {
            // Idle breathing: 1px vertical shift on a 60-frame cycle
            // First 30 frames: normal position (0px), next 30 frames: shifted down 1px
            var breathCycle = this._idleTimer % 60;
            var breathOffset = (breathCycle < 30) ? 0 : 1;

            // Unique NPC idle animations
            var uniqueOffsetX = 0;
            var uniqueOffsetY = 0;
            if (this.id === 'fawks') {
                // Wipes bar: every 120 frames, shift x by 1px for 8 frames
                if (this._animTimer % 120 < 8) uniqueOffsetX = 1;
            } else if (this.id === 'helena') {
                // Looking toward forest: bob y by -1px every 90 frames for 15 frames
                if (this._animTimer % 90 < 15) uniqueOffsetY = -1;
            } else if (this.id === 'braxon') {
                // Hammering: every 100 frames, shift y by -1 for 4 frames
                if (this._animTimer % 100 < 4) uniqueOffsetY = -1;
            } else if (this.id === 'soren') {
                // Tail sway: continuous gentle 1px x sway, period ~80 frames
                uniqueOffsetX = Math.round(Math.sin(this._animTimer * (Math.PI * 2 / 80)));
            } else if (this.id === 'svana') {
                // Pacing: every 150 frames, shift x by alternating +1/-1 for 20 frames
                var svanaPhase = this._animTimer % 150;
                if (svanaPhase < 20) {
                    uniqueOffsetX = (svanaPhase % 2 === 0) ? 1 : -1;
                }
            } else if (this.id === 'querubra') {
                // Branch sway: continuous slow 1px y bob on sin wave, period ~120 frames
                uniqueOffsetY = Math.round(Math.sin(this._animTimer * (Math.PI * 2 / 120)));
            }

            var flip = (this._facing === 'left') || (this._faceDir === 'right');
            Sprites.draw(ctx, this.sprite, Math.floor(this.x - 2) + uniqueOffsetX, Math.floor(this.y - 10) + breathOffset + uniqueOffsetY, flip);

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
            this._chargeWindup        = 0; // frames where boss telegraphs before dashing
            this._chargeExhaust       = 0; // frames where boss is tired after dashing
            this._summonedPhase2      = false; // track if we already summoned minions
        }

        /* ----- main update ------------------------------------------ */
        update(room, player) {
            if (this.dead) return;

            // Hitstop: freeze for impact feel
            if (this.hitstop && this.hitstop > 0) {
                this.hitstop--;
                return;
            }

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
                var alive = p.life > 0 && p.x > -16 && p.x < W + 16 && p.y > -16 && p.y < H + 16;
                // Burst particles when projectile expires or goes out of bounds
                if (!alive) {
                    Particles.burst(p.x, p.y, 4, p.color || C.purple);
                }
                return alive;
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
            this.speed += 0.15;
            this.damage = 2; // consistent damage across phases (difficulty is in speed/patterns)

            if (phase === 2) {
                Dialogue.start('boss_phase2');
                // Signal game.js to spawn minions
                this._requestMinions = true;
                // Pass 3D: Dynamic music — tempo +10 BPM, aggressive counter-melody
                if (window.Music) {
                    window.Music.adjustTempo(10);
                }
            } else if (phase === 3) {
                Dialogue.start('boss_phase3');
                // Pass 3D: Strip to bass + percussion for 4 bars, then full return
                if (window.Music) {
                    window.Music.soloTracks([0, 2]); // bass + percussion only
                    // After ~4 bars (~6.3s at boss BPM), restore all tracks fortissimo
                    setTimeout(function () {
                        if (window.Music) {
                            window.Music.unmuteAll();
                            window.Music.adjustTempo(15); // even faster
                        }
                    }, 6300);
                }
            }

            Audio.play('phase_boom'); // Pass 8C: dramatic low boom
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
                // Phase 1 "The Queen": measured, tactical. Pauses to monologue
                this._actionCount = (this._actionCount || 0) + 1;
                if (this._actionCount % 4 === 0) {
                    // Every 4th action: pause (exploitable opening teaches patience)
                    this.state = 'taunt';
                    this.stateTimer = 50;
                    return;
                }
                actions = ['chase', 'chase', 'shoot'];
                this.stateTimer = 60 + Utils.randInt(0, 30);
            } else if (this.phase === 2) {
                // Phase 2 "The Fury": aggressive, faster, adds charge
                actions = ['chase', 'chase', 'charge', 'shoot', 'shoot'];
                this.stateTimer = 45 + Utils.randInt(0, 20);
            } else {
                // Phase 3 "The Shadow": teleport-based, void zones, barrages
                actions = ['teleport', 'voidzone', 'barrage', 'barrage'];
                this.stateTimer = 40 + Utils.randInt(0, 20);
            }

            this.state = Utils.choice(actions);

            // Charge has a fixed 3-phase structure: wind-up → dash → exhaustion
            if (this.state === 'charge') {
                this.stateTimer = 58;    // total charge duration
                this._chargeWindup = 28; // dash when timer <= 28 (30 frames telegraph)
                this._chargeExhaust = 12; // exhaustion when timer <= 12 (recovery window)
            }

            // Teleport: move to a pillar position instantly
            if (this.state === 'teleport') {
                this.stateTimer = 30;
                var pillars = [
                    { x: 3 * TILE, y: 4 * TILE },
                    { x: 12 * TILE, y: 4 * TILE },
                    { x: 3 * TILE, y: 10 * TILE },
                    { x: 12 * TILE, y: 10 * TILE }
                ];
                var target = Utils.choice(pillars);
                // Vanish particles at old position
                Particles.burst(this.x + this.w / 2, this.y + this.h / 2, 10, C.purple);
                this.x = target.x;
                this.y = target.y;
                // Appear particles at new position
                Particles.burst(this.x + this.w / 2, this.y + this.h / 2, 10, C.purple);
                Audio.play('whoosh');
            }

            // Void zone: mark area then damage after delay
            if (this.state === 'voidzone') {
                this.stateTimer = 65;
                this._voidZones = [];
                // Mark 2 zones near the player
                for (var vz = 0; vz < 2; vz++) {
                    this._voidZones.push({
                        x: player.x + (Math.random() - 0.5) * 40,
                        y: player.y + (Math.random() - 0.5) * 40,
                        w: 32, h: 32,
                        timer: 40, // frames until eruption
                        erupted: false
                    });
                }
            }

            // If close to player and not phase 3, prefer melee
            if (dist < 30 && this.attackCooldown <= 0 && this.phase < 3) {
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

                case 'taunt':
                    // Phase 1: Bargnot pauses to monologue (exploitable opening)
                    this.dir = this.angleToDir(angle);
                    // Head bobble — subtle idle motion during taunt
                    if (this.stateTimer % 20 === 0) {
                        Particles.add(this.x + this.w / 2, this.y - 4, {
                            vx: 0, vy: -0.3, life: 20,
                            color: C.gold, size: 1, gravity: 0
                        });
                    }
                    break;

                case 'charge':
                    if (this.stateTimer > this._chargeWindup) {
                        // TELEGRAPH (30 frames): boss crouches, particles gather inward
                        this.flash = 2;
                        this.dir = this.angleToDir(angle);
                        // Lock charge direction at start of dash
                        if (this.stateTimer === this._chargeWindup + 1) {
                            this._chargeAngle = angle;
                        }
                        if (this.stateTimer % 3 === 0) {
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
                    } else if (this.stateTimer > this._chargeExhaust) {
                        // DASH (16 frames): fast charge at locked direction, 3x speed
                        var chargeAngle = this._chargeAngle || angle;
                        this.x += Math.cos(chargeAngle) * this.speed * 3;
                        this.y += Math.sin(chargeAngle) * this.speed * 3;
                        this.dir = this.angleToDir(chargeAngle);
                        // Trail particles
                        if (this.stateTimer % 2 === 0) {
                            Particles.burst(
                                this.x + this.w / 2, this.y + this.h / 2, 3,
                                (this.phase === 3) ? C.purple : C.red
                            );
                        }
                    } else {
                        // EXHAUSTION (12 frames): boss dizzy, head bobble, vulnerable DPS window
                        this.flash = (this.stateTimer % 4 < 2) ? 1 : 0;
                        // Dizzy stars
                        if (this.stateTimer % 6 === 0) {
                            Particles.add(
                                this.x + this.w / 2 + (Math.random() - 0.5) * 16,
                                this.y - 4, {
                                vx: (Math.random() - 0.5) * 0.5,
                                vy: -0.3, life: 15,
                                color: C.yellow, size: 1, gravity: 0
                            });
                        }
                    }
                    break;

                case 'shoot':
                    // Fire projectile at player — phase 2 fires a spread
                    if (this.phase === 2) {
                        if (this.stateTimer === 25 || this.stateTimer === 12) {
                            this.fireProjectile(angle - 0.15);
                            this.fireProjectile(angle + 0.15);
                        }
                    } else {
                        if (this.stateTimer === 30 || this.stateTimer === 15) {
                            this.fireProjectile(angle);
                        }
                    }
                    this.dir = this.angleToDir(angle);
                    break;

                case 'barrage':
                    // Phase 3: 3-orb fan spread, slower but larger
                    if (this.stateTimer % 15 === 0) {
                        for (var i = 0; i < 3; i++) {
                            this.fireProjectile(angle + (i * Math.PI / 5) - Math.PI / 5);
                        }
                    }
                    this.dir = this.angleToDir(angle);
                    break;

                case 'teleport':
                    // Phase 3: after teleporting, fire a quick shot
                    if (this.stateTimer === 15) {
                        this.fireProjectile(angle);
                    }
                    this.dir = this.angleToDir(angle);
                    break;

                case 'voidzone':
                    // Phase 3: mark areas then erupt
                    this.dir = this.angleToDir(angle);
                    if (this._voidZones) {
                        for (var vi = 0; vi < this._voidZones.length; vi++) {
                            var vz = this._voidZones[vi];
                            vz.timer--;
                            if (vz.timer <= 0 && !vz.erupted) {
                                vz.erupted = true;
                                // Eruption: check if player is in zone
                                var pBox = { x: player.x, y: player.y, w: player.w, h: player.h };
                                var vzBox = { x: vz.x, y: vz.y, w: vz.w, h: vz.h };
                                if (Utils.aabb(pBox, vzBox)) {
                                    player.takeDamage(2, vz.x + vz.w / 2, vz.y + vz.h / 2);
                                }
                                // Eruption VFX
                                Particles.burst(vz.x + vz.w / 2, vz.y + vz.h / 2, 15, C.darkPurple);
                                Audio.play('explosion');
                            }
                        }
                    }
                    break;

                case 'attack':
                    // Melee attack with 12-frame telegraph
                    if (!this.attacking && this.attackCooldown <= 0) {
                        this.attacking = true;
                        this.attackTimer = 24; // longer wind-up for readability
                        this.attackCooldown = 45;
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
            this.flash = 6;
            this.hitWhite = 3; // full white overlay
            this.hurtSquash = 4; // visual recoil
            this.hitstop = 5; // boss hits always feel weighty

            var angle = Math.atan2(this.y - fromY, this.x - fromX);
            this.knockback = {
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                timer: 4
            };

            Audio.play('bosshit');
            Particles.burst(
                this.x + this.w / 2, this.y + this.h / 2, 8,
                (this.phase === 3) ? C.purple : C.red
            );

            if (this.hp <= 0) {
                this.hp = 0;
                this.dead = true;
                Audio.play('explosion');
                Particles.burst(this.x + this.w / 2, this.y + this.h / 2, 30, C.gold);
                Particles.ring(this.x + this.w / 2, this.y + this.h / 2, 20, 16, C.white);
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

            // Render void zones (Phase 3) — pulsing dark circles
            if (this._voidZones) {
                for (var vi = 0; vi < this._voidZones.length; vi++) {
                    var vz = this._voidZones[vi];
                    if (!vz.erupted) {
                        var vzAlpha = 0.15 + Math.sin(vz.timer * 0.3) * 0.1;
                        // Pulsing warning zone
                        ctx.globalAlpha = vzAlpha;
                        ctx.fillStyle = C.darkPurple;
                        ctx.fillRect(Math.floor(vz.x), Math.floor(vz.y), vz.w, vz.h);
                        // Brighter border
                        ctx.globalAlpha = vzAlpha + 0.2;
                        ctx.strokeStyle = C.purple;
                        ctx.lineWidth = 1;
                        ctx.strokeRect(Math.floor(vz.x), Math.floor(vz.y), vz.w, vz.h);
                        ctx.globalAlpha = 1;
                    }
                }
            }

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

            // Phase 3: float 2px off ground with sine bob
            if (this.phase === 3) {
                sy -= 2 + Math.sin(Date.now() * 0.005) * 1.5;
            }

            // Hurt squash: compress 1px vertically
            if (this.hurtSquash && this.hurtSquash > 0) {
                sy += 1;
                this.hurtSquash--;
            }

            var drawX = Math.floor(sx);
            var drawY = Math.floor(sy);

            Sprites.draw(ctx, spriteKey, drawX, drawY);

            // Hit white overlay — full white for impact frames
            if (this.hitWhite && this.hitWhite > 0) {
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(drawX, drawY, this.spriteW, this.spriteH);
                ctx.globalCompositeOperation = 'source-over';
                this.hitWhite--;
            } else if (this.flash > 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.fillRect(drawX, drawY, this.spriteW, this.spriteH);
            }

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

                // Outer glow (larger + brighter purple halo for phase 3)
                if (this.phase === 3) {
                    ctx.globalAlpha = 0.15;
                    ctx.fillStyle = C.purple;
                    ctx.fillRect(px - p.w / 2 - 5, py - p.h / 2 - 5, p.w + 10, p.h + 10);
                }
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
     *  GoblinArcher  --  ranged enemy that shoots arrows
     * =================================================================*/
    class GoblinArcher {
        constructor(x, y) {
            this.type = 'goblin_archer';
            this.x = x * TILE;
            this.y = y * TILE;
            this.w = 12;
            this.h = 12;
            this.spriteW = 16;
            this.spriteH = 16;
            this.dir = 'down';
            this.frame = 0;
            this.frameTimer = 0;
            this.walkPhase = 0;    // 4-phase walk cycle: 0,1,2,3

            this.speed = 0.4;
            this.maxHp = 3;
            this.hp = this.maxHp;
            this.damage = 1;
            this.attackRange = 80;
            this.aggroRange = 100;
            this.minRange = 40; // back away if too close

            this.state = 'idle';
            this.stateTimer = 0;
            this.patrolDir = Utils.choice(['left', 'right', 'up', 'down']);
            this.patrolTimer = 60;

            this.attacking = false;
            this.attackTimer = 0;
            this.attackCooldown = 0;
            this.invincible = 0;
            this.knockback = null;
            this.flash = 0;
            this.dead = false;
            this.deathTimer = 0;
            this._dropItem = null;
            this.hitstop = 0;
            this.staggerCount = 0;
            this.staggerTimer = 0;
            this.staggered = false;

            // Arrow tracking
            this.arrows = [];
            this.shootCooldown = 0;
            this._telegraphing = false;
            this._telegraphTimer = 0;

            // Retreat/dodge when player gets too close
            this._retreatTimer = 0;

            // Panic burst at low HP
            this._panicFired = false;
            this._fleeing = false;
        }

        update(room, player) {
            if (this.dead) {
                this.deathTimer--;
                return this.deathTimer <= 0;
            }

            if (this.hitstop > 0) { this.hitstop--; return false; }

            if (this.staggered) {
                this.staggerTimer--;
                if (this.staggerTimer <= 0) { this.staggered = false; this.staggerCount = 0; }
                this.flash = 2;
                return false;
            }

            if (this.staggerCount > 0 && !this.staggered) {
                this.staggerTimer--;
                if (this.staggerTimer <= 0) this.staggerCount = 0;
            }

            if (this.knockback) {
                var kbx = this.x + this.knockback.vx;
                var kby = this.y + this.knockback.vy;
                if (!this.collidesWithMap(room, kbx, kby)) { this.x = kbx; this.y = kby; }
                else if (!this.collidesWithMap(room, kbx, this.y)) { this.x = kbx; }
                else if (!this.collidesWithMap(room, this.x, kby)) { this.y = kby; }
                this.knockback.timer--;
                if (this.knockback.timer <= 0) this.knockback = null;
                this.clampToRoom();
                return false;
            }

            if (this.invincible > 0) this.invincible--;
            if (this.attackCooldown > 0) this.attackCooldown--;
            if (this.shootCooldown > 0) this.shootCooldown--;
            if (this.flash > 0) this.flash--;
            if (this._retreatTimer > 0) this._retreatTimer--;

            // Update arrows
            for (var ai = this.arrows.length - 1; ai >= 0; ai--) {
                var ar = this.arrows[ai];
                ar.x += ar.vx;
                ar.y += ar.vy;
                ar.life--;
                if (ar.life <= 0 || ar.x < -16 || ar.x > W + 16 || ar.y < -16 || ar.y > H + 16) {
                    this.arrows.splice(ai, 1);
                }
            }

            var distToPlayer = Utils.dist(this, player);

            // --- Panic burst: at 1 HP, fire rapid 3-arrow burst then flee ---
            if (this.hp <= 1 && !this._panicFired && !this.dead) {
                this._panicFired = true;
                this._fleeing = true;
                // Fire 3 rapid arrows in a slight spread
                var panicAngle = Math.atan2(player.y - this.y, player.x - this.x);
                for (var pi = -1; pi <= 1; pi++) {
                    var psx = this.x + this.w / 2;
                    var psy = this.y + this.h / 2;
                    var spreadAngle = panicAngle + pi * 0.2;
                    this.arrows.push({
                        x: psx, y: psy,
                        vx: Math.cos(spreadAngle) * 2.5,
                        vy: Math.sin(spreadAngle) * 2.5,
                        life: 70,
                        damage: 1,
                        w: 4, h: 4
                    });
                }
                Audio.play('arrow');
                this.flash = 6;
            }

            // --- Fleeing mode (after panic burst) ---
            if (this._fleeing) {
                var fleeAngle = Math.atan2(this.y - player.y, this.x - player.x);
                this.dir = this.angleToDir(fleeAngle);
                var fleeDx = Math.cos(fleeAngle) * this.speed * 1.5;
                var fleeDy = Math.sin(fleeAngle) * this.speed * 1.5;
                var fleeX = this.x + fleeDx;
                var fleeY = this.y + fleeDy;
                if (!this.collidesWithMap(room, fleeX, this.y)) this.x = fleeX;
                if (!this.collidesWithMap(room, this.x, fleeY)) this.y = fleeY;
                // Animation
                this.frameTimer++;
                if (this.frameTimer >= 8) {
                    this.walkPhase = (this.walkPhase + 1) % 4;
                    this.frame = (this.walkPhase % 2 === 0) ? 0 : 1;
                    this.frameTimer = 0;
                }
                this.clampToRoom();
                return false;
            }

            // AI: stay at range, shoot arrows
            if (distToPlayer < this.aggroRange) {
                this.state = 'chase';
                var angle = Math.atan2(player.y - this.y, player.x - this.x);
                this.dir = this.angleToDir(angle);

                // --- Dodge/retreat when player gets within 48px ---
                if (distToPlayer < 48 && this._retreatTimer <= 0) {
                    this._retreatTimer = 20;
                    // Dodge backward + sideways
                    var dodgeAngle = angle + Math.PI + (Math.random() < 0.5 ? 0.5 : -0.5);
                    var dodgeDx = Math.cos(dodgeAngle) * this.speed * 2.5;
                    var dodgeDy = Math.sin(dodgeAngle) * this.speed * 2.5;
                    var dodgeX = this.x + dodgeDx;
                    var dodgeY = this.y + dodgeDy;
                    if (!this.collidesWithMap(room, dodgeX, this.y)) this.x = dodgeX;
                    if (!this.collidesWithMap(room, this.x, dodgeY)) this.y = dodgeY;
                    this.clampToRoom();
                    return false;
                }

                if (distToPlayer < this.minRange) {
                    // Back away
                    var dx = Math.cos(angle) * -this.speed;
                    var dy = Math.sin(angle) * -this.speed;
                    var newX = this.x + dx;
                    var newY = this.y + dy;
                    if (!this.collidesWithMap(room, newX, this.y)) this.x = newX;
                    if (!this.collidesWithMap(room, this.x, newY)) this.y = newY;
                } else if (distToPlayer > this.attackRange * 0.8) {
                    // Move closer to get in range
                    var dx2 = Math.cos(angle) * this.speed * 0.5;
                    var dy2 = Math.sin(angle) * this.speed * 0.5;
                    var nx = this.x + dx2;
                    var ny = this.y + dy2;
                    if (!this.collidesWithMap(room, nx, this.y)) this.x = nx;
                    if (!this.collidesWithMap(room, this.x, ny)) this.y = ny;
                } else {
                    // In sweet spot (between minRange and attackRange*0.8) — seek wall cover
                    var wsTileX = Math.floor(this.x / 16);
                    var wsTileY = Math.floor(this.y / 16);
                    var nearWall = false;
                    // Check adjacent tiles (left, right, up, down) for walls
                    if (Maps.isSolidAt(room, (wsTileX - 1) * 16 + 8, wsTileY * 16 + 8) ||
                        Maps.isSolidAt(room, (wsTileX + 1) * 16 + 8, wsTileY * 16 + 8) ||
                        Maps.isSolidAt(room, wsTileX * 16 + 8, (wsTileY - 1) * 16 + 8) ||
                        Maps.isSolidAt(room, wsTileX * 16 + 8, (wsTileY + 1) * 16 + 8)) {
                        nearWall = true; // good cover position, stay here
                    }
                    if (!nearWall) {
                        // Drift toward nearest wall tile within 3 tiles
                        var closestWallDx = 0, closestWallDy = 0, closestWallDist = Infinity;
                        for (var wsR = -3; wsR <= 3; wsR++) {
                            for (var wsC = -3; wsC <= 3; wsC++) {
                                if (wsR === 0 && wsC === 0) continue;
                                if (Maps.isSolidAt(room, (wsTileX + wsC) * 16 + 8, (wsTileY + wsR) * 16 + 8)) {
                                    var wDist = Math.abs(wsR) + Math.abs(wsC);
                                    if (wDist < closestWallDist) {
                                        closestWallDist = wDist;
                                        closestWallDx = wsC;
                                        closestWallDy = wsR;
                                    }
                                }
                            }
                        }
                        if (closestWallDist < Infinity) {
                            var wsLen = Math.sqrt(closestWallDx * closestWallDx + closestWallDy * closestWallDy) || 1;
                            var driftX = this.x + (closestWallDx / wsLen) * this.speed * 0.3;
                            var driftY = this.y + (closestWallDy / wsLen) * this.speed * 0.3;
                            if (!this.collidesWithMap(room, driftX, this.y)) this.x = driftX;
                            if (!this.collidesWithMap(room, this.x, driftY)) this.y = driftY;
                        }
                    }
                }

                // Prefer positions near walls for cover
                if (distToPlayer > this.minRange && distToPlayer < this.attackRange && this.shootCooldown > 30) {
                    var bestWallDx = 0, bestWallDy = 0;
                    var tileX = Math.floor(this.x / 16);
                    var tileY = Math.floor(this.y / 16);
                    for (var wd = -1; wd <= 1; wd++) {
                        for (var wdd = -1; wdd <= 1; wdd++) {
                            if (wd === 0 && wdd === 0) continue;
                            if (Maps.isSolidAt(room, (tileX + wd) * 16 + 8, (tileY + wdd) * 16 + 8)) {
                                bestWallDx += wd;
                                bestWallDy += wdd;
                            }
                        }
                    }
                    if (bestWallDx !== 0 || bestWallDy !== 0) {
                        var wLen = Math.sqrt(bestWallDx * bestWallDx + bestWallDy * bestWallDy) || 1;
                        var wallX = this.x + (bestWallDx / wLen) * this.speed * 0.3;
                        var wallY = this.y + (bestWallDy / wLen) * this.speed * 0.3;
                        if (!this.collidesWithMap(room, wallX, this.y)) this.x = wallX;
                        if (!this.collidesWithMap(room, this.x, wallY)) this.y = wallY;
                    }
                }

                // Shoot if in range and cooldown is ready
                if (distToPlayer < this.attackRange && this.shootCooldown <= 0) {
                    if (!this._telegraphing) {
                        this._telegraphing = true;
                        this._telegraphTimer = 12;
                        this.flash = 12;
                    } else {
                        this._telegraphTimer--;
                        if (this._telegraphTimer <= 0) {
                            this._telegraphing = false;
                            this.shootArrow(player);
                            this.shootCooldown = 90;
                        }
                    }
                } else {
                    this._telegraphing = false;
                }
            } else {
                this.state = 'patrol';
                this._telegraphing = false;
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
                var px = this.x + pdx * this.speed * 0.4;
                var py = this.y + pdy * this.speed * 0.4;
                if (!this.collidesWithMap(room, px, this.y)) this.x = px;
                if (!this.collidesWithMap(room, this.x, py)) this.y = py;
            }

            // Animation: 4-phase walk cycle with 8-tick hold per phase
            this.frameTimer++;
            if (this.frameTimer >= 8) {
                this.walkPhase = (this.walkPhase + 1) % 4;
                this.frame = (this.walkPhase % 2 === 0) ? 0 : 1;
                this.frameTimer = 0;
            }
            this.clampToRoom();
            return false;
        }

        shootArrow(player) {
            var sx = this.x + this.w / 2;
            var sy = this.y + this.h / 2;
            var angle = Math.atan2(player.y + 6 - sy, player.x + 5 - sx);
            var speed = 2;
            this.arrows.push({
                x: sx, y: sy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 90,
                damage: 1,
                w: 4, h: 4
            });
            Audio.play('arrow');
        }

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
            this.hitstop = 3;
            this.staggerCount++;
            this.staggerTimer = 45;
            if (this.staggerCount >= 3) {
                this.staggered = true;
                this.staggerTimer = 40;
                Particles.burst(this.x + this.w / 2, this.y - 4, 6, C.yellow);
                Audio.play('stagger');
            }
            var angle = Math.atan2(this.y - fromY, this.x - fromX);
            this.knockback = { vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, timer: 5 };
            Audio.play('hit');
            Particles.blood(this.x + this.w / 2, this.y + this.h / 2);
            if (this.hp <= 0) this.die();
        }

        die() {
            this.dead = true;
            this.deathTimer = 30;
            Audio.play('death');
            Particles.burst(this.x + this.w / 2, this.y + this.h / 2, 12, C.green);
            if (Math.random() < 0.3) {
                this._dropItem = { type: 'heart_drop', x: this.x, y: this.y };
            }
        }

        getAttackHitbox() { return null; } // ranged only

        collidesWithMap(room, px, py) {
            var points = [
                { x: px + 1, y: py + 1 },
                { x: px + this.w - 2, y: py + 1 },
                { x: px + 1, y: py + this.h - 2 },
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

        render(ctx) {
            if (this.dead) {
                ctx.globalAlpha = this.deathTimer / 30;
            }
            if (this.invincible > 0 && Math.floor(this.invincible / 2) % 2 === 0) {
                if (!this.dead) { ctx.globalAlpha = 1; return; }
            }

            // Use goblin sprite with tint for now (drawn as goblin with bow indicator)
            var spriteKey = 'goblin_' + this.frame;
            var sx = this.x + this.w / 2 - this.spriteW / 2;
            var sy = this.y + this.h - this.spriteH;

            // Telegraph hop: 1px up when winding up to shoot
            var telegraphHop = 0;
            if (this._telegraphing && this._telegraphTimer > 4) {
                telegraphHop = -1;
            }
            sy += telegraphHop;

            if (this.flash > 0) {
                ctx.fillStyle = C.white;
                ctx.fillRect(Math.floor(sx), Math.floor(sy), this.spriteW, this.spriteH);
            }

            var flip = (this.dir === 'left');
            Sprites.draw(ctx, spriteKey, Math.floor(sx), Math.floor(sy), flip);

            // Draw small bow indicator (brown line)
            ctx.fillStyle = C.brown;
            if (this.dir === 'right') {
                ctx.fillRect(Math.floor(sx + 14), Math.floor(sy + 5), 3, 6);
            } else if (this.dir === 'left') {
                ctx.fillRect(Math.floor(sx - 1), Math.floor(sy + 5), 3, 6);
            } else {
                ctx.fillRect(Math.floor(sx + 5), Math.floor(sy + (this.dir === 'down' ? 14 : -1)), 6, 3);
            }

            ctx.globalAlpha = 1;

            // Render arrows
            for (var i = 0; i < this.arrows.length; i++) {
                var ar = this.arrows[i];
                ctx.fillStyle = C.brown;
                ctx.fillRect(Math.floor(ar.x - 2), Math.floor(ar.y - 1), 4, 2);
                // Arrow tip
                ctx.fillStyle = C.lightGray;
                var tipX = ar.vx > 0 ? ar.x + 2 : ar.x - 3;
                ctx.fillRect(Math.floor(tipX), Math.floor(ar.y - 1), 1, 2);
            }
        }
    }

    /* ===================================================================
     *  Destructible  --  crates, barrels (Pass 7A)
     * =================================================================*/
    class Destructible {
        constructor(type, x, y) {
            this.type = type;           // 'crate' or 'barrel'
            this.x = x * TILE;         // convert tile coords to pixels
            this.y = y * TILE;
            this.w = 16;
            this.h = 16;
            this.hp = 2;
            this.dead = false;
            this.flash = 0;             // white flash frames on hit
        }

        update() {
            // Destructibles don't move (noop)
            if (this.flash > 0) this.flash--;
        }

        takeDamage(amount, fromX, fromY) {
            if (this.dead) return;
            this.hp -= amount;
            this.flash = 4;
            Audio.play('hit');

            if (this.hp <= 0) {
                this.dead = true;
                // Spawn wood particles (brown/tan colored burst, 6-8 particles)
                var cx = this.x + this.w / 2;
                var cy = this.y + this.h / 2;
                var numParticles = 6 + Math.floor(Math.random() * 3);
                for (var i = 0; i < numParticles; i++) {
                    Particles.add(cx, cy, {
                        vx: (Math.random() - 0.5) * 2.5,
                        vy: -1 - Math.random() * 1.5,
                        life: 20 + Math.floor(Math.random() * 15),
                        color: Math.random() < 0.5 ? C.brown : C.tan,
                        size: Math.random() < 0.3 ? 2 : 1,
                        gravity: 0.04
                    });
                }
                // 10% chance to spawn a heart drop
                if (Math.random() < 0.1 && window.Game && typeof window.Game.spawnHeartDrop === 'function') {
                    window.Game.spawnHeartDrop(this.x, this.y);
                }
            }
        }

        render(ctx) {
            if (this.dead) return;

            var drawX = Math.floor(this.x);
            var drawY = Math.floor(this.y);

            // White flash: skip normal sprite, draw white silhouette instead
            if (this.flash > 0) {
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.8;
                // Draw white rectangle matching the sprite footprint
                ctx.fillRect(drawX + 1, drawY + 1, this.w - 2, this.h - 2);
                ctx.globalAlpha = 1;
            } else {
                // Draw sprite normally
                Sprites.draw(ctx, this.type, drawX, drawY);
            }
        }
    }

    // Export Destructible globally (Pass 7A)
    window.Destructible = Destructible;

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
                    // Attacker hitstop matches target: heavier hits freeze longer
                    player.hitstop = atkDmg >= 3 ? 5 : 3;
                    // Screen shake scales with damage
                    player._hitShake = atkDmg >= 3 ? 3 : 2;
                }
            }

            // Player melee attacks hitting boss
            if (boss && !boss.dead) {
                bossBox = { x: boss.x, y: boss.y, w: boss.w, h: boss.h };
                if (Utils.aabb(player.attackHitbox, bossBox)) {
                    boss.takeDamage(atkDmg, player.x + player.w / 2, player.y + player.h / 2);
                    player.attackDealt = true;
                    player.hitstop = 5; // Boss hits always feel weighty
                    player._hitShake = 3;
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

        // --- Enemies attacking player (melee + contact + arrows) ---
        for (i = 0; i < enemies.length; i++) {
            if (playerHitThisFrame) break;
            enemy = enemies[i];
            if (enemy.dead) continue;

            // Goblin archer arrows
            if (enemy.arrows && enemy.arrows.length > 0 && !playerHitThisFrame) {
                for (var ai = enemy.arrows.length - 1; ai >= 0; ai--) {
                    var ar = enemy.arrows[ai];
                    var arrowBox = { x: ar.x - ar.w / 2, y: ar.y - ar.h / 2, w: ar.w, h: ar.h };
                    playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
                    if (Utils.aabb(arrowBox, playerBox)) {
                        player.takeDamage(ar.damage, ar.x, ar.y);
                        enemy.arrows.splice(ai, 1);
                        playerHitThisFrame = true;
                        break;
                    }
                }
            }

            if (playerHitThisFrame) break;

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
                        // Burst particles on projectile hit
                        Particles.burst(p.x, p.y, 6, p.color || C.purple);
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
        GoblinArcher:  GoblinArcher,
        NPC:           NPC,
        Boss:          Boss,
        HeartDrop:     HeartDrop,
        Projectile:    Projectile,
        Destructible:  Destructible,
        resolveCombat: resolveCombat
    };

})();
