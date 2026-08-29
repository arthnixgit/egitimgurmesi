import type { HomeShowcaseSlide } from "@ega/ui";
import type {
  AdminFreeMaterialCategory,
  AdminFreeMaterialItem,
  AdminFreeMaterialsDocument,
  AdminMarketingPage,
  AdminMarketingPageSection,
  AdminNavigationItem,
  AdminNavigationMenu,
  AdminSiteSettings,
  AdminStaffProfilesDocument,
  AdminSuccessStoriesDocument,
  AdminWebsiteRevision
} from "../../../lib/auth-client";
import type { AdminMediaAsset, AdminMediaKind } from "../../../lib/media-client";

export type WebsiteArea =
  | "genel"
  | "marka"
  | "header"
  | "footer"
  | "sayfalar"
  | "ucretsiz-materyaller"
  | "akademik-kadro"
  | "basari-hikayeleri"
  | "medya"
  | "gecmis";

export type ResponsiveMode = "desktop" | "tablet" | "mobile";
export type LeftPanelMode = "sayfalar" | "bolumler" | "bilesenler";
export type InspectorTab = "icerik" | "tasarim" | "gelismis";
export type SaveAction = "draft" | "publish";
export type SectionField = "eyebrow" | "title" | "body" | "media" | "button";

export type StaffOverviewLike = {
  roleKeys: string[];
  permissionKeys: string[];
};

export type BuilderSnapshot = {
  settings: AdminSiteSettings;
  navigation: AdminNavigationMenu;
  pages: AdminMarketingPage[];
  materials: AdminFreeMaterialsDocument;
  staffProfiles: AdminStaffProfilesDocument;
  successStories: AdminSuccessStoriesDocument;
  selectedArea: WebsiteArea;
  selectedPageKey: string;
  selectedSectionKey: string;
  selectedMaterialKey: string;
  selectedMaterialSlug: string;
};

export type BuilderHistory = {
  past: BuilderSnapshot[];
  future: BuilderSnapshot[];
};

export type BuilderStatus = {
  isDirty: boolean;
  saving: boolean;
  areaLoading: boolean;
  lastSavedAt: string | null;
  message: string;
  error: string;
  previewTokenStatus: string;
};

export type WebsiteBuilderData = {
  settings: AdminSiteSettings;
  navigation: AdminNavigationMenu;
  pages: AdminMarketingPage[];
  materials: AdminFreeMaterialsDocument;
  staffProfiles: AdminStaffProfilesDocument;
  successStories: AdminSuccessStoriesDocument;
  revisions: AdminWebsiteRevision[];
};

export type WebsiteSelection = {
  selectedArea: WebsiteArea;
  selectedPageKey: string;
  selectedSectionKey: string;
  selectedMaterialKey: string;
  selectedMaterialSlug: string;
  responsiveMode: ResponsiveMode;
  leftPanelMode: LeftPanelMode;
  inspectorTab: InspectorTab;
  inlineField: SectionField | null;
  selectedSlideId: string | null;
};

export type MediaSelection = {
  value: string;
  asset?: AdminMediaAsset | null;
};

export type MediaFieldIntent = {
  kind: AdminMediaKind;
  label: string;
  description: string;
  recommendedDimensions?: string;
  recommendedAspectRatio?: string;
  fallbackUrl?: string;
  allowExternalUrl?: boolean;
};

export type SliderSettings = {
  autoplay: boolean;
  intervalMs: number;
  transition: "fade" | "slide";
  pauseOnHover: boolean;
  showArrows: boolean;
  showDots: boolean;
  keyboard: boolean;
  swipe: boolean;
  initialSlideId: string;
};

export type HomeSliderPayload = {
  slides: HomeShowcaseSlide[];
  settings: SliderSettings;
};

export type BuilderCommand =
  | { type: "select-area"; area: WebsiteArea }
  | { type: "select-page"; pageKey: string }
  | { type: "select-section"; sectionKey: string }
  | { type: "select-material-category"; categoryKey: string }
  | { type: "select-material-item"; slug: string }
  | { type: "set-responsive-mode"; mode: ResponsiveMode }
  | { type: "set-left-panel-mode"; mode: LeftPanelMode }
  | { type: "set-inspector-tab"; tab: InspectorTab }
  | { type: "set-inline-field"; field: SectionField | null }
  | { type: "set-slide"; slideId: string | null };

export type SectionMutation = (sections: AdminMarketingPageSection[]) => AdminMarketingPageSection[];

export type BuilderActions = {
  dispatchSelection: (command: BuilderCommand) => void;
  updateSetting: <K extends keyof AdminSiteSettings>(key: K, value: AdminSiteSettings[K]) => void;
  updateNavigationItem: (index: number, patch: Partial<AdminNavigationItem>) => void;
  addNavigationItem: () => void;
  updatePage: (patch: Partial<AdminMarketingPage>) => void;
  updateSection: (patch: Partial<AdminMarketingPageSection>) => void;
  updateSections: (mutation: SectionMutation, selectedSectionKey?: string) => void;
  insertWidget: (widgetKey: string, afterSectionKey?: string) => void;
  moveSection: (direction: -1 | 1) => void;
  moveSectionTo: (sectionKey: string, direction: -1 | 1) => void;
  duplicateSection: () => void;
  deleteSection: (sectionKey: string) => void;
  toggleSection: (sectionKey: string) => void;
  updateMaterialCategory: (patch: Partial<AdminFreeMaterialCategory>) => void;
  updateMaterialItem: (patch: Partial<AdminFreeMaterialItem>) => void;
  addMaterialCategory: () => void;
  addMaterialCard: () => void;
  duplicateMaterialCard: () => void;
  saveCurrent: (action: SaveAction) => Promise<void>;
  requestPreviewToken: () => Promise<void>;
  loadRevisions: () => Promise<void>;
  restoreRevision: (revisionId: string) => Promise<void>;
  undo: () => void;
  redo: () => void;
};
