import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { flattenMaterials, splitIntoColumns } from "./material-column";

const category = (label: string, titles: string[]) => ({
  label,
  items: titles.map((title) => ({ title, type: "PDF", summary: "", href: "#" }))
});

describe("free materials column", () => {
  it("puts every material from every category into one list", () => {
    const flat = flattenMaterials([
      category("PDF Dökümanlar", ["TYT Çizelge", "AYT Çizelge"]),
      category("Faydalı Linkler", ["ÖSYM"])
    ]);

    assert.deepEqual(
      flat.map((item) => item.title),
      ["TYT Çizelge", "AYT Çizelge", "ÖSYM"]
    );
  });

  it("keeps the category on each material, so grouping survives the flattening", () => {
    const flat = flattenMaterials([category("PDF Dökümanlar", ["TYT Çizelge"])]);

    assert.equal(flat[0]?.categoryLabel, "PDF Dökümanlar");
  });

  it("preserves the order the admin panel sorted into", () => {
    // Category order then item order — both are editor-controlled sort fields,
    // so reordering in the panel has to carry through to the column.
    const flat = flattenMaterials([category("B", ["b1", "b2"]), category("A", ["a1"])]);

    assert.deepEqual(
      flat.map((item) => item.title),
      ["b1", "b2", "a1"]
    );
  });

  it("skips categories that have no published materials", () => {
    const flat = flattenMaterials([category("Boş", []), category("Dolu", ["x"])]);

    assert.equal(flat.length, 1);
    assert.equal(flat[0]?.categoryLabel, "Dolu");
  });

  it("returns an empty list rather than throwing when there is nothing to show", () => {
    assert.deepEqual(flattenMaterials([]), []);
  });
});

describe("two column split", () => {
  it("divides fourteen materials into seven and seven", () => {
    const { left, right } = splitIntoColumns(Array.from({ length: 14 }, (_, i) => i));

    assert.equal(left.length, 7);
    assert.equal(right.length, 7);
  });

  it("gives the extra card to the left column when the count is odd", () => {
    const { left, right } = splitIntoColumns([1, 2, 3, 4, 5]);

    assert.deepEqual(left, [1, 2, 3]);
    assert.deepEqual(right, [4, 5]);
  });

  it("keeps reading order down the left column and then the right", () => {
    // Not interleaved: the editor's ordering has to stay legible.
    const { left, right } = splitIntoColumns(["a", "b", "c", "d"]);

    assert.deepEqual(left, ["a", "b"]);
    assert.deepEqual(right, ["c", "d"]);
  });

  it("handles a single material and an empty list without an empty column crashing", () => {
    assert.deepEqual(splitIntoColumns(["only"]), { left: ["only"], right: [] });
    assert.deepEqual(splitIntoColumns([]), { left: [], right: [] });
  });
});
