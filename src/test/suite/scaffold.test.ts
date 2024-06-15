import * as assert from "node:assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import {afterEach} from 'mocha';
import { determineFilename } from "../../commands/scaffold";

suite("Scaffold logic", () => {
  const sandbox = sinon.createSandbox();

  test("chooses a correct initial filename", async () => {
    sandbox.stub(vscode.workspace, "findFiles").returns(Promise.resolve([]));
    const filename = await determineFilename(
      vscode.Uri.from({
        scheme: "fake",
      }),
      "_SearchDefinition*.jsps.ts"
    );

    assert.strictEqual(filename, "_SearchDefinition1.jsps.ts");
  });

  test("chooses a correct filename when files already exist", async () => {
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
