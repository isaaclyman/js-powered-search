import * as vscode from "vscode";
import { getAllResults } from "./results";

export async function exportResults() {
  const results = getAllResults();
  if (!results.length) {
    vscode.window.showErrorMessage('No search results were found. Check the JSPS Results view.');
    return;
  }

  const document = await vscode.workspace.openTextDocument({
    language: "json",
  });

  const textEditor = await vscode.window.showTextDocument(document);
  textEditor.edit((edit) => {
    edit.insert(textEditor.document.lineAt(0).range.start, JSON.stringify(results, null, 2));
  });
  return;
}