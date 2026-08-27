// Hexagonal board system

// ---- board sizing ----
const HOLESIZE = 1.35;
const BOARDSIZE = 1.5; // the space between holes
const PLATE_MARGIN = 2.0; // the space around the outside of the holes

// ---- palette (board only) ----
const PLATECOLOR = new Color().setHex("#232b47");
const PLATEEDGE = new Color().setHex("#414e7d");
const HOLECOLOR = new Color().setHex("#0d1122");

// ---- color helpers ----
const mix = (a, b, t) =>
	new Color(
		a.r + (b.r - a.r) * t,
		a.g + (b.g - a.g) * t,
		a.b + (b.b - a.b) * t,
	);
const shade = (c, t) => mix(c, BLACK, t);

// creates a hexagonal hole with axial coordinates and world position
const hole = (q, r, value = {}) => {
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
	const { q, r } = h.coords;
	const neighborCoords = [
		{ q: q + distance, r: r, direction: { q: distance, r: 0 } }, // right
		{ q: q, r: r + distance, direction: { q: 0, r: distance } }, // down-right
		{ q: q - distance, r: r, direction: { q: -distance, r: 0 } }, // left
		{
			q: q + distance,
			r: r - distance,
			direction: { q: distance, r: -distance },
		}, // up-right
		{ q: q, r: r - distance, direction: { q: 0, r: -distance } }, // up-left
		{
			q: q - distance,
			r: r + distance,
			direction: { q: -distance, r: distance },
		}, // down-left
	];

	return neighborCoords
		.map((coord) => ({
			direction: coord.direction,
			hole: board.find((h) => h.coords.q === coord.q && h.coords.r === coord.r),
		}))
		.filter((n) => n.hole !== undefined);
};

// hex distance between two holes (axial -> cube conversion)
const holeDistance = (hole1, hole2) => {
	const { q: q1, r: r1, s: s1 } = hole1.coords;
	const { q: q2, r: r2, s: s2 } = hole2.coords;
	return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(s1 - s2));
};

// nearest hole on the board to a given world position
const nearestHole = (board, pos, threshold = 25) => {
	let hole = board.reduce((nearest, h) =>
		h.screenPos.distance(pos) < nearest.screenPos.distance(pos) ? h : nearest,
	);
	return hole.screenPos.distance(pos) <= threshold ? hole : undefined;
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
	drawCircle(pos, HOLESIZE + 0.07, shade(PLATECOLOR, 0.5));
	drawCircle(pos, HOLESIZE, HOLECOLOR, 0.08, PLATEEDGE);
};
