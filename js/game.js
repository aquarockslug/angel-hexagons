let board = [];
let placedPieces = [];
let fish = []; // the pile of unplaced fish pieces; the last one is the "top"

function positionFishPiece(el, hole) {
	const screenPos = worldToScreen(hole.worldPos);
	const w = el.offsetWidth;
	const h = el.offsetHeight;
	el.style.transform = `translate(${(screenPos.x - w / 2.6).toFixed(1)}px, ${(screenPos.y - h / 2).toFixed(1)}px)`;
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

	let bright = { ink: "#3a1f4d", fill: "#e7f0ff", border: "#6c5ce7" };
	fish = Array.from(Array(6)).map((_) => addFishPiece(bright));
	positionPile();
	selectTop();

	cameraPos = vec2(0, 0);
	cameraScale = 32;
	setupUI();

	board = boardInit(7);
	board[Math.floor(board.length / 2)].value = { type: "angel" };

	window.addEventListener("resize", positionPile);

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
	}

	// Clicking the board places the top (selected) fish of the pile.
	addEventListener("click", (pos) => {
		const top = fish[fish.length - 1];
		if (!top) return;

		const target = placeFish(nearestHole(board, vec2(pos.x, pos.y)));
		if (!target) return;

		// place & deselect the top fish, then promote the next one
		top.removeAttribute("selected");
		fish.pop();
		moveFishPieceToHole(top, target[1] ?? target[0]);
		positionPile();
		selectTop();
	});
}

function resetGame() {
	board = boardInit(7);
}

function gameUpdate() {}

function gameRender() {
	drawBoardPlate(board);
	for (const h of board) {
		if (Object.keys(h.value).length === 0) drawHole(h.worldPos);
		if (h.value.type == "angel") {
			drawHole(h.worldPos);
			drawCircle(h.worldPos, 0.75);
		}
	}

	// keep placed pieces glued to their holes as the view (camera/resize) changes
	for (const el of placedPieces) {
		const { q, r } = el._holeCoords;
		const hole = board.find((h) => h.coords.q === q && h.coords.r === r);
		if (hole) positionFishPiece(el, hole);
	}
}

function postGameRender() {}
