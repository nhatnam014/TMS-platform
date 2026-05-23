import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import type { CreateLocationDto as ICreateLocationDto } from "@tms/shared";

const LOCATION_TYPES = ["PORT", "DEPOT", "ICD", "INDUSTRIAL_ZONE", "WAREHOUSE", "OTHER"] as const;

export class CreateLocationDto implements ICreateLocationDto {
  @ApiProperty({ example: "CAT_LAI" })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: "Cảng Cát Lái" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: LOCATION_TYPES })
  @IsEnum(LOCATION_TYPES)
  locationType!: (typeof LOCATION_TYPES)[number];

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
}
