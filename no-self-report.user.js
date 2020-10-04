// ==UserScript==
// @name         TagPro No Self-Report
// @version      1.0.0
// @description  Don't bring up the report/kick dialog if you happen to click your own ball.
// @author       Zagd
// @downloadURL  https://github.com/zagd/tagpro-scripts/raw/master/no-self-report.user.js
// @updateURL    https://github.com/zagd/tagpro-scripts/raw/master/no-self-report.user.js
// @include      *://tagpro.koalabeast.com/game
// @include      *://tagpro.koalabeast.com/game?*
// @include      *://*.newcompte.fr:*
// @include      *://tagpro-maptest.koalabeast.com:*
// ==/UserScript==

const PLAYABLE_STATES = [1, 5];

const start = () => {
    tagpro.kick.clickBall = () => {};
    const originalPlayerFunc = tagpro.kick.player;
    tagpro.kick.player = player => {
        if (tagpro.spectator || player.id !== tagpro.playerId) {
            originalPlayerFunc(player);
        }
    };
};

tagpro.ready(() => {
    if (PLAYABLE_STATES.includes(tagpro.state)) {
        start();
    } else {
        tagpro.socket.on("time", ({ state }) => PLAYABLE_STATES.includes(state) && start());
    }
});
