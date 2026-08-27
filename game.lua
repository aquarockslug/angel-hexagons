local M     = {}

M.title     = "Angelfish"

M.files     = {
	"lib/littlejs.min.js",
	"lib/vivus.min.js",
	"lib/fishdraw.browser.js",
	"js/fish-piece.js",
	"js/hexboard.js",
	"js/game.js",
	"js/ui.js",
}

M.libraries = {
	{ file = "lib/littlejs.min.js", src = "https://cdn.jsdelivr.net/npm/littlejsengine@1.18.29/dist/littlejs.min.js" },
	{ file = "lib/vivus.min.js",    src = "https://cdn.jsdelivr.net/npm/vivus@0.4.6/dist/vivus.min.js" },
	{
		file = "lib/fishdraw.js",
		src = "https://github.com/LingDong-/fishdraw/raw/refs/heads/main/fishdraw.js",
		browserify = true
	}
}

M.output    = "dist/index.html"
M.inits     = { "gameInit", "gameUpdate", "gameUpdatePost", "gameRender", "postGameRender" }

M.publish   = true
M.channel   = "aquarock/angel-fish:html5"

return M
