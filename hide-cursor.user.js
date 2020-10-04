// ==UserScript==
// @name         TagPro Hide Cursor
// @version      1.0.1
// @description  Hide your inactive cursor when playing TagPro
// @author       Zagd
// @downloadURL  https://github.com/zagd/tagpro-scripts/raw/master/hide-cursor.user.js
// @updateURL    https://github.com/zagd/tagpro-scripts/raw/master/hide-cursor.user.js
// @include      *://tagpro.koalabeast.com/game
// @include      *://tagpro.koalabeast.com/game?*
// @include      *://*.newcompte.fr:*
// @include      *://tagpro-maptest.koalabeast.com:*
// ==/UserScript==

const PLAYABLE_STATES = [1, 5];

const ACTIVE_TIMEOUT = 3000; // ms.

let active = 1;
let activeCheckTimeout;

const onInactive = () => {
    active = 0;
    document.documentElement.style.cursor = "none";
};

const onActive = () => {
    if (!active) {
        active = 1;
        document.documentElement.style.cursor = null;
    }
    clearTimeout(activeCheckTimeout);
    activeCheckTimeout = setTimeout(onInactive, ACTIVE_TIMEOUT);
};

const start = () => {
    addEventListener("mousemove", onActive);
    activeCheckTimeout = setTimeout(onInactive, ACTIVE_TIMEOUT);
}

const stop = () => {
    onActive();
    removeEventListener("mousemove", onActive);
    clearTimeout(activeCheckTimeout);
};

tagpro.ready(() => {
    if (PLAYABLE_STATES.includes(tagpro.state)) {
        start();
    } else {
        tagpro.socket.on("time", ({ state }) => PLAYABLE_STATES.includes(state) && start());
    }

    tagpro.socket.on("end", stop);
});

addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if (!tagpro) {
            start();
        }
    }, ACTIVE_TIMEOUT);
});
