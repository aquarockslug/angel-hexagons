-- Reusable build system for HTML5 games.
--
-- Package the game into a single self-contained html file: every script in
-- game.files is inlined and engineInit is called with game.inits. If
-- game.publish is set and game.channel exists, the result is pushed with butler.
--
--   lua build.lua            full build (depends + deploy)
--   lua build.lua depends    fetch dependencies only
--   lua build.lua deploy     package only

local M = {}

local function file_exists(path)
	local f = io.open(path, "r")
	if f then
		f:close(); return true
	end
	return false
end

local function ensure_parent_dir(path)
	local dir = path:match("^(.*)/")
	if dir and dir ~= "" then
		os.execute("mkdir -p " .. dir)
	end
end

-- Download every entry in game.libraries, skipping files that already exist
function M.depends(game)
	game.libraries = game.libraries or {}
	local fetched = 0
	for _, lib in ipairs(game.libraries) do
		if file_exists(lib.file) then
			print("Already have " .. lib.file .. ", skipping")
		else
			ensure_parent_dir(lib.file)
			print("Downloading " .. lib.file .. " <- " .. lib.src)
			local ok = os.execute("curl -fsSL -o " .. lib.file .. " " .. lib.src)
			if ok then
				fetched = fetched + 1
			else
				print("Error: failed to download " .. lib.file)
			end
		end
	end
	print("Fetched " .. fetched .. " / " .. #game.libraries .. " libraries")
	return fetched
end

-- For each library entry that requests it (via a `browserify` field), run
-- browserify to produce a UMD standalone bundle exposing the module's exports
-- under the given global `name`. The bundle is written to `browserify.out`.
function M.browserify(game)
	game.libraries = game.libraries or {}
	local built = 0
	for _, lib in ipairs(game.libraries) do
		local b = lib.browserify
		if b then
			local btab = type(b) == "table" and b or {}
			local out  = btab.out or lib.file:gsub("%.js$", ".browser.js")
			local name = btab.name or lib.file:gsub("%.js$", ""):match("([^/]+)$")
			ensure_parent_dir(out)
			print("Browserifying " .. out .. " <- " .. lib.file)
			local cmd = "browserify " .. lib.file .. " --standalone " .. name .. " -o " .. out
			local ok = os.execute(cmd)
			if ok then
				built = built + 1
			else
				print("Error: failed to browserify " .. lib.file)
			end
		end
	end
	print("Browserified " .. built .. " modules")
	return built
end

function M.deploy(game)
	local scripts = {}
	for _, path in ipairs(game.files or {}) do
		local f = io.open(path, "r")
		if f then
			table.insert(scripts, f:read("*all"))
			f:close()
		else
			print("Warning: missing " .. path .. ", skipping")
		end
	end

	local html = "<!doctype html><body>\n"
	for _, s in ipairs(scripts) do
		html = html .. "  <script>\n" .. s .. "\n  </script>\n"
	end
	html = html
	    .. "  <script>engineInit("
	    .. table.concat(game.inits or {}, ", ")
	    .. ")</script>\n</body>\n"

	ensure_parent_dir(game.output)
	local out = io.open(game.output, "w")
	if out then
		out:write(html)
		out:close()
		print("Created " .. game.output)
	else
		print("Error: could not write " .. game.output)
		return
	end

	if game.publish and game.channel then
		os.execute("butler push " .. game.output .. " " .. game.channel)
	end

	os.execute("wc -l " .. game.output)
end

function M.build(game)
	M.depends(game)
	M.browserify(game)
	M.deploy(game)
end

local self_path = debug.getinfo(1, "S").source:sub(2)
if arg and arg[0] and arg[0]:match(self_path:gsub("%.", "%%.") .. "$") then
	local game = require "game"
	local task = arg[1] or "build"
	if task == "depends" then
		M.depends(game)
	elseif task == "browserify" then
		M.browserify(game)
	elseif task == "deploy" then
		M.deploy(game)
	else
		M.build(game)
	end
end

return M
