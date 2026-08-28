// Animated aquatic, circle-themed background.
//
// Rendered as a DOM layer (pure CSS + JS-generated bubbles) that sits BEHIND the
// LittleJS canvas. LittleJS's container is <body>, which it paints black by
// default; we undo that (transparent body + transparent clear color) so this
// layer shows through. pointer-events:none keeps clicks hitting the game.
//
// The scene is entirely circle-based: a deep water gradient, slow drifting
// "caustic" glow pools, and a swarm of rising bubbles that bob and sway.

(function () {
	let bg = null;

	function injectStyle() {
		if (document.getElementById("aqua-style")) return;
		const el = document.createElement("style");
		el.id = "aqua-style";
		el.textContent = `
			/* override LittleJS's opaque black body paint, whatever it sets inline */
			body { background: transparent !important; }
			#aqua-bg {
				position: fixed;
				inset: 0;
				z-index: 0;
				pointer-events: none;
				overflow: hidden;
				background: radial-gradient(ellipse at 50% 120%, #123a5c 0%, #0b1e38 55%, #050a18 100%);
			}
			#aqua-bg .pool {
				position: absolute;
				border-radius: 50%;
				filter: blur(2px);
				opacity: .5;
				animation: aqua-pool linear infinite;
				will-change: transform;
			}
			#aqua-bg .bubble {
				position: absolute;
				border-radius: 50%;
				background: radial-gradient(
					circle at 32% 32%,
					rgba(210, 240, 255, .85) 0%,
					rgba(120, 200, 230, .35) 38%,
					rgba(60, 140, 190, .12) 70%,
					rgba(180, 230, 250, .35) 96%,
					rgba(255, 255, 255, .5) 100%
				);
				animation: aqua-rise linear infinite;
				will-change: transform, opacity;
			}
			@keyframes aqua-rise {
				0%   { transform: translate3d(0,0,0) rotate(0deg); opacity: 0; }
				10%  { opacity: var(--op); }
				60%  { opacity: var(--op); }
				100% { transform: translate3d(var(--sway), var(--rise), 0) rotate(360deg); opacity: 0; }
			}
			@keyframes aqua-pool {
				0%   { transform: translate3d(0,0,0) scale(1); }
				50%  { transform: translate3d(var(--dx), var(--dy), 0) scale(1.15); }
				100% { transform: translate3d(0,0,0) scale(1); }
			}
		`;
		document.head.appendChild(el);
	}

	function addPool(size, color) {
		const el = document.createElement("div");
		el.className = "pool";
		el.style.width = el.style.height = size + "px";
		el.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
		el.style.top = el.style.left = "50%";
		el.style.margin = `-${size / 2}px 0 0 -${size / 2}px`;
		const duration = 18 + Math.random() * 18;
		el.style.setProperty("--dx", (Math.random() * 2 - 1) * 60 + "px");
		el.style.setProperty("--dy", (Math.random() * 2 - 1) * 60 + "px");
		el.style.animationDuration = duration + "s";
		el.style.animationDelay = -Math.random() * duration + "s";
		bg.appendChild(el);
	}

	function addBubble() {
		const el = document.createElement("div");
		el.className = "bubble";
		const size = 6 + Math.random() * 34;
		el.style.width = el.style.height = size + "px";
		el.style.left = Math.random() * 100 + "%";
		el.style.bottom = "-48px";
		const duration = 8 + Math.random() * 14;
		el.style.setProperty("--rise", 110 + Math.random() * 80 + "vh");
		el.style.setProperty("--sway", (Math.random() * 2 - 1) * 120 + "px");
		el.style.setProperty("--op", 0.25 + Math.random() * 0.5);
		el.style.animationDuration = duration + "s";
		el.style.animationDelay = -Math.random() * duration + "s";
		bg.appendChild(el);
	}

	function initBackground() {
		if (document.getElementById("aqua-bg")) return;
		injectStyle();

		bg = document.createElement("div");
		bg.id = "aqua-bg";
		// first child so the LittleJS canvases paint above it
		document.body.insertBefore(bg, document.body.firstChild);

		addPool(120, "rgba(60, 150, 210, .35)");
		addPool(150, "rgba(90, 180, 220, .28)");
		addPool(100, "rgba(50, 120, 190, .3)");
		addPool(180, "rgba(120, 210, 235, .18)");
		addPool(90, "rgba(90, 170, 225, .25)");

		for (let i = 0; i < 28; i++) addBubble();

		// clear the engine's 2D frame to fully transparent so the DOM shows through
		canvasClearColor = new Color(0, 0, 0, 0);
	}

	// Build as soon as the DOM is ready (after engineInit has appendsed its black
	// body style, which our !important rule then overrides).
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initBackground);
	} else {
		initBackground();
	}
})();
