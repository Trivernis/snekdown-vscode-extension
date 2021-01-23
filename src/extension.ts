import { pathToFileURL } from 'url';
import * as vscode from 'vscode';
import * as path from "path";
import { SnekdownWrapper, RenderingFormat } from './snekdown-wrapper';
import { getActiveFilePath } from './utils';
import { SnekdownWebView } from './webview';

let snekdownWebview: SnekdownWebView;

export async function activate(context: vscode.ExtensionContext) {
	const snekdownWrapper = new SnekdownWrapper(context);

	await vscode.window.withProgress({
		location: vscode.ProgressLocation.Window,
		title: "Downloading Snekdown"
	}, async () => {
		await snekdownWrapper.download()
	})

	context.subscriptions.push(vscode.commands.registerCommand('snekdown.init', async () => {
		await snekdownWrapper.init();
		vscode.window.showInformationMessage("Snekdown Project initialized.");
	}));

	context.subscriptions.push(vscode.commands.registerCommand('snekdown.clear-cache', async () => {
		await snekdownWrapper.clearCache();
		vscode.window.showInformationMessage("Snekdown cache cleared.");
	}))

	context.subscriptions.push(vscode.commands.registerCommand('snekdown.update-binary', async () => {
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: "Downloading Snekdown"
		}, async () => {
			await snekdownWrapper.download(true)
		});
	}))

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('snekdown.preview', async () => {
		if (!snekdownWebview || snekdownWebview.isDisposed) {
			snekdownWebview = new SnekdownWebView(context, snekdownWrapper, vscode.ViewColumn.One);
		}
		await snekdownWebview.update();
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('snekdown.preview-side', async () => {
		if (!snekdownWebview || snekdownWebview.isDisposed) {
			snekdownWebview = new SnekdownWebView(context, snekdownWrapper, vscode.ViewColumn.Two);
		}
		await snekdownWebview.update();
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('snekdown.export-html', async () => {
		let inputFile = getActiveFilePath();
		let placeholderOutput = inputFile.replace(/\.\w+$/, ".html");
		let outputFile = await vscode.window.showInputBox({
			prompt: "Output File",
			value: placeholderOutput,
		});
		if (outputFile) {
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				title: "Rendering HTML"
			}, async () => {
				await snekdownWrapper.renderToFile(inputFile, outputFile as string, RenderingFormat.html);
			});
		}
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('snekdown.export-pdf', async () => {
		let inputFile = getActiveFilePath();
		let placeholderOutput = inputFile.replace(/\.\w+$/, ".pdf");
		let outputFile = await vscode.window.showInputBox({
			prompt: "Output File",
			value: placeholderOutput,
		});
		if (outputFile) {
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				title: "Rendering PDF"
			}, async () => {
				await snekdownWrapper.renderToFile(inputFile, outputFile as string, RenderingFormat.pdf);
			});
		}
	}));
}

export function deactivate() {
	if (snekdownWebview && !snekdownWebview.isDisposed) {
		snekdownWebview.close();
	}
}
