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
    'C2': 65.41, 'Db2': 69.30, 'D2': 73.42, 'Eb2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'Ab2': 103.8, 'A2': 110.0, 'Bb2': 116.5, 'B2': 123.5,
    'C3': 130.8, 'Db3': 138.6, 'D3': 146.8, 'Eb3': 155.6, 'E3': 164.8, 'F3': 174.6, 'F#3': 185.0, 'G3': 196.0, 'Ab3': 207.7, 'A3': 220.0, 'Bb3': 233.1, 'B3': 246.9,
    'C4': 261.6, 'Db4': 277.2, 'D4': 293.7, 'Eb4': 311.1, 'E4': 329.6, 'F4': 349.2, 'F#4': 370.0, 'G4': 392.0, 'Ab4': 415.3, 'A4': 440.0, 'Bb4': 466.2, 'B4': 493.9,
    'C5': 523.3, 'Db5': 554.4, 'D5': 587.3, 'Eb5': 622.3, 'E5': 659.3, 'F5': 698.5, 'F#5': 740.0, 'G5': 784.0, 'Ab5': 830.6, 'A5': 880.0, 'Bb5': 932.3, 'B5': 987.8,
    'C6': 1046.5, 'D6': 1174.7, 'E6': 1318.5, 'F6': 1396.9, 'G6': 1568.0
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

  // =========================================================================
  // TITLE: "Valisar's Call"
  // Contemplative, majestic. A lone melody rises over shimmering arpeggios,
  // hinting at the adventure ahead. C major with A minor coloring —
  // hopeful but tinged with the weight of what's to come.
  // Inspired by: Secret of Mana opening, Chrono Trigger's wind scene
  // 32-beat loop at 72 BPM (~26.7 seconds per cycle)
  // =========================================================================
  THEMES.title = {
    bpm: 72,
    tracks: [
      // HARMONIC FOUNDATION — warm sine pad tracing the chord progression
      // I → vi → IV → V → I → iii → IV → V
      { wave: 'sine', volume: 0.11, notes: [
        ['C3', 4], ['A2', 4], ['F2', 4], ['G2', 4],
        ['C3', 4], ['E3', 4], ['F2', 4], ['G2', 4]
      ]},
      // ARPEGGIO — triangle tracing chord tones in gentle waves
      // Each 4-beat bar arpeggiates the harmony above
      { wave: 'triangle', volume: 0.07, notes: [
        ['C4', 1], ['E4', 1], ['G4', 1], ['C5', 1],
        ['A3', 1], ['C4', 1], ['E4', 1], ['A4', 1],
        ['F3', 1], ['A3', 1], ['C4', 1], ['F4', 1],
        ['G3', 1], ['B3', 1], ['D4', 1], ['G4', 1],
        ['C4', 1], ['E4', 1], ['G4', 1], ['B4', 1],
        ['E3', 1], ['G3', 1], ['B3', 1], ['E4', 1],
        ['F3', 1], ['A3', 1], ['C4', 1], ['A3', 1],
        ['G3', 1], ['B3', 1], ['D4', 1], ['B3', 1]
      ]},
      // MELODY — the main theme of the game, plaintive and memorable
      // Opens with the ascending "hero's call" motif (E-G-C), develops,
      // then resolves with a gentle descent
      { wave: 'square', volume: 0.06, notes: [
        // A section: the call
        ['E5', 1.5], [null, 0.5], ['G4', 1], ['C5', 1],       // bar 1: rising call
        ['B4', 1], ['A4', 0.5], ['G4', 0.5], ['E4', 2],       // bar 2: answering descent
        [null, 1], ['A4', 1], ['C5', 1], ['E5', 1],            // bar 3: climbing higher
        ['D5', 1.5], ['C5', 0.5], ['B4', 1], [null, 1],        // bar 4: gentle fall
        // B section: reflection
        ['E5', 1.5], [null, 0.5], ['G5', 1], ['E5', 1],        // bar 5: soaring
        ['D5', 1], ['C5', 1], [null, 2],                       // bar 6: breathing space
        ['A4', 1], ['B4', 0.5], ['C5', 0.5], [null, 1], ['A4', 1],  // bar 7: searching
        ['G4', 3], [null, 1]                                    // bar 8: resolution
      ]},
      // CRYSTALLINE ACCENTS — sparse high sine notes like stars appearing
      { wave: 'sine', volume: 0.04, notes: [
        [null, 7], ['G5', 0.5], [null, 0.5],
        [null, 5.5], ['E5', 0.5], [null, 2],
        [null, 4], ['C6', 0.5], [null, 0.5], ['D6', 0.5], [null, 2.5],
        [null, 8]
      ]}
    ]
  };

  // =========================================================================
  // TOWN: "Ebon Vale"
  // Warm, bustling, pastoral. A singable melody over bouncy bass — the sound
  // of a village where people still have hope. 3/4 waltz feel.
  // F major coloring over C major — bright and open.
  // Inspired by: Kakariko Village, Traverse Town
  // 24-beat loop at 112 BPM (~12.9 seconds per cycle)
  // =========================================================================
  THEMES.town = {
    bpm: 112,
    tracks: [
      // BASS — bouncy root-fifth waltz pattern with passing tones
      { wave: 'triangle', volume: 0.13, notes: [
        ['C3', 1], [null, 0.5], ['G2', 0.5], [null, 1],        // I
        ['G2', 1], [null, 0.5], ['B2', 0.5], [null, 1],        // V
        ['A2', 1], [null, 0.5], ['E3', 0.5], [null, 1],        // vi
        ['F2', 1], [null, 0.5], ['G2', 0.5], [null, 1],        // IV → V
        ['C3', 1], [null, 0.5], ['E2', 0.5], [null, 1],        // I
        ['F2', 1], [null, 0.5], ['A2', 0.5], [null, 1],        // IV
        ['D3', 1], [null, 0.5], ['F2', 0.5], [null, 1],        // ii
        ['G2', 1], [null, 0.5], ['G2', 0.5], [null, 1]         // V
      ]},
      // MELODY — bright, memorable, with a proper question-and-answer shape
      { wave: 'square', volume: 0.07, notes: [
        ['E4', 0.5], ['G4', 0.5], ['C5', 1], ['B4', 1],        // bar 1: leaping up
        ['A4', 1], ['G4', 0.5], ['E4', 0.5], ['D4', 1],        // bar 2: stepping down
        ['C4', 0.5], ['E4', 0.5], ['G4', 1], ['A4', 1],        // bar 3: climbing again
        ['G4', 1.5], ['E4', 0.5], [null, 1],                   // bar 4: resting
        ['E4', 0.5], ['G4', 0.5], ['C5', 1], ['D5', 1],        // bar 5: higher this time
        ['E5', 1], ['D5', 0.5], ['C5', 0.5], ['A4', 1],        // bar 6: cascading down
        ['G4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F4', 0.5], ['E4', 1],  // bar 7: tumbling run
        ['D4', 0.5], ['E4', 0.5], ['C4', 1], [null, 1]         // bar 8: resolving home
      ]},
      // COUNTER-MELODY — gentle response in thirds/sixths
      { wave: 'triangle', volume: 0.05, notes: [
        ['C4', 1.5], [null, 0.5], ['E4', 1],
        ['D4', 1.5], [null, 0.5], ['B3', 1],
        ['C4', 1], ['E4', 1], [null, 1],
        ['D4', 1.5], ['G3', 0.5], [null, 1],
        ['C4', 1.5], [null, 0.5], ['G4', 1],
        ['E4', 1], ['G4', 0.5], ['E4', 0.5], [null, 1],
        ['F4', 1], ['E4', 0.5], ['D4', 0.5], [null, 1],
        ['C4', 1.5], [null, 0.5], [null, 1]
      ]},
      // WARM PAD — sustained harmony underneath
      { wave: 'sine', volume: 0.04, notes: [
        ['E4', 6], ['D4', 6], ['E4', 6], ['D4', 3], ['C4', 3]
      ]}
    ]
  };

  // =========================================================================
  // FOREST: "Whispers in Shadow"
  // Mysterious, unsettling. Chromatic bass movement under a wandering melody
  // that never quite settles. A minor with phrygian touches (flattened 2nd).
  // Wide intervals in the melody create unease; sparse accents suggest
  // something watching from the dark.
  // Inspired by: Lost Woods, Chrono Trigger's Guardia Forest
  // 32-beat loop at 84 BPM (~22.9 seconds per cycle)
  // =========================================================================
  THEMES.forest = {
    bpm: 84,
    tracks: [
      // BASS — chromatic creeping movement, never comfortable
      { wave: 'triangle', volume: 0.13, notes: [
        ['A2', 2], [null, 1], ['E2', 1],
        ['F2', 2], [null, 1], ['C3', 1],
        ['D2', 2], [null, 1], ['A2', 1],
        ['E2', 2], [null, 1], ['E2', 1],
        ['A2', 2], [null, 1], ['G2', 1],
        ['F2', 2], ['E2', 1], [null, 1],
        ['D2', 2], [null, 1], ['F2', 1],
        ['E2', 3], [null, 1]
      ]},
      // MELODY — eerie wandering line with wide leaps
      // The melody uses the "dark motif" (C-Eb-D-C) as a recurring cell
      { wave: 'square', volume: 0.06, notes: [
        ['A4', 1.5], ['B4', 0.5], ['C5', 1], ['E5', 1],        // bar 1: rising unease
        ['D5', 1.5], ['C5', 0.5], ['A4', 1], [null, 1],        // bar 2: falling back
        ['F4', 1], ['A4', 1], ['G4', 0.5], ['F4', 0.5], ['E4', 1],  // bar 3: searching
        [null, 1], ['E4', 0.5], ['F4', 0.5], ['E4', 1], [null, 1],  // bar 4: the dark motif fragment
        ['A4', 1], ['C5', 1], ['B4', 1], ['A4', 1],             // bar 5: another attempt
        ['G4', 1.5], ['F4', 0.5], ['E4', 1], [null, 1],        // bar 6: sinking
        ['C4', 1], ['E4', 1], ['A4', 1.5], [null, 0.5],        // bar 7: low echo
        [null, 4]                                                // bar 8: empty space (dread)
      ]},
      // ATMOSPHERIC DRONE — descending whole tones creating slow dissonance
      { wave: 'sine', volume: 0.04, notes: [
        ['E5', 4], ['D5', 4], ['C5', 4], ['B4', 4],
        ['A4', 4], ['B4', 4], ['C5', 4], ['D5', 4]
      ]},
      // SPARSE ACCENTS — sudden plucked notes like twigs snapping
      { wave: 'square', volume: 0.03, notes: [
        [null, 6], ['E5', 0.25], [null, 1.75],
        [null, 4], ['A5', 0.25], [null, 3.75],
        [null, 7], ['B4', 0.25], [null, 0.75],
        [null, 5], ['C5', 0.25], [null, 2.75]
      ]},
      // LOW RESONANCE — sub-bass octave reinforcement
      { wave: 'sine', volume: 0.06, notes: [
        ['A2', 8], ['F2', 8], ['D2', 8], ['E2', 8]
      ]}
    ]
  };

  // =========================================================================
  // TEMPLE: "Temple of Nitriti"
  // Dark, ritualistic, dread. A grinding chromatic descent in the bass,
  // dissonant tritone intervals, echoing drips in the high register, and a
  // relentless heartbeat pulse. The mid-range traces a menacing motif
  // (C-Eb-D-Db) — the sound of ancient malice.
  // C minor / diminished
  // Inspired by: Magus's Castle, Temple of Time (dark), Cave of the Past
  // 32-beat loop at 60 BPM (~32 seconds per cycle)
  // =========================================================================
  THEMES.temple = {
    bpm: 60,
    tracks: [
      // GRINDING BASS — chromatic descent into darkness
      { wave: 'sine', volume: 0.15, notes: [
        ['C3', 4], ['B2', 4], ['Bb2', 4], ['A2', 4],
        ['Ab2', 4], ['G2', 4], ['F#2', 4], ['G2', 4]
      ]},
      // MENACING MOTIF — dissonant mid-range theme (tritones and minor 2nds)
      { wave: 'triangle', volume: 0.06, notes: [
        ['C4', 1.5], ['Eb4', 1], ['D4', 0.5], [null, 1],       // the dark motif
        ['Db4', 1], ['C4', 1], [null, 2],                       // chromatic resolution
        ['Eb4', 1.5], ['G4', 1], ['F#4', 0.5], [null, 1],      // tritone tension
        ['G4', 1], ['Eb4', 1], [null, 2],                       // falling
        ['C4', 1.5], ['Eb4', 1], ['D4', 0.5], [null, 1],       // motif returns
        ['Ab3', 1.5], ['G3', 0.5], [null, 2],                   // lower, darker
        [null, 4],                                                // silence (worst of all)
        ['Eb4', 0.5], ['D4', 0.5], ['Db4', 0.5], ['C4', 0.5], [null, 2]  // chromatic decay
      ]},
      // ECHOING DRIPS — sparse high sine notes, cathedral reverb feel
      { wave: 'sine', volume: 0.05, notes: [
        [null, 5], ['G5', 0.5], [null, 2.5],
        [null, 7], ['Eb5', 0.25], [null, 0.75],
        [null, 3], ['C5', 0.5], [null, 4.5],
        [null, 6], ['Ab5', 0.25], [null, 1.75]
      ]},
      // HEARTBEAT — low, relentless double-pulse
      { wave: 'sine', volume: 0.09, notes: [
        ['C3', 0.25], [null, 0.75], ['C3', 0.15], [null, 2.85],
        [null, 4],
        ['C3', 0.25], [null, 0.75], ['C3', 0.15], [null, 2.85],
        [null, 4],
        ['C3', 0.25], [null, 0.75], ['C3', 0.15], [null, 2.85],
        [null, 4],
        ['Db3', 0.25], [null, 0.75], ['Db3', 0.15], [null, 2.85],
        [null, 4]
      ]},
      // DEEP SUB-DRONE — felt more than heard
      { wave: 'sine', volume: 0.08, notes: [
        ['C2', 16], ['Db2', 8], ['C2', 8]
      ]}
    ]
  };

  // =========================================================================
  // BOSS: "Queen Bargnot"
  // Aggressive, relentless, building. Pounding bass drives forward while a
  // fierce angular melody screams over noise percussion. The harmonic
  // language is A minor / E phrygian — the flattened 2nd (Bb) gives it
  // a distinctly menacing character. Counter-melody builds tension by
  // pushing against the main line.
  // Inspired by: FF6 boss themes, Chrono Trigger's battle music
  // 16-beat loop at 152 BPM (~6.3 seconds per cycle — fast and intense)
  // =========================================================================
  THEMES.boss = {
    bpm: 152,
    tracks: [
      // POUNDING BASS — driving 8th-note pattern with chromatic movement
      { wave: 'sawtooth', volume: 0.09, notes: [
        // Am: root-root-fifth-root
        ['A2', 0.5], ['A2', 0.5], ['E3', 0.5], ['A2', 0.5],
        ['A2', 0.5], ['E3', 0.5], ['A2', 0.5], ['G2', 0.5],
        // F: root-fifth-root with chromatic approach
        ['F2', 0.5], ['F2', 0.5], ['C3', 0.5], ['F2', 0.5],
        // G: dominant tension, rising chromatic line to turnaround
        ['G2', 0.5], ['G2', 0.5], ['D3', 0.5], ['G2', 0.5],
        // Am again: heavier repetition
        ['A2', 0.5], ['A2', 0.5], ['E3', 0.5], ['A2', 0.5],
        ['A2', 0.5], ['C3', 0.5], ['E3', 0.5], ['A2', 0.5],
        // Bb: the phrygian flat-2, menacing
        ['Bb2', 0.5], ['Bb2', 0.5], ['F3', 0.5], ['Bb2', 0.5],
        // E: dominant turnaround with ascending chromatic
        ['E2', 0.5], ['F2', 0.5], ['F#2', 0.5], ['G2', 0.5]
      ]},
      // FIERCE MELODY — angular, wide-interval, rhythmically driving
      { wave: 'square', volume: 0.07, notes: [
        // A section: aggressive statement
        ['A4', 0.5], ['C5', 0.5], ['E5', 0.5], ['C5', 0.5],    // punching upward
        ['A4', 0.5], ['G4', 0.5], ['A4', 1],                    // snapping back
        ['F4', 0.5], ['A4', 0.5], ['C5', 0.5], ['D5', 0.5],    // chromatic climb
        ['E5', 1], ['D5', 0.5], ['C5', 0.5],                    // peak and fall
        // B section: building higher
        ['A4', 0.5], ['C5', 0.5], ['D5', 0.5], ['E5', 0.5],    // ascending run
        ['F5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 0.5],    // tumbling back
        ['Bb4', 0.5], ['A4', 0.5], ['G4', 0.5], ['A4', 0.5],   // phrygian color
        ['E4', 1], ['E4', 0.5], ['A4', 0.5]                     // turnaround
      ]},
      // PERCUSSION — kick-snare pattern with noise bursts
      { wave: 'noise', volume: 0.06, notes: [
        // kick-hat-snare-hat pattern
        ['C3', 0.15], [null, 0.35],                              // kick
        ['C5', 0.1], [null, 0.4],                                // hat
        ['C4', 0.15], [null, 0.35],                              // snare
        ['C5', 0.1], [null, 0.4],                                // hat
        ['C3', 0.15], [null, 0.35],                              // kick
        ['C5', 0.1], [null, 0.15], ['C5', 0.1], [null, 0.15],   // double hat
        ['C4', 0.15], [null, 0.35],                              // snare
        ['C3', 0.1], [null, 0.15], ['C5', 0.1], [null, 0.15]    // kick + hat fill
      ]},
      // COUNTER-MELODY — tense harmony pushing against the lead
      { wave: 'triangle', volume: 0.05, notes: [
        ['E4', 1], ['E4', 1], ['C4', 1], ['C4', 1],
        ['D4', 1], ['D4', 1], ['E4', 1], ['E4', 1],
        ['E4', 1], ['F4', 1], ['E4', 1], ['D4', 1],
        ['Bb3', 1], ['A3', 1], ['B3', 1], ['C4', 1]
      ]},
      // BASS OCTAVE REINFORCEMENT — adds weight in the lowest register
      { wave: 'sine', volume: 0.06, notes: [
        ['A2', 4], ['F2', 2], ['G2', 2],
        ['A2', 4], ['Bb2', 2], ['E2', 2]
      ]}
    ]
  };

  // =========================================================================
  // EPILOGUE: "Between Stars"
  // Ethereal, fragile, bittersweet. A delicate melody over sustained pads
  // that evokes the vastness of the void and a spirit finally at peace.
  // Nitriti's theme — neither triumphant nor mournful, but something
  // in-between: the quiet after a storm. E minor with lydian touches.
  // 32-beat loop at 72 BPM (~26.7 seconds per cycle)
  // =========================================================================
  THEMES.epilogue = {
    bpm: 72,
    tracks: [
      // BASS — deep, slow, grounding. Sustained root notes with gentle movement
      { wave: 'sine', volume: 0.10, notes: [
        ['E2', 4], ['G2', 4],                                   // i → III
        ['C3', 4], ['B2', 4],                                   // VI → V
        ['E2', 4], ['A2', 4],                                   // i → iv
        ['D3', 2], ['C3', 2], ['B2', 4]                         // VII → VI → V
      ]},
      // MELODY — a lone voice, like starlight. Sparse, breathing, human
      { wave: 'triangle', volume: 0.06, notes: [
        ['B4', 2], ['E5', 2], ['D5', 1], ['B4', 1], [null, 2], // opening sigh
        ['G4', 1], ['A4', 1], ['B4', 3], [null, 3],             // answering phrase
        ['E5', 2], ['F#5', 1], ['E5', 1], ['D5', 2], ['B4', 2],// reaching higher
        ['A4', 1], ['G4', 1], ['E4', 2], [null, 4]              // falling to rest
      ]},
      // PAD — sustained chords, very soft, like breathing in the void
      { wave: 'sine', volume: 0.04, notes: [
        ['B3', 8], ['D4', 8],
        ['E4', 8], ['D4', 8]
      ]},
      // SPARKLE — high, delicate notes like distant stars appearing
      { wave: 'sine', volume: 0.025, notes: [
        [null, 3], ['B5', 0.5], [null, 4.5],                    // lone star
        [null, 2], ['E6', 0.5], [null, 5.5],                    // another
        [null, 4], ['G5', 0.5], [null, 3.5],                    // closer
        ['F#5', 0.5], [null, 7.5]                                // fading
      ]}
    ]
  };

  // =========================================================================
  // VICTORY: "Dawn Returns"
  // Triumphant, emotional, resolved. Opens with a fanfare-like rising figure
  // before settling into a warm, soaring melody. The harmonic language is
  // bright C major with a brief modulation to G major for the climax —
  // the musical equivalent of sunlight breaking through clouds.
  // Inspired by: FF victory fanfares, Zelda's item acquisition
  // 32-beat loop at 104 BPM (~18.5 seconds per cycle)
  // =========================================================================
  THEMES.victory = {
    bpm: 104,
    tracks: [
      // BASS — solid harmonic foundation with movement
      { wave: 'triangle', volume: 0.13, notes: [
        ['C3', 1], [null, 1], ['G2', 1], ['C3', 1],             // I
        ['G2', 1], [null, 1], ['D3', 1], ['G2', 1],             // V
        ['A2', 1], [null, 1], ['E3', 1], ['A2', 1],             // vi
        ['F2', 1], ['G2', 1], ['A2', 1], ['G2', 1],             // IV → V approach
        ['C3', 1], [null, 1], ['E3', 1], ['C3', 1],             // I (repeat, stronger)
        ['G2', 1], [null, 1], ['B2', 1], ['D3', 1],             // V (fuller)
        ['F2', 1], ['A2', 1], ['C3', 1], ['F2', 1],             // IV (warm)
        ['G2', 2], ['C3', 2]                                     // V → I (final resolution)
      ]},
      // MELODY — triumphant, building to a climax
      { wave: 'square', volume: 0.07, notes: [
        // A section: fanfare opening
        ['C5', 0.5], ['E5', 0.5], ['G5', 1], ['E5', 1],         // rising fanfare
        ['D5', 0.5], ['E5', 0.5], ['D5', 1], ['B4', 1],         // answering phrase
        ['A4', 1], ['C5', 1], ['E5', 1.5], ['D5', 0.5],         // climbing
        ['C5', 1], ['B4', 0.5], ['A4', 0.5], ['G4', 1], [null, 1],  // graceful descent
        // B section: soaring higher
        ['C5', 0.5], ['E5', 0.5], ['G5', 1.5], ['A5', 0.5],    // reaching the peak
        ['G5', 1], ['E5', 0.5], ['D5', 0.5], ['C5', 1], [null, 1],  // streaming down
        ['A4', 0.5], ['B4', 0.5], ['C5', 1], ['E5', 1], ['D5', 1],  // final ascent
        ['C5', 3], [null, 1]                                      // triumphant resolution
      ]},
      // WARM HARMONY PAD — sustained chord tones
      { wave: 'sine', volume: 0.05, notes: [
        ['E4', 4], ['B4', 4],
        ['C5', 4], ['B4', 4],
        ['E4', 4], ['D5', 4],
        ['C5', 4], ['E4', 4]
      ]},
      // BRIGHT ACCENT — triangle sparkle on strong beats
      { wave: 'triangle', volume: 0.04, notes: [
        ['G5', 0.5], [null, 3.5],
        ['D5', 0.5], [null, 3.5],
        ['E5', 0.5], [null, 3.5],
        ['C5', 0.5], [null, 3.5],
        ['G5', 0.5], [null, 3.5],
        ['B5', 0.5], [null, 3.5],
        ['A5', 0.5], [null, 3.5],
        ['G5', 0.5], [null, 3.5]
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
    },

    // =====================================================================
    // PASS 3D: DYNAMIC MUSIC SYSTEM
    // =====================================================================

    /**
     * Adjust tempo for current theme (boss phase changes).
     * @param {number} bpmDelta - BPM to add (e.g. +10 for phase 2)
     */
    adjustTempo: function (bpmDelta) {
      if (!this._tracks || !this.currentTheme) return;
      var theme = THEMES[this.currentTheme];
      if (!theme) return;
      var newBpm = theme.bpm + bpmDelta;
      var newBeatDuration = 60.0 / newBpm;
      for (var i = 0; i < this._tracks.length; i++) {
        this._tracks[i].beatDuration = newBeatDuration;
      }
    },

    /**
     * Mute/unmute specific tracks by index (for phase 3 bass+percussion only).
     * @param {Array<number>} trackIndices - indices to keep active
     */
    soloTracks: function (trackIndices) {
      if (!this._tracks) return;
      for (var i = 0; i < this._tracks.length; i++) {
        this._tracks[i]._muted = true;
      }
      for (var j = 0; j < trackIndices.length; j++) {
        var idx = trackIndices[j];
        if (this._tracks[idx]) {
          this._tracks[idx]._muted = false;
        }
      }
    },

    /**
     * Unmute all tracks (restore after solo).
     */
    unmuteAll: function () {
      if (!this._tracks) return;
      for (var i = 0; i < this._tracks.length; i++) {
        this._tracks[i]._muted = false;
      }
    },

    /**
     * Dip volume temporarily (for low health effect).
     * @param {number} targetVolume - volume to dip to (0-1)
     * @param {number} duration - seconds to ramp
     */
    dipVolume: function (targetVolume, duration) {
      if (!this._masterGain || !this._ctx) return;
      try {
        this._masterGain.gain.cancelScheduledValues(this._ctx.currentTime);
        this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, this._ctx.currentTime);
        this._masterGain.gain.linearRampToValueAtTime(
          targetVolume * this.masterVolume,
          this._ctx.currentTime + (duration || 0.5)
        );
      } catch (e) {}
    },

    /**
     * Restore volume after dip.
     */
    restoreVolume: function () {
      if (!this._masterGain || !this._ctx || this.muted) return;
      try {
        this._masterGain.gain.cancelScheduledValues(this._ctx.currentTime);
        this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, this._ctx.currentTime);
        this._masterGain.gain.linearRampToValueAtTime(
          this.masterVolume,
          this._ctx.currentTime + 0.5
        );
      } catch (e) {}
    }
  };

  // Patch _schedule to respect track muting
  var _origSchedule = Music._schedule;
  Music._schedule = function () {
    if (!this._ctx || !this.currentTheme) return;
    var now = this._ctx.currentTime;
    for (var i = 0; i < this._tracks.length; i++) {
      var track = this._tracks[i];
      var def = track.def;
      while (track.nextNoteTime < now + this._scheduleAhead) {
        var noteData = def.notes[track.noteIndex];
        var noteName = noteData[0];
        var beats = noteData[1];
        var duration = beats * track.beatDuration;
        if (noteName !== null && !track._muted) {
          var freq = NOTE[noteName];
          if (freq) {
            this._playNote(def.wave, freq, def.volume, track.nextNoteTime, duration);
          }
        }
        track.nextNoteTime += duration;
        track.noteIndex = (track.noteIndex + 1) % def.notes.length;
      }
    }
  };

  window.Music = Music;

})();
