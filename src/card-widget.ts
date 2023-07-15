import { EditorView, WidgetType } from "@codemirror/view";
import { ScryfallCard, getScryfallCard } from "./scryfall";
import { LinkSite, MTGCardLinksSettings } from "./settings";

export const linkSites: Record<LinkSite, (cache: ScryfallCard) => string> = {
	scryfall: (cache) => cache.scryfall_uri,
	gatherer: (cache) => cache.related_uris.gatherer,
	edhrec: (cache) => cache.related_uris.edhrec,
	tcgplayer: (cache) => cache.purchase_uris.tcgplayer,
	cardhoarder: (cache) => cache.purchase_uris.cardhoarder,
	cardmarket: (cache) => cache.purchase_uris.cardmarket,
};

export function createImg(id: string, width: number) {
	const img = document.createElement("img");
	img.className = "scryfall_card";
	img.width = width;
	img.id = id;
	img.style.opacity = "0";
	img.toggleVisibility(false);
	return img;
}

export class CardWidget extends WidgetType {
	constructor(
		public id: string,
		public name: string,
		public settings: MTGCardLinksSettings
	) {
		super();
	}

	toDOM(view: EditorView): HTMLElement {
		let width = 448 * this.settings.imageSize;
		const img = createImg(`${this.id}-1`, width);
		const img2 = createImg(`${this.id}-2`, width);

		getScryfallCard(this.name).then((card) => {
			if (card == null) {
				return;
			}

			const images = [];
			if (card.image_uris) {
				images.push(card.image_uris.normal);
			} else if (card.card_faces) {
				images.push(card.card_faces[0].image_uris.normal);
				images.push(card.card_faces[1].image_uris.normal);
			}

			img.src = images[0] ?? "";
			img2.src = images[1] ?? "";

			const onMouseMove = (e: MouseEvent) => {
				width = 448 * this.settings.imageSize;

				if (img.width != width) {
					img.width = width;
				}

				if (img2.width != width) {
					img2.width = width;
				}

				const rect = view.dom.getBoundingClientRect();
				img.style.left = e.clientX - rect.left + 10 + "px";
				img.style.top = e.clientY - rect.top + 40 + "px";
				img2.style.left = e.clientX - rect.left + 10 + width + "px";
				img2.style.top = e.clientY - rect.top + 40 + "px";

				if (img.style.opacity != "100%") {
					img.style.opacity = "100%";
				}

				if (img2.style.opacity != "100%") {
					img2.style.opacity = "100%";
				}

				const element = document.getElementById(`${this.id}-a`);
				if (element) {
					element.onmousedown = () => {
						const url =
							linkSites[this.settings.linkSite](card) ??
							card.scryfall_uri;

						const a = document.createElement("a");
						a.href = url;
						a.click();
					};
				}
			};

			view.dom.addEventListener("mousemove", onMouseMove);
			this.destroy = () =>
				view.dom.removeEventListener("mousemove", onMouseMove);
		});

		const span = document.createElement("span");
		span.appendChild(img);
		span.appendChild(img2);

		return span;
	}
}
