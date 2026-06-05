import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";
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

  @ApiPropertyOptional({ example: "40HC", description: "SIZE CONT — container size code" })
  @IsOptional()
  @IsString()
  containerSize?: string;

  @ApiPropertyOptional({ example: "OOLU8990993" })
  @IsOptional()
  @IsString()
  outboundContainerNumber?: string;

  @ApiPropertyOptional({ example: "OOLU8990993" })
  @IsOptional()
  @IsString()
  inboundContainerNumber?: string;

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

  @ApiPropertyOptional({ description: "NGÀY GỬI CT — document sent date" })
  @IsOptional()
  @IsDateString()
  documentSentDate?: string;

  @ApiPropertyOptional({ description: "NỘI DUNG — trip description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  // ── Fixed cost slots ──────────────────────────────────────────

  @ApiPropertyOptional() @IsOptional() @IsString() phiNangName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() phiNangAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() shdNang?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() phiHaName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() phiHaAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() shdHa?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() phiVeSinhName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() phiVeSinhAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() shdVeSinh?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() phiCuocName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() phiCuocAmount?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() veCongName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() veCongAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() shdVeCong?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() chiPhiKhacName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() chiPhiKhacAmount?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() chiPhiTraiTuyenName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() chiPhiTraiTuyenAmount?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() cauDuongName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() cauDuongAmount?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() chiPhiPhatSinhName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() chiPhiPhatSinhAmount?: number;
}
