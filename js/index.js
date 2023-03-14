import { joinRoom, selfId } from 'https://cdn.skypack.dev/trystero/ipfs';

import { GameType, PieceType, PlayerTeam } from './enums.js';
import { Game, Player } from './game.js';
import { Grid, GridPiece } from './grid.js';

const menu = joinRoom({ appId: 'connect-4-minus-1' }, 'menu');

const [queue, queued] = menu.makeAction('queue');
const [removeFromQueue, removedFromQueue] = menu.makeAction('queueRemove');

const [startGame, gameStarted] = menu.makeAction('startGame');

function createGame(peer, peerTwo) {
    peer = peer instanceof Uint8Array ? new TextDecoder().decode(peer) : peer;
    peerTwo = peerTwo instanceof Uint8Array ? new TextDecoder().decode(peerTwo) : peerTwo;

    menu.leave();

    const gameRoom = joinRoom({ appId: 'connect-4-minus-1' }, peer + peerTwo);

    gameRoom.onPeerJoin(peerId => console.log(`${peerId} joined`));
    gameRoom.onPeerLeave(peerId => console.log(`${peerId} left`));

    const [placePiece, getPiecePlaced] = gameRoom.makeAction('placePiece');
    // const [removePiece, getPieceRemoved] = gameRoom.makeAction('removePiece');

    const grid = createGrid();

    const playerOne = new Player(peer == selfId ? 'You' : peer, PlayerTeam.RED);
    const playerTwo = new Player(peerTwo == selfId ? 'You' : peerTwo, PlayerTeam.YELLOW);

    const you = playerOne.name == 'You' ? playerOne : playerTwo;

    console.log(you);
    console.log(playerOne);
    console.log(playerTwo);

    const game = new Game(playerOne, playerTwo, grid);

    getPiecePlaced((player, column, peerId) => {
        console.log(peerId);

        player.placePiece(grid, column);
    });

    if (you.isPlaying()) {
        console.log('you is playing');

        const gridColumns = document.getElementsByClassName('grid-column');

        for (const gridColumn of gridColumns) {
            gridColumn.addEventListener(
                'click',
                ev => {
                    console.log('i');
                    placePiece(you, gridColumn.dataset.column);
                    you.placePiece(grid, gridColumn.dataset.column);
                },
                { once: true }
            );
        }
    }
}

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
    console.log('%c' + peer, 'color: purple');

    console.log(peerQueue.pop(peer));
});

gameStarted((peer, peerId) => {
    console.log('%c' + (peer instanceof Uint8Array ? new TextDecoder().decode(peer) + ' (decoded)' : peer), 'color: yellow');

    if (selfId != (peer instanceof Uint8Array ? new TextDecoder().decode(peer) : peer) && selfId != peerId) return;

    showGrid();
    createGame(peer, peerId);
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

        removeFromQueue(peer);
        startGame(peer);

        console.log('start the game');

        showGrid();
        createGame(peer, selfId);
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
