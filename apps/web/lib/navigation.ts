import { buildPackagesPageHref, packageCategories } from "./package-catalog";

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

const packageMegaMenuColumns: readonly PublicMegaMenuColumn[] = packageCategories.map((category) => ({
  id: category.id,
  label: category.label,
  href: category.id === "in-person-coaching" ? "/yuz-yuze-kocluk" : buildPackagesPageHref(category.id),
  description: category.description,
  items: category.subcategories.map((subcategory) => ({
    id: subcategory.id,
    label: subcategory.label,
    href: buildPackagesPageHref(category.id, subcategory.id)
  }))
}));

// Keep these ids stable so admin-managed menu records can later override this tree cleanly.
export const publicNavigationItems: readonly PublicNavItem[] = [
  {
    id: "packages",
    label: "Paketlerimiz",
    href: "/paketlerimiz",
    megaMenuColumns: packageMegaMenuColumns
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
