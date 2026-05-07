import { GradeLevel, Prisma, StudyTrack, UserStatus } from "@ega/db";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

const userProfileInclude = {
  profile: true,
  studentProfile: true
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
}
