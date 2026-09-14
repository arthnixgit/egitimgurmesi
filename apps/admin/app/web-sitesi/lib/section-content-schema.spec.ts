import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendPayloadItem,
  duplicatePayloadItem,
  getSectionListSpec,
  itemHeading,
  movePayloadItem,
  readPayloadItems,
  removePayloadItem,
  sectionListSpecs,
  updatePayloadItem,
  writePayloadItems
} from "./section-content-schema";
import type { AdminMarketingPageSection } from "../../../lib/auth-client";

function section(overrides: Partial<AdminMarketingPageSection> = {}): AdminMarketingPageSection {
  return { sectionKey: "home-videos", variantKey: "video-showcase", ...overrides };
}

describe("section content schema", () => {
  it("matches a spec by variant key, then by section key", () => {
    assert.equal(getSectionListSpec(section())?.payloadKey, "items");
    assert.equal(getSectionListSpec(section({ variantKey: null, sectionKey: "contact-cta" }))?.payloadKey, "actions");
    assert.equal(getSectionListSpec(section({ variantKey: "unknown-widget" })), null);
    assert.equal(getSectionListSpec(null), null);
  });

  it("reads items defensively and copies them out of the payload", () => {
    const spec = sectionListSpecs["video-showcase"];
    const source = section({ payload: { items: [{ title: "Ders" }, "junk", null] } });
    const items = readPayloadItems(source, spec);

    assert.equal(items.length, 1);
    items[0].title = "mutated";
    // Reading must not mutate the section payload in place; the builder relies
    // on new objects to drive its undo history.
    assert.equal((source.payload as { items: Array<{ title: string }> }).items[0].title, "Ders");
  });

  it("returns an empty list when the payload has no array", () => {
    const spec = sectionListSpecs["video-showcase"];

    assert.deepEqual(readPayloadItems(section({ payload: null }), spec), []);
    assert.deepEqual(readPayloadItems(section({ payload: { items: "nope" } }), spec), []);
  });

  it("writes items back while preserving unrelated payload keys", () => {
    const spec = sectionListSpecs["video-showcase"];
    const source = section({ payload: { items: [], anchorId: "videolar", style: { tone: "teal" } } });
    const next = writePayloadItems(source, spec, [{ title: "Yeni" }]);

    assert.equal(next.anchorId, "videolar");
    assert.deepEqual(next.style, { tone: "teal" });
    assert.deepEqual(next.items, [{ title: "Yeni" }]);
  });

  it("edits, moves, removes, appends and duplicates without mutating the input", () => {
    const spec = sectionListSpecs["video-showcase"];
    const items = [{ id: "a", title: "A" }, { id: "b", title: "B" }];

    assert.equal(updatePayloadItem(items, 0, "title", "Z")[0].title, "Z");
    assert.equal(items[0].title, "A");

    assert.deepEqual(movePayloadItem(items, 0, 1).map((item) => item.id), ["b", "a"]);
    assert.deepEqual(removePayloadItem(items, 0).map((item) => item.id), ["b"]);
    assert.equal(appendPayloadItem(items, spec).length, 3);
    assert.equal(duplicatePayloadItem(items, 0).length, 3);
    assert.equal(items.length, 2);
  });

  it("refuses to move an item off either end of the list", () => {
    const items = [{ id: "a" }, { id: "b" }];

    assert.deepEqual(movePayloadItem(items, 0, -1), items);
    assert.deepEqual(movePayloadItem(items, 1, 1), items);
    assert.deepEqual(movePayloadItem(items, 5, 1), items);
  });

  it("gives a duplicated item its own id so React keys stay unique", () => {
    const result = duplicatePayloadItem([{ id: "a", title: "A" }], 0);

    assert.notEqual(result[1].id, result[0].id);
  });

  it("labels a row by its heading field and falls back to a numbered noun", () => {
    const spec = sectionListSpecs["video-showcase"];

    assert.equal(itemHeading({ title: "  Ders  " }, spec, 0), "Ders");
    assert.equal(itemHeading({ title: "   " }, spec, 2), "Video kartı 3");
    assert.equal(itemHeading({}, spec, 0), "Video kartı 1");
  });

  it("keeps every schema field key aligned with a create template", () => {
    // A field the create template does not seed would render as an
    // uncontrolled input the moment an editor adds a row.
    for (const [variant, spec] of Object.entries(sectionListSpecs)) {
      const template = spec.createItem(0);

      for (const field of spec.fields) {
        assert.ok(field.key in template, `${variant}: ${field.key} missing from createItem`);
      }

      assert.ok(spec.fields.some((field) => field.key === spec.headingField), `${variant}: headingField not a field`);
    }
  });
});
