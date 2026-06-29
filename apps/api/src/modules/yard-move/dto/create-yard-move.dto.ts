import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateYardMoveDto {
  @ApiProperty({ example: "24/06" })
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiPropertyOptional({ example: "AK" })
  @IsOptional()
  @IsString()
  gps?: string;

  @ApiPropertyOptional({ example: "PHAN VĂN TÍNH" })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: "60H21349" })
  @IsOptional()
  @IsString()
  truck?: string;

  @ApiPropertyOptional({ example: "60RM03615" })
  @IsOptional()
  @IsString()
  mooc?: string;

  @ApiPropertyOptional({ example: "SGN3247340" })
  @IsOptional()
  @IsString()
  booking?: string;

  @ApiPropertyOptional({ example: "TXGU6684130" })
  @IsOptional()
  @IsString()
  containerNumber?: string;

  @ApiPropertyOptional({ example: "XONG K3" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  daKeo?: string;
}
