import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { VehicleType, VehicleStatus } from "@tms/shared";
import type { UpdateVehicleDto as IUpdateVehicleDto } from "@tms/shared";

export class UpdateVehicleDto implements IUpdateVehicleDto {
  @ApiPropertyOptional({ example: "50E-12208" })
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @ApiPropertyOptional({ enum: ["SHACMAN", "CHENGLONG", "HOWO", "FREIGHTLINER", "FAW", "OTHER"] })
  @IsOptional()
  @IsEnum(["SHACMAN", "CHENGLONG", "HOWO", "FREIGHTLINER", "FAW", "OTHER"])
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ enum: ["ACTIVE", "MAINTENANCE", "DECOMMISSIONED", "WAITING_DRIVER"] })
  @IsOptional()
  @IsEnum(["ACTIVE", "MAINTENANCE", "DECOMMISSIONED", "WAITING_DRIVER"])
  status?: VehicleStatus;

  @ApiPropertyOptional({ example: "2025-12-31" })
  @IsOptional()
  @IsDateString()
  inspectionExpiry?: string;

  @ApiPropertyOptional({ example: "2025-12-31" })
  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @ApiPropertyOptional({ example: "2025-12-31" })
  @IsOptional()
  @IsDateString()
  registrationExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
