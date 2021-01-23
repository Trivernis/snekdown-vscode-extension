import * as vscode from "vscode";


export function getActiveFilePath(): string {
    return  vscode.window.activeTextEditor?.document.fileName as unknown as string;
}