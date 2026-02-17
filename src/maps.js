/**
 * maps.js - Map/Room Data for Valisar: Shadows of the Eldspyre
 *
 * Defines all tile constants, tile properties, room layouts, and the Maps API.
 * Each room is a 16-column x 14-row grid (256x224 at 16px tiles).
 *
 * Assigns to window.T, window.TileProps, and window.Maps.
 */

(function () {
    'use strict';

    // =========================================================================
    //  Tile ID Constants
    // =========================================================================

    var T = {
        GRASS_L:      0,   // tile_grass_light  - passable
        GRASS_D:      1,   // tile_grass_dark    - passable
        PATH:         2,   // tile_path          - passable
        WATER:        3,   // tile_water         - solid
        TREE:         4,   // tile_tree          - solid
        BUSH:         5,   // tile_bush          - solid
        FLOWERS:      6,   // tile_flowers       - passable
        WOOD_WALL:    7,   // tile_wood_wall     - solid
        WOOD_FLOOR:   8,   // tile_wood_floor    - passable
        WOOD_DOOR:    9,   // tile_wood_door     - passable (transition)
        STONE_WALL:  10,   // tile_stone_wall    - solid
        STONE_FLOOR: 11,   // tile_stone_floor   - passable
        FENCE:       12,   // tile_fence         - solid
        WELL:        13,   // tile_well          - solid
        MARKET:      14,   // tile_market_stall  - solid
        TEMPLE_WALL: 15,   // tile_temple_wall   - solid
        TEMPLE_FLOOR:16,   // tile_temple_floor  - passable
        TEMPLE_DOOR: 17,   // tile_temple_door   - passable
        ALTAR:       18,   // tile_altar         - solid
        PILLAR:      19,   // tile_pillar        - solid
        TORCH:       20,   // tile_torch         - solid (wall decoration)
        CHEST:       21,   // tile_chest         - solid (interactive)
        STATUE:      22,   // tile_statue        - solid (interactive)
        BRIDGE:      23,   // tile_bridge        - passable
        ROOF:        24,   // tile_roof          - solid
        SIGN:        25,   // tile_sign          - solid (interactive)
        CARPET:      26,   // tile_carpet        - passable
        DARK:        27,   // tile_dark          - solid (void)
        SPIKE:       28,   // tile_spike         - passable (hazard)
        MUSHROOM:    29,   // tile_mushroom      - passable (decoration)
        CRACKED:     30,   // tile_cracked_floor - passable (decoration)
    };

    window.T = T;

    // =========================================================================
    //  Tile Properties
    // =========================================================================

    window.TileProps = {};

    window.TileProps[T.GRASS_L]      = { solid: false, name: 'tile_grass_light' };
    window.TileProps[T.GRASS_D]      = { solid: false, name: 'tile_grass_dark' };
    window.TileProps[T.PATH]         = { solid: false, name: 'tile_path' };
    window.TileProps[T.WATER]        = { solid: true,  name: 'tile_water' };
    window.TileProps[T.TREE]         = { solid: true,  name: 'tile_tree',  hitbox: { x: 4, y: 9, w: 8, h: 7 } };
    window.TileProps[T.BUSH]         = { solid: true,  name: 'tile_bush',  hitbox: { x: 3, y: 6, w: 10, h: 9 } };
    window.TileProps[T.FLOWERS]      = { solid: false, name: 'tile_flowers' };
    window.TileProps[T.WOOD_WALL]    = { solid: true,  name: 'tile_wood_wall' };
    window.TileProps[T.WOOD_FLOOR]   = { solid: false, name: 'tile_wood_floor' };
    window.TileProps[T.WOOD_DOOR]    = { solid: false, name: 'tile_wood_door' };
    window.TileProps[T.STONE_WALL]   = { solid: true,  name: 'tile_stone_wall' };
    window.TileProps[T.STONE_FLOOR]  = { solid: false, name: 'tile_stone_floor' };
    window.TileProps[T.FENCE]        = { solid: true,  name: 'tile_fence',  hitbox: { x: 0, y: 4, w: 16, h: 8 } };
    window.TileProps[T.WELL]         = { solid: true,  name: 'tile_well',   hitbox: { x: 1, y: 2, w: 14, h: 13 } };
    window.TileProps[T.MARKET]       = { solid: true,  name: 'tile_market_stall' };
    window.TileProps[T.TEMPLE_WALL]  = { solid: true,  name: 'tile_temple_wall' };
    window.TileProps[T.TEMPLE_FLOOR] = { solid: false, name: 'tile_temple_floor' };
    window.TileProps[T.TEMPLE_DOOR]  = { solid: false, name: 'tile_temple_door' };
    window.TileProps[T.ALTAR]        = { solid: true,  name: 'tile_altar',  hitbox: { x: 3, y: 4, w: 10, h: 8 } };
    window.TileProps[T.PILLAR]       = { solid: true,  name: 'tile_pillar', hitbox: { x: 4, y: 4, w: 8, h: 9 } };
    window.TileProps[T.TORCH]        = { solid: true,  name: 'tile_torch' };
    window.TileProps[T.CHEST]        = { solid: true,  name: 'tile_chest',  hitbox: { x: 1, y: 3, w: 14, h: 12 } };
    window.TileProps[T.STATUE]       = { solid: true,  name: 'tile_statue', hitbox: { x: 5, y: 4, w: 6, h: 11 } };
    window.TileProps[T.BRIDGE]       = { solid: false, name: 'tile_bridge' };
    window.TileProps[T.ROOF]         = { solid: true,  name: 'tile_roof' };
    window.TileProps[T.SIGN]         = { solid: true,  name: 'tile_sign',   hitbox: { x: 4, y: 5, w: 8, h: 11 } };
    window.TileProps[T.CARPET]       = { solid: false, name: 'tile_carpet' };
    window.TileProps[T.DARK]         = { solid: true,  name: 'tile_dark' };
    window.TileProps[T.SPIKE]        = { solid: false, name: 'tile_spike',  hazard: true, damage: 1 };
    window.TileProps[T.MUSHROOM]     = { solid: false, name: 'tile_mushroom' };
    window.TileProps[T.CRACKED]      = { solid: false, name: 'tile_cracked_floor' };

    // =========================================================================
    //  Shorthand aliases for readability in tile grids
    // =========================================================================

    var _  = T.GRASS_L;      // 0  light grass (default fill)
    var G  = T.GRASS_D;      // 1  dark grass
    var P  = T.PATH;         // 2  path
    var W  = T.WATER;        // 3  water
    var Tr = T.TREE;         // 4  tree
    var Bu = T.BUSH;         // 5  bush
    var Fl = T.FLOWERS;      // 6  flowers
    var WW = T.WOOD_WALL;    // 7  wood wall
    var WF = T.WOOD_FLOOR;   // 8  wood floor
    var WD = T.WOOD_DOOR;    // 9  wood door
    var SW = T.STONE_WALL;   // 10 stone wall
    var SF = T.STONE_FLOOR;  // 11 stone floor
    var Fe = T.FENCE;        // 12 fence
    var We = T.WELL;         // 13 well
    var Mk = T.MARKET;       // 14 market stall
    var TW = T.TEMPLE_WALL;  // 15 temple wall
    var TF = T.TEMPLE_FLOOR; // 16 temple floor
    var TD = T.TEMPLE_DOOR;  // 17 temple door
    var Al = T.ALTAR;        // 18 altar
    var Pi = T.PILLAR;       // 19 pillar
    var To = T.TORCH;        // 20 torch
    var Ch = T.CHEST;        // 21 chest
    var St = T.STATUE;       // 22 statue
    var Br = T.BRIDGE;       // 23 bridge
    var Ro = T.ROOF;         // 24 roof
    var Sg = T.SIGN;         // 25 sign
    var Cp = T.CARPET;       // 26 carpet
    var Dk = T.DARK;         // 27 dark/void
    var Sp = T.SPIKE;        // 28 spike trap
    var Mu = T.MUSHROOM;     // 29 mushroom
    var Cr = T.CRACKED;      // 30 cracked floor

    // =========================================================================
    //  Room Definitions
    // =========================================================================

    var rooms = {};

    // -------------------------------------------------------------------------
    //  1. EBON VALE SQUARE  (Town Center - START)
    //     The heart of Ebon Vale. Central well, The Dancing Pig tavern (left),
    //     Charmed Chaises furniture shop (right). Safe zone - no enemies.
    // -------------------------------------------------------------------------

    rooms['ebon_vale_square'] = {
        id: 'ebon_vale_square',
        name: 'Ebon Vale - Town Square',
        tiles: [
        //   0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
            [Ro,  Ro,  Ro,  _, Fl,   _,   P,   P,   P,   P,  Fl,  _,  _,  Ro,  Ro,  Ro ],  // row 0  - rooftops & exit north
            [WW,  WW,  WW,  _,  _,  Bu,   P,   P,   P,   P,  Bu,  _,  _,  WW,  WW,  WW ],  // row 1  - building fronts
            [WW,  WF,  WD,  _,  Fl,  _,   P,   P,   P,   P,   _,  Fl, _,  WD,  WF,  WW ],  // row 2  - doors
            [ _,   _,   _,  _,   _,  _,   P,   _,   _,   P,   _,   _,  _,  _,   _,   _ ],  // row 3
            [Fl,   _,   _,  _,   _,  _,   P,   _,   _,   P,   _,   _,  _,  _,   _,  Fl ],  // row 4
            [ _,   _,  Bu,  _,   _,  _,   P,  We,  Sg,   P,   _,   _,  _,  Bu,  _,   _ ],  // row 5  - well & signpost
            [ _,   _,   _,  _,  Fl,  _,   P,   _,   _,   P,   _,  Fl,  _,  _,   _,   _ ],  // row 6
            [ _,  Fl,   _,  _,   _,  _,   P,   P,   P,   P,   _,   _,  _,  _,  Fl,   _ ],  // row 7  - center row (start Y)
            [ _,   _,   _,  _,   _,   _,  P,   _,   _,   P,   _,   _,  _,  _,   _,   _ ],  // row 8
            [ _,   _,  Bu,  _,   _,  Fl,  P,   _,   _,   P,  Fl,   _,  _,  Bu,  _,   _ ],  // row 9
            [Fl,   _,   _,  _,   _,   _,  P,   _,   _,   P,   _,   _,  _,  _,   _,  Fl ],  // row 10
            [ _,   _,   _,  _,  Fl,   _,  P,   _,   _,   P,   _,  Fl,  _,  _,   _,   _ ],  // row 11
            [ _,  Bu,   _,  _,   _,  Bu,  P,   P,   P,   P,  Bu,   _,  _,  _,  Bu,   _ ],  // row 12
            [Fl,   _,   _,  _,  Sg,   _,  P,   P,   P,   P,   _,   _,  _,  _,   _,  Fl ],  // row 13 - exit south + market sign
        ],
        exits: {
            north: { room: 'ebon_vale_north',  spawnX: 7, spawnY: 12 },
            south: { room: 'ebon_vale_market', spawnX: 7, spawnY: 1  },
        },
        npcs: [
            { id: 'npc_fawks',        sprite: 'npc_fawks',        x: 3,  y: 2,  dialogue: 'fawks_greeting' },
            { id: 'npc_mayor_helena', sprite: 'npc_mayor_helena', x: 8,  y: 6,  dialogue: 'helena_greeting' },
            { id: 'npc_elira_voss',   sprite: 'npc_elira_voss',   x: 12, y: 8,  dialogue: 'elira_greeting' },
        ],
        enemies: [],
        items: [],
        signs: [
            { x: 8, y: 5, text: 'Welcome to Ebon Vale! Merchants south, forest north.' },
            { x: 4, y: 13, text: 'MARKET DISTRICT - Blacksmith & Chapel south.' }
        ],
        onEnter: null,
    };

    // -------------------------------------------------------------------------
    //  2. EBON VALE MARKET  (Market District)
    //     Farmer's market stalls, Braxon's blacksmith (lower-left),
    //     Brother Soren's small temple (lower-right). Safe zone.
    // -------------------------------------------------------------------------

    rooms['ebon_vale_market'] = {
        id: 'ebon_vale_market',
        name: 'Ebon Vale - Market District',
        tiles: [
        //   0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
            [ _,  Bu,  _,   _,   _,  Bu,  P,   P,   P,   P,  Bu,   _,  _,   _,  Bu,  _ ],  // row 0  - exit north
            [ _,   _,  _,   _,   _,   _,  P,   P,   P,   P,   _,   _,  _,   _,   _,  _ ],  // row 1
            [ _,  Mk,  _,  Fl,  Mk,  _,  P,   _,   _,   P,   _,  Mk,  Fl, Mk,   _,  _ ],  // row 2  - market stalls row 1
            [ _,   _,  _,   _,   _,  _,  P,   _,   _,   P,   _,   _,  _,   _,   _,  _ ],  // row 3
            [ _,  Fl, Mk,   _,   _,  _,  P,  Mk,  Mk,   P,   _,   _,  _,  Mk,  Fl,  _ ],  // row 4  - market stalls row 2
            [ _,   _,  _,   _,   _,  _,  P,   _,   _,   P,   _,   _,  _,   _,   _,  _ ],  // row 5
            [ _,  Sg,  _,  Fl,  _,   _,  P,   P,   P,   P,   _,   _,  Fl,  _,  Sg,  _ ],  // row 6  - shop signs
            [ _,   P,  _,   _,  _,   _,  P,   _,   _,   P,   _,   _,  _,   _,   P,  _ ],  // row 7  - paths to shops
            [SW,  SW,  P,  SW,   _,  _,   _,   _,   _,   _,   _,  _,  SW,   P,  SW,  SW ],  // row 8  - doors in north walls
            [SW,  SF,  SF, SW,   _,  Fl,  _,   _,   _,   _,  Fl,  _,  SW,  SF,  SF,  SW ],  // row 9
            [SW,  SF,  SF, SW,   _,   _,  _,   _,   _,   _,   _,  _,  SW,  SF,  SF,  SW ],  // row 10
            [SW,  SF,  SF, SW,   _,   _,  _,   _,   _,   _,   _,  _,  SW,  SF,  SF,  SW ],  // row 11
            [SW,  SW,  SW, SW,   _,   _,  _,  Fl,  Fl,   _,   _,  _,  SW,  SW,  SW,  SW ],  // row 12
            [ _,   _,   _,  _,   _,   _,  _,   _,   _,   _,   _,  _,   _,   _,   _,  _ ],  // row 13
        ],
        exits: {
            north: { room: 'ebon_vale_square', spawnX: 7, spawnY: 12 },
        },
        npcs: [
            { id: 'npc_braxon',        sprite: 'npc_braxon',        x: 1,  y: 10, dialogue: 'braxon_greeting' },
            { id: 'npc_brother_soren', sprite: 'npc_brother_soren', x: 14, y: 10, dialogue: 'soren_greeting' },
            { id: 'npc_svana',         sprite: 'npc_svana',         x: 8,  y: 3,  dialogue: 'svana_greeting' },
        ],
        enemies: [],
        items: [],
        signs: [
            { x: 1, y: 6, text: "Braxon's Forge - Bring goblin teeth to trade!" },
            { x: 14, y: 6, text: "Brother Soren's Chapel - Healing and blessings" }
        ],
        onEnter: null,
    };

    // -------------------------------------------------------------------------
    //  3. EBON VALE NORTH  (North Gate)
    //     Transition zone: town to wilderness. Fence line with gate gap.
    //     South side has houses; north side has trees encroaching.
    // -------------------------------------------------------------------------

    rooms['ebon_vale_north'] = {
        id: 'ebon_vale_north',
        name: 'Ebon Vale - North Gate',
        tiles: [
        //   0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
            [Tr,  G,  Tr,   G,  Tr,  G,   P,   P,   P,   P,   G,  Tr,  G,  Tr,   G,  Tr ],  // row 0  - exit north (forest side)
            [Tr,  G,   G,  Tr,   G,   G,  P,   G,   G,   P,   G,   G,  Tr,  G,   G,  Tr ],  // row 1
            [ G,  Tr,   G,  G,  Bu,   G,  P,   G,   G,   P,   G,  Bu,   G,  G,  Tr,   G ],  // row 2
            [ G,   G,   G,  G,   G,   G,  P,   G,   G,   P,   G,   G,   G,  G,   G,   G ],  // row 3
            [ G,   G,  Bu,  G,   G,   G,  P,  Sg,   G,   P,   G,   G,   G,  Bu,  G,   G ],  // row 4  - signpost warning
            [Fe,  Fe,  Fe, Fe,  Fe,  Fe,  P,   P,   P,   P,  Fe,  Fe,  Fe, Fe,  Fe,  Fe ],  // row 5  - fence line with gate
            [ _,   _,   _,  _,  Fl,   _,  P,   _,   _,   P,   _,  Fl,  _,  _,   _,   _ ],  // row 6
            [ _,   _,   _,  _,   _,   _,  P,   _,   _,   P,   _,   _,  _,  _,   _,   _ ],  // row 7
            [Ro,  Ro,  Ro,  _,   _,   _,  P,   _,   _,   P,   _,   _,  _,  Ro,  Ro,  Ro ],  // row 8  - houses on sides
            [WW,  WW,  WW,  _,  Fl,   _,  P,   _,   _,   P,   _,  Fl,  _,  WW,  WW,  WW ],  // row 9
            [WW,  WF,  WW,  _,   _,  Bu,  P,   _,   _,   P,  Bu,   _,  _,  WW,  WF,  WW ],  // row 10
            [ _,   _,   _,  _,   _,   _,  P,   _,   _,   P,   _,   _,  _,  _,   _,   _ ],  // row 11
            [ _,  Fl,   _,  _,   _,  Fl,  P,   P,   P,   P,  Fl,   _,  _,  _,  Fl,   _ ],  // row 12
            [ _,   _,   _,  _,   _,   _,  P,   P,   P,   P,   _,   _,  _,  _,   _,   _ ],  // row 13 - exit south
        ],
        exits: {
            north: { room: 'ebon_forest_entry', spawnX: 7, spawnY: 12 },
            south: { room: 'ebon_vale_square',   spawnX: 7, spawnY: 1  },
        },
        npcs: [],
        enemies: [],
        items: [],
        signs: [
            { x: 7, y: 4, text: 'Warning: Ebon Forest lies beyond. Travelers beware!' }
        ],
        onEnter: null,
    };

    // -------------------------------------------------------------------------
    //  4. EBON FOREST ENTRY  (Forest Entrance)
    //     Dense forest with dark grass base. Winding path through trees.
    //     First enemy encounters: 3 goblin lackeys along the path.
    //     A bush hides a potion.
    // -------------------------------------------------------------------------

    rooms['ebon_forest_entry'] = {
        id: 'ebon_forest_entry',
        name: 'Ebon Forest - Edge of Darkness',
        tiles: [
        //   0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
            [Tr,  Tr,  G,  Tr,  Tr,   G,  P,   P,   P,   P,   G,  Tr,  Tr,  G,  Tr,  Tr ],  // row 0  - exit north
            [Tr,  G,  Tr,   G,   G,   G,  P,   G,   G,   P,   G,   G,   G,  Tr,  G,  Tr ],  // row 1
            [ G,  Tr,  G,  Tr,   G,   G,  P,   G,  Tr,   G,   G,   G,  Tr,  G,  Tr,   G ],  // row 2
            [Tr,  G,   G,   G,  Bu,   G,  P,   P,   G,   G,  Tr,   G,   G,  G,   G,  Tr ],  // row 3
            [ G,  Tr,  Tr,   G,   G,   G,  G,   P,   G,   G,   G,  Bu,   G, Tr,  Tr,   G ],  // row 4
            [Tr,  G,   G,  Tr,   G,   G,  G,   P,   P,   G,   G,   G,  Tr,  G,   G,  Tr ],  // row 5
            [ G,  Tr,   G,  G,   G,  Tr,  G,   G,   P,   P,   G,  Tr,  G,   G,  Tr,   G ],  // row 6
            [Tr,  G,  Tr,   G,   G,   G,  G,   G,   G,   P,   G,   G,  G,  Tr,   G,  Tr ],  // row 7
            [ G,   G,   G,  Tr,   G,   G, Tr,   G,   G,   P,   P,   G, Tr,   G,   G,   G ],  // row 8
            [Tr,  Tr,   G,   G,  Bu,   G,  G,   G,   G,   G,   P,   G,  G,  Bu,  Tr,  Tr ],  // row 9
            [ G,   G,  Tr,   G,   G,  Tr,  G,   G,   G,   G,   P,   G, Tr,   G,   G,   G ],  // row 10
            [Tr,   G,   G,  Tr,   G,  Sg,  P,   P,   P,   P,   P,   G,  G,  Tr,   G,  Tr ],  // row 11 - warning sign
            [ G,  Tr,   G,   G,   G,   G,  P,   G,   G,   P,   G,   G,   G,  G,  Tr,   G ],  // row 12
            [Tr,   G,  Tr,   G,  Tr,   G,  P,   P,   P,   P,   G,  Tr,   G, Tr,   G,  Tr ],  // row 13 - exit south
        ],
        exits: {
            north: { room: 'ebon_forest_deep',  spawnX: 7, spawnY: 12 },
            south: { room: 'ebon_vale_north',    spawnX: 7, spawnY: 1  },
        },
        npcs: [],
        enemies: [
            { type: 'goblin_lackey', x: 7,  y: 3  },
            { type: 'goblin_lackey', x: 9,  y: 7  },
            { type: 'goblin_lackey', x: 10, y: 10 },
            { type: 'goblin_archer', x: 3,  y: 5  },
        ],
        items: [
            { type: 'item_potion', x: 4, y: 9, id: 'forest_entry_potion' },
        ],
        signs: [
            { x: 5, y: 11, text: 'Beware! Goblins infest the path ahead.' }
        ],
        onEnter: null,
    };

    // -------------------------------------------------------------------------
    //  5. EBON FOREST DEEP  (Deep Forest - Que'Rubra's Grove)
    //     Mysterious deeper forest with a central clearing for Que'Rubra.
    //     A stream (water) runs along the east side with a bridge.
    //     Enemies: 2 goblins, 1 spinecleaver. NPC: Que'Rubra.
    // -------------------------------------------------------------------------

    rooms['ebon_forest_deep'] = {
        id: 'ebon_forest_deep',
        name: "Ebon Forest - Que'Rubra's Grove",
        tiles: [
        //   0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
            [Tr,  Tr,  G,  Tr,   G,  Tr,  P,   P,   P,   P,  Tr,   G,  W,   W,   G,  Tr ],  // row 0  - exit north
            [Tr,  G,  Tr,   G,  Tr,   G,  P,   G,   G,   P,   G,  Tr,  W,   G,  Tr,   G ],  // row 1
            [ G,  Tr,   G,   G,   G,   G,  P,   G,   G,   P,   G,   G,  W,   G,   G,  Tr ],  // row 2
            [Tr,   G,   G,  Tr,   G,   G,  P,   P,   P,   P,   G,   G,  W,  Tr,   G,   G ],  // row 3
            [ G,  Tr,   G,   G,   G,   G,  G,   G,   G,   G,   G,   G,  W,   G,  Tr,   G ],  // row 4
            [Tr,   G,   G,   G,  Bu,  G,   G,   G,   G,   G,   G,   G, Br,   G,   G,  Tr ],  // row 5  - bridge
            [ G,  Tr,   G,   G,   G,  G,   G,   G,   G,   G,  Bu,   G,  W,   G,  Tr,   G ],  // row 6
            [Tr,   G,   G,  Bu,  G,   G,   G,  Fl,  Fl,   G,   G,   G,  W,   G,   G,  Tr ],  // row 7  - clearing center
            [ G,  Tr,   G,   G,  G,   G,  Fl,   G,   G,  Fl,   G,   G,  W,  Tr,   G,   G ],  // row 8
            [Tr,   G,  Tr,   G,  G,   G,   G,   G,   G,   G,   G,   G,  W,   G,  Tr,   G ],  // row 9
            [ G,   G,   G,  Tr,  G,  Bu,   G,   G,   G,   G,  Bu,   G,  W,   G,   G,  Tr ],  // row 10
            [Tr,  Tr,   G,   G,  G,   G,   P,   P,   P,   P,   G,   G,  W,  Tr,   G,   G ],  // row 11
            [ G,   G,  Tr,   G, Tr,   G,   P,   G,   G,   P,   G,  Tr,  W,   G,  Tr,   G ],  // row 12
            [Tr,   G,  Tr,  Tr,  G,  Tr,   P,   P,   P,   P,  Tr,   G,  W,   W,   G,  Tr ],  // row 13 - exit south
        ],
        exits: {
            north: { room: 'temple_entrance',    spawnX: 7, spawnY: 12 },
            south: { room: 'ebon_forest_entry',  spawnX: 7, spawnY: 1  },
        },
        npcs: [
            { id: 'npc_querubra', sprite: 'npc_querubra', x: 7, y: 7, dialogue: 'querubra_greeting' },
        ],
        enemies: [
            { type: 'goblin_lackey',   x: 3,  y: 3 },
            { type: 'goblin_lackey',   x: 10, y: 10 },
            { type: 'spinecleaver',    x: 14, y: 5 },
            { type: 'goblin_archer',   x: 6,  y: 9 },
        ],
        items: [
            { type: 'item_potion', x: 4, y: 5, id: 'deep_forest_potion' },
        ],
        onEnter: null,
    };

    // -------------------------------------------------------------------------
    //  6. TEMPLE ENTRANCE  (Temple of Nitriti - Entry Hall)
    //     Dark stone temple interior. Torches on walls, defaced statues,
    //     pillars along sides, carpet runner down the middle.
    //     Enemies: 2 spinecleavers guarding the hall.
    // -------------------------------------------------------------------------

    rooms['temple_entrance'] = {
        id: 'temple_entrance',
        name: 'Temple of Nitriti - Entry Hall',
        tiles: [
        //   0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
            [TW,  TW,  TW,  TW,  TW,  TW,  TW,  TD,  TD,  TW,  TW,  TW,  TW,  TW,  TW,  TW ],  // row 0  - exit north (door)
            [TW,  To,  TF,  TF,  Pi,  TF,  TF,  Cp,  Cp,  TF,  TF,  Pi,  TF,  TF,  To,  TW ],  // row 1
            [TW,  TF,  Cr,  TF,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  TF,  Cr,  TF,  TW ],  // row 2  - cracked floor
            [TW,  TF,  St,  TF,  TF,  Sp,  TF,  Cp,  Cp,  TF,  Sp,  TF,  TF,  St,  TF,  TW ],  // row 3  - spike traps + statues
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 4
            [TW,  To,  TF,  TF,  Pi,  TF,  TF,  Cp,  Cp,  TF,  TF,  Pi,  TF,  TF,  To,  TW ],  // row 5  - pillars & torches
            [TW,  TF,  TF,  Sp,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  Sp,  TF,  TF,  TW ],  // row 6  - spike traps
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 7
            [TW,  TF,  St,  TF,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  TF,  St,  TF,  TW ],  // row 8  - more defaced statues
            [TW,  To,  TF,  TF,  Pi,  TF,  TF,  Cp,  Cp,  TF,  TF,  Pi,  TF,  TF,  To,  TW ],  // row 9  - pillars & torches
            [TW,  TF,  TF,  TF,  TF,  Sp,  TF,  Cp,  Cp,  TF,  Sp,  TF,  TF,  TF,  TF,  TW ],  // row 10 - spike traps
            [TW,  TF,  Cr,  TF,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  TF,  Cr,  TF,  TW ],  // row 11 - cracked floor
            [TW,  TW,  TW,  TW,  TW,  TF,  TF,  Cp,  Cp,  TF,  TF,  TW,  TW,  TW,  TW,  TW ],  // row 12
            [Dk,  Dk,  Dk,  Dk,  TW,  TW,  TW,  TD,  TD,  TW,  TW,  TW,  Dk,  Dk,  Dk,  Dk ],  // row 13 - exit south (entrance from forest)
        ],
        exits: {
            north: { room: 'temple_puzzle',      spawnX: 7, spawnY: 12 },
            south: { room: 'ebon_forest_deep',   spawnX: 7, spawnY: 1  },
        },
        npcs: [],
        enemies: [
            { type: 'spinecleaver', x: 4,  y: 4 },
            { type: 'spinecleaver', x: 11, y: 8 },
        ],
        items: [],
        onEnter: 'temple_entrance_ambience',
    };

    // -------------------------------------------------------------------------
    //  7. TEMPLE PUZZLE  (Puzzle Chamber)
    //     Central statue of the Ascendant Shadow. Three alcoves:
    //       Left   (Crown)   - guarded by 2 goblins
    //       Right  (Cape)    - guarded by 2 goblins
    //       Top    (Scepter) - guarded by 2 goblins
    //     North passage to boss (locked until puzzle solved).
    // -------------------------------------------------------------------------

    rooms['temple_puzzle'] = {
        id: 'temple_puzzle',
        name: 'Temple of Nitriti - Antechamber of Shadows',
        tiles: [
        //   0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
            [TW,  TW,  TW,  TW,  TW,  TW,  TW,  TD,  TD,  TW,  TW,  TW,  TW,  TW,  TW,  TW ],  // row 0  - north exit (locked door to boss)
            [TW,  TF,  TF,  TW,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TW,  TF,  TF,  TW ],  // row 1
            [TW,  TF,  TF,  TW,  To,  TF,  TF,  TF,  TF,  TF,  TF,  To,  TW,  TF,  TF,  TW ],  // row 2  - top alcove (scepter)
            [TW,  TF,  Ch,  TW,  Pi,  TF,  TF,  TF,  TF,  TF,  TF,  Pi,  TW,  Ch,  TF,  TW ],  // row 3  - chests in side alcoves
            [TW,  TF,  TF,  TW,  TW,  TW,  Pi,  TF,  TF,  Pi,  TW,  TW,  TW,  TF,  TF,  TW ],  // row 4  - alcove walls
            [TW,  TF,  TF,  TW,  TW,  TF,  TF,  TF,  TF,  TF,  TF,  TW,  TW,  TF,  TF,  TW ],  // row 5
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 6
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  St,  St,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 7  - central statue (Ascendant Shadow)
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 8
            [TW,  To,  TF,  TF,  Pi,  TF,  TF,  TF,  TF,  TF,  TF,  Pi,  TF,  TF,  To,  TW ],  // row 9
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 10
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 11
            [TW,  TW,  TW,  TW,  TW,  TF,  TF,  Cp,  Cp,  TF,  TF,  TW,  TW,  TW,  TW,  TW ],  // row 12
            [Dk,  Dk,  Dk,  Dk,  TW,  TW,  TW,  TD,  TD,  TW,  TW,  TW,  Dk,  Dk,  Dk,  Dk ],  // row 13 - exit south
        ],
        exits: {
            north: { room: 'temple_boss',       spawnX: 7, spawnY: 12 },
            south: { room: 'temple_entrance',   spawnX: 7, spawnY: 1  },
        },
        npcs: [],
        enemies: [
            // Left alcove guards
            { type: 'goblin_lackey', x: 1,  y: 2 },
            { type: 'goblin_lackey', x: 2,  y: 4 },
            // Right alcove guards
            { type: 'goblin_lackey', x: 14, y: 2 },
            { type: 'goblin_lackey', x: 13, y: 4 },
            // Top alcove guards
            { type: 'goblin_lackey', x: 7,  y: 2 },
            { type: 'goblin_lackey', x: 8,  y: 2 },
        ],
        items: [
            { type: 'item_crown',   x: 2,  y: 3, id: 'puzzle_crown' },
            { type: 'item_cape',    x: 13, y: 3, id: 'puzzle_cape' },
            { type: 'item_scepter', x: 7,  y: 1, id: 'puzzle_scepter' },
        ],
        onEnter: 'temple_puzzle_check',
    };

    // -------------------------------------------------------------------------
    //  8. TEMPLE BOSS  (Boss Chamber - Queen Bargnot)
    //     Large open arena. 4 pillars in diamond for cover.
    //     Altar at north where Rorik is bound. Torches in corners.
    //     Carpet to altar. Boss spawns center.
    // -------------------------------------------------------------------------

    rooms['temple_boss'] = {
        id: 'temple_boss',
        name: 'Temple of Nitriti - Inner Sanctum',
        tiles: [
        //   0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
            [TW,  TW,  TW,  TW,  TW,  TW,  TW,  TW,  TW,  TW,  TW,  TW,  TW,  TW,  TW,  TW ],  // row 0  - back wall
            [TW,  To,  TF,  TF,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  TF,  TF,  To,  TW ],  // row 1  - torches in corners
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  Al,  Al,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 2  - ALTAR (Rorik bound here)
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 3
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  Pi,  Cp,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 4  - top pillar of diamond
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 5
            [TW,  TF,  TF,  TF,  Pi,  TF,  TF,  Cp,  Cp,  TF,  TF,  Pi,  TF,  TF,  TF,  TW ],  // row 6  - left & right pillars
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 7  - center (boss spawn)
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  Cp,  Pi,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 8  - bottom pillar of diamond
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 9
            [TW,  TF,  TF,  TF,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  TF,  TF,  TF,  TW ],  // row 10
            [TW,  To,  TF,  TF,  TF,  TF,  TF,  Cp,  Cp,  TF,  TF,  TF,  TF,  TF,  To,  TW ],  // row 11 - torches in bottom corners
            [TW,  TW,  TW,  TW,  TW,  TF,  TF,  Cp,  Cp,  TF,  TF,  TW,  TW,  TW,  TW,  TW ],  // row 12
            [Dk,  Dk,  Dk,  Dk,  TW,  TW,  TW,  TD,  TD,  TW,  TW,  TW,  Dk,  Dk,  Dk,  Dk ],  // row 13 - exit south (locked during boss)
        ],
        exits: {
            south: { room: 'temple_puzzle', spawnX: 7, spawnY: 1 },
        },
        npcs: [
            { id: 'npc_rorik_bound', sprite: 'npc_rorik', x: 7, y: 2, dialogue: 'rorik_rescue' },
        ],
        enemies: [],  // boss is spawned programmatically via onEnter
        items: [],
        onEnter: 'temple_boss_encounter',
    };

    // =========================================================================
    //  window.Maps API
    // =========================================================================

    var TILE_SIZE = 16;
    var COLS = 16;
    var ROWS = 14;

    window.Maps = {
        T: T,
        rooms: rooms,
        currentRoom: null,
        startRoom: 'ebon_vale_square',
        startX: 7,
        startY: 7,

        TILE_SIZE: TILE_SIZE,
        COLS: COLS,
        ROWS: ROWS,

        /**
         * Retrieve a room by its string ID.
         * @param {string} id - Room identifier (e.g. 'ebon_vale_square').
         * @returns {Object|undefined} The room object, or undefined if not found.
         */
        getRoom: function (id) {
            return this.rooms[id];
        },

        /**
         * Get the tile ID at a specific column/row in a room.
         * Returns T.DARK (27) for out-of-bounds coordinates.
         * @param {Object} room - A room object.
         * @param {number} col  - Column index (0-15).
         * @param {number} row  - Row index (0-13).
         * @returns {number} Tile ID.
         */
        getTile: function (room, col, row) {
            if (!room || !room.tiles) { return T.DARK; }
            if (row < 0 || row >= ROWS || col < 0 || col >= COLS) { return T.DARK; }
            return room.tiles[row][col];
        },

        /**
         * Check whether the tile at (col, row) in the given room is solid.
         * Out-of-bounds tiles are treated as solid.
         * @param {Object} room - A room object.
         * @param {number} col  - Column index.
         * @param {number} row  - Row index.
         * @returns {boolean} True if solid.
         */
        isSolid: function (room, col, row) {
            var tileId = this.getTile(room, col, row);
            var props = window.TileProps[tileId];
            return props ? props.solid : true;
        },

        /**
         * Convert pixel coordinates to the tile at that position.
         * @param {Object} room   - A room object.
         * @param {number} pixelX - X position in pixels.
         * @param {number} pixelY - Y position in pixels.
         * @returns {number} Tile ID at the pixel location.
         */
        getTileAt: function (room, pixelX, pixelY) {
            var col = Math.floor(pixelX / TILE_SIZE);
            var row = Math.floor(pixelY / TILE_SIZE);
            return this.getTile(room, col, row);
        },

        /**
         * Pixel-level solidity check with sub-tile hitbox support.
         * Tiles with a hitbox property only block the defined sub-region,
         * allowing players to walk past tree canopies, bush edges, etc.
         * @param {Object} room   - A room object.
         * @param {number} pixelX - X position in pixels.
         * @param {number} pixelY - Y position in pixels.
         * @returns {boolean} True if the pixel position is blocked.
         */
        isSolidAt: function (room, pixelX, pixelY) {
            var col = Math.floor(pixelX / TILE_SIZE);
            var row = Math.floor(pixelY / TILE_SIZE);
            var tileId = this.getTile(room, col, row);
            var props = window.TileProps[tileId];
            if (!props || !props.solid) return false;

            // Sub-tile hitbox: only the defined region within the tile is solid
            if (props.hitbox) {
                var localX = pixelX - col * TILE_SIZE;
                var localY = pixelY - row * TILE_SIZE;
                var hb = props.hitbox;
                return localX >= hb.x && localX < hb.x + hb.w &&
                       localY >= hb.y && localY < hb.y + hb.h;
            }

            return true;
        },
    };

})();
