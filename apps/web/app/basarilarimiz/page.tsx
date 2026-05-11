import { PublicPageLayout } from "../../components/public-page-layout";
import { SuccessShowcase } from "../../components/success-showcase";
import { getSuccessStories } from "../../lib/public-content-api";

export default async function SuccessPage() {
  const stories = await getSuccessStories();

  return (
    <PublicPageLayout>
      <SuccessShowcase stories={stories} />
    </PublicPageLayout>
  );
}
