import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import type { UpdateLocationDto as IUpdateLocationDto } from "@tms/shared";

const LOCATION_TYPES = ["PORT", "DEPOT", "ICD", "INDUSTRIAL_ZONE", "WAREHOUSE", "OTHER"] as const;

export class UpdateLocationDto implements IUpdateLocationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: LOCATION_TYPES })
  @IsOptional()
  @IsEnum(LOCATION_TYPES)
  locationType?: (typeof LOCATION_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
