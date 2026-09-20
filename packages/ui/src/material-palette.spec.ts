import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_MATERIAL_TONE,
  MATERIAL_TONES,
  MATERIAL_TONE_LABELS,
  MATERIAL_TONE_SWATCHES,
  isMaterialTone,
  readMaterialTone,
  resolveMaterialTone
} from "./material-palette";

describe("free material colour palette", () => {
  it("offers exactly the tones the API already accepts", () => {
    // normalizeTone() in admin-content.service.ts whitelists these nine and
    // coerces anything else to blue. Offering a tenth in the picker would let
    // an editor choose a colour that is silently thrown away on save.
    assert.deepEqual(
      [...MATERIAL_TONES].sort(),
      ["amber", "blue", "gold", "green", "navy", "orange", "pink", "teal", "violet"]
    );
  });

  it("has a Turkish label and a swatch for every tone", () => {
    for (const tone of MATERIAL_TONES) {
      assert.equal(typeof MATERIAL_TONE_LABELS[tone], "string");
      assert.match(MATERIAL_TONE_SWATCHES[tone], /^#[0-9a-f]{6}$/i);
    }

    assert.equal(Object.keys(MATERIAL_TONE_LABELS).length, MATERIAL_TONES.length);
    assert.equal(Object.keys(MATERIAL_TONE_SWATCHES).length, MATERIAL_TONES.length);
  });

  it("recognises a stored tone and rejects anything else", () => {
    assert.equal(isMaterialTone("violet"), true);
    for (const value of ["chartreuse", "", null, undefined, 3, {}]) {
      assert.equal(isMaterialTone(value), false);
    }
  });

  it("falls back to the API's own default for an unknown value", () => {
    assert.equal(readMaterialTone("nonsense"), DEFAULT_MATERIAL_TONE);
    assert.equal(readMaterialTone("teal"), "teal");
  });

  it("respects an explicit choice regardless of position", () => {
    assert.equal(resolveMaterialTone("pink", 0), "pink");
    assert.equal(resolveMaterialTone("pink", 5), "pink");
  });

  it("spreads unset cards across the palette rather than repeating one colour", () => {
    // Seeded content has no tone. Eight identical cards is the plain look the
    // customer is complaining about.
    const assigned = Array.from({ length: MATERIAL_TONES.length }, (_, index) => resolveMaterialTone(null, index));

    assert.equal(new Set(assigned).size, MATERIAL_TONES.length);
  });

  it("wraps past the end of the palette instead of failing", () => {
    assert.equal(resolveMaterialTone(undefined, MATERIAL_TONES.length), MATERIAL_TONES[0]);
    assert.equal(resolveMaterialTone(undefined, MATERIAL_TONES.length * 3 + 2), MATERIAL_TONES[2]);
  });
});
