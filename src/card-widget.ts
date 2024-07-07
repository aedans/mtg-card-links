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

export function createCardImg(id: string, width: number) {
	const img = document.createElement("img");
	img.className = "scryfall_card";
	img.width = width;
	img.id = id;
	return img;
}

export function createHover(id: string, width: number, showPrices: boolean) {
	const hover = document.createElement('span');
	hover.className = 'scryfall_hover';
	// hover.width = width;
	hover.id = id;
	hover.style.opacity = '0';
	hover.toggleVisibility(false);

	let cardPrice: HTMLSpanElement | undefined;
	let priceBreak: HTMLSpanElement | undefined;

	if (showPrices) {
		cardPrice = document.createElement('span');
		hover.appendChild(cardPrice);
		cardPrice.className = 'scryfall_price';

		priceBreak = document.createElement("br");
		hover.appendChild(document.createElement("br"));
	}

	const cardFront = createCardImg(`${this.id}-front`, width);
	hover.appendChild(cardFront);

	const cardBack = createCardImg(`${this.id}-back`, width);
	hover.appendChild(cardBack);

	return { hover, cardPrice, priceBreak, cardFront, cardBack };
}

export function createPriceTripletString(symbol: string, priceNormal?: string, priceFoil?: string, priceEtched?: string) {
	if (!priceNormal && !priceFoil && !priceEtched) {
		return '';
	}

	const triplet: string[] = [];

	if (priceNormal) {
		triplet.push(`${symbol}${priceNormal}`);
	}

	if (priceFoil) {
		triplet.push(`${symbol}${priceFoil}[F]`);
	}

	if (priceEtched) {
		triplet.push(`${symbol}${priceEtched}[E]`);
	}

	return triplet.join('/');
}

export function createPriceString(prices: ScryfallCard["prices"], showUsd: boolean, showEur: boolean, showTix: boolean) {
	if (!prices) {
		return '(no prices found)';
	}

	const priceStrings: string[] = [];

	if (showUsd) {
		priceStrings.push(createPriceTripletString('$', prices.usd, prices.usd_foil, prices.usd_etched));
	}

	if (showEur) {
		priceStrings.push(createPriceTripletString('€', prices.eur, prices.eur_foil, prices.eur_etched));
	}

	if (showTix && prices.tix) {
		priceStrings.push(`${prices.tix} TIX`);
	}

	return priceStrings.filter(s => s != '').join(', ');
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
		const { hover, priceBreak, cardPrice, cardFront, cardBack } = createHover(`${this.id}-hover`, width, this.settings.showPrices);
		const offsetLeft = 15;
		const offsetTop = 40;

		getScryfallCard(this.name).then((card) => {
			if (card == null) {
				return;
			}

			let widthDivider = 1;

			const images = [];
			if (card.image_uris) {
				images.push(card.image_uris.normal);
			} else if (card.card_faces) {
				images.push(card.card_faces[0].image_uris.normal);
				images.push(card.card_faces[1].image_uris.normal);
				widthDivider = 2;
			}

			cardFront.src = images[0] ?? "";
			cardBack.src = images[1] ?? "";

			if (this.settings.showPrices && card.prices) {
				const priceText = createPriceString(
					card.prices,
					this.settings.showPricesUsd,
					this.settings.showPricesEur,
					this.settings.showPricesTix
				);

				if (cardPrice && priceBreak) {
					if (priceText) {
						cardPrice.innerText = priceText;
					} else {
						cardPrice.style.display = 'none';
						priceBreak.style.display = 'none';
					}	
				}
			}

			const onMouseMove = (e: MouseEvent) => {
				width = (448 * this.settings.imageSize) / widthDivider;

				// if (hover.width != width) {
				// 	hover.width = width;
				// }

				const rect = view.dom.getBoundingClientRect();
				hover.style.left = e.clientX - rect.left + offsetLeft + "px";
				hover.style.top = e.clientY - rect.top + offsetTop + "px";

				if (hover.style.opacity != "100%") {
					hover.style.opacity = "100%";
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

		return hover;
	}
}
