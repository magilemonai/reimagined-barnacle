/**
 * Valisar: Shadows of the Eldspyre
 * Dialogue System & NPC Dialogue Data
 *
 * Provides a typewriter-style dialogue box renderer and all
 * NPC / event dialogue for the game. Assigned to window.Dialogue
 * and window.DialogueData. Does NOT use ES modules.
 *
 * Internal resolution: 256x224 (matches engine buffer).
 * Max ~38 characters per line at 6px per glyph.
 */

(function () {
  'use strict';

  // =======================================================================
  // DIALOGUE DATA  (window.DialogueData)
  // =======================================================================

  var DialogueData = {

    // -----------------------------------------------------------------
    // Cutscene - Intro (after character select)
    // -----------------------------------------------------------------

    intro_cutscene: [
      { speaker: '', text: 'Ebon Vale was never a grand place. Too small for kings to notice, too stubborn to die. For a while, that was enough.', scene: 'town' },
      { speaker: '', text: 'Then the goblins came. Not raiders -- refugees. Desperate, starving, and following a queen who promised them the world.', scene: 'forest' },
      { speaker: '', text: 'Bargnot found the Temple of Nitriti. Found the old rituals. Found a spirit called Smaldge who whispered terrible, beautiful lies.', scene: 'temple' },
      { speaker: '', text: 'And so three travelers arrived at the edge of everything going wrong, carrying nothing but sharp steel, old magic, and stubbornness.', scene: 'heroes' }
    ],

    // -----------------------------------------------------------------
    // Town NPCs - Ebon Vale Square
    // -----------------------------------------------------------------

    fawks_greeting: [
      { speaker: 'Fawks', text: 'Welcome to The Dancing Pig! ...Don\'t mind the name. Long story involving my ex-husband and an actual pig.' },
      { speaker: 'Fawks', text: 'Listen -- those goblins? They took Rorik Flamebeard right out of the market. Broad daylight. Nobody did a thing.' },
      { speaker: 'Fawks', text: 'I just pour drinks. But Braxon\'s forge is south of here, and Brother Soren\'s chapel. They can actually help.' }
    ],

    helena_greeting: [
      { speaker: 'Helena', text: 'You must be the ones Braxon sent word about. Thank the spirits.' },
      { speaker: 'Helena', text: 'I won\'t dress this up. We\'re losing. The goblins took Rorik, they\'ve cut our supply lines, and my guard captain is running on fury and stubbornness.' },
      { speaker: 'Helena', text: 'Head south to the market. Braxon will outfit you. Brother Soren can bless your journey. And then... north. Into the forest.' },
      { speaker: 'Helena', text: 'I wish I could send soldiers with you. I can only send my hope.' }
    ],

    elira_greeting: [
      { speaker: 'Elira', text: 'Captain Voss. I command what\'s left of the town guard, which is six people and a dog.' },
      { speaker: 'Elira', text: 'We caught some goblin scouts. They talk tough until you separate them. Their queen, Bargnot -- she\'s the real threat.' },
      { speaker: 'Elira', text: 'I don\'t trust spirits, prophecies, or chosen ones. But I trust sharp steel. Don\'t let me down.' }
    ],

    // -----------------------------------------------------------------
    // Town NPCs - Ebon Vale Market
    // -----------------------------------------------------------------

    braxon_greeting: [
      { speaker: 'Braxon', text: 'Name\'s Braxon. I make weapons. Lately I\'ve been making a lot of weapons.' },
      { speaker: 'Braxon', text: 'If you\'re heading to that temple, you\'ll want something better than whatever you\'re carrying. Take what you need from the forge.' },
      { speaker: 'Braxon', text: 'And if you see my boy Daxon out there... tell him his old man still worries.' }
    ],

    braxon_greeting_daxon: [
      { speaker: 'Braxon', text: '...Daxon? DAXON! Boy, get over here!' },
      { speaker: 'Braxon', text: 'Let me look at you. You\'ve gotten thinner. Are you eating? You\'re not eating.' },
      { speaker: 'Braxon', text: 'Your mother would kill me if she knew I was sending you into a goblin-infested temple. Good thing she\'s not here.' },
      { speaker: 'Braxon', text: 'Take whatever you need from the forge. And Daxon -- come back. That\'s not a request.' }
    ],

    soren_greeting: [
      { speaker: 'Soren', text: 'Ah. Adventurers. I can smell the determination on you. ...And the road. Mostly the road.' },
      { speaker: 'Soren', text: 'I am Brother Soren. I tend to the refugees here -- what remains of the mountain dwarves after the goblins came.' },
      { speaker: 'Soren', text: 'The spirits have been restless since Bargnot entered the temple. I can feel it in my whiskers. That sounds absurd but it\'s true.' },
      { speaker: 'Soren', text: 'Come. Let me bless you before you go. It\'s the least the spirits can offer.' }
    ],

    rorik_greeting: [
      { speaker: 'Rorik', text: 'Aye, name\'s Rorik Flamebeard. Lost me kin to those blasted goblins.' },
      { speaker: 'Rorik', text: 'If you\'re heading to that temple, watch for traps. Bargnot is cunning.' },
      { speaker: 'Rorik', text: 'May the forge-fire guide your blade.' }
    ],

    svana_greeting: [
      { speaker: 'Svana', text: 'What are you looking at? ...Sorry. I\'m Svana. I haven\'t slept.' },
      { speaker: 'Svana', text: 'They took my cousin Rorik. Dragged him to their temple for some ritual. He\'s strong but he\'s not... he\'s not invincible.' },
      { speaker: 'Svana', text: 'If you find him in there -- when you find him -- tell him Svana says he\'s an idiot for getting caught.' },
      { speaker: 'Svana', text: '...And tell him to come home.' }
    ],

    rorik_rescue: [
      { speaker: 'Rorik', text: 'You... I thought... I thought no one was coming.' },
      { speaker: 'Rorik', text: 'She was going to sacrifice me. I could feel the shadow pulling at my bones...' },
      { speaker: 'Rorik', text: 'Svana -- is Svana safe? Tell me she\'s safe.' },
      { speaker: 'Rorik', text: 'Thank the forge-spirits. I owe you everything. Now let\'s finish this.' }
    ],

    // -----------------------------------------------------------------
    // Ebon Vale North
    // -----------------------------------------------------------------

    sign_warning: [
      { speaker: 'Sign', text: 'EBON FOREST -- NORTH. "Goblins sighted beyond this point. Travel in groups. By order of Cpt. Voss."' },
      { speaker: 'Sign', text: 'Someone has scratched underneath: "GOOD LUCK"' }
    ],

    // -----------------------------------------------------------------
    // Ebon Forest
    // -----------------------------------------------------------------

    querubra_greeting: [
      { speaker: 'Que\'Rubra', text: '... Be still. I feel your footsteps like splinters in old wood.' },
      { speaker: 'Que\'Rubra', text: 'I am Que\'Rubra. I have watched this forest for longer than your kingdoms have had names.' },
      { speaker: 'Que\'Rubra', text: 'The goblin queen desecrates Nitriti\'s temple. She means to bind the spirit Smaldge -- a thing of hunger and shadow. She does not understand what she summons.' },
      { speaker: 'Que\'Rubra', text: 'The temple demands three offerings: the Crown of Authority, the Cape of Presence, the Scepter of Command. Place them on the statue in the antechamber.' },
      { speaker: 'Que\'Rubra', text: 'I cannot help you further. The old agreements bind me to this grove. But I can tell you this: Bargnot is afraid. That makes her dangerous.' }
    ],

    // -----------------------------------------------------------------
    // Temple of Nitriti
    // -----------------------------------------------------------------

    temple_inscription: [
      { speaker: 'Inscription', text: 'Temple of Nitriti, Spirit of Night. She who guards the veil between worlds.' },
      { speaker: 'Inscription', text: 'Three offerings open the inner path.' }
    ],

    statue_incomplete: [
      { speaker: 'Statue', text: 'The statue watches with hollow eyes. Three empty slots carved into the pedestal: crown, cape, scepter.' },
      { speaker: 'Statue', text: 'You can feel the stone humming. It is waiting for something.' }
    ],

    statue_complete: [
      { speaker: 'Statue', text: 'The final relic clicks into place. The statue\'s eyes ignite with violet fire.' },
      { speaker: 'Statue', text: 'A sound like thunder rolls through the temple. The way forward tears itself open.' }
    ],

    puzzle_crown: [
      { speaker: '', text: 'You found the Shadow Crown!' }
    ],

    puzzle_cape: [
      { speaker: '', text: 'You found the Shadow Cape!' }
    ],

    puzzle_scepter: [
      { speaker: '', text: 'You found the Shadow Scepter!' }
    ],

    // -----------------------------------------------------------------
    // Boss Fight
    // -----------------------------------------------------------------

    boss_intro: [
      { speaker: 'Bargnot', text: 'Ah. Helena\'s little rescue party. How... predictable.' },
      { speaker: 'Bargnot', text: 'Do you know why I took this temple? Why I need the dwarf?' },
      { speaker: 'Bargnot', text: 'My people are dying. The mountain clans push us out. Your towns burn our warrens. And Smaldge -- Smaldge promised us a place in the world.' },
      { speaker: 'Bargnot', text: 'So yes, the dwarf bleeds tonight. And yes, the Shadow rises. Because YOU left us no other choice.' },
      { speaker: 'Bargnot', text: 'Enough talk. DEFEND YOURSELVES!' }
    ],

    boss_phase2: [
      { speaker: 'Bargnot', text: 'You\'re stronger than I expected. Good. I was getting bored.' },
      { speaker: 'Bargnot', text: 'But strength won\'t save you. SMALDGE! GIVE ME WHAT YOU PROMISED!' }
    ],

    boss_phase3: [
      { speaker: 'Bargnot', text: 'I can feel it... oh gods, I can feel it... this is too much... NO. I WILL NOT STOP.' },
      { speaker: 'Bargnot', text: 'THE SHADOW IS MINE TO COMMAND! MINE!' }
    ],

    boss_defeat: [
      { speaker: 'Bargnot', text: 'The shadow... it\'s pulling me apart... I only wanted... my people to be safe...' },
      { speaker: 'Bargnot', text: 'Was I wrong...?' }
    ],

    // -----------------------------------------------------------------
    // Victory / Ending
    // -----------------------------------------------------------------

    victory_rorik: [
      { speaker: 'Rorik', text: 'You... you saved me! I thought I was done for.' },
      { speaker: 'Rorik', text: 'Thank the forge-spirits you came when you did.' }
    ],

    ending_nitriti: [
      { speaker: 'Nitriti', text: 'You came. After so long in the dark... you came.', scene: 'nitriti' },
      { speaker: 'Nitriti', text: 'I am Nitriti. I was the silence between stars, once. Before Bargnot broke what she could not understand.', scene: 'nitriti' },
      { speaker: 'Nitriti', text: 'She was not evil. Only desperate. Remember that, when you tell this story.', scene: 'darkness' },
      { speaker: 'Nitriti', text: 'But the Bonemoon rises. Smaldge was only a whisper of the true darkness gathering beyond the veil.', scene: 'darkness' },
      { speaker: 'Nitriti', text: 'Seek the Eldspyre -- the source of all magic. You will need its light before the end.', scene: 'eldspyre' }
    ],

    ending_final: [
      { speaker: '', text: 'Ebon Vale breathes again. The tavern lights burn late. For one night, no one is afraid.', scene: 'vale_peace' },
      { speaker: '', text: 'But beyond the mountains, the Bonemoon swells. An infinite sea of darkness that swallows even starlight.', scene: 'bonemoon' },
      { speaker: '', text: 'Three travelers stand at the edge of what comes next. They are tired. They are wounded. They are not done.', scene: 'heroes_path' },
      { speaker: '', text: 'VALISAR: SHADOWS OF THE ELDSPYRE. Thank you for playing.', scene: 'title_card' }
    ],

    // -----------------------------------------------------------------
    // Item Pickup Dialogues
    // -----------------------------------------------------------------

    pickup_eldertech: [
      { speaker: '', text: 'You found an Eldertech Sphere! An ancient artifact of mysterious power.' }
    ],

    pickup_potion: [
      { speaker: '', text: 'You found a healing potion! Your health has been restored.' }
    ],

    pickup_silencestone: [
      { speaker: '', text: 'You found the Silence Stone! A black opal of incredible power. Nitriti\'s blessing flows through it.' }
    ],

    // -----------------------------------------------------------------
    // Sign interactions
    // -----------------------------------------------------------------

    sign_market: [
      { speaker: 'Sign', text: 'EBON VALE MARKET -- Braxon\'s Forge. Chapel of the Wandering Spirit.' },
      { speaker: 'Sign', text: '"All are welcome at The Dancing Pig (children must be accompanied by an adult)."' }
    ],

    sign_square: [
      { speaker: 'Sign', text: 'EBON VALE TOWN SQUARE -- Founded in the Age of Starfall by the Valisar settlers.' },
      { speaker: 'Sign', text: 'The paint is faded. Someone has nailed a fresh notice: "STAY INDOORS AFTER DARK."' }
    ],

    sign_temple: [
      { speaker: 'Inscription', text: 'The stone is ancient. Most of the carving has been clawed away.' },
      { speaker: 'Inscription', text: 'You can make out: "...Nitriti, She Who Guards... between worlds... speak only... truth..."' }
    ],

    // -----------------------------------------------------------------
    // Statue interactions
    // -----------------------------------------------------------------

    statue_interaction: [
      { speaker: 'Statue', text: 'A weathered stone statue. The face has been defaced by goblin claws. It once depicted Nitriti.' }
    ],

    // -----------------------------------------------------------------
    // Return-visit dialogues (shown after first interaction)
    // -----------------------------------------------------------------

    fawks_return: [
      { speaker: 'Fawks', text: 'Back already? You look like you need a drink more than I do.' },
      { speaker: 'Fawks', text: 'Helena\'s putting on a brave face but I can tell -- she hasn\'t slept in days.' }
    ],

    helena_return: [
      { speaker: 'Helena', text: 'Still standing. That\'s more than I expected. ...That came out wrong. I believe in you. I do.' }
    ],

    elira_return: [
      { speaker: 'Elira', text: 'My scouts report archers deeper in the forest. They shoot first, miss often, but often isn\'t always.' }
    ],

    braxon_return: [
      { speaker: 'Braxon', text: 'Still here? Good. I worry less when you\'re within shouting distance.' }
    ],

    soren_return: [
      { speaker: 'Soren', text: 'You\'ve returned. The spirits told me you would. ...Actually I just heard the door. Sit. Rest. Let me tend your wounds.' }
    ],

    svana_return: [
      { speaker: 'Svana', text: 'No news? ...No. Don\'t answer that. Just keep going. He\'s alive. I know he is.' }
    ],

    querubra_return: [
      { speaker: 'Que\'Rubra', text: 'The forest knows your progress. Hurry. I can feel Nitriti\'s temple crying out.' },
      { speaker: 'Que\'Rubra', text: 'The walls themselves remember what they were.' }
    ],

    // -----------------------------------------------------------------
    // Post-Boss Victory Dialogues
    // -----------------------------------------------------------------

    fawks_victory: [
      { speaker: 'Fawks', text: 'Drinks are on the house tonight!' },
      { speaker: 'Fawks', text: '...Don\'t tell Helena I said that.' }
    ],

    helena_victory: [
      { speaker: 'Helena', text: 'You did it. You actually did it.' },
      { speaker: 'Helena', text: 'I\'m going to sleep for the first time in a month. Thank you. From all of us.' }
    ],

    elira_victory: [
      { speaker: 'Elira', text: 'Heard you took down the goblin queen.' },
      { speaker: 'Elira', text: '...Okay. Maybe I trust chosen ones a little.' }
    ],

    svana_victory: [
      { speaker: 'Svana', text: 'RORIK! You absolute fool, I thought you were --' },
      { speaker: 'Svana', text: 'Don\'t you EVER -- ...come here.' }
    ],

    braxon_victory: [
      { speaker: 'Braxon', text: 'You came back. All of you came back.' },
      { speaker: 'Braxon', text: 'That\'s all that matters to an old smith.' }
    ],

    soren_victory: [
      { speaker: 'Soren', text: 'The spirits are quiet again. For the first time in weeks, my whiskers have stopped twitching.' },
      { speaker: 'Soren', text: 'You have done a great thing. Rest now. You have earned it.' }
    ],

    // -----------------------------------------------------------------
    // Midgame Dialogues (after visiting forest)
    // -----------------------------------------------------------------

    fawks_midgame: [
      { speaker: 'Fawks', text: 'You\'ve been to the forest? I can see it in your eyes. Drink this -- on the house.' },
      { speaker: 'Fawks', text: 'People are saying maybe there\'s hope after all. Don\'t let us down, okay?' }
    ],

    helena_midgame: [
      { speaker: 'Helena', text: 'You\'ve seen the forest. You know what we\'re up against now.' },
      { speaker: 'Helena', text: 'Elira says the temple is worse. Much worse. Be careful in there.' }
    ],

    elira_midgame: [
      { speaker: 'Elira', text: 'My scouts tracked your path through the forest. Not bad. You might actually survive the temple.' },
      { speaker: 'Elira', text: 'Bargnot\'s strongest are in there. Spinecleavers. Big, armored, mean. Hit them from behind.' }
    ],

    // -----------------------------------------------------------------
    // Dynamic Que'Rubra Progress Dialogue
    // -----------------------------------------------------------------

    querubra_progress: [
      { speaker: 'Que\'Rubra', text: 'The forest knows your progress. You have collected [X] of the three relics.' },
      { speaker: 'Que\'Rubra', text: 'Hurry. I can feel Nitriti\'s temple crying out. The walls themselves remember what they were.' }
    ]
  };

  window.DialogueData = DialogueData;

  // =======================================================================
  // DIALOGUE RENDERING CONSTANTS
  // =======================================================================

  /** Dialogue box dimensions and positioning */
  var BOX_X = 0;
  var BOX_Y = 160;       // bottom portion of the 224px screen
  var BOX_W = 256;        // full width of the internal buffer
  var BOX_H = 60;         // tall enough for speaker name + 2 text rows
  var BOX_PAD = 8;        // inner padding from box edges
  var BORDER_COLOR = '#6a6a7a';    // lighter border (matches C.gray)
  var BOX_BG = 'rgba(10, 10, 20, 0.88)';

  /** Text positioning inside the box */
  var NAME_X = BOX_X + BOX_PAD;
  var NAME_Y = BOX_Y + 6;
  var TEXT_X = BOX_X + BOX_PAD;
  var TEXT_Y = BOX_Y + 20;

  /** Speaker-name color palette */
  var SPEAKER_COLORS = {
    'Fawks':       '#e8b830',  // gold
    'Helena':      '#5ac55a',  // light green
    'Elira':       '#5a8ada',  // light blue
    'Braxon':      '#b07a3a',  // light brown
    'Soren':       '#aa6ada',  // light purple
    'Rorik':       '#e06060',  // light red
    'Svana':       '#d0a060',  // warm amber
    'Que\'Rubra':  '#5ac55a',  // light green
    'Bargnot':     '#c03030',  // red
    'Nitriti':     '#8ab8f0',  // pale blue
    'Sign':        '#b0b0c0',  // light gray
    'Inscription': '#b0b0c0',  // light gray
    'Statue':      '#8a8a9a',  // light stone
    'System':      '#e8d830'   // yellow
  };

  var DEFAULT_SPEAKER_COLOR = '#e8b830'; // gold fallback

  /** Blinking indicator glyph and rate */
  var INDICATOR_BLINK_RATE = 30;  // frames per half-cycle

  // =======================================================================
  // DIALOGUE SYSTEM  (window.Dialogue)
  // =======================================================================

  /** Max visible text rows in the dialogue box */
  var MAX_VISIBLE_ROWS = 2;

  /** Row height in pixels */
  var ROW_HEIGHT = 10;

  /** Narrator color for empty-speaker lines */
  var NARRATOR_COLOR = '#c8c8d8';

  /** Set of dialogue IDs the player has fully read */
  var _seenDialogues = {};

  window.Dialogue = {
    active: false,
    lines: [],
    currentLine: 0,
    displayedChars: 0,
    charTimer: 0,
    CHAR_SPEED: 2,
    _blinkTimer: 0,
    _slideProgress: 0,
    _onComplete: null,
    _dialogueId: null,

    /** Pre-computed wrapped rows for the current line's full text */
    _fullRows: [],

    /** Which page of rows we're currently showing (for long text) */
    _rowPage: 0,

    // ------------------------------------------------------------------
    // start(dialogueId, onComplete, inlineText)
    // ------------------------------------------------------------------

    start: function (dialogueId, onComplete, inlineText) {
      var data;
      if (inlineText) {
        data = [{ speaker: 'Sign', text: inlineText }];
        this._dialogueId = null;
      } else {
        data = DialogueData[dialogueId];
        if (!data || data.length === 0) {
          console.warn('Dialogue not found: ' + dialogueId);
          return;
        }
        this._dialogueId = dialogueId;

        // If we've seen this dialogue before, allow instant skip
        if (_seenDialogues[dialogueId]) {
          this._canSkip = true;
        } else {
          this._canSkip = false;
        }
      }

      this.lines = data;
      this.currentLine = 0;
      this.displayedChars = 0;
      this.charTimer = 0;
      this._blinkTimer = 0;
      this._slideProgress = 0;
      this._rowPage = 0;
      this._onComplete = onComplete || null;
      this.active = true;
      this._computeRows();
    },

    // ------------------------------------------------------------------
    // _computeRows() - pre-wrap the current line's full text
    // ------------------------------------------------------------------

    _computeRows: function () {
      var line = this.lines[this.currentLine];
      if (!line) { this._fullRows = []; return; }

      var hasPortrait = line.speaker && line.speaker.length > 0;
      var maxChars = hasPortrait
        ? Math.floor((BOX_W - BOX_PAD * 2) / 6)
        : Math.floor((BOX_W - BOX_PAD * 2) / 6);
      this._fullRows = this._wordWrap(line.text, maxChars);
      this._rowPage = 0;
    },

    /** Total chars in the visible rows of the current page */
    _charsOnCurrentPage: function () {
      var startRow = this._rowPage * MAX_VISIBLE_ROWS;
      var endRow = Math.min(startRow + MAX_VISIBLE_ROWS, this._fullRows.length);
      var count = 0;
      for (var r = startRow; r < endRow; r++) {
        count += this._fullRows[r].length;
        if (r < endRow - 1) count++; // account for the space between rows
      }
      return count;
    },

    /** How many chars come before the current page */
    _charsBeforeCurrentPage: function () {
      var startRow = this._rowPage * MAX_VISIBLE_ROWS;
      var count = 0;
      for (var r = 0; r < startRow; r++) {
        count += this._fullRows[r].length;
        if (r < startRow - 1) count++;
      }
      return count;
    },

    _totalPages: function () {
      return Math.ceil(this._fullRows.length / MAX_VISIBLE_ROWS);
    },

    // ------------------------------------------------------------------
    // advance()
    // ------------------------------------------------------------------

    advance: function () {
      if (!this.active) return;

      var line = this.lines[this.currentLine];
      if (!line) { this.close(); return; }

      // Calculate how many chars total up to end of current page
      var pageStart = this._rowPage * MAX_VISIBLE_ROWS;
      var pageEnd = Math.min(pageStart + MAX_VISIBLE_ROWS, this._fullRows.length);
      var charsToEndOfPage = 0;
      for (var r = 0; r < pageEnd; r++) {
        charsToEndOfPage += this._fullRows[r].length;
        if (r < pageEnd - 1) charsToEndOfPage++;
      }

      // Still typing on current page -> reveal the rest of this page
      if (this.displayedChars < charsToEndOfPage) {
        this.displayedChars = charsToEndOfPage;
        return;
      }

      // Page fully visible -> check if more pages exist for this line
      if (this._rowPage < this._totalPages() - 1) {
        this._rowPage++;
        // Don't reset displayedChars - it tracks cumulative progress
        this._blinkTimer = 0;
        if (window.GameAudio) window.GameAudio.play('select');
        return;
      }

      // All pages done -> next line or close
      this.currentLine++;
      if (this.currentLine >= this.lines.length) {
        this.close();
      } else {
        this.displayedChars = 0;
        this.charTimer = 0;
        this._blinkTimer = 0;
        this._computeRows();
        if (window.GameAudio) window.GameAudio.play('select');
      }
    },

    // ------------------------------------------------------------------
    // skipAll() - skip entire dialogue (for seen dialogues)
    // ------------------------------------------------------------------

    skipAll: function () {
      if (!this.active) return;
      this.close();
    },

    // ------------------------------------------------------------------
    // update()
    // ------------------------------------------------------------------

    update: function () {
      if (!this.active) return;

      if (this._slideProgress < 1) {
        this._slideProgress = Math.min(1, this._slideProgress + 0.12);
      }

      var line = this.lines[this.currentLine];
      if (!line) return;

      // Fast-forward: holding Z doubles text speed
      var speed = this.CHAR_SPEED;
      if (window.Input && window.Input.keys && window.Input.keys['z']) {
        speed = 1;
      }

      // Typewriter reveal
      if (this.displayedChars < line.text.length) {
        this.charTimer++;
        if (this.charTimer >= speed) {
          this.charTimer = 0;
          this.displayedChars++;
          if (this.displayedChars % 2 === 0 && window.GameAudio) {
            window.GameAudio.play('dialogue');
          }
        }
      }

      this._blinkTimer++;
    },

    // ------------------------------------------------------------------
    // render(ctx)
    // ------------------------------------------------------------------

    render: function (ctx) {
      if (!this.active) return;

      var line = this.lines[this.currentLine];
      if (!line) return;

      var slideOffset = Math.floor((1 - this._slideProgress) * BOX_H);
      var hasPortrait = line.speaker && line.speaker.length > 0;

      // --- Semi-transparent background ---
      ctx.fillStyle = BOX_BG;
      ctx.fillRect(BOX_X, BOX_Y + slideOffset, BOX_W, BOX_H);

      // --- 1px border ---
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = 1;
      ctx.strokeRect(BOX_X + 0.5, BOX_Y + slideOffset + 0.5, BOX_W - 1, BOX_H - 1);

      var nameColor, textStartY;

      if (hasPortrait) {
        // --- Speaker portrait indicator ---
        nameColor = SPEAKER_COLORS[line.speaker] || DEFAULT_SPEAKER_COLOR;
        var portraitX = BOX_X + 4;
        var portraitY = BOX_Y + slideOffset + 4;
        var portraitSize = 14;

        ctx.fillStyle = nameColor;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = nameColor;
        ctx.strokeRect(portraitX + 0.5, portraitY + 0.5, portraitSize - 1, portraitSize - 1);

        var initial = line.speaker.charAt(0);
        window.Utils.drawText(ctx, initial, portraitX + 4, portraitY + 3, nameColor, 1);

        // --- Speaker name ---
        window.Utils.drawText(ctx, line.speaker, NAME_X + 16, NAME_Y + slideOffset, nameColor, 1);

        textStartY = TEXT_Y + slideOffset;
      } else {
        // Narrator mode: no portrait, center text vertically in box
        nameColor = NARRATOR_COLOR;
        textStartY = BOX_Y + slideOffset + 14;
      }

      // Line progress dots
      var totalLines = this.lines.length;
      if (totalLines > 1) {
        var dotBaseX = BOX_X + BOX_W - 8 - totalLines * 4;
        for (var d = 0; d < totalLines; d++) {
          ctx.fillStyle = (d <= this.currentLine) ? (hasPortrait ? nameColor : NARRATOR_COLOR) : '#333';
          ctx.fillRect(dotBaseX + d * 4, BOX_Y + slideOffset + 4, 2, 2);
        }
      }

      // --- Dialogue text (typewriter, 2 rows per page) ---
      var pageStart = this._rowPage * MAX_VISIBLE_ROWS;
      var pageEnd = Math.min(pageStart + MAX_VISIBLE_ROWS, this._fullRows.length);

      // Calculate chars consumed before current page
      var charsBefore = 0;
      for (var rb = 0; rb < pageStart; rb++) {
        charsBefore += this._fullRows[rb].length;
        if (rb < pageStart - 1) charsBefore++;
      }

      var charsLeft = Math.max(0, this.displayedChars - charsBefore);

      for (var r = pageStart; r < pageEnd; r++) {
        var rowText = this._fullRows[r];
        var visibleLen = Math.min(rowText.length, charsLeft);
        var visibleRow = rowText.substring(0, visibleLen);
        charsLeft = Math.max(0, charsLeft - rowText.length - 1);

        window.Utils.drawText(
          ctx,
          visibleRow,
          TEXT_X,
          textStartY + (r - pageStart) * ROW_HEIGHT,
          '#f0f0f0',
          1
        );
      }

      // Page indicator for multi-page lines
      if (this._totalPages() > 1) {
        var pageText = (this._rowPage + 1) + '/' + this._totalPages();
        window.Utils.drawText(ctx, pageText, BOX_X + BOX_W - 30, BOX_Y + slideOffset + BOX_H - 12, '#888', 1);
      }

      // --- Skip hint for seen dialogues ---
      if (this._canSkip) {
        window.Utils.drawText(ctx, '[X] SKIP', BOX_X + BOX_W - 50, BOX_Y + slideOffset + 4, '#888', 1);
      }

      // --- Blinking advance indicator ---
      var charsToEndOfPage = 0;
      for (var rp = 0; rp < pageEnd; rp++) {
        charsToEndOfPage += this._fullRows[rp].length;
        if (rp < pageEnd - 1) charsToEndOfPage++;
      }

      if (this.displayedChars >= charsToEndOfPage) {
        var show = (this._blinkTimer % (INDICATOR_BLINK_RATE * 2)) < INDICATOR_BLINK_RATE;
        if (show) {
          var indX = BOX_X + BOX_W - 16;
          var indY = BOX_Y + slideOffset + BOX_H - 12;
          ctx.fillStyle = '#f0f0f0';
          ctx.beginPath();
          ctx.moveTo(indX, indY);
          ctx.lineTo(indX + 6, indY);
          ctx.lineTo(indX + 3, indY + 4);
          ctx.closePath();
          ctx.fill();
        }
      }
    },

    // ------------------------------------------------------------------
    // isActive()
    // ------------------------------------------------------------------

    isActive: function () {
      return this.active;
    },

    // ------------------------------------------------------------------
    // close()
    // ------------------------------------------------------------------

    close: function () {
      // Mark this dialogue as seen
      if (this._dialogueId) {
        _seenDialogues[this._dialogueId] = true;
      }

      this.active = false;
      this.lines = [];
      this.currentLine = 0;
      this.displayedChars = 0;
      this.charTimer = 0;
      this._blinkTimer = 0;
      this._fullRows = [];
      this._rowPage = 0;
      this._dialogueId = null;
      this._canSkip = false;

      var cb = this._onComplete;
      this._onComplete = null;
      if (typeof cb === 'function') {
        cb();
      }
    },

    // ------------------------------------------------------------------
    // hasSeen(dialogueId)
    // ------------------------------------------------------------------

    hasSeen: function (dialogueId) {
      return !!_seenDialogues[dialogueId];
    },

    // ------------------------------------------------------------------
    // _wordWrap(text, maxChars)
    // ------------------------------------------------------------------

    _wordWrap: function (text, maxChars) {
      if (text.length <= maxChars) {
        return [text];
      }

      var words = text.split(' ');
      var rows = [];
      var current = '';

      for (var i = 0; i < words.length; i++) {
        var word = words[i];
        if (current.length === 0) {
          current = word;
        } else if (current.length + 1 + word.length <= maxChars) {
          current += ' ' + word;
        } else {
          rows.push(current);
          current = word;
        }
      }
      if (current.length > 0) {
        rows.push(current);
      }

      return rows;
    },

    /** Get the current line's scene property (for intro cutscene art) */
    getScene: function () {
      if (!this.active) return null;
      var line = this.lines[this.currentLine];
      return (line && line.scene) ? line.scene : null;
    }
  };

})();
