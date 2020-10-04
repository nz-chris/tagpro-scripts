// ==UserScript==
// @name         TagPro Remove Volume Slider Outline
// @version      1.0.1
// @description  Remove the outline that shows around the volume slider when it is focused. Sometimes it shows when you click the game area, and it won't go away until you click off.
// @author       Zagd
// @downloadURL  https://github.com/zagd/tagpro-scripts/raw/master/remove-volume-slider-outline.user.js
// @updateURL    https://github.com/zagd/tagpro-scripts/raw/master/remove-volume-slider-outline.user.js
// @include      *://tagpro.koalabeast.com/game
// @include      *://tagpro.koalabeast.com/game?*
// @include      *://*.newcompte.fr:*
// @include      *://tagpro-maptest.koalabeast.com:*
// ==/UserScript==

const slider = document.getElementById("volumeSlider");
if (slider) {
    slider.style.outline = "0";
}
