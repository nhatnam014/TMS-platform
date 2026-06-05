import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import type { AddTripPlanCostDto as IAddTripPlanCostDto } from "@tms/shared";

export class AddTripPlanCostDto implements IAddTripPlanCostDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tripCostId!: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ example: "INV-001" })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;
}
