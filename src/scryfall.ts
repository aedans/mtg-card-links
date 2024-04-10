import moize from "moize";
import { requestUrl } from "obsidian";

export type ScryfallCard = {
	name: string;
	scryfall_uri: string;
	related_uris: {
		edhrec: string;
		gatherer: string;
	};
	purchase_uris: {
		tcgplayer: string;
		cardhoarder: string;
		cardmarket: string;
	};
	image_uris?: {
		normal: string;
	};
	card_faces?: {
		image_uris: {
			normal: string;
		};
	}[];
};

const scryfallApiBase = 'https://api.scryfall.com';
const scryfallApiUris: {[key: string]: string} = {
	singleCard: `${scryfallApiBase}/cards`,
	cardsNamed: `${scryfallApiBase}/cards/named`,
};

export const getScryfallCard = moize.promise(
	async (name: string): Promise<ScryfallCard | null> => {
		const nameSplit = name.split(/\|/);
		const hasSet = nameSplit.length > 1;
		const hasCollectorNumber = nameSplit.length > 2;

		const cardName = nameSplit[0];
		const cardSet = hasSet ? nameSplit[1] : '';
		const cardNumber = hasCollectorNumber ? nameSplit[2] : '';

		let url = '';

		if (hasCollectorNumber) {
			const encodedSet = encodeURIComponent(cardSet);
			const encodedNumber = encodeURIComponent(cardNumber);
			url = `${scryfallApiUris.singleCard}/${encodedSet}/${encodedNumber}`;
		} else {
			const query = new URLSearchParams();

			query.append('fuzzy', cardName);

			if (hasSet) {
				query.append('set', cardSet);
			}

			url = `${scryfallApiUris.cardsNamed}?${query}`;
		}

		const response = await requestUrl(url);
		
		if (response.status == 200) {
			return response.json;
		} else {
			return null;
		}
	},
	{
		maxSize: 2000, // Average response size is 5kb unzipped
	}
);
