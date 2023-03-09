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
            const gridRow = gridColumn.querySelector(`[data-row='${row}']`);

            gridRow.classList.add(piece.pieceType == PieceType.RED ? 'red-piece' : 'yellow-piece');
        });

        gridColumn.addEventListener('click', () => {
            if (!column.isFull) {
                column.placePiece(new GridPiece(canBeRedPiece ? PieceType.RED : PieceType.YELLOW));

                canBeRedPiece = !canBeRedPiece;
            }
        });
    }

    resetButton.addEventListener('click', ev => {
        window.location.reload();
    });
});
