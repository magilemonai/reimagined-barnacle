/**
 * Valisar: Shadows of the Eldspyre
 * Procedural Music System
 *
 * Generates SNES-style chiptune music using Web Audio API.
 * Each area has a distinct looping theme built from note patterns
 * scheduled in real-time via oscillators and gain envelopes.
 *
 * Themes: title, town, forest, temple, boss, victory
 * Assigned to window.Music
 */

(function () {
  'use strict';

  // =========================================================================
  // NOTE FREQUENCY TABLE (octaves 2-6)
  // =========================================================================

  var NOTE = {
    'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.0, 'B2': 123.5,
    'C3': 130.8, 'D3': 146.8, 'Eb3': 155.6, 'E3': 164.8, 'F3': 174.6, 'G3': 196.0, 'Ab3': 207.7, 'A3': 220.0, 'Bb3': 233.1, 'B3': 246.9,
    'C4': 261.6, 'D4': 293.7, 'Eb4': 311.1, 'E4': 329.6, 'F4': 349.2, 'G4': 392.0, 'Ab4': 415.3, 'A4': 440.0, 'Bb4': 466.2, 'B4': 493.9,
    'C5': 523.3, 'D5': 587.3, 'Eb5': 622.3, 'E5': 659.3, 'F5': 698.5, 'G5': 784.0, 'Ab5': 830.6, 'A5': 880.0, 'Bb5': 932.3, 'B5': 987.8,
    'C6': 1046.5, 'D6': 1174.7, 'E6': 1318.5
  };

  // =========================================================================
  // THEME DEFINITIONS
  // =========================================================================
  // Each theme has:
  //   bpm:      tempo in beats per minute
  //   swing:    slight timing offset for groove (0 = none)
  //   tracks:   array of { wave, notes, volume, octaveShift }
  //     notes:  array of [noteName, durationInBeats] or [null, duration] for rest
  //
  // Notes loop independently per track. The sequencer schedules ahead in chunks.

  var THEMES = {};

  // ------- TITLE: Atmospheric, slow arpeggios over pad -------
  THEMES.title = {
    bpm: 72,
    tracks: [
      // Pad: long sustained chords
      { wave: 'sine', volume: 0.12, notes: [
        ['C3', 8], ['E3', 8], ['G3', 8], ['E3', 8]
      ]},
      // Arpeggio: gentle ascending pattern
      { wave: 'triangle', volume: 0.08, notes: [
        ['C4', 1], ['E4', 1], ['G4', 1], ['C5', 1],
        ['B4', 1], ['G4', 1], ['E4', 1], ['G4', 1],
        ['C4', 1], ['E4', 1], ['A4', 1], ['C5', 1],
        ['B4', 1], ['G4', 1], ['E4', 1], ['D4', 1]
      ]},
      // High sparkle notes
      { wave: 'sine', volume: 0.05, notes: [
        [null, 4], ['G5', 2], [null, 2],
        [null, 4], ['E5', 2], [null, 2],
        [null, 4], ['C5', 1], ['D5', 1], [null, 2],
        [null, 8]
      ]}
    ]
  };

  // ------- TOWN: Warm, friendly, major key waltz feel -------
  THEMES.town = {
    bpm: 110,
    tracks: [
      // Bass line: root notes with bounce
      { wave: 'triangle', volume: 0.14, notes: [
        ['C3', 1], [null, 0.5], ['C3', 0.5], [null, 1],
        ['G2', 1], [null, 0.5], ['G2', 0.5], [null, 1],
        ['A2', 1], [null, 0.5], ['A2', 0.5], [null, 1],
        ['F2', 1], [null, 0.5], ['G2', 0.5], [null, 1],
        ['C3', 1], [null, 0.5], ['C3', 0.5], [null, 1],
        ['E3', 1], [null, 0.5], ['E3', 0.5], [null, 1],
        ['F2', 1], [null, 0.5], ['F2', 0.5], [null, 1],
        ['G2', 1], [null, 1], [null, 1]
      ]},
      // Melody: cheerful, singable tune
      { wave: 'square', volume: 0.07, notes: [
        ['E4', 1], ['G4', 0.5], ['A4', 0.5], ['G4', 1],
        ['E4', 0.5], ['D4', 0.5], ['C4', 1], [null, 1],
        ['D4', 1], ['E4', 0.5], ['F4', 0.5], ['E4', 1],
        ['D4', 0.5], ['C4', 0.5], ['D4', 1], [null, 1],
        ['E4', 1], ['G4', 0.5], ['A4', 0.5], ['C5', 1],
        ['B4', 0.5], ['A4', 0.5], ['G4', 1], [null, 1],
        ['A4', 0.5], ['G4', 0.5], ['F4', 1], ['E4', 0.5], ['D4', 0.5],
        ['C4', 2], [null, 1]
      ]},
      // Harmony: gentle counter-melody
      { wave: 'triangle', volume: 0.05, notes: [
        ['C4', 2], [null, 1], ['E4', 2], [null, 1],
        ['D4', 2], [null, 1], ['C4', 1], ['B3', 1], [null, 1],
        ['C4', 2], [null, 1], ['E4', 2], [null, 1],
        ['F4', 1], ['E4', 1], ['D4', 1], ['C4', 2], [null, 1]
      ]}
    ]
  };

  // ------- FOREST: Mysterious, minor key, slightly unsettling -------
  THEMES.forest = {
    bpm: 88,
    tracks: [
      // Bass: low, ominous pedal tones
      { wave: 'triangle', volume: 0.14, notes: [
        ['A2', 2], [null, 1], ['A2', 1],
        ['E2', 2], [null, 1], ['E2', 1],
        ['F2', 2], [null, 1], ['F2', 1],
        ['E2', 2], [null, 2]
      ]},
      // Melody: eerie, wandering minor melody
      { wave: 'square', volume: 0.06, notes: [
        ['A4', 1.5], ['C5', 0.5], ['B4', 1], ['A4', 1],
        ['G4', 1.5], ['E4', 0.5], [null, 2],
        ['F4', 1], ['A4', 1], ['G4', 0.5], ['F4', 0.5], ['E4', 1],
        [null, 1], ['E4', 0.5], ['F4', 0.5], ['E4', 1], [null, 1],
        ['A4', 1], ['C5', 1], ['B4', 1.5], ['A4', 0.5],
        ['G4', 1], ['F4', 0.5], ['E4', 0.5], [null, 2],
        ['A3', 1], ['C4', 1], ['E4', 2],
        [null, 4]
      ]},
      // Atmosphere: high, thin drone with gentle movement
      { wave: 'sine', volume: 0.04, notes: [
        ['E5', 4], ['D5', 4], ['C5', 4], ['B4', 4]
      ]},
      // Eerie pluck: sparse high notes
      { wave: 'square', volume: 0.03, notes: [
        [null, 6], ['E5', 0.5], [null, 1.5],
        [null, 4], ['A5', 0.5], [null, 3.5],
        [null, 8],
        [null, 5], ['C5', 0.5], [null, 2.5]
      ]}
    ]
  };

  // ------- TEMPLE: Dark, foreboding, drones and sparse notes -------
  THEMES.temple = {
    bpm: 66,
    tracks: [
      // Deep bass drone
      { wave: 'sine', volume: 0.16, notes: [
        ['C2', 8], ['Bb3', 8], ['Ab3', 8], ['C2', 8]
      ]},
      // Dissonant mid-range pad
      { wave: 'triangle', volume: 0.06, notes: [
        ['Eb4', 4], [null, 4],
        ['D4', 4], [null, 4],
        ['C4', 4], [null, 4],
        ['Eb4', 2], ['D4', 2], [null, 4]
      ]},
      // Sparse, echoing high notes (like dripping water in a cavern)
      { wave: 'sine', volume: 0.05, notes: [
        [null, 6], ['G5', 0.5], [null, 1.5],
        [null, 8],
        [null, 3], ['Eb5', 0.5], [null, 4.5],
        [null, 6], ['C5', 0.5], [null, 1.5],
        [null, 8],
        [null, 4], ['G5', 0.5], [null, 3.5]
      ]},
      // Low rhythmic pulse (heartbeat-like)
      { wave: 'sine', volume: 0.08, notes: [
        ['C3', 0.25], [null, 0.75], ['C3', 0.15], [null, 2.85],
        [null, 4],
        ['C3', 0.25], [null, 0.75], ['C3', 0.15], [null, 2.85],
        [null, 4]
      ]}
    ]
  };

  // ------- BOSS: Intense, driving, escalating -------
  THEMES.boss = {
    bpm: 150,
    tracks: [
      // Driving bass: aggressive root-fifth pattern
      { wave: 'sawtooth', volume: 0.10, notes: [
        ['A2', 0.5], ['A2', 0.5], ['E3', 0.5], ['A2', 0.5],
        ['A2', 0.5], ['A2', 0.5], ['E3', 0.5], ['A2', 0.5],
        ['F2', 0.5], ['F2', 0.5], ['C3', 0.5], ['F2', 0.5],
        ['G2', 0.5], ['G2', 0.5], ['D3', 0.5], ['G2', 0.5],
        ['A2', 0.5], ['A2', 0.5], ['E3', 0.5], ['A2', 0.5],
        ['A2', 0.5], ['A2', 0.5], ['E3', 0.5], ['A2', 0.5],
        ['Bb2', 0.5], ['Bb2', 0.5], ['F3', 0.5], ['Bb2', 0.5],
        ['E2', 0.5], ['E2', 0.5], ['B2', 0.5], ['E3', 0.5]
      ]},
      // Aggressive lead melody
      { wave: 'square', volume: 0.08, notes: [
        ['A4', 0.5], ['C5', 0.5], ['A4', 0.5], ['E4', 0.5],
        ['A4', 1], ['G4', 0.5], ['A4', 0.5],
        ['F4', 0.5], ['A4', 0.5], ['C5', 0.5], ['A4', 0.5],
        ['G4', 1], ['E4', 1],
        ['A4', 0.5], ['C5', 0.5], ['D5', 0.5], ['E5', 0.5],
        ['D5', 0.5], ['C5', 0.5], ['A4', 1],
        ['Bb4', 0.5], ['A4', 0.5], ['G4', 0.5], ['A4', 0.5],
        ['E4', 2]
      ]},
      // Rhythmic percussion (noise bursts)
      { wave: 'noise', volume: 0.06, notes: [
        ['C4', 0.15], [null, 0.35], ['C4', 0.15], [null, 0.35],
        ['C5', 0.15], [null, 0.35], ['C4', 0.15], [null, 0.35],
        ['C4', 0.15], [null, 0.35], ['C4', 0.15], [null, 0.35],
        ['C5', 0.15], [null, 0.35], ['C4', 0.15], [null, 0.35]
      ]},
      // Counter-melody harmony
      { wave: 'triangle', volume: 0.05, notes: [
        ['E4', 2], ['C4', 2],
        ['D4', 2], ['E4', 2],
        ['E4', 2], ['A4', 2],
        ['G4', 2], ['E4', 2]
      ]}
    ]
  };

  // ------- VICTORY: Triumphant, uplifting, resolved -------
  THEMES.victory = {
    bpm: 100,
    tracks: [
      // Bass: solid major chord roots
      { wave: 'triangle', volume: 0.14, notes: [
        ['C3', 2], [null, 2], ['G2', 2], [null, 2],
        ['A2', 2], [null, 2], ['F2', 2], ['G2', 2],
        ['C3', 2], [null, 2], ['E3', 2], [null, 2],
        ['F2', 2], [null, 1], ['G2', 1], ['C3', 4]
      ]},
      // Triumphant melody
      { wave: 'square', volume: 0.07, notes: [
        ['C5', 1], ['D5', 0.5], ['E5', 1.5], ['G5', 1],
        ['E5', 0.5], ['D5', 0.5], ['C5', 1], [null, 1],
        ['A4', 1], ['C5', 1], ['E5', 1], ['D5', 1],
        ['C5', 1], ['B4', 0.5], ['A4', 0.5], ['G4', 1], [null, 1],
        ['C5', 1], ['E5', 1], ['G5', 1.5], ['A5', 0.5],
        ['G5', 1], ['E5', 0.5], ['D5', 0.5], ['C5', 1], [null, 1],
        ['A4', 0.5], ['B4', 0.5], ['C5', 2], [null, 1],
        ['C5', 3], [null, 1]
      ]},
      // Warm pad
      { wave: 'sine', volume: 0.06, notes: [
        ['E4', 4], ['G4', 4],
        ['A4', 4], ['G4', 4],
        ['E4', 4], ['G4', 4],
        ['F4', 4], ['E4', 4]
      ]}
    ]
  };

  // =========================================================================
  // MUSIC ENGINE
  // =========================================================================

  var Music = {
    /** Currently playing theme name (or null) */
    currentTheme: null,

    /** Master volume for music (separate from SFX) */
    masterVolume: 0.15,

    /** Scheduling state per track */
    _tracks: [],

    /** The scheduling interval ID */
    _scheduleInterval: null,

    /** How far ahead to schedule notes (seconds) */
    _scheduleAhead: 0.3,

    /** The AudioContext (shared with GameAudio) */
    _ctx: null,

    /** Master gain node for music */
    _masterGain: null,

    /** Target volume for fade-in/out */
    _fadeTarget: 0.15,
    _fadeSpeed: 0.005,
    _fading: false,

    /** Whether music is muted */
    muted: false,

    /**
     * Initialize the music system. Must be called after GameAudio.init().
     */
    init: function () {
      if (window.GameAudio && window.GameAudio.ctx) {
        this._ctx = window.GameAudio.ctx;
        this._masterGain = this._ctx.createGain();
        this._masterGain.gain.value = this.masterVolume;
        this._masterGain.connect(this._ctx.destination);
      }
    },

    /**
     * Start playing a named theme. If already playing, crossfades.
     * @param {string} themeName - Key in THEMES object.
     */
    play: function (themeName) {
      if (!this._ctx) {
        this.init();
        if (!this._ctx) return;
      }

      // Resume context if suspended
      if (this._ctx.state === 'suspended') {
        this._ctx.resume();
      }

      // Don't restart the same theme
      if (this.currentTheme === themeName) return;

      // Stop current theme
      this.stop();

      var theme = THEMES[themeName];
      if (!theme) return;

      this.currentTheme = themeName;
      var beatDuration = 60.0 / theme.bpm;

      // Initialize track state
      this._tracks = [];
      for (var i = 0; i < theme.tracks.length; i++) {
        var trackDef = theme.tracks[i];
        this._tracks.push({
          def: trackDef,
          noteIndex: 0,
          nextNoteTime: this._ctx.currentTime + 0.05, // small delay to sync
          beatDuration: beatDuration
        });
      }

      // Fade in
      if (this._masterGain) {
        this._masterGain.gain.setValueAtTime(0.001, this._ctx.currentTime);
        this._masterGain.gain.linearRampToValueAtTime(
          this.muted ? 0 : this.masterVolume,
          this._ctx.currentTime + 1.5
        );
      }

      // Start scheduling loop
      var self = this;
      this._scheduleInterval = setInterval(function () {
        self._schedule();
      }, 100);
    },

    /**
     * Stop all music immediately.
     */
    stop: function () {
      if (this._scheduleInterval) {
        clearInterval(this._scheduleInterval);
        this._scheduleInterval = null;
      }

      // Quick fade out to avoid clicks
      if (this._masterGain && this._ctx) {
        try {
          this._masterGain.gain.cancelScheduledValues(this._ctx.currentTime);
          this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, this._ctx.currentTime);
          this._masterGain.gain.linearRampToValueAtTime(0.001, this._ctx.currentTime + 0.1);
        } catch (e) {
          // Ignore errors during cleanup
        }
      }

      this._tracks = [];
      this.currentTheme = null;
    },

    /**
     * Toggle mute on/off.
     */
    toggleMute: function () {
      this.muted = !this.muted;
      if (this._masterGain && this._ctx) {
        this._masterGain.gain.linearRampToValueAtTime(
          this.muted ? 0 : this.masterVolume,
          this._ctx.currentTime + 0.3
        );
      }
    },

    /**
     * Internal: Schedule upcoming notes for all tracks.
     */
    _schedule: function () {
      if (!this._ctx || !this.currentTheme) return;

      var now = this._ctx.currentTime;

      for (var i = 0; i < this._tracks.length; i++) {
        var track = this._tracks[i];
        var def = track.def;

        // Schedule notes that fall within the look-ahead window
        while (track.nextNoteTime < now + this._scheduleAhead) {
          var noteData = def.notes[track.noteIndex];
          var noteName = noteData[0];
          var beats = noteData[1];
          var duration = beats * track.beatDuration;

          if (noteName !== null) {
            var freq = NOTE[noteName];
            if (freq) {
              this._playNote(
                def.wave,
                freq,
                def.volume,
                track.nextNoteTime,
                duration
              );
            }
          }

          // Advance to next note (loop)
          track.nextNoteTime += duration;
          track.noteIndex = (track.noteIndex + 1) % def.notes.length;
        }
      }
    },

    /**
     * Internal: Play a single note with proper envelope.
     */
    _playNote: function (wave, freq, volume, startTime, duration) {
      if (!this._ctx || !this._masterGain) return;

      try {
        // Very short attack/release for clean chiptune sound
        var attack = 0.01;
        var release = Math.min(0.08, duration * 0.3);
        var sustain = duration - attack - release;
        if (sustain < 0.01) sustain = 0.01;

        var gainNode = this._ctx.createGain();
        gainNode.connect(this._masterGain);

        // Envelope: attack -> sustain -> release
        gainNode.gain.setValueAtTime(0.001, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + attack);
        gainNode.gain.setValueAtTime(volume, startTime + attack + sustain);
        gainNode.gain.linearRampToValueAtTime(0.001, startTime + duration);

        if (wave === 'noise') {
          // Create noise burst for percussion
          var sampleRate = this._ctx.sampleRate;
          var bufferSize = Math.floor(sampleRate * duration);
          if (bufferSize < 1) bufferSize = 1;
          var buffer = this._ctx.createBuffer(1, bufferSize, sampleRate);
          var data = buffer.getChannelData(0);
          for (var i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          var src = this._ctx.createBufferSource();
          src.buffer = buffer;
          src.connect(gainNode);
          src.start(startTime);
          src.stop(startTime + duration);
        } else {
          var osc = this._ctx.createOscillator();
          osc.type = wave;
          osc.frequency.setValueAtTime(freq, startTime);
          osc.connect(gainNode);
          osc.start(startTime);
          osc.stop(startTime + duration + 0.01);
        }
      } catch (e) {
        // Silently handle errors (e.g. during context cleanup)
      }
    }
  };

  window.Music = Music;

})();
