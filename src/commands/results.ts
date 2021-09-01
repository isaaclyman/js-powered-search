import * as vscode from "vscode";
import { SearchResult } from "./search";

export class JSPSResult extends vscode.TreeItem {
  constructor(
    public readonly type: "file" | "line",
    public readonly searchResult: SearchResult,
    public readonly label: string,
    public readonly filePathOrFullLine: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly lineNumber: number = 0
  ) {
    super(label, collapsibleState);
    this.tooltip = filePathOrFullLine;
    this.contextValue = "result";
    this.command = {
      title: "Jump to file",
      command: "vscode.open",
      arguments: [
        this.searchResult.file,
        {
          preview: true,
          selection: new vscode.Range(lineNumber, 0, lineNumber, 0),
        } as vscode.TextDocumentShowOptions,
      ],
    };
    this.resourceUri = type === "file" ? searchResult.file : undefined;
    this.iconPath = type === "file" ? vscode.ThemeIcon.File : undefined;
  }
}

export class JSPSResultsProvider
  implements vscode.TreeDataProvider<JSPSResult>
{
  public results: SearchResult[] = [];
  public tree: vscode.TreeView<JSPSResult> | undefined;

  private _onDidChangeTreeData: vscode.EventEmitter<JSPSResult | undefined> =
    new vscode.EventEmitter<JSPSResult | undefined>();
  readonly onDidChangeTreeData: vscode.Event<JSPSResult | undefined> =
    this._onDidChangeTreeData.event;

  constructor() {}

  refresh(result: JSPSResult | undefined = undefined) {
    this._onDidChangeTreeData.fire(result);
  }

  getTreeItem(element: JSPSResult): vscode.TreeItem {
    return element;
  }

  getChildren(element?: JSPSResult): Promise<JSPSResult[]> {
    if (!element) {
      if (this.tree) {
        this.tree.message = `${this.results.length} files found`;
      }
      return Promise.resolve(
        this.results.map(
          (result) =>
            new JSPSResult(
              "file",
              result,
              result.fileName,
              result.filePath,
              result.matchesByLine && Object.keys(result.matchesByLine).length
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
            )
        )
      );
    }

    if (element.type === "line" || !element.searchResult.matchesByLine) {
      return Promise.resolve([]);
    }

    const children = [] as JSPSResult[];
    for (const lineIx in element.searchResult.matchesByLine) {
      const result = element.searchResult;
      const lineText = element.searchResult.matchesByLine![lineIx];
      children.push(
        new JSPSResult(
          "line",
          result,
          `${Number(lineIx) + 1}: ${lineText}`,
          lineText,
          vscode.TreeItemCollapsibleState.None,
          Number(lineIx)
        )
      );
    }
    return Promise.resolve(children);
  }
}

const resultsProvider = new JSPSResultsProvider();
resultsProvider.tree = vscode.window.createTreeView("jsPoweredSearchResults", {
  treeDataProvider: resultsProvider,
});

vscode.commands.registerCommand(
  "jsPoweredSearch.dismissResult",
  (result: JSPSResult) => {
    if (result.type === "file") {
      const ix = resultsProvider.results.indexOf(result.searchResult);
      if (ix < 0) {
        console.error("Index of node to dismiss not found.");
        return;
      }
      resultsProvider.results.splice(ix, 1);
      resultsProvider.refresh();
    } else {
      const lines = result.searchResult.matchesByLine;
      if (!lines) {
        console.error("Indicated file has no lines.");
        return;
      }

      if (typeof lines[result.lineNumber] !== "string") {
        console.error(
          `Line number ${result.lineNumber} does not exist on indicated file.`
        );
        return;
      }
      delete lines[result.lineNumber];
      resultsProvider.refresh();
    }
  }
);

export function initializeResultsView() {
  if (resultsProvider) {
    resultsProvider.results = [];
    resultsProvider.refresh();
  }

  vscode.commands.executeCommand("jsPoweredSearchResults.focus");
}

export function showResult(result: SearchResult) {
  if (!resultsProvider) {
    return;
  }

  resultsProvider.results.push(result);
  resultsProvider.refresh();
}
