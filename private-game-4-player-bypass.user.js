// ==UserScript==
// @name         TagPro Bypass Private Game 4 Player Minimum
// @version      1.0.1
// @author       Zagd
// @downloadURL  https://github.com/zagd/tagpro-scripts/raw/master/private-game-4-player-bypass.user.js
// @updateURL    https://github.com/zagd/tagpro-scripts/raw/master/private-game-4-player-bypass.user.js
// @include      *://tagpro.koalabeast.com/groups/*
// ==/UserScript==

const launchButton = document.getElementById("launch-private-btn");

if (launchButton) {
    const getNeedMsgsCount = () => [...document.querySelector(".chat-log").querySelectorAll(".chat-message")]
        .filter(msg => msg.innerText.match(/^Need [123] more players to launch private game\.$/))
        .length;

    const onLaunch = () => {
        const preNeedMsgCount = getNeedMsgsCount();
        setTimeout(() => {
            if (getNeedMsgsCount() > preNeedMsgCount) location.href = "https://tagpro.koalabeast.com/games/find";
        }, 1500);
    };

    launchButton.addEventListener("click", onLaunch);
}
