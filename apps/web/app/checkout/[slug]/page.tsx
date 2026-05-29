import { notFound } from "next/navigation";
import { PublicPageLayout } from "../../../components/public-page-layout";
import { CheckoutFlow } from "../../../components/checkout-flow";
import { getPackageCatalogContent, getPackageProductBySlug } from "../../../lib/public-commerce-api";

export async function generateStaticParams() {
  const catalog = await getPackageCatalogContent();

  return catalog.products.map((product) => ({
    slug: product.slug
  }));
}

export default async function CheckoutPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPackageProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <PublicPageLayout>
      <CheckoutFlow product={product} />
    </PublicPageLayout>
  );
}
