import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { VehicleType } from "@tms/shared";
import type { CreateVehicleDto as ICreateVehicleDto } from "@tms/shared";

export class CreateVehicleDto implements ICreateVehicleDto {
  @ApiProperty({ example: "50E-12208" })
  @IsString()
  @IsNotEmpty()
  licensePlate!: string;

  @ApiProperty({ enum: ["SHACMAN", "CHENGLONG", "HOWO", "FREIGHTLINER", "FAW", "OTHER"] })
  @IsEnum(["SHACMAN", "CHENGLONG", "HOWO", "FREIGHTLINER", "FAW", "OTHER"])
  vehicleType!: VehicleType;

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
