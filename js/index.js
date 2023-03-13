import { joinRoom, selfId } from 'https://cdn.skypack.dev/trystero/ipfs';

import { GameType, PieceType } from './enums.js';
import { Game } from './game.js';
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

    return grid;
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
    const mainMenu = document.getElementById('main-menu');
    const start = document.getElementById('start');
    const ruleBook = document.getElementById('rule-book');
    const rules = document.getElementById('rules');
    // Type select
    const typeSelect = document.getElementById('type-select');
    const onePlayer = document.getElementById('one-player');
    const twoPlayers = document.getElementById('two-players');
    // Game
    const gridContainer = document.getElementById('grid-container');
    const reset = document.getElementById('reset');

    function showGrid() {
        mainMenu.classList.toggle('hide', true);
        gridContainer.classList.toggle('hide', false);
    }

    start.addEventListener('click', ev => {
        start.classList.toggle('hide', true);
        typeSelect.classList.toggle('hide', false);
    });

    onePlayer.addEventListener('click', ev => showGrid());
    twoPlayers.addEventListener('click', ev => {
        const grid = createGrid();

        showGrid();

        const game = new Game(GameType.TWO_PLAYERS, grid);

        let you;

        if (room.getPeers().length == 0) {
            you = game.getPlayerOne();
        } else {
            you = game.getPlayerTwo();
        }
    });

    ruleBook.addEventListener('click', ev => {
        rules.classList.toggle('hide');
    });

    reset.addEventListener('click', ev => resetGrid());
});
