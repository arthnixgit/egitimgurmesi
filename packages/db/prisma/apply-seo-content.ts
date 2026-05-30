import { PrismaClient } from "@prisma/client";
import { examCountdownPages, freeTools } from "../../../apps/web/lib/free-materials";

const prisma = new PrismaClient();

async function main() {
  await updateMarketingSections();
  await updateFreeMaterialLinks();
  await updateCountdownPages();
}

async function updateMarketingSections() {
  await prisma.marketingPageSection.updateMany({
    where: { sectionKey: "package-surface" },
    data: {
      eyebrow: "",
      title: "Sana En Uygun Paketi Seç",
      body: ""
    }
  });

  await prisma.marketingPageSection.updateMany({
    where: { sectionKey: "packages-directory-intro" },
    data: {
      eyebrow: "",
      title: "Sana En Uygun Paketi Seç",
      body: ""
    }
  });

  await prisma.marketingPage.updateMany({
    where: { slug: "hakkimizda" },
    data: {
      title: "Hakkımızda",
      excerpt: "Eğitim Gürmesi Akademi'nin koçluk, canlı ders ve öğrenci takip yaklaşımı.",
      description:
        "Eğitim Gürmesi Akademi; öğrencinin paket seçimini, koçluk takibini, canlı ders erişimini ve çalışma düzenini daha anlaşılır hale getiren bir hazırlık platformudur.",
      seoTitle: "Hakkımızda | Eğitim Gürmesi Akademi",
      seoDescription:
        "Eğitim Gürmesi Akademi'nin sınav hazırlığı, koçluk, canlı ders ve öğrenci takip yaklaşımını inceleyin."
    }
  });

  await prisma.marketingPageSection.updateMany({
    where: { sectionKey: "about-intro" },
    data: {
      eyebrow: "",
      title: "Eğitim Gürmesi Akademi hakkında",
      body:
        "Eğitim Gürmesi Akademi; öğrencinin paket seçimini, koçluk takibini, canlı ders erişimini ve çalışma düzenini daha anlaşılır hale getiren bir hazırlık platformudur."
    }
  });
}

async function updateFreeMaterialLinks() {
  await prisma.freeMaterialItem.updateMany({
    where: {
      itemType: "TOOL",
      href: "/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi"
    },
    data: {
      title: "2026 LGS'ye Kaç Gün Kaldı?",
      summary: "2026 LGS için sözel ve sayısal oturum saatlerini resmi takvime göre takip et.",
      buttonLabel: "LGS Sayacını Aç",
      opensInNewTab: false
    }
  });

  await prisma.freeMaterialItem.updateMany({
    where: {
      href: "https://www.eba.gov.tr/"
    },
    data: {
      title: "Maarif Simülasyonları",
      summary:
        "Fizik, kimya ve fen kazanımlarını etkileşimli simülasyonlarla görselleştirerek konu tekrarını güçlendir.",
      href: "/ucretsiz-materyaller/maarif-simulasyonlari",
      buttonLabel: "Simülasyon Rehberini Aç",
      opensInNewTab: false
    }
  });

  await prisma.freeMaterialItem.updateMany({
    where: {
      OR: [
        { title: "YKS Puan Hesapla" },
        { title: "Puan Hesapla" },
        { href: "/ucretsiz-materyaller/puan-hesaplama" }
      ]
    },
    data: {
      title: "Puan Hesapla",
      summary:
        "LGS, TYT, AYT ve YDT netlerini platform içinde hesapla; tahmini puanını ve ders bazlı netlerini gör.",
      href: "/ucretsiz-materyaller/puan-hesapla",
      buttonLabel: "Puan Hesapla",
      opensInNewTab: false
    }
  });

  await prisma.freeMaterialItem.updateMany({
    where: { title: "Blog" },
    data: {
      href: "/ucretsiz-materyaller/blog",
      buttonLabel: "Blogu Aç",
      opensInNewTab: false
    }
  });

  for (const item of freeTools) {
    if (!["Puan Hesapla", "YKS Atlas", "Maarif Simülasyonları"].includes(item.title)) {
      continue;
    }

    await prisma.freeMaterialItem.updateMany({
      where: { title: item.title },
      data: {
        summary: item.summary,
        href: item.href,
        buttonLabel: item.buttonLabel ?? null,
        opensInNewTab: item.opensInNewTab ?? false
      }
    });
  }
}

async function updateCountdownPages() {
  for (const page of examCountdownPages) {
    const savedPage = await prisma.countdownPage.upsert({
      where: { slug: page.slug },
      update: {
        eyebrow: page.eyebrow,
        title: page.title,
        description: page.description,
        updatedLabel: page.updatedLabel,
        videoTitle: page.videoTitle,
        videoNote: page.videoNote,
        publishStatus: "PUBLISHED"
      },
      create: {
        slug: page.slug,
        eyebrow: page.eyebrow,
        title: page.title,
        description: page.description,
        updatedLabel: page.updatedLabel,
        videoTitle: page.videoTitle,
        videoNote: page.videoNote,
        publishStatus: "PUBLISHED"
      }
    });

    await prisma.$transaction([
      prisma.countdownTarget.deleteMany({ where: { countdownPageId: savedPage.id } }),
      prisma.countdownOfficialLink.deleteMany({ where: { countdownPageId: savedPage.id } }),
      prisma.countdownArticleSection.deleteMany({ where: { countdownPageId: savedPage.id } })
    ]);

    if (page.countdowns.length > 0) {
      await prisma.countdownTarget.createMany({
        data: page.countdowns.map((target, index) => ({
          countdownPageId: savedPage.id,
          label: target.label,
          targetAt: target.targetIso ? new Date(target.targetIso) : null,
          dateLabel: target.dateLabel,
          note: target.note,
          sortOrder: (index + 1) * 10
        }))
      });
    }

    if (page.officialLinks.length > 0) {
      await prisma.countdownOfficialLink.createMany({
        data: page.officialLinks.map((link, index) => ({
          countdownPageId: savedPage.id,
          title: link.title,
          linkType: link.type,
          summary: link.summary,
          href: link.href,
          buttonLabel: link.buttonLabel ?? null,
          sortOrder: (index + 1) * 10
        }))
      });
    }

    if (page.articleSections.length > 0) {
      await prisma.countdownArticleSection.createMany({
        data: page.articleSections.map((section, index) => ({
          countdownPageId: savedPage.id,
          title: section.title,
          body: section.body,
          sortOrder: (index + 1) * 10
        }))
      });
    }
  }
}

main()
  .then(async () => {
    console.log("SEO content applied.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
