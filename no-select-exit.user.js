// ==UserScript==
// @name         TagPro No Select Exit
// @version      1.0.0
// @description  Disable selection (text highlighting) of the "< Exit" link in the top right, in case you accidentally double click somewhere.
// @author       Zagd
// @downloadURL  https://github.com/zagd/tagpro-scripts/raw/master/no-select-exit.user.js
// @updateURL    https://github.com/zagd/tagpro-scripts/raw/master/no-select-exit.user.js
// @include      *://tagpro.koalabeast.com/game
// @include      *://tagpro.koalabeast.com/game?*
// @include      *://*.newcompte.fr:*
// @include      *://tagpro-maptest.koalabeast.com:*
// ==/UserScript==

const exit = document.getElementById("exit");
if (exit) {
    exit.style.userSelect = "none";
}
