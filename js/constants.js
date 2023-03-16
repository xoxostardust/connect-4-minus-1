// Default grid constants
export const GRID_COLUMNS = 7;
export const GRID_ROWS = 6;

// Default game constants
export const RED_PIECE_COUNT = 21;
export const YELLOW_PIECE_COUNT = 21;

// Sounds
export const sounds = {
    bass: new Audio('assets/sounds/bass.wav'),
    button: new Audio('assets/sounds/button.wav'),
    clickfast: new Audio('assets/sounds/clickfast.wav'),
    collide: new Audio('assets/sounds/collide.wav'),
    ping: new Audio('assets/sounds/ping.wav'),
    glassbreak: new Audio('assets/sounds/glassbreak.wav'),
    kerplunk: new Audio('assets/sounds/kerplunk.wav'),
    ouch: new Audio('assets/sounds/ouch.wav'),
    pageturn: new Audio('assets/sounds/pageturn.wav'),
    splat: new Audio('assets/sounds/splat.wav'),
    victory: new Audio('assets/sounds/victory.wav')
};

//Default winning rows for the grid
export const winningArrays = [
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [3, 4, 5, 6],
    [1, 1, 1, 1],
    [2, 2, 2, 2],
    [3, 3, 3, 3],
    [4, 4, 4, 4],
    [5, 5, 5, 5],
    [6, 6, 6, 6],
    [6, 5, 4, 3],
    [5, 4, 3, 2],
    [4, 3, 2, 1]
];
