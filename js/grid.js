import { GRID_COLUMNS, GRID_ROWS } from './constants.js';
import { PieceType } from './enums.js';
import { ColumnIsFullError } from './errors.js';

export class GridPiece {
    constructor(pieceType = PieceType.RED) {
        this.pieceType = pieceType;
    }
}

class GridColumn {
    #row;

    constructor(rows = GRID_ROWS) {
        let rowArray = [];

        for (let i = 0; i < rows; i++) {
            rowArray.push(null);
        }

        this.rows = rows;
        this.#row = rowArray;
        this.#onPiecePlaced = () => {};
        this.#onPieceRemoved = () => {};
        this.isFull = false;
    }

    // Internal function used by placePiece to get the last piece in the column (sets isFull true if the column is full)
    #getLast() {
        for (let i = this.#row.length - 1; i > -1; i--) {
            if (this.#row[i] == null) {
                if (i == 0) {
                    this.isFull = true;
                }

                return i;
            }
        }

        return -1;
    }

    // Internal function used by removePiece to shift the pieces in the column to the bottom
    #shift() {
        const row = this.#row;

        for (let i = row.length - 1; i > -1; i--) {
            if (row[i] == null) {
                row.splice(i, 1);

                break;
            }
        }

        row.unshift(null);
    }

    // Places a piece gridPiece in the column and drops it to the bottom
    placePiece(gridPiece) {
        if (!(gridPiece instanceof GridPiece)) {
            throw new TypeError('gridPiece must be an instance of GridPiece');
        }

        const last = this.#getLast();

        if (last > -1) {
            this.#row[last] = gridPiece;
            this.#onPiecePlaced(gridPiece);
        } else {
            throw new ColumnIsFullError('Cannot place gridPiece because this column is full');
        }
    }

    // Removes a piece in the column and shifts the pieces in the column to the bottom
    removePiece(s = 1) {
        const piece = this.#row[s - 1];

        this.#row[s - 1] = null;
        this.isFull = false;
        this.#shift();
        this.#onPieceRemoved(s, piece);

        return piece;
    }

    asArray() {
        return [...this.#row];
    }

    onPiecePlaced(f) {
        this.#onPiecePlaced = f;

        return this.#onPiecePlaced;
    }

    onPieceRemoved(f) {
        this.#onPieceRemoved = f;

        return this.#onPieceRemoved;
    }
}

export class Grid {
    #grid;

    constructor(columns = GRID_COLUMNS) {
        let gridArray = [];

        for (let i = 0; i < columns; i++) {
            gridArray.push(new GridColumn());
        }

        this.columns = columns;
        this.#grid = gridArray;
    }

    getColumn(column) {
        return this.#grid[column - 1];
    }

    asArray() {
        return [...this.#grid].map(c => c.asArray());
    }
}

// daniel says hello paul :>
