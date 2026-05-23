import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import type { CreateCarrierDto as ICreateCarrierDto } from "@tms/shared";

export class CreateCarrierDto implements ICreateCarrierDto {
  @ApiProperty({ example: "NHA_PHUONG" })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: "NHA PHUONG" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}
