import { App, PluginSettingTab, Setting } from "obsidian";
import { MTGCardLinksPlugin } from "./plugin";

export type LinkSite =
	| "scryfall"
	| "gatherer"
	| "edhrec"
	| "tcgplayer"
	| "cardhoarder"
	| "cardmarket";

export interface MTGCardLinksSettings {
	linkSite: LinkSite;
	imageSize: number;
	showPrices: boolean;
	showPricesUsd: boolean;
	showPricesEur: boolean;
	showPricesTix: boolean;
}

export class MTGCardLinksSettingsTab extends PluginSettingTab {
	plugin: MTGCardLinksPlugin;

	constructor(app: App, plugin: MTGCardLinksPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "MTG Card Links." });

		new Setting(containerEl)
			.setName("Link website")
			.setDesc("The website to link to when clicking on a card link.")
			.addDropdown((dropdown) => {
				dropdown
					.addOptions({
						scryfall: "Scryfall",
						gatherer: "Gatherer",
						edhrec: "EDHRec",
						tcgplayer: "TCGPlayer",
						cardhoarder: "Cardhoarder",
						cardmarket: "Cardmarket",
					})
					.setValue(this.plugin.settings.linkSite)
					.onChange(async (value) => {
						this.plugin.settings.linkSite = value as LinkSite;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Image size")
			.setDesc(
				"The size of the image shown when hovering over a card link."
			)
			.addSlider((slider) => {
				slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.imageSize)
					.onChange(async (value) => {
						this.plugin.settings.imageSize = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setHeading()
			.setName("Show Prices")
			.setDesc(
				"Show card prices when hovering over a card link."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.showPrices)
					.onChange(async (value) => {
						this.plugin.settings.showPrices = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		if (this.plugin.settings.showPrices) {
			new Setting(containerEl)
				.setName("USD")
				.setDesc(
					"Show prices in U.S. Dollars"
				)
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.showPricesUsd)
						.onChange(async (value) => {
							this.plugin.settings.showPricesUsd = value;
							await this.plugin.saveSettings();
						});
				});

			new Setting(containerEl)
				.setName("EUR")
				.setDesc(
					"Show prices in Euros"
				)
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.showPricesEur)
						.onChange(async (value) => {
							this.plugin.settings.showPricesEur = value;
							await this.plugin.saveSettings();
						});
				});

			new Setting(containerEl)
				.setName("TIX")
				.setDesc(
					"Show prices in Magic the Gathering Online Tickets"
				)
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.showPricesTix)
						.onChange(async (value) => {
							this.plugin.settings.showPricesTix = value;
							await this.plugin.saveSettings();
						});
				});
		}
	}
}
