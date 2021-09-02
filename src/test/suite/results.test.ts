import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { getFriendlyTime } from "../../commands/results";

describe("Results logic", () => {
  it("shows human-friendly time elapsed message", () => {
    assert.strictEqual(getFriendlyTime(12600), "12.60 seconds");
    assert.strictEqual(getFriendlyTime(243000), "4.05 minutes");
    assert.strictEqual(getFriendlyTime(5868000), "1.63 hours");
  });
});
