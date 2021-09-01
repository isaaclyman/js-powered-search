import * as vscode from "vscode";
import * as ts from "typescript";
import * as requireFromString from "require-from-string";
import {
  FileSearchOptions,
  LineSearchOptions,
  SearchOptions,
} from "../resources/TEMPLATE";
import { initializeResultsView, showResult } from "./results";

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

export interface LineResults {
  [lineNumber: number]: string;
}

export interface SearchResult {
  file: vscode.Uri;
  filePath: string;
  fileName: string;
  matchesByFile: boolean;
  matchesByLine: LineResults | undefined;
}

export async function executeSearch() {
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
  if (!searchDefinition) {
    return;
  }

  const openFolders = vscode.workspace.workspaceFolders;
  if (!openFolders || !openFolders.length) {
    vscode.window.showErrorMessage(
      "Search definition looks good, but no workspace folders are currently open."
    );
    return;
  }

  const includeGlobs = searchDefinition.settings.includeFilePatterns || [];
  if (!includeGlobs.length) {
    includeGlobs.push("**/*");
  }

  const excludeGlobs = searchDefinition.settings.excludeFilePatterns || [];
  const includeNodeModules =
    searchDefinition.settings.includeNodeModules || false;
  if (!includeNodeModules) {
    excludeGlobs.push("**/node_modules/**");
  }

  const files = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Matching files...",
      cancellable: true,
    },
    (progress, cancelToken) => {
      return vscode.workspace.findFiles(
        `{${includeGlobs.join(",")}}`,
        excludeGlobs.length ? `{${excludeGlobs.join(",")}}` : null,
        undefined,
        cancelToken
      );
    }
  );

  if (!files.length) {
    vscode.window.showErrorMessage(
      "No files matched the provided file patterns. Check your settings object."
    );
  }

  if (files.length > 200) {
    const confirm = await vscode.window.showWarningMessage(
      `The provided patterns matched ${files.length} files. Are you sure you want to continue with the search?`,
      "Cancel",
      "Search"
    );
    if (confirm !== "Search") {
      return;
    }
  }

  const maxFileSizeInKB =
    typeof searchDefinition.settings.maxFileSizeInKB === "number"
      ? searchDefinition.settings.maxFileSizeInKB
      : 1000;
  const fileMatcher = searchDefinition.searchByFile.doesFileMatchSearch;
  const lineMatcher = searchDefinition.searchByLine.doesLineMatchSearch;
  const onlyTestLinesInMatchingFiles =
    searchDefinition.settings.onlyTestLinesInMatchingFiles || false;

  initializeResultsView();
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Searching with the full power of JavaScript...",
      cancellable: true,
    },
    (progress, cancelToken) => {
      const progressStepSize = Math.floor(files.length / 25) || 1;
      let completedFiles = 0;
      const incrementCompletedFiles = () => {
        completedFiles++;

        if (completedFiles % progressStepSize === 0) {
          progress.report({ increment: (completedFiles / files.length) * 100 });
        }
      };

      const promiseList: Promise<SearchResult | undefined>[] = [];
      for (let fileIx = 0; fileIx < files.length; fileIx++) {
        const filePromise = new Promise<SearchResult | undefined>(
          async (resolve, reject) => {
            const file = files[fileIx];
            const stat = await vscode.workspace.fs.stat(file);
            const exceedsMaxSize =
              maxFileSizeInKB && stat.size / 1000 > maxFileSizeInKB;
            if (cancelToken.isCancellationRequested || exceedsMaxSize) {
              incrementCompletedFiles();
              resolve(undefined);
              return;
            }

            const contentBuffer = await vscode.workspace.fs.readFile(file);
            const contentString = Buffer.from(contentBuffer).toString("utf8");
            const contentLines = contentString.includes("\r\n")
              ? contentString.split("\r\n")
              : contentString.split("\n");
            const lineMetadata = {
              filePath: file.path,
              fileName: file.path.slice(file.path.lastIndexOf("/") + 1),
            };

            let matchesByFile = false;
            if (fileMatcher) {
              matchesByFile = fileMatcher(contentString, {
                ...lineMetadata,
                lines: contentLines,
              });
            }

            let matchesByLine: LineResults | undefined = undefined;
            if (
              lineMatcher &&
              (onlyTestLinesInMatchingFiles ? matchesByFile : true)
            ) {
              matchesByLine = {} as LineResults;
              for (let lineIx = 0; lineIx < contentLines.length; lineIx++) {
                const line = contentLines[lineIx];
                if (lineMatcher(line, lineMetadata)) {
                  matchesByLine[lineIx] = line.trim();
                }
              }
            }

            incrementCompletedFiles();
            resolve({
              file,
              fileName: getFileName(file),
              filePath: getFilePath(file),
              matchesByFile,
              matchesByLine,
            });
          }
        );

        promiseList.push(
          filePromise.then(
            (resolved) => {
              if (!resolved) {
                return resolved;
              }

              if (
                resolved.matchesByFile ||
                (resolved.matchesByLine &&
                  Object.keys(resolved.matchesByLine).length)
              ) {
                showResult(resolved);
              }

              return resolved;
            },
            (err) => {
              console.error(err);
              return {} as SearchResult;
            }
          )
        );
      }

      return Promise.all(promiseList);
    }
  );
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

function getFileName(file: vscode.Uri): string {
  const path = getFilePath(file);
  return path.slice(path.lastIndexOf("/") + 1);
}

function getFilePath(file: vscode.Uri): string {
  return file.authority + file.path;
}
