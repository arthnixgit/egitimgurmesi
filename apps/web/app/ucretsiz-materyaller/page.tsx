import { SectionHeading } from "@ega/ui";
import { FreeMaterialsExplorer } from "../../components/free-materials-explorer";
import {
  FREE_MATERIALS_EMPTY_MESSAGE,
  FREE_MATERIALS_UNAVAILABLE_MESSAGE,
  FreeMaterialsState
} from "../../components/free-materials-state";
import { PublicPageLayout } from "../../components/public-page-layout";
import { flattenMaterials } from "../../lib/material-column";
import { getFreeMaterialsContent } from "../../lib/public-content-api";

/**
 * Every published material as one column of colour-coded rows, with the detail
 * — summary, file information and the download link — in a pane beside it.
 *
 * The page previously listed categories, so reaching a single PDF took two
 * clicks and the materials themselves were never visible at a glance. This is
 * the layout the page originally had, restored at the customer's request and
 * built on the same band-and-stage shape as the homepage feature section.
 */
export default async function FreeMaterialsPage() {
  const content = await getFreeMaterialsContent();

  if (content.status === "unavailable") {
    return (
      <PublicPageLayout>
        <section className="ega-section ega-container">
          <FreeMaterialsState title="Ücretsiz Materyaller" message={FREE_MATERIALS_UNAVAILABLE_MESSAGE} />
        </section>
      </PublicPageLayout>
    );
  }

  const materials = flattenMaterials(content.categories);

  if (materials.length === 0) {
    return (
      <PublicPageLayout>
        <section className="ega-section ega-container">
          <FreeMaterialsState title="Ücretsiz Materyaller" message={FREE_MATERIALS_EMPTY_MESSAGE} />
        </section>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout>
      <section className="ega-section ega-container">
        <SectionHeading
          eyebrow="Ücretsiz"
          title="Ücretsiz Materyaller"
          description="Bir materyal seç; özeti, dosya bilgisi ve indirme bağlantısı yanında açılır."
        />

        <FreeMaterialsExplorer materials={materials} />
      </section>
    </PublicPageLayout>
  );
}
