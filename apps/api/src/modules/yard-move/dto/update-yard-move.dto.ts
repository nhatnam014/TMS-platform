import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, Matches } from "class-validator";
import { FactoryZone } from "@tms/shared";

const FACTORY_ZONE_VALUES = Object.values(FactoryZone) as string[];

export class UpdateYardMoveDto {
  @ApiPropertyOptional({ example: "2026-05-19" })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: "ABCD1234567" })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{4}\d{7}$/, {
    message: "Container number must be 4 uppercase letters followed by 7 digits",
  })
  containerNumber?: string;

  @ApiPropertyOptional({ enum: FACTORY_ZONE_VALUES })
  @IsOptional()
  @IsEnum(FactoryZone, { message: `fromZone must be one of: ${FACTORY_ZONE_VALUES.join(", ")}` })
  fromZone?: string;

  @ApiPropertyOptional({ enum: FACTORY_ZONE_VALUES })
  @IsOptional()
  @IsEnum(FactoryZone, { message: `toZone must be one of: ${FACTORY_ZONE_VALUES.join(", ")}` })
  toZone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: "Set to false to soft-delete the yard move" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
