import { joinRoom, selfId } from 'https://cdn.skypack.dev/trystero/ipfs';

const config = { appId: 'connect-4-minus-1' };

const mainMenu = joinRoom(config, 'main-menu');

const byId = document.getElementById.bind(document);

const online = byId('online');

// const decode = new TextDecoder().decode;

console.log(`My name is ${selfId}!`);

init();

function joinGame(firstPlayer, secondPlayer) {
    console.log(`First player: ${firstPlayer}; second player: ${secondPlayer}.`);
}

function updateOnline() {
    const numberOfPeers = mainMenu.getPeers().length;

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

    playerSelect.classList.toggle('hide', true);
    goBack.classList.toggle('hide', true);
    connecting.classList.toggle('hide', false);
}

function showPlayerSelect() {
    const start = byId('start');
    const ruleBook = byId('rule-book');
    const rules = byId('rules');
    const playerSelect = byId('player-select');
    const goBack = byId('go-back');

    start.classList.toggle('hide', true);
    rules.classList.toggle('hide', true);
    ruleBook.classList.toggle('hide', true);
    playerSelect.classList.toggle('hide', false);
    goBack.classList.toggle('hide', false);
}

function showStart() {
    const start = byId('start');
    const ruleBook = byId('rule-book');
    const playerSelect = byId('player-select');
    const goBack = byId('go-back');

    playerSelect.classList.toggle('hide', true);
    goBack.classList.toggle('hide', true);
    start.classList.toggle('hide', false);
    ruleBook.classList.toggle('hide', false);
}

function init() {
    const start = byId('start');
    const ruleBook = byId('rule-book');
    const onePlayer = byId('one-player');
    const twoPlayers = byId('two-players');
    const goBack = byId('go-back');

    start.addEventListener('click', ev => showPlayerSelect());
    ruleBook.addEventListener('click', ev => toggleRules());

    twoPlayers.addEventListener('click', ev => {
        showConnecting();

        mainMenu.leave();

        const queue = joinRoom(config, 'queue');

        let queuedFirst = false;

        function joinPlayer() {
            const players = queue.getPeers();

            const player = players.shift();

            if (player) {
                queue.leave();

                const firstPlayer = queuedFirst ? selfId : player;
                const secondPlayer = firstPlayer == selfId ? player : selfId;

                joinGame(firstPlayer, secondPlayer);

                return;
            }

            queuedFirst = true;
        }

        joinPlayer();

        queue.onPeerJoin(peerId => {
            joinPlayer();
        });

        queue.onPeerLeave(peerId => {
            joinPlayer();
        });
    });

    goBack.addEventListener('click', ev => showStart());
}

mainMenu.onPeerJoin(peerId => {
    const numberOfPeers = mainMenu.getPeers().length;

    console.log(`${peerId} has joined the room. ${numberOfPeers} ${numberOfPeers == 1 ? 'peer is' : 'peers are'} online.`);

    online.classList.toggle('hide', false);

    updateOnline();
});

mainMenu.onPeerLeave(peerId => {
    const numberOfPeers = mainMenu.getPeers().length;

    console.log(`${peerId} has left the room. ${numberOfPeers} ${numberOfPeers == 1 ? 'peer is' : 'peers are'} online.`);

    if (!(numberOfPeers > 0)) {
        online.classList.toggle('hide', true);
    }

    updateOnline();
});
