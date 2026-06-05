import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsNotEmpty,
  ValidateIf,
} from "class-validator";
import type { UpdateTripCostDto as IUpdateTripCostDto } from "@tms/shared";

export class UpdateTripCostDto implements IUpdateTripCostDto {
  @ApiPropertyOptional({ example: "PHÍ HẠ" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1200000, description: "Default catalog price (null to clear)" })
  @IsOptional()
  @ValidateIf((o) => o.amount !== null)
  @IsNumber()
  @IsPositive()
  amount?: number | null;
}
