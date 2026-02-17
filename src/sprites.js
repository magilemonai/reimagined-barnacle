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
        // 12 cols wide, 18 rows tall, drawn at offset (2,3) in a 16x24 canvas.
        // Body is fully connected: hair->face->neck->shoulders->torso->legs->boots.
        var down0 = [
          '....hhhh....',   // hair top
          '...hhhhhh...',   // hair sides
          '..hhhhhhHH..',   // hair with shadow (H)
          '..hhshksHH..',   // face: skin(s), eyes(k)
          '..hhssssHH..',   // cheeks
          '...ssmsss...',   // chin, mouth(m)
          '..aaaaaaa...',   // shoulders (armor/tunic a)
          '..aaAbbAaa..',   // upper torso, emblem(A)
          '..aabbbbaa..',   // torso
          '..aabbbbaa..',   // torso
          '...aBBBBa...',   // belt(B)
          '...bbbbbb...',   // waist
          '...dd..dd...',   // upper legs
          '...dd..dd...',   // legs
          '...dd..dd...',   // lower legs
          '..ddd..ddd..',   // shins widen
          '..ooo..ooo..',   // boots
          '..ooo..ooo..'    // boot soles
        ];

        // Frame 1: left foot forward
        var down1 = [
          '....hhhh....',
          '...hhhhhh...',
          '..hhhhhhHH..',
          '..hhshksHH..',
          '..hhssssHH..',
          '...ssmsss...',
          '..aaaaaaa...',
          '..aaAbbAaa..',
          '..aabbbbaa..',
          '..aabbbbaa..',
          '...aBBBBa...',
          '...bbbbbb...',
          '..dd....dd..',   // legs in stride
          '..dd....dd..',
          '..dd....dd..',
          '..dd....dd..',
          '..ooo..ooo..',
          '.ooo....ooo.'
        ];

        // Attack: arm extended with weapon(w)
        var downAtk = [
          '....hhhh....',
          '...hhhhhh...',
          '..hhhhhhHH..',
          '..hhshksHH..',
          '..hhssssHH..',
          '...ssmsss...',
          '..aaaaaaww..',   // right arm extends with weapon
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
          '..hhhhhhhh..',   // back of head, all hair
          '..hhhhhhhh..',
          '..hhhhhhHH..',
          '...hhhhhhH..',
          '..aaaaaaa...',   // shoulders
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
          '...hhhhhhH..',
          '..aaaaaaa...',
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
          '...hhhhhhH..',
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
          '...hhshkhsH.',   // profile: skin, eye(k), skin
          '...hhssssHH.',
          '....ssmsss..',   // chin
          '...aaaaaaa..',   // shoulders
          '..aaAbbbbaa.',
          '..aabbbbbaa.',
          '..aabbbbbaa.',
          '...aBBBBa...',
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
          '...hhshkhsH.',
          '...hhssssHH.',
          '....ssmsss..',
          '...aaaaaaa..',
          '..aaAbbbbaa.',
          '..aabbbbbaa.',
          '..aabbbbbaa.',
          '...aBBBBa...',
          '....bbbbb...',
          '...dd..dd...',
          '...dd...dd..',
          '..dd....dd..',
          '..dd...ddd..',
          '..ooo..ooo..',
          '..ooo...ooo.'
        ];

        // Attack right: arm + weapon extended
        var rightAtk = [
          '.....hhhh...',
          '....hhhhhh..',
          '...hhhhhhhH.',
          '...hhshkhsH.',
          '...hhssssHH.',
          '....ssmsss..',
          '...aaaaaawww',   // weapon extended right
          '..aaAbbbawww',
          '..aabbbba...',
          '..aabbbba...',
          '...aBBBBa...',
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

      // Fawks - Innkeeper: burly build, white apron over brown tunic, brown hair
      makeNPC('npc_fawks', [
        '............',
        '....hhhh....',
        '...hhhhhh...',
        '...hskskh...',   // face: hair frames skin, eyes (k)
        '...hssssh...',
        '....ssmss...',   // chin, mouth shadow
        '...tttttt...',   // shoulders (brown tunic)
        '..ttwwwwtt..',   // apron (w) over tunic (t)
        '..ttwwwwtt..',
        '..ttwwowtt..',   // apron pocket detail (o=gold)
        '...twwwwt...',
        '...tttttt...',   // waist
        '...dd..dd...',   // legs
        '...dd..dd...',
        '...dd..dd...',
        '...dd..dd...',
        '..bbb..bbb..',   // boots
        '..bbb..bbb..'
      ], { h: P.brown, s: P.skin, k: P.darkGray, m: P.darkSkin, o: P.gold, w: P.white, t: P.lightBrown, d: P.darkGray, b: P.darkBrown });

      // Helena - Mayor: dignified, upswept brown hair, elegant blue dress
      makeNPC('npc_helena', [
        '............',
        '....hhhh....',
        '...hhhhhh...',
        '...hskskh...',   // face framed by hair
        '...hssssh...',
        '....ssmss...',   // chin
        '...uuuuuu...',   // shoulders (blue dress)
        '..uuuuuuuu..',   // upper bodice
        '..uuUuuUuu..',   // dress detail (U=light embroidery)
        '..uuuuuuuu..',
        '...uuuuuu...',   // waist
        '...uuuuuu...',   // skirt begins
        '..uuuuuuuu..',   // skirt widens
        '..uuuuuuuu..',
        '..uuuuuuuu..',
        '...uuuuuu...',
        '....dd.dd...',   // shoes peek out
        '....dd.dd...'
      ], { h: P.lightBrown, s: P.skin, k: P.darkGray, m: P.darkSkin, u: P.blue, U: P.lightBlue, d: P.darkBrown });

      // Elira Voss - Town Guard Captain: short brown hair, gray armor over blue tunic
      makeNPC('npc_elira', [
        '............',
        '....hhhh....',
        '...hhhhhh...',
        '...hskskh...',   // stern face
        '...hssssh...',
        '....ssmss...',
        '..aauuuuaa..',   // armored shoulders (a=gray) over tunic (u=blue)
        '..aauuuuaa..',
        '..aauUuUaa..',   // chest plate detail
        '..aauuuuaa..',
        '...auuuua...',   // armored waist
        '...uuuuuu...',   // tunic below armor
        '...dd..dd...',   // legs
        '...dd..dd...',
        '...dd..dd...',
        '...dd..dd...',
        '...aa..aa...',   // armored boots
        '...aa..aa...'
      ], { h: P.brown, s: P.skin, k: P.darkGray, m: P.darkSkin, a: P.gray, u: P.blue, U: P.lightBlue, d: P.darkGray });

      // Brother Soren - Tabaxi Monk: cat-person with pointed ears, fur, tail, monk robes
      makeNPC('npc_soren', [
        '...f..f.....',   // pointed cat ears (f=tawny fur)
        '..ffffff....',   // fur-covered head
        '..fgYYgf....',   // feline face: gold slit eyes (Y), gray muzzle (g)
        '..ffggff....',   // snout and whiskers
        '...fmmf.....',   // chin/neck fur (m=darker fur)
        '..rrrrrr....',   // brown monk robe shoulders
        '..rrbbrr....',   // robe front with darker panel
        '..rrbBbr....',   // rope belt (B=dark)
        '..rrbbrrT...',   // tail starts here (T=tail tip)
        '...rbbr.T...',   // robe body + tail curving
        '...rbbr..T..',   // tail extends
        '...rrrr..T..',
        '..rrrrrr.T..',   // robe widens at hem
        '..rrrrrr....',
        '...rrrr.....',
        '...ff.ff....',   // furry paw-feet
        '...ff.ff....',
        '...ff.ff....'
      ], { f: '#c08050', g: '#a08070', Y: P.gold, m: '#906040', r: P.brown, b: '#8b6940', B: P.darkBrown, T: '#c08050' });

      // Braxon - Blacksmith: stocky, leather apron, bald with thick arms
      makeNPC('npc_braxon', [
        '............',
        '....bbbb....',
        '...bbbbbb...',   // bald head (b=brown/tanned)
        '...bskskb...',   // eyes
        '...bssssb...',
        '....ssmss...',   // chin
        '..llaaaall..',   // beefy arms (l=light brown skin), apron (a)
        '..llaaaall..',
        '..llaaGall..',   // apron with gold buckle
        '...laaaal...',
        '...aaaaaa...',   // apron lower
        '...aaaaaa...',
        '...dd..dd...',   // sturdy legs
        '...dd..dd...',
        '...dd..dd...',
        '...dd..dd...',
        '..kkk..kkk..',   // heavy boots
        '..kkk..kkk..'
      ], { b: P.lightBrown, s: P.skin, k: P.darkGray, m: P.darkSkin, l: P.skin, a: P.darkBrown, G: P.gold, d: P.darkGray });

      // Que'Rubra - Forest spirit/treant: living tree with face, leafy crown, roots for legs
      makeNPC('npc_querubra', [
        '..gGgGgGgG..',   // leafy canopy crown
        '..ggGggGgg..',
        '.gGggggggGg.',
        '.ggGggggGgg.',   // leaves connect to trunk below
        '...bbbbbb...',   // trunk/face area
        '...bybbby...',   // golden eyes (y)
        '...bbbbbb...',
        '...bbbmbb...',   // mouth (m=dark knot)
        '..bbbbbbbb..',   // wide trunk body
        '..bbbBBbbb..',   // bark detail (B=dark)
        '...bbbbbb...',
        '...bbbbbb...',
        '...bbbbbb...',   // trunk narrows
        '..RRbbbbRR..',   // root-legs splay out (R=dark brown)
        '..RR.bb.RR..',
        '.RR..bb..RR.',
        '.RR......RR.',
        'RR........RR'
      ], { g: P.green, G: P.lightGreen, b: P.brown, B: P.darkBrown, y: P.gold, m: P.darkBrown, R: P.darkBrown });

      // Rorik - Dwarven prisoner: stocky, gray tunic, big red beard, shackled look
      makeNPC('npc_rorik', [
        '............',
        '....hhhh....',
        '...hhhhhh...',   // messy red-brown hair
        '...hskskh...',   // face
        '...hssssh...',
        '....rrrr....',   // big red beard
        '...rrrrrr...',   // beard continues into torso
        '..aarrrrraa.',   // arms (a=gray tunic) holding beard
        '..aaaaaAaa..',   // torso, torn tunic detail (A=light)
        '..aaaaaaaa..',
        '...aaaaaa...',   // waist
        '...aaaaaa...',
        '...dd..dd...',   // legs
        '...dd..dd...',
        '...dd..dd...',
        '...dd..dd...',
        '..bbb..bbb..',   // boots
        '..bbb..bbb..'
      ], { h: P.darkBrown, a: P.gray, A: P.lightGray, s: P.skin, k: P.darkGray, r: P.red, d: P.darkGray, b: P.darkBrown });

      // Svana - Dwarven refugee: stocky and short, thick auburn braids, wide build, armored vest
      makeNPC('npc_svana', [
        '............',
        '...hhhhhh...',   // wide auburn hair
        '..hhhhhhhh..',   // big dwarven hair (wide head)
        '..hhskskhh..',   // broad face with bright eyes
        '..hhsssshh..',   // rosy cheeks
        '.hhbssmsbhh.',   // long braids (h) frame face, braided beard (b)
        '.hhaaaaaa.h.',   // braids hang by shoulders, armored vest (a=gray)
        '..aaaGGaaa..',   // wide stocky torso, gold buckle detail (G)
        '..aaaaaaaa..',   // broad armored midsection
        '..aaccccaa..',   // amber tunic below armor (c)
        '..cccccccc..',   // wide dwarven frame
        '..cccccccc..',
        '..cccccccc..',   // short stout legs start close to torso
        '..dddddddd..',   // very short thick legs (dwarven proportions)
        '..dddddddd..',
        '..dddddddd..',
        '..bbb..bbb..',   // big heavy boots
        '..bbb..bbb..'
      ], { h: '#8b4513', s: P.skin, k: '#4080c0', m: P.darkSkin, a: P.gray, G: P.gold, c: '#d0a060', d: P.darkGray, b: P.darkBrown });

      // NPC aliases
      S.cache['npc_elira_voss'] = S.cache['npc_elira'];
      S.cache['npc_brother_soren'] = S.cache['npc_soren'];
      S.cache['npc_mayor_helena'] = S.cache['npc_helena'];

      // =================================================================
      // ENEMY SPRITES (16x16 each)
      // =================================================================

      // --- Goblin ---
      // Small green-skinned creature with red eyes, loincloth, holding a club.
      // 12 columns wide within a 16x16 canvas (offset by 2).
      var gPal = { g: P.green, G: P.darkGreen, r: P.red, R: P.darkRed, b: P.brown, B: P.darkBrown, k: P.black, w: P.white, y: P.gold, t: P.tan };

      // Goblin facing down, frame 0
      S.create('goblin_0', 16, 16, function (ctx) {
        dp(ctx, [
          '....GGGG....',
          '...GgGGgG...',
          '...GrGGrG...',   // red eyes in dark face
          '...GgggGG...',
          '....gggg....',   // neck
          '..bgggggb...',   // torso with arms
          '..bgggggb...',
          '...tBBBt....',   // belt/loincloth
          '...tgggt....',
          '....gg.gg...',   // legs connected to torso
          '....gg.gg...',
          '...BBB.BBB..',   // boots
        ], gPal, 2, 2);
        // weapon: small club in right hand
        ctx.fillStyle = P.brown;
        ctx.fillRect(13, 5, 2, 6);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(13, 3, 2, 3);
      });

      // Goblin frame 1 (walking)
      S.create('goblin_1', 16, 16, function (ctx) {
        dp(ctx, [
          '....GGGG....',
          '...GgGGgG...',
          '...GrGGrG...',
          '...GgggGG...',
          '....gggg....',
          '..bgggggb...',
          '..bgggggb...',
          '...tBBBt....',
          '...tgggt....',
          '...gg...gg..',   // legs apart in stride
          '...gg...gg..',
          '..BBB..BBB..',
        ], gPal, 2, 2);
        ctx.fillStyle = P.brown;
        ctx.fillRect(13, 5, 2, 6);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(13, 3, 2, 3);
      });

      // Goblin attack
      S.create('goblin_atk', 16, 16, function (ctx) {
        dp(ctx, [
          '....GGGG....',
          '...GgGGgG...',
          '...GrGGrG...',
          '...GgggGG...',
          '....gggg....',
          '..bgggggb...',
          '..bgggggb...',
          '...tBBBt....',
          '...tgggt....',
          '....gg.gg...',
          '....gg.gg...',
          '...BBB.BBB..',
        ], gPal, 2, 2);
        // club swung overhead
        ctx.fillStyle = P.brown;
        ctx.fillRect(13, 1, 2, 8);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(12, 0, 3, 3);
      });

      // --- Spinecleaver (larger goblin warrior with blade) ---
      // Bulkier goblin with war paint, armor plates, and a large cleaver.
      var sPal = { g: P.darkGreen, G: P.black, r: P.red, b: P.darkBrown, w: P.white, k: P.darkGray, B: P.darkBrown, a: P.gray };

      S.create('spinecleaver_0', 16, 16, function (ctx) {
        dp(ctx, [
          '....GGGG....',
          '...GgGGgG...',
          '..wGrGGrGw..',   // white war paint on cheeks
          '...GgggGG...',
          '....gggg....',
          '..agaaaaga..',   // armored torso (gray plates)
          '..agaaaaga..',
          '...aBBBa....',   // belt
          '...aggga....',
          '....gg.gg...',   // legs
          '....gg.gg...',
          '...kkk.kkk..',   // armored boots
        ], sPal, 2, 2);
        // Large cleaver blade
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(14, 2, 2, 8);
        ctx.fillStyle = P.white;
        ctx.fillRect(15, 3, 1, 6);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(14, 9, 2, 2);
      });

      S.create('spinecleaver_1', 16, 16, function (ctx) {
        dp(ctx, [
          '....GGGG....',
          '...GgGGgG...',
          '..wGrGGrGw..',
          '...GgggGG...',
          '....gggg....',
          '..agaaaaga..',
          '..agaaaaga..',
          '...aBBBa....',
          '...aggga....',
          '...gg...gg..',   // stride
          '...gg...gg..',
          '..kkk..kkk..',
        ], sPal, 2, 2);
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(14, 2, 2, 8);
        ctx.fillStyle = P.white;
        ctx.fillRect(15, 3, 1, 6);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(14, 9, 2, 2);
      });

      S.create('spinecleaver_atk', 16, 16, function (ctx) {
        dp(ctx, [
          '....GGGG....',
          '...GgGGgG...',
          '..wGrGGrGw..',
          '...GgggGG...',
          '....gggg....',
          '..agaaaaga..',
          '..agaaaaga..',
          '...aBBBa....',
          '...aggga....',
          '....gg.gg...',
          '....gg.gg...',
          '...kkk.kkk..',
        ], sPal, 2, 2);
        // Blade swung horizontally
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(12, 1, 4, 3);
        ctx.fillStyle = P.white;
        ctx.fillRect(13, 1, 2, 2);
        // Slash arc
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = P.white;
        ctx.fillRect(10, 0, 6, 1);
        ctx.globalAlpha = 1;
      });

      // Aliases for enemy types that use goblin/spinecleaver base
      S.cache['goblin_lackey_0'] = S.cache['goblin_0'];
      S.cache['goblin_lackey_1'] = S.cache['goblin_1'];
      S.cache['goblin_lackey_atk'] = S.cache['goblin_atk'];

      // =================================================================
      // BOSS SPRITES (32x32 - Queen Bargnot)
      // =================================================================
      //
      // Bargnot is a large goblin queen: jagged crown, heavy red robes,
      // green skin, red eyes, carrying a scepter. 32x32 canvas.
      // Every body part is connected to form a solid silhouette.

      var bPal = {
        g: P.darkGreen, G: '#1a3a1a', r: P.red, R: P.darkRed,
        c: P.gray, C: P.lightGray, w: P.white, k: P.darkGray,
        y: P.gold, Y: P.darkYellow, s: P.skin, p: P.purple,
        n: P.black
      };

      var bossBody = [
        '..........yy.y.yy.........',
        '.........yyYyyYyy..........',
        '........yyyYYYyyy..........',
        '.......ggggggggggg.........',
        '......gggggggggggggg.......',
        '......gGrrGGGGrrGgg.......',
        '......gggggggggggggg.......',
        '......ggGGggwwGGgggg.......',
        '.....RRggggggggggggRR.....',
        '....RRRRRRRRRRRRRRRRRk....',
        '....RRkRRRRRRRRRRRkRRk....',
        '....RRRRRRyRRyRRRRRRRk....',
        '.....RRRRRRRRRRRRRRRR.....',
        '.....RRRRRRRRRRRRRRR......',
        '.....RRRRRRRRRRRRRRk.....',
        '......RRRRRggRRRRRR......',
        '......gggggggggggggg......',
        '.......gggg..gggg.........',
        '.......gggg..gggg.........',
        '.......kkkk..kkkk.........'
      ];

      function makeBoss(name, fn) {
        S.create(name, 32, 32, function (ctx) {
          dp(ctx, bossBody, bPal, 3, 1);
          fn(ctx);
        });
      }

      // Idle frame 0
      makeBoss('bargnot_0', function (ctx) {
        // Scepter in right hand
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(26, 8, 2, 16);
        ctx.fillStyle = P.gold;
        ctx.fillRect(25, 5, 4, 4);
        ctx.fillStyle = P.red;
        ctx.fillRect(26, 6, 2, 2);
      });

      // Idle frame 1 (slight sway)
      makeBoss('bargnot_1', function (ctx) {
        // Scepter
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(26, 9, 2, 15);
        ctx.fillStyle = P.gold;
        ctx.fillRect(25, 6, 4, 4);
        ctx.fillStyle = P.red;
        ctx.fillRect(26, 7, 2, 2);
      });

      // Attack: scepter thrust overhead
      makeBoss('bargnot_atk', function (ctx) {
        // Scepter raised high
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(26, 1, 2, 18);
        ctx.fillStyle = P.gold;
        ctx.fillRect(25, 0, 4, 3);
        ctx.fillStyle = P.red;
        ctx.fillRect(26, 0, 2, 1);
        // Attack energy glow
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = P.red;
        ctx.fillRect(23, 0, 8, 5);
        ctx.globalAlpha = 1;
      });

      // Rage phase (phase 2) - red glow aura
      makeBoss('bargnot_rage', function (ctx) {
        // Scepter
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(26, 8, 2, 16);
        ctx.fillStyle = P.gold;
        ctx.fillRect(25, 5, 4, 4);
        ctx.fillStyle = P.red;
        ctx.fillRect(26, 6, 2, 2);
        // Rage aura - scattered red/gold embers around body
        var embers = [[5,4],[24,6],[8,20],[22,18],[14,2],[18,22],[3,12],[27,14]];
        for (var i = 0; i < embers.length; i++) {
          ctx.fillStyle = i % 2 ? P.red : P.gold;
          ctx.fillRect(embers[i][0], embers[i][1], 2, 2);
        }
      });

      // Shadow phase (phase 3) - purple recolor with shadow wisps
      S.create('bargnot_shadow', 32, 32, function (ctx) {
        var sp = {
          g: P.darkPurple, G: P.black, r: P.purple, R: P.darkPurple,
          c: P.gray, C: P.lightGray, w: P.lightPurple, k: P.darkGray,
          y: P.purple, Y: P.darkPurple, s: P.paleSkin, p: P.lightPurple,
          n: P.black
        };
        dp(ctx, bossBody, sp, 3, 1);
        // Shadow scepter
        ctx.fillStyle = P.darkPurple;
        ctx.fillRect(26, 8, 2, 16);
        ctx.fillStyle = P.purple;
        ctx.fillRect(25, 5, 4, 4);
        // Shadow tendrils rising from body
        var tendrils = [[8,0,2],[14,0,3],[20,0,2],[11,2,1],[17,1,2],[6,3,1],[23,2,1]];
        for (var i = 0; i < tendrils.length; i++) {
          ctx.fillStyle = P.lightPurple;
          ctx.globalAlpha = 0.35;
          ctx.fillRect(tendrils[i][0], tendrils[i][1], 2, tendrils[i][2]);
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
