import { IsString, Matches, MinLength } from "class-validator";

export class ConfirmPasswordResetDto {
  @IsString()
  @MinLength(16)
  token!: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: "Şifre en az bir büyük harf içermelidir." })
  @Matches(/[a-z]/, { message: "Şifre en az bir küçük harf içermelidir." })
  @Matches(/[0-9]/, { message: "Şifre en az bir rakam içermelidir." })
  password!: string;
}
