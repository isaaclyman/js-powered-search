import * as vscode from "vscode";
import * as ts from "typescript";
import * as fs from "fs";
import * as requireFromString from "require-from-string";
import {
  FileSearchOptions,
  LineSearchOptions,
  SearchOptions,
} from "../resources/TEMPLATE";

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

interface FileResult {
  file: vscode.Uri;
  matchesByFile: boolean;
  matchesByLine: number[] | undefined;
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
  if (!searchDefinition.settings.includeNodeModules) {
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

  const matches = await vscode.window.withProgress(
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

      const promiseList: Promise<FileResult>[] = [];
      for (let fileIx = 0; fileIx < files.length; fileIx++) {
        const filePromise = new Promise<FileResult>(async (resolve, reject) => {
          const file = files[fileIx];
          const stat = await vscode.workspace.fs.stat(file);
          const exceedsMaxSize =
            maxFileSizeInKB && stat.size / 1000 > maxFileSizeInKB;
          if (cancelToken.isCancellationRequested || exceedsMaxSize) {
            incrementCompletedFiles();
            resolve({
              file,
              matchesByFile: false,
              matchesByLine: undefined,
            });
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

          let matchesByLine = undefined;
          if (
            lineMatcher &&
            (onlyTestLinesInMatchingFiles ? matchesByFile : true)
          ) {
            matchesByLine = [];
            for (let lineIx = 0; lineIx < contentLines.length; lineIx++) {
              const line = contentLines[lineIx];
              if (lineMatcher(line, lineMetadata)) {
                matchesByLine.push(lineIx);
              }
            }
          }

          incrementCompletedFiles();
          resolve({
            file,
            matchesByFile,
            matchesByLine,
          });
        });
        promiseList.push(filePromise);
      }

      return Promise.all(promiseList);
    }
  );

  if (!matches) {
    return;
  }

  const filteredMatches = matches.filter(
    (m) => m.matchesByFile || (m.matchesByLine && m.matchesByLine.length)
  );
  console.log(`Found ${filteredMatches.length} matching files.`);
  console.log(filteredMatches);
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
