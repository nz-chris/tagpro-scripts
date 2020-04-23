// ==UserScript==
// @name         TagPro Remove Black Background
// @version      1.0
// @description  Remove the black background from the TagPro canvas. Made with love using stolen code from NewCompte (https://www.reddit.com/r/TagPro/comments/2xwwz4/userscript_newcomptes_transparent_canvas/) and nabby (https://gist.github.com/nabbynz/24c9c965b93e9f12660436d26c6e4ac1)
// @author       Zagd, but not really.
// @include      *://tagpro.koalabeast.com/game
// @include      *://*.newcompte.fr:*
// @include      *://tagpro-maptest.koalabeast.com:*
// ==/UserScript==

// Fix the chat. Stolen from nabby.
const resizeChat = function() {
    const viewportOffset = $("#viewport").offset();
    const viewportHeight = $("#viewport").height();

    $("#chat").css({
        left: viewportOffset.left + 5,
        top: viewportOffset.top + viewportHeight - 35
    });
    $("#chatHistory").css({
        left: viewportOffset.left + 5,
        top: viewportOffset.top + viewportHeight - $("#chatHistory").outerHeight() - 45
    });
};

tagpro.ready(function () {
    tagpro.chat.resize = resizeChat;
    $("#chatHistory").hide();

    // Remove the black background. Stolen from NewCompte.
    const oldCanvas = $(tagpro.renderer.canvas);
    oldCanvas.hide();
    const newCanvas = $('<canvas id="viewport" width="1280" height="800"></canvas>');
    oldCanvas.after(newCanvas);
    oldCanvas.remove();
    tagpro.renderer.canvas = newCanvas.get(0);
    tagpro.renderer.options.transparent = true;
    tagpro.renderer.renderer = tagpro.renderer.createRenderer();
    tagpro.renderer.resizeAndCenterView();
    newCanvas.fadeIn(1500, resizeChat);
    $("#chatHistory").fadeIn(1500);
});