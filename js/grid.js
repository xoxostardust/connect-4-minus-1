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

    #shift() {
        const rowLength = this.#row.length;

        let lastInStack;

        for (let i = this.#row.length - 1; i > -1; --i) {
            if (this.#row[i] != null) {
                lastInStack = i;

                break;
            }
        }

        if (rowLength - 1 != lastInStack) {
        }
    }

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
}

export class Grid {
    #grid;

    constructor(columns = GRID_COLUMNS) {
        let gridArray = [];

        for (let i = 0; i < columns; ++i) {
            gridArray.push(new GridColumn());
        }

        this.#grid = gridArray;
    }

    getColumn(column) {
        return this.grid[column - 1];
    }
}
