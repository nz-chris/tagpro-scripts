// ==UserScript==
// @name         TagPro Chat Enhancer
// @version      0.1.0
// @description  Chat enhancer. So far, it will just allow you to move with arrow keys whilst typing a message.
// @author       Zagd
// @downloadURL  https://github.com/zagd/tagpro-scripts/raw/master/chat-enhancer.user.js
// @updateURL    https://github.com/zagd/tagpro-scripts/raw/master/chat-enhancer.user.js
// @include      *://tagpro.koalabeast.com/game
// @include      *://tagpro.koalabeast.com/game?*
// @include      *://*.newcompte.fr:*
// @include      *://tagpro-maptest.koalabeast.com:*
// ==/UserScript==

const PLAYABLE_STATES = [1, 5];

const handleKey = e => {
    if (!tagpro.disableControls) return;

    const { key } = e;

    const isArrow = ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"].includes(key);

    if (!isArrow) return;

    const dir = key.match(/Arrow(.*)/)[1];
    const isPressing = e.type === "keydown";

    tagpro.players[tagpro.playerId].pressing[arrow] !== isPressing && tagpro.sendKeyPress(dir, isReleasing);
};

const start = () => {
    addEventListener("keydown", handleKey);
    addEventListener("keyup", handleKey);
};

const stop = () => {
    removeEventListener("keydown", handleKey);
    removeEventListener("keyup", handleKey);
};


tagpro.ready(() => {
    if (PLAYABLE_STATES.includes(tagpro.state)) {
        start();
    } else {
        tagpro.socket.on("time", ({ state }) => PLAYABLE_STATES.includes(state) && start());
    }

    tagpro.socket.on("end", stop);
});
