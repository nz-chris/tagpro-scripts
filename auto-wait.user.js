// ==UserScript==
// @name         TagPro Auto Wait (Pub Queue)
// @version      3.0.1
// @description  Wait for a 4 or 6 player TagPro game (without getting AFK kicked). Be alerted when it begins.
// @author       Zagd
// @downloadURL  https://github.com/zagd/tagpro-scripts/raw/master/auto-wait.user.js
// @updateURL    https://github.com/zagd/tagpro-scripts/raw/master/auto-wait.user.js
// @include      *://tagpro.koalabeast.com/game
// @include      *://tagpro.koalabeast.com/game?*
// @include      *://*.newcompte.fr:*
// @include      *://tagpro-maptest.koalabeast.com:*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

/*
************************************************************************************************************************
************************************************ READ ME / INSTRUCTIONS ************************************************
************************************************************************************************************************
This script is to be used to wait for a game with a given target amount of players (usually 4+ or 6+) whilst avoiding
the AFK kick, and to be notified when the target amount of players is reached. If you begin waiting, you will continue
waiting even as games end, and new games start (unless of course the target player count is reached).

How to use:
    - If there are between 1 and 3 players, send a message in chat saying "!wait 4".
    - If there are 4 or 5 players, send a message in chat saying "!wait 6".
    - Alternatively, you can skip straight to "!wait 6". However by default, you will be given a sound alert when there
      are 4 players in the game. This is because a game with 4 players is considered a proper game (for stats etc.).
    - At any point, you can change your target player using the above messages.
    - When waiting, there will be a notifying message at the top of the page along with a button to stop waiting
      (the blinking green light indicates when button presses are sent to the server to prevent getting kicked).

By default, the alert of the target player count being reached consists of:
    - A 2s long alarm noise and a voice saying "GO!".
    - The game tab's title changing/"animating".
    - EPILEPSY WARNING: A flashing red/blue overlay will show (dismissed via a click anywhere on the page).
      Turn this off below (SHOULD_FLASH_SCREEN).

There are some user-changeable properties just below!

Disclaimer / warnings:
    - If you fail to recognize the alerts/notifications and get reported/kicked for AFK, I am not to blame.
    - Do not wait while you have the flag, otherwise you risk getting kicked for turtle.
************************************************************************************************************************
************************************************************************************************************************
************************************************************************************************************************
*/

////////////////////////////////////////
// Constants you might want to change //
////////////////////////////////////////
// Set to false to disable the red/blue flashing overlay (part of the alert that the target player count is reached).
const SHOULD_FLASH_SCREEN = true;
// Edit the trigger part of the message that you must send in order to wait. No matter what you put here, it must be at
// the very start of the message, followed by a space, then the number of players to wait for.
const TRIGGER = "!wait";
// The message that you automatically send after using the above trigger. Set to an empty string ("") to disable.
const START_WAITING_MESSAGE = "Waiting! I'll be back when there are {n} players."; // {n} is replaced with the target.
// The message that you automatically send after the target player count is reached. If you were waiting in the previous
// game and you join a game with the target player count, the message won't be sent.
// Set to an empty string ("") to disable entirely.
const BACK_FROM_WAITING_MESSAGE = "I'm back from waiting! Reset pls?";
// The sound(s) to play when the target player count is reached. Set to an empty array ([]) to disable.
const SOUND_ALERTS = [
    new Audio("https://tagpro.koalabeast.com/sounds/alertlong.mp3"),
    new Audio("https://tagpro.koalabeast.com/sounds/go.mp3"),
];
// Change the volume of the above alerts. Set to anything from 0 to 1. 0 is mute, 1 is full volume.
const MAIN_SOUND_ALERTS_VOLUME_COEFFICIENT = 1;
// Whether or not you want to be warned when there are 4 players in the game.
// You want this, because if there are 4 players in the game, it counts as a real game (stats etc.).
// Only applies when you set your target is more than 4 players (most likely 6).
// Set to false to disable.
const WARN_WHEN_4 = true;
// The sound(s) to play for the above warning. Set to an empty array ([]) to disable.
const WARN_WHEN_4_SOUND_ALERTS = [
    new Audio("https://tagpro.koalabeast.com/sounds/alert.mp3"),
    new Audio("https://tagpro.koalabeast.com/sounds/pop.mp3"),
];
// Change the volume of the above alerts. Set to anything from 0 to 1. 0 is mute, 1 is full volume.
const WARN_WHEN_4_SOUND_ALERTS_VOLUME_COEFFICIENT = 0.75;





///////////////////////////////////////////
// Constants you really shouldn't change //
///////////////////////////////////////////
const WAITING_KEY = "isWaiting";
const PLAYABLE_STATES = [1, 5];
const VALID_TARGETS = [4, 6];





const waiter = {
    waiting: !!GM_getValue(WAITING_KEY),
    waitingInterval: null,
    playerTarget: 4,
    warnedOf4: false,
    enoughPlayersInitially: false,
    waitingNotifierContainer: null,
    waitingNotifierTarget: null,
    waitingNotifierAutoKeypressIndicator: null,
    flashAlert: null,
    showWaitingNotifierTimeout: null,
    flashInterval: null,
    windowClickListener: null,

    start: () => {
        waiter.log("Started.");

        if (waiter.testMode) VALID_TARGETS.push(1, 2, 3, 5, 7, 8, 9);

        SOUND_ALERTS.forEach(sound => sound.volume = MAIN_SOUND_ALERTS_VOLUME_COEFFICIENT);
        waiter.log(`Set main alert sounds' volume to ${MAIN_SOUND_ALERTS_VOLUME_COEFFICIENT}.`);
        WARN_WHEN_4_SOUND_ALERTS.forEach(sound => sound.volume = MAIN_SOUND_ALERTS_VOLUME_COEFFICIENT);
        waiter.log(`Set main alert sounds' volume to ${WARN_WHEN_4_SOUND_ALERTS_VOLUME_COEFFICIENT}.`);

        waiter.insertNotifyingHtml();

        if (waiter.waiting && !tagpro.spectator) waiter.startWaiting();
    },

    stop: () => {
        waiter.clearShowWaitingNotifierTimeout();
        waiter.clearWaitingInterval();
        removeEventListener("click", waiter.windowClickListener);
    },

    startWaiting: () => {
        if (waiter.waiting && !waiter.waitingInterval) {
            waiter.log(`Started waiting for ${waiter.playerTarget} players.`);
            if (waiter.playerCount >= waiter.playerTarget) {
                waiter.log("There are enough players already. No BACK_FROM_WAITING_MESSAGE will be sent.");
                waiter.enoughPlayersInitially = true;
            }
            waiter.waitingInterval = setInterval(waiter.wait, 1000);
            waiter.log("Showing waiting notifier in one second (not immediately, in case it turns out we are a spectator).");
            waiter.showWaitingNotifierTimeout = setTimeout(waiter.showWaitingNotifier, 1000);
        }
    },

    wait: () => {
        if (!waiter.waiting) {
            waiter.log("No longer waiting. Clearing waiting interval.");
            waiter.clearWaitingInterval();
            return;
        }
        const playerCount = waiter.playerCount;
        if (playerCount < 4) waiter.warnedOf4 = false;
        if (playerCount >= waiter.playerTarget) {
            waiter.warnedOf4 = false;
            waiter.log(`Target player count of ${waiter.playerTarget} has been reached! Ceasing waiting, and beginning alert process.`);
            waiter.stopWaiting();
            waiter.alert();
            !waiter.enoughPlayersInitially && waiter.chat(BACK_FROM_WAITING_MESSAGE);
            return;
        } else if (WARN_WHEN_4 && !waiter.warnedOf4 && playerCount >= 4) {
            waiter.log("4 players are now in the game. Playing warning sounds.");
            WARN_WHEN_4_SOUND_ALERTS.forEach(sound => sound.play());
            waiter.warnedOf4 = true;
        }
        if (PLAYABLE_STATES.includes(tagpro.state) && !tagpro.spectator) {
            waiter.antiAfkKeyPresses();
        }
    },

    alert: () => {
        const originalTitle = document.title;
        SOUND_ALERTS.forEach(sound => sound.play());
        let flashStep = 0;
        waiter.flashAlert.innerHTML = "Click anywhere"
        waiter.flashInterval = setInterval(() => {
            if (!SHOULD_FLASH_SCREEN) waiter.flashAlert.style.backgroundColor = "rgba(205, 220, 57, 0.5)";
            if (flashStep % 2 === 0) {
                document.title = "TagPro !!!!!";
                if (SHOULD_FLASH_SCREEN) waiter.flashAlert.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
            } else {
                document.title = "!!!!! TagPro";
                if (SHOULD_FLASH_SCREEN) waiter.flashAlert.style.backgroundColor = "rgba(0, 0, 255, 0.5)";
            }
            flashStep++;
        }, 500);
        waiter.windowClickListener = () => {
            waiter.clearFlashInterval();
            document.title = originalTitle;
            waiter.hideFlashAlert();
            waiter.log("Alert ceased via click.");
        };
        addEventListener("click", waiter.windowClickListener);
    },

    stopWaiting: () => {
        waiter.waiting = false;
        GM_deleteValue(WAITING_KEY);
        waiter.clearWaitingInterval();
        waiter.hideWaitingNotifier();
    },

    clearWaitingInterval: () => {
        clearInterval(waiter.waitingInterval);
        waiter.waitingInterval = null;
    },

    clearShowWaitingNotifierTimeout: () => {
        clearTimeout(waiter.showWaitingNotifierTimeout);
        waiter.showWaitingNotifierTimeout = null;
    },

    clearFlashInterval: () => {
        clearInterval(waiter.flashInterval);
        waiter.flashInterval = null;
    },

    antiAfkKeyPresses: () => {
        waiter.log("Anti-AFK!");

        waiter.press("space");
        waiter.press("left");
        waiter.press("right");

        const originalTransitionDuration = waiter.waitingNotifierAutoKeypressIndicator.style.transitionDuration;
        const originalBackground = waiter.waitingNotifierAutoKeypressIndicator.style.background;
        Object.assign(waiter.waitingNotifierAutoKeypressIndicator.style, {
            background: "#cddc39",
            transitionDuration: "100ms"
        });
        setTimeout(() => {
            Object.assign(waiter.waitingNotifierAutoKeypressIndicator.style, {
                background: originalBackground,
                transitionDuration: originalTransitionDuration,
            });
        }, 150);
    },

    press: k => {
        document.body.focus();
        tagpro.socket.emit("keydown", { k });
        setTimeout(() => tagpro.socket.emit("keyup", { k }), 100);
    },

    chat: message => {
        if (!message) return;
        setTimeout(() => {
            tagpro.socket.emit("chat", { message, toAll: true });
        }, 750);
    },

    handleChat: data => {
        if (!data?.message || tagpro.spectator || data.from !== tagpro.playerId) return;

        const match = data.message.match(new RegExp(`^${TRIGGER} ([${VALID_TARGETS.join("")}])$`));
        if (match) {
            const target = match[1];
            waiter.setPlayerTarget(target);
            if (!waiter.waiting && waiter.playerCount < target) {
                waiter.waiting = true;
                GM_setValue(WAITING_KEY, "1");
                waiter.chat(START_WAITING_MESSAGE.replace(/{n}/g, waiter.playerTarget));
                waiter.startWaiting();
            }
        }
    },

    handleSpectator: data => {
        waiter.onSpectatorChange(["watching", "waiting"].includes(data?.type));
        // Check again, just in case.
        setTimeout(waiter.onSpectatorChange, 1000);
    },

    onSpectatorChange: (spectating = tagpro.spectator) => {
        waiter.log(`Your "spectator" state has changed. You are ${spectating ? "" : "not "}spectating.`);
        if (spectating) {
            waiter.clearShowWaitingNotifierTimeout();
            waiter.hideWaitingNotifier();
            waiter.clearWaitingInterval();
        } else if (waiter.waiting) waiter.startWaiting();
    },

    get playerCount() {
        return Object.keys(tagpro.players).length;
    },

    setPlayerTarget: target => {
        if (!VALID_TARGETS.includes(Number(target))) return;
        waiter.playerTarget = target;
        waiter.waitingNotifierTarget.innerHTML = target;
        waiter.log(`Set player target to ${target}.`);
    },

    showWaitingNotifier: () => {
        Object.assign(waiter.waitingNotifierContainer.style, {
            visibility: "visible",
            opacity: 1,
        });
    },

    hideWaitingNotifier: () => {
        waiter.log("Removing waiting notifier.");
        waiter.clearShowWaitingNotifierTimeout();
        Object.assign(waiter.waitingNotifierContainer.style, {
            visibility: "hidden",
            opacity: 0,
        });
    },

    hideFlashAlert: () => {
        if (SHOULD_FLASH_SCREEN) waiter.flashAlert.style.background = null;
        waiter.flashAlert.innerHTML = "";
    },

    insertNotifyingHtml: () => {
        // Prevent multiple invocations.
        if (waiter.waitingNotifierContainer) return;

        const container = document.createElement("div");
        Object.assign(container.style, {
            position: "absolute",
            top: 0,
            left: "100px",
            display: "flex",
            alignItems: "center",
            visibility: "hidden",
            opacity: 0,
            fontSize: "14px",
            transition: "opacity 500ms ease",
        });

        const message = document.createElement("div");
        message.append("You are waiting for ");
        const target = document.createElement("span");
        target.innerHTML = waiter.playerTarget;
        message.appendChild(target);
        message.append(" or more players and will not be kicked for AFK.");
        container.appendChild(message);

        const keypressIndicator = document.createElement("div");
        Object.assign(keypressIndicator.style, {
            width: "12px",
            height: "12px",
            marginLeft: "10px",
            borderRadius: "50%",
            border: "1px #827717 solid",
            boxShadow: "inset -1px -1px 1px #827717",
            background: "#7d7d7d",
            transition: "background 750ms ease",
        });
        container.appendChild(keypressIndicator);

        const unWaitButton = document.createElement("div");
        Object.assign(unWaitButton.style, {
            margin: "3px 0 3px 10px",
            padding: "3px 7px",
            cursor: "pointer",
        });
        unWaitButton.classList.add("btn");
        unWaitButton.setAttribute("tabindex", "-1");
        unWaitButton.setAttribute("onclick", "this.blur();");
        unWaitButton.append("STOP WAITING");
        unWaitButton.addEventListener("click", () => {
            waiter.log("Clicked STOP WAITING button.");
            waiter.stopWaiting();
        });
        container.appendChild(unWaitButton);

        document.body.appendChild(container);
        waiter.log("Inserted waiting notifier div.");

        waiter.waitingNotifierContainer = container;
        waiter.waitingNotifierTarget = target;
        waiter.waitingNotifierAutoKeypressIndicator = keypressIndicator;

        const flashAlert = document.createElement("div");
        Object.assign(flashAlert.style, {
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 99999,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "10vmin",
            textShadow: "1.5px 1.5px black",
            pointerEvents: "none",
        });
        document.body.appendChild(flashAlert);
        waiter.log("Inserted flash alert div.");
        waiter.flashAlert = flashAlert;
    },

    testMode: false,
    log: (...messages) => waiter.testMode && console.log("[TagPro Auto Wait (Pub Queue)] ::", ...messages)
};

tagpro.ready(() => {
    if (PLAYABLE_STATES.includes(tagpro.state)) {
        waiter.start();
    } else {
        tagpro.socket.on("time", ({ state }) => PLAYABLE_STATES.includes(state) && waiter.start());
    }

    tagpro.socket.on("end", waiter.stop);

    tagpro.socket.on("chat", waiter.handleChat);
    tagpro.socket.on("spectator", waiter.handleSpectator);
});
