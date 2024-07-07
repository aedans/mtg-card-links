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
	const span = document.createElement('span');
	span.className = 'scryfall_hover';
	span.width = width;
	span.id = id;
	span.style.opacity = '0';
	span.toggleVisibility(false);

	if (showPrices) {
		span.cardPrice = document.createElement('span');
		span.appendChild(span.cardPrice);
		span.cardPrice.className = 'scryfall_price';

		span.priceBreak = document.createElement("br");
		span.appendChild(span.priceBreak);
	}

	const imgFront = createCardImg(`${this.id}-front`, width);
	span.appendChild(imgFront);
	span.cardFront = imgFront;

	const imgBack = createCardImg(`${this.id}-back`, width);
	span.cardBack = imgBack;
	span.appendChild(imgBack);

	return span;
}

export function createPriceTripletString(symbol: string, priceNormal: number, priceFoil: number, priceEtched: number) {
	if (!priceNormal && !priceFoil && !priceEtched) {
		return '';
	}

	let triplet = [];

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

export function createPriceString(prices, showUsd: boolean, showEur: boolean, showTix: boolean) {
	if (!prices) {
		return '(no prices found)';
	}

	let priceStrings = [];

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
		const hover = createHover(`${this.id}-hover`, width, this.settings.showPrices);
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

			hover.cardFront.src = images[0] ?? "";
			hover.cardBack.src = images[1] ?? "";

			if (this.settings.showPrices && card.prices) {
				const priceText = createPriceString(
					card.prices,
					this.settings.showPricesUsd,
					this.settings.showPricesEur,
					this.settings.showPricesTix
				);

				if (priceText) {
					hover.cardPrice.innerText = priceText;
				} else {
					hover.cardPrice.style.display = 'none';
					hover.priceBreak.style.display = 'none';
				}
			}

			const onMouseMove = (e: MouseEvent) => {
				width = (448 * this.settings.imageSize) / widthDivider;

				if (hover.width != width) {
					hover.width = width;
				}

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
