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
		return pts.map((p) => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" ");
	}

	function fishToPath(polylines) {
		let d = "";
		for (const line of polylines) {
			line.forEach(([x, y], j) => {
				d +=
					(j ? "L " : "M ") +
					(x + 10).toFixed(2) +
					" " +
					(y + 10).toFixed(2) +
					" ";
			});
			d += " ";
		}
		return d;
	}

	class FishPiece extends HTMLElement {
		static get observedAttributes() {
			return ["ink", "fill", "border", "scale", "selected"];
		}

		constructor() {
			super();
			this.attachShadow({ mode: "open" });
			this._fish = null;
		}

		connectedCallback() {
			this.addEventListener("click", () => this.click());
			this.render();
		}

		attributeChangedCallback() {
			if (this.isConnected) this.render();
		}

		ensureFish() {
			// TODO modify the generated params so that the fish are easier to draw
			return (this._fish ||= fishdraw.fish(fishdraw.generate_params()));
		}

		regenerate() {
			this._fish = null;
			this.render();
		}

		render() {
			const ink = this.getAttribute("ink") || "#1b2a4a";
			const fill = this.getAttribute("fill") || "#fdf6e3";
			const border = this.getAttribute("border") || "#c9a227";
			const scale = parseFloat(this.getAttribute("scale") || "180");
			const selected = this.hasAttribute("selected");

			const clipId = "fish-clip-" + clipCounter++;
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
        </style>
        <div class="piece">
          <svg viewBox="0 0 520 320" preserveAspectRatio="xMidYMid meet">
            <defs><clipPath id="${clipId}"><polygon points="${poly}"/></clipPath></defs>
            <g clip-path="url(#${clipId})">
              <rect width="520" height="320" fill="${fill}"/>
              <path d="${d}" fill="none" stroke="${ink}" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </g>
            <polygon points="${poly}" fill="none" stroke="${border}"
                     stroke-width="${selected ? 8 : 5}" stroke-linejoin="round"/>
          </svg>
        </div>`;
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
