// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { scaffoldSearchDefinition } from "./commands/scaffold";
import { executeSearch } from "./commands/search";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    // SCAFFOLD
    // Creates a search definition file using the active text editor
    // Overwrites the file currently being viewed
    vscode.commands.registerCommand("jsPoweredSearch.scaffold", async () => {
      try {
        await scaffoldSearchDefinition();
      } catch (e) {
        vscode.window.showErrorMessage("Uncaught error in scaffold command.");
        console.error(e);
      }
    }),

    // SEARCH
    // Validates the active text editor, then uses it as a search definition
    // Opens a new window with all search results
    vscode.commands.registerCommand("jsPoweredSearch.search", async () => {
      try {
        await executeSearch();
      } catch (e) {
        vscode.window.showErrorMessage("Uncaught error in search command.");
        console.error(e);
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
