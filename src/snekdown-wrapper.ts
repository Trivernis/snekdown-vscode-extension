import { exec, execFile, spawn } from "child_process";
import { chmodSync } from "fs";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { pathToFileURL } from "url";
import { setFlagsFromString } from "v8";
import { ExtensionContext, Uri } from "vscode";
import * as vscode from "vscode";
import fetch from "node-fetch";

const SNEKDOWN_FILE_LINUX = "snekdown-linux-x86_64";
const SNEKDOWN_FILE_WINDOWS = "snekdown-windows-x86_64.exe";
const SNEKDOWN_URL_LINUX = "https://github.com/Trivernis/snekdown/releases/latest/download/" + SNEKDOWN_FILE_LINUX;
const SNEKDOWN_URL_WINDOWS = "https://github.com/Trivernis/snekdown/releases/latest/download/" + SNEKDOWN_FILE_WINDOWS;


enum SnekdownCommand {
    render = "render",
    watch = "watch",
    init = "init",
    clearCache = "clear-cache",
}

export enum RenderingFormat {
    html = "html",
    pdf = "pdf",
}

export class SnekdownWrapper {
    private executable: string = "snekdown";

    constructor(private context: ExtensionContext) {
    }

    /**
     * Initializes a snekdown project
     */
    public async init() {
        await this.execute(SnekdownCommand.init, []);
    }

    /**
     * Renders a file to html and returns the html string
     * @param inputFile 
     */
    public async renderHTML(inputFile: string): Promise<string> {
        return this.execute(SnekdownCommand.render, [inputFile, "--stdout"]); 
    }

    /**
     * Clears the image and rendering cache
     */
    public async clearCache() {
        await this.execute(SnekdownCommand.clearCache, []);
    }

    /**
     * Renders the document to a file
     * @param inputFile
     * @param outputFile 
     * @param format 
     */
    public async renderToFile(inputFile: string, outputFile: string, format: RenderingFormat) {
        await this.execute(SnekdownCommand.render, [inputFile, outputFile, "--format", format]);
    }

    /**
     * Detects or downloads the snekdown executable
     */
    public async download (force: boolean = false) {

        let execPath: string;
        let res: any;

        switch (os.platform()) {
            case 'win32':
                execPath = this.buildExecutablePath(SNEKDOWN_FILE_WINDOWS);
                this.executable = execPath;

                await SnekdownWrapper.downloadFile(SNEKDOWN_URL_WINDOWS, this.executable, force);
                break;
            case 'linux':
                if (fs.existsSync("/usr/bin/snekdown") && false) {
                    this.executable = "/usr/bin/snekdown";
                    break;
                }
                execPath = this.buildExecutablePath(SNEKDOWN_FILE_LINUX);
                this.executable = execPath;
                await SnekdownWrapper.downloadFile(SNEKDOWN_URL_LINUX, this.executable, force);

                chmodSync(execPath, "555");
                break;
            default:
                throw new Error("OS Platform not supported.");
        }
    }
    
    /**
     * Downloads a file if it doesn't exist
     * @param url 
     * @param path 
     * @param force 
     */
    private static async downloadFile(url: string, path: string, force: boolean = false) {
        if (fs.existsSync(path)) {
            if (!force) {
                return;
            }
            fs.unlinkSync(path);
        }
        const res = await fetch(url);
        fs.writeFileSync(path, await res.buffer());
    }

    /**
     * Builds the path in the extension folder for a given file
     */
    private buildExecutablePath(filename: string): string {
        return path.join(this.context.extensionPath, filename);
    } 

    /**
     * Executes a snekdown command and returns the stdout value
     * @param command
     * @param args 
     */
    private async execute(command: SnekdownCommand, args: string[]): Promise<string> {
        let cwd: string;
        if (vscode.workspace.workspaceFolders) {
            cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
        }
        return new Promise((res, rej) => {
            let child = spawn(this.executable, [command, ...args], {cwd});
            let stdout = "";
            child.stdout.on("data", data => {
                stdout += data as string;
            });
            child.stderr.on("data", data => {
                console.log("Snekdown: ", "" + data as string);
            });
            child.on("exit", code => {
                if (code != 0) {
                    rej(new Error("Failed to execute command. Open the developer console for more information."))
                } else {
                    res(stdout)
                }
            });
        });
    }
}
