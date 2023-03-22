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

        // console.log(randomColumn);

        if (grid.getColumn(randomColumn).isFull) {
            this.play(grid);

            return;
        }

        this.placePiece(grid, randomColumn);
    }
}

export class Jason extends AI {
    constructor(name = 'Jason', team) {
        super(name, team);
    }

    getPositions(grid) {
        const array = grid.asArray();

        const largestColumn = grid
            .asArray()
            .sort((a, b) => a.length > b.length)
            .shift();

        let allMatches = [];

        // Check for a Connect 4 in columns first
        for (let i = 0; i < array.length; i++) {
            const column = array[i];

            for (let j = 0; j < column.length; j++) {
                const space = column[j];

                if (space == null) {
                    continue;
                }

                let matches = [];

                for (let k = j + 1; k < j + 4; k++) {
                    const nextSpace = column[k];

                    if (nextSpace && space.pieceType == nextSpace.pieceType) {
                        matches.push([i + 1, k + 1]);
                    } else {
                        matches = [];
                    }
                }

                if (matches.length >= 2) {
                    allMatches.push([i + 1, j + 1], ...matches);
                }
            }
        }

        // Check for rows second
        for (let i = 0; i < largestColumn.length; i++) {
            for (let j = 0; j < array.length; j++) {
                const space = array[j][i];

                if (!space) {
                    continue;
                }

                let matches = [];

                for (let k = j + 1; k < j + 4; k++) {
                    if (array[k] == undefined) {
                        continue;
                    }

                    const nextSpace = array[k][i];

                    if (nextSpace && space.pieceType == nextSpace.pieceType) {
                        matches.push([k + 1, i + 1]);
                    } else {
                        matches = [];
                    }
                }

                if (matches.length >= 2) {
                    allMatches.push([j + 1, i + 1], ...matches);
                }
            }
        }

        // Check for positive-sloped diagonals next
        for (let i = 0; i < array.length; i++) {
            for (let j = 0; j < largestColumn.length; j++) {
                const column = array[i];

                if (column == undefined) {
                    continue;
                }

                const space = column[j];

                if (space == undefined) {
                    continue;
                }

                let matches = [];

                let x = 1;
                for (let k = i + 1; k < i + 4; k++) {
                    const nextColumn = array[k];

                    if (nextColumn == undefined) {
                        continue;
                    }

                    const nextSpace = nextColumn[j - x];

                    if (nextSpace && space.pieceType == nextSpace.pieceType) {
                        matches.push([k + 1, j + 1 - x]);
                    } else {
                        matches = [];
                    }

                    if (matches.length >= 2) {
                        allMatches.push([i + 1, j + 1], ...matches);
                    }

                    x++;
                }
            }
        }

        // Check for negative-sloped diagonals last
        for (let i = 0; i < array.length; i++) {
            for (let j = 0; j < largestColumn.length; j++) {
                const column = array[i];

                if (column == undefined) {
                    continue;
                }

                const space = column[j];

                if (space == undefined) {
                    continue;
                }

                let matches = [];

                let x = 1;
                for (let k = i + 1; k < i + 4; k++) {
                    const nextColumn = array[k];

                    if (nextColumn == undefined) {
                        continue;
                    }

                    const nextSpace = nextColumn[j + x];

                    if (nextSpace && space.pieceType == nextSpace.pieceType) {
                        matches.push([k + 1, j + 1 + x]);
                    } else {
                        matches = [];
                    }

                    if (matches.length >= 2) {
                        allMatches.push([i + 1, j + 1], ...matches);
                    }

                    x++;
                }
            }
        }

        return allMatches;
    }

    getLastPosition(positions) {
        const ps = positions.map(([column, _]) => column).sort((a, b) => a - b);

        let x = 0;

        while (ps[x] && ps[x + 1]) {
            a = ps[x];
            b = ps[x + 1];

            if (b - a != 1) {
                return Math.floor((b * a) / 2);
            }
        }

        return -1;
    }

    playMove(grid) {
        const randomColumn = 1 + Math.floor(Math.random() * grid.columns);

        const positions = this.getPositions(grid);

        if (positions.length > 0) {
            if (this.canRemovePiece()) {
                for (const [column, row] of positions) {
                    const gridSpace = grid.getColumn(column).asArray()[row - 1];

                    if (gridSpace.pieceType == (this.team == PlayerTeam.RED ? PieceType.RED : PieceType.YELLOW)) {
                        const position = this.getLastPosition(positions);

                        if (position != -1) {
                            this.placePiece(grid, position);
                        } else {
                            this.placePiece(grid, Math.random() > 3 / 7 ? Math.max(1, Math.min(Math.random() > 0.5 ? column + 1 : column - 1, GRID_COLUMNS)) : column);
                        }

                        return;
                    }

                    this.remove();

                    this.removePiece(grid, column, row);

                    setTimeout(() => {
                        this.placePiece(grid, column);
                    }, 500);

                    return;
                }
            } else {
                const position = this.getLastPosition(positions);

                this.placePiece(grid, Math.random() > 3 / 7 ? Math.max(1, Math.min(Math.random() > 0.5 ? position + 1 : position - 1, GRID_COLUMNS)) : position);
            }
        }

        if (grid.getColumn(randomColumn).isFull) {
            this.play(grid);

            return;
        }

        this.placePiece(grid, randomColumn);
    }
}

export class MrQuick extends AI {}
