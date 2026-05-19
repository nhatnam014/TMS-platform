import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { YardCostType } from "@tms/db";

export class CreateYardMoveCostDto {
  @ApiProperty({ enum: YardCostType })
  @IsEnum(YardCostType)
  type!: YardCostType;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
