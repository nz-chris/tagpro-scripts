// ==UserScript==
// @name         TagPro Auto Wait
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Wait for a 4 or 6 player TagPro game. Be alerted when it begins. Anti-AFK kick.
// @author       Zagd
// @include      http://*.newcompte.fr:*
// @require      http://userscripts-mirror.org/scripts/source/107941.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

var waiting = GM_getValue("isWaiting");

tagpro.ready(function() {
    tagpro.socket.on('map', function (map) {
        waiting = GM_getValue("isWaiting");
        if (waiting) {
            insertHTML(4);
            wait(4, true);
        }
        tagpro.socket.on("chat", function (data) {
            if (!data || data === undefined || data === null) return;
            if (waiting) return;
            if (data.from === tagpro.playerId && /^!wait 4 */.test(data.message)) {
                setUpWait(4, data);
            } else if (data.from === tagpro.playerId && /^!wait 6 */.test(data.message)) {
                var playerCount = getPlayerCount();
                if (playerCount >= 4) {
                    setUpWait(6, data);
                } else {
                    chatToAll("Cannot wait for 6+ players yet. Use '!wait 4'");
                }
            }
        });
    });
});

function setUpWait(target, data) {
    var playerCount = getPlayerCount();
    if (playerCount >= target) {
        chatToAll("Already " + String(target) + " or more players.");
    } else {
        chatToAll("Waiting. I will be notified when there are " + String(target) + " or more players.");
        insertHTML(target);
        waiting = 1;
        GM_setValue("isWaiting", waiting);
        var alert = (/alert$/.test(data.message));
        wait(target, alert);
    }
}

function wait(target, alert) {
    var playerCount = getPlayerCount();
    if (playerCount >= target) {
        new Audio("http://tagpro-diameter.koalabeast.com/sounds/alertlong.mp3").play();
        new Audio("http://tagpro-diameter.koalabeast.com/sounds/go.mp3").play();
        if (alert) {
            alert("TagPro game reached player count target!");
        }
    } else if (waiting) {
        antiAFK();
        setTimeout(function() { wait(target, alert); }, 2500);
    }
}

function unWait() {
    chatToAll("I'm back from waiting!");
    waiting = false;
    GM_setValue("isWaiting", 0);
    removeHTML();
}

function getPlayerCount() {
    var playerCount = 0;
    for (var playerId in tagpro.players) {
        if (tagpro.players.hasOwnProperty(playerId)) {
            playerCount++;
        }
    }
    return playerCount;
}

function antiAFK() {
    if (tagpro.state === 1) {
        tagpro.socket.emit('keydown', {k: 'space'});
        tagpro.socket.emit('keyup', {k: 'space'});
    }
}

function chatToAll(message) {
    setTimeout(function () {
        tagpro.socket.emit("chat", {message: message, toAll: true});
    }, 750);
}

function insertHTML(target) {
    var css = '#waitWarning {' +
        'font-size: 80% ;' +
        'color: #00FF00;' +
        'top: 10px;' +
        'left: 100px;' +
        'position: absolute;' +
        '}';
    css = css.concat(
        '#unWaitButton {' +
        'border: none;' +
        'margin-left: 15px;' +
        'cursor: pointer;' +
        'z-index: 999999;' +
        'position: fixed;' +
        '}'
    );
    var style = document.createElement('style');

    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }
    document.getElementsByTagName('head')[0].appendChild(style);

    window.document.getElementById('exit').insertAdjacentHTML(
        'afterend',
        '<div id="waitWarning">' +
        'You are waiting for ' + String(target) + ' or more players and will not be kicked for AFK.' +
        '<button id="unWaitButton">Stop Waiting</button>' +
        '</div>'
    );
    window.document.getElementById('unWaitButton').addEventListener('click', unWait);
}

function removeHTML() {
    var element = document.getElementById("waitWarning");
    element.parentNode.removeChild(element);
}