import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength
} from "class-validator";

export class StartOrderCheckoutDto {
  @IsOptional()
  @IsString()
  @Length(11, 11)
  @Matches(/^\d{11}$/)
  identityNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(300)
  billingAddress?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  billingCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  billingDistrict?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  billingZipCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  billingCountry?: string;
}
