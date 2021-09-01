import * as vscode from "vscode";
import * as ts from "typescript";
import * as requireFromString from "require-from-string";

export function executeSearch() {
  const activeFile = vscode.window.activeTextEditor;
  if (!activeFile) {
    vscode.window.showErrorMessage("No text editor is active.");
    return;
  }

  const fileContents = activeFile.document.getText();

  const transpiled = transpileFile(fileContents);
  if (!transpiled) {
    vscode.window.showErrorMessage(
      "Unable to compile this search definition file. Check for syntax errors."
    );
    return;
  }

  const dynamicModule = tryRequire(transpiled.outputText);
  console.log(dynamicModule);
}

function transpileFile(fileContents: string): ts.TranspileOutput | undefined {
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
