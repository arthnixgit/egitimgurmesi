import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from "class-validator";
import {
  ContentStatus,
  Currency,
  ExternalProvider,
  ExternalProviderOrderStatus,
  OrderStatus,
  PaymentStatus,
  ProductType
} from "@ega/db";

export class SaveProductCategoryDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  slug!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  parentSlug?: string | null;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsString()
  ctaHref?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SaveProductFeatureDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  iconKey?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class SaveProductVariantDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  title!: string;

  @IsString()
  sku!: string;

  @IsOptional()
  @IsString()
  billingLabel?: string;

  @IsString()
  price!: string;

  @IsOptional()
  @IsString()
  compareAtPrice?: string;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  hasInstallments?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  installmentCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  externalProductId?: string;

  @IsOptional()
  @IsString()
  externalVariantId?: string;
}

export class SaveProductDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  slug!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProductType)
  type!: ProductType;

  @IsEnum(ExternalProvider)
  provider!: ExternalProvider;

  @IsOptional()
  @IsEnum(ContentStatus)
  publishStatus?: ContentStatus;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProductVariantDto)
  variants!: SaveProductVariantDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProductFeatureDto)
  features!: SaveProductFeatureDto[];
}

export class SaveCatalogDocumentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProductCategoryDto)
  categories!: SaveProductCategoryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProductDto)
  products!: SaveProductDto[];
}

export class UpdateOrderNoteDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsEnum(ExternalProviderOrderStatus)
  externalStatus?: ExternalProviderOrderStatus;
}

export class RecordManualReviewDto {
  @IsString()
  note!: string;
}
