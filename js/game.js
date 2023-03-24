import { GRID_COLUMNS, RED_PIECE_COUNT, YELLOW_PIECE_COUNT } from './constants.js';
import { PieceType, PlayerTeam } from './enums.js';
import { PlayerAlreadyUsedAbilityError, PlayerHasNoPiecesError } from './errors.js';
import { GridPiece } from './grid.js';

export class Player {
    #name;
    #team;
    #pieces;
    #piecePile;
    #playing;
    #removing;
    #played;
    #removed;
    #onPlaying;
    #onRemoving;
    #usedSpecial;

    constructor(name = 'You', team = PlayerTeam.RED) {
        this.#name = name;
        this.#team = team;
        this.#pieces = [];
        // This array stores the pieces that the player has removed
        this.#piecePile = [];
        // This determines whether or not it is the player's turn
        this.#playing = false;
        this.#removing = false;

        this.#played = [];
        this.#removed = [];
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

        this.#played.forEach(f => f(column));
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

        this.#removing = !this.#removing;

        this.#removed.forEach(f => f(column, s));
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
        this.#removing = true;

        this.#onRemoving.forEach(f => f());
    }

    played(f) {
        this.#played.push(f);

        return f;
    }

    removed(f) {
        this.#removed.push(f);

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

    playMove(grid) {}
}

export class Timmy extends AI {
    constructor(name = 'Timmy', team) {
        super(name, team);
    }

    playMove(grid) {
        const randomColumn = 1 + Math.floor(Math.random() * grid.columns);

        if (grid.getColumn(randomColumn).isFull) {
            this.playMove(grid);

            return;
        }

        this.placePiece(grid, randomColumn);
    }
}

export class Jason extends AI {
    constructor(name = 'Jason', team) {
        super(name, team);
    }

    getPlacements(grid) {
        const array = grid.asArray();

        const largestColumn = grid
            .asArray()
            .sort((a, b) => a.length > b.length)
            .shift();

        const allMatches = [];

        for (let i = 0; i < array.length; i++) {
            const column = array[i];

            for (let j = 0; j < column.length; j++) {
                const space = column[j];

                if (space == null) {
                    continue;
                }

                const matches = [];

                for (let k = j + 1; k < j + 4; k++) {
                    const nextSpace = column[k];

                    if (nextSpace && space.pieceType == nextSpace.pieceType && nextSpace.pieceType == (this.team == PlayerTeam.RED ? PieceType.YELLOW : PieceType.RED)) {
                        matches.push([i + 1, k + 1]);
                    }
                }

                if (matches.length >= 2) {
                    allMatches.push([i + 1, j + 1], ...matches);
                }
            }
        }

        for (let i = 0; i < largestColumn.length; i++) {
            for (let j = 0; j < array.length; j++) {
                const space = array[j][i];

                if (!space) {
                    continue;
                }

                const matches = [];

                for (let k = j + 1; k < j + 4; k++) {
                    if (array[k] == undefined) {
                        continue;
                    }

                    const nextSpace = array[k][i];

                    if (nextSpace && space.pieceType == nextSpace.pieceType && nextSpace.pieceType == (this.team == PlayerTeam.RED ? PieceType.YELLOW : PieceType.RED)) {
                        matches.push([k + 1, i + 1]);
                    }
                }

                if (matches.length >= 2) {
                    allMatches.push([j + 1, i + 1], ...matches);
                }
            }
        }

        return allMatches;
    }

    playMove(grid) {
        const array = grid.asArray();

        const placements = this.getPlacements(grid);

        const randomColumn = 1 + Math.floor(Math.random() * grid.columns);

        if (placements.length > 0) {
            let c;
            let r;

            for (const [column, row] of placements) {
                c = c == undefined ? column : Math.abs(column - c);
                r = r == undefined ? row : Math.abs(row - r);
            }

            if (!c > 0) {
                c = 1;
            }

            if (!r > 0) {
                r = 1;
            }

            const column = array[c - 1];

            if (column[r - 2] && column[r - 2].pieceType == (this.team == PlayerTeam.RED ? PieceType.YELLOW : PieceType.RED) && column[r] == null) {
                if (this.canRemovePiece()) {
                    this.remove();

                    this.removePiece(grid, c, r);

                    setTimeout(() => this.placePiece(grid, c), 1000);

                    return;
                }
            }

            if (column[r - 2] && column[r] && column[r - 1].pieceType == column[r - 2].pieceType && column[r - 1].pieceType == column[r].pieceType) {
                if (!grid.getColumn(c).isFull) {
                    this.placePiece(grid, c);

                    return;
                }
            }

            if ((array[c - 3] && array[c + 1] && array[c - 3][r - 1] == null && array[c + 1][r - 1] == null) || (array[c - 3] && array[c - 3][r - 1] == null && array[c - 2] && array[c - 2][r - 1] != null) || (array[c + 1] && array[c + 1][r - 1] == null && array[c] && array[c][r - 1] != null)) {
                if (this.canRemovePiece() && column[r - 1] && column[r - 1].pieceType == (this.team == PlayerTeam.RED ? PieceType.YELLOW : PieceType.RED)) {
                    this.remove();

                    this.removePiece(grid, c, r);

                    setTimeout(() => this.placePiece(grid, randomColumn), 1000);

                    return;
                } else {
                    if (!grid.getColumn(c).isFull) {
                        this.placePiece(grid, c);

                        return;
                    }
                }
            }
        }

        if (grid.getColumn(randomColumn).isFull) {
            this.playMove(grid);

            return;
        }

        this.placePiece(grid, randomColumn);
    }
}

export class MrQuick extends AI {}
