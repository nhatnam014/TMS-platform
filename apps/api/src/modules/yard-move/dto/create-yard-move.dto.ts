import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { FactoryZone } from "@tms/shared";

const FACTORY_ZONE_VALUES = Object.values(FactoryZone) as string[];

export class CreateYardMoveDto {
  @ApiProperty({ example: "2026-05-19" })
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  containerId!: string;

  @ApiProperty({ enum: FACTORY_ZONE_VALUES })
  @IsEnum(FactoryZone, { message: `fromZone must be one of: ${FACTORY_ZONE_VALUES.join(", ")}` })
  fromZone!: string;

  @ApiProperty({ enum: FACTORY_ZONE_VALUES })
  @IsEnum(FactoryZone, { message: `toZone must be one of: ${FACTORY_ZONE_VALUES.join(", ")}` })
  toZone!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  locationId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
