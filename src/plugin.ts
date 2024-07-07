import { Plugin } from "obsidian";
import { MTGCardLinksSettings, MTGCardLinksSettingsTab } from "./settings";
import { viewPlugin } from "./view-plugin";

export class MTGCardLinksPlugin extends Plugin {
	settings: MTGCardLinksSettings;

	async onload() {
		await this.loadSettings();

		this.registerEditorExtension(viewPlugin(this.settings));

		this.addSettingTab(new MTGCardLinksSettingsTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		const defaultSettings: MTGCardLinksSettings = {
			linkSite: "scryfall",
			imageSize: 0.5,
			showPrices: false,
			showPricesUsd: true,
			showPricesEur: false,
			showPricesTix: false,
			showSet: false,
			requiredPrefix: "",
			currencySeparator: " | ",
			priceSeparator: " / ",
			foilPostfix: " *F*",
			foilEtchedPostfix: " *E*",
		};

		this.settings = Object.assign(defaultSettings, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
