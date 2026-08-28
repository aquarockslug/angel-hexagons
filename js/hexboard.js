// Hexagonal board system

// ---- board sizing ----
const HOLESIZE = 1;
const BOARDSIZE = 1.85; // the space between holes
const PLATE_MARGIN = 2.0; // the space around the outside of the holes

// ---- palette (board only) ----
const PLATECOLOR = new Color().setHex("#232b47");
const PLATEEDGE = new Color().setHex("#414e7d");
const HOLECOLOR = PLATECOLOR; //new Color().setHex("#0d1122");

// obstacle color
const BLOCKCOLOR = new Color().setHex("#5b3a78"); // a solid "wall" peg

// ---- color helpers ----
const shade = (c, t) => new Color(c.r * (1 - t), c.g * (1 - t), c.b * (1 - t));

// creates a hexagonal hole with axial coordinates and world position
const hole = (q, r, value = { type: "none" }) => {
	const x = (q + r * 0.5) * BOARDSIZE;
	const y = ((r * Math.sqrt(3)) / 2) * BOARDSIZE;
	return {
		coords: { q, r, s: -q - r },
		worldPos: vec2(x, y),
		screenPos: worldToScreen(vec2(x, y)),
		value,
	};
};

// refresh board position data on screen resize
window.addEventListener("resize", (_) => {
	board = board.map((h) => hole(h.coords.q, h.coords.r, h.value));
});

// finds the six neighboring holes (optionally at a given distance)
// returns { direction: { q, r }, hole } so the caller knows the direction of the neighbor
const neighbors = (board, h, distance = 1) => {
	if (!h?.coords) return;
	const { q, r } = h.coords;
	const dirs = [
		[distance, 0],
		[0, distance],
		[-distance, 0],
		[distance, -distance],
		[0, -distance],
		[-distance, distance],
	];
	return dirs
		.map(([dq, dr]) => ({
			direction: { q: dq, r: dr },
			hole: board.find((h) => h.coords.q === q + dq && h.coords.r === r + dr),
		}))
		.filter((n) => n.hole !== undefined);
};

// nearest hole on the board to a given world position
const nearestHole = (board, pos, threshold = 25) => {
	let hole = board.reduce((nearest, h) =>
		h.screenPos.distance(pos) < nearest.screenPos.distance(pos) ? h : nearest,
	);
	if (hole.screenPos.distance(pos) > threshold) {
		sfx.break.play();
		return null;
	}
	return hole;
};

// initialize a circular hexagonal board of the given radius
const boardInit = (radius) => {
	// create a disc of holes
	const board = [];
	for (let q = -radius; q <= radius; q++) {
		const r1 = Math.max(-radius, -q - radius);
		const r2 = Math.min(radius, -q + radius);
		for (let r = r1; r <= r2; r++) {
			board.push(hole(q, r));
		}
	}

	// keep only holes within a circular boundary
	const circleRadius = radius * BOARDSIZE * 0.98;
	return board.filter((h) => h.worldPos.length() <= circleRadius);
};

// draw the circular board plate background (sized from the board's holes)
const drawBoardPlate = (board) => {
	let maxDist = 0;
	for (const h of board) {
		const d = h.worldPos.distance(vec2(0, 0));
		if (d > maxDist) maxDist = d;
	}
	const plateRadius = 2 * maxDist + HOLESIZE + PLATE_MARGIN;

	// drop shadow
	drawCircle(vec2(0.3, -0.45), plateRadius, new Color(0, 0, 0, 0.4));

	drawCircle(vec2(0, 0), plateRadius, PLATECOLOR, 0.22, PLATEEDGE);
};

// draw a single hole on the board
const drawHole = (pos) => {
	drawCircle(pos, HOLESIZE, HOLECOLOR, 0.08, PLATEEDGE);
};

// draw a solid "wall" peg on a blocked hole so obstacles read clearly
const drawBlockedHex = (pos) => {
	drawCircle(pos, 0.62, BLOCKCOLOR, 1, PLATEEDGE, 0.08);
};
