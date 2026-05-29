import {
  ContentStatus,
  EnrollmentStatus,
  LessonResourceType,
  LessonType,
  PrismaClient,
  VideoAssetStatus,
  VideoProvider
} from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_USER_EMAIL =
  process.env.LMS_DEMO_USER_EMAIL ?? "ogrenci+20260507132143@example.com";

type CourseBlueprint = {
  productSlug: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  estimatedDurationMinutes: number;
  modules: Array<{
    title: string;
    description: string;
    sortOrder: number;
    lessons: Array<{
      slug: string;
      title: string;
      description: string;
      lessonType: LessonType;
      sortOrder: number;
      isPreview?: boolean;
      durationSeconds: number;
      videoTitle?: string;
      resources?: Array<{
        title: string;
        resourceType: LessonResourceType;
        externalUrl: string;
        sortOrder: number;
      }>;
    }>;
  }>;
};

const courseBlueprints: CourseBlueprint[] = [
  {
    productSlug: "yazili-kampi-icerik-paketi",
    slug: "yazili-kampi-ders-arsivi",
    title: "Yazılı Kampı Ders Arşivi",
    shortDescription:
      "Kamp boyunca video, tekrar ve görev akışını tek kursta toplayan ders alanı.",
    description:
      "Bu kurs; kamp videoları, günlük tekrar düzeni ve destek kaynaklarını tek öğrenci panelinde bir araya getirir.",
    estimatedDurationMinutes: 420,
    modules: [
      {
        title: "Kampa Giriş ve Tempo Kurulumu",
        description: "İlk günlerde ritim kurmayı sağlayan açılış blokları.",
        sortOrder: 10,
        lessons: [
          {
            slug: "kamp-acilis-plani",
            title: "Kamp Açılış Planı",
            description:
              "İlk gün görev dizilimi ve çalışma bloklarının nasıl oturacağını anlatan açılış videosu.",
            lessonType: LessonType.VIDEO,
            sortOrder: 10,
            isPreview: true,
            durationSeconds: 1100,
            videoTitle: "Kamp Açılış Planı",
            resources: [
              {
                title: "Kamp Takvim PDF",
                resourceType: LessonResourceType.LINK,
                externalUrl: "/ucretsiz-materyaller/2026-yks-kac-gun-kaldi",
                sortOrder: 10
              }
            ]
          },
          {
            slug: "kamp-ilk-tekrar-duzeni",
            title: "İlk Tekrar Düzeni",
            description:
              "İlk hafta tekrar kartlarının hangi sırayla yürütüleceğini gösteren doküman.",
            lessonType: LessonType.DOCUMENT,
            sortOrder: 20,
            durationSeconds: 720
          }
        ]
      },
      {
        title: "Haftalık Takip ve Görev Raporları",
        description: "Hafta içi ritim bozulmadan görevlerin tamamlanması için rapor akışı.",
        sortOrder: 20,
        lessons: [
          {
            slug: "haftalik-gorev-kontrolu",
            title: "Haftalık Görev Kontrolü",
            description: "Haftalık görevlerin nasıl kapatılacağını anlatan ders.",
            lessonType: LessonType.VIDEO,
            sortOrder: 10,
            durationSeconds: 930,
            videoTitle: "Haftalık Görev Kontrolü"
          },
          {
            slug: "deneme-sonrasi-toparlama",
            title: "Deneme Sonrası Toparlama",
            description:
              "Deneme sonrası yanlışların nasıl sınıflandırılacağını anlatan görev sayfası.",
            lessonType: LessonType.ASSIGNMENT,
            sortOrder: 20,
            durationSeconds: 540,
            resources: [
              {
                title: "Deneme Analiz Şablonu",
                resourceType: LessonResourceType.LINK,
                externalUrl: "/ucretsiz-materyaller",
                sortOrder: 10
              }
            ]
          }
        ]
      }
    ]
  },
  {
    productSlug: "tekrar-kampi-plani",
    slug: "tekrar-kampi-hizli-kapanis",
    title: "Tekrar Kampı Hızlı Kapanış",
    shortDescription:
      "Kısa sürede konu kapatmaya odaklanan tekrar modülleri ve sprint dersleri.",
    description:
      "Tekrar kampı kursu; hızlandırılmış konu tekrarı, kısa video dersler ve günlük kapanış kontrol listeleri içerir.",
    estimatedDurationMinutes: 300,
    modules: [
      {
        title: "Sprint Tekrar Blokları",
        description: "Kısa süreli yoğun tekrar blokları.",
        sortOrder: 10,
        lessons: [
          {
            slug: "sprint-planlama",
            title: "Sprint Planlama",
            description: "Hangi konuda hangi sırayla ilerleyeceğini belirleyen açılış videosu.",
            lessonType: LessonType.VIDEO,
            sortOrder: 10,
            isPreview: true,
            durationSeconds: 780,
            videoTitle: "Sprint Planlama"
          },
          {
            slug: "tek-sayfa-kapanis",
            title: "Tek Sayfa Kapanış",
            description:
              "Her günün sonunda hangi başlıkların yeniden işaretleneceğini anlatan doküman.",
            lessonType: LessonType.DOCUMENT,
            sortOrder: 20,
            durationSeconds: 360
          }
        ]
      },
      {
        title: "Kontrol ve Sınav Yaklaşımı",
        description: "Kamp sonunda konuların sınav pratiğine çevrilmesi.",
        sortOrder: 20,
        lessons: [
          {
            slug: "yanlis-defteri-kurulumu",
            title: "Yanlış Defteri Kurulumu",
            description:
              "Eksik ve yanlış konuların tek yerde nasıl tutulacağını gösteren ders.",
            lessonType: LessonType.VIDEO,
            sortOrder: 10,
            durationSeconds: 840,
            videoTitle: "Yanlış Defteri Kurulumu"
          }
        ]
      }
    ]
  },
  {
    productSlug: "deneme-kulubu-basili-kargo",
    slug: "deneme-analiz-kutuphanesi",
    title: "Deneme Analiz Kütüphanesi",
    shortDescription:
      "Deneme sonuçlarını yorumlamak ve haftalık hedeflere dönüştürmek için kurulu analiz alanı.",
    description:
      "Deneme kulübü öğrencileri için hazırlanmış bu kurs; sonuç analizi, yanlış ayrıştırma ve yeni hafta planı içeriklerini toplar.",
    estimatedDurationMinutes: 260,
    modules: [
      {
        title: "Sonuç Okuma ve Analiz",
        description: "Deneme sonucu geldikten sonra ilk bakış ve yanlış analizi.",
        sortOrder: 10,
        lessons: [
          {
            slug: "ilk-analiz-akisi",
            title: "İlk Analiz Akışı",
            description:
              "Netler, yanlış kümeleri ve sonraki hafta planı için temel çerçeve.",
            lessonType: LessonType.VIDEO,
            sortOrder: 10,
            isPreview: true,
            durationSeconds: 860,
            videoTitle: "İlk Analiz Akışı"
          },
          {
            slug: "net-defteri-sablonu",
            title: "Net Defteri Şablonu",
            description:
              "Deneme sonuçlarını sabit bir tablo düzeninde takip etmek için şablon kullanımı.",
            lessonType: LessonType.DOCUMENT,
            sortOrder: 20,
            durationSeconds: 420
          }
        ]
      },
      {
        title: "Yeni Hafta Planı",
        description: "Analizden çıkan veriyi haftalık plana dönüştürme.",
        sortOrder: 20,
        lessons: [
          {
            slug: "haftalik-kazanimi-kapatmak",
            title: "Haftalık Kazanımı Kapatmak",
            description:
              "Analiz verisine göre bir haftalık görev dizilimi oluşturma dersi.",
            lessonType: LessonType.VIDEO,
            sortOrder: 10,
            durationSeconds: 910,
            videoTitle: "Haftalık Kazanımı Kapatmak",
            resources: [
              {
                title: "Ücretsiz Materyaller",
                resourceType: LessonResourceType.LINK,
                externalUrl: "/ucretsiz-materyaller",
                sortOrder: 10
              }
            ]
          }
        ]
      }
    ]
  }
];

async function syncCourseContent(courseId: string, blueprint: CourseBlueprint) {
  const existingModules = await prisma.courseModule.findMany({
    where: { courseId },
    include: {
      lessons: {
        select: {
          id: true,
          videoAssetId: true
        }
      }
    }
  });

  const moduleIds = existingModules.map((module) => module.id);
  const lessonIds = existingModules.flatMap((module) =>
    module.lessons.map((lesson) => lesson.id)
  );
  const videoAssetIds = existingModules.flatMap((module) =>
    module.lessons
      .map((lesson) => lesson.videoAssetId)
      .filter((value): value is string => Boolean(value))
  );

  if (lessonIds.length) {
    await prisma.lessonResource.deleteMany({
      where: {
        lessonId: {
          in: lessonIds
        }
      }
    });
  }

  if (lessonIds.length) {
    await prisma.lesson.deleteMany({
      where: {
        id: {
          in: lessonIds
        }
      }
    });
  }

  if (moduleIds.length) {
    await prisma.courseModule.deleteMany({
      where: {
        id: {
          in: moduleIds
        }
      }
    });
  }

  if (videoAssetIds.length) {
    await prisma.videoAsset.deleteMany({
      where: {
        id: {
          in: videoAssetIds
        }
      }
    });
  }

  for (const moduleBlueprint of blueprint.modules) {
    const createdModule = await prisma.courseModule.create({
      data: {
        courseId,
        title: moduleBlueprint.title,
        description: moduleBlueprint.description,
        sortOrder: moduleBlueprint.sortOrder,
        publishStatus: ContentStatus.PUBLISHED
      }
    });

    for (const lessonBlueprint of moduleBlueprint.lessons) {
      const videoAssetId = lessonBlueprint.lessonType === LessonType.VIDEO
        ? (
            await prisma.videoAsset.create({
              data: {
                provider: VideoProvider.EXTERNAL,
                title: lessonBlueprint.videoTitle ?? lessonBlueprint.title,
                status: VideoAssetStatus.READY
              }
            })
          ).id
        : null;

      const createdLesson = await prisma.lesson.create({
        data: {
          moduleId: createdModule.id,
          slug: lessonBlueprint.slug,
          title: lessonBlueprint.title,
          description: lessonBlueprint.description,
          lessonType: lessonBlueprint.lessonType,
          sortOrder: lessonBlueprint.sortOrder,
          publishStatus: ContentStatus.PUBLISHED,
          isPreview: lessonBlueprint.isPreview ?? false,
          durationSeconds: lessonBlueprint.durationSeconds,
          videoAssetId
        }
      });

      for (const resource of lessonBlueprint.resources ?? []) {
        await prisma.lessonResource.create({
          data: {
            lessonId: createdLesson.id,
            title: resource.title,
            resourceType: resource.resourceType,
            externalUrl: resource.externalUrl,
            sortOrder: resource.sortOrder,
            isPublished: true
          }
        });
      }
    }
  }
}

async function syncDemoEnrollment(userId: string, courseId: string, productId: string) {
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  if (existingEnrollment) {
    await prisma.enrollment.update({
      where: {
        id: existingEnrollment.id
      },
      data: {
        productId,
        status: EnrollmentStatus.ACTIVE,
        progressPercent: 0,
        accessStartsAt: new Date(),
        accessEndsAt: null,
        revokedAt: null
      }
    });
    return existingEnrollment.id;
  }

  const createdEnrollment = await prisma.enrollment.create({
    data: {
      userId,
      productId,
      courseId,
      status: EnrollmentStatus.ACTIVE,
      progressPercent: 0
    }
  });

  return createdEnrollment.id;
}

async function main() {
  const demoUser = await prisma.user.findUnique({
    where: {
      email: DEMO_USER_EMAIL
    },
    select: {
      id: true,
      email: true
    }
  });

  const result: Array<{
    courseSlug: string;
    productSlug: string;
    enrollmentId: string | null;
  }> = [];

  for (const blueprint of courseBlueprints) {
    const product = await prisma.product.findUnique({
      where: {
        slug: blueprint.productSlug
      },
      select: {
        id: true,
        slug: true,
        name: true
      }
    });

    if (!product) {
      throw new Error(`Product not found for LMS blueprint: ${blueprint.productSlug}`);
    }

    const course = await prisma.course.upsert({
      where: {
        slug: blueprint.slug
      },
      update: {
        title: blueprint.title,
        shortDescription: blueprint.shortDescription,
        description: blueprint.description,
        estimatedDurationMinutes: blueprint.estimatedDurationMinutes,
        publishStatus: ContentStatus.PUBLISHED
      },
      create: {
        slug: blueprint.slug,
        title: blueprint.title,
        shortDescription: blueprint.shortDescription,
        description: blueprint.description,
        estimatedDurationMinutes: blueprint.estimatedDurationMinutes,
        publishStatus: ContentStatus.PUBLISHED
      }
    });

    await prisma.productCourse.upsert({
      where: {
        productId_courseId: {
          productId: product.id,
          courseId: course.id
        }
      },
      update: {
        sortOrder: 10
      },
      create: {
        productId: product.id,
        courseId: course.id,
        sortOrder: 10
      }
    });

    await syncCourseContent(course.id, blueprint);

    const enrollmentId = demoUser
      ? await syncDemoEnrollment(demoUser.id, course.id, product.id)
      : null;

    result.push({
      courseSlug: blueprint.slug,
      productSlug: blueprint.productSlug,
      enrollmentId
    });
  }

  console.log(
    JSON.stringify(
      {
        demoUserEmail: demoUser?.email ?? null,
        syncedCourses: result
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
