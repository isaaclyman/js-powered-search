import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as sinon from "sinon";
import {
  validateAndGetSearchDefinition,
  splitByLine,
} from "../../commands/search";

describe("Search logic", () => {
  const sandbox = sinon.createSandbox();

  it("validates a valid search definition", () => {
    const errorSpy = sandbox.stub(vscode.window, "showErrorMessage");
    const result = validateAndGetSearchDefinition({
      getSettings: () => ({}),
      searchByLine: () => ({}),
      searchByFile: () => ({}),
    });

    assert(!!result);
    assert(typeof result.settings === "object");
    assert(typeof result.searchByLine === "object");
    assert(typeof result.searchByFile === "object");

    assert(!errorSpy.called);
  });

  it("validates an invalid search definition", () => {
    const errorSpy = sandbox.stub(vscode.window, "showErrorMessage");
    const result = validateAndGetSearchDefinition({} as any);
    assert(!result);
    assert(errorSpy.called);
  });

  it("correctly splits files with CRLF eols into lines", () => {
    const testFile = `bob\r\nbob\r\n\\n\r\n\\\\n\r\n\\\\\\n\r\n\\r\\n\r\n\\\\r\\\\n\r\nbob\r\nalice\r\n\r\nbob`;
    const lines = splitByLine(testFile);

    assert.deepStrictEqual(lines, [
      "bob",
      "bob",
      "\\n",
      "\\\\n",
      "\\\\\\n",
      "\\r\\n",
      "\\\\r\\\\n",
      "bob",
      "alice",
      "",
      "bob",
    ]);
  });

  it("correctly splits files with LF eols into lines", () => {
    const testFile = `bob\nbob\n\\n\n\\\\n\n\\\\\\n\n\\r\\n\n\\\\r\\\\n\nbob\nalice\n\nbob`;
    const lines = splitByLine(testFile);

    assert.deepStrictEqual(lines, [
      "bob",
      "bob",
      "\\n",
      "\\\\n",
      "\\\\\\n",
      "\\r\\n",
      "\\\\r\\\\n",
      "bob",
      "alice",
      "",
      "bob",
    ]);
  });

  afterEach(() => {
    sandbox.restore();
  });
});
