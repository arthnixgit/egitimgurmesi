import { GradeLevel, Prisma, StudyTrack, UserStatus } from "@ega/db";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

const userProfileInclude = {
  profile: true,
  studentProfile: true,
  externalAccounts: {
    select: {
      id: true,
      provider: true,
      externalEmail: true,
      linkedAt: true
    }
  },
  branchMemberships: {
    where: {
      status: "ACTIVE"
    },
    select: {
      branchId: true,
      organizationId: true,
      isPrimary: true
    }
  }
} satisfies Prisma.UserInclude;

export type UserWithProfile = Prisma.UserGetPayload<{
  include: typeof userProfileInclude;
}>;

type CreateUserInput = {
  email: string;
  phone?: string;
  passwordHash: string;
  status: UserStatus;
  profile: {
    firstName: string;
    lastName: string;
    city?: string;
    district?: string;
    parentName?: string;
    parentPhone?: string;
    marketingConsent: boolean;
    kvkkConsentAt: Date;
    termsAcceptedAt: Date;
    distanceSalesConsentAt: Date;
  };
  studentProfile?: {
    gradeLevel?: GradeLevel;
    studyTrack?: StudyTrack;
    schoolName?: string;
    targetExamYear?: number;
  };
};

type UpdateUserProfileInput = {
  phone?: string | null;
  profile: {
    firstName?: string;
    lastName?: string;
    city?: string | null;
    district?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
    marketingConsent?: boolean;
  };
  studentProfile: {
    gradeLevel?: GradeLevel | null;
    studyTrack?: StudyTrack | null;
    schoolName?: string | null;
    targetExamYear?: number | null;
  };
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: userProfileInclude
    });
  }

  findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      include: userProfileInclude
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: userProfileInclude
    });
  }

  createUser(input: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        phone: input.phone,
        passwordHash: input.passwordHash,
        status: input.status,
        profile: {
          create: input.profile
        },
        studentProfile: input.studentProfile
          ? {
              create: input.studentProfile
            }
          : undefined
      },
      include: userProfileInclude
    });
  }

  touchLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date()
      }
    });
  }

  markEmailVerified(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date()
      },
      include: userProfileInclude
    });
  }

  updatePasswordHash(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordHash
      },
      include: userProfileInclude
    });
  }

  updateUserProfile(id: string, input: UpdateUserProfileInput) {
    return this.prisma.user.update({
      where: { id },
      data: {
        phone: input.phone,
        profile: {
          upsert: {
            create: {
              firstName: input.profile.firstName ?? "",
              lastName: input.profile.lastName ?? "",
              city: input.profile.city ?? undefined,
              district: input.profile.district ?? undefined,
              parentName: input.profile.parentName ?? undefined,
              parentPhone: input.profile.parentPhone ?? undefined,
              marketingConsent: input.profile.marketingConsent ?? false
            },
            update: {
              firstName: input.profile.firstName,
              lastName: input.profile.lastName,
              city: input.profile.city,
              district: input.profile.district,
              parentName: input.profile.parentName,
              parentPhone: input.profile.parentPhone,
              marketingConsent: input.profile.marketingConsent
            }
          }
        },
        studentProfile: {
          upsert: {
            create: {
              gradeLevel: input.studentProfile.gradeLevel ?? undefined,
              studyTrack: input.studentProfile.studyTrack ?? undefined,
              schoolName: input.studentProfile.schoolName ?? undefined,
              targetExamYear: input.studentProfile.targetExamYear ?? undefined
            },
            update: {
              gradeLevel: input.studentProfile.gradeLevel,
              studyTrack: input.studentProfile.studyTrack,
              schoolName: input.studentProfile.schoolName,
              targetExamYear: input.studentProfile.targetExamYear
            }
          }
        }
      },
      include: userProfileInclude
    });
  }
}
