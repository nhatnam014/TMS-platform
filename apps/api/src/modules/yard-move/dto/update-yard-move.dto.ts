import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import type { NoteItemDto } from "@tms/shared";

class NoteDto implements NoteItemDto {
  @ApiProperty({ example: "XONG K3" })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class UpdateYardMoveDto {
  @ApiPropertyOptional({ example: "2026-06-24" })
  @IsOptional()
  @IsDateString()
  date?: string;

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

  @ApiPropertyOptional({ type: [NoteDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoteDto)
  notes?: NoteDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  daKeo?: string;

  @ApiPropertyOptional({ description: "Set to false to soft-delete the yard move" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
