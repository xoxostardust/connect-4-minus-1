import { joinRoom, selfId } from 'https://cdn.skypack.dev/trystero/ipfs';
import { sounds } from './constants.js';
import { PieceType, PlayerTeam } from './enums.js';
import { AI, Player } from './game.js';
import { Grid } from './grid.js';

const config = { appId: 'connect-4-minus-1' };

let mainMenuRoom;
let queueRoom;
let gameRoom;

let wins = 0;

let testing = true;

const byId = document.getElementById.bind(document);

console.log(`My name is ${selfId}!`);

function playSound(name) {
    const sound = sounds[name];

    if (!sound) {
        return;
    }

    if (!sound.paused) {
        sound.pause();
    }

    sound.currentTime = 0;

    const promise = sound.play();

    if (promise !== undefined) {
        promise.catch(error => {
            console.log(`${name} was interrupted!`);
        });
    }
}

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

    const gridColumns = document.getElementsByClassName('grid-column');
    const gridSpaces = document.getElementsByClassName('grid-space');

    let removeMode = false;
    let removeTimeout;

    const grid = createGrid();

    const you = new Player(selfId, PlayerTeam.RED);
    const opponent = new AI(Math.random() < 0.99 ? 'Jason' : 'Mr. Quick', PlayerTeam.YELLOW);

    const youTeam = you.team;
    const opponentTeam = opponent.team;

    function leave() {
        remove.removeEventListener('click', clickReset);
        remove.classList.toggle('reset-used', false);

        youPieceSpin.classList.toggle('piece-spin', true);
        enemyPieceSpin.classList.toggle('piece-spin', true);

        toggleGrid(false);
        resetGrid();

        joinMainMenu();

        showStart();
    }

    function win() {
        // wins++;

        clearTimeout(removeTimeout);

        playSound('victory');

        setTimeout(() => {
            alert('You win! Game over.');

            leave();
        }, 1000);
    }

    function lose() {
        clearTimeout(removeTimeout);

        playSound('glassbreak');

        setTimeout(() => {
            alert('You lost! Game over.');

            leave();
        }, 1000);
    }

    you.played(() => {
        const winner = getWinner(grid);

        youPieceCount.innerText = you.getRemainingPieces().length;

        youPieceSpin.classList.toggle('piece-spin', false);
        enemyPieceSpin.classList.toggle('piece-spin', true);

        playSound('kerplunk');

        if (winner != null) {
            if (you.team == winner) {
                win();
            } else {
                lose();
            }

            return;
        }

        opponent.play();

        setTimeout(
            () => {
                opponent.playRandom(grid);

                playSound('kerplunk');
            },
            testing ? 100 : 1000 + Math.floor(Math.random() * 3000)
        );
    });

    you.removed(() => {
        const winner = getWinner(grid);

        disableRemove();

        playSound('collide');

        if (winner != null) {
            if (you.team == winner) {
                win();
            } else {
                lose();
            }

            return;
        }
    });

    opponent.played(() => {
        const winner = getWinner(grid);

        enemyPieceCount.innerText = opponent.getRemainingPieces().length;

        youPieceSpin.classList.toggle('piece-spin', true);
        enemyPieceSpin.classList.toggle('piece-spin', false);

        playSound('kerplunk');

        if (winner != null) {
            if (you.team == winner) {
                win();
            } else {
                lose();
            }

            return;
        }

        you.play();
    });

    opponent.removed(() => {
        const winner = getWinner(grid);

        playSound('collide');

        if (winner != null) {
            if (you.team == winner) {
                win();
            } else {
                lose();
            }

            return;
        }
    });

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
                playSound('clickfast');

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

    setTimeout(toggleGrid, 0, true);
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

    const gridColumns = document.getElementsByClassName('grid-column');
    const gridSpaces = document.getElementsByClassName('grid-space');

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

    function leave() {
        gameRoom.leave();

        remove.removeEventListener('click', clickReset);
        remove.classList.toggle('reset-used', false);

        youPieceSpin.classList.toggle('piece-spin', true);
        enemyPieceSpin.classList.toggle('piece-spin', true);

        toggleGrid(false);
        resetGrid();

        joinMainMenu();

        showStart();
    }

    function win() {
        wins++;

        clearTimeout(removeTimeout);

        playSound('victory');

        setTimeout(leave, 1000);
    }

    function lose() {
        clearTimeout(removeTimeout);

        playSound('glassbreak');

        setTimeout(leave, 1000);
    }

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

        playSound('kerplunk');
    });

    playerOne.removed(() => {
        playSound('collide');
    });

    playerTwo.played(() => {
        playerOne.play();

        playSound('kerplunk');
    });

    playerTwo.removed(() => {
        playSound('collide');
    });

    you.played(() => {
        const winner = getWinner(grid);

        youPieceCount.innerText = you.getRemainingPieces().length;

        youPieceSpin.classList.toggle('piece-spin', false);
        enemyPieceSpin.classList.toggle('piece-spin', true);

        if (winner != null) {
            if (you.team == winner) {
                win();
            } else {
                lose();
            }

            return;
        }
    });

    you.removed(() => {
        disableRemove();
    });

    enemyPlayer.played(() => {
        const winner = getWinner(grid);

        enemyPieceCount.innerText = enemyPlayer.getRemainingPieces().length;

        youPieceSpin.classList.toggle('piece-spin', true);
        enemyPieceSpin.classList.toggle('piece-spin', false);

        if (winner != null) {
            if (you.team == winner) {
                win();
            } else {
                lose();
            }

            return;
        }
    });

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
                playSound('clickfast');

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

        setTimeout(toggleGrid, 0, true);
    });

    gameRoom.onPeerLeave(() => {
        clearTimeout(removeTimeout);

        // alert('Your opponent has left the game. Game over!');

        setInterval(leave, 0);
    });
}

function getWinner(grid) {
    const win = checkGrid(grid);

    if (win.length > 0) {
        showWin(win);

        return determineWinner(win);
    }

    return;
}

function determineWinner(win) {
    const gridSpaces = document.getElementsByClassName('grid-space');

    for (const [gridColumn, row] of win) {
        for (const gridSpace of gridSpaces) {
            if (gridSpace.parentElement.dataset.column == gridColumn && gridSpace.dataset.row == row) {
                return gridSpace.classList.contains('red-piece') ? PlayerTeam.RED : PlayerTeam.YELLOW;
            }
        }
    }
}

function showWin(win) {
    const gridSpaces = document.getElementsByClassName('grid-space');

    for (const [gridColumn, row] of win) {
        for (const gridSpace of gridSpaces) {
            if (gridSpace.parentElement.dataset.column == gridColumn && gridSpace.dataset.row == row) {
                gridSpace.classList.toggle('piece-spin', true);
            }
        }
    }
}

// Check the grid for a win passing an instance of Grid as an argument (TODO: make this more efficient)
function checkGrid(grid) {
    const array = grid.asArray();

    const largestColumn = grid
        .asArray()
        .sort((a, b) => a.length > b.length)
        .shift();

    // Check for a Connect 4 in columns first
    for (let i = 0; i < array.length; i++) {
        const column = array[i];

        for (let j = 0; j < column.length; j++) {
            const space = column[j];

            if (space == null) {
                continue;
            }

            let matches = [];

            for (let k = j + 1; k < j + 4; k++) {
                const nextSpace = column[k];

                if (nextSpace && space.pieceType == nextSpace.pieceType) {
                    matches.push([i + 1, k + 1]);
                } else {
                    matches = [];
                }
            }

            // We got ourselves a Connect 4
            if (matches.length >= 3) {
                return [[i + 1, j + 1], ...matches];
            }
        }
    }

    // Check for rows second
    for (let i = 0; i < largestColumn.length; i++) {
        for (let j = 0; j < array.length; j++) {
            const space = array[j][i];

            if (!space) {
                continue;
            }

            let matches = [];

            for (let k = j + 1; k < j + 4; k++) {
                if (array[k] == undefined) {
                    continue;
                }

                const nextSpace = array[k][i];

                if (nextSpace && space.pieceType == nextSpace.pieceType) {
                    matches.push([k + 1, i + 1]);
                } else {
                    matches = [];
                }
            }

            // We got ourselves a Connect 4
            if (matches.length >= 3) {
                return [[j + 1, i + 1], ...matches];
            }
        }
    }

    // Check for positive-sloped diagonals next
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < largestColumn.length; j++) {
            const column = array[i];

            if (column == undefined) {
                continue;
            }

            const space = column[j];

            if (space == undefined) {
                continue;
            }

            let matches = [];

            let x = 1;
            for (let k = i + 1; k < i + 4; k++) {
                const nextColumn = array[k];

                if (nextColumn == undefined) {
                    continue;
                }

                const nextSpace = nextColumn[j - x];

                if (nextSpace && space.pieceType == nextSpace.pieceType) {
                    matches.push([k + 1, j + 1 - x]);
                } else {
                    matches = [];
                }

                // We got ourselves a Connect 4
                if (matches.length >= 3) {
                    return [[i + 1, j + 1], ...matches];
                }

                x++;
            }
        }
    }

    // Check for negative-sloped diagonals last
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < largestColumn.length; j++) {
            const column = array[i];

            if (column == undefined) {
                continue;
            }

            const space = column[j];

            if (space == undefined) {
                continue;
            }

            let matches = [];

            let x = 1;
            for (let k = i + 1; k < i + 4; k++) {
                const nextColumn = array[k];

                if (nextColumn == undefined) {
                    continue;
                }

                const nextSpace = nextColumn[j + x];

                if (nextSpace && space.pieceType == nextSpace.pieceType) {
                    matches.push([k + 1, j + 1 + x]);
                } else {
                    matches = [];
                }

                // We got ourselves a Connect 4
                if (matches.length >= 3) {
                    return [[i + 1, j + 1], ...matches];
                }

                x++;
            }
        }
    }

    return [];
}

function toggleGrid(toggle) {
    const gridContainer = byId('grid-container');

    gridContainer.classList.toggle('hide', !toggle);
}

function resetGrid() {
    const grid = byId('grid');

    const gridColumns = grid.getElementsByClassName('grid-column');

    for (const gridColumn of gridColumns) {
        const clone = gridColumn.cloneNode(true);

        gridColumn.parentElement.replaceChild(clone, gridColumn);

        for (const space of clone.children) {
            space.classList.remove('red-piece', 'yellow-piece', 'piece-spin');
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

start.addEventListener('click', () => {
    showPlayerSelect();

    playSound('clickfast');
});

ruleBook.addEventListener('click', () => {
    toggleRules();

    playSound('pageturn');
});

onePlayer.addEventListener('click', () => {
    mainMenuRoom.leave();

    createSingleplayer();

    playSound('clickfast');
});

twoPlayers.addEventListener('click', () => {
    showConnecting();

    mainMenuRoom.leave();

    joinQueue();

    playSound('clickfast');
});

goBack.addEventListener('click', () => {
    if (goBack.classList.contains('go-back-to-player-select')) {
        leaveQueue();
        showPlayerSelect();
    } else {
        showStart();
    }

    playSound('button');
});

joinMainMenu();
