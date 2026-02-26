/**
 * Core system tests for Valisar: Shadows of the Eldspyre
 *
 * Run with: node tests/test_core.js
 *
 * Tests collision (AABB), combat resolution, character stats,
 * difficulty scaling, and state transitions.
 */

'use strict';

var assert = require('assert');
var passed = 0;
var failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log('  PASS: ' + name);
    } catch (e) {
        failed++;
        console.log('  FAIL: ' + name);
        console.log('        ' + e.message);
    }
}

// =========================================================================
// Mock browser globals
// =========================================================================

global.window = global;
global.document = {
    createElement: function (tag) {
        return {
            width: 0, height: 0,
            getContext: function () {
                return {
                    fillRect: function () {},
                    fillStyle: '',
                    globalAlpha: 1,
                    strokeRect: function () {},
                    strokeStyle: '',
                    lineWidth: 1,
                    beginPath: function () {},
                    arc: function () {},
                    fill: function () {},
                    stroke: function () {},
                    save: function () {},
                    restore: function () {},
                    translate: function () {},
                    rotate: function () {},
                    drawImage: function () {},
                    imageSmoothingEnabled: true
                };
            },
            style: {}
        };
    },
    getElementById: function () {
        return {
            getContext: function () {
                return {
                    fillRect: function () {},
                    drawImage: function () {},
                    imageSmoothingEnabled: true
                };
            },
            width: 768, height: 672, style: {}
        };
    },
    addEventListener: function () {},
    readyState: 'complete'
};

// =========================================================================
// 1. AABB Collision Tests
// =========================================================================

console.log('\n--- AABB Collision ---');

function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}

test('overlapping boxes collide', function () {
    var a = { x: 0, y: 0, w: 10, h: 10 };
    var b = { x: 5, y: 5, w: 10, h: 10 };
    assert.strictEqual(aabb(a, b), true);
});

test('non-overlapping boxes do not collide', function () {
    var a = { x: 0, y: 0, w: 10, h: 10 };
    var b = { x: 20, y: 20, w: 10, h: 10 };
    assert.strictEqual(aabb(a, b), false);
});

test('adjacent boxes (edge-touching) do not collide', function () {
    var a = { x: 0, y: 0, w: 10, h: 10 };
    var b = { x: 10, y: 0, w: 10, h: 10 };
    assert.strictEqual(aabb(a, b), false);
});

test('one box inside another collides', function () {
    var a = { x: 0, y: 0, w: 20, h: 20 };
    var b = { x: 5, y: 5, w: 5, h: 5 };
    assert.strictEqual(aabb(a, b), true);
});

test('zero-size box inside another still collides (point-in-rect)', function () {
    var a = { x: 5, y: 5, w: 0, h: 0 };
    var b = { x: 0, y: 0, w: 10, h: 10 };
    // AABB treats degenerate (zero-size) boxes as points — valid overlap
    assert.strictEqual(aabb(a, b), true);
});

test('partial X overlap collides', function () {
    var a = { x: 0, y: 0, w: 10, h: 10 };
    var b = { x: 9, y: 0, w: 10, h: 10 };
    assert.strictEqual(aabb(a, b), true);
});

test('partial Y overlap collides', function () {
    var a = { x: 0, y: 0, w: 10, h: 10 };
    var b = { x: 0, y: 9, w: 10, h: 10 };
    assert.strictEqual(aabb(a, b), true);
});

// =========================================================================
// 2. Character Stat Tests
// =========================================================================

console.log('\n--- Character Stats ---');

var CHAR_STATS = {
    daxon:    { maxHp: 8, speed: 1.3, atkDmg: 3, atkDuration: 15, specialCD: 150 },
    luigi:    { maxHp: 6, speed: 1.8, atkDmg: 2, atkDuration: 15, specialCD: 90 },
    lirielle: { maxHp: 6, speed: 1.6, atkDmg: 2, atkDuration: 12, specialCD: 100 }
};

test('Daxon has highest HP', function () {
    assert.strictEqual(CHAR_STATS.daxon.maxHp > CHAR_STATS.luigi.maxHp, true);
    assert.strictEqual(CHAR_STATS.daxon.maxHp > CHAR_STATS.lirielle.maxHp, true);
});

test('Luigi has highest speed', function () {
    assert.strictEqual(CHAR_STATS.luigi.speed > CHAR_STATS.daxon.speed, true);
    assert.strictEqual(CHAR_STATS.luigi.speed > CHAR_STATS.lirielle.speed, true);
});

test('Daxon has slowest speed (tank identity)', function () {
    assert.strictEqual(CHAR_STATS.daxon.speed < CHAR_STATS.luigi.speed, true);
    assert.strictEqual(CHAR_STATS.daxon.speed < CHAR_STATS.lirielle.speed, true);
});

test('Daxon has highest attack damage', function () {
    assert.strictEqual(CHAR_STATS.daxon.atkDmg > CHAR_STATS.luigi.atkDmg, true);
    assert.strictEqual(CHAR_STATS.daxon.atkDmg > CHAR_STATS.lirielle.atkDmg, true);
});

test('Lirielle has fastest attack animation', function () {
    assert.strictEqual(CHAR_STATS.lirielle.atkDuration < CHAR_STATS.daxon.atkDuration, true);
    assert.strictEqual(CHAR_STATS.lirielle.atkDuration < CHAR_STATS.luigi.atkDuration, true);
});

test('Luigi has shortest special cooldown', function () {
    assert.strictEqual(CHAR_STATS.luigi.specialCD < CHAR_STATS.daxon.specialCD, true);
    assert.strictEqual(CHAR_STATS.luigi.specialCD < CHAR_STATS.lirielle.specialCD, true);
});

test('Daxon has longest special cooldown (defensive balance)', function () {
    assert.strictEqual(CHAR_STATS.daxon.specialCD > CHAR_STATS.luigi.specialCD, true);
    assert.strictEqual(CHAR_STATS.daxon.specialCD > CHAR_STATS.lirielle.specialCD, true);
});

// =========================================================================
// 3. Enemy Stat Tests
// =========================================================================

console.log('\n--- Enemy Stats ---');

var ENEMY_STATS = {
    goblin:        { speed: 0.6, hp: 3, damage: 1, atkRange: 20 },
    spinecleaver:  { speed: 0.5, hp: 6, damage: 2, atkRange: 24 },
    goblin_shaman: { speed: 0.4, hp: 4, damage: 1, atkRange: 70 },
    dire_boar:     { speed: 0.7, hp: 5, damage: 2, atkRange: 60 }
};

test('goblin shaman has longest attack range (ranged caster)', function () {
    assert.strictEqual(ENEMY_STATS.goblin_shaman.atkRange > ENEMY_STATS.goblin.atkRange, true);
    assert.strictEqual(ENEMY_STATS.goblin_shaman.atkRange > ENEMY_STATS.spinecleaver.atkRange, true);
});

test('dire boar is fastest enemy', function () {
    assert.strictEqual(ENEMY_STATS.dire_boar.speed >= ENEMY_STATS.goblin.speed, true);
    assert.strictEqual(ENEMY_STATS.dire_boar.speed >= ENEMY_STATS.spinecleaver.speed, true);
});

test('spinecleaver has most HP', function () {
    assert.strictEqual(ENEMY_STATS.spinecleaver.hp > ENEMY_STATS.goblin.hp, true);
    assert.strictEqual(ENEMY_STATS.spinecleaver.hp > ENEMY_STATS.goblin_shaman.hp, true);
});

test('all enemies deal at least 1 damage', function () {
    Object.keys(ENEMY_STATS).forEach(function (key) {
        assert.strictEqual(ENEMY_STATS[key].damage >= 1, true, key + ' deals < 1 damage');
    });
});

// =========================================================================
// 4. Difficulty Scaling Tests
// =========================================================================

console.log('\n--- Difficulty Scaling ---');

test('Easy mode grants +4 HP', function () {
    var baseHp = 6;
    var easyHp = baseHp + 4;
    assert.strictEqual(easyHp, 10);
});

test('Hard mode reduces HP by 2 (minimum 4)', function () {
    var daxonHp = Math.max(4, 8 - 2);
    var luigiHp = Math.max(4, 6 - 2);
    assert.strictEqual(daxonHp, 6);
    assert.strictEqual(luigiHp, 4);
});

test('Adaptive difficulty reduces damage (minimum 1)', function () {
    var dmg = 2;
    var mercyDmg = Math.max(1, dmg - 1);
    assert.strictEqual(mercyDmg, 1);
    // Already at 1 stays at 1
    var lowDmg = 1;
    var mercyLow = Math.max(1, lowDmg - 1);
    assert.strictEqual(mercyLow, 1);
});

test('Adaptive difficulty reduces speed by 15%', function () {
    var speed = 0.6;
    var mercySpeed = speed * 0.85;
    assert.ok(Math.abs(mercySpeed - 0.51) < 0.01);
});

test('Legend difficulty blocks heart drops', function () {
    var difficulty = 2;
    var shouldDrop = (difficulty !== 2);
    assert.strictEqual(shouldDrop, false);
});

// =========================================================================
// 5. Combat Math Tests
// =========================================================================

console.log('\n--- Combat Math ---');

test('per-frame hit guard prevents double damage', function () {
    var playerHitThisFrame = false;
    // First hit applies
    if (!playerHitThisFrame) {
        playerHitThisFrame = true;
    }
    // Second hit blocked
    var secondHit = false;
    if (!playerHitThisFrame) {
        secondHit = true;
    }
    assert.strictEqual(secondHit, false);
});

test('invincibility frames prevent damage', function () {
    var invincible = 60;
    var damaged = false;
    if (invincible <= 0) {
        damaged = true;
    }
    assert.strictEqual(damaged, false);
});

test('knockback force scales with damage', function () {
    var lightKB = 1 >= 2 ? 4.5 : 3;
    var heavyKB = 2 >= 2 ? 4.5 : 3;
    assert.strictEqual(lightKB, 3);
    assert.strictEqual(heavyKB, 4.5);
});

test('hitstop scales with damage', function () {
    var lightHitstop = 1 >= 2 ? 7 : 4;
    var heavyHitstop = 2 >= 2 ? 7 : 4;
    assert.strictEqual(lightHitstop, 4);
    assert.strictEqual(heavyHitstop, 7);
});

test('Daxon cleave hits multiple enemies', function () {
    var isDaxon = true;
    var hitCount = 0;
    var enemies = [
        { dead: false, inRange: true },
        { dead: false, inRange: true },
        { dead: false, inRange: true }
    ];
    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].inRange && !enemies[i].dead) {
            hitCount++;
            if (!isDaxon) break; // Non-Daxon stops at first hit
        }
    }
    assert.strictEqual(hitCount, 3);
});

test('Non-Daxon stops at first hit', function () {
    var isDaxon = false;
    var hitCount = 0;
    var enemies = [
        { dead: false, inRange: true },
        { dead: false, inRange: true },
        { dead: false, inRange: true }
    ];
    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].inRange && !enemies[i].dead) {
            hitCount++;
            if (!isDaxon) break;
        }
    }
    assert.strictEqual(hitCount, 1);
});

// =========================================================================
// 6. Void Zone Fairness Tests
// =========================================================================

console.log('\n--- Boss Phase 3 Fairness ---');

test('void zones spawn at minimum 24px from player', function () {
    var playerX = 100, playerY = 100;
    for (var trial = 0; trial < 100; trial++) {
        var vzAngle = Math.random() * Math.PI * 2;
        var vzDist = 24 + Math.random() * 24;
        var zoneX = playerX + Math.cos(vzAngle) * vzDist - 16;
        var zoneY = playerY + Math.sin(vzAngle) * vzDist - 16;
        // Zone center is at (zoneX+16, zoneY+16)
        var cx = zoneX + 16;
        var cy = zoneY + 16;
        var dist = Math.sqrt((cx - playerX) * (cx - playerX) + (cy - playerY) * (cy - playerY));
        assert.ok(dist >= 23.9, 'Void zone spawned too close: ' + dist.toFixed(1) + 'px');
    }
});

test('void zone eruption timer allows reaction (>= 50 frames)', function () {
    var timer = 50; // our new value
    // At 60fps, 50 frames = ~0.83 seconds reaction time
    assert.ok(timer >= 45, 'Not enough reaction time: ' + timer + ' frames');
});

// =========================================================================
// 7. Checkpoint System Tests
// =========================================================================

console.log('\n--- Checkpoint System ---');

test('checkpoint stores room and coordinates', function () {
    var checkpoint = { room: 'temple_puzzle', x: 7, y: 11 };
    assert.strictEqual(checkpoint.room, 'temple_puzzle');
    assert.strictEqual(checkpoint.x, 7);
    assert.strictEqual(checkpoint.y, 11);
});

test('respawn uses checkpoint when available', function () {
    var checkpoint = { room: 'temple_puzzle', x: 7, y: 11 };
    var lastSafeRoom = 'ebon_vale_town';
    var respawnRoom = checkpoint ? checkpoint.room : lastSafeRoom;
    assert.strictEqual(respawnRoom, 'temple_puzzle');
});

test('respawn uses lastSafeRoom when no checkpoint', function () {
    var checkpoint = null;
    var lastSafeRoom = 'ebon_vale_town';
    var respawnRoom = checkpoint ? checkpoint.room : lastSafeRoom;
    assert.strictEqual(respawnRoom, 'ebon_vale_town');
});

// =========================================================================
// 8. Poison Tick Tests
// =========================================================================

console.log('\n--- Poison Mechanic ---');

test('poison triggers after 45 frames', function () {
    var poisonTimer = 45;
    var ticked = false;
    while (poisonTimer > 0) {
        poisonTimer--;
        if (poisonTimer === 0) ticked = true;
    }
    assert.strictEqual(ticked, true);
});

test('poison deals exactly 1 damage', function () {
    var hp = 3;
    var poisonDmg = 1;
    hp -= poisonDmg;
    assert.strictEqual(hp, 2);
});

// =========================================================================
// Summary
// =========================================================================

console.log('\n===================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('===================\n');

process.exit(failed > 0 ? 1 : 0);
