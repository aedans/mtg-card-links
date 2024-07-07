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

type PositionedHTMLElement = {
	element: HTMLElement;
	x: number;
	y: number;
};

export function createCardImg(id: string, width: number) {
	const img = document.createElement("img");
	img.className = "scryfall_card scryfall_hover";
	img.width = width;
	img.id = id;
	img.style.opacity = "0";
	img.toggleVisibility(false);
	return img;
}

export function createHover(id: string, width: number, height: number, showPrices: boolean) {
	let cardPrice: PositionedHTMLElement | undefined;

	const cardFront = {
		element: createCardImg(`${id}-front`, width),
		x: 10,
		y: 40,
	};
	const cardBack = {
		element: createCardImg(`${id}-back`, width),
		x: 10 + width,
		y: 40,
	};

	if (showPrices) {
		const element = document.createElement("span");
		element.id = `${id}-prices`
		element.className = "scryfall_price scryfall_hover";
		element.style.opacity = "0";
		element.toggleVisibility(false);
		cardPrice = { element, x: 10, y: 40 + height };
	}

	return {
		cardPrice,
		cardFront,
		cardBack,
	};
}

export function createPriceTripletString(
	symbol: string,
	priceNormal?: string,
	priceFoil?: string,
	priceEtched?: string
) {
	if (!priceNormal && !priceFoil && !priceEtched) {
		return "";
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

	return triplet.join("/");
}

export function createPriceString(
	prices: ScryfallCard["prices"],
	showUsd: boolean,
	showEur: boolean,
	showTix: boolean
) {
	if (!prices) {
		return "(no prices found)";
	}

	const priceStrings: string[] = [];

	if (showUsd) {
		priceStrings.push(
			createPriceTripletString(
				"$",
				prices.usd,
				prices.usd_foil,
				prices.usd_etched
			)
		);
	}

	if (showEur) {
		priceStrings.push(
			createPriceTripletString(
				"€",
				prices.eur,
				prices.eur_foil,
				prices.eur_etched
			)
		);
	}

	if (showTix && prices.tix) {
		priceStrings.push(`${prices.tix} TIX`);
	}

	return priceStrings.filter((s) => s != "").join(", ");
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
		let height = (448 * (3.5 / 2.5)) * this.settings.imageSize;
		const { cardFront, cardBack, cardPrice } = createHover(
			this.id,
			width,
			height,
			this.settings.showPrices
		);

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

			cardFront.element.src = images[0] ?? "";
			cardBack.element.src = images[1] ?? "";

			if (this.settings.showPrices && card.prices) {
				const priceText = createPriceString(
					card.prices,
					this.settings.showPricesUsd,
					this.settings.showPricesEur,
					this.settings.showPricesTix
				);

				if (cardPrice) {
					if (priceText) {
						cardPrice.element.innerText = priceText;
					} else {
						cardPrice.element.style.display = "none";
					}
				}
			}

			const onMouseMove = (e: MouseEvent) => {
				width = (448 * this.settings.imageSize) / widthDivider;
				height = (448 * (3.5 / 2.5) * this.settings.imageSize) / widthDivider;

				// if (hover.width != width) {
				// 	hover.width = width;
				// }

				const rect = view.dom.getBoundingClientRect();

				const elements = [cardFront, cardBack, cardPrice].filter(
					(x) => !!x
				) as PositionedHTMLElement[];

				for (const { element, x, y } of elements) {
					element.style.left = e.clientX - rect.left + x + "px";
					element.style.top = e.clientY - rect.top + y + "px";

					if (element.style.opacity != "100%") {
						element.style.opacity = "100%";
					}
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
		span.appendChild(cardFront.element);
		span.appendChild(cardBack.element);

		if (cardPrice) {
			span.appendChild(cardPrice.element);
		}

		return span;
	}
}
