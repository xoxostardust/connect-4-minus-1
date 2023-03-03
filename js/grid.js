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

        this.#row = rowArray;
        this.isFull = false;
    }

    // Internal function used by placePiece to get the last piece in the column (sets isFull true if the column is full)
    #getLast() {
        for (let i = this.#row.length - 1; i > -1; --i) {
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
        const firstPiece = this.#row.filter(p => p instanceof GridPiece).pop();

        if (firstPiece) {
            const index = this.#row.indexOf(firstPiece);
        }
    }

    // Places a piece gridPiece in the column and drops it to the bottom
    placePiece(gridPiece) {
        if (!(gridPiece instanceof GridPiece)) {
            throw new TypeError('gridPiece must be an instance of GridPiece');
        }

        const last = this.#getLast();

        if (last > -1) {
            this.#row[last] = gridPiece;
        } else {
            throw new ColumnIsFullError('Cannot place gridPiece because this column is full');
        }
    }

    // Removes a piece in the column and shifts the pieces in the column to the bottom
    removePiece(i = 1) {
        const piece = this.#row[i - 1];

        this.#row[i - 1] = null;
        this.#shift();

        return piece;
    }

    asArray() {
        return [...this.#row];
    }
}

export class Grid {
    #grid;

    constructor(columns = GRID_COLUMNS) {
        let gridArray = [];

        for (let i = 0; i < columns; i++) {
            gridArray.push(new GridColumn());
        }

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
