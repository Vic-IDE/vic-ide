// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { AssetManifest } from "./AssetManifest";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vic-ide" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "vic-ide.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      void vscode.window.showInformationMessage("Hello World from vic-ide!");
    }
  );

  context.subscriptions.push(disposable);

  context.subscriptions.push(
    vscode.commands.registerCommand("vic-ide.openSimulator", () => {
      showVicSimulator(context.extensionUri);
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate(): void {
  // TODO ...
}

const vicViewType = "vic";

function entrypointUri(
  extensionUri: vscode.Uri,
  webview: vscode.Webview,
  entrypoint: string
): vscode.Uri {
  const pathOnDisk = vscode.Uri.joinPath(extensionUri, "build", entrypoint);
  return webview.asWebviewUri(pathOnDisk);
}

function entrypointHtml(scriptNonce: string, entrypoint: vscode.Uri): string {
  const entrypointStr = entrypoint.toString();
  if (entrypointStr.endsWith(".css")) {
    return entrypointCssHtml(entrypointStr);
  } else if (entrypointStr.endsWith(".js")) {
    return entrypointJsHtml(scriptNonce, entrypointStr);
  } else {
    // TODO
    return "";
  }
}

function entrypointCssHtml(entrypoint: string): string {
  return `<link href="${entrypoint}" rel="stylesheet">`;
}

function entrypointJsHtml(scriptNonce: string, entrypoint: string): string {
  return `<script nonce="${scriptNonce}" defer="defer" src="${entrypoint}"></script>`;
}

function showVicSimulator(extensionUri: vscode.Uri): void {
  const panel = vscode.window.createWebviewPanel(
    vicViewType,
    "Vic Simulator",
    vscode.ViewColumn.One,
    getWebviewOptions(extensionUri)
  );

  const assetMannifestPath = vscode.Uri.joinPath(
    extensionUri,
    "build",
    "asset-manifest.json"
  );

  vscode.workspace.fs.readFile(assetMannifestPath).then(
    (contents) => {
      const assetManifest = AssetManifest.load(contents.toString());
      if (typeof assetManifest === "string") {
        void vscode.window.showErrorMessage(
          `Error loading asset-manifest.json:\n${assetManifest}`
        );
      } else {
        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        const entrypointsHtml = assetManifest
          .getEntryPoints()
          .map((e) => entrypointUri(extensionUri, panel.webview, e))
          .map((e) => entrypointHtml(nonce, e))
          .join("\n");

        const pageHtml = `
				<!doctype html>
				<html lang="en">
				<head>
					<meta charset="utf-8" />
					<!--
						Use a content security policy to only allow loading images from https or from our extension directory,
						and only allow scripts that have a specific nonce.
					-->
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource}; img-src ${panel.webview.cspSource} https: data:; script-src 'nonce-${nonce}';">
					<meta name="viewport" content="width=device-width,initial-scale=1" />
					<title>Vic Simulator</title>
					${entrypointsHtml}
				</head>
				<body>
					<div id="root"></div>
				</body>
				</html>`;

        void vscode.window.showInformationMessage(pageHtml);

        panel.webview.html = pageHtml;
      }
    },
    (err) => {
      void vscode.window.showErrorMessage(
        `Error loading asset-manifest.json:\n${err as string}`
      );
    }
  );

  // setTimeout(() => {
  // panel.webview.html = `<!DOCTYPE html>
  // 	<html lang="en">
  // 	<head>
  // 		<meta charset="UTF-8">
  // 		<!--
  // 			Use a content security policy to only allow loading images from https or from our extension directory,
  // 			and only allow scripts that have a specific nonce.
  // 		-->
  // 		<meta name="viewport" content="width=device-width, initial-scale=1.0">
  // 		<title>Vic</title>
  // 	</head>
  // 	<body>
  // 		<h1 id>Vic</h1>
  // 	</body>
  // 	</html>`;
  // }, 2000);
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,

    // And restrict the webview to only loading content from the specified directories.
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, "build")],
  };
}

function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
