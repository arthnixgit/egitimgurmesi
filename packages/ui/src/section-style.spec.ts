import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_SECTION_STYLE,
  normalizeSectionAnchorId,
  readSectionAnchorId,
  readSectionStyle,
  sectionStyleProps
} from "./section-style";

describe("section design contract", () => {
  it("reads the choices the Tasarım tab writes", () => {
    assert.deepEqual(readSectionStyle({ style: { tone: "amber", align: "center", spacing: "relaxed" } }), {
      tone: "amber",
      align: "center",
      spacing: "relaxed"
    });
  });

  it("renders content authored before the contract exactly as before", () => {
    // Every existing section has no `style` key. Those must keep their
    // original appearance rather than silently shifting on deploy.
    for (const payload of [null, undefined, {}, { items: [] }, "nonsense", []]) {
      assert.deepEqual(readSectionStyle(payload), DEFAULT_SECTION_STYLE);
    }
  });

  it("falls back per field, so one bad value does not discard the others", () => {
    assert.deepEqual(readSectionStyle({ style: { tone: "chartreuse", align: "center", spacing: 7 } }), {
      tone: "teal",
      align: "center",
      spacing: "normal"
    });
  });

  it("ignores a style key that is not an object", () => {
    for (const style of ["amber", 3, [], null]) {
      assert.deepEqual(readSectionStyle({ style }), DEFAULT_SECTION_STYLE);
    }
  });

  it("emits the attributes the stylesheet is scoped to", () => {
    assert.deepEqual(sectionStyleProps({ style: { tone: "blue", align: "right", spacing: "tight" } }), {
      "data-ega-section": "",
      "data-tone": "blue",
      "data-align": "right",
      "data-spacing": "tight"
    });
  });

  it("never emits an id, so a hardcoded nav target cannot be overwritten", () => {
    // #paketler and #iletisim are linked from the site menu. A custom anchor is
    // rendered as an additional target rather than replacing them.
    assert.equal("id" in sectionStyleProps({ anchorId: "Paketler" }), false);
  });

  it("exposes a custom anchor separately", () => {
    assert.equal(readSectionAnchorId({ anchorId: "Paketler" }), "paketler");

    for (const anchorId of [null, undefined, "", "   ", "!!!", 42]) {
      assert.equal(readSectionAnchorId({ anchorId }), null);
    }
  });
});

describe("anchor id normalisation", () => {
  it("produces a value that is safe in a URL fragment", () => {
    assert.equal(normalizeSectionAnchorId("  spaced  out  "), "spaced-out");
    assert.equal(normalizeSectionAnchorId("keep_under-score"), "keep_under-score");
  });

  it("transliterates Turkish rather than eating the letters", () => {
    // Stripping them produced "cretsiz-materyaller" and "ba-ar-lar-m-z",
    // which is most headings on this site.
    assert.equal(normalizeSectionAnchorId("Ücretsiz Materyaller"), "ucretsiz-materyaller");
    assert.equal(normalizeSectionAnchorId("Başarılarımız"), "basarilarimiz");
    assert.equal(normalizeSectionAnchorId("Sıkça Sorulan Sorular"), "sikca-sorulan-sorular");
    assert.equal(normalizeSectionAnchorId("İletişim"), "iletisim");
    assert.equal(normalizeSectionAnchorId("Öğrenci Girişi"), "ogrenci-girisi");
  });

  it("returns null rather than an empty or punctuation-only id", () => {
    for (const value of ["", "   ", "---", "###", null, undefined, 12]) {
      assert.equal(normalizeSectionAnchorId(value), null);
    }
  });
});
