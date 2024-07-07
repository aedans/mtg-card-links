import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	PluginValue,
	ViewUpdate,
} from "@codemirror/view";
import { CardWidget } from "./card-widget";
import { nanoid } from "nanoid";
import { MTGCardLinksSettings } from "./settings";
import { ViewPlugin } from "@codemirror/view";

export function viewPlugin(settings: MTGCardLinksSettings) {
	return ViewPlugin.define(
		(view) => new CardViewPluginValue(view, settings),
		{
			decorations: (value: CardViewPluginValue) => value.decorations,
		}
	);
}

export class CardViewPluginValue implements PluginValue {
	decorations: DecorationSet;

	constructor(view: EditorView, public settings: MTGCardLinksSettings) {
		this.decorations = this.buildDecorations(view);
	}

	update(update: ViewUpdate) {
		if (
			update.docChanged ||
			update.viewportChanged ||
			update.selectionSet
		) {
			this.decorations = this.buildDecorations(update.view);
		}
	}

	destroy() {}

	buildDecorations(view: EditorView): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();
		const plugin = this as CardViewPluginValue;

		for (const { from, to } of view.visibleRanges) {
			syntaxTree(view.state).iterate({
				from,
				to,
				enter(node) {
					if (
						/hmd-barelink_link|hmd-barelink_link_list-[0-9]+/y.test(
							node.type.name
						)
					) {
						const id = nanoid();
						const name = view.state.doc
							.slice(node.from, node.to)
							.toString()
							.toLowerCase();

						let isSelected = false;
						for (const range of view.state.selection.ranges) {
							if (
								range.anchor >= node.from - 1 &&
								range.anchor <= node.to + 1
							) {
								isSelected = true;
								break;
							}
						}

						if (!name.startsWith(plugin.settings.requiredPrefix)) {
							return;
						}

						const startOfName =
							node.from + plugin.settings.requiredPrefix.length;

						if (!isSelected) {
							builder.add(
								node.from - 1,
								startOfName,
								Decoration.replace({})
							);
						}

						const onmouse = (boolean: boolean) =>
							`for (const element of document.getElementsByClassName("scryfall_hover")) 
								if (element.id.includes("${id}")) 
									element.toggleVisibility(${boolean})`;

						builder.add(
							startOfName,
							node.to,
							Decoration.mark({
								tagName: "a",
								attributes: {
									id: `${id}-a`,
									onmouseover: onmouse(true),
									onmouseout: onmouse(false),
								},
							})
						);

						const noffset = name.includes("|")
							? name.length - name.indexOf("|")
							: 0;

						const endOfName = plugin.settings.showSet
							? node.to
							: node.to - noffset;

						builder.add(
							endOfName,
							endOfName,
							Decoration.widget({
								widget: new CardWidget(
									id,
									name.slice(plugin.settings.requiredPrefix.length),
									plugin.settings
								),
							})
						);

						if (!isSelected) {
							builder.add(
								endOfName,
								node.to + 1,
								Decoration.replace({})
							);
						}
					}
				},
			});
		}

		return builder.finish();
	}
}
