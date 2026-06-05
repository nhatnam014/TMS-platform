import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import type { CreateTripCostDto as ICreateTripCostDto } from "@tms/shared";

export class CreateTripCostDto implements ICreateTripCostDto {
  @ApiProperty({ example: "PHÍ NÂNG" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 1200000, description: "Default catalog price" })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;
}
