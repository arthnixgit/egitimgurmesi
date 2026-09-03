"use client";

import type { Dispatch, SetStateAction } from "react";
import type {
  AdminFreeMaterialCategory,
  AdminFreeMaterialItem,
  AdminMarketingPage,
  AdminMarketingPageSection,
  AdminStaffProfilesDocument,
  AdminSuccessStoriesDocument
} from "../../../lib/auth-client";
import type {
  BuilderActions,
  BuilderStatus,
  WebsiteArea,
  WebsiteBuilderData,
  WebsiteSelection
} from "../lib/builder-types";
import { BuilderCanvas } from "./builder-canvas";
import { BuilderInspector } from "./builder-inspector";
import { BuilderLeftPanel } from "./builder-left-panel";
import { FreeMaterialEditor } from "./free-material-editor";
import { BuilderToolbar } from "./builder-toolbar";

export function WebsiteBuilderShell({
  areas,
  data,
  selection,
  status,
  canManage,
  canPublish,
  canUndo,
  canRedo,
  isBranchAdmin,
  currentPage,
  currentSection,
  currentMaterialCategory,
  currentMaterialItem,
  setStaffProfiles,
  setSuccessStories,
  actions
}: {
  areas: Array<{ key: WebsiteArea; label: string; description: string }>;
  data: WebsiteBuilderData;
  selection: WebsiteSelection;
  status: BuilderStatus;
  canManage: boolean;
  canPublish: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isBranchAdmin: boolean;
  currentPage: AdminMarketingPage | null;
  currentSection: AdminMarketingPageSection | null;
  currentMaterialCategory: AdminFreeMaterialCategory | null;
  currentMaterialItem: AdminFreeMaterialItem | null;
  setStaffProfiles: Dispatch<SetStateAction<AdminStaffProfilesDocument>>;
  setSuccessStories: Dispatch<SetStateAction<AdminSuccessStoriesDocument>>;
  actions: BuilderActions;
}) {
  const selectedAreaLabel =
    areas.find((area) => area.key === selection.selectedArea)?.label ?? "Web Sitesi Yönetimi";

  return (
    <main className="admin-page-shell admin-website-builder admin-website-builder--visual">
      <section className="admin-page-hero admin-website-builder__hero">
        <div>
          <span className="admin-page-eyebrow">Web Sitesi</span>
          <h1>Web Sitesi Yönetimi</h1>
          <p>
            Sayfalar, bileşenler, medya, footer, ücretsiz materyaller ve revizyon akışı görsel bir
            düzenleme yüzeyinde yönetilir.
          </p>
          {isBranchAdmin ? (
            <p className="admin-website-builder__global-warning" role="status">
              Bu alanda yapılan değişiklikler tüm genel web sitesini etkiler.
            </p>
          ) : null}
        </div>
      </section>

      <BuilderToolbar
        pages={data.pages}
        selection={selection}
        status={status}
        selectedAreaLabel={selectedAreaLabel}
        canManage={canManage}
        canPublish={canPublish}
        canUndo={canUndo}
        canRedo={canRedo}
        actions={actions}
      />

      {status.error ? <div className="admin-alert admin-alert--danger" role="alert">{status.error}</div> : null}
      {status.message ? <div className="admin-alert admin-alert--success" role="status">{status.message}</div> : null}
      {status.previewTokenStatus ? <div className="admin-alert" role="status">{status.previewTokenStatus}</div> : null}

      {selection.selectedArea === "ucretsiz-materyaller" ? (
        <section className="admin-website-builder__materials-shell" data-mode={selection.responsiveMode}>
          <BuilderLeftPanel areas={areas} pages={data.pages} selection={selection} actions={actions} />
          <FreeMaterialEditor
            materials={data.materials}
            selectedCategory={currentMaterialCategory}
            selectedItem={currentMaterialItem}
            actions={actions}
          />
        </section>
      ) : (
        <section className="admin-website-builder__layout" data-mode={selection.responsiveMode}>
          <BuilderLeftPanel areas={areas} pages={data.pages} selection={selection} actions={actions} />
          <BuilderCanvas
            selectedArea={selection.selectedArea}
            selection={selection}
            settings={data.settings}
            navigation={data.navigation}
            currentPage={currentPage}
            currentSection={currentSection}
            materials={data.materials}
            currentMaterialCategory={currentMaterialCategory}
            currentMaterialItem={currentMaterialItem}
            staffProfiles={data.staffProfiles}
            successStories={data.successStories}
            areaLoading={status.areaLoading}
            actions={actions}
          />
          <BuilderInspector
            data={data}
            selection={selection}
            status={status}
            currentPage={currentPage}
            currentSection={currentSection}
            setStaffProfiles={setStaffProfiles}
            setSuccessStories={setSuccessStories}
            actions={actions}
          />
        </section>
      )}
    </main>
  );
}
