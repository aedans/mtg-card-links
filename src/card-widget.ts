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

export const cardWidth = 448 / 2;

export function createImg(id: string) {
	const img = document.createElement("img");
	img.className = "scryfall_card";
	img.width = cardWidth;
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
		const img = createImg(`${this.id}-1`);
		const img2 = createImg(`${this.id}-2`);

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
				const rect = view.dom.getBoundingClientRect();
				img.style.left = e.clientX - rect.left + 10 + "px";
				img.style.top = e.clientY - rect.top + 40 + "px";
				img2.style.left = e.clientX - rect.left + 10 + cardWidth + "px";
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
						// eslint-disable-next-line @typescript-eslint/no-var-requires
						require("electron").shell.openExternal(url);
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
