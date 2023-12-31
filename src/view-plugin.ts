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
					if (/hmd-barelink_link|hmd-barelink_link_list-[0-9]+/y.test(node.type.name)) {
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

						if (!isSelected) {
							builder.add(
								node.from - 1,
								node.from,
								Decoration.replace({})
							);
						}

						builder.add(
							node.from,
							node.to,
							Decoration.mark({
								tagName: "a",
								attributes: {
									id: `${id}-a`,
									onmouseover: `document.getElementById("${id}-1")?.toggleVisibility(true); document.getElementById("${id}-2")?.toggleVisibility(true)`,
									onmouseout: `document.getElementById("${id}-1")?.toggleVisibility(false); document.getElementById("${id}-2")?.toggleVisibility(false)`,
								},
							})
						);

						builder.add(
							node.to,
							node.to,
							Decoration.widget({
								widget: new CardWidget(
									id,
									name,
									plugin.settings
								),
							})
						);

						if (!isSelected) {
							builder.add(
								node.to,
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
