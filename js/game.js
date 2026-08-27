// Angelfish
// hexagonal angel problem game
// the player plays as the devil by placing fish pieces to block the angels path

let board = [];
let placedPieces = [];
let fish = []; // the pile of unplaced fish pieces; the last one is the "top"

// angel animation state: a smoothly interpolated screen position that chases
// the hole the angel has logically moved to
let angelPos = null;
let angelTarget = null;
let angelEscapedPending = false;
let gameStarted = false;

const ANGEL_GLOW = new Color().setHex("#ffe9a8");
const ANGEL_CORE = new Color().setHex("#fffdf5");

function positionFishPiece(el, hole) {
	const screenPos = worldToScreen(hole.worldPos);
	const w = el.offsetWidth;
	const h = el.offsetHeight;
	el.style.transform = `translate(${(screenPos.x - w / 2.65).toFixed(1)}px, ${(screenPos.y - h / 2).toFixed(1)}px)`;
}

function addFishPiece(opts = {}) {
	const el = document.createElement("fish-piece");
	if (opts.ink) el.setAttribute("ink", opts.ink);
	if (opts.fill) el.setAttribute("fill", opts.fill);
	if (opts.border) el.setAttribute("border", opts.border);
	if (opts.scale) el.setAttribute("scale", opts.scale);
	el.style.pointerEvents = "none";
	document.body.appendChild(el);
	return el;
}

function placeFish(hole) {
	if (!hole) return;

	// 'hole' is treated as the second hole of the middle row
	const dir = (from, dq, dr) => {
		const m = neighbors(board, from).find(
			(n) => n.direction.q === dq && n.direction.r === dr,
		);
		return m ? m.hole : null;
	};

	const [left, right] = [dir(hole, -1, 0), dir(hole, 1, 0)];
	const right2 = dir(right, 1, 0);

	// biome-ignore format: two rows of three above/below a middle row of four
	const diamond = [
			left, hole, right, right2, // middle row (4)
			dir(hole, -1, 1), dir(hole, 1, -1), dir(right, 1, -1), // top row (3)
			dir(hole, 0, -1), dir(hole, 0, 1), dir(right, 0, 1), // bottom row (3)
		].filter(Boolean);

	diamond.forEach((h) => {
		h.value = { type: "obstacle" };
	});

	sfx.place.play();

	return diamond;
}

function gameInit() {
	// Seed fishdraw, each <fish-piece> pulls a fish from this RNG.
	fishdraw.main(Date.now().toString());

	cameraPos = vec2(0, 0);
	cameraScale = 34;
	setupUI();

	// hold off on the board until the player starts from the main menu
	gameStarted = false;
	setMenuVisible(true);
	setPaused(true);
}

function startGame() {
	if (gameStarted) return;
	gameStarted = true;

	fish = initPile();
	selectTop();

	board = boardInit(7);
	board[Math.floor(board.length / 2)].value = { type: "angel" };

	const startHole = board[Math.floor(board.length / 2)];
	angelPos = startHole.worldPos;
	angelTarget = startHole.worldPos;

	window.addEventListener("resize", positionPile);
	// re-anchor the animated angel to its hole so it tracks view changes
	window.addEventListener("resize", () => {
		const ah = board.filter((h) => h.value.type == "angel")[0];
		if (ah) {
			angelPos = ah.worldPos;
			angelTarget = ah.worldPos;
		}
	});

	function moveFishPieceToHole(el, hole) {
		if (!el || !hole) return;
		el._holeCoords = hole.coords;
		if (!placedPieces.includes(el)) placedPieces.push(el);

		Object.assign(el.style, {
			position: "fixed",
			left: "0",
			top: "0",
			margin: "0",
			pointerEvents: "none",
			zIndex: "15",
			transition: "transform 350ms cubic-bezier(.2,.8,.2,1)",
		});
		// animate the move, then drop the transition so it can follow the board
		el.addEventListener("transitionend", () => (el.style.transition = "none"), {
			once: true,
		});

		positionFishPiece(el, hole);
		el.setAttribute("played", "");
	}

	// Clicking the board places the top (selected) fish of the pile.
	addEventListener("click", (pos) => {
		if (!gameStarted) return;
		const top = fish[fish.length - 1];
		if (!top) return;

		const target = placeFish(nearestHole(board, vec2(pos.x, pos.y)));
		if (!target) return;

		// place and deselect the top fish, then promote the next one
		top.removeAttribute("selected");
		fish.pop();
		moveFishPieceToHole(top, target[1] ?? target[0]);
		positionPile();
		moveAngel();
		selectTop();
	});

	setMenuVisible(false);
	setPaused(false);
}

function moveAngel(distance = 2) {
	// find and clear the current angel
	let angelHole = board.filter((h) => h.value.type == "angel")[0];
	if (!angelHole) return;
	angelHole.value.type = "none";

	// the angel has power `distance`: it may jump up to that many spaces,
	// so a one-space move is allowed too (e.g. when one space from the edge)
	let validMoves = [
		...neighbors(board, angelHole, 1),
		...neighbors(board, angelHole, distance),
	].filter((n) => n.hole.value.type == "none");

	if (validMoves.length === 0) {
		// no escape: the angel is trapped, leave it where it was
		angelHole.value.type = "angel";
		return;
	}

	const edgeRadius = board.reduce(
		(m, h) => Math.max(m, h.worldPos.length()),
		0,
	);

	// count reachable empty holes from a destination (1 or distance steps)
	const mobilityAt = (h) =>
		[...neighbors(board, h, 1), ...neighbors(board, h, distance)].filter(
			(n) => n.hole.value.type == "none",
		).length;

	const score = (m) => {
		const dist = m.hole.worldPos.length();
		const toEdge = edgeRadius - dist; // smaller = closer to winning
		const mobility = mobilityAt(m.hole);
		// weight reaching the edge far above mere mobility
		return (edgeRadius - toEdge) * 1000 + mobility * 10;
	};

	validMoves.sort((a, b) => score(b) - score(a));
	const dest = validMoves[0].hole;
	dest.value.type = "angel";
	angelTarget = dest.worldPos;

	if (isOnEdge(board, dest)) {
		angelEscapedPending = true;
	}
}

// true if at least one neighbor is missing from the board)
function isOnEdge(board, h) {
	const { q, r } = h.coords;
	const dirs = [
		[1, 0],
		[0, 1],
		[-1, 0],
		[1, -1],
		[0, -1],
		[-1, 1],
	];
	return dirs.some(
		([dq, dr]) =>
			!board.find((x) => x.coords.q === q + dq && x.coords.r === r + dr),
	);
}

function resetGame() {
	board = boardInit(7);
	board[Math.floor(board.length / 2)].value = { type: "angel" };
	if (typeof uiAngelBanner !== "undefined" && uiAngelBanner)
		uiAngelBanner.visible = false;
	document.querySelectorAll("fish-piece").forEach((el) => el.remove());
	fish = initPile();
	const ah = board[Math.floor(board.length / 2)];
	angelPos = ah.worldPos;
	angelTarget = ah.worldPos;
	angelEscapedPending = false;
}

function gameUpdate() {
	// ease the angel toward its logical hole
	if (angelPos && angelTarget) {
		const step = Math.min(1, timeDelta * 6);
		angelPos = angelPos.lerp(angelTarget, step);

		if (angelEscapedPending && angelPos.distance(angelTarget) < 0.05) {
			angelEscapedPending = false;
			onAngelEscaped();
		}
	}
}

function gameRender() {
	drawBoardPlate(board);
	for (const h of board) {
		if (Object.keys(h.value).length === 0 || h.value.type == "none")
			drawHole(h.worldPos);
		if (h.value.type == "obstacle") {
			drawBlockedHex(h.worldPos);
		}
		if (h.value.type == "angel") {
			drawHole(h.worldPos);
		}
	}

	// animated angel: glides between holes with a gentle bob and halo pulse
	if (angelPos) {
		const bob = Math.sin(time * 3) * 0.08;
		const pulse = 1 + Math.sin(time * 5) * 0.07;
		const p = angelPos.add(vec2(0, bob));

		// outer glow + halo
		drawCircle(p, 1.15 * pulse, new Color(1, 0.9, 0.6, 0.18));
		drawCircle(p, 0.95 * pulse, ANGEL_GLOW, 0, 0.12);
		// body
		drawHole(p);
		drawCircle(p, 0.72 * pulse, ANGEL_CORE, 0, 0.1, ANGEL_GLOW);
	}

	// keep placed pieces glued to their holes as the view (camera/resize) changes
	for (const el of placedPieces) {
		const { q, r } = el._holeCoords;
		const hole = board.find((h) => h.coords.q === q && h.coords.r === r);
		if (hole) positionFishPiece(el, hole);
	}
}

function postGameRender() {}
