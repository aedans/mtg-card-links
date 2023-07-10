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

		containerEl.createEl("h2", { text: "Settings for MTG Card Links." });

		new Setting(containerEl)
			.setName("Link Site")
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
	}
}
