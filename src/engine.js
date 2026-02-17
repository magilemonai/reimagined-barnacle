/**
 * Valisar: Shadows of the Eldspyre
 * Core Engine
 *
 * SNES-style top-down action adventure engine.
 * Internal resolution: 256x224, scaled 3x to 768x672.
 */

(function () {
  'use strict';

  // =========================================================================
  // CONSTANTS
  // =========================================================================

  /** Tile size in pixels */
  window.TILE = 16;
  /** Number of tile columns on screen */
  window.COLS = 16;
  /** Number of tile rows on screen */
  window.ROWS = 14;
  /** Internal width */
  window.W = 256;
  /** Internal height */
  window.H = 224;

  var SCALE = 3;
  var DISPLAY_W = window.W * SCALE; // 768
  var DISPLAY_H = window.H * SCALE; // 672

  // =========================================================================
  // CANVAS SETUP
  // =========================================================================

  var displayCanvas = document.getElementById('game-canvas');
  displayCanvas.width = DISPLAY_W;
  displayCanvas.height = DISPLAY_H;
  displayCanvas.style.width = DISPLAY_W + 'px';
  displayCanvas.style.height = DISPLAY_H + 'px';

  var displayCtx = displayCanvas.getContext('2d');
  displayCtx.imageSmoothingEnabled = false;

  // Offscreen buffer at native SNES resolution
  var bufferCanvas = document.createElement('canvas');
  bufferCanvas.width = window.W;
  bufferCanvas.height = window.H;

  var bufferCtx = bufferCanvas.getContext('2d');
  bufferCtx.imageSmoothingEnabled = false;

  // Expose contexts globally
  window.buf = bufferCtx;
  window.display = displayCtx;

  // =========================================================================
  // COLOR PALETTE (window.C)
  // =========================================================================

  window.C = {
    // Grays
    black:     '#0f0f0f',
    darkGray:  '#3a3a4a',
    gray:      '#6a6a7a',
    lightGray: '#b0b0c0',
    white:     '#f0f0f0',

    // Greens
    darkGreen:  '#1a5c1a',
    green:      '#2d8b2d',
    lightGreen: '#5ac55a',
    paleGreen:  '#8ae88a',

    // Browns
    darkBrown:  '#4a2a0a',
    brown:      '#7a4a1a',
    lightBrown: '#b07a3a',
    tan:        '#d4a862',

    // Blues
    darkBlue:  '#1a1a5c',
    blue:      '#2a4aba',
    lightBlue: '#5a8ada',
    paleBlue:  '#8ab8f0',

    // Reds
    darkRed:  '#5c1a1a',
    red:      '#c03030',
    lightRed: '#e06060',
    pink:     '#f0a0a0',

    // Yellows
    darkYellow: '#8a7a00',
    yellow:     '#e8d830',
    gold:       '#e8b830',

    // Purples
    darkPurple:  '#3a1a5c',
    purple:      '#7a3aaa',
    lightPurple: '#aa6ada',

    // Skin tones
    skin:     '#e8b888',
    darkSkin: '#c89868',
    paleSkin: '#f0d0b0',

    // Stone
    darkStone:  '#3a3a4a',
    stone:      '#5a5a6a',
    lightStone: '#8a8a9a',

    // Teals
    teal:     '#2a9a8a',
    darkTeal: '#1a6a5a'
  };

  // =========================================================================
  // INPUT SYSTEM (window.Input)
  // =========================================================================

  /** Tracked game keys */
  var GAME_KEYS = [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'z', 'x', 'Enter', 'Escape', 'p'
  ];

  var gameKeySet = {};
  for (var i = 0; i < GAME_KEYS.length; i++) {
    gameKeySet[GAME_KEYS[i]] = true;
  }

  window.Input = {
    /** Currently held keys (true while held) */
    keys: {},
    /** Keys pressed this frame only (true for one frame) */
    pressed: {},

    /**
     * Called each frame after input has been processed.
     * Clears the pressed state so each press is only seen once.
     */
    update: function () {
      for (var key in this.pressed) {
        this.pressed[key] = false;
      }
    }
  };

  document.addEventListener('keydown', function (e) {
    if (gameKeySet[e.key]) {
      e.preventDefault();
      if (!window.Input.keys[e.key]) {
        window.Input.pressed[e.key] = true;
      }
      window.Input.keys[e.key] = true;
    }
  });

  document.addEventListener('keyup', function (e) {
    if (gameKeySet[e.key]) {
      e.preventDefault();
      window.Input.keys[e.key] = false;
    }
  });

  // =========================================================================
  // AUDIO SYSTEM (window.Audio)
  // =========================================================================

  var GameAudio = {
    ctx: null,
    masterVolume: 0.3,
    initialized: false,

    /**
     * Initialize the AudioContext.
     * Should be called on a user gesture (click/keypress) to satisfy
     * browser autoplay policies.
     */
    init: function () {
      if (this.initialized) return;
      try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.initialized = true;
      } catch (e) {
        console.warn('Web Audio API not available:', e);
      }
    },

    /**
     * Create a gain node connected to destination with the master volume.
     */
    _gain: function (volume) {
      var gain = this.ctx.createGain();
      gain.gain.value = (volume !== undefined ? volume : 1.0) * this.masterVolume;
      gain.connect(this.ctx.destination);
      return gain;
    },

    /**
     * Create a simple oscillator.
     */
    _osc: function (type, freq, gain, startTime, endTime) {
      var osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(startTime);
      osc.stop(endTime);
      return osc;
    },

    /**
     * Create a noise buffer source.
     */
    _noise: function (duration, gain, startTime) {
      var sampleRate = this.ctx.sampleRate;
      var bufferSize = Math.floor(sampleRate * duration);
      var buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      var src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(gain);
      src.start(startTime);
      return src;
    },

    /**
     * Play a named sound effect.
     * All sounds are generated procedurally with oscillators and noise.
     */
    play: function (name) {
      if (!this.initialized || !this.ctx) {
        this.init();
        if (!this.ctx) return;
      }

      // Resume context if suspended (browser autoplay policy)
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      var t = this.ctx.currentTime;
      var gain, osc;

      switch (name) {

        // ---- Sword swing: quick frequency sweep down (square, 80ms) ----
        case 'sword':
          gain = this._gain(0.5);
          gain.gain.setValueAtTime(0.5 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
          osc = this.ctx.createOscillator();
          osc.type = 'square';
          osc.frequency.setValueAtTime(800, t);
          osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);
          osc.connect(gain);
          osc.start(t);
          osc.stop(t + 0.08);
          break;

        // ---- Hit: noise burst (50ms) ----
        case 'hit':
          gain = this._gain(0.6);
          gain.gain.setValueAtTime(0.6 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
          this._noise(0.05, gain, t);
          break;

        // ---- Hurt: descending tone (saw, 200ms) ----
        case 'hurt':
          gain = this._gain(0.4);
          gain.gain.setValueAtTime(0.4 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
          osc = this.ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(600, t);
          osc.frequency.exponentialRampToValueAtTime(150, t + 0.2);
          osc.connect(gain);
          osc.start(t);
          osc.stop(t + 0.2);
          break;

        // ---- Pickup: ascending arpeggio (square, 3 quick notes going up) ----
        case 'pickup':
          gain = this._gain(0.4);
          gain.gain.setValueAtTime(0.4 * this.masterVolume, t);
          gain.gain.setValueAtTime(0.4 * this.masterVolume, t + 0.18);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.24);
          // Note 1: C5 (523 Hz)
          this._osc('square', 523, gain, t, t + 0.08);
          // Note 2: E5 (659 Hz)
          this._osc('square', 659, gain, t + 0.08, t + 0.16);
          // Note 3: G5 (784 Hz)
          this._osc('square', 784, gain, t + 0.16, t + 0.24);
          break;

        // ---- Select: short blip (square, 60ms, 440Hz) ----
        case 'select':
          gain = this._gain(0.4);
          gain.gain.setValueAtTime(0.4 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
          this._osc('square', 440, gain, t, t + 0.06);
          break;

        // ---- Dialogue: very short blip (square, 30ms, 600Hz) ----
        case 'dialogue':
          gain = this._gain(0.3);
          gain.gain.setValueAtTime(0.3 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
          this._osc('square', 600, gain, t, t + 0.03);
          break;

        // ---- Boss hit: heavy impact (square + noise, 150ms) ----
        case 'bosshit':
          gain = this._gain(0.7);
          gain.gain.setValueAtTime(0.7 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
          osc = this.ctx.createOscillator();
          osc.type = 'square';
          osc.frequency.setValueAtTime(120, t);
          osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
          osc.connect(gain);
          osc.start(t);
          osc.stop(t + 0.15);
          // Layered noise for grit
          var noiseGain = this._gain(0.5);
          noiseGain.gain.setValueAtTime(0.5 * this.masterVolume, t);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
          this._noise(0.15, noiseGain, t);
          break;

        // ---- Death: descending warbly tone (300ms) ----
        case 'death':
          gain = this._gain(0.5);
          gain.gain.setValueAtTime(0.5 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
          osc = this.ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(500, t);
          osc.frequency.exponentialRampToValueAtTime(80, t + 0.3);
          osc.connect(gain);
          osc.start(t);
          osc.stop(t + 0.3);
          // Vibrato LFO for warble
          var lfo = this.ctx.createOscillator();
          var lfoGain = this.ctx.createGain();
          lfo.frequency.value = 12;
          lfoGain.gain.value = 40;
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start(t);
          lfo.stop(t + 0.3);
          break;

        // ---- Victory: ascending major arpeggio C-E-G-C (800ms total) ----
        case 'victory':
          gain = this._gain(0.4);
          gain.gain.setValueAtTime(0.4 * this.masterVolume, t);
          gain.gain.setValueAtTime(0.4 * this.masterVolume, t + 0.7);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
          // C4 (262 Hz)
          this._osc('square', 262, gain, t, t + 0.2);
          // E4 (330 Hz)
          this._osc('square', 330, gain, t + 0.2, t + 0.4);
          // G4 (392 Hz)
          this._osc('square', 392, gain, t + 0.4, t + 0.6);
          // C5 (523 Hz)
          this._osc('square', 523, gain, t + 0.6, t + 0.8);
          break;

        // ---- Explosion: noise with envelope decay (400ms) ----
        case 'explosion':
          gain = this._gain(0.8);
          gain.gain.setValueAtTime(0.8 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
          this._noise(0.4, gain, t);
          // Low rumble under the noise
          var rumbleGain = this._gain(0.4);
          rumbleGain.gain.setValueAtTime(0.4 * this.masterVolume, t);
          rumbleGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
          osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(80, t);
          osc.frequency.exponentialRampToValueAtTime(20, t + 0.4);
          osc.connect(rumbleGain);
          osc.start(t);
          osc.stop(t + 0.4);
          break;

        default:
          console.warn('Unknown sound effect:', name);
      }
    }
  };

  // Expose as window.Audio (we store a reference so we don't shadow
  // the native Audio constructor more than necessary)
  window.GameAudio = GameAudio;
  // Also alias for convenience per spec
  window.Audio = GameAudio;

  // =========================================================================
  // PARTICLE SYSTEM (window.Particles)
  // =========================================================================

  window.Particles = {
    /** Active particle array */
    particles: [],

    /**
     * Add a single particle.
     * @param {number} x - Start x position
     * @param {number} y - Start y position
     * @param {object} options - Particle properties
     *   vx, vy: velocity
     *   life: frames to live
     *   color: fill color string
     *   size: pixel size (default 1)
     *   gravity: downward acceleration per frame (default 0)
     */
    add: function (x, y, options) {
      var opts = options || {};
      this.particles.push({
        x: x,
        y: y,
        vx: opts.vx || 0,
        vy: opts.vy || 0,
        life: opts.life || 30,
        maxLife: opts.life || 30,
        color: opts.color || window.C.white,
        size: opts.size || 1,
        gravity: opts.gravity || 0
      });
    },

    /**
     * Update all particles: move, apply gravity, age, remove dead.
     */
    update: function () {
      for (var i = this.particles.length - 1; i >= 0; i--) {
        var p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.life--;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }
    },

    /**
     * Render all particles as small filled rectangles.
     * @param {CanvasRenderingContext2D} ctx
     */
    render: function (ctx) {
      for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, p.life / (p.maxLife * 0.3));
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      }
      ctx.globalAlpha = 1;
    },

    // ----- Helper methods -----

    /**
     * Explosion burst of particles in random directions.
     * @param {number} x
     * @param {number} y
     * @param {number} count - Number of particles
     * @param {string} color - Fill color
     */
    burst: function (x, y, count, color) {
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 0.5 + Math.random() * 2;
        this.add(x, y, {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 15 + Math.floor(Math.random() * 15),
          color: color || window.C.white,
          size: 1 + Math.floor(Math.random() * 2),
          gravity: 0.02
        });
      }
    },

    /**
     * Gentle upward floating sparkles.
     * @param {number} x
     * @param {number} y
     * @param {string} color
     */
    sparkle: function (x, y, color) {
      for (var i = 0; i < 5; i++) {
        this.add(x + (Math.random() * 8 - 4), y + (Math.random() * 8 - 4), {
          vx: (Math.random() - 0.5) * 0.5,
          vy: -(0.3 + Math.random() * 0.5),
          life: 20 + Math.floor(Math.random() * 20),
          color: color || window.C.yellow,
          size: 1,
          gravity: -0.01
        });
      }
    },

    /**
     * Red burst for enemy hits.
     * @param {number} x
     * @param {number} y
     */
    blood: function (x, y) {
      this.burst(x, y, 8, window.C.red);
      // Add a few darker particles for depth
      for (var i = 0; i < 3; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 0.3 + Math.random() * 1;
        this.add(x, y, {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 10 + Math.floor(Math.random() * 10),
          color: window.C.darkRed,
          size: 1,
          gravity: 0.05
        });
      }
    }
  };

  // =========================================================================
  // BITMAP FONT DATA
  // =========================================================================

  /**
   * 5x7 pixel bitmap font.
   * Each character is an array of 7 numbers.
   * Each number represents one row; the 5 least-significant bits are the
   * pixel columns (bit 4 = leftmost column, bit 0 = rightmost column).
   *
   * Example: 'A' =
   *   row 0:  0 1 1 1 0  = 0x0E
   *   row 1:  1 0 0 0 1  = 0x11
   *   row 2:  1 0 0 0 1  = 0x11
   *   row 3:  1 1 1 1 1  = 0x1F
   *   row 4:  1 0 0 0 1  = 0x11
   *   row 5:  1 0 0 0 1  = 0x11
   *   row 6:  1 0 0 0 1  = 0x11
   */
  var FONT = {
    'A': [0x0E, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
    'B': [0x1E, 0x11, 0x11, 0x1E, 0x11, 0x11, 0x1E],
    'C': [0x0E, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0E],
    'D': [0x1E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1E],
    'E': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x1F],
    'F': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x10],
    'G': [0x0E, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0E],
    'H': [0x11, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
    'I': [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E],
    'J': [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0C],
    'K': [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
    'L': [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1F],
    'M': [0x11, 0x1B, 0x15, 0x15, 0x11, 0x11, 0x11],
    'N': [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
    'O': [0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
    'P': [0x1E, 0x11, 0x11, 0x1E, 0x10, 0x10, 0x10],
    'Q': [0x0E, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0D],
    'R': [0x1E, 0x11, 0x11, 0x1E, 0x14, 0x12, 0x11],
    'S': [0x0E, 0x11, 0x10, 0x0E, 0x01, 0x11, 0x0E],
    'T': [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
    'U': [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
    'V': [0x11, 0x11, 0x11, 0x11, 0x11, 0x0A, 0x04],
    'W': [0x11, 0x11, 0x11, 0x15, 0x15, 0x1B, 0x11],
    'X': [0x11, 0x11, 0x0A, 0x04, 0x0A, 0x11, 0x11],
    'Y': [0x11, 0x11, 0x0A, 0x04, 0x04, 0x04, 0x04],
    'Z': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1F],
    '0': [0x0E, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0E],
    '1': [0x04, 0x0C, 0x04, 0x04, 0x04, 0x04, 0x0E],
    '2': [0x0E, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1F],
    '3': [0x0E, 0x11, 0x01, 0x06, 0x01, 0x11, 0x0E],
    '4': [0x02, 0x06, 0x0A, 0x12, 0x1F, 0x02, 0x02],
    '5': [0x1F, 0x10, 0x1E, 0x01, 0x01, 0x11, 0x0E],
    '6': [0x06, 0x08, 0x10, 0x1E, 0x11, 0x11, 0x0E],
    '7': [0x1F, 0x01, 0x02, 0x04, 0x04, 0x04, 0x04],
    '8': [0x0E, 0x11, 0x11, 0x0E, 0x11, 0x11, 0x0E],
    '9': [0x0E, 0x11, 0x11, 0x0F, 0x01, 0x02, 0x0C],
    '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04],
    ',': [0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x08],
    ':': [0x00, 0x00, 0x04, 0x00, 0x00, 0x04, 0x00],
    ';': [0x00, 0x00, 0x04, 0x00, 0x00, 0x04, 0x08],
    '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0x00, 0x04],
    '?': [0x0E, 0x11, 0x01, 0x02, 0x04, 0x00, 0x04],
    '\'': [0x04, 0x04, 0x08, 0x00, 0x00, 0x00, 0x00],
    '-':  [0x00, 0x00, 0x00, 0x1F, 0x00, 0x00, 0x00],
    '/':  [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
    ' ':  [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
  };

  /** Character width including spacing, in base pixels */
  var CHAR_W = 6; // 5px char + 1px spacing
  /** Character height including spacing, in base pixels */
  var CHAR_H = 8; // 7px char + 1px spacing

  // =========================================================================
  // UTILITY FUNCTIONS (window.Utils)
  // =========================================================================

  window.Utils = {
    /**
     * Axis-aligned bounding box collision test.
     * @param {{x:number,y:number,w:number,h:number}} a
     * @param {{x:number,y:number,w:number,h:number}} b
     * @returns {boolean}
     */
    aabb: function (a, b) {
      return a.x < b.x + b.w &&
             a.x + a.w > b.x &&
             a.y < b.y + b.h &&
             a.y + a.h > b.y;
    },

    /**
     * Euclidean distance between two points.
     * @param {{x:number,y:number}} a
     * @param {{x:number,y:number}} b
     * @returns {number}
     */
    dist: function (a, b) {
      var dx = a.x - b.x;
      var dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Linear interpolation from a to b by t.
     * @param {number} a
     * @param {number} b
     * @param {number} t - 0..1
     * @returns {number}
     */
    lerp: function (a, b, t) {
      return a + (b - a) * t;
    },

    /**
     * Clamp value between min and max.
     * @param {number} v
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    clamp: function (v, min, max) {
      return v < min ? min : (v > max ? max : v);
    },

    /**
     * Random integer between min and max (inclusive).
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    randInt: function (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Pick a random element from an array.
     * @param {Array} arr
     * @returns {*}
     */
    choice: function (arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },

    /**
     * Draw pixel-art bitmap text.
     *
     * Renders text using the built-in 5x7 bitmap font. Lowercase
     * letters are mapped to uppercase. Unknown characters are skipped.
     *
     * @param {CanvasRenderingContext2D} ctx - Canvas context to draw on
     * @param {string} text - The string to render
     * @param {number} x - X position (top-left of first character)
     * @param {number} y - Y position (top-left of first character)
     * @param {string} [color] - Fill color (default: C.white)
     * @param {number} [size] - Pixel scale (default: 1)
     */
    drawText: function (ctx, text, x, y, color, size) {
      color = color || window.C.white;
      size = size || 1;

      ctx.fillStyle = color;

      var str = text.toUpperCase();
      for (var i = 0; i < str.length; i++) {
        var ch = str[i];
        var glyph = FONT[ch];
        if (!glyph) continue; // skip unknown characters

        var cx = x + i * CHAR_W * size;
        for (var row = 0; row < 7; row++) {
          var bits = glyph[row];
          for (var col = 0; col < 5; col++) {
            // Bit 4 is leftmost pixel, bit 0 is rightmost
            if (bits & (1 << (4 - col))) {
              ctx.fillRect(
                cx + col * size,
                y + row * size,
                size,
                size
              );
            }
          }
        }
      }
    }
  };

  // =========================================================================
  // ENGINE OBJECT (window.Engine)
  // =========================================================================

  window.Engine = {
    /** The offscreen buffer canvas (256x224) */
    bufferCanvas: bufferCanvas,
    /** The offscreen buffer 2D context */
    bufferCtx: bufferCtx,
    /** The display canvas element */
    displayCanvas: displayCanvas,
    /** The display 2D context */
    displayCtx: displayCtx,
    /** Internal width */
    W: window.W,
    /** Internal height */
    H: window.H,
    /** Display width */
    DISPLAY_W: DISPLAY_W,
    /** Display height */
    DISPLAY_H: DISPLAY_H,
    /** Scale factor */
    SCALE: SCALE,

    /**
     * Clear the buffer canvas.
     * @param {string} [color] - Optional fill color (default: black)
     */
    clear: function (color) {
      bufferCtx.fillStyle = color || window.C.black;
      bufferCtx.fillRect(0, 0, window.W, window.H);
    },

    /**
     * Copy the offscreen buffer to the display canvas, scaling 3x.
     * Uses nearest-neighbor interpolation (imageSmoothingEnabled = false)
     * for crisp pixel art.
     */
    flush: function () {
      displayCtx.imageSmoothingEnabled = false;
      displayCtx.drawImage(bufferCanvas, 0, 0, DISPLAY_W, DISPLAY_H);
    }
  };

})();
