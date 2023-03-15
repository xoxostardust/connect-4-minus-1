import { RED_PIECE_COUNT, YELLOW_PIECE_COUNT } from './constants.js';
import { GameType, PieceType, PlayerTeam } from './enums.js';
import { PlayerAlreadyUsedAbilityError, PlayerHasNoPiecesError } from './errors.js';
import { Grid, GridPiece } from './grid.js';

export class Player {
    #name;
    #team;
    #pieces;
    #piecePile;
    #playing;
    #removing;
    #played;
    #remove;
    #onPlaying;
    #onRemoving;
    #usedSpecial;

    constructor(name = 'Anonymous Player', team = PlayerTeam.RED) {
        this.#name = name;
        this.#team = team;
        this.#pieces = [];
        // This array stores the pieces that the player has removed
        this.#piecePile = [];
        // This determines whether or not it is the player's turn
        this.#playing = false;
        this.#removing = false;

        this.#played = [];
        this.#onPlaying = [];
        this.#onRemoving = [];

        // This determines whether or not the player has removed a piece yet
        this.#usedSpecial = false;

        const pieces = this.#pieces;

        // Each player will receive 21 of their own team pieces
        switch (this.#team) {
            case PlayerTeam.RED:
                for (let i = 0; i < RED_PIECE_COUNT; i++) {
                    pieces.push(new GridPiece(PieceType.RED));
                }
                break;

            case PlayerTeam.YELLOW:
                for (let i = 0; i < YELLOW_PIECE_COUNT; i++) {
                    pieces.push(new GridPiece(PieceType.YELLOW));
                }
                break;

            default:
                break;
        }
    }

    get name() {
        return this.#name;
    }

    get team() {
        return this.#team;
    }

    // Interface with the grid to place or remove pieces
    placePiece(grid, column) {
        if (!this.#playing) {
            return;
        }

        if (!this.getRemainingPieces().length > 0) {
            throw new PlayerHasNoPiecesError('The player has no pieces to place');
        }

        const piece = this.#pieces.pop();
        const gridColumn = grid.getColumn(column);

        gridColumn.placePiece(piece);

        this.#playing = !this.#playing;

        this.#played.forEach(f => f());
    }

    removePiece(grid, column, s) {
        if (!this.#playing) {
            return;
        }

        if (!this.canRemovePiece()) {
            throw new PlayerAlreadyUsedAbilityError('The player cannot remove another piece');
        }

        const gridColumn = grid.getColumn(column);

        const piece = gridColumn.removePiece(s);

        this.#piecePile.push(piece);

        this.#usedSpecial = true;
    }

    // Determines whether or not the player can remove a piece
    canRemovePiece() {
        return !this.#usedSpecial;
    }

    // Returns an array of the remaining pieces the player has
    getRemainingPieces() {
        return [...this.#pieces];
    }

    // Turn functions
    play() {
        this.#playing = true;

        this.#onPlaying.forEach(f => f());
    }

    remove() {
        this.#remove = true;

        this.#onRemoving.forEach(f => f());
    }

    played(f) {
        this.#played.push(f);

        return f;
    }

    onPlaying(f) {
        this.#onPlaying.push(f);

        return f;
    }

    onRemoving(f) {
        this.#onRemoving.push(f);

        return f;
    }

    isPlaying() {
        return this.#playing;
    }

    isRemoving() {
        return this.#removing;
    }
}

export class AI extends Player {
    constructor(name = 'AI', team) {
        super(name, team);
    }
}

// The game will feature two players only (one may be an AI)
export class Game {
    #playerOne;
    #playerTwo;
    #grid;

    constructor(playerOne = new Player(PlayerTeam.RED), playerTwo = new AI(PlayerTeam.YELLOW), grid = new Grid()) {
        this.#playerOne = playerOne;
        this.#playerTwo = playerTwo;

        this.#grid = grid;

        this.#playerOne.played(() => {
            console.log('player one played');

            this.#playerTwo.play();
        });

        this.#playerTwo.played(() => {
            console.log('player two played');

            this.#playerOne.play();
        });

        Math.random() > 0.5 ? playerOne.play() : playerTwo.play();
    }

    get grid() {
        return this.#grid;
    }

    getPlayerOne() {
        return this.#playerOne;
    }

    getPlayerTwo() {
        return this.#playerTwo;
    }
}


