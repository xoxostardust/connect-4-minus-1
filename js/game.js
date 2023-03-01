import { GRID_COLUMNS, GRID_ROWS } from './constants';
import { PieceType } from './enums';

class GridPiece {
    constructor(pieceType = PieceType.RED) {
        this.pieceType = pieceType;
    }
}

class Grid {
    constructor(columns = GRID_COLUMNS, rows = GRID_ROWS) {
        let gridArray = [];

        // Build the grid given the number of columns and rows
        for (let i = 0; i < rows - 1; i++) {
            let gridRow = [];

            for (let j = 0; j < columns - 1; j++) {
                gridRow.push(null);
            }

            gridArray.push(gridRow);
        }

        // gridArray will be kept private
        this.#gridArray = gridArray;
        console.log(gridArray);

        // Give back the columns and rows for the grid
        this.columns = columns;
        this.rows = rows;
    }

    // Internal function to get the last empty position in a row (return -1 if full)
    #getLastEmptyRow(column) {}

    placePiece(column, gridPiece) {}
}
