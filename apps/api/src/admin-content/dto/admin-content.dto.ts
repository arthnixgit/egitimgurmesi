import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested
} from "class-validator";
import {
  ContentStatus,
  FreeMaterialItemType,
  MarketingPageType,
  NavigationMenuLocation
} from "@ega/db";

export class SaveNavigationMenuItemDto {
  @IsString()
  itemKey!: string;

  @IsString()
  label!: string;

  @IsString()
  href!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  target?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveNavigationMenuItemDto)
  children?: SaveNavigationMenuItemDto[];
}

export class SaveNavigationMenuDto {
  @IsString()
  name!: string;

  @IsEnum(NavigationMenuLocation)
  location!: NavigationMenuLocation;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveNavigationMenuItemDto)
  items!: SaveNavigationMenuItemDto[];
}

export class SaveMarketingPageSectionDto {
  @IsString()
  sectionKey!: string;

  @IsOptional()
  @IsString()
  eyebrow?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  variantKey?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(ContentStatus)
  publishStatus?: ContentStatus;
}

export class SaveMarketingPageDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(MarketingPageType)
  pageType!: MarketingPageType;

  @IsOptional()
  @IsEnum(ContentStatus)
  publishStatus?: ContentStatus;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsString()
  heroImageUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveMarketingPageSectionDto)
  sections!: SaveMarketingPageSectionDto[];
}

export class SaveStaffProfileDto {
  @IsString()
  slug!: string;

  @IsString()
  fullName!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsEnum(ContentStatus)
  publishStatus?: ContentStatus;
}

export class SaveStaffProfileGroupDto {
  @IsString()
  key!: string;

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  eyebrow?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsEnum(ContentStatus)
  publishStatus?: ContentStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveStaffProfileDto)
  profiles!: SaveStaffProfileDto[];
}

export class SaveStaffProfilesDocumentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveStaffProfileGroupDto)
  groups!: SaveStaffProfileGroupDto[];
}

export class SaveSuccessStoryDto {
  @IsString()
  slug!: string;

  @IsString()
  studentName!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  examLabel?: string;

  @IsString()
  resultTitle!: string;

  @IsString()
  highlight!: string;

  @IsOptional()
  @IsString()
  story?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsEnum(ContentStatus)
  publishStatus?: ContentStatus;
}

export class SaveSuccessStoriesDocumentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveSuccessStoryDto)
  stories!: SaveSuccessStoryDto[];
}

export class SaveFreeMaterialItemDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  title!: string;

  @IsEnum(FreeMaterialItemType)
  itemType!: FreeMaterialItemType;

  @IsOptional()
  @IsString()
  badgeLabel?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  href?: string;

  @IsOptional()
  @IsString()
  buttonLabel?: string;

  @IsOptional()
  @IsBoolean()
  opensInNewTab?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsEnum(ContentStatus)
  publishStatus?: ContentStatus;

  @IsOptional()
  @IsString()
  countdownPageSlug?: string;
}

export class SaveFreeMaterialCategoryDto {
  @IsString()
  key!: string;

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsEnum(ContentStatus)
  publishStatus?: ContentStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveFreeMaterialItemDto)
  items!: SaveFreeMaterialItemDto[];
}

export class SaveCountdownTargetDto {
  @IsString()
  label!: string;

  @ValidateIf((_object, value) => value !== null && value !== undefined && value !== "")
  @IsISO8601()
  targetAt?: string | null;

  @IsString()
  dateLabel!: string;

  @IsString()
  note!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class SaveCountdownOfficialLinkDto {
  @IsString()
  title!: string;

  @IsString()
  linkType!: string;

  @IsString()
  summary!: string;

  @IsString()
  href!: string;

  @IsOptional()
  @IsString()
  buttonLabel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class SaveCountdownArticleSectionDto {
  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class SaveCountdownPageDto {
  @IsString()
  slug!: string;

  @IsString()
  eyebrow!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  updatedLabel?: string;

  @IsString()
  videoTitle!: string;

  @IsString()
  videoNote!: string;

  @IsOptional()
  @IsEnum(ContentStatus)
  publishStatus?: ContentStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveCountdownTargetDto)
  targets!: SaveCountdownTargetDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveCountdownOfficialLinkDto)
  officialLinks!: SaveCountdownOfficialLinkDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveCountdownArticleSectionDto)
  articleSections!: SaveCountdownArticleSectionDto[];
}

export class SaveFreeMaterialsDocumentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveFreeMaterialCategoryDto)
  categories!: SaveFreeMaterialCategoryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveCountdownPageDto)
  countdownPages!: SaveCountdownPageDto[];
}
