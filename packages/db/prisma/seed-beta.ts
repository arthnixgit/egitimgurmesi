import "dotenv/config";
import * as argon2 from "argon2";
import {
  AnnouncementAudience,
  AnnouncementStatus,
  BranchMembershipStatus,
  ClassGroupStudentStatus,
  ContentStatus,
  Currency,
  ExternalProvider,
  GradeLevel,
  LessonType,
  PrismaClient,
  ProductType,
  StaffBranchRole,
  StaffStatus,
  StudyTrack,
  UserStatus
} from "@prisma/client";
import { DEFAULT_PERMISSIONS, DEFAULT_ROLES, ROLE_KEYS, type RoleKey } from "../src";

const prisma = new PrismaClient();

const BETA_PASSWORD = process.env.BETA_SEED_PASSWORD ?? "BetaDemo2026!";
const BETA_EMAIL_DOMAIN = process.env.BETA_SEED_EMAIL_DOMAIN ?? "egitimgurmesi.local";
const now = new Date();

const betaStaff = {
  superAdmin: {
    email: `beta.superadmin@${BETA_EMAIL_DOMAIN}`,
    firstName: "Beta",
    lastName: "Super Admin",
    roleKey: ROLE_KEYS.superAdmin,
    branchRole: null
  },
  branchAdmin: {
    email: `beta.branch.admin@${BETA_EMAIL_DOMAIN}`,
    firstName: "Beta",
    lastName: "Şube Yöneticisi",
    roleKey: ROLE_KEYS.branchAdmin,
    branchRole: StaffBranchRole.BRANCH_ADMIN
  },
  instructor: {
    email: `beta.instructor@${BETA_EMAIL_DOMAIN}`,
    firstName: "Demo",
    lastName: "Eğitmen",
    roleKey: ROLE_KEYS.instructor,
    branchRole: StaffBranchRole.INSTRUCTOR
  },
  coach: {
    email: `beta.coach@${BETA_EMAIL_DOMAIN}`,
    firstName: "Demo",
    lastName: "Koç",
    roleKey: ROLE_KEYS.coach,
    branchRole: StaffBranchRole.COACH
  },
  accountant: {
    email: `beta.accountant@${BETA_EMAIL_DOMAIN}`,
    firstName: "Demo",
    lastName: "Muhasebe",
    roleKey: ROLE_KEYS.accountant,
    branchRole: StaffBranchRole.ACCOUNTANT
  }
} as const;

const betaStudents = [
  {
    email: `beta.student.lgs@${BETA_EMAIL_DOMAIN}`,
    firstName: "Deniz",
    lastName: "LGS",
    phone: "+905550000101",
    gradeLevel: GradeLevel.GRADE_8,
    studyTrack: StudyTrack.LGS,
    groupSlug: "lgs-hazirlik-demo-grubu"
  },
  {
    email: `beta.student.tyt@${BETA_EMAIL_DOMAIN}`,
    firstName: "Ece",
    lastName: "TYT",
    phone: "+905550000102",
    gradeLevel: GradeLevel.GRADE_12,
    studyTrack: StudyTrack.TYT,
    groupSlug: "tyt-matematik-demo-grubu"
  },
  {
    email: `beta.student.ielts@${BETA_EMAIL_DOMAIN}`,
    firstName: "Mert",
    lastName: "IELTS",
    phone: "+905550000103",
    gradeLevel: GradeLevel.UNIVERSITY,
    studyTrack: StudyTrack.DIL,
    groupSlug: "ielts-demo-grubu"
  }
] as const;

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_BETA_SEED_IN_PRODUCTION !== "true") {
    throw new Error(
      "seed:beta is blocked in production. Set ALLOW_BETA_SEED_IN_PRODUCTION=true only for a controlled beta environment."
    );
  }

  const passwordHash = await argon2.hash(BETA_PASSWORD);
  await ensureRbacCatalog();

  const organization = await prisma.organization.upsert({
    where: { slug: "egitim-gurmesi-demo-organizasyonu" },
    create: {
      slug: "egitim-gurmesi-demo-organizasyonu",
      name: "Eğitim Gurmesi Demo Organizasyonu",
      legalName: "Eğitim Gurmesi Demo Organizasyonu",
      supportEmail: `destek@${BETA_EMAIL_DOMAIN}`,
      supportPhone: "+90 555 000 00 00"
    },
    update: {
      name: "Eğitim Gurmesi Demo Organizasyonu",
      legalName: "Eğitim Gurmesi Demo Organizasyonu",
      supportEmail: `destek@${BETA_EMAIL_DOMAIN}`,
      supportPhone: "+90 555 000 00 00"
    }
  });

  const educationCenter = await prisma.educationCenter.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "egitim-gurmesi-online-egitim-merkezi"
      }
    },
    create: {
      organizationId: organization.id,
      slug: "egitim-gurmesi-online-egitim-merkezi",
      name: "Eğitim Gurmesi Online Eğitim Merkezi",
      legalName: "Eğitim Gurmesi Online Eğitim Merkezi",
      centerType: "Online Eğitim Merkezi",
      city: "Ankara",
      district: "Çankaya",
      email: `online@${BETA_EMAIL_DOMAIN}`,
      phone: "+90 555 000 00 01"
    },
    update: {
      name: "Eğitim Gurmesi Online Eğitim Merkezi",
      centerType: "Online Eğitim Merkezi",
      city: "Ankara",
      district: "Çankaya",
      email: `online@${BETA_EMAIL_DOMAIN}`,
      phone: "+90 555 000 00 01"
    }
  });

  const branch = await prisma.branch.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "online-sube"
      }
    },
    create: {
      organizationId: organization.id,
      educationCenterId: educationCenter.id,
      slug: "online-sube",
      name: "Online Şube",
      code: "ONLINE",
      city: "Ankara",
      district: "Çankaya",
      email: `online.sube@${BETA_EMAIL_DOMAIN}`,
      phone: "+90 555 000 00 02"
    },
    update: {
      educationCenterId: educationCenter.id,
      name: "Online Şube",
      code: "ONLINE",
      city: "Ankara",
      district: "Çankaya",
      email: `online.sube@${BETA_EMAIL_DOMAIN}`,
      phone: "+90 555 000 00 02"
    }
  });

  const staffRecords = {
    superAdmin: await upsertStaff(betaStaff.superAdmin, passwordHash, null, null),
    branchAdmin: await upsertStaff(betaStaff.branchAdmin, passwordHash, organization.id, branch.id),
    instructor: await upsertStaff(betaStaff.instructor, passwordHash, organization.id, branch.id),
    coach: await upsertStaff(betaStaff.coach, passwordHash, organization.id, branch.id),
    accountant: await upsertStaff(betaStaff.accountant, passwordHash, organization.id, branch.id)
  };

  await Promise.all(
    [staffRecords.branchAdmin, staffRecords.instructor, staffRecords.coach, staffRecords.accountant].map(
      (staffUser) => upsertBranchStaffAssignment(organization.id, branch.id, staffUser.id, staffUser.branchRole)
    )
  );

  const classGroups = {
    lgs: await upsertClassGroup(organization.id, branch.id, {
      slug: "lgs-hazirlik-demo-grubu",
      name: "LGS Hazırlık Demo Grubu",
      description: "LGS öğrencileri için beta canlı ders ve koçluk grubu.",
      gradeLevel: GradeLevel.GRADE_8,
      studyTrack: StudyTrack.LGS
    }),
    tyt: await upsertClassGroup(organization.id, branch.id, {
      slug: "tyt-matematik-demo-grubu",
      name: "TYT Matematik Demo Grubu",
      description: "TYT matematik odaklı beta çalışma grubu.",
      gradeLevel: GradeLevel.GRADE_12,
      studyTrack: StudyTrack.TYT
    }),
    ielts: await upsertClassGroup(organization.id, branch.id, {
      slug: "ielts-demo-grubu",
      name: "IELTS Demo Grubu",
      description: "Dil sınavlarına hazırlık için beta koçluk grubu.",
      gradeLevel: GradeLevel.UNIVERSITY,
      studyTrack: StudyTrack.DIL
    })
  };

  await Promise.all(
    Object.values(classGroups).flatMap((classGroup) => [
      upsertInstructorAssignment(
        organization.id,
        branch.id,
        classGroup.id,
        staffRecords.instructor.id,
        staffRecords.branchAdmin.id
      ),
      upsertCoachAssignment(
        organization.id,
        branch.id,
        classGroup.id,
        staffRecords.coach.id,
        staffRecords.branchAdmin.id
      )
    ])
  );

  const studentRecords = [];

  for (const student of betaStudents) {
    const user = await upsertStudent(student, passwordHash, organization.id, branch.id);
    studentRecords.push(user);
    const classGroup = Object.values(classGroups).find((entry) => entry.slug === student.groupSlug);

    await upsertStudentBranchMembership(organization.id, branch.id, user.id);

    if (classGroup) {
      await upsertClassGroupStudent(organization.id, branch.id, classGroup.id, user.id);
    }
  }

  const packages = await upsertBetaPackages(organization.id, branch.id);
  const course = await upsertBetaCourse(organization.id, branch.id, staffRecords.instructor.id);

  await prisma.productCourse.upsert({
    where: {
      productId_courseId: {
        productId: packages.lgs.id,
        courseId: course.id
      }
    },
    create: {
      productId: packages.lgs.id,
      courseId: course.id,
      sortOrder: 10
    },
    update: {
      sortOrder: 10
    }
  });

  for (const user of studentRecords) {
    await upsertEnrollment(organization.id, branch.id, user.id, packages.lgs.id, course.id);
  }

  await Promise.all([
    upsertLiveSession({
      key: "beta-lgs-session",
      organizationId: organization.id,
      branchId: branch.id,
      classGroupId: classGroups.lgs.id,
      instructorStaffUserId: staffRecords.instructor.id,
      coachStaffUserId: staffRecords.coach.id,
      createdByStaffUserId: staffRecords.branchAdmin.id,
      title: "LGS Demo Canlı Ders",
      description: "Beta grubu için LGS tanışma ve çalışma planı oturumu.",
      startsAt: nextLocalDate(2, 19, 30),
      endsAt: nextLocalDate(2, 20, 30),
      meetingUrl: "https://meet.example.com/beta-lgs",
      participantUserIds: studentRecords.map((student) => student.id)
    }),
    upsertLiveSession({
      key: "beta-tyt-session",
      organizationId: organization.id,
      branchId: branch.id,
      classGroupId: classGroups.tyt.id,
      instructorStaffUserId: staffRecords.instructor.id,
      coachStaffUserId: staffRecords.coach.id,
      createdByStaffUserId: staffRecords.branchAdmin.id,
      title: "TYT Matematik Demo Canlı Ders",
      description: "TYT Matematik beta grubu için problem çözme oturumu.",
      startsAt: nextLocalDate(3, 20, 0),
      endsAt: nextLocalDate(3, 21, 0),
      meetingUrl: "https://meet.example.com/beta-tyt",
      participantUserIds: studentRecords.map((student) => student.id)
    }),
    upsertLiveSession({
      key: "beta-ielts-session",
      organizationId: organization.id,
      branchId: branch.id,
      classGroupId: classGroups.ielts.id,
      instructorStaffUserId: staffRecords.instructor.id,
      coachStaffUserId: staffRecords.coach.id,
      createdByStaffUserId: staffRecords.branchAdmin.id,
      title: "IELTS Demo Koçluk Görüşmesi",
      description: "IELTS beta grubu için haftalık hedef ve speaking planı.",
      startsAt: nextLocalDate(4, 18, 30),
      endsAt: nextLocalDate(4, 19, 15),
      meetingUrl: "https://meet.example.com/beta-ielts",
      participantUserIds: studentRecords.map((student) => student.id)
    })
  ]);

  await Promise.all([
    upsertAnnouncement({
      organizationId: organization.id,
      branchId: branch.id,
      classGroupId: null,
      createdByStaffUserId: staffRecords.branchAdmin.id,
      title: "Beta Öğrenci Paneline Hoş Geldiniz",
      body:
        "Bu demo duyuru, öğrencilerin şube, grup, canlı ders ve paket bilgilerini panelde görebildiğini test etmek için oluşturuldu.",
      audience: AnnouncementAudience.STUDENTS
    }),
    upsertAnnouncement({
      organizationId: organization.id,
      branchId: branch.id,
      classGroupId: null,
      createdByStaffUserId: staffRecords.branchAdmin.id,
      title: "Beta Operasyon Takibi Başladı",
      body:
        "Eğitmen ve koçlar bu hafta demo gruplar, canlı dersler ve öğrenci atamalarını kontrol etmelidir.",
      audience: AnnouncementAudience.STAFF
    })
  ]);

  console.log("Beta seed completed safely.");
  console.table([
    ["Super Admin", betaStaff.superAdmin.email],
    ["Branch Admin", betaStaff.branchAdmin.email],
    ["Instructor", betaStaff.instructor.email],
    ["Coach", betaStaff.coach.email],
    ["Accountant", betaStaff.accountant.email],
    ["Student LGS", betaStudents[0].email],
    ["Student TYT", betaStudents[1].email],
    ["Student IELTS", betaStudents[2].email],
    ["Local beta password", BETA_PASSWORD]
  ]);
}

async function ensureRbacCatalog() {
  for (const permission of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      create: {
        key: permission.key,
        name: permission.name,
        description: permission.description
      },
      update: {
        name: permission.name,
        description: permission.description
      }
    });
  }

  for (const role of DEFAULT_ROLES) {
    const roleRecord = await prisma.role.upsert({
      where: { key: role.key },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: true
      },
      update: {
        name: role.name,
        description: role.description,
        isSystem: true
      }
    });

    for (const permissionKey of role.permissions) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key: permissionKey } });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleRecord.id,
            permissionId: permission.id
          }
        },
        create: {
          roleId: roleRecord.id,
          permissionId: permission.id
        },
        update: {}
      });
    }
  }
}

async function upsertStaff(
  staff: {
    email: string;
    firstName: string;
    lastName: string;
    roleKey: RoleKey;
    branchRole: StaffBranchRole | null;
  },
  passwordHash: string,
  organizationId: string | null,
  branchId: string | null
) {
  const staffUser = await prisma.staffUser.upsert({
    where: { email: staff.email },
    create: {
      email: staff.email,
      passwordHash,
      firstName: staff.firstName,
      lastName: staff.lastName,
      status: StaffStatus.ACTIVE,
      inviteAcceptedAt: now,
      organizationId,
      primaryBranchId: branchId
    },
    update: {
      passwordHash,
      firstName: staff.firstName,
      lastName: staff.lastName,
      status: StaffStatus.ACTIVE,
      inviteAcceptedAt: now,
      organizationId,
      primaryBranchId: branchId
    }
  });

  const role = await prisma.role.findUniqueOrThrow({ where: { key: staff.roleKey } });

  await prisma.staffUserRole.upsert({
    where: {
      staffUserId_roleId: {
        staffUserId: staffUser.id,
        roleId: role.id
      }
    },
    create: {
      staffUserId: staffUser.id,
      roleId: role.id
    },
    update: {}
  });

  return {
    ...staffUser,
    branchRole: staff.branchRole
  };
}

async function upsertBranchStaffAssignment(
  organizationId: string,
  branchId: string,
  staffUserId: string,
  roleKey: StaffBranchRole | null
) {
  if (!roleKey) {
    return null;
  }

  return prisma.branchStaffAssignment.upsert({
    where: {
      staffUserId_branchId_roleKey: {
        staffUserId,
        branchId,
        roleKey
      }
    },
    create: {
      organizationId,
      branchId,
      staffUserId,
      roleKey,
      isPrimary: true,
      assignedAt: now
    },
    update: {
      organizationId,
      isPrimary: true,
      revokedAt: null,
      assignedAt: now
    }
  });
}

async function upsertStudent(
  student: (typeof betaStudents)[number],
  passwordHash: string,
  organizationId: string,
  branchId: string
) {
  const user = await prisma.user.upsert({
    where: { email: student.email },
    create: {
      email: student.email,
      phone: student.phone,
      passwordHash,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: now,
      organizationId,
      primaryBranchId: branchId
    },
    update: {
      phone: student.phone,
      passwordHash,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: now,
      organizationId,
      primaryBranchId: branchId
    }
  });

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      firstName: student.firstName,
      lastName: student.lastName,
      city: "Ankara",
      marketingConsent: true,
      kvkkConsentAt: now,
      termsAcceptedAt: now,
      distanceSalesConsentAt: now
    },
    update: {
      firstName: student.firstName,
      lastName: student.lastName,
      city: "Ankara"
    }
  });

  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      gradeLevel: student.gradeLevel,
      studyTrack: student.studyTrack,
      schoolName: "Demo Okul",
      targetExamYear: 2026
    },
    update: {
      gradeLevel: student.gradeLevel,
      studyTrack: student.studyTrack,
      schoolName: "Demo Okul",
      targetExamYear: 2026
    }
  });

  return user;
}

async function upsertStudentBranchMembership(
  organizationId: string,
  branchId: string,
  userId: string
) {
  return prisma.studentBranchMembership.upsert({
    where: {
      userId_branchId: {
        userId,
        branchId
      }
    },
    create: {
      organizationId,
      branchId,
      userId,
      status: BranchMembershipStatus.ACTIVE,
      isPrimary: true
    },
    update: {
      organizationId,
      status: BranchMembershipStatus.ACTIVE,
      isPrimary: true,
      leftAt: null
    }
  });
}

async function upsertClassGroup(
  organizationId: string,
  branchId: string,
  input: {
    slug: string;
    name: string;
    description: string;
    gradeLevel: GradeLevel;
    studyTrack: StudyTrack;
  }
) {
  return prisma.classGroup.upsert({
    where: {
      branchId_slug: {
        branchId,
        slug: input.slug
      }
    },
    create: {
      organizationId,
      branchId,
      slug: input.slug,
      name: input.name,
      description: input.description,
      gradeLevel: input.gradeLevel,
      studyTrack: input.studyTrack
    },
    update: {
      name: input.name,
      description: input.description,
      gradeLevel: input.gradeLevel,
      studyTrack: input.studyTrack
    }
  });
}

async function upsertClassGroupStudent(
  organizationId: string,
  branchId: string,
  classGroupId: string,
  userId: string
) {
  return prisma.classGroupStudent.upsert({
    where: {
      classGroupId_userId: {
        classGroupId,
        userId
      }
    },
    create: {
      organizationId,
      branchId,
      classGroupId,
      userId,
      status: ClassGroupStudentStatus.ACTIVE
    },
    update: {
      status: ClassGroupStudentStatus.ACTIVE,
      leftAt: null
    }
  });
}

async function upsertInstructorAssignment(
  organizationId: string,
  branchId: string,
  classGroupId: string,
  staffUserId: string,
  assignedByStaffUserId: string
) {
  const existing = await prisma.instructorAssignment.findFirst({
    where: { classGroupId, staffUserId }
  });

  if (existing) {
    return prisma.instructorAssignment.update({
      where: { id: existing.id },
      data: {
        organizationId,
        branchId,
        isActive: true,
        endsAt: null,
        assignedByStaffUserId
      }
    });
  }

  return prisma.instructorAssignment.create({
    data: {
      organizationId,
      branchId,
      classGroupId,
      staffUserId,
      assignedByStaffUserId
    }
  });
}

async function upsertCoachAssignment(
  organizationId: string,
  branchId: string,
  classGroupId: string,
  staffUserId: string,
  assignedByStaffUserId: string
) {
  const existing = await prisma.coachAssignment.findFirst({
    where: { classGroupId, staffUserId }
  });

  if (existing) {
    return prisma.coachAssignment.update({
      where: { id: existing.id },
      data: {
        organizationId,
        branchId,
        isActive: true,
        endsAt: null,
        assignedByStaffUserId
      }
    });
  }

  return prisma.coachAssignment.create({
    data: {
      organizationId,
      branchId,
      classGroupId,
      staffUserId,
      assignedByStaffUserId
    }
  });
}

async function upsertBetaPackages(organizationId: string, branchId: string) {
  const publicCategory = await prisma.productCategory.upsert({
    where: { slug: "beta-platform-paketleri" },
    create: {
      slug: "beta-platform-paketleri",
      name: "Beta Platform Paketleri",
      description: "Beta operasyon testleri için taslak durumda tutulan paketler.",
      isActive: false,
      sortOrder: 900
    },
    update: {
      name: "Beta Platform Paketleri",
      description: "Beta operasyon testleri için taslak durumda tutulan paketler.",
      isActive: false
    }
  });

  const branchCategory = await prisma.productCategory.upsert({
    where: { slug: "beta-online-sube-paketleri" },
    create: {
      organizationId,
      branchId,
      slug: "beta-online-sube-paketleri",
      name: "Online Şube Beta Paketleri",
      description: "Online Şube için branch-visible beta paketleri.",
      isActive: true,
      sortOrder: 910
    },
    update: {
      organizationId,
      branchId,
      name: "Online Şube Beta Paketleri",
      description: "Online Şube için branch-visible beta paketleri.",
      isActive: true
    }
  });

  const lgs = await upsertProduct({
    slug: "beta-lgs-kocluk-paketi",
    name: "Beta LGS Koçluk Paketi",
    categoryId: publicCategory.id,
    organizationId: null,
    branchId: null,
    provider: ExternalProvider.LOCAL,
    shortDescription: "LGS öğrencileri için canlı ders, haftalık koçluk ve takip paketi.",
    description: "Beta testlerinde öğrenci paneli, canlı ders ve koçluk akışını görmek için kullanılır.",
    price: "2490.00",
    sku: "BETA-LGS-KOCLUK",
    publishStatus: ContentStatus.DRAFT,
    isFeatured: false,
    features: ["Haftalık koçluk görüşmesi", "Canlı ders programı", "Öğrenci paneli erişimi"]
  });

  const tyt = await upsertProduct({
    slug: "beta-tyt-matematik-paketi",
    name: "Beta TYT Matematik Paketi",
    categoryId: publicCategory.id,
    organizationId: null,
    branchId: null,
    provider: ExternalProvider.LOCAL,
    shortDescription: "TYT Matematik grubu için canlı ders ve çalışma takip paketi.",
    description: "Platform-owned TYT beta paketi olarak ödeme ve panel görünürlüğü testlerinde kullanılır.",
    price: "1990.00",
    sku: "BETA-TYT-MATEMATIK",
    publishStatus: ContentStatus.DRAFT,
    isFeatured: false,
    features: ["TYT matematik canlı ders", "Konu takip listesi", "Haftalık ilerleme özeti"]
  });

  const unikazan = await upsertProduct({
    slug: "beta-unikazan-yks-placeholder",
    name: "Beta Unikazan YKS Placeholder Paketi",
    categoryId: publicCategory.id,
    organizationId: null,
    branchId: null,
    provider: ExternalProvider.UNIKAZAN,
    shortDescription: "Unikazan entegrasyon akışı için güvenli beta placeholder paketi.",
    description: "Gerçek Unikazan API anahtarları gelmeden önce provisioning ekranlarını test etmek için kullanılır.",
    price: "3599.00",
    sku: "BETA-UNIKAZAN-YKS",
    publishStatus: ContentStatus.DRAFT,
    isFeatured: false,
    features: ["Unikazan bağlantı placeholder", "Öğrenci panelinde durum kartı", "Admin provisioning kontrolü"]
  });

  const branchVisible = await upsertProduct({
    slug: "beta-online-sube-deneme-paketi",
    name: "Online Şube Beta Deneme Paketi",
    categoryId: branchCategory.id,
    organizationId,
    branchId,
    provider: ExternalProvider.LOCAL,
    shortDescription: "Sadece Online Şube kapsamında görünen beta paket.",
    description: "Branch-visible paket kurallarının test edilmesi için oluşturulur.",
    price: "990.00",
    sku: "BETA-ONLINE-SUBE",
    publishStatus: ContentStatus.PUBLISHED,
    isFeatured: false,
    features: ["Şube kapsamlı görünürlük", "Branch Admin test paketi", "Operasyon hazırlık akışı"]
  });

  await ensureUnikazanPlaceholderLink(unikazan.id);

  return {
    lgs,
    tyt,
    unikazan,
    branchVisible
  };
}

async function upsertProduct(input: {
  slug: string;
  name: string;
  categoryId: string;
  organizationId: string | null;
  branchId: string | null;
  provider: ExternalProvider;
  shortDescription: string;
  description: string;
  price: string;
  sku: string;
  publishStatus?: ContentStatus;
  isFeatured?: boolean;
  features: string[];
}) {
  const product = await prisma.product.upsert({
    where: { slug: input.slug },
    create: {
      organizationId: input.organizationId,
      branchId: input.branchId,
      categoryId: input.categoryId,
      slug: input.slug,
      name: input.name,
      shortDescription: input.shortDescription,
      description: input.description,
      type: ProductType.COACHING_PACKAGE,
      provider: input.provider,
      publishStatus: input.publishStatus ?? ContentStatus.PUBLISHED,
      isFeatured: input.isFeatured ?? true,
      sortOrder: 900,
      accentColor: "teal"
    },
    update: {
      organizationId: input.organizationId,
      branchId: input.branchId,
      categoryId: input.categoryId,
      name: input.name,
      shortDescription: input.shortDescription,
      description: input.description,
      provider: input.provider,
      publishStatus: input.publishStatus ?? ContentStatus.PUBLISHED,
      isFeatured: input.isFeatured ?? true
    }
  });

  await prisma.productVariant.upsert({
    where: { sku: input.sku },
    create: {
      productId: product.id,
      title: "Beta Ana Paket",
      sku: input.sku,
      billingLabel: `${Number(input.price).toLocaleString("tr-TR")} TRY`,
      price: input.price,
      currency: Currency.TRY,
      isDefault: true,
      isActive: true,
      hasInstallments: true,
      installmentCount: 12
    },
    update: {
      productId: product.id,
      billingLabel: `${Number(input.price).toLocaleString("tr-TR")} TRY`,
      price: input.price,
      currency: Currency.TRY,
      isDefault: true,
      isActive: true,
      hasInstallments: true,
      installmentCount: 12
    }
  });

  for (const [index, feature] of input.features.entries()) {
    await ensureProductFeature(product.id, feature, (index + 1) * 10);
  }

  return product;
}

async function ensureProductFeature(productId: string, title: string, sortOrder: number) {
  const existing = await prisma.productFeature.findFirst({
    where: { productId, title }
  });

  if (existing) {
    return prisma.productFeature.update({
      where: { id: existing.id },
      data: { sortOrder }
    });
  }

  return prisma.productFeature.create({
    data: {
      productId,
      title,
      sortOrder,
      iconKey: "check"
    }
  });
}

async function ensureUnikazanPlaceholderLink(productId: string) {
  const existing = await prisma.externalProviderProduct.findFirst({
    where: {
      productId,
      provider: ExternalProvider.UNIKAZAN,
      externalProductId: "beta-unikazan-placeholder"
    }
  });

  if (existing) {
    return prisma.externalProviderProduct.update({
      where: { id: existing.id },
      data: { isActive: true }
    });
  }

  return prisma.externalProviderProduct.create({
    data: {
      productId,
      provider: ExternalProvider.UNIKAZAN,
      externalProductId: "beta-unikazan-placeholder",
      isActive: true
    }
  });
}

async function upsertBetaCourse(
  organizationId: string,
  branchId: string,
  createdByStaffUserId: string
) {
  const course = await prisma.course.upsert({
    where: { slug: "beta-lgs-operasyon-kursu" },
    create: {
      organizationId,
      branchId,
      slug: "beta-lgs-operasyon-kursu",
      title: "Beta LGS Operasyon Kursu",
      shortDescription: "Öğrenci paneli ders erişimi için beta kurs.",
      description: "Canlı ders, materyal ve öğrenci paneli testleri için basit beta kurs yapısı.",
      publishStatus: ContentStatus.PUBLISHED,
      estimatedDurationMinutes: 90,
      createdByStaffUserId
    },
    update: {
      organizationId,
      branchId,
      title: "Beta LGS Operasyon Kursu",
      shortDescription: "Öğrenci paneli ders erişimi için beta kurs.",
      description: "Canlı ders, materyal ve öğrenci paneli testleri için basit beta kurs yapısı.",
      publishStatus: ContentStatus.PUBLISHED,
      estimatedDurationMinutes: 90,
      createdByStaffUserId
    }
  });

  const module = await prisma.courseModule.upsert({
    where: {
      courseId_sortOrder: {
        courseId: course.id,
        sortOrder: 10
      }
    },
    create: {
      courseId: course.id,
      title: "Beta Başlangıç Modülü",
      description: "Öğrencinin panelde ders akışını test ettiği ilk modül.",
      sortOrder: 10,
      publishStatus: ContentStatus.PUBLISHED
    },
    update: {
      title: "Beta Başlangıç Modülü",
      description: "Öğrencinin panelde ders akışını test ettiği ilk modül.",
      publishStatus: ContentStatus.PUBLISHED
    }
  });

  await prisma.lesson.upsert({
    where: {
      moduleId_slug: {
        moduleId: module.id,
        slug: "beta-tanitim-dersi"
      }
    },
    create: {
      moduleId: module.id,
      slug: "beta-tanitim-dersi",
      title: "Beta Tanıtım Dersi",
      description: "Öğrencinin kurs ekranına girişini test etmek için yayınlanan demo ders.",
      lessonType: LessonType.VIDEO,
      sortOrder: 10,
      publishStatus: ContentStatus.PUBLISHED,
      isPreview: true,
      durationSeconds: 600
    },
    update: {
      title: "Beta Tanıtım Dersi",
      description: "Öğrencinin kurs ekranına girişini test etmek için yayınlanan demo ders.",
      publishStatus: ContentStatus.PUBLISHED,
      isPreview: true,
      durationSeconds: 600
    }
  });

  return course;
}

async function upsertEnrollment(
  organizationId: string,
  branchId: string,
  userId: string,
  productId: string,
  courseId: string
) {
  const existing = await prisma.enrollment.findFirst({
    where: {
      userId,
      productId,
      courseId
    }
  });

  if (existing) {
    return prisma.enrollment.update({
      where: { id: existing.id },
      data: {
        organizationId,
        branchId,
        status: "ACTIVE",
        progressPercent: 0,
        revokedAt: null,
        accessStartsAt: now,
        accessEndsAt: null
      }
    });
  }

  return prisma.enrollment.create({
    data: {
      organizationId,
      branchId,
      userId,
      productId,
      courseId,
      status: "ACTIVE",
      progressPercent: 0,
      accessStartsAt: now
    }
  });
}

async function upsertLiveSession(input: {
  key: string;
  organizationId: string;
  branchId: string;
  classGroupId: string;
  instructorStaffUserId: string;
  coachStaffUserId: string;
  createdByStaffUserId: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  meetingUrl: string;
  participantUserIds: string[];
}) {
  const existing = await prisma.liveSession.findFirst({
    where: {
      branchId: input.branchId,
      title: input.title
    }
  });

  const data = {
    organizationId: input.organizationId,
    branchId: input.branchId,
    classGroupId: input.classGroupId,
    instructorStaffUserId: input.instructorStaffUserId,
    coachStaffUserId: input.coachStaffUserId,
    createdByStaffUserId: input.createdByStaffUserId,
    title: input.title,
    description: input.description,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    meetingUrl: input.meetingUrl,
    status: "SCHEDULED" as const,
    metadata: { betaSeedKey: input.key }
  };

  const session = existing
    ? await prisma.liveSession.update({ where: { id: existing.id }, data })
    : await prisma.liveSession.create({ data });

  for (const userId of input.participantUserIds) {
    await prisma.liveSessionParticipant.upsert({
      where: {
        liveSessionId_userId: {
          liveSessionId: session.id,
          userId
        }
      },
      create: {
        liveSessionId: session.id,
        userId
      },
      update: {
        status: "INVITED"
      }
    });
  }

  return session;
}

async function upsertAnnouncement(input: {
  organizationId: string;
  branchId: string;
  classGroupId: string | null;
  createdByStaffUserId: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
}) {
  const existing = await prisma.announcement.findFirst({
    where: {
      branchId: input.branchId,
      title: input.title
    }
  });

  const data = {
    organizationId: input.organizationId,
    branchId: input.branchId,
    classGroupId: input.classGroupId,
    createdByStaffUserId: input.createdByStaffUserId,
    title: input.title,
    body: input.body,
    status: AnnouncementStatus.PUBLISHED,
    audience: input.audience,
    publishAt: now,
    expiresAt: null
  };

  return existing
    ? prisma.announcement.update({ where: { id: existing.id }, data })
    : prisma.announcement.create({ data });
}

function nextLocalDate(daysFromNow: number, hour: number, minute: number) {
  const value = new Date();
  value.setDate(value.getDate() + daysFromNow);
  value.setHours(hour, minute, 0, 0);
  return value;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
