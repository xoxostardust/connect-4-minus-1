import { joinRoom, selfId } from 'https://cdn.skypack.dev/trystero/ipfs';

import { GameType, PieceType, PlayerTeam } from './enums.js';
import { Game, Player } from './game.js';
import { Grid, GridPiece } from './grid.js';

const config = { appId: 'connect-4-minus-1' };
const menu = joinRoom(config, 'menu');

const [queue, queued] = menu.makeAction('queue');
const [removeFromQueue, removedFromQueue] = menu.makeAction('queueRemove');

const [startGame, gameStarted] = menu.makeAction('startGame');

// const [placePiece, getPiecePlaced] = menu.makeAction('placePiece');
// const [removePiece, getPieceRemoved] = menu.makeAction('removePiece');

function createGame() {}

function createGrid() {
    console.log('Creating grid');

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
    console.log('Resetting grid');

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

// Main menu
const mainMenu = document.getElementById('main-menu');
const start = document.getElementById('start');
const ruleBook = document.getElementById('rule-book');
const rules = document.getElementById('rules');
const online = document.getElementById('online');
// Type select
const typeSelect = document.getElementById('type-select');
const onePlayer = document.getElementById('one-player');
const twoPlayers = document.getElementById('two-players');
// Game
const gridContainer = document.getElementById('grid-container');
const pieceCount = document.getElementById('piece-count');
const opponent = document.getElementById('opponent');
const reset = document.getElementById('reset');
const remove = document.getElementById('remove');

let peerQueue = [];

queued((_, peerId) => {
    peerQueue.push(peerId);
});

removedFromQueue((peer, peerId) => {
    peerQueue.pop(peer);
});

gameStarted((peer, peerId) => {
    console.log('%c' + (peer instanceof Uint8Array ? new TextDecoder().decode(peer) + ' (decoded)' : peer), 'color: yellow');

    if (selfId != (peer instanceof Uint8Array ? new TextDecoder().decode(peer) : peer) && selfId != peerId) return;

    showGrid();
    createGame();
    // createGrid();
});

function showGrid() {
    resetGrid();

    mainMenu.classList.toggle('hide', true);
    gridContainer.classList.toggle('hide', false);
}

start.addEventListener('click', ev => {
    start.classList.toggle('hide', true);
    ruleBook.classList.toggle('hide', true);
    typeSelect.classList.toggle('hide', false);
});

ruleBook.addEventListener('click', ev => {
    rules.classList.toggle('hide');
});

onePlayer.addEventListener('click', ev => showGrid(), { once: true });
twoPlayers.addEventListener('click', ev => {
    console.log('click');

    queue('queue');

    console.log('after queue');

    const peer = peerQueue.pop();

    if (typeof peer != 'undefined') {
        console.log('%c' + peer, 'color: yellow');

        startGame(peer);

        console.log('start the game');

        showGrid();
        createGrid();
    }
});

reset.addEventListener('click', ev => resetGrid());

menu.onPeerJoin(peerId => {
    const peers = menu.getPeers();

    console.log(`${peerId} joined. ${peers.length} peer(s) online. I am ${selfId}.`);

    twoPlayers.classList.toggle('hide', false);

    // updateOnlineCount();
});

menu.onPeerLeave(peerId => {
    const peers = menu.getPeers();

    console.log(`${peerId} left. ${peers.length} peer(s) online. I am ${selfId}.`);

    if (!peers.length > 0) {
        twoPlayers.classList.toggle('hide', true);
    }
});
