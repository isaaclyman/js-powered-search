import * as assert from "node:assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import { afterEach } from "mocha";
import {
  validateAndGetSearchDefinition,
  splitByLine,
  SearchDefinition,
  runPreliminaryTest,
  testFiles,
  SearchSuccessResult,
} from "../../commands/search";
import { TextEncoder } from "util";

suite("Search logic", () => {
  const sandbox = sinon.createSandbox();

  test("validates a valid search definition", () => {
    const errorSpy = sandbox.stub(vscode.window, "showErrorMessage");
    const result = validateAndGetSearchDefinition({
      getSettings: () => ({}),
      searchByLine: () => ({}),
      searchByFile: () => ({}),
    });

    assert.strictEqual(!!result, true);
    assert.strictEqual(typeof result!.settings === "object", true);
    assert.strictEqual(typeof result!.searchByLine === "object", true);
    assert.strictEqual(typeof result!.searchByFile === "object", true);

    assert.strictEqual(!errorSpy.called, true);
  });

  test("validates an invalid search definition", () => {
    const errorSpy = sandbox.stub(vscode.window, "showErrorMessage");
    const result = validateAndGetSearchDefinition({} as any);
    assert.strictEqual(!result, true);
    assert.strictEqual(errorSpy.called, true);
  });

  test("correctly splits files with CRLF eols into lines", () => {
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

  test("correctly splits files with LF eols into lines", () => {
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

  test("passes the preliminary test for a working search definition", async () => {
    const def: SearchDefinition = {
      settings: {},
      searchByLine: {},
      searchByFile: {
        doesFileMatchSearch: function () {
          return false;
        },
      },
    };

    sandbox.stub(vscode.workspace, "fs").value({
      stat: () =>
        Promise.resolve({
          size: 1,
        } as vscode.FileStat),
      readFile: () => Promise.resolve(new TextEncoder().encode("fake file")),
    });

    const result = await runPreliminaryTest(
      vscode.Uri.from({
        scheme: "fake",
      }),
      def
    );

    assert.strictEqual(!(result instanceof Error), true);
  });

  test("fails the preliminary test for a search definition that throws an error", async () => {
    const def: SearchDefinition = {
      settings: {},
      searchByLine: {},
      searchByFile: {
        doesFileMatchSearch: function () {
          throw new Error("fake bug");
        },
      },
    };

    sandbox.stub(vscode.workspace, "fs").value({
      stat: () =>
        Promise.resolve({
          size: 1,
        } as vscode.FileStat),
      readFile: () => Promise.resolve(new TextEncoder().encode("fake file")),
    });

    const result = await runPreliminaryTest(
      vscode.Uri.from({
        scheme: "fake",
      }),
      def
    );

    assert.strictEqual(result instanceof Error, true);
  });

  test("fails the preliminary test for a search definition that is too slow", async () => {
    const def: SearchDefinition = {
      settings: {
        matchTestingTimeoutInSeconds: 0.001,
      },
      searchByLine: {},
      searchByFile: {
        doesFileMatchSearch: function () {
          var start = Date.now();
          var end = start;
          while (end < start + 2) {
            end = Date.now();
          }
          return true;
        },
      },
    };

    sandbox.stub(vscode.workspace, "fs").value({
      stat: () =>
        Promise.resolve({
          size: 1,
        } as vscode.FileStat),
      readFile: () => Promise.resolve(new TextEncoder().encode("fake file")),
    });

    const result = await runPreliminaryTest(
      vscode.Uri.from({
        scheme: "fake",
      }),
      def
    );

    assert.strictEqual(result instanceof Error, true);
  });

  test("tests an array of files and returns results, even if one throws an error", async () => {
    const def: SearchDefinition = {
      settings: {},
      searchByLine: {
        doesLineMatchSearch: function (line) {
          if (line.includes("2")) {
            return false;
          }
          return true;
        },
      },
      searchByFile: {
        doesFileMatchSearch: function (file) {
          if (file.includes("3")) {
            throw new Error("fake bug");
          }
          if (file.includes("2")) {
            return false;
          }
          return true;
        },
      },
    };

    sandbox.stub(vscode.workspace, "fs").value({
      stat: () =>
        Promise.resolve({
          size: 1,
        } as vscode.FileStat),
      readFile: (uri: vscode.Uri) =>
        Promise.resolve(new TextEncoder().encode(uri.path)),
    });

    const callback = sinon.stub().returnsArg(0);
    const files = [1, 2, 3].map((num) =>
      vscode.Uri.from({ scheme: "fake", path: num.toString() })
    );
    const resultPromises = testFiles(
      files,
      def,
      new vscode.CancellationTokenSource().token,
      callback
    );
    const results = await Promise.all(resultPromises);

    assert.strictEqual(results.length, files.length);
    assert.strictEqual(callback.callCount, files.length);

    const [passed, failed, errored] = results;

    assert.strictEqual(
      !!passed && !(passed instanceof Error),
      true,
      `Expected success result, got ${passed}`
    );
    const passResult = passed as SearchSuccessResult;
    assert.strictEqual(
      !!(
        passResult.matchesByFile &&
        passResult.matchesByLine &&
        passResult.matchesByLine[0]
      ),
      true
    );
    assert.strictEqual(passResult.fileName === "1", true);
    assert.strictEqual(passResult.filePath === "1", true);

    assert.strictEqual(
      !!failed && !(failed instanceof Error),
      true,
      `Expected success result, got ${failed}`
    );
    const failResult = failed as SearchSuccessResult;
    assert.strictEqual(
      !failResult.matchesByFile &&
        (!failResult.matchesByLine ||
          !Object.keys(failResult.matchesByLine).length),
      true
    );

    assert.strictEqual(errored instanceof Error, true);
  });

  test("skips a file that is too large", async () => {
    const def: SearchDefinition = {
      settings: {},
      searchByLine: {
        doesLineMatchSearch: function () {
          return true;
        },
      },
      searchByFile: {
        doesFileMatchSearch: function () {
          return true;
        },
      },
    };

    sandbox.stub(vscode.workspace, "fs").value({
      stat: (file: vscode.Uri) => {
        let size = 1;
        if (file.path.includes("2")) {
          size = 2 * 1000 * 1000; // 2 MB
        }
        return Promise.resolve({
          size,
        } as vscode.FileStat);
      },
      readFile: (uri: vscode.Uri) =>
        Promise.resolve(new TextEncoder().encode(uri.path)),
    });

    const callback = sinon.stub().returnsArg(0);
    const files = [1, 2].map((num) =>
      vscode.Uri.from({ scheme: "fake", path: num.toString() })
    );
    const resultPromises = testFiles(
      files,
      def,
      new vscode.CancellationTokenSource().token,
      callback
    );
    const results = await Promise.all(resultPromises);

    assert.strictEqual(callback.callCount, files.length);

    const [passed, tooLarge] = results;

    assert.strictEqual(!!passed, true);
    assert.strictEqual(!tooLarge, true);
  });

  test("skips a file if a cancellation token is requested", async () => {
    const def: SearchDefinition = {
      settings: {},
      searchByLine: {
        doesLineMatchSearch: function () {
          return true;
        },
      },
      searchByFile: {
        doesFileMatchSearch: function () {
          return true;
        },
      },
    };

    sandbox.stub(vscode.workspace, "fs").value({
      stat: () =>
        Promise.resolve({
          size: 1,
        } as vscode.FileStat),
      readFile: (uri: vscode.Uri) =>
        Promise.resolve(new TextEncoder().encode(uri.path)),
    });

    const callback = sinon.stub().returnsArg(0);
    const files = [1, 2].map((num) =>
      vscode.Uri.from({ scheme: "fake", path: num.toString() })
    );

    const cancellation = new vscode.CancellationTokenSource();
    cancellation.cancel();

    const resultPromises = testFiles(files, def, cancellation.token, callback);
    const results = await Promise.all(resultPromises);

    assert.strictEqual(callback.callCount, files.length);

    const [cancelled, stillCancelled] = results;

    assert.strictEqual(!cancelled, true);
    assert.strictEqual(!stillCancelled, true);
  });

  afterEach(() => {
    sandbox.restore();
  });
});
