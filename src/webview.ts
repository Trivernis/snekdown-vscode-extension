import { ExtensionContext, ViewColumn, WebviewPanel, window } from "vscode";
import { SnekdownWrapper } from "./snekdown-wrapper";
import * as vscode from "vscode";

export class SnekdownWebView {

    private view: WebviewPanel;
    private editor = vscode.window.activeTextEditor;
    public isDisposed = false;

    constructor(private context: ExtensionContext, private wrapper: SnekdownWrapper, columns: ViewColumn, ) {
        this.view = window.createWebviewPanel("snekdownPreview", "Snekdown Preview", columns);
        this.view.webview.options = {
            enableScripts: true,
        };

        const changeListener = vscode.workspace.onDidSaveTextDocument(async () => {
            await this.update();
        });
        this.view.onDidDispose(() => {
            this.isDisposed = true;
            changeListener.dispose();
        });
    }

    /**
     * Disposes of the view
     */
    public close() {
        this.view.dispose();
    }

    /**
     * Updates the webview
     */
    public async update() {
        const html = await this.getHTML();
        this.setHTML(html);
    }

    private async getHTML(): Promise<string> {
        return await this.wrapper.renderHTML(this.editor?.document.fileName as unknown as string);
    }

    private setHTML(html: string) {
        this.view.webview.html = html;
    }
}