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
      { speaker: '', text: 'The realm of Valisar trembles... In the town of Ebon Vale, darkness gathers.', scene: 'town' },
      { speaker: '', text: 'Goblins raid from the Ebon Forest. Their queen, Bargnot, defiles an ancient temple.', scene: 'forest' },
      { speaker: '', text: 'She seeks to summon the spirit Smaldge... and usher in the Ascendant Shadow.', scene: 'temple' },
      { speaker: '', text: 'Three heroes answer the call. The fate of Valisar rests in their hands.', scene: 'heroes' }
    ],

    // -----------------------------------------------------------------
    // Town NPCs - Ebon Vale Square
    // -----------------------------------------------------------------

    fawks_greeting: [
      { speaker: 'Fawks', text: 'Welcome to The Dancing Pig! You look like adventurers.' },
      { speaker: 'Fawks', text: 'Goblins have been raiding from the north forest. Please, be careful out there.' }
    ],

    helena_greeting: [
      { speaker: 'Helena', text: 'Ah, you must be the ones Braxon mentioned. Our town is in danger.' },
      { speaker: 'Helena', text: 'Goblins from the Ebon Forest grow bolder each day. Their queen, Bargnot... she must be stopped.' },
      { speaker: 'Helena', text: 'Visit Braxon and Brother Soren in the market south of here before heading north to the forest.' }
    ],

    elira_greeting: [
      { speaker: 'Elira', text: 'I am Captain Voss of the town guard. We have captured some goblin scouts...' },
      { speaker: 'Elira', text: 'But their main force hides in the forest temple. I do not trust spirits, but I trust steel.' },
      { speaker: 'Elira', text: 'Give that goblin queen what she deserves.' }
    ],

    // -----------------------------------------------------------------
    // Town NPCs - Ebon Vale Market
    // -----------------------------------------------------------------

    braxon_greeting: [
      { speaker: 'Braxon', text: 'Well met, adventurer! I am Braxon, the town blacksmith.' },
      { speaker: 'Braxon', text: 'If my boy Daxon is with you, keep him safe.' },
      { speaker: 'Braxon', text: 'Goblin armor is weak at the joints. Bring me their teeth and I can forge you something useful.' }
    ],

    braxon_greeting_daxon: [
      { speaker: 'Braxon', text: 'Daxon! My boy! You have returned to us at last.' },
      { speaker: 'Daxon', text: 'Father! I heard the goblins have taken the temple. I came as fast as I could.' },
      { speaker: 'Braxon', text: 'Aye, and they have poor Rorik prisoner in there too. Be careful, son.' },
      { speaker: 'Braxon', text: 'Here - take what you need from the forge. I will not let you face those monsters unarmed.' }
    ],

    soren_greeting: [
      { speaker: 'Soren', text: 'Blessings of the spirits upon you. I tend to the dwarven refugees here.' },
      { speaker: 'Soren', text: 'They fled from the goblins in the mountains. The Temple of Nitriti was once sacred...' },
      { speaker: 'Soren', text: 'Now Bargnot defiles it with dark rituals. Return to me when you need healing.' }
    ],

    rorik_greeting: [
      { speaker: 'Rorik', text: 'Aye, name\'s Rorik Flamebeard. Lost me kin to those blasted goblins.' },
      { speaker: 'Rorik', text: 'If you\'re heading to that temple, watch for traps. Bargnot is cunning.' },
      { speaker: 'Rorik', text: 'May the forge-fire guide your blade.' }
    ],

    svana_greeting: [
      { speaker: 'Svana', text: 'I am Svana Ironveil. My kin Rorik was taken by the goblins to their temple...' },
      { speaker: 'Svana', text: 'Please, if you find him in there, bring him home safe. He is all I have left.' }
    ],

    rorik_rescue: [
      { speaker: 'Rorik', text: 'You... you saved me! That monster was going to sacrifice me to Smaldge!' },
      { speaker: 'Rorik', text: 'I owe you my life. Thank the forge-spirits you came when you did.' }
    ],

    // -----------------------------------------------------------------
    // Ebon Vale North
    // -----------------------------------------------------------------

    sign_warning: [
      { speaker: 'Sign', text: 'EBON FOREST - NORTH. WARNING: Goblin activity reported! Travel at your own risk.' }
    ],

    // -----------------------------------------------------------------
    // Ebon Forest
    // -----------------------------------------------------------------

    querubra_greeting: [
      { speaker: 'Que\'Rubra', text: '... I feel your footsteps, small ones. I am Que\'Rubra. This grove is my domain.' },
      { speaker: 'Que\'Rubra', text: 'The goblin queen defiles Nitriti\'s temple. She seeks to bind the spirit Smaldge and sacrifice the captured dwarf.' },
      { speaker: 'Que\'Rubra', text: 'In the temple, find the three relics: Crown, Cape, and Scepter. Place them on the shadow statue.' },
      { speaker: 'Que\'Rubra', text: 'Only then will the inner sanctum open. Go now. May Nitriti watch over you.' }
    ],

    // -----------------------------------------------------------------
    // Temple of Nitriti
    // -----------------------------------------------------------------

    temple_inscription: [
      { speaker: 'Inscription', text: 'Temple of Nitriti, Spirit of Night. She who guards the veil between worlds.' },
      { speaker: 'Inscription', text: 'Three offerings open the inner path.' }
    ],

    statue_incomplete: [
      { speaker: 'Statue', text: 'A dark statue looms before you. It is missing something...' },
      { speaker: 'Statue', text: 'Three empty holders: crown, cape, scepter.' }
    ],

    statue_complete: [
      { speaker: 'Statue', text: 'You place the final relic. The statue\'s eyes glow with dark energy.' },
      { speaker: 'Statue', text: 'A rumbling sound echoes through the temple... The path forward is open!' }
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
      { speaker: 'Bargnot', text: 'WHO DARES ENTER MY DOMAIN?! You are too late, little heroes.' },
      { speaker: 'Bargnot', text: 'The dwarf\'s blood will feed Smaldge! And the Ascendant Shadow shall rise!' },
      { speaker: 'Bargnot', text: 'COME THEN! FACE YOUR QUEEN!' }
    ],

    boss_phase2: [
      { speaker: 'Bargnot', text: 'ENOUGH! You think you can defeat ME?!' },
      { speaker: 'Bargnot', text: 'I am Queen Bargnot the Undying! FEEL MY WRATH!' }
    ],

    boss_phase3: [
      { speaker: 'Bargnot', text: 'No... NO! SMALDGE, GIVE ME POWER!' },
      { speaker: 'Bargnot', text: 'YESSS... I feel the shadow flowing! NOW YOU WILL PERISH!' }
    ],

    boss_defeat: [
      { speaker: 'Bargnot', text: 'Im... impossible... The shadow... promised me... This... is not... the end...' }
    ],

    // -----------------------------------------------------------------
    // Victory / Ending
    // -----------------------------------------------------------------

    victory_rorik: [
      { speaker: 'Rorik', text: 'You... you saved me! I thought I was done for.' },
      { speaker: 'Rorik', text: 'Thank the forge-spirits you came when you did.' }
    ],

    ending_nitriti: [
      { speaker: 'Nitriti', text: 'Heroes of Ebon Vale... I am Nitriti, Spirit of Night. You have cleansed my temple.', scene: 'nitriti' },
      { speaker: 'Nitriti', text: 'But dark forces still stir. The Bonemoon prophecy approaches. Eternal darkness threatens Valisar.', scene: 'darkness' },
      { speaker: 'Nitriti', text: 'Seek the Eldspyre, the source of all magic. Your journey has only just begun.', scene: 'eldspyre' }
    ],

    ending_final: [
      { speaker: '', text: 'With Queen Bargnot defeated, peace returns to Ebon Vale... But the Bonemoon prophecy looms.', scene: 'vale_peace' },
      { speaker: '', text: 'An infinite sea of darkness awaits. Never again shall Valisar see the stars...', scene: 'bonemoon' },
      { speaker: '', text: 'The heroes must grow stronger. For the true darkness has yet to come.', scene: 'heroes_path' },
      { speaker: '', text: 'VALISAR: SHADOWS OF THE ELDSPYRE. Thank you for playing!', scene: 'title_card' }
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
      { speaker: 'Sign', text: 'EBON VALE MARKET - Trade goods and supplies. "All are welcome at The Dancing Pig!"' }
    ],

    sign_square: [
      { speaker: 'Sign', text: 'EBON VALE TOWN SQUARE - Founded in the Age of Starfall by the Valisar settlers.' }
    ],

    sign_temple: [
      { speaker: 'Inscription', text: 'Here lies the Temple of Nitriti, Spirit of Silence. Let those who enter speak only truth.' }
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
      { speaker: 'Fawks', text: 'Back again? Need a drink? The goblins raided our storehouse last week.' },
      { speaker: 'Fawks', text: 'Collect their teeth for Braxon. He buys them.' }
    ],

    helena_return: [
      { speaker: 'Helena', text: 'Any progress against the goblins? Visit Brother Soren if you need healing.' }
    ],

    elira_return: [
      { speaker: 'Elira', text: 'Still standing? Good. My scouts report archers in the deeper forest. Watch for their arrows.' }
    ],

    braxon_return: [
      { speaker: 'Braxon', text: 'Got goblin teeth? I can forge useful things from their remains. Bring me teeth and I will trade.' }
    ],

    soren_return: [
      { speaker: 'Soren', text: 'Rest here, child. I sense your weariness. Let me restore your strength once more.' }
    ],

    svana_return: [
      { speaker: 'Svana', text: 'Have you found Rorik? Please hurry... I heard terrible sounds from the temple.' }
    ],

    querubra_return: [
      { speaker: 'Que\'Rubra', text: 'The forest trembles... Bargnot\'s power grows. Have you collected the three relics yet?' },
      { speaker: 'Que\'Rubra', text: 'Crown, Cape, Scepter... Place them on the statue.' }
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
