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
