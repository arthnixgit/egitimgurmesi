import { IsEmail, IsString, Matches, MinLength } from "class-validator";

export class BootstrapStaffDto {
  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: "Şifre en az bir büyük harf içermelidir." })
  @Matches(/[a-z]/, { message: "Şifre en az bir küçük harf içermelidir." })
  @Matches(/[0-9]/, { message: "Şifre en az bir rakam içermelidir." })
  password!: string;

  @IsString()
  @MinLength(12)
  bootstrapSecret!: string;
}
