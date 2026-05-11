import { Suspense } from "react";
import { PackagesDirectory } from "../../components/packages-directory";
import { getPackageCatalogContent } from "../../lib/public-commerce-api";

export default async function PackagesPage() {
  const catalog = await getPackageCatalogContent();

  return (
    <Suspense fallback={null}>
      <PackagesDirectory categories={catalog.categories} products={catalog.products} />
    </Suspense>
  );
}
