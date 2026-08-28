import { Suspense } from "react";
import { WebsiteBuilderClient } from "./website-builder-client";

export default function WebsiteManagementPage() {
  return (
    <Suspense fallback={<div className="admin-empty-state">Web sitesi yönetimi yükleniyor...</div>}>
      <WebsiteBuilderClient />
    </Suspense>
  );
}
