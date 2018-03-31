// ==UserScript==
// @name         TagPro Auto Wait
// @version      2.3
// @description  Wait for a 4 or 6 player TagPro game. Be alerted when it begins. Anti-AFK kick.
// @author       Zagd
// @downloadURL  https://github.com/zagd/tagpro-scripts/blob/master/auto-wait.user.js
// @updateURL    https://github.com/zagd/tagpro-scripts/blob/master/auto-wait.user.js
// @include      http://tagpro-*.koalabeast.com:*
// @include      http://*.jukejuice.com:*
// @include      http://*.newcompte.fr:*
// @require      http://userscripts-mirror.org/scripts/source/107941.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

/*
************************************************************************************************************************
*************************************************READ ME / INSTRUCTIONS*************************************************
************************************************************************************************************************
This script is to be used to wait for games of 4+ or 6+ players, whilst avoiding the AFK kick,
and to be notified when the game of 4+ or 6+ players begins. If you begin waiting,
you will continue waiting even as games end (unless of course the target player count is reached).

How to use:
    If there are between 1 and 3 players, send a message in chat saying "!wait 4".
    If there are 4 or 5 players, send a message in chat saying "!wait 6".
    By the default, the notification that the target player count has been reached is an alarm noise and "GO!".
    If you would like more notification than this, use either "!wait 4 alert" or "!wait 6 alert".
    With this option, you will get the sound notifications, and a visual browser alert, which will focus your game tab.

Disclaimer:
    If you fail to recognize the notifications, and get reported / kicked for AFK, I am not to blame.
    If you use "!wait 4" and get notified that there are 4 players, do not immediately use "!wait 6".
    First, you should ask the people in game if they would like to wait for more players, or go.
    If they agree to wait, then use "1wait 6". You do this at your own risk, and please realise that games
    with at least 4 players record stats, so if you are waiting for 6 and the other players decide to begin
    playing, you can and will be reported for AFK, and you will probably lose the game.
************************************************************************************************************************
************************************************************************************************************************
************************************************************************************************************************
*/

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
    console.log('.');
    var playerCount = getPlayerCount();
    if (playerCount >= target) {
        new Audio("http://tagpro-diameter.koalabeast.com/sounds/alertlong.mp3").play();
        new Audio("http://tagpro-diameter.koalabeast.com/sounds/go.mp3").play();
        if (alert) {
            alert("TagPro game reached player count target!");
        }
        unWait();
    } else if (waiting) {
        antiAFK();
        setTimeout(function() { wait(target, alert); }, 2500);
    } else {
        unWait();
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