// UI system — copied from star-checkers and adapted for angel-hexagons.
//
// This is the menu/settings panel: a menu button (top-left) opens a settings
// dialog with a Guides toggle, a Speed slider, a Reset button, and a Close
// button. The engine is paused while the dialog is open and Escape toggles it.

let uiRoot, uiSettings;

// UI theme colors (shared with star-checkers)
const GOLD = new Color().setHex("#ffd76a");
const SANDLIGHTBROWN = new Color(0.97, 0.88, 0.63);
const GOLDDEEP = new Color().setHex("#c98a1b");

// UI-controlled settings (kept local to the UI so no game logic is required)
let MOVEGUIDES = false;
let CPU_MOVE_DELAY = 1;
const ANIMATION_SPEED = { CPU_DURATION: 7, HUMAN_DURATION: 14 };

function positionPile() {
	const scale = 250;
	const w = scale;
	const h = (scale * 320) / 520;
	const offsetX = 18;
	const offsetY = -10;
	const baseX = window.innerWidth / 8 - w / 2;
	const baseY = window.innerHeight - h - 30;

	fish.forEach((el, i) => {
		el.setAttribute("scale", scale);
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

	// menu button (upper-right corner)
	const menuButton = new UIButton(
		vec2(canvasFixedSize.x - 35, 35),
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

	uiSettings = new UIObject(vec2(360, 360), vec2(400, 360));
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

	// Guides
	const guidesCheck = new UICheckbox(vec2(-140, -95), vec2(40));
	guidesCheck.checked = MOVEGUIDES;
	guidesCheck.text = "Guides";
	guidesCheck.textColor = SANDLIGHTBROWN;
	guidesCheck.onChange = () => {
		MOVEGUIDES = guidesCheck.checked;
	};
	uiSettings.addChild(guidesCheck);

	// Game Speed slider
	const speedLabel = new UIText(vec2(-150, -10), vec2(150, 25), "Speed");
	speedLabel.textColor = SANDLIGHTBROWN;
	speedLabel.textLineWidth = 2;
	uiSettings.addChild(speedLabel);

	const speedSlider = new UISlider(vec2(30, -10), vec2(230, 30));
	speedSlider.color = GOLD;
	speedSlider.gradientColor = undefined;
	speedSlider.value = 0.5;
	speedSlider.onChange = () => {
		const v = speedSlider.value;
		CPU_MOVE_DELAY = 1.2 - v * 1.15;
		const mult = 2 - v * 1.6;
		const dur = Math.round(12 * mult);
		ANIMATION_SPEED.CPU_DURATION = dur;
		ANIMATION_SPEED.HUMAN_DURATION = dur;
		const labels = ["Very Slow", "Slow", "Normal", "Fast", "Very Fast"];
		const idx = v < 0.2 ? 0 : v < 0.4 ? 1 : v < 0.6 ? 2 : v < 0.8 ? 3 : 4;
		speedSlider.text = labels[idx];
		speedSlider.textColor = GOLDDEEP;
	};
	speedSlider.onChange();
	uiSettings.addChild(speedSlider);

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
}

function getSettingsVisible() {
	return uiSettings.visible;
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

function gameUpdatePost() {
	if (keyWasPressed("Escape") && !uiSystem.confirmDialog) {
		toggleSettings();
	}
	setPaused(getSettingsVisible());
}
