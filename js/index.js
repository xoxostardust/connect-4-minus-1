import { joinRoom, selfId } from 'https://cdn.skypack.dev/trystero/ipfs';

import { PieceType } from './enums.js';
import { Grid, GridPiece } from './grid.js';

const config = { appId: 'connect-4-minus-1' };
const room = joinRoom(config, 'game');

const [placePiece, getPiecePlaced] = room.makeAction('placePiece');
const [removePiece, getPieceRemoved] = room.makeAction('removePiece');

room.onPeerJoin(peerId => console.log(`${peerId} joined`));
room.onPeerLeave(peerId => console.log(`${peerId} left`));

function createGrid() {
    const grid = new Grid();

    const gridColumns = document.getElementsByClassName('grid-column');

    for (const gridColumn of gridColumns) {
        const columnData = gridColumn.dataset.column;

        const column = grid.getColumn(columnData);

        column.onPiecePlaced((piece, row) => {
            const gridRow = gridColumn.querySelector(`[data-row='${row}']`);

            const classList = gridRow.classList;

            switch (piece.pieceType) {
                case PieceType.RED:
                    classList.toggle('red-piece', true);
                    break;

                case PieceType.YELLOW:
                    classList.toggle('yellow-piece', true);
                    break;

                default:
                    break;
            }
        });
    }
}

function resetGrid() {
    const grid = document.getElementById('grid');

    const redPieces = grid.getElementsByClassName('red-piece');
    const yellowPieces = grid.getElementsByClassName('yellow-piece');

    for (const redPiece of redPieces) {
        redPiece.classList.toggle('red-piece', false);
    }

    for (const yellowPiece of yellowPieces) {
        yellowPiece.classList.toggle('yellow-piece', false);
    }
}

document.addEventListener('DOMContentLoaded', ev => {
    // Main menu
    const start = document.getElementById('start');
    const ruleBook = document.getElementById('rule-book');
    const rules = document.getElementById('rules');
    // Type select
    const typeSelect = document.getElementById('type-select');
    const onePlayer = document.getElementById('one-player');
    const twoPlayers = document.getElementById('two-players');
    // Game
    const grid = document.getElementById('grid');
    const reset = document.getElementById('reset');

    typeSelect.style.display = 'none';
    grid.style.display = 'none';
    reset.style.display = 'none';

    function showGrid() {
        typeSelect.style.display = 'none';
        grid.style.display = null;
        reset.style.display = null;
    }

    start.addEventListener('click', ev => {
        start.style.display = 'none';
        typeSelect.style.display = null;
    });

    onePlayer.addEventListener('click', ev => showGrid());
    twoPlayers.addEventListener('click', ev => showGrid());

    ruleBook.addEventListener('click', ev => {
        rules.classList.toggle('hide');
    });
});
