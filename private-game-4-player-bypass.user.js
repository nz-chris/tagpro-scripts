// ==UserScript==
// @name         TagPro Bypass Private Game 4 Player Minimum
// @version      1.0.0
// @author       Zagd
// @downloadURL  https://github.com/zagd/tagpro-scripts/raw/master/private-game-4-player-bypass.user.js
// @updateURL    https://github.com/zagd/tagpro-scripts/raw/master/private-game-4-player-bypass.user.js
// @include      *://tagpro.koalabeast.com/groups/*
// ==/UserScript==

const launchButton = document.getElementById("launch-private-btn");

let needMsgCount = 0;

if (launchButton) {
    const getNeedMsgsCount = () => {
        const chatLog = document.querySelector(".chat-log");
        const count = [...chatLog.querySelectorAll(".chat-message")]
            .filter(msg => msg.innerText.match(/^Need [123] more players to launch private game\.$/))
            .length;
        return count;
    };

    const setNeedMsgsCount = () => {
        needMsgCount = getNeedMsgsCount();
    };

    const onLaunch = () => {
        if (getNeedMsgsCount() > needMsgCount) {
            location.href = "https://tagpro.koalabeast.com/games/find";
        }
    };

    launchButton.addEventListener("mousedown", setNeedMsgsCount);
    launchButton.addEventListener("click", onLaunch);
}
