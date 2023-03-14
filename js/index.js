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

    console.log(`%c${peer} vs ${peerTwo}; ${selfId}`, 'color: orange');

    menu.leave();

    const gameRoom = joinRoom({ appId: 'connect-4-minus-1' }, peer + peerTwo);

    const [allJoin, allJoined] = gameRoom.makeAction('allJoin');
    const [determinePlayers, determinedPlayers] = gameRoom.makeAction('detPlayers');

    const [placePiece, getPiecePlaced] = gameRoom.makeAction('placePiece');
    // const [removePiece, getPieceRemoved] = gameRoom.makeAction('removePiece');

    allJoined((_, peerId) => {
        runGame();
    });

    function runGame() {
        showGrid();

        const grid = createGrid();

        const playerOne = new Player(peer, PlayerTeam.RED);
        const playerTwo = new Player(peerTwo, PlayerTeam.YELLOW);

        console.log(selfId, playerOne.name, playerTwo.name);

        let you;

        switch (selfId) {
            case playerOne.name:
                console.log('player one');
                you = playerOne;
                break;

            case playerTwo.name:
                console.log('player two');
                you = playerTwo;
                break;

            default:
                break;
        }

        playerOne.played(() => {
            console.log('player one played');

            playerTwo.play();
        });

        playerTwo.played(() => {
            console.log('player two played');

            playerOne.play();
        });

        playerOne.play();

        console.log(playerOne.isPlaying(), playerTwo.isPlaying());

        getPiecePlaced(([id, column], peerId) => {
            console.log('placed');

            let them;

            switch (id) {
                case playerOne.name:
                    console.log('player one');
                    them = playerOne;
                    break;

                case playerTwo.name:
                    console.log('player two');
                    them = playerTwo;
                    break;

                default:
                    break;
            }

            them.placePiece(grid, column);
        });

        const gridColumns = document.getElementsByClassName('grid-column');

        for (const gridColumn of gridColumns) {
            gridColumn.addEventListener('click', ev => {
                if (!you.isPlaying()) {
                    console.log('not your turn');
                    return;
                }
                console.log('your turn', selfId);
                console.log(selfId, gridColumn.dataset.column.toString())
                placePiece([selfId, gridColumn.dataset.column]);
                you.placePiece(grid, gridColumn.dataset.column);
            });
        }

        function test() {
            console.log(playerOne.isPlaying(), playerTwo.isPlaying());
        }
        setInterval(test, 1000);
    }

    gameRoom.onPeerJoin(peerId => {
        console.log(`${peerId} joined`);

        allJoin();
        runGame();
    });

    gameRoom.onPeerLeave(peerId => console.log(`${peerId} left`));
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

    mainMenu.classList.toggle('hide', true);
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

let isQueuing = false;

onePlayer.addEventListener('click', ev => showGrid(), { once: true });
twoPlayers.addEventListener('click', ev => {
    console.log('click');

    queue('queue');
    isQueuing = true;

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
