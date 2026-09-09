import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeHomeSliderPayload } from "./section-registry";
import { validateSlider } from "./builder-validation";

const sliderSection = {
  sectionKey: "showcase-hero",
  variantKey: "showcase-hero",
  eyebrow: null,
  title: null,
  body: null,
  sortOrder: 10,
  isActive: true,
  publishStatus: "DRAFT" as const
};

describe("homepage slider contract", () => {
  it("keeps a successful managed empty slide list empty instead of restoring bundled slides", () => {
    const slider = normalizeHomeSliderPayload({ ...sliderSection, payload: { slides: [], settings: {} } });

    assert.deepEqual(slider.slides, []);
    assert.equal(validateSlider(slider.slides, slider.settings).ok, false);
  });

  it("uses bundled slides only when the structured slider payload is absent", () => {
    const slider = normalizeHomeSliderPayload({ ...sliderSection, payload: {} });

    assert.ok(slider.slides.length > 0);
    assert.equal(slider.settings.pauseOnHover, true);
    assert.equal(slider.settings.transition, "fade");
  });

  it("requires active slides to have title, media, alt text, and paired safe CTAs", () => {
    const result = validateSlider(
      [
        {
          id: "slide-1",
          label: "",
          title: "",
          description: "",
          tone: "teal",
          mediaType: "IMAGE",
          mediaUrl: "",
          mediaAlt: "",
          primaryCtaLabel: "İncele",
          primaryCtaHref: "javascript:alert(1)"
        }
      ],
      normalizeHomeSliderPayload({ ...sliderSection, payload: {} }).settings
    );

    assert.equal(result.ok, false);
    assert.ok(result.messages.some((message) => message.includes("başlığı")));
    assert.ok(result.messages.some((message) => message.includes("medya")));
    assert.ok(result.messages.some((message) => message.includes("güvenli")));
  });
});
