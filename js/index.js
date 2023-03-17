import { joinRoom, selfId } from 'https://cdn.skypack.dev/trystero/ipfs';
import { sounds } from './constants.js';
import { PieceType, PlayerTeam } from './enums.js';
import { AI, Player } from './game.js';
import { Grid, GridPiece } from './grid.js';

const config = { appId: 'connect-4-minus-1' };

let mainMenuRoom;
let queueRoom;
let gameRoom;

let wins = 0;

let testing = true;

const byId = document.getElementById.bind(document);

console.log(`My name is ${selfId}!`);

function createSingleplayer() {
    const mainMenu = byId('main-menu');
    const enemy = byId('enemy');
    const youMoveTool = byId('you-move-tool');
    const enemyMoveTool = byId('enemy-move-tool');
    const youPieceCount = byId('you-piece-count');
    const enemyPieceCount = byId('enemy-piece-count');
    const remove = byId('remove');

    const youPieceSpin = youMoveTool.querySelector('.piece-spin');
    const enemyPieceSpin = enemyMoveTool.querySelector('.piece-spin');

    let removeMode = false;
    let removeTimeout;

    const grid = createGrid();

    const you = new Player(selfId, PlayerTeam.RED);
    const opponent = new AI('Jason', PlayerTeam.YELLOW);

    const youTeam = you.team;
    const opponentTeam = opponent.team;

    you.played(() => {
        opponent.play();

        youPieceCount.innerText = you.getRemainingPieces().length;

        youPieceSpin.classList.toggle('piece-spin', false);
        enemyPieceSpin.classList.toggle('piece-spin', true);

        setTimeout(
            () => {
                opponent.playRandom(grid);

                sounds.kerplunk.play();
            },
            testing ? 100 : 1000 + Math.floor(Math.random() * 3000)
        );

        sounds.kerplunk.play();
    });

    you.removed(() => {
        disableRemove();

        sounds.collide.play();
    });

    opponent.played(() => {
        you.play();

        enemyPieceCount.innerText = opponent.getRemainingPieces().length;

        youPieceSpin.classList.toggle('piece-spin', true);
        enemyPieceSpin.classList.toggle('piece-spin', false);

        sounds.kerplunk.play();
    });

    opponent.removed(() => {
        sounds.collide.play();
    });

    const gridColumns = document.getElementsByClassName('grid-column');
    const gridSpaces = document.getElementsByClassName('grid-space');

    function disableRemove() {
        setTimeout(() => {
            removeMode = false;
        }, 0);

        remove.classList.toggle('reset-used', true);

        remove.removeEventListener('click', clickReset);
    }

    function clickReset() {
        if (!you.canRemovePiece() || !you.isPlaying()) {
            return;
        }

        you.remove();

        removeMode = true;

        removeTimeout = setTimeout(disableRemove, 10000);
    }

    for (const gridColumn of gridColumns) {
        gridColumn.addEventListener('click', () => {
            if (!you.isPlaying() || removeMode) {
                return;
            }

            const column = gridColumn.dataset.column;

            if (grid.getColumn(column).isFull) {
                sounds.clickfast.play();

                return;
            }

            you.placePiece(grid, column);
        });
    }

    for (const gridSpace of gridSpaces) {
        gridSpace.addEventListener('click', () => {
            if (!removeMode) {
                return;
            }

            const row = gridSpace.dataset.row;
            const column = gridSpace.parentElement.dataset.column;

            you.removePiece(grid, column, row);
        });
    }

    remove.addEventListener('click', clickReset);

    you.play();

    enemy.innerText = opponent.name;

    mainMenu.classList.toggle('hide', true);

    youPieceCount.innerText = you.getRemainingPieces().length;
    enemyPieceCount.innerText = opponent.getRemainingPieces().length;

    youPieceSpin.classList.toggle('red', youTeam == PlayerTeam.RED);
    youPieceSpin.classList.toggle('yellow', youTeam == PlayerTeam.YELLOW);
    enemyPieceSpin.classList.toggle('red', opponentTeam == PlayerTeam.RED);
    enemyPieceSpin.classList.toggle('yellow', opponentTeam == PlayerTeam.YELLOW);

    youPieceSpin.classList.toggle('piece-spin', you.isPlaying());
    enemyPieceSpin.classList.toggle('piece-spin', opponent.isPlaying());

    setTimeout(toggleGrid, 0, false);
}

function createMultiplayer(firstPlayer, secondPlayer) {
    const mainMenu = byId('main-menu');
    const enemy = byId('enemy');
    const youMoveTool = byId('you-move-tool');
    const enemyMoveTool = byId('enemy-move-tool');
    const youPieceCount = byId('you-piece-count');
    const enemyPieceCount = byId('enemy-piece-count');
    const remove = byId('remove');

    const youPieceSpin = youMoveTool.querySelector('.piece-spin');
    const enemyPieceSpin = enemyMoveTool.querySelector('.piece-spin');

    let removeMode = false;
    let removeTimeout;

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

        sounds.kerplunk.play();
    });

    playerOne.removed(() => {
        sounds.collide.play();
    });

    playerTwo.played(() => {
        playerOne.play();

        sounds.kerplunk.play();
    });

    playerTwo.removed(() => {
        sounds.collide.play();
    });

    you.played(() => {
        youPieceCount.innerText = you.getRemainingPieces().length;

        youPieceSpin.classList.toggle('piece-spin', false);
        enemyPieceSpin.classList.toggle('piece-spin', true);
    });

    you.removed(() => {
        disableRemove();
    });

    enemyPlayer.played(() => {
        enemyPieceCount.innerText = enemyPlayer.getRemainingPieces().length;

        youPieceSpin.classList.toggle('piece-spin', true);
        enemyPieceSpin.classList.toggle('piece-spin', false);
    });

    const gridColumns = document.getElementsByClassName('grid-column');
    const gridSpaces = document.getElementsByClassName('grid-space');

    function disableRemove() {
        setTimeout(() => {
            removeMode = false;
        }, 0);

        remove.classList.toggle('reset-used', true);

        remove.removeEventListener('click', clickReset);
    }

    function clickReset() {
        if (!you.canRemovePiece() || !you.isPlaying()) {
            return;
        }

        you.remove();

        removeMode = true;

        removeTimeout = setTimeout(disableRemove, 10000);
    }

    for (const gridColumn of gridColumns) {
        gridColumn.addEventListener('click', () => {
            if (!you.isPlaying() || removeMode) {
                return;
            }

            const column = gridColumn.dataset.column;

            if (grid.getColumn(column).isFull) {
                sounds.clickfast.play();

                return;
            }

            placePiece(column);

            you.placePiece(grid, column);
        });
    }

    for (const gridSpace of gridSpaces) {
        gridSpace.addEventListener('click', () => {
            if (!removeMode) {
                return;
            }

            const row = gridSpace.dataset.row;
            const column = gridSpace.parentElement.dataset.column;

            removePiece([column, row]);

            you.removePiece(grid, column, row);
        });
    }

    remove.addEventListener('click', clickReset);

    playerOne.play();

    console.log(you.isPlaying());

    gameRoom.onPeerJoin(peerId => {
        mainMenu.classList.toggle('hide', true);

        if (peerId instanceof Uint8Array) {
            enemy.innerText = new TextDecoder().decode(peerId).substring(0, 5);
        } else {
            enemy.innerText = peerId.substring(0, 5);
        }

        youPieceCount.innerText = you.getRemainingPieces().length;
        enemyPieceCount.innerText = enemyPlayer.getRemainingPieces().length;

        youPieceSpin.classList.toggle('red', youTeam == PlayerTeam.RED);
        youPieceSpin.classList.toggle('yellow', youTeam == PlayerTeam.YELLOW);
        enemyPieceSpin.classList.toggle('red', enemyTeam == PlayerTeam.RED);
        enemyPieceSpin.classList.toggle('yellow', enemyTeam == PlayerTeam.YELLOW);

        youPieceSpin.classList.toggle('piece-spin', you.isPlaying());
        enemyPieceSpin.classList.toggle('piece-spin', enemyPlayer.isPlaying());

        setTimeout(toggleGrid, 0, false);
    });

    gameRoom.onPeerLeave(() => {
        wins++;

        clearTimeout(removeTimeout);

        sounds.victory.play();

        alert('Your opponent has left the game. Game over!');

        setTimeout(() => {
            gameRoom.leave();

            remove.removeEventListener('click', clickReset);
            remove.classList.toggle('reset-used', false);

            youPieceSpin.classList.toggle('piece-spin', true);
            enemyPieceSpin.classList.toggle('piece-spin', true);

            toggleGrid(true);
            resetGrid();

            joinMainMenu();

            showStart();
        }, 0);
    });
}

function checkGrid(grid) {
    const array = grid.asArray();

    for (let i = 0; i < grid.length; i++) {
        const column = array[i];

        for (let j = 0; j < column.length; j++) {
            const space = column[j];

            for (let s = 1; s < s + 3; s++) {
                
            }
        }
    }
}

function toggleGrid(force) {
    const gridContainer = byId('grid-container');

    gridContainer.classList.toggle('hide', force);
}

function resetGrid() {
    const grid = byId('grid');

    const gridColumns = grid.getElementsByClassName('grid-column');

    for (const gridColumn of gridColumns) {
        const clone = gridColumn.cloneNode(true);

        gridColumn.parentElement.replaceChild(clone, gridColumn);

        for (const space of clone.children) {
            space.classList.remove('red-piece', 'yellow-piece');
        }
    }
}

function createGrid() {
    const grid = new Grid();

    const gridColumns = document.getElementsByClassName('grid-column');

    for (const gridColumn of gridColumns) {
        const columnData = gridColumn.dataset.column;

        const column = grid.getColumn(columnData);

        column.onPiecePlaced((piece, row) => {
            const space = gridColumn.querySelector(`[data-row='${row}']`);

            const classList = space.classList;

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

        column.onPieceRemoved((s, piece) => {
            const columnArray = column.asArray();

            for (let i = 0; i < columnArray.length; i++) {
                const space = gridColumn.querySelector(`[data-row='${i + 1}']`);

                const classList = space.classList;

                classList.toggle('red-piece', false);
                classList.toggle('yellow-piece', false);

                const gridPiece = columnArray[i];

                if (gridPiece == null) {
                    continue;
                }

                switch (gridPiece.pieceType) {
                    case PieceType.RED:
                        classList.toggle('red-piece', true);
                        classList.toggle('yellow-piece', false);
                        break;

                    case PieceType.YELLOW:
                        classList.toggle('yellow-piece', true);
                        classList.toggle('red-piece', false);
                        break;

                    default:
                        break;
                }
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

        setTimeout(createMultiplayer, 0, playerOne, playerTwo);
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

start.addEventListener('click', () => {
    showPlayerSelect();

    sounds.clickfast.play();
});

ruleBook.addEventListener('click', () => {
    const pageturn = sounds.pageturn;

    toggleRules();

    pageturn.pause();
    pageturn.currentTime = 0;
    pageturn.play();
});

onePlayer.addEventListener('click', () => {
    mainMenuRoom.leave();

    createSingleplayer();

    sounds.clickfast.play();
});

twoPlayers.addEventListener('click', () => {
    showConnecting();

    mainMenuRoom.leave();

    joinQueue();

    sounds.clickfast.play();
});

goBack.addEventListener('click', () => {
    if (goBack.classList.contains('go-back-to-player-select')) {
        leaveQueue();
        showPlayerSelect();
    } else {
        showStart();
    }

    sounds.button.play();
});

joinMainMenu();
