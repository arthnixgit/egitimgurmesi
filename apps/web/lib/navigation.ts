export type PublicNavLeaf = {
  id: string;
  label: string;
  href: string;
  target?: string;
};

export type PublicMegaMenuColumn = {
  id: string;
  label: string;
  href: string;
  description?: string;
  target?: string;
  items?: readonly PublicNavLeaf[];
};

export type PublicNavItem = {
  id: string;
  label: string;
  href: string;
  target?: string;
  megaMenuColumns?: readonly PublicMegaMenuColumn[];
};

export type PublicNavigationSnapshot = {
  key: string;
  enabled: boolean;
  version: number;
  generatedAt: string;
  source?: "database" | "fallback" | "disabled";
  catalogStatus?: "ready" | "unavailable";
  items: readonly PublicNavItem[];
};

// Keep these ids stable so admin-managed menu records can later override this tree cleanly.
export const publicNavigationItems: readonly PublicNavItem[] = [
  {
    id: "packages",
    label: "Paketlerimiz",
    href: "/paketlerimiz"
  },
  {
    id: "coaches",
    label: "Akademik Kadro",
    href: "/akademik-kadro"
  },
  {
    id: "success-stories",
    label: "Başarılarımız",
    href: "/basarilarimiz"
  },
  {
    id: "free-materials",
    label: "Ücretsiz Materyaller",
    href: "/ucretsiz-materyaller"
  },
  {
    id: "about",
    label: "Hakkımızda",
    href: "/hakkimizda"
  }
] as const;

export function createFallbackNavigationSnapshot(
  overrides: Partial<PublicNavigationSnapshot> = {}
): PublicNavigationSnapshot {
  return {
    key: "primary",
    enabled: true,
    version: 1,
    generatedAt: new Date(0).toISOString(),
    source: "fallback",
    items: publicNavigationItems,
    ...overrides
  };
}

export const fallbackNavigationSnapshot = createFallbackNavigationSnapshot();

export function isValidNavigationSnapshot(snapshot: PublicNavigationSnapshot) {
  if (!snapshot.enabled) {
    return true;
  }

  return validateNavigationItems(snapshot.items) === null;
}

export function validateNavigationItems(items: readonly PublicNavItem[]) {
  if (!Array.isArray(items)) {
    return "items-not-array";
  }

  if (items.length === 0) {
    return "empty-active-navigation";
  }

  const seenIds = new Set<string>();

  for (const item of items) {
    const invalidItem = validateNavItem(item, seenIds);
    if (invalidItem) {
      return invalidItem;
    }
  }

  return null;
}

export function navigationSnapshotFingerprint(snapshot: PublicNavigationSnapshot) {
  return JSON.stringify({
    key: snapshot.key,
    enabled: snapshot.enabled,
    version: snapshot.version,
    source: snapshot.source,
    catalogStatus: snapshot.catalogStatus,
    items: snapshot.items
  });
}

function validateNavItem(item: PublicNavItem, seenIds: Set<string>) {
  if (!isNonEmptyText(item.id)) {
    return "empty-item-key";
  }

  if (seenIds.has(item.id)) {
    return "duplicate-item-key";
  }
  seenIds.add(item.id);

  if (!isNonEmptyText(item.label)) {
    return "empty-item-label";
  }

  if (!isSafeHref(item.href)) {
    return "unsafe-item-href";
  }

  if (!item.megaMenuColumns) {
    return null;
  }

  if (!Array.isArray(item.megaMenuColumns)) {
    return "invalid-children-array";
  }

  for (const column of item.megaMenuColumns) {
    const invalidColumn = validateMegaColumn(column, seenIds);
    if (invalidColumn) {
      return invalidColumn;
    }
  }

  return null;
}

function validateMegaColumn(column: PublicMegaMenuColumn, seenIds: Set<string>) {
  if (!isNonEmptyText(column.id)) {
    return "empty-child-key";
  }

  if (seenIds.has(column.id)) {
    return "duplicate-item-key";
  }
  seenIds.add(column.id);

  if (!isNonEmptyText(column.label)) {
    return "empty-child-label";
  }

  if (!isSafeHref(column.href)) {
    return "unsafe-child-href";
  }

  if (!column.items) {
    return null;
  }

  if (!Array.isArray(column.items)) {
    return "invalid-children-array";
  }

  for (const leaf of column.items) {
    const invalidLeaf = validateNavLeaf(leaf, seenIds);
    if (invalidLeaf) {
      return invalidLeaf;
    }
  }

  return null;
}

function validateNavLeaf(leaf: PublicNavLeaf, seenIds: Set<string>) {
  if (!isNonEmptyText(leaf.id)) {
    return "empty-leaf-key";
  }

  if (seenIds.has(leaf.id)) {
    return "duplicate-item-key";
  }
  seenIds.add(leaf.id);

  if (!isNonEmptyText(leaf.label)) {
    return "empty-leaf-label";
  }

  if (!isSafeHref(leaf.href)) {
    return "unsafe-leaf-href";
  }

  return null;
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSafeHref(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return !/[\u0000-\u001f]/.test(value);
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
