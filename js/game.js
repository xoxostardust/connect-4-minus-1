import { RED_PIECE_COUNT, YELLOW_PIECE_COUNT } from './constants.js';
import { GameType, PieceType, PlayerTeam } from './enums.js';
import { Grid, GridPiece } from './grid.js';

export class Player {
    #team;
    #pieces;
    #piecePile;

    constructor(team = PlayerTeam.RED) {
        this.#team = team;
        this.#pieces = [];
        // This array stores the pieces that the player has removed
        this.#piecePile = [];

        const pieces = this.#pieces;

        // Each player will receive 21 pieces of their team
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

    get team() {
        return this.#team;
    }

    // Interface with the grid to place or remove pieces
    placePiece(grid, column) {
        const piece = this.#pieces.pop();
        const gridColumn = grid.getColumn(column);

        gridColumn.placePiece(piece);
    }

    removePiece(grid, column, s) {
        const gridColumn = grid.getColumn(column);

        const piece = gridColumn.removePiece(s);

        this.#piecePile.push(piece);
    }

    // Returns an array of the remaining pieces the player has
    getRemainingPieces() {
        return [...this.#pieces];
    }
}

export class AI extends Player {
    #name;
    #rank;
    #profile;

    constructor(team, name = 'Anonymous', rank = 1, profile = '') {
        super(team);

        this.#name = name;
        this.#rank = rank;
        this.#profile = profile;
    }

    get name() {
        return this.#name;
    }

    get rank() {
        return this.#rank;
    }

    get profile() {
        return this.#profile;
    }
}

// The game will feature two players only (one may be an AI)
export class Game {
    #gameType;
    #playerOne;
    #playerTwo;

    constructor(gameType = GameType.ONE_PLAYER, grid = new Grid()) {
        this.#gameType = gameType;
        this.#grid = grid;

        // Player 1 will always be red, and player 2 is yellow
        this.#playerOne = new Player(PlayerTeam.RED);

        switch (this.#gameType) {
            case GameType.ONE_PLAYER:
                this.#playerTwo = new AI(PlayerTeam.YELLOW);
                break;

            // TODO: implement trystero p2p multiplayer
            case GameType.TWO_PLAYERS:
                this.#playerTwo = new Player(PlayerTeam.YELLOW);
                break;

            default:
                break;
        }
    }

    get gameType() {
        return this.#gameType;
    }

    getPlayerOne() {
        return this.#playerOne;
    }

    getPlayerTwo() {
        return this.#playerTwo;
    }
}
