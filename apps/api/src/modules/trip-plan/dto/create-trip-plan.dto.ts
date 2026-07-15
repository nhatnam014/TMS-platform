import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import type { CreateTripPlanDto as ICreateTripPlanDto, OtherCostItem } from "@tms/shared";

const TRIP_MODES = ["STANDARD", "DROP_AND_HOOK"] as const;

class OtherCostItemDto implements OtherCostItem {
  @ApiPropertyOptional() @IsOptional() @IsString() costName?: string;
  @ApiProperty() @IsNumber() @IsPositive() amount!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() invoiceNumber?: string;
}

export class CreateTripPlanDto implements ICreateTripPlanDto {
  @ApiProperty({ example: "2026-05-19" })
  @IsDateString()
  tripDate!: string;

  @ApiProperty({ example: "clxxx..." })
  @IsString()
  @IsNotEmpty()
  serviceTypeId!: string;

  @ApiPropertyOptional({ enum: TRIP_MODES, default: "STANDARD" })
  @IsOptional()
  @IsEnum(TRIP_MODES)
  tripMode?: (typeof TRIP_MODES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrierId?: string;

  @ApiPropertyOptional({ example: "clxxx...", description: "Container size ID" })
  @IsOptional()
  @IsString()
  containerSizeId?: string;

  @ApiPropertyOptional({ example: "OOLU8990993" })
  @IsOptional()
  @IsString()
  outboundContainerNumber?: string;

  @ApiPropertyOptional({ example: "OOLU8990993" })
  @IsOptional()
  @IsString()
  inboundContainerNumber?: string;

  @ApiPropertyOptional({ example: "Cảng Cát Lái" })
  @IsOptional()
  @IsString()
  pickupLocationName?: string;

  @ApiPropertyOptional({ example: "KCN Sóng Thần" })
  @IsOptional()
  @IsString()
  loadUnloadLocationName?: string;

  @ApiPropertyOptional({ example: "ICD Phước Long" })
  @IsOptional()
  @IsString()
  dropoffLocationName?: string;

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

  // ── Amount-only revenue/cost fields (no name/SHĐ companion) ─────

  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() luongAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() cuocAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() doanhThuAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() phuThuAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() chiPhiAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() tienDauAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() neoXeAmount?: number;

  // ── Other costs (multiple rows) ────────────────────────────────

  @ApiPropertyOptional({ type: [OtherCostItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtherCostItemDto)
  otherCosts?: OtherCostItemDto[];
}
