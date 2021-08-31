import * as vscode from "vscode";

export async function scaffoldSearchDefinition() {
  const fileOptions = {
    temporary: "Use a new (unsaved) text document",
    newFile: "Create a new file at the project root",
    overwrite: "Overwrite this file",
  };

  const chooseFileOption = await vscode.window.showQuickPick(
    [fileOptions.temporary, fileOptions.newFile, fileOptions.overwrite],
    {
      title: "Scaffold new search definition file",
      canPickMany: false,
    }
  );

  if (!chooseFileOption) {
    return;
  }

  let fileToUse: vscode.TextDocument;
  switch (chooseFileOption) {
    case fileOptions.temporary:
      fileToUse = await vscode.workspace.openTextDocument({
        language: "typescript",
        content: "SCAFFOLD",
      });
      break;
    case fileOptions.newFile:
      const openFolders = vscode.workspace.workspaceFolders;
      if (!openFolders || !openFolders.length) {
        vscode.window.showErrorMessage("No folders are currently open.");
        return;
      }

      let projectRoot: vscode.Uri;
      if (openFolders.length === 1) {
        projectRoot = openFolders[0].uri;
      } else {
        const chosenRoot = await chooseWorkspaceFolder(openFolders);
        if (!chosenRoot) {
          return;
        }
        projectRoot = chosenRoot;
      }

      const template = "_SearchDefinition*.jsps.ts";
      const fileName = await determineFilename(projectRoot, template);
      fileToUse = await vscode.workspace.openTextDocument(
        projectRoot.with({
          scheme: "untitled",
          path: projectRoot.path + `/${fileName}`,
        })
      );
      break;
    case fileOptions.overwrite:
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        vscode.window.showErrorMessage("No active text editor was found.");
        return;
      }
      fileToUse = activeEditor.document;
      break;
    default:
      vscode.window.showErrorMessage("Option not recognized.");
      console.error(
        `scaffold.ts: fileOption "${chooseFileOption}" was not handled.`
      );
      return;
  }
}

async function chooseWorkspaceFolder(
  workspaceFolders: readonly vscode.WorkspaceFolder[]
): Promise<vscode.Uri | undefined> {
  const chosenFolderName = await vscode.window.showQuickPick(
    workspaceFolders.map((f) => f.name),
    {
      placeHolder: "Choose a project root",
      canPickMany: false,
    }
  );

  if (!chosenFolderName) {
    return undefined;
  }

  const chosenFolder = workspaceFolders.find(
    (f) => f.name === chosenFolderName
  );
  if (!chosenFolder) {
    vscode.window.showErrorMessage(
      `Couldn't find the workspace matching that name.`
    );
    return undefined;
  }

  return chosenFolder.uri;
}

async function determineFilename(
  projectRoot: vscode.Uri,
  template: string
): Promise<string> {
  const existingFiles = await vscode.workspace.findFiles(
    new vscode.RelativePattern(projectRoot, template)
  );
  if (!existingFiles.length) {
    return template.replace("*", "1");
  }

  const fileNames = existingFiles.map((f) =>
    f.path.slice(f.path.lastIndexOf("/") + 1)
  );
  const prefix = template.slice(0, template.indexOf("*"));
  const fileNumbers = fileNames
    .map((name) => name.slice(prefix.length, name.indexOf(".")))
    .map((num) => Number(num))
    .filter((num) => !isNaN(num) && isFinite(num));
  const maxFileNumber = Math.max(...fileNumbers);
  return template.replace("*", (maxFileNumber + 1).toString());
}
