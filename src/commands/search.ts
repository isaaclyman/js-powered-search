import * as vscode from "vscode";
import ts from "typescript";
import requireFromString from "require-from-string";
import {
  FileSearchOptions,
  LineSearchOptions,
  SearchOptions,
} from "../resources/TEMPLATE";
import {
  finalizeResultsView,
  resetResultsView,
  showResult,
} from "./results";
import { performance } from "perf_hooks";

interface SearchDefinitionModule {
  getSettings: () => SearchOptions;
  searchByLine: () => LineSearchOptions;
  searchByFile: () => FileSearchOptions;
}

export interface SearchDefinition {
  settings: SearchOptions;
  searchByLine: LineSearchOptions;
  searchByFile: FileSearchOptions;
}

export interface LineResults {
  [lineNumber: number]: string;
}

export interface SearchSuccessResult {
  file: vscode.Uri;
  filePath: string;
  fileName: string;
  matchesByFile: boolean;
  matchesByLine: LineResults | undefined;
}

export type SearchResult = SearchSuccessResult | Error | undefined;

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
    return;
  }

  if (files.length > 500) {
    const confirm = await vscode.window.showWarningMessage(
      `The provided patterns matched ${files.length} files. Are you sure you want to continue with the search?`,
      "Cancel",
      "Search"
    );
    if (confirm !== "Search") {
      return;
    }
  }

  resetResultsView();

  if (files.length > 1) {
    const err = await runPreliminaryTest(
      files.shift()!,
      searchDefinition,
      (result) => {
        if (!result || result instanceof Error) {
          return result;
        }

        if (
          result.matchesByFile ||
          (result.matchesByLine && Object.keys(result.matchesByLine).length)
        ) {
          showResult(result);
        }

        return result;
      }
    );

    if (err instanceof Error) {
      console.error(err);
      const message = (err && err.message) || err.toString();
      const truncated =
        message.length <= 255 ? message : message.slice(0, 255) + "...";
      const confirm = await vscode.window.showErrorMessage(
        `One or both matchers failed on the first file tested. Error: "${truncated}". Do you want to continue the search anyway?`,
        "Cancel",
        "Search"
      );
      if (confirm !== "Search") {
        return;
      }
    }
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Searching with the full power of JavaScript...",
      cancellable: true,
    },
    (progress, cancelToken) => {
      const progressStepSize = Math.floor(files.length / 25) || 1;
      let completedFiles = 0;

      const filePromises = testFiles(
        files,
        searchDefinition,
        cancelToken,
        (result) => {
          completedFiles++;

          if (completedFiles % progressStepSize === 0) {
            progress.report({
              increment: (completedFiles / files.length) * 100,
            });
          }

          if (!result || result instanceof Error) {
            return result;
          }

          if (
            result.matchesByFile ||
            (result.matchesByLine && Object.keys(result.matchesByLine).length)
          ) {
            showResult(result);
          }

          return result;
        }
      );
      return Promise.all(filePromises);
    }
  );

  finalizeResultsView();
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

export function validateAndGetSearchDefinition(
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

async function getFileAsText(file: vscode.Uri): Promise<string> {
  const contentBuffer = await vscode.workspace.fs.readFile(file);
  const contentString = Buffer.from(contentBuffer).toString("utf8");
  return contentString;
}

export function splitByLine(multilineString: string): string[] {
  return multilineString.includes("\r\n")
    ? multilineString.split("\r\n")
    : multilineString.split("\n");
}

export async function runPreliminaryTest(
  file: vscode.Uri,
  searchDefinition: SearchDefinition,
  onComplete?: (result: SearchResult) => SearchResult
): Promise<SearchResult> {
  const testTimeout =
    typeof searchDefinition.settings.matchTestingTimeoutInSeconds === "number"
      ? searchDefinition.settings.matchTestingTimeoutInSeconds
      : 5;

  return new Promise((resolve) => {
    const startTime = performance.now();

    testFiles(
      [file],
      searchDefinition,
      new vscode.CancellationTokenSource().token,
      onComplete
    )[0].then((result) => {
      const endTime = performance.now();

      if (testTimeout && endTime - startTime > testTimeout * 1000) {
        resolve(
          new Error(
            `Matchers took more than ${testTimeout} seconds on a single file.`
          )
        );
        return;
      }

      resolve(result);
      return;
    });
  });
}

export function testFiles(
  files: vscode.Uri[],
  searchDefinition: SearchDefinition,
  cancelToken: vscode.CancellationToken,
  onComplete?: (result: SearchResult) => SearchResult
): Thenable<SearchResult>[] {
  const maxFileSizeInKB =
    typeof searchDefinition.settings.maxFileSizeInKB === "number"
      ? searchDefinition.settings.maxFileSizeInKB
      : 1000;
  const fileMatcher = searchDefinition.searchByFile.doesFileMatchSearch;
  const lineMatcher = searchDefinition.searchByLine.doesLineMatchSearch;
  const onlyTestLinesInMatchingFiles =
    searchDefinition.settings.onlyTestLinesInMatchingFiles || false;

  const promiseList: Thenable<SearchResult>[] = [];
  for (let fileIx = 0; fileIx < files.length; fileIx++) {
    const file = files[fileIx];
    const fileName = getFileName(file);
    const filePath = getFilePath(file);

    const filePromise: Thenable<SearchResult> = vscode.workspace.fs
      .stat(file)
      .then<SearchResult>((stat) => {
        const exceedsMaxSize =
          maxFileSizeInKB && stat.size / 1000 > maxFileSizeInKB;
        if (cancelToken.isCancellationRequested || exceedsMaxSize) {
          return undefined;
        }

        if (!fileMatcher && !lineMatcher) {
          return {
            file,
            fileName,
            filePath,
            matchesByFile: true,
            matchesByLine: undefined,
          };
        }

        return getFileAsText(file).then((contentString): SearchResult => {
          const contentLines = splitByLine(contentString);
          const lineMetadata = {
            filePath,
            fileName,
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
              if (
                lineMatcher(line, {
                  ...lineMetadata,
                  previousLine: lineIx > 0 ? contentLines[lineIx - 1] : null,
                  nextLine: lineIx < (contentLines.length - 1) ? contentLines[lineIx + 1] : null
                })
              ) {
                matchesByLine[lineIx] = line.trim();
              }
            }
          }

          return {
            file,
            fileName,
            filePath,
            matchesByFile,
            matchesByLine,
          } as SearchSuccessResult;
        });
      })
      .then<SearchResult, Error>(
        (resolved) => resolved,
        (err): Error => {
          console.error(err);
          return err;
        }
      )
      .then<SearchResult>((completed) => {
        if (typeof onComplete !== "function") {
          return completed;
        }

        return onComplete(completed);
      });

    promiseList.push(filePromise);
  }

  return promiseList;
}
