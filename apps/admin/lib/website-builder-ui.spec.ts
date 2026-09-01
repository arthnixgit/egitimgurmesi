import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  duplicatePageSection,
  normalizeHomeSliderPayload,
  resequenceSections,
  writeHomeSliderPayload
} from "../app/web-sitesi/lib/section-registry";
import { validateClientMediaFile } from "../app/web-sitesi/lib/builder-media";
import {
  getMediaUploadErrorMessage,
  shouldStartMediaUpload
} from "../app/web-sitesi/lib/builder-media";
import { emptyHistory, pushHistory, undoHistory } from "../app/web-sitesi/lib/builder-history";
import { createSectionFromWidget, getWidgetDefinition, widgetRegistry } from "../app/web-sitesi/lib/widget-registry";
import { validateSlider } from "../app/web-sitesi/lib/builder-validation";
import type { BuilderSnapshot } from "../app/web-sitesi/lib/builder-types";
import type { AdminMarketingPageSection } from "./auth-client";

describe("website builder section and widget registry", () => {
  it("exposes functional insertable widgets instead of static labels", () => {
    const insertable = widgetRegistry.filter((widget) => !widget.locked && !widget.dynamic);

    assert.ok(insertable.length > 8);
    assert.ok(insertable.every((widget) => createSectionFromWidget(widget.key, 10) !== null));

    const heading = getWidgetDefinition("heading");
    assert.ok(heading);

    const inserted = createSectionFromWidget(heading.key, 30);
    assert.ok(inserted);
    assert.equal(inserted.variantKey, "heading");
    assert.equal(inserted.sortOrder, 30);
    assert.equal(inserted.isActive, true);
    assert.equal(inserted.publishStatus, "DRAFT");
    assert.match(inserted.sectionKey, /^heading-/);
  });

  it("blocks locked dynamic widgets from being inserted into editable page payloads", () => {
    const packageDirectory = getWidgetDefinition("package-directory");

    assert.ok(packageDirectory);
    assert.equal(packageDirectory.locked, true);
    assert.equal(createSectionFromWidget(packageDirectory.key, 20), null);
  });

  it("preserves unknown payload fields when homepage slider content is rewritten", () => {
    const section = sectionWithPayload({
      customProductionFlag: true,
      slides: [
        {
          id: "slide_a",
          label: "Etiket",
          title: "Mevcut slide",
          description: "Aciklama",
          tone: "teal",
          mediaType: "IMAGE",
          mediaUrl: "/hero.jpg",
          isActive: true,
          sortOrder: 20
        }
      ],
      settings: {
        autoplay: true,
        intervalMs: 5000
      }
    });

    const normalized = normalizeHomeSliderPayload(section);
    const rewritten = writeHomeSliderPayload(section, {
      slides: normalized.slides,
      settings: {
        ...normalized.settings,
        intervalMs: 7000
      }
    });

    assert.equal(rewritten.payload?.customProductionFlag, true);
    assert.equal((rewritten.payload?.settings as { intervalMs: number }).intervalMs, 7000);
    assert.equal((rewritten.payload?.slides as unknown[]).length, 1);
  });

  it("duplicates and resequences sections without retaining a database id", () => {
    const original = {
      ...sectionWithPayload({ title: "Korunacak" }),
      id: "section_db_id"
    };
    const duplicated = duplicatePageSection(original, 40);

    assert.equal(duplicated.id, undefined);
    assert.notEqual(duplicated.sectionKey, original.sectionKey);
    assert.deepEqual(duplicated.payload, original.payload);

    const ordered = resequenceSections([duplicated, original]);
    assert.deepEqual(
      ordered.map((section) => section.sortOrder),
      [10, 20]
    );
  });
});

describe("website builder history and slider validation", () => {
  it("keeps section delete undoable before a draft is saved", () => {
    const before = snapshot(["hero", "cta"]);
    const after = snapshot(["hero"]);
    const history = pushHistory(emptyHistory, before);
    const undone = undoHistory(history, after);

    assert.ok(undone);
    assert.deepEqual(
      undone.snapshot.pages[0].sections.map((section) => section.sectionKey),
      ["hero", "cta"]
    );
    assert.equal(undone.history.past.length, 0);
    assert.equal(undone.history.future.length, 1);
  });

  it("validates homepage slider safety rules", () => {
    const emptyResult = validateSlider([], sliderSettings({ autoplay: true, intervalMs: 1000 }));
    assert.equal(emptyResult.ok, false);
    assert.equal(emptyResult.messages.some((message) => message.includes("aktif slide")), true);
    assert.equal(emptyResult.messages.some((message) => message.includes("15 saniye")), true);

    const duplicateResult = validateSlider(
      [
        {
          id: "dup",
          label: "A",
          title: "Baslik",
          description: "Aciklama",
          tone: "teal",
          mediaType: "IMAGE",
          mediaUrl: "/a.jpg",
          mediaAlt: "Alt",
          primaryCtaHref: "javascript:alert(1)"
        },
        {
          id: "dup",
          label: "B",
          title: "",
          description: "Aciklama",
          tone: "amber",
          mediaType: "IMAGE",
          mediaUrl: "/b.jpg",
          mediaAlt: "Alt"
        }
      ],
      sliderSettings({ autoplay: false, intervalMs: 5000, initialSlideId: "dup" })
    );
    assert.equal(duplicateResult.ok, false);
    assert.equal(duplicateResult.messages.some((message) => message.includes("tekrar")), true);
    assert.equal(duplicateResult.messages.some((message) => message.includes("zorunludur")), true);
    assert.equal(duplicateResult.messages.some((message) => message.includes("CTA hedefi")), true);
  });
});

describe("website builder client media validation", () => {
  it("rejects unsafe and oversized media before upload", () => {
    assert.equal(validateClientMediaFile(file("logo.svg", "image/svg+xml", 128), "BRANDING")?.includes("SVG"), true);
    assert.ok(validateClientMediaFile(file("logo.png", "image/png", 0), "BRANDING"));
    assert.equal(
      validateClientMediaFile(file("logo.png", "image/png", 26 * 1024 * 1024), "BRANDING")?.includes("Dosya"),
      true
    );
    assert.equal(
      validateClientMediaFile(file("document.exe", "application/octet-stream", 1024), "DOCUMENT")?.includes("desteklenmeyen"),
      true
    );
  });

  it("accepts supported website image and document candidates", () => {
    assert.equal(validateClientMediaFile(file("logo.webp", "image/webp", 4096), "BRANDING"), "");
    assert.equal(validateClientMediaFile(file("plan.pdf", "application/pdf", 4096), "DOCUMENT"), "");
  });

  it("keeps one upload active and preserves controlled upload error messages", () => {
    const logo = file("logo.png", "image/png", 4096);

    assert.equal(shouldStartMediaUpload(logo, false), true);
    assert.equal(shouldStartMediaUpload(logo, true), false);
    assert.equal(shouldStartMediaUpload(null, false), false);
    assert.equal(
      getMediaUploadErrorMessage(new Error("Medya depolama alanına yazma izni yok.")),
      "Medya depolama alanına yazma izni yok."
    );
    assert.equal(getMediaUploadErrorMessage("unknown"), "Dosya yüklenemedi.");
  });
});

function file(name: string, type: string, size: number) {
  return { name, type, size } as File;
}

function sectionWithPayload(payload: Record<string, unknown>): AdminMarketingPageSection {
  return {
    sectionKey: "showcase-hero",
    eyebrow: "Etiket",
    title: "Baslik",
    body: "Govde",
    variantKey: "hero",
    payload,
    sortOrder: 10,
    isActive: true,
    publishStatus: "PUBLISHED"
  };
}

function sliderSettings(overrides: Partial<Parameters<typeof validateSlider>[1]> = {}): Parameters<typeof validateSlider>[1] {
  return {
    autoplay: true,
    intervalMs: 5200,
    transition: "fade",
    pauseOnHover: true,
    showArrows: true,
    showDots: true,
    keyboard: true,
    swipe: true,
    initialSlideId: "showcase-plan",
    ...overrides
  };
}

function snapshot(sectionKeys: string[]): BuilderSnapshot {
  return {
    settings: {} as BuilderSnapshot["settings"],
    navigation: {} as BuilderSnapshot["navigation"],
    pages: [
      {
        id: "page_home",
        key: "home",
        slug: "home",
        title: "Ana Sayfa",
        pageType: "HOME",
        publishStatus: "PUBLISHED",
        sections: sectionKeys.map((sectionKey, index) => ({
          sectionKey,
          title: sectionKey,
          payload: {},
          sortOrder: (index + 1) * 10,
          isActive: true
        }))
      }
    ],
    materials: {} as BuilderSnapshot["materials"],
    staffProfiles: {} as BuilderSnapshot["staffProfiles"],
    successStories: {} as BuilderSnapshot["successStories"],
    selectedArea: "sayfalar",
    selectedPageKey: "home",
    selectedSectionKey: sectionKeys[0] ?? "",
    selectedMaterialKey: "",
    selectedMaterialSlug: ""
  } as BuilderSnapshot;
}
