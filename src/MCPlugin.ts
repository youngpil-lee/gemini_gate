import { ViewUpdate, PluginValue, EditorView, ViewPlugin } from '@codemirror/view'

class ExamplePlugin implements PluginValue {
    private dom: HTMLDivElement | null = null
    constructor(view: EditorView) {
        // EditorView initialized
    }

    update(update: ViewUpdate) {}

    destroy() {
        this.dom?.remove()
    }
}

export const examplePlugin = ViewPlugin.fromClass(ExamplePlugin)
