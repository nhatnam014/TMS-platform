import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import type { CreateTripPlanDto as ICreateTripPlanDto } from "@tms/shared";

const SERVICE_TYPES = ["SEA_EXPORT", "SEA_IMPORT", "NEO_EXPORT", "NEO_IMPORT"] as const;
const TRIP_MODES = ["STANDARD", "DROP_AND_HOOK"] as const;

export class CreateTripPlanDto implements ICreateTripPlanDto {
  @ApiProperty({ example: "2026-05-19" })
  @IsDateString()
  tripDate!: string;

  @ApiProperty({ enum: SERVICE_TYPES })
  @IsEnum(SERVICE_TYPES)
  serviceType!: (typeof SERVICE_TYPES)[number];

  @ApiPropertyOptional({ enum: TRIP_MODES, default: "STANDARD" })
  @IsOptional()
  @IsEnum(TRIP_MODES)
  tripMode?: (typeof TRIP_MODES)[number];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outboundContainerNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inboundContainerNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outboundContainerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inboundContainerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  loadUnloadLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dropoffLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
