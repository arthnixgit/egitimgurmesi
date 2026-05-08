import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { normalizeEmail } from "./auth.utils";
import { StaffUsersRepository } from "../data-access/staff-users.repository";
import { PasswordService } from "./password.service";
import { appEnv } from "../config/env";
import { BootstrapStaffDto } from "./dto/bootstrap-staff.dto";
import { AuthService } from "./auth.service";

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class StaffBootstrapService {
  constructor(
    private readonly staffUsersRepository: StaffUsersRepository,
    private readonly passwordService: PasswordService,
    private readonly authService: AuthService
  ) {}

  async getBootstrapStatus() {
    const superAdminCount = await this.staffUsersRepository.hasSuperAdmin();

    return {
      requiresBootstrap: superAdminCount === 0
    };
  }

  async bootstrap(dto: BootstrapStaffDto, meta: RequestMeta) {
    const status = await this.getBootstrapStatus();

    if (!status.requiresBootstrap) {
      throw new ConflictException("İlk super-admin hesabı zaten oluşturulmuş.");
    }

    if (dto.bootstrapSecret !== appEnv.bootstrapAdminSecret()) {
      throw new UnauthorizedException("Bootstrap anahtarı geçersiz.");
    }

    const email = normalizeEmail(dto.email);
    const existing = await this.staffUsersRepository.findByEmailWithAccess(email);

    if (existing) {
      throw new ConflictException("Bu e-posta ile bir personel hesabı zaten mevcut.");
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const staffUser = await this.staffUsersRepository.createSuperAdmin({
      email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName
    });

    return this.authService.createAuthResponseForBootstrap(staffUser, meta);
  }
}
