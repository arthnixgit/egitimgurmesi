import {
  AuthActorType,
  ContentStatus,
  EnrollmentStatus,
  LessonType,
  Prisma
} from "@ega/db";
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";

const enrollmentListInclude = {
  product: {
    select: {
      id: true,
      slug: true,
      name: true,
      accentColor: true
    }
  },
  course: {
    include: {
      modules: {
        where: {
          publishStatus: ContentStatus.PUBLISHED
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          lessons: {
            where: {
              publishStatus: ContentStatus.PUBLISHED
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              slug: true,
              title: true,
              durationSeconds: true,
              lessonType: true,
              isPreview: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.EnrollmentInclude;

const enrollmentDetailInclude = {
  product: {
    select: {
      id: true,
      slug: true,
      name: true,
      accentColor: true,
      shortDescription: true
    }
  },
  course: {
    include: {
      modules: {
        where: {
          publishStatus: ContentStatus.PUBLISHED
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          lessons: {
            where: {
              publishStatus: ContentStatus.PUBLISHED
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            include: {
              videoAsset: true,
              resources: {
                where: {
                  isPublished: true
                },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
              }
            }
          }
        }
      }
    }
  }
} satisfies Prisma.EnrollmentInclude;

type EnrollmentListRecord = Prisma.EnrollmentGetPayload<{
  include: typeof enrollmentListInclude;
}>;

type EnrollmentDetailRecord = Prisma.EnrollmentGetPayload<{
  include: typeof enrollmentDetailInclude;
}>;

@Injectable()
export class StudentLmsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMyCourses(auth: AuthenticatedRequestContext) {
    ensureUserActor(auth);

    const now = new Date();
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        ...activeEnrollmentWhere(auth.actorId, now),
        course: {
          publishStatus: ContentStatus.PUBLISHED
        }
      },
      include: enrollmentListInclude,
      orderBy: [{ grantedAt: "desc" }]
    });

    const deduped = new Map<string, EnrollmentListRecord>();

    for (const enrollment of enrollments) {
      if (!deduped.has(enrollment.courseId)) {
        deduped.set(enrollment.courseId, enrollment);
      }
    }

    return Array.from(deduped.values()).map(mapCourseSummary);
  }

  async getMyCourse(
    auth: AuthenticatedRequestContext,
    courseSlug: string,
    lessonSlug?: string
  ) {
    ensureUserActor(auth);

    const now = new Date();
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        ...activeEnrollmentWhere(auth.actorId, now),
        course: {
          slug: courseSlug,
          publishStatus: ContentStatus.PUBLISHED
        }
      },
      include: enrollmentDetailInclude,
      orderBy: [{ grantedAt: "desc" }]
    });

    if (!enrollment) {
      throw new NotFoundException("Bu kurs için aktif erişim bulunamadı.");
    }

    const publishedLessons = enrollment.course.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({
        module,
        lesson
      }))
    );

    const selectedEntry =
      publishedLessons.find((entry) => entry.lesson.slug === lessonSlug) ?? publishedLessons[0] ?? null;

    if (!selectedEntry) {
      throw new NotFoundException("Bu kurs için yayınlanmış ders bulunamadı.");
    }

    return {
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        progressPercent: enrollment.progressPercent,
        grantedAt: enrollment.grantedAt.toISOString(),
        accessStartsAt: enrollment.accessStartsAt.toISOString(),
        accessEndsAt: enrollment.accessEndsAt?.toISOString() ?? null
      },
      product: enrollment.product
        ? {
            id: enrollment.product.id,
            slug: enrollment.product.slug,
            name: enrollment.product.name,
            accentColor: enrollment.product.accentColor,
            shortDescription: enrollment.product.shortDescription
          }
        : null,
      course: {
        id: enrollment.course.id,
        slug: enrollment.course.slug,
        title: enrollment.course.title,
        shortDescription: enrollment.course.shortDescription,
        description: enrollment.course.description,
        coverImageUrl: enrollment.course.coverImageUrl,
        estimatedDurationMinutes: enrollment.course.estimatedDurationMinutes,
        moduleCount: enrollment.course.modules.length,
        lessonCount: publishedLessons.length,
        modules: enrollment.course.modules.map((module) => ({
          id: module.id,
          title: module.title,
          description: module.description,
          sortOrder: module.sortOrder,
          lessons: module.lessons.map((lesson) => ({
            id: lesson.id,
            slug: lesson.slug,
            title: lesson.title,
            description: lesson.description,
            lessonType: lesson.lessonType,
            durationSeconds: lesson.durationSeconds,
            isPreview: lesson.isPreview,
            hasVideo: Boolean(lesson.videoAsset),
            resourceCount: lesson.resources.length
          }))
        }))
      },
      activeLesson: mapLessonDetail(selectedEntry.module.title, selectedEntry.lesson)
    };
  }

  async getMyOperationalOverview(auth: AuthenticatedRequestContext) {
    ensureUserActor(auth);

    const now = new Date();
    const [
      memberships,
      instructors,
      coaches,
      classGroups,
      sessions,
      announcements,
      enrollments,
      orders
    ] = await Promise.all([
      this.prisma.studentBranchMembership.findMany({
        where: { userId: auth.actorId },
        orderBy: [{ isPrimary: "desc" }, { joinedAt: "desc" }],
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              district: true,
              organization: { select: { id: true, name: true, slug: true } }
            }
          }
        }
      }),
      this.prisma.instructorAssignment.findMany({
        where: {
          isActive: true,
          OR: [
            { userId: auth.actorId },
            {
              classGroup: {
                students: {
                  some: { userId: auth.actorId, status: "ACTIVE" }
                }
              }
            }
          ]
        },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          branch: { select: { id: true, name: true } },
          classGroup: { select: { id: true, name: true } },
          instructor: { select: { id: true, firstName: true, lastName: true, email: true } }
        }
      }),
      this.prisma.coachAssignment.findMany({
        where: {
          isActive: true,
          OR: [
            { userId: auth.actorId },
            {
              classGroup: {
                students: {
                  some: { userId: auth.actorId, status: "ACTIVE" }
                }
              }
            }
          ]
        },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          branch: { select: { id: true, name: true } },
          classGroup: { select: { id: true, name: true } },
          coach: { select: { id: true, firstName: true, lastName: true, email: true } }
        }
      }),
      this.prisma.classGroupStudent.findMany({
        where: { userId: auth.actorId, status: "ACTIVE" },
        orderBy: { joinedAt: "desc" },
        include: {
          classGroup: {
            select: {
              id: true,
              name: true,
              slug: true,
              gradeLevel: true,
              studyTrack: true,
              branch: { select: { id: true, name: true } }
            }
          }
        }
      }),
      this.prisma.liveSessionParticipant.findMany({
        where: {
          userId: auth.actorId,
          liveSession: {
            status: "SCHEDULED",
            startsAt: { gte: now }
          }
        },
        orderBy: { liveSession: { startsAt: "asc" } },
        take: 8,
        include: {
          liveSession: {
            include: {
              branch: { select: { id: true, name: true } },
              classGroup: { select: { id: true, name: true } },
              course: { select: { id: true, title: true, slug: true } },
              instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
              coach: { select: { id: true, firstName: true, lastName: true, email: true } }
            }
          }
        }
      }),
      this.prisma.announcement.findMany({
        where: {
          status: "PUBLISHED",
          audience: { in: ["ALL", "STUDENTS"] },
          OR: [
            { branchId: null, organizationId: auth.organizationId },
            { branchId: { in: auth.branchIds.length ? auth.branchIds : ["__none__"] } },
            {
              classGroup: {
                students: {
                  some: { userId: auth.actorId, status: "ACTIVE" }
                }
              }
            }
          ],
          AND: [
            { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
            { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }
          ]
        },
        orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }],
        take: 8
      }),
      this.prisma.enrollment.findMany({
        where: activeEnrollmentWhere(auth.actorId, now),
        orderBy: { grantedAt: "desc" },
        take: 8,
        include: {
          product: { select: { id: true, name: true, slug: true, provider: true } },
          course: { select: { id: true, title: true, slug: true } }
        }
      }),
      this.prisma.order.findMany({
        where: { userId: auth.actorId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, status: true, provider: true, amount: true, currency: true }
          },
          externalOrders: {
            select: {
              id: true,
              provider: true,
              status: true,
              externalStatus: true,
              checkoutUrl: true
            }
          }
        }
      })
    ]);

    return {
      branches: memberships.map((membership) => ({
        id: membership.branch.id,
        name: membership.branch.name,
        slug: membership.branch.slug,
        city: membership.branch.city,
        district: membership.branch.district,
        organization: membership.branch.organization,
        status: membership.status,
        isPrimary: membership.isPrimary,
        joinedAt: membership.joinedAt
      })),
      instructors: instructors.map((assignment) => ({
        id: assignment.id,
        name: displayStaffName(assignment.instructor),
        email: assignment.instructor.email,
        branch: assignment.branch,
        classGroup: assignment.classGroup
      })),
      coaches: coaches.map((assignment) => ({
        id: assignment.id,
        name: displayStaffName(assignment.coach),
        email: assignment.coach.email,
        branch: assignment.branch,
        classGroup: assignment.classGroup
      })),
      classGroups: classGroups.map((entry) => ({
        id: entry.classGroup.id,
        name: entry.classGroup.name,
        slug: entry.classGroup.slug,
        gradeLevel: entry.classGroup.gradeLevel,
        studyTrack: entry.classGroup.studyTrack,
        branch: entry.classGroup.branch,
        joinedAt: entry.joinedAt
      })),
      upcomingSessions: sessions.map((entry) => ({
        id: entry.liveSession.id,
        title: entry.liveSession.title,
        startsAt: entry.liveSession.startsAt,
        endsAt: entry.liveSession.endsAt,
        meetingUrl: entry.liveSession.meetingUrl,
        status: entry.liveSession.status,
        participantStatus: entry.status,
        branch: entry.liveSession.branch,
        classGroup: entry.liveSession.classGroup,
        course: entry.liveSession.course,
        instructor: entry.liveSession.instructor
          ? {
              id: entry.liveSession.instructor.id,
              name: displayStaffName(entry.liveSession.instructor),
              email: entry.liveSession.instructor.email
            }
          : null,
        coach: entry.liveSession.coach
          ? {
              id: entry.liveSession.coach.id,
              name: displayStaffName(entry.liveSession.coach),
              email: entry.liveSession.coach.email
            }
          : null
      })),
      announcements: announcements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        body: announcement.body,
        audience: announcement.audience,
        publishAt: announcement.publishAt,
        createdAt: announcement.createdAt
      })),
      packages: enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        status: enrollment.status,
        progressPercent: enrollment.progressPercent,
        product: enrollment.product,
        course: enrollment.course,
        accessEndsAt: enrollment.accessEndsAt
      })),
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        createdAt: order.createdAt,
        payment: order.payments[0] ?? null,
        externalOrders: order.externalOrders
      })),
      placeholders: {
        aiTutor: "Yapay Zeka Öğrenme Koçu daha sonra etkinleştirilecek.",
        quiz: "Quiz ve deneme ekranı operasyonel beta sonrası genişletilecek.",
        progress: "Detaylı ilerleme analizi ders tamamlama olaylarıyla bağlanacak."
      }
    };
  }
}

function ensureUserActor(auth: AuthenticatedRequestContext) {
  if (auth.actorType !== AuthActorType.USER) {
    throw new ForbiddenException("Bu alan yalnızca öğrenci hesabına açıktır.");
  }
}

function activeEnrollmentWhere(userId: string, now: Date): Prisma.EnrollmentWhereInput {
  return {
    userId,
    status: EnrollmentStatus.ACTIVE,
    revokedAt: null,
    accessStartsAt: {
      lte: now
    },
    OR: [{ accessEndsAt: null }, { accessEndsAt: { gt: now } }]
  };
}

function mapCourseSummary(enrollment: EnrollmentListRecord) {
  const lessons = enrollment.course.modules.flatMap((module) => module.lessons);
  const firstLesson = lessons[0] ?? null;

  return {
    enrollmentId: enrollment.id,
    status: enrollment.status,
    progressPercent: enrollment.progressPercent,
    grantedAt: enrollment.grantedAt.toISOString(),
    accessEndsAt: enrollment.accessEndsAt?.toISOString() ?? null,
    product: enrollment.product
      ? {
          slug: enrollment.product.slug,
          name: enrollment.product.name,
          accentColor: enrollment.product.accentColor
        }
      : null,
    course: {
      slug: enrollment.course.slug,
      title: enrollment.course.title,
      shortDescription: enrollment.course.shortDescription,
      coverImageUrl: enrollment.course.coverImageUrl,
      estimatedDurationMinutes: enrollment.course.estimatedDurationMinutes,
      moduleCount: enrollment.course.modules.length,
      lessonCount: lessons.length,
      nextLessonSlug: firstLesson?.slug ?? null,
      nextLessonTitle: firstLesson?.title ?? null
    }
  };
}

function mapLessonDetail(
  moduleTitle: string,
  lesson: EnrollmentDetailRecord["course"]["modules"][number]["lessons"][number]
) {
  return {
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    lessonType: lesson.lessonType,
    lessonTypeLabel: mapLessonTypeLabel(lesson.lessonType),
    durationSeconds: lesson.durationSeconds,
    isPreview: lesson.isPreview,
    moduleTitle,
    video:
      lesson.videoAsset
        ? {
            provider: lesson.videoAsset.provider,
            status: lesson.videoAsset.status,
            title: lesson.videoAsset.title,
            sourceUrl: lesson.videoAsset.sourceUrl,
            playbackId: lesson.videoAsset.playbackId,
            thumbnailUrl: lesson.videoAsset.thumbnailUrl
          }
        : null,
    resources: lesson.resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      resourceType: resource.resourceType,
      storageKey: resource.storageKey,
      externalUrl: resource.externalUrl
    }))
  };
}

function mapLessonTypeLabel(lessonType: LessonType) {
  switch (lessonType) {
    case LessonType.VIDEO:
      return "Video ders";
    case LessonType.DOCUMENT:
      return "Doküman";
    case LessonType.LIVE_SESSION:
      return "Canlı oturum";
    case LessonType.QUIZ:
      return "Quiz";
    case LessonType.ASSIGNMENT:
      return "Görev";
    default:
      return lessonType;
  }
}

function displayStaffName(staffUser: { firstName: string; lastName: string; email: string }) {
  const fullName = `${staffUser.firstName} ${staffUser.lastName}`.trim();
  return fullName || staffUser.email;
}
