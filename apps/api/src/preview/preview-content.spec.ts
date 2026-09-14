import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergePreviewMarketingPage,
  mergePreviewSiteSettings,
  normalizePreviewSections
} from "./preview-content";

const publishedPage = {
  id: "page_1",
  key: "home",
  slug: "home",
  title: "Ana Sayfa",
  seoTitle: "Yayındaki SEO",
  sections: [{ sectionKey: "showcase-hero", title: "Yayındaki başlık", isActive: true, sortOrder: 10 }]
};

describe("preview content merging", () => {
  it("prefers draft fields and draft sections", () => {
    const merged = mergePreviewMarketingPage(publishedPage, {
      title: "Taslak Başlık",
      seoTitle: "Taslak SEO",
      sections: [{ sectionKey: "showcase-hero", title: "Taslak bölüm", sortOrder: 10 }]
    });

    assert.equal(merged.title, "Taslak Başlık");
    assert.equal(merged.seoTitle, "Taslak SEO");
    assert.equal(merged.id, "page_1", "identity fields stay from the published record");
    assert.equal((merged.sections as Array<{ title: string }>)[0].title, "Taslak bölüm");
    assert.equal(merged.isPreview, true);
  });

  it("keeps published content when the draft is unusable", () => {
    for (const draft of [null, undefined, "text", 42, []]) {
      assert.deepEqual(mergePreviewMarketingPage(publishedPage, draft), publishedPage);
    }
  });

  it("keeps published sections when the draft has no usable section list", () => {
    // An empty section array would otherwise render a blank page in preview,
    // which reads as "the editor broke the site".
    const merged = mergePreviewMarketingPage(publishedPage, { title: "T", sections: [] });

    assert.equal(merged.title, "T");
    assert.deepEqual(merged.sections, publishedPage.sections);
  });

  it("hides sections switched off in the editor", () => {
    const sections = normalizePreviewSections([
      { sectionKey: "a", sortOrder: 20, isActive: true },
      { sectionKey: "b", sortOrder: 10, isActive: false }
    ]);

    assert.equal(sections?.length, 1);
    assert.equal(sections?.[0].sectionKey, "a");
  });

  it("orders sections by sortOrder regardless of stored order", () => {
    const sections = normalizePreviewSections([
      { sectionKey: "third", sortOrder: 30 },
      { sectionKey: "first", sortOrder: 10 },
      { sectionKey: "second", sortOrder: 20 }
    ]);

    assert.deepEqual(sections?.map((section) => section.sectionKey), ["first", "second", "third"]);
  });

  it("survives malformed section entries", () => {
    const sections = normalizePreviewSections([null, "junk", 7, { sectionKey: "ok" }]);

    assert.equal(sections?.length, 1);
    assert.equal(sections?.[0].sectionKey, "ok");
    assert.equal(sections?.[0].payload, null);
    // A section with no sortOrder is numbered by its position among the
    // surviving entries, not its position in the raw array, so discarded junk
    // does not leave gaps in the ordering.
    assert.equal(sections?.[0].sortOrder, 10);
  });

  it("returns null for a non-array section value", () => {
    assert.equal(normalizePreviewSections(undefined), null);
    assert.equal(normalizePreviewSections({ items: [] }), null);
  });

  it("overlays site settings without leaking editor bookkeeping", () => {
    const merged = mergePreviewSiteSettings(
      { id: "site_1", key: "default", version: 4, siteName: "Yayın", supportPhone: "+900" },
      {
        id: "should-not-win",
        key: "should-not-win",
        version: 99,
        draftStatus: "DRAFT",
        hasDraft: true,
        revalidateRoutes: ["/"],
        siteName: "Taslak"
      }
    );

    assert.equal(merged.siteName, "Taslak");
    assert.equal(merged.id, "site_1");
    assert.equal(merged.key, "default");
    assert.equal(merged.version, 4);
    assert.equal("draftStatus" in merged, false);
    assert.equal("revalidateRoutes" in merged, false);
    assert.equal(merged.supportPhone, "+900", "fields absent from the draft stay published");
    assert.equal(merged.isPreview, true);
  });
});
