import { FreeMaterialsHub, type FreeHubCard } from "../../components/free-materials-hub";
import {
  FREE_MATERIALS_UNAVAILABLE_MESSAGE,
  FreeMaterialsState
} from "../../components/free-materials-state";
import { PublicPageLayout } from "../../components/public-page-layout";
import type { ResourceLink } from "../../lib/free-materials";
import { flattenMaterials } from "../../lib/material-column";
import { getFreeMaterialsContent } from "../../lib/public-content-api";
import { scoreCalculatorBasePath, scoreCalculatorLinks } from "../../lib/score-calculators";

const DEFAULT_MATERIALS_SUMMARY =
  "Çalışma planları, tekrar çizelgeleri, deneme analiz formları ve daha fazlası. Tüm materyallerimizi ücretsiz indirebilirsin.";

const yksCountdownLinks: readonly ResourceLink[] = [
  { title: "TYT Sayacı", type: "Sayaç", summary: "", href: "/ucretsiz-materyaller/tyt-kac-gun-kaldi" },
  { title: "AYT Sayacı", type: "Sayaç", summary: "", href: "/ucretsiz-materyaller/ayt-kac-gun-kaldi" },
  { title: "YDT Sayacı", type: "Sayaç", summary: "", href: "/ucretsiz-materyaller/ydt-kac-gun-kaldi" }
];

/**
 * Ücretsiz Materyaller: ten tool cards around a preview (the page's original
 * design), with the admin-managed download cards revealed on demand by the
 * "Ücretsiz PDF Materyaller" card.
 *
 * The tool cards link to pages that exist in this app, so they do not depend
 * on any database rows — only the download cards come from the admin panel.
 */
export default async function FreeMaterialsPage() {
  const content = await getFreeMaterialsContent();
  const materials = content.status === "unavailable" ? [] : flattenMaterials(content.categories);
  // The materials card's text is editable: it is the description of the
  // "pdf-documents" category in the admin's Ücretsiz Materyaller editor.
  const materialsSummary =
    content.status === "unavailable"
      ? DEFAULT_MATERIALS_SUMMARY
      : content.categories.find((category) => category.key === "pdf-documents")?.description?.trim() ||
        DEFAULT_MATERIALS_SUMMARY;

  const cards: FreeHubCard[] = [
    // Left column
    {
      id: "turkiye-geneli-deneme",
      title: "Türkiye Geneli Deneme",
      badge: "Ücretsiz",
      summary: "TYT denemeni çöz, cevaplarını kontrol et, netlerini yorumla ve kazanım bazlı gelişim alanlarını gör.",
      href: "/ucretsiz-materyaller/turkiye-geneli-deneme",
      buttonLabel: "Deneme Sayfasını Aç",
      tone: "gold",
      previewLabel: "Türkiye Geneli"
    },
    {
      id: "yks-countdown",
      title: "YKS'ye kaç gün kaldı?",
      badge: "Sayaç",
      summary: "TYT, AYT ve YDT için ayrı sayaç sayfalarına geç; her oturumu kendi resmi tarih ve saatine göre takip et.",
      href: "/ucretsiz-materyaller/yks-kac-gun-kaldi",
      buttonLabel: "YKS Sayaçlarını Aç",
      optionGroups: [{ title: "YKS Sayaçları", items: yksCountdownLinks }],
      tone: "amber",
      previewLabel: "YKS Sayaçları"
    },
    {
      id: "lgs-countdown",
      title: "LGS'ye kaç gün kaldı?",
      badge: "Sayaç",
      summary: "LGS tarihini, sözel-sayısal oturum saatlerini ve canlı geri sayımı tek sayfadan takip et.",
      href: "/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi",
      buttonLabel: "LGS Sayacını Aç",
      tone: "blue",
      previewLabel: "LGS Sayacı"
    },
    {
      id: "yks-score",
      title: "YKS Puan Hesapla",
      badge: "Hesaplayıcı",
      summary: "TYT, AYT ve YDT netlerini platform içinde hesapla; tahmini puanını ve ders bazlı netlerini gör.",
      href: scoreCalculatorBasePath,
      buttonLabel: "Hesaplayıcıyı Aç",
      optionGroups: [
        { title: "YKS Puan Hesapla", items: scoreCalculatorLinks.filter((item) => item.type === "YKS") }
      ],
      tone: "teal",
      previewLabel: "YKS Puan Hesabı"
    },
    {
      id: "lgs-score",
      title: "LGS Puan Hesapla",
      badge: "Hesaplayıcı",
      summary: "Sözel ve sayısal oturum netlerini gir, LGS için tahmini puanını hesapla.",
      href: scoreCalculatorLinks.find((item) => item.type === "LGS")?.href ?? scoreCalculatorBasePath,
      buttonLabel: "LGS Puanını Hesapla",
      tone: "pink",
      previewLabel: "LGS Puan Hesabı"
    },
    // Right column
    {
      id: "free-materials",
      title: "Ücretsiz PDF Materyaller",
      badge: "İndir",
      summary: materialsSummary,
      buttonLabel: "Materyalleri İndir",
      revealsMaterials: true,
      tone: "navy",
      previewLabel: "PDF Arşivi"
    },
    {
      id: "yks-atlas",
      title: "YKS Atlas",
      badge: "Ücretsiz",
      summary: "Bölüm, üniversite, kontenjan ve başarı sırası araştırmasını resmi atlas verileriyle planla.",
      href: "/ucretsiz-materyaller/yks-atlas",
      buttonLabel: "Atlas Rehberini Aç",
      tone: "violet",
      previewLabel: "Atlas Verisi"
    },
    {
      id: "maarif-simulation",
      title: "Maarif Simülasyonları",
      badge: "Ücretsiz",
      summary: "Fizik, kimya ve fen kazanımlarını etkileşimli simülasyonlarla görselleştirerek konu tekrarını güçlendir.",
      href: "/ucretsiz-materyaller/maarif-simulasyonlari",
      buttonLabel: "Simülasyonları Aç",
      tone: "green",
      previewLabel: "Simülasyon"
    },
    {
      id: "blog",
      title: "Blog",
      badge: "Rehber",
      summary: "Motivasyon, çalışma planı, deneme analizi ve sınav düzeni üzerine rehber yazıları oku.",
      href: "/ucretsiz-materyaller/blog",
      buttonLabel: "Blogu Aç",
      tone: "orange",
      previewLabel: "Rehber Yazılar"
    },
    {
      id: "useful-links",
      title: "Faydalı Linkler",
      badge: "Ücretsiz",
      summary: "MEB, ÖSYM, ÖSYM AİS ve YÖK Atlas gibi temel resmi kaynaklara tek merkezden ulaş.",
      href: "/ucretsiz-materyaller/faydali-linkler",
      buttonLabel: "Bağlantıları Aç",
      tone: "gold",
      previewLabel: "Resmi Bağlantılar"
    }
  ];

  return (
    <PublicPageLayout>
      <section className="ega-section ega-section--free-directory">
        <FreeMaterialsHub cards={cards} materials={materials} />
        {content.status === "unavailable" ? (
          <div className="ega-container">
            <FreeMaterialsState title="Ücretsiz PDF Materyaller" message={FREE_MATERIALS_UNAVAILABLE_MESSAGE} />
          </div>
        ) : null}
      </section>
    </PublicPageLayout>
  );
}
