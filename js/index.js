import { joinRoom, selfId } from 'https://cdn.skypack.dev/trystero/ipfs';
import { sounds } from './constants.js';
import { PieceType, PlayerTeam } from './enums.js';
import { AI, Jason, MrQuick, Player, Timmy } from './game.js';
import { Grid } from './grid.js';

// Trystero config
const config = { appId: 'connect-4-minus-1' };

// Trystero rooms
let mainMenuRoom;
let queueRoom;
let gameRoom;

// Testing
let testing = false;

const byId = document.getElementById.bind(document);

if (localStorage.getItem('wins') === null) {
    localStorage.setItem('wins', 0);
}

console.log(`My name is ${selfId}!`);

// Plays a sound given a name
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

// Creates a local singleplayer game
function createSingleplayer() {
    const body = document.body;
    const mainMenu = byId('main-menu');
    const youElem = byId('you');
    const enemy = byId('enemy');
    const leftStats = byId('left-stats');
    const rightStats = byId('right-stats');
    const youMoveTool = byId('you-move-tool');
    const enemyMoveTool = byId('enemy-move-tool');
    const youPieceCount = byId('you-piece-count');
    const enemyPieceCount = byId('enemy-piece-count');
    const remove = byId('remove');
    const nuclearCountdown = byId('nuclear-countdown');
    const selectAi = byId('select-ai');
    const goBack = byId('go-back');
    const removeLogo = byId('remove-logo');

    const youPieceSpin = youMoveTool.querySelector('.piece-spin');
    const enemyPieceSpin = enemyMoveTool.querySelector('.piece-spin');

    const gridColumns = document.getElementsByClassName('grid-column');
    const gridSpaces = document.getElementsByClassName('grid-space');

    let removeMode = false;
    let removeTimeout;
    let countdown = 10;
    let countdownInterval;

    let ended = false;
    let ending = false;

    const grid = createGrid();

    let you;

    let opponent;

    const wins = parseInt(localStorage.getItem('wins'));

    if (wins > 13) {
        switch (selectAi.selectedOptions[0].value) {
            case 'MrQuick':
                you = new Player(selfId, PlayerTeam.YELLOW);
                opponent = new MrQuick('Mr. Quick', PlayerTeam.RED);

                opponent.onPlaying(() => {
                    setTimeout(() => {
                        if (ending) {
                            opponent.stopPlaying();

                            return;
                        }

                        opponent.playMove(grid);

                        playSound('kerplunk');
                    }, 273 * 1.5);
                });

                rightStats.classList.remove('Timmy', 'Jason');
                rightStats.classList.add('MrQuick');

                break;

            case 'Jason':
                you = new Player(selfId, PlayerTeam.RED);
                opponent = new Jason('Jason', PlayerTeam.YELLOW);

                opponent.onPlaying(() => {
                    setTimeout(() => {
                        if (ending) {
                            opponent.stopPlaying();

                            return;
                        }

                        opponent.playMove(grid);

                        playSound('kerplunk');
                    }, 1000);
                });

                rightStats.classList.remove('Timmy', 'MrQuick');
                rightStats.classList.add('Jason');

                break;

            case 'Timmy':
                you = new Player(selfId, PlayerTeam.RED);
                opponent = new Timmy('Timmy', PlayerTeam.YELLOW);

                opponent.onPlaying(() => {
                    setTimeout(() => {
                        if (ending) {
                            opponent.stopPlaying();

                            return;
                        }

                        opponent.playMove(grid);

                        playSound('kerplunk');
                    }, 1250);
                });

                rightStats.classList.remove('Jason', 'MrQuick');
                rightStats.classList.add('Timmy');

                break;

            default:
                break;
        }
    } else if (wins === 13) {
        you = new Player(selfId, PlayerTeam.YELLOW);
        opponent = new MrQuick('Mr. Quick', PlayerTeam.RED);

        opponent.onPlaying(() => {
            setTimeout(() => {
                if (ending) {
                    opponent.stopPlaying();

                    return;
                }

                opponent.playMove(grid);

                playSound('kerplunk');
            }, 273 * 1.5);
        });

        rightStats.classList.remove('Timmy', 'Jason');
        rightStats.classList.add('MrQuick');
    } else if (wins < 13 && wins > 3) {
        you = new Player(selfId, PlayerTeam.RED);
        opponent = new Jason('Jason', PlayerTeam.YELLOW);

        opponent.onPlaying(() => {
            setTimeout(() => {
                if (ending) {
                    opponent.stopPlaying();

                    return;
                }

                opponent.playMove(grid);

                playSound('kerplunk');
            }, 1000);
        });

        rightStats.classList.remove('Timmy', 'MrQuick');
        rightStats.classList.add('Jason');
    } else {
        you = new Player(selfId, PlayerTeam.RED);
        opponent = new Timmy('Timmy', PlayerTeam.YELLOW);

        opponent.onPlaying(() => {
            setTimeout(() => {
                if (ending) {
                    opponent.stopPlaying();

                    return;
                }

                opponent.playMove(grid);

                playSound('kerplunk');
            }, 1250);
        });

        rightStats.classList.remove('Jason', 'MrQuick');
        rightStats.classList.add('Timmy');
    }

    document.title = `You (🏆${wins}) vs. ${opponent.name}`;

    const youTeam = you.team;
    const opponentTeam = opponent.team;

    function leave(pressedBack = true) {
        ending = true;

        if (pressedBack) {
            clearTimeout(removeTimeout);
            clearInterval(countdownInterval);
            toggleNuclear(false);
        }

        remove.removeEventListener('click', clickReset);
        remove.classList.toggle('reset-used', false);

        youPieceSpin.classList.toggle('piece-spin', true);
        enemyPieceSpin.classList.toggle('piece-spin', true);

        toggleGrid(false);
        resetGrid();

        joinMainMenu();

        hideModal();

        showStart();

        ended = true;
    }

    function win() {
        ending = true;

        incrementWin();

        clearInterval(countdownInterval);
        clearTimeout(removeTimeout);
        toggleNuclear(false);

        playSound('victory');

        setTimeout(() => {
            showModal('You win! Game over.').then(() => {
                leave(false);
            });
        }, 500);
    }

    function lose() {
        ending = true;

        clearInterval(countdownInterval);
        clearTimeout(removeTimeout);
        toggleNuclear(false);

        playSound('glassbreak');

        setTimeout(() => {
            showModal('You lose! Game over.').then(() => {
                leave(false);
            });
        }, 500);
    }

    function stalemate(customText = '') {
        ending = true;

        clearInterval(countdownInterval);
        clearTimeout(removeTimeout);

        setTimeout(() => {
            playSound('glassbreak');

            showModal(customText.length > 0 ? customText : 'No contest.').then(() => {
                leave(false);
            });
        }, 2000);
    }

    you.played(() => {
        const winner = getWinner(grid);

        youPieceCount.innerText = you.getRemainingPieces().length;

        youPieceSpin.classList.toggle('piece-spin', false);
        enemyPieceSpin.classList.toggle('piece-spin', true);

        leftStats.classList.toggle(`${youTeam == PlayerTeam.RED ? 'red' : 'yellow'}-stats-active`, false);
        rightStats.classList.toggle(`${opponentTeam == PlayerTeam.RED ? 'red' : 'yellow'}-stats-active`, true);

        playSound('kerplunk');

        if (you.getRemainingPieces().length == 0 && opponent.getRemainingPieces().length == 0) {
            stalemate();

            return;
        }

        if (winner != null) {
            if (you.team == winner) {
                win();
            } else {
                lose();
            }

            return;
        }

        opponent.play();
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
        if (ending) {
            return;
        }

        const winner = getWinner(grid);

        enemyPieceCount.innerText = opponent.getRemainingPieces().length;

        youPieceSpin.classList.toggle('piece-spin', true);
        enemyPieceSpin.classList.toggle('piece-spin', false);

        leftStats.classList.toggle(`${youTeam == PlayerTeam.RED ? 'red' : 'yellow'}-stats-active`, true);
        rightStats.classList.toggle(`${opponentTeam == PlayerTeam.RED ? 'red' : 'yellow'}-stats-active`, false);

        playSound('kerplunk');

        if (you.getRemainingPieces().length == 0 && opponent.getRemainingPieces().length == 0) {
            stalemate(`${opponent.name} has had enough!`);

            return;
        }

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
        if (ending) {
            return;
        }

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

        document.removeEventListener('mousemove', moveNuclear);
        toggleNuclear(false);

        remove.classList.toggle('reset-used', true);

        remove.removeEventListener('click', clickReset);
    }

    function clickReset() {
        if (!you.canRemovePiece() || !you.isPlaying()) {
            return;
        }

        toggleNuclear(true);
        document.addEventListener('mousemove', moveNuclear);

        you.remove();

        removeMode = true;

        nuclearCountdown.innerText = countdown;

        let currentTime = Date.now();

        removeTimeout = setTimeout(disableRemove, 10000);
        countdownInterval = setInterval(() => {
            const deltaTime = (Date.now() - currentTime) / 1000;

            countdown = countdown - deltaTime;

            const ceil = Math.ceil(countdown);

            nuclearCountdown.innerText = ceil;

            nuclearCountdown.classList.toggle('countdown-red', ceil > 0 && ceil < 4);

            if (countdown <= 0) {
                clearInterval(countdownInterval);
            }

            currentTime = Date.now();
        }, 3);
    }

    for (const gridColumn of gridColumns) {
        gridColumn.addEventListener('click', () => {
            if (ending || !you.isPlaying() || removeMode) {
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

    if (you.team == PlayerTeam.RED) {
        you.play();
    } else {
        opponent.play();
    }

    if (wins > 0) {
        youElem.innerHTML = `You <span style="font-size: 0.375em; vertical-align: middle">(<img src="/img/Frame 15.svg" alt="" style="height: 1em; vertical-align: -0.1em"> ${wins})</span>`;
    } else {
        youElem.innerText = 'You';
    }

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

    leftStats.classList.toggle('red-stats-active', false);
    leftStats.classList.toggle('yellow-stats-active', false);

    rightStats.classList.toggle('red-stats-active', false);
    rightStats.classList.toggle('yellow-stats-active', false);

    leftStats.classList.toggle(`${youTeam == PlayerTeam.RED ? 'red' : 'yellow'}-stats-active`, you.isPlaying());
    rightStats.classList.toggle(`${opponentTeam == PlayerTeam.RED ? 'red' : 'yellow'}-stats-active`, opponent.isPlaying());

    removeLogo.classList.remove('rainbow');
    if (Math.ceil(Math.random() * 100) === 42) {
        removeLogo.classList.add('rainbow');
    }

    goBack.removeEventListener('click', goBackToPlayerSelect);
    goBack.removeEventListener('click', showStart);
    goBack.addEventListener('click', leave, { once: true });

    body.classList.toggle('no-overflow', true);

    toggleGrid(true);
}

// Creates a P2P multiplayer game
function createMultiplayer(firstPlayer, secondPlayer) {
    const body = document.body;
    const mainMenu = byId('main-menu');
    const youElem = byId('you');
    const enemy = byId('enemy');
    const leftStats = byId('left-stats');
    const rightStats = byId('right-stats');
    const youMoveTool = byId('you-move-tool');
    const enemyMoveTool = byId('enemy-move-tool');
    const youPieceCount = byId('you-piece-count');
    const enemyPieceCount = byId('enemy-piece-count');
    const remove = byId('remove');
    const nuclearCountdown = byId('nuclear-countdown');
    const goBack = byId('go-back');
    const removeLogo = byId('remove-logo');

    const youPieceSpin = youMoveTool.querySelector('.piece-spin');
    const enemyPieceSpin = enemyMoveTool.querySelector('.piece-spin');

    const gridColumns = document.getElementsByClassName('grid-column');
    const gridSpaces = document.getElementsByClassName('grid-space');

    let removeMode = false;
    let removeTimeout;
    let countdown = 10;
    let countdownInterval;
    let nukingInterval;

    let ended = false;
    let ending = false;
    let endingAbruptly = true;

    queueRoom.leave();

    gameRoom = joinRoom(config, firstPlayer + secondPlayer);

    const [sendWins, winsReceived] = gameRoom.makeAction('wins');
    const [placePiece, getPiecePlaced] = gameRoom.makeAction('place');
    const [nuke, nuking] = gameRoom.makeAction('nuke');
    const [toggleNuke, nukeToggled] = gameRoom.makeAction('toggle');
    const [removePiece, getPieceRemoved] = gameRoom.makeAction('remove');

    const grid = createGrid();

    const playerOne = new Player(firstPlayer, PlayerTeam.RED);
    const playerTwo = new Player(secondPlayer, PlayerTeam.YELLOW);

    const you = playerOne.name == selfId ? playerOne : playerTwo;
    const enemyPlayer = you == playerOne ? playerTwo : playerOne;

    const wins = parseInt(localStorage.getItem('wins'));

    const youTeam = you.team;
    const enemyTeam = enemyPlayer.team;

    function leave(pressedBack = true) {
        ending = true;

        if (pressedBack) {
            clearTimeout(removeTimeout);
            clearInterval(countdownInterval);
            toggleNuclear(false);
        }

        gameRoom.leave();

        remove.removeEventListener('click', clickReset);
        remove.classList.toggle('reset-used', false);

        youPieceSpin.classList.toggle('piece-spin', true);
        enemyPieceSpin.classList.toggle('piece-spin', true);

        toggleGrid(false);
        resetGrid();

        joinMainMenu();

        hideModal();

        showStart();

        ended = true;
    }

    function win() {
        ending = true;
        endingAbruptly = false;

        incrementWin();

        clearInterval(countdownInterval);
        clearTimeout(removeTimeout);
        toggleNuclear(false);

        playSound('victory');

        setTimeout(() => {
            showModal('You win! Game over.').then(() => {
                leave(false);
            });
        }, 500);
    }

    function lose() {
        ending = true;
        endingAbruptly = false;

        clearInterval(countdownInterval);
        clearTimeout(removeTimeout);
        toggleNuclear(false);

        playSound('glassbreak');

        setTimeout(() => {
            showModal('You lose! Game over.').then(() => {
                leave(false);
            });
        }, 500);
    }

    winsReceived((w, peerId) => {
        let truncName;
        let titleText = `You `;

        if (peerId instanceof Uint8Array) {
            truncName = new TextDecoder().decode(peerId).substring(0, 5);
        } else {
            truncName = peerId.substring(0, 5);
        }

        if (wins > 0) {
            titleText = titleText + `(🏆${wins}) vs. `;
        } else {
            titleText = titleText + 'vs. ';
        }

        if (w > 0) {
            enemy.innerHTML = `<span style="font-size: 0.375em; vertical-align: middle">(<img src="/img/Frame 15.svg" alt="" style="height: 1em; vertical-align: -0.1em"> ${w})</span> ${truncName}`;

            titleText = titleText + `${truncName} (🏆${w})`;
        } else {
            enemy.innerText = truncName;

            titleText = titleText + truncName;
        }

        document.title = titleText;
    });

    getPiecePlaced((column, peerId) => {
        const player = playerOne.name == peerId ? playerOne : playerTwo;

        player.placePiece(grid, column);
    });

    getPieceRemoved(([column, row], peerId) => {
        const player = playerOne.name == peerId ? playerOne : playerTwo;

        player.removePiece(grid, column, row);
    });

    nuking(([c, x, y], peerId) => {
        clearInterval(countdownInterval);

        const ceil = Math.ceil(c);

        nuclearCountdown.classList.toggle('countdown-red', ceil > 0 && ceil < 4);

        const nuclear = byId('nuclear');

        nuclearCountdown.innerText = ceil;

        if (x !== undefined && y !== undefined) {
            nuclear.style.left = x + 'px';
            nuclear.style.top = y + 'px';
            nuclearCountdown.style.left = x + 'px';
            nuclearCountdown.style.top = y + 'px';
        }
    });

    nukeToggled((toggle, peerId) => {
        toggleNuclear(toggle);
    });

    playerOne.played(() => {
        playSound('kerplunk');

        if (playerOne.getRemainingPieces().length == 0 && playerTwo.getRemainingPieces().length == 0) {
            lose();

            return;
        }

        playerTwo.play();
    });

    playerOne.removed(() => {
        playSound('collide');
    });

    playerTwo.played(() => {
        playSound('kerplunk');

        if (playerTwo.getRemainingPieces().length == 0 && playerOne.getRemainingPieces().length == 0) {
            lose();

            return;
        }

        playerOne.play();
    });

    playerTwo.removed(() => {
        playSound('collide');
    });

    you.played(() => {
        const winner = getWinner(grid);

        youPieceCount.innerText = you.getRemainingPieces().length;

        youPieceSpin.classList.toggle('piece-spin', false);
        enemyPieceSpin.classList.toggle('piece-spin', true);

        leftStats.classList.toggle(`${youTeam == PlayerTeam.RED ? 'red' : 'yellow'}-stats-active`, false);
        rightStats.classList.toggle(`${enemyTeam == PlayerTeam.RED ? 'red' : 'yellow'}-stats-active`, true);

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

        const winner = getWinner(grid);

        if (winner != null) {
            if (you.team == winner) {
                win();
            } else {
                lose();
            }

            return;
        }
    });

    enemyPlayer.played(() => {
        const winner = getWinner(grid);

        enemyPieceCount.innerText = enemyPlayer.getRemainingPieces().length;

        youPieceSpin.classList.toggle('piece-spin', true);
        enemyPieceSpin.classList.toggle('piece-spin', false);

        leftStats.classList.toggle(`${youTeam == PlayerTeam.RED ? 'red' : 'yellow'}-stats-active`, true);
        rightStats.classList.toggle(`${enemyTeam == PlayerTeam.RED ? 'red' : 'yellow'}-stats-active`, false);

        if (winner != null) {
            if (you.team == winner) {
                win();
            } else {
                lose();
            }

            return;
        }
    });

    enemyPlayer.removed(() => {
        const winner = getWinner(grid);

        if (winner != null) {
            if (you.team == winner) {
                win();
            } else {
                lose();
            }

            return;
        }
    });

    function replicateMove(ev = undefined) {
        if (ev !== undefined) {
            moveNuclear(ev);

            nuke([countdown, ev.pageX, ev.pageY]);
        } else {
            nuke([countdown]);
        }
    }

    function disableRemove() {
        setTimeout(() => {
            removeMode = false;
        }, 0);

        document.removeEventListener('mousemove', replicateMove);
        clearInterval(nukingInterval);

        clearTimeout(removeTimeout);
        clearInterval(countdownInterval);

        toggleNuclear(false);
        toggleNuke(false);

        remove.classList.toggle('reset-used', true);

        remove.removeEventListener('click', clickReset);
    }

    function clickReset() {
        if (!you.canRemovePiece() || !you.isPlaying()) {
            return;
        }

        toggleNuclear(true);
        toggleNuke(true);
        document.addEventListener('mousemove', replicateMove);
        nukingInterval = setInterval(replicateMove, 3);

        you.remove();

        removeMode = true;

        nuclearCountdown.innerText = countdown;

        let currentTime = Date.now();

        removeTimeout = setTimeout(disableRemove, 10000);
        countdownInterval = setInterval(() => {
            const deltaTime = (Date.now() - currentTime) / 1000;

            countdown = countdown - deltaTime;

            const ceil = Math.ceil(countdown);

            nuclearCountdown.innerText = ceil;

            nuclearCountdown.classList.toggle('countdown-red', ceil > 0 && ceil < 4);

            if (countdown <= 0) {
                clearInterval(countdownInterval);
            }

            currentTime = Date.now();
        }, 3);
    }

    for (const gridColumn of gridColumns) {
        gridColumn.addEventListener('click', () => {
            if (ending || !you.isPlaying() || removeMode) {
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

        sendWins(wins);

        if (wins > 0) {
            youElem.innerHTML = `You <span style="font-size: 0.375em; vertical-align: middle">(<img src="/img/Frame 15.svg" alt="" style="height: 1em; vertical-align: -0.1em"> ${wins})</span>`;
        } else {
            youElem.innerText = 'You';
        }

        // enemy.innerText = truncName;
        // document.title = `You (🏆${wins}) vs. ${truncName}`;

        youPieceCount.innerText = you.getRemainingPieces().length;
        enemyPieceCount.innerText = enemyPlayer.getRemainingPieces().length;

        youPieceSpin.classList.toggle('red', youTeam == PlayerTeam.RED);
        youPieceSpin.classList.toggle('yellow', youTeam == PlayerTeam.YELLOW);
        enemyPieceSpin.classList.toggle('red', enemyTeam == PlayerTeam.RED);
        enemyPieceSpin.classList.toggle('yellow', enemyTeam == PlayerTeam.YELLOW);

        youPieceSpin.classList.toggle('piece-spin', you.isPlaying());
        enemyPieceSpin.classList.toggle('piece-spin', enemyPlayer.isPlaying());

        leftStats.classList.toggle('red-stats-active', false);
        leftStats.classList.toggle('yellow-stats-active', false);

        rightStats.classList.toggle('red-stats-active', false);
        rightStats.classList.toggle('yellow-stats-active', false);

        rightStats.classList.remove('MrQuick', 'Jason', 'Timmy');

        leftStats.classList.toggle(`${youTeam == PlayerTeam.RED ? 'red' : 'yellow'}-stats-active`, you.isPlaying());
        rightStats.classList.toggle(`${enemyTeam == PlayerTeam.RED ? 'red' : 'yellow'}-stats-active`, enemyPlayer.isPlaying());

        removeLogo.classList.remove('rainbow');
        if (Math.ceil(Math.random() * 100) === 42) {
            removeLogo.classList.add('rainbow');
        }

        goBack.removeEventListener('click', goBackToPlayerSelect);
        goBack.removeEventListener('click', showStart);
        goBack.addEventListener('click', leave, { once: true });

        body.classList.toggle('no-overflow', true);

        toggleGrid(true);
    });

    gameRoom.onPeerLeave(() => {
        if (!endingAbruptly) {
            return;
        }

        clearInterval(countdownInterval);
        clearTimeout(removeTimeout);
        toggleNuclear(false);

        setTimeout(() => {
            ending = true;

            showModal('Your opponent has left the game. Game over!').then(() => leave());
        }, 500);
    });
}

function incrementWin() {
    return localStorage.setItem('wins', parseInt(localStorage.getItem('wins')) + 1);
}

function deleteWins() {
    return localStorage.setItem('wins', 0);
}

function moveNuclear(ev) {
    const nuclear = byId('nuclear');
    const nuclearCountdown = byId('nuclear-countdown');

    const pageX = ev.pageX;
    const pageY = ev.pageY;

    nuclear.style.left = pageX + 'px';
    nuclear.style.top = pageY + 'px';
    nuclearCountdown.style.left = pageX + 'px';
    nuclearCountdown.style.top = pageY + 'px';
}

function toggleNuclear(toggle) {
    const nuclear = byId('nuclear');
    const nuclearCountdown = byId('nuclear-countdown');

    nuclear.classList.toggle('hide', !toggle);
    nuclearCountdown.classList.toggle('countdown-red', false);
    nuclearCountdown.classList.toggle('hide', !toggle);
}

function showModal(text) {
    const win = byId('win');
    const modal = win.parentElement;
    const ok = byId('ok');

    win.innerText = text;

    modal.classList.toggle('hide', false);

    return new Promise((resolve, reject) => {
        ok.addEventListener(
            'click',
            () => {
                modal.classList.toggle('hide', true);

                resolve();
            },
            { once: true }
        );
    });
}

function hideModal() {
    const win = byId('win');
    const modal = win.parentElement;

    modal.classList.toggle('hide', true);
}

function toggleAlert(toggle) {
    const win = byId('win');

    win.parentElement.classList.toggle('hide', !toggle);
}

// Checks the grid for a win and returns the determined winner if there happens to be one
function getWinner(grid) {
    const win = checkGrid(grid);

    if (win.length > 0) {
        showWin(win);

        return determineWinner(win);
    }

    return;
}

// Used by getWinner to determine the winner
function determineWinner(win) {
    const gridSpaces = document.querySelectorAll('.grid-space>div');

    for (const [gridColumn, row] of win) {
        for (const gridSpace of gridSpaces) {
            if (gridSpace.parentElement.parentElement.dataset.column == gridColumn && gridSpace.parentElement.dataset.row == row) {
                return gridSpace.classList.contains('red-piece') ? PlayerTeam.RED : PlayerTeam.YELLOW;
            }
        }
    }
}

// Function that spins the winning pieces on the grid
function showWin(win) {
    const gridSpaces = document.querySelectorAll('.grid-space>div');

    for (const [gridColumn, row] of win) {
        for (const gridSpace of gridSpaces) {
            if (gridSpace.parentElement.parentElement.dataset.column == gridColumn && gridSpace.parentElement.dataset.row == row) {
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

// Clears the grid of pieces and removes all active event listeners
function resetGrid() {
    const grid = byId('grid');

    const gridColumns = grid.getElementsByClassName('grid-column');

    for (const gridColumn of gridColumns) {
        const clone = gridColumn.cloneNode(true);

        gridColumn.parentElement.replaceChild(clone, gridColumn);
    }

    for (const space of document.querySelectorAll('.grid-space>div')) {
        space.classList.remove('red-piece', 'yellow-piece', 'piece-spin');
    }
}

// Creates the grid and sets up connections for placing and removing pieces on the grid
function createGrid() {
    const grid = new Grid();

    const gridColumns = document.getElementsByClassName('grid-column');

    for (const gridColumn of gridColumns) {
        const columnData = gridColumn.dataset.column;

        const column = grid.getColumn(columnData);

        // The grid will reflect a piece placed on the Grid class
        column.onPiecePlaced((piece, row) => {
            const space = gridColumn.querySelector(`[data-row='${row}']>div`);

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

        // The grid will reflect a piece removed on the Grid class
        column.onPieceRemoved((s, piece) => {
            const columnArray = column.asArray();

            for (let i = 0; i < columnArray.length; i++) {
                const space = gridColumn.querySelector(`[data-row='${i + 1}']>div`);

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

    // Return the grid to be used in games
    return grid;
}

// Leave the queue and return to the main menu
function leaveQueue() {
    queueRoom.leave();

    joinMainMenu();
}

// Joins a multiplayer queue
function joinQueue() {
    const connecting = byId('connecting');

    // Join the queue room
    queueRoom = joinRoom(config, 'queue');

    // Make an action for queuing
    const [queue, queued] = queueRoom.makeAction('queue');

    // Creates a timestamp to determine who plays first
    const now = Date.now();

    // Stores other players queuing with the timestamp they first queued
    let queuing = {};

    // When another player queues
    queued((timestamp, peerId) => {
        // Do not flood our queue with duplicates
        if (queuing[peerId]) {
            return;
        }

        // Put the player in the queue with their queue timestamp
        queuing[peerId] = timestamp;

        // Get the first player who queued first
        const [firstPlayer, firstTimestamp] = Object.entries(queuing)
            .sort((a, b) => a[a.length - 1] - b[b.length - 1])
            .shift();

        // Determine who is player one and player two
        const playerOne = now < firstTimestamp ? selfId : firstPlayer;
        const playerTwo = playerOne == selfId ? firstPlayer : selfId;

        // Create the multiplayer game for the two players
        setTimeout(createMultiplayer, 100, playerOne, playerTwo);
    });

    // When another player joins the queue
    queueRoom.onPeerJoin(peerId => {
        console.log(`${peerId} has joined the queue.`);

        connecting.innerText = 'Joining...';
        document.title = 'Joining...';
        // goBack.classList.toggle('hide', true);

        // Join the queue
        queue(now);
    });
}

// Joins the main menu room
function joinMainMenu() {
    const body = document.body;
    const mainMenu = byId('main-menu');
    const online = byId('online');
    const count = byId('count');

    mainMenu.classList.toggle('hide', false);

    body.classList.toggle('no-overflow', false);

    // Join the corresponding trystero room
    mainMenuRoom = joinRoom(config, 'main-menu');

    count.parentElement.classList.toggle('hide', !(parseInt(localStorage.getItem('wins')) > 0));

    count.innerText = localStorage.getItem('wins');

    // Update players online when players join or leave the room
    mainMenuRoom.onPeerJoin(peerId => {
        const numberOfPeers = Object.keys(mainMenuRoom.getPeers()).length;

        console.log(`${peerId} has joined the room. ${numberOfPeers} ${numberOfPeers == 1 ? 'peer is' : 'peers are'} online.`);

        online.parentElement.classList.toggle('hide', false);

        updateOnline();
    });

    mainMenuRoom.onPeerLeave(peerId => {
        const numberOfPeers = Object.keys(mainMenuRoom.getPeers()).length;

        console.log(`${peerId} has left the room. ${numberOfPeers} ${numberOfPeers == 1 ? 'peer is' : 'peers are'} online.`);

        if (!(numberOfPeers > 0)) {
            online.parentElement.classList.toggle('hide', true);
        }

        updateOnline();
    });

    document.addEventListener('wheel', fullScroll, false);

    document.title = 'Connect 4 Minus 1';
}

// Updates the online count
function updateOnline() {
    const numberOfPeers = Object.keys(mainMenuRoom.getPeers()).length;

    online.innerText = `${numberOfPeers} ${numberOfPeers == 1 ? 'player is' : 'players are'} online.`;
}

function toggleRules() {
    const rules = byId('rules');

    rules.classList.toggle('hide');
}

function goBackToPlayerSelect() {
    leaveQueue();
    showPlayerSelect();
}

function fullScroll(ev) {
    const direction = Math.floor(ev.deltaY / Math.abs(ev.deltaY));

    if (direction == 1) {
        scroll({
            top: 10000,
            behavior: 'smooth'
        });
    } else {
        scroll({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Show the connecting screen
function showConnecting() {
    const connecting = byId('connecting');
    const playerSelect = byId('player-select');
    const goBack = byId('go-back');
    const online = byId('online');
    const count = byId('count');
    const selectAiSetting = byId('selectaisetting');

    connecting.innerText = 'Looking for players...';
    document.title = 'Looking for players...';

    goBack.removeEventListener('click', showStart);
    goBack.addEventListener('click', goBackToPlayerSelect);

    playerSelect.classList.toggle('hide', true);
    online.parentElement.classList.toggle('hide', true);
    count.parentElement.classList.toggle('hide', true);
    connecting.classList.toggle('hide', false);
    selectAiSetting.classList.toggle('hide', true);
    goBack.classList.toggle('hide', false);
}

// Show the player select screen
function showPlayerSelect() {
    const connecting = byId('connecting');
    const start = byId('start');
    const reveal = byId('reveal');
    const ruleBook = byId('rule-book');
    const rules = byId('rules');
    const playerSelect = byId('player-select');
    const goBack = byId('go-back');
    const selectAiSetting = byId('selectaisetting');

    document.removeEventListener('wheel', fullScroll, false);
    goBack.removeEventListener('click', goBackToPlayerSelect);
    goBack.addEventListener('click', showStart);

    connecting.classList.toggle('hide', true);
    start.classList.toggle('hide', true);
    reveal.classList.toggle('hide', true);
    rules.classList.toggle('hide', true);
    ruleBook.classList.toggle('hide', true);
    playerSelect.classList.toggle('hide', false);
    goBack.classList.toggle('hide', false);
    selectAiSetting.classList.toggle('hide', !(parseInt(localStorage.getItem('wins')) > 13));
}

// Show start screen
function showStart() {
    const start = byId('start');
    const reveal = byId('reveal');
    const ruleBook = byId('rule-book');
    const connecting = byId('connecting');
    const playerSelect = byId('player-select');
    const goBack = byId('go-back');
    const count = byId('count');
    const selectAiSetting = byId('selectaisetting');

    document.removeEventListener('wheel', fullScroll, false);
    document.addEventListener('wheel', fullScroll, false);

    connecting.classList.toggle('hide', true);
    playerSelect.classList.toggle('hide', true);
    goBack.classList.toggle('hide', true);
    start.classList.toggle('hide', false);
    reveal.classList.toggle('hide', false);
    ruleBook.classList.toggle('hide', false);
    selectAiSetting.classList.toggle('hide', true);
    count.parentElement.classList.toggle('hide', !(parseInt(localStorage.getItem('wins')) > 0));
}

// Setup default event listeners for the main menu
const start = byId('start');
const ruleBook = byId('rule-book');
const onePlayer = byId('one-player');
const twoPlayers = byId('two-players');
const goBack = byId('go-back');
const ok = byId('ok');

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
    playSound('button');
});

ok.addEventListener('click', () => toggleAlert(false));

// Join the main menu
joinMainMenu();
