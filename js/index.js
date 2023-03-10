import { joinRoom } from 'https://cdn.skypack.dev/trystero';

import { PieceType } from './enums.js';
import { Grid, GridPiece } from './grid.js';

const config = { appId: 'san_narciso_3d' };
const room = joinRoom(config, 'yoyodyne');

room.onPeerJoin(peerId => console.log(`${peerId} joined`));

document.addEventListener('DOMContentLoaded', ev => {
    const resetButton = document.getElementById('reset');
    const twoPlayers = document.getElementById('two-players');
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

    if (resetButton != null) {
        resetButton.addEventListener('click', ev => {
            window.location.reload();
        });
    }

    twoPlayers.addEventListener('click', ev => {
        alert('Not implemented');
    });
});
