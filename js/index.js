import { joinRoom, selfId } from 'https://cdn.skypack.dev/trystero/ipfs';

import { GameType, PieceType, PlayerTeam } from './enums.js';
import { Game, Player } from './game.js';
import { Grid, GridPiece } from './grid.js';

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
const reset = document.getElementById('reset');
const remove = document.getElementById('remove');

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

    const [placePiece, getPiecePlaced] = gameRoom.makeAction('placePiece');
    const [removePiece, getPieceRemoved] = gameRoom.makeAction('removePiece');
    const [doRemove, removed] = gameRoom.makeAction('remove');

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

        removed((id, peerId) => {
            remove.classList.toggle('removing', true);
            remove.setAttribute('disabled', '');
        });

        const gridColumns = document.getElementsByClassName('grid-column');
        const gridSpaces = document.getElementsByClassName('grid-space');

        for (const gridColumn of gridColumns) {
            gridColumn.addEventListener('click', ev => {
                if (!you.isPlaying()) {
                    console.log('not your turn');
                    return;
                }
                console.log('your turn', selfId);
                console.log(selfId, gridColumn.dataset.column.toString());
                placePiece([selfId, gridColumn.dataset.column]);
                you.placePiece(grid, gridColumn.dataset.column);
            });
        }

        for (const gridSpace of gridSpaces) {
            gridSpace.addEventListener('click', ev => {
                if (!you.isRemoving()) {
                    return;
                }
                const parent = gridSpace.parentElement;
                removePiece([selfId, parent.dataset.column, gridSpace.dataset.row]);
                you.removePiece(grid, parent.dataset.column, gridSpace.dataset.row);
            });
        }

        remove.addEventListener('click', ev => {
            if (!you.isPlaying()) return;
            doRemove(you.name);
            you.remove();
            remove.classList.toggle('removing', true);
        });
    }

    gameRoom.onPeerJoin(peerId => {
        console.log(`${peerId} joined`);

        allJoin('allJoin');
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

menu.onPeerJoin(peerId => {
    const peers = menu.getPeers();

    console.log(`${peerId} joined. ${peers.length} peer(s) online. I am ${selfId}.`);

    online.parentElement.classList.toggle('hide', false);
    online.innerText = `${peers.length} ${peers.length == 1 ? 'person is' : 'people are'} online.`;

    twoPlayers.classList.toggle('hide', false);

    // updateOnlineCount();
});

menu.onPeerLeave(peerId => {
    const peers = menu.getPeers();

    console.log(`${peerId} left. ${peers.length} peer(s) online. I am ${selfId}.`);

    online.innerText = `${peers.length} ${peers.length == 1 ? 'person is' : 'people are'} online.`;

    if (!peers.length > 0) {
        twoPlayers.classList.toggle('hide', true);
    }
});


// function checkWin() {
//     for (let y = 0; y < winningArrays.length; y++) {
//         const piece1 = pieces[winningArrays[y][1]]
//         const piece2 = pieces[winningArrays[y][2]]
//         const piece3 = pieces[winningArrays[y][3]]
//         const piece4 = pieces[winningArrays[y][4]]

//         if (
//             piece1.classList.contains('playerOne') &&
//             piece2.classList.contains('playerOne') &&
//             piece3.classList.contains('playerOne') &&
//             piece4.classList.contains('playerOne') 
//         )
        
//         { 
//             alert("Player One wins tee hee?")
//         }
//         if (
//             piece1.classList.contains('playerTwo') &&
//             piece2.classList.contains('playerTwo') &&
//             piece3.classList.contains('playerTwo') &&
//             piece4.classList.contains('playerTwo') 
//         )
        
//         { 
//             alert("Player two wins tee hee?")
//         }
//     }
// }