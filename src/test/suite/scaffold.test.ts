import * as assert from "assert";
import * as sinon from "sinon";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { determineFilename } from "../../commands/scaffold";

describe("Scaffold logic", () => {
  const sandbox = sinon.createSandbox();

  it("chooses a correct initial filename", async () => {
    sandbox.stub(vscode.workspace, "findFiles").returns(Promise.resolve([]));
    const filename = await determineFilename(
      vscode.Uri.from({
        scheme: "fake",
      }),
      "_SearchDefinition*.jsps.ts"
    );

    assert.strictEqual(filename, "_SearchDefinition1.jsps.ts");
  });

  it("chooses a correct filename when files already exist", async () => {
    sandbox.stub(vscode.workspace, "findFiles").returns(
      Promise.resolve([
        vscode.Uri.from({
          scheme: "fake",
          path: "/root/folder/_SearchDefinition1.jsps.ts",
        }),
        vscode.Uri.from({
          scheme: "fake",
          path: "/root/folder/_SearchDefinition2.jsps.ts",
        }),
      ])
    );
    const filename = await determineFilename(
      vscode.Uri.from({
        scheme: "fake",
      }),
      "_SearchDefinition*.jsps.ts"
    );

    assert.strictEqual(filename, "_SearchDefinition3.jsps.ts");
  });

  afterEach(() => {
    sandbox.restore();
  });
});
