import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, ValidateIf } from "class-validator";
import { DriverStatus } from "@tms/shared";
import type { UpdateDriverDto as IUpdateDriverDto } from "@tms/shared";

export class UpdateDriverDto implements IUpdateDriverDto {
  @ApiPropertyOptional({ example: "Nguyễn Văn A" })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: "0901234567" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: ["ACTIVE", "ON_LEAVE", "TERMINATED"] })
  @IsOptional()
  @IsEnum(["ACTIVE", "ON_LEAVE", "TERMINATED"])
  status?: DriverStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ nullable: true, description: "Set to a vehicle id to assign, null to unassign" })
  @ValidateIf((o) => o.vehicleId !== null)
  @IsOptional()
  @IsString()
  vehicleId?: string | null;
}
