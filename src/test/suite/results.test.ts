import * as assert from "node:assert";
import { getFriendlyTime } from "../../commands/results";

suite("Results logic", () => {
  test("shows human-friendly time elapsed message", () => {
    assert.strictEqual(getFriendlyTime(12600), "12.60 seconds");
    assert.strictEqual(getFriendlyTime(243000), "4.05 minutes");
    assert.strictEqual(getFriendlyTime(5868000), "1.63 hours");
  });
});
