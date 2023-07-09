import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	PluginSpec,
	PluginValue,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { nanoid } from "nanoid";
import moize from "moize";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export const getScryfallCard = moize.promise(async (name: string) => {
	const response = await fetch(
		`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`
	);
	if (response.ok) {
		const json = await response.json();
		return json.image_uris.normal;
	} else {
		return null;
	}
});

export class CardWidget extends WidgetType {
	constructor(public id: string, public name: string) {
		super();
	}

	toDOM(view: EditorView): HTMLElement {
		const img = document.createElement("img");
		img.className = "scryfall_card";
		img.width = 488 / 2;
		img.id = this.id;
		img.style.opacity = "0";
		img.toggleVisibility(false);

		const listener: {
			current: (this: HTMLElement, e: MouseEvent) => void;
		} = {
			current: () => {},
		};

		getScryfallCard(this.name).then((src) => {
			if (src == null) {
				return;
			}

			img.src = src;

			listener.current = (e) => {
				if (!img) {
					view.dom.removeEventListener("mousemove", listener.current);
					return;
				}

				const rect = view.dom.getBoundingClientRect();
				img.style.left = e.clientX - rect.left + 10 + "px";
				img.style.top = e.clientY - rect.top + 40 + "px";

				if (img.style.opacity != "100%") {
					img.style.opacity = "100%";
				}

				const element = document.getElementById(`${this.id}-a`);
				if (element) {
					element.onmousedown = () => {
						const urlName = encodeURIComponent(this.name);
						const url = `https://scryfall.com/search?as=grid&order=released&q=%21%22${urlName}%22`;
						// eslint-disable-next-line @typescript-eslint/no-var-requires
						require("electron").shell.openExternal(url);
					};
				}
			};

			view.dom.addEventListener("mousemove", listener.current);
		});

		return img;
	}
}

export class CardPlugin implements PluginValue {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = this.buildDecorations(view);
	}

	update(update: ViewUpdate) {
		if (update.docChanged || update.viewportChanged) {
			this.decorations = this.buildDecorations(update.view);
		}
	}

	destroy() {}

	buildDecorations(view: EditorView): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();

		for (const { from, to } of view.visibleRanges) {
			syntaxTree(view.state).iterate({
				from,
				to,
				enter(node) {
					if (node.type.name == "hmd-barelink_link") {
						const id = nanoid();
						const name = view.state.doc
							.slice(node.from, node.to)
							.toString()
							.toLowerCase();

						builder.add(
							node.from,
							node.to,
							Decoration.mark({
								tagName: "a",
								attributes: {
									id: `${id}-a`,
									onmouseover: `document.getElementById("${id}")?.toggleVisibility(true)`,
									onmouseout: `document.getElementById("${id}")?.toggleVisibility(false)`,
								},
							})
						);

						builder.add(
							node.to,
							node.to,
							Decoration.widget({
								widget: new CardWidget(id, name),
							})
						);
					}
				},
			});
		}

		return builder.finish();
	}
}

const pluginSpec: PluginSpec<CardPlugin> = {
	decorations: (value: CardPlugin) => value.decorations,
};

export const cardPlugin = ViewPlugin.fromClass(CardPlugin, pluginSpec);

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerEditorExtension(cardPlugin);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings for my awesome plugin." });

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						console.log("Secret: " + value);
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
