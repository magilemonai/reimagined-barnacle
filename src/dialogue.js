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
      { speaker: 'System', text: 'The realm of Valisar trembles...' },
      { speaker: 'System', text: 'In the town of Ebon Vale,' },
      { speaker: 'System', text: 'darkness gathers.' },
      { speaker: 'System', text: 'Goblins raid from the Ebon Forest.' },
      { speaker: 'System', text: 'Their queen, Bargnot, defiles' },
      { speaker: 'System', text: 'an ancient temple.' },
      { speaker: 'System', text: 'She seeks to summon the spirit' },
      { speaker: 'System', text: 'Smaldge...' },
      { speaker: 'System', text: '...and usher in the Ascendant' },
      { speaker: 'System', text: 'Shadow.' },
      { speaker: 'System', text: 'Three heroes answer the call.' },
      { speaker: 'System', text: 'The fate of Valisar rests in' },
      { speaker: 'System', text: 'their hands.' }
    ],

    // -----------------------------------------------------------------
    // Town NPCs - Ebon Vale Square
    // -----------------------------------------------------------------

    fawks_greeting: [
      { speaker: 'Fawks', text: 'Welcome to The Dancing Pig!' },
      { speaker: 'Fawks', text: 'You look like adventurers.' },
      { speaker: 'Fawks', text: 'Goblins have been raiding' },
      { speaker: 'Fawks', text: 'from the north forest.' },
      { speaker: 'Fawks', text: 'Please, be careful out there.' }
    ],

    helena_greeting: [
      { speaker: 'Helena', text: 'Ah, you must be the ones' },
      { speaker: 'Helena', text: 'Braxon mentioned.' },
      { speaker: 'Helena', text: 'Our town is in danger.' },
      { speaker: 'Helena', text: 'Goblins from the Ebon Forest' },
      { speaker: 'Helena', text: 'grow bolder each day.' },
      { speaker: 'Helena', text: 'Their queen... Bargnot...' },
      { speaker: 'Helena', text: 'she must be stopped.' },
      { speaker: 'Helena', text: 'Find her lair in the old' },
      { speaker: 'Helena', text: 'Temple of Nitriti.' }
    ],

    elira_greeting: [
      { speaker: 'Elira', text: 'I am Captain Voss of the' },
      { speaker: 'Elira', text: 'town guard.' },
      { speaker: 'Elira', text: 'We have captured some goblin' },
      { speaker: 'Elira', text: 'scouts...' },
      { speaker: 'Elira', text: 'But their main force hides' },
      { speaker: 'Elira', text: 'in the forest temple.' },
      { speaker: 'Elira', text: 'I do not trust spirits,' },
      { speaker: 'Elira', text: 'but I trust steel.' },
      { speaker: 'Elira', text: 'Give that goblin queen' },
      { speaker: 'Elira', text: 'what she deserves.' }
    ],

    // -----------------------------------------------------------------
    // Town NPCs - Ebon Vale Market
    // -----------------------------------------------------------------

    braxon_greeting: [
      { speaker: 'Braxon', text: 'Well met, adventurer!' },
      { speaker: 'Braxon', text: 'I am Braxon, the town' },
      { speaker: 'Braxon', text: 'blacksmith.' },
      { speaker: 'Braxon', text: 'If my boy Daxon is with you,' },
      { speaker: 'Braxon', text: 'keep him safe.' },
      { speaker: 'Braxon', text: 'Take this advice - goblin' },
      { speaker: 'Braxon', text: 'armor is weak at the joints.' }
    ],

    soren_greeting: [
      { speaker: 'Soren', text: 'Blessings of the spirits' },
      { speaker: 'Soren', text: 'upon you.' },
      { speaker: 'Soren', text: 'I tend to the dwarven' },
      { speaker: 'Soren', text: 'refugees here.' },
      { speaker: 'Soren', text: 'They fled from the goblins' },
      { speaker: 'Soren', text: 'in the mountains.' },
      { speaker: 'Soren', text: 'The Temple of Nitriti' },
      { speaker: 'Soren', text: 'was once sacred...' },
      { speaker: 'Soren', text: 'Now Bargnot defiles it' },
      { speaker: 'Soren', text: 'with dark rituals.' }
    ],

    rorik_greeting: [
      { speaker: 'Rorik', text: 'Aye, name\'s Rorik Flamebeard.' },
      { speaker: 'Rorik', text: 'Lost me kin to those' },
      { speaker: 'Rorik', text: 'blasted goblins.' },
      { speaker: 'Rorik', text: 'If you\'re heading to that' },
      { speaker: 'Rorik', text: 'temple...' },
      { speaker: 'Rorik', text: 'Watch for traps.' },
      { speaker: 'Rorik', text: 'Bargnot is cunning.' },
      { speaker: 'Rorik', text: 'May the forge-fire guide' },
      { speaker: 'Rorik', text: 'your blade.' }
    ],

    rorik_market_greeting: [
      { speaker: 'Rorik', text: 'Aye, name\'s Rorik Flamebeard.' },
      { speaker: 'Rorik', text: 'I\'ve set up shop here in' },
      { speaker: 'Rorik', text: 'the market.' },
      { speaker: 'Rorik', text: 'Those goblins took everything' },
      { speaker: 'Rorik', text: 'from my people...' },
      { speaker: 'Rorik', text: 'If you can stop Bargnot,' },
      { speaker: 'Rorik', text: 'you\'ll have my eternal' },
      { speaker: 'Rorik', text: 'gratitude.' }
    ],

    rorik_rescue: [
      { speaker: 'Rorik', text: 'You... you saved me!' },
      { speaker: 'Rorik', text: 'That monster was going to' },
      { speaker: 'Rorik', text: 'sacrifice me to Smaldge!' },
      { speaker: 'Rorik', text: 'I owe you my life.' },
      { speaker: 'Rorik', text: 'Thank the forge-spirits' },
      { speaker: 'Rorik', text: 'you came when you did.' }
    ],

    // -----------------------------------------------------------------
    // Ebon Vale North
    // -----------------------------------------------------------------

    sign_warning: [
      { speaker: 'Sign', text: 'EBON FOREST - NORTH' },
      { speaker: 'Sign', text: 'WARNING: Goblin activity' },
      { speaker: 'Sign', text: 'reported!' },
      { speaker: 'Sign', text: 'Travel at your own risk.' }
    ],

    // -----------------------------------------------------------------
    // Ebon Forest
    // -----------------------------------------------------------------

    querubra_greeting: [
      { speaker: 'Que\'Rubra', text: '...' },
      { speaker: 'Que\'Rubra', text: 'I feel your footsteps,' },
      { speaker: 'Que\'Rubra', text: 'small ones.' },
      { speaker: 'Que\'Rubra', text: 'I am Que\'Rubra.' },
      { speaker: 'Que\'Rubra', text: 'This grove is my domain.' },
      { speaker: 'Que\'Rubra', text: 'The goblin queen defiles' },
      { speaker: 'Que\'Rubra', text: 'Nitriti\'s temple.' },
      { speaker: 'Que\'Rubra', text: 'She seeks to bind the spirit' },
      { speaker: 'Que\'Rubra', text: 'Smaldge...' },
      { speaker: 'Que\'Rubra', text: '...and sacrifice the captured' },
      { speaker: 'Que\'Rubra', text: 'dwarf.' },
      { speaker: 'Que\'Rubra', text: 'You must stop her ritual.' },
      { speaker: 'Que\'Rubra', text: 'In the temple, find the' },
      { speaker: 'Que\'Rubra', text: 'three relics.' },
      { speaker: 'Que\'Rubra', text: 'Crown, Cape, and Scepter...' },
      { speaker: 'Que\'Rubra', text: 'Place them on the shadow' },
      { speaker: 'Que\'Rubra', text: 'statue.' },
      { speaker: 'Que\'Rubra', text: 'Only then will the inner' },
      { speaker: 'Que\'Rubra', text: 'sanctum open.' },
      { speaker: 'Que\'Rubra', text: 'Go now. May Nitriti watch' },
      { speaker: 'Que\'Rubra', text: 'over you.' }
    ],

    // -----------------------------------------------------------------
    // Temple of Nitriti
    // -----------------------------------------------------------------

    temple_inscription: [
      { speaker: 'Inscription', text: 'Temple of Nitriti,' },
      { speaker: 'Inscription', text: 'Spirit of Night.' },
      { speaker: 'Inscription', text: 'She who guards the veil' },
      { speaker: 'Inscription', text: 'between worlds.' },
      { speaker: 'Inscription', text: 'Three offerings open' },
      { speaker: 'Inscription', text: 'the inner path.' }
    ],

    statue_incomplete: [
      { speaker: 'Statue', text: 'A dark statue looms' },
      { speaker: 'Statue', text: 'before you.' },
      { speaker: 'Statue', text: 'It is missing something...' },
      { speaker: 'Statue', text: 'Three empty holders:' },
      { speaker: 'Statue', text: 'crown, cape, scepter.' }
    ],

    statue_complete: [
      { speaker: 'Statue', text: 'You place the final relic.' },
      { speaker: 'Statue', text: 'The statue\'s eyes glow' },
      { speaker: 'Statue', text: 'with dark energy.' },
      { speaker: 'Statue', text: 'A rumbling sound echoes' },
      { speaker: 'Statue', text: 'through the temple...' },
      { speaker: 'Statue', text: 'The path forward is open!' }
    ],

    puzzle_crown: [
      { speaker: 'System', text: 'You found the Shadow Crown!' }
    ],

    puzzle_cape: [
      { speaker: 'System', text: 'You found the Shadow Cape!' }
    ],

    puzzle_scepter: [
      { speaker: 'System', text: 'You found the Shadow Scepter!' }
    ],

    // -----------------------------------------------------------------
    // Boss Fight
    // -----------------------------------------------------------------

    boss_intro: [
      { speaker: 'Bargnot', text: 'WHO DARES ENTER MY DOMAIN?!' },
      { speaker: 'Bargnot', text: 'You are too late,' },
      { speaker: 'Bargnot', text: 'little heroes.' },
      { speaker: 'Bargnot', text: 'The dwarf\'s blood will' },
      { speaker: 'Bargnot', text: 'feed Smaldge!' },
      { speaker: 'Bargnot', text: 'And the Ascendant Shadow' },
      { speaker: 'Bargnot', text: 'shall rise!' },
      { speaker: 'Bargnot', text: 'COME THEN!' },
      { speaker: 'Bargnot', text: 'FACE YOUR QUEEN!' }
    ],

    boss_phase2: [
      { speaker: 'Bargnot', text: 'ENOUGH!' },
      { speaker: 'Bargnot', text: 'You think you can defeat' },
      { speaker: 'Bargnot', text: 'ME?!' },
      { speaker: 'Bargnot', text: 'I am Queen Bargnot' },
      { speaker: 'Bargnot', text: 'the Undying!' },
      { speaker: 'Bargnot', text: 'FEEL MY WRATH!' }
    ],

    boss_phase3: [
      { speaker: 'Bargnot', text: 'No... NO!' },
      { speaker: 'Bargnot', text: 'SMALDGE, GIVE ME POWER!' },
      { speaker: 'Bargnot', text: 'YESSS...' },
      { speaker: 'Bargnot', text: 'I feel the shadow flowing!' },
      { speaker: 'Bargnot', text: 'NOW YOU WILL PERISH!' }
    ],

    boss_defeat: [
      { speaker: 'Bargnot', text: 'Im... impossible...' },
      { speaker: 'Bargnot', text: 'The shadow... promised me...' },
      { speaker: 'Bargnot', text: 'This... is not... the end...' }
    ],

    // -----------------------------------------------------------------
    // Victory / Ending
    // -----------------------------------------------------------------

    victory_rorik: [
      { speaker: 'Rorik', text: 'You... you saved me!' },
      { speaker: 'Rorik', text: 'I thought I was done for.' },
      { speaker: 'Rorik', text: 'That goblin queen was' },
      { speaker: 'Rorik', text: 'going to...' },
      { speaker: 'Rorik', text: 'Thank the forge-spirits' },
      { speaker: 'Rorik', text: 'you came.' }
    ],

    ending_nitriti: [
      { speaker: 'Nitriti', text: 'Heroes of Ebon Vale...' },
      { speaker: 'Nitriti', text: 'I am Nitriti,' },
      { speaker: 'Nitriti', text: 'Spirit of Night.' },
      { speaker: 'Nitriti', text: 'You have cleansed my temple.' },
      { speaker: 'Nitriti', text: 'But dark forces still stir...' },
      { speaker: 'Nitriti', text: 'The Bonemoon prophecy' },
      { speaker: 'Nitriti', text: 'approaches.' },
      { speaker: 'Nitriti', text: 'Eternal darkness threatens' },
      { speaker: 'Nitriti', text: 'Valisar.' },
      { speaker: 'Nitriti', text: 'Seek the Eldspyre...' },
      { speaker: 'Nitriti', text: 'the source of all magic.' },
      { speaker: 'Nitriti', text: 'Your journey has only' },
      { speaker: 'Nitriti', text: 'just begun.' }
    ],

    ending_final: [
      { speaker: 'System', text: 'With Queen Bargnot defeated,' },
      { speaker: 'System', text: 'peace returns to Ebon Vale...' },
      { speaker: 'System', text: 'But the Bonemoon prophecy' },
      { speaker: 'System', text: 'looms.' },
      { speaker: 'System', text: 'An infinite sea of darkness' },
      { speaker: 'System', text: 'awaits...' },
      { speaker: 'System', text: 'Never again shall Valisar' },
      { speaker: 'System', text: 'see the stars...' },
      { speaker: 'System', text: 'Only the chilling white' },
      { speaker: 'System', text: 'of bone.' },
      { speaker: 'System', text: 'The heroes must grow stronger.' },
      { speaker: 'System', text: 'For the true darkness has' },
      { speaker: 'System', text: 'yet to come.' },
      { speaker: 'System', text: 'VALISAR: SHADOWS OF THE' },
      { speaker: 'System', text: 'ELDSPYRE' },
      { speaker: 'System', text: 'Thank you for playing!' },
      { speaker: 'System', text: 'Based on the Valisar' },
      { speaker: 'System', text: 'campaign world.' }
    ],

    // -----------------------------------------------------------------
    // Item Pickup Dialogues
    // -----------------------------------------------------------------

    pickup_eldertech: [
      { speaker: 'System', text: 'You found an Eldertech Sphere!' },
      { speaker: 'System', text: 'An ancient artifact of' },
      { speaker: 'System', text: 'mysterious power.' }
    ],

    pickup_potion: [
      { speaker: 'System', text: 'You found a healing potion!' },
      { speaker: 'System', text: 'Your health has been restored.' }
    ],

    pickup_silencestone: [
      { speaker: 'System', text: 'You found the Silence Stone!' },
      { speaker: 'System', text: 'A black opal of incredible' },
      { speaker: 'System', text: 'power.' },
      { speaker: 'System', text: 'Nitriti\'s blessing flows' },
      { speaker: 'System', text: 'through it.' }
    ],

    // -----------------------------------------------------------------
    // Return-visit dialogue variants (shorter, new info)
    // -----------------------------------------------------------------

    fawks_return: [
      { speaker: 'Fawks', text: 'Back so soon?' },
      { speaker: 'Fawks', text: 'Rest by the fire if you' },
      { speaker: 'Fawks', text: 'need to.' },
      { speaker: 'Fawks', text: 'The goblins grow restless.' }
    ],

    helena_return: [
      { speaker: 'Helena', text: 'Any progress?' },
      { speaker: 'Helena', text: 'I heard sounds from the' },
      { speaker: 'Helena', text: 'forest last night...' },
      { speaker: 'Helena', text: 'Please hurry.' }
    ],

    elira_return: [
      { speaker: 'Elira', text: 'Good, you still draw breath.' },
      { speaker: 'Elira', text: 'My scouts report the temple' },
      { speaker: 'Elira', text: 'grows darker.' },
      { speaker: 'Elira', text: 'Be on your guard.' }
    ],

    soren_return: [
      { speaker: 'Soren', text: 'The stars speak of a' },
      { speaker: 'Soren', text: 'coming storm.' },
      { speaker: 'Soren', text: 'Find the three sacred items' },
      { speaker: 'Soren', text: 'in the temple to unlock' },
      { speaker: 'Soren', text: 'the path to Bargnot.' }
    ],

    // -----------------------------------------------------------------
    // Sign interactions
    // -----------------------------------------------------------------

    sign_market: [
      { speaker: 'Sign', text: 'EBON VALE MARKET' },
      { speaker: 'Sign', text: 'Trade goods and supplies.' },
      { speaker: 'Sign', text: '"All are welcome at' },
      { speaker: 'Sign', text: 'The Dancing Pig!"' }
    ],

    sign_square: [
      { speaker: 'Sign', text: 'EBON VALE TOWN SQUARE' },
      { speaker: 'Sign', text: 'Founded in the Age of' },
      { speaker: 'Sign', text: 'Starfall by the Valisar' },
      { speaker: 'Sign', text: 'settlers.' }
    ],

    sign_temple: [
      { speaker: 'Inscription', text: 'Here lies the Temple of' },
      { speaker: 'Inscription', text: 'Nitriti, Spirit of Silence.' },
      { speaker: 'Inscription', text: 'Let those who enter' },
      { speaker: 'Inscription', text: 'speak only truth.' }
    ],

    // -----------------------------------------------------------------
    // Statue interactions
    // -----------------------------------------------------------------

    statue_interaction: [
      { speaker: 'Statue', text: 'A weathered stone statue.' },
      { speaker: 'Statue', text: 'The face has been defaced' },
      { speaker: 'Statue', text: 'by goblin claws.' },
      { speaker: 'Statue', text: 'It once depicted Nitriti.' }
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

  window.Dialogue = {
    /** Whether a dialogue sequence is currently being displayed */
    active: false,

    /** Array of {speaker, text} line objects for the current conversation */
    lines: [],

    /** Index of the currently displayed line in `lines` */
    currentLine: 0,

    /** Number of characters revealed so far (typewriter effect) */
    displayedChars: 0,

    /** Frame counter used to time the typewriter reveal */
    charTimer: 0,

    /** Frames between each character reveal */
    CHAR_SPEED: 2,

    /** Frame counter for the advance-indicator blink */
    _blinkTimer: 0,

    /** Slide-in animation progress (0 = hidden, 1 = fully visible) */
    _slideProgress: 0,

    /** Fast-forward: holding Z speeds up text reveal */
    _fastForward: false,

    /** Optional callback invoked when the dialogue sequence ends */
    _onComplete: null,

    // ------------------------------------------------------------------
    // start(dialogueId, onComplete)
    // ------------------------------------------------------------------

    /**
     * Begin a dialogue sequence.
     *
     * @param {string}   dialogueId  - Key into window.DialogueData.
     * @param {Function} [onComplete] - Optional callback fired when the
     *                                  player closes the final line.
     */
    start: function (dialogueId, onComplete) {
      var data = DialogueData[dialogueId];
      if (!data || data.length === 0) {
        console.warn('Dialogue not found: ' + dialogueId);
        return;
      }

      this.lines = data;
      this.currentLine = 0;
      this.displayedChars = 0;
      this.charTimer = 0;
      this._blinkTimer = 0;
      this._slideProgress = 0;
      this._onComplete = onComplete || null;
      this.active = true;
    },

    // ------------------------------------------------------------------
    // advance()
    // ------------------------------------------------------------------

    /**
     * Called when the player presses the confirm key (Z).
     *
     * - If the typewriter is still revealing text, instantly show the
     *   full line.
     * - If the full line is already visible, move to the next line
     *   (or close the dialogue if this was the last line).
     */
    advance: function () {
      if (!this.active) return;

      var line = this.lines[this.currentLine];
      if (!line) {
        this.close();
        return;
      }

      // Still typing -> reveal the rest instantly
      if (this.displayedChars < line.text.length) {
        this.displayedChars = line.text.length;
        return;
      }

      // Full text visible -> next line or close
      this.currentLine++;
      if (this.currentLine >= this.lines.length) {
        this.close();
      } else {
        this.displayedChars = 0;
        this.charTimer = 0;
        this._blinkTimer = 0;
        // Play a short blip for the new line
        if (window.GameAudio) {
          window.GameAudio.play('select');
        }
      }
    },

    // ------------------------------------------------------------------
    // update()
    // ------------------------------------------------------------------

    /**
     * Tick the typewriter effect forward by one frame.
     * Should be called once per game frame while dialogue is active.
     */
    update: function () {
      if (!this.active) return;

      // Slide-in animation
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

          // Play a tiny blip for each revealed character (throttled)
          if (this.displayedChars % 2 === 0 && window.GameAudio) {
            window.GameAudio.play('dialogue');
          }
        }
      }

      // Blink timer for the advance indicator
      this._blinkTimer++;
    },

    // ------------------------------------------------------------------
    // render(ctx)
    // ------------------------------------------------------------------

    /**
     * Draw the dialogue box onto the provided canvas context.
     *
     * @param {CanvasRenderingContext2D} ctx - The 256x224 buffer context.
     */
    render: function (ctx) {
      if (!this.active) return;

      var line = this.lines[this.currentLine];
      if (!line) return;

      // Slide-in: box slides up from bottom
      var slideOffset = Math.floor((1 - this._slideProgress) * BOX_H);

      // --- Semi-transparent background ---
      ctx.fillStyle = BOX_BG;
      ctx.fillRect(BOX_X, BOX_Y + slideOffset, BOX_W, BOX_H);

      // --- 1px border ---
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = 1;
      ctx.strokeRect(BOX_X + 0.5, BOX_Y + slideOffset + 0.5, BOX_W - 1, BOX_H - 1);

      // --- Speaker portrait indicator (colored square with initial) ---
      var nameColor = SPEAKER_COLORS[line.speaker] || DEFAULT_SPEAKER_COLOR;
      var portraitX = BOX_X + 4;
      var portraitY = BOX_Y + slideOffset + 4;
      var portraitSize = 14;

      // Portrait background
      ctx.fillStyle = nameColor;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = nameColor;
      ctx.strokeRect(portraitX + 0.5, portraitY + 0.5, portraitSize - 1, portraitSize - 1);

      // Speaker initial
      var initial = line.speaker.charAt(0);
      window.Utils.drawText(ctx, initial, portraitX + 4, portraitY + 3, nameColor, 1);

      // --- Speaker name (offset for portrait) ---
      window.Utils.drawText(ctx, line.speaker, NAME_X + 16, NAME_Y + slideOffset, nameColor, 1);

      // Line progress indicator (small dots)
      var totalLines = this.lines.length;
      if (totalLines > 1) {
        var dotBaseX = BOX_X + BOX_W - 8 - totalLines * 4;
        for (var d = 0; d < totalLines; d++) {
          ctx.fillStyle = (d <= this.currentLine) ? nameColor : '#333';
          ctx.fillRect(dotBaseX + d * 4, BOX_Y + slideOffset + 4, 2, 2);
        }
      }

      // --- Dialogue text (typewriter) ---
      var visibleText = line.text.substring(0, this.displayedChars);

      // Word-wrap into rows that fit BOX_W - 2*BOX_PAD (~40 chars)
      var maxChars = Math.floor((BOX_W - BOX_PAD * 2) / 6);
      var rows = this._wordWrap(visibleText, maxChars);

      for (var r = 0; r < rows.length; r++) {
        window.Utils.drawText(
          ctx,
          rows[r],
          TEXT_X,
          TEXT_Y + slideOffset + r * 10,
          '#f0f0f0',
          1
        );
      }

      // --- Blinking advance indicator ---
      if (this.displayedChars >= line.text.length) {
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

    /**
     * @returns {boolean} Whether dialogue is currently showing.
     */
    isActive: function () {
      return this.active;
    },

    // ------------------------------------------------------------------
    // close()
    // ------------------------------------------------------------------

    /**
     * Close the dialogue and reset state. Fires onComplete callback
     * if one was provided.
     */
    close: function () {
      this.active = false;
      this.lines = [];
      this.currentLine = 0;
      this.displayedChars = 0;
      this.charTimer = 0;
      this._blinkTimer = 0;

      var cb = this._onComplete;
      this._onComplete = null;
      if (typeof cb === 'function') {
        cb();
      }
    },

    // ------------------------------------------------------------------
    // _wordWrap(text, maxChars)
    // ------------------------------------------------------------------

    /**
     * Simple word-wrap helper. Breaks `text` into an array of strings,
     * each no longer than `maxChars` characters, splitting on spaces
     * when possible.
     *
     * @param {string} text
     * @param {number} maxChars
     * @returns {string[]}
     */
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
    }
  };

})();
