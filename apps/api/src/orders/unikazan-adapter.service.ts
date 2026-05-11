import { GradeLevel, StudyTrack } from "@ega/db";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException
} from "@nestjs/common";
import { appEnv } from "../config/env";

type UnikazanLoginResponse = {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    user?: {
      id?: number | string;
      email?: string;
      name?: string;
      surname?: string;
      study_stream?: string | null;
      class_year?: string | null;
    };
  };
  error?: boolean;
  message?: string;
};

type UnikazanRefreshResponse = {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
  };
  error?: boolean;
  message?: string;
};

type UnikazanOrderCreateResponse = {
  success: boolean;
  data?: {
    order_id: string;
  };
  error?: boolean;
  message?: string;
};

type UnikazanOrderUpdateResponse = {
  success: boolean;
  data?: {
    order_id: string;
    status: string;
    package_name?: string;
    payment_method?: string;
    discount_code?: string | null;
    total_amount?: number;
    discount_amount?: number;
    final_amount?: number;
    payment_page_url?: string;
  };
  error?: boolean;
  message?: string;
};

type StudentDetailInput = {
  gradeLevel?: GradeLevel | null;
  studyTrack?: StudyTrack | null;
  inferredStudyTrack?: string | null;
};

type CreateCheckoutInput = {
  refreshToken: string;
  packageId: string;
  okUrl: string;
  failUrl: string;
  userIp: string;
  studentDetail: StudentDetailInput;
};

@Injectable()
export class UnikazanAdapterService {
  private readonly baseUrl = appEnv.unikazanBaseUrl().replace(/\/+$/, "");

  isConfigured() {
    const values = [appEnv.unikazanApiKey(), appEnv.unikazanProjectKey(), this.baseUrl];

    return values.every(
      (value) =>
        Boolean(value) &&
        !value.includes("replace-me") &&
        !value.includes("local-placeholder") &&
        !value.includes("sandbox-api.example.com")
    );
  }

  async login(email: string, password: string) {
    this.ensureConfigured();

    const response = await this.request<UnikazanLoginResponse>("/egitimgurmesi/auth/login", {
      method: "POST",
      body: {
        email,
        password
      }
    });

    if (!response.success || !response.data?.token || !response.data.refreshToken) {
      throw new BadRequestException(
        response.message || "Unikazan hesabı doğrulanamadı."
      );
    }

    return {
      accessToken: response.data.token,
      refreshToken: response.data.refreshToken,
      user: response.data.user ?? null
    };
  }

  async refresh(refreshToken: string) {
    this.ensureConfigured();

    const response = await this.request<UnikazanRefreshResponse>("/egitimgurmesi/auth/refresh", {
      method: "POST",
      body: {
        refreshToken
      }
    });

    if (!response.success || !response.data?.token || !response.data.refreshToken) {
      throw new ServiceUnavailableException(
        response.message || "Unikazan oturumu yenilenemedi."
      );
    }

    return {
      accessToken: response.data.token,
      refreshToken: response.data.refreshToken
    };
  }

  async createCheckoutSession(input: CreateCheckoutInput) {
    this.ensureConfigured();

    const refreshed = await this.refresh(input.refreshToken);
    const studentDetail = this.resolveStudentDetail(input.studentDetail);

    await this.request("/egitimgurmesi/student-detail", {
      method: "POST",
      bearerToken: refreshed.accessToken,
      body: studentDetail
    });

    const createdOrder = await this.request<UnikazanOrderCreateResponse>("/egitimgurmesi/orders", {
      method: "POST",
      bearerToken: refreshed.accessToken,
      body: {
        package_id: Number(input.packageId)
      }
    });

    if (!createdOrder.success || !createdOrder.data?.order_id) {
      throw new ServiceUnavailableException(
        createdOrder.message || "Unikazan siparişi oluşturulamadı."
      );
    }

    const updatedOrder = await this.request<UnikazanOrderUpdateResponse>(
      `/egitimgurmesi/orders/${encodeURIComponent(createdOrder.data.order_id)}`,
      {
        method: "PATCH",
        bearerToken: refreshed.accessToken,
        body: {
          package_id: Number(input.packageId),
          user_ip: input.userIp,
          ok_url: input.okUrl,
          fail_url: input.failUrl
        }
      }
    );

    if (!updatedOrder.success || !updatedOrder.data?.payment_page_url) {
      throw new ServiceUnavailableException(
        updatedOrder.message || "Unikazan ödeme sayfası oluşturulamadı."
      );
    }

    return {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      externalReference: updatedOrder.data.order_id,
      checkoutUrl: updatedOrder.data.payment_page_url,
      status: updatedOrder.data.status,
      packageName: updatedOrder.data.package_name ?? null,
      totalAmount: updatedOrder.data.final_amount ?? updatedOrder.data.total_amount ?? null,
      rawResponse: updatedOrder
    };
  }

  private resolveStudentDetail(input: StudentDetailInput) {
    const mappedStudyTrack =
      mapStudyTrackToUnikazan(input.studyTrack) ?? input.inferredStudyTrack ?? null;
    const mappedClassYear = mapGradeLevelToUnikazan(input.gradeLevel);

    if (!mappedStudyTrack || !mappedClassYear) {
      throw new ConflictException(
        "Öğrenci profili Unikazan koçluk ödemesi için yeterli değil. Sınıf ve alan bilgisi tamamlanmalı."
      );
    }

    return {
      study_stream: mappedStudyTrack,
      class_year: mappedClassYear
    };
  }

  private ensureConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        "Unikazan entegrasyonu henüz yapılandırılmadı."
      );
    }
  }

  private async request<T>(
    path: string,
    input: {
      method: "POST" | "PATCH";
      body: Record<string, unknown>;
      bearerToken?: string;
    }
  ) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: input.method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": appEnv.unikazanApiKey(),
        "X-Egitimgurmesi-Key": appEnv.unikazanProjectKey(),
        ...(input.bearerToken ? { Authorization: `Bearer ${input.bearerToken}` } : {})
      },
      body: JSON.stringify(input.body)
    });

    let payload: T | { message?: string } | null = null;

    try {
      payload = (await response.json()) as T;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "message" in payload && payload.message
          ? String(payload.message)
          : "Unikazan isteği başarısız oldu.";

      throw new BadRequestException(message);
    }

    return payload as T;
  }
}

function mapGradeLevelToUnikazan(value?: GradeLevel | null) {
  switch (value) {
    case "GRADE_5":
      return "5.Sınıf";
    case "GRADE_6":
      return "6.Sınıf";
    case "GRADE_7":
      return "7.Sınıf";
    case "GRADE_8":
      return "8.Sınıf";
    case "GRADE_9":
      return "9.Sınıf";
    case "GRADE_10":
      return "10.Sınıf";
    case "GRADE_11":
      return "11.Sınıf";
    case "GRADE_12":
      return "12.Sınıf";
    case "GRADUATE":
      return "Mezun";
    case "UNIVERSITY":
      return "Üniversite";
    default:
      return null;
  }
}

function mapStudyTrackToUnikazan(value?: StudyTrack | null) {
  switch (value) {
    case "SAYISAL":
      return "Sayısal";
    case "SOZEL":
      return "Sözel";
    case "ESIT_AGIRLIK":
      return "Eşit Ağırlık";
    case "DIL":
      return "Dil";
    case "TYT":
      return "TYT";
    case "LGS":
      return "LGS";
    case "MSU":
      return "MSÜ";
    case "ARA_SINIF":
      return "Ara Sınıf";
    case "KPSS":
      return "KPSS";
    default:
      return null;
  }
}
