export type PublicNavLeaf = {
  id: string;
  label: string;
  href: string;
};

export type PublicMegaMenuColumn = {
  id: string;
  label: string;
  href: string;
  description?: string;
  items?: readonly PublicNavLeaf[];
};

export type PublicNavItem = {
  id: string;
  label: string;
  href: string;
  megaMenuColumns?: readonly PublicMegaMenuColumn[];
};

const coachingTracks: readonly PublicNavLeaf[] = [
  { id: "yks", label: "YKS", href: "#paketler" },
  { id: "lgs", label: "LGS", href: "#paketler" },
  { id: "grade-9-10", label: "9. ve 10. Sınıflar", href: "#paketler" },
  { id: "grade-11", label: "11. Sınıf", href: "#paketler" },
  { id: "kpss", label: "KPSS", href: "#paketler" }
] as const;

// Keep these ids stable so admin-managed menu records can later override this tree cleanly.
export const publicNavigationItems: readonly PublicNavItem[] = [
  {
    id: "packages",
    label: "Paketlerimiz",
    href: "#paketler",
    megaMenuColumns: [
      {
        id: "online-coaching",
        label: "Online Koçluk",
        href: "#paketler",
        items: coachingTracks
      },
      {
        id: "in-person-coaching",
        label: "Yüz Yüze Koçluk",
        href: "#paketler",
        items: coachingTracks
      },
      {
        id: "exam-camp",
        label: "Yazılı Kampı (Hazırlık)",
        href: "#paketler",
        items: [
          { id: "camp-content", label: "Kamp İçeriği", href: "#paketler" },
          { id: "prep-calendar", label: "Hazırlık Takvimi", href: "#paketler" }
        ]
      },
      {
        id: "private-lessons",
        label: "Özel Ders",
        href: "#paketler",
        items: [
          { id: "private-online", label: "Online", href: "#paketler" },
          { id: "private-in-person", label: "Yüz Yüze", href: "#paketler" }
        ]
      },
      {
        id: "mock-exam-club",
        label: "Deneme Kulübü",
        href: "#paketler",
        items: [
          { id: "printed-cargo", label: "Basılı Kargo", href: "#paketler" },
          { id: "real-location", label: "Gerçek Mekan", href: "#paketler" }
        ]
      },
      {
        id: "revision-camp",
        label: "Tekrar Kampı",
        href: "#paketler",
        items: [
          { id: "revision-flow", label: "Tekrar Planı", href: "#paketler" },
          { id: "closing-calendar", label: "Başvuru Takvimi", href: "#paketler" }
        ]
      }
    ]
  },
  {
    id: "coaches",
    label: "Akademik Kadro",
    href: "#neler-var"
  },
  {
    id: "success-stories",
    label: "Başarılarımız",
    href: "#neler-var"
  },
  {
    id: "free-materials",
    label: "Ücretsiz Materyaller",
    href: "#videolar"
  },
  {
    id: "about",
    label: "Hakkımızda",
    href: "#neler-var"
  }
] as const;
