// UI system — copied from star-checkers and adapted for angel-hexagons.
//
// This is the menu/settings panel: a menu button (top-left) opens a settings
// dialog with a Guides toggle, a Speed slider, a Reset button, and a Close
// button. The engine is paused while the dialog is open and Escape toggles it.

let uiRoot, uiSettings, uiAngelBanner, uiMenu;

// UI theme colors (shared with star-checkers)
const GOLD = new Color().setHex("#ffd76a");
const SANDLIGHTBROWN = new Color(0.97, 0.88, 0.63);
const GOLDDEEP = new Color().setHex("#c98a1b");

// UI-controlled settings (kept local to the UI so no game logic is required)
let MOVEGUIDES = false;
let CPU_MOVE_DELAY = 1;
const ANIMATION_SPEED = { CPU_DURATION: 7, HUMAN_DURATION: 14 };

// biome-ignore format: sfx
let sfx = {
	place: new Sound([,,343,.03,.28,.24,1,1.5,-1,,-94,.15,,,,,,.98,.28]),
	draw: new Sound([.8,,162,.02,.03,.09,1,.3,,-19,-50,,,.4,-1,,,.61,.04,,99])
};

function initPile(amount = 8) {
	let bright = { ink: "#3a1f4d", fill: "#e7f0ff", border: "#6c5ce7" };
	setTimeout(() => {
		positionPile();
	}, 100);
	return Array.from(Array(amount)).map((_) => addFishPiece(bright));
}

function positionPile() {
	const scale = 250;
	const w = scale;
	const h = (scale * 320) / 520;
	const offsetX = 18;
	const offsetY = -10;
	const baseX = window.innerWidth / 8 - w / 2;
	const baseY = window.innerHeight - h - 30;

	fish.forEach((el, i) => {
		setTimeout(() => {
			el.setAttribute("scale", scale);
			if (!el.getAttribute("inPile")) sfx.draw.play();
			el.setAttribute("inPile", true);
			Object.assign(el.style, {
				position: "fixed",
				left: "0",
				top: "0",
				margin: "0",
				pointerEvents: "none",
				zIndex: String(20 + i),
				transition: "transform 180ms ease",
			});
			const x = baseX + i * offsetX;
			const y = baseY + i * offsetY;
			const rot = (i - fish.length / 2) * 3;
			el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
		}, i * 100);
	});
}

function selectTop() {
	fish.forEach((f) => {
		f.removeAttribute("selected");
	});
	const top = fish[fish.length - 1];
	if (top) top.setAttribute("selected", "");
}

function setupUI() {
	new UISystemPlugin();

	uiSystem.defaultSoundPress = new Sound([0.5, 0, 220]);
	uiSystem.defaultSoundClick = new Sound([0.5, 0, 440]);
	uiSystem.defaultCornerRadius = 10;
	uiSystem.defaultGradientColor = undefined;
	uiSystem.defaultShadowColor = new Color(0, 0, 0, 0.4);

	uiRoot = new UIObject();
	uiRoot.anchor = vec2(-1, -1);

	// angel victory banner (hidden until the angel reaches the edge)
	uiAngelBanner = new UIText(
		vec2(mainCanvasSize.x / 2, mainCanvasSize.y / 2),
		vec2(560, 60),
		"The angel escaped!",
	);
	uiAngelBanner.textColor = GOLD;
	uiAngelBanner.textLineWidth = 6;
	uiAngelBanner.visible = false;
	uiRoot.addChild(uiAngelBanner);

	// menu button (upper-right corner)
	const menuButton = new UIButton(
		vec2(mainCanvasSize.x - 35, 35),
		vec2(50, 45),
	);
	menuButton.color = new Color(0.13, 0.16, 0.28, 0.85);
	menuButton.gradientColor = undefined;
	menuButton.onClick = () => toggleSettings();
	uiRoot.addChild(menuButton);
	for (let i = -1; i <= 1; ++i) {
		const line = new UIObject(vec2(0, i * 9), vec2(26, 4));
		line.color = GOLD;
		line.gradientColor = undefined;
		line.lineWidth = 0;
		line.shadowColor = new Color(0, 0, 0, 0);
		line.canBeHover = false;
		menuButton.addChild(line);
	}

	uiSettings = new UIObject(mainCanvasSize.divide(vec2(2)), vec2(700, 360));
	uiSettings.color = new Color(0.09, 0.11, 0.21, 0.96);
	uiSettings.gradientColor = undefined;
	uiSettings.lineWidth = 0;
	uiSettings.visible = false;
	uiRoot.addChild(uiSettings);

	// Title
	const titleText = new UIText(vec2(0, -155), vec2(350, 40), "Game Settings");
	titleText.textColor = GOLD;
	titleText.textLineWidth = 4;
	uiSettings.addChild(titleText);

	// Reset Game button
	const resetButton = new UIButton(vec2(0, 80), vec2(300, 45), "Reset Game");
	resetButton.color = new Color(0.16, 0.2, 0.32);
	resetButton.gradientColor = undefined;
	resetButton.textColor = GOLD;
	resetButton.onClick = () => {
		uiSystem.showConfirmDialog("Reset game?", () => {
			resetGame();
			setSettingsVisible(false);
		});
	};
	uiSettings.addChild(resetButton);

	// Close button
	const closeButton = new UIButton(vec2(0, 140), vec2(300, 45), "Close");
	closeButton.color = new Color(0.16, 0.2, 0.32);
	closeButton.gradientColor = undefined;
	closeButton.textColor = GOLD;
	closeButton.onClick = () => setSettingsVisible(false);
	uiSettings.addChild(closeButton);

	// ---- main menu (shown at startup, before the game begins) ----
	uiMenu = new UIObject(mainCanvasSize.divide(vec2(2)), mainCanvasSize);
	uiMenu.color = new Color(0.05, 0.06, 0.12, 0.94);
	uiMenu.gradientColor = undefined;
	uiMenu.lineWidth = 0;
	uiMenu.interactive = true;
	uiMenu.canBeHover = false;
	uiRoot.addChild(uiMenu);

	const menuTitle = new UIText(vec2(0, -70), vec2(560, 90), "Angelfish");
	menuTitle.textColor = GOLD;
	menuTitle.textLineWidth = 6;
	uiMenu.addChild(menuTitle);

	const menuSubtitle = new UIText(
		vec2(0, 5),
		vec2(440, 30),
		"Place fish to block the angel's escape.",
	);
	menuSubtitle.textColor = SANDLIGHTBROWN;
	menuSubtitle.textLineWidth = 2;
	uiMenu.addChild(menuSubtitle);

	const startButton = new UIButton(vec2(0, 90), vec2(280, 64), "Start Game");
	startButton.color = new Color(0.16, 0.2, 0.32);
	startButton.gradientColor = undefined;
	startButton.textColor = GOLD;
	startButton.onClick = () => startGame();
	uiMenu.addChild(startButton);
}

function getSettingsVisible() {
	return uiSettings.visible;
}

function getMenuVisible() {
	return uiMenu.visible;
}

function setMenuVisible(visible) {
	uiMenu.visible = visible;
}

function setSettingsVisible(visible) {
	uiSettings.visible = visible;
}

function toggleSettings() {
	uiSettings.visible = !uiSettings.visible;
}

function setUIVisible(visible) {
	uiRoot.visible = visible;
}

function onAngelEscaped() {
	if (uiAngelBanner) uiAngelBanner.visible = true;
	alert("The angelfish escaped!");
}

// TODO create a function which temporarily moves the fish pieces off to the side of the board

function gameUpdatePost() {
	if (gameStarted && keyWasPressed("Escape") && !uiSystem.confirmDialog) {
		toggleSettings();
	}
	setPaused(getSettingsVisible() || !gameStarted);
}
