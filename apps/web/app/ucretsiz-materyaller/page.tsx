import { PublicPageLayout } from "../../components/public-page-layout";
import {
  FreeMaterialsDirectoryShowcase,
  type FreeMaterialsDirectoryCategory
} from "../../components/free-materials-directory-showcase";
import { getFreeMaterialsContent } from "../../lib/public-content-api";
import type { ResourceLink } from "../../lib/free-materials";

function getActionLabel(item: ResourceLink) {
  return item.buttonLabel ?? (item.opensInNewTab || item.href.startsWith("http") ? "Sayfayı Aç" : "İçeriği Aç");
}

function filterDefinedLinks(items: Array<ResourceLink | null>) {
  return items.filter((item): item is ResourceLink => item !== null);
}

export default async function FreeMaterialsPage() {
  const { freeTools, usefulLinks, pdfDocuments, guidanceContent } = await getFreeMaterialsContent();

  const tytCountdownLink = freeTools.find((item) => item.countdownSlug === "tyt-kac-gun-kaldi") ?? null;
  const aytCountdownLink = freeTools.find((item) => item.countdownSlug === "ayt-kac-gun-kaldi") ?? null;
  const ydtCountdownLink = freeTools.find((item) => item.countdownSlug === "ydt-kac-gun-kaldi") ?? null;
  const lgsCountdownLink = freeTools.find((item) => item.countdownSlug === "2026-lgs-kac-gun-kaldi") ?? null;
  const yksScoreLink = freeTools.find((item) => item.title === "YKS Puan Hesapla") ?? null;
  const yksAtlasLink = freeTools.find((item) => item.title === "YKS Atlas") ?? null;
  const maarifSimulationLink = freeTools.find((item) => item.title.includes("Maarif")) ?? null;
  const blogLink = guidanceContent.find((item) => item.title === "Blog") ?? guidanceContent[0] ?? null;

  const yksLinks = filterDefinedLinks([tytCountdownLink, aytCountdownLink, ydtCountdownLink]);

  const categoryCandidates: Array<FreeMaterialsDirectoryCategory | null> = [
    {
      id: "turkiye-geneli-deneme",
      title: "Türkiye Geneli Deneme",
      badge: "Ücretsiz",
      summary:
        "TYT denemeni çöz, cevaplarını kontrol et, netlerini yorumla ve kazanım bazlı gelişim alanlarını gör.",
      href: "/ucretsiz-materyaller/turkiye-geneli-deneme",
      buttonLabel: "Deneme Sayfasını Aç",
      links: [],
      tone: "gold",
      previewLabel: "Türkiye Geneli"
    },
    yksLinks.length > 0
      ? {
          id: "yks-countdown",
          title: "YKS'ye kaç gün kaldı?",
          badge: "Ücretsiz",
          summary:
            "TYT, AYT ve YDT için ayrı sayaç sayfalarına geç; her oturumu kendi resmi tarih ve saatine göre takip et.",
          href: "/ucretsiz-materyaller/yks-kac-gun-kaldi",
          buttonLabel: "YKS Sayaçlarını Aç",
          links: yksLinks,
          tone: "amber",
          previewLabel: "YKS Sayaçları"
        }
      : null,
    lgsCountdownLink
      ? {
          id: "lgs-countdown",
          title: "LGS'ye kaç gün kaldı?",
          badge: "Ücretsiz",
          summary:
            "LGS tarihini, sözel-sayısal oturum saatlerini ve canlı geri sayımı tek sayfadan takip et.",
          href: lgsCountdownLink.href,
          buttonLabel: getActionLabel(lgsCountdownLink),
          links: [lgsCountdownLink],
          tone: "blue",
          previewLabel: "LGS Sayacı"
        }
      : null,
    yksScoreLink
      ? {
          id: "yks-score",
          title: "YKS puan hesapla",
          badge: "Ücretsiz",
          summary:
            "TYT, AYT ve OBP verilerini nasıl yorumlayacağını öğren; hedef bölüm için puan ve başarı sırası mantığını kavra.",
          href: yksScoreLink.href,
          buttonLabel: getActionLabel(yksScoreLink),
          opensInNewTab: yksScoreLink.opensInNewTab || yksScoreLink.href.startsWith("http"),
          links: [yksScoreLink],
          tone: "teal",
          previewLabel: "Puan Hesabı"
        }
      : null,
    yksAtlasLink
      ? {
          id: "yks-atlas",
          title: "YKS Atlas",
          badge: "Ücretsiz",
          summary:
            "Bölüm, üniversite, kontenjan ve başarı sırası araştırmasını resmi atlas verileriyle planla.",
          href: yksAtlasLink.href,
          buttonLabel: getActionLabel(yksAtlasLink),
          opensInNewTab: yksAtlasLink.opensInNewTab || yksAtlasLink.href.startsWith("http"),
          links: [yksAtlasLink],
          tone: "violet",
          previewLabel: "Atlas Verisi"
        }
      : null,
    maarifSimulationLink
      ? {
          id: "maarif-simulation",
          title: "Maarif simülasyon",
          badge: "Ücretsiz",
          summary:
            "Fizik, kimya ve fen kazanımlarını etkileşimli simülasyonlarla görselleştirerek konu tekrarını güçlendir.",
          href: maarifSimulationLink.href,
          buttonLabel: getActionLabel(maarifSimulationLink),
          opensInNewTab: maarifSimulationLink.opensInNewTab || maarifSimulationLink.href.startsWith("http"),
          links: [maarifSimulationLink],
          tone: "green",
          previewLabel: "Simülasyon"
        }
      : null,
    blogLink
      ? {
          id: "blog",
          title: "Blog",
          badge: "Ücretsiz",
          summary:
            "Motivasyon, çalışma planı, deneme analizi ve sınav düzeni üzerine rehber yazıları oku.",
          href: "/ucretsiz-materyaller/blog",
          buttonLabel: "Blogu Aç",
          links: [blogLink],
          tone: "orange",
          previewLabel: "Rehber Yazılar"
        }
      : null,
    {
      id: "useful-links",
      title: "Faydalı linkler",
      badge: "Ücretsiz",
      summary: "MEB, ÖSYM, ÖSYM AİS ve YÖK Atlas gibi temel resmi kaynaklara tek merkezden ulaş.",
      href: "/ucretsiz-materyaller/faydali-linkler",
      buttonLabel: "Bağlantıları Aç",
      links: usefulLinks,
      tone: "pink",
      previewLabel: "Resmi Bağlantılar"
    },
    {
      id: "pdf-documents",
      title: "PDF dokümanlar",
      badge: "Ücretsiz",
      summary: "Plan, tekrar, deneme analizi ve hedef takibi için hazırlanmış PDF içeriklerini incele.",
      href: "/ucretsiz-materyaller/pdf-dokumanlar",
      buttonLabel: "PDF Alanını Aç",
      links: pdfDocuments,
      tone: "navy",
      previewLabel: "PDF Arşivi"
    }
  ];

  const categories = categoryCandidates.filter(
    (category): category is FreeMaterialsDirectoryCategory => category !== null
  );

  return (
    <PublicPageLayout>
      <section className="ega-section ega-section--free-directory">
        <FreeMaterialsDirectoryShowcase categories={categories} />
      </section>
    </PublicPageLayout>
  );
}
