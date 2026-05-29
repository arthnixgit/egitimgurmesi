import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { CreateFreeCallRequestDto } from "./dto/create-free-call-request.dto";

@Injectable()
export class PublicEngagementService {
  constructor(private readonly prisma: PrismaService) {}

  async createFreeCallRequest(dto: CreateFreeCallRequestDto) {
    const detailLines = [
      `Ad Soyad: ${dto.fullName}`,
      dto.studentName ? `Öğrenci Adı: ${dto.studentName}` : null,
      dto.email ? `E-posta: ${dto.email}` : null,
      dto.gradeLevel ? `Sınıf Düzeyi: ${dto.gradeLevel}` : null,
      dto.studyTrack ? `Alan: ${dto.studyTrack}` : null,
      dto.city ? `Şehir: ${dto.city}` : null,
      dto.note ? `Not: ${dto.note}` : null
    ].filter(Boolean);

    await this.prisma.whatsAppLead.create({
      data: {
        sourcePage: dto.sourcePage?.trim() || "home-showcase-free-call",
        phoneSnapshot: dto.phone.trim(),
        message: detailLines.join("\n")
      }
    });

    return {
      success: true as const,
      message: "Ön görüşme talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz."
    };
  }
}
