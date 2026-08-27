let board = [];
let placedPieces = [];
let fish = []; // the pile of unplaced fish pieces; the last one is the "top"

function positionFishPiece(el, hole) {
	const screenPos = worldToScreen(hole.worldPos);
	const w = el.offsetWidth;
	const h = el.offsetHeight;
	el.style.transform = `translate(${(screenPos.x - w / 2).toFixed(1)}px, ${(screenPos.y - h / 2).toFixed(1)}px)`;
}

function addFishPiece(opts = {}) {
	const el = document.createElement("fish-piece");
	if (opts.ink) el.setAttribute("ink", opts.ink);
	if (opts.fill) el.setAttribute("fill", opts.fill);
	if (opts.border) el.setAttribute("border", opts.border);
	if (opts.scale) el.setAttribute("scale", opts.scale);
	// the pile is purely visual; all interaction goes through the board
	el.style.pointerEvents = "none";
	el.addEventListener("fish-select", (e) => {
		console.log("fish selected:", e.detail);
	});
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

	const left = dir(hole, -1, 0);
	const right = dir(hole, 1, 0);
	const right2 = dir(right, 1, 0);

	// diamond: two rows of three above/below a middle row of four
	// biome-ignore format: coordinates
	const diamond = [
			left, hole, right, right2, // middle row (4)
			dir(hole, -1, 1), dir(hole, 1, -1), dir(right, 1, -1), // top row (3)
			dir(hole, 0, -1), dir(hole, 0, 1), dir(right, 0, 1), // bottom row (3)
		].filter(Boolean);

	diamond.forEach((h) => {
		h.value = { obstacle: "FISH" };
	});

	return diamond;
}

function gameInit() {
	// Seed fishdraw, each <fish-piece> pulls a fish from this RNG.
	fishdraw.main(Date.now().toString());

	let bright = { ink: "#3a1f4d", fill: "#e7f0ff", border: "#6c5ce7" };
	fish = Array.from(Array(3)).map((_) => addFishPiece(bright));
	positionPile();
	selectTop();
	window.fish = fish;

	// Frame the camera so the circular board fills the view.
	cameraPos = vec2(0, 0);
	cameraScale = 32;

	// Build the hexagonal board system.
	board = boardInit(10);

	// Set up the UI (menu button + settings panel).
	setupUI();

	// keep the pile glued to its corner when the view (resize) changes
	window.addEventListener("resize", positionPile);

	function moveFishPieceToHole(el, hole) {
		if (!el || !hole) return;
		el._holeCoords = hole.coords;
		if (!placedPieces.includes(el)) placedPieces.push(el);

		el.setAttribute("scale", (HOLESIZE * cameraScale * 5).toFixed(0));
		el.style.position = "fixed";
		el.style.left = "0";
		el.style.top = "0";
		el.style.margin = "0";
		el.style.pointerEvents = "none";
		el.style.zIndex = "15";
		// animate the move, then drop the transition so it can follow the board
		el.style.transition = "transform 350ms cubic-bezier(.2,.8,.2,1)";
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
	board = boardInit(10);
}

function gameUpdate() {}

function gameRender() {
	drawBoardPlate(board);
	for (const h of board) {
		drawHole(h.worldPos);
		if (Object.keys(h.value).length > 0) drawCircle(h.worldPos, 1);
	}

	// keep placed pieces glued to their holes as the view (camera/resize) changes
	for (const el of placedPieces) {
		const { q, r } = el._holeCoords;
		const hole = board.find((h) => h.coords.q === q && h.coords.r === r);
		if (hole) positionFishPiece(el, hole);
	}
}

function postGameRender() {}
