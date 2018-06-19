// ==UserScript==
// @name         Lej's Ranked PUGs Super Extend
// @version      1.2
// @description  Add a button to Lej's Ranked PUGs matchmaking page, enabling you to extend for 15 minutes.
// @author       Zagd
// @downloadURL  https://github.com/zagd/tagpro-scripts/raw/master/lej-rpugs-super-extend.user.js
// @updateURL    https://github.com/zagd/tagpro-scripts/raw/master/lej-rpugs-super-extend.user.js
// @match        http://lejdesigns.com/rankedPUGs/matchmaking.php
// @grant        none
// ==/UserScript==

window.onload = function() {
    var css = '#SuperExtend { padding: 5px ;background-color: #505050; display: inline-block; cursor: pointer; font-size: 1.2em; color: white; }';
    css = css.concat('#SuperExtend:hover { background-color: red }');
    var style = document.createElement('style');

    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    document.getElementsByTagName('head')[0].appendChild(style);
    window.document.getElementById('autoKickDIV').insertAdjacentHTML( 'beforeend', '<div id="SuperExtend">Super Extend</div>');
    window.document.getElementById('SuperExtend').addEventListener('click', superExtend);
};

function superExtend() {
    autokick = 901;
}
