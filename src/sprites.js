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

        // Attack wind-up: weapon pulls to LEFT side, body leans back
        var downAtk1 = [
          '....hhhh....',
          '...hhhhhh...',
          '..hhhhhhHH..',
          '..hhshksHH..',
          '..hhssssHH..',
          '...ssmsss...',
          'ww.aaaaaaa..',   // weapon on left side (wind-up)
          'ww.aAbbAaa..',
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

        // Attack recovery: weapon drops lower, arm returning to side
        var downAtk2 = [
          '....hhhh....',
          '...hhhhhh...',
          '..hhhhhhHH..',
          '..hhshksHH..',
          '..hhssssHH..',
          '...ssmsss...',
          '..aaaaaaa...',   // arm back near body
          '..aaAbbAaa..',
          '..aabbbbaa..',
          '..aabbbbaww.',   // weapon lowered at side
          '...aBBBBaww.',
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

        // Up attack wind-up: weapon pulls to left behind body
        var upAtk1 = [
          '....hhhh....',
          '...hhhhhh...',
          '..hhhhhhhh..',
          '..hhhhhhhh..',
          '..hhhhhhHH..',
          '...hhhhhhH..',
          'ww.aaaaaaa..',   // weapon on left side (wind-up)
          'ww.aAaaAaa..',
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

        // Up attack recovery: weapon lowered, arm returning
        var upAtk2 = [
          '....hhhh....',
          '...hhhhhh...',
          '..hhhhhhhh..',
          '..hhhhhhhh..',
          '..hhhhhhHH..',
          '...hhhhhhH..',
          '..aaaaaaa...',   // arm back near body
          '..aaAaaAaa..',
          '..aabbbba...',
          '..aabbbbaww.',   // weapon lowered at side
          '...aBBBBaww.',
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

        // Right attack wind-up: weapon pulled back behind body
        var rightAtk1 = [
          '.....hhhh...',
          '....hhhhhh..',
          '...hhhhhhhH.',
          '...hhshkhsH.',
          '...hhssssHH.',
          '....ssmsss..',
          'ww.aaaaaaa..',   // weapon behind body (wind-up)
          'ww.aAbbbbaa.',
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

        // Right attack recovery: weapon lowered, arm returning
        var rightAtk2 = [
          '.....hhhh...',
          '....hhhhhh..',
          '...hhhhhhhH.',
          '...hhshkhsH.',
          '...hhssssHH.',
          '....ssmsss..',
          '...aaaaaaa..',   // arm back near body
          '..aaAbbbbaa.',
          '..aabbbbbaa.',
          '..aabbbbbaa.',
          '...aBBBBa...',
          '....bbbbbww.',   // weapon lowered at side
          '....dd.ddww.',
          '....dd.dd...',
          '....dd.dd...',
          '...ddd.ddd..',
          '...ooo.ooo..',
          '...ooo.ooo..'
        ];

        // Build all frames
        var frames = {
          down_0: down0, down_1: down1, down_atk_1: downAtk1, down_atk: downAtk, down_atk_2: downAtk2,
          up_0: up0, up_1: up1, up_atk_1: upAtk1, up_atk: upAtk, up_atk_2: upAtk2,
          right_0: right0, right_1: right1, right_atk_1: rightAtk1, right_atk: rightAtk, right_atk_2: rightAtk2
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

      // --- LUIGI: Purple warlock, old man with grey hair, teal accents ---
      makeCharacter('luigi', {
        h: P.gray,
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

      // --- LIRIELLE: Green druid, blonde hair, nature accents ---
      makeCharacter('lirielle', {
        h: P.gold,
        H: '#a08830',
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

      // Goblin attack wind-up (telegraph): club pulled back behind body
      S.create('goblin_atk_1', 16, 16, function (ctx) {
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
          '....gg.gg...',   // legs
          '....gg.gg...',
          '...BBB.BBB..',   // boots
        ], gPal, 2, 2);
        // weapon: club pulled back to left (telegraph)
        ctx.fillStyle = P.brown;
        ctx.fillRect(0, 4, 6, 2);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(0, 3, 3, 3);
      });

      // Goblin attack recovery (slam): club slammed down low
      S.create('goblin_atk_2', 16, 16, function (ctx) {
        dp(ctx, [
          '....GGGG....',
          '...GgGGgG...',
          '...GrGGrG...',   // red eyes
          '...GgggGG...',
          '....gggg....',   // neck
          '..bgggggb...',   // torso
          '..bgggggb...',
          '...tBBBt....',   // belt
          '...tgggt....',
          '....gg.gg...',   // legs
          '....gg.gg...',
          '...BBB.BBB..',   // boots
        ], gPal, 2, 2);
        // weapon: club slammed down to ground level, arm returning
        ctx.fillStyle = P.brown;
        ctx.fillRect(13, 10, 2, 5);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(12, 14, 4, 2);
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
      S.cache['goblin_lackey_atk_1'] = S.cache['goblin_atk_1'];
      S.cache['goblin_lackey_atk'] = S.cache['goblin_atk'];
      S.cache['goblin_lackey_atk_2'] = S.cache['goblin_atk_2'];

      // =================================================================
      // GOBLIN SHAMAN (16x16) — robed goblin with staff and glowing eyes
      // =================================================================
      var shPal = {
        g: P.darkGreen, G: '#1a3a1a', r: '#44ff88', // green glowing eyes
        p: P.purple, P: '#4a2a6a', // robes
        b: P.brown, B: P.darkBrown, // staff
        w: P.white, k: P.black, y: P.gold
      };

      S.create('goblin_shaman_0', 16, 16, function (ctx) {
        dp(ctx, [
          '....rggr....',
          '...gggggg...',
          '..gggrrggg..',
          '..ggggggg...',
          '...pppp.B...',
          '..pppppp.B..',
          '..pPppPp.B..',
          '..pppppp.B..',
          '...pppp..y..',
          '...pp.pp....',
          '..pp...pp...',
          '..kk...kk...',
        ], shPal, 2, 2);
      });

      S.create('goblin_shaman_1', 16, 16, function (ctx) {
        dp(ctx, [
          '....rggr....',
          '...gggggg...',
          '..gggrrggg..',
          '..ggggggg...',
          '...pppp.B...',
          '..pppppp.B..',
          '..pPppPp.B..',
          '..pppppp.B..',
          '...pppp..y..',
          '..pp..pp....',
          '..pp..pp....',
          '..kk..kk....',
        ], shPal, 2, 2);
      });

      S.create('goblin_shaman_atk', 16, 16, function (ctx) {
        dp(ctx, [
          '....rggr....',
          '...gggggg...',
          '..gggrrggg..',
          '..ggggggg...',
          '...ppppBB...',
          '..ppppppBy..',
          '..pPppPp....',
          '..pppppp....',
          '...pppp.....',
          '...pp.pp....',
          '..pp...pp...',
          '..kk...kk...',
        ], shPal, 2, 2);
      });

      S.cache['goblin_shaman_atk_1'] = S.cache['goblin_shaman_atk'];
      S.cache['goblin_shaman_atk_2'] = S.cache['goblin_shaman_0'];

      // =================================================================
      // DIRE BOAR (16x16) — stocky tusked beast
      // =================================================================
      var boarPal = {
        b: P.brown, B: P.darkBrown, t: P.tan,
        w: P.white, k: P.black, r: P.red,
        g: P.gray, G: P.darkGray
      };

      S.create('dire_boar_0', 16, 16, function (ctx) {
        dp(ctx, [
          '............',
          '..BBbbbb....',
          '.BbbbbbbB...',
          '.Bbrrbbbbb..',
          '.bbbbbbbbb..',
          'wbbbbbbbbb..',
          '.btbbbtbbb..',
          '..bbbbbbbb..',
          '..BBBBBBBB..',
          '..bb..bb....',
          '..GG..GG....',
          '............',
        ], boarPal, 2, 2);
      });

      S.create('dire_boar_1', 16, 16, function (ctx) {
        dp(ctx, [
          '............',
          '..BBbbbb....',
          '.BbbbbbbB...',
          '.Bbrrbbbbb..',
          '.bbbbbbbbb..',
          'wbbbbbbbbb..',
          '.btbbbtbbb..',
          '..bbbbbbbb..',
          '..BBBBBBBB..',
          '..bb...bb...',
          '..GG...GG...',
          '............',
        ], boarPal, 2, 2);
      });

      S.create('dire_boar_atk', 16, 16, function (ctx) {
        dp(ctx, [
          '............',
          '...BBbbbb...',
          '..BbbbbbbB..',
          'w.Bbrrbbbbb.',
          'w.bbbbbbbbb.',
          '..bbbbbbbbb.',
          '..btbbbtbbb.',
          '..bbbbbbbb..',
          '..BBBBBBBB..',
          '..bb..bb....',
          '..GG..GG....',
          '............',
        ], boarPal, 2, 2);
      });

      S.cache['dire_boar_atk_1'] = S.cache['dire_boar_atk'];
      S.cache['dire_boar_atk_2'] = S.cache['dire_boar_0'];

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

      // Tree variant 1: slightly different canopy shape for variety
      mt('tree_1', function (ctx) {
        // Background grass
        fill(ctx, P.lightGreen);
        dots(ctx, P.green, 6);
        // Trunk (centered, narrow)
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(6, 10, 4, 6);
        ctx.fillStyle = P.brown;
        ctx.fillRect(7, 10, 2, 6);
        // Canopy variant (wider, shifted, different layering)
        circ(ctx, 8, 6, 6, P.darkGreen);
        circ(ctx, 5, 6, 4, P.green);
        circ(ctx, 11, 5, 3, P.green);
        circ(ctx, 7, 3, 3, P.lightGreen);
        circ(ctx, 10, 4, 2, P.lightGreen);
        // Highlight shifted
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(5, 2, 2, 1);
        ctx.fillRect(4, 3, 1, 1);
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

      // Torch flame variant 1: flame leans left, taller
      mt('torch_1', function (ctx) {
        fill(ctx, P.darkStone);
        ctx.fillStyle = P.darkGray;
        for (var r = 0; r < 4; r++) ctx.fillRect(0, r * 4, 16, 1);
        // Bracket
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(6, 7, 4, 2);
        // Handle
        ctx.fillStyle = P.brown;
        ctx.fillRect(7, 6, 2, 8);
        // Flame leaning left, taller shape
        ctx.fillStyle = P.red;
        ctx.fillRect(5, 1, 4, 6);
        ctx.fillStyle = P.gold;
        ctx.fillRect(5, 2, 4, 4);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(6, 1, 2, 4);
        ctx.fillStyle = P.white;
        ctx.fillRect(6, 2, 2, 1);
      });

      // Torch flame variant 2: flame leans right, wider
      mt('torch_2', function (ctx) {
        fill(ctx, P.darkStone);
        ctx.fillStyle = P.darkGray;
        for (var r = 0; r < 4; r++) ctx.fillRect(0, r * 4, 16, 1);
        // Bracket
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(6, 7, 4, 2);
        // Handle
        ctx.fillStyle = P.brown;
        ctx.fillRect(7, 6, 2, 8);
        // Flame leaning right, wider shape
        ctx.fillStyle = P.red;
        ctx.fillRect(7, 2, 4, 5);
        ctx.fillStyle = P.gold;
        ctx.fillRect(7, 3, 4, 3);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(8, 2, 2, 3);
        ctx.fillStyle = P.white;
        ctx.fillRect(8, 3, 2, 1);
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

      // Left half of wide Izuriel Sakazarac statue (32px total across 2 tiles)
      mt('statue_left', function (ctx) {
        // Stone base background
        fill(ctx, P.stone);
        // Pedestal base (extends right)
        ctx.fillStyle = P.darkStone;
        ctx.fillRect(4, 12, 12, 4);
        ctx.fillStyle = P.lightStone;
        ctx.fillRect(4, 12, 12, 1);
        // Body left side — robed figure
        ctx.fillStyle = P.gray;
        ctx.fillRect(8, 4, 8, 8);
        ctx.fillRect(6, 6, 4, 6);
        // Left arm extended outward holding something
        ctx.fillRect(2, 5, 6, 3);
        ctx.fillRect(2, 5, 2, 2);
        // Head left half
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(10, 1, 6, 4);
        ctx.fillRect(12, 0, 4, 2);
        // Crown left half (spires)
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(12, 0, 1, 2);
        ctx.fillRect(14, 0, 1, 1);
        // Face detail left
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(12, 2, 2, 1);
        // Robe folds
        ctx.fillStyle = P.darkStone;
        ctx.fillRect(8, 6, 1, 6);
        ctx.fillRect(10, 8, 1, 4);
        // Left orb/relic in hand
        ctx.fillStyle = P.purple;
        ctx.fillRect(2, 4, 3, 3);
        ctx.fillStyle = P.lightPurple;
        ctx.fillRect(3, 4, 1, 1);
      });

      // Right half of wide Izuriel Sakazarac statue
      mt('statue_right', function (ctx) {
        // Stone base background
        fill(ctx, P.stone);
        // Pedestal base (extends left)
        ctx.fillStyle = P.darkStone;
        ctx.fillRect(0, 12, 12, 4);
        ctx.fillStyle = P.lightStone;
        ctx.fillRect(0, 12, 12, 1);
        // Body right side — robed figure
        ctx.fillStyle = P.gray;
        ctx.fillRect(0, 4, 8, 8);
        ctx.fillRect(6, 6, 4, 6);
        // Right arm raised holding staff
        ctx.fillRect(8, 3, 4, 3);
        ctx.fillRect(10, 1, 2, 4);
        // Staff extends up
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(11, 0, 1, 5);
        // Staff tip gem
        ctx.fillStyle = P.lightPurple;
        ctx.fillRect(10, 0, 3, 1);
        ctx.fillStyle = P.purple;
        ctx.fillRect(11, 0, 1, 1);
        // Head right half
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(0, 1, 6, 4);
        ctx.fillRect(0, 0, 4, 2);
        // Crown right half
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(1, 0, 1, 2);
        ctx.fillRect(3, 0, 1, 1);
        // Face detail right
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(2, 2, 2, 1);
        // Robe folds
        ctx.fillStyle = P.darkStone;
        ctx.fillRect(5, 6, 1, 6);
        ctx.fillRect(7, 8, 1, 4);
        // Inscription on base
        ctx.fillStyle = P.purple;
        ctx.fillRect(2, 13, 1, 1);
        ctx.fillRect(4, 13, 2, 1);
        ctx.fillRect(7, 13, 1, 1);
        ctx.fillRect(9, 13, 2, 1);
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
      // EXAMINE OBJECT SPRITES (16x16 overlays for interactable points)
      // =================================================================

      function me(n, fn) { S.create('exam_' + n, 16, 16, fn); }

      // Bookshelf - small wooden shelf with books against wall
      me('bookshelf', function (ctx) {
        // Shelf frame (dark wood)
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(2, 3, 12, 12);
        ctx.fillStyle = P.brown;
        ctx.fillRect(3, 4, 10, 10);
        // Shelf dividers
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(2, 8, 12, 1);
        // Top row books
        ctx.fillStyle = P.darkRed;
        ctx.fillRect(4, 4, 2, 4);
        ctx.fillStyle = P.darkBlue;
        ctx.fillRect(6, 5, 2, 3);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(8, 4, 2, 4);
        ctx.fillStyle = P.darkPurple;
        ctx.fillRect(10, 5, 2, 3);
        // Bottom row books
        ctx.fillStyle = P.brown;
        ctx.fillRect(4, 9, 3, 4);
        ctx.fillStyle = P.darkRed;
        ctx.fillRect(7, 10, 2, 3);
        ctx.fillStyle = P.darkBlue;
        ctx.fillRect(9, 9, 3, 4);
        // Highlight edge
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(3, 3, 10, 1);
      });

      // Tapestry - hanging fabric with faded pattern
      me('tapestry', function (ctx) {
        // Hanging rod
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(3, 1, 10, 2);
        // Fabric body
        ctx.fillStyle = P.darkRed;
        ctx.fillRect(4, 3, 8, 11);
        // Worn purple edges
        ctx.fillStyle = P.darkPurple;
        ctx.fillRect(4, 3, 1, 11);
        ctx.fillRect(11, 3, 1, 11);
        // Faded central figure (ascending form)
        ctx.fillStyle = P.gold;
        ctx.fillRect(7, 5, 2, 1);
        ctx.fillRect(7, 6, 2, 3);
        ctx.fillRect(6, 7, 1, 1);
        ctx.fillRect(10, 7, 1, 1);
        // Moth holes
        ctx.fillStyle = P.darkStone;
        ctx.fillRect(5, 9, 1, 1);
        ctx.fillRect(9, 6, 1, 1);
        ctx.fillRect(6, 12, 1, 1);
        // Frayed bottom edge
        ctx.fillStyle = P.darkRed;
        ctx.fillRect(5, 14, 2, 1);
        ctx.fillRect(9, 14, 2, 1);
      });

      // Rubble - pile of broken stone fragments
      me('rubble', function (ctx) {
        // Large stone chunks
        ctx.fillStyle = P.stone;
        ctx.fillRect(2, 8, 5, 4);
        ctx.fillRect(7, 9, 4, 3);
        ctx.fillRect(10, 7, 3, 5);
        // Darker fragments on top
        ctx.fillStyle = P.darkStone;
        ctx.fillRect(3, 7, 3, 2);
        ctx.fillRect(8, 8, 3, 2);
        ctx.fillRect(5, 10, 2, 2);
        // Highlight edges
        ctx.fillStyle = P.lightStone;
        ctx.fillRect(2, 8, 5, 1);
        ctx.fillRect(10, 7, 3, 1);
        // Dust/debris dots
        ctx.fillStyle = P.lightStone;
        ctx.fillRect(1, 11, 1, 1);
        ctx.fillRect(6, 12, 1, 1);
        ctx.fillRect(13, 11, 1, 1);
        ctx.fillRect(9, 7, 1, 1);
      });

      // Bones - scattered animal/goblin bones
      me('bones', function (ctx) {
        // Skull (small)
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(5, 6, 4, 3);
        ctx.fillRect(6, 5, 2, 1);
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(5, 7, 1, 1);
        ctx.fillRect(8, 7, 1, 1);
        // Long bone
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(2, 10, 6, 2);
        ctx.fillStyle = P.white;
        ctx.fillRect(2, 10, 6, 1);
        // Ribs
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(9, 8, 1, 4);
        ctx.fillRect(11, 7, 1, 5);
        ctx.fillStyle = P.gray;
        ctx.fillRect(9, 9, 3, 1);
        ctx.fillRect(9, 11, 3, 1);
        // Scattered small bones
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(1, 8, 2, 1);
        ctx.fillRect(12, 11, 3, 1);
      });

      // Goblin war banner - crude flag on a stick
      me('banner', function (ctx) {
        // Pole
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(7, 1, 2, 14);
        // Crude flag (tattered, asymmetric)
        ctx.fillStyle = P.darkRed;
        ctx.fillRect(1, 2, 6, 7);
        ctx.fillStyle = P.red;
        ctx.fillRect(2, 3, 4, 5);
        // Crude goblin skull symbol
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(3, 4, 2, 2);
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(3, 5, 1, 1);
        ctx.fillRect(4, 5, 1, 1);
        // Tattered edge
        ctx.fillStyle = P.darkRed;
        ctx.fillRect(1, 9, 2, 1);
        ctx.fillRect(4, 9, 1, 2);
        // Pole tip (bone ornament)
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(6, 0, 4, 2);
      });

      // Dry fountain - cracked stone basin
      me('fountain', function (ctx) {
        // Basin base (round-ish)
        ctx.fillStyle = P.stone;
        ctx.fillRect(2, 7, 12, 6);
        ctx.fillRect(4, 6, 8, 1);
        ctx.fillRect(3, 13, 10, 1);
        // Basin interior (darker)
        ctx.fillStyle = P.darkStone;
        ctx.fillRect(4, 8, 8, 4);
        // Central column stump
        ctx.fillStyle = P.lightStone;
        ctx.fillRect(6, 4, 4, 5);
        ctx.fillStyle = P.stone;
        ctx.fillRect(7, 3, 2, 2);
        // Cracks
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(4, 9, 1, 3);
        ctx.fillRect(5, 11, 2, 1);
        ctx.fillRect(10, 8, 1, 2);
        // Water stain
        ctx.fillStyle = P.darkBlue;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(5, 9, 6, 2);
        ctx.globalAlpha = 1;
        // Rim highlight
        ctx.fillStyle = P.lightStone;
        ctx.fillRect(4, 7, 8, 1);
      });

      // Stone face fragment - broken statue face on the ground
      me('stone_face', function (ctx) {
        // Broken stone chunk
        ctx.fillStyle = P.stone;
        ctx.fillRect(3, 6, 10, 8);
        ctx.fillRect(5, 5, 6, 1);
        // Face carved into stone
        ctx.fillStyle = P.darkStone;
        ctx.fillRect(5, 7, 2, 1);   // left eye socket
        ctx.fillRect(9, 7, 2, 1);   // right eye socket
        // Eyes still watching
        ctx.fillStyle = P.lightPurple;
        ctx.fillRect(5, 7, 1, 1);
        ctx.fillRect(10, 7, 1, 1);
        // Broken nose
        ctx.fillStyle = P.lightStone;
        ctx.fillRect(7, 8, 2, 2);
        // Claw marks across face
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(4, 9, 1, 3);
        ctx.fillRect(6, 10, 1, 2);
        ctx.fillRect(8, 9, 1, 3);
        ctx.fillRect(11, 10, 1, 2);
        // Broken edge
        ctx.fillStyle = P.lightStone;
        ctx.fillRect(3, 6, 10, 1);
      });

      // Rune stone - carved stone tablet on temple floor
      me('rune_stone', function (ctx) {
        // Stone slab
        ctx.fillStyle = P.stone;
        ctx.fillRect(3, 5, 10, 8);
        ctx.fillRect(4, 4, 8, 1);
        ctx.fillRect(4, 13, 8, 1);
        // Darker inset
        ctx.fillStyle = P.darkStone;
        ctx.fillRect(4, 6, 8, 6);
        // Glowing rune spirals
        ctx.fillStyle = P.purple;
        ctx.fillRect(5, 7, 1, 1);
        ctx.fillRect(6, 8, 1, 1);
        ctx.fillRect(7, 7, 2, 1);
        ctx.fillRect(9, 8, 1, 1);
        ctx.fillRect(10, 7, 1, 1);
        ctx.fillRect(7, 9, 2, 1);
        ctx.fillRect(5, 10, 1, 1);
        ctx.fillRect(10, 10, 1, 1);
        // Faint glow on runes
        ctx.fillStyle = P.lightPurple;
        ctx.fillRect(7, 7, 1, 1);
        ctx.fillRect(8, 9, 1, 1);
        // Stone edge highlight
        ctx.fillStyle = P.lightStone;
        ctx.fillRect(3, 5, 10, 1);
      });

      // Abandoned market sign - wooden post with hanging sign
      me('market_sign', function (ctx) {
        // Post
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(7, 3, 2, 13);
        // Hanging sign board
        ctx.fillStyle = P.brown;
        ctx.fillRect(2, 4, 12, 8);
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(3, 5, 10, 6);
        // Faded text lines
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(4, 6, 5, 1);
        ctx.fillRect(4, 8, 7, 1);
        ctx.fillRect(5, 10, 4, 1);
        // Hanging chains
        ctx.fillStyle = P.gray;
        ctx.fillRect(3, 3, 1, 2);
        ctx.fillRect(12, 3, 1, 2);
        // Sign tilted slightly (one chain broken)
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(13, 8, 1, 4);
      });

      // Forge anvil - Braxon's anvil inside his shop
      me('anvil', function (ctx) {
        // Anvil base
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(3, 10, 10, 4);
        // Anvil body
        ctx.fillStyle = P.gray;
        ctx.fillRect(4, 6, 8, 5);
        // Anvil horn (pointed end left)
        ctx.fillRect(1, 7, 4, 3);
        ctx.fillRect(0, 8, 2, 1);
        // Anvil heel (right)
        ctx.fillRect(11, 7, 3, 3);
        // Top face (working surface)
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(4, 6, 8, 1);
        ctx.fillRect(2, 7, 3, 1);
        // Hammer marks on surface
        ctx.fillStyle = P.darkStone;
        ctx.fillRect(6, 6, 1, 1);
        ctx.fillRect(9, 6, 1, 1);
        ctx.fillRect(7, 7, 2, 1);
        // Legs visible
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(4, 13, 2, 1);
        ctx.fillRect(10, 13, 2, 1);
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

      // =================================================================
      // PASS 5B: CHARACTER PORTRAITS (32x32, chest-up, for dialogue)
      // =================================================================

      function mp(name, fn) { S.create('portrait_' + name, 64, 64, fn); }

      // Fawks - warm, round face, barkeep apron
      // Fawks - nonbinary innkeeper (they/them), fashionable, warm, kind eyes
      mp('fawks', function (ctx) {
        // Warm tavern background — rich amber glow
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#241810';
        ctx.fillRect(4, 6, 56, 58);
        ctx.fillStyle = '#2a1c14';
        ctx.fillRect(8, 10, 48, 50);

        // Shoulders — white button-down shirt with dark vest
        // Shirt base — crisp white, visible at shoulders and collar
        ctx.fillStyle = '#c8c8c8';
        ctx.fillRect(6, 46, 52, 18);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(8, 46, 48, 16);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(10, 47, 44, 14);
        // Vest over shirt — fitted, charcoal with subtle sheen
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(12, 46, 40, 18);
        ctx.fillStyle = '#2a2a34';
        ctx.fillRect(14, 47, 36, 16);
        ctx.fillStyle = '#323240';
        ctx.fillRect(16, 48, 32, 14);
        // Vest lapels — angled, tailored
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(14, 46, 4, 10);
        ctx.fillRect(46, 46, 4, 10);
        ctx.fillStyle = '#3a3a48';
        ctx.fillRect(15, 47, 2, 8);
        ctx.fillRect(47, 47, 2, 8);
        // Vest buttons — three small brass buttons down center
        ctx.fillStyle = '#a08830';
        ctx.fillRect(31, 48, 2, 2);
        ctx.fillRect(31, 52, 2, 2);
        ctx.fillRect(31, 56, 2, 2);
        ctx.fillStyle = '#c0a840';
        ctx.fillRect(31, 48, 1, 1);
        ctx.fillRect(31, 52, 1, 1);
        ctx.fillRect(31, 56, 1, 1);
        // Shirt collar — white, popped slightly above vest
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(22, 40, 20, 7);
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(24, 40, 16, 6);
        // Collar points
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(22, 40, 3, 4);
        ctx.fillRect(39, 40, 3, 4);
        // Collar shadow
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(24, 45, 16, 1);
        // Top button undone — hint of skin
        ctx.fillStyle = P.skin;
        ctx.fillRect(29, 41, 6, 3);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(30, 41, 4, 2);
        // Shirt sleeve edges peeking past vest at shoulders
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(8, 47, 4, 6);
        ctx.fillRect(52, 47, 4, 6);

        // Neck — graceful, slender
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(25, 36, 14, 8);
        ctx.fillStyle = P.skin;
        ctx.fillRect(26, 36, 12, 7);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(27, 37, 10, 4);

        // Face — soft-featured, warm, androgynous
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(14, 14, 36, 24);
        ctx.fillStyle = P.skin;
        ctx.fillRect(16, 14, 32, 23);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(18, 16, 28, 20);
        // Warm cheeks — soft firelight glow
        ctx.fillStyle = '#e8b898';
        ctx.fillRect(18, 28, 5, 4);
        ctx.fillRect(41, 28, 5, 4);
        ctx.fillStyle = '#f0c0a0';
        ctx.fillRect(19, 29, 3, 2);
        ctx.fillRect(42, 29, 3, 2);
        // Soft jawline — androgynous
        ctx.fillStyle = P.skin;
        ctx.fillRect(16, 34, 2, 3);
        ctx.fillRect(46, 34, 2, 3);
        ctx.fillRect(18, 36, 2, 1);
        ctx.fillRect(44, 36, 2, 1);

        // Eyes — warm amber, large, expressive
        // Groomed brows — arched, intentional
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(20, 18, 10, 2);
        ctx.fillRect(36, 18, 10, 2);
        ctx.fillRect(19, 19, 2, 1);
        ctx.fillRect(45, 19, 2, 1);
        // Eye whites
        ctx.fillStyle = '#f0e8e0';
        ctx.fillRect(20, 22, 10, 6);
        ctx.fillRect(36, 22, 10, 6);
        // Upper eyelid line
        ctx.fillStyle = '#5a3820';
        ctx.fillRect(20, 21, 10, 1);
        ctx.fillRect(36, 21, 10, 1);
        // Amber irises
        ctx.fillStyle = '#7a4a10';
        ctx.fillRect(22, 22, 7, 6);
        ctx.fillRect(38, 22, 7, 6);
        ctx.fillStyle = '#9a6020';
        ctx.fillRect(23, 23, 5, 4);
        ctx.fillRect(39, 23, 5, 4);
        ctx.fillStyle = '#b07820';
        ctx.fillRect(24, 24, 3, 2);
        ctx.fillRect(40, 24, 3, 2);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(25, 24, 2, 2);
        ctx.fillRect(41, 24, 2, 2);
        // Warm catch-light
        ctx.fillStyle = '#f0d8a0';
        ctx.fillRect(23, 22, 2, 2);
        ctx.fillRect(39, 22, 2, 2);
        ctx.fillStyle = '#f8e8c0';
        ctx.fillRect(23, 22, 1, 1);
        ctx.fillRect(39, 22, 1, 1);
        // Lower lash line
        ctx.fillStyle = '#b09878';
        ctx.fillRect(20, 28, 10, 1);
        ctx.fillRect(36, 28, 10, 1);
        // Smile crinkles
        ctx.fillStyle = P.skin;
        ctx.fillRect(18, 26, 2, 2);
        ctx.fillRect(46, 26, 2, 2);

        // Nose — neat, defined bridge
        ctx.fillStyle = P.skin;
        ctx.fillRect(30, 26, 4, 5);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(29, 30, 2, 1);
        ctx.fillRect(33, 30, 2, 1);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(31, 26, 2, 3);

        // Mouth — warm, genuine smile
        ctx.fillStyle = '#a04848';
        ctx.fillRect(24, 34, 16, 2);
        ctx.fillStyle = '#c06868';
        ctx.fillRect(26, 34, 12, 2);
        ctx.fillStyle = '#904040';
        ctx.fillRect(28, 33, 8, 1);
        // Upturned corners
        ctx.fillStyle = '#a04848';
        ctx.fillRect(23, 33, 2, 1);
        ctx.fillRect(39, 33, 2, 1);
        // Lower lip highlight
        ctx.fillStyle = '#d08080';
        ctx.fillRect(28, 35, 8, 1);
        ctx.fillStyle = P.skin;
        ctx.fillRect(26, 36, 12, 1);

        // Hair — auburn, styled with a dramatic flop over the right eye
        // Base mass — rich dark auburn, swept from left to right
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(10, 4, 44, 14);
        ctx.fillRect(8, 8, 6, 18);
        ctx.fillRect(50, 8, 6, 10);
        ctx.fillRect(14, 2, 34, 4);
        ctx.fillRect(8, 4, 8, 8);
        // Auburn mid-tones
        ctx.fillStyle = '#6a3018';
        ctx.fillRect(14, 4, 8, 8);
        ctx.fillRect(26, 3, 8, 8);
        ctx.fillRect(38, 4, 10, 8);
        // Warm highlights — glossy, well-kept
        ctx.fillStyle = '#904820';
        ctx.fillRect(16, 4, 3, 6);
        ctx.fillRect(30, 3, 3, 6);
        ctx.fillRect(42, 4, 3, 6);
        ctx.fillStyle = '#b06028';
        ctx.fillRect(18, 5, 2, 4);
        ctx.fillRect(32, 4, 2, 4);
        ctx.fillRect(44, 5, 2, 4);
        // THE FLOP — dramatic swoop of hair falling over right eye
        // Sweeps from top-left across forehead, droops over right eye
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(34, 12, 16, 6);
        ctx.fillRect(38, 10, 14, 4);
        ctx.fillRect(40, 14, 12, 6);
        ctx.fillRect(44, 18, 10, 6);
        ctx.fillRect(48, 22, 6, 4);
        // Flop mid-tones — shows the curve and body
        ctx.fillStyle = '#6a3018';
        ctx.fillRect(36, 12, 12, 4);
        ctx.fillRect(40, 14, 10, 4);
        ctx.fillRect(44, 18, 8, 4);
        ctx.fillRect(48, 22, 4, 3);
        // Flop highlights — the glossy arc
        ctx.fillStyle = '#904820';
        ctx.fillRect(38, 12, 4, 3);
        ctx.fillRect(42, 14, 4, 3);
        ctx.fillRect(46, 18, 3, 3);
        ctx.fillStyle = '#b06028';
        ctx.fillRect(40, 12, 2, 2);
        ctx.fillRect(44, 15, 2, 2);
        ctx.fillRect(47, 19, 2, 2);
        // Left side — swept back behind ear, shorter
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(6, 12, 6, 14);
        ctx.fillRect(4, 8, 4, 10);
        ctx.fillStyle = '#6a3018';
        ctx.fillRect(7, 14, 4, 8);
        ctx.fillStyle = '#904820';
        ctx.fillRect(8, 16, 2, 4);

        // Left ear visible (hair swept back on this side)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(10, 24, 4, 6);
        ctx.fillStyle = P.skin;
        ctx.fillRect(11, 25, 2, 4);
        // Gold earring
        ctx.fillStyle = P.gold;
        ctx.fillRect(9, 26, 2, 4);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(9, 26, 1, 2);
        ctx.fillStyle = P.lightPurple;
        ctx.fillRect(9, 29, 2, 1);
      });

      // Helena - halfline village leader, short curly strawberry red hair, chain of office
      mp('helena', function (ctx) {
        // Muted green-dark background (her office, candlelit)
        ctx.fillStyle = '#0a140a';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#0e1a0e';
        ctx.fillRect(4, 10, 56, 54);
        ctx.fillStyle = '#101c10';
        ctx.fillRect(8, 14, 48, 46);

        // Shoulders — high-collared green vestment (looks big on her)
        ctx.fillStyle = '#1a4a1a';
        ctx.fillRect(4, 48, 56, 16);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(8, 48, 48, 14);
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(12, 49, 40, 12);
        // Tall stiff collar — a bit oversized for her halfline frame
        ctx.fillStyle = '#1a4a1a';
        ctx.fillRect(14, 40, 8, 10);
        ctx.fillRect(42, 40, 8, 10);
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(16, 41, 5, 8);
        ctx.fillRect(43, 41, 5, 8);
        // Collar gold trim
        ctx.fillStyle = P.gold;
        ctx.fillRect(14, 40, 2, 8);
        ctx.fillRect(48, 40, 2, 8);
        // Chain of office — ornate gold, slightly big on her
        ctx.fillStyle = P.gold;
        ctx.fillRect(22, 48, 2, 1);
        ctx.fillRect(24, 49, 2, 1);
        ctx.fillRect(26, 48, 3, 1);
        ctx.fillRect(29, 49, 2, 1);
        ctx.fillRect(33, 49, 2, 1);
        ctx.fillRect(35, 48, 3, 1);
        ctx.fillRect(38, 49, 2, 1);
        ctx.fillRect(40, 48, 2, 1);
        // Pendant — green gem in gold setting
        ctx.fillStyle = P.gold;
        ctx.fillRect(29, 50, 6, 5);
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(30, 51, 4, 3);
        ctx.fillStyle = P.paleGreen;
        ctx.fillRect(31, 51, 2, 2);

        // Neck — short, sturdy (halfline build)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(24, 38, 16, 8);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(25, 38, 14, 6);
        ctx.fillStyle = '#f4ddc4';
        ctx.fillRect(26, 38, 12, 5);

        // Face — round, soft, warm (halfline heritage)
        ctx.fillStyle = P.skin;
        ctx.fillRect(12, 16, 40, 24);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(14, 16, 36, 23);
        ctx.fillStyle = '#f4ddc4';
        ctx.fillRect(16, 18, 32, 20);
        // Full round cheeks (halfline trait)
        ctx.fillStyle = '#f0c8a8';
        ctx.fillRect(16, 28, 7, 5);
        ctx.fillRect(41, 28, 7, 5);
        ctx.fillStyle = '#e8c0a0';
        ctx.fillRect(17, 29, 5, 3);
        ctx.fillRect(42, 29, 5, 3);
        // Freckles — scattered across nose and cheeks (strawberry redhead)
        ctx.fillStyle = '#d0a080';
        ctx.fillRect(20, 27, 1, 1); ctx.fillRect(22, 26, 1, 1);
        ctx.fillRect(27, 25, 1, 1); ctx.fillRect(29, 26, 1, 1);
        ctx.fillRect(35, 26, 1, 1); ctx.fillRect(37, 25, 1, 1);
        ctx.fillRect(42, 27, 1, 1); ctx.fillRect(44, 26, 1, 1);
        ctx.fillRect(24, 29, 1, 1); ctx.fillRect(26, 28, 1, 1);
        ctx.fillRect(38, 28, 1, 1); ctx.fillRect(40, 29, 1, 1);
        ctx.fillRect(31, 27, 1, 1); ctx.fillRect(33, 27, 1, 1);
        // Soft round jawline
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(14, 36, 3, 3);
        ctx.fillRect(47, 36, 3, 3);
        ctx.fillRect(17, 38, 2, 1);
        ctx.fillRect(45, 38, 2, 1);

        // Eyes — large bright green (halfline proportion: big relative to face)
        // Strawberry-tinted brows — expressive arches
        ctx.fillStyle = '#a04818';
        ctx.fillRect(18, 20, 11, 2);
        ctx.fillRect(37, 20, 11, 2);
        ctx.fillStyle = '#803810';
        ctx.fillRect(19, 20, 9, 1);
        ctx.fillRect(38, 20, 9, 1);
        // Eye whites — large, bright, open
        ctx.fillStyle = '#f0e8e0';
        ctx.fillRect(18, 23, 12, 6);
        ctx.fillRect(36, 23, 12, 6);
        // Upper lid line
        ctx.fillStyle = '#804020';
        ctx.fillRect(18, 22, 12, 1);
        ctx.fillRect(36, 22, 12, 1);
        // Green irises — vivid, steady (large at this scale)
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(20, 23, 9, 6);
        ctx.fillRect(38, 23, 9, 6);
        ctx.fillStyle = P.green;
        ctx.fillRect(22, 24, 5, 4);
        ctx.fillRect(40, 24, 5, 4);
        // Bright iris center
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(23, 25, 3, 2);
        ctx.fillRect(41, 25, 3, 2);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(24, 25, 2, 2);
        ctx.fillRect(42, 25, 2, 2);
        // Warm catch-light (candlelit)
        ctx.fillStyle = '#f0e8d0';
        ctx.fillRect(22, 23, 2, 2);
        ctx.fillRect(40, 23, 2, 2);
        ctx.fillStyle = '#f8f0e0';
        ctx.fillRect(22, 23, 1, 1);
        ctx.fillRect(40, 23, 1, 1);
        // Lower lash line
        ctx.fillStyle = '#c0a088';
        ctx.fillRect(18, 29, 12, 1);
        ctx.fillRect(36, 29, 12, 1);

        // Nose — small, upturned (a charming halfline nose)
        ctx.fillStyle = P.skin;
        ctx.fillRect(30, 26, 4, 5);
        ctx.fillStyle = '#e0b898';
        ctx.fillRect(29, 30, 2, 1);
        ctx.fillRect(33, 30, 2, 1);
        // Tiny upturned tip
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(31, 27, 2, 2);

        // Mouth — composed, firm but kind (she carries the town)
        ctx.fillStyle = '#b04848';
        ctx.fillRect(24, 34, 16, 2);
        ctx.fillStyle = '#d06868';
        ctx.fillRect(26, 34, 12, 2);
        // Upper lip bow
        ctx.fillStyle = '#a04040';
        ctx.fillRect(28, 33, 8, 1);
        ctx.fillRect(31, 33, 2, 1);
        // Firm corners (composed)
        ctx.fillStyle = '#f4ddc4';
        ctx.fillRect(22, 34, 2, 1);
        ctx.fillRect(40, 34, 2, 1);
        // Lower lip
        ctx.fillStyle = '#d87878';
        ctx.fillRect(28, 36, 8, 1);

        // Hair — short bouncy strawberry red curls (the defining feature!)
        // Base curl mass
        ctx.fillStyle = '#8a2a10';
        ctx.fillRect(10, 6, 44, 14);
        ctx.fillRect(8, 10, 6, 12);
        ctx.fillRect(50, 10, 6, 12);
        // Curly top silhouette — irregular bumps = individual curls
        ctx.fillRect(12, 4, 8, 4);
        ctx.fillRect(22, 2, 8, 6);
        ctx.fillRect(32, 4, 8, 4);
        ctx.fillRect(42, 4, 6, 4);
        ctx.fillRect(16, 2, 6, 4);
        // Strawberry highlights — warm orange-red tones
        ctx.fillStyle = '#c04818';
        ctx.fillRect(14, 6, 5, 6);
        ctx.fillRect(24, 4, 5, 6);
        ctx.fillRect(34, 6, 5, 6);
        ctx.fillRect(44, 6, 5, 6);
        ctx.fillRect(18, 3, 4, 4);
        // Bright curl tips catching candlelight
        ctx.fillStyle = '#d86030';
        ctx.fillRect(16, 6, 2, 4);
        ctx.fillRect(26, 4, 2, 4);
        ctx.fillRect(36, 6, 2, 4);
        ctx.fillRect(46, 6, 2, 4);
        ctx.fillRect(20, 3, 2, 3);
        // Hot highlights (candlelight on curls)
        ctx.fillStyle = '#e87838';
        ctx.fillRect(17, 7, 1, 2);
        ctx.fillRect(27, 5, 1, 2);
        ctx.fillRect(37, 7, 1, 2);
        ctx.fillRect(47, 7, 1, 2);
        // Deep shadows between curls
        ctx.fillStyle = '#601808';
        ctx.fillRect(20, 8, 2, 6);
        ctx.fillRect(30, 6, 2, 6);
        ctx.fillRect(40, 8, 2, 6);
        ctx.fillRect(13, 8, 2, 4);
        ctx.fillRect(48, 8, 2, 4);
        // Side curls — short, bouncy, framing the round face
        ctx.fillStyle = '#8a2a10';
        ctx.fillRect(8, 18, 5, 8);
        ctx.fillRect(51, 18, 5, 8);
        ctx.fillStyle = '#c04818';
        ctx.fillRect(9, 20, 3, 4);
        ctx.fillRect(52, 20, 3, 4);
        ctx.fillStyle = '#d86030';
        ctx.fillRect(10, 21, 1, 2);
        ctx.fillRect(53, 21, 1, 2);
        // Temple wisps — little curls escaping
        ctx.fillStyle = '#8a2a10';
        ctx.fillRect(14, 18, 2, 3);
        ctx.fillRect(48, 18, 2, 3);
      });

      // Elira Voss - half-elf guard captain (she/her), severe face, pointed ears, scar
      mp('elira', function (ctx) {
        // Cold steel-blue background (garrison, pre-dawn)
        ctx.fillStyle = '#0e0e1a';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#141420';
        ctx.fillRect(4, 6, 56, 58);
        ctx.fillStyle = '#181828';
        ctx.fillRect(8, 10, 48, 50);

        // Armor — layered plate, battle-worn, imposing
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(4, 46, 56, 18);
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(8, 46, 48, 16);
        ctx.fillStyle = '#3a3a48';
        ctx.fillRect(12, 47, 40, 14);
        // Pauldrons — raised, angular, battle-scarred
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(2, 42, 14, 10);
        ctx.fillRect(48, 42, 14, 10);
        // Pauldron highlights (metal sheen)
        ctx.fillStyle = P.gray;
        ctx.fillRect(4, 42, 10, 2);
        ctx.fillRect(50, 42, 10, 2);
        ctx.fillStyle = '#5a5a6a';
        ctx.fillRect(6, 42, 6, 1);
        ctx.fillRect(52, 42, 6, 1);
        // Pauldron rivets
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(6, 46, 2, 2); ctx.fillRect(12, 46, 2, 2);
        ctx.fillRect(50, 46, 2, 2); ctx.fillRect(56, 46, 2, 2);
        // Battle damage on left pauldron (scratch)
        ctx.fillStyle = '#4a4a5a';
        ctx.fillRect(8, 44, 1, 3);
        // Gorget (neck armor)
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(18, 40, 28, 6);
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(20, 40, 24, 4);
        ctx.fillStyle = '#4a4a5a';
        ctx.fillRect(22, 40, 20, 1);

        // Neck — long, elegant (elven heritage showing through the armor)
        ctx.fillStyle = '#8a6848';
        ctx.fillRect(24, 34, 16, 8);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(25, 34, 14, 7);
        ctx.fillStyle = P.skin;
        ctx.fillRect(26, 34, 12, 6);

        // Face — narrow, severe, angular (half-elf: sharper than human)
        ctx.fillStyle = '#8a6848';
        ctx.fillRect(14, 10, 36, 28);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(16, 10, 32, 26);
        ctx.fillStyle = P.skin;
        ctx.fillRect(18, 12, 28, 23);
        // Extremely high sharp cheekbones (elven severity)
        ctx.fillStyle = '#d0a878';
        ctx.fillRect(18, 24, 5, 2);
        ctx.fillRect(41, 24, 5, 2);
        // Hollow beneath cheekbones (gaunt, severe)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(18, 26, 3, 4);
        ctx.fillRect(43, 26, 3, 4);
        // Narrow jaw — tapers sharply (half-elf bone structure)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(16, 32, 3, 4);
        ctx.fillRect(45, 32, 3, 4);
        ctx.fillRect(19, 35, 2, 2);
        ctx.fillRect(43, 35, 2, 2);
        // Sharp chin
        ctx.fillStyle = P.skin;
        ctx.fillRect(26, 36, 12, 1);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(24, 36, 2, 1);
        ctx.fillRect(38, 36, 2, 1);

        // Pointed ears — elven heritage, prominent
        // Left ear
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(6, 16, 8, 10);
        ctx.fillStyle = P.skin;
        ctx.fillRect(8, 17, 5, 7);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(9, 18, 3, 5);
        // Left ear point (extends upward and outward)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(4, 10, 5, 8);
        ctx.fillStyle = P.skin;
        ctx.fillRect(5, 12, 3, 4);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(6, 13, 1, 2);
        // Right ear
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(50, 16, 8, 10);
        ctx.fillStyle = P.skin;
        ctx.fillRect(51, 17, 5, 7);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(52, 18, 3, 5);
        // Right ear point
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(55, 10, 5, 8);
        ctx.fillStyle = P.skin;
        ctx.fillRect(56, 12, 3, 4);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(57, 13, 1, 2);

        // Eyes — narrow, severe, upswept (elven slant)
        // Brows — severe, straight, low, heavy (intimidating)
        ctx.fillStyle = '#1a1010';
        ctx.fillRect(19, 16, 12, 2);
        ctx.fillRect(35, 16, 12, 2);
        // Inner brow emphasis (permanent scowl)
        ctx.fillStyle = '#1a1010';
        ctx.fillRect(29, 18, 3, 1);
        ctx.fillRect(34, 18, 3, 1);
        // Eye whites — narrow, hooded (she does not look approachable)
        ctx.fillStyle = '#e0d8d0';
        ctx.fillRect(20, 20, 12, 4);
        ctx.fillRect(36, 20, 12, 4);
        // Dark brown irises — large in the narrow slit
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(22, 20, 8, 4);
        ctx.fillRect(38, 20, 8, 4);
        // Iris ring
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(24, 21, 4, 2);
        ctx.fillRect(40, 21, 4, 2);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(25, 21, 2, 2);
        ctx.fillRect(41, 21, 2, 2);
        // Steel catch-light (cold garrison light)
        ctx.fillStyle = '#c0c8d8';
        ctx.fillRect(23, 20, 2, 2);
        ctx.fillRect(39, 20, 2, 2);
        // Heavy under-eye shadow (severity carved into her face)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(20, 24, 12, 2);
        ctx.fillRect(36, 24, 12, 2);
        // Elven upswept line at outer corners
        ctx.fillStyle = '#1a1010';
        ctx.fillRect(18, 20, 2, 2);
        ctx.fillRect(48, 20, 2, 2);
        ctx.fillRect(17, 19, 2, 1);
        ctx.fillRect(49, 19, 2, 1);

        // Nose — long, straight, narrow (elven bridge)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(30, 22, 4, 8);
        ctx.fillStyle = P.skin;
        ctx.fillRect(30, 22, 3, 7);
        // Bridge highlight
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(31, 23, 1, 4);
        // Narrow nostrils
        ctx.fillStyle = '#8a6848';
        ctx.fillRect(29, 29, 2, 1);
        ctx.fillRect(33, 29, 2, 1);

        // Mouth — thin, severe, downturned
        ctx.fillStyle = '#704040';
        ctx.fillRect(25, 32, 14, 2);
        ctx.fillStyle = '#885050';
        ctx.fillRect(27, 32, 10, 2);
        // Downturned corners (resting severity)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(23, 32, 2, 2);
        ctx.fillRect(39, 32, 2, 2);
        ctx.fillStyle = '#704040';
        ctx.fillRect(23, 34, 2, 1);
        ctx.fillRect(39, 34, 2, 1);
        // Upper lip — thin, precise
        ctx.fillStyle = '#604040';
        ctx.fillRect(27, 31, 10, 1);

        // Scar — jagged, healed, prominent (right side, badge of service)
        ctx.fillStyle = '#d08888';
        ctx.fillRect(43, 14, 2, 2);
        ctx.fillRect(42, 16, 2, 2);
        ctx.fillRect(43, 18, 2, 2);
        ctx.fillRect(42, 20, 2, 2);
        ctx.fillRect(43, 22, 2, 2);
        ctx.fillRect(42, 24, 2, 2);
        ctx.fillRect(41, 26, 2, 2);
        ctx.fillRect(41, 28, 2, 2);
        // Scar shadow (depth, texture)
        ctx.fillStyle = '#a06060';
        ctx.fillRect(44, 16, 1, 2);
        ctx.fillRect(45, 20, 1, 2);
        ctx.fillRect(44, 24, 1, 2);
        ctx.fillRect(43, 28, 1, 1);

        // Hair — cropped short, military cut, near-black (no-nonsense)
        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(14, 2, 36, 12);
        ctx.fillRect(16, 0, 32, 4);
        // Tight to the skull (practical)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(16, 2, 32, 10);
        // Subtle sheen (healthy but strictly maintained)
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(22, 3, 8, 4);
        ctx.fillRect(36, 3, 6, 4);
        ctx.fillStyle = '#303040';
        ctx.fillRect(24, 3, 4, 2);
        ctx.fillRect(38, 3, 3, 2);
        // Sides clipped tight above the ears
        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(12, 8, 4, 10);
        ctx.fillRect(48, 8, 4, 10);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(13, 10, 2, 6);
        ctx.fillRect(49, 10, 2, 6);
      });

      // Braxon - gruff, broad, beard
      // Braxon - gruff blacksmith, broad, bushy beard, forge-lit
      mp('braxon', function (ctx) {
        // Forge glow background
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(4, 6, 56, 58);
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(8, 10, 48, 50);

        // Broad shoulders — thick leather apron over bare arms
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(2, 44, 60, 20);
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(6, 44, 52, 18);
        // Forge apron — thick leather, stained
        ctx.fillStyle = '#6a2020';
        ctx.fillRect(20, 48, 24, 16);
        ctx.fillStyle = '#802828';
        ctx.fillRect(22, 49, 20, 14);
        // Apron straps
        ctx.fillStyle = '#5a1818';
        ctx.fillRect(20, 44, 3, 6);
        ctx.fillRect(41, 44, 3, 6);
        // Bare arms showing (thick, muscular)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(6, 44, 14, 8);
        ctx.fillRect(44, 44, 14, 8);
        ctx.fillStyle = P.skin;
        ctx.fillRect(8, 45, 10, 6);
        ctx.fillRect(46, 45, 10, 6);

        // Neck — thick, bull-necked
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(22, 34, 20, 12);
        ctx.fillStyle = P.skin;
        ctx.fillRect(24, 34, 16, 10);

        // Face — broad, weathered, friendly-gruff
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(12, 10, 40, 26);
        ctx.fillStyle = P.skin;
        ctx.fillRect(14, 10, 36, 24);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(16, 12, 32, 21);
        // Forge-heated cheeks
        ctx.fillStyle = '#e0a888';
        ctx.fillRect(16, 24, 6, 4);
        ctx.fillRect(42, 24, 6, 4);
        // Heavy jaw — square, strong
        ctx.fillStyle = P.skin;
        ctx.fillRect(14, 30, 2, 4);
        ctx.fillRect(48, 30, 2, 4);

        // Eyes — small, deep-set under heavy brows (gruff but warm)
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(19, 16, 12, 2);
        ctx.fillRect(37, 16, 12, 2);
        // Heavy brow ridge
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(18, 15, 14, 2);
        ctx.fillRect(36, 15, 14, 2);
        // Eye whites — small (deep-set)
        ctx.fillStyle = '#e0d8d0';
        ctx.fillRect(20, 19, 8, 4);
        ctx.fillRect(38, 19, 8, 4);
        // Dark brown irises
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(22, 19, 5, 4);
        ctx.fillRect(40, 19, 5, 4);
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(23, 20, 3, 2);
        ctx.fillRect(41, 20, 3, 2);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(24, 20, 2, 2);
        ctx.fillRect(42, 20, 2, 2);
        // Forge-fire catch-light (orange glow)
        ctx.fillStyle = '#f0a860';
        ctx.fillRect(22, 19, 2, 2);
        ctx.fillRect(40, 19, 2, 2);

        // Nose — broad, broken once (maybe twice)
        ctx.fillStyle = P.skin;
        ctx.fillRect(29, 22, 6, 6);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(28, 27, 2, 1);
        ctx.fillRect(34, 27, 2, 1);
        // Slightly crooked bridge
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(30, 22, 3, 4);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(32, 23, 2, 3);

        // MASSIVE bushy beard — his defining feature
        ctx.fillStyle = P.brown;
        ctx.fillRect(14, 28, 36, 16);
        ctx.fillRect(12, 30, 40, 14);
        ctx.fillRect(10, 34, 44, 10);
        // Beard volume (lighter mid-tones)
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(16, 30, 32, 10);
        ctx.fillRect(14, 32, 36, 8);
        // Beard texture — individual strand clusters
        ctx.fillStyle = P.brown;
        ctx.fillRect(18, 32, 2, 8); ctx.fillRect(24, 34, 2, 6);
        ctx.fillRect(30, 32, 2, 8); ctx.fillRect(36, 34, 2, 6);
        ctx.fillRect(42, 32, 2, 8);
        // Beard highlights (forge glow)
        ctx.fillStyle = P.tan;
        ctx.fillRect(20, 30, 3, 4);
        ctx.fillRect(32, 30, 3, 4);
        ctx.fillRect(26, 32, 3, 3);
        // Darker shadow strands
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(16, 36, 2, 6); ctx.fillRect(22, 38, 2, 4);
        ctx.fillRect(28, 36, 2, 6); ctx.fillRect(34, 38, 2, 4);
        ctx.fillRect(40, 36, 2, 6);
        // Mouth hidden in beard — just a darker line
        ctx.fillStyle = '#804040';
        ctx.fillRect(26, 30, 12, 1);

        // Hair — bald on top, thin dark fringe
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(14, 4, 36, 10);
        ctx.fillRect(12, 8, 4, 6);
        ctx.fillRect(48, 8, 4, 6);
        // Bald crown — skin showing through
        ctx.fillStyle = P.skin;
        ctx.fillRect(18, 5, 28, 6);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(22, 6, 20, 4);
        // Thin remaining hair
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(20, 4, 2, 3);
        ctx.fillRect(26, 4, 2, 2);
        ctx.fillRect(36, 4, 2, 2);
        ctx.fillRect(42, 4, 2, 3);
        // Sweat on bald head (forge heat)
        ctx.fillStyle = 'rgba(200, 200, 220, 0.3)';
        ctx.fillRect(28, 6, 2, 1);
        ctx.fillRect(34, 7, 2, 1);
      });

      // Rorik Flamebeard - red-haired dwarf, magnificent braided beard, chain mail
      mp('rorik', function (ctx) {
        // Warm stone background
        ctx.fillStyle = '#2a1008';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#301810';
        ctx.fillRect(4, 6, 56, 58);

        // Broad shoulders — chain mail over padded tunic
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(2, 44, 60, 20);
        ctx.fillStyle = P.gray;
        ctx.fillRect(6, 45, 52, 18);
        // Chain mail links (pattern)
        ctx.fillStyle = '#8a8a98';
        for (var cy = 46; cy < 60; cy += 3) {
          for (var cx = 8; cx < 56; cx += 4) {
            ctx.fillRect(cx, cy, 2, 1);
          }
        }
        // Padded collar
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(22, 42, 20, 4);

        // Neck — thick, stocky dwarf build
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(24, 34, 16, 10);
        ctx.fillStyle = P.skin;
        ctx.fillRect(25, 34, 14, 8);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(26, 35, 12, 6);

        // Face — broad, round, ruddy (dwarf features)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(12, 10, 40, 26);
        ctx.fillStyle = P.skin;
        ctx.fillRect(14, 10, 36, 24);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(16, 12, 32, 21);
        // Ruddy dwarf cheeks
        ctx.fillStyle = '#e0a080';
        ctx.fillRect(16, 24, 6, 4);
        ctx.fillRect(42, 24, 6, 4);

        // Eyes — bright blue, determined, defiant
        // Thick red eyebrows (bushy)
        ctx.fillStyle = '#c03010';
        ctx.fillRect(18, 16, 12, 3);
        ctx.fillRect(36, 16, 12, 3);
        ctx.fillStyle = '#d04020';
        ctx.fillRect(20, 16, 8, 2);
        ctx.fillRect(38, 16, 8, 2);
        // Eye whites
        ctx.fillStyle = '#e8e0d8';
        ctx.fillRect(20, 20, 8, 5);
        ctx.fillRect(38, 20, 8, 5);
        // Blue irises — vivid, determined
        ctx.fillStyle = '#204080';
        ctx.fillRect(22, 20, 5, 5);
        ctx.fillRect(40, 20, 5, 5);
        ctx.fillStyle = '#3060b0';
        ctx.fillRect(23, 21, 3, 3);
        ctx.fillRect(41, 21, 3, 3);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(24, 22, 2, 2);
        ctx.fillRect(42, 22, 2, 2);
        // Warm catch-light
        ctx.fillStyle = '#f0d8a0';
        ctx.fillRect(22, 20, 2, 2);
        ctx.fillRect(40, 20, 2, 2);

        // Nose — broad, strong dwarf nose
        ctx.fillStyle = P.skin;
        ctx.fillRect(28, 24, 8, 5);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(29, 24, 5, 3);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(28, 28, 3, 1);
        ctx.fillRect(33, 28, 3, 1);

        // MAGNIFICENT braided red beard — cascades down the chest
        ctx.fillStyle = '#b03020';
        ctx.fillRect(12, 28, 40, 18);
        ctx.fillRect(10, 32, 44, 14);
        ctx.fillRect(8, 36, 48, 10);
        // Beard mid-tones
        ctx.fillStyle = '#d04830';
        ctx.fillRect(16, 30, 32, 12);
        ctx.fillRect(14, 34, 36, 8);
        // Braided strands (three prominent braids)
        ctx.fillStyle = '#901810';
        ctx.fillRect(20, 36, 4, 10); // left braid
        ctx.fillRect(30, 38, 4, 8);  // center braid
        ctx.fillRect(40, 36, 4, 10); // right braid
        // Braid clasps — gold rings
        ctx.fillStyle = P.gold;
        ctx.fillRect(20, 44, 4, 3);
        ctx.fillRect(30, 44, 4, 3);
        ctx.fillRect(40, 44, 4, 3);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(21, 45, 2, 1);
        ctx.fillRect(31, 45, 2, 1);
        ctx.fillRect(41, 45, 2, 1);
        // Beard highlights (flame-like orange)
        ctx.fillStyle = '#e06038';
        ctx.fillRect(18, 30, 3, 4);
        ctx.fillRect(28, 32, 3, 3);
        ctx.fillRect(38, 30, 3, 4);
        // Mouth line hidden in beard
        ctx.fillStyle = '#804040';
        ctx.fillRect(26, 30, 12, 1);

        // Hair — wild, thick, fiery red
        ctx.fillStyle = '#b03020';
        ctx.fillRect(12, 4, 40, 10);
        ctx.fillRect(10, 8, 6, 10);
        ctx.fillRect(48, 8, 6, 10);
        // Hair volume
        ctx.fillRect(16, 2, 32, 4);
        // Hair highlights
        ctx.fillStyle = '#d04830';
        ctx.fillRect(18, 4, 8, 4);
        ctx.fillRect(34, 4, 8, 4);
        ctx.fillStyle = '#e06038';
        ctx.fillRect(22, 3, 4, 2);
        ctx.fillRect(38, 3, 4, 2);
        // Side hair — wild and thick
        ctx.fillStyle = '#b03020';
        ctx.fillRect(10, 14, 5, 10);
        ctx.fillRect(49, 14, 5, 10);
        ctx.fillStyle = '#d04830';
        ctx.fillRect(11, 16, 3, 6);
        ctx.fillRect(50, 16, 3, 6);
      });

      // Brother Soren - tabaxi monk, feline features, gentle wisdom
      mp('soren', function (ctx) {
        // Quiet chapel background — cool, contemplative
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#1e1e30';
        ctx.fillRect(4, 6, 56, 58);
        ctx.fillStyle = '#222238';
        ctx.fillRect(8, 10, 48, 50);

        // Monk robes — simple, light blue, draped
        ctx.fillStyle = '#3060a0';
        ctx.fillRect(8, 46, 48, 18);
        ctx.fillStyle = P.lightBlue;
        ctx.fillRect(12, 46, 40, 16);
        ctx.fillStyle = '#80b0e0';
        ctx.fillRect(16, 47, 32, 14);
        // Robe collar — simple wrap
        ctx.fillStyle = '#3060a0';
        ctx.fillRect(20, 42, 24, 6);
        ctx.fillStyle = P.lightBlue;
        ctx.fillRect(22, 42, 20, 4);
        // Robe fold detail
        ctx.fillStyle = '#5090c8';
        ctx.fillRect(28, 48, 2, 12);
        ctx.fillRect(34, 48, 2, 12);

        // Neck — furred
        ctx.fillStyle = '#8a6840';
        ctx.fillRect(24, 36, 16, 10);
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(25, 36, 14, 8);
        ctx.fillStyle = P.tan;
        ctx.fillRect(26, 37, 12, 6);

        // Face — feline, triangular, warm fur tones
        ctx.fillStyle = '#8a6840';
        ctx.fillRect(12, 12, 40, 26);
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(14, 12, 36, 24);
        ctx.fillStyle = P.tan;
        ctx.fillRect(16, 14, 32, 21);
        // Lighter muzzle area
        ctx.fillStyle = '#e8d8c0';
        ctx.fillRect(22, 24, 20, 10);
        ctx.fillStyle = '#f0e0d0';
        ctx.fillRect(24, 26, 16, 6);
        // Tabby markings — subtle stripes on forehead
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(18, 14, 3, 2); ctx.fillRect(24, 12, 3, 2);
        ctx.fillRect(31, 12, 3, 2); ctx.fillRect(38, 14, 3, 2);
        ctx.fillRect(43, 14, 3, 2);

        // Cat eyes — large, luminous, slitted pupils
        // Upper brow fur (thick, expressive)
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(18, 18, 12, 2);
        ctx.fillRect(36, 18, 12, 2);
        // Eye shape — large, almond
        ctx.fillStyle = P.yellow;
        ctx.fillRect(18, 21, 12, 6);
        ctx.fillRect(36, 21, 12, 6);
        // Bright inner ring
        ctx.fillStyle = '#e8d040';
        ctx.fillRect(20, 22, 8, 4);
        ctx.fillRect(38, 22, 8, 4);
        // Golden outer ring
        ctx.fillStyle = '#c0a020';
        ctx.fillRect(19, 21, 10, 1);
        ctx.fillRect(37, 21, 10, 1);
        ctx.fillRect(19, 26, 10, 1);
        ctx.fillRect(37, 26, 10, 1);
        // Slitted pupils — vertical
        ctx.fillStyle = P.black;
        ctx.fillRect(24, 21, 2, 6);
        ctx.fillRect(42, 21, 2, 6);
        // Wider at center
        ctx.fillRect(23, 23, 4, 2);
        ctx.fillRect(41, 23, 4, 2);
        // Eye shine (spiritual warmth)
        ctx.fillStyle = '#f0e8d0';
        ctx.fillRect(21, 22, 2, 2);
        ctx.fillRect(39, 22, 2, 2);

        // Nose — small pink cat nose (triangle)
        ctx.fillStyle = P.pink;
        ctx.fillRect(29, 28, 6, 3);
        ctx.fillStyle = '#e0a0a0';
        ctx.fillRect(30, 28, 4, 2);
        // Nose line down to mouth
        ctx.fillStyle = '#8a6840';
        ctx.fillRect(31, 31, 2, 2);

        // Mouth — small, cat-like
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(26, 32, 5, 1);
        ctx.fillRect(33, 32, 5, 1);

        // Whiskers — fine, white, expressive
        ctx.fillStyle = P.white;
        ctx.fillRect(8, 26, 10, 1);
        ctx.fillRect(10, 28, 8, 1);
        ctx.fillRect(8, 30, 10, 1);
        ctx.fillRect(46, 26, 10, 1);
        ctx.fillRect(46, 28, 8, 1);
        ctx.fillRect(46, 30, 10, 1);

        // Cat ears — tall, triangular, alert
        // Left ear
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(14, 2, 10, 14);
        ctx.fillRect(12, 4, 4, 10);
        ctx.fillStyle = P.tan;
        ctx.fillRect(16, 4, 6, 10);
        // Inner ear — pink
        ctx.fillStyle = P.pink;
        ctx.fillRect(17, 6, 4, 6);
        ctx.fillStyle = '#e0a0a0';
        ctx.fillRect(18, 8, 2, 3);
        // Right ear
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(40, 2, 10, 14);
        ctx.fillRect(48, 4, 4, 10);
        ctx.fillStyle = P.tan;
        ctx.fillRect(42, 4, 6, 10);
        ctx.fillStyle = P.pink;
        ctx.fillRect(43, 6, 4, 6);
        ctx.fillStyle = '#e0a0a0';
        ctx.fillRect(44, 8, 2, 3);

        // Fur tufts between ears (gentle, not wild)
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(24, 6, 16, 6);
        ctx.fillStyle = P.tan;
        ctx.fillRect(26, 7, 12, 4);
      });

      // Svana Ironveil - dwarf woman, fierce, red braids, armored
      mp('svana', function (ctx) {
        // Dark stone background
        ctx.fillStyle = '#2a1a2a';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#301e30';
        ctx.fillRect(4, 6, 56, 58);

        // Armor — plate over chain, practical
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(4, 42, 56, 22);
        ctx.fillStyle = '#4a4a58';
        ctx.fillRect(8, 42, 48, 20);
        // Plate detail — shoulder guards
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(8, 44, 10, 6);
        ctx.fillRect(46, 44, 10, 6);
        ctx.fillStyle = '#b0b0b8';
        ctx.fillRect(10, 44, 6, 4);
        ctx.fillRect(48, 44, 6, 4);
        // Chain mail visible between plates
        ctx.fillStyle = P.gray;
        ctx.fillRect(18, 44, 28, 12);
        ctx.fillStyle = '#8a8a98';
        for (var sy = 45; sy < 56; sy += 3) {
          for (var sx = 20; sx < 44; sx += 4) {
            ctx.fillRect(sx, sy, 2, 1);
          }
        }
        // Gorget
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(20, 40, 24, 4);
        ctx.fillStyle = '#4a4a58';
        ctx.fillRect(22, 40, 20, 2);

        // Neck
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(24, 34, 16, 8);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(25, 34, 14, 6);

        // Face — broad, fierce, pale-skinned dwarf
        ctx.fillStyle = P.skin;
        ctx.fillRect(12, 10, 40, 26);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(14, 10, 36, 24);
        ctx.fillStyle = '#f0dcc8';
        ctx.fillRect(16, 12, 32, 21);
        // Fierce flush on cheeks
        ctx.fillStyle = '#e0a890';
        ctx.fillRect(16, 24, 6, 4);
        ctx.fillRect(42, 24, 6, 4);
        // Strong jaw — square dwarf jaw
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(14, 30, 2, 4);
        ctx.fillRect(48, 30, 2, 4);

        // Eyes — bright blue, fierce, challenging
        // Thin stern brows
        ctx.fillStyle = '#901810';
        ctx.fillRect(18, 17, 12, 2);
        ctx.fillRect(36, 17, 12, 2);
        // Eye whites
        ctx.fillStyle = '#e8e0e0';
        ctx.fillRect(20, 20, 8, 5);
        ctx.fillRect(38, 20, 8, 5);
        // Blue irises — fierce
        ctx.fillStyle = P.blue;
        ctx.fillRect(22, 20, 5, 5);
        ctx.fillRect(40, 20, 5, 5);
        ctx.fillStyle = P.lightBlue;
        ctx.fillRect(23, 21, 3, 3);
        ctx.fillRect(41, 21, 3, 3);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(24, 22, 2, 2);
        ctx.fillRect(42, 22, 2, 2);
        // Catch-light
        ctx.fillStyle = '#e0e0f0';
        ctx.fillRect(22, 20, 2, 2);
        ctx.fillRect(40, 20, 2, 2);

        // Nose — small, upturned, dwarf-cute
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(29, 24, 6, 4);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(29, 27, 2, 1);
        ctx.fillRect(33, 27, 2, 1);

        // Mouth — determined, thin line
        ctx.fillStyle = P.darkRed;
        ctx.fillRect(26, 30, 12, 2);
        ctx.fillStyle = '#c06060';
        ctx.fillRect(28, 30, 8, 1);

        // Hair — thick red, with two long braids framing the face
        // Top hair — voluminous
        ctx.fillStyle = P.red;
        ctx.fillRect(12, 4, 40, 10);
        ctx.fillRect(14, 2, 36, 4);
        // Hair highlights
        ctx.fillStyle = '#e04030';
        ctx.fillRect(18, 4, 8, 4);
        ctx.fillRect(34, 4, 8, 4);
        ctx.fillStyle = '#f05040';
        ctx.fillRect(22, 3, 4, 2);
        ctx.fillRect(38, 3, 4, 2);
        // Dark undertone
        ctx.fillStyle = '#901810';
        ctx.fillRect(26, 6, 2, 4);
        ctx.fillRect(36, 6, 2, 4);
        // Left braid — thick, plaited, running down past shoulders
        ctx.fillStyle = P.red;
        ctx.fillRect(8, 10, 8, 34);
        ctx.fillStyle = '#c03020';
        ctx.fillRect(10, 12, 4, 28);
        // Braid pattern (twists)
        ctx.fillStyle = '#901810';
        ctx.fillRect(10, 16, 4, 2);
        ctx.fillRect(10, 22, 4, 2);
        ctx.fillRect(10, 28, 4, 2);
        ctx.fillRect(10, 34, 4, 2);
        // Left braid clasp — gold ring
        ctx.fillStyle = P.gold;
        ctx.fillRect(8, 40, 8, 4);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(10, 41, 4, 2);
        // Right braid
        ctx.fillStyle = P.red;
        ctx.fillRect(48, 10, 8, 34);
        ctx.fillStyle = '#c03020';
        ctx.fillRect(50, 12, 4, 28);
        ctx.fillStyle = '#901810';
        ctx.fillRect(50, 16, 4, 2);
        ctx.fillRect(50, 22, 4, 2);
        ctx.fillRect(50, 28, 4, 2);
        ctx.fillRect(50, 34, 4, 2);
        // Right braid clasp
        ctx.fillStyle = P.gold;
        ctx.fillRect(48, 40, 8, 4);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(50, 41, 4, 2);
      });

      // Que'Rubra - ancient tree spirit, gnarled bark face, glowing green eyes, leaf crown
      mp('querubra', function (ctx) {
        // Deep forest darkness background
        ctx.fillStyle = '#050e05';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#0a200a';
        ctx.fillRect(4, 4, 56, 56);
        ctx.fillStyle = '#0c280c';
        ctx.fillRect(8, 8, 48, 48);

        // Bark trunk/body — gnarled, asymmetric
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(12, 40, 40, 24);
        ctx.fillRect(6, 44, 10, 20);
        ctx.fillRect(48, 44, 10, 20);
        // Bark texture lines (vertical grain)
        ctx.fillStyle = '#1a1004';
        ctx.fillRect(18, 42, 2, 18); ctx.fillRect(26, 41, 2, 19);
        ctx.fillRect(34, 43, 2, 17); ctx.fillRect(42, 42, 2, 18);
        // Root-like shoulder bulges
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(8, 44, 6, 4);
        ctx.fillRect(50, 44, 6, 4);

        // Head — weathered bark face, ancient wood
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(8, 14, 48, 28);
        ctx.fillRect(12, 12, 40, 4);
        ctx.fillRect(6, 18, 4, 20);
        ctx.fillRect(54, 18, 4, 20);
        // Lighter inner face — aged heartwood
        ctx.fillStyle = P.brown;
        ctx.fillRect(12, 16, 40, 24);
        ctx.fillStyle = '#6a4020';
        ctx.fillRect(14, 18, 36, 20);
        // Wood grain texture (flowing lines)
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(16, 18, 2, 18);
        ctx.fillRect(46, 20, 2, 14);
        ctx.fillRect(30, 16, 2, 10);
        ctx.fillStyle = '#7a5028';
        ctx.fillRect(22, 18, 1, 12);
        ctx.fillRect(41, 18, 1, 12);

        // Brow ridge — heavy, expressive, gnarled
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(14, 18, 14, 4);
        ctx.fillRect(36, 18, 14, 4);
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(16, 18, 10, 2);
        ctx.fillRect(38, 18, 10, 2);
        // Brow knots (woodgrain detail)
        ctx.fillStyle = '#4a3018';
        ctx.fillRect(18, 18, 2, 2);
        ctx.fillRect(42, 18, 2, 2);

        // Eyes — deep glowing sockets, the spiritual core
        // Dark eye sockets
        ctx.fillStyle = '#0a0804';
        ctx.fillRect(16, 22, 12, 8);
        ctx.fillRect(38, 22, 12, 8);
        // Green glow fill
        ctx.fillStyle = '#1a6a1a';
        ctx.fillRect(17, 23, 10, 6);
        ctx.fillRect(39, 23, 10, 6);
        // Bright green inner glow
        ctx.fillStyle = P.green;
        ctx.fillRect(19, 24, 6, 4);
        ctx.fillRect(41, 24, 6, 4);
        // Bright iris centers
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(20, 24, 4, 4);
        ctx.fillRect(42, 24, 4, 4);
        // Pupils (dark forest-green centers)
        ctx.fillStyle = '#0a2a0a';
        ctx.fillRect(21, 25, 2, 2);
        ctx.fillRect(43, 25, 2, 2);
        // Bright highlights (ancient life)
        ctx.fillStyle = P.paleGreen;
        ctx.fillRect(20, 24, 2, 2);
        ctx.fillRect(42, 24, 2, 2);
        // Under-eye glow (light spilling from sockets)
        ctx.fillStyle = 'rgba(90, 197, 90, 0.25)';
        ctx.fillRect(16, 30, 12, 2);
        ctx.fillRect(38, 30, 12, 2);

        // Nose — subtle bark ridge between the eyes
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(30, 26, 4, 6);
        ctx.fillStyle = P.brown;
        ctx.fillRect(30, 26, 3, 4);

        // Mouth — wide, knowing, ancient smile
        ctx.fillStyle = '#1a1004';
        ctx.fillRect(18, 36, 28, 4);
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(20, 36, 24, 2);
        // Wood-grain teeth (ancient, unsettling, wise)
        ctx.fillStyle = '#3a2a10';
        ctx.fillRect(22, 38, 2, 2);
        ctx.fillRect(26, 38, 2, 2);
        ctx.fillRect(30, 38, 2, 2);
        ctx.fillRect(34, 38, 2, 2);
        ctx.fillRect(38, 38, 2, 2);
        // Mouth corners — knowing upturn
        ctx.fillStyle = '#1a1004';
        ctx.fillRect(16, 34, 3, 2);
        ctx.fillRect(45, 34, 3, 2);

        // Leaf crown — elaborate, wild, asymmetric (the defining feature)
        // Far left cluster
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(4, 4, 14, 14);
        // Left-center (tall)
        ctx.fillRect(16, 0, 10, 18);
        // Center (tallest)
        ctx.fillRect(26, -2, 12, 18);
        // Right-center
        ctx.fillRect(38, 0, 10, 18);
        // Far right cluster
        ctx.fillRect(46, 6, 14, 12);
        // Leaf highlights (mid-green)
        ctx.fillStyle = P.green;
        ctx.fillRect(6, 5, 8, 10);
        ctx.fillRect(18, 2, 6, 12);
        ctx.fillRect(28, 0, 8, 12);
        ctx.fillRect(40, 2, 6, 12);
        ctx.fillRect(48, 8, 8, 8);
        // Bright leaf tips (new growth)
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(8, 5, 3, 4);
        ctx.fillRect(19, 2, 3, 4);
        ctx.fillRect(30, 0, 4, 4);
        ctx.fillRect(41, 2, 3, 4);
        ctx.fillRect(50, 8, 3, 4);
        // Individual leaf shapes at edges
        ctx.fillStyle = P.green;
        ctx.fillRect(4, 4, 2, 6);
        ctx.fillRect(14, 0, 2, 6);
        ctx.fillRect(37, 0, 2, 6);
        ctx.fillRect(58, 6, 2, 6);
        // Golden berries/flowers scattered in crown
        ctx.fillStyle = P.gold;
        ctx.fillRect(10, 8, 2, 2);
        ctx.fillRect(22, 4, 2, 2);
        ctx.fillRect(34, 2, 2, 2);
        ctx.fillRect(46, 6, 2, 2);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(10, 8, 1, 1);
        ctx.fillRect(22, 4, 1, 1);
        ctx.fillRect(34, 2, 1, 1);
        ctx.fillRect(46, 6, 1, 1);

        // Hanging moss/vine wisps — sides of face
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(4, 18, 4, 14);
        ctx.fillRect(56, 20, 4, 12);
        ctx.fillStyle = P.green;
        ctx.fillRect(5, 20, 2, 8);
        ctx.fillRect(57, 22, 2, 6);
        // Moss drips
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(5, 30, 2, 4);
        ctx.fillRect(57, 30, 2, 4);
        ctx.fillStyle = P.green;
        ctx.fillRect(5, 32, 1, 2);
        ctx.fillRect(58, 32, 1, 2);
      });

      // Bargnot - goblin queen, fierce, crowned, red robes over green skin
      mp('bargnot', function (ctx) {
        // Dark ritual chamber background
        ctx.fillStyle = '#1a0a1a';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#201020';
        ctx.fillRect(4, 6, 56, 58);
        ctx.fillStyle = '#281428';
        ctx.fillRect(8, 10, 48, 50);

        // Robes — deep red, ceremonial
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(6, 44, 52, 20);
        ctx.fillStyle = '#8a1818';
        ctx.fillRect(10, 44, 44, 18);
        ctx.fillStyle = P.red;
        ctx.fillRect(14, 45, 36, 16);
        // Robe collar — high, ceremonial
        ctx.fillStyle = '#8a1818';
        ctx.fillRect(18, 38, 28, 8);
        ctx.fillStyle = P.red;
        ctx.fillRect(20, 38, 24, 6);
        // Gold robe trim
        ctx.fillStyle = P.gold;
        ctx.fillRect(14, 44, 36, 2);
        ctx.fillRect(30, 46, 4, 10);

        // Neck — green-skinned, goblin
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(24, 34, 16, 8);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(25, 34, 14, 6);
        ctx.fillStyle = P.green;
        ctx.fillRect(26, 35, 12, 4);

        // Face — sharp-featured goblin, angular, commanding
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(12, 12, 40, 24);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(14, 12, 36, 22);
        ctx.fillStyle = P.green;
        ctx.fillRect(16, 14, 32, 19);
        // Sharp cheekbones
        ctx.fillStyle = '#4a9a4a';
        ctx.fillRect(16, 24, 5, 2);
        ctx.fillRect(43, 24, 5, 2);
        // Angular jaw
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(14, 30, 2, 4);
        ctx.fillRect(48, 30, 2, 4);

        // Goblin ears — large, pointed, swept back
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(4, 16, 10, 8);
        ctx.fillRect(50, 16, 10, 8);
        ctx.fillStyle = P.green;
        ctx.fillRect(5, 17, 8, 5);
        ctx.fillRect(51, 17, 8, 5);
        // Ear tips (pointed)
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(2, 14, 4, 4);
        ctx.fillRect(58, 14, 4, 4);

        // Eyes — fierce red-orange, commanding, burning
        // Heavy brow ridge
        ctx.fillStyle = '#0a3a0a';
        ctx.fillRect(18, 16, 12, 3);
        ctx.fillRect(36, 16, 12, 3);
        // Eye sockets
        ctx.fillStyle = '#600808';
        ctx.fillRect(18, 20, 12, 6);
        ctx.fillRect(36, 20, 12, 6);
        // Red-orange irises — burning
        ctx.fillStyle = P.red;
        ctx.fillRect(20, 20, 8, 6);
        ctx.fillRect(38, 20, 8, 6);
        ctx.fillStyle = '#e06020';
        ctx.fillRect(22, 21, 4, 4);
        ctx.fillRect(40, 21, 4, 4);
        // Yellow-hot center
        ctx.fillStyle = P.yellow;
        ctx.fillRect(23, 22, 2, 2);
        ctx.fillRect(41, 22, 2, 2);
        // Pupils — slitted (fierce)
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(24, 21, 1, 4);
        ctx.fillRect(42, 21, 1, 4);
        // Fierce catch-light
        ctx.fillStyle = '#f0c0a0';
        ctx.fillRect(21, 20, 2, 2);
        ctx.fillRect(39, 20, 2, 2);

        // Nose — small, flat goblin nose
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(30, 26, 4, 3);
        ctx.fillStyle = '#0a3a0a';
        ctx.fillRect(30, 28, 2, 1);
        ctx.fillRect(32, 28, 2, 1);

        // Mouth — thin, cruel, smirking
        ctx.fillStyle = '#804040';
        ctx.fillRect(24, 32, 16, 2);
        ctx.fillStyle = '#a05050';
        ctx.fillRect(26, 32, 12, 1);
        // Sharp teeth showing (menacing grin)
        ctx.fillStyle = '#d0d0a0';
        ctx.fillRect(26, 33, 2, 1);
        ctx.fillRect(30, 33, 2, 1);
        ctx.fillRect(34, 33, 2, 1);
        ctx.fillRect(38, 33, 2, 1);

        // Crown — gold, three-pointed, her authority
        ctx.fillStyle = P.gold;
        ctx.fillRect(16, 6, 32, 6);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(18, 7, 28, 4);
        // Crown points
        ctx.fillStyle = P.gold;
        ctx.fillRect(18, 0, 5, 8);
        ctx.fillRect(30, -2, 4, 10);
        ctx.fillRect(41, 0, 5, 8);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(19, 1, 3, 4);
        ctx.fillRect(31, -1, 2, 6);
        ctx.fillRect(42, 1, 3, 4);
        // Purple gem — center of crown
        ctx.fillStyle = P.purple;
        ctx.fillRect(29, 8, 6, 4);
        ctx.fillStyle = P.lightPurple;
        ctx.fillRect(30, 9, 4, 2);
        ctx.fillStyle = '#d0a0e0';
        ctx.fillRect(31, 9, 2, 1);
      });

      // Bargnot desperate — shadow consuming her, crown falling
      mp('bargnot_desperate', function (ctx) {
        // Dark void — shadow encroaching
        ctx.fillStyle = '#1a0a1a';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#180818';
        ctx.fillRect(4, 4, 56, 56);

        // Robes — darkened, shadow-stained
        ctx.fillStyle = P.darkPurple;
        ctx.fillRect(6, 44, 52, 20);
        ctx.fillStyle = '#3a1030';
        ctx.fillRect(10, 44, 44, 18);
        // Robes disintegrating
        ctx.fillStyle = '#2a0820';
        ctx.fillRect(20, 38, 24, 8);

        // Neck
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(24, 34, 16, 8);
        ctx.fillStyle = P.green;
        ctx.fillRect(26, 35, 12, 4);

        // Face — same but contorted in anguish
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(12, 12, 40, 24);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(14, 12, 36, 22);
        ctx.fillStyle = P.green;
        ctx.fillRect(16, 14, 32, 19);

        // Goblin ears
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(4, 16, 10, 8);
        ctx.fillRect(50, 16, 10, 8);
        ctx.fillStyle = P.green;
        ctx.fillRect(5, 17, 8, 5);
        ctx.fillRect(51, 17, 8, 5);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(2, 14, 4, 4);
        ctx.fillRect(58, 14, 4, 4);

        // Eyes — wide, glowing purple, losing control
        ctx.fillStyle = '#0a3a0a';
        ctx.fillRect(16, 16, 14, 3);
        ctx.fillRect(34, 16, 14, 3);
        // Eyes wide open — too wide
        ctx.fillStyle = P.lightPurple;
        ctx.fillRect(16, 20, 14, 8);
        ctx.fillRect(34, 20, 14, 8);
        // White-hot center (power overload)
        ctx.fillStyle = P.white;
        ctx.fillRect(20, 22, 6, 4);
        ctx.fillRect(38, 22, 6, 4);
        // Purple glow bleeding outward
        ctx.fillStyle = 'rgba(160, 80, 200, 0.4)';
        ctx.fillRect(14, 18, 18, 12);
        ctx.fillRect(32, 18, 18, 12);

        // Nose
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(30, 26, 4, 3);

        // Mouth — open, screaming
        ctx.fillStyle = '#400808';
        ctx.fillRect(22, 32, 20, 6);
        ctx.fillStyle = P.darkRed;
        ctx.fillRect(24, 32, 16, 5);
        // Teeth
        ctx.fillStyle = '#d0d0a0';
        ctx.fillRect(26, 32, 2, 2);
        ctx.fillRect(30, 32, 2, 2);
        ctx.fillRect(34, 32, 2, 2);
        ctx.fillRect(38, 32, 2, 2);

        // Crown — tilted, falling off, broken
        ctx.fillStyle = P.gold;
        ctx.fillRect(34, 4, 20, 5);
        ctx.fillRect(42, 0, 4, 6);
        ctx.fillRect(50, 2, 4, 5);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(36, 5, 14, 3);
        ctx.fillRect(43, 1, 2, 3);
        // Crown gem cracked
        ctx.fillStyle = P.purple;
        ctx.fillRect(38, 6, 4, 3);
        ctx.fillStyle = '#2a0820';
        ctx.fillRect(39, 7, 2, 1);

        // Shadow tendrils — consuming her
        ctx.fillStyle = P.darkPurple;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(2, 14, 6, 28);
        ctx.fillRect(56, 10, 6, 32);
        ctx.fillRect(10, 6, 6, 14);
        ctx.fillRect(48, 4, 6, 12);
        ctx.globalAlpha = 0.4;
        ctx.fillRect(8, 40, 4, 16);
        ctx.fillRect(52, 38, 4, 18);
        ctx.fillRect(16, 8, 4, 8);
        ctx.globalAlpha = 1;
      });

      // Fawks worried — same fashionable nonbinary innkeeper, but anxious (64x64)
      mp('fawks_worried', function (ctx) {
        // Dimmer tavern background
        ctx.fillStyle = '#180e06';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#20140c';
        ctx.fillRect(4, 6, 56, 58);
        ctx.fillStyle = '#241810';
        ctx.fillRect(8, 10, 48, 50);

        // Same white shirt + vest, slightly hunched
        // Shirt base
        ctx.fillStyle = '#b8b8b8';
        ctx.fillRect(6, 48, 52, 16);
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(8, 48, 48, 14);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(10, 49, 44, 12);
        // Vest — same charcoal
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(12, 48, 40, 16);
        ctx.fillStyle = '#2a2a34';
        ctx.fillRect(14, 49, 36, 14);
        ctx.fillStyle = '#323240';
        ctx.fillRect(16, 50, 32, 12);
        // Vest lapels
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(14, 48, 4, 10);
        ctx.fillRect(46, 48, 4, 10);
        ctx.fillStyle = '#3a3a48';
        ctx.fillRect(15, 49, 2, 8);
        ctx.fillRect(47, 49, 2, 8);
        // Buttons
        ctx.fillStyle = '#a08830';
        ctx.fillRect(31, 50, 2, 2);
        ctx.fillRect(31, 54, 2, 2);
        ctx.fillRect(31, 58, 2, 2);
        // Shirt collar — slightly rumpled
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(22, 42, 20, 7);
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(24, 42, 16, 6);
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(22, 42, 3, 4);
        ctx.fillRect(39, 42, 3, 4);
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(24, 47, 16, 1);
        // Skin at collar
        ctx.fillStyle = P.skin;
        ctx.fillRect(29, 43, 6, 3);
        // Shirt sleeves peeking
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(8, 49, 4, 6);
        ctx.fillRect(52, 49, 4, 6);

        // Neck — tense
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(25, 38, 14, 8);
        ctx.fillStyle = P.skin;
        ctx.fillRect(26, 38, 12, 6);

        // Face — same soft features, tension visible
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(14, 14, 36, 24);
        ctx.fillStyle = P.skin;
        ctx.fillRect(16, 14, 32, 23);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(18, 16, 28, 20);
        // Pale cheeks (warmth drained)
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(18, 28, 5, 4);
        ctx.fillRect(41, 28, 5, 4);
        // Soft jawline
        ctx.fillStyle = P.skin;
        ctx.fillRect(16, 34, 2, 3);
        ctx.fillRect(46, 34, 2, 3);

        // Eyes — amber, wider, brows in worried lift
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(20, 18, 10, 2);
        ctx.fillRect(36, 18, 10, 2);
        // Inner brow lift (telltale worry)
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(30, 16, 2, 2);
        ctx.fillRect(34, 16, 2, 2);
        // Eye whites — wider (anxious)
        ctx.fillStyle = '#f0e8e0';
        ctx.fillRect(20, 22, 10, 7);
        ctx.fillRect(36, 22, 10, 7);
        // Upper lid
        ctx.fillStyle = '#5a3820';
        ctx.fillRect(20, 21, 10, 1);
        ctx.fillRect(36, 21, 10, 1);
        // Amber irises
        ctx.fillStyle = '#7a4a10';
        ctx.fillRect(22, 22, 7, 6);
        ctx.fillRect(38, 22, 7, 6);
        ctx.fillStyle = '#9a6020';
        ctx.fillRect(23, 23, 5, 4);
        ctx.fillRect(39, 23, 5, 4);
        ctx.fillStyle = '#b07820';
        ctx.fillRect(24, 24, 3, 2);
        ctx.fillRect(40, 24, 3, 2);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(25, 24, 2, 2);
        ctx.fillRect(41, 24, 2, 2);
        // Dimmer catch-light
        ctx.fillStyle = '#e0d0a0';
        ctx.fillRect(23, 22, 2, 2);
        ctx.fillRect(39, 22, 2, 2);
        // Lower lash line
        ctx.fillStyle = '#b09878';
        ctx.fillRect(20, 29, 10, 1);
        ctx.fillRect(36, 29, 10, 1);

        // Nose
        ctx.fillStyle = P.skin;
        ctx.fillRect(30, 26, 4, 5);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(29, 30, 2, 1);
        ctx.fillRect(33, 30, 2, 1);

        // Mouth — tight, downturned (the smile is gone)
        ctx.fillStyle = '#904848';
        ctx.fillRect(24, 34, 16, 2);
        ctx.fillStyle = '#a05050';
        ctx.fillRect(26, 34, 12, 2);
        // Downturned corners
        ctx.fillStyle = '#904848';
        ctx.fillRect(23, 35, 2, 2);
        ctx.fillRect(39, 35, 2, 2);
        ctx.fillStyle = '#804040';
        ctx.fillRect(28, 33, 8, 1);

        // Hair — same flop but mussed (ran hands through it, anxious)
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(10, 4, 44, 14);
        ctx.fillRect(8, 8, 6, 18);
        ctx.fillRect(50, 8, 6, 10);
        ctx.fillRect(14, 2, 34, 4);
        ctx.fillRect(8, 4, 8, 8);
        // Auburn mid-tones
        ctx.fillStyle = '#6a3018';
        ctx.fillRect(14, 4, 8, 8);
        ctx.fillRect(26, 3, 8, 8);
        ctx.fillRect(38, 4, 10, 8);
        // Highlights
        ctx.fillStyle = '#904820';
        ctx.fillRect(16, 4, 3, 6);
        ctx.fillRect(30, 3, 3, 6);
        ctx.fillRect(42, 4, 3, 6);
        // Stray pieces (anxious fidgeting)
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(4, 2, 6, 3);
        ctx.fillRect(22, 0, 4, 2);
        // THE FLOP — same dramatic swoop but slightly messier
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(34, 12, 16, 6);
        ctx.fillRect(38, 10, 14, 4);
        ctx.fillRect(40, 14, 12, 6);
        ctx.fillRect(44, 18, 10, 6);
        ctx.fillRect(48, 22, 6, 4);
        // Extra stray strand falling lower (the worry-fidget)
        ctx.fillRect(50, 24, 4, 4);
        ctx.fillRect(52, 26, 2, 3);
        // Flop mid-tones
        ctx.fillStyle = '#6a3018';
        ctx.fillRect(36, 12, 12, 4);
        ctx.fillRect(40, 14, 10, 4);
        ctx.fillRect(44, 18, 8, 4);
        ctx.fillRect(48, 22, 4, 3);
        // Flop highlights — dimmer
        ctx.fillStyle = '#904820';
        ctx.fillRect(38, 12, 4, 3);
        ctx.fillRect(42, 14, 4, 3);
        ctx.fillRect(46, 18, 3, 3);
        // Left side — swept back, messier
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(6, 12, 6, 16);
        ctx.fillRect(4, 8, 4, 12);
        ctx.fillStyle = '#6a3018';
        ctx.fillRect(7, 14, 4, 10);

        // Left ear + earring
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(10, 24, 4, 6);
        ctx.fillStyle = P.skin;
        ctx.fillRect(11, 25, 2, 4);
        ctx.fillStyle = P.gold;
        ctx.fillRect(9, 26, 2, 4);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(9, 26, 1, 2);
        ctx.fillStyle = P.lightPurple;
        ctx.fillRect(9, 29, 2, 1);

        // Forehead tension lines
        ctx.fillStyle = P.skin;
        ctx.fillRect(22, 16, 12, 1);
      });

      // Helena hopeful — same halfline, strawberry curls, dawn light, relief (64x64)
      mp('helena_hopeful', function (ctx) {
        // Warmer background (dawn light, hope)
        ctx.fillStyle = '#0c160c';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#101e10';
        ctx.fillRect(4, 10, 56, 54);
        ctx.fillStyle = '#142214';
        ctx.fillRect(8, 14, 48, 46);

        // Shoulders — same vestment, posture more open
        ctx.fillStyle = '#1a4a1a';
        ctx.fillRect(4, 48, 56, 16);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(8, 48, 48, 14);
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(12, 49, 40, 12);
        // Collar
        ctx.fillStyle = '#1a4a1a';
        ctx.fillRect(14, 40, 8, 10);
        ctx.fillRect(42, 40, 8, 10);
        ctx.fillStyle = P.gold;
        ctx.fillRect(14, 40, 2, 8);
        ctx.fillRect(48, 40, 2, 8);
        // Chain of office
        ctx.fillStyle = P.gold;
        ctx.fillRect(22, 48, 2, 1); ctx.fillRect(24, 49, 2, 1);
        ctx.fillRect(26, 48, 3, 1); ctx.fillRect(29, 49, 2, 1);
        ctx.fillRect(33, 49, 2, 1); ctx.fillRect(35, 48, 3, 1);
        ctx.fillRect(38, 49, 2, 1); ctx.fillRect(40, 48, 2, 1);
        // Pendant (catches dawn light — brighter)
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(29, 50, 6, 5);
        ctx.fillStyle = P.paleGreen;
        ctx.fillRect(30, 51, 4, 3);
        ctx.fillStyle = '#c0f0c0';
        ctx.fillRect(31, 51, 2, 2);

        // Neck
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(24, 38, 16, 8);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(25, 38, 14, 6);
        ctx.fillStyle = '#f4ddc4';
        ctx.fillRect(26, 38, 12, 5);

        // Face — round halfline face, warmer tones (color returned)
        ctx.fillStyle = P.skin;
        ctx.fillRect(12, 16, 40, 24);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(14, 16, 36, 23);
        ctx.fillStyle = '#f4ddc4';
        ctx.fillRect(16, 18, 32, 20);
        // Warm rosy cheeks (relief, blood returning)
        ctx.fillStyle = '#f0c0a0';
        ctx.fillRect(16, 28, 7, 5);
        ctx.fillRect(41, 28, 7, 5);
        ctx.fillStyle = '#e8b898';
        ctx.fillRect(17, 29, 5, 3);
        ctx.fillRect(42, 29, 5, 3);
        // Freckles
        ctx.fillStyle = '#d0a080';
        ctx.fillRect(20, 27, 1, 1); ctx.fillRect(22, 26, 1, 1);
        ctx.fillRect(27, 25, 1, 1); ctx.fillRect(29, 26, 1, 1);
        ctx.fillRect(35, 26, 1, 1); ctx.fillRect(37, 25, 1, 1);
        ctx.fillRect(42, 27, 1, 1); ctx.fillRect(44, 26, 1, 1);
        ctx.fillRect(24, 29, 1, 1); ctx.fillRect(40, 29, 1, 1);
        ctx.fillRect(31, 27, 1, 1); ctx.fillRect(33, 27, 1, 1);
        // Soft jawline
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(14, 36, 3, 3);
        ctx.fillRect(47, 36, 3, 3);

        // Eyes — wider, brighter, glistening (hope!)
        // Brows — raised, open (guard dropped for once)
        ctx.fillStyle = '#a04818';
        ctx.fillRect(18, 19, 11, 2);
        ctx.fillRect(37, 19, 11, 2);
        // Eye whites — wider, brighter
        ctx.fillStyle = '#f4ece4';
        ctx.fillRect(18, 22, 12, 7);
        ctx.fillRect(36, 22, 12, 7);
        // Upper lid
        ctx.fillStyle = '#804020';
        ctx.fillRect(18, 21, 12, 1);
        ctx.fillRect(36, 21, 12, 1);
        // Green irises — vivid, bright (brighter than normal)
        ctx.fillStyle = P.green;
        ctx.fillRect(20, 22, 9, 6);
        ctx.fillRect(38, 22, 9, 6);
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(22, 23, 5, 4);
        ctx.fillRect(40, 23, 5, 4);
        // Bright iris center
        ctx.fillStyle = P.paleGreen;
        ctx.fillRect(23, 24, 3, 2);
        ctx.fillRect(41, 24, 3, 2);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(24, 24, 2, 2);
        ctx.fillRect(42, 24, 2, 2);
        // Bright catch-light (hope shining)
        ctx.fillStyle = P.white;
        ctx.fillRect(22, 22, 2, 2);
        ctx.fillRect(40, 22, 2, 2);
        // Moisture glistening (holding back tears of relief)
        ctx.fillStyle = 'rgba(240, 240, 240, 0.3)';
        ctx.fillRect(18, 29, 12, 1);
        ctx.fillRect(36, 29, 12, 1);
        // Lower lash line
        ctx.fillStyle = '#c0a088';
        ctx.fillRect(18, 29, 12, 1);
        ctx.fillRect(36, 29, 12, 1);

        // Nose — small, upturned
        ctx.fillStyle = P.skin;
        ctx.fillRect(30, 26, 4, 5);
        ctx.fillStyle = '#e0b898';
        ctx.fillRect(29, 30, 2, 1);
        ctx.fillRect(33, 30, 2, 1);

        // Mouth — genuine smile (rare, breaking through her composure)
        ctx.fillStyle = '#c05050';
        ctx.fillRect(24, 34, 16, 2);
        ctx.fillStyle = '#d87878';
        ctx.fillRect(26, 34, 12, 2);
        // Upturned corners (a real smile!)
        ctx.fillStyle = '#c05050';
        ctx.fillRect(23, 33, 2, 1);
        ctx.fillRect(39, 33, 2, 1);
        // Upper lip
        ctx.fillStyle = '#b04848';
        ctx.fillRect(28, 33, 8, 1);
        // Lower lip highlight
        ctx.fillStyle = '#e08888';
        ctx.fillRect(28, 36, 8, 1);

        // Hair — strawberry curls catching dawn light (brighter, more vivid)
        ctx.fillStyle = '#8a2a10';
        ctx.fillRect(10, 6, 44, 14);
        ctx.fillRect(8, 10, 6, 12);
        ctx.fillRect(50, 10, 6, 12);
        // Curly top
        ctx.fillRect(12, 4, 8, 4);
        ctx.fillRect(22, 2, 8, 6);
        ctx.fillRect(32, 4, 8, 4);
        ctx.fillRect(42, 4, 6, 4);
        ctx.fillRect(16, 2, 6, 4);
        // Dawn-lit highlights (brighter than normal — morning glow)
        ctx.fillStyle = '#d05020';
        ctx.fillRect(14, 6, 5, 6);
        ctx.fillRect(24, 4, 5, 6);
        ctx.fillRect(34, 6, 5, 6);
        ctx.fillRect(44, 6, 5, 6);
        ctx.fillRect(18, 3, 4, 4);
        // Bright tips (dawn catching the curls)
        ctx.fillStyle = '#e87838';
        ctx.fillRect(16, 6, 2, 4);
        ctx.fillRect(26, 4, 2, 4);
        ctx.fillRect(36, 6, 2, 4);
        ctx.fillRect(46, 6, 2, 4);
        // Hot golden highlights (sunrise)
        ctx.fillStyle = '#f08848';
        ctx.fillRect(17, 7, 1, 2);
        ctx.fillRect(27, 5, 1, 2);
        ctx.fillRect(37, 7, 1, 2);
        ctx.fillRect(47, 7, 1, 2);
        // Shadows between curls
        ctx.fillStyle = '#601808';
        ctx.fillRect(20, 8, 2, 6);
        ctx.fillRect(30, 6, 2, 6);
        ctx.fillRect(40, 8, 2, 6);
        // Side curls
        ctx.fillStyle = '#8a2a10';
        ctx.fillRect(8, 18, 5, 8);
        ctx.fillRect(51, 18, 5, 8);
        ctx.fillStyle = '#d05020';
        ctx.fillRect(9, 20, 3, 4);
        ctx.fillRect(52, 20, 3, 4);
        // Temple wisps
        ctx.fillStyle = '#8a2a10';
        ctx.fillRect(14, 18, 2, 3);
        ctx.fillRect(48, 18, 2, 3);
      });

      // Svana Ironveil — worried: same fierce dwarf but exhausted and afraid
      mp('svana_worried', function (ctx) {
        // Darker background (dimmer, more oppressive)
        ctx.fillStyle = '#1a0e1a';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#241828';
        ctx.fillRect(4, 6, 56, 58);

        // Armor — same plate over chain
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(4, 42, 56, 22);
        ctx.fillStyle = '#4a4a58';
        ctx.fillRect(8, 42, 48, 20);
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(8, 44, 10, 6);
        ctx.fillRect(46, 44, 10, 6);
        ctx.fillStyle = '#b0b0b8';
        ctx.fillRect(10, 44, 6, 4);
        ctx.fillRect(48, 44, 6, 4);
        ctx.fillStyle = P.gray;
        ctx.fillRect(18, 44, 28, 12);
        ctx.fillStyle = '#8a8a98';
        for (var sy = 45; sy < 56; sy += 3) {
          for (var sx = 20; sx < 44; sx += 4) {
            ctx.fillRect(sx, sy, 2, 1);
          }
        }
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(20, 40, 24, 4);
        ctx.fillStyle = '#4a4a58';
        ctx.fillRect(22, 40, 20, 2);

        // Neck
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(24, 34, 16, 8);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(25, 34, 14, 6);

        // Face — same broad features but paler, drained
        ctx.fillStyle = P.skin;
        ctx.fillRect(12, 10, 40, 26);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(14, 10, 36, 24);
        ctx.fillStyle = '#e8d8c8';
        ctx.fillRect(16, 12, 32, 21);
        // Less flush, more pallor
        ctx.fillStyle = '#d8b8a0';
        ctx.fillRect(16, 24, 6, 4);
        ctx.fillRect(42, 24, 6, 4);
        // Jaw
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(14, 30, 2, 4);
        ctx.fillRect(48, 30, 2, 4);

        // Eyes — same blue but wider, lifted worried brows
        // Brows — angled up in center (worried)
        ctx.fillStyle = '#901810';
        ctx.fillRect(18, 18, 12, 2);
        ctx.fillRect(36, 18, 12, 2);
        // Inner brows raised (worry crease)
        ctx.fillRect(28, 16, 4, 1);
        ctx.fillRect(32, 16, 4, 1);
        // Eye whites — wider
        ctx.fillStyle = '#e8e0e0';
        ctx.fillRect(20, 20, 8, 6);
        ctx.fillRect(38, 20, 8, 6);
        // Blue irises
        ctx.fillStyle = P.blue;
        ctx.fillRect(22, 21, 5, 5);
        ctx.fillRect(40, 21, 5, 5);
        ctx.fillStyle = P.lightBlue;
        ctx.fillRect(23, 22, 3, 3);
        ctx.fillRect(41, 22, 3, 3);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(24, 23, 2, 2);
        ctx.fillRect(42, 23, 2, 2);
        // Catch-light
        ctx.fillStyle = '#e0e0f0';
        ctx.fillRect(22, 20, 2, 2);
        ctx.fillRect(40, 20, 2, 2);
        // Dark circles under eyes (exhaustion)
        ctx.fillStyle = '#b098a0';
        ctx.fillRect(20, 26, 8, 2);
        ctx.fillRect(38, 26, 8, 2);

        // Nose — same
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(29, 24, 6, 4);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(29, 27, 2, 1);
        ctx.fillRect(33, 27, 2, 1);

        // Mouth — tight, trembling, not determined
        ctx.fillStyle = P.darkRed;
        ctx.fillRect(27, 30, 10, 2);
        ctx.fillStyle = '#a05050';
        ctx.fillRect(29, 30, 6, 1);
        // Slight downturn at corners
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(26, 31, 2, 1);
        ctx.fillRect(36, 31, 2, 1);

        // Hair — same red braids but messier
        ctx.fillStyle = P.red;
        ctx.fillRect(12, 4, 40, 10);
        ctx.fillRect(14, 2, 36, 4);
        ctx.fillStyle = '#e04030';
        ctx.fillRect(18, 4, 8, 4);
        ctx.fillRect(34, 4, 8, 4);
        ctx.fillStyle = '#f05040';
        ctx.fillRect(22, 3, 4, 2);
        ctx.fillRect(38, 3, 4, 2);
        ctx.fillStyle = '#901810';
        ctx.fillRect(26, 6, 2, 4);
        ctx.fillRect(36, 6, 2, 4);
        // Left braid — slightly disheveled
        ctx.fillStyle = P.red;
        ctx.fillRect(8, 10, 8, 34);
        ctx.fillStyle = '#c03020';
        ctx.fillRect(10, 12, 4, 28);
        ctx.fillStyle = '#901810';
        ctx.fillRect(10, 16, 4, 2);
        ctx.fillRect(10, 22, 4, 2);
        ctx.fillRect(10, 28, 4, 2);
        ctx.fillRect(10, 34, 4, 2);
        // Loose strands (disheveled from worry)
        ctx.fillStyle = '#c03020';
        ctx.fillRect(14, 14, 2, 3);
        ctx.fillRect(15, 20, 1, 4);
        // Left braid clasp
        ctx.fillStyle = P.gold;
        ctx.fillRect(8, 40, 8, 4);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(10, 41, 4, 2);
        // Right braid
        ctx.fillStyle = P.red;
        ctx.fillRect(48, 10, 8, 34);
        ctx.fillStyle = '#c03020';
        ctx.fillRect(50, 12, 4, 28);
        ctx.fillStyle = '#901810';
        ctx.fillRect(50, 16, 4, 2);
        ctx.fillRect(50, 22, 4, 2);
        ctx.fillRect(50, 28, 4, 2);
        ctx.fillRect(50, 34, 4, 2);
        // Loose strands right
        ctx.fillStyle = '#c03020';
        ctx.fillRect(48, 14, 2, 3);
        ctx.fillRect(48, 20, 1, 4);
        // Right braid clasp
        ctx.fillStyle = P.gold;
        ctx.fillRect(48, 40, 8, 4);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(50, 41, 4, 2);
      });

      // Nitriti — ethereal spirit between stars: pale luminous face floating
      // in deep blue void, androgynous features, starlight in their hair,
      // eyes like twin nebulae. Neither masculine nor feminine — cosmic.
      mp('nitriti', function (ctx) {
        // Deep void background with subtle starfield
        ctx.fillStyle = '#050818';
        ctx.fillRect(0, 0, 64, 64);
        // Distant stars — more visible at this scale
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, 3, 1, 1); ctx.fillRect(56, 8, 1, 1);
        ctx.fillRect(12, 56, 1, 1); ctx.fillRect(52, 46, 1, 1);
        ctx.fillRect(2, 28, 1, 1); ctx.fillRect(60, 26, 1, 1);
        ctx.fillRect(8, 48, 1, 1); ctx.fillRect(58, 52, 1, 1);
        ctx.fillRect(48, 4, 1, 1); ctx.fillRect(6, 16, 1, 1);
        // Blue stars
        ctx.fillStyle = '#8ab8f0';
        ctx.fillRect(8, 14, 1, 1); ctx.fillRect(54, 54, 1, 1);
        ctx.fillRect(42, 58, 1, 1); ctx.fillRect(3, 42, 1, 1);
        // Faint nebula wisps
        ctx.fillStyle = 'rgba(80, 100, 180, 0.15)';
        ctx.fillRect(0, 20, 16, 8);
        ctx.fillRect(48, 30, 16, 8);

        // Spectral glow around head — ethereal corona
        ctx.fillStyle = '#0f1d40';
        ctx.fillRect(10, 4, 44, 48);
        ctx.fillStyle = '#1a2a50';
        ctx.fillRect(14, 8, 36, 40);
        ctx.fillStyle = '#1e3060';
        ctx.fillRect(18, 12, 28, 34);

        // Face — pale, luminous, smooth androgynous features
        ctx.fillStyle = '#8aa8d0';
        ctx.fillRect(16, 14, 32, 26);
        ctx.fillStyle = '#a0c0e0';
        ctx.fillRect(18, 14, 28, 24);
        ctx.fillStyle = '#b0c8e8';
        ctx.fillRect(20, 16, 24, 21);
        // Luminous inner glow
        ctx.fillStyle = '#c8d8f0';
        ctx.fillRect(22, 18, 20, 16);
        // Subtle cheek structure
        ctx.fillStyle = '#d0e0f8';
        ctx.fillRect(22, 24, 6, 4);
        ctx.fillRect(36, 24, 6, 4);

        // Eyes — nebula-like: deep blue-purple glow, soft luminous centers
        // Eye sockets — soft glow, not harsh
        ctx.fillStyle = '#4060a0';
        ctx.fillRect(20, 20, 10, 6);
        ctx.fillRect(36, 20, 10, 6);
        // Nebula iris — swirling blue-purple
        ctx.fillStyle = '#6080c0';
        ctx.fillRect(22, 21, 6, 4);
        ctx.fillRect(38, 21, 6, 4);
        // Bright center — white-blue starlight
        ctx.fillStyle = '#a0c0ff';
        ctx.fillRect(24, 22, 3, 2);
        ctx.fillRect(40, 22, 3, 2);
        ctx.fillStyle = '#c0d8ff';
        ctx.fillRect(25, 22, 1, 1);
        ctx.fillRect(41, 22, 1, 1);
        // Soft eye glow (extends beyond sockets)
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#8ab8f0';
        ctx.fillRect(18, 18, 14, 10);
        ctx.fillRect(34, 18, 14, 10);
        ctx.globalAlpha = 1;

        // Nose — minimal, spectral shadow
        ctx.fillStyle = '#90a8c8';
        ctx.fillRect(30, 28, 4, 2);

        // Mouth — gentle, serene, closed
        ctx.fillStyle = '#90a0c0';
        ctx.fillRect(27, 34, 10, 2);
        ctx.fillStyle = '#a0b0d0';
        ctx.fillRect(28, 34, 8, 1);

        // Hair / starlight wisps — aurora-like, flowing, not gendered
        ctx.fillStyle = '#7aa0e0';
        ctx.fillRect(14, 6, 36, 10);
        ctx.fillRect(12, 10, 6, 14);
        ctx.fillRect(46, 10, 6, 14);
        // Starlight strands — brighter
        ctx.fillStyle = '#a0d0ff';
        ctx.fillRect(18, 6, 6, 3);
        ctx.fillRect(34, 6, 8, 3);
        ctx.fillRect(10, 12, 3, 8);
        ctx.fillRect(50, 14, 3, 8);
        // White highlights — captured starlight
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(22, 6, 2, 2);
        ctx.fillRect(38, 6, 2, 2);
        ctx.fillRect(28, 4, 2, 2);
        ctx.fillRect(12, 14, 1, 2);
        ctx.fillRect(51, 16, 1, 2);
        // Aurora shimmer (faint purple)
        ctx.fillStyle = 'rgba(160, 120, 220, 0.3)';
        ctx.fillRect(16, 8, 4, 4);
        ctx.fillRect(44, 8, 4, 4);

        // Neck/form fading into void — spectral dissolve
        ctx.fillStyle = '#6080a0';
        ctx.fillRect(24, 38, 16, 6);
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#4060a0';
        ctx.fillRect(20, 44, 24, 6);
        ctx.globalAlpha = 0.35;
        ctx.fillRect(18, 50, 28, 6);
        ctx.globalAlpha = 0.15;
        ctx.fillRect(16, 56, 32, 8);
        ctx.globalAlpha = 1;
      });

      // Statue — depicts Izuriel Sakazarac, the Sun-King. A regal elf face
      // carved in stone, imperious and sharp-featured. Damaged by goblin claws
      // but still imposing. Pointed ears, high cheekbones, narrow cold eyes.
      mp('statue', function (ctx) {
        // Dark stone background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#222222';
        ctx.fillRect(4, 4, 56, 56);

        // Stone face shape — elven, angular, carved
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(14, 4, 36, 42);
        ctx.fillStyle = P.gray;
        ctx.fillRect(16, 6, 32, 38);
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(18, 8, 28, 34);
        // High cheekbones — angular elven stone
        ctx.fillStyle = '#b0b0b8';
        ctx.fillRect(18, 24, 8, 3);
        ctx.fillRect(38, 24, 8, 3);
        // Angular jaw (elven)
        ctx.fillStyle = P.gray;
        ctx.fillRect(16, 34, 3, 6);
        ctx.fillRect(45, 34, 3, 6);
        ctx.fillRect(19, 38, 2, 2);
        ctx.fillRect(43, 38, 2, 2);

        // Pointed ears — elven, carved in stone
        ctx.fillStyle = P.gray;
        ctx.fillRect(8, 16, 8, 12);
        ctx.fillRect(48, 16, 8, 12);
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(10, 18, 4, 8);
        ctx.fillRect(50, 18, 4, 8);
        // Ear points
        ctx.fillStyle = P.gray;
        ctx.fillRect(4, 10, 6, 8);
        ctx.fillRect(54, 10, 6, 8);
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(6, 12, 3, 4);
        ctx.fillRect(55, 12, 3, 4);

        // Eyes — narrow, imperious, faint golden glow
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(20, 20, 10, 4);
        ctx.fillRect(36, 20, 10, 4);
        ctx.fillStyle = '#a08020';
        ctx.fillRect(24, 21, 4, 2);
        ctx.fillRect(40, 21, 4, 2);
        // Golden glow center
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(25, 21, 2, 1);
        ctx.fillRect(41, 21, 2, 1);
        // Heavy stone brow ridge
        ctx.fillStyle = P.gray;
        ctx.fillRect(18, 16, 12, 3);
        ctx.fillRect(36, 16, 12, 3);

        // Claw damage — deep scratches gouged into stone
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(18, 14, 2, 12);
        ctx.fillRect(42, 12, 2, 14);
        ctx.fillRect(28, 8, 2, 8);
        // Deeper claw marks
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(19, 16, 1, 8);
        ctx.fillRect(43, 14, 1, 10);
        ctx.fillRect(29, 10, 1, 4);

        // Nose — straight, patrician, stone
        ctx.fillStyle = P.gray;
        ctx.fillRect(30, 26, 4, 6);
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(31, 26, 2, 4);

        // Mouth — thin, cold, imperious
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(26, 34, 12, 2);
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(28, 34, 8, 1);

        // Crown remnant — sun-shaped diadem, partially broken
        ctx.fillStyle = '#a08020';
        ctx.fillRect(18, 2, 28, 6);
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(20, 3, 24, 4);
        // Crown points — sun rays (some broken)
        ctx.fillStyle = '#a08020';
        ctx.fillRect(26, -2, 4, 6);
        ctx.fillRect(34, -2, 4, 6);
        ctx.fillRect(18, 0, 4, 4);
        // Broken point (right side snapped off)
        ctx.fillRect(42, 2, 3, 3);
        // Sun ray fragments
        ctx.fillStyle = '#806018';
        ctx.fillRect(22, 0, 2, 4);
        ctx.fillRect(38, 0, 2, 3);
        // Crown gem — faded gold
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(29, 4, 6, 3);
        ctx.fillStyle = '#d0b040';
        ctx.fillRect(30, 4, 4, 2);

        // Cracks radiating outward from damage
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(16, 28, 2, 2);
        ctx.fillRect(46, 26, 2, 2);
        ctx.fillRect(22, 38, 2, 2);
        ctx.fillRect(38, 40, 2, 1);
        ctx.fillRect(20, 14, 1, 3);

        // Base/pedestal
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(8, 44, 48, 8);
        ctx.fillStyle = P.gray;
        ctx.fillRect(10, 44, 44, 2);
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(12, 44, 40, 1);
        // Pedestal base
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(6, 52, 52, 12);
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(8, 52, 48, 4);

        // Faint golden glow from the sun crown
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#c0a040';
        ctx.fillRect(12, 0, 40, 16);
        ctx.globalAlpha = 0.06;
        ctx.fillRect(8, 0, 48, 24);
        ctx.globalAlpha = 1;
      });

      // Sign — weathered wooden signpost, carved text, nailed to a post
      mp('sign', function (ctx) {
        // Outdoor dusk background
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#101828';
        ctx.fillRect(4, 4, 56, 56);

        // Wooden post — dark, weathered
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(28, 34, 8, 30);
        ctx.fillStyle = '#4a2818';
        ctx.fillRect(29, 36, 6, 26);
        // Wood grain on post
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(31, 38, 1, 20);
        ctx.fillRect(33, 36, 1, 22);

        // Sign board — wide, wooden, slightly crooked
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(4, 6, 56, 30);
        ctx.fillStyle = '#4a2818';
        ctx.fillRect(6, 8, 52, 26);
        ctx.fillStyle = '#5a3820';
        ctx.fillRect(8, 10, 48, 22);
        // Wood grain texture
        ctx.fillStyle = '#4a2818';
        ctx.fillRect(10, 12, 44, 1);
        ctx.fillRect(10, 18, 44, 1);
        ctx.fillRect(10, 24, 44, 1);
        // Board edge bevel
        ctx.fillStyle = '#6a4828';
        ctx.fillRect(8, 10, 48, 1);
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(8, 31, 48, 1);

        // Nails — holding the board to the post
        ctx.fillStyle = P.gray;
        ctx.fillRect(10, 14, 2, 2);
        ctx.fillRect(52, 14, 2, 2);
        ctx.fillRect(10, 26, 2, 2);
        ctx.fillRect(52, 26, 2, 2);
        // Nail highlights
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(10, 14, 1, 1);
        ctx.fillRect(52, 14, 1, 1);

        // Carved/painted text lines (abstract — suggesting words)
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(14, 14, 18, 2);
        ctx.fillRect(36, 14, 12, 2);
        ctx.fillRect(14, 19, 24, 2);
        ctx.fillRect(14, 24, 10, 2);
        ctx.fillRect(28, 24, 16, 2);
        // Faded paint (lighter lines showing through)
        ctx.fillStyle = '#7a5830';
        ctx.fillRect(14, 28, 20, 1);

        // Scratched graffiti at bottom — "GOOD LUCK" suggestion
        ctx.fillStyle = '#8a6838';
        ctx.fillRect(18, 28, 8, 1);
        ctx.fillRect(30, 28, 10, 1);
      });

      // Inscription — ancient stone carving, weathered runes
      mp('inscription', function (ctx) {
        // Dark temple stone background
        ctx.fillStyle = '#0a0a0e';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#141418';
        ctx.fillRect(4, 4, 56, 56);

        // Stone tablet — carved, ancient
        ctx.fillStyle = '#2a2a30';
        ctx.fillRect(6, 4, 52, 56);
        ctx.fillStyle = '#3a3a42';
        ctx.fillRect(8, 6, 48, 52);
        ctx.fillStyle = '#4a4a54';
        ctx.fillRect(10, 8, 44, 48);
        // Stone border — carved frame
        ctx.fillStyle = '#3a3a42';
        ctx.fillRect(8, 6, 48, 2);
        ctx.fillRect(8, 56, 48, 2);
        ctx.fillRect(8, 6, 2, 52);
        ctx.fillRect(54, 6, 2, 52);
        // Inner bevel
        ctx.fillStyle = '#5a5a64';
        ctx.fillRect(10, 8, 44, 1);
        ctx.fillStyle = '#2a2a30';
        ctx.fillRect(10, 55, 44, 1);

        // Carved rune lines — ancient script
        ctx.fillStyle = '#2a2a34';
        // Line 1 — longest, most legible
        ctx.fillRect(14, 14, 4, 3); ctx.fillRect(20, 14, 6, 3);
        ctx.fillRect(28, 14, 3, 3); ctx.fillRect(34, 14, 8, 3);
        ctx.fillRect(44, 14, 5, 3);
        // Line 2
        ctx.fillRect(14, 22, 8, 3); ctx.fillRect(24, 22, 4, 3);
        ctx.fillRect(30, 22, 6, 3); ctx.fillRect(40, 22, 9, 3);
        // Line 3 — partially clawed away
        ctx.fillRect(14, 30, 5, 3); ctx.fillRect(22, 30, 3, 3);
        ctx.fillRect(38, 30, 6, 3);
        // Line 4 — mostly illegible
        ctx.fillRect(14, 38, 3, 3);
        ctx.fillRect(44, 38, 5, 3);

        // Claw damage — goblin scratches across the stone
        ctx.fillStyle = '#2a2a30';
        ctx.fillRect(26, 28, 2, 10);
        ctx.fillRect(30, 26, 2, 14);
        ctx.fillRect(34, 30, 2, 8);
        // Deeper scratches
        ctx.fillStyle = '#1a1a20';
        ctx.fillRect(27, 30, 1, 6);
        ctx.fillRect(31, 28, 1, 10);

        // Faint purple glow from remaining runes (magical)
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#8060c0';
        ctx.fillRect(14, 12, 36, 8);
        ctx.fillRect(14, 20, 36, 8);
        ctx.globalAlpha = 1;

        // Dust/age texture — tiny light spots
        ctx.fillStyle = '#5a5a64';
        ctx.fillRect(16, 46, 1, 1); ctx.fillRect(24, 48, 1, 1);
        ctx.fillRect(38, 44, 1, 1); ctx.fillRect(46, 50, 1, 1);
        ctx.fillRect(20, 52, 1, 1); ctx.fillRect(42, 46, 1, 1);
      });

      // =================================================================
      // PASS 5B: TILE ART VARIANTS
      // =================================================================

      // Grass with flowers
      mt('grass_flowers', function (ctx) {
        fill(ctx, P.lightGreen);
        dots(ctx, P.green, 10);
        // Small flowers
        ctx.fillStyle = P.yellow;
        ctx.fillRect(4, 5, 2, 2);
        ctx.fillStyle = P.red;
        ctx.fillRect(11, 10, 2, 2);
        ctx.fillStyle = P.paleBlue;
        ctx.fillRect(7, 13, 2, 2);
        // Stems
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(5, 7, 1, 2);
        ctx.fillRect(12, 12, 1, 2);
        ctx.fillRect(8, 15, 1, 1);
      });

      // Cracked stone floor
      mt('stone_cracked', function (ctx) {
        fill(ctx, P.stone);
        dots(ctx, P.darkStone, 8);
        // Cracks
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(3, 3, 1, 5);
        ctx.fillRect(4, 7, 3, 1);
        ctx.fillRect(7, 7, 1, 4);
        ctx.fillRect(10, 2, 1, 3);
        ctx.fillRect(10, 5, 4, 1);
        // Moss in cracks (deeper temple)
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(4, 8, 1, 1);
        ctx.fillRect(11, 3, 1, 1);
      });

      // Grass with tall tuft
      mt('grass_tuft', function (ctx) {
        fill(ctx, P.lightGreen);
        dots(ctx, P.green, 8);
        // Tall grass blades
        ctx.fillStyle = P.green;
        ctx.fillRect(6, 6, 1, 6);
        ctx.fillRect(7, 5, 1, 7);
        ctx.fillRect(8, 7, 1, 5);
        ctx.fillRect(10, 6, 1, 5);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(9, 6, 1, 6);
      });

      // Animated water frame 2
      mt('water_frame2', function (ctx) {
        fill(ctx, P.blue);
        ctx.fillStyle = P.darkBlue;
        ctx.fillRect(0, 2, 16, 2);
        ctx.fillRect(0, 8, 16, 2);
        ctx.fillRect(0, 14, 16, 2);
        // Shifted highlights (different from frame 1)
        ctx.fillStyle = P.lightBlue;
        ctx.fillRect(6, 1, 3, 1);
        ctx.fillRect(1, 5, 3, 1);
        ctx.fillRect(10, 7, 4, 1);
        ctx.fillRect(3, 11, 3, 1);
        ctx.fillRect(12, 13, 3, 1);
      });

      // Torch flame variant frames
      mt('torch_flame2', function (ctx) {
        fill(ctx, P.stone);
        dots(ctx, P.darkStone, 5);
        // Torch base
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(6, 8, 4, 8);
        // Flame variant 2
        ctx.fillStyle = P.gold;
        ctx.fillRect(6, 4, 4, 5);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(7, 2, 3, 4);
        ctx.fillStyle = P.white;
        ctx.fillRect(7, 4, 2, 2);
      });

      mt('torch_flame3', function (ctx) {
        fill(ctx, P.stone);
        dots(ctx, P.darkStone, 5);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(6, 8, 4, 8);
        // Flame variant 3 (leaning right)
        ctx.fillStyle = P.gold;
        ctx.fillRect(7, 4, 4, 5);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(8, 2, 3, 4);
        ctx.fillStyle = P.white;
        ctx.fillRect(8, 3, 2, 2);
      });

      // =================================================================
      // PASS 5B: ENHANCED HEART DROP (chunky pixel heart with highlight)
      // =================================================================

      mi('heart_drop', function (ctx) {
        var rows = [
          '..rr.rr..',
          '.rRRrRRr.',
          'rRRRRRRRr',
          'rRRRRRRRr',
          '.rRRRRRr.',
          '..rRRRr..',
          '...rRr...',
          '....r....',
        ];
        var hpal = {
          'r': P.red, 'R': P.lightRed
        };
        dp(ctx, rows, hpal, 4, 4);
        // Highlight
        ctx.fillStyle = P.white;
        ctx.fillRect(6, 5, 2, 2);
      });

      // =================================================================
      // PASS 5C: PROJECTILE SPRITES
      // =================================================================

      S.create('projectile_purple', 8, 8, function (ctx) {
        circ(ctx, 4, 4, 3, P.purple);
        circ(ctx, 4, 4, 2, P.lightPurple);
        ctx.fillStyle = P.white;
        ctx.fillRect(3, 3, 2, 2);
      });

      S.create('projectile_purple_glow', 12, 12, function (ctx) {
        ctx.globalAlpha = 0.3;
        circ(ctx, 6, 6, 5, P.purple);
        ctx.globalAlpha = 0.6;
        circ(ctx, 6, 6, 3, P.lightPurple);
        ctx.globalAlpha = 1;
        circ(ctx, 6, 6, 2, P.white);
      });

      // Crate sprite for destructible objects
      S.create('crate', 16, 16, function (ctx) {
        ctx.fillStyle = P.brown;
        ctx.fillRect(1, 1, 14, 14);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(0, 0, 16, 1);
        ctx.fillRect(0, 15, 16, 1);
        ctx.fillRect(0, 0, 1, 16);
        ctx.fillRect(15, 0, 1, 16);
        // Cross planks
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(2, 7, 12, 2);
        ctx.fillRect(7, 2, 2, 12);
        // Nails
        ctx.fillStyle = P.gray;
        ctx.fillRect(3, 3, 1, 1);
        ctx.fillRect(12, 3, 1, 1);
        ctx.fillRect(3, 12, 1, 1);
        ctx.fillRect(12, 12, 1, 1);
      });

      // Barrel sprite
      S.create('barrel', 16, 16, function (ctx) {
        ctx.fillStyle = P.brown;
        ctx.fillRect(3, 1, 10, 14);
        ctx.fillRect(2, 3, 12, 10);
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(3, 0, 10, 1);
        ctx.fillRect(3, 15, 10, 1);
        // Metal bands
        ctx.fillStyle = P.gray;
        ctx.fillRect(2, 4, 12, 1);
        ctx.fillRect(2, 11, 12, 1);
        // Highlight
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(5, 6, 2, 4);
      });

      // =================================================================
      // PAUSE MENU ICONS (8x8 each)
      // =================================================================

      // Resume icon - green play triangle pointing right
      S.create('icon_resume', 8, 8, function (ctx) {
        ctx.fillStyle = P.green;
        ctx.beginPath();
        ctx.moveTo(2, 1);
        ctx.lineTo(7, 4);
        ctx.lineTo(2, 7);
        ctx.closePath();
        ctx.fill();
        // Highlight edge
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(2, 2, 1, 4);
      });

      // Controls icon - small gamepad outline
      S.create('icon_controls', 8, 8, function (ctx) {
        // Gamepad body
        ctx.fillStyle = P.gray;
        ctx.fillRect(1, 2, 6, 4);
        ctx.fillRect(0, 3, 8, 2);
        // D-pad (left side)
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(2, 3, 1, 2);
        ctx.fillRect(1, 4, 3, 1);
        // Buttons (right side)
        ctx.fillStyle = P.lightBlue;
        ctx.fillRect(5, 3, 1, 1);
        ctx.fillStyle = P.lightRed;
        ctx.fillRect(6, 4, 1, 1);
      });

      // Bestiary icon - small book
      S.create('icon_bestiary', 8, 8, function (ctx) {
        // Book cover
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(1, 1, 6, 6);
        // Pages
        ctx.fillStyle = P.white;
        ctx.fillRect(2, 2, 4, 4);
        // Spine
        ctx.fillStyle = P.brown;
        ctx.fillRect(1, 1, 1, 6);
        // Text lines
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(3, 3, 3, 1);
        ctx.fillRect(3, 5, 2, 1);
      });

      // Quit icon - small door
      S.create('icon_quit', 8, 8, function (ctx) {
        // Door frame
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(2, 0, 5, 8);
        // Door panel
        ctx.fillStyle = P.brown;
        ctx.fillRect(3, 1, 3, 6);
        // Handle
        ctx.fillStyle = P.gold;
        ctx.fillRect(5, 4, 1, 1);
        // Arrow pointing out (exit)
        ctx.fillStyle = P.red;
        ctx.fillRect(0, 3, 3, 1);
        ctx.fillRect(0, 2, 1, 3);
      });
    }
  };

})();
