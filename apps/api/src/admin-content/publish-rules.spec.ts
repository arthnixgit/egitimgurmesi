import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException } from "@nestjs/common";
import { ContentStatus } from "@ega/db";
import { assertPublishableStaffProfiles, assertPublishableSuccessStories } from "./admin-content.service";

const story = (patch: Record<string, unknown> = {}) =>
  ({ slug: "ayse", studentName: "Ayşe", resultTitle: "492,5", highlight: "", ...patch }) as never;

describe("success story publish rules", () => {
  it("publishes a score-only card with a report photo and no filler text", () => {
    assert.doesNotThrow(() =>
      assertPublishableSuccessStories({ stories: [story({ scoreReportImageUrl: "https://x/y.jpg" })] } as never)
    );
  });

  it("names the card that is missing its score, drafts included (publish promotes them)", () => {
    assert.throws(
      () =>
        assertPublishableSuccessStories({
          stories: [story({ resultTitle: "", publishStatus: ContentStatus.DRAFT })]
        } as never),
      (error: unknown) => error instanceof BadRequestException && /"Ayşe"/.test(error.message)
    );
  });

  it("ignores archived stories", () => {
    assert.doesNotThrow(() =>
      assertPublishableSuccessStories({
        stories: [story({ studentName: "", publishStatus: ContentStatus.ARCHIVED })]
      } as never)
    );
  });
});

describe("academic staff publish rules", () => {
  const group = (profiles: unknown[], patch: Record<string, unknown> = {}) =>
    ({ key: "koclar", label: "Koçlarımız", profiles, ...patch }) as never;

  it("rejects a visible person without a title and names them", () => {
    assert.throws(
      () => assertPublishableStaffProfiles({ groups: [group([{ slug: "a", fullName: "Ali Veli", title: "" }])] } as never),
      (error: unknown) => error instanceof BadRequestException && /Ali Veli/.test(error.message)
    );
  });

  it("allows hidden people and hidden groups to be incomplete", () => {
    assert.doesNotThrow(() =>
      assertPublishableStaffProfiles({
        groups: [
          group([{ slug: "a", fullName: "", title: "", publishStatus: ContentStatus.ARCHIVED }]),
          group([], { key: "eski", label: "", publishStatus: ContentStatus.ARCHIVED })
        ]
      } as never)
    );
  });
});
