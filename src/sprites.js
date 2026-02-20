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
      // PASS 5B: CHARACTER PORTRAITS (128x128, chest-up, for dialogue)
      // =================================================================

      function mp(name, fn) { S.create('portrait_' + name, 128, 128, fn); }

      // Fawks - warm, round face, barkeep apron
      // Fawks - nonbinary innkeeper (they/them), fashionable, warm, kind eyes
      mp('fawks', function (ctx) {
        // Warm tavern background — rich amber glow (128x128)
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#1c1010';
        ctx.fillRect(4, 8, 120, 120);
        ctx.fillStyle = '#241810';
        ctx.fillRect(8, 12, 112, 116);
        ctx.fillStyle = '#281a12';
        ctx.fillRect(12, 16, 104, 108);
        ctx.fillStyle = '#2a1c14';
        ctx.fillRect(16, 20, 96, 100);
        ctx.fillStyle = '#2c1e16';
        ctx.fillRect(20, 24, 88, 92);

        // Shoulders — white button-down shirt with dark vest
        // Shirt base — crisp white, visible at shoulders and collar
        ctx.fillStyle = '#b8b8b8';
        ctx.fillRect(10, 90, 108, 38);
        ctx.fillStyle = '#c8c8c8';
        ctx.fillRect(12, 92, 104, 36);
        ctx.fillStyle = '#d8d8d8';
        ctx.fillRect(14, 92, 100, 34);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(16, 92, 96, 32);
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(18, 93, 92, 30);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(20, 94, 88, 28);
        ctx.fillStyle = '#f4f4f4';
        ctx.fillRect(22, 95, 84, 26);

        // Vest over shirt — fitted, charcoal with subtle sheen
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(24, 92, 80, 36);
        ctx.fillStyle = '#20202c';
        ctx.fillRect(26, 93, 76, 34);
        ctx.fillStyle = '#2a2a34';
        ctx.fillRect(28, 94, 72, 32);
        ctx.fillStyle = '#2e2e3a';
        ctx.fillRect(30, 95, 68, 30);
        ctx.fillStyle = '#323240';
        ctx.fillRect(32, 96, 64, 28);
        ctx.fillStyle = '#383846';
        ctx.fillRect(34, 97, 60, 26);

        // Vest fabric texture — subtle vertical lines
        ctx.fillStyle = '#2c2c38';
        ctx.fillRect(36, 96, 2, 26);
        ctx.fillRect(44, 96, 2, 26);
        ctx.fillRect(52, 96, 2, 26);
        ctx.fillRect(60, 96, 2, 26);
        ctx.fillRect(68, 96, 2, 26);
        ctx.fillRect(76, 96, 2, 26);
        ctx.fillRect(84, 96, 2, 26);

        // Vest lapels — angled, tailored
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(28, 92, 8, 20);
        ctx.fillRect(92, 92, 8, 20);
        ctx.fillStyle = '#252530';
        ctx.fillRect(29, 93, 6, 18);
        ctx.fillRect(93, 93, 6, 18);
        ctx.fillStyle = '#3a3a48';
        ctx.fillRect(30, 94, 4, 16);
        ctx.fillRect(94, 94, 4, 16);
        ctx.fillStyle = '#404050';
        ctx.fillRect(31, 95, 2, 14);
        ctx.fillRect(95, 95, 2, 14);

        // Vest buttons — three brass buttons down center, larger and more detailed
        ctx.fillStyle = '#8a7428';
        ctx.fillRect(61, 95, 6, 6);
        ctx.fillRect(61, 103, 6, 6);
        ctx.fillRect(61, 111, 6, 6);
        ctx.fillStyle = '#a08830';
        ctx.fillRect(62, 96, 4, 4);
        ctx.fillRect(62, 104, 4, 4);
        ctx.fillRect(62, 112, 4, 4);
        ctx.fillStyle = '#b89a38';
        ctx.fillRect(62, 96, 3, 3);
        ctx.fillRect(62, 104, 3, 3);
        ctx.fillRect(62, 112, 3, 3);
        ctx.fillStyle = '#c0a840';
        ctx.fillRect(62, 96, 2, 2);
        ctx.fillRect(62, 104, 2, 2);
        ctx.fillRect(62, 112, 2, 2);
        ctx.fillStyle = '#d0b850';
        ctx.fillRect(62, 96, 1, 1);
        ctx.fillRect(62, 104, 1, 1);
        ctx.fillRect(62, 112, 1, 1);

        // Shirt collar — white, popped slightly above vest
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(42, 78, 44, 16);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(44, 80, 40, 14);
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(48, 80, 32, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(50, 81, 28, 10);

        // Collar points — more defined
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(44, 80, 6, 8);
        ctx.fillRect(78, 80, 6, 8);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(45, 81, 4, 6);
        ctx.fillRect(79, 81, 4, 6);

        // Collar shadow and folds
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(48, 89, 32, 2);
        ctx.fillStyle = '#d8d8d8';
        ctx.fillRect(48, 90, 32, 2);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(50, 87, 28, 2);

        // Top button undone — hint of skin
        ctx.fillStyle = '#d8a078';
        ctx.fillRect(56, 81, 16, 8);
        ctx.fillStyle = P.skin;
        ctx.fillRect(58, 82, 12, 6);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(60, 82, 8, 4);
        ctx.fillStyle = '#f8e0d0';
        ctx.fillRect(62, 83, 4, 2);

        // Shirt sleeve edges peeking past vest at shoulders
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(14, 93, 10, 14);
        ctx.fillRect(104, 93, 10, 14);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(16, 94, 8, 12);
        ctx.fillRect(104, 94, 8, 12);
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(17, 95, 6, 10);
        ctx.fillRect(105, 95, 6, 10);

        // Neck — graceful, slender with more shading
        ctx.fillStyle = '#c09060';
        ctx.fillRect(48, 70, 32, 18);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(50, 72, 28, 16);
        ctx.fillStyle = '#d8a878';
        ctx.fillRect(51, 73, 26, 15);
        ctx.fillStyle = P.skin;
        ctx.fillRect(52, 72, 24, 14);
        ctx.fillStyle = '#e8c098';
        ctx.fillRect(53, 73, 22, 12);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(54, 74, 20, 8);
        ctx.fillStyle = '#f8e0c8';
        ctx.fillRect(56, 75, 16, 6);

        // Subtle neck shadow on left
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(50, 74, 3, 10);
        ctx.fillStyle = P.skin;
        ctx.fillRect(53, 75, 2, 8);

        // Face — soft-featured, warm, androgynous with enhanced detail
        ctx.fillStyle = '#b89060';
        ctx.fillRect(26, 26, 76, 52);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(28, 28, 72, 48);
        ctx.fillStyle = '#d0a070';
        ctx.fillRect(30, 29, 68, 47);
        ctx.fillStyle = P.skin;
        ctx.fillRect(32, 28, 64, 46);
        ctx.fillStyle = '#e0b890';
        ctx.fillRect(34, 30, 60, 44);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(36, 32, 56, 40);
        ctx.fillStyle = '#f4d8b8';
        ctx.fillRect(38, 34, 52, 36);

        // Forehead highlighting
        ctx.fillStyle = '#f8e0c8';
        ctx.fillRect(42, 34, 44, 10);
        ctx.fillStyle = '#fce8d0';
        ctx.fillRect(46, 35, 36, 6);

        // Warm cheeks — soft firelight glow, more gradual
        ctx.fillStyle = '#e0b090';
        ctx.fillRect(34, 54, 12, 10);
        ctx.fillRect(82, 54, 12, 10);
        ctx.fillStyle = '#e8b898';
        ctx.fillRect(36, 56, 10, 8);
        ctx.fillRect(82, 56, 10, 8);
        ctx.fillStyle = '#f0c0a0';
        ctx.fillRect(38, 58, 6, 4);
        ctx.fillRect(84, 58, 6, 4);
        ctx.fillStyle = '#f4c8a8';
        ctx.fillRect(40, 59, 4, 2);
        ctx.fillRect(86, 59, 4, 2);

        // Soft jawline — androgynous, more gradual shading
        ctx.fillStyle = '#d8a878';
        ctx.fillRect(30, 66, 6, 8);
        ctx.fillRect(92, 66, 6, 8);
        ctx.fillStyle = P.skin;
        ctx.fillRect(32, 68, 4, 6);
        ctx.fillRect(92, 68, 4, 6);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(34, 70, 3, 4);
        ctx.fillRect(91, 70, 3, 4);
        ctx.fillRect(36, 72, 4, 2);
        ctx.fillRect(88, 72, 4, 2);

        // Eyes — warm amber, large, expressive with enhanced detail
        // Groomed brows — arched, intentional, thicker
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(40, 36, 20, 4);
        ctx.fillRect(72, 36, 20, 4);
        ctx.fillStyle = '#4a2a12';
        ctx.fillRect(41, 37, 18, 3);
        ctx.fillRect(73, 37, 18, 3);
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(42, 37, 16, 2);
        ctx.fillRect(74, 37, 16, 2);
        // Brow arch taper
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(38, 38, 4, 2);
        ctx.fillRect(90, 38, 4, 2);

        // Upper eyelid crease
        ctx.fillStyle = '#d8a878';
        ctx.fillRect(40, 41, 20, 1);
        ctx.fillRect(72, 41, 20, 1);

        // Eye whites with subtle shading
        ctx.fillStyle = '#e8e0d8';
        ctx.fillRect(40, 44, 20, 12);
        ctx.fillRect(72, 44, 20, 12);
        ctx.fillStyle = '#f0e8e0';
        ctx.fillRect(41, 44, 18, 11);
        ctx.fillRect(73, 44, 18, 11);
        ctx.fillStyle = '#f4ece4';
        ctx.fillRect(42, 45, 16, 10);
        ctx.fillRect(74, 45, 16, 10);

        // Upper eyelid line — darker, more defined
        ctx.fillStyle = '#4a2a10';
        ctx.fillRect(40, 42, 20, 2);
        ctx.fillRect(72, 42, 20, 2);
        ctx.fillStyle = '#5a3820';
        ctx.fillRect(40, 43, 20, 1);
        ctx.fillRect(72, 43, 20, 1);

        // Upper eyelash detail
        ctx.fillStyle = '#2a1a08';
        ctx.fillRect(41, 42, 2, 1);
        ctx.fillRect(45, 42, 2, 1);
        ctx.fillRect(49, 42, 2, 1);
        ctx.fillRect(53, 42, 2, 1);
        ctx.fillRect(57, 42, 2, 1);
        ctx.fillRect(73, 42, 2, 1);
        ctx.fillRect(77, 42, 2, 1);
        ctx.fillRect(81, 42, 2, 1);
        ctx.fillRect(85, 42, 2, 1);
        ctx.fillRect(89, 42, 2, 1);

        // Amber irises — more layers for depth
        ctx.fillStyle = '#6a4010';
        ctx.fillRect(43, 44, 15, 12);
        ctx.fillRect(75, 44, 15, 12);
        ctx.fillStyle = '#7a4a10';
        ctx.fillRect(44, 44, 14, 12);
        ctx.fillRect(76, 44, 14, 12);
        ctx.fillStyle = '#8a5418';
        ctx.fillRect(45, 45, 12, 10);
        ctx.fillRect(77, 45, 12, 10);
        ctx.fillStyle = '#9a6020';
        ctx.fillRect(46, 46, 10, 8);
        ctx.fillRect(78, 46, 10, 8);
        ctx.fillStyle = '#aa7028';
        ctx.fillRect(47, 47, 8, 6);
        ctx.fillRect(79, 47, 8, 6);
        ctx.fillStyle = '#b07820';
        ctx.fillRect(48, 48, 6, 4);
        ctx.fillRect(80, 48, 6, 4);
        ctx.fillStyle = '#b88828';
        ctx.fillRect(49, 49, 4, 2);
        ctx.fillRect(81, 49, 4, 2);

        // Pupils with subtle edge
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(49, 48, 6, 6);
        ctx.fillRect(81, 48, 6, 6);
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(50, 48, 4, 4);
        ctx.fillRect(82, 48, 4, 4);

        // Warm catch-light — larger, more defined
        ctx.fillStyle = '#e8d090';
        ctx.fillRect(45, 44, 5, 5);
        ctx.fillRect(77, 44, 5, 5);
        ctx.fillStyle = '#f0d8a0';
        ctx.fillRect(46, 44, 4, 4);
        ctx.fillRect(78, 44, 4, 4);
        ctx.fillStyle = '#f8e8c0';
        ctx.fillRect(46, 44, 3, 3);
        ctx.fillRect(78, 44, 3, 3);
        ctx.fillStyle = '#fcf0d8';
        ctx.fillRect(46, 44, 2, 2);
        ctx.fillRect(78, 44, 2, 2);

        // Lower lash line with detail
        ctx.fillStyle = '#a08868';
        ctx.fillRect(40, 55, 20, 2);
        ctx.fillRect(72, 55, 20, 2);
        ctx.fillStyle = '#b09878';
        ctx.fillRect(40, 56, 20, 1);
        ctx.fillRect(72, 56, 20, 1);

        // Lower eyelash detail
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(42, 56, 2, 1);
        ctx.fillRect(46, 56, 2, 1);
        ctx.fillRect(50, 56, 2, 1);
        ctx.fillRect(54, 56, 2, 1);
        ctx.fillRect(74, 56, 2, 1);
        ctx.fillRect(78, 56, 2, 1);
        ctx.fillRect(82, 56, 2, 1);
        ctx.fillRect(86, 56, 2, 1);

        // Smile crinkles — more detailed
        ctx.fillStyle = '#d8a878';
        ctx.fillRect(36, 51, 3, 5);
        ctx.fillRect(89, 51, 3, 5);
        ctx.fillStyle = P.skin;
        ctx.fillRect(36, 52, 4, 4);
        ctx.fillRect(88, 52, 4, 4);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(37, 53, 2, 2);
        ctx.fillRect(89, 53, 2, 2);

        // Nose — neat, defined bridge with more shading
        ctx.fillStyle = '#d8a878';
        ctx.fillRect(58, 50, 12, 12);
        ctx.fillStyle = P.skin;
        ctx.fillRect(60, 52, 8, 10);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(62, 52, 4, 6);
        ctx.fillStyle = '#fce8d0';
        ctx.fillRect(62, 52, 3, 4);

        // Nose bridge highlight
        ctx.fillStyle = '#f8e0c8';
        ctx.fillRect(62, 48, 4, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(63, 49, 2, 3);

        // Nostrils — more defined
        ctx.fillStyle = '#b89060';
        ctx.fillRect(57, 59, 5, 3);
        ctx.fillRect(66, 59, 5, 3);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(58, 60, 4, 2);
        ctx.fillRect(66, 60, 4, 2);
        ctx.fillStyle = '#8a6040';
        ctx.fillRect(59, 60, 2, 1);
        ctx.fillRect(67, 60, 2, 1);

        // Mouth — warm, genuine smile with more detail
        // Lip line shadow
        ctx.fillStyle = '#8a3838';
        ctx.fillRect(46, 65, 36, 2);
        ctx.fillStyle = '#904040';
        ctx.fillRect(48, 66, 32, 2);
        ctx.fillStyle = '#983c3c';
        ctx.fillRect(52, 66, 24, 1);

        // Upper lip
        ctx.fillStyle = '#a04848';
        ctx.fillRect(48, 68, 32, 4);
        ctx.fillStyle = '#b05858';
        ctx.fillRect(50, 68, 28, 3);

        // Lower lip with highlight
        ctx.fillStyle = '#b85858';
        ctx.fillRect(50, 70, 28, 3);
        ctx.fillStyle = '#c06868';
        ctx.fillRect(52, 68, 24, 4);
        ctx.fillStyle = '#c87070';
        ctx.fillRect(54, 69, 20, 3);

        // Lower lip shine
        ctx.fillStyle = '#d08080';
        ctx.fillRect(56, 70, 16, 2);
        ctx.fillStyle = '#d89090';
        ctx.fillRect(58, 70, 12, 1);

        // Upturned smile corners
        ctx.fillStyle = '#a04848';
        ctx.fillRect(46, 66, 4, 2);
        ctx.fillRect(78, 66, 4, 2);
        ctx.fillStyle = '#b05858';
        ctx.fillRect(45, 67, 3, 1);
        ctx.fillRect(80, 67, 3, 1);

        // Mouth bottom edge
        ctx.fillStyle = '#c87070';
        ctx.fillRect(52, 71, 24, 1);
        ctx.fillStyle = P.skin;
        ctx.fillRect(52, 72, 24, 2);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(54, 73, 20, 1);

        // Hair — auburn, styled with a dramatic flop over the right eye
        // Base mass — rich dark auburn, swept from left to right
        ctx.fillStyle = '#2a1008';
        ctx.fillRect(18, 6, 92, 32);
        ctx.fillRect(14, 12, 100, 28);
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(20, 8, 88, 28);
        ctx.fillRect(16, 16, 12, 36);
        ctx.fillRect(100, 16, 12, 20);
        ctx.fillRect(28, 4, 68, 8);
        ctx.fillRect(16, 8, 16, 16);

        // Hair depth and shadows
        ctx.fillStyle = '#4a2410';
        ctx.fillRect(22, 10, 84, 24);
        ctx.fillRect(18, 18, 10, 30);

        // Auburn mid-tones — more varied
        ctx.fillStyle = '#5a2c14';
        ctx.fillRect(26, 8, 18, 18);
        ctx.fillRect(50, 6, 18, 20);
        ctx.fillRect(74, 8, 22, 18);
        ctx.fillStyle = '#6a3018';
        ctx.fillRect(28, 8, 16, 16);
        ctx.fillRect(52, 6, 16, 18);
        ctx.fillRect(76, 8, 20, 16);
        ctx.fillStyle = '#7a3c20';
        ctx.fillRect(30, 9, 12, 14);
        ctx.fillRect(54, 7, 12, 16);
        ctx.fillRect(78, 9, 16, 14);

        // Warm highlights — glossy, well-kept, more detailed
        ctx.fillStyle = '#804018';
        ctx.fillRect(32, 8, 8, 14);
        ctx.fillRect(58, 6, 8, 14);
        ctx.fillRect(82, 8, 8, 14);
        ctx.fillStyle = '#904820';
        ctx.fillRect(32, 8, 6, 12);
        ctx.fillRect(60, 6, 6, 12);
        ctx.fillRect(84, 8, 6, 12);
        ctx.fillStyle = '#a05828';
        ctx.fillRect(34, 9, 4, 10);
        ctx.fillRect(62, 7, 4, 10);
        ctx.fillRect(86, 9, 4, 10);
        ctx.fillStyle = '#b06028';
        ctx.fillRect(36, 10, 4, 8);
        ctx.fillRect(64, 8, 4, 8);
        ctx.fillRect(88, 10, 4, 8);
        ctx.fillStyle = '#c07030';
        ctx.fillRect(37, 11, 2, 6);
        ctx.fillRect(65, 9, 2, 6);
        ctx.fillRect(89, 11, 2, 6);

        // Individual hair strands at top
        ctx.fillStyle = '#904820';
        ctx.fillRect(34, 6, 2, 4);
        ctx.fillRect(48, 5, 2, 4);
        ctx.fillRect(62, 6, 2, 4);
        ctx.fillRect(76, 6, 2, 4);
        ctx.fillRect(90, 7, 2, 4);

        // THE FLOP — dramatic swoop of hair falling over right eye
        // Sweeps from top-left across forehead, droops over right eye
        ctx.fillStyle = '#2a1008';
        ctx.fillRect(66, 22, 36, 14);
        ctx.fillRect(74, 18, 32, 10);
        ctx.fillRect(78, 26, 28, 14);
        ctx.fillRect(86, 34, 24, 14);
        ctx.fillRect(94, 42, 16, 10);
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(68, 24, 32, 12);
        ctx.fillRect(76, 20, 28, 8);
        ctx.fillRect(80, 28, 24, 12);
        ctx.fillRect(88, 36, 20, 12);
        ctx.fillRect(96, 44, 12, 8);

        // Flop depth shadows
        ctx.fillStyle = '#4a2410';
        ctx.fillRect(70, 26, 28, 10);
        ctx.fillRect(78, 30, 22, 10);
        ctx.fillRect(86, 38, 18, 10);

        // Flop mid-tones — shows the curve and body
        ctx.fillStyle = '#5a2c14';
        ctx.fillRect(72, 24, 26, 10);
        ctx.fillRect(78, 28, 22, 10);
        ctx.fillRect(86, 36, 18, 10);
        ctx.fillRect(94, 44, 10, 8);
        ctx.fillStyle = '#6a3018';
        ctx.fillRect(72, 24, 24, 8);
        ctx.fillRect(80, 28, 20, 8);
        ctx.fillRect(88, 36, 16, 8);
        ctx.fillRect(96, 44, 8, 6);
        ctx.fillStyle = '#7a3c20';
        ctx.fillRect(74, 25, 20, 7);
        ctx.fillRect(82, 29, 16, 7);
        ctx.fillRect(90, 37, 12, 7);

        // Flop highlights — the glossy arc
        ctx.fillStyle = '#804018';
        ctx.fillRect(76, 24, 10, 8);
        ctx.fillRect(84, 28, 10, 8);
        ctx.fillRect(92, 36, 8, 8);
        ctx.fillStyle = '#904820';
        ctx.fillRect(76, 24, 8, 6);
        ctx.fillRect(84, 28, 8, 6);
        ctx.fillRect(92, 36, 6, 6);
        ctx.fillStyle = '#a05828';
        ctx.fillRect(78, 25, 6, 5);
        ctx.fillRect(86, 29, 6, 5);
        ctx.fillRect(94, 37, 5, 5);
        ctx.fillStyle = '#b06028';
        ctx.fillRect(80, 24, 4, 4);
        ctx.fillRect(88, 30, 4, 4);
        ctx.fillRect(94, 38, 4, 4);
        ctx.fillStyle = '#c07030';
        ctx.fillRect(81, 25, 2, 3);
        ctx.fillRect(89, 31, 2, 3);
        ctx.fillRect(95, 39, 2, 3);

        // Flop individual strands
        ctx.fillStyle = '#904820';
        ctx.fillRect(82, 32, 2, 6);
        ctx.fillRect(90, 40, 2, 6);
        ctx.fillRect(98, 46, 2, 4);

        // Left side — swept back behind ear, shorter
        ctx.fillStyle = '#2a1008';
        ctx.fillRect(10, 22, 14, 32);
        ctx.fillRect(6, 14, 10, 24);
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(12, 24, 12, 28);
        ctx.fillRect(8, 16, 8, 20);
        ctx.fillStyle = '#4a2410';
        ctx.fillRect(13, 26, 10, 24);
        ctx.fillStyle = '#6a3018';
        ctx.fillRect(14, 28, 8, 16);
        ctx.fillStyle = '#7a3c20';
        ctx.fillRect(15, 30, 6, 12);
        ctx.fillStyle = '#904820';
        ctx.fillRect(16, 32, 4, 8);
        ctx.fillStyle = '#b06028';
        ctx.fillRect(17, 34, 2, 4);

        // Left ear visible (hair swept back on this side)
        ctx.fillStyle = '#b89060';
        ctx.fillRect(18, 46, 10, 14);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(20, 48, 8, 12);
        ctx.fillStyle = '#d0a070';
        ctx.fillRect(21, 49, 6, 10);
        ctx.fillStyle = P.skin;
        ctx.fillRect(22, 50, 4, 8);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(23, 51, 2, 6);

        // Ear detail
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(21, 52, 2, 4);
        ctx.fillStyle = P.skin;
        ctx.fillRect(22, 53, 1, 2);

        // Gold earring with purple gem — larger and more detailed
        ctx.fillStyle = '#907820';
        ctx.fillRect(16, 51, 5, 10);
        ctx.fillStyle = P.gold;
        ctx.fillRect(17, 52, 4, 8);
        ctx.fillStyle = '#d0a838';
        ctx.fillRect(17, 52, 3, 7);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(18, 52, 2, 4);
        ctx.fillStyle = '#f0d050';
        ctx.fillRect(18, 52, 1, 2);

        // Purple gem on earring
        ctx.fillStyle = '#6a2a8a';
        ctx.fillRect(17, 57, 4, 3);
        ctx.fillStyle = P.lightPurple;
        ctx.fillRect(18, 58, 3, 2);
        ctx.fillStyle = '#c08ae0';
        ctx.fillRect(18, 58, 2, 1);
      });


      // Helena - halfline village leader, short curly strawberry red hair, chain of office
      mp('helena', function (ctx) {
        // Muted green-dark background (her office, candlelit) — enhanced gradients
        ctx.fillStyle = '#0a140a';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#0c160c';
        ctx.fillRect(6, 16, 116, 112);
        ctx.fillStyle = '#0e1a0e';
        ctx.fillRect(8, 20, 112, 108);
        ctx.fillStyle = '#101c10';
        ctx.fillRect(12, 24, 104, 100);
        ctx.fillStyle = '#121e12';
        ctx.fillRect(16, 28, 96, 92);

        // Shoulders — high-collared green vestment (looks big on her)
        ctx.fillStyle = '#1a4a1a';
        ctx.fillRect(8, 96, 112, 32);
        ctx.fillStyle = '#1a4c1a';
        ctx.fillRect(12, 98, 104, 28);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(16, 96, 96, 28);
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(24, 98, 80, 24);
        // Vestment fabric detail — subtle weave texture
        ctx.fillStyle = '#1a5c1a';
        ctx.fillRect(28, 100, 4, 20);
        ctx.fillRect(36, 100, 4, 20);
        ctx.fillRect(44, 100, 4, 20);
        ctx.fillRect(52, 100, 4, 20);
        ctx.fillRect(60, 100, 4, 20);
        ctx.fillRect(68, 100, 4, 20);
        ctx.fillRect(76, 100, 4, 20);
        ctx.fillRect(84, 100, 4, 20);
        ctx.fillRect(92, 100, 4, 20);
        // Tall stiff collar — a bit oversized for her halfline frame
        ctx.fillStyle = '#1a4a1a';
        ctx.fillRect(28, 80, 16, 20);
        ctx.fillRect(84, 80, 16, 20);
        ctx.fillStyle = '#1a5018';
        ctx.fillRect(30, 82, 12, 16);
        ctx.fillRect(86, 82, 12, 16);
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(32, 82, 10, 16);
        ctx.fillRect(86, 82, 10, 16);
        // Collar gold trim — detailed embroidery
        ctx.fillStyle = P.gold;
        ctx.fillRect(28, 80, 4, 16);
        ctx.fillRect(96, 80, 4, 16);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(28, 80, 2, 14);
        ctx.fillRect(96, 80, 2, 14);
        ctx.fillStyle = P.gold;
        ctx.fillRect(29, 82, 1, 2);
        ctx.fillRect(29, 86, 1, 2);
        ctx.fillRect(29, 90, 1, 2);
        ctx.fillRect(97, 82, 1, 2);
        ctx.fillRect(97, 86, 1, 2);
        ctx.fillRect(97, 90, 1, 2);
        // Chain of office — ornate gold, slightly big on her
        ctx.fillStyle = P.gold;
        ctx.fillRect(44, 96, 4, 2);
        ctx.fillRect(48, 98, 4, 2);
        ctx.fillRect(52, 96, 6, 2);
        ctx.fillRect(58, 98, 4, 2);
        ctx.fillRect(66, 98, 4, 2);
        ctx.fillRect(70, 96, 6, 2);
        ctx.fillRect(76, 98, 4, 2);
        ctx.fillRect(80, 96, 4, 2);
        // Chain link detail
        ctx.fillStyle = P.yellow;
        ctx.fillRect(44, 96, 2, 1);
        ctx.fillRect(52, 96, 2, 1);
        ctx.fillRect(70, 96, 2, 1);
        ctx.fillRect(80, 96, 2, 1);
        // Pendant — green gem in gold setting (enhanced with more detail)
        ctx.fillStyle = P.gold;
        ctx.fillRect(58, 100, 12, 10);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(58, 100, 2, 8);
        ctx.fillRect(68, 100, 2, 8);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(60, 102, 8, 6);
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(61, 103, 6, 4);
        ctx.fillStyle = P.paleGreen;
        ctx.fillRect(62, 103, 4, 3);
        ctx.fillStyle = '#a0f0a0';
        ctx.fillRect(62, 103, 2, 2);

        // Neck — short, sturdy (halfline build), enhanced shading
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(48, 76, 32, 16);
        ctx.fillStyle = '#d4a074';
        ctx.fillRect(50, 76, 28, 14);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(50, 76, 28, 12);
        ctx.fillStyle = '#f4ddc4';
        ctx.fillRect(52, 76, 24, 10);
        ctx.fillStyle = '#f8e4d0';
        ctx.fillRect(54, 76, 20, 8);
        // Neck shadow from chin
        ctx.fillStyle = '#e8c8a8';
        ctx.fillRect(56, 76, 16, 2);

        // Face — round, soft, warm (halfline heritage), enhanced detail
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(22, 30, 84, 50);
        ctx.fillStyle = P.skin;
        ctx.fillRect(24, 32, 80, 48);
        ctx.fillStyle = '#ecc094';
        ctx.fillRect(26, 34, 76, 46);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(28, 32, 72, 46);
        ctx.fillStyle = '#f4ddc4';
        ctx.fillRect(32, 36, 64, 40);
        ctx.fillStyle = '#f8e4d0';
        ctx.fillRect(36, 38, 56, 36);
        // Full round cheeks (halfline trait) — multiple gradient layers
        ctx.fillStyle = '#f0c8a8';
        ctx.fillRect(32, 56, 14, 10);
        ctx.fillRect(82, 56, 14, 10);
        ctx.fillStyle = '#ecc0a0';
        ctx.fillRect(33, 57, 12, 8);
        ctx.fillRect(83, 57, 12, 8);
        ctx.fillStyle = '#e8c0a0';
        ctx.fillRect(34, 58, 10, 6);
        ctx.fillRect(84, 58, 10, 6);
        ctx.fillStyle = '#e4b898';
        ctx.fillRect(35, 59, 8, 4);
        ctx.fillRect(85, 59, 8, 4);
        // Freckles — scattered across nose and cheeks (strawberry redhead) — MORE!
        ctx.fillStyle = '#d0a080';
        // Upper cheeks
        ctx.fillRect(40, 54, 2, 2); ctx.fillRect(44, 52, 2, 2);
        ctx.fillRect(54, 50, 2, 2); ctx.fillRect(58, 52, 2, 2);
        ctx.fillRect(70, 52, 2, 2); ctx.fillRect(74, 50, 2, 2);
        ctx.fillRect(84, 54, 2, 2); ctx.fillRect(88, 52, 2, 2);
        // Mid cheeks
        ctx.fillRect(48, 58, 2, 2); ctx.fillRect(52, 56, 2, 2);
        ctx.fillRect(76, 56, 2, 2); ctx.fillRect(80, 58, 2, 2);
        // Bridge of nose
        ctx.fillRect(62, 54, 2, 2); ctx.fillRect(66, 54, 2, 2);
        ctx.fillRect(60, 56, 2, 2); ctx.fillRect(68, 56, 2, 2);
        // Lower cheeks — lighter freckles
        ctx.fillStyle = '#d8a888';
        ctx.fillRect(42, 60, 2, 2); ctx.fillRect(46, 62, 2, 2);
        ctx.fillRect(38, 58, 2, 2); ctx.fillRect(50, 60, 2, 2);
        ctx.fillRect(78, 60, 2, 2); ctx.fillRect(82, 62, 2, 2);
        ctx.fillRect(90, 58, 2, 2); ctx.fillRect(86, 60, 2, 2);
        // Soft round jawline — enhanced roundness
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(28, 72, 6, 6);
        ctx.fillRect(94, 72, 6, 6);
        ctx.fillRect(24, 70, 4, 4);
        ctx.fillRect(100, 70, 4, 4);
        ctx.fillRect(34, 76, 4, 2);
        ctx.fillRect(90, 76, 4, 2);
        ctx.fillStyle = '#f4ddc4';
        ctx.fillRect(28, 74, 4, 3);
        ctx.fillRect(96, 74, 4, 3);

        // Eyes — large bright green (halfline proportion: big relative to face)
        // Strawberry-tinted brows — expressive arches, enhanced detail
        ctx.fillStyle = '#a04818';
        ctx.fillRect(36, 40, 22, 4);
        ctx.fillRect(74, 40, 22, 4);
        ctx.fillStyle = '#903810';
        ctx.fillRect(37, 40, 20, 3);
        ctx.fillRect(75, 40, 20, 3);
        ctx.fillStyle = '#803810';
        ctx.fillRect(38, 40, 18, 2);
        ctx.fillRect(76, 40, 18, 2);
        // Brow arch highlights
        ctx.fillStyle = '#b05820';
        ctx.fillRect(42, 41, 4, 1);
        ctx.fillRect(78, 41, 4, 1);
        // Eye whites — large, bright, open
        ctx.fillStyle = '#f0e8e0';
        ctx.fillRect(36, 46, 24, 12);
        ctx.fillRect(72, 46, 24, 12);
        ctx.fillStyle = '#f4ece4';
        ctx.fillRect(38, 47, 20, 10);
        ctx.fillRect(74, 47, 20, 10);
        // Upper lid line — defined crease
        ctx.fillStyle = '#804020';
        ctx.fillRect(36, 44, 24, 2);
        ctx.fillRect(72, 44, 24, 2);
        ctx.fillStyle = '#9a5028';
        ctx.fillRect(38, 45, 20, 1);
        ctx.fillRect(74, 45, 20, 1);
        // Green irises — vivid, steady (large at this scale)
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(40, 46, 18, 12);
        ctx.fillRect(76, 46, 18, 12);
        ctx.fillStyle = '#1a6c1a';
        ctx.fillRect(42, 47, 14, 10);
        ctx.fillRect(78, 47, 14, 10);
        ctx.fillStyle = P.green;
        ctx.fillRect(44, 48, 10, 8);
        ctx.fillRect(80, 48, 10, 8);
        // Bright iris center with radial detail
        ctx.fillStyle = '#3aa03a';
        ctx.fillRect(45, 49, 8, 6);
        ctx.fillRect(81, 49, 8, 6);
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(46, 50, 6, 4);
        ctx.fillRect(82, 50, 6, 4);
        // Pupils — slightly dilated (warm candlelight)
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(48, 50, 4, 4);
        ctx.fillRect(84, 50, 4, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(49, 51, 2, 2);
        ctx.fillRect(85, 51, 2, 2);
        // Warm catch-light (candlelit) — enhanced sparkle
        ctx.fillStyle = '#f0e8d0';
        ctx.fillRect(44, 46, 4, 4);
        ctx.fillRect(80, 46, 4, 4);
        ctx.fillStyle = '#f8f0e0';
        ctx.fillRect(44, 46, 2, 2);
        ctx.fillRect(80, 46, 2, 2);
        ctx.fillStyle = '#fffef8';
        ctx.fillRect(44, 46, 1, 1);
        ctx.fillRect(80, 46, 1, 1);
        // Secondary catch-light
        ctx.fillStyle = '#e8e0c8';
        ctx.fillRect(52, 54, 2, 2);
        ctx.fillRect(88, 54, 2, 2);
        // Lower lash line — soft shadow
        ctx.fillStyle = '#c0a088';
        ctx.fillRect(36, 58, 24, 2);
        ctx.fillRect(72, 58, 24, 2);
        ctx.fillStyle = '#d0b098';
        ctx.fillRect(38, 59, 20, 1);
        ctx.fillRect(74, 59, 20, 1);

        // Nose — small, upturned (a charming halfline nose), enhanced shape
        ctx.fillStyle = P.skin;
        ctx.fillRect(60, 52, 8, 10);
        ctx.fillStyle = '#ecb894';
        ctx.fillRect(60, 54, 8, 8);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(61, 54, 6, 6);
        // Bridge highlight
        ctx.fillStyle = '#f8e4d0';
        ctx.fillRect(62, 54, 4, 4);
        // Nostrils — delicate
        ctx.fillStyle = '#e0b898';
        ctx.fillRect(58, 60, 4, 2);
        ctx.fillRect(66, 60, 4, 2);
        ctx.fillStyle = '#d0a888';
        ctx.fillRect(59, 60, 2, 1);
        ctx.fillRect(67, 60, 2, 1);
        // Tiny upturned tip
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(62, 54, 4, 4);
        ctx.fillStyle = '#fcf0e0';
        ctx.fillRect(63, 55, 2, 2);

        // Mouth — composed, firm but kind (she carries the town), enhanced detail
        ctx.fillStyle = '#b04848';
        ctx.fillRect(48, 68, 32, 4);
        ctx.fillStyle = '#c05858';
        ctx.fillRect(50, 68, 28, 4);
        ctx.fillStyle = '#d06868';
        ctx.fillRect(52, 68, 24, 4);
        // Upper lip bow — Cupid's bow definition
        ctx.fillStyle = '#a04040';
        ctx.fillRect(56, 66, 16, 2);
        ctx.fillStyle = '#904040';
        ctx.fillRect(62, 66, 4, 2);
        // Upper lip shadow
        ctx.fillStyle = '#983838';
        ctx.fillRect(58, 67, 12, 1);
        // Lower lip — fuller, softer
        ctx.fillStyle = '#d87878';
        ctx.fillRect(56, 72, 16, 2);
        ctx.fillStyle = '#e08888';
        ctx.fillRect(58, 72, 12, 2);
        // Lower lip highlight
        ctx.fillStyle = '#e89898';
        ctx.fillRect(60, 72, 8, 1);
        // Firm corners (composed expression)
        ctx.fillStyle = '#f4ddc4';
        ctx.fillRect(44, 68, 4, 2);
        ctx.fillRect(80, 68, 4, 2);
        ctx.fillStyle = '#e8c8a8';
        ctx.fillRect(46, 69, 2, 1);
        ctx.fillRect(80, 69, 2, 1);

        // Hair — short bouncy strawberry red curls (the defining feature!)
        // Base curl mass — foundation layer
        ctx.fillStyle = '#8a2a10';
        ctx.fillRect(20, 12, 88, 28);
        ctx.fillRect(16, 20, 12, 24);
        ctx.fillRect(100, 20, 12, 24);
        ctx.fillRect(12, 24, 8, 16);
        ctx.fillRect(108, 24, 8, 16);
        // Curly top silhouette — irregular bumps = individual curls (enhanced)
        ctx.fillRect(24, 8, 16, 8);
        ctx.fillRect(44, 4, 16, 12);
        ctx.fillRect(64, 8, 16, 8);
        ctx.fillRect(84, 8, 12, 8);
        ctx.fillRect(32, 4, 12, 8);
        ctx.fillRect(96, 10, 8, 6);
        // Additional curl bumps
        ctx.fillRect(40, 6, 8, 6);
        ctx.fillRect(72, 6, 8, 6);
        ctx.fillRect(52, 3, 8, 8);
        // Mid-tone curl layer
        ctx.fillStyle = '#a03818';
        ctx.fillRect(22, 14, 10, 10);
        ctx.fillRect(46, 8, 10, 10);
        ctx.fillRect(70, 14, 10, 10);
        ctx.fillRect(94, 14, 10, 10);
        ctx.fillRect(38, 10, 8, 8);
        // Strawberry highlights — warm orange-red tones (enhanced)
        ctx.fillStyle = '#c04818';
        ctx.fillRect(28, 12, 10, 12);
        ctx.fillRect(48, 8, 10, 12);
        ctx.fillRect(68, 12, 10, 12);
        ctx.fillRect(88, 12, 10, 12);
        ctx.fillRect(36, 6, 8, 8);
        ctx.fillRect(74, 6, 8, 8);
        ctx.fillRect(54, 5, 6, 8);
        // Intermediate highlight layer
        ctx.fillStyle = '#d05820';
        ctx.fillRect(30, 13, 6, 8);
        ctx.fillRect(50, 9, 6, 8);
        ctx.fillRect(70, 13, 6, 8);
        ctx.fillRect(90, 13, 6, 8);
        // Bright curl tips catching candlelight
        ctx.fillStyle = '#d86030';
        ctx.fillRect(32, 12, 4, 8);
        ctx.fillRect(52, 8, 4, 8);
        ctx.fillRect(72, 12, 4, 8);
        ctx.fillRect(92, 12, 4, 8);
        ctx.fillRect(40, 6, 4, 6);
        ctx.fillRect(76, 6, 4, 6);
        // Hot highlights (candlelight on curls) — enhanced glow
        ctx.fillStyle = '#e87838';
        ctx.fillRect(34, 14, 2, 4);
        ctx.fillRect(54, 10, 2, 4);
        ctx.fillRect(74, 14, 2, 4);
        ctx.fillRect(94, 14, 2, 4);
        ctx.fillRect(42, 7, 2, 3);
        // Peak highlights
        ctx.fillStyle = '#f89048';
        ctx.fillRect(34, 14, 1, 2);
        ctx.fillRect(54, 10, 1, 2);
        ctx.fillRect(74, 14, 1, 2);
        // Deep shadows between curls — enhanced depth
        ctx.fillStyle = '#601808';
        ctx.fillRect(40, 16, 4, 12);
        ctx.fillRect(60, 12, 4, 12);
        ctx.fillRect(80, 16, 4, 12);
        ctx.fillRect(26, 16, 4, 8);
        ctx.fillRect(96, 16, 4, 8);
        // Additional shadow detail
        ctx.fillStyle = '#501008';
        ctx.fillRect(42, 18, 2, 6);
        ctx.fillRect(62, 14, 2, 6);
        ctx.fillRect(82, 18, 2, 6);
        // Side curls — short, bouncy, framing the round face
        ctx.fillStyle = '#8a2a10';
        ctx.fillRect(16, 36, 10, 16);
        ctx.fillRect(102, 36, 10, 16);
        ctx.fillStyle = '#a03818';
        ctx.fillRect(17, 38, 8, 12);
        ctx.fillRect(103, 38, 8, 12);
        ctx.fillStyle = '#c04818';
        ctx.fillRect(18, 40, 6, 8);
        ctx.fillRect(104, 40, 6, 8);
        ctx.fillStyle = '#d86030';
        ctx.fillRect(20, 42, 2, 4);
        ctx.fillRect(106, 42, 2, 4);
        // Temple wisps — little curls escaping (enhanced detail)
        ctx.fillStyle = '#8a2a10';
        ctx.fillRect(28, 36, 4, 6);
        ctx.fillRect(96, 36, 4, 6);
        ctx.fillRect(26, 38, 3, 4);
        ctx.fillRect(99, 38, 3, 4);
        ctx.fillStyle = '#c04818';
        ctx.fillRect(28, 37, 2, 4);
        ctx.fillRect(98, 37, 2, 4);
        // Lower hair mass framing face
        ctx.fillStyle = '#8a2a10';
        ctx.fillRect(20, 40, 6, 12);
        ctx.fillRect(102, 40, 6, 12);
        ctx.fillStyle = '#a03818';
        ctx.fillRect(21, 42, 4, 8);
        ctx.fillRect(103, 42, 4, 8);
      });

      // Elira Voss - half-elf guard captain (she/her), severe face, pointed ears, scar
      mp('elira', function (ctx) {
        // Cold steel-blue background (garrison, pre-dawn) - 128x128
        ctx.fillStyle = '#0e0e1a';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#141420';
        ctx.fillRect(8, 12, 112, 116);
        ctx.fillStyle = '#181828';
        ctx.fillRect(16, 20, 96, 100);
        // Additional background depth layer
        ctx.fillStyle = '#1c1c2c';
        ctx.fillRect(20, 24, 88, 92);

        // Armor — layered plate, battle-worn, imposing
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(8, 92, 112, 36);
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(16, 92, 96, 32);
        ctx.fillStyle = '#3a3a48';
        ctx.fillRect(24, 94, 80, 28);
        // Additional armor plate shading
        ctx.fillStyle = '#42424e';
        ctx.fillRect(28, 96, 72, 24);
        // Armor edge highlights
        ctx.fillStyle = '#4a4a58';
        ctx.fillRect(32, 98, 64, 2);

        // Pauldrons — raised, angular, battle-scarred
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(4, 84, 28, 20);
        ctx.fillRect(96, 84, 28, 20);
        // Pauldron base shading
        ctx.fillStyle = '#444454';
        ctx.fillRect(6, 86, 24, 16);
        ctx.fillRect(98, 86, 24, 16);

        // Pauldron highlights (metal sheen)
        ctx.fillStyle = P.gray;
        ctx.fillRect(8, 84, 20, 4);
        ctx.fillRect(100, 84, 20, 4);
        ctx.fillStyle = '#5a5a6a';
        ctx.fillRect(12, 84, 12, 2);
        ctx.fillRect(104, 84, 12, 2);
        // Additional metal reflection
        ctx.fillStyle = '#7a7a8a';
        ctx.fillRect(14, 84, 8, 1);
        ctx.fillRect(106, 84, 8, 1);

        // Pauldron rivets (enhanced detail)
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(12, 92, 4, 4);
        ctx.fillRect(24, 92, 4, 4);
        ctx.fillRect(100, 92, 4, 4);
        ctx.fillRect(112, 92, 4, 4);
        // Rivet highlights
        ctx.fillStyle = P.white;
        ctx.fillRect(13, 92, 2, 2);
        ctx.fillRect(25, 92, 2, 2);
        ctx.fillRect(101, 92, 2, 2);
        ctx.fillRect(113, 92, 2, 2);
        // Additional rivet row
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(12, 100, 4, 4);
        ctx.fillRect(100, 100, 4, 4);

        // Battle damage on left pauldron (scratch)
        ctx.fillStyle = '#4a4a5a';
        ctx.fillRect(16, 88, 2, 6);
        ctx.fillRect(18, 90, 1, 4);

        // Gorget (neck armor)
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(36, 80, 56, 12);
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(40, 80, 48, 8);
        ctx.fillStyle = '#4a4a5a';
        ctx.fillRect(44, 80, 40, 2);
        // Gorget plate separation
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(62, 80, 4, 10);
        // Metal reflection on gorget
        ctx.fillStyle = '#5a5a6a';
        ctx.fillRect(46, 80, 36, 1);

        // Neck — long, elegant (elven heritage showing through the armor)
        ctx.fillStyle = '#8a6848';
        ctx.fillRect(48, 68, 32, 16);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(50, 68, 28, 14);
        ctx.fillStyle = P.skin;
        ctx.fillRect(52, 68, 24, 12);
        // Neck shadow and definition
        ctx.fillStyle = '#b89878';
        ctx.fillRect(58, 68, 12, 2);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(56, 76, 16, 3);

        // Face — narrow, severe, angular (half-elf: sharper than human)
        ctx.fillStyle = '#8a6848';
        ctx.fillRect(28, 20, 72, 56);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(32, 20, 64, 52);
        ctx.fillStyle = P.skin;
        ctx.fillRect(36, 24, 56, 46);
        // Mid-tone facial shading
        ctx.fillStyle = '#d8b090';
        ctx.fillRect(40, 28, 48, 40);

        // Extremely high sharp cheekbones (elven severity)
        ctx.fillStyle = '#d0a878';
        ctx.fillRect(36, 48, 10, 4);
        ctx.fillRect(82, 48, 10, 4);
        // Enhanced cheekbone highlights
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(38, 48, 6, 2);
        ctx.fillRect(84, 48, 6, 2);

        // Hollow beneath cheekbones (gaunt, severe)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(36, 52, 6, 8);
        ctx.fillRect(86, 52, 6, 8);
        // Deep shadow beneath cheekbones
        ctx.fillStyle = '#a87858';
        ctx.fillRect(38, 54, 4, 6);
        ctx.fillRect(86, 54, 4, 6);

        // Narrow jaw — tapers sharply (half-elf bone structure)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(32, 64, 6, 8);
        ctx.fillRect(90, 64, 6, 8);
        ctx.fillRect(38, 70, 4, 4);
        ctx.fillRect(86, 70, 4, 4);
        // Jaw definition
        ctx.fillStyle = '#a87858';
        ctx.fillRect(34, 66, 4, 6);
        ctx.fillRect(90, 66, 4, 6);

        // Sharp chin
        ctx.fillStyle = P.skin;
        ctx.fillRect(52, 72, 24, 2);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(48, 72, 4, 2);
        ctx.fillRect(76, 72, 4, 2);
        // Chin shadow
        ctx.fillStyle = '#b89878';
        ctx.fillRect(56, 70, 16, 2);

        // Pointed ears — elven heritage, prominent
        // Left ear
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(12, 32, 16, 20);
        ctx.fillStyle = P.skin;
        ctx.fillRect(16, 34, 10, 14);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(18, 36, 6, 10);
        // Ear inner detail
        ctx.fillStyle = '#d8a888';
        ctx.fillRect(20, 38, 4, 6);
        // Left ear point (extends upward and outward)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(8, 20, 10, 16);
        ctx.fillStyle = P.skin;
        ctx.fillRect(10, 24, 6, 8);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(12, 26, 2, 4);

        // Right ear
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(100, 32, 16, 20);
        ctx.fillStyle = P.skin;
        ctx.fillRect(102, 34, 10, 14);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(104, 36, 6, 10);
        // Ear inner detail
        ctx.fillStyle = '#d8a888';
        ctx.fillRect(104, 38, 4, 6);
        // Right ear point
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(110, 20, 10, 16);
        ctx.fillStyle = P.skin;
        ctx.fillRect(112, 24, 6, 8);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(114, 26, 2, 4);

        // Eyes — narrow, severe, upswept (elven slant)
        // Brows — severe, straight, low, heavy (intimidating)
        ctx.fillStyle = '#1a1010';
        ctx.fillRect(38, 32, 24, 4);
        ctx.fillRect(70, 32, 24, 4);
        // Brow depth and texture
        ctx.fillStyle = '#0a0808';
        ctx.fillRect(40, 32, 20, 2);
        ctx.fillRect(72, 32, 20, 2);
        // Inner brow emphasis (permanent scowl)
        ctx.fillStyle = '#1a1010';
        ctx.fillRect(58, 36, 6, 2);
        ctx.fillRect(68, 36, 6, 2);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(56, 36, 4, 2);
        ctx.fillRect(74, 36, 4, 2);

        // Eye whites — narrow, hooded (she does not look approachable)
        ctx.fillStyle = '#e0d8d0';
        ctx.fillRect(40, 40, 24, 8);
        ctx.fillRect(72, 40, 24, 8);
        // Eye white shading (less white, more realistic)
        ctx.fillStyle = '#d0c8c0';
        ctx.fillRect(41, 42, 22, 6);
        ctx.fillRect(73, 42, 22, 6);

        // Dark brown irises — large in the narrow slit
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(44, 40, 16, 8);
        ctx.fillRect(76, 40, 16, 8);
        // Iris outer ring
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(48, 42, 8, 4);
        ctx.fillRect(80, 42, 8, 4);
        // Inner iris detail
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(49, 43, 6, 3);
        ctx.fillRect(81, 43, 6, 3);

        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(50, 42, 4, 4);
        ctx.fillRect(82, 42, 4, 4);

        // Steel catch-light (cold garrison light)
        ctx.fillStyle = '#c0c8d8';
        ctx.fillRect(46, 40, 4, 4);
        ctx.fillRect(78, 40, 4, 4);
        // Additional subtle highlight
        ctx.fillStyle = '#d0d8e8';
        ctx.fillRect(47, 40, 2, 2);
        ctx.fillRect(79, 40, 2, 2);

        // Heavy under-eye shadow (severity carved into her face)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(40, 48, 24, 4);
        ctx.fillRect(72, 48, 24, 4);
        // Deep under-eye hollows
        ctx.fillStyle = '#a87858';
        ctx.fillRect(42, 48, 20, 2);
        ctx.fillRect(74, 48, 20, 2);

        // Elven upswept line at outer corners
        ctx.fillStyle = '#1a1010';
        ctx.fillRect(36, 40, 4, 4);
        ctx.fillRect(96, 40, 4, 4);
        ctx.fillRect(34, 38, 4, 2);
        ctx.fillRect(98, 38, 4, 2);
        // Enhanced upswept detail
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(34, 40, 2, 3);
        ctx.fillRect(100, 40, 2, 3);

        // Nose — long, straight, narrow (elven bridge)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(60, 44, 8, 16);
        ctx.fillStyle = P.skin;
        ctx.fillRect(60, 44, 6, 14);
        // Bridge highlight
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(62, 46, 2, 8);
        // Additional bridge shading
        ctx.fillStyle = '#d8b090';
        ctx.fillRect(64, 48, 2, 10);
        // Nose sides shadow
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(58, 54, 2, 4);
        ctx.fillRect(66, 54, 2, 4);
        // Narrow nostrils
        ctx.fillStyle = '#8a6848';
        ctx.fillRect(58, 58, 4, 2);
        ctx.fillRect(66, 58, 4, 2);
        // Nostril depth
        ctx.fillStyle = '#6a4838';
        ctx.fillRect(59, 58, 2, 2);
        ctx.fillRect(67, 58, 2, 2);

        // Mouth — thin, severe, downturned
        ctx.fillStyle = '#704040';
        ctx.fillRect(50, 64, 28, 4);
        ctx.fillStyle = '#885050';
        ctx.fillRect(54, 64, 20, 4);
        // Mouth center detail
        ctx.fillStyle = '#604040';
        ctx.fillRect(60, 65, 8, 2);

        // Downturned corners (resting severity)
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(46, 64, 4, 4);
        ctx.fillRect(78, 64, 4, 4);
        ctx.fillStyle = '#704040';
        ctx.fillRect(46, 68, 4, 2);
        ctx.fillRect(78, 68, 4, 2);

        // Upper lip — thin, precise
        ctx.fillStyle = '#604040';
        ctx.fillRect(54, 62, 20, 2);
        // Philtrum definition
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(62, 60, 4, 2);

        // Scar — jagged, healed, prominent (right side, badge of service)
        ctx.fillStyle = '#d08888';
        ctx.fillRect(86, 28, 4, 4);
        ctx.fillRect(84, 32, 4, 4);
        ctx.fillRect(86, 36, 4, 4);
        ctx.fillRect(84, 40, 4, 4);
        ctx.fillRect(86, 44, 4, 4);
        ctx.fillRect(84, 48, 4, 4);
        ctx.fillRect(82, 52, 4, 4);
        ctx.fillRect(82, 56, 4, 4);

        // Scar shadow (depth, texture)
        ctx.fillStyle = '#a06060';
        ctx.fillRect(88, 32, 2, 4);
        ctx.fillRect(90, 40, 2, 4);
        ctx.fillRect(88, 48, 2, 4);
        ctx.fillRect(86, 56, 2, 2);

        // Additional scar texture detail
        ctx.fillStyle = '#c07878';
        ctx.fillRect(85, 30, 2, 2);
        ctx.fillRect(87, 38, 2, 2);
        ctx.fillRect(85, 46, 2, 2);
        ctx.fillRect(83, 54, 2, 2);

        // Scar raised edge highlights
        ctx.fillStyle = '#e09898';
        ctx.fillRect(86, 29, 2, 1);
        ctx.fillRect(84, 33, 2, 1);
        ctx.fillRect(86, 37, 2, 1);

        // Hair — cropped short, military cut, near-black (no-nonsense)
        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(28, 4, 72, 24);
        ctx.fillRect(32, 0, 64, 8);
        // Hair base layer
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(32, 4, 64, 20);

        // Subtle sheen (healthy but strictly maintained)
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(44, 6, 16, 8);
        ctx.fillRect(72, 6, 12, 8);
        ctx.fillStyle = '#303040';
        ctx.fillRect(48, 6, 8, 4);
        ctx.fillRect(76, 6, 6, 4);

        // Additional hair highlights and texture
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(50, 6, 4, 2);
        ctx.fillRect(78, 6, 3, 2);
        ctx.fillStyle = '#252530';
        ctx.fillRect(40, 10, 12, 6);
        ctx.fillRect(76, 10, 12, 6);

        // Sides clipped tight above the ears
        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(24, 16, 8, 20);
        ctx.fillRect(96, 16, 8, 20);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(26, 20, 4, 12);
        ctx.fillRect(98, 20, 4, 12);

        // Hair edge detail (cropped precision)
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(28, 24, 4, 4);
        ctx.fillRect(96, 24, 4, 4);
      });

      // Braxon - gruff, broad, beard
      // Braxon - gruff blacksmith, broad, bushy beard, forge-lit
      mp('braxon', function (ctx) {
        // Forge glow background - enhanced with layered warmth
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(8, 12, 112, 116);
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(16, 20, 96, 100);
        // Additional forge glow layers
        ctx.fillStyle = '#4a2a14';
        ctx.fillRect(12, 16, 104, 108);
        ctx.fillStyle = '#351c0c';
        ctx.fillRect(20, 24, 88, 92);

        // Broad shoulders — thick leather apron over bare arms
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(4, 88, 120, 40);
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(12, 88, 104, 36);
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(16, 90, 96, 32);
        // Forge apron — thick leather, stained with enhanced texture
        ctx.fillStyle = '#6a2020';
        ctx.fillRect(40, 96, 48, 32);
        ctx.fillStyle = '#802828';
        ctx.fillRect(44, 98, 40, 28);
        ctx.fillStyle = '#903030';
        ctx.fillRect(48, 100, 32, 24);
        // Apron wear patterns and stains
        ctx.fillStyle = '#4a1414';
        ctx.fillRect(52, 102, 6, 8);
        ctx.fillRect(68, 106, 8, 10);
        // Apron straps - thicker, more detailed
        ctx.fillStyle = '#5a1818';
        ctx.fillRect(40, 88, 6, 12);
        ctx.fillRect(82, 88, 6, 12);
        ctx.fillStyle = '#702020';
        ctx.fillRect(42, 90, 2, 8);
        ctx.fillRect(84, 90, 2, 8);
        // Bare arms showing (thick, muscular) - enhanced musculature
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(12, 88, 28, 16);
        ctx.fillRect(88, 88, 28, 16);
        ctx.fillStyle = P.skin;
        ctx.fillRect(16, 90, 20, 12);
        ctx.fillRect(92, 90, 20, 12);
        ctx.fillStyle = '#d4a878';
        ctx.fillRect(18, 92, 16, 8);
        ctx.fillRect(94, 92, 16, 8);
        // Muscle definition shadows
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(22, 94, 2, 6);
        ctx.fillRect(98, 94, 2, 6);

        // Neck — thick, bull-necked with enhanced detail
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(44, 68, 40, 24);
        ctx.fillStyle = P.skin;
        ctx.fillRect(48, 68, 32, 20);
        ctx.fillStyle = '#d4a878';
        ctx.fillRect(52, 70, 24, 16);
        // Neck muscles and tendons
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(58, 72, 2, 12);
        ctx.fillRect(68, 72, 2, 12);

        // Face — broad, weathered, friendly-gruff with enhanced weathering
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(24, 20, 80, 52);
        ctx.fillStyle = P.skin;
        ctx.fillRect(28, 20, 72, 48);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(32, 24, 64, 42);
        ctx.fillStyle = '#f4d8b8';
        ctx.fillRect(36, 28, 56, 36);
        // Forge-heated cheeks - glowing warmth
        ctx.fillStyle = '#e0a888';
        ctx.fillRect(32, 48, 12, 8);
        ctx.fillRect(84, 48, 12, 8);
        ctx.fillStyle = '#e8b090';
        ctx.fillRect(34, 50, 8, 4);
        ctx.fillRect(86, 50, 8, 4);
        // Heavy jaw — square, strong with enhanced definition
        ctx.fillStyle = P.skin;
        ctx.fillRect(28, 60, 4, 8);
        ctx.fillRect(96, 60, 4, 8);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(26, 62, 2, 6);
        ctx.fillRect(100, 62, 2, 6);
        // Face weathering - forge scars and age lines
        ctx.fillStyle = '#d09060';
        ctx.fillRect(40, 32, 3, 2);
        ctx.fillRect(52, 36, 4, 2);
        ctx.fillRect(88, 34, 3, 2);

        // Eyes — small, deep-set under heavy brows (gruff but warm)
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(38, 32, 24, 4);
        ctx.fillRect(74, 32, 24, 4);
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(40, 34, 20, 2);
        ctx.fillRect(76, 34, 20, 2);
        // Heavy brow ridge - very prominent
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(36, 30, 28, 4);
        ctx.fillRect(72, 30, 28, 4);
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(38, 31, 24, 2);
        ctx.fillRect(74, 31, 24, 2);
        // Eye sockets - deep shadows
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(38, 36, 24, 2);
        ctx.fillRect(74, 36, 24, 2);
        // Eye whites — small (deep-set)
        ctx.fillStyle = '#e0d8d0';
        ctx.fillRect(40, 38, 16, 8);
        ctx.fillRect(76, 38, 16, 8);
        ctx.fillStyle = '#f0e8e0';
        ctx.fillRect(42, 40, 12, 4);
        ctx.fillRect(78, 40, 12, 4);
        // Dark brown irises
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(44, 38, 10, 8);
        ctx.fillRect(80, 38, 10, 8);
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(46, 40, 6, 4);
        ctx.fillRect(82, 40, 6, 4);
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(47, 41, 4, 2);
        ctx.fillRect(83, 41, 4, 2);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(48, 40, 4, 4);
        ctx.fillRect(84, 40, 4, 4);
        // Forge-fire catch-light (orange glow) - enhanced
        ctx.fillStyle = '#f0a860';
        ctx.fillRect(44, 38, 4, 4);
        ctx.fillRect(80, 38, 4, 4);
        ctx.fillStyle = '#f8c080';
        ctx.fillRect(45, 39, 2, 2);
        ctx.fillRect(81, 39, 2, 2);

        // Nose — broad, broken once (maybe twice) - enhanced detail
        ctx.fillStyle = P.skin;
        ctx.fillRect(58, 44, 12, 12);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(60, 46, 8, 8);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(56, 54, 4, 2);
        ctx.fillRect(68, 54, 4, 2);
        // Nostrils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(58, 54, 2, 2);
        ctx.fillRect(68, 54, 2, 2);
        // Slightly crooked bridge - broken nose detail
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(60, 44, 6, 8);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(64, 46, 4, 6);
        ctx.fillRect(62, 48, 2, 3);

        // MASSIVE bushy beard — his defining feature with extensive detail
        ctx.fillStyle = P.brown;
        ctx.fillRect(28, 56, 72, 32);
        ctx.fillRect(24, 60, 80, 28);
        ctx.fillRect(20, 68, 88, 20);
        ctx.fillRect(16, 72, 96, 16);
        // Beard volume (lighter mid-tones) - layered
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(32, 60, 64, 20);
        ctx.fillRect(28, 64, 72, 16);
        ctx.fillStyle = '#c08a50';
        ctx.fillRect(36, 64, 56, 14);
        // Beard texture — individual strand clusters with much more detail
        ctx.fillStyle = P.brown;
        ctx.fillRect(36, 64, 4, 16); ctx.fillRect(48, 68, 4, 12);
        ctx.fillRect(60, 64, 4, 16); ctx.fillRect(72, 68, 4, 12);
        ctx.fillRect(84, 64, 4, 16); ctx.fillRect(44, 70, 3, 10);
        ctx.fillRect(54, 72, 3, 8); ctx.fillRect(64, 70, 3, 10);
        ctx.fillRect(76, 72, 3, 8); ctx.fillRect(88, 70, 3, 10);
        // Additional fine beard strands
        ctx.fillStyle = '#6a3a10';
        ctx.fillRect(32, 68, 2, 14); ctx.fillRect(40, 72, 2, 10);
        ctx.fillRect(52, 74, 2, 8); ctx.fillRect(68, 74, 2, 8);
        ctx.fillRect(80, 72, 2, 10); ctx.fillRect(94, 68, 2, 14);
        // Beard highlights (forge glow) - dramatic lighting
        ctx.fillStyle = P.tan;
        ctx.fillRect(40, 60, 6, 8);
        ctx.fillRect(64, 60, 6, 8);
        ctx.fillRect(82, 60, 6, 8);
        ctx.fillRect(52, 64, 6, 6);
        ctx.fillRect(72, 66, 5, 5);
        // Forge glow on beard - warm orange
        ctx.fillStyle = '#e8a860';
        ctx.fillRect(42, 62, 4, 4);
        ctx.fillRect(66, 62, 4, 4);
        ctx.fillRect(54, 66, 3, 3);
        // Darker shadow strands - depth
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(32, 72, 4, 12); ctx.fillRect(44, 76, 4, 8);
        ctx.fillRect(56, 72, 4, 12); ctx.fillRect(68, 76, 4, 8);
        ctx.fillRect(80, 72, 4, 12); ctx.fillRect(92, 72, 4, 12);
        // Deep beard shadows
        ctx.fillStyle = '#3a2008';
        ctx.fillRect(30, 76, 3, 8); ctx.fillRect(48, 80, 3, 6);
        ctx.fillRect(62, 78, 3, 7); ctx.fillRect(78, 80, 3, 6);
        ctx.fillRect(95, 76, 3, 8);
        // Mouth hidden in beard — just a darker line
        ctx.fillStyle = '#804040';
        ctx.fillRect(52, 60, 24, 2);
        ctx.fillStyle = '#601818';
        ctx.fillRect(54, 62, 20, 2);

        // Hair — bald on top, thin dark fringe with enhanced detail
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(28, 8, 72, 20);
        ctx.fillRect(24, 16, 8, 12);
        ctx.fillRect(96, 16, 8, 12);
        ctx.fillStyle = '#5a3010';
        ctx.fillRect(30, 10, 68, 16);
        // Bald crown — skin showing through with shine
        ctx.fillStyle = P.skin;
        ctx.fillRect(36, 10, 56, 12);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(44, 12, 40, 8);
        ctx.fillStyle = '#f8e0c8';
        ctx.fillRect(50, 14, 28, 4);
        // Thin remaining hair strands
        ctx.fillStyle = P.darkBrown;
        ctx.fillRect(40, 8, 4, 6);
        ctx.fillRect(52, 8, 4, 4);
        ctx.fillRect(64, 8, 3, 3);
        ctx.fillRect(72, 8, 4, 4);
        ctx.fillRect(84, 8, 4, 6);
        // More sparse hair detail
        ctx.fillStyle = '#3a1808';
        ctx.fillRect(46, 9, 2, 4);
        ctx.fillRect(58, 9, 2, 3);
        ctx.fillRect(78, 9, 2, 4);
        // Sweat on bald head (forge heat) - enhanced glistening
        ctx.fillStyle = 'rgba(200, 200, 220, 0.4)';
        ctx.fillRect(56, 12, 4, 2);
        ctx.fillRect(68, 14, 4, 2);
        ctx.fillRect(60, 16, 3, 2);
        ctx.fillStyle = 'rgba(240, 240, 255, 0.3)';
        ctx.fillRect(64, 13, 2, 2);
        ctx.fillRect(72, 15, 2, 2);
      });

      // Rorik Flamebeard - red-haired dwarf, magnificent braided beard, chain mail
      mp('rorik', function (ctx) {
        // Warm stone background - enhanced layering
        ctx.fillStyle = '#2a1008';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#301810';
        ctx.fillRect(8, 12, 112, 116);
        ctx.fillStyle = '#3a2018';
        ctx.fillRect(12, 16, 104, 108);
        ctx.fillStyle = '#2a1410';
        ctx.fillRect(16, 20, 96, 100);

        // Broad shoulders — chain mail over padded tunic
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(4, 88, 120, 40);
        ctx.fillStyle = P.gray;
        ctx.fillRect(12, 90, 104, 36);
        ctx.fillStyle = '#7a7a8a';
        ctx.fillRect(16, 92, 96, 32);
        // Chain mail links (enhanced pattern with more detail)
        ctx.fillStyle = '#8a8a98';
        for (var cy = 92; cy < 120; cy += 6) {
          for (var cx = 16; cx < 112; cx += 8) {
            ctx.fillRect(cx, cy, 4, 2);
            ctx.fillRect(cx + 4, cy + 3, 4, 2);
          }
        }
        // Chain mail highlights
        ctx.fillStyle = '#a0a0b0';
        for (var cy = 92; cy < 120; cy += 12) {
          for (var cx = 20; cx < 108; cx += 16) {
            ctx.fillRect(cx, cy, 2, 1);
          }
        }
        // Chain mail shadows
        ctx.fillStyle = '#5a5a68';
        for (var cy = 96; cy < 120; cy += 12) {
          for (var cx = 24; cx < 104; cx += 16) {
            ctx.fillRect(cx, cy, 2, 1);
          }
        }
        // Padded collar - thicker
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(44, 84, 40, 8);
        ctx.fillStyle = '#4a4a5a';
        ctx.fillRect(46, 86, 36, 4);

        // Neck — thick, stocky dwarf build with enhanced detail
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(48, 68, 32, 20);
        ctx.fillStyle = P.skin;
        ctx.fillRect(50, 68, 28, 16);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(52, 70, 24, 12);
        ctx.fillStyle = '#f4d8c0';
        ctx.fillRect(54, 72, 20, 8);

        // Face — broad, round, ruddy (dwarf features) with enhanced layers
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(24, 20, 80, 52);
        ctx.fillStyle = P.skin;
        ctx.fillRect(28, 20, 72, 48);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(32, 24, 64, 42);
        ctx.fillStyle = '#f4d8c0';
        ctx.fillRect(36, 28, 56, 36);
        // Ruddy dwarf cheeks - enhanced warmth
        ctx.fillStyle = '#e0a080';
        ctx.fillRect(32, 48, 12, 8);
        ctx.fillRect(84, 48, 12, 8);
        ctx.fillStyle = '#e8b090';
        ctx.fillRect(34, 50, 8, 4);
        ctx.fillRect(86, 50, 8, 4);
        // Rosy glow
        ctx.fillStyle = '#f0b8a0';
        ctx.fillRect(36, 52, 4, 2);
        ctx.fillRect(88, 52, 4, 2);

        // Eyes — bright blue, determined, defiant
        // Thick red eyebrows (bushy) - enhanced volume
        ctx.fillStyle = '#c03010';
        ctx.fillRect(36, 32, 24, 6);
        ctx.fillRect(72, 32, 24, 6);
        ctx.fillStyle = '#d04020';
        ctx.fillRect(40, 32, 16, 4);
        ctx.fillRect(76, 32, 16, 4);
        ctx.fillStyle = '#e05030';
        ctx.fillRect(42, 33, 12, 2);
        ctx.fillRect(78, 33, 12, 2);
        // Eyebrow individual hairs
        ctx.fillStyle = '#b02810';
        ctx.fillRect(38, 34, 2, 3);
        ctx.fillRect(46, 35, 2, 2);
        ctx.fillRect(52, 34, 2, 3);
        ctx.fillRect(74, 34, 2, 3);
        ctx.fillRect(82, 35, 2, 2);
        ctx.fillRect(90, 34, 2, 3);
        // Eye whites - larger
        ctx.fillStyle = '#e8e0d8';
        ctx.fillRect(40, 40, 16, 10);
        ctx.fillRect(76, 40, 16, 10);
        ctx.fillStyle = '#f0e8e0';
        ctx.fillRect(42, 42, 12, 6);
        ctx.fillRect(78, 42, 12, 6);
        // Blue irises — vivid, determined, enhanced
        ctx.fillStyle = '#204080';
        ctx.fillRect(44, 40, 10, 10);
        ctx.fillRect(80, 40, 10, 10);
        ctx.fillStyle = '#3060b0';
        ctx.fillRect(46, 42, 6, 6);
        ctx.fillRect(82, 42, 6, 6);
        ctx.fillStyle = '#4070c0';
        ctx.fillRect(47, 43, 4, 4);
        ctx.fillRect(83, 43, 4, 4);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(48, 44, 4, 4);
        ctx.fillRect(84, 44, 4, 4);
        // Warm catch-light - enhanced
        ctx.fillStyle = '#f0d8a0';
        ctx.fillRect(44, 40, 4, 4);
        ctx.fillRect(80, 40, 4, 4);
        ctx.fillStyle = '#f8e8c0';
        ctx.fillRect(45, 41, 2, 2);
        ctx.fillRect(81, 41, 2, 2);

        // Nose — broad, strong dwarf nose - enhanced detail
        ctx.fillStyle = P.skin;
        ctx.fillRect(56, 48, 16, 10);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(58, 48, 10, 6);
        ctx.fillStyle = '#f4d8c0';
        ctx.fillRect(60, 50, 6, 4);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(56, 56, 6, 2);
        ctx.fillRect(66, 56, 6, 2);
        // Nostrils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(58, 56, 2, 2);
        ctx.fillRect(68, 56, 2, 2);

        // MAGNIFICENT braided red beard — cascades down the chest with extensive detail
        ctx.fillStyle = '#b03020';
        ctx.fillRect(24, 56, 80, 36);
        ctx.fillRect(20, 64, 88, 28);
        ctx.fillRect(16, 72, 96, 20);
        // Beard mid-tones - layered
        ctx.fillStyle = '#d04830';
        ctx.fillRect(32, 60, 64, 24);
        ctx.fillRect(28, 68, 72, 16);
        ctx.fillStyle = '#e05838';
        ctx.fillRect(36, 64, 56, 18);
        // Braided strands (three prominent braids) - enhanced thickness and detail
        ctx.fillStyle = '#901810';
        ctx.fillRect(40, 72, 8, 20); // left braid
        ctx.fillRect(60, 76, 8, 16);  // center braid
        ctx.fillRect(80, 72, 8, 20); // right braid
        // Braid weaving texture
        ctx.fillStyle = '#a02020';
        ctx.fillRect(42, 74, 4, 3);
        ctx.fillRect(42, 80, 4, 3);
        ctx.fillRect(42, 86, 4, 3);
        ctx.fillRect(62, 78, 4, 3);
        ctx.fillRect(62, 84, 4, 3);
        ctx.fillRect(82, 74, 4, 3);
        ctx.fillRect(82, 80, 4, 3);
        ctx.fillRect(82, 86, 4, 3);
        // Braid shadows
        ctx.fillStyle = '#701410';
        ctx.fillRect(40, 76, 2, 14);
        ctx.fillRect(60, 80, 2, 10);
        ctx.fillRect(80, 76, 2, 14);
        // Braid clasps — gold rings with enhanced detail
        ctx.fillStyle = P.gold;
        ctx.fillRect(40, 88, 8, 6);
        ctx.fillRect(60, 88, 8, 6);
        ctx.fillRect(80, 88, 8, 6);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(42, 90, 4, 2);
        ctx.fillRect(62, 90, 4, 2);
        ctx.fillRect(82, 90, 4, 2);
        // Gold highlights
        ctx.fillStyle = '#f0e060';
        ctx.fillRect(43, 89, 2, 1);
        ctx.fillRect(63, 89, 2, 1);
        ctx.fillRect(83, 89, 2, 1);
        // Beard highlights (flame-like orange) - enhanced drama
        ctx.fillStyle = '#e06038';
        ctx.fillRect(36, 60, 6, 8);
        ctx.fillRect(56, 64, 6, 6);
        ctx.fillRect(76, 60, 6, 8);
        ctx.fillRect(48, 66, 5, 5);
        ctx.fillRect(68, 68, 5, 5);
        // Flame-like orange tips
        ctx.fillStyle = '#f07040';
        ctx.fillRect(38, 62, 4, 4);
        ctx.fillRect(58, 66, 4, 4);
        ctx.fillRect(78, 62, 4, 4);
        // Beard strand texture - individual hairs
        ctx.fillStyle = '#c03828';
        ctx.fillRect(30, 64, 2, 12);
        ctx.fillRect(50, 68, 2, 10);
        ctx.fillRect(70, 66, 2, 12);
        ctx.fillRect(90, 64, 2, 12);
        // Deep beard shadows
        ctx.fillStyle = '#801c18';
        ctx.fillRect(26, 70, 3, 10);
        ctx.fillRect(52, 74, 3, 8);
        ctx.fillRect(74, 72, 3, 10);
        ctx.fillRect(96, 70, 3, 10);
        // Mouth line hidden in beard
        ctx.fillStyle = '#804040';
        ctx.fillRect(52, 60, 24, 2);
        ctx.fillStyle = '#601818';
        ctx.fillRect(54, 62, 20, 2);

        // Hair — wild, thick, fiery red with enhanced volume
        ctx.fillStyle = '#b03020';
        ctx.fillRect(24, 8, 80, 20);
        ctx.fillRect(20, 16, 12, 20);
        ctx.fillRect(96, 16, 12, 20);
        // Hair volume - massive
        ctx.fillRect(32, 4, 64, 8);
        ctx.fillStyle = '#c03828';
        ctx.fillRect(28, 6, 72, 12);
        // Hair highlights - flame-like
        ctx.fillStyle = '#d04830';
        ctx.fillRect(36, 8, 16, 8);
        ctx.fillRect(68, 8, 16, 8);
        ctx.fillStyle = '#e06038';
        ctx.fillRect(44, 6, 8, 4);
        ctx.fillRect(76, 6, 8, 4);
        ctx.fillStyle = '#f07040';
        ctx.fillRect(48, 5, 4, 2);
        ctx.fillRect(78, 5, 4, 2);
        // Side hair — wild and thick with enhanced texture
        ctx.fillStyle = '#b03020';
        ctx.fillRect(20, 28, 10, 20);
        ctx.fillRect(98, 28, 10, 20);
        ctx.fillStyle = '#d04830';
        ctx.fillRect(22, 32, 6, 12);
        ctx.fillRect(100, 32, 6, 12);
        // Wild hair strands sticking out
        ctx.fillStyle = '#c03828';
        ctx.fillRect(18, 30, 2, 8);
        ctx.fillRect(26, 26, 2, 6);
        ctx.fillRect(108, 30, 2, 8);
        ctx.fillRect(100, 26, 2, 6);
        // Hair individual strands on top
        ctx.fillStyle = '#a02820';
        ctx.fillRect(32, 10, 2, 6);
        ctx.fillRect(48, 8, 2, 5);
        ctx.fillRect(64, 9, 2, 6);
        ctx.fillRect(80, 8, 2, 5);
        ctx.fillRect(94, 10, 2, 6);
      });

      // Brother Soren - tabaxi monk, feline features, gentle wisdom
      mp('soren', function (ctx) {
        // Quiet chapel background — cool, contemplative (128x128)
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#1e1e30';
        ctx.fillRect(8, 12, 112, 116);
        ctx.fillStyle = '#222238';
        ctx.fillRect(16, 20, 96, 100);
        // Subtle light gradient
        ctx.fillStyle = '#242440';
        ctx.fillRect(20, 24, 88, 40);
        ctx.fillStyle = '#26264a';
        ctx.fillRect(28, 28, 72, 30);

        // Monk robes — simple, light blue, draped
        ctx.fillStyle = '#3060a0';
        ctx.fillRect(16, 92, 96, 36);
        ctx.fillStyle = P.lightBlue;
        ctx.fillRect(24, 92, 80, 32);
        ctx.fillStyle = '#80b0e0';
        ctx.fillRect(32, 94, 64, 28);
        // Additional highlight detail
        ctx.fillStyle = '#a0c8f0';
        ctx.fillRect(40, 96, 48, 20);
        // Robe collar — simple wrap
        ctx.fillStyle = '#3060a0';
        ctx.fillRect(40, 84, 48, 12);
        ctx.fillStyle = P.lightBlue;
        ctx.fillRect(44, 84, 40, 8);
        // Enhanced collar shading
        ctx.fillStyle = '#4070b0';
        ctx.fillRect(46, 86, 36, 4);
        // Robe fold detail (multiple folds)
        ctx.fillStyle = '#5090c8';
        ctx.fillRect(56, 96, 4, 24);
        ctx.fillRect(68, 96, 4, 24);
        // Additional subtle folds
        ctx.fillStyle = '#4080b8';
        ctx.fillRect(48, 98, 2, 20);
        ctx.fillRect(78, 98, 2, 20);

        // Neck — furred with fur texture detail
        ctx.fillStyle = '#8a6840';
        ctx.fillRect(48, 72, 32, 20);
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(50, 72, 28, 16);
        ctx.fillStyle = P.tan;
        ctx.fillRect(52, 74, 24, 12);
        // Fur texture strokes
        ctx.fillStyle = '#c0a070';
        ctx.fillRect(54, 76, 4, 8);
        ctx.fillRect(62, 78, 4, 6);
        ctx.fillRect(70, 76, 4, 8);

        // Face — feline, triangular, warm fur tones
        ctx.fillStyle = '#8a6840';
        ctx.fillRect(24, 24, 80, 52);
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(28, 24, 72, 48);
        ctx.fillStyle = P.tan;
        ctx.fillRect(32, 28, 64, 42);
        // Intermediate shading layer
        ctx.fillStyle = '#c89858';
        ctx.fillRect(36, 32, 56, 36);
        // Lighter muzzle area
        ctx.fillStyle = '#e8d8c0';
        ctx.fillRect(44, 48, 40, 20);
        ctx.fillStyle = '#f0e0d0';
        ctx.fillRect(48, 52, 32, 12);
        // Brightest muzzle highlight
        ctx.fillStyle = '#f8f0e8';
        ctx.fillRect(52, 54, 24, 8);
        // Tabby markings — subtle stripes on forehead
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(36, 28, 6, 4); ctx.fillRect(48, 24, 6, 4);
        ctx.fillRect(62, 24, 6, 4); ctx.fillRect(76, 28, 6, 4);
        ctx.fillRect(86, 28, 6, 4);
        // Additional smaller tabby marks
        ctx.fillStyle = '#7a5830';
        ctx.fillRect(40, 32, 4, 3); ctx.fillRect(52, 30, 4, 3);
        ctx.fillRect(72, 30, 4, 3); ctx.fillRect(84, 32, 4, 3);
        // Fur texture on cheeks
        ctx.fillStyle = '#d0a870';
        ctx.fillRect(34, 44, 3, 6);
        ctx.fillRect(91, 44, 3, 6);

        // Cat eyes — large, luminous, slitted pupils
        // Upper brow fur (thick, expressive)
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(36, 36, 24, 4);
        ctx.fillRect(72, 36, 24, 4);
        // Additional brow detail
        ctx.fillStyle = '#8a6840';
        ctx.fillRect(38, 38, 20, 2);
        ctx.fillRect(74, 38, 20, 2);
        // Eye shape — large, almond
        ctx.fillStyle = P.yellow;
        ctx.fillRect(36, 42, 24, 12);
        ctx.fillRect(72, 42, 24, 12);
        // Bright inner ring
        ctx.fillStyle = '#e8d040';
        ctx.fillRect(40, 44, 16, 8);
        ctx.fillRect(76, 44, 16, 8);
        // Brighter center
        ctx.fillStyle = '#f0e050';
        ctx.fillRect(42, 46, 12, 4);
        ctx.fillRect(78, 46, 12, 4);
        // Golden outer ring
        ctx.fillStyle = '#c0a020';
        ctx.fillRect(38, 42, 20, 2);
        ctx.fillRect(74, 42, 20, 2);
        ctx.fillRect(38, 52, 20, 2);
        ctx.fillRect(74, 52, 20, 2);
        // Darker golden edges
        ctx.fillStyle = '#a08010';
        ctx.fillRect(36, 42, 2, 12);
        ctx.fillRect(58, 42, 2, 12);
        ctx.fillRect(72, 42, 2, 12);
        ctx.fillRect(94, 42, 2, 12);
        // Slitted pupils — vertical
        ctx.fillStyle = P.black;
        ctx.fillRect(48, 42, 4, 12);
        ctx.fillRect(84, 42, 4, 12);
        // Wider at center
        ctx.fillRect(46, 46, 8, 4);
        ctx.fillRect(82, 46, 8, 4);
        // Eye shine (spiritual warmth)
        ctx.fillStyle = '#f0e8d0';
        ctx.fillRect(42, 44, 4, 4);
        ctx.fillRect(78, 44, 4, 4);
        // Secondary smaller shine
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(52, 48, 2, 2);
        ctx.fillRect(88, 48, 2, 2);

        // Nose — small pink cat nose (triangle)
        ctx.fillStyle = P.pink;
        ctx.fillRect(58, 56, 12, 6);
        ctx.fillStyle = '#e0a0a0';
        ctx.fillRect(60, 56, 8, 4);
        // Nose highlight
        ctx.fillStyle = '#f8d0d0';
        ctx.fillRect(62, 57, 4, 2);
        // Nose line down to mouth
        ctx.fillStyle = '#8a6840';
        ctx.fillRect(62, 62, 4, 4);

        // Mouth — small, cat-like
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(52, 64, 10, 2);
        ctx.fillRect(66, 64, 10, 2);
        // Subtle mouth detail
        ctx.fillStyle = '#5a3810';
        ctx.fillRect(54, 65, 6, 1);
        ctx.fillRect(68, 65, 6, 1);

        // Whiskers — fine, white, expressive (more detailed)
        ctx.fillStyle = P.white;
        // Left side whiskers
        ctx.fillRect(16, 52, 20, 2);
        ctx.fillRect(20, 56, 16, 2);
        ctx.fillRect(16, 60, 20, 2);
        // Right side whiskers
        ctx.fillRect(92, 52, 20, 2);
        ctx.fillRect(92, 56, 16, 2);
        ctx.fillRect(92, 60, 20, 2);
        // Additional finer whiskers
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(18, 54, 14, 1);
        ctx.fillRect(96, 54, 14, 1);
        ctx.fillRect(18, 58, 14, 1);
        ctx.fillRect(96, 58, 14, 1);

        // Cat ears — tall, triangular, alert
        // Left ear outer
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(28, 4, 20, 28);
        ctx.fillRect(24, 8, 8, 20);
        // Left ear inner layer
        ctx.fillStyle = P.tan;
        ctx.fillRect(32, 8, 12, 20);
        // Ear shading
        ctx.fillStyle = '#c89858';
        ctx.fillRect(34, 10, 8, 16);
        // Inner ear — pink
        ctx.fillStyle = P.pink;
        ctx.fillRect(34, 12, 8, 12);
        ctx.fillStyle = '#e0a0a0';
        ctx.fillRect(36, 16, 4, 6);
        // Inner ear highlight
        ctx.fillStyle = '#f8d0d0';
        ctx.fillRect(38, 18, 2, 3);
        // Ear edge detail
        ctx.fillStyle = '#8a6840';
        ctx.fillRect(26, 10, 2, 16);
        // Right ear outer
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(80, 4, 20, 28);
        ctx.fillRect(96, 8, 8, 20);
        // Right ear inner layer
        ctx.fillStyle = P.tan;
        ctx.fillRect(84, 8, 12, 20);
        // Ear shading
        ctx.fillStyle = '#c89858';
        ctx.fillRect(86, 10, 8, 16);
        ctx.fillStyle = P.pink;
        ctx.fillRect(86, 12, 8, 12);
        ctx.fillStyle = '#e0a0a0';
        ctx.fillRect(88, 16, 4, 6);
        // Inner ear highlight
        ctx.fillStyle = '#f8d0d0';
        ctx.fillRect(88, 18, 2, 3);
        // Ear edge detail
        ctx.fillStyle = '#8a6840';
        ctx.fillRect(100, 10, 2, 16);

        // Fur tufts between ears (gentle, not wild)
        ctx.fillStyle = P.lightBrown;
        ctx.fillRect(48, 12, 32, 12);
        ctx.fillStyle = P.tan;
        ctx.fillRect(52, 14, 24, 8);
        // Fur tuft detail
        ctx.fillStyle = '#c89858';
        ctx.fillRect(56, 16, 16, 4);
        // Individual fur strands
        ctx.fillStyle = '#d0a870';
        ctx.fillRect(54, 14, 3, 6);
        ctx.fillRect(60, 13, 3, 7);
        ctx.fillRect(66, 13, 3, 7);
        ctx.fillRect(72, 14, 3, 6);
      });

      // Svana Ironveil - dwarf woman, fierce, red braids, armored
      mp('svana', function (ctx) {
        // Dark stone background (128x128)
        ctx.fillStyle = '#2a1a2a';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#301e30';
        ctx.fillRect(8, 12, 112, 116);
        // Stone texture variation
        ctx.fillStyle = '#342238';
        ctx.fillRect(12, 16, 104, 108);

        // Armor — plate over chain, practical
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(8, 84, 112, 44);
        ctx.fillStyle = '#4a4a58';
        ctx.fillRect(16, 84, 96, 40);
        // Plate detail — shoulder guards (enhanced)
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(16, 88, 20, 12);
        ctx.fillRect(92, 88, 20, 12);
        ctx.fillStyle = '#b0b0b8';
        ctx.fillRect(20, 88, 12, 8);
        ctx.fillRect(96, 88, 12, 8);
        // Shoulder guard highlight
        ctx.fillStyle = '#d0d0d8';
        ctx.fillRect(22, 90, 8, 4);
        ctx.fillRect(98, 90, 8, 4);
        // Armor rivets on shoulders
        ctx.fillStyle = '#8a8a90';
        ctx.fillRect(18, 90, 2, 2);
        ctx.fillRect(28, 90, 2, 2);
        ctx.fillRect(94, 90, 2, 2);
        ctx.fillRect(104, 90, 2, 2);
        // Chain mail visible between plates (enhanced pattern)
        ctx.fillStyle = P.gray;
        ctx.fillRect(36, 88, 56, 24);
        ctx.fillStyle = '#8a8a98';
        for (var sy = 90; sy < 112; sy += 6) {
          for (var sx = 40; sx < 88; sx += 8) {
            ctx.fillRect(sx, sy, 4, 2);
          }
        }
        // Additional chain detail (offset pattern)
        ctx.fillStyle = '#9a9aa8';
        for (var sy = 93; sy < 112; sy += 6) {
          for (var sx = 44; sx < 88; sx += 8) {
            ctx.fillRect(sx, sy, 4, 2);
          }
        }
        // Gorget (enhanced)
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(40, 80, 48, 8);
        ctx.fillStyle = '#4a4a58';
        ctx.fillRect(44, 80, 40, 4);
        // Gorget rivet detail
        ctx.fillStyle = '#8a8a90';
        ctx.fillRect(46, 81, 2, 2);
        ctx.fillRect(80, 81, 2, 2);
        // Gorget edge highlight
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(44, 80, 40, 1);

        // Neck
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(48, 68, 32, 16);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(50, 68, 28, 12);
        // Neck shading
        ctx.fillStyle = '#f4dccf';
        ctx.fillRect(52, 70, 24, 8);

        // Face — broad, fierce, pale-skinned dwarf
        ctx.fillStyle = P.skin;
        ctx.fillRect(24, 20, 80, 52);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(28, 20, 72, 48);
        ctx.fillStyle = '#f0dcc8';
        ctx.fillRect(32, 24, 64, 42);
        // Intermediate skin tone layer
        ctx.fillStyle = '#f4e0d0';
        ctx.fillRect(36, 28, 56, 36);
        // Fierce flush on cheeks
        ctx.fillStyle = '#e0a890';
        ctx.fillRect(32, 48, 12, 8);
        ctx.fillRect(84, 48, 12, 8);
        // Deeper flush
        ctx.fillStyle = '#d89880';
        ctx.fillRect(34, 50, 8, 4);
        ctx.fillRect(86, 50, 8, 4);
        // Strong jaw — square dwarf jaw
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(28, 60, 4, 8);
        ctx.fillRect(96, 60, 4, 8);
        // Jaw shadow for definition
        ctx.fillStyle = '#e0cbb8';
        ctx.fillRect(32, 62, 64, 4);

        // Eyes — bright blue, fierce, challenging
        // Thin stern brows (enhanced)
        ctx.fillStyle = '#901810';
        ctx.fillRect(36, 34, 24, 4);
        ctx.fillRect(72, 34, 24, 4);
        // Brow shadow
        ctx.fillStyle = '#701410';
        ctx.fillRect(38, 36, 20, 2);
        ctx.fillRect(74, 36, 20, 2);
        // Eye whites
        ctx.fillStyle = '#e8e0e0';
        ctx.fillRect(40, 40, 16, 10);
        ctx.fillRect(76, 40, 16, 10);
        // Eye shadow for depth
        ctx.fillStyle = '#d8d0d0';
        ctx.fillRect(40, 48, 16, 2);
        ctx.fillRect(76, 48, 16, 2);
        // Blue irises — fierce
        ctx.fillStyle = P.blue;
        ctx.fillRect(44, 40, 10, 10);
        ctx.fillRect(80, 40, 10, 10);
        ctx.fillStyle = P.lightBlue;
        ctx.fillRect(46, 42, 6, 6);
        ctx.fillRect(82, 42, 6, 6);
        // Brighter iris highlight
        ctx.fillStyle = '#7aa8ea';
        ctx.fillRect(47, 43, 4, 4);
        ctx.fillRect(83, 43, 4, 4);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(48, 44, 4, 4);
        ctx.fillRect(84, 44, 4, 4);
        // Catch-light (fierce shine)
        ctx.fillStyle = '#e0e0f0';
        ctx.fillRect(44, 40, 4, 4);
        ctx.fillRect(80, 40, 4, 4);
        // Additional small catch-light
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(50, 46, 2, 2);
        ctx.fillRect(86, 46, 2, 2);

        // Nose — small, upturned, dwarf-cute
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(58, 48, 12, 8);
        // Nose shading
        ctx.fillStyle = '#e8d0b8';
        ctx.fillRect(59, 50, 10, 6);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(58, 54, 4, 2);
        ctx.fillRect(66, 54, 4, 2);

        // Mouth — determined, thin line
        ctx.fillStyle = P.darkRed;
        ctx.fillRect(52, 60, 24, 4);
        ctx.fillStyle = '#c06060';
        ctx.fillRect(56, 60, 16, 2);
        // Lip highlight
        ctx.fillStyle = '#d07070';
        ctx.fillRect(58, 61, 12, 1);

        // Hair — thick red, with two long braids framing the face
        // Top hair — voluminous (enhanced)
        ctx.fillStyle = P.red;
        ctx.fillRect(24, 8, 80, 20);
        ctx.fillRect(28, 4, 72, 8);
        // Hair volume detail
        ctx.fillStyle = '#c83028';
        ctx.fillRect(32, 10, 64, 14);
        // Hair highlights (multiple layers)
        ctx.fillStyle = '#e04030';
        ctx.fillRect(36, 8, 16, 8);
        ctx.fillRect(68, 8, 16, 8);
        ctx.fillStyle = '#f05040';
        ctx.fillRect(44, 6, 8, 4);
        ctx.fillRect(76, 6, 8, 4);
        // Brightest highlights
        ctx.fillStyle = '#f86050';
        ctx.fillRect(48, 7, 4, 3);
        ctx.fillRect(80, 7, 4, 3);
        // Dark undertone (shadow areas)
        ctx.fillStyle = '#901810';
        ctx.fillRect(52, 12, 4, 8);
        ctx.fillRect(72, 12, 4, 8);
        ctx.fillRect(40, 14, 3, 6);
        ctx.fillRect(86, 14, 3, 6);

        // Left braid — thick, plaited, running down past shoulders
        ctx.fillStyle = P.red;
        ctx.fillRect(16, 20, 16, 68);
        ctx.fillStyle = '#c03020';
        ctx.fillRect(20, 24, 8, 56);
        // Braid twist pattern (enhanced detail)
        ctx.fillStyle = '#901810';
        ctx.fillRect(20, 32, 8, 4);
        ctx.fillRect(20, 44, 8, 4);
        ctx.fillRect(20, 56, 8, 4);
        ctx.fillRect(20, 68, 8, 4);
        // Braid highlights between twists
        ctx.fillStyle = '#e04030';
        ctx.fillRect(20, 28, 8, 3);
        ctx.fillRect(20, 40, 8, 3);
        ctx.fillRect(20, 52, 8, 3);
        ctx.fillRect(20, 64, 8, 3);
        // Braid edge detail
        ctx.fillStyle = '#a82418';
        ctx.fillRect(18, 26, 2, 52);
        ctx.fillRect(28, 26, 2, 52);
        // Left braid clasp — gold ring (enhanced)
        ctx.fillStyle = P.gold;
        ctx.fillRect(16, 80, 16, 8);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(20, 82, 8, 4);
        // Clasp highlight
        ctx.fillStyle = '#f0e050';
        ctx.fillRect(22, 83, 4, 2);
        // Clasp rivet detail
        ctx.fillStyle = '#c0a020';
        ctx.fillRect(18, 82, 2, 2);
        ctx.fillRect(28, 82, 2, 2);

        // Right braid — thick, plaited, running down past shoulders
        ctx.fillStyle = P.red;
        ctx.fillRect(96, 20, 16, 68);
        ctx.fillStyle = '#c03020';
        ctx.fillRect(100, 24, 8, 56);
        // Braid twist pattern (enhanced detail)
        ctx.fillStyle = '#901810';
        ctx.fillRect(100, 32, 8, 4);
        ctx.fillRect(100, 44, 8, 4);
        ctx.fillRect(100, 56, 8, 4);
        ctx.fillRect(100, 68, 8, 4);
        // Braid highlights between twists
        ctx.fillStyle = '#e04030';
        ctx.fillRect(100, 28, 8, 3);
        ctx.fillRect(100, 40, 8, 3);
        ctx.fillRect(100, 52, 8, 3);
        ctx.fillRect(100, 64, 8, 3);
        // Braid edge detail
        ctx.fillStyle = '#a82418';
        ctx.fillRect(98, 26, 2, 52);
        ctx.fillRect(108, 26, 2, 52);
        // Right braid clasp — gold ring (enhanced)
        ctx.fillStyle = P.gold;
        ctx.fillRect(96, 80, 16, 8);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(100, 82, 8, 4);
        // Clasp highlight
        ctx.fillStyle = '#f0e050';
        ctx.fillRect(102, 83, 4, 2);
        // Clasp rivet detail
        ctx.fillStyle = '#c0a020';
        ctx.fillRect(98, 82, 2, 2);
        ctx.fillRect(108, 82, 2, 2);
      });

      // Que'Rubra - ancient tree spirit, gnarled bark face, glowing green eyes, leaf crown
      mp('querubra', function (ctx) {
        // Deep forest darkness background (128x128)
        ctx.fillStyle = '#050e05';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#0a200a';
        ctx.fillRect(8, 8, 112, 112);
        ctx.fillStyle = '#0c280c';
        ctx.fillRect(16, 16, 96, 96);
        // Additional background depth layer
        ctx.fillStyle = '#0d2c0d';
        ctx.fillRect(20, 20, 88, 88);

        // Bark trunk/body — gnarled, asymmetric
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(24, 80, 80, 48);
        ctx.fillRect(12, 88, 20, 40);
        ctx.fillRect(96, 88, 20, 40);
        // Additional bark base shading
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(28, 84, 72, 40);
        // Bark texture lines (vertical grain) - more detailed
        ctx.fillStyle = '#1a1004';
        ctx.fillRect(36, 84, 4, 36);
        ctx.fillRect(52, 82, 4, 38);
        ctx.fillRect(68, 86, 4, 34);
        ctx.fillRect(84, 84, 4, 36);
        // Additional finer grain details
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(44, 85, 2, 30);
        ctx.fillRect(76, 83, 2, 32);
        ctx.fillRect(60, 86, 3, 28);
        // Root-like shoulder bulges - enhanced
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(16, 88, 12, 8);
        ctx.fillRect(100, 88, 12, 8);
        ctx.fillStyle = '#4a3018';
        ctx.fillRect(18, 90, 8, 4);
        ctx.fillRect(102, 90, 8, 4);

        // Head — weathered bark face, ancient wood
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(16, 28, 96, 56);
        ctx.fillRect(24, 24, 80, 8);
        ctx.fillRect(12, 36, 8, 40);
        ctx.fillRect(108, 36, 8, 40);
        // Lighter inner face — aged heartwood
        ctx.fillStyle = P.brown;
        ctx.fillRect(24, 32, 80, 48);
        ctx.fillStyle = '#6a4020';
        ctx.fillRect(28, 36, 72, 40);
        // Additional face shading layer
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(32, 40, 64, 32);
        // Wood grain texture (flowing lines) - enhanced detail
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(32, 36, 4, 36);
        ctx.fillRect(92, 40, 4, 28);
        ctx.fillRect(60, 32, 4, 20);
        // Additional grain lines
        ctx.fillRect(48, 38, 3, 30);
        ctx.fillRect(76, 42, 3, 26);
        ctx.fillStyle = '#7a5028';
        ctx.fillRect(44, 36, 2, 24);
        ctx.fillRect(82, 36, 2, 24);
        ctx.fillRect(64, 34, 2, 28);
        // Bark knots and texture details
        ctx.fillStyle = '#4a3018';
        ctx.fillRect(38, 42, 3, 3);
        ctx.fillRect(86, 44, 3, 3);

        // Brow ridge — heavy, expressive, gnarled
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(28, 36, 28, 8);
        ctx.fillRect(72, 36, 28, 8);
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(32, 36, 20, 4);
        ctx.fillRect(76, 36, 20, 4);
        // Brow knots (woodgrain detail) - enhanced
        ctx.fillStyle = '#4a3018';
        ctx.fillRect(36, 36, 4, 4);
        ctx.fillRect(84, 36, 4, 4);
        // Additional brow texture
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(42, 38, 3, 3);
        ctx.fillRect(80, 38, 3, 3);

        // Eyes — deep glowing sockets, the spiritual core
        // Dark eye sockets
        ctx.fillStyle = '#0a0804';
        ctx.fillRect(32, 44, 24, 16);
        ctx.fillRect(76, 44, 24, 16);
        // Additional socket depth
        ctx.fillStyle = '#050402';
        ctx.fillRect(34, 46, 20, 12);
        ctx.fillRect(78, 46, 20, 12);
        // Green glow fill - layered
        ctx.fillStyle = '#1a6a1a';
        ctx.fillRect(34, 46, 20, 12);
        ctx.fillRect(78, 46, 20, 12);
        ctx.fillStyle = '#2a7a2a';
        ctx.fillRect(36, 47, 16, 10);
        ctx.fillRect(80, 47, 16, 10);
        // Bright green inner glow
        ctx.fillStyle = P.green;
        ctx.fillRect(38, 48, 12, 8);
        ctx.fillRect(82, 48, 12, 8);
        // Bright iris centers
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(40, 48, 8, 8);
        ctx.fillRect(84, 48, 8, 8);
        // Additional iris detail
        ctx.fillStyle = P.paleGreen;
        ctx.fillRect(42, 50, 4, 4);
        ctx.fillRect(86, 50, 4, 4);
        // Pupils (dark forest-green centers)
        ctx.fillStyle = '#0a2a0a';
        ctx.fillRect(42, 50, 4, 4);
        ctx.fillRect(86, 50, 4, 4);
        // Bright highlights (ancient life)
        ctx.fillStyle = P.paleGreen;
        ctx.fillRect(40, 48, 4, 4);
        ctx.fillRect(84, 48, 4, 4);
        // Under-eye glow (light spilling from sockets) - enhanced
        ctx.fillStyle = 'rgba(90, 197, 90, 0.25)';
        ctx.fillRect(32, 60, 24, 4);
        ctx.fillRect(76, 60, 24, 4);
        ctx.fillStyle = 'rgba(90, 197, 90, 0.15)';
        ctx.fillRect(30, 64, 26, 3);
        ctx.fillRect(74, 64, 26, 3);

        // Nose — subtle bark ridge between the eyes
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(60, 52, 8, 12);
        ctx.fillStyle = P.brown;
        ctx.fillRect(60, 52, 6, 8);
        // Nose detail
        ctx.fillStyle = '#4a3018';
        ctx.fillRect(62, 54, 4, 6);

        // Mouth — wide, knowing, ancient smile
        ctx.fillStyle = '#1a1004';
        ctx.fillRect(36, 72, 56, 8);
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(40, 72, 48, 4);
        // Additional mouth depth
        ctx.fillStyle = '#0f0804';
        ctx.fillRect(42, 74, 44, 3);
        // Wood-grain teeth (ancient, unsettling, wise) - more detailed
        ctx.fillStyle = '#3a2a10';
        ctx.fillRect(44, 76, 4, 4);
        ctx.fillRect(52, 76, 4, 4);
        ctx.fillRect(60, 76, 4, 4);
        ctx.fillRect(68, 76, 4, 4);
        ctx.fillRect(76, 76, 4, 4);
        // Additional teeth
        ctx.fillStyle = '#4a3a18';
        ctx.fillRect(48, 76, 3, 3);
        ctx.fillRect(64, 76, 3, 3);
        ctx.fillRect(72, 76, 3, 3);
        // Mouth corners — knowing upturn
        ctx.fillStyle = '#1a1004';
        ctx.fillRect(32, 68, 6, 4);
        ctx.fillRect(90, 68, 6, 4);

        // Leaf crown — elaborate, wild, asymmetric (the defining feature)
        // Far left cluster
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(8, 8, 28, 28);
        // Left-center (tall)
        ctx.fillRect(32, 0, 20, 36);
        // Center (tallest)
        ctx.fillRect(52, -4, 24, 36);
        // Right-center
        ctx.fillRect(76, 0, 20, 36);
        // Far right cluster
        ctx.fillRect(92, 12, 28, 24);
        // Leaf highlights (mid-green) - enhanced
        ctx.fillStyle = P.green;
        ctx.fillRect(12, 10, 16, 20);
        ctx.fillRect(36, 4, 12, 24);
        ctx.fillRect(56, 0, 16, 24);
        ctx.fillRect(80, 4, 12, 24);
        ctx.fillRect(96, 16, 16, 16);
        // Additional leaf layer detail
        ctx.fillStyle = '#3a9a3a';
        ctx.fillRect(14, 12, 10, 14);
        ctx.fillRect(38, 6, 8, 18);
        ctx.fillRect(58, 2, 12, 18);
        ctx.fillRect(82, 6, 8, 18);
        ctx.fillRect(98, 18, 12, 12);
        // Bright leaf tips (new growth)
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(16, 10, 6, 8);
        ctx.fillRect(38, 4, 6, 8);
        ctx.fillRect(60, 0, 8, 8);
        ctx.fillRect(82, 4, 6, 8);
        ctx.fillRect(100, 16, 6, 8);
        // Very bright leaf tips
        ctx.fillStyle = P.paleGreen;
        ctx.fillRect(18, 11, 3, 4);
        ctx.fillRect(40, 5, 3, 4);
        ctx.fillRect(62, 1, 4, 4);
        ctx.fillRect(84, 5, 3, 4);
        ctx.fillRect(102, 17, 3, 4);
        // Individual leaf shapes at edges - more detail
        ctx.fillStyle = P.green;
        ctx.fillRect(8, 8, 4, 12);
        ctx.fillRect(28, 0, 4, 12);
        ctx.fillRect(74, 0, 4, 12);
        ctx.fillRect(116, 12, 4, 12);
        // Additional leaf detail
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(10, 10, 2, 8);
        ctx.fillRect(30, 2, 2, 8);
        ctx.fillRect(76, 2, 2, 8);
        ctx.fillRect(118, 14, 2, 8);
        // Golden berries/flowers scattered in crown - enhanced
        ctx.fillStyle = P.gold;
        ctx.fillRect(20, 16, 4, 4);
        ctx.fillRect(44, 8, 4, 4);
        ctx.fillRect(68, 4, 4, 4);
        ctx.fillRect(92, 12, 4, 4);
        // Additional berries
        ctx.fillRect(26, 14, 3, 3);
        ctx.fillRect(60, 6, 3, 3);
        ctx.fillRect(88, 10, 3, 3);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(20, 16, 2, 2);
        ctx.fillRect(44, 8, 2, 2);
        ctx.fillRect(68, 4, 2, 2);
        ctx.fillRect(92, 12, 2, 2);
        ctx.fillRect(26, 14, 1, 1);
        ctx.fillRect(60, 6, 1, 1);
        ctx.fillRect(88, 10, 1, 1);

        // Hanging moss/vine wisps — sides of face
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(8, 36, 8, 28);
        ctx.fillRect(112, 40, 8, 24);
        ctx.fillStyle = P.green;
        ctx.fillRect(10, 40, 4, 16);
        ctx.fillRect(114, 44, 4, 12);
        // Additional moss detail
        ctx.fillStyle = '#3a9a3a';
        ctx.fillRect(11, 42, 2, 10);
        ctx.fillRect(115, 46, 2, 8);
        // Moss drips - enhanced
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(10, 60, 4, 8);
        ctx.fillRect(114, 60, 4, 8);
        ctx.fillStyle = P.green;
        ctx.fillRect(10, 64, 2, 4);
        ctx.fillRect(116, 64, 2, 4);
        // Additional drip detail
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(11, 66, 1, 3);
        ctx.fillRect(115, 66, 1, 3);
      });

      // Bargnot - goblin queen, fierce, crowned, red robes over green skin
      mp('bargnot', function (ctx) {
        // Dark ritual chamber background (128x128)
        ctx.fillStyle = '#1a0a1a';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#201020';
        ctx.fillRect(8, 12, 112, 116);
        ctx.fillStyle = '#281428';
        ctx.fillRect(16, 20, 96, 100);
        // Additional background depth
        ctx.fillStyle = '#301830';
        ctx.fillRect(20, 24, 88, 92);

        // Robes — deep red, ceremonial
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(12, 88, 104, 40);
        ctx.fillStyle = '#8a1818';
        ctx.fillRect(20, 88, 88, 36);
        ctx.fillStyle = P.red;
        ctx.fillRect(28, 90, 72, 32);
        // Robe folds and shading
        ctx.fillStyle = '#a02020';
        ctx.fillRect(32, 92, 64, 26);
        ctx.fillStyle = '#8a1818';
        ctx.fillRect(40, 94, 48, 20);
        // Robe collar — high, ceremonial
        ctx.fillStyle = '#8a1818';
        ctx.fillRect(36, 76, 56, 16);
        ctx.fillStyle = P.red;
        ctx.fillRect(40, 76, 48, 12);
        // Collar detail
        ctx.fillStyle = '#b03030';
        ctx.fillRect(44, 78, 40, 8);
        // Gold robe trim - enhanced
        ctx.fillStyle = P.gold;
        ctx.fillRect(28, 88, 72, 4);
        ctx.fillRect(60, 92, 8, 20);
        // Additional trim detail
        ctx.fillStyle = P.yellow;
        ctx.fillRect(30, 89, 68, 2);
        ctx.fillRect(61, 93, 6, 16);
        // Trim ornaments
        ctx.fillStyle = P.gold;
        ctx.fillRect(44, 89, 3, 3);
        ctx.fillRect(82, 89, 3, 3);

        // Neck — green-skinned, goblin
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(48, 68, 32, 16);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(50, 68, 28, 12);
        ctx.fillStyle = P.green;
        ctx.fillRect(52, 70, 24, 8);
        // Neck shading
        ctx.fillStyle = '#3a8a3a';
        ctx.fillRect(54, 71, 20, 6);

        // Face — sharp-featured goblin, angular, commanding
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(24, 24, 80, 48);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(28, 24, 72, 44);
        ctx.fillStyle = P.green;
        ctx.fillRect(32, 28, 64, 38);
        // Additional face shading layer
        ctx.fillStyle = '#3a8a3a';
        ctx.fillRect(36, 32, 56, 30);
        // Sharp cheekbones - enhanced
        ctx.fillStyle = '#4a9a4a';
        ctx.fillRect(32, 48, 10, 4);
        ctx.fillRect(86, 48, 10, 4);
        // Cheekbone highlights
        ctx.fillStyle = '#5aaa5a';
        ctx.fillRect(34, 49, 6, 2);
        ctx.fillRect(88, 49, 6, 2);
        // Angular jaw
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(28, 60, 4, 8);
        ctx.fillRect(96, 60, 4, 8);
        // Jaw shadow
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(30, 62, 2, 6);
        ctx.fillRect(96, 62, 2, 6);

        // Goblin ears — large, pointed, swept back
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(8, 32, 20, 16);
        ctx.fillRect(100, 32, 20, 16);
        ctx.fillStyle = P.green;
        ctx.fillRect(10, 34, 16, 10);
        ctx.fillRect(102, 34, 16, 10);
        // Ear inner detail
        ctx.fillStyle = '#3a8a3a';
        ctx.fillRect(12, 36, 12, 6);
        ctx.fillRect(104, 36, 12, 6);
        // Ear tips (pointed) - enhanced
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(4, 28, 8, 8);
        ctx.fillRect(116, 28, 8, 8);
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(6, 30, 4, 4);
        ctx.fillRect(118, 30, 4, 4);

        // Eyes — fierce red-orange, commanding, burning
        // Heavy brow ridge - enhanced
        ctx.fillStyle = '#0a3a0a';
        ctx.fillRect(36, 32, 24, 6);
        ctx.fillRect(72, 32, 24, 6);
        // Additional brow depth
        ctx.fillStyle = '#051a05';
        ctx.fillRect(38, 33, 20, 4);
        ctx.fillRect(74, 33, 20, 4);
        // Eye sockets
        ctx.fillStyle = '#600808';
        ctx.fillRect(36, 40, 24, 12);
        ctx.fillRect(72, 40, 24, 12);
        // Socket depth
        ctx.fillStyle = '#400404';
        ctx.fillRect(38, 41, 20, 10);
        ctx.fillRect(74, 41, 20, 10);
        // Red-orange irises — burning
        ctx.fillStyle = P.red;
        ctx.fillRect(40, 40, 16, 12);
        ctx.fillRect(76, 40, 16, 12);
        ctx.fillStyle = '#e06020';
        ctx.fillRect(44, 42, 8, 8);
        ctx.fillRect(80, 42, 8, 8);
        // Yellow-hot center
        ctx.fillStyle = P.yellow;
        ctx.fillRect(46, 44, 4, 4);
        ctx.fillRect(82, 44, 4, 4);
        // Orange mid-tone
        ctx.fillStyle = '#f08030';
        ctx.fillRect(45, 43, 6, 6);
        ctx.fillRect(81, 43, 6, 6);
        // Pupils — slitted (fierce)
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(48, 42, 2, 8);
        ctx.fillRect(84, 42, 2, 8);
        // Fierce catch-light - enhanced
        ctx.fillStyle = '#f0c0a0';
        ctx.fillRect(42, 40, 4, 4);
        ctx.fillRect(78, 40, 4, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(43, 41, 2, 2);
        ctx.fillRect(79, 41, 2, 2);

        // Nose — small, flat goblin nose
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(60, 52, 8, 6);
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(61, 54, 6, 4);
        // Nostrils - enhanced
        ctx.fillStyle = '#0a3a0a';
        ctx.fillRect(60, 56, 4, 2);
        ctx.fillRect(64, 56, 4, 2);
        // Nostril depth
        ctx.fillStyle = '#051a05';
        ctx.fillRect(61, 56, 2, 1);
        ctx.fillRect(65, 56, 2, 1);

        // Mouth — thin, cruel, smirking
        ctx.fillStyle = '#804040';
        ctx.fillRect(48, 64, 32, 4);
        ctx.fillStyle = '#a05050';
        ctx.fillRect(52, 64, 24, 2);
        // Lip highlight
        ctx.fillStyle = '#c06060';
        ctx.fillRect(54, 64, 20, 1);
        // Sharp teeth showing (menacing grin) - more detailed
        ctx.fillStyle = '#d0d0a0';
        ctx.fillRect(52, 66, 4, 2);
        ctx.fillRect(60, 66, 4, 2);
        ctx.fillRect(68, 66, 4, 2);
        ctx.fillRect(76, 66, 4, 2);
        // Additional teeth detail
        ctx.fillStyle = '#e0e0b0';
        ctx.fillRect(52, 66, 2, 1);
        ctx.fillRect(60, 66, 2, 1);
        ctx.fillRect(68, 66, 2, 1);
        ctx.fillRect(76, 66, 2, 1);
        // Tooth gaps/shadows
        ctx.fillStyle = '#603030';
        ctx.fillRect(56, 66, 4, 2);
        ctx.fillRect(64, 66, 4, 2);
        ctx.fillRect(72, 66, 4, 2);

        // Crown — gold, three-pointed, her authority
        ctx.fillStyle = P.gold;
        ctx.fillRect(32, 12, 64, 12);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(36, 14, 56, 8);
        // Crown band detail
        ctx.fillStyle = '#f0d040';
        ctx.fillRect(38, 15, 52, 6);
        // Crown ornament detail
        ctx.fillStyle = '#c0a020';
        ctx.fillRect(34, 13, 2, 10);
        ctx.fillRect(92, 13, 2, 10);
        // Crown points - enhanced
        ctx.fillStyle = P.gold;
        ctx.fillRect(36, 0, 10, 16);
        ctx.fillRect(60, -4, 8, 20);
        ctx.fillRect(82, 0, 10, 16);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(38, 2, 6, 8);
        ctx.fillRect(62, -2, 4, 12);
        ctx.fillRect(84, 2, 6, 8);
        // Point highlights
        ctx.fillStyle = '#f0e050';
        ctx.fillRect(40, 3, 4, 4);
        ctx.fillRect(63, 0, 2, 6);
        ctx.fillRect(86, 3, 4, 4);
        // Purple gem — center of crown - enhanced with facets
        ctx.fillStyle = P.purple;
        ctx.fillRect(58, 16, 12, 8);
        ctx.fillStyle = P.lightPurple;
        ctx.fillRect(60, 18, 8, 4);
        // Gem facets
        ctx.fillStyle = '#d0a0e0';
        ctx.fillRect(62, 19, 4, 2);
        // Gem highlights
        ctx.fillStyle = '#e0b0f0';
        ctx.fillRect(61, 18, 3, 2);
        // Gem shadow
        ctx.fillStyle = P.darkPurple;
        ctx.fillRect(59, 21, 8, 2);
      });

      // Bargnot desperate — shadow consuming her, crown falling
      mp('bargnot_desperate', function (ctx) {
        // Dark void — shadow encroaching (128x128)
        ctx.fillStyle = '#1a0a1a';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#180818';
        ctx.fillRect(8, 8, 112, 112);
        ctx.fillStyle = '#100810';
        ctx.fillRect(16, 16, 96, 96);

        // Robes — darkened, shadow-stained
        ctx.fillStyle = P.darkPurple;
        ctx.fillRect(12, 88, 104, 40);
        ctx.fillStyle = '#3a1030';
        ctx.fillRect(20, 88, 88, 36);
        ctx.fillStyle = '#2a0820';
        ctx.fillRect(28, 92, 72, 32);
        // Robes disintegrating
        ctx.fillStyle = '#2a0820';
        ctx.fillRect(40, 76, 48, 16);
        ctx.fillStyle = '#1a0618';
        ctx.fillRect(48, 80, 32, 12);
        // Shadow corruption spreading
        ctx.fillStyle = 'rgba(42, 8, 32, 0.6)';
        ctx.fillRect(32, 84, 64, 8);

        // Neck
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(48, 68, 32, 16);
        ctx.fillStyle = P.green;
        ctx.fillRect(52, 70, 24, 8);
        ctx.fillStyle = '#2d9a2d';
        ctx.fillRect(56, 72, 16, 6);
        // Shadowy corruption on neck
        ctx.fillStyle = 'rgba(42, 8, 32, 0.3)';
        ctx.fillRect(48, 72, 32, 8);

        // Face — contorted in anguish
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(24, 24, 80, 48);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(28, 24, 72, 44);
        ctx.fillStyle = P.green;
        ctx.fillRect(32, 28, 64, 38);
        ctx.fillStyle = '#2d9a2d';
        ctx.fillRect(36, 32, 56, 32);
        // Gaunt shadows from anguish
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(32, 48, 8, 16);
        ctx.fillRect(88, 48, 8, 16);

        // Goblin ears
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(8, 32, 20, 16);
        ctx.fillRect(100, 32, 20, 16);
        ctx.fillStyle = P.green;
        ctx.fillRect(10, 34, 16, 10);
        ctx.fillRect(102, 34, 16, 10);
        ctx.fillStyle = '#2d9a2d';
        ctx.fillRect(12, 36, 12, 6);
        ctx.fillRect(104, 36, 12, 6);
        // Ear tips
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(4, 28, 8, 8);
        ctx.fillRect(116, 28, 8, 8);

        // Eyes — wide, glowing purple, losing control
        ctx.fillStyle = '#0a3a0a';
        ctx.fillRect(32, 32, 28, 6);
        ctx.fillRect(68, 32, 28, 6);
        // Brow ridge darkened with strain
        ctx.fillStyle = '#0a2a0a';
        ctx.fillRect(32, 28, 28, 4);
        ctx.fillRect(68, 28, 28, 4);
        // Eyes wide open — too wide
        ctx.fillStyle = P.lightPurple;
        ctx.fillRect(32, 40, 28, 16);
        ctx.fillRect(68, 40, 28, 16);
        ctx.fillStyle = '#ba7aea';
        ctx.fillRect(34, 42, 24, 12);
        ctx.fillRect(70, 42, 24, 12);
        // White-hot center (power overload)
        ctx.fillStyle = P.white;
        ctx.fillRect(40, 44, 12, 8);
        ctx.fillRect(76, 44, 12, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(42, 46, 8, 4);
        ctx.fillRect(78, 46, 8, 4);
        // Purple glow bleeding outward (rgba)
        ctx.fillStyle = 'rgba(160, 80, 200, 0.4)';
        ctx.fillRect(28, 36, 36, 24);
        ctx.fillRect(64, 36, 36, 24);
        ctx.fillStyle = 'rgba(186, 106, 218, 0.3)';
        ctx.fillRect(24, 32, 44, 32);
        ctx.fillRect(60, 32, 44, 32);

        // Nose
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(60, 52, 8, 6);
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(58, 56, 4, 2);
        ctx.fillRect(66, 56, 4, 2);

        // Mouth — open, screaming
        ctx.fillStyle = '#400808';
        ctx.fillRect(44, 64, 40, 12);
        ctx.fillStyle = P.darkRed;
        ctx.fillRect(48, 64, 32, 10);
        ctx.fillStyle = '#5c1a1a';
        ctx.fillRect(52, 66, 24, 6);
        // Dark throat
        ctx.fillStyle = '#200404';
        ctx.fillRect(56, 68, 16, 4);
        // Teeth
        ctx.fillStyle = '#d0d0a0';
        ctx.fillRect(52, 64, 4, 4);
        ctx.fillRect(60, 64, 4, 4);
        ctx.fillRect(68, 64, 4, 4);
        ctx.fillRect(76, 64, 4, 4);
        ctx.fillStyle = '#c0c090';
        ctx.fillRect(56, 64, 4, 3);
        ctx.fillRect(64, 64, 4, 3);
        ctx.fillRect(72, 64, 4, 3);

        // Crown — tilted, falling off, broken
        ctx.fillStyle = P.gold;
        ctx.fillRect(68, 8, 40, 10);
        ctx.fillRect(84, 0, 8, 12);
        ctx.fillRect(100, 4, 8, 10);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(72, 10, 28, 6);
        ctx.fillRect(86, 2, 4, 6);
        ctx.fillRect(102, 6, 4, 6);
        // Crown spikes
        ctx.fillStyle = P.gold;
        ctx.fillRect(76, 4, 6, 8);
        ctx.fillRect(92, 2, 6, 10);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(78, 6, 2, 4);
        ctx.fillRect(94, 4, 2, 6);
        // Crown gem cracked
        ctx.fillStyle = P.purple;
        ctx.fillRect(76, 12, 8, 6);
        ctx.fillStyle = '#7a3aaa';
        ctx.fillRect(78, 13, 4, 4);
        // Crack through gem
        ctx.fillStyle = '#2a0820';
        ctx.fillRect(78, 14, 4, 2);
        ctx.fillStyle = '#1a0410';
        ctx.fillRect(79, 13, 2, 1);
        // Crown tarnish/corruption
        ctx.fillStyle = 'rgba(42, 8, 32, 0.4)';
        ctx.fillRect(70, 10, 36, 4);

        // Shadow tendrils — consuming her (using globalAlpha)
        ctx.fillStyle = P.darkPurple;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(4, 28, 12, 56);
        ctx.fillRect(112, 20, 12, 64);
        ctx.fillRect(20, 12, 12, 28);
        ctx.fillRect(96, 8, 12, 24);
        ctx.fillRect(8, 60, 16, 40);
        ctx.fillRect(104, 56, 16, 44);
        ctx.globalAlpha = 0.4;
        ctx.fillRect(16, 80, 8, 32);
        ctx.fillRect(104, 76, 8, 36);
        ctx.fillRect(32, 16, 8, 16);
        ctx.fillRect(88, 12, 8, 20);
        ctx.fillRect(12, 16, 6, 20);
        ctx.fillRect(110, 16, 6, 24);
        ctx.globalAlpha = 1;
      });

      // Fawks worried — same fashionable nonbinary innkeeper, but anxious (128x128)
      mp('fawks_worried', function (ctx) {
        // Dimmer tavern background
        ctx.fillStyle = '#180e06';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#20140c';
        ctx.fillRect(8, 12, 112, 116);
        ctx.fillStyle = '#241810';
        ctx.fillRect(16, 20, 96, 100);
        ctx.fillStyle = '#281c14';
        ctx.fillRect(24, 28, 80, 84);

        // Same white shirt + vest, slightly hunched
        // Shirt base
        ctx.fillStyle = '#b8b8b8';
        ctx.fillRect(12, 96, 104, 32);
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(16, 96, 96, 28);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(20, 98, 88, 24);
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(24, 100, 80, 20);
        // Vest — same charcoal
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(24, 96, 80, 32);
        ctx.fillStyle = '#2a2a34';
        ctx.fillRect(28, 98, 72, 28);
        ctx.fillStyle = '#323240';
        ctx.fillRect(32, 100, 64, 24);
        ctx.fillStyle = '#3a3a48';
        ctx.fillRect(36, 102, 56, 20);
        // Vest lapels
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(28, 96, 8, 20);
        ctx.fillRect(92, 96, 8, 20);
        ctx.fillStyle = '#3a3a48';
        ctx.fillRect(30, 98, 4, 16);
        ctx.fillRect(94, 98, 4, 16);
        // Buttons
        ctx.fillStyle = '#a08830';
        ctx.fillRect(62, 100, 4, 4);
        ctx.fillRect(62, 108, 4, 4);
        ctx.fillRect(62, 116, 4, 4);
        ctx.fillStyle = '#b09840';
        ctx.fillRect(63, 101, 2, 2);
        ctx.fillRect(63, 109, 2, 2);
        ctx.fillRect(63, 117, 2, 2);
        // Shirt collar — slightly rumpled
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(44, 84, 40, 14);
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(48, 84, 32, 12);
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(44, 84, 6, 8);
        ctx.fillRect(78, 84, 6, 8);
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(48, 94, 32, 2);
        // Rumpled fold
        ctx.fillStyle = '#b8b8b8';
        ctx.fillRect(52, 90, 24, 1);
        // Skin at collar
        ctx.fillStyle = P.skin;
        ctx.fillRect(58, 86, 12, 6);
        // Shirt sleeves peeking
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(16, 98, 8, 12);
        ctx.fillRect(104, 98, 8, 12);

        // Neck — tense
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(50, 76, 28, 16);
        ctx.fillStyle = P.skin;
        ctx.fillRect(52, 76, 24, 12);
        ctx.fillStyle = '#e0c098';
        ctx.fillRect(56, 78, 16, 10);
        // Tension shadow
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(54, 82, 20, 2);

        // Face — same soft features, tension visible
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(28, 28, 72, 48);
        ctx.fillStyle = P.skin;
        ctx.fillRect(32, 28, 64, 46);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(36, 32, 56, 40);
        ctx.fillStyle = '#f4e0cc';
        ctx.fillRect(40, 36, 48, 36);
        // Pale cheeks (warmth drained)
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(36, 56, 10, 8);
        ctx.fillRect(82, 56, 10, 8);
        ctx.fillStyle = '#f8e8d8';
        ctx.fillRect(38, 58, 6, 4);
        ctx.fillRect(84, 58, 6, 4);
        // Soft jawline
        ctx.fillStyle = P.skin;
        ctx.fillRect(32, 68, 4, 6);
        ctx.fillRect(92, 68, 4, 6);

        // Eyes — amber, wider, brows in worried lift
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(40, 36, 20, 4);
        ctx.fillRect(72, 36, 20, 4);
        ctx.fillStyle = '#4a2a14';
        ctx.fillRect(42, 38, 16, 2);
        ctx.fillRect(74, 38, 16, 2);
        // Inner brow lift (telltale worry)
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(60, 32, 4, 4);
        ctx.fillRect(68, 32, 4, 4);
        // Eye whites — wider (anxious)
        ctx.fillStyle = '#f0e8e0';
        ctx.fillRect(40, 44, 20, 14);
        ctx.fillRect(72, 44, 20, 14);
        ctx.fillStyle = '#f8f0e8';
        ctx.fillRect(42, 46, 16, 10);
        ctx.fillRect(74, 46, 16, 10);
        // Upper lid
        ctx.fillStyle = '#5a3820';
        ctx.fillRect(40, 42, 20, 2);
        ctx.fillRect(72, 42, 20, 2);
        // Amber irises
        ctx.fillStyle = '#7a4a10';
        ctx.fillRect(44, 44, 14, 12);
        ctx.fillRect(76, 44, 14, 12);
        ctx.fillStyle = '#9a6020';
        ctx.fillRect(46, 46, 10, 8);
        ctx.fillRect(78, 46, 10, 8);
        ctx.fillStyle = '#b07820';
        ctx.fillRect(48, 48, 6, 4);
        ctx.fillRect(80, 48, 6, 4);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(50, 48, 4, 4);
        ctx.fillRect(82, 48, 4, 4);
        // Dimmer catch-light
        ctx.fillStyle = '#e0d0a0';
        ctx.fillRect(46, 44, 4, 4);
        ctx.fillRect(78, 44, 4, 4);
        ctx.fillStyle = '#f0e0b0';
        ctx.fillRect(47, 45, 2, 2);
        ctx.fillRect(79, 45, 2, 2);
        // Lower lash line
        ctx.fillStyle = '#b09878';
        ctx.fillRect(40, 58, 20, 2);
        ctx.fillRect(72, 58, 20, 2);

        // Nose
        ctx.fillStyle = P.skin;
        ctx.fillRect(60, 52, 8, 10);
        ctx.fillStyle = '#e0c098';
        ctx.fillRect(62, 54, 4, 8);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(58, 60, 4, 2);
        ctx.fillRect(66, 60, 4, 2);

        // Mouth — tight, downturned (the smile is gone)
        ctx.fillStyle = '#904848';
        ctx.fillRect(48, 68, 32, 4);
        ctx.fillStyle = '#a05050';
        ctx.fillRect(52, 68, 24, 4);
        // Downturned corners
        ctx.fillStyle = '#904848';
        ctx.fillRect(46, 70, 4, 4);
        ctx.fillRect(78, 70, 4, 4);
        ctx.fillStyle = '#804040';
        ctx.fillRect(56, 66, 16, 2);

        // Hair — same flop but mussed (ran hands through it, anxious)
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(20, 8, 88, 28);
        ctx.fillRect(16, 16, 12, 36);
        ctx.fillRect(100, 16, 12, 20);
        ctx.fillRect(28, 4, 68, 8);
        ctx.fillRect(16, 8, 16, 16);
        // Auburn mid-tones
        ctx.fillStyle = '#6a3018';
        ctx.fillRect(28, 8, 16, 16);
        ctx.fillRect(52, 6, 16, 16);
        ctx.fillRect(76, 8, 20, 16);
        // Highlights
        ctx.fillStyle = '#904820';
        ctx.fillRect(32, 8, 6, 12);
        ctx.fillRect(60, 6, 6, 12);
        ctx.fillRect(84, 8, 6, 12);
        ctx.fillStyle = '#a05828';
        ctx.fillRect(34, 10, 2, 8);
        ctx.fillRect(62, 8, 2, 8);
        ctx.fillRect(86, 10, 2, 8);
        // Stray pieces (anxious fidgeting)
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(8, 4, 12, 6);
        ctx.fillRect(44, 0, 8, 4);
        ctx.fillRect(12, 0, 8, 4);
        // THE FLOP — same dramatic swoop but slightly messier
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(68, 24, 32, 12);
        ctx.fillRect(76, 20, 28, 8);
        ctx.fillRect(80, 28, 24, 12);
        ctx.fillRect(88, 36, 20, 12);
        ctx.fillRect(96, 44, 12, 8);
        // Extra stray strand falling lower (the worry-fidget)
        ctx.fillRect(100, 48, 8, 8);
        ctx.fillRect(104, 52, 4, 6);
        ctx.fillRect(106, 56, 2, 4);
        // Flop mid-tones
        ctx.fillStyle = '#6a3018';
        ctx.fillRect(72, 24, 24, 8);
        ctx.fillRect(80, 28, 20, 8);
        ctx.fillRect(88, 36, 16, 8);
        ctx.fillRect(96, 44, 8, 6);
        // Flop highlights — dimmer
        ctx.fillStyle = '#904820';
        ctx.fillRect(76, 24, 8, 6);
        ctx.fillRect(84, 28, 8, 6);
        ctx.fillRect(92, 36, 6, 6);
        // Left side — swept back, messier
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(12, 24, 12, 32);
        ctx.fillRect(8, 16, 8, 24);
        ctx.fillStyle = '#6a3018';
        ctx.fillRect(14, 28, 8, 20);

        // Left ear + earring
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(20, 48, 8, 12);
        ctx.fillStyle = P.skin;
        ctx.fillRect(22, 50, 4, 8);
        ctx.fillStyle = P.gold;
        ctx.fillRect(18, 52, 4, 8);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(18, 52, 2, 4);
        ctx.fillStyle = P.lightPurple;
        ctx.fillRect(18, 58, 4, 2);

        // Forehead tension lines
        ctx.fillStyle = P.skin;
        ctx.fillRect(44, 32, 24, 2);
        ctx.fillRect(48, 36, 16, 1);
      });

      // Helena hopeful — same halfline, strawberry curls, dawn light, relief (128x128)
      mp('helena_hopeful', function (ctx) {
        // Warmer background (dawn light, hope)
        ctx.fillStyle = '#0c160c';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#101e10';
        ctx.fillRect(8, 20, 112, 108);
        ctx.fillStyle = '#142214';
        ctx.fillRect(16, 28, 96, 92);
        ctx.fillStyle = '#182618';
        ctx.fillRect(24, 36, 80, 76);

        // Shoulders — same vestment, posture more open
        ctx.fillStyle = '#1a4a1a';
        ctx.fillRect(8, 96, 112, 32);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(16, 96, 96, 28);
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(24, 98, 80, 24);
        ctx.fillStyle = '#1a6a1a';
        ctx.fillRect(32, 100, 64, 20);
        // Collar
        ctx.fillStyle = '#1a4a1a';
        ctx.fillRect(28, 80, 16, 20);
        ctx.fillRect(84, 80, 16, 20);
        ctx.fillStyle = P.darkGreen;
        ctx.fillRect(30, 82, 12, 16);
        ctx.fillRect(86, 82, 12, 16);
        ctx.fillStyle = P.gold;
        ctx.fillRect(28, 80, 4, 16);
        ctx.fillRect(96, 80, 4, 16);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(29, 82, 2, 12);
        ctx.fillRect(97, 82, 2, 12);
        // Chain of office
        ctx.fillStyle = P.gold;
        ctx.fillRect(44, 96, 4, 2); ctx.fillRect(48, 98, 4, 2);
        ctx.fillRect(52, 96, 6, 2); ctx.fillRect(58, 98, 4, 2);
        ctx.fillRect(66, 98, 4, 2); ctx.fillRect(70, 96, 6, 2);
        ctx.fillRect(76, 98, 4, 2); ctx.fillRect(80, 96, 4, 2);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(45, 96, 2, 1); ctx.fillRect(49, 98, 2, 1);
        ctx.fillRect(59, 98, 2, 1); ctx.fillRect(71, 96, 2, 1);
        // Pendant (catches dawn light — brighter)
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(58, 100, 12, 10);
        ctx.fillStyle = P.paleGreen;
        ctx.fillRect(60, 102, 8, 6);
        ctx.fillStyle = '#c0f0c0';
        ctx.fillRect(62, 103, 4, 4);
        ctx.fillStyle = '#d0f8d0';
        ctx.fillRect(63, 104, 2, 2);

        // Neck
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(48, 76, 32, 16);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(50, 76, 28, 12);
        ctx.fillStyle = '#f4ddc4';
        ctx.fillRect(52, 76, 24, 10);
        ctx.fillStyle = '#f8e8d4';
        ctx.fillRect(56, 78, 16, 8);

        // Face — round halfline face, warmer tones (color returned)
        ctx.fillStyle = P.skin;
        ctx.fillRect(24, 32, 80, 48);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(28, 32, 72, 46);
        ctx.fillStyle = '#f4ddc4';
        ctx.fillRect(32, 36, 64, 40);
        ctx.fillStyle = '#f8e8d4';
        ctx.fillRect(36, 40, 56, 36);
        // Warm rosy cheeks (relief, blood returning)
        ctx.fillStyle = '#f0c0a0';
        ctx.fillRect(32, 56, 14, 10);
        ctx.fillRect(82, 56, 14, 10);
        ctx.fillStyle = '#e8b898';
        ctx.fillRect(34, 58, 10, 6);
        ctx.fillRect(84, 58, 10, 6);
        ctx.fillStyle = '#f0b090';
        ctx.fillRect(36, 60, 6, 3);
        ctx.fillRect(86, 60, 6, 3);
        // Freckles
        ctx.fillStyle = '#d0a080';
        ctx.fillRect(40, 54, 2, 2); ctx.fillRect(44, 52, 2, 2);
        ctx.fillRect(54, 50, 2, 2); ctx.fillRect(58, 52, 2, 2);
        ctx.fillRect(70, 52, 2, 2); ctx.fillRect(74, 50, 2, 2);
        ctx.fillRect(84, 54, 2, 2); ctx.fillRect(88, 52, 2, 2);
        ctx.fillRect(48, 58, 2, 2); ctx.fillRect(80, 58, 2, 2);
        ctx.fillRect(62, 54, 2, 2); ctx.fillRect(66, 54, 2, 2);
        ctx.fillRect(52, 56, 1, 1); ctx.fillRect(76, 56, 1, 1);
        // Soft jawline
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(28, 72, 6, 6);
        ctx.fillRect(94, 72, 6, 6);

        // Eyes — wider, brighter, glistening (hope!)
        // Brows — raised, open (guard dropped for once)
        ctx.fillStyle = '#a04818';
        ctx.fillRect(36, 38, 22, 4);
        ctx.fillRect(74, 38, 22, 4);
        ctx.fillStyle = '#b05828';
        ctx.fillRect(38, 40, 18, 2);
        ctx.fillRect(76, 40, 18, 2);
        // Eye whites — wider, brighter
        ctx.fillStyle = '#f4ece4';
        ctx.fillRect(36, 44, 24, 14);
        ctx.fillRect(72, 44, 24, 14);
        ctx.fillStyle = '#f8f0e8';
        ctx.fillRect(38, 46, 20, 10);
        ctx.fillRect(74, 46, 20, 10);
        // Upper lid
        ctx.fillStyle = '#804020';
        ctx.fillRect(36, 42, 24, 2);
        ctx.fillRect(72, 42, 24, 2);
        // Green irises — vivid, bright (brighter than normal)
        ctx.fillStyle = P.green;
        ctx.fillRect(40, 44, 18, 12);
        ctx.fillRect(76, 44, 18, 12);
        ctx.fillStyle = P.lightGreen;
        ctx.fillRect(44, 46, 10, 8);
        ctx.fillRect(80, 46, 10, 8);
        ctx.fillStyle = '#6ad86a';
        ctx.fillRect(46, 48, 6, 4);
        ctx.fillRect(82, 48, 6, 4);
        // Bright iris center
        ctx.fillStyle = P.paleGreen;
        ctx.fillRect(46, 48, 6, 4);
        ctx.fillRect(82, 48, 6, 4);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(48, 48, 4, 4);
        ctx.fillRect(84, 48, 4, 4);
        // Bright catch-light (hope shining)
        ctx.fillStyle = P.white;
        ctx.fillRect(44, 44, 4, 4);
        ctx.fillRect(80, 44, 4, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(45, 45, 2, 2);
        ctx.fillRect(81, 45, 2, 2);
        // Moisture glistening (holding back tears of relief)
        ctx.fillStyle = 'rgba(240, 240, 240, 0.3)';
        ctx.fillRect(36, 58, 24, 2);
        ctx.fillRect(72, 58, 24, 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(38, 57, 20, 1);
        ctx.fillRect(74, 57, 20, 1);
        // Lower lash line
        ctx.fillStyle = '#c0a088';
        ctx.fillRect(36, 58, 24, 2);
        ctx.fillRect(72, 58, 24, 2);

        // Nose — small, upturned
        ctx.fillStyle = P.skin;
        ctx.fillRect(60, 52, 8, 10);
        ctx.fillStyle = '#e8c8a8';
        ctx.fillRect(62, 54, 4, 8);
        ctx.fillStyle = '#e0b898';
        ctx.fillRect(58, 60, 4, 2);
        ctx.fillRect(66, 60, 4, 2);

        // Mouth — genuine smile (rare, breaking through her composure)
        ctx.fillStyle = '#c05050';
        ctx.fillRect(48, 68, 32, 4);
        ctx.fillStyle = '#d87878';
        ctx.fillRect(52, 68, 24, 4);
        ctx.fillStyle = '#e88888';
        ctx.fillRect(56, 69, 16, 2);
        // Upturned corners (a real smile!)
        ctx.fillStyle = '#c05050';
        ctx.fillRect(46, 66, 4, 2);
        ctx.fillRect(78, 66, 4, 2);
        // Upper lip
        ctx.fillStyle = '#b04848';
        ctx.fillRect(56, 66, 16, 2);
        // Lower lip highlight
        ctx.fillStyle = '#e08888';
        ctx.fillRect(56, 72, 16, 2);
        ctx.fillStyle = '#f09898';
        ctx.fillRect(60, 72, 8, 1);

        // Hair — strawberry curls catching dawn light (brighter, more vivid)
        ctx.fillStyle = '#8a2a10';
        ctx.fillRect(20, 12, 88, 28);
        ctx.fillRect(16, 20, 12, 24);
        ctx.fillRect(100, 20, 12, 24);
        // Curly top
        ctx.fillRect(24, 8, 16, 8);
        ctx.fillRect(44, 4, 16, 12);
        ctx.fillRect(64, 8, 16, 8);
        ctx.fillRect(84, 8, 12, 8);
        ctx.fillRect(32, 4, 12, 8);
        // Dawn-lit highlights (brighter than normal — morning glow)
        ctx.fillStyle = '#d05020';
        ctx.fillRect(28, 12, 10, 12);
        ctx.fillRect(48, 8, 10, 12);
        ctx.fillRect(68, 12, 10, 12);
        ctx.fillRect(88, 12, 10, 12);
        ctx.fillRect(36, 6, 8, 8);
        // Bright tips (dawn catching the curls)
        ctx.fillStyle = '#e87838';
        ctx.fillRect(32, 12, 4, 8);
        ctx.fillRect(52, 8, 4, 8);
        ctx.fillRect(72, 12, 4, 8);
        ctx.fillRect(92, 12, 4, 8);
        // Hot golden highlights (sunrise)
        ctx.fillStyle = '#f08848';
        ctx.fillRect(34, 14, 2, 4);
        ctx.fillRect(54, 10, 2, 4);
        ctx.fillRect(74, 14, 2, 4);
        ctx.fillRect(94, 14, 2, 4);
        ctx.fillStyle = '#f89850';
        ctx.fillRect(35, 15, 1, 2);
        ctx.fillRect(55, 11, 1, 2);
        ctx.fillRect(75, 15, 1, 2);
        ctx.fillRect(95, 15, 1, 2);
        // Shadows between curls
        ctx.fillStyle = '#601808';
        ctx.fillRect(40, 16, 4, 12);
        ctx.fillRect(60, 12, 4, 12);
        ctx.fillRect(80, 16, 4, 12);
        ctx.fillStyle = '#4a1006';
        ctx.fillRect(42, 18, 2, 8);
        ctx.fillRect(62, 14, 2, 8);
        ctx.fillRect(82, 18, 2, 8);
        // Side curls
        ctx.fillStyle = '#8a2a10';
        ctx.fillRect(16, 36, 10, 16);
        ctx.fillRect(102, 36, 10, 16);
        ctx.fillStyle = '#d05020';
        ctx.fillRect(18, 40, 6, 8);
        ctx.fillRect(104, 40, 6, 8);
        ctx.fillStyle = '#e87838';
        ctx.fillRect(20, 42, 2, 4);
        ctx.fillRect(106, 42, 2, 4);
        // Temple wisps
        ctx.fillStyle = '#8a2a10';
        ctx.fillRect(28, 36, 4, 6);
        ctx.fillRect(96, 36, 4, 6);
      });

      // Svana Ironveil — worried: same fierce dwarf but exhausted and afraid (128x128)
      mp('svana_worried', function (ctx) {
        // Darker background (dimmer, more oppressive)
        ctx.fillStyle = '#1a0e1a';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#241828';
        ctx.fillRect(8, 12, 112, 116);
        ctx.fillStyle = '#2a1c30';
        ctx.fillRect(16, 20, 96, 100);

        // Armor — same plate over chain
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(8, 84, 112, 44);
        ctx.fillStyle = '#4a4a58';
        ctx.fillRect(16, 84, 96, 40);
        ctx.fillStyle = '#525260';
        ctx.fillRect(24, 88, 80, 36);
        // Pauldrons
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(16, 88, 20, 12);
        ctx.fillRect(92, 88, 20, 12);
        ctx.fillStyle = '#b0b0b8';
        ctx.fillRect(20, 88, 12, 8);
        ctx.fillRect(96, 88, 12, 8);
        // Chest plate
        ctx.fillStyle = P.gray;
        ctx.fillRect(36, 88, 56, 24);
        ctx.fillStyle = '#7a7a88';
        ctx.fillRect(40, 92, 48, 20);
        // Chainmail pattern
        ctx.fillStyle = '#8a8a98';
        for (var sy = 90; sy < 112; sy += 6) {
          for (var sx = 40; sx < 88; sx += 8) {
            ctx.fillRect(sx, sy, 4, 2);
          }
        }
        ctx.fillStyle = '#9a9aa8';
        for (var sy = 93; sy < 112; sy += 6) {
          for (var sx = 44; sx < 88; sx += 8) {
            ctx.fillRect(sx, sy, 3, 1);
          }
        }
        // Gorget
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(40, 80, 48, 8);
        ctx.fillStyle = '#4a4a58';
        ctx.fillRect(44, 80, 40, 4);

        // Neck
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(48, 68, 32, 16);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(50, 68, 28, 12);
        ctx.fillStyle = '#f0d8c0';
        ctx.fillRect(52, 70, 24, 10);

        // Face — same broad features but paler, drained
        ctx.fillStyle = P.skin;
        ctx.fillRect(24, 20, 80, 52);
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(28, 20, 72, 48);
        ctx.fillStyle = '#e8d8c8';
        ctx.fillRect(32, 24, 64, 42);
        ctx.fillStyle = '#f0e0d0';
        ctx.fillRect(36, 28, 56, 38);
        // Less flush, more pallor
        ctx.fillStyle = '#d8b8a0';
        ctx.fillRect(32, 48, 12, 8);
        ctx.fillRect(84, 48, 12, 8);
        ctx.fillStyle = '#e0c8b0';
        ctx.fillRect(34, 50, 8, 4);
        ctx.fillRect(86, 50, 8, 4);
        // Jaw
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(28, 60, 4, 8);
        ctx.fillRect(96, 60, 4, 8);

        // Eyes — same blue but wider, lifted worried brows
        // Brows — angled up in center (worried)
        ctx.fillStyle = '#901810';
        ctx.fillRect(36, 36, 24, 4);
        ctx.fillRect(72, 36, 24, 4);
        ctx.fillStyle = '#a02820';
        ctx.fillRect(38, 38, 20, 2);
        ctx.fillRect(74, 38, 20, 2);
        // Inner brows raised (worry crease)
        ctx.fillRect(56, 32, 8, 2);
        ctx.fillRect(64, 32, 8, 2);
        // Forehead tension
        ctx.fillStyle = '#e0c8b0';
        ctx.fillRect(56, 34, 16, 2);
        // Eye whites — wider
        ctx.fillStyle = '#e8e0e0';
        ctx.fillRect(40, 40, 16, 12);
        ctx.fillRect(76, 40, 16, 12);
        ctx.fillStyle = '#f0e8e8';
        ctx.fillRect(42, 42, 12, 8);
        ctx.fillRect(78, 42, 12, 8);
        // Blue irises
        ctx.fillStyle = P.blue;
        ctx.fillRect(44, 42, 10, 10);
        ctx.fillRect(80, 42, 10, 10);
        ctx.fillStyle = P.lightBlue;
        ctx.fillRect(46, 44, 6, 6);
        ctx.fillRect(82, 44, 6, 6);
        ctx.fillStyle = '#6a9aea';
        ctx.fillRect(47, 45, 4, 4);
        ctx.fillRect(83, 45, 4, 4);
        // Pupils
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(48, 46, 4, 4);
        ctx.fillRect(84, 46, 4, 4);
        // Catch-light
        ctx.fillStyle = '#e0e0f0';
        ctx.fillRect(44, 40, 4, 4);
        ctx.fillRect(80, 40, 4, 4);
        ctx.fillStyle = '#f0f0f8';
        ctx.fillRect(45, 41, 2, 2);
        ctx.fillRect(81, 41, 2, 2);
        // Dark circles under eyes (exhaustion)
        ctx.fillStyle = '#b098a0';
        ctx.fillRect(40, 52, 16, 4);
        ctx.fillRect(76, 52, 16, 4);
        ctx.fillStyle = '#a08898';
        ctx.fillRect(42, 53, 12, 2);
        ctx.fillRect(78, 53, 12, 2);

        // Nose — same
        ctx.fillStyle = P.paleSkin;
        ctx.fillRect(58, 48, 12, 8);
        ctx.fillStyle = '#e8d8c8';
        ctx.fillRect(60, 50, 8, 6);
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(58, 54, 4, 2);
        ctx.fillRect(66, 54, 4, 2);

        // Mouth — tight, trembling, not determined
        ctx.fillStyle = P.darkRed;
        ctx.fillRect(54, 60, 20, 4);
        ctx.fillStyle = '#a05050';
        ctx.fillRect(58, 60, 12, 2);
        // Slight downturn at corners
        ctx.fillStyle = P.darkSkin;
        ctx.fillRect(52, 62, 4, 2);
        ctx.fillRect(72, 62, 4, 2);

        // Hair — same red braids but messier
        ctx.fillStyle = P.red;
        ctx.fillRect(24, 8, 80, 20);
        ctx.fillRect(28, 4, 72, 8);
        ctx.fillStyle = '#e04030';
        ctx.fillRect(36, 8, 16, 8);
        ctx.fillRect(68, 8, 16, 8);
        ctx.fillStyle = '#f05040';
        ctx.fillRect(44, 6, 8, 4);
        ctx.fillRect(76, 6, 8, 4);
        ctx.fillStyle = '#901810';
        ctx.fillRect(52, 12, 4, 8);
        ctx.fillRect(72, 12, 4, 8);
        // Left braid — slightly disheveled
        ctx.fillStyle = P.red;
        ctx.fillRect(16, 20, 16, 68);
        ctx.fillStyle = '#c03020';
        ctx.fillRect(20, 24, 8, 56);
        ctx.fillStyle = '#901810';
        ctx.fillRect(20, 32, 8, 4);
        ctx.fillRect(20, 44, 8, 4);
        ctx.fillRect(20, 56, 8, 4);
        ctx.fillRect(20, 68, 8, 4);
        // Braid texture
        ctx.fillStyle = '#a02818';
        ctx.fillRect(22, 28, 4, 4);
        ctx.fillRect(22, 40, 4, 4);
        ctx.fillRect(22, 52, 4, 4);
        ctx.fillRect(22, 64, 4, 4);
        // Loose strands (disheveled from worry)
        ctx.fillStyle = '#c03020';
        ctx.fillRect(28, 28, 4, 6);
        ctx.fillRect(30, 40, 2, 8);
        ctx.fillRect(12, 36, 4, 8);
        // Left braid clasp
        ctx.fillStyle = P.gold;
        ctx.fillRect(16, 80, 16, 8);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(20, 82, 8, 4);
        ctx.fillStyle = '#d0b820';
        ctx.fillRect(22, 83, 4, 2);
        // Right braid
        ctx.fillStyle = P.red;
        ctx.fillRect(96, 20, 16, 68);
        ctx.fillStyle = '#c03020';
        ctx.fillRect(100, 24, 8, 56);
        ctx.fillStyle = '#901810';
        ctx.fillRect(100, 32, 8, 4);
        ctx.fillRect(100, 44, 8, 4);
        ctx.fillRect(100, 56, 8, 4);
        ctx.fillRect(100, 68, 8, 4);
        // Braid texture
        ctx.fillStyle = '#a02818';
        ctx.fillRect(102, 28, 4, 4);
        ctx.fillRect(102, 40, 4, 4);
        ctx.fillRect(102, 52, 4, 4);
        ctx.fillRect(102, 64, 4, 4);
        // Loose strands right
        ctx.fillStyle = '#c03020';
        ctx.fillRect(96, 28, 4, 6);
        ctx.fillRect(96, 40, 2, 8);
        ctx.fillRect(112, 36, 4, 8);
        // Right braid clasp
        ctx.fillStyle = P.gold;
        ctx.fillRect(96, 80, 16, 8);
        ctx.fillStyle = P.yellow;
        ctx.fillRect(100, 82, 8, 4);
        ctx.fillStyle = '#d0b820';
        ctx.fillRect(102, 83, 4, 2);
      });

      // Nitriti — ethereal spirit between stars: pale luminous face floating
      // in deep blue void, androgynous features, starlight in their hair,
      // eyes like twin nebulae. Neither masculine nor feminine — cosmic.
      mp('nitriti', function (ctx) {
        // Deep void background with subtle starfield
        ctx.fillStyle = '#050818';
        ctx.fillRect(0, 0, 128, 128);

        // Distant stars — more visible at this scale (white)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, 6, 2, 2); ctx.fillRect(112, 16, 2, 2);
        ctx.fillRect(24, 112, 2, 2); ctx.fillRect(104, 92, 2, 2);
        ctx.fillRect(4, 56, 2, 2); ctx.fillRect(120, 52, 2, 2);
        ctx.fillRect(16, 96, 2, 2); ctx.fillRect(116, 104, 2, 2);
        ctx.fillRect(96, 8, 2, 2); ctx.fillRect(12, 32, 2, 2);
        // Additional white stars
        ctx.fillRect(72, 120, 1, 1); ctx.fillRect(118, 68, 1, 1);
        ctx.fillRect(20, 84, 1, 1); ctx.fillRect(88, 24, 1, 1);
        ctx.fillRect(44, 8, 1, 1); ctx.fillRect(64, 118, 1, 1);

        // Blue stars
        ctx.fillStyle = '#8ab8f0';
        ctx.fillRect(16, 28, 2, 2); ctx.fillRect(108, 108, 2, 2);
        ctx.fillRect(84, 116, 2, 2); ctx.fillRect(6, 84, 2, 2);
        // Additional blue stars
        ctx.fillRect(52, 12, 1, 1); ctx.fillRect(100, 36, 1, 1);
        ctx.fillRect(32, 108, 1, 1); ctx.fillRect(114, 76, 1, 1);

        // Faint nebula wisps
        ctx.fillStyle = 'rgba(80, 100, 180, 0.15)';
        ctx.fillRect(0, 40, 32, 16);
        ctx.fillRect(96, 60, 32, 16);
        ctx.fillStyle = 'rgba(100, 80, 160, 0.1)';
        ctx.fillRect(12, 8, 24, 12);
        ctx.fillRect(92, 100, 28, 20);

        // Spectral glow around head — ethereal corona
        ctx.fillStyle = '#0f1d40';
        ctx.fillRect(20, 8, 88, 96);
        ctx.fillStyle = '#1a2a50';
        ctx.fillRect(28, 16, 72, 80);
        ctx.fillStyle = '#1e3060';
        ctx.fillRect(36, 24, 56, 68);
        ctx.fillStyle = '#22365c';
        ctx.fillRect(42, 30, 44, 56);

        // Face — pale, luminous, smooth androgynous features
        ctx.fillStyle = '#8aa8d0';
        ctx.fillRect(32, 28, 64, 52);
        ctx.fillStyle = '#a0c0e0';
        ctx.fillRect(36, 28, 56, 48);
        ctx.fillStyle = '#b0c8e8';
        ctx.fillRect(40, 32, 48, 42);
        // Luminous inner glow
        ctx.fillStyle = '#c8d8f0';
        ctx.fillRect(44, 36, 40, 32);
        ctx.fillStyle = '#d0e0f4';
        ctx.fillRect(48, 40, 32, 24);
        // Subtle cheek structure
        ctx.fillStyle = '#d0e0f8';
        ctx.fillRect(44, 48, 12, 8);
        ctx.fillRect(72, 48, 12, 8);
        // Additional cheek highlight
        ctx.fillStyle = '#dce8fc';
        ctx.fillRect(46, 50, 8, 4);
        ctx.fillRect(74, 50, 8, 4);

        // Eyes — nebula-like: deep blue-purple glow, soft luminous centers
        // Eye sockets — soft glow, not harsh
        ctx.fillStyle = '#4060a0';
        ctx.fillRect(40, 40, 20, 12);
        ctx.fillRect(72, 40, 20, 12);
        // Nebula iris — swirling blue-purple
        ctx.fillStyle = '#6080c0';
        ctx.fillRect(44, 42, 12, 8);
        ctx.fillRect(76, 42, 12, 8);
        // Mid-tone nebula layer
        ctx.fillStyle = '#7090d0';
        ctx.fillRect(46, 43, 8, 6);
        ctx.fillRect(78, 43, 8, 6);
        // Bright center — white-blue starlight
        ctx.fillStyle = '#a0c0ff';
        ctx.fillRect(48, 44, 6, 4);
        ctx.fillRect(80, 44, 6, 4);
        ctx.fillStyle = '#c0d8ff';
        ctx.fillRect(50, 44, 2, 2);
        ctx.fillRect(82, 44, 2, 2);
        // Brightest point
        ctx.fillStyle = '#e0f0ff';
        ctx.fillRect(50, 45, 1, 1);
        ctx.fillRect(82, 45, 1, 1);
        // Soft eye glow (extends beyond sockets)
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#8ab8f0';
        ctx.fillRect(36, 36, 28, 20);
        ctx.fillRect(68, 36, 28, 20);
        ctx.globalAlpha = 1;

        // Nose — minimal, spectral shadow
        ctx.fillStyle = '#90a8c8';
        ctx.fillRect(60, 56, 8, 4);
        ctx.fillStyle = '#98b0d0';
        ctx.fillRect(62, 57, 4, 2);

        // Mouth — gentle, serene, closed
        ctx.fillStyle = '#90a0c0';
        ctx.fillRect(54, 68, 20, 4);
        ctx.fillStyle = '#a0b0d0';
        ctx.fillRect(56, 68, 16, 2);
        ctx.fillStyle = '#b0c0e0';
        ctx.fillRect(58, 68, 12, 1);

        // Hair / starlight wisps — aurora-like, flowing, not gendered
        ctx.fillStyle = '#7aa0e0';
        ctx.fillRect(28, 12, 72, 20);
        ctx.fillRect(24, 20, 12, 28);
        ctx.fillRect(92, 20, 12, 28);
        // Additional hair depth
        ctx.fillStyle = '#6a90d0';
        ctx.fillRect(32, 14, 16, 12);
        ctx.fillRect(80, 14, 16, 12);
        // Starlight strands — brighter
        ctx.fillStyle = '#a0d0ff';
        ctx.fillRect(36, 12, 12, 6);
        ctx.fillRect(68, 12, 16, 6);
        ctx.fillRect(20, 24, 6, 16);
        ctx.fillRect(100, 28, 6, 16);
        // Additional bright strands
        ctx.fillStyle = '#b0e0ff';
        ctx.fillRect(52, 14, 8, 4);
        ctx.fillRect(24, 32, 4, 8);
        ctx.fillRect(98, 36, 4, 8);
        // White highlights — captured starlight
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(44, 12, 4, 4);
        ctx.fillRect(76, 12, 4, 4);
        ctx.fillRect(56, 8, 4, 4);
        ctx.fillRect(24, 28, 2, 4);
        ctx.fillRect(102, 32, 2, 4);
        // Additional white highlights
        ctx.fillRect(64, 10, 2, 2);
        ctx.fillRect(28, 18, 2, 2);
        ctx.fillRect(96, 22, 2, 2);
        // Aurora shimmer (faint purple)
        ctx.fillStyle = 'rgba(160, 120, 220, 0.3)';
        ctx.fillRect(32, 16, 8, 8);
        ctx.fillRect(88, 16, 8, 8);
        ctx.fillStyle = 'rgba(140, 100, 200, 0.2)';
        ctx.fillRect(26, 22, 6, 10);
        ctx.fillRect(94, 22, 6, 10);

        // Neck/form fading into void — spectral dissolve
        ctx.fillStyle = '#6080a0';
        ctx.fillRect(48, 76, 32, 12);
        ctx.fillStyle = '#5878a0';
        ctx.fillRect(44, 84, 40, 8);
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#4060a0';
        ctx.fillRect(40, 88, 48, 12);
        ctx.globalAlpha = 0.35;
        ctx.fillRect(36, 100, 56, 12);
        ctx.globalAlpha = 0.15;
        ctx.fillRect(32, 112, 64, 16);
        ctx.globalAlpha = 1;
      });

      // Statue — depicts Izuriel Sakazarac, the Sun-King. A regal elf face
      // carved in stone, imperious and sharp-featured. Damaged by goblin claws
      // but still imposing. Pointed ears, high cheekbones, narrow cold eyes.
      mp('statue', function (ctx) {
        // Dark stone background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#222222';
        ctx.fillRect(8, 8, 112, 112);
        ctx.fillStyle = '#282828';
        ctx.fillRect(12, 12, 104, 104);

        // Stone face shape — elven, angular, carved
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(28, 8, 72, 84);
        ctx.fillStyle = P.gray;
        ctx.fillRect(32, 12, 64, 76);
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(36, 16, 56, 68);
        ctx.fillStyle = '#b8b8c8';
        ctx.fillRect(40, 20, 48, 60);
        // High cheekbones — angular elven stone
        ctx.fillStyle = '#b0b0b8';
        ctx.fillRect(36, 48, 16, 6);
        ctx.fillRect(76, 48, 16, 6);
        ctx.fillStyle = '#c0c0c8';
        ctx.fillRect(38, 49, 12, 4);
        ctx.fillRect(78, 49, 12, 4);
        // Angular jaw (elven)
        ctx.fillStyle = P.gray;
        ctx.fillRect(32, 68, 6, 12);
        ctx.fillRect(90, 68, 6, 12);
        ctx.fillRect(38, 76, 4, 4);
        ctx.fillRect(86, 76, 4, 4);
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(34, 74, 4, 8);
        ctx.fillRect(90, 74, 4, 8);

        // Pointed ears — elven, carved in stone
        ctx.fillStyle = P.gray;
        ctx.fillRect(16, 32, 16, 24);
        ctx.fillRect(96, 32, 16, 24);
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(20, 36, 8, 16);
        ctx.fillRect(100, 36, 8, 16);
        ctx.fillStyle = '#a0a0b0';
        ctx.fillRect(22, 38, 4, 12);
        ctx.fillRect(102, 38, 4, 12);
        // Ear points
        ctx.fillStyle = P.gray;
        ctx.fillRect(8, 20, 12, 16);
        ctx.fillRect(108, 20, 12, 16);
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(12, 24, 6, 8);
        ctx.fillRect(110, 24, 6, 8);
        ctx.fillStyle = '#a8a8b8';
        ctx.fillRect(14, 26, 3, 5);
        ctx.fillRect(111, 26, 3, 5);

        // Eyes — narrow, imperious, faint golden glow
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(40, 40, 20, 8);
        ctx.fillRect(72, 40, 20, 8);
        ctx.fillStyle = '#a08020';
        ctx.fillRect(48, 42, 8, 4);
        ctx.fillRect(80, 42, 8, 4);
        ctx.fillStyle = '#b09028';
        ctx.fillRect(50, 43, 4, 2);
        ctx.fillRect(82, 43, 4, 2);
        // Golden glow center
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(50, 42, 4, 2);
        ctx.fillRect(82, 42, 4, 2);
        ctx.fillStyle = '#d0b040';
        ctx.fillRect(51, 42, 2, 1);
        ctx.fillRect(83, 42, 2, 1);
        // Heavy stone brow ridge
        ctx.fillStyle = P.gray;
        ctx.fillRect(36, 32, 24, 6);
        ctx.fillRect(72, 32, 24, 6);
        ctx.fillStyle = '#7a7a8a';
        ctx.fillRect(38, 33, 20, 4);
        ctx.fillRect(74, 33, 20, 4);

        // Claw damage — deep scratches gouged into stone
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(36, 28, 4, 24);
        ctx.fillRect(84, 24, 4, 28);
        ctx.fillRect(56, 16, 4, 16);
        // Deeper claw marks
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(38, 32, 2, 16);
        ctx.fillRect(86, 28, 2, 20);
        ctx.fillRect(58, 20, 2, 8);
        // Additional claw scratches
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(37, 34, 1, 12);
        ctx.fillRect(85, 30, 1, 16);
        ctx.fillRect(57, 21, 1, 6);

        // Nose — straight, patrician, stone
        ctx.fillStyle = P.gray;
        ctx.fillRect(60, 52, 8, 12);
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(62, 52, 4, 8);
        ctx.fillStyle = '#a8a8b8';
        ctx.fillRect(63, 53, 2, 6);

        // Mouth — thin, cold, imperious
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(52, 68, 24, 4);
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(56, 68, 16, 2);
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(58, 69, 12, 1);

        // Crown remnant — sun-shaped diadem, partially broken
        ctx.fillStyle = '#a08020';
        ctx.fillRect(36, 4, 56, 12);
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(40, 6, 48, 8);
        ctx.fillStyle = '#d0b040';
        ctx.fillRect(44, 7, 40, 6);
        // Crown points — sun rays (some broken)
        ctx.fillStyle = '#a08020';
        ctx.fillRect(52, -4, 8, 12);
        ctx.fillRect(68, -4, 8, 12);
        ctx.fillRect(36, 0, 8, 8);
        // Broken point (right side snapped off)
        ctx.fillRect(84, 4, 6, 6);
        // Sun ray fragments
        ctx.fillStyle = '#806018';
        ctx.fillRect(44, 0, 4, 8);
        ctx.fillRect(76, 0, 4, 6);
        ctx.fillRect(58, -2, 4, 6);
        // Crown gem — faded gold
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(58, 8, 12, 6);
        ctx.fillStyle = '#d0b040';
        ctx.fillRect(60, 8, 8, 4);
        ctx.fillStyle = '#e0c050';
        ctx.fillRect(62, 9, 4, 2);

        // Cracks radiating outward from damage
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(32, 56, 4, 4);
        ctx.fillRect(92, 52, 4, 4);
        ctx.fillRect(44, 76, 4, 4);
        ctx.fillRect(76, 80, 4, 2);
        ctx.fillRect(40, 28, 2, 6);
        // Additional fine cracks
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(48, 60, 2, 3);
        ctx.fillRect(78, 58, 2, 4);
        ctx.fillRect(64, 32, 2, 3);

        // Base/pedestal
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(16, 88, 96, 16);
        ctx.fillStyle = P.gray;
        ctx.fillRect(20, 88, 88, 4);
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(24, 88, 80, 2);
        ctx.fillStyle = '#7a7a8a';
        ctx.fillRect(26, 89, 76, 1);
        // Pedestal base
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(12, 104, 104, 24);
        ctx.fillStyle = P.darkGray;
        ctx.fillRect(16, 104, 96, 8);
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(20, 105, 88, 4);

        // Faint golden glow from the sun crown
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#c0a040';
        ctx.fillRect(24, 0, 80, 32);
        ctx.globalAlpha = 0.06;
        ctx.fillRect(16, 0, 96, 48);
        ctx.globalAlpha = 1;
      });

      // Sign — weathered wooden signpost, carved text, nailed to a post
      mp('sign', function (ctx) {
        // Outdoor dusk background
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#101828';
        ctx.fillRect(8, 8, 112, 112);
        ctx.fillStyle = '#141c2c';
        ctx.fillRect(12, 12, 104, 104);

        // Wooden post — dark, weathered
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(56, 68, 16, 60);
        ctx.fillStyle = '#4a2818';
        ctx.fillRect(58, 72, 12, 52);
        ctx.fillStyle = '#5a3820';
        ctx.fillRect(60, 74, 8, 48);
        // Wood grain on post
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(62, 76, 2, 40);
        ctx.fillRect(66, 72, 2, 44);
        ctx.fillStyle = '#4a2818';
        ctx.fillRect(64, 78, 1, 38);
        // Additional weathering
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(60, 82, 2, 3);
        ctx.fillRect(66, 90, 2, 4);

        // Sign board — wide, wooden, slightly crooked
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(8, 12, 112, 60);
        ctx.fillStyle = '#4a2818';
        ctx.fillRect(12, 16, 104, 52);
        ctx.fillStyle = '#5a3820';
        ctx.fillRect(16, 20, 96, 44);
        ctx.fillStyle = '#6a4828';
        ctx.fillRect(20, 22, 88, 40);
        // Wood grain texture
        ctx.fillStyle = '#4a2818';
        ctx.fillRect(20, 24, 88, 2);
        ctx.fillRect(20, 36, 88, 2);
        ctx.fillRect(20, 48, 88, 2);
        ctx.fillRect(20, 58, 88, 1);
        // Additional grain lines
        ctx.fillStyle = '#5a3820';
        ctx.fillRect(20, 30, 88, 1);
        ctx.fillRect(20, 42, 88, 1);
        ctx.fillRect(20, 54, 88, 1);
        // Board edge bevel
        ctx.fillStyle = '#6a4828';
        ctx.fillRect(16, 20, 96, 2);
        ctx.fillStyle = '#7a5830';
        ctx.fillRect(18, 21, 92, 1);
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(16, 62, 96, 2);
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(18, 63, 92, 1);
        // Weathered edges
        ctx.fillStyle = '#4a2818';
        ctx.fillRect(12, 18, 4, 50);
        ctx.fillRect(112, 18, 4, 50);

        // Nails — holding the board to the post
        ctx.fillStyle = P.gray;
        ctx.fillRect(20, 28, 4, 4);
        ctx.fillRect(104, 28, 4, 4);
        ctx.fillRect(20, 52, 4, 4);
        ctx.fillRect(104, 52, 4, 4);
        ctx.fillStyle = '#5a5a6a';
        ctx.fillRect(21, 29, 2, 2);
        ctx.fillRect(105, 29, 2, 2);
        ctx.fillRect(21, 53, 2, 2);
        ctx.fillRect(105, 53, 2, 2);
        // Nail highlights
        ctx.fillStyle = P.lightGray;
        ctx.fillRect(20, 28, 2, 2);
        ctx.fillRect(104, 28, 2, 2);
        ctx.fillRect(20, 52, 1, 1);
        ctx.fillRect(104, 52, 1, 1);

        // Carved/painted text lines (abstract — suggesting words)
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(28, 28, 36, 4);
        ctx.fillRect(72, 28, 24, 4);
        ctx.fillRect(28, 38, 48, 4);
        ctx.fillRect(28, 48, 20, 4);
        ctx.fillRect(56, 48, 32, 4);
        // Additional text detail
        ctx.fillStyle = '#0a0804';
        ctx.fillRect(30, 29, 32, 2);
        ctx.fillRect(74, 29, 20, 2);
        ctx.fillRect(30, 39, 44, 2);
        // Faded paint (lighter lines showing through)
        ctx.fillStyle = '#7a5830';
        ctx.fillRect(28, 56, 40, 2);
        ctx.fillStyle = '#8a6838';
        ctx.fillRect(30, 57, 36, 1);

        // Scratched graffiti at bottom — "GOOD LUCK" suggestion
        ctx.fillStyle = '#8a6838';
        ctx.fillRect(36, 56, 16, 2);
        ctx.fillRect(60, 56, 20, 2);
        ctx.fillStyle = '#9a7848';
        ctx.fillRect(38, 57, 12, 1);
        ctx.fillRect(62, 57, 16, 1);
      });

      // Inscription — ancient stone carving, weathered runes
      mp('inscription', function (ctx) {
        // Dark temple stone background
        ctx.fillStyle = '#0a0a0e';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#141418';
        ctx.fillRect(8, 8, 112, 112);
        ctx.fillStyle = '#1a1a1e';
        ctx.fillRect(12, 12, 104, 104);

        // Stone tablet — carved, ancient
        ctx.fillStyle = '#2a2a30';
        ctx.fillRect(12, 8, 104, 112);
        ctx.fillStyle = '#3a3a42';
        ctx.fillRect(16, 12, 96, 104);
        ctx.fillStyle = '#4a4a54';
        ctx.fillRect(20, 16, 88, 96);
        ctx.fillStyle = '#5a5a64';
        ctx.fillRect(24, 20, 80, 88);
        // Stone border — carved frame
        ctx.fillStyle = '#3a3a42';
        ctx.fillRect(16, 12, 96, 4);
        ctx.fillRect(16, 112, 96, 4);
        ctx.fillRect(16, 12, 4, 104);
        ctx.fillRect(108, 12, 4, 104);
        ctx.fillStyle = '#2a2a30';
        ctx.fillRect(18, 14, 92, 2);
        ctx.fillRect(18, 14, 2, 100);
        // Inner bevel
        ctx.fillStyle = '#5a5a64';
        ctx.fillRect(20, 16, 88, 2);
        ctx.fillStyle = '#6a6a74';
        ctx.fillRect(22, 17, 84, 1);
        ctx.fillStyle = '#2a2a30';
        ctx.fillRect(20, 110, 88, 2);
        ctx.fillStyle = '#1a1a20';
        ctx.fillRect(22, 111, 84, 1);

        // Carved rune lines — ancient script
        ctx.fillStyle = '#2a2a34';
        // Line 1 — longest, most legible
        ctx.fillRect(28, 28, 8, 6); ctx.fillRect(40, 28, 12, 6);
        ctx.fillRect(56, 28, 6, 6); ctx.fillRect(68, 28, 16, 6);
        ctx.fillRect(88, 28, 10, 6);
        // Additional rune detail for line 1
        ctx.fillStyle = '#1a1a24';
        ctx.fillRect(30, 30, 4, 2); ctx.fillRect(42, 30, 8, 2);
        ctx.fillRect(58, 30, 2, 2); ctx.fillRect(70, 30, 12, 2);
        ctx.fillRect(90, 30, 6, 2);

        // Line 2
        ctx.fillStyle = '#2a2a34';
        ctx.fillRect(28, 44, 16, 6); ctx.fillRect(48, 44, 8, 6);
        ctx.fillRect(60, 44, 12, 6); ctx.fillRect(80, 44, 18, 6);
        // Additional rune detail for line 2
        ctx.fillStyle = '#1a1a24';
        ctx.fillRect(30, 46, 12, 2); ctx.fillRect(50, 46, 4, 2);
        ctx.fillRect(62, 46, 8, 2); ctx.fillRect(82, 46, 14, 2);

        // Line 3 — partially clawed away
        ctx.fillStyle = '#2a2a34';
        ctx.fillRect(28, 60, 10, 6); ctx.fillRect(44, 60, 6, 6);
        ctx.fillRect(76, 60, 12, 6);
        // Additional rune detail for line 3
        ctx.fillStyle = '#1a1a24';
        ctx.fillRect(30, 62, 6, 2);
        ctx.fillRect(78, 62, 8, 2);

        // Line 4 — mostly illegible
        ctx.fillStyle = '#2a2a34';
        ctx.fillRect(28, 76, 6, 6);
        ctx.fillRect(88, 76, 10, 6);
        ctx.fillStyle = '#1a1a24';
        ctx.fillRect(30, 78, 2, 2);
        ctx.fillRect(90, 78, 6, 2);

        // Claw damage — goblin scratches across the stone
        ctx.fillStyle = '#2a2a30';
        ctx.fillRect(52, 56, 4, 20);
        ctx.fillRect(60, 52, 4, 28);
        ctx.fillRect(68, 60, 4, 16);
        // Deeper scratches
        ctx.fillStyle = '#1a1a20';
        ctx.fillRect(54, 60, 2, 12);
        ctx.fillRect(62, 56, 2, 20);
        ctx.fillRect(70, 64, 2, 10);
        // Additional scratch detail
        ctx.fillStyle = '#0a0a10';
        ctx.fillRect(55, 62, 1, 8);
        ctx.fillRect(63, 58, 1, 16);
        ctx.fillRect(71, 66, 1, 6);

        // Faint purple glow from remaining runes (magical)
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#8060c0';
        ctx.fillRect(28, 24, 72, 16);
        ctx.fillRect(28, 40, 72, 16);
        ctx.globalAlpha = 0.05;
        ctx.fillRect(24, 22, 80, 20);
        ctx.fillRect(24, 38, 80, 20);
        ctx.globalAlpha = 1;

        // Dust/age texture — tiny light spots
        ctx.fillStyle = '#5a5a64';
        ctx.fillRect(32, 92, 2, 2); ctx.fillRect(48, 96, 2, 2);
        ctx.fillRect(76, 88, 2, 2); ctx.fillRect(92, 100, 2, 2);
        ctx.fillRect(40, 104, 2, 2); ctx.fillRect(84, 92, 2, 2);
        // Additional dust spots
        ctx.fillStyle = '#6a6a74';
        ctx.fillRect(56, 94, 1, 1); ctx.fillRect(68, 98, 1, 1);
        ctx.fillRect(44, 90, 1, 1); ctx.fillRect(88, 96, 1, 1);
        ctx.fillRect(36, 102, 1, 1); ctx.fillRect(72, 106, 1, 1);
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
