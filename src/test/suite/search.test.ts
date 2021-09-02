import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as sinon from "sinon";
import { validateAndGetSearchDefinition } from "../../commands/search";

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

  afterEach(() => {
    sandbox.restore();
  });
});
