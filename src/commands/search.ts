import * as vscode from "vscode";
import * as ts from "typescript";
import * as requireFromString from "require-from-string";
import {
  FileSearchOptions,
  LineSearchOptions,
  SearchOptions,
} from "./TEMPLATE";

interface SearchDefinitionModule {
  getSettings: () => SearchOptions;
  searchByLine: () => LineSearchOptions;
  searchByFile: () => FileSearchOptions;
}

interface SearchDefinition {
  settings: SearchOptions;
  searchByLine: LineSearchOptions;
  searchByFile: FileSearchOptions;
}

export function executeSearch() {
  const activeFile = vscode.window.activeTextEditor;
  if (!activeFile) {
    vscode.window.showErrorMessage("No text editor is active.");
    return;
  }

  const fileContents = activeFile.document.getText();

  const transpiled = tryTranspileFile(fileContents);
  if (!transpiled) {
    vscode.window.showErrorMessage(
      "Unable to transpile this search definition file. Check for syntax errors."
    );
    return;
  }

  const dynamicModule: SearchDefinitionModule = tryRequire(
    transpiled.outputText
  );
  if (!dynamicModule) {
    vscode.window.showErrorMessage(
      "Unable to compile and link this search definition file. Check for errors."
    );
    return;
  }

  const searchDefinition = validateAndGetSearchDefinition(dynamicModule);
}

function tryTranspileFile(
  fileContents: string
): ts.TranspileOutput | undefined {
  try {
    const transpiled = ts.transpileModule(fileContents, {});
    return transpiled;
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

function tryRequire(src: string, filename: string = ""): any | undefined {
  try {
    return requireFromString(src, filename);
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

function validateAndGetSearchDefinition(
  module: SearchDefinitionModule
): SearchDefinition | undefined {
  if (typeof module.getSettings !== "function") {
    vscode.window.showErrorMessage(
      "Could not find the getSettings function export in this file."
    );
    return undefined;
  }

  if (typeof module.searchByFile !== "function") {
    vscode.window.showErrorMessage(
      "Could not find the searchByFile function export in this file."
    );
    return undefined;
  }

  if (typeof module.searchByLine !== "function") {
    vscode.window.showErrorMessage(
      "Could not find the searchByLine function export in this file."
    );
    return undefined;
  }

  const searchDefinition = {} as SearchDefinition;
  try {
    searchDefinition.settings = module.getSettings();
  } catch (err) {
    vscode.window.showErrorMessage("An error was thrown by getSettings.");
    console.error(err);
    return undefined;
  }

  if (typeof searchDefinition.settings !== "object") {
    vscode.window.showErrorMessage("getSettings must return an object.");
    return undefined;
  }

  try {
    searchDefinition.searchByFile = module.searchByFile();
  } catch (err) {
    vscode.window.showErrorMessage("An error was thrown by searchByFile.");
    console.error(err);
    return undefined;
  }

  if (typeof searchDefinition.searchByFile !== "object") {
    vscode.window.showErrorMessage("searchByFile must return an object.");
    return undefined;
  }

  try {
    searchDefinition.searchByLine = module.searchByLine();
  } catch (err) {
    vscode.window.showErrorMessage("An error was thrown by searchByLine.");
    console.error(err);
    return undefined;
  }

  if (typeof searchDefinition.searchByLine !== "object") {
    vscode.window.showErrorMessage("searchByLine must return an object.");
    return undefined;
  }

  return searchDefinition;
}
