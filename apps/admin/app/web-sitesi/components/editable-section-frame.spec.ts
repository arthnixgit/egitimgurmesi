import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldActivateFrame } from "./editable-section-frame";

describe("section frame keyboard activation", () => {
  it("does not swallow a space typed into a nested field", () => {
    // The defect: the frame cancelled every Space and Enter that bubbled up
    // from the inline editors it wraps, so a heading could never contain more
    // than one word.
    assert.equal(shouldActivateFrame(" ", false), false);
    assert.equal(shouldActivateFrame("Enter", false), false);
  });

  it("still activates when the frame itself has focus", () => {
    assert.equal(shouldActivateFrame(" ", true), true);
    assert.equal(shouldActivateFrame("Enter", true), true);
  });

  it("ignores every other key", () => {
    for (const key of ["a", "Tab", "Escape", "ArrowDown", "Backspace"]) {
      assert.equal(shouldActivateFrame(key, true), false);
    }
  });
});
