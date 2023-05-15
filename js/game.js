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
    #stopPlaying;

    constructor(name = 'AI', team) {
        super(name, team);

        this.#stopPlaying = false;
    }

    stopPlaying() {
        this.#stopPlaying = true;
    }

    stoppedPlaying() {
        return this.#stopPlaying;
    }

    playMove(grid) {}
}

export class Timmy extends AI {
    constructor(name = 'Timmy', team) {
        super(name, team);
    }

    playMove(grid) {
        for (let i = 0; i < 14; i++) {
            const random = 1 + Math.floor(Math.random() * grid.columns);
            const previous = random - 1;
            const next = random + 1;

            const randomColumn = grid.getColumn(random);
            const previousColumn = grid.getColumn(previous);
            const nextColumn = grid.getColumn(next);

            if (randomColumn.isFull) {
                continue;
            }

            if (randomColumn.asArray().filter(p => p !== null && p.pieceType != this.team).length > 0) {
                if (previousColumn !== undefined && !previousColumn.isFull && nextColumn !== undefined && !nextColumn.isFull) {
                    this.placePiece(grid, Math.random() > 0.333 ? (Math.random() > 0.5 ? previous : next) : random);

                    return;
                } else if (previousColumn !== undefined && !previousColumn.isFull) {
                    this.placePiece(grid, Math.random() > 0.5 ? random : previous);

                    return;
                } else if (nextColumn !== undefined && !nextColumn.isFull) {
                    this.placePiece(grid, Math.random() > 0.5 ? random : next);

                    return;
                } else {
                    this.placePiece(grid, random);

                    return;
                }
            } else {
                continue;
            }
        }

        const random = 1 + Math.floor(Math.random() * grid.columns);

        const randomColumn = grid.getColumn(random);

        if (randomColumn.isFull) {
            this.playMove(grid);

            return;
        }

        this.placePiece(grid, random);
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

        for (let i = 0; i < array.length; i++) {
            const column = array[i];

            for (let j = 0; j < column.length; j++) {
                const space = column[j];

                if (space == null) {
                    continue;
                }

                let matches = [];
                let outlier = null;
                let pieceType = null;

                for (let k = j + 1; k < j + 4; k++) {
                    const nextSpace = column[k];

                    if (nextSpace && space.pieceType == nextSpace.pieceType) {
                        matches.push([i + 1, k + 1]);
                        pieceType = space.pieceType;
                    } else if (nextSpace && space.pieceType != nextSpace.pieceType && outlier == null) {
                        outlier = [i + 1, k + 1];
                        pieceType = space.pieceType;
                    } else {
                        matches = [];
                        pieceType = null;
                    }
                }

                if (matches.length > 0 && pieceType == this.team) {
                    return outlier;
                }
            }
        }

        for (let i = 0; i < largestColumn.length; i++) {
            for (let j = 0; j < array.length; j++) {
                const space = array[j][i];

                if (!space) {
                    continue;
                }

                let matches = [];
                let outlier = null;
                let pieceType = null;

                for (let k = j + 1; k < j + 4; k++) {
                    if (array[k] == undefined) {
                        continue;
                    }

                    const nextSpace = array[k][i];

                    if (nextSpace && space.pieceType == nextSpace.pieceType) {
                        matches.push([k + 1, i + 1]);
                        pieceType = space.pieceType;
                    } else if (nextSpace && space.pieceType != nextSpace.pieceType && outlier == null) {
                        outlier = [k + 1, i + 1];
                        pieceType = space.pieceType;
                    } else {
                        matches = [];
                        pieceType = null;
                    }
                }

                if (matches.length > 0 && pieceType == this.team) {
                    return outlier;
                }
            }
        }
    }

    playMove(grid) {
        for (let i = 0; i < 56; i++) {
            const random = 1 + Math.floor(Math.random() * grid.columns);
            const previous = random - 1;
            const next = random + 1;

            const randomColumn = grid.getColumn(random);
            const previousColumn = grid.getColumn(previous);
            const nextColumn = grid.getColumn(next);

            const placements = this.getPlacements(grid);

            if (randomColumn.isFull) {
                continue;
            }

            if (placements !== undefined && placements !== null) {
                if (this.canRemovePiece()) {
                    console.log(placements);

                    this.removePiece(grid, placements[0], placements[1]);

                    setTimeout(() => {
                        if (this.stoppedPlaying()) {
                            return;
                        }

                        this.playMove(grid);
                    }, 1000);

                    return;
                } else {
                    console.log(placements);
                }
            }

            if (randomColumn.asArray().filter(p => p !== null && p.pieceType != this.team).length === 3 && randomColumn.asArray().filter(p => p !== null && p.pieceType == this.team).length === 0) {
                this.placePiece(grid, random);

                return;
            } else {
                if (i < 11) {
                    continue;
                }
            }

            if (randomColumn.asArray().findIndex(p => p !== null && p.pieceType != this.team) === randomColumn.asArray().length - 1) {
                if (nextColumn !== undefined && previousColumn !== undefined) {
                    if (nextColumn.asArray().findIndex(p => p !== null && p.pieceType != this.team) === nextColumn.asArray().length - 1) {
                        const nextNext = next + 1;
                        const nextNextColumn = grid.getColumn(nextNext);

                        if (nextNextColumn !== undefined && !nextNextColumn.isFull) {
                            if (nextNextColumn.asArray().findIndex(p => p !== null && p.pieceType == this.team) === -1 && nextNextColumn.asArray().findIndex(p => p !== null && p.pieceType != this.team) === -1) {
                                console.log('next');

                                this.placePiece(grid, nextNext);

                                return;
                            }

                            if (i < 23) {
                                continue;
                            }
                        }
                    } else if (previousColumn.asArray().findIndex(p => p !== null && p.pieceType != this.team) == previousColumn.asArray().length - 1) {
                        const previousPrevious = previous - 1;
                        const previousPreviousColumn = grid.getColumn(previousPrevious);

                        if (previousPreviousColumn !== undefined && !previousPreviousColumn.isFull) {
                            if (previousPreviousColumn.asArray().findIndex(p => p !== null && p.pieceType == this.team) === -1 && previousPreviousColumn.asArray().findIndex(p => p !== null && p.pieceType != this.team) === -1) {
                                console.log('previous');

                                this.placePiece(grid, previousPrevious);

                                return;
                            }

                            if (i < 23) {
                                continue;
                            }
                        }
                    } else {
                        if (i < 23) {
                            continue;
                        }
                    }
                }
            }

            if (randomColumn.asArray().filter(p => p !== null && p.pieceType != this.team).length > 0) {
                if (previousColumn !== undefined && !previousColumn.isFull && nextColumn !== undefined && !nextColumn.isFull) {
                    this.placePiece(grid, Math.random() > 0.5 ? (Math.random() > 0.5 ? previous : next) : random);

                    return;
                } else if (previousColumn !== undefined && !previousColumn.isFull) {
                    this.placePiece(grid, Math.random() > 0.8 ? random : previous);

                    return;
                } else if (nextColumn !== undefined && !nextColumn.isFull) {
                    this.placePiece(grid, Math.random() > 0.8 ? random : next);

                    return;
                } else {
                    this.placePiece(grid, random);

                    return;
                }
            } else {
                continue;
            }
        }

        const random = 1 + Math.floor(Math.random() * grid.columns);

        const randomColumn = grid.getColumn(random);

        if (randomColumn.isFull) {
            this.playMove(grid);

            return;
        }

        this.placePiece(grid, random);
    }
}

export class MrQuick extends AI {}
