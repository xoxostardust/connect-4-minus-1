import { joinRoom, selfId } from 'https://cdn.skypack.dev/trystero/ipfs';
import { PieceType, PlayerTeam } from './enums.js';
import { Player } from './game.js';
import { Grid } from './grid.js';

const config = { appId: 'connect-4-minus-1' };

let mainMenuRoom;
let queueRoom;
let gameRoom;

const byId = document.getElementById.bind(document);

console.log(`My name is ${selfId}!`);

function createMultiplayer(firstPlayer, secondPlayer) {
    const mainMenu = byId('main-menu');
    const enemy = byId('enemy');
    const youMoveTool = byId('you-move-tool');
    const enemyMoveTool = byId('enemy-move-tool');
    const youPieceCount = byId('you-piece-count');
    const enemyPieceCount = byId('enemy-piece-count');

    const youPieceSpin = youMoveTool.querySelector('.piece-spin');
    const enemyPieceSpin = enemyMoveTool.querySelector('.piece-spin');

    queueRoom.leave();

    gameRoom = joinRoom(config, firstPlayer + secondPlayer);

    const [placePiece, getPiecePlaced] = gameRoom.makeAction('place');
    const [removePiece, getPieceRemoved] = gameRoom.makeAction('remove');

    const grid = createGrid();

    const playerOne = new Player(firstPlayer, PlayerTeam.RED);
    const playerTwo = new Player(secondPlayer, PlayerTeam.YELLOW);

    const you = playerOne.name == selfId ? playerOne : playerTwo;
    const enemyPlayer = you == playerOne ? playerTwo : playerOne;

    const youTeam = you.team;
    const enemyTeam = enemyPlayer.team;

    getPiecePlaced((column, peerId) => {
        const player = playerOne.name == peerId ? playerOne : playerTwo;

        player.placePiece(grid, column);
    });

    getPieceRemoved(([column, row], peerId) => {
        const player = playerOne.name == peerId ? playerOne : playerTwo;

        player.removePiece(grid, column, row);
    });

    playerOne.played(() => {
        playerTwo.play();
    });

    playerTwo.played(() => {
        playerOne.play();
    });

    you.played(() => {
        youPieceCount.innerText = you.getRemainingPieces().length;

        youPieceSpin.classList.toggle('piece-spin', false);
        enemyPieceSpin.classList.toggle('piece-spin', true);
    });

    enemyPlayer.played(() => {
        enemyPieceCount.innerText = enemyPlayer.getRemainingPieces().length;

        youPieceSpin.classList.toggle('piece-spin', true);
        enemyPieceSpin.classList.toggle('piece-spin', false);
    });

    const gridColumns = document.getElementsByClassName('grid-column');
    const gridSpaces = document.getElementsByClassName('grid-space');

    for (const gridColumn of gridColumns) {
        gridColumn.addEventListener('click', () => {
            if (!you.isPlaying()) {
                return;
            }

            const column = gridColumn.dataset.column;

            placePiece(column);

            you.placePiece(grid, column);
        });
    }

    for (const gridSpace of gridSpaces) {
        gridSpace.addEventListener('click', () => {
            if (!you.canRemovePiece() && !you.isRemoving()) {
                return;
            }

            const row = gridSpace.dataset.row;
            const column = gridSpace.parentElement.dataset.column;

            removePiece([column, row]);

            you.removePiece(grid, column, row);
        });
    }

    playerOne.play();

    console.log(you.isPlaying());

    gameRoom.onPeerJoin(peerId => {
        mainMenu.classList.toggle('hide', true);

        if (peerId instanceof Uint8Array) {
            enemy.innerText = new TextDecoder().decode(peerId).substring(0, 5);
        } else {
            enemy.innerText = peerId.substring(0, 5);
        }

        youPieceSpin.classList.toggle('red', youTeam == PlayerTeam.RED);
        youPieceSpin.classList.toggle('yellow', youTeam == PlayerTeam.YELLOW);
        enemyPieceSpin.classList.toggle('red', enemyTeam == PlayerTeam.RED);
        enemyPieceSpin.classList.toggle('yellow', enemyTeam == PlayerTeam.YELLOW);

        youPieceSpin.classList.toggle('piece-spin', you.isPlaying());
        enemyPieceSpin.classList.toggle('piece-spin', enemyPlayer.isPlaying());

        setTimeout(toggleGrid, 100, false);
    });

    gameRoom.onPeerLeave(() => {
        alert('Your opponent has left the game. Game over!');

        setTimeout(() => {
            gameRoom.leave();

            toggleGrid(true);
            resetGrid();

            joinMainMenu();

            showStart();
        }, 100);
    });
}

function toggleGrid(force) {
    const gridContainer = byId('grid-container');

    gridContainer.classList.toggle('hide', force);
}

function resetGrid() {
    const grid = byId('grid');

    const redPieces = grid.getElementsByClassName('red-piece');
    const yellowPieces = grid.getElementsByClassName('yellow-piece');

    for (const redPiece of redPieces) {
        redPiece.classList.toggle('red-piece', false);
    }

    for (const yellowPiece of yellowPieces) {
        yellowPiece.classList.toggle('yellow-piece', false);
    }
}

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

function leaveQueue() {
    queueRoom.leave();

    joinMainMenu();
}

function joinQueue() {
    const connecting = byId('connecting');
    const goBack = byId('go-back');

    queueRoom = joinRoom(config, 'queue');

    const [queue, queued] = queueRoom.makeAction('queue');

    const now = Date.now();

    let queuing = {};

    queued((timestamp, peerId) => {
        if (queuing[peerId]) {
            return;
        }

        queuing[peerId] = timestamp;

        const [firstPlayer, firstTimestamp] = Object.entries(queuing)
            .sort((a, b) => a[a.length - 1] - b[b.length - 1])
            .shift();

        const playerOne = now < firstTimestamp ? selfId : firstPlayer;
        const playerTwo = playerOne == selfId ? firstPlayer : selfId;

        setTimeout(createMultiplayer, 100, playerOne, playerTwo);
    });

    queueRoom.onPeerJoin(peerId => {
        console.log(`${peerId} has joined the queue.`);

        connecting.innerText = 'Joining...';
        goBack.classList.toggle('hide', true);

        queue(now);
    });
}

function joinMainMenu() {
    const mainMenu = byId('main-menu');
    const online = byId('online');

    mainMenu.classList.toggle('hide', false);

    mainMenuRoom = joinRoom(config, 'main-menu');

    mainMenuRoom.onPeerJoin(peerId => {
        const numberOfPeers = mainMenuRoom.getPeers().length;

        console.log(`${peerId} has joined the room. ${numberOfPeers} ${numberOfPeers == 1 ? 'peer is' : 'peers are'} online.`);

        online.parentElement.classList.toggle('hide', false);

        updateOnline();
    });

    mainMenuRoom.onPeerLeave(peerId => {
        const numberOfPeers = mainMenuRoom.getPeers().length;

        console.log(`${peerId} has left the room. ${numberOfPeers} ${numberOfPeers == 1 ? 'peer is' : 'peers are'} online.`);

        if (!(numberOfPeers > 0)) {
            online.parentElement.classList.toggle('hide', true);
        }

        updateOnline();
    });
}

function updateOnline() {
    const numberOfPeers = mainMenuRoom.getPeers().length;

    online.innerText = `${numberOfPeers} ${numberOfPeers == 1 ? 'player is' : 'players are'} online.`;
}

function toggleRules() {
    const rules = byId('rules');

    rules.classList.toggle('hide');
}

function showConnecting() {
    const connecting = byId('connecting');
    const playerSelect = byId('player-select');
    const goBack = byId('go-back');
    const online = byId('online');

    connecting.innerText = 'Looking for players...';

    playerSelect.classList.toggle('hide', true);
    goBack.classList.toggle('go-back-to-player-select', true);
    online.parentElement.classList.toggle('hide', true);
    connecting.classList.toggle('hide', false);
    goBack.classList.toggle('hide', false);
}

function showPlayerSelect() {
    const connecting = byId('connecting');
    const start = byId('start');
    const ruleBook = byId('rule-book');
    const rules = byId('rules');
    const playerSelect = byId('player-select');
    const goBack = byId('go-back');

    connecting.classList.toggle('hide', true);
    start.classList.toggle('hide', true);
    rules.classList.toggle('hide', true);
    ruleBook.classList.toggle('hide', true);
    playerSelect.classList.toggle('hide', false);
    goBack.classList.toggle('hide', false);
    goBack.classList.toggle('go-back-to-player-select', false);
}

function showStart() {
    const start = byId('start');
    const ruleBook = byId('rule-book');
    const connecting = byId('connecting');
    const playerSelect = byId('player-select');
    const goBack = byId('go-back');

    connecting.classList.toggle('hide', true);
    playerSelect.classList.toggle('hide', true);
    goBack.classList.toggle('hide', true);
    goBack.classList.toggle('go-back-to-player-select', false);
    start.classList.toggle('hide', false);
    ruleBook.classList.toggle('hide', false);
}

const start = byId('start');
const ruleBook = byId('rule-book');
const onePlayer = byId('one-player');
const twoPlayers = byId('two-players');
const goBack = byId('go-back');

start.addEventListener('click', () => showPlayerSelect());
ruleBook.addEventListener('click', () => toggleRules());

twoPlayers.addEventListener('click', () => {
    showConnecting();

    mainMenuRoom.leave();

    joinQueue();
});

goBack.addEventListener('click', () => {
    if (goBack.classList.contains('go-back-to-player-select')) {
        leaveQueue();
        showPlayerSelect();
    } else {
        showStart();
    }
});

joinMainMenu();
