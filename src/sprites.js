/**
 * Valisar: Shadows of the Eldspyre
 * Sprite System - Hand-crafted pixel art
 *
 * All sprites are procedurally drawn at init time onto offscreen canvases.
 * Characters have full directional sprites (down, up, right) with walk cycles
 * and attack poses. Left is auto-mirrored from right.
 *
 * Each character sprite is 16w x 24h.
 * Enemy sprites are 16x16.
 * Boss sprites are 32x32.
 * Tile sprites are 16x16.
 */
(function () {
  'use strict';

  var P = window.C;

  // === Helper functions ===

  /** Draw a pixel grid from row strings + palette */
  function dp(ctx, rows, pal, ox, oy) {
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) {
        var ch = rows[r][c];
        if (ch === '.' || !pal[ch]) continue;
        ctx.fillStyle = pal[ch];
        ctx.fillRect(ox + c, oy + r, 1, 1);
      }
    }
  }

  function rn(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

  /** Draw a filled circle */
  function circ(ctx, cx, cy, r, c) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Fill entire 16x16 tile */
  function fill(ctx, c) {
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 16, 16);
  }

  /** Scatter random 1px dots */
  function dots(ctx, col, n) {
    ctx.fillStyle = col;
    for (var i = 0; i < n; i++) ctx.fillRect(rn(0, 15), rn(0, 15), 1, 1);
  }

  window.Sprites = {
    cache: {},

    create: function (key, w, h, fn) {
      var c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      var ctx = c.getContext('2d');
      fn(ctx);
      this.cache[key] = c;
      return c;
    },

    get: function (key) { return this.cache[key]; },

    draw: function (ctx, key, x, y, flip) {
      var s = this.cache[key];
      if (!s) {
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(x, y, 16, 16);
        return;
      }
      if (flip) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(s, -x - s.width, y);
        ctx.restore();
      } else {
        ctx.drawImage(s, x, y);
      }
    },

    init: function () {
      var S = this;

      // =================================================================
      // CHARACTER SPRITES (16x24 each)
      // =================================================================
      // Each character has a rich palette and hand-tuned pixel art for:
      //   down_0, down_1 (walk), down_atk
      //   up_0, up_1, up_atk
      //   right_0, right_1, right_atk
      // Left versions are auto-flipped from right.

      function makeCharacter(name, pal) {
        // -- FACING DOWN (toward camera) --
        // Frame 0: standing
        var down0 = [
          '....hhhh....',  // row 0  - top of hair
          '...hhhhhh...',  // row 1  - hair sides
          '..hhhhhhHH..',  // row 2  - hair with shadow
          '..hhshksHH..',  // row 3  - face: skin, eyes (k)
          '..hhssssHH..',  // row 4  - face: cheeks
          '...ssmss....',  // row 5  - chin, mouth
          '...aaaaaa...',  // row 6  - shoulders
          '..aaAbbAaa..',  // row 7  - torso top, emblem(A)
          '..aabbbbaa..',  // row 8  - torso
          '..aabbbbaa..',  // row 9  - torso
          '...aBBBBa...',  // row 10 - belt(B)
          '...bbbbbb...',  // row 11 - waist
          '...dd..dd...',  // row 12 - legs
          '...dd..dd...',  // row 13 - legs
          '...dd..dd...',  // row 14 - legs
          '..ddd..ddd..',  // row 15 - shins
          '..ooo..ooo..',  // row 16 - boots
          '..ooo..ooo..'   // row 17 - boot soles
        ];

        // Frame 1: left foot forward
        var down1 = [
          '....hhhh....',
          '...hhhhhh...',
          '..hhhhhhHH..',
          '..hhshksHH..',
          '..hhssssHH..',
          '...ssmss....',
          '...aaaaaa...',
          '..aaAbbAaa..',
          '..aabbbbaa..',
          '..aabbbbaa..',
          '...aBBBBa...',
          '...bbbbbb...',
          '..dd....dd..',  // legs apart
          '..dd....dd..',
          '..dd....dd..',
          '..dd....dd..',
          '..ooo..ooo..',
          '.ooo....ooo.'
        ];

        // Attack: sword thrust down
        var downAtk = [
          '....hhhh....',
          '...hhhhhh...',
          '..hhhhhhHH..',
          '..hhshksHH..',
          '..hhssssHH..',
          '...ssmss....',
          '..aaaaaaww..',  // arm extended with weapon(w)
          '..aaAbbAww..',
          '..aabbbba...',
          '..aabbbba...',
          '...aBBBBa...',
          '...bbbbbb...',
          '...dd..dd...',
          '...dd..dd...',
          '...dd..dd...',
          '..ddd..ddd..',
          '..ooo..ooo..',
          '..ooo..ooo..'
        ];

        // -- FACING UP (away from camera) --
        var up0 = [
          '....hhhh....',
          '...hhhhhh...',
          '..hhhhhhhh..',
          '..hhhhhhhh..',
          '..hhhhhhHH..',
          '...hhhhhH...',
          '...aaaaaa...',
          '..aaAaaAaa..',
          '..aabbbbaa..',
          '..aabbbbaa..',
          '...aBBBBa...',
          '...bbbbbb...',
          '...dd..dd...',
          '...dd..dd...',
          '...dd..dd...',
          '..ddd..ddd..',
          '..ooo..ooo..',
          '..ooo..ooo..'
        ];

        var up1 = [
          '....hhhh....',
          '...hhhhhh...',
          '..hhhhhhhh..',
          '..hhhhhhhh..',
          '..hhhhhhHH..',
          '...hhhhhH...',
          '...aaaaaa...',
          '..aaAaaAaa..',
          '..aabbbbaa..',
          '..aabbbbaa..',
          '...aBBBBa...',
          '...bbbbbb...',
          '..dd....dd..',
          '..dd....dd..',
          '..dd....dd..',
          '..dd....dd..',
          '..ooo..ooo..',
          '.ooo....ooo.'
        ];

        var upAtk = [
          '....hhhh....',
          '...hhhhhh...',
          '..hhhhhhhh..',
          '..hhhhhhhh..',
          '..hhhhhhHH..',
          '...hhhhhH...',
          '..aaaaaaww..',
          '..aaAaaAww..',
          '..aabbbba...',
          '..aabbbba...',
          '...aBBBBa...',
          '...bbbbbb...',
          '...dd..dd...',
          '...dd..dd...',
          '...dd..dd...',
          '..ddd..ddd..',
          '..ooo..ooo..',
          '..ooo..ooo..'
        ];

        // -- FACING RIGHT (side view) --
        var right0 = [
          '.....hhhh...',
          '....hhhhhh..',
          '...hhhhhhhH.',
          '...hhhhkhsH.',  // eye(k) visible, skin(s)
          '...hhhssssH.',
          '....ssmss...',
          '...aaaaaa...',
          '..aaAbbbba..',
          '..aabbbbba..',
          '..aabbbbba..',
          '...aBBBba...',
          '....bbbbb...',
          '....dd.dd...',
          '....dd.dd...',
          '....dd.dd...',
          '...ddd.ddd..',
          '...ooo.ooo..',
          '...ooo.ooo..'
        ];

        var right1 = [
          '.....hhhh...',
          '....hhhhhh..',
          '...hhhhhhhH.',
          '...hhhhkhsH.',
          '...hhhssssH.',
          '....ssmss...',
          '...aaaaaa...',
          '..aaAbbbba..',
          '..aabbbbba..',
          '..aabbbbba..',
          '...aBBBba...',
          '....bbbbb...',
          '...dd..dd...',
          '...dd...dd..',
          '..dd....dd..',
          '..dd...ddd..',
          '..ooo..ooo..',
          '..ooo...ooo.'
        ];

        // Attack right: arm + weapon extended right
        var rightAtk = [
          '.....hhhh...',
          '....hhhhhh..',
          '...hhhhhhhH.',
          '...hhhhkhsH.',
          '...hhhssssH.',
          '....ssmss...',
          '...aaaaaawww',  // weapon extended right
          '..aaAbbb.www',
          '..aabbbba...',
          '..aabbbba...',
          '...aBBBba...',
          '....bbbbb...',
          '....dd.dd...',
          '....dd.dd...',
          '....dd.dd...',
          '...ddd.ddd..',
          '...ooo.ooo..',
          '...ooo.ooo..'
        ];

        // Build all frames
        var frames = {
          down_0: down0, down_1: down1, down_atk: downAtk,
          up_0: up0, up_1: up1, up_atk: upAtk,
          right_0: right0, right_1: right1, right_atk: rightAtk
        };

        for (var key in frames) {
          S.create(name + '_' + key, 16, 24, function (rows) {
            return function (ctx) { dp(ctx, rows, pal, 2, 3); };
          }(frames[key]));
        }
      }

      // --- DAXON: Blue knight, tan hair, gray armor ---
      makeCharacter('daxon', {
        h: P.tan,       // hair
        H: P.lightBrown, // hair shadow
        s: P.skin,       // skin
        k: P.darkGray,   // eyes
        m: P.darkSkin,   // mouth shadow
        a: P.gray,       // armor
        A: P.lightGray,  // armor accent/emblem
        b: P.blue,       // tunic
        B: P.darkBlue,   // belt
        d: P.darkGray,   // pants
        o: P.brown,      // boots
        w: P.lightGray   // weapon
      });

      // --- LUIGI: Purple warlock, black hair, teal accents ---
      makeCharacter('luigi', {
        h: P.black,
        H: P.darkGray,
        s: P.paleSkin,
        k: P.teal,       // glowing eyes
        m: P.darkSkin,
        a: P.darkPurple,
        A: P.teal,       // magical accents
        b: P.purple,
        B: P.darkPurple,
        d: P.darkGray,
        o: P.darkBrown,
        w: P.teal
      });

      // --- LIRIELLE: Green druid, silver hair, nature accents ---
      makeCharacter('lirielle', {
        h: P.lightGray,
        H: P.gray,
        s: P.paleSkin,
        k: P.darkGreen,  // green eyes
        m: P.darkSkin,
        a: P.green,
        A: P.lightGreen, // leaf accents
        b: P.brown,
        B: P.darkBrown,
        d: P.darkGray,
        o: P.darkBrown,
        w: P.lightBrown
      });

      // =================================================================
      // NPC SPRITES (16x24 each - detailed)
      // =================================================================

      function makeNPC(name, rows, pal) {
        S.create(name, 16, 24, function (ctx) { dp(ctx, rows, pal, 0, 0); });
      }

      // Fawks - Innkeeper: burly, apron, brown hair
      makeNPC('npc_fawks', [
        '............',
        '......hhhh..',
        '.....hhhhhh.',
        '....ssksskh.',
        '....ssssss..',
        '....ssmmss..',
        '...wwwwwwww.',
        '...wwoowwww.',
        '...wwwwwwww.',
        '...wwwwwww..',
        '...wwwwwww..',
        '....wwwww...',
        '....dd..dd..',
        '....dd..dd..',
        '....dd..dd..',
        '....dd..dd..',
        '....bb..bb..',
        '....bb..bb..'
      ], { h: P.brown, s: P.skin, k: P.darkGray, m: P.darkSkin, o: P.gold, w: P.white, d: P.darkGray, b: P.darkBrown });

      // Helena - Mayor: dignified, blue dress
      makeNPC('npc_helena', [
        '............',
        '....bbbbbb..',
        '...bbbbbbb..',
        '...bskskbb..',
        '...bssssb...',
        '...bssmsb...',
        '..uuuuuuuu..',
        '..uuuuuuuu..',
        '..uuUuuUuu..',
        '..uuuuuuuu..',
        '...uuuuuu...',
        '...uuuuuu...',
        '...uuuuuu...',
        '...uuuuuu...',
        '....uuuu....',
        '....uuuu....',
        '...dd..dd...',
        '...dd..dd...'
      ], { b: P.lightBrown, s: P.skin, k: P.darkGray, m: P.darkSkin, u: P.blue, U: P.lightBlue, d: P.darkBrown });

      // Elira Voss - Captain: armored, stern
      makeNPC('npc_elira', [
        '............',
        '....hhhhh...',
        '...hhhhhhhh.',
        '...skskh....',
        '...ssssh....',
        '...ssms.....',
        '..aauuuuaa..',
        '..aauuuuaa..',
        '..aauUuUaa..',
        '..aauuuuaa..',
        '...uuuuuu..',
        '...uuuuuu..',
        '...dd..dd...',
        '...dd..dd...',
        '...dd..dd...',
        '...dd..dd...',
        '...aa..aa...',
        '...aa..aa...'
      ], { h: P.brown, s: P.skin, k: P.darkGray, m: P.darkSkin, a: P.gray, u: P.blue, U: P.lightBlue, d: P.darkGray });

      // Brother Soren - Monk: robed, mysterious
      makeNPC('npc_soren', [
        '............',
        '....gggggg..',
        '...gggggggg.',
        '...gkgkgg...',
        '...ggsggg...',
        '...ggmggg...',
        '..rrbbbbbb..',
        '..rrbbbbbb..',
        '..rrbbBBbb..',
        '..rrbbbbbb..',
        '...bbbbbb...',
        '...bbbbbb...',
        '...bbbbbb...',
        '....bbbb....',
        '....dd.dd...',
        '....dd.dd...',
        '....bb.bb...',
        '....bb.bb...'
      ], { g: P.gray, k: P.darkYellow, s: P.skin, m: P.darkSkin, r: P.brown, b: P.brown, B: P.darkBrown, d: P.darkBrown });

      // Braxon - Merchant
      makeNPC('npc_braxon', [
        '............',
        '....bbbbbb..',
        '...bbbbbbbb.',
        '...ssksskb..',
        '...ssssss...',
        '...ssmmss...',
        '..llssssssll',
        '..llssssll..',
        '..llsSsSll..',
        '...ssssss...',
        '...ssssss...',
        '....ssss....',
        '...dd..dd...',
        '...dd..dd...',
        '...dd..dd...',
        '...dd..dd...',
        '...bb..bb...',
        '...bb..bb...'
      ], { b: P.brown, s: P.skin, S: P.gold, k: P.darkGray, m: P.darkSkin, l: P.lightBrown, d: P.darkGray });

      // Que'Rubra - Forest spirit/treant
      makeNPC('npc_querubra', [
        '..ggGgGggg..',
        '..gggggggg..',
        '.ggggggggg..',
        '.gGggGgggg..',
        '...bbbbbb...',
        '...bybbby...',
        '...bbbbbb...',
        '...bbmbbb...',
        '..bbbbbbb...',
        '..bbbBbbb...',
        '...bbbbbb...',
        '...bbbbbb...',
        '....bbbb....',
        '....bRRb....',
        '....bRRb....',
        '....bRRb....',
        '....bRRb....',
        '....bRRb....'
      ], { g: P.green, G: P.lightGreen, b: P.brown, B: P.darkBrown, y: P.gold, m: P.darkBrown, R: P.darkBrown });

      // Rorik - Blacksmith: stocky, red beard
      makeNPC('npc_rorik', [
        '............',
        '....aaaa....',
        '...aaaaaa...',
        '...sksk.a...',
        '...ssss.....',
        '...rrrr.....',
        '...rrrrrr...',
        '..aarrrrraa.',
        '..aaaAaAaa..',
        '..aaaaaaaa..',
        '...aaaaaa...',
        '...aaaaaa...',
        '...dd..dd...',
        '...dd..dd...',
        '...dd..dd...',
        '...dd..dd...',
        '..bbb..bbb..',
        '..bbb..bbb..'
      ], { a: P.gray, A: P.lightGray, s: P.skin, k: P.darkGray, r: P.red, d: P.darkGray, b: P.darkBrown });

      // Svana - Dwarven refugee woman, amber clothes, braided auburn hair
      makeNPC('npc_svana', [
        '............',
        '....hhhh....',
        '...hhhhhh...',
        '...hskhsk...',
        '...hssss.h..',
        '...hssss.h..',
        '....cccc....',
        '...cccccc...',
        '..aaccccaa..',
        '..aaccccaa..',
        '...cccccc...',
        '...cccccc...',
        '...dd..dd...',
        '...dd..dd...',
        '...dd..dd...',
        '...dd..dd...',
        '..bbb..bbb..',
        '..bbb..bbb..'
      ], { h: P.darkBrown, s: P.skin, k: P.darkGray, c: '#d0a060', a: P.gray, d: P.darkGray, b: P.brown });

      // NPC aliases
      S.cache['npc_elira_voss'] = S.cache['npc_elira'];
      S.cache['npc_brother_soren'] = S.cache['npc_soren'];
      S.cache['npc_mayor_helena'] = S.cache['npc_helena'];

      // =================================================================
      // ENEMY SPRITES (16x16 each)
      // =================================================================

      // --- Goblin ---
      var gPal = { g: P.green, G: P.darkGreen, r: P.red, R: P.darkRed, b: P.brown, B: P.darkBrown, k: P.black, w: P.white, y: P.gold };

      // Goblin facing down, frame 0
      S.create('goblin_0', 16, 16, function (ctx) {
        dp(ctx, [
          '....gGGg....',
          '...gGGGGg...',
          '...grrgrg...',  // red eyes
          '...gggGgg...',
          '..gbggggbg..',  // body, arms
          '..gbggggbg..',
          '...gggggg...',
          '...gBBBBg...',  // belt
          '....gg.gg...',
          '....gg.gg...',  // legs
          '...BBB.BBB..',  // boots
        ], gPal, 2, 2);
        // weapon: small club
        ctx.fillStyle = P.brown;
        ctx.fillRect(13, 3, 2, 7);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(13, 2, 2, 2);
      });

      // Goblin frame 1 (walking)
      S.create('goblin_1', 16, 16, function (ctx) {
        dp(ctx, [
          '....gGGg....',
          '...gGGGGg...',
          '...grrgrg...',
          '...gggGgg...',
          '..gbggggbg..',
          '..gbggggbg..',
          '...gggggg...',
          '...gBBBBg...',
          '...gg...gg..',
          '..gg....gg..',  // legs apart
          '..BBB..BBB..',
        ], gPal, 2, 2);
        ctx.fillStyle = P.brown;
        ctx.fillRect(13, 3, 2, 7);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(13, 2, 2, 2);
      });

      // Goblin attack
      S.create('goblin_atk', 16, 16, function (ctx) {
        dp(ctx, [
          '....gGGg....',
          '...gGGGGg...',
          '...grrgrg...',
          '...gggGgg...',
          '..gbggggbg..',
          '..gbggggbg..',
          '...gggggg...',
          '...gBBBBg...',
          '....gg.gg...',
          '....gg.gg...',
          '...BBB.BBB..',
        ], gPal, 2, 2);
        // weapon swung forward
        ctx.fillStyle = P.brown;
        ctx.fillRect(13, 0, 2, 10);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(12, 0, 3, 3);
      });

      // --- Spinecleaver (larger goblin with blade) ---
      var sPal = { g: P.darkGreen, G: P.black, r: P.red, b: P.darkBrown, w: P.white, k: P.darkGray, B: P.darkBrown };

      S.create('spinecleaver_0', 16, 16, function (ctx) {
        dp(ctx, [
          '....gGGg....',
          '...gGGGGg...',
          '..wgrrgrg...',  // white war paint
          '..wgggGggw..',
          '..kbggggbk..',  // armor trim(k)
          '..kbggggbk..',
          '...gggggg...',
          '...gBBBBg...',
          '....gg.gg...',
          '....gg.gg...',
          '...kkk.kkk..',
        ], sPal, 2, 2);
        // Large blade
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(14, 1, 2, 9);
        ctx.fillStyle = P.white;
        ctx.fillRect(15, 2, 1, 7);
      });

      S.create('spinecleaver_1', 16, 16, function (ctx) {
        dp(ctx, [
          '....gGGg....',
          '...gGGGGg...',
          '..wgrrgrg...',
          '..wgggGggw..',
          '..kbggggbk..',
          '..kbggggbk..',
          '...gggggg...',
          '...gBBBBg...',
          '...gg...gg..',
          '..gg....gg..',
          '..kkk..kkk..',
        ], sPal, 2, 2);
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(14, 1, 2, 9);
        ctx.fillStyle = P.white;
        ctx.fillRect(15, 2, 1, 7);
      });

      S.create('spinecleaver_atk', 16, 16, function (ctx) {
        dp(ctx, [
          '....gGGg....',
          '...gGGGGg...',
          '..wgrrgrg...',
          '..wgggGggw..',
          '..kbggggbk..',
          '..kbggggbk..',
          '...gggggg...',
          '...gBBBBg...',
          '....gg.gg...',
          '....gg.gg...',
          '...kkk.kkk..',
        ], sPal, 2, 2);
        // Blade swung overhead
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(13, 0, 3, 5);
        ctx.fillStyle = P.white;
        ctx.fillRect(14, 0, 1, 4);
        // Slash arc effect
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = P.white;
        ctx.fillRect(11, 0, 5, 2);
        ctx.globalAlpha = 1;
      });

      // Aliases for enemy types that use goblin/spinecleaver base
      S.cache['goblin_lackey_0'] = S.cache['goblin_0'];
      S.cache['goblin_lackey_1'] = S.cache['goblin_1'];
      S.cache['goblin_lackey_atk'] = S.cache['goblin_atk'];

      // =================================================================
      // BOSS SPRITES (32x32 - Queen Bargnot)
      // =================================================================

      var bPal = {
        g: P.darkGreen, G: P.black, r: P.red, R: P.darkRed,
        c: P.gray, i: P.lightGray, w: P.white, k: P.darkGray,
        y: P.gold, p: P.purple
      };

      var bossBody = [
        '........cccccccc........',
        '......cciicciicc........',
        '......cciicciicc........',
        '.....gggggggggggg......',
        '....gggggggggggggg.....',
        '....gGrrGggGrrGgg......',
        '....gggggggggggggg.....',
        '....ggggggwwgggggg.....',
        '...RRRRggggggggRRRR....',
        '...RRkRRRRRRRRRkRR.....',
        '...RRkRRRRRRRRRkRR.....',
        '...RRRRRRRRRRRRRkRR....',
        '....RRRRRRRRRRRRRR.....',
        '....RRRRRRRRRRRRRR.....',
        '....RRRRRRRRRRRR.......',
        '....gggg....gggg........',
        '....gggg....gggg........',
        '....kkkk....kkkk........'
      ];

      function makeBoss(name, fn) {
        S.create(name, 32, 32, function (ctx) {
          dp(ctx, bossBody, bPal, 4, 2);
          fn(ctx);
        });
      }

      // Idle frame 0
      makeBoss('bargnot_0', function (ctx) {
        // Scepter
        ctx.fillStyle = P.red;
        ctx.fillRect(26, 8, 2, 14);
        ctx.fillStyle = P.gold;
        ctx.fillRect(25, 6, 4, 3);
        ctx.fillStyle = P.red;
        ctx.fillRect(26, 6, 2, 1);
      });

      // Idle frame 1 (slight leg shift)
      makeBoss('bargnot_1', function (ctx) {
        ctx.fillStyle = P.red;
        ctx.fillRect(26, 8, 2, 14);
        ctx.fillStyle = P.gold;
        ctx.fillRect(25, 6, 4, 3);
        ctx.fillStyle = P.red;
        ctx.fillRect(26, 6, 2, 1);
        // Shifted legs
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(8, 28, 4, 4);
        ctx.fillRect(18, 28, 4, 4);
      });

      // Attack: scepter thrust
      makeBoss('bargnot_atk', function (ctx) {
        ctx.fillStyle = P.red;
        ctx.fillRect(26, 2, 2, 18);
        ctx.fillStyle = P.gold;
        ctx.fillRect(25, 0, 4, 3);
        // Attack flash
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = P.red;
        ctx.fillRect(23, 0, 8, 5);
        ctx.globalAlpha = 1;
      });

      // Rage phase (phase 2)
      makeBoss('bargnot_rage', function (ctx) {
        ctx.fillStyle = P.red;
        ctx.fillRect(26, 8, 2, 14);
        ctx.fillStyle = P.gold;
        ctx.fillRect(25, 6, 4, 3);
        // Rage particles
        for (var i = 0; i < 16; i++) {
          ctx.fillStyle = i % 2 ? P.red : P.gold;
          ctx.fillRect(rn(2, 29), rn(2, 29), 2, 2);
        }
      });

      // Shadow phase (phase 3)
      S.create('bargnot_shadow', 32, 32, function (ctx) {
        var sp = {
          g: P.darkPurple, G: P.black, r: P.purple, R: P.darkPurple,
          c: P.gray, i: P.lightGray, w: P.lightPurple, k: P.darkGray
        };
        dp(ctx, bossBody, sp, 4, 2);
        ctx.fillStyle = P.purple;
        ctx.fillRect(26, 8, 2, 14);
        // Shadow wisps
        for (var i = 0; i < 10; i++) {
          ctx.fillStyle = P.lightPurple;
          ctx.globalAlpha = 0.3 + Math.random() * 0.4;
          ctx.fillRect(rn(2, 29), rn(2, 29), 2, 3);
        }
        ctx.globalAlpha = 1;
      });

      // =================================================================
      // TILE SPRITES (16x16 each)
      // =================================================================

      function mt(n, fn) { S.create('tile_' + n, 16, 16, fn); }

      // --- Ground tiles ---
      mt('grass_light', function (ctx) {
        fill(ctx, P.lightGreen);
        dots(ctx, P.green, 12);
        // Subtle grass blades
        ctx.fillStyle = P.green;
        ctx.fillRect(3, 12, 1, 2);
        ctx.fillRect(8, 10, 1, 2);
        ctx.fillRect(13, 13, 1, 2);
      });

      mt('grass_dark', function (ctx) {
        fill(ctx, P.green);
        dots(ctx, P.darkGreen, 12);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(4, 11, 1, 2);
        ctx.fillRect(11, 12, 1, 2);
      });

      mt('path', function (ctx) {
        fill(ctx, P.tan);
        dots(ctx, P.lightBrown, 10);
        // Subtle footprint-like marks
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(5, 6, 2, 1);
        ctx.fillRect(9, 11, 2, 1);
      });

      mt('water', function (ctx) {
        fill(ctx, P.blue);
        dots(ctx, P.lightBlue, 8);
        // Wave highlights
        ctx.fillStyle = P.white;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(2, 4, 3, 1);
        ctx.fillRect(8, 10, 3, 1);
        ctx.fillRect(12, 2, 2, 1);
        ctx.globalAlpha = 1;
      });

      mt('water_1', function (ctx) {
        fill(ctx, P.blue);
        dots(ctx, P.lightBlue, 10);
        ctx.fillStyle = P.white;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(4, 7, 3, 1);
        ctx.fillRect(10, 3, 3, 1);
        ctx.fillRect(1, 12, 2, 1);
        ctx.globalAlpha = 1;
      });

      // --- Nature tiles (with improved visual clarity) ---
      mt('tree', function (ctx) {
        // Background grass
        fill(ctx, P.lightGreen);
        dots(ctx, P.green, 6);
        // Trunk (centered, narrow)
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(6, 10, 4, 6);
        ctx.fillStyle = P.brown;
        ctx.fillRect(7, 10, 2, 6);
        // Canopy (lush, layered circles)
        circ(ctx, 8, 7, 6, P.darkGreen);
        circ(ctx, 6, 5, 4, P.green);
        circ(ctx, 10, 6, 3, P.green);
        circ(ctx, 8, 4, 3, P.lightGreen);
        // Highlight
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(6, 3, 2, 1);
        ctx.fillRect(5, 4, 1, 1);
      });

      mt('bush', function (ctx) {
        fill(ctx, P.lightGreen);
        dots(ctx, P.green, 4);
        // Bush shape (rounded, not full-tile)
        circ(ctx, 8, 10, 5, P.darkGreen);
        circ(ctx, 6, 9, 4, P.green);
        circ(ctx, 10, 9, 3, P.green);
        circ(ctx, 8, 8, 2, P.lightGreen);
      });

      mt('flowers', function (ctx) {
        fill(ctx, P.lightGreen);
        dots(ctx, P.green, 8);
        var fc = [P.red, P.yellow, P.pink, P.lightPurple, P.white];
        for (var i = 0; i < 8; i++) {
          ctx.fillStyle = fc[i % 5];
          ctx.fillRect(rn(1, 13), rn(1, 13), 2, 2);
        }
        // Stems
        ctx.fillStyle = P.darkGreen;
        for (var j = 0; j < 4; j++) {
          ctx.fillRect(rn(2, 12), rn(6, 12), 1, 3);
        }
      });

      mt('fence', function (ctx) {
        fill(ctx, P.lightGreen);
        dots(ctx, P.green, 4);
        // Vertical posts
        ctx.fillStyle = P.brown;
        ctx.fillRect(1, 3, 2, 13);
        ctx.fillRect(7, 3, 2, 13);
        ctx.fillRect(13, 3, 2, 13);
        // Horizontal rails
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(0, 5, 16, 2);
        ctx.fillRect(0, 11, 16, 2);
        // Post caps
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(1, 2, 2, 2);
        ctx.fillRect(7, 2, 2, 2);
        ctx.fillRect(13, 2, 2, 2);
      });

      // --- Structure tiles ---
      mt('wood_wall', function (ctx) {
        fill(ctx, P.brown);
        ctx.fillStyle = P.darkBrown;
        for (var i = 0; i < 16; i += 4) ctx.fillRect(0, i, 16, 1);
        // Wood grain
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(3, 1, 1, 3);
        ctx.fillRect(10, 5, 1, 3);
        ctx.fillRect(6, 9, 1, 3);
      });

      mt('wood_floor', function (ctx) {
        fill(ctx, P.lightBrown);
        ctx.fillStyle = P.tan;
        for (var i = 0; i < 16; i += 4) ctx.fillRect(0, i, 16, 1);
        dots(ctx, P.brown, 6);
      });

      mt('wood_door', function (ctx) {
        fill(ctx, P.darkBrown);
        ctx.fillStyle = P.brown;
        ctx.fillRect(2, 1, 12, 15);
        // Panel details
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(3, 2, 4, 6);
        ctx.fillRect(9, 2, 4, 6);
        ctx.fillRect(3, 9, 4, 5);
        ctx.fillRect(9, 9, 4, 5);
        // Handle
        ctx.fillStyle = P.gold;
        ctx.fillRect(10, 8, 2, 2);
      });

      mt('stone_wall', function (ctx) {
        fill(ctx, P.gray);
        ctx.fillStyle = P.darkGray;
        for (var r = 0; r < 4; r++) {
          var y = r * 4;
          ctx.fillRect(0, y, 16, 1);
          for (var c = r % 2 ? 4 : 0; c < 16; c += 8) ctx.fillRect(c, y, 1, 4);
        }
        // Mortar highlight
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(4, 1, 1, 1);
        ctx.fillRect(12, 5, 1, 1);
      });

      mt('stone_floor', function (ctx) {
        fill(ctx, P.lightGray);
        ctx.fillStyle = P.gray;
        ctx.fillRect(0, 0, 16, 1);
        ctx.fillRect(0, 8, 16, 1);
        ctx.fillRect(0, 0, 1, 16);
        ctx.fillRect(8, 0, 1, 16);
      });

      mt('well', function (ctx) {
        fill(ctx, P.lightGreen);
        dots(ctx, P.green, 4);
        circ(ctx, 8, 8, 5, P.gray);
        circ(ctx, 8, 8, 3, P.darkGray);
        circ(ctx, 8, 8, 2, P.darkBlue);
        // Rim highlight
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(4, 4, 2, 1);
      });

      mt('market_stall', function (ctx) {
        fill(ctx, P.lightBrown);
        // Striped awning
        for (var i = 0; i < 4; i++) {
          ctx.fillStyle = i % 2 ? P.white : P.red;
          ctx.fillRect(i * 4, 0, 4, 6);
        }
        // Counter
        ctx.fillStyle = P.brown;
        ctx.fillRect(0, 6, 16, 2);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(0, 7, 16, 1);
        // Wares
        ctx.fillStyle = P.gold;
        ctx.fillRect(3, 9, 3, 2);
        ctx.fillStyle = P.green;
        ctx.fillRect(9, 9, 3, 2);
      });

      // --- Temple tiles ---
      mt('temple_wall', function (ctx) {
        fill(ctx, P.darkStone);
        ctx.fillStyle = P.black;
        for (var r = 0; r < 4; r++) {
          var y = r * 4;
          ctx.fillRect(0, y, 16, 1);
          for (var c = r % 2 ? 4 : 0; c < 16; c += 8) ctx.fillRect(c, y, 1, 4);
        }
        // Ancient carvings
        ctx.fillStyle = P.stone;
        ctx.fillRect(6, 6, 4, 1);
        ctx.fillRect(7, 10, 2, 1);
      });

      mt('temple_floor', function (ctx) {
        fill(ctx, P.stone);
        ctx.fillStyle = P.darkStone;
        ctx.fillRect(0, 0, 16, 1);
        ctx.fillRect(0, 8, 16, 1);
        ctx.fillRect(0, 0, 1, 16);
        ctx.fillRect(8, 0, 1, 16);
        dots(ctx, P.lightStone, 4);
      });

      mt('temple_door', function (ctx) {
        fill(ctx, P.darkGray);
        ctx.fillStyle = P.black;
        ctx.fillRect(2, 0, 12, 16);
        // Arch detail
        ctx.fillStyle = P.gray;
        ctx.fillRect(2, 0, 1, 16);
        ctx.fillRect(13, 0, 1, 16);
        ctx.fillRect(2, 0, 12, 1);
        // Symbols
        ctx.fillStyle = P.stone;
        ctx.fillRect(7, 4, 2, 2);
        ctx.fillRect(7, 10, 2, 2);
      });

      mt('altar', function (ctx) {
        fill(ctx, P.stone);
        ctx.fillStyle = P.darkStone;
        ctx.fillRect(3, 4, 10, 8);
        ctx.fillStyle = P.lightStone;
        ctx.fillRect(4, 5, 8, 6);
        // Ritual symbols
        ctx.fillStyle = P.darkPurple;
        ctx.fillRect(6, 6, 1, 1);
        ctx.fillRect(9, 6, 1, 1);
        ctx.fillRect(7, 8, 2, 1);
        ctx.fillStyle = P.purple;
        ctx.fillRect(7, 7, 2, 1);
      });

      mt('pillar', function (ctx) {
        fill(ctx, P.stone);
        // Cylindrical pillar
        circ(ctx, 8, 8, 5, P.gray);
        circ(ctx, 7, 7, 3, P.lightGray);
        // Capital and base
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(3, 2, 10, 2);
        ctx.fillRect(3, 12, 10, 2);
      });

      mt('torch', function (ctx) {
        fill(ctx, P.darkStone);
        ctx.fillStyle = P.darkGray;
        for (var r = 0; r < 4; r++) ctx.fillRect(0, r * 4, 16, 1);
        // Bracket
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(6, 7, 4, 2);
        // Handle
        ctx.fillStyle = P.brown;
        ctx.fillRect(7, 6, 2, 8);
        // Flame (layered)
        ctx.fillStyle = P.red;
        ctx.fillRect(6, 2, 4, 5);
        ctx.fillStyle = P.gold;
        ctx.fillRect(6, 3, 4, 3);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(7, 2, 2, 3);
        ctx.fillStyle = P.white;
        ctx.fillRect(7, 3, 2, 1);
      });

      mt('chest', function (ctx) {
        fill(ctx, P.stone);
        ctx.fillStyle = P.brown;
        ctx.fillRect(3, 6, 10, 8);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(3, 6, 10, 1);
        ctx.fillRect(3, 9, 10, 1);
        // Metal bands
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(3, 8, 10, 1);
        ctx.fillRect(3, 12, 10, 1);
        // Lock
        ctx.fillStyle = P.gold;
        ctx.fillRect(7, 8, 2, 2);
        ctx.fillStyle = P.darkYellow;
        ctx.fillRect(7, 9, 2, 1);
      });

      mt('statue', function (ctx) {
        fill(ctx, P.stone);
        // Figure shape
        ctx.fillStyle = P.gray;
        ctx.fillRect(6, 2, 4, 3);  // head
        ctx.fillRect(5, 5, 6, 6);  // body
        ctx.fillRect(6, 11, 4, 4); // base
        // Face
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(7, 3, 2, 1);
        // Details
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(5, 5, 6, 1);
      });

      mt('bridge', function (ctx) {
        fill(ctx, P.blue);
        dots(ctx, P.lightBlue, 4);
        // Planks
        ctx.fillStyle = P.lightBrown;
        for (var i = 0; i < 4; i++) ctx.fillRect(0, i * 4, 16, 3);
        ctx.fillStyle = P.darkBrown;
        for (var j = 0; j < 4; j++) ctx.fillRect(0, j * 4 + 3, 16, 1);
        // Rope rails
        ctx.fillStyle = P.tan;
        ctx.fillRect(0, 0, 1, 16);
        ctx.fillRect(15, 0, 1, 16);
      });

      mt('roof', function (ctx) {
        fill(ctx, P.darkRed);
        for (var r = 0; r < 8; r++) {
          ctx.fillStyle = P.brown;
          ctx.fillRect(0, r * 2, 16, 1);
          ctx.fillStyle = P.darkBrown;
          for (var c = r % 2 ? 2 : 0; c < 16; c += 4) ctx.fillRect(c, r * 2, 1, 2);
        }
      });

      mt('sign', function (ctx) {
        fill(ctx, P.lightGreen);
        dots(ctx, P.green, 6);
        // Post
        ctx.fillStyle = P.brown;
        ctx.fillRect(7, 8, 2, 8);
        // Board
        ctx.fillStyle = P.tan;
        ctx.fillRect(2, 2, 12, 7);
        ctx.fillStyle = P.darkBrown;
        ctx.strokeStyle = P.darkBrown;
        ctx.lineWidth = 1;
        ctx.strokeRect(2.5, 2.5, 11, 6);
        // Text lines
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(4, 4, 8, 1);
        ctx.fillRect(5, 6, 6, 1);
      });

      mt('carpet', function (ctx) {
        fill(ctx, P.darkRed);
        // Ornate border
        ctx.fillStyle = P.gold;
        [0, 15].forEach(function (v) {
          ctx.fillRect(0, v, 16, 1);
          ctx.fillRect(v, 0, 1, 16);
        });
        ctx.fillRect(2, 2, 12, 1);
        ctx.fillRect(2, 13, 12, 1);
        ctx.fillRect(2, 2, 1, 12);
        ctx.fillRect(13, 2, 1, 12);
        // Center pattern
        ctx.fillStyle = P.gold;
        ctx.fillRect(7, 7, 2, 2);
      });

      mt('dark', function (ctx) { fill(ctx, P.black); });

      mt('spike', function (ctx) {
        // Temple floor base
        fill(ctx, P.lightGray);
        ctx.fillStyle = P.gray;
        ctx.fillRect(0, 0, 16, 1);
        ctx.fillRect(0, 8, 16, 1);
        ctx.fillRect(0, 0, 1, 16);
        ctx.fillRect(8, 0, 1, 16);
        // Spike points (metallic gray triangles)
        ctx.fillStyle = P.darkGray;
        // Center spike
        ctx.beginPath(); ctx.moveTo(8, 3); ctx.lineTo(6, 13); ctx.lineTo(10, 13); ctx.fill();
        // Left spike
        ctx.beginPath(); ctx.moveTo(3, 5); ctx.lineTo(1, 13); ctx.lineTo(5, 13); ctx.fill();
        // Right spike
        ctx.beginPath(); ctx.moveTo(13, 5); ctx.lineTo(11, 13); ctx.lineTo(15, 13); ctx.fill();
        // Metallic highlights
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(8, 4, 1, 2);
        ctx.fillRect(3, 6, 1, 2);
        ctx.fillRect(13, 6, 1, 2);
      });

      mt('mushroom', function (ctx) {
        // Dark grass base
        fill(ctx, P.green);
        dots(ctx, P.darkGreen, 10);
        // Mushroom stem
        ctx.fillStyle = P.tan;
        ctx.fillRect(6, 10, 4, 6);
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(7, 10, 2, 6);
        // Mushroom cap
        circ(ctx, 8, 9, 5, P.red);
        circ(ctx, 8, 8, 4, P.lightRed);
        // White spots on cap
        ctx.fillStyle = P.white;
        ctx.fillRect(6, 6, 2, 2);
        ctx.fillRect(9, 7, 2, 2);
        ctx.fillRect(7, 9, 1, 1);
      });

      mt('cracked_floor', function (ctx) {
        // Temple floor base
        fill(ctx, P.lightGray);
        ctx.fillStyle = P.gray;
        ctx.fillRect(0, 0, 16, 1);
        ctx.fillRect(0, 8, 16, 1);
        ctx.fillRect(0, 0, 1, 16);
        ctx.fillRect(8, 0, 1, 16);
        // Cracks
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(3, 3, 1, 5);
        ctx.fillRect(4, 7, 3, 1);
        ctx.fillRect(7, 5, 1, 3);
        ctx.fillRect(10, 2, 1, 4);
        ctx.fillRect(11, 5, 3, 1);
        ctx.fillRect(5, 11, 1, 3);
        ctx.fillRect(5, 13, 4, 1);
      });

      // =================================================================
      // ITEM SPRITES
      // =================================================================

      function mi(n, fn) { S.create('item_' + n, 16, 16, fn); }

      function hrt(ctx, cx, cy, r, c) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(cx, cy + r);
        ctx.bezierCurveTo(cx - r, cy + r * 0.4, cx - r, cy - r * 0.6, cx - r * 0.4, cy - r * 0.6);
        ctx.bezierCurveTo(cx - r * 0.1, cy - r, cx, cy - r * 0.4, cx, cy - r * 0.1);
        ctx.bezierCurveTo(cx, cy - r * 0.4, cx + r * 0.1, cy - r, cx + r * 0.4, cy - r * 0.6);
        ctx.bezierCurveTo(cx + r, cy - r * 0.6, cx + r, cy + r * 0.4, cx, cy + r);
        ctx.fill();
      }

      mi('heart', function (ctx) {
        hrt(ctx, 8, 8, 6, P.red);
        // Highlight
        ctx.fillStyle = P.lightRed;
        ctx.fillRect(5, 4, 2, 2);
      });

      mi('heart_half', function (ctx) {
        hrt(ctx, 8, 8, 6, P.red);
        ctx.save();
        ctx.beginPath();
        ctx.rect(8, 0, 8, 16);
        ctx.clip();
        hrt(ctx, 8, 8, 6, P.gray);
        ctx.restore();
        ctx.fillStyle = P.lightRed;
        ctx.fillRect(5, 4, 2, 2);
      });

      mi('heart_empty', function (ctx) {
        ctx.strokeStyle = P.gray;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8, 14);
        ctx.bezierCurveTo(1, 10, 1, 3, 5, 3);
        ctx.bezierCurveTo(7, 1, 8, 3, 8, 5);
        ctx.bezierCurveTo(8, 3, 9, 1, 11, 3);
        ctx.bezierCurveTo(15, 3, 15, 10, 8, 14);
        ctx.stroke();
      });

      mi('eldertech', function (ctx) {
        circ(ctx, 8, 8, 6, P.darkTeal);
        circ(ctx, 8, 8, 4, P.teal);
        circ(ctx, 7, 6, 2, P.paleGreen);
      });

      mi('crown', function (ctx) {
        ctx.fillStyle = P.gold;
        ctx.fillRect(3, 8, 10, 5);
        ctx.fillRect(3, 5, 2, 3);
        ctx.fillRect(7, 4, 2, 4);
        ctx.fillRect(11, 5, 2, 3);
        ctx.fillStyle = P.red;
        ctx.fillRect(7, 9, 2, 2);
        // Gem highlight
        ctx.fillStyle = P.lightRed;
        ctx.fillRect(7, 9, 1, 1);
      });

      mi('cape', function (ctx) {
        ctx.fillStyle = P.purple;
        ctx.fillRect(4, 2, 8, 12);
        ctx.fillRect(3, 4, 10, 8);
        ctx.fillStyle = P.darkPurple;
        ctx.fillRect(5, 3, 6, 2);
        ctx.fillStyle = P.red;
        ctx.fillRect(5, 12, 6, 2);
        // Clasp
        ctx.fillStyle = P.gold;
        ctx.fillRect(7, 3, 2, 1);
      });

      mi('scepter', function (ctx) {
        ctx.fillStyle = P.gold;
        ctx.fillRect(7, 4, 2, 10);
        ctx.fillRect(5, 2, 6, 3);
        ctx.fillStyle = P.blue;
        ctx.fillRect(7, 2, 2, 2);
        ctx.fillStyle = P.lightBlue;
        ctx.fillRect(7, 2, 1, 1);
        // Glow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = P.lightBlue;
        ctx.fillRect(5, 1, 6, 4);
        ctx.globalAlpha = 1;
      });

      mi('potion', function (ctx) {
        // Bottle
        ctx.fillStyle = P.gray;
        ctx.fillRect(6, 2, 4, 3);
        ctx.fillStyle = P.red;
        ctx.fillRect(5, 5, 6, 8);
        ctx.fillRect(4, 7, 8, 4);
        // Highlight
        ctx.fillStyle = P.lightRed;
        ctx.fillRect(6, 6, 2, 3);
        // Cork
        ctx.fillStyle = P.tan;
        ctx.fillRect(7, 2, 2, 1);
      });

      mi('silencestone', function (ctx) {
        circ(ctx, 8, 8, 6, P.darkGray);
        circ(ctx, 8, 8, 4, P.black);
        var ic = [P.lightPurple, P.lightBlue, P.paleGreen];
        for (var i = 0; i < 8; i++) {
          ctx.fillStyle = ic[i % 3];
          ctx.fillRect(rn(4, 11), rn(4, 11), 1, 1);
        }
      });

      mi('key', function (ctx) {
        ctx.fillStyle = P.gold;
        ctx.fillRect(5, 3, 2, 10);
        ctx.fillRect(7, 11, 4, 1);
        ctx.fillRect(7, 9, 3, 1);
        circ(ctx, 6, 4, 2.5, P.darkYellow);
        circ(ctx, 6, 4, 1.5, P.gold);
      });
    }
  };

})();
