// <fish-piece> — a custom element rendering a procedurally generated fish as a
// hexagonal board-game piece. fishdraw.main() must be called once at game load;
// each piece pulls a fish from that shared RNG.
//
// Attributes: ink, fill, border, scale
// Events: "fish-select" (bubbles) with detail { selected }

(function () {
	let clipCounter = 0;

	function hexagon(cx, cy, rx, ry) {
		const pts = [];
		for (let i = 0; i < 6; i++) {
			const a = (i * Math.PI) / 3;
			pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
		}
		return pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
	}

	function fishToPath(polylines) {
		let d = "";
		for (const line of polylines) {
			line.forEach(([x, y], j) => {
				d += `${j ? "L" : "M"} ${(x + 10).toFixed(2)} ${(y + 10).toFixed(2)} `;
			});
			d += " ";
		}
		return d;
	}

	class FishPiece extends HTMLElement {
		static get observedAttributes() {
			return ["ink", "fill", "border", "scale", "selected", "played"];
		}

		constructor() {
			super();
			this.attachShadow({ mode: "open" });
			this._fish = null;
			this._vivus = null;
			this._renderKey = "";
		}

		connectedCallback() {
			this.addEventListener("click", () => this.click());
			this.render();
		}

		attributeChangedCallback(name) {
			if (!this.isConnected) return;
			// Selection is handled purely by CSS, so it doesn't need a re-render
			// (and would otherwise re-trigger the fish animation on every click).
			if (name === "selected") return;
			// Playing the piece triggers the fish drawing animation.
			if (name === "played") {
				this.playFish();
				return;
			}
			this.render();
		}

		ensureFish() {
			// TODO modify the generated params so that the fish are easier to draw
			if (!this._fish) this._fish = fishdraw.fish(fishdraw.generate_params());
			return this._fish;
		}

		render() {
			const ink = this.getAttribute("ink") || "#1b2a4a";
			const fill = this.getAttribute("fill") || "#fdf6e3";
			const border = this.getAttribute("border") || "#c9a227";
			const scale = parseFloat(this.getAttribute("scale") || "180");

			// Only rebuild + re-animate when something that changes the artwork or
			// layout changes; selection toggles are resolved through CSS alone.
			const key = `${ink}|${fill}|${border}|${scale}|${this._fish ? "f" : ""}`;
			if (key === this._renderKey) return;
			this._renderKey = key;

			const clipId = `fish-clip-${clipCounter}`;
			clipCounter++;
			const poly = hexagon(260, 160, 244, 150);
			const d = fishToPath(this.ensureFish());

			this.shadowRoot.innerHTML = `
        <style>
          :host { display:inline-block; width:${scale}px; height:${(scale * 320) / 520}px;
                  cursor:pointer; user-select:none; -webkit-user-select:none; }
          .piece { width:100%; height:100%; transition:transform 120ms ease, filter 120ms ease;
                    filter:drop-shadow(0 2px 3px rgba(0,0,0,.25)); }
          :host(:hover) .piece { transform:translateY(-2px); }
          :host([selected]) .piece { filter:drop-shadow(0 0 6px ${border}) drop-shadow(0 2px 3px rgba(0,0,0,.25));
                                      transform:translateY(-3px) scale(1.03); }
          svg { width:100%; height:100%; display:block; }
          polygon.frame { stroke-width:5; }
          :host([selected]) polygon.frame { stroke-width:8; }
        </style>
        <div class="piece">
          <svg viewBox="0 0 520 320" preserveAspectRatio="xMidYMid meet">
            <defs><clipPath id="${clipId}"><polygon points="${poly}"/></clipPath></defs>
            <g clip-path="url(#${clipId})">
              <rect width="520" height="320" fill="${fill}" data-ignore="true"/>
              <path d="${d}" fill="none" stroke="${ink}" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </g>
            <polygon class="frame" points="${poly}" fill="none" stroke="${border}"
                     stroke-linejoin="round" data-ignore="true"/>
          </svg>
        </div>`;

			this.animateFish();
		}

		// Build the Vivus instance in manual mode: the fish path is hidden until
		// the piece is played (see playFish). Pieces stay blank in the pile.
		animateFish() {
			if (typeof Vivus === "undefined") return;
			if (this._vivus) {
				this._vivus.destroy();
				this._vivus = null;
			}
			const svg = this.shadowRoot.querySelector("svg");
			if (!svg) return;
			this._vivus = new Vivus(svg, {
				type: "oneByOne",
				duration: 120,
				start: "manual",
				ignoreInvisible: true,
			});
			// If the piece was already played before a re-render, redraw it.
			if (this.hasAttribute("played")) this._vivus.play();
		}

		playFish() {
			if (this._vivus) this._vivus.play();
		}

		click() {
			const selected = !this.hasAttribute("selected");
			this.toggleAttribute("selected", selected);
			this.dispatchEvent(
				new CustomEvent("fish-select", {
					bubbles: true,
					composed: true,
					detail: { selected },
				}),
			);
		}
	}

	if (!customElements.get("fish-piece")) {
		customElements.define("fish-piece", FishPiece);
	}
})();
