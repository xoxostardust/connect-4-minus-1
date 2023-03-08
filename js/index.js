import { PieceType } from './enums.js';
import { Grid, GridPiece } from './grid.js';

document.addEventListener('DOMContentLoaded', ev => {
    const resetButton = document.getElementById('reset');
    const gridColumns = document.getElementsByClassName('grid-column');

    const grid = new Grid();

    let canBeRedPiece = Math.random() > 0.5 ? true : false;
    for (const gridColumn of gridColumns) {
        const columnData = gridColumn.dataset.column;
        const column = grid.getColumn(columnData);
        column.onPiecePlaced((piece, row) => {
            const gridRow = gridColumn.querySelector(`[data-row="${row}"]`);
            if (gridRow != null) {
                if (piece.pieceType == PieceType.RED) {
                    gridRow.classList.add('red-piece');
                } else {
                    gridRow.classList.add('yellow-piece');
                }
            }
        });
        gridColumn.addEventListener('click', () => {
            if (!column.isFull) {
                column.placePiece(canBeRedPiece ? new GridPiece() : new GridPiece(PieceType.YELLOW));
                canBeRedPiece = !canBeRedPiece;
            }
        });
    }
    resetButton.addEventListener('click', ev => {
        window.location.reload();
    });
});
