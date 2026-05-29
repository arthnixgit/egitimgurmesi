import { Suspense } from "react";
import { PackagesDirectory } from "../../components/packages-directory";
import { getPackageCatalogContent } from "../../lib/public-commerce-api";
import { getMarketingPageContent } from "../../lib/public-content-api";

export default async function PackagesPage() {
  const [catalog, page] = await Promise.all([
    getPackageCatalogContent(),
    getMarketingPageContent("paketlerimiz")
  ]);
  const introSection =
    page?.sections.find((section) => section.sectionKey === "packages-directory-intro") ?? null;
  const ribbonSection =
    page?.sections.find((section) => section.sectionKey === "packages-guarantee-ribbon") ?? {
      id: "fallback-packages-guarantee-ribbon",
      sectionKey: "packages-guarantee-ribbon",
      eyebrow: "Güvence",
      title: "Memnun Kalmazsan %100 İade Garantisi Sağlıyoruz!",
      body: "",
      variantKey: "guarantee-ribbon",
      payload: {},
      sortOrder: 20,
      isActive: true
    };

  return (
    <Suspense fallback={null}>
      <PackagesDirectory
        categories={catalog.categories}
        products={catalog.products}
        introSection={introSection}
        ribbonSection={ribbonSection}
      />
    </Suspense>
  );
}
