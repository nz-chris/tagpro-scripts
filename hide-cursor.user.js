// ==UserScript==
// @name         TagPro Hide Cursor
// @version      1.0
// @description  Hide your inactive cursor when playing TagPro
// @author       Zagd
// @include      *://tagpro.koalabeast.com/game
// @include      *://tagpro.koalabeast.com/game?*
// @include      *://*.newcompte.fr:*
// @include      *://tagpro-maptest.koalabeast.com:*
// ==/UserScript==

const activeTimeout = 3000; // ms.
let active = 1;
let activeCheckTimeout;

function onInactive() {
    active = 0;
    document.documentElement.style.cursor = "none";
}

function onActive() {
    if (!active) {
        active = 1;
        document.documentElement.style.cursor = null;
    }
    clearTimeout(activeCheckTimeout);
    activeCheckTimeout = setTimeout(onInactive, activeTimeout);
}

function start() {
    addEventListener("mousemove", onActive);
    activeCheckTimeout = setTimeout(onInactive, activeTimeout);
}

function stop() {
    onActive();
    removeEventListener("mousemove", onActive);
    clearTimeout(activeCheckTimeout);
}

tagpro.ready(function () {
    if (tagpro.state === 1) {
        start();
    } else {
        tagpro.socket.on("time", function ({ state }) {
            if (state === 1) {
                start();
            }
        });
    }
    tagpro.socket.on("end", stop);
});