import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import type { CreateCostTemplateDto as ICreateCostTemplateDto } from "@tms/shared";

export class CreateCostTemplateDto implements ICreateCostTemplateDto {
  @ApiProperty({ example: "PHÍ NÂNG" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultAmount?: number;
}
